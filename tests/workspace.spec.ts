import {test,expect} from '@playwright/test';

test('demo dashboard loads the official research week and navigation',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{name:/Good evening/})).toBeVisible();
 await expect(page.getByText('Local demo mode.')).toBeVisible();
 await page.getByRole('button',{name:/Weekly Tracker/}).click();
 await expect(page.getByRole('heading',{name:'Weekly Tracker'})).toBeVisible();
 await expect(page.getByText('Ethnographic Research Design')).toBeVisible();
});

test('research question versions are added without overwriting the original',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Research Design/}).click();
 await page.getByRole('button',{name:'New version'}).click();
 const rq='How do postgraduate students describe encounters with library access rules in Bloomsbury?';
 await page.getByLabel('Research question (1–2 sentences)').fill(rq);
 await page.getByLabel('Revision rationale / class feedback').fill('Narrower scope for group discussion.');
 await page.getByRole('button',{name:'Save new version'}).click();
 await expect(page.getByText(rq).first()).toBeVisible();
 await expect(page.getByText('Version 2').first()).toBeVisible();
 await page.reload();
 await page.getByRole('button',{name:/Research Design/}).click();
 await expect(page.getByText(rq).first()).toBeVisible();
});

test('individual reflection notes persist in the local demo',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/My Reflection/}).click();
 const content='I noticed that asking an open-ended question changed what participants volunteered.';
 await page.getByLabel('My personal observations, difficulties, methodological learning and references').fill(content);
 await page.getByRole('button',{name:'Save private notes'}).click();
 await expect(page.getByText('saved total')).toBeVisible();
 await page.reload();
 await page.getByRole('button',{name:/My Reflection/}).click();
 await expect(page.getByLabel('My personal observations, difficulties, methodological learning and references')).toHaveValue(content);
});

test('a team task can be assigned and retained after reload',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Team & Tasks/}).click();
 await page.getByRole('button',{name:'New task'}).click();
 await page.getByLabel('Task title').fill('Check Birkbeck access policies');
 await page.getByLabel('Lead').selectOption('member-b');
 await page.getByRole('button',{name:'Create task'}).click();
 await expect(page.getByText('Check Birkbeck access policies')).toBeVisible();
 await page.reload();
 await expect(page.getByText('Check Birkbeck access policies')).toBeVisible();
});

test('an observation session records roles and updates actual coverage',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Fieldwork/}).click();
 await page.getByRole('button',{name:'New session'}).click();
 await page.getByLabel('Session title').fill('Research observation test');
 await page.getByLabel('Method').selectOption('Observation');
 await page.getByLabel('Planned / actual session minutes').fill('120');
 await page.getByLabel('Status').selectOption('Completed');
 await page.getByLabel('Member A').check();
 await page.getByLabel(/I checked all applicable consent/).check();
 await page.getByRole('button',{name:'Save session'}).click();
 await expect(page.getByText('Research observation test')).toBeVisible();
 await expect(page.getByText('2.0 h').first()).toBeVisible();
 await page.reload();
 await expect(page.getByText('Research observation test')).toBeVisible();
});
