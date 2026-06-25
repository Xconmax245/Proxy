"use client";

import { useState } from "react";
import {
  Vault,
  Vote,
  Scale,
  Ban,
  Timer,
  RotateCcw,
  Share2,
  Plus,
} from "lucide-react";

interface Rule {
  icon: React.ElementType;
  trigger: string;
  tier: string;
  condition: string;
  status: "locked" | "unlocked" | "conditional";
}

interface Template {
  id: string;
  icon: React.ElementType;
  name: string;
  description: string;
  badgeId: string;
  rules: Rule[];
}

const templates: Template[] = [
  {
    id: "financial",
    icon: Vault,
    name: "Financial",
    description: "For treasury management and spending authority",
    badgeId: "TYPE: FINANCIAL_01",
    rules: [
      { icon: Ban, trigger: "HARD LIMIT", tier: "Scope Ceiling", condition: "Cannot exceed authorized SUI amount", status: "locked" },
      { icon: Timer, trigger: "TIME TRIGGER", tier: "Auto-Expiry", condition: "Delegation invalid after epoch", status: "conditional" },
      { icon: RotateCcw, trigger: "INSTANT", tier: "Revocation", condition: "Single transaction, immediate effect", status: "unlocked" },
      { icon: Share2, trigger: "COMPOSABLE", tier: "Protocol Query", condition: "Any Sui contract can verify", status: "unlocked" },
    ],
  },
  {
    id: "governance",
    icon: Vote,
    name: "Governance",
    description: "For DAO voting rights and proposal execution",
    badgeId: "TYPE: GOVERNANCE_01",
    rules: [
      { icon: Ban, trigger: "VOTE WEIGHT", tier: "Proxy Power", condition: "Limited to specific proposal categories", status: "locked" },
      { icon: Timer, trigger: "TIME TRIGGER", tier: "Proposal Window", condition: "Expires when voting phase closes", status: "conditional" },
      { icon: RotateCcw, trigger: "INSTANT", tier: "Revocation", condition: "Single transaction, immediate effect", status: "unlocked" },
      { icon: Share2, trigger: "COMPOSABLE", tier: "DAO Registry", condition: "Voting contract verifies credentials", status: "unlocked" },
    ],
  },
  {
    id: "legal",
    icon: Scale,
    name: "Legal",
    description: "For power of attorney and legal mandates",
    badgeId: "TYPE: LEGAL_01",
    rules: [
      { icon: Ban, trigger: "MANDATE LIMIT", tier: "Signing Capacity", condition: "Restricted to specific document hashes", status: "locked" },
      { icon: Timer, trigger: "TIME TRIGGER", tier: "Epoch Expiry", condition: "Valid for defined calendar window", status: "conditional" },
      { icon: RotateCcw, trigger: "INSTANT", tier: "Revocation", condition: "Single transaction, immediate effect", status: "unlocked" },
      { icon: Share2, trigger: "COMPOSABLE", tier: "Walrus Query", condition: "Validates against raw legal deed hash", status: "unlocked" },
    ],
  },
];

export default function DelegationTypes() {
  const [activeTab, setActiveTab] = useState<string>("financial");

  const activeTemplate = templates.find((t) => t.id === activeTab) || templates[0];
  const IconActive = activeTemplate.icon;

  return (
    <section id="protocol" className="relative py-32 px-6 overflow-hidden">
      {/* Background divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-[1120px] mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-20" data-aos="fade-up">
          <div className="badge mx-auto mb-5 border-accent/20 shadow-[0_0_15px_rgba(200,255,0,0.1)]">
            <Scale size={13} className="text-accent" />
            <span className="text-white/90">Delegation Types</span>
          </div>
          <h2 className="font-heading text-[clamp(2.5rem,5vw,3.5rem)] tracking-tight mb-5 text-white leading-tight">
            Pre-built delegation types.
            <br />
            <span className="text-white/40">Custom authority rules.</span>
          </h2>
          <p className="text-white/50 text-sm max-w-[540px] mx-auto font-medium">
            Choose a delegation class. Proxy applies the right scope logic, evidence requirements, and composability rules automatically.
          </p>
        </div>

        {/* Interactive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.9fr] gap-8 items-stretch">
          
          {/* Left: Tab Selectors (Minimalist list - no left borders) */}
          <div className="flex flex-col gap-3.5" data-aos="fade-right">
            {templates.map((template) => {
              const TabIcon = template.icon;
              const isActive = template.id === activeTab;

              return (
                <button
                  key={template.id}
                  onClick={() => setActiveTab(template.id)}
                  className={`text-left p-6 rounded-2xl border transition-all duration-300 flex items-start gap-4 cursor-pointer bg-transparent ${
                    isActive
                      ? "border-white/15 bg-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                    style={{ 
                      background: isActive ? "var(--accent-muted)" : "rgba(255,255,255,0.04)", 
                      border: isActive ? "1.5px solid var(--accent-border)" : "1px solid rgba(255,255,255,0.05)" 
                    }}
                  >
                    <TabIcon size={18} className={isActive ? "text-accent" : "text-white/50"} />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-white tracking-tight mb-1">
                      {template.name}
                    </h3>
                    <p className="text-white/50 text-[11px] font-medium leading-relaxed max-w-[280px]">
                      {template.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Detailed Rule Visualization (Minimalist design using core design palette) */}
          <div className="relative" data-aos="fade-left">
            {/* Minimal Subdued Underglow using core accent */}
            <div className="absolute -inset-px rounded-2xl blur-xl opacity-15 bg-gradient-to-r from-accent to-transparent pointer-events-none" />
            
            <div className="relative h-full card p-8 border-white/10 bg-black/40 backdrop-blur-xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] flex flex-col justify-between">
              
              {/* Header */}
              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent-muted">
                      <IconActive size={15} className="text-accent" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm tracking-tight">{activeTemplate.name} Delegation Config</h4>
                      <p className="text-[10px] text-white/40 font-mono tracking-wider font-bold uppercase mt-0.5">DELEGATION ENGINE</p>
                    </div>
                  </div>
                  
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/60">
                    {activeTemplate.badgeId}
                  </span>
                </div>

                {/* Rules List */}
                <div className="space-y-4">
                  {activeTemplate.rules.map((rule, idx) => {
                    const RuleIcon = rule.icon;
                    return (
                      <div 
                        key={idx}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-black/30 border border-white/5 hover:border-white/10 transition-colors shadow-inner"
                      >
                        <div className="flex items-start gap-3.5 mb-3 sm:mb-0">
                          {/* Status Icon Indicator */}
                          <div className="mt-0.5 flex-shrink-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                              rule.status === "locked"
                                ? "bg-white/5 border-white/10 text-white/30"
                                : rule.status === "conditional"
                                ? "bg-warning/10 border-warning/20 text-warning"
                                : "bg-success/10 border-success/20 text-success"
                            }`}>
                              <RuleIcon size={12} />
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest">{rule.trigger}</p>
                            <h5 className="text-sm font-heading font-bold text-white/90 mt-0.5">{rule.tier}</h5>
                          </div>
                        </div>

                        <div className="text-left sm:text-right font-medium text-xs text-white/60 max-w-[240px] sm:ml-4 leading-normal">
                          {rule.condition}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Banner */}
              <div className="mt-8 pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-[11px] text-white/40 font-mono font-bold uppercase tracking-wider">
                  Enforced on-chain by Move contracts
                </span>
                <button className="btn-primary text-xs !py-2.5 !px-5 !rounded-lg flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-black font-semibold">
                  <Plus size={14} /> Use Template
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
