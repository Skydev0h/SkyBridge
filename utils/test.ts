import { Address, Cell, toNano } from '@ton/core';

export type DebugFlagTypes = 'keyBlockWrongCell' | 'keyBlockWrongConfig' | 'txDoNotTrim';

class DebugFlags {
    #flags: Set<DebugFlagTypes> = new Set();

    once(k: DebugFlagTypes) {
        // console.log(`Check debug flag ONCE ${k}: ${this.#flags.has(k)}`);
        return this.#flags.delete(k);
    }

    has(k: DebugFlagTypes) {
        // console.log(`Check debug flag ${k}: ${this.#flags.has(k)}`);
        return this.#flags.has(k);
    }

    set(k: DebugFlagTypes) {
        // console.log(`Set debug flag ${k}`);
        this.#flags.add(k);
    }

    reset() {
        // console.log(`Reset debug flags`);
        this.#flags.clear();
    }
}

export const debugFlags = new DebugFlags();

export const randomAddress = (wc: number = 0) => {
    const buf = Buffer.alloc(32);
    for (let i = 0; i < buf.length; i++) {
        buf[i] = Math.floor(Math.random() * 256);
    }
    return new Address(wc, buf);
};

export const differentAddress = (old: Address) => {
    let newAddr: Address;
    do {
        newAddr = randomAddress(old.workChain);
    } while(newAddr.equals(old));

    return newAddr;
}

const getRandom = (min:number, max:number) => {
    return Math.random() * (max - min) + min;
}

export const getRandomInt = (min: number, max: number) => {
    return Math.round(getRandom(min, max));
}

export const getRandomTon = (min:number, max:number): bigint => {
    return toNano(getRandom(min, max).toFixed(9));
}

// noinspection JSUnusedLocalSymbols
const testPartial = (cmp: any, match: any) => {
    for (let key in match) {
        if(!(key in cmp)) {
            throw Error(`Unknown key ${key} in ${cmp}`);
        }

        if(match[key] instanceof Address) {
            if(!(cmp[key] instanceof Address)) {
                return false
            }
            if(!(match[key] as Address).equals(cmp[key])) {
                return false
            }
        }
        else if(match[key] instanceof Cell) {
            if(!(cmp[key] instanceof Cell)) {
                return false;
            }
            if(!(match[key] as Cell).equals(cmp[key])) {
                return false;
            }
        }
        else if(match[key] !== cmp[key]){
            return false;
        }
    }
    return true;
}
