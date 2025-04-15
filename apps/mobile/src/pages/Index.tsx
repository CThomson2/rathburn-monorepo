// App.tsx
import { useState } from "react";
import BarcodeScannerInput from "../components/BarcodeScannerInput";
import ScanView from "../views/Scan";
// import HistoryView from "./views/HistoryView";
// import InventoryView from "./views/InventoryView";
// import "./App.css";

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * The Index component is the main entry point of the application, managing
 * the active tab state and rendering the appropriate view based on the selected tab.
 *
 * - It provides a barcode scanning functionality through the BarcodeScannerInput component,
 *   where the scanned barcode is processed by the handleBarcodeScan function.
 * - The component includes a tab navigation system allowing the user to switch
 *   between different views: Scan, History, and Inventory.
 *
 * Note: The HistoryView and InventoryView components are currently commented out,
 * indicating they may be under development or not needed for the current release.
 */

/*******  3aac3653-2a92-4e90-a54b-f996412e6169  *******/
function Index() {
  const [activeTab, setActiveTab] = useState("scan");

  const handleBarcodeScan = (barcode: string) => {
    console.log("Barcode scanned:", barcode);
    // Process the barcode data here
    // This could include API calls to Supabase
  };

  return (
    <div className="app-container">
      <BarcodeScannerInput onScan={handleBarcodeScan} />

      <main className="content">
        {activeTab === "scan" && <ScanView />}
        {/* {activeTab === "history" && <HistoryView />} */}
        {/* {activeTab === "inventory" && <InventoryView />} */}
      </main>

      <nav className="tab-navigation">
        <button
          className={activeTab === "scan" ? "active" : ""}
          onClick={() => setActiveTab("scan")}
        >
          Scan
        </button>
        <button
          className={activeTab === "history" ? "active" : ""}
          onClick={() => setActiveTab("history")}
        >
          History
        </button>
        <button
          className={activeTab === "inventory" ? "active" : ""}
          onClick={() => setActiveTab("inventory")}
        >
          Inventory
        </button>
      </nav>
    </div>
  );
}

export default Index;
