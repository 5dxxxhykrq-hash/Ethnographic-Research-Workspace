import {expect,test} from '@playwright/test';

const MOCK_SUPABASE='https://otp-demo.supabase.co';

test.beforeEach(async({page})=>{
 await page.route(MOCK_SUPABASE+'/**',async(route)=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/auth/v1/otp'){
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({user:null,session:null})});
  }else if(path==='/auth/v1/verify'){
   await route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({message:'Token has expired or is invalid',code:'otp_expired'})});
  }else{
   await route.fulfill({status:200,contentType:'application/json',body:'{}'});
  }
 });
});

test('requests a six-digit OTP and shows in-page verification on the same browser',async({page})=>{
 let sentEmail:string|undefined;
 page.on('request',req=>{
  if(req.url().includes('/auth/v1/otp')){
   sentEmail=req.postDataJSON()?.email;
  }
 });
 await page.goto('/');
 await expect(page.getByRole('button',{name:/Send six-digit code/})).toBeVisible();
 await page.getByLabel('University email').fill('Student@UCL.ac.uk');
 await page.getByRole('button',{name:/Send six-digit code/}).click();
 await expect(page.getByText('Enter your verification code')).toBeVisible();
 await expect(page.getByText('student@ucl.ac.uk')).toBeVisible();
 expect(sentEmail).toBe('student@ucl.ac.uk');
 await expect(page.getByRole('button',{name:/Resend in/})).toBeDisabled();
 await expect(page.getByRole('button',{name:'Verify and sign in'})).toBeDisabled();
});

test('verifies a typed OTP with Supabase auth and shows errors without redirect',async({page})=>{
 let payload:any;
 page.on('request',req=>{
  if(req.url().includes('/auth/v1/verify'))payload=req.postDataJSON();
 });
 await page.goto('/');
 await page.getByLabel('University email').fill('student@ucl.ac.uk');
 await page.getByRole('button',{name:/Send six-digit code/}).click();
 await expect(page.getByText('Enter your verification code')).toBeVisible();
 await page.getByLabel('Six-digit email code').fill('123456');
 await page.getByRole('button',{name:'Verify and sign in'}).click();
 await expect(page.getByRole('alert')).toContainText('Token has expired or is invalid');
 expect(payload?.email).toBe('student@ucl.ac.uk');
 expect(payload?.token).toBe('123456');
 expect(payload?.type).toBe('email');
 await expect(page.getByLabel('Six-digit email code')).toBeVisible();
});

test('change email keeps OTP request and verification separate',async({page})=>{
 await page.goto('/');
 await page.getByLabel('University email').fill('first@ucl.ac.uk');
 await page.getByRole('button',{name:/Send six-digit code/}).click();
 await page.getByRole('button',{name:/Change email/}).click();
 await expect(page.getByLabel('University email')).toHaveValue('first@ucl.ac.uk');
 await page.getByLabel('University email').fill('second@ucl.ac.uk');
 await page.getByRole('button',{name:/Send six-digit code/}).click();
 await expect(page.getByText('second@ucl.ac.uk')).toBeVisible();
});
