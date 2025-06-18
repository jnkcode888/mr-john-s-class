import React from 'react'
import { AINews } from '@/lib/supabase'
import { motion } from 'framer-motion'
import styles from './TopStories.module.css'

interface TopStoriesProps {
  stories: AINews[]
}

export default function TopStories({ stories }: TopStoriesProps) {
  if (stories.length === 0) return null

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className={styles.title}>
        🔥 Top Stories Today
      </h2>
      <div className={styles.stories}>
        {stories.slice(0, 3).map((story, index) => (
          <motion.div
            key={story.id}
            className={styles.story}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className={styles.rank}>#{index + 1}</div>
            <h3 className={styles.storyTitle}>
              <a href={story.url} target="_blank" rel="noopener noreferrer">
                {story.title}
              </a>
            </h3>
            <div className={styles.meta}>
              <span className={styles.platform}>
                {story.platform === 'Reddit' ? '🔴' : '🐦'} {story.platform}
              </span>
              <span className={styles.score}>
                Score: {story.score}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
} 