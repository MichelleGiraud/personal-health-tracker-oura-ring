import { Pill } from "../Pill";
import { getPredictionPillTone } from "../../helpers/home.helper";
import type { AiPrediction } from "../../types/types.ai";

type AIForecastPanelProps = {
  prediction: AiPrediction;
  fallbackAction: string;
};

export function AIForecastPanel({ prediction, fallbackAction }: AIForecastPanelProps) {
  const forecastValue =
    prediction.predictedReadinessTomorrow === null ? "--" : `${prediction.predictedReadinessTomorrow}`;
  const forecastTone = getPredictionPillTone(
    prediction.predictedRecoveryDay ?? prediction.predictionConfidenceLabel ?? null
  );

  return (
    <aside className="rounded-[36px] border border-[var(--border)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--surface-elevated)_74%,white)_0%,var(--surface)_100%)] p-8 shadow-[0_28px_80px_var(--shadow)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
        Tomorrow forecast
      </p>
      <div className="mt-6 flex items-end gap-3">
        <span className="text-6xl font-semibold tracking-tight text-[var(--text)]">{forecastValue}</span>
        <span className="pb-2 text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">readiness</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {prediction.predictedRecoveryDay ? (
          <Pill tone={forecastTone}>{prediction.predictedRecoveryDay} day</Pill>
        ) : null}
        {prediction.predictionConfidenceLabel && prediction.predictionConfidenceScore !== null ? (
          <Pill tone={getPredictionPillTone(prediction.predictionConfidenceLabel)}>
            {prediction.predictionConfidenceLabel} {prediction.predictionConfidenceScore}/100
          </Pill>
        ) : (
          <Pill tone="neutral">Waiting for model context</Pill>
        )}
      </div>
      <p className="mt-6 text-sm leading-7 text-[var(--text-muted)]">
        {prediction.predictionReason ??
          "Predictions appear here once the analytics service has enough recent history."}
      </p>
      <div className="mt-8 rounded-[26px] border border-[color-mix(in_srgb,var(--border)_72%,transparent)] bg-[color-mix(in_srgb,var(--surface-elevated)_72%,white)] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
          Recommended focus
        </p>
        <p className="mt-3 text-lg font-semibold text-[var(--text)]">
          {prediction.predictionRecommendedAction ?? fallbackAction}
        </p>
      </div>
    </aside>
  );
}
