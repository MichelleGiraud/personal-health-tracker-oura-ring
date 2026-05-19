import { Pill } from "../Pill";
import { SegmentedControl } from "../SegmentedControl";
import { TrendChartPanel } from "../TrendChartPanel";

type RecoveryTrendSectionProps = {
  chartMetric: "readiness" | "activity";
  activityPaused: boolean;
  latestActivityScoreDay: string | null;
  range: number;
  recoveryChart: { points: Array<{ x: number; y: number; label: string; value: number }>; polyline: string };
  recoveryYAxisTicks: number[];
  recoveryXLabels: Array<{ x: number; label: string }>;
  chartWidth: number;
  chartHeight: number;
  chartPadding: number;
  metricOptions: Array<{ label: string; value: string }>;
  recoveryState: string;
  sleepState: string;
  stressState: string;
  activityState: string;
  overallState: string;
  actionCard: string;
  bodyFlags: string[];
};

export function RecoveryTrendSection({
  chartMetric,
  activityPaused,
  latestActivityScoreDay,
  range,
  recoveryChart,
  recoveryYAxisTicks,
  recoveryXLabels,
  chartWidth,
  chartHeight,
  chartPadding,
  metricOptions,
  recoveryState,
  sleepState,
  stressState,
  activityState,
  overallState,
  actionCard,
  bodyFlags,
}: RecoveryTrendSectionProps) {
  return (
    <section id="recovery-trend-section" className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <TrendChartPanel
        title="Recovery trend"
        description={
          chartMetric === "activity" && activityPaused
            ? `Activity Score is missing on the latest day, so the chart uses the most recent scored activity day (${latestActivityScoreDay ?? "none"}).`
            : `Readiness and activity across ${range} days.`
        }
        emptyMessage="No recovery data available yet."
        chart={recoveryChart}
        yTicks={recoveryYAxisTicks}
        xLabels={recoveryXLabels}
        chartWidth={chartWidth}
        chartHeight={chartHeight}
        chartPadding={chartPadding}
        stroke="var(--recovery)"
        ariaLabel="Recovery trend line chart"
        tooltipFormatter={(point) => `${point.label}: ${point.value}`}
        headerSlot={
          <SegmentedControl
            options={metricOptions}
            selectedValue={chartMetric}
            queryKey="metric"
          />
        }
      />

      <div className="space-y-6">
        <article className="rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-elevated)_100%)] p-7 shadow-[0_22px_60px_var(--shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Body state</p>
          <h3 className="mt-2 text-2xl font-semibold text-[var(--text)]">How today reads</h3>
          <div className="mt-6 grid gap-3 text-sm text-[var(--text-muted)] sm:grid-cols-2">
            <p>Recovery: <span className="font-semibold text-[var(--text)]">{recoveryState}</span></p>
            <p>Sleep: <span className="font-semibold text-[var(--text)]">{sleepState}</span></p>
            <p>Stress: <span className="font-semibold text-[var(--text)]">{stressState}</span></p>
            <p>Activity: <span className="font-semibold text-[var(--text)]">{activityState}</span></p>
          </div>
          <p className="mt-6 text-sm text-[var(--text-muted)]">
            Overall signal: <span className="font-semibold text-[var(--text)]">{overallState}</span>
          </p>
          <p className="mt-2 text-sm text-[var(--outlook)]">
            Recommendation: {actionCard}
          </p>
        </article>

        <article className="rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-elevated)_100%)] p-7 shadow-[0_22px_60px_var(--shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Signals</p>
          <h3 className="mt-2 text-2xl font-semibold">Flags and focus</h3>
          <div className="mt-5 flex flex-wrap gap-2">
            {bodyFlags.length === 0 ? (
              <Pill tone="good">No body flags</Pill>
            ) : (
              bodyFlags.map((flag) => (
                <Pill key={flag} tone="warn">
                  {flag}
                </Pill>
              ))
            )}
          </div>
          <p className="mt-6 text-sm leading-7 text-[var(--text-muted)]">
            Use this as an at-a-glance sense check before deciding how hard to train today.
          </p>
        </article>
      </div>
    </section>
  );
}
