import { Cell, CellType, convertToMerkleProof } from '@ton/core';
import { beginCell } from '@ton/core/dist/boc/Builder';

// little nifty wrapper to make proof building beautiful and expressive, a piece of art
export class ProofBuilder {
    readonly #root: Cell;
    #retain: Cell[] = [];
    #retainTree: Cell[] = [];
    #constraint: Cell[] = [];
    #postPrune: Cell[] = [];

    public constructor(base: Cell) {
        this.#root = base;
    }

    public include(...cellsOrPaths: (Cell|string|null)[]) {
        this.#retain.push(...this.#p(cellsOrPaths));
        return this;
    }

    public includeTree(...cellsOrPaths: (Cell|string|null)[]) {
        this.#retainTree.push(...this.#p(cellsOrPaths));
        return this;
    }

    public requireParent(...cellsOrPaths: (Cell|string|null)[]) {
        this.#constraint.push(...this.#p(cellsOrPaths));
        return this;
    }

    public postExclude(...cellsOrPaths: (Cell|string|null)[]) {
        this.#postPrune.push(...this.#p(cellsOrPaths));
        return this;
    }

    #p(cellsOrPaths: (Cell|string|null)[]) {
        if (cellsOrPaths.every((path) => path instanceof Cell)) {
            return cellsOrPaths;
        }
        const result: Cell[] = [];
        for (let path of cellsOrPaths) {
            if (path === null) {
                continue;
            }
            if (path instanceof Cell) {
                result.push(path);
                continue;
            }
            if (path == '^') {
                result.push(this.#root);
                continue;
            }
            if (!/^(>[0-3])+$/.test(path)) {
                throw new Error(`Invalid path '${path}'. Paths contain numbers from 0 to 3, separated by '>' and must start with '>'.`);
            }
            path = path.replace(/>/g, '');
            let cell = this.#root;
            for (const c of path) {
                cell = cell.refs[parseInt(c)];
            }
            result.push(cell);
        }
        return result;
    }

    public endProof(opts?: {byHash?: boolean, raw?: boolean}) {
        return createMerkleProof(
            this.#root,
            this.#retain,
            this.#retainTree,
            opts?.byHash ?? false,
            this.#constraint.length > 0 ? this.#constraint : undefined,
            this.#postPrune.length > 0 ? this.#postPrune : undefined,
            opts?.raw ?? false
        );
    }
}

export function beginProof(base: Cell) {
    return new ProofBuilder(base);
}

// keeping hashes instead of cells should work even cross-tree, but may include extraneous cells if they are duplicated in tree
// especially for making transaction proofs - constraint requires to visit at least one constraint cell in hiearchy to allowed one
// so that, for example, transaction will be included in desired tree, but would not be included in any other places. neat!
// postprune allows to prune the exact cells themselves afterward, so there will be marked path to the cells, but they will not be included
export function createMerkleProof(root: Cell, retain: Cell[], retainTree: Cell[], hashing: boolean = false,
                                  constraint?: Cell[], postPrune?: Cell[], raw?: boolean): Cell {
    const sh = hashing ? (cell: Cell) => cell.hash().toString('hex') : (cell: Cell) => cell;
    let validate_hash: bigint | null = null;

    if (root.type == CellType.MerkleProof) {
        // need to remember stored hash in a merkle proof
        validate_hash = root.beginParse(true).skip(8).loadUintBig(256);
        // root is already a merkle proof, consider first ref as root of new tree
        root = root.refs[0];
    }

    const keep = new Set([sh(root), ...retain.map(c => sh(c)), ...retainTree.map(c => sh(c))]);
    const reck = new Set(retainTree.map(c => sh(c)));
    const cset = new Set(constraint?.map(c => sh(c)) ?? []);
    const ppcs = new Set(postPrune?.map(c => sh(c)) ?? []);

    function postPruneRecurseSave(cell: Cell): Cell {
        if (ppcs.has(sh(cell))) {
            // console.log(`postprune ${sh(cell)}`);
            return convertToPrunedBranch(cell);
        }
        return new Cell({
            bits: cell.bits,
            refs: cell.refs.map((cell) => postPruneRecurseSave(cell))
        })
    }

    function cutTheTreeBranches(cell: Cell): Cell {
        const pruned = cell.type == CellType.PrunedBranch;
        if (pruned) {
            // It is already pruned...
            return cell;
        }
        if (!keep.has(sh(cell)) || ppcs.has(sh(cell))) {
            // console.log(`prune ${sh(cell)}`);
            return convertToPrunedBranch(cell);
        }
        // console.log(`visit ${sh(cell)}`);
        return reck.has(sh(cell)) ? postPruneRecurseSave(cell) : new Cell({
            bits: cell.bits,
            refs: cell.refs.map((cell) => cutTheTreeBranches(cell))
        })
    }

    /*
    // This approach had flaws - if subcells had same hash as other ones, it would include wrong branches
    // This was ESPECIALLY visible when picking transactions, because they often have common subcells e_e
    function recursiveRetain(cell: Cell) {
        for (const sub of cell.refs) {
            keep.add(sh(sub));
            recursiveRetain(sub);
        }
    }
    */

    function recursiveMark(cell: Cell, cs: boolean): boolean {
        // console.log(`marker visit ${sh(cell)}`);
        if (!cs) {
            if (cset.has(sh(cell))) {
                cs = true;
            }
        }
        let k = cs && keep.has(sh(cell));
        for (const sub of cell.refs) {
            k = recursiveMark(sub, cs) || k; // order is VERY important!!! damn.
        }
        if (k) {
            keep.add(sh(cell));
        }
        return k;
    }

    recursiveMark(root, constraint === undefined);
    if (raw == true) {
        const result = cutTheTreeBranches(root);
        if (validate_hash != null) {
            const new_hash = BigInt('0x' + result.hash().toString('hex'));
            if (new_hash !== validate_hash) {
                throw new Error(`Merkle proof hash changed from ${validate_hash} to ${new_hash} after re-pruning`);
            }
        }
        return result;
    } else {
        const result = convertToMerkleProof(cutTheTreeBranches(root));
        if (validate_hash != null) {
            const new_hash = result.beginParse(true).skip(8).loadUintBig(256);
            if (new_hash !== validate_hash) {
                throw new Error(`Merkle proof hash changed from ${validate_hash} to ${new_hash} after re-pruning`);
            }
        }
        return result;
    }
}

// why can not you make that export, Whales Corp?
// NB: because it needs fixing in some EXOTIC cases
export function convertToPrunedBranch(c: Cell): Cell {
    if (c.type == CellType.PrunedBranch) {
        return c;
    }
    if (c.type == CellType.MerkleProof) {
        const cs = c.beginParse(true).skip(8);
        return beginCell()
            .storeUint(1, 8)
            .storeUint(1, 8)
            .storeBuffer(cs.loadBuffer(32 + 2)) // hash + depth
            .endCell({ exotic: true });
    }
    return beginCell()
        .storeUint(1, 8)
        .storeUint(1, 8)
        .storeBuffer(c.hash(0))
        .storeUint(c.depth(0), 16)
        .endCell({ exotic: true });
}

// Absolutely minimum possible proof of the cell hash
export function convertToMerklePrune(c: Cell): Cell {
    return convertToMerkleProof(convertToPrunedBranch(c));
}
