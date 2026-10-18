// Wedding starts 27 January 2027, midnight IST
const WEDDING = new Date("2027-01-27T00:00:00+05:30");
// Drop an mp3 into invite/ and set its name here to show the music button
const MUSIC_SRC = "";

const $ = (id) => document.getElementById(id);
const root = document.documentElement;
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

const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

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

// embossed leaf motif for the doors: a light and a dark copy, offset
function makeDamask() {
  const motif = `<g id="m" fill="none" stroke-width="1" stroke-linecap="round">
    <path d="M0 34V-34M0 22C-6 20-14 14-17 4C-9 6-3 12 0 22ZM0 22C6 20 14 14 17 4C9 6 3 12 0 22ZM0 2C-6 0-12-6-14-15C-7-12-2-7 0 2ZM0 2C6 0 12-6 14-15C7-12 2-7 0 2ZM0-17C-4-19-8-24-9-31C-4-28-1-24 0-17ZM0-17C4-19 8-24 9-31C4-28 1-24 0-17Z"/>
    <circle cy="-38" r="2.2"/><circle cy="38" r="1.4"/></g>`;
  const at = [[55, 40], [0, 115], [110, 115]];
  const copies = at.map(([x, y]) =>
    `<use href="#m" stroke="rgba(255,255,240,.2)" transform="translate(${x - 0.7} ${y - 0.7})"/>` +
    `<use href="#m" stroke="rgba(25,34,18,.28)" transform="translate(${x + 0.7} ${y + 0.7})"/>`
  ).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="150"><defs>${motif}</defs>${copies}</svg>`;
  root.style.setProperty("--damask", svgUrl(svg));

  const corner = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 46 46" fill="none" stroke="#e2c98f" stroke-width=".9" stroke-linecap="round">
    <path d="M2 44C2 20 20 2 44 2"/><path d="M8 32C10 18 18 10 32 8" stroke-opacity=".6"/>
    <path d="M12 20c-4-2-6-6-6-10 4 1 7 4 6 10zM20 12c2-4 6-6 10-6-1 4-4 7-10 6z"/>
    <circle cx="13" cy="13" r="1.6" fill="#e2c98f"/></svg>`;
  root.style.setProperty("--corner", svgUrl(corner));
}

makeGrain();
makeDamask();

/* ───────── Gold dust + foil flakes ───────── */

const fx = (() => {
  const canvas = $("fx");
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  const dust = [];
  const flakes = [];
  const FOIL = [[233, 207, 143], [201, 164, 92], [246, 231, 191], [176, 138, 70], [167, 182, 147], [232, 191, 176]];

  function resize() {
    w = innerWidth;
    h = innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seedDust() {
    const count = reduceMotion ? 0 : 46;
    for (let i = 0; i < count; i++) {
      const bokeh = i < 9;
      dust.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: bokeh ? 6 + Math.random() * 18 : 0.5 + Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -(0.04 + Math.random() * 0.18),
        a: bokeh ? 0.05 + Math.random() * 0.07 : 0.35 + Math.random() * 0.55,
        tw: Math.random() * 6.28,
        bokeh,
      });
    }
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

    for (const d of dust) {
      d.x += d.vx;
      d.y += d.vy;
      d.tw += 0.02;
      if (d.y < -30) { d.y = h + 30; d.x = Math.random() * w; }
      if (d.x < -30) d.x = w + 30;
      if (d.x > w + 30) d.x = -30;

      const alpha = d.a * (0.55 + 0.45 * Math.sin(d.tw));
      if (d.bokeh) {
        const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
        g.addColorStop(0, `rgba(255, 236, 190, ${alpha})`);
        g.addColorStop(1, "rgba(255, 236, 190, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(d.x - d.r, d.y - d.r, d.r * 2, d.r * 2);
      } else {
        ctx.fillStyle = `rgba(236, 206, 140, ${alpha * 0.35})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * 2.6, 0, 6.283);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 240, 200, ${alpha})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, 6.283);
        ctx.fill();
      }
    }

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

    requestAnimationFrame(frame);
  }

  resize();
  seedDust();
  addEventListener("resize", resize);
  requestAnimationFrame(frame);

  return { burst, shower, spark };
})();

/* ───────── Hero artwork: watercolour + botanicals ───────── */

const hero = $("hero");

function paintWash() {
  const canvas = $("wash");
  const w = hero.clientWidth;
  const h = hero.clientHeight;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const rand = seeded(27);
  const gauss = () => {
    const u = 1 - rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  };

  // recursively nudge each edge's midpoint: the classic layered-watercolour trick
  const deform = (pts, times, spread) => {
    for (let k = 0; k < times; k++) {
      const next = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        next.push(a, {
          x: (a.x + b.x) / 2 + gauss() * len * spread,
          y: (a.y + b.y) / 2 + gauss() * len * spread,
        });
      }
      pts = next;
    }
    return pts;
  };

  const blob = (cx, cy, r, [cr, cg, cb]) => {
    const base = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const rr = r * (0.8 + rand() * 0.35);
      base.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr });
    }
    const shape = deform(base, 3, 0.28);
    ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, 0.017)`;
    for (let layer = 0; layer < 38; layer++) {
      const pts = deform(shape, 2, 0.32);
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.fill();
    }
  };

  const SAGE = [128, 148, 108];
  const BLUSH = [222, 172, 152];
  const CHAMPAGNE = [214, 184, 126];
  blob(-w * 0.08, h * 0.06, w * 0.6, SAGE);
  blob(w * 1.02, h * 0.16, w * 0.3, BLUSH);
  blob(w * 1.06, h * 0.94, w * 0.62, SAGE);
  blob(-w * 0.06, h * 0.88, w * 0.36, CHAMPAGNE);
  blob(w * 0.12, h * 0.98, w * 0.22, BLUSH);
}

function drawBotanicals() {
  const svg = $("botanicals");
  const w = hero.clientWidth;
  const h = hero.clientHeight;
  const rand = seeded(128);
  const size = Math.min(w, 480) * 0.075;
  const parts = [];

  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

  function branch(x0, y0, x1, y1, bend, count, scale, delay) {
    // bow the stem toward the middle of the screen
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    let nx = -(y1 - y0);
    let ny = x1 - x0;
    const nl = Math.hypot(nx, ny);
    nx /= nl;
    ny /= nl;
    if (nx * (w / 2 - mx) + ny * (h / 2 - my) < 0) { nx = -nx; ny = -ny; }
    const cx = mx + nx * bend;
    const cy = my + ny * bend;

    parts.push(`<path class="bot-stem" pathLength="1" style="--d:${delay}s" d="M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}"/>`);

    const at = (t) => ({
      x: (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1,
      y: (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1,
      angle: Math.atan2(
        2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy),
        2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx)
      ),
    });

    for (let i = 0; i <= count; i++) {
      const tip = i === count;
      const t = tip ? 1 : 0.1 + (0.86 * i) / count;
      const p = at(t);
      const side = i % 2 ? 1 : -1;
      const angle = (p.angle + (tip ? 0 : side * (0.65 + rand() * 0.35))) * (180 / Math.PI);
      const L = size * scale * (1.05 - 0.45 * t) * (0.85 + rand() * 0.3);
      const W = L * (0.24 + rand() * 0.06);
      const d = (delay + 0.3 + t * 1.7).toFixed(2);
      const alt = rand() < 0.3 ? " alt" : "";
      parts.push(
        `<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle.toFixed(1)})">` +
        `<path class="bot-leaf${alt}" style="--d:${d}s" d="M0 0C${L * 0.3} ${-W} ${L * 0.7} ${-W * 0.85} ${L} 0C${L * 0.7} ${W * 0.85} ${L * 0.3} ${W} 0 0Z"/>` +
        `<path class="bot-rib" style="--d:${d}s" d="M${L * 0.06} 0Q${L * 0.5} ${-W * 0.12} ${L * 0.86} 0"/></g>`
      );
      if (!tip && rand() < 0.35) {
        const bx = p.x - Math.sin(p.angle) * side * 7;
        const by = p.y + Math.cos(p.angle) * side * 7;
        parts.push(`<circle class="bot-berry" style="--d:${d}s" cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${(1.4 + rand() * 1.4).toFixed(1)}"/>`);
      }
    }
  }

  // top-left spray
  branch(-6, h * 0.25, w * 0.52, -8, 34, 11, 1.05, 0.2);
  branch(-6, h * 0.04, w * 0.16, h * 0.4, 18, 8, 0.85, 0.5);
  branch(w * 0.02, h * 0.15, w * 0.3, h * 0.1, 10, 4, 0.6, 0.9);
  // bottom-right spray
  branch(w + 6, h * 0.75, w * 0.48, h + 8, 34, 11, 1.05, 0.4);
  branch(w + 6, h * 0.96, w * 0.84, h * 0.6, 18, 8, 0.85, 0.7);
  branch(w * 0.98, h * 0.85, w * 0.7, h * 0.9, 10, 4, 0.6, 1.1);
  // small sprigs in the other corners
  branch(w + 6, h * 0.06, w * 0.8, -6, 12, 5, 0.7, 0.8);
  branch(-6, h * 0.94, w * 0.2, h + 6, 12, 5, 0.7, 1);

  svg.innerHTML =
    `<defs><linearGradient id="bot-gold" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${w}" y2="${h}">` +
    `<stop offset="0" stop-color="#a8854a"/><stop offset=".4" stop-color="#d9bf86"/>` +
    `<stop offset=".7" stop-color="#b08c4c"/><stop offset="1" stop-color="#d9bf86"/></linearGradient></defs>` +
    parts.join("");
}

paintWash();
drawBotanicals();

let lastWidth = innerWidth;
addEventListener("resize", () => {
  if (innerWidth === lastWidth) return; // ignore mobile toolbar show/hide
  lastWidth = innerWidth;
  paintWash();
  drawBotanicals();
});

/* ───────── Opening: fullscreen + doors ───────── */

function goFullscreen() {
  const el = root;
  const request = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!request) return; // iPhone Safari has no fullscreen for pages
  try {
    const result = request.call(el, { navigationUI: "hide" });
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
  setTimeout(() => fx.burst(seal.left + seal.width / 2, seal.top + seal.height / 2, 70, 6), 160);

  setTimeout(() => {
    document.body.classList.remove("locked");
    document.body.classList.add("opened");
  }, 1100);
  setTimeout(() => $("doors").remove(), 3400);
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

// brushed sage-and-gold foil
function paintCover() {
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#6c7e5c");
  grad.addColorStop(0.22, "#a9b994");
  grad.addColorStop(0.42, "#7a8c69");
  grad.addColorStop(0.6, "#bccaa6");
  grad.addColorStop(0.8, "#738564");
  grad.addColorStop(1, "#97a881");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // brushed-metal streaks
  for (let i = 0; i < 260; i++) {
    const y = Math.random() * H;
    ctx.strokeStyle = Math.random() > 0.5
      ? `rgba(255, 255, 240, ${0.03 + Math.random() * 0.07})`
      : `rgba(30, 40, 22, ${0.03 + Math.random() * 0.06})`;
    ctx.lineWidth = Math.random() * 1.2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y + (Math.random() - 0.5) * 14);
    ctx.stroke();
  }

  // glitter
  for (let i = 0; i < 1100; i++) {
    const gold = Math.random() > 0.55;
    ctx.fillStyle = gold
      ? `rgba(244, 222, 160, ${0.35 + Math.random() * 0.6})`
      : `rgba(240, 246, 228, ${0.15 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.1 + 0.25, 0, 6.283);
    ctx.fill();
  }

  // inner gold heart line
  const heart = new Path2D("M130 220C66 172 14 136 14 76C14 40 41 15 74 15C100 15 119 30 130 50C141 30 160 15 186 15C219 15 246 40 246 76C246 136 194 172 130 220Z");
  ctx.strokeStyle = "rgba(240, 220, 168, 0.75)";
  ctx.lineWidth = 1;
  ctx.stroke(heart);

  // embossed label
  ctx.textAlign = "center";
  ctx.font = 'italic 500 21px "Cormorant Garamond", serif';
  ctx.fillStyle = "rgba(30, 40, 22, 0.35)";
  ctx.fillText("scratch to reveal", W / 2 + 1, 104);
  ctx.fillStyle = "rgba(255, 250, 232, 0.92)";
  ctx.fillText("scratch to reveal", W / 2, 103);
  ctx.font = '400 26px "Pinyon Script", cursive';
  ctx.fillStyle = "rgba(255, 244, 210, 0.85)";
  ctx.fillText("our date", W / 2, 132);

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

// wait for the fonts so the label renders in them
Promise.all([
  document.fonts.load('30px "Pinyon Script"'),
  document.fonts.load('italic 500 21px "Cormorant Garamond"'),
]).finally(paintCover);

/* ───────── Save the date (calendar) ───────── */

const calendar = new URLSearchParams({
  action: "TEMPLATE",
  text: "Kishika & Anshul's Wedding",
  dates: "20270127/20270129",
  location: "Chandigarh",
  details: "Wedding celebrations of Kishika & Anshul — https://kishuandanshul.com/invite2/",
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
