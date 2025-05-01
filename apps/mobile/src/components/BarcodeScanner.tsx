import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { processBarcodeScan, getSupplierContext, clearSupplierContext } from '../services/stockCount';

// Define the Html5Qrcode interface to avoid type errors
interface Html5QrcodeConfig {
  fps: number;
  qrbox: { width: number; height: number } | number;
  aspectRatio?: number;
  disableFlip?: boolean;
  videoConstraints?: MediaTrackConstraints;
}

interface Html5QrcodeScannerInterface {
  render: (
    onScanSuccess: (decodedText: string, decodedResult: any) => void,
    onScanFailure?: (error: any) => void
  ) => Promise<void>;
  clear: () => Promise<void>;
}

interface BarcodeScannerProps {
  onScanComplete?: (result: any) => void;
}

export default function BarcodeScanner({ onScanComplete }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<Array<{ type: string; message: string; timestamp: Date }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannerInitialized, setScannerInitialized] = useState(false);
  const scannerContainerRef = React.useRef<HTMLDivElement | null>(null);
  const scannerRef = React.useRef<any>(null);

  useEffect(() => {
    // Check for existing supplier context on component mount
    const supplierContext = getSupplierContext();
    if (supplierContext) {
      setCurrentSupplier(supplierContext.name);
    }

    // Start by initializing and loading the HTML5QrCode script
    const loadScanner = async () => {
      try {
        // Dynamically import the scanner library
        if (!window.Html5Qrcode) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
          script.async = true;
          script.onload = () => {
            setScannerInitialized(true);
          };
          document.body.appendChild(script);
        } else {
          setScannerInitialized(true);
        }
      } catch (error) {
        console.error('Error loading scanner library:', error);
      }
    };

    loadScanner();

    return () => {
      // Clean up scanner when component unmounts
      if (scannerRef.current) {
        stopScanning();
      }
    };
  }, []);

  useEffect(() => {
    // Initialize the scanner when it's ready
    if (scannerInitialized && window.Html5Qrcode && !scannerRef.current) {
      initializeScanner();
    }
  }, [scannerInitialized]);

  const initializeScanner = () => {
    if (!scannerContainerRef.current || !window.Html5Qrcode) {
      console.error('Scanner container or library not found');
      return;
    }

    try {
      // Clear the existing HTML content
      if (scannerContainerRef.current) {
        scannerContainerRef.current.innerHTML = '';
      }

      const scannerId = 'scanner-' + Date.now();
      const div = document.createElement('div');
      div.id = scannerId;
      div.style.width = '100%';
      div.style.height = '100%';
      
      if (scannerContainerRef.current) {
        scannerContainerRef.current.appendChild(div);
      }

      // Create scanner instance
      scannerRef.current = new window.Html5Qrcode(scannerId);
      console.log('Scanner initialized successfully');
    } catch (error) {
      console.error('Error initializing barcode scanner:', error);
      Alert.alert('Error', 'Failed to initialize barcode scanner');
    }
  };

  const startScanning = async () => {
    if (!scannerRef.current) {
      Alert.alert('Error', 'Scanner not initialized');
      return;
    }

    setScanning(true);

    try {
      await scannerRef.current.start(
        { facingMode: 'environment' }, // Use rear camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        handleBarCodeScanned,
        () => {} // Empty onFailure callback to avoid console spam
      );
    } catch (error) {
      console.error('Error starting barcode scanner:', error);
      Alert.alert('Error', 'Failed to start barcode scanner');
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && scanning) {
      try {
        await scannerRef.current.stop();
        setScanning(false);
      } catch (error) {
        console.error('Error stopping barcode scanner:', error);
      }
    }
  };

  const handleBarCodeScanned = async (decodedText: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    await stopScanning(); // Stop scanning while processing
    
    try {
      const result = await processBarcodeScan(decodedText);
      
      // Add to scan history
      setScanHistory(prev => [
        { 
          type: result.type || 'unknown', 
          message: result.message || 'Scan processed', 
          timestamp: new Date() 
        },
        ...prev.slice(0, 9) // Keep only the 10 most recent scans
      ]);
      
      // Update current supplier if changed
      if (result.type === 'supplier' && result.data) {
        setCurrentSupplier(result.data.name);
      }
      
      // Show feedback
      if (!result.success) {
        Alert.alert('Scan Error', result.message);
      }
      
      // Call the callback if provided
      if (onScanComplete) {
        onScanComplete(result);
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      Alert.alert('Error', 'Failed to process barcode');
    } finally {
      setIsProcessing(false);
      // Allow scanning again after a short delay
      setTimeout(() => {
        startScanning();
      }, 1500);
    }
  };

  const handleClearSupplier = () => {
    clearSupplierContext();
    setCurrentSupplier(null);
    setScanHistory(prev => [
      { 
        type: 'info', 
        message: 'Supplier context cleared', 
        timestamp: new Date() 
      },
      ...prev.slice(0, 9)
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Current Supplier: {currentSupplier || 'None - Scan a supplier barcode first'}
        </Text>
        {currentSupplier && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClearSupplier}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.cameraContainer}>
        <div ref={scannerContainerRef} style={{ width: '100%', height: '100%' }}></div>
        
        {isProcessing && (
          <View style={styles.scanOverlay}>
            <Text style={styles.scanningText}>Processing...</Text>
          </View>
        )}
      </View>
      
      <View style={styles.controlBar}>
        {!scanning ? (
          <TouchableOpacity style={styles.button} onPress={startScanning}>
            <Text style={styles.buttonText}>Start Scanning</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={stopScanning}>
            <Text style={styles.buttonText}>Stop Scanning</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Scan History</Text>
        {scanHistory.map((scan, index) => (
          <View key={index} style={styles.historyItem}>
            <Text style={[
              styles.historyText,
              scan.type === 'error' ? styles.errorText : 
              scan.type === 'supplier' ? styles.supplierText : 
              scan.type === 'material' ? styles.materialText : 
              scan.type === 'info' ? styles.infoText : styles.unknownText
            ]}>
              {scan.message}
            </Text>
            <Text style={styles.timestampText}>
              {scan.timestamp.toLocaleTimeString()}
            </Text>
          </View>
        ))}
        {scanHistory.length === 0 && (
          <Text style={styles.emptyHistoryText}>No scans yet</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

// Add Html5Qrcode to window type
declare global {
  interface Window {
    Html5Qrcode: any;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  statusBar: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  clearButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    alignItems: 'center',
    width: '100%',
  },
  stopButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyContainer: {
    height: 200,
    padding: 10,
    backgroundColor: '#f8f8f8',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  historyText: {
    flex: 1,
    fontSize: 14,
  },
  errorText: {
    color: 'red',
  },
  supplierText: {
    color: 'blue',
  },
  materialText: {
    color: 'green',
  },
  infoText: {
    color: 'purple',
  },
  unknownText: {
    color: 'gray',
  },
  timestampText: {
    fontSize: 12,
    color: '#999',
  },
  emptyHistoryText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
}); 