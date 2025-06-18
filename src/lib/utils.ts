import { AINews } from './supabase'
import { NewsItem } from '../types/news'

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function calculateScore(text: string): number {
  const keywords = [
    'AI', 'artificial intelligence', 'machine learning', 'ML',
    'GPT', 'ChatGPT', 'OpenAI', 'new tool', 'launch', 'beta',
    'startup', 'research', 'breakthrough', 'innovation'
  ]
  
  let score = 0
  const lowerText = text.toLowerCase()
  
  keywords.forEach(keyword => {
    if (lowerText.includes(keyword.toLowerCase())) {
      score += 1
    }
  })
  
  return score
}

export function filterNews(
  news: AINews[],
  platform?: string,
  category?: string,
  searchQuery?: string
): AINews[] {
  return news.filter(item => {
    if (platform && item.platform !== platform) return false
    if (category && item.category !== category) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query)
      )
    }
    return true
  })
}

export function sortNews(news: AINews[], sortBy: 'date' | 'score' = 'date'): AINews[] {
  return [...news].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    }
    return b.score - a.score
  })
}

export function deduplicateNews(news: NewsItem[]): NewsItem[] {
  const seen = new Set();
  return news.filter(item => {
    const key = item.title.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
} 