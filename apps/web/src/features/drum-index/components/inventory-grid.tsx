"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

interface Drum {
  drum_id: number;
  serial_number: string;
  current_volume: number;
  current_location: string;
  status:
    | "pending"
    | "in_stock"
    | "pre_production"
    | "in_production"
    | "decommissioning"
    | "empty";
}

interface Batch {
  batch_id: string;
  batch_type: string;
  total_volume: number;
  created_at: string;
  updated_at: string;
  item_id: string;
  item_name: string;
}

interface DrumResponse {
  drums: Drum[];
  batches: Batch[];
  total: number;
}

const pageSize = 100;

/**
 * Component for displaying a table of raw material drums in stock.
 * Includes filtering options for material, supplier, location, scanned by, and date range.
 * The table will only display a maximum of 100 drums per page.
 *
 * Supabase data fetched from the inventory schema
 * ```sql
 * SELECT
 *  d.drum_id,
 *  d.serial_number,
 *  d.current_volume,
 *  d.status,
 *  d.current_location,
 *  d.created_at,
 *  d.updated_at,
 * d.batch_id,
 * b.item_id
 * b.batch_type
 * b.total_volume
 * i.name
 * b.created_at
 * b.updated_at
 * FROM inventory.drums d
 * LEFT JOIN inventory.batches b ON d.batch_id = b.batch_id
 * LEFT JOIN inventory.items i ON b.item_id = i.item_id
 * ```
 */
const DrumInventoryGrid: React.FC = () => {
  const [drums, setDrums] = useState<Drum[]>([]);
  const [filters, setFilters] = useState({
    serial_number: "",
    current_volume: "",
    status: "",
    current_location: "",
    batch_type: "",
    total_volume: "",
    item_name: "",
  });
  const [page, setPage] = useState(1);

  const fetchDrums = async () => {
    const supabase = createClient();
    let query = supabase
      .schema("inventory")
      .from("drums")
      .select(
        `
        drum_id,
        serial_number,
        current_volume,
        status,
        current_location,
        created_at,
        batches:batch_id!inner(
          item_id,
          batch_type,
          total_volume,
          created_at,
          updated_at,
          items:item_id!inner(
            name
          )
        )
      )`
      )
      .order("drum_id");

    console.log(query);

    if (filters.serial_number)
      query = query.ilike("serial_number", `%${filters.serial_number}%`);
    if (filters.current_volume)
      query = query.ilike("current_volume", `%${filters.current_volume}%`);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.current_location)
      query = query.ilike("current_location", `%${filters.current_location}%`);
    if (filters.batch_type)
      query = query.ilike("batch_type", `%${filters.batch_type}%`);
    if (filters.total_volume)
      query = query.ilike("total_volume", `%${filters.total_volume}%`);
    if (filters.item_name)
      query = query.ilike("item_name", `%${filters.item_name}%`);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await query.range(from, to);
    if (error) console.error(error);
    else setDrums(data as any);
  };

  useEffect(() => {
    fetchDrums();
  }, [filters, page]);

  const getStatusClass = (status: Drum["status"]) => {
    switch (status) {
      case "pending":
        return "bg-gray-300 opacity-50";
      case "in_stock":
        return "bg-blue-400";
      case "pre_production":
        return "bg-green-400";
      case "in_production":
        return "bg-yellow-400";
      case "decommissioning":
        return "bg-red-400";
      case "empty":
        return "bg-gray-200";
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Raw Material Drums</h2>

      <div className="grid grid-cols-6 gap-4 mb-6">
        <Input
          placeholder="Serial Number"
          value={filters.serial_number}
          onChange={(e) =>
            setFilters((f) => ({ ...f, serial_number: e.target.value }))
          }
        />
        <Input
          placeholder="Current Volume"
          value={filters.current_volume}
          onChange={(e) =>
            setFilters((f) => ({ ...f, current_volume: e.target.value }))
          }
        />
        <Input
          placeholder="Current Location"
          value={filters.current_location}
          onChange={(e) =>
            setFilters((f) => ({ ...f, current_location: e.target.value }))
          }
        />
        <Input
          placeholder="Batch Type"
          value={filters.batch_type}
          onChange={(e) =>
            setFilters((f) => ({ ...f, batch_type: e.target.value }))
          }
        />
        <Input
          placeholder="Total Volume"
          value={filters.total_volume}
          onChange={(e) =>
            setFilters((f) => ({ ...f, total_volume: e.target.value }))
          }
        />
        <Input
          placeholder="Item Name"
          value={filters.item_name}
          onChange={(e) =>
            setFilters((f) => ({ ...f, item_name: e.target.value }))
          }
        />
      </div>

      <div className="grid grid-cols-10 gap-4 mb-6">
        {drums.map((drum) => (
          <div
            key={drum.serial_number}
            className="flex flex-col items-center cursor-pointer"
          >
            <div
              className={`w-12 h-12 rounded-full ${getStatusClass(drum.status)}`}
            />
            <span className="text-sm mt-1">#{drum.serial_number}</span>
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
