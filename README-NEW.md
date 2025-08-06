# LLMs.txt Generator - Transform Websites into AI-Ready Content

A powerful web application that generates standardized `llms.txt` and `llms-full.txt` files from any website, making content discoverable and usable by AI systems. Built with Next.js, Supabase, Firecrawl, and OpenAI.

## Features

- **User Authentication**: Secure sign-up/login with email, Google, or GitHub OAuth
- **Domain Processing**: Input any website domain for automatic content extraction
- **Smart Crawling**: Powered by Firecrawl for efficient URL discovery and content extraction
- **AI Summaries**: GPT-4o-mini generates concise titles and descriptions for each page
- **Batch Processing**: Parallel processing of multiple URLs for optimal performance
- **Real-time Progress**: Live updates on crawling and processing status
- **File Generation**: Creates both `llms.txt` (indexed summary) and `llms-full.txt` (complete content)
- **Download & Export**: Easy download of generated files for immediate use
- **Job History**: Track all your previous generations with detailed statistics

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Edge Functions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with OAuth providers
- **Web Crawling**: Firecrawl API
- **AI Processing**: OpenAI GPT-4o-mini
- **Email**: Resend (optional)
- **Monitoring**: Sentry (optional)

## Getting Started

### Prerequisites

1. Node.js 16+ installed
2. Supabase account and project
3. Firecrawl API key
4. OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/llmstxt-generator.git
cd llmstxt-generator
```

2. Install dependencies:
```bash
cd vercel-app
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual keys:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
FIRECRAWL_API_KEY=your-firecrawl-key
OPENAI_API_KEY=your-openai-key
```

4. Run database migrations:
```bash
cd ../supabase
supabase db push
```

5. Start the development server:
```bash
cd ../vercel-app
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Database Schema

The app uses the following main tables:

- `users`: User accounts and settings
- `crawl_jobs`: Website crawling jobs and their status
- `crawled_urls`: Individual URL processing records
- `generated_files`: Generated llms.txt and llms-full.txt files
- `api_usage`: API usage tracking for billing

## API Endpoints

### POST `/api/crawl/start`
Starts a new crawl job for a domain.

**Request Body:**
```json
{
  "domain": "example.com",
  "max_pages": 20,
  "user_id": "uuid"
}
```

### GET `/api/jobs/[id]`
Retrieves job details and generated files.

### POST `/api/download/[fileId]`
Downloads a generated file.

## File Formats

### llms.txt
A concise index file with titles and descriptions:
```
# example.com - LLMs.txt

Generated: 2024-01-01T00:00:00Z
Total Pages: 10

## Pages

- [Home Page](https://example.com): Welcome to our website
- [About Us](https://example.com/about): Learn more about our company
- [Products](https://example.com/products): Browse our product catalog
```

### llms-full.txt
Complete content from all crawled pages:
```
# example.com - Complete Content

Generated: 2024-01-01T00:00:00Z
Total Pages: 10

---

## https://example.com

**Title:** Home Page
**Description:** Welcome to our website

### Content

[Full markdown content of the page]

---

## https://example.com/about

[Content continues for all pages]
```

## Deployment

### Vercel Deployment

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Supabase Setup

1. Create new Supabase project
2. Run migrations from `supabase/migrations/`
3. Enable authentication providers (Google, GitHub)
4. Configure Row Level Security policies

## Configuration

### Crawl Limits

Default limits can be adjusted:
- Free tier: 20 pages per crawl
- Pro tier: 100 pages per crawl
- Enterprise: 200+ pages per crawl

### Batch Processing

Adjust batch size in `/api/crawl/start/route.ts`:
```typescript
const batchSize = 10 // Process 10 URLs in parallel
```

## Performance Optimization

- **Parallel Processing**: URLs are processed in batches for speed
- **Caching**: Implement Redis caching for frequently accessed domains
- **Rate Limiting**: Respect Firecrawl and OpenAI rate limits
- **Database Indexes**: Optimized queries with proper indexing

## Error Handling

The app includes comprehensive error handling:
- Failed URL retries
- Graceful degradation for AI summaries
- User notifications for job failures
- Detailed error logging

## Security

- Row Level Security (RLS) on all tables
- API key encryption at rest
- Rate limiting per user
- Input validation and sanitization
- CORS configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Open an issue on GitHub
- Email: support@llmstxt-generator.com
- Documentation: https://docs.llmstxt-generator.com

## Roadmap

- [ ] Webhook notifications
- [ ] Scheduled crawling
- [ ] Custom extraction rules
- [ ] API access for programmatic use
- [ ] Team collaboration features
- [ ] Advanced analytics dashboard
- [ ] Multiple output formats (JSON, CSV)
- [ ] Integration with popular CMSs

## Acknowledgments

- [Firecrawl](https://firecrawl.dev) for web crawling
- [OpenAI](https://openai.com) for AI processing
- [Supabase](https://supabase.com) for backend infrastructure
- [Vercel](https://vercel.com) for hosting