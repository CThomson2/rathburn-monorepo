import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SessionConflictDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  conflictingSessionId: string | null; // To display if needed, or just for context
}

export function SessionConflictDialog({
  isOpen,
  onConfirm,
  onCancel,
  conflictingSessionId,
}: SessionConflictDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Session Conflict
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            An active stocktake session is already in progress for this device.
            {conflictingSessionId && (
              <span className="block mt-1 text-xs text-gray-500 dark:text-gray-400">
                (ID: {conflictingSessionId})
              </span>
            )}
            <br />
            Would you like to end the current session and start a new one?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex flex-col sm:flex-row sm:justify-end sm:space-x-2 space-y-2 sm:space-y-0">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            No, Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600"
          >
            Yes, Restart Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
