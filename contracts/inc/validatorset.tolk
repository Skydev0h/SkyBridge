import "@stdlib/tvm-dicts.tolk"
import "constants.tolk";
import "errors.tolk";
import "lowlevel.tolk";

// validatorsMap: HashMap 256 (pubKey) -> uint64 (weight), totalWeight
fun parseValidatorSet(p34: cell, onlyMain: int): (cell, int) {
    var s = p34.beginParse();
    val typ = s.loadUint(8);
    assert(typ == 0x11 || typ == 0x12)  // validators#11 | validators_ext#12
        throw ERR_BAD_VSET_TYPE;
    s = s.skipBits(64);                 // utime_since:uint32 utime_until:uint32
    // ^ if validators are in p34 then they are already current and utime_until is not guaranteed
    val total = s.loadUint(16);         // total:(## 16)
    val main = s.loadUint(16);          // main:(## 16)
    assert(main <= total)               // { main <= total }
        throw ERR_MAIN_GT_TOTAL;
    assert(main >= 1)                   // { main >= 1 }
        throw ERR_MAIN_IS_ZERO;
    // we do not actually care for total_weight, because we need total_weight of MC validators only

    // The Elector GUARANTEES ordering by weight... so we need to just take top entries
    // See crypto/smartcont/elector-code.fc:704 for ordering by (ab)using dict keys
    //   (basically, ordered by stake DESC, time ASC, pubkey DESC in this specific priority)

    // How ironical... in Task 1 I have noticeably optimized unpack_validator_set by removing
    // iter-walk by keys (in favor of check_for_each), but in TVM I HAVE TO do such walk T_T

    val list = s.loadRef();             // list:(Hashmap | HashmapE 16 ValidatorDescr)
    // The only difference between Hashmap and HashmapE, is that later one is optional reference

    var result = createEmptyDict();
    var i = 0; var totalWeight = 0;     // So far no multiple var declarations with comma e_e

    val iters = onlyMain ? main : total;  // Make function more universal if it be useful in future

    // Config::unpack_validator_set at crypto\block\mc-config.cpp:487 may be useful as reference
    // Pick <iters = main / total> top entries from the list
    repeat (iters) {
        var (vd, found) = list.uDictGet(16, i);
        assert(found) throw ERR_VSET_DICT_HOLE;
        val vtyp = vd.loadUint(8);
        assert(vtyp == 0x53 || vtyp == 0x73)   // validator#53 | validator_addr#73
            throw ERR_BAD_VAL_TYPE;            // also see crypto/smartcont/elector-code.fc:144-151
        assert(vd.loadUint(32) == TD_PUB_KEY)  // ## ed25519_pubkey#8e81278a
            throw ERR_PUBKEY_TD_ID;
        // val pubKey = vd.loadBits(256);         // ## pubkey:bits256
        val pubKey = vd.loadUint(256);         // ## pubkey:bits256
        val weight = vd.loadUint(64);          // weight:uint64
        // dont care about adnl_addr:bits256 in type 73 for this task
        // val nodeId = sha256s2i("c6b41348"s, pubKey);
        totalWeight += weight;
        // result.uDictSetBuilder(256, nodeId, beginCell().storeSlice(pubKey).storeUint(weight, 64));
        result.uDictSetBuilder(256, pubKey, beginCell().storeUint(weight, 64));
        // ^^^ In case of emergency, break glass, pull out the wires!
        // N.B. Moved as much computations as possible outside of the blockchain
        // Scripts take care of resolving NodeID -> PubKey stuff instead of hashing here or worse
        i += 1;
    }

    return (result, totalWeight);
}
