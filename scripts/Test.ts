// noinspection JSUnusedLocalSymbols,ES6UnusedImports

import { NetworkProvider } from '@ton/blueprint';
import { getOtherRawLC } from '../utils/cli';
import {
    inferGlobalId,
    init,
    startUpLC
} from '../utils/high_level';
import { makeTransactionProof, obtainTransaction } from '../utils/transaction';
import { prepareNavigationHints } from '../utils/hints';
import { getShardProof } from '../utils/raw_lc';
import TonRocks from '@oraichain/tonbridge-utils';
import { toRock } from '../utils/cellbridge';
import { Cell } from '@ton/core';
import { prepareShardProof } from '../utils/shard';

// noinspection JSUnusedGlobalSymbols
export async function run(np: NetworkProvider, arglist: string[]) {
    init(np, arglist, "Test");
    const globalId = await inferGlobalId(false);

    const lc = await getOtherRawLC(globalId);
    const { lastBlockId, lastBlockHdr } = await startUpLC(globalId);

    const { tx, blockId } = await obtainTransaction(lastBlockId);
    const proof = await makeTransactionProof(tx, blockId);
    const hints = prepareNavigationHints(proof.refs[0].refs[3].refs[2], tx);
    /*
    console.log(TonRocks.bc.BlockParser.parseBlock(await toRock(proof.refs[0])).extra.account_blocks.map
        .get('3333333333333333333333333333333333333333333333333333333333333333').value.transactions
        .map.get('8e23348301').value);
    */
    console.log(proof);
    console.log('');
    console.log(tx.hash().toString('hex').toUpperCase());
    console.log('');
    console.log(hints);
    console.log('');
    console.log(blockId);

    const shardProof = await getShardProof(blockId);
    console.log(shardProof);
    console.log(Cell.fromBoc(shardProof.links[0].proof));

    console.dir(TonRocks.bc.BlockParser.parseBlock(await toRock(Cell.fromBoc(shardProof.links[0].proof)[0].refs[0]))
        .extra.custom.shard_hashes.map.get('0').left.left);

    await prepareShardProof(blockId);


    /*
    console.log('Found transaction');
    console.log(tx);
    console.log(blockId);
    */

    // const blkid = await getMCBlockId(435620);
    // const blk = await getParsedBlock(blkid);
    // const fblk = await getBlock(blkid);
    // const cblk = Cell.fromBoc(fblk.data)[0];

    /*
    console.log(
        blk.extra.account_blocks.map
            .get('3333333333333333333333333333333333333333333333333333333333333333')
            .value.transactions.map.get('7c26bf0e82')
            .value
    );
    process.exit(0);

    const sab = cblk.refs[3].refs[2];
    const dcell = sab.refs[0];
    const dict = Dictionary.load(Dictionary.Keys.BigUint(256), SliceDictVal, sab);
    const b = beginCell();
    dict.storeDirect(b);
    console.log(dcell.bits.toString());
    console.log(b.endCell().bits.toString());
    */


    /*
    for (let k of dict.keys()) {
        const v = dict.get(k)!;
        console.log('----------------------------------');
        console.log(k.toString());
        console.log(v);
        console.log(v.loadCoins(), v.loadMaybeRef()); // CurrencyCollection
        v.loadUint(4); // prefix
        console.log(v.loadUintBig(256).toString(16));
        const trxdict = Dictionary.loadDirect(Dictionary.Keys.BigUint(64), SliceDictVal, v);
        // CurrencyCollection and ^Transaction
        console.log(trxdict);
    }
    */
    // console.log(dict);


    /*
    const addr = np.sender().address!;
    const acc = await lc.getAccountState(addr, lastBlockId);
    const hash: Buffer = Buffer.from(acc.lastTx!.hash.toString(16).padStart(64, '0'), 'hex');
    const txraw = await lc.getAccountTransactions(addr, acc.lastTx!.lt.toString(), hash, 10);
    const bag = await Cell.fromBoc(new Uint8Array(txraw.transactions));
    console.log(bag);
    // const txs = Cell.fromBoc(txraw.transactions);
    // console.log(txraw.ids[0]);
    console.log(BlockParser.parseTransaction(bag[0]));
    */

}
