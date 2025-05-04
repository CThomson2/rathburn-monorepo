"use client";

import * as React from "react";
import {
  QrCode,
  Scan,
  X,
  Play,
  StopCircle,
  Loader2,
  CheckCircle,
  AlertCircle,
  ScanBarcode,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ScanFeedback {
  type: "success" | "error";
  message: string;
  timestamp: Date;
}

interface StockTakeDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  currentSessionId: string | null;
  isScanning: boolean;
  lastScanStatus: "success" | "error" | "idle";
  lastScanMessage: string | null;
  onStartSession: () => void;
  onEndSession: () => void;
}

/**
 * A bottom sheet component that displays a form to start a new stock take
 * session, or manage an active session. It includes a button to start a new
 * session, and if a session is active, it displays the session ID and a button
 * to end the session. It also displays any feedback from the last scan attempt.
 *
 * The component expects the following props:
 * - `open`: Whether the sheet is open or not
 * - `onOpenChange`: Callback when the sheet is opened or closed
 * - `currentSessionId`: The ID of the active stock take session
 * - `isScanning`: Whether a scan is currently being processed
 * - `lastScanStatus`: The status of the last scan
 * - `lastScanMessage`: A message associated with the last scan result
 * - `onStartSession`: Callback when the Start Session button is clicked
 * - `onEndSession`: Callback when the End Session button is clicked
 *
 * The component renders a form with a single input field for the session ID,
 * and a button to start the session. If the session is active, it renders a
 * button to end the session. It also renders any feedback from the last scan
 * attempt.
 *
 * The component is used in the `Scanner` component.
 *
 * TODO: Improve UI with colour-coded scan log history and state that triggers toasts on parent component routes/views
 */
export function StockTakeDrawer({
  open,
  onOpenChange,
  currentSessionId,
  isScanning,
  lastScanStatus,
  lastScanMessage,
  onStartSession,
  onEndSession,
}: StockTakeDrawerProps) {
  const handleStartSession = () => {
    onStartSession();
  };

  const handleEndSession = () => {
    onEndSession();
  };

  const renderFeedback = () => {
    if (lastScanStatus === "idle" && !isScanning) return null;

    let icon = null;
    let title = "";
    let variant: "default" | "destructive" = "default";

    if (isScanning) {
      icon = <Loader2 className="h-4 w-4 animate-spin" />;
      title = "Processing Scan...";
    } else if (lastScanStatus === "success") {
      icon = <CheckCircle className="h-4 w-4 text-green-500" />;
      title = "Scan Successful";
      variant = "default";
    } else if (lastScanStatus === "error") {
      icon = <AlertCircle className="h-4 w-4 text-red-500" />;
      title = "Scan Error";
      variant = "destructive";
    }

    return (
      <Alert variant={variant} className="mt-4">
        {icon}
        <AlertTitle>{title}</AlertTitle>
        {lastScanMessage && (
          <AlertDescription>{lastScanMessage}</AlertDescription>
        )}
      </Alert>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[75vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Stock Take Session</SheetTitle>
          <SheetDescription>
            {currentSessionId
              ? "Manage your active stock take session"
              : "Start a new stock take session"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 grid gap-4 py-4 overflow-y-auto px-4">
          {!currentSessionId ? (
            <div className="grid gap-2">
              <p className="text-sm text-muted-foreground">
                Click the button below to generate a new Session UUID and start
                a stock take session.
              </p>
              <Button onClick={handleStartSession} className="mt-2">
                <Play className="mr-2 h-4 w-4" /> Start Session
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-muted-foreground">
                    Active Session
                  </Label>
                  <div className="text-lg font-semibold font-mono bg-muted px-2 py-1 rounded inline-block">
                    {currentSessionId}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEndSession}
                >
                  <StopCircle className="mr-2 h-4 w-4" /> End Session
                </Button>
              </div>

              <div className="border rounded-md">
                <div className="bg-muted px-4 py-2 border-b rounded-t-md flex items-center justify-between">
                  <h3 className="text-sm font-medium">Scan Status</h3>
                </div>
                <div className="p-4 min-h-[100px]">
                  {renderFeedback()}
                  {currentSessionId &&
                    lastScanStatus === "idle" &&
                    !isScanning && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Ready to scan...
                      </p>
                    )}
                  {!currentSessionId && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Start a session to enable scanning.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="p-4 border-t mt-auto">
          <div className="flex justify-between items-center w-full">
            <Badge variant={currentSessionId ? "default" : "outline"}>
              <ScanBarcode className="w-4 h-4 mr-1" />
              Scanner {currentSessionId ? "Active" : "Inactive"}
            </Badge>
            <SheetClose asChild>
              <Button variant="outline" size="sm">
                Close
              </Button>
            </SheetClose>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// // Usage example
// function StockTakeDrawerDemo() {
//   const [open, setOpen] = React.useState(false);

//   return (
//     <div className="flex flex-col items-center justify-center p-4 space-y-4">
//       <Button onClick={() => setOpen(true)}>Open Stock Take</Button>
//       <StockTakeDrawer open={open} onOpenChange={setOpen} />
//     </div>
//   );
// }

// export default StockTakeDrawerDemo;
