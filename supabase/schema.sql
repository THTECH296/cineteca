-- ───────────────── CineTeca — schema (movies, orders, admin) ─────────────────

create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  genre text default '',
  duration int default 120,
  rating text default '12',
  synopsis text default '',
  accent text default '#E8B23A',
  format text default 'Dublado · 2D',
  poster_url text,
  price int not null default 24,
  times text[] not null default array['16:00','19:00','21:30'],
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  movie_id uuid references public.movies(id) on delete set null,
  movie_title text,
  session_date text not null,
  session_time text not null,
  seats jsonb not null default '[]',
  amount int not null default 0,
  method text default 'pix',
  status text not null default 'paid',
  created_at timestamptz not null default now()
);
alter table public.orders replica identity full;

create table if not exists public.admin_emails (email text primary key);
insert into public.admin_emails(email) values ('admin@cineteca.dev') on conflict do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_emails where email = (auth.jwt() ->> 'email'))
$$;

alter table public.movies enable row level security;
alter table public.orders enable row level security;

drop policy if exists movies_read on public.movies;
create policy movies_read on public.movies for select using (active or public.is_admin());
drop policy if exists movies_admin_ins on public.movies;
create policy movies_admin_ins on public.movies for insert to authenticated with check (public.is_admin());
drop policy if exists movies_admin_upd on public.movies;
create policy movies_admin_upd on public.movies for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists movies_admin_del on public.movies;
create policy movies_admin_del on public.movies for delete to authenticated using (public.is_admin());

drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders for insert to authenticated with check (user_id = auth.uid());
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update to authenticated using (public.is_admin() or user_id = auth.uid()) with check (public.is_admin() or user_id = auth.uid());

-- storage policies (bucket 'posters')
drop policy if exists posters_read on storage.objects;
create policy posters_read on storage.objects for select using (bucket_id = 'posters');
drop policy if exists posters_admin_ins on storage.objects;
create policy posters_admin_ins on storage.objects for insert to authenticated with check (bucket_id = 'posters' and public.is_admin());
drop policy if exists posters_admin_upd on storage.objects;
create policy posters_admin_upd on storage.objects for update to authenticated using (bucket_id = 'posters' and public.is_admin());
drop policy if exists posters_admin_del on storage.objects;
create policy posters_admin_del on storage.objects for delete to authenticated using (bucket_id = 'posters' and public.is_admin());

-- realtime
do $$ begin
  begin alter publication supabase_realtime add table public.orders; exception when others then null; end;
  begin alter publication supabase_realtime add table public.movies; exception when others then null; end;
end $$;
