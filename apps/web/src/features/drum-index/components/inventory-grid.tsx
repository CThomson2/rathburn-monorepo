// File: DrumInventoryGrid.tsx

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

interface Drum {
  id: number;
  material: string;
  supplier: string;
  date_received: string | null;
  location: string;
  scanned_by: string | null;
  status: "ordered" | "in_stock" | "processed";
}

const pageSize = 100;

/**
 * Component for displaying a table of raw material drums in stock.
 * Includes filtering options for material, supplier, location, scanned by, and date range.
 * The table will only display a maximum of 100 drums per page.
 */
const DrumInventoryGrid: React.FC = () => {
  const [drums, setDrums] = useState<Drum[]>([]);
  const [filters, setFilters] = useState({
    material: "",
    supplier: "",
    location: "",
    scanned_by: "",
    startDate: "",
    endDate: "",
  });
  const [page, setPage] = useState(1);

  const fetchDrums = async () => {
    let query = createClient().from("drum_inventory").select("*").order("id");

    if (filters.material)
      query = query.ilike("material", `%${filters.material}%`);
    if (filters.supplier)
      query = query.ilike("supplier", `%${filters.supplier}%`);
    if (filters.location)
      query = query.ilike("location", `%${filters.location}%`);
    if (filters.scanned_by) query = query.eq("scanned_by", filters.scanned_by);
    if (filters.startDate)
      query = query.gte("date_received", filters.startDate);
    if (filters.endDate) query = query.lte("date_received", filters.endDate);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await query.range(from, to);
    if (error) console.error(error);
    else setDrums(data as Drum[]);
  };

  useEffect(() => {
    fetchDrums();
  }, [filters, page]);

  const getStatusClass = (status: Drum["status"]) => {
    switch (status) {
      case "ordered":
        return "bg-gray-300 opacity-50";
      case "in_stock":
        return "bg-blue-400";
      case "processed":
        return "bg-green-400";
      default:
        return "bg-gray-200";
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Raw Material Drums</h2>

      <div className="grid grid-cols-6 gap-4 mb-6">
        <Input
          placeholder="Material"
          value={filters.material}
          onChange={(e) =>
            setFilters((f) => ({ ...f, material: e.target.value }))
          }
        />
        <Input
          placeholder="Supplier"
          value={filters.supplier}
          onChange={(e) =>
            setFilters((f) => ({ ...f, supplier: e.target.value }))
          }
        />
        <Input
          placeholder="Location"
          value={filters.location}
          onChange={(e) =>
            setFilters((f) => ({ ...f, location: e.target.value }))
          }
        />
        <Input
          placeholder="Scanned By (User ID)"
          value={filters.scanned_by}
          onChange={(e) =>
            setFilters((f) => ({ ...f, scanned_by: e.target.value }))
          }
        />
        <Input
          type="date"
          value={filters.startDate}
          onChange={(e) =>
            setFilters((f) => ({ ...f, startDate: e.target.value }))
          }
        />
        <Input
          type="date"
          value={filters.endDate}
          onChange={(e) =>
            setFilters((f) => ({ ...f, endDate: e.target.value }))
          }
        />
      </div>

      <div className="grid grid-cols-10 gap-4 mb-6">
        {drums.map((drum) => (
          <div
            key={drum.id}
            className="flex flex-col items-center cursor-pointer"
          >
            <div
              className={`w-12 h-12 rounded-full ${getStatusClass(drum.status)}`}
            />
            <span className="text-sm mt-1">#{drum.id}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <Button onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Previous
        </Button>
        <span>Page {page}</span>
        <Button onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
    </div>
  );
};

export default DrumInventoryGrid;
