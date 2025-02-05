export const OP_SIMPLE_TRANSFER    = 0;

export const OP_NEW_KEY_BLOCK      = 0x11a78ffe;
export const RE_OK                 = 0xff8ff4e1;

export const OP_CHECK_BLOCK        = 0x8eaa9d76; // check signatures, times, global id
export const OP_NEW_KEY_AND_CHECK  = 0x11a79d76; // apply new keyblock, if possible, and check block
export const RE_CORRECT            = 0xce02b807;

export const OP_CHECK_BLOCK_EX  = 0x8eaa9111; // additional request and response params, never throws
export const RE_CORRECT_EX      = 0xce02b111;
export const RE_INCORRECT_EX    = 0xbad2b111;

export const OP_CHECK_TRANSACTION   = 0x91d555f7;
export const RE_TRANSACTION_CHECKED = 0x756adff1;
export const RE_TRANS_FAILED_CHECK  = 0xbadadff1;