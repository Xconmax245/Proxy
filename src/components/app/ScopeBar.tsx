"use client";

interface ScopeBarProps {
  spent: number;
  limit: number;
  className?: string;
}

export default function ScopeBar({ spent, limit, className = "" }: ScopeBarProps) {
  const percentage = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  
  let barColor = "bg-accent"; // Lime green
  let textColor = "text-white/60";

  if (percentage >= 95) {
    barColor = "bg-error";
    textColor = "text-error font-bold";
  } else if (percentage >= 75) {
    barColor = "bg-warning";
    textColor = "text-warning font-semibold";
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center text-xs font-mono">
        <span className="text-white/40">Scope Limit Used</span>
        <span className={textColor}>
          {spent.toLocaleString()} / {limit.toLocaleString()} SUI ({percentage}%)
        </span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div 
          className={`h-full ${barColor} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
