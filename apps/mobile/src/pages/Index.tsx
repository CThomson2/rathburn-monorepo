
import { useState } from 'react';
import BarcodeScanner from '../components/BarcodeScanner';
import { toast } from '@/components/ui/use-toast';
import { useBarcodeScannerHistory } from '@/hooks/use-barcode-scanner';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { scans, addScan, clearScans } = useBarcodeScannerHistory();
  const [copySuccess, setCopySuccess] = useState<number | null>(null);
  
  // Handle barcode scan
  const handleBarcodeScan = (data: string) => {
    addScan(data);
    toast({
      title: "Barcode Scanned",
      description: data,
      duration: 3000,
    });
  };

  // Copy scan to clipboard
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(index);
      setTimeout(() => setCopySuccess(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold">Barcode Scanner</h1>
      </header>
      
      <main className="flex-1 p-4 flex flex-col">
        {/* Barcode scanner component */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex-1 min-h-40">
          <BarcodeScanner onScan={handleBarcodeScan} />
        </div>
        
        {/* Recent scans display */}
        <div className="bg-white rounded-lg shadow-md p-4 max-h-[50vh] overflow-auto">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Recent Scans</h2>
            {scans.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearScans}
                className="text-red-600 hover:text-red-800"
              >
                Clear All
              </Button>
            )}
          </div>
          
          {scans.length > 0 ? (
            <ul className="space-y-2 divide-y">
              {scans.map((scan, index) => (
                <li 
                  key={index} 
                  className="py-2 flex justify-between items-center group"
                  onClick={() => copyToClipboard(scan, index)}
                >
                  <span className="font-mono text-sm break-all">{scan}</span>
                  <span className={`text-xs px-2 ${copySuccess === index ? 'text-green-600' : 'text-gray-400 group-hover:text-blue-500'}`}>
                    {copySuccess === index ? 'Copied!' : 'Click to copy'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">No scans yet</p>
          )}
        </div>
      </main>
      
      <footer className="bg-gray-200 p-3 text-center text-sm text-gray-600">
        Keyboard Wedge Scanner | v1.0.0
      </footer>
    </div>
  );
};

export default Index;
