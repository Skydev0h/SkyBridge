import { NetworkProvider } from '@ton/blueprint';
import C from 'chalk';
import { waitForSomething } from '../../utils/ui';
import {
    inferExtraNonce,
    inferMsgValue,
    init,
    resolveContractState,
    sameShardOptimization
} from '../../utils/high_level';
import { checkMyBalance, getLiteClient } from '../../utils/cli';
import { api, registerTransactionCheckerSC } from '../../utils/_superglobals';
import { TransactionChecker } from '../../wrappers/TransactionChecker';
import { getCode } from '../../utils/utils';
import { maybeShowHelpTexts } from '../../utils/help_texts';

// noinspection JSUnusedGlobalSymbols
export async function run(np: NetworkProvider, arglist: string[]) {
    const { ui, args } = init(np, arglist, "Deploy TC (with LC)");
    maybeShowHelpTexts('TransactionChecker/DeployWithLC');
    const deployValue = inferMsgValue('0.2', true);
    let extranonce: number | null = inferExtraNonce();
    await checkMyBalance(deployValue);

    const lcsc = await getLiteClient();
    const wc = lcsc.address.workChain;
    extranonce = await sameShardOptimization(extranonce, wc);

    // api.open. Only api.open. Only Monika. Do not use np.open (does balancing for testnet).
    const tcsc = api.open(TransactionChecker.createFromConfig({
        liteClientAddress: lcsc.address, nonce: extranonce }, await getCode('TransactionChecker'), wc));
    registerTransactionCheckerSC(tcsc);

    ui.write(C.blueBright(`--- TransactionChecker SC address: ${tcsc.address.toString()}`));

    const { cp, cs } = await resolveContractState(true, 'TransactionChecker');

    await tcsc.sendDeploy(np.sender(), deployValue);

    await waitForSomething(cp, cs, "deploy");

    ui.write(C.yellowBright(`--- Current contract state:`));
    await tcsc.getAndPrintContractState();
    if (args.sameshard) {
        ui.write(C.yellowBright(`^^^ Remember the nonce and LC address for further access`));
        ui.write(C.yellowBright(`>>> Or use TC address directly: ${tcsc.address.toString()}`));
    }
}
