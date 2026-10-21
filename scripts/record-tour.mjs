// Record the public, synthetic interactive tour only. No Supabase credentials are used.
// Run with TOUR_LANG=zh to record captions in Chinese; default English.
import {chromium} from '@playwright/test';
import {mkdir,copyFile,readdir} from 'node:fs/promises';
import path from 'node:path';
const base=process.env.TOUR_BASE_URL||'http://127.0.0.1:5173';
const lang=process.env.TOUR_LANG==='zh'?'zh':'en';
const out=path.resolve('tour-output');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,recordVideo:{dir:out,size:{width:1440,height:900}}});
 const page=await context.newPage();
 await page.goto(base+'/tour/',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#timeline button:nth-child(16)');
 if(lang==='zh')await page.getByRole('button',{name:'Toggle Chinese and English captions'}).click();
 // Tour is deliberately 16 chapters * 8 seconds, no authentication or external data.
 await page.waitForTimeout(16*8000+1500);
 const video=page.video();
 await context.close();
 if(!video)throw new Error('Playwright did not produce a recording');
 const videoPath=path.join(out,'fieldwork-os-tour-'+lang+'.webm');
 await copyFile(await video.path(),videoPath);
 console.log('Captured '+videoPath);
} finally {await browser.close()}
