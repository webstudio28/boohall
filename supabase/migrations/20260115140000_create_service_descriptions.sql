-- Create service_descriptions table
create table if not exists service_descriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  keywords jsonb,
  seo_data jsonb,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table service_descriptions enable row level security;

-- Policies for service_descriptions
create policy "Users can view their own service descriptions"
  on service_descriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own service descriptions"
  on service_descriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own service descriptions"
  on service_descriptions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own service descriptions"
  on service_descriptions for delete
  using (auth.uid() = user_id);
