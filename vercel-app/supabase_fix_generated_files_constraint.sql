-- Drop the existing unique constraint that only allows one file per type per job
ALTER TABLE generated_files 
DROP CONSTRAINT IF EXISTS generated_files_job_id_file_type_key;

-- Add a new unique constraint that includes file_path to allow multiple files
ALTER TABLE generated_files
ADD CONSTRAINT generated_files_job_id_file_path_key 
UNIQUE (job_id, file_path);

-- Or alternatively, if file_path might be null, create a unique constraint on job_id + file_type + file_path
-- This allows multiple files of the same type as long as they have different paths
ALTER TABLE generated_files
DROP CONSTRAINT IF EXISTS generated_files_job_id_file_path_key;

-- Since we're using file_path to distinguish files, let's ensure it's required
ALTER TABLE generated_files
ALTER COLUMN file_path SET NOT NULL;