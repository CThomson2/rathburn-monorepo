import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useScanJob } from "../hooks/useScanJob";

interface ScanResult {
  barcode: string;
  timestamp: string;
  success: boolean;
}

interface ScannerProps {
  onScan?: (barcode: string) => void;
}

export function Scanner({ onScan }: ScannerProps) {
  const { jobId, setJobId, lastScan, setLastScan, clearJob } = useScanJob();
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (lastScan && lastScan.success) {
      setIsScanning(false);
      onScan?.(lastScan.barcode);
    }
  }, [lastScan, onScan]);

  const handleStartScan = () => {
    setIsScanning(true);
    const newJobId = `scan-${Date.now()}`;
    setJobId(newJobId);
  };

  const handleStopScan = () => {
    setIsScanning(false);
    clearJob();
  };

  return (
    <View style={styles.container}>
      <View style={styles.scanArea}>
        {isScanning ? (
          <Text style={styles.scanningText}>Scanning...</Text>
        ) : (
          <Text style={styles.readyText}>Ready to scan</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        {isScanning ? (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={handleStopScan}
          >
            <Text style={styles.buttonText}>Stop Scanning</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={handleStartScan}
          >
            <Text style={styles.buttonText}>Start Scanning</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: "80%",
    height: 200,
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  scanningText: {
    fontSize: 18,
    color: "#007bff",
  },
  readyText: {
    fontSize: 18,
    color: "#6c757d",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "#28a745",
  },
  stopButton: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
