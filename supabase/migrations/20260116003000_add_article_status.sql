-- Add status column to articles
alter table articles 
add column if not exists status text default 'draft';

-- Update existing
update articles set status = 'completed' where content is not null;
update articles set status = 'generating' where content is null;
