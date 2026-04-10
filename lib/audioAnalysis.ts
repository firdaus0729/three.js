"use client";

import type { EventType, MetricSnapshot } from "@/lib/types";
import { CALIBRATION_PROFILE } from "@/lib/calibrationProfile";

export interface LiveFeatureState {
  smoothedRms: number;
  smoothedFlux: number;
  prevRms: number;
  prevIntensity: number;
  prevEffort: number;
  baselineIntensity: number;
  baselineEffort: number;
  dynamicFloor: number;
  dynamicCeil: number;
  apneaSamples: number;
  hypopneaSamples: number;
  lastEvent: EventType;
  lastSwitchCooldown: number;
}

interface SimilarityCandidate {
  type:
    | "normal_breathing"
    | "difficult_breathing"
    | "mild_snore"
    | "moderate_snore"
    | "loud_snore";
  score: number;
}

export function createLiveFeatureState(): LiveFeatureState {
  return {
    smoothedRms: 0,
    smoothedFlux: 0,
    prevRms: 0,
    prevIntensity: 0,
    prevEffort: 0,
    baselineIntensity: 40,
    baselineEffort: 36,
    dynamicFloor: 0.06,
    dynamicCeil: 0.45,
    apneaSamples: 0,
    hypopneaSamples: 0,
    lastEvent: "normal_breathing",
    lastSwitchCooldown: 0,
  };
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function matchSimilarityCategory(intensity: number, effort: number, tonality: number): SimilarityCandidate {
  const p = CALIBRATION_PROFILE.prototypes;
  const candidates: SimilarityCandidate[] = (Object.keys(p) as Array<keyof typeof p>).map((key) => {
    const proto = p[key];
    const di = Math.abs(intensity - proto.intensityMean) / Math.max(6, proto.intensityStd);
    const de = Math.abs(effort - proto.effortHint) / 22;
    const dt = Math.abs(tonality - proto.tonalityHint) / 0.28;
    // Weighted L1 distance: amplitude dominates, then effort, then tonal balance.
    const score = di * 0.62 + de * 0.26 + dt * 0.12;
    return { type: key, score };
  });
  candidates.sort((a, b) => a.score - b.score);
  return candidates[0]!;
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
  const SAMPLE_INTERVAL_MS = 220;
  const APNEA_MIN_MS = CALIBRATION_PROFILE.durationsMs.apneaMin;
  const HYPOPNEA_MIN_MS = CALIBRATION_PROFILE.durationsMs.hypopneaMin;
  const apneaMinSamples = Math.ceil(APNEA_MIN_MS / SAMPLE_INTERVAL_MS);
  const hypopneaMinSamples = Math.ceil(HYPOPNEA_MIN_MS / SAMPLE_INTERVAL_MS);
  const t = CALIBRATION_PROFILE.thresholds;

  const normalMax = t.normalMax;
  const mildMin = t.mildSnoreMin;
  const moderateMin = Math.max(t.moderateSnoreMin, mildMin + 6);
  const loudMin = Math.max(t.loudSnoreMin, moderateMin + 6);

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

  // Track moving baseline to define 50% reduction criterion for hypopnea.
  state.baselineIntensity = state.baselineIntensity * 0.992 + snapshot.intensity * 0.008;
  state.baselineEffort = state.baselineEffort * 0.992 + snapshot.effort * 0.008;

  state.prevIntensity = snapshot.intensity;
  state.prevEffort = snapshot.effort;

  const flux = Math.abs(snapshot.intensity - state.prevRms);
  state.smoothedFlux = state.smoothedFlux * 0.8 + flux * 0.2;
  state.prevRms = snapshot.intensity;
  if (state.lastSwitchCooldown > 0) state.lastSwitchCooldown -= 1;

  const completeSilence =
    snapshot.intensity < t.apneaSilenceIntensityMax &&
    snapshot.effort < 22 &&
    tonality < 0.28;
  const halfReduction =
    snapshot.intensity < state.baselineIntensity * 0.5 &&
    snapshot.effort < state.baselineEffort * 0.7 &&
    snapshot.intensity < t.hypopneaIntensityMax;

  state.apneaSamples = completeSilence ? state.apneaSamples + 1 : 0;
  state.hypopneaSamples = halfReduction ? state.hypopneaSamples + 1 : 0;

  if (state.apneaSamples >= apneaMinSamples) {
    state.lastEvent = "apnea";
    state.lastSwitchCooldown = 6;
    return "apnea";
  }
  if (state.hypopneaSamples >= hypopneaMinSamples && state.apneaSamples < apneaMinSamples) {
    state.lastEvent = "hypopnea";
    state.lastSwitchCooldown = 4;
    return "hypopnea";
  }

  if (state.lastSwitchCooldown <= 0) {
    const best = matchSimilarityCategory(snapshot.intensity, snapshot.effort, tonality);
    let chosen = best.type as EventType;

    // Hard safety gates to keep categories medically sensible.
    if (chosen === "loud_snore" && snapshot.intensity < loudMin) chosen = "moderate_snore";
    if (chosen === "moderate_snore" && snapshot.intensity < moderateMin) chosen = "mild_snore";
    if (chosen === "mild_snore" && snapshot.intensity < mildMin) {
      chosen =
        snapshot.effort > t.difficultBreathingEffortMin ? "difficult_breathing" : "normal_breathing";
    }
    if (chosen === "normal_breathing" && snapshot.intensity > normalMax + 8) {
      chosen = snapshot.intensity >= moderateMin ? "moderate_snore" : "mild_snore";
    }

    state.lastEvent = chosen;
    state.lastSwitchCooldown = chosen === "normal_breathing" ? 0 : 2;
    return chosen;
  }

  state.lastEvent = "normal_breathing";
  return "normal_breathing";
}

