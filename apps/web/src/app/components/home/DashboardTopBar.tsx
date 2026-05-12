import { SegmentedControl } from "../SegmentedControl";

type DashboardTopBarProps = {
  rangeOptions: Array<{ value: string; label: string }>;
  range: number;
};

export function DashboardTopBar({
  rangeOptions,
  range,
}: DashboardTopBarProps) {
  return (
    <section
      id="dashboard-top-bar"
      className="flex flex-wrap items-center justify-between gap-4 rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-elevated)_100%)] px-8 py-6 shadow-[0_22px_60px_var(--shadow)]"
    >
      <p className="text-3xl font-semibold tracking-tight text-[var(--text)]">
        recovery<span className="italic text-[var(--primary)]">studio</span>
      </p>
     <a
          className="inline-flex h-12 items-center rounded-full border border-[color-mix(in_srgb,var(--primary)_24%,transparent)] bg-[var(--primary)] px-5 text-sm font-semibold text-[#1b140f] transition hover:brightness-105"
          href="/api/oura/sync?days=7"
          target="_blank"
          rel="noopener noreferrer"
        >
          Sync latest 7 days
        </a>
      <div className="flex flex-wrap items-center gap-4">
        <SegmentedControl options={rangeOptions} selectedValue={String(range)} queryKey="range" />
      </div>
    </section>
  );
}
