"use client";

import { Database } from "lucide-react";
import Link from "next/link";

interface BlobLinkProps {
  blobId: string;
  className?: string;
  label?: string;
}

export default function BlobLink({ blobId, className = "", label }: BlobLinkProps) {
  const truncated = label || (blobId.length > 12 ? `${blobId.slice(0, 6)}...${blobId.slice(-4)}` : blobId);
  const isMock = blobId.startsWith("w_");

  if (isMock) {
    // For mock/simulated blobs, direct to our Verify page which will intercept and display the file
    return (
      <Link
        href={`/app/verify?blobId=${blobId}`}
        className={`inline-flex items-center gap-1.5 px-2 py-1 bg-[#c8ff00]/5 border border-[#c8ff00]/10 hover:border-[#c8ff00]/30 rounded-md font-mono text-xs text-accent hover:text-accent-hover transition-all no-underline ${className}`}
        title="View evidence in Verify Terminal"
      >
        <span>{truncated}</span>
        <Database size={10} className="flex-shrink-0" />
      </Link>
    );
  }

  // Real Walrus link
  const href = `https://walruscan.com/testnet/blob/${blobId}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 hover:border-accent-border/30 rounded-md font-mono text-xs text-accent hover:text-accent-hover transition-all no-underline ${className}`}
      title="View on WalrusScan"
    >
      <span>{truncated}</span>
      <Database size={10} className="flex-shrink-0" />
    </a>
  );
}
