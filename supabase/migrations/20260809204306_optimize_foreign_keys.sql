create index if not exists activity_events_actor_idx on public.activity_events(actor_id);
create index if not exists activity_events_release_idx on public.activity_events(release_id);
create index if not exists annotations_assignee_idx on public.annotations(assignee_id);
create index if not exists annotations_created_by_idx on public.annotations(created_by);
create index if not exists annotations_workspace_idx on public.annotations(workspace_id);
create index if not exists approval_decisions_request_idx on public.approval_decisions(approval_request_id);
create index if not exists approval_decisions_reviewer_idx on public.approval_decisions(reviewer_user_id);
create index if not exists approval_requests_requested_by_idx on public.approval_requests(requested_by);
create index if not exists approval_requests_workspace_idx on public.approval_requests(workspace_id);
create index if not exists artifact_versions_uploaded_by_idx on public.artifact_versions(uploaded_by);
create index if not exists artifacts_created_by_idx on public.artifacts(created_by);
create index if not exists artifacts_release_idx on public.artifacts(release_id);
create index if not exists artifacts_workspace_idx on public.artifacts(workspace_id);
create index if not exists checklist_items_completed_by_idx on public.checklist_items(completed_by);
create index if not exists checklist_items_release_idx on public.checklist_items(release_id);
create index if not exists checklist_items_workspace_idx on public.checklist_items(workspace_id);
create index if not exists comment_threads_workspace_idx on public.comment_threads(workspace_id);
create index if not exists comments_author_idx on public.comments(author_id);
create index if not exists comments_thread_idx on public.comments(thread_id);
create index if not exists comments_workspace_idx on public.comments(workspace_id);
create index if not exists releases_created_by_idx on public.releases(created_by);
create index if not exists releases_project_idx on public.releases(project_id);
create index if not exists share_links_created_by_idx on public.share_links(created_by);
create index if not exists share_links_workspace_idx on public.share_links(workspace_id);
create index if not exists workspace_memberships_user_idx on public.workspace_memberships(user_id);
create index if not exists workspaces_owner_idx on public.workspaces(owner_id);

create or replace function public.onboard_workspace(workspace_name text, workspace_slug text, display_name text)
returns public.workspaces
language plpgsql
security invoker
set search_path = ''
as $$
declare created_workspace public.workspaces;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  insert into public.profiles(id, display_name) values ((select auth.uid()), display_name)
  on conflict (id) do update set display_name = excluded.display_name;
  insert into public.workspaces(name, slug, owner_id) values (workspace_name, workspace_slug, (select auth.uid())) returning * into created_workspace;
  insert into public.workspace_memberships(workspace_id, user_id, role) values (created_workspace.id, (select auth.uid()), 'owner');
  insert into public.workspace_usage(workspace_id) values (created_workspace.id);
  return created_workspace;
end;
$$;

revoke all on function public.onboard_workspace(text,text,text) from public;
grant execute on function public.onboard_workspace(text,text,text) to authenticated;

create or replace function public.enforce_free_release_limit()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare current_plan text; active_count integer;
begin
  select plan into current_plan from public.workspaces where id = new.workspace_id;
  if current_plan = 'free' and new.status <> 'archived' then
    select count(*) into active_count from public.releases where workspace_id = new.workspace_id and status <> 'archived' and id <> new.id;
    if active_count >= 3 then raise exception 'Free plan supports up to 3 active releases'; end if;
  end if;
  return new;
end;
$$;
create trigger releases_free_limit before insert or update of status on public.releases for each row execute function public.enforce_free_release_limit();
