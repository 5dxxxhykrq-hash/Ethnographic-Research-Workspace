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
