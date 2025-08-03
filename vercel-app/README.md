# Sidetool LLMs.txt Generator Dashboard

A web dashboard for generating and managing LLMs.txt files for sidetool.co, deployed on Vercel.

## Features

- 🚀 One-click generation of llms.txt files
- 📁 View and download generated files by date
- 📊 Generation history tracking
- 👀 Preview files directly in browser
- 🔒 Secure API route for Supabase function calls

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase service role key
```

3. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Deploy to Vercel

### Option 1: Deploy with Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables:
```bash
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add SUPABASE_FUNCTION_URL
```

### Option 2: Deploy with Git

1. Push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

2. Import to Vercel:
- Go to [vercel.com/new](https://vercel.com/new)
- Import your GitHub repository
- Add environment variables in the Vercel dashboard

## Environment Variables

Required environment variables:

- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `SUPABASE_FUNCTION_URL`: Your Supabase Edge Function URL (default: https://gytlhmhrthpackunppjd.supabase.co/functions/v1/generate-llmstxt)

## Project Structure

```
vercel-app/
├── app/
│   ├── api/
│   │   └── generate/     # API route for triggering generation
│   ├── page.tsx          # Main dashboard UI
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── package.json
├── next.config.js
├── tailwind.config.ts
└── vercel.json           # Vercel configuration
```

## How It Works

1. **Frontend (app/page.tsx)**: React dashboard with Tailwind CSS
2. **API Route (app/api/generate)**: Securely calls Supabase Edge Function
3. **Supabase Integration**: Reads generation history and file URLs
4. **File Storage**: Files stored in Supabase Storage with public access

## URLs

Once deployed, your dashboard will be available at:
- Production: `https://your-app.vercel.app`
- Preview: `https://your-app-git-branch.vercel.app`

Generated files are stored at:
- `https://gytlhmhrthpackunppjd.supabase.co/storage/v1/object/public/llms-files/sidetool/[date]/llms.txt`
- `https://gytlhmhrthpackunppjd.supabase.co/storage/v1/object/public/llms-files/sidetool/[date]/llms-full.txt`

## Support

For issues or questions:
- Check Supabase function logs
- Verify environment variables in Vercel dashboard
- Ensure Supabase Edge Function is deployed and working