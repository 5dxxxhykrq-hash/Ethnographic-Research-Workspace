import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./tests-auth',
 retries:process.env.CI?1:0,
 reporter:process.env.CI?'github':'list',
 use:{baseURL:'http://127.0.0.1:5175',trace:'retain-on-failure'},
 projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],
 webServer:{
  command:'npm run dev -- --host 127.0.0.1 --port 5175',
  url:'http://127.0.0.1:5175',
  reuseExistingServer:!process.env.CI,
  timeout:60000,
  env:{
   VITE_SUPABASE_URL:'https://auth-test.supabase.co',
   VITE_SUPABASE_ANON_KEY:'sb_publishable_fake_key_for_browser_tests'
  }
 }
});
