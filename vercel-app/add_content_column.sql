-- Add content column to generated_files table
ALTER TABLE generated_files 
ADD COLUMN IF NOT EXISTS content TEXT;