-- Add schema_markup, author_info, and content_structure columns to articles
alter table articles
add column if not exists schema_markup jsonb,
add column if not exists author_info jsonb,
add column if not exists content_structure jsonb;

