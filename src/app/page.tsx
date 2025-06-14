'use client'

import { useNews } from '@/hooks/useNews'
import NewsCard from '@/components/NewsCard'
import TopStories from '@/components/TopStories'
import styles from './page.module.css'

export default function Home() {
  const {
    news,
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
  } = useNews()

  // Get today's top stories
  const todayStories = news
    .filter(item => {
      const itemDate = new Date(item.date)
      const today = new Date()
      return itemDate.toDateString() === today.toDateString()
    })
    .sort((a, b) => b.score - a.score)

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>AI Trend Radar</h1>
        
        <TopStories stories={todayStories} />

        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${platform === 'all' ? styles.active : ''}`}
            onClick={() => setPlatform('all')}
          >
            All
          </button>
          <button 
            className={`${styles.tab} ${platform === 'Reddit' ? styles.active : ''}`}
            onClick={() => setPlatform('Reddit')}
          >
            Reddit
          </button>
          <button 
            className={`${styles.tab} ${platform === 'X' ? styles.active : ''}`}
            onClick={() => setPlatform('X')}
          >
            X
          </button>
        </div>

        <div className={styles.filters}>
          <select 
            className={styles.select}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="tool">New Tool</option>
            <option value="news">News</option>
            <option value="research">Research</option>
            <option value="startup">Startup</option>
          </select>
          
          <input 
            type="text" 
            placeholder="Search..." 
            className={styles.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <select
            className={styles.select}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
          >
            <option value="date">Sort by Date</option>
            <option value="score">Sort by Score</option>
          </select>
          
          <button 
            className={styles.refresh}
            onClick={refreshNews}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Now'}
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : news.length === 0 ? (
            <div className={styles.empty}>No news found</div>
          ) : (
            news.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))
          )}
        </div>
      </div>
    </main>
  )
} 