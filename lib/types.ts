export type EventType =
  | "heavy_snore"
  | "slow_snore"
  | "normal_breathing"
  | "breathing_interruption";

export interface MetricSnapshot {
  intensity: number;
  effort: number;
}

export interface TimelineEvent {
  id: string;
  offsetMs: number;
  type: EventType;
  snapshot: MetricSnapshot;
}

export type DataSourceMode = "simulation" | "media";

export type AnalysisStatus = "idle" | "loading" | "running" | "completed" | "error";

export const EVENT_LABELS: Record<EventType, string> = {
  heavy_snore: "Heavy snore",
  slow_snore: "Slow snore",
  normal_breathing: "Normal breathing",
  breathing_interruption: "Breathing interruption",
};
