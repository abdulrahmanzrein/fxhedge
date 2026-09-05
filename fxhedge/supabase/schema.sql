-- Hedged — Supabase schema (build guide §4b)
-- Run in: supabase.com/dashboard -> SQL Editor -> New query -> paste -> Run
-- Project ref: sfkztbpfhsktehnkojzh

-- Business profiles (1:1 with auth.users)
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  business_name text,
  business_type text,
  home_currency text default 'CAD',
  supplier_currency text default 'EUR',
  invoice_amount numeric default 12000,
  target_margin numeric default 10,
  days_until_due int default 21,
  updated_at timestamptz default now()
);

-- Saved scenarios
create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text default 'Primary invoice',
  amount numeric default 12000,
  pair text default 'EUR-CAD',
  revenue numeric default 18000,
  days_ago int default 21,
  target_margin numeric default 10,
  saved_at timestamptz default now()
);

-- Row-level security: users can only touch their own rows
alter table public.profiles enable row level security;
alter table public.scenarios enable row level security;

create policy "profiles are visible to their owner"
  on public.profiles for select using (auth.uid() = user_id);
create policy "profiles are upsertable by their owner"
  on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles are updateable by their owner"
  on public.profiles for update using (auth.uid() = user_id);

create policy "scenarios visible to owner"
  on public.scenarios for select using (auth.uid() = user_id);
create policy "scenarios insert by owner"
  on public.scenarios for insert with check (auth.uid() = user_id);
create policy "scenarios updateable by owner"
  on public.scenarios for update using (auth.uid() = user_id);
create policy "scenarios delete by owner"
  on public.scenarios for delete using (auth.uid() = user_id);

-- Auto-create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
