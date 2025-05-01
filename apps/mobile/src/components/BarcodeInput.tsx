import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Button, Text, Alert } from 'react-native';
import { processBarcodeScan, getSupplierContext, clearSupplierContext } from '../services/stockCount';

interface BarcodeInputProps {
  onScanComplete?: (result: any) => void;
}

export default function BarcodeInput({ onScanComplete }: BarcodeInputProps) {
  const [barcode, setBarcode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<string | null>(() => {
    const context = getSupplierContext();
    return context ? context.name : null;
  });
  const [scanHistory, setScanHistory] = useState<Array<{ type: string; message: string; timestamp: Date }>>([]);

  const handleSubmit = async () => {
    if (!barcode.trim()) {
      Alert.alert('Error', 'Please enter a barcode');
      return;
    }

    setIsProcessing(true);
    
    try {
      const result = await processBarcodeScan(barcode.trim());
      
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

      // Clear input after successful processing
      setBarcode('');
    } catch (error) {
      console.error('Error processing barcode:', error);
      Alert.alert('Error', 'Failed to process barcode');
    } finally {
      setIsProcessing(false);
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
    <View style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Current Supplier: {currentSupplier || 'None - Enter a supplier barcode first'}
        </Text>
        {currentSupplier && (
          <Button title="Clear" onPress={handleClearSupplier} color="#ff6b6b" />
        )}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={barcode}
          onChangeText={setBarcode}
          placeholder="Enter barcode..."
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isProcessing}
        />
        <Button
          title={isProcessing ? "Processing..." : "Process"}
          onPress={handleSubmit}
          disabled={isProcessing || !barcode.trim()}
        />
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

      <View style={styles.helpContainer}>
        <Text style={styles.helpTitle}>Manual Entry Instructions</Text>
        <Text style={styles.helpText}>
          1. Enter a supplier UUID to set the supplier context.
        </Text>
        <Text style={styles.helpText}>
          2. Enter material UUIDs to count those materials.
        </Text>
        <Text style={styles.helpText}>
          3. See scan history results above.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
  },
  historyContainer: {
    flex: 1,
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  historyText: {
    flex: 1,
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
  helpContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  helpText: {
    marginBottom: 4,
  },
}); 