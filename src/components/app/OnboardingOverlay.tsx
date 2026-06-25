"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const slides = [
  {
    illustration: "/onboarding/slide-1.svg",
    title: "Seal authority on-chain.",
    subtitle:
      "Create programmable delegations with hard limits, expiry dates, and cryptographic evidence — enforced automatically by Move.",
  },
  {
    illustration: "/onboarding/slide-2.svg",
    title: "Evidence stored forever.",
    subtitle:
      "Every delegation links to a document stored permanently on Walrus. Content-verified, immutable, and tied to the on-chain object.",
  },
  {
    illustration: "/onboarding/slide-3.svg",
    title: "Verifiable by anyone.",
    subtitle:
      "Any protocol, person, or system can verify authority with a single function call or a shareable link. No intermediary required.",
  },
];

interface OnboardingOverlayProps {
  onComplete: () => void;
}

export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const isLastSlide = currentSlide === slides.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      handleComplete();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("proxy_onboarding_complete", "true");
    onComplete();
  };

  const slide = slides[currentSlide];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(4, 9, 20, 0.94)", backdropFilter: "blur(4px)" }}
    >
      {/* Card */}
      <div
        className="relative flex flex-col w-full max-w-[420px] mx-4 overflow-hidden"
        style={{
          background: "#0b1120",
          borderRadius: "16px",
          border: "1px solid #1e293b",
          boxShadow: "0 0 0 1px rgba(200,255,0,0.06), 0 32px 80px rgba(0,0,0,0.7)",
          minHeight: "540px",
        }}
      >
        {/* Skip button — top right, styled as a proper clickable chip */}
        <button
          onClick={handleComplete}
          className="absolute top-3.5 right-3.5 z-10 cursor-pointer transition-all"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "10px",
            letterSpacing: "0.08em",
            color: "#64748b",
            background: "#0f1e35",
            border: "1px solid #1e3a5f",
            borderRadius: "6px",
            padding: "4px 10px",
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#c8ff00";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#c8ff00";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(200,255,0,0.06)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e3a5f";
            (e.currentTarget as HTMLButtonElement).style.background = "#0f1e35";
          }}
        >
          SKIP
        </button>

        {/* Illustration area — dark to match SVG backgrounds */}
        <div
          className="flex items-center justify-center flex-shrink-0 relative"
          style={{
            height: "300px",
            background: "#070d1a",
            borderBottom: "1px solid #1e293b",
            overflow: "hidden",
          }}
        >
          {/* Subtle lime glow at bottom of illustration area */}
          <div
            style={{
              position: "absolute",
              bottom: -40,
              left: "50%",
              transform: "translateX(-50%)",
              width: 280,
              height: 80,
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(200,255,0,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Image
                src={slide.illustration}
                alt={slide.title}
                width={360}
                height={260}
                priority
                unoptimized
                style={{ display: "block", width: "100%", height: "auto" }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Content area */}
        <div
          className="flex flex-col items-center justify-center flex-1 px-8 py-6"
          style={{ background: "#0b1120" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full text-center"
            >
              <h2
                style={{
                  fontFamily: "var(--font-heading, 'Chillax', sans-serif)",
                  fontWeight: 700,
                  fontSize: "22px",
                  lineHeight: "1.25",
                  color: "#f1f5f9",
                  maxWidth: "290px",
                  margin: "0 auto",
                }}
              >
                {slide.title}
              </h2>

              <p
                style={{
                  fontFamily: "var(--font-body, 'Synonym', sans-serif)",
                  fontSize: "14px",
                  color: "#64748b",
                  lineHeight: "1.65",
                  maxWidth: "300px",
                  margin: "12px auto 0",
                }}
              >
                {slide.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Dot pagination */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className="cursor-pointer bg-transparent border-0 p-0 outline-none"
                aria-label={`Go to slide ${i + 1}`}
              >
                <div
                  style={{
                    width: i === currentSlide ? "24px" : "8px",
                    height: "8px",
                    borderRadius: "99px",
                    background: i === currentSlide ? "#c8ff00" : "transparent",
                    border: i === currentSlide ? "none" : "1.5px solid #334155",
                    transition: "width 250ms ease, background 250ms ease",
                  }}
                />
              </button>
            ))}
          </div>

          {/* Next / Get Started button */}
          <button
            onClick={handleNext}
            className="mt-5 w-full cursor-pointer border-0 outline-none transition-all hover:brightness-110 active:scale-[0.98]"
            style={{
              height: "52px",
              borderRadius: "10px",
              background: "#c8ff00",
              color: "#0a0a0a",
              fontFamily: "var(--font-heading, 'Chillax', sans-serif)",
              fontWeight: 700,
              fontSize: "15px",
              letterSpacing: "0.01em",
            }}
          >
            {isLastSlide ? "Get Started →" : "Next →"}
          </button>

          {/* Slide counter */}
          <p
            className="mt-3"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "10px",
              color: "#334155",
              letterSpacing: "0.08em",
            }}
          >
            {currentSlide + 1} / {slides.length}
          </p>
        </div>
      </div>
    </div>
  );
}
