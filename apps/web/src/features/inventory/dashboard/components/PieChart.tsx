"use client";

import { useTheme } from "next-themes";
import { useColorScheme } from "../utils/theme-colors";

interface PieChartProps {
  data: number[];
  colors?: string[];
  labels?: string[];
}

export function PieChart({
  data,
  colors: customColors,
  labels,
}: PieChartProps) {
  const { theme } = useTheme();
  const colors = useColorScheme(theme);
  
  // Use provided colors or default from theme
  const chartColors = customColors || 
    (theme === "dark" ? colors.pieColors : colors.pieColors);
    
  // Simple pie chart implementation
  const total = data.reduce((sum, value) => sum + value, 0);

  return (
    <div className="w-full h-full flex flex-col">
      <svg width="100%" height="85%" viewBox="0 0 100 100">
        {data.map((value, index) => {
          if (value === 0) return null;
          
          const percentage = value / total;
          const startAngle = data
            .slice(0, index)
            .reduce((sum, v) => sum + (v / total) * 360, 0);
          const endAngle = startAngle + percentage * 360;
          const startRad = (startAngle - 90) * (Math.PI / 180);
          const endRad = (endAngle - 90) * (Math.PI / 180);

          const x1 = 50 + 40 * Math.cos(startRad);
          const y1 = 50 + 40 * Math.sin(startRad);
          const x2 = 50 + 40 * Math.cos(endRad);
          const y2 = 50 + 40 * Math.sin(endRad);

          const largeArcFlag = percentage > 0.5 ? 1 : 0;

          const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

          return (
            <path
              key={index}
              d={pathData}
              fill={chartColors[index % chartColors.length]}
              stroke={theme === "dark" ? "#1f2937" : "#fff"}
              strokeWidth="0.5"
            />
          );
        })}
      </svg>
      
      {labels && (
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          {labels.map((label, index) => (
            data[index] > 0 && (
              <div key={label} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{
                    backgroundColor: chartColors[index % chartColors.length]
                  }}
                />
                <span
                  className={`text-sm ${theme === "dark" ? colors.textColor : colors.textColor}`}
                >
                  {label}
                </span>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}