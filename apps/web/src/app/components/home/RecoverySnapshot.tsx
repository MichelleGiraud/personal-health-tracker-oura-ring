import { FloatingPill } from "./FloatingPill";
import { RecoveryRings } from "./RecoveryRings";
import { Activity, BedDouble, Flame } from "lucide-react";
import { formatSteps } from "../../helpers/home.helper";

type RecoverySnapshotProps = {
  latestHrv?: number | null;
  recoveryLabel?: string;
  latestSteps?: number | null;
};

export function RecoverySnapshot({ latestHrv, recoveryLabel, latestSteps }: RecoverySnapshotProps) {
  return (
    <section
      id="recovery-snapshot"
      className="rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-elevated)_100%)] px-8 py-6 shadow-[0_22px_60px_var(--shadow)]"
    >
      <div className="relative mx-auto flex w-full max-w-[860px] items-center justify-center">
        <RecoveryRings />
        <FloatingPill
          className="left-[380px] top-14"
          icon={<Activity className="h-5 w-5 text-[#8E87DE]" strokeWidth={2.3} />}
          label={`HRV ${latestHrv}ms`}
        />
        <FloatingPill
          className="left-[150px] top-[260px]"
          icon={<BedDouble className="h-5 w-5 text-[#4BAE97]" strokeWidth={2.3} />}
          label={`Recovery ${recoveryLabel}`}
        />
        <FloatingPill
          className="right-[260px] top-[330px]"
          icon={<Flame className="h-5 w-5 text-[#E47F5A]" strokeWidth={2.3} />}
          label={formatSteps(latestSteps ?? null)}
        />
      </div>
    </section>
  );
}
