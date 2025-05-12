import { Card } from "@/core/components/ui/card";
import { ScrollArea } from "@/core/components/ui/scroll-area";

// Define the structure for scan activity items
interface ScanActivity {
  id: string;
  timestamp: Date;
  stockId: string;
  materialType: string;
  purpose: string;
}

// Mock data for the activity log
const mockActivityData: ScanActivity[] = [
  {
    id: "1",
    timestamp: new Date(2025, 3, 12, 8, 30),
    stockId: "SK-2025-04-0001",
    materialType: "Steel Pipe",
    purpose: "Inventory Check",
  },
  {
    id: "2",
    timestamp: new Date(2025, 3, 12, 9, 15),
    stockId: "SK-2025-04-0002",
    materialType: "Aluminum Sheet",
    purpose: "Transport to Assembly",
  },
  {
    id: "3",
    timestamp: new Date(2025, 3, 12, 10, 45),
    stockId: "SK-2025-04-0003",
    materialType: "Copper Wire",
    purpose: "Processing",
  },
  {
    id: "4",
    timestamp: new Date(2025, 3, 12, 11, 20),
    stockId: "SK-2025-04-0004",
    materialType: "Plastic Molding",
    purpose: "Quality Check",
  },
  {
    id: "5",
    timestamp: new Date(2025, 3, 12, 12, 5),
    stockId: "SK-2025-04-0005",
    materialType: "Circuit Board",
    purpose: "Inventory Check",
  },
  {
    id: "6",
    timestamp: new Date(2025, 3, 12, 13, 30),
    stockId: "SK-2025-04-0006",
    materialType: "Steel Pipe",
    purpose: "Transport to Assembly",
  },
  {
    id: "7",
    timestamp: new Date(2025, 3, 12, 14, 15),
    stockId: "SK-2025-04-0007",
    materialType: "Rubber Gasket",
    purpose: "Processing",
  },
  {
    id: "8",
    timestamp: new Date(2025, 3, 12, 15),
    stockId: "SK-2025-04-0008",
    materialType: "Glass Panel",
    purpose: "Quality Check",
  },
  {
    id: "9",
    timestamp: new Date(2025, 3, 11, 16, 45),
    stockId: "SK-2025-04-0009",
    materialType: "Paint - Blue",
    purpose: "Inventory Check",
  },
  {
    id: "10",
    timestamp: new Date(2025, 3, 11, 17, 30),
    stockId: "SK-2025-04-0010",
    materialType: "Adhesive",
    purpose: "Processing",
  },
];

// Format date to display in a user-friendly way
const formatDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeString = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) {
    return `Today, ${timeString}`;
  } else if (isYesterday) {
    return `Yesterday, ${timeString}`;
  } else {
    return `${date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    })}, ${timeString}`;
  }
};

// ActivityLog component to display recent scan activities
const ActivityLog = () => {
  return (
    <div className="w-full p-4">
      <h2 className="text-xl font-bold text-industrial-darkGray mb-4">
        Recent Activity
      </h2>
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="space-y-3 pr-4">
          {mockActivityData.map((activity) => (
            <Card
              key={activity.id}
              className="p-4 border-l-4 border-l-industrial-blue shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-industrial-gray">
                  {formatDate(activity.timestamp)}
                </span>
                <span className="text-xs font-medium px-2 py-1 bg-industrial-lightGray rounded-full">
                  {activity.purpose}
                </span>
              </div>
              <div className="mb-1">
                <span className="font-medium text-industrial-darkGray">
                  {activity.stockId}
                </span>
              </div>
              <div className="text-sm text-industrial-gray">
                {activity.materialType}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ActivityLog;
