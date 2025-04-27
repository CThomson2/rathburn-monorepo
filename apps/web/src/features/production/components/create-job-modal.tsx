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
} from "@/app/(routes)/production/actions/production";
import { useToast } from "@/components/ui/use-toast";

/**
 * Props for the CreateJobModal component
 * @interface CreateJobModalProps
 * @property {boolean} isOpen - Whether the modal is open
 * @property {() => void} onClose - Function to call when the modal is closed
 * @property {() => void} onJobCreated - Function to call when a job is successfully created
 */
type CreateJobModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: () => void;
};

/**
 * Modal component for creating a new production job
 * Allows users to select an item, input batch, scheduled date, and priority
 *
 * @component
 * @param {CreateJobModalProps} props - Component props
 * @returns {JSX.Element} The rendered modal component
 */
export const CreateJobModal = ({
  isOpen,
  onClose,
  onJobCreated,
}: CreateJobModalProps) => {
  // State for items and batches fetched from the server
  const [items, setItems] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form state with default values
  const [formData, setFormData] = useState({
    itemId: "",
    batchId: "",
    plannedDate: "",
    priority: "5", // Default priority is medium (5)
  });

  const { toast } = useToast();

  /**
   * Fetch items and batches when the modal opens
   */
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  /**
   * Fetches items and available batches from the server
   * Sets loading state and handles errors
   */
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch items and batches in parallel for better performance
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

  /**
   * Updates form data when a field changes
   *
   * @param {string} key - The form field to update
   * @param {string} value - The new value for the field
   */
  const handleChange = (key: string, value: string) => {
    setFormData({
      ...formData,
      [key]: value,
    });
  };

  /**
   * Handles form submission to create a new production job
   * Validates input and shows appropriate toast messages
   *
   * @param {React.FormEvent} e - The form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use provided date or default to current date
      const plannedDate = formData.plannedDate
        ? new Date(formData.plannedDate)
        : new Date();

      // Create the job with the API
      const jobId = await createProductionJob(
        formData.itemId,
        formData.batchId,
        plannedDate,
        parseInt(formData.priority)
      );

      if (jobId) {
        // Success case
        toast({
          title: "Job created successfully",
          description: `Job ID: ${jobId}`,
        });
        onJobCreated(); // Trigger refresh of parent component
        onClose(); // Close the modal
      } else {
        // API returned but no job ID
        toast({
          title: "Failed to create job",
          description: "An error occurred while creating the job",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Exception occurred during API call
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
          {/* Item selection field */}
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

          {/* Batch selection field */}
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

          {/* Date/time picker for scheduling */}
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

          {/* Priority selection field */}
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

          {/* Form action buttons */}
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
