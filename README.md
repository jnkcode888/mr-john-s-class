# AI Trend Radar

A full-stack web application that scrapes AI-related news and tool launches from Reddit and X (Twitter), stores them in Supabase, and displays them on a dynamic, mobile-friendly dashboard.

## Features

- Real-time scraping of AI news from Reddit and X
- Beautiful, responsive dashboard
- Filtering and search capabilities
- Score-based relevance ranking
- Mobile-friendly design

## Tech Stack

- Next.js (React)
- Supabase (PostgreSQL)
- Snoowrap (Reddit API)
- Framer Motion (Animations)
- Regular CSS (No Tailwind)

## Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file with the following variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   REDDIT_CLIENT_ID=your_reddit_client_id
   REDDIT_CLIENT_SECRET=your_reddit_client_secret
   REDDIT_USERNAME=your_reddit_username
   REDDIT_PASSWORD=your_reddit_password
   ```

4. Set up Supabase:

   - Create a new project
   - Create a table named `ai_news` with the following columns:
     - `id` (UUID, primary key)
     - `platform` (text)
     - `title` (text)
     - `content` (text)
     - `url` (text)
     - `date` (timestamp)
     - `category` (text, optional)
     - `score` (integer)

5. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

The application is designed to be deployed on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add your environment variables in the Vercel dashboard
4. Deploy!

## API Routes

- `/api/scrape` - Triggers the scraping process
  - Method: GET
  - Returns: JSON with success status and count of new items

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
