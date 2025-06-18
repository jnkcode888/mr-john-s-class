'use client'

import { Link } from 'react-router-dom'
import styles from './page.module.css'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <motion.div 
          className={styles.header} 
          initial={{ y: -40, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.6, type: 'spring' }}
        >
          <span className={styles.logo}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#6366f1"/>
              <path d="M8 12l2.5 2.5L16 9" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Mr. John's Class
          </span>
        </motion.div>

        <motion.div 
          className={styles.content}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1>Welcome to Mr. John's Class</h1>
          <p>Your learning journey starts here</p>
          
          <div className={styles.buttons}>
            <Link to="/units" className={styles.button}>
              View Units
            </Link>
            <Link to="/assignments" className={styles.button}>
              View Assignments
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
} 