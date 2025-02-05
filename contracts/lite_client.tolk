tolk 0.6
/////////////////////////////////////////////////////////////////////////////////
// "Lite client" contract // https://contest.com/docs/TrustlessBridgeChallenge //-------------------
/////////////////////////////////////////////////////////////////////////////////
/* Since there is no definition of epoch, I assume the following requirements:
   1. The block must have adequate seq_no, time, lt ( >= remembered ones)
   2. Global ID of the block must match the recorded one
   3. Obviously it must be a masterchain block and a key block.
** I considered some an additional security constraint, but it actually just creates problems:
   a. Validating prev_key_block_seqno does not contribute to security, but just adds inconvenience.
   b. I assume, that validators follow security practices and generate new keys for each epoch.
   c. Such check does not add security, since, if we assume a fake block, it can have any p_k_b_s.
   d.  As for inconvenience, checking this value may cause problems if the key block is created in
      response to other config changes, for example, 30 minutes before the epoch change Elector SC
      asks Config SC to record new validator set into p36, and it does the change, emitting a KB.
   e. Nevertheless, still, for proper updates, all such keyblocks need to be pumped into the SC.
** But, anyway, for completeness, this SC supports "pedantic mode", which enforces extra security
   by matching prev_key_block_seqno, if required by the requesting smart contract.
** -------------------------------------------------------------------------------------------------
   Additionally, for convenience and usability, some functionality was added:
   1. There are additional "test_*" getters that can be used to use contract functionality off-chain
   2. A combination function was added, check block new KB, that tries to apply a new keyblock (but
      if it fails, flow silently continues) and then tries to check the block. This may be useful by
      providing both keyblock and the block to be checked in one transaction if keyblock was changed
      recently, but was not yet applied to the Lite Client SC.
*/
// -------------------------------------------------------------------------------------------------
import "@stdlib/common.tolk"
import "inc/blocks.tolk";
import "inc/constants.tolk";
import "inc/errors.tolk";
import "inc/lowlevel.tolk";
import "inc/message.tolk";
import "inc/signatures.tolk";
import "inc/validatorset.tolk";
import "inc/virtualization.tolk";
// ^ Code split into modules to make them reusable, pluggable and easier to understand
// -------------------------------------------------------------------------------------------------
global keyBlockSeqNo: int;
global keyBlockTime:  int;
global keyBlockLt:    int;
global storGlobalId:  int;  // should never change
global validatorKeys: cell; // p34 | dict: publicKey -> weight | only masterchain validators
global totalWeight:   int;  // p34
// -------------------------------------------------------------------------------------------------
fun loadData() {
    var ds = getContractData().beginParse();

    keyBlockSeqNo = ds.loadUint(32);
    keyBlockTime  = ds.loadUint(32);
    keyBlockLt    = ds.loadUint(64);
    storGlobalId  = ds.loadInt (32);
    validatorKeys = ds.loadRef ();
    totalWeight   = ds.loadUint(64);

    ds.assertEndOfSlice();
}
// -------------------------------------------------------------------------------------------------
@inline // Used only once
fun saveData() {
    setContractData(
        beginCell()
        .storeUint(keyBlockSeqNo, 32)
        .storeUint(keyBlockTime,  32)
        .storeUint(keyBlockLt,    64)
        .storeInt (storGlobalId,  32)
        .storeRef (validatorKeys    )
        .storeUint(totalWeight,   64)
        .endCell()
    );
}
// -------------------------------------------------------------------------------------------------
fun onInternalMessage(msgFull: cell, msgBody: slice) {
    var cs     = msgFull.beginParse();
    val flags  = cs.loadMessageFlags();
    if (isMessageBounced(flags)) { return; } // ignore all bounced messages
    val sender = cs.loadAddress();

    if (msgBody.isEndOfSlice()) {
        sendMsg(sender, beginCell(), 0); // return extra
        return;
    }

    val op      = msgBody.loadMessageOp();
    if (op == OP_SIMPLE_TRANSFER) {
        sendMsg(sender, beginCell(), 0); // return extra
        return;
    }

    loadData();

    // Ideally, for security, need to send this operation on deployment for proper initialization
    if (op == OP_NEW_KEY_BLOCK) {
        val queryId    = msgBody.loadMessageQueryId();
        val block      = msgBody.loadRef();
        val signatures = msgBody.loadRef();
        msgBody.assertEndOfSlice();
        // key block check is always "pedantic", each key block must be applied sequentially
        val blockHash = processNewKeyBlock(block, signatures, false); // real
        sendResponse(sender, RE_OK, queryId, blockHash, SEND_MODE_IGNORE_ERRORS);
        return;
    }

    if (op == OP_CHECK_BLOCK) {
        val queryId    = msgBody.loadMessageQueryId();
        val block      = msgBody.loadRef();
        val signatures = msgBody.loadRef();
        val pedantic   = (msgBody.getRemainingBitsCount() == 1);
        if (pedantic) {
            assert(msgBody.loadBool(), ERR_INVALID_FLAG_VALUE);
        }
        msgBody.assertEndOfSlice();
        val blockHash = processCheckBlock(block, signatures, pedantic);
        sendResponse(sender, RE_CORRECT, queryId, blockHash, 0);
        return;
    }

    if (op == OP_CHECK_BLOCK_EX) {
        // N.B. It is better to duplicate code than to mess up existing branch and impair readability
        // Two critical changes: sticky extra ref, and try-catch with correct / incorrect op codes
        val queryId    = msgBody.loadMessageQueryId();
        val block      = msgBody.loadRef();
        val signatures = msgBody.loadRef();
        val extra      = msgBody.loadRef();  // <- new
        val pedantic   = msgBody.loadBool(); // finally can use normal bool without breaking rules
        msgBody.assertEndOfSlice();
        try {
            // N.B. Can still fail if out of gas, but thats problems of the instigator, it would not
            // affect logic or integrity in any way, thus no additional checks needed.
            val blockHash = processCheckBlock(block, signatures, pedantic);
            sendMsgStd(sender, RE_CORRECT_EX, queryId,
                beginCell().storeUint(blockHash, 256).storeRef(extra), 0);
        } catch (e) {
            sendMsgStd(sender, RE_INCORRECT_EX, queryId,
                beginCell().storeUint(e, 16).storeRef(extra), 0);
        }
        return;
    }

    if (op == OP_NEW_KEY_AND_CHECK) {
        val queryId       = msgBody.loadMessageQueryId();
        val block         = msgBody.loadRef();
        val signatures    = msgBody.loadRef();
        val keyBlock      = msgBody.loadRef();
        val keySignatures = msgBody.loadRef();
        val pedantic      = msgBody.loadBool();
        msgBody.assertEndOfSlice();
        // If we fail to processNewKeyBlock here, that's OK, it may be applied by now in other msg
        try { processNewKeyBlock(keyBlock, keySignatures, false); } catch { }
        val blockHash = processCheckBlock(block, signatures, pedantic);
        sendResponse(sender, RE_CORRECT, queryId, blockHash, 0);
        return;
    }

    throw ERR_UNKNOWN_OP;
}
// -------------------------------------------------------------------------------------------------
fun processNewKeyBlock(block: cell, signatures: cell, virtual: /*bool*/ int): int {
    // Block in new_key_block message may have all unused branches pruned, however the block header
    // and McBlockExtra field that contains configuration contract state (in particular 34 config)
    // should be presented. <<< Therefore, blockInfoAvailable check is not necessary. >>>
    val (blockSlice, blockHash) = unvirtMerkleProof(block);
    assert(blockSlice != null) throw ERR_NEW_KEYBLK_PRUNED;
    val (seqno, time, lt, globalId, prevKeySeqno, p34) = parseKeyBlock(blockSlice);
    assert(globalId == storGlobalId)  throw ERR_BAD_GLOBAL_ID;
    if (keyBlockSeqNo != 0) { // initialized
        assert(seqno > keyBlockSeqNo) throw ERR_BAD_SEQNO;
        assert(time > keyBlockTime)   throw ERR_BAD_GEN_TIME;
        assert(lt > keyBlockLt)       throw ERR_BAD_LT;
        assert(keyBlockSeqNo == prevKeySeqno) throw ERR_PREV_KEY_SEQNO;
        verifySignatures(blockHash, signatures, validatorKeys, totalWeight);
    }
    // There is no risk of partial pruning attack because each validator is separately read out
    // from the hashmap and is reconstructed into a different structured hashmap. Neat!
    val (valKeySet, valTotalWeight) = parseValidatorSet(p34, true); // THE MASTER
    // Install (volatile)
    keyBlockSeqNo = seqno;
    keyBlockTime = time;
    keyBlockLt = lt;
    validatorKeys = valKeySet;
    totalWeight = valTotalWeight;
    if (!virtual) {
        // Install (persistent)
        saveData();
    }
    return blockHash;
}
// -------------------------------------------------------------------------------------------------
fun processCheckBlock(block: cell, signatures: cell, pedantic: /*bool*/ int): int {
    // By definition, "Block in check_block message may have all unused branches pruned."
    // Therefore, we need to check if block info is available to perform additional checks
    val (blockSlice, blockHash) = unvirtMerkleProof(block);
    if (blockInfoAvailable(blockSlice)) {
        val (seqno, time, lt, globalId, prevKeySeqno, _) = parseMasterBlock(blockSlice);
        assert(keyBlockSeqNo != 0)        throw ERR_NOT_READY;
        assert(globalId == storGlobalId)  throw ERR_BAD_GLOBAL_ID;
        assert(seqno > keyBlockSeqNo)     throw ERR_BAD_SEQNO;
        assert(time > keyBlockTime)       throw ERR_BAD_GEN_TIME;
        assert(lt > keyBlockLt)           throw ERR_BAD_LT;
        if (pedantic) {
            assert(keyBlockSeqNo == prevKeySeqno) throw ERR_PREV_KEY_SEQNO;
        }
    } else {
        // In pedantic mode pruning block info is not allowed
        assert(!pedantic) throw ERR_BLK_INFO_PRUNED;
        // Otherwise, no checks can be done, just verify the signature
    }
    verifySignatures(blockHash, signatures, validatorKeys, totalWeight);
    return blockHash;
}
// -------------------------------------------------------------------------------------------------
@inline
fun sendResponse(recipient: slice, opCode: int, queryId: int, blockHash: int, extraMode: int) {
    return sendMsgStd(recipient, opCode, queryId, beginCell().storeUint(blockHash, 256), extraMode);
}
// -------------------------------------------------------------------------------------------------
// Get information about the contract
get getKeyBlockInfo(): (int, int, int) { loadData(); return (keyBlockSeqNo, keyBlockTime, keyBlockLt); }
get getGlobalId():      int            { loadData(); return storGlobalId;                              }
get getSigningInfo():  (cell, int)     { loadData(); return (validatorKeys, totalWeight);              }
// -------------------------------------------------------------------------------------------------
// Allow calling new key block verification or block checking functions offchain with getters
get testNewKeyBlock(block: cell, signatures: cell): int
    { loadData(); return processNewKeyBlock(block, signatures, true); }
get testCheckBlock (block: cell, signatures: cell, pedantic: int): int
    { loadData(); return processCheckBlock (block, signatures, pedantic); }
get testCombination(keyBlock: cell, keySignatures: cell, block: cell, signatures: cell, pedantic: int): [int, int] {
    loadData(); // Virtually checks and applies new keyBlock, and checks provided block against it
    val keyBlockHash = processNewKeyBlock(keyBlock, keySignatures, true); // virtual
    val blockHash    = processCheckBlock(block, signatures, pedantic);
    return [keyBlockHash, blockHash];
}
