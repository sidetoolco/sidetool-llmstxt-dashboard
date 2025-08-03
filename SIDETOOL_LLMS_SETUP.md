# 🤖 Sidetool.co LLMs.txt Automation Setup

Complete guide for automated daily generation and hosting of LLMs.txt files for sidetool.co.

## 🎯 Goal

Make your sidetool.co content (especially blog posts) discoverable by AI systems like ChatGPT and Perplexity by:
- Generating `llms.txt` and `llms-full.txt` daily
- Hosting them at `https://sidetool.co/llms.txt` and `https://sidetool.co/llms-full.txt`
- Focusing on blog content for maximum AI visibility

## 📋 Prerequisites

1. **GitHub Repository**: This repo connected to your sidetool.co deployment
2. **API Keys**:
   - Firecrawl API key (for web crawling)
   - OpenAI API key (for content summarization)
   - Supabase credentials (for backup storage)
3. **Vercel Deployment**: Your sidetool.co site deployed on Vercel

## 🚀 Setup Steps

### Step 1: Configure GitHub Secrets

Go to your GitHub repository settings → Secrets and variables → Actions, and add:

```
FIRECRAWL_API_KEY = your-firecrawl-api-key
OPENAI_API_KEY = your-openai-api-key
SUPABASE_URL = https://gytlhmhrthpackunppjd.supabase.co
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
```

### Step 2: Enable GitHub Actions

1. Go to Actions tab in your repository
2. Enable workflows if not already enabled
3. The workflow will run automatically:
   - Daily at 3 AM UTC
   - On manual trigger (Actions → Generate LLMs.txt Daily → Run workflow)

### Step 3: Configure Vercel to Serve Files

Ensure your Vercel deployment serves files from the `/public` directory at the root:

1. **For Next.js sites**: Files in `/public` are automatically served at root
2. **For other frameworks**: Configure static file serving

Add to your `vercel.json` if needed:
```json
{
  "rewrites": [
    {
      "source": "/llms.txt",
      "destination": "/public/llms.txt"
    },
    {
      "source": "/llms-full.txt",
      "destination": "/public/llms-full.txt"
    }
  ]
}
```

### Step 4: Test Manual Generation

Trigger a manual run to test:

1. Go to GitHub Actions
2. Click "Generate LLMs.txt Daily for Sidetool.co"
3. Click "Run workflow" → "Run workflow"
4. Monitor the progress

### Step 5: Verify Deployment

After the workflow completes:

```bash
# Run verification script
bash scripts/verify_llms_deployment.sh

# Or manually check
curl -I https://sidetool.co/llms.txt
curl -I https://sidetool.co/llms-full.txt
```

## 📊 What Gets Generated

### llms.txt (Index File)
- Lightweight index of all pages
- Format: Title, URL, Description
- ~50-100 KB typically
- Perfect for LLM discovery

Example:
```
# Sidetool Blog - How to Build Better Tools
URL: https://sidetool.co/blog/build-better-tools
Description: Learn the best practices for building developer tools that users love.

# Pricing - Sidetool Plans
URL: https://sidetool.co/pricing
Description: Flexible pricing plans for teams of all sizes.
```

### llms-full.txt (Content File)
- Complete content from all pages
- Includes first 5000 chars of each page
- ~500KB-1MB typically
- For deep content indexing

## 🔄 Daily Automation

The GitHub Action runs daily at 3 AM UTC and:

1. **Crawls sidetool.co** (up to 150 pages)
2. **Prioritizes blog content** for better AI training
3. **Generates summaries** using GPT-4o-mini
4. **Creates both files** in `/public` directory
5. **Commits to repository** triggering Vercel deployment
6. **Backs up to Supabase** for versioning
7. **Verifies deployment** and logs results

## 📈 Monitoring

### Check GitHub Actions
- Go to: https://github.com/sidetoolco/sidetool-llmstxt-dashboard/actions
- View run history and logs
- Get email notifications on failures

### Check File Freshness
```bash
# See when files were last updated
curl -I https://sidetool.co/llms.txt | grep -i last-modified
```

### Monitor in Dashboard
Visit your dashboard at: https://sidetool-llmstxt-dashboard.vercel.app
- See generation history
- View file contents
- Trigger manual generation

## 🎯 Optimization Tips

### 1. Focus on High-Value Content
The script prioritizes:
- `/blog` - Blog posts (highest priority)
- `/docs` - Documentation
- `/features` - Product features
- `/pricing` - Pricing information
- `/about` - Company information

### 2. Improve Discoverability
Add to your `robots.txt`:
```
# LLMs.txt for AI systems
Sitemap: https://sidetool.co/llms.txt
```

### 3. Submit to AI Providers
Once live, notify:
- OpenAI: Through their data submission forms
- Perplexity: Via their content submission
- Other LLMs: As they add submission processes

### 4. Monitor Performance
Track if your content appears in:
- ChatGPT responses about your product
- Perplexity search results
- Other AI system outputs

## 🐛 Troubleshooting

### Files Not Appearing
1. Check GitHub Actions succeeded
2. Verify Vercel deployment completed
3. Ensure `/public` directory is served at root
4. Check file permissions

### Generation Failures
1. Verify API keys are valid
2. Check rate limits (especially Firecrawl)
3. Ensure URLs are accessible
4. Review GitHub Actions logs

### Stale Content
1. Check cron schedule is active
2. Verify GitHub Actions are enabled
3. Ensure commits are triggering deployments

## 📝 Manual Commands

```bash
# Generate locally
python generate_sidetool_blog.py --max-urls 150 --output-dir ./public

# Test with fewer URLs
python generate_sidetool_blog.py --max-urls 10 --output-dir ./test

# Focus on specific paths
python generate_sidetool_blog.py --focus-paths /blog /docs --max-urls 50
```

## 🎉 Success Criteria

You'll know it's working when:
- ✅ Files accessible at https://sidetool.co/llms.txt
- ✅ Daily updates visible in GitHub commits
- ✅ Dashboard shows successful generations
- ✅ Content appears in AI system responses

## 📚 Resources

- [LLMs.txt Specification](https://github.com/sidetoolco/llmstxt)
- [Firecrawl API Docs](https://docs.firecrawl.dev)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vercel Static Files](https://vercel.com/docs/concepts/projects/project-configuration)

## 🤝 Support

For issues:
1. Check GitHub Actions logs
2. Review Vercel deployment logs
3. Verify API quotas and limits
4. Open an issue in the repository

---

**Last Updated**: January 2025
**Maintained by**: Sidetool.co Team