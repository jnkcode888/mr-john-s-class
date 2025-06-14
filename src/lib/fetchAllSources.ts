import { createClient } from '@supabase/supabase-js';
import { fetchRedditApi } from './redditApi';
import { fetchRedditRss } from './redditRss';
import { fetchTwintData } from './twintFetcher';
import { scrapeMarktechpost } from './scrapeMarktechpost';
import { fetchHackerNews } from './fetchHackerNews';
import { fetchGoogleNews } from './fetchGoogleNews';
import { fetchArxivAI } from './fetchArxivAI';
import { fetchTheDecoder } from './fetchTheDecoder';
import { fetchVentureBeat } from './fetchVentureBeat';
import { deduplicateNews } from './utils';
import { NewsItem } from '../types/news';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function logError(source: string, error: any) {
  await supabase.from('scrape_logs').insert({
    message: error?.message || String(error) || 'Unknown error',
    source,
    created_at: new Date().toISOString(),
  });
}

async function storeNews(news: NewsItem[]) {
  const { error } = await supabase.from('ai_news').insert(news);
  if (error) {
    console.error('Error storing news:', error);
    throw error;
  }
}

export async function fetchAllSources(): Promise<void> {
  const sources = [
    { name: 'reddit-api', fetcher: fetchRedditApi },
    { name: 'reddit-rss', fetcher: fetchRedditRss },
    { name: 'twint', fetcher: fetchTwintData },
    { name: 'marktechpost', fetcher: scrapeMarktechpost },
    { name: 'hackernews', fetcher: fetchHackerNews },
    { name: 'googlenews', fetcher: fetchGoogleNews },
    { name: 'arxiv', fetcher: fetchArxivAI },
    { name: 'the-decoder', fetcher: fetchTheDecoder },
    { name: 'venturebeat', fetcher: fetchVentureBeat },
  ];

  let allNews: NewsItem[] = [];

  for (const source of sources) {
    try {
      const news = await source.fetcher();
      allNews = [...allNews, ...news];
    } catch (error) {
      await logError(source.name, error);
      // Continue with next fetcher
    }
  }

  try {
    const uniqueNews = deduplicateNews(allNews);
    await storeNews(uniqueNews);
  } catch (error) {
    console.error('Error in final processing:', error);
    await logError('final-processing', error);
  }
} 