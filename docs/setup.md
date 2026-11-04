# Setting up your own Windowsill

About 15 minutes, all on free tiers.

## 1. Supabase (accounts and data)

1. Create a project at https://supabase.com/dashboard/new.
2. Open **SQL Editor**, paste in `supabase/schema.sql`, and run it.
3. **Authentication → Emails → Templates → Magic Link**: make sure the email includes the
   6-digit code, for example `Your Windowsill code is {{ .Token }}`. (A code works better than a
   link on iPhone, because links open in Safari instead of the home-screen app.)
4. **Authentication → URL Configuration**: set Site URL to your app's address once it's deployed.
5. **Project Settings → API**: copy the **Project URL** and the **anon public** key.
   Never put the `service_role` key in the app or in git.

## 2. Hosting (the app itself)

Any static host works. With Cloudflare Pages (free, works with private repos):

1. Create a Pages project connected to this GitHub repo.
2. Build command: `bash scripts/build.sh`. Output directory: `dist`.
3. Environment variables: `SUPABASE_URL` and `SUPABASE_ANON_KEY` from step 1.5, plus `VAPID_PUBLIC_KEY` once push reminders are set up.

To try it locally: `SUPABASE_URL=... SUPABASE_ANON_KEY=... bash scripts/build.sh`, then serve
`dist/` (for example `python3 -m http.server -d dist`).

## 3. On your phone

Open the app's address in Safari, sign in with your email code, then Share → **Add to Home Screen**.
