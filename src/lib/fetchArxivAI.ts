import Parser from 'rss-parser';
import { NewsItem } from '../types/news';

const parser = new Parser({
  headers: {
    'User-Agent': 'AI-SCRAPPER/1.0'
  },
  timeout: 10000 // 10 second timeout
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchArxivAI(): Promise<NewsItem[]> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Attempting to fetch arXiv AI (attempt ${attempt}/${MAX_RETRIES})...`);
      const feed = await parser.parseURL('https://export.arxiv.org/rss/cs.AI');
      
      if (!feed.items || feed.items.length === 0) {
        console.log('No items found in arXiv feed');
        return [];
      }
      
      return feed.items.map(item => ({
        title: item.title || '',
        url: item.link || '',
        source: 'arxiv',
        created_at: item.pubDate || new Date().toISOString(),
      }));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Error fetching arXiv AI (attempt ${attempt}/${MAX_RETRIES}):`, lastError);
      
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY}ms...`);
        await delay(RETRY_DELAY);
      }
    }
  }
  
  console.error('All attempts to fetch arXiv AI failed:', lastError);
  return [];
}
