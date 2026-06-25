"use client";

import { useState } from "react";
import { DelegationObject } from "@/lib/state";
import DelegationCard from "@/components/app/DelegationCard";
import { CheckCircle, Share2 } from "lucide-react";

interface SuccessResult {
  objectId: string;
  txDigest: string;
  blobId: string;
}

interface ObjectPreviewProps {
  delegatorAddress: string;
  delegateAddress: string;
  delegationType: number;
  scopeLimit: number;
  expiryTimestamp: number;
  depth: number;
  evidenceHash: string;
  uploading?: boolean;
  success?: SuccessResult | null;
}

export default function ObjectPreview({
  delegatorAddress,
  delegateAddress,
  delegationType,
  scopeLimit,
  expiryTimestamp,
  depth,
  evidenceHash,
  uploading = false,
  success = null,
}: ObjectPreviewProps) {
  const mockDelegation: DelegationObject = {
    id: success?.objectId || "",
    delegator: delegatorAddress,
    delegate: delegateAddress,
    delegation_type: delegationType,
    scope_limit: scopeLimit * 1000000000,
    spent: 0,
    expiry: expiryTimestamp,
    status: 0,
    depth_remaining: depth,
    evidence_hash: success?.blobId || evidenceHash || "",
    created_at: Date.now(),
  };

  const isPreview = !success;
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!success) return;
    const typeName = ["Financial", "Governance", "Operational", "Legal"][delegationType] || "Custom";
    const text = `You have been granted ${typeName} authority on Proxy. Object: ${success.objectId}. Verify: proxy.app/verify/${success.objectId}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Proxy Delegation Receipt",
          text: text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Error sharing", err);
    }
  };

  return (
    <div className="space-y-4">
      <DelegationCard delegation={mockDelegation} isPreview={isPreview} onShare={handleShare} />
    </div>
  );
}
