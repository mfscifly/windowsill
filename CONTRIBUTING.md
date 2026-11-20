# Contributing to Windowsill

Thanks for wanting to help. Windowsill is a small project, so small, focused pull requests are
easiest to review: one fix or one feature at a time.

## Ground rules

1. **Never commit personal data.** No real plant lists, care logs, photos, exports, Supabase keys
   or `.env` files. Use made-up demo plants in examples, tests and screenshots.
   The `.gitignore` already covers `data/`, `*.local.*`, `backup*.json`, `.env*` and `js/config.js`.
2. **Keep it dependency-free.** The app is plain HTML, CSS and JavaScript with no framework or
   bundler. Please don't add one without opening an issue first.
3. **Keep the look.** Light theme only, iOS-style grouped lists, blue for anything to do with water,
   and as few words on screen as will do. Detail belongs behind a tap.
4. **Credit any third-party art** in [CREDITS.md](CREDITS.md) and in the app if its license asks for it.

## Running it locally

Follow [docs/setup.md](docs/setup.md) to create a free Supabase project, then:

```bash
SUPABASE_URL=https://xxxx.supabase.co SUPABASE_ANON_KEY=... bash scripts/build.sh
python3 -m http.server -d dist 8080
```

`src/app.html` is the whole UI. `js/backend.js` adapts its small document API
(`collection().doc().update()`, `onSnapshot`) to Supabase.

### Rules for app code

- Read and write data only through `S.db.collection(...)` (`add`, `doc().set`, `doc().update`,
  `doc().delete`, `onSnapshot`). `update` is a shallow merge of top-level fields.
- Upload and delete photos only through `S.assets`.
- Keep the line `const blobUrl = (aid) => "/_blob/" + encodeURIComponent(aid);` exactly as it is;
  the build script patches it.
- A new collection must also be added to the allowed list in `supabase/schema.sql`.
- Document any new fields in [docs/schema.md](docs/schema.md).

### Screenshots

If your change affects what's on screen, regenerate the README screenshots from demo data:

```bash
node scripts/screenshots.js   # needs Playwright with Chromium
```

## Reporting bugs and ideas

Open an [issue](https://github.com/mfscifly/windowsill/issues). For bugs, include your phone or
browser, whether you're using the home-screen app, and the steps to reproduce. Please leave out
anything personal.

For security problems, see [SECURITY.md](SECURITY.md) instead of opening a public issue.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
