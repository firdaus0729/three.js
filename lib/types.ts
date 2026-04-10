export type EventType =
  | "loud_snore"
  | "moderate_snore"
  | "mild_snore"
  | "difficult_breathing"
  | "normal_breathing"
  | "apnea"
  | "hypopnea";

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
  loud_snore: "Loud snore",
  moderate_snore: "Moderate snore",
  mild_snore: "Mild snore",
  difficult_breathing: "Difficult breathing",
  normal_breathing: "Normal breathing",
  apnea: "Apnea",
  hypopnea: "Hypopnea",
};
