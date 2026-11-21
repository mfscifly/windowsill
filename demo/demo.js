/* Windowsill demo backend: made-up plants, stored only in this browser.
 * Provides the same window.claude.use("db") / use("assets") interface as js/backend.js,
 * so src/app.html runs unchanged. No sign-in, no server, nothing leaves the device. */
(function () {
  const KEY = "windowsill-demo-v1", PHOTO_KEY = "windowsill-demo-photos-v1";
  const t0 = new Date();
  const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const ago = (n) => { const d = new Date(t0); d.setDate(d.getDate() - n); return iso(d); };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10));

  /* ---------- sample collection (all invented) ---------- */
  // Watering history going back from the last drink, so each plant has a believable log.
  const hist = (last, every, n = 4, fedEvery = 0) => {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = last + i * every;
      out.push({ d: ago(d), t: "water", ...(fedEvery && i % fedEvery === 0 ? { fed: true } : {}) });
    }
    return out;
  };
  const TOXIC = "Toxic to cats and dogs if chewed";
  function seed() {
    const rooms = [
      { id: "living", name: "Living room", facing: "south", light: "bright indirect", cats: "everywhere", notes: "Big south window with a sheer curtain. Plants sit 3 to 6 ft back." },
      { id: "kitchen", name: "Kitchen", facing: "east", light: "medium", cats: "some", notes: "Morning sun on the sill. Top shelf is out of the cats' reach." },
      { id: "bedroom", name: "Bedroom", facing: "north", light: "low", cats: "closed", notes: "Soft light all day. Door stays shut." },
      { id: "bathroom", name: "Bathroom", facing: "west", light: "bright indirect", cats: "closed", notes: "Steamy, with a small grow light on a timer." },
    ];
    const plants = [
      { id: "big-leaf", name: "Big Leaf", common: "Monstera", species: "Monstera deliciosa", roomId: "living", spot: "Floor by the window", catReach: "yes", pot: "12 in terracotta", soil: "Chunky aroid mix", acquired: ago(420), source: "Farmers market",
        waterEvery: 8, lastWatered: ago(10), lastFed: ago(40), lastInspected: ago(12), repotted: ago(200), created: ago(420),
        care: { light: "Bright indirect. Tolerates some morning sun.", lightNeed: "bright indirect", water: "When the top 2 in are dry", humidity: "Average is fine, loves more", toxic: TOXIC, dormancy: "Slows down Nov to Feb", feed: "standard", propagate: "Stem cutting with a node, in water", cues: ["Top 2 in of soil dry", "Pot feels light", "Leaves curl slightly"] },
        log: [...hist(10, 8, 5, 2), { d: ago(30), t: "note", note: "New leaf unfurling, first one with holes!" }] },
      { id: "goldie", name: "Goldie", common: "Golden pothos", species: "Epipremnum aureum", roomId: "kitchen", spot: "Top shelf", catReach: "no", pot: "6 in ceramic", acquired: ago(700), source: "Cutting from a friend",
        waterEvery: 7, lastWatered: ago(7), lastFed: ago(25), lastInspected: ago(8), created: ago(700),
        care: { light: "Anything from low to bright indirect", lightNeed: "low", water: "When the top half is dry", humidity: "Average", toxic: TOXIC, feed: "standard", propagate: "Easiest plant to root in water", cues: ["Leaves look a little soft", "Top half of soil dry"] },
        log: hist(7, 7, 5, 2) },
      { id: "mother-snake", name: "Mother Snake", common: "Snake plant", species: "Sansevieria trifasciata", roomId: "living", spot: "Corner by the bookcase", catReach: "yes", pot: "8 in glazed", soil: "Cactus mix + perlite", acquired: ago(1100), source: "Grandma's house",
        waterEvery: 21, lastWatered: ago(4), lastFed: ago(90), lastInspected: ago(5), repotted: ago(45), created: ago(1100),
        care: { light: "Low to bright, not fussy", lightNeed: "low", water: "Only when fully dry", humidity: "Dry air is fine", toxic: TOXIC, dormancy: "Barely drinks in winter", feed: "succulent", propagate: "Divide at the root or leaf cuttings", cues: ["Soil dry all the way down", "Leaves slightly wrinkled"] },
        log: [...hist(25, 21, 3), { d: ago(45), t: "repot", note: "Split into three" }, { d: ago(4), t: "water" }] },
      { id: "hiss", name: "Hiss", common: "Snake plant", species: "Sansevieria trifasciata", roomId: "bedroom", spot: "Dresser", catReach: "no", pot: "5 in white", parentId: "mother-snake", origin: { t: "division", d: ago(45) }, acquired: ago(45), source: "Divided from Mother Snake",
        waterEvery: 21, lastWatered: ago(4), lastInspected: ago(20), created: ago(45),
        care: { light: "Low to bright, not fussy", lightNeed: "low", water: "Only when fully dry", toxic: TOXIC, feed: "succulent" },
        log: [{ d: ago(45), t: "water" }, { d: ago(25), t: "water" }, { d: ago(4), t: "water" }] },
      { id: "noodle", name: "Noodle", common: "Snake plant", species: "Sansevieria trifasciata", roomId: "kitchen", spot: "Top shelf", catReach: "no", pot: "4 in terracotta", parentId: "mother-snake", origin: { t: "division", d: ago(45) }, acquired: ago(45), source: "Divided from Mother Snake",
        waterEvery: 21, lastWatered: ago(19), lastInspected: ago(20), created: ago(45),
        care: { light: "Low to bright, not fussy", lightNeed: "low", water: "Only when fully dry", toxic: TOXIC, feed: "succulent" },
        log: [{ d: ago(45), t: "water" }, { d: ago(19), t: "water" }] },
      { id: "pancake", name: "Pancake", common: "Chinese money plant", species: "Pilea peperomioides", roomId: "kitchen", spot: "Window sill", catReach: "yes", pot: "5 in mint glaze", acquired: ago(300), source: "Plant swap",
        waterEvery: 9, lastWatered: ago(1), lastFed: ago(20), lastInspected: ago(10), created: ago(300),
        care: { light: "Bright indirect. Turn weekly so it grows straight.", lightNeed: "bright indirect", water: "When the top inch is dry", humidity: "Average", toxic: false, feed: "standard", propagate: "Pups pop up from the soil. Cut and pot them.", cues: ["Leaves droop like an umbrella", "Top inch dry"] },
        log: hist(1, 9, 5, 2) },
      { id: "pancake-jr", name: "Pancake Jr", common: "Chinese money plant", species: "Pilea peperomioides", roomId: "bathroom", spot: "Under the grow light", catReach: "no", pot: "3 in nursery pot", parentId: "pancake", origin: { t: "pup", d: ago(60) }, acquired: ago(60),
        waterEvery: 7, lastWatered: ago(5), lastInspected: ago(15), created: ago(60),
        care: { light: "Bright indirect", lightNeed: "bright indirect", water: "When the top inch is dry", toxic: false, feed: "standard" },
        log: hist(5, 7, 4) },
      { id: "charlotte", name: "Charlotte", common: "Spider plant", species: "Chlorophytum comosum", roomId: "bedroom", spot: "Hanging by the window", catReach: "no", pot: "Hanging basket", acquired: ago(500),
        waterEvery: 6, lastWatered: ago(6), lastFed: ago(30), lastInspected: ago(9), created: ago(500),
        care: { light: "Medium to bright indirect", lightNeed: "medium", water: "Keep lightly moist", humidity: "Average", toxic: false, feed: "standard", tapWater: "avoid", propagate: "Root the babies in water or soil", cues: ["Leaves lose their shine", "Top inch dry"] },
        log: hist(6, 6, 5, 3) },
      { id: "jade", common: "Jade plant", species: "Crassula ovata", roomId: "living", spot: "Window sill", catReach: "yes", pot: "6 in terracotta", soil: "Cactus mix", acquired: ago(900),
        waterEvery: 18, lastWatered: ago(12), lastFed: ago(100), lastInspected: ago(11), created: ago(900),
        care: { light: "Direct sun or very bright", lightNeed: "bright indirect", water: "Soak, then let it dry out fully", humidity: "Dry air is fine", toxic: TOXIC, dormancy: "Water very little Nov to Feb", feed: "succulent", propagate: "Leaf or stem cuttings, let them callus first", cues: ["Leaves slightly wrinkled", "Soil dry all the way down"] },
        log: hist(12, 18, 3) },
      { id: "hearts", common: "String of hearts", species: "Ceropegia woodii", roomId: "living", spot: "Bookcase top", catReach: "yes", pot: "4 in hanging", acquired: ago(200),
        waterEvery: 12, lastWatered: ago(2), lastInspected: ago(3), created: ago(200),
        care: { light: "Bright indirect", lightNeed: "bright indirect", water: "When fully dry", toxic: false, feed: "succulent", propagate: "Lay strands on soil, or root tubers" },
        log: hist(2, 12, 4) },
      { id: "twitchy", name: "Twitchy", common: "Nerve plant", species: "Fittonia albivenis", roomId: "bathroom", spot: "Shelf by the shower", catReach: "no", pot: "4 in glass", acquired: ago(150),
        waterEvery: 4, lastWatered: ago(6), lastInspected: ago(14), created: ago(150), health: "Fainted while dry. Perks up within hours of a drink.",
        care: { light: "Medium, no direct sun", lightNeed: "medium", water: "Keep evenly moist", humidity: "High. The bathroom suits it.", toxic: false, feed: "standard", method: "bottom", cues: ["Dramatic flop", "Top of soil dry"] },
        log: hist(6, 4, 5) },
      { id: "dragon", name: "Dragon", common: "Elephant ear", species: "Alocasia × amazonica 'Polly'", roomId: "bathroom", spot: "Under the grow light", catReach: "no", pot: "6 in self-watering", acquired: ago(90), source: "Garden centre",
        waterEvery: 8, lastWatered: ago(6), lastFed: ago(28), lastInspected: ago(30), created: ago(90),
        care: { light: "Bright indirect", lightNeed: "bright indirect", water: "When the top inch is dry, never soggy", humidity: "High", toxic: TOXIC, dormancy: "May drop leaves in winter. Don't panic.", feed: "standard", tapWater: "avoid", cues: ["Top inch dry", "Leaves droop a little"] },
        log: [...hist(6, 8, 4), { d: ago(20), t: "issue", note: "Lower leaf yellowing. Normal as a new one opens." }] },
      { id: "silver", name: "Silver", common: "Satin pothos", species: "Scindapsus pictus 'Argyraeus'", roomId: "bathroom", spot: "Trailing off the cabinet", catReach: "no", pot: "5 in ceramic", acquired: ago(240),
        waterEvery: 10, lastWatered: ago(3), lastFed: ago(26), lastInspected: ago(6), created: ago(240),
        care: { light: "Medium to bright indirect", lightNeed: "medium", water: "When leaves curl slightly", humidity: "Likes it humid", toxic: TOXIC, feed: "standard", propagate: "Stem cuttings in water" },
        log: hist(3, 10, 4, 2) },
      { id: "iron", common: "Cast iron plant", species: "Aspidistra elatior", roomId: "bedroom", spot: "Floor, far corner", catReach: "no", pot: "10 in stoneware", acquired: ago(1400),
        waterEvery: 14, lastWatered: ago(10), lastInspected: ago(20), created: ago(1400),
        care: { light: "Low. Lives up to its name.", lightNeed: "low", water: "When the top half is dry", toxic: false, feed: "standard" },
        log: hist(10, 14, 3) },
      { id: "echeveria", common: "Echeveria", species: "Echeveria 'Perle von Nürnberg'", roomId: "kitchen", spot: "Window sill", catReach: "yes", pot: "3 in terracotta", soil: "Gritty succulent mix", acquired: ago(120),
        waterEvery: 14, lastWatered: ago(15), lastInspected: ago(16), created: ago(120),
        care: { light: "Direct morning sun", lightNeed: "direct", water: "Soak and dry", toxic: false, feed: "succulent", dormancy: "Water sparingly in winter", propagate: "Leaf cuttings" },
        log: hist(15, 14, 3) },
      { id: "spike", name: "Spike", common: "Dragon tree", species: "Dracaena marginata", roomId: "living", spot: "Beside the couch", catReach: "yes", pot: "10 in white", acquired: ago(600),
        waterEvery: 10, lastWatered: ago(10), lastFed: ago(35), lastInspected: ago(8), created: ago(600),
        care: { light: "Medium to bright indirect", lightNeed: "medium", water: "When the top half is dry", toxic: TOXIC, feed: "standard", tapWater: "avoid" },
        log: hist(10, 10, 4, 2) },
      { id: "lil-goldie", name: "Lil Goldie", common: "Golden pothos", species: "Epipremnum aureum", roomId: "kitchen", parentId: "goldie", origin: { t: "cutting", d: ago(160) }, acquired: ago(160),
        waterEvery: 7, lastWatered: ago(30), created: ago(160), gifted: { to: "Neighbour across the hall", date: ago(30) },
        care: { light: "Anything from low to bright indirect", lightNeed: "low", toxic: TOXIC }, log: hist(30, 7, 3) },
    ];
    const props = [
      { id: "prop-goldie", parentId: "goldie", species: "Epipremnum aureum", taken: ago(16), qty: 3, method: "water", status: "rooting", statusSince: ago(16), spot: "Kitchen sill, in a jam jar" },
      { id: "prop-silver", parentId: "silver", species: "Scindapsus pictus", taken: ago(9), qty: 2, method: "water", status: "rooting", statusSince: ago(9), spot: "Bathroom shelf" },
      { id: "prop-charlotte", parentId: "charlotte", species: "Chlorophytum comosum", taken: ago(70), qty: 4, method: "soil", status: "for sale", statusSince: ago(10), price: "8", notes: "Babies, well rooted" },
      { id: "prop-jade", parentId: "jade", species: "Crassula ovata", taken: ago(110), qty: 1, method: "leaf", status: "established", statusSince: ago(40) },
    ];
    return { plants, rooms, props, checkins: [] };
  }

  /* ---------- storage ---------- */
  let DB, photos = {};
  const load = () => { try { const j = JSON.parse(localStorage.getItem(KEY) || "null"); if (j && j.plants) return j; } catch {} return null; };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch {} };
  DB = load() || seed(); save();
  try { photos = JSON.parse(localStorage.getItem(PHOTO_KEY) || "{}") || {}; } catch {}
  const subs = {}; // coll -> Set of callbacks
  const strip = (o) => { const { id, ...r } = o; return r; };
  const emit = (coll) => {
    const docs = (DB[coll] || []).map((d) => ({ id: d.id, data: () => JSON.parse(JSON.stringify(strip(d))) }));
    (subs[coll] || new Set()).forEach((cb) => setTimeout(() => cb({ docs }), 0));
  };
  function collection(coll) {
    DB[coll] = DB[coll] || [];
    const doc = (id) => ({
      id,
      async set(data) { const L = DB[coll], i = L.findIndex((d) => d.id === id), v = { ...JSON.parse(JSON.stringify(data)), id }; i < 0 ? L.push(v) : (L[i] = v); save(); emit(coll); },
      async update(patch) { const L = DB[coll], i = L.findIndex((d) => d.id === id); const v = { ...(i < 0 ? {} : L[i]), ...JSON.parse(JSON.stringify(patch)), id }; i < 0 ? L.push(v) : (L[i] = v); save(); emit(coll); },
      async delete() { DB[coll] = DB[coll].filter((d) => d.id !== id); save(); emit(coll); },
    });
    return {
      doc,
      async add(data) { const id = uid(); await doc(id).set(data); return doc(id); },
      onSnapshot(next) { (subs[coll] = subs[coll] || new Set()).add(next); emit(coll); return () => subs[coll].delete(next); },
    };
  }
  const toDataUrl = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
  async function small(blob) { // keep demo photos small so a few fit in browser storage
    try {
      const bmp = await createImageBitmap(blob); const k = Math.min(1, 720 / Math.max(bmp.width, bmp.height));
      const cv = document.createElement("canvas"); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
      cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
      return cv.toDataURL("image/jpeg", 0.78);
    } catch { return toDataUrl(blob); }
  }
  const assets = {
    async upload(blob) {
      const id = "demo-" + uid(); photos[id] = await small(blob);
      try { localStorage.setItem(PHOTO_KEY, JSON.stringify(photos)); } catch {} // too big: kept for this visit only
      return { id };
    },
    async delete(id) { delete photos[id]; try { localStorage.setItem(PHOTO_KEY, JSON.stringify(photos)); } catch {} },
  };
  window.__windowsillBlob = (id) => photos[id] || "";
  window.claude = {
    async use(name) {
      if (name === "db") return { collection };
      if (name === "assets") return assets;
      throw new Error("Unknown capability: " + name);
    },
  };
  window.windowsillDemo = {
    reset() { try { localStorage.removeItem(KEY); localStorage.removeItem(PHOTO_KEY); localStorage.removeItem("windowsill-demo-welcomed"); } catch {} location.reload(); },
  };
})();
