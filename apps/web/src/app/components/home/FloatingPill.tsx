import type { ReactNode } from "react";

type FloatingPillProps = {
  icon: ReactNode;
  label: string;
  className?: string;
};

export function FloatingPill({
  icon,
  label,
  className,
}: FloatingPillProps) {
  return (
    <div
      className={`absolute z-20 flex max-w-max items-center gap-2 whitespace-nowrap rounded-full border border-[color-mix(in_srgb,var(--border)_88%,white)] bg-[color-mix(in_srgb,var(--surface-elevated)_92%,#253029)] px-3 py-2 text-sm font-semibold text-[var(--text)] shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-md sm:gap-3 sm:px-6 sm:py-3 sm:text-xl ${className ?? ""}`}
    >
      <span className="flex h-5 w-5 items-center justify-center sm:h-6 sm:w-6">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
