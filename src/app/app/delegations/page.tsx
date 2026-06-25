"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  LayoutGrid,
  GitBranch,
  RefreshCw,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Search,
} from "lucide-react";
import { getOwnedDelegations, suiClient, mistToSui, getSuiScanUrl } from "@/lib/sui";
import { isContractDeployed, PROXY_PACKAGE_ID } from "@/lib/constants";
import { DelegationObject } from "@/lib/state";
import DeploymentGate from "@/components/shared/DeploymentGate";
import DelegationCard from "@/components/app/DelegationCard";
import DelegationGraph from "@/components/app/DelegationGraph";
import { getWalrusScanUrl } from "@/lib/walrus";
import PrivPayLoader from "@/components/shared/PrivPayLoader";

const TYPE_NAMES = ["Financial", "Governance", "Operational", "Legal"] as const;

function parseDelegationFields(obj: any): DelegationObject | null {
  try {
    const data = obj?.data || obj;
    const content = data?.content;
    if (!content || content.dataType !== "moveObject") return null;
    if (!content.type?.includes("DelegationObject")) return null;
    const f = content.fields as Record<string, any>;
    if (!f) return null;
    return {
      id: data.objectId || obj.id || "",
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

/** Skeleton card for loading state */
function SkeletonCard() {
  return (
    <div className="bg-[#0a1628] border border-white/5 p-6 rounded-2xl animate-pulse space-y-4">
      <div className="flex justify-between">
        <div className="h-5 w-24 bg-white/5 rounded-lg" />
        <div className="h-5 w-16 bg-white/5 rounded-lg" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-white/5 rounded" />
        <div className="h-3 w-3/4 bg-white/5 rounded" />
        <div className="h-3 w-1/2 bg-white/5 rounded" />
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full" />
      <div className="h-8 w-full bg-white/5 rounded-xl" />
    </div>
  );
}

export default function DelegationsDashboard() {
  const account = useCurrentAccount();
  const [view, setView] = useState<"cards" | "graph">("cards");

  // — Deployment gate —
  if (!isContractDeployed()) return <DeploymentGate />;

  // — Wallet gate —
  if (!account) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center"
        data-aos="fade-up"
        suppressHydrationWarning
      >
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-2">
          <Wallet size={28} className="text-white/20" />
        </div>
        <p className="text-white/50 text-sm font-sans">Connect your Sui wallet to view your delegations.</p>
      </div>
    );
  }

  return <DelegationsDashboardInner address={account.address} view={view} setView={setView} />;
}

function DelegationsDashboardInner({
  address,
  view,
  setView,
}: {
  address: string;
  view: "cards" | "graph";
  setView: (v: "cards" | "graph") => void;
}) {
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  // Owned delegations (where I am the delegator / I Delegate)
  const {
    data: ownedRaw,
    isLoading: ownedLoading,
    error: ownedError,
    refetch,
  } = useQuery({
    queryKey: ["owned-delegations", address, PROXY_PACKAGE_ID],
    queryFn: async () => {
      if (!PROXY_PACKAGE_ID) return [];
      const createdByMe = await suiClient.queryTransactionBlocks({
        filter: {
          MoveFunction: {
            package: PROXY_PACKAGE_ID!,
            module: "delegation",
            function: "create_delegation",
          },
        },
        options: {
          showEffects: true,
          showInput: true,
          showObjectChanges: true,
        },
        limit: 50,
        order: "descending",
      });

      const myCreatedTxs = createdByMe.data.filter(
        (tx) => tx.transaction?.data?.sender === address
      );

      const createdObjectIds = myCreatedTxs.flatMap(
        (tx) =>
          tx.objectChanges
            ?.filter(
              (change) =>
                change.type === "created" &&
                change.objectType?.includes("DelegationObject")
            )
            .map((change: any) => change.objectId) ?? []
      );

      if (!createdObjectIds.length) return [];

      const objects = await Promise.all(
        createdObjectIds.map((id) =>
          suiClient.getObject({
            id,
            options: { showContent: true, showOwner: true },
          })
        )
      );

      return objects;
    },
    enabled: !!address,
  });

  // Incoming delegations (where I am the delegate / Delegated to Me)
  const { data: incomingRaw, isLoading: incomingLoading } = useQuery({
    queryKey: ["incoming-delegations", address, PROXY_PACKAGE_ID],
    queryFn: async () => {
      if (!PROXY_PACKAGE_ID) return [];
      const delegatedToMe = await suiClient.getOwnedObjects({
        owner: address,
        filter: { StructType: `${PROXY_PACKAGE_ID}::delegation::DelegationObject` },
        options: { showContent: true },
      });
      return delegatedToMe.data;
    },
    enabled: !!address,
  });

  const ownedDelegations: DelegationObject[] = (ownedRaw ?? [])
    .map(parseDelegationFields)
    .filter(Boolean) as DelegationObject[];

  const incomingDelegations: DelegationObject[] = (incomingRaw ?? [])
    .map(parseDelegationFields)
    .filter(Boolean) as DelegationObject[];

  const allDelegations = [...ownedDelegations, ...incomingDelegations];
  const activeDelegations = allDelegations.filter((d) => d.status === 0);
  const totalBudget = ownedDelegations.reduce((s, d) => s + d.scope_limit, 0);
  const totalSpent = ownedDelegations.reduce((s, d) => s + d.spent, 0);

  const isLoading = ownedLoading || incomingLoading;

  const hasExpiringSoon = activeDelegations.some((d) => {
    if (d.status !== 0 || d.expiry === 0) return false;
    const timeLeft = d.expiry - Date.now();
    return timeLeft > 0 && timeLeft < 259200000; // less than 72 hours
  });

  const filterDelegation = (d: DelegationObject) => {
    if (selectedType !== "ALL") {
      const typeIndex = TYPE_NAMES.indexOf(selectedType as any);
      if (d.delegation_type !== typeIndex) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        d.id.toLowerCase().includes(q) ||
        d.delegator.toLowerCase().includes(q) ||
        d.delegate.toLowerCase().includes(q)
      );
    }
    return true;
  };

  const filteredOwned = ownedDelegations.filter(filterDelegation);
  const filteredIncoming = incomingDelegations.filter(filterDelegation);
  const hasResults = filteredOwned.length > 0 || filteredIncoming.length > 0;

  const statItems = [
    { label: "Active", value: activeDelegations.length, icon: CheckCircle, color: "text-accent", glow: "rgba(200,255,0,0.08)" },
    { label: "Total Objects", value: allDelegations.length, icon: LayoutGrid, color: "text-blue-400", glow: "rgba(59,130,246,0.06)" },
    { label: "Total Budget", value: `${mistToSui(BigInt(totalBudget)).toFixed(0)} SUI`, icon: TrendingUp, color: "text-purple-400", glow: "rgba(168,85,247,0.06)" },
    { label: "Total Spent", value: `${mistToSui(BigInt(totalSpent)).toFixed(0)} SUI`, icon: Clock, color: "text-amber-400", glow: "rgba(251,191,36,0.06)" },
  ];

  return (
    <div className="space-y-8">

      {/* Expiry Warning Banner */}
      {hasExpiringSoon && !bannerDismissed && (
        <div
          data-aos="slide-down"
          data-aos-duration="400"
          className="flex items-start justify-between bg-amber-500/10 border border-amber-500/20 border-l-4 border-l-amber-500 rounded-r-xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-500 w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-mono text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-0.5">
                Delegation Expiration Warning
              </div>
              <p className="text-white/80 text-xs font-sans">
                One or more active delegations will expire in less than 72 hours. Please review delegation validity.
              </p>
            </div>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-white/40 hover:text-white transition-colors cursor-pointer p-0 bg-transparent border-0 outline-none ml-4 flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div
        data-aos="fade-up"
        data-aos-duration="500"
        className="flex items-start justify-between"
      >
        <div>
          <p className="font-mono text-[10px] tracking-[0.18em] mb-2 text-accent/60 uppercase">
            Delegation Ledger
          </p>
          <h1 className="font-heading text-2xl font-bold text-white tracking-tight mb-1">
            Authority Overview
          </h1>
          <p className="text-white/40 text-sm">
            On-chain authority objects owned or held by your wallet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] hover:border-accent/30 transition-all text-white/40 hover:text-accent"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <div className="flex bg-[#0a1628] border border-white/[0.07] rounded-xl p-1 gap-1">
            {(["cards", "graph"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  view === v
                    ? "bg-accent text-black shadow-[0_0_12px_rgba(200,255,0,0.25)]"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                {v === "cards" ? <LayoutGrid size={12} /> : <GitBranch size={12} />}
                {v === "cards" ? "Ledger" : "Graph"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map(({ label, value, icon: Icon, color, glow }, i) => (
          <div
            key={label}
            data-aos="fade-up"
            data-aos-delay={i * 60}
            data-aos-duration="500"
            className="group relative bg-[#0a1628] border border-white/[0.06] rounded-2xl p-5 overflow-hidden hover:border-white/[0.12] transition-all duration-300 cursor-default"
            style={{ boxShadow: `inset 0 0 30px ${glow}` }}
          >
            {/* Corner glow on hover */}
            <div
              className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, transform: "translate(30%, -30%)" }}
            />
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.04] ${color}`}>
                <Icon size={13} />
              </div>
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-2xl font-bold text-white font-heading mt-1">
              {isLoading ? (
                <PrivPayLoader size="sm" mode="compact" />
              ) : value}
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {ownedError && (
        <div
          data-aos="fade-in"
          className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-400 font-mono"
        >
          RPC Error: {(ownedError as Error).message}
        </div>
      )}

      {/* Search and Filters Bar */}
      <div
        data-aos="fade-up"
        data-aos-duration="500"
        data-aos-delay="100"
        className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#0a1628]/60 border border-white/[0.06] p-4 rounded-2xl backdrop-blur-sm"
      >
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by ID or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/[0.06] focus:border-accent/40 focus:shadow-[0_0_0_3px_rgba(200,255,0,0.05)] rounded-xl text-xs text-white placeholder-white/20 outline-none transition-all font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white text-xs cursor-pointer bg-transparent border-0"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 self-start md:self-auto">
          {["ALL", "Financial", "Governance", "Operational", "Legal"].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase border transition-all cursor-pointer ${
                selectedType === t
                  ? "bg-accent/10 border-accent/30 text-accent shadow-[0_0_12px_rgba(200,255,0,0.1)]"
                  : "bg-transparent border-white/[0.06] text-white/40 hover:text-white hover:border-white/[0.15]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {view === "graph" ? (
        <div data-aos="fade-in" data-aos-duration="400">
          <DelegationGraph delegations={[...filteredOwned, ...filteredIncoming]} connectedAddress={address} />
        </div>
      ) : (
        <>
          {/* Owned Delegations */}
          {(isLoading || filteredOwned.length > 0) && (
            <section className="space-y-4">
              <div
                data-aos="fade-right"
                data-aos-duration="400"
                className="flex items-center gap-3"
              >
                <span className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-wider">
                  Delegations You Granted
                </span>
                <div className="flex-1 h-px bg-white/[0.05]" />
                {!isLoading && (
                  <span className="text-[10px] font-mono text-white/20">{filteredOwned.length}</span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 py-16 flex items-center justify-center">
                    <PrivPayLoader size="lg" />
                  </div>
                ) : filteredOwned.map((d, i) => (
                      <div
                        key={d.id}
                        data-aos="fade-up"
                        data-aos-delay={i * 70}
                        data-aos-duration="500"
                      >
                        <DelegationCard delegation={d} onRefetch={() => refetch()} />
                      </div>
                    ))}
              </div>
            </section>
          )}

          {/* Incoming Delegations */}
          {(isLoading || filteredIncoming.length > 0) && (
            <section className="space-y-4">
              <div
                data-aos="fade-right"
                data-aos-duration="400"
                className="flex items-center gap-3"
              >
                <span className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-wider">
                  Authority Delegated To You
                </span>
                <div className="flex-1 h-px bg-white/[0.05]" />
                {!isLoading && (
                  <span className="text-[10px] font-mono text-white/20">{filteredIncoming.length}</span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 py-16 flex items-center justify-center">
                    <PrivPayLoader size="lg" />
                  </div>
                ) : filteredIncoming.map((d, i) => (
                      <div
                        key={d.id}
                        data-aos="fade-up"
                        data-aos-delay={i * 70}
                        data-aos-duration="500"
                      >
                        <DelegationCard delegation={d} onRefetch={() => refetch()} />
                      </div>
                    ))}
              </div>
            </section>
          )}

          {/* Filter Empty State */}
          {!isLoading && !hasResults && (searchQuery.trim() !== "" || selectedType !== "ALL") && (
            <div
              data-aos="fade-in"
              className="text-center py-24 bg-[#0a1628]/20 border border-dashed border-white/[0.06] rounded-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto mb-4">
                <Search size={20} className="text-white/15" />
              </div>
              <p className="text-sm font-semibold text-white/40">No delegations match your search</p>
              <p className="text-xs text-white/20 mt-1">Try clearing your filter or searching a different address.</p>
            </div>
          )}

          {/* Empty Ledger State */}
          {!isLoading && allDelegations.length === 0 && (
            <div
              data-aos="fade-in"
              className="text-center py-24 bg-[#0a1628]/30 border border-dashed border-white/[0.06] rounded-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto mb-4">
                <LayoutGrid size={20} className="text-white/15" />
              </div>
              <p className="text-sm font-semibold text-white/40">No delegation objects found</p>
              <p className="text-xs text-white/20 mt-1">Create your first delegation to get started.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
