import { BlockID, LiteClient, LiteRoundRobinEngine, LiteSingleEngine } from 'ton-lite-client';
import TonRocks from '@oraichain/tonbridge-utils';
import axios from 'axios';
import {
    Functions,
    liteServer_blockData,
    liteServer_blockHeader,
    liteServer_Signature, tonNode_blockIdExt
} from 'ton-lite-client/dist/schema';
import { loadShardStateUnsplit, parseValidatorSet } from '@ton/ton';
import { beginCell, Cell, Dictionary } from '@ton/core';
import { bufferToBigInt, retry } from './utils';
import { sha256 } from '@ton/crypto';
import { lc, registerLiteClient } from './_superglobals';

export const MC_Shard = '-9223372036854775808';

const engines: LiteSingleEngine[] = [];
let mylc: LiteClient | null = null;

export async function makeRawLC(globalConfigUrl: string) {
    const { data: globalConfig } = await retry(() => axios.get(globalConfigUrl));
    const res = new LiteClient({
        engine: new LiteRoundRobinEngine(
            globalConfig.liteservers.map(
                (server: any) => {
                    const eng = new LiteSingleEngine({
                        host: `tcp://${intToIP(server.ip)}:${server.port}`,
                        publicKey: Buffer.from(server.id.key, 'base64'),
                    });
                    engines.push(eng);
                    return eng;
                },
            ),
        ),
    });
    registerLiteClient(res);
    return res;
}

export function stopLCs() {
    if (mylc != null) {
        mylc.engine.close();
    }
    for (let eng of engines) {
        eng.close();
    }
}

export function intToIP(int: number) {
    const part1 = int & 255;
    const part2 = (int >> 8) & 255;
    const part3 = (int >> 16) & 255;
    const part4 = (int >> 24) & 255;

    return part4 + '.' + part3 + '.' + part2 + '.' + part1;
}

export async function getLastMasterBlockId() {
    return (await lc.getMasterchainInfo()).last;
}

export async function getMCBlockId(seqno: number) {
    return (
        await lc.lookupBlockByID({
            seqno: seqno,
            shard: MC_Shard,
            workchain: -1,
        })
    ).id;
}

export async function getWCBlockId(seqno: number, shard: string) {
    return (
        await lc.lookupBlockByID({
            seqno: seqno,
            shard: shard,
            workchain: 0,
        })
    ).id;
}

export async function getBlock(id: BlockID) {
    return await lc.engine.query(Functions.liteServer_getBlock, {
        kind: 'liteServer.getBlock',
        id: {
            kind: 'tonNode.blockIdExt',
            ...id,
        },
    });
}

export async function parseBlock(block: liteServer_blockData | liteServer_blockHeader) {
    return TonRocks.bc.BlockParser.parseBlock(
        block.kind == 'liteServer.blockData'
            ? (await TonRocks.types.Cell.fromBoc(block.data))[0]
            : (await TonRocks.types.Cell.fromBoc(block.headerProof))[0].refs[0], // MerkleProof -> Root (Block)
    );
}

export async function getParsedBlock(id: BlockID) {
    return parseBlock(await getBlock(id));
}

export async function getParsedBlockHeader(id: BlockID) {
    return parseBlock(await lc.getBlockHeader(id));
}

export async function getBlockBySeqno(seqno: number) {
    return getBlock(await getMCBlockId(seqno));
}

export async function getParsedBlockBySeqno(seqno: number) {
    return getParsedBlock(await getMCBlockId(seqno));
}

export async function getParsedBlockHeaderBySeqno(seqno: number) {
    return getParsedBlockHeader(await getMCBlockId(seqno));
}

// meow
export async function catWalkKeyBlocks(start: number, prevTarget: number, strict: boolean = true) {
    let i = start;
    while (true) {
        const block = await getParsedBlockHeaderBySeqno(i); // header proof is enough!
        if (strict ? (block.info.prev_key_block_seqno == prevTarget) : (block.info.prev_key_block_seqno <= prevTarget)) {
            return block.info.seq_no;
        }
        i = block.info.prev_key_block_seqno;
        if (i < prevTarget) {
            return 0;
        }
    }
}

export async function catWalkStepsKB(start: number, steps: number) {
    let s = start;
    for (let i = 0; i < steps; i++) {
        const block = await getParsedBlockHeaderBySeqno(s);
        s = block.info.prev_key_block_seqno;
    }
    return s;
}

export async function getBlockSignatures(id: BlockID) {
    // ref: tonlib\tonlib\TonlibClient.cpp:1488 upto ... 1628
    // just calling TON API v2 would be much easier, but we are already working with lite client
    // don't want to add extra dependency and configuration just because the logic is complex
    const prevId = await getMCBlockId(id.seqno - 1);
    const proof = await lc.engine.query(Functions.liteServer_getBlockProof, {
        kind: 'liteServer.getBlockProof',
        mode: 0x1001, // what this means? ... ref: tonlib\tonlib\TonlibClient.cpp:1535
        knownBlock: prevId,
        targetBlock: {
            kind: 'tonNode.blockIdExt',
            ...id,
        },
    });
    const forwardLink = proof.steps.filter((step) => step.kind == 'liteServer.blockLinkForward')[0];
    return forwardLink.signatures.signatures;
    // But that's still not all... Who invented this???
}

export async function getBlockStateValidators(id: BlockID) {
    // Need to get current p34 on block "id"
    const p34res = await lc.engine.query(Functions.liteServer_getConfigParams, {
        kind: 'liteServer.getConfigParams',
        id: id, // MUST get from previous MC block, or it will break on p34 changes!
        mode: 0x10000,
        paramList: [34]
    });
    const shardStateProof = Cell.fromBoc(p34res.configProof)[0].refs[0]; // open MerkleProof
    // Here we can use convenience functions, because we need values, not the cells themselves
    const shardState = loadShardStateUnsplit(shardStateProof.asSlice());
    const p34 = shardState.extras?.config!.get(34)!;
    const vset = parseValidatorSet(p34.asSlice())!;
    const pkMap = new Map<string, bigint>();
    const nodeIdPrefix = Buffer.from([0xc6, 0xb4, 0x13, 0x48]);
    for (let [, v] of vset.list) {
        const nodeId = await sha256(Buffer.concat([nodeIdPrefix, v.publicKey]));
        pkMap.set(nodeId.toString('hex'), bufferToBigInt(v.publicKey));
    }
    return pkMap;
}

export async function rewrapSignatureSet(signatures: liteServer_Signature[], id: BlockID) {
    const result = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Buffer(64));
    const prevId = await getMCBlockId(id.seqno - 1);
    // build pkMap from current and previous block to be ready for any situations possible
    const pkMapCurr = await getBlockStateValidators(id);
    const pkMapPrev = await getBlockStateValidators(prevId);
    const pkMap = new Map([...pkMapCurr, ...pkMapPrev]);
    for (let sig of signatures) {
        if (!pkMap.has(sig.nodeIdShort.toString('hex'))) {
            console.log('FATAL: Cannot find public key for Node ID ', sig.nodeIdShort.toString('hex'), '');
            console.log(pkMap);
            process.exit(111);
        }
        result.set(pkMap.get(sig.nodeIdShort.toString('hex'))!, sig.signature);
    }
    // console.log(result);
    const builder = beginCell();
    // It is possible to supply fileHash (needed for signature) and rootHash externally because well, hash is 256-bits,
    // really, it would be not possible to create a collision, even if we can manipulate 256 bits of data in preimage
    // result.set(BigInt(0), Buffer.concat([id.fileHash, id.rootHash]));
    // And logically speaking, since "signatures" format is at our own discretion, I can put that missing piece here
    // ton.blockId root_cell_hash:int256 file_hash:int256 = ton.BlockId;
    builder.storeUint(0x706E0BC5, 32).storeBuffer(id.rootHash).storeBuffer(id.fileHash);
    builder.storeRef(beginCell().storeDictDirect(result).endCell()); // do not emit extra presence bit
    return builder.endCell();
}

export async function getShardProof(id: tonNode_blockIdExt) {
    return await lc.engine.query(Functions.liteServer_getShardBlockProof, {
        kind: 'liteServer.getShardBlockProof',
        id: id
    });
}