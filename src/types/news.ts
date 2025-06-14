export interface NewsItem {
  title: string;
  url: string;
  source: 'reddit-api' | 'reddit-rss' | 'twint' | 'marktechpost' | 'hackernews' | 'googlenews' | 'arxiv' | 'the-decoder' | 'venturebeat';
  created_at: string;
} 