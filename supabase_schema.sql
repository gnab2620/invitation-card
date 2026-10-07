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
