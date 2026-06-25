import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import {
  PROXY_PACKAGE_ID as PACKAGE_ID,
  PROXY_PACKAGE_ID,
  SUI_CLOCK_OBJECT_ID,
} from "./constants";
import { DelegationObject } from "./state";

export const suiClient = new SuiJsonRpcClient({
  url: process.env.NEXT_PUBLIC_SUI_RPC_URL || "https://fullnode.testnet.sui.io:443",
  network: "testnet",
});


// ---------------------------------------------------------------------------
// Transaction Builders
// ---------------------------------------------------------------------------

export function buildCreateDelegationTx(params: {
  delegate: string;
  delegationType: number;
  scopeLimit: number;
  expiry: bigint;
  depth: number;
  evidenceHash: string;
}): Transaction {
  if (!PACKAGE_ID) throw new Error("NEXT_PUBLIC_PROXY_PACKAGE_ID is not set");
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::delegation::create_delegation`,
    arguments: [
      tx.pure.address(params.delegate),
      tx.pure.u8(params.delegationType),
      tx.pure.u64(suiToMist(params.scopeLimit)),
      tx.pure.u64(params.expiry),
      tx.pure.u8(params.depth),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(params.evidenceHash))),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });
  return tx;
}

export function buildExecuteActionTx(
  delegationId: string,
  amount: number
): Transaction {
  if (!PACKAGE_ID) throw new Error("NEXT_PUBLIC_PROXY_PACKAGE_ID is not set");
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::delegation::execute_action`,
    arguments: [
      tx.object(delegationId),
      tx.pure.u64(suiToMist(amount)),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });
  return tx;
}

export function buildRevokeTx(delegationId: string): Transaction {
  if (!PACKAGE_ID) throw new Error("NEXT_PUBLIC_PROXY_PACKAGE_ID is not set");
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::delegation::revoke`,
    arguments: [tx.object(delegationId)],
  });
  return tx;
}

export function buildPauseTx(delegationId: string): Transaction {
  if (!PACKAGE_ID) throw new Error("NEXT_PUBLIC_PROXY_PACKAGE_ID is not set");
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::delegation::pause`,
    arguments: [tx.object(delegationId)]
  });
  return tx;
}

export function buildUnpauseTx(delegationId: string): Transaction {
  if (!PACKAGE_ID) throw new Error("NEXT_PUBLIC_PROXY_PACKAGE_ID is not set");
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::delegation::unpause`,
    arguments: [tx.object(delegationId)]
  });
  return tx;
}

export const DEEPBOOK_PACKAGE_ID = '0x000000000000000000000000000000000000000000000000000000000000dee9';
export const DEEPBOOK_POOL_SUI_USDC = '0x4405b50d791fd3346754e8171aaab6bc2ed26c2c46efdd033c14b30ae507ac33';

export async function getDeepBookABI() {
  const pkg = await suiClient.getNormalizedMoveModule({
    package: '0x000000000000000000000000000000000000000000000000000000000000dee9',
    module: 'clob_v2'
  })
  const fn = pkg.exposedFunctions['swap_exact_base_for_quote']
  console.log('DeepBook swap function:', JSON.stringify(fn, null, 2))
}

export function buildCreateAccountCapTx(address: string): Transaction {
  const tx = new Transaction();
  const [cap] = tx.moveCall({
    target: `${DEEPBOOK_PACKAGE_ID}::clob_v2::create_account`,
    arguments: [],
  });
  tx.transferObjects([cap], tx.pure.address(address));
  return tx;
}

export function buildDeepBookSwapTx(params: {
  delegationId: string;
  amount: bigint;
  poolId: string;
  accountCapId: string;
}): Transaction {
  if (!PACKAGE_ID) throw new Error("NEXT_PUBLIC_PROXY_PACKAGE_ID is not set");
  const tx = new Transaction();

  // Step 1: Validate authorization via Proxy
  tx.moveCall({
    target: `${PACKAGE_ID}::delegation::execute_defi_action`,
    arguments: [
      tx.object(params.delegationId),
      tx.pure.u64(params.amount),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ]
  });

  // Step 2: Split SUI coin for base asset
  const [baseCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(params.amount)]);

  // Step 3: Create empty USDC coin for quote slot
  const [quoteCoin] = tx.moveCall({
    target: '0x2::coin::zero',
    typeArguments: [
      '0x5d4b302506645c37ff133b98c4b50a4ae4614bb0ef63fc9cfe44cc2b19b663a8::coin::COIN'
    ],
    arguments: []
  });

  // Step 4: DeepBook swap with correct argument order
  tx.moveCall({
    target: `${DEEPBOOK_PACKAGE_ID}::clob_v2::swap_exact_base_for_quote`,
    typeArguments: [
      '0x2::sui::SUI',
      '0x5d4b302506645c37ff133b98c4b50a4ae4614bb0ef63fc9cfe44cc2b19b663a8::coin::COIN'
    ],
    arguments: [
      tx.object(params.poolId),           // 1. Pool (mutable reference)
      tx.pure.u64(params.amount),          // 2. quantity (amount to swap)
      tx.object(params.accountCapId),      // 3. AccountCap (reference)
      tx.pure.u64(0),                      // 4. client_order_id
      baseCoin,                            // 5. Coin<SUI>
      quoteCoin,                           // 6. Coin<USDC> (zero value)
      tx.object(SUI_CLOCK_OBJECT_ID),      // 7. Clock
    ]
  });

  return tx;
}

export function buildSubDelegateTx(params: {
  delegationId: string;
  newDelegate: string;
  scopeLimit: number;
  expiry: bigint;
}): Transaction {
  if (!PACKAGE_ID) throw new Error("NEXT_PUBLIC_PROXY_PACKAGE_ID is not set");
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::delegation::sub_delegate`,
    arguments: [
      tx.object(params.delegationId),
      tx.pure.address(params.newDelegate),
      tx.pure.u64(suiToMist(params.scopeLimit)),
      tx.pure.u64(params.expiry),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });
  return tx;
}

// ---------------------------------------------------------------------------
// Read-Only Queries
// ---------------------------------------------------------------------------

export async function queryIsAuthorized(
  delegationId: string,
  amount: bigint,
  callerAddress: string
): Promise<{ authorized: boolean; reason: string }> {
  try {
    if (!PACKAGE_ID) throw new Error("NEXT_PUBLIC_PROXY_PACKAGE_ID is not set");

    const objectData = await suiClient.getObject({
      id: delegationId,
    });
    if (!objectData.data) {
      throw new Error(`Delegation object ${delegationId} not found on chain.`);
    }
    const { digest, version } = objectData.data;

    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::delegation::is_authorized`,
      arguments: [
        tx.object(delegationId),
        tx.pure.u64(amount),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ]
    });

    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: callerAddress,
    });

    if (result.error) {
      return { authorized: false, reason: parseDevInspectError(result.error) };
    }

    const returnVal = result.results?.[0]?.returnValues?.[0];
    if (!returnVal) {
      return { authorized: false, reason: 'No return value from contract' };
    }

    // Return value is a BCS-encoded bool — first byte is 1 for true, 0 for false
    const authorized = returnVal[0][0] === 1;
    return { 
      authorized, 
      reason: authorized ? 'All conditions passed' : 'One or more conditions failed'
    };
  } catch (err: any) {
    return { authorized: false, reason: err.message ?? 'Unknown error' };
  }
}

function parseDevInspectError(error: string): string {
  if (error.includes('E_DELEGATION_REVOKED') || error.includes('2)')) return 'Delegation has been revoked';
  if (error.includes('E_DELEGATION_EXPIRED') || error.includes('3)')) return 'Delegation has expired';
  if (error.includes('E_SCOPE_LIMIT_EXCEEDED') || error.includes('4)')) return 'Amount exceeds scope limit';
  if (error.includes('E_NOT_DELEGATE') || error.includes('1)')) return 'Caller is not the authorized delegate';
  if (error.includes('TypeMismatch')) return 'Invalid object type provided (Not a DelegationObject)';
  return error;
}

export async function getDelegationObject(objectId: string) {
  return suiClient.getObject({
    id: objectId,
    options: { showContent: true, showOwner: true, showType: true },
  });
}

export async function getRecentDelegations(limit: number = 20): Promise<DelegationObject[]> {
  if (!PROXY_PACKAGE_ID) return [];
  try {
    const [createTxs, subTxs] = await Promise.all([
      suiClient.queryTransactionBlocks({
        filter: { MoveFunction: { package: PROXY_PACKAGE_ID, module: "delegation", function: "create_delegation" } },
        options: { showEffects: true },
        limit,
        order: "descending",
      }),
      suiClient.queryTransactionBlocks({
        filter: { MoveFunction: { package: PROXY_PACKAGE_ID, module: "delegation", function: "sub_delegate" } },
        options: { showEffects: true },
        limit,
        order: "descending",
      })
    ]);

    const allTxs = [...createTxs.data, ...subTxs.data].sort(
      (a, b) => Number(b.timestampMs || 0) - Number(a.timestampMs || 0)
    ).slice(0, limit);

    const objectIds = allTxs.flatMap(tx => 
      tx.effects?.created?.map(c => c.reference.objectId) || []
    );

    if (objectIds.length === 0) return [];

    const objects = await suiClient.multiGetObjects({
      ids: objectIds,
      options: { showContent: true }
    });

    return objects
      .map(result => {
        const fields = (result as any)?.data?.content?.fields;
        if (!fields) return null;
        return {
          id: (result as any)?.data?.objectId,
          delegator: fields.delegator,
          delegate: fields.delegate,
          delegation_type: Number(fields.delegation_type),
          scope_limit: Number(fields.scope_limit ?? 0),
          spent: Number(fields.spent ?? 0),
          expiry: Number(fields.expiry ?? 0),
          status: Number(fields.status ?? 0),
          depth_remaining: Number(fields.depth_remaining ?? 0),
          evidence_hash: fields.evidence_hash,
          created_at: 0,
        } as DelegationObject;
      })
      .filter(Boolean) as DelegationObject[];
  } catch (err) {
    console.error("Failed to fetch recent delegations:", err);
    return [];
  }
}

export async function getOwnedDelegations(walletAddress: string) {
  if (!PACKAGE_ID) return [];
  try {
    const result = await suiClient.getOwnedObjects({
      owner: walletAddress,
      filter: {
        StructType: `${PACKAGE_ID}::delegation::DelegationObject`,
      },
      options: { showContent: true },
    });
    return result.data;
  } catch (err) {
    console.error("Failed to fetch owned delegations:", err);
    return [];
  }
}


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getSuiScanUrl(
  objectIdOrDigest: string,
  type: "object" | "tx" = "object"
): string {
  const base = "https://suiscan.xyz/testnet";
  return type === "tx"
    ? `${base}/tx/${objectIdOrDigest}`
    : `${base}/object/${objectIdOrDigest}`;
}

export function suiToMist(sui: number): bigint {
  return BigInt(Math.round(sui * 1_000_000_000));
}

export function mistToSui(mist: bigint): number {
  return Number(mist) / 1_000_000_000;
}

export async function getCurrentEpoch(): Promise<string> {
  const state = await suiClient.getLatestSuiSystemState();
  return String(state.epoch);
}

export function parseWalletError(err: any): string {
  if (!err) return "Transaction failed (unknown error)";
  
  // Extract message or stringify the object
  const msg = err.message || (typeof err === "string" ? err : JSON.stringify(err));
  
  if (
    msg === "{}" ||
    msg.toLowerCase().includes("reject") ||
    msg.toLowerCase().includes("cancel") ||
    msg.toLowerCase().includes("disapproved")
  ) {
    return "Transaction cancelled or rejected by user.";
  }
  
  return msg;
}


