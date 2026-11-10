# Windowsill

A phone-first house plant tracker: what needs water today, per-plant care notes, rooms and
their light, pet-toxicity flags, photo check-ins, and a list of cuttings.

Anyone can run their own copy. Each person signs in with their email and gets their own
private plants, rooms, cuttings and photos.

## Code only, no personal data

This repo holds code only. Plant records, logs, photos and keys never go in git:

- Data lives in Supabase, one row per document, locked to its owner by row-level security.
- Photos live in a private Supabase Storage bucket, under a folder per user.
- `js/config.js` (your Supabase URL and public anon key) is generated at deploy time and gitignored.
- Local exports or backups go in `data/` or `*.local.json`, which are gitignored too.

## How it fits together

| Path | What it is |
| --- | --- |
| `src/app.html` | The whole app UI: one self-contained page. |
| `js/backend.js` | Supabase sign-in (email code), documents and photos behind a small `collection().doc().update()` style API the page uses. |
| `supabase/schema.sql` | Tables, privacy rules and the photo bucket. Run once per Supabase project. |
| `manifest.webmanifest`, `sw.js`, `icons/` | Home-screen install, offline shell, notifications. |
| `scripts/build.sh` | Wraps the page into `dist/` and writes `js/config.js` from env vars. |
| `docs/` | [Setup guide](docs/setup.md) and [data schema](docs/schema.md). |
| `CREDITS.md` | Attribution for adapted artwork. |

`src/app.html` also runs unchanged as a Claude Artifact using that platform's own storage;
`js/backend.js` steps aside when it detects it.

## Run your own

See [docs/setup.md](docs/setup.md). In short: create a free Supabase project, run
`supabase/schema.sql`, then deploy this repo to a static host with
`SUPABASE_URL` and `SUPABASE_ANON_KEY` set and `bash scripts/build.sh` as the build command.
