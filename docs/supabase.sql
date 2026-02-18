-- Supabase SQL schema for SafeRouteExpo
-- Run in Supabase SQL editor

-- profiles table (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  dark_mode boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create trigger if not exists set_profiles_updated_at
before update on public.profiles
for each row execute procedure moddatetime (updated_at);

-- saved addresses table
create table if not exists public.saved_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  address_text text not null,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_saved_addresses_user on public.saved_addresses(user_id);

-- emergency contacts table
create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  relation text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_emergency_contacts_user on public.emergency_contacts(user_id);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.saved_addresses enable row level security;
alter table public.emergency_contacts enable row level security;

-- Allow users to CRUD their own rows
create policy if not exists "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy if not exists "profiles_upsert_own" on public.profiles for insert with check (auth.uid() = id);
create policy if not exists "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy if not exists "addresses_all_own" on public.saved_addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "contacts_all_own" on public.emergency_contacts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
