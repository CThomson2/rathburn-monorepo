
import { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";

interface BarcodeScannerProps {
  onScan: (data: string) => void;
}

const BarcodeScanner = ({ onScan }: BarcodeScannerProps) => {
  const [scanData, setScanData] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  // Function to handle barcode input
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      // Clear any existing timer
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      
      // Set scan data and show popup
      setScanData(value);
      setShowPopup(true);
      onScan(value);
      
      // Clear the input for next scan
      e.target.value = '';
      
      // Set timer to hide popup after 10 seconds
      timerRef.current = window.setTimeout(() => {
        setShowPopup(false);
        setScanData(null);
      }, 10000);
    }
  };

  // Function to focus input when component mounts and whenever focus is lost
  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
    
    // Set up interval to check focus
    const focusInterval = setInterval(() => {
      if (document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
      }
    }, 1000);
    
    return () => {
      clearInterval(focusInterval);
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Hidden input to capture barcode scans */}
      <input
        ref={inputRef}
        type="text"
        className="opacity-0 absolute h-0 w-0"
        onChange={handleInput}
        autoFocus
      />
      
      {/* Ready to scan indicator */}
      <div className="flex flex-col items-center justify-center h-full">
        <div className="rounded-full w-24 h-24 flex items-center justify-center bg-industrial-lightGray mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-industrial-darkGray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h2m8-4v4m4-2h2m-6-4v4m-6 8v-4m12 4v-4M7 6h10a1 1 0 011 1v10a1 1 0 01-1 1H7a1 1 0 01-1-1V7a1 1 0 011-1z" />
          </svg>
        </div>
        <p className="text-industrial-gray text-lg font-medium">Ready to scan</p>
        <p className="text-industrial-gray text-sm mt-2">Position the barcode in front of the scanner</p>
      </div>
      
      {/* Scan popup */}
      {showPopup && scanData && (
        <div className="fixed inset-x-0 mx-auto bottom-8 w-11/12 max-w-md animate-fade-in">
          <Card className="bg-white shadow-lg border-industrial-blue border-2 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-industrial-darkGray">Barcode Scanned</h3>
              <div className="relative w-8 h-8">
                {/* SVG Circle Timer */}
                <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#DEE2E6"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#0057B8"
                    strokeWidth="10"
                    strokeDasharray="283"
                    strokeDashoffset="0"
                    className="animate-circle-timer"
                  />
                </svg>
              </div>
            </div>
            <div className="bg-industrial-lightGray p-3 rounded-md">
              <p className="font-mono text-lg break-all">{scanData}</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
