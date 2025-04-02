
import React, { ReactNode } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Grip, MoreHorizontal, X } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export type WidgetCategory = "data" | "notification" | "admin" | "reporting" | "inventory";

const categoryColors = {
  data: "border-blue-500",
  notification: "border-amber-500",
  admin: "border-purple-500",
  reporting: "border-green-500",
  inventory: "border-indigo-500"
};

export interface WidgetProps {
  id: string;
  title: string;
  category: WidgetCategory;
  description: string;
  icon?: ReactNode;
  isRemovable?: boolean;
  onRemove?: () => void;
  className?: string;
  children: ReactNode;
}

export const Widget = ({
  id,
  title,
  category,
  description,
  icon,
  isRemovable = true,
  onRemove,
  className,
  children
}: WidgetProps) => {
  return (
    <Card 
      className={cn(
        "shadow-md transition-all duration-200 h-full",
        `border-t-4 ${categoryColors[category]}`,
        className
      )}
      data-widget-id={id}
    >
      <CardHeader className="p-3 border-b flex flex-row justify-between items-center">
        <div className="flex items-center gap-2">
          {icon && <div className="text-muted-foreground">{icon}</div>}
          <div>
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="text-xs text-muted-foreground hidden md:block">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="cursor-move">
            <Grip className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Widget menu</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Refresh</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              {isRemovable && onRemove && (
                <DropdownMenuItem className="text-red-500" onClick={onRemove}>
                  Remove
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {isRemovable && onRemove && (
            <button 
              onClick={onRemove}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        {children}
      </CardContent>
    </Card>
  );
};
