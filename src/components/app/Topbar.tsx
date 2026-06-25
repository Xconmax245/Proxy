"use client";

import { usePathname } from "next/navigation";
import { Bell, Check, Info, ShieldAlert, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentEpoch, getOwnedDelegations } from "@/lib/sui";
import WalletButton from "@/components/shared/WalletButton";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { AnimatePresence, motion } from "framer-motion";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "info" | "success" | "warning" | "epoch";
  read: boolean;
}

export default function Topbar() {
  const pathname = usePathname();
  const account = useCurrentAccount();
  const [epoch, setEpoch] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Fetch real incoming delegations
  useEffect(() => {
    if (!account?.address) return;
    const fetchIncoming = async () => {
      try {
        const owned = await getOwnedDelegations(account.address);
        const newNotifs: NotificationItem[] = owned.map((o: any) => {
          const id = o.data?.objectId || "";
          return {
            id: `del-${id}`,
            title: "Incoming Delegation",
            description: `You received authority for delegation ${id.slice(0, 6)}...${id.slice(-4)}`,
            time: "Recently",
            type: "info",
            read: false,
          };
        });
        setNotifications((prev) => {
          const existingIds = new Set(prev.map(n => n.id));
          const toAdd = newNotifs.filter(n => !existingIds.has(n.id));
          return [...toAdd, ...prev];
        });
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };
    fetchIncoming();
    const interval = setInterval(fetchIncoming, 30000);
    return () => clearInterval(interval);
  }, [account?.address]);

  useEffect(() => {
    const fetchEpoch = async () => {
      try {
        const ep = await getCurrentEpoch();
        setEpoch(ep);
      } catch (err) {
        console.error("Failed to fetch current epoch:", err);
      }
    };
    fetchEpoch();
    const interval = setInterval(fetchEpoch, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sync epoch updates into notifications
  useEffect(() => {
    if (epoch) {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === `epoch-${epoch}`)) return prev;
        return [
          {
            id: `epoch-${epoch}`,
            title: `Sui Epoch ${epoch}`,
            description: `Network transitioned to epoch ${epoch}.`,
            time: "Just now",
            type: "epoch",
            read: false,
          },
          ...prev,
        ];
      });
    }
  }, [epoch]);

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Resolve breadcrumbs based on pathname
  let pageTitle = "Dashboard";
  let sectionName = "Overview";

  if (pathname.startsWith("/app/delegations")) {
    pageTitle = "My Delegations";
    sectionName = "Manage";
  } else if (pathname.startsWith("/app/create")) {
    pageTitle = "Create Delegation";
    sectionName = "Mint";
  } else if (pathname.startsWith("/app/execute")) {
    pageTitle = "Execute Action";
    sectionName = "Interact";
  } else if (pathname.startsWith("/app/verify")) {
    pageTitle = "Verify Terminal";
    sectionName = "Inspect";
  } else if (pathname.startsWith("/app/query")) {
    pageTitle = "Query Terminal";
    sectionName = "Explore";
  }

  return (
    <header className="h-16 border-b border-white/[0.06] bg-[#050c18]/90 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-20"
      style={{ boxShadow: "0 1px 0 0 rgba(200,255,0,0.04), 0 4px 24px rgba(0,0,0,0.3)" }}
    >
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono font-bold tracking-wider text-white/40 uppercase">
          {sectionName}
        </span>
        <span className="text-white/20 font-mono text-xs">/</span>
        <span className="text-xs font-semibold text-white/80">
          {pageTitle}
        </span>
      </div>

      {/* Action Tray */}
      <div className="flex items-center gap-3">
        {/* Testnet Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 relative overflow-hidden">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
          </span>
          Testnet
        </span>

        {/* Epoch Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-white/50 bg-white/[0.04] border border-white/[0.06]">
          <span className="text-white/30">⬡</span>
          {epoch !== null ? `Epoch ${epoch}` : "Epoch …"}
        </span>

        {/* Notification Indicator with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/20 transition-all cursor-pointer relative"
          >
            <Bell size={16} />
            {notifications.some((n) => !n.read) && (
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(200,255,0,0.6)]" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                {/* Backdrop to close when clicking outside */}
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowNotifications(false)}
                />

                {/* Dropdown Drawer */}
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 bg-[#070e1b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-40 font-sans"
                >
                  {/* Header */}
                  <div className="px-4 py-3 bg-[#0a1628] border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Bell size={13} className="text-accent" />
                      <span className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                        Notifications
                      </span>
                    </div>
                    {notifications.some((n) => !n.read) && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] text-accent hover:underline cursor-pointer bg-transparent border-0 outline-none"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-white/30 flex flex-col items-center justify-center gap-2">
                        <Sparkles size={16} />
                        <p className="text-[10px]">No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const icon =
                          n.type === "success" ? (
                            <Check size={12} className="text-accent" />
                          ) : n.type === "warning" ? (
                            <ShieldAlert size={12} className="text-rose-500" />
                          ) : n.type === "epoch" ? (
                            <Sparkles size={12} className="text-amber-400" />
                          ) : (
                            <Info size={12} className="text-blue-400" />
                          );

                        return (
                          <div
                            key={n.id}
                            onClick={() => toggleRead(n.id)}
                            className={`p-3.5 flex items-start gap-3 hover:bg-white/5 transition-colors cursor-pointer relative ${
                              !n.read ? "bg-white/[0.02]" : ""
                            }`}
                          >
                            <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center">
                              {icon}
                            </div>
                            <div className="flex-grow space-y-0.5 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p
                                  className={`text-[11px] font-semibold truncate ${
                                    !n.read ? "text-white" : "text-white/60"
                                  }`}
                                >
                                  {n.title}
                                </p>
                                <span className="text-[9px] text-white/30 flex-shrink-0">
                                  {n.time}
                                </span>
                              </div>
                              <p className="text-[10px] text-white/40 leading-snug line-clamp-2">
                                {n.description}
                              </p>
                            </div>
                            {!n.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-accent absolute right-3 top-1/2 -translate-y-1/2 flex-shrink-0" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-white/5 bg-[#050c18] flex justify-between items-center">
                      <span className="text-[9px] text-white/30">
                        {notifications.filter((n) => !n.read).length} unread
                      </span>
                      <button
                        onClick={clearAll}
                        className="text-[9px] text-rose-500 hover:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 outline-none"
                      >
                        <Trash2 size={10} /> Clear all
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Sui Wallet Connect Button */}
        <WalletButton />
      </div>
    </header>
  );
}
