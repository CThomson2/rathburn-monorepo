export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
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
      active_context: {
        Row: {
          context_id: number;
          created_at: string | null;
          still_id: number | null;
          worker_id: number | null;
        };
        Insert: {
          context_id?: number;
          created_at?: string | null;
          still_id?: number | null;
          worker_id?: number | null;
        };
        Update: {
          context_id?: number;
          created_at?: string | null;
          still_id?: number | null;
          worker_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "active_context_still_id_fkey";
            columns: ["still_id"];
            isOneToOne: false;
            referencedRelation: "ref_stills";
            referencedColumns: ["still_id"];
          },
        ];
      };
      auth_activity_log: {
        Row: {
          action: string;
          created_at: string | null;
          id: string;
          ip_address: string | null;
          metadata: Json | null;
          user_id: string;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          user_id: string;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          user_id?: string;
        };
        Relationships: [];
      };
      bottle_sizes: {
        Row: {
          id: number;
          volume: string;
        };
        Insert: {
          id?: number;
          volume: string;
        };
        Update: {
          id?: number;
          volume?: string;
        };
        Relationships: [];
      };
      chemical_group_kind: {
        Row: {
          value: string;
        };
        Insert: {
          value: string;
        };
        Update: {
          value?: string;
        };
        Relationships: [];
      };
      distillation_pending_assignment: {
        Row: {
          assigned_distillation_id: number | null;
          drum_id: number | null;
          pending_id: number;
          status: string | null;
          transport_id: number;
        };
        Insert: {
          assigned_distillation_id?: number | null;
          drum_id?: number | null;
          pending_id?: number;
          status?: string | null;
          transport_id: number;
        };
        Update: {
          assigned_distillation_id?: number | null;
          drum_id?: number | null;
          pending_id?: number;
          status?: string | null;
          transport_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "distillation_pending_assignments_assigned_distillation_id_fkey";
            columns: ["assigned_distillation_id"];
            isOneToOne: false;
            referencedRelation: "distillation_schedule";
            referencedColumns: ["distillation_id"];
          },
          {
            foreignKeyName: "distillation_pending_assignments_drum_id_fkey";
            columns: ["drum_id"];
            isOneToOne: false;
            referencedRelation: "stock_drum";
            referencedColumns: ["drum_id"];
          },
          {
            foreignKeyName: "distillation_pending_assignments_transport_id_fkey";
            columns: ["transport_id"];
            isOneToOne: false;
            referencedRelation: "log_transport_drum";
            referencedColumns: ["transport_id"];
          },
        ];
      };
      distillation_record: {
        Row: {
          actual_end: string | null;
          actual_start: string | null;
          distillation_id: number | null;
          notes: string | null;
          record_id: number;
          status: string | null;
        };
        Insert: {
          actual_end?: string | null;
          actual_start?: string | null;
          distillation_id?: number | null;
          notes?: string | null;
          record_id?: number;
          status?: string | null;
        };
        Update: {
          actual_end?: string | null;
          actual_start?: string | null;
          distillation_id?: number | null;
          notes?: string | null;
          record_id?: number;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "distillation_records_distillation_id_fkey";
            columns: ["distillation_id"];
            isOneToOne: true;
            referencedRelation: "distillation_schedule";
            referencedColumns: ["distillation_id"];
          },
        ];
      };
      distillation_schedule: {
        Row: {
          created_at: string | null;
          distillation_id: number;
          expected_drum_qty: number;
          scheduled_date: string;
          status: string | null;
          still_id: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          distillation_id?: never;
          expected_drum_qty?: number;
          scheduled_date: string;
          status?: string | null;
          still_id: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          distillation_id?: never;
          expected_drum_qty?: number;
          scheduled_date?: string;
          status?: string | null;
          still_id?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "distillation_schedules_still_id_fkey";
            columns: ["still_id"];
            isOneToOne: false;
            referencedRelation: "ref_stills";
            referencedColumns: ["still_id"];
          },
        ];
      };
      distillation_schedule_items: {
        Row: {
          created_at: string | null;
          details_id: number;
          distillation_id: number;
          drum_quantity: number;
          new_stock_id: number | null;
          repro_stock_id: number | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          details_id?: never;
          distillation_id: number;
          drum_quantity: number;
          new_stock_id?: number | null;
          repro_stock_id?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          details_id?: never;
          distillation_id?: number;
          drum_quantity?: number;
          new_stock_id?: number | null;
          repro_stock_id?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "distillation_schedules_details_distillation_id_fkey";
            columns: ["distillation_id"];
            isOneToOne: false;
            referencedRelation: "distillation_schedule";
            referencedColumns: ["distillation_id"];
          },
          {
            foreignKeyName: "distillation_schedules_details_new_stock_id_fkey";
            columns: ["new_stock_id"];
            isOneToOne: false;
            referencedRelation: "stock_new";
            referencedColumns: ["stock_id"];
          },
          {
            foreignKeyName: "distillation_schedules_details_repro_stock_id_fkey";
            columns: ["repro_stock_id"];
            isOneToOne: false;
            referencedRelation: "stock_repro";
            referencedColumns: ["stock_id"];
          },
        ];
      };
      drum_status_transition: {
        Row: {
          current_status: Database["inventory"]["Enums"]["drum_status"];
          next_status: Database["inventory"]["Enums"]["drum_status"];
          requires_admin: boolean | null;
          requires_reason: boolean | null;
        };
        Insert: {
          current_status: Database["inventory"]["Enums"]["drum_status"];
          next_status: Database["inventory"]["Enums"]["drum_status"];
          requires_admin?: boolean | null;
          requires_reason?: boolean | null;
        };
        Update: {
          current_status?: Database["inventory"]["Enums"]["drum_status"];
          next_status?: Database["inventory"]["Enums"]["drum_status"];
          requires_admin?: boolean | null;
          requires_reason?: boolean | null;
        };
        Relationships: [];
      };
      drums: {
        Row: {
          batch_code: string | null;
          chemical_group: string | null;
          created_at: string;
          date_ordered: string | null;
          id: number;
          material: string;
          material_code: string;
          old_id: number;
          site: string;
          status: string;
          supplier: string | null;
          updated_at: string | null;
        };
        Insert: {
          batch_code?: string | null;
          chemical_group?: string | null;
          created_at?: string;
          date_ordered?: string | null;
          id?: number;
          material?: string;
          material_code: string;
          old_id: number;
          site?: string;
          status?: string;
          supplier?: string | null;
          updated_at?: string | null;
        };
        Update: {
          batch_code?: string | null;
          chemical_group?: string | null;
          created_at?: string;
          date_ordered?: string | null;
          id?: number;
          material?: string;
          material_code?: string;
          old_id?: number;
          site?: string;
          status?: string;
          supplier?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      log_drum_decommission: {
        Row: {
          decommission_id: number;
          decommissioned_at: string | null;
          drum_id: number;
          worker_id: number | null;
        };
        Insert: {
          decommission_id?: number;
          decommissioned_at?: string | null;
          drum_id: number;
          worker_id?: number | null;
        };
        Update: {
          decommission_id?: number;
          decommissioned_at?: string | null;
          drum_id?: number;
          worker_id?: number | null;
        };
        Relationships: [];
      };
      log_drum_scan: {
        Row: {
          drum_id: number | null;
          error_message: string | null;
          scan_id: number;
          scan_status: string;
          scan_type: string;
          scanned_at: string | null;
          user_id: number;
        };
        Insert: {
          drum_id?: number | null;
          error_message?: string | null;
          scan_id?: number;
          scan_status?: string;
          scan_type: string;
          scanned_at?: string | null;
          user_id?: number;
        };
        Update: {
          drum_id?: number | null;
          error_message?: string | null;
          scan_id?: number;
          scan_status?: string;
          scan_type?: string;
          scanned_at?: string | null;
          user_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "scan_log_drum_id_fkey";
            columns: ["drum_id"];
            isOneToOne: false;
            referencedRelation: "stock_drum";
            referencedColumns: ["drum_id"];
          },
        ];
      };
      log_load_still: {
        Row: {
          distillation_id: number;
          drum_id: number | null;
          loading_id: number;
          scan_id: number | null;
          status: string | null;
          still_id: number | null;
        };
        Insert: {
          distillation_id: number;
          drum_id?: number | null;
          loading_id?: number;
          scan_id?: number | null;
          status?: string | null;
          still_id?: number | null;
        };
        Update: {
          distillation_id?: number;
          drum_id?: number | null;
          loading_id?: number;
          scan_id?: number | null;
          status?: string | null;
          still_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "distillation_loading_log_distillation_id_fkey";
            columns: ["distillation_id"];
            isOneToOne: false;
            referencedRelation: "distillation_schedule";
            referencedColumns: ["distillation_id"];
          },
          {
            foreignKeyName: "distillation_loading_log_drum_id_fkey";
            columns: ["drum_id"];
            isOneToOne: false;
            referencedRelation: "stock_drum";
            referencedColumns: ["drum_id"];
          },
          {
            foreignKeyName: "distillation_loading_log_scan_id_fkey";
            columns: ["scan_id"];
            isOneToOne: true;
            referencedRelation: "log_drum_scan";
            referencedColumns: ["scan_id"];
          },
          {
            foreignKeyName: "distillation_loading_log_still_id_fkey";
            columns: ["still_id"];
            isOneToOne: false;
            referencedRelation: "ref_stills";
            referencedColumns: ["still_id"];
          },
        ];
      };
      log_start_distillation: {
        Row: {
          distillation_id: number | null;
          start_id: number;
          status: string | null;
          still_id: number;
          worker_id: number | null;
        };
        Insert: {
          distillation_id?: number | null;
          start_id?: number;
          status?: string | null;
          still_id: number;
          worker_id?: number | null;
        };
        Update: {
          distillation_id?: number | null;
          start_id?: number;
          status?: string | null;
          still_id?: number;
          worker_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "distillation_start_log_distillation_id_fkey";
            columns: ["distillation_id"];
            isOneToOne: true;
            referencedRelation: "distillation_schedule";
            referencedColumns: ["distillation_id"];
          },
          {
            foreignKeyName: "distillation_start_log_still_id_fkey";
            columns: ["still_id"];
            isOneToOne: false;
            referencedRelation: "ref_stills";
            referencedColumns: ["still_id"];
          },
        ];
      };
      log_transport_drum: {
        Row: {
          distillation_id: number | null;
          drum_id: number | null;
          scan_id: number | null;
          status: string | null;
          transport_id: number;
          transported_at: string | null;
        };
        Insert: {
          distillation_id?: number | null;
          drum_id?: number | null;
          scan_id?: number | null;
          status?: string | null;
          transport_id?: number;
          transported_at?: string | null;
        };
        Update: {
          distillation_id?: number | null;
          drum_id?: number | null;
          scan_id?: number | null;
          status?: string | null;
          transport_id?: number;
          transported_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "distillation_transport_log_distillation_id_fkey";
            columns: ["distillation_id"];
            isOneToOne: false;
            referencedRelation: "distillation_schedule";
            referencedColumns: ["distillation_id"];
          },
          {
            foreignKeyName: "distillation_transport_log_drum_id_fkey";
            columns: ["drum_id"];
            isOneToOne: false;
            referencedRelation: "stock_drum";
            referencedColumns: ["drum_id"];
          },
          {
            foreignKeyName: "distillation_transport_log_scan_id_fkey";
            columns: ["scan_id"];
            isOneToOne: true;
            referencedRelation: "log_drum_scan";
            referencedColumns: ["scan_id"];
          },
        ];
      };
      log_volume_transfer: {
        Row: {
          distillation_id: number;
          drum_id: number;
          remaining_volume: number;
          transfer_id: number;
          transfer_timestamp: string | null;
          usage_type: string;
          volume_transferred: number;
          worker_id: number | null;
        };
        Insert: {
          distillation_id: number;
          drum_id: number;
          remaining_volume: number;
          transfer_id?: number;
          transfer_timestamp?: string | null;
          usage_type: string;
          volume_transferred: number;
          worker_id?: number | null;
        };
        Update: {
          distillation_id?: number;
          drum_id?: number;
          remaining_volume?: number;
          transfer_id?: number;
          transfer_timestamp?: string | null;
          usage_type?: string;
          volume_transferred?: number;
          worker_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "log_volume_transfers_distillation_id_fkey";
            columns: ["distillation_id"];
            isOneToOne: false;
            referencedRelation: "distillation_schedule";
            referencedColumns: ["distillation_id"];
          },
          {
            foreignKeyName: "log_volume_transfers_drum_id_fkey";
            columns: ["drum_id"];
            isOneToOne: false;
            referencedRelation: "stock_drum";
            referencedColumns: ["drum_id"];
          },
        ];
      };
      notification: {
        Row: {
          audience_type: string;
          created_at: string;
          created_by: string;
          expires_at: string | null;
          is_read: boolean;
          message: string;
          message_type: string;
          notification_id: number;
          private: boolean;
        };
        Insert: {
          audience_type?: string;
          created_at?: string;
          created_by: string;
          expires_at?: string | null;
          is_read?: boolean;
          message: string;
          message_type?: string;
          notification_id?: never;
          private?: boolean;
        };
        Update: {
          audience_type?: string;
          created_at?: string;
          created_by?: string;
          expires_at?: string | null;
          is_read?: boolean;
          message?: string;
          message_type?: string;
          notification_id?: never;
          private?: boolean;
        };
        Relationships: [];
      };
      order_detail: {
        Row: {
          batch_code: string | null;
          detail_id: number;
          drum_quantity: number;
          drum_weight: number | null;
          material_code: string;
          material_name: string;
          notes: string | null;
          order_id: number;
          status: string;
        };
        Insert: {
          batch_code?: string | null;
          detail_id?: number;
          drum_quantity: number;
          drum_weight?: number | null;
          material_code: string;
          material_name: string;
          notes?: string | null;
          order_id: number;
          status?: string;
        };
        Update: {
          batch_code?: string | null;
          detail_id?: number;
          drum_quantity?: number;
          drum_weight?: number | null;
          material_code?: string;
          material_name?: string;
          notes?: string | null;
          order_id?: number;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_detail_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "ref_materials";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "order_detail_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_drum_inventory";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "order_detail_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_stock_history_analysis";
            referencedColumns: ["material_code"];
          },
          {
            foreignKeyName: "stock_order_details_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "stock_order";
            referencedColumns: ["order_id"];
          },
        ];
      };
      order_detail_stock_activity: {
        Row: {
          created_at: string | null;
          id: number;
          order_detail_id: number;
          stock_activity_id: number;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          order_detail_id: number;
          stock_activity_id: number;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          order_detail_id?: number;
          stock_activity_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_detail_stock_activity_order_detail_id_fkey";
            columns: ["order_detail_id"];
            isOneToOne: false;
            referencedRelation: "order_detail";
            referencedColumns: ["detail_id"];
          },
          {
            foreignKeyName: "order_detail_stock_activity_stock_activity_id_fkey";
            columns: ["stock_activity_id"];
            isOneToOne: false;
            referencedRelation: "stock_activity";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_detail_stock_activity_stock_activity_id_fkey";
            columns: ["stock_activity_id"];
            isOneToOne: false;
            referencedRelation: "stock_history_compatibility_view";
            referencedColumns: ["id"];
          },
        ];
      };
      product_prices: {
        Row: {
          bottle_size_id: number;
          price: number;
          product_id: number;
        };
        Insert: {
          bottle_size_id: number;
          price: number;
          product_id: number;
        };
        Update: {
          bottle_size_id?: number;
          price?: number;
          product_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_bottle_size";
            columns: ["bottle_size_id"];
            isOneToOne: false;
            referencedRelation: "bottle_sizes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_product";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product_source_material";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "fk_product";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "ref_product";
            referencedColumns: ["product_id"];
          },
        ];
      };
      raw_materials: {
        Row: {
          cas_number: string;
          chemical_group: string | null;
          chemical_props: Json | null;
          description: string | null;
          drum_volume: number;
          drum_weight: number | null;
          flash_point: number | null;
          material_code: string;
          material_id: number;
          material_name: string;
          un_code: string | null;
        };
        Insert: {
          cas_number: string;
          chemical_group?: string | null;
          chemical_props?: Json | null;
          description?: string | null;
          drum_volume?: number;
          drum_weight?: number | null;
          flash_point?: number | null;
          material_code?: string;
          material_id?: number;
          material_name: string;
          un_code?: string | null;
        };
        Update: {
          cas_number?: string;
          chemical_group?: string | null;
          chemical_props?: Json | null;
          description?: string | null;
          drum_volume?: number;
          drum_weight?: number | null;
          flash_point?: number | null;
          material_code?: string;
          material_id?: number;
          material_name?: string;
          un_code?: string | null;
        };
        Relationships: [];
      };
      raw_stock_history: {
        Row: {
          created_at: string | null;
          date: string | null;
          drum_type: string | null;
          event_str: string | null;
          id: number;
          material_code: string | null;
          no_events: number | null;
          notes_batch: string | null;
          notes_ids: string | null;
          source: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          date?: string | null;
          drum_type?: string | null;
          event_str?: string | null;
          id?: number;
          material_code?: string | null;
          no_events?: number | null;
          notes_batch?: string | null;
          notes_ids?: string | null;
          source?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          date?: string | null;
          drum_type?: string | null;
          event_str?: string | null;
          id?: number;
          material_code?: string | null;
          no_events?: number | null;
          notes_batch?: string | null;
          notes_ids?: string | null;
          source?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "raw_stock_history_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "ref_materials";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "raw_stock_history_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_drum_inventory";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "raw_stock_history_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_stock_history_analysis";
            referencedColumns: ["material_code"];
          },
        ];
      };
      ref_labs: {
        Row: {
          description: string | null;
          lab_id: number;
          lab_name: string;
          lab_site: string;
        };
        Insert: {
          description?: string | null;
          lab_id?: never;
          lab_name: string;
          lab_site: string;
        };
        Update: {
          description?: string | null;
          lab_id?: never;
          lab_name?: string;
          lab_site?: string;
        };
        Relationships: [];
      };
      ref_materials: {
        Row: {
          cas_number: string | null;
          chemical_group: string;
          code: string;
          value: string;
        };
        Insert: {
          cas_number?: string | null;
          chemical_group: string;
          code: string;
          value: string;
        };
        Update: {
          cas_number?: string | null;
          chemical_group?: string;
          code?: string;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "material_kind_chemical_group_fkey";
            columns: ["chemical_group"];
            isOneToOne: false;
            referencedRelation: "chemical_group_kind";
            referencedColumns: ["value"];
          },
        ];
      };
      ref_product: {
        Row: {
          grade: string;
          material_code: string | null;
          name: string;
          product_id: number;
          raw_material_id: number | null;
          sku: string;
        };
        Insert: {
          grade: string;
          material_code?: string | null;
          name: string;
          product_id?: number;
          raw_material_id?: number | null;
          sku: string;
        };
        Update: {
          grade?: string;
          material_code?: string | null;
          name?: string;
          product_id?: number;
          raw_material_id?: number | null;
          sku?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ref_product_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "ref_materials";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "ref_product_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_drum_inventory";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "ref_product_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_stock_history_analysis";
            referencedColumns: ["material_code"];
          },
        ];
      };
      ref_stills: {
        Row: {
          description: string | null;
          is_operational: boolean;
          is_vacuum: boolean;
          lab_id: number;
          max_capacity: number;
          power_rating_kw: number;
          still_code: string;
          still_id: number;
        };
        Insert: {
          description?: string | null;
          is_operational: boolean;
          is_vacuum: boolean;
          lab_id: number;
          max_capacity: number;
          power_rating_kw: number;
          still_code: string;
          still_id?: never;
        };
        Update: {
          description?: string | null;
          is_operational?: boolean;
          is_vacuum?: boolean;
          lab_id?: number;
          max_capacity?: number;
          power_rating_kw?: number;
          still_code?: string;
          still_id?: never;
        };
        Relationships: [
          {
            foreignKeyName: "stills_lab_id_fkey";
            columns: ["lab_id"];
            isOneToOne: false;
            referencedRelation: "ref_labs";
            referencedColumns: ["lab_id"];
          },
        ];
      };
      ref_supplier_material: {
        Row: {
          location: string;
          material_code: string;
          material_name: string;
          quantity: number;
          supplier_id: number;
          updated_at: string | null;
        };
        Insert: {
          location: string;
          material_code: string;
          material_name: string;
          quantity: number;
          supplier_id: number;
          updated_at?: string | null;
        };
        Update: {
          location?: string;
          material_code?: string;
          material_name?: string;
          quantity?: number;
          supplier_id?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "supplier_material_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "ref_materials";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "supplier_material_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_drum_inventory";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "supplier_material_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_stock_history_analysis";
            referencedColumns: ["material_code"];
          },
          {
            foreignKeyName: "supplier_material_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "ref_suppliers";
            referencedColumns: ["supplier_id"];
          },
        ];
      };
      ref_suppliers: {
        Row: {
          addr_1: string | null;
          addr_2: string | null;
          city: string | null;
          country_code: string | null;
          post_code: string | null;
          supplier_id: number;
          supplier_name: string;
        };
        Insert: {
          addr_1?: string | null;
          addr_2?: string | null;
          city?: string | null;
          country_code?: string | null;
          post_code?: string | null;
          supplier_id?: number;
          supplier_name: string;
        };
        Update: {
          addr_1?: string | null;
          addr_2?: string | null;
          city?: string | null;
          country_code?: string | null;
          post_code?: string | null;
          supplier_id?: number;
          supplier_name?: string;
        };
        Relationships: [];
      };
      session_settings: {
        Row: {
          created_at: string | null;
          device_type: string;
          id: string;
          inactivity_timeout_seconds: number | null;
          session_duration_seconds: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          device_type: string;
          id?: string;
          inactivity_timeout_seconds?: number | null;
          session_duration_seconds: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          device_type?: string;
          id?: string;
          inactivity_timeout_seconds?: number | null;
          session_duration_seconds?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      stock_activity: {
        Row: {
          activity_date: string;
          activity_type: string;
          batch_code: string | null;
          created_at: string | null;
          distillation_detail_id: number | null;
          drum_ids: string | null;
          drum_type: string;
          id: number;
          material_code: string | null;
          notes: string | null;
          order_detail_id: number | null;
          quantity: number;
          source_record_id: number | null;
          status: string | null;
          supplier_id: number | null;
          updated_at: string | null;
        };
        Insert: {
          activity_date: string;
          activity_type: string;
          batch_code?: string | null;
          created_at?: string | null;
          distillation_detail_id?: number | null;
          drum_ids?: string | null;
          drum_type: string;
          id?: number;
          material_code?: string | null;
          notes?: string | null;
          order_detail_id?: number | null;
          quantity: number;
          source_record_id?: number | null;
          status?: string | null;
          supplier_id?: number | null;
          updated_at?: string | null;
        };
        Update: {
          activity_date?: string;
          activity_type?: string;
          batch_code?: string | null;
          created_at?: string | null;
          distillation_detail_id?: number | null;
          drum_ids?: string | null;
          drum_type?: string;
          id?: number;
          material_code?: string | null;
          notes?: string | null;
          order_detail_id?: number | null;
          quantity?: number;
          source_record_id?: number | null;
          status?: string | null;
          supplier_id?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stock_activity_distillation_detail_id_fkey";
            columns: ["distillation_detail_id"];
            isOneToOne: false;
            referencedRelation: "distillation_schedule_items";
            referencedColumns: ["details_id"];
          },
          {
            foreignKeyName: "stock_activity_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "ref_materials";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "stock_activity_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_drum_inventory";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "stock_activity_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_stock_history_analysis";
            referencedColumns: ["material_code"];
          },
          {
            foreignKeyName: "stock_activity_order_detail_id_fkey";
            columns: ["order_detail_id"];
            isOneToOne: false;
            referencedRelation: "order_detail";
            referencedColumns: ["detail_id"];
          },
          {
            foreignKeyName: "stock_activity_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "ref_suppliers";
            referencedColumns: ["supplier_id"];
          },
        ];
      };
      stock_drum: {
        Row: {
          created_at: string | null;
          distillation_id: number | null;
          drum_id: number;
          drum_type: string;
          fill_level: number | null;
          material_code: string | null;
          order_detail_id: number;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          distillation_id?: number | null;
          drum_id?: number;
          drum_type?: string;
          fill_level?: number | null;
          material_code?: string | null;
          order_detail_id: number;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          distillation_id?: number | null;
          drum_id?: number;
          drum_type?: string;
          fill_level?: number | null;
          material_code?: string | null;
          order_detail_id?: number;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stock_drum_distillation_id_fkey";
            columns: ["distillation_id"];
            isOneToOne: false;
            referencedRelation: "distillation_record";
            referencedColumns: ["record_id"];
          },
          {
            foreignKeyName: "stock_drums_order_detail_id_fkey";
            columns: ["order_detail_id"];
            isOneToOne: false;
            referencedRelation: "order_detail";
            referencedColumns: ["detail_id"];
          },
        ];
      };
      stock_drum_new: {
        Row: {
          created_at: string | null;
          distillation_id: number | null;
          drum_id: number;
          drum_type: string;
          fill_level: number | null;
          material_code: string | null;
          order_detail_id: number;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          distillation_id?: number | null;
          drum_id?: number;
          drum_type?: string;
          fill_level?: number | null;
          material_code?: string | null;
          order_detail_id: number;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          distillation_id?: number | null;
          drum_id?: number;
          drum_type?: string;
          fill_level?: number | null;
          material_code?: string | null;
          order_detail_id?: number;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stock_drum_new_distillation_id_fkey";
            columns: ["distillation_id"];
            isOneToOne: false;
            referencedRelation: "distillation_record";
            referencedColumns: ["record_id"];
          },
          {
            foreignKeyName: "stock_drum_new_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "ref_materials";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "stock_drum_new_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_drum_inventory";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "stock_drum_new_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_stock_history_analysis";
            referencedColumns: ["material_code"];
          },
          {
            foreignKeyName: "stock_drum_new_order_detail_id_fkey";
            columns: ["order_detail_id"];
            isOneToOne: false;
            referencedRelation: "order_detail";
            referencedColumns: ["detail_id"];
          },
        ];
      };
      stock_history: {
        Row: {
          batch_code: string | null;
          change: number | null;
          created_at: string | null;
          date: string;
          drum_ids: string | null;
          drum_type: string;
          id: number;
          material_code: string | null;
          material_name: string;
          source_record_id: number | null;
          supplier_id: number | null;
          supplier_name: string | null;
          updated_at: string | null;
        };
        Insert: {
          batch_code?: string | null;
          change?: number | null;
          created_at?: string | null;
          date: string;
          drum_ids?: string | null;
          drum_type: string;
          id?: number;
          material_code?: string | null;
          material_name: string;
          source_record_id?: number | null;
          supplier_id?: number | null;
          supplier_name?: string | null;
          updated_at?: string | null;
        };
        Update: {
          batch_code?: string | null;
          change?: number | null;
          created_at?: string | null;
          date?: string;
          drum_ids?: string | null;
          drum_type?: string;
          id?: number;
          material_code?: string | null;
          material_name?: string;
          source_record_id?: number | null;
          supplier_id?: number | null;
          supplier_name?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stock_history_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "ref_materials";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "stock_history_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_drum_inventory";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "stock_history_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_stock_history_analysis";
            referencedColumns: ["material_code"];
          },
          {
            foreignKeyName: "stock_history_source_record_id_fkey";
            columns: ["source_record_id"];
            isOneToOne: false;
            referencedRelation: "raw_stock_history";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_history_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "ref_suppliers";
            referencedColumns: ["supplier_id"];
          },
        ];
      };
      stock_new: {
        Row: {
          batch_code: string;
          created_at: string | null;
          location: string | null;
          material_code: string | null;
          notes: string | null;
          quantity: number;
          stock_id: number;
          supplier_id: number | null;
          updated_at: string | null;
        };
        Insert: {
          batch_code: string;
          created_at?: string | null;
          location?: string | null;
          material_code?: string | null;
          notes?: string | null;
          quantity: number;
          stock_id?: number;
          supplier_id?: number | null;
          updated_at?: string | null;
        };
        Update: {
          batch_code?: string;
          created_at?: string | null;
          location?: string | null;
          material_code?: string | null;
          notes?: string | null;
          quantity?: number;
          stock_id?: number;
          supplier_id?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stock_new_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "ref_materials";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "stock_new_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_drum_inventory";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "stock_new_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_stock_history_analysis";
            referencedColumns: ["material_code"];
          },
          {
            foreignKeyName: "stock_new_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "ref_suppliers";
            referencedColumns: ["supplier_id"];
          },
        ];
      };
      stock_order: {
        Row: {
          created_at: string | null;
          date_ordered: string;
          eta: unknown | null;
          notes: string | null;
          order_id: number;
          po_number: string | null;
          supplier_id: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          date_ordered?: string;
          eta?: unknown | null;
          notes?: string | null;
          order_id?: never;
          po_number?: string | null;
          supplier_id: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          date_ordered?: string;
          eta?: unknown | null;
          notes?: string | null;
          order_id?: never;
          po_number?: string | null;
          supplier_id?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stock_orders_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "ref_suppliers";
            referencedColumns: ["supplier_id"];
          },
        ];
      };
      stock_repro: {
        Row: {
          created_at: string | null;
          location: string;
          material_code: string | null;
          material_description: string | null;
          notes: string | null;
          quantity: number;
          stock_id: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          location: string;
          material_code?: string | null;
          material_description?: string | null;
          notes?: string | null;
          quantity: number;
          stock_id?: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          location?: string;
          material_code?: string | null;
          material_description?: string | null;
          notes?: string | null;
          quantity?: number;
          stock_id?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stock_repro_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "ref_materials";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "stock_repro_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_drum_inventory";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "stock_repro_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_stock_history_analysis";
            referencedColumns: ["material_code"];
          },
        ];
      };
      user_profiles: {
        Row: {
          avatar_url: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
        };
        Insert: {
          avatar_url?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
        };
        Update: {
          avatar_url?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      user_queries: {
        Row: {
          created_at: string | null;
          execution_count: number | null;
          filters: Json | null;
          generated_sql: string | null;
          id: string;
          join_condition: Json | null;
          join_table: string | null;
          join_type: string | null;
          last_executed_at: string | null;
          query_name: string;
          selected_columns: Json | null;
          selected_table: string | null;
          sorts: Json | null;
          tags: string[] | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          execution_count?: number | null;
          filters?: Json | null;
          generated_sql?: string | null;
          id?: string;
          join_condition?: Json | null;
          join_table?: string | null;
          join_type?: string | null;
          last_executed_at?: string | null;
          query_name: string;
          selected_columns?: Json | null;
          selected_table?: string | null;
          sorts?: Json | null;
          tags?: string[] | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          execution_count?: number | null;
          filters?: Json | null;
          generated_sql?: string | null;
          id?: string;
          join_condition?: Json | null;
          join_table?: string | null;
          join_type?: string | null;
          last_executed_at?: string | null;
          query_name?: string;
          selected_columns?: Json | null;
          selected_table?: string | null;
          sorts?: Json | null;
          tags?: string[] | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      worker_passcodes: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          id: string;
          is_active: boolean | null;
          last_login_at: string | null;
          passcode: string;
          role: string;
          updated_at: string | null;
          updated_by: string | null;
          user_id: string;
          worker_name: string;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_login_at?: string | null;
          passcode: string;
          role: string;
          updated_at?: string | null;
          updated_by?: string | null;
          user_id: string;
          worker_name: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_login_at?: string | null;
          passcode?: string;
          role?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          user_id?: string;
          worker_name?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      chemical_class_groups: {
        Row: {
          groups: string | null;
          materials: number | null;
        };
        Relationships: [];
      };
      drum_order_details: {
        Row: {
          batch_code: string | null;
          date_processed: string | null;
          delivery_id: number | null;
          delivery_status: string | null;
          drum_id: number | null;
          drum_status: string | null;
          material: string | null;
          order_id: number | null;
          qty_ordered: number | null;
          qty_received: number | null;
          supplier: string | null;
        };
        Relationships: [];
      };
      product_source_material: {
        Row: {
          material: string | null;
          product: string | null;
          product_id: number | null;
          raw_material_id: number | null;
          sku: string | null;
        };
        Relationships: [];
      };
      product_table: {
        Row: {
          cas: string | null;
          grade: string | null;
          name: string | null;
          sku: string | null;
        };
        Relationships: [];
      };
      raw_drum_archives: {
        Row: {
          created_at: string | null;
          date_processed: string | null;
          drum_id: number | null;
          location: string | null;
          material: string | null;
          order_id: number | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          date_processed?: string | null;
          drum_id?: number | null;
          location?: string | null;
          material?: string | null;
          order_id?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          date_processed?: string | null;
          drum_id?: number | null;
          location?: string | null;
          material?: string | null;
          order_id?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "new_drums_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "drum_order_details";
            referencedColumns: ["order_id"];
          },
        ];
      };
      stock_history_compatibility_view: {
        Row: {
          batch_code: string | null;
          created_at: string | null;
          date: string | null;
          drum_ids: string | null;
          drum_type: string | null;
          id: number | null;
          material_code: string | null;
          quantity: number | null;
          source_record_id: number | null;
          supplier_id: number | null;
          updated_at: string | null;
        };
        Insert: {
          batch_code?: string | null;
          created_at?: string | null;
          date?: string | null;
          drum_ids?: string | null;
          drum_type?: string | null;
          id?: number | null;
          material_code?: string | null;
          quantity?: number | null;
          source_record_id?: number | null;
          supplier_id?: number | null;
          updated_at?: string | null;
        };
        Update: {
          batch_code?: string | null;
          created_at?: string | null;
          date?: string | null;
          drum_ids?: string | null;
          drum_type?: string | null;
          id?: number | null;
          material_code?: string | null;
          quantity?: number | null;
          source_record_id?: number | null;
          supplier_id?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stock_activity_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "ref_materials";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "stock_activity_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_drum_inventory";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "stock_activity_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_stock_history_analysis";
            referencedColumns: ["material_code"];
          },
          {
            foreignKeyName: "stock_activity_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "ref_suppliers";
            referencedColumns: ["supplier_id"];
          },
        ];
      };
      vw_drum_inventory: {
        Row: {
          ch_group: string;
          code: string;
          raw_drums: number | null;
          repro_drums: number | null;
          threshold: number | null;
          value: string;
        };
        Relationships: [
          {
            foreignKeyName: "material_kind_chemical_group_fkey";
            columns: ["ch_group"];
            isOneToOne: false;
            referencedRelation: "chemical_group_kind";
            referencedColumns: ["value"];
          },
        ];
      };
      vw_material_consumption: {
        Row: {
          material_code: string | null;
          material_name: string | null;
          month: string | null;
          monthly_quantity: number | null;
          running_total: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "stock_history_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "ref_materials";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "stock_history_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_drum_inventory";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "stock_history_material_code_fkey";
            columns: ["material_code"];
            isOneToOne: false;
            referencedRelation: "vw_stock_history_analysis";
            referencedColumns: ["material_code"];
          },
        ];
      };
      vw_order_history: {
        Row: {
          batch_code: string | null;
          date_ordered: string | null;
          drum_quantity: number | null;
          material_description: string | null;
          order_count: number | null;
          order_id: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "stock_order_details_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "stock_order";
            referencedColumns: ["order_id"];
          },
        ];
      };
      vw_pending_assignments: {
        Row: {
          assigned_distillation_id: number | null;
          drum_id: number | null;
          pending_id: number | null;
          pending_time: unknown | null;
          status: string | null;
          transport_id: number | null;
          transported_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "distillation_pending_assignments_assigned_distillation_id_fkey";
            columns: ["assigned_distillation_id"];
            isOneToOne: false;
            referencedRelation: "distillation_schedule";
            referencedColumns: ["distillation_id"];
          },
          {
            foreignKeyName: "distillation_pending_assignments_drum_id_fkey";
            columns: ["drum_id"];
            isOneToOne: false;
            referencedRelation: "stock_drum";
            referencedColumns: ["drum_id"];
          },
          {
            foreignKeyName: "distillation_pending_assignments_transport_id_fkey";
            columns: ["transport_id"];
            isOneToOne: false;
            referencedRelation: "log_transport_drum";
            referencedColumns: ["transport_id"];
          },
        ];
      };
      vw_stock_history_analysis: {
        Row: {
          batch_code: string | null;
          chemical_group: string | null;
          date: string | null;
          drum_ids: string | null;
          drum_type: string | null;
          id: number | null;
          material_code: string | null;
          material_name: string | null;
          month: number | null;
          quantity: number | null;
          quarter: number | null;
          supplier_name: string | null;
          year: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "material_kind_chemical_group_fkey";
            columns: ["chemical_group"];
            isOneToOne: false;
            referencedRelation: "chemical_group_kind";
            referencedColumns: ["value"];
          },
        ];
      };
      vw_supplier_analysis: {
        Row: {
          incoming_transactions: number | null;
          outgoing_transactions: number | null;
          supplier_id: number | null;
          supplier_name: string | null;
          total_incoming: number | null;
          total_outgoing: number | null;
          total_transactions: number | null;
          unique_materials: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "stock_history_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "ref_suppliers";
            referencedColumns: ["supplier_id"];
          },
        ];
      };
    };
    Functions: {
      add_to_repro_drum: {
        Args: {
          distillation_id: number;
          repro_material: string;
          volume_to_add: number;
        };
        Returns: undefined;
      };
      date_add: {
        Args: { arg1: string; arg2: unknown };
        Returns: string;
      };
      mass_to_volume: {
        Args: { material_id: number; weight: number };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

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