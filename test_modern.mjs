import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
console.log("Client type:", typeof SuiClient);

async function test() {
  const client = new SuiClient({ url: getFullnodeUrl('testnet') });
  const epoch = await client.getLatestSuiSystemState();
  console.log("Epoch:", epoch.epoch);
}
test().catch(console.error);
