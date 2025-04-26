"use client";

import { useTheme } from "next-themes";
import { useColorScheme, getChartCssVariables } from "../utils/theme-colors";

interface DataPoint {
  month: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  lineColor?: string;
  pointColor?: string;
}

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * A simple line chart component.
 *
 * @param {LineChartProps} props
 * @prop {DataPoint[]} data - The data to be displayed in the chart. Each item is an object with a `month` and `value` property.
 * @prop {string} lineColor - The color of the chart line. If not provided, primary color will be used.
 * @prop {string} pointColor - The color of the data points. If not provided, primary color will be used.
 * @returns {JSX.Element} The line chart component.
 */
/*******  1eaeb51c-9b79-4e75-b59f-6374a92b7614  *******/
export function LineChart({ data, lineColor, pointColor }: LineChartProps) {
  const { theme } = useTheme();
  const colors = useColorScheme();
  const chartVars = getChartCssVariables();

  // Get colors from CSS variables or use provided colors
  const gridColor = "var(--chart-grid)";
  const axisColor = "var(--chart-axis)";
  const textColor = "var(--chart-text)";
  const mainLineColor = lineColor || "hsl(var(--primary))";
  const dataPointColor = pointColor || "hsl(var(--primary))";

  // Simple line chart implementation
  const maxValue = Math.max(...data.map((item) => item.value));
  const padding = 10;
  const chartWidth = 100 - padding * 2;
  const chartHeight = 80 - padding * 2;

  const points = data.map((item, index) => ({
    x: padding + index * (chartWidth / (data.length - 1)),
    y: 100 - padding - (item.value / maxValue) * chartHeight,
  }));

  const pathData = points
    .map((point, i) => `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <div className="w-full h-full" style={chartVars}>
      <svg width="100%" height="100%" viewBox="0 0 100 100">
        {/* Grid lines */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={100 - padding}
          stroke={gridColor}
          strokeWidth="0.2"
        />
        <line
          x1={padding}
          y1={100 - padding}
          x2={100 - padding}
          y2={100 - padding}
          stroke={gridColor}
          strokeWidth="0.2"
        />

        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75].map((ratio, i) => (
          <line
            key={i}
            x1={padding}
            y1={100 - padding - chartHeight * ratio}
            x2={100 - padding}
            y2={100 - padding - chartHeight * ratio}
            stroke={gridColor}
            strokeWidth="0.2"
            strokeDasharray="1,1"
          />
        ))}

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={mainLineColor}
          strokeWidth="1.5"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="1.5"
            fill={dataPointColor}
            stroke={theme === "dark" ? "#fff" : "#000"}
            strokeWidth="0.5"
          />
        ))}

        {/* X-axis labels */}
        {data.map((item, i) => (
          <text
            key={i}
            x={padding + i * (chartWidth / (data.length - 1))}
            y={100 - padding / 2}
            textAnchor="middle"
            fill={textColor}
            fontSize="3"
          >
            {item.month.substring(0, 3)}
          </text>
        ))}
      </svg>
    </div>
  );
}
