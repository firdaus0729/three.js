"use client";

import type { EventType, MetricSnapshot } from "@/lib/types";
import { CALIBRATION_PROFILE } from "@/lib/calibrationProfile";

export interface LiveFeatureState {
  /** Raw intensity from extractSignalFeatures (0–100), not adaptive-normalized */
  baselineRawIntensity: number;
  baselineRawEffort: number;
  /** Session noise floor (EMA of quiet moments) for relative silence */
  noiseFloorRaw: number;
  /** Peak tracker for dynamic range */
  peakRawIntensity: number;
  /** Slow EMA of RMS — typical “ventilation” level for relative hypopnea */
  rmsBaseline: number;
  /** Tracks quiet RMS (rises slowly) for apnea vs reduced-flow band */
  rmsQuietFloor: number;
  apneaSamples: number;
  hypopneaSamples: number;
  /** Brief non-silence tolerance inside apnea streak (samples) */
  apneaGraceLeft: number;
  lastEvent: EventType;
  lastSwitchCooldown: number;
  prevIntensityRaw: number;
  prevEffortRaw: number;
}

export function createLiveFeatureState(): LiveFeatureState {
  return {
    baselineRawIntensity: 28,
    baselineRawEffort: 32,
    noiseFloorRaw: 0.08,
    peakRawIntensity: 35,
    rmsBaseline: 0.04,
    rmsQuietFloor: 0.015,
    apneaSamples: 0,
    hypopneaSamples: 0,
    apneaGraceLeft: 0,
    lastEvent: "normal_breathing",
    lastSwitchCooldown: 0,
    prevIntensityRaw: 28,
    prevEffortRaw: 32,
  };
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export interface ExtractedFeatures {
  intensity: number;
  effort: number;
  tonality: number;
  /** Same scale as intensity/effort, pre-display-smoothing */
  rawIntensity: number;
  rawEffort: number;
  rms: number;
  zcrNorm: number;
  lowRatio: number;
}

export function extractSignalFeatures(
  timeDomain: Uint8Array,
  freqDomain: Uint8Array
): ExtractedFeatures {
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

  const rawIntensity = clamp01(rms * 3.8 + lowRatio * 0.55 + (1 - zcrNorm) * 0.2) * 100;
  const rawEffort = clamp01(rms * 2.3 + zcrNorm * 0.55 + (1 - lowRatio) * 0.25) * 100;

  return {
    intensity: rawIntensity,
    effort: rawEffort,
    tonality: tonalRatio,
    rawIntensity,
    rawEffort,
    rms,
    zcrNorm,
    lowRatio,
  };
}

/**
 * Strict snore spectral signature — normal speech/breath often fails this,
 * so we do not label every low–mid-heavy frame as snoring.
 */
function isStrictSnoreSpectrum(tonality: number, lowRatio: number, zcrNorm: number): boolean {
  return lowRatio > 0.34 && tonality > 0.44 && zcrNorm < 0.68;
}

export function classifyFromFeatures(
  snapshot: MetricSnapshot,
  tonality: number,
  state: LiveFeatureState,
  raw: Pick<ExtractedFeatures, "rawIntensity" | "rawEffort" | "rms" | "zcrNorm" | "lowRatio">
): EventType {
  const SAMPLE_INTERVAL_MS = 220;
  const APNEA_MIN_MS = CALIBRATION_PROFILE.durationsMs.apneaMin;
  const HYPOPNEA_MIN_MS = CALIBRATION_PROFILE.durationsMs.hypopneaMin;
  const apneaMinSamples = Math.ceil(APNEA_MIN_MS / SAMPLE_INTERVAL_MS);
  const hypopneaMinSamples = Math.ceil(HYPOPNEA_MIN_MS / SAMPLE_INTERVAL_MS);
  const t = CALIBRATION_PROFILE.thresholds;

  const iRaw = raw.rawIntensity;
  const eRaw = raw.rawEffort;

  // Slow session baseline (typical “breathing” level) — not aggressive normalization
  state.baselineRawIntensity = state.baselineRawIntensity * 0.9992 + iRaw * 0.0008;
  state.baselineRawEffort = state.baselineRawEffort * 0.9992 + eRaw * 0.0008;
  state.peakRawIntensity = Math.max(state.peakRawIntensity * 0.9995, iRaw);

  // RMS statistics: apnea/hypopnea must use waveform energy, not iRaw (spectral bias lifts “silent” iRaw)
  state.rmsBaseline = state.rmsBaseline * 0.999 + raw.rms * 0.001;
  if (raw.rms < state.rmsQuietFloor * 1.55) {
    state.rmsQuietFloor = state.rmsQuietFloor * 0.9 + raw.rms * 0.1;
  } else {
    state.rmsQuietFloor = state.rmsQuietFloor * 0.9996 + raw.rms * 0.0004;
  }
  state.rmsQuietFloor = Math.max(0.002, Math.min(state.rmsQuietFloor, 0.12));

  // Noise floor: tracks quiet moments (drops fast, rises very slowly)
  if (iRaw < state.noiseFloorRaw * 1.4) {
    state.noiseFloorRaw = state.noiseFloorRaw * 0.92 + iRaw * 0.08;
  } else {
    state.noiseFloorRaw = state.noiseFloorRaw * 0.9997 + iRaw * 0.0003;
  }
  state.noiseFloorRaw = Math.max(4, Math.min(state.noiseFloorRaw, 55));

  // Display snapshot: light smoothing only (gauges), independent of classification
  const iDisp =
    snapshot.intensity * 0.35 +
    iRaw * 0.45 +
    Math.abs(iRaw - state.prevIntensityRaw) * 8 * 0.2;
  const eDisp =
    snapshot.effort * 0.35 + eRaw * 0.45 + Math.abs(eRaw - state.prevEffortRaw) * 6 * 0.2;
  snapshot.intensity = Math.round(Math.min(100, Math.max(0, iDisp)) * 10) / 10;
  snapshot.effort = Math.round(Math.min(100, Math.max(0, eDisp)) * 10) / 10;
  state.prevIntensityRaw = iRaw;
  state.prevEffortRaw = eRaw;

  if (state.lastSwitchCooldown > 0) state.lastSwitchCooldown -= 1;

  // --- Apnea: sustained near-zero **RMS** (iRaw alone stays high from spectral leakage when RMS is flat)
  const rmsVsQuiet = raw.rms < Math.max(state.rmsQuietFloor * 2.8, 0.004);
  const rmsVsTypical = raw.rms < state.rmsBaseline * 0.14;
  const rmsSilent = raw.rms < 0.038;
  const silenceAbsolute =
    rmsSilent && (rmsVsQuiet || rmsVsTypical) && eRaw < 36 && (tonality < 0.48 || raw.rms < 0.022);
  const silenceRelative = raw.rms < 0.05 && raw.rms < state.rmsBaseline * 0.2 && iRaw < state.baselineRawIntensity * 0.42;
  const isQuiet = silenceAbsolute || silenceRelative;

  if (isQuiet) {
    state.apneaSamples += 1;
    state.apneaGraceLeft = 3;
  } else if (state.apneaGraceLeft > 0) {
    state.apneaGraceLeft -= 1;
  } else {
    state.apneaSamples = 0;
  }

  // --- Hypopnea: reduced flow — above apnea band, clearly below session typical (RMS-based band)
  const hypoLowerRms = Math.max(state.rmsQuietFloor * 2.2, 0.006);
  const hypoUpperRms = state.rmsBaseline * 0.48;
  const hypoCandidate =
    raw.rms > hypoLowerRms &&
    raw.rms < hypoUpperRms &&
    raw.rms < 0.11 &&
    iRaw < t.hypopneaIntensityMax + 32 &&
    !isQuiet;
  state.hypopneaSamples = hypoCandidate ? state.hypopneaSamples + 1 : 0;

  if (state.apneaSamples >= apneaMinSamples) {
    state.lastEvent = "apnea";
    state.lastSwitchCooldown = 8;
    return "apnea";
  }
  if (
    state.hypopneaSamples >= hypopneaMinSamples &&
    state.apneaSamples < Math.floor(apneaMinSamples * 0.35)
  ) {
    state.lastEvent = "hypopnea";
    state.lastSwitchCooldown = 5;
    return "hypopnea";
  }

  // During post-event cooldown, keep last label (fixes “everything becomes normal” bug)
  if (state.lastSwitchCooldown > 0) {
    return state.lastEvent;
  }

  const strictSnore = isStrictSnoreSpectrum(tonality, raw.lowRatio, raw.zcrNorm);
  let chosen: EventType = "normal_breathing";

  if (eRaw > t.difficultBreathingEffortMin && iRaw < t.mildSnoreMin - 4 && !strictSnore) {
    chosen = "difficult_breathing";
  } else if (strictSnore && iRaw >= t.loudSnoreMin) {
    chosen = "loud_snore";
  } else if (strictSnore && iRaw >= t.moderateSnoreMin) {
    chosen = "moderate_snore";
  } else if (strictSnore && iRaw >= t.mildSnoreMin) {
    chosen = "mild_snore";
  } else if (!strictSnore && iRaw <= t.normalMax + 24) {
    chosen = "normal_breathing";
  } else if (!strictSnore && iRaw < t.moderateSnoreMin) {
    chosen = "normal_breathing";
  } else if (!strictSnore && eRaw > t.difficultBreathingEffortMin - 6) {
    chosen = "difficult_breathing";
  } else if (iRaw > t.mildSnoreMin - 8) {
    chosen = strictSnore ? "mild_snore" : "difficult_breathing";
  }

  state.lastEvent = chosen;
  state.lastSwitchCooldown = chosen === "normal_breathing" ? 0 : 1;
  return chosen;
}
