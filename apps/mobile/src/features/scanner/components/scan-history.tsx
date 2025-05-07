import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanHistoryProps {
  history: {
    timestamp: string;
    drumId: string;
    status: "success" | "error" | "cancelled";
    message: string;
  }[];
  onCancelScan: (drumId: string) => void;
}

export function ScanHistory({ history, onCancelScan }: ScanHistoryProps) {
  const [exportOption, setExportOption] = useState<"none" | "csv" | "email">(
    "none"
  );
  const [emailAddress, setEmailAddress] = useState("");

  // Function to format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Function to export scan history as CSV
  const exportAsCsv = () => {
    if (history.length === 0) return;

    // Create CSV content
    const headers = ["Timestamp", "Drum ID", "Status", "Message"];
    const csvContent = [
      headers.join(","),
      ...history.map((item) =>
        [
          new Date(item.timestamp).toISOString(),
          item.drumId,
          item.status,
          `"${item.message.replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n");

    // Create blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `scan_history_${new Date().toISOString().slice(0, 10)}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportOption("none");
  };

  // Function to send scan history via email
  const sendEmail = () => {
    if (history.length === 0 || !emailAddress) return;

    // In a real app, this would call an API endpoint to send the email
    // For demo purposes, we'll just simulate it
    alert(`Email would be sent to ${emailAddress} with scan history data`);
    setExportOption("none");
    setEmailAddress("");
  };

  return (
    <div className="space-y-4">
      {/* Export options */}
      <div className="flex justify-end mb-4 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setExportOption(exportOption === "csv" ? "none" : "csv")
          }
          className="flex items-center gap-1"
        >
          <Download className="h-4 w-4" />
          CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setExportOption(exportOption === "email" ? "none" : "email")
          }
          className="flex items-center gap-1"
        >
          <Mail className="h-4 w-4" />
          Email
        </Button>
      </div>

      {/* Email form */}
      {exportOption === "email" && (
        <div className="mb-4 p-3 border rounded-md">
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter email address"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md text-sm"
            />
            <Button size="sm" onClick={sendEmail} disabled={!emailAddress}>
              Send
            </Button>
          </div>
        </div>
      )}

      {/* CSV export button */}
      {exportOption === "csv" && (
        <div className="mb-4 p-3 border rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm">Download scan history as CSV file</span>
            <Button size="sm" onClick={exportAsCsv}>
              Download
            </Button>
          </div>
        </div>
      )}

      {/* Scan history list */}
      <div className="max-h-[300px] overflow-y-auto pr-1">
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No scan history available
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "p-3 rounded-md border flex items-start gap-3",
                  item.status === "success" &&
                    "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800",
                  item.status === "error" &&
                    "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800",
                  item.status === "cancelled" &&
                    "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                )}
              >
                {/* Status icon */}
                {item.status === "success" && (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                )}
                {item.status === "error" && (
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
                )}
                {item.status === "cancelled" && (
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-1" />
                )}

                {/* Content */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-sm">
                      Drum ID: {item.drumId}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimestamp(item.timestamp)}
                    </div>
                  </div>
                  <div className="text-xs mt-1">{item.message}</div>

                  {/* Action buttons - only show for successful scans */}
                  {item.status === "success" && (
                    <div className="mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-2"
                        onClick={() => onCancelScan(item.drumId)}
                      >
                        Undo Scan
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
