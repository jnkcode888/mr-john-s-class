import Parser from 'rss-parser';
import { NewsItem } from '../types/news';

const parser = new Parser();

export async function fetchGoogleNews(): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL('https://news.google.com/rss/search?q=artificial+intelligence');
    return feed.items.map(item => ({
      title: item.title || '',
      url: item.link || '',
      source: 'googlenews',
      created_at: item.pubDate || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching Google News:', error);
    return [];
  }
}
