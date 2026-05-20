export function RecoveryRings() {
  return (
    <div className="relative aspect-square w-full max-w-[520px]">
      <div className="absolute left-1/2 top-1/2 h-[74%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[color-mix(in_srgb,var(--hrv)_34%,transparent)]" />
      <div className="absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[color-mix(in_srgb,var(--load)_34%,transparent)]" />
      <div className="absolute left-1/2 top-1/2 h-[40%] w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[color-mix(in_srgb,var(--recovery)_48%,transparent)]" />
      <div className="absolute left-1/2 top-1/2 h-[26%] w-[26%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[var(--recovery)] via-[color-mix(in_srgb,var(--sleep)_64%,var(--recovery))] to-[var(--sleep)] shadow-[0_20px_60px_rgba(0,0,0,0.25)]" />
    </div>
  );
}
