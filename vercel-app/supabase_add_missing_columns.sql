-- Add missing columns to generated_files table
ALTER TABLE generated_files 
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_downloaded_at TIMESTAMPTZ;

-- Add missing columns to crawled_urls table (if not already there)
ALTER TABLE crawled_urls 
ADD COLUMN IF NOT EXISTS content TEXT;

-- Update RLS policies for generated_files to allow access to content
DROP POLICY IF EXISTS "Users can view files from own jobs" ON generated_files;
CREATE POLICY "Users can view files from own jobs" ON generated_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM crawl_jobs 
      WHERE crawl_jobs.id = generated_files.job_id 
      AND crawl_jobs.user_id = auth.uid()
    )
  );

-- Add policy to allow updating download count
CREATE POLICY "Users can update download count" ON generated_files
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM crawl_jobs 
      WHERE crawl_jobs.id = generated_files.job_id 
      AND crawl_jobs.user_id = auth.uid()
    )
  );