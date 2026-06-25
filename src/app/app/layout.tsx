"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/app/Sidebar";
import Topbar from "@/components/app/Topbar";
import { OnboardingOverlay } from "@/components/app/OnboardingOverlay";
import AosInit from "@/components/AosInit";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem("proxy_onboarding_complete");
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  return (
    <>
      {/* Onboarding overlay — mounts on top of the dashboard */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ position: "fixed", inset: 0, zIndex: 50 }}
          >
            <OnboardingOverlay onComplete={() => setShowOnboarding(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* App shell — always mounted behind the overlay */}
      <AosInit />
      <div className="min-h-screen bg-[#050c18] text-white flex">
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col min-h-screen">
          <Topbar />
          <main className="flex-1 p-8 overflow-auto bg-[#040914] bg-grain">
            <div className="max-w-[1200px] mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
