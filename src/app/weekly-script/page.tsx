'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './page.module.css'

interface Story {
  title: string
  content: string
}

interface WeeklyScript {
  id: string
  script_text: string
  stories_used: Story[]
  created_at: string
  llm?: string
  status?: string
  error?: string
}

export default function WeeklyScript() {
  const [script, setScript] = useState<WeeklyScript | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [topStories, setTopStories] = useState<Story[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [scriptFailed, setScriptFailed] = useState(false)
  const [fallbackPrompt, setFallbackPrompt] = useState('')

  async function fetchTopStories() {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { data, error } = await supabase
      .from('ai_news')
      .select('title, content')
      .gte('date', sevenDaysAgo.toISOString())
      .order('score', { ascending: false })
      .order('date', { ascending: false })
      .limit(3)
    if (error) return setTopStories([])
    setTopStories(data || [])
  }

  async function fetchLatestScript() {
    try {
      setLoading(true)
      setError(null)
      setDebugInfo(null)
      let data = null;
      let fetchError = null;
      let status = null;
      try {
        const res = await supabase
          .from('weekly_scripts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        data = res.data;
        fetchError = res.error;
        status = res.status;
      } catch (err) {
        if (err && typeof err === 'object' && 'status' in err && err.status === 406) {
          setError('No scripts found. Try generating one!');
          setLoading(false);
          return;
        } else {
          throw err;
        }
      }
      if (fetchError) {
        setDebugInfo(`Fetch error: ${JSON.stringify(fetchError)}`)
        if (fetchError.code === 'PGRST116' || status === 406) {
          setError('No scripts found. Try generating one!')
        } else {
          throw fetchError
        }
      } else if (!data) {
        setError('No scripts found. Try generating one!')
      } else {
        setScript(data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch script'
      setError(errorMessage)
      console.error('Error fetching script:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateScript() {
    setIsGenerating(true)
    setScriptFailed(false)
    setFallbackPrompt('')
    setCopySuccess(false)
    try {
      const response = await fetch('/api/generate-weekly-script')
      const data = await response.json()
      if (!response.ok || !data.scripts || !data.scripts.some((s: any) => s.status === 'success' && s.script_text)) {
        // LLM failed, show fallback
        setScriptFailed(true)
        await fetchTopStories()
        buildFallbackPrompt()
        setIsGenerating(false)
        return
      }
      // Find the first successful script
      const successScript = data.scripts.find((s: any) => s.status === 'success' && s.script_text)
      if (successScript) {
        setScript({
          id: '',
          script_text: successScript.script_text,
          stories_used: topStories,
          created_at: new Date().toISOString(),
          llm: successScript.llm,
          status: successScript.status,
          error: successScript.error
        })
        setScriptFailed(false)
      } else {
        setScriptFailed(true)
        await fetchTopStories()
        buildFallbackPrompt()
      }
    } catch (err) {
      setScriptFailed(true)
      await fetchTopStories()
      buildFallbackPrompt()
    } finally {
      setIsGenerating(false)
    }
  }

  function buildFallbackPrompt() {
    if (topStories.length === 0) {
      setFallbackPrompt('Not enough news stories found to generate a prompt.')
      return
    }
    const prompt = `You're a viral short-form content scriptwriter making 30–60 second Instagram Reels for Gen Z in Kenya 🇰🇪.

🎯 Your job: Turn the 3 AI news stories below into a fun, shocking, and simple script that:
- Starts with a BOLD HOOK that grabs attention in 2 seconds 😱😂🔥
- Sounds like a Kenyan friend explaining casually (use slang, emojis, Swanglish if needed)
- Uses short sentences, local flavor, and humor
- Breaks down each story in 2–3 lines (MAX)
- Formats the output like a voiceover script (1 idea per line, with line breaks)
- Ends with a catchy CTA like: "Follow for your weekly AI fix — usikose next one!"

💥 Format example:
> "Bro! AI just cloned my voice and almost scammed my mum 😳 Let me break it down real quick..."

[News 1 summary — simple, funny, shocking]

[News 2 summary — same]

[News 3 summary — same]

[Final CTA with attitude]

---

🧠 Use the following **story summaries ONLY** (don't add extra):

1. ${topStories[0]?.title}
- ${topStories[0]?.content}

2. ${topStories[1]?.title}
- ${topStories[1]?.content}

3. ${topStories[2]?.title}
- ${topStories[2]?.content}
`
    setFallbackPrompt(prompt)
  }

  async function copyFallbackPrompt() {
    try {
      await navigator.clipboard.writeText(fallbackPrompt)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      setCopySuccess(false)
    }
  }

  useEffect(() => {
    fetchLatestScript()
    fetchTopStories()
  }, [])

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Weekly AI News Script</h1>
        <div className={styles.stories}>
          <h2>Top Stories for Next Script</h2>
          {topStories.length === 0 ? (
            <div>No stories found in the last 7 days.</div>
          ) : (
            <ul>
              {topStories.map((story, index) => (
                <li key={story.title + index} className={styles.storyItem}>
                  <span className={styles.storyTitle}>{story.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <AnimatePresence>
          {scriptFailed && (
            <motion.div
              className={styles.fallbackBox}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.4 }}
            >
              <div className={styles.fallbackHeader}>⚠️ Script generation failed</div>
              <div className={styles.fallbackMsg}>
                No worries — copy this prompt and paste it into ChatGPT, DeepSeek, Poe, or your favorite LLM to get your weekly video script!
              </div>
              <textarea
                className={styles.fallbackPrompt}
                value={fallbackPrompt}
                readOnly
                rows={14}
              />
              <div className={styles.fallbackActions}>
                <button className={styles.button} onClick={copyFallbackPrompt}>
                  {copySuccess ? 'Copied!' : '📋 Copy Prompt'}
                </button>
                <button className={styles.button} onClick={handleGenerateScript} disabled={isGenerating}>
                  {isGenerating ? 'Generating...' : '🔄 Try Again'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {!scriptFailed && (
          <div className={styles.scriptBox}>
            <pre className={styles.scriptText}>{script?.script_text}</pre>
            <div className={styles.actions}>
              <button
                className={styles.button}
                onClick={async () => {
                  if (script?.script_text) {
                    await navigator.clipboard.writeText(script.script_text)
                    setCopySuccess(true)
                    setTimeout(() => setCopySuccess(false), 2000)
                  }
                }}
              >
                {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                className={styles.button}
                onClick={handleGenerateScript}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Regenerate Script'}
              </button>
            </div>
          </div>
        )}
        {error && !scriptFailed && <div className={styles.error}>{error}</div>}
      </div>
    </main>
  )
} 