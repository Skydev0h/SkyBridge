import { LiteClient } from '../wrappers/LiteClient';
import { Address, fromNano, OpenedContract, toNano } from '@ton/core';
import { getCode, globalIdResolve, retry } from './utils';
import C from 'chalk';
import { makeRawLC } from './raw_lc';
import { promptBool } from './ui';
import { api, args, myaddr, registerLiteClientSC, registerTransactionCheckerSC, ui } from './_superglobals';
import { inferExtraNonce, inferGlobalId, sameShardOptimization } from './high_level';
import { TransactionChecker } from '../wrappers/TransactionChecker';

// TODO: What separates this from high_level? Maybe merge them? Don't want big refactoring until task is completely done!

let shownAutoMessage = false;
export function findWCToUse() {
    let wc = 0;
    if (args.mc ?? args.m) {
        ui.write(C.magentaBright(`-M- Using masterchain for smart contract (requested)`));
        wc = -1;
    }
    if (!args.sc) {
        if (myaddr?.workChain == -1) {
            if (!shownAutoMessage) {
                ui.write(C.magentaBright(`-M- Using masterchain for smart contract automatically because wallet is on MC`));
                ui.write(C.gray('--- Hint: You may use --sc to suppress this behavior (but it would then fail on fastchain)'));
                shownAutoMessage = true;
            }
            wc = -1;
        }
    }
    return wc;
}

export async function checkMyBalance(value: bigint) {
    const addr = myaddr; // capture
    if (!addr) {
        ui.write(C.yellowBright("/!\\ Warning: No wallet address found, cannot check balance"));
        return;
    }
    const cs = await retry(() => api.provider(addr).getState());
    if (cs.balance < value + toNano(1)) {
        ui.write(C.redBright("/!\\ Warning: Likely not enough balance to send message"));
        ui.write(C.redBright(`    (Balance:  ${fromNano(cs.balance)} TON)`));
        ui.write(C.redBright(`    (Required: ${fromNano(value)} TON)`));
        ui.write(C.redBright(`    (Hint: Use --value flag to specify message value)`));
        ui.write(C.yellowBright(`>>> Please top up address ${addr} to at least ${fromNano(value + toNano(1))} TON`));
        ui.write(C.yellowBright(`!!! If you continue, you may encounter strange errors`));
        if (!await promptBool("Are you sure want to continue? ", ['y', 'n'])) {
            process.exit(0);
        }
        process.exit(1);
    } else {
        ui.write(C.gray(`... Sender balance: ${parseFloat(fromNano(cs.balance)).toFixed(2)} TON, message value: ${fromNano(value)} TON`));
    }
}

export async function getLiteClient(addressKey: string = 'address') {
    const wc = findWCToUse();

    if (args[addressKey]) {
        const address = args[addressKey];
        const parsed = Address.parse(address);
        if (parsed.workChain != wc) {
            ui.write(C.redBright(`!!! Warning: expected workchain ${wc}, but provided address has ${parsed.workChain} instead`));
        }
        const liteClient = api.open(
            LiteClient.createFromAddress(parsed)
        );
        const cp = api.provider(liteClient.address);
        const cs = await retry(() => cp.getState());
        if (cs.state.type == 'active') {
            ui.write(C.greenBright(`Using active contract at ${liteClient.address}`));
            registerLiteClientSC(liteClient)
            return liteClient;
        } else {
            ui.write(C.yellowBright(`Warning: Provided address ${address} does not point to an active contract!`));
        }
    }

    const infgid = await inferGlobalId(false, true);

    if ((args.nonce ?? args.n) && (infgid != 0)) {
        const nonce = args.nonce ?? args.n;
        const globalId = infgid;
        const liteClient = api.open(
            LiteClient.createFromConfig(
                {
                    globalId: globalId,
                    nonce: nonce,
                },
                await getCode('LiteClient'),
                wc
            ),
        );
        const cp = api.provider(liteClient.address);
        const cs = await retry(() => cp.getState());
        if (cs.state.type == 'active') {
            ui.write(C.greenBright(`Found active LiteClient contract at ${liteClient.address}`));
            registerLiteClientSC(liteClient);
            return liteClient;
        } else {
            ui.write(C.yellowBright(`Warning: Provided nonce ${nonce} and global ID ${globalId} does not point to an active LC contract!`));
            ui.write(C.yellowBright(`    (Resolved address: ${liteClient.address})`));
        }
    }

    ui.write(C.redBright(`Please provide the correct LiteClient SC address using --${addressKey} parameter`));
    ui.write(C.redBright(`Alternatively, you can use --globalid and --nonce flags to find LiteClient SC by it`));
    process.exit(1);
}

export async function getTransactionChecker(addressKey: string = 'address', lcAddressKey = 'liteclient') {

    if (args[addressKey]) {
        const wc = findWCToUse();
        const address = args[addressKey];
        const parsed = Address.parse(address);
        if (parsed.workChain != wc) {
            ui.write(C.redBright(`!!! Warning: expected workchain ${wc}, but provided address has ${parsed.workChain} instead`));
        }
        const transactionChecker = api.open(
            TransactionChecker.createFromAddress(parsed)
        );
        const cp = api.provider(transactionChecker.address);
        const cs = await retry(() => cp.getState());
        if (cs.state.type == 'active') {
            ui.write(C.greenBright(`Using active contract at ${transactionChecker.address}`));
            registerTransactionCheckerSC(transactionChecker)
            return transactionChecker;
        } else {
            ui.write(C.yellowBright(`Warning: Provided address ${address} does not point to an active contract!`));
        }
    }

    const sct = args.type ?? args.t ?? '';

    if (sct != 'withlc' && sct != 'simple') {
        ui.write(C.redBright(`!!! Please provide --type=<type> or -t flag to specify transaction checker type`));
        ui.write(C.red(`    Supported types: --type=withlc (recommended) and --type=simple (not recommended)`));
        process.exit(1);
    }

    let transactionChecker: OpenedContract<TransactionChecker> | null;
    let extranonce = inferExtraNonce();

    if (sct == 'simple') {
        const wc = findWCToUse();
        transactionChecker = api.open(
            TransactionChecker.createFromConfig({ nonce: extranonce }, await getCode('TransactionChecker'), wc)
        );
    }
    else { // withlc
        const liteClient = await getLiteClient(lcAddressKey);
        const wc = liteClient.address.workChain;
        extranonce = await sameShardOptimization(extranonce, wc);
        transactionChecker = api.open(
            TransactionChecker.createFromConfig({ liteClientAddress: liteClient.address, nonce: extranonce },
                await getCode('TransactionChecker'), wc)
        );
    }

    const cp = api.provider(transactionChecker.address);
    const cs = await retry(() => cp.getState());
    if (cs.state.type == 'active') {
        ui.write(C.greenBright(`Found active TransactionChecker contract at ${transactionChecker.address}`));
        registerTransactionCheckerSC(transactionChecker);
        return transactionChecker;
    }
    ui.write(C.yellowBright(`Warning: Provided parameters do not point to an active TransactionChecker contract!`));
    ui.write(C.yellowBright(`    (Resolved address: ${transactionChecker.address})`));
    ui.write(C.redBright(`Please provide the correct TransactionChecker SC address using --${addressKey} parameter`));
    if (sct == 'simple') {
        ui.write(C.redBright(`Alternatively, you can use --extranonce flag to find TransactionChecker SC by it`));
    }
    else {
        ui.write(C.redBright(`Alternatively, you can use --${lcAddressKey} and --extranonce flags to find TransactionChecker SC by it`));
    }
    process.exit(1);
}

export function getOtherConfigUrl(globalId: number): string | null {
    if (args.glconf) {
        ui.write(C.greenBright(`Using provided global config ${args.glconf}`));
        return args.glconf;
    }

    const ares = (() => {
        switch (globalId) {
            case -3:
                return "https://ton-blockchain.github.io/testnet-global.config.json";
            case -217:
                return "https://contest.com/file/400780400604/4/P0UeFR_X1mg.1626.json/04de18101ec5af6dea";
            case -239:
                return "https://ton.org/global-config.json";
        }
    })();

    if (ares) {
        ui.write(C.greenBright(`Using global config ${ares} automatically chosen for global ID ${globalId} (${globalIdResolve(globalId)})`));
        return ares;
    }

    ui.write(C.redBright("Please provide other network global config using which to obtain key blocks"));
    ui.write(C.redBright("You can use --glconf argument e.g. --glconf=https://ton.org/global-config.json for mainnet"));
    return null;
}

export async function getOtherRawLC(globalId: number) {
    const globalConfigUrl = getOtherConfigUrl(globalId);
    if (!globalConfigUrl) { process.exit(1); }
    return makeRawLC(globalConfigUrl);
}
