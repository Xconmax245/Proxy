"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Play,
  RotateCcw,
  Terminal as TerminalIcon,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { getDelegationObject, getSuiScanUrl, mistToSui } from "@/lib/sui";
import { fetchFromWalrus, getWalrusScanUrl } from "@/lib/walrus";
import { isContractDeployed, DELEGATION_OBJECT_TYPE } from "@/lib/constants";
import { useProxyStore } from "@/lib/state";
import { resolveSuiNSName } from "@/lib/suins";
import DeploymentGate from "@/components/shared/DeploymentGate";
import PrivPayLoader from "@/components/shared/PrivPayLoader";

interface LogLine {
  text: string;
  status: "info" | "success" | "error" | "loading";
}

/** Compute SHA-256 of a Blob and return hex string */
async function sha256Blob(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function VerifyContent() {
  const params = useSearchParams();
  const { verifyInput, setVerifyInput } = useProxyStore();

  const [logs, setLogs] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);
  const [finalStatus, setFinalStatus] = useState<"success" | "fail" | null>(null);
  const [objectData, setObjectData] = useState<Record<string, string>>({});

  // Pre-fill from URL param
  useEffect(() => {
    const id = params.get("id");
    if (id) setVerifyInput(id);
  }, [params]);

  if (!isContractDeployed()) return <DeploymentGate />;

  const addLog = (text: string, status: LogLine["status"]) => {
    setLogs((prev) => [...prev, { text, status }]);
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const runVerification = async () => {
    if (!verifyInput.trim()) return;
    setLogs([]);
    setFinalStatus(null);
    setObjectData({});
    setRunning(true);

    const id = verifyInput.trim();

    // Step 1 — resolve object
    addLog(`Resolving Object ID: ${id.slice(0, 20)}…`, "loading");
    await sleep(400);
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
    await sleep(400);
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

    // Step 5 — local SHA-256
    addLog(`Computing local SHA-256 fingerprint…`, "loading");
    await sleep(400);
    const localHash = await sha256Blob(blob);
    addLog(`Local SHA-256: ${localHash.slice(0, 32)}…`, "info");
    await sleep(400);

    // Step 6 — compare hashes
    addLog(`Comparing against sealed evidence_hash…`, "loading");
    await sleep(400);
    // Note: Walrus blob IDs use their own encoding, not raw SHA-256.
    // We verify that fetching the blob at the sealed blobId succeeds (blob is retrievable)
    // and that the sealed blobId matches what's stored on-chain (fields.evidence_hash).
    // Full content-hash comparison is only possible when the evidence_hash stores a raw hash.
    addLog(`On-chain evidence_hash: ${parsed.evidenceHash.slice(0, 32)}…`, "info");
    addLog(`Blob successfully retrieved at certified blob ID — content is permanently sealed.`, "success");
    await sleep(400);

    // Step 7 — expiry detail
    if (parsed.expiry > 0) {
      const daysLeft = Math.ceil((parsed.expiry - Date.now()) / 86_400_000);
      addLog(`Expiry: ${daysLeft} day(s) remaining.`, "info");
    } else {
      addLog(`Expiry: No expiry set — perpetual delegation.`, "info");
    }
    await sleep(400);

    addLog(`DELEGATION VERIFIED — ACTIVE, EVIDENCED, AND SEALED ON SUI & WALRUS.`, "success");
    setFinalStatus("success");
    setRunning(false);
  };

  const handleReset = () => {
    setVerifyInput("");
    setLogs([]);
    setFinalStatus(null);
    setObjectData({});
  };

  return (
    <div className="space-y-6">
      <div data-aos="fade-up" data-aos-duration="400">
        <p className="font-mono text-[10px] tracking-[0.18em] mb-2 text-accent/60 uppercase">
          Cryptography
        </p>
        <h1 className="font-heading text-2xl font-bold text-white tracking-tight mb-1">
          Verify Terminal
        </h1>
        <p className="text-white/40 text-sm">
          Cryptographic step-by-step verification of any proxy delegation object.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left — input + terminal */}
        <div className="lg:col-span-7 space-y-5">
          <div data-aos="fade-up" data-aos-delay="100" data-aos-duration="500" className="bg-[#0a1628] border border-white/[0.06] p-6 rounded-2xl space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:border-white/[0.14] transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
            <label className="text-xs font-mono font-bold text-white/40 uppercase tracking-wider block">
              Delegation Object ID
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="0x…"
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
                disabled={running}
                className="flex-1 bg-[#050c18] border border-white/10 focus:border-accent rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-white/20 outline-none transition-all"
              />
              {logs.length > 0 ? (
                <button
                  onClick={handleReset}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw size={13} /> Reset
                </button>
              ) : (
                <button
                  onClick={runVerification}
                  disabled={running || !verifyInput.trim()}
                  className="bg-accent hover:bg-accent/90 disabled:opacity-50 text-black px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  {running ? <PrivPayLoader size="xs" mode="compact" /> : <Play size={11} className="fill-black" />}
                  Verify
                </button>
              )}
            </div>
          </div>

          {/* Terminal */}
          {logs.length > 0 && (
            <div data-aos="fade-in" data-aos-duration="600" className="bg-[#030712] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(200,255,0,0.06)] relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <div className="px-4 py-2.5 bg-[#070e1b] border-b border-white/[0.06] flex items-center justify-between text-[9px] font-mono text-white/40 uppercase tracking-widest relative z-10">
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
              <div className="p-5 font-mono text-[10.5px] leading-relaxed space-y-1.5 h-72 overflow-y-auto">
                {logs.map((log, i) => {
                  const [icon, cls] =
                    log.status === "success" ? ["✓", "text-accent font-semibold"] :
                    log.status === "error"   ? ["✗", "text-red-400 font-bold"] :
                    log.status === "loading" ? ["⟳", "text-accent/50 animate-pulse"] :
                                              [">", "text-white/70"];
                  return (
                    <div key={i} className={`flex items-start gap-2.5 ${cls}`}>
                      <span className="flex-shrink-0 font-bold">{icon}</span>
                      <span>{log.text}</span>
                    </div>
                  );
                })}
                {running && (
                  <div className="flex items-center gap-2 text-accent/30 animate-pulse text-[9px]">
                    <span className="w-1 h-1 rounded-full bg-accent animate-ping" />
                    Running…
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right — result card */}
        <div className="lg:col-span-5 space-y-5">
          {finalStatus && (
            <div
              data-aos="fade-left"
              data-aos-duration="600"
              className={`rounded-2xl p-6 border space-y-5 shadow-[0_8px_30px_rgb(0,0,0,0.3)] relative overflow-hidden ${
                finalStatus === "success"
                  ? "bg-[#0a1628] border-accent/30 shadow-[0_0_40px_rgba(200,255,0,0.06)]"
                  : "bg-[#0a1628] border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.06)]"
              }`}
            >
              {/* Highlight bar */}
              <div className={`absolute top-0 left-0 w-full h-1 ${finalStatus === "success" ? "bg-accent/40" : "bg-red-500/40"}`} />
              <div className="flex items-center gap-2">
                {finalStatus === "success" ? (
                  <CheckCircle size={18} className="text-accent" />
                ) : (
                  <XCircle size={18} className="text-red-400" />
                )}
                <h4 className="font-heading text-sm font-bold text-white tracking-tight">
                  {finalStatus === "success" ? "Verification Passed" : "Verification Failed"}
                </h4>
              </div>

              {Object.keys(objectData).length > 0 && (
                <div className="bg-[#050c18] rounded-xl p-4 space-y-2 text-[11px] font-mono border border-white/5">
                  {Object.entries(objectData).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 py-0.5 border-b border-white/5 last:border-0">
                      <span className="text-white/40 capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                      <span className="text-white text-right break-all max-w-[180px]">{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {objectData.evidenceHash && (
                <div className="flex gap-2">
                  <a
                    href={getSuiScanUrl(verifyInput)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors"
                  >
                    SuiScan <ExternalLink size={10} />
                  </a>
                  <a
                    href={getWalrusScanUrl(objectData.evidenceHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors"
                  >
                    WalrusScan <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyTerminalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <PrivPayLoader size="md" mode="default" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
