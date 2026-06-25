"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDisconnectWallet, useCurrentAccount } from "@mysten/dapp-kit";
import { 
  LayoutDashboard, 
  Plus, 
  Play, 
  ShieldCheck, 
  Terminal,
  LogOut,
  Layers,
  ArrowLeft,
  TrendingUp
} from "lucide-react";

import WalletButton from "@/components/shared/WalletButton";

const navItems = [
  { label: "Delegations", href: "/app/delegations", icon: LayoutDashboard },
  { label: "Create", href: "/app/create", icon: Plus },
  { label: "Execute", href: "/app/execute", icon: Play },
  { label: "DeFi Actions", href: "/app/defi", icon: TrendingUp },
  { label: "Verify", href: "/app/verify", icon: ShieldCheck },
  { label: "Query", href: "/app/query", icon: Terminal },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-white/5 bg-[#070e1b] flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-heading text-lg font-bold text-white tracking-wider uppercase">
            PROXY
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-1.5">
          {navItems.map((item, i) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                data-aos="fade-right"
                data-aos-delay={i * 50}
                data-aos-duration="400"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all no-underline ${
                  isActive
                    ? "bg-accent/15 text-accent border border-accent-border/30 shadow-[0_0_16px_rgba(200,255,0,0.06)]"
                    : "text-text-secondary hover:bg-white/[0.05] hover:text-white border border-transparent"
                }`}
              >
                <Icon size={18} className={isActive ? "text-accent" : "text-text-tertiary"} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Back to Home link */}
        <div className="pt-4 border-t border-white/5">
          <Link
            href="/"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-mono text-[#8a8a96] hover:text-white transition-colors duration-150 no-underline group"
          >
            <ArrowLeft 
              size={14} 
              className="transition-transform duration-150 ease-out group-hover:-translate-x-[2px]" 
            />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Bottom section */}
      <div data-aos="fade-up" data-aos-duration="500" data-aos-delay="300" className="p-4 border-t border-white/5 bg-[#050c18] space-y-3">
        <div className="bg-[#0a1628] rounded-xl p-4 border border-white/5">
          <p className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-1.5">Network Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
            <span className="text-xs font-mono font-bold text-white">Sui Testnet</span>
          </div>
        </div>

        <WalletButton variant="sidebar" />
      </div>
    </aside>
  );
}

