"use client";

import { useEffect, useState } from "react";
import { Batch, BatchFilters } from "@/types/models/batches";

// Mock data for demonstration
const MOCK_BATCHES: Batch[] = [
  {
    batch_id: "550e8400-e29b-41d4-a716-446655440000",
    batch_type: "new",
    item_name: "THF - Tetrahydrofuran",
    material_name: "Tetrahydrofuran",
    chemical_group: "Gen Solvents",
    supplier_name: "Chemical Supplies Ltd",
    total_volume: 50,
    created_at: "2023-10-15T14:30:00Z",
    updated_at: "2023-10-15T14:30:00Z",
    po_number: "PO-2023-1015",
    input_recorded_at: "2023-10-15T14:30:00Z",
    batch_code: "THF-23-10-15",
    drum_count: 25,
    drums_in_stock: 22
  },
  {
    batch_id: "660e8400-e29b-41d4-a716-446655440001",
    batch_type: "repro",
    item_name: "Propionic Acid",
    material_name: "Propionic Acid",
    chemical_group: "Gen Solvents",
    supplier_name: "AcidWorks Inc",
    total_volume: 30,
    created_at: "2023-09-22T10:15:00Z",
    updated_at: "2023-09-22T10:15:00Z",
    po_number: "PO-2023-0922",
    input_recorded_at: "2023-09-22T10:15:00Z",
    batch_code: "PA-23-09-22",
    drum_count: 15,
    drums_in_stock: 12
  },
  {
    batch_id: "770e8400-e29b-41d4-a716-446655440002",
    batch_type: "new",
    item_name: "Octanol",
    material_name: "Octanol",
    chemical_group: "Hydrocarbons",
    supplier_name: "FuelChem GmbH",
    total_volume: 40,
    created_at: "2023-08-10T09:00:00Z",
    updated_at: "2023-08-10T09:00:00Z",
    po_number: "PO-2023-0810",
    input_recorded_at: "2023-08-10T09:00:00Z",
    batch_code: "OCT-23-08-10",
    drum_count: 20,
    drums_in_stock: 18
  },
];

interface UseBatchesResult {
  batches: Batch[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useBatches(filters?: BatchFilters): UseBatchesResult {
  const [batches, setBatches] = useState<Batch[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBatches = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Filter mock data based on filters
      let filteredBatches = [...MOCK_BATCHES];

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredBatches = filteredBatches.filter(batch => 
          batch.item_name.toLowerCase().includes(searchLower) ||
          batch.material_name.toLowerCase().includes(searchLower) ||
          (batch.supplier_name && batch.supplier_name.toLowerCase().includes(searchLower)) ||
          (batch.batch_code && batch.batch_code.toLowerCase().includes(searchLower))
        );
      }

      if (filters?.batchType && filters.batchType !== 'all') {
        filteredBatches = filteredBatches.filter(batch => 
          batch.batch_type === filters.batchType
        );
      }

      if (filters?.chemicalGroup && filters.chemicalGroup !== 'all') {
        filteredBatches = filteredBatches.filter(batch => 
          batch.chemical_group === filters.chemicalGroup
        );
      }

      // Sort by created_at descending
      filteredBatches.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setBatches(filteredBatches);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"));
      console.error("Error fetching batches:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [
    filters?.search,
    filters?.batchType,
    filters?.chemicalGroup,
    filters?.dateFrom,
    filters?.dateTo,
  ]);

  return { batches, isLoading, error, refetch: fetchBatches };
} 