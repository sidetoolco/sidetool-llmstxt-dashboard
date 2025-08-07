-- Check and fix RLS policies for generated_files table

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view files from own jobs" ON generated_files;
DROP POLICY IF EXISTS "Users can update download count" ON generated_files;
DROP POLICY IF EXISTS "Service role can manage files" ON generated_files;

-- Enable RLS if not already enabled
ALTER TABLE generated_files ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view files from their own jobs
CREATE POLICY "Users can view files from own jobs" ON generated_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM crawl_jobs 
      WHERE crawl_jobs.id = generated_files.job_id 
      AND crawl_jobs.user_id = auth.uid()
    )
  );

-- Create policy for users to update download count on their own files
CREATE POLICY "Users can update download count" ON generated_files
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM crawl_jobs 
      WHERE crawl_jobs.id = generated_files.job_id 
      AND crawl_jobs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crawl_jobs 
      WHERE crawl_jobs.id = generated_files.job_id 
      AND crawl_jobs.user_id = auth.uid()
    )
  );

-- Create policy for service role to do everything
CREATE POLICY "Service role full access" ON generated_files
  FOR ALL USING (
    auth.role() = 'service_role'
  );

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'generated_files' 
ORDER BY ordinal_position;

-- Check if there are any files in the table
SELECT 
  job_id,
  COUNT(*) as file_count,
  array_agg(file_type) as file_types,
  array_agg(file_path) as file_paths
FROM generated_files
GROUP BY job_id
ORDER BY job_id;