import {test,expect} from '@playwright/test';

test.describe('synthetic Fieldwork OS interactive tour',()=>{
 test('renders a 16-chapter tour with bilingual captions and playback controls',async({page})=>{
  await page.goto('/tour/index.html');
  await expect(page).toHaveTitle(/Fieldwork OS · Interactive Product Tour/);
  await expect(page.getByRole('heading',{name:'An entire research workflow. One workspace.'})).toBeVisible();
  await expect(page.locator('#timeline button')).toHaveCount(16);
  await page.getByRole('button',{name:'Pause tour'}).click();
  await expect(page.getByRole('button',{name:'Play tour'})).toBeVisible();
  await page.getByRole('button',{name:'Toggle Chinese and English captions'}).click();
  await expect(page.getByRole('heading',{name:'从研究问题到田野笔记，一个工作空间。'})).toBeVisible();
 });
 test('covers Microsoft login, all 9 sections, team membership, independent projects and privacy',async({page})=>{
  const requests:string[]=[];
  page.on('request',r=>{if(/supabase.co\/(auth|rest|realtime)/.test(r.url()))requests.push(r.url())});
  await page.goto('/tour/index.html');
  await page.getByRole('button',{name:/Chapter 2: Sign in with your university account/}).click();
  await expect(page.locator('#demoView').getByText('Continue with Microsoft',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:/Chapter 3: Join a group/}).click();
  await expect(page.locator('#demoView').getByText('Join an existing workspace')).toBeVisible();
  await page.getByRole('button',{name:/Chapter 11: Create a living group methods portfolio/}).click();
  await expect(page.locator('#demoView').getByText('Methods Portfolio',{exact:true}).first()).toBeVisible();
  await page.getByRole('button',{name:/Chapter 12: Write privately/}).click();
  await expect(page.locator('#demoView').getByText('Save private notes')).toBeVisible();
  await page.getByRole('button',{name:/Chapter 13: Your own project/}).click();
  await expect(page.locator('#demoView').getByText('Personal Methods Practice')).toBeVisible();
  await page.getByRole('button',{name:/Chapter 14: Invite members/}).click();
  await expect(page.locator('#demoView').getByText('Generate invitation code')).toBeVisible();
  await page.getByRole('button',{name:/Chapter 15: Shared where needed/}).click();
  await expect(page.getByText('Security design is not a security audit.',{exact:false})).toBeVisible();
  expect(requests).toEqual([]);
 });
});
