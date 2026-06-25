"use client";

import Link from "next/link";
import { ArrowRight, Shield, LayoutGrid, TrendingUp, Clock, CheckCircle, Calendar, ShieldCheck, Download, Ban } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/HJvF6IObAAEKAm6.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Dark overlay on top of the BG image */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[rgba(6,6,8,0.55)] via-[rgba(6,6,8,0.45)] to-[rgba(6,6,8,0.95)]" />

      {/* Content */}
      <div className="relative z-10 max-w-[900px] mx-auto px-6 text-center pt-32 pb-20">


        {/* Badge */}
        <div data-aos="fade-up" data-aos-delay="100">
          <div className="badge mx-auto mb-8 shadow-[0_0_15px_rgba(200,255,0,0.15)] border-accent/20">
            <Shield size={13} className="text-accent" />
            <span className="text-white/90">Built on Sui Network</span>
          </div>
        </div>

        {/* Headline */}
        <h1 
          className="font-heading text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] tracking-tight mb-6 text-white"
          data-aos="fade-up" 
          data-aos-delay="200"
        >
          Programmable
          <br />
          delegation
          <br />
          for{" "}
          <span className="gradient-text drop-shadow-[0_0_30px_rgba(200,255,0,0.3)]">verified authority.</span>
        </h1>

        {/* Subtitle */}
        <p 
          className="text-white/80 font-medium text-[clamp(1.1rem,2vw,1.25rem)] leading-relaxed max-w-[660px] mx-auto mb-10"
          data-aos="fade-up" 
          data-aos-delay="300"
        >
          Grant, constrain, and revoke authority on-chain. Every delegation is a Sui Object — enforced by Move, evidenced by Walrus, readable by any protocol.
        </p>

        {/* CTAs */}
        <div 
          className="flex items-center justify-center gap-4 flex-wrap"
          data-aos="fade-up" 
          data-aos-delay="400"
        >
          <Link href="/app" className="btn-primary text-base px-8 py-3.5 !rounded-full shadow-[0_0_20px_rgba(200,255,0,0.3)]">
            Launch App
            <ArrowRight size={18} />
          </Link>
          <a href="#how-it-works" className="btn-secondary text-base px-8 py-3.5 !rounded-full text-white border-white/20 hover:bg-white/5">
            See how it works
          </a>
        </div>

        {/* Trust line */}
        <p 
          className="text-white/50 font-medium text-sm mt-10 tracking-wide uppercase"
          data-aos="fade-in" 
          data-aos-delay="500"
        >
          On-chain objects • Move-enforced constraints • Walrus-anchored evidence
        </p>
      </div>

      {/* Dashboard Preview — floating card */}
      <div 
        className="relative z-10 max-w-[1000px] w-full mx-auto px-6 pb-20 animate-float" 
        data-aos="fade-up" 
        data-aos-delay="700"
      >
        {/* Glow behind the dashboard */}
        <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 to-transparent rounded-2xl blur-2xl opacity-50 z-0 pointer-events-none" />

        <div className="relative z-10 card p-1.5 rounded-2xl overflow-hidden backdrop-blur-xl bg-black/50 border-white/10" style={{ boxShadow: "0 30px 100px rgba(0,0,0,0.7), 0 0 50px rgba(200,255,0,0.08)" }}>
          <div className="rounded-xl overflow-hidden bg-bg-card/95">
            {/* Mock Dashboard Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-black/60">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                <span className="ml-4 font-mono text-[11px] text-white/40 tracking-wider font-medium">
                  proxy.authority/app
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded">
                  <span className="status-dot active animate-pulse-accent" />
                  Live testnet
                </span>
              </div>
            </div>

            {/* Mock Dashboard Body */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="font-heading text-xl font-bold mb-1 text-white tracking-tight">Delegation Overview</h3>
                  <p className="text-white/50 text-xs font-medium">Track authority states and programmable delegation constraints</p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Active", value: "14", icon: CheckCircle, color: "text-accent" },
                  { label: "Total Objects", value: "18", icon: LayoutGrid, color: "text-white/60" },
                  { label: "Total Budget", value: "8,500 SUI", icon: TrendingUp, color: "text-white/60" },
                  { label: "Total Spent", value: "1,240 SUI", icon: Clock, color: "text-white/60" },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-[#0a1628] border border-white/5 rounded-2xl p-4 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={12} className={stat.color} />
                        <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">{stat.label}</span>
                      </div>
                      <div className="text-xl font-bold text-white font-heading">{stat.value}</div>
                    </div>
                  );
                })}
              </div>

              {/* Recent Delegations Header */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-sm font-bold text-white/95">Recent Delegations</span>
                <span className="text-xs text-accent hover:text-accent-hover font-semibold transition-colors cursor-pointer flex items-center gap-1">
                  View All <ArrowRight size={12} />
                </span>
              </div>

              {/* Delegation Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card 1: Financial */}
                <div className="bg-[#0a1628] border border-white/5 p-6 rounded-2xl flex flex-col justify-between hover:border-white/10 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.3)] group relative overflow-hidden text-left">
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border bg-accent/10 text-accent border-accent/20">
                            Financial
                          </span>
                          <span className="text-[10px] font-mono text-white/30">Depth: 2</span>
                        </div>
                        <span className="text-[10px] font-mono text-accent hover:underline cursor-pointer">
                          0x821a73d8...af3a
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                            <circle cx="16" cy="16" r="12" className="stroke-white/5 fill-none" strokeWidth="2.5" />
                            <circle cx="16" cy="16" r="12" className="fill-none stroke-[#22c55e]" strokeWidth="2.5" strokeDasharray="75.39" strokeDashoffset="6.03" strokeLinecap="round" />
                          </svg>
                          <span className="absolute text-[8px] font-mono font-bold text-white/90">92%</span>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20">
                          Active
                        </span>
                      </div>
                    </div>

                    {/* Addresses */}
                    <div className="space-y-2.5 bg-[#050c18] p-4 rounded-xl border border-white/5 mb-5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40 font-mono">Delegator:</span>
                        <span className="bg-black/20 text-white/90 font-mono px-2 py-0.5 rounded text-[11px]">0xa1c3...7472</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40 font-mono">Delegate:</span>
                        <span className="bg-black/20 text-white/90 font-mono px-2 py-0.5 rounded text-[11px]">0xb7e2...4ad8</span>
                      </div>
                    </div>

                    {/* ScopeBar */}
                    <div className="space-y-2 mb-5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white/40">Limit Scope:</span>
                        <span className="text-white">150.00 / 500.00 SUI</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#050c18] rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-accent rounded-full" style={{ width: "30%" }} />
                      </div>
                    </div>

                    {/* Expiry */}
                    <div className="flex items-center justify-between text-xs mb-5 font-mono">
                      <div className="flex items-center gap-1.5 text-white/40">
                        <Calendar size={12} />
                        <span>Expiry:</span>
                      </div>
                      <span className="text-white/80">Jul 15, 2026</span>
                    </div>

                    {/* Evidence */}
                    <div className="flex items-center justify-between text-xs mb-5 font-mono pt-3 border-t border-white/5">
                      <span className="text-white/40">Evidence:</span>
                      <span className="text-accent hover:underline cursor-pointer">Walrus Blob ↗</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                    <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-semibold transition-all cursor-pointer">
                      <Download size={12} /> Certificate
                    </button>
                    <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer">
                      <Ban size={12} /> Revoke
                    </button>
                  </div>
                </div>

                {/* Card 2: Governance */}
                <div className="bg-[#0a1628] border border-white/5 p-6 rounded-2xl flex flex-col justify-between hover:border-white/10 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.3)] group relative overflow-hidden text-left">
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border bg-blue-500/10 text-blue-400 border-blue-500/20">
                            Governance
                          </span>
                          <span className="text-[10px] font-mono text-white/30">Depth: 1</span>
                        </div>
                        <span className="text-[10px] font-mono text-accent hover:underline cursor-pointer">
                          0x3c4493bc...94ad
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                            <circle cx="16" cy="16" r="12" className="stroke-white/5 fill-none" strokeWidth="2.5" />
                            <circle cx="16" cy="16" r="12" className="fill-none stroke-[#f59e0b]" strokeWidth="2.5" strokeDasharray="75.39" strokeDashoffset="18.85" strokeLinecap="round" />
                          </svg>
                          <span className="absolute text-[8px] font-mono font-bold text-white/90">75%</span>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20">
                          Active
                        </span>
                      </div>
                    </div>

                    {/* Addresses */}
                    <div className="space-y-2.5 bg-[#050c18] p-4 rounded-xl border border-white/5 mb-5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40 font-mono">Delegator:</span>
                        <span className="bg-black/20 text-white/90 font-mono px-2 py-0.5 rounded text-[11px]">0x7099...79c8</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40 font-mono">Delegate:</span>
                        <span className="bg-black/20 text-white/90 font-mono px-2 py-0.5 rounded text-[11px]">0x3c44...93bc</span>
                      </div>
                    </div>

                    {/* Access Scope */}
                    <div className="mb-5 p-3.5 bg-white/2 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                      <span className="text-white/40 font-mono">Access Scope:</span>
                      <span className="text-white font-semibold font-mono">Unlimited Execution</span>
                    </div>

                    {/* Expiry */}
                    <div className="flex items-center justify-between text-xs mb-5 font-mono">
                      <div className="flex items-center gap-1.5 text-white/40">
                        <Calendar size={12} />
                        <span>Expiry:</span>
                      </div>
                      <span className="text-white/80">Jun 22, 2026</span>
                    </div>

                    {/* Evidence */}
                    <div className="flex items-center justify-between text-xs mb-5 font-mono pt-3 border-t border-white/5">
                      <span className="text-white/40">Evidence:</span>
                      <span className="text-accent hover:underline cursor-pointer">Walrus Blob ↗</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                    <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-semibold transition-all cursor-pointer">
                      <Download size={12} /> Certificate
                    </button>
                    <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer">
                      <Ban size={12} /> Revoke
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

