"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Download, Ban, ArrowRight, Calendar, X, AlertTriangle, ShieldCheck, Link2, PauseCircle, PlayCircle, CheckCircle, Share2, Copy, Check } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import PrivPayLoader from "@/components/shared/PrivPayLoader";
import { useProxyTransaction } from "@/hooks/useProxyTransaction";
import { DelegationObject } from "@/lib/state";
import { buildRevokeTx, buildPauseTx, buildUnpauseTx, suiClient, getSuiScanUrl, parseWalletError } from "@/lib/sui";
import StatusBadge from "@/components/shared/StatusBadge";
import { AddressBadge } from "@/components/shared/AddressBadge";
import { useSuiNSName } from "@/hooks/useSuiNS";
import BlobLink from "@/components/shared/BlobLink";
import ExplorerLink from "@/components/shared/ExplorerLink";
import ScopeBar from "@/components/app/ScopeBar";
import { mistToSui } from "@/lib/sui";
import { generateCertificate } from "@/lib/certificate";

interface DelegationCardProps {
  delegation: DelegationObject;
  onRefetch?: () => void;
  isPreview?: boolean;
  onShare?: () => void;
}

export default function DelegationCard({ delegation, onRefetch, isPreview = false, onShare }: DelegationCardProps) {
  const { execute } = useProxyTransaction();
  const account = useCurrentAccount();
  const { data: delegatorName } = useSuiNSName(delegation.delegator);
  const { data: delegateName } = useSuiNSName(delegation.delegate);
  const [downloading, setDownloading] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [unpausing, setUnpausing] = useState(false);
  const [revokeError, setRevokeError] = useState("");
  const [actionError, setActionError] = useState("");
  const [copied, setCopied] = useState(false);

  // Modal and hold-to-confirm state
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [holdIntervalId, setHoldIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  // Activity Log state
  const [showActivity, setShowActivity] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (holdIntervalId) clearInterval(holdIntervalId);
    };
  }, [holdIntervalId]);

  const startHold = () => {
    if (revoking) return;
    setHoldProgress(0);
    const interval = setInterval(() => {
      setHoldProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setHoldIntervalId(null);
          triggerRevoke();
          return 100;
        }
        return prev + 100 / 30; // 30 steps of 50ms = 1500ms
      });
    }, 50);
    setHoldIntervalId(interval);
  };

  const endHold = () => {
    if (holdIntervalId) {
      clearInterval(holdIntervalId);
      setHoldIntervalId(null);
    }
    setHoldProgress(0);
  };

  const triggerRevoke = async () => {
    setShowRevokeModal(false);
    setRevoking(true);
    setActionError("");
    try {
      const tx = buildRevokeTx(delegation.id);
      await execute(tx);
      onRefetch?.();
    } catch (err) {
      setActionError(parseWalletError(err));
    } finally {
      setRevoking(false);
    }
  };

  const handlePause = async () => {
    setPausing(true);
    setActionError("");
    try {
      const tx = buildPauseTx(delegation.id);
      await execute(tx);
      onRefetch?.();
    } catch (err) {
      setActionError(parseWalletError(err));
    } finally {
      setPausing(false);
    }
  };

  const handleUnpause = async () => {
    setUnpausing(true);
    setActionError("");
    try {
      const tx = buildUnpauseTx(delegation.id);
      await execute(tx);
      onRefetch?.();
    } catch (err) {
      setActionError(parseWalletError(err));
    } finally {
      setUnpausing(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const delegatorDisp = delegatorName || `${delegation.delegator.slice(0, 6)}...${delegation.delegator.slice(-4)}`;
      const delegateDisp = delegateName || `${delegation.delegate.slice(0, 6)}...${delegation.delegate.slice(-4)}`;
      const dataUrl = await generateCertificate(delegation, delegatorDisp, delegateDisp);
      const link = document.createElement("a");
      link.download = `delegation-cert-${delegation.id.slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Certificate generation error:", err);
    } finally {
      setDownloading(false);
    }
  };

  const fetchActivity = async () => {
    if (activityLogs.length > 0) return;
    setLoadingActivity(true);
    try {
      const txs = await suiClient.queryTransactionBlocks({
        filter: {
          InputObject: delegation.id,
        },
        options: {
          showEffects: true,
          showInput: true,
        },
        limit: 3,
        order: "descending",
      });

      const parsedLogs = txs.data.map((tx: any) => {
        const transaction = tx.transaction?.data?.transaction;
        let actionLabel = "TRANSACTION EXECUTED";
        let epochVal = tx.effects?.executedEpoch ? `EPOCH ${tx.effects.executedEpoch}` : "";
        let detail = "";

        if (transaction && transaction.kind === "ProgrammableTransaction") {
          const commands = transaction.commands || [];
          const moveCall = commands.find((c: any) => c.MoveCall);
          if (moveCall) {
            const func = moveCall.MoveCall.function;
            if (func === "create_delegation") {
              actionLabel = "MINTED";
            } else if (func === "revoke_delegation") {
              actionLabel = "REVOKED";
            } else if (func === "execute_action") {
              actionLabel = "EXECUTED";
            }
          }
        }

        const timeMs = Number(tx.timestampMs ?? 0);
        const timeStr = timeMs > 0 ? new Date(timeMs).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) : "Recently";

        return {
          digest: tx.digest,
          actionLabel,
          epoch: epochVal,
          detail,
          timestamp: timeStr,
        };
      });

      setActivityLogs(parsedLogs);
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
    } finally {
      setLoadingActivity(false);
    }
  };

  const toggleActivity = () => {
    const nextState = !showActivity;
    setShowActivity(nextState);
    if (nextState) {
      fetchActivity();
    }
  };

  const TYPE_NAMES = ["Financial", "Governance", "Operational", "Legal"];
  const TYPE_COLORS = [
    "bg-accent/10 text-accent border-accent/20",
    "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "bg-white/5 text-white/70 border-white/10",
    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  ];

  const isExpired = delegation.status === 2 || (delegation.expiry > 0 && delegation.expiry < Date.now());
  const isActive = delegation.status === 0 && !isExpired;
  const isPaused = delegation.status === 3;

  const formatDate = (ms: number) =>
    ms === 0
      ? "Never"
      : new Date(ms).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  // Dynamic health score logic
  const calculateHealthScore = () => {
    if (delegation.status === 1 || isExpired) return 0;
    if (delegation.status === 3) return 0; // Paused means 0 health functionally

    const timeScore = delegation.expiry === 0
      ? 100
      : Math.max(0, Math.min(100, ((delegation.expiry - Date.now()) / (30 * 86400 * 1000)) * 100));

    const budgetScore = delegation.delegation_type === 0 && delegation.scope_limit > 0
      ? Math.max(0, Math.min(100, (1 - delegation.spent / delegation.scope_limit) * 100))
      : 100;

    const depthScore = delegation.depth_remaining === 0
      ? 50
      : delegation.depth_remaining === 1
      ? 75
      : 100;

    const score = delegation.delegation_type === 0
      ? (timeScore * 0.4) + (budgetScore * 0.4) + (depthScore * 0.2)
      : (timeScore * 0.7) + (depthScore * 0.3);

    return Math.round(score);
  };

  const healthScore = calculateHealthScore();
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  const healthColor =
    healthScore >= 80
      ? "text-[#22c55e]"
      : healthScore >= 50
      ? "text-[#f59e0b]"
      : "text-[#ef4444]";

  const getExpiryText = (ms: number) => {
    if (ms === 0) return "Never";
    const date = new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const days = Math.ceil((ms - Date.now()) / 86400000);
    if (days < 0) return `${date} · Expired`;
    return `${date} · ${days} days`;
  };

  useEffect(() => {
    if (!isPreview) {
      fetchActivity();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreview, delegation.id]);

  const statusColor = isPreview ? "text-amber-500" : isExpired || delegation.status === 1 || delegation.status === 2 ? "text-red-500" : isPaused ? "text-[#f59e0b]" : "text-[#22c55e]";
  const statusBg = isPreview ? "bg-amber-500" : isExpired || delegation.status === 1 || delegation.status === 2 ? "bg-red-500" : isPaused ? "bg-[#f59e0b]" : "bg-[#22c55e]";
  const statusText = isPreview ? "PREVIEW" : isExpired ? "EXPIRED" : delegation.status === 1 ? "REVOKED" : isPaused ? "PAUSED" : "ACTIVE";

  return (
    <div className="bg-[#0a1628] border border-white/[0.06] rounded-2xl flex flex-col justify-between hover:border-white/[0.14] transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.3)] group relative overflow-hidden">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Zone 1 - Header Row */}
      <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/[0.06]">
        {/* Left: Status Badge */}
        {isPreview ? (
          <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-500 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            PREVIEW
          </span>
        ) : (
          <StatusBadge status={delegation.status} />
        )}

        {/* Center: Type + Depth (Muted text) */}
        <div className="flex-1 text-center flex flex-col items-center gap-0.5">
          <div className="text-[10px] font-mono text-white/50 px-2 truncate">
            {TYPE_NAMES[delegation.delegation_type] ?? "Custom"} · Depth {delegation.depth_remaining}
          </div>
          {!isPreview && delegation.id && (
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigator.clipboard.writeText(delegation.id);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="text-[9px] font-mono text-white/30 hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 flex items-center gap-1"
              title="Copy Object ID"
            >
              {delegation.id.slice(0, 6)}...{delegation.id.slice(-4)}
              {copied ? <Check size={9} className="text-[#10b981]" /> : <Copy size={9} />}
            </button>
          )}
        </div>

        {/* Right: Health Ring + Explorer Icon */}
        <div className="flex items-center gap-3">
          <div className="relative w-7 h-7 flex items-center justify-center" title="Delegation Health Score">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r={radius} className="stroke-white/5 fill-none" strokeWidth="2.5" />
              <circle
                cx="16" cy="16" r={radius}
                className={`fill-none transition-all duration-500 ${healthColor}`}
                strokeWidth="2.5" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                strokeLinecap="round" stroke="currentColor"
              />
            </svg>
            <span className="absolute text-[7px] font-mono font-bold text-white/90">
              {healthScore}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            {!isPreview && (
              <ExplorerLink id={delegation.id} className="!p-1 !bg-transparent !border-none text-white/40 hover:text-white" label="⊙" />
            )}
            {onShare && !isPreview && (
              <button onClick={onShare} className="p-1 text-white/40 hover:text-white transition-colors bg-transparent border-none cursor-pointer" title="Share Receipt">
                {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Share2 size={14} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Zone 2 - Identity Strip */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-1">
        <AddressBadge address={delegation.delegator} className="!bg-transparent !p-0 !border-none text-[13px]" context="card" />
        <ArrowRight size={12} className="text-white/20 flex-shrink-0" />
        {delegation.delegate ? (
          <AddressBadge address={delegation.delegate} className="!bg-transparent !p-0 !border-none text-[13px]" context="card" />
        ) : (
          <span className="text-[13px] text-white/30 font-mono italic">—</span>
        )}
      </div>

      {/* Zone 3 - Terms Row */}
      <div className="flex items-end justify-between px-5 pb-5 pt-2 gap-4">
        {/* Left: Scope */}
        <div className="w-[60%] flex-shrink-0">
          {delegation.delegation_type === 0 ? (
            isPreview && delegation.scope_limit === 0 ? (
              <div className="text-[12px] text-white/40 font-mono italic">Scope: —</div>
            ) : (
              <ScopeBar spent={mistToSui(BigInt(delegation.spent))} limit={mistToSui(BigInt(delegation.scope_limit))} className="!space-y-1.5" />
            )
          ) : (
            <div className="text-[12px] text-white/80 font-mono font-semibold">Unlimited Execution</div>
          )}
        </div>
        
        {/* Right: Expiry */}
        <div className="w-[40%] flex flex-col items-end text-right">
          <div className="text-[10px] text-white/40 font-mono font-bold uppercase tracking-wider mb-1">
            Expires
          </div>
          <div className="text-[13px] text-white font-mono leading-tight">
            {isPreview && delegation.expiry === 0 ? "—" : getExpiryText(delegation.expiry)}
          </div>
        </div>
      </div>

      {/* Action error */}
      {actionError && (
        <p className="text-[10px] text-red-400 font-mono px-5 pb-2 break-all">{actionError}</p>
      )}

      {/* Zone 4 - Proof & Actions */}
      <div className="border-t border-white/[0.06]">
        {/* Evidence Link */}
        <div className="px-5 py-3 flex items-center gap-2 text-[11px] font-mono border-b border-white/[0.06] bg-[#050c18]/50">
          <span className="text-white/40">Evidence:</span>
          {isPreview && !delegation.evidence_hash ? (
            <span className="text-amber-500/50 italic">awaiting upload</span>
          ) : (
            <BlobLink blobId={delegation.evidence_hash} className="!bg-transparent !p-0 !border-none text-[#a855f7] hover:text-[#c084fc] flex items-center gap-1.5" />
          )}
        </div>

        {/* Action Buttons */}
        {!isPreview && (
          <div className="px-5 py-4 flex gap-3 border-b border-white/[0.06]">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-white/10 hover:bg-white/5 text-white rounded-xl text-[11px] font-bold transition-all disabled:opacity-50 bg-transparent"
            >
              {downloading ? <PrivPayLoader size="xs" mode="compact" /> : <Download size={12} />}
              Certificate
            </button>

            {(isActive || isPaused) && account?.address === delegation.delegator && (
              isPaused ? (
                <button
                  onClick={handleUnpause}
                  disabled={unpausing || revoking}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-[#10b981]/30 text-[#10b981] hover:bg-[#10b981]/10 rounded-xl text-[11px] font-bold transition-all disabled:opacity-50 bg-transparent"
                >
                  {unpausing ? <PrivPayLoader size="xs" mode="compact" /> : <PlayCircle size={12} />}
                  Resume
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  disabled={pausing || revoking}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b]/10 rounded-xl text-[11px] font-bold transition-all disabled:opacity-50 bg-transparent"
                >
                  {pausing ? <PrivPayLoader size="xs" mode="compact" /> : <PauseCircle size={12} />}
                  Pause
                </button>
              )
            )}

            {(isActive || isPaused) && (
              <button
                onClick={() => setShowRevokeModal(true)}
                disabled={revoking || pausing || unpausing}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-[11px] font-bold transition-all disabled:opacity-50 bg-transparent"
              >
                {revoking ? <PrivPayLoader size="xs" mode="compact" /> : <Ban size={12} />}
                Revoke
              </button>
            )}
          </div>
        )}

        {/* Activity Log */}
        <div className="px-5 py-3 bg-black/20">
          <button
            type="button"
            onClick={toggleActivity}
            className="w-full flex items-center justify-between text-[10px] font-mono text-white/40 hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 outline-none"
          >
            <span>Activity Log ({activityLogs.length} events)</span>
            <span className={`transition-transform duration-150 ${showActivity ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>
          
          {showActivity && (
            <div className="mt-3 animate-slide-down">
              {loadingActivity ? (
                <div className="flex items-center justify-center py-4">
                  <PrivPayLoader size="xs" mode="compact" />
                </div>
              ) : activityLogs.length === 0 ? (
                <p className="text-[10px] text-white/30 text-center py-2 font-mono">No recent activity found</p>
              ) : (
                <div className="relative pl-3 border-l border-white/10 space-y-4 ml-1">
                  {activityLogs.map((log) => (
                    <div key={log.digest} className="relative group/item">
                      <div className="absolute -left-[16.5px] top-1 w-2.5 h-2.5 rounded-full bg-[#050c18] border border-white/20 group-hover/item:border-accent transition-colors" />
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-white font-bold font-mono">
                            {log.actionLabel}
                          </span>
                          <span className="text-white/40 text-[9px] font-mono">
                            {log.timestamp}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-white/50 font-mono font-medium">
                          <a
                            href={getSuiScanUrl(log.digest)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline hover:text-accent text-white/30"
                          >
                            {log.digest.slice(0, 6)}...{log.digest.slice(-4)} ↗
                          </a>
                          <span>{log.epoch}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Revocation Modal */}
      {showRevokeModal && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div 
            className="bg-[#070e1b] border border-red-500/20 rounded-2xl w-full max-w-[400px] overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#0c1424] border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                <AlertTriangle size={12} />
                Revoking Delegation
              </span>
              <button 
                onClick={() => setShowRevokeModal(false)}
                className="text-white/40 hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0"
              >
                <X size={14} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-white/70 text-xs leading-relaxed font-sans">
                This action will permanently invalidate this authority on-chain. The delegate will no longer be able to execute any transactions under this delegation.
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  onMouseDown={startHold}
                  onMouseUp={endHold}
                  onMouseLeave={endHold}
                  onTouchStart={startHold}
                  onTouchEnd={endHold}
                  className="relative overflow-hidden w-full py-3 bg-transparent border border-red-500/30 text-red-400 font-bold font-mono text-[11px] rounded-xl transition-all cursor-pointer select-none"
                >
                  <div
                    className="absolute top-0 left-0 bottom-0 bg-red-500/20 transition-all duration-75 pointer-events-none"
                    style={{ width: `${holdProgress}%` }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Ban size={12} />
                    {holdProgress >= 100 ? "RELEASE TO CONFIRM" : "HOLD TO CONFIRM (1.5s)"}
                  </span>
                </button>
                <p className="text-[9px] text-center text-white/30 font-mono uppercase tracking-wider">
                  Press and hold to execute revocation
                </p>
              </div>
              <div className="text-center pt-2 border-t border-white/5">
                <button
                  onClick={() => setShowRevokeModal(false)}
                  className="text-white/40 hover:text-white text-xs font-semibold transition-colors bg-transparent border-none cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
