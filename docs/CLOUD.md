# Cloud accounts (optional)

Without this setup the app is fully local: progress stays on the device and the Supabase library is never downloaded.

## What it does

- A **parent** creates an account (email + password) inside the parent area, behind the grown-up check. Children never sign in.
- Sign-up requires the parent to tick a consent box. Only each child's nickname, avatar and learning progress are stored. No child emails, real names or voice recordings.
- Progress syncs across devices about 5 seconds after changes, on app start, on reconnect, and on "Sync now".
- Devices are **merged, not overwritten** (`src/lib/sync.ts`):
  - per verb, the copy with the most answers wins; badges and unlocked tenses are combined; XP keeps the higher value
  - settings follow the most recently changed device
  - "Erase progress" always wins over older copies
- "Delete cloud account" removes the login and every child row (GDPR erasure). Data on the device is kept.

## Setup (about 10 minutes)

1. Create a project at <https://supabase.com>. Pick an **EU region** if your families are in the EU (GDPR).
2. In **SQL Editor**, paste and run [`supabase/cloud.sql`](../supabase/cloud.sql). It creates the `child_profile` table, row-level security (each parent can only reach their own rows) and `delete_my_account()`.
3. In **Authentication → URL Configuration**, set **Site URL** to where the app is served (for example `http://localhost:5173`) and add the same URL under **Redirect URLs**. Email confirmations and password resets land there.
4. In **Project Settings → API Keys**, copy the Project URL and the **publishable** key (`sb_publishable_…`, or the legacy `anon` key) into `.env.local` (copy it from `.env.example`):

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

   The anon key is meant to be public; row-level security protects the data. Never put the `service_role` key in the app.
5. Restart `npm run dev`. The parent area now shows **Cloud backup & sync**.

## Before real families use it

- **Email:** Supabase's built-in email sender is rate-limited and meant for testing. Configure your own SMTP (Authentication → Emails → SMTP).
- **Privacy notice:** publish one naming Supabase as your processor, the region, and what's stored. Children's data under GDPR/COPPA also needs a lawful basis (parental consent) and a processor agreement (Supabase offers a DPA).
- **Backups:** daily backups are included on paid plans; point-in-time recovery is extra.
