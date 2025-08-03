# Sidetool.co LLMs.txt Generator

A Python application that generates `llms.txt` and `llms-full.txt` files for sidetool.co, making the website content more accessible to Large Language Models.

## Features

- Automatically discovers all URLs on sidetool.co using Firecrawl's map endpoint
- Extracts markdown content from each page
- Generates AI-powered summaries using OpenAI's GPT-4o-mini
- Creates two output files:
  - `llms.txt`: Concise index with page titles and descriptions
  - `llms-full.txt`: Complete markdown content of all pages
- Concurrent processing for faster generation
- Configurable URL limits

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd sidetool-llmstxt-generator
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up your API keys:
```bash
cp .env.example .env
# Edit .env and add your API keys
```

## Usage

### Basic Usage
```bash
python generate_sidetool_llmstxt.py
```

### With Options
```bash
# Process up to 100 URLs
python generate_sidetool_llmstxt.py --max-urls 100

# Save to specific directory
python generate_sidetool_llmstxt.py --output-dir ./output

# Only generate llms.txt (skip full text)
python generate_sidetool_llmstxt.py --no-full-text

# Enable verbose logging
python generate_sidetool_llmstxt.py --verbose

# Use command line API keys (instead of .env)
python generate_sidetool_llmstxt.py \
  --firecrawl-api-key "fc-..." \
  --openai-api-key "sk-..."
```

## Command Line Options

- `--max-urls`: Maximum number of URLs to process (default: 50)
- `--output-dir`: Directory to save output files (default: current directory)
- `--firecrawl-api-key`: Firecrawl API key (optional if set in .env)
- `--openai-api-key`: OpenAI API key (optional if set in .env)
- `--no-full-text`: Only generate llms.txt, skip llms-full.txt
- `--verbose`: Enable verbose logging

## API Keys Required

1. **Firecrawl API Key**: Get one at https://www.firecrawl.dev/
2. **OpenAI API Key**: Get one at https://platform.openai.com/api-keys

## Output Files

### llms.txt
Contains a concise index of all pages:
```
# https://sidetool.co llms.txt

- [Page Title](https://sidetool.co/page1): Brief description of the page
- [Another Page](https://sidetool.co/page2): Another concise description
```

### llms-full.txt
Contains complete markdown content:
```
# https://sidetool.co llms-full.txt

<|firecrawl-page-1-lllmstxt|>
Full markdown content of the page...

<|firecrawl-page-2-lllmstxt|>
Full markdown content of another page...
```

## License

MIT