/* ============================================================
   THORNLIGHT — app.js  (full, cross-device)
   ============================================================ */

let BOOKS = [], XP = 0, READ = {}, BADGES = [], UNLOCKS = [];
let curTab = 1, curBook = null, curPage = 0, pages = [];
let fontSizePx = 19, moodOn = true;
let welcomeTaps = 0, tapTimer = null;
let marks = [];
let selText = "", selSpot = "";

const LEVELS = [0,50,150,350,700,1200,2000,3200,5000];
const UNLOCK_TABLE = [
  {id:"u1", need:1, label:"black rose vine"},
  {id:"u2", need:2, label:"slasher mood"},
  {id:"u3", need:3, label:"blood page glow"},
  {id:"u4", need:4, label:"secret quote"},
  {id:"u5", need:5, label:"the mask light everywhere"},
  {id:"u6", need:6, label:"a poem from him"},
  {id:"u7", need:8, label:"hidden chapter"},
  {id:"u8", need:10, label:"everything"}
];
const MOODS = {
  horror:  {bg:"#050505", mask:true},
  slasher: {bg:"#070606", mask:true},
  gothic:  {bg:"#0a0808", mask:false},
  romance: {bg:"#0d0a0a", mask:false},
  spicy:   {bg:"#0d0606", mask:false},
  mystery: {bg:"#060708", mask:false},
  thriller:{bg:"#080607", mask:false},
  default: {bg:"#0a0a0a", mask:false}
};

/* ---------- helpers ---------- */
function esc(s){
  return String(s||"").split("").map(function(c){
    return "\\^$.*+?()[]{}|".indexOf(c) > -1 ? "\\" + c : c;
  }).join("");
}
function escHTML(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;"); }

/* ---------- boot ---------- */
async function boot(){
  try {
    BOOKS = await sbGet("books", "order=published_at.desc");
    XP = await getState("xp", 0);
    READ = await getState("read", {});
    BADGES = await getState("badges", []);
    UNLOCKS = await getState("unlocks", []);
  } catch(e){ console.error("boot", e); }
  renderHome(); renderLib(); renderGarden();
}

/* ---------- splash / pin ---------- */
document.getElementById("welcome").onclick = () => {
  welcomeTaps++; clearTimeout(tapTimer);
  tapTimer = setTimeout(() => welcomeTaps = 0, 900);
  if (welcomeTaps >= 5){ welcomeTaps = 0; openPin(); }
};
function openPin(){
  document.getElementById("pin").classList.remove("hidden");
  const inp = document.getElementById("pin-input");
  inp.value = ""; inp.focus();
}
document.getElementById("pin-input").oninput = e => {
  if (e.target.value.length === 4){
    if (e.target.value === "2336") enterAuthor();
    else {
      const box = document.querySelector(".pin-box");
      box.classList.add("shake");
      document.getElementById("pin-msg").textContent = "welcome aden";
      setTimeout(() => {
        box.classList.remove("shake");
        document.getElementById("pin").classList.add("hidden");
        document.getElementById("pin-msg").textContent = "";
      }, 1100);
    }
  }
};

/* ---------- nav ---------- */
const tabsEl = document.getElementById("tabs");
document.querySelectorAll(".nav button").forEach(b => b.onclick = () => go(+b.dataset.i));
function go(i){
  curTab = i;
  tabsEl.style.transform = `translateX(-${i*33.3333}%)`;
  document.querySelectorAll(".nav button").forEach(b => b.classList.toggle("on", +b.dataset.i === i));
}

/* ---------- home ---------- */
function renderHome(){
  const el = document.getElementById("tab-home");
  const resume = Object.entries(READ).sort((a,b)=>b[1].t-a[1].t)[0];
  const rec = BOOKS.filter(b => !READ[b.id]).slice(0,3);
  let html = `<h1 class="page-title">Home</h1>`;
  if (resume){
    const b = BOOKS.find(x => x.id === resume[0]);
    if (b) html += `<h2 class="sec">pick up where you left off</h2>` + cardHTML(b);
  }
  html += `<h2 class="sec">recommended</h2>` + (rec.length ? rec.map(cardHTML).join("") : `<p class="empty">nothing new yet…</p>`);
  el.innerHTML = html;
}
function cardHTML(b){
  return `<div class="card" onclick="openBook('${b.id}')"><div class="t">${escHTML(b.title)}</div><div class="g">${(b.tags||[]).join(" · ")}</div></div>`;
}

/* ---------- library ---------- */
function renderLib(){
  const el = document.getElementById("tab-lib");
  el.innerHTML = `<h1 class="page-title">Library</h1>
    <input class="f" id="lib-search" placeholder="search…" oninput="renderLibList()">
    <div id="lib-chips"></div><div id="lib-list"></div>`;
  const tags = [...new Set(BOOKS.flatMap(b => b.tags||[]))];
  document.getElementById("lib-chips").innerHTML = tags.map(t => `<span class="chip" onclick="filterTag('${t}',this)">${t}</span>`).join("");
  renderLibList();
}
let libFilter = null;
function filterTag(t, el){
  libFilter = libFilter === t ? null : t;
  document.querySelectorAll("#lib-chips .chip").forEach(c => c.classList.remove("on"));
  if (libFilter) el.classList.add("on");
  renderLibList();
}
function renderLibList(){
  const q = (document.getElementById("lib-search").value || "").toLowerCase();
  let list = BOOKS;
  if (libFilter) list = list.filter(b => (b.tags||[]).includes(libFilter));
  if (q) list = list.filter(b => b.title.toLowerCase().includes(q));
  document.getElementById("lib-list").innerHTML = list.length ? list.map(cardHTML).join("") : `<p class="empty">no books found</p>`;
}

/* ---------- garden ---------- */
function level(){ let l=0; for(let i=0;i<LEVELS.length;i++) if(XP>=LEVELS[i]) l=i; return l; }
function nextAt(){ return LEVELS[Math.min(level()+1, LEVELS.length-1)] || 1; }
function renderGarden(){
  const el = document.getElementById("tab-progress");
  const lv = level(), pct = Math.min(100, (XP/nextAt())*100);
  let roses = "";
  for (let i=0;i<lv;i++){
    const side = i%2 ? "62%" : "38%";
    roses += `<span class="rose on" style="bottom:${20+i*36}px;left:${side}">🌹</span>`;
  }
  const finished = Object.keys(READ).length;
  el.innerHTML = `<h1 class="page-title">Garden</h1>
    <div class="garden">
      <div class="vine"><div class="stalk" style="height:${Math.min(340, 40+lv*36)}px"></div>${roses}</div>
      <div class="cat">🐈‍⬛</div>
      <p class="stat">level ${lv} · ${XP} xp</p>
      <div class="xpbar"><i style="width:${pct}%"></i></div>
      <h2 class="sec">badges</h2>
      <div>${BOOKS.map(b => `<span class="badge ${BADGES.includes('fin-'+b.id)?'got':''}">👻</span>`).join("")}</div>
      <h2 class="sec">unlocks</h2>
      <div>${UNLOCK_TABLE.map(u => `<p class="stat" style="${finished>=u.need?'color:var(--blood)':'opacity:.4'}">${finished>=u.need?'✦':'✧'} ${u.label}${finished>=u.need?'':' — read '+u.need+' books'}</p>`).join("")}</div>
    </div>`;
}

/* ---------- reader ---------- */
async function openBook(id){
  curBook = BOOKS.find(b => b.id === id);
  if (!curBook) return;
  pages = paginate(curBook.content);
  curPage = (READ[id] && READ[id].page) || 0;
  if (curPage >= pages.length) curPage = 0;
  try {
    marks = await sbGet("events", `book_id=eq.${id}&type=in.(highlight,underline)&order=created_at.asc`);
  } catch(e){ marks = []; }
  if (!Array.isArray(marks)) marks = [];
  document.getElementById("reader").classList.remove("hidden");
  applyMood(); renderPage();
}
function paginate(text){
  const chunks = String(text||"").split(/\n\s*\n/).filter(s => s.trim());
  const out = []; let buf = "";
  chunks.forEach(c => {
    if ((buf + c).length > 900){ out.push(buf.trim()); buf = c + "\n\n"; }
    else buf += c + "\n\n";
  });
  if (buf.trim()) out.push(buf.trim());
  return out.length ? out : [String(text||"")];
}
function renderPage(){
  const p = document.getElementById("page");
  if (!p || !pages.length) return;
  p.style.fontSize = fontSizePx + "px";
  let html = escHTML(pages[curPage] || "");
  marks.filter(m => m && m.target === String(curPage) && m.value).forEach(m => {
    const tag = m.type === "highlight" ? `<mark class="hl">$1</mark>` : `<span class="ul">$1</span>`;
    try { html = html.replace(new RegExp("(" + esc(m.value) + ")"), tag); } catch(e){}
  });
  p.innerHTML = html;
  p.scrollTop = 0;
  document.getElementById("prog").style.width = ((curPage+1)/pages.length*100) + "%";
  if (curBook){
    READ[curBook.id] = { page: curPage, t: Date.now() };
    setState("read", READ);
    addXP(2);
  }
}
function nextPage(){ if (curPage < pages.length-1){ curPage++; turnPage(); } }
function prevPage(){ if (curPage > 0){ curPage--; turnPage(); } }
function turnPage(){
  const p = document.getElementById("page");
  p.classList.add("turn");
  setTimeout(() => { renderPage(); p.classList.remove("turn"); }, 220);
}
document.getElementById("page-wrap").addEventListener("click", e => {
  if (e.target.closest(".reader-tools") || e.target.closest(".sheet")) return;
  if (window.getSelection().toString().trim().length > 1) return;
  const x = e.clientX, w = window.innerWidth;
  if (x > w*0.6) nextPage(); else if (x < w*0.4) prevPage();
});
function closeReader(){
  document.getElementById("reader").classList.add("hidden");
  if (curBook && curPage >= pages.length-1) finishBook(curBook.id);
  renderHome();
}
function finishBook(id){
  if (!BADGES.includes('fin-'+id)){ BADGES.push('fin-'+id); setState("badges", BADGES); addXP(30); }
}
function fontSize(d){ fontSizePx = Math.max(15, Math.min(26, fontSizePx + d*2)); renderPage(); }
function toggleMood(){ moodOn = !moodOn; applyMood(); }
function applyMood(){
  if (!curBook) return;
  const tag = (curBook.tags||[])[0] || "default";
  const m = MOODS[tag] || MOODS.default;
  document.getElementById("reader").style.background = moodOn ? m.bg : "#0a0a0a";
  const mask = document.getElementById("mask");
  if (moodOn && m.mask){ mask.classList.remove("hidden"); mask.style.left = "50%"; mask.style.top = "50%"; }
  else mask.classList.add("hidden");
}
let dragging = false;
const maskEl = document.getElementById("mask");
maskEl.addEventListener("pointerdown", () => dragging = true);
document.addEventListener("pointerup", () => dragging = false);
document.addEventListener("pointermove", e => {
  if (!dragging) return;
  maskEl.style.left = e.clientX + "px"; maskEl.style.top = e.clientY + "px";
});

/* ---------- selection → mark ---------- */
document.getElementById("page").addEventListener("mouseup", captureSel);
document.getElementById("page").addEventListener("touchend", captureSel);
function captureSel(){
  const s = window.getSelection();
  const t = s.toString().trim();
  if (t.length > 1){ selText = t; selSpot = String(curPage); }
}
function openMarks(){
  if (!selText){ alert("select some text first"); return; }
  const sheet = document.getElementById("sheet");
  sheet.classList.remove("hidden");
  sheet.innerHTML = `<h3>mark</h3>
    <p style="font-style:italic;color:var(--bone-dim);margin-bottom:12px">"${escHTML(selText)}"</p>
    <button class="btn" onclick="addMark('highlight')">highlight</button>
    <button class="btn" onclick="addMark('underline')">underline</button>
    <button class="btn" style="background:#3a0d0d" onclick="eraseAll()">erase all marks</button>
    <button class="btn" style="background:#1a1414" onclick="closeSheet()">close</button>`;
}
async function addMark(type){
  if (!curBook) return;
  await sbPost("events", { book_id: curBook.id, type, target: selSpot, value: selText, spot: selSpot });
  marks = await sbGet("events", `book_id=eq.${curBook.id}&type=in.(highlight,underline)&order=created_at.asc`);
  if (!Array.isArray(marks)) marks = [];
  closeSheet(); renderPage();
}
async function eraseAll(){
  for (const m of marks) await sbPatch("events", `id=eq.${m.id}`, { deleted: true, deleted_at: new Date().toISOString() });
  marks = []; closeSheet(); renderPage();
}
function closeSheet(){ document.getElementById("sheet").classList.add("hidden"); }

/* ---------- review ---------- */
function openReview(){
  const sheet = document.getElementById("sheet");
  sheet.classList.remove("hidden");
  sheet.innerHTML = `<h3>review</h3>
    <div class="stars" id="stars">☆☆☆☆☆</div>
    <textarea id="rev-text" placeholder="say something…"></textarea>
    <button class="btn" onclick="saveReview()">save</button>
    <button class="btn" style="background:#1a1414" onclick="closeSheet()">close</button>`;
  document.getElementById("stars").onclick = e => {
    const r = e.target.getBoundingClientRect();
    const star = Math.ceil((e.clientX - r.left) / (r.width/5));
    document.getElementById("stars").textContent = "★".repeat(star) + "☆".repeat(5-star);
  };
}
async function saveReview(){
  if (!curBook) return;
  const text = document.getElementById("rev-text").value.trim();
  const stars = (document.getElementById("stars").textContent.match(/★/g)||[]).length;
  await sbPost("events", { book_id: curBook.id, type: "review", value: text, spot: String(stars) });
  addXP(10); closeSheet();
}

function addXP(n){ XP += n; setState("xp", XP); if (curTab === 0) renderGarden(); }

/* ---------- author ---------- */
function enterAuthor(){
  document.getElementById("pin").classList.add("hidden");
  document.getElementById("author").classList.remove("hidden");
  renderAuthor("lib");
}
function exitAuthor(){ document.getElementById("author").classList.add("hidden"); }
document.querySelectorAll(".author-tabs button").forEach(b => b.onclick = () => {
  document.querySelectorAll(".author-tabs button").forEach(x => x.classList.remove("on"));
  b.classList.add("on"); renderAuthor(b.dataset.a);
});
function renderAuthor(view){
  const el = document.getElementById("author-body");
  if (view === "lib"){
    el.innerHTML = `<button class="btn" onclick="newBook()">+ new book</button>
      <h2 class="sec">published</h2>` +
      BOOKS.map(b => `<div class="card" onclick="editBook('${b.id}')"><div class="t">${escHTML(b.title)}</div><div class="g">${(b.tags||[]).join(" · ")}</div></div>`).join("");
  }
  if (view === "insights"){
    const opened = Object.keys(READ).length;
    const genreCount = {};
    BOOKS.forEach(b => (b.tags||[]).forEach(t => genreCount[t] = (genreCount[t]||0)+1));
    el.innerHTML = `<h2 class="sec">reading</h2>
      <p class="stat">books opened: ${opened}</p>
      <p class="stat">total xp: ${XP}</p>
      <h2 class="sec">genres</h2>
      ${Object.entries(genreCount).map(([g,c]) => `<p class="stat">${g}: ${c}</p>`).join("")}`;
  }
  if (view === "comments") loadComments();
}
async function loadComments(){
  const el = document.getElementById("author-body");
  let evs = [];
  try { evs = await sbGet("events", "type=in.(comment,review)&order=created_at.desc"); } catch(e){}
  if (!Array.isArray(evs)) evs = [];
  const grouped = {};
  evs.forEach(e => { const k = (e.book_id||"")+"|"+(e.spot||""); (grouped[k] = grouped[k]||[]).push(e); });
  el.innerHTML = `<h2 class="sec">her words</h2>` + (evs.length ? evs.map(e => {
    const same = grouped[(e.book_id||"")+"|"+(e.spot||"")];
    const num = same.length > 1 ? ` #${same.indexOf(e)+1}` : "";
    return `<div class="comment">
      <div class="meta">${e.type}${num} · ${new Date(e.created_at).toLocaleString()}</div>
      <div>${escHTML(e.value||"")}</div>
      ${e.deleted ? `<div class="del">she deleted this · ${new Date(e.deleted_at).toLocaleString()}</div>` : ""}
    </div>`;
  }).join("") : `<p class="empty">nothing yet…</p>`);
}

function newBook(){
  document.getElementById("author-body").innerHTML = `
    <input class="f" id="nb-title" placeholder="title">
    <div id="nb-tags">${Object.keys(MOODS).filter(m=>m!=="default").map(t => `<span class="chip" onclick="this.classList.toggle('on')">${t}</span>`).join("")}</div>
    <textarea id="nb-content" placeholder="paste your story…"></textarea>
    <button class="btn" onclick="publish()">publish</button>`;
}
async function publish(){
  const title = document.getElementById("nb-title").value.trim();
  const content = document.getElementById("nb-content").value.trim();
  const tags = [...document.querySelectorAll("#nb-tags .chip.on")].map(c => c.textContent);
  if (!title || !content) return;
  await sbPost("books", { title, content, tags });
  BOOKS = await sbGet("books", "order=published_at.desc");
  renderHome(); renderLib(); renderGarden(); renderAuthor("lib");
}
function editBook(id){
  const b = BOOKS.find(x => x.id === id);
  document.getElementById("author-body").innerHTML = `
    <input class="f" id="nb-title" value="${escHTML(b.title)}">
    <div id="nb-tags">${Object.keys(MOODS).filter(m=>m!=="default").map(t => `<span class="chip ${(b.tags||[]).includes(t)?'on':''}" onclick="this.classList.toggle('on')">${t}</span>`).join("")}</div>
    <textarea id="nb-content">${escHTML(b.content)}</textarea>
    <button class="btn" onclick="saveBook('${id}')">save</button>
    <button class="btn" style="background:#3a0d0d" onclick="deleteBook('${id}')">delete</button>`;
}
async function saveBook(id){
  const title = document.getElementById("nb-title").value.trim();
  const content = document.getElementById("nb-content").value.trim();
  const tags = [...document.querySelectorAll("#nb-tags .chip.on")].map(c => c.textContent);
  await sbPatch("books", `id=eq.${id}`, { title, content, tags });
  BOOKS = await sbGet("books", "order=published_at.desc");
  renderHome(); renderLib(); renderGarden(); renderAuthor("lib");
}
async function deleteBook(id){
  await sbDelete("books", `id=eq.${id}`);
  BOOKS = await sbGet("books", "order=published_at.desc");
  renderHome(); renderLib(); renderGarden(); renderAuthor("lib");
}

/* ---------- init ---------- */
setTimeout(() => {
  document.getElementById("splash").style.opacity = "0";
  setTimeout(() => {
    document.getElementById("splash").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    go(1); boot();
  }, 800);
}, 2200);
