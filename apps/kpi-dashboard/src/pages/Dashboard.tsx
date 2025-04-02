
import { 
  Package2, 
  RefreshCcw, 
  Truck, 
  ClipboardList, 
  Calendar, 
  Tag, 
  ArchiveX,
  ListChecks
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { WorkflowCard, WorkflowRole } from "@/components/cards/WorkflowCard";

const Dashboard = () => {
  const workflowCards = [
    {
      title: "New Order Entry",
      description: "Record new orders and view active orders",
      icon: <ClipboardList className="h-16 w-16" />,
      role: "all" as WorkflowRole,
      path: "/orders/new",
      restricted: false
    },
    {
      title: "Delivery Recording",
      description: "Record raw material deliveries on site",
      icon: <Truck className="h-16 w-16" />,
      role: "operator" as WorkflowRole,
      path: "/deliveries",
      restricted: false
    },
    {
      title: "Drum Management",
      description: "View and update all drum details",
      icon: <Package2 className="h-16 w-16" />,
      role: "manager" as WorkflowRole,
      path: "/drums",
      restricted: false
    },
    {
      title: "Production Scheduling",
      description: "Edit and update production schedule",
      icon: <Calendar className="h-16 w-16" />,
      role: "manager" as WorkflowRole,
      path: "/scheduling",
      restricted: true
    },
    {
      title: "Deactivate Drum Label",
      description: "Replace drum label with reason",
      icon: <Tag className="h-16 w-16" />,
      role: "operator" as WorkflowRole,
      path: "/drums/label",
      restricted: false
    },
    {
      title: "Log Missing Stock",
      description: "Record and report missing inventory",
      icon: <ArchiveX className="h-16 w-16" />,
      role: "operator" as WorkflowRole,
      path: "/inventory/missing",
      restricted: false
    },
    {
      title: "Transfer Drum Contents",
      description: "Manage drum content transfers",
      icon: <RefreshCcw className="h-16 w-16" />,
      role: "operator" as WorkflowRole,
      path: "/drums/transfer",
      restricted: false
    },
    {
      title: "Quality Control Tasks",
      description: "Manage and lock quality control processes",
      icon: <ListChecks className="h-16 w-16" />,
      role: "admin" as WorkflowRole,
      path: "/quality",
      restricted: true
    }
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Workflow Dashboard</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {workflowCards.map((card, index) => (
            <WorkflowCard
              key={index}
              title={card.title}
              description={card.description}
              icon={card.icon}
              role={card.role}
              path={card.path}
              restricted={card.restricted}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
