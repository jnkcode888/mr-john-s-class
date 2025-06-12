import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export type Quiz = {
  id: string;
  title: string;
  created_at: string;
};

export type Question = {
  id: string;
  quiz_id: string;
  question_text: string;
  choices: string[];
  correct_choice: number;
  created_at: string;
};

export type Submission = {
  id: string;
  quiz_id: string;
  name: string;
  admission_number: string;
  answers: Record<string, number>;
  submitted_at: string;
};

export type Assignment = {
  id: string;
  title: string;
  description: string;
  created_at: string;
};

export type AssignmentSubmission = {
  id: string;
  assignment_id: string;
  student_name: string;
  admission_number: string;
  document_url: string;
  created_at: string;
}; 