import {
  Clock,
  Loader,
  AlertTriangle,
  CheckCircle,
  Package,
} from "lucide-react";

export const getStatusIcon = (status: string) => {
  switch (status) {
    case "Preparing":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "In-distillation":
      return <Loader className="h-4 w-4 text-blue-500 animate-spin" />;
    case "QC Pending":
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case "Complete":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

export const getStatusBadgeVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "Preparing":
      return "outline";
    case "In-distillation":
      return "secondary";
    case "QC Pending":
      return "destructive";
    case "Complete":
      return "default";
    default:
      return "outline";
  }
};
