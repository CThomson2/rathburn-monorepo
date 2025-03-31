# Barcode Scanner

## Overview

The barcode scanner is a feature that allows users to scan barcodes to add stock count entries.

```ts
import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the barcode scanner component to avoid SSR issues
const BarcodeScannerComponent = dynamic(
  () => import('react-qr-barcode-scanner'),
  { ssr: false }
);

const BarcodeScanner = ({ onDetected, onClose }) => {
  const [error, setError] = useState(null);

  const handleDetected = (result) => {
    if (result) {
      // Extract barcode data
      const barcodeData = result.text;
      onDetected(barcodeData);
      onClose(); // Close scanner after successful scan
    }
  };

  const handleError = (err) => {
    console.error(err);
    setError("Unable to access camera. Please make sure camera permissions are enabled.");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Scan Barcode</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        ) : (
          <div className="relative w-full" style={{ height: '300px' }}>
            <BarcodeScannerComponent
              width="100%"
              height="100%"
              onUpdate={(err, result) => {
                if (result) handleDetected(result);
                if (err) handleError(err);
              }}
            />
            <div className="absolute inset-0 border-2 border-dashed border-blue-500 pointer-events-none"></div>
          </div>
        )}

        <p className="mt-4 text-sm text-gray-600">
          Position the barcode within the scanner area.
        </p>

        <button
          onClick={onClose}
          className="mt-4 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;
```
