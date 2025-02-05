import "constants.tolk";

fun sendMsg(recipient: slice, body: builder, extraMode: int) {
    var msg: builder = beginCell()
        .storeUint(NON_BOUNCEABLE, 6)
        .storeSlice(recipient).storeUint(0, 4 + 1 + 4 + 4 + 64 + 32 + 1 + 1)
        .storeBuilder(body); // all message for these contracts fit inline perfectly
    val (wc, _) = parseStandardAddress(getMyAddress()); // ALL masterchain fees are 10x
    reserveToncoinsOnBalance(MAINTAIN_STORAGE * (wc == MASTERCHAIN ? 10 : 1), RESERVE_MODE_AT_MOST);
    return sendMessage(msg.endCell(), SEND_MODE_CARRY_ALL_BALANCE | extraMode);
}

@inline
fun sendMsgStd(recipient: slice, opCode: int, queryId: int, raw: builder, extraMode: int) {
    return sendMsg(recipient,
        beginCell().storeMessageOp(opCode).storeMessageQueryId(queryId).storeBuilder(raw), extraMode
    );
}