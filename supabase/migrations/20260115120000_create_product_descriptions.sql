-- Create product_descriptions table
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

-- Enable RLS
alter table product_descriptions enable row level security;

-- Policies for product_descriptions
create policy "Users can view their own product descriptions"
  on product_descriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own product descriptions"
  on product_descriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own product descriptions"
  on product_descriptions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own product descriptions"
  on product_descriptions for delete
  using (auth.uid() = user_id);

-- Create product_images bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('product_images', 'product_images', true)
on conflict (id) do nothing;

-- Storage policies for product_images
-- Allow public read access
create policy "Product Images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'product_images' );

-- Allow authenticated users to upload
create policy "Authenticated users can upload product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product_images' and 
    auth.role() = 'authenticated'
  );

-- Allow users to update/delete their own images (optional but good practice)
create policy "Users can update their own product images"
  on storage.objects for update
  using ( bucket_id = 'product_images' and auth.uid() = owner );

create policy "Users can delete their own product images"
  on storage.objects for delete
  using ( bucket_id = 'product_images' and auth.uid() = owner );
