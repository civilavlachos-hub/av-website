(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (i) => String(i + 1).padStart(2, "0");

  // Services
  $("#serviceList").innerHTML = SERVICES.map((s, i) => `
    <li class="svc reveal" tabindex="0">
      <h3><span class="num">${pad(i)}</span>${esc(s.title)}</h3>
      <div><p>${esc(s.text)}</p></div>
    </li>`).join("");

  // Filters
  // Κείμενα στη γλώσσα της σελίδας: window.T (src/i18n.ts). Το πρώτο φίλτρο («Όλα») έχει data-cat="*".
  const cats = [["*", T.all], ...CATEGORIES.map((c) => [c, c])];
  $("#filters").innerHTML = cats.map(([v, c], i) =>
    `<button class="chip" type="button" aria-pressed="${i === 0}" data-cat="${esc(v)}">${esc(c)}</button>`).join("");

  // Projects: each card is a link to the project's own page.
  // Old links with #project-<id> (from the earlier pop-up window) go to that page.
  const old = location.hash.match(/^#project-(.+)$/);
  if (old) {
    let id = null;
    try { id = decodeURIComponent(old[1]); } catch { /* malformed hash */ }
    const p = PROJECTS.find((x) => x.id === id);
    if (p) { location.replace(p.href); return; }
  }
  const statusClass = (p) => (p.live ? "status live" : "status");
  // Μόνο τα στοιχεία που υπάρχουν: κενό έτος ή κατάσταση δεν φαίνεται.
  const meta = (...xs) => xs.filter(Boolean).map(esc).join(" · ");
  $("#projectGrid").innerHTML = PROJECTS.map((p) => `
    <a class="card reveal${p.wide ? " wide" : ""}" href="${esc(p.href)}" data-cats="${esc(p.categories.join("|"))}">
      <div class="img">
        <img src="${esc(p.cover)}" alt="${esc(p.title)}" loading="lazy">
        ${p.status ? `<span class="${statusClass(p)}">${esc(p.status)}</span>` : ""}
        ${p.model ? `<span class="badge-3d" title="${esc(T.hasModel)}" aria-label="${esc(T.hasModel)}">3D</span>` : ""}
      </div>
      <h3>${esc(p.title)}</h3>
      <p class="label meta">${meta(p.place, p.year, p.categories.join(" / "))}</p>
    </a>`).join("");

  $("#filters").addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    document.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c === b));
    const cat = b.dataset.cat;
    document.querySelectorAll(".card").forEach((card) => {
      const show = cat === "*" || card.dataset.cats.split("|").includes(cat);
      card.classList.toggle("hide", !show);
      if (show) card.classList.add("in");
    });
  });

  // Page change animation (View Transitions): the card photo grows into the project's big photo,
  // and back again. Only the card being opened (or returned to) gets the shared name.
  const cardFor = (url) => {
    if (!url) return null;
    const path = new URL(url).pathname;
    return [...document.querySelectorAll(".card")].find((c) => new URL(c.href).pathname === path);
  };
  const tag = (card) => {
    document.querySelectorAll(".card .img").forEach((el) => { el.style.viewTransitionName = ""; });
    if (card) card.querySelector(".img").style.viewTransitionName = "project-photo";
  };
  addEventListener("pageswap", (e) => { if (e.viewTransition) tag(cardFor(e.activation?.entry?.url)); });
  addEventListener("pagereveal", (e) => {
    if (!e.viewTransition) return;
    const card = cardFor(window.navigation?.activation?.from?.url);
    if (!card) return;
    card.classList.add("in", "now"); // no fade-in: the photo is arriving from the project page
    tag(card);
    e.viewTransition.finished.finally(() => { tag(null); card.classList.remove("now"); });
  });

  // Process
  const steps = $("#steps"); // missing when the section is hidden from the CMS
  if (steps) steps.innerHTML = STEPS.map((s, i) => `
    <li class="reveal" style="transition-delay:${i * 80}ms">
      <span class="label">${pad(i)}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>
      <span class="label dur">${esc(s.dur)}</span>
    </li>`).join("");

  // Nav background on scroll
  const nav = $(".nav");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile menu
  const menuBtn = $("#menuBtn");
  const setMenu = (open) => { nav.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", open); };
  menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  // Reveal
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      io.unobserve(en.target);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
})();
