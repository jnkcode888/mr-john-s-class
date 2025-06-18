import Parser from 'rss-parser';
import { NewsItem } from '../types/news';

const parser = new Parser({
  headers: {
    'User-Agent': 'AI-SCRAPPER/1.0 (by /u/Intelligent_Tip9828)'
  }
});

export async function fetchRedditRss(subreddit: string = 'ArtificialIntelligence'): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(`https://www.reddit.com/r/${subreddit}/new/.rss`);
    
    if (!feed.items || feed.items.length === 0) {
      console.log(`No items found in RSS feed for r/${subreddit}`);
      return [];
    }
    
    return feed.items.map(item => ({
      title: item.title || '',
      url: item.link || '',
      source: 'reddit-rss' as const,
      created_at: item.isoDate || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching from Reddit RSS:', error);
    return [];
  }
} 