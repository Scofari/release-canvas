create or replace function public.record_release_decision(
  p_workspace_id uuid,
  p_release_id uuid,
  p_decision public.approval_decision_type,
  p_note text,
  p_idempotency_key text
)
returns table (
  decision_id uuid,
  decision public.approval_decision_type,
  decided_at timestamptz,
  release_status public.release_status,
  release_version integer
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_release public.releases%rowtype;
  v_request_id uuid;
  v_decision public.approval_decisions%rowtype;
  v_cycle integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select d.*
    into v_decision
    from public.approval_decisions d
    join public.approval_requests r on r.id = d.approval_request_id
   where d.workspace_id = p_workspace_id
     and r.release_id = p_release_id
     and d.idempotency_key = p_idempotency_key;

  if found then
    select * into v_release
      from public.releases
     where id = p_release_id and workspace_id = p_workspace_id;
    return query select v_decision.id, v_decision.decision, v_decision.decided_at,
      v_release.status, v_release.version;
    return;
  end if;

  select * into v_release
    from public.releases
   where id = p_release_id and workspace_id = p_workspace_id
   for update;

  if not found then
    raise exception 'Release not found' using errcode = 'P0002';
  end if;
  if v_release.status <> 'in_review' then
    raise exception 'Release is not awaiting a decision' using errcode = '22023';
  end if;
  if p_note is not null and char_length(p_note) > 2000 then
    raise exception 'Approval note is too long' using errcode = '22023';
  end if;
  if char_length(p_idempotency_key) < 8 or char_length(p_idempotency_key) > 120 then
    raise exception 'Invalid idempotency key' using errcode = '22023';
  end if;
  if p_decision = 'approved' and exists (
    select 1
      from public.annotations n
      join public.artifact_versions v on v.id = n.artifact_version_id
      join public.artifacts a on a.id = v.artifact_id
     where a.release_id = p_release_id and n.status = 'open'
  ) then
    raise exception 'Resolve every annotation before approval' using errcode = '22023';
  end if;

  select coalesce(max(review_cycle), 0) + 1 into v_cycle
    from public.approval_requests
   where release_id = p_release_id;

  insert into public.approval_requests (
    workspace_id, release_id, review_cycle, requested_by, closed_at
  ) values (
    p_workspace_id, p_release_id, v_cycle, auth.uid(), now()
  ) returning id into v_request_id;

  insert into public.approval_decisions (
    workspace_id, approval_request_id, decision, reviewer_user_id, note, idempotency_key
  ) values (
    p_workspace_id, v_request_id, p_decision, auth.uid(), nullif(trim(p_note), ''), p_idempotency_key
  ) returning * into v_decision;

  update public.releases
     set status = case when p_decision = 'approved' then 'approved'::public.release_status else 'changes_requested'::public.release_status end,
         approved_at = case when p_decision = 'approved' then now() else null end,
         version = version + 1,
         updated_at = now()
   where id = p_release_id
   returning * into v_release;

  return query select v_decision.id, v_decision.decision, v_decision.decided_at,
    v_release.status, v_release.version;
end;
$$;

revoke all on function public.record_release_decision(uuid, uuid, public.approval_decision_type, text, text) from public, anon;
grant execute on function public.record_release_decision(uuid, uuid, public.approval_decision_type, text, text) to authenticated;
