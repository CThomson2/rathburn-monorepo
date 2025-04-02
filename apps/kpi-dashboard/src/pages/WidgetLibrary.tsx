
import React, { useState, useMemo } from "react";
import { useWidgets } from "@/contexts/WidgetContext";
import WidgetCard from "@/components/widgets/WidgetCard";
import WidgetPreviewModal from "@/components/widgets/WidgetPreviewModal";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WidgetCategory } from "@/components/widgets/Widget";
import { Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WidgetLibrary = () => {
  const { availableWidgets, addToDashboard, isWidgetInDashboard, canAddWidget } = useWidgets();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<WidgetCategory | "all">("all");
  const [previewWidget, setPreviewWidget] = useState<any | null>(null);

  // Filter widgets based on search and category
  const filteredWidgets = useMemo(() => {
    return availableWidgets.filter((widget) => {
      const matchesSearch =
        widget.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        widget.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || widget.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [availableWidgets, searchQuery, categoryFilter]);

  const handlePreview = (widget: any) => {
    setPreviewWidget(widget);
  };

  const handleAddToDashboard = (widgetId: string) => {
    addToDashboard(widgetId);
    if (previewWidget?.id === widgetId) {
      setPreviewWidget(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Widget Library</h1>
          <p className="text-muted-foreground">
            Browse and add widgets to customize your dashboard. Each widget provides different functionality to help you manage inventory and operations.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search widgets..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="md:col-span-4">
            <div className="relative flex items-center">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Select
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value as WidgetCategory | "all")}
              >
                <SelectTrigger className="pl-9">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="data">Data</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="reporting">Reporting</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWidgets.map((widget) => (
            <WidgetCard
              key={widget.id}
              id={widget.id}
              title={widget.title}
              description={widget.description}
              category={widget.category}
              icon={widget.icon}
              onPreview={() => handlePreview(widget)}
              onAddToDashboard={() => handleAddToDashboard(widget.id)}
              isInDashboard={isWidgetInDashboard(widget.id)}
              restricted={!canAddWidget(widget.id)}
            />
          ))}

          {filteredWidgets.length === 0 && (
            <div className="col-span-full p-12 text-center bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">No widgets found matching your filters.</p>
            </div>
          )}
        </div>

        {/* Preview Modal */}
        <WidgetPreviewModal
          open={previewWidget !== null}
          onClose={() => setPreviewWidget(null)}
          widget={previewWidget}
          onAddToDashboard={() => previewWidget && handleAddToDashboard(previewWidget.id)}
          isInDashboard={previewWidget ? isWidgetInDashboard(previewWidget.id) : false}
        />
      </div>
    </DashboardLayout>
  );
};

export default WidgetLibrary;
