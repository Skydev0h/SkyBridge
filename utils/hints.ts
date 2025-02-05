import { Cell, CellType } from '@ton/core';

// All those hash to hex string casts are not the most efficient, but simplest. Should optimize them if I will have time.

export function prepareNavigationHints(root: Cell, target: Cell | Buffer) {
    const hash = target instanceof Cell ? getHash(target) : target.toString('hex');
    const path = traverse(root, hash, '');
    return path?.split('').map(x => parseInt(x));
}

function traverse(cell: Cell, hash: string, path: string): string | null {
    for (let i=0; i<cell.refs.length; i++) {
        const chash = getHash(cell.refs[i]);
        // console.log(path + i, chash);
        if (chash == hash) {
            return path + i;
        }
        const result = traverse(cell.refs[i], hash, path + i);
        if (result) {
            return result;
        }
    }
    return null;
}

function getHash(cell: Cell) {
    if (cell.type === CellType.PrunedBranch) {
        return cell.beginParse(true).skip(16).loadBuffer(32).toString('hex');
    } else {
        return cell.hash(0).toString('hex');
    }
}