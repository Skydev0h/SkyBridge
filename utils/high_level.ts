import {
    catWalkKeyBlocks,
    getBlock,
    getBlockSignatures,
    getLastMasterBlockId,
    getMCBlockId,
    getParsedBlockHeader,
    rewrapSignatureSet,
} from './raw_lc';
import C from 'chalk';
import { BlockID } from 'ton-lite-client';
import { NetworkProvider } from '@ton/blueprint';
import { Cell, ContractState, Dictionary, fromNano, toNano } from '@ton/core';
import parseArgs from 'minimist';
import { promptBool, promptInteger } from './ui';
import { getCode, globalIdResolve, installConsoleFilter, retry, SliceDictVal } from './utils';
import { beginProof, convertToMerklePrune } from './proof';
import { args, configure, ismc, lc, lccp, lcsc, np, tccp, tcsc, ui } from './_superglobals';
import { describeError } from './errors';
import { tonNode_blockIdExt } from 'ton-lite-client/dist/schema';
import { TransactionChecker } from '../wrappers/TransactionChecker';
import { OOPSforTESTS } from './test';

export function init(np_: NetworkProvider, arglist: string[], what: string) {
    const ui_ = np_.ui();
    configure(np_, ui_, arglist);
    if (what != 'Tests') {
        installConsoleFilter();
    }
    const args_ = parseArgs(arglist);
    hello(what);
    return { ui: ui_, args: args_ };
}

export function hello(what: string) {
    ui.write(C.green(`:) Welcome to LiteClient ${what} script (:`));
}

export function inferMsgValue(defVal: string = '0.5', deploy: boolean = false) {
    if (ismc) {
        defVal = fromNano(toNano(defVal) * 10n);
    }
    let messageValue: bigint;
    if (args.value ?? args.v) {
        messageValue = toNano(args.value ?? args.v);
        ui.write(
            C.blueBright(`--- Using provided ${deploy ? 'deploy' : 'message'} value ${fromNano(messageValue)} TON`),
        );
    } else {
        messageValue = toNano(defVal);
        ui.write(
            C.yellowBright(
                `-*- ${deploy ? 'Deploy' : 'message'} value not provided, using default ${fromNano(messageValue)} TON`,
            ),
        );
        ui.write(
            C.yellow(
                `-*- You can provide ${deploy ? 'deploy' : 'message'} value via --value or -v argument, e.g. --value=<value>`,
            ),
        );
    }
    return messageValue;
}

export function inferNonce() {
    let nonce: number;
    if (args.nonce ?? args.n) {
        nonce = parseInt(args.nonce ?? args.n);
        ui.write(C.blueBright(`--- Using provided nonce value ${nonce}`));
    } else {
        nonce = Date.now();
        ui.write(C.yellowBright(`-*- Nonce not provided, using current hi-res unix timestamp ${nonce}`));
        ui.write(C.yellow(`-*- You can provide nonce via --nonce or -n argument, e.g. --nonce=<nonce>`));
    }
    return nonce;
}

export function inferExtraNonce() {
    let nonce: number | null = null;
    if (args.extranonce) {
        nonce = parseInt(args.extranonce);
        if (!args.sameshard) {
            ui.write(C.blueBright(`--- Using provided extra nonce value ${nonce == 0 ? 'None' : nonce}`));
        }
        if (nonce == 0) {
            nonce = null;
        }
    } else {
        if (!args.sameshard) {
            ui.write(C.gray(`... Hint: you can provide extra nonce by using --extranonce=<number> argument (0 for None)`))
            // ui.write(C.blue(`-*- You can also use --sameshard to deploy contract having the same first 8 bits of the address as the LC`));
            // ^ not needed to show this message, on workchain sameshard is automatically implied
        }
    }
    return nonce;
}

let inferGidCache: number | null = null;
export async function inferGlobalId(deploy: boolean = true, silently: boolean = false) {
    if (inferGidCache != null) {
        return inferGidCache;
    }
    let globalId: number;
    if (args.globalid ?? args.g) {
        const gi = args.globalid ?? args.g;
        switch (gi) {
            case 'c': // custom
            case 'f': globalId = -217; break;
            case 't': globalId = -3; break;
            case 'm': globalId = -239; break;
            default:
                globalId = parseInt(gi);
                if (globalId == 0) {
                    ui.write(C.redBright(`!!! Invalid Global ID provided: ${gi}`));
                    process.exit(1);
                }
                break;
        }
    } else {
        globalId = 0;
        if (np.network() == 'testnet') {
            globalId = -217;
        } else if (np.network() == 'custom') {
            globalId = -3;
        }
        if (globalId == 0) {
            if (!silently) {
                ui.write(C.redBright('-!- Global ID not provided, it MUST be supplied for contract deployment'));
                ui.write(C.red(`-*- You can provide Global ID via --globalid or -g argument, e.g. --globalid=-3`));
                ui.write(C.cyanBright('--- Example values: fastnet -217 (contest), testnet -3, mainnet -239'));
                ui.write(C.cyan('    You can also use shortcuts -g=f (fastnet), -g=t (testnet) or -g=m (mainnet)'));
                globalId = await promptInteger('Please enter Global ID to use:');
            }
            globalId = 0;
        } else {
            ui.write(
                C.magentaBright(
                    `>_> Running on ${np.network()} network, automatically inferring Global ID ${globalId} (${globalIdResolve(globalId)})`,
                ),
            );
        }
        if (!silently && globalIdResolve(globalId) == 'unknown') {
            ui.write(C.yellowBright(`-*- Unknown Global ID: ${globalId}`));
            if (!(await promptBool('Are you sure want to continue? ', ['y', 'n']))) {
                process.exit(0);
            }
        }
    }
    if (deploy) {
        ui.write(C.yellow(`->- Deploying with Global ID setting: ${globalId} (${globalIdResolve(globalId)})`));
    }
    inferGidCache = globalId;
    return globalId;
}

export function inferBlockSeqno(override: boolean = false) {
    let seqno: number;
    if (args.seqno ?? args.s) {
        seqno = parseInt(args.seqno ?? args.s);
        ui.write(C.yellowBright(`--- Using provided block seqno${override ? ' override' : ''} value ${seqno}`));
    } else {
        seqno = 0;
        if (!override) {
            ui.write(C.gray(`-*- Seqno not provided, using latest masterchain block`));
            ui.write(C.gray(`-*- You can provide seqno via --seqno or -s argument, e.g. --seqno=<seqno>`));
        } else {
            ui.write(C.gray(`--- Hint: You can override seqno by using -s or --seqno argument if really required`));
        }
    }
    return seqno;
}

export function inferFlag(name: string, short: string, long: string, pfxdescr: string) {
    let flag: boolean;
    if (args[long] ?? args[short]) {
        flag = true;
        ui.write(C.yellowBright(`--- Using ${name}`));
    } else {
        flag = false;
        ui.write(C.gray(`-*- Hint: ${pfxdescr} you can enable ${name} with --${long} or -${short} flag`));
    }
    return flag;
}

export function inferPedanticFlag() {
    return inferFlag('pedantic mode', 'p', 'pedantic', 'For more security');
}

export async function inferDeployVars(defVal: string = '0.2') {
    const nonce = inferNonce();
    const deployValue = inferMsgValue(defVal, true);
    const globalId = await inferGlobalId(true);

    ui.write(
        C.yellowBright(
            '-!- Please save nonce and global id values, they may be used to determine address of the contract',
        ),
    );

    return { nonce, deployValue, globalId };
}

type ContractName = 'LiteClient' | 'TransactionChecker';
export async function resolveContractState(deployGuard: boolean = false, name: ContractName = 'LiteClient') {
    let cs: ContractState;
    const sc = (name == 'LiteClient') ? lcsc : tcsc;
    const cp = (name == 'LiteClient') ? lccp : tccp;
    try {
        cs = await retry(() => cp.getState());
    } catch (e: any) {
        ui.write(C.redBright(`FATAL: Could not get contract state: ${e.message}`));
        ui.write(
            C.redBright(`Please check address ${sc.address} (wc:${sc.address.workChain}) for possible issues`),
        );
        process.exit(1);
    }

    if (deployGuard) {
        if (cs.state.type !== 'uninit') {
            ui.write(C.redBright(`[!] ${name} SC is already deployed`));
            ui.write(C.yellowBright(`--- Current contract state:`));
            if (name == 'LiteClient') {
                await lcsc.getAndPrintFullConfig(true);
            }
            if (name == 'TransactionChecker') {
                await tcsc.getAndPrintContractState();
            }
            process.exit(2);
        }
    }
    return { cp, cs };
}

export async function startUpLC(globalId: number) {
    const lastBlockId = await getLastMasterBlockId();
    const lastBlockHdr = await getParsedBlockHeader(lastBlockId);

    if (lastBlockHdr.global_id != globalId) {
        if (!args.ignore_wrong_gid) {
            ui.write(
                C.redBright(
                    `[!] The specified network global ID ${lastBlockHdr.global_id} does not match expected ${globalId}!!!`,
                ),
            );
            process.exit(1);
        }
    }
    ui.write(C.gray(`-i- Last MC block seqno: ${lastBlockHdr.info.seq_no}, keyblock seqno: ${lastBlockHdr.info.prev_key_block_seqno}, gID: (${globalId} (${globalIdResolve(globalId)}))`));

    return { lastBlockId, lastBlockHdr };
}

export async function startUpLCCatWalk(globalId: number, seqNo: number, override: number = 0) {
    let { lastBlockHdr } = await startUpLC(globalId);

    let wantedBlock: number;
    let needSigs = true;

    if (override > 0) {
        wantedBlock = override;
        needSigs = seqNo == 0;
        ui.write(C.yellowBright(`-!- Warning: Using provided keyblock seqno override ${wantedBlock}`));
        return { wantedBlock, needSigs };
    }

    if (seqNo == 0) {
        wantedBlock = lastBlockHdr.info.prev_key_block_seqno;
        if (lastBlockHdr.info.key_block) {
            // Edge case - last block IS the key block
            wantedBlock = lastBlockHdr.info.seq_no;
        }
        needSigs = false; // signatures can be omitted, contract does not yet have keys to check against
        ui.write(
            C.yellowBright(
                `-*- Contract is not initialized, using last available keyblock ${wantedBlock} for initialization`,
            ),
        );
    } else {
        if (lastBlockHdr.info.prev_key_block_seqno <= seqNo) {
            ui.write(C.redBright(`[!] Recorded seqno ${seqNo} is already the latest keyblock, nothing to send`));
            process.exit(0);
        }
        ui.write(C.blue(`-i- Need to find next keyblock after seqno ${seqNo}`));
        wantedBlock = await catWalkKeyBlocks(lastBlockHdr.info.prev_key_block_seqno, seqNo);
        if (wantedBlock == 0) {
            ui.write(C.redBright(`[!] Could not find next keyblock after seqno ${seqNo}`));
            process.exit(1);
        }
        ui.write(C.blueBright(`-i- Found next keyblock seqno: ${wantedBlock}`));
    }

    return { wantedBlock, needSigs };
}

export async function prepareMCBlockData(seqno: number | tonNode_blockIdExt, minimal: boolean = false) {
    const blockId = typeof seqno == 'number' ? await getMCBlockId(seqno) : seqno;
    const block = await lc.getBlockHeader(blockId);
    const blockProof = Cell.fromBoc(block.headerProof)[0];
    if (minimal) {
        // const blockData = await getBlock(blockId);
        // const block = Cell.fromBoc(blockData.data)[0];
        // const minimalProof = createMerkleProof(blockProof, [], []);
        // const minimalProof = beginProof(blockProof).endProof();
        const minimalProof = convertToMerklePrune(blockProof);
        // console.log(blockProof);
        // console.log(beginProof(blockProof).endProof());
        // console.log(convertToMerklePrune(blockProof));
        return { blockId, block, blockProof: minimalProof, blockHash: blockId.rootHash };
    }
    return { blockId, block, blockProof, blockHash: blockId.rootHash };
}

export async function prepareKeyBlockData(wantedBlock: number) {
    const keyBlockId = await getMCBlockId(wantedBlock);
    const keyBlock = await getBlock(keyBlockId);

    const blockCell = Cell.fromBoc(keyBlock.data)[0];
    const mcExtra = blockCell.refs[3].refs[3];

    const n34 = OOPSforTESTS.keyBlockWrongConfig ? 32 : 34;

    const cfgRoot = mcExtra.refs[mcExtra.refs.length - 1];
    let par34: Cell | null = null;
    try {
        const cfgDict = Dictionary.loadDirect(Dictionary.Keys.Int(32), SliceDictVal, cfgRoot);
        const cfgPar34 = cfgDict.get(n34);
        par34 = cfgPar34?.loadRef()!;
    } catch (e: any) {
        ui.write(C.yellowBright('Warning: Failed to read p34 from keyblock config'));
    }

    const path = OOPSforTESTS.keyBlockWrongCell ? '>1' : '>0';

    const blockProof =
        beginProof(blockCell)
            .include(path) // block_info (header), strictly up
            .includeTree(par34) // up and down
            .endProof();

    OOPSforTESTS.keyBlockWrongConfig = false;
    OOPSforTESTS.keyBlockWrongCell = false;

    /*
    const blockProof = createMerkleProof(
        blockCell,
        [
            blockCell.refs[0], // block_info (header), strictly up
        ],
        [
            cfgPar34?.loadRef()!, // up and down
        ],
        false,
    );
    */

    return { keyBlockId, keyBlock, blockProof, blockCell, blockHash: blockCell.hash(),
        vsethash: par34?.hash() ?? Buffer.alloc(0) };
}

export async function prepareBlockSignatures(id: BlockID, needSigs: boolean = true, reqSigs: boolean = false) {
    let signatures: Cell = new Cell();
    if (needSigs) {
        // oh, dear!
        try {
            const signs = await getBlockSignatures(id);
            signatures = await rewrapSignatureSet(signs, id);
        } catch (e: any) {
            if (e.message == "state already gc'd") {
                if (reqSigs) {
                    ui.write(C.red('!!! The liteserver does not have required state to obtain block signatures'));
                    ui.write(
                        C.red('    Please try again (if there are other liteservers), or use a later block (if possible)'),
                    );
                    process.exit(1);
                } else {
                    ui.write(C.yellowBright(`!!! Warning: was not able to obtain signatures, the request may fail`));
                }
            }
            if (reqSigs) {
                throw e;
            }
        }
    }
    return signatures;
}

export function preflightResCheck(got: any, want: any, msg: string, extra: string = '') {
    if (got != want) {
        ui.write(C.yellowBright(`Preflight check failed: ${msg}`));
        if (!args.anyway) {
            ui.write(C.gray(`Hint: use --anyway flag to continue anyway`));
            process.exit(1);
        }
        ui.write(C.yellowBright(`Continuing anyway... (--anyway flag provided)`));
    }
    ui.write(C.green(`Preflight check succeeded${extra}`));
}

export function preflightError(e: any) {
    const msg = e.message;
    if (typeof msg === 'string' && msg.startsWith('Unable to execute get method. Got exit_code: ')) {
        const exitCode = parseInt(msg.split(': ')[1]);
        if (exitCode >= 100) {
            ui.write(C.red(`Preflight check failed: ${describeError(exitCode)}`));
        } else {
            ui.write(C.redBright(`Unexpected TVM error:\n    ${msg}`));
        }
        if (!args.anyway) {
            ui.write(C.gray(`Hint: use --anyway flag to continue anyway`));
            process.exit(1);
        }
        ui.write(C.yellowBright(`Continuing anyway... (--anyway flag provided)`));
    } else {
        ui.write(C.redBright(`Unexpected error:`));
        console.error(e);
        if (!args.anyway) {
            ui.write(C.gray(`Hint: use --anyway flag to continue anyway`));
            process.exit(1);
        }
        ui.write(C.yellowBright(`Continuing anyway... (--anyway flag provided)`));
    }
}

export async function sameShardOptimization(extranonce: number | null, wc: number) {
    const code = await getCode('TransactionChecker');
    if (args.sameshard || (extranonce == null && wc == 0)) {
        if (!args.sameshard) {
            ui.write(C.green(`^_^ For optimization purposes, will calculate nonce to match TC in the same shard as the LC.`))
            ui.write(C.gray(`--- You can override this behavior by specifying --extranonce=... manually (0 to omit)`))
        }
        if (args.extranonce) {
            ui.write(C.yellow(`Conflicting options, --extranonce=${extranonce} will be ignored for --sameshard.`));
        }
        // as of now there seem to be issues with more than 4-bit shards, so need to match first 4 bits
        // however, for simplicity, and future proofing, lets match first 8 bits (should be fast, avg 1 in 256)
        for (let i = 0; i < 100000; i++) {
            // this is pretty fast and should take moments, good enough even to make as default behavior
            const sc = TransactionChecker.createFromConfig({ liteClientAddress: lcsc.address, nonce: i }, code, wc);
            if (sc.address.hash[0] == lcsc.address.hash[0]) {
                return i;
            }
        }
    }
    return extranonce;
}