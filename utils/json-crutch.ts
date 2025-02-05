import { Cell } from '@ton/core';

export function jsonCrutch() {
    // @ts-ignore
    BigInt.prototype.toJSON = function() { return this.toString() }
    // @ts-ignore
    Cell.prototype.toJSON = function() { return this.toString(); }
}
