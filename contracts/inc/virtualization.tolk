import "constants.tolk";
import "errors.tolk";
import "lowlevel.tolk";

// IMPORTANT: Pruned branches CANNOT exist outside of MerkleProofs and MerkleUpdates!
// Otherwise virtualization level of BoC root will be > 0 and this will cause the following error:
//     "bag of cells has a root with non-zero level"
// BUT: it is possible to create a MINIMAL MerkleProof -> PrunedBranch proof

// In theory this can be Merkle Proof with prunned branches or the full cell itself - any option
// is supported, which gives MAXIMUM possible flexibility and ease of use for users! ^_^
fun unvirtMerkleProof(c: cell): (slice, int) {
    var (xcs, exotic) = c.beginParseExotic();
    if (exotic) {
        assert(xcs.loadUint(8) == XCELL_MERKLE_PROOF)
            throw ERR_UNEXPECTED_EXOTIC;
        val hash = xcs.loadUint(256);
        var (slic, xin) = xcs.loadRef().beginParseExotic();
        if (xin) {
            // Minimum MerkleProof -> PrunedBranch proof
            assert (slic.loadUint(8) == XCELL_PRUNED_BRANCH)
                throw ERR_UNEXPECTED_EXOTIC;
            val lm = slic.loadUint(8);
            assert(lm & 1) throw ERR_PRUNED_NO_LEVEL_1;
            assert(slic.loadUint(256) == hash)
                throw ERR_MERKLE_PRUNE_HASH;
            return (null, hash);
        }
        return (slic, hash);
    }
    return (xcs, c.cellHash());
}

// On the other hand, this function may be used to extract hash from prunned branch in tree
fun extractVirtHashMPB(c: cell): int {
    var (xcs, exotic) = c.beginParseExotic();
    if (exotic) {
        assert(xcs.loadUint(8) == XCELL_PRUNED_BRANCH)
            throw ERR_UNEXPECTED_EXOTIC;
        val lm = xcs.loadUint(8);
        assert(lm & 1) throw ERR_PRUNED_NO_LEVEL_1;
        // Can only extract hash if level 1 is significant in level mask
        return xcs.preloadUint(256);
    }
    // ordinary. and boring. repr hash.
    return c.cellHash();
}
