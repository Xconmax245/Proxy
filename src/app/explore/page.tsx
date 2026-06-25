"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getRecentDelegations } from "@/lib/sui";
import { DelegationObject } from "@/lib/state";
import PrivPayLoader from "@/components/shared/PrivPayLoader";
import { ShieldCheck, Search, Filter, ArrowRight } from "lucide-react";
import { AddressBadge } from "@/components/shared/AddressBadge";

const TYPE_NAMES = ["Financial", "Governance", "Operational", "Legal"];
const TYPE_COLORS = [
  "bg-accent/10 text-accent border-accent/20",
  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "bg-white/5 text-white/70 border-white/10",
  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
];

export default function ExplorePage() {
  const [delegations, setDelegations] = useState<DelegationObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<number | null>(null);

  useEffect(() => {
    fetchDelegations();
  }, []);

  const fetchDelegations = async () => {
    setLoading(true);
    const data = await getRecentDelegations(50);
    setDelegations(data);
    setLoading(false);
  };

  const filtered = activeFilter === null 
    ? delegations 
    : delegations.filter(d => d.delegation_type === activeFilter);

  return (
    <div className="min-h-screen bg-[#040814] text-white flex flex-col items-center p-6 md:p-12 relative overflow-hidden font-mono">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <div className="w-full max-w-[900px] flex justify-between items-center pb-4 border-b border-white/5 relative z-10">
        <Link
          href="/"
          className="font-heading text-lg font-bold tracking-widest text-white uppercase no-underline hover:text-accent transition-colors flex items-center gap-2"
        >
          PROXY
        </Link>
        <div className="text-[10px] tracking-widest text-white/40 uppercase">
          [ MODULE · 05 ] · PUBLIC REGISTRY
        </div>
      </div>

      <div className="w-full max-w-[900px] mt-12 space-y-8 relative z-10">
        <div className="text-center md:text-left space-y-2">
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-white uppercase">
            Delegation Directory
          </h1>
          <p className="text-sm text-white/50 leading-relaxed">
            Live feed of cryptographic authorities established on the Sui Testnet.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2 text-white/40 text-xs mr-2">
            <Filter size={14} /> Filter:
          </div>
          <button
            onClick={() => setActiveFilter(null)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
              activeFilter === null
                ? "bg-white text-black border-white"
                : "bg-transparent text-white/60 border-white/10 hover:border-white/30"
            }`}
          >
            All Types
          </button>
          {TYPE_NAMES.map((name, i) => (
            <button
              key={name}
              onClick={() => setActiveFilter(i)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                activeFilter === i
                  ? TYPE_COLORS[i].split(" ")[0] + " " + TYPE_COLORS[i].split(" ")[1] + " border-transparent"
                  : "bg-transparent text-white/60 border-white/10 hover:border-white/30"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Feed */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <PrivPayLoader size="lg" />
            <p className="text-white/40 text-[10px] font-mono tracking-widest uppercase animate-pulse">
              Syncing on-chain state...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center border border-white/5 rounded-2xl bg-[#0a1628]/50 flex flex-col items-center gap-3">
            <Search size={32} className="text-white/20" />
            <p className="text-white/40 text-sm">No delegations found for this criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((d) => (
              <div 
                key={d.id}
                className="bg-[#0a1628] border border-white/[0.06] p-5 rounded-2xl hover:border-white/[0.14] transition-all duration-300 group relative flex flex-col justify-between h-[200px]"
              >
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider border ${TYPE_COLORS[d.delegation_type] ?? TYPE_COLORS[2]}`}>
                      {TYPE_NAMES[d.delegation_type] ?? "Custom"}
                    </span>
                    <span className="text-[9px] text-white/30 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">
                      DEPTH: {d.depth_remaining}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/40">Delegator</span>
                      <AddressBadge address={d.delegator} className="!bg-black/20" context="card" />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/40">Delegate</span>
                      <AddressBadge address={d.delegate} className="!bg-black/20" context="card" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-auto border-t border-white/5 flex items-center justify-between">
                  <div className="text-[10px] text-white/40 flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-emerald-400/50" />
                    {d.status === 0 ? "Active" : d.status === 1 ? "Revoked" : "Expired"}
                  </div>
                  <Link
                    href={`/verify/${d.id}`}
                    className="flex items-center gap-1 text-[10px] font-bold text-white/70 hover:text-white transition-colors no-underline uppercase tracking-wider"
                  >
                    Verify Object <ArrowRight size={10} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center text-[9px] text-white/20 pt-8 mt-12 w-full max-w-[900px] border-t border-white/5 z-10">
        PROXY PROTOCOL © 2026 · LIVE ON SUI TESTNET
      </div>
    </div>
  );
}
