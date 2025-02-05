import { prepareBlockSignatures, prepareKeyBlockData, startUpLC } from './high_level';
import { catWalkStepsKB, getParsedBlock } from './raw_lc';
import { SandboxContract } from '@ton/sandbox';
import { LiteClient } from '../wrappers/LiteClient';
import { BlockID } from 'ton-lite-client';

var gid = 0;

export function setSandboxGid(newGid: number) {
    gid = newGid;
}

export async function getKeyBlock(stepBack: number = 0, needSigs: boolean = true) {
    let { lastBlockId, lastBlockHdr } = await startUpLC(gid);
    const wantedBlock = await catWalkStepsKB(lastBlockHdr.info.prev_key_block_seqno, stepBack);
    const { keyBlockId, blockProof, blockHash, vsethash } = await prepareKeyBlockData(wantedBlock);
    const signatures = await prepareBlockSignatures(keyBlockId, needSigs);
    const keyBlockInfo = await getParsedBlock(keyBlockId);
    return { lastBlockId, lastBlockHdr, wantedBlock, keyBlockId, blockProof, blockHash, signatures, keyBlockInfo, vsethash };
}

export async function testMatchConfig(sc: SandboxContract<LiteClient>, keyBlockId: BlockID, keyBlockInfo: any) {
    const cfg = await sc.getFullConfig();
    expect(cfg).toMatchObject({
        globalId: gid, seqNo: keyBlockId.seqno,
        lt: BigInt(keyBlockInfo.info.start_lt), time: keyBlockInfo.info.gen_utime
    });
    expect(cfg.totalWeight).toBeGreaterThan(0n);
    expect(cfg.validatorKeys.refs.length).toBeGreaterThan(0);
}

export async function getStepBackForPedanticTest() {
    let { vsethash: hash } = await getKeyBlock(0, false);
    let stepBack = 1;
    while (true) {
        let { vsethash: newhash } = await getKeyBlock(stepBack, false);
        if (hash.equals(newhash)) {
            // vset was not changed at stepBack - 1, can use stepBack
            return stepBack;
        }
        stepBack++;
        hash = newhash;
        if (stepBack > 10) {
            throw new Error('Something strange, cannot find sequential keyblocks without changing vsets');
        }
    }
}