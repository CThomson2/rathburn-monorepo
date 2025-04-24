
import { useState, useEffect } from "react";
// import { Header } from "@/components/layout/header";
// import { Sidebar } from "@/components/layout/sidebar";
import { Order } from "@/features/production/types";
import { AnimatedOrderCard } from "@/features/production";
import { OrdersToolbar } from "@/features/production";
import { useToast } from "@/hooks/use-toast";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";

// Mock data
const mockOrders: Order[] = [
  {
    id: "ORD-2023-1289",
    itemName: "Lavender Essential Oil",
    supplier: "OrganicSupply Co.",
    quantity: 12,
    scheduledDate: "2025-04-22T13:00:00.000Z",
    status: "preparing",
    progress: 15,
    priority: "high",
    drums: [
      { id: "1", serial: "DR-5566", volume: 55, location: "Warehouse B" },
      { id: "2", serial: "DR-5567", volume: 54, location: "Warehouse B" }
    ],
    tasks: [
      { name: "Prepare raw materials", completed: true },
      { name: "Set up distillation equipment", completed: false },
      { name: "Run quality checks", completed: false },
    ],
    timeline: [
      { event: "Order created", timestamp: "2025-04-20T09:15:00.000Z", user: "John Doe" },
      { event: "Materials prepared", timestamp: "2025-04-21T14:30:00.000Z", user: "Sarah Kim" }
    ]
  },
  {
    id: "ORD-2023-1257",
    itemName: "Eucalyptus Oil",
    supplier: "Naturals Inc.",
    quantity: 8,
    scheduledDate: "2025-04-18T10:30:00.000Z",
    status: "distillation",
    progress: 50,
    priority: "medium",
    drums: [
      { id: "3", serial: "DR-5533", volume: 60, location: "Warehouse A" },
      { id: "4", serial: "DR-5534", volume: 60, location: "Warehouse A" }
    ],
    tasks: [
      { name: "Prepare raw materials", completed: true },
      { name: "Set up distillation equipment", completed: true },
      { name: "Run quality checks", completed: false },
    ],
    timeline: [
      { event: "Order created", timestamp: "2025-04-16T11:20:00.000Z", user: "John Doe" },
      { event: "Materials prepared", timestamp: "2025-04-17T13:45:00.000Z", user: "Sarah Kim" },
      { event: "Distillation started", timestamp: "2025-04-18T09:30:00.000Z", user: "Mike Chen" }
    ]
  },
  {
    id: "ORD-2023-1201",
    itemName: "Peppermint Extract",
    supplier: "Essential Extracts",
    quantity: 15,
    scheduledDate: "2025-04-15T09:00:00.000Z",
    status: "qc",
    progress: 75,
    priority: "high",
    drums: [
      { id: "5", serial: "DR-5502", volume: 58, location: "QC Lab" },
      { id: "6", serial: "DR-5503", volume: 59, location: "QC Lab" },
      { id: "7", serial: "DR-5504", volume: 57, location: "QC Lab" }
    ],
    tasks: [
      { name: "Prepare raw materials", completed: true },
      { name: "Set up distillation equipment", completed: true },
      { name: "Run quality checks", completed: true },
      { name: "Prepare for dispatch", completed: false }
    ],
    timeline: [
      { event: "Order created", timestamp: "2025-04-10T08:15:00.000Z", user: "John Doe" },
      { event: "Materials prepared", timestamp: "2025-04-11T10:30:00.000Z", user: "Sarah Kim" },
      { event: "Distillation started", timestamp: "2025-04-12T09:00:00.000Z", user: "Mike Chen" },
      { event: "Distillation completed", timestamp: "2025-04-13T18:45:00.000Z", user: "Mike Chen" },
      { event: "Quality control started", timestamp: "2025-04-14T09:30:00.000Z", user: "Alex Wong" }
    ]
  },
  {
    id: "ORD-2023-1187",
    itemName: "Tea Tree Oil",
    supplier: "AusNaturals",
    quantity: 10,
    scheduledDate: "2025-04-10T14:00:00.000Z",
    status: "complete",
    progress: 100,
    priority: "low",
    drums: [
      { id: "8", serial: "DR-5490", volume: 60, location: "Dispatch" },
      { id: "9", serial: "DR-5491", volume: 60, location: "Dispatch" }
    ],
    tasks: [
      { name: "Prepare raw materials", completed: true },
      { name: "Set up distillation equipment", completed: true },
      { name: "Run quality checks", completed: true },
      { name: "Prepare for dispatch", completed: true }
    ],
    timeline: [
      { event: "Order created", timestamp: "2025-04-05T09:15:00.000Z", user: "John Doe" },
      { event: "Materials prepared", timestamp: "2025-04-06T11:30:00.000Z", user: "Sarah Kim" },
      { event: "Distillation started", timestamp: "2025-04-07T10:00:00.000Z", user: "Mike Chen" },
      { event: "Distillation completed", timestamp: "2025-04-08T17:15:00.000Z", user: "Mike Chen" },
      { event: "Quality control passed", timestamp: "2025-04-09T14:30:00.000Z", user: "Alex Wong" },
      { event: "Ready for dispatch", timestamp: "2025-04-10T11:00:00.000Z", user: "Lisa Park" }
    ]
  },
  {
    id: "ORD-2023-1156",
    itemName: "Rosemary Extract",
    supplier: "MedHerbs Co.",
    quantity: 5,
    scheduledDate: "2025-04-12T11:00:00.000Z",
    status: "error",
    progress: 60,
    priority: "medium",
    drums: [
      { id: "10", serial: "DR-5472", volume: 55, location: "QC Lab" }
    ],
    tasks: [
      { name: "Prepare raw materials", completed: true },
      { name: "Set up distillation equipment", completed: true },
      { name: "Run quality checks", completed: true },
      { name: "Resolve quality issues", completed: false }
    ],
    timeline: [
      { event: "Order created", timestamp: "2025-04-08T10:15:00.000Z", user: "John Doe" },
      { event: "Materials prepared", timestamp: "2025-04-09T13:30:00.000Z", user: "Sarah Kim" },
      { event: "Distillation started", timestamp: "2025-04-10T10:45:00.000Z", user: "Mike Chen" },
      { event: "Distillation completed", timestamp: "2025-04-11T16:30:00.000Z", user: "Mike Chen" },
      { event: "Quality control failed", timestamp: "2025-04-12T11:15:00.000Z", user: "Alex Wong" },
      { event: "Issue reported: Contamination", timestamp: "2025-04-12T11:45:00.000Z", user: "Alex Wong" }
    ]
  }
];

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate API call
    const fetchOrders = async () => {
      try {
        // In a real app, this would be an API call:
        // const response = await fetch('/api/orders');
        // const data = await response.json();
        // setOrders(data);
        
        // Using mock data for demonstration
        setTimeout(() => {
          setOrders(mockOrders);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast({
          title: "Error loading orders",
          description: "Please try again later.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchOrders();
    
    // Set up SSE listener for real-time updates
    // const events = new EventSource('/api/events');
    // events.addEventListener('order-update', handleOrderUpdate);
    // return () => events.close();
  }, []);
  
  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };
  
  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // In a real app, this would filter the orders or trigger an API call
  };
  
  const handleFilter = (filters: any) => {
    console.log("Applying filters:", filters);
    // In a real app, this would filter the orders or trigger an API call
  };
  
  const handleSort = (sortBy: string) => {
    console.log("Sorting by:", sortBy);
    // In a real app, this would sort the orders
  };
  
  const handleNewOrder = () => {
    toast({
      title: "Creating new order",
      description: "New order form would open here",
    });
    // In a real app, this would open a modal or navigate to a form
  };
  
  // Keyboard navigation for order cards
  const handleOrderSelect = (order: Order, index: number) => {
    // This would typically expand the order card or navigate to it
    toast({
      title: `Selected order ${order.id}`,
      description: "Order details would open here",
    });
  };
  
  const { activeIndex, registerRef } = useKeyboardNavigation(orders, handleOrderSelect);

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'dark' : ''}`}>
      
      <div className="flex-1 flex flex-col">
        
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-y-auto min-h-0">
          <OrdersToolbar 
            onSearch={handleSearch}
            onFilter={handleFilter}
            onSort={handleSort}
            onNewOrder={handleNewOrder}
          />
          
          <div className="p-6">
            {loading ? (
              // Skeleton loader
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order, index) => (
                  <AnimatedOrderCard key={order.id} order={order} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No orders found</h3>
                <p className="mt-1 text-gray-500 dark:text-gray-400">Create a new order to get started.</p>
                <button 
                  onClick={handleNewOrder}
                  className="mt-4 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Create Order
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrdersPage;
