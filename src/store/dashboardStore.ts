import { create } from "zustand";
import {
  createInitialSimulation,
  simulationTick,
  type SimulationState,
} from "@/lib/simulation";
import type { EventType, TimelineEvent } from "@/lib/types";

let eventId = 0;

export interface DashboardState {
  elapsedMs: number;
  intensity: number;
  effort: number;
  eventType: EventType;
  events: TimelineEvent[];
  selectedEventId: string | null;
  /** Simulated playhead offset (ms) from session start */
  playbackOffsetMs: number;
  isPlaying: boolean;
  lastTickMs: number;
  sim: SimulationState;
  tick: () => void;
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

  tick: () => {
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

    const nextEvents = [...s.events, newEvent].slice(-200);

    set({
      elapsedMs,
      lastTickMs: interval,
      intensity: snapshot.intensity,
      effort: snapshot.effort,
      eventType: type,
      events: nextEvents,
      playbackOffsetMs: s.isPlaying
        ? clampPlayback(s.playbackOffsetMs + interval, nextEvents, elapsedMs)
        : s.playbackOffsetMs,
    });
  },

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
