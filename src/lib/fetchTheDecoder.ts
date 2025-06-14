import * as cheerio from 'cheerio';
import { NewsItem } from '../types/news';

export async function fetchTheDecoder(): Promise<NewsItem[]> {
  try {
    const response = await fetch('https://the-decoder.com/');
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
          url: url.startsWith('http') ? url : `https://the-decoder.com${url}`,
          source: 'the-decoder',
          created_at: date,
        });
      }
    });
    return news;
  } catch (error) {
    console.error('Error scraping The Decoder:', error);
    return [];
  }
}
