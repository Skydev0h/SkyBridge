# Example of contracts deployment and execution

This file contains mandatory "_Addresses of smart-contracts deployed in Testnet and Fastnet respectively, with the
tx_hash of transactions that demonstrate both successful and unsuccessful checks of blocks and transactions._"

A short bare-bones excercpt from this file is provided in `_addresses_tx_hashes.txt` file in the project root folder.

## Deployed smart contracts

The following contracts are deployed in the testing networks (`nonce` = `777`, `extranonce` is automatic):

### Lite Clients

> N.B. The following Lite Clients are maintained with an up-to-date key block by the following cron tasks:
> ```bash
> ./run testnet lc SendNewKeyBlock --nonce=777
> ./run fastnet lc SendNewKeyBlock --nonce=777
> ```

> N.B.2: Self-hosted tech explorer by me is provided in case the "standard" one stops working. This is very possible for
> fastnet one, but a testnet one is also provided just in case.

* Deployment in **testnet**
  * Address: `EQBfDq_86clb9dp2fUvhnMBJ3cBAGazk_RogOnGPgZy6GD1E`
  * Target network Global ID: `-217` (`fastnet`)
  * Nonce value: `777`
  * Explorer links: 
    [Tech explorer](https://test-explorer.toncoin.org/account?account=EQBfDq_86clb9dp2fUvhnMBJ3cBAGazk_RogOnGPgZy6GD1E),
    [Tonscan](https://testnet.tonscan.org/address/kQBfDq_86clb9dp2fUvhnMBJ3cBAGazk_RogOnGPgZy6GIbO),
    [Tonviewer](https://testnet.tonviewer.com/kQBfDq_86clb9dp2fUvhnMBJ3cBAGazk_RogOnGPgZy6GIbO),
    [Tech explorer (self-hosted)](https://testnet.skydev.dev/account?account=EQBfDq_86clb9dp2fUvhnMBJ3cBAGazk_RogOnGPgZy6GD1E)
  * [Detailed deployment log](#deployment-of-liteclient-in-testnet)

* Deployment in **fastnet**
  * Address: `Ef9fabPR9XHYOK2JSq4sLo8YRryK2Od3jghw7BtdrZcWVRgu`
  * Target network Global ID: `-3` (`testnet`)
  * Nonce value: `777`
  * Explorer links:
    [Tech explorer](http://109.236.91.95:8080/account?account=Ef9fabPR9XHYOK2JSq4sLo8YRryK2Od3jghw7BtdrZcWVRgu),
    [Tech explorer (self-hosted)](https://fastnet.skydev.dev/account?account=Ef9fabPR9XHYOK2JSq4sLo8YRryK2Od3jghw7BtdrZcWVRgu)
  * [Detailed deployment log](#deployment-of-liteclient-in-fastnet)

* Additional LiteClient for NewKeyBlock demonstration in testnet:
  * Address: `EQCgon9W9B7eif_LHqbXDwEtWeaK_WEe6cWQwYhR9TLaKaq4`
  * Target network Global ID: `-217` (`fastnet`)
  * Nonce value: `555`
  * Explorer links:
    [Tech explorer](https://test-explorer.toncoin.org/account?account=EQCgon9W9B7eif_LHqbXDwEtWeaK_WEe6cWQwYhR9TLaKaq4),
    [Tonscan](https://testnet.tonscan.org/address/kQCgon9W9B7eif_LHqbXDwEtWeaK_WEe6cWQwYhR9TLaKREy),
    [Tonviewer](https://testnet.tonviewer.com/kQCgon9W9B7eif_LHqbXDwEtWeaK_WEe6cWQwYhR9TLaKREy),
    [Tech explorer (self-hosted)](https://testnet.skydev.dev/account?account=EQCgon9W9B7eif_LHqbXDwEtWeaK_WEe6cWQwYhR9TLaKaq4)
  * [Detailed deployment log](#deployment-of-extra-empty-liteclient-in-testnet) 

> P.S. Funny how even blockchain considered deployment of empty LC "`WeaK_`"
    
### Transaction Checkers

> There are two Transaction Checkers deployed for each network: a "simple" one (not linked to a Lite Client contract),
> and a more secure linked "withLC" one, that checks blocks by politely asking the corresponding Lite Client contract.

* Simple (unsafe) deployment in **testnet**
  * Address: `EQBb2S4hIDNw_ohY07eQRVOS4OaU3pvHqp70fa3DLevHRPAe` 
  * Extra nonce: `None`
  * Linked to LC: `None`
  * Explorer links:
    [Tech explorer](https://test-explorer.toncoin.org/account?account=EQBb2S4hIDNw_ohY07eQRVOS4OaU3pvHqp70fa3DLevHRPAe),
    [Tonscan](https://testnet.tonscan.org/address/kQBb2S4hIDNw_ohY07eQRVOS4OaU3pvHqp70fa3DLevHREuU),
    [Tonviewer](https://testnet.tonviewer.com/kQBb2S4hIDNw_ohY07eQRVOS4OaU3pvHqp70fa3DLevHREuU),
    [Tech explorer (self-hosted)](https://testnet.skydev.dev/account?account=EQBb2S4hIDNw_ohY07eQRVOS4OaU3pvHqp70fa3DLevHRPAe)
  * [Detailed deployment log](#deployment-of-simple-unsafe-transaction-checker-in-testnet)

* Simple (unsafe) deployment in **fastnet**:
  * Address: `Ef9b2S4hIDNw_ohY07eQRVOS4OaU3pvHqp70fa3DLevHRA9W`
  * Extra nonce: `None`
  * Linked to LC: `None`
  * Explorer links:
    [Tech explorer](http://109.236.91.95:8080/account?account=Ef9b2S4hIDNw_ohY07eQRVOS4OaU3pvHqp70fa3DLevHRA9W),
    [Tech explorer (self-hosted)](https://fastnet.skydev.dev/account?account=Ef9b2S4hIDNw_ohY07eQRVOS4OaU3pvHqp70fa3DLevHRA9W)
  * [Detailed deployment log](#deployment-of-simple-unsafe-transaction-checker-in-fastnet)

* Linked (with LC) deployment in **testnet**:
  * Address: `EQBfDTCTajRatvIWl_58pUPMAZKbfzXcAlHIgq8gguNFO1L5`
  * Extra nonce: `37`
  * Linked to LC: `EQBfDq_86clb9dp2fUvhnMBJ3cBAGazk_RogOnGPgZy6GD1E`
  * Explorer links:
    [Tech explorer](https://test-explorer.toncoin.org/account?account=EQBfDTCTajRatvIWl_58pUPMAZKbfzXcAlHIgq8gguNFO1L5),
    [Tonscan](https://testnet.tonscan.org/address/kQBfDTCTajRatvIWl_58pUPMAZKbfzXcAlHIgq8gguNFO-lz),
    [Tonviewer](https://testnet.tonviewer.com/kQBfDTCTajRatvIWl_58pUPMAZKbfzXcAlHIgq8gguNFO-lz),
    [Tech explorer (self-hosted)](https://testnet.skydev.dev/account?account=EQBfDTCTajRatvIWl_58pUPMAZKbfzXcAlHIgq8gguNFO1L5)
  * [Detailed deployment log](#deployment-of-transaction-checker-linked-to-a-lite-client-in-testnet)

* Linked (with LC) deployment in **fastnet**:
  * Address: `Ef_Rg163Gc_eF18Jbn6AcZUQ4ttS4bVADw3c7stG3L1QpJRL`
  * Extra nonce: `None`
  * Linked to LC: `Ef9fabPR9XHYOK2JSq4sLo8YRryK2Od3jghw7BtdrZcWVRgu`
  * Explorer links:
    [Tech explorer](http://109.236.91.95:8080/account?account=Ef_Rg163Gc_eF18Jbn6AcZUQ4ttS4bVADw3c7stG3L1QpJRL),
    [Tech explorer (self-hosted)](https://fastnet.skydev.dev/account?account=Ef_Rg163Gc_eF18Jbn6AcZUQ4ttS4bVADw3c7stG3L1QpJRL)
  * [Detailed deployment log](#deployment-of-transaction-checker-linked-to-a-lite-client-in-fastnet)

## Exemplary transactions

> Here are provided some example transactions, including both successful and unsuccessful checks of blocks and 
> transactions. Of course, there are many more checks and ways to fail them (there are 47 possible [error codes](Errors.md)
> and 73 [test cases](#extra-jest-tests-execution-log) to test for them), but triggering most of them is quite a 
> challenging task. Therefore, we will focus on situations that can be easily reproduced using provided scripts. 

### Application of key blocks (LiteClient::NewKeyBlock)

> To demonstrate this functionality, a separate empty LiteClient was deployed, then two sequential Key Blocks were applied
> to it, and an attempt to apply the last keyblock was done once again.
 
This resulted in the following transactions:

* Application of the older key block ([Tonscan link](https://testnet.tonscan.org/tx/57f240a3a991d5a551bf9b3927469ef976af8a0d3aead6560d1f539c6136e5ee)) 
  * Status: Successful 
  * Block ID: `(0,A000000000000000,29580433)`
  * tx_hash (base64): `k7dpgVIlbqAFz/JCJ80JtQZ/W//sdrrBMCOyh3TEbmc=`
  * tx_hash (hex): `93b7698152256ea005cff24227cd09b5067f5bffec76bac13023b28774c46e67`

* Application of the newer key block ([Tonscan link](https://testnet.tonscan.org/tx/40b2678cc8cdfe5248b2520ca0b914cd21e16981f8cf6885f24637ef437e5e15))
  * Status: Successful 
  * Block ID: `(0,A000000000000000,29580606)`
  * tx_hash (base64): `JEOzIFfFLNYf+JCsY200a/cJurMqn9lCGPKkec08m+g=`
  * tx_hash (hex): `2443b32057c52cd61ff890ac636d346bf709bab32a9fd94218f2a479cd3c9be8`

* Failed repeated keyblock application ([Tonscan link](https://testnet.tonscan.org/tx/fa7c35fd7a4ad948b280689c90de3b70046080855ef5e2b712c8f2d1daf59518))
  * Status: Unsuccessful (exit code `401`: `BAD_SEQNO`)
  * Block ID: `(0,A000000000000000,29580655)`
  * tx_hash (base64): `PB1pxWJJXxcGQTu3lY3f1pZvj/5nTJP1r1+YZGeNA/k=`
  * tx_hash (hex): `3c1d69c562495f1706413bb7958ddfd6966f8ffe674c93f5af5f9864678d03f9`

* Failed application of a non-keyblock ([Tonscan link](https://testnet.tonscan.org/tx/7dce6ca46a5b2e4b247fd7de56fb40fd23c863b625ba1d37c0d7db6be352e89a))
  * Status: Unsuccessful (exit code `203`: `BLK_NOT_KEYBLK`)
  * Block ID: `(0,A000000000000000,29581259)`
  * tx_hash (base64): `U08MTZ1sq5z/OkjSsm/RauQWwklH837CxaM1nIsWkFc=`
  * tx_hash (hex): `534f0c4d9d6cab9cff3a48d2b26fd16ae416c24947f37ec2c5a3359c8b169057`

Also, a successful testnet key block application in fastnet:

* Application of the next key block ([Tech explorer link](http://109.236.91.95:8080/transaction?account=Ef9fabPR9XHYOK2JSq4sLo8YRryK2Od3jghw7BtdrZcWVRgu&lt=876013000003&hash=6B5F35F970F258FDEA28CA6B49E6E88ACA7867D25E6FD8FB51531373EEBFA6AF))
  * Status: Successful (`exit_code:0`)
  * Block ID: `(-1,8000000000000000,876013)`
  * tx_hash: `6B5F35F970F258FDEA28CA6B49E6E88ACA7867D25E6FD8FB51531373EEBFA6AF`

### Verification of blocks (LiteClient::CheckBlock)

* Successful verification of a masterchain block ([Tonscan link](https://testnet.tonscan.org/tx/fe6a1ffcad97a5dc6fd97e1257514ff8b53be88cca340dfe5c37faf77d331b93))
  * Status: Successful
  * Block ID: `(0,6000000000000000,29583464)`
  * tx_hash (base64): `wOVZs/hdOG2/DNZ8bSMvIv7iFkCXwQz5HwNrBA/TNAo=`
  * tx_hash (hex): `c0e559b3f85d386dbf0cd67c6d232f22fee2164097c10cf91f036b040fd3340a`

* Failed verification of an old masterchain block ([Tonscan link](https://testnet.tonscan.org/tx/b70e6f78dc1be6df936e547788e35c564e36bc8d943f2e0e46cd9908f13ee7af))
  * Status: Unsuccessful (exit code `503`: `INVALID_SIGNER`)
  * Block ID: `(0,6000000000000000,29583496)`
  * tx_hash (base64): `sbAGf5C/BZWPxMjyiIuqQor8eS9I7k6g8k9jptu+9/8=`
  * tx_hash (hex): `b1b0067f90bf05958fc4c8f2888baa428afc792f48ee4ea0f24f63a6dbbef7ff`

* Failed verification of a masterchain block from the wrong network ([Tonscan link](https://testnet.tonscan.org/tx/80332464b501a3f5d27f6f137a6b39ce64b985cfe5ec2fe5a85e0bf5436a9e9b))
  * Status: Unsuccessful (exit code `400`: `BAD_GLOBAL_ID`)
  * Block ID: `(0,6000000000000000,29583669)`
  * tx_hash (base64): `rFqutKRBc3T3Lhs0b4oWB+f/ItGnP2FJ+fB8/dR3Ei8=`
  * tx_hash (hex): `ac5aaeb4a4417374f72e1b346f8a1607e7ff22d1a73f6149f9f07cfdd477122f`

For completeness, also providing successful and failed checks by a Lite Client contract in the fastnet:

* Successful verification of a masterchain block ([Tech explorer link](http://109.236.91.95:8080/transaction?account=Ef9fabPR9XHYOK2JSq4sLo8YRryK2Od3jghw7BtdrZcWVRgu&lt=876283000003&hash=03DF00B302F633667B4FFA4F609DD83A37D044C9C4B106E642985C4D32656799))
  * Status: Successful (`exit_code:0`)
  * Block ID: `(-1,8000000000000000,876283)`
  * tx_hash: `03DF00B302F633667B4FFA4F609DD83A37D044C9C4B106E642985C4D32656799`

* Failed verification of an old masterchain block ([Tech explorer link](http://109.236.91.95:8080/transaction?account=Ef9fabPR9XHYOK2JSq4sLo8YRryK2Od3jghw7BtdrZcWVRgu&lt=876396000003&hash=1D29280720346F20DA26DEED28334BC60B4198D790D99BA5F46CF560CFFBF72B))
  * Status: Unsuccessful (`exit_code:503`: `INVALID_SIGNER`)
  * Block ID: `(-1,8000000000000000,876396)`
  * tx_hash: `1D29280720346F20DA26DEED28334BC60B4198D790D99BA5F46CF560CFFBF72B`

### Verification of transactions from the masterchain (TransactionChecker::CheckTransaction)

* Successful verification of a transaction where CheckBlock was called on fastnet above ([Tonscan link](https://testnet.tonscan.org/tx/567ddcd6aa292b54b09d9962bcae98fb198a43f022dd4e2aef5ed258d3e63400))
  * Target transaction:
    * Block: `(-1,8000000000000000,876283)`
    * Hash: `03DF00B302F633667B4FFA4F609DD83A37D044C9C4B106E642985C4D32656799`
  * Using TransactionChecker: Linked (with LC) 
  * Status: Successful (reply op: `0xce02b111` and `0x756adff1`)
  * Block ID: `(0,6000000000000000,29584069)`
  * tx_hash (base64): `yoRHb8xOUfqCd+pOtEq+khOc39ZA8gFDEJBknxizBp0=`
  * tx_hash (hex): `ca84476fcc4e51fa8277ea4eb44abe92139cdfd640f201431090649f18b3069d`

* Failed verification (by TransactionChecker) of a valid block, but with broken hints ([Tonscan link](https://testnet.tonscan.org/tx/6824b9f12376d1e954f145e032b1662235ab84a8802cb60dbbb35fde0729b678))
  * Target transaction:
    * Block: `(-1,8000000000000000,876283)`
    * Hash: `03DF00B302F633667B4FFA4F609DD83A37D044C9C4B106E642985C4D32656799`
    * With active `--deb_bad_hint` option (breaks hints)
  * Using TransactionChecker: Linked (with LC)
  * Status: Unsuccessful (reply op: `0xbadadff1`)
  * Block ID: `(0,6000000000000000,29584429)`
  * tx_hash (base64): `UPTc2bOSl9yC90m4f0tnMR2EitTiNTk+MacK+4AKZNE=`
  * tx_hash (hex): `50f4dcd9b39297dc82f749b87f4b67311d848ad4e235393e31a70afb800a64d1`

* Failed verification (by LiteClient) of an old transaction before remembered key block ([Tonscan link](https://testnet.tonscan.org/tx/22454a2036d0f5a6e6ed03d2ac6679750316e3d4bc83074fd08d15351da56e6b))
  * Target transaction:
    * Block: `(-1,8000000000000000,850954)`
    * Hash: `74C9970D88C917720C39758B5345EE09C39ECA495B71824DE121C5F2CC9F7387`
  * Using TransactionChecker: Linked (with LC)
  * Status: Unsuccessful (reply op: `0xbad2b111` and `0xbadadff1`)
  * Block ID: `(0,6000000000000000,29584069)`
  * tx_hash (base64): `yoRHb8xOUfqCd+pOtEq+khOc39ZA8gFDEJBknxizBp0=`
  * tx_hash (hex): `ca84476fcc4e51fa8277ea4eb44abe92139cdfd640f201431090649f18b3069d`

* Successful verification of a failed transaction above by **simple** TransactionChecker ([Tonscan link](https://testnet.tonscan.org/tx/8f334e31bdf2ff7ea95c00c6ab2af7aa24e1df95fa5509922d324b6bea8bdf81))
  * Target transaction:
    * Block: `(-1,8000000000000000,850954)`
    * Hash: `74C9970D88C917720C39758B5345EE09C39ECA495B71824DE121C5F2CC9F7387`
  * Using TransactionChecker: **Simple** (without LC)
  * Status: Successful (reply op: `0x756adff1`)
  * Block ID: `(0,6000000000000000,29584561)`
  * tx_hash (base64): `ajf0T5aYsv/YoqPDK3JD8EtjdWaLR96htfbhSPvb+/k=`
  * tx_hash (hex): `6a37f44f9698b2ffd8a2a3c32b7243f04b6375668b47dea1b5f6e148fbdbfbf9`

### Verification of transaction from the BASECHAIN (fastnet checks testnet transactions)

* Successful verification of some message from the testnet basechain ([Tech explorer link](http://109.236.91.95:8080/transaction?account=Ef_Rg163Gc_eF18Jbn6AcZUQ4ttS4bVADw3c7stG3L1QpJRL&lt=879869000007&hash=249D313DBC37B8671F9E190060BEC36F6A65BB776B3B52829889EE3008BD4B9B))
  * Target transaction:
    * Block: `(0,6000000000000000,29585375)`
    * Hash: `813b433c929dad8dbca4812a303bed123a51f9721d7953d499bda7d94ee80149`
  * Using TransactionChecker: Linked (without LC)
  * Status: Successful (reply op: `x{CE02B111` and `x{756ADFF1`)
  * Block ID: `(-1,8000000000000000,879869)`
  * tx_hash: `249D313DBC37B8671F9E190060BEC36F6A65BB776B3B52829889EE3008BD4B9B`

* Failed verification of testnet TransactionChecker deployment (in previous epoch) ([Tech explorer link](http://109.236.91.95:8080/transaction?account=Ef_Rg163Gc_eF18Jbn6AcZUQ4ttS4bVADw3c7stG3L1QpJRL&lt=879558000007&hash=E7363A3F5429BDDBD6030DFF0D49F40D2AA2AC1121C28C4AAB7B5E719E05EAA8))
  * Target transaction:
    * Block: `(0,A000000000000000,29577320)`
    * Hash: `7984ebf26f6fc6941834cb68108620a6aef6998f5beb74910dfa911d5e92c5f4`
  * Using TransactionChecker: Linked (without LC)
  * Status: Unsuccessful (reply op: `x{BAD2B111` and `x{BADADFF1`)
  * Block ID: `(-1,8000000000000000,879558)`
  * tx_hash: `E7363A3F5429BDDBD6030DFF0D49F40D2AA2AC1121C28C4AAB7B5E719E05EAA8`

---

# Detailed deployment logs

## Deployment of LiteClient in testnet

[Go back to the top section](#lite-clients)

```
$ ./run testnet lc DeployWithKeyBlock --nonce=777
Using file: LiteClient/DeployWithKeyBlock
Connected to wallet at address: EQCzdqLTQeleRMhrHE8RS8a_vDlFEGqM8CJQkCUBctUq8P6g
:) Welcome to LiteClient Deploy LC (with KeyBlock) script (:
--- Using provided nonce value 777
-*- Deploy value not provided, using default 0.2 TON
-*- You can provide deploy value via --value or -v argument, e.g. --value=<value>
>_> Running on testnet network, automatically inferring Global ID -217 (fastnet (contest))
->- Deploying with Global ID setting: -217 (fastnet (contest))
-!- Please save nonce and global id values, they may be used to determine address of the contract
--- Hint: You can override seqno by using -s or --seqno argument if really required
... Sender balance: 51.30 TON, message value: 0.2 TON
Using global config https://contest.com/file/400780400604/4/P0UeFR_X1mg.1626.json/04de18101ec5af6dea automatically chosen for global ID -217 (fastnet (contest))
-i- Last MC block seqno: 864284, keyblock seqno: 850955, gID: (-217 (fastnet (contest)))
-*- Contract is not initialized, using last available keyblock 850955 for initialization
--- LiteClient SC address: EQBfDq_86clb9dp2fUvhnMBJ3cBAGazk_RogOnGPgZy6GD1E
Sent transaction
Completed!
--- Current contract state:
Global ID: -217 (fastnet (contest))
Key block info:
    Seq no: 850955
    Time: 1738669212
    LT: 850955000000
Signing info:
    Validator public keys and weights:
        102691262082018523945617138919939636862385699193032599961605471690383003539029: 1152921504606846976
    Total weight: 1152921504606846976
    Calculated total weight: 1152921504606846976
```

## Deployment of LiteClient in fastnet

[Go back to the top section](#lite-clients)

```
$ ./run fastnet lc DeployWithKeyBlock --nonce=777
Using file: LiteClient/DeployWithKeyBlock
Connected to wallet at address: Ef-PXsAys3e3RsK03UQbNeNXow0P3WlvABML-uzexTtqjfKm
:) Welcome to LiteClient Deploy LC (with KeyBlock) script (:
--- Using provided nonce value 777
-*- Deploy value not provided, using default 2 TON
-*- You can provide deploy value via --value or -v argument, e.g. --value=<value>
>_> Running on custom network, automatically inferring Global ID -3 (testnet)
->- Deploying with Global ID setting: -3 (testnet)
-!- Please save nonce and global id values, they may be used to determine address of the contract
--- Hint: You can override seqno by using -s or --seqno argument if really required
-M- Using masterchain for smart contract automatically because wallet is on MC
--- Hint: You may use --sc to suppress this behavior (but it would then fail on fastchain)
... Sender balance: 42.99 TON, message value: 2 TON
Using global config https://ton-blockchain.github.io/testnet-global.config.json automatically chosen for global ID -3 (testnet)
-i- Last MC block seqno: 27802576, keyblock seqno: 27799583, gID: (-3 (testnet))
-*- Contract is not initialized, using last available keyblock 27799583 for initialization
--- LiteClient SC address: Ef9fabPR9XHYOK2JSq4sLo8YRryK2Od3jghw7BtdrZcWVRgu
Sent transaction
Completed!
--- Current contract state:
Global ID: -3 (testnet)
Key block info:
    Seq no: 27799583
    Time: 1738675915
    LT: 30987389000000
Signing info:
    Validator public keys and weights:
        16224265712137427548333053666607306476213717102592639744242589190121238315327: 86779932280546497
        23846130895600314586850434724226844991616936847432259785999907560087072300372: 61985727900341984
        42319016612762346821404617288257861588786187505390133999143873425794148823701: 13763185590657959
        51024309844170960289817597779933947908322909325820273597639789500600500416580: 86779932280546497
        52035940563625324757147687724624556313728922932077571938067827191301246153654: 61985727900341984
        65032035486108374085179209267939001043155600763771082583976737326647621332244: 86779932280546497
        70907784508583518615832784861171392096456977929761599865499943465169435845908: 86779932280546497
        72453530889608690379662460285475690261608481248479441257978866746900040169322: 86779994266212412
        72457372455878588580739321999570310966647773605471497311224660187098224694929: 86779994266212412
        73057833698523761842930739954826252756724522180833102970900214116295637041288: 61985727900341984
        73653451424953894601015271429176818690612668211647627183545212691203659765688: 47261387859662971
        88166184790422286706075294481066303114618040271067439010045812096951333079772: 61985727900341984
        88233815652720858212853860649047556238047856023067795817429669928500556398443: 86779932280546497
        89452952747326412616994511815977319723987762552545100050820604937030058567612: 86779932280546497
        111604369078010930030725331275799320317109029581311618780826599596307401134227: 61985740422686212
    Total weight: 1065192807690078884
    Calculated total weight: 1065192807690078884
```

## Deployment of extra empty LiteClient in testnet

[Go back to the top section](#lite-clients)

```
$ ./run testnet lc DeployEmpty --nonce=555 --unsafe
Using file: LiteClient/DeployEmpty
Connected to wallet at address: EQCzdqLTQeleRMhrHE8RS8a_vDlFEGqM8CJQkCUBctUq8P6g
:) Welcome to LiteClient Deploy LC (empty) script (:
--- Using provided nonce value 555
-*- Deploy value not provided, using default 0.2 TON
-*- You can provide deploy value via --value or -v argument, e.g. --value=<value>
>_> Running on testnet network, automatically inferring Global ID -217 (fastnet (contest))
->- Deploying with Global ID setting: -217 (fastnet (contest))
-!- Please save nonce and global id values, they may be used to determine address of the contract
... Sender balance: 51.23 TON, message value: 0.2 TON
--- LiteClient SC address: EQCgon9W9B7eif_LHqbXDwEtWeaK_WEe6cWQwYhR9TLaKaq4
Sent transaction
Completed!
--- Current contract state:
Global ID: -217 (fastnet (contest))
Key block info:
    Seq no: 0
    Time: 0
    LT: 555
Signing info:
    Validator public keys and weights:
        <EMPTY>
    Total weight: 0
    Calculated total weight: 0
```

---

## Deployment of simple (unsafe) Transaction Checker in testnet

[Go back to the top section](#transaction-checkers)

```
$ ./run testnet tc DeploySimple --unsafe
Using file: TransactionChecker/DeploySimple
Connected to wallet at address: EQCzdqLTQeleRMhrHE8RS8a_vDlFEGqM8CJQkCUBctUq8P6g
:) Welcome to LiteClient Deploy TC (simple) script (:
-*- Deploy value not provided, using default 0.2 TON
-*- You can provide deploy value via --value or -v argument, e.g. --value=<value>
... Hint: you can provide extra nonce by using --extranonce=<number> argument (0 for None)
... Sender balance: 51.27 TON, message value: 0.2 TON
--- TransactionChecker SC address: EQBb2S4hIDNw_ohY07eQRVOS4OaU3pvHqp70fa3DLevHRPAe
Sent transaction
Completed!
--- Current contract state:
Extra nonce: None
 LiteClient: None
```

## Deployment of simple (unsafe) Transaction Checker in fastnet

[Go back to the top section](#transaction-checkers)

```
$ ./run fastnet tc DeploySimple --unsafe
Using file: TransactionChecker/DeploySimple
Connected to wallet at address: Ef-PXsAys3e3RsK03UQbNeNXow0P3WlvABML-uzexTtqjfKm
:) Welcome to LiteClient Deploy TC (simple) script (:
-*- Deploy value not provided, using default 2 TON
-*- You can provide deploy value via --value or -v argument, e.g. --value=<value>
... Hint: you can provide extra nonce by using --extranonce=<number> argument (0 for None)
-M- Using masterchain for smart contract automatically because wallet is on MC
--- Hint: You may use --sc to suppress this behavior (but it would then fail on fastchain)
... Sender balance: 41.17 TON, message value: 2 TON
--- TransactionChecker SC address: Ef9b2S4hIDNw_ohY07eQRVOS4OaU3pvHqp70fa3DLevHRA9W
Sent transaction
Completed!
--- Current contract state:
Extra nonce: None
 LiteClient: None
```

---

## Deployment of Transaction Checker linked to a Lite Client in testnet

[Go back to the top section](#transaction-checkers)

```
$ ./run testnet tc DeployWithLC --nonce=777
Using file: TransactionChecker/DeployWithLC
Connected to wallet at address: EQCzdqLTQeleRMhrHE8RS8a_vDlFEGqM8CJQkCUBctUq8P6g
:) Welcome to LiteClient Deploy TC (with LC) script (:
-*- Deploy value not provided, using default 0.2 TON
-*- You can provide deploy value via --value or -v argument, e.g. --value=<value>
... Hint: you can provide extra nonce by using --extranonce=<number> argument (0 for None)
... Sender balance: 51.25 TON, message value: 0.2 TON
>_> Running on testnet network, automatically inferring Global ID -217 (fastnet (contest))
Found active LiteClient contract at EQBfDq_86clb9dp2fUvhnMBJ3cBAGazk_RogOnGPgZy6GD1E
^_^ For optimization purposes, will calculate nonce to match TC in the same shard as the LC.
--- You can override this behavior by specifying --extranonce=... manually (0 to omit)
--- TransactionChecker SC address: EQBfDTCTajRatvIWl_58pUPMAZKbfzXcAlHIgq8gguNFO1L5
Sent transaction
Completed!
--- Current contract state:
Extra nonce: 37
 LiteClient: EQBfDq_86clb9dp2fUvhnMBJ3cBAGazk_RogOnGPgZy6GD1E
```

## Deployment of Transaction Checker linked to a Lite Client in fastnet

[Go back to the top section](#transaction-checkers)

```
$ ./run fastnet tc DeployWithLC --nonce=777
Using file: TransactionChecker/DeployWithLC
Connected to wallet at address: Ef-PXsAys3e3RsK03UQbNeNXow0P3WlvABML-uzexTtqjfKm
:) Welcome to LiteClient Deploy TC (with LC) script (:
-*- Deploy value not provided, using default 2 TON
-*- You can provide deploy value via --value or -v argument, e.g. --value=<value>
... Hint: you can provide extra nonce by using --extranonce=<number> argument (0 for None)
... Sender balance: 40.79 TON, message value: 2 TON
-M- Using masterchain for smart contract automatically because wallet is on MC
--- Hint: You may use --sc to suppress this behavior (but it would then fail on fastchain)
>_> Running on custom network, automatically inferring Global ID -3 (testnet)
Found active LiteClient contract at Ef9fabPR9XHYOK2JSq4sLo8YRryK2Od3jghw7BtdrZcWVRgu
--- TransactionChecker SC address: Ef_Rg163Gc_eF18Jbn6AcZUQ4ttS4bVADw3c7stG3L1QpJRL
Sent transaction
Completed!
--- Current contract state:
Extra nonce: None
 LiteClient: Ef9fabPR9XHYOK2JSq4sLo8YRryK2Od3jghw7BtdrZcWVRgu
```

---

# Detailed test transaction execution logs

## LiteClient NewKeyBlock application

### Initial application of KeyBlock to an empty LiteClient

Applied key block `850663` (manually selected) to the empty LiteClient with nonce `555`:

```
$ ./run testnet lc SendNewKeyBlock --nonce=555 --seqno=850663
Using file: LiteClient/SendNewKeyBlock
Connected to wallet at address: EQCzdqLTQeleRMhrHE8RS8a_vDlFEGqM8CJQkCUBctUq8P6g
:) Welcome to LiteClient SendKeyBlock script (:
--- Using provided block seqno override value 850663
>_> Running on testnet network, automatically inferring Global ID -217 (fastnet (contest))
Found active LiteClient contract at EQCgon9W9B7eif_LHqbXDwEtWeaK_WEe6cWQwYhR9TLaKaq4
-*- message value not provided, using default 0.5 TON
-*- You can provide message value via --value or -v argument, e.g. --value=<value>
... Sender balance: 51.20 TON, message value: 0.5 TON
Current contract state:
Global ID: -217 (fastnet (contest))
Key block info:
    Seq no: 0
    Time: 0
    LT: 555
Signing info:
    Validator public keys and weights:
        <EMPTY>
    Total weight: 0
    Calculated total weight: 0
Using global config https://contest.com/file/400780400604/4/P0UeFR_X1mg.1626.json/04de18101ec5af6dea automatically chosen for global ID -217 (fastnet (contest))
-i- Last MC block seqno: 872883, keyblock seqno: 850955, gID: (-217 (fastnet (contest)))
-!- Warning: Using provided keyblock seqno override 850663
Preflight check succeeded
Hint: You may use --locally flag to only execute preflight getter, without sending transaction.
Sent transaction
Completed!
--- Current contract state:
Global ID: -217 (fastnet (contest))
Key block info:
    Seq no: 850663
    Time: 1738668912
    LT: 850663000000
Signing info:
    Validator public keys and weights:
        18699519522971078918268672668129929800091247461980465715882134364527023090596: 1152921504606846976
    Total weight: 1152921504606846976
    Calculated total weight: 1152921504606846976
```

### Application of next KeyBlock to the LiteClient

Applied key block `850955` (automatically selected) to the same LiteClient:

```
$ ./run testnet lc SendNewKeyBlock --nonce=555
Using file: LiteClient/SendNewKeyBlock
Connected to wallet at address: EQCzdqLTQeleRMhrHE8RS8a_vDlFEGqM8CJQkCUBctUq8P6g
:) Welcome to LiteClient SendKeyBlock script (:
--- Hint: You can override seqno by using -s or --seqno argument if really required
>_> Running on testnet network, automatically inferring Global ID -217 (fastnet (contest))
Found active LiteClient contract at EQCgon9W9B7eif_LHqbXDwEtWeaK_WEe6cWQwYhR9TLaKaq4
-*- message value not provided, using default 0.5 TON
-*- You can provide message value via --value or -v argument, e.g. --value=<value>
... Sender balance: 51.19 TON, message value: 0.5 TON
Current contract state:
Global ID: -217 (fastnet (contest))
Key block info:
    Seq no: 850663
    Time: 1738668912
    LT: 850663000000
Signing info:
    Validator public keys and weights:
        18699519522971078918268672668129929800091247461980465715882134364527023090596: 1152921504606846976
    Total weight: 1152921504606846976
    Calculated total weight: 1152921504606846976
Using global config https://contest.com/file/400780400604/4/P0UeFR_X1mg.1626.json/04de18101ec5af6dea automatically chosen for global ID -217 (fastnet (contest))
-i- Last MC block seqno: 873286, keyblock seqno: 850955, gID: (-217 (fastnet (contest)))
-i- Need to find next keyblock after seqno 850663
-i- Found next keyblock seqno: 850955
Preflight check succeeded
Hint: You may use --locally flag to only execute preflight getter, without sending transaction.
Sent transaction
Completed!
--- Current contract state:
Global ID: -217 (fastnet (contest))
Key block info:
    Seq no: 850955
    Time: 1738669212
    LT: 850955000000
Signing info:
    Validator public keys and weights:
        102691262082018523945617138919939636862385699193032599961605471690383003539029: 1152921504606846976
    Total weight: 1152921504606846976
    Calculated total weight: 1152921504606846976
```

### Failure to apply the current key block once more

Attempted to apply key block `850955` (manually selected) once more to the same LiteClient.

```
$ ./run testnet lc SendNewKeyBlock --nonce=555 --seqno=850955 --anyway
Using file: LiteClient/SendNewKeyBlock
Connected to wallet at address: EQCzdqLTQeleRMhrHE8RS8a_vDlFEGqM8CJQkCUBctUq8P6g
:) Welcome to LiteClient SendKeyBlock script (:
--- Using provided block seqno override value 850955
>_> Running on testnet network, automatically inferring Global ID -217 (fastnet (contest))
Found active LiteClient contract at EQCgon9W9B7eif_LHqbXDwEtWeaK_WEe6cWQwYhR9TLaKaq4
-*- message value not provided, using default 0.5 TON
-*- You can provide message value via --value or -v argument, e.g. --value=<value>
... Sender balance: 51.17 TON, message value: 0.5 TON
Current contract state:
Global ID: -217 (fastnet (contest))
Key block info:
    Seq no: 850955
    Time: 1738669212
    LT: 850955000000
Signing info:
    Validator public keys and weights:
        102691262082018523945617138919939636862385699193032599961605471690383003539029: 1152921504606846976
    Total weight: 1152921504606846976
    Calculated total weight: 1152921504606846976
Using global config https://contest.com/file/400780400604/4/P0UeFR_X1mg.1626.json/04de18101ec5af6dea automatically chosen for global ID -217 (fastnet (contest))
-i- Last MC block seqno: 873403, keyblock seqno: 850955, gID: (-217 (fastnet (contest)))
-!- Warning: Using provided keyblock seqno override 850955
Preflight check failed: ERR_BAD_SEQNO
Continuing anyway... (--anyway flag provided)
Hint: You may use --locally flag to only execute preflight getter, without sending transaction.
Sent transaction
Completed!
--- Current contract state:
Global ID: -217 (fastnet (contest))
Key block info:
    Seq no: 850955
    Time: 1738669212
    LT: 850955000000
Signing info:
    Validator public keys and weights:
        102691262082018523945617138919939636862385699193032599961605471690383003539029: 1152921504606846976
    Total weight: 1152921504606846976
    Calculated total weight: 1152921504606846976
```

### Failure to apply a non-keyblock as a key block

Attempted to apply key block `850956` (manually selected) as a key block (it is not).

```
$ ./run testnet lc SendNewKeyBlock --nonce=555 --seqno=850956 --anyway
Using file: LiteClient/SendNewKeyBlock
Connected to wallet at address: EQCzdqLTQeleRMhrHE8RS8a_vDlFEGqM8CJQkCUBctUq8P6g
:) Welcome to LiteClient SendKeyBlock script (:
--- Using provided block seqno override value 850956
>_> Running on testnet network, automatically inferring Global ID -217 (fastnet (contest))
Found active LiteClient contract at EQCgon9W9B7eif_LHqbXDwEtWeaK_WEe6cWQwYhR9TLaKaq4
-*- message value not provided, using default 0.5 TON
-*- You can provide message value via --value or -v argument, e.g. --value=<value>
... Sender balance: 51.16 TON, message value: 0.5 TON
Current contract state:
Global ID: -217 (fastnet (contest))
Key block info:
    Seq no: 850955
    Time: 1738669212
    LT: 850955000000
Signing info:
    Validator public keys and weights:
        102691262082018523945617138919939636862385699193032599961605471690383003539029: 1152921504606846976
    Total weight: 1152921504606846976
    Calculated total weight: 1152921504606846976
Using global config https://contest.com/file/400780400604/4/P0UeFR_X1mg.1626.json/04de18101ec5af6dea automatically chosen for global ID -217 (fastnet (contest))
-i- Last MC block seqno: 874821, keyblock seqno: 850955, gID: (-217 (fastnet (contest)))
-!- Warning: Using provided keyblock seqno override 850956
Warning: Failed to read p34 from keyblock config
Preflight check failed: ERR_BLK_NOT_KEYBLK
Continuing anyway... (--anyway flag provided)
Hint: You may use --locally flag to only execute preflight getter, without sending transaction.
Sent transaction
Completed!
--- Current contract state:
Global ID: -217 (fastnet (contest))
Key block info:
    Seq no: 850955
    Time: 1738669212
    LT: 850955000000
Signing info:
    Validator public keys and weights:
        102691262082018523945617138919939636862385699193032599961605471690383003539029: 1152921504606846976
    Total weight: 1152921504606846976
    Calculated total weight: 1152921504606846976
```

### Application of a new testnet keyblock in fastnet

```
$ ./run fastnet lc SendNewKeyBlock --nonce=777
Using file: LiteClient/SendNewKeyBlock
Connected to wallet at address: Ef-PXsAys3e3RsK03UQbNeNXow0P3WlvABML-uzexTtqjfKm
:) Welcome to LiteClient SendKeyBlock script (:
--- Hint: You can override seqno by using -s or --seqno argument if really required
-M- Using masterchain for smart contract automatically because wallet is on MC
--- Hint: You may use --sc to suppress this behavior (but it would then fail on fastchain)
>_> Running on custom network, automatically inferring Global ID -3 (testnet)
Found active LiteClient contract at Ef9fabPR9XHYOK2JSq4sLo8YRryK2Od3jghw7BtdrZcWVRgu
-*- message value not provided, using default 5 TON
-*- You can provide message value via --value or -v argument, e.g. --value=<value>
... Sender balance: 40.41 TON, message value: 5 TON
Current contract state:
Global ID: -3 (testnet)
Key block info:
    Seq no: 27799583
    Time: 1738675915
    LT: 30987389000000
Signing info:
    Validator public keys and weights:
        16224265712137427548333053666607306476213717102592639744242589190121238315327: 86779932280546497
        23846130895600314586850434724226844991616936847432259785999907560087072300372: 61985727900341984
        42319016612762346821404617288257861588786187505390133999143873425794148823701: 13763185590657959
        51024309844170960289817597779933947908322909325820273597639789500600500416580: 86779932280546497
        52035940563625324757147687724624556313728922932077571938067827191301246153654: 61985727900341984
        < 10 more entries hidden >
    Total weight: 1065192807690078884
    Calculated total weight: 1065192807690078884
Using global config https://ton-blockchain.github.io/testnet-global.config.json automatically chosen for global ID -3 (testnet)
-i- Last MC block seqno: 27807110, keyblock seqno: 27805367, gID: (-3 (testnet))
-i- Need to find next keyblock after seqno 27799583
-i- Found next keyblock seqno: 27804650
Preflight check succeeded
Hint: You may use --locally flag to only execute preflight getter, without sending transaction.
Sent transaction
Completed!
--- Current contract state:
Global ID: -3 (testnet)
Key block info:
    Seq no: 27804650
    Time: 1738688515
    LT: 30992734000000
Signing info:
    Validator public keys and weights:
        16224265712137427548333053666607306476213717102592639744242589190121238315327: 86779932280546497
        23846130895600314586850434724226844991616936847432259785999907560087072300372: 61985727900341984
        42319016612762346821404617288257861588786187505390133999143873425794148823701: 13763185590657959
        51024309844170960289817597779933947908322909325820273597639789500600500416580: 86779932280546497
        52035940563625324757147687724624556313728922932077571938067827191301246153654: 61985727900341984
        < 10 more entries hidden >
    Total weight: 1065192807690078884
    Calculated total weight: 1065192807690078884
```

## LiteClient CheckBlock verification

### Successful check of a proper masterchain block from the current epoch

```
$ ./run testnet lc SendCheckBlock --nonce=777 --seqno=850956
Using file: LiteClient/SendCheckBlock
Connected to wallet at address: EQCzdqLTQeleRMhrHE8RS8a_vDlFEGqM8CJQkCUBctUq8P6g
:) Welcome to LiteClient SendCheckBlock script (:
>_> Running on testnet network, automatically inferring Global ID -217 (fastnet (contest))
Found active LiteClient contract at EQBfDq_86clb9dp2fUvhnMBJ3cBAGazk_RogOnGPgZy6GD1E
-*- message value not provided, using default 0.2 TON
-*- You can provide message value via --value or -v argument, e.g. --value=<value>
--- Using provided block seqno value 850956
-*- Hint: For more security you can enable pedantic mode with --pedantic or -p flag
... Sender balance: 51.15 TON, message value: 0.2 TON
Current contract state:
Global ID: -217 (fastnet (contest))
Key block info:
    Seq no: 850955
    Time: 1738669212
    LT: 850955000000
Signing info:
    Validator public keys and weights:
        102691262082018523945617138919939636862385699193032599961605471690383003539029: 1152921504606846976
    Total weight: 1152921504606846976
    Calculated total weight: 1152921504606846976
Using global config https://contest.com/file/400780400604/4/P0UeFR_X1mg.1626.json/04de18101ec5af6dea automatically chosen for global ID -217 (fastnet (contest))
-i- Last MC block seqno: 875274, keyblock seqno: 850955, gID: (-217 (fastnet (contest)))
Preflight check succeeded
Hint: You may use --locally flag to only execute preflight getter, without sending transaction.
Sent transaction
Completed!
--- Current contract state:
Global ID: -217 (fastnet (contest))
Key block info:
    Seq no: 850955
    Time: 1738669212
    LT: 850955000000
Signing info:
    Validator public keys and weights:
        102691262082018523945617138919939636862385699193032599961605471690383003539029: 1152921504606846976
    Total weight: 1152921504606846976
    Calculated total weight: 1152921504606846976
```

### Failed check of an old masterchain block from the previous epoch

```
$ ./run testnet lc SendCheckBlock --nonce=777 --seqno=850954 --anyway
Using file: LiteClient/SendCheckBlock
Connected to wallet at address: EQCzdqLTQeleRMhrHE8RS8a_vDlFEGqM8CJQkCUBctUq8P6g
:) Welcome to LiteClient SendCheckBlock script (:
>_> Running on testnet network, automatically inferring Global ID -217 (fastnet (contest))
Found active LiteClient contract at EQBfDq_86clb9dp2fUvhnMBJ3cBAGazk_RogOnGPgZy6GD1E
-*- message value not provided, using default 0.2 TON
-*- You can provide message value via --value or -v argument, e.g. --value=<value>
--- Using provided block seqno value 850954
-*- Hint: For more security you can enable pedantic mode with --pedantic or -p flag
... Sender balance: 51.14 TON, message value: 0.2 TON
Current contract state:
Global ID: -217 (fastnet (contest))
Key block info:
    Seq no: 850955
    Time: 1738669212
    LT: 850955000000
Signing info:
    Validator public keys and weights:
        102691262082018523945617138919939636862385699193032599961605471690383003539029: 1152921504606846976
    Total weight: 1152921504606846976
    Calculated total weight: 1152921504606846976
Using global config https://contest.com/file/400780400604/4/P0UeFR_X1mg.1626.json/04de18101ec5af6dea automatically chosen for global ID -217 (fastnet (contest))
-i- Last MC block seqno: 875352, keyblock seqno: 850955, gID: (-217 (fastnet (contest)))
Preflight check failed: ERR_INVALID_SIGNER
Continuing anyway... (--anyway flag provided)
Hint: You may use --locally flag to only execute preflight getter, without sending transaction.
Sent transaction
Completed!
--- Current contract state:
Global ID: -217 (fastnet (contest))
Key block info:
    Seq no: 850955
    Time: 1738669212
    LT: 850955000000
Signing info:
    Validator public keys and weights:
        102691262082018523945617138919939636862385699193032599961605471690383003539029: 1152921504606846976
    Total weight: 1152921504606846976
    Calculated total weight: 1152921504606846976
```

### Failed check of a masterchain block from the wrong network

```
$ ./run testnet lc SendCheckBlock --nonce=777 --seqno=27806886 --inclhdr --glconf=https://ton-blockchain.github.io/testnet-global.config.json --ignore_wrong_gid --anyway
Using file: LiteClient/SendCheckBlock
Connected to wallet at address: EQCzdqLTQeleRMhrHE8RS8a_vDlFEGqM8CJQkCUBctUq8P6g
:) Welcome to LiteClient SendCheckBlock script (:
>_> Running on testnet network, automatically inferring Global ID -217 (fastnet (contest))
Found active LiteClient contract at EQBfDq_86clb9dp2fUvhnMBJ3cBAGazk_RogOnGPgZy6GD1E
-*- message value not provided, using default 0.2 TON
-*- You can provide message value via --value or -v argument, e.g. --value=<value>
--- Using provided block seqno value 27806886
-*- Hint: For more security you can enable pedantic mode with --pedantic or -p flag
... Sender balance: 51.13 TON, message value: 0.2 TON
Current contract state:
Global ID: -217 (fastnet (contest))
Key block info:
    Seq no: 850955
    Time: 1738669212
    LT: 850955000000
Signing info:
    Validator public keys and weights:
        102691262082018523945617138919939636862385699193032599961605471690383003539029: 1152921504606846976
    Total weight: 1152921504606846976
    Calculated total weight: 1152921504606846976
Using provided global config https://ton-blockchain.github.io/testnet-global.config.json
-i- Last MC block seqno: 27807007, keyblock seqno: 27805367, gID: (-217 (fastnet (contest)))
Preflight check failed: ERR_BAD_GLOBAL_ID
Continuing anyway... (--anyway flag provided)
Hint: You may use --locally flag to only execute preflight getter, without sending transaction.
Sent transaction
Completed!
--- Current contract state:
Global ID: -217 (fastnet (contest))
Key block info:
    Seq no: 850955
    Time: 1738669212
    LT: 850955000000
Signing info:
    Validator public keys and weights:
        102691262082018523945617138919939636862385699193032599961605471690383003539029: 1152921504606846976
    Total weight: 1152921504606846976
    Calculated total weight: 1152921504606846976
```

### Successful check of a masterchain block by contract in fastnet

```
$ ./run fastnet lc SendCheckBlock --nonce=777 --seqno=27806886
Using file: LiteClient/SendCheckBlock
Connected to wallet at address: Ef-PXsAys3e3RsK03UQbNeNXow0P3WlvABML-uzexTtqjfKm
:) Welcome to LiteClient SendCheckBlock script (:
-M- Using masterchain for smart contract automatically because wallet is on MC
--- Hint: You may use --sc to suppress this behavior (but it would then fail on fastchain)
>_> Running on custom network, automatically inferring Global ID -3 (testnet)
Found active LiteClient contract at Ef9fabPR9XHYOK2JSq4sLo8YRryK2Od3jghw7BtdrZcWVRgu
-*- message value not provided, using default 2 TON
-*- You can provide message value via --value or -v argument, e.g. --value=<value>
--- Using provided block seqno value 27806886
-*- Hint: For more security you can enable pedantic mode with --pedantic or -p flag
... Sender balance: 36.39 TON, message value: 2 TON
Current contract state:
Global ID: -3 (testnet)
Key block info:
    Seq no: 27805367
    Time: 1738690316
    LT: 30993492000000
Signing info:
    Validator public keys and weights:
        2615401309710593313957446756228591682529375524363666302449820133452394367333: 88843784170737927
        6967889139883220258768306116565478343744895183600860841170303741912627834353: 46893178965493401
        11021084303767753342780985312967341148208835474787068577264523175408890483595: 63459909296087213
        15226496587139854042621529479352264670884766272718908472641717839361955820821: 63459909296087213
        23166220731422093406254352589960972350510100083282549574829651522636973657609: 88843784170737927
        < 10 more entries hidden >
    Total weight: 1089018037274269862
    Calculated total weight: 1089018037274269862
Using global config https://ton-blockchain.github.io/testnet-global.config.json automatically chosen for global ID -3 (testnet)
-i- Last MC block seqno: 27807218, keyblock seqno: 27805367, gID: (-3 (testnet))
Preflight check succeeded
Hint: You may use --locally flag to only execute preflight getter, without sending transaction.
Sent transaction
Completed!
--- Current contract state:
Global ID: -3 (testnet)
Key block info:
    Seq no: 27805367
    Time: 1738690316
    LT: 30993492000000
Signing info:
    Validator public keys and weights:
        2615401309710593313957446756228591682529375524363666302449820133452394367333: 88843784170737927
        6967889139883220258768306116565478343744895183600860841170303741912627834353: 46893178965493401
        11021084303767753342780985312967341148208835474787068577264523175408890483595: 63459909296087213
        15226496587139854042621529479352264670884766272718908472641717839361955820821: 63459909296087213
        23166220731422093406254352589960972350510100083282549574829651522636973657609: 88843784170737927
        < 10 more entries hidden >
    Total weight: 1089018037274269862
    Calculated total weight: 1089018037274269862
```

### Failed check of a masterchain block by contract in fastnet

```
$ ./run fastnet lc SendCheckBlock --nonce=777 --seqno=27805366 --anyway
Using file: LiteClient/SendCheckBlock
Connected to wallet at address: Ef-PXsAys3e3RsK03UQbNeNXow0P3WlvABML-uzexTtqjfKm
:) Welcome to LiteClient SendCheckBlock script (:
-M- Using masterchain for smart contract automatically because wallet is on MC
--- Hint: You may use --sc to suppress this behavior (but it would then fail on fastchain)
>_> Running on custom network, automatically inferring Global ID -3 (testnet)
Found active LiteClient contract at Ef9fabPR9XHYOK2JSq4sLo8YRryK2Od3jghw7BtdrZcWVRgu
-*- message value not provided, using default 2 TON
-*- You can provide message value via --value or -v argument, e.g. --value=<value>
--- Using provided block seqno value 27805366
-*- Hint: For more security you can enable pedantic mode with --pedantic or -p flag
... Sender balance: 35.61 TON, message value: 2 TON
Current contract state:
Global ID: -3 (testnet)
Key block info:
    Seq no: 27805367
    Time: 1738690316
    LT: 30993492000000
Signing info:
    Validator public keys and weights:
        2615401309710593313957446756228591682529375524363666302449820133452394367333: 88843784170737927
        6967889139883220258768306116565478343744895183600860841170303741912627834353: 46893178965493401
        11021084303767753342780985312967341148208835474787068577264523175408890483595: 63459909296087213
        15226496587139854042621529479352264670884766272718908472641717839361955820821: 63459909296087213
        23166220731422093406254352589960972350510100083282549574829651522636973657609: 88843784170737927
        < 10 more entries hidden >
    Total weight: 1089018037274269862
    Calculated total weight: 1089018037274269862
Using global config https://ton-blockchain.github.io/testnet-global.config.json automatically chosen for global ID -3 (testnet)
-i- Last MC block seqno: 27807263, keyblock seqno: 27805367, gID: (-3 (testnet))
Preflight check failed: ERR_INVALID_SIGNER
Continuing anyway... (--anyway flag provided)
Hint: You may use --locally flag to only execute preflight getter, without sending transaction.
Sent transaction
Completed!
--- Current contract state:
Global ID: -3 (testnet)
Key block info:
    Seq no: 27805367
    Time: 1738690316
    LT: 30993492000000
Signing info:
    Validator public keys and weights:
        2615401309710593313957446756228591682529375524363666302449820133452394367333: 88843784170737927
        6967889139883220258768306116565478343744895183600860841170303741912627834353: 46893178965493401
        11021084303767753342780985312967341148208835474787068577264523175408890483595: 63459909296087213
        15226496587139854042621529479352264670884766272718908472641717839361955820821: 63459909296087213
        23166220731422093406254352589960972350510100083282549574829651522636973657609: 88843784170737927
        < 10 more entries hidden >
    Total weight: 1089018037274269862
    Calculated total weight: 1089018037274269862
```

## TransactionChecker CheckTransaction verification of masterchain transactions

### Successful verification of a transaction where CheckBlock was called on fastnet above

```
$ ./run testnet tc SendCheckTransaction --type=withlc --nonce=777 --txseqno=876283 --txhash=03DF00B302F633667B4FFA4F609DD83A37D044C9C4B106E642985C4D32656799
Using file: TransactionChecker/SendCheckTransaction
Connected to wallet at address: EQCzdqLTQeleRMhrHE8RS8a_vDlFEGqM8CJQkCUBctUq8P6g
:) Welcome to LiteClient SendCheckTransaction script (:
... Hint: you can provide extra nonce by using --extranonce=<number> argument (0 for None)
>_> Running on testnet network, automatically inferring Global ID -217 (fastnet (contest))
Found active LiteClient contract at EQBfDq_86clb9dp2fUvhnMBJ3cBAGazk_RogOnGPgZy6GD1E
^_^ For optimization purposes, will calculate nonce to match TC in the same shard as the LC.
--- You can override this behavior by specifying --extranonce=... manually (0 to omit)
Found active TransactionChecker contract at EQBfDTCTajRatvIWl_58pUPMAZKbfzXcAlHIgq8gguNFO1L5
-*- message value not provided, using default 0.2 TON
-*- You can provide message value via --value or -v argument, e.g. --value=<value>
-*- Hint: For more security you can enable pedantic mode with --pedantic or -p flag
Using global config https://contest.com/file/400780400604/4/P0UeFR_X1mg.1626.json/04de18101ec5af6dea automatically chosen for global ID -217 (fastnet (contest))
-i- Last MC block seqno: 876690, keyblock seqno: 850955, gID: (-217 (fastnet (contest)))
Performing preflight check... (Step 1/2)
Performing preflight check... (Step 2/2)
Preflight check succeeded (advanced, on TC and then on LC)
Hint: You may use --locally flag to only execute preflight getter, without sending transaction.
Sent transaction
Completed!
--- Current contract state:
Extra nonce: 37
 LiteClient: EQBfDq_86clb9dp2fUvhnMBJ3cBAGazk_RogOnGPgZy6GD1E
```

### Failed verification (by TransactionChecker) of a valid block, but with broken hints

```
$ ./run testnet tc SendCheckTransaction --type=withlc --nonce=777 --txseqno=876283 --txhash=03DF00B302F633667B4FFA4F609DD83A37D044C9C4B106E642985C4D32656799 --deb_bad_hint --anyway
Using file: TransactionChecker/SendCheckTransaction
Connected to wallet at address: EQCzdqLTQeleRMhrHE8RS8a_vDlFEGqM8CJQkCUBctUq8P6g
:) Welcome to LiteClient SendCheckTransaction script (:
... Hint: you can provide extra nonce by using --extranonce=<number> argument (0 for None)
>_> Running on testnet network, automatically inferring Global ID -217 (fastnet (contest))
Found active LiteClient contract at EQBfDq_86clb9dp2fUvhnMBJ3cBAGazk_RogOnGPgZy6GD1E
^_^ For optimization purposes, will calculate nonce to match TC in the same shard as the LC.
--- You can override this behavior by specifying --extranonce=... manually (0 to omit)
Found active TransactionChecker contract at EQBfDTCTajRatvIWl_58pUPMAZKbfzXcAlHIgq8gguNFO1L5
-*- message value not provided, using default 0.2 TON
-*- You can provide message value via --value or -v argument, e.g. --value=<value>
-*- Hint: For more security you can enable pedantic mode with --pedantic or -p flag
Using global config https://contest.com/file/400780400604/4/P0UeFR_X1mg.1626.json/04de18101ec5af6dea automatically chosen for global ID -217 (fastnet (contest))
-i- Last MC block seqno: 877543, keyblock seqno: 850955, gID: (-217 (fastnet (contest)))
Warning: Debug option bad hints active, hints will be corrupted
Removing latest hint entry...
Performing preflight check... (Step 1/2)
Preflight check failed: ERR_TX_HASH_INVALID
Continuing anyway... (--anyway flag provided)
Hint: You may use --locally flag to only execute preflight getter, without sending transaction.
Sent transaction
Completed!
--- Current contract state:
Extra nonce: 37
 LiteClient: EQBfDq_86clb9dp2fUvhnMBJ3cBAGazk_RogOnGPgZy6GD1E
```

### Failed verification (by LiteClient) of an old transaction before remembered key block 

```
$ ./run testnet tc SendCheckTransaction --type=withlc --nonce=777 --txseqno=850954 --txhash=74C9970D88C917720C39758B5345EE09C39ECA495B71824DE121C5F2CC9F7387 --anyway
Using file: TransactionChecker/SendCheckTransaction
Connected to wallet at address: EQCzdqLTQeleRMhrHE8RS8a_vDlFEGqM8CJQkCUBctUq8P6g
:) Welcome to LiteClient SendCheckTransaction script (:
... Hint: you can provide extra nonce by using --extranonce=<number> argument (0 for None)
>_> Running on testnet network, automatically inferring Global ID -217 (fastnet (contest))
Found active LiteClient contract at EQBfDq_86clb9dp2fUvhnMBJ3cBAGazk_RogOnGPgZy6GD1E
^_^ For optimization purposes, will calculate nonce to match TC in the same shard as the LC.
--- You can override this behavior by specifying --extranonce=... manually (0 to omit)
Found active TransactionChecker contract at EQBfDTCTajRatvIWl_58pUPMAZKbfzXcAlHIgq8gguNFO1L5
-*- message value not provided, using default 0.2 TON
-*- You can provide message value via --value or -v argument, e.g. --value=<value>
-*- Hint: For more security you can enable pedantic mode with --pedantic or -p flag
Using global config https://contest.com/file/400780400604/4/P0UeFR_X1mg.1626.json/04de18101ec5af6dea automatically chosen for global ID -217 (fastnet (contest))
-i- Last MC block seqno: 877075, keyblock seqno: 850955, gID: (-217 (fastnet (contest)))
Performing preflight check... (Step 1/2)
Performing preflight check... (Step 2/2)
Preflight check failed: ERR_BAD_SEQNO
Continuing anyway... (--anyway flag provided)
Hint: You may use --locally flag to only execute preflight getter, without sending transaction.
Sent transaction
Completed!
--- Current contract state:
Extra nonce: 37
 LiteClient: EQBfDq_86clb9dp2fUvhnMBJ3cBAGazk_RogOnGPgZy6GD1E
```

### Successful verification of a failed transaction above by simple TransactionChecker

```
$ ./run testnet tc SendCheckTransaction --type=simple --nonce=777 --txseqno=850954 --txhash=74C9970D88C917720C39758B5345EE09C39ECA495B71824DE121C5F2CC9F7387
Using file: TransactionChecker/SendCheckTransaction
Connected to wallet at address: EQCzdqLTQeleRMhrHE8RS8a_vDlFEGqM8CJQkCUBctUq8P6g
:) Welcome to LiteClient SendCheckTransaction script (:
... Hint: you can provide extra nonce by using --extranonce=<number> argument (0 for None)
Found active TransactionChecker contract at EQBb2S4hIDNw_ohY07eQRVOS4OaU3pvHqp70fa3DLevHRPAe
-*- message value not provided, using default 0.2 TON
-*- You can provide message value via --value or -v argument, e.g. --value=<value>
>_> Running on testnet network, automatically inferring Global ID -217 (fastnet (contest))
-*- Hint: For more security you can enable pedantic mode with --pedantic or -p flag
Using global config https://contest.com/file/400780400604/4/P0UeFR_X1mg.1626.json/04de18101ec5af6dea automatically chosen for global ID -217 (fastnet (contest))
-i- Last MC block seqno: 877856, keyblock seqno: 850955, gID: (-217 (fastnet (contest)))
Performing preflight check...
Preflight check succeeded (simple, on TC)
Hint: You may use --locally flag to only execute preflight getter, without sending transaction.
Sent transaction
Completed!
--- Current contract state:
Extra nonce: None
 LiteClient: None
```

## TransactionChecker (on fastnet) CheckTransaction verification of BASECHAIN transactions

### Successful verification of some message from the testnet basechain

```
./run fastnet tc SendCheckTransaction --type=withlc --nonce=777 --txseqno=29585375 --txshard=6 --txhash=813b433c929dad8dbca4812a303bed123a51f9721d7953d499bda7d94ee80149
Using file: TransactionChecker/SendCheckTransaction
Connected to wallet at address: Ef-PXsAys3e3RsK03UQbNeNXow0P3WlvABML-uzexTtqjfKm
:) Welcome to LiteClient SendCheckTransaction script (:
... Hint: you can provide extra nonce by using --extranonce=<number> argument (0 for None)
-M- Using masterchain for smart contract automatically because wallet is on MC
--- Hint: You may use --sc to suppress this behavior (but it would then fail on fastchain)
>_> Running on custom network, automatically inferring Global ID -3 (testnet)
Found active LiteClient contract at Ef9fabPR9XHYOK2JSq4sLo8YRryK2Od3jghw7BtdrZcWVRgu
Found active TransactionChecker contract at Ef_Rg163Gc_eF18Jbn6AcZUQ4ttS4bVADw3c7stG3L1QpJRL
-*- message value not provided, using default 2 TON
-*- You can provide message value via --value or -v argument, e.g. --value=<value>
-*- Hint: For more security you can enable pedantic mode with --pedantic or -p flag
Using global config https://ton-blockchain.github.io/testnet-global.config.json automatically chosen for global ID -3 (testnet)
-i- Last MC block seqno: 27808660, keyblock seqno: 27805367, gID: (-3 (testnet))
Performing preflight check... (Step 1/2)
Performing preflight check... (Step 2/2)
Preflight check succeeded (advanced, on TC and then on LC)
Hint: You may use --locally flag to only execute preflight getter, without sending transaction.
Sent transaction
Completed!
--- Current contract state:
Extra nonce: None
 LiteClient: Ef9fabPR9XHYOK2JSq4sLo8YRryK2Od3jghw7BtdrZcWVRgu
```

### Failed verification of testnet TransactionChecker deployment (in previous epoch)

```
./run fastnet tc SendCheckTransaction --type=withlc --nonce=777 --txseqno=29577320 --txshard=A --txhash=7984ebf26f6fc6941834cb68108620a6aef6998f5beb74910dfa911d5e92c5f4 --anyway
Using file: TransactionChecker/SendCheckTransaction
Connected to wallet at address: Ef-PXsAys3e3RsK03UQbNeNXow0P3WlvABML-uzexTtqjfKm
:) Welcome to LiteClient SendCheckTransaction script (:
... Hint: you can provide extra nonce by using --extranonce=<number> argument (0 for None)
-M- Using masterchain for smart contract automatically because wallet is on MC
--- Hint: You may use --sc to suppress this behavior (but it would then fail on fastchain)
>_> Running on custom network, automatically inferring Global ID -3 (testnet)
Found active LiteClient contract at Ef9fabPR9XHYOK2JSq4sLo8YRryK2Od3jghw7BtdrZcWVRgu
Found active TransactionChecker contract at Ef_Rg163Gc_eF18Jbn6AcZUQ4ttS4bVADw3c7stG3L1QpJRL
-*- message value not provided, using default 2 TON
-*- You can provide message value via --value or -v argument, e.g. --value=<value>
-*- Hint: For more security you can enable pedantic mode with --pedantic or -p flag
Using global config https://ton-blockchain.github.io/testnet-global.config.json automatically chosen for global ID -3 (testnet)
-i- Last MC block seqno: 27808534, keyblock seqno: 27805367, gID: (-3 (testnet))
tx 7984EBF26F6FC6941834CB68108620A6AEF6998F5BEB74910DFA911D5E92C5F4
Performing preflight check... (Step 1/2)
Performing preflight check... (Step 2/2)
Preflight check failed: ERR_BAD_SEQNO
Continuing anyway... (--anyway flag provided)
Hint: You may use --locally flag to only execute preflight getter, without sending transaction.
Sent transaction
Completed!
--- Current contract state:
Extra nonce: None
 LiteClient: Ef9fabPR9XHYOK2JSq4sLo8YRryK2Od3jghw7BtdrZcWVRgu
```

# Extra: Jest tests execution log

```
$ npm run test

> sky-bridge@0.5.0 test
> jest --verbose --forceExit

 PASS  tests/TransactionChecker.spec.ts (8.065 s)
  TransactionChecker tests
    ✓ prerequisite: check deployed LC with latest keyblock config (21 ms)
    ✓ deploy: check simple TC config (7 ms)
    ✓ deploy: check withlc TC config (7 ms)
    ✓ simple positive: accept MC transaction proof without block and signatures (10 ms)
    ✓ simple positive: accept MC transaction proof without signatures (11 ms)
    ✓ simple negative: REJECT MC transaction proof without signatures PEDANTIC (10 ms)
    ✓ simple negative: REJECT MC transaction proof WITH signatures (22 ms)
    ✓ withlc positive: accept MC transaction proof with signatures (normal) (42 ms)
    ✓ withlc positive: accept MC transaction proof with signatures (pedantic) (36 ms)
    ✓ withlc negative: REJECT MC transaction proof WITHOUT block and signatures (normal) (10 ms)
    ✓ withlc negative: REJECT MC transaction proof WITHOUT signatures (normal) (11 ms)
    ✓ simple positive: accept BC (WC) transaction proof without signatures (12 ms)
    ✓ simple negative: REJECT BC (WC) transaction proof without signatures PEDANTIC (11 ms)
    ✓ simple negative: REJECT BC (WC) transaction proof WITH signatures (29 ms)
    ✓ withlc positive: accept BC (WC) transaction proof with signatures (normal) (49 ms)
    ✓ withlc positive: accept BC (WC) transaction proof with signatures (pedantic) (48 ms)
    ✓ withlc negative: REJECT BC (WC) transaction proof WITHOUT block and signatures (normal) (12 ms)
    ✓ withlc negative: REJECT BC (WC) transaction proof WITHOUT signatures (normal) (13 ms)
    ✓ simple negative: REJECT BC (WC) transaction proof WITHOUT shard proof (12 ms)
    ✓ simple negative: REJECT BC (WC) transaction proof WITHOUT shard hints (14 ms)
    ✓ withlc negative: REJECT BC (WC) transaction proof WITHOUT shard proof (11 ms)
    ✓ withlc negative: REJECT BC (WC) transaction proof WITHOUT shard hints (12 ms)
    ✓ simple negative: REJECT MC transaction with CORRUPTED transaction hints (12 ms)
    ✓ simple negative: REJECT SC transaction with CORRUPTED transaction hints (12 ms)
    ✓ simple negative: REJECT SC transaction with CORRUPTED shard hints (13 ms)
    ✓ withlc negative: REJECT MC transaction with CORRUPTED transaction hints (10 ms)
    ✓ withlc negative: REJECT SC transaction with CORRUPTED transaction hints (13 ms)
    ✓ withlc negative: REJECT SC transaction with CORRUPTED shard hints (12 ms)
    ✓ simple negative: REJECT MC transaction with REPLACED MC block (10 ms)
    ✓ simple negative: REJECT SC transaction with REPLACED MC block (13 ms)
    ✓ withlc negative: REJECT MC transaction with REPLACED MC block (11 ms)
    ✓ withlc negative: REJECT SC transaction with REPLACED MC block (12 ms)
    ✓ simple negative: REJECT MC transaction with REPLACED transaction (11 ms)
    ✓ simple negative: REJECT SC transaction with REPLACED transaction (12 ms)
    ✓ withlc negative: REJECT MC transaction with REPLACED transaction (11 ms)
    ✓ withlc negative: REJECT SC transaction with REPLACED transaction (12 ms)
    ✓ withlc negative on LC: REJECT MC transaction proof with block and CORRUPTED signatures (normal) (31 ms)
    
 PASS  tests/LiteClient.spec.ts (26.598 s)
  LiteClient tests
    ✓ deployment: empty LC (28 ms)
    ✓ deployment: LC with latest keyblock (545 ms)
    ✓ deployment: LC with previous keyblock (399 ms)
    ✓ deployment: LC with two keyblocks back (505 ms)
    ✓ deployment: LC with three keyblocks back (384 ms)
    ✓ newkeyblock positive: empty LC apply latest keyblock (507 ms)
    ✓ newkeyblock positive: LC with previous keyblock apply latest keyblock (796 ms)
    ✓ newkeyblock positive: LC with two keyblocks back apply previous and latest keyblock in order (1356 ms)
    ✓ newkeyblock negative: LC with two keyblocks back REJECT latest keyblock (868 ms)
    ✓ newkeyblock negative: LC with previous keyblock REJECT latest keyblock WITHOUT signatures (649 ms)
    ✓ newkeyblock negative: LC with previous keyblock REJECT latest keyblock with MODIFIED signed material (815 ms)
    ✓ newkeyblock negative: LC with previous keyblock REJECT latest keyblock with MODIFIED signature (816 ms)
    ✓ newkeyblock negative: LC with previous keyblock REJECT latest keyblock with KEY CONFUSION (792 ms)
    ✓ newkeyblock negative: LC with previous keyblock REJECT latest keyblock with EMPTY CELL (793 ms)
    ✓ newkeyblock negative: LC with previous keyblock REJECT latest keyblock with LOW SIG WEIGHT (845 ms)
    ✓ newkeyblock negative: LC with previous keyblock REJECT latest keyblock with proof WITHOUT HEADER (750 ms)
    ✓ newkeyblock negative: LC with previous keyblock REJECT latest keyblock with proof WITHOUT P34 (839 ms)
    ✓ newkeyblock negative: LC with previous keyblock REJECT latest keyblock with signatures for WRONG BLOCK (923 ms)
    ✓ newkeyblock negative: LC with previous keyblock and REJECT two keyblocks back (794 ms)
    ✓ checkblock positive: LC with latest keyblock check latest block (minimal proof) (533 ms)
    ✓ checkblock negative: LC with latest keyblock REJECT latest block (minimal proof w/ pedantic) (461 ms)
    ✓ checkblock positive: LC with latest keyblock check latest block (proof with hdr) (554 ms)
    ✓ checkblock positive: LC with latest keyblock check latest block (proof with hdr w/ pedantic) (477 ms)
    ✓ checkblock positive: LC with latest keyblock check almost latest block (minimal proof) (674 ms)
    ✓ checkblock positive: LC with latest keyblock check next block after keyblock (minimal proof) (635 ms)
    ✓ checkblock negative: LC with latest keyblock FAIL checking keyblock itself (minimal proof) (655 ms)
    ✓ checkblock negative: LC with latest keyblock FAIL checking older block to it (minimal proof) (639 ms)
    ✓ checkblock negative: LC with latest keyblock FAIL checking keyblock itself (proof with hdr) (529 ms)
    ✓ checkblock negative: LC with latest keyblock FAIL checking previous block to it (proof with hdr) (495 ms)
    ✓ checkblock negative: LC with latest keyblock FAIL checking latest block with wrong sigs (629 ms)
    ✓ checkblock negative: LC with latest keyblock FAIL checking latest block WITHOUT signatures (288 ms)
    ✓ checkblock negative: LC with latest keyblock FAIL checking latest block with MODIFIED signed material (519 ms)
    ✓ checkblock negative: LC with latest keyblock FAIL checking latest block with MODIFIED signature (461 ms)
    ✓ checkblock negative: LC with latest keyblock FAIL checking latest block with KEY CONFUSION (471 ms)
    ✓ cb pedantic test: should VERIFY block with vset from previous key block to its last key block if NOT PEDANTIC (1574 ms)
    ✓ cb pedantic test: should REJECT block with vset from previous key block to its last key block if PEDANTIC (1636 ms)

A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Test Suites: 2 passed, 2 total
Tests:       73 passed, 73 total
Snapshots:   0 total
Time:        27.26 s
Ran all test suites.
Force exiting Jest: Have you considered using `--detectOpenHandles` to detect async operations that kept running after all tests finished?
```