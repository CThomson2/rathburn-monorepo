import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Download,
  User,
  AlertCircle,
  Activity,
} from "lucide-react";

interface DrumDetailsModalProps {
  drum: any;
  open: boolean;
  onClose: () => void;
}

// Mock audit log data
const mockAuditLog = [
  {
    id: 1,
    action: "created",
    timestamp: "2023-05-10T08:32:19Z",
    employee: "John Doe",
    notes: "Initial drum creation",
  },
  {
    id: 2,
    action: "status_change",
    timestamp: "2023-05-12T10:15:44Z",
    employee: "Jane Smith",
    notes: "Changed status from 'in_transit' to 'in_stock'",
  },
  {
    id: 3,
    action: "scan",
    timestamp: "2023-05-15T14:22:07Z",
    employee: "Robert Johnson",
    notes: "Scanned at warehouse entrance",
  },
  {
    id: 4,
    action: "status_change",
    timestamp: "2023-05-20T09:45:33Z",
    employee: "Alice Williams",
    notes: "Changed status from 'in_stock' to 'in_use'",
  },
];

const statusColors = {
  in_stock: "bg-green-100 text-green-800 border-green-200",
  in_use: "bg-blue-100 text-blue-800 border-blue-200",
  empty: "bg-red-100 text-red-800 border-red-200",
  scheduled: "bg-purple-100 text-purple-800 border-purple-200",
  in_transit: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export function DrumDetailsModal({
  drum,
  open,
  onClose,
}: DrumDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("details");

  if (!drum) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            Drum #{drum.id}
            <Badge
              className={
                statusColors[drum.status as keyof typeof statusColors] ||
                "bg-gray-100"
              }
            >
              {drum.status.replace("_", " ")}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            View detailed information and activity history for this drum.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="details"
          className="mt-4"
          onValueChange={setActiveTab}
        >
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="details">Drum Details</TabsTrigger>
            <TabsTrigger value="history">Activity History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Material</p>
                <p className="font-medium">{drum.material}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Supplier</p>
                <p className="font-medium">{drum.supplier}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Batch Code</p>
                <p className="font-medium">{drum.batch_code}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Fill Level</p>
                <p className="font-medium">{drum.fill_level} L</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">
                  Creation Date
                </p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(drum.created_at), "MMM d, yyyy")}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">
                  Last Updated
                </p>
                <p className="font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(drum.created_at), "MMM d, yyyy HH:mm")}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2">Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Label
                </Button>
                <Button size="sm" variant="outline">
                  Mark as Lost
                </Button>
                <Button size="sm" variant="outline">
                  Decommission
                </Button>
                <Button size="sm" variant="outline">
                  Transfer Contents
                </Button>
                <Button size="sm" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                <Button size="sm" variant="outline">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Request Info
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4 py-2">
              {mockAuditLog.map((log, index) => (
                <div key={log.id} className="relative pl-6 pb-4">
                  {/* Timeline connector */}
                  {index < mockAuditLog.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-200" />
                  )}

                  {/* Event circle */}
                  <div className="absolute left-0 top-1 h-[22px] w-[22px] rounded-full border-2 border-primary bg-background flex items-center justify-center">
                    <Activity className="h-3 w-3 text-primary" />
                  </div>

                  {/* Event content */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium capitalize">
                        {log.action.replace("_", " ")}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {format(new Date(log.timestamp), "MMM d, yyyy HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{log.notes}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <User className="h-3 w-3 mr-1" />
                      {log.employee}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
