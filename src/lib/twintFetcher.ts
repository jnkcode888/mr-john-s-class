import { NewsItem } from '../types/news';
import fs from 'fs/promises';
import path from 'path';

export async function fetchTwintData(): Promise<NewsItem[]> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'twint.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const tweets = JSON.parse(data);
    
    return tweets.map((tweet: any) => ({
      title: tweet.tweet,
      url: `https://twitter.com/user/status/${tweet.id_str}`,
      source: 'twint' as const,
      created_at: tweet.created_at,
    }));
  } catch (error) {
    console.error('Error fetching Twint data:', error);
    return [];
  }
} 