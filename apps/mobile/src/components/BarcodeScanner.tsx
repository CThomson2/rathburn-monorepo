import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { processBarcodeScan, getSupplierContext } from '../api/stockCount';

interface BarcodeScannerProps {
  onScanComplete?: (result: any) => void;
}

export default function BarcodeScanner({ onScanComplete }: BarcodeScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<Array<{ type: string; message: string; timestamp: Date }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    // Check for existing supplier context
    const supplier = getSupplierContext();
    setCurrentSupplier(supplier);
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (isProcessing) return;
    
    setScanned(true);
    setIsProcessing(true);
    
    try {
      const result = await processBarcodeScan(data);
      
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
      setTimeout(() => setScanned(false), 1500);
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Current Supplier: {currentSupplier || 'None - Scan a supplier barcode first'}
        </Text>
      </View>
      
      <View style={styles.cameraContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={styles.camera}
        />
        {scanned && (
          <View style={styles.scanOverlay}>
            <Text style={styles.scanningText}>Processing...</Text>
          </View>
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
              scan.type === 'material' ? styles.materialText : styles.unknownText
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
      
      {scanned && (
        <TouchableOpacity style={styles.button} onPress={() => setScanned(false)}>
          <Text style={styles.buttonText}>Scan Again</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
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
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
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
  button: {
    backgroundColor: '#2196F3',
    padding: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 