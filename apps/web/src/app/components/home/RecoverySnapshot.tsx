import { Activity, BedDouble, Flame } from "lucide-react";
import { FloatingPill } from "./FloatingPill";
import { RecoveryRings } from "./RecoveryRings";
import { formatSteps } from "../../helpers/home.helper";

type RecoverySnapshotProps = {
  headline: string;
  latestReadiness: number | null;
  recoveryLabel: string;
  summary: string;
  latestHrv: number | null;
  latestSteps: number | null;
  signalChips: string[];
};

export function RecoverySnapshot({
  headline,
  latestReadiness,
  recoveryLabel,
  summary,
  latestHrv,
  latestSteps,
  signalChips,
}: RecoverySnapshotProps) {
  const readinessValue = latestReadiness === null ? "--" : `${latestReadiness}`;
  const hrvLabel = latestHrv === null ? "HRV --" : `HRV ${Math.round(latestHrv)}ms`;
  const recoveryText = `Recovery: ${recoveryLabel}`;
  const stepsLabel = `${formatSteps(latestSteps)} steps`;

  return (
    <section
      id="recovery-snapshot"
      className="overflow-hidden rounded-[42px] border border-[color-mix(in_srgb,var(--border)_88%,white)] bg-[linear-gradient(180deg,#151b18_0%,#131916_100%)] px-8 py-10 shadow-[0_30px_90px_var(--shadow)] sm:px-10 lg:px-12 lg:py-14"
    >
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)] sm:text-base">
            Today&apos;s body signal
          </p>
          <h1 className="mt-8 max-w-3xl text-3xl font-semibold leading-[0.98] tracking-tight text-[var(--text)] sm:text-2xl lg:text-3xl">
            {headline}
          </h1>
          <div className="mt-10">
            <p className="text-[120px] font-medium leading-none tracking-tight text-[var(--text)] sm:text-[140px]">
              {readinessValue}
            </p>
            <p className="mt-3 text-2xl font-medium text-[var(--recovery)] sm:text-3xl">{recoveryLabel}</p>
          </div>
          <p className="mt-10 max-w-3xl text-xl leading-[1.5] text-[var(--text-muted)] sm:text-2xl">
            {summary}
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            {signalChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex rounded-full border border-[color-mix(in_srgb,var(--border)_90%,white)] bg-[color-mix(in_srgb,var(--surface-elevated)_72%,white)] px-6 py-3 text-lg text-[var(--text-muted)] sm:text-xl"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
        <div className="relative mx-auto flex w-full max-w-[720px] justify-center py-6 lg:py-0">
          <RecoveryRings />
          <div className="hidden md:block">
            <FloatingPill
              className="left-[80%] top-[18%] -translate-x-1/2"
              icon={<Activity className="h-5 w-5 text-[var(--hrv)]" strokeWidth={2.3} />}
              label={hrvLabel}
            />
            <FloatingPill
              className="left-[20%] top-[70%] -translate-x-1/2"
              icon={<BedDouble className="h-5 w-5 text-[var(--recovery)]" strokeWidth={2.3} />}
              label={recoveryText}
            />
            <FloatingPill
              className="left-[76%] top-[72%] -translate-x-1/2"
              icon={<Flame className="h-5 w-5 text-[var(--load)]" strokeWidth={2.3} />}
              label={stepsLabel}
            />
          </div>
        </div>
      </div>
      <div className="mt-8 grid gap-3 md:hidden">
        <div className="flex items-center gap-3 rounded-[22px] border border-[color-mix(in_srgb,var(--border)_90%,white)] bg-[color-mix(in_srgb,var(--surface-elevated)_90%,#253029)] px-4 py-3 text-sm font-semibold shadow-sm">
          <Activity className="h-5 w-5 text-[var(--hrv)]" strokeWidth={2.3} />
          <span>{hrvLabel}</span>
        </div>
        <div className="flex items-center gap-3 rounded-[22px] border border-[color-mix(in_srgb,var(--border)_90%,white)] bg-[color-mix(in_srgb,var(--surface-elevated)_90%,#253029)] px-4 py-3 text-sm font-semibold shadow-sm">
          <BedDouble className="h-5 w-5 text-[var(--recovery)]" strokeWidth={2.3} />
          <span>{recoveryText}</span>
        </div>
        <div className="flex items-center gap-3 rounded-[22px] border border-[color-mix(in_srgb,var(--border)_90%,white)] bg-[color-mix(in_srgb,var(--surface-elevated)_90%,#253029)] px-4 py-3 text-sm font-semibold shadow-sm">
          <Flame className="h-5 w-5 text-[var(--load)]" strokeWidth={2.3} />
          <span>{stepsLabel}</span>
        </div>
      </div>
    </section>
  );
}
