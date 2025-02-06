import "@stdlib/tvm-dicts.tolk"
import "constants.tolk";
import "errors.tolk";
import "lowlevel.tolk";

// valKeyMap: HashMap 256 (pubKey) -> uint64 (weight)
// signatures: ton.blockId, HashMap 256 (pubKey) -> bits512 (signature) - do not forget
// MUST verify that ALL (!!!) provided signatures are correct, ALL are in valKeyMap
// MUST verify that accumulated weight is at least * 2 / 3 of total weight
fun verifySignatures(hash: int, signatures: cell, valKeyMap: cell, valTotalWeight: int) {
    var cs = signatures.beginParse();
    val dict = cs.loadRef();
    var material = cs;

    // we can avoid expensive cell creation if we supply ton.blockId correctly
    // just do rootHash comparison check and that should be enough
    assert(cs.loadUint(32) == TON_BLOCK_ID) throw ERR_INVALID_BLKID_HDR;
    assert(cs.loadUint(256) == hash)        throw ERR_INVALID_ROOT_HASH;
    // we do not have fileHash access at this abstraction / virtualization level, let it be
    assert(cs.getRemainingBitsCount() == 256) throw ERR_INVALID_BLKID_STR; // but check amt of bits
    // N.B. we may prove the filehash from previous KB, but right now it would be a gross overkill
    // because by definition of task we need only to check signatures and correspondence to epoch
    // and "epoch parameters" are defined in contest task as "validators"

    var accWeight = 0;

    var (pubKey, signature, found) = dict.uDictGetFirst(256);
    while (found) {
        val (weight: slice, valFound: int) = valKeyMap.uDictGet(256, pubKey);
        assert(valFound) throw ERR_INVALID_SIGNER;
        assert(isSliceSignatureValid(material, signature, pubKey)) throw ERR_INVALID_SIGNATURE;
        accWeight += weight.preloadUint(64);
        // N.B. we cannot exit as soon as we get enough weight because ALL provided sigs must be OK
        (pubKey, signature, found) = dict.uDictGetNext(256, pubKey);
    }
    // [! PCF !] Proper (strict) comparison without division (Subtle Swallow, Grim Hawk)
    // See crypto\block\check-proof.cpp:659 for reference (note the inverted condition!)
    // In practice this would never happen (because weight calculation and precision "outprecises"
    // both maximum amount of validators and maximum imbalance factor), but for strictly corect
    // logic, it may be reasonable to use strict comparison and avoid division.
    assert(3 * accWeight > 2 * valTotalWeight) throw ERR_NOT_ENOUGH_WEIGHT;
}
