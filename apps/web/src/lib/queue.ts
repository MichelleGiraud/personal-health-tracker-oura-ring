import { Queue } from "bullmq";
import IORedis from "ioredis";

export type OuraSyncJobData = {
  userId: string;
  days: number;
};

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const syncQueue = new Queue<OuraSyncJobData>("OuraSyncJobs", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});
