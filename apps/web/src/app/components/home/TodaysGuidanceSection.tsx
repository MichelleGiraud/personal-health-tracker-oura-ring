type TodaysGuidanceSectionProps = {
  recoveryState: string;
  sleepState: string;
  loadState: string;
  activityState: string;
  overallState: string;
  bodySummary: string;
  movementGuidance: string;
  recoveryFocus: string;
  sleepConsistencyCount: string;
};

export function TodaysGuidanceSection({
  recoveryState,
  sleepState,
  loadState,
  activityState,
  overallState,
  bodySummary,
  movementGuidance,
  recoveryFocus,
  sleepConsistencyCount,
}: TodaysGuidanceSectionProps) {
  return (
    <section
      id="todays-guidance-section"
      className="grid gap-6 lg:grid-cols-[1.65fr_0.95fr]"
    >
      <article className="rounded-[32px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-elevated)_78%,#243028)] p-10 shadow-[0_22px_60px_rgba(0,0,0,0.18)]">
        <h2 className="text-4xl font-semibold text-[var(--text)]">Today&apos;s Guidance</h2>

        <div className="mt-14 space-y-14">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              What your body is saying
            </p>
            <p className="mt-5 max-w-4xl text-sm leading-[1.5] text-[var(--text-secondary)]">
              {bodySummary}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              How to move today
            </p>
            <p className="mt-5 max-w-4xl text-sm leading-[1.5] text-[var(--text-secondary)]">
              {movementGuidance}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Recovery focus
            </p>
            <p className="mt-5 max-w-4xl text-sm leading-[1.5] text-[var(--text-secondary)]">
              {recoveryFocus}
            </p>
          </div>
             <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Sleep consistency
            </p>
            <p className="mt-5 max-w-4xl text-sm leading-[1.5] text-[var(--text-secondary)]">
              {sleepConsistencyCount}
            </p>
          </div>
        </div>
      </article>

      <article className="rounded-[32px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-elevated)_78%,#243028)] p-10 shadow-[0_22px_60px_rgba(0,0,0,0.18)]">
        <h3 className="text-3xl font-semibold text-[var(--text)]">Body Read</h3>

        <div className="mt-12 space-y-8">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Recovery</span>
            <span className="text-[var(--text)]">{recoveryState}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Sleep</span>
            <span className="text-[var(--text)]">{sleepState}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Load</span>
            <span className="text-[var(--text)]">{loadState}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Movement</span>
            <span className="text-[var(--text)]">{activityState}</span>
          </div>
        </div>

        <div className="mt-10 border-t border-[var(--border)] pt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Overall signal
          </p>
          <p className="mt-5 text-sm font-semibold text-[var(--text)]">{overallState}</p>
        </div>
      </article>
    </section>
  );
}
