import { NextResponse } from 'next/server'
import { TwitterApi } from 'twitter-api-v2'

export async function GET() {
  try {
    console.log('Initializing Twitter client...')
    const twitter = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
    })

    console.log('Checking environment variables...')
    console.log({
      hasApiKey: !!process.env.TWITTER_API_KEY,
      hasApiSecret: !!process.env.TWITTER_API_SECRET,
      hasAccessToken: !!process.env.TWITTER_ACCESS_TOKEN,
      hasAccessSecret: !!process.env.TWITTER_ACCESS_TOKEN_SECRET,
    })

    console.log('Fetching OpenAI user...')
    const user = await twitter.v2.userByUsername('OpenAI')
    
    if (!user.data) {
      console.log('OpenAI account not found')
      return NextResponse.json(
        { error: 'Could not find OpenAI account' },
        { status: 404 }
      )
    }

    console.log('Fetching tweets...')
    const tweets = await twitter.v2.userTimeline(user.data.id, {
      max_results: 1,
      'tweet.fields': ['created_at', 'public_metrics']
    })

    console.log('Successfully fetched data')
    return NextResponse.json({
      success: true,
      user: user.data,
      tweet: tweets.data.data?.[0] || null
    })
  } catch (error) {
    console.error('Twitter API test error:', error)
    
    // Enhanced error details
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      // Add any additional error properties that might be helpful
      ...(error as any)
    }

    return NextResponse.json(
      { 
        error: 'Failed to connect to Twitter API',
        details: errorDetails
      },
      { status: 500 }
    )
  }
} 