import { NetworkProvider } from '@ton/blueprint';
import { intHashToHex, retry } from '../../utils/utils';
import C from 'chalk';
import { checkMyBalance, getLiteClient, getOtherRawLC } from '../../utils/cli';
import { waitForSomething } from '../../utils/ui';
import { printLiteClientConfigFull } from '../../wrappers/LiteClient';
import {
    inferBlockSeqno,
    inferMsgValue, init, preflightError, preflightResCheck,
    prepareBlockSignatures,
    prepareKeyBlockData,
    resolveContractState,
    startUpLCCatWalk
} from '../../utils/high_level';
import { args } from '../../utils/_superglobals';
import { maybeShowHelpTexts } from '../../utils/help_texts';

// noinspection JSUnusedGlobalSymbols
export async function run(np: NetworkProvider, arglist: string[]) {
    const { ui } = init(np, arglist, "SendKeyBlock");
    maybeShowHelpTexts('LiteClient/SendNewKeyBlock');

    const seqno = inferBlockSeqno(true);

    const lcsc = await getLiteClient();

    let messageValue = inferMsgValue();
    await checkMyBalance(messageValue);

    const state = await retry(() => lcsc.getFullConfig());
    ui.write(C.cyanBright(`Current contract state:`));
    printLiteClientConfigFull(state);

    /* const lc = */ await getOtherRawLC(state.globalId);
    const { wantedBlock, needSigs } = await startUpLCCatWalk(state.globalId, state.seqNo, seqno);
    const { keyBlockId, blockProof, blockHash } = await prepareKeyBlockData(wantedBlock);
    const signatures = await prepareBlockSignatures(keyBlockId, needSigs);

    const { cp, cs } = await resolveContractState(false, 'LiteClient');

    try {
        const testResult = await lcsc.getTestNewKeyBlock({block: blockProof, signatures: signatures});
        preflightResCheck(intHashToHex(testResult), blockHash.toString('hex'), "result hash doesn't match");
    } catch (e: any) {
        preflightError(e);
    }

    if (!args.locally && !args.local) {
        ui.write(C.gray(`Hint: You may use --locally flag to only execute preflight getter, without sending transaction.`));
        await lcsc.sendNewKeyBlock(np.sender(), {block: blockProof, signatures: signatures, value: messageValue});

        await waitForSomething(cp, cs, "processing");

        ui.write(C.yellowBright(`--- Current contract state:`));
        await retry(() => lcsc.getAndPrintFullConfig());
    } else {
        ui.write(C.gray(`Not sending transaction because --locally flag is set.`));
    }
}