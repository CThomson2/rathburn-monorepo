"use client";

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

/**
 * A card component for summarizing data, with a title and a list of items with
 * labels and values. The values are displayed as a bar chart, with the width of
 * each bar representing the proportion of the total that the item represents.
 * The bars are colored based on the value of the item, with three levels of
 * severity: errors (red), warnings (amber), and normal (blue).
 *
 * @param title - The title of the card.
 * @param items - An array of objects with the following properties:
 *   - label - The label for the item.
 *   - value - The value for the item.
 *   - total - The total value of the items.
 *   - isError - If true, the bar for this item will be red.
 *   - isWarning - If true, the bar for this item will be amber.
 */
export function SummaryCard({ title, items }: SummaryCardProps) {
  const colors = useColorScheme();

  return (
    <div
      className={cn(
        "rounded-lg p-6 shadow-sm border",
        colors.card,
        colors.border
      )}
    >
      <h2 className={cn("text-lg font-semibold mb-4", colors.foreground)}>
        {title}
      </h2>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-1">
              <span className={colors.foreground}>{item.label}</span>
              <span
                className={cn(
                  "font-semibold",
                  item.isError
                    ? "text-red-600 dark:text-red-400"
                    : item.isWarning
                      ? "text-amber-600 dark:text-amber-400"
                      : colors.foreground
                )}
              >
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
                  width: `${(Number(item.value) / item.total) * 100 || 0}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
