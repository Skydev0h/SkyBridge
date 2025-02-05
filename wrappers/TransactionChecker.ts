import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode, TupleBuilder
} from '@ton/core';

export type TransactionCheckerConfig = {
    liteClientAddress?: Address;
    nonce?: number | null;
};

export type MessageOpts = {
    // queryID?: number; // strangely, NO queryID in this contract!
    value: bigint;
};

export type TransactionCheckOpts = MessageOpts & {
    transaction: Cell;
    transactionProof: Cell;
    transactionProofHints: number[]; // 0 - 3
    masterChainBlock?: Cell;
    mcBlockSignatures?: Cell;
    shardProof?: Cell;
    pedantic?: boolean;
    shardProofHints?: number[]; // 0 - 3
};

// Compatible with CheckBlockOpts in LiteClient.ts ... if block and signatures are ensured not to be null
export type LC_CheckBlockOpts = {
    block: Cell | null;
    signatures: Cell | null;
    pedantic: boolean;
}

export function transactionCheckerConfigToCell(c: TransactionCheckerConfig): Cell {
    const extraNonce = c.nonce ?? null;
    return beginCell().storeAddress(c.liteClientAddress)
        .storeWritable(b => {
            if (extraNonce !== null) {
                const bitsRequired = Math.ceil(Math.log2(extraNonce + 1)); // Calculate the minimum bits required to store extraNonce
                b.storeUint(extraNonce, bitsRequired); // Store extraNonce using minimal bits
            }
        }).endCell();
}

export const Opcodes = {
    OP_CHECK_TRANSACTION: 0x91d555f7,
};

export class TransactionChecker implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new TransactionChecker(address);
    }

    static createFromConfig(config: TransactionCheckerConfig, code: Cell, workchain = 0) {
        const data = transactionCheckerConfigToCell(config);
        const init = { code, data };
        return new TransactionChecker(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(), // no special logic is recommended, unlike in LC
        });
    }

    #packTransactionProof(opts: TransactionCheckOpts) {
        return beginCell()
            .storeRef(opts.transactionProof)
            .storeWritable(b => { for (let h of opts.transactionProofHints) b.storeUint(h, 2);})
            .endCell()
    }

    #packCurrentBlock(opts: TransactionCheckOpts) {
        return beginCell()
            .storeMaybeRef(opts.masterChainBlock)
            .storeMaybeRef(opts.mcBlockSignatures)
            .storeMaybeRef(opts.shardProof)
            .storeBit(opts.pedantic ?? false)
            .storeWritable(b => { for (let h of opts.shardProofHints ?? []) b.storeUint(h, 2);})
            .endCell();
    }

    async sendCheckTransaction(provider: ContractProvider, via: Sender, opts: MessageOpts & TransactionCheckOpts) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.OP_CHECK_TRANSACTION, 32)
                .storeRef(opts.transaction)
                .storeRef(this.#packTransactionProof(opts))
                .storeRef(this.#packCurrentBlock(opts))
                .endCell(),
        });
    }

    async getContractExtraNonce(provider: ContractProvider) {
        const result = await provider.get('getContractExtraNonce', []);
        return result.stack.readCell();
    }

    async getLiteClientAddress(provider: ContractProvider) {
        const result = await provider.get('getLiteClientAddress', []);
        return result.stack.readAddressOpt();
    }

    async getTestLocalCheckTransaction(provider: ContractProvider, opts: TransactionCheckOpts): Promise<LC_CheckBlockOpts> {
        const tb = new TupleBuilder();
        tb.writeCell(opts.transaction);
        tb.writeCell(this.#packTransactionProof(opts));
        tb.writeCell(this.#packCurrentBlock(opts));
        const result = await provider.get('testLocalCheckTransaction', tb.build());
        return {
            block: result.stack.readCellOpt(),
            signatures: result.stack.readCellOpt(),
            pedantic: result.stack.readBoolean()
        }
    }

    async getAndPrintContractState(provider: ContractProvider) {
        const extraNonce = await this.getContractExtraNonce(provider);
        const liteClientAddress = await this.getLiteClientAddress(provider);
        let repr = "None";
        let cs = extraNonce.beginParse();
        if (cs.remainingBits <= 64 && cs.remainingBits > 0) {
            repr = cs.loadUint(cs.remainingBits).toString();
        } else if (cs.remainingBits > 0) {
            repr = cs.toString();
        }
        console.log(
            `Extra nonce: ${repr}\n` +
            ` LiteClient: ${liteClientAddress ?? "None"}`
        );
    }
}
