const OP_SIMPLE_TRANSFER    = 0;

const OP_NEW_KEY_BLOCK      = 0x11a78ffe;
const RE_OK                 = 0xff8ff4e1;

const OP_CHECK_BLOCK        = 0x8eaa9d76; // check signatures, times, global id
const OP_NEW_KEY_AND_CHECK  = 0x11a79d76; // apply new keyblock, if possible, and check block
const RE_CORRECT            = 0xce02b807;

const OP_CHECK_BLOCK_EX  = 0x8eaa9111; // additional request and response params, never throws
const RE_CORRECT_EX      = 0xce02b111;
const RE_INCORRECT_EX    = 0xbad2b111;

const OP_CHECK_TRANSACTION   = 0x91d555f7;
const RE_TRANSACTION_CHECKED = 0x756adff1;
const RE_TRANS_FAILED_CHECK  = 0xbadadff1;

const TD_BLOCK        = 0x11ef55aa;
const TD_BLOCK_INFO   = 0x9bc7a987;
const TD_BLOCK_EXTRA  = 0x4a33f6fd;
const TD_MC_BLK_EXTRA = 0xcca5;
const TD_PUB_KEY      = 0x8e81278a;
const TON_BLOCK_ID    = 0x706E0BC5;

//                    0.01_______ TON
const MAINTAIN_STORAGE = 10000000;
// should be enough, because it will be refreshed on each key block update or check request

const XCELL_PRUNED_BRANCH = 1;
const XCELL_MERKLE_PROOF  = 3;