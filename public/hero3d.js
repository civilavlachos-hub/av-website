// Home hero: the house model builds itself, then turns slowly. Drag to orbit.
// A short click or tap (not a drag) opens the same model in the full-screen viewer (fs.js).
const canvas = document.getElementById("hero3d");

// Listeners first, so a click works even while three.js is still loading.
// e.timeStamp = when the input happened, not when a busy main thread got to it.
let down = null;
canvas.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY, t: e.timeStamp }; });
canvas.addEventListener("pointermove", (e) => { if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) >= 6) down = null; });
canvas.addEventListener("pointercancel", () => { down = null; });
canvas.addEventListener("pointerup", (e) => {
  const click = down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6 && e.timeStamp - down.t < 800;
  down = null;
  if (click) window.open3d?.();
});

import("./model3d.js").then(({ mountModel }) => {
  mountModel(canvas, canvas.dataset.model, { hero: true });
});
