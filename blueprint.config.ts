import { Config } from '@ton/blueprint';

export const config: Config = {
    network: {
        endpoint: 'http://109.236.91.95:8081/jsonRPC',
        type: 'custom',
        version: 'v2',
    },
};