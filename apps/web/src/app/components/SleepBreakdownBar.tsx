"use client";

import { motion } from "framer-motion";

type SleepBreakdownBarProps = {
  deep: number | null;
  rem: number | null;
  light: number | null;
  awake: number | null;
};

const stages = [
  { key: "deep", label: "Deep", color: "#5b8a72" },
  { key: "rem", label: "REM", color: "#8aa392" },
  { key: "light", label: "Light", color: "#b8c9be" },
  { key: "awake", label: "Awake", color: "#d4a46f" },
] as const;

function formatSeconds(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function SleepBreakdownBar({ deep, rem, light, awake }: SleepBreakdownBarProps) {
  const values = { deep, rem, light, awake };
  const total = (deep ?? 0) + (rem ?? 0) + (light ?? 0) + (awake ?? 0);

  if (total === 0) {
    return (
      <div className="space-y-3">
        <div className="panel-inset flex h-10 items-center justify-center rounded-full">
          <span className="text-xs font-medium text-[var(--text-muted)]">No sleep stage data yet</span>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Run a fresh sync to populate deep, REM, light, and awake durations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex h-10 overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--border)_72%,transparent)] bg-[rgba(255,255,255,0.38)]">
        {stages.map((stage, index) => {
          const value = values[stage.key] ?? 0;
          if (value <= 0) return null;

          const pct = (value / total) * 100;

          return (
            <motion.div
              key={stage.key}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
              className="relative"
              style={{ backgroundColor: stage.color }}
              title={`${stage.label}: ${formatSeconds(value)} (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {stages.map((stage) => {
          const value = values[stage.key];
          if (value === null || value <= 0) return null;

          const pct = Math.round((value / total) * 100);

          return (
            <div
              key={stage.key}
              className="panel-inset flex items-center justify-between gap-3 rounded-[20px] px-4 py-3 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="font-medium text-[var(--text)]">{stage.label}</span>
              </div>
              <span className="text-[var(--text-muted)]">
                {formatSeconds(value)} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
