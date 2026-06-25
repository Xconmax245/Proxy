import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl('testnet') });

async function main() {
  const cust = await client.getNormalizedMoveModule({
    package: '0xdee9',
    module: 'custodian_v2',
  });
  console.log("custodian_v2::new =", JSON.stringify(cust.exposedFunctions.new, null, 2));

  const clob = await client.getNormalizedMoveModule({
    package: '0xdee9',
    module: 'clob_v2',
  });
  console.log("clob_v2::create_account =", JSON.stringify(clob.exposedFunctions.create_account, null, 2));
}
main().catch(console.error);
