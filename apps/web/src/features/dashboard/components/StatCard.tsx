"use client";

import { ReactNode } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  colorClass?: string;
  iconColorClass?: string;
  isAlert?: boolean;
  alertThreshold?: number;
}

export function StatCard({
  title,
  value,
  icon,
  colorClass,
  iconColorClass,
  isAlert = false,
  alertThreshold,
}: StatCardProps) {
  const { theme } = useTheme();
  
  const isDark = theme === "dark";
  
  // Default styling based on theme
  const cardBg = isDark ? "bg-gray-800" : "bg-white";
  const cardBorder = isDark ? "border-gray-700" : "border-slate-100";
  const titleColor = isDark ? "text-gray-400" : "text-slate-500";
  const valueColor = isAlert 
    ? (isDark ? "text-amber-400" : "text-amber-600") 
    : (isDark ? "text-gray-100" : "text-slate-800");
    
  // Default icon background
  const defaultIconColor = iconColorClass || 
    (isDark 
      ? "bg-gradient-to-r from-blue-600 to-blue-700" 
      : "bg-gradient-to-r from-blue-500 to-blue-600");

  return (
    <div className={cn(cardBg, "p-3 rounded-lg shadow-sm border", cardBorder, colorClass)}>
      <h3 className={cn("text-sm", titleColor)}>{title}</h3>
      <div className="flex items-center">
        {icon ? (
          icon
        ) : (
          <div className={cn("w-4 h-4 rounded mr-2", defaultIconColor)} />
        )}
        <span className={cn("text-2xl font-bold", valueColor)}>
          {value}
        </span>
      </div>
    </div>
  );
}