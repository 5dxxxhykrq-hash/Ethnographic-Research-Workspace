import React,{useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,KeyRound,Layers3,LockKeyhole,Mail,RefreshCw} from 'lucide-react';
import {useWorkspace} from '../lib/store';

const WAIT_SECONDS=60;

export default function EmailOtpLogin(){
 const {login,verifyCode}=useWorkspace();
 const [email,setEmail]=useState('');
 const [pendingEmail,setPendingEmail]=useState('');
 const [step,setStep]=useState<'request'|'verify'>('request');
 const [code,setCode]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const [retryAt,setRetryAt]=useState(0);
 const [now,setNow]=useState(Date.now());

 useEffect(()=>{
  if(!retryAt)return;
  const id=window.setInterval(()=>setNow(Date.now()),1000);
  return()=>window.clearInterval(id);
 },[retryAt]);
 const secondsLeft=Math.max(0,Math.ceil((retryAt-now)/1000));

 async function requestCode(resend=false){
  const address=(resend?pendingEmail:email).trim().toLowerCase();
  if(!address||busy||resend&&secondsLeft>0)return;
  setError('');
  setMessage('');
  setBusy(true);
  try{
   await login(address);
   setPendingEmail(address);
   setStep('verify');
   setCode('');
   setRetryAt(Date.now()+WAIT_SECONDS*1000);
   setNow(Date.now());
   setMessage(resend?'A new code has been requested. Use the latest email.':'Check your email for a six-digit verification code.');
  }catch(e:any){
   setError(e?.message||'Could not send the code. Try again later.');
  }finally{
   setBusy(false);
  }
 }

 async function submitCode(e:React.FormEvent){
  e.preventDefault();
  if(busy||!/^\d{6}$/.test(code))return;
  setError('');
  setBusy(true);
  try{
   await verifyCode(pendingEmail,code);
   setMessage('Verified. Loading your research workspace…');
   // The auth state listener in WorkspaceProvider navigates automatically.
  }catch(e:any){
   setError(e?.message||'Could not verify the code. Please check it and try again.');
  }finally{
   setBusy(false);
  }
 }

 function changeAddress(){
  setStep('request');
  setCode('');
  setError('');
  setMessage('');
  setRetryAt(0);
 }

 return <main className="auth-page">
  <div className="auth-card">
   <div className="brandmark"><Layers3 size={23}/></div>
   <div className="eyebrow">ETHNOGRAPHIC RESEARCH WORKSPACE</div>
   <h1>Research is better when the process is visible.</h1>
   <p>Manage collaborative fieldwork, track weekly milestones and build a shared methods portfolio without losing individual reflections.</p>
   {step==='request'?
    <form onSubmit={e=>{e.preventDefault();void requestCode()}}>
     <label className="field"><span>University email</span>
      <input type="email" autoComplete="email" required placeholder="you@ucl.ac.uk" value={email} onChange={e=>setEmail(e.target.value)}/>
     </label>
     <button className="btn primary full" type="submit" disabled={busy||!email.trim()}>
      <Mail size={16}/>{busy?'Sending code…':'Send six-digit code'} <ArrowRight size={16}/>
     </button>
    </form>:
    <div className="otp-step">
     <div className="otp-heading"><KeyRound size={19}/><strong>Enter your verification code</strong></div>
     <p className="otp-description">We sent a six-digit code to <strong>{pendingEmail}</strong>. Enter it here; there is no email link to open.</p>
     <form onSubmit={submitCode}>
      <label className="field" htmlFor="email-one-time-code"><span>Six-digit email code</span></label>
      <input id="email-one-time-code" className="otp-input" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e=>{setCode(e.target.value.replace(/\D/g,'').slice(0,6));setError('')}} placeholder="000000" aria-describedby="otp-help" autoFocus required/>
      <small id="otp-help" className="otp-hint">Codes are valid for a limited time. Never share your code.</small>
      <button className="btn primary full" type="submit" disabled={busy||code.length!==6}>
       <LockKeyhole size={16}/>{busy?'Verifying…':'Verify and sign in'}<ArrowRight size={16}/>
      </button>
     </form>
     <div className="otp-actions">
      <button type="button" className="text-button" onClick={changeAddress} disabled={busy}><ArrowLeft size={14}/> Change email</button>
      <button type="button" className="text-button" onClick={()=>void requestCode(true)} disabled={busy||secondsLeft>0}><RefreshCw size={14}/> {secondsLeft>0?`Resend in ${secondsLeft}s`:'Resend code'}</button>
     </div>
    </div>
   }
   {message&&<div className="success-box" role="status">{message}</div>}
   {error&&<div className="otp-error" role="alert">{error}{/rate limit/i.test(error)&&<span> Supabase's built-in email service has a project-wide hourly limit. Wait before requesting another message or configure custom SMTP.</span>}</div>}
   <div className="auth-foot"><LockKeyhole size={14}/> Email OTP sign-in · Private reflection journals</div>
  </div>
 </main>;
}
