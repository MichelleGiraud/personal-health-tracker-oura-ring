import { query } from "@/lib/db";
import { DashboardTopBar } from "./components/home/DashboardTopBar";
import { RecoverySnapshot } from "./components/home/RecoverySnapshot";
import { EmptyDashboardState } from "./components/home/EmptyDashboardState";
import { MetricsOverviewSection } from "./components/home/MetricsOverviewSection";
import { RecoveryDetailsSection } from "./components/home/RecoveryDetailsSection";
import { RecoveryTrendSection } from "./components/home/RecoveryTrendSection";
import { SleepInsightsSection } from "./components/home/SleepInsightsSection";
import { fetchAiPrediction } from "./helpers/ai.server";
import {
  buildLineChartPoints,
  formatDay,
  formatTimestamp,
  getBand,
  getHrvSignal,
  formatSleep,
  getRecoveryLabel,
  getRecoveryTone,
  getXLabelPoints,
  getYAxisTicks,
  normalizeDailySummaryRow,
  normalizeDailySummaryRows,
} from "./helpers/home.helper";
import type {
  ActiveUserRow,
  ChartMetric,
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
  const chartMetric: ChartMetric = resolvedSearchParams?.metric === "activity" ? "activity" : "readiness";

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
  const latestActivityScoreRow = chartRowsN.find((row) => row.activity_score !== null) ?? null;
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

  const chartWidth = 720;
  const chartHeight = 260;
  const chartPadding = 24;

  const recoveryChart = buildLineChartPoints(
    chartRowsN,
    (row) => (chartMetric === "readiness" ? row.readiness_score : row.activity_score),
    chartWidth,
    chartHeight
  );
  const sleepChart = buildLineChartPoints(chartRowsN, (row) => row.sleep_total_seconds, chartWidth, chartHeight);
  const hrvChart = buildLineChartPoints(chartRowsN, (row) => row.hrv_avg_ms, chartWidth, chartHeight);

  const readinessValues = [...chartRowsN]
    .reverse()
    .map((row) => row.readiness_score)
    .filter((value): value is number => value !== null);
  const sleepValues = [...chartRowsN]
    .reverse()
    .map((row) => row.sleep_total_seconds)
    .filter((value): value is number => value !== null);
  const stepsValues = [...chartRowsN]
    .reverse()
    .map((row) => row.steps)
    .filter((value): value is number => value !== null);
  const hrvValues = [...chartRowsN]
    .reverse()
    .map((row) => row.hrv_avg_ms)
    .filter((value): value is number => value !== null);
  const stressValues = [...chartRowsN]
    .reverse()
    .map((row) => row.stress_high_minutes)
    .filter((value): value is number => value !== null);
  const recoveryValues = [...chartRowsN]
    .reverse()
    .map((row) => (chartMetric === "readiness" ? row.readiness_score : row.activity_score))
    .filter((value): value is number => value !== null);

  const latestReadiness = latestReadinessRow?.readiness_score ?? null;
  const latestActivityScore = latest?.activity_score ?? null;
  const latestHrv = latestHrvRow?.hrv_avg_ms ?? null;
  const latestStressHigh = latestStressRow?.stress_high_minutes ?? null;
  const activityPaused = latestActivityScore === null && (latest?.steps ?? null) !== null;
  const hrvBaseline =
    hrvValues.length > 0 ? Math.round(hrvValues.reduce((sum, value) => sum + value, 0) / hrvValues.length) : null;
  const sleepBaselineSeconds =
    sleepValues.length > 0 ? Math.round(sleepValues.reduce((sum, value) => sum + value, 0) / sleepValues.length) : null;
  const stressBaseline =
    stressValues.length > 0
      ? Math.round(stressValues.reduce((sum, value) => sum + value, 0) / stressValues.length)
      : null;

  const hrvDelta = latestHrv !== null && hrvBaseline !== null ? Math.round(latestHrv - hrvBaseline) : null;
  const sleepDeltaSeconds =
    latestSleepRow?.sleep_total_seconds !== null &&
    latestSleepRow?.sleep_total_seconds !== undefined &&
    sleepBaselineSeconds !== null
      ? latestSleepRow.sleep_total_seconds - sleepBaselineSeconds
      : null;
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
  const recoveryTone = getRecoveryTone(latestReadiness);
  const rangeOptions = allowedRanges.map((days) => ({ label: `${days}D`, value: String(days) }));
  const metricOptions = [
    { label: "Readiness", value: "readiness" },
    { label: "Activity", value: "activity" },
  ];

  const actionCard =
    latestReadiness !== null && latestReadiness >= 80 && hrvSignal.label !== "Low"
      ? "Great day for strength or higher intensity training."
      : latestReadiness !== null && latestReadiness >= 60
        ? "Keep it light: easy cardio, walk, and mobility work."
        : "Recovery day: reduce strain and prioritize sleep tonight.";

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

  const bodyFlags = [
    hrvDelta !== null && hrvDelta <= -5 ? "HRV below baseline" : null,
    sleepDeltaSeconds !== null && sleepDeltaSeconds <= -30 * 60 ? "Sleep debt" : null,
    latestStepsRow?.steps !== null && latestStepsRow?.steps !== undefined && latestStepsRow.steps < 6000
      ? "Low steps streak"
      : null,
    stressDelta !== null && stressDelta >= 30 ? "High stress load" : null,
    latestReadiness !== null && latestReadiness < 60 ? "Low recovery day" : null,
  ].filter((flag): flag is string => flag !== null);

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

  const recoveryYAxisTicks = getYAxisTicks(recoveryValues);
  const sleepYAxisTicks = getYAxisTicks(sleepValues.map((value) => value / 3600));
  const hrvYAxisTicks = getYAxisTicks(hrvValues);
  const recoveryXLabels = getXLabelPoints(recoveryChart.points);
  const sleepXLabels = getXLabelPoints(sleepChart.points);
  const hrvXLabels = getXLabelPoints(hrvChart.points);

  const latestRecoveryContext = latestReadinessRow ?? latest;
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
            <MetricsOverviewSection
              latest={latestRecoveryContext ?? latest}
              latestReadiness={latestReadiness}
              latestSleepRow={latestSleepRow}
              latestStepsRow={latestStepsRow}
              latestActivityScoreRow={latestActivityScoreRow}
              latestStressRow={latestStressRow}
              latestStressHigh={latestStressHigh}
              summaryLine={summaryLine}
              recoveryLabel={recoveryLabel}
              recoveryTone={recoveryTone}
              sleepDeltaSeconds={sleepDeltaSeconds}
              hrvSignal={hrvSignal}
              latestHrv={latestHrv}
              hrvDelta={hrvDelta}
              stressDelta={stressDelta}
              range={range}
              readinessValues={readinessValues}
              sleepValues={sleepValues}
              hrvValues={hrvValues}
              stepsValues={stepsValues}
              stressValues={stressValues}
              activityPaused={activityPaused}
            />

            <RecoveryTrendSection
              chartMetric={chartMetric}
              activityPaused={activityPaused}
              latestActivityScoreDay={latestActivityScoreRow ? formatDay(latestActivityScoreRow.day) : null}
              range={range}
              recoveryChart={recoveryChart}
              recoveryYAxisTicks={recoveryYAxisTicks}
              recoveryXLabels={recoveryXLabels}
              chartWidth={chartWidth}
              chartHeight={chartHeight}
              chartPadding={chartPadding}
              metricOptions={metricOptions}
              recoveryState={recoveryState}
              sleepState={sleepState}
              stressState={stressState}
              activityState={activityState}
              overallState={overallState}
              actionCard={actionCard}
              bodyFlags={bodyFlags}
            />

            <SleepInsightsSection
              range={range}
              sleepChart={sleepChart}
              sleepYAxisTicks={sleepYAxisTicks}
              sleepXLabels={sleepXLabels}
              chartWidth={chartWidth}
              chartHeight={chartHeight}
              chartPadding={chartPadding}
              actionCard={actionCard}
              sleepConsistencyCount={sleepConsistencyCount}
              aiPrediction={aiPrediction}
            />

            <RecoveryDetailsSection
              range={range}
              hrvChart={hrvChart}
              hrvYAxisTicks={hrvYAxisTicks}
              hrvXLabels={hrvXLabels}
              chartWidth={chartWidth}
              chartHeight={chartHeight}
              chartPadding={chartPadding}
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
