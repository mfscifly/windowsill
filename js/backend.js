/* Windowsill backend: Supabase sign-in, per-user documents and private photos.
 * It provides the same window.claude.use("db") / use("assets") interface the page
 * was written against, so index.html runs unchanged on any static host.
 * Config comes from js/config.js (generated at deploy time, never committed). */
(function () {
  if (window.claude?.use) return; // running inside Claude: use its own storage
  const cfg = window.WINDOWSILL_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) {
    console.warn("Windowsill: js/config.js is missing, so there is no backend.");
    return;
  }
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  const BUCKET = "photos";
  const signed = new Map(); // assetId -> signed URL
  let user = null;
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10));

  /* ---------- sign-in ---------- */
  function signInScreen() {
    return new Promise((resolve) => {
      const el = document.createElement("div");
      el.className = "ws-auth";
      el.innerHTML = `<style>
        .ws-auth{position:fixed;inset:0;z-index:999;background:var(--bg,#FAF8F3);display:grid;place-items:center;padding:24px 16px;font-family:Inter,system-ui,sans-serif;color:var(--ink,#1D1D1F)}
        .ws-auth form{width:100%;max-width:360px;display:grid;gap:12px}
        .ws-auth h1{font-size:28px;margin:0}.ws-auth p{margin:0;color:var(--muted,#6E6A62);line-height:1.45}
        .ws-auth input{font:inherit;font-size:17px;padding:14px;border-radius:12px;border:1px solid var(--line,#E5E0D6);background:var(--surface,#fff);color:inherit}
        .ws-auth button{font:inherit;font-size:17px;font-weight:600;padding:14px;border-radius:12px;border:0;background:var(--tint,#2F6FD6);color:var(--tint-ink,#fff)}
        .ws-auth button.link{background:none;color:var(--tint,#2F6FD6);font-weight:500;padding:6px}
        .ws-auth .err{color:var(--late,#B9431A);min-height:1.2em}
      </style>
      <form>
        <h1>Windowsill</h1>
        <p class="msg">Sign in with your email. We'll send you a 6-digit code.</p>
        <input type="email" name="email" autocomplete="email" placeholder="you@example.com" required>
        <input type="text" name="code" inputmode="numeric" autocomplete="one-time-code" placeholder="6-digit code" hidden>
        <button type="submit">Send code</button>
        <button type="button" class="link" hidden>Use a different email</button>
        <p class="err" role="alert"></p>
      </form>`;
      document.body.appendChild(el);
      const f = el.querySelector("form"), email = f.email, code = f.code, btn = f.querySelector("button[type=submit]"),
        back = f.querySelector(".link"), msg = f.querySelector(".msg"), err = f.querySelector(".err");
      let stage = "email";
      const toEmail = () => { stage = "email"; code.hidden = true; back.hidden = true; email.disabled = false; btn.textContent = "Send code"; msg.textContent = "Sign in with your email. We'll send you a 6-digit code."; };
      back.onclick = toEmail;
      f.onsubmit = async (e) => {
        e.preventDefault(); err.textContent = ""; btn.disabled = true;
        try {
          if (stage === "email") {
            const { error } = await sb.auth.signInWithOtp({ email: email.value.trim(), options: { shouldCreateUser: true } });
            if (error) throw error;
            stage = "code"; code.hidden = false; back.hidden = false; email.disabled = true; btn.textContent = "Sign in";
            msg.textContent = `Enter the code we sent to ${email.value.trim()}.`; code.focus();
          } else {
            const { data, error } = await sb.auth.verifyOtp({ email: email.value.trim(), token: code.value.trim(), type: "email" });
            if (error) throw error;
            el.remove(); resolve(data.user);
          }
        } catch (ex) { err.textContent = ex?.message || "Something went wrong. Try again."; }
        btn.disabled = false;
      };
    });
  }

  async function ensureUser() {
    if (user) return user;
    const { data } = await sb.auth.getSession();
    user = data.session?.user || (await signInScreen());
    return user;
  }

  /* ---------- photos ---------- */
  async function signAll(ids) {
    const need = ids.filter((id) => id && !signed.has(id));
    if (!need.length) return;
    const { data } = await sb.storage.from(BUCKET).createSignedUrls(need, 60 * 60 * 24 * 7);
    (data || []).forEach((r) => r.signedUrl && signed.set(r.path, r.signedUrl));
  }
  window.__windowsillBlob = (id) => signed.get(id) || "";

  const assets = {
    async upload(blob) {
      const u = await ensureUser();
      const ext = (blob.type || "image/jpeg").split("/")[1] || "jpg";
      const id = `${u.id}/${uid()}.${ext}`;
      const { error } = await sb.storage.from(BUCKET).upload(id, blob, { contentType: blob.type || "image/jpeg" });
      if (error) throw error;
      await signAll([id]);
      return { id };
    },
    async delete(id) {
      const { error } = await sb.storage.from(BUCKET).remove([id]);
      signed.delete(id);
      if (error) throw error;
    },
  };

  /* ---------- documents ---------- */
  const fail = (error) => { if (error) throw error; };
  function collection(coll) {
    const doc = (id) => ({
      id,
      async set(data) { fail((await sb.from("docs").upsert({ coll, id, data, updated_at: new Date().toISOString() })).error); },
      async update(patch) { fail((await sb.rpc("merge_doc", { p_coll: coll, p_id: id, p_patch: patch })).error); },
      async delete() { fail((await sb.from("docs").delete().eq("coll", coll).eq("id", id)).error); },
    });
    return {
      doc,
      async add(data) { const id = uid(); await doc(id).set(data); return doc(id); },
      onSnapshot(next, onError) {
        let alive = true;
        const load = async () => {
          const { data, error } = await sb.from("docs").select("id,data").eq("coll", coll);
          if (!alive) return;
          if (error) { onError?.(error); return; }
          if (coll === "checkins") await signAll(data.map((r) => r.data?.assetId));
          next({ docs: data.map((r) => ({ id: r.id, data: () => r.data })) });
        };
        load();
        const ch = sb.channel(`docs-${coll}-${Math.random().toString(36).slice(2)}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "docs", filter: `user_id=eq.${user.id}` },
            (ev) => { if ((ev.new?.coll || ev.old?.coll) === coll || !ev.old?.coll) load(); })
          .subscribe();
        return () => { alive = false; sb.removeChannel(ch); };
      },
    };
  }

  window.claude = {
    async use(name) {
      await ensureUser();
      if (name === "db") return { collection };
      if (name === "assets") return assets;
      throw new Error(`Unknown capability: ${name}`);
    },
  };
  /* ---------- push reminders ---------- */
  const b64 = (s) => { const p = "=".repeat((4 - (s.length % 4)) % 4), r = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(r, (c) => c.charCodeAt(0)); };
  async function pushStatus() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !cfg.vapidPublicKey) return "unsupported";
    if (Notification.permission === "denied") return "denied";
    const reg = await navigator.serviceWorker.ready;
    return (await reg.pushManager.getSubscription()) ? "on" : "off";
  }
  async function enablePush() {
    if ((await pushStatus()) === "unsupported") return "unsupported"; // iPhone: only after Add to Home Screen
    if ((await Notification.requestPermission()) !== "granted") return "denied";
    const reg = await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(cfg.vapidPublicKey) }));
    const j = sub.toJSON();
    fail((await sb.from("push_subscriptions").upsert({ endpoint: j.endpoint, keys: j.keys, tz: Intl.DateTimeFormat().resolvedOptions().timeZone })).error);
    return "on";
  }
  async function disablePush() {
    const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
    if (sub) { await sb.from("push_subscriptions").delete().eq("endpoint", sub.endpoint); await sub.unsubscribe(); }
    return "off";
  }

  window.windowsill = {
    supabase: sb,
    email: () => user?.email || "",
    signOut: async () => { await disablePush().catch(() => {}); await sb.auth.signOut(); location.reload(); },
    pushStatus, enablePush, disablePush,
  };
})();
