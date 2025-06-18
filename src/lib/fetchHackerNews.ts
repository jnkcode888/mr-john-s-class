import Parser from 'rss-parser';
import { NewsItem } from '../types/news';

const parser = new Parser();

export async function fetchHackerNews(): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL('https://hnrss.org/newest?q=AI');
    return feed.items.map(item => ({
      title: item.title || '',
      url: item.link || '',
      source: 'hackernews',
      created_at: item.pubDate || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching Hacker News:', error);
    return [];
  }
}
