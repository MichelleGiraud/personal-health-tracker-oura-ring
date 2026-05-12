import { MetricCard } from "../MetricCard";
import { formatDay, formatHrv, formatSleep, formatSteps, getSleepTone } from "../../helpers/home.helper";
import type { DailySummaryRowNormalized } from "../../types/types.home";

type MetricsOverviewSectionProps = {
  latest: DailySummaryRowNormalized;
  latestReadiness: number | null;
  latestSleepRow: DailySummaryRowNormalized | null;
  latestStepsRow: DailySummaryRowNormalized | null;
  latestActivityScoreRow: DailySummaryRowNormalized | null;
  latestStressRow: DailySummaryRowNormalized | null;
  latestStressHigh: number | null;
  summaryLine: string;
  recoveryLabel: string;
  recoveryTone: "neutral" | "good" | "warn";
  sleepDeltaSeconds: number | null;
  hrvSignal: { label: "High" | "Normal" | "Low" | "No data"; tone: "good" | "neutral" | "warn"; message: string };
  latestHrv: number | null;
  hrvDelta: number | null;
  stressDelta: number | null;
  range: number;
  readinessValues: number[];
  sleepValues: number[];
  hrvValues: number[];
  stepsValues: number[];
  stressValues: number[];
  activityPaused: boolean;
};

export function MetricsOverviewSection({
  latest,
  latestReadiness,
  latestSleepRow,
  latestStepsRow,
  latestActivityScoreRow,
  latestStressRow,
  latestStressHigh,
  summaryLine,
  recoveryLabel,
  recoveryTone,
  sleepDeltaSeconds,
  hrvSignal,
  latestHrv,
  hrvDelta,
  stressDelta,
  range,
  readinessValues,
  sleepValues,
  hrvValues,
  stepsValues,
  stressValues,
  activityPaused,
}: MetricsOverviewSectionProps) {
  return (
    <section id="metrics-overview-section" className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Today</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Current body picture</h2>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <MetricCard
          index={0}
          label="Today Recovery"
          value={latestReadiness === null ? "-" : `Recovery: ${latestReadiness}`}
          subtext={summaryLine}
          tag={recoveryLabel}
          tone={recoveryTone}
          message={`Latest day: ${formatDay(latest.day)}`}
          sparklineValues={readinessValues}
          iconName="recovery"
        />
        <MetricCard
          index={1}
          label="Sleep"
          value={formatSleep(latestSleepRow?.sleep_total_seconds ?? null)}
          subtext={
            sleepDeltaSeconds === null
              ? latestSleepRow
                ? `Latest available: ${formatDay(latestSleepRow.day)}`
                : "No recent sleep value"
              : `${sleepDeltaSeconds > 0 ? "+" : ""}${formatSleep(Math.abs(sleepDeltaSeconds))} vs ${range}D baseline`
          }
          tag={
            latestSleepRow?.sleep_total_seconds
              ? latestSleepRow.sleep_total_seconds >= 7 * 3600
                ? "On target"
                : "Low sleep"
              : "No data"
          }
          tone={getSleepTone(latestSleepRow?.sleep_total_seconds ?? null)}
          sparklineValues={sleepValues}
          iconName="sleep"
        />
        <MetricCard
          index={2}
          label="HRV (Recovery Signal)"
          value={hrvSignal.label}
          subtext={
            hrvDelta === null
              ? `${formatHrv(latestHrv)}`
              : `${formatHrv(latestHrv)} (${hrvDelta > 0 ? "+" : ""}${hrvDelta} vs baseline)`
          }
          tag={hrvSignal.label === "No data" ? "No baseline" : `${hrvSignal.label} signal`}
          tone={hrvSignal.tone}
          message={hrvSignal.message}
          sparklineValues={hrvValues}
          iconName="hrv"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:mx-auto lg:max-w-[66%]">
        <MetricCard
          index={3}
          label="Steps"
          value={formatSteps(latestStepsRow?.steps ?? null)}
          subtext={
            activityPaused
              ? `Steps are available for ${formatDay(latest?.day ?? latestStepsRow?.day ?? "")}, but Activity Score is paused.`
              : latestStepsRow
                ? `Latest available: ${formatDay(latestStepsRow.day)}`
                : "No recent steps value"
          }
          tag={
            activityPaused
              ? "Activity paused"
              : latestStepsRow?.steps === null || latestStepsRow?.steps === undefined
                ? "No data"
                : latestStepsRow.steps >= 10000
                  ? "High strain"
                  : "Build momentum"
          }
          tone={
            activityPaused
              ? "neutral"
              : latestStepsRow?.steps === null || latestStepsRow?.steps === undefined
                ? "neutral"
                : latestStepsRow.steps >= 10000
                  ? "good"
                  : "neutral"
          }
          message={
            activityPaused
              ? "This usually happens when Oura is not producing an Activity Score, for example during Rest Mode."
              : latestActivityScoreRow
                ? `Latest Activity Score day: ${formatDay(latestActivityScoreRow.day)}`
                : undefined
          }
          sparklineValues={stepsValues}
          iconName="steps"
        />
        <MetricCard
          index={4}
          label="Stress High"
          value={latestStressHigh === null ? "-" : `${latestStressHigh} min`}
          subtext={
            stressDelta === null
              ? latestStressRow
                ? `Latest available: ${formatDay(latestStressRow.day)}`
                : "No recent stress value"
              : `${stressDelta > 0 ? "+" : ""}${stressDelta} min vs ${range}D baseline`
          }
          tag={
            latestStressHigh === null
              ? "No data"
              : latestStressHigh >= 120
                ? "High stress"
                : "Balanced"
          }
          tone={
            latestStressHigh === null
              ? "neutral"
              : latestStressHigh >= 120
                ? "warn"
                : "good"
          }
          message={latestStressRow?.stress_day_summary ?? undefined}
          sparklineValues={stressValues}
        />
      </div>
    </section>
  );
}
