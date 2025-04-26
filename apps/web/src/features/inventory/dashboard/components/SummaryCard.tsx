"use client";

import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useColorScheme } from "../utils/theme-colors";

interface SummaryItemProps {
  label: string;
  value: number | string;
  total: number;
  isWarning?: boolean;
  isError?: boolean;
}

interface SummaryCardProps {
  title: string;
  items: SummaryItemProps[];
}

export function SummaryCard({ title, items }: SummaryCardProps) {
  const { theme } = useTheme();
  const colors = useColorScheme(theme);
  
  return (
    <div className={cn(
      "rounded-lg p-6 shadow-sm border", 
      colors.cardBackground, 
      colors.borderColor
    )}>
      <h2 className={cn("text-lg font-semibold mb-4", colors.headingColor)}>
        {title}
      </h2>
      
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-1">
              <span className={colors.textColor}>
                {item.label}
              </span>
              <span className={cn(
                "font-semibold",
                item.isError 
                  ? "text-red-600 dark:text-red-400" 
                  : item.isWarning 
                    ? "text-amber-600 dark:text-amber-400"
                    : colors.headingColor
              )}>
                {item.value}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div
                className={cn(
                  "h-2 rounded-full",
                  item.isError 
                    ? "bg-red-500"
                    : item.isWarning 
                      ? "bg-amber-500" 
                      : "bg-blue-600"
                )}
                style={{
                  width: `${(Number(item.value) / item.total * 100) || 0}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}