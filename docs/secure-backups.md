# Fieldwork OS — encrypted daily database backup

This is a **staged setup**, not a backup that is already running. The GitHub repository is **PUBLIC**. NEVER commit `.sql`, `.backup`, database URLs, private encryption keys, member exports, or student reflections to this repository.

The workflow `.github/workflows/encrypted-backup.yml` is scheduled for **daily 03:17 UTC** and can also run manually. It uses the Supabase-supported CLI logical-dump recipe (roles, schema, data) and encrypts the archive with **age** *before* uploading the encrypted `.age` file as a GitHub Actions artifact. GitHub retains each artifact for **30 days**. Anyone with read access to this public repository may download the **encrypted** artifact. Protect the offline age private key carefully.

**Scope limitation:** The Supabase CLI excludes managed schemas such as `auth` and `storage` by default. This backup preserves your Fieldwork OS application tables in `public` (including memberships, shared records, and private notes), but **is NOT a full restoration of Supabase Auth users, OAuth configuration, or Storage file objects**. For a complete disaster-recovery solution, plan identity recovery and Storage backups separately. Do not claim a complete recovery until a restoration has succeeded on an isolated project.

## Requirements and setup

1. **Determine whether UCL policy allows this backup destination.** Class notes and especially interview material may be personal/research data. If not permitted, do not enable this workflow for real data; arrange UCL-approved storage and retention first.
2. On your own trusted laptop (not an online key-generator website) install [age](https://github.com/FiloSottile/age), then run:
   ```sh
   age-keygen -o fieldwork-backup-key.txt
   ```
   The key file contains the **private key** and a line `# public key: age1...`. Store the private key in a password manager or an encrypted drive **outside GitHub** and make an offline recovery copy. Only the `age1...` public key belongs in GitHub.
3. In [Supabase Dashboard](https://supabase.com/dashboard/project/tkoklargitksupfoewvh), click **Connect → Session pooler**. Copy your **full Postgres database connection string**, NOT the API Project URL and NOT the public publishable/anon key. The database password needs percent-encoding within the URL if it contains reserved URI characters. Use an appropriate read-only backup credential when possible; the standard supplied `postgres` connection has broader powers and therefore requires stronger protection. Do not paste the connection string into chat.
4. In GitHub repository → **Settings → Secrets and variables → Actions**:
   - **Secrets → New repository secret:** `SUPABASE_BACKUP_DB_URL` = your complete Session pooler database connection string (with DB password).
   - **Variables → New repository variable:** `BACKUP_AGE_RECIPIENT` = the *public* `age1...` recipient generated in step 2.
5. Only when both are configured and data handling is approved, merge the backup PR to `main`. GitHub schedules run from `main`; PR tests do not perform live backups.
6. Repository → Actions → **Encrypted daily Fieldwork OS database backup** → **Run workflow**. Confirm success and that the only upload is `fieldwork-os-sql.tar.gz.age`. Do not upload plaintext files anywhere.
7. Download the encrypted artifact and store another copy in a UCL-approved private location. The GitHub artifact expires after 30 days; this is **not** indefinite retention or independent long-term storage.
8. Restore a copy into an **isolated test Supabase project**, not the production database, and verify sample task/member/note data. Only then call this backup recoverable.

## Decrypting a downloaded archive on a trusted machine

Install `age` locally. In a private directory, with your private key **kept outside the repository**, run:

```sh
age --decrypt --identity /secure/location/fieldwork-backup-key.txt \
  --output fieldwork-os-sql.tar.gz \
  fieldwork-os-sql.tar.gz.age

tar -tzf fieldwork-os-sql.tar.gz
tar -xzf fieldwork-os-sql.tar.gz
```

You should see `roles.sql`, `schema.sql`, `data.sql`. Treat the decrypted files as sensitive data and securely remove them after the restore test. Do not email or commit them.

For restoration to a new Supabase project, follow Supabase's official [Backup and Restore using CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) instructions. Check migrations, extensions, role privileges, RLS policies and managed Auth user identities on the **new project**. Do not run destructive restores against the original project.

## Security and operational caveats

- **GitHub repository is Public.** The encrypted artifact may be downloaded by repository readers, so confidentiality depends on the age private key remaining secret. If institutional policy forbids even encrypted backups here, use an approved private backup destination instead.
- The `SUPABASE_BACKUP_DB_URL` value is a **database admin-class secret**. Keep it only in GitHub Actions Secrets. Avoid workflows that run untrusted code with it.
- Keep `fieldwork-backup-key.txt` offline; if the private key is lost, encrypted backups are unrecoverable. If exposed, rotate recipient keys and delete affected archives as directed by policy.
- Supabase's Free Plan does not provide the normal Pro daily backup/PITR retention. A scheduled CLI dump is a workaround and must be reviewed for success/failure.
- A failed Action, paused Supabase project, network outage or expired artifact can create backup gaps. Check Actions after every scheduled run, especially while the project is on the Free plan.
- GitHub scheduled workflows on inactive public repositories may be automatically disabled after 60 days of inactivity. Periodically confirm they are still enabled.
- Supabase CLI excludes `auth` and `storage` by default. A future Microsoft OAuth rollout also requires securely recording Entra ID configuration and managing account linking without exposing secrets.
- Do **not** import a full backup as a regular user or use Supabase Table Editor with a service-role credential to simulate RLS privacy tests. Use two ordinary test accounts.

### Official references

- Supabase Database Backups: https://supabase.com/docs/guides/platform/backups
- Supabase Backup/Restore CLI: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- GitHub scheduled workflows: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- GitHub artifact downloads: https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts
