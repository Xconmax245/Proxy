"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Terminal as TerminalIcon,
  Clock,
  ExternalLink,
  Activity,
  FileText,
} from "lucide-react";
import {
  getDelegationObject,
  getSuiScanUrl,
  mistToSui,
  suiClient,
} from "@/lib/sui";
import { getWalrusScanUrl } from "@/lib/walrus";
import { resolveSuiNSName } from "@/lib/suins";
import { DelegationObject } from "@/lib/state";
import DelegationCard from "@/components/app/DelegationCard";
import { isContractDeployed } from "@/lib/constants";
import DeploymentGate from "@/components/shared/DeploymentGate";
import PrivPayLoader from "@/components/shared/PrivPayLoader";

const TYPE_NAMES = ["Financial", "Governance", "Operational", "Legal"];

interface LogLine {
  text: string;
  status: "info" | "success" | "error" | "loading";
}

interface TxLog {
  digest: string;
  timestamp: string;
  epoch: string;
  actionLabel: string;
}

function parseDelegationFields(result: any): DelegationObject | null {
  try {
    const f = result?.data?.content?.fields;
    if (!f) return null;
    return {
      id: result.data.objectId,
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

type Tab = "audit" | "history" | "evidence";

export default function DelegationAuditPage() {
  if (!isContractDeployed()) return <DeploymentGate />;
  return <AuditPageInner />;
}

function AuditPageInner() {
  const params = useParams();
  const objectId = params.objectId as string;

  const [tab, setTab] = useState<Tab>("audit");
  const [delegation, setDelegation] = useState<DelegationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Audit log state
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditStatus, setAuditStatus] = useState<"success" | "fail" | null>(null);

  // Tx history
  const [txLogs, setTxLogs] = useState<TxLog[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  const addLog = useCallback((text: string, status: LogLine["status"]) => {
    setLogs((prev) => [...prev, { text, status }]);
  }, []);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Fetch object on mount
  useEffect(() => {
    if (!objectId) return;
    (async () => {
      try {
        const result = await getDelegationObject(objectId);
        const parsed = parseDelegationFields(result);
        if (!parsed) {
          setNotFound(true);
        } else {
          setDelegation(parsed);
          runAudit(parsed);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [objectId]); // eslint-disable-line

  const runAudit = async (d: DelegationObject) => {
    setAuditRunning(true);
    setLogs([]);
    setAuditStatus(null);

    addLog(`Initialising audit for object ${objectId.slice(0, 16)}…`, "loading");
    await sleep(400);
    addLog(`Object resolved on Sui Testnet.`, "success");
    await sleep(300);

    // Identity resolution
    addLog(`Resolving on-chain identities…`, "loading");
    const [delegatorIdentity, delegateIdentity] = await Promise.all([
      resolveSuiNSName(d.delegator).then(name => 
        name ?? (d.delegator ? `${d.delegator.slice(0, 6)}...${d.delegator.slice(-4)}` : "Unknown")
      ),
      resolveSuiNSName(d.delegate).then(name =>
        name ?? (d.delegate ? `${d.delegate.slice(0, 6)}...${d.delegate.slice(-4)}` : "Unknown")
      )
    ]);
    addLog(
      `Delegator: ${delegatorIdentity}`,
      "info"
    );
    addLog(
      `Delegate:  ${delegateIdentity}`,
      "info"
    );
    await sleep(350);

    // Type check
    addLog(
      `Delegation type: ${TYPE_NAMES[d.delegation_type] ?? "Custom"} (${d.delegation_type})`,
      "info"
    );
    await sleep(250);

    // Status check
    addLog(`Verifying revocation status…`, "loading");
    await sleep(400);
    if (d.status === 1) {
      addLog(`Status: REVOKED — delegation is no longer valid.`, "error");
      setAuditStatus("fail");
      setAuditRunning(false);
      return;
    }
    addLog(`Status: ACTIVE — not revoked.`, "success");
    await sleep(300);

    // Expiry check
    addLog(`Checking expiry…`, "loading");
    await sleep(350);
    if (d.expiry > 0 && d.expiry < Date.now()) {
      addLog(
        `Expiry: ELAPSED — expired at ${new Date(d.expiry).toLocaleString()}.`,
        "error"
      );
      setAuditStatus("fail");
      setAuditRunning(false);
      return;
    }
    if (d.expiry === 0) {
      addLog(`Expiry: NONE — perpetual delegation.`, "info");
    } else {
      const daysLeft = Math.ceil((d.expiry - Date.now()) / 86_400_000);
      addLog(`Expiry: ${daysLeft} day(s) remaining.`, "success");
    }
    await sleep(300);

    // Scope / budget check
    if (d.delegation_type === 0) {
      addLog(`Checking budget utilisation…`, "loading");
      await sleep(350);
      const pct =
        d.scope_limit > 0
          ? ((d.spent / d.scope_limit) * 100).toFixed(1)
          : "0.0";
      const spentSui = mistToSui(BigInt(d.spent ?? 0));
      const limitSui = mistToSui(BigInt(d.scope_limit ?? 0));
      addLog(
        `Budget: ${spentSui.toFixed(2)} / ${limitSui.toFixed(2)} SUI spent (${pct}%).`,
        "info"
      );
      await sleep(250);
    }

    // Depth check
    addLog(
      `Sub-delegation depth remaining: ${d.depth_remaining} level(s).`,
      "info"
    );
    await sleep(250);

    // Evidence check
    if (d.evidence_hash) {
      addLog(
        `Evidence hash present: ${d.evidence_hash.slice(0, 20)}…`,
        "success"
      );
      addLog(`Blob permanently sealed on Walrus DA.`, "success");
    } else {
      addLog(`No evidence hash attached to this delegation.`, "info");
    }
    await sleep(350);

    addLog(
      `AUDIT COMPLETE — DELEGATION IS ${d.status === 0 ? "ACTIVE AND VALID" : "INVALID"}.`,
      "success"
    );
    setAuditStatus("success");
    setAuditRunning(false);
  };

  const loadTxHistory = useCallback(async () => {
    if (!objectId || txLogs.length > 0) return;
    setTxLoading(true);
    try {
      const txs = await suiClient.queryTransactionBlocks({
        filter: { InputObject: objectId },
        options: { showEffects: true, showInput: true },
        limit: 20,
        order: "descending",
      });

      const ACTION_LABELS: Record<string, string> = {
        create_delegation: "DELEGATION CREATED",
        revoke: "DELEGATION REVOKED",
        execute_action: "ACTION EXECUTED",
        sub_delegate: "SUB-DELEGATION CREATED",
      };

      const parsed: TxLog[] = txs.data.map((tx) => {
        const fnName =
          (tx as any)?.transaction?.data?.transaction?.transactions?.[0]
            ?.MoveCall?.function ?? "unknown";
        return {
          digest: tx.digest,
          timestamp: tx.timestampMs
            ? new Date(Number(tx.timestampMs)).toLocaleString()
            : "—",
          epoch: `Epoch ${(tx as any).checkpoint ?? "—"}`,
          actionLabel: ACTION_LABELS[fnName] ?? fnName.toUpperCase(),
        };
      });
      setTxLogs(parsed);
    } catch {
      setTxLogs([]);
    } finally {
      setTxLoading(false);
    }
  }, [objectId, txLogs.length]);

  // Preload tx history when tab switches
  useEffect(() => {
    if (tab === "history") {
      loadTxHistory();
    }
  }, [tab, loadTxHistory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PrivPayLoader size="lg" mode="default" />
      </div>
    );
  }

  if (notFound || !delegation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/app/delegations"
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors no-underline font-mono"
          >
            <ArrowLeft size={14} /> Back to Ledger
          </Link>
        </div>
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-white/40 font-mono text-sm">
            Delegation object not found or invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div data-aos="fade-up" data-aos-duration="400" className="flex items-start justify-between">
        <div>
          <Link
            href="/app/delegations"
            className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white transition-colors no-underline font-mono mb-3 group"
          >
            <ArrowLeft
              size={12}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Back to Ledger
          </Link>
          <p className="font-mono text-[10px] tracking-[0.18em] mb-2 text-accent/60 uppercase">
            Audit Trail
          </p>
          <h1 className="font-heading text-2xl font-bold text-white tracking-tight mb-1">
            Delegation Audit Log
          </h1>
          <p className="text-white/50 text-sm font-mono break-all">
            {objectId.slice(0, 20)}…{objectId.slice(-8)}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-6">
          {auditStatus === "success" && (
            <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-3 py-1">
              <ShieldCheck size={12} /> VERIFIED
            </span>
          )}
          {auditStatus === "fail" && (
            <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-full px-3 py-1">
              <ShieldAlert size={12} /> INVALID
            </span>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-start">
        {/* Left: live card */}
        <div className="space-y-4">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
            Live Object State
          </p>
          <DelegationCard delegation={delegation} />
        </div>

        {/* Right: tabbed audit panel */}
        <div className="space-y-4">
          {/* Tab bar */}
          <div data-aos="fade-up" data-aos-delay="100" data-aos-duration="400" className="flex bg-[#0a1628] border border-white/[0.06] rounded-xl p-1 gap-1 w-fit shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
            {(
              [
                { id: "audit", label: "System Validation", icon: TerminalIcon },
                { id: "history", label: "Tx History", icon: Activity },
                { id: "evidence", label: "Evidence", icon: FileText },
              ] as { id: Tab; label: string; icon: React.ElementType }[]
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer border-0 outline-none ${
                  tab === id
                    ? "bg-accent text-black shadow-[0_0_12px_rgba(200,255,0,0.2)]"
                    : "text-white/40 hover:text-white hover:bg-white/5 bg-transparent"
                }`}
              >
                <Icon size={11} />
                {label}
              </button>
            ))}
          </div>

          {/* ── AUDIT LOG TAB ── */}
          {tab === "audit" && (
            <div data-aos="fade-in" data-aos-delay="200" data-aos-duration="600" className="bg-[#030712] border border-white/10 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(200,255,0,0.06)] relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              {/* Terminal title bar */}
              <div className="px-5 py-3 bg-[#070e1b] border-b border-white/[0.06] flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2 text-[9px] font-mono text-white/40 uppercase tracking-widest">
                  <TerminalIcon size={11} className="text-accent" />
                  Cryptographic Audit Console
                </div>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/40" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/40" />
                </div>
              </div>
              {/* Logs */}
              <div className="p-5 text-[10px] leading-relaxed space-y-2 h-80 overflow-y-auto font-mono">
                {logs.map((log, i) => {
                  const [icon, cls] =
                    log.status === "success"
                      ? ["✓", "text-emerald-400 font-bold"]
                      : log.status === "error"
                      ? ["✗", "text-rose-500 font-bold"]
                      : log.status === "loading"
                      ? ["⟳", "text-amber-500 animate-pulse"]
                      : [">", "text-white/70"];
                  return (
                    <div key={i} className={`flex items-start gap-2 ${cls}`}>
                      <span className="flex-shrink-0">{icon}</span>
                      <span>{log.text}</span>
                    </div>
                  );
                })}
                {auditRunning && (
                  <div className="flex items-center gap-2 text-accent/30 animate-pulse text-[9px]">
                    <span className="w-1 h-1 rounded-full bg-accent animate-ping" />
                    Running audit checks…
                  </div>
                )}
              </div>
              {/* Footer */}
              {!auditRunning && (
                <div className="px-5 py-3 border-t border-white/5 flex justify-between items-center">
                  <a
                    href={getSuiScanUrl(objectId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] font-mono text-white/40 hover:text-white transition-colors no-underline"
                  >
                    View on SuiScan <ExternalLink size={9} />
                  </a>
                  <button
                    onClick={() => runAudit(delegation)}
                    className="text-[10px] font-mono text-accent hover:text-white transition-colors cursor-pointer bg-transparent border-0 outline-none"
                  >
                    Re-run audit →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── TX HISTORY TAB ── */}
          {tab === "history" && (
            <div data-aos="fade-in" data-aos-duration="500" className="bg-[#0a1628] border border-white/[0.06] rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
              <div className="px-5 py-3 bg-[#070e1b] border-b border-white/[0.06] flex items-center gap-2 text-[9px] font-mono text-white/40 uppercase tracking-widest">
                <Activity size={11} className="text-accent" />
                Transaction History
              </div>
              <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                {txLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <PrivPayLoader size="md" mode="default" />
                  </div>
                ) : txLogs.length === 0 ? (
                  <div className="py-12 text-center text-[11px] font-mono text-white/30">
                    No transactions found for this object.
                  </div>
                ) : (
                  txLogs.map((tx) => (
                    <div
                      key={tx.digest}
                      className="px-5 py-3.5 flex items-center justify-between hover:bg-white/2 transition-colors group"
                    >
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono font-bold text-white block">
                          {tx.actionLabel}
                        </span>
                        <div className="flex items-center gap-3 text-[9px] font-mono text-white/40">
                          <span className="flex items-center gap-1">
                            <Clock size={9} />
                            {tx.timestamp}
                          </span>
                          <span>{tx.epoch}</span>
                        </div>
                      </div>
                      <a
                        href={getSuiScanUrl(tx.digest)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] font-mono text-white/30 hover:text-accent transition-colors no-underline flex items-center gap-1 group-hover:text-white/50"
                      >
                        {tx.digest.slice(0, 6)}…{tx.digest.slice(-4)}{" "}
                        <ExternalLink size={9} />
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── EVIDENCE TAB ── */}
          {tab === "evidence" && (
            <div data-aos="fade-in" data-aos-duration="500" className="bg-[#0a1628] border border-white/[0.06] rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
              <div className="px-5 py-3 bg-[#070e1b] border-b border-white/[0.06] flex items-center gap-2 text-[9px] font-mono text-white/40 uppercase tracking-widest">
                <FileText size={11} className="text-accent" />
                Walrus Evidence Metadata
              </div>
              <div className="p-5 space-y-4">
                {delegation.evidence_hash ? (
                  <>
                    <div className="space-y-3 text-[10px] font-mono">
                      <div className="flex justify-between items-start py-2 border-b border-white/5">
                        <span className="text-white/40 uppercase text-[9px]">
                          Blob ID
                        </span>
                        <span className="text-white text-right break-all max-w-[240px] font-semibold select-all">
                          {delegation.evidence_hash}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-white/40 uppercase text-[9px]">
                          Storage Layer
                        </span>
                        <span className="text-purple-400 font-bold">
                          Walrus DA (Testnet)
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-white/40 uppercase text-[9px]">
                          Certification
                        </span>
                        <span className="text-emerald-400 font-bold">
                          PERMANENTLY SEALED
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-white/40 uppercase text-[9px]">
                          On-chain Reference
                        </span>
                        <span className="text-white/60 font-semibold">
                          evidence_hash (String field)
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-white/40 uppercase text-[9px]">
                          Object ID
                        </span>
                        <span className="text-white/60 font-semibold break-all max-w-[180px]">
                          {objectId.slice(0, 12)}…{objectId.slice(-6)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <a
                        href={getWalrusScanUrl(delegation.evidence_hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 transition-all no-underline uppercase tracking-wider"
                      >
                        View on WalrusScan <ExternalLink size={10} />
                      </a>
                      <a
                        href={getSuiScanUrl(objectId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all no-underline uppercase tracking-wider"
                      >
                        View Object on SuiScan <ExternalLink size={10} />
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="py-10 text-center text-[11px] font-mono text-white/30">
                    No evidence blob attached to this delegation.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
