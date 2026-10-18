// Wedding starts 27 January 2027, midnight IST
const WEDDING = new Date("2027-01-27T00:00:00+05:30");
// Drop an mp3 into invite/ and set its name here to show the music button
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


/* ───────── Confetti: petals, paper and gold foil ───────── */

const fx = (() => {
  const canvas = $("fx");
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  let running = false;
  let lastTime = 0;
  const bits = [];

  // [front colour, back colour]
  const PAPER = [
    [[250, 245, 234], [222, 212, 192]],
    [[238, 196, 182], [206, 160, 146]],
    [[218, 160, 152], [180, 124, 118]],
    [[163, 180, 145], [124, 142, 108]],
  ];
  const GOLD = [[214, 178, 104], [150, 116, 56]];
  const MARIGOLD = [[246, 146, 30], [255, 176, 20], [238, 118, 22], [255, 200, 64]];
  const ROSE = [[176, 22, 40], [204, 44, 58]];
  const PETAL = [[246, 214, 204], [232, 176, 164], [252, 238, 230]];

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[(Math.random() * list.length) | 0];
  const shade = (c, k) => `rgb(${Math.min(255, c[0] * k) | 0}, ${Math.min(255, c[1] * k) | 0}, ${Math.min(255, c[2] * k) | 0})`;

  function resize() {
    w = innerWidth;
    h = innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }

  function add(x, y, vx, vy, opts = {}) {
    const r = Math.random();
    const kind = opts.kind || (r < 0.34 ? "petal" : r < 0.62 ? "gold" : "paper");
    const depth = opts.depth || rand(0.65, 1.25);
    const size = (opts.small ? 0.55 : 1.3) * depth;
    const bit = {
      kind, x, y, vx, vy, depth,
      // in-plane spin plus two tumble axes give a real 3D flip
      spin: rand(0, 6.28), vSpin: rand(-3, 3),
      tx: rand(0, 6.28), vtx: rand(2, 7) * (Math.random() < 0.5 ? -1 : 1),
      ty: rand(0, 6.28), vty: rand(1, 4) * (Math.random() < 0.5 ? -1 : 1),
      flutter: rand(0, 6.28), vFlutter: rand(2.5, 5),
      age: 0, life: rand(5, 8),
    };
    if (kind === "petal") {
      bit.w = rand(9, 14) * size;
      bit.h = bit.w * rand(0.75, 0.95);
      bit.color = pick(opts.colors || PETAL);
      bit.vtx *= 0.5;
    } else if (kind === "gold") {
      bit.w = rand(5, 8) * size;
      bit.h = rand(5, 8) * size;
      bit.round = Math.random() < 0.35;
    } else {
      bit.w = rand(7, 11) * size;
      bit.h = rand(3.5, 5.5) * size;
      bit.color = pick(PAPER);
    }
    bits.push(bit);
    if (!running) {
      running = true;
      lastTime = performance.now();
      requestAnimationFrame(frame);
    }
  }

  // cannon pop: fast cone upward, air drag slows it, then it drifts down
  function burst(x, y, n, power = 7) {
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + rand(-1.15, 1.15);
      const speed = power * rand(70, 140);
      add(x + rand(-10, 10), y + rand(-10, 10), Math.cos(angle) * speed, Math.sin(angle) * speed);
    }
  }

  // a gentle fall from above the screen, staggered
  function shower(n) {
    for (let i = 0; i < n; i++) {
      setTimeout(() => add(rand(-20, w + 20), rand(-60, -10), rand(-30, 30), rand(30, 90)), i * 18);
    }
  }

  // marigold and rose petals drifting down from above the screen
  function petals(n) {
    for (let i = 0; i < n; i++) {
      setTimeout(() => add(rand(-20, w + 20), rand(-60, -10), rand(-30, 30), rand(20, 70), {
        kind: Math.random() < 0.85 ? "petal" : "gold",
        colors: Math.random() < 0.8 ? MARIGOLD : ROSE,
      }), i * 22);
    }
  }

  function spark(x, y) {
    add(x + rand(-8, 8), y + rand(-6, 6), rand(-60, 60), rand(-90, -20), { kind: "gold", small: true });
  }

  function petalPath(bw, bh) {
    ctx.beginPath();
    ctx.moveTo(0, bh * 0.5);
    ctx.bezierCurveTo(-bw * 0.62, bh * 0.2, -bw * 0.55, -bh * 0.45, -bw * 0.12, -bh * 0.5);
    ctx.quadraticCurveTo(0, -bh * 0.36, bw * 0.12, -bh * 0.5);
    ctx.bezierCurveTo(bw * 0.55, -bh * 0.45, bw * 0.62, bh * 0.2, 0, bh * 0.5);
    ctx.closePath();
  }

  function draw(b) {
    const cx = Math.cos(b.tx);
    const cy = Math.cos(b.ty);
    const facing = cx * cy; // >0 front, <0 back; magnitude = how flat to the viewer
    const flat = Math.abs(facing);
    const fade = Math.min(1, (b.life - b.age) / 0.8) * Math.min(1, b.age / 0.05);
    const light = 0.62 + 0.38 * flat;

    ctx.save();
    ctx.globalAlpha = Math.max(0, fade) * (0.55 + 0.45 * Math.min(1, b.depth));
    ctx.translate(b.x, b.y);
    ctx.rotate(b.spin);
    ctx.scale(Math.max(0.08, Math.abs(cy)), Math.max(0.08, Math.abs(cx)));

    if (b.kind === "petal") {
      const g = ctx.createRadialGradient(0, b.h * 0.45, 0, 0, 0, b.w * 0.75);
      g.addColorStop(0, shade(b.color, light * 0.86));
      g.addColorStop(1, shade(b.color, light * (facing < 0 ? 0.92 : 1.04)));
      ctx.fillStyle = g;
      petalPath(b.w, b.h);
      ctx.fill();
      ctx.strokeStyle = shade(b.color, light * 0.8);
      ctx.globalAlpha *= 0.35;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, b.h * 0.45);
      ctx.quadraticCurveTo(b.w * 0.05, 0, 0, -b.h * 0.3);
      ctx.stroke();
    } else if (b.kind === "gold") {
      // metallic: dark at an angle, a white-gold flash when it faces the light
      const glint = Math.pow(flat, 14);
      const base = facing < 0 ? GOLD[1] : GOLD[0];
      const g = ctx.createLinearGradient(-b.w / 2, -b.h / 2, b.w / 2, b.h / 2);
      g.addColorStop(0, shade(base, 0.75 + 0.5 * flat));
      g.addColorStop(0.5, shade([255, 244, 214], 0.7 + 0.3 * flat + glint * 0.3));
      g.addColorStop(1, shade(base, 0.7 + 0.45 * flat));
      ctx.fillStyle = g;
      if (b.round) {
        ctx.beginPath();
        ctx.arc(0, 0, b.w / 2, 0, 6.283);
        ctx.fill();
      } else {
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      }
      if (glint > 0.25) {
        ctx.globalAlpha *= glint;
        ctx.fillStyle = "#fffaf0";
        ctx.beginPath();
        ctx.arc(0, 0, b.w * 0.9, 0, 6.283);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = shade(facing < 0 ? b.color[1] : b.color[0], light);
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    }
    ctx.restore();
  }

  function frame(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i];
      b.age += dt;
      b.tx += b.vtx * dt;
      b.ty += b.vty * dt;
      b.spin += b.vSpin * dt;
      b.flutter += b.vFlutter * dt;

      // flat pieces catch more air: more drag, slower fall, more side-drift
      const flat = Math.abs(Math.cos(b.tx) * Math.cos(b.ty));
      const drag = (b.kind === "petal" ? 2.6 : b.kind === "gold" ? 1.6 : 2.1) * (0.5 + flat);
      b.vx -= b.vx * drag * dt;
      b.vy += 520 * dt - b.vy * drag * dt;
      const terminal = (b.kind === "gold" ? 150 : 95) * (1.25 - 0.55 * flat) * b.depth;
      if (b.vy > terminal) b.vy = terminal;
      b.x += (b.vx + Math.sin(b.flutter) * 46 * flat) * dt;
      b.y += b.vy * dt;

      if (b.age > b.life || b.y > h + 40) {
        bits.splice(i, 1);
        continue;
      }
      draw(b);
    }

    if (bits.length) {
      requestAnimationFrame(frame);
    } else {
      running = false;
      ctx.clearRect(0, 0, w, h);
    }
  }

  resize();
  addEventListener("resize", resize);

  return { burst, shower, spark, petals };
})();

/* ───────── Opening film ───────── */

const hero = $("hero");
const film = $("film");
const body = document.body;

// moments in opening-portrait.mp4 (seconds)
const FILM_REST = 1.6;   // sealed envelope, still
const SEAL_SPLIT = 2.02;  // seal cracks along the seam
const FILM_END = 7.15;   // garden, before the clip's own text starts to fade in
// the clip's wax seal, in video pixels (720 × 1280)
const SEAL_AT = { x: 358, y: 622, d: 196 };
// where the two envelope doors' inner edges are as they slide apart:
// [time, left edge x, right edge x] in video pixels, measured from the clip
const DOOR_EDGES = [
  [2.0, 357, 357], [2.1, 347, 370], [2.2, 340, 375], [2.3, 323, 389],
  [2.4, 308, 401], [2.5, 279, 425], [2.6, 250, 446], [2.7, 226, 466],
  [2.8, 181, 506], [2.9, 148, 539], [3.0, 98, 583], [3.4, -150, 860],
];
const SEAL_GONE = 3.35;  // doors have left the frame
const SETTLE = 1.2;      // seconds of film over which playback eases to a stop

// put our seal over the clip's seal for an object-fit: cover crop
function placeSeal() {
  const w = hero.clientWidth;
  const h = hero.clientHeight;
  const vw = film.videoWidth || 720;
  const vh = film.videoHeight || 1280;
  const k = Math.max(w / vw, h / vh);
  const ox = (w - vw * k) / 2;
  const oy = (h - vh * k) / 2;
  hero.style.setProperty("--sx", `${ox + SEAL_AT.x * k}px`);
  hero.style.setProperty("--sy", `${oy + SEAL_AT.y * k}px`);
  hero.style.setProperty("--sd", `${SEAL_AT.d * k}px`);
  filmScale = k;
}

let filmScale = 1;

function doorEdges(t) {
  const e = DOOR_EDGES;
  if (t <= e[0][0]) return [e[0][1], e[0][2]];
  for (let i = 1; i < e.length; i++) {
    if (t <= e[i][0]) {
      const f = (t - e[i - 1][0]) / (e[i][0] - e[i - 1][0]);
      return [e[i - 1][1] + (e[i][1] - e[i - 1][1]) * f, e[i - 1][2] + (e[i][2] - e[i - 1][2]) * f];
    }
  }
  const last = e[e.length - 1];
  return [last[1], last[2]];
}

// slide each half of our seal with its door
function moveHalves(t) {
  const [l, r] = doorEdges(t);
  sealL.style.transform = `translateX(${(l - SEAL_AT.x) * filmScale}px)`;
  sealR.style.transform = `translateX(${(r - SEAL_AT.x) * filmScale}px)`;
  const fade = Math.max(0, Math.min(1, (SEAL_GONE - t) / 0.45));
  sealL.style.opacity = sealR.style.opacity = fade;
}

function goFullscreen() {
  const request = root.requestFullscreen || root.webkitRequestFullscreen;
  if (!request) return; // iPhone Safari has no fullscreen for pages
  try {
    const result = request.call(root, { navigationUI: "hide" });
    if (result && result.catch) result.catch(() => {});
  } catch (e) {}
}

function restOnEnvelope() {
  placeSeal();
  if (film.paused && film.currentTime < FILM_REST - 0.05) film.currentTime = FILM_REST;
}

// the film only becomes visible once it can actually paint a frame
["seeked", "playing"].forEach((type) =>
  film.addEventListener(type, () => film.classList.add("ready"), { once: true })
);

// metadata can arrive before this script runs; iPhone Safari needs an explicit load()
if (film.readyState >= 1) {
  restOnEnvelope();
} else {
  film.addEventListener("loadedmetadata", restOnEnvelope, { once: true });
  if (film.networkState !== HTMLMediaElement.NETWORK_LOADING) film.load();
}
addEventListener("resize", placeSeal);
placeSeal();

const sealL = document.querySelector(".seal-half.l");
const sealR = document.querySelector(".seal-half.r");

let audio = null;
let sealCracked = false;
let sealGone = false;
let ended = false;

function crackSeal() {
  if (sealCracked) return;
  sealCracked = true;
  const r = $("seal").getBoundingClientRect();
  fx.burst(r.left + r.width / 2, r.top + r.height / 2, 30, 5);
}

function liftSeal() {
  if (sealGone) return;
  sealGone = true;
  body.classList.add("seal-off");
}

let revealed = false;

// names start writing in while the camera is still settling
function reveal() {
  if (revealed) return;
  revealed = true;
  body.classList.add("revealed");
  fx.petals(60);
}

function finish() {
  if (ended) return;
  ended = true;
  crackSeal();
  liftSeal();
  film.pause();
  film.playbackRate = 1;
  // normally we stop right on the garden; if playback never got there
  // (blocked or stalled), fade across to the garden still behind the film
  if (Math.abs(film.currentTime - FILM_END) > 0.4) film.classList.remove("ready");
  reveal();
  setTimeout(() => {
    body.classList.remove("locked");
    const seal = $("seal");
    if (seal) seal.remove();
  }, 900);
}

function watchFilm(e) {
  if (ended) return;
  const t = film.currentTime;
  moveHalves(t);
  if (t >= SEAL_SPLIT) crackSeal();
  if (t >= SEAL_GONE) liftSeal();

  // ease the film to a stop instead of freezing it mid-motion
  const left = FILM_END - t;
  if (left < SETTLE) {
    const k = Math.max(0, left / SETTLE);
    film.playbackRate = Math.max(0.12, k * k * (3 - 2 * k));
  }
  if (left < 0.7) reveal();

  if (t >= FILM_END) {
    finish();
    return;
  }
  if (!e) requestAnimationFrame(watchFilm);
}

$("seal").addEventListener("click", () => {
  goFullscreen();
  if (audio) playMusic();
  if (navigator.vibrate) navigator.vibrate(18);
  body.classList.add("playing");

  // skip the still opening frames if Safari never seeked there
  if (film.readyState >= 1 && film.currentTime < FILM_REST - 0.05) film.currentTime = FILM_REST;
  film.classList.add("ready");
  const started = film.play();
  if (started && started.catch) {
    // if the browser refuses to play, still open the invitation
    started.catch(() => { crackSeal(); liftSeal(); finish(); });
  }
  requestAnimationFrame(watchFilm);
  film.addEventListener("timeupdate", watchFilm);

  // wall-clock backstops: some phones report currentTime late or not at all,
  // so the seal and the ending never wait on the film alone
  const ms = (t) => (t - FILM_REST) * 1000;
  setTimeout(crackSeal, ms(SEAL_SPLIT) + 300);
  setTimeout(liftSeal, ms(SEAL_GONE) + 300);
  // only cut to the ending if the film has genuinely stalled
  let lastT = -1;
  let stuckFor = 0;
  const stallCheck = setInterval(() => {
    if (ended) return clearInterval(stallCheck);
    if (film.currentTime > lastT + 0.01) {
      lastT = film.currentTime;
      stuckFor = 0;
    } else if ((stuckFor += 500) >= 3000) {
      clearInterval(stallCheck);
      finish();
    }
  }, 500);
}, { once: true });

film.addEventListener("ended", finish);

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
  fx.burst(box.left + box.width / 2, box.top + box.height * 0.45, 110, 8);
  setTimeout(() => fx.shower(90), 350);
}

canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  last = pointAt(e);
  scratchTo({ x: last.x + 0.1, y: last.y });
});

canvas.addEventListener("pointermove", (e) => {
  if (!last) return;
  scratchTo(pointAt(e));
  if (Math.random() < 0.35) fx.spark(e.clientX, e.clientY);
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
  details: "Wedding celebrations of Kishika & Anshul — https://kishuandanshul.com/invite/",
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
