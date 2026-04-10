"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { exportCsvReport, exportPdfReport } from "@/lib/reportExport";
import { EVENT_LABELS } from "@/lib/types";
import { useDashboardStore } from "@/store/dashboardStore";

interface AnalysisControlPanelProps {
  onFileSelected: (file: File | null) => void;
}

const SPEEDS = [1, 2, 4, 8, 16];
const MEDIA_ACCEPT =
  "audio/*,video/*,.wmv,.wma,.asf,.aac,.ac3,.aiff,.aif,.alac,.amr,.ape,.au,.caf,.dts,.flac,.m4a,.m4b,.m4p,.mka,.mp2,.mp3,.mp4,.oga,.ogg,.opus,.ra,.ram,.wav,.weba,.webm,.xvid";

function formatDuration(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function AnalysisControlPanel({ onFileSelected }: AnalysisControlPanelProps) {
  const [fileName, setFileName] = useState<string>("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const sourceMode = useDashboardStore((s) => s.sourceMode);
  const analysisStatus = useDashboardStore((s) => s.analysisStatus);
  const analysisError = useDashboardStore((s) => s.analysisError);
  const mediaName = useDashboardStore((s) => s.mediaName);
  const mediaDurationMs = useDashboardStore((s) => s.mediaDurationMs);
  const analysisProgress = useDashboardStore((s) => s.analysisProgress);
  const playbackRate = useDashboardStore((s) => s.playbackRate);
  const eventCounts = useDashboardStore((s) => s.eventCounts);
  const events = useDashboardStore((s) => s.events);
  const elapsedMs = useDashboardStore((s) => s.elapsedMs);
  const isPlaying = useDashboardStore((s) => s.isPlaying);
  const setPlaybackRate = useDashboardStore((s) => s.setPlaybackRate);
  const setPlaying = useDashboardStore((s) => s.setPlaying);
  const setSourceMode = useDashboardStore((s) => s.setSourceMode);
  const setAnalysisStatus = useDashboardStore((s) => s.setAnalysisStatus);
  const startSimulation = useDashboardStore((s) => s.startSimulation);

  const totalEvents = useMemo(
    () => Object.values(eventCounts).reduce((acc, v) => acc + v, 0),
    [eventCounts]
  );
  const canExport = sourceMode === "media" && events.length > 0;

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFileName(f?.name ?? "");
    onFileSelected(f);
    if (f) {
      setSourceMode("media");
      setAnalysisStatus("idle");
    }
  };

  const handleExportPdf = async () => {
    if (!canExport || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      let snapshotDataUrl: string | undefined;
      const root = document.getElementById("dashboard-root");
      if (root) {
        try {
          const html2canvas = (await import("html2canvas")).default;
          const canvas = await html2canvas(root, {
            backgroundColor: "#0a0e14",
            scale: Math.min(2, window.devicePixelRatio || 1.5),
            useCORS: true,
            logging: false,
            windowWidth: document.documentElement.clientWidth,
            windowHeight: document.documentElement.clientHeight,
          });
          snapshotDataUrl = canvas.toDataURL("image/png");
        } catch (error) {
          console.warn("Dashboard snapshot capture failed; exporting PDF without cover image.", error);
        }
      }
      exportPdfReport(events, {
        clipName: mediaName,
        durationMs: mediaDurationMs || elapsedMs,
        generatedAt: new Date(),
        eventCounts,
        dashboardSnapshotDataUrl: snapshotDataUrl,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#12181f]/95 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Data source & analysis</h2>
          <p className="mt-1 text-xs text-slate-500">
            Upload a long audio/video recording and run in-browser classification.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-slate-400">
          {sourceMode === "media" ? "Real file mode" : "Simulation mode"}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-col gap-3">
          <label className="group flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-cyan-500/35 bg-cyan-500/5 px-4 py-3 transition hover:border-cyan-400/60 hover:bg-cyan-500/10">
            <span className="text-sm text-slate-200">
              {fileName || mediaName || "Select client recording (audio/video, including .wmv)"}
            </span>
            <span className="rounded-md border border-cyan-500/35 px-2 py-1 text-xs text-cyan-200">
              Browse
            </span>
            <input
              type="file"
              className="hidden"
              accept={MEDIA_ACCEPT}
              onChange={onFileChange}
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPlaying(!isPlaying)}
              disabled={sourceMode !== "media" || !mediaName}
              className="rounded-lg border border-cyan-500/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isPlaying ? "Pause analysis" : "Run analysis"}
            </button>
            <button
              type="button"
              onClick={() => {
                onFileSelected(null);
                setSourceMode("simulation");
                startSimulation();
              }}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
            >
              Back to simulation
            </button>
            <button
              type="button"
              disabled={!canExport}
              onClick={() =>
                exportCsvReport(events, {
                  clipName: mediaName,
                  durationMs: mediaDurationMs || elapsedMs,
                  generatedAt: new Date(),
                  eventCounts,
                })
              }
              className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Export CSV
            </button>
            <button
              type="button"
              disabled={!canExport || isExportingPdf}
              onClick={handleExportPdf}
              className="rounded-lg border border-fuchsia-500/35 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-medium text-fuchsia-100 transition hover:bg-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isExportingPdf ? "Exporting PDF..." : "Export PDF"}
            </button>
          </div>

          {sourceMode === "media" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Status: {analysisStatus}</span>
                <span>Progress: {(analysisProgress * 100).toFixed(1)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-[width] duration-200"
                  style={{ width: `${Math.max(0, Math.min(100, analysisProgress * 100))}%` }}
                />
              </div>
              {analysisError ? <p className="text-xs text-red-300">{analysisError}</p> : null}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Analysis speed</p>
          <div className="flex flex-wrap gap-1">
            {SPEEDS.map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => setPlaybackRate(speed)}
                className={`rounded-md border px-2 py-1 text-xs transition ${
                  speed === playbackRate
                    ? "border-cyan-400/70 bg-cyan-500/20 text-cyan-100"
                    : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-black/25 p-3">
          <p className="text-[10px] uppercase text-slate-500">Duration</p>
          <p className="mt-1 font-mono text-base text-slate-100">
            {formatDuration(sourceMode === "media" ? mediaDurationMs : elapsedMs)}
          </p>
        </div>
        {Object.keys(EVENT_LABELS).map((k) => {
          const key = k as keyof typeof EVENT_LABELS;
          return (
            <div key={key} className="rounded-lg border border-white/10 bg-black/25 p-3">
              <p className="text-[10px] uppercase text-slate-500">{EVENT_LABELS[key]}</p>
              <p className="mt-1 font-mono text-base text-slate-100">{eventCounts[key]}</p>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Total detected events: <span className="font-mono text-slate-300">{totalEvents}</span>
      </p>
    </section>
  );
}

