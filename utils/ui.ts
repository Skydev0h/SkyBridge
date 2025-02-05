import { sleep } from '@ton/blueprint';
import { Address, ContractProvider, ContractState } from '@ton/core';
import { TonClient, TonClient4 } from '@ton/ton';
import C from 'chalk';
import { api, ui } from './_superglobals';

export const promptBool = async (
    prompt: string,
    options: [string, string],
    choice: boolean = false,
) => {
    let yes = false;
    let no = false;
    let opts = options.map((o) => o.toLowerCase());

    do {
        let res = (
            choice
                ? await ui.choose(prompt, options, (c: string) => c)
                : await ui.input(`${prompt}(${options[0]}/${options[1]})`)
        ).toLowerCase();
        yes = res == opts[0];
        if (!yes) no = res == opts[1];
    } while (!(yes || no));

    return yes;
};

// noinspection JSUnusedGlobalSymbols
export const promptAddress = async (prompt: string, fallback?: Address) => {
    let promptFinal = fallback ? prompt.replace(/:$/, '') + `(default:${fallback}):` : prompt;
    do {
        let testAddr = (await ui.input(promptFinal)).replace(/^\s+|\s+$/g, '');
        try {
            return testAddr == '' && fallback ? fallback : Address.parse(testAddr);
        } catch (e) {
            ui.write(testAddr + ' is not valid!\n');
            prompt = 'Please try again:';
        }
    } while (true);
};

// noinspection JSUnusedGlobalSymbols
export const promptAmount = async (prompt: string) => {
    let resAmount: number;
    do {
        let inputAmount = await ui.input(prompt);
        resAmount = Number(inputAmount);
        if (isNaN(resAmount)) {
            ui.write('Failed to convert ' + inputAmount + ' to float number');
        } else {
            return resAmount.toFixed(9);
        }
    } while (true);
};

export const promptInteger = async (prompt: string) => {
    let resAmount: number;
    do {
        let inputAmount = await ui.input(prompt);
        resAmount = parseInt(inputAmount);
        if (isNaN(resAmount)) {
            ui.write('Failed to convert ' + inputAmount + ' to integer');
        } else {
            return resAmount;
        }
    } while (true);
};


export const getLastBlock = async () => {
    if (api instanceof TonClient4) {
        return (await api.getLastBlock()).last.seqno;
    }
    if (api instanceof TonClient) {
        return (await api.getMasterchainInfo()).latestSeqno;
    }
    return 0;
};

export const getAccountLastTx = async (address: Address) => {
    if (api instanceof TonClient4) {
        const res = await api.getAccountLite(await getLastBlock(), address);
        if (res.account.last == null) return '';
        return res.account.last.lt;
    }
    if (api instanceof TonClient) {
        const cs = await api.getContractState(address);
        return cs.lastTransaction?.lt ?? '';
    }
    return '';
};

// noinspection JSUnusedGlobalSymbols
export const waitForTransaction = async (address:Address, curTx:string | null, maxRetry:number, interval:number=1000) => {
    let done  = false;
    let count = 0;
    do {
        // const lastBlock = await getLastBlock();
        ui.write(`Awaiting transaction completion (${++count}/${maxRetry})`);
        await sleep(interval);
        done = (await getAccountLastTx(address)) === curTx;
    } while(!done && count < maxRetry);
    return done;
}

/*const keysToHashMap = async (keys: string[]) => {
    let keyMap: { [key: string]: bigint } = {};
    for (let i = 0; i < keys.length; i++) {
        keyMap[keys[i]] = BigInt('0x' + (await sha256(keys[i])).toString('hex'));
    }
};*/

export async function waitForSomething(csp: ContractProvider, cs1: ContractState, what: string) {
    const spin = ['/', '-', '\\', '|'];
    const neospin = ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚'];
    let done = false;
    for (let i=0; i<120; i++) {
        if (i % 5 === 0) {
            csp.getState().then((cs2) => {
                if (!done) {
                    if (cs2.last?.lt !== cs1.last?.lt) {
                        done = true;
                    }
                }
            }).catch(() => {});
        }
        for (let j=0; j<4; j++) {
            ui.setActionPrompt(C.hsv((i * 4 + j) * 10, 100, 100)(
                `${neospin[(i*4+j)%12]} Waiting for ${what}... ${spin[j]}`));
            await new Promise(resolve => setTimeout(resolve, 250));
            if (done) break;
        }
        if (done) break;
    }
    ui.clearActionPrompt();
    ui.write(C.greenBright("Completed!"));
}