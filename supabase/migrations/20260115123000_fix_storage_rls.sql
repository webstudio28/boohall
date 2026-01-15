-- Ensure bucket exists (public)
insert into storage.buckets (id, name, public)
values ('product_images', 'product_images', true)
on conflict (id) do update set public = true;

-- Drop existing policies to avoid conflicts/duplication
drop policy if exists "Product Images are publicly accessible" on storage.objects;
drop policy if exists "Authenticated users can upload product images" on storage.objects;
drop policy if exists "Users can update their own product images" on storage.objects;
drop policy if exists "Users can delete their own product images" on storage.objects;

-- Re-create policies

-- 1. Public Read Access
create policy "Product Images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'product_images' );

-- 2. Authenticated Upload Access
-- Using 'to authenticated' clause effectively does auth.role() = 'authenticated'
create policy "Authenticated users can upload product images"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'product_images' );

-- 3. Update Own Images
create policy "Users can update their own product images"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'product_images' and (auth.uid() = owner) );

-- 4. Delete Own Images
create policy "Users can delete their own product images"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'product_images' and (auth.uid() = owner) );
