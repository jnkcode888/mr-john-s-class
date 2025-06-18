import * as cheerio from 'cheerio';
import { NewsItem } from '../types/news';

export async function scrapeMarktechpost(): Promise<NewsItem[]> {
  try {
    const response = await fetch('https://www.marktechpost.com/');
    const html = await response.text();
    const $ = cheerio.load(html);
    const news: NewsItem[] = [];

    $('article').each((_, element) => {
      const title = $(element).find('h2').text().trim();
      const url = $(element).find('a').attr('href') || '';
      const date = $(element).find('time').attr('datetime') || new Date().toISOString();

      if (title && url) {
        news.push({
          title,
          url,
          source: 'marktechpost' as const,
          created_at: date,
        });
      }
    });

    return news;
  } catch (error) {
    console.error('Error scraping Marktechpost:', error);
    return [];
  }
} 