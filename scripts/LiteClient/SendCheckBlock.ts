import { NetworkProvider } from '@ton/blueprint';
import { intHashToHex, retry } from '../../utils/utils';
import C from 'chalk';
import { checkMyBalance, getLiteClient, getOtherRawLC } from '../../utils/cli';
import { waitForSomething } from '../../utils/ui';
import { printLiteClientConfigFull } from '../../wrappers/LiteClient';
import {
    inferBlockSeqno,
    inferMsgValue, inferPedanticFlag, init, preflightError, preflightResCheck,
    prepareBlockSignatures,
    prepareMCBlockData,
    resolveContractState, startUpLC
} from '../../utils/high_level';
import { args } from '../../utils/_superglobals';
import { maybeShowHelpTexts } from '../../utils/help_texts';

// noinspection JSUnusedGlobalSymbols
export async function run(np: NetworkProvider, arglist: string[]) {
    const { ui } = init(np, arglist, "SendCheckBlock");
    maybeShowHelpTexts('LiteClient/SendCheckBlock');

    const lcsc = await getLiteClient();

    const messageValue = inferMsgValue("0.2");
    const userSeqno = inferBlockSeqno();
    const pedantic = inferPedanticFlag();
    await checkMyBalance(messageValue);

    const state = await retry(() => lcsc.getFullConfig());
    ui.write(C.cyanBright(`Current contract state:`));
    printLiteClientConfigFull(state);

    /* const lc = */ await getOtherRawLC(state.globalId);
    const { lastBlockId } = await startUpLC(state.globalId);
    const targetSeqno = userSeqno != 0 ? userSeqno : lastBlockId.seqno;
    const { blockId, blockProof, blockHash } = await prepareMCBlockData(targetSeqno, !args.inclhdr);
    const signatures = await prepareBlockSignatures(blockId, true, true);

    const { cp, cs } = await resolveContractState(false, 'LiteClient');

    try {
        const testResult = await lcsc.getTestCheckBlock({block: blockProof, signatures: signatures});
        preflightResCheck(intHashToHex(testResult), blockHash.toString('hex'), "result hash doesn't match");
    } catch (e: any) {
        preflightError(e);
    }

    if (!args.locally && !args.local) {
        ui.write(C.gray(`Hint: You may use --locally flag to only execute preflight getter, without sending transaction.`));

        await lcsc.sendCheckBlock(np.sender(), {
            block: blockProof,
            signatures: signatures,
            value: messageValue,
            pedantic: pedantic,
        });

        await waitForSomething(cp, cs, "processing");

        ui.write(C.yellowBright(`--- Current contract state:`));
        await retry(() => lcsc.getAndPrintFullConfig());
    } else {
        ui.write(C.gray(`Not sending transaction because --locally flag is set.`));
    }
}