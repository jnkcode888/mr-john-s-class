<<<<<<< HEAD
import { createClient } from '@supabase/supabase-js'

console.log('SUPABASE URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('SUPABASE ANON KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type AINews = {
  id: string
  platform: 'Reddit' | 'X'
  title: string
  content: string
  url: string
  date: string
  category?: string
  score: number
} 
=======
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
<<<<<<< HEAD
};

export type UnitNote = {
  id: string;
  unit_id: number;
  title: string;
  content: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
}; 
=======
}; 
>>>>>>> c9ca1037197d8a1326b6d955efc446e7daa61831
>>>>>>> 7b604636c6d13cc306161fdf158c649cf2097a2c
