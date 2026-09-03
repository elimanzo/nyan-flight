create table public.scores (
  id bigint generated always as identity primary key,
  initials text not null,
  score integer not null,
  created_at timestamptz default now()
);

alter table public.scores enable row level security;

create policy "anyone can read scores"
  on public.scores for select using (true);

create policy "anyone can insert scores"
  on public.scores for insert with check (true);
