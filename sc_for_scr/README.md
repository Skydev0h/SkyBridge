# Smart Contracts for scripts

## Description

Put `*.compiled.json` scripts here to stabilize code, so that `blueprint run` scripts would use it instead of compiling.

This makes sure that when used in production or more stable testing environment, scripts do not get accidentally changed.

Also, it ensures that contract code would not change because of recompiling with newer or other compiler.

## Usage

Run `npx blueprint build` to build the required contract, and copy its `.compiled.json` file from `build` folder to here.

Files in the `build` folder are not used directly because they can be accidentally overwritten.