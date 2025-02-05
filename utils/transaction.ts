import { args, lc, ui } from './_superglobals';
import { Address } from '@ton/core';
import { HASH_BYTES, parseFixedLenBinString } from './utils';
import C from 'chalk';
import { getBlock, getMCBlockId, getParsedBlock, getWCBlockId } from './raw_lc';
import { fromRock } from './cellbridge';
import { tonNode_blockIdExt } from 'ton-lite-client/dist/schema';
import { Cell } from '@oraichain/tonbridge-utils/build/types';
import { BlockParser } from '@oraichain/tonbridge-utils/build/blockchain';
import { Cell as TCell } from '@ton/core';
import { beginProof } from './proof';

export type ObtainTransactionOpts = {
    txacc?: Address,
    txseqno?: number,
    txhash?: Buffer,
    txlt?: bigint,
    txshard?: string,
    lcTxPaging?: number,
    txTestAny?: boolean,
}

export async function obtainTransaction(lastBlockId: tonNode_blockIdExt, opts?: ObtainTransactionOpts) {
    // Container in which locate transaction
    let addr = args.txacc ? Address.parse(args.txacc) : (opts?.txacc ?? null);
    let seqno = args.txseqno ? parseInt(args.txseqno) : (opts?.txseqno ?? null);
    // Identifier by which identify transaction
    let hash = args.txhash ? parseFixedLenBinString(args.txhash, HASH_BYTES, 'txhash') : (opts?.txhash ?? null);
    let lt = args.txlt ? BigInt(args.txlt) : (opts?.txlt ?? null);
    let shard = args.txshard ? args.txshard : (opts?.txshard ?? null);
    let resShard: string = ""; // decimal in string
    let fail = false;
    if (shard != null) {
        const UINT64_MAX = BigInt("0xFFFFFFFFFFFFFFFF");
        const POW2_64 = UINT64_MAX + 1n;
        const POW2_63 = POW2_64 / 2n;
        if (/^-?\d{12,}$/.test(shard)) {
            const hexcast = (BigInt(shard) & UINT64_MAX).toString(16);
            if (hexcast.endsWith('0'.repeat(12))) {
                // I don't think we will get 65k+ shards any time soon, really
                let res = BigInt(shard.toString().padEnd(16, '0'));
                if (res >= POW2_63) res -= POW2_64;
                resShard = res.toString();
            }
        }
        if (resShard == "" && /^[0-9a-fA-F]{1,16}$/.test(shard)) {
            let res = BigInt('0x' + shard.toString().padEnd(16, '0'));
            if (res >= POW2_63) res -= POW2_64;
            resShard = res.toString();
        }
        if (resShard == "") {
            ui.write(C.red('Invalid format of the --txshard parameter, supported: full decimal, hexadecimal, or short hexadecimal'));
            ui.write(C.gray('For example, for 0:2000000000000000 you can specify 2305843009213693952, 2000000000000000 or just 2'));
            fail = true;
        }
    }
    // There are quite many possible branches here
    if (args.txdemo || opts?.txTestAny) {
        fail = false;
        addr = null;
        if (!opts?.txTestAny) {
            ui.write(C.magenta(`Transaction demo mode, choosing any transaction from latest masterchain block ${lastBlockId.seqno}.`));
            seqno = lastBlockId.seqno;
            shard = null;
            resShard = "";
        }
        hash = null;
        lt = null;

    } else {
        if (addr == null && seqno == null) {
            ui.write(C.redBright('Either --txacc=<address> or --txseqno=<seqno> must be specified to locate transaction.'));
            ui.write(C.red('Note, that to locate a transaction in basechain (wc=0) with seqno you also need to provide --txshard=<shard> argument.'));
            fail = true;
        }
        if (hash == null && lt == null) {
            ui.write(C.redBright('Either --txhash=<hash> or --txlt=<lt> must be specified to identify transaction.'));
            fail = true;
        }
        if (hash == null && addr == null) {
            ui.write(C.redBright('Only seqno and lt are not enough to uniquely identify transaction, please provide --txhash=<hash> or --txacc=<address>'));
            fail = true;
        }
    }
    if (fail) {
        if (opts?.txTestAny) {
            throw Error('Invalid parameters');
        }
        process.exit(1);
    }
    const hexhash = hash != null ? hash.toString('hex') : null;
    const match = (trx: any) => {
        if (lt != null && BigInt(trx.lt) != lt) {
            return false;
        }
        // noinspection RedundantIfStatementJS
        if (hexhash != null && Buffer.from(trx.hash).toString('hex') != hexhash) {
            return false;
        }
        return true;
    }
    if (seqno != null) {
        // Search in the masterchain block that seqno will resolve - fastest and most reliable
        const blockId = resShard == "" ? await getMCBlockId(seqno) : await getWCBlockId(seqno, resShard);
        const block = await getParsedBlock(blockId);
        const accountMap: Map<string, any> = block.extra.account_blocks.map;
        let accountKeys: MapIterator<string> | string[] = accountMap.keys();
        if (addr != null) {
            if (!accountMap.has(addr.hash.toString('hex'))) {
                ui.write(C.redBright(`Provided account does not have transactions in the specified block`));
                process.exit(1);
            }
            accountKeys = [addr.hash.toString('hex')];
        }
        for (let accountKey of accountKeys) {
            const accBlk = accountMap.get(accountKey).value;
            const trxMap: Map<string, any> = accBlk.transactions.map;
            let trxKeys: MapIterator<string> | string[] = trxMap.keys();
            if (lt != null) {
                trxKeys = trxMap.has(lt.toString(16)) ? [lt.toString(16)] : [];
            }
            for (let trxKey of trxKeys) {
                const trx = trxMap.get(trxKey).value;
                if (match(trx)) {
                    return { tx: await fromRock(trx.cell), blockId };
                }
            }
        }
        ui.write(C.redBright(`Could not find transaction with provided search parameters in the specified block`));
        if (opts?.txTestAny) {
            throw Error('Could not find transaction with provided search parameters in the specified block');
        }
        process.exit(1);
    }
    if (addr != null) {
        // Search by listing account transactions repeatedly and trying to find relevant one
        // N.B. This may fail finding requested transaction depending on liteServer behaviour (encountered that crap with QuarkTON)
        // Note, that block ids and cell roots will be strictly correlated (see validator\impl\liteserver.cpp:1679)
        const accState = await lc.getAccountState(addr, lastBlockId);
        if (accState.lastTx == null) {
            ui.write(C.redBright(`Provided account does not have transactions`));
            process.exit(1);
        }
        let lastTxHash = Buffer.from(accState.lastTx!.hash.toString(16).padStart(64, '0'), 'hex');
        let lastTxLt = accState.lastTx!.lt.toString();
        const paging = opts?.lcTxPaging ?? 50;
        while (true) {
            const getResult = await lc.getAccountTransactions(addr, lastTxLt, lastTxHash, paging);
            if (getResult.ids.length == 0) {
                break;
            }
            // more efficient than calling fromRock every time
            const bag = await Cell.fromBoc(new Uint8Array(getResult.transactions));
            let trx: any = bag[0]; // calm down IDE
            for (let i = 0; i < getResult.ids.length; i++) {
                trx = BlockParser.parseTransaction(bag[i]);
                if (match(trx)) {
                    return { tx: await fromRock(trx.cell), blockId: getResult.ids[i] };
                }
            }
            if (trx.prev_trans_lt.toString() == '0') {
                break;
            }
            lastTxHash = Buffer.from(trx.prev_trans_hash);
            lastTxLt = trx.prev_trans_lt.toString();
            console.log(`next: ${lastTxHash.length}, ${lastTxLt}`);
        }
        ui.write(C.redBright(`Could not find transaction with provided search parameters`));
        process.exit(1);
    }
    throw Error('Unexpected: should not be reached');
}

// In theory, this should be quite easy, since createMerkleProof function supports by-hash tree cutting, and Transaction
// is unique by its contents (it includes some very specific IDs).
// But may also want to try to use liteServer.listBlockTransactions with count 1, wantProof, and after options
export async function makeTransactionProof(tx: TCell, blockId: tonNode_blockIdExt) {
    const block = await getBlock(blockId);
    const cell = TCell.fromBoc(block.data)[0];
    /*
    // Keep the transaction
    const proof = createMerkleProof(cell,
        [cell.refs[0]], // keep block header
        [tx], // keep transaction and subcells
        true, [ cell.refs[0],        // constraint allow block header
                cell.refs[3].refs[2] // constraint allow block -> extra -> account_blocks
        ]);
    */
    const proof = beginProof(cell)
        .include('>0', tx) // keep block header and transaction, but ...
        .requireParent('>0', '>3>2') // constraint allow block header
        // and block -> extra -> account_blocks
        .postExclude(tx) // prune the transaction afterward! just make sure we have path
        .endProof({byHash: true});
    // console.log('tx', tx.hash().toString('hex').toUpperCase());
    // console.log(proof);
    return proof;
    /*
    // That's how it looked before ProofBuilder
    const proof = createMerkleProof(cell,
        [cell.refs[0], tx], [],  // keep block header and transaction, but ...
        true, [ cell.refs[0],    // constraint allow block header
            cell.refs[3].refs[2] // constraint allow block -> extra -> account_blocks
        ], [tx]); // prune the transaction afterward! just make sure we have path
    */
}
