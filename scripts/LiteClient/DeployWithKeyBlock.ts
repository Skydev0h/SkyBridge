import { LiteClient } from '../../wrappers/LiteClient';
import { NetworkProvider } from '@ton/blueprint';
import C from 'chalk';
import { waitForSomething } from '../../utils/ui';
import {
    inferBlockSeqno,
    inferDeployVars,
    init,
    prepareBlockSignatures,
    prepareKeyBlockData,
    resolveContractState,
    startUpLCCatWalk
} from '../../utils/high_level';
import { checkMyBalance, findWCToUse, getOtherRawLC } from '../../utils/cli';
import { api, registerLiteClientSC } from '../../utils/_superglobals';
import { getCode } from '../../utils/utils';
import { maybeShowHelpTexts } from '../../utils/help_texts';

// noinspection JSUnusedGlobalSymbols
export async function run(np: NetworkProvider, arglist: string[]) {
    const { ui } = init(np, arglist, "Deploy LC (with KeyBlock)");
    maybeShowHelpTexts('LiteClient/DeployWithKeyBlock');
    const { nonce, globalId, deployValue } = await inferDeployVars();
    const seqno = inferBlockSeqno(true);
    const wc = findWCToUse();
    await checkMyBalance(deployValue);

    /* const lc = */ await getOtherRawLC(globalId);

    const { wantedBlock, needSigs } = await startUpLCCatWalk(globalId, 0, seqno);

    const { keyBlockId, blockProof } = await prepareKeyBlockData(wantedBlock);
    const signatures = await prepareBlockSignatures(keyBlockId, needSigs);

    const lcsc = api.open(
        LiteClient.createFromConfig({ globalId: globalId, nonce: nonce }, await getCode('LiteClient'), wc));
    registerLiteClientSC(lcsc);

    ui.write(C.blueBright(`--- LiteClient SC address: ${lcsc.address.toString()}`));

    const { cp, cs } = await resolveContractState(true, 'LiteClient');

    await lcsc.sendNewKeyBlock(np.sender(), {
        block: blockProof,
        signatures: signatures,
        value: deployValue,
    });

    await waitForSomething(cp, cs, "deploy");

    ui.write(C.yellowBright(`--- Current contract state:`));
    await lcsc.getAndPrintFullConfig(true);
}
