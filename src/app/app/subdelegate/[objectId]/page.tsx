"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useProxyTransaction } from "@/hooks/useProxyTransaction";
import {
  Upload,
  CheckCircle,
  ExternalLink,
  Wallet,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Ban,
} from "lucide-react";
import { getDelegationObject, buildSubDelegateTx, getSuiScanUrl, mistToSui, parseWalletError } from "@/lib/sui";
import { uploadToWalrus, getWalrusScanUrl } from "@/lib/walrus";
import { isContractDeployed } from "@/lib/constants";
import { DelegationObject } from "@/lib/state";
import DeploymentGate from "@/components/shared/DeploymentGate";
import ObjectPreview from "@/components/app/ObjectPreview";
import PrivPayLoader from "@/components/shared/PrivPayLoader";
import { useSuiNSAddress } from "@/hooks/useSuiNS";
import { isSuiNSName } from "@/lib/suins";
import Link from "next/link";

const TYPE_OPTIONS = ["Financial", "Governance", "Operational", "Legal"] as const;

interface SuccessResult {
  objectId: string;
  txDigest: string;
  blobId: string;
}

export default function SubDelegatePage() {
  const { objectId } = useParams() as { objectId: string };
  const router = useRouter();
  const account = useCurrentAccount();
  const { execute } = useProxyTransaction();

  const [parentDelegation, setParentDelegation] = useState<DelegationObject | null>(null);
  const [loadingParent, setLoadingParent] = useState(true);

  // Form State
  const [delegateAddress, setDelegateAddress] = useState("");
  const [scopeLimit, setScopeLimit] = useState("");
  const [expiryDays, setExpiryDays] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [blobId, setBlobId] = useState("");
  const [uploadState, setUploadState] = useState<"IDLE" | "UPLOADING" | "SUCCESS" | "ERROR">("IDLE");
  const [uploadError, setUploadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState<SuccessResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isSuiName = isSuiNSName(delegateAddress);
  const { data: resolvedAddress, isLoading: isResolving } = useSuiNSAddress(
    isSuiName ? delegateAddress : null
  );

  const finalDelegateAddress = isSuiName && resolvedAddress ? resolvedAddress : delegateAddress;

  useEffect(() => {
    if (objectId) fetchParent();
  }, [objectId]);

  const fetchParent = async () => {
    setLoadingParent(true);
    try {
      const result = await getDelegationObject(objectId);
      const fields = (result as any)?.data?.content?.fields;
      if (!fields) throw new Error("Invalid delegation object");
      
      const parsed: DelegationObject = {
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
      };
      setParentDelegation(parsed);
      
      // Initialize expiry days based on parent expiry if set
      if (parsed.expiry > 0) {
        const remainingDays = Math.floor((parsed.expiry - Date.now()) / 86_400_000);
        setExpiryDays(remainingDays > 0 ? remainingDays.toString() : "1");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingParent(false);
    }
  };

  if (!isContractDeployed()) return <DeploymentGate />;
  
  if (loadingParent) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <PrivPayLoader size="lg" />
      </div>
    );
  }

  if (!parentDelegation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertTriangle size={32} className="text-red-500/50" />
        <p className="text-white/50 text-sm">Delegation object not found.</p>
        <Link href="/app/delegations" className="text-accent hover:underline text-xs">Back to Delegations</Link>
      </div>
    );
  }

  if (parentDelegation.status !== 0 || (parentDelegation.expiry > 0 && parentDelegation.expiry < Date.now())) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Ban size={32} className="text-red-500/50" />
        <p className="text-white/50 text-sm">This delegation is not active. Cannot sub-delegate.</p>
        <Link href="/app/delegations" className="text-accent hover:underline text-xs">Back to Delegations</Link>
      </div>
    );
  }

  if (parentDelegation.depth_remaining <= 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertTriangle size={32} className="text-yellow-500/50" />
        <p className="text-white/50 text-sm">Maximum delegation depth reached.</p>
        <Link href="/app/delegations" className="text-accent hover:underline text-xs">Back to Delegations</Link>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Wallet size={32} className="text-white/20" />
        <p className="text-white/50 text-sm">Connect your Sui wallet to sub-delegate.</p>
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
    setTimeout(() => fileRef.current?.click(), 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blobId) { setSubmitError("Upload an evidence file first."); return; }
    if (!finalDelegateAddress.trim()) { setSubmitError("Delegate address is required."); return; }

    // Validate scope limit
    let finalScopeLimit = Number(scopeLimit) || 0;
    if (parentDelegation.delegation_type === 0) {
      const remainingSui = mistToSui(BigInt(parentDelegation.scope_limit - parentDelegation.spent));
      if (finalScopeLimit > remainingSui) {
        setSubmitError(`Cannot exceed remaining parent scope (${remainingSui} SUI)`);
        return;
      }
    }

    // Validate expiry
    let expiryMs = BigInt(0);
    if (expiryDays && Number(expiryDays) > 0) {
      expiryMs = BigInt(Date.now() + Number(expiryDays) * 86_400_000);
    }
    
    if (parentDelegation.expiry > 0) {
      if (expiryMs === BigInt(0) || expiryMs > BigInt(parentDelegation.expiry)) {
        expiryMs = BigInt(parentDelegation.expiry); // Cap at parent expiry
      }
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const tx = buildSubDelegateTx({
        delegationId: parentDelegation.id,
        newDelegate: finalDelegateAddress.trim(),
        scopeLimit: finalScopeLimit,
        expiry: expiryMs,
      });

      const data = await execute(tx);
      const newObjectId = (data as any).effects?.created?.[0]?.reference?.objectId ?? "";
      const txDigest = (data as any).digest ?? "";
      setSuccess({ objectId: newObjectId, txDigest, blobId });
      
      setFile(null);
      setUploadState("IDLE");
    } catch (err) {
      setSubmitError(parseWalletError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`grid gap-8 transition-all duration-500 ${success ? "grid-cols-1 max-w-xl mx-auto" : "grid-cols-1 lg:grid-cols-12"}`}>
      {/* Form */}
      {!success && (
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          <div data-aos="fade-up" data-aos-duration="400">
            <Link href="/app/delegations" className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors no-underline mb-4">
              <ArrowLeft size={14} /> Back to Delegations
            </Link>
            <div className="font-mono text-[10px] tracking-[0.18em] mb-2 text-blue-400/60 uppercase">
              Extend Authority Chain
            </div>
            <h1 className="font-heading text-2xl font-bold text-white tracking-tight mb-1">
              Sub-delegate
            </h1>
            <p className="text-white/40 text-sm">
              Delegate your authority to another wallet. Constraints are inherited.
            </p>
          </div>

          <div data-aos="fade-up" data-aos-delay="100" data-aos-duration="500" className="card bg-[#0a1628] border border-white/[0.06] p-6 rounded-2xl space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:border-white/[0.14] transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
            
            {/* Type selector (Locked) */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-white/40 uppercase tracking-wider block">
                Delegation Type (Inherited)
              </label>
              <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white/60">
                {TYPE_OPTIONS[parentDelegation.delegation_type] || "Custom"}
              </div>
            </div>

            {/* Delegate address */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-white/40 uppercase tracking-wider block">
                New Delegate Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="0x... or name.sui"
                  value={delegateAddress}
                  onChange={(e) => setDelegateAddress(e.target.value)}
                  required
                  className="w-full bg-[#050c18] border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-white/20 outline-none transition-all"
                />
                {isSuiName && (
                  <div className="mt-1 text-xs font-mono">
                    {isResolving && <span className="text-white/50">Resolving...</span>}
                    {resolvedAddress && (
                      <span className="text-blue-400">
                        ✓ {resolvedAddress.slice(0, 10)}...{resolvedAddress.slice(-6)}
                      </span>
                    )}
                    {!isResolving && !resolvedAddress && delegateAddress.length > 4 && (
                      <span className="text-red-400">Name not found</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Scope limit */}
            {parentDelegation.delegation_type === 0 && (
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-white/40 uppercase tracking-wider block">
                  Spending Limit (Max: {mistToSui(BigInt(parentDelegation.scope_limit - parentDelegation.spent))} SUI)
                </label>
                <input
                  type="number"
                  min="1"
                  max={mistToSui(BigInt(parentDelegation.scope_limit - parentDelegation.spent))}
                  step="any"
                  placeholder={`e.g. ${Math.floor(mistToSui(BigInt(parentDelegation.scope_limit - parentDelegation.spent)) / 2)}`}
                  value={scopeLimit}
                  onChange={(e) => setScopeLimit(e.target.value)}
                  className="w-full bg-[#050c18] border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-white/20 outline-none transition-all"
                />
              </div>
            )}

            {/* Expiry */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-xs font-mono font-bold text-white/40 uppercase tracking-wider block">
                  Expiry (days from now)
                </label>
                {parentDelegation.expiry > 0 && (
                  <span className="text-[10px] font-mono text-white/30">
                    Parent Expiry: {new Date(parentDelegation.expiry).toLocaleDateString()}
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                placeholder="e.g. 30"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                className="w-full bg-[#050c18] border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-white/20 outline-none transition-all"
              />
            </div>

            {/* Evidence upload */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-white/40 uppercase tracking-wider block flex items-center justify-between">
                Sub-delegation Evidence
                {parentDelegation.evidence_hash && (
                  <a
                    href={getWalrusScanUrl(parentDelegation.evidence_hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-white/50 hover:text-white flex items-center gap-1 font-normal lowercase tracking-normal no-underline"
                  >
                    Parent evidence: {parentDelegation.evidence_hash.slice(0, 6)}...{parentDelegation.evidence_hash.slice(-4)} <ExternalLink size={10} />
                  </a>
                )}
              </label>

              {uploadState === "IDLE" && (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-white/10 hover:border-white/20 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center gap-2"
                >
                  <Upload size={20} className="text-white/30" />
                  <p className="text-xs text-white/50">
                    Drop a file or <span className="text-blue-400">click to browse</span>
                  </p>
                  <p className="text-[10px] text-white/30">PDF, PNG, DOCX — any format (Max 10MB)</p>
                </div>
              )}

              {uploadState === "UPLOADING" && (
                <div className="border border-blue-500 bg-blue-500/5 rounded-xl p-6 text-center transition-all flex flex-col items-center gap-2">
                  <PrivPayLoader size="md" mode="default" className="text-blue-500" />
                  <p className="text-xs text-blue-500 font-semibold mt-2">Uploading to Walrus...</p>
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
                    className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 mt-1 font-bold"
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
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            >
              {submitting ? (
                <>
                  <PrivPayLoader size="xs" mode="compact" />
                  Awaiting Wallet Signature…
                </>
              ) : (
                "Sub-delegate Authority"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Object Preview */}
      <div className={success ? "w-full" : "lg:col-span-5"}>
        <ObjectPreview
          delegatorAddress={account.address || ""}
          delegateAddress={success ? success["delegate" as keyof SuccessResult] ?? delegateAddress : delegateAddress || ""}
          delegationType={parentDelegation.delegation_type}
          scopeLimit={Number(scopeLimit) || 0}
          expiryTimestamp={expiryDays ? Date.now() + Number(expiryDays) * 86_400_000 : 0}
          depth={parentDelegation.depth_remaining - 1}
          evidenceHash={blobId || ""}
          uploading={uploadState === "UPLOADING"}
          success={success}
        />
        {success && (
          <Link
            href="/app/delegations"
            className="mt-4 w-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold py-3 rounded-xl transition-colors no-underline"
          >
            Back to Delegations
          </Link>
        )}
      </div>
    </div>
  );
}
