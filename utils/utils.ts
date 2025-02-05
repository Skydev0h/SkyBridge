import { Address, Builder, Cell, DictionaryValue, Slice } from '@ton/core';
import C from "chalk";
import { Maybe } from '@ton/ton/dist/utils/maybe';
import { ui } from './_superglobals';
import * as fs from 'node:fs';
import { compile, CompileOpts } from '@ton/blueprint';

// @ts-ignore patch BigInt to allow toJson
BigInt.prototype.toJSON = function() { return this.toString() }
// @ts-ignore
Cell.prototype.toJSON = function() { return this.toString(); }

export function installConsoleFilter(inspecting: boolean = false) {
    const log = console.log;
    const warn = console.warn;
    const error = console.error;
    const debug = console.debug;
    console.debug = function() {
        if (inspecting) { log("<DEBUG>", arguments); }
        if (arguments[0] === "[TON_CONNECT_SDK]") {
            if (arguments[1] === "Send http-bridge request:" || arguments[1] === "Wallet message received:") {
                return;
            }
        }
        debug(...arguments);
    }
    console.warn = function() {
        if (inspecting) { log("<WARN>", arguments); }
        if (arguments[0] === 'To silence this warning, change your `bounce` flags passed to Senders to unset or undefined') {
            return;
        }
        if (arguments[0] === 'Warning: blueprint\'s Sender does not support `bounce` flag, because it is ignored by all used Sender APIs') {
            return;
        }
        warn(...arguments);
    }
    console.log = function() {
        if (inspecting) { log("<LOG>", arguments); }
        log(...arguments);
    }
    console.error = function() {
        if (inspecting) { log("<ERROR>", arguments); }
        error(...arguments);
    }
}

export function undefiner<T>(v: Maybe<T>): T|undefined {
    if (v === null) return undefined;
    return v;
}

export function nullifier<T>(v: Maybe<T>): T|null {
    if (v === undefined) return null;
    return v;
}

export function strIfSet(a: any): string | undefined {
    if (a === undefined || a === null) return undefined;
    return a.toString();
}

export async function inputAddressShouldDiffer(message: string, others: Address[], fallback?: Address) {
    while (true) {
        const result = await ui.inputAddress(message, fallback);
        if (!others.map(a => a.toString()).includes(result.toString())) { return result; }
        ui.write(C.yellowBright(`Warning: the provided address ${result} most likely should be different from ${others.map(a => a.toString()).join(' and ')}`));
        const choice = await ui.choose(C.yellowBright("Are you sure?"), ['No', 'Yes'], (s) => s);
        if (choice === 'Yes') { return result; }
    }
}

export async function inputWithDefault(message: string, def?: string) {
    if (def === undefined) {
        return await ui.input(message);
    }
    const r = await ui.input(message + " (default: " + def + ")");
    return (r === "") ? def : r;
}

export async function inputValidAmt(message: string, decimals: number, def?: string): Promise<string> {
    while (true) {
        const text = await inputWithDefault(message, def);
        try {
            const amt = toAmt(text, decimals);
            if (amt < 0) {
                ui.write(C.redBright(`Error: Negative values are not allowed!`));
                continue;
            }
            return fromAmt(amt, decimals);
        } catch (e) {
            ui.write(C.redBright(`Error: Invalid amount entered. Please try again!`));
        }
    }
}

// Adapted from @ton/core toNano & fromNano

export function toAmt(src: number | string | bigint, decimals: number): bigint {

    if (typeof src === 'bigint') {
        return src * (10n ** BigInt(decimals));
    } else {
        if (typeof src === 'number') {
            if (!Number.isFinite(src)) {
                throw Error('Invalid number');
            }

            if (Math.log10(src) <= 6) {
                src = src.toLocaleString('en', { minimumFractionDigits: decimals, useGrouping: false });
            } else if (src - Math.trunc(src) === 0) {
                src = src.toLocaleString('en', { maximumFractionDigits: 0, useGrouping: false });
            } else {
                throw Error('Not enough precision for a number value. Use string value instead');
            }
        }

        // Check sign
        let neg = false;
        while (src.startsWith('-')) {
            neg = !neg;
            src = src.slice(1);
        }

        // Split string
        if (src === '.') {
            throw Error('Invalid number');
        }
        let parts = src.split('.');
        if (parts.length > 2) {
            throw Error('Invalid number');
        }

        // Prepare parts
        let whole = parts[0];
        let frac = parts[1];
        if (!whole) {
            whole = '0';
        }
        if (!frac) {
            frac = '0';
        }
        if (frac.length > decimals) {
            throw Error('Invalid number');
        }
        while (frac.length < decimals) {
            frac += '0';
        }

        // Convert
        let r = BigInt(whole) * (10n ** BigInt(decimals)) + BigInt(frac);
        if (neg) {
            r = -r;
        }
        return r;
    }
}

export function fromAmt(src: bigint | number | string, decimals: number) {
    let v = BigInt(src);
    let neg = false;
    if (v < 0) {
        neg = true;
        v = -v;
    }

    // Convert fraction
    let frac = v % (10n ** BigInt(decimals));
    let facStr = frac.toString();
    while (facStr.length < decimals) {
        facStr = '0' + facStr;
    }
    facStr = facStr.match(/^([0-9]*[1-9]|0)(0*)/)![1];

    // Convert whole
    let whole = v / (10n ** BigInt(decimals));
    let wholeStr = whole.toString();

    // Value
    let value = `${wholeStr}${facStr === '0' ? '' : `.${facStr}`}`;
    if (neg) {
        value = '-' + value;
    }

    return value;
}

// orbs, especially testnet are VERY unreliable at times, need to implement retry
export async function retry<T>(fun: () => Promise<T>, timeoutsONLY: boolean = false, retries: number = 10): Promise<T> {
    if (ui !== undefined) {
        ui.setActionPrompt('⏳  Please wait...');
    }
    for (let i = 0; i < retries; i++) {
        try {
            if (ui !== undefined) {
                ui.clearActionPrompt(); // clear to prevent extra text if output is needed
            }
            const result = await fun();
            if (ui !== undefined) {
                ui.clearActionPrompt();
            }
            return result;
        } catch (e: any) {
            let exit = (i == retries - 1);
            if (e.toString().includes('Exit code: ')) {
                exit = true;
            }
            if (timeoutsONLY && !e.toString().includes('AxiosError: timeout')) {
                exit = true;
            }
            if (ui !== undefined) {
                if (exit)
                    ui.clearActionPrompt();
                else
                    ui.setActionPrompt(`⏳  Please wait... attempt ${i + 2} / ${retries}`);
            }
            if (exit)
                throw e;
        }
    }
    throw Error('Should never reach here');
}

export function now(): number {
    return Date.now() / 1000;
}

export function globalIdResolve(globalId: number): string {
    switch (globalId) {
        case -3: return "testnet";
        case -217: return "fastnet (contest)";
        case -239: return "mainnet";
    }
    return "unknown";
}

export const SliceDictVal: DictionaryValue<Slice> = {
    serialize: (src: Slice, builder: Builder) => {
        builder.storeSlice(src);
    },
    parse: (src: Slice) => {
        return src;
    }
};

export function bufferToBigInt(buffer: Buffer): bigint {
    return BigInt('0x' + buffer.toString('hex'));
}

export function intHashToHex(hash: bigint): string {
    return hash.toString(16).padStart(64, '0');
}

let codeCache = new Map<string, Cell>();

export async function getCode(contract: string, opts?: CompileOpts): Promise<Cell> {
    const key = contract + (opts ? JSON.stringify(opts) : '');
    if (codeCache.has(key)) {
        return codeCache.get(contract)!;
    }
    const fn = `sc_for_scr/${contract}.compiled.json`;
    if (fs.existsSync(fn)) {
        const obj = JSON.parse(fs.readFileSync(fn, 'utf8'));
        if (obj.hex) {
            return Cell.fromHex(obj.hex);
        } else {
            console.error(`${fn} does not contain hex code, please remove the file`);
            process.exit(1);
        }
    }
    console.warn(C.yellow(`! Contract ${contract} compiled from source, resolved addresses may change in the future`));
    if (codeCache.size == 0) {
        console.warn(C.gray(`! Please stabilize contract code, see sc_scr/README.md for more info`));
    }
    const code = await compile(contract, opts);
    codeCache.set(key, code);
    return code;
}

export const HASH_BYTES = 32;

// Can be used to supply hashes in convenient format
export function parseFixedLenBinString(str: string, len: number, what: string, allowedZeroBytes: number = 8) {
    // Can be supplied in one of three forms: number, hex or base64
    if (/^[1-9][0-9]*$/.test(str)) {
        const num = BigInt(str);
        const hex = num.toString(16);
        if (hex.length < (len - allowedZeroBytes) * 2) {
            ui.write(C.gray(`??? Could not parse ${what} as ${len}-bytes numeric, got ${hex.length / 2} is too short`));
        }
        const padded = hex.padStart(len * 2, '0');
        if (padded.length == len * 2) {
            return Buffer.from(hex, 'hex');
        }
    }
    if (/^(0x)?[0-9a-fA-F]+$/.test(str)) {
        const hex = str.startsWith('0x') ? str.slice(2) : str;
        if (hex.length == len * 2) {
            return Buffer.from(hex, 'hex');
        } else { // very, VERY unlikely that long base64 will contain only hex numbers
            ui.write(C.gray(`??? Could not parse ${what} as ${len}-bytes hex string, got ${hex.length} bytes instead`));
        }
    }
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(str)) {
        const buffer = Buffer.from(str, 'base64');
        if (buffer.length == len) {
            return buffer;
        } else {
            ui.write(C.gray(`??? Could not parse ${what} as ${len}-bytes base64 string, got ${buffer.length} bytes instead`));
        }
    }
    ui.write(C.redBright(`FATAL: Could not parse ${what} as ${len}-bytes base64, hex or numeric string`));
    process.exit(1);
}