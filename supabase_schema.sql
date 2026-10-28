create table if not exists public.wedding_rsvps (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  attendance boolean not null,
  guest_count integer not null check (guest_count between 0 and 20),
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists wedding_rsvps_created_at_idx
  on public.wedding_rsvps (created_at desc);

-- GitHub Pages runs only static files, so the browser submits RSVP records
-- with a Supabase publishable key. Keep the table write-only for visitors.
alter table public.wedding_rsvps enable row level security;

revoke all on table public.wedding_rsvps from anon, authenticated;
grant insert (full_name, attendance, guest_count, user_agent)
  on table public.wedding_rsvps
  to anon;

drop policy if exists "Public guests can submit an RSVP"
  on public.wedding_rsvps;

create policy "Public guests can submit an RSVP"
  on public.wedding_rsvps
  for insert
  to anon
  with check (
    char_length(btrim(full_name)) between 1 and 120
    and (
      (attendance = true and guest_count between 1 and 20)
      or (attendance = false and guest_count = 0)
    )
  );
