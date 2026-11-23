// Daily watering reminders. Run hourly (see .github/workflows/reminders.yml): each person
// gets at most one push a day, at REMIND_HOUR in their own time zone, listing plants that
// are due or overdue. Overdue plants keep showing up every day until they're watered.
//
// Env: SUPABASE_URL, SUPABASE_SECRET_KEY (server only, never in the app),
//      VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto: or https: contact),
//      REMIND_HOUR (default 8), DRY_RUN=1 to log instead of send, FORCE=1 to ignore the hour.
import webpush from "web-push";

const env = (k, d) => process.env[k] || d;
const URL_ = env("SUPABASE_URL"), KEY = env("SUPABASE_SECRET_KEY");
const HOUR = Number(env("REMIND_HOUR", "8")), DRY = env("DRY_RUN") === "1", FORCE = env("FORCE") === "1";

async function rest(path, init = {}) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: KEY, "Content-Type": "application/json", Prefer: "return=minimal", ...(init.headers || {}) },
  });
  if (!r.ok) throw new Error(`${init.method || "GET"} ${path}: ${r.status} ${await r.text()}`);
  return r.status === 204 || init.method ? null : r.json();
}

export function localNow(tz, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23",
  }).formatToParts(now).map((p) => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

export function message(due, date) {
  const items = due.filter((x) => x.d && x.d <= date);
  if (!items.length) return null;
  const late = items.filter((x) => x.d < date), names = items.map((x) => x.name);
  const list = names.length <= 3 ? names.join(", ").replace(/, ([^,]*)$/, " and $1") : `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;
  const title = items.length === 1 ? `${names[0]} is thirsty` : `${items.length} plants are thirsty`;
  const body = items.length === 1 ? (late.length ? "Overdue. Tap to log a watering or a check." : "Due today.")
    : late.length ? `${list}. ${late.length === items.length ? "All" : late.length} overdue.` : `${list}. Due today.`;
  return { title, body };
}

async function main() {
  for (const k of ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"])
    if (!process.env[k]) { console.log(`Missing ${k}; nothing to do.`); return; }
  webpush.setVapidDetails(env("VAPID_SUBJECT"), env("VAPID_PUBLIC_KEY"), env("VAPID_PRIVATE_KEY"));
  const [rows, subs] = await Promise.all([
    rest("due_summary?select=user_id,due,tz,last_sent"),
    rest("push_subscriptions?select=user_id,endpoint,keys"),
  ]);
  const byUser = new Map();
  for (const s of subs) (byUser.get(s.user_id) || byUser.set(s.user_id, []).get(s.user_id)).push(s);
  let sent = 0;
  for (const row of rows) {
    const mine = byUser.get(row.user_id);
    if (!mine?.length) continue;
    let now;
    try { now = localNow(row.tz || "UTC"); } catch { now = localNow("UTC"); }
    if (!FORCE && now.hour !== HOUR) continue;
    if (row.last_sent === now.date) continue;
    const msg = message(row.due || [], now.date);
    if (!msg) continue;
    for (const s of mine) {
      if (DRY) { console.log(`[dry run] would send to one device: ${msg.title}`); continue; }
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(msg), { TTL: 60 * 60 * 12 });
        sent++;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) await rest(`push_subscriptions?endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: "DELETE" });
        else console.warn(`Push failed (${e.statusCode || e.message})`);
      }
    }
    if (!DRY) await rest(`due_summary?user_id=eq.${row.user_id}`, { method: "PATCH", body: JSON.stringify({ last_sent: now.date }) });
  }
  console.log(`Reminders sent: ${sent}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e.message); process.exit(1); });
