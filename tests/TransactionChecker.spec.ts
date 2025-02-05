import { jsonCrutch } from '../utils/json-crutch';
import { Address, beginCell, Cell, Sender, toNano } from '@ton/core';
import { compile } from '@ton/blueprint';
import { Blockchain, BlockchainSnapshot, SandboxContract, SendMessageResult, TreasuryContract } from '@ton/sandbox';
import { HeadlessUI, Mockingjay } from '../utils/mockingjay';
import { init, prepareBlockSignatures, prepareMCBlockData, startUpLC } from '../utils/high_level';
import { LiteClient as TLiteClient } from 'ton-lite-client';
import { getOtherRawLC } from '../utils/cli';
import { getParsedBlock, stopLCs } from '../utils/raw_lc';
import { LiteClient } from '../wrappers/LiteClient';
import '@ton/test-utils';
import { getKeyBlock, setSandboxGid, testMatchConfig } from '../utils/sandbox';
import { registerLiteClientSC } from '../utils/_superglobals';
import { TransactionChecker } from '../wrappers/TransactionChecker';
import { makeTransactionProof, obtainTransaction } from '../utils/transaction';
import { prepareNavigationHints } from '../utils/hints';
import { tonNode_blockIdExt } from 'ton-lite-client/dist/schema';
import { prepareShardProof } from '../utils/shard';
import { RE_CORRECT_EX, RE_INCORRECT_EX, RE_TRANS_FAILED_CHECK, RE_TRANSACTION_CHECKED } from '../utils/opcodes';
import { errors } from '../utils/errors';

type LocalTxData = {
    tx: Cell;
    blockId: tonNode_blockIdExt;
    proof: Cell;
    hints: number[];
    blockProof?: Cell;
    blockSignatures?: Cell;
    blockHash?: Buffer;
    shardProof?: Cell;
    shardProofHints?: number[];
};

enum has { // very semantic. very stupid.
    zeroTxHints,
    zeroShardHints,
    mcBlock,
    mcSignatures,
    noShardProof,
    noShardHints,
    pedantic,
    notPedantic,
    corruptTxHints,
    corruptShardHints,
    corruptMcSigValue,
    replaceMcBlock,
    replaceTransaction
}

enum failedAt {
    TransChk,
    LiteCl,
}

const OK = -1;
const ANY_ERROR = -2;

jsonCrutch();

describe('TransactionChecker tests', () => {
    // #################################################################################################################
    // -----------------------------------------------------------------------------------------------------------------

    // const gid = -3; // testnet
    const gid = -239; // mainnet
    const callValue = toNano(1);

    setSandboxGid(gid);

    let lc_code: Cell;
    let code: Cell;
    let bc: Blockchain;
    let mkj: Mockingjay;
    let ui = new HeadlessUI();
    let me: SandboxContract<TreasuryContract>;
    let ms: Sender;
    let lc: TLiteClient;
    let snap: BlockchainSnapshot;
    let lcsc: SandboxContract<LiteClient>;
    let kconf: any = {};
    let simp: SandboxContract<TransactionChecker>;
    let wilc: SandboxContract<TransactionChecker>;
    let mctx: LocalTxData, sctx: LocalTxData;
    let simpa: Address;
    let wilca: Address;
    let mead: Address;

    beforeAll(async () => {
        lc_code = await compile('LiteClient');
        code = await compile('TransactionChecker');
        bc = await Blockchain.create();
        mkj = new Mockingjay(bc, ui);
        me = await bc.treasury('me');
        ms = me.getSender();
        mead = me.address;
        mkj.setSender(ms);
        init(mkj, [], 'Tests');
        lc = await getOtherRawLC(gid); // testnet
        // ^ this causes jest not to not exit
        kconf = await deployLCWithKeyblock();
        simp = await deploySimple();
        wilc = await deployLinked();
        mctx = await getAnyLastMCBlockTx(true);
        sctx = await getAnyLastSCBlockTx(true);
        simpa = simp.address;
        wilca = wilc.address;
        snap = bc.snapshot();
        // console.log('Warning! Stability of tests depends on stability of testnet liteservers!')
    });

    beforeEach(async () => {
        await bc.loadFrom(snap);
        // registerTransactionCheckerSC(sc as any); // assume linked by default, re-register if necessary
    });

    afterAll(async () => {
        stopLCs(); // closing engines does not help. have to use --forceExit
    });

    // -----------------------------------------------------------------------------------------------------------------
    // #################################################################################################################
    // -----------------------------------------------------------------------------------------------------------------

    it('prerequisite: check deployed LC with latest keyblock config', async () => {
        await testMatchConfig(lcsc, kconf.keyBlockId, kconf.keyBlockInfo);
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('deploy: check simple TC config', async () => {
        const xnonce = await simp.getContractExtraNonce();
        const lcaddr = await simp.getLiteClientAddress();
        expect(xnonce.beginParse().preloadUint(xnonce.bits.length)).toBe(888);
        expect(lcaddr).toBeNull();
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('deploy: check withlc TC config', async () => {
        const xnonce = await wilc.getContractExtraNonce();
        const lcaddr = await wilc.getLiteClientAddress();
        expect(xnonce.beginParse().preloadUint(xnonce.bits.length)).toBe(888);
        expect(lcaddr?.toString()).toBe(lcsc.address.toString());
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('simple positive: accept MC transaction proof without block and signatures', async () => {
        await testmc(simp, [], OK);
    });

    it('simple positive: accept MC transaction proof without signatures', async () => {
        await testmc(simp, [has.mcBlock], OK);
    });

    it('simple negative: REJECT MC transaction proof without signatures PEDANTIC', async () => {
        await testmc(simp, [has.mcBlock, has.pedantic], errors.ERR_NO_LITE_CLIENT_SUPP);
    });

    it('simple negative: REJECT MC transaction proof WITH signatures', async () => {
        await testmc(simp, [has.mcBlock, has.mcSignatures], errors.ERR_NO_LITE_CLIENT_SUPP);
    });

    it('withlc positive: accept MC transaction proof with signatures (normal)', async () => {
        await testmc(wilc, [has.mcBlock, has.mcSignatures], OK);
    });

    it('withlc positive: accept MC transaction proof with signatures (pedantic)', async () => {
        await testmc(wilc, [has.mcBlock, has.mcSignatures, has.pedantic], OK);
    });

    it('withlc negative: REJECT MC transaction proof WITHOUT block and signatures (normal)', async () => {
        await testmc(wilc, [], errors.ERR_MISSING_BLOCK, failedAt.TransChk);
    });

    it('withlc negative: REJECT MC transaction proof WITHOUT signatures (normal)', async () => {
        await testmc(wilc, [has.mcBlock], errors.ERR_MISSING_SIGNATURES, failedAt.TransChk);
    });

    it('simple positive: accept BC (WC) transaction proof without signatures', async () => {
        await testsc(simp, [], OK);
    });

    it('simple negative: REJECT BC (WC) transaction proof without signatures PEDANTIC', async () => {
        await testsc(simp, [has.pedantic], errors.ERR_NO_LITE_CLIENT_SUPP);
    });

    it('simple negative: REJECT BC (WC) transaction proof WITH signatures', async () => {
        await testsc(simp, [has.mcBlock, has.mcSignatures], errors.ERR_NO_LITE_CLIENT_SUPP);
    });

    it('withlc positive: accept BC (WC) transaction proof with signatures (normal)', async () => {
        await testsc(wilc, [has.mcBlock, has.mcSignatures], OK);
    });

    it('withlc positive: accept BC (WC) transaction proof with signatures (pedantic)', async () => {
        await testsc(wilc, [has.mcBlock, has.mcSignatures, has.pedantic], OK);
    });

    it('withlc negative: REJECT BC (WC) transaction proof WITHOUT block and signatures (normal)', async () => {
        await testsc(wilc, [], errors.ERR_MISSING_BLOCK, failedAt.TransChk);
    });

    it('withlc negative: REJECT BC (WC) transaction proof WITHOUT signatures (normal)', async () => {
        await testsc(wilc, [has.mcBlock], errors.ERR_MISSING_SIGNATURES, failedAt.TransChk);
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('simple negative: REJECT BC (WC) transaction proof WITHOUT shard proof', async () => {
        await testsc(simp, [has.mcBlock, has.noShardProof], errors.ERR_MISSING_SHARD_PROOF);
    });

    it('simple negative: REJECT BC (WC) transaction proof WITHOUT shard hints', async () => {
        await testsc(simp, [has.mcBlock, has.noShardHints], errors.ERR_SHARD_PROOF_BT_FORK);
    });

    it('withlc negative: REJECT BC (WC) transaction proof WITHOUT shard proof', async () => {
        await testsc(wilc, [has.mcBlock, has.noShardProof], errors.ERR_MISSING_SHARD_PROOF);
    });

    it('withlc negative: REJECT BC (WC) transaction proof WITHOUT shard hints', async () => {
        await testsc(wilc, [has.mcBlock, has.noShardHints], errors.ERR_SHARD_PROOF_BT_FORK);
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('simple negative: REJECT MC transaction with CORRUPTED transaction hints', async () => {
        await testmc(simp, [has.mcBlock, has.corruptTxHints], errors.TVM_DESERIALIZATION_ERROR);
    });

    it('simple negative: REJECT SC transaction with CORRUPTED transaction hints', async () => {
        await testsc(simp, [has.mcBlock, has.corruptTxHints], errors.TVM_DESERIALIZATION_ERROR);
    });

    it('simple negative: REJECT SC transaction with CORRUPTED shard hints', async () => {
        await testsc(simp, [has.mcBlock, has.corruptShardHints], errors.TVM_DESERIALIZATION_ERROR);
    });

    it('withlc negative: REJECT MC transaction with CORRUPTED transaction hints', async () => {
        await testmc(wilc, [has.mcBlock, has.corruptTxHints], errors.TVM_DESERIALIZATION_ERROR, failedAt.TransChk);
    });

    it('withlc negative: REJECT SC transaction with CORRUPTED transaction hints', async () => {
        await testsc(wilc, [has.mcBlock, has.corruptTxHints], errors.TVM_DESERIALIZATION_ERROR, failedAt.TransChk);
    });

    it('withlc negative: REJECT SC transaction with CORRUPTED shard hints', async () => {
        await testsc(wilc, [has.mcBlock, has.corruptShardHints], errors.TVM_DESERIALIZATION_ERROR, failedAt.TransChk);
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('simple negative: REJECT MC transaction with REPLACED MC block', async () => {
        await testmc(simp, [has.mcBlock, has.replaceMcBlock], errors.ERR_INCORRECT_BLOCK);
    });

    it('simple negative: REJECT SC transaction with REPLACED MC block', async () => {
        await testsc(simp, [has.mcBlock, has.replaceMcBlock], errors.ERR_DEVIANT_SHARD_PROOF);
    });

    it('withlc negative: REJECT MC transaction with REPLACED MC block', async () => {
        await testmc(wilc, [has.mcBlock, has.replaceMcBlock], errors.ERR_INCORRECT_BLOCK, failedAt.TransChk);
    });

    it('withlc negative: REJECT SC transaction with REPLACED MC block', async () => {
        await testsc(wilc, [has.mcBlock, has.replaceMcBlock], errors.ERR_DEVIANT_SHARD_PROOF, failedAt.TransChk);
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('simple negative: REJECT MC transaction with REPLACED transaction', async () => {
        await testmc(simp, [has.mcBlock, has.replaceTransaction], errors.ERR_TX_HASH_INVALID);
    });

    it('simple negative: REJECT SC transaction with REPLACED transaction', async () => {
        await testsc(simp, [has.mcBlock, has.replaceTransaction], errors.ERR_TX_HASH_INVALID);
    });

    it('withlc negative: REJECT MC transaction with REPLACED transaction', async () => {
        await testmc(wilc, [has.mcBlock, has.replaceTransaction], errors.ERR_TX_HASH_INVALID, failedAt.TransChk);
    });

    it('withlc negative: REJECT SC transaction with REPLACED transaction', async () => {
        await testsc(wilc, [has.mcBlock, has.replaceTransaction], errors.ERR_TX_HASH_INVALID, failedAt.TransChk);
    });


    // -----------------------------------------------------------------------------------------------------------------

    it('withlc negative on LC: REJECT MC transaction proof with block and CORRUPTED signatures (normal)', async () => {
        // do not need too much stuff, just one test that passes TC but fails LC
        // majority of corruption and other tests of LC contract are done in LC tests
        await testmc(wilc, [has.mcBlock, has.mcSignatures, has.corruptMcSigValue], errors.ERR_INVALID_ROOT_HASH, failedAt.LiteCl);
    });

    // -----------------------------------------------------------------------------------------------------------------
    // #################################################################################################################
    // -----------------------------------------------------------------------------------------------------------------

    async function txProof(tx: Cell, blockId: tonNode_blockIdExt) {
        const proof = await makeTransactionProof(tx, blockId);
        const hints = prepareNavigationHints(proof.refs[0].refs[3].refs[2], tx);
        return { proof, hints };
    }

    async function getAnyLastMCBlockTx(withBlockProofing: boolean): Promise<LocalTxData> {
        const { lastBlockId } = await startUpLC(gid);
        const { tx, blockId } = await obtainTransaction(lastBlockId, { txTestAny: true, txseqno: lastBlockId.seqno });
        // MC ALWAYS has transactions, so thats okay
        const { proof, hints } = await txProof(tx, blockId);
        if (hints === undefined) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error('Hints building failed');
        }
        let blockProof: Cell | undefined;
        let blockSignatures: Cell | undefined;
        let blockHash: Buffer | undefined;
        if (withBlockProofing) {
            ({ blockProof, blockHash } = await prepareMCBlockData(blockId));
            blockSignatures = await prepareBlockSignatures(blockId, true, true);
        }
        return { tx, blockId, proof, hints, blockProof, blockSignatures, blockHash };
    }

    async function getAnyLastSCBlockTx(withBlockProofing: boolean): Promise<LocalTxData> {
        const { lastBlockId } = await startUpLC(gid);
        let { seqno, shard } = await chooseAnyShardBlock(lastBlockId);
        let tx: Cell | undefined, blockId: tonNode_blockIdExt | undefined;
        let proof: Cell | undefined, hints: number[] | undefined;
        while (true) {
            // Walk back until we actually find a block with a transaction...
            try {
                ({ tx, blockId } = await obtainTransaction(lastBlockId, {
                    txTestAny: true,
                    txseqno: seqno,
                    txshard: shard,
                }));
                const { proof: p, hints: h } = await txProof(tx, blockId);
                if (h === undefined) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Hints building failed');
                }
                proof = p;
                hints = h;
                let blockProof: Cell | undefined;
                let blockSignatures: Cell | undefined;
                let blockHash: Buffer | undefined;
                let shardProof: Cell | undefined;
                let shardProofHints: number[] | undefined;
                if (withBlockProofing) {
                    let mcBlkId: tonNode_blockIdExt;
                    ({
                        mcBlock: blockProof,
                        shardProof,
                        hints: shardProofHints,
                        mcBlkId,
                    } = await prepareShardProof(blockId));
                    blockSignatures = await prepareBlockSignatures(mcBlkId, true, true);
                    blockHash = Buffer.from(mcBlkId.rootHash);
                }
                if (blockHash?.toString() == mctx.blockHash?.toString()) {
                    // try again, make sure MC blocks are different
                    // this is necessary for some corruption tests
                    continue;
                }
                return {
                    tx,
                    blockId,
                    proof,
                    hints,
                    blockProof,
                    blockSignatures,
                    blockHash,
                    shardProof,
                    shardProofHints,
                };
            } catch (e: Error | any) {
                if (!e.message.includes('Could not find transaction') && !e.message.includes('Multiple proof links')) {
                    throw e;
                    // in practice, proof links should not be a problem because it is always possible to wait until
                    //    the transaction is directly committed into a masterchain without long proof links
                }
            }
            seqno--;
        }
    }

    async function chooseAnyShardBlock(lastBlockId: tonNode_blockIdExt) {
        const blk = await getParsedBlock(lastBlockId);
        let obj = blk.extra.custom.shard_hashes.map.get('0');
        let flip = false;
        while (true) {
            if (flip) {
                if (obj.right !== undefined) {
                    obj = obj.right;
                }
            } else {
                if (obj.left !== undefined) {
                    obj = obj.left;
                }
            }
            if (obj.leaf !== undefined) {
                obj = obj.leaf;
                break;
            }
            // flip = !flip;
        }
        return { seqno: obj.seq_no, shard: BigInt(obj.next_validator_shard).toString(16) };
    }

    async function deployLCWithKeyblock(stepBack: number = 0) {
        lcsc = bc.openContract(LiteClient.createFromConfig({ globalId: gid, nonce: 777 }, lc_code));
        registerLiteClientSC(lcsc as any);

        const {
            lastBlockId,
            blockProof,
            signatures,
            keyBlockId,
            keyBlockInfo,
            wantedBlock,
            lastBlockHdr,
            blockHash,
            vsethash,
        } = await getKeyBlock(stepBack, false);

        await lcsc.sendNewKeyBlock(ms, { block: blockProof, signatures: signatures, value: callValue });

        return {
            blockHash,
            blockProof,
            keyBlockId,
            keyBlockInfo,
            lastBlockHdr,
            lastBlockId,
            lcsc,
            signatures,
            vsethash,
            wantedBlock,
        };
    }

    async function deploySimple() {
        const sc = bc.openContract(TransactionChecker.createFromConfig({ nonce: 888 }, code));
        const res = await sc.sendDeploy(ms, callValue);
        expect(res.transactions).toHaveTransaction({ from: mead, to: sc.address, deploy: true, success: true });
        return sc;
    }

    async function deployLinked() {
        const sc = bc.openContract(
            TransactionChecker.createFromConfig({ nonce: 888, liteClientAddress: lcsc.address }, code),
        );
        const res = await sc.sendDeploy(ms, callValue);
        expect(res.transactions).toHaveTransaction({ from: mead, to: sc.address, deploy: true, success: true });
        return sc;
    }

    function success(tx: Cell | any) {
        if (tx.tx !== undefined) {
            tx = tx.tx;
        } // lol
        return beginCell().storeUint(RE_TRANSACTION_CHECKED, 32).storeRef(tx).endCell();
    }

    function failure(tx: Cell | any, errCode: number) {
        if (tx.tx !== undefined) {
            tx = tx.tx;
        }
        return beginCell().storeUint(RE_TRANS_FAILED_CHECK, 32).storeRef(tx).storeUint(errCode, 16).endCell();
    }

    function applyCorruptions(txdata: LocalTxData, i: has[]): LocalTxData {
        const res = Object.assign({}, txdata);
        if (i.includes(has.corruptTxHints)) {
            res.hints = txdata.hints.map((x) => x ^ 1);
        }
        if (i.includes(has.corruptShardHints)) {
            res.shardProofHints = txdata.shardProofHints?.map((x) => x ^ 1);
        }
        if (i.includes(has.corruptMcSigValue)) {
            let slice = txdata.blockSignatures!.beginParse();
            res.blockSignatures = beginCell()
                .storeUint(slice.loadUintBig(200), 200)
                .storeInt(-Math.round(slice.loadInt(32) / 2), 32) // modify root_hash
                .storeSlice(slice)
                .endCell();
        }
        if (i.includes(has.replaceMcBlock)) {
            // replace mc block with previous one
            if (txdata == mctx) {
                res.blockProof = sctx.blockProof;
            } else {
                res.blockProof = mctx.blockProof;
            }
        }
        if (i.includes(has.replaceTransaction)) {
            // swap discovered mc / sc transactions
            if (txdata == mctx) {
                res.tx = sctx.tx;
            } else {
                res.tx = mctx.tx;
            }
        }
        return res;
    }

    async function sendmc(to: SandboxContract<TransactionChecker>, i: has[]) {
        const need = <T>(j: has, x: T): T | undefined => (i.includes(j) ? x : undefined);
        const { tx, proof, hints, blockProof, blockSignatures } = applyCorruptions(mctx, i);
        return await to.sendCheckTransaction(ms, {
            value: callValue,
            transaction: tx,
            transactionProof: proof,
            transactionProofHints: i.includes(has.zeroTxHints) ? [] : hints,
            masterChainBlock: need(has.mcBlock, blockProof),
            mcBlockSignatures: need(has.mcSignatures, blockSignatures),
            pedantic: i.includes(has.pedantic) && !i.includes(has.notPedantic),
        });
    }

    async function sendsc(to: SandboxContract<TransactionChecker>, i: has[]) {
        const need = <T>(j: has, x: T): T | undefined => (i.includes(j) ? x : undefined);
        const ifnot = <T>(j: has, x: T): T | undefined => (!i.includes(j) ? x : undefined);
        const { tx, proof, hints, blockProof, blockSignatures, shardProof, shardProofHints } = applyCorruptions(sctx, i);
        return await to.sendCheckTransaction(ms, {
            value: callValue,
            transaction: tx,
            transactionProof: proof,
            transactionProofHints: i.includes(has.zeroTxHints) ? [] : hints,
            masterChainBlock: need(has.mcBlock, blockProof),
            mcBlockSignatures: need(has.mcSignatures, blockSignatures),
            shardProof: ifnot(has.noShardProof, shardProof),
            shardProofHints: ifnot(has.noShardHints, i.includes(has.zeroShardHints) ? [] : shardProofHints),
            pedantic: i.includes(has.pedantic) && !i.includes(has.notPedantic),
        });
    }

    async function testmc(to: SandboxContract<TransactionChecker>, i: has[], code: number, fa?: failedAt) {
        const res = await sendmc(to, i);
        const tx = i.includes(has.replaceTransaction) ? sctx.tx : mctx.tx;
        if (code != ANY_ERROR) {
            expect(res.transactions).toHaveTransaction({
                from: to.address, to: me.address, body: code == OK ? success(tx) : failure(tx, code),
            });
        } else {
            expect(res.transactions).toHaveTransaction({
                from: to.address, to: me.address, op: RE_TRANS_FAILED_CHECK
            });
        }
        if (to == wilc && code == OK) {
            await extraTrxCheckWithLC(res, code, fa);
        }
        return res;
    }

    async function testsc(to: SandboxContract<TransactionChecker>, i: has[], code: number, fa?: failedAt) {
        const res = await sendsc(to, i);
        const tx = i.includes(has.replaceTransaction) ? mctx.tx : sctx.tx;
        if (code != ANY_ERROR) {
            expect(res.transactions).toHaveTransaction({
                from: to.address, to: me.address, body: code == OK ? success(tx) : failure(tx, code),
            });
        } else {
            expect(res.transactions).toHaveTransaction({
                from: to.address, to: me.address, op: RE_TRANS_FAILED_CHECK
            });
        }
        if (to == wilc && code == OK) {
            await extraTrxCheckWithLC(res, code, fa);
        }
        return res;
    }

    async function extraTrxCheckWithLC(res: SendMessageResult, code: number, fa?: failedAt) {
        if (code == OK) {
            expect(res.transactions).toHaveTransaction({ from: lcsc.address, to: wilca, op: RE_CORRECT_EX });
        }
        if (fa !== undefined) {
            if (fa == failedAt.LiteCl) {
                expect(res.transactions).toHaveTransaction({ from: lcsc.address, to: wilca, op: RE_INCORRECT_EX });
            }
            if (fa == failedAt.TransChk) {
                expect(res.transactions).not.toHaveTransaction({ from: lcsc.address, to: wilca, op: RE_INCORRECT_EX });
            }
        }
    }

    // -----------------------------------------------------------------------------------------------------------------
    // #################################################################################################################
});