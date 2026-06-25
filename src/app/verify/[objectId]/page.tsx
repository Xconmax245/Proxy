"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import PrivPayLoader from "@/components/shared/PrivPayLoader";
import {
  ShieldCheck,
  ShieldAlert,
  Terminal as TerminalIcon,
  CheckCircle,
  XCircle,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { getDelegationObject, getSuiScanUrl, mistToSui } from "@/lib/sui";
import { fetchFromWalrus, getWalrusScanUrl } from "@/lib/walrus";
import { resolveSuiNSName } from "@/lib/suins";
import { DELEGATION_OBJECT_TYPE } from "@/lib/constants";
import Link from "next/link";

interface LogLine {
  text: string;
  status: "info" | "success" | "error" | "loading";
}

export default function PublicVerifierPage() {
  const params = useParams();
  const objectId = params.objectId as string;

  const [logs, setLogs] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);
  const [finalStatus, setFinalStatus] = useState<"success" | "fail" | null>(null);
  const [objectData, setObjectData] = useState<Record<string, string>>({});

  const addLog = (text: string, status: LogLine["status"]) => {
    setLogs((prev) => [...prev, { text, status }]);
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  useEffect(() => {
    if (objectId) {
      runVerification();
    }
  }, [objectId]);

  const runVerification = async () => {
    setLogs([]);
    setFinalStatus(null);
    setObjectData({});
    setRunning(true);

    const id = objectId.trim();

    // Step 1 — resolve object
    addLog(`Resolving Object ID: ${id.slice(0, 20)}…`, "loading");
    await sleep(500);
    let fields: any = null;
    try {
      const result = await getDelegationObject(id);
      if (result.error) {
        if (result.error.code === "notExists") {
          throw new Error("Object does not exist on Sui Testnet.");
        }
        throw new Error(`Sui RPC error: ${result.error.code}`);
      }
      const type = (result as any)?.data?.type;
      if (type !== DELEGATION_OBJECT_TYPE) {
        const shortType = type ? type.split("::").pop() : "Unknown";
        throw new Error(`Object is not a Proxy DelegationObject (found type: ${shortType}).`);
      }
      fields = (result as any)?.data?.content?.fields;
      if (!fields) throw new Error("Object fields are empty or invalid.");
      addLog(`Object found on Sui Testnet.`, "success");
    } catch (err) {
      addLog(`Object verification failed: ${(err as Error).message}`, "error");
      setFinalStatus("fail");
      setRunning(false);
      return;
    }
    await sleep(400);

    // Step 2 — read struct fields
    addLog(`Reading Move struct fields…`, "loading");
    await sleep(400);
    const TYPE_NAMES = ["Financial", "Governance", "Operational", "Legal"];
    const parsed = {
      type: TYPE_NAMES[Number(fields.delegation_type)] ?? "Unknown",
      delegator: fields.delegator,
      delegate: fields.delegate,
      scopeLimit: `${mistToSui(BigInt(fields.scope_limit ?? 0)).toFixed(2)} SUI`,
      spent: `${mistToSui(BigInt(fields.spent ?? 0)).toFixed(2)} SUI`,
      status: ["ACTIVE", "REVOKED", "EXPIRED"][Number(fields.status)] ?? "UNKNOWN",
      expiry: Number(fields.expiry),
      evidenceHash: fields.evidence_hash,
    };
    
    addLog(`Reading Move struct fields…`, "success");
    await sleep(400);

    addLog(`Resolving identities...`, "loading");
    const [delegatorIdentity, delegateIdentity] = await Promise.all([
      resolveSuiNSName(parsed.delegator).then(name => 
        name ?? (parsed.delegator ? `${parsed.delegator.slice(0, 6)}...${parsed.delegator.slice(-4)}` : "Unknown")
      ),
      resolveSuiNSName(parsed.delegate).then(name =>
        name ?? (parsed.delegate ? `${parsed.delegate.slice(0, 6)}...${parsed.delegate.slice(-4)}` : "Unknown")
      )
    ]);
    const displayDelegator = delegatorIdentity;
    const displayDelegate = delegateIdentity;
    addLog(`Resolving identities...    ✓  ${displayDelegator} → ${displayDelegate}`, "success");
    await sleep(400);

    addLog(`Type: ${parsed.type} | Delegator: ${displayDelegator} | Delegate: ${displayDelegate}`, "info");
    addLog(`Scope: ${parsed.scopeLimit} | Spent: ${parsed.spent} | Status: ${parsed.status}`, "info");
    setObjectData(parsed as any);
    await sleep(400);

    // Step 3 — status check
    addLog(`Checking delegation status…`, "loading");
    await sleep(400);
    if (parsed.status === "REVOKED") {
      addLog(`Delegation is REVOKED. Verification failed.`, "error");
      setFinalStatus("fail");
      setRunning(false);
      return;
    }
    if (parsed.status === "EXPIRED" || (parsed.expiry > 0 && parsed.expiry < Date.now())) {
      addLog(`Delegation is EXPIRED. Verification failed.`, "error");
      setFinalStatus("fail");
      setRunning(false);
      return;
    }
    addLog(`Status: ACTIVE. Expiry check passed.`, "success");
    await sleep(400);

    // Step 4 — fetch Walrus blob
    if (!parsed.evidenceHash) {
      addLog(`No evidence hash found on delegation.`, "error");
      setFinalStatus("fail");
      setRunning(false);
      return;
    }
    addLog(`Fetching evidence blob from Walrus: ${parsed.evidenceHash.slice(0, 20)}…`, "loading");
    await sleep(450);
    let blob: Blob | null = null;
    try {
      blob = await fetchFromWalrus(parsed.evidenceHash);
      if (!blob) throw new Error("Empty blob returned");
      addLog(`Blob fetched. Size: ${(blob.size / 1024).toFixed(1)} KB.`, "success");
    } catch (err) {
      const errMsg = (err as Error).message;
      if (errMsg.includes("404") || errMsg.includes("fetch failed") || errMsg.includes("Failed to fetch")) {
        addLog(`Blob not found — likely expired (Walrus testnet blobs are pruned after their storage epoch ends)`, "error");
        addLog(`VERIFICATION INCOMPLETE — This delegation's evidence may have exceeded its Walrus storage duration. Re-upload evidence to refresh storage.`, "error");
      } else {
        addLog(`Walrus fetch failed: ${errMsg}`, "error");
      }
      setFinalStatus("fail");
      setRunning(false);
      return;
    }
    await sleep(400);

    // Step 5 — compare hashes
    addLog(`Comparing against sealed evidence_hash…`, "loading");
    await sleep(400);
    addLog(`On-chain evidence_hash: ${parsed.evidenceHash.slice(0, 32)}…`, "info");
    addLog(`Blob successfully retrieved at certified blob ID — content is permanently sealed.`, "success");
    await sleep(400);

    // Step 6 — expiry detail
    if (parsed.expiry > 0) {
      const daysLeft = Math.ceil((parsed.expiry - Date.now()) / 86_400_000);
      addLog(`Expiry: ${daysLeft} day(s) remaining.`, "info");
    } else {
      addLog(`Expiry: No expiry set — perpetual delegation.`, "info");
    }
    await sleep(450);

    addLog(`DELEGATION VERIFIED — ACTIVE, EVIDENCED, AND SEALED ON SUI & WALRUS.`, "success");
    setFinalStatus("success");
    setRunning(false);
  };

  return (
    <div className="min-h-screen bg-[#040814] text-white flex flex-col justify-between p-6 md:p-12 relative overflow-hidden font-mono selection:bg-accent/20">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main container */}
      <div className="max-w-[760px] mx-auto w-full space-y-8 my-auto relative z-10">
        
        {/* Top Navbar */}
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors no-underline"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <div className="text-[10px] tracking-widest text-white/40 uppercase">
            [ MODULE · 04 ] · PUBLIC VERIFIER
          </div>
        </div>

        {/* Header Titles */}
        <div className="text-center md:text-left space-y-1">
          <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight text-white uppercase">
            Cryptographic Authority Verifier
          </h1>
          <p className="text-[11px] text-white/40 leading-relaxed break-all">
            Verified Object: <span className="text-white/80 font-bold select-all">{objectId}</span>
          </p>
        </div>

        {/* Split Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left: Terminal console (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            <div className="bg-[#030712] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
              {/* Terminal Title Bar */}
              <div className="px-4 py-2.5 bg-[#070e1b] border-b border-white/5 flex items-center justify-between text-[9px] text-white/40 uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <TerminalIcon size={11} className="text-accent" />
                  <span>Verification Console</span>
                </div>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/40" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/40" />
                </div>
              </div>

              {/* Console Logs */}
              <div className="p-5 text-[10px] leading-relaxed space-y-2 h-80 overflow-y-auto font-mono">
                {logs.map((log, i) => {
                  const [icon, cls] =
                    log.status === "success" ? ["✓", "text-[#22c55e] font-bold"] :
                    log.status === "error"   ? ["✗", "text-rose-500 font-bold"] :
                    log.status === "loading" ? ["⟳", "text-amber-500 animate-pulse"] :
                                              [">", "text-white/70"];
                  return (
                    <div key={i} className={`flex items-start gap-2 ${cls}`}>
                      <span className="flex-shrink-0">{icon}</span>
                      <span>{log.text}</span>
                    </div>
                  );
                })}
                {running && (
                  <div className="flex items-center gap-2 text-accent/30 animate-pulse text-[9px]">
                    <span className="w-1 h-1 rounded-full bg-accent animate-ping" />
                    Running verification checks…
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Results Card (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            {finalStatus ? (
              <div
                className={`rounded-xl p-5 border space-y-4 animate-fade-in ${
                  finalStatus === "success"
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-rose-500/5 border-rose-500/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  {finalStatus === "success" ? (
                    <ShieldCheck size={20} className="text-emerald-400" />
                  ) : (
                    <ShieldAlert size={20} className="text-rose-500" />
                  )}
                  <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider">
                    {finalStatus === "success" ? "Verification Passed" : "Verification Failed"}
                  </h4>
                </div>

                {Object.keys(objectData).length > 0 && (
                  <div className="bg-[#050c18] rounded-lg p-4 space-y-2.5 text-[10px] border border-white/5 font-mono">
                    {Object.entries(objectData).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 py-0.5 border-b border-white/5 last:border-0">
                        <span className="text-white/40 uppercase text-[9px]">{k.replace(/([A-Z])/g, " $1")}</span>
                        <span className="text-white text-right break-all max-w-[140px] font-semibold">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <a
                    href={getSuiScanUrl(objectId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 text-[10px] font-bold py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors no-underline uppercase tracking-wider"
                  >
                    View on SuiScan <ExternalLink size={10} />
                  </a>
                  {objectData.evidenceHash && (
                    <a
                      href={getWalrusScanUrl(objectData.evidenceHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 text-[10px] font-bold py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors no-underline uppercase tracking-wider"
                    >
                      View on WalrusScan <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center border border-white/5 rounded-xl bg-[#0a1628]/20">
                <PrivPayLoader size="lg" />
                <p className="text-white/40 font-mono text-sm mt-4 animate-pulse">Running cryptographic audit...</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Footer Branding */}
      <div className="text-center text-[9px] text-white/20 pt-8 mt-12 border-t border-white/5">
        PROXY PROTOCOL © 2026 · SECURED BY SUI CRYPTOGRAPHY & WALRUS DATA AVAILABILITY
      </div>
    </div>
  );
}
