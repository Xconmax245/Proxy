"use client";

import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

export function useProxyTransaction() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const execute = async (tx: Transaction) => {
    const result = await signAndExecute({ transaction: tx });

    // useSignAndExecuteTransaction returns { digest, bytes, signature, effects, rawEffects }
    // Mirror the shape callers expect (they read result.digest)
    return result;
  };

  return { execute };
}
