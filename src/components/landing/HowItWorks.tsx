"use client";

import { FileSignature, ShieldCheck, CheckCircle2 } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Define & Upload",
    description: "Set delegate address, scope limit, expiry, and delegation type. Upload your evidence document — Proxy stores it on Walrus and binds the content hash to your object.",
    icon: FileSignature,
  },
  {
    number: "02",
    title: "Mint & Transfer",
    description: "Your Delegation Object is minted on Sui and owned by the delegate. Move begins enforcing every condition immediately on every action.",
    icon: ShieldCheck,
  },
  {
    number: "03",
    title: "Query & Compose",
    description: "Any protocol on Sui calls proxy::is_authorized() to verify in real time. Revoke in one transaction — every downstream protocol sees it instantly.",
    icon: CheckCircle2,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-32 px-6 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-20" data-aos="fade-up">

          <div className="badge mx-auto mb-5 border-accent/20 shadow-[0_0_15px_rgba(200,255,0,0.1)]">
            <span className="text-accent drop-shadow-[0_0_8px_rgba(200,255,0,0.5)]">Workflow</span>
            <span className="text-white/90">How It Works</span>
          </div>
          <h2 className="font-heading text-[clamp(2.5rem,5vw,4rem)] tracking-tight mb-6 text-white leading-tight">
            From setup to verification
            <br />
            <span className="text-white/40">in three automated steps.</span>
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {/* Connector Line for Desktop */}
          <div className="hidden lg:block absolute top-[52px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="relative group h-full"
                data-aos="fade-up"
                data-aos-delay={i * 100}
              >
                {/* Glowing Card */}
                <div className="h-full card p-8 border-white/5 bg-black/40 backdrop-blur-md hover:bg-black/60 hover:border-accent/30 transition-all duration-500 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(200,255,0,0.1)] flex flex-col items-center text-center">
                  
                  {/* Floating Number Badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black border border-white/10 px-3 py-1 rounded-full text-xs font-mono font-bold text-white/50 group-hover:text-accent group-hover:border-accent/40 transition-colors z-20 shadow-xl">
                    {step.number}
                  </div>

                  {/* Icon Container */}
                  <div className="w-16 h-16 rounded-2xl bg-black border border-white/10 flex items-center justify-center mb-6 group-hover:border-accent/50 group-hover:scale-110 transition-all duration-500 shadow-inner mt-4 relative z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/10 transition-colors duration-500" />
                    <Icon size={26} className="text-white/40 group-hover:text-accent transition-colors drop-shadow-[0_0_8px_rgba(200,255,0,0)] group-hover:drop-shadow-[0_0_8px_rgba(200,255,0,0.6)] relative z-10" />
                  </div>

                  {/* Content */}
                  <h3 className="font-heading text-xl tracking-tight mb-3 text-white group-hover:text-accent transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed font-medium">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
