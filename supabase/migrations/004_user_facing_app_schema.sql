-- User-facing LLMs.txt Generator App Schema
-- This migration transforms the app from generating Sidetool's files to a user-facing service

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron" schema extensions;

-- Create users table for authentication
create table if not exists users (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  name text,
  auth_provider text check (auth_provider in ('email', 'google', 'github')),
  created_at timestamp with time zone default now(),
  last_login_at timestamp with time zone,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'enterprise')),
  api_key_firecrawl text, -- User can optionally provide their own Firecrawl API key
  api_key_openai text -- User can optionally provide their own OpenAI API key
);

-- Create user_sessions table for tracking active sessions
create table if not exists user_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  token text unique not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- Create crawl_jobs table for tracking website crawling jobs
create table if not exists crawl_jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  domain text not null,
  status text default 'pending' check (status in ('pending', 'mapping', 'crawling', 'processing', 'completed', 'failed')),
  
  -- Configuration
  max_pages integer default 20,
  batch_size integer default 10,
  include_subdomains boolean default false,
  
  -- Progress tracking
  total_urls integer,
  urls_mapped integer default 0,
  urls_crawled integer default 0,
  urls_processed integer default 0,
  
  -- Timing
  started_at timestamp with time zone,
  mapping_completed_at timestamp with time zone,
  crawling_completed_at timestamp with time zone,
  processing_completed_at timestamp with time zone,
  completed_at timestamp with time zone,
  
  -- Results
  llms_txt_id uuid,
  llms_full_txt_id uuid,
  total_content_size bigint,
  
  -- Error handling
  error_message text,
  failed_urls jsonb default '[]'::jsonb,
  
  -- Metadata
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create crawled_urls table for tracking individual URL processing
create table if not exists crawled_urls (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references crawl_jobs(id) on delete cascade,
  url text not null,
  status text default 'pending' check (status in ('pending', 'crawling', 'processing', 'completed', 'failed', 'skipped')),
  
  -- Content
  markdown_content text,
  html_content text,
  content_size bigint,
  
  -- AI-generated summary for llms.txt
  title text, -- 3-4 words
  description text, -- 9-10 words
  
  -- Metadata
  page_title text,
  meta_description text,
  crawled_at timestamp with time zone,
  processed_at timestamp with time zone,
  error_message text,
  
  -- Performance
  crawl_duration_ms integer,
  processing_duration_ms integer
);

-- Create generated_files table for storing the final llms.txt files
create table if not exists generated_files (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references crawl_jobs(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  
  file_type text not null check (file_type in ('llms.txt', 'llms-full.txt')),
  content text not null,
  size bigint not null,
  
  -- Storage
  storage_path text,
  storage_url text,
  
  -- Download tracking
  download_count integer default 0,
  last_downloaded_at timestamp with time zone,
  
  -- Publishing
  is_published boolean default false,
  published_url text,
  published_at timestamp with time zone,
  
  created_at timestamp with time zone default now()
);

-- Create api_usage table for tracking API usage and costs
create table if not exists api_usage (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  job_id uuid references crawl_jobs(id) on delete cascade,
  
  service text not null check (service in ('firecrawl_map', 'firecrawl_scrape', 'openai_summary')),
  endpoint text,
  
  -- Usage metrics
  request_count integer default 1,
  tokens_used integer,
  credits_used numeric(10, 4),
  
  -- Response
  response_status integer,
  response_time_ms integer,
  
  timestamp timestamp with time zone default now()
);

-- Create user_notifications table for email/push notifications
create table if not exists user_notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  job_id uuid references crawl_jobs(id),
  
  type text not null check (type in ('job_started', 'job_completed', 'job_failed', 'quota_warning', 'subscription_update')),
  channel text not null check (channel in ('email', 'push', 'in_app')),
  
  subject text,
  message text not null,
  metadata jsonb,
  
  sent boolean default false,
  sent_at timestamp with time zone,
  error_message text,
  
  created_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index idx_crawl_jobs_user_id on crawl_jobs(user_id);
create index idx_crawl_jobs_status on crawl_jobs(status);
create index idx_crawl_jobs_created_at on crawl_jobs(created_at desc);
create index idx_crawled_urls_job_id on crawled_urls(job_id);
create index idx_crawled_urls_status on crawled_urls(status);
create index idx_generated_files_user_id on generated_files(user_id);
create index idx_generated_files_job_id on generated_files(job_id);
create index idx_api_usage_user_id on api_usage(user_id);
create index idx_api_usage_timestamp on api_usage(timestamp desc);

-- Row Level Security (RLS) policies
alter table users enable row level security;
alter table user_sessions enable row level security;
alter table crawl_jobs enable row level security;
alter table crawled_urls enable row level security;
alter table generated_files enable row level security;
alter table api_usage enable row level security;
alter table user_notifications enable row level security;

-- Users can only see their own data
create policy "Users can view own profile" on users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on users
  for update using (auth.uid() = id);

create policy "Users can view own jobs" on crawl_jobs
  for select using (auth.uid() = user_id);

create policy "Users can create own jobs" on crawl_jobs
  for insert with check (auth.uid() = user_id);

create policy "Users can view own crawled URLs" on crawled_urls
  for select using (
    job_id in (select id from crawl_jobs where user_id = auth.uid())
  );

create policy "Users can view own files" on generated_files
  for select using (auth.uid() = user_id);

create policy "Users can view own API usage" on api_usage
  for select using (auth.uid() = user_id);

create policy "Users can view own notifications" on user_notifications
  for select using (auth.uid() = user_id);

-- Functions for job management
create or replace function update_job_progress()
returns trigger as $$
begin
  -- Update the parent job's progress when a URL status changes
  update crawl_jobs
  set 
    urls_crawled = (
      select count(*) from crawled_urls 
      where job_id = NEW.job_id and status in ('completed', 'failed')
    ),
    urls_processed = (
      select count(*) from crawled_urls 
      where job_id = NEW.job_id and status = 'completed'
    ),
    updated_at = now()
  where id = NEW.job_id;
  
  return NEW;
end;
$$ language plpgsql;

-- Create trigger to update job progress
create trigger update_job_progress_trigger
after update of status on crawled_urls
for each row
execute function update_job_progress();

-- Function to get job statistics
create or replace function get_job_stats(p_job_id uuid)
returns table (
  total_urls integer,
  completed_urls integer,
  failed_urls integer,
  pending_urls integer,
  total_content_size bigint,
  avg_crawl_time_ms numeric,
  avg_processing_time_ms numeric
) as $$
begin
  return query
  select 
    count(*)::integer as total_urls,
    count(*) filter (where status = 'completed')::integer as completed_urls,
    count(*) filter (where status = 'failed')::integer as failed_urls,
    count(*) filter (where status = 'pending')::integer as pending_urls,
    sum(content_size)::bigint as total_content_size,
    avg(crawl_duration_ms)::numeric as avg_crawl_time_ms,
    avg(processing_duration_ms)::numeric as avg_processing_time_ms
  from crawled_urls
  where job_id = p_job_id;
end;
$$ language plpgsql;

-- Function to calculate user's monthly usage
create or replace function get_user_monthly_usage(p_user_id uuid)
returns table (
  month text,
  total_jobs integer,
  total_urls_crawled integer,
  total_data_processed bigint,
  firecrawl_requests integer,
  openai_requests integer,
  total_credits_used numeric
) as $$
begin
  return query
  select 
    to_char(date_trunc('month', cj.created_at), 'YYYY-MM') as month,
    count(distinct cj.id)::integer as total_jobs,
    sum(cj.urls_processed)::integer as total_urls_crawled,
    sum(cj.total_content_size)::bigint as total_data_processed,
    sum(case when au.service = 'firecrawl_scrape' then au.request_count else 0 end)::integer as firecrawl_requests,
    sum(case when au.service = 'openai_summary' then au.request_count else 0 end)::integer as openai_requests,
    sum(au.credits_used)::numeric as total_credits_used
  from crawl_jobs cj
  left join api_usage au on au.job_id = cj.id
  where cj.user_id = p_user_id
    and cj.created_at >= date_trunc('month', current_date - interval '6 months')
  group by to_char(date_trunc('month', cj.created_at), 'YYYY-MM')
  order by month desc;
end;
$$ language plpgsql;

-- Sample data for testing (remove in production)
insert into users (email, name, auth_provider, subscription_tier)
values ('demo@example.com', 'Demo User', 'email', 'free')
on conflict (email) do nothing;