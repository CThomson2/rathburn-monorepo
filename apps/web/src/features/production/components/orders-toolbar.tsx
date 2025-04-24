
import { useState } from "react";
import { 
  Search, 
  Plus, 
  Filter, 
  CalendarRange, 
  SortDesc, 
  Flag 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type OrdersToolbarProps = {
  onSearch: (query: string) => void;
  onFilter: (filters: any) => void;
  onSort: (sortBy: string) => void;
  onNewOrder: () => void;
}

export const OrdersToolbar = ({ 
  onSearch, 
  onFilter, 
  onSort, 
  onNewOrder
}: OrdersToolbarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    toast({
      title: "Search applied",
      description: `Showing results for "${searchQuery}"`,
    });
  };
  
  const sortOptions = [
    { label: "Newest First", value: "date-desc" },
    { label: "Oldest First", value: "date-asc" },
    { label: "Priority (High-Low)", value: "priority-desc" },
    { label: "Status", value: "status" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 mb-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center">
          <button
            onClick={onNewOrder}
            className="flex items-center px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            <span>New Order</span>
          </button>
        </div>

        <div className="flex flex-1 max-w-xl">
          <form onSubmit={handleSearch} className="flex-1 flex">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 rounded-l-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-blue text-white rounded-r-lg hover:bg-blue-600 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        <div className="flex space-x-2">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
            >
              <Filter size={18} />
            </button>
            
            {showFilters && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-10">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Filter By:</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select className="block w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700">
                      <option value="">All Statuses</option>
                      <option value="preparing">Preparing</option>
                      <option value="distillation">Distillation</option>
                      <option value="qc">QC</option>
                      <option value="complete">Complete</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date Range
                    </label>
                    <div className="flex items-center">
                      <CalendarRange size={14} className="mr-2 text-gray-500" />
                      <input 
                        type="date" 
                        className="block w-full p-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <div className="flex items-center">
                      <Flag size={14} className="mr-2 text-gray-500" />
                      <select className="block w-full p-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700">
                        <option value="">All Priorities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button 
                    className="px-3 py-1 text-xs bg-brand-blue text-white rounded hover:bg-blue-600 transition-colors"
                    onClick={() => {
                      setShowFilters(false);
                      // Apply filters
                    }}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="relative">
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
            >
              <SortDesc size={18} />
            </button>
            {/* Sort dropdown would go here */}
          </div>
        </div>
      </div>
    </div>
  );
};
