/* Pub-a-thon 2026 — Publication Voyage tracker */

const SHIP_STAGES = ["🌅", "⛵", "🚤", "🛥️", "🚢"]; // just-launched → near harbor
let DATA = null;

init();

async function init() {
  try {
    const res = await fetch("data/manuscripts.json", { cache: "no-store" });
    DATA = await res.json();
  } catch (err) {
    document.getElementById("fleet").innerHTML =
      `<p class="empty">Couldn't load the fleet manifest (data/manuscripts.json). ${err}</p>`;
    return;
  }

  const cfg = DATA.config || {};
  document.getElementById("tagline").textContent = cfg.tagline || "";
  if (cfg.guideUrl) document.getElementById("guideLink").href = cfg.guideUrl;

  renderLegend();
  renderDashboard();
  renderFleet();

  document.getElementById("sort").addEventListener("change", renderFleet);
  document.getElementById("search").addEventListener("input", renderFleet);

  // Celebrate if anyone reached harbor.
  if (DATA.manuscripts.some(m => pct(m) === 100)) {
    setTimeout(() => confettiBurst(), 900);
  }
}

/* ---------- helpers ---------- */
const sections = () => DATA.sections;

function pct(m) {
  const total = sections().length;
  const done = (m.sectionsComplete || []).length;
  return Math.round((done / total) * 100);
}

function nextSection(m) {
  return sections().find(s => !(m.sectionsComplete || []).includes(s.key)) || null;
}

function nextMeetingDate() {
  const cfg = DATA.config || {};
  const cadence = (cfg.cadenceDays || 14) * 86400000;
  let d = new Date((cfg.anchorMeeting || "2026-01-13") + "T00:00:00");
  const now = new Date();
  if (isNaN(d)) return null;
  while (d < now) d = new Date(d.getTime() + cadence);
  return d;
}

function fmtDate(d) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function nextMeetingLabel(dUntil) {
  const time = (DATA.config || {}).meetingTime;
  const when = dUntil == null ? "Next meeting" : dUntil === 0 ? "Next meeting · today!" : `Next meeting · ${dUntil}d`;
  return time ? `${when} · ${time}` : when;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return null;
  return Math.ceil((d - new Date()) / 86400000);
}

/* ---------- legend ---------- */
function renderLegend() {
  const el = document.getElementById("legend");
  el.innerHTML =
    `<div class="legend-title">⚓ The 8 Ports of Call — one per meeting</div>` +
    sections().map((s, i) =>
      `<span class="port-chip" title="${s.blurb}"><span class="n">${i + 1}</span>${s.emoji} ${s.label}</span>`
    ).join("");
}

/* ---------- dashboard ---------- */
function renderDashboard() {
  const ms = DATA.manuscripts;
  const total = ms.length;
  const avg = Math.round(ms.reduce((a, m) => a + pct(m), 0) / Math.max(total, 1));
  const harbored = ms.filter(m => m.status === "Accepted").length;
  const meeting = nextMeetingDate();
  const dUntil = meeting ? Math.max(0, Math.ceil((meeting - new Date()) / 86400000)) : null;

  const stats = [
    { num: total, lbl: "Manuscripts afloat" },
    { num: avg + "%", lbl: "Avg. voyage" },
    { num: harbored, lbl: "In harbor 🏆" },
    { num: meeting ? fmtDate(meeting) : "—", lbl: nextMeetingLabel(dUntil) },
  ];

  document.getElementById("dashboard").innerHTML = stats.map(s =>
    `<div class="stat"><div class="num">${s.num}</div><div class="lbl">${s.lbl}</div></div>`
  ).join("");
}

/* ---------- fleet ---------- */
function renderFleet() {
  const sortBy = document.getElementById("sort").value;
  const q = document.getElementById("search").value.trim().toLowerCase();
  let list = [...DATA.manuscripts];

  if (q) list = list.filter(m =>
    (m.title || "").toLowerCase().includes(q) ||
    (m.authors || "").toLowerCase().includes(q) ||
    (m.status || "").toLowerCase().includes(q)
  );

  const urg = m => (m.urgency === "High" ? 2 : m.urgency ? 1 : 0);
  list.sort((a, b) => {
    switch (sortBy) {
      case "progress-asc": return pct(a) - pct(b);
      case "urgency": return urg(b) - urg(a) || pct(b) - pct(a);
      case "title": return (a.title || "").localeCompare(b.title || "");
      default: return pct(b) - pct(a);
    }
  });

  const el = document.getElementById("fleet");
  if (!list.length) {
    el.innerHTML = `<p class="empty">No manuscripts match “${q}”. 🧭</p>`;
    return;
  }
  el.innerHTML = list.map(card).join("");

  // animate fills after paint
  requestAnimationFrame(() => {
    document.querySelectorAll(".voyage-fill").forEach(f => f.style.width = f.dataset.pct + "%");
    document.querySelectorAll(".voyage-boat").forEach(b => b.style.left = b.dataset.pos + "%");
  });
}

function card(m) {
  const p = pct(m);
  const done = m.sectionsComplete || [];
  const next = nextSection(m);
  const ship = SHIP_STAGES[Math.min(SHIP_STAGES.length - 1, Math.floor(p / 25))];
  const cls = m.status === "Accepted" ? "done" : m.status === "Idea Stage" ? "idea" : "";
  const statusKey = "status-" + (m.status || "").replace(/\s+/g, ".");

  const portDots = sections().map((s, i) =>
    `<span style="left:${((i + 1) / sections().length) * 100}%"></span>`).join("");

  const secChips = sections().map(s => {
    const isDone = done.includes(s.key);
    const isNext = next && next.key === s.key;
    return `<span class="sec ${isDone ? "done" : ""} ${isNext ? "next" : ""}" title="${s.blurb}">${s.emoji} ${s.label}${isDone ? " ✓" : ""}</span>`;
  }).join("");

  const dleft = daysUntil(m.targetDate);
  const targetHtml = m.targetDate
    ? `<span class="target ${dleft != null && dleft <= 30 ? "soon" : ""}">🎯 ${m.targetDate}${dleft != null ? ` · ${dleft < 0 ? Math.abs(dleft) + "d overdue" : dleft + "d left"}` : ""}</span>`
    : `<span class="target">no target date</span>`;

  const links = [];
  if (m.link) links.push(`<a href="${m.link}" target="_blank" rel="noopener">📄 Draft</a>`);
  if (m.repo) links.push(`<a href="${m.repo}" target="_blank" rel="noopener">💻 Repo</a>`);

  const nextLine = m.status === "Accepted"
    ? `🏆 <b>Reached the harbor — accepted!</b> Pop the bubbly. 🍾`
    : next
      ? `Next port: <b>${next.emoji} ${next.label}</b> — ${next.blurb}`
      : `All sections drafted — time for the <b>final polish</b>. ✨`;

  const badges = [`<span class="badge ${statusKey}">${m.status || "—"}</span>`];
  if (m.urgency === "High") badges.push(`<span class="badge urgency">🔥 ${m.urgency}</span>`);

  return `
  <article class="card ${cls}">
    <div class="card-head">
      <div>
        <h3>${m.title}</h3>
        <p class="authors">${m.authors ? "✍️ " + m.authors : "✍️ authors TBD"}</p>
      </div>
      <div class="badges">${badges.join("")}</div>
    </div>

    <div class="voyage">
      <div class="voyage-track">
        <div class="voyage-ports">${portDots}</div>
        <div class="voyage-fill" data-pct="${p}"></div>
        <div class="voyage-boat" data-pos="${p}">${ship}</div>
        <div class="voyage-harbor">${p === 100 ? "🏝️" : "⚓"}</div>
      </div>
      <div class="voyage-meta">
        <span class="pct">${p}% of the voyage</span>
        ${targetHtml}
      </div>
    </div>

    <div class="next-line">${nextLine}</div>
    <div class="sections">${secChips}</div>

    ${links.length ? `<div class="card-links">${links.join("")}</div>` : ""}
  </article>`;
}

/* ---------- confetti (lightweight, no deps) ---------- */
function confettiBurst() {
  const c = document.getElementById("confetti");
  const ctx = c.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const colors = ["#ffd166", "#ff6b6b", "#2a9d8f", "#1b6f8c", "#cdeef2"];
  const bits = Array.from({ length: 140 }, () => ({
    x: Math.random() * innerWidth,
    y: -20 - Math.random() * innerHeight * 0.3,
    r: 4 + Math.random() * 6,
    c: colors[(Math.random() * colors.length) | 0],
    vy: 2 + Math.random() * 3,
    vx: -1.5 + Math.random() * 3,
    rot: Math.random() * Math.PI,
    vr: -0.2 + Math.random() * 0.4,
  }));
  let frames = 0;
  (function loop() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    bits.forEach(b => {
      b.x += b.vx; b.y += b.vy; b.rot += b.vr;
      ctx.save();
      ctx.translate(b.x, b.y); ctx.rotate(b.rot);
      ctx.fillStyle = b.c;
      ctx.fillRect(-b.r / 2, -b.r / 2, b.r, b.r * 0.6);
      ctx.restore();
    });
    if (frames++ < 220) requestAnimationFrame(loop);
    else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })();
}
