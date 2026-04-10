import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const ROOT = process.cwd();
const CALIBRATION_DIR = path.join(ROOT, "assets", "calibration");
const SUMMARY_OUT = path.join(CALIBRATION_DIR, "calibration-summary.json");
const PROFILE_OUT = path.join(ROOT, "lib", "calibrationProfile.ts");

const FOLDER_TO_CATEGORY = [
  ["NORMAL BREATH", "normal"],
  ["normal", "normal"],
  ["Low Snoring", "mild_snore"],
  ["Moderate Snoring", "moderate_snore"],
  ["STRONG SNORING", "loud_snore"],
  ["Hypopnea", "hypopnea"],
  ["APNEA & STRONG SNORING", "apnea"],
];

function listMediaFilesRecursive(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listMediaFilesRecursive(abs));
    else if (/\.(mp3|wav|m4a|wma|aac|flac|ogg|opus|webm|mp4)$/i.test(e.name)) out.push(abs);
  }
  return out;
}

function detectCategoryFromPath(filePath) {
  const parent = path.basename(path.dirname(filePath)).trim().toLowerCase();
  for (const [folderName, key] of FOLDER_TO_CATEGORY) {
    if (parent === folderName.toLowerCase()) return key;
  }
  return "unknown";
}

function runVolumeDetect(filePath) {
  const args = [
    "-hide_banner",
    "-nostats",
    "-i",
    filePath,
    "-af",
    "volumedetect",
    "-vn",
    "-sn",
    "-dn",
    "-f",
    "null",
    "-",
  ];
  const res = spawnSync(ffmpegPath, args, { encoding: "utf8" });
  const txt = `${res.stdout || ""}\n${res.stderr || ""}`;
  const mean = txt.match(/mean_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/i);
  const max = txt.match(/max_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/i);
  return {
    meanDb: mean ? Number(mean[1]) : null,
    maxDb: max ? Number(max[1]) : null,
    ok: res.status === 0 || !!mean,
  };
}

function dbToIntensity(db) {
  if (db == null || Number.isNaN(db)) return 0;
  const clamped = Math.max(-60, Math.min(0, db));
  return ((clamped + 60) / 60) * 100;
}

function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function std(values, m) {
  if (values.length < 2) return 0;
  const v = values.reduce((a, x) => a + (x - m) ** 2, 0) / values.length;
  return Math.sqrt(v);
}

function percentile(sortedAsc, p) {
  if (!sortedAsc.length) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.max(0, Math.floor((p / 100) * sortedAsc.length)));
  return sortedAsc[idx];
}

function round2(n) {
  return Number(n.toFixed(2));
}

function makePrototype(intensityMean, intensityStd, effortHint, tonalityHint) {
  return {
    intensityMean: round2(intensityMean),
    intensityStd: round2(Math.max(4, intensityStd)),
    effortHint: round2(effortHint),
    tonalityHint: round2(tonalityHint),
  };
}

function main() {
  if (!fs.existsSync(CALIBRATION_DIR)) {
    console.error(`Missing calibration dir: ${CALIBRATION_DIR}`);
    process.exit(1);
  }
  const files = listMediaFilesRecursive(CALIBRATION_DIR);
  if (!files.length) {
    console.error("No calibration media files found.");
    process.exit(1);
  }

  const perCategory = new Map();
  for (const f of files) {
    const cat = detectCategoryFromPath(f);
    const stats = runVolumeDetect(f);
    if (!stats.ok || cat === "unknown") continue;
    const sample = {
      file: path.relative(ROOT, f),
      category: cat,
      meanDb: stats.meanDb,
      maxDb: stats.maxDb,
      meanIntensity: dbToIntensity(stats.meanDb),
      peakIntensity: dbToIntensity(stats.maxDb),
    };
    const arr = perCategory.get(cat) ?? [];
    arr.push(sample);
    perCategory.set(cat, arr);
  }

  const summary = {};
  for (const [cat, arr] of perCategory.entries()) {
    const means = arr.map((x) => x.meanIntensity);
    const peaks = arr.map((x) => x.peakIntensity);
    const m = mean(means);
    summary[cat] = {
      count: arr.length,
      meanIntensityAvg: round2(m),
      meanIntensityStd: round2(std(means, m)),
      peakIntensityAvg: round2(mean(peaks)),
      samples: arr,
    };
  }
  fs.writeFileSync(SUMMARY_OUT, JSON.stringify(summary, null, 2), "utf8");

  const normal = summary.normal?.meanIntensityAvg ?? 26;
  const normalStd = summary.normal?.meanIntensityStd ?? 6;
  const mild = summary.mild_snore?.meanIntensityAvg ?? 42;
  const moderate = summary.moderate_snore?.meanIntensityAvg ?? 58;
  const loud = summary.loud_snore?.meanIntensityAvg ?? 72;
  const hypopneaAvg = summary.hypopnea?.meanIntensityAvg ?? 28;
  const hypopneaStd = summary.hypopnea?.meanIntensityStd ?? 7;

  const normalMeans = (summary.normal?.samples ?? []).map((s) => s.meanIntensity).sort((a, b) => a - b);
  const normalP10 = percentile(normalMeans, 10) || normal * 0.85;

  const apneaSilenceIntensityMax = Math.max(2, Math.min(14, Math.round(normalP10 * 0.45)));
  const hypopneaIntensityMax = Math.max(
    apneaSilenceIntensityMax + 4,
    Math.min(48, Math.round(Math.min(hypopneaAvg + hypopneaStd, normal + 8)))
  );

  const normalMax = Math.max(18, Math.min(46, Math.round(normal + normalStd * 0.8)));
  const mildSnoreMin = Math.max(24, Math.min(58, Math.round((normal + mild) / 2)));
  const moderateSnoreMin = Math.max(38, Math.min(72, Math.round((mild + moderate) / 2)));
  const loudSnoreMin = Math.max(52, Math.min(88, Math.round((moderate + loud) / 2)));

  const prototypes = {
    normal_breathing: makePrototype(normal, normalStd, 34, 0.28),
    difficult_breathing: makePrototype(Math.min(mildSnoreMin - 3, normalMax + 3), normalStd + 2, 66, 0.24),
    mild_snore: makePrototype(mild, summary.mild_snore?.meanIntensityStd ?? 6, 50, 0.42),
    moderate_snore: makePrototype(moderate, summary.moderate_snore?.meanIntensityStd ?? 6, 58, 0.5),
    loud_snore: makePrototype(loud, summary.loud_snore?.meanIntensityStd ?? 6, 66, 0.58),
  };

  const content = `export const CALIBRATION_PROFILE = {
  generatedAt: ${JSON.stringify(new Date().toISOString())},
  source: "assets/calibration",
  thresholds: {
    apneaSilenceIntensityMax: ${apneaSilenceIntensityMax},
    hypopneaIntensityMax: ${hypopneaIntensityMax},
    normalMax: ${normalMax},
    mildSnoreMin: ${mildSnoreMin},
    moderateSnoreMin: ${moderateSnoreMin},
    loudSnoreMin: ${loudSnoreMin},
    difficultBreathingEffortMin: 60
  },
  durationsMs: {
    apneaMin: 10000,
    hypopneaMin: 10000
  },
  prototypes: ${JSON.stringify(prototypes, null, 2)}
} as const;
`;
  fs.writeFileSync(PROFILE_OUT, content, "utf8");
  console.log(`Calibration summary: ${SUMMARY_OUT}`);
  console.log(`Calibration profile: ${PROFILE_OUT}`);
}

main();

