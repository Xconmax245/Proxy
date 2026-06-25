import('@mysten/sui/jsonRpc').then(async (sui) => {
  const { SuiJsonRpcClient } = sui;
  const { Transaction } = await import('@mysten/sui/transactions');
  const client = new SuiJsonRpcClient({ url: 'https://fullnode.testnet.sui.io:443' });
  const PACKAGE_ID = '0xc447eafc845d68cd9f9c46ea59dba02bc4248285c49d4a05b2287019d8b3cc07';
  const SUI_CLOCK_OBJECT_ID = '0x0000000000000000000000000000000000000000000000000000000000000006';
  const delegationId = '0x8c702bae5614e1b564048c2bbe652859a85f991aab722a487fc8554d08903b6e';
  const callerAddress = '0x3c4489c938b8243be4b7f8c057e9fcbaab1d7e35b7193bc141b777f9cd9f7b4e';
  
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::delegation::is_authorized`,
    arguments: [
      tx.object(delegationId),
      tx.pure.u64(200000000),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ]
  });

  try {
    const result = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: callerAddress,
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  }
}).catch(console.error);
