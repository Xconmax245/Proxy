"use client";

import { UserCheck, ArrowRightLeft, CheckCircle } from "lucide-react";

export default function DemoSection() {
  return (
    <section id="demo" className="relative py-32 px-6 overflow-hidden bg-black">
      {/* Background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-accent/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-[1120px] mx-auto relative z-10">
        
        {/* Scenic Hills Panel */}
        <div
          className="relative overflow-hidden rounded-3xl border border-white/10 p-12 sm:p-20 text-center shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
          style={{
            backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.85) 100%), url('/HJvF6IObAAEKAm6.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center 70%",
          }}
          data-aos="zoom-in"
          data-aos-delay="200"
        >
          <div className="relative z-10 flex flex-col items-center">
            
            {/* Title */}
            <h3 className="font-heading text-3xl sm:text-4xl text-white tracking-tight mb-4 font-bold leading-tight max-w-[600px]">
              The Future of On-Chain Authority is Verifiable.
            </h3>

            {/* Description */}
            <p className="text-white/80 font-medium text-sm sm:text-base leading-relaxed max-w-[760px] mb-12">
              Proxy turns delegation from a PDF in a folder into a programmable on-chain object. Scope is enforced by Move. Evidence is anchored by Walrus. Any protocol on Sui reads authorization status in real time — no intermediary, no ambiguity.
            </p>

            {/* Custom Ecosystems Icons */}
            <div className="flex flex-col sm:flex-row items-center gap-6 justify-center mb-6 w-full max-w-[700px]">
              <div className="flex flex-col items-center justify-center gap-3 bg-black/60 border border-white/10 rounded-2xl p-6 w-full sm:w-48 h-32 backdrop-blur-xl shadow-[0_0_15px_rgba(200,255,0,0.05)]">
                <UserCheck size={28} className="text-accent drop-shadow-[0_0_8px_rgba(200,255,0,0.3)]" />
                <span className="text-xs text-white/90 font-semibold">Delegator mints object</span>
              </div>
              
              <div className="flex flex-col items-center justify-center gap-3 bg-black/60 border border-white/10 rounded-2xl p-6 w-full sm:w-48 h-32 backdrop-blur-xl shadow-[0_0_15px_rgba(200,255,0,0.05)]">
                <ArrowRightLeft size={28} className="text-accent drop-shadow-[0_0_8px_rgba(200,255,0,0.3)]" />
                <span className="text-xs text-white/90 font-semibold">Move enforces scope</span>
              </div>
              
              <div className="flex flex-col items-center justify-center gap-3 bg-black/60 border border-white/10 rounded-2xl p-6 w-full sm:w-48 h-32 backdrop-blur-xl shadow-[0_0_15px_rgba(200,255,0,0.05)]">
                <CheckCircle size={28} className="text-accent drop-shadow-[0_0_8px_rgba(200,255,0,0.3)]" />
                <span className="text-xs text-white/90 font-semibold">Protocol verifies</span>
              </div>
            </div>

            <span className="text-[11px] font-mono font-bold text-accent uppercase tracking-wider mb-8 block">
              + COMPOSABLE AUTHORIZATION LAYER
            </span>

            {/* Status indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-[10px] text-white/60 font-mono font-bold tracking-wider uppercase bg-black/40 px-6 py-2.5 rounded-full border border-white/5">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> AUTHORITY ENFORCED ✓</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> EVIDENCE ANCHORED ✓</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> COMPOSABLE ON SUI ✓</span>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
