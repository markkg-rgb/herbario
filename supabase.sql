-- =========================================================
-- BASE DE DATOS COMPARTIDA DEL HERBARIO (Supabase)
-- Cópialo entero en Supabase → SQL Editor → New query → Run.
-- ANTES de ejecutarlo, cambia 'CAMBIA-ESTA-CLAVE' (última línea)
-- por la clave de edición que quieras usar.
-- =========================================================

-- Especies creadas, editadas o borradas desde la app
create table if not exists public.especies (
  id          text primary key,
  datos       jsonb not null,
  borrada     boolean not null default false,
  actualizado timestamptz not null default now()
);

-- Clave de edición (no se puede leer desde la app)
create table if not exists public.config_privada (
  clave text not null
);
alter table public.config_privada enable row level security;  -- sin políticas: nadie la lee desde fuera

-- ¿La petición trae la clave de edición correcta en la cabecera x-clave-edicion?
create or replace function public.clave_valida()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.config_privada
    where clave = coalesce(current_setting('request.headers', true)::json ->> 'x-clave-edicion', '')
  );
$$;
grant execute on function public.clave_valida() to anon, authenticated;

-- Permisos: todo el mundo puede leer; solo con la clave se puede escribir
alter table public.especies enable row level security;

drop policy if exists "leer especies" on public.especies;
create policy "leer especies" on public.especies
  for select using (true);

drop policy if exists "crear con clave" on public.especies;
create policy "crear con clave" on public.especies
  for insert with check (public.clave_valida());

drop policy if exists "editar con clave" on public.especies;
create policy "editar con clave" on public.especies
  for update using (public.clave_valida()) with check (public.clave_valida());

drop policy if exists "borrar con clave" on public.especies;
create policy "borrar con clave" on public.especies
  for delete using (public.clave_valida());

-- Tu clave de edición (cámbiala aquí antes de ejecutar)
delete from public.config_privada;
insert into public.config_privada (clave) values ('CAMBIA-ESTA-CLAVE');
