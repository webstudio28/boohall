-- Add SEO audit/meta JSON blobs (idempotent)
alter table articles
add column if not exists seo_meta jsonb;

alter table articles
add column if not exists seo_audit jsonb;

alter table product_descriptions
add column if not exists seo_meta jsonb;

alter table product_descriptions
add column if not exists seo_audit jsonb;

alter table service_descriptions
add column if not exists seo_meta jsonb;

alter table service_descriptions
add column if not exists seo_audit jsonb;


