-- Drop the existing function first
DROP FUNCTION IF EXISTS get_latest_llms_files();

-- Add publish status tracking to llms_files table
ALTER TABLE llms_files 
ADD COLUMN IF NOT EXISTS published boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS published_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS published_url text,
ADD COLUMN IF NOT EXISTS publish_notes text;

-- Create indexes for published files (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_llms_files_published ON llms_files(published);
CREATE INDEX IF NOT EXISTS idx_llms_files_published_at ON llms_files(published_at DESC);

-- Recreate the function with the correct return type
CREATE OR REPLACE FUNCTION get_latest_llms_files()
RETURNS TABLE (
  id uuid,
  file_key text,
  file_name text,
  file_path text,
  content text,
  size bigint,
  category text,
  description text,
  post_count integer,
  topic text,
  blog_post jsonb,
  url text,
  generated_at timestamp with time zone,
  published boolean,
  published_at timestamp with time zone,
  published_url text,
  publish_notes text,
  storage_url text
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    f.id,
    f.file_key,
    f.file_name,
    f.file_path,
    f.content,
    f.size,
    f.category,
    f.description,
    f.post_count,
    f.topic,
    f.blog_post,
    f.url,
    f.generated_at,
    COALESCE(f.published, false) as published,
    f.published_at,
    f.published_url,
    f.publish_notes,
    concat('https://gytlhmhrthpackunppjd.supabase.co/storage/v1/object/public/llms-files/', f.file_path) as storage_url
  FROM llms_files f
  JOIN llms_generations g ON f.generation_id = g.generation_id
  WHERE g.generated_at = (
    SELECT max(generated_at) 
    FROM llms_generations 
    WHERE status = 'completed'
  )
  ORDER BY f.category, f.file_name;
$$;

-- Create view for published files only
DROP VIEW IF EXISTS llms_published_files;
CREATE VIEW llms_published_files AS
SELECT 
  f.*,
  g.generated_at as generation_date,
  g.status as generation_status
FROM llms_files f
JOIN llms_generations g ON f.generation_id = g.generation_id
WHERE COALESCE(f.published, false) = true
ORDER BY f.published_at DESC;

-- Function to mark file as published
CREATE OR REPLACE FUNCTION mark_file_published(
  file_id uuid,
  published_url text DEFAULT NULL,
  notes text DEFAULT NULL
)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE llms_files 
  SET 
    published = true,
    published_at = now(),
    published_url = mark_file_published.published_url,
    publish_notes = mark_file_published.notes
  WHERE id = mark_file_published.file_id;
$$;

-- Function to mark file as unpublished
CREATE OR REPLACE FUNCTION mark_file_unpublished(file_id uuid)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE llms_files 
  SET 
    published = false,
    published_at = NULL,
    published_url = NULL,
    publish_notes = NULL
  WHERE id = mark_file_unpublished.file_id;
$$;

-- Function to get publish statistics
CREATE OR REPLACE FUNCTION get_publish_stats()
RETURNS TABLE (
  total_files bigint,
  published_files bigint,
  unpublished_files bigint,
  latest_publish_date timestamp with time zone
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    count(*) as total_files,
    count(*) FILTER (WHERE COALESCE(published, false) = true) as published_files,
    count(*) FILTER (WHERE COALESCE(published, false) = false) as unpublished_files,
    max(published_at) as latest_publish_date
  FROM llms_files f
  JOIN llms_generations g ON f.generation_id = g.generation_id
  WHERE g.status = 'completed';
$$;

-- Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION get_latest_llms_files() TO anon;
GRANT EXECUTE ON FUNCTION mark_file_published(uuid, text, text) TO anon;
GRANT EXECUTE ON FUNCTION mark_file_unpublished(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_publish_stats() TO anon;
GRANT SELECT ON llms_published_files TO anon;