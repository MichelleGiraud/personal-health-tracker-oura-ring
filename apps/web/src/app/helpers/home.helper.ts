import { DailySummaryRow, DailySummaryRowNormalized, ChartPoint, RhythmChartModel  } from "../types/types.home";

export function formatSleep(seconds: number | null) {
  if (!seconds || seconds < 1) return "-";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
 return `${hours}h ${minutes}m`;
}

export function formatDay(day: string | Date) {
  if (day instanceof Date) {
    return day.toISOString().slice(0, 10);
  }
  return day;
}

export function formatWeekdayLabel(day: string | Date) {
  const date = day instanceof Date ? day : new Date(day);
  if (Number.isNaN(date.getTime())) return formatDay(day).slice(5);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function formatTimestamp(value: string | Date | null) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export function buildLineChartPoints(
  rows: DailySummaryRowNormalized[],
  getValue: (row: DailySummaryRowNormalized) => number | null,
  width: number,
  height: number,
  padding = 24
) {
  const chartRows = [...rows].reverse(); // reverse the rows so that the oldest data is on the left
  const values = chartRows //numeric values for the chart (y-axis values)
    .map((row) => getValue(row))
    .filter((value): value is number => value !== null);

  if (values.length === 0) {
    return { points: [] as ChartPoint[], polyline: "", path: "" };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // range is the difference between the maximum and minimum values 
  const innerWidth = width - padding * 2; // padding is used for the y-axis and the x-axis    
  const innerHeight = height - padding * 2;
  const definedRows = chartRows.filter((row) => getValue(row) !== null);
  const count = definedRows.length;

  const points = definedRows  //array of points 
    .map((row, index) => {
      const rawValue = getValue(row);
      if (rawValue === null) return null;

      const x =
        count <= 1
          ? width / 2
          : padding + (index / (count - 1)) * innerWidth;
      const normalized = (rawValue - min) / range;
      const y = padding + (1 - normalized) * innerHeight;

      return {
        x,
        y,
        label: formatDay(row.day),
        value: rawValue,
      };
    })
    .filter((point): point is ChartPoint => point !== null);

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  return { points, polyline, path: buildSmoothPath(points) };
}

export function buildSmoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const controlX = (current.x + next.x) / 2;

    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

export function getRecoveryLabel(score: number | null) {
  if (score === null) return "No score";
  if (score >= 85) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  return "Low";
}

export function getRecoveryTone(score: number | null): "neutral" | "good" | "warn" {
  if (score === null) return "neutral";
  if (score >= 75) return "good";
  if (score >= 60) return "neutral";
  return "warn";
}

export function formatSteps(steps: number | null) {
  if (steps === null) return "-";
  return new Intl.NumberFormat("en-US").format(steps);
}

export function formatHrv(value: number | null) {
  if (value === null) return "-";
  return `${Math.round(value)} ms`;
}

export function formatBpm(value: number | null) {
  if (value === null) return "-";
  return `${Math.round(value)} bpm`;
}

export function getSleepTone(seconds: number | null): "good" | "neutral" | "warn" {
  if (seconds === null) return "neutral";
  if (seconds >= 7 * 3600) return "good";
  if (seconds >= 6 * 3600) return "neutral";
  return "warn";
}

export function getHrvSignal(
  hrv: number | null,
  baseline: number | null
): { label: "High" | "Normal" | "Low" | "No data"; tone: "good" | "neutral" | "warn"; message: string } {
  if (hrv === null || baseline === null) return { label: "No data", tone: "neutral", message: "Your recovery signal looks stable compared to baseline."};
  if (hrv >= baseline + 5) return { label: "High", tone: "good", message: "Your body looks well recovered and ready for higher strain."};
  if (hrv <= baseline - 5) return { label: "Low", tone: "warn", message: "Your nervous system looks stressed. Consider a lighter training day." };
  return { label: "Normal", tone: "neutral", message: "Your recovery signal looks stable compared to baseline." };
}

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeDailySummaryRow(row: DailySummaryRow): DailySummaryRowNormalized {
  return {
    ...row,
    sleep_total_seconds: toNumber(row.sleep_total_seconds),
    sleep_efficiency: toNumber(row.sleep_efficiency),
    readiness_score: toNumber(row.readiness_score),
    steps: toNumber(row.steps),
    activity_score: toNumber(row.activity_score),
    hrv_avg_ms: toNumber(row.hrv_avg_ms),
    resting_hr_bpm: toNumber(row.resting_hr_bpm),
    stress_high_minutes: toNumber(row.stress_high_minutes),
    recovery_high_minutes: toNumber(row.recovery_high_minutes),
    sleep_deep_seconds: toNumber(row.sleep_deep_seconds),
    sleep_rem_seconds: toNumber(row.sleep_rem_seconds),
    sleep_light_seconds: toNumber(row.sleep_light_seconds),
    sleep_awake_seconds: toNumber(row.sleep_awake_seconds),
    stress_day_summary: typeof row.stress_day_summary === "string" ? row.stress_day_summary : null,
  };
}

export function normalizeDailySummaryRows(rows: DailySummaryRow[]) {
  return rows.map(normalizeDailySummaryRow);
}

export function getBand(
  value: number | null,
  goodThreshold: number,
  lowThreshold: number,
  goodLabel = "High",
  midLabel = "Normal",
  lowLabel = "Low"
) {
  if (value === null) return "No data";
  if (value >= goodThreshold) return goodLabel;
  if (value <= lowThreshold) return lowLabel;
  return midLabel;
}

export function getPredictionPillTone(value: string | null): "neutral" | "good" | "warn" {
  if (!value) return "neutral";
  const normalized = value.trim().toLowerCase();

  if (normalized.includes("ready") || normalized.includes("high")) return "good";
  if (normalized.includes("recovery") || normalized.includes("low")) return "warn";
  return "neutral";
}

export function getYAxisTicks(values: number[]) {
  if (values.length === 0) return [] as number[];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mid = (min + max) / 2;
  return [max, mid, min].map((value) => Math.round(value * 10) / 10);
}

export function getXLabelPoints(points: Array<{ x: number; label: string }>) {
  if (points.length === 0) return [] as Array<{ x: number; label: string }>;
  if (points.length <= 3) {
    return points.map((point) => ({ x: point.x, label: point.label.slice(5) }));
  }

  const first = points[0];
  const middle = points[Math.floor(points.length / 2)];
  const last = points[points.length - 1];

  return [first, middle, last].map((point) => ({ x: point.x, label: point.label.slice(5) }));
}

export function getRecoveryDescription(points: RhythmChartModel["points"], range: number) {
  if (points.length < 2) {
    return `Not enough recovery data in the selected ${range}-day window`;
  }

  const first = points[0].value;
  const last = points[points.length - 1].value;
  const delta = last - first;
  const periodLabel = range <= 7 ? "this week" : "across the selected window";

  if (delta <= -4) return `Score trending down noticeably ${periodLabel}`;
  if (delta < -1) return `Score trending down slightly ${periodLabel}`;
  if (delta >= 4) return `Score improving clearly ${periodLabel}`;
  if (delta > 1) return `Score improving slightly ${periodLabel}`;
  return `Score holding relatively steady ${periodLabel}`;
}

export function getSleepDescription(points: RhythmChartModel["points"], range: number) {
  if (points.length === 0) {
    return `No sleep duration data in the selected ${range}-day window`;
  }

  const belowTargetCount = points.filter((point) => point.value < 7 * 3600).length;
  if (belowTargetCount === 0) {
    return `On target all ${points.length} days`;
  }

  return `Below target ${belowTargetCount} of ${points.length} days`;
}

export function getHrvDescription(points: RhythmChartModel["points"], range: number) {
  if (points.length < 2) {
    return `No HRV trend data in the selected ${range}-day window`;
  }

  const first = points[0].value;
  const last = points[points.length - 1].value;
  const delta = last - first;
  const periodLabel = range <= 7 ? "this week" : "across the selected window";

  if (delta <= -5) return `HRV trending down noticeably ${periodLabel}`;
  if (delta < -2) return `HRV trending down slightly ${periodLabel}`;
  if (delta >= 5) return `HRV improving clearly ${periodLabel}`;
  if (delta > 2) return `HRV improving slightly ${periodLabel}`;
  return `HRV holding relatively steady ${periodLabel}`;
}

export function getStressDescription(points: RhythmChartModel["points"], range: number) {
  if (points.length === 0) {
    return `No stress data in the selected ${range}-day window`;
  }

  const totalMinutes = points.reduce((sum, point) => sum + (point.value ?? 0), 0);
  const averageMinutes = Math.round(totalMinutes / points.length);

  const periodLabel = range <= 7 ? "this week" : "across the selected window";

  if (averageMinutes === 0) {
    return `No stress detected ${periodLabel}`;
  }

  return `Average ${averageMinutes} min/day ${periodLabel}`;
}

