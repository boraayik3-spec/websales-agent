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
      businesses: {
        Row: {
          id: string
          name: string
          type: string | null
          address: string | null
          website: string | null
          website_status: string | null
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type?: string | null
          address?: string | null
          website?: string | null
          website_status?: string | null
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string | null
          address?: string | null
          website?: string | null
          website_status?: string | null
          email?: string | null
          created_at?: string
        }
        Relationships: []
      }
      outreach: {
        Row: {
          id: string
          business_id: string
          stage: string | null
          email_1_sent_at: string | null
          email_2_sent_at: string | null
          reply_at: string | null
          reply_sentiment: string | null
          is_interested: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          stage?: string | null
          email_1_sent_at?: string | null
          email_2_sent_at?: string | null
          reply_at?: string | null
          reply_sentiment?: string | null
          is_interested?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          stage?: string | null
          email_1_sent_at?: string | null
          email_2_sent_at?: string | null
          reply_at?: string | null
          reply_sentiment?: string | null
          is_interested?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'outreach_business_id_fkey'
            columns: ['business_id']
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      websites: {
        Row: {
          id: string
          business_id: string
          code_repo: string | null
          vercel_url: string | null
          domain: string | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          code_repo?: string | null
          vercel_url?: string | null
          domain?: string | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          code_repo?: string | null
          vercel_url?: string | null
          domain?: string | null
          status?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'websites_business_id_fkey'
            columns: ['business_id']
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          plan: string
          analyses_used: number
          analyses_limit: number
        }
        Insert: {
          id: string
          email: string
          plan?: string
          analyses_used?: number
          analyses_limit?: number
        }
        Update: {
          id?: string
          email?: string
          plan?: string
          analyses_used?: number
          analyses_limit?: number
        }
        Relationships: [
          {
            foreignKeyName: 'users_id_fkey'
            columns: ['id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
