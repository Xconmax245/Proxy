"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="relative py-28 px-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-border-secondary to-transparent" />

      <div className="max-w-[700px] mx-auto text-center" data-aos="zoom-in" data-aos-duration="1000">
        <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] tracking-tight mb-5 text-white">
          Delegation is the most important primitive you can&apos;t verify.
        </h2>
        <p className="text-white/70 font-medium text-base leading-relaxed mb-10 max-w-[540px] mx-auto">
          Proxy changes that. Ship verifiable authority on Sui.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap" data-aos="fade-up" data-aos-delay="200">
          <Link href="/app" className="btn-primary text-base px-8 py-3.5 !rounded-full shadow-[0_0_20px_rgba(200,255,0,0.3)]">
            Launch App
            <ArrowRight size={16} />
          </Link>
          <a
            href="#"
            className="btn-secondary text-base px-8 py-3.5 !rounded-full text-white border-white/20 hover:bg-white/5"
          >
            Read the Docs
          </a>
        </div>
      </div>
    </section>
  );
}
