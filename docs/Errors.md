# Errors (codes)

[Return to main page](../README.md)

This document explains possible error codes in the smart contract, and what they mean (or likely mean in case of TVM 
system errors; `ERR_` prefix and `_ERROR` suffix ommitted for clarity, where relevant).

> These errors can be observed in LiteClient exit codes (for `New Key Block` and `Check Block` actions) as well as in the
> error response messages from LiteClient (for `Check Block Ex` action) and TransactionChecker (for `Check transaction`
> action) in the form of UInt16 at the end of the message body root cell (please see `schema.tlb` for more details).

> Other errors might also occur, especially these that are below `13`, they usually should not occur, but
> you can get more information about them [here](https://docs.ton.org/v3/documentation/tvm/tvm-exit-codes).

| Code  | Error name             | Description                                                                                                               |
|:-----:|:-----------------------|:--------------------------------------------------------------------------------------------------------------------------|
|  `9`  | `TVM_DESERIALIZATION`  | Missing data or attempted to load non-existing or pruned ref. Most likely caused by corrupted provided data.              |
| `13`  | `TVM_OUT_OF_GAS`       | There was not enough has to execute the transaction. Supply more TON when sending message to the contract.                |
| `-14` | `TVM_OUT_OF_GAS_INV`   | The same as the above, but cannot be faked (because of the negative value).                                               |
| `100` | `INVALID_FLAG_VALUE`   | Schema violation, QuantumBool pedantic flag provided as zero bit, possible values one or absent.                          |
| `101` | `PRUNED_NO_LEVEL_1`    | Cannot extract level 1 representation hash from higher level pruned cell, but it is required.                             |
| `102` | `INVALID_SENDER`       | TransactionChecker received "response" not from their linked LiteClient contract.                                         |
| `103` | `MERKLE_PRUNE_HASH`    | PrunedBranch hash does not match MerkleTree one. Should not be possible because of TVM guarantees.                        |
| `104` | `NEW_KEYBLK_PRUNED`    | New Key Block is pruned, block header unextractable, therefore the block cannot be accepted.                              |
| `105` | `TX_PROOF_PRUNED`      | Transaction Proof is pruned, and it is not possible to verify chain, message cannot be accepted.                          |
| `200` | `BLOCK_TD_ID`          | Provided Block does not begin with correct prefix as per TLB schema.                                                      |
| `201` | `BLKINFO_TD_ID`        | Provided Block's block_info does not begin with correct prefix as per TLB schema.                                         |
| `202` | `BLK_NOT_MASTER`       | Provided Block is not masterchain block, but it is required (not_master is 1).                                            |
| `203` | `BLK_NOT_KEYBLK`       | Provided Block is not Key Block, but it is required (key_block is 0).                                                     |
| `204` | `BLKEXTRA_TD_ID`       | Provided Block's block_extra does not begin with correct prefix as per TLB schema.                                        |
| `205` | `NO_MCBLKEXTRA`        | Provided Block does not have custom McBlockExtra structure, but it is required.                                           |
| `206` | `MCBLKEX_TD_ID`        | Provided Block's masterchain_block_extra does not begin with correct prefix as per TLB schema.                            |
| `207` | `MCBE_NOT_KEYBL`       | Provided Block has key_block = 0 in masterchain_block_extra, but it is required to be 1.                                  |
| `208` | `CP34_NOT_FOUND`       | ConfigParam34 (current validator set) not found in provided masterchain block proof.                                      |
| `300` | `BAD_VSET_TYPE`        | Unknown validators set structure (not validators or validators_ext). Contract may require code updates and redeployment.  |
| `301` | `MAIN_GT_TOTAL`        | Amount of main (masterchain) validators in validator set is greater than total one, and that is not possible.             |
| `302` | `MAIN_IS_ZERO`         | Amount of main (masterchain) validators in validator set is zero, and that is not possible.                               |
| `303` | `VSET_DICT_HOLE`       | Validator list structured incorrectly and has "holes" in VSet dictionary (non-consequential items).                       |
| `304` | `BAD_VAL_TYPE`         | Unknown validator entry type (not validator or validator_addr). Contract may require code updates and redeployment.       |
| `304` | `PUBKEY_TD_ID`         | Incorrect Public Key ID in validator entry. Closely related to previous error, therefore, same number.                    |
| `400` | `BAD_GLOBAL_ID`        | Provided Block's Global ID does not match contract's stored one - the Block is from another Network.                      |
| `401` | `BAD_SEQNO`            | Provided Block's SeqNo is less than the stored one. Most likely the block is earlier than the last applied Key Block.     |
| `402` | `BAD_GEN_TIME`         | Provided Block's generation time is less than the stored one. Possible reason is similar to the previous error.           | 
| `403` | `BAD_LT`               | Provided Block's LT is less than the stored one. Possible reason is similar to the previous error.                        |
| `404` | `PREV_KEY_SEQNO`       | Key Block's presented previous key block number (or Block's in Pedantic Mode) does not strictly match.                    |
| `500` | `NOT_READY`            | The contract does not know of any Key Block yet, and, therefore, cannot check any masterchain block.                      |
| `501` | `INVALID_SIGNATURE`    | At least one of the presented Validator Signatures is not valid for the given block.                                      |
| `502` | `NOT_ENOUGH_WEIGHT`    | Not enough valid signatures presented to check for consensus (at least 2/3 of Validator weight is required).              |
| `503` | `INVALID_SIGNER`       | At least one of the presented Validator Signatures is signed by the Validator Key now known in current epoch.             |
| `504` | `BLK_INFO_PRUNED`      | Checking a masterchain block without header validation (with pruned header) is not allowed in Pedantic Mode.              |
| `505` | `UNEXPECTED_EXOTIC`    | Encountered unexpected exotic cell type, where it should not be. Most likely caused by corrupted provided data.           |
| `506` | `INVALID_BLKID_HDR`    | Provided signing material for Validators does not begin with correct ton.blockId prefix.                                  |
| `507` | `INVALID_ROOT_HASH`    | Provided signing material for Validators does not correspond to the provided Block's root hash.                           |
| `508` | `INVALID_BLKID_STR`    | Provided signing material for Validators has incorrect amount of bits for Block's file hash.                              |
| `600` | `MISSING_BLOCK`        | Attempted simple transaction verification (without providing Block Proof) on a Transaction Checker linked to a LC.        |
| `601` | `MISSING_SIGNATURES`   | Missing masterchain block signatures for the Block Proof on a Transaction Checker linked to a LC.                         |
| `602` | `INCORRECT_BLOCK`      | Hash of Transaction Proof does not match hash of the Block Proof.                                                         |
| `603` | `NO_LITE_CLIENT_SUPP`  | This Transaction Checker does not support verification of Block with LC, but it is needed (by Signatures or Pedantic).    |
| `630` | `TX_HASH_INVALID`      | Presented Transaction hash does not match the transaction, that was verified by Transaction Proof.                        |
| `700` | `MISSING_SHARD_PROOF`  | A Basechain Transaction was presented for validation, but Shard Proof was not properly provided to the contract.          |
| `702` | `EXTRA_SHARD_PROOF`    | A Shard Proof was provided, but the provided Transaction is on Masterchain. Remove the proof.                             |
| `703` | `EXTRA_SHARD_HINTS`    | Shard Proof Hints were provided, but the provided Transaction is on Masterchain. Remove the hints.                        |
| `704` | `DEVIANT_SHARD_PROOF`  | Shard Proof block hash does not match Masterchain Block hash, but they must represent different proofs of the same Block. |
| `710` | `SHARD_PROOF_BT_FORK`  | Navigating the Shard Proof resulted in binary tree fork, leaf expected. Most likely caused by incomplete Hints.           |
| `711` | `SHARD_PROOF_DSC_HDR`  | Incorrect shard descriptor prefix in the Shard Proof. Most likely caused by corrupt data, incomplete or invalid Hints.    |
| `712` | `SHARD_PROOF_BAD_HASH` | The block hash in Shard Proof does not match presented Transaction Proof (BC Block) hash, cannot verify it.               |

[Return to main page](../README.md)
