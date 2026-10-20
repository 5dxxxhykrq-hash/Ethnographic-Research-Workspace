import {test,expect,Page} from '@playwright/test';

const server='https://auth-test.supabase.co';
const me='10000000-0000-4000-8000-000000000001';
const originalWorkspace={
 id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',name:'Member test workspace',course_code:'ANTH0130',created_by:me,
 created_at:'2026-10-20T02:00:00Z'
};
const invitedWorkspace={
 id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',name:'Bloomsbury Knowledge Access',course_code:'ANTH0130',created_by:'other-owner',
 created_at:'2026-10-20T03:00:00Z'
};
const user={
 id:me,aud:'authenticated',role:'authenticated',email:'student@ucl.ac.uk',
 email_confirmed_at:'2026-10-20T01:32:17Z',
 app_metadata:{provider:'email',providers:['email']},user_metadata:{},
 created_at:'2026-10-20T01:31:58Z',updated_at:'2026-10-20T01:32:17Z'
};

async function login(page:Page,invite?:string){
 const encode=(value:unknown)=>Buffer.from(JSON.stringify(value)).toString('base64url');
 const jwt=[encode({alg:'HS256',typ:'JWT'}),encode({sub:me,role:'authenticated',aud:'authenticated',
  exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000)}),'mock-signature'].join('.');
 const query=invite?'?invite='+encodeURIComponent(invite):'';
 await page.goto('/'+query+'#access_token='+encodeURIComponent(jwt)+'&refresh_token=mock-refresh&expires_in=3600&token_type=bearer&type=signup');
}

async function mockBackend(page:Page,existing=false){
 let joined=false;
 let requestedCode='';
 await page.route(server+'/**',async route=>{
  const request=route.request();
  const url=new URL(request.url());
  const respond=(value:unknown,status=200)=>route.fulfill({
    status,contentType:'application/json',headers:{'content-range':'0-1/2'},body:JSON.stringify(value)
  });
  if(url.pathname==='/auth/v1/user')return respond(user);
  if(url.pathname==='/rest/v1/rpc/join_workspace_by_code'){
   requestedCode=request.postDataJSON()?.invite_code||'';
   if(requestedCode!=='TEST-INVITE-2026')return respond({message:'Invitation invalid or expired'},400);
   joined=true;
   return respond(invitedWorkspace.id);
  }
  if(url.pathname==='/rest/v1/workspaces'){
   return respond([...(existing?[originalWorkspace]:[]),...(joined?[invitedWorkspace]:[])]);
  }
  if(url.pathname==='/rest/v1/memberships'){
   const id=url.searchParams.get('workspace_id')?.replace('eq.','')||'';
   return respond([{id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',workspace_id:id,user_id:me,display_name:'Student',role:id===originalWorkspace.id?'owner':'member',joined_at:'2026-10-20T02:30:00Z'}]);
  }
  if(url.pathname.startsWith('/rest/v1/'))return respond([]);
  return respond({});
 });
 return ()=>requestedCode;
}

test('first-time members see Join Existing Workspace before an optional create flow',async({page})=>{
 await mockBackend(page);
 await login(page);
 await expect(page.getByRole('heading',{name:'Welcome to your research workspace'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Join an existing workspace'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Join workspace'})).toBeDisabled();
 await expect(page.getByLabel('New project name')).toHaveCount(0);
 await page.getByRole('button',{name:/Start a new research group/}).click();
 await expect(page.getByLabel('New project name')).toBeVisible();
});

test('an invitation deep link is prefilled and joins the correct existing workspace',async({page})=>{
 const getCode=await mockBackend(page);
 await login(page,'TEST-INVITE-2026');
 await expect(page.getByLabel('Invitation code')).toHaveValue('TEST-INVITE-2026');
 await page.getByRole('button',{name:'Join workspace'}).click();
 await expect(page.getByText('Bloomsbury Knowledge Access').first()).toBeVisible({timeout:12000});
 await expect(page.getByRole('button',{name:/Settings & members/})).toBeVisible();
 expect(getCode()).toBe('TEST-INVITE-2026');
});

test('members who previously created a separate workspace can join from project switcher',async({page})=>{
 const getCode=await mockBackend(page,true);
 await login(page);
 await expect(page.getByRole('button',{name:/Member test workspace/})).toBeVisible({timeout:12000});
 await page.getByRole('button',{name:/Member test workspace/}).click();
 await page.getByRole('button',{name:/Join existing workspace/}).click();
 await expect(page.getByRole('heading',{name:'Join an existing workspace'})).toBeVisible();
 await page.getByLabel('Invitation code').fill('TEST-INVITE-2026');
 await page.getByRole('button',{name:'Join workspace'}).click();
 await expect(page.getByRole('button',{name:/Bloomsbury Knowledge Access/})).toBeVisible({timeout:12000});
 expect(getCode()).toBe('TEST-INVITE-2026');
});
