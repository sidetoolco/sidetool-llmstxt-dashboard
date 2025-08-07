-- Add content_size to crawled_urls table
ALTER TABLE crawled_urls 
ADD COLUMN IF NOT EXISTS content_size INTEGER;

-- Add total_content_size to crawl_jobs table  
ALTER TABLE crawl_jobs
ADD COLUMN IF NOT EXISTS total_content_size INTEGER;

-- Update any existing records to have content_size based on content length
UPDATE crawled_urls 
SET content_size = LENGTH(content)
WHERE content IS NOT NULL AND content_size IS NULL;

-- Update existing jobs to calculate total_content_size
UPDATE crawl_jobs
SET total_content_size = (
  SELECT SUM(content_size) 
  FROM crawled_urls 
  WHERE crawled_urls.job_id = crawl_jobs.id
)
WHERE total_content_size IS NULL;