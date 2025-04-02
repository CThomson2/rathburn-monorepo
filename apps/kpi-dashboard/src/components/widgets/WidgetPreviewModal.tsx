
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Widget, WidgetCategory } from "./Widget";
import { Plus } from "lucide-react";

interface WidgetPreviewModalProps {
  open: boolean;
  onClose: () => void;
  widget: {
    id: string;
    title: string;
    description: string;
    category: WidgetCategory;
    icon: React.ReactNode;
    component: React.ReactNode;
  } | null;
  onAddToDashboard: () => void;
  isInDashboard?: boolean;
}

const WidgetPreviewModal = ({
  open,
  onClose,
  widget,
  onAddToDashboard,
  isInDashboard = false
}: WidgetPreviewModalProps) => {
  if (!widget) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Widget Preview: {widget.title}</span>
          </DialogTitle>
          <DialogDescription>
            {widget.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Widget
            id={widget.id}
            title={widget.title}
            category={widget.category}
            description={widget.description}
            icon={widget.icon}
            isRemovable={false}
          >
            {widget.component}
          </Widget>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            onClick={onAddToDashboard} 
            disabled={isInDashboard}
          >
            <Plus className="h-4 w-4 mr-1" />
            {isInDashboard ? "Already Added" : "Add to Dashboard"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WidgetPreviewModal;
