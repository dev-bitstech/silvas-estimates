
-- Enable pgcrypto for gen_random_uuid if not enabled
create extension if not exists pgcrypto;

-- Auth profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'field', -- 'admin' | 'field'
  created_at timestamp with time zone default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using ( auth.uid() = id );
create policy "profiles_insert_self" on public.profiles for insert with check ( auth.uid() = id );
create policy "profiles_update_self" on public.profiles for update using ( auth.uid() = id );

-- Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('Interior','Exterior')),
  name text not null,
  rooms jsonb default '[]'::jsonb,
  sides jsonb default '[]'::jsonb,
  notes text,
  created_at timestamp with time zone default now()
);
alter table public.projects enable row level security;
create policy "projects_crud_auth" on public.projects
for all using ( auth.role() = 'authenticated' ) with check ( auth.role() = 'authenticated' );

-- Items
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  trade text not null,
  item text not null,
  unit text not null,
  qty numeric not null default 1,
  unit_cost numeric not null default 0,
  created_at timestamp with time zone default now()
);
alter table public.items enable row level security;
create policy "items_crud_auth" on public.items
for all using ( auth.role() = 'authenticated' ) with check ( auth.role() = 'authenticated' );

-- Catalog
create table if not exists public.catalog (
  id bigserial primary key,
  category text not null,  -- Interior | Exterior | Both
  trade text not null,
  item text not null,
  unit text not null,
  default_cost numeric not null,
  cost_type text not null, -- labor | material | labor+material
  active boolean not null default true
);
alter table public.catalog enable row level security;
create policy "catalog_read_all" on public.catalog for select using ( true );
create policy "catalog_admin_write" on public.catalog for all to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
