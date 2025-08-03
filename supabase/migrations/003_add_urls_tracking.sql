-- Add table to track individual URLs processed
CREATE TABLE IF NOT EXISTS public.llms_generation_urls (
  id BIGSERIAL PRIMARY KEY,
  generation_log_id BIGINT REFERENCES public.llms_generation_logs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  content_length INTEGER,
  processed_successfully BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_llms_generation_urls_log_id 
ON public.llms_generation_urls(generation_log_id);

CREATE INDEX IF NOT EXISTS idx_llms_generation_urls_url 
ON public.llms_generation_urls(url);

-- Enable RLS
ALTER TABLE public.llms_generation_urls ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to URLs" 
ON public.llms_generation_urls 
FOR SELECT 
TO public 
USING (true);

-- Allow service role full access
CREATE POLICY "Service role has full access to URLs" 
ON public.llms_generation_urls 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create a view for URL statistics
CREATE OR REPLACE VIEW public.llms_url_statistics AS
SELECT 
  generation_log_id,
  COUNT(*) as total_urls,
  COUNT(CASE WHEN processed_successfully THEN 1 END) as successful_urls,
  COUNT(CASE WHEN NOT processed_successfully THEN 1 END) as failed_urls,
  ROUND(AVG(content_length)) as avg_content_length
FROM public.llms_generation_urls
GROUP BY generation_log_id;

-- Grant permissions on the view
GRANT SELECT ON public.llms_url_statistics TO public;