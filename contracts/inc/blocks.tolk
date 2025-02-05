import "@stdlib/tvm-dicts.tolk"
import "constants.tolk";
import "errors.tolk";
import "lowlevel.tolk";

// No need to be too pedantic with structural checks because the blocks must be signed by relevant
// validators anyway. Just get all the data needed for our checks and functionality, skip others.

// seqno, time, lt, global id, prev key seqno, is keyblock
fun parseMasterBlock(block: slice): (int, int, int, int, int, int) {
    assert(block.loadUint(32) == TD_BLOCK)       //    block#11ef55aa
        throw ERR_BLOCK_TD_ID;

    val globalId = block.loadInt(32);            // << global_id:int32
    var info = block.loadRef().beginParse();     //    info:^BlockInfo

    assert(info.loadUint(32) == TD_BLOCK_INFO)   //    block_info#9bc7a987
        throw ERR_BLKINFO_TD_ID;
    info = info.skipBits(32);                    //    version:uint32
    assert(!info.loadBool())                     //    not_master:(## 1)
        throw ERR_BLK_NOT_MASTER;
    info = info.skipBits(5);                     //    after_merge:(## 1) before_split:(## 1)
    //                                           //    after_split:(## 1) want_split:Bool want_merge:Bool
    val isKeyBlock = info.loadBool();            // << key_block:Bool
    info = info.skipBits(9);                     //    vert_seqno_incr:(## 1) flags:(## 8)
    val seqno = info.loadUint(32);               // << seq_no:#
    info = info.skipBits(32 + 2 + 6 + 32 + 64);  //    vert_seq_no:#, shard:ShardIdent
    val time = info.loadUint(32);                // << gen_utime:uint32
    val lt = info.loadUint(64);                  // << start_lt:uint64
    info = info.skipBits(64 + 32 + 32 + 32);     //    end_lt:uint64 gen_validator_list_hash_short:uint32
    //                                           //    gen_catchain_seqno:uint32 min_ref_mc_seqno:uint32
    val prevKeySeqno = info.loadUint(32);        // << prev_key_block_seqno:uint32

    // Other fields are not interesting, especially if we skipped over flags

    return (seqno, time, lt, globalId, prevKeySeqno, isKeyBlock);
}

// seqno, time, lt, global id, prev key seqno, p34
fun parseKeyBlock(block: slice): (int, int, int, int, int, cell) {
    val (seqno, time, lt, globalId, prevKeySeqno, isKeyBlock) = parseMasterBlock(block);
    assert(isKeyBlock) throw ERR_BLK_NOT_KEYBLK;

    // ... info:^BlockInfo value_flow:^ValueFlow state_update:^(...) extra:^BlockExtra = Block;
    //     ^0              ^1                    ^2      >> Pick ref ^3 skipping others <<
    var extra = block.ref3().beginParse();

    assert(extra.loadUint(32) == TD_BLOCK_EXTRA)  // !!! block.tlb seems to be missing #4a33f6fd
        throw ERR_BLKEXTRA_TD_ID;                 //     see Collator::create_block_extra for reference
    extra = extra.skipBits(256 + 256);            // rand_seed:bits256 created_by:bits256
    assert(extra.loadBool())                      // custom:(Maybe ^McBlockExtra)
        throw ERR_NO_MCBLKEXTRA;

    // ... in_msg_descr:^InMsgDescr out_msg_descr:^OutMsgDescr account_blocks:^ShardAccountBlocks custom:(Maybe ^McBlockExtra) = BlockExtra
    //     ^0                       ^1                         ^2                     >> Pick ref ^3 skipping others <<
    var mcex = extra.ref3().beginParse();

    assert(mcex.loadUint(16) == TD_MC_BLK_EXTRA)  // masterchain_block_extra#cca5
        throw ERR_MCBLKEX_TD_ID;
    assert(mcex.loadBool())                       // key_block:(## 1)
        throw ERR_MCBE_NOT_KEYBL;
    // shard_hashes:ShardHashes shard_fees:ShardFees ^[...] config:key_block?ConfigParams
    // ^0?OptRef                ^1?OptRef            ^0-
    // _ config_addr:bits256 config:^(Hashmap 32 ^Cell) = ConfigParams;

    val refs = mcex.getRemainingRefsCount();  // skip over all refs, we need only last one
    val conf = mcex.refN(refs - 1);           // <-- config:^(Hashmap 32 ^Cell)

    val (p34, found) = conf.uDictGetRef(32, 34);  // Get ConfigParam34 (current validator set)
    assert(found) throw ERR_CP34_NOT_FOUND;

    return (seqno, time, lt, globalId, prevKeySeqno, p34);
}

fun blockInfoAvailable(block: slice): int {
    if (block == null) {
        return false; // block is a prunned branch
    }

    assert(block.preloadUint(32) == TD_BLOCK)  // block#11ef55aa
        throw ERR_BLOCK_TD_ID;

    val infoRef = block.preloadRef();          // info:^BlockInfo
    var (xcs, exotic) = infoRef.beginParseExotic();
    if (exotic) {
        assert(xcs.preloadUint(8) == XCELL_PRUNED_BRANCH)
            throw ERR_UNEXPECTED_EXOTIC;       // merkles and libaries are not expected here!
        return false;
    }
    return true;
}
