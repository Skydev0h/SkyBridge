import { NetworkProvider, sleep, UIProvider } from '@ton/blueprint';
import { BlueprintTonClient } from '@ton/blueprint/dist/network/NetworkProvider';
import { Sender, Address, Cell, ContractProvider, Contract, OpenedContract } from '@ton/core';
import { Blockchain } from '@ton/sandbox';
import { ContractAdapter } from "@ton-api/ton-adapter";

export class Mockingjay implements NetworkProvider {
    readonly #bcwrap: SandboxWrapper;
    #sender: Sender | null = null;

    constructor(private bc: Blockchain, private ui_: HeadlessUI) {
        this.#bcwrap = new SandboxWrapper(bc);
    }

    network(): 'mainnet' | 'testnet' | 'custom' {
        return 'custom'; // better suited since we are using testnet for tests as counterparty network
    }

    public setSender(sender: Sender) {
        this.#sender = sender;
    }

    sender(): Sender {
        return this.#sender!;
    }

    api(): BlueprintTonClient {
        return this.#bcwrap;
    }

    provider(address: Address, init?: { code?: Cell; data?: Cell }): ContractProvider {
        return this.bc.provider(address, init);
    }

    async isContractDeployed(address: Address): Promise<boolean> {
        return (await this.bc.provider(address).getState()).state.type != 'uninit';
    }

    async waitForDeploy(address: Address, attempts: number = 20, sleepDuration: number = 2000): Promise<void> {
        if (attempts <= 0) {
            throw new Error('Attempt number must be positive');
        }

        for (let i = 1; i <= attempts; i++) {
            const isDeployed = await this.isContractDeployed(address);
            if (isDeployed) {
                return;
            }
            await sleep(sleepDuration);
        }

        throw new Error("Contract was not deployed. Check your wallet's transactions");
    }

    async deploy(contract: Contract, value: bigint, body?: Cell, waitAttempts: number = 10): Promise<void> {
        const isDeployed = await this.isContractDeployed(contract.address);
        if (isDeployed) {
            throw new Error('Contract is already deployed!');
        }

        if (!contract.init) {
            throw new Error('Contract has no init!');
        }

        await this.#sender!.send({
            to: contract.address,
            value,
            body,
            init: contract.init,
        });

        if (waitAttempts <= 0) return;

        await this.waitForDeploy(contract.address, waitAttempts);
    }

    open<T extends Contract>(contract: T): OpenedContract<T> {
        return this.bc.openContract(contract) as any;
        // ^ hey, it's the same, check sandbox code!
    }

    ui(): UIProvider {
        return this.ui_;
    }

}

class SandboxWrapper extends ContractAdapter {
    constructor(private bc: Blockchain) {
        super(null as any); // get over it
    }
    open<T extends Contract>(contract: T): OpenedContract<T> {
        return this.bc.openContract(contract) as any;

    }
    provider(address: Address, init?: { code?: Cell; data?: Cell } | null): ContractProvider {
        return this.bc.provider(address, init);
    }
}

export class HeadlessUI implements UIProvider {

    public readonly inputResponses: Map<string, string> = new Map();
    public readonly promptResponses: Map<string, boolean> = new Map();
    public readonly addressResponses: Map<string, Address> = new Map();
    public readonly choiceResponses: Map<string, string> = new Map();

    #showMsg = false;
    #showAP = false;

    public reset() {
        this.inputResponses.clear();
        this.promptResponses.clear();
        this.addressResponses.clear();
        this.choiceResponses.clear();
    }

    public register(message: string, response: string | boolean | Address): void {
        switch (typeof response) {
            case 'string':
                this.inputResponses.set(message, response);
                break;
            case 'boolean':
                this.promptResponses.set(message, response);
                break;
            case 'object':
                this.addressResponses.set(message, response);
                break;
            default:
                throw new Error(`Unknown response type: ${typeof response} for message: ${message}`);
        }
    }

    public setShowMsg(show: boolean) {
        this.#showMsg = show;
    }

    public setShowAP(show: boolean) {
        this.#showAP = show;
    }

    write(message: string): void {
        if (this.#showMsg) {
            console.log(message);
        }
    }

    async prompt(message: string): Promise<boolean> {
        if (this.promptResponses.has(message)) {
            return this.promptResponses.get(message)!;
        }
        throw new Error(`Unknown prompt request: ${message}`);
    }

    async inputAddress(message: string, fallback?: Address): Promise<Address> {
        if (this.addressResponses.has(message)) {
            return this.addressResponses.get(message)!;
        }
        throw new Error(`Unknown address request: ${message}.`);
    }

    async input(message: string): Promise<string> {
        if (this.inputResponses.has(message)) {
            return this.inputResponses.get(message)!;
        }
        throw new Error(`Unknown input request: ${message}.`);
    }

    async choose<T>(message: string, choices: T[], display: (v: T) => string): Promise<T> {
        if (this.choiceResponses.has(message)) {
            const r = this.choiceResponses.get(message)!;
            for (let c of choices) {
                if (display(c) == r) {
                    return c;
                }
            }
            for (let c of choices) {
                if (c && typeof c.toString === 'function' && c.toString() == r) {
                    return c;
                }
            }
        }
        throw new Error(`Unknown choice request ${message} (options: ${
            choices.map(it => it + ':' + display(it)).join(', ')}).`);
    }

    setActionPrompt(message: string): void {
        if (this.#showAP) {
            console.log(`UI AP = ${message}`);
        }
    }

    clearActionPrompt(): void {
        if (this.#showAP) {
            console.log(`UI AP cleared`);
        }
    }

}