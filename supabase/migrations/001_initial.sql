-- Fieldwork OS, Supabase migration 001
-- Run in the Supabase SQL editor before connecting the frontend.
-- This stores project metadata and pseudonymous research references only.
create extension if not exists pgcrypto;

create table if not exists public.workspaces (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(trim(name)) between 2 and 160),
 course_code text not null default 'ANTH0130',
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create table if not exists public.memberships (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null default 'Researcher',
 role text not null check (role in ('owner','admin','member','viewer')),
 gdpr_completed_at timestamptz,
 joined_at timestamptz not null default now(),
 unique(workspace_id,user_id)
);
create table if not exists public.workspace_records (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 record_type text not null check (record_type in ('task','rq','site','participant','session','portfolio','decision','methods')),
 title text not null check (length(trim(title)) between 1 and 300),
 data jsonb not null default '{}'::jsonb,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists idx_workspace_records_workspace_type on public.workspace_records(workspace_id,record_type);
create table if not exists public.personal_notes (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 section text not null,
 content text not null default '',
 updated_at timestamptz not null default now(),
 unique(workspace_id,user_id,section)
);
create table if not exists public.workspace_invites (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 code_hash text not null unique,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 use_count integer not null default 0,
 max_uses integer not null default 10
);
create table if not exists public.audit_events (
 id bigint generated always as identity primary key,
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 actor_id uuid,
 event_type text not null,
 record_id uuid,
 occurred_at timestamptz not null default now()
);

-- SECURITY DEFINER helpers bypass membership table RLS to avoid recursion.
create or replace function public.is_workspace_member(w uuid) returns boolean
 language sql stable security definer set search_path=public
 as $$ select exists(select 1 from public.memberships where workspace_id=w and user_id=(select auth.uid())); $$;
create or replace function public.is_workspace_editor(w uuid) returns boolean
 language sql stable security definer set search_path=public
 as $$ select exists(select 1 from public.memberships where workspace_id=w and user_id=(select auth.uid()) and role in ('owner','admin','member')); $$;
create or replace function public.is_workspace_owner(w uuid) returns boolean
 language sql stable security definer set search_path=public
 as $$ select exists(select 1 from public.memberships where workspace_id=w and user_id=(select auth.uid()) and role='owner'); $$;
create or replace function public.is_workspace_manager(w uuid) returns boolean
 language sql stable security definer set search_path=public
 as $$ select exists(select 1 from public.memberships where workspace_id=w and user_id=(select auth.uid()) and role in ('owner','admin')); $$;

alter table public.workspaces enable row level security;
alter table public.memberships enable row level security;
alter table public.workspace_records enable row level security;
alter table public.personal_notes enable row level security;
alter table public.workspace_invites enable row level security;
alter table public.audit_events enable row level security;

create policy "members can view workspace" on public.workspaces for select to authenticated using (public.is_workspace_member(id));
create policy "members can see directory" on public.memberships for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "members may report own training" on public.memberships for update to authenticated
 using (user_id=(select auth.uid()) and public.is_workspace_member(workspace_id))
 with check (user_id=(select auth.uid()) and public.is_workspace_member(workspace_id));
create policy "members can read research metadata" on public.workspace_records for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "editors can add records" on public.workspace_records for insert to authenticated
 with check (created_by=(select auth.uid()) and public.is_workspace_editor(workspace_id));
create policy "editors can update records" on public.workspace_records for update to authenticated
 using (public.is_workspace_editor(workspace_id)) with check (public.is_workspace_editor(workspace_id));
create policy "editors can delete records" on public.workspace_records for delete to authenticated using (public.is_workspace_editor(workspace_id));
create policy "user may view own notes" on public.personal_notes for select to authenticated
 using (user_id=(select auth.uid()) and public.is_workspace_member(workspace_id));
create policy "user may write own notes" on public.personal_notes for insert to authenticated
 with check (user_id=(select auth.uid()) and public.is_workspace_member(workspace_id));
create policy "user may edit own notes" on public.personal_notes for update to authenticated
 using (user_id=(select auth.uid()) and public.is_workspace_member(workspace_id))
 with check (user_id=(select auth.uid()) and public.is_workspace_member(workspace_id));
create policy "user may delete own notes" on public.personal_notes for delete to authenticated
 using (user_id=(select auth.uid()) and public.is_workspace_member(workspace_id));
create policy "managers can view audit events" on public.audit_events for select to authenticated using (public.is_workspace_manager(workspace_id));

-- Narrow grants: role cannot be modified through direct UPDATE of memberships.
revoke all on public.workspaces,public.memberships,public.workspace_records,public.personal_notes,public.workspace_invites,public.audit_events from anon,authenticated;
grant select on public.workspaces,public.memberships,public.workspace_records,public.personal_notes to authenticated;
grant update(gdpr_completed_at) on public.memberships to authenticated;
grant insert on public.workspace_records,public.personal_notes to authenticated;
grant update(title,data) on public.workspace_records to authenticated;
grant delete on public.workspace_records,public.personal_notes to authenticated;
-- PostgREST upsert updates all supplied conflict-key columns; RLS still restricts each row to its author.
grant update(workspace_id,user_id,section,content,updated_at) on public.personal_notes to authenticated;
grant select on public.audit_events to authenticated;

create or replace function public.create_workspace(workspace_name text, course text default 'ANTH0130', display_name text default 'Researcher')
returns uuid language plpgsql security definer set search_path=public as $$
declare w uuid; u uuid := auth.uid();
begin
 if u is null then raise exception 'Authentication required'; end if;
 if length(trim(coalesce(workspace_name,''))) < 2 then raise exception 'A project name is required'; end if;
 insert into public.workspaces(name,course_code,created_by) values (trim(workspace_name),coalesce(nullif(trim(course),''),'ANTH0130'),u) returning id into w;
 insert into public.memberships(workspace_id,user_id,role,display_name) values(w,u,'owner',left(coalesce(nullif(trim(display_name),''),'Researcher'),120));
 return w;
end $$;

create or replace function public.create_workspace_invite(target_workspace uuid)
returns text language plpgsql security definer set search_path=public as $$
declare code text;
begin
 if auth.uid() is null or not public.is_workspace_manager(target_workspace) then raise exception 'Manager access required'; end if;
 code := encode(gen_random_bytes(16),'hex');
 insert into public.workspace_invites(workspace_id,code_hash,created_by,expires_at,max_uses)
 values(target_workspace,encode(digest(code,'sha256'),'hex'),auth.uid(),now()+interval '14 days',10);
 return code;
end $$;

create or replace function public.join_workspace_by_code(invite_code text,display_name text default 'Researcher')
returns uuid language plpgsql security definer set search_path=public as $$
declare i public.workspace_invites%rowtype; u uuid:=auth.uid();
begin
 if u is null then raise exception 'Authentication required'; end if;
 select * into i from public.workspace_invites
 where code_hash=encode(digest(trim(invite_code),'sha256'),'hex') for update;
 if not found or i.expires_at <= now() or i.use_count >= i.max_uses then raise exception 'Invitation invalid or expired'; end if;
 if not exists(select 1 from public.memberships where workspace_id=i.workspace_id and user_id=u) then
   insert into public.memberships(workspace_id,user_id,display_name,role)
   values(i.workspace_id,u,left(coalesce(nullif(trim(display_name),''),'Researcher'),120),'member');
   update public.workspace_invites set use_count=use_count+1 where id=i.id;
 end if;
 return i.workspace_id;
end $$;

create or replace function public.set_workspace_role(target_workspace uuid,target_user uuid,new_role text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.is_workspace_owner(target_workspace) then raise exception 'Only the owner can change roles'; end if;
 if new_role not in ('admin','member','viewer') then raise exception 'Invalid role'; end if;
 update public.memberships set role=new_role where workspace_id=target_workspace and user_id=target_user and role<>'owner';
 if not found then raise exception 'Member not found or owner role protected'; end if;
end $$;
create or replace function public.remove_workspace_member(target_workspace uuid,target_user uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.is_workspace_owner(target_workspace) then raise exception 'Only the owner can remove members'; end if;
 delete from public.memberships where workspace_id=target_workspace and user_id=target_user and role<>'owner';
 if not found then raise exception 'Member not found or owner role protected'; end if;
end $$;

-- Keep immutable metadata intact and record minimal action history, not sensitive contents.
create or replace function public.touch_research_record() returns trigger language plpgsql set search_path=public as $$
begin
 if TG_OP='UPDATE' then
   new.id=old.id; new.workspace_id=old.workspace_id; new.record_type=old.record_type;
   new.created_by=old.created_by; new.created_at=old.created_at;
   new.updated_at=now();
 end if;
 return new;
end $$;
create trigger record_touch before update on public.workspace_records for each row execute function public.touch_research_record();

create or replace function public.audit_research_change() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.audit_events(workspace_id,actor_id,event_type,record_id)
 values(case when TG_OP='DELETE' then old.workspace_id else new.workspace_id end,auth.uid(),lower(TG_OP),case when TG_OP='DELETE' then old.id else new.id end);
 return null;
end $$;
create trigger record_audit after insert or update or delete on public.workspace_records for each row execute function public.audit_research_change();

revoke all on function public.create_workspace(text,text,text),public.create_workspace_invite(uuid),public.join_workspace_by_code(text,text),public.set_workspace_role(uuid,uuid,text),public.remove_workspace_member(uuid,uuid) from public,anon;
grant execute on function public.create_workspace(text,text,text),public.create_workspace_invite(uuid),public.join_workspace_by_code(text,text),public.set_workspace_role(uuid,uuid,text),public.remove_workspace_member(uuid,uuid) to authenticated;
grant execute on function public.is_workspace_member(uuid),public.is_workspace_editor(uuid),public.is_workspace_owner(uuid),public.is_workspace_manager(uuid) to authenticated;

-- Realtime support for cross-device collaboration (requires project Realtime enabled).
do $$ begin
 alter publication supabase_realtime add table public.workspace_records;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
 alter publication supabase_realtime add table public.memberships;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
 alter publication supabase_realtime add table public.personal_notes;
exception when duplicate_object then null; when undefined_object then null; end $$;
