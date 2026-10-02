-- =============================================================================
-- Tinkerers' Lab · Ahmedabad University
-- Complete Production Database Schema for Supabase
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- =============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null default '',
  role text not null check (role in ('student', 'faculty', 'staff', 'admin')) default 'student',
  enrollment_number text default '',
  department text default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Projects Table
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  reference_code text not null unique,
  title text not null,
  summary text not null,
  lead_name text not null,
  lead_email text not null,
  organization text not null default 'Ahmedabad University',
  team_members text default '',
  user_type text not null check (user_type in ('student', 'other')) default 'student',
  enrollment_number text default '',
  course_code text default '',
  year_of_study text default '',
  faculty_name text default '',
  section_number text default '',
  au_id_verified boolean not null default false,
  other_role text default '',
  other_organization text default '',
  other_phone text default '',
  other_id_number text default '',
  other_purpose text default '',
  resources_description text default '',
  safety_notes text default '',
  start_date date,
  end_date date,
  status text not null check (status in ('pending', 'approved', 'rejected', 'needs_changes', 'in_progress', 'completed', 'cancelled')) default 'pending',
  review_note text default '',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  submitted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for searching and reference lookups
create index if not exists idx_projects_reference_code on public.projects(reference_code);
create index if not exists idx_projects_lead_email on public.projects(lower(lead_email));
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_created_at on public.projects(created_at desc);

-- 3. Inventory Items (Lab Tools & Equipment)
create table if not exists public.inventory_items (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sku text not null unique,
  category text not null,
  unit text not null default 'unit',
  item_type text not null check (item_type in ('consumable', 'reusable', 'machine')) default 'reusable',
  location text not null default 'Main Lab',
  reorder_level integer not null default 2,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- 4. Stock Balances
create table if not exists public.stock_balances (
  item_id uuid references public.inventory_items(id) on delete cascade primary key,
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  quantity_reserved integer not null default 0 check (quantity_reserved >= 0),
  updated_at timestamptz not null default now()
);

-- 5. Tool Borrows (Equipment Checkout Tracking)
create table if not exists public.tool_borrows (
  id uuid primary key default uuid_generate_v4(),
  borrow_code text not null unique default ('BRW-' || upper(substr(md5(random()::text), 1, 8))),
  item_id uuid references public.inventory_items(id) on delete set null,
  item_name text not null,
  borrower_name text not null,
  borrower_email text not null,
  project_id uuid references public.projects(id) on delete set null,
  project_title text not null default 'Independent Lab Prototyping',
  user_type text not null check (user_type in ('student', 'other')) default 'student',
  enrollment_number text default '',
  course_code text default '',
  year_of_study text default '',
  faculty_name text default '',
  section_number text default '',
  other_role text default '',
  other_phone text default '',
  quantity integer not null default 1 check (quantity > 0),
  borrowed_date date not null default current_date,
  expected_return_date date not null default (current_date + interval '7 days')::date,
  actual_return_date date,
  status text not null check (status in ('active', 'returned', 'overdue')) default 'active',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tool_borrows_borrower on public.tool_borrows(lower(borrower_email));
create index if not exists idx_tool_borrows_status on public.tool_borrows(status);

-- 6. Audit Events
create table if not exists public.audit_events (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references auth.users(id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 7. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.inventory_items enable row level security;
alter table public.stock_balances enable row level security;
alter table public.tool_borrows enable row level security;
alter table public.audit_events enable row level security;

-- Profiles Policies
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Staff and admin can view all profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role in ('staff', 'admin') and p.is_active = true
    )
  );

-- Projects Policies
create policy "Anyone can submit a project proposal" on public.projects
  for insert with check (true);

create policy "Public can read non-archived projects" on public.projects
  for select using (true);

create policy "Staff and admins can update projects" on public.projects
  for update using (
    exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role in ('staff', 'admin') and p.is_active = true
    )
  );

-- Inventory & Stock Policies
create policy "Anyone can read available inventory" on public.inventory_items
  for select using (is_archived = false);

create policy "Anyone can read stock balances" on public.stock_balances
  for select using (true);

create policy "Staff can manage inventory" on public.inventory_items
  for all using (
    exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role in ('staff', 'admin') and p.is_active = true
    )
  );

create policy "Staff can manage stock balances" on public.stock_balances
  for all using (
    exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role in ('staff', 'admin') and p.is_active = true
    )
  );

-- Tool Borrows Policies
create policy "Anyone can record a tool borrow request" on public.tool_borrows
  for insert with check (true);

create policy "Anyone can view tool borrow list" on public.tool_borrows
  for select using (true);

create policy "Anyone can return a tool" on public.tool_borrows
  for update using (true);

-- 8. Pre-Seed Lab Equipment & Stock Balances
insert into public.inventory_items (id, name, sku, category, unit, item_type, location, reorder_level)
values
  ('11111111-1111-1111-1111-111111111111', 'Arduino Uno R3', 'DEV-ARD-001', 'Microcontrollers', 'pcs', 'reusable', 'Bin A-12', 5),
  ('22222222-2222-2222-2222-222222222222', 'Raspberry Pi 4 (4GB)', 'SBC-RPI-004', 'Single Board Computers', 'pcs', 'reusable', 'Cabinet B-04', 3),
  ('33333333-3333-3333-3333-333333333333', 'PLA 3D Printer Filament (White 1kg)', 'FIL-PLA-WHT', '3D Printing', 'spool', 'consumable', 'Shelf C-01', 4),
  ('44444444-4444-4444-4444-444444444444', 'Soldering Station 60W (ESD-Safe)', 'TLS-SLD-060', 'Tools & Equipment', 'unit', 'machine', 'Workbench 2', 2),
  ('55555555-5555-5555-5555-555555555555', 'Jumper Wires (M-to-M 40pcs)', 'WIR-JMP-MM40', 'Cables & Wires', 'pack', 'consumable', 'Bin D-03', 10),
  ('66666666-6666-6666-6666-666666666666', 'Digital Storage Oscilloscope (100MHz 2-Ch)', 'EQP-OSC-100', 'Test & Measurement', 'unit', 'machine', 'Bench T-01', 1),
  ('77777777-7777-7777-7777-777777777777', 'True-RMS Digital Multimeter', 'TLS-MM-TRMS', 'Test & Measurement', 'unit', 'reusable', 'Drawer M-02', 2),
  ('88888888-8888-8888-8888-888888888888', 'Adjustable DC Power Supply (30V / 5A)', 'PWR-SUP-3005', 'Power Equipment', 'unit', 'machine', 'Bench T-02', 2),
  ('99999999-9999-9999-9999-999999999999', 'Precision Electronics Hand Tool Kit (18-pc)', 'TLS-KIT-E18', 'Hand Tools', 'set', 'reusable', 'Tool Wall W-01', 3)
on conflict (sku) do nothing;

insert into public.stock_balances (item_id, quantity_on_hand, quantity_reserved)
values
  ('11111111-1111-1111-1111-111111111111', 14, 2),
  ('22222222-2222-2222-2222-222222222222', 6, 1),
  ('33333333-3333-3333-3333-333333333333', 2, 0),
  ('44444444-4444-4444-4444-444444444444', 5, 0),
  ('55555555-5555-5555-5555-555555555555', 25, 3),
  ('66666666-6666-6666-6666-666666666666', 4, 1),
  ('77777777-7777-7777-7777-777777777777', 8, 2),
  ('88888888-8888-8888-8888-888888888888', 5, 1),
  ('99999999-9999-9999-9999-999999999999', 10, 1)
on conflict (item_id) do nothing;

-- 9. Trigger for Auto-Updating updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

create or replace trigger set_tool_borrows_updated_at
  before update on public.tool_borrows
  for each row execute function public.handle_updated_at();
