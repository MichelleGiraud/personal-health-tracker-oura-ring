import { SegmentedControl } from "../SegmentedControl";

type DashboardTopBarProps = {
  rangeOptions: Array<{ value: string; label: string }>;
  range: number;
  lastSyncedLabel: string;
};

export function DashboardTopBar({
  rangeOptions,
  range,
  lastSyncedLabel,
}: DashboardTopBarProps) {
  const parsedSyncedDate = new Date(lastSyncedLabel);
  const syncedDisplay = Number.isNaN(parsedSyncedDate.getTime())
    ? lastSyncedLabel
    : `${parsedSyncedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} · ${parsedSyncedDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`;

  return (
    <section
      id="dashboard-top-bar"
      className="grid gap-6 rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-elevated)_100%)] px-8 py-6 shadow-[0_22px_60px_var(--shadow)] lg:grid-cols-[1fr_auto] lg:items-center"
    >
      <p className="text-3xl font-semibold tracking-tight text-[var(--text)]">
        recovery<span className="italic text-[var(--primary)]">studio</span>
      </p>

      <div className="flex flex-col gap-4 lg:items-end">
        <div className="inline-flex items-center gap-3 text-[var(--text-muted)] lg:justify-end">
          <span className="h-3 w-3 rounded-full bg-[var(--recovery)]" />
          <span>Synced today · {syncedDisplay}</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 lg:justify-end">
          <a
            className="inline-flex h-12 items-center rounded-full border border-[color-mix(in_srgb,var(--outlook)_24%,transparent)] bg-[var(--outlook)] px-5 text-sm font-semibold text-[#171d1a] transition hover:brightness-105"
            href={`/api/oura/sync?days=${range}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Sync latest {range} days
          </a>
          <SegmentedControl options={rangeOptions} selectedValue={String(range)} queryKey="range" />
        </div>
      </div>
    </section>
  );
}
