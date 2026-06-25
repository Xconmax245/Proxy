"use client";

import {
  ShieldCheck,
  Timer,
  FileCheck,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Scope-Enforced Authority",
    description:
      "Every delegation has a hard limit. A delegate authorized for 500 SUI cannot spend 501. Move enforces it — no manual approval, no override.",
  },
  {
    icon: Timer,
    title: "Time-Locked Expiry",
    description:
      "Delegations expire automatically at the epoch you set. No cleanup required. No stale permissions lingering after a relationship ends.",
  },
  {
    icon: FileCheck,
    title: "Walrus-Anchored Evidence",
    description:
      "Every delegation links to its supporting document stored permanently on Walrus. The hash lives on-chain. The evidence cannot be deleted or altered.",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-28 px-6">
      <div className="max-w-[1120px] mx-auto">
        {/* Section header */}
        <div className="text-center mb-16" data-aos="fade-up">
          <div className="badge mx-auto mb-5 border-accent/20">
            <Zap size={13} className="text-accent" />
            <span className="text-white/90">Core Features</span>
          </div>
          <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] tracking-tight mb-4 text-white">
            Authority that&apos;s not a document.
            <br />
            <span className="text-white/50">It&apos;s a protocol.</span>
          </h2>
          <p className="text-white/70 font-medium max-w-[620px] mx-auto text-sm leading-relaxed">
            Proxy doesn&apos;t just record who delegated what. It makes delegation programmable — so scope, expiry, and conditions are enforced automatically, with no intermediary.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="card p-7 group cursor-default border-white/5 bg-black/20 hover:bg-black/40 hover:border-white/10"
                data-aos="fade-up"
                data-aos-delay={i * 100}
              >
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors border border-accent/20 group-hover:border-accent/40">
                  <Icon size={20} className="text-accent drop-shadow-[0_0_8px_rgba(200,255,0,0.5)]" />
                </div>
                <h3 className="font-heading text-base tracking-tight mb-2.5 text-white">
                  {feature.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
