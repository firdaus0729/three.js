"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { CircularGauge } from "@/components/CircularGauge";
import { EventTimeline } from "@/components/EventTimeline";
import { AudioPlaybackBar } from "@/components/AudioPlaybackBar";
import { AnalysisControlPanel } from "@/components/AnalysisControlPanel";
import { SphereViewport } from "@/components/SphereViewport";
import { useSimulationEngine } from "@/hooks/useSimulationEngine";
import { usePlaybackScrubber } from "@/hooks/usePlaybackScrubber";
import { useMediaAnalysisEngine } from "@/hooks/useMediaAnalysisEngine";
import { useDashboardStore } from "@/store/dashboardStore";

function DashboardBody() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const intensity = useDashboardStore((s) => s.intensity);
  const effort = useDashboardStore((s) => s.effort);
  const sourceMode = useDashboardStore((s) => s.sourceMode);

  useSimulationEngine(sourceMode === "simulation");
  usePlaybackScrubber(sourceMode === "simulation");
  useMediaAnalysisEngine(sourceMode === "media" ? selectedFile : null);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <DashboardHeader />
      <section className="mt-6">
        <AnalysisControlPanel onFileSelected={setSelectedFile} />
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="flex justify-center lg:col-span-3 lg:justify-end">
          <CircularGauge label="Intensity" value={intensity} className="w-full max-w-[240px]" />
        </div>
        <div className="lg:col-span-6">
          <SphereViewport />
        </div>
        <div className="flex justify-center lg:col-span-3 lg:justify-start">
          <CircularGauge label="Effort" value={effort} className="w-full max-w-[240px]" />
        </div>
      </section>

      <section className="mt-8 space-y-6">
        <AudioPlaybackBar />
        <EventTimeline />
      </section>
    </div>
  );
}

export function Dashboard() {
  return (
    <main className="min-h-screen bg-[#0a0e14] bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(34,211,238,0.06),transparent)]">
      <DashboardBody />
    </main>
  );
}
