import { formatWeekdayLabel } from "../helpers/home.helper";
import type { ChartPoint, RhythmChartModel } from "../types/types.home";


type MetricCardProps = {
  title: string;
  description: string;
  emptyMessage: string;
  chart: RhythmChartModel;
  yTicks: number[];
  stroke: string;
  range: number;
};

const CHART_WIDTH = 720;
const CHART_HEIGHT = 320;
const CHART_LEFT_PADDING = 54;
const CHART_RIGHT_PADDING = 24;
const CHART_TOP_PADDING = 22;
const CHART_BOTTOM_PADDING = 44;

function formatChartTick(value: number) {
  if (Math.abs(value) >= 1000) return `${Math.round(value / 100) / 10}k`;
  if (Number.isInteger(value)) return `${Math.round(value)}`;
  return value.toFixed(1);
}

function getChartLabels(points: ChartPoint[], range: number) {
  if (points.length === 0) return [] as Array<{ x: number; label: string }>;

  if (range <= 7) {
    return points.map((point) => ({
      x: point.x,
      label: formatWeekdayLabel(point.label),
    }));
  }

  if (points.length <= 4) {
    return points.map((point) => ({
      x: point.x,
      label: point.label.slice(5),
    }));
  }

  const first = points[0];
  const middle = points[Math.floor(points.length / 2)];
  const last = points[points.length - 1];

  return [first, middle, last].map((point) => ({
    x: point.x,
    label: point.label.slice(5),
  }));
}

export function MetricCard({
  title,
  description,
  emptyMessage,
  chart,
  yTicks,
  stroke,
  range,
}: MetricCardProps) {
  const xLabels = getChartLabels(chart.points, range);

  return (
    <article className="rounded-[40px] border border-[color-mix(in_srgb,var(--border)_88%,white)] bg-[linear-gradient(180deg,#171d1a_0%,#151b18_100%)] p-8 shadow-[0_28px_72px_var(--shadow)] lg:p-10">
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">{title}</h2>
      <p className="mt-3 text-lg leading-relaxed text-[var(--text-secondary)] sm:text-[1.85rem] sm:leading-[1.35] lg:text-2xl">
        {description}
      </p>

      {chart.points.length === 0 ? (
        <p className="mt-12 text-base text-[var(--text-muted)]">{emptyMessage}</p>
      ) : (
        <div className="mt-10">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="h-[300px] w-full"
            role="img"
            aria-label={title}
          >
            <line
              x1={CHART_LEFT_PADDING}
              y1={CHART_HEIGHT - CHART_BOTTOM_PADDING}
              x2={CHART_WIDTH - CHART_RIGHT_PADDING}
              y2={CHART_HEIGHT - CHART_BOTTOM_PADDING}
              stroke="color-mix(in_srgb,var(--text-muted)_44%,transparent)"
              strokeWidth="1.25"
            />
            <line
              x1={CHART_LEFT_PADDING}
              y1={CHART_TOP_PADDING}
              x2={CHART_LEFT_PADDING}
              y2={CHART_HEIGHT - CHART_BOTTOM_PADDING}
              stroke="color-mix(in_srgb,var(--text-muted)_44%,transparent)"
              strokeWidth="1.25"
            />

            {yTicks.map((tick, index) => {
              const y =
                yTicks.length <= 1
                  ? CHART_HEIGHT / 2
                  : CHART_TOP_PADDING +
                    (index / (yTicks.length - 1)) *
                      (CHART_HEIGHT - CHART_TOP_PADDING - CHART_BOTTOM_PADDING);

              return (
                <g key={`${title}-y-${tick}-${index}`}>
                  <line
                    x1={CHART_LEFT_PADDING - 8}
                    y1={y}
                    x2={CHART_LEFT_PADDING}
                    y2={y}
                    stroke="color-mix(in_srgb,var(--text-muted)_54%,transparent)"
                    strokeWidth="1.25"
                  />
                  <text
                    x={CHART_LEFT_PADDING - 12}
                    y={y + 6}
                    textAnchor="end"
                    className="fill-[var(--text-muted)] text-[13px]"
                  >
                    {formatChartTick(tick)}
                  </text>
                </g>
              );
            })}

            {xLabels.map((point, index) => (
              <g key={`${title}-x-${point.label}-${index}`}>
                <line
                  x1={point.x}
                  y1={CHART_HEIGHT - CHART_BOTTOM_PADDING}
                  x2={point.x}
                  y2={CHART_HEIGHT - CHART_BOTTOM_PADDING + 8}
                  stroke="color-mix(in_srgb,var(--text-muted)_54%,transparent)"
                  strokeWidth="1.25"
                />
                <text
                  x={point.x}
                  y={CHART_HEIGHT - 10}
                  textAnchor="middle"
                  className="fill-[var(--text-muted)] text-[13px]"
                >
                  {point.label}
                </text>
              </g>
            ))}

            <path
              d={chart.path}
              fill="none"
              stroke={stroke}
              strokeWidth="3.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </article>
  );
}
