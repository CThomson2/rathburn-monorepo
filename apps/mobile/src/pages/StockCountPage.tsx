import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useStockCount } from '../hooks/useStockCount';
import BarcodeInput from '../components/BarcodeInput';

// Mock data for testing
const SAMPLE_DATA = [
  { material_name: 'Acetone', material_code: 'ACT', supplier_name: 'Univar', quantity: 12 },
  { material_name: 'Methanol', material_code: 'MET', supplier_name: 'Banner', quantity: 5 },
  { material_name: 'Toluene', material_code: 'TOL', supplier_name: 'BASF', quantity: 3 },
];

export default function StockCountPage() {
  const [activeTab, setActiveTab] = useState<'scan' | 'results'>('scan');
  const [showSampleData, setShowSampleData] = useState(false);
  
  const { 
    supplierContext, 
    lastScanResult, 
    stockData, 
    isLoadingData, 
    handleScan, 
    loadStockData, 
    resetSupplierContext 
  } = useStockCount({
    autoLoadContext: true,
    onScanComplete: (result) => {
      console.log('Scan completed:', result);
      
      // If it's a material scan, refresh the data
      if (result.type === 'material' && result.success) {
        loadStockData();
      }
    }
  });

  const handleTabChange = (tab: 'scan' | 'results') => {
    setActiveTab(tab);
    
    // Load data when switching to results tab
    if (tab === 'results') {
      loadStockData();
    }
  };

  const handleScanComplete = (result: any) => {
    // Handle scan complete logic
    console.log('Scan completed in page component:', result);
    
    // If a material was scanned, switch to results tab
    if (result.type === 'material' && result.success) {
      handleTabChange('results');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stock Count</Text>
        <Text style={styles.headerSubtitle}>
          {supplierContext 
            ? `Current Supplier: ${supplierContext.name}`
            : 'No supplier selected'}
        </Text>
      </View>
      
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'scan' && styles.activeTab]}
          onPress={() => handleTabChange('scan')}
        >
          <Text style={[styles.tabText, activeTab === 'scan' && styles.activeTabText]}>
            Scan Barcodes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'results' && styles.activeTab]}
          onPress={() => handleTabChange('results')}
        >
          <Text style={[styles.tabText, activeTab === 'results' && styles.activeTabText]}>
            View Results
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {activeTab === 'scan' ? (
          <BarcodeInput onScanComplete={handleScanComplete} />
        ) : (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Stock Count Results</Text>
            
            {isLoadingData ? (
              <Text style={styles.loadingText}>Loading data...</Text>
            ) : (
              <ScrollView style={styles.scrollView}>
                {stockData && stockData.length > 0 ? (
                  <View>
                    {stockData.map((item, index) => (
                      <View key={index} style={styles.resultItem}>
                        <View style={styles.resultItemHeader}>
                          <Text style={styles.materialName}>
                            {item.inventory_materials?.name || 'Unknown Material'}
                          </Text>
                          <Text style={styles.materialCode}>
                            {item.inventory_materials?.code || '???'}
                          </Text>
                        </View>
                        <View style={styles.resultItemDetails}>
                          <Text style={styles.supplierName}>
                            Supplier: {item.inventory_suppliers?.name || 'Unknown'}
                          </Text>
                          <Text style={styles.quantity}>
                            Quantity: {item.quantity}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>
                      No stock count data available yet.
                    </Text>
                    <TouchableOpacity
                      style={styles.sampleDataButton}
                      onPress={() => setShowSampleData(!showSampleData)}
                    >
                      <Text style={styles.sampleDataButtonText}>
                        {showSampleData ? 'Hide Sample Data' : 'Show Sample Data'}
                      </Text>
                    </TouchableOpacity>
                    
                    {showSampleData && (
                      <View style={styles.sampleDataContainer}>
                        <Text style={styles.sampleDataTitle}>Sample Data:</Text>
                        {SAMPLE_DATA.map((item, index) => (
                          <View key={index} style={styles.resultItem}>
                            <View style={styles.resultItemHeader}>
                              <Text style={styles.materialName}>{item.material_name}</Text>
                              <Text style={styles.materialCode}>{item.material_code}</Text>
                            </View>
                            <View style={styles.resultItemDetails}>
                              <Text style={styles.supplierName}>
                                Supplier: {item.supplier_name}
                              </Text>
                              <Text style={styles.quantity}>
                                Quantity: {item.quantity}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            )}
            
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => loadStockData()}
            >
              <Text style={styles.refreshButtonText}>Refresh Data</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#4a6da7',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  activeTab: {
    backgroundColor: 'white',
    borderBottomWidth: 2,
    borderBottomColor: '#4a6da7',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#4a6da7',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  resultItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  resultItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  materialName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  materialCode: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
  },
  resultItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  supplierName: {
    fontSize: 14,
    color: '#666',
  },
  quantity: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  sampleDataButton: {
    backgroundColor: '#4a6da7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  sampleDataButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sampleDataContainer: {
    width: '100%',
    marginTop: 20,
  },
  sampleDataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  refreshButton: {
    backgroundColor: '#4a6da7',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 16,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 