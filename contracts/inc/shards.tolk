import "constants.tolk";
import "errors.tolk";
import "lowlevel.tolk";
import "virtualization.tolk";

// somewhat resembles validateTransactionProof, but with different purpose
fun validateShardProof(proof: slice, hints: slice, prHash: int) {
    // We need JUST to check the proof here. Hash of proof is verified to match the MC Block hash.
    // And the MC block itself would be checked by the LiteClient smart contract.
    proof = proof.ref3().beginParse(); // visit -> extra
    var visitor = proof.ref3();        // visit -> mcBlockExtra, will crash if absent
    // Now we use hints to traverse the HashMap and BinaryTree, because, otherwise, that would
    // require very ineffective search with poking around here and there on prunned branches
    val depth = hints.getRemainingBitsCount() / 2;
    repeat (depth) {
        val i = hints.loadUint(2);
        visitor = visitor.beginParse().refN(i); // advance a step -> observe hinted ref
    }
    var cs = visitor.beginParse();
    // Go through the structure - check some very basic stuff and the root hash
    assert(!cs.loadBool()) throw ERR_SHARD_PROOF_BT_FORK; // expect bt_leaf$0
    val pfx = cs.loadUint(4);                                       // expect shard_descr#b
    assert(pfx == 0xa || pfx == 0xb) throw ERR_SHARD_PROOF_DSC_HDR; //     or shard_descr_new#a
    // Okay, just skip structure parts we do not need to work with
    cs = cs.skipBits(32 + 32 + 64 + 64);
    // Now for the most important part
    val rootHash = cs.loadUint(256);
    assert(rootHash == prHash) throw ERR_SHARD_PROOF_BAD_HASH;
}