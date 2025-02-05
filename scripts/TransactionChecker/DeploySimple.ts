import { NetworkProvider } from '@ton/blueprint';
import C from 'chalk';
import { promptBool, waitForSomething } from '../../utils/ui';
import { inferExtraNonce, inferMsgValue, init, resolveContractState } from '../../utils/high_level';
import { checkMyBalance, findWCToUse } from '../../utils/cli';
import { api, registerTransactionCheckerSC } from '../../utils/_superglobals';
import { TransactionChecker } from '../../wrappers/TransactionChecker';
import { getCode } from '../../utils/utils';
import { maybeShowHelpTexts } from '../../utils/help_texts';

// noinspection JSUnusedGlobalSymbols
export async function run(np: NetworkProvider, arglist: string[]) {
    const { ui, args } = init(np, arglist, "Deploy TC (simple)");
    maybeShowHelpTexts('TransactionChecker/DeploySimple');
    const deployValue = inferMsgValue('0.2', true);
    const extranonce: number | null = inferExtraNonce();
    const wc = findWCToUse();
    await checkMyBalance(deployValue);

    const skip_confirmation = (args.unsafe);
    if (!skip_confirmation) {
        ui.write(C.redBright(`Warning: Using this script is not recommended. It is safer to use TrChecker/DeployWithLC.`));
        ui.write(C.red(`(TransactionChecker deployed using this script will check transaction proof only, without checking blocks)`));
        ui.write(C.gray(`(Use --unsafe flag to skip this warning)`));
        const confirmation = await promptBool('Do you really want to continue? ', ['y', 'n']);
        if (!confirmation) {
            ui.write(C.greenBright(`Exiting...`));
            return;
        }
    }

    // api.open. Only api.open. Only Monika. Do not use np.open (does balancing for testnet).
    const tcsc = api.open(
        TransactionChecker.createFromConfig({ nonce: extranonce }, await getCode('TransactionChecker'), wc)
    );
    registerTransactionCheckerSC(tcsc);

    ui.write(C.blueBright(`--- TransactionChecker SC address: ${tcsc.address.toString()}`));

    const { cp, cs } = await resolveContractState(true, 'TransactionChecker');

    await tcsc.sendDeploy(np.sender(), deployValue);

    await waitForSomething(cp, cs, "deploy");

    ui.write(C.yellowBright(`--- Current contract state:`));
    await tcsc.getAndPrintContractState();
}
