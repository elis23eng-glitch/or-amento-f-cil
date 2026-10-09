export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_audit: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
          target: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      catalog_services: {
        Row: {
          created_at: string
          description: string
          id: string
          owner_id: string
          unit: string
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          owner_id: string
          unit?: string
          unit_price_cents?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          owner_id?: string
          unit?: string
          unit_price_cents?: number
        }
        Relationships: []
      }
      clients: {
        Row: {
          city: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["client_kind"]
          name: string
          notes: string | null
          owner_id: string
          phone: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["client_kind"]
          name: string
          notes?: string | null
          owner_id: string
          phone?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["client_kind"]
          name?: string
          notes?: string | null
          owner_id?: string
          phone?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          logo_path: string | null
          owner_id: string
          proposal_footer_text: string | null
          proposal_header_text: string | null
          responsible_name: string | null
          trade_name: string
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_path?: string | null
          owner_id: string
          proposal_footer_text?: string | null
          proposal_header_text?: string | null
          responsible_name?: string | null
          trade_name: string
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_path?: string | null
          owner_id?: string
          proposal_footer_text?: string | null
          proposal_header_text?: string | null
          responsible_name?: string | null
          trade_name?: string
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          admin_notes: string | null
          city: string | null
          created_at: string
          id: string
          interest: Database["public"]["Enums"]["lead_interest"]
          marketing_consent: boolean
          monthly_quotes: string | null
          name: string
          profession: string | null
          source_ip: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          whatsapp: string
        }
        Insert: {
          admin_notes?: string | null
          city?: string | null
          created_at?: string
          id?: string
          interest?: Database["public"]["Enums"]["lead_interest"]
          marketing_consent?: boolean
          monthly_quotes?: string | null
          name: string
          profession?: string | null
          source_ip?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          whatsapp: string
        }
        Update: {
          admin_notes?: string | null
          city?: string | null
          created_at?: string
          id?: string
          interest?: Database["public"]["Enums"]["lead_interest"]
          marketing_consent?: boolean
          monthly_quotes?: string | null
          name?: string
          profession?: string | null
          source_ip?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      manual_payments: {
        Row: {
          amount_cents: number
          confirmed_at: string
          confirmed_by: string | null
          id: string
          method: string | null
          note: string | null
          paid_on: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents?: number
          confirmed_at?: string
          confirmed_by?: string | null
          id?: string
          method?: string | null
          note?: string | null
          paid_on?: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          confirmed_at?: string
          confirmed_by?: string | null
          id?: string
          method?: string | null
          note?: string | null
          paid_on?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          trial_ends_at: string
          trial_started_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          trial_ends_at?: string
          trial_started_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          trial_ends_at?: string
          trial_started_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          description: string
          id: string
          owner_id: string
          position: number
          quantity: number
          quote_id: string
          total_cents: number
          unit: string
          unit_price_cents: number
        }
        Insert: {
          description: string
          id?: string
          owner_id: string
          position?: number
          quantity: number
          quote_id: string
          total_cents?: number
          unit?: string
          unit_price_cents?: number
        }
        Update: {
          description?: string
          id?: string
          owner_id?: string
          position?: number
          quantity?: number
          quote_id?: string
          total_cents?: number
          unit?: string
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_versions: {
        Row: {
          id: string
          owner_id: string
          published_at: string
          quote_id: string
          snapshot: Json
          total_cents: number
          valid_until: string | null
          version: number
        }
        Insert: {
          id?: string
          owner_id: string
          published_at?: string
          quote_id: string
          snapshot: Json
          total_cents: number
          valid_until?: string | null
          version: number
        }
        Update: {
          id?: string
          owner_id?: string
          published_at?: string
          quote_id?: string
          snapshot?: Json
          total_cents?: number
          valid_until?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_versions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          bdi_percent: number
          client_id: string | null
          client_kind: Database["public"]["Enums"]["client_kind"]
          client_name: string
          client_phone: string | null
          client_ref: string | null
          created_at: string
          description: string | null
          discount_cents: number
          exclusions: string | null
          execution_term: string | null
          extra_costs_cents: number
          id: string
          inclusions: string | null
          notes: string | null
          number: number
          owner_id: string
          payment_terms: string | null
          project_type: string | null
          quote_date: string
          sent_confirmed_at: string | null
          service_location: string | null
          status: Database["public"]["Enums"]["quote_status"]
          subtotal_cents: number
          tax_percent: number
          title: string | null
          total_cents: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          bdi_percent?: number
          client_id?: string | null
          client_kind?: Database["public"]["Enums"]["client_kind"]
          client_name?: string
          client_phone?: string | null
          client_ref?: string | null
          created_at?: string
          description?: string | null
          discount_cents?: number
          exclusions?: string | null
          execution_term?: string | null
          extra_costs_cents?: number
          id?: string
          inclusions?: string | null
          notes?: string | null
          number: number
          owner_id: string
          payment_terms?: string | null
          project_type?: string | null
          quote_date?: string
          sent_confirmed_at?: string | null
          service_location?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal_cents?: number
          tax_percent?: number
          title?: string | null
          total_cents?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          bdi_percent?: number
          client_id?: string | null
          client_kind?: Database["public"]["Enums"]["client_kind"]
          client_name?: string
          client_phone?: string | null
          client_ref?: string | null
          created_at?: string
          description?: string | null
          discount_cents?: number
          exclusions?: string | null
          execution_term?: string | null
          extra_costs_cents?: number
          id?: string
          inclusions?: string | null
          notes?: string | null
          number?: number
          owner_id?: string
          payment_terms?: string | null
          project_type?: string | null
          quote_date?: string
          sent_confirmed_at?: string | null
          service_location?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal_cents?: number
          tax_percent?: number
          title?: string | null
          total_cents?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string
          done: boolean
          due_on: string
          id: string
          note: string
          owner_id: string
          quote_id: string | null
        }
        Insert: {
          created_at?: string
          done?: boolean
          due_on?: string
          id?: string
          note?: string
          owner_id: string
          quote_id?: string | null
        }
        Update: {
          created_at?: string
          done?: boolean
          due_on?: string
          id?: string
          note?: string
          owner_id?: string
          quote_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      share_tokens: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          quote_id: string
          revoked_at: string | null
          token: string
          version_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          quote_id: string
          revoked_at?: string | null
          token: string
          version_id: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          quote_id?: string
          revoked_at?: string | null
          token?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_tokens_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_tokens_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "quote_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          ends_on: string | null
          id: string
          price_cents: number
          starts_on: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_on?: string | null
          id?: string
          price_cents?: number
          starts_on?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_on?: string | null
          id?: string
          price_cents?: number
          starts_on?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      next_quote_number: { Args: { _owner: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "user"
      client_kind: "pf" | "pj"
      lead_interest: "testar" | "contratar"
      lead_status: "novo" | "contatado" | "em_teste" | "pagante" | "inativo"
      quote_status:
        | "rascunho"
        | "publicado"
        | "aprovado"
        | "recusado"
        | "vencido"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      client_kind: ["pf", "pj"],
      lead_interest: ["testar", "contratar"],
      lead_status: ["novo", "contatado", "em_teste", "pagante", "inativo"],
      quote_status: [
        "rascunho",
        "publicado",
        "aprovado",
        "recusado",
        "vencido",
      ],
    },
  },
} as const
