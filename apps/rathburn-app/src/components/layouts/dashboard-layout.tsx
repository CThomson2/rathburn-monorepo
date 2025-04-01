
import { useState } from "react";
import { Menu, X, Bell, User, Home, Package, Clipboard, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", icon: Home, current: true },
    { name: "Inventory", icon: Package, current: false },
    { name: "Orders", icon: Clipboard, current: false },
    { name: "Settings", icon: Settings, current: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-30",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="text-xl font-bold text-blue-600">InventoryPro</div>
          <button
            className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.name}
                href="#"
                className={cn(
                  "group flex items-center px-3 py-3 text-sm font-medium rounded-md",
                  item.current
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5",
                    item.current ? "text-blue-600" : "text-gray-500"
                  )}
                />
                {item.name}
              </a>
            ))}
          </div>
        </nav>
        <div className="absolute bottom-0 w-full border-t border-gray-200">
          <div className="px-4 py-4">
            <a
              href="#"
              className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50"
            >
              <LogOut className="mr-3 h-5 w-5 text-red-500" />
              Sign Out
            </a>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={cn("lg:pl-64 flex flex-col min-h-screen")}>
        {/* Top header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center space-x-4">
              <button className="p-1 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100">
                <Bell size={20} />
              </button>
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                <User size={18} />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
