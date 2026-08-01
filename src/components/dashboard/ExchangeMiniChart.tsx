import type { DashboardSeriesPoint } from '@/types/exchange';

interface ExchangeMiniChartProps {
  title: string;
  points: DashboardSeriesPoint[];
  strokeColor: string;
}

const SVG_WIDTH = 220;
const SVG_HEIGHT = 72;
const PADDING_X = 8;
const PADDING_Y = 8;

interface PlotPoint {
  x: number;
  y: number;
}

function buildPlotPoints(points: DashboardSeriesPoint[]): PlotPoint[] {
  if (points.length === 0) return [];

  const values = points.map(point => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const drawableWidth = SVG_WIDTH - PADDING_X * 2;
  const drawableHeight = SVG_HEIGHT - PADDING_Y * 2;

  return points.map((point, index) => {
    const x = points.length === 1
      ? SVG_WIDTH / 2
      : PADDING_X + (index / (points.length - 1)) * drawableWidth;
    const y = range === 0
      ? SVG_HEIGHT / 2
      : PADDING_Y + ((max - point.value) / range) * drawableHeight;
    return { x, y };
  });
}

export default function ExchangeMiniChart({ title, points, strokeColor }: ExchangeMiniChartProps) {
  if (points.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <p className="text-sm font-semibold text-[var(--color-text)] mb-1">{title}</p>
        <p className="text-xs text-[var(--color-text-muted)]">No chart data yet.</p>
      </div>
    );
  }

  const plotPoints = buildPlotPoints(points);
  const polyline = plotPoints.map(point => `${point.x},${point.y}`).join(' ');
  const latest = points[points.length - 1];
  const minValue = Math.min(...points.map(point => point.value));
  const maxValue = Math.max(...points.map(point => point.value));
  const singlePoint = plotPoints.length === 1 ? plotPoints[0] : null;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{latest.dateLabel}</p>
      </div>

      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full h-20"
        role="img"
        aria-label={`${title} 7-day trend chart`}
      >
        {plotPoints.length > 1 && (
          <polyline
            points={polyline}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {singlePoint && (
          <circle
            cx={singlePoint.x}
            cy={singlePoint.y}
            r="3.5"
            fill={strokeColor}
          />
        )}
      </svg>

      <div className="mt-2 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span>Low {minValue.toFixed(2)}</span>
        <span>High {maxValue.toFixed(2)}</span>
      </div>
    </div>
  );
}
