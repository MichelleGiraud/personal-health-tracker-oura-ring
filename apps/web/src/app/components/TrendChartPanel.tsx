import type { ReactNode } from "react";
import type { ChartPoint } from "../types/types.home";

type TrendChartPanelProps = {
  title: string;
  description: string;
  emptyMessage: string;
  chart: { points: ChartPoint[]; polyline: string };
  yTicks: number[];
  xLabels: Array<{ x: number; label: string }>;
  chartWidth: number;
  chartHeight: number;
  chartPadding: number;
  stroke: string;
  ariaLabel: string;
  tooltipFormatter: (point: ChartPoint) => string;
  yTickSuffix?: string;
  headerSlot?: ReactNode;
};

export function TrendChartPanel({
  title,
  description,
  emptyMessage,
  chart,
  yTicks,
  xLabels,
  chartWidth,
  chartHeight,
  chartPadding,
  stroke,
  ariaLabel,
  tooltipFormatter,
  yTickSuffix = "",
  headerSlot,
}: TrendChartPanelProps) {
  return (
    <article className="rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-elevated)_100%)] p-7 shadow-[0_22px_60px_var(--shadow)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{description}</p>
        </div>
        {headerSlot}
      </div>

      {chart.points.length === 0 ? (
        <p className="mt-5 text-sm text-[var(--text-muted)]">{emptyMessage}</p>
      ) : (
        <div className="mt-4">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="h-56 w-full"
            role="img"
            aria-label={ariaLabel}
          >
            <line
              x1={chartPadding}
              y1={chartHeight - chartPadding}
              x2={chartWidth - chartPadding}
              y2={chartHeight - chartPadding}
              stroke="var(--border)"
            />
            <line
              x1={chartPadding}
              y1={chartPadding}
              x2={chartPadding}
              y2={chartHeight - chartPadding}
              stroke="var(--border)"
            />
            {yTicks.map((tick, index) => {
              const y =
                yTicks.length <= 1
                  ? chartHeight / 2
                  : chartPadding + (index / (yTicks.length - 1)) * (chartHeight - chartPadding * 2);
              return (
                <g key={`${title}-y-${tick}-${index}`}>
                  <line x1={chartPadding - 4} y1={y} x2={chartPadding} y2={y} stroke="var(--text-muted)" />
                  <text
                    x={chartPadding - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-[var(--text-muted)] text-[10px]"
                  >
                    {tick}
                    {yTickSuffix}
                  </text>
                </g>
              );
            })}
            {xLabels.map((point, index) => (
              <g key={`${title}-x-${point.label}-${index}`}>
                <line
                  x1={point.x}
                  y1={chartHeight - chartPadding}
                  x2={point.x}
                  y2={chartHeight - chartPadding + 4}
                  stroke="var(--text-muted)"
                />
                <text
                  x={point.x}
                  y={chartHeight - chartPadding + 14}
                  textAnchor="middle"
                  className="fill-[var(--text-muted)] text-[10px]"
                >
                  {point.label}
                </text>
              </g>
            ))}
            <polyline
              fill="none"
              stroke={stroke}
              strokeWidth="3"
              points={chart.polyline}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {chart.points.map((point, index) => (
              <g key={`${title}-${point.label}-${index}`}>
                <circle cx={point.x} cy={point.y} r="4" fill={stroke} />
                <title>{tooltipFormatter(point)}</title>
              </g>
            ))}
          </svg>
        </div>
      )}
    </article>
  );
}
