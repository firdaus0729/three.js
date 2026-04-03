import { useDashboardStore } from "@/store/dashboardStore";
import { EVENT_LABELS } from "@/lib/types";

function formatClock(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function DashboardHeader() {
  const eventType = useDashboardStore((s) => s.eventType);
  const elapsedMs = useDashboardStore((s) => s.elapsedMs);

  return (
    <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-cyan-500/90">
          Acoustic biosignal
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Sleep respiration monitor
        </h1>
        <p className="mt-1 max-w-xl text-sm text-slate-500">
          Simulated real-time intensity, effort, and event classification for demo purposes.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-sm">
          <span
            className="relative flex h-2.5 w-2.5"
            aria-label="Live stream active"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
          </span>
          <span className="text-xs font-medium text-slate-300">Live</span>
          <span className="font-mono text-xs text-slate-500">{formatClock(elapsedMs)}</span>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-[#12181f] px-4 py-2 shadow-inner">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Current class</p>
          <p className="mt-0.5 text-sm font-medium text-cyan-100/95">
            {EVENT_LABELS[eventType]}
          </p>
        </div>
      </div>
    </header>
  );
}
