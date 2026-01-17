-- Add source column to keywords table to track where the data came from
alter table keywords 
add column if not exists source text default 'ai';

-- Update existing keywords (optional, assumes existing are AI if not specified)
-- update keywords set source = 'ai' where source is null;
