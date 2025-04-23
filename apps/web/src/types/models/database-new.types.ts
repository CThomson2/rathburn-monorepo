export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  config: {
    Tables: {
      drum_status_transitions: {
        Row: {
          current_status: string
          next_status: string
          requires_admin: boolean | null
          requires_reason: boolean | null
        }
        Insert: {
          current_status: string
          next_status: string
          requires_admin?: boolean | null
          requires_reason?: boolean | null
        }
        Update: {
          current_status?: string
          next_status?: string
          requires_admin?: boolean | null
          requires_reason?: boolean | null
        }
        Relationships: []
      }
      labs: {
        Row: {
          description: string | null
          lab_id: number
          name: string
          site: string
        }
        Insert: {
          description?: string | null
          lab_id?: never
          name: string
          site: string
        }
        Update: {
          description?: string | null
          lab_id?: never
          name?: string
          site?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          grade: string
          material_code: string | null
          name: string
          product_id: number
          sku: string
        }
        Insert: {
          grade: string
          material_code?: string | null
          name: string
          product_id?: number
          sku: string
        }
        Update: {
          grade?: string
          material_code?: string | null
          name?: string
          product_id?: number
          sku?: string
        }
        Relationships: []
      }
      stills: {
        Row: {
          code: string
          is_operational: boolean
          is_vacuum: boolean
          lab_id: number
          max_capacity: number
          notes: string | null
          power_rating_kw: number
          still_id: number
        }
        Insert: {
          code: string
          is_operational: boolean
          is_vacuum: boolean
          lab_id: number
          max_capacity: number
          notes?: string | null
          power_rating_kw: number
          still_id?: never
        }
        Update: {
          code?: string
          is_operational?: boolean
          is_vacuum?: boolean
          lab_id?: number
          max_capacity?: number
          notes?: string | null
          power_rating_kw?: number
          still_id?: never
        }
        Relationships: [
          {
            foreignKeyName: "stills_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["lab_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  inventory: {
    Tables: {
      batch_inputs: {
        Row: {
          batch_code: string | null
          batch_id: string
          input_id: string
          recorded_at: string
          source_id: string
          source_type: string
          volume_added: number
        }
        Insert: {
          batch_code?: string | null
          batch_id: string
          input_id?: string
          recorded_at?: string
          source_id: string
          source_type: string
          volume_added: number
        }
        Update: {
          batch_code?: string | null
          batch_id?: string
          input_id?: string
          recorded_at?: string
          source_id?: string
          source_type?: string
          volume_added?: number
        }
        Relationships: [
          {
            foreignKeyName: "batch_inputs_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "batch_inputs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["po_id"]
          },
        ]
      }
      batches: {
        Row: {
          batch_id: string
          batch_type: string
          created_at: string
          item_id: string
          po_id: string | null
          total_volume: number
        }
        Insert: {
          batch_id?: string
          batch_type: string
          created_at?: string
          item_id: string
          po_id?: string | null
          total_volume: number
        }
        Update: {
          batch_id?: string
          batch_type?: string
          created_at?: string
          item_id?: string
          po_id?: string | null
          total_volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "batches_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "batches_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["po_id"]
          },
        ]
      }
      drum_fills: {
        Row: {
          batch_id: string
          drum_id: string
          fill_id: string
          filled_at: string
          volume_added: number
        }
        Insert: {
          batch_id: string
          drum_id: string
          fill_id?: string
          filled_at?: string
          volume_added: number
        }
        Update: {
          batch_id?: string
          drum_id?: string
          fill_id?: string
          filled_at?: string
          volume_added?: number
        }
        Relationships: [
          {
            foreignKeyName: "drum_fills_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "drum_fills_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "drums"
            referencedColumns: ["drum_id"]
          },
        ]
      }
      drums: {
        Row: {
          batch_id: string
          created_at: string
          current_location: string | null
          current_volume: number
          drum_id: string
          serial_number: string
          status: string
          updated_at: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          current_location?: string | null
          current_volume?: number
          drum_id?: string
          serial_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          current_location?: string | null
          current_volume?: number
          drum_id?: string
          serial_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drums_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "drums_current_location_fkey"
            columns: ["current_location"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["location_id"]
          },
        ]
      }
      items: {
        Row: {
          barcode_regex: string
          created_at: string
          is_repro: boolean
          item_id: string
          material_id: string
          name: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          barcode_regex: string
          created_at?: string
          is_repro?: boolean
          item_id?: string
          material_id: string
          name: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          barcode_regex?: string
          created_at?: string
          is_repro?: boolean
          item_id?: string
          material_id?: string
          name?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["material_id"]
          },
          {
            foreignKeyName: "items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      locations: {
        Row: {
          code: string
          created_at: string
          location_id: string
          name: string
          parent_id: string | null
          type: string
        }
        Insert: {
          code: string
          created_at?: string
          location_id?: string
          name: string
          parent_id?: string | null
          type: string
        }
        Update: {
          code?: string
          created_at?: string
          location_id?: string
          name?: string
          parent_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["location_id"]
          },
        ]
      }
      materials: {
        Row: {
          cas_number: string
          chemical_group: string
          code: string
          material_id: string
          name: string
        }
        Insert: {
          cas_number: string
          chemical_group?: string
          code: string
          material_id?: string
          name: string
        }
        Update: {
          cas_number?: string
          chemical_group?: string
          code?: string
          material_id?: string
          name?: string
        }
        Relationships: []
      }
      purchase_order_lines: {
        Row: {
          item_id: string
          po_id: string
          pol_id: string
          quantity: number
        }
        Insert: {
          item_id: string
          po_id: string
          pol_id?: string
          quantity: number
        }
        Update: {
          item_id?: string
          po_id?: string
          pol_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_lines_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["po_id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          eta_date: string | null
          order_date: string
          po_id: string
          po_number: string
          status: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          eta_date?: string | null
          order_date?: string
          po_id?: string
          po_number: string
          status: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          eta_date?: string | null
          order_date?: string
          po_id?: string
          po_number?: string
          status?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      suppliers: {
        Row: {
          name: string
          supplier_id: string
        }
        Insert: {
          name: string
          supplier_id?: string
        }
        Update: {
          name?: string
          supplier_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      receive_delivery: {
        Args: { p_po_id: string; p_item_id: string; p_qty: number }
        Returns: string
      }
      validate_barcode: {
        Args: { barcode: string }
        Returns: string
      }
    }
    Enums: {
      action_type: "context_get" | "context_set" | "transport" | "location_set"
      batch_type: "new" | "repro"
      drum_status: "in_stock" | "reserved" | "in_production" | "empty" | "lost"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  logs: {
    Tables: {
      context_scan: {
        Row: {
          context_scan_id: number
          context_type: string
          device_id: string
          error_code: string | null
          metadata: Json
          raw_qr_code: string
          scanned_at: string
          status: string
          user_id: string
        }
        Insert: {
          context_scan_id?: number
          context_type: string
          device_id: string
          error_code?: string | null
          metadata?: Json
          raw_qr_code: string
          scanned_at?: string
          status?: string
          user_id: string
        }
        Update: {
          context_scan_id?: number
          context_type?: string
          device_id?: string
          error_code?: string | null
          metadata?: Json
          raw_qr_code?: string
          scanned_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_scan_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["device_id"]
          },
        ]
      }
      devices: {
        Row: {
          device_id: string
          hw_id: string
          last_seen: string
          model: string | null
          os_version: string | null
        }
        Insert: {
          device_id?: string
          hw_id: string
          last_seen?: string
          model?: string | null
          os_version?: string | null
        }
        Update: {
          device_id?: string
          hw_id?: string
          last_seen?: string
          model?: string | null
          os_version?: string | null
        }
        Relationships: []
      }
      drum_scan: {
        Row: {
          action_type: Database["inventory"]["Enums"]["action_type"]
          detected_drum: string | null
          device_id: string
          error_code: string | null
          metadata: Json
          raw_barcode: string
          scan_id: number
          scanned_at: string
          status: string
          user_id: string
        }
        Insert: {
          action_type: Database["inventory"]["Enums"]["action_type"]
          detected_drum?: string | null
          device_id: string
          error_code?: string | null
          metadata?: Json
          raw_barcode: string
          scan_id?: number
          scanned_at?: string
          status: string
          user_id: string
        }
        Update: {
          action_type?: Database["inventory"]["Enums"]["action_type"]
          detected_drum?: string | null
          device_id?: string
          error_code?: string | null
          metadata?: Json
          raw_barcode?: string
          scan_id?: number
          scanned_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drum_scan_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["device_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  config: {
    Enums: {},
  },
  inventory: {
    Enums: {
      action_type: ["context_get", "context_set", "transport", "location_set"],
      batch_type: ["new", "repro"],
      drum_status: ["in_stock", "reserved", "in_production", "empty", "lost"],
    },
  },
  logs: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
