"use client";

import { create } from "zustand";
import {
  createInitialSimulation,
  simulationTick,
  type SimulationState,
} from "@/lib/simulation";
import type {
  AnalysisStatus,
  DataSourceMode,
  EventType,
  MetricSnapshot,
  TimelineEvent,
} from "@/lib/types";

let eventId = 0;

export interface DashboardState {
  sourceMode: DataSourceMode;
  analysisStatus: AnalysisStatus;
  analysisError: string | null;
  mediaName: string | null;
  mediaDurationMs: number;
  analysisProgress: number;
  playbackRate: number;
  elapsedMs: number;
  intensity: number;
  effort: number;
  eventType: EventType;
  events: TimelineEvent[];
  selectedEventId: string | null;
  /** Playback offset (ms) from start of simulated/live stream */
  playbackOffsetMs: number;
  isPlaying: boolean;
  lastTickMs: number;
  sim: SimulationState;
  eventCounts: Record<EventType, number>;
  tickSimulation: () => void;
  startSimulation: () => void;
  resetForMedia: (name: string | null, durationMs: number) => void;
  ingestExternalSample: (offsetMs: number, snapshot: MetricSnapshot, type: EventType) => void;
  setSourceMode: (mode: DataSourceMode) => void;
  setAnalysisStatus: (status: AnalysisStatus, error?: string | null) => void;
  setMediaDuration: (durationMs: number) => void;
  setPlaybackRate: (rate: number) => void;
  setPlaying: (playing: boolean) => void;
  selectEvent: (id: string | null) => void;
  jumpToEvent: (id: string) => void;
  setPlaybackOffset: (ms: number) => void;
  togglePlayback: () => void;
}

function clampPlayback(
  offset: number,
  events: TimelineEvent[],
  elapsed: number
): number {
  const max = Math.max(elapsed, 0);
  if (events.length === 0) return Math.max(0, Math.min(offset, max));
  const last = events[events.length - 1]!.offsetMs;
  return Math.max(0, Math.min(offset, Math.max(max, last)));
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  sourceMode: "simulation",
  analysisStatus: "idle",
  analysisError: null,
  mediaName: null,
  mediaDurationMs: 0,
  analysisProgress: 0,
  playbackRate: 8,
  elapsedMs: 0,
  intensity: 40,
  effort: 38,
  eventType: "normal_breathing",
  events: [],
  selectedEventId: null,
  playbackOffsetMs: 0,
  isPlaying: false,
  lastTickMs: 750,
  sim: createInitialSimulation(),
  eventCounts: {
    loud_snore: 0,
    moderate_snore: 0,
    mild_snore: 0,
    difficult_breathing: 0,
    normal_breathing: 0,
    apnea: 0,
    hypopnea: 0,
  },

  tickSimulation: () => {
    const s = get();
    const interval = 500 + Math.random() * 500;
    const { snapshot, type } = simulationTick(s.sim, interval);

    const elapsedMs = s.elapsedMs + interval;
    const offsetMs = elapsedMs;
    const id = `evt-${++eventId}`;
    const newEvent: TimelineEvent = {
      id,
      offsetMs,
      type,
      snapshot: { ...snapshot },
    };

    const nextEvents = [...s.events, newEvent].slice(-2500);

    set({
      elapsedMs,
      lastTickMs: interval,
      intensity: snapshot.intensity,
      effort: snapshot.effort,
      eventType: type,
      events: nextEvents,
      eventCounts: {
        ...s.eventCounts,
        [type]: s.eventCounts[type] + 1,
      },
      playbackOffsetMs: s.isPlaying
        ? clampPlayback(s.playbackOffsetMs + interval, nextEvents, elapsedMs)
        : s.playbackOffsetMs,
    });
  },

  startSimulation: () =>
    set({
      sourceMode: "simulation",
      analysisStatus: "running",
      analysisError: null,
      mediaName: null,
      mediaDurationMs: 0,
      analysisProgress: 0,
      elapsedMs: 0,
      intensity: 40,
      effort: 38,
      eventType: "normal_breathing",
      events: [],
      selectedEventId: null,
      playbackOffsetMs: 0,
      isPlaying: false,
      lastTickMs: 750,
      sim: createInitialSimulation(),
      eventCounts: {
        loud_snore: 0,
        moderate_snore: 0,
        mild_snore: 0,
        difficult_breathing: 0,
        normal_breathing: 0,
        apnea: 0,
        hypopnea: 0,
      },
    }),

  resetForMedia: (name, durationMs) =>
    set({
      sourceMode: "media",
      analysisStatus: "loading",
      analysisError: null,
      mediaName: name,
      mediaDurationMs: durationMs,
      analysisProgress: 0,
      elapsedMs: durationMs,
      intensity: 0,
      effort: 0,
      eventType: "normal_breathing",
      events: [],
      selectedEventId: null,
      playbackOffsetMs: 0,
      isPlaying: false,
      eventCounts: {
        loud_snore: 0,
        moderate_snore: 0,
        mild_snore: 0,
        difficult_breathing: 0,
        normal_breathing: 0,
        apnea: 0,
        hypopnea: 0,
      },
    }),

  ingestExternalSample: (offsetMs, snapshot, type) => {
    const s = get();
    const safeOffset = Math.max(0, Math.min(offsetMs, s.mediaDurationMs || Number.MAX_SAFE_INTEGER));
    const id = `evt-${++eventId}`;
    const newEvent: TimelineEvent = { id, offsetMs: safeOffset, type, snapshot: { ...snapshot } };
    const nextEvents = [...s.events, newEvent];
    set({
      intensity: snapshot.intensity,
      effort: snapshot.effort,
      eventType: type,
      events: nextEvents,
      playbackOffsetMs: safeOffset,
      analysisProgress:
        s.mediaDurationMs > 0 ? Math.min(1, safeOffset / s.mediaDurationMs) : 0,
      eventCounts: {
        ...s.eventCounts,
        [type]: s.eventCounts[type] + 1,
      },
    });
  },

  setSourceMode: (mode) => set({ sourceMode: mode }),

  setAnalysisStatus: (status, error = null) =>
    set({
      analysisStatus: status,
      analysisError: error,
    }),

  setMediaDuration: (durationMs) =>
    set({
      mediaDurationMs: durationMs,
      elapsedMs: durationMs > 0 ? durationMs : get().elapsedMs,
    }),

  setPlaybackRate: (rate) => set({ playbackRate: rate }),

  setPlaying: (playing) => set({ isPlaying: playing }),

  selectEvent: (id) => set({ selectedEventId: id }),

  jumpToEvent: (id) => {
    const ev = get().events.find((e) => e.id === id);
    if (!ev) return;
    set({
      selectedEventId: id,
      playbackOffsetMs: ev.offsetMs,
    });
  },

  setPlaybackOffset: (ms) => {
    const { events, elapsedMs } = get();
    set({ playbackOffsetMs: clampPlayback(ms, events, elapsedMs) });
  },

  togglePlayback: () => {
    const playing = !get().isPlaying;
    set({ isPlaying: playing });
  },
}));
