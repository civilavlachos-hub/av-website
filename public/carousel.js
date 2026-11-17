// Project page photos: the slider at the top, and the same photos full screen (fs.js, #photos).
// Slider = CSS scroll-snap (native swipe) + arrows + arrow keys.
(() => {
  const motion = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

  // media: element with .slides (and optional .prev/.next). onChange(i) after each move.
  const slider = (media, onChange = () => {}) => {
    const track = media.querySelector(".slides");
    const prev = media.querySelector(".prev"), next = media.querySelector(".next");
    const n = track.children.length;
    const index = () => Math.round(track.scrollLeft / (track.clientWidth || 1));
    const go = (i, instant) => track.scrollTo({ left: Math.max(0, Math.min(n - 1, i)) * track.clientWidth, behavior: instant ? "instant" : motion() });
    const sync = () => {
      const i = index();
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === n - 1;
      onChange(i);
    };
    let raf = 0;
    track.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(sync); });
    prev?.addEventListener("click", () => go(index() - 1));
    next?.addEventListener("click", () => go(index() + 1));
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(index() - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(index() + 1); }
    });
    sync();
    return { go, index, sync, slide: (i) => track.children[i], track };
  };

  window.mountProjectPhotos = () => {
    const heroMedia = document.querySelector(".hero-media");
    const dlg = document.querySelector("dialog.fs-photos");
    if (!heroMedia || !dlg) return;
    const total = heroMedia.querySelector(".slides").children.length;
    const count = (el, i) => { el.textContent = `${i + 1} / ${total}`; };
    const heroCount = heroMedia.querySelector(".count");
    const thumbs = [...document.querySelectorAll(".gallery [data-photo]")];
    const hero = slider(heroMedia, (i) => {
      count(heroCount, i);
      thumbs.forEach((b, j) => b.setAttribute("aria-pressed", j === i));
    });
    const big = slider(dlg.querySelector(".media"), (i) => count(dlg.querySelector(".count"), i));

    // The photo you clicked grows to full screen, and shrinks back to where the slider is.
    const NAME = "photo-zoom";
    const name = (el, on) => { if (el) el.style.viewTransitionName = on ? NAME : ""; };
    let at = 0;
    const layer = fsLayer(dlg, "#photos", {
      before(i = hero.index()) { at = i; name(hero.slide(at), true); },
      show() {
        name(hero.slide(at), false);
        big.go(at, true);
        big.sync();
        name(big.slide(at), true);
        big.track.focus({ preventScroll: true });
      },
      after() { name(big.slide(at), false); },
      beforeHide() { at = big.index(); name(big.slide(at), true); },
      hide() {
        name(big.slide(at), false);
        hero.go(at, true);
        name(hero.slide(at), true);
      },
      afterHide() { name(hero.slide(at), false); },
    });

    hero.track.addEventListener("click", (e) => { if (e.target.closest(".slide")) layer.open(hero.index()); });
    heroMedia.querySelector("[data-open-photos]").addEventListener("click", () => layer.open(hero.index()));
    thumbs.forEach((b) => b.addEventListener("click", () => layer.open(+b.dataset.photo)));
    // A tap on the dark space around a photo closes the gallery.
    dlg.addEventListener("click", (e) => { if (e.target.classList.contains("slides") || e.target === dlg) layer.close(); });
  };
})();
