import { getFullnodeUrl } from '@mysten/sui.js/client';
import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
console.log('sui.js:', getFullnodeUrl('testnet'));
console.log('sui:', getJsonRpcFullnodeUrl('testnet'));
