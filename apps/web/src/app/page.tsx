import { query } from "@/lib/db";
import { DashboardTopBar } from "./components/home/DashboardTopBar";
import { RecoverySnapshot } from "./components/home/RecoverySnapshot";
import { EmptyDashboardState } from "./components/home/EmptyDashboardState";
import { MetricsOverviewSection } from "./components/home/MetricsOverviewSection";
import { RecoveryDetailsSection } from "./components/home/RecoveryDetailsSection";
import { TodaysGuidanceSection } from "./components/home/TodaysGuidanceSection";
import { AIPredictionsInsightsSection } from "./components/home/AIPredictionsInsightsSection";
import { fetchAiPrediction } from "./helpers/ai.server";
import {
  buildLineChartPoints,
  formatTimestamp,
  getBand,
  getHrvSignal,
  formatSleep,
  getRecoveryLabel,
  getYAxisTicks,
  normalizeDailySummaryRow,
  normalizeDailySummaryRows,
  getStepsDescription,
  getRestingHrDescription,
} from "./helpers/home.helper";
import type {
  ActiveUserRow,
  DailySummaryRow,
  DailySummaryRowNormalized,
  LastSyncedRow,
} from "./types/types.home";
import TodaysKeySignals from "./components/home/TodaysKeySignals";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string; metric?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  const activeUserRes = await query<ActiveUserRow>(
    `select user_id
     from oura_token
     order by updated_at desc
     limit 1`
  );

  const activeUserId = activeUserRes.rows[0]?.user_id ?? null;
  const allowedRanges = [7, 14, 30, 90];
  const parsedRange = Number(resolvedSearchParams?.range);
  const range = allowedRanges.includes(parsedRange) ? parsedRange : 7;

  const aiPrediction = await fetchAiPrediction(activeUserId);

  const latestRes = activeUserId
    ? await query<DailySummaryRow>(
        `select day, sleep_total_seconds, sleep_efficiency, readiness_score, steps, activity_score, hrv_avg_ms, resting_hr_bpm,
                stress_high_minutes, recovery_high_minutes, stress_day_summary,
                sleep_deep_seconds, sleep_rem_seconds, sleep_light_seconds, sleep_awake_seconds
         from daily_summary
         where user_id = $1
         order by day desc
         limit 1`,
        [activeUserId]
      )
    : { rows: [] };

  const lastSyncedRes = activeUserId
    ? await query<LastSyncedRow>(
        `select max(updated_at) as last_synced_at
         from daily_summary
         where user_id = $1`,
        [activeUserId]
      )
    : { rows: [] };

  const historyRes = activeUserId
    ? await query<DailySummaryRow>(
        `select day, sleep_total_seconds, sleep_efficiency, readiness_score, steps, activity_score, hrv_avg_ms, resting_hr_bpm,
                stress_high_minutes, recovery_high_minutes, stress_day_summary,
                sleep_deep_seconds, sleep_rem_seconds, sleep_light_seconds, sleep_awake_seconds
         from daily_summary
         where user_id = $1
         order by day desc
         limit 7`,
        [activeUserId]
      )
    : { rows: [] };

  const chartRes = activeUserId
    ? await query<DailySummaryRow>(
        `select day, sleep_total_seconds, sleep_efficiency, readiness_score, steps, activity_score, hrv_avg_ms, resting_hr_bpm,
                stress_high_minutes, recovery_high_minutes, stress_day_summary,
                sleep_deep_seconds, sleep_rem_seconds, sleep_light_seconds, sleep_awake_seconds
         from daily_summary
         where user_id = $1
         order by day desc
         limit $2`,
        [activeUserId, range]
      )
    : { rows: [] };

  const latestRaw = latestRes.rows[0] ?? null;
  const latest: DailySummaryRowNormalized | null = latestRaw ? normalizeDailySummaryRow(latestRaw) : null;
  const lastSynced = lastSyncedRes.rows[0]?.last_synced_at ?? null;
  const chartRowsN = normalizeDailySummaryRows(chartRes.rows);
  const historyRowsN = normalizeDailySummaryRows(historyRes.rows);

  const latestSleepRow = chartRowsN.find((row) => row.sleep_total_seconds !== null) ?? null;
  const readinessRows = chartRowsN.filter((row) => row.readiness_score !== null);
  const latestReadinessRow = readinessRows[0] ?? null;
  const latestStepsRow = chartRowsN.find((row) => row.steps !== null) ?? null;
  const latestHrvRow = chartRowsN.find((row) => row.hrv_avg_ms !== null) ?? null;
  const latestStressRow = chartRowsN.find((row) => row.stress_high_minutes !== null) ?? null;

  const sleepBreakdownRows = chartRowsN.filter((row) =>
    [row.sleep_deep_seconds, row.sleep_rem_seconds, row.sleep_light_seconds, row.sleep_awake_seconds].some(
      (value) => value !== null && value > 0
    )
  );

  const averageSleepStageSeconds = (pickStage: (row: DailySummaryRowNormalized) => number | null) =>
    sleepBreakdownRows.length === 0
      ? null
      : Math.round(
          sleepBreakdownRows.reduce((sum, row) => sum + (pickStage(row) ?? 0), 0) /
            sleepBreakdownRows.length
        );

  const sleepBreakdown = {
    deep: averageSleepStageSeconds((row) => row.sleep_deep_seconds),
    rem: averageSleepStageSeconds((row) => row.sleep_rem_seconds),
    light: averageSleepStageSeconds((row) => row.sleep_light_seconds),
    awake: averageSleepStageSeconds((row) => row.sleep_awake_seconds),
  };

  const sleepBreakdownDescription =
    sleepBreakdownRows.length > 0
      ? `Average per recorded night from ${sleepBreakdownRows.length} ${
          sleepBreakdownRows.length === 1 ? "night" : "nights"
        } in the selected ${range}-day window.`
      : `No sleep stage data in the selected ${range}-day window.`;

  const rhythmChartWidth = 720;
  const rhythmChartHeight = 320;
  const rhythmChartPadding = 54;

  const chartWidth = 720;
  const chartHeight = 260;

  const recoveryChart = buildLineChartPoints(
    chartRowsN,
    (row) => row.readiness_score,
    rhythmChartWidth,
    rhythmChartHeight,
    rhythmChartPadding
  );
  const sleepRhythmChart = buildLineChartPoints(
    chartRowsN,
    (row) => row.sleep_total_seconds,
    rhythmChartWidth,
    rhythmChartHeight,
    rhythmChartPadding
  );

  const stressRhythmChart = buildLineChartPoints(
    chartRowsN,
    (row) => row.stress_high_minutes,
    rhythmChartWidth,
    rhythmChartHeight,
    rhythmChartPadding
  );

  const stepsChart = buildLineChartPoints(
    chartRowsN,
    (row) => row.steps,
    rhythmChartWidth,
    rhythmChartHeight,
    rhythmChartPadding
  );

  const restingHrChart = buildLineChartPoints(
    chartRowsN,
    (row) => row.resting_hr_bpm,
    rhythmChartWidth,
    rhythmChartHeight,
    rhythmChartPadding
  );

  const hrvChart = buildLineChartPoints(chartRowsN, (row) => row.hrv_avg_ms, chartWidth, chartHeight);
  const hrvValues = [...chartRowsN]
    .reverse()
    .map((row) => row.hrv_avg_ms)
    .filter((value): value is number => value !== null);
  const recoveryValues = [...chartRowsN]
    .reverse()
    .map((row) => row.readiness_score)
    .filter((value): value is number => value !== null);
  const sleepValues = [...chartRowsN]
    .reverse()
    .map((row) => row.sleep_total_seconds)
    .filter((value): value is number => value !== null);
  const stressValues = [...chartRowsN]
    .reverse()
    .map((row) => row.stress_high_minutes)
    .filter((value): value is number => value !== null);
  const latestReadiness = latestReadinessRow?.readiness_score ?? null;
  const latestActivityScore = latest?.activity_score ?? null;
  const latestHrv = latestHrvRow?.hrv_avg_ms ?? null;
  const latestStressHigh = latestStressRow?.stress_high_minutes ?? null;
  const activityPaused = latestActivityScore === null && (latest?.steps ?? null) !== null;
  const hrvBaseline =
    hrvValues.length > 0 ? Math.round(hrvValues.reduce((sum, value) => sum + value, 0) / hrvValues.length) : null;
  const stressBaseline =
    stressValues.length > 0
      ? Math.round(stressValues.reduce((sum, value) => sum + value, 0) / stressValues.length)
      : null;
  const hrvDelta = latestHrv !== null && hrvBaseline !== null ? Math.round(latestHrv - hrvBaseline) : null;
  const stressDelta =
    latestStressHigh !== null && stressBaseline !== null ? latestStressHigh - stressBaseline : null;

  const hrvSignal = getHrvSignal(latestHrv, hrvBaseline);

  const summaryLine =
    latestReadiness === null || latestHrv === null || hrvBaseline === null
      ? "Sync once to get your daily recovery story."
      : latestReadiness >= 80 && latestHrv >= hrvBaseline
        ? "Your recovery looks strong because HRV is above baseline and sleep is on target."
        : latestReadiness >= 60 && latestHrv > hrvBaseline - 5
          ? "Recovery looks okay. Keep effort moderate and stay consistent tonight."
          : "Recovery is lower today because HRV dipped and your system needs a lighter day.";

  const recoveryLabel = getRecoveryLabel(latestReadiness);
  const rangeOptions = allowedRanges.map((days) => ({ label: `${days}D`, value: String(days) }));

  const recoveryState = getBand(latestReadiness, 75, 60, "High", "Normal", "Low");
  const sleepState = getBand(
    latestSleepRow?.sleep_total_seconds ?? null,
    7 * 3600,
    6 * 3600,
    "On target",
    "Normal",
    "Low"
  );
  const stressState =
    latestStressHigh === null
      ? "No data"
      : latestStressHigh >= 120
        ? "High"
        : latestStressHigh >= 60
          ? "Balanced"
          : "Low";
  const activityState =
    activityPaused
      ? "Paused"
      : latestStepsRow?.steps === null || latestStepsRow?.steps === undefined
        ? "No data"
        : latestStepsRow.steps >= 10000
          ? "High"
          : latestStepsRow.steps >= 7000
            ? "Moderate"
            : "Low";
  const overallState =
    latestReadiness !== null && latestReadiness >= 75 && sleepState !== "Low" && stressState !== "High"
      ? "Ready"
      : latestReadiness !== null && latestReadiness >= 60
        ? "Slight fatigue"
        : "Recovery needed";

  const sleepConsistencyCount = historyRowsN.filter(
    (row) => row.sleep_total_seconds !== null && row.sleep_total_seconds >= 7 * 3600
  ).length;

  const loadState =
  stressDelta !== null && stressDelta >= 30
    ? "Elevated"
    : activityPaused
      ? "Paused"
      : "Balanced";

const bodySummary =
  sleepState === "Low" && hrvSignal.label === "High"
    ? "Sleep is currently limiting your energy, while HRV shows good resilience."
    : sleepState === "Low"
      ? "Sleep is limiting recovery and lowering your available energy today."
      : hrvSignal.label === "Low"
        ? "Your nervous system looks taxed, even if other signals are stable."
        : "Your body is relatively stable, with no major recovery limiter standing out.";

const movementGuidance =
  latestReadiness !== null && latestReadiness >= 75
    ? "You can train normally, but stay aware of how energy evolves through the day."
    : latestReadiness !== null && latestReadiness >= 60
      ? "Choose walking, mobility or light cardio. Avoid high-intensity effort."
      : "Keep movement light and restorative. Prioritize recovery over output.";

const recoveryFocus =
  sleepState === "Low"
    ? "Prioritize an earlier wind-down tonight."
    : hrvSignal.label === "Low"
      ? "Reduce nervous-system load and aim for a lower-stimulation evening."
      : "Protect consistency tonight so recovery stays supported.";

  const sleepConsistencyGuidance =
    sleepConsistencyCount === range
      ? "Excellent consistency. Keep it up."
      : sleepConsistencyCount >= range - 2
        ? "Good consistency. Aim to maintain this pattern."
        : "Inconsistent sleep pattern detected. Prioritize a regular bedtime and wake time to build better sleep debt.";

  const todaysSignalCards = [
  {
    eyebrow: "Sleep Signal",
    state: sleepState,
    value: formatSleep(latestSleepRow?.sleep_total_seconds ?? null),
    line1:
      sleepState === "Low"
        ? "Below recovery range."
        : sleepState === "On target"
          ? "Within your recovery range."
          : "Close to your recent rhythm.",
    line2:
      sleepState === "Low"
        ? "Main limiter today."
        : "Sleep is not the main limiter today.",
    tone: "sleep" as const,
  },
  {
    eyebrow: "Resilience Signal",
    state: hrvSignal.label === "High" ? "Strong" : hrvSignal.label,
    value: latestHrv === null ? "--" : `${Math.round(latestHrv)}ms`,
    line1:
      hrvDelta !== null && hrvDelta > 0
        ? "Above recent baseline."
        : hrvDelta !== null && hrvDelta < 0
          ? "Below recent baseline."
          : "Near recent baseline.",
    line2:
      hrvSignal.label === "High"
        ? "Strong recovery capacity."
        : hrvSignal.label === "Low"
          ? "Recovery capacity is reduced."
          : "Your nervous system looks steady.",
    tone: "hrv" as const,
  },
  {
    eyebrow: "Load Signal",
    state:
      activityPaused
        ? "Paused"
        : stressDelta !== null && stressDelta >= 30
          ? "Elevated"
          : "Balanced",
    value:
      activityPaused
        ? "Activity paused"
        : stressDelta !== null && stressDelta >= 30
          ? "High load"
          : "Moderate load",
    line1:
      activityPaused
        ? "Activity score is not available."
        : stressDelta !== null && stressDelta >= 30
          ? "More strain than usual."
          : "Load is within your recent range.",
    line2:
      activityPaused
        ? "Use recovery signals as your guide."
        : stressDelta !== null && stressDelta >= 30
          ? "Keep effort moderate."
          : "Current load looks manageable.",
    tone: "load" as const,
  },
];

  const stepsValues = [...chartRowsN].reverse().map((r) => r.steps).filter((v): v is number => v !== null);
  const restingHrValues = [...chartRowsN].reverse().map((r) => r.resting_hr_bpm).filter((v): v is number => v !== null);

  const recoveryYAxisTicks = getYAxisTicks(recoveryValues);
  const sleepYAxisTicks = getYAxisTicks(sleepValues.map((value) => value / 3600));
  const hrvYAxisTicks = getYAxisTicks(hrvValues);
  const stressYAxisTicks = getYAxisTicks(stressValues);
  const stepsYAxisTicks = getYAxisTicks(stepsValues.map((v) => v / 1000));
  const restingHrYAxisTicks = getYAxisTicks(restingHrValues);
  const heroHeadline =
    latestReadiness === null
      ? "Your body is waiting for more recovery data."
      : latestReadiness >= 80
        ? "Your body looks ready for a strong day."
        : latestReadiness >= 60
          ? "Your body is carrying slight fatigue today."
          : "Your body is asking for recovery today.";
  const heroSummary =
    latestReadiness === null
      ? "Sync more recent sleep, recovery and stress data to unlock a clearer body signal."
      : summaryLine;
  const signalChips = [
    `Sleep · ${sleepState}`,
    `HRV · ${hrvSignal.label}`,
    `Load · ${activityPaused ? "Paused" : activityState}`,
  ];

  return (
    <main className="min-h-screen bg-transparent px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <DashboardTopBar
          rangeOptions={rangeOptions}
          range={range}
          lastSyncedLabel={formatTimestamp(lastSynced)}
        />
        <RecoverySnapshot
          headline={heroHeadline}
          latestReadiness={latestReadiness}
          recoveryLabel={recoveryLabel}
          summary={heroSummary}
          latestHrv={latestHrv}
          latestSteps={latestStepsRow?.steps ?? null}
          signalChips={signalChips}
        />

        {!latest ? (
          <EmptyDashboardState />
        ) : (
          <>
            <TodaysKeySignals cards={todaysSignalCards} />
            <TodaysGuidanceSection
              recoveryState={recoveryState}
              sleepState={sleepState}
              loadState={loadState}
              activityState={activityState}
              overallState={overallState}
              bodySummary={bodySummary}
              movementGuidance={movementGuidance}
              recoveryFocus={recoveryFocus}
              sleepConsistencyCount={sleepConsistencyGuidance}
            />
            <MetricsOverviewSection
              range={range}
              recoveryChart={recoveryChart}
              sleepChart={sleepRhythmChart}
              recoveryYAxisTicks={recoveryYAxisTicks}
              sleepYAxisTicks={sleepYAxisTicks}
              hrvChart={hrvChart}
              hrvYAxisTicks={hrvYAxisTicks}
              stressChart={stressRhythmChart}
              stressYAxisTicks={stressYAxisTicks}
              stepsChart={stepsChart}
              stepsYAxisTicks={stepsYAxisTicks}
              restingHrChart={restingHrChart}
              restingHrYAxisTicks={restingHrYAxisTicks}
            />
            <AIPredictionsInsightsSection
              aiPrediction={aiPrediction}
            />
            <RecoveryDetailsSection
              sleepBreakdownDescription={sleepBreakdownDescription}
              sleepBreakdown={sleepBreakdown}
              historyRowsN={historyRowsN}
            />
          </>
        )}
      </div>
    </main>
  );
}
