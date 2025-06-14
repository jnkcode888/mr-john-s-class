import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
const Snoowrap = require('snoowrap')
import { fetchAllSources } from '@/lib/fetchAllSources'
import { fetchHackerNews } from '@/lib/fetchHackerNews'
import { fetchGoogleNews } from '@/lib/fetchGoogleNews'
import { fetchArxivAI } from '@/lib/fetchArxivAI'
import { fetchTheDecoder } from '@/lib/fetchTheDecoder'
import { fetchVentureBeat } from '@/lib/fetchVentureBeat'
import { fetchRedditApi } from '@/lib/redditApi'
import { fetchRedditRss } from '@/lib/redditRss'
import { fetchTwintData } from '@/lib/twintFetcher'
import { scrapeMarktechpost } from '@/lib/scrapeMarktechpost'
import { deduplicateNews } from '@/lib/utils'
import { TwitterApi } from 'twitter-api-v2'

// Initialize Reddit client
const reddit = new Snoowrap({
  userAgent: 'AI-SCRAPPER/1.0 (by /u/Intelligent_Tip9828)',
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD
})

// Initialize Twitter client
const twitter = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
})

// Test Reddit authentication
async function testRedditAuth() {
  try {
    console.log('Testing Reddit authentication...')
    console.log('Environment variables check:', {
      hasClientId: !!process.env.REDDIT_CLIENT_ID,
      hasClientSecret: !!process.env.REDDIT_CLIENT_SECRET,
      hasUsername: !!process.env.REDDIT_USERNAME,
      hasPassword: !!process.env.REDDIT_PASSWORD
    })
    
    await reddit.getMe()
    console.log('Reddit authentication successful')
    return true
  } catch (error) {
    console.error('Reddit authentication failed:', error)
    return false
  }
}

async function scrapeReddit() {
  console.log('Starting Reddit scraping...')
  
  // Test authentication first
  const isAuthenticated = await testRedditAuth()
  if (!isAuthenticated) {
    throw new Error('Reddit authentication failed')
  }

  const subreddits = ['ArtificialIntelligence', 'MachineLearning', 'ChatGPT', 'TechNews']
  const posts = []

  try {
    for (const subreddit of subreddits) {
      console.log(`Scraping r/${subreddit}...`)
      try {
        // Add a delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const subredditPosts = await reddit.getSubreddit(subreddit).getNew({ limit: 10 })
        console.log(`Found ${subredditPosts.length} posts in r/${subreddit}`)
        posts.push(...subredditPosts)
      } catch (error) {
        console.error(`Error scraping r/${subreddit}:`, error)
        // Continue with next subreddit even if one fails
        continue
      }
    }
  } catch (error) {
    console.error('Error in scrapeReddit:', error)
    throw error
  }

  return posts.map(post => ({
    platform: 'Reddit' as const,
    title: post.title,
    content: post.selftext || post.title,
    url: `https://reddit.com${post.permalink}`,
    date: new Date(post.created_utc * 1000).toISOString(),
    score: calculateScore(post.title + (post.selftext || ''))
  }))
}

// Temporarily disabled due to Twitter API quota limits
async function scrapeX() {
  // Twitter scraping is skipped for now due to API usage cap
  return []
}

function calculateScore(text: string): number {
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

export async function GET() {
  try {
    const fetchers = [
      fetchRedditApi,
      fetchRedditRss,
      fetchTwintData,
      scrapeMarktechpost,
      fetchHackerNews,
      fetchGoogleNews,
      fetchArxivAI,
      fetchTheDecoder,
      fetchVentureBeat,
    ];
    const results = await Promise.allSettled(fetchers.map(fn => fn()));
    const allNews = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    const uniqueNews = deduplicateNews(allNews);

    // Map all news items to the ai_news table schema
    const mappedNews = uniqueNews.map(item => ({
      platform: item.source === 'reddit-api' ? 'Reddit' :
                item.source === 'reddit-rss' ? 'Reddit' :
                item.source === 'twint' ? 'X' :
                item.source === 'marktechpost' ? 'Marktechpost' :
                item.source === 'hackernews' ? 'HackerNews' :
                item.source === 'googlenews' ? 'GoogleNews' :
                item.source === 'arxiv' ? 'arXiv' :
                item.source === 'the-decoder' ? 'TheDecoder' :
                item.source === 'venturebeat' ? 'VentureBeat' : 'Unknown',
      title: item.title,
      content: item.title, // fallback, since NewsItem has no content
      url: item.url,
      date: item.created_at, // fallback, since NewsItem has no date
      category: null,
      score: 0,
      created_at: item.created_at,
    }));

    if (mappedNews.length > 0) {
      const { error } = await supabase.from('ai_news').insert(mappedNews);
      if (error) {
        await supabase.from('scrape_logs').insert({
          message: error.message || 'Insert error',
          source: 'insert',
          created_at: new Date().toISOString(),
        });
        throw error;
      }
    }
    // Log any fetcher errors
    await Promise.all(results.map((r, i) => {
      if (r.status === 'rejected') {
        return supabase.from('scrape_logs').insert({
          message: r.reason?.message || 'Fetcher error',
          source: fetchers[i].name,
          created_at: new Date().toISOString(),
        });
      }
      return Promise.resolve();
    }));
    return NextResponse.json({
      success: true,
      count: mappedNews.length,
      sources: fetchers.length
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    await supabase.from('scrape_logs').insert({
      message: errMsg,
      source: 'GET-handler',
      created_at: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Failed to scrape data', details: errMsg },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await fetchAllSources();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in scrape API route:', error);
    return NextResponse.json(
      { error: 'Failed to scrape news' },
      { status: 500 }
    );
  }
} 