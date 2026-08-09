create extension if not exists pgcrypto;

create type public.workspace_role as enum ('owner','admin','member');
create type public.release_status as enum ('draft','in_review','changes_requested','approved','archived');
create type public.annotation_status as enum ('open','resolved');
create type public.approval_decision_type as enum ('approved','changes_requested');

create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, display_name text not null check (char_length(display_name) between 2 and 80), avatar_url text, created_at timestamptz not null default now());
create table public.workspaces (id uuid primary key default gen_random_uuid(), name text not null check (char_length(name) between 2 and 80), slug text not null unique check (slug ~ '^[a-z0-9-]{2,50}$'), owner_id uuid not null references public.profiles(id), plan text not null default 'free' check (plan in ('free','pro','early_access')), created_at timestamptz not null default now());
create table public.workspace_memberships (workspace_id uuid not null references public.workspaces(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, role public.workspace_role not null default 'member', joined_at timestamptz not null default now(), primary key (workspace_id,user_id));
create table public.projects (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, name text not null check (char_length(name) between 2 and 120), description text not null default '', archived_at timestamptz, created_at timestamptz not null default now());
create table public.releases (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, name text not null check (char_length(name) between 2 and 120), status public.release_status not null default 'draft', version integer not null default 1 check (version > 0), due_at timestamptz, approved_at timestamptz, created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.artifacts (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, release_id uuid not null references public.releases(id) on delete cascade, name text not null, created_by uuid not null references public.profiles(id), created_at timestamptz not null default now());
create table public.artifact_versions (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, artifact_id uuid not null references public.artifacts(id) on delete cascade, version integer not null check (version > 0), storage_path text not null, mime_type text not null check (mime_type in ('image/png','image/jpeg','image/webp')), byte_size bigint not null check (byte_size between 1 and 20971520), width integer not null check (width > 0), height integer not null check (height > 0), uploaded_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), unique(artifact_id,version));
create table public.annotations (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, artifact_version_id uuid not null references public.artifact_versions(id) on delete cascade, x numeric(8,7) not null check (x between 0 and 1), y numeric(8,7) not null check (y between 0 and 1), title text not null check (char_length(title) between 2 and 120), body text not null check (char_length(body) between 2 and 2000), status public.annotation_status not null default 'open', assignee_id uuid references public.profiles(id), created_by uuid not null references public.profiles(id), version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.comment_threads (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, annotation_id uuid not null unique references public.annotations(id) on delete cascade, created_at timestamptz not null default now());
create table public.comments (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, thread_id uuid not null references public.comment_threads(id) on delete cascade, author_id uuid references public.profiles(id), guest_name text, body text not null check (char_length(body) between 1 and 4000), created_at timestamptz not null default now(), check (author_id is not null or guest_name is not null));
create table public.checklist_items (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, release_id uuid not null references public.releases(id) on delete cascade, label text not null check (char_length(label) between 2 and 240), completed_at timestamptz, completed_by uuid references public.profiles(id), position integer not null default 0);
create table public.approval_requests (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, release_id uuid not null references public.releases(id) on delete cascade, review_cycle integer not null check (review_cycle > 0), requested_by uuid not null references public.profiles(id), requested_at timestamptz not null default now(), closed_at timestamptz, unique(release_id,review_cycle));
create table public.approval_decisions (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, approval_request_id uuid not null references public.approval_requests(id), decision public.approval_decision_type not null, reviewer_user_id uuid references public.profiles(id), reviewer_name text, note text, decided_at timestamptz not null default now(), idempotency_key text not null, check (reviewer_user_id is not null or reviewer_name is not null), unique(workspace_id,idempotency_key));
create table public.share_links (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, release_id uuid not null references public.releases(id) on delete cascade, token_hash text not null unique, expires_at timestamptz not null, revoked_at timestamptz, created_by uuid not null references public.profiles(id), created_at timestamptz not null default now());
create table public.activity_events (id bigint generated always as identity primary key, workspace_id uuid not null references public.workspaces(id) on delete cascade, release_id uuid references public.releases(id) on delete cascade, actor_id uuid references public.profiles(id), event_type text not null, payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create table public.workspace_usage (workspace_id uuid primary key references public.workspaces(id) on delete cascade, active_releases integer not null default 0 check(active_releases >= 0), storage_bytes bigint not null default 0 check(storage_bytes >= 0), updated_at timestamptz not null default now());

create index projects_workspace_idx on public.projects(workspace_id);
create index releases_workspace_status_idx on public.releases(workspace_id,status);
create index artifact_versions_workspace_idx on public.artifact_versions(workspace_id);
create index annotations_artifact_status_idx on public.annotations(artifact_version_id,status);
create index activity_workspace_created_idx on public.activity_events(workspace_id,created_at desc);
create index share_links_release_idx on public.share_links(release_id) where revoked_at is null;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.projects enable row level security;
alter table public.releases enable row level security;
alter table public.artifacts enable row level security;
alter table public.artifact_versions enable row level security;
alter table public.annotations enable row level security;
alter table public.comment_threads enable row level security;
alter table public.comments enable row level security;
alter table public.checklist_items enable row level security;
alter table public.approval_requests enable row level security;
alter table public.approval_decisions enable row level security;
alter table public.share_links enable row level security;
alter table public.activity_events enable row level security;
alter table public.workspace_usage enable row level security;

create policy profiles_self_select on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_self_insert on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_self_update on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy memberships_self_select on public.workspace_memberships for select to authenticated using ((select auth.uid()) = user_id);
create policy workspaces_owner_select on public.workspaces for select to authenticated using (owner_id = (select auth.uid()) or exists (select 1 from public.workspace_memberships m where m.workspace_id = id and m.user_id = (select auth.uid())));
create policy workspaces_owner_insert on public.workspaces for insert to authenticated with check (owner_id = (select auth.uid()));
create policy workspaces_owner_update on public.workspaces for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

do $$ declare table_name text; begin
  foreach table_name in array array['projects','releases','artifacts','artifact_versions','annotations','comment_threads','comments','checklist_items','approval_requests','approval_decisions','share_links','activity_events','workspace_usage'] loop
    execute format('create policy %I on public.%I for select to authenticated using (exists (select 1 from public.workspace_memberships m where m.workspace_id = %I.workspace_id and m.user_id = (select auth.uid())))', table_name || '_member_select', table_name, table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (exists (select 1 from public.workspace_memberships m where m.workspace_id = %I.workspace_id and m.user_id = (select auth.uid())))', table_name || '_member_insert', table_name, table_name);
    execute format('create policy %I on public.%I for update to authenticated using (exists (select 1 from public.workspace_memberships m where m.workspace_id = %I.workspace_id and m.user_id = (select auth.uid()))) with check (exists (select 1 from public.workspace_memberships m where m.workspace_id = %I.workspace_id and m.user_id = (select auth.uid())))', table_name || '_member_update', table_name, table_name, table_name);
  end loop;
end $$;

create policy memberships_owner_insert on public.workspace_memberships for insert to authenticated with check (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = (select auth.uid())));
create policy memberships_owner_update on public.workspace_memberships for update to authenticated using (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = (select auth.uid()))) with check (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = (select auth.uid())));
create policy memberships_owner_delete on public.workspace_memberships for delete to authenticated using (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = (select auth.uid())) and user_id <> (select auth.uid()));

create or replace function public.prevent_approval_decision_mutation() returns trigger language plpgsql security invoker set search_path = '' as $$ begin raise exception 'approval decisions are immutable'; end; $$;
create trigger approval_decisions_no_update_delete before update or delete on public.approval_decisions for each row execute function public.prevent_approval_decision_mutation();

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('release-artifacts','release-artifacts',false,20971520,array['image/png','image/jpeg','image/webp']) on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy artifact_storage_member_select on storage.objects for select to authenticated using (bucket_id='release-artifacts' and exists (select 1 from public.workspace_memberships m where m.workspace_id::text=(storage.foldername(name))[1] and m.user_id=(select auth.uid())));
create policy artifact_storage_member_insert on storage.objects for insert to authenticated with check (bucket_id='release-artifacts' and exists (select 1 from public.workspace_memberships m where m.workspace_id::text=(storage.foldername(name))[1] and m.user_id=(select auth.uid())));
create policy artifact_storage_member_update on storage.objects for update to authenticated using (bucket_id='release-artifacts' and exists (select 1 from public.workspace_memberships m where m.workspace_id::text=(storage.foldername(name))[1] and m.user_id=(select auth.uid()))) with check (bucket_id='release-artifacts' and exists (select 1 from public.workspace_memberships m where m.workspace_id::text=(storage.foldername(name))[1] and m.user_id=(select auth.uid())));

revoke update, delete on public.approval_decisions from anon, authenticated;
