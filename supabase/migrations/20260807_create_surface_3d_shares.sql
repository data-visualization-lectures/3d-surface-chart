create table if not exists public.surface_3d_shares (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  chart_config jsonb not null,
  created_by uuid,
  created_at timestamptz default now()
);

alter table public.surface_3d_shares enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'surface_3d_shares'
      and policyname = 'surface_3d_shares_read'
  ) then
    create policy surface_3d_shares_read
      on public.surface_3d_shares
      for select
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'surface_3d_shares'
      and policyname = 'surface_3d_shares_insert'
  ) then
    create policy surface_3d_shares_insert
      on public.surface_3d_shares
      for insert
      with check (true);
  end if;
end $$;

insert into storage.buckets (id, name, public)
values ('surface-3d-og-images', 'surface-3d-og-images', true)
on conflict (id) do update set public = excluded.public;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'surface_3d_og_images_read'
  ) then
    create policy surface_3d_og_images_read
      on storage.objects
      for select
      using (bucket_id = 'surface-3d-og-images');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'surface_3d_og_images_insert'
  ) then
    create policy surface_3d_og_images_insert
      on storage.objects
      for insert
      with check (bucket_id = 'surface-3d-og-images');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'surface_3d_og_images_update'
  ) then
    create policy surface_3d_og_images_update
      on storage.objects
      for update
      using (bucket_id = 'surface-3d-og-images')
      with check (bucket_id = 'surface-3d-og-images');
  end if;
end $$;
