@pure fun ref0(self: slice): cell asm "0 PLDREFIDX";
@pure fun ref1(self: slice): cell asm "1 PLDREFIDX";
@pure fun ref2(self: slice): cell asm "2 PLDREFIDX";
@pure fun ref3(self: slice): cell asm "3 PLDREFIDX";
@pure fun refN(self: slice, n: int): cell asm "PLDREFVAR";

@pure fun beginParseExotic(c: cell): (slice, int) asm "XCTOS";

// @pure fun sha256s2i(s1: slice, s2: slice): int asm "2 PUSHINT HASHEXT_SHA256";