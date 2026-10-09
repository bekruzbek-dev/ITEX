-- ITEX: Supabase SQL Editor'da to'liq ishga tushiring

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 3 and 80),
  grade smallint not null check (grade between 1 and 11),
  direction text not null check (direction in ('Web dasturlash','Sun''iy intellekt','Kompyuter savodxonligi','Grafik dizayn')),
  phone text not null check (phone ~ '^\+?[0-9]{9,13}$'),
  telegram text check (telegram is null or telegram ~ '^@?[A-Za-z0-9_]{4,32}$'),
  parent_phone text not null check (parent_phone ~ '^\+?[0-9]{9,13}$'),
  status text not null default 'yangi' check (status in ('yangi','bog_lanilmadi','bog_lanildi','qabul_qilindi','rad_etildi')),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.applications enable row level security;
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

-- Hamma ariza yubora oladi (faqat yangi holatda, izohsiz)
create policy "ariza yuborish" on public.applications
  for insert to anon, authenticated
  with check (status = 'yangi' and note is null);

-- Faqat adminlar o'qiydi, o'zgartiradi, o'chiradi
create policy "admin o'qiydi" on public.applications
  for select to authenticated using (public.is_admin());
create policy "admin yangilaydi" on public.applications
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin o'chiradi" on public.applications
  for delete to authenticated using (public.is_admin());

create policy "o'zini tekshirish" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- Admin panelda yangi arizalar darrov ko'rinishi uchun
alter publication supabase_realtime add table public.applications;

-- Admin qo'shish (Authentication > Users'da foydalanuvchi yaratgach, UUID'ni qo'ying):
-- insert into public.admins (user_id) values ('FOYDALANUVCHI-UUID');
