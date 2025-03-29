"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scan, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { toast, Toaster } from "sonner";

export default function BarcodeScannerPage() {
  const router = useRouter();
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    code?: string;
  } | null>(null);

  // Function to simulate barcode scanning
  // In a real app, this would integrate with a barcode scanning library
  const startScanning = () => {
    setIsScanning(true);
    setScanResult(null);

    // Simulate scanning delay
    setTimeout(() => {
      // This is where you'd integrate real barcode scanning
      // For demo purposes, we're just simulating a successful scan
      const mockBarcode = "ITEM" + Math.floor(Math.random() * 10000);

      setIsScanning(false);
      setScanResult({
        success: true,
        message: "Barcode scanned successfully",
        code: mockBarcode,
      });

      toast("Barcode Scanned", {
        description: `Item ${mockBarcode} identified`,
      });

      // In a real app, you might redirect to an item details page
      // router.push(`/mobile/inventory/item/${mockBarcode}`);
    }, 2000);
  };

  // Function to handle manual code submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!manualCode.trim()) {
      toast.error("Error", {
        description: "Please enter a valid code",
      });
      return;
    }

    setScanResult({
      success: true,
      message: "Code processed successfully",
      code: manualCode,
    });

    toast("Code Processed", {
      description: `Item ${manualCode} identified`,
    });

    // In a real app, you might redirect to an item details page
    // router.push(`/mobile/inventory/item/${manualCode}`);
  };

  const resetScan = () => {
    setScanResult(null);
    setManualCode("");
  };

  return (
    <div className="space-y-4 py-4">
      <Toaster />
      <h1 className="text-2xl font-bold tracking-tight">Scan Barcode</h1>

      <Tabs defaultValue="camera" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="camera">Camera Scan</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="camera" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scan Barcode</CardTitle>
              <CardDescription>
                Point your camera at a barcode to scan
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {!isScanning && !scanResult ? (
                <div className="flex justify-center my-4">
                  <Button size="lg" onClick={startScanning} className="gap-2">
                    <Scan className="h-5 w-5" />
                    Start Scanning
                  </Button>
                </div>
              ) : isScanning ? (
                <div className="bg-muted rounded-lg w-full aspect-video flex items-center justify-center">
                  <div className="animate-pulse flex flex-col items-center">
                    <Scan className="h-10 w-10 mb-2" />
                    <p>Scanning...</p>
                  </div>
                </div>
              ) : scanResult ? (
                <div className="w-full p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="flex items-center gap-3">
                    {scanResult.success ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    )}
                    <div>
                      <h3 className="font-medium">{scanResult.message}</h3>
                      {scanResult.code && (
                        <p className="text-sm text-muted-foreground">
                          Code: {scanResult.code}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
            {scanResult && (
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={resetScan}
                >
                  <RotateCcw className="h-4 w-4" />
                  Scan Again
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manual Entry</CardTitle>
              <CardDescription>
                Enter the barcode number manually
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit}>
                <div className="space-y-4">
                  <Input
                    placeholder="Enter item code"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                  />

                  <Button type="submit" className="w-full">
                    Process Code
                  </Button>
                </div>
              </form>

              {scanResult && (
                <div className="mt-4 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="flex items-center gap-3">
                    {scanResult.success ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    )}
                    <div>
                      <h3 className="font-medium">{scanResult.message}</h3>
                      {scanResult.code && (
                        <p className="text-sm text-muted-foreground">
                          Code: {scanResult.code}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
