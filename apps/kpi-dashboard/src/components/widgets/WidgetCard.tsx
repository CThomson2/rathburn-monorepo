
import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WidgetCategory } from "./Widget";
import { cn } from "@/lib/utils";
import { Plus, Maximize } from "lucide-react";

const categoryColors = {
  data: "border-blue-500",
  notification: "border-amber-500",
  admin: "border-purple-500",
  reporting: "border-green-500",
  inventory: "border-indigo-500"
};

export interface WidgetCardProps {
  id: string;
  title: string;
  description: string;
  category: WidgetCategory;
  icon: React.ReactNode;
  onPreview: () => void;
  onAddToDashboard: () => void;
  isInDashboard?: boolean;
  restricted?: boolean;
}

const WidgetCard = ({
  id,
  title,
  description,
  category,
  icon,
  onPreview,
  onAddToDashboard,
  isInDashboard = false,
  restricted = false
}: WidgetCardProps) => {
  return (
    <Card 
      className={cn(
        "overflow-hidden h-full transition-all duration-200 hover:shadow-lg relative group",
        `border-t-4 ${categoryColors[category]}`
      )}
    >
      <CardHeader className="p-4 pb-2 flex items-center gap-3">
        <div className="p-3 bg-muted rounded-md">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-lg leading-tight">{title}</h3>
          <div className="inline-block px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
            {category}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onPreview}>
          <Maximize className="h-4 w-4 mr-1" />
          Preview
        </Button>
        
        <Button 
          size="sm" 
          onClick={onAddToDashboard}
          disabled={isInDashboard || restricted}
        >
          <Plus className="h-4 w-4 mr-1" />
          {isInDashboard ? "Added" : "Add to Dashboard"}
        </Button>
      </CardFooter>
      
      {restricted && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="bg-muted p-3 rounded-md text-center">
            <span className="text-sm font-medium">Restricted Access</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default WidgetCard;
