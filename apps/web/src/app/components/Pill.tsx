import type { ReactNode } from "react";

type PillProps = {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" ;
};

const toneClass: Record<NonNullable<PillProps["tone"]>, string> = {
  neutral:
    "border-[color-mix(in_srgb,var(--border)_82%,white)] bg-[color-mix(in_srgb,var(--surface-elevated)_72%,#253029)] text-[var(--text-secondary)]",
  good:
    "border-[color-mix(in_srgb,var(--recovery)_28%,var(--border))] bg-[color-mix(in_srgb,var(--recovery)_16%,#1e2822)] text-[var(--recovery)]",
  warn:
    "border-[color-mix(in_srgb,var(--load)_28%,var(--border))] bg-[color-mix(in_srgb,var(--load)_14%,#272117)] text-[var(--load)]",
};

export function Pill({ children, tone = "neutral" }: PillProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}
