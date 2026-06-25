"use client";

import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import { DelegationObject } from "@/lib/state";

interface DelegationCertificateProps {
  delegation: DelegationObject;
  delegatorName: string;
  delegateName: string;
}

export function DelegationCertificate({ 
  delegation, 
  delegatorName, 
  delegateName 
}: DelegationCertificateProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/verify/${delegation.id}`;

  useEffect(() => {
    QRCode.toDataURL(
      verifyUrl,
      {
        margin: 1,
        color: {
          dark: "#ffffff",
          light: "#00000000",
        },
      },
      (err, url) => {
        if (!err) setQrCodeDataUrl(url);
      }
    );
  }, [verifyUrl]);

  const TYPE_NAMES = ["Financial", "Governance", "Operational", "Legal"];
  const STATUS_NAMES = ["Active", "Revoked", "Expired"];

  // Custom status badge colors in standard RGB/RGBA format for html2canvas support
  const getBadgeStyle = (status: number) => {
    if (status === 0) {
      return {
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderColor: "rgba(16, 185, 129, 0.3)",
        color: "rgb(52, 211, 153)",
      };
    } else if (status === 1) {
      return {
        backgroundColor: "rgba(244, 63, 94, 0.1)",
        borderColor: "rgba(244, 63, 94, 0.3)",
        color: "rgb(251, 113, 133)",
      };
    } else {
      return {
        backgroundColor: "rgba(113, 113, 122, 0.1)",
        borderColor: "rgba(113, 113, 122, 0.3)",
        color: "rgb(161, 161, 170)",
      };
    }
  };

  return (
    <div 
      className="p-8 w-full max-w-[680px] rounded-[8px] mx-auto shadow-2xl relative select-none font-mono"
      style={{ 
        boxSizing: "border-box", 
        backgroundColor: "#050c18", 
        border: "1px solid rgba(255, 255, 255, 0.1)" 
      }}
    >
      {/* Corner Bracket Decorations */}
      <div 
        className="absolute top-2 left-2 w-4 h-4 border-t border-l" 
        style={{ borderColor: "rgba(255, 255, 255, 0.2)" }} 
      />
      <div 
        className="absolute top-2 right-2 w-4 h-4 border-t border-r" 
        style={{ borderColor: "rgba(255, 255, 255, 0.2)" }} 
      />
      <div 
        className="absolute bottom-2 left-2 w-4 h-4 border-b border-l" 
        style={{ borderColor: "rgba(255, 255, 255, 0.2)" }} 
      />
      <div 
        className="absolute bottom-2 right-2 w-4 h-4 border-b border-r" 
        style={{ borderColor: "rgba(255, 255, 255, 0.2)" }} 
      />

      {/* Header section */}
      <div className="text-center mb-6 space-y-1">
        <div 
          className="text-[10px] tracking-[0.2em] uppercase"
          style={{ color: "rgba(255, 255, 255, 0.4)" }}
        >
          Proxy Protocol
        </div>
        <div 
          className="text-sm font-bold tracking-[0.15em] uppercase"
          style={{ color: "#ffffff" }}
        >
          Delegation Certificate
        </div>
        <div 
          className="h-px w-full mt-4" 
          style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
        />
      </div>

      {/* Body section (two-column) */}
      <div className="grid grid-cols-12 gap-6 items-center my-6">
        {/* Left column (40% width / 5 cols) */}
        <div 
          className="col-span-5 flex flex-col items-center justify-center text-center space-y-2 pr-4"
          style={{ borderRight: "1px solid rgba(255, 255, 255, 0.05)" }}
        >
          <div 
            className="w-32 h-32 flex items-center justify-center rounded-lg p-2 relative overflow-hidden"
            style={{ 
              backgroundColor: "rgba(255, 255, 255, 0.05)", 
              border: "1px solid rgba(255, 255, 255, 0.1)" 
            }}
          >
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="Verify QR Code" className="w-full h-full object-contain" />
            ) : (
              <div 
                className="w-full h-full animate-pulse rounded" 
                style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
              />
            )}
          </div>
          <div 
            className="text-[9px] tracking-widest uppercase"
            style={{ color: "rgba(255, 255, 255, 0.4)" }}
          >
            Scan to Verify
          </div>
          <div 
            className="text-[8px] truncate max-w-full"
            style={{ color: "rgba(255, 255, 255, 0.3)" }}
          >
            {appUrl.replace(/^https?:\/\//, "")}/verify/{delegation.id.slice(0, 8)}...
          </div>
        </div>

        {/* Right column (60% width / 7 cols) */}
        <div className="col-span-7 space-y-4 text-xs pl-2">
          <div>
            <div 
              className="text-[9px] uppercase tracking-wider mb-0.5"
              style={{ color: "rgba(255, 255, 255, 0.4)" }}
            >
              Class
            </div>
            <div 
              className="font-semibold tracking-wide uppercase"
              style={{ color: "#ffffff" }}
            >
              {TYPE_NAMES[delegation.delegation_type] || "Custom"}
            </div>
          </div>

          <div>
            <div 
              className="text-[9px] uppercase tracking-wider mb-0.5"
              style={{ color: "rgba(255, 255, 255, 0.4)" }}
            >
              Delegator
            </div>
            <div 
              className="font-semibold tracking-wide truncate"
              style={{ color: "#ffffff" }}
            >
              {delegatorName}
            </div>
          </div>

          <div>
            <div 
              className="text-[9px] uppercase tracking-wider mb-0.5"
              style={{ color: "rgba(255, 255, 255, 0.4)" }}
            >
              Delegate
            </div>
            <div 
              className="font-semibold tracking-wide truncate"
              style={{ color: "#ffffff" }}
            >
              {delegateName}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <div 
                className="text-[9px] uppercase tracking-wider mb-1"
                style={{ color: "rgba(255, 255, 255, 0.4)" }}
              >
                Status
              </div>
              <span 
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                style={getBadgeStyle(delegation.status)}
              >
                {STATUS_NAMES[delegation.status] || "Active"}
              </span>
            </div>

            <div>
              <div 
                className="text-[9px] uppercase tracking-wider mb-0.5"
                style={{ color: "rgba(255, 255, 255, 0.4)" }}
              >
                Epoch Mint
              </div>
              <div 
                className="font-semibold tracking-wide"
                style={{ color: "#ffffff" }}
              >
                {delegation.created_at > 0 ? "421" : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer section */}
      <div 
        className="pt-4 mt-6 space-y-1.5 text-[10px]"
        style={{ 
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          color: "rgba(255, 255, 255, 0.4)" 
        }}
      >
        <div className="flex justify-between items-center">
          <span>Sui Object ID</span>
          <span 
            className="select-all font-semibold break-all text-right max-w-[70%]"
            style={{ color: "#ffffff" }}
          >
            {delegation.id}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Walrus Blob ID</span>
          <span 
            className="select-all font-semibold break-all text-right max-w-[70%]"
            style={{ color: "#ffffff" }}
          >
            {delegation.evidence_hash || "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

export async function generateCertificate(
  delegation: DelegationObject,
  delegatorName: string,
  delegateName: string
): Promise<string> {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-9999px";
  container.style.left = "-9999px";
  container.style.width = "680px";
  container.style.zIndex = "-1000";
  document.body.appendChild(container);

  const root = createRoot(container);
  
  return new Promise((resolve, reject) => {
    root.render(
      <DelegationCertificate 
        delegation={delegation} 
        delegatorName={delegatorName} 
        delegateName={delegateName} 
      />
    );
    
    setTimeout(async () => {
      try {
        const certCard = container.firstElementChild as HTMLElement;
        if (!certCard) {
          throw new Error("Certificate element not found in DOM");
        }

        // Wait for DOM to paint before capturing
        await new Promise((res) => requestAnimationFrame(res));
        await new Promise((res) => requestAnimationFrame(res)); // two frames to be safe

        const canvas = await html2canvas(certCard, {
          useCORS: true,
          allowTaint: false,
          scale: 2,
          backgroundColor: "#050c18",
          logging: false,
        });

        const dataUrl = canvas.toDataURL("image/png");
        
        root.unmount();
        document.body.removeChild(container);
        
        resolve(dataUrl);
      } catch (err) {
        try {
          root.unmount();
          document.body.removeChild(container);
        } catch {}
        reject(err);
      }
    }, 450); // 450ms wait time for async hooks to run
  });
}
