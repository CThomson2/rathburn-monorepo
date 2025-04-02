"use client";

import { useState, useEffect, cloneElement } from "react";
import { useDashboard } from "@/context";
import { ViewToggle } from "@/features/old-widgets/view-toggle";
import { StockLevelsWidget } from "@/features/old-widgets/widgets/stock-levels";
// import { MaterialGroupsWidget } from "@/features/old-widgets/widgets/material-groups";
import { ProductionWidget } from "@/features/old-widgets/widgets/active-processes";
// import { RecentOrdersWidget } from "@/features/old-widgets/widgets/recent-orders";
import { StatsWidget } from "@/features/old-widgets/widgets/top-stats";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

// Define widget configurations with layout classes
const widgetConfigurations = [
  {
    id: "stats",
    component: <StatsWidget id="stats" />,
    className: "col-span-full",
  },
  { id: "stock-levels", component: <StockLevelsWidget id="stock-levels" /> },
    // {
    //   id: "material-groups",
    //   component: <MaterialGroupsWidget id="material-groups" />,
    //   className: "col-span-full lg:col-span-2",
    // },
    // { id: "recent-orders", component: <RecentOrdersWidget id="recent-orders" /> },
  { id: "production", component: <ProductionWidget id="production" /> },
];

// Type for widget order storage
interface WidgetOrder {
  [key: string]: number;
}

export function DashboardContent() {
  const { view, favorites } = useDashboard();
  const [widgetOrder, setWidgetOrder] = useState<WidgetOrder>(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dashboard-widget-order");
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  // Save widget order to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("dashboard-widget-order", JSON.stringify(widgetOrder));
  }, [widgetOrder]);

  // Filter widgets based on the current view
  const visibleWidgets =
    view === "all"
      ? widgetConfigurations
      : widgetConfigurations
          .filter((widget) => favorites.includes(widget.id))
          .sort((a, b) => (widgetOrder[a.id] || 0) - (widgetOrder[b.id] || 0));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = visibleWidgets.findIndex(
        (item) => item.id === active.id
      );
      const newIndex = visibleWidgets.findIndex((item) => item.id === over.id);

      // Update the order of widgets
      const newOrder: WidgetOrder = {};
      const reorderedWidgets = arrayMove(visibleWidgets, oldIndex, newIndex);
      reorderedWidgets.forEach((widget, index) => {
        newOrder[widget.id] = index;
      });
      setWidgetOrder(newOrder);
    }
  }

  return (
    <main className="min-h-screen bg-background/95 dark:bg-background/90">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <ViewToggle />
        </div>

        {view === "favorites" && visibleWidgets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No favorite widgets added yet. Customize your dashboard by
              clicking the star icon in the &quot;All Widgets&quot; view.
            </p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {view === "favorites" ? (
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={visibleWidgets.map((w) => w.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleWidgets.map((widget) => (
                      <div key={widget.id} className={widget.className || ""}>
                        {cloneElement(widget.component, { id: widget.id })}
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleWidgets.map((widget) => (
                  <div key={widget.id} className={widget.className || ""}>
                    {cloneElement(widget.component, { id: widget.id })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
