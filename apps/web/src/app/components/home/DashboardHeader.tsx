import { AIForecastPanel } from "../ai/AIForecastPanel";
import type { AiPrediction } from "../../types/types.ai";

type DashboardHeaderProps = {
  heroSummary: string;
  lastSyncedLabel: string;
  heroRecoveryValue: string;
  heroSleepValue: string;
  heroStressValue: string;
  recoveryLabel: string;
  sleepState: string;
  stressState: string;
  actionCard: string;
  aiPrediction: AiPrediction;
};

export function DashboardHeader({
  heroSummary,
  lastSyncedLabel,
  heroRecoveryValue,
  heroSleepValue,
  heroStressValue,
  recoveryLabel,
  sleepState,
  stressState,
  actionCard,
  aiPrediction,
}: DashboardHeaderProps) {
  return (
    <header id="dashboard-header" className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <section id="recovery-studio-card" className="overflow-hidden rounded-[36px] border border-[var(--border)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--surface-elevated)_82%,white)_0%,var(--surface)_58%,color-mix(in_srgb,var(--primary)_14%,white)_100%)] p-8 shadow-[0_28px_80px_var(--shadow)]">
        <div className="space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[color-mix(in_srgb,var(--primary)_78%,white)]">
                Recovery studio
              </p>
              <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl">
                A calmer view of recovery, sleep, and strain.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-muted)]">{heroSummary}</p>
            </div>
            <div className="rounded-full border border-[color-mix(in_srgb,var(--border)_72%,transparent)] bg-[color-mix(in_srgb,var(--surface-elevated)_72%,white)] px-4 py-2 text-sm text-[var(--text-muted)]">
              Last synced {lastSyncedLabel}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[26px] border border-[color-mix(in_srgb,var(--primary)_24%,transparent)] bg-[color-mix(in_srgb,var(--surface-elevated)_72%,white)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Recovery</p>
              <p className="mt-4 text-4xl font-semibold tracking-tight text-[var(--text)]">{heroRecoveryValue}</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{recoveryLabel}</p>
            </div>
            <div className="rounded-[26px] border border-[color-mix(in_srgb,var(--border)_72%,transparent)] bg-[color-mix(in_srgb,var(--surface-elevated)_72%,white)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Sleep</p>
              <p className="mt-4 text-4xl font-semibold tracking-tight text-[var(--text)]">{heroSleepValue}</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{sleepState}</p>
            </div>
            <div className="rounded-[26px] border border-[color-mix(in_srgb,var(--border)_72%,transparent)] bg-[color-mix(in_srgb,var(--surface-elevated)_72%,white)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Stress high</p>
              <p className="mt-4 text-4xl font-semibold tracking-tight text-[var(--text)]">{heroStressValue}</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{stressState}</p>
            </div>
          </div>
        </div>
      </section>
      <AIForecastPanel prediction={aiPrediction} fallbackAction={actionCard} />
    </header>
  );
}
