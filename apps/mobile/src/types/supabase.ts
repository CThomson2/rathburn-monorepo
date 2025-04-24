export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  auth_ext: {
    Tables: {
      auth_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          token: string
          token_id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          token: string
          token_id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          token?: string
          token_id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mobile: {
        Row: {
          created_at: string | null
          failed_attempts: number | null
          id: string
          last_login: string | null
          locked_until: string | null
          passcode_hash: string
          passcode_salt: string
          updated_at: string | null
          user_name: string
        }
        Insert: {
          created_at?: string | null
          failed_attempts?: number | null
          id: string
          last_login?: string | null
          locked_until?: string | null
          passcode_hash: string
          passcode_salt: string
          updated_at?: string | null
          user_name: string
        }
        Update: {
          created_at?: string | null
          failed_attempts?: number | null
          id?: string
          last_login?: string | null
          locked_until?: string | null
          passcode_hash?: string
          passcode_salt?: string
          updated_at?: string | null
          user_name?: string
        }
        Relationships: []
      }
      session_settings: {
        Row: {
          created_at: string | null
          device_type: string
          id: string
          inactivity_timeout_seconds: number | null
          session_duration_seconds: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_type: string
          id?: string
          inactivity_timeout_seconds?: number | null
          session_duration_seconds: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_type?: string
          id?: string
          inactivity_timeout_seconds?: number | null
          session_duration_seconds?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      user_queries: {
        Row: {
          created_at: string | null
          execution_count: number | null
          filters: Json | null
          generated_sql: string | null
          id: string
          join_condition: Json | null
          join_table: string | null
          join_type: string | null
          last_executed_at: string | null
          query_name: string
          selected_columns: Json | null
          selected_table: string | null
          sorts: Json | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          execution_count?: number | null
          filters?: Json | null
          generated_sql?: string | null
          id?: string
          join_condition?: Json | null
          join_table?: string | null
          join_type?: string | null
          last_executed_at?: string | null
          query_name: string
          selected_columns?: Json | null
          selected_table?: string | null
          sorts?: Json | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          execution_count?: number | null
          filters?: Json | null
          generated_sql?: string | null
          id?: string
          join_condition?: Json | null
          join_table?: string | null
          join_type?: string | null
          last_executed_at?: string | null
          query_name?: string
          selected_columns?: Json | null
          selected_table?: string | null
          sorts?: Json | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      worker_passcodes: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          passcode: string
          role: string
          updated_at: string | null
          updated_by: string | null
          user_id: string
          worker_name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          passcode: string
          role: string
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
          worker_name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          passcode?: string
          role?: string
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
          worker_name?: string
        }
        Relationships: []
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
      action_type:
        | "context_get"
        | "context_set"
        | "transport"
        | "location_set"
        | "barcode_scan"
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
          action_type?: Database["inventory"]["Enums"]["action_type"]
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
  production: {
    Tables: {
      device_context: {
        Row: {
          context_id: string
          context_type: Database["production"]["Enums"]["context_type"]
          created_at: string
          device_id: string
          expires_at: string
        }
        Insert: {
          context_id: string
          context_type: Database["production"]["Enums"]["context_type"]
          created_at?: string
          device_id: string
          expires_at?: string
        }
        Update: {
          context_id?: string
          context_type?: Database["production"]["Enums"]["context_type"]
          created_at?: string
          device_id?: string
          expires_at?: string
        }
        Relationships: []
      }
      distillation_details: {
        Row: {
          details: Json | null
          expected_yield: number | null
          op_id: string
          raw_volume: number
          still_id: number
        }
        Insert: {
          details?: Json | null
          expected_yield?: number | null
          op_id: string
          raw_volume: number
          still_id: number
        }
        Update: {
          details?: Json | null
          expected_yield?: number | null
          op_id?: string
          raw_volume?: number
          still_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "distillation_details_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: true
            referencedRelation: "operations"
            referencedColumns: ["op_id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string
          input_batch_id: string
          item_id: string
          job_id: string
          planned_end: string | null
          planned_start: string | null
          priority: number
          status: Database["production"]["Enums"]["job_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          input_batch_id: string
          item_id: string
          job_id?: string
          planned_end?: string | null
          planned_start?: string | null
          priority?: number
          status?: Database["production"]["Enums"]["job_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          input_batch_id?: string
          item_id?: string
          job_id?: string
          planned_end?: string | null
          planned_start?: string | null
          priority?: number
          status?: Database["production"]["Enums"]["job_status"]
          updated_at?: string
        }
        Relationships: []
      }
      operation_drums: {
        Row: {
          assigned_at: string
          drum_id: string
          op_id: string
          scan_id: number
          volume_transferred: number
        }
        Insert: {
          assigned_at?: string
          drum_id: string
          op_id: string
          scan_id: number
          volume_transferred: number
        }
        Update: {
          assigned_at?: string
          drum_id?: string
          op_id?: string
          scan_id?: number
          volume_transferred?: number
        }
        Relationships: [
          {
            foreignKeyName: "operation_drums_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "operations"
            referencedColumns: ["op_id"]
          },
        ]
      }
      operations: {
        Row: {
          created_at: string
          ended_at: string | null
          job_id: string
          metadata: Json
          op_id: string
          op_type: Database["production"]["Enums"]["op_type"]
          scheduled_start: string | null
          started_at: string | null
          status: Database["production"]["Enums"]["op_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          job_id: string
          metadata?: Json
          op_id?: string
          op_type: Database["production"]["Enums"]["op_type"]
          scheduled_start?: string | null
          started_at?: string | null
          status?: Database["production"]["Enums"]["op_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          job_id?: string
          metadata?: Json
          op_id?: string
          op_type?: Database["production"]["Enums"]["op_type"]
          scheduled_start?: string | null
          started_at?: string | null
          status?: Database["production"]["Enums"]["op_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["job_id"]
          },
        ]
      }
      orders: {
        Row: {
          code: string
          created_at: string
          item_id: string
          order_id: string
          quantity: number
          scheduled_end: string | null
          scheduled_start: string | null
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          item_id: string
          order_id?: string
          quantity: number
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          item_id?: string
          order_id?: string
          quantity?: number
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string
        }
        Relationships: []
      }
      qc_results: {
        Row: {
          grade: Database["production"]["Enums"]["qc_grade"]
          metadata: Json | null
          op_id: string
          qc_id: string
          tested_at: string
          volume: number
        }
        Insert: {
          grade: Database["production"]["Enums"]["qc_grade"]
          metadata?: Json | null
          op_id: string
          qc_id?: string
          tested_at?: string
          volume: number
        }
        Update: {
          grade?: Database["production"]["Enums"]["qc_grade"]
          metadata?: Json | null
          op_id?: string
          qc_id?: string
          tested_at?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "qc_results_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "operations"
            referencedColumns: ["op_id"]
          },
        ]
      }
      split_operations: {
        Row: {
          created_at: string
          metadata: Json | null
          parent_op_id: string
          split_id: string
        }
        Insert: {
          created_at?: string
          metadata?: Json | null
          parent_op_id: string
          split_id?: string
        }
        Update: {
          created_at?: string
          metadata?: Json | null
          parent_op_id?: string
          split_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_operations_parent_op_id_fkey"
            columns: ["parent_op_id"]
            isOneToOne: false
            referencedRelation: "operations"
            referencedColumns: ["op_id"]
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
      context_type: "distillation" | "warehouse"
      job_status:
        | "scheduled"
        | "confirmed"
        | "in_progress"
        | "paused"
        | "completed"
        | "failed"
        | "cancelled"
      op_status: "pending" | "active" | "completed" | "error"
      op_type: "distillation" | "decanting" | "qc" | "split" | "packaging"
      qc_grade:
        | "HPLC"
        | "LCMS"
        | "GlassDist"
        | "HPLC S"
        | "PeptideSynth"
        | "FailedSpec"
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
      create_mobile_app_passcode: {
        Args: { p_user_name: string; p_passcode: string; p_user_id: string }
        Returns: string
      }
      create_user_with_passcode: {
        Args: { p_email: string; p_user_name: string; p_passcode: string }
        Returns: string
      }
      request_passcode_reset: {
        Args: { p_user_name: string }
        Returns: boolean
      }
      reset_passcode_with_token: {
        Args: { p_token: string; p_new_passcode: string }
        Returns: boolean
      }
      validate_passcode: {
        Args: { p_user_name: string; p_passcode: string }
        Returns: Json
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
  auth_ext: {
    Enums: {},
  },
  config: {
    Enums: {},
  },
  inventory: {
    Enums: {
      action_type: [
        "context_get",
        "context_set",
        "transport",
        "location_set",
        "barcode_scan",
      ],
      batch_type: ["new", "repro"],
      drum_status: ["in_stock", "reserved", "in_production", "empty", "lost"],
    },
  },
  logs: {
    Enums: {},
  },
  production: {
    Enums: {
      context_type: ["distillation", "warehouse"],
      job_status: [
        "scheduled",
        "confirmed",
        "in_progress",
        "paused",
        "completed",
        "failed",
        "cancelled",
      ],
      op_status: ["pending", "active", "completed", "error"],
      op_type: ["distillation", "decanting", "qc", "split", "packaging"],
      qc_grade: [
        "HPLC",
        "LCMS",
        "GlassDist",
        "HPLC S",
        "PeptideSynth",
        "FailedSpec",
      ],
    },
  },
  public: {
    Enums: {},
  },
} as const
