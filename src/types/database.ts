export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          company_name: string | null
          default_address: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          company_name?: string | null
          default_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          company_name?: string | null
          default_address?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          flute_type: string
          layers: number
          max_dimensions: Json
          base_price: number
          image_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          flute_type: string
          layers: number
          max_dimensions: Json
          base_price: number
          image_url?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          flute_type?: string
          layers?: number
          max_dimensions?: Json
          base_price?: number
          image_url?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}