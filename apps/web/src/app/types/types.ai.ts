export type AiPrediction = {
  predictedReadinessTomorrow: number | null;
  predictedRecoveryDay: string | null;
  predictionConfidenceLabel: string | null;
  predictionConfidenceScore: number | null;
  predictionRecommendedAction: string | null;
  predictionReason: string | null;
};
