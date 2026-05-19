import { InsightCard } from "../InsightCard";
import { TrendChartPanel } from "../TrendChartPanel";
import { AIInsightCards } from "../ai/AIInsightCards";
import { formatSleep } from "../../helpers/home.helper";
import type { AiPrediction } from "../../types/types.ai";

type SleepInsightsSectionProps = {
  range: number;
  sleepChart: { points: Array<{ x: number; y: number; label: string; value: number }>; polyline: string };
  sleepYAxisTicks: number[];
  sleepXLabels: Array<{ x: number; label: string }>;
  chartWidth: number;
  chartHeight: number;
  chartPadding: number;
  actionCard: string;
  sleepConsistencyCount: number;
  aiPrediction: AiPrediction;
};

export function SleepInsightsSection({
  range,
  sleepChart,
  sleepYAxisTicks,
  sleepXLabels,
  chartWidth,
  chartHeight,
  chartPadding,
  actionCard,
  sleepConsistencyCount,
  aiPrediction,
}: SleepInsightsSectionProps) {
  return (
    <section id="sleep-insights-section" className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <TrendChartPanel
        title="Sleep duration"
        description={`Sleep hours across ${range} days.`}
        emptyMessage="No sleep data available yet."
        chart={sleepChart}
        yTicks={sleepYAxisTicks}
        xLabels={sleepXLabels}
        chartWidth={chartWidth}
        chartHeight={chartHeight}
        chartPadding={chartPadding}
        stroke="var(--sleep)"
        ariaLabel="Sleep trend line chart"
        tooltipFormatter={(point) => `${point.label}: ${formatSleep(point.value)}`}
        yTickSuffix="h"
      />

      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Coach notes</p>
          <h2 className="mt-2 text-2xl font-semibold">Insights</h2>
        </div>
        <div className="grid gap-6">
          <InsightCard title="Action for today" body={actionCard} />
          <InsightCard
            title="Consistency"
            body={`Days with sleep >= 7h in last 7 days: ${sleepConsistencyCount}/7.`}
          />
          <AIInsightCards prediction={aiPrediction} />
        </div>
      </div>
    </section>
  );
}
