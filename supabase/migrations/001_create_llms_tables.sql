-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Create storage bucket for LLMs files
insert into storage.buckets (id, name, public) 
values ('llms-files', 'llms-files', true)
on conflict (id) do nothing;

-- Create storage policy for public read access
create policy "Public Access" on storage.objects
for select using (bucket_id = 'llms-files');

-- Create storage policy for service role write access
create policy "Service Role Access" on storage.objects
for all using (bucket_id = 'llms-files' and auth.role() = 'service_role');

-- Table to track each generation run
create table llms_generations (
  id uuid default uuid_generate_v4() primary key,
  generation_id uuid not null unique,
  generated_at timestamp with time zone not null default now(),
  file_count integer not null,
  total_size bigint not null,
  blog_posts jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  error_message text,
  created_at timestamp with time zone not null default now()
);

-- Table to store individual file metadata
create table llms_files (
  id uuid default uuid_generate_v4() primary key,
  generation_id uuid not null references llms_generations(generation_id) on delete cascade,
  file_key text not null,
  file_name text not null,
  file_path text not null,
  content text not null,
  size bigint not null,
  category text not null check (category in ('collection', 'topic', 'individual')),
  description text not null,
  post_count integer,
  topic text,
  blog_post jsonb,
  url text,
  generated_at timestamp with time zone not null,
  created_at timestamp with time zone not null default now()
);

-- Create indexes for better query performance
create index idx_llms_generations_generated_at on llms_generations(generated_at desc);
create index idx_llms_generations_status on llms_generations(status);
create index idx_llms_files_generation_id on llms_files(generation_id);
create index idx_llms_files_category on llms_files(category);
create index idx_llms_files_generated_at on llms_files(generated_at desc);

-- Create view for latest generation with file count
create view llms_latest_generation as
select 
  g.*,
  count(f.id) as actual_file_count
from llms_generations g
left join llms_files f on g.generation_id = f.generation_id
where g.generated_at = (
  select max(generated_at) 
  from llms_generations 
  where status = 'completed'
)
group by g.id, g.generation_id, g.generated_at, g.file_count, g.total_size, g.blog_posts, g.status, g.error_message, g.created_at
limit 1;

-- Create view for file statistics
create view llms_file_stats as
select 
  category,
  count(*) as file_count,
  sum(size) as total_size,
  avg(size) as avg_size,
  min(generated_at) as first_generated,
  max(generated_at) as last_generated
from llms_files
group by category;

-- Row Level Security (RLS) policies
alter table llms_generations enable row level security;
alter table llms_files enable row level security;

-- Allow public read access to completed generations
create policy "Public read access to completed generations" on llms_generations
for select using (status = 'completed');

-- Allow public read access to files from completed generations
create policy "Public read access to files" on llms_files
for select using (
  generation_id in (
    select generation_id from llms_generations where status = 'completed'
  )
);

-- Allow service role full access
create policy "Service role full access to generations" on llms_generations
for all using (auth.role() = 'service_role');

create policy "Service role full access to files" on llms_files
for all using (auth.role() = 'service_role');

-- Function to get latest files
create or replace function get_latest_llms_files()
returns table (
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
  storage_url text
)
language sql
stable
as $$
  select 
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
    concat('https://your-project.supabase.co/storage/v1/object/public/llms-files/', f.file_path) as storage_url
  from llms_files f
  join llms_generations g on f.generation_id = g.generation_id
  where g.generated_at = (
    select max(generated_at) 
    from llms_generations 
    where status = 'completed'
  )
  order by f.category, f.file_name;
$$;

-- Function to clean up old generations (keep last 30 days)
create or replace function cleanup_old_generations()
returns void
language sql
as $$
  delete from llms_generations 
  where generated_at < now() - interval '30 days'
  and status != 'completed';
  
  delete from storage.objects 
  where bucket_id = 'llms-files' 
  and created_at < now() - interval '30 days';
$$;

-- Grant necessary permissions
grant usage on schema public to anon;
grant select on llms_generations to anon;
grant select on llms_files to anon;
grant select on llms_latest_generation to anon;
grant select on llms_file_stats to anon;
grant execute on function get_latest_llms_files() to anon;