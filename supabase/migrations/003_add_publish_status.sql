-- Add publish status tracking to llms_files table
alter table llms_files 
add column published boolean default false,
add column published_at timestamp with time zone,
add column published_url text,
add column publish_notes text;

-- Create index for published files
create index idx_llms_files_published on llms_files(published);
create index idx_llms_files_published_at on llms_files(published_at desc);

-- Create view for published files only
create view llms_published_files as
select 
  f.*,
  g.generated_at as generation_date,
  g.status as generation_status
from llms_files f
join llms_generations g on f.generation_id = g.generation_id
where f.published = true
order by f.published_at desc;

-- Function to mark file as published
create or replace function mark_file_published(
  file_id uuid,
  published_url text default null,
  notes text default null
)
returns void
language sql
as $$
  update llms_files 
  set 
    published = true,
    published_at = now(),
    published_url = published_url,
    publish_notes = notes
  where id = file_id;
$$;

-- Function to mark file as unpublished
create or replace function mark_file_unpublished(file_id uuid)
returns void
language sql
as $$
  update llms_files 
  set 
    published = false,
    published_at = null,
    published_url = null,
    publish_notes = null
  where id = file_id;
$$;

-- Function to get publish statistics
create or replace function get_publish_stats()
returns table (
  total_files bigint,
  published_files bigint,
  unpublished_files bigint,
  latest_publish_date timestamp with time zone
)
language sql
stable
as $$
  select 
    count(*) as total_files,
    count(*) filter (where published = true) as published_files,
    count(*) filter (where published = false) as unpublished_files,
    max(published_at) as latest_publish_date
  from llms_files f
  join llms_generations g on f.generation_id = g.generation_id
  where g.status = 'completed';
$$;

-- Update the get_latest_llms_files function to include publish status
create or replace function get_latest_llms_files()
returns table (
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
language sql
stable
as $$
  select 
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
    f.published,
    f.published_at,
    f.published_url,
    f.publish_notes,
    concat('https://gytlhmhrthpackunppjd.supabase.co/storage/v1/object/public/llms-files/', f.file_path) as storage_url
  from llms_files f
  join llms_generations g on f.generation_id = g.generation_id
  where g.generated_at = (
    select max(generated_at) 
    from llms_generations 
    where status = 'completed'
  )
  order by f.category, f.file_name;
$$;

-- Grant permissions for the new functions
grant execute on function mark_file_published(uuid, text, text) to anon;
grant execute on function mark_file_unpublished(uuid) to anon;
grant execute on function get_publish_stats() to anon;
grant select on llms_published_files to anon;