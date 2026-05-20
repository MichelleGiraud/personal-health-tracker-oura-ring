import { Pill } from "../Pill";

export function EmptyDashboardState() {
  return (
    <section id="empty-dashboard-state" className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <article className="rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-elevated)_100%)] p-8 shadow-[0_22px_60px_var(--shadow)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color-mix(in_srgb,var(--primary)_76%,white)]">
          Get started
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight">Connect Oura and pull your first data.</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-muted)]">
          The dashboard is ready. Complete OAuth first, then run a sync so recovery, sleep, stress and activity can
          populate the experience.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Pill tone="neutral">1. Connect Oura</Pill>
          <Pill tone="neutral">2. Sync 7 days</Pill>
          <Pill tone="neutral">3. Reopen dashboard</Pill>
        </div>
      </article>
      <article className="rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-elevated)_100%)] p-8 shadow-[0_22px_60px_var(--shadow)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">What will appear</p>
        <div className="mt-6 space-y-4 text-sm leading-7 text-[var(--text-muted)]">
          <p>Recovery snapshots with trend context and AI-assisted forecast.</p>
          <p>Sleep and readiness charts with calmer visual hierarchy.</p>
          <p>Daily body-state cues for stress, activity, and HRV.</p>
        </div>
      </article>
    </section>
  );
}
