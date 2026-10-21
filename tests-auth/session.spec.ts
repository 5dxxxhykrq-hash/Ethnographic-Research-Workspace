import {expect,test} from '@playwright/test';

const server='https://auth-test.supabase.co';
const userId='10000000-0000-4000-8000-000000000001';
const user={
 id:userId,aud:'authenticated',role:'authenticated',email:'researcher@ucl.ac.uk',
 email_confirmed_at:'2026-10-20T01:32:17Z',
 app_metadata:{provider:'email',providers:['email']},user_metadata:{},
 created_at:'2026-10-20T01:31:58Z',updated_at:'2026-10-20T01:32:17Z'
};
test.beforeEach(async({page})=>{
 await page.route(server+'/**',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/auth/v1/user'){
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(user)});
  }
  if(url.pathname.startsWith('/rest/v1/')){
   return route.fulfill({status:200,contentType:'application/json',headers:{'content-range':'*/0'},body:'[]'});
  }
  return route.fulfill({status:200,contentType:'application/json',body:'{}'});
 });
});

test('signed-out user can check whether a session exists without resending email',async({page})=>{
 page.on('dialog',dialog=>dialog.accept());
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'Research is better when the process is visible.'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Check saved sign-in session'})).toBeVisible();
 const messagePromise=page.waitForEvent('dialog');
 await page.getByRole('button',{name:'Check saved sign-in session'}).click();
 const d=await messagePromise;
 expect(d.message()).toContain('No saved sign-in session');
});

test('magic-link redirect with tokens restores the user and opens the workspace gate',async({page})=>{
 const jwtPart=(value:unknown)=>Buffer.from(JSON.stringify(value)).toString('base64url');
 const accessToken=[jwtPart({alg:'HS256',typ:'JWT'}),jwtPart({
  sub:userId,role:'authenticated',aud:'authenticated',
  exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000)
 }), 'placeholder-signature'].join('.');
 await page.goto('/#access_token='+encodeURIComponent(accessToken)+'&refresh_token=test-refresh-token&expires_in=3600&token_type=bearer&type=signup');
 await expect(page.getByRole('heading',{name:'Welcome to your research workspace'})).toBeVisible({timeout:15000});
 await page.reload();
 await expect(page.getByRole('heading',{name:'Welcome to your research workspace'})).toBeVisible({timeout:15000});
});

test('Microsoft button starts Azure OAuth with email scope and preserves invitation link',async({page})=>{
 const destination='JOIN-ALPHA';
 let authUrl='';
 await page.route(server+'/auth/v1/authorize**',async route=>{
  authUrl=route.request().url();
  await route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Mock Microsoft sign in</title><p>Microsoft authorization started</p>'});
 });
 await page.goto('/?invite='+destination);
 await expect(page.getByRole('button',{name:'Continue with Microsoft'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Send secure sign-in link'})).toBeVisible();
 await Promise.all([
  page.waitForURL(url=>url.hostname==='auth-test.supabase.co'&&url.pathname==='/auth/v1/authorize'),
  page.getByRole('button',{name:'Continue with Microsoft'}).click()
 ]);
 const url=new URL(authUrl);
 expect(url.searchParams.get('provider')).toBe('azure');
 expect(url.searchParams.get('scopes')).toBe('email');
 const redirect=url.searchParams.get('redirect_to');
 expect(redirect).not.toBeNull();
 const callback=new URL(redirect!);
 expect(callback.origin).toBe('http://127.0.0.1:5175');
 expect(callback.searchParams.get('invite')).toBe(destination);
});
