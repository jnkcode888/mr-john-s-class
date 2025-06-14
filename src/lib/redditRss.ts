import Parser from 'rss-parser';
import { NewsItem } from '../types/news';

const parser = new Parser();

export async function fetchRedditRss(subreddit: string = 'ArtificialIntelligence'): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(`https://www.reddit.com/r/${subreddit}/.rss`);
    
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