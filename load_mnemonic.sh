#!/bin/bash

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "You must use . $0 or source $0 to load env variables"
  exit
fi

dir="$(dirname "${BASH_SOURCE[0]}")"

# This file was intentionally added to be able to easily test out FastNet and TestNet with a sample mnemonic
# If you have some other mnemonic or wallet version you would like to use - feel free to fill it in
# Note that this file is always sourced by ./run, therefore all calls there will automatically use these entries.
export WALLET_MNEMONIC="soon torch ill honey harbor load friend jump rubber door caught yellow route fever wife bus leave paper camp surround napkin protect blood midnight"
export WALLET_VERSION="v3R2"

# Extra convenience features provided by the patch. Fantastic!
# export WALLET_WORKCHAIN="-1" # EXCESSIVE fees on testnet masterchain, keep out!
unset WALLET_WORKCHAIN
export WALLET_MC_ON_NETWORK="custom" # masterchain on fastnet, workchain on testnet
export WALLET_PROVIDER="mnemonic"

if [[ "$LOAD_MNEMONIC_SHH" == "" ]]; then
  echo "Env vars are set, but to properly use blueprint with fastchain network it needs a patch. Let me check it for you."
fi
target="$dir/node_modules/@ton/blueprint/dist/network/createNetworkProvider.js"
lkup="let workchain = parseInt(process.env.WALLET_WORKCHAIN ?? '0');"
if [ ! -f "$target" ]; then
  echo "Warning: I cannot find target file. Make sure that you installed packages (npm install) in project directory".
else
  patch1=$(grep -c "$lkup" "$target")
  patch2=$(grep -c "workchain," "$target")
  patch3=$(grep -c "if (process.env.WALLET_MC_ON_NETWORK === network) {" "$target")
  if [[ "$patch1,$patch2,$patch3" == "1,1,1" ]]; then
    if [[ "$LOAD_MNEMONIC_SHH" == "" ]]; then
      echo "I see that the patch is present, now you can swiftly call scripts in testnet and fastnet (using mnemonic)"
    fi
  else
    echo "WARNING!!! It seems that the target file is not patched! Please call patch-package in project manually!"
    echo "$patch1,$patch2"
  fi
fi