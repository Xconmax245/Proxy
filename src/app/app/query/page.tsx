"use client";

import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import {
  Play,
  RotateCcw,
  Terminal as TerminalIcon,
  CheckCircle,
  XCircle,
  Code,
  Loader2,
  Wallet,
} from "lucide-react";
import { queryIsAuthorized, getDelegationObject, mistToSui, suiToMist } from "@/lib/sui";
import { isContractDeployed } from "@/lib/constants";
import { useProxyStore } from "@/lib/state";
import DeploymentGate from "@/components/shared/DeploymentGate";
import { motion } from "framer-motion";

interface LogLine {
  text: string;
  status: "info" | "success" | "error" | "loading";
}

const TYPE_NAMES = ["Financial", "Governance", "Operational", "Legal"] as const;

export default function QueryTerminalPage() {
  const account = useCurrentAccount();
  const { queryInput, setQueryInput } = useProxyStore();

  const [delegationId, setDelegationId] = useState(queryInput.delegationId);
  const [amount, setAmount] = useState(queryInput.amount);
  const [scopeLimit, setScopeLimit] = useState<number>(100);
  const [spent, setSpent] = useState<number>(0);
  
  const [isValidObject, setIsValidObject] = useState<boolean>(false);
  const [isLoadingObject, setIsLoadingObject] = useState<boolean>(false);
  const [objectError, setObjectError] = useState<string | null>(null);

  const [logs, setLogs] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ authorized: boolean; reason: string } | null>(null);

  const truncate = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const steps = [
    "✓  Fetching delegation state...",
    "✓  Building devInspect transaction...",
    "✓  Executing on Sui VM sandbox...",
    "✓  Parsing return value..."
  ];

  // Resolve delegation object dynamically when delegationId changes
  useEffect(() => {
    const resolveDelegation = async (id: string) => {
      const cleanId = id.trim();
      if (!cleanId || cleanId.length !== 66 || !cleanId.startsWith("0x")) {
        setIsValidObject(false);
        setObjectError(null);
        return;
      }
      setIsLoadingObject(true);
      setObjectError(null);
      try {
        const obj = await getDelegationObject(cleanId);
        const objectType = (obj as any)?.data?.type ?? (obj as any)?.data?.content?.type ?? "";
        const fields = (obj as any)?.data?.content?.fields;
        
        console.log('Object type:', (obj as any)?.data?.type);
        console.log('Content type:', (obj as any)?.data?.content?.type);
        
        const isValid = objectType.includes("DelegationObject");

        if (!isValid) {
          throw new Error(`Object found but is not a valid DelegationObject. Actual type: ${objectType}`);
        }
        
        if (fields) {
          const limit = mistToSui(BigInt(fields.scope_limit ?? 0));
          const s = mistToSui(BigInt(fields.spent ?? 0));
          setScopeLimit(limit);
          setSpent(s);
          setIsValidObject(true);
        }
      } catch (err: any) {
        setIsValidObject(false);
        setObjectError((err as Error).message || "Failed to resolve object");
      } finally {
        setIsLoadingObject(false);
      }
    };

    resolveDelegation(delegationId);
  }, [delegationId]);

  // Run authorization check reactively when delegationId, amount, or object validity changes
  useEffect(() => {
    let active = true;
    const cleanId = delegationId.trim();
    if (isValidObject && cleanId && account?.address) {
      const amt = suiToMist(amount);
      setRunning(true);
      queryIsAuthorized(cleanId, amt, account.address)
        .then((res) => {
          if (active) {
            setResult(res);
          }
        })
        .catch((err: any) => {
          if (active) {
            setResult({ authorized: false, reason: err.message || "Query failed" });
          }
        })
        .finally(() => {
          if (active) {
            setRunning(false);
          }
        });
    } else {
      setResult(null);
    }
    return () => {
      active = false;
    };
  }, [amount, delegationId, isValidObject, account?.address]);

  if (!isContractDeployed()) return <DeploymentGate />;
  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Wallet size={32} className="text-white/20" />
        <p className="text-white/50 text-sm">Connect your Sui wallet to run authorization queries.</p>
      </div>
    );
  }

  const handleDelegationIdChange = (val: string) => {
    setDelegationId(val);
    setQueryInput({ delegationId: val });
  };

  const handleAmountChange = (val: number) => {
    setAmount(val);
    setQueryInput({ amount: val });
  };

  const handleReset = () => {
    setLogs([]);
    setResult(null);
    setDelegationId("");
    setAmount(100);
    setScopeLimit(100);
    setSpent(0);
    setIsValidObject(false);
    setObjectError(null);
    setQueryInput({ delegationId: "", amount: 100 });
  };

  const maxSliderLimit = isValidObject ? Math.max(scopeLimit, 10) * 1.2 : 100;

  return (
    <div className="space-y-6">
      <div data-aos="fade-up" data-aos-duration="400">
        <p className="font-mono text-[10px] tracking-[0.18em] mb-2 text-accent/60 uppercase">
          Authorization
        </p>
        <h1 className="font-heading text-2xl font-bold text-white tracking-tight mb-1">
          Query Terminal
        </h1>
        <p className="text-white/40 text-sm">
          Real-time <code className="text-accent/80 font-mono text-xs">is_authorized()</code> queries via{" "}
          <code className="text-white/50 font-mono text-xs">devInspectTransactionBlock</code> — zero gas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form */}
        <div className="lg:col-span-6 space-y-5">
          <div data-aos="fade-up" data-aos-delay="100" data-aos-duration="500" className="bg-[#0a1628] border border-white/[0.06] p-6 rounded-2xl space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:border-white/[0.14] transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-white/40 uppercase tracking-wider block">
                Delegation Object ID
              </label>
              <input
                type="text"
                placeholder="0x…"
                value={delegationId}
                onChange={(e) => handleDelegationIdChange(e.target.value)}
                required
                className="w-full bg-[#050c18] border border-white/10 focus:border-accent rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-white/20 outline-none transition-all"
              />
              {isLoadingObject && (
                <p className="text-[10px] text-accent/50 animate-pulse font-mono mt-1">
                  Resolving delegation object...
                </p>
              )}
              {objectError && (
                <p className="text-[10px] text-rose-500 font-mono mt-1">
                  {objectError}
                </p>
              )}
              {isValidObject && !isLoadingObject && (
                <p className="text-[10px] text-accent font-mono mt-1">
                  ✓ Object resolved successfully
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono font-bold text-white/40 uppercase tracking-wider block">
                  Requested Amount (SUI)
                </label>
                {isValidObject && (
                  <span className="text-[10px] font-mono text-white/40">
                    Max: {scopeLimit.toFixed(2)} SUI (Spent: {spent.toFixed(2)})
                  </span>
                )}
              </div>
              <div className="flex gap-4 items-center">
                <input
                  type="range"
                  min="0"
                  max={maxSliderLimit}
                  step="0.1"
                  value={amount}
                  onChange={(e) => handleAmountChange(Number(e.target.value))}
                  className="flex-1 accent-accent h-1.5 bg-[#050c18] rounded-lg cursor-pointer"
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => handleAmountChange(Number(e.target.value))}
                  className="w-24 bg-[#050c18] border border-white/10 focus:border-accent rounded-xl px-3 py-2 text-xs font-mono text-white outline-none transition-all text-right"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <RotateCcw size={13} /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Terminal + result */}
        <div className="lg:col-span-6 space-y-5">
          <div data-aos="fade-up" data-aos-delay="200" data-aos-duration="500" className="bg-[#030712] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(200,255,0,0.06)] min-h-[380px] flex flex-col relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="px-4 py-2.5 bg-[#070e1b] border-b border-white/[0.06] flex items-center justify-between text-[9px] font-mono text-white/40 uppercase tracking-widest relative z-10">
              <div className="flex items-center gap-1.5">
                <TerminalIcon size={11} className="text-accent" />
                <span>is_authorized() VM Sandbox</span>
              </div>
              <span className="text-[9px] text-white/20">Testnet · No gas</span>
            </div>

            <div className="flex-1 p-5 font-mono text-xs leading-relaxed space-y-2 overflow-y-auto">
              {result ? (
                <div className="font-mono text-xs space-y-1">
                  <p className="text-white/40">PROXY AUTHORIZATION CHECK</p>
                  <p className="text-white/40">{'─'.repeat(40)}</p>
                  <p>Delegation: <span className="text-white">{truncate(delegationId)}</span></p>
                  <p>Requested:  <span className="text-white">{amount} SUI</span></p>
                  <p className="mt-3"></p>
                  
                  {steps.map((step, i) => (
                    <p key={i} className="text-white/60">
                      {step}
                    </p>
                  ))}

                  <div
                    className={`mt-4 text-base font-bold ${
                      result.authorized 
                        ? 'text-accent' 
                        : 'text-rose-500'
                    }`}
                  >
                    RESULT: {result.authorized ? 'AUTHORIZED' : 'NOT AUTHORIZED'}
                  </div>

                  {!result.authorized && (
                    <p className="text-rose-500 text-xs">
                      Reason: {result.reason}
                    </p>
                  )}

                  <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl text-[10px]">
                    <p className="text-white/40">{'// Any protocol on Sui can call:'}</p>
                    <p className="text-white">proxy::is_authorized(</p>
                    <p className="text-white/60 pl-4">delegation_id: {truncate(delegationId)},</p>
                    <p className="text-white/60 pl-4">amount: {suiToMist(Number(amount)).toString()}</p>
                    <p className="text-white">{`) → ${result.authorized}`}</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-white/20 text-center gap-2 select-none py-12">
                  <Code size={18} />
                  <p className="text-[10px]">Configure parameters and execute the query.</p>
                </div>
              )}
              {running && (
                <div className="flex items-center gap-2 text-accent/30 animate-pulse text-[9px] mt-2">
                  <span className="w-1 h-1 rounded-full bg-accent animate-ping" />
                  Executing…
                </div>
              )}
            </div>

            <div className="px-5 py-2.5 border-t border-white/5 bg-[#050c18] text-[9px] font-mono text-white/30 flex justify-between">
              <span>devInspectTransactionBlock</span>
              <span>Sui Testnet RPC</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
