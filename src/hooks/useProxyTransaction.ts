"use client";

import { useCurrentAccount, useSuiClient, useWallets } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

export function useProxyTransaction() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const wallets = useWallets();

  const execute = async (tx: Transaction) => {
    if (!currentAccount) throw new Error("No wallet connected");

    const wallet = wallets.find(w => 
      w.accounts.some(a => a.address === currentAccount.address)
    );
    if (!wallet) throw new Error("Wallet not found");

    // Log available features for debugging
    console.log("Connected wallet:", wallet.name);
    console.log("Available features:", Object.keys(wallet.features));

    const signFeature = wallet.features["sui:signTransaction"] as any;
    if (!signFeature) {
      throw new Error(
        `Wallet "${wallet.name}" does not support sui:signTransaction. ` +
        `Available: ${Object.keys(wallet.features).join(", ")}`
      );
    }

    tx.setSender(currentAccount.address);
    const builtBytes = await tx.build({ client: suiClient });

    const { signature } = await signFeature.signTransaction({
      transaction: Transaction.from(builtBytes),
      account: currentAccount,
      chain: "sui:testnet",
    });

    const result = await suiClient.executeTransactionBlock({
      transactionBlock: builtBytes,
      signature,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    if (result.effects?.status?.status === "failure") {
      throw new Error(result.effects.status.error ?? "Transaction failed");
    }

    return result;
  };

  return { execute };
}
