export type Role='owner'|'admin'|'member'|'viewer';
export type RecordType='task'|'rq'|'site'|'participant'|'session'|'portfolio'|'decision'|'methods';
export type DataObject=Record<string,any>;
export interface Workspace {id:string;name:string;course_code:string;created_by:string;created_at?:string}
export interface Member {id:string;workspace_id:string;user_id:string;display_name:string;role:Role;gdpr_completed_at?:string|null}
export interface WorkRecord {id:string;workspace_id:string;record_type:RecordType;title:string;data:DataObject;created_by:string;created_at?:string;updated_at?:string}
export interface PersonalNote {id:string;workspace_id:string;user_id:string;section:string;content:string;updated_at?:string}
export type DraftRecord=Pick<WorkRecord,'record_type'|'title'|'data'>;
export interface CurrentUser {id:string;name:string;email?:string}
export const uid=()=>crypto.randomUUID();
export const formatDate=(date?:string)=>date?new Date(date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'—';
export const dateTime=(date?:string)=>date?new Date(date).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/London'}):'—';
