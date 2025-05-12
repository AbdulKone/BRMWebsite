import { Database } from './database.types';

export interface Project {
  id: string;
  title: string;
  artist: string;
  year: number;
  description: string;
  type: 'music' | 'video';
  image_url: string;
  video_url?: string;
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
  created_at: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
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
