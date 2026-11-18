// Full-screen layers: the 3D viewer (#3d) and the photo gallery (#photos).
// Each is a <dialog class="fs">. Opening adds a history entry, so the phone's Back button,
// Esc and ✕ all close it. With the View Transitions API the change is animated.
(() => {
  const here = document.currentScript.src;
  const root = document.documentElement;
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Run fn as one animated change of the page (or just run it, on older browsers).
  window.fsTransition = (fn) => {
    if (!document.startViewTransition || reduce()) { fn(); return Promise.resolve(); }
    const vt = document.startViewTransition(fn);
    vt.ready.catch(() => {}); // a quick second click skips the first animation: not an error
    return vt.finished.catch(() => {});
  };

  // hooks: before / show / after (opening), beforeHide / hide / afterHide (closing).
  window.fsLayer = (dlg, hash, h = {}) => {
    let on = false;
    const call = (k, ...a) => h[k]?.(...a);
    const open = (...a) => {
      if (on) return;
      on = true;
      call("before", ...a);
      fsTransition(() => { dlg.showModal(); root.classList.add("fs-open"); call("show", ...a); }).then(() => call("after"));
      if (location.hash !== hash) history.pushState({ fs: hash }, "", hash);
    };
    const shut = (animate = true) => {
      if (!on) return;
      on = false;
      call("beforeHide");
      const run = () => { call("hide"); if (dlg.open) dlg.close(); root.classList.remove("fs-open"); };
      (animate ? fsTransition(run) : (run(), Promise.resolve())).then(() => call("afterHide"));
    };
    // ✕ / Esc / click on the dark edge: go Back, so the history entry goes too.
    const close = () => {
      if (history.state?.fs === hash) history.back();
      else { shut(); history.replaceState(null, "", location.pathname + location.search); }
    };
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); close(); });
    dlg.addEventListener("close", () => { if (on) { shut(false); if (history.state?.fs === hash) history.back(); } });
    dlg.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
    addEventListener("popstate", () => { if (location.hash === hash) open(); else shut(); });
    // A shared link with #3d or #photos opens the layer, and Back then stays on this page.
    if (location.hash === hash) { history.replaceState(null, "", location.pathname + location.search); requestAnimationFrame(() => open()); }
    return { open, close };
  };

  // 3D viewer: <dialog class="fs fs-3d" data-model="..."> with a <canvas>. Any [data-open-3d] opens it.
  const dlg = document.querySelector("dialog.fs-3d");
  if (!dlg) return;
  // Every opening gets a new <canvas>: closing frees the old one's WebGL context for good,
  // so drawing on it again would show an empty screen.
  let run = 0, dispose = () => {}, old = () => {};
  const layer = fsLayer(dlg, "#3d", {
    show() {
      const id = ++run;
      const canvas = document.createElement("canvas");
      dlg.querySelector("canvas").replaceWith(canvas);
      import(new URL("model3d.js", here).href).then(({ mountModel }) => {
        if (id === run) dispose = mountModel(canvas, dlg.dataset.model, { full: true });
      });
    },
    beforeHide() { run++; old = dispose; dispose = () => {}; },
    afterHide() { old(); old = () => {}; },
  });
  window.open3d = layer.open;
  document.addEventListener("click", (e) => { if (e.target.closest("[data-open-3d]")) layer.open(); });
})();
