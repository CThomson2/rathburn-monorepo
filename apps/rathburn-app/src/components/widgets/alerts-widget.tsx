
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertLevel = "critical" | "warning" | "normal";

export interface Alert {
  id: number;
  name: string;
  level: AlertLevel;
  currentStock: number;
  minRequired: number;
}

const AlertsWidget = ({ alerts }: { alerts: Alert[] }) => {
  // Sort alerts by criticality level
  const sortedAlerts = [...alerts].sort((a, b) => {
    const levelOrder: Record<AlertLevel, number> = { critical: 0, warning: 1, normal: 2 };
    return levelOrder[a.level] - levelOrder[b.level];
  });
  
  const getProgressColor = (level: string, percentage: number) => {
    if (level === "critical") return "bg-red-600";
    if (level === "warning") return "bg-yellow-500";
    return "bg-green-600";
  };
  
  const getLevelBadge = (level: string) => {
    switch (level) {
      case "critical":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Critical
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Warning
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Normal
          </span>
        );
    }
  };


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Widget Header */}
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center">
          <AlertTriangle className="text-yellow-500 h-5 w-5 mr-2" />
          <h3 className="font-medium text-gray-900">Alerts & Exceptions</h3>
        </div>
        <span className="text-sm text-gray-500">
          {alerts.filter(a => a.level === "critical").length} critical
        </span>
      </div>
      
      {/* Alert List */}
      <div className="border-t border-gray-100">
        {sortedAlerts.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No alerts at this time
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {sortedAlerts.map((alert) => {
              const stockPercentage = (alert.currentStock / alert.minRequired) * 100;
              return (
                <li key={alert.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{alert.name}</h4>
                      <div className="mt-1 flex items-center space-x-2">
                        {getLevelBadge(alert.level)}
                        <span className="text-xs text-gray-500">
                          {alert.currentStock} of {alert.minRequired} minimum
                        </span>
                      </div>
                    </div>
                    <button className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
                      Order
                    </button>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={cn(
                        "h-2 rounded-full",
                        getProgressColor(alert.level, stockPercentage)
                      )}
                      style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                    ></div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AlertsWidget;
