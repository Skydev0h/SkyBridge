# Features

[Return to main page](../README.md)

### Required functionality

All the requirements of the contest are implemented:

- `LiteClient` smart contract remembers neccessary information to verify masterchain and key blocks, and supports
  application of the next key blocks in the chain, as well as, verification of masterchain blocks covered by the current
  remembered key block.
- `TransactionChecker` verifies transaction proofs (that the transaction really belongs to the declared block), and
  supports autonomous "`simple`" mode without interaction to LiteClient contract (can be useful if the block is already
  verified, by a separate call to `LC`, for example), but also much more secure "`withLC`" mode in which `TC` first asks
  `LC` about validity of given keyblock.
- Also, the contracts maintain a constant balance at all times, that guarantees enough cost for storage fees - because
  they are expected to be interacted with often, and even if not, new keyblocks must be loaded periodically (or lite
  servers will drop the state, and it will be impossible to apply old keyblocks chain).

### Additional functionality

Nevertheless, numerous additional features were implemented, that either provide additional useful functionality or
better convenience:

- `TransactionChecker` supports **verification of basechain transactions** with included verification of shard proofs.
  This allows to prove not only any masterchain, but also any basechain transaction with the contract.
- The contracts implement relevant `getter` functions that mirror the verification functions, and allow to effectively
  simulate transactions off-chain before sending them to the contracts.
    - Moreover, in case of several contracts in chain, such as `TransactionChecker` and `LiteClient`, the first `TC`
      contract returns parameters to the second `LC` one, with which it would be called in chain. Therefore, it allows,
      basically, to call the first getter, obtain result, and use that result as a parameter to the next getter,
      allowing to check out the entire chain before sending the transaction.
    - This functionality is extensively used in provided scripts - before sending messages to the smart contracts they,
      at first, perform validation using getters - and only then send the messages. If needed, validation can be
      ignored.
    - It should be noted that basechain blocks containing such transactions must have a direct proof link from a masterchain
      block. Therefore, they should be committed directly to a masterchain block. Consequently, for security reasons, newest
      transactions might not be verifiable until some time passes, and they are directly verifiable from a masterchain
      block with a direct shard proof.
- Out of neccessity, but `LiteClient` supports additional `CheckBlockEx` call that does not throw, but rather returns a
  specific (other) error message if execution fails. This allows to properly implement `LiteClient-TransactionChecker`
  chain, that would otherwise require an intermediate contract to capture parameters and correctly dispatch the TONs -
  which would be much more complex, costly, and error-prone. Also, this call supports arbitrary cell `Extra` parameter
  that allows to properly forward data that is required for further processing. 
- Similarly to the above, `TransactionChecker` always responds with a message. In case of success, an opcode provided in
  the contest is used, but, for the error message, another opcode was created for that purpose.
    - Nevertheless, in both cases, even in the error message, error code (that would be thrown) is attached to the
      response message for investigation.
- A "`pedantic`" mode is implemented, that can be used to enforce some stricter validation. That includes masterchain
  block header verification, keyblock number checking (in normal mode validator keys confirm the block even if it's
  keyblock number is not matched - that happens 30 minutes before vset changes because next vset is stored in the config
  by the `Elector`), and necessity of all checks (for example, pendantic request cannot be handled by "`simple`" `TC`
  contract).

### Optimizations and efficiency

The algorithms and logic was developed to be as efficient as possible. To do that, as much calculations were moved
off-chain, as possible, without compromising security and integrity a single bit. Notable optimizations include:

- Contract uses only validator public keys to validate the signatures. To achieve this, client scripts reverse Node
  IDs (hashes of public keys with header) back into public keys, which are then attached with the signature. Therefore,
  no hashing is needed at smart contract side.
- Only necessary amount of validators is retained in contract memory. That is, only these validators who are in
  Masterchain validator set are kept, while all others are not only not stored, but not even looked at, which saves gas.
- The raw material to be hashed (`ton.blockId`) is arranged off chain, and is put near the signatures. During the
  verification, all parts of it that can be verified are checked, but avoiding creation of a cell also saves some
  noticeable resources.
- Minimum amount of storage necessary is used for contracts. Deployment `nonce` for `LC`s is provisioned using
  `keyBlockLt` field, that is later (or immediately) overwritten, while `TC` contracts nonce has variable length, and
  uses as small number of bits as possible for any natural number.
- A novel idea of traversal `hints` helps to significantly decrease necessary computation costs when verifying proofs,
  and with increasing of the tree depth, winnings increase significantly.
    - Following the "move as much as possible off-chain, but safely" pattern, when complex proofs are presented to the
      contract (such as, transaction proof, or shard block proof), the script calculates a path to the required cell,
      and presents it to the contract as string of `hints`, which directly guide the contract towards the required cell
      in tree.
    - Without them, the contract would have to either need significant additional data (to traverse hashmaps, for both
      proofs) or would need to visit all possible cells to find required ones (to traverse bintrees, for shard proofs),
      that would incur tremendous computation and cell opening costs.
    - Nevertheless, security and integrity is preserved - `hints` only operate within a specific verified and
      constrained data structure, thus, incorrect `hint` would just result in verification failure. It is not possible
      to do any circumventing using them - since it is not possible to add anything to a tree that is not there already.
- Trees are trimmed as much as possible, when sent to the contract, while preserving the necessary blocks for contract
  functionality. Implementing this properly even required development of sophisticated bespoke merkle proof generator
  with a number of configurable parameters and options.
- Same-shard optimization: by default, if scripts observe that contracts are deployed in basechain, they generate a
  nonce for `TransactionChecker` in a way, so that first byte of its address ends up the same as the one of its
  `LiteClient` contract. This computation is swift, and ensures, that the `TransactionChecker-LiteClient`
  transaction chain is executed instantly, or at least, as fast as possible.
    - On average, this requires about 128 computations (generally, no more than 256, but limit is much higher), and is
      practically unnoticable to the user. While right now only 4 bit shards are used, 8 bits are chosen for future
      proofing.
- The scripts use only lite-servers of the counterparty network without using any kind of APIs or intermediaries - thus
  resulting in highest efficiency, security, and transparency possible. API web services are used only for high-level
  Blueprint functionality related to the target contracts in the target network. Even there a special spreader is
  implemented to increase reliability of TonCenter testnet access.

---

Actually, there are many more features that I see could be implemented in the contract, but, given the time constraints,
they are an area for future development. Such features would not only extend the functionality of the contract but would
help resolving issues inherent to the required design of the system (such as proving blocks that are earlier than latest
applied keyblock).

---

[Return to main page](../README.md)