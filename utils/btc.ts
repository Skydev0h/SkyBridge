// noinspection JSDeprecatedSymbols

import { TonClient } from '@ton/ton';
import { TonClientParameters } from '@ton/ton/dist/client/TonClient';
import {
    Address,
    Cell,
    Contract, ContractProvider,
    Message,
    OpenedContract,
    StateInit,
    Transaction,
    TupleItem,
    TupleReader
} from '@ton/core';
import axios, { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { sleep } from '@ton/blueprint';

export class BalancingTonClient extends TonClient {

    private c: TonClient[] = [];

    constructor(parameters: TonClientParameters, keys: string[]) {
        super(parameters);
        for (const key of keys) {
            this.c.push(new TonClient({ ...parameters, apiKey: key }));
        }
    }

    private C(): TonClient {
        return this.c[Math.floor(Math.random() * this.c.length)];
    }

    getBalance(address: Address): Promise<bigint> {
        return this.C().getBalance(address);
    }

    runMethod(address: Address, name: string, stack?: TupleItem[]): Promise<{
        gas_used: number;
        stack: TupleReader;
    }> {
        return this.C().runMethod(address, name, stack);
    }

    callGetMethod(address: Address, name: string, stack?: TupleItem[]): Promise<{
        gas_used: number;
        stack: TupleReader;
    }> {
        return this.C().callGetMethod(address, name, stack);
    }

    runMethodWithError(address: Address, name: string, params?: any[]): Promise<{
        gas_used: number;
        stack: TupleReader;
        exit_code: number;
    }> {
        return this.C().runMethodWithError(address, name, params);
    }

    callGetMethodWithError(address: Address, name: string, stack?: TupleItem[]): Promise<{
        gas_used: number;
        stack: TupleReader;
    }> {
        return this.C().callGetMethodWithError(address, name, stack);
    }

    getTransactions(address: Address, opts: {
        limit: number;
        lt?: string;
        hash?: string;
        to_lt?: string;
        inclusive?: boolean;
        archival?: boolean;
    }): Promise<Transaction[]> {
        return this.C().getTransactions(address, opts);
    }

    getTransaction(address: Address, lt: string, hash: string): Promise<Transaction | null> {
        return this.C().getTransaction(address, lt, hash);
    }

    tryLocateResultTx(source: Address, destination: Address, created_lt: string): Promise<Transaction> {
        return this.C().tryLocateResultTx(source, destination, created_lt);
    }

    tryLocateSourceTx(source: Address, destination: Address, created_lt: string): Promise<Transaction> {
        return this.C().tryLocateSourceTx(source, destination, created_lt);
    }

    getMasterchainInfo(): Promise<{
        workchain: number;
        shard: string;
        initSeqno: number;
        latestSeqno: number;
    }> {
        return this.C().getMasterchainInfo();
    }

    getWorkchainShards(seqno: number): Promise<{
        workchain: number;
        shard: string;
        seqno: number;
    }[]> {
        return this.C().getWorkchainShards(seqno);
    }

    getShardTransactions(workchain: number, seqno: number, shard: string): Promise<{
        account: Address;
        lt: string;
        hash: string;
    }[]> {
        return this.C().getShardTransactions(workchain, seqno, shard);
    }

    sendMessage(src: Message): Promise<void> {
        return this.C().sendMessage(src);
    }

    sendFile(src: Buffer): Promise<void> {
        return this.C().sendFile(src);
    }

    estimateExternalMessageFee(address: Address, args: {
        body: Cell;
        initCode: Cell | null;
        initData: Cell | null;
        ignoreSignature: boolean;
    }): Promise<{
        '@type': "query.fees";
        source_fees: {
            '@type': "fees";
            in_fwd_fee: number;
            storage_fee: number;
            gas_fee: number;
            fwd_fee: number;
        };
    }> {
        return this.C().estimateExternalMessageFee(address, args);
    }

    sendExternalMessage(contract: Contract, src: Cell): Promise<void> {
        return this.C().sendExternalMessage(contract, src);
    }

    isContractDeployed(address: Address): Promise<boolean> {
        return this.C().isContractDeployed(address);
    }

    getContractState(address: Address): Promise<{
        balance: bigint;
        state: "active" | "uninitialized" | "frozen";
        code: Buffer | null;
        data: Buffer | null;
        lastTransaction: {
            lt: string;
            hash: string;
        } | null;
        blockId: {
            workchain: number;
            shard: string;
            seqno: number;
        };
        timestampt: number;
    }> {
        return this.C().getContractState(address);
    }

    open<T extends Contract>(src: T): OpenedContract<T> {
        return this.C().open(src);
    }

    provider(address: Address, init?: StateInit | null): ContractProvider {
        return this.C().provider(address, init);
    }

}

const INITIAL_DELAY = 400;
const MAX_ATTEMPTS = 4;

export function balancedTestnet() {
    const keys = [
        // TODO: burn them with fire after the contest ends
        '121e7395599de1a66105feafc8a8c1496e787ceb8ea9be31b22eb995abd9bed9',
        'c8b88ddf0287c1bf6d3aaef2b6b5ca43395001be7e5912ca6bc52e7e68e23932',
        '1f32285039ff82f5ca38883d539859ddda9c2a521c1ffffd31c58156153b7497'
    ];
    const httpAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
        let r: AxiosResponse;
        let delay = INITIAL_DELAY;
        let attempts = 0;
        while (true) {
            r = await axios({
                ...config,
                adapter: undefined,
                validateStatus: (status: number) => (status >= 200 && status < 300) || status === 429,
            });
            if (r.status !== 429) {
                return r;
            }
            await sleep(delay);
            delay *= 2;
            attempts++;
            if (attempts >= MAX_ATTEMPTS) {
                throw new Error('Max attempts reached');
            }
        }
    };
    return new BalancingTonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        httpAdapter: httpAdapter,
    }, keys);
}