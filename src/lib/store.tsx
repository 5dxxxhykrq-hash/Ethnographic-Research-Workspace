import React,{createContext,useContext,useEffect,useState,useCallback,useRef} from 'react';
import type {Workspace,Member,WorkRecord,PersonalNote,DraftRecord,CurrentUser,Role} from '../types';
import {uid} from '../types';
import {cloudEnabled,supabase} from './supabase';
import {DEMO_WORKSPACE,DEMO_MEMBERS,DEMO_RECORDS} from './course';
const KEY='fieldwork-os-demo-v1';
const fresh=()=>({workspaces:[DEMO_WORKSPACE],members:DEMO_MEMBERS,records:DEMO_RECORDS,notes:[] as PersonalNote[]});
function readDemo(){try{const v=localStorage.getItem(KEY);return v?JSON.parse(v):fresh()}catch{return fresh()}}
type ContextShape={cloud:boolean;user:CurrentUser|null;loading:boolean;workspaces:Workspace[];workspace:Workspace|null;members:Member[];records:WorkRecord[];notes:PersonalNote[];role:Role|null;canEdit:boolean;error:string;clearError:()=>void;setWorkspace:(id:string)=>void;login:(email:string)=>Promise<void>;loginWithMicrosoft:()=>Promise<void>;recoverSession:()=>Promise<void>;logout:()=>Promise<void>;createWorkspace:(name:string)=>Promise<void>;joinWorkspace:(code:string)=>Promise<void>;createInvite:()=>Promise<string>;updateMemberRole:(userId:string,role:Role)=>Promise<void>;removeMember:(userId:string)=>Promise<void>;saveGdpr:(completed:boolean)=>Promise<void>;createRecord:(record:DraftRecord)=>Promise<void>;editRecord:(id:string,patch:Partial<WorkRecord>)=>Promise<void>;deleteRecord:(id:string)=>Promise<void>;saveNote:(section:string,content:string)=>Promise<void>;refresh:()=>Promise<void>};
const C=createContext<ContextShape|null>(null);
export const useWorkspace=()=>{const x=useContext(C);if(!x)throw new Error('WorkspaceProvider missing');return x};
export function WorkspaceProvider({children}:{children:React.ReactNode}){
 const [demo,setDemo]=useState<any>(readDemo);const [user,setUser]=useState<CurrentUser|null>(cloudEnabled?null:{id:'demo-owner',name:'You'});const [loading,setLoading]=useState(cloudEnabled);const [workspaces,setWorkspaces]=useState<Workspace[]>(cloudEnabled?[]:demo.workspaces);const [active,setActive]=useState<string>(localStorage.getItem('fieldwork-active')||DEMO_WORKSPACE.id);const [members,setMembers]=useState<Member[]>(cloudEnabled?[]:demo.members);const [records,setRecords]=useState<WorkRecord[]>(cloudEnabled?[]:demo.records);const [notes,setNotes]=useState<PersonalNote[]>(cloudEnabled?[]:demo.notes);const [error,setError]=useState('');
 const current=workspaces.find(w=>w.id===active)||workspaces[0]||null;const role=members.find(m=>m.user_id===user?.id)?.role||null;const canEdit=Boolean(user&&role&&role!=='viewer');
 const fail=(e:any)=>{const message=e?.message||String(e);setError(message);throw new Error(message)};
 const loadWorkspaces=useCallback(async(u:CurrentUser)=>{if(!supabase)return;const {data,error:e}=await supabase.from('workspaces').select('*').order('created_at',{ascending:false});if(e)return fail(e);setWorkspaces(data||[]);if(data?.length&&!data.some((w:any)=>w.id===active))setActive(data[0].id);},[active]);
 const loadProject=useCallback(async(id:string,u:CurrentUser)=>{if(!supabase||!id)return;const [a,b,c]=await Promise.all([supabase.from('memberships').select('*').eq('workspace_id',id),supabase.from('workspace_records').select('*').eq('workspace_id',id).order('created_at',{ascending:false}),supabase.from('personal_notes').select('*').eq('workspace_id',id).eq('user_id',u.id)]);for(const x of [a,b,c])if(x.error)return fail(x.error);setMembers((a.data||[]) as Member[]);setRecords((b.data||[]) as WorkRecord[]);setNotes((c.data||[]) as PersonalNote[]);},[]);
 useEffect(()=>{
  if(!supabase)return;
  // INITIAL_SESSION is emitted after Supabase finishes restoring the browser session
  // (including the magic-link callback URL). Use one source of truth: racing
  // getUser() with this listener could overwrite a successful SIGNED_IN state.
  const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
    const u=session?.user;
    if(event==='INITIAL_SESSION'||event==='SIGNED_IN'||event==='SIGNED_OUT'||event==='USER_UPDATED'||event==='TOKEN_REFRESHED'||event==='PASSWORD_RECOVERY'){
      setUser(u?{id:u.id,name:u.user_metadata?.full_name||u.email?.split('@')[0]||'Researcher',email:u.email}:null);
      setLoading(false);
    }
  });
  return()=>{subscription.unsubscribe()};
 },[]);
 useEffect(()=>{if(supabase&&user)loadWorkspaces(user);if(supabase&&!user){setWorkspaces([]);setRecords([]);setMembers([]);setNotes([])}},[user?.id]);
 useEffect(()=>{if(supabase&&user&&current)loadProject(current.id,user);},[user?.id,current?.id]);
 useEffect(()=>{if(!supabase||!user||!current)return;const channel=supabase.channel('fieldwork-'+current.id).on('postgres_changes',{event:'*',schema:'public',table:'workspace_records',filter:'workspace_id=eq.'+current.id},()=>loadProject(current.id,user)).on('postgres_changes',{event:'*',schema:'public',table:'memberships',filter:'workspace_id=eq.'+current.id},()=>loadProject(current.id,user)).on('postgres_changes',{event:'*',schema:'public',table:'personal_notes',filter:'workspace_id=eq.'+current.id},()=>loadProject(current.id,user)).subscribe();return()=>{supabase.removeChannel(channel)}},[user?.id,current?.id]);
 useEffect(()=>{if(!supabase)localStorage.setItem(KEY,JSON.stringify(demo));},[demo]);
 useEffect(()=>{if(supabase)return;setWorkspaces(demo.workspaces);setMembers(demo.members.filter((m:Member)=>m.workspace_id===active));setRecords(demo.records.filter((r:WorkRecord)=>r.workspace_id===active));setNotes(demo.notes.filter((n:PersonalNote)=>n.workspace_id===active&&n.user_id===user?.id));},[demo,active,user?.id]);
 const setWorkspace=(id:string)=>{setActive(id);localStorage.setItem('fieldwork-active',id)};
 const refresh=async()=>{if(supabase&&user){await loadWorkspaces(user);if(current)await loadProject(current.id,user)}};
 const login=async(email:string)=>{if(!supabase)return;const {error:e}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin+window.location.pathname+window.location.search}});if(e)fail(e)};
 const loginWithMicrosoft=async()=>{
  if(!supabase)throw Error('Supabase is not configured.');
  // Preserve invitation codes when users authenticate before joining a workspace.
  // The redirect URL must be allowlisted under Supabase Auth -> URL Configuration.
  const redirectTo=window.location.origin+window.location.pathname+window.location.search;
  const {error:e}=await supabase.auth.signInWithOAuth({
   provider:'azure',
   options:{scopes:'email',redirectTo}
  });
  if(e)fail(e);
 };
 const recoverSession=async()=>{
  if(!supabase)throw Error('Supabase is not configured.');
  const {data:{session},error:sessionError}=await supabase.auth.getSession();
  if(sessionError)throw new Error('Cannot check browser session: '+sessionError.message);
  if(!session)throw new Error('No saved sign-in session in this browser. A verified email is not the same as a browser session. Open a fresh login email in this same browser when email sending is available again.');
  // Confirm with the Auth server rather than trusting browser-stored user metadata.
  const {data:{user:u},error:userError}=await supabase.auth.getUser();
  if(userError||!u)throw new Error('The stored session could not be verified: '+(userError?.message||'User not found'));
  setUser({id:u.id,name:u.user_metadata?.full_name||u.email?.split('@')[0]||'Researcher',email:u.email});
 };
 const logout=async()=>{if(supabase){const {error:e}=await supabase.auth.signOut();if(e)fail(e)}};
 const createWorkspace=async(name:string)=>{if(!user)throw Error('Sign in first');if(supabase){const {data,error:e}=await supabase.rpc('create_workspace',{workspace_name:name,course:'ANTH0130',display_name:user.name});if(e)return fail(e);await loadWorkspaces(user);setWorkspace(data as string);}else{const id=uid();setDemo((d:any)=>({...d,workspaces:[...d.workspaces,{id,name,course_code:'ANTH0130',created_by:user.id}],members:[...d.members,{id:uid(),workspace_id:id,user_id:user.id,display_name:user.name,role:'owner'}]}));setWorkspace(id)}};
 const joinWorkspace=async(code:string)=>{if(!supabase)throw Error('Demo mode cannot synchronise invitations. Connect Supabase first.');const {data,error:e}=await supabase.rpc('join_workspace_by_code',{invite_code:code,display_name:user?.name||'Researcher'});if(e)return fail(e);if(user)await loadWorkspaces(user);setWorkspace(data as string)};
 const createInvite=async()=>{if(!supabase)throw Error('Real member invitations require Supabase configuration.');if(!current)throw Error('No workspace');const {data,error:e}=await supabase.rpc('create_workspace_invite',{target_workspace:current.id});if(e)return fail(e);return String(data)};
 const updateMemberRole=async(userId:string,newRole:Role)=>{if(!current)throw Error('No workspace');if(supabase){const {error:e}=await supabase.rpc('set_workspace_role',{target_workspace:current.id,target_user:userId,new_role:newRole});if(e)return fail(e);if(user)await loadProject(current.id,user)}else{setDemo((d:any)=>({...d,members:d.members.map((m:Member)=>m.workspace_id===current.id&&m.user_id===userId?{...m,role:newRole}:m)}))}};
 const removeMember=async(userId:string)=>{if(!current)throw Error('No workspace');if(supabase){const {error:e}=await supabase.rpc('remove_workspace_member',{target_workspace:current.id,target_user:userId});if(e)return fail(e);if(user)await loadProject(current.id,user)}else setDemo((d:any)=>({...d,members:d.members.filter((m:Member)=>!(m.workspace_id===current.id&&m.user_id===userId))}))};
 const saveGdpr=async(completed:boolean)=>{if(!current||!user)return;const gdpr_completed_at=completed?new Date().toISOString():null;if(supabase){const {error:e}=await supabase.from('memberships').update({gdpr_completed_at}).eq('workspace_id',current.id).eq('user_id',user.id);if(e)return fail(e);await loadProject(current.id,user)}else setDemo((d:any)=>({...d,members:d.members.map((m:Member)=>m.workspace_id===current.id&&m.user_id===user.id?{...m,gdpr_completed_at}:m)}))};
 const createRecord=async(draft:DraftRecord)=>{if(!current||!user||!canEdit)throw Error('Editor access required');if(supabase){const {error:e}=await supabase.from('workspace_records').insert({workspace_id:current.id,record_type:draft.record_type,title:draft.title,data:draft.data,created_by:user.id});if(e)return fail(e);await loadProject(current.id,user)}else setDemo((d:any)=>({...d,records:[{id:uid(),workspace_id:current.id,created_by:user.id,created_at:new Date().toISOString(),...draft},...d.records]}))};
 const editRecord=async(id:string,patch:Partial<WorkRecord>)=>{if(!current||!user||!canEdit)throw Error('Editor access required');const safe:any={};if(patch.title!==undefined)safe.title=patch.title;if(patch.data!==undefined)safe.data=patch.data;if(supabase){const {error:e}=await supabase.from('workspace_records').update(safe).eq('id',id).eq('workspace_id',current.id);if(e)return fail(e);await loadProject(current.id,user)}else setDemo((d:any)=>({...d,records:d.records.map((r:WorkRecord)=>r.id===id?{...r,...safe,updated_at:new Date().toISOString()}:r)}))};
 const deleteRecord=async(id:string)=>{if(!current||!user||!canEdit)throw Error('Editor access required');if(supabase){const {error:e}=await supabase.from('workspace_records').delete().eq('id',id).eq('workspace_id',current.id);if(e)return fail(e);await loadProject(current.id,user)}else setDemo((d:any)=>({...d,records:d.records.filter((r:WorkRecord)=>r.id!==id)}))};
 const saveNote=async(section:string,content:string)=>{if(!current||!user)throw Error('Sign in first');if(supabase){const {error:e}=await supabase.from('personal_notes').upsert({workspace_id:current.id,user_id:user.id,section,content,updated_at:new Date().toISOString()},{onConflict:'workspace_id,user_id,section'});if(e)return fail(e);await loadProject(current.id,user)}else setDemo((d:any)=>({...d,notes:[...d.notes.filter((n:PersonalNote)=>!(n.workspace_id===current.id&&n.user_id===user.id&&n.section===section)),{id:uid(),workspace_id:current.id,user_id:user.id,section,content,updated_at:new Date().toISOString()}]}))};
 const value:ContextShape={cloud:cloudEnabled,user,loading,workspaces,workspace:current,members,records,notes,role,canEdit,error,clearError:()=>setError(''),setWorkspace,login,loginWithMicrosoft,recoverSession,logout,createWorkspace,joinWorkspace,createInvite,updateMemberRole,removeMember,saveGdpr,createRecord,editRecord,deleteRecord,saveNote,refresh};
 return <C.Provider value={value}>{children}</C.Provider>
}
