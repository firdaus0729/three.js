"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/dashboardStore";

/**
 * Advances playhead in simulation mode. Media mode uses HTMLMediaElement time.
 */
export function usePlaybackScrubber(enabled: boolean) {
  const isPlaying = useDashboardStore((s) => s.isPlaying);

  useEffect(() => {
    if (!enabled || !isPlaying) return;

    let rafId: number;
    let lastTs: number | null = null;

    const loop = (ts: number) => {
      if (lastTs == null) lastTs = ts;
      const dt = ts - lastTs;
      lastTs = ts;

      const s = useDashboardStore.getState();
      const next = Math.min(s.playbackOffsetMs + dt, s.elapsedMs);
      useDashboardStore.getState().setPlaybackOffset(next);

      if (next >= s.elapsedMs) {
        useDashboardStore.setState({ isPlaying: false });
        return;
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [enabled, isPlaying]);
}

