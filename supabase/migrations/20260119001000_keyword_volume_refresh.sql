-- Keyword refresh tracking (idempotent)
alter table keywords
add column if not exists last_checked_at timestamptz;

alter table keywords
add column if not exists do_not_retry boolean default false;

-- Ensure we have a "source" column (some DBs may not have run the earlier migration)
alter table keywords
add column if not exists source text default 'ai';


