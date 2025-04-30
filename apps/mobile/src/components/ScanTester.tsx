import { useState } from "react";
import { useScan } from "@/contexts/scan-context";

/**
 * A component for testing the scan functionality
 * This component provides a visible input field that directly triggers
 * the scan handler when the Enter key is pressed
 */
export function ScanTester() {
  const [inputValue, setInputValue] = useState("");
  const [testMode, setTestMode] = useState<"visible" | "hidden">("hidden");
  const { handleDrumScan, scannedDrums, resetScannedDrums } = useScan();

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

  const generateTestBarcode = () => {
    const prefix = Math.random() > 0.5 ? "TEST-" : "";
    const randomBarcode = `${prefix}${Math.floor(Math.random() * 100000)}`;
    setInputValue(randomBarcode);
  };

  const generateErrorBarcode = () => {
    setInputValue(`ERROR-${Math.floor(Math.random() * 10000)}`);
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
    <div className="fixed right-4 bottom-20 z-50 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-64">
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
            onClick={() => handleDrumScan(inputValue.trim())}
            disabled={!inputValue.trim()}
            className="bg-blue-500 text-white px-2 py-1 rounded text-sm disabled:bg-gray-400"
          >
            Scan
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={generateTestBarcode}
            className="bg-green-500 text-white px-2 py-1 rounded text-sm flex-1"
          >
            Random
          </button>
          <button
            onClick={generateErrorBarcode}
            className="bg-red-500 text-white px-2 py-1 rounded text-sm flex-1"
          >
            Error
          </button>
          <button
            onClick={resetScannedDrums}
            className="bg-gray-500 text-white px-2 py-1 rounded text-sm flex-1"
          >
            Reset
          </button>
        </div>

        <div className="text-xs mt-2">
          <div>Scanned: {scannedDrums.length}</div>
          <div className="max-h-20 overflow-auto text-gray-500 dark:text-gray-400 text-[10px]">
            {scannedDrums.map((drum, i) => (
              <div key={i}>{drum}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
