import { useState } from "react";
import { Button } from "@/components/core/ui/button";
import { Input } from "@/components/core/ui/input";
import { Label } from "@/components/core/ui/label";

export const BarcodeGenerator = () => {
  const [material, setMaterial] = useState("");
  const [supplier, setSupplier] = useState("");
  const [site, setSite] = useState("");

  const handleGenerateBarcodes = async () => {
    // Construct query params, only including non-empty values
    const params = new URLSearchParams();
    if (material) params.append("material", material);
    if (supplier) params.append("supplier", supplier);
    if (site) params.append("site", site);

    // Make the request
    const url = `/api/barcodes/initial-stock?${params.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create a blob from the PDF stream
      const blob = await response.blob();

      // Create a link and trigger download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "initial-stock-drums.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error generating barcodes:", error);
      alert("Error generating barcodes. Please check the console for details.");
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto p-6 border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold">Generate Initial Stock Barcodes</h2>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="material">Material</Label>
          <Input
            id="material"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="e.g., Tetrahydrofuran"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier">Supplier</Label>
          <Input
            id="supplier"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="e.g., Rathburn Chemicals Ltd"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="site">Site</Label>
          <Input
            id="site"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            placeholder="e.g., new"
          />
        </div>

        <Button onClick={handleGenerateBarcodes} className="w-full">
          Generate Barcodes
        </Button>
      </div>
    </div>
  );
};
