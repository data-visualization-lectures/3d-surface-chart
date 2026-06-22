alter table public.interactive_chart_builder_shares
  add column if not exists source_project_id uuid;

create unique index if not exists interactive_chart_builder_shares_source_project_id_unique
  on public.interactive_chart_builder_shares (source_project_id)
  where source_project_id is not null;
