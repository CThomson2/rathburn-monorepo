import React, { useState } from "react";
import { useStockTake } from "@/hooks/useStockTake";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Play,
  StopCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export function StockTakeView() {
  const {
    currentSessionId,
    isScanning,
    lastScanStatus,
    lastScanMessage,
    startStocktakeSession,
    endStocktakeSession,
    // processStocktakeScan is called via the global ScanInput handler
  } = useStockTake();

  // Local state for managing the session ID input
  const [sessionIdInput, setSessionIdInput] = useState<string>("");
  // TODO: In a real app, fetch available sessions or allow creation

  const handleStartSession = () => {
    if (sessionIdInput.trim()) {
      startStocktakeSession(sessionIdInput.trim());
      // Optionally clear input after starting
      // setSessionIdInput('');
    }
  };

  const handleEndSession = () => {
    endStocktakeSession();
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
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Stock Take Session</CardTitle>
          <CardDescription>
            Start or end a stock take session. Scans are only recorded when a
            session is active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!currentSessionId ? (
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Enter Session ID or Name"
                value={sessionIdInput}
                onChange={(e) => setSessionIdInput(e.target.value)}
                disabled={!!currentSessionId}
              />
              <Button
                onClick={handleStartSession}
                disabled={!sessionIdInput.trim() || !!currentSessionId}
              >
                <Play className="mr-2 h-4 w-4" /> Start Session
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="font-medium">
                Active Session:{" "}
                <span className="font-mono bg-muted px-2 py-1 rounded">
                  {currentSessionId}
                </span>
              </p>
              <Button variant="destructive" onClick={handleEndSession}>
                <StopCircle className="mr-2 h-4 w-4" /> End Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scan Status</CardTitle>
          <CardDescription>
            Real-time feedback on barcode scans.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderFeedback()}
          {!currentSessionId && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Start a session to begin scanning.
            </p>
          )}
          {currentSessionId && lastScanStatus === "idle" && !isScanning && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Ready to scan for session: {currentSessionId}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
