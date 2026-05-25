-- Single-operator model: any authenticated user has full CRUD on operational tables.
-- anon role remains blocked by RLS.

create policy "authed full access on businesses"
  on public.businesses for all
  to authenticated
  using (true)
  with check (true);

create policy "authed full access on outreach"
  on public.outreach for all
  to authenticated
  using (true)
  with check (true);

create policy "authed full access on websites"
  on public.websites for all
  to authenticated
  using (true)
  with check (true);
