import { SleepBreakdownBar } from "../SleepBreakdownBar";
import { TrendChartPanel } from "../TrendChartPanel";
import { formatBpm, formatDay, formatHrv, formatSleep, formatSteps } from "../../helpers/home.helper";
import type { DailySummaryRowNormalized } from "../../types/types.home";

type RecoveryDetailsSectionProps = {
  range: number;
  hrvChart: { points: Array<{ x: number; y: number; label: string; value: number }>; polyline: string };
  hrvYAxisTicks: number[];
  hrvXLabels: Array<{ x: number; label: string }>;
  chartWidth: number;
  chartHeight: number;
  chartPadding: number;
  sleepBreakdownDescription: string;
  sleepBreakdown: {
    deep: number | null;
    rem: number | null;
    light: number | null;
    awake: number | null;
  };
  historyRowsN: DailySummaryRowNormalized[];
};

export function RecoveryDetailsSection({
  range,
  hrvChart,
  hrvYAxisTicks,
  hrvXLabels,
  chartWidth,
  chartHeight,
  chartPadding,
  sleepBreakdownDescription,
  sleepBreakdown,
  historyRowsN,
}: RecoveryDetailsSectionProps) {
  return (
    <>
      <section id="recovery-details-section" className="grid gap-6 lg:grid-cols-2">
        <TrendChartPanel
          title="HRV trend"
          description={`Average HRV (ms) across ${range} days.`}
          emptyMessage="No HRV data available yet."
          chart={hrvChart}
          yTicks={hrvYAxisTicks}
          xLabels={hrvXLabels}
          chartWidth={chartWidth}
          chartHeight={chartHeight}
          chartPadding={chartPadding}
          stroke="var(--hrv)"
          ariaLabel="HRV trend line chart"
          tooltipFormatter={(point) => `${point.label}: ${point.value} ms`}
        />

        <article className="rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-elevated)_100%)] p-7 shadow-[0_22px_60px_var(--shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Sleep quality</p>
          <h2 className="mt-2 text-2xl font-semibold">Sleep breakdown</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{sleepBreakdownDescription}</p>
          <div className="mt-6">
            <SleepBreakdownBar
              deep={sleepBreakdown.deep}
              rem={sleepBreakdown.rem}
              light={sleepBreakdown.light}
              awake={sleepBreakdown.awake}
            />
          </div>
        </article>
      </section>

      <details className="rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-elevated)_100%)] p-7 shadow-[0_22px_60px_var(--shadow)]">
        <summary className="cursor-pointer list-none text-xl font-semibold">Details (last 7 days)</summary>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
                <th className="py-2 pr-4">Day</th>
                <th className="py-2 pr-4">Sleep</th>
                <th className="py-2 pr-4">Readiness</th>
                <th className="py-2 pr-4">HRV</th>
                <th className="py-2 pr-4">RHR</th>
                <th className="py-2 pr-4">Stress High</th>
                <th className="py-2 pr-4">Recovery High</th>
                <th className="py-2 pr-4">Stress Summary</th>
                <th className="py-2 pr-4">Activity</th>
                <th className="py-2 pr-4">Steps</th>
              </tr>
            </thead>
            <tbody>
              {historyRowsN.map((row, index) => (
                <tr
                  key={`${formatDay(row.day)}-${index}`}
                  className="border-b border-[color-mix(in_srgb,var(--border)_72%,white)]"
                >
                  <td className="py-2 pr-4">{formatDay(row.day)}</td>
                  <td className="py-2 pr-4">{formatSleep(row.sleep_total_seconds)}</td>
                  <td className="py-2 pr-4">{row.readiness_score ?? "-"}</td>
                  <td className="py-2 pr-4">{formatHrv(row.hrv_avg_ms)}</td>
                  <td className="py-2 pr-4">{formatBpm(row.resting_hr_bpm)}</td>
                  <td className="py-2 pr-4">{row.stress_high_minutes ?? "-"}</td>
                  <td className="py-2 pr-4">{row.recovery_high_minutes ?? "-"}</td>
                  <td className="py-2 pr-4">{row.stress_day_summary ?? "-"}</td>
                  <td className="py-2 pr-4">{row.activity_score ?? "-"}</td>
                  <td className="py-2 pr-4">{formatSteps(row.steps)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
