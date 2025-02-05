import { jsonCrutch } from '../utils/json-crutch';
import { beginCell, Cell, Dictionary, Sender, toNano } from '@ton/core';
import { compile } from '@ton/blueprint';
import { Blockchain, BlockchainSnapshot, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { HeadlessUI, Mockingjay } from '../utils/mockingjay';
import {
    init,
    prepareBlockSignatures,
    prepareMCBlockData
} from '../utils/high_level';
import { LiteClient as TLiteClient } from 'ton-lite-client';
import { getOtherRawLC } from '../utils/cli';
import { getBlockBySeqno, getMCBlockId, stopLCs } from '../utils/raw_lc';
import { LiteClient } from '../wrappers/LiteClient';
import '@ton/test-utils';
import { errors } from '../utils/errors';
import { OOPSforTESTS } from '../utils/test';
import { RE_CORRECT, RE_OK } from '../utils/opcodes';
import { bufferToBigInt } from '../utils/utils';
import { getKeyBlock, getStepBackForPedanticTest, setSandboxGid, testMatchConfig } from '../utils/sandbox';
import { registerLiteClientSC } from '../utils/_superglobals';

jsonCrutch();

describe('LiteClient tests', () => {

    // #################################################################################################################
    // -----------------------------------------------------------------------------------------------------------------

    const gid = -3; // testnet
    // const gid = -239; // mainnet
    const callValue = toNano(1);

    setSandboxGid(gid);

    let code: Cell;
    let bc: Blockchain;
    let mkj: Mockingjay;
    let ui = new HeadlessUI();
    let me: SandboxContract<TreasuryContract>;
    let ms: Sender;
    let lc: TLiteClient;
    let snap: BlockchainSnapshot;

    beforeAll(async() => {
        code = await compile('LiteClient');
        bc = await Blockchain.create();
        mkj = new Mockingjay(bc, ui);
        me = await bc.treasury('me');
        ms = me.getSender();
        mkj.setSender(ms);
        init(mkj, [], 'Tests');
        lc = await getOtherRawLC(gid); // testnet
        // ^ this causes jest not to not exit
        snap = bc.snapshot();
        // console.log('Warning! Stability of tests depends on stability of testnet liteservers!')
    });

    beforeEach(async() => {
        await bc.loadFrom(snap);
    })

    afterAll(async() => {
        stopLCs(); // closing engines does not help. have to use --forceExit
    })

    // -----------------------------------------------------------------------------------------------------------------
    // #################################################################################################################
    // -----------------------------------------------------------------------------------------------------------------

    it('deployment: empty LC', async() => {
        const sc = await deployEmpty();
        const cfg = await sc.getFullConfig();
        expect(cfg).toMatchObject({
            globalId: gid, seqNo: 0, time: 0, lt: 777n, totalWeight: 0n
        });
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('deployment: LC with latest keyblock', async() => {
        await deployWithKeyblock(0, true);
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('deployment: LC with previous keyblock', async() => {
        await deployWithKeyblock(1, true);
    })

    // -----------------------------------------------------------------------------------------------------------------

    it('deployment: LC with two keyblocks back', async() => {
        await deployWithKeyblock(2, true);
        // may seem stupid, but is needed for some tests later on
    })

    // -----------------------------------------------------------------------------------------------------------------

    it('deployment: LC with three keyblocks back', async() => {
        await deployWithKeyblock(3, true);
        // may seem stupid, but is needed for some tests later on
        // testnet validator rotation should be much faster than gc timeout
        // therefore, this should not be an issue and should work correctly
    })

    // -----------------------------------------------------------------------------------------------------------------
    // -----------------------------------------------------------------------------------------------------------------

    it('newkeyblock positive: empty LC apply latest keyblock', async() => {
        const sc = await deployEmpty();

        const { blockProof, signatures, keyBlockId, keyBlockInfo, blockHash } = await getKeyBlock(0, false);

        const res = await sc.sendNewKeyBlock(ms, {
            block: blockProof, signatures: signatures, value: callValue,
        });

        expect(res.transactions).toHaveTransaction({
            from: me.address, to: sc.address, deploy: false, success: true
        });

        expect(res.transactions).toHaveTransaction({
            from: sc.address, to: me.address, inMessageBounced: false, body: beginCell()
                .storeUint(RE_OK, 32).storeUint(0, 64).storeUint(bufferToBigInt(blockHash), 256).endCell()
        });

        await testMatchConfig(sc, keyBlockId, keyBlockInfo);
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('newkeyblock positive: LC with previous keyblock apply latest keyblock', async() => {
        const { sc } = await deployWithKeyblock(1, true);

        const { blockProof, signatures, keyBlockId, keyBlockInfo, blockHash } = await getKeyBlock(0, true);

        const res = await sc.sendNewKeyBlock(ms, {
            block: blockProof, signatures: signatures, value: callValue,
        });

        expect(res.transactions).toHaveTransaction({
            from: me.address, to: sc.address, deploy: false, success: true
        });

        expect(res.transactions).toHaveTransaction({
            from: sc.address, to: me.address, inMessageBounced: false, body: beginCell()
                .storeUint(RE_OK, 32).storeUint(0, 64).storeUint(bufferToBigInt(blockHash), 256).endCell()
        });

        await testMatchConfig(sc, keyBlockId, keyBlockInfo);
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('newkeyblock positive: LC with two keyblocks back apply previous and latest keyblock in order', async() => {
        const { sc } = await deployWithKeyblock(2, true);

        {
            const { blockProof, signatures, keyBlockId, keyBlockInfo, blockHash } = await getKeyBlock(1, true);

            const res = await sc.sendNewKeyBlock(ms, {
                block: blockProof, signatures: signatures, value: callValue,
            });

            expect(res.transactions).toHaveTransaction({
                from: me.address, to: sc.address, deploy: false, success: true
            });

            expect(res.transactions).toHaveTransaction({
                from: sc.address, to: me.address, inMessageBounced: false, body: beginCell()
                    .storeUint(RE_OK, 32).storeUint(0, 64).storeUint(bufferToBigInt(blockHash), 256).endCell()
            });

            await testMatchConfig(sc, keyBlockId, keyBlockInfo);
        }

        {
            const { blockProof, signatures, keyBlockId, keyBlockInfo, blockHash } = await getKeyBlock(0, true);

            const res = await sc.sendNewKeyBlock(ms, {
                block: blockProof, signatures: signatures, value: callValue,
            });

            expect(res.transactions).toHaveTransaction({
                from: me.address, to: sc.address, deploy: false, success: true
            });

            expect(res.transactions).toHaveTransaction({
                from: sc.address, to: me.address, inMessageBounced: false, body: beginCell()
                    .storeUint(RE_OK, 32).storeUint(0, 64).storeUint(bufferToBigInt(blockHash), 256).endCell()
            });

            await testMatchConfig(sc, keyBlockId, keyBlockInfo);
        }
    });


    // -----------------------------------------------------------------------------------------------------------------

    it('newkeyblock negative: LC with two keyblocks back REJECT latest keyblock', async() => {
        const { sc, keyBlockId: prevId, keyBlockInfo: prevInfo } = await deployWithKeyblock(2, true);

        const { blockProof, signatures } = await getKeyBlock(0, true);

        const res = await sc.sendNewKeyBlock(ms, {
            block: blockProof, signatures: signatures, value: callValue,
        });
        expect(res.transactions).toHaveTransaction({exitCode: errors.ERR_PREV_KEY_SEQNO});

        await testMatchConfig(sc, prevId, prevInfo);
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('newkeyblock negative: LC with previous keyblock REJECT latest keyblock WITHOUT signatures', async() => {
        const { sc, keyBlockId: prevId, keyBlockInfo: prevInfo } = await deployWithKeyblock(1, true);

        const { blockProof, signatures } = await getKeyBlock(0, false);

        const res = await sc.sendNewKeyBlock(ms, {
            block: blockProof, signatures: signatures, value: callValue,
        });
        expect(res.transactions).toHaveTransaction({exitCode: errors.TVM_DESERIALIZATION_ERROR});

        await testMatchConfig(sc, prevId, prevInfo);
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('newkeyblock negative: LC with previous keyblock REJECT latest keyblock with MODIFIED signed material', async() => {
        const { sc, keyBlockId: prevId, keyBlockInfo: prevInfo } = await deployWithKeyblock(1, true);

        let { blockProof, signatures } = await getKeyBlock(0, true);
        let slice = signatures.beginParse();
        signatures = beginCell()
            .storeUint(slice.loadUintBig(200), 200)
            .storeInt(-Math.round(slice.loadInt(32)/2), 32) // modify root_hash
            .storeSlice(slice).endCell();

        const res = await sc.sendNewKeyBlock(ms, {
            block: blockProof, signatures: signatures, value: callValue,
        });
        expect(res.transactions).toHaveTransaction({exitCode: errors.ERR_INVALID_ROOT_HASH});

        await testMatchConfig(sc, prevId, prevInfo);
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('newkeyblock negative: LC with previous keyblock REJECT latest keyblock with MODIFIED signature', async() => {
        const { sc, keyBlockId: prevId, keyBlockInfo: prevInfo } = await deployWithKeyblock(1, true);

        let { blockProof, signatures } = await getKeyBlock(0, true);
        let slice = signatures.beginParse();
        const sigDict = Dictionary.loadDirect(Dictionary.Keys.BigUint(256),
            Dictionary.Values.Buffer(64), slice.loadRef());
        const k1 = sigDict.keys()[0];
        const v1 = sigDict.get(k1)!;
        v1[0] ^= 1;
        sigDict.set(k1, v1);
        signatures = beginCell().storeRef(beginCell().storeDictDirect(sigDict).endCell())
            .storeSlice(slice).endCell();

        const res = await sc.sendNewKeyBlock(ms, {
            block: blockProof, signatures: signatures, value: callValue,
        });
        expect(res.transactions).toHaveTransaction({exitCode: errors.ERR_INVALID_SIGNATURE});

        await testMatchConfig(sc, prevId, prevInfo);
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('newkeyblock negative: LC with previous keyblock REJECT latest keyblock with KEY CONFUSION', async() => {
        const { sc, keyBlockId: prevId, keyBlockInfo: prevInfo } = await deployWithKeyblock(1, true);

        let { blockProof, signatures } = await getKeyBlock(0, true);
        let slice = signatures.beginParse();
        const sigDict = Dictionary.loadDirect(Dictionary.Keys.BigUint(256),
            Dictionary.Values.Buffer(64), slice.loadRef());
        const k1 = sigDict.keys()[0];
        const v1 = sigDict.get(k1)!;
        const k2 = sigDict.keys()[1];
        const v2 = sigDict.get(k2)!;
        // swap signatures between two keys
        sigDict.set(k1, v2);
        sigDict.set(k2, v1);
        signatures = beginCell().storeRef(beginCell().storeDictDirect(sigDict).endCell())
            .storeSlice(slice).endCell();

        const res = await sc.sendNewKeyBlock(ms, {
            block: blockProof, signatures: signatures, value: callValue,
        });
        expect(res.transactions).toHaveTransaction({exitCode: errors.ERR_INVALID_SIGNATURE});

        await testMatchConfig(sc, prevId, prevInfo);
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('newkeyblock negative: LC with previous keyblock REJECT latest keyblock with EMPTY CELL', async() => {
        const { sc, keyBlockId: prevId, keyBlockInfo: prevInfo } = await deployWithKeyblock(1, true);

        let { blockProof, signatures } = await getKeyBlock(0, true);
        let slice = signatures.beginParse();
        signatures = beginCell().storeRef(beginCell().endCell()).storeSlice(slice).endCell();

        const res = await sc.sendNewKeyBlock(ms, {
            block: blockProof, signatures: signatures, value: callValue,
        });
        expect(res.transactions).toHaveTransaction({exitCode: errors.TVM_DESERIALIZATION_ERROR});

        await testMatchConfig(sc, prevId, prevInfo);
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('newkeyblock negative: LC with previous keyblock REJECT latest keyblock with LOW SIG WEIGHT', async() => {
        const { sc, keyBlockId: prevId, keyBlockInfo: prevInfo } = await deployWithKeyblock(1, true);

        let { blockProof, signatures } = await getKeyBlock(0, true);
        let slice = signatures.beginParse();
        const sigDict = Dictionary.loadDirect(Dictionary.Keys.BigUint(256),
            Dictionary.Values.Buffer(64), slice.loadRef());
        const newDict = Dictionary.empty(Dictionary.Keys.BigUint(256),
            Dictionary.Values.Buffer(64));
        const k1 = sigDict.keys()[0];
        const v1 = sigDict.get(k1)!;
        newDict.set(k1, v1);
        signatures = beginCell().storeRef(beginCell().storeDictDirect(newDict).endCell())
            .storeSlice(slice).endCell();

        const res = await sc.sendNewKeyBlock(ms, {
            block: blockProof, signatures: signatures, value: callValue,
        });
        expect(res.transactions).toHaveTransaction({exitCode: errors.ERR_NOT_ENOUGH_WEIGHT});

        await testMatchConfig(sc, prevId, prevInfo);
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('newkeyblock negative: LC with previous keyblock REJECT latest keyblock with proof WITHOUT HEADER', async() => {
        const { sc, keyBlockId: prevId, keyBlockInfo: prevInfo } = await deployWithKeyblock(1, true);

        OOPSforTESTS.keyBlockWrongConfig = true;
        const { blockProof, signatures } = await getKeyBlock(0, true);

        const res = await sc.sendNewKeyBlock(ms, {
            block: blockProof, signatures: signatures, value: callValue,
        });
        expect(res.transactions).toHaveTransaction({exitCode: errors.TVM_DESERIALIZATION_ERROR});
        // tries to walk into header, BUT IT IS NOT THERE!

        await testMatchConfig(sc, prevId, prevInfo);
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('newkeyblock negative: LC with previous keyblock REJECT latest keyblock with proof WITHOUT P34', async() => {
        const { sc, keyBlockId: prevId, keyBlockInfo: prevInfo } = await deployWithKeyblock(1, true);

        OOPSforTESTS.keyBlockWrongCell = true;
        const { blockProof, signatures } = await getKeyBlock(0, true);

        const res = await sc.sendNewKeyBlock(ms, {
            block: blockProof, signatures: signatures, value: callValue,
        });
        expect(res.transactions).toHaveTransaction({exitCode: errors.TVM_DESERIALIZATION_ERROR});
        // turns out that omitting p34 tries to load a pruned branch, oops, thus exit code 9

        await testMatchConfig(sc, prevId, prevInfo);
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('newkeyblock negative: LC with previous keyblock REJECT latest keyblock with signatures for WRONG BLOCK', async() => {
        const { sc, keyBlockId: prevId, keyBlockInfo: prevInfo } = await deployWithKeyblock(1, true);

        const { blockProof, keyBlockId } = await getKeyBlock(0, false);
        const prevBlk = await getBlockBySeqno(keyBlockId.seqno - 1);
        const signatures = await prepareBlockSignatures(prevBlk.id, true);

        const res = await sc.sendNewKeyBlock(ms, {
            block: blockProof, signatures: signatures, value: callValue,
        });
        expect(res.transactions).toHaveTransaction({exitCode: errors.ERR_INVALID_ROOT_HASH});
        // consequently, if block is replaced, but correct sigs for the keyblock are provided, this will fail

        await testMatchConfig(sc, prevId, prevInfo);
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('newkeyblock negative: LC with previous keyblock and REJECT two keyblocks back', async() => {
        const { sc, keyBlockId: prevId, keyBlockInfo: prevInfo } = await deployWithKeyblock(1, true);

        const { blockProof, signatures } = await getKeyBlock(2, true);

        const res = await sc.sendNewKeyBlock(ms, {
            block: blockProof, signatures: signatures, value: callValue,
        });
        expect(res.transactions).toHaveTransaction({exitCode: errors.ERR_BAD_SEQNO});

        await testMatchConfig(sc, prevId, prevInfo);
    });

    // -----------------------------------------------------------------------------------------------------------------
    // -----------------------------------------------------------------------------------------------------------------

    it('checkblock positive: LC with latest keyblock check latest block (minimal proof)', async() => {
        const { sc, lastBlockId } = await deployWithKeyblock(0, true);

        const { blockId, blockProof, blockHash } = await prepareMCBlockData(lastBlockId, true);
        const signatures = await prepareBlockSignatures(blockId, true, true);

        const res = await sc.sendCheckBlock(ms, {block: blockProof, signatures: signatures, value: callValue, pedantic: false});

        expect(res.transactions).toHaveTransaction({
            from: sc.address, to: me.address, inMessageBounced: false, body: beginCell()
                .storeUint(RE_CORRECT, 32).storeUint(0, 64).storeUint(bufferToBigInt(blockHash), 256).endCell()
        });
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('checkblock negative: LC with latest keyblock REJECT latest block (minimal proof w/ pedantic)', async() => {
        const { sc, lastBlockId } = await deployWithKeyblock(0, true);

        const { blockId, blockProof } = await prepareMCBlockData(lastBlockId, true);
        const signatures = await prepareBlockSignatures(blockId, true, true);

        const res = await sc.sendCheckBlock(ms, {block: blockProof, signatures: signatures, value: callValue, pedantic: true});

        expect(res.transactions).toHaveTransaction({exitCode: errors.ERR_BLK_INFO_PRUNED});
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('checkblock positive: LC with latest keyblock check latest block (proof with hdr)', async() => {
        const { sc, lastBlockId } = await deployWithKeyblock(0, true);

        const { blockId, blockProof, blockHash } = await prepareMCBlockData(lastBlockId, false);
        const signatures = await prepareBlockSignatures(blockId, true, true);

        const res = await sc.sendCheckBlock(ms, {block: blockProof, signatures: signatures, value: callValue, pedantic: false});

        expect(res.transactions).toHaveTransaction({
            from: sc.address, to: me.address, inMessageBounced: false, body: beginCell()
                .storeUint(RE_CORRECT, 32).storeUint(0, 64).storeUint(bufferToBigInt(blockHash), 256).endCell()
        });
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('checkblock positive: LC with latest keyblock check latest block (proof with hdr w/ pedantic)', async() => {
        const { sc, lastBlockId } = await deployWithKeyblock(0, true);

        const { blockId, blockProof, blockHash } = await prepareMCBlockData(lastBlockId, false);
        const signatures = await prepareBlockSignatures(blockId, true, true);

        const res = await sc.sendCheckBlock(ms, {block: blockProof, signatures: signatures, value: callValue, pedantic: true});

        expect(res.transactions).toHaveTransaction({
            from: sc.address, to: me.address, inMessageBounced: false, body: beginCell()
                .storeUint(RE_CORRECT, 32).storeUint(0, 64).storeUint(bufferToBigInt(blockHash), 256).endCell()
        });
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('checkblock positive: LC with latest keyblock check almost latest block (minimal proof)', async() => {
        const { sc, lastBlockId, keyBlockId } = await deployWithKeyblock(0, true);

        const { blockId, blockProof, blockHash } = await prepareMCBlockData(
            Math.max(lastBlockId.seqno - 16, keyBlockId.seqno + 1), true); // make sure does not fail in edge cases
        const signatures = await prepareBlockSignatures(blockId, true, true);

        const res = await sc.sendCheckBlock(ms, {block: blockProof, signatures: signatures, value: callValue, pedantic: false});

        expect(res.transactions).toHaveTransaction({
            from: sc.address, to: me.address, inMessageBounced: false, body: beginCell()
                .storeUint(RE_CORRECT, 32).storeUint(0, 64).storeUint(bufferToBigInt(blockHash), 256).endCell()
        });
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('checkblock positive: LC with latest keyblock check next block after keyblock (minimal proof)', async() => {
        const { sc, keyBlockId } = await deployWithKeyblock(0, true);

        const { blockId, blockProof, blockHash } = await prepareMCBlockData(keyBlockId.seqno + 1, true);
        const signatures = await prepareBlockSignatures(blockId, true, true);

        const res = await sc.sendCheckBlock(ms, {block: blockProof, signatures: signatures, value: callValue, pedantic: false});

        expect(res.transactions).toHaveTransaction({
            from: sc.address, to: me.address, inMessageBounced: false, body: beginCell()
                .storeUint(RE_CORRECT, 32).storeUint(0, 64).storeUint(bufferToBigInt(blockHash), 256).endCell()
        });
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('checkblock negative: LC with latest keyblock FAIL checking keyblock itself (minimal proof)', async() => {
        const { sc, keyBlockId, vsethash } = await deployWithKeyblock(0, true);

        const { vsethash: vsethashprev } = await getKeyBlock(1, false);
        if (vsethashprev.equals(vsethash)) {
            console.warn('WARNING: skipping test minimal proof check previous tests, because vsethash is the same as previous one');
            return;
        }

        const { blockId, blockProof } = await prepareMCBlockData(keyBlockId, true);
        const signatures = await prepareBlockSignatures(blockId, true, true);

        const res = await sc.sendCheckBlock(ms, {block: blockProof, signatures: signatures, value: callValue, pedantic: false});

        expect(res.transactions).toHaveTransaction({exitCode: errors.ERR_INVALID_SIGNER});
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('checkblock negative: LC with latest keyblock FAIL checking older block to it (minimal proof)', async() => {
        const { sc, keyBlockId, vsethash } = await deployWithKeyblock(0, true);

        const { vsethash: vsethashprev } = await getKeyBlock(1, false);
        if (vsethashprev.equals(vsethash)) {
            return;
        }

        const { blockId, blockProof } = await prepareMCBlockData(keyBlockId.seqno - 1, true);
        const signatures = await prepareBlockSignatures(blockId, true, true);

        const res = await sc.sendCheckBlock(ms, {block: blockProof, signatures: signatures, value: callValue, pedantic: false});

        expect(res.transactions).toHaveTransaction({exitCode: errors.ERR_INVALID_SIGNER});
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('checkblock negative: LC with latest keyblock FAIL checking keyblock itself (proof with hdr)', async() => {
        const { sc, keyBlockId } = await deployWithKeyblock(0, true);

        const { blockId, blockProof } = await prepareMCBlockData(keyBlockId, false);
        const signatures = await prepareBlockSignatures(blockId, true, true);

        const res = await sc.sendCheckBlock(ms, {block: blockProof, signatures: signatures, value: callValue, pedantic: false});

        expect(res.transactions).toHaveTransaction({exitCode: errors.ERR_BAD_SEQNO});
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('checkblock negative: LC with latest keyblock FAIL checking previous block to it (proof with hdr)', async() => {
        const { sc, keyBlockId } = await deployWithKeyblock(0, true);

        const { blockId, blockProof } = await prepareMCBlockData(keyBlockId.seqno - 1, false);
        const signatures = await prepareBlockSignatures(blockId, true, true);

        const res = await sc.sendCheckBlock(ms, {block: blockProof, signatures: signatures, value: callValue, pedantic: false});

        expect(res.transactions).toHaveTransaction({exitCode: errors.ERR_BAD_SEQNO});
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('checkblock negative: LC with latest keyblock FAIL checking latest block with wrong sigs', async() => {
        const { sc, lastBlockId } = await deployWithKeyblock(0, true);

        const { blockId, blockProof } = await prepareMCBlockData(lastBlockId, true);
        const prevBlock = await getMCBlockId(blockId.seqno - 1);
        const signatures = await prepareBlockSignatures(prevBlock, true, true);

        const res = await sc.sendCheckBlock(ms, {block: blockProof, signatures: signatures, value: callValue, pedantic: false});

        expect(res.transactions).toHaveTransaction({exitCode: errors.ERR_INVALID_ROOT_HASH});
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('checkblock negative: LC with latest keyblock FAIL checking latest block WITHOUT signatures', async() => {
        const { sc, lastBlockId } = await deployWithKeyblock(0, true);

        const { blockProof } = await prepareMCBlockData(lastBlockId, true);
        const signatures = await prepareBlockSignatures(lastBlockId, false, false);

        const res = await sc.sendCheckBlock(ms, {block: blockProof, signatures: signatures, value: callValue, pedantic: false});

        expect(res.transactions).toHaveTransaction({exitCode: errors.TVM_DESERIALIZATION_ERROR});
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('checkblock negative: LC with latest keyblock FAIL checking latest block with MODIFIED signed material', async() => {
        const { sc, lastBlockId } = await deployWithKeyblock(0, true);

        const { blockProof } = await prepareMCBlockData(lastBlockId, true);
        let signatures = await prepareBlockSignatures(lastBlockId, true, true);
        let slice = signatures.beginParse();
        signatures = beginCell()
            .storeUint(slice.loadUintBig(200), 200)
            .storeInt(-Math.round(slice.loadInt(32)/2), 32) // modify root_hash
            .storeSlice(slice).endCell();

        const res = await sc.sendCheckBlock(ms, {block: blockProof, signatures: signatures, value: callValue, pedantic: false});

        expect(res.transactions).toHaveTransaction({exitCode: errors.ERR_INVALID_ROOT_HASH});
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('checkblock negative: LC with latest keyblock FAIL checking latest block with MODIFIED signature', async() => {
        const { sc, lastBlockId } = await deployWithKeyblock(0, true);

        const { blockProof } = await prepareMCBlockData(lastBlockId, true);
        let signatures = await prepareBlockSignatures(lastBlockId, true, true);
        let slice = signatures.beginParse();
        const sigDict = Dictionary.loadDirect(Dictionary.Keys.BigUint(256),
            Dictionary.Values.Buffer(64), slice.loadRef());
        const k1 = sigDict.keys()[0];
        const v1 = sigDict.get(k1)!;
        v1[0] ^= 1;
        sigDict.set(k1, v1);
        signatures = beginCell().storeRef(beginCell().storeDictDirect(sigDict).endCell())
            .storeSlice(slice).endCell();

        const res = await sc.sendCheckBlock(ms, {block: blockProof, signatures: signatures, value: callValue, pedantic: false});

        expect(res.transactions).toHaveTransaction({exitCode: errors.ERR_INVALID_SIGNATURE});
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('checkblock negative: LC with latest keyblock FAIL checking latest block with KEY CONFUSION', async() => {
        const { sc, lastBlockId } = await deployWithKeyblock(0, true);

        const { blockProof } = await prepareMCBlockData(lastBlockId, true);
        let signatures = await prepareBlockSignatures(lastBlockId, true, true);
        let slice = signatures.beginParse();
        const sigDict = Dictionary.loadDirect(Dictionary.Keys.BigUint(256),
            Dictionary.Values.Buffer(64), slice.loadRef());
        const k1 = sigDict.keys()[0];
        const v1 = sigDict.get(k1)!;
        const k2 = sigDict.keys()[1];
        const v2 = sigDict.get(k2)!;
        // swap signatures between two keys
        sigDict.set(k1, v2);
        sigDict.set(k2, v1);
        signatures = beginCell().storeRef(beginCell().storeDictDirect(sigDict).endCell())
            .storeSlice(slice).endCell();

        const res = await sc.sendCheckBlock(ms, {block: blockProof, signatures: signatures, value: callValue, pedantic: false});

        expect(res.transactions).toHaveTransaction({exitCode: errors.ERR_INVALID_SIGNATURE});
    });

    // -----------------------------------------------------------------------------------------------------------------
    // The most interesting tests follow :)
    // -----------------------------------------------------------------------------------------------------------------

    it('cb pedantic test: should VERIFY block with vset from previous key block to its last key block if NOT PEDANTIC', async() => {
        const stepBack = await getStepBackForPedanticTest();
        const { sc } = await deployWithKeyblock(stepBack, true);
        const { keyBlockId: keyBlockIdNext } = await getKeyBlock(stepBack - 1, true);

        const { blockId, blockProof, blockHash } = await prepareMCBlockData(keyBlockIdNext.seqno + 1, false);
        const signatures = await prepareBlockSignatures(blockId, true, true);

        const res = await sc.sendCheckBlock(ms, {block: blockProof, signatures: signatures, value: callValue, pedantic: false});

        expect(res.transactions).toHaveTransaction({
            from: sc.address, to: me.address, inMessageBounced: false, body: beginCell()
                .storeUint(RE_CORRECT, 32).storeUint(0, 64).storeUint(bufferToBigInt(blockHash), 256).endCell()
        });
    });

    // -----------------------------------------------------------------------------------------------------------------

    it('cb pedantic test: should REJECT block with vset from previous key block to its last key block if PEDANTIC', async() => {
        const stepBack = await getStepBackForPedanticTest();
        const { sc } = await deployWithKeyblock(stepBack, true);
        const { keyBlockId: keyBlockIdNext } = await getKeyBlock(stepBack - 1, true);

        const { blockId, blockProof } = await prepareMCBlockData(keyBlockIdNext.seqno + 1, false);
        const signatures = await prepareBlockSignatures(blockId, true, true);

        const res = await sc.sendCheckBlock(ms, {block: blockProof, signatures: signatures, value: callValue, pedantic: true});

        expect(res.transactions).toHaveTransaction({exitCode: errors.ERR_PREV_KEY_SEQNO});
    });

    // -----------------------------------------------------------------------------------------------------------------
    // #################################################################################################################
    // -----------------------------------------------------------------------------------------------------------------

    async function deployEmpty() {
        const sc = bc.openContract(
            LiteClient.createFromConfig({globalId: gid, nonce: 777}, code)
        );
        registerLiteClientSC(sc as any);

        const res = await sc.sendEmpty(ms, callValue);
        expect(res.transactions).toHaveTransaction({
            from: me.address, to: sc.address, deploy: true, success: true
        });

        return sc;
    }

    // -----------------------------------------------------------------------------------------------------------------

    async function deployWithKeyblock(stepBack: number = 0, check: boolean = true) {
        const sc = bc.openContract(
            LiteClient.createFromConfig({globalId: gid, nonce: 777}, code)
        );
        registerLiteClientSC(sc as any);

        const { lastBlockId, blockProof, signatures, keyBlockId, keyBlockInfo, wantedBlock, lastBlockHdr, blockHash, vsethash }
            = await getKeyBlock(stepBack, false);

        const res = await sc.sendNewKeyBlock(ms, {
            block: blockProof, signatures: signatures, value: callValue,
        });

        expect(res.transactions).toHaveTransaction({
            from: me.address, to: sc.address, deploy: true, success: true
        });

        expect(res.transactions).toHaveTransaction({
            from: sc.address, to: me.address, inMessageBounced: false, body: beginCell()
                .storeUint(RE_OK, 32).storeUint(0, 64).storeUint(bufferToBigInt(blockHash), 256).endCell()
        });

        if (check) {
            await testMatchConfig(sc, keyBlockId, keyBlockInfo);
        }

        return { sc, lastBlockId, lastBlockHdr, wantedBlock, keyBlockId, blockProof, signatures, keyBlockInfo, blockHash, vsethash };
    }

    // -----------------------------------------------------------------------------------------------------------------
    // #################################################################################################################

});