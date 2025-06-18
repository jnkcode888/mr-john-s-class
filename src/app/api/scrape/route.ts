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

    // Execute all fetchers with individual error handling
    const results = await Promise.allSettled(
      fetchers.map(async (fn) => {
        try {
          return await fn();
        } catch (error) {
          console.error(`Error in fetcher ${fn.name}:`, error);
          // Log the error to Supabase
          await supabase.from('scrape_logs').insert({
            message: error instanceof Error ? error.message : 'Unknown error',
            source: fn.name,
            created_at: new Date().toISOString(),
          });
          return []; // Return empty array on error
        }
      })
    );

    // Process successful results
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

    // Only attempt to insert if we have news items
    if (mappedNews.length > 0) {
      try {
        // Use upsert instead of insert to handle duplicates
        const { error } = await supabase
          .from('ai_news')
          .upsert(mappedNews, {
            onConflict: 'url', // Use URL as the conflict key
            ignoreDuplicates: true // Ignore duplicates instead of updating
          });

        if (error) {
          console.error('Error upserting news:', error);
          await supabase.from('scrape_logs').insert({
            message: error.message || 'Upsert error',
            source: 'database',
            created_at: new Date().toISOString(),
          });
        } else {
          console.log(`Successfully processed ${mappedNews.length} news items`);
        }
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        await supabase.from('scrape_logs').insert({
          message: dbError instanceof Error ? dbError.message : 'Database operation failed',
          source: 'database',
          created_at: new Date().toISOString(),
        });
      }
    }

    // Return success even if some sources failed
    return NextResponse.json({
      success: true,
      count: mappedNews.length,
      sources: fetchers.length,
      successfulSources: results.filter(r => r.status === 'fulfilled').length,
      failedSources: results.filter(r => r.status === 'rejected').length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in scrape route:', error);
    
    await supabase.from('scrape_logs').insert({
      message: errMsg,
      source: 'GET-handler',
      created_at: new Date().toISOString(),
    });

    // Return a more graceful error response
    return NextResponse.json(
      { 
        success: false,
        error: 'Some sources failed to scrape',
        details: errMsg,
        timestamp: new Date().toISOString()
      },
      { status: 200 } // Return 200 instead of 500 to prevent client-side errors
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
      { 
        success: false,
        error: 'Failed to scrape news',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 200 } // Return 200 instead of 500
    );
  }
} 