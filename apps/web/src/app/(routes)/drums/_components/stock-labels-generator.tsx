"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/core/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/core/ui/card";
import { Printer, FileDown, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/core/ui/alert";

/**
 * StockLabelsGenerator component.
 *
 * This component provides functionality to generate and view PDF barcode labels for the existing drum stock.
 * It fetches the total count of drums from the API on mount and displays the count.
 * Users can generate PDF labels for the drum stock via an API call and view the generated PDF in a new tab.
 *
 * State Variables:
 * - totalDrums: Stores the total number of drums available in inventory.
 * - isLoading: Indicates if the PDF generation process is ongoing.
 * - pdfBlob: Stores the Blob data of the generated PDF for viewing.
 * - isLoadingCount: Indicates if the drum count is being loaded.
 * - error: Stores any error messages encountered during API calls.
 *
 * Functions:
 * - fetchDrumCount: Fetches the total drum count from the API and updates the state.
 * - generateLabels: Initiates the PDF generation process by calling the API and stores the result.
 * - viewPdf: Opens the generated PDF in a new tab if available.
 */

export default function StockLabelsGenerator() {
  const [totalDrums, setTotalDrums] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the total count of drums when component mounts
  useEffect(() => {
    async function fetchDrumCount() {
      try {
        setError(null);
        const response = await fetch("/api/drums/count");
        if (!response.ok) throw new Error("Failed to fetch drum count");
        const data = await response.json();
        setTotalDrums(data.count);
      } catch (error) {
        console.error("Error fetching drum count:", error);
        setError("Failed to fetch drum count. Please try again later.");
      } finally {
        setIsLoadingCount(false);
      }
    }

    fetchDrumCount();
  }, []);

  // Function to generate PDF labels
  const generateLabels = async () => {
    setIsLoading(true);
    setPdfBlob(null);
    setError(null);

    try {
      const response = await fetch("/api/barcodes/initial-stock");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate labels");
      }

      const pdfData = await response.blob();
      setPdfBlob(pdfData);
    } catch (error) {
      console.error("Error generating labels:", error);
      setError(
        error instanceof Error ? error.message : "Failed to generate labels"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to view the PDF in a new tab
  const viewPdf = () => {
    if (!pdfBlob) return;

    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");
  };

  return (
    <Card className="bg-white shadow transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle>Stock Labels Generator</CardTitle>
        <CardDescription>
          Generate barcode labels for existing drum stock
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {isLoadingCount
                  ? "Loading drum count..."
                  : totalDrums !== null
                    ? `${totalDrums} drums available in inventory`
                    : "Unable to fetch drum count"}
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={generateLabels}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Printer className="mr-2 h-4 w-4" />
                    Generate Labels
                  </>
                )}
              </Button>

              {pdfBlob && (
                <Button onClick={viewPdf}>
                  <FileDown className="mr-2 h-4 w-4" />
                  View PDF
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
