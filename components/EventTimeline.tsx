"use client";

import { useMemo } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { EVENT_LABELS, type EventType } from "@/lib/types";

function formatTime(offsetMs: number) {
  const s = Math.floor(offsetMs / 1000);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  const ms = Math.floor((offsetMs % 1000) / 10);
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
}

const typeStyles: Record<
  EventType,
  { bar: string; dot: string; badge: string }
> = {
  normal_breathing: {
    bar: "from-emerald-500/40 to-emerald-500/5",
    dot: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]",
    badge: "text-emerald-300/90 bg-emerald-500/15 border-emerald-500/25",
  },
  difficult_breathing: {
    bar: "from-sky-500/40 to-sky-500/10",
    dot: "bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.45)]",
    badge: "text-sky-200/90 bg-sky-500/15 border-sky-500/25",
  },
  mild_snore: {
    bar: "from-amber-500/40 to-amber-500/5",
    dot: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.45)]",
    badge: "text-amber-200/90 bg-amber-500/15 border-amber-500/25",
  },
  moderate_snore: {
    bar: "from-orange-500/45 to-red-500/10",
    dot: "bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.5)]",
    badge: "text-orange-200/90 bg-orange-500/15 border-orange-500/30",
  },
  loud_snore: {
    bar: "from-red-500/45 to-rose-700/20",
    dot: "bg-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.55)]",
    badge: "text-rose-200/90 bg-rose-500/15 border-rose-500/30",
  },
  apnea: {
    bar: "from-red-500/50 to-red-900/20",
    dot: "bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.55)]",
    badge: "text-red-200/90 bg-red-500/15 border-red-500/30",
  },
  hypopnea: {
    bar: "from-fuchsia-500/45 to-purple-900/20",
    dot: "bg-fuchsia-400 shadow-[0_0_12px_rgba(232,121,249,0.5)]",
    badge: "text-fuchsia-200/90 bg-fuchsia-500/15 border-fuchsia-500/30",
  },
};

export function EventTimeline() {
  const sourceMode = useDashboardStore((s) => s.sourceMode);
  const events = useDashboardStore((s) => s.events);
  const selectedId = useDashboardStore((s) => s.selectedEventId);
  const selectEvent = useDashboardStore((s) => s.selectEvent);
  const jumpToEvent = useDashboardStore((s) => s.jumpToEvent);
  const selected = useMemo(
    () => events.find((e) => e.id === selectedId) ?? null,
    [events, selectedId]
  );

  const reversed = useMemo(() => [...events].reverse(), [events]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl border border-white/[0.08] bg-[#12181f]/95 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Event timeline</h2>
          <span className="text-[10px] uppercase tracking-wider text-slate-500">
            {events.length} events
          </span>
        </div>
        <div className="timeline-scroll max-h-[220px] space-y-1 overflow-y-auto pr-1">
          {reversed.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Waiting for signal samples…
            </p>
          ) : (
            reversed.map((ev) => {
              const st = typeStyles[ev.type];
              const active = ev.id === selectedId;
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => {
                    selectEvent(ev.id);
                    jumpToEvent(ev.id);
                  }}
                  className={`group flex w-full items-stretch gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${
                    active
                      ? "border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_24px_rgba(34,211,238,0.12)]"
                      : "border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.05]"
                  }`}
                >
                  <div
                    className={`w-1 shrink-0 rounded-full bg-gradient-to-b ${st.bar}`}
                    aria-hidden
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${st.badge}`}
                      >
                        {EVENT_LABELS[ev.type]}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        T+{formatTime(ev.offsetMs)}
                      </span>
                    </div>
                    <div className="flex gap-3 text-[11px] text-slate-500">
                      <span>
                        I:{" "}
                        <span className="font-mono text-slate-400">
                          {ev.snapshot.intensity}
                        </span>
                      </span>
                      <span>
                        E:{" "}
                        <span className="font-mono text-slate-400">{ev.snapshot.effort}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`h-2 w-2 rounded-full transition-transform group-hover:scale-125 ${st.dot}`}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <aside className="rounded-2xl border border-white/[0.08] bg-[#12181f]/95 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        <h2 className="text-sm font-semibold text-slate-200">Selection detail</h2>
        {selected ? (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Event type</p>
              <p className="mt-1 text-lg font-medium text-white">
                {EVENT_LABELS[selected.type]}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Timestamp</p>
              <p className="mt-1 font-mono text-sm text-cyan-200/90">
                T+{formatTime(selected.offsetMs)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                <p className="text-[10px] uppercase text-slate-500">Intensity</p>
                <p className="mt-1 font-mono text-xl text-white">
                  {selected.snapshot.intensity}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                <p className="text-[10px] uppercase text-slate-500">Effort</p>
                <p className="mt-1 font-mono text-xl text-white">
                  {selected.snapshot.effort}
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Metrics reflect the {sourceMode === "media" ? "recording-derived" : "simulated"} snapshot at classification time.
              Use the player below to align the playhead with this marker.
            </p>
          </div>
        ) : (
          <p className="mt-6 text-sm text-slate-500">
            Click any timeline row to inspect type, time, and the metric snapshot captured for that
            sample.
          </p>
        )}
      </aside>
    </div>
  );
}
