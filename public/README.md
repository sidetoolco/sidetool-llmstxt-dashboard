# Public LLMs.txt Files

This directory contains the automatically generated LLMs.txt files for sidetool.co.

## Files

- `llms.txt` - Index file with titles, URLs, and descriptions
- `llms-full.txt` - Complete content file with full text

## Access URLs

Once deployed, these files will be accessible at:
- https://sidetool.co/llms.txt
- https://sidetool.co/llms-full.txt

## Update Schedule

Files are automatically regenerated daily at 3:00 AM UTC via GitHub Actions.

## Format

The files follow the LLMs.txt standard format for optimal discovery and indexing by AI systems like ChatGPT and Perplexity.

## Manual Generation

To manually generate these files:
```bash
python generate_sidetool_blog.py --max-urls 150 --output-dir ./public
```