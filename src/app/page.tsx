'use client'

import { useNews } from '@/hooks/useNews'
import NewsCard from '@/components/NewsCard'
import TopStories from '@/components/TopStories'
import Link from 'next/link'
import styles from './page.module.css'
import { motion } from 'framer-motion'

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
        <motion.div className={styles.header} initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, type: 'spring' }}>
          <span className={styles.logo}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#6366f1"/><path d="M8 12l2.5 2.5L16 9" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            AI Trend Radar
          </span>
          <Link href="/weekly-script" className={styles.weeklyLink}>
            Weekly Script
          </Link>
        </motion.div>

        <motion.div className={styles.sectionCard} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <TopStories stories={todayStories} />
        </motion.div>

        <motion.div className={styles.tabs} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
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
        </motion.div>

        <motion.div className={styles.sectionCard} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={{ marginBottom: 24 }}>
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
            <motion.button 
              className={styles.refresh}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.04 }}
              onClick={refreshNews}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Now'}
            </motion.button>
          </div>
        </motion.div>

        {error && (
          <motion.div className={styles.error} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {error}
          </motion.div>
        )}

        <motion.div className={styles.sectionCard} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
          <div className={styles.content}>
            {loading ? (
              <div className={styles.loading}>Loading...</div>
            ) : news.length === 0 ? (
              <div className={styles.empty}>No news found</div>
            ) : (
              news.map((item) => (
                <motion.div key={item.id} className={styles.newsCard} whileHover={{ y: -4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <NewsCard news={item} />
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </main>
  )
} 