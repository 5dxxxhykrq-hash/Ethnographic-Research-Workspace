import React,{useEffect,useState} from 'react';
import {LayoutDashboard,CalendarDays,FlaskConical,KanbanSquare,NotebookTabs,ShieldCheck,FolderOpen,BookUser,Settings,Layers3,ChevronDown,Menu,X,ArrowRight,LockKeyhole,LogOut,Users,AlertCircle} from 'lucide-react';
import {useWorkspace} from './lib/store';
import {CURRENT_WEEK} from './lib/course';
import {Modal,Field,ActionButton,useAction} from './ui';
import Dashboard from './pages/Dashboard';import Weekly from './pages/Weekly';import Design from './pages/Design';import Tasks from './pages/Tasks';import Fieldwork from './pages/Fieldwork';import Ethics from './pages/Ethics';import Portfolio from './pages/Portfolio';import Reflection from './pages/Reflection';import SettingsPage from './pages/Settings';
const nav=[
 {id:'overview',label:'Overview',hint:'项目总览',Icon:LayoutDashboard},
 {id:'weekly',label:'Weekly Tracker',hint:'每周课程与任务',Icon:CalendarDays},
 {id:'design',label:'Research Design',hint:'研究问题与设计',Icon:FlaskConical},
 {id:'team',label:'Team & Tasks',hint:'小组及任务分工',Icon:KanbanSquare},
 {id:'fieldwork',label:'Fieldwork',hint:'访谈与参与式观察',Icon:NotebookTabs},
 {id:'ethics',label:'Ethics & Access',hint:'知情同意与权限',Icon:ShieldCheck},
 {id:'portfolio',label:'Portfolio',hint:'共同研究档案',Icon:FolderOpen},
 {id:'reflection',label:'My Reflection',hint:'个人私有反思',Icon:BookUser},
 {id:'settings',label:'Settings',hint:'成员与项目设置',Icon:Settings}
];
function AuthGate(){
 const {login,loginWithMicrosoft,cloud,recoverSession}=useWorkspace();
 const [email,setEmail]=useState('');
 const [sent,setSent]=useState(false);
 const [callbackError,setCallbackError]=useState('');
 const {busy,run}=useAction();
 useEffect(()=>{
  // Supabase can redirect with an error fragment even after the email link was clicked.
  // Surface just the error; do not read or print access/refresh tokens.
  const hash=new URLSearchParams(window.location.hash.slice(1));
  const query=new URLSearchParams(window.location.search);
  const code=hash.get('error_code')||query.get('error_code')||hash.get('error')||query.get('error');
  if(code){
   const description=hash.get('error_description')||query.get('error_description')||'The email verification link was rejected.';
   setCallbackError('Email verification did not complete ('+code+'): '+description);
   for(const key of ['error','error_code','error_description'])query.delete(key);
   window.history.replaceState(null,'',window.location.pathname+(query.toString()?'?'+query.toString():''));
  }
 },[]);
 return <main className="auth-page"><div className="auth-card">
  <div className="brandmark"><Layers3 size={23}/></div>
  <div className="eyebrow">ETHNOGRAPHIC RESEARCH WORKSPACE</div>
  <h1>Research is better when the process is visible.</h1>
  <p>Manage collaborative fieldwork, track weekly milestones and build a shared methods portfolio without losing individual reflections.</p>
  {callbackError&&<div className="otp-error" role="alert">{callbackError}</div>}
  {cloud&&<div className="microsoft-auth">
    <button type="button" className="btn microsoft-signin full" disabled={busy} onClick={()=>run(loginWithMicrosoft)}>
      <span className="microsoft-brand" aria-hidden="true"><i/><i/><i/><i/></span>
      Continue with Microsoft
    </button>
    <div className="auth-divider" aria-hidden="true"><span>or sign in using your university email</span></div>
  </div>}
  {cloud?<form onSubmit={e=>{e.preventDefault();run(async()=>{await login(email);setSent(true)})}}>
   <Field label="University email" type="email" value={email} onChange={setEmail} placeholder="you@ucl.ac.uk" required/>
   <button className="btn primary full" disabled={busy}>{sent?'Send another sign-in link':'Send secure sign-in link'} <ArrowRight size={16}/></button>
   {sent&&<div className="success-box">Check your inbox for a Supabase magic link. You can return to this tab after signing in.</div>}
  </form>:null}
  {cloud&&<div className="session-recovery"><p>Already confirmed your email but still seeing this page?</p><button type="button" className="btn secondary full" disabled={busy} onClick={()=>run(recoverSession)}>Check saved sign-in session</button></div>}
  <div className="auth-foot"><LockKeyhole size={14}/> Passwordless sign-in · Private reflection journals</div>
 </div></main>
}
function ProjectGate(){
 const {createWorkspace,joinWorkspace}=useWorkspace();
 const invitedCode=new URLSearchParams(window.location.search).get('invite')||'';
 const [name,setName]=useState('');
 const [code,setCode]=useState(invitedCode);
 const [showCreate,setShowCreate]=useState(false);
 const {run,busy}=useAction();
 return <main className="auth-page"><div className="auth-card workspace-entry-card">
  <div className="brandmark"><Layers3/></div>
  <div className="eyebrow">FIELDWORK OS · FIRST STEPS</div>
  <h1>Welcome to your research workspace</h1>
  <p>Already part of a research group? Join its existing workspace to share the same project, tasks and research records.</p>
  <section className="workspace-entry-join" aria-labelledby="join-existing-title">
   <div className="workspace-entry-label"><Users size={17}/> FOR GROUP MEMBERS</div>
   <h2 id="join-existing-title">Join an existing workspace</h2>
   <p>Ask your project owner for an invitation code. <strong>You do not need to create a new project.</strong></p>
   <form onSubmit={e=>{e.preventDefault();run(()=>joinWorkspace(code.trim()))}}>
    <Field label="Invitation code" placeholder="Paste your invitation code here" value={code} onChange={setCode} required/>
    <button type="submit" className="btn primary full" disabled={!code.trim()||busy}>
     Join workspace <ArrowRight size={16}/>
    </button>
   </form>
   {invitedCode&&<div className="success-box" role="status">Invitation code detected from your link. Select Join workspace to accept it.</div>}
  </section>
  <section className="workspace-entry-create" aria-label="Start a new research group">
   <button type="button" className="workspace-entry-create-toggle" aria-controls="workspace-create-form" aria-expanded={showCreate} onClick={()=>setShowCreate(v=>!v)}>
    <span><strong>Start a new research group</strong><small>Only if you are setting up a separate project.</small></span>
    <ChevronDown size={19} className={showCreate?'expanded':''}/>
   </button>
   {showCreate&&<form id="workspace-create-form" onSubmit={e=>{e.preventDefault();run(()=>createWorkspace(name))}}>
    <Field label="New project name" placeholder="e.g. Bloomsbury Knowledge Access" value={name} onChange={setName} required/>
    <button type="submit" className="btn secondary full" disabled={!name.trim()||busy}>Create a new workspace <ArrowRight size={16}/></button>
   </form>}
  </section>
  <div className="auth-foot"><LockKeyhole size={14}/> Group records are shared · My Reflection stays private</div>
 </div></main>
}
export default function App(){const ctx=useWorkspace();const {user,loading,workspace,workspaces,cloud,role,error,clearError,setWorkspace,logout}=ctx;const [page,setPage]=useState(location.hash.replace('#/','')||(new URLSearchParams(location.search).has('invite')?'settings':'overview'));const [mobile,setMobile]=useState(false);const [switcher,setSwitcher]=useState(false);const [createOpen,setCreateOpen]=useState(false);const [newName,setNewName]=useState('');const invitedCode=new URLSearchParams(window.location.search).get('invite')||'';const [joinOpen,setJoinOpen]=useState(Boolean(invitedCode));const [joinCode,setJoinCode]=useState(invitedCode);const {run,busy}=useAction();useEffect(()=>{const change=()=>setPage(location.hash.replace('#/','')||'overview');window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change)},[]);const navigate=(id:string)=>{location.hash='/'+id;setPage(id);setMobile(false)};
 if(loading)return <div className="loading-screen"><Layers3 size={30}/> Loading your workspace…</div>;
 if(!user)return <AuthGate/>;
 if(!workspace)return <ProjectGate/>;
 const selected=nav.find(n=>n.id===page)||nav[0];const Icon=selected.Icon;
 const render=()=>{switch(page){case 'weekly':return <Weekly/>;case 'design':return <Design/>;case 'team':return <Tasks/>;case 'fieldwork':return <Fieldwork/>;case 'ethics':return <Ethics/>;case 'portfolio':return <Portfolio/>;case 'reflection':return <Reflection/>;case 'settings':return <SettingsPage/>;default:return <Dashboard navigate={navigate}/>}};
 return <div className="app-shell">
  <aside className={'sidebar '+(mobile?'open':'')}>
   <div className="sidebar-brand"><div className="brandmark small"><Layers3 size={19}/></div><div><strong>Fieldwork OS</strong><span>RESEARCH WORKSPACE</span></div><button className="mobile-close icon-btn" onClick={()=>setMobile(false)}><X size={19}/></button></div>
   <div className="project-switch"><button onClick={()=>setSwitcher(!switcher)} className="project-btn"><div className="project-avatar">{workspace.name.slice(0,1).toUpperCase()}</div><div><strong>{workspace.name}</strong><span>{workspace.course_code} · 2026–27</span></div><ChevronDown size={15}/></button>{switcher&&<div className="switch-menu">{workspaces.map(w=><button key={w.id} onClick={()=>{setWorkspace(w.id);setSwitcher(false)}}>{w.name}</button>)}<button onClick={()=>{setJoinCode('');setJoinOpen(true);setSwitcher(false)}}>+ Join existing workspace</button><button onClick={()=>{setCreateOpen(true);setSwitcher(false)}}>+ New project</button></div>}</div>
   <div className="sidebar-section">WORKSPACE</div><nav className="nav-list" aria-label="Main navigation">{nav.slice(0,8).map(n=><button key={n.id} onClick={()=>navigate(n.id)} className={'nav-item '+(page===n.id?'active':'')}><n.Icon size={18} strokeWidth={1.8}/><span>{n.label}</span>{n.id==='weekly'&&<span className="nav-mini">W{CURRENT_WEEK()}</span>}</button>)}</nav>
   <div className="sidebar-spacer"/><div className="sidebar-section">PREFERENCES</div><button onClick={()=>navigate('settings')} className={'nav-item '+(page==='settings'?'active':'')}><Settings size={18}/><span>Settings & members</span></button>
   <div className="sidebar-bottom"><div className="user-avatar">{user.name.slice(0,1).toUpperCase()}</div><div><strong>{user.name}</strong><span>{role||'Researcher'} {cloud?'':'· Demo'}</span></div>{cloud&&<button className="icon-btn" title="Sign out" onClick={logout}><LogOut size={17}/></button>}</div>
  </aside>{mobile&&<div className="mobile-shade" onClick={()=>setMobile(false)}/>}
  <div className="main-area"><header className="topbar"><button className="icon-btn mobile-menu" onClick={()=>setMobile(true)}><Menu size={21}/></button><div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>{selected.label}</strong></div><div className="topbar-right"><span className="topbar-week">TERM 1 · WEEK {CURRENT_WEEK()}</span><span className="topbar-initial">{user.name.slice(0,1).toUpperCase()}</span></div></header>
  {!cloud&&<div className="demo-banner"><AlertCircle size={16}/><span><strong>Local demo mode.</strong> Changes are stored in this browser only. Connect Supabase for real team accounts and shared data.</span></div>}
  {error&&<div className="error-banner"><AlertCircle size={16}/><span>{error}</span><button onClick={clearError} className="icon-btn"><X size={16}/></button></div>}
  <main className="content">{render()}</main></div>
  {joinOpen&&<Modal title="Join an existing workspace" onClose={()=>{setJoinOpen(false);setJoinCode('')}}><p className="text-muted">Enter the invitation code supplied by your group owner. Joining shares the group's records without creating a separate project. Your personal reflections remain private.</p><form onSubmit={e=>{e.preventDefault();run(()=>ctx.joinWorkspace(joinCode.trim()),()=>{setJoinOpen(false);setJoinCode('');const q=new URLSearchParams(window.location.search);q.delete('invite');window.history.replaceState(null,'',window.location.pathname+(q.toString()?'?'+q.toString():'')+window.location.hash);navigate('overview')})}}><Field label="Invitation code" value={joinCode} onChange={setJoinCode} placeholder="Paste the code from your teammate" required/><div className="modal-actions"><button type="button" className="btn secondary" onClick={()=>{setJoinOpen(false);setJoinCode('')}}>Cancel</button><button className="btn primary" disabled={!joinCode.trim()||busy}>Join workspace <ArrowRight size={16}/></button></div></form></Modal>}
  {createOpen&&<Modal title="Create project" onClose={()=>setCreateOpen(false)}><form onSubmit={e=>{e.preventDefault();run(()=>ctx.createWorkspace(newName),()=>{setCreateOpen(false);setNewName('');navigate('overview')})}}><Field label="Project name" value={newName} onChange={setNewName} required/><div className="modal-actions"><button type="button" className="btn secondary" onClick={()=>setCreateOpen(false)}>Cancel</button><button className="btn primary" disabled={busy}>Create</button></div></form></Modal>}
 </div>
}
