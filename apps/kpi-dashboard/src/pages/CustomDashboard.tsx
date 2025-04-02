
import React, { useState } from "react";
import { useWidgets } from "@/contexts/WidgetContext";
import { Widget } from "@/components/widgets/Widget";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CustomDashboard = () => {
  const { dashboardWidgets, removeFromDashboard } = useWidgets();
  const navigate = useNavigate();

  const handleAddWidget = () => {
    navigate("/widget-library");
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Your Dashboard</h1>
            <p className="text-muted-foreground">
              Your personalized dashboard with the widgets that matter most to you.
            </p>
          </div>
          <Button onClick={handleAddWidget}>
            <Plus className="h-4 w-4 mr-2" />
            Add Widget
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardWidgets.map((widget) => (
            <div key={widget.id} className="h-[320px]">
              <Widget
                id={widget.id}
                title={widget.title}
                category={widget.category}
                description={widget.description}
                icon={widget.icon}
                isRemovable={!widget.isCore}
                onRemove={() => removeFromDashboard(widget.id)}
                className="h-full"
              >
                {widget.component}
              </Widget>
            </div>
          ))}

          {dashboardWidgets.length === 0 && (
            <div className="col-span-full p-16 text-center bg-muted/50 rounded-lg">
              <h3 className="text-lg font-medium mb-2">No widgets added yet</h3>
              <p className="text-muted-foreground mb-4">
                Your dashboard is empty. Add widgets from the widget library to get started.
              </p>
              <Button onClick={handleAddWidget}>
                <Plus className="h-4 w-4 mr-2" />
                Browse Widget Library
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomDashboard;
