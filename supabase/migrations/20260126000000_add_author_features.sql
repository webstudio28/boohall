create table if not exists saved_authors (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  bio text,
  created_at timestamptz default now()
);

alter table articles add column if not exists author_info jsonb;
