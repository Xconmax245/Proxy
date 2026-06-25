"use client";

import Link from "next/link";

const footerLinks = {
  Protocol: [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Use Cases", href: "#features" },
    { label: "Protocol", href: "#protocol" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "GitHub", href: "https://github.com" },
  ],
  Sui: [
    { label: "Sui Network", href: "https://sui.io" },
    { label: "Walrus", href: "https://walrus.xyz" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-border mt-auto overflow-hidden bg-[#060608]">
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 pt-32 pb-16 flex flex-col items-center">
        
        {/* Giant Typographic Mask */}
        <div 
          className="w-full flex justify-center mb-24 select-none pointer-events-none" 
          data-aos="fade-up" 
          data-aos-duration="1500"
        >
          <h1 
            className="font-heading font-black text-center leading-[0.8] tracking-tighter m-0 lowercase"
            style={{ 
              fontSize: "clamp(6rem, 20vw, 18rem)",
              backgroundImage: "url('/HJvF85lakAAdEf4.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center 30%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "brightness(1.2) contrast(1.1)",
              opacity: 0.9,
            }}
          >
            proxy
          </h1>
        </div>

        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-12 mb-16 max-w-[1000px]">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1" data-aos="fade-up" data-aos-delay="100">
            <Link href="/" className="flex items-center gap-2.5 no-underline mb-5">
              <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
              <span className="font-heading text-lg text-white tracking-tight font-bold uppercase">
                PROXY
              </span>
            </Link>
            <p className="text-white/60 text-xs leading-relaxed max-w-[240px] font-medium">
              Programmable delegation infrastructure on Sui.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links], idx) => (
            <div key={category} data-aos="fade-up" data-aos-delay={200 + idx * 100}>
              <h4 className="text-xs text-white/40 uppercase tracking-widest mb-5 font-body font-bold">
                {category}
              </h4>
              <ul className="space-y-3 list-none p-0 m-0">
                {links.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.href}
                      className="text-sm text-white/70 hover:text-white hover:translate-x-1 inline-block transition-all no-underline font-medium"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div 
          className="w-full max-w-[1000px] flex items-center justify-between pt-8 border-t border-white/10"
          data-aos="fade-up" 
          data-aos-delay="500"
        >
          <p className="text-white/40 text-xs font-medium">
            Built for CLAY Hackathon · Sui Network · 2026
          </p>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white transition-colors no-underline"
              aria-label="GitHub"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white transition-colors no-underline"
              aria-label="X (Twitter)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
