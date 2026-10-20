# Email OTP activation — Fieldwork OS

The React website accepts a **six-digit one-time email code**, verified on the same page. A Supabase administrator must activate the corresponding email templates. Neither the public GitHub repository nor Vercel can change your Supabase dashboard templates without authorized admin access.

## 1. Update BOTH authentication email templates

Supabase Dashboard → your project `fieldwork-os` → Authentication → Emails (or Email Templates, depending on the dashboard version).

### A. Confirm sign up

For new signups and unverified addresses, select **Confirm sign up**.

Subject: `Confirm your Fieldwork OS email with a code`

HTML body:

```html
<h2>Confirm your Fieldwork OS email</h2>
<p>Enter this six-digit code in the Fieldwork OS login screen:</p>
<p style="font-size:30px;font-weight:bold;letter-spacing:5px;">{{ .Token }}</p>
<p>If you didn't request this code, you can ignore this email.</p>
```

Save the template. **Remove** any old sign-in / confirmation links based on `{{ .ConfirmationURL }}` from the body, so users enter the code in the website.

### B. Magic link / OTP

For returning accounts, select **Magic link** or **Magic link / OTP**.

Subject: `Your Fieldwork OS sign-in code`

HTML body:

```html
<h2>Your Fieldwork OS sign-in code</h2>
<p>Enter this six-digit code in the Fieldwork OS login screen:</p>
<p style="font-size:30px;font-weight:bold;letter-spacing:5px;">{{ .Token }}</p>
<p>If you didn't request this code, you can ignore this email.</p>
```

Save this template too. Do not edit the unrelated **Reset password**, **Change email address**, or **Invite user** templates without a specific reason.

Supabase docs: https://supabase.com/docs/guides/auth/auth-email-passwordless and https://supabase.com/docs/guides/auth/auth-email-templates

**Why both?** Supabase email OTP shares its implementation with Magic Links, but first-time `signInWithOtp` users may receive the **Confirm sign up** email instead of **Magic link / OTP**. Both should contain `{{ .Token }}`.

## 2. Keep the existing Supabase and Vercel configuration

Vercel production domain: `https://ethnographic-research-workspace.vercel.app/`.

Existing Site URL and Redirect URLs can remain as currently configured. The 6-digit-code flow does **not** rely on clicking a link or switching browsers.

Existing Vercel environment variables stay exactly the same:
- `VITE_SUPABASE_URL` — your Supabase Project URL
- `VITE_SUPABASE_ANON_KEY` — the public publishable (or anon) key

**Never** paste service-role keys, SMTP passwords, database passwords or actual OTP codes in your repo or screenshots.

No SQL migration is needed and **do not rerun** `001_initial.sql`.

## 3. Deployment order (important)

1. Prepare this branch and confirm GitHub CI is green.
2. Update **both** Supabase email templates above, save them.
3. Merge the OTP Pull Request to **main**. The Vercel GitHub integration deploys automatically.
4. In Vercel → Deployments, confirm the latest **Production** deployment is **Ready** and linked to the merge commit. Open the domain.
5. Request **one** code with your confirmed email address. On the same Fieldwork OS page, enter the latest 6 digits.
6. Confirm the site shows **Start your research workspace**, then create your own workspace.
7. Only then perform two-account membership/permissions testing.

**Do not merge before the email templates are saved.** If the new frontend is deployed while Supabase still sends Magic Links, users may get an email link but no input on the page to complete the expected OTP flow.

## 4. SMTP and limits

Supabase's built-in sender is only for development, restricts recipients to authorized project-team emails and currently allows around two emails per project per hour. Changing the template or frontend **does not** change this limit.

For several researchers to sign in, set up your own SMTP provider from Supabase Authentication → SMTP settings (position varies). See https://supabase.com/docs/guides/auth/auth-smtp and https://supabase.com/docs/guides/auth/rate-limits.

## 5. Troubleshooting

- **Email rate limit exceeded**: wait until the sending limit replenishes, or use configured SMTP.
- **No code in email**: recheck that both templates contain `{{ .Token }}`; older emails won't be converted into codes.
- **Invalid or expired OTP**: verify the exact email address, digits, latest message, and expiry; avoid submitting old codes.
- **Login succeeds but asks for email again**: check that the same deployed hostname and browser session are used; report the error and browser.
- **Existing multiple email identities**: Supabase treats `name.26@...` and `name26@...` as different login accounts. Use a single verified address. Do not delete users without checking existing project ownership and saved records.

Research-data use still requires validation of institutional ethics, storage, and access requirements.
