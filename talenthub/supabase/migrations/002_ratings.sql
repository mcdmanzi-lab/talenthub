-- Worker Ratings
create table if not exists worker_ratings (
  id uuid primary key default gen_random_uuid(),
  worker_id    uuid references profiles(id) on delete cascade,
  employer_id  uuid references profiles(id) on delete cascade,
  rating       integer check (rating >= 1 and rating <= 5),
  comment      text,
  created_at   timestamptz default now(),
  unique(worker_id, employer_id)
);

alter table worker_ratings enable row level security;

-- Anyone can read ratings
create policy "ratings - public read" on worker_ratings for select using (true);

-- Only employers can rate workers (once per worker)
create policy "ratings - employer insert" on worker_ratings for insert
  with check (
    auth.uid() = employer_id
    and exists (select 1 from profiles where id = auth.uid() and role = 'employer')
  );

-- Employer can update their own rating
create policy "ratings - employer update" on worker_ratings for update
  using (auth.uid() = employer_id);

-- Employer can delete their own rating
create policy "ratings - employer delete" on worker_ratings for delete
  using (auth.uid() = employer_id);

-- Add average rating column to profiles
alter table profiles add column if not exists avg_rating numeric(3,2) default 0;
alter table profiles add column if not exists rating_count integer default 0;

-- Function to update average rating automatically
create or replace function update_worker_rating()
returns trigger as $$
begin
  update profiles set
    avg_rating   = (select round(avg(rating)::numeric, 2) from worker_ratings where worker_id = coalesce(new.worker_id, old.worker_id)),
    rating_count = (select count(*) from worker_ratings where worker_id = coalesce(new.worker_id, old.worker_id))
  where id = coalesce(new.worker_id, old.worker_id);
  return new;
end;
$$ language plpgsql;

create trigger update_rating_trigger
after insert or update or delete on worker_ratings
for each row execute procedure update_worker_rating();
