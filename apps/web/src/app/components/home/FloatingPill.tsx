import type { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

type FloatingPillProps = {
  icon: ReactNode;
  label: string;
  className?: string;
  direction?: "up" | "down";
  directionClassName?: string;
};

export function FloatingPill({
  icon,
  label,
  className,
  direction,
  directionClassName = "text-emerald-500",
}: FloatingPillProps) {
  return (
    <div
      className={`absolute z-20 flex items-center gap-3 rounded-full border border-[#E4E0D8] bg-white/85 px-6 py-3 text-xl font-semibold shadow-sm backdrop-blur-md ${className}`}
    >
      <span className="flex h-6 w-6 items-center justify-center">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
