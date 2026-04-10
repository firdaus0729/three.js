"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { EventType, TimelineEvent } from "@/lib/types";

export interface ExportMeta {
  clipName: string | null;
  durationMs: number;
  generatedAt: Date;
  eventCounts: Record<EventType, number>;
  dashboardSnapshotDataUrl?: string;
}

function formatClock(ms: number) {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60) % 60;
  const h = Math.floor(totalSec / 3600);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function labelForType(type: EventType) {
  switch (type) {
    case "loud_snore":
      return "Loud snore";
    case "moderate_snore":
      return "Moderate snore";
    case "mild_snore":
      return "Mild snore";
    case "difficult_breathing":
      return "Difficult breathing";
    case "normal_breathing":
      return "Normal breathing";
    case "apnea":
      return "Apnea";
    case "hypopnea":
      return "Hypopnea";
    default:
      return type;
  }
}

function safeName(base: string) {
  return base.replace(/[^\w.-]+/g, "_");
}

export function exportCsvReport(events: TimelineEvent[], meta: ExportMeta) {
  const lines: string[] = [];
  lines.push("# Sleep Clip Analysis Export");
  lines.push(`# Clip Name,${meta.clipName ?? "unknown"}`);
  lines.push(`# Duration,${formatClock(meta.durationMs)}`);
  lines.push(`# Generated At,${meta.generatedAt.toISOString()}`);
  lines.push(`# Total Events,${events.length}`);
  lines.push(`# Loud Snore,${meta.eventCounts.loud_snore}`);
  lines.push(`# Moderate Snore,${meta.eventCounts.moderate_snore}`);
  lines.push(`# Mild Snore,${meta.eventCounts.mild_snore}`);
  lines.push(`# Difficult Breathing,${meta.eventCounts.difficult_breathing}`);
  lines.push(`# Normal Breathing,${meta.eventCounts.normal_breathing}`);
  lines.push(`# Apnea,${meta.eventCounts.apnea}`);
  lines.push(`# Hypopnea,${meta.eventCounts.hypopnea}`);
  lines.push("");
  lines.push("event_id,timestamp,event_type,intensity,effort");

  for (const ev of events) {
    lines.push(
      `${ev.id},${formatClock(ev.offsetMs)},${labelForType(ev.type)},${ev.snapshot.intensity},${ev.snapshot.effort}`
    );
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeName(`${meta.clipName ?? "clip"}_analysis_full.csv`);
  a.click();
  URL.revokeObjectURL(url);
}

interface MinuteAggregate {
  minute: number;
  total: number;
  loud: number;
  moderate: number;
  mild: number;
  difficult: number;
  normal: number;
  apnea: number;
  hypopnea: number;
  intensityAvg: number;
  effortAvg: number;
}

function buildMinuteAggregates(events: TimelineEvent[]): MinuteAggregate[] {
  const map = new Map<number, MinuteAggregate & { iSum: number; eSum: number }>();
  for (const ev of events) {
    const minute = Math.floor(ev.offsetMs / 60000);
    const cur =
      map.get(minute) ??
      ({
        minute,
        total: 0,
        loud: 0,
        moderate: 0,
        mild: 0,
        difficult: 0,
        normal: 0,
        apnea: 0,
        hypopnea: 0,
        intensityAvg: 0,
        effortAvg: 0,
        iSum: 0,
        eSum: 0,
      } as MinuteAggregate & { iSum: number; eSum: number });
    cur.total += 1;
    cur.iSum += ev.snapshot.intensity;
    cur.eSum += ev.snapshot.effort;
    if (ev.type === "loud_snore") cur.loud += 1;
    if (ev.type === "moderate_snore") cur.moderate += 1;
    if (ev.type === "mild_snore") cur.mild += 1;
    if (ev.type === "difficult_breathing") cur.difficult += 1;
    if (ev.type === "normal_breathing") cur.normal += 1;
    if (ev.type === "apnea") cur.apnea += 1;
    if (ev.type === "hypopnea") cur.hypopnea += 1;
    map.set(minute, cur);
  }

  return Array.from(map.values())
    .sort((a, b) => a.minute - b.minute)
    .map((r) => ({
      minute: r.minute,
      total: r.total,
      loud: r.loud,
      moderate: r.moderate,
      mild: r.mild,
      difficult: r.difficult,
      normal: r.normal,
      apnea: r.apnea,
      hypopnea: r.hypopnea,
      intensityAvg: Math.round((r.iSum / Math.max(1, r.total)) * 10) / 10,
      effortAvg: Math.round((r.eSum / Math.max(1, r.total)) * 10) / 10,
    }));
}

export function exportPdfReport(events: TimelineEvent[], meta: ExportMeta) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const marginX = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  let sectionY = 44;

  doc.setFontSize(16);
  doc.text("Sleep Clip Analysis Report", marginX, sectionY);

  if (meta.dashboardSnapshotDataUrl) {
    try {
      const imgTop = sectionY + 12;
      const imgMaxWidth = pageWidth - marginX * 2;
      const imgMaxHeight = 240;
      const imgProps = doc.getImageProperties(meta.dashboardSnapshotDataUrl);
      const imgRatio = imgProps.width / imgProps.height;
      let drawWidth = imgMaxWidth;
      let drawHeight = drawWidth / imgRatio;
      if (drawHeight > imgMaxHeight) {
        drawHeight = imgMaxHeight;
        drawWidth = drawHeight * imgRatio;
      }
      const drawX = marginX + (imgMaxWidth - drawWidth) / 2;
      doc.addImage(meta.dashboardSnapshotDataUrl, "PNG", drawX, imgTop, drawWidth, drawHeight);
      sectionY = imgTop + drawHeight + 24;
    } catch {
      sectionY += 20;
    }
  } else {
    sectionY += 20;
  }

  doc.setFontSize(10);
  doc.text(`Clip: ${meta.clipName ?? "unknown"}`, marginX, sectionY);
  doc.text(`Duration: ${formatClock(meta.durationMs)}`, marginX, sectionY + 14);
  doc.text(`Generated: ${meta.generatedAt.toISOString()}`, marginX, sectionY + 28);
  doc.text(`Total Events: ${events.length}`, marginX, sectionY + 42);

  autoTable(doc, {
    startY: sectionY + 60,
    head: [["Class", "Count"]],
    body: [
      ["Apnea", String(meta.eventCounts.apnea)],
      ["Hypopnea", String(meta.eventCounts.hypopnea)],
      ["Loud snore", String(meta.eventCounts.loud_snore)],
      ["Moderate snore", String(meta.eventCounts.moderate_snore)],
      ["Mild snore", String(meta.eventCounts.mild_snore)],
      ["Difficult breathing", String(meta.eventCounts.difficult_breathing)],
      ["Normal breathing", String(meta.eventCounts.normal_breathing)],
    ],
    styles: { fontSize: 9 },
  });

  const minuteRows = buildMinuteAggregates(events);
  autoTable(doc, {
    startY: (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
      ? (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 16
      : 230,
    head: [[
      "Minute",
      "Events",
      "Apnea",
      "Hypopnea",
      "Loud",
      "Moderate",
      "Mild",
      "Difficult",
      "Normal",
      "Avg Intensity",
      "Avg Effort",
    ]],
    body: minuteRows.map((m) => [
      `${m.minute}`,
      `${m.total}`,
      `${m.apnea}`,
      `${m.hypopnea}`,
      `${m.loud}`,
      `${m.moderate}`,
      `${m.mild}`,
      `${m.difficult}`,
      `${m.normal}`,
      `${m.intensityAvg}`,
      `${m.effortAvg}`,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 24, 39] },
  });

  // Render detailed rows in chunks to avoid memory spikes on long recordings.
  const ROW_CHUNK = 1800;
  let offset = 0;
  while (offset < events.length) {
    const batch = events.slice(offset, offset + ROW_CHUNK);
    autoTable(doc, {
      startY: (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
        ? (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 18
        : 300,
      head: [["Timestamp", "Type", "Intensity", "Effort"]],
      body: batch.map((ev) => [
        formatClock(ev.offsetMs),
        labelForType(ev.type),
        String(ev.snapshot.intensity),
        String(ev.snapshot.effort),
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [7, 89, 133] },
      didDrawPage: () => {
        const p = doc.getCurrentPageInfo().pageNumber;
        doc.setFontSize(8);
        doc.text(`Page ${p}`, pageWidth - 70, doc.internal.pageSize.getHeight() - 16);
      },
    });
    offset += ROW_CHUNK;
  }

  doc.save(safeName(`${meta.clipName ?? "clip"}_analysis_full.pdf`));
}

