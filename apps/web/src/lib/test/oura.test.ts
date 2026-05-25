import { describe, it, expect } from "vitest";
import {
  shiftDayForward,
  normalizeNumber,
  normalizePositiveNumber,
  buildSummaryPatch,
} from "../oura";

// -------------------------------------------------------
// shiftDayForward
// -------------------------------------------------------
describe("shiftDayForward", () => {
  it("shifts a normal date forward by one day", () => {
    expect(shiftDayForward("2024-01-15")).toBe("2024-01-16");
  });

  it("rolls over to the next month correctly", () => {
    expect(shiftDayForward("2024-01-31")).toBe("2024-02-01");
  });

  it("handles leap year February correctly", () => {
    expect(shiftDayForward("2024-02-28")).toBe("2024-02-29"); // 2024 is a leap year
    expect(shiftDayForward("2023-02-28")).toBe("2023-03-01"); // 2023 is not
  });

  it("rolls over to the next year correctly", () => {
    expect(shiftDayForward("2024-12-31")).toBe("2025-01-01");
  });
});

// -------------------------------------------------------
// normalizeNumber
// -------------------------------------------------------
describe("normalizeNumber", () => {
  it("returns a valid number unchanged", () => {
    expect(normalizeNumber(42)).toBe(42);
    expect(normalizeNumber(0)).toBe(0);
    expect(normalizeNumber(-5)).toBe(-5);
  });

  it("returns null for non-numbers", () => {
    expect(normalizeNumber("42")).toBeNull();
    expect(normalizeNumber(null)).toBeNull();
    expect(normalizeNumber(undefined)).toBeNull();
  });

  it("returns null for non-finite values", () => {
    expect(normalizeNumber(Infinity)).toBeNull();
    expect(normalizeNumber(NaN)).toBeNull();
  });
});

// -------------------------------------------------------
// normalizePositiveNumber
// -------------------------------------------------------
describe("normalizePositiveNumber", () => {
  it("returns a positive number", () => {
    expect(normalizePositiveNumber(5)).toBe(5);
  });

  it("returns null for zero", () => {
    expect(normalizePositiveNumber(0)).toBeNull();
  });

  it("returns null for negative numbers", () => {
    expect(normalizePositiveNumber(-1)).toBeNull();
  });

  it("returns null for non-numbers", () => {
    expect(normalizePositiveNumber(null)).toBeNull();
  });
});

// -------------------------------------------------------
// buildSummaryPatch
// -------------------------------------------------------
describe("buildSummaryPatch", () => {
  it("extracts sleep fields from a sleep row", () => {
    const row = {
      type: "long_sleep",
      total_sleep_duration: 28800,
      efficiency: 85,
      latency: 600,
      average_hrv: 45,
      lowest_heart_rate: 52,
      deep_sleep_duration: 7200,
      rem_sleep_duration: 5400,
      light_sleep_duration: 9000,
      awake_time: 1200,
    };
    const patch = buildSummaryPatch("sleep", row);
    expect(patch.sleep_total_seconds).toBe(28800);
    expect(patch.sleep_efficiency).toBe(85);
    expect(patch.hrv_avg_ms).toBe(45);
    expect(patch.resting_hr_bpm).toBe(52);
  });

  it("returns empty patch for a nap row", () => {
    const row = { type: "nap", total_sleep_duration: 1800 };
    const patch = buildSummaryPatch("sleep", row);
    expect(Object.keys(patch)).toHaveLength(0);
  });

  it("extracts readiness_score from daily_readiness row", () => {
    const row = { score: 78 };
    const patch = buildSummaryPatch("daily_readiness", row);
    expect(patch.readiness_score).toBe(78);
  });

  it("extracts steps from daily_activity row", () => {
    const row = { steps: 8500, score: 72 };
    const patch = buildSummaryPatch("daily_activity", row);
    expect(patch.steps).toBe(8500);
    expect(patch.activity_score).toBe(72);
  });
});