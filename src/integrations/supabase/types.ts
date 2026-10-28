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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      complaint_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          complaint_id: string
          id: string
          note: string | null
          worker_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          complaint_id: string
          id?: string
          note?: string | null
          worker_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          complaint_id?: string
          id?: string
          note?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_assignments_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_attachments: {
        Row: {
          complaint_id: string
          created_at: string
          id: string
          kind: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          complaint_id: string
          created_at?: string
          id?: string
          kind?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          complaint_id?: string
          created_at?: string
          id?: string
          kind?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaint_attachments_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_updates: {
        Row: {
          actor_id: string | null
          complaint_id: string
          created_at: string
          from_status: Database["public"]["Enums"]["complaint_status"] | null
          id: string
          image_url: string | null
          note: string | null
          to_status: Database["public"]["Enums"]["complaint_status"] | null
          visibility: string
        }
        Insert: {
          actor_id?: string | null
          complaint_id: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["complaint_status"] | null
          id?: string
          image_url?: string | null
          note?: string | null
          to_status?: Database["public"]["Enums"]["complaint_status"] | null
          visibility?: string
        }
        Update: {
          actor_id?: string | null
          complaint_id?: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["complaint_status"] | null
          id?: string
          image_url?: string | null
          note?: string | null
          to_status?: Database["public"]["Enums"]["complaint_status"] | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_updates_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          admin_notes: string | null
          assigned_staff_id: string | null
          category: Database["public"]["Enums"]["complaint_category"]
          citizen_id: string
          code: string
          created_at: string
          department_id: string | null
          description: string
          due_date: string | null
          id: string
          image_url: string | null
          latitude: number | null
          location_text: string | null
          longitude: number | null
          priority: Database["public"]["Enums"]["complaint_priority"]
          resolution_image_url: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          title: string
          updated_at: string
          ward: string | null
        }
        Insert: {
          admin_notes?: string | null
          assigned_staff_id?: string | null
          category: Database["public"]["Enums"]["complaint_category"]
          citizen_id: string
          code: string
          created_at?: string
          department_id?: string | null
          description: string
          due_date?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          priority?: Database["public"]["Enums"]["complaint_priority"]
          resolution_image_url?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          title: string
          updated_at?: string
          ward?: string | null
        }
        Update: {
          admin_notes?: string | null
          assigned_staff_id?: string | null
          category?: Database["public"]["Enums"]["complaint_category"]
          citizen_id?: string
          code?: string
          created_at?: string
          department_id?: string | null
          description?: string
          due_date?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          priority?: Database["public"]["Enums"]["complaint_priority"]
          resolution_image_url?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          title?: string
          updated_at?: string
          ward?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaints_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          category: Database["public"]["Enums"]["complaint_category"] | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["complaint_category"] | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: Database["public"]["Enums"]["complaint_category"] | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          department_id: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          full_name?: string
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      admin_completion_decision: {
        Args: { _approve: boolean; _complaint_id: string; _note?: string }
        Returns: undefined
      }
      admin_reopen_complaint: {
        Args: { _complaint_id: string; _note: string }
        Returns: undefined
      }
      can_view_complaint: { Args: { _complaint_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      my_department: { Args: never; Returns: string }
      track_lookup: {
        Args: { _code: string }
        Returns: {
          category: Database["public"]["Enums"]["complaint_category"]
          code: string
          created_at: string
          department_name: string
          priority: Database["public"]["Enums"]["complaint_priority"]
          resolution_notes: string
          resolved_at: string
          status: Database["public"]["Enums"]["complaint_status"]
          title: string
          updated_at: string
        }[]
      }
      track_timeline: {
        Args: { _code: string }
        Returns: {
          created_at: string
          note: string
          to_status: Database["public"]["Enums"]["complaint_status"]
        }[]
      }
      worker_task_action: {
        Args: {
          _action: string
          _complaint_id: string
          _image_url?: string
          _note?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "citizen" | "staff" | "admin"
      complaint_category:
        | "pothole"
        | "garbage"
        | "water"
        | "streetlight"
        | "drainage"
        | "traffic"
        | "safety"
        | "other"
      complaint_priority: "low" | "medium" | "high" | "urgent"
      complaint_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "rejected"
        | "under_review"
        | "approved"
        | "assigned"
        | "pending_verification"
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
      app_role: ["citizen", "staff", "admin"],
      complaint_category: [
        "pothole",
        "garbage",
        "water",
        "streetlight",
        "drainage",
        "traffic",
        "safety",
        "other",
      ],
      complaint_priority: ["low", "medium", "high", "urgent"],
      complaint_status: [
        "pending",
        "in_progress",
        "completed",
        "rejected",
        "under_review",
        "approved",
        "assigned",
        "pending_verification",
      ],
    },
  },
} as const
