export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  auth: {
    Tables: {
      audit_log_entries: {
        Row: {
          created_at: string | null
          id: string
          instance_id: string | null
          ip_address: string
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          id: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Relationships: []
      }
      flow_state: {
        Row: {
          auth_code: string
          auth_code_issued_at: string | null
          authentication_method: string
          code_challenge: string
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"]
          created_at: string | null
          id: string
          provider_access_token: string | null
          provider_refresh_token: string | null
          provider_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auth_code: string
          auth_code_issued_at?: string | null
          authentication_method: string
          code_challenge: string
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"]
          created_at?: string | null
          id: string
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auth_code?: string
          auth_code_issued_at?: string | null
          authentication_method?: string
          code_challenge?: string
          code_challenge_method?: Database["auth"]["Enums"]["code_challenge_method"]
          created_at?: string | null
          id?: string
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      identities: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          identity_data: Json
          last_sign_in_at: string | null
          provider: string
          provider_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data: Json
          last_sign_in_at?: string | null
          provider: string
          provider_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data?: Json
          last_sign_in_at?: string | null
          provider?: string
          provider_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      instances: {
        Row: {
          created_at: string | null
          id: string
          raw_base_config: string | null
          updated_at: string | null
          uuid: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Relationships: []
      }
      mfa_amr_claims: {
        Row: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Update: {
          authentication_method?: string
          created_at?: string
          id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_amr_claims_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_challenges: {
        Row: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code: string | null
          verified_at: string | null
          web_authn_session_data: Json | null
        }
        Insert: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code?: string | null
          verified_at?: string | null
          web_authn_session_data?: Json | null
        }
        Update: {
          created_at?: string
          factor_id?: string
          id?: string
          ip_address?: unknown
          otp_code?: string | null
          verified_at?: string | null
          web_authn_session_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_challenges_auth_factor_id_fkey"
            columns: ["factor_id"]
            isOneToOne: false
            referencedRelation: "mfa_factors"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_factors: {
        Row: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name: string | null
          id: string
          last_challenged_at: string | null
          phone: string | null
          secret: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
          web_authn_aaguid: string | null
          web_authn_credential: Json | null
        }
        Insert: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id: string
          last_challenged_at?: string | null
          phone?: string | null
          secret?: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
          web_authn_aaguid?: string | null
          web_authn_credential?: Json | null
        }
        Update: {
          created_at?: string
          factor_type?: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id?: string
          last_challenged_at?: string | null
          phone?: string | null
          secret?: string | null
          status?: Database["auth"]["Enums"]["factor_status"]
          updated_at?: string
          user_id?: string
          web_authn_aaguid?: string | null
          web_authn_credential?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_factors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      one_time_tokens: {
        Row: {
          created_at: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          relates_to?: string
          token_hash?: string
          token_type?: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_time_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_tokens: {
        Row: {
          created_at: string | null
          id: number
          instance_id: string | null
          parent: string | null
          revoked: boolean | null
          session_id: string | null
          token: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_providers: {
        Row: {
          attribute_mapping: Json | null
          created_at: string | null
          entity_id: string
          id: string
          metadata_url: string | null
          metadata_xml: string
          name_id_format: string | null
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id: string
          id: string
          metadata_url?: string | null
          metadata_xml: string
          name_id_format?: string | null
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id?: string
          id?: string
          metadata_url?: string | null
          metadata_xml?: string
          name_id_format?: string | null
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_providers_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_relay_states: {
        Row: {
          created_at: string | null
          flow_state_id: string | null
          for_email: string | null
          id: string
          redirect_to: string | null
          request_id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id: string
          redirect_to?: string | null
          request_id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id?: string
          redirect_to?: string | null
          request_id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_relay_states_flow_state_id_fkey"
            columns: ["flow_state_id"]
            isOneToOne: false
            referencedRelation: "flow_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saml_relay_states_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          version: string
        }
        Insert: {
          version: string
        }
        Update: {
          version?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          aal: Database["auth"]["Enums"]["aal_level"] | null
          created_at: string | null
          factor_id: string | null
          id: string
          ip: unknown | null
          not_after: string | null
          refreshed_at: string | null
          tag: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id: string
          ip?: unknown | null
          not_after?: string | null
          refreshed_at?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id?: string
          ip?: unknown | null
          not_after?: string | null
          refreshed_at?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_domains: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sso_domains_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_providers: {
        Row: {
          created_at: string | null
          id: string
          resource_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          aud: string | null
          banned_until: string | null
          confirmation_sent_at: string | null
          confirmation_token: string | null
          confirmed_at: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          email_change: string | null
          email_change_confirm_status: number | null
          email_change_sent_at: string | null
          email_change_token_current: string | null
          email_change_token_new: string | null
          email_confirmed_at: string | null
          encrypted_password: string | null
          id: string
          instance_id: string | null
          invited_at: string | null
          is_anonymous: boolean
          is_sso_user: boolean
          is_super_admin: boolean | null
          last_sign_in_at: string | null
          phone: string | null
          phone_change: string | null
          phone_change_sent_at: string | null
          phone_change_token: string | null
          phone_confirmed_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          reauthentication_sent_at: string | null
          reauthentication_token: string | null
          recovery_sent_at: string | null
          recovery_token: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean
          is_sso_user?: boolean
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id?: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean
          is_sso_user?: boolean
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      jwt: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      aal_level: "aal1" | "aal2" | "aal3"
      code_challenge_method: "s256" | "plain"
      factor_status: "unverified" | "verified"
      factor_type: "totp" | "webauthn" | "phone"
      one_time_token_type:
        | "confirmation_token"
        | "reauthentication_token"
        | "recovery_token"
        | "email_change_token_new"
        | "email_change_token_current"
        | "phone_change_token"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
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
          batch_code: string | null
          batch_id: string
          batch_type: string
          created_at: string
          item_id: string
          po_id: string | null
          qty_drums: number
          status: Database["inventory"]["Enums"]["batch_status_type"]
          updated_at: string
        }
        Insert: {
          batch_code?: string | null
          batch_id?: string
          batch_type: string
          created_at?: string
          item_id: string
          po_id?: string | null
          qty_drums?: number
          status?: Database["inventory"]["Enums"]["batch_status_type"]
          updated_at?: string
        }
        Update: {
          batch_code?: string | null
          batch_id?: string
          batch_type?: string
          created_at?: string
          item_id?: string
          po_id?: string | null
          qty_drums?: number
          status?: Database["inventory"]["Enums"]["batch_status_type"]
          updated_at?: string
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
          barcode_regex: string | null
          created_at: string
          is_repro: boolean
          item_id: string
          material_id: string
          name: string
          supplier_id: string | null
          unit_weight: number | null
          updated_at: string
        }
        Insert: {
          barcode_regex?: string | null
          created_at?: string
          is_repro?: boolean
          item_id?: string
          material_id: string
          name: string
          supplier_id?: string | null
          unit_weight?: number | null
          updated_at?: string
        }
        Update: {
          barcode_regex?: string | null
          created_at?: string
          is_repro?: boolean
          item_id?: string
          material_id?: string
          name?: string
          supplier_id?: string | null
          unit_weight?: number | null
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
            foreignKeyName: "items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "v_material_inventory_summary"
            referencedColumns: ["id"]
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
          default_expiry_date: string | null
          density: number | null
          formula: string | null
          material_id: string
          name: string
          storage_conditions: Json | null
          threshold_stock: number | null
        }
        Insert: {
          cas_number: string
          chemical_group?: string
          code: string
          default_expiry_date?: string | null
          density?: number | null
          formula?: string | null
          material_id?: string
          name: string
          storage_conditions?: Json | null
          threshold_stock?: number | null
        }
        Update: {
          cas_number?: string
          chemical_group?: string
          code?: string
          default_expiry_date?: string | null
          density?: number | null
          formula?: string | null
          material_id?: string
          name?: string
          storage_conditions?: Json | null
          threshold_stock?: number | null
        }
        Relationships: []
      }
      purchase_order_drums: {
        Row: {
          created_at: string
          drum_id: string | null
          is_printed: boolean
          is_received: boolean
          pod_id: string
          pol_id: string
          serial_number: string
          unit_weight: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          drum_id?: string | null
          is_printed?: boolean
          is_received?: boolean
          pod_id?: string
          pol_id: string
          serial_number: string
          unit_weight?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          drum_id?: string | null
          is_printed?: boolean
          is_received?: boolean
          pod_id?: string
          pol_id?: string
          serial_number?: string
          unit_weight?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_drums_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "drums"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "purchase_order_drums_pol_id_fkey"
            columns: ["pol_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_lines"
            referencedColumns: ["pol_id"]
          },
        ]
      }
      purchase_order_lines: {
        Row: {
          cost: number | null
          item_id: string
          po_id: string
          pol_id: string
          quantity: number
          status: string | null
          unit_weight: number | null
          updated_at: string | null
        }
        Insert: {
          cost?: number | null
          item_id: string
          po_id: string
          pol_id?: string
          quantity: number
          status?: string | null
          unit_weight?: number | null
          updated_at?: string | null
        }
        Update: {
          cost?: number | null
          item_id?: string
          po_id?: string
          pol_id?: string
          quantity?: number
          status?: string | null
          unit_weight?: number | null
          updated_at?: string | null
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
          status?: string
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
          address_line_1: string | null
          address_line_2: string | null
          contact_name: string | null
          email: string | null
          name: string
          supplier_id: string
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          contact_name?: string | null
          email?: string | null
          name: string
          supplier_id?: string
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          contact_name?: string | null
          email?: string | null
          name?: string
          supplier_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_material_inventory_summary: {
        Row: {
          category: string | null
          code: string | null
          id: string | null
          name: string | null
          new_stock: number | null
          pending_stock: number | null
          processing_stock: number | null
          repro_stock: number | null
          threshold: number | null
          total_stock: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      count_materials_below_threshold: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_batch_id_from_pol_id: {
        Args: { p_pol_id: string }
        Returns: string
      }
      get_most_common_material: {
        Args: Record<PropertyKey, never>
        Returns: {
          material_name: string
          count: number
        }[]
      }
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
        | "cancel_scan"
        | "fast_forward"
        | "bulk"
      batch_status_type:
        | "scanning_in"
        | "in_stock"
        | "in_transport"
        | "archived"
        | "pending"
      batch_type: "new" | "repro"
      drum_status: "in_stock" | "reserved" | "in_production" | "empty" | "lost"
      line_status_type: "pending" | "labelled" | "scanned"
      location_type: "os_stock" | "os_lab" | "ns_stock" | "ns_lab"
      scan_mode: "single" | "bulk"
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
          detected_drum: string | null
          device_id: string
          error_code: string | null
          metadata: Json
          parent_scan: number | null
          raw_barcode: string
          scan_id: number
          scan_mode: Database["inventory"]["Enums"]["scan_mode"]
          scanned_at: string
          status: string
          user_id: string
        }
        Insert: {
          detected_drum?: string | null
          device_id: string
          error_code?: string | null
          metadata?: Json
          parent_scan?: number | null
          raw_barcode: string
          scan_id?: number
          scan_mode?: Database["inventory"]["Enums"]["scan_mode"]
          scanned_at?: string
          status: string
          user_id: string
        }
        Update: {
          detected_drum?: string | null
          device_id?: string
          error_code?: string | null
          metadata?: Json
          parent_scan?: number | null
          raw_barcode?: string
          scan_id?: number
          scan_mode?: Database["inventory"]["Enums"]["scan_mode"]
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
          {
            foreignKeyName: "drum_scan_parent_scan_fkey"
            columns: ["parent_scan"]
            isOneToOne: false
            referencedRelation: "drum_scan"
            referencedColumns: ["scan_id"]
          },
        ]
      }
      temp_scan_log: {
        Row: {
          barcode_scanned: string
          device_id: string | null
          id: number
          job_id: string | null
          purchase_order_drum_serial: string | null
          scanned_at: string
        }
        Insert: {
          barcode_scanned: string
          device_id?: string | null
          id?: number
          job_id?: string | null
          purchase_order_drum_serial?: string | null
          scanned_at?: string
        }
        Update: {
          barcode_scanned?: string
          device_id?: string | null
          id?: number
          job_id?: string | null
          purchase_order_drum_serial?: string | null
          scanned_at?: string
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
          {
            foreignKeyName: "distillation_details_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: true
            referencedRelation: "v_operation_schedule"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "distillation_details_still_id_fkey"
            columns: ["still_id"]
            isOneToOne: false
            referencedRelation: "stills"
            referencedColumns: ["still_id"]
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
        Relationships: [
          {
            foreignKeyName: "jobs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "v_operation_schedule"
            referencedColumns: ["item_id"]
          },
        ]
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
          {
            foreignKeyName: "operation_drums_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "v_operation_schedule"
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
          {
            foreignKeyName: "operations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_operation_schedule"
            referencedColumns: ["job_id"]
          },
        ]
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
          {
            foreignKeyName: "qc_results_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "v_operation_schedule"
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
          {
            foreignKeyName: "split_operations_parent_op_id_fkey"
            columns: ["parent_op_id"]
            isOneToOne: false
            referencedRelation: "v_operation_schedule"
            referencedColumns: ["op_id"]
          },
        ]
      }
      stills: {
        Row: {
          code: string
          is_operational: boolean
          is_vacuum: boolean
          max_capacity: number
          notes: string | null
          power_rating_kw: number
          still_id: number
        }
        Insert: {
          code: string
          is_operational: boolean
          is_vacuum: boolean
          max_capacity: number
          notes?: string | null
          power_rating_kw: number
          still_id?: number
        }
        Update: {
          code?: string
          is_operational?: boolean
          is_vacuum?: boolean
          max_capacity?: number
          notes?: string | null
          power_rating_kw?: number
          still_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      v_operation_schedule: {
        Row: {
          batch_code: string | null
          drum_current_volume: number | null
          drum_id: string | null
          drum_serial_number: string | null
          ended_at: string | null
          input_batch_id: string | null
          item_id: string | null
          item_name: string | null
          job_created_at: string | null
          job_id: string | null
          job_status: Database["production"]["Enums"]["job_status"] | null
          job_updated_at: string | null
          op_created_at: string | null
          op_id: string | null
          op_status: Database["production"]["Enums"]["op_status"] | null
          op_type: Database["production"]["Enums"]["op_type"] | null
          planned_end: string | null
          planned_start: string | null
          priority: number | null
          raw_volume: number | null
          scheduled_start: string | null
          started_at: string | null
          still_code: string | null
          still_id: number | null
          still_max_capacity: number | null
          supplier_name: string | null
          volume_transferred: number | null
        }
        Relationships: [
          {
            foreignKeyName: "distillation_details_still_id_fkey"
            columns: ["still_id"]
            isOneToOne: false
            referencedRelation: "stills"
            referencedColumns: ["still_id"]
          },
        ]
      }
    }
    Functions: {
      create_distillation_job: {
        Args: {
          p_item_id: string
          p_batch_id: string
          p_planned_start: string
          p_still_id: number
          p_raw_volume: number
          p_priority?: number
        }
        Returns: string
      }
      create_transport_task: {
        Args: { p_drum_id: string; p_created_by?: string }
        Returns: {
          job_id: string
          op_id: string
        }[]
      }
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
      op_type:
        | "distillation"
        | "decanting"
        | "qc"
        | "split"
        | "packaging"
        | "goods_in"
        | "transport"
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
      _test_permissions: {
        Row: {
          id: number
          test_data: string | null
        }
        Insert: {
          id?: number
          test_data?: string | null
        }
        Update: {
          id?: number
          test_data?: string | null
        }
        Relationships: []
      }
      drum_inventory: {
        Row: {
          category: string | null
          code: string | null
          id: number
          name: string
          stock: number | null
          threshold: number | null
          type: string | null
        }
        Insert: {
          category?: string | null
          code?: string | null
          id?: number
          name: string
          stock?: number | null
          threshold?: number | null
          type?: string | null
        }
        Update: {
          category?: string | null
          code?: string | null
          id?: number
          name?: string
          stock?: number | null
          threshold?: number | null
          type?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          role: string | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_email_fkey"
            columns: ["email"]
            isOneToOne: false
            referencedRelation: "stocktake_scans_feed_details"
            referencedColumns: ["user_email"]
          },
          {
            foreignKeyName: "profiles_email_fkey"
            columns: ["email"]
            isOneToOne: false
            referencedRelation: "v_session_scans_with_user"
            referencedColumns: ["user_email"]
          },
        ]
      }
      session_scans: {
        Row: {
          batch_id: string | null
          cancelled_scan_id: string | null
          created_at: string
          device_id: string | null
          error_message: string | null
          id: string
          item_name: string | null
          metadata: Json | null
          pod_id: string | null
          pol_id: string | null
          raw_barcode: string
          scan_action: Database["public"]["Enums"]["scan_action_type"]
          scan_status: Database["public"]["Enums"]["scan_status_type"]
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          batch_id?: string | null
          cancelled_scan_id?: string | null
          created_at?: string
          device_id?: string | null
          error_message?: string | null
          id?: string
          item_name?: string | null
          metadata?: Json | null
          pod_id?: string | null
          pol_id?: string | null
          raw_barcode: string
          scan_action: Database["public"]["Enums"]["scan_action_type"]
          scan_status: Database["public"]["Enums"]["scan_status_type"]
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          batch_id?: string | null
          cancelled_scan_id?: string | null
          created_at?: string
          device_id?: string | null
          error_message?: string | null
          id?: string
          item_name?: string | null
          metadata?: Json | null
          pod_id?: string | null
          pol_id?: string | null
          raw_barcode?: string
          scan_action?: Database["public"]["Enums"]["scan_action_type"]
          scan_status?: Database["public"]["Enums"]["scan_status_type"]
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_scans_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "v_batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "session_scans_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "v_batches_with_drums"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "session_scans_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "v_distillation_schedule"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "session_scans_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "v_drum_inventory_details"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "session_scans_cancelled_scan_id_fkey"
            columns: ["cancelled_scan_id"]
            isOneToOne: false
            referencedRelation: "session_scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_scans_cancelled_scan_id_fkey"
            columns: ["cancelled_scan_id"]
            isOneToOne: false
            referencedRelation: "v_scan_history"
            referencedColumns: ["scan_id"]
          },
          {
            foreignKeyName: "session_scans_cancelled_scan_id_fkey"
            columns: ["cancelled_scan_id"]
            isOneToOne: false
            referencedRelation: "v_session_scans_with_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_scans_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "v_drum_inventory_details"
            referencedColumns: ["pod_id"]
          },
          {
            foreignKeyName: "session_scans_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_drum_details"
            referencedColumns: ["pod_id"]
          },
          {
            foreignKeyName: "session_scans_pol_id_fkey"
            columns: ["pol_id"]
            isOneToOne: false
            referencedRelation: "v_goods_in"
            referencedColumns: ["pol_id"]
          },
          {
            foreignKeyName: "session_scans_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_scans_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "stocktake_material_counts"
            referencedColumns: ["session_id"]
          },
        ]
      }
      sessions: {
        Row: {
          completed_at: string | null
          created_by: string
          description: string | null
          device_id: string | null
          ended_at: string | null
          id: string
          location: string | null
          metadata: Json | null
          name: string
          notes: string | null
          started_at: string | null
          status: string | null
          task: Database["public"]["Enums"]["session_task_type"]
        }
        Insert: {
          completed_at?: string | null
          created_by: string
          description?: string | null
          device_id?: string | null
          ended_at?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          name: string
          notes?: string | null
          started_at?: string | null
          status?: string | null
          task?: Database["public"]["Enums"]["session_task_type"]
        }
        Update: {
          completed_at?: string | null
          created_by?: string
          description?: string | null
          device_id?: string | null
          ended_at?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          started_at?: string | null
          status?: string | null
          task?: Database["public"]["Enums"]["session_task_type"]
        }
        Relationships: []
      }
      stock_count: {
        Row: {
          created_at: string
          id: string
          material_id: string
          quantity: number
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          quantity?: number
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          quantity?: number
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_count_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "stocktake_material_counts"
            referencedColumns: ["material_id"]
          },
          {
            foreignKeyName: "stock_count_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "stocktake_scan_details"
            referencedColumns: ["material_id"]
          },
          {
            foreignKeyName: "stock_count_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "stocktake_scan_details"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "stock_count_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_drum_inventory_details"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      stocktake_scans: {
        Row: {
          barcode_type: string
          created_at: string | null
          device_id: string | null
          error_message: string | null
          id: string
          material_id: string | null
          metadata: Json | null
          raw_barcode: string
          scanned_at: string
          status: string
          stocktake_session_id: string
          supplier_id: string | null
          user_id: string
        }
        Insert: {
          barcode_type: string
          created_at?: string | null
          device_id?: string | null
          error_message?: string | null
          id?: string
          material_id?: string | null
          metadata?: Json | null
          raw_barcode: string
          scanned_at?: string
          status?: string
          stocktake_session_id: string
          supplier_id?: string | null
          user_id: string
        }
        Update: {
          barcode_type?: string
          created_at?: string | null
          device_id?: string | null
          error_message?: string | null
          id?: string
          material_id?: string | null
          metadata?: Json | null
          raw_barcode?: string
          scanned_at?: string
          status?: string
          stocktake_session_id?: string
          supplier_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stocktake_scans_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "stocktake_material_counts"
            referencedColumns: ["material_id"]
          },
          {
            foreignKeyName: "stocktake_scans_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "stocktake_scan_details"
            referencedColumns: ["material_id"]
          },
          {
            foreignKeyName: "stocktake_scans_stocktake_session_id_fkey"
            columns: ["stocktake_session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocktake_scans_stocktake_session_id_fkey"
            columns: ["stocktake_session_id"]
            isOneToOne: false
            referencedRelation: "stocktake_material_counts"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "stocktake_scans_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "stocktake_scan_details"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "stocktake_scans_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_drum_inventory_details"
            referencedColumns: ["supplier_id"]
          },
        ]
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
    }
    Views: {
      stocktake_material_counts: {
        Row: {
          first_scan: string | null
          last_scan: string | null
          material_code: string | null
          material_id: string | null
          material_name: string | null
          material_status: string | null
          scan_count: number | null
          session_id: string | null
          session_name: string | null
          session_status: string | null
        }
        Relationships: []
      }
      stocktake_scan_details: {
        Row: {
          barcode_type: string | null
          created_at: string | null
          device_id: string | null
          error_message: string | null
          material_id: string | null
          material_name: string | null
          raw_barcode: string | null
          scan_id: string | null
          scanned_at: string | null
          status: string | null
          stocktake_session_id: string | null
          supplier_id: string | null
          supplier_name: string | null
          user_id: string | null
          user_identifier: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stocktake_scans_stocktake_session_id_fkey"
            columns: ["stocktake_session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocktake_scans_stocktake_session_id_fkey"
            columns: ["stocktake_session_id"]
            isOneToOne: false
            referencedRelation: "stocktake_material_counts"
            referencedColumns: ["session_id"]
          },
        ]
      }
      stocktake_scans_feed_details: {
        Row: {
          associated_supplier_name_for_material: string | null
          barcode_type: string | null
          created_at: string | null
          device_id: string | null
          error_message: string | null
          id: string | null
          material_id: string | null
          material_name: string | null
          raw_barcode: string | null
          scanned_at: string | null
          status: string | null
          stocktake_session_id: string | null
          supplier_id: string | null
          supplier_name: string | null
          user_email: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stocktake_scans_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "stocktake_material_counts"
            referencedColumns: ["material_id"]
          },
          {
            foreignKeyName: "stocktake_scans_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "stocktake_scan_details"
            referencedColumns: ["material_id"]
          },
          {
            foreignKeyName: "stocktake_scans_stocktake_session_id_fkey"
            columns: ["stocktake_session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocktake_scans_stocktake_session_id_fkey"
            columns: ["stocktake_session_id"]
            isOneToOne: false
            referencedRelation: "stocktake_material_counts"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "stocktake_scans_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "stocktake_scan_details"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "stocktake_scans_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_drum_inventory_details"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      v_batches: {
        Row: {
          batch_code: string | null
          batch_id: string | null
          batch_type: string | null
          chemical_group: string | null
          created_at: string | null
          input_recorded_at: string | null
          item_name: string | null
          material_name: string | null
          po_number: string | null
          qty_drums: number | null
          supplier_name: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_batches_with_drums: {
        Row: {
          batch_code: string | null
          batch_id: string | null
          batch_type: string | null
          chemical_group: string | null
          created_at: string | null
          drum_count: number | null
          drums_in_stock: number | null
          input_recorded_at: string | null
          item_id: string | null
          item_name: string | null
          material_name: string | null
          po_number: string | null
          qty_drums: number | null
          supplier_name: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_distillation_schedule: {
        Row: {
          batch_id: string | null
          batch_total_volume: number | null
          expected_yield: number | null
          item_name: string | null
          job_id: string | null
          job_status: Database["production"]["Enums"]["job_status"] | null
          op_id: string | null
          operation_status: Database["production"]["Enums"]["op_status"] | null
          raw_volume: number | null
          scheduled_start: string | null
          still_capacity: number | null
          still_code: string | null
          still_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "operations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_production_jobs"
            referencedColumns: ["job_id"]
          },
        ]
      }
      v_drum_inventory_details: {
        Row: {
          batch_created_at: string | null
          batch_id: string | null
          batch_type: string | null
          current_location: string | null
          current_volume: number | null
          drum_created_at: string | null
          drum_id: string | null
          drum_is_received: boolean | null
          drum_status: string | null
          drum_updated_at: string | null
          item_id: string | null
          item_name: string | null
          label_is_printed: boolean | null
          material_id: string | null
          po_eta_date: string | null
          po_id: string | null
          po_number: string | null
          po_order_date: string | null
          po_status: string | null
          pod_id: string | null
          pol_id: string | null
          pol_quantity: number | null
          pol_unit_weight: number | null
          serial_number: string | null
          supplier_id: string | null
          supplier_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "stocktake_material_counts"
            referencedColumns: ["material_id"]
          },
          {
            foreignKeyName: "items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "stocktake_scan_details"
            referencedColumns: ["material_id"]
          },
          {
            foreignKeyName: "purchase_order_drums_pol_id_fkey"
            columns: ["pol_id"]
            isOneToOne: false
            referencedRelation: "v_goods_in"
            referencedColumns: ["pol_id"]
          },
        ]
      }
      v_drums: {
        Row: {
          batch_type: string | null
          drum_id: string | null
          item_name: string | null
          last_fill_vol: number | null
          serial_number: string | null
          status: string | null
          total_volume: number | null
        }
        Relationships: []
      }
      v_goods_in: {
        Row: {
          eta_date: string | null
          item: string | null
          order_date: string | null
          po_number: string | null
          pol_id: string | null
          quantity: number | null
          status: string | null
          supplier: string | null
        }
        Relationships: []
      }
      v_production_jobs: {
        Row: {
          created_at: string | null
          current_volume: number | null
          drum_id: string | null
          drum_quantity: number | null
          ended_at: string | null
          item_name: string | null
          job_id: string | null
          location_name: string | null
          op_type: Database["production"]["Enums"]["op_type"] | null
          operation_status: Database["production"]["Enums"]["op_status"] | null
          planned_end: string | null
          planned_start: string | null
          priority: number | null
          scheduled_start: string | null
          serial_number: string | null
          started_at: string | null
          status: Database["production"]["Enums"]["job_status"] | null
          supplier_name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operation_drums_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "v_drum_inventory_details"
            referencedColumns: ["drum_id"]
          },
          {
            foreignKeyName: "operation_drums_drum_id_fkey"
            columns: ["drum_id"]
            isOneToOne: false
            referencedRelation: "v_drums"
            referencedColumns: ["drum_id"]
          },
        ]
      }
      v_purchase_order_drum_details: {
        Row: {
          drum_created_at: string | null
          is_received: boolean | null
          item_id: string | null
          item_name: string | null
          line_item_quantity: number | null
          po_eta_date: string | null
          po_id: string | null
          po_number: string | null
          po_order_date: string | null
          pod_id: string | null
          pol_id: string | null
          received_drums_for_line: number | null
          serial_number: string | null
          status: string | null
          supplier_name: string | null
          total_drums_for_line: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_drums_pol_id_fkey"
            columns: ["pol_id"]
            isOneToOne: false
            referencedRelation: "v_goods_in"
            referencedColumns: ["pol_id"]
          },
        ]
      }
      v_scan_history: {
        Row: {
          barcode: string | null
          created_at: string | null
          error_message: string | null
          item_name: string | null
          po_id: string | null
          po_number: string | null
          pol_id: string | null
          scan_action: Database["public"]["Enums"]["scan_action_type"] | null
          scan_id: string | null
          scan_status: Database["public"]["Enums"]["scan_status_type"] | null
          session_id: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_lines_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "v_drum_inventory_details"
            referencedColumns: ["po_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_drum_details"
            referencedColumns: ["po_id"]
          },
          {
            foreignKeyName: "session_scans_pol_id_fkey"
            columns: ["pol_id"]
            isOneToOne: false
            referencedRelation: "v_goods_in"
            referencedColumns: ["pol_id"]
          },
          {
            foreignKeyName: "session_scans_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_scans_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "stocktake_material_counts"
            referencedColumns: ["session_id"]
          },
        ]
      }
      v_session_scans_with_user: {
        Row: {
          cancelled_scan_id: string | null
          created_at: string | null
          device_id: string | null
          error_message: string | null
          id: string | null
          item_name: string | null
          metadata: Json | null
          pod_id: string | null
          pol_id: string | null
          raw_barcode: string | null
          scan_action: Database["public"]["Enums"]["scan_action_type"] | null
          scan_status: Database["public"]["Enums"]["scan_status_type"] | null
          session_id: string | null
          user_email: string | null
          user_email_name: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_scans_cancelled_scan_id_fkey"
            columns: ["cancelled_scan_id"]
            isOneToOne: false
            referencedRelation: "session_scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_scans_cancelled_scan_id_fkey"
            columns: ["cancelled_scan_id"]
            isOneToOne: false
            referencedRelation: "v_scan_history"
            referencedColumns: ["scan_id"]
          },
          {
            foreignKeyName: "session_scans_cancelled_scan_id_fkey"
            columns: ["cancelled_scan_id"]
            isOneToOne: false
            referencedRelation: "v_session_scans_with_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_scans_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "v_drum_inventory_details"
            referencedColumns: ["pod_id"]
          },
          {
            foreignKeyName: "session_scans_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_drum_details"
            referencedColumns: ["pod_id"]
          },
          {
            foreignKeyName: "session_scans_pol_id_fkey"
            columns: ["pol_id"]
            isOneToOne: false
            referencedRelation: "v_goods_in"
            referencedColumns: ["pol_id"]
          },
          {
            foreignKeyName: "session_scans_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_scans_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "stocktake_material_counts"
            referencedColumns: ["session_id"]
          },
        ]
      }
    }
    Functions: {
      admin_enable_pgcrypto: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      check_drum_already_received: {
        Args: { p_serial_number: string }
        Returns: Json
      }
      check_purchase_order_completion: {
        Args: { p_pol_id: string }
        Returns: Json
      }
      count_pending_drums: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_mobile_app_passcode: {
        Args: { p_user_name: string; p_passcode: string; p_user_id: string }
        Returns: string
      }
      create_user_with_passcode: {
        Args: { p_email: string; p_user_name: string; p_passcode: string }
        Returns: string
      }
      find_item_by_barcode_prefix: {
        Args: { p_barcode_prefix: string }
        Returns: {
          item_type: string
          item_id: string
        }[]
      }
      find_pending_drum_by_serial: {
        Args: { p_serial_number: string }
        Returns: Json
      }
      function_exists: {
        Args: { p_schema: string; p_function: string }
        Returns: boolean
      }
      get_pending_purchase_orders: {
        Args: Record<PropertyKey, never>
        Returns: {
          pol_id: string
          po_id: string
          item_id: string
          po_number: string
          supplier: string
          order_date: string
          status: string
          line_status: string
          eta_date: string
          item: string
          quantity: number
          received_count: number
        }[]
      }
      get_purchase_order_drums: {
        Args: { p_po_id: string }
        Returns: Json[]
      }
      get_schedulable_production_jobs: {
        Args: Record<PropertyKey, never>
        Returns: {
          job_id: string
          item_name: string
          status: Database["production"]["Enums"]["job_status"]
          planned_start: string
          priority: number
          input_batch_id: string
          batch_code: string
          still_code: string
          raw_volume: number
        }[]
      }
      increment_stock_count: {
        Args: { p_supplier_id: string; p_material_id: string }
        Returns: number
      }
      insert_stocktake_scan: {
        Args: {
          p_stocktake_session_id: string
          p_user_id: string
          p_device_id: string
          p_raw_barcode: string
          p_barcode_type: string
          p_material_id?: string
          p_supplier_id?: string
          p_status?: string
          p_error_message?: string
          p_metadata?: Json
        }
        Returns: Json
      }
      insert_temp_scan_log: {
        Args: {
          p_barcode_scanned: string
          p_device_id: string
          p_job_id?: string
          p_purchase_order_drum_serial?: string
        }
        Returns: Json
      }
      list_schemas: {
        Args: Record<PropertyKey, never>
        Returns: {
          schema_name: string
        }[]
      }
      mark_drum_as_received: {
        Args: { p_serial_number: string }
        Returns: {
          created_at: string
          drum_id: string | null
          is_printed: boolean
          is_received: boolean
          pod_id: string
          pol_id: string
          serial_number: string
          unit_weight: string | null
          updated_at: string | null
        }[]
      }
      request_passcode_reset: {
        Args: { p_user_name: string }
        Returns: boolean
      }
      reset_passcode_with_token: {
        Args: { p_token: string; p_new_passcode: string }
        Returns: boolean
      }
      test_service_role_permissions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      validate_passcode: {
        Args: { p_user_name: string; p_passcode: string }
        Returns: Json
      }
    }
    Enums: {
      scan_action_type:
        | "check_in"
        | "transport"
        | "process"
        | "context"
        | "cancel"
        | "free_scan"
      scan_status_type: "success" | "error" | "ignored"
      session_task_type:
        | "check_in"
        | "transport"
        | "free_scan"
        | "misc"
        | "production_input"
        | "volume_transfer"
        | "production_output"
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
  auth: {
    Enums: {
      aal_level: ["aal1", "aal2", "aal3"],
      code_challenge_method: ["s256", "plain"],
      factor_status: ["unverified", "verified"],
      factor_type: ["totp", "webauthn", "phone"],
      one_time_token_type: [
        "confirmation_token",
        "reauthentication_token",
        "recovery_token",
        "email_change_token_new",
        "email_change_token_current",
        "phone_change_token",
      ],
    },
  },
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
        "cancel_scan",
        "fast_forward",
        "bulk",
      ],
      batch_status_type: [
        "scanning_in",
        "in_stock",
        "in_transport",
        "archived",
        "pending",
      ],
      batch_type: ["new", "repro"],
      drum_status: ["in_stock", "reserved", "in_production", "empty", "lost"],
      line_status_type: ["pending", "labelled", "scanned"],
      location_type: ["os_stock", "os_lab", "ns_stock", "ns_lab"],
      scan_mode: ["single", "bulk"],
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
      op_type: [
        "distillation",
        "decanting",
        "qc",
        "split",
        "packaging",
        "goods_in",
        "transport",
      ],
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
    Enums: {
      scan_action_type: [
        "check_in",
        "transport",
        "process",
        "context",
        "cancel",
        "free_scan",
      ],
      scan_status_type: ["success", "error", "ignored"],
      session_task_type: [
        "check_in",
        "transport",
        "free_scan",
        "misc",
        "production_input",
        "volume_transfer",
        "production_output",
      ],
    },
  },
} as const
