import { supabase } from './supabase'

export async function initDatabase() {
  const { error } = await supabase
    .from('ai_news')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error checking database:', error)
    return false
  }

  return true
}

// SQL to create the table (run this in Supabase SQL editor):
/*
create table ai_news (
  id uuid primary key default uuid_generate_v4(),
  platform text not null,
  title text not null,
  content text not null,
  url text not null unique,
  date timestamp with time zone not null,
  category text,
  score integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Create an index on the url column for faster lookups
create index ai_news_url_idx on ai_news(url);

-- Create an index on the date column for faster sorting
create index ai_news_date_idx on ai_news(date);

-- Create an index on the score column for faster filtering
create index ai_news_score_idx on ai_news(score);
*/ 