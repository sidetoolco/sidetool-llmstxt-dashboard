-- Complete Supabase Setup for LLMs.txt Generator
-- Run this entire script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  auth_provider TEXT DEFAULT 'email',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create crawl_jobs table
CREATE TABLE IF NOT EXISTS crawl_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'mapping', 'crawling', 'processing', 'completed', 'failed')),
  max_pages INTEGER DEFAULT 20,
  
  -- Progress tracking
  total_urls INTEGER,
  urls_crawled INTEGER DEFAULT 0,
  urls_processed INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create crawled_urls table
CREATE TABLE IF NOT EXISTS crawled_urls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES crawl_jobs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  content TEXT,
  crawled_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'crawling', 'completed', 'failed')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(job_id, url)
);

-- Create generated_files table
CREATE TABLE IF NOT EXISTS generated_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES crawl_jobs(id) ON DELETE CASCADE,
  file_type TEXT CHECK (file_type IN ('llms.txt', 'llms-full.txt')),
  file_path TEXT,
  file_size INTEGER,
  download_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, file_type)
);

-- Create api_usage table for tracking
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES crawl_jobs(id) ON DELETE CASCADE,
  service TEXT CHECK (service IN ('firecrawl', 'openai')),
  tokens_used INTEGER,
  cost_cents INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES crawl_jobs(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('job_completed', 'job_failed', 'quota_warning', 'system')),
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_user_id ON crawl_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_status ON crawl_jobs(status);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_created_at ON crawl_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crawled_urls_job_id ON crawled_urls(job_id);
CREATE INDEX IF NOT EXISTS idx_generated_files_job_id ON generated_files(job_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id, is_read);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawled_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for crawl_jobs table
CREATE POLICY "Users can view own jobs" ON crawl_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own jobs" ON crawl_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs" ON crawl_jobs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs" ON crawl_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for crawled_urls table
CREATE POLICY "Users can view urls from own jobs" ON crawled_urls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM crawl_jobs 
      WHERE crawl_jobs.id = crawled_urls.job_id 
      AND crawl_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert urls" ON crawled_urls
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update urls" ON crawled_urls
  FOR UPDATE USING (true);

-- RLS Policies for generated_files table
CREATE POLICY "Users can view files from own jobs" ON generated_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM crawl_jobs 
      WHERE crawl_jobs.id = generated_files.job_id 
      AND crawl_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage files" ON generated_files
  FOR ALL USING (true);

-- RLS Policies for api_usage table
CREATE POLICY "Users can view own usage" ON api_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert usage" ON api_usage
  FOR INSERT WITH CHECK (true);

-- RLS Policies for user_notifications table
CREATE POLICY "Users can view own notifications" ON user_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications" ON user_notifications
  FOR INSERT WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, auth_provider)
  VALUES (new.id, new.email, 'email')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create storage bucket for generated files (run in Storage section of Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('llms-txt-files', 'llms-txt-files', false);

COMMENT ON TABLE users IS 'User profiles extending Supabase auth';
COMMENT ON TABLE crawl_jobs IS 'Website crawling jobs initiated by users';
COMMENT ON TABLE crawled_urls IS 'Individual URLs crawled as part of jobs';
COMMENT ON TABLE generated_files IS 'Generated llms.txt and llms-full.txt files';
COMMENT ON TABLE api_usage IS 'Tracking API usage for billing and quotas';
COMMENT ON TABLE user_notifications IS 'User notifications for job status and system messages';