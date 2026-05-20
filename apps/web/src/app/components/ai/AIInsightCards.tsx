import { Pill } from "../Pill";
import { getPredictionPillTone } from "../../helpers/home.helper";
import type { AiPrediction } from "../../types/types.ai";

type AIInsightCardsProps = {
  prediction: AiPrediction;
};

type ForecastCardProps = {
  eyebrow: string;
  state: string;
  value: string;
  tone: "sleep" | "hrv" | "load";
  children: React.ReactNode;
};

function ForecastCard({
  eyebrow,
  state,
  value,
  tone,
  children,
}: ForecastCardProps) {
  const toneClass =
    tone === "sleep"
      ? "text-[var(--sleep)]"
      : tone === "hrv"
        ? "text-[var(--hrv)]"
        : "text-[var(--load)]";

  return (
    <article className="rounded-[40px] border border-[color-mix(in_srgb,var(--border)_88%,white)] bg-[color-mix(in_srgb,var(--surface-elevated)_78%,#243028)] p-10 shadow-[0_22px_60px_rgba(0,0,0,0.18)]">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] sm:text-base">
        {eyebrow}
      </p>
      <p className={`mt-8 text-2xl font-medium ${toneClass} sm:text-2xl`}>{state}</p>
      <p className="mt-6 text-5xl font-medium tracking-tight text-[var(--text)] sm:text-5xl">{value}</p>
      <div className="mt-10 space-y-3 text-sm leading-[1.5] text-[var(--text-muted)] sm:text-sm">
        {children}
      </div>
    </article>
  );
}

export function AIInsightCards({ prediction }: AIInsightCardsProps) {
  if (prediction.predictedReadinessTomorrow === null) {
    return null;
  }

  const outlookTone =
    prediction.predictedRecoveryDay === "Ready"
      ? "sleep"
      : prediction.predictedRecoveryDay === "Recovery"
        ? "load"
        : "hrv";

  const confidenceTone =
    prediction.predictionConfidenceLabel === "High"
      ? "sleep"
      : prediction.predictionConfidenceLabel === "Low"
        ? "load"
        : "hrv";

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ForecastCard
        eyebrow="AI Prediction"
        state="Tomorrow readiness"
        value={`${prediction.predictedReadinessTomorrow}`}
        tone="hrv"
      >
        <p>
          Based on your recent habits, tomorrow is trending toward a{" "}
          <span className="font-semibold text-[var(--text)]">
            {prediction.predictedReadinessTomorrow}
          </span>{" "}
          readiness score.
        </p>
        <p>Built from your recent rhythm in sleep, recovery, stress and load.</p>
      </ForecastCard>

      <ForecastCard
        eyebrow="Recovery Outlook"
        state={
          prediction.predictionConfidenceLabel
            ? `${prediction.predictionConfidenceLabel} confidence`
            : "Tomorrow outlook"
        }
        value={
          prediction.predictionConfidenceScore !== null
            ? `${prediction.predictionConfidenceScore}/100`
            : prediction.predictedRecoveryDay ?? "-"
        }
        tone={confidenceTone}
      >
        <div className="flex flex-wrap gap-2">
          {prediction.predictedRecoveryDay ? (
            <Pill tone={getPredictionPillTone(prediction.predictedRecoveryDay)}>
              {prediction.predictedRecoveryDay} day
            </Pill>
          ) : null}
          {prediction.predictionConfidenceLabel && prediction.predictionConfidenceScore !== null ? (
            <Pill tone={getPredictionPillTone(prediction.predictionConfidenceLabel)}>
              {prediction.predictionConfidenceLabel} confidence
            </Pill>
          ) : null}
        </div>
        <p>
          Tomorrow looks like a{" "}
          <span className={`font-semibold ${outlookTone === "sleep" ? "text-[var(--sleep)]" : outlookTone === "hrv" ? "text-[var(--hrv)]" : "text-[var(--load)]"}`}>
            {prediction.predictedRecoveryDay}
          </span>{" "}
          day.
        </p>
        {prediction.predictionReason ? <p>Why: {prediction.predictionReason}.</p> : null}
        {prediction.predictionRecommendedAction ? (
          <p>
            Recommended action:{" "}
            <span className="font-semibold text-[var(--text)]">
              {prediction.predictionRecommendedAction}
            </span>
          </p>
        ) : null}
      </ForecastCard>
    </div>
  );
}
