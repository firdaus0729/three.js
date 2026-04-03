import { useCallback, useRef } from "react";
import { useDashboardStore } from "@/store/dashboardStore";

function formatClock(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function AudioPlaybackBar() {
  const playbackOffsetMs = useDashboardStore((s) => s.playbackOffsetMs);
  const elapsedMs = useDashboardStore((s) => s.elapsedMs);
  const isPlaying = useDashboardStore((s) => s.isPlaying);
  const togglePlayback = useDashboardStore((s) => s.togglePlayback);
  const setPlaybackOffset = useDashboardStore((s) => s.setPlaybackOffset);
  const trackRef = useRef<HTMLDivElement>(null);

  const max = Math.max(elapsedMs, 1);
  const pct = Math.min(100, (playbackOffsetMs / max) * 100);

  const onTrackPointer = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      const ratio = rect.width > 0 ? x / rect.width : 0;
      setPlaybackOffset(ratio * elapsedMs);
    },
    [elapsedMs, setPlaybackOffset]
  );

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#12181f]/95 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-200">Simulated audio review</h2>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          UI-only playback
        </span>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={togglePlayback}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-cyan-500/40 bg-gradient-to-br from-cyan-500/25 to-teal-600/20 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.15)] transition hover:scale-105 hover:border-cyan-400/60 active:scale-95"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div
            ref={trackRef}
            role="slider"
            tabIndex={0}
            aria-valuenow={Math.round(playbackOffsetMs)}
            aria-valuemin={0}
            aria-valuemax={Math.round(elapsedMs)}
            className="group relative h-10 cursor-pointer rounded-lg border border-white/10 bg-black/30 px-1 transition hover:border-cyan-500/30"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              onTrackPointer(e.clientX);
            }}
            onPointerMove={(e) => {
              if (e.buttons !== 1) return;
              onTrackPointer(e.clientX);
            }}
            onKeyDown={(e) => {
              const step = 500;
              if (e.key === "ArrowRight")
                setPlaybackOffset(Math.min(playbackOffsetMs + step, elapsedMs));
              if (e.key === "ArrowLeft")
                setPlaybackOffset(Math.max(playbackOffsetMs - step, 0));
            }}
          >
            <div className="absolute inset-y-0 left-2 right-2 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-600/80 to-teal-400/90 transition-[width] duration-75"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-200 bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.5)] transition-[left] duration-75 group-hover:scale-110"
              style={{ left: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[11px] text-slate-500">
            <span>{formatClock(playbackOffsetMs)}</span>
            <span>{formatClock(elapsedMs)}</span>
          </div>
        </div>
        <div className="hidden w-px self-stretch bg-white/10 sm:block" />
        <div className="flex gap-3 text-[11px] text-slate-500 sm:flex-col sm:justify-center">
          <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1">
            {isPlaying ? "Playing" : "Paused"}
          </span>
          <span className="hidden sm:inline">Scrub to jump in time</span>
        </div>
      </div>
    </div>
  );
}
