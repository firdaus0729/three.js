import type { EventType, MetricSnapshot } from "./types";

/** Low-pass filtered noise for smooth, non-random-looking variation */
export function createSmoothedNoise(seed: number) {
  let s = seed;
  let value = 0;
  return (alpha: number) => {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280;
    value = value * (1 - alpha) + r * alpha;
    return value;
  };
}

export interface SimulationState {
  t: number;
  phase: number;
  intensityBase: number;
  effortBase: number;
  noiseI: ReturnType<typeof createSmoothedNoise>;
  noiseE: ReturnType<typeof createSmoothedNoise>;
  interruptionCooldown: number;
}

export function createInitialSimulation(seed = 42_069): SimulationState {
  return {
    t: 0,
    phase: 0,
    intensityBase: 45,
    effortBase: 40,
    noiseI: createSmoothedNoise(seed),
    noiseE: createSmoothedNoise(seed + 999),
    interruptionCooldown: 0,
  };
}

function classifyEvent(
  intensity: number,
  effort: number,
  breathPhase: number,
  state: SimulationState
): EventType {
  const snoreWave = Math.sin(breathPhase * 0.8);
  const isPeak = snoreWave > 0.65;

  if (state.interruptionCooldown <= 0 && intensity < 22 && effort > 55) {
    state.interruptionCooldown = 8;
    return "breathing_interruption";
  }

  if (intensity > 72 && effort > 60 && isPeak) {
    return "heavy_snore";
  }
  if (intensity > 48 && intensity <= 72 && snoreWave > 0.2) {
    return "slow_snore";
  }
  if (intensity < 35 && effort < 45) {
    return "normal_breathing";
  }
  if (effort > 65) {
    return "heavy_snore";
  }
  if (intensity > 55) {
    return "slow_snore";
  }
  return "normal_breathing";
}

export function simulationTick(
  state: SimulationState,
  dtMs: number
): { snapshot: MetricSnapshot; type: EventType } {
  state.t += dtMs;
  state.phase += dtMs * 0.0022;
  if (state.interruptionCooldown > 0) {
    state.interruptionCooldown -= dtMs / 700;
  }

  const breath = Math.sin(state.phase);
  const slowMod = Math.sin(state.phase * 0.37 + 1.2) * 18;
  const ripple = Math.sin(state.phase * 2.1) * 8;

  const nI = state.noiseI(0.12) * 28 - 14;
  const nE = state.noiseE(0.1) * 22 - 11;

  state.intensityBase = Math.max(
    0,
    Math.min(100, state.intensityBase + (state.noiseI(0.04) - 0.5) * 3)
  );
  state.effortBase = Math.max(
    0,
    Math.min(100, state.effortBase + (state.noiseE(0.04) - 0.5) * 2.5)
  );

  const breathPhase = state.phase + breath * 0.5;
  const intensity = Math.max(
    0,
    Math.min(
      100,
      state.intensityBase +
        breath * 22 +
        slowMod * 0.35 +
        ripple * 0.4 +
        nI
    )
  );
  const effort = Math.max(
    0,
    Math.min(
      100,
      state.effortBase +
        Math.abs(breath) * 20 +
        slowMod * 0.25 +
        nE +
        (breath < -0.3 ? 12 : 0)
    )
  );

  const type = classifyEvent(intensity, effort, breathPhase, state);

  return {
    snapshot: {
      intensity: Math.round(intensity * 10) / 10,
      effort: Math.round(effort * 10) / 10,
    },
    type,
  };
}
