-- Add analysis column to businesses to store AI-generated niche understanding
alter table businesses add column analysis jsonb;
