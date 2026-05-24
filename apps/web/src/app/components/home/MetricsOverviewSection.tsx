import { MetricCard} from "../MetricCard";
import { getRecoveryDescription, getSleepDescription, getHrvDescription, getStressDescription, getStepsDescription, getRestingHrDescription } from "../../helpers/home.helper";
import type { RhythmChartModel } from "../../types/types.home";

type MetricsOverviewSectionProps = {
  range: number;
  recoveryChart: RhythmChartModel;
  recoveryYAxisTicks: number[];
  sleepChart: RhythmChartModel;
  sleepYAxisTicks: number[];
  hrvChart: RhythmChartModel;
  hrvYAxisTicks: number[];
  stressChart: RhythmChartModel;
  stressYAxisTicks: number[];
  stepsChart: RhythmChartModel;
  stepsYAxisTicks: number[];
  restingHrChart: RhythmChartModel;
  restingHrYAxisTicks: number[];
};

export function MetricsOverviewSection({
  range,
  recoveryChart,
  sleepChart,
  recoveryYAxisTicks,
  sleepYAxisTicks,
  hrvChart,
  hrvYAxisTicks,
  stressChart,
  stressYAxisTicks,
  stepsChart,
  stepsYAxisTicks,
  restingHrChart,
  restingHrYAxisTicks,
}: MetricsOverviewSectionProps) {
  return (
    <section id="metrics-overview-section" className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
          Metrics overview
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <MetricCard
          title="Recovery Rhythm"
          description={getRecoveryDescription(recoveryChart.points, range)}
          emptyMessage={`No recovery trend data in the selected ${range}-day window.`}
          chart={recoveryChart}
          yTicks={recoveryYAxisTicks}
          stroke="var(--recovery)"
          range={range}
        />
        <MetricCard
          title="Sleep Rhythm"
          description={getSleepDescription(sleepChart.points, range)}
          emptyMessage={`No sleep trend data in the selected ${range}-day window.`}
          chart={sleepChart}
          yTicks={sleepYAxisTicks}
          stroke="var(--sleep)"
          range={range}
        />
        <MetricCard
          title="HRV Trend"
          description={getHrvDescription(hrvChart.points, range)}
          emptyMessage={`No HRV trend data in the selected ${range}-day window.`}
          chart={hrvChart}
          yTicks={hrvYAxisTicks}
          stroke="var(--hrv)"
          range={range}
        />
        <MetricCard
          title="Stress"
          description={getStressDescription(stressChart.points, range)}
          emptyMessage={`No stress trend data in the selected ${range}-day window.`}
          chart={stressChart}
          yTicks={stressYAxisTicks}
          stroke="var(--stress)"
          range={range}
        />
        <MetricCard
          title="Daily Steps"
          description={getStepsDescription(stepsChart.points, range)}
          emptyMessage={`No steps data in the selected ${range}-day window.`}
          chart={stepsChart}
          yTicks={stepsYAxisTicks}
          stroke="var(--load)"
          range={range}
        />
        <MetricCard
          title="Resting Heart Rate"
          description={getRestingHrDescription(restingHrChart.points, range)}
          emptyMessage={`No resting HR data in the selected ${range}-day window.`}
          chart={restingHrChart}
          yTicks={restingHrYAxisTicks}
          stroke="var(--hrv)"
          range={range}
        />
      </div>
    </section>
  );
}
