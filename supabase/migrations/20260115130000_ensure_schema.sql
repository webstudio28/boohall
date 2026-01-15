-- 1. Create product_descriptions table if it doesn't exist
create table if not exists product_descriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  image_url text not null,
  keywords jsonb,
  seo_data jsonb,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS on the table
alter table product_descriptions enable row level security;

-- 3. Create policies for product_descriptions (drop first to ensure no duplicates if re-running)
drop policy if exists "Users can view their own product descriptions" on product_descriptions;
create policy "Users can view their own product descriptions"
  on product_descriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own product descriptions" on product_descriptions;
create policy "Users can insert their own product descriptions"
  on product_descriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own product descriptions" on product_descriptions;
create policy "Users can update their own product descriptions"
  on product_descriptions for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own product descriptions" on product_descriptions;
create policy "Users can delete their own product descriptions"
  on product_descriptions for delete
  using (auth.uid() = user_id);

-- 4. Storage Bucket (Idempotent)
insert into storage.buckets (id, name, public)
values ('product_images', 'product_images', true)
on conflict (id) do update set public = true;

-- 5. Storage Policies (Clean slate to be safe)
drop policy if exists "Product Images are publicly accessible" on storage.objects;
drop policy if exists "Authenticated users can upload product images" on storage.objects;
drop policy if exists "Users can update their own product images" on storage.objects;
drop policy if exists "Users can delete their own product images" on storage.objects;

create policy "Product Images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'product_images' );

create policy "Authenticated users can upload product images"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'product_images' );

create policy "Users can update their own product images"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'product_images' and (auth.uid() = owner) );

create policy "Users can delete their own product images"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'product_images' and (auth.uid() = owner) );
