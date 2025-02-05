import { Cell as TonCoreCell } from '@ton/core';
import { Cell as RocksCell } from '@oraichain/tonbridge-utils/build/types';

// Not the most efficient thing, but damn!

export async function toRock(cell: TonCoreCell): Promise<RocksCell> {
    return (await RocksCell.fromBoc(cell.toBoc().toString('hex')))[0];
}

export async function fromRock(cell: RocksCell): Promise<TonCoreCell> {
    return TonCoreCell.fromBoc(Buffer.from(await cell.toBoc()))[0];
}