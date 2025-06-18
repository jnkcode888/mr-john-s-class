import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AINews } from '@/lib/supabase'
import { filterNews, sortNews } from '@/lib/utils'

export function useNews() {
  const [news, setNews] = useState<AINews[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [platform, setPlatform] = useState<string>('all')
  const [category, setCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date')

  useEffect(() => {
    fetchNews()
  }, [])

  async function fetchNews() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('ai_news')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error

      setNews(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news')
    } finally {
      setLoading(false)
    }
  }

  async function refreshNews() {
    try {
      setLoading(true)
      const response = await fetch('/api/scrape')
      if (!response.ok) throw new Error('Failed to refresh news')
      await fetchNews()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh news')
    } finally {
      setLoading(false)
    }
  }

  const filteredNews = filterNews(
    news,
    platform === 'all' ? undefined : platform,
    category || undefined,
    searchQuery || undefined
  )

  const sortedNews = sortNews(filteredNews, sortBy)

  return {
    news: sortedNews,
    loading,
    error,
    platform,
    setPlatform,
    category,
    setCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    refreshNews
  }
} 