import type { ReactNode } from "react";

type InsightCardProps = {
  title: string;
  body: ReactNode;
  index?: number;
};

export function InsightCard({ title, body }: InsightCardProps) {
  return (
    <article className="rounded-[28px] border border-[color-mix(in_srgb,var(--border)_88%,white)] bg-[linear-gradient(180deg,#171d1a_0%,#151b18_100%)] p-7 shadow-[0_22px_60px_var(--shadow)] transition-transform duration-200 hover:translate-y-[-2px]">
      <h3 className="text-xl font-semibold tracking-tight text-[var(--text)]">{title}</h3>
      <div className="mt-3 text-base leading-7 text-[var(--text-secondary)]">{body}</div>
    </article>
  );
}
