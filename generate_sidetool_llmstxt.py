#!/usr/bin/env python3
"""
Generate llms.txt files for sidetool.co
"""

import os
import sys
import argparse
import asyncio
import aiohttp
from typing import List, Dict, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from firecrawl import FirecrawlApp
from openai import OpenAI
import json
import time

load_dotenv()

class SidetoolLLMSTxtGenerator:
    def __init__(self, firecrawl_api_key: str, openai_api_key: str, max_urls: int = 50, verbose: bool = False):
        self.firecrawl = FirecrawlApp(api_key=firecrawl_api_key)
        self.openai = OpenAI(api_key=openai_api_key)
        self.max_urls = max_urls
        self.verbose = verbose
        self.base_url = "https://sidetool.co"
        
    def log(self, message: str):
        if self.verbose:
            print(f"[INFO] {message}")
    
    def map_website(self) -> List[str]:
        """Map all URLs on sidetool.co"""
        self.log(f"Mapping {self.base_url}...")
        try:
            map_result = self.firecrawl.map_url(
                self.base_url,
                limit=self.max_urls
            )
            
            self.log(f"Map result: {map_result}")
            
            if map_result:
                urls = []
                if hasattr(map_result, 'links') and map_result.links:
                    urls = map_result.links[:self.max_urls]
                elif isinstance(map_result, dict) and 'links' in map_result:
                    urls = map_result['links'][:self.max_urls]
                elif isinstance(map_result, list):
                    urls = map_result[:self.max_urls]
                
                if urls:
                    self.log(f"Found {len(urls)} URLs")
                    return urls
            
            print(f"Error: No URLs found for {self.base_url}")
            return []
                
        except Exception as e:
            print(f"Error mapping website: {e}")
            return []
    
    def scrape_url(self, url: str) -> Dict:
        """Scrape a single URL and return its content"""
        try:
            self.log(f"Scraping: {url}")
            result = self.firecrawl.scrape_url(url)
            
            if result:
                content = ''
                if hasattr(result, 'markdown') and result.markdown:
                    content = result.markdown
                elif isinstance(result, dict) and 'markdown' in result:
                    content = result['markdown']
                elif hasattr(result, 'content') and result.content:
                    content = result.content
                elif isinstance(result, dict) and 'content' in result:
                    content = result['content']
                
                if content:
                    return {
                        'url': url,
                        'content': content,
                        'success': True
                    }
            
            return {
                'url': url,
                'content': '',
                'success': False,
                'error': 'No content found'
            }
                
        except Exception as e:
            self.log(f"Error scraping {url}: {e}")
            return {
                'url': url,
                'content': '',
                'success': False,
                'error': str(e)
            }
    
    def generate_summary(self, url: str, content: str) -> Tuple[str, str]:
        """Generate title and description using OpenAI"""
        if not content or len(content.strip()) < 10:
            return "Page", "Content not available"
        
        try:
            prompt = f"""Given this webpage content from {url}, generate:
1. A title (3-4 words max)
2. A description (9-10 words max)

Content:
{content[:3000]}

Format your response as:
Title: [title here]
Description: [description here]"""
            
            response = self.openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that creates concise summaries."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=50,
                temperature=0.3
            )
            
            result = response.choices[0].message.content
            lines = result.strip().split('\n')
            
            title = "Page"
            description = "Content summary"
            
            for line in lines:
                if line.startswith("Title:"):
                    title = line.replace("Title:", "").strip()
                elif line.startswith("Description:"):
                    description = line.replace("Description:", "").strip()
            
            return title, description
            
        except Exception as e:
            self.log(f"Error generating summary for {url}: {e}")
            return "Page", "Content summary"
    
    async def process_urls_batch(self, urls: List[str]) -> List[Dict]:
        """Process a batch of URLs concurrently"""
        with ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(self.scrape_url, urls))
        return results
    
    async def process_all_urls(self, urls: List[str]) -> List[Dict]:
        """Process all URLs in batches"""
        all_results = []
        batch_size = 10
        
        for i in range(0, len(urls), batch_size):
            batch = urls[i:i+batch_size]
            self.log(f"Processing batch {i//batch_size + 1} of {(len(urls) + batch_size - 1)//batch_size}")
            
            batch_results = await self.process_urls_batch(batch)
            all_results.extend(batch_results)
            
            if i + batch_size < len(urls):
                time.sleep(1)
        
        return all_results
    
    def generate_llms_txt(self, scraped_data: List[Dict]) -> str:
        """Generate the llms.txt content"""
        lines = [f"# {self.base_url} llms.txt", ""]
        
        for data in scraped_data:
            if data['success'] and data['content']:
                title, description = self.generate_summary(data['url'], data['content'])
                lines.append(f"- [{title}]({data['url']}): {description}")
            else:
                self.log(f"Skipping {data['url']} due to scraping error")
        
        return "\n".join(lines)
    
    def generate_llms_full_txt(self, scraped_data: List[Dict]) -> str:
        """Generate the llms-full.txt content"""
        sections = [f"# {self.base_url} llms-full.txt", ""]
        
        for idx, data in enumerate(scraped_data, 1):
            if data['success'] and data['content']:
                sections.append(f"<|firecrawl-page-{idx}-lllmstxt|>")
                sections.append(data['content'])
                sections.append("")
        
        return "\n".join(sections)
    
    async def generate(self, output_dir: str = ".", full_text: bool = True):
        """Main generation process"""
        print(f"Starting llms.txt generation for {self.base_url}")
        print(f"Max URLs: {self.max_urls}")
        print(f"Output directory: {output_dir}")
        print("-" * 50)
        
        os.makedirs(output_dir, exist_ok=True)
        
        urls = self.map_website()
        if not urls:
            print("No URLs found. Exiting.")
            return
        
        print(f"Processing {len(urls)} URLs...")
        scraped_data = await self.process_all_urls(urls)
        
        successful_scrapes = [d for d in scraped_data if d['success']]
        print(f"Successfully scraped {len(successful_scrapes)} out of {len(scraped_data)} URLs")
        
        print("Generating llms.txt...")
        llms_txt_content = self.generate_llms_txt(scraped_data)
        llms_txt_path = os.path.join(output_dir, "llms.txt")
        with open(llms_txt_path, 'w', encoding='utf-8') as f:
            f.write(llms_txt_content)
        print(f"Created: {llms_txt_path}")
        
        if full_text:
            print("Generating llms-full.txt...")
            llms_full_txt_content = self.generate_llms_full_txt(scraped_data)
            llms_full_txt_path = os.path.join(output_dir, "llms-full.txt")
            with open(llms_full_txt_path, 'w', encoding='utf-8') as f:
                f.write(llms_full_txt_content)
            print(f"Created: {llms_full_txt_path}")
        
        print("-" * 50)
        print("Generation complete!")


def main():
    parser = argparse.ArgumentParser(description='Generate llms.txt files for sidetool.co')
    parser.add_argument('--max-urls', type=int, default=50,
                        help='Maximum number of URLs to process (default: 50)')
    parser.add_argument('--output-dir', type=str, default='.',
                        help='Output directory for generated files (default: current directory)')
    parser.add_argument('--firecrawl-api-key', type=str,
                        help='Firecrawl API key (or set FIRECRAWL_API_KEY env var)')
    parser.add_argument('--openai-api-key', type=str,
                        help='OpenAI API key (or set OPENAI_API_KEY env var)')
    parser.add_argument('--no-full-text', action='store_true',
                        help='Only generate llms.txt, skip llms-full.txt')
    parser.add_argument('--verbose', action='store_true',
                        help='Enable verbose logging')
    
    args = parser.parse_args()
    
    firecrawl_key = args.firecrawl_api_key or os.getenv('FIRECRAWL_API_KEY')
    openai_key = args.openai_api_key or os.getenv('OPENAI_API_KEY')
    
    if not firecrawl_key:
        print("Error: Firecrawl API key not provided.")
        print("Please provide it via --firecrawl-api-key or FIRECRAWL_API_KEY environment variable")
        sys.exit(1)
    
    if not openai_key:
        print("Error: OpenAI API key not provided.")
        print("Please provide it via --openai-api-key or OPENAI_API_KEY environment variable")
        sys.exit(1)
    
    generator = SidetoolLLMSTxtGenerator(
        firecrawl_api_key=firecrawl_key,
        openai_api_key=openai_key,
        max_urls=args.max_urls,
        verbose=args.verbose
    )
    
    asyncio.run(generator.generate(
        output_dir=args.output_dir,
        full_text=not args.no_full_text
    ))


if __name__ == "__main__":
    main()