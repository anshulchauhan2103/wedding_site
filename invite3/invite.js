// Wedding starts 27 January 2027, midnight IST
const WEDDING = new Date("2027-01-27T00:00:00+05:30");
// Drop an mp3 into invite3/ and set its name here to show the music button
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

// tone-on-tone leaf sprigs printed on the doors
function makeLeafprint() {
  const S = 260;
  const c = document.createElement("canvas");
  c.width = c.height = S * 2;
  const g = c.getContext("2d");
  g.scale(2, 2);
  const rand = seeded(11);

  const sprig = (x, y, angle, len, light) => {
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.strokeStyle = light ? "rgba(222, 232, 204, 0.38)" : "rgba(64, 82, 52, 0.22)";
    g.fillStyle = light ? "rgba(222, 232, 204, 0.3)" : "rgba(64, 82, 52, 0.18)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(len * 0.5, -len * 0.12, len, 0);
    g.stroke();
    const pairs = 5 + ((rand() * 3) | 0);
    for (let i = 0; i < pairs; i++) {
      const t = 0.15 + (0.8 * i) / pairs;
      const px = len * t;
      const py = -len * 0.12 * 4 * t * (1 - t) * 0.5;
      const size = 1 - t * 0.45;
      [-1, 1].forEach((side) => {
        g.save();
        g.translate(px, py);
        g.rotate(side * (0.7 + rand() * 0.2) - 0.15);
        g.beginPath();
        g.ellipse(9 * size, 0, 9 * size, 3.8 * size, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
      });
    }
    g.beginPath();
    g.ellipse(len + 7, 0, 8, 3.4, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  };

  for (let i = 0; i < 16; i++) {
    const x = rand() * S;
    const y = rand() * S;
    const angle = rand() * Math.PI * 2;
    const len = 46 + rand() * 34;
    const light = rand() < 0.75;
    for (const dx of [-S, 0, S]) {
      for (const dy of [-S, 0, S]) sprig(x + dx, y + dy, angle, len, light);
    }
  }
  root.style.setProperty("--leafprint", `url(${c.toDataURL()})`);
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
makeLeafprint();
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

/* ───────── Garden scene ───────── */

const hero = $("hero");

// the scene is drawn in a 400 × 300 box anchored to the bottom of the hero
function sceneBox() {
  const w = hero.clientWidth;
  const h = hero.clientHeight;
  const s = Math.min(w / 400, (h * 0.4) / 300);
  return { w, h, s, ox: (w - 400 * s) / 2, oy: h - 300 * s };
}

function paintGarden() {
  const { w, h, s, ox, oy } = sceneBox();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = $("garden");
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
  const rand = seeded(2027);

  const stone = (x0, x1, dark = 0) => {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, rgb(mixColor([206, 192, 162], [150, 136, 108], dark)));
    g.addColorStop(0.32, rgb(mixColor([251, 247, 237], [210, 198, 172], dark)));
    g.addColorStop(0.6, rgb(mixColor([236, 226, 206], [190, 178, 152], dark)));
    g.addColorStop(1, rgb(mixColor([196, 181, 150], [140, 126, 98], dark)));
    return g;
  };

  const softShadow = (x, y, rx, ry, a) => {
    ctx.save();
    ctx.filter = "blur(6px)";
    ctx.fillStyle = `rgba(90, 76, 50, ${a})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // ground
  const ground = ctx.createLinearGradient(0, 150, 0, 300);
  ground.addColorStop(0, "#ece3d1");
  ground.addColorStop(1, "#d9cbaf");
  ctx.fillStyle = ground;
  ctx.fillRect(-400, 150, 1200, 200);

  // paving towards the fountain
  ctx.fillStyle = "rgba(255, 252, 244, 0.5)";
  ctx.beginPath();
  ctx.moveTo(170, 170);
  ctx.lineTo(230, 170);
  ctx.lineTo(300, 300);
  ctx.lineTo(100, 300);
  ctx.closePath();
  ctx.fill();

  // cypress trees
  function cypress(cx, base, H, W) {
    const half = (t) => W * Math.pow(1 - t, 0.75) * Math.min(1, t * 6 + 0.35);
    softShadow(cx + 6, base, W * 1.1, 6, 0.3);
    ctx.fillStyle = "#6b4f34";
    ctx.fillRect(cx - 2.5, base - 10, 5, 12);

    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      ctx.lineTo(cx - half(t), base - 6 - t * H);
    }
    for (let i = 40; i >= 0; i--) {
      const t = i / 40;
      ctx.lineTo(cx + half(t), base - 6 - t * H);
    }
    const body = ctx.createLinearGradient(cx - W, 0, cx + W, 0);
    body.addColorStop(0, "#7d9567");
    body.addColorStop(0.5, "#5a7049");
    body.addColorStop(1, "#384a30");
    ctx.fillStyle = body;
    ctx.fill();

    // foliage tufts, lit from the left
    for (let i = 0; i < 260; i++) {
      const t = Math.pow(rand(), 0.85) * 0.97;
      const u = rand() * 2 - 1;
      const x = cx + u * half(t) * 0.92;
      const y = base - 6 - t * H;
      const light = smoothstep(1, -1, u) * 0.75 + rand() * 0.25 + (1 - t) * -0.05;
      ctx.fillStyle = rgb(mixColor([52, 70, 44], [160, 180, 132], light), 0.9);
      ctx.beginPath();
      ctx.ellipse(x, y, 2.6 + rand() * 3, 1.8 + rand() * 2, rand() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  cypress(32, 152, 205, 17);
  cypress(94, 150, 172, 15);
  cypress(306, 150, 172, 15);
  cypress(368, 152, 205, 17);

  // balustrade
  function baluster(x) {
    ctx.save();
    ctx.translate(x, 133);
    ctx.beginPath();
    ctx.moveTo(-3.5, 0);
    ctx.lineTo(3.5, 0);
    ctx.lineTo(2.6, 3);
    ctx.quadraticCurveTo(7.5, 15, 3.6, 24);
    ctx.lineTo(4.6, 27);
    ctx.lineTo(4.6, 30);
    ctx.lineTo(-4.6, 30);
    ctx.lineTo(-4.6, 27);
    ctx.lineTo(-3.6, 24);
    ctx.quadraticCurveTo(-7.5, 15, -2.6, 3);
    ctx.closePath();
    ctx.fillStyle = stone(-6, 6);
    ctx.fill();
    ctx.restore();
  }

  function rail(x0, x1, y, hgt) {
    const g = ctx.createLinearGradient(0, y, 0, y + hgt);
    g.addColorStop(0, "#fdfaf3");
    g.addColorStop(1, "#d8cbb1");
    ctx.fillStyle = g;
    ctx.fillRect(x0, y, x1 - x0, hgt);
    ctx.fillStyle = "rgba(110, 92, 60, 0.12)";
    ctx.fillRect(x0, y + hgt, x1 - x0, 2.5);
  }

  for (const [x0, x1] of [[-400, 142], [258, 800]]) {
    softShadow((x0 + x1) / 2, 166, (x1 - x0) / 2, 5, 0.25);
    for (let x = x0 + 8; x < x1 - 4; x += 12.5) baluster(x);
    rail(x0, x1, 126, 7);
    rail(x0, x1, 163, 6);
  }

  // pillars with urns and topiary balls
  function pillar(x) {
    softShadow(x + 4, 172, 14, 4, 0.3);
    ctx.fillStyle = stone(x - 9, x + 9);
    ctx.fillRect(x - 9, 116, 18, 56);
    ctx.fillStyle = stone(x - 12, x + 12);
    ctx.fillRect(x - 12, 112, 24, 6);
    ctx.fillRect(x - 11, 166, 22, 6);

    // urn
    ctx.beginPath();
    ctx.moveTo(x - 4, 112);
    ctx.lineTo(x + 4, 112);
    ctx.quadraticCurveTo(x + 11, 104, x + 9, 96);
    ctx.lineTo(x - 9, 96);
    ctx.quadraticCurveTo(x - 11, 104, x - 4, 112);
    ctx.fillStyle = stone(x - 11, x + 11);
    ctx.fill();
    ctx.fillStyle = stone(x - 11, x + 11);
    ctx.fillRect(x - 10.5, 94, 21, 3);

    const ball = ctx.createRadialGradient(x - 4, 80, 2, x, 84, 13);
    ball.addColorStop(0, "#9db486");
    ball.addColorStop(1, "#3f5536");
    ctx.fillStyle = ball;
    ctx.beginPath();
    ctx.arc(x, 84, 12, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 60; i++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * 11;
      const px = x + Math.cos(a) * r;
      const py = 84 + Math.sin(a) * r;
      const light = smoothstep(12, -12, px - x + py - 84) * 0.8 + rand() * 0.2;
      ctx.fillStyle = rgb(mixColor([56, 74, 46], [170, 190, 140], light), 0.85);
      ctx.beginPath();
      ctx.arc(px, py, 1.2 + rand() * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  pillar(150);
  pillar(250);

  // fountain
  softShadow(204, 252, 104, 13, 0.35);

  ctx.beginPath();
  ctx.ellipse(200, 230, 92, 18, 0, 0, Math.PI);
  ctx.lineTo(108, 250);
  ctx.ellipse(200, 250, 92, 18, 0, Math.PI, 0, true);
  ctx.closePath();
  ctx.fillStyle = stone(108, 292);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(200, 230, 92, 18, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#f4eddf";
  ctx.fill();
  ctx.strokeStyle = "rgba(150, 130, 96, 0.35)";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  const water = ctx.createLinearGradient(0, 216, 0, 244);
  water.addColorStop(0, "#9cc2c2");
  water.addColorStop(1, "#d3e9e5");
  ctx.beginPath();
  ctx.ellipse(200, 230, 84, 14, 0, 0, Math.PI * 2);
  ctx.fillStyle = water;
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 0.7;
  for (const [rx, ry, a0, a1] of [[60, 8, 3.6, 4.6], [44, 5, 0.3, 1.2], [70, 10, 5.2, 5.9]]) {
    ctx.beginPath();
    ctx.ellipse(200, 231, rx, ry, 0, a0, a1);
    ctx.stroke();
  }

  // pedestal
  ctx.fillStyle = stone(191, 209);
  ctx.fillRect(191, 168, 18, 62);
  ctx.beginPath();
  ctx.ellipse(200, 196, 13, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = stone(187, 213);
  ctx.fill();

  // upper bowl
  ctx.beginPath();
  ctx.moveTo(158, 162);
  ctx.quadraticCurveTo(200, 196, 242, 162);
  ctx.closePath();
  ctx.fillStyle = stone(158, 242);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(200, 162, 42, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#f6f0e3";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(200, 162, 37, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = water;
  ctx.fill();

  // top spout
  ctx.fillStyle = stone(196, 204);
  ctx.fillRect(196, 134, 8, 28);
  ctx.beginPath();
  ctx.ellipse(200, 140, 9, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = stone(191, 209);
  ctx.fill();
  const knob = ctx.createRadialGradient(198, 128, 1, 200, 131, 6);
  knob.addColorStop(0, "#fffaf0");
  knob.addColorStop(1, "#c9b996");
  ctx.fillStyle = knob;
  ctx.beginPath();
  ctx.arc(200, 131, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // rose bushes
  const ROSES = [[236, 184, 168], [246, 228, 212], [242, 200, 172], [217, 154, 142]];

  function rose(x, y, R, col) {
    const dark = mixColor(col, [120, 70, 60], 0.35);
    const light = mixColor(col, [255, 250, 245], 0.45);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const g = ctx.createRadialGradient(x, y, R * 0.1, x, y, R * 1.05);
      g.addColorStop(0, rgb(light));
      g.addColorStop(1, rgb(col));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * R * 0.42, y + Math.sin(a) * R * 0.32, R * 0.56, R * 0.42, a, 0, Math.PI * 2);
      ctx.fill();
    }
    const core = ctx.createRadialGradient(x - R * 0.15, y - R * 0.15, 0, x, y, R * 0.6);
    core.addColorStop(0, rgb(light));
    core.addColorStop(1, rgb(col));
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, R * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgb(dark, 0.55);
    ctx.lineWidth = R * 0.07;
    for (const [k, a0] of [[0.46, 0.4], [0.32, 2.4], [0.18, 4.2]]) {
      ctx.beginPath();
      ctx.arc(x, y, R * k, a0, a0 + 3.6);
      ctx.stroke();
    }
  }

  function bush(x, y, R, roses) {
    softShadow(x + 4, y + R * 0.55, R * 1.2, R * 0.25, 0.3);
    ctx.fillStyle = "#3d5335";
    ctx.beginPath();
    ctx.ellipse(x, y, R * 1.05, R * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 70; i++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand());
      const lx = x + Math.cos(a) * r * R * 1.05;
      const ly = y + Math.sin(a) * r * R * 0.72;
      const light = smoothstep(R, -R, lx - x + (ly - y) * 1.4) * 0.7 + rand() * 0.3;
      ctx.fillStyle = rgb(mixColor([50, 70, 44], [150, 174, 124], light), 0.95);
      ctx.beginPath();
      ctx.ellipse(lx, ly, R * 0.2, R * 0.09, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < roses; i++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * 0.75;
      rose(x + Math.cos(a) * r * R, y - R * 0.12 + Math.sin(a) * r * R * 0.5, R * (0.22 + rand() * 0.08), ROSES[(rand() * 4) | 0]);
    }
    ctx.fillStyle = "rgba(255, 253, 248, 0.9)";
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.arc(x + (rand() * 2 - 1) * R, y + (rand() * 2 - 1) * R * 0.6, 0.9 + rand() * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  bush(62, 212, 30, 6);
  bush(338, 212, 30, 6);
  bush(124, 238, 24, 4);
  bush(276, 238, 24, 4);
  bush(-4, 278, 44, 8);
  bush(404, 278, 44, 8);
  bush(96, 296, 30, 5);
  bush(304, 296, 30, 5);
}

// running water, drawn over the painted fountain
function drawWater() {
  const { w, h, s, ox, oy } = sceneBox();
  const svg = $("water");
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  const P = (x, y) => `${(ox + x * s).toFixed(1)} ${(oy + y * s).toFixed(1)}`;
  let out = "";

  for (const side of [-1, 1]) {
    out += `<path class="jet" d="M${P(200, 127)}Q${P(200 + side * 22, 108)} ${P(200 + side * 34, 160)}"/>`;
    out += `<path class="jet" style="animation-delay:-.4s" d="M${P(200, 127)}Q${P(200 + side * 12, 110)} ${P(200 + side * 22, 160)}"/>`;
    for (let i = 0; i < 4; i++) {
      const x = 200 + side * (24 + i * 5);
      out += `<path class="sheet" style="animation-delay:-${(i * 0.17).toFixed(2)}s" d="M${P(x, 166)}Q${P(x + side * 10, 180)} ${P(x + side * 14, 228)}"/>`;
    }
  }
  for (let i = 0; i < 3; i++) {
    out += `<ellipse class="ripple-ring" style="animation-delay:-${(i * 0.85).toFixed(2)}s" cx="${ox + 200 * s}" cy="${oy + 231 * s}" rx="${70 * s}" ry="${11 * s}"/>`;
  }
  svg.innerHTML = out;
}

/* ───────── Curtains (WebGL) ───────── */

const TIE_Y = 0.56;
// where the inner edge of a tied-back drape sits, as a share of the width
const edgeOpen = (y) => (y < TIE_Y
  ? lerp(0.27, 0.1, Math.pow(smoothstep(0, TIE_Y, y), 1.4))
  : lerp(0.1, 0.2, smoothstep(TIE_Y, 1, y)));

const valance = (h) => ({ vb: Math.min(34, Math.max(22, h * 0.035)), vd: Math.min(56, Math.max(34, h * 0.06)) });

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uDpr;
uniform float uOpen;
uniform float uTime;
uniform float uVB;
uniform float uVD;

const vec3 CREAM = vec3(0.958, 0.918, 0.842);
const vec3 SHADOW = vec3(0.69, 0.59, 0.46);

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

float edgeOpen(float y) {
  if (y < ${TIE_Y}) return mix(0.27, 0.10, pow(smoothstep(0.0, ${TIE_Y}, y), 1.4));
  return mix(0.10, 0.20, smoothstep(${TIE_Y}, 1.0, y));
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  float y = p.y / uRes.y;
  float xs = p.x / uRes.x;
  float side = step(0.5, xs);
  float x = mix(xs, 1.0 - xs, side);

  // drape: folds keep their count, so they bunch up as the curtain gathers
  float e = mix(0.5, edgeOpen(y), uOpen);
  float aa = 1.2 / uRes.x;
  float a = smoothstep(e + aa, e - aa, x);
  float u = clamp(x / e, 0.0, 1.0);
  float sway = sin(uTime * 1.6 + y * 4.0) * uOpen * (1.0 - uOpen);
  float ph = u * 7.0 * 6.2832 + 0.8 * sin(u * 8.0 + y * 2.5) + side * 1.7 + sway;
  float s = sin(ph);
  float shade = (0.70 + 0.30 * sin(ph + 0.9)) * (0.80 + 0.20 * smoothstep(-1.0, 0.4, s));
  shade *= 1.0 - 0.30 * exp(-pow((y - ${TIE_Y}) / 0.03, 2.0)) * uOpen;
  shade *= 0.82 + 0.18 * smoothstep(0.0, 0.14, y);
  shade *= 1.0 - 0.15 * smoothstep(0.92, 1.0, u);
  vec3 col = mix(SHADOW, CREAM, clamp(shade, 0.0, 1.0)) + pow(max(sin(ph + 0.9), 0.0), 12.0) * 0.10;
  col *= 0.985 + 0.03 * hash(floor(p));
  float drop = (1.0 - a) * smoothstep(e + 0.07, e, x) * 0.28 * smoothstep(0.0, 0.2, uOpen);
  vec4 outc = vec4(col * a, a + drop * (1.0 - a));

  // swagged valance across the top
  float fx = fract(p.x / (uRes.x / 3.0));
  float yb = uVB + uVD * sin(3.14159 * fx);
  float va = smoothstep(yb + 1.0, yb - 1.0, p.y);
  float v = clamp(p.y / yb, 0.0, 1.0);
  float ph2 = v * 4.5 * 6.2832 - 1.2;
  float vs = (0.74 + 0.26 * sin(ph2)) * (1.0 - 0.28 * pow(abs(fx - 0.5) * 2.0, 3.0));
  vs *= 0.9 + 0.1 * smoothstep(0.0, 0.3, v);
  vec3 vcol = mix(SHADOW, CREAM, clamp(vs, 0.0, 1.0)) + pow(max(sin(ph2), 0.0), 10.0) * 0.08;
  float band = smoothstep(uVB * 0.55 + 1.0, uVB * 0.55 - 1.0, p.y);
  vcol = mix(vcol, mix(SHADOW, CREAM, 0.80 + 0.18 * sin(p.x * 0.5)), band);
  float vshadow = (1.0 - va) * smoothstep(yb + 14.0, yb, p.y) * 0.22;
  outc = vec4(vcol * va, va) + outc * (1.0 - va);
  outc = vec4(outc.rgb * (1.0 - vshadow), vshadow + outc.a * (1.0 - vshadow));

  gl_FragColor = outc;
}`;

const curtains = (() => {
  const canvas = $("curtains");
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true });
  if (!gl) {
    canvas.remove();
    return null;
  }

  const shader = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return sh;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, "attribute vec2 pos; void main() { gl_Position = vec4(pos, 0.0, 1.0); }"));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    canvas.remove();
    return null;
  }
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(prog, "pos");
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  const loc = {};
  ["uRes", "uDpr", "uOpen", "uTime", "uVB", "uVD"].forEach((n) => (loc[n] = gl.getUniformLocation(prog, n)));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let open = 0;

  function size() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    const { vb, vd } = valance(h);
    gl.uniform2f(loc.uRes, w, h);
    gl.uniform1f(loc.uDpr, dpr);
    gl.uniform1f(loc.uVB, vb);
    gl.uniform1f(loc.uVD, vd);
    draw(open, 0);
  }

  function draw(k, time) {
    open = k;
    gl.uniform1f(loc.uOpen, k);
    gl.uniform1f(loc.uTime, time);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  return { size, draw };
})();

/* ───────── Pearls, rosettes and tiebacks ───────── */

function buildTrim() {
  const svg = $("trim");
  const w = hero.clientWidth;
  const h = hero.clientHeight;
  const { vb, vd } = valance(h);
  const sw = w / 3;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

  const swagY = (x, sag, drop) => vb + vd * sag * Math.sin(Math.PI * ((x / sw) % 1)) + drop;
  const strand = (sag, drop, gap, r) => {
    let out = "";
    let last = null;
    for (let x = 0; x <= w; x += 0.5) {
      const y = swagY(x, sag, drop);
      if (!last || Math.hypot(x - last.x, y - last.y) >= gap) {
        out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="url(#pearl)"/>`;
        last = { x, y };
      }
    }
    return out;
  };

  let out = `<defs>
    <radialGradient id="pearl" cx="36%" cy="32%" r="70%">
      <stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#f7f1e7"/>
      <stop offset=".75" stop-color="#dcd1c0"/><stop offset="1" stop-color="#a79a85"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9c7a3c"/><stop offset=".35" stop-color="#e8d197"/>
      <stop offset=".6" stop-color="#b08a48"/><stop offset="1" stop-color="#e2c88f"/>
    </linearGradient>
    <linearGradient id="tassel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#9c7a3c"/><stop offset=".4" stop-color="#ecd7a0"/><stop offset="1" stop-color="#8a6a32"/>
    </linearGradient>
    <filter id="drop"><feDropShadow dx="0" dy="1.2" stdDeviation="1" flood-color="#5a4a30" flood-opacity=".45"/></filter>
  </defs><g filter="url(#drop)">`;

  out += strand(1, 2, 6.4, 2.6);
  out += strand(1.22, 9, 6, 2.2);

  for (let i = 0; i <= 3; i++) {
    const x = i * sw;
    out += `<g transform="translate(${x.toFixed(1)} ${(vb * 0.95).toFixed(1)})">`;
    for (let p = 0; p < 8; p++) {
      const a = (p / 8) * Math.PI * 2;
      out += `<circle cx="${(Math.cos(a) * 6.5).toFixed(1)}" cy="${(Math.sin(a) * 6.5).toFixed(1)}" r="4" fill="url(#gold)"/>`;
    }
    out += `<circle r="6" fill="url(#gold)"/><circle r="3" fill="url(#pearl)"/></g>`;
  }
  out += "</g>";

  // pearl strand where the closed curtains meet
  out += `<g id="center-strand" filter="url(#drop)">`;
  for (let y = vb + vd + 6; y < h; y += 9) out += `<circle cx="${w / 2}" cy="${y.toFixed(1)}" r="3" fill="url(#pearl)"/>`;
  out += "</g>";

  // gold rope tiebacks with tassels
  const ty = TIE_Y * h;
  const ex = edgeOpen(TIE_Y) * w;
  const tie = `<path d="M-4 ${ty - 6}Q${ex * 0.6} ${ty + 6} ${ex + 5} ${ty}" fill="none" stroke="url(#gold)" stroke-width="6" stroke-linecap="round"/>
    <path d="M-4 ${ty - 6}Q${ex * 0.6} ${ty + 6} ${ex + 5} ${ty}" fill="none" stroke="#7a5c28" stroke-opacity=".5" stroke-width="6" stroke-dasharray="1.5 3"/>
    <g transform="translate(${ex - 2} ${ty + 2})">
      <circle r="5" fill="url(#gold)"/>
      <path d="M-3 4h6l5 26h-16Z" fill="url(#tassel)"/>
      <path d="M-7 30h14" stroke="#8a6a32" stroke-width="2"/>
    </g>`;
  out += `<g id="tiebacks" filter="url(#drop)"><g>${tie}</g><g transform="translate(${w} 0) scale(-1 1)">${tie}</g></g>`;

  svg.innerHTML = out;
}

function setTrim(k) {
  const strand = $("center-strand");
  const ties = $("tiebacks");
  if (strand) strand.style.opacity = 1 - smoothstep(0, 0.12, k);
  if (ties) ties.style.opacity = smoothstep(0.8, 1, k);
}

function layout() {
  paintGarden();
  drawWater();
  buildTrim();
  if (curtains) curtains.size();
  setTrim(curtainOpen);
}

let curtainOpen = curtains ? 0 : 1;
layout();

let lastWidth = innerWidth;
addEventListener("resize", () => {
  if (innerWidth === lastWidth) return; // ignore mobile toolbar show/hide
  lastWidth = innerWidth;
  layout();
});

function partCurtains(onHalfway) {
  if (!curtains) {
    setTrim(1);
    onHalfway();
    return;
  }
  const duration = reduceMotion ? 10 : 2800;
  const start = performance.now();
  let told = false;
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    curtainOpen = easeInOut(t);
    curtains.draw(curtainOpen, now / 1000);
    setTrim(curtainOpen);
    if (!told && curtainOpen > 0.3) {
      told = true;
      onHalfway();
    }
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
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
  details: "Wedding celebrations of Kishika & Anshul — https://kishuandanshul.com/invite3/",
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
