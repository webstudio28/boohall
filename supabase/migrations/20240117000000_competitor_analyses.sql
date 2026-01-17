
-- Competitor Analyses
create table competitor_analyses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  page_type text not null, -- 'Home', 'Service', 'Product', 'Article'
  my_url text not null,
  competitor_url text not null,
  status text default 'generating', -- 'generating', 'completed', 'failed'
  report_markdown text,
  created_at timestamptz default now()
);

-- RLS
alter table competitor_analyses enable row level security;

-- Policies
create policy "Users can view competitor analyses of own business" on competitor_analyses
  for select using (
    exists (
      select 1 from businesses
      where businesses.id = competitor_analyses.business_id
      and businesses.user_id = auth.uid()
    )
  );

create policy "Users can insert competitor analyses for own business" on competitor_analyses
  for insert with check (
    exists (
      select 1 from businesses
      where businesses.id = competitor_analyses.business_id
      and businesses.user_id = auth.uid()
    )
  );

create policy "Users can update competitor analyses of own business" on competitor_analyses
  for update using (
    exists (
      select 1 from businesses
      where businesses.id = competitor_analyses.business_id
      and businesses.user_id = auth.uid()
    )
  );
