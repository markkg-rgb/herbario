-- =========================================================
-- BASE DE DATOS COMPARTIDA DE HERBOLARIO (Supabase)
-- Cópialo entero en Supabase → SQL Editor → New query → Run.
--
-- Modo abierto: cualquiera que tenga la app puede añadir,
-- editar y borrar especies. Para poder deshacer errores,
-- cada cambio guarda una copia en "especies_historial".
-- =========================================================

-- Especies creadas, editadas o borradas desde la app
create table if not exists public.especies (
  id          text primary key,
  datos       jsonb not null,
  borrada     boolean not null default false,
  actualizado timestamptz not null default now(),
  -- Límite de tamaño por especie (fotos incluidas) para evitar abusos: 3 MB
  constraint especies_tamano check (pg_column_size(datos) < 3000000)
);

-- Historial: copia de cómo estaba cada especie antes de cada cambio
create table if not exists public.especies_historial (
  num         bigserial primary key,
  id          text not null,
  datos       jsonb,
  borrada     boolean,
  operacion   text not null,           -- UPDATE o DELETE
  fecha       timestamptz not null default now()
);

create or replace function public.guardar_historial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.especies_historial (id, datos, borrada, operacion)
  values (old.id, old.datos, old.borrada, tg_op);
  return coalesce(new, old);
end;
$$;

drop trigger if exists especies_historial on public.especies;
create trigger especies_historial
  before update or delete on public.especies
  for each row execute function public.guardar_historial();

-- Permisos: todo el mundo puede leer y escribir especies;
-- el historial no se puede leer ni tocar desde la app (solo desde Supabase)
alter table public.especies enable row level security;
alter table public.especies_historial enable row level security;

drop policy if exists "leer especies" on public.especies;
create policy "leer especies" on public.especies for select using (true);

drop policy if exists "crear especies" on public.especies;
create policy "crear especies" on public.especies for insert with check (true);

drop policy if exists "editar especies" on public.especies;
create policy "editar especies" on public.especies for update using (true) with check (true);

drop policy if exists "borrar especies" on public.especies;
create policy "borrar especies" on public.especies for delete using (true);

grant select, insert, update, delete on public.especies to anon, authenticated;

-- Para recuperar una especie desde el historial (en el SQL Editor):
--   select * from especies_historial where id = 'id-de-la-especie' order by fecha desc;
--   update especies set datos = (select datos from especies_historial where num = NUMERO), borrada = false
--     where id = 'id-de-la-especie';
