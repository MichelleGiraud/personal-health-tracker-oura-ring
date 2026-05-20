import type { AiPrediction } from "../types/types.ai";

const EMPTY_AI_PREDICTION: AiPrediction = {
  predictedReadinessTomorrow: null,
  predictedRecoveryDay: null,
  predictionConfidenceLabel: null,
  predictionConfidenceScore: null,
  predictionRecommendedAction: null,
  predictionReason: null,
};

export async function fetchAiPrediction(activeUserId: string | null): Promise<AiPrediction> {
  if (!activeUserId) {
    return EMPTY_AI_PREDICTION;
  }

  try {
    const predRes = await fetch(`http://localhost:8000/predict-readiness?user_id=${activeUserId}`, {
      cache: "no-store",
    });

    if (!predRes.ok) {
      return EMPTY_AI_PREDICTION;
    }

    const body = await predRes.json();

    return {
      predictedReadinessTomorrow: body.predicted_readiness_tomorrow ?? null,
      predictedRecoveryDay: body.predicted_recovery_day ?? null,
      predictionConfidenceLabel: body.confidence_label ?? null,
      predictionConfidenceScore: body.confidence_score ?? null,
      predictionRecommendedAction: body.recommended_action ?? null,
      predictionReason: body.reason ?? null,
    };
  } catch (error) {
    console.error("Machine Learning API fetch failed (Make sure the uvicorn server is running):", error);
    return EMPTY_AI_PREDICTION;
  }
}
