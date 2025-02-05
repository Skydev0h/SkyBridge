tolk 0.6
///////////////////////////////////////////////////////////////////////////////////////
// Transaction checker contract // https://contest.com/docs/TrustlessBridgeChallenge //-------------
///////////////////////////////////////////////////////////////////////////////////////
/* There are several implications on writing this smart contract.
   First and foremost separating LiteClient and TransactionChecker introduces unnecessary complexity
   and engineering hell. Since the contest requires it this way, it must be obeyed, however, there
   are several things, that need to be taken into account, that makes it much more complex:
   1. There are no rejection messages provisioned by the rules, and, if message is bounced, there is
      not enough data to properly send it back without resorting to temporary hashmap storage, that
      is very dangerous and morally forbidden in TON. Therefore, an extra operation was added to LC
      SC contract for this.
   2. Another approach would be to use a temporary contract for each request, but that would be even
      much more inefficient, overengineered, and error-prone than adding a contract-friendly method
      to LiteClient SC, and would need storing a lot of unnecessary data and logic here.
   3. The best approach would be to MERGE these two contracts, but, I can assume, that masterminds
      (no irony or pun intended) who written the contest rules expect expansion of the system in
      the future, and it would be difficult to do, if each extension would require contract changes,
      and there would be TONs of LiteClients that must maintain synchronization. Therefore, I can
      assume, that central LiteClient with periphery checker contracts is a viable, although quite
      less optimal (slower, and more expensive) approach than unification.
   4. Thinking further, the most efficient approach would be an extensible LiteClient, which would
      be able to support dynamically installable and removable in-contract plugins, but that
      introduces an aspect of centralization (although, because of the magnificient RUNVM sandboxed
      execution command, trust can be still preserved - that is, Integrity aspect is kept even in
      this way, only Availability may be at some risk) since there must be some restriction who can
      install and remove plugins, even if they are properly shielded and sandboxed when executed.
      But that fantastic idea is way too much for this contest task requirements e_e. On the other
      hand, most likely, it is in the interest of the sidechain TVM network owner to create and
      maintain a pair of LiteClients linking their network, so, such trustless centralization
      aspect would not be putting the security of this link at risk. Maybe worth thinking about it.
   5. Lastly, concerning points 1-2, it is also necessary to introduce a special failed response to
      both LC and this contract, because it is physically not possible to throw if executing another
      contract is necessary. Therefore, new response types were introduced. For the integrity, such
      responses are always used in this contract, and for additional method of LC contract.
*/
// -------------------------------------------------------------------------------------------------
import "inc/constants.tolk";
import "inc/errors.tolk";
import "inc/lowlevel.tolk";
import "inc/message.tolk";
import "inc/shards.tolk";
import "inc/transactions.tolk";
import "inc/virtualization.tolk";
// -------------------------------------------------------------------------------------------------
global liteClientAddress_: slice;
// -------------------------------------------------------------------------------------------------
@inline // very small
fun loadData() {
    var ds = getContractData().beginParse();
    // There is no need for Contract ID, as the contract is completely stateless!
    liteClientAddress_ = ds.loadAddress();
    // ds.assertEndOfSlice();
    // But for sharding purposes it may be possible to create multiple copies by adding more data
    // after the liteClientAddress_. Thats why the line above is commented!
    return ds; // <- does not cause implications, it has to be dropped anyway if unused e_e
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

    // N.B. Contrary to the usual agreements, TLB for this SC dictates no query_id for the call
    // val queryId = msgBody.loadMessageQueryId();

    if (op == OP_SIMPLE_TRANSFER) { return; } // simple transfer with comment

    if (op == OP_CHECK_TRANSACTION) {
        val transaction  = msgBody.loadRef();
        val proof        = msgBody.loadRef();
        val currentBlock = msgBody.loadRef();
        msgBody.assertEndOfSlice();
        // It may be better to doCheckTransaction first, and then pass currentBlock to liteClient
        // contract (if configured) for block signatures / validity checking
        try {
            val (block, signatures, pedantic) = doCheckTransaction(transaction, proof, currentBlock);
            if (liteClientAddress_.addressIsNone()) { // ^ DTC checks for match of block and proof
                // If LC is NOT configured, signatures MUST NOT be provided
                assert(signatures == null) throw ERR_NO_LITE_CLIENT_SUPP;
                assert(pedantic == false)  throw ERR_NO_LITE_CLIENT_SUPP;
                // Obviously, if pedantic mode is on, we expect LC, and, well, more pedantic checks
                sendResponse(sender, RE_TRANSACTION_CHECKED, transaction, 0);
            } else {
                // If LC is configured, block and signatures MUST be provided
                assert(block      != null) throw ERR_MISSING_BLOCK;
                assert(signatures != null) throw ERR_MISSING_SIGNATURES;
                sendRequestToLiteClient(sender, transaction, block, signatures, pedantic);
            }
            // ^^ Such harsh checks are added to prevent possible insecurities by sending message to the
            //    wrong TransactionChecker, if we expect it to check against LC, or expect it doesn't.
        } catch (e) {
            sendResponse(sender, RE_TRANS_FAILED_CHECK, transaction, e);
        }
        return;
    }

    if (op == RE_CORRECT_EX) {
        assert(isSliceBitsEqual(sender, liteClientAddress_)) throw ERR_INVALID_SENDER;
        msgBody = msgBody.skipBits(64 + 256); // don't need query_id and block_hash in this case
        var extraInfo = msgBody.loadRef().beginParse();
        msgBody.assertEndOfSlice();
        val instigator = extraInfo.loadAddress();
        val transaction = extraInfo.loadRef();
        extraInfo.assertEndOfSlice();
        sendResponse(instigator, RE_TRANSACTION_CHECKED, transaction, 0);
        return;
    }

    if (op == RE_INCORRECT_EX) {
        assert(isSliceBitsEqual(sender, liteClientAddress_)) throw ERR_INVALID_SENDER;
        msgBody = msgBody.skipBits(64); // don't need query_id
        val errCode = msgBody.loadUint(16);
        var extraInfo = msgBody.loadRef().beginParse();
        msgBody.assertEndOfSlice();
        val instigator = extraInfo.loadAddress();
        val transaction = extraInfo.loadRef();
        extraInfo.assertEndOfSlice();
        sendResponse(instigator, RE_TRANS_FAILED_CHECK, transaction, errCode);
        return;
    }

    throw ERR_UNKNOWN_OP;
}
// -------------------------------------------------------------------------------------------------
fun doCheckTransaction(transaction: cell, proofWithHints: cell, currentBlock: cell) {
    val (_, txHash) = unvirtMerkleProof(transaction);
    var phcs = proofWithHints.beginParse();
    val proofCell = phcs.loadRef();
    val (prSlice, prHash) = unvirtMerkleProof(proofCell);
    assert(prSlice != null) throw ERR_TX_PROOF_PRUNED;
    var hints = phcs; // remainder: hints:(VarLen uint2)
    var cbc = currentBlock.beginParse();
    val block = cbc.loadMaybeRef();
    val signatures = cbc.loadMaybeRef();
    val shardProof = cbc.loadMaybeRef();
    val pedantic = cbc.loadBool();
    val shardHints = cbc;
    assert(shardHints.isEndOfSliceRefs()) throw 9; // partial assert end of slice
    // Step 1: check that proof actually proofs the transaction
    val isMCBlock = validateTransactionProof(prSlice, hints, txHash);
    // Step 2: if, and only if, block is not null
    // - For MC block - check match of proof <-> currentBlock->block
    // - For SC block - check match of cB->block <-> cB->shardProof, and shardProof for block
    if (block != null) {
        // if the block is null and we have LCA, we will fail later in caller function
        val (_, blHash) = unvirtMerkleProof(block);
        if (isMCBlock) {
            // Merkle trust chain: block ~= proof -~> transaction
            assert(shardProof == null)        throw ERR_EXTRA_SHARD_PROOF;
            assert(shardHints.isEndOfSlice()) throw ERR_EXTRA_SHARD_HINTS;
            assert(prHash == blHash)          throw ERR_INCORRECT_BLOCK;
        } else {
            // Merkle trust chain: block ~= shardProof -~> proof -~> transaction
            assert(shardProof != null) throw ERR_MISSING_SHARD_PROOF;
            val (spSlice, spHash) = unvirtMerkleProof(shardProof);
            assert(spHash == blHash) throw ERR_DEVIANT_SHARD_PROOF;
            // ^ shard proof must be proof from same MC block, just different perspective (prunes)
            validateShardProof(spSlice, shardHints, prHash);
        }
        // This contract does not have expertise to do further checks on the MC block
        // Since by definition of LC "Block in check_block message may have all unused branches
        // pruned.", we can check everything but the master block. LC will do that check, if set.
    }
    return (block, signatures, pedantic);
}
// -------------------------------------------------------------------------------------------------
@inline
fun sendResponse(recipient: slice, opCode: int, transaction: cell, error_code: int) {
    var msg: builder = beginCell().storeMessageOp(opCode).storeRef(transaction);
    if (error_code != 0) {
        msg = msg.storeUint(error_code, 16);
    }
    sendMsg(recipient, msg, 0);
}
// -------------------------------------------------------------------------------------------------
fun sendRequestToLiteClient(instigator: slice, transaction: cell, block: cell, signatures: cell,
                            pedantic: int) {
    var msg: builder = beginCell()
        .storeUint(BOUNCEABLE, 6)
        .storeSlice(liteClientAddress_).storeUint(0, 4 + 1 + 4 + 4 + 64 + 32 + 1 + 1)
        .storeMessageOp(OP_CHECK_BLOCK_EX).storeMessageQueryId(now())
        .storeRef(block).storeRef(signatures).storeRef(
            beginCell().storeSlice(instigator).storeRef(transaction).endCell()
        ).storeBool(pedantic);
    val (wc, _) = parseStandardAddress(getMyAddress());
    reserveToncoinsOnBalance(MAINTAIN_STORAGE * (wc == MASTERCHAIN ? 10 : 1), RESERVE_MODE_AT_MOST);
    return sendMessage(msg.endCell(), SEND_MODE_CARRY_ALL_BALANCE | SEND_MODE_IGNORE_ERRORS);
}
// -------------------------------------------------------------------------------------------------
get getContractExtraNonce(): slice { return loadData(); }
get getLiteClientAddress(): slice { loadData(); return liteClientAddress_; }
get testLocalCheckTransaction(transaction: cell, proof: cell, currentBlock: cell): (cell, cell, int)
    { loadData(); return doCheckTransaction(transaction, proof, currentBlock); }
// To rock these PROPERLY, first, check getLiteClientAddress, then call testLocalCheckTransaction
// If the address is not none, and return values are not null, run getter on that LiteClient
