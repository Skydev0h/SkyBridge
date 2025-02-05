import { tonNode_blockIdExt } from 'ton-lite-client/dist/schema';
import { getShardProof } from './raw_lc';
import { Cell, CellType } from '@ton/core';
import { lc, ui } from './_superglobals';
import C from 'chalk';
import { prepareNavigationHints } from './hints';

export async function prepareShardProof(blockId: tonNode_blockIdExt) {
    const shardProof = await getShardProof(blockId);
    const mcBlock = await lc.getBlockHeader(shardProof.masterchainId);
    if (shardProof.links.length > 1) {
        ui.write(C.red('Block is not yet committed to the masterchain, please try again later.'))
        throw Error('Multiple proof links are not supported for security reasons, wait for the containing block to ' +
            'be directly committed to the masterchain block.');
        // This happens only with the latest transactions, and it is better to stay away from them until they are committed to MC.
    }
    const mcBlockCell = Cell.fromBoc(mcBlock.headerProof)[0];
    const root = Cell.fromBoc(shardProof.links[0].proof)[0];
    const mcBlkExtra = root.refs[0].refs[3].refs[3];
    // Perform search and pattern matching.
    // Desired block starts with bt_leaf$0 (1 bit) shard_descr#b (4 bits), seq_no (32 bits), mc seq_no (32 bits),
    // then skip 128 bits (start_lt, end_lt not known right now), root_hash (256 bits) and file_hash (256 bits)
    // Lite server always returns one branch, so there should be no problems with that.
    // And in ALL cases - if liteServer returns crap, that will be rejected by the SC
    function match (cell: Cell): boolean {
        if (cell.type != CellType.Ordinary) {
            return false; // prunned branches - immediately, no, please
        }
        if (cell.bits.length < 1 + 4 + 32 + 32 + 64 + 64 + 256 + 256) {
            return false; // not even looking at such
        }
        // We can extract and check root_hash right away, for simplicity
        return cell.beginParse().skip(1 + 4 + 32 + 32 + 64 + 64).loadBuffer(32).equals(blockId.rootHash);
        // SAFE, both shard_descr#b and shard_descr_new#a are same in this regard.
    }
    function traverse(cell: Cell): Cell | null {
        if (match(cell)) {
            return cell;
        }
        for (const item of cell.refs) {
            const result = traverse(item);
            if (result) {
                return result;
            }
        }
        return null;
    }
    const result = traverse(mcBlkExtra);
    if (!result) {
        ui.write(C.redBright(`FATAL: Unexpected, could not find ShardDescr in presented proof. LiteServer misbehaving!`));
        process.exit(1);
    }
    const hints = prepareNavigationHints(mcBlkExtra, result);
    if (!hints) {
        ui.write(C.redBright(`Could not build hints, this should never happen`));
        process.exit(1);
    }
    return { mcBlock: mcBlockCell, shardProof: root, hints, mcBlkId: shardProof.masterchainId };
}