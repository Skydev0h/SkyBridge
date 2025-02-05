# SkyBridge

This contest entry implements the [TON Trustless Bridge Challenge](https://contest.com/docs/TrustlessBridgeChallenge)
task with the aim to strictly follow the contest requirements as much as possible 
and to make it as user and cron friendly as possible with Blueprint scripts used for build, 
interaction, and deployment.


## More information

You can get more information on this page or by visiting specialized documentation pages:

* **[Examples page](docs/Example.md)** contains **mandatory deployment and usage demonstration** (see 
  [this section](https://contest.com/docs/TrustlessBridgeChallenge#solution), p.3), with the "_addresses of 
  smart-contracts deployed in Testnet and Fastnet respectively, with the tx_hash of transactions that demonstrate 
  both successful and unsuccessful checks of blocks and transactions_". In addition to the required points, links
  to the explorers are provided for each contract and transaction in question. 
  * **Please visit this page, _especially_, if you are the Contest Judge**. 

* [Features page](docs/Features.md) highlights all the additional features and optimizations that are present in the project.
* [Errors page](docs/Errors.md) lists possible error codes that may occur during contract execution for troubleshooting.

> _Fun moment: I cannot create more files in the `docs` directory, because a `Cell` can have only `4` `refs` :)_

## Features

### Required functionality

All the requirements of the contest are implemented:

* `LiteClient` smart contract remembers neccessary information to verify masterchain and key blocks,
  and supports application of the next key blocks in the chain, as well as, 
  verification of masterchain blocks covered by the current remembered key block.

* `TransactionChecker` verifies transaction proofs (that the transaction really belongs to the declared block), 
  and supports autonomous "`simple`" mode without interaction to LiteClient contract 
  (can be useful if the block is already verified, by a separate call to `LC`, for example), 
  but also much more secure "`withLC`" mode in which `TC` first asks `LC` about validity of given keyblock.



### Additional functionality and optimizations

There are lots, really, **LOTS** of additional functionality and sophisticated optimizations that were implemented.
Actually so much, that [they deserve their own documentation page](docs/Features.md). 
Please pay that page a visit, you will not be disappointed!
:-)



## Security

The contracts are written to be as trustless and secure as possible. 
The very basic core of the security lies in the TVM itself and the guarantees that it provides to the contract. 
With proper usage, after initial cross-check, the contract can be considered completely trustless, 
and it would allow verifying transactions and masterchain keyblocks on-chain as a service for the other contracts.

Basically, after initialization, each following masterchain block (including ordinary ones and keyblocks) is verified
to be signed by a majority of the validators from the current epoch (last keyblock). Therefore, it is impossible
to fake without the majority of validators. If the majority of validators decides to create a fake block, then
they would be able to hard-fork the network by dictating their own rules or change config parameters via voting,
therefore, such condition would pose more threat to the network itself, than to this contract.

Therefore, in such way, we can verify any masterblock by checking its signatures. The masterchain block contains 
all the transactions that allow us to verify transactions in the masterchain, and basechain shard block hashes,
which allows to verify basechain blocks. The basechain blocks also contains transactions, so this chain allows us
to verify all masterchain blocks, transactions in them, as well as basechain blocks and transaction in these.

Finally, to do it optimally, we have a Merkle Tree machinery, that allows to prune unused branches in the tree (Block
is a tree of cells), and only pass what is required to the contract. Meanwhile, TVM guarantees that tree hash is
always correct, the tree is not modified in any way and this data can be trusted. Therefore, even observing only
a merkle proof, that has only limited subset of branches, if we can check the neccessary cell in such proof, we can
guarantee that it also exists in the original block, from which the proof was created.

All this allows us to efficiently prove blocks and transactions with minimum necessary information and security
comparable to the security of the blockchain itself.



## Quick start guide

This guide is optimized for Linux, but you can also follow it on Windows by using WSL.
Most likely, everything should also work fine on macOS, although, untested.



### Preparation

First, you need to install node.js npm dependencies by using:

```bash
npm install
```

Note that everything was developed and tested on `Ubuntu 24.04.1` with `Node.js v22.13.1` and `npm v10.9.2`. Therefore,
if you encounter issues, make sure that your version of Node and / or npm is enough for operation.

For proper functionality of the scripts and conventional helpers, make sure that `patch-package` have patched
`@ton/blueprint` package properly. 
The reason for that, is because Blueprint natively doesn’t provide support of Masterchain wallets 
(and `fastnet` operates exclusively on Masterchain), and that support required some patching. 
To be on the safe side, you should run patch apply command:

```bash
npx patch-package
```



### Using packaged contracts and helper

For the simplest experience possible, pre-compiled and tested contracts are provided in the `sc_for_scr` directory,
pre-seeded keyphrase with some assets on both testnet and fastnet networks is provided in `load_mnemonic.sh` file, 
and a `run` helper makes it easier to execute commands avoiding Blueprint syntax pitfalls.

To use all that goodness, follow the next steps in the guide.

> Note, that depending on archive type and tool, it may happen, that `load_mnemonic.sh` and `run` files may lose `x`
> its `x` bit. Then you will get errors when trying to execute `./run` commands. To fix such a problem, simply run
> ```bash
> chmod +x run load_mnemonic.sh
> ```



#### Choosing nonce and network

First, choose a nonce number that you will use for contract deployment and further interaction. 
Think of it as a contract identifier in conjunction with Global ID (more on it later). 
Lets, for example, choose `123` for this quick guide.

Also, choose in which network you want to deploy the contract.
It is recommended to deploy them either in fastnet or testnet - 
the scripts will conveniently choose counterparty network Global ID and a Masterchain usage option for you, when needed.
For ease of observation (because fastnet has no proper explorer), let's deploy the contract in the `testnet`.


#### Deploying `LiteClient` contract

You can use the following command to deploy your first `LiteClient` contract safely 
(with immediate application of the counterparty blockchain latest KeyBlock):

```bash
./run testnet lc DeployWithKeyBlock --nonce=123
```

After running this command you will be presented with a multitude of messages explaining what's going on, 
and you will see `Sent transaction`, `Waiting for deploy`, and, finally, 
`Completed!` and `Current contract state` messages.

The contract state is actually read from on-chain and contains information extracted from the key block  
that was provided during deployment and stored in the contract, for verification of future masterchain blocks, 
including key ones.

> Also, look for `LiteClient SC address` blue message - it shows address of the deployed contract, 
> and you can use any conventional explorer to take a look at it.


#### Sending a block for checking

Next, let's actually test the masterchain block verification. 
To do that, issue a command for sending a masterchain block for the check. 
If no `--seqno` parameter is provided, the script automatically picks the latest available block for the dispatch:

```bash
./run testnet lc SendCheckBlock --nonce=123
```

The check is first done locally (`Preflight`) and then is sent to the blockchain.

> To take a look at the transaction, you can visit either `wallet` or `LiteClient` contract addresses in your favorite
> explorer (both are presented in command output).


#### Sending an old block and bypassing preflight

Next, for more advanced topics, let's see what happens if not everything goes smoothly enough. 
To do that, let's try sending a too old block for verification. 
However, if the block is too old, a lite client would not have information to get signatures. 
Therefore, the best option is to choose "`Seq no`" in the contract state output, decrease it by one,
and provide as value to the `--seqno` parameter.
For example, if `Seq no` in your output is `680939`, then call the following command:

```bash
./run testnet lc SendCheckBlock --nonce=123 --seqno=680938 --anyway
```

The `--anyway` option is required to bypass the `Preflight` check and allow message sending even when it fails. 
After the execution, you will be able to observe your failed transaction in the blockchain. 
To decode the errors, you can use [a special table](docs/Errors.md).


#### Sending a new key block to the contract

Later, when the validator set would change, you would need to update the key block information in the contract. 
This can be easily done by running a simple command:

```bash
./run testnet lc SendNewKeyBlock --nonce=123
```

This command intelligently looks at the contract state, checks which key blocks are available, 
and sends the proper new block message, if necessary. 
If no new block can be applied, the command informs about that directly.


#### Keeping `LiteClient` in sync

For proper functionality of the contract, it is recommended to orchestrate 
a periodic execution of such a command using cron or other utilities. 
The reason for that is because, as mentioned above, 
it may become so much out of sync it would not be possible to catch up


#### Deploying `TransactionChecker` contract

Now let's move on to the `TransactionChecker` contract. 
It can be deployed in two modes - standalone "simple" mode without blocks verification, 
and more secure "withLC" mode that verifies each block with a corresponding `LiteClient` contract. 
For best practice, we will use the "withLC" mode in this guide.

To deploy a corresponding `TransactionChecker` to our `LiteClient` from the previous section, you need to run a simple
command (pay attention to the `tc` param):

```bash
./run testnet tc DeployWithLC --nonce=123
```

Running this command a `TC` contract will be deployed in as efficient way as possible.

> Note that, by default, if contracts are deployed in the basechain (testnet),
> extra nonce value will be nonzero and will be automatically calculated to put the `TC` contract
> into the same chain as `LC` one for lightning-fast chain executions.
> This requires some computations, and if they are too slow for your computer,
> you may remember the `Extra nonce:` value, and supply it as `--extranonce=...` parameter in further calls.
> In general case that is not required, however, the extra nonce is calculated each time.


#### Sending a transaction from the latest block

Generally, characterizing a transaction for locating it can be a quite complex task, 
but for purposes of this quick start a special `--txdemo` parameter was created that lifts this burden from the user.
Using it, you can call:

```bash
./run testnet tc SendCheckTransaction --nonce=123 --type=withlc --txdemo
```

In this mode, the transaction locator will automatically choose the latest masterchain block and would not apply any
constraints - therefore, some transaction from the latest masterchain block will be chosen and will be sent for
verification.


#### Getting to know more advanced usage

This concludes a quick start guide that shows you the basics. 
If you want, you can inspect help for each command by calling it with the `-h` or `--help` parameter.
For example:
```bash
./run testnet lc DeployEmpty -h
./run testnet lc DeployWithKeyBlock -h
./run testnet lc SendCheckBlock -h
./run testnet lc SendNewKeyBlock -h

./run testnet tc DeploySimple -h
./run testnet tc DeployWithLC -h
./run testnet tc SendCheckTransaction -h
````


### Compiling the contracts and using the code

To compile the smart contracts, you can use the usual command:

```bash
npx blueprint build
```

This will ask you which contract to work with and builds it.

The resulting files are put into `build`  directory.


#### Precompiled contracts

As for the precompiled contracts code, if you want to use the fresh-built contracts or do some code changes, 
you have two options:

* Delete the `*.json` files from `sc_for_scr` folder if code changes are frequent - then, for each script call,
  contracts will be compiled anew - therefore, scripts will lose old contracts if code is changed.

* Run the build command and copy files from `build` directory to the `sc_for_scr` one - this will freeze these
  contracts' code, and will use specifically that revision during all invocations of the scripts.


## Tests

To run the tests, you can use the following command:

```bash
npm run test
```

Please don't use `jest` without `--forceExit` directly, because `ton-lite-client` API causes jest to misbehave and 
doesn't exit correctly.

> The tests use both mainnet and testnet network lite-servers for testing; therefore, they require stable internet 
> connection and functioning mainnet and testnet. If you encounter some strange errors during the tests, check the 
> networks' status and try again.
> 
> The reason behind that is that, for some reason, LiteClient test is very unstable when executed on the mainnet, but, 
> on the other hand, TransactionChecker test very often times out if executed on testnet. Therefore, each test is 
> executed against the network it best works with.

You can take a look at how a proper test execution result should look [in this section](docs/Example.md#extra-jest-tests-execution-log).


## Project structure

- `contracts` - source code of all the project smart contracts and their dependencies.
- `docs` - markdown documentation files.
- `sc_for_scr` - precompiled contracts for stable script usage.
- `scripts` - scripts used by the project for deployment and interaction.
- `tests` - comprehensive tests covering many aspects of the contracts.
- `utils` - significant part of TypeScript code logic used by scripts and wrappers.
- `wrappers` - wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]
  serialization primitives and compilation functions.
