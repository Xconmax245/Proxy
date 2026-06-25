'use client'
import { useSuiNSName } from '@/hooks/useSuiNS'
import { Copy } from 'lucide-react'
import { useState } from 'react'
import { formatIdentityForContext } from '@/lib/suins'

interface AddressBadgeProps {
  address: string
  showFull?: boolean
  className?: string
  context?: 'card' | 'certificate' | 'terminal' | 'graph'
}

export function AddressBadge({ 
  address, 
  showFull = false, 
  className, 
  context = 'card' 
}: AddressBadgeProps) {
  const { data: suinsName, isLoading } = useSuiNSName(address)
  const [copied, setCopied] = useState(false)

  const displayText = suinsName && suinsName.length > 0
    ? suinsName
    : showFull
    ? (address || '—')
    : address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '—';

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-sm ${className}`}>
      {suinsName && suinsName.length > 0 ? (
        // .sui name gets accent color treatment
        <span className="text-[var(--color-accent-glow)]">{displayText}</span>
      ) : (
        <span className="text-[var(--color-text-secondary)]">{displayText}</span>
      )}
      <button
        onClick={handleCopy}
        className="opacity-40 hover:opacity-100 transition-opacity"
        aria-label="Copy address"
      >
        <Copy size={12} />
      </button>
      {copied && (
        <span className="text-xs text-[var(--color-status-active)]">copied</span>
      )}
    </span>
  )
}
