import { AIInsightCards } from "../ai/AIInsightCards";
import type { AiPrediction } from "../../types/types.ai";

type AIPredictionsInsightsSectionProps = {
  aiPrediction: AiPrediction;
};

export function AIPredictionsInsightsSection({
  aiPrediction,
}: AIPredictionsInsightsSectionProps) {
  return (
    <section id="ai-predictions-insights-section" className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
          AI Predictions & Insights
        </p>
      </div>
        <div className="grid gap-6">
          <AIInsightCards prediction={aiPrediction} />
        </div>
    </section>
  );
}
