"use client";

import { ExternalLink } from "lucide-react";
import { SUI_NETWORK } from "@/lib/constants";

interface ExplorerLinkProps {
  id: string;
  type?: "object" | "tx";
  className?: string;
  label?: string;
}

export default function ExplorerLink({
  id,
  type = "object",
  className = "",
  label,
}: ExplorerLinkProps) {
  const truncated = label || (id.length > 12 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id);
  const baseUrl = SUI_NETWORK === "mainnet" 
    ? "https://suiscan.xyz/mainnet" 
    : `https://suiscan.xyz/${SUI_NETWORK}`;
  
  const href = `${baseUrl}/${type}/${id}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 hover:border-accent-border/30 rounded-md font-mono text-xs text-accent hover:text-accent-hover transition-all no-underline ${className}`}
      title={`View on SuiScan (${type})`}
    >
      <span>{truncated}</span>
      <ExternalLink size={10} className="flex-shrink-0" />
    </a>
  );
}
