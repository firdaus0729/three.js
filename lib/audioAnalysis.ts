"use client";

import type { EventType, MetricSnapshot } from "@/lib/types";

export interface LiveFeatureState {
  smoothedRms: number;
  smoothedFlux: number;
  prevRms: number;
  prevIntensity: number;
  prevEffort: number;
  dynamicFloor: number;
  dynamicCeil: number;
  apneaCooldown: number;
}

export function createLiveFeatureState(): LiveFeatureState {
  return {
    smoothedRms: 0,
    smoothedFlux: 0,
    prevRms: 0,
    prevIntensity: 0,
    prevEffort: 0,
    dynamicFloor: 0.06,
    dynamicCeil: 0.45,
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
  const iRaw = snapshot.intensity;
  const eRaw = snapshot.effort;
  state.smoothedRms = state.smoothedRms * 0.86 + iRaw * 0.14;

  // Adaptive normalization so low-level recordings still show dynamic behavior.
  state.dynamicFloor = state.dynamicFloor * 0.995 + (state.smoothedRms / 100) * 0.005;
  const targetCeil = Math.max(state.dynamicFloor + 0.18, (iRaw + eRaw) / 200 + 0.08);
  state.dynamicCeil = state.dynamicCeil * 0.985 + targetCeil * 0.015;
  const range = Math.max(0.08, state.dynamicCeil - state.dynamicFloor);

  const i = clamp01((iRaw / 100 - state.dynamicFloor) / range) * 100;
  const e = clamp01((eRaw / 100 - state.dynamicFloor) / range) * 100;
  snapshot.intensity = Math.round((i * 0.7 + Math.abs(i - state.prevIntensity) * 0.6) * 10) / 10;
  snapshot.effort = Math.round((e * 0.75 + Math.abs(e - state.prevEffort) * 0.55) * 10) / 10;
  state.prevIntensity = snapshot.intensity;
  state.prevEffort = snapshot.effort;

  const flux = Math.abs(snapshot.intensity - state.prevRms);
  state.smoothedFlux = state.smoothedFlux * 0.8 + flux * 0.2;
  state.prevRms = snapshot.intensity;
  if (state.apneaCooldown > 0) state.apneaCooldown -= 1;

  const apneaLike =
    snapshot.intensity < 14 &&
    snapshot.effort > 52 &&
    tonality < 0.52 &&
    state.smoothedFlux < 3.2 &&
    state.apneaCooldown <= 0;
  if (apneaLike) {
    state.apneaCooldown = 8;
    return "breathing_interruption";
  }

  if (snapshot.intensity > 74 && snapshot.effort > 58 && tonality > 0.48) return "heavy_snore";
  if (snapshot.intensity > 46 && tonality > 0.42) return "slow_snore";
  return "normal_breathing";
}

