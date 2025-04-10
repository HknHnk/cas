// src/api.ts
import { supabase, Subject, RevisionEvent, Exam } from './supabase';

// Subject API functions
export const getSubjects = async (): Promise<Subject[]> => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
};

export const createSubject = async (subjectData: Omit<Subject, 'id' | 'created_at' | 'updated_at'>): Promise<Subject> => {
  const { data, error } = await supabase
    .from('subjects')
    .insert([subjectData])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updateSubject = async (id: string, subjectData: Partial<Omit<Subject, 'id' | 'created_at' | 'updated_at'>>): Promise<Subject> => {
  const { data, error } = await supabase
    .from('subjects')
    .update(subjectData)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const deleteSubject = async (id: string): Promise<{ message: string }> => {
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return { message: 'Subject deleted successfully' };
};

// Event API functions
export const getEvents = async (): Promise<RevisionEvent[]> => {
  const { data, error } = await supabase
    .from('revision_events')
    .select(`
      *,
      subjects:subject_id (name, color)
    `)
    .order('date')
    .order('time');
  
  if (error) throw error;
  return data || [];
};

export const getEventsForDate = async (date: string): Promise<RevisionEvent[]> => {
  const { data, error } = await supabase
    .from('revision_events')
    .select(`
      *,
      subjects:subject_id (name, color)
    `)
    .eq('date', date)
    .order('time');
  
  if (error) throw error;
  return data || [];
};

export const getEventsForWeek = async (startDate: string, endDate: string): Promise<RevisionEvent[]> => {
  const { data, error } = await supabase
    .from('revision_events')
    .select(`
      *,
      subjects:subject_id (name, color)
    `)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')
    .order('time');
  
  if (error) throw error;
  return data || [];
};

export const createEvent = async (eventData: Omit<RevisionEvent, 'id' | 'created_at' | 'updated_at' | 'subjects'>): Promise<RevisionEvent> => {
  const { data, error } = await supabase
    .from('revision_events')
    .insert([eventData])
    .select(`
      *,
      subjects:subject_id (name, color)
    `);
  
  if (error) throw error;
  return data[0];
};

export const updateEvent = async (id: string, eventData: Partial<Omit<RevisionEvent, 'id' | 'created_at' | 'updated_at' | 'subjects'>>): Promise<RevisionEvent> => {
  const { data, error } = await supabase
    .from('revision_events')
    .update(eventData)
    .eq('id', id)
    .select(`
      *,
      subjects:subject_id (name, color)
    `);
  
  if (error) throw error;
  return data[0];
};

export const toggleEventCompletion = async (id: string, currentStatus: boolean): Promise<RevisionEvent> => {
  const { data, error } = await supabase
    .from('revision_events')
    .update({ completed: !currentStatus })
    .eq('id', id)
    .select(`
      *,
      subjects:subject_id (name, color)
    `);
  
  if (error) throw error;
  return data[0];
};

export const deleteEvent = async (id: string): Promise<{ message: string }> => {
  const { error } = await supabase
    .from('revision_events')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return { message: 'Event deleted successfully' };
};

// Exam API functions
export const getExams = async (): Promise<Exam[]> => {
  const { data, error } = await supabase
    .from('exams')
    .select(`
      *,
      subjects:subject_id (name, color)
    `)
    .order('date')
    .order('time');
  
  if (error) throw error;
  return data || [];
};

export const getUpcomingExams = async (): Promise<Exam[]> => {
  const { data, error } = await supabase
    .from('upcoming_exams')
    .select('*');
  
  if (error) throw error;
  return data || [];
};

export const getNextExam = async (): Promise<Exam | null> => {
  const { data, error } = await supabase
    .from('upcoming_exams')
    .select('*')
    .limit(1);
  
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
};

export const getExamsForDay = async (date: string): Promise<Exam[]> => {
  const { data, error } = await supabase
    .from('exams')
    .select(`
      *,
      subjects:subject_id (name, color)
    `)
    .eq('date', date)
    .order('time');
  
  if (error) throw error;
  return data || [];
};

export const getExamsForWeek = async (startDate: string, endDate: string): Promise<Exam[]> => {
  const { data, error } = await supabase
    .from('exams')
    .select(`
      *,
      subjects:subject_id (name, color)
    `)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')
    .order('time');
  
  if (error) throw error;
  return data || [];
};

export const createExam = async (examData: Omit<Exam, 'id' | 'created_at' | 'updated_at' | 'subjects' | 'days_remaining'>): Promise<Exam> => {
  const { data, error } = await supabase
    .from('exams')
    .insert([examData])
    .select(`
      *,
      subjects:subject_id (name, color)
    `);
  
  if (error) throw error;
  return data[0];
};

export const updateExam = async (id: string, examData: Partial<Omit<Exam, 'id' | 'created_at' | 'updated_at' | 'subjects' | 'days_remaining'>>): Promise<Exam> => {
  const { data, error } = await supabase
    .from('exams')
    .update(examData)
    .eq('id', id)
    .select(`
      *,
      subjects:subject_id (name, color)
    `);
  
  if (error) throw error;
  return data[0];
};

export const deleteExam = async (id: string): Promise<{ message: string }> => {
  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return { message: 'Exam deleted successfully' };
};