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
      studio_bookings: {
        Row: {
          id: string
          user_id: string
          date: string
          start_time: string
          end_time: string
          studio_type: 'recording' | 'mixing' | 'mastering'
          notes: string | null
          status: 'pending' | 'confirmed' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          start_time: string
          end_time: string
          studio_type: 'recording' | 'mixing' | 'mastering'
          notes?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          start_time?: string
          end_time?: string
          studio_type?: 'recording' | 'mixing' | 'mastering'
          notes?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled'
          created_at?: string
        }
      }
      contact_messages: {
        Row: {
          id: string
          name: string
          email: string
          subject: string
          message: string
          status: 'new' | 'read' | 'replied'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          subject: string
          message: string
          status?: 'new' | 'read' | 'replied'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          subject?: string
          message?: string
          status?: 'new' | 'read' | 'replied'
          created_at?: string
        }
      }
      prospects: {
        Row: {
          id: string
          company_name: string
          email: string
          status: 'new' | 'contacted' | 'interested' | 'qualified' | 'proposal_sent' | 'negotiation' | 'closed_won' | 'closed_lost'
          last_contact: string | null
          notes: string | null
          created_at: string
          updated_at: string
          last_contact_date: string | null
          last_email_sent: string | null
          engagement_score: number | null
          tags: string[] | null
          source: string | null
          segment_targeting: Json
          next_follow_up: string | null
          lead_score: number | null
          conversion_probability: number | null
          enriched_data: Json
          first_name: string | null
          last_name: string | null
          position: string | null
          website: string | null
          linkedin_url: string | null
        }
        Insert: {
          id?: string
          company_name: string
          email: string
          status?: 'new' | 'contacted' | 'interested' | 'qualified' | 'proposal_sent' | 'negotiation' | 'closed_won' | 'closed_lost'
          last_contact?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          last_contact_date?: string | null
          last_email_sent?: string | null
          engagement_score?: number | null
          tags?: string[] | null
          source?: string | null
          segment_targeting?: Json
          next_follow_up?: string | null
          lead_score?: number | null
          conversion_probability?: number | null
          enriched_data?: Json
          first_name?: string | null
          last_name?: string | null
          position?: string | null
          website?: string | null
          linkedin_url?: string | null
        }
        Update: {
          id?: string
          company_name?: string
          email?: string
          status?: 'new' | 'contacted' | 'interested' | 'qualified' | 'proposal_sent' | 'negotiation' | 'closed_won' | 'closed_lost'
          last_contact?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          last_contact_date?: string | null
          last_email_sent?: string | null
          engagement_score?: number | null
          tags?: string[] | null
          source?: string | null
          segment_targeting?: Json
          next_follow_up?: string | null
          lead_score?: number | null
          conversion_probability?: number | null
          enriched_data?: Json
          first_name?: string | null
          last_name?: string | null
          position?: string | null
          website?: string | null
          linkedin_url?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      studio_type: 'recording' | 'mixing' | 'mastering'
      booking_status: 'pending' | 'confirmed' | 'cancelled'
      message_status: 'new' | 'read' | 'replied'
    }
  }
}