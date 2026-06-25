import React from "react";

interface PrivPayLoaderProps {
  size?: "xs" | "sm" | "md" | "lg";
  mode?: "default" | "compact";
  className?: string;
}

export default function PrivPayLoader({
  size = "md",
  mode = "default",
  className = "",
}: PrivPayLoaderProps) {
  const sizeMap = {
    xs: 12,
    sm: 16,
    md: 24,
    lg: 48,
  };

  const sz = sizeMap[size];

  if (mode === "compact") {
    // Compact Mode: Single glowing core with a subtle fast orbit
    return (
      <div
        className={`relative inline-flex items-center justify-center ${className}`}
        style={{ width: sz, height: sz }}
      >
        <div className="absolute inset-0 rounded-full border border-accent/30 border-t-accent animate-spin" style={{ animationDuration: "0.8s" }} />
        <div className="absolute inset-[30%] rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(200,255,0,0.8)]" style={{ animationDuration: "1.5s" }} />
      </div>
    );
  }

  // Default Mode: Full orbital loader (miniature "energy core")
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: sz, height: sz }}
    >
      <svg
        viewBox="0 0 50 50"
        className="w-full h-full overflow-visible"
        style={{ transformOrigin: "center" }}
      >
        {/* Outer orbital ring — clockwise rotation */}
        <circle
          cx="25"
          cy="25"
          r="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="20 15 5 15"
          className="text-accent/30 animate-[spin_4s_linear_infinite]"
          style={{ transformOrigin: "center" }}
        />
        {/* Inner segmented ring — counter-clockwise rotation */}
        <circle
          cx="25"
          cy="25"
          r="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="40 60"
          strokeLinecap="round"
          className="text-accent shadow-[0_0_12px_rgba(200,255,0,0.3)] animate-[spin_2s_linear_infinite_reverse]"
          style={{ transformOrigin: "center" }}
        />
      </svg>
      {/* Central core — pulse + glow */}
      <div
        className="absolute inset-[35%] rounded-sm rotate-45 bg-accent animate-pulse"
        style={{ 
          boxShadow: "0 0 16px rgba(200,255,0,0.8), inset 0 0 4px rgba(255,255,255,0.8)",
          animationDuration: "1.5s"
        }}
      />
      {/* Accent particles (flickering dot in corner) */}
      <div 
        className="absolute top-0 right-0 w-1 h-1 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]"
        style={{ animationDuration: "0.5s", animationDirection: "alternate" }}
      />
    </div>
  );
}
