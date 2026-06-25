"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4 pointer-events-none">
      <nav
        className={`pointer-events-auto transition-all duration-300 rounded-full border border-border/50 px-6 py-2.5 ${
          scrolled
            ? "bg-black/60 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-white/10"
            : "bg-black/20 backdrop-blur-md border-white/5"
        }`}
        style={{ width: "100%", maxWidth: "900px" }}
        data-aos="fade-down"
        data-aos-delay="100"
      >
        <div className="flex items-center justify-between w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
            <span className="font-heading text-lg text-white font-semibold tracking-tight uppercase">
              PROXY
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm font-medium text-white/80 hover:text-white transition-colors no-underline">
              How It Works
            </a>
            <a href="#features" className="text-sm font-medium text-white/80 hover:text-white transition-colors no-underline">
              Use Cases
            </a>
            <a href="#protocol" className="text-sm font-medium text-white/80 hover:text-white transition-colors no-underline">
              Protocol
            </a>
            <Link href="/explore" className="text-sm font-medium text-white/80 hover:text-white transition-colors no-underline">
              Explore
            </Link>
            <a href="#demo" className="text-sm font-medium text-white/80 hover:text-white transition-colors no-underline">
              Demo
            </a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/app"
              className="text-sm font-medium text-white/80 hover:text-white border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all no-underline px-4 py-2 rounded-full"
            >
              Connect Wallet
            </Link>
            <Link href="/app" className="btn-primary text-sm !py-2 !px-5 !rounded-full">
              Launch App
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden text-white bg-transparent border-none cursor-pointer p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden absolute top-[110%] left-0 right-0 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl animate-slide-down">
            <a href="#how-it-works" className="text-base font-medium text-white/90 hover:text-white transition-colors no-underline" onClick={() => setMobileOpen(false)}>
              How It Works
            </a>
            <a href="#features" className="text-base font-medium text-white/90 hover:text-white transition-colors no-underline" onClick={() => setMobileOpen(false)}>
              Use Cases
            </a>
            <a href="#protocol" className="text-base font-medium text-white/90 hover:text-white transition-colors no-underline" onClick={() => setMobileOpen(false)}>
              Protocol
            </a>
            <Link href="/explore" className="text-base font-medium text-white/90 hover:text-white transition-colors no-underline" onClick={() => setMobileOpen(false)}>
              Explore
            </Link>
            <a href="#demo" className="text-base font-medium text-white/90 hover:text-white transition-colors no-underline" onClick={() => setMobileOpen(false)}>
              Demo
            </a>
            <div className="divider my-2 border-white/10" />
            <Link href="/app" className="text-base font-medium text-white/90 hover:text-white border border-white/10 hover:border-white/30 hover:bg-white/5 transition-colors no-underline text-center py-2 rounded-full" onClick={() => setMobileOpen(false)}>
              Connect Wallet
            </Link>
            <Link href="/app" className="btn-primary text-sm text-center !rounded-full py-3" onClick={() => setMobileOpen(false)}>
              Launch App
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}
