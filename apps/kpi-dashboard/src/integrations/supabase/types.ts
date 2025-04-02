export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      active_context: {
        Row: {
          context_id: number
          created_at: string | null
          still_id: number | null
          worker_id: number | null
        }
        Insert: {
          context_id?: number
          created_at?: string | null
          still_id?: number | null
          worker_id?: number | null
        }
        Update: {
          context_id?: number
          created_at?: string | null
          still_id?: number | null
          worker_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "active_context_still_id_fkey"
            columns: ["still_id"]
            isOneToOne: false
            referencedRelation: "ref_stills"
            referencedColumns: ["still_id"]
          },
          {
            foreignKeyName: "active_context_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      auth_activity_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      bottle_sizes: {
        Row: {
          id: number
          volume: string
        }
        Insert: {
          id?: number
          volume: string
        }
        Update: {
          id?: number
          volume?: string
        }
        Relationships: []
      }
      chemical_group_kind: {
        Row: {
          value: string
        }
        Insert: {
          value: string
        }
        Update: {
          value?: string
        }
        Relationships: []
      }
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
            foreignKeyName: "distillation_pending_assignments_assigned_distillation_id_fkey"
            columns: ["assigned_distillation_id"]
            isOneToOne: false
            referencedRelation: "distillation_schedule"
            referencedColumns: ["distillation_id"]
          },
          {
            foreignKeyName: "distillation_pending_assignments_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "stock_drum"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "distillation_pending_assignments_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "vw_goods_inwards"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "distillation_pending_assignments_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "vw_order_drum_details"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "distillation_pending_assignments_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "vw_recent_order_details"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "distillation_pending_assignments_transport_id_fkey"
            columns: ["transport_id"]
            isOneToOne: false
            referencedRelation: "log_transport_drum"
            referencedColumns: ["transport_id"]
          },
        ]
      }
      distillation_record: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          distillation_id: number | null
          notes: string | null
          record_id: number
          status: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          distillation_id?: number | null
          notes?: string | null
          record_id?: number
          status?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          distillation_id?: number | null
          notes?: string | null
          record_id?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distillation_records_distillation_id_fkey"
            columns: ["distillation_id"]
            isOneToOne: true
            referencedRelation: "distillation_schedule"
            referencedColumns: ["distillation_id"]
          },
        ]
      }
      distillation_schedule: {
        Row: {
          created_at: string | null
          distillation_id: number
          expected_drum_qty: number
          scheduled_date: string
          status: string | null
          still_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          distillation_id?: never
          expected_drum_qty?: number
          scheduled_date: string
          status?: string | null
          still_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          distillation_id?: never
          expected_drum_qty?: number
          scheduled_date?: string
          status?: string | null
          still_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distillation_schedules_still_id_fkey"
            columns: ["still_id"]
            isOneToOne: false
            referencedRelation: "ref_stills"
            referencedColumns: ["still_id"]
          },
        ]
      }
      distillation_schedule_items: {
        Row: {
          created_at: string | null
          details_id: number
          distillation_id: number
          drum_quantity: number
          new_stock_id: number | null
          repro_stock_id: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          details_id?: never
          distillation_id: number
          drum_quantity: number
          new_stock_id?: number | null
          repro_stock_id?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          details_id?: never
          distillation_id?: number
          drum_quantity?: number
          new_stock_id?: number | null
          repro_stock_id?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distillation_schedules_details_distillation_id_fkey"
            columns: ["distillation_id"]
            isOneToOne: false
            referencedRelation: "distillation_schedule"
            referencedColumns: ["distillation_id"]
          },
          {
            foreignKeyName: "distillation_schedules_details_new_stock_id_fkey"
            columns: ["new_stock_id"]
            isOneToOne: false
            referencedRelation: "stock_new"
            referencedColumns: ["stock_id"]
          },
          {
            foreignKeyName: "distillation_schedules_details_repro_stock_id_fkey"
            columns: ["repro_stock_id"]
            isOneToOne: false
            referencedRelation: "stock_repro"
            referencedColumns: ["stock_id"]
          },
        ]
      }
      drum_status_transition: {
        Row: {
          current_status:
            | "en_route"
            | "in_stock"
            | "pending_allocation"
            | "allocated"
            | "rescheduled"
            | "decommissioned"
            | "empty"
            | "lost"
          next_status:
            | "en_route"
            | "in_stock"
            | "pending_allocation"
            | "allocated"
            | "rescheduled"
            | "decommissioned"
            | "empty"
            | "lost"
          requires_admin: boolean | null
          requires_reason: boolean | null
        }
        Insert: {
          current_status:
            | "en_route"
            | "in_stock"
            | "pending_allocation"
            | "allocated"
            | "rescheduled"
            | "decommissioned"
            | "empty"
            | "lost"
          next_status:
            | "en_route"
            | "in_stock"
            | "pending_allocation"
            | "allocated"
            | "rescheduled"
            | "decommissioned"
            | "empty"
            | "lost"
          requires_admin?: boolean | null
          requires_reason?: boolean | null
        }
        Update: {
          current_status?:
            | "en_route"
            | "in_stock"
            | "pending_allocation"
            | "allocated"
            | "rescheduled"
            | "decommissioned"
            | "empty"
            | "lost"
          next_status?:
            | "en_route"
            | "in_stock"
            | "pending_allocation"
            | "allocated"
            | "rescheduled"
            | "decommissioned"
            | "empty"
            | "lost"
          requires_admin?: boolean | null
          requires_reason?: boolean | null
        }
        Relationships: []
      }
      drums: {
        Row: {
          batch_code: string | null
          created_at: string
          date_ordered: string | null
          id: number
          material: string
          old_id: number
          site: string
          status: string
          supplier: string | null
          updated_at: string | null
        }
        Insert: {
          batch_code?: string | null
          created_at?: string
          date_ordered?: string | null
          id?: number
          material?: string
          old_id: number
          site?: string
          status?: string
          supplier?: string | null
          updated_at?: string | null
        }
        Update: {
          batch_code?: string | null
          created_at?: string
          date_ordered?: string | null
          id?: number
          material?: string
          old_id?: number
          site?: string
          status?: string
          supplier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          employee_id: number
          first_name: string
          initials: string | null
          last_name: string | null
          middle_names: string | null
        }
        Insert: {
          employee_id?: never
          first_name: string
          initials?: string | null
          last_name?: string | null
          middle_names?: string | null
        }
        Update: {
          employee_id?: never
          first_name?: string
          initials?: string | null
          last_name?: string | null
          middle_names?: string | null
        }
        Relationships: []
      }
      log_drum_decommission: {
        Row: {
          decommission_id: number
          decommissioned_at: string | null
          drum_id: number
          worker_id: number | null
        }
        Insert: {
          decommission_id?: never
          decommissioned_at?: string | null
          drum_id: number
          worker_id?: number | null
        }
        Update: {
          decommission_id?: never
          decommissioned_at?: string | null
          drum_id?: number
          worker_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "log_drum_decommission_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      log_drum_scan: {
        Row: {
          drum_id: number | null
          error_message: string | null
          scan_id: number
          scan_status: string
          scan_type: string
          scanned_at: string | null
          worker_id: number
        }
        Insert: {
          drum_id?: number | null
          error_message?: string | null
          scan_id?: number
          scan_status?: string
          scan_type: string
          scanned_at?: string | null
          worker_id?: number
        }
        Update: {
          drum_id?: number | null
          error_message?: string | null
          scan_id?: number
          scan_status?: string
          scan_type?: string
          scanned_at?: string | null
          worker_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "scan_log_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "stock_drum"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "scan_log_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "vw_goods_inwards"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "scan_log_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "vw_order_drum_details"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "scan_log_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "vw_recent_order_details"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "scan_log_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      log_load_still: {
        Row: {
          distillation_id: number
          drum_id: number | null
          loading_id: number
          scan_id: number | null
          status: string | null
          still_id: number | null
        }
        Insert: {
          distillation_id: number
          drum_id?: number | null
          loading_id?: number
          scan_id?: number | null
          status?: string | null
          still_id?: number | null
        }
        Update: {
          distillation_id?: number
          drum_id?: number | null
          loading_id?: number
          scan_id?: number | null
          status?: string | null
          still_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "distillation_loading_log_distillation_id_fkey"
            columns: ["distillation_id"]
            isOneToOne: false
            referencedRelation: "distillation_schedule"
            referencedColumns: ["distillation_id"]
          },
          {
            foreignKeyName: "distillation_loading_log_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "stock_drum"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "distillation_loading_log_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "vw_goods_inwards"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "distillation_loading_log_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "vw_order_drum_details"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "distillation_loading_log_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "vw_recent_order_details"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "distillation_loading_log_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: true
            referencedRelation: "log_drum_scan"
            referencedColumns: ["scan_id"]
          },
          {
            foreignKeyName: "distillation_loading_log_still_id_fkey"
            columns: ["still_id"]
            isOneToOne: false
            referencedRelation: "ref_stills"
            referencedColumns: ["still_id"]
          },
        ]
      }
      log_start_distillation: {
        Row: {
          distillation_id: number | null
          start_id: number
          status: string | null
          still_id: number
          worker_id: number | null
        }
        Insert: {
          distillation_id?: number | null
          start_id?: number
          status?: string | null
          still_id: number
          worker_id?: number | null
        }
        Update: {
          distillation_id?: number | null
          start_id?: number
          status?: string | null
          still_id?: number
          worker_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "distillation_start_log_distillation_id_fkey"
            columns: ["distillation_id"]
            isOneToOne: true
            referencedRelation: "distillation_schedule"
            referencedColumns: ["distillation_id"]
          },
          {
            foreignKeyName: "distillation_start_log_still_id_fkey"
            columns: ["still_id"]
            isOneToOne: false
            referencedRelation: "ref_stills"
            referencedColumns: ["still_id"]
          },
          {
            foreignKeyName: "distillation_start_log_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      log_transport_drum: {
        Row: {
          distillation_id: number | null
          drum_id: number | null
          scan_id: number | null
          status: string | null
          transport_id: number
          transported_at: string | null
        }
        Insert: {
          distillation_id?: number | null
          drum_id?: number | null
          scan_id?: number | null
          status?: string | null
          transport_id?: number
          transported_at?: string | null
        }
        Update: {
          distillation_id?: number | null
          drum_id?: number | null
          scan_id?: number | null
          status?: string | null
          transport_id?: number
          transported_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distillation_transport_log_distillation_id_fkey"
            columns: ["distillation_id"]
            isOneToOne: false
            referencedRelation: "distillation_schedule"
            referencedColumns: ["distillation_id"]
          },
          {
            foreignKeyName: "distillation_transport_log_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "stock_drum"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "distillation_transport_log_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "vw_goods_inwards"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "distillation_transport_log_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "vw_order_drum_details"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "distillation_transport_log_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "vw_recent_order_details"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "distillation_transport_log_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: true
            referencedRelation: "log_drum_scan"
            referencedColumns: ["scan_id"]
          },
        ]
      }
      log_volume_transfer: {
        Row: {
          distillation_id: number
          drum_id: number
          remaining_volume: number
          transfer_id: number
          transfer_timestamp: string | null
          usage_type: string
          volume_transferred: number
          worker_id: number | null
        }
        Insert: {
          distillation_id: number
          drum_id: number
          remaining_volume: number
          transfer_id?: never
          transfer_timestamp?: string | null
          usage_type: string
          volume_transferred: number
          worker_id?: number | null
        }
        Update: {
          distillation_id?: number
          drum_id?: number
          remaining_volume?: number
          transfer_id?: never
          transfer_timestamp?: string | null
          usage_type?: string
          volume_transferred?: number
          worker_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "log_volume_transfers_distillation_id_fkey"
            columns: ["distillation_id"]
            isOneToOne: false
            referencedRelation: "distillation_schedule"
            referencedColumns: ["distillation_id"]
          },
          {
            foreignKeyName: "log_volume_transfers_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "stock_drum"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "log_volume_transfers_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "vw_goods_inwards"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "log_volume_transfers_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "vw_order_drum_details"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "log_volume_transfers_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "vw_recent_order_details"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "log_volume_transfers_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      notification: {
        Row: {
          audience_type: string
          created_at: string
          created_by: string
          expires_at: string | null
          is_read: boolean
          message: string
          message_type: string
          notification_id: number
          private: boolean
        }
        Insert: {
          audience_type?: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          is_read?: boolean
          message: string
          message_type?: string
          notification_id?: never
          private?: boolean
        }
        Update: {
          audience_type?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          is_read?: boolean
          message?: string
          message_type?: string
          notification_id?: never
          private?: boolean
        }
        Relationships: []
      }
      order_detail: {
        Row: {
          batch_code: string | null
          detail_id: number
          drum_quantity: number
          drum_volume: number | null
          drum_weight: number | null
          material_id: number
          material_name: string
          notes: string | null
          order_id: number
          status: string
        }
        Insert: {
          batch_code?: string | null
          detail_id?: number
          drum_quantity: number
          drum_volume?: number | null
          drum_weight?: number | null
          material_id: number
          material_name: string
          notes?: string | null
          order_id: number
          status?: string
        }
        Update: {
          batch_code?: string | null
          detail_id?: number
          drum_quantity?: number
          drum_volume?: number | null
          drum_weight?: number | null
          material_id?: number
          material_name?: string
          notes?: string | null
          order_id?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_order_details_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "product_source_material"
            referencedColumns: ["raw_material_id"]
          },
          {
            foreignKeyName: "stock_order_details_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["material_id"]
          },
          {
            foreignKeyName: "stock_order_details_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "stock_order"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "stock_order_details_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_goods_inwards"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "stock_order_details_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_recent_order_details"
            referencedColumns: ["order_id"]
          },
        ]
      }
      product_prices: {
        Row: {
          bottle_size_id: number
          price: number
          product_id: number
        }
        Insert: {
          bottle_size_id: number
          price: number
          product_id: number
        }
        Update: {
          bottle_size_id?: number
          price?: number
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_bottle_size"
            columns: ["bottle_size_id"]
            isOneToOne: false
            referencedRelation: "bottle_sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_source_material"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "fk_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      products: {
        Row: {
          grade: string
          name: string
          product_id: number
          raw_material_id: number | null
          sku: string
        }
        Insert: {
          grade: string
          name: string
          product_id?: number
          raw_material_id?: number | null
          sku: string
        }
        Update: {
          grade?: string
          name?: string
          product_id?: number
          raw_material_id?: number | null
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_raw_material"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "product_source_material"
            referencedColumns: ["raw_material_id"]
          },
          {
            foreignKeyName: "fk_raw_material"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["material_id"]
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
          chemical_group: string
          code: string
          value: string
        }
        Insert: {
          chemical_group: string
          code: string
          value: string
        }
        Update: {
          chemical_group?: string
          code?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_kind_chemical_group_fkey"
            columns: ["chemical_group"]
            isOneToOne: false
            referencedRelation: "chemical_group_kind"
            referencedColumns: ["value"]
          },
        ]
      }
      ref_stills: {
        Row: {
          description: string | null
          is_operational: boolean
          is_vacuum: boolean
          lab_id: number
          max_capacity: number
          power_rating_kw: number
          still_code: string
          still_id: number
        }
        Insert: {
          description?: string | null
          is_operational: boolean
          is_vacuum: boolean
          lab_id: number
          max_capacity: number
          power_rating_kw: number
          still_code: string
          still_id?: never
        }
        Update: {
          description?: string | null
          is_operational?: boolean
          is_vacuum?: boolean
          lab_id?: number
          max_capacity?: number
          power_rating_kw?: number
          still_code?: string
          still_id?: never
        }
        Relationships: []
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
      stock_drum: {
        Row: {
          created_at: string | null
          distillation_id: number | null
          drum_id: number
          drum_type: string
          fill_level: number | null
          material: string | null
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
          material?: string | null
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
          material?: string | null
          order_detail_id?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_drum_distillation_id_fkey"
            columns: ["distillation_id"]
            isOneToOne: false
            referencedRelation: "distillation_record"
            referencedColumns: ["record_id"]
          },
          {
            foreignKeyName: "stock_drum_material_fkey"
            columns: ["material"]
            isOneToOne: false
            referencedRelation: "ref_materials"
            referencedColumns: ["value"]
          },
          {
            foreignKeyName: "stock_drums_order_detail_id_fkey"
            columns: ["order_detail_id"]
            isOneToOne: false
            referencedRelation: "order_detail"
            referencedColumns: ["detail_id"]
          },
          {
            foreignKeyName: "stock_drums_order_detail_id_fkey"
            columns: ["order_detail_id"]
            isOneToOne: false
            referencedRelation: "vw_goods_inwards"
            referencedColumns: ["detail_id"]
          },
        ]
      }
      stock_new: {
        Row: {
          batch_code: string
          created_at: string | null
          location: string | null
          material_id: number | null
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
          material_id?: number | null
          notes?: string | null
          quantity: number
          stock_id?: never
          supplier_id?: number | null
          updated_at?: string | null
        }
        Update: {
          batch_code?: string
          created_at?: string | null
          location?: string | null
          material_id?: number | null
          notes?: string | null
          quantity?: number
          stock_id?: never
          supplier_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_new_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "product_source_material"
            referencedColumns: ["raw_material_id"]
          },
          {
            foreignKeyName: "stock_new_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["material_id"]
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
          material_description: string | null
          material_id: number | null
          notes: string | null
          quantity: number
          stock_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          location: string
          material_description?: string | null
          material_id?: number | null
          notes?: string | null
          quantity: number
          stock_id?: never
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          location?: string
          material_description?: string | null
          material_id?: number | null
          notes?: string | null
          quantity?: number
          stock_id?: never
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_repro_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "product_source_material"
            referencedColumns: ["raw_material_id"]
          },
          {
            foreignKeyName: "stock_repro_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["material_id"]
          },
        ]
      }
      supplier_material: {
        Row: {
          location: string
          material_id: number
          material_name: string
          quantity: number
          supplier_id: number | null
          updated_at: string | null
        }
        Insert: {
          location: string
          material_id: number
          material_name: string
          quantity: number
          supplier_id?: number | null
          updated_at?: string | null
        }
        Update: {
          location?: string
          material_id?: number
          material_name?: string
          quantity?: number
          supplier_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: true
            referencedRelation: "product_source_material"
            referencedColumns: ["raw_material_id"]
          },
          {
            foreignKeyName: "stock_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: true
            referencedRelation: "raw_materials"
            referencedColumns: ["material_id"]
          },
          {
            foreignKeyName: "stock_materials_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "product_source_material"
            referencedColumns: ["raw_material_id"]
          },
          {
            foreignKeyName: "stock_materials_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["material_id"]
          },
        ]
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
      chemical_class_groups: {
        Row: {
          groups: string | null
          materials: number | null
        }
        Relationships: []
      }
      drum_order_details: {
        Row: {
          batch_code: string | null
          date_processed: string | null
          delivery_id: number | null
          delivery_status: string | null
          drum_id: number | null
          drum_status: string | null
          material: string | null
          order_id: number | null
          qty_ordered: number | null
          qty_received: number | null
          supplier: string | null
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
      raw_drum_archives: {
        Row: {
          created_at: string | null
          date_processed: string | null
          drum_id: number | null
          location: string | null
          material: string | null
          order_id: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_processed?: string | null
          drum_id?: number | null
          location?: string | null
          material?: string | null
          order_id?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_processed?: string | null
          drum_id?: number | null
          location?: string | null
          material?: string | null
          order_id?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "new_drums_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "drum_order_details"
            referencedColumns: ["order_id"]
          },
        ]
      }
      vw_active_drums: {
        Row: {
          created_at: string | null
          date_processed: string | null
          drum_id: number | null
          location: string | null
          material: string | null
          order_id: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_processed?: string | null
          drum_id?: number | null
          location?: string | null
          material?: string | null
          order_id?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_processed?: string | null
          drum_id?: number | null
          location?: string | null
          material?: string | null
          order_id?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "new_drums_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "drum_order_details"
            referencedColumns: ["order_id"]
          },
        ]
      }
      vw_current_inventory: {
        Row: {
          available_drums: number | null
          material: string | null
          scheduled_drums: number | null
          total_drums: number | null
        }
        Relationships: []
      }
      vw_goods_inwards: {
        Row: {
          batch: string | null
          date_ordered: string | null
          detail_id: number | null
          drum_id: number | null
          material: string | null
          order_id: number | null
          order_status: string | null
          po_number: string | null
          qty: number | null
          status: string | null
          supplier_name: string | null
        }
        Relationships: []
      }
      vw_order_drum_details: {
        Row: {
          batch_code: string | null
          date_ordered: string | null
          drum_id: number | null
          drum_quantity: number | null
          material_name: string | null
          supplier_name: string | null
        }
        Relationships: []
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
          {
            foreignKeyName: "stock_order_details_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_goods_inwards"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "stock_order_details_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_recent_order_details"
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
            foreignKeyName: "distillation_pending_assignments_assigned_distillation_id_fkey"
            columns: ["assigned_distillation_id"]
            isOneToOne: false
            referencedRelation: "distillation_schedule"
            referencedColumns: ["distillation_id"]
          },
          {
            foreignKeyName: "distillation_pending_assignments_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "stock_drum"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "distillation_pending_assignments_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "vw_goods_inwards"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "distillation_pending_assignments_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "vw_order_drum_details"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "distillation_pending_assignments_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "vw_recent_order_details"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "distillation_pending_assignments_transport_id_fkey"
            columns: ["transport_id"]
            isOneToOne: false
            referencedRelation: "log_transport_drum"
            referencedColumns: ["transport_id"]
          },
        ]
      }
      vw_recent_order_details: {
        Row: {
          batch_code: string | null
          drum_id: number | null
          drum_quantity: number | null
          material: string | null
          material_id: number | null
          order_detail_id: number | null
          order_id: number | null
          status: string | null
          supplier_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_drums_order_detail_id_fkey"
            columns: ["order_detail_id"]
            isOneToOne: false
            referencedRelation: "order_detail"
            referencedColumns: ["detail_id"]
          },
          {
            foreignKeyName: "stock_drums_order_detail_id_fkey"
            columns: ["order_detail_id"]
            isOneToOne: false
            referencedRelation: "vw_goods_inwards"
            referencedColumns: ["detail_id"]
          },
          {
            foreignKeyName: "stock_order_details_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "product_source_material"
            referencedColumns: ["raw_material_id"]
          },
          {
            foreignKeyName: "stock_order_details_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["material_id"]
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
        Args: {
          arg1: string
          arg2: unknown
        }
        Returns: string
      }
      mass_to_volume: {
        Args: {
          material_id: number
          weight: number
        }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
