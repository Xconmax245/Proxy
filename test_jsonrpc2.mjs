import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

const address = "0x42105fe1cc151d91a0d278e115649abbe68ba2ea81cb2593eb23b2cd8bd751d5"; // Delegate

async function test() {
  const suiClient = new SuiJsonRpcClient({ url: "https://fullnode.testnet.sui.io:443" });
  
  let hasNextPage = true;
  let cursor = null;
  const allObjects = [];

  while (hasNextPage) {
    const res = await suiClient.getOwnedObjects({
      owner: address,
      options: { showType: true, showContent: true },
      cursor,
    });
    allObjects.push(...res.data);
    hasNextPage = res.hasNextPage;
    cursor = res.nextCursor;
  }

  const phantom = allObjects.find(o => o.data?.objectId?.includes("0x1b69"));
  if (phantom) {
    console.log("FOUND PHANTOM:", JSON.stringify(phantom, null, 2));
  } else {
    console.log(`Not found in ${address}'s ${allObjects.length} objects.`);
  }
}

test().catch(console.error);
