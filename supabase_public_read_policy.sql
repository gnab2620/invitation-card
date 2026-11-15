-- Makes the displayed RSVP fields readable without signing in.
-- Anyone with the published site URL can view and download these values.
revoke select on public.wedding_rsvps from anon, authenticated;

grant select (full_name, attendance, guest_count, created_at)
  on public.wedding_rsvps
  to anon, authenticated;

drop policy if exists "Configured admin can read RSVP responses"
  on public.wedding_rsvps;

drop policy if exists "Public can read RSVP responses"
  on public.wedding_rsvps;

create policy "Public can read RSVP responses"
  on public.wedding_rsvps
  for select
  to anon, authenticated
  using (true);
