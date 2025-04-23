import { useState } from 'react';
import BarcodeScannerInput from './BarcodeScannerInput';
import '../styles/globals.css';

interface BarcodeScannerProps {
  onScan: (data: string) => void;
}

const BarcodeScanner = ({ onScan }: BarcodeScannerProps) => {
  const [isActive, setIsActive] = useState(true);
  const [lastScan, setLastScan] = useState('');
  
  // Handle scanning
  const handleScan = (barcode: string) => {
    if (barcode && barcode.trim() !== '') {
      setLastScan(barcode);
      console.log('Scanned:', barcode);
      // Pass the barcode to the parent component
      onScan(barcode);
    }
  };
  
  // Function to manually activate the scanner
  const activateScanner = () => {
    setIsActive(true);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full relative">
      {/* Use the improved BarcodeScannerInput component */}
      <BarcodeScannerInput 
        onScan={handleScan} 
        isActive={isActive}
        setIsActive={setIsActive}
      />
      
      {/* Scan indicator */}
      <div 
        className="text-center w-full cursor-pointer"
        onClick={activateScanner}
      >
        <div className={`mx-auto rounded-full w-32 h-32 flex items-center justify-center ${isActive ? 'bg-blue-100 border-blue-500' : 'bg-gray-100 border-gray-300'} mb-6 border-4 transition-colors ${isActive ? 'animate-pulse' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2 no-select">Ready to Scan</h2>
        <p className="text-gray-600 max-w-xs mx-auto">
          {isActive 
            ? "Simply scan any barcode with your wedge scanner." 
            : "Tap here to activate scanner. Scanner is inactive."
          }
        </p>
      </div>
      
      {/* Display last scan if available */}
      {lastScan && (
        <div className="mt-6 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg max-w-xs mx-auto">
          <p className="text-sm text-green-700 font-medium">Last scan:</p>
          <p className="text-gray-800 font-mono break-all">{lastScan}</p>
        </div>
      )}
      
      {/* Status indicator - always visible */}
      <div className="absolute bottom-4 left-0 right-0 mx-auto text-center">
        <div className={`inline-flex items-center px-3 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          <span className={`w-2 h-2 rounded-full mr-2 no-select ${isActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
          {isActive ? 'Scanner Active' : 'Scanner Inactive - Tap to Activate'}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
