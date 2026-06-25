import { Terminal, AlertTriangle } from "lucide-react";

/**
 * Rendered on every app page when NEXT_PUBLIC_PROXY_PACKAGE_ID is not set.
 * This is NOT a mock. It is a deployment gate.
 * Set the env variable and restart the dev server to unlock the app.
 */
export default function DeploymentGate() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#c8ff00]/10 border border-[#c8ff00]/20 flex items-center justify-center">
        <Terminal size={28} className="text-[#c8ff00]" />
      </div>

      <div className="space-y-2">
        <h2 className="font-heading text-xl font-bold text-white tracking-tight">
          Contract Not Yet Deployed
        </h2>
        <p className="text-white/50 text-sm max-w-md">
          Set <code className="text-[#c8ff00] bg-black/30 px-1.5 py-0.5 rounded font-mono text-xs">NEXT_PUBLIC_PROXY_PACKAGE_ID</code> in{" "}
          <code className="text-white/70 bg-black/30 px-1.5 py-0.5 rounded font-mono text-xs">.env.local</code>{" "}
          and restart the dev server.
        </p>
      </div>

      <div className="bg-[#0a1628] border border-white/5 rounded-2xl p-5 text-left font-mono text-xs text-white/60 w-full max-w-md">
        <div className="text-[#c8ff00]/60 mb-2 text-[10px] uppercase tracking-widest">
          .env.local
        </div>
        <div>NEXT_PUBLIC_PROXY_PACKAGE_ID=<span className="text-white/30">0x…your_package_id</span></div>
        <div className="text-white/30">NEXT_PUBLIC_PROXY_REGISTRY_OBJECT_ID=<span className="text-white/20">0x…</span></div>
      </div>

      <div className="flex items-center gap-2 text-xs text-white/30">
        <AlertTriangle size={12} />
        <span>No mock data will be shown — deploy the Move contract to continue.</span>
      </div>
    </div>
  );
}
