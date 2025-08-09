import { Database } from './database.types';

export interface Prospect {
  id: string;
  company_name: string;
  email: string;
  status: 'new' | 'contacted' | 'interested' | 'qualified' | 'proposal_sent' | 'negotiation' | 'closed_won' | 'closed_lost';
  last_contact: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  last_contact_date: string | null;
  last_email_sent: string | null;
  engagement_score: number | null;
  tags: string[] | null;
  source: string | null;
  segment_targeting: any;
  next_follow_up: string | null;
  lead_score: number | null;
  conversion_probability: number | null;
  enriched_data: any;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  website: string | null;
  linkedin_url: string | null;
}

export interface Project {
  id: string;
  title: string;
  artist: string;
  year: number;
  description: string;
  type: 'music' | 'video';
  image_url: string;
  video_url?: string;
  display_order: number;
  created_at: string;
}

export interface Artist {
  id: string;
  name: string;
  description: string;
  image_url: string;
  latest_work: string;
  release_date: string;
  profile_url?: string;
  display_order: number;
  created_at: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  price: string;
  features: string[];
  display_order: number;
  created_at: string;
}

export interface SocialLink {
  id: number;
  platform: string;
  url: string;
  icon: string;
}

export interface StudioBooking {
  id: string;
  user_id: string;
  client_name: string;
  client_email?: string; // Ajout du champ client_email
  date: string;
  start_time: string;
  end_time: string;
  studio_type: 'recording' | 'mixing' | 'mastering' | 'composition' | 'photo';
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
}

export interface MediaUpload {
  file: File;
  path: string;
}

export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];
