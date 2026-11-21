/* Demo touches on top of the real app: a "Demo" pill, a first-visit welcome, start over, and a
 * "notify me" sign-up. Runs after src/app.html, so it can use the app's own sheet and toast. */
(function () {
  // "Notify me" sign-ups go to a write-only Supabase table (supabase/waitlist.sql).
  // The anon key is public by design; the table's rules let it add rows but never read them.
  // Leave these empty to hide the form.
  const WAITLIST = { url: "https://ajjhnxworidaebijoqcd.supabase.co", anonKey: "sb_publishable_iLnmuuKLgkK9NYkppRSh1g_HzWqH_0s" };
  const NOTIFY_ENDPOINT = WAITLIST.url && WAITLIST.anonKey ? WAITLIST.url.replace(/\/$/, "") + "/rest/v1/waitlist" : "";
  const SEEN = "windowsill-demo-welcomed";

  const css = document.createElement("style");
  css.textContent = `
    .demo-pill { display:inline-flex; align-items:center; gap:6px; margin-top:6px; border:0; border-radius:999px; padding:4px 10px;
      background: var(--tint-soft); color: var(--tint); font-size:13px; font-weight:600; }
    .demo-pill i { width:7px; height:7px; border-radius:50%; background: var(--shine); }
    .demo-sheet { padding: 4px 4px 8px; display:grid; gap:14px; }
    .demo-sheet ul { margin:0; padding:0; list-style:none; display:grid; gap:10px; }
    .demo-sheet li { display:flex; gap:12px; align-items:flex-start; background: var(--surface); border-radius: 14px; padding: 12px 14px; }
    .demo-sheet li b { display:block; font-weight:600; }
    .demo-sheet li span { color: var(--muted); font-size: 15px; }
    .demo-sheet .ic { flex: 0 0 28px; height: 28px; border-radius: 8px; display:grid; place-items:center; background: var(--water-soft); color: var(--water-deep); font-size: 15px; }
    .demo-notify { display:grid; gap:8px; background: var(--surface); border-radius: 14px; padding: 14px; }
    .demo-notify h3 { font-size: 17px; }
    .demo-notify p { color: var(--muted); font-size: 15px; }
    .demo-notify form { display:flex; gap:8px; flex-wrap:wrap; }
    .demo-notify input { flex: 1 1 180px; min-height:44px; border-radius:12px; border:1px solid var(--line); background: var(--bg); padding: 10px 12px; font-size:16px; }
    .demo-notify .done { color: var(--ok); font-weight: 600; }
    .demo-foot { color: var(--faint); font-size: 13px; text-align:center; }
    .demo-foot a { color: inherit; }
  `;
  document.head.appendChild(css);

  const pill = document.createElement("button");
  pill.type = "button"; pill.className = "demo-pill"; pill.innerHTML = "<i></i>Demo · made-up plants";
  pill.addEventListener("click", () => openWelcome(false));
  const h1 = document.querySelector(".top h1");
  if (h1) h1.insertAdjacentElement("afterend", pill);

  const notifyHtml = () => NOTIFY_ENDPOINT ? `<div class="demo-notify" id="demoNotify">
      <h3>Want Windowsill for your own plants?</h3>
      <p>It's in the works. Leave your email and you'll hear when it's ready. Nothing else, ever.</p>
      <form id="demoNotifyForm"><input type="email" name="email" required placeholder="you@example.com" autocomplete="email" aria-label="Email">
        <button class="btn primary" type="submit">Notify me</button></form>
      <p class="err" role="alert" style="color:var(--late)"></p></div>` : "";

  function openWelcome(first) {
    openSheet(sheetTop(first ? "Welcome to Windowsill" : "This is a demo", "A calm plant care tracker") + `<div class="demo-sheet">
      <p class="lede">These ${S.plants.length || 16} plants are made up. Water them, move them, add your own. Everything stays in this browser.</p>
      <ul>
        <li><span class="ic">💧</span><div><b>Tap a drop to water</b><span>Today shows what's thirsty. Late ones stay until they're done.</span></div></li>
        <li><span class="ic">🌱</span><div><b>Open Mother Snake</b><span>Scroll to Family to see the plants she was divided into.</span></div></li>
        <li><span class="ic">🫙</span><div><b>Check Props</b><span>Cuttings rooting in jars, and a few for sale.</span></div></li>
        <li><span class="ic">📷</span><div><b>Add a check-in</b><span>Snap a photo on any plant to track how it grows.</span></div></li>
      </ul>
      ${notifyHtml()}
      <div class="actions"><button class="btn primary wide" type="button" data-act="close">Start exploring</button>
        ${first ? "" : `<button class="btn wide" type="button" id="demoReset">Start over</button>`}</div>
      <p class="demo-foot">Free and open source · <a href="https://github.com/mfscifly/windowsill" target="_blank" rel="noopener">View on GitHub</a></p>
    </div>`);
    document.getElementById("demoReset")?.addEventListener("click", () => window.windowsillDemo.reset());
    const f = document.getElementById("demoNotifyForm");
    f?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const box = document.getElementById("demoNotify"), err = box.querySelector(".err"), btn = f.querySelector("button");
      btn.disabled = true; err.textContent = "";
      try {
        const r = await fetch(NOTIFY_ENDPOINT, { method: "POST",
          headers: { "Content-Type": "application/json", apikey: WAITLIST.anonKey, ...(WAITLIST.anonKey.startsWith("sb_") ? {} : { Authorization: "Bearer " + WAITLIST.anonKey }), Prefer: "return=minimal" },
          body: JSON.stringify({ email: f.email.value.trim(), source: "demo" }) });
        if (!r.ok && r.status !== 409) throw new Error(); // 409: already on the list, which is fine
        box.innerHTML = `<p class="done">Thanks! You'll hear when Windowsill is ready.</p>`;
        try { localStorage.setItem("windowsill-demo-notified", "1"); } catch {}
      } catch { err.textContent = "That didn't go through. Try again in a moment."; btn.disabled = false; }
    });
  }

  let seen = false; try { seen = !!localStorage.getItem(SEEN); } catch {}
  if (!seen) {
    const go = () => { if (!S.loaded.plants) return setTimeout(go, 100); openWelcome(true); try { localStorage.setItem(SEEN, "1"); } catch {} };
    setTimeout(go, 250);
  }
})();
