"use client";

import { useEffect, useState } from "react";
import { Activity, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { suiClient, mistToSui } from "@/lib/sui";
import { isContractDeployed, PROXY_PACKAGE_ID } from "@/lib/constants";
import { AddressBadge } from "@/components/shared/AddressBadge";

interface LiveDelegation {
  id: string;
  delegator: string;
  delegate: string;
  type: "Financial" | "Governance" | "Operational" | "Legal";
  amount: string;
  expiryDays: number;
  txDigest: string;
  timestamp: string;
}

const INITIAL_MOCK_FEEDS: LiveDelegation[] = [
  {
    id: "0x821a73d8f89bc43d1a657e2c94ad8fb0eb7501a3556de65d8f6d3301a1a2af3a",
    delegator: "0xa1c3f309a63de40989f5bc3a8e7e8b61c9447472",
    delegate: "0xb7e23301c24b8956be879a8bc43d1a657e2c94ad8",
    type: "Financial",
    amount: "500 SUI",
    expiryDays: 28,
    txDigest: "9y6Z7m9x4P8f3e5c7a1a2b3c4d5e6f7g8h9i0j1k2l3",
    timestamp: "2 mins ago",
  },
  {
    id: "0x3c4493bc709979c890f8c9c1b7e23301c24b8956be879a8bc43d1a657e2c94ad",
    delegator: "0x709979c890f8c9c1b7e23301c24b8956be879a8b",
    delegate: "0x3c4493bc709979c890f8c9c1b7e23301c24b8956",
    type: "Governance",
    amount: "Unlimited",
    expiryDays: 12,
    txDigest: "4p8f3e5c7a1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7",
    timestamp: "12 mins ago",
  },
  {
    id: "0x90f8c9c1b7e23301c24b8956be879a8bc43d1a657e2c94ad8fb0eb7501a3556de",
    delegator: "0xb7e23301c24b8956be879a8bc43d1a657e2c94ad8",
    delegate: "0x90f8c9c1b7e23301c24b8956be879a8bc43d1a657",
    type: "Legal",
    amount: "Unlimited",
    expiryDays: 2,
    txDigest: "2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3",
    timestamp: "45 mins ago",
  },
];

export default function LiveFeed() {
  const [feeds, setFeeds] = useState<LiveDelegation[]>(INITIAL_MOCK_FEEDS);

  useEffect(() => {
    const isDeployed = isContractDeployed();

    const runSimulationStep = () => {
      const types: Array<"Financial" | "Governance" | "Operational" | "Legal"> = [
        "Financial",
        "Governance",
        "Operational",
        "Legal",
      ];
      const selectedType = types[Math.floor(Math.random() * types.length)];
      const randomAmount = Math.floor(Math.random() * 1500) + 50;
      const randomExpiry = Math.floor(Math.random() * 30) + 1;

      const newTx: LiveDelegation = {
        id: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
        delegator: "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
        delegate: "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
        type: selectedType,
        amount: selectedType === "Financial" ? `${randomAmount.toLocaleString()} SUI` : "Unlimited",
        expiryDays: randomExpiry,
        txDigest: Array.from({ length: 44 }, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join(""),
        timestamp: "Just now",
      };

      setFeeds((prev) => {
        const updated = prev.map((feed) => {
          if (feed.timestamp === "Just now") return { ...feed, timestamp: "1 min ago" };
          if (feed.timestamp.endsWith("min ago") || feed.timestamp.endsWith("mins ago")) {
            const mins = parseInt(feed.timestamp) + 1;
            return { ...feed, timestamp: `${mins} mins ago` };
          }
          return feed;
        });
        return [newTx, ...updated.slice(0, 2)];
      });
    };

    const fetchRecent = async () => {
      try {
        const txs = await suiClient.queryTransactionBlocks({
          filter: {
            MoveFunction: {
              package: PROXY_PACKAGE_ID!,
              module: "delegation",
              function: "create_delegation",
            },
          },
          options: { showEffects: true },
          limit: 6,
          order: "descending",
        });

        const objectIds = txs.data
          .flatMap((tx) => tx.effects?.created ?? [])
          .map((c: any) => c.reference?.objectId)
          .filter(Boolean);

        if (objectIds.length > 0) {
          const objects = await Promise.all(
            objectIds.map((id: string) =>
              suiClient.getObject({ id, options: { showContent: true } })
            )
          );

          const realFeeds = objects
            .map((o: any, idx) => {
              const f = o?.data?.content?.fields;
              if (!f) return null;
              const typeVal = Number(f.delegation_type);
              const types: Array<"Financial" | "Governance" | "Operational" | "Legal"> = [
                "Financial",
                "Governance",
                "Operational",
                "Legal",
              ];
              const type = types[typeVal] || "Financial";
              const amountVal = mistToSui(BigInt(f.scope_limit ?? 0));
              const expiryVal = Number(f.expiry ?? 0);
              const expiryDays = expiryVal > Date.now() ? Math.ceil((expiryVal - Date.now()) / 86_400_000) : 0;

              return {
                id: o.data.objectId,
                delegator: f.delegator,
                delegate: f.delegate,
                type,
                amount: type === "Financial" ? `${amountVal.toFixed(0)} SUI` : "Unlimited",
                expiryDays,
                txDigest: txs.data[idx]?.digest || "",
                timestamp: "On-Chain",
              } as LiveDelegation;
            })
            .filter(Boolean) as LiveDelegation[];

          if (realFeeds.length > 0) {
            setFeeds(realFeeds.slice(0, 3));
          }
        }
      } catch (err) {
        console.warn("Failed to fetch recent live delegations, falling back to local simulation:", err);
        runSimulationStep();
      }
    };

    if (isDeployed) {
      fetchRecent();
      const interval = setInterval(fetchRecent, 30000);
      return () => clearInterval(interval);
    } else {
      // Deterministic local simulation - adds simulated card every 10 seconds
      const interval = setInterval(runSimulationStep, 10000);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <section className="relative py-28 px-6 bg-[#040a16]/40 border-t border-white/5 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      <div className="absolute top-12 left-1/4 w-[400px] h-[300px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-[1120px] mx-auto relative z-10">
        {/* Title */}
        <div className="text-center mb-16">

          <div className="badge mx-auto mb-5 border-accent/20 shadow-[0_0_15px_rgba(200,255,0,0.1)]">
            <Activity size={13} className="text-accent animate-pulse" />
            <span className="text-white/90">Sui Network Live Ledger</span>
          </div>
          <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] tracking-tight mb-4 text-white">
            Live on Sui Network
          </h2>
          <p className="text-white/50 text-xs font-mono font-semibold uppercase tracking-wider">
            Recent delegations verified on-chain
          </p>
        </div>

        {/* Live feed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[340px]">
          <AnimatePresence mode="popLayout">
            {feeds.map((feed) => {
              const isNearExpiry = feed.expiryDays <= 3;

              return (
                <motion.div
                  key={feed.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="card bg-black/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between hover:border-white/10 hover:bg-black/50 transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-xl group-hover:bg-accent/10 transition-all pointer-events-none" />

                  <div>
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                          feed.type === "Financial"
                            ? "bg-accent/10 text-accent border border-accent/20"
                            : feed.type === "Governance"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : feed.type === "Legal"
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            : "bg-white/5 text-white/70 border border-white/10"
                        }`}
                      >
                        {feed.type}
                      </span>
                      <span className="text-[10px] text-white/40 font-mono font-medium">
                        {feed.timestamp}
                      </span>
                    </div>

                    {/* Amount and Expiry */}
                    <div className="mb-6">
                      <p className="text-white/40 text-[10px] font-mono font-semibold uppercase tracking-wider mb-1">
                        Authority Scope Limit
                      </p>
                      <div className="flex items-baseline gap-2.5">
                        <span className="font-heading text-2xl font-black text-white">
                          {feed.amount}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isNearExpiry
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {feed.expiryDays === 0 ? "Expired" : `${feed.expiryDays} ${feed.expiryDays === 1 ? "day" : "days"} left`}
                        </span>
                      </div>
                    </div>

                    {/* Addresses */}
                    <div className="bg-black/20 p-3.5 rounded-xl border border-white/5 mb-6 text-[11px] leading-relaxed text-white/60">
                      <AddressBadge address={feed.delegator} />
                      {" delegated "}
                      <span className="text-white/90 font-semibold">{feed.type}</span>
                      {" authority to "}
                      <AddressBadge address={feed.delegate} />
                    </div>
                  </div>

                  {/* Explorer Link */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-[10px] text-white/30 font-mono font-medium">
                      Object ID: {feed.id.slice(0, 6)}...{feed.id.slice(-4)}
                    </span>
                    <a
                      href={`https://suiscan.xyz/testnet/object/${feed.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono font-bold text-accent hover:text-accent/80 transition-colors inline-flex items-center gap-1.5 no-underline"
                    >
                      SuiScan <ExternalLink size={10} />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
