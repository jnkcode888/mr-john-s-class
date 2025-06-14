import Snoowrap from 'snoowrap';
import { NewsItem } from '../types/news';
import { fetchRedditRss } from './redditRss';

const reddit = new Snoowrap({
  userAgent: 'AI-Trend-Radar/1.0 (by /u/Intelligent_Tip9828)',
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD,
});

export async function fetchRedditApi(): Promise<NewsItem[]> {
  try {
    console.log('Attempting to fetch from Reddit API...');
    console.log('Environment variables check:', {
      hasClientId: !!process.env.REDDIT_CLIENT_ID,
      hasClientSecret: !!process.env.REDDIT_CLIENT_SECRET,
      hasUsername: !!process.env.REDDIT_USERNAME,
      hasPassword: !!process.env.REDDIT_PASSWORD
    });

    const posts = await reddit.getSubreddit('technology').getHot({ limit: 25 });
    console.log('Successfully fetched posts from Reddit API');
    
    if (!Array.isArray(posts)) {
      console.error('Reddit API did not return an array:', posts);
      return [];
    }
    return posts.map(post => ({
      title: post.title,
      url: post.url,
      source: 'reddit-api' as const,
      created_at: new Date(post.created_utc * 1000).toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching from Reddit API:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    try {
      console.log('Attempting to fetch from Reddit RSS as fallback...');
      return await fetchRedditRss('technology');
    } catch (rssError) {
      console.error('Error fetching from Reddit RSS as fallback:', rssError);
      return [];
    }
  }
} 