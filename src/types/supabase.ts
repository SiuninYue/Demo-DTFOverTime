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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
  public: {
    Tables: {
      employees: {
        Row: {
          attendance_bonus: number | null
          base_salary: number
          calculation_mode: string | null
          created_at: string | null
          default_rest_hours: number | null
          email: string
          employee_id: string | null
          id: string
          is_part_iv_applicable: boolean | null
          is_workman: boolean | null
          name: string
          normal_work_hours: number | null
          outlet_code: string | null
          pay_day: number | null
          position: string | null
          start_date: string | null
          updated_at: string | null
          work_schedule_type: string
        }
        Insert: {
          attendance_bonus?: number | null
          base_salary: number
          calculation_mode?: string | null
          created_at?: string | null
          default_rest_hours?: number | null
          email: string
          employee_id?: string | null
          id?: string
          is_part_iv_applicable?: boolean | null
          is_workman?: boolean | null
          name: string
          normal_work_hours?: number | null
          outlet_code?: string | null
          pay_day?: number | null
          position?: string | null
          start_date?: string | null
          updated_at?: string | null
          work_schedule_type?: string
        }
        Update: {
          attendance_bonus?: number | null
          base_salary?: number
          calculation_mode?: string | null
          created_at?: string | null
          default_rest_hours?: number | null
          email?: string
          employee_id?: string | null
          id?: string
          is_part_iv_applicable?: boolean | null
          is_workman?: boolean | null
          name?: string
          normal_work_hours?: number | null
          outlet_code?: string | null
          pay_day?: number | null
          position?: string | null
          start_date?: string | null
          updated_at?: string | null
          work_schedule_type?: string
        }
        Relationships: []
      }
      mc_records: {
        Row: {
          certificate_number: string | null
          created_at: string | null
          date: string
          days: number
          employee_id: string
          id: string
          is_paid: boolean | null
          reason: string | null
          updated_at: string | null
        }
        Insert: {
          certificate_number?: string | null
          created_at?: string | null
          date: string
          days?: number
          employee_id: string
          id?: string
          is_paid?: boolean | null
          reason?: string | null
          updated_at?: string | null
        }
        Update: {
          certificate_number?: string | null
          created_at?: string | null
          date?: string
          days?: number
          employee_id?: string
          id?: string
          is_paid?: boolean | null
          reason?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mc_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_salaries: {
        Row: {
          actual_pay_date: string | null
          attendance_bonus: number | null
          base_salary: number
          calculation_details: Json | null
          created_at: string | null
          deductions: number | null
          employee_id: string
          estimated_pay_date: string | null
          id: string
          month: string
          overtime_pay: number | null
          ph_pay: number | null
          rest_day_pay: number | null
          status: string | null
          total_gross: number
          updated_at: string | null
        }
        Insert: {
          actual_pay_date?: string | null
          attendance_bonus?: number | null
          base_salary: number
          calculation_details?: Json | null
          created_at?: string | null
          deductions?: number | null
          employee_id: string
          estimated_pay_date?: string | null
          id?: string
          month: string
          overtime_pay?: number | null
          ph_pay?: number | null
          rest_day_pay?: number | null
          status?: string | null
          total_gross: number
          updated_at?: string | null
        }
        Update: {
          actual_pay_date?: string | null
          attendance_bonus?: number | null
          base_salary?: number
          calculation_details?: Json | null
          created_at?: string | null
          deductions?: number | null
          employee_id?: string
          estimated_pay_date?: string | null
          id?: string
          month?: string
          overtime_pay?: number | null
          ph_pay?: number | null
          rest_day_pay?: number | null
          status?: string | null
          total_gross?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_salaries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          image_file_name: string | null
          image_size: number | null
          imported_at: string | null
          month: string
          original_image_url: string | null
          recognition_accuracy: number | null
          recognition_method: string | null
          schedule_data: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          image_file_name?: string | null
          image_size?: number | null
          imported_at?: string | null
          month: string
          original_image_url?: string | null
          recognition_accuracy?: number | null
          recognition_method?: string | null
          schedule_data: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          image_file_name?: string | null
          image_size?: number | null
          imported_at?: string | null
          month?: string
          original_image_url?: string | null
          recognition_accuracy?: number | null
          recognition_method?: string | null
          schedule_data?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      time_records: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          base_pay: number | null
          created_at: string | null
          date: string
          day_type: string
          employee_id: string
          hours_worked: number | null
          id: string
          is_employer_requested: boolean | null
          is_modified: boolean | null
          notes: string | null
          overtime_pay: number | null
          rest_hours: number | null
          spans_midnight: boolean | null
          updated_at: string | null
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          base_pay?: number | null
          created_at?: string | null
          date: string
          day_type: string
          employee_id: string
          hours_worked?: number | null
          id?: string
          is_employer_requested?: boolean | null
          is_modified?: boolean | null
          notes?: string | null
          overtime_pay?: number | null
          rest_hours?: number | null
          spans_midnight?: boolean | null
          updated_at?: string | null
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          base_pay?: number | null
          created_at?: string | null
          date?: string
          day_type?: string
          employee_id?: string
          hours_worked?: number | null
          id?: string
          is_employer_requested?: boolean | null
          is_modified?: boolean | null
          notes?: string | null
          overtime_pay?: number | null
          rest_hours?: number | null
          spans_midnight?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
