#!/usr/bin/env python3
"""
Enhanced LLMs.txt Generator for Sidetool.co with Blog Focus
Generates AI-readable content index files for better LLM discoverability
"""

import os
import sys
import json
import time
import argparse
from datetime import datetime
from typing import List, Dict, Optional
from urllib.parse import urlparse, urljoin

import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SidetoolLLMsGenerator:
    """Generate LLMs.txt files optimized for Sidetool.co blog content"""
    
    def __init__(self, api_keys: Dict[str, str]):
        self.firecrawl_api_key = api_keys.get('firecrawl')
        self.openai_api_key = api_keys.get('openai')
        self.base_url = "https://www.sidetool.co"
        self.focus_paths = ['/blog', '/docs', '/features', '/pricing', '/about', '/integrations']
        
    def map_site(self, max_urls: int = 150) -> List[str]:
        """Map the entire site with focus on blog content"""
        print(f"🗺️  Mapping {self.base_url} (focusing on blog content)...")
        
        try:
            response = requests.post(
                'https://api.firecrawl.dev/v1/map',
                headers={
                    'Authorization': f'Bearer {self.firecrawl_api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'url': self.base_url,
                    'search': '',  # Get all pages
                    'ignoreSitemap': False,
                    'limit': max_urls
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                urls = data.get('data', {}).get('urls', [])
                
                # Prioritize blog URLs
                blog_urls = [url for url in urls if '/blog' in url]
                other_urls = [url for url in urls if '/blog' not in url]
                
                # Combine with blog URLs first
                prioritized_urls = blog_urls + other_urls
                
                print(f"✅ Found {len(urls)} URLs ({len(blog_urls)} blog posts)")
                return prioritized_urls[:max_urls]
            else:
                print(f"❌ Mapping failed: {response.status_code}")
                # Fallback to manual URL list
                return self.get_fallback_urls()
                
        except Exception as e:
            print(f"❌ Error mapping site: {e}")
            return self.get_fallback_urls()
    
    def get_fallback_urls(self) -> List[str]:
        """Fallback URLs if mapping fails"""
        return [
            f"{self.base_url}/",
            f"{self.base_url}/blog",
            f"{self.base_url}/features",
            f"{self.base_url}/pricing",
            f"{self.base_url}/docs",
            f"{self.base_url}/about",
            f"{self.base_url}/integrations",
            f"{self.base_url}/security",
            f"{self.base_url}/support",
            f"{self.base_url}/api"
        ]
    
    def scrape_url(self, url: str) -> Optional[Dict]:
        """Scrape a single URL with retry logic"""
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    'https://api.firecrawl.dev/v1/scrape',
                    headers={
                        'Authorization': f'Bearer {self.firecrawl_api_key}',
                        'Content-Type': 'application/json'
                    },
                    json={
                        'url': url,
                        'formats': ['markdown', 'html'],
                        'onlyMainContent': True,
                        'waitFor': 2000
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get('data', {})
                elif response.status_code == 429:
                    # Rate limited, wait longer
                    time.sleep(retry_delay * (attempt + 1))
                else:
                    print(f"  ⚠️  Failed to scrape {url}: {response.status_code}")
                    
            except requests.exceptions.Timeout:
                print(f"  ⏱️  Timeout scraping {url} (attempt {attempt + 1})")
                time.sleep(retry_delay)
            except Exception as e:
                print(f"  ❌ Error scraping {url}: {e}")
                
        return None
    
    def generate_summary(self, content: str, url: str) -> str:
        """Generate AI summary for content"""
        try:
            # Determine content type
            if '/blog' in url:
                prompt = f"Summarize this blog post in 2-3 sentences, focusing on the key insights and value for readers: {content[:3000]}"
            elif '/docs' in url:
                prompt = f"Summarize this documentation page in 2-3 sentences, highlighting the main features or APIs: {content[:3000]}"
            else:
                prompt = f"Summarize this page in 2-3 sentences, focusing on the key information: {content[:3000]}"
            
            response = requests.post(
                'https://api.openai.com/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {self.openai_api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'gpt-4o-mini',
                    'messages': [
                        {'role': 'system', 'content': 'You are a helpful assistant that creates concise, informative summaries for LLM consumption.'},
                        {'role': 'user', 'content': prompt}
                    ],
                    'max_tokens': 150,
                    'temperature': 0.3
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return data['choices'][0]['message']['content'].strip()
            else:
                return "Content available at this URL."
                
        except Exception as e:
            print(f"  ⚠️  Summary generation failed: {e}")
            return "Content available at this URL."
    
    def generate_llms_files(self, max_urls: int = 150, output_dir: str = './public'):
        """Generate both llms.txt and llms-full.txt files"""
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        # Map the site
        urls = self.map_site(max_urls)
        
        if not urls:
            print("❌ No URLs found to process")
            return False
        
        # Process URLs
        llms_entries = []
        llms_full_entries = []
        processed = 0
        
        print(f"\n📝 Processing {len(urls)} URLs...")
        
        for i, url in enumerate(urls, 1):
            print(f"  [{i}/{len(urls)}] Processing: {url}")
            
            # Rate limiting
            time.sleep(1)
            
            # Scrape the URL
            data = self.scrape_url(url)
            
            if data:
                title = data.get('metadata', {}).get('title', 'Untitled')
                description = data.get('metadata', {}).get('description', '')
                content = data.get('markdown', '')
                
                # Generate summary if no description
                if not description and content:
                    description = self.generate_summary(content, url)
                
                # Add to llms.txt (index format)
                llms_entries.append(f"# {title}")
                llms_entries.append(f"URL: {url}")
                if description:
                    llms_entries.append(f"Description: {description}")
                llms_entries.append("")  # Empty line between entries
                
                # Add to llms-full.txt (with content)
                llms_full_entries.append(f"# {title}")
                llms_full_entries.append(f"URL: {url}")
                if description:
                    llms_full_entries.append(f"Description: {description}")
                llms_full_entries.append("Content:")
                llms_full_entries.append(content[:5000])  # Limit content length
                llms_full_entries.append("\n---\n")  # Separator
                
                processed += 1
                print(f"    ✅ Processed: {title}")
            else:
                print(f"    ⚠️  Skipped (no data)")
        
        # Write llms.txt
        llms_txt_path = os.path.join(output_dir, 'llms.txt')
        with open(llms_txt_path, 'w', encoding='utf-8') as f:
            f.write("# Sidetool.co - LLMs.txt\n")
            f.write(f"# Generated: {datetime.now().isoformat()}\n")
            f.write(f"# Total Pages: {processed}\n")
            f.write("# Format: Title, URL, Description\n\n")
            f.write("\n".join(llms_entries))
        
        # Write llms-full.txt
        llms_full_path = os.path.join(output_dir, 'llms-full.txt')
        with open(llms_full_path, 'w', encoding='utf-8') as f:
            f.write("# Sidetool.co - LLMs Full Content\n")
            f.write(f"# Generated: {datetime.now().isoformat()}\n")
            f.write(f"# Total Pages: {processed}\n")
            f.write("# Format: Title, URL, Description, Content\n\n")
            f.write("\n".join(llms_full_entries))
        
        print(f"\n✅ Generation complete!")
        print(f"  📄 {llms_txt_path} ({os.path.getsize(llms_txt_path) / 1024:.1f} KB)")
        print(f"  📄 {llms_full_path} ({os.path.getsize(llms_full_path) / 1024:.1f} KB)")
        print(f"  📊 Processed {processed}/{len(urls)} URLs successfully")
        
        return True

def main():
    """Main execution function"""
    parser = argparse.ArgumentParser(description='Generate LLMs.txt files for Sidetool.co')
    parser.add_argument('url', nargs='?', default='https://www.sidetool.co', help='Base URL to crawl')
    parser.add_argument('--max-urls', type=int, default=150, help='Maximum URLs to process')
    parser.add_argument('--output-dir', default='./public', help='Output directory')
    parser.add_argument('--focus-paths', nargs='+', default=['/blog'], help='Paths to prioritize')
    
    args = parser.parse_args()
    
    # Get API keys
    api_keys = {
        'firecrawl': os.getenv('FIRECRAWL_API_KEY'),
        'openai': os.getenv('OPENAI_API_KEY')
    }
    
    # Validate API keys
    if not api_keys['firecrawl']:
        print("❌ Error: FIRECRAWL_API_KEY not set")
        sys.exit(1)
    if not api_keys['openai']:
        print("❌ Error: OPENAI_API_KEY not set")
        sys.exit(1)
    
    # Generate files
    print(f"🚀 Starting LLMs.txt generation for Sidetool.co")
    print(f"  🎯 Focus on: {', '.join(args.focus_paths)}")
    print(f"  📊 Max URLs: {args.max_urls}")
    print(f"  📁 Output: {args.output_dir}")
    print("")
    
    generator = SidetoolLLMsGenerator(api_keys)
    success = generator.generate_llms_files(
        max_urls=args.max_urls,
        output_dir=args.output_dir
    )
    
    if success:
        print("\n🎉 Success! Files are ready for deployment.")
        print("  Next step: Files will be committed and pushed to GitHub")
        print("  Then available at:")
        print("    - https://sidetool.co/llms.txt")
        print("    - https://sidetool.co/llms-full.txt")
    else:
        print("\n❌ Generation failed. Check the logs above.")
        sys.exit(1)

if __name__ == "__main__":
    main()