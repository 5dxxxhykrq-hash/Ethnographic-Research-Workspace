-- Migration 002: Fix invitation functions' pgcrypto resolution.
-- Existing projects, memberships, invites, and reflection notes are untouched.
-- Run ONCE in Supabase SQL Editor for existing fieldwork-os databases.
--
-- In Supabase pgcrypto commonly lives in the "extensions" schema. Both
-- gen_random_bytes(16) (invitation generation) and digest(..., 'sha256')
-- (generation + joining) require it in the SECURITY DEFINER search_path.
-- Keep pg_catalog first and pg_temp last; public supports older pgcrypto
-- installs without relying on the caller's search_path.

alter function public.create_workspace_invite(uuid)
  set search_path = pg_catalog, extensions, public, pg_temp;

alter function public.join_workspace_by_code(text,text)
  set search_path = pg_catalog, extensions, public, pg_temp;
