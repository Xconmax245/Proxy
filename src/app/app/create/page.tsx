"use client";

import { useState, useRef } from "react";
import {
  useCurrentAccount,
} from "@mysten/dapp-kit";
import { useProxyTransaction } from "@/hooks/useProxyTransaction";
import {
  Upload,
  FileText,
  CheckCircle,
  ExternalLink,
  Wallet,
  AlertTriangle,
  Copy,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { buildCreateDelegationTx, getSuiScanUrl, suiToMist, parseWalletError } from "@/lib/sui";
import { uploadToWalrus, getWalrusScanUrl } from "@/lib/walrus";
import { isContractDeployed } from "@/lib/constants";
import { useProxyStore } from "@/lib/state";
import DeploymentGate from "@/components/shared/DeploymentGate";
import ObjectPreview from "@/components/app/ObjectPreview";
import PrivPayLoader from "@/components/shared/PrivPayLoader";
import { useSuiNSAddress } from "@/hooks/useSuiNS";
import { isSuiNSName } from "@/lib/suins";

const TYPE_OPTIONS = ["Financial", "Governance", "Operational", "Legal"] as const;

const TEMPLATES = [
  {
    id: "dao-treasury",
    title: "DAO Treasury",
    description: "Financial · 10,000 SUI · 90d expiry · Depth 1",
    values: {
      delegationType: 0,
      scopeLimit: "10000",
      expiryDays: "90",
      depth: 1,
    }
  },
  {
    id: "corporate-signing",
    title: "Corporate Signing",
    description: "Legal · Unlimited · 365d expiry · Depth 2",
    values: {
      delegationType: 3,
      scopeLimit: "",
      expiryDays: "365",
      depth: 2,
    }
  },
  {
    id: "medical-poa",
    title: "Medical POA",
    description: "Operational · Unlimited · 180d expiry · Depth 0",
    values: {
      delegationType: 2,
      scopeLimit: "",
      expiryDays: "180",
      depth: 0,
    }
  }
];

interface SuccessResult {
  objectId: string;
  txDigest: string;
  blobId: string;
}

export default function CreateDelegationPage() {
  const account = useCurrentAccount();
  const { execute } = useProxyTransaction();
  const { createFormDraft: draft, setCreateFormDraft, resetCreateFormDraft } = useProxyStore();

  const [file, setFile] = useState<File | null>(null);
  const [blobId, setBlobId] = useState("");
  const [uploadState, setUploadState] = useState<"IDLE" | "UPLOADING" | "SUCCESS" | "ERROR">("IDLE");
  const [uploadError, setUploadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState<SuccessResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isSuiName = isSuiNSName(draft.delegate);
  const { data: resolvedAddress, isLoading: isResolving } = useSuiNSAddress(
    isSuiName ? draft.delegate : null
  );

  const finalDelegateAddress = isSuiName && resolvedAddress ? resolvedAddress : draft.delegate;

  if (!isContractDeployed()) return <DeploymentGate />;
  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Wallet size={32} className="text-white/20" />
        <p className="text-white/50 text-sm">Connect your Sui wallet to create a delegation.</p>
      </div>
    );
  }

  const handleFileChange = async (selected: File) => {
    if (selected.size > 10 * 1024 * 1024) {
      setUploadError("File too large. Maximum size is 10MB.");
      setUploadState("ERROR");
      setFile(null);
      setBlobId("");
      return;
    }

    setFile(selected);
    setBlobId("");
    setUploadError("");
    setUploadState("UPLOADING");

    try {
      const id = await uploadToWalrus(selected);
      setBlobId(id);
      setUploadState("SUCCESS");
      setCreateFormDraft({ description: selected.name });
    } catch (err) {
      setUploadError((err as Error).message);
      setUploadState("ERROR");
    }
  };

  const handleTryAgain = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadState("IDLE");
    setUploadError("");
    setFile(null);
    setBlobId("");
    setTimeout(() => {
      fileRef.current?.click();
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blobId) { setSubmitError("Upload an evidence file first."); return; }
    if (!finalDelegateAddress.trim()) { setSubmitError("Delegate address is required."); return; }

    setSubmitting(true);
    setSubmitError("");
    try {
      const expiryMs =
        draft.expiryDays && Number(draft.expiryDays) > 0
          ? BigInt(Date.now() + Number(draft.expiryDays) * 86_400_000)
          : BigInt(0);

      const tx = buildCreateDelegationTx({
        delegate: finalDelegateAddress.trim(),
        delegationType: draft.delegationType,
        scopeLimit: Number(draft.scopeLimit) || 0,
        expiry: expiryMs,
        depth: draft.depth,
        evidenceHash: blobId,
      });

      const data = await execute(tx);
      const objectId =
        (data as any).effects?.created?.[0]?.reference?.objectId ?? "";
      const txDigest = (data as any).digest ?? "";
      setSuccess({ objectId, txDigest, blobId });
      resetCreateFormDraft();
      setFile(null);
      setBlobId("");
      setUploadState("IDLE");
    } catch (err) {
      setSubmitError(parseWalletError(err));
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className={`grid gap-8 transition-all duration-500 ${success ? "grid-cols-1 max-w-xl mx-auto" : "grid-cols-1 lg:grid-cols-12"}`}>
      {/* Form — hidden after mint */}
      {!success && (
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          <div data-aos="fade-up" data-aos-duration="400">
            <div className="font-mono text-[10px] tracking-[0.18em] mb-2 text-accent/60 uppercase">
              Mint Delegation
            </div>
            <h1 className="font-heading text-2xl font-bold text-white tracking-tight mb-1">
              Create Delegation
            </h1>
            <p className="text-white/40 text-sm">
              Seal authority on-chain. Evidence stored permanently on Walrus.
            </p>
          </div>

          {/* Quick Templates */}
          <div data-aos="fade-up" data-aos-delay="100" data-aos-duration="500" className="space-y-2.5">
            <label className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest block">
              Quick Templates
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TEMPLATES.map((tmpl) => {
                const active =
                  draft.delegationType === tmpl.values.delegationType &&
                  draft.scopeLimit === tmpl.values.scopeLimit &&
                  draft.expiryDays === tmpl.values.expiryDays &&
                  draft.depth === tmpl.values.depth;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setCreateFormDraft(tmpl.values)}
                    className={`text-left p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                      active
                        ? "border-[#22c55e] bg-[#22c55e]/5 shadow-[0_0_12px_rgba(34,197,94,0.15)] scale-[1.02]"
                        : "border-white/[0.06] bg-[#0a1628] hover:border-white/20 hover:bg-[#0d1e36]"
                    }`}
                  >
                    <div className="font-mono text-xs font-bold text-white mb-1">
                      {tmpl.title}
                    </div>
                    <div className="text-[9px] text-white/40 font-medium">
                      {tmpl.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div data-aos="fade-up" data-aos-delay="200" data-aos-duration="500" className="card bg-[#0a1628] border border-white/[0.06] p-6 rounded-2xl space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:border-white/[0.14] transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
            {/* Type selector */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-white/40 uppercase tracking-wider block">
                Delegation Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TYPE_OPTIONS.map((t, i) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCreateFormDraft({ delegationType: i })}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      draft.delegationType === i
                        ? "bg-accent text-black border-accent"
                        : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Delegate address */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-white/40 uppercase tracking-wider block">
                Delegate Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="0x... or name.sui"
                  value={draft.delegate}
                  onChange={(e) => setCreateFormDraft({ delegate: e.target.value })}
                  required
                  className="w-full bg-[#050c18] border border-white/10 focus:border-accent rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-white/20 outline-none transition-all"
                />
                {isSuiName && (
                  <div className="mt-1 text-xs font-mono">
                    {isResolving && (
                      <span className="text-white/50">Resolving...</span>
                    )}
                    {resolvedAddress && (
                      <span className="text-[#c8ff00]">
                        ✓ {resolvedAddress.slice(0, 10)}...{resolvedAddress.slice(-6)}
                      </span>
                    )}
                    {!isResolving && !resolvedAddress && draft.delegate.length > 4 && (
                      <span className="text-red-400">
                        Name not found
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Scope limit */}
            {draft.delegationType === 0 && (
              <div className="space-y-2 group">
                <label className="text-xs font-mono font-bold text-white/40 uppercase tracking-wider block">
                  Spending Limit (SUI)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 500"
                  value={draft.scopeLimit}
                  onChange={(e) => setCreateFormDraft({ scopeLimit: e.target.value })}
                  required
                  className="w-full bg-[#050c18] border border-white/10 focus:border-accent invalid:[&:not(:placeholder-shown):not(:focus)]:border-red-500 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-white/20 outline-none transition-all peer"
                />
                <span className="hidden peer-invalid:[&:not(:placeholder-shown):not(:focus)]:block text-xs text-red-500 font-mono">Scope limit is required</span>
              </div>
            )}

            {/* Expiry */}
            <div className="space-y-2 group">
              <label className="text-xs font-mono font-bold text-white/40 uppercase tracking-wider block">
                Expiry (days from now)
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 30"
                value={draft.expiryDays}
                onChange={(e) => setCreateFormDraft({ expiryDays: e.target.value })}
                required
                className="w-full bg-[#050c18] border border-white/10 focus:border-accent invalid:[&:not(:placeholder-shown):not(:focus)]:border-red-500 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-white/20 outline-none transition-all peer"
              />
              <span className="hidden peer-invalid:[&:not(:placeholder-shown):not(:focus)]:block text-xs text-red-500 font-mono">Expiry is required</span>
            </div>

            {/* Sub-delegation depth */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-white/40 uppercase tracking-wider block">
                Sub-delegation Depth
              </label>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setCreateFormDraft({ depth: d })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      draft.depth === d
                        ? "bg-accent text-black border-accent"
                        : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Evidence upload */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-white/40 uppercase tracking-wider block">
                Evidence Document (uploaded to Walrus)
              </label>

              {uploadState === "IDLE" && (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-white/10 hover:border-white/20 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center gap-2"
                >
                  <Upload size={20} className="text-white/30" />
                  <p className="text-xs text-white/50">
                    Drop a file or <span className="text-accent">click to browse</span>
                  </p>
                  <p className="text-[10px] text-white/30">PDF, PNG, DOCX — any format (Max 10MB)</p>
                </div>
              )}

              {uploadState === "UPLOADING" && (
                <div className="border border-[#2563eb] bg-[#2563eb]/5 rounded-xl p-6 text-center transition-all flex flex-col items-center gap-2">
                  <PrivPayLoader size="md" mode="default" className="text-[#2563eb]" />
                  <p className="text-xs text-[#2563eb] font-semibold mt-2">Uploading to Walrus...</p>
                </div>
              )}

              {uploadState === "SUCCESS" && (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border border-[#22c55e] bg-[#22c55e]/5 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center gap-2"
                >
                  <CheckCircle size={20} className="text-[#22c55e]" />
                  <p className="text-xs text-[#22c55e] font-semibold">Blob certified</p>
                  <p className="text-[10px] font-mono text-white/40 break-all select-all">{blobId}</p>
                  <a
                    href={getWalrusScanUrl(blobId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] text-accent hover:underline flex items-center gap-1 mt-1 font-bold"
                  >
                    View on WalrusScan <ExternalLink size={10} />
                  </a>
                </div>
              )}

              {uploadState === "ERROR" && (
                <div className="border border-red-500 bg-red-500/5 rounded-xl p-6 text-center transition-all flex flex-col items-center gap-3">
                  <XCircle size={20} className="text-red-500" />
                  <div className="space-y-1">
                    <p className="text-xs text-red-400 font-semibold font-mono">Upload failed</p>
                    <p className="text-[10px] text-red-400/80 font-mono max-w-md break-words">{uploadError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTryAgain}
                    className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-200 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
            </div>

            {submitError && (
              <p className="text-xs text-red-400 font-mono bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-1.5">
                <AlertTriangle size={11} /> {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || uploadState === "UPLOADING" || !blobId || (isSuiName && !resolvedAddress)}
              className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-black font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <PrivPayLoader size="xs" mode="compact" />
                  Awaiting Wallet Signature…
                </>
              ) : (
                "Submit & Seal Delegation"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Object Preview — always visible, transforms to certificate after mint */}
      <div className={success ? "w-full" : "lg:col-span-5"}>
        <ObjectPreview
          delegatorAddress={account.address || ""}
          delegateAddress={success ? success["delegate" as keyof SuccessResult] ?? draft.delegate : draft.delegate || ""}
          delegationType={draft.delegationType}
          scopeLimit={Number(draft.scopeLimit) || 0}
          expiryTimestamp={draft.expiryDays ? Date.now() + Number(draft.expiryDays) * 86_400_000 : 0}
          depth={draft.depth}
          evidenceHash={blobId || ""}
          uploading={uploadState === "UPLOADING"}
          success={success}
        />
        {success && (
          <div className="mt-8 text-center">
            <button
              onClick={() => { setSuccess(null); resetCreateFormDraft(); }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white/40 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
            >
              <ArrowRight size={12} className="rotate-180" />
              Create another delegation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
