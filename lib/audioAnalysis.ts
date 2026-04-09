"use client";

import type { EventType, MetricSnapshot } from "@/lib/types";

export interface LiveFeatureState {
  smoothedRms: number;
  smoothedFlux: number;
  prevRms: number;
  apneaCooldown: number;
}

export function createLiveFeatureState(): LiveFeatureState {
  return {
    smoothedRms: 0,
    smoothedFlux: 0,
    prevRms: 0,
    apneaCooldown: 0,
  };
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export function extractSignalFeatures(
  timeDomain: Uint8Array,
  freqDomain: Uint8Array
): { intensity: number; effort: number; tonality: number } {
  let sumSq = 0;
  let zcr = 0;
  let prev = 128;

  for (let i = 0; i < timeDomain.length; i += 1) {
    const v = (timeDomain[i]! - 128) / 128;
    sumSq += v * v;
    if ((timeDomain[i]! - 128) * (prev - 128) < 0) zcr += 1;
    prev = timeDomain[i]!;
  }

  const rms = Math.sqrt(sumSq / timeDomain.length);
  const zcrNorm = clamp01(zcr / (timeDomain.length * 0.5));

  let low = 0;
  let mid = 0;
  let high = 0;
  const lowMax = Math.floor(freqDomain.length * 0.08);
  const midMax = Math.floor(freqDomain.length * 0.32);
  for (let i = 0; i < freqDomain.length; i += 1) {
    const p = freqDomain[i]! / 255;
    if (i < lowMax) low += p;
    else if (i < midMax) mid += p;
    else high += p;
  }
  const total = low + mid + high + 1e-6;
  const lowRatio = low / total;
  const highRatio = high / total;
  const tonalRatio = clamp01((lowRatio * 1.2 + (1 - highRatio) * 0.6) / 1.8);

  const intensity = clamp01(rms * 3.8 + lowRatio * 0.55 + (1 - zcrNorm) * 0.2) * 100;
  const effort = clamp01(rms * 2.3 + zcrNorm * 0.55 + (1 - lowRatio) * 0.25) * 100;

  return { intensity, effort, tonality: tonalRatio };
}

export function classifyFromFeatures(
  snapshot: MetricSnapshot,
  tonality: number,
  state: LiveFeatureState
): EventType {
  const i = snapshot.intensity;
  const e = snapshot.effort;
  const flux = Math.abs(i - state.prevRms);
  state.smoothedFlux = state.smoothedFlux * 0.8 + flux * 0.2;
  state.prevRms = i;
  if (state.apneaCooldown > 0) state.apneaCooldown -= 1;

  const apneaLike =
    i < 18 && e > 45 && tonality < 0.55 && state.smoothedFlux < 3.8 && state.apneaCooldown <= 0;
  if (apneaLike) {
    state.apneaCooldown = 8;
    return "breathing_interruption";
  }

  if (i > 70 && e > 52 && tonality > 0.5) return "heavy_snore";
  if (i > 42 && tonality > 0.45) return "slow_snore";
  return "normal_breathing";
}

