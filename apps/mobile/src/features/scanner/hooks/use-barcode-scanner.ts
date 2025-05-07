import { useState, useEffect, useCallback } from 'react';

interface UseBarcodeScanner {
  scans: string[];
  addScan: (barcode: string) => void;
  clearScans: () => void;
}

const STORAGE_KEY = 'barcode-scanner-scans';
const MAX_SCANS = 100;

export function useBarcodeScannerHistory(): UseBarcodeScanner {
  const [scans, setScans] = useState<string[]>([]);

  // Load scans from localStorage when component mounts
  useEffect(() => {
    try {
      const savedScans = localStorage.getItem(STORAGE_KEY);
      if (savedScans) {
        setScans(JSON.parse(savedScans));
      }
    } catch (error) {
      console.error('Error loading scan history:', error);
    }
  }, []);

  // Save scans to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
    } catch (error) {
      console.error('Error saving scan history:', error);
    }
  }, [scans]);

  // Add a new scan to the history
  const addScan = useCallback((barcode: string) => {
    if (!barcode || barcode.trim() === '') return;
    
    setScans(prevScans => {
      // Avoid duplicate consecutive scans
      if (prevScans.length > 0 && prevScans[0] === barcode) {
        return prevScans;
      }
      
      // Add new scan to the beginning and limit the number of stored scans
      const newScans = [barcode, ...prevScans.slice(0, MAX_SCANS - 1)];
      return newScans;
    });
  }, []);

  // Clear all scan history
  const clearScans = useCallback(() => {
    setScans([]);
  }, []);

  return { scans, addScan, clearScans };
}