import { useState } from "react";
import { useScan } from "@/core/hooks/use-scan";
import { createClient } from "@/core/lib/supabase/client";

/**
 * A component for testing the scan functionality during development
 *
 * This component provides a visible input field that directly triggers
 * the scan handler when the Enter key is pressed, plus helpful buttons
 * for testing different scenarios.
 */
export function ScanTester() {
  const [inputValue, setInputValue] = useState("");
  const [testMode, setTestMode] = useState<"visible" | "hidden">("hidden");
  const {
    handleDrumScan,
    scannedDrums,
    resetScannedDrums,
    scanMode,
    pendingDrums,
    processedDrums,
  } = useScan();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      handleDrumScan(inputValue.trim());
      setInputValue("");
    }
  };

  const toggleTestMode = () => {
    setTestMode((prev) => (prev === "visible" ? "hidden" : "visible"));
  };

  // Generate a realistic drum barcode
  const generateTestBarcode = () => {
    const randomBarcode = `${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;
    setInputValue(randomBarcode);
  };

  // Generate known test barcodes that should be in the database
  const generateKnownBarcode = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .schema("inventory")
      .from("purchase_order_drums")
      .select("serial_number", { count: "exact", head: true });
    let knownBarcodes: string[] = [];
    if (error) {
      console.error("Error fetching PO drums:", error);
      knownBarcodes = ["18087", "18088", "18089", "18090", "18091"];
    } else {
      knownBarcodes = data?.map((drum) => drum.serial_number) || [];
    }
    // Known PO drum serial numbers (for testing with real data)
    const randomIndex = Math.floor(Math.random() * knownBarcodes.length);
    setInputValue(knownBarcodes[randomIndex]);
  };

  // Generate a barcode that should cause an error (not found)
  const generateErrorBarcode = () => {
    setInputValue(`UNKNOWN-${Math.floor(Math.random() * 10000)}`);
  };

  if (testMode === "hidden") {
    return (
      <div className="fixed right-4 bottom-20 z-50">
        <button
          onClick={toggleTestMode}
          className="bg-gray-200 dark:bg-gray-800 p-2 rounded-full shadow-md"
          title="Open scan test panel"
        >
          🔍
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-4 bottom-20 z-50 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-72">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Scan Test Panel</h3>
        <button
          onClick={toggleTestMode}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder="Enter barcode to test"
            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm flex-1"
          />
          <button
            onClick={() => {
              if (inputValue.trim()) {
                handleDrumScan(inputValue.trim());
                setInputValue("");
              }
            }}
            disabled={!inputValue.trim()}
            className="bg-blue-500 text-white px-2 py-1 rounded text-sm disabled:bg-gray-400"
          >
            Scan
          </button>
        </div>

        <div className="flex gap-1 mb-2">
          <button
            onClick={generateTestBarcode}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs flex-1"
          >
            Random
          </button>
          <button
            onClick={generateKnownBarcode}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs flex-1"
          >
            Test PO
          </button>
          <button
            onClick={generateErrorBarcode}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs flex-1"
          >
            Error
          </button>
          <button
            onClick={resetScannedDrums}
            className="bg-gray-500 text-white px-2 py-1 rounded text-xs flex-1"
          >
            Reset
          </button>
        </div>

        <div className="text-xs mt-2 space-y-1">
          <div className="flex justify-between">
            <span>Mode:</span>
            <span className="font-medium">{scanMode}</span>
          </div>
          <div className="flex justify-between">
            <span>Pending drums:</span>
            <span className="font-medium">{pendingDrums}</span>
          </div>
          <div className="flex justify-between">
            <span>Processed this session:</span>
            <span className="font-medium">{processedDrums}</span>
          </div>
          <div className="flex justify-between">
            <span>Scanned this session:</span>
            <span className="font-medium">{scannedDrums.length}</span>
          </div>

          <div className="mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
            <div className="font-medium mb-1">Recently scanned:</div>
            <div className="max-h-20 overflow-auto text-gray-500 dark:text-gray-400 text-[10px]">
              {scannedDrums.length > 0 ? (
                scannedDrums.map((drum, i) => (
                  <div
                    key={`tester-${drum}-${i}`}
                    className="border-b border-gray-100 dark:border-gray-800 py-1"
                  >
                    {drum}
                  </div>
                ))
              ) : (
                <div className="italic text-gray-400">No drums scanned yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
