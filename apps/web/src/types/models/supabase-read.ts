export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  inventory: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_to_repro_drum: {
        Args: {
          distillation_id: number
          repro_material: string
          volume_to_add: number
        }
        Returns: undefined
      }
      get_drum_inventory: {
        Args: { material: string }
        Returns: {
          drum_id: number
          import_id: number
          material_type: string
          date_received: string
          supplier_name: string
          supplier_batch_code: string
          date_processed: string
        }[]
      }
      mass_to_volume: {
        Args: { _material_id: number; _weight: number }
        Returns: number
      }
    }
    Enums: {
      drum_status:
        | "en_route"
        | "in_stock"
        | "pending_allocation"
        | "allocated"
        | "rescheduled"
        | "decommissioned"
        | "empty"
        | "lost"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      distillation_pending_assignment: {
        Row: {
          assigned_distillation_id: number | null
          drum_id: number | null
          pending_id: number
          status: string | null
          transport_id: number
        }
        Insert: {
          assigned_distillation_id?: number | null
          drum_id?: number | null
          pending_id?: number
          status?: string | null
          transport_id: number
        }
        Update: {
          assigned_distillation_id?: number | null
          drum_id?: number | null
          pending_id?: number
          status?: string | null
          transport_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "distillation_pending_assignments_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "stock_drum"
            referencedColumns: ["drum_id"]
          },
        ]
      }
      order_detail: {
        Row: {
          batch_code: string | null
          detail_id: number
          drum_quantity: number
          drum_weight: number | null
          material_code: string
          material_name: string
          notes: string | null
          order_id: number
          status: string
        }
        Insert: {
          batch_code?: string | null
          detail_id?: number
          drum_quantity: number
          drum_weight?: number | null
          material_code: string
          material_name: string
          notes?: string | null
          order_id: number
          status?: string
        }
        Update: {
          batch_code?: string | null
          detail_id?: number
          drum_quantity?: number
          drum_weight?: number | null
          material_code?: string
          material_name?: string
          notes?: string | null
          order_id?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_detail_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "ref_materials"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "order_detail_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "vw_drum_inventory"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "order_detail_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "vw_stock_history_analysis"
            referencedColumns: ["material_code"]
          },
          {
            foreignKeyName: "stock_order_details_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "stock_order"
            referencedColumns: ["order_id"]
          },
        ]
      }
      order_detail_stock_activity: {
        Row: {
          created_at: string | null
          id: number
          order_detail_id: number
          stock_activity_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          order_detail_id: number
          stock_activity_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          order_detail_id?: number
          stock_activity_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_detail_stock_activity_order_detail_id_fkey"
            columns: ["order_detail_id"]
            isOneToOne: false
            referencedRelation: "order_detail"
            referencedColumns: ["detail_id"]
          },
          {
            foreignKeyName: "order_detail_stock_activity_stock_activity_id_fkey"
            columns: ["stock_activity_id"]
            isOneToOne: false
            referencedRelation: "stock_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_detail_stock_activity_stock_activity_id_fkey"
            columns: ["stock_activity_id"]
            isOneToOne: false
            referencedRelation: "stock_history_compatibility_view"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_materials: {
        Row: {
          cas_number: string
          chemical_group: string | null
          chemical_props: Json | null
          description: string | null
          drum_volume: number
          drum_weight: number | null
          flash_point: number | null
          material_code: string
          material_id: number
          material_name: string
          un_code: string | null
        }
        Insert: {
          cas_number: string
          chemical_group?: string | null
          chemical_props?: Json | null
          description?: string | null
          drum_volume?: number
          drum_weight?: number | null
          flash_point?: number | null
          material_code?: string
          material_id?: number
          material_name: string
          un_code?: string | null
        }
        Update: {
          cas_number?: string
          chemical_group?: string | null
          chemical_props?: Json | null
          description?: string | null
          drum_volume?: number
          drum_weight?: number | null
          flash_point?: number | null
          material_code?: string
          material_id?: number
          material_name?: string
          un_code?: string | null
        }
        Relationships: []
      }
      ref_materials: {
        Row: {
          cas_number: string | null
          chemical_group: string
          code: string
          value: string
        }
        Insert: {
          cas_number?: string | null
          chemical_group: string
          code: string
          value: string
        }
        Update: {
          cas_number?: string | null
          chemical_group?: string
          code?: string
          value?: string
        }
        Relationships: []
      }
      ref_supplier_material: {
        Row: {
          location: string
          material_code: string
          material_name: string
          quantity: number
          supplier_id: number
          updated_at: string | null
        }
        Insert: {
          location: string
          material_code: string
          material_name: string
          quantity: number
          supplier_id: number
          updated_at?: string | null
        }
        Update: {
          location?: string
          material_code?: string
          material_name?: string
          quantity?: number
          supplier_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_material_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "ref_materials"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "supplier_material_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "vw_drum_inventory"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "supplier_material_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "vw_stock_history_analysis"
            referencedColumns: ["material_code"]
          },
          {
            foreignKeyName: "supplier_material_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "ref_suppliers"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      ref_suppliers: {
        Row: {
          addr_1: string | null
          addr_2: string | null
          city: string | null
          country_code: string | null
          post_code: string | null
          supplier_id: number
          supplier_name: string
        }
        Insert: {
          addr_1?: string | null
          addr_2?: string | null
          city?: string | null
          country_code?: string | null
          post_code?: string | null
          supplier_id?: number
          supplier_name: string
        }
        Update: {
          addr_1?: string | null
          addr_2?: string | null
          city?: string | null
          country_code?: string | null
          post_code?: string | null
          supplier_id?: number
          supplier_name?: string
        }
        Relationships: []
      }
      stock_activity: {
        Row: {
          activity_date: string
          activity_type: string
          batch_code: string | null
          created_at: string | null
          distillation_detail_id: number | null
          drum_ids: string | null
          drum_type: string
          id: number
          material_code: string | null
          notes: string | null
          order_detail_id: number | null
          quantity: number
          source_record_id: number | null
          status: string | null
          supplier_id: number | null
          updated_at: string | null
        }
        Insert: {
          activity_date: string
          activity_type: string
          batch_code?: string | null
          created_at?: string | null
          distillation_detail_id?: number | null
          drum_ids?: string | null
          drum_type: string
          id?: number
          material_code?: string | null
          notes?: string | null
          order_detail_id?: number | null
          quantity: number
          source_record_id?: number | null
          status?: string | null
          supplier_id?: number | null
          updated_at?: string | null
        }
        Update: {
          activity_date?: string
          activity_type?: string
          batch_code?: string | null
          created_at?: string | null
          distillation_detail_id?: number | null
          drum_ids?: string | null
          drum_type?: string
          id?: number
          material_code?: string | null
          notes?: string | null
          order_detail_id?: number | null
          quantity?: number
          source_record_id?: number | null
          status?: string | null
          supplier_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_activity_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "ref_materials"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "stock_activity_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "vw_drum_inventory"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "stock_activity_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "vw_stock_history_analysis"
            referencedColumns: ["material_code"]
          },
          {
            foreignKeyName: "stock_activity_order_detail_id_fkey"
            columns: ["order_detail_id"]
            isOneToOne: false
            referencedRelation: "order_detail"
            referencedColumns: ["detail_id"]
          },
          {
            foreignKeyName: "stock_activity_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "ref_suppliers"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      stock_drum: {
        Row: {
          created_at: string | null
          distillation_id: number | null
          drum_id: number
          drum_type: string
          fill_level: number | null
          material_code: string | null
          order_detail_id: number
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          distillation_id?: number | null
          drum_id?: number
          drum_type?: string
          fill_level?: number | null
          material_code?: string | null
          order_detail_id: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          distillation_id?: number | null
          drum_id?: number
          drum_type?: string
          fill_level?: number | null
          material_code?: string | null
          order_detail_id?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_drums_order_detail_id_fkey"
            columns: ["order_detail_id"]
            isOneToOne: false
            referencedRelation: "order_detail"
            referencedColumns: ["detail_id"]
          },
        ]
      }
      stock_drum_new: {
        Row: {
          created_at: string | null
          distillation_id: number | null
          drum_id: number
          drum_type: string
          fill_level: number | null
          material_code: string | null
          order_detail_id: number
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          distillation_id?: number | null
          drum_id?: number
          drum_type?: string
          fill_level?: number | null
          material_code?: string | null
          order_detail_id: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          distillation_id?: number | null
          drum_id?: number
          drum_type?: string
          fill_level?: number | null
          material_code?: string | null
          order_detail_id?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_drum_new_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "ref_materials"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "stock_drum_new_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "vw_drum_inventory"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "stock_drum_new_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "vw_stock_history_analysis"
            referencedColumns: ["material_code"]
          },
          {
            foreignKeyName: "stock_drum_new_order_detail_id_fkey"
            columns: ["order_detail_id"]
            isOneToOne: false
            referencedRelation: "order_detail"
            referencedColumns: ["detail_id"]
          },
        ]
      }
      stock_history: {
        Row: {
          batch_code: string | null
          change: number | null
          created_at: string | null
          date: string
          drum_ids: string | null
          drum_type: string
          id: number
          material_code: string | null
          material_name: string
          source_record_id: number | null
          supplier_id: number | null
          supplier_name: string | null
          updated_at: string | null
        }
        Insert: {
          batch_code?: string | null
          change?: number | null
          created_at?: string | null
          date: string
          drum_ids?: string | null
          drum_type: string
          id?: number
          material_code?: string | null
          material_name: string
          source_record_id?: number | null
          supplier_id?: number | null
          supplier_name?: string | null
          updated_at?: string | null
        }
        Update: {
          batch_code?: string | null
          change?: number | null
          created_at?: string | null
          date?: string
          drum_ids?: string | null
          drum_type?: string
          id?: number
          material_code?: string | null
          material_name?: string
          source_record_id?: number | null
          supplier_id?: number | null
          supplier_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_history_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "ref_materials"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "stock_history_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "vw_drum_inventory"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "stock_history_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "vw_stock_history_analysis"
            referencedColumns: ["material_code"]
          },
          {
            foreignKeyName: "stock_history_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "ref_suppliers"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      stock_new: {
        Row: {
          batch_code: string
          created_at: string | null
          location: string | null
          material_code: string | null
          notes: string | null
          quantity: number
          stock_id: number
          supplier_id: number | null
          updated_at: string | null
        }
        Insert: {
          batch_code: string
          created_at?: string | null
          location?: string | null
          material_code?: string | null
          notes?: string | null
          quantity: number
          stock_id?: number
          supplier_id?: number | null
          updated_at?: string | null
        }
        Update: {
          batch_code?: string
          created_at?: string | null
          location?: string | null
          material_code?: string | null
          notes?: string | null
          quantity?: number
          stock_id?: number
          supplier_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_new_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "ref_materials"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "stock_new_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "vw_drum_inventory"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "stock_new_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "vw_stock_history_analysis"
            referencedColumns: ["material_code"]
          },
          {
            foreignKeyName: "stock_new_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "ref_suppliers"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      stock_order: {
        Row: {
          created_at: string | null
          date_ordered: string
          eta: unknown | null
          notes: string | null
          order_id: number
          po_number: string | null
          supplier_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_ordered?: string
          eta?: unknown | null
          notes?: string | null
          order_id?: never
          po_number?: string | null
          supplier_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_ordered?: string
          eta?: unknown | null
          notes?: string | null
          order_id?: never
          po_number?: string | null
          supplier_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "ref_suppliers"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      stock_repro: {
        Row: {
          created_at: string | null
          location: string
          material_code: string | null
          notes: string | null
          quantity: number
          stock_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          location: string
          material_code?: string | null
          notes?: string | null
          quantity: number
          stock_id?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          location?: string
          material_code?: string | null
          notes?: string | null
          quantity?: number
          stock_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_repro_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "ref_materials"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "stock_repro_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "vw_drum_inventory"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "stock_repro_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "vw_stock_history_analysis"
            referencedColumns: ["material_code"]
          },
        ]
      }
    }
    Views: {
      chemical_class_groups: {
        Row: {
          groups: string | null
          materials: number | null
        }
        Relationships: []
      }
      product_source_material: {
        Row: {
          material: string | null
          product: string | null
          product_id: number | null
          raw_material_id: number | null
          sku: string | null
        }
        Relationships: []
      }
      product_table: {
        Row: {
          cas: string | null
          grade: string | null
          name: string | null
          sku: string | null
        }
        Relationships: []
      }
      stock_history_compatibility_view: {
        Row: {
          batch_code: string | null
          created_at: string | null
          date: string | null
          drum_ids: string | null
          drum_type: string | null
          id: number | null
          material_code: string | null
          quantity: number | null
          source_record_id: number | null
          supplier_id: number | null
          updated_at: string | null
        }
        Insert: {
          batch_code?: string | null
          created_at?: string | null
          date?: string | null
          drum_ids?: string | null
          drum_type?: string | null
          id?: number | null
          material_code?: string | null
          quantity?: number | null
          source_record_id?: number | null
          supplier_id?: number | null
          updated_at?: string | null
        }
        Update: {
          batch_code?: string | null
          created_at?: string | null
          date?: string | null
          drum_ids?: string | null
          drum_type?: string | null
          id?: number | null
          material_code?: string | null
          quantity?: number | null
          source_record_id?: number | null
          supplier_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_activity_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "ref_materials"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "stock_activity_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "vw_drum_inventory"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "stock_activity_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "vw_stock_history_analysis"
            referencedColumns: ["material_code"]
          },
          {
            foreignKeyName: "stock_activity_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "ref_suppliers"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      vw_drum_inventory: {
        Row: {
          ch_group: string | null
          code: string | null
          raw_drums: number | null
          repro_drums: number | null
          threshold: number | null
          value: string | null
        }
        Relationships: []
      }
      vw_material_consumption: {
        Row: {
          material_code: string | null
          material_name: string | null
          month: string | null
          monthly_quantity: number | null
          running_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_history_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "ref_materials"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "stock_history_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "vw_drum_inventory"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "stock_history_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "vw_stock_history_analysis"
            referencedColumns: ["material_code"]
          },
        ]
      }
      vw_order_history: {
        Row: {
          batch_code: string | null
          date_ordered: string | null
          drum_quantity: number | null
          material_description: string | null
          order_count: number | null
          order_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_order_details_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "stock_order"
            referencedColumns: ["order_id"]
          },
        ]
      }
      vw_pending_assignments: {
        Row: {
          assigned_distillation_id: number | null
          drum_id: number | null
          pending_id: number | null
          pending_time: unknown | null
          status: string | null
          transport_id: number | null
          transported_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distillation_pending_assignments_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "stock_drum"
            referencedColumns: ["drum_id"]
          },
        ]
      }
      vw_stock_history_analysis: {
        Row: {
          batch_code: string | null
          chemical_group: string | null
          date: string | null
          drum_ids: string | null
          drum_type: string | null
          id: number | null
          material_code: string | null
          material_name: string | null
          month: number | null
          quantity: number | null
          quarter: number | null
          supplier_name: string | null
          year: number | null
        }
        Relationships: []
      }
      vw_supplier_analysis: {
        Row: {
          incoming_transactions: number | null
          outgoing_transactions: number | null
          supplier_id: number | null
          supplier_name: string | null
          total_incoming: number | null
          total_outgoing: number | null
          total_transactions: number | null
          unique_materials: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_history_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "ref_suppliers"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
    }
    Functions: {
      add_to_repro_drum: {
        Args: {
          distillation_id: number
          repro_material: string
          volume_to_add: number
        }
        Returns: undefined
      }
      date_add: {
        Args: { arg1: string; arg2: unknown }
        Returns: string
      }
      mass_to_volume: {
        Args: { material_id: number; weight: number }
        Returns: number
      }
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
  inventory: {
    Enums: {
      drum_status: [
        "en_route",
        "in_stock",
        "pending_allocation",
        "allocated",
        "rescheduled",
        "decommissioned",
        "empty",
        "lost",
      ],
    },
  },
  public: {
    Enums: {},
  },
} as const
