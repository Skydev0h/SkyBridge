import { NetworkProvider, UIProvider } from '@ton/blueprint';
import parseArgs, { ParsedArgs } from 'minimist';
import { BlueprintTonClient } from '@ton/blueprint/dist/network/NetworkProvider';
import { Address, ContractProvider, OpenedContract, Sender } from '@ton/core';
import { LiteClient, LiteEngine } from 'ton-lite-client';
import { LiteClient as LiteClientSC } from "../wrappers/LiteClient";
import { balancedTestnet } from './btc';
import { TransactionChecker } from '../wrappers/TransactionChecker';

// Got exhausted of passing around all those variables and want to prepare for being able to properly write Jest code

export let np: NetworkProvider;
export let ui: UIProvider;
export let args: ParsedArgs;
export let api: BlueprintTonClient;
export let snd: Sender;
export let ismc: boolean;
export let myaddr: Address | undefined;

export let lc: LiteClient;
export let le: LiteEngine;

export let lcsc: OpenedContract<LiteClientSC>;
export let lcaddr: Address;
export let lccp: ContractProvider;

export let tcsc: OpenedContract<TransactionChecker>;
export let tcaddr: Address;
export let tccp: ContractProvider;

export function configure(np_: NetworkProvider, ui_: UIProvider, args_: string[]) {
    np = np_;
    ui = ui_;
    if (np_.network() == "testnet") {
        api = balancedTestnet(); // should solve problems with 429 that happened sometimes
    } else {
        api = np.api();
    }
    snd = np.sender();
    args = parseArgs(args_);
    myaddr = snd.address;
    ismc = (myaddr?.workChain == -1);
}

export function registerLiteClient(lc_: LiteClient) {
    lc = lc_;
    le = lc_.engine
}

export function registerLiteClientSC(lcsc_: OpenedContract<LiteClientSC>) {
    lcsc = lcsc_;
    lcaddr = lcsc_.address;
    lccp = api.provider(lcaddr);
}

export function registerTransactionCheckerSC(tcsc_: OpenedContract<TransactionChecker>) {
    tcsc = tcsc_;
    tcaddr = tcsc_.address;
    tccp = api.provider(tcaddr);
}