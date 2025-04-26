import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Database, X } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions";

interface NavItem {
  name: string;
  url: string;
  icon: LucideIcon;
}

const Sidebar = ({
  navItems,
  isOpen,
  onToggle,
  onItemClick,
}: {
  navItems: NavItem[];
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  onItemClick: (url: string) => void;
}) => {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/30 transform transition-transform duration-300 ease-in-out z-30",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="flex items-center justify-between h-12 px-4 border-b border-gray-200 dark:border-gray-700">
        <div className="text-lg font-bold text-[#bc261a] dark:text-red-500 alfa-font">
          RATHBURN ONLINE
        </div>
        <button
          className="p-1.5 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 lg:hidden"
          onClick={() => onToggle(!isOpen)}
          aria-label="Close sidebar"
        >
          {/* @ts-ignore - React/TypeScript compatibility issue */}
          <X size={18} />
        </button>
      </div>
      <nav className="mt-3 px-2">
        <div className="space-y-1">
          {navItems.map((item, index) => {
            const isActive =
              pathname === item.url ||
              (item.url !== "/" && pathname.startsWith(item.url));

            const Icon = item.icon;
            const previousItem = index > 0 ? navItems[index - 1] : null;

            return (
              <div key={item.name}>
                {previousItem && previousItem.url === item.url && (
                  <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
                )}
                <button
                  onClick={() => onItemClick(item.url)}
                  data-nav-url={item.url}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left",
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50"
                  )}
                >
                  {/* @ts-ignore - React/TypeScript compatibility issue */}
                  <Icon
                    className={cn(
                      "mr-3 h-5 w-5",
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    )}
                  />
                  {item.name}
                </button>
              </div>
            );
          })}
        </div>
      </nav>
      {/* Bottom of sidebar */}
      <div className="absolute bottom-0 w-full border-t border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4 space-y-3">
          {/* Database button */}
          <Button
            variant="outline"
            className="flex items-center justify-start w-full gap-2 text-foreground dark:text-gray-300"
            asChild
          >
            <Link
              href={`${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL}`}
              target="_blank"
            >
              <Database className="h-4 w-4" />
              <span>Database</span>
            </Link>
          </Button>

          {/* Sign out button */}
          <form action={signOutAction}>
            <Button
              variant="outline"
              type="submit"
              className="group flex items-center w-full text-sm font-medium rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {/* @ts-ignore - React/TypeScript compatibility issue */}
              <LogOut className="mr-2 h-5 w-5 text-red-500 dark:text-red-400" />
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
