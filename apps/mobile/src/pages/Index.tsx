// pages/Index.tsx
import { useState } from "react";
import BarcodeScannerInput from "../components/BarcodeScannerInput";
import ScanView from "../views/Scan";
import { useBarcodeScannerHistory } from "@/hooks/use-barcode-scanner";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Scan, Clock, Package } from "lucide-react";

/**
 * The Index component is the main entry point of the application, combining
 * barcode scanning functionality with navigation to other app features.
 */
function Index() {
  const [activeTab, setActiveTab] = useState("scan");
  const { addScan } = useBarcodeScannerHistory();
  const navigate = useNavigate();

  const handleBarcodeScan = (barcode: string) => {
    console.log("Barcode scanned:", barcode);
    addScan(barcode);
    toast({
      title: "Barcode Scanned",
      description: barcode,
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Always active barcode scanner input */}
      <BarcodeScannerInput onScan={handleBarcodeScan} />

      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">DistilliTrace</h1>
          <Button
            variant="outline"
            onClick={() => navigate("/production")}
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            Production Dashboard
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <ScanView />
      </main>

      {/* Tab navigation */}
      <nav className="bg-white border-t border-gray-200 p-2">
        <div className="flex justify-around">
          <Button
            variant={activeTab === "scan" ? "default" : "ghost"}
            className="flex-1 flex flex-col items-center py-2"
            onClick={() => setActiveTab("scan")}
          >
            <Scan className="h-5 w-5 mb-1" />
            <span className="text-sm">Scan</span>
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "ghost"}
            className="flex-1 flex flex-col items-center py-2"
            onClick={() => setActiveTab("history")}
          >
            <Clock className="h-5 w-5 mb-1" />
            <span className="text-sm">History</span>
          </Button>
          <Button
            variant={activeTab === "inventory" ? "default" : "ghost"}
            className="flex-1 flex flex-col items-center py-2"
            onClick={() => navigate("/production")}
          >
            <Package className="h-5 w-5 mb-1" />
            <span className="text-sm">Production</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}

export default Index;
