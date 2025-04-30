"use client";

import { useState, useEffect } from "react";

// Define the structure for a scan object
interface Scan {
  timestamp: string;
  barcode: string;
  success: boolean;
  deviceId?: string; // Added deviceId
}

// Define the structure for the API response
interface ApiResponse {
  scans: Scan[];
}

export default function ScanTestPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch recent scans from the API
  const fetchScans = async () => {
    console.log("[ScanTest] Fetching scans from API");
    try {
      // Make sure to use the correct API endpoint
      // Use relative path which works with proxy in dev and prod
      const response = await fetch("/api/scanner/scan/single");
      console.log("[ScanTest] API response status:", response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch scans: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      console.log("[ScanTest] Received data:", data);

      // Ensure data.scans is an array before setting state
      if (Array.isArray(data.scans)) {
        console.log("[ScanTest] Setting scans, count:", data.scans.length);
        setScans(data.scans);
      } else {
        console.warn(
          "[ScanTest] API response for scans was not an array:",
          data
        );
        setScans([]); // Set to empty array if the format is wrong
      }
      setError(null); // Clear any previous error
    } catch (err) {
      console.error("[ScanTest] Error fetching scans:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setScans([]); // Clear scans on error
    } finally {
      setIsLoading(false);
      console.log("[ScanTest] Fetch complete, isLoading set to false");
    }
  };

  useEffect(() => {
    // Initial fetch
    console.log("[ScanTest] Component mounted, initiating first fetch");
    fetchScans();

    // Set up polling every 5 seconds
    console.log("[ScanTest] Setting up 5-second polling interval");
    const intervalId = setInterval(fetchScans, 5000);

    // Clean up interval on component unmount
    return () => {
      console.log("[ScanTest] Component unmounting, clearing interval");
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array means this runs once on mount

  console
    .log
    // "[ScanTest] Rendering component with",
    // scans.length,
    // "scans, isLoading:",
    // isLoading
    ();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Scan Test Page</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Instructions</h2>
        <p className="mb-2">
          This page polls the API every 5 seconds to show recent scans received
          from the mobile app.
        </p>
      </div>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
          <h2 className="font-semibold">Received Scans (Updates every 5s)</h2>
          <button
            onClick={() => {
              console.log("[ScanTest] Manual refresh triggered");
              fetchScans();
            }}
            disabled={isLoading}
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
          >
            Refresh Now
          </button>
        </div>

        <div className="divide-y min-h-[100px]">
          {isLoading && scans.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : !isLoading && scans.length === 0 && !error ? (
            <div className="p-4 text-center text-gray-500">
              No scans received yet
            </div>
          ) : (
            scans.map((scan, index) => {
              //   console.log(
              //     "[ScanTest] Rendering scan:",
              //     scan.barcode,
              //     "success:",
              //     scan.success
              //   );
              return (
                <div
                  key={`${scan.timestamp}-${index}`}
                  className="p-4 flex items-center space-x-4"
                >
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${scan.success ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate" title={scan.barcode}>
                      {scan.barcode}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(scan.timestamp).toLocaleTimeString()} -{" "}
                      {scan.deviceId
                        ? `(${scan.deviceId.substring(0, 20)}...)`
                        : "(No Device ID)"}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
