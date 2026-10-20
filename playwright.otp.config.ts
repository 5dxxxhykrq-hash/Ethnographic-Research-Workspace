import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./tests-otp',
 retries:process.env.CI?1:0,
 reporter:process.env.CI?'github':'list',
 use:{baseURL:'http://127.0.0.1:5174',trace:'retain-on-failure'},
 projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],
 webServer:{
  command:'npm run dev -- --host 127.0.0.1 --port 5174',
  url:'http://127.0.0.1:5174',
  reuseExistingServer:!process.env.CI,
  timeout:60000,
  env:{
   VITE_SUPABASE_URL:'https://otp-demo.supabase.co',
   VITE_SUPABASE_ANON_KEY:'sb_publishable_fake_key_for_browser_tests'
  }
 }
});
