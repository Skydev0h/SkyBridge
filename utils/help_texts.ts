import { args, ui } from './_superglobals';

export function maybeShowHelpTexts(module: string) {
    if (args.h || args.help) {
        ui.write(`Welcome to the module ${module} help!`);
        ui.write('');
        switch (module) {
            case 'LiteClient/DeployEmpty':
                ui.write('    This tool allows to deploy an empty LiteClient instance.');
                ui.write('    Using this tool is not recommended, since anyone can send arbitrary');
                ui.write('        block to the smart contract before SendNewKeyBlock is called.');
                ui.write('    It is recommended to use LiteClient/DeployWithKeyBlock module instead.');
                break;
            case 'LiteClient/DeployWithKeyBlock':
                ui.write('    This tool allows to deploy a LiteClient instance with a keyblock right away.');
                ui.write('    Using this tool is a recommended approach to deploy a LiteClient instance.');
                break;
            case 'LiteClient/SendCheckBlock':
                ui.write('    This tool allows to send a block for verification to the LiteClient smart contract.');
                break;
            case 'LiteClient/SendNewKeyBlock':
                ui.write('    This tool allows to send a new keyblock to the LiteClient smart contract.');
                break;
            case 'TransactionChecker/DeploySimple':
                ui.write('    This tool allows to deploy a simple transaction checker contract.');
                ui.write('    Using this tool is not recommended, since it does not validate blocks, but only transaction proofs.');
                ui.write('    The only likely case is if a smart contract sends a block that it have already validated with LC.');
                ui.write('    It is recommended to use TransactionChecker/DeployWithLC module instead.');
                break;
            case 'TransactionChecker/DeployWithLC':
                ui.write('    This tool allows to deploy a transaction checker contract with a linked LiteClient instance.');
                ui.write('    Using this tool is a recommended approach to deploy a transaction checker contract.');
                ui.write('    In this mode, blocks, corresponding to the transactions, are validated by the linked LiteClient instance.');
                break;
            case 'TransactionChecker/SendCheckTransaction':
                ui.write('    This tool allows to send a transaction for verification to the TransactionChecker smart contract.');
                break;
        }
        ui.write('');
        ui.write('Generic parameters help (not all may be applicable for this specific module):');
        ui.write('    -h, --help: show this help text');
        ui.write('    -g, --globalid: global id of the contract to deploy');
        ui.write('    Common values: c, f or -217 - fastnet, t or -3 - testnet, m or -239 - mainnet');
        ui.write('    --glconf: specify custom url for global config file of the other network');
        ui.write('    -n, --nonce: nonce of the LiteClient contract for deploy, lookup or interaction');
        ui.write('    --extranonce: extra nonce of the TransactionChecker contract for deploy or interaction');
        ui.write('    --unsafe: allow deploying of empty LiteClient without confirmation');
        ui.write('    --local, --locally: only do preflight checks and do not send messages to the network');
        ui.write('    --anyway: ignore preflight check result, and send message even if it would result in an error');
        ui.write('    --ignore_global_gid: ignore mismatch of other network and contract global id (not recommended)');
        ui.write('    --mc or --sc: force contract deployment or interaction in masterchain or shardchain correspondingly');
        ui.write('    -v or --value: override amount of TONs to be sent for deployment or interaction');
        ui.write('    --sameshard: force same shard search for TransactionChecker even for masterchain');
        ui.write('    --txdemo: automatically look for any transaction in last masterchain block');
        ui.write('    --txacc: specify account address for transaction lookup');
        ui.write('    --txseqno: specify seqno of the block containing the transaction to be used');
        ui.write('    --txlt: specify lt of the transaction to be used (only used with --txacc)');
        ui.write('    --txhash: specify hash of the transaction to be used (recommended)');
        ui.write('    --txshard: specify shard in order to find transaction in the basechain');
        ui.write('               (without this parameter transaction will be searched in the masterchain)');
        ui.write('    --deb_bad_hint: do not use, corrupts hints (for demonstration and debugging)');
        process.exit(0);
    }
}