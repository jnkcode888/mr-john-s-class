import Parser from 'rss-parser';
import { NewsItem } from '../types/news';

const parser = new Parser();

export async function fetchArxivAI(): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL('https://export.arxiv.org/rss/cs.AI');
    return feed.items.map(item => ({
      title: item.title || '',
      url: item.link || '',
      source: 'arxiv',
      created_at: item.pubDate || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching arXiv AI:', error);
    return [];
  }
}
