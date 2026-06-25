"use client";

import { useState, useEffect, useRef } from "react";
import { useCurrentAccount, useDisconnectWallet, ConnectModal } from "@mysten/dapp-kit";
import { useSuiNSName } from "@/hooks/useSuiNS";
import { getCurrentEpoch } from "@/lib/sui";
import { ChevronDown, Copy, ExternalLink, LogOut, Check } from "lucide-react";
import PrivPayLoader from "@/components/shared/PrivPayLoader";
import { motion, AnimatePresence } from "framer-motion";

interface WalletButtonProps {
  variant?: "sidebar" | "topbar";
}

export default function WalletButton({ variant = "topbar" }: WalletButtonProps) {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const { data: suinsName } = useSuiNSName(account?.address);
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [epoch, setEpoch] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchEpoch = async () => {
      try {
        const ep = await getCurrentEpoch();
        setEpoch(ep);
      } catch (err) {
        console.error("Failed to fetch epoch for wallet dropdown:", err);
      }
    };
    if (account) {
      fetchEpoch();
    }
  }, [account]);

  // Outside click handler to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [dropdownOpen]);

  const handleCopy = async () => {
    if (!account?.address) return;
    try {
      await navigator.clipboard.writeText(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy error:", err);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setDropdownOpen(false);
  };

  const truncateAddress = (addr: string) => {
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  };

  const displayName = suinsName || truncateAddress(account?.address || "");

  // Render disconnected state
  if (!account) {
    return (
      <ConnectModal
        trigger={
          <button
            onClick={() => setModalOpen(true)}
            className={`font-mono text-xs font-bold transition-all duration-350 cursor-pointer select-none outline-none text-center ${
              variant === "sidebar" 
                ? "w-full py-3 block bg-accent hover:bg-accent/90 text-black rounded-xl shadow-[0_0_15px_rgba(200,255,0,0.1)] hover:shadow-[0_0_25px_rgba(200,255,0,0.3)] hover:scale-[1.01]" 
                : "px-4 py-2 bg-transparent text-accent border border-accent/30 hover:border-accent hover:bg-accent/5 hover:shadow-[0_0_15px_rgba(200,255,0,0.2)] rounded-full"
            }`}
          >
            Connect Wallet
          </button>
        }
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    );
  }

  // Render connected state
  return (
    <div ref={containerRef} className="relative select-none font-mono">
      {variant === "sidebar" ? (
        // Sidebar connected display: full width card
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-between p-3.5 bg-[#0a1628]/40 border border-white/5 hover:border-white/15 rounded-xl transition-all text-left cursor-pointer outline-none"
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Green active dot */}
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-white font-semibold truncate leading-none mb-1">
                {suinsName || truncateAddress(account.address)}
              </p>
              <p className="text-[10px] text-white/40 leading-none">
                {truncateAddress(account.address)}
              </p>
            </div>
          </div>
          <ChevronDown size={14} className={`text-white/40 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>
      ) : (
        // Topbar connected display: pill shape
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#0a1628]/40 border border-white/5 hover:border-white/15 rounded-full transition-all text-xs cursor-pointer outline-none"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
          <span className="text-white font-semibold text-[11px]">{displayName}</span>
          <ChevronDown size={12} className={`text-white/40 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>
      )}

      {/* Dropdown panel */}
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: variant === "sidebar" ? -8 : 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: variant === "sidebar" ? -8 : 8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ originY: variant === "sidebar" ? 1 : 0 }}
            className={`absolute z-50 bg-[#070e1b] border border-white/10 p-4 rounded-lg shadow-2xl ${
              variant === "sidebar"
                ? "bottom-[calc(100%+8px)] left-0 right-0"
                : "top-[calc(100%+8px)] right-0 w-[280px]"
            }`}
          >
            {/* Display header */}
            <div className="space-y-1">
              <p className="text-xs text-white font-semibold truncate leading-tight">
                {suinsName || "Active Wallet"}
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-white/40 select-all truncate">
                  {account.address}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1 hover:bg-white/5 rounded text-white/50 hover:text-white transition-colors cursor-pointer border-0 bg-transparent"
                  title="Copy Raw Address"
                >
                  {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                </button>
              </div>
            </div>

            <div className="h-px bg-white/5 my-3" />

            {/* Network Info */}
            <div className="space-y-1.5 text-[10px] text-white/40">
              <div className="flex justify-between items-center">
                <span>Network</span>
                <span className="text-white font-semibold">Sui Testnet</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Epoch</span>
                <span className="text-white font-semibold">
                  {epoch !== null ? epoch : <PrivPayLoader size="xs" mode="compact" className="inline" />}
                </span>
              </div>
            </div>

            <div className="h-px bg-white/5 my-3" />

            {/* Action Links */}
            <div className="space-y-2">
              <a
                href={`https://suiscan.xyz/testnet/account/${account.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-[11px] text-[#8a8a96] hover:text-white transition-colors no-underline py-1.5"
              >
                <span>View on SuiScan</span>
                <ExternalLink size={11} />
              </a>

              <button
                onClick={handleDisconnect}
                className="w-full flex items-center justify-between text-[11px] text-rose-500/80 hover:text-rose-500 transition-colors py-1.5 cursor-pointer bg-transparent border-0 text-left p-0"
              >
                <span>Disconnect</span>
                <LogOut size={11} />
              </button>
            </div>

            <div className="h-px bg-white/5 my-3" />

            {/* DEV ONLY — remove before demo recording */}
            <button
              onClick={() => {
                localStorage.removeItem("proxy_onboarding_complete");
                window.location.reload();
              }}
              className="w-full text-left text-[10px] text-white/20 hover:text-white/40 transition-colors cursor-pointer bg-transparent border-0 p-0"
            >
              Reset Onboarding
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
