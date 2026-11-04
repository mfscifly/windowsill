#!/usr/bin/env bash
# Builds the standalone app into dist/ for any static host (Cloudflare Pages, Netlify, Vercel).
# src/app.html is the same page that runs as a Claude Artifact; this wraps it in a full
# document, adds the PWA bits and the Supabase backend, and writes js/config.js from env vars.
#   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_ANON_KEY=... scripts/build.sh
set -euo pipefail
cd "$(dirname "$0")/.."
: "${SUPABASE_URL:?set SUPABASE_URL}"; : "${SUPABASE_ANON_KEY:?set SUPABASE_ANON_KEY}"
rm -rf dist && mkdir -p dist/js dist/icons
cp js/backend.js dist/js/; cp icons/* dist/icons/; cp manifest.webmanifest sw.js dist/
python3 -c 'import json,os;print("window.WINDOWSILL_CONFIG = " + json.dumps({"supabaseUrl": os.environ["SUPABASE_URL"], "supabaseAnonKey": os.environ["SUPABASE_ANON_KEY"], "vapidPublicKey": os.environ.get("VAPID_PUBLIC_KEY", "")}) + ";")' > dist/js/config.js
python3 - <<'PY'
src = open("src/app.html").read()
old = 'const blobUrl = (aid) => "/_blob/" + encodeURIComponent(aid);'
assert src.count(old) == 1, "blobUrl line changed in src/app.html; update scripts/build.sh"
src = src.replace(old, 'const blobUrl = (aid) => window.__windowsillBlob(aid);')
head = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Windowsill">
<meta name="theme-color" content="#FAF8F3">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
<script src="js/config.js"></script>
<script src="js/backend.js"></script>
<script>if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});</script>
</head>
<body>
"""
open("dist/index.html", "w").write(head + src + "\n</body>\n</html>\n")
PY
echo "Built dist/"
