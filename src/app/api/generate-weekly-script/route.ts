import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function generateScriptWithLLM(llm: string, prompt: string) {
  try {
    if (llm === 'openai') {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      })
      const script = completion.choices[0].message.content
      if (!script) throw new Error('No script returned from OpenAI')
      return { llm, status: 'success', script_text: script }
    } else if (llm === 'mistral' || llm === 'llama3' || llm === 'zephyr') {
      // Use Ollama API
      const model = llm
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: false })
      })
      if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`)
      const data = await res.json()
      if (!data.response) throw new Error('No script returned from Ollama')
      return { llm, status: 'success', script_text: data.response }
    } else {
      return { llm, status: 'error', error: `Unknown LLM: ${llm}` }
    }
  } catch (err) {
    return {
      llm,
      status: 'error',
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

function calculateViralScore(story: any) {
  let score = 0
  
  // Base engagement scores
  if (story.platform === 'Reddit') {
    score += (story.score || 0) * 0.5
  } else if (story.platform === 'X') {
    score += (story.score || 0) * 0.3
  }
  
  // Tool launch bonus
  if (story.category === 'tool') {
    score += 30
  }
  
  // Major company bonus
  const majorCompanies = ['OpenAI', 'Google', 'Meta', 'GPT']
  if (majorCompanies.some(company => story.title.includes(company))) {
    score += 10
  }
  
  // Controversy bonus
  const controversyWords = ['bias', 'lawsuit', 'ban', 'replace', 'job loss']
  const content = `${story.title} ${story.content}`.toLowerCase()
  if (controversyWords.some(word => content.includes(word))) {
    score += 20
  }
  
  return score
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const llmParam = url.searchParams.get('llm')
    const llms = llmParam ? [llmParam] : ['openai', 'mistral', 'llama3', 'zephyr']

    // Get news from the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: news, error: newsError } = await supabase
      .from('ai_news')
      .select('*')
      .gte('date', sevenDaysAgo.toISOString())
      .order('date', { ascending: false })
    
    if (newsError) {
      console.error('Error fetching news:', newsError)
      throw newsError
    }

    if (!news || news.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No news found in the last 7 days'
      }, { status: 404 })
    }
    
    // Calculate viral scores and sort
    const scoredNews = news.map(story => ({
      ...story,
      viral_score: calculateViralScore(story)
    }))
    
    const topStories = scoredNews
      .sort((a, b) => b.viral_score - a.viral_score)
      .slice(0, 3)
    
    if (topStories.length < 3) {
      return NextResponse.json({
        success: false,
        error: 'Not enough stories to generate a script'
      }, { status: 400 })
    }

    // Generate script using OpenAI
    const prompt = `You're a viral tech content creator. Based on these 3 stories, write a 1-minute Instagram Reel script. Make it casual, catchy, and informative. Include:
- An engaging hook at the start
- A punchy summary of each story
- A CTA at the end (e.g. "Follow for weekly AI news before it trends")

Here are the stories:
1. ${topStories[0].title} - ${topStories[0].content}
2. ${topStories[1].title} - ${topStories[1].content}
3. ${topStories[2].title} - ${topStories[2].content}`
    
    // Run all LLMs in parallel, fault-tolerant
    const results = await Promise.allSettled(
      llms.map(llm => generateScriptWithLLM(llm, prompt))
    )

    // Save each result to weekly_scripts
    for (const r of results) {
      if (r.status === 'fulfilled') {
        const { llm, status, script_text, error } = r.value
        await supabase.from('weekly_scripts').insert({
          llm,
          status,
          script_text: script_text || null,
          error: error || null,
          stories_used: topStories,
          created_at: new Date().toISOString()
        })
      } else {
        // Should not happen, but log if it does
        console.error('Promise rejected:', r.reason)
      }
    }

    // Prepare response
    const scripts = results.map(r =>
      r.status === 'fulfilled' ? r.value : { status: 'error', error: String(r.reason) }
    )
    return NextResponse.json({ scripts })
  } catch (error) {
    console.error('Error generating weekly scripts:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate scripts'
      },
      { status: 500 }
    )
  }
} 