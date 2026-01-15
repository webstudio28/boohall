-- Create tables

-- Businesses (Stores the business context)
create table businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  website_url text not null,
  business_type text not null,
  product_description text,
  target_country text,
  language text not null default 'bg' check (language in ('bg', 'en')),
  created_at timestamptz default now()
);

-- Competitors
create table competitors (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  domain text not null,
  content_type text, -- 'blog', 'landing', etc.
  weakness_summary text,
  created_at timestamptz default now()
);

-- Keywords
create table keywords (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  keyword text not null,
  volume int,
  difficulty text, -- 'Easy', 'Medium', 'Hard'
  intent text, -- 'Blog', 'Landing', 'Mixed'
  is_selected boolean default false,
  created_at timestamptz default now()
);

-- Articles
create table articles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  keyword_id uuid references keywords(id),
  title text,
  content_md text,
  status text default 'draft', -- 'draft', 'generating', 'completed'
  language text not null default 'bg',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security (RLS)

alter table businesses enable row level security;
alter table competitors enable row level security;
alter table keywords enable row level security;
alter table articles enable row level security;

-- Policies

-- Businesses: Users can only see their own business
create policy "Users can view own business" on businesses
  for select using (auth.uid() = user_id);

create policy "Users can insert own business" on businesses
  for insert with check (auth.uid() = user_id);

create policy "Users can update own business" on businesses
  for update using (auth.uid() = user_id);

-- Competitors: Access via business ownership
create policy "Users can view competitors of own business" on competitors
  for select using (
    exists (
      select 1 from businesses
      where businesses.id = competitors.business_id
      and businesses.user_id = auth.uid()
    )
  );

create policy "Users can insert competitors for own business" on competitors
  for insert with check (
    exists (
      select 1 from businesses
      where businesses.id = competitors.business_id
      and businesses.user_id = auth.uid()
    )
  );

-- Keywords: Access via business ownership
create policy "Users can view keywords of own business" on keywords
  for select using (
    exists (
      select 1 from businesses
      where businesses.id = keywords.business_id
      and businesses.user_id = auth.uid()
    )
  );

create policy "Users can modify keywords of own business" on keywords
  for all using (
    exists (
      select 1 from businesses
      where businesses.id = keywords.business_id
      and businesses.user_id = auth.uid()
    )
  );

-- Articles: Access via business ownership
create policy "Users can view articles of own business" on articles
  for select using (
    exists (
      select 1 from businesses
      where businesses.id = articles.business_id
      and businesses.user_id = auth.uid()
    )
  );

create policy "Users can modify articles of own business" on articles
  for all using (
    exists (
      select 1 from businesses
      where businesses.id = articles.business_id
      and businesses.user_id = auth.uid()
    )
  );
