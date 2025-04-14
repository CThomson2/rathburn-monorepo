import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { SelectedColumn } from "../types";

/**
 * Hook to fetch and manage columns for a given table
 * @param tableName The name of the table to fetch columns for
 * @returns Object containing columns and loading state
 */
export function useColumns(tableName: string) {
  const [columns, setColumns] = useState<SelectedColumn[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tableName) {
      setColumns([]);
      setIsLoading(false);
      return;
    }

    const fetchColumns = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const supabase = createClient();
        
        // Fetch a single row to get column names
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .limit(1);

        if (error) throw new Error(error.message);

        if (data && data.length > 0) {
          // Extract column names from first row
          const columnNames = Object.keys(data[0]).map((col) => ({
            name: col,
            selected: true, // Select all columns by default
          }));
          setColumns(columnNames);
        } else {
          // If no data, try to get the columns from an empty query
          const { error: emptyError } = await supabase
            .from(tableName)
            .select("*")
            .limit(0);
          
          if (emptyError) throw new Error(emptyError.message);
          
          // We can't get columns if there's no data
          setColumns([]);
        }
      } catch (err) {
        console.error("Error fetching columns:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setColumns([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchColumns();
  }, [tableName]);

  // Helper to update column selection
  const toggleColumn = (columnName: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.name === columnName ? { ...col, selected: !col.selected } : col
      )
    );
  };

  // Helper to select/deselect all columns
  const toggleAllColumns = (selected: boolean) => {
    setColumns((prev) =>
      prev.map((col) => ({ ...col, selected }))
    );
  };

  // Get only selected column names
  const getSelectedColumns = () => {
    return columns
      .filter((col) => col.selected)
      .map((col) => col.name);
  };

  return {
    columns,
    isLoading,
    error,
    toggleColumn,
    toggleAllColumns,
    getSelectedColumns,
  };
}

