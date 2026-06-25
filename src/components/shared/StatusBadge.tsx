"use client";

import { CheckCircle2, AlertOctagon, Clock } from "lucide-react";

interface StatusBadgeProps {
  status: number; // 0=active 1=revoked 2=expired
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  let label = "Active";
  let colorClass = "bg-success/10 text-success border-success/20";
  let dotClass = "bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]";
  let Icon = CheckCircle2;

  if (status === 1) {
    label = "Revoked";
    colorClass = "bg-error/10 text-error border-error/20";
    dotClass = "bg-error shadow-[0_0_8px_rgba(239,68,68,0.4)]";
    Icon = AlertOctagon;
  } else if (status === 2) {
    label = "Expired";
    colorClass = "bg-white/5 text-white/50 border-white/10";
    dotClass = "bg-white/30";
    Icon = Clock;
  } else if (status === 3) {
    label = "Paused";
    colorClass = "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20";
    dotClass = "bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.4)]";
    Icon = AlertOctagon;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${colorClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      <span>{label}</span>
    </span>
  );
}
