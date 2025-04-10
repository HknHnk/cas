// src/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://knjtvjuevwupzitqojmy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuanR2anVldnd1cHppdHFvam15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMzU1NzUsImV4cCI6MjA1OTgxMTU3NX0.Wm-0KTkNCQ4_RSB1fkCz_zj5HHu0t4ad0S4lby_lW6s';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Define database types
export type Subject = {
  id: string;
  name: string;
  color: string;
  created_at?: string;
  updated_at?: string;
};

export type RevisionEvent = {
  id: string;
  subject_id: string;
  date: string;
  time: string; // in HH:MM format
  duration: number; // in minutes
  completed: boolean;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  // Join fields
  subjects?: {
    name: string;
    color: string;
  };
};

export type Exam = {
  id: string;
  subject_id: string;
  name: string;
  date: string;
  time: string;
  duration: number; // in minutes
  created_at?: string;
  updated_at?: string;
  // Join fields
  subjects?: {
    name: string;
    color: string;
  };
  days_remaining?: number;
};