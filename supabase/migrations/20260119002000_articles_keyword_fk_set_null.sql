-- Keep articles when deleting keywords:
-- - allow keyword_id to be nullable
-- - set FK to ON DELETE SET NULL

alter table articles
alter column keyword_id drop not null;

-- Default constraint name in Postgres is usually <table>_<column>_fkey
alter table articles
drop constraint if exists articles_keyword_id_fkey;

alter table articles
add constraint articles_keyword_id_fkey
foreign key (keyword_id)
references keywords(id)
on delete set null;


