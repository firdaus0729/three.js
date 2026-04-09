/** Returns semantic dashboard color for a 0–100 gauge value */
export function gaugeColor(value: number): {
  stroke: string;
  glow: string;
  label: string;
} {
  if (value < 40) {
    return {
      stroke: "#22c55e",
      glow: "rgba(34, 197, 94, 0.45)",
      label: "Normal",
    };
  }
  if (value < 70) {
    return {
      stroke: "#eab308",
      glow: "rgba(234, 179, 8, 0.45)",
      label: "Moderate",
    };
  }
  return {
    stroke: "#ef4444",
    glow: "rgba(239, 68, 68, 0.5)",
    label: "Elevated",
  };
}

/** Blend intensity + effort into RGB for the 3D sphere */
export function combinedStressRgb(intensity: number, effort: number): string {
  const v = Math.min(1, (intensity + effort) / 200);
  const r = Math.round(30 + v * 180);
  const g = Math.round(200 - v * 160);
  const b = Math.round(120 + v * 80);
  return `rgb(${r},${g},${b})`;
}
