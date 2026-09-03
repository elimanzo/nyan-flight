# Supabase Leaderboard Setup

## 1. Create a project

Go to [supabase.com](https://supabase.com) → New project. Pick a region close to your players. Note the **Project URL** and **anon public key** (under Settings → API).

## 2. Create the `scores` table

Run this in the SQL Editor (Database → SQL Editor → New query):

```sql
create table scores (
  id          uuid primary key default gen_random_uuid(),
  initials    text not null check (char_length(initials) = 3),
  score       int  not null check (score >= 0 and score <= 9999),
  created_at  timestamptz not null default now()
);

-- index for the top-10 query
create index scores_score_desc on scores (score desc);

-- RLS: anonymous role only — select and insert; no update/delete
alter table scores enable row level security;

create policy "anon select" on scores
  for select to anon using (true);

create policy "anon insert" on scores
  for insert to anon with check (true);
```

## 3. Add environment variables

Copy `.env.example` to `.env.local` (git-ignored) and fill in your values:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

The app auto-detects the env vars at startup. If they are absent it falls back to an in-memory leaderboard (scores lost on page refresh).

## 4. Verify

1. `npm run dev`
2. Play a game and submit initials on the game-over screen
3. Check Database → Table Editor → `scores` — your row should appear

## Security notes

- The anon key is intentionally public. RLS limits it to `select` + `insert` only — no `update` or `delete`.
- A `CHECK` constraint on the table enforces `score <= 9999`. The service layer enforces the same cap client-side before the network call.
- Scores are client-submitted and therefore spoofable (see `docs/adr/0001-client-trusted-leaderboard.md`). The sanity cap is a deterrent, not a guarantee.
