# Fieldwork OS

**Collaborative Ethnographic Research Workspace** — a responsive academic project tracker for UCL ANTH0130, adaptable to other student research projects.

## Current scope

- Six-digit email OTP login (Supabase Auth; in-browser verification), project invitations and per-project roles (owner/admin/member/viewer).
- Responsive dashboard and official 2026 Term 1 milestones, Week 1–10.
- Assignable kanban tasks with deadlines, evidence references and status changes.
- Research Question Studio with **immutable version history**, access/site tracking, method plans and decision log.
- Interview and participant-observation session planning, researcher roles, individual time logs, and group observation totals.
- Pseudonymous participant codes, informed consent/access tracking and individual GDPR declarations.
- Seven-part shared Methods Portfolio with revisions and tutor-feedback fields.
- **Private, row-level-secured individual reflection notes** and text export.
- Local demo mode so the interface can be explored before back-end setup. **Demo mode is not multiuser and is not safe for real fieldwork data.**

## Running locally

Requires Node.js 20+.

```sh
npm install
npm run dev
```

Visit http://localhost:5173. Without environment variables, the app displays a **locally stored demo** using synthetic members and study records. Its changes persist only in that browser via localStorage.

## Enabling real multiuser collaboration

1. Create a **Supabase project**.
2. In Supabase SQL Editor, run `supabase/migrations/001_initial.sql`.
3. Configure **Authentication → Emails / Email Templates**: replace the contents of **both Confirm sign up and Magic link / OTP** with the six-digit template using `{{ .Token }}` as described in [Email OTP setup](docs/email-otp-setup.md). Preserve existing Site URL / Redirect URLs under URL Configuration.
4. Copy `.env.example` to `.env.local` and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` (public anon/publishable key; **never** a service-role key)
5. Restart `npm run dev`, sign in, create a project and use an invitation code from Settings > Invite collaborators.
6. For production, configure those **same public** environment variables on your hosting provider. Deploy via Vercel, Netlify or a compatible static host. Configure fallback routing as appropriate.
7. Verify with two distinct accounts that they can share a project but cannot view each other's private reflection content.

**Important:** Do not merge the new six-digit-code frontend until the two Supabase email templates have been changed and saved. The built-in Supabase SMTP service is development-only and allows about two emails per hour for preauthorized addresses. For team use configure custom SMTP. See [the step-by-step activation guide](docs/email-otp-setup.md).\n\n**Note:** Supabase credentials, authentication settings and production hosting are not provisioned by the code repository. A successful build is not an already deployed app.

## Privacy and ethics

This is a **public GitHub repository**. Do **not** commit API secrets, personal participant details, informed consent forms, raw interview notes or other sensitive fieldwork materials to it.

The application intentionally stores only pseudonymous codes and **references** to externally secured research documents. Row-level security isolates projects, and each personal reflection is visible only to its owner. These are technical controls, not a substitute for UCL ethics review, data-protection training or permission to collect data. Confirm that any proposed service is appropriate for university research data before using it with real participants. Classroom access, library entry and permission to conduct research are separate matters.

Course facts come from the provided ANTH0130 Methods Portfolio, Week 1 Lecture Slides and Peer Research Project Instructions. Group-defined suggestions are separated from formal milestones. The module requires every researcher to practise interviews and participant observation, 2–5 hours of research per person, at least 2 hours of group participant observation, no audio recording, and completion of GDPR training by Week 8. Its fieldwork window is 9–27 November 2026. The individual 2,300-word reflection is due 11 December 2026 at 13:00 UK time.

## Code structure

```
src/
  App.tsx                 # navigation, sign-in and project selection
  lib/store.tsx           # demo and Supabase data adapters, realtime updates
  lib/course.ts           # official milestones, portfolio sections and demo records
  lib/supabase.ts         # public client initialization
  pages/                  # overview, weekly, design, tasks, fieldwork,
                           # ethics, portfolio, reflection, settings
  styles.css              # responsive academic design system
supabase/migrations/      # RLS-secured SQL schema and invitation RPCs
.github/workflows/        # TypeScript + Vite build check
```

## Build and verification

```sh
npm run build
```

The CI workflow runs the same TypeScript check and Vite production build.

## Limits of v1

- No audio recording or AI-generated graded coursework.
- No native storage of identifiable fieldnotes or consent documents.
- The local demo does **not** synchronise between users or devices.
- Rich-text collaborative cursors, calendar integrations and Word export are not in v1.
- Changes in shared research records are backed by RLS and minimal activity auditing; edit collisions on the same long-form text should be avoided by team coordination until conflict-aware editing is added.

© Project contributors. Follow the university's applicable ethical and academic integrity rules.
