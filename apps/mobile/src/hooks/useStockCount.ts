import { useState, useEffect, useCallback } from 'react';
import { 
  processBarcodeScan, 
  getSupplierContext, 
  setSupplierContext, 
  clearSupplierContext,
  getStockCountData
} from '../services/stockCount';

interface ScanResult {
  success: boolean;
  type: string;
  message: string;
  data?: any;
}

interface UseStockCountOptions {
  autoLoadContext?: boolean;
  onScanComplete?: (result: ScanResult) => void;
}

export function useStockCount(options: UseStockCountOptions = {}) {
  const { autoLoadContext = true, onScanComplete } = options;
  
  const [supplierContext, setSupplierContextState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [stockData, setStockData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Load initial supplier context on mount
  useEffect(() => {
    if (autoLoadContext) {
      const context = getSupplierContext();
      setSupplierContextState(context);
    }
  }, [autoLoadContext]);

  // Handle barcode scanning
  const handleScan = useCallback(async (barcode: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await processBarcodeScan(barcode);
      setLastScanResult(result);
      
      // Update supplier context if changed
      if (result.type === 'supplier' && result.success) {
        setSupplierContextState(getSupplierContext());
      }
      
      // Call the callback if provided
      if (onScanComplete) {
        onScanComplete(result);
      }
      
      return result;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      setError(errorMessage);
      const result = {
        success: false,
        type: 'error',
        message: errorMessage
      };
      setLastScanResult(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [onScanComplete]);

  // Set supplier context manually (alternative to scanning)
  const updateSupplierContext = useCallback((supplierId: string, supplierName: string) => {
    const result = setSupplierContext(supplierId, supplierName);
    if (result.success) {
      setSupplierContextState(getSupplierContext());
    }
    return result;
  }, []);

  // Clear supplier context
  const resetSupplierContext = useCallback(() => {
    const result = clearSupplierContext();
    if (result.success) {
      setSupplierContextState(null);
    }
    return result;
  }, []);

  // Load stock count data
  const loadStockData = useCallback(async (filters?: { supplier_id?: string; material_id?: string }) => {
    setIsLoadingData(true);
    
    try {
      const response = await getStockCountData(filters);
      if (response.success && response.data) {
        setStockData(response.data);
      } else {
        setError(response.message || 'Failed to load stock data');
      }
      return response;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error loading stock data';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Load data for current supplier
  const loadCurrentSupplierData = useCallback(async () => {
    if (!supplierContext || !supplierContext.id) {
      setError('No supplier context set');
      return { success: false, message: 'No supplier context set' };
    }
    
    return loadStockData({ supplier_id: supplierContext.id });
  }, [supplierContext, loadStockData]);

  return {
    supplierContext,
    isLoading,
    error,
    lastScanResult,
    stockData,
    isLoadingData,
    handleScan,
    updateSupplierContext,
    resetSupplierContext,
    loadStockData,
    loadCurrentSupplierData
  };
} 