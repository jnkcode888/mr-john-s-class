import { createClient } from '@supabase/supabase-js'

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