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
      bodegas: {
        Row: {
          activo: boolean | null
          capacidad_total_m3: number | null
          created_at: string | null
          departamento: string
          direccion_base: string
          id: number
          max_dias_entrega: number
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          capacidad_total_m3?: number | null
          created_at?: string | null
          departamento: string
          direccion_base: string
          id?: number
          max_dias_entrega: number
          nombre: string
        }
        Update: {
          activo?: boolean | null
          capacidad_total_m3?: number | null
          created_at?: string | null
          departamento?: string
          direccion_base?: string
          id?: number
          max_dias_entrega?: number
          nombre?: string
        }
        Relationships: []
      }
      camiones: {
        Row: {
          activo: boolean | null
          bodega_id: number
          capacidad_maxima_m3: number
          codigo: string
          conductor_nombre: string | null
          conductor_telefono: string | null
          created_at: string | null
          estado: string | null
          id: number
        }
        Insert: {
          activo?: boolean | null
          bodega_id: number
          capacidad_maxima_m3: number
          codigo: string
          conductor_nombre?: string | null
          conductor_telefono?: string | null
          created_at?: string | null
          estado?: string | null
          id?: number
        }
        Update: {
          activo?: boolean | null
          bodega_id?: number
          capacidad_maxima_m3?: number
          codigo?: string
          conductor_nombre?: string | null
          conductor_telefono?: string | null
          created_at?: string | null
          estado?: string | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "camiones_bodega_id_fkey"
            columns: ["bodega_id"]
            isOneToOne: false
            referencedRelation: "bodegas"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          bodega_asignada: string | null
          ciudad_entrega: string | null
          direccion_entrega: string
          estado: string | null
          fecha_creacion: string | null
          fecha_limite_entrega: string | null
          id: number
          items: Json
          nombre_cliente: string
          numero_orden: number | null
          observaciones_logistica: string | null
          peso_total_kg: number | null
          prioridad: number | null
          ruta_entrega_id: number | null
          telegram_user_id: number | null
          volumen_total_m3: number | null
        }
        Insert: {
          bodega_asignada?: string | null
          ciudad_entrega?: string | null
          direccion_entrega: string
          estado?: string | null
          fecha_creacion?: string | null
          fecha_limite_entrega?: string | null
          id?: number
          items: Json
          nombre_cliente: string
          numero_orden?: number | null
          observaciones_logistica?: string | null
          peso_total_kg?: number | null
          prioridad?: number | null
          ruta_entrega_id?: number | null
          telegram_user_id?: number | null
          volumen_total_m3?: number | null
        }
        Update: {
          bodega_asignada?: string | null
          ciudad_entrega?: string | null
          direccion_entrega?: string
          estado?: string | null
          fecha_creacion?: string | null
          fecha_limite_entrega?: string | null
          id?: number
          items?: Json
          nombre_cliente?: string
          numero_orden?: number | null
          observaciones_logistica?: string | null
          peso_total_kg?: number | null
          prioridad?: number | null
          ruta_entrega_id?: number | null
          telegram_user_id?: number | null
          volumen_total_m3?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_ruta_entrega_id_fkey"
            columns: ["ruta_entrega_id"]
            isOneToOne: false
            referencedRelation: "rutas_entrega"
            referencedColumns: ["id"]
          },
        ]
      }
      productos_volumen: {
        Row: {
          activo: boolean | null
          categoria: string | null
          created_at: string | null
          id: number
          nombre_producto: string
          peso_unitario_kg: number | null
          volumen_unitario_m3: number
        }
        Insert: {
          activo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          id?: number
          nombre_producto: string
          peso_unitario_kg?: number | null
          volumen_unitario_m3: number
        }
        Update: {
          activo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          id?: number
          nombre_producto?: string
          peso_unitario_kg?: number | null
          volumen_unitario_m3?: number
        }
        Relationships: []
      }
      rutas_entrega: {
        Row: {
          camion_id: number
          created_at: string | null
          distancia_total_km: number | null
          estado: string | null
          fecha_programada: string
          hora_fin_estimada: string | null
          hora_inicio: string | null
          id: number
          observaciones: string | null
          ruta_optimizada: Json | null
          tiempo_estimado_horas: number | null
          updated_at: string | null
          volumen_total_m3: number | null
        }
        Insert: {
          camion_id: number
          created_at?: string | null
          distancia_total_km?: number | null
          estado?: string | null
          fecha_programada: string
          hora_fin_estimada?: string | null
          hora_inicio?: string | null
          id?: number
          observaciones?: string | null
          ruta_optimizada?: Json | null
          tiempo_estimado_horas?: number | null
          updated_at?: string | null
          volumen_total_m3?: number | null
        }
        Update: {
          camion_id?: number
          created_at?: string | null
          distancia_total_km?: number | null
          estado?: string | null
          fecha_programada?: string
          hora_fin_estimada?: string | null
          hora_inicio?: string | null
          id?: number
          observaciones?: string | null
          ruta_optimizada?: Json | null
          tiempo_estimado_horas?: number | null
          updated_at?: string | null
          volumen_total_m3?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rutas_entrega_camion_id_fkey"
            columns: ["camion_id"]
            isOneToOne: false
            referencedRelation: "camiones"
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
  public: {
    Enums: {},
  },
} as const
