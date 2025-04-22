
import { useState } from "react";
import { CheckCircle, AlertTriangle, Edit2, Loader, Search, Filter, ChevronDown, Bell, User, Plus, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import OrderCard from "@/components/OrderCard";
import { toast } from "@/components/ui/use-toast";

// Define the structure for production orders
export interface ProductionOrder {
  id: string;
  itemName: string;
  supplier: string;
  quantity: number;
  scheduledDate: Date;
  status: "Preparing" | "In-distillation" | "QC Pending" | "Complete";
  progress: number;
  priority: "Low" | "Medium" | "High";
  drums: {
    serial: string;
    volume: number;
    location: string;
  }[];
  timeline: {
    event: string;
    timestamp: Date;
    user?: string;
  }[];
  tasks: {
    name: string;
    completed: boolean;
    scanRequired: boolean;
  }[];
}

// Mock data for production orders
const mockOrders: ProductionOrder[] = [
  {
    id: "ORD-2025-04-001",
    itemName: "Industrial Solvent A",
    supplier: "ChemTech Industries",
    quantity: 12,
    scheduledDate: new Date(2025, 3, 22, 9, 0),
    status: "In-distillation",
    progress: 50,
    priority: "High",
    drums: [
      { serial: "DRM-001", volume: 200, location: "Distillation Unit 3" },
      { serial: "DRM-002", volume: 200, location: "Distillation Unit 3" },
      { serial: "DRM-003", volume: 0, location: "Storage Area B" },
    ],
    timeline: [
      { event: "Order Created", timestamp: new Date(2025, 3, 20, 14, 30), user: "John Smith" },
      { event: "Preparation Started", timestamp: new Date(2025, 3, 21, 8, 15), user: "Alice Johnson" },
      { event: "Drums Assigned", timestamp: new Date(2025, 3, 21, 10, 45), user: "Alice Johnson" },
      { event: "Distillation Started", timestamp: new Date(2025, 3, 22, 9, 30), user: "Robert Chen" },
    ],
    tasks: [
      { name: "Raw Material Check", completed: true, scanRequired: true },
      { name: "Preparation Setup", completed: true, scanRequired: true },
      { name: "Distillation Process", completed: false, scanRequired: true },
      { name: "Quality Control Check", completed: false, scanRequired: true },
      { name: "Packaging", completed: false, scanRequired: false },
    ],
  },
  {
    id: "ORD-2025-04-002",
    itemName: "Cleaning Solution B",
    supplier: "PureChem Corp",
    quantity: 8,
    scheduledDate: new Date(2025, 3, 23, 11, 0),
    status: "Preparing",
    progress: 20,
    priority: "Medium",
    drums: [
      { serial: "DRM-010", volume: 0, location: "Preparation Area A" },
      { serial: "DRM-011", volume: 0, location: "Preparation Area A" },
    ],
    timeline: [
      { event: "Order Created", timestamp: new Date(2025, 3, 21, 9, 45), user: "Sarah Wong" },
      { event: "Material Requisition", timestamp: new Date(2025, 3, 22, 13, 20), user: "Michael Brown" },
    ],
    tasks: [
      { name: "Raw Material Check", completed: true, scanRequired: true },
      { name: "Preparation Setup", completed: false, scanRequired: true },
      { name: "Distillation Process", completed: false, scanRequired: true },
      { name: "Quality Control Check", completed: false, scanRequired: true },
      { name: "Packaging", completed: false, scanRequired: false },
    ],
  },
  {
    id: "ORD-2025-04-003",
    itemName: "Catalyst XR-7",
    supplier: "Advanced Materials Inc",
    quantity: 5,
    scheduledDate: new Date(2025, 3, 21, 14, 30),
    status: "QC Pending",
    progress: 75,
    priority: "High",
    drums: [
      { serial: "DRM-022", volume: 150, location: "QC Laboratory" },
      { serial: "DRM-023", volume: 150, location: "QC Laboratory" },
      { serial: "DRM-024", volume: 150, location: "QC Laboratory" },
    ],
    timeline: [
      { event: "Order Created", timestamp: new Date(2025, 3, 19, 11, 15), user: "John Smith" },
      { event: "Preparation Started", timestamp: new Date(2025, 3, 20, 8, 30), user: "Alice Johnson" },
      { event: "Distillation Complete", timestamp: new Date(2025, 3, 21, 9, 45), user: "Robert Chen" },
      { event: "QC Samples Collected", timestamp: new Date(2025, 3, 21, 15, 20), user: "Emily Davis" },
    ],
    tasks: [
      { name: "Raw Material Check", completed: true, scanRequired: true },
      { name: "Preparation Setup", completed: true, scanRequired: true },
      { name: "Distillation Process", completed: true, scanRequired: true },
      { name: "Quality Control Check", completed: false, scanRequired: true },
      { name: "Packaging", completed: false, scanRequired: false },
    ],
  },
  {
    id: "ORD-2025-04-004",
    itemName: "Industrial Adhesive",
    supplier: "BondTech Solutions",
    quantity: 10,
    scheduledDate: new Date(2025, 3, 20, 10, 0),
    status: "Complete",
    progress: 100,
    priority: "Low",
    drums: [
      { serial: "DRM-035", volume: 180, location: "Shipping Area" },
      { serial: "DRM-036", volume: 180, location: "Shipping Area" },
      { serial: "DRM-037", volume: 180, location: "Shipping Area" },
      { serial: "DRM-038", volume: 180, location: "Shipping Area" },
    ],
    timeline: [
      { event: "Order Created", timestamp: new Date(2025, 3, 18, 13, 45), user: "Sarah Wong" },
      { event: "Preparation Started", timestamp: new Date(2025, 3, 19, 9, 30), user: "Michael Brown" },
      { event: "Distillation Complete", timestamp: new Date(2025, 3, 19, 16, 15), user: "Robert Chen" },
      { event: "QC Approved", timestamp: new Date(2025, 3, 20, 11, 45), user: "Emily Davis" },
      { event: "Ready for Shipping", timestamp: new Date(2025, 3, 20, 14, 30), user: "Thomas Garcia" },
    ],
    tasks: [
      { name: "Raw Material Check", completed: true, scanRequired: true },
      { name: "Preparation Setup", completed: true, scanRequired: true },
      { name: "Distillation Process", completed: true, scanRequired: true },
      { name: "Quality Control Check", completed: true, scanRequired: true },
      { name: "Packaging", completed: true, scanRequired: false },
    ],
  },
];

// Format date to display in a user-friendly way
const formatDate = (date: Date): string => {
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const ProductionManagement = () => {
  const [orders, setOrders] = useState<ProductionOrder[]>(mockOrders);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<string>("date");
  const [darkMode, setDarkMode] = useState(false);

  // Handle new order creation
  const handleNewOrder = () => {
    toast({
      title: "New Order",
      description: "Order creation form would open here",
    });
    // In a real app, this would open a modal or navigate to a form
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle filter status change
  const handleFilterChange = (status: string | null) => {
    setFilterStatus(status);
  };

  // Handle sort option change
  const handleSortChange = (option: string) => {
    setSortOption(option);
  };

  // Filter and sort orders based on user selections
  const filteredOrders = orders
    .filter(order => {
      // Apply status filter if selected
      if (filterStatus && order.status !== filterStatus) return false;
      
      // Apply search query if provided
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return order.id.toLowerCase().includes(query) ||
               order.itemName.toLowerCase().includes(query) ||
               order.supplier.toLowerCase().includes(query);
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort based on selected option
      switch (sortOption) {
        case "date":
          return a.scheduledDate.getTime() - b.scheduledDate.getTime();
        case "priority":
          const priorityValues = { "High": 0, "Medium": 1, "Low": 2 };
          return priorityValues[a.priority] - priorityValues[b.priority];
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex justify-between items-center px-4 py-3">
          <h1 className="text-xl font-bold text-industrial-darkGray dark:text-gray-100">
            Production Management
          </h1>
          <div className="flex items-center space-x-3">
            <button 
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg> :
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              }
            </button>
            <button className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-industrial-red rounded-full"></span>
            </button>
            <button className="p-1 rounded-full bg-industrial-blue text-white">
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 px-4 py-3 space-y-3 shadow-sm">
        <div className="flex justify-between items-center">
          <Button 
            onClick={handleNewOrder}
            className="bg-industrial-blue text-white hover:bg-industrial-blue/90"
          >
            <Plus className="h-4 w-4 mr-1" /> New Order
          </Button>
          
          <div className="relative flex-1 max-w-xs ml-3">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search orders..."
              className="pl-8 pr-4 py-2 w-full"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Filter className="h-4 w-4 mr-1" />
                Filter
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Status</p>
                <div className="flex flex-col space-y-1">
                  <button
                    className={`text-left px-2 py-1 rounded ${filterStatus === null ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                    onClick={() => handleFilterChange(null)}
                  >
                    All
                  </button>
                  <button
                    className={`text-left px-2 py-1 rounded ${filterStatus === 'Preparing' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                    onClick={() => handleFilterChange('Preparing')}
                  >
                    Preparing
                  </button>
                  <button
                    className={`text-left px-2 py-1 rounded ${filterStatus === 'In-distillation' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                    onClick={() => handleFilterChange('In-distillation')}
                  >
                    In-distillation
                  </button>
                  <button
                    className={`text-left px-2 py-1 rounded ${filterStatus === 'QC Pending' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                    onClick={() => handleFilterChange('QC Pending')}
                  >
                    QC Pending
                  </button>
                  <button
                    className={`text-left px-2 py-1 rounded ${filterStatus === 'Complete' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                    onClick={() => handleFilterChange('Complete')}
                  >
                    Complete
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center">
                Sort
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Sort by</p>
                <div className="flex flex-col space-y-1">
                  <button
                    className={`text-left px-2 py-1 rounded ${sortOption === 'date' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                    onClick={() => handleSortChange('date')}
                  >
                    Scheduled Date
                  </button>
                  <button
                    className={`text-left px-2 py-1 rounded ${sortOption === 'priority' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                    onClick={() => handleSortChange('priority')}
                  >
                    Priority
                  </button>
                  <button
                    className={`text-left px-2 py-1 rounded ${sortOption === 'status' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                    onClick={() => handleSortChange('status')}
                  >
                    Status
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Order List */}
      <main className="flex-1 p-4 space-y-4 overflow-auto">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 py-12">
            <Package className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No orders found</p>
            <p className="text-sm">Try adjusting your filters or search query</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <OrderCard 
              key={order.id}
              order={order}
              onUpdate={(updatedOrder) => {
                // In a real app, this would update the order in the database
                // and then refresh the local state
                const updatedOrders = orders.map(o => 
                  o.id === updatedOrder.id ? updatedOrder : o
                );
                setOrders(updatedOrders);
              }}
              onScan={(orderId, taskName) => {
                // In a real app, this would trigger the barcode scanner
                // and process the result
                toast({
                  title: "Scan Initiated",
                  description: `Starting scan for ${taskName} on order ${orderId}`,
                });
              }}
            />
          ))
        )}
      </main>
    </div>
  );
};

export default ProductionManagement;
