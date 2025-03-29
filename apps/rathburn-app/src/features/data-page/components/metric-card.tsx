interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    direction: "up" | "down";
  };
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: MetricCardProps) {
  return (
    <div className="bg-navy-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-gray-400 text-sm">{title}</h3>
          <p className="text-white text-3xl font-bold mt-2">{value}</p>
          <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <span
            className={`text-sm ${
              trend.direction === "up" ? "text-green-400" : "text-red-400"
            }`}
          >
            {trend.value}
          </span>
        </div>
      )}
    </div>
  );
}
