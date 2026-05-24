import { Worker } from "bullmq";
import IORedis from "ioredis";

import { syncOuraForUser } from "../lib/oura";
import type { OuraSyncJobData } from "../lib/queue";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const analyticsApiUrl = process.env.ANALYTICS_API_URL || "http://localhost:8000";

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

const syncWorker = new Worker<OuraSyncJobData>(
  "OuraSyncJobs",
  async (job) => {
    const { userId, days } = job.data;
    console.log(`Starting background Oura sync task for user: ${userId} (${days} days)`);

    const result = await syncOuraForUser(userId, days);

    try {
      const trainResponse = await fetch(`${analyticsApiUrl}/train-model?user_id=${userId}`, {
        method: "POST",
      });
      if (!trainResponse.ok) {
        const body = await trainResponse.text();
        console.warn(`Model retrain non-OK for user ${userId}: ${body}`);
      }
    } catch (trainErr) {
      const msg = trainErr instanceof Error
        ? (trainErr.message || trainErr.cause?.toString() || String(trainErr))
        : String(trainErr);
      console.warn(`Model retrain skipped for user ${userId} (analytics service unreachable): ${msg}`);
    }

    return result;
  },
  { connection }
);

syncWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully!`);
});

syncWorker.on("failed", (job, err) => {
  const detail = err.message || err.cause?.toString() || err.stack || String(err);
  console.error(`Job ${job?.id} failed: ${detail}`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Closing sync worker...`);
  await syncWorker.close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
