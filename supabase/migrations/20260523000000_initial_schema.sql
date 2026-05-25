-- businesses
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  address text,
  website text,
  website_status text,
  email text,
  created_at timestamptz not null default now()
);

-- outreach
create table public.outreach (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  stage text,
  email_1_sent_at timestamptz,
  email_2_sent_at timestamptz,
  reply_at timestamptz,
  reply_sentiment text,
  is_interested boolean
);

create index outreach_business_id_idx on public.outreach(business_id);
create index outreach_stage_idx on public.outreach(stage);

-- websites
create table public.websites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  code_repo text,
  vercel_url text,
  domain text,
  status text,
  created_at timestamptz not null default now()
);

create index websites_business_id_idx on public.websites(business_id);

-- users (linked to Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  plan text not null default 'free',
  analyses_used integer not null default 0,
  analyses_limit integer not null default 10
);

-- Enable Row Level Security
alter table public.businesses enable row level security;
alter table public.outreach enable row level security;
alter table public.websites enable row level security;
alter table public.users enable row level security;

-- Users can read/update their own row
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);
