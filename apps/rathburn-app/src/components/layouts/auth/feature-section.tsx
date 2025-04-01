import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FeatureSectionProps {
  title: string;
  features: {
    icon: ReactNode;
    text: string;
  }[];
  className?: string;
  titleClassName?: string;
}

export function FeatureSection({
  title,
  features,
  className,
  titleClassName,
}: FeatureSectionProps) {
  return (
    <div className={cn("relative h-full flex items-center", className)}>
      <div className="w-full">
        <h1
          className={cn(
            "text-4xl 2xl:text-6xl font-bold tracking-tight text-white mb-12 transition-transform duration-500 ease-in-out",
            titleClassName
          )}
        >
          {title.split(" ").map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h1>
        <div className="grid grid-cols-2 2xl:grid-cols-1 gap-6 transition-all duration-500 ease-in-out">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-4 animate-fadeIn">
              <div className="p-3 bg-white/10 rounded-xl">{feature.icon}</div>
              <span className="text-xl font-medium text-white">
                {feature.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
