import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl('testnet') });

async function main() {
  const mod = await client.getNormalizedMoveModule({
    package: '0xdee9',
    module: 'clob_v2',
  });
  
  // also check custodian_v2 if it exists
  try {
      const cust = await client.getNormalizedMoveModule({
        package: '0xdee9',
        module: 'custodian_v2',
      });
      console.log('CUSTODIAN:', Object.keys(cust.exposedFunctions));
  } catch(e) {}
}
main().catch(console.error);
