-- Create articles table
create table if not exists articles (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references auth.users(id) not null,
    business_id uuid references businesses(id) not null,
    keyword_id uuid references keywords(id) not null,
    title text,
    content text,
    goal text check (goal in ('Inform', 'Compare', 'Convert')),
    tone text check (tone in ('Neutral', 'Expert', 'Friendly')),
    version integer default 1,
    parent_id uuid references articles(id), -- For linking previous versions
    
    constraint articles_version_unique unique (keyword_id, goal, tone, version)
);

-- RLS Policies
alter table articles enable row level security;

create policy "Users can view their own articles"
    on articles for select
    using (auth.uid() = user_id);

create policy "Users can insert their own articles"
    on articles for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own articles"
    on articles for update
    using (auth.uid() = user_id);

create policy "Users can delete their own articles"
    on articles for delete
    using (auth.uid() = user_id);
