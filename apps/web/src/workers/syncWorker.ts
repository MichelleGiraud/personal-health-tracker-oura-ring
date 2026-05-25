import { Worker } from "bullmq";
import IORedis from "ioredis";

import { syncOuraForUser } from "../lib/oura";
import type { OuraSyncJobData } from "../lib/queue";
import { logger } from "../lib/logger";
import { requireEnv } from "../lib/env";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const analyticsApiUrl = requireEnv("ANALYTICS_API_URL");

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

const syncWorker = new Worker<OuraSyncJobData>(
  "OuraSyncJobs",
  async (job) => {
    const { userId, days } = job.data;
    const startMs = Date.now();

    logger.info({ userId, jobId: job.id, days }, "sync_started");

    const result = await syncOuraForUser(userId, days);

    logger.info(
      { userId, jobId: job.id, durationMs: Date.now() - startMs, counts: result.counts },
      "sync_completed"
    );

    try {
      const trainResponse = await fetch(`${analyticsApiUrl}/train-model?user_id=${userId}`, {
        method: "POST",
      });
      if (!trainResponse.ok) {
        const body = await trainResponse.text();
        logger.warn({ userId, status: trainResponse.status, body }, "model_retrain_failed");
      } else {
        logger.info({ userId }, "model_retrain_triggered");
      }
    } catch (trainErr) {
      const msg = trainErr instanceof Error ? trainErr.message : String(trainErr);
      logger.warn({ userId, err: msg }, "model_retrain_skipped_service_unreachable");
    }

    return result;
  },
  { connection }
);

syncWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "job_completed");
});

syncWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err: err.message, stack: err.stack }, "job_failed");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "worker_shutting_down");
  await syncWorker.close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));