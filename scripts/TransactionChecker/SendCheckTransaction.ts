import { NetworkProvider } from '@ton/blueprint';
import {
    inferGlobalId, inferMsgValue, inferPedanticFlag,
    init, preflightError, preflightResCheck, prepareBlockSignatures,
    prepareMCBlockData,
    resolveContractState,
    startUpLC
} from '../../utils/high_level';
import { getOtherRawLC, getTransactionChecker } from '../../utils/cli';
import { makeTransactionProof, obtainTransaction } from '../../utils/transaction';
import { prepareNavigationHints } from '../../utils/hints';
import { Cell, loadTransaction } from '@ton/core';
import { intHashToHex, retry, undefiner } from '../../utils/utils';
import C from 'chalk';
import { args, lcsc } from '../../utils/_superglobals';
import { waitForSomething } from '../../utils/ui';
import { prepareShardProof } from '../../utils/shard';
import { tonNode_blockIdExt } from 'ton-lite-client/dist/schema';
import { maybeShowHelpTexts } from '../../utils/help_texts';

// noinspection JSUnusedGlobalSymbols
export async function run(np: NetworkProvider, arglist: string[]) {
    const { ui } = init(np, arglist, "SendCheckTransaction");

    const tcsc = await getTransactionChecker();
    const messageValue = inferMsgValue("0.2");
    const lcAddress = await tcsc.getLiteClientAddress();
    const globalId = await inferGlobalId(false, false);
    const pedantic = inferPedanticFlag();

    /* const lc = */ await getOtherRawLC(globalId);
    const { lastBlockId } = await startUpLC(globalId);
    maybeShowHelpTexts('TransactionChecker/SendCheckTransaction');

    const { tx, blockId: txBlkId } = await obtainTransaction(lastBlockId);
    const proof = await makeTransactionProof(tx, txBlkId);
    const hints = prepareNavigationHints(proof.refs[0].refs[3].refs[2], tx);
    if (!hints) {
        ui.write(C.redBright(`Failed to prepare hints`));
        process.exit(1);
    }
    if (args.deb_bad_hint) {
        ui.write(C.redBright(`Warning: Debug option bad hints active, hints will be corrupted`));
        ui.write(C.yellowBright(`Removing latest hint entry...`));
        hints.pop();
    }

    let blockProof: Cell | null = null;
    let blockSignatures: Cell | null = null;
    let blockHash: Buffer | null = null;

    let shardProof: Cell | null = null;
    let shardProofHints: number[] | null = null;

    if (lcAddress != null) {
        if (txBlkId.workchain == -1) {
            ({ blockProof, blockHash } = await prepareMCBlockData(txBlkId));
            blockSignatures = await prepareBlockSignatures(txBlkId, true, true);
        } else {
            let mcBlkId: tonNode_blockIdExt;
            ({ mcBlock: blockProof, shardProof, hints: shardProofHints, mcBlkId } = await prepareShardProof(txBlkId));
            blockSignatures = await prepareBlockSignatures(mcBlkId, true, true);
            blockHash = Buffer.from(mcBlkId.rootHash);
        }
    }

    const { cp, cs } = await resolveContractState(false, 'TransactionChecker');

    const params = {
        value: messageValue,
        transaction: tx,
        transactionProof: proof,
        transactionProofHints: hints,
        masterChainBlock: undefiner(blockProof),
        mcBlockSignatures: undefiner(blockSignatures),
        shardProof: undefiner(shardProof),
        shardProofHints: undefiner(shardProofHints),
        pedantic: pedantic
    };

    try {
        ui.write(C.cyan(`Performing preflight check...` + (lcAddress ? ' (Step 1/2)' : '')));
        const testResult = await tcsc.getTestLocalCheckTransaction(params);
        if (testResult.block == null || testResult.signatures == null) {
            ui.write(C.green(`Preflight check succeeded (simple, on TC)`));
        } else {
            ui.write(C.cyan(`Performing preflight check... (Step 2/2)`));
            const testResult2 = await lcsc.getTestCheckBlock({block: testResult.block,
                signatures: testResult.signatures, pedantic: testResult.pedantic});
            preflightResCheck(intHashToHex(testResult2), blockHash!.toString('hex'),
                "result hash doesn't match", ' (advanced, on TC and then on LC)');
        }
    } catch (e: any) {
        preflightError(e);
    }

    if (!args.locally && !args.local) {
        ui.write(C.gray(`Hint: You may use --locally flag to only execute preflight getter, without sending transaction.`));

        await tcsc.sendCheckTransaction(np.sender(), params);

        await waitForSomething(cp, cs, "processing");

        ui.write(C.yellowBright(`--- Current contract state:`));
        await retry(() => tcsc.getAndPrintContractState());
    } else {
        ui.write(C.gray(`Not sending transaction because --locally flag is set.`));
    }
}