export const CALIBRATION_PROFILE = {
  generatedAt: "2026-04-10T13:27:54.225Z",
  source: "assets/calibration",
  thresholds: {
    apneaSilenceIntensityMax: 10,
    hypopneaIntensityMax: 36,
    normalMax: 31,
    mildSnoreMin: 41,
    moderateSnoreMin: 59,
    loudSnoreMin: 65,
    difficultBreathingEffortMin: 60
  },
  durationsMs: {
    apneaMin: 10000,
    hypopneaMin: 10000
  },
  prototypes: {
  "normal_breathing": {
    "intensityMean": 27.83,
    "intensityStd": 4,
    "effortHint": 34,
    "tonalityHint": 0.28
  },
  "difficult_breathing": {
    "intensityMean": 34,
    "intensityStd": 5.61,
    "effortHint": 66,
    "tonalityHint": 0.24
  },
  "mild_snore": {
    "intensityMean": 53.43,
    "intensityStd": 11.33,
    "effortHint": 50,
    "tonalityHint": 0.42
  },
  "moderate_snore": {
    "intensityMean": 64.97,
    "intensityStd": 4.37,
    "effortHint": 58,
    "tonalityHint": 0.5
  },
  "loud_snore": {
    "intensityMean": 64.36,
    "intensityStd": 4,
    "effortHint": 66,
    "tonalityHint": 0.58
  }
}
} as const;
