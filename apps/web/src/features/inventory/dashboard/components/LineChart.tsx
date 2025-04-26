"use client";

import { useTheme } from "next-themes";
import { useColorScheme } from "../utils/theme-colors";

interface DataPoint {
  month: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  colors?: string[];
}

export function LineChart({ data, colors: customColors }: LineChartProps) {
  const { theme } = useTheme();
  const colors = useColorScheme(theme);
  
  // Use provided colors or default from theme
  const chartColors = customColors || 
    (theme === "dark" ? colors.chartColors : colors.chartColors);
  
  const gridColor = colors.gridColor;
  const textColor = colors.textColor;
  
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
      <path d={pathData} fill="none" stroke={chartColors[0]} strokeWidth="1.5" />

      {/* Data points */}
      {points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r="1.5"
          fill={theme === "dark" ? "#fff" : chartColors[0]}
          stroke={chartColors[0]}
          strokeWidth="1"
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
  );
}