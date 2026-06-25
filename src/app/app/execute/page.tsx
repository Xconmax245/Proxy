"use client";

import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useProxyTransaction } from "@/hooks/useProxyTransaction";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Play,
  History,
  AlertTriangle,
  Wallet,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import {
  getOwnedDelegations,
  buildExecuteActionTx,
  getDelegationObject,
  getSuiScanUrl,
  suiToMist,
  mistToSui,
  suiClient,
  parseWalletError,
} from "@/lib/sui";
import { isContractDeployed, PROXY_PACKAGE_ID } from "@/lib/constants";
import { DelegationObject } from "@/lib/state";
import DeploymentGate from "@/components/shared/DeploymentGate";
import StatusBadge from "@/components/shared/StatusBadge";
import PrivPayLoader from "@/components/shared/PrivPayLoader";
import { AddressBadge } from "@/components/shared/AddressBadge";

const TYPE_NAMES = ["Financial", "Governance", "Operational", "Legal"] as const;

/** Map Move abort codes from error strings to human-readable messages */
function parseAbortMessage(err: any): string {
  const msg = parseWalletError(err);
  
  const match = msg.match(/MoveAbort\([^,]+,\s*(\d+)\)/) || msg.match(/abort_code:\s*(\d+)/);
  if (match) {
    const code = parseInt(match[1]);
    const MOVE_ABORT_MESSAGES: Record<number, string> = {
      0: 'Only the original delegator can perform this action',
      1: 'Connected wallet is not the authorized delegate',
      2: 'This delegation has been revoked',
      3: 'This delegation has expired',
      4: 'Amount exceeds the authorized scope limit',
      5: 'This delegation cannot be sub-delegated further',
      6: 'Sub-delegation scope cannot exceed parent scope',
      7: 'Sub-delegation expiry cannot exceed parent expiry',
      8: 'This delegation is already paused',
      9: 'This delegation is not paused',
      10: 'This delegation is currently paused',
    };
    if (code in MOVE_ABORT_MESSAGES) {
      return MOVE_ABORT_MESSAGES[code];
    }
  }
  
  if (msg.includes("E_NOT_DELEGATOR")) return 'Only the original delegator can perform this action';
  if (msg.includes("E_NOT_DELEGATE")) return 'Connected wallet is not the authorized delegate';
  if (msg.includes("E_DELEGATION_REVOKED")) return 'This delegation has been revoked';
  if (msg.includes("E_DELEGATION_PAUSED")) return 'This delegation is currently paused';
  if (msg.includes("E_DELEGATION_EXPIRED")) return 'This delegation has expired';
  if (msg.includes("E_SCOPE_LIMIT_EXCEEDED")) return 'Amount exceeds the authorized scope limit';
  if (msg.includes("E_NO_SUBDELEGATION_DEPTH")) return 'This delegation cannot be sub-delegated further';
  if (msg.includes("E_INVALID_SUBDELEGATION_SCOPE")) return 'Sub-delegation scope cannot exceed parent scope';
  if (msg.includes("E_INVALID_SUBDELEGATION_EXPIRY")) return 'Sub-delegation expiry cannot exceed parent expiry';

  return msg;
}

function parseDelegation(obj: any): DelegationObject | null {
  try {
    const data = obj?.data || obj;
    const content = data?.content;
    const type = data?.type || content?.type || "";
    if (!content || content.dataType !== "moveObject") return null;
    if (!type.includes("DelegationObject")) return null;
    const f = content.fields as Record<string, any>;
    if (!f) return null;
    return {
      id: data.objectId || obj.id || "",
      delegator: f.delegator,
      delegate: f.delegate,
      delegation_type: Number(f.delegation_type),
      scope_limit: Number(f.scope_limit ?? 0),
      spent: Number(f.spent ?? 0),
      expiry: Number(f.expiry ?? 0),
      status: Number(f.status ?? 0),
      depth_remaining: Number(f.depth_remaining ?? 0),
      evidence_hash: f.evidence_hash ?? "",
      created_at: Number(f.created_at ?? 0),
    };
  } catch {
    return null;
  }
}

interface ExecutionResult {
  digest: string;
  delegationId: string;
  amount: number;
}

import { useEffect } from "react";

export default function ExecuteActionPage() {
  const account = useCurrentAccount();

  useEffect(() => {
    if (!account) return;
    
    suiClient.getOwnedObjects({
      owner: account.address,
      options: { showContent: true, showType: true }
    }).then(result => {
      console.log('ALL OWNED OBJECTS:', result.data.length);
      result.data.forEach(obj => {
        console.log(obj.data?.type, obj.data?.objectId);
      });
    });
  }, [account]);

  if (!isContractDeployed()) return <DeploymentGate />;
  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Wallet size={32} className="text-white/20" />
        <p className="text-white/50 text-sm">Connect your Sui wallet to execute delegated actions.</p>
      </div>
    );
  }

  return <ExecutePageInner address={account.address} />;
}

function ExecutePageInner({ address }: { address: string }) {
  const qc = useQueryClient();
  const { execute } = useProxyTransaction();
  const [selected, setSelected] = useState<DelegationObject | null>(null);
  const [amount, setAmount] = useState("50");
  const [executing, setExecuting] = useState(false);
  const [execError, setExecError] = useState("");
  const [history, setHistory] = useState<ExecutionResult[]>([]);

  // Fetch delegations where I am the delegate
  const { data: rawObjects, isLoading } = useQuery({
    queryKey: ["incoming-delegations", address, PROXY_PACKAGE_ID],
    queryFn: async () => {
      if (!PROXY_PACKAGE_ID) return [];
      
      let allObjects: any[] = [];
      let cursor = null;
      let hasNextPage = true;
      
      // Fetch all owned objects to bypass exact package ID matching
      while (hasNextPage) {
        const res: any = await suiClient.getOwnedObjects({
          owner: address,
          cursor,
          options: { showContent: true, showType: true },
        });
        allObjects = allObjects.concat(res.data);
        cursor = res.nextCursor;
        hasNextPage = res.hasNextPage;
      }
      
      return allObjects;
    },
    enabled: !!address,
  });

  const delegations = (rawObjects ?? [])
    .map(parseDelegation)
    .filter(Boolean) as DelegationObject[];

  const handleExecute = async () => {
    if (!selected) return;
    setExecuting(true);
    setExecError("");

    try {
      const tx = buildExecuteActionTx(selected.id, Number(amount));
      const data = await execute(tx);
      const digest = (data as any).digest ?? "";
      setHistory((h) => [{ digest, delegationId: selected.id, amount: Number(amount) }, ...h]);
      setSelected(null);

      // Refetch the delegation object to get the updated `spent` field
      await qc.invalidateQueries({ queryKey: ["incoming-delegations"] });
    } catch (err) {
      setExecError(parseAbortMessage(err));
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div data-aos="fade-up" data-aos-duration="400">
        <p className="font-mono text-[10px] tracking-[0.18em] mb-2 text-accent/60 uppercase">
          Interact
        </p>
        <h1 className="font-heading text-2xl font-bold text-white tracking-tight mb-1">
          Execute Delegated Actions
        </h1>
        <p className="text-white/40 text-sm">
          Select an incoming authority delegation and execute an action.
        </p>
      </div>

      {/* Delegation cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono font-bold text-white/40 uppercase tracking-wider">
          Available Incoming Delegations
        </h3>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2 lg:col-span-3 py-16 flex items-center justify-center">
              <PrivPayLoader size="lg" />
            </div>
          </div>
        ) : delegations.length === 0 ? (
          <div data-aos="fade-in" className="text-center py-16 bg-[#0a1628]/40 border border-dashed border-white/5 rounded-2xl">
            <AlertTriangle size={28} className="text-white/20 mx-auto mb-3" />
            <p className="text-xs font-semibold text-white/40">No incoming delegations found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {delegations.map((d, i) => {
              const isActive = d.status === 0 && (d.expiry === 0 || d.expiry > Date.now());
              const isSelected = selected?.id === d.id;
              return (
                <div
                  key={d.id}
                  data-aos="fade-up"
                  data-aos-delay={i * 70}
                  data-aos-duration="500"
                  className={`bg-[#0a1628] rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group ${
                    isSelected
                      ? "border border-accent/60 shadow-[0_0_24px_rgba(200,255,0,0.12)] scale-[1.02]"
                      : "border border-white/[0.06] hover:border-white/[0.14] shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
                  }`}
                >
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 shadow-[0_0_8px_rgba(200,255,0,0.1)]">
                        {TYPE_NAMES[d.delegation_type]}
                      </span>
                      <StatusBadge status={d.status} />
                    </div>
                    <div className="text-[11px] font-mono space-y-1.5 text-white/60 pt-2 border-t border-white/[0.06]">
                      <div className="flex justify-between">
                        <span className="text-white/40">From</span>
                        <AddressBadge address={d.delegator} />
                      </div>
                      {d.delegation_type === 0 && (
                        <div className="flex justify-between">
                          <span className="text-white/40">Budget</span>
                          <span className="text-white font-bold">{mistToSui(BigInt(d.spent)).toFixed(0)} / {mistToSui(BigInt(d.scope_limit)).toFixed(0)} SUI</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-white/40">Expires</span>
                        <span className="text-white">{d.expiry === 0 ? "Never" : new Date(d.expiry).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { setSelected(isSelected ? null : d); setExecError(""); }}
                    disabled={!isActive}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected
                        ? "bg-accent text-black shadow-[0_0_12px_rgba(200,255,0,0.2)]"
                        : "bg-accent/10 text-accent border border-accent/20 hover:bg-accent hover:text-black"
                    }`}
                  >
                    {isSelected ? "Selected" : isActive ? "Select" : `Blocked (${d.status === 1 ? "Revoked" : "Expired"})`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Execution panel */}
      {selected && (
        <div data-aos="fade-up" data-aos-duration="400" className="bg-[#0a1628] border border-accent/30 rounded-2xl p-6 space-y-5 shadow-[0_0_40px_rgba(200,255,0,0.06)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-accent/40" />
          <h3 className="text-sm font-bold text-white">Execute Action</h3>

          {selected.delegation_type === 0 && (
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-white/40 uppercase tracking-wider block">
                Amount (SUI)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full max-w-xs bg-[#050c18] border border-white/10 focus:border-accent rounded-xl px-4 py-3 text-xs font-mono text-white outline-none transition-all"
              />
              <p className="text-[10px] text-white/30 font-mono">
                Remaining budget: {(mistToSui(BigInt(selected.scope_limit)) - mistToSui(BigInt(selected.spent))).toFixed(2)} SUI
              </p>
            </div>
          )}

          {execError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400 font-mono flex items-center gap-2">
              <AlertTriangle size={12} />
              {execError}
            </div>
          )}

          <button
            onClick={handleExecute}
            disabled={executing}
            className="bg-accent hover:bg-accent/90 disabled:opacity-50 text-black font-bold text-xs px-6 py-3 rounded-xl transition-all flex items-center gap-2"
          >
            {executing ? (
              <><PrivPayLoader size="xs" mode="compact" /> Awaiting Signature…</>
            ) : (
              <><Play size={11} className="fill-black" /> Execute Action</>
            )}
          </button>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div data-aos="fade-up" data-aos-duration="500" className="bg-[#0a1628]/60 border border-white/[0.06] rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.3)] backdrop-blur-sm">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
            <History size={14} className="text-accent" />
            <h3 className="text-sm font-bold text-white">Execution History</h3>
          </div>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.06] text-white/40 bg-black/30">
                <th className="px-6 py-3 text-left">Delegation</th>
                <th className="px-6 py-3 text-left">Amount</th>
                <th className="px-6 py-3 text-left">Tx Digest</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.04] text-white/70 transition-colors">
                  <td className="px-6 py-3">{h.delegationId.slice(0, 10)}…</td>
                  <td className="px-6 py-3 text-accent font-bold">{h.amount} SUI</td>
                  <td className="px-6 py-3">
                    <a
                      href={getSuiScanUrl(h.digest, "tx")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline flex items-center gap-1"
                    >
                      {h.digest.slice(0, 12)}… <ExternalLink size={10} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
