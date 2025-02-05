import { LiteClient } from '../../wrappers/LiteClient';
import { NetworkProvider } from '@ton/blueprint';
import C from 'chalk';
import { promptBool, waitForSomething } from '../../utils/ui';
import { inferDeployVars, init, resolveContractState } from '../../utils/high_level';
import { checkMyBalance, findWCToUse } from '../../utils/cli';
import { api, registerLiteClientSC } from '../../utils/_superglobals';
import { getCode } from '../../utils/utils';
import { maybeShowHelpTexts } from '../../utils/help_texts';

// noinspection JSUnusedGlobalSymbols
export async function run(np: NetworkProvider, arglist: string[]) {
    const { ui, args } = init(np, arglist, "Deploy LC (empty)");
    maybeShowHelpTexts('LiteClient/DeployEmpty');
    const { nonce, globalId, deployValue } = await inferDeployVars();
    const wc = findWCToUse();
    await checkMyBalance(deployValue);

    const skip_confirmation = (args.unsafe);
    if (!skip_confirmation) {
        ui.write(C.redBright(`Warning: Using this script is not recommended. It is safer to use LiteClient/DeployWithKeyBlock.`));
        ui.write(C.red(`(It is possible for anyone to send invalid keyblock to empty SC between deployment and first NewKeyBlock)`));
        ui.write(C.gray(`(Use --unsafe flag to skip this warning, but better do not use it)`));
        const confirmation = await promptBool('Do you really want to continue? ', ['y', 'n']);
        if (!confirmation) {
            ui.write(C.greenBright(`Good decision. Exiting...`));
            return;
        }
    }

    // api.open. Only api.open. Only Monika. Do not use np.open (does balancing for testnet).
    const lcsc = api.open(
        LiteClient.createFromConfig({ globalId: globalId, nonce: nonce }, await getCode('LiteClient'), wc));
    registerLiteClientSC(lcsc);

    ui.write(C.blueBright(`--- LiteClient SC address: ${lcsc.address.toString()}`));

    const { cp, cs } = await resolveContractState(true, 'LiteClient');

    await lcsc.sendEmpty(np.sender(), deployValue);

    await waitForSomething(cp, cs, "deploy");

    ui.write(C.yellowBright(`--- Current contract state:`));
    await lcsc.getAndPrintFullConfig(true);
}
