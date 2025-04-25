// src/features/production/components/create-job-modal.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createProductionJob,
  fetchAvailableBatches,
  fetchItems,
} from "../services/production-service";
import { useToast } from "@/hooks/use-toast";

type CreateJobModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: () => void;
};

export const CreateJobModal = ({
  isOpen,
  onClose,
  onJobCreated,
}: CreateJobModalProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    itemId: "",
    batchId: "",
    plannedDate: "",
    priority: "5",
  });
  const { toast } = useToast();

  // Fetch items and batches when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [itemsData, batchesData] = await Promise.all([
        fetchItems(),
        fetchAvailableBatches(),
      ]);
      setItems(itemsData);
      setBatches(batchesData);
    } catch (error) {
      toast({
        title: "Error fetching data",
        description: "Could not load items and batches",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData({
      ...formData,
      [key]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create the job
      const plannedDate = formData.plannedDate
        ? new Date(formData.plannedDate)
        : new Date();

      const jobId = await createProductionJob(
        formData.itemId,
        formData.batchId,
        plannedDate,
        parseInt(formData.priority)
      );

      if (jobId) {
        toast({
          title: "Job created successfully",
          description: `Job ID: ${jobId}`,
        });
        onJobCreated();
        onClose();
      } else {
        toast({
          title: "Failed to create job",
          description: "An error occurred while creating the job",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Production Job</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="item">Material/Item</Label>
            <Select
              value={formData.itemId}
              onValueChange={(value) => handleChange("itemId", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.item_id} value={item.item_id}>
                    {item.name} ({item.material?.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="batch">Input Batch</Label>
            <Select
              value={formData.batchId}
              onValueChange={(value) => handleChange("batchId", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an input batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.batch_id} value={batch.batch_id}>
                    {batch.item_name} - {batch.drums_in_stock} drums in stock
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plannedDate">Scheduled Date</Label>
            <Input
              id="plannedDate"
              type="datetime-local"
              value={formData.plannedDate}
              onChange={(e) => handleChange("plannedDate", e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority (1-10)</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => handleChange("priority", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Lowest</SelectItem>
                <SelectItem value="3">3 - Low</SelectItem>
                <SelectItem value="5">5 - Medium</SelectItem>
                <SelectItem value="8">8 - High</SelectItem>
                <SelectItem value="10">10 - Highest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.itemId || !formData.batchId}
            >
              {isLoading ? "Creating..." : "Create Job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
