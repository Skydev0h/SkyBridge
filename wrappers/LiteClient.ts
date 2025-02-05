import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider, Dictionary,
    Sender,
    SendMode,
    TupleBuilder
} from '@ton/core';
import { globalIdResolve } from '../utils/utils';

export type LiteClientKeyBlockInfo = {
    seqNo: number;
    time: number;
    lt: bigint;
};

export type LiteClientSigningInfo = {
    validatorKeys: Cell;
    totalWeight: bigint;
};

export type LiteClientInitConfig = {
    globalId: number;
    nonce: number | bigint;
};

export type LiteClientConfigFull = {globalId: number} & LiteClientKeyBlockInfo & LiteClientSigningInfo;

export type MessageOpts = {
    queryID?: number;
    value: bigint;
};

export type NewKeyBlockOpts = {
    block: Cell;
    signatures: Cell;
};

export type CheckBlockOpts = NewKeyBlockOpts & {
    pedantic?: boolean;
};

export type CheckBlockExOpts = NewKeyBlockOpts & {
    pedantic: boolean;
    extra: Cell;
}

export type NewKeyBlockAndCheckBlockOpts = NewKeyBlockOpts & {
    keyBlock: Cell;
    keySignatures: Cell;
    pedantic?: boolean;
};

export function liteClientConfigToCell(config: LiteClientInitConfig | LiteClientConfigFull): Cell {
    if ('nonce' in config) {
        config = {
            seqNo: 0,
            time: 0,
            lt: typeof config.nonce === 'bigint' ? config.nonce : BigInt(config.nonce),
            globalId: config.globalId,
            validatorKeys: new Cell(),
            totalWeight: BigInt(0),
        };
    }
    return beginCell().storeUint(config.seqNo, 32).storeUint(config.time, 32).storeUint(config.lt, 64)
        .storeInt(config.globalId, 32).storeRef(config.validatorKeys).storeUint(config.totalWeight, 64).endCell()
}

export function validatorKeysToStringArr(vk: Cell, extended: boolean): string[] {
    if (vk.bits.length == 0 && vk.refs.length == 0) {
        return ['<EMPTY>'];
    }
    const dict = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64), vk);
    const result = [];
    let i = extended ? -dict.size : 0;
    for (let [key, value] of dict) {
        result.push(`${key.toString()}: ${value.toString()}`);
        if (++i >= 5) {
            result.push(`< ${dict.size - i} more entries hidden >`);
            break;
        }
    }
    return result;
}

export function validatorKeysTotalWeight(vk: Cell): bigint {
    if (vk.bits.length == 0 && vk.refs.length == 0) {
        return BigInt(0);
    }
    const dict = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64), vk);
    let result = BigInt(0);
    for (let [, value] of dict) {
        result += value;
    }
    return result;
}

export function printLiteClientConfigFull(config: LiteClientConfigFull, extended: boolean = false) {
    console.log(
        `Global ID: ${config.globalId} (${globalIdResolve(config.globalId)})\n` +
        `Key block info:\n` +
        `    Seq no: ${config.seqNo}\n` +
        `    Time: ${config.time}\n` +
        `    LT: ${config.lt.toString()}\n` +
        `Signing info:\n` +
        `    Validator public keys and weights:\n${validatorKeysToStringArr(config.validatorKeys, extended)
            .map((line) => `        ${line}`)
            .join('\n')}\n` +
        `    Total weight: ${config.totalWeight.toString()}\n` +
        `    Calculated total weight: ${validatorKeysTotalWeight(config.validatorKeys).toString()}`,
    );
}

export const Opcodes = {
    OP_NEW_KEY_BLOCK:     0x11a78ffe,
    OP_CHECK_BLOCK:       0x8eaa9d76,
    OP_CHECK_BLOCK_EX: 0x8eaa9111,
    OP_NEW_KEY_AND_CHECK: 0x11a79d76
};

export class LiteClient implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new LiteClient(address);
    }

    static createFromConfig(config: LiteClientInitConfig | LiteClientConfigFull, code: Cell, workchain = 0) {
        const data = liteClientConfigToCell(config);
        const init = { code, data };
        return new LiteClient(contractAddress(workchain, init), init);
    }

    async sendEmpty(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    // Recommended for deploy
    async sendNewKeyBlock(provider: ContractProvider, via: Sender, opts: MessageOpts & NewKeyBlockOpts
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.OP_NEW_KEY_BLOCK, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.block)
                .storeRef(opts.signatures)
                .endCell(),
        });
    }

    async sendCheckBlock(provider: ContractProvider, via: Sender, opts: MessageOpts & CheckBlockOpts) {
        const tail = beginCell();
        if (opts.pedantic === true) {
            tail.storeBit(true);
        }
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.OP_CHECK_BLOCK, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.block)
                .storeRef(opts.signatures)
                .storeBuilder(tail)
                .endCell(),
        });
    }

    async sendCheckBlockEx(provider: ContractProvider, via: Sender, opts: MessageOpts & CheckBlockExOpts) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.OP_CHECK_BLOCK_EX, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.block)
                .storeRef(opts.signatures)
                .storeRef(opts.extra)
                .storeBit(opts.pedantic)
                .endCell(),
        });
    }

    async sendNewKeyBlockAndCheckBlock(provider: ContractProvider, via: Sender, opts: MessageOpts & NewKeyBlockAndCheckBlockOpts) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.OP_NEW_KEY_AND_CHECK, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.block)
                .storeRef(opts.signatures)
                .storeRef(opts.keyBlock)
                .storeRef(opts.keySignatures)
                .storeBit(opts.pedantic ?? false)
                .endCell(),
        });
    }

    async getKeyBlockInfo(provider: ContractProvider): Promise<LiteClientKeyBlockInfo> {
        const result = await provider.get('getKeyBlockInfo', []);
        return {
            seqNo: result.stack.readNumber(),
            time: result.stack.readNumber(),
            lt: result.stack.readBigNumber()
        }
    }

    async getGlobalId(provider: ContractProvider): Promise<number> {
        const result = await provider.get('getGlobalId', []);
        return result.stack.readNumber();
    }

    async getSigningInfo(provider: ContractProvider): Promise<LiteClientSigningInfo> {
        const result = await provider.get('getSigningInfo', []);
        return {
            validatorKeys: result.stack.readCell(),
            totalWeight: result.stack.readBigNumber()
        }
    }

    async getFullConfig(provider: ContractProvider): Promise<LiteClientConfigFull> {
        const keyBlockInfo = await this.getKeyBlockInfo(provider);
        const globalId = await this.getGlobalId(provider);
        const signingInfo = await this.getSigningInfo(provider);
        return {
            globalId,
            ...keyBlockInfo,
            ...signingInfo
        }
    }

    async getTestNewKeyBlock(provider: ContractProvider, opts: NewKeyBlockOpts): Promise<bigint> {
        const tb = new TupleBuilder();
        tb.writeCell(opts.block);
        tb.writeCell(opts.signatures);
        const result = await provider.get('testNewKeyBlock', tb.build());
        return result.stack.readBigNumber();
    }

    async getTestCheckBlock(provider: ContractProvider, opts: CheckBlockOpts): Promise<bigint> {
        const tb = new TupleBuilder();
        tb.writeCell(opts.block);
        tb.writeCell(opts.signatures);
        tb.writeBoolean(opts.pedantic ?? false);
        const result = await provider.get('testCheckBlock', tb.build());
        return result.stack.readBigNumber();
    }

    async getTestNewKeyBlockAndCheckBlock(provider: ContractProvider, opts: NewKeyBlockAndCheckBlockOpts): Promise<bigint> {
        const tb = new TupleBuilder();
        tb.writeCell(opts.block);
        tb.writeCell(opts.signatures);
        tb.writeCell(opts.keyBlock);
        tb.writeCell(opts.keySignatures);
        tb.writeBoolean(opts.pedantic ?? false);
        const result = await provider.get('testCombination', tb.build());
        return result.stack.readBigNumber();
    }

    async getAndPrintFullConfig(provider: ContractProvider, extended: boolean = false) {
        const config = await this.getFullConfig(provider);
        printLiteClientConfigFull(config, extended);
    }

}
