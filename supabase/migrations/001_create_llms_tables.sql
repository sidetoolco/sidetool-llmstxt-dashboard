-- Create storage bucket for llms files
INSERT INTO storage.buckets (id, name, public)
VALUES ('llms-files', 'llms-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create table for generation logs
CREATE TABLE IF NOT EXISTS public.llms_generation_logs (
  id BIGSERIAL PRIMARY KEY,
  site_url TEXT NOT NULL,
  urls_processed INTEGER NOT NULL DEFAULT 0,
  urls_successful INTEGER NOT NULL DEFAULT 0,
  llms_txt_path TEXT,
  llms_full_txt_path TEXT,
  error_message TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_llms_generation_logs_site_url 
ON public.llms_generation_logs(site_url);

CREATE INDEX IF NOT EXISTS idx_llms_generation_logs_generated_at 
ON public.llms_generation_logs(generated_at DESC);

-- Create RLS policies
ALTER TABLE public.llms_generation_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to generation logs
CREATE POLICY "Allow public read access" 
ON public.llms_generation_logs 
FOR SELECT 
TO public 
USING (true);

-- Allow service role full access
CREATE POLICY "Service role has full access" 
ON public.llms_generation_logs 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create a view for latest generation per site
CREATE OR REPLACE VIEW public.latest_llms_generation AS
SELECT DISTINCT ON (site_url) 
  id,
  site_url,
  urls_processed,
  urls_successful,
  llms_txt_path,
  llms_full_txt_path,
  error_message,
  generated_at,
  created_at
FROM public.llms_generation_logs
ORDER BY site_url, generated_at DESC;

-- Grant permissions on the view
GRANT SELECT ON public.latest_llms_generation TO public;

-- Storage policies for the bucket
CREATE POLICY "Public read access for llms files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'llms-files');

CREATE POLICY "Service role can upload llms files"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'llms-files');

CREATE POLICY "Service role can update llms files"
ON storage.objects
FOR UPDATE
TO service_role
USING (bucket_id = 'llms-files')
WITH CHECK (bucket_id = 'llms-files');

CREATE POLICY "Service role can delete llms files"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'llms-files');