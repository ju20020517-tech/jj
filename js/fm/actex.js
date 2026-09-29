/* =========================================================
 *  동물의 숲 풍 손그림 텍스처 & 건물 키트
 *   - 모든 텍스처는 캔버스로 그림 (외부 이미지 없음)
 *   - 무늬 텍스처는 밝은 회색조로 그려서 재질 색으로 물들임 (tint)
 *   - wuv(): 월드 크기에 맞춘 UV (1타일 = scale m) → 크기가 달라도 무늬 크기가 같음
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE;
  const H = ISLE.M.h;
  const { geo, sphere, box, cyl, mesh, soften, lathe } = H;
  const AC = (FM.AC = {});

  // 결정적 난수 (텍스처가 매번 같게)
  let seed = 1;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const cache = new Map();
  function tex(key, size, draw, opts = {}) {
    if (cache.has(key)) return cache.get(key);
    seed = 1 + [...key].reduce((a, c) => a * 31 + c.charCodeAt(0) >>> 0, 7) % 100000;
    const c = document.createElement('canvas'); c.width = opts.w || size; c.height = opts.h || size;
    const g = c.getContext('2d');
    draw(g, c.width, c.height);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    cache.set(key, t);
    return t;
  }
  AC.tex = tex;
  const blob = (g, x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
  // 가장자리 이음새 없이 반복되도록 9방향으로 찍기
  const wrap = (w, h, x, y, fn) => { for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) fn(x + dx, y + dy); };

  // ---------------------------------------------------------
  // 땅
  // ---------------------------------------------------------
  // 잔디: 밝은 풀색 위에 V자 풀 무늬와 토끼풀 점 (동물의 숲 잔디 느낌)
  AC.grass = () => tex('grass', 256, (g, w, h) => {
    g.fillStyle = '#ededed'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { const x = rnd() * w, y = rnd() * h, r = 10 + rnd() * 26; wrap(w, h, x, y, (a, b) => blob(g, a, b, r, `rgba(255,255,255,${0.25 + rnd() * 0.3})`)); }
    for (let i = 0; i < 40; i++) { const x = rnd() * w, y = rnd() * h, r = 8 + rnd() * 20; wrap(w, h, x, y, (a, b) => blob(g, a, b, r, 'rgba(170,190,150,0.16)')); }
    g.lineCap = 'round';
    for (let i = 0; i < 150; i++) {
      const x = rnd() * w, y = rnd() * h, s = 3 + rnd() * 4, dark = rnd() < 0.6;
      wrap(w, h, x, y, (a, b) => { g.strokeStyle = dark ? 'rgba(90,130,70,0.28)' : 'rgba(255,255,255,0.6)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(a - s, b - s); g.lineTo(a, b + s * 0.4); g.lineTo(a + s, b - s); g.stroke(); });
    }
    for (let i = 0; i < 26; i++) { const x = rnd() * w, y = rnd() * h; wrap(w, h, x, y, (a, b) => { for (let k = 0; k < 3; k++) { const an = k * 2.1; blob(g, a + Math.cos(an) * 2.6, b + Math.sin(an) * 2.6, 2.4, 'rgba(120,170,90,0.45)'); } }); }
  });
  // 모래: 작은 점과 조개 조각
  AC.sand = () => tex('sand', 256, (g, w, h) => {
    g.fillStyle = '#f0f0f0'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(170,150,110,0.35)' : 'rgba(255,255,255,0.9)'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
    for (let i = 0; i < 10; i++) { const x = rnd() * w, y = rnd() * h; g.fillStyle = 'rgba(255,200,200,0.8)'; g.beginPath(); g.ellipse(x, y, 4, 3, rnd() * 3, 0, Math.PI * 2); g.fill(); }
  });
  // 절벽: 동물의 숲 특유의 가로 줄무늬 지층
  AC.cliff = () => tex('cliff2', 256, (g, w, h) => {
    // 굵은 지층 띠 (밝은 황토 / 짙은 갈색 번갈아) + 둥근 돌 + 띠 경계 그림자
    let y = 0, k = 0;
    while (y < h) {
      const bh = 26 + rnd() * 26;
      const v = k % 2 ? 150 + rnd() * 25 : 215 + rnd() * 30;
      g.fillStyle = `rgb(${v | 0},${v * 0.97 | 0},${v * 0.93 | 0})`; g.fillRect(0, y, w, bh + 2);
      g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(0, y, w, 4);
      g.fillStyle = 'rgba(60,40,20,0.3)'; g.beginPath(); g.moveTo(0, y + bh); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + bh - 3 + Math.sin(x * 0.09 + k) * 3); g.lineTo(w, y + bh + 4); g.lineTo(0, y + bh + 4); g.fill();
      for (let i = 0; i < 5; i++) { const rx = rnd() * w, ry = y + 6 + rnd() * (bh - 12), rr = 4 + rnd() * 7; wrap(w, 0, rx, ry, (a, b) => { g.fillStyle = 'rgba(80,60,40,0.22)'; g.beginPath(); g.ellipse(a + 1, b + 2, rr * 1.4, rr, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.ellipse(a, b, rr * 1.3, rr * 0.8, 0, 0, Math.PI * 2); g.fill(); }); }
      y += bh; k++;
    }
  });
  // 흙길: 베이지 흙 + 조약돌, 양옆은 풀이 삐죽 (투명)
  AC.dirt = () => tex('dirt', 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#d6b27c';
    g.beginPath(); g.moveTo(22, 0);
    for (let y = 0; y <= h; y += 8) g.lineTo(18 + Math.sin(y * 0.19) * 6 + Math.sin(y * 0.07) * 5, y);
    for (let y = h; y >= 0; y -= 8) g.lineTo(w - 18 - Math.sin(y * 0.17 + 1) * 6 - Math.sin(y * 0.05) * 5, y);
    g.closePath(); g.fill();
    g.save(); g.clip();
    for (let i = 0; i < 40; i++) { const x = rnd() * w, y = rnd() * h; wrap(0, h, x, y, (a, b) => blob(g, a, b, 8 + rnd() * 14, 'rgba(200,165,115,0.35)')); }
    for (let i = 0; i < 90; i++) { const x = 30 + rnd() * (w - 60), y = rnd() * h, r = 1.5 + rnd() * 3.5; wrap(0, h, x, y, (a, b) => { blob(g, a, b + 1, r, 'rgba(120,90,60,0.35)'); blob(g, a, b, r, rnd() < 0.5 ? '#f2e2c4' : '#cdb08a'); }); }
    g.restore();
  });
  // 광장 / 대로 벽돌 포장
  AC.brickPath = () => tex('brickPath', 256, (g, w, h) => {
    g.fillStyle = '#d9d0c0'; g.fillRect(0, 0, w, h);
    const bw = 32, bh = 16;
    for (let y = 0; y < h; y += bh) for (let x = ((y / bh) % 2) * bw / 2 - bw; x < w; x += bw) {
      const v = 225 + rnd() * 30 | 0; g.fillStyle = `rgb(${v},${v - 18},${v - 40})`;
      g.beginPath(); g.roundRect ? g.roundRect(x + 2, y + 2, bw - 4, bh - 4, 4) : g.rect(x + 2, y + 2, bw - 4, bh - 4); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 4, y + 3, bw - 10, 2);
    }
  });
  // 아스팔트 (살짝 거친 점)
  AC.asphalt = () => tex('asphalt', 128, (g, w, h) => {
    g.fillStyle = '#e4e4e4'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.4)'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  });

  // ---------------------------------------------------------
  // 벽 / 지붕 (회색조 → 재질 색으로 물들임)
  // ---------------------------------------------------------
  const T = {};
  // 가로 판자 사이딩
  T.siding = () => tex('siding', 256, (g, w, h) => {
    g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, h);
    const n = 8, ph = h / n;
    for (let i = 0; i < n; i++) {
      const y = i * ph;
      g.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.3})`; g.fillRect(0, y, w, ph * 0.45);
      g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(0, y + ph - 4, w, 4);
      g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(0, y + ph - 8, w, 4);
      for (let k = 0; k < 3; k++) { g.strokeStyle = 'rgba(0,0,0,0.05)'; g.beginPath(); const yy = y + 5 + rnd() * (ph - 12); g.moveTo(0, yy); g.bezierCurveTo(w / 3, yy + 3, w * 2 / 3, yy - 3, w, yy); g.stroke(); }
    }
  });
  // 벽돌
  T.brick = () => tex('brick', 256, (g, w, h) => {
    g.fillStyle = '#fbfbfb'; g.fillRect(0, 0, w, h);
    const bw = 64, bh = 28;
    for (let y = 0; y < h; y += bh) for (let x = ((y / bh) % 2) * bw / 2 - bw; x < w; x += bw) {
      const v = 185 + rnd() * 45 | 0; g.fillStyle = `rgb(${v},${v},${v})`;
      g.beginPath(); g.roundRect ? g.roundRect(x + 3, y + 3, bw - 6, bh - 6, 5) : g.rect(x + 3, y + 3, bw - 6, bh - 6); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 6, y + 5, bw - 14, 3);
    }
  });
  // 회벽 (얼룩덜룩)
  T.plaster = () => tex('plaster', 256, (g, w, h) => {
    g.fillStyle = '#f0f0f0'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { const x = rnd() * w, y = rnd() * h; wrap(w, h, x, y, (a, b) => blob(g, a, b, 10 + rnd() * 30, `rgba(${rnd() < 0.5 ? '255,255,255' : '200,200,200'},0.18)`)); }
    for (let i = 0; i < 200; i++) { g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  });
  // 둥근 돌벽
  T.stone = () => tex('stone', 256, (g, w, h) => {
    g.fillStyle = '#b8b8b8'; g.fillRect(0, 0, w, h);
    let y = 0;
    while (y < h) {
      const rh = 30 + rnd() * 14; let x = -rnd() * 30;
      while (x < w) { const rw = 36 + rnd() * 40, v = 205 + rnd() * 40 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.ellipse(x + rw / 2, y + rh / 2, rw / 2 - 3, rh / 2 - 3, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(x + rw / 2 - 4, y + rh / 2 - 5, rw / 3, rh / 6, 0, 0, Math.PI * 2); g.fill(); x += rw; }
      y += rh;
    }
  });
  // 통나무
  T.log = () => tex('log', 256, (g, w, h) => {
    const n = 6, lh = h / n;
    for (let i = 0; i < n; i++) {
      const y = i * lh, gr = g.createLinearGradient(0, y, 0, y + lh);
      gr.addColorStop(0, '#bdbdbd'); gr.addColorStop(0.35, '#ffffff'); gr.addColorStop(1, '#8c8c8c');
      g.fillStyle = gr; g.fillRect(0, y, w, lh);
      for (let k = 0; k < 4; k++) { g.strokeStyle = 'rgba(0,0,0,0.08)'; g.beginPath(); const yy = y + 6 + rnd() * (lh - 12); g.moveTo(0, yy); g.lineTo(w, yy + (rnd() - 0.5) * 4); g.stroke(); }
    }
  });
  // 둥근 비늘 지붕널 (동물의 숲 지붕)
  T.shingle = () => tex('shingle', 256, (g, w, h) => {
    g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, w, h);
    const sw = 32, sh = 26;
    for (let r = -1; r < h / sh + 1; r++) {
      const y = r * sh, off = (r % 2) * sw / 2;
      for (let x = -sw + off; x < w + sw; x += sw) {
        const v = 215 + rnd() * 40 | 0;
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + sw, y); g.lineTo(x + sw, y + sh * 0.6); g.arc(x + sw / 2, y + sh * 0.6, sw / 2, 0, Math.PI); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 2; g.beginPath(); g.arc(x + sw / 2, y + sh * 0.6, sw / 2, 0, Math.PI); g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 5, y + 3, sw - 10, 3);
      }
    }
  });
  // 기와 (세로 물결)
  T.rooftile = () => tex('rooftile', 256, (g, w, h) => {
    const n = 8, tw = w / n;
    for (let i = 0; i < n; i++) { const gr = g.createLinearGradient(i * tw, 0, (i + 1) * tw, 0); gr.addColorStop(0, '#8a8a8a'); gr.addColorStop(0.45, '#ffffff'); gr.addColorStop(1, '#9a9a9a'); g.fillStyle = gr; g.fillRect(i * tw, 0, tw, h); }
    for (let y = 0; y < h; y += 32) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, y, w, 3); }
  });
  // 금속 지붕 (세로 이음)
  T.metal = () => tex('metal', 128, (g, w, h) => {
    g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(x, 0, 4, h); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(x + 4, 0, 3, h); }
  });
  // 세로 널판 (문, 데크)
  T.plank = () => tex('plank', 128, (g, w, h) => {
    g.fillStyle = '#eeeeee'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) { g.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.4})`; g.fillRect(x + 2, 0, 26, h); g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(x + 29, 0, 3, h); for (let k = 0; k < 3; k++) { g.strokeStyle = 'rgba(0,0,0,0.06)'; g.beginPath(); const xx = x + 6 + rnd() * 18; g.moveTo(xx, 0); g.lineTo(xx + (rnd() - 0.5) * 6, h); g.stroke(); } }
  });
  // 나뭇잎 덩어리 (나무/덤불)
  T.leaf = () => tex('leaf', 256, (g, w, h) => {
    g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { const x = rnd() * w, y = rnd() * h, r = 7 + rnd() * 12; wrap(w, h, x, y, (a, b) => { blob(g, a, b + 2, r, 'rgba(0,0,0,0.10)'); blob(g, a, b, r, `rgba(255,255,255,${0.35 + rnd() * 0.5})`); }); }
  });
  // 나무 껍질
  T.bark = () => tex('bark', 128, (g, w, h) => {
    g.fillStyle = '#dcdcdc'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 18; i++) { g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 2 + rnd() * 2; g.beginPath(); const x = rnd() * w; g.moveTo(x, 0); g.bezierCurveTo(x + 8, h / 3, x - 8, h * 2 / 3, x + (rnd() - 0.5) * 10, h); g.stroke(); }
  });
  // 모던 패널 (유리 빌딩 사이 기둥)
  T.panel = () => tex('panel', 128, (g, w, h) => {
    g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4);
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(6, 6, w - 12, 6);
  });
  AC.T = T;

  // 차양막 줄무늬 (두 색)
  AC.stripe = (c1, c2) => tex('stripe' + c1 + c2, 128, (g, w, h) => { for (let x = 0; x < w; x += 32) { g.fillStyle = (x / 32) % 2 ? c2 : c1; g.fillRect(x, 0, 32, h); } g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 0, w, 10); });
  // 창문 (십자 창살 + 커튼)
  AC.windowTex = (curtain = '#ffb3c6', lit) => tex('win' + curtain + (lit ? 'L' : ''), 128, (g, w, h) => {
    g.fillStyle = lit ? '#fff2b8' : '#a8ddf5'; g.fillRect(0, 0, w, h);
    if (!lit) { g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.moveTo(10, 60); g.lineTo(44, 10); g.lineTo(60, 10); g.lineTo(26, 60); g.fill(); }
    g.fillStyle = curtain;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(34, 0); g.quadraticCurveTo(26, 60, 12, 128); g.lineTo(0, 128); g.fill();
    g.beginPath(); g.moveTo(w, 0); g.lineTo(w - 34, 0); g.quadraticCurveTo(w - 26, 60, w - 12, 128); g.lineTo(w, 128); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 0, w, 8);
    g.fillStyle = '#ffffff'; g.fillRect(w / 2 - 4, 0, 8, h); g.fillRect(0, h / 2 - 4, w, 8);
  });

  // ---------------------------------------------------------
  // UV: 면 방향에 따라 월드 크기로 (scale m = 1타일)
  // mode 'roof': 윗면은 u=z(용마루 방향), v=x(경사 방향)
  // ---------------------------------------------------------
  function wuv(g0, scale = 1, mode) {
    const g = g0.index ? g0.toNonIndexed() : g0.clone();
    const p = g.attributes.position, n = g.attributes.normal;
    const uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
      let u, v;
      if (ay >= ax && ay >= az) { if (mode === 'roof') { u = z; v = x; } else { u = x; v = z; } }
      else if (ax >= az) { u = z * Math.sign(n.getX(i) || 1); v = y; }
      else { u = x * -Math.sign(n.getZ(i) || 1) * -1; v = y; }
      uv[i * 2] = u / scale; uv[i * 2 + 1] = v / scale;
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    return g;
  }
  AC.wuv = wuv;
  const scaleUV = (g0, su, sv) => { const g = g0.clone(); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return g; };
  AC.scaleUV = scaleUV;

  // 재질 (무늬 + 색) — 캐시해서 bake 때 합쳐지도록
  const mcache = new Map();
  function tm(kind, color = 0xffffff, extra) {
    const k = kind + ':' + color + ':' + (extra || '');
    if (mcache.has(k)) return mcache.get(k);
    const map = T[kind] ? T[kind]() : null;
    const m = soften(new THREE.MeshLambertMaterial({ map, color }), 0.3);
    mcache.set(k, m); return m;
  }
  AC.tm = tm;
  // 창문 유리 재질 (밤에 불이 켜짐)
  const winMats = new Map();
  function winMat(curtain = '#ffb3c6') {
    if (!winMats.has(curtain)) winMats.set(curtain, new THREE.MeshLambertMaterial({ map: AC.windowTex(curtain), emissive: 0x000000 }));
    return winMats.get(curtain);
  }
  AC.winMat = winMat;
  AC.setNight = function (k) { for (const m of winMats.values()) m.emissive.setRGB(1.0 * k, 0.78 * k, 0.4 * k); };
  // 무늬 입힌 상자
  function tbox(w, h, d, kind, color, x = 0, y = 0, z = 0, r = 0.06, scale = 1, mode) {
    const key = `tb${w},${h},${d},${r},${scale},${mode || ''}`;
    const g = geo(key, () => wuv(box(w, h, d, r), scale, mode));
    return mesh(g, tm(kind, color), x, y + h / 2, z);
  }
  AC.tbox = tbox;

  // ---------------------------------------------------------
  // 건물 부품
  // ---------------------------------------------------------
  const K = (AC.K = {});
  // 박공 지붕 (용마루가 x축 방향) — 두 장의 널빤지 + 삼각 박공벽
  K.gable = function (w, d, rise, color, o = {}) {
    const g = new THREE.Group();
    const over = o.over !== undefined ? o.over : 0.6, th = 0.3;
    const half = d / 2 + over;
    const slope = Math.hypot(half, rise * (half / (d / 2))), ang = Math.atan2(rise, d / 2);
    const len = w + over * 2;
    for (const s of [-1, 1]) {
      const gg = geo(`gab${len},${slope.toFixed(3)}`, () => wuv(box(len, th, slope, 0.12), 1));
      const piv = new THREE.Group(); piv.position.set(0, rise + 0.12, 0); piv.rotation.x = s * ang;
      piv.add(mesh(gg, tm(o.kind || 'shingle', color), 0, 0, s * slope / 2));
      g.add(piv);
    }
    const ridge = mesh(cyl(0.2, 0.2, len + 0.1, 12), H.mat(o.ridge || shade(color, 0.78)), 0, rise + 0.22, 0); ridge.rotation.z = Math.PI / 2; g.add(ridge);
    if (o.wallKind !== false) {
      const tri = geo(`tri${d},${rise}`, () => { const sh = new THREE.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(0, rise); sh.lineTo(d / 2, 0); sh.lineTo(-d / 2, 0); const e = new THREE.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: false }); e.rotateY(Math.PI / 2); e.computeVertexNormals(); return wuv(e, 1); });
      for (const s of [-1, 1]) g.add(mesh(tri, tm(o.wallKind || 'siding', o.wallColor || 0xffffff), s > 0 ? w / 2 - 0.2 : -w / 2, 0, 0));
      // 박공 동그란 창
      if (o.gableWindow !== false) for (const s of [-1, 1]) { const r = Math.min(0.45, rise * 0.22); const c = mesh(geo(`gw${r}`, () => new THREE.CircleGeometry(r, 20)), winMat('#ffe0a0'), s * (w / 2 + 0.01), rise * 0.4, 0); c.rotation.y = s * Math.PI / 2; g.add(c); const rr = mesh(geo(`gwr${r}`, () => new THREE.TorusGeometry(r, 0.06, 8, 20)), H.mat(0xffffff), s * (w / 2 + 0.02), rise * 0.4, 0); rr.rotation.y = Math.PI / 2; g.add(rr); }
    }
    return g;
  };
  // 원뿔 지붕 (탑, 굴뚝, 정자)
  K.cone = function (r, h, color, kind = 'shingle', seg = 18) {
    const g = geo(`kc${r},${h},${seg}`, () => scaleUV(new THREE.ConeGeometry(r, h, seg, 3), Math.PI * 2 * r / 1.2, h / 0.9));
    return mesh(g, tm(kind, color));
  };
  // 반구 돔
  K.dome = function (r, color, kind = 'shingle') {
    const g = geo(`kd${r}`, () => scaleUV(new THREE.SphereGeometry(r, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), Math.PI * 2 * r / 1.3, r * 1.6 / 1.1));
    return mesh(g, tm(kind, color));
  };
  // 창문: 틀 + 유리(커튼) + 덧창 + 화분 상자 (벽면 +z 기준)
  K.window = function (w = 1.2, h = 1.3, o = {}) {
    const g = new THREE.Group();
    const frame = o.frame || 0xffffff;
    g.add(mesh(box(w + 0.24, h + 0.24, 0.14, 0.05), H.mat(frame), 0, 0, 0.02));
    if (o.arch) { const a = mesh(geo(`warch${w}`, () => new THREE.CylinderGeometry(w / 2 + 0.12, w / 2 + 0.12, 0.14, 20, 1, false, Math.PI / 2, Math.PI)), H.mat(frame), 0, h / 2, 0.02); a.rotation.x = Math.PI / 2; g.add(a); const ag = mesh(geo(`warchg${w}`, () => new THREE.CircleGeometry(w / 2, 20, 0, Math.PI)), winMat(o.curtain), 0, h / 2, 0.1); g.add(ag); }
    const glass = mesh(geo(`wgl${w},${h}`, () => new THREE.PlaneGeometry(w, h)), winMat(o.curtain), 0, 0, 0.1);
    g.add(glass);
    if (o.shutters) for (const s of [-1, 1]) {
      const sh = mesh(geo(`wsh${h}`, () => wuv(box(w * 0.42, h + 0.1, 0.07, 0.03), 0.5)), tm('siding', o.shutters), s * (w / 2 + w * 0.26), 0, 0.08);
      g.add(sh);
    }
    if (o.box !== false) {
      g.add(mesh(box(w + 0.3, 0.22, 0.34, 0.05), tm('plank', o.boxColor || 0x9a6a44), 0, -h / 2 - 0.2, 0.2));
      const cols = [0xff6f86, 0xffd84a, 0xffffff, 0xff9a3d, 0xb69cff];
      for (let i = 0; i < Math.round(w * 4); i++) { const x = -w / 2 + 0.1 + i * (w - 0.2) / Math.max(1, Math.round(w * 4) - 1); g.add(mesh(sphere(0.09, 10, 8), H.mat(0x5fae4a), x, -h / 2 - 0.05, 0.22)); if (i % 2 === 0) g.add(mesh(sphere(0.07, 10, 8), H.mat(cols[(i / 2 + (o.seed || 0)) % cols.length | 0]), x, -h / 2 + 0.02, 0.28)); }
    }
    return g;
  };
  // 문: 판자 문 + 문틀 + 둥근 창 + 계단 + 벽등
  K.door = function (w = 1.3, h = 2.2, color = 0x8a5a3b, o = {}) {
    const g = new THREE.Group();
    g.add(mesh(box(w + 0.3, h + 0.2, 0.16, 0.05), H.mat(o.frame || 0xffffff), 0, h / 2 + 0.05, 0));
    if (o.arch) { const a = mesh(geo(`darch${w}`, () => new THREE.CylinderGeometry(w / 2 + 0.15, w / 2 + 0.15, 0.16, 20, 1, false, Math.PI / 2, Math.PI)), H.mat(o.frame || 0xffffff), 0, h, 0); a.rotation.x = Math.PI / 2; g.add(a); const b = mesh(geo(`darch2${w}`, () => new THREE.CylinderGeometry(w / 2, w / 2, 0.2, 20, 1, false, Math.PI / 2, Math.PI)), tm('plank', color), 0, h, 0.02); b.rotation.x = Math.PI / 2; g.add(b); }
    g.add(mesh(geo(`dr${w},${h}`, () => wuv(box(w, h, 0.2, 0.04), 1)), tm('plank', color), 0, h / 2, 0.03));
    const win = mesh(geo('dwin', () => new THREE.CircleGeometry(0.2, 18)), winMat('#ffe4a0'), 0, h * 0.72, 0.14); g.add(win);
    g.add(mesh(sphere(0.07, 10, 8), H.mat(0xffd23a), w * 0.32, h * 0.48, 0.16));
    if (o.step !== false) { g.add(mesh(geo(`dst${w}`, () => wuv(box(w + 0.9, 0.18, 0.8, 0.06), 1)), tm('stone', 0xe8e0d0), 0, 0, 0.45)); }
    if (o.lamp !== false) { const l = new THREE.Group(); l.position.set(w / 2 + 0.45, h * 0.8, 0.15); l.add(mesh(box(0.08, 0.3, 0.2, 0.02), H.mat(0x3a3a44), 0, 0, 0)); const bulb = mesh(sphere(0.13, 12, 10), PM().glowMat(0xffe8a0), 0, -0.05, 0.18); bulb.userData.noBake = true; l.add(bulb); l.add(mesh(geo('lampcap', () => new THREE.ConeGeometry(0.17, 0.14, 12)), H.mat(0x3a3a44), 0, 0.12, 0.18)); g.add(l); }
    if (o.mat !== false) { const mt = mesh(box(w, 0.03, 0.6, 0.01), H.mat(o.matColor || 0xff8f6a), 0, 0.2, 0.55); mt.castShadow = false; g.add(mt); }
    return g;
  };
  // 줄무늬 차양 + 물결 끝단
  K.awning = function (w, depth, c1, c2, o = {}) {
    const g = new THREE.Group();
    const css = n => '#' + n.toString(16).padStart(6, '0');
    const key = 'awm' + c1 + c2;
    if (!mcache.has(key)) mcache.set(key, soften(new THREE.MeshLambertMaterial({ map: AC.stripe(css(c1), css(c2)) }), 0.3));
    const sl = mesh(geo(`aw${w},${depth}`, () => wuv(new THREE.BoxGeometry(w, 0.08, depth), 0.9)), mcache.get(key), 0, 0, depth / 2);
    g.add(sl);
    const n = Math.max(2, Math.round(w / 0.45));
    for (let i = 0; i < n; i++) { const x = -w / 2 + (i + 0.5) * w / n; const sc = mesh(geo('awsc' + (w / n).toFixed(2), () => new THREE.CylinderGeometry(w / n / 2, w / n / 2, 0.06, 14, 1, false, 0, Math.PI)), H.mat(i % 2 ? c2 : c1), x, -0.02, depth); sc.rotation.set(Math.PI / 2, 0, Math.PI); g.add(sc); }
    g.rotation.x = o.tilt !== undefined ? o.tilt : 0.35;
    return g;
  };
  // 굴뚝
  K.chimney = function (h = 1.8, color = 0xd27a5a) {
    const g = new THREE.Group();
    g.add(tbox(0.8, h, 0.8, 'brick', color, 0, 0, 0, 0.05, 0.8));
    g.add(mesh(box(1, 0.2, 1, 0.05), H.mat(shade(color, 0.8)), 0, h + 0.1, 0));
    return g;
  };
  // 화분 (둥근 덤불)
  K.planter = function (color = 0xd9a066, flower) {
    const g = new THREE.Group();
    g.add(mesh(lathe('pot', [[0.0001, 0], [0.3, 0], [0.38, 0.45], [0.42, 0.5], [0.0001, 0.5]], 16), H.mat(color)));
    const b = mesh(sphere(0.42, 14, 10), tm('leaf', 0x6cc25a), 0, 0.75, 0); g.add(b);
    if (flower) for (let i = 0; i < 5; i++) { const a = i * 1.26; g.add(mesh(sphere(0.08, 8, 6), H.mat(flower), Math.cos(a) * 0.3, 0.85 + (i % 2) * 0.15, Math.sin(a) * 0.3)); }
    return g;
  };
  // 매다는 간판 (브래킷 + 판)
  K.hangSign = function (text, bg, fg, w = 1.6) {
    const g = new THREE.Group();
    g.add(mesh(box(0.08, 0.08, 1.1, 0.02), H.mat(0x3a3a44), 0, 0, 0.55));
    const s = PM().sign(text, w, w * 0.45, bg, fg); s.position.set(0, -0.5, 1); s.rotation.y = Math.PI / 2; g.add(s);
    const s2 = PM().sign(text, w, w * 0.45, bg, fg); s2.position.set(0, -0.5, 1); s2.rotation.y = -Math.PI / 2; g.add(s2);
    return g;
  };
  // 기단 (돌)
  K.base = function (w, d, h = 0.5, color = 0xd8d0c0) { return tbox(w + 0.4, h, d + 0.4, 'stone', color, 0, -0.02, 0, 0.08, 1.2); };

  function shade(c, k) { const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255; return (Math.round(r * k) << 16) | (Math.round(g * k) << 8) | Math.round(b * k); }
  AC.shade = shade;
  const PM = () => FM.PM;
})();
