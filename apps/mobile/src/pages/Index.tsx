// App.tsx
import { useState } from "react";
import BarcodeScannerInput from "../components/scanner/BarcodeScannerInput";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import BottomNavBar from "@/components/layout/BottomNavBar";
import JobCard, { JobStatus } from "@/components/inventory/JobCard";
import SearchBar from "@/components/inventory/SearchBar";
import MaterialDetail from "@/components/inventory/MaterialDetail";
import Toast from "@/components/ui/toast-notification";

// Sample data
const sampleJobs = [
  {
    id: "1",
    title: "Ethyl Acetate",
    supplier: "Sigma Aldrich",
    status: "preparation" as JobStatus,
    progress: 25,
    quantity: 5,
    scheduledDate: "Apr 25, 2025",
    priority: "high" as const,
  },
  {
    id: "2",
    title: "Methanol USP",
    supplier: "Fisher Scientific",
    status: "distillation" as JobStatus,
    progress: 60,
    quantity: 12,
    scheduledDate: "Apr 28, 2025",
    priority: "medium" as const,
  },
  {
    id: "3",
    title: "Acetone",
    supplier: "VWR International",
    status: "qcPending" as JobStatus,
    progress: 85,
    quantity: 8,
    scheduledDate: "Apr 30, 2025",
    priority: "low" as const,
  },
  {
    id: "4",
    title: "Toluene",
    supplier: "Merck",
    status: "complete" as JobStatus,
    progress: 100,
    quantity: 3,
    scheduledDate: "Apr 22, 2025",
    priority: "medium" as const,
  },
];

const sampleMaterials = [
  {
    id: "m1",
    name: "Ethyl Acetate",
    casNumber: "141-78-6",
    color: "#1EAEDB",
    scans: 7,
  },
  {
    id: "m2",
    name: "Methanol",
    casNumber: "67-56-1",
    color: "#FEC6A1",
    scans: 12,
  },
  {
    id: "m3",
    name: "Acetone",
    casNumber: "67-64-1",
    color: "#F2FCE2",
    scans: 5,
  },
  {
    id: "m4",
    name: "Toluene",
    casNumber: "108-88-3",
    color: "#8E9196",
    scans: 3,
  },
  {
    id: "m5",
    name: "Hexane",
    casNumber: "110-54-3",
    color: "#1EAEDB",
    scans: 2,
  },
];

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

const Index = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("stats");
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
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
  /*******  9c2a0ff3-c1f5-410e-be42-7f97cbbc7146  *******/
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({
    visible: false,
    message: "",
    type: "info",
  });

  const toggleScanner = () => {
    navigate("/scan");
  };

  const handleBarcodeScan = (barcode: string) => {
    console.log("Barcode scanned:", barcode);
    // Process the barcode data here
    // This could include API calls to Supabase
  };

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  const handleSelectMaterial = (material: any) => {
    setSelectedMaterial(material);
  };

  return (
    <div className="min-h-screen bg-lightBg pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <h1 className="text-lg font-bold">Production & Inventory</h1>
      </header>

      {/* Toast notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
      />

      {/* Main content */}
      <main className="p-4 max-w-md mx-auto">
        {/* Active Jobs Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Active Production Jobs</h2>
            <span className="text-sm text-gray-500">View All</span>
          </div>

          {/* Job Cards */}
          <div className="space-y-3">
            <AnimatePresence>
              {sampleJobs.map((job) => (
                <JobCard
                  key={job.id}
                  title={job.title}
                  supplier={job.supplier}
                  status={job.status}
                  progress={job.progress}
                  quantity={job.quantity}
                  scheduledDate={job.scheduledDate}
                  priority={job.priority}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Search Section */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Quick Lookup</h2>
          <SearchBar
            materials={sampleMaterials}
            onSelect={handleSelectMaterial}
          />
        </section>
      </main>

      {/* Material Detail modal */}
      <AnimatePresence>
        {selectedMaterial && (
          <MaterialDetail
            material={selectedMaterial}
            onClose={() => setSelectedMaterial(null)}
          />
        )}
      </AnimatePresence>

      {/* <BarcodeScannerInput onScan={handleBarcodeScan} /> */}

      {/* Bottom Navigation */}
      <BottomNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        toggleScanner={toggleScanner}
        scannerActive={false}
      />
    </div>
  );
};

export default Index;
