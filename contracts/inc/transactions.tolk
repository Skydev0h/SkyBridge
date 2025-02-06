import "constants.tolk";
import "errors.tolk";
import "lowlevel.tolk";
import "virtualization.tolk";

fun validateTransactionProof(proof: slice, hints: slice, txHash: int) {
    // If any of the cells in chain does not exist or is prunned we will get TVM error. Safe.
    proof = proof.ref3().beginParse(); // visit -> extra
    // While we are here, at the extra level, we can immediately check whether this is a MC block
    // You see, while block header can be prunned, extra will have custom:(Maybe ^McBlockExtra)
    //   if, and only if, this is a masterchain block. So we can count refs to check it out.
    val isMCBlock = proof.getRemainingRefsCount() == 4;
    // ^InMsgDescr ^OutMsgDescr ^ShardAccountBlocks, and, finally, (Maybe ^McBlockExtra)
    var visitor = proof.ref2(); // visit -> account_blocks, but do not do ctos yet
    // at this moment we can only traverse account_blocks tree and nested transactions one
    // therefore, there is no security implications or weaknesses from allowing any ref idx hints
    val depth = hints.getRemainingBitsCount() / 2;
    repeat (depth) {
        val i = hints.loadUint(2);
        var cs = visitor.beginParse();
        // [! PCF !] Prevent hints from burrowing into transactions. More details below.
        if (cs.getRemainingRefsCount() == 3) {
            assert(cs.preloadUint(4) != 7) throw ERR_BURROWING_INTO_TX;
        }
        visitor = cs.refN(i); // advance a step -> observe hinted ref
    }
    hints.assertEndOfSlice(); // make sure there is no extra bit at the end
    // right now we must be looking at our transaction OR at a prunned branch. prepare unvirt tools!
    val observedHash = extractVirtHashMPB(visitor);
    assert(observedHash == txHash) throw ERR_TX_HASH_INVALID;
    return isMCBlock;
}

// [! PCF !] Prevent hints from burrowing into transactions to prevent a possible
//           transaction forging by creating a transaction cell in a message body
// Some considerations:
// Transaction:
//     begins with $0111 = #7
//     has exactly 3 refs: ^[ (dangerous) ], state_update and description
// AccountBlock:
//     begins with #5 = $0101
//     can have 1 refs if there are no transactions
//     can have 2 refs if there is 1 transaction
//     can have 3 refs if there are 2 or more transactions
// HashMap / HashMapAug nodes:
//     can have no more than 2 refs
// No other cells in tree can be dangerous rather than burrowing into Transaction msgs
// Solution: check amount of refs, and if equal to 3, check prefix