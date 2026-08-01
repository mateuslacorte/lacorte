import type { DashboardSeriesPoint } from '@/types/exchange';

interface ExchangeRateSparklineProps {
  points: DashboardSeriesPoint[];
  strokeColor: string;
  ariaLabel: string;
}

const WIDTH = 76;
const HEIGHT = 24;
const PADDING = 2;

interface PlotPoint {
  x: number;
  y: number;
}

function buildPlotPoints(points: DashboardSeriesPoint[]): PlotPoint[] {
  if (points.length === 0) return [];

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const drawableWidth = WIDTH - PADDING * 2;
  const drawableHeight = HEIGHT - PADDING * 2;

  return points.map((point, index) => {
    const x = points.length === 1
      ? WIDTH / 2
      : PADDING + (index / (points.length - 1)) * drawableWidth;
    const y = range === 0
      ? HEIGHT / 2
      : PADDING + ((max - point.value) / range) * drawableHeight;
    return { x, y };
  });
}

export default function ExchangeRateSparkline({
  points,
  strokeColor,
  ariaLabel,
}: ExchangeRateSparklineProps) {
  const plotPoints = buildPlotPoints(points);
  const polyline = plotPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const lastPoint = plotPoints.length > 0 ? plotPoints[plotPoints.length - 1] : null;
  const singlePointY = lastPoint ? lastPoint.y : HEIGHT / 2;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-20 h-6"
      role="img"
      aria-label={ariaLabel}
    >
      {plotPoints.length > 1 && (
        <polyline
          points={polyline}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {plotPoints.length === 1 && (
        <line
          x1={PADDING}
          y1={singlePointY}
          x2={WIDTH - PADDING}
          y2={singlePointY}
          stroke={strokeColor}
          strokeWidth="1.5"
          opacity="0.45"
          strokeLinecap="round"
        />
      )}

      {lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="2.5"
          fill={strokeColor}
        />
      )}

      {plotPoints.length === 0 && (
        <line
          x1={PADDING}
          y1={HEIGHT / 2}
          x2={WIDTH - PADDING}
          y2={HEIGHT / 2}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.35"
          strokeDasharray="2 2"
        />
      )}
    </svg>
  );
}
