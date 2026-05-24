import { UnrecoverableError } from "bullmq";
import { query } from "@/lib/db";
import { OuraTokenRow, OuraDailySource, DailySummaryAccumulator } from "../app/types/types.oura";

const OURA_TOKEN_URL = "https://api.ouraring.com/oauth/token";
const OURA_V2_BASE_URL = "https://api.ouraring.com/v2/usercollection";

function getBasicAuthHeader() {
  const clientId = process.env.OURA_CLIENT_ID;
  const clientSecret = process.env.OURA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing OURA_CLIENT_ID or OURA_CLIENT_SECRET");
  }

  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

export async function getLatestToken(): Promise<OuraTokenRow | null> {
  const res = await query<OuraTokenRow>(
    `select user_id, access_token, refresh_token, expires_at
     from oura_token
     order by updated_at desc
     limit 1`
  );
  return res.rows[0] ?? null;
}

export async function getTokenByUserId(userId: string): Promise<OuraTokenRow | null> {
  const res = await query<OuraTokenRow>(
    `select user_id, access_token, refresh_token, expires_at
     from oura_token
     where user_id = $1
     limit 1`,
    [userId]
  );
  return res.rows[0] ?? null;
}

async function refreshAccessToken(
  userId: string,
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const tokenRes = await fetch(OURA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: getBasicAuthHeader(),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const tokenJson = await tokenRes.json();

  if (!tokenRes.ok) {
    // 400 invalid_request means the token is permanently invalid — retrying won't help.
    if (tokenRes.status === 400) {
      throw new UnrecoverableError(`Failed to refresh token: ${JSON.stringify(tokenJson)}`);
    }
    throw new Error(`Failed to refresh token: ${JSON.stringify(tokenJson)}`);
  }

  const expiresIn = Number(tokenJson.expires_in ?? 0);
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  await query(
    `update oura_token
     set access_token = $2,
         refresh_token = $3,
         expires_at = $4,
         updated_at = now()
     where user_id = $1`,
    [userId, tokenJson.access_token, tokenJson.refresh_token, expiresAt]
  );

  return {
    accessToken: tokenJson.access_token,
    refreshToken: tokenJson.refresh_token,
  };
}

async function fetchWithAutoRefresh(
  userId: string,
  accessToken: string,
  refreshToken: string,
  endpoint: string,
  startDate: string,
  endDate: string
) {
  const url = `${OURA_V2_BASE_URL}/${endpoint}?start_date=${startDate}&end_date=${endDate}`;

  let res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  let currentAccessToken = accessToken;
  let currentRefreshToken = refreshToken;

  if (res.status === 401) {
    const refreshed = await refreshAccessToken(userId, refreshToken);
    currentAccessToken = refreshed.accessToken;
    currentRefreshToken = refreshed.refreshToken;
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${currentAccessToken}`,
      },
    });
  }

  const payload = await res.json();

  if (!res.ok) {
    throw new Error(`Oura API error for ${endpoint}: ${JSON.stringify(payload)}`);
  }

  return {
    payload,
    accessToken: currentAccessToken,
    refreshToken: currentRefreshToken,
  };
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// The Oura API attributes all daily data to the bedtime date (when the sleep started).
// The Oura app displays everything under the wake-up date (bedtime + 1 day).
// Shift by +1 so our dates match what users see in the Oura app.
function shiftDayForward(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
}

function normalizePositiveNumber(value: unknown): number | null {
  const normalized = normalizeNumber(value);
  if (normalized === null || normalized <= 0) {
    return null;
  }
  return normalized;
}

function shouldPersistSleepSummary(row: Record<string, unknown>) {
  const sleepType = typeof row.type === "string" ? row.type : null;

  // Oura sleep data can include naps. Keep those in raw storage, but only
  // promote overnight sleep rows into the daily summary the dashboard reads.
  if (sleepType && sleepType.toLowerCase().includes("nap")) {
    return false;
  }

  return true;
}

function isEmptyPatch(patch: DailySummaryAccumulator) {
  return Object.keys(patch).length === 0;
}

async function saveRawDailyData(
  userId: string,
  source: OuraDailySource,
  payload: Record<string, unknown>
) {
  const data = Array.isArray(payload.data) ? payload.data : [];

  for (const row of data) {
    const day = typeof row?.day === "string" ? row.day : null;
    if (!day) {
      continue;
    }

    await query(
      `insert into oura_raw_daily (user_id, day, source, payload)
       values ($1, $2, $3, $4::jsonb)
       on conflict (user_id, day, source)
       do update set payload = excluded.payload,
                     fetched_at = now()`,
      [userId, day, source, JSON.stringify(row)]
    );
  }
}

function buildSummaryPatch(source: OuraDailySource, row: Record<string, unknown>): DailySummaryAccumulator {
  if (source === "sleep") {
    if (!shouldPersistSleepSummary(row)) {
      return {};
    }

    return {
      sleep_total_seconds: normalizeNumber(row.total_sleep_duration),
      sleep_efficiency: normalizeNumber(row.efficiency),
      sleep_latency_seconds: normalizeNumber(row.latency),
      hrv_avg_ms: normalizePositiveNumber(row.average_hrv),
      resting_hr_bpm:
        normalizePositiveNumber(row.lowest_heart_rate) ??
        normalizePositiveNumber(row.average_heart_rate),
      sleep_deep_seconds: normalizeNumber(row.deep_sleep_duration),
      sleep_rem_seconds: normalizeNumber(row.rem_sleep_duration),
      sleep_light_seconds: normalizeNumber(row.light_sleep_duration),
      sleep_awake_seconds: normalizeNumber(row.awake_time),
    };
  }

  if (source === "daily_sleep") {
    return {
      sleep_total_seconds: normalizeNumber(row.total_sleep_duration),
      sleep_efficiency: normalizeNumber(row.efficiency),
      sleep_latency_seconds: normalizeNumber(row.latency),
    };
  }

  if (source === "daily_readiness") {
    return {
      readiness_score: normalizeNumber(row.score),
    };
  }

  if (source === "daily_stress") {
    return {
      stress_high_minutes: normalizeNumber(row.stress_high),
      recovery_high_minutes: normalizeNumber(row.recovery_high),
      stress_day_summary:
        typeof row.day_summary === "string" ? row.day_summary : null,
    };
  }

  return {
    steps: normalizeNumber(row.steps),
    activity_score: normalizeNumber(row.score),
  };
}

async function saveDailySummary(userId: string, source: OuraDailySource, payload: Record<string, unknown>) {
  const data = Array.isArray(payload.data) ? payload.data : [];

  for (const row of data) {
    const rawDay = typeof row?.day === "string" ? row.day : null;
    if (!rawDay) {
      continue;
    }
    const day = shiftDayForward(rawDay);

    const patch = buildSummaryPatch(source, row as Record<string, unknown>);
    if (isEmptyPatch(patch)) {
      continue;
    }

    await query(
      `insert into daily_summary (
         user_id,
         day,
         sleep_total_seconds,
         sleep_efficiency,
         sleep_latency_seconds,
         readiness_score,
         steps,
         activity_score,
         hrv_avg_ms,
         resting_hr_bpm,
         stress_high_minutes, 
         recovery_high_minutes, 
         stress_day_summary,
         sleep_deep_seconds,
         sleep_rem_seconds,
         sleep_light_seconds,
         sleep_awake_seconds,
         updated_at
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, now())
       on conflict (user_id, day)
       do update set
         sleep_total_seconds = coalesce(excluded.sleep_total_seconds, daily_summary.sleep_total_seconds),
         sleep_efficiency = coalesce(excluded.sleep_efficiency, daily_summary.sleep_efficiency),
         sleep_latency_seconds = coalesce(excluded.sleep_latency_seconds, daily_summary.sleep_latency_seconds),
         readiness_score = coalesce(excluded.readiness_score, daily_summary.readiness_score),
         steps = coalesce(excluded.steps, daily_summary.steps),
         activity_score = coalesce(excluded.activity_score, daily_summary.activity_score),
         hrv_avg_ms = coalesce(excluded.hrv_avg_ms, daily_summary.hrv_avg_ms),
         resting_hr_bpm = coalesce(excluded.resting_hr_bpm, daily_summary.resting_hr_bpm),
         stress_high_minutes = coalesce(excluded.stress_high_minutes, daily_summary.stress_high_minutes),
         recovery_high_minutes = coalesce(excluded.recovery_high_minutes, daily_summary.recovery_high_minutes),
         stress_day_summary = coalesce(excluded.stress_day_summary, daily_summary.stress_day_summary),
         sleep_deep_seconds = coalesce(excluded.sleep_deep_seconds, daily_summary.sleep_deep_seconds),
         sleep_rem_seconds = coalesce(excluded.sleep_rem_seconds, daily_summary.sleep_rem_seconds),
         sleep_light_seconds = coalesce(excluded.sleep_light_seconds, daily_summary.sleep_light_seconds),
         sleep_awake_seconds = coalesce(excluded.sleep_awake_seconds, daily_summary.sleep_awake_seconds),
         updated_at = now()`,
      [
        userId,
        day,
        patch.sleep_total_seconds ?? null,
        patch.sleep_efficiency ?? null,
        patch.sleep_latency_seconds ?? null,
        patch.readiness_score ?? null,
        patch.steps ?? null,
        patch.activity_score ?? null,
        patch.hrv_avg_ms ?? null,
        patch.resting_hr_bpm ?? null,
        patch.stress_high_minutes ?? null,
        patch.recovery_high_minutes ?? null,
        patch.stress_day_summary ?? null,
        patch.sleep_deep_seconds ?? null,
        patch.sleep_rem_seconds ?? null,
        patch.sleep_light_seconds ?? null,
        patch.sleep_awake_seconds ?? null,
      ]
    );
  }
}

export async function syncOuraForUser(userId: string, days = 30) {
  const token = await getTokenByUserId(userId);
  if (!token) {
    throw new Error("No Oura token found for this user");
  }

  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - days);

  const start = toISODate(startDate);
  const end = toISODate(endDate);

  const sources: Array<{ endpoint: OuraDailySource; source: OuraDailySource }> = [
    { endpoint: "sleep", source: "sleep" },
    { endpoint: "daily_sleep", source: "daily_sleep" },
    { endpoint: "daily_activity", source: "daily_activity" },
    { endpoint: "daily_readiness", source: "daily_readiness" },
    { endpoint: "daily_stress", source: "daily_stress" },
  ];

  const summary: Record<string, number> = {};

  let currentAccessToken = token.access_token;
  let currentRefreshToken = token.refresh_token;

  for (const item of sources) {
    const result = await fetchWithAutoRefresh(
      userId,
      currentAccessToken,
      currentRefreshToken,
      item.endpoint,
      start,
      end
    );
    const payload = result.payload;
    currentAccessToken = result.accessToken;
    currentRefreshToken = result.refreshToken;

    await saveRawDailyData(userId, item.source, payload);
    await saveDailySummary(userId, item.source, payload);

    const count = Array.isArray(payload.data) ? payload.data.length : 0;
    summary[item.source] = count;
  }

  return {
    userId,
    range: { start, end },
    counts: summary,
  };
}
