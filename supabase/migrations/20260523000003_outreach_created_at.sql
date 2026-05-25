-- Outreach needs a real creation timestamp so the cron can pick the oldest pending rows.
alter table public.outreach
  add column created_at timestamptz not null default now();

create index outreach_created_at_idx on public.outreach(created_at);

-- Backfill index for the cron's primary access pattern
create index outreach_stage_created_at_idx on public.outreach(stage, created_at);
