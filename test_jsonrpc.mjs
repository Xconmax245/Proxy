import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
async function test() {
  const client = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl("testnet") });
  const ep = await client.getLatestSuiSystemState();
  console.log(ep);
}
test().catch(console.error);
