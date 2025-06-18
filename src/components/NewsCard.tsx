import React from 'react'
import { motion } from 'framer-motion'
import { AINews } from '@/lib/supabase'
import styles from './NewsCard.module.css'

interface NewsCardProps {
  news: AINews
}

export default function NewsCard({ news }: NewsCardProps) {
  const getPlatformIcon = () => {
    switch (news.platform) {
      case 'Reddit':
        return '🔴'
      case 'X':
        return '🐦'
      default:
        return '📰'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 5) return '#4CAF50'
    if (score >= 3) return '#FFC107'
    return '#F44336'
  }

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.header}>
        <span className={styles.platform}>
          {getPlatformIcon()} {news.platform}
        </span>
        <span 
          className={styles.score}
          style={{ backgroundColor: getScoreColor(news.score) }}
        >
          Score: {news.score}
        </span>
      </div>

      <h3 className={styles.title}>
        <a href={news.url} target="_blank" rel="noopener noreferrer">
          {news.title}
        </a>
      </h3>

      <p className={styles.content}>
        {news.content.length > 200
          ? `${news.content.substring(0, 200)}...`
          : news.content}
      </p>

      <div className={styles.footer}>
        <span className={styles.date}>
          {new Date(news.date).toLocaleDateString()}
        </span>
        {news.category && (
          <span className={styles.category}>
            {news.category}
          </span>
        )}
      </div>
    </motion.div>
  )
} 