import { InsightCard } from "../InsightCard";
import { Pill } from "../Pill";
import { getPredictionPillTone } from "../../helpers/home.helper";
import type { AiPrediction } from "../../types/types.ai";

type AIInsightCardsProps = {
  prediction: AiPrediction;
};

export function AIInsightCards({ prediction }: AIInsightCardsProps) {
  if (prediction.predictedReadinessTomorrow === null) {
    return null;
  }

  return (
    <>
      <InsightCard
        title="AI Prediction for Tomorrow"
        body={`Based on your recent habits, the model predicts your readiness score tomorrow will be ${prediction.predictedReadinessTomorrow}.`}
      />
      <InsightCard
        title="Recovery Day Outlook"
        body={
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {prediction.predictedRecoveryDay ? (
                <Pill tone={getPredictionPillTone(prediction.predictedRecoveryDay)}>
                  {prediction.predictedRecoveryDay} day
                </Pill>
              ) : null}
              {prediction.predictionConfidenceLabel && prediction.predictionConfidenceScore !== null ? (
                <Pill tone={getPredictionPillTone(prediction.predictionConfidenceLabel)}>
                  {prediction.predictionConfidenceLabel} confidence ({prediction.predictionConfidenceScore}/100)
                </Pill>
              ) : null}
            </div>
            <p>
              Tomorrow looks like a <strong>{prediction.predictedRecoveryDay}</strong> day.
            </p>
            {prediction.predictionReason ? <p>Why: {prediction.predictionReason}.</p> : null}
            {prediction.predictionRecommendedAction ? (
              <p>
                Recommended action: <strong>{prediction.predictionRecommendedAction}</strong>
              </p>
            ) : null}
          </div>
        }
      />
    </>
  );
}
