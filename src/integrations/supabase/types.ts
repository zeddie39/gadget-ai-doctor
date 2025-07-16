export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_feedback: {
        Row: {
          ai_response_data: Json | null
          created_at: string
          diagnosis_id: string
          feature_used: string
          feedback_type: string
          helpful: boolean
          id: string
          user_comments: string | null
        }
        Insert: {
          ai_response_data?: Json | null
          created_at?: string
          diagnosis_id: string
          feature_used: string
          feedback_type: string
          helpful?: boolean
          id?: string
          user_comments?: string | null
        }
        Update: {
          ai_response_data?: Json | null
          created_at?: string
          diagnosis_id?: string
          feature_used?: string
          feedback_type?: string
          helpful?: boolean
          id?: string
          user_comments?: string | null
        }
        Relationships: []
      }
      battery_reports: {
        Row: {
          battery_health: Json | null
          battery_level: number | null
          created_at: string
          device_info: Json | null
          id: string
          recommendations: string[] | null
        }
        Insert: {
          battery_health?: Json | null
          battery_level?: number | null
          created_at?: string
          device_info?: Json | null
          id?: string
          recommendations?: string[] | null
        }
        Update: {
          battery_health?: Json | null
          battery_level?: number | null
          created_at?: string
          device_info?: Json | null
          id?: string
          recommendations?: string[] | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          is_user: boolean
          message: string
          session_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_user?: boolean
          message: string
          session_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_user?: boolean
          message?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      health_scores: {
        Row: {
          battery_score: number | null
          created_at: string
          device_id: string | null
          device_info: Json | null
          id: string
          improvement_tips: Json | null
          overall_score: number | null
          potential_improvement: number | null
          recommendations: Json | null
          storage_score: number | null
          temperature_score: number | null
          usage_score: number | null
        }
        Insert: {
          battery_score?: number | null
          created_at?: string
          device_id?: string | null
          device_info?: Json | null
          id?: string
          improvement_tips?: Json | null
          overall_score?: number | null
          potential_improvement?: number | null
          recommendations?: Json | null
          storage_score?: number | null
          temperature_score?: number | null
          usage_score?: number | null
        }
        Update: {
          battery_score?: number | null
          created_at?: string
          device_id?: string | null
          device_info?: Json | null
          id?: string
          improvement_tips?: Json | null
          overall_score?: number | null
          potential_improvement?: number | null
          recommendations?: Json | null
          storage_score?: number | null
          temperature_score?: number | null
          usage_score?: number | null
        }
        Relationships: []
      }
      image_diagnostics: {
        Row: {
          created_at: string
          diagnosis_result: Json | null
          id: string
          image_url: string
          severity_level: string | null
        }
        Insert: {
          created_at?: string
          diagnosis_result?: Json | null
          id?: string
          image_url: string
          severity_level?: string | null
        }
        Update: {
          created_at?: string
          diagnosis_result?: Json | null
          id?: string
          image_url?: string
          severity_level?: string | null
        }
        Relationships: []
      }
      issue_history: {
        Row: {
          actions_taken: string[] | null
          created_at: string
          device_id: string | null
          diagnosis_result: Json | null
          id: string
          issue_description: string | null
          issue_type: string
          repair_cost: number | null
          repair_status: string | null
          resolved: boolean | null
          severity_level: string | null
          updated_at: string
        }
        Insert: {
          actions_taken?: string[] | null
          created_at?: string
          device_id?: string | null
          diagnosis_result?: Json | null
          id?: string
          issue_description?: string | null
          issue_type: string
          repair_cost?: number | null
          repair_status?: string | null
          resolved?: boolean | null
          severity_level?: string | null
          updated_at?: string
        }
        Update: {
          actions_taken?: string[] | null
          created_at?: string
          device_id?: string | null
          diagnosis_result?: Json | null
          id?: string
          issue_description?: string | null
          issue_type?: string
          repair_cost?: number | null
          repair_status?: string | null
          resolved?: boolean | null
          severity_level?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      storage_analysis: {
        Row: {
          cache_files: Json | null
          created_at: string
          device_info: Json | null
          duplicate_photos: Json | null
          id: string
          potential_cleanup_size: number | null
          recommendations: Json | null
          total_storage_available: number | null
          total_storage_used: number | null
          unused_apps: Json | null
        }
        Insert: {
          cache_files?: Json | null
          created_at?: string
          device_info?: Json | null
          duplicate_photos?: Json | null
          id?: string
          potential_cleanup_size?: number | null
          recommendations?: Json | null
          total_storage_available?: number | null
          total_storage_used?: number | null
          unused_apps?: Json | null
        }
        Update: {
          cache_files?: Json | null
          created_at?: string
          device_info?: Json | null
          duplicate_photos?: Json | null
          id?: string
          potential_cleanup_size?: number | null
          recommendations?: Json | null
          total_storage_available?: number | null
          total_storage_used?: number | null
          unused_apps?: Json | null
        }
        Relationships: []
      }
      troubleshooting_sessions: {
        Row: {
          completed: boolean | null
          created_at: string
          current_step: number | null
          device_type: string
          id: string
          issue_category: string
          session_data: Json | null
          updated_at: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          current_step?: number | null
          device_type: string
          id?: string
          issue_category: string
          session_data?: Json | null
          updated_at?: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          current_step?: number | null
          device_type?: string
          id?: string
          issue_category?: string
          session_data?: Json | null
          updated_at?: string
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
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
