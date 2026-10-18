// Wedding starts 27 January 2027, midnight IST
const WEDDING = new Date("2027-01-27T00:00:00+05:30");
// Drop an mp3 into invite4/ and set its name here to show the music button
const MUSIC_SRC = "";

const $ = (id) => document.getElementById(id);
const root = document.documentElement;
const SVG_NS = "http://www.w3.org/2000/svg";
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// seeded random so every guest sees the same artwork
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const mixColor = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
const rgb = (c, a = 1) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;

/* ───────── Textures ───────── */

function makeGrain() {
  const c = document.createElement("canvas");
  c.width = c.height = 160;
  const g = c.getContext("2d");
  const img = g.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 90 + Math.random() * 165;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  root.style.setProperty("--grain", `url(${c.toDataURL()})`);
}

// scalloped lace edge of the medallion
function buildSeal() {
  const scallops = $("seal-scallops");
  const lace = $("seal-lace");
  const add = (parent, tag, attrs) => {
    const el = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    parent.appendChild(el);
  };

  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    add(scallops, "circle", {
      cx: 80 + Math.cos(a) * 62, cy: 80 + Math.sin(a) * 62, r: 7.4,
      fill: "url(#m-scallop)", stroke: "url(#m-gold)", "stroke-width": 0.6,
    });
  }
  add(scallops, "circle", { cx: 80, cy: 80, r: 63, fill: "url(#m-scallop)" });

  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    add(lace, "circle", { cx: 80 + Math.cos(a) * 51.5, cy: 80 + Math.sin(a) * 51.5, r: 2.1, fill: "#c9b48a", "fill-opacity": 0.75 });
    const b = a + Math.PI / 32;
    add(lace, "circle", { cx: 80 + Math.cos(b) * 55.5, cy: 80 + Math.sin(b) * 55.5, r: 0.9, fill: "#b8995c" });
  }
  add(lace, "circle", { cx: 80, cy: 80, r: 48, fill: "none", stroke: "#c4a868", "stroke-width": 0.7, "stroke-dasharray": "1 2.2" });
}

makeGrain();
buildSeal();

/* ───────── Foil flakes ───────── */

const fx = (() => {
  const canvas = $("fx");
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  let running = false;
  const flakes = [];
  const FOIL = [[233, 207, 143], [201, 164, 92], [246, 231, 191], [176, 138, 70], [167, 182, 147], [232, 191, 176]];

  function resize() {
    w = innerWidth;
    h = innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function flake(x, y, vx, vy, small) {
    const size = small ? 0.45 : 1;
    flakes.push({
      x, y, vx, vy,
      w: (5 + Math.random() * 6) * size,
      h: (3 + Math.random() * 5) * size,
      rot: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 0.2,
      flip: Math.random() * 6.28,
      vf: 0.06 + Math.random() * 0.14,
      color: FOIL[(Math.random() * (small ? 6 : 4)) | 0],
      sway: Math.random() * 6.28,
    });
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
  }

  function burst(x, y, n, power = 7) {
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = power * (0.3 + Math.random() * 0.8);
      flake(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - power * 0.45);
    }
  }

  function shower(n) {
    for (let i = 0; i < n; i++) {
      flake(Math.random() * w, -20 - Math.random() * h * 0.6, (Math.random() - 0.5) * 1.2, 1 + Math.random() * 2);
    }
  }

  function spark(x, y) {
    for (let i = 0; i < 2; i++) {
      flake(x + (Math.random() - 0.5) * 16, y + (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 1.6, -Math.random() * 1.5, true);
    }
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);

    for (let i = flakes.length - 1; i >= 0; i--) {
      const f = flakes[i];
      f.vy = Math.min(f.vy + 0.07, 2.4);
      f.vx *= 0.985;
      f.sway += 0.04;
      f.x += f.vx + Math.sin(f.sway) * 0.5;
      f.y += f.vy;
      f.rot += f.vr;
      f.flip += f.vf;
      if (f.y > h + 30) { flakes.splice(i, 1); continue; }

      // the flake turning in 3D: squash one axis, darken as it turns away
      const turn = Math.cos(f.flip);
      const light = 0.55 + 0.45 * Math.abs(turn) + (turn > 0.85 ? 0.25 : 0);
      const [r, g, b] = f.color;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.scale(1, turn);
      ctx.fillStyle = `rgb(${Math.min(255, r * light) | 0}, ${Math.min(255, g * light) | 0}, ${Math.min(255, b * light) | 0})`;
      ctx.fillRect(-f.w / 2, -f.h / 2, f.w, f.h);
      ctx.restore();
    }

    if (flakes.length) {
      requestAnimationFrame(frame);
    } else {
      running = false;
    }
  }

  resize();
  addEventListener("resize", resize);

  return { burst, shower, spark };
})();

/* ───────── Curtains ───────── */

const hero = $("hero");

function partCurtains(onHalfway) {
  hero.classList.add("parting");
  setTimeout(onHalfway, reduceMotion ? 0 : 900);
}

/* ───────── Opening: fullscreen, doors, curtains ───────── */

function goFullscreen() {
  const request = root.requestFullscreen || root.webkitRequestFullscreen;
  if (!request) return; // iPhone Safari has no fullscreen for pages
  try {
    const result = request.call(root, { navigationUI: "hide" });
    if (result && result.catch) result.catch(() => {});
  } catch (e) {}
}

let audio = null;

$("seal").addEventListener("click", () => {
  goFullscreen();
  if (audio) playMusic();
  if (navigator.vibrate) navigator.vibrate(18);

  const seal = $("seal").getBoundingClientRect();
  document.body.classList.add("opening");
  setTimeout(() => fx.burst(seal.left + seal.width / 2, seal.top + seal.height / 2, 36, 5), 140);

  setTimeout(() => {
    document.body.classList.remove("locked");
    $("doors").remove();
  }, 2900);
  setTimeout(() => partCurtains(() => document.body.classList.add("revealed")), 1900);
}, { once: true });

/* ───────── Music ───────── */

function playMusic() {
  audio.play().then(() => $("music").classList.add("playing")).catch(() => {});
}

if (MUSIC_SRC) {
  audio = new Audio(MUSIC_SRC);
  audio.loop = true;
  $("music").hidden = false;
  $("music").addEventListener("click", () => {
    if (audio.paused) {
      playMusic();
    } else {
      audio.pause();
      $("music").classList.remove("playing");
    }
  });
}

/* ───────── Reveal on scroll ───────── */

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll(".reveal").forEach((el) => {
  [...el.children].forEach((child, i) => child.style.setProperty("--i", i));
  observer.observe(el);
});

/* ───────── Scratch to reveal ───────── */

const scratch = $("scratch");
const canvas = $("scratch-canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const W = 260;
const H = 236;
const dpr = Math.min(window.devicePixelRatio || 1, 2);

// sage glitter cover
function paintCover() {
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#8b9c77");
  grad.addColorStop(0.35, "#a8b893");
  grad.addColorStop(0.65, "#7f916c");
  grad.addColorStop(1, "#98a984");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const shine = ctx.createRadialGradient(W * 0.38, H * 0.3, 0, W * 0.38, H * 0.3, W * 0.6);
  shine.addColorStop(0, "rgba(255, 255, 240, 0.28)");
  shine.addColorStop(1, "rgba(255, 255, 240, 0)");
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, W, H);

  // glitter
  for (let i = 0; i < 2600; i++) {
    const r = Math.random();
    ctx.fillStyle = r > 0.8
      ? `rgba(250, 236, 190, ${0.5 + Math.random() * 0.5})`
      : r > 0.4
        ? `rgba(236, 244, 222, ${0.25 + Math.random() * 0.45})`
        : `rgba(60, 76, 48, ${0.15 + Math.random() * 0.25})`;
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.1 + 0.25, 0, 6.283);
    ctx.fill();
  }

  ctx.textAlign = "center";
  ctx.font = 'italic 500 21px "Cormorant Garamond", serif';
  ctx.fillStyle = "rgba(40, 52, 32, 0.3)";
  ctx.fillText("scratch to reveal", W / 2 + 1, 106);
  ctx.fillStyle = "rgba(255, 252, 238, 0.95)";
  ctx.fillText("scratch to reveal", W / 2, 105);

  ctx.globalCompositeOperation = "destination-out";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 34;
  // the shadow also erases, which softens the scratched edge
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 10;
}

let last = null;
let checkTimer = null;

function pointAt(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: (e.clientX - rect.left) * (W / rect.width), y: (e.clientY - rect.top) * (H / rect.height) };
}

function scratchTo(p) {
  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  last = p;
}

// share of the canvas scratched clear; the heart covers ~70% of it
function clearedShare() {
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let clear = 0;
  let total = 0;
  for (let i = 3; i < data.length; i += 64) {
    total++;
    if (data[i] < 60) clear++;
  }
  return clear / total;
}

function finishScratch() {
  if (scratch.classList.contains("done")) return;
  scratch.classList.add("done");
  if (navigator.vibrate) navigator.vibrate([20, 40, 30]);
  const box = scratch.getBoundingClientRect();
  fx.burst(box.left + box.width / 2, box.top + box.height / 2, 90, 8);
  setTimeout(() => fx.shower(110), 250);
}

canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  last = pointAt(e);
  scratchTo({ x: last.x + 0.1, y: last.y });
});

canvas.addEventListener("pointermove", (e) => {
  if (!last) return;
  scratchTo(pointAt(e));
  if (Math.random() < 0.6) fx.spark(e.clientX, e.clientY);
  if (!checkTimer) {
    checkTimer = setTimeout(() => {
      checkTimer = null;
      if (clearedShare() > 0.32) finishScratch();
    }, 200);
  }
});

["pointerup", "pointercancel"].forEach((type) =>
  canvas.addEventListener(type, () => { last = null; })
);

// wait for the font so the label renders in it
document.fonts.load('italic 500 21px "Cormorant Garamond"').finally(paintCover);

/* ───────── Save the date (calendar) ───────── */

const calendar = new URLSearchParams({
  action: "TEMPLATE",
  text: "Kishika & Anshul's Wedding",
  dates: "20270127/20270129",
  location: "Chandigarh",
  details: "Wedding celebrations of Kishika & Anshul — https://kishuandanshul.com/invite4/",
});
$("save-date").href = "https://calendar.google.com/calendar/render?" + calendar;

/* ───────── Gallery ───────── */

const gallery = $("gallery");
const figures = gallery.querySelectorAll("figure");
const dots = $("gallery-dots");

figures.forEach((fig, i) => {
  const img = fig.querySelector("img");
  img.addEventListener("error", () => img.classList.add("missing"));
  if (img.complete && !img.naturalWidth) img.classList.add("missing");
  dots.appendChild(document.createElement("i")).classList.toggle("on", i === 0);
});

gallery.addEventListener("scroll", () => {
  const index = Math.round(gallery.scrollLeft / figures[0].offsetWidth);
  [...dots.children].forEach((dot, i) => dot.classList.toggle("on", i === index));
}, { passive: true });

/* ───────── Countdown ───────── */

const pad = (n) => String(n).padStart(2, "0");

function tick() {
  const diff = WEDDING - new Date();

  if (diff <= 0) {
    $("countdown").innerHTML = '<p class="lead">The celebrations have begun! ♥</p>';
    clearInterval(timer);
    return;
  }

  $("cd-days").textContent = Math.floor(diff / 86400000);
  $("cd-hours").textContent = pad(Math.floor(diff / 3600000) % 24);
  $("cd-minutes").textContent = pad(Math.floor(diff / 60000) % 60);
  $("cd-seconds").textContent = pad(Math.floor(diff / 1000) % 60);
}

const timer = setInterval(tick, 1000);
tick();
