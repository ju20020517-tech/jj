/* =========================================================
 *  시립 도서관 복층 리뉴얼 (14×11 → 18×14, 벽 높이 5.8m)
 *   1층 (사진 1) : 스테인드글라스 아치 창 · 마호가니 책장 벽 · 벽돌 벽난로 & 장미 넝쿨 · 나침반 모자이크 바닥 · 파이프 오르간
 *                  · 괘종시계 · 타자기 책상 · 주크박스 · 황금 새집 조명 · 지구본 · 체크 방석 · 이동식 사다리
 *   2층 (사진 2) : 원목 복층 라운지 (오크 책장 난간 · 가죽 암체어 · 원형 테이블 · 플로어 램프 · 이젤 · 선인장) + 계단
 *   1층 앞 (사진 2 아래) : 북카페 (줄무늬 비스트로 의자 · 원목 테이블 & 커피 · 흔들의자)
 *  햇살: 높은 아치 창에서 비스듬히 내려오는 빛줄기 · 바닥에 떨어진 색유리 빛 · 먼지 반짝이 · 해 방향 그림자
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, RK = FM.RoomKit;
  const { K, T, P, def, ctex, glow, glass, mesh, geo, M } = RK._h;
  const { star, rrect, tm, cm, pic, rug, plane } = RK._h3;
  const { halo, beam, dust, additive, radial } = RK._h5;
  const PI = Math.PI;
  const f = (type, x, z, rot = 0, y = 0) => ({ type, x, z, rot, y });
  const now = () => performance.now() / 1000;
  const MAH = 0x5a2a1c, MAH2 = 0x3e1a12, OAK = 0xc89060, OAK2 = 0xa8703e;
  const MEZZ_Y = 2.6;

  // ---------------------------------------------------------
  // 복층 높이 (캐릭터가 2층 · 계단 위를 걸음)
  // ---------------------------------------------------------
  FM.levelY = function (loc, x, z) {
    const I = FM.INTERIORS[loc]; if (!I || !I.levels) return 0;
    for (const L of I.levels) {
      if (x < L.x0 || x > L.x1 || z < L.z0 || z > L.z1) continue;
      if (L.ramp) { const t = (z - L.z1) / (L.z0 - L.z1); return Math.max(0, Math.min(1, t)) * L.y; }
      return L.y;
    }
    return 0;
  };

  // ---------------------------------------------------------
  // 텍스처
  // ---------------------------------------------------------
  Object.assign(RK.WALLS, {
    libwall: { tileW: 2.0, w: 256, h: 768, draw: (g, w, h) => {   // 크림 회벽 + 마호가니 징두리 + 크라운 몰딩
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e8d0b0'); gr.addColorStop(1, '#f4e2c4'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${i % 2 ? '255,245,225' : '150,100,60'},0.04)`; g.beginPath(); g.ellipse((i * 67) % w, (i * 131) % h, 10 + i % 18, 6 + i % 7, i, 0, 7); g.fill(); }
      g.fillStyle = '#6a3424'; g.fillRect(0, 0, w, 18); g.fillStyle = '#8a4a30'; g.fillRect(0, 18, w, 6);
      const wy = h * 0.72; g.fillStyle = '#6a3222'; g.fillRect(0, wy, w, h - wy); g.fillStyle = '#7a3c28'; g.fillRect(0, wy, w, 10);
      for (let x = 8; x < w; x += 64) { g.strokeStyle = 'rgba(30,10,5,0.45)'; g.lineWidth = 3; g.strokeRect(x, wy + 22, 48, h - wy - 44); g.strokeStyle = 'rgba(255,200,160,0.12)'; g.strokeRect(x + 3, wy + 25, 42, h - wy - 50); }
      g.fillStyle = '#3e1a12'; g.fillRect(0, h - 14, w, 14);
    } },
  });
  const tone = (c, k) => { const q = v => Math.min(255, Math.max(0, Math.round(v * k))); return `rgb(${q((c >> 16) & 255)},${q((c >> 8) & 255)},${q(c & 255)})`; };
  Object.assign(FM.FLOOR_DRAW, {
    libstone(g, w, h, c) {   // 라일락 그레이 · 베이지 석재 타일 + 마름모 인레이 + 블루 테두리 줄
      const s = 32; for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
        const alt = ((x + y) / s) % 2; g.fillStyle = alt ? tone(c, 0.92) : '#c8b8a8'; g.fillRect(x, y, s, s);
        for (let i = 0; i < 4; i++) { g.strokeStyle = 'rgba(120,100,120,0.12)'; g.beginPath(); g.moveTo(x + (i * 17) % s, y); g.bezierCurveTo(x + 20, y + 20, x + 40, y + 44, x + (i * 29) % s, y + s); g.stroke(); }
        g.fillStyle = '#8a6a5a'; g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x + 5, y); g.lineTo(x, y + 5); g.lineTo(x - 5, y); g.fill(); g.fillStyle = '#c8b090'; g.beginPath(); g.moveTo(x, y - 2.5); g.lineTo(x + 2.5, y); g.lineTo(x, y + 2.5); g.lineTo(x - 2.5, y); g.fill();
        g.fillStyle = 'rgba(70,60,70,0.35)'; g.fillRect(x, y, s, 1.5); g.fillRect(x, y, 1.5, s);
      }
      g.fillStyle = 'rgba(90,120,150,0.45)'; g.fillRect(0, 126, w, 4); g.fillRect(126, 0, 4, h);
    },
    libplank(g, w, h, c) {   // 따뜻한 오크 판재 (북카페)
      for (let y = 0; y < h; y += 32) for (let x = -((y / 32) % 4) * 32; x < w; x += 128) { g.fillStyle = tone(c, 0.88 + ((((x + 128) / 32 + y / 32) % 4)) * 0.05); g.fillRect(x, y, 128, 32); g.strokeStyle = 'rgba(90,40,10,0.15)'; for (let i = 0; i < 3; i++) { const gy = y + 8 + i * 8; g.beginPath(); g.moveTo(x + 4, gy); g.bezierCurveTo(x + 40, gy - 3, x + 80, gy + 3, x + 124, gy); g.stroke(); } g.fillStyle = 'rgba(60,25,10,0.4)'; g.fillRect(x, y, 2, 32); g.fillRect(x, y, 128, 1.5); }
    },
  });
  Object.assign(FM.D.FLOOR_SOUND || {}, { libstone: '또각', libplank: '삐걱' });

  // 책등 (사진처럼 주황 · 러스트 레드 · 네이비 · 세이지 · 크림, 금박 띠)
  const SPINES = ['#d8782a', '#b8321e', '#2a3a5a', '#7a8a5a', '#e8c890', '#a84a2a', '#3a5a4a', '#c8602a', '#5a2a1a', '#e8a050', '#8a2a1e', '#4a5a7a'];
  const bookRow = (key, seed) => tm('k10bk' + key, 256, 64, (c, w, h) => {
    c.fillStyle = '#2a120a'; c.fillRect(0, 0, w, h); let x = 1, i = seed;
    while (x < w - 4) {
      const bw = 8 + ((i * 7) % 7), bh = h - 6 - ((i * 13) % 12), col = SPINES[(i * 5 + seed) % SPINES.length];
      if ((i * 11) % 17 === 0) { c.save(); c.translate(x + bw, h); c.rotate(-0.18); c.fillStyle = col; c.fillRect(-bw, -bh, bw, bh); c.restore(); x += bw + 6; i++; continue; }
      c.fillStyle = col; c.fillRect(x, h - bh, bw, bh);
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + bw - 1.5, h - bh, 1.5, bh); c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x + 1, h - bh, 1.5, bh);
      c.fillStyle = 'rgba(232,196,110,0.85)'; if (i % 2) { c.fillRect(x + 1, h - bh + 5, bw - 2, 1.5); c.fillRect(x + 1, h - 8, bw - 2, 1.5); } else { c.fillRect(x + 2, h - bh + 10, bw - 4, 5); }
      x += bw + 0.5; i++;
    }
  });
  const ROWS = Array.from({ length: 8 }, (_, i) => bookRow('r' + i, i * 3 + 1));

  // =========================================================
  // 스테인드글라스 아치 창
  // =========================================================
  const GLASS = ['#f0c060', '#e8806a', '#9ac87a', '#7aa8e0', '#f8e0b0', '#e89048', '#b890e0'];
  const archW = 1.9, archH = 2.5, archR = archW / 2;
  const stainedTex = ctex('k10stained', 256, 340, (c, w, h) => {
    const R = w / 2, cy = R; // 아치 중심 (위쪽 반원)
    c.fillStyle = '#fff4dc'; c.fillRect(0, 0, w, h);
    // 부채꼴 트레이서리 (위 반원)
    const rings = [R * 0.28, R * 0.62, R * 0.96];
    for (let r = 0; r < 3; r++) { const n = [6, 10, 14][r]; for (let i = 0; i < n; i++) { const a0 = PI + i / n * PI, a1 = PI + (i + 1) / n * PI; c.fillStyle = GLASS[(i * 3 + r * 2) % GLASS.length]; c.beginPath(); c.moveTo(R + Math.cos(a0) * (r ? rings[r - 1] : 0), cy + Math.sin(a0) * (r ? rings[r - 1] : 0)); c.arc(R, cy, rings[r], a0, a1); c.arc(R, cy, r ? rings[r - 1] : 0.01, a1, a0, true); c.closePath(); c.fill(); } }
    c.fillStyle = '#f8f0d8'; c.beginPath(); c.arc(R, cy, rings[0] * 0.55, PI, 0); c.fill();
    // 아래 격자 (중국풍 기하 창살)
    const top = cy, cols = 4, rows = 6, cw = w / cols, rh = (h - top) / rows;
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) { const x = q * cw, y = top + r * rh; const edge = q === 0 || q === cols - 1 || r === 0; c.fillStyle = edge ? GLASS[(q + r * 2) % GLASS.length] : ((q + r) % 2 ? '#fbf2dc' : '#f4ead0'); c.fillRect(x, y, cw, rh); if (!edge) { c.fillStyle = 'rgba(200,170,120,0.35)'; c.fillRect(x + cw * 0.3, y + rh * 0.3, cw * 0.4, rh * 0.4); } }
    // 리딩 (납 선)
    c.strokeStyle = '#3a2418'; c.lineWidth = 5;
    for (const r of rings) { c.beginPath(); c.arc(R, cy, r, PI, 0); c.stroke(); }
    for (let i = 0; i <= 14; i++) { const a = PI + i / 14 * PI; c.beginPath(); c.moveTo(R + Math.cos(a) * rings[0], cy + Math.sin(a) * rings[0]); c.lineTo(R + Math.cos(a) * rings[2], cy + Math.sin(a) * rings[2]); c.stroke(); }
    c.lineWidth = 4; for (let q = 1; q < cols; q++) { c.beginPath(); c.moveTo(q * cw, top); c.lineTo(q * cw, h); c.stroke(); } for (let r = 0; r <= rows; r++) { c.beginPath(); c.moveTo(0, top + r * rh); c.lineTo(w, top + r * rh); c.stroke(); }
    c.lineWidth = 2; for (let r = 0; r < rows; r++) for (let q = 1; q < cols - 1; q++) { const x = q * cw, y = top + r * rh; c.strokeRect(x + cw * 0.3, y + rh * 0.3, cw * 0.4, rh * 0.4); c.beginPath(); c.moveTo(x, y + rh / 2); c.lineTo(x + cw * 0.3, y + rh / 2); c.moveTo(x + cw * 0.7, y + rh / 2); c.lineTo(x + cw, y + rh / 2); c.moveTo(x + cw / 2, y); c.lineTo(x + cw / 2, y + rh * 0.3); c.moveTo(x + cw / 2, y + rh * 0.7); c.lineTo(x + cw / 2, y + rh); c.stroke(); }
    // 햇빛이 비치는 느낌 (위쪽이 더 밝게)
    const sg = c.createRadialGradient(w * 0.35, h * 0.2, 10, w * 0.35, h * 0.2, h * 0.8); sg.addColorStop(0, 'rgba(255,255,230,0.35)'); sg.addColorStop(1, 'rgba(255,220,160,0)'); c.fillStyle = sg; c.fillRect(0, 0, w, h);
  });
  const stainedMat = new THREE.MeshBasicMaterial({ map: stainedTex });
  const archShape = (W, H) => { const s = new THREE.Shape(), r = W / 2; s.moveTo(-r, 0); s.lineTo(-r, H - r); s.absarc(0, H - r, r, PI, 0, true); s.lineTo(r, 0); s.lineTo(-r, 0); return s; };
  const archGeo = geo('k10archg', () => { const g2 = new THREE.ShapeGeometry(archShape(archW, archH), 24); const uv = g2.attributes.uv, pos = g2.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / archW + 0.5, pos.getY(i) / archH); return g2; });
  const frameGeo = geo('k10archf', () => { const o = archShape(archW + 0.32, archH + 0.16); o.holes.push(new THREE.Path(archShape(archW, archH).getPoints(40).map(p => new THREE.Vector2(p.x, p.y + 0.0)))); return new THREE.ExtrudeGeometry(o, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }); });
  def('k10_arch_window', '스테인드글라스 아치 창 (햇살)', 'wall', 3000, 2.3, 0.3, g => {
    const k = K(g), y0 = 3.05;
    k.add(mesh(archGeo, stainedMat, 0, y0, 0.04, false));
    k.add(mesh(frameGeo, T.woodgrain(MAH), 0, y0 - 0.08, 0.02));
    k.b(archW + 0.5, 0.12, 0.3, T.woodgrain(MAH), 0, y0 - 0.1, 0.12, 0.02);
    halo(k, 1.5, 0xfff0c8, 0, y0 + 1.6, 0.25, 0.3);
  }, { wall: true, tags: ['window'], lamp: [[0, 3.8, 1.2, 0xffe8b8, 0.75, 7]] });
  // 색유리 빛 (창 → 바닥으로 떨어지는 빛줄기 · 무지갯빛 창 모양 빛 · 먼지)
  const stainPatch = ctex('k10stpatch', 128, 170, (c, w, h) => { c.drawImage(stainedTex.image, 0, 0, w, h); const d = c.getImageData(0, 0, w, h), a = d.data; for (let i = 0; i < a.length; i += 4) { const lum = (a[i] + a[i + 1] + a[i + 2]) / 3; if (lum < 90) { a[i] = a[i + 1] = a[i + 2] = 0; } else { a[i] *= 0.95; a[i + 1] *= 0.9; a[i + 2] *= 0.75; } } c.putImageData(d, 0, 0); c.globalCompositeOperation = 'destination-in'; c.beginPath(); c.moveTo(0, h); c.lineTo(0, w / 2); c.arc(w / 2, w / 2, w / 2, PI, 0); c.lineTo(w, h); c.fill(); });
  const patchMat = new THREE.MeshBasicMaterial({ map: stainPatch, color: 0xffc890, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false });
  def('k10_sunlight', '햇살 빛줄기 & 색유리 바닥 빛', 'misc', 500, 0.3, 0.3, g => {
    const k = K(g);
    for (const [x, wd, op] of [[-0.45, 0.55, 0.16], [0.05, 0.75, 0.2], [0.55, 0.5, 0.15]]) beam(k, wd, 5.6, 0xffe4b0, x, 2.35, 1.1, 0.72, -0.1, op);
    const p = k.add(mesh(geo('k10patch', () => new THREE.PlaneGeometry(1.7, 2.3)), patchMat, 0.35, 0.03, 3.1, false)); p.rotation.x = -PI / 2; p.renderOrder = 3;
    dust(k, 30, 0xfff4d8, -0.9, 1.2, 0.5, 4.2, 0.4, 3.0, 0.012);
  }, { tags: ['light'], lamp: [] });
  def('k10_rose_cascade', '크림 장미 넝쿨 (창에 드리운)', 'wall', 900, 0.9, 0.4, g => { const k = K(g); for (let i = 0; i < 26; i++) { const y = 4.9 - i * 0.1, x = Math.sin(i * 0.9) * 0.18 * (1 - i / 30); k.s(0.07, i % 2 ? 0x4a6a3a : 0x6a8a4a, x + 0.1, y, 0.3, 1.3, 0.5, 0.6).rotation.z = i; if (i % 2 === 0 && i < 22) { k.s(0.08, 0xfbecd0, x - 0.02, y, 0.34); k.s(0.045, 0xf0d8b0, x - 0.02, y + 0.01, 0.4); } } for (let i = 0; i < 10; i++) k.s(0.025, 0xfbf4e0, Math.sin(i) * 0.12, 2.6 - i * 0.05, 0.35); }, { wall: true, tags: ['flower'] });

  // =========================================================
  // 1층 가구 (사진 1)
  // =========================================================
  const shelvesCase = (k, W, H, D, col, rows, seed, trimCol) => { const wd = T.woodgrain(col); k.b(W, H, 0.06, M(0x2a120a), 0, H / 2, -D / 2 + 0.03); for (const sx of [-1, 1]) k.b(0.07, H, D, wd, sx * (W / 2 - 0.035), H / 2, 0, 0.01); k.b(W, 0.12, D + 0.04, wd, 0, H - 0.06, 0.01, 0.02); k.b(W + 0.08, 0.06, D + 0.08, trimCol || wd, 0, H, 0.02, 0.02); k.b(W, 0.14, D, wd, 0, 0.07, 0, 0.01); const rh = (H - 0.3) / rows; for (let r = 0; r < rows; r++) { const y = 0.14 + r * rh; k.b(W - 0.1, 0.035, D - 0.02, wd, 0, y, 0.01, 0.005); k.b(W - 0.14, rh - 0.06, 0.02, ROWS[(r + seed) % ROWS.length], 0, y + rh / 2 + 0.01, D / 2 - 0.12, 0.003); } };
  def('k10_tall_bookcase', '마호가니 대형 책장', 'work', 2600, 1.6, 0.5, g => { const k = K(g); shelvesCase(k, 1.6, 2.9, 0.48, MAH, 7, 0); }, { tags: ['books'], use: [{ pose: 'read', dx: 0, dz: 0.8, face: 180, act: 'read_book' }] });
  def('k10_tall_bookcase_b', '마호가니 대형 책장 (다른 책)', 'work', 2600, 1.6, 0.5, g => { const k = K(g); shelvesCase(k, 1.6, 2.9, 0.48, MAH, 7, 3); }, { tags: ['books'], use: [{ pose: 'read', dx: 0, dz: 0.8, face: 180, act: 'read_book' }] });
  def('k10_ladder', '이동식 도서관 사다리', 'misc', 700, 0.6, 0.6, g => { const k = K(g), wd = T.woodgrain(MAH); for (const x of [-0.22, 0.22]) { const r = k.b(0.05, 2.9, 0.06, wd, x, 1.4, 0); r.rotation.x = -0.28; } for (let i = 0; i < 8; i++) { const y = 0.25 + i * 0.34; k.b(0.44, 0.04, 0.08, wd, 0, y, -Math.tan(0.28) * (y - 1.4) * -1 * 0 + (1.4 - y) * 0.29, 0.01); } k.c(0.012, 0.012, 1.6, 0xc8a060, 0, 2.95, -0.4).rotation.z = PI / 2; }, { tags: ['books'] });
  const brick = tm('k10brick', 128, 128, (c, w, h) => { c.fillStyle = '#e8c8a8'; c.fillRect(0, 0, w, h); for (let r = 0, y = 0; y < h; y += 16, r++) for (let x = -(r % 2) * 16; x < w; x += 32) { c.fillStyle = ['#d8603a', '#c8502e', '#e07048', '#b84a2a'][((x + y) / 16 | 0) % 4]; rrect(c, x + 1.5, y + 1.5, 29, 13, 2); c.fill(); c.fillStyle = 'rgba(255,220,180,0.15)'; c.fillRect(x + 3, y + 3, 24, 2); } });
  def('k10_fireplace', '벽돌 벽난로 (책 · 테라리움)', 'smart', 3200, 2.2, 0.8, g => {
    const k = K(g); k.b(2.2, 1.5, 0.7, brick, 0, 0.75, 0, 0.02); k.b(2.4, 0.12, 0.85, T.woodgrain(MAH), 0, 1.56, 0.02, 0.02);
    const fb = new THREE.Shape(); fb.moveTo(-0.5, 0); fb.lineTo(-0.5, 0.5); fb.absarc(0, 0.5, 0.5, PI, 0, true); fb.lineTo(0.5, 0); fb.lineTo(-0.5, 0); k.add(mesh(geo('k10fb', () => new THREE.ShapeGeometry(fb, 16)), M(0x1a0c08), 0, 0.12, 0.352, false));
    k.b(1.0, 0.12, 0.3, 0x2a2a2a, 0, 0.18, 0.2, 0.01); for (let i = 0; i < 3; i++) k.c(0.05, 0.05, 0.6, 0x5a3420, -0.15 + i * 0.15, 0.28, 0.15).rotation.z = PI / 2 + (i - 1) * 0.3;
    const fl = [k.cone(0.14, 0.45, glow(0xff8a2a), 0, 0.5, 0.18), k.cone(0.09, 0.32, glow(0xffd060), 0.08, 0.45, 0.22), k.cone(0.08, 0.28, glow(0xffb040), -0.1, 0.43, 0.2)];
    fl.forEach((o, i) => { o.userData.noBake = true; o.onBeforeRender = () => { const t = now(); o.scale.set(1 + Math.sin(t * 9 + i) * 0.08, 1 + Math.sin(t * 7 + i * 2) * 0.15, 1); }; });
    for (let i = 0; i < 9; i++) k.c(0.006, 0.006, 0.95, 0x1a1a1a, -0.4 + i * 0.1, 0.48, 0.38);
    halo(k, 0.8, 0xff9a40, 0, 0.45, 0.4, 0.6);
    for (let i = 0; i < 5; i++) P.book(k, -0.85 + i * 0.07, 1.62, 0, [0x2a2a3a, 0x3a3a4a, 0x1a1a2a, 0x5a4a3a, 0x2a2a3a][i]); k.b(0.22, 0.05, 0.16, 0x2a2a3a, -0.55, 1.65, 0, 0.01);
    const tr = new THREE.Group(); tr.position.set(0.6, 1.62, 0); g.add(tr); const kt = K(tr); kt.add(mesh(geo('k10terra', () => new THREE.CylinderGeometry(0.16, 0.18, 0.28, 6)), glass(0xe8f4ff), 0, 0.17, 0)); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; kt.b(0.01, 0.3, 0.01, 0x2a2a2a, Math.cos(a) * 0.17, 0.17, Math.sin(a) * 0.17); } kt.cone(0.17, 0.15, 0x2a2a2a, 0, 0.39, 0, 6).material = new THREE.MeshBasicMaterial({ color: 0x2a2a2a, wireframe: true }); kt.c(0.15, 0.15, 0.04, 0x5a3a24, 0, 0.04, 0); for (const [x, c2] of [[-0.05, 0xd8402a], [0.05, 0x5a9a3a], [0, 0xe89040]]) kt.k(0.025, 0.08, c2, x, 0.12, 0.02);
  }, { tags: ['light', 'luxury'], use: [{ pose: 'sit', dx: 0, dz: 1.3, face: 180, act: 'meditate' }], lamp: [[0, 0.5, 0.8, 0xff9040, 1.0, 5]] });
  const compassMat = cm('k10compass', 512, 512, (c, w, h) => {
    const C = 256; c.fillStyle = '#6a7a90'; c.beginPath(); c.arc(C, C, 254, 0, 7); c.fill(); c.fillStyle = '#b8a8a8'; c.beginPath(); c.arc(C, C, 240, 0, 7); c.fill();
    c.fillStyle = '#7a8aa0'; c.beginPath(); c.arc(C, C, 226, 0, 7); c.fill(); c.fillStyle = '#e0c088'; c.beginPath(); c.arc(C, C, 214, 0, 7); c.fill();
    c.fillStyle = '#b8a888'; for (let i = 0; i < 32; i++) { const a = i / 32 * PI * 2; c.beginPath(); c.arc(C + Math.cos(a) * 232, C + Math.sin(a) * 232, 4, 0, 7); c.fill(); }
    const pt = (a, r, len, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(C + Math.cos(a) * len, C + Math.sin(a) * len); c.lineTo(C + Math.cos(a + r) * 60, C + Math.sin(a + r) * 60); c.lineTo(C, C); c.lineTo(C + Math.cos(a - r) * 60, C + Math.sin(a - r) * 60); c.fill(); };
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2 - PI / 2; pt(a, 0.12, i % 4 === 0 ? 205 : i % 2 ? 150 : 180, i % 2 ? '#4a2a22' : '#6a3a2a'); c.fillStyle = i % 2 ? '#c89a60' : '#e0c090'; c.beginPath(); c.moveTo(C + Math.cos(a) * (i % 4 === 0 ? 205 : i % 2 ? 150 : 180), C + Math.sin(a) * (i % 4 === 0 ? 205 : i % 2 ? 150 : 180)); c.lineTo(C + Math.cos(a + 0.12) * 60, C + Math.sin(a + 0.12) * 60); c.lineTo(C, C); c.fill(); }
    c.fillStyle = '#6a3a2a'; for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 - PI / 2 + PI / 8, x = C + Math.cos(a) * 195, y = C + Math.sin(a) * 195; c.save(); c.translate(x, y); c.rotate(a + PI / 2); c.beginPath(); c.moveTo(0, -12); c.bezierCurveTo(6, -4, 6, 4, 0, 10); c.bezierCurveTo(-6, 4, -6, -4, 0, -12); c.fill(); c.fillRect(-10, 2, 20, 3); c.restore(); }
    c.fillStyle = '#a8a0a8'; c.beginPath(); c.moveTo(C, C - 58); c.lineTo(C + 58, C); c.lineTo(C, C + 58); c.lineTo(C - 58, C); c.fill(); c.fillStyle = '#d8d0d8'; c.beginPath(); c.moveTo(C, C - 40); c.lineTo(C + 40, C); c.lineTo(C, C + 40); c.lineTo(C - 40, C); c.fill(); c.strokeStyle = '#7a6a7a'; c.lineWidth = 3; c.stroke();
    for (let i = 0; i < 60; i++) { c.strokeStyle = 'rgba(100,80,80,0.08)'; c.beginPath(); c.moveTo((i * 37) % w, 0); c.lineTo((i * 71) % w, h); c.stroke(); }
  });
  def('k10_compass_floor', '나침반 모자이크 바닥', 'misc', 3000, 5.6, 5.6, g => { const k = K(g); rug(k, 5.6, 5.6, compassMat, 0, 0, 0.012); }, { flat: true, tags: ['art'] });
  const plaid = tm('k10plaid', 64, 64, (c, w, h) => { c.fillStyle = '#f4ecdc'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(200,170,140,0.45)'; for (let i = 0; i < w; i += 16) { c.fillRect(i, 0, 6, h); c.fillRect(0, i, w, 6); } c.fillStyle = 'rgba(160,120,90,0.3)'; for (let i = 3; i < w; i += 16) { c.fillRect(i, 0, 1.5, h); c.fillRect(0, i, w, 1.5); } });
  def('k10_plaid_cushion', '크림 체크 방석', 'rest', 300, 0.7, 0.6, g => { const k = K(g); k.b(0.62, 0.16, 0.54, plaid, 0, 0.09, 0, 0.07); k.s(0.3, plaid, 0, 0.14, 0, 1, 0.2, 0.9); }, { use: [{ pose: 'sit', dx: 0, dz: 0, face: 0, act: 'read_book', seatH: 0.2 }], tags: ['chair'] });
  def('k10_open_book', '펼쳐진 책', 'misc', 150, 0.5, 0.35, g => { const k = K(g); for (const s of [-1, 1]) { const p = k.b(0.2, 0.02, 0.28, 0xfbf4e4, s * 0.1, 0.02, 0, 0.005); p.rotation.z = -s * 0.08; } k.b(0.42, 0.012, 0.3, 0x6a3a2a, 0, 0.006, 0, 0.003); plane(k, 0.16, 0.2, pic('k10bookpage', 32, 40, (c, w, h) => { c.fillStyle = '#fbf4e4'; c.fillRect(0, 0, w, h); c.fillStyle = '#9a8a70'; for (let y = 4; y < h - 4; y += 3) c.fillRect(3, y, w - 6, 1); c.fillStyle = '#c8a878'; c.beginPath(); c.arc(16, 12, 5, 0, 7); c.fill(); }), 0.1, 0.035, 0).rotation.x = -PI / 2; }, { flat: true, tags: ['books'] });
  def('k10_pipe_organ', '마호가니 파이프 오르간', 'smart', 6000, 1.9, 1.0, g => {
    const k = K(g), wd = T.woodgrain(MAH); k.b(1.8, 1.0, 0.8, wd, 0, 0.5, 0, 0.02); k.b(1.7, 0.08, 0.35, 0x1a1a1a, 0, 0.92, 0.35, 0.01); k.b(1.6, 0.03, 0.2, 0xfbf8f0, 0, 0.97, 0.4); for (let i = 0; i < 20; i++) k.b(0.035, 0.02, 0.1, 0x1a1a1a, -0.72 + i * 0.075 + (i % 7 === 2 || i % 7 === 6 ? 0.04 : 0), 0.99, 0.37); k.b(1.6, 0.03, 0.18, 0xfbf8f0, 0, 1.06, 0.32); k.b(1.8, 1.4, 0.6, wd, 0, 1.75, -0.1, 0.02); k.b(0.5, 0.35, 0.02, 0xfbf6ea, 0, 1.35, 0.21);
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) k.c(0.025, 0.025, 0.04, [0xfbf6ea, 0xd8402a][i % 2], sx * (0.4 + i * 0.1), 1.2, 0.22).rotation.x = PI / 2;
    const pipes = [0.9, 1.1, 1.35, 1.6, 1.8, 1.6, 1.35, 1.1, 0.9]; pipes.forEach((h, i) => { const x = -0.64 + i * 0.16; k.c(0.055, 0.055, h, new THREE.MeshPhongMaterial({ color: 0xe0b060, shininess: 80, specular: 0xfff0c0 }), x, 2.45 + h / 2, -0.05); k.cone(0.055, 0.1, 0x3a2a1a, x, 2.4 + 0.05, -0.05); k.b(0.04, 0.03, 0.02, 0x1a1a1a, x, 2.55, 0.01); });
    k.b(1.9, 0.14, 0.7, wd, 0, 2.45, -0.1, 0.02); for (const sx of [-1, 1]) k.b(0.14, 2.0, 0.7, wd, sx * 0.9, 3.4, -0.1, 0.02); k.b(1.95, 0.2, 0.75, wd, 0, 4.45, -0.1, 0.03); k.add(mesh(geo('k10orgtop', () => new THREE.CylinderGeometry(0.55, 0.55, 0.14, 20, 1, false, -PI / 2, PI)), wd, 0, 4.5, -0.1)).rotation.x = PI / 2;
    k.b(0.9, 0.08, 0.35, wd, 0, 0.45, 0.75, 0.02); for (const x of [-0.38, 0.38]) k.b(0.06, 0.45, 0.3, wd, x, 0.22, 0.75);
  }, { tags: ['music', 'luxury'], use: [{ pose: 'type', dx: 0, dz: 0.75, face: 180, act: 'lp', seatH: 0.5 }] });
  def('k10_grandfather_clock', '마호가니 괘종시계', 'misc', 2800, 0.7, 0.5, g => { const k = K(g), wd = T.woodgrain(MAH); k.b(0.62, 0.4, 0.45, wd, 0, 0.2, 0, 0.02); k.b(0.5, 1.2, 0.36, wd, 0, 1.0, 0, 0.02); k.b(0.4, 1.0, 0.02, glass(0xfff4e0), 0, 1.0, 0.19); k.b(0.64, 0.6, 0.45, wd, 0, 1.9, 0, 0.02); k.add(mesh(geo('k10clkface', () => new THREE.CircleGeometry(0.2, 24)), M(0xfbf4e0), 0, 1.9, 0.23, false)); k.t(0.2, 0.015, 0xc8a060, 0, 1.9, 0.23); for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; k.b(0.012, 0.035, 0.005, 0x2a1a10, Math.cos(a) * 0.16, 1.9 + Math.sin(a) * 0.16, 0.235).rotation.z = a + PI / 2; } k.b(0.012, 0.12, 0.005, 0x2a1a10, 0.02, 1.94, 0.24).rotation.z = -0.4; k.b(0.01, 0.16, 0.005, 0x2a1a10, -0.03, 1.94, 0.242).rotation.z = 0.9; const top = k.add(mesh(geo('k10clktop', () => new THREE.CylinderGeometry(0.34, 0.34, 0.46, 18, 1, false, -PI / 2, PI)), wd, 0, 2.2, 0)); top.rotation.x = PI / 2; top.scale.y = 0.4; k.s(0.05, 0xc8a060, 0, 2.42, 0.05);
    const pend = new THREE.Group(); pend.userData.keep = true; pend.position.set(0, 1.5, 0.08); g.add(pend); const kp = K(pend); kp.c(0.008, 0.008, 0.7, 0xc8a060, 0, -0.35, 0); kp.c(0.09, 0.09, 0.02, 0xe0b060, 0, -0.72, 0).rotation.x = PI / 2; pend.children.forEach(o => { o.userData.noBake = true; o.onBeforeRender = () => { pend.rotation.z = Math.sin(now() * 2.2) * 0.22; }; }); }, { tags: ['clock', 'luxury'] });
  def('k10_writing_desk', '타자기 책상 (잉크 · 깃펜 · 서류)', 'work', 2400, 1.6, 0.8, g => { const k = K(g), wd = T.woodgrain(MAH); k.b(1.6, 0.07, 0.78, wd, 0, 0.8, 0, 0.02); for (const sx of [-1, 1]) { k.b(0.5, 0.78, 0.74, wd, sx * 0.53, 0.39, 0, 0.02); for (let i = 0; i < 3; i++) { k.b(0.44, 0.2, 0.02, 0x4a2014, sx * 0.53, 0.14 + i * 0.24, 0.38, 0.01); k.s(0.02, 0xc8a060, sx * 0.53, 0.16 + i * 0.24, 0.4); } } k.b(0.48, 0.1, 0.34, 0xd8d8d8, 0.2, 0.9, 0.05, 0.03); const kb = k.b(0.44, 0.03, 0.2, 0xe8e8e8, 0.2, 0.93, 0.16, 0.01); kb.rotation.x = 0.3; for (let r = 0; r < 3; r++) for (let i = 0; i < 8; i++) k.c(0.015, 0.015, 0.02, 0x2a2a2a, 0.04 + i * 0.045, 0.95 + r * 0.015, 0.1 + r * 0.04); k.c(0.03, 0.03, 0.44, 0x2a2a2a, 0.2, 0.98, -0.08).rotation.z = PI / 2; k.b(0.2, 0.22, 0.003, 0xfbf8f0, 0.2, 1.05, -0.08); k.b(0.3, 0.012, 0.38, 0xf4ecd8, -0.35, 0.845, 0.05, 0.003); k.c(0.035, 0.04, 0.06, 0x1a1a2a, -0.15, 0.87, -0.2); const q = k.c(0.004, 0.012, 0.28, 0xfbfbf8, -0.14, 1.0, -0.2); q.rotation.z = 0.4; }, { tags: ['desk', 'books'], use: [{ pose: 'type', dx: 0.2, dz: -0.75, face: 0, act: 'study', seatH: 0.5 }] });
  def('k10_queen_chair', '퀸앤 원목 의자', 'rest', 700, 0.55, 0.55, g => { const k = K(g), wd = T.woodgrain(MAH); k.b(0.48, 0.06, 0.46, wd, 0, 0.46, 0, 0.02); k.b(0.44, 0.06, 0.42, 0x8a3a2a, 0, 0.5, 0, 0.03); for (const [x, z] of [[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]]) { const l = k.c(0.025, 0.018, 0.46, wd, x, 0.22, z); if (z > 0) l.rotation.x = -0.12; } for (const x of [-0.2, 0.2]) k.c(0.02, 0.02, 0.6, wd, x, 0.78, -0.2); k.b(0.44, 0.08, 0.05, wd, 0, 1.06, -0.2, 0.03); const sp = k.b(0.14, 0.52, 0.03, wd, 0, 0.78, -0.2, 0.05); }, { use: [{ pose: 'sit', dx: 0, dz: 0.03, face: 0, act: 'sit', seatH: 0.52 }], tags: ['chair'] });
  def('k10_wastebasket', '원목 휴지통', 'misc', 200, 0.4, 0.4, g => { const k = K(g); k.add(mesh(geo('k10bin', () => new THREE.CylinderGeometry(0.17, 0.13, 0.36, 16, 1, true)), new THREE.MeshLambertMaterial({ map: T.woodgrain(OAK2).map, side: THREE.DoubleSide }), 0, 0.18, 0)); k.c(0.13, 0.13, 0.01, 0x5a3a24, 0, 0.01, 0); }, { tags: ['clean'] });
  def('k10_birdhouse_lamp', '황금 새집 조명 & 원목 받침', 'light', 1200, 0.6, 0.6, g => { const k = K(g), wd = T.woodgrain(MAH); k.b(0.55, 0.8, 0.5, wd, 0, 0.4, 0, 0.02); k.b(0.6, 0.05, 0.55, wd, 0, 0.82, 0, 0.01); k.c(0.2, 0.22, 0.06, 0x3a2418, 0, 0.88, 0); const gm = new THREE.MeshLambertMaterial({ color: 0xf0b050, emissive: 0xc07820, emissiveIntensity: 0.6 }); k.b(0.3, 0.26, 0.26, gm, 0, 1.06, 0, 0.02); for (const s of [-1, 1]) { const r = k.b(0.22, 0.02, 0.32, gm, s * 0.1, 1.27, 0, 0.005); r.rotation.z = -s * 0.75; } k.c(0.045, 0.045, 0.01, M(0x3a2010), 0, 1.08, 0.135).rotation.x = PI / 2; halo(k, 0.5, 0xffc060, 0, 1.1, 0.1, 0.6); }, { tags: ['light'], lamp: [[0, 1.1, 0.2, 0xffc060, 0.5, 3]] });
  def('k10_jukebox', '마호가니 주크박스', 'smart', 2200, 0.8, 0.6, g => { const k = K(g), wd = T.woodgrain(0x7a2a1e); k.b(0.76, 1.1, 0.55, wd, 0, 0.55, 0, 0.03); k.add(mesh(geo('k10jbtop', () => new THREE.CylinderGeometry(0.38, 0.38, 0.55, 20, 1, false, -PI / 2, PI)), wd, 0, 1.1, 0)).rotation.x = PI / 2; for (let i = 0; i < 5; i++) k.b(0.4, 0.03, 0.02, 0x1a0a08, 0, 0.4 + i * 0.08, 0.28); k.t(0.3, 0.02, 0xc8903a, 0, 1.1, 0.28, PI); k.b(0.5, 0.25, 0.02, new THREE.MeshLambertMaterial({ color: 0xffd890, emissive: 0x8a5a20 }), 0, 0.95, 0.28); }, { tags: ['music'], use: [{ pose: 'sway', dx: 0, dz: 0.8, face: 180, act: 'listen_radio' }] });
  def('k10_globe_stand', '앤티크 지구본 스탠드', 'misc', 900, 0.6, 0.6, g => { const k = K(g), wd = T.woodgrain(MAH); for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2; const l = k.c(0.02, 0.025, 0.7, wd, Math.cos(a) * 0.18, 0.35, Math.sin(a) * 0.18); l.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); } k.t(0.28, 0.02, 0xc8a060, 0, 0.72, 0).rotation.x = PI / 2; k.s(0.24, tm('k10globe', 128, 64, (c, w, h) => { c.fillStyle = '#e8d0a0'; c.fillRect(0, 0, w, h); c.fillStyle = '#b88a50'; for (const [x, y, rx, ry] of [[24, 22, 14, 10], [40, 42, 8, 12], [70, 20, 18, 9], [80, 40, 10, 8], [105, 44, 9, 6]]) { c.beginPath(); c.ellipse(x, y, rx, ry, 0.3, 0, 7); c.fill(); } c.strokeStyle = 'rgba(120,80,40,0.35)'; for (let x = 0; x < w; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } }), 0, 0.98, 0); const m = k.t(0.27, 0.012, 0xc8a060, 0, 0.98, 0, PI * 1.3); m.rotation.set(0, 0.3, 0.4); }, { tags: ['science'] });
  def('k10_book_trolley', '원목 북 트롤리', 'misc', 700, 0.9, 0.5, g => { const k = K(g), wd = T.woodgrain(MAH); for (const y of [0.25, 0.7]) { k.b(0.85, 0.04, 0.45, wd, 0, y, 0, 0.01); k.b(0.8, 0.28, 0.02, ROWS[(y * 10 | 0) % 8], 0, y + 0.16, 0, 0.003); } for (const x of [-0.4, 0.4]) for (const z of [-0.2, 0.2]) { k.b(0.04, 0.8, 0.04, wd, x, 0.45, z); k.s(0.04, 0x2a2a2a, x, 0.04, z); } }, { tags: ['books'] });
  def('k10_reading_lamp_table', '원목 사이드 테이블 & 그린 뱅커 램프', 'light', 700, 0.5, 0.5, g => { const k = K(g), wd = T.woodgrain(MAH); k.c(0.24, 0.24, 0.04, wd, 0, 0.6, 0); k.c(0.03, 0.05, 0.58, wd, 0, 0.3, 0); k.c(0.16, 0.18, 0.03, wd, 0, 0.015, 0); k.c(0.05, 0.06, 0.03, 0xc8a060, 0, 0.64, 0); k.c(0.01, 0.01, 0.18, 0xc8a060, 0, 0.74, 0); k.add(mesh(geo('k10bank', () => new THREE.CylinderGeometry(0.09, 0.09, 0.3, 14, 1, false, 0, PI)), new THREE.MeshLambertMaterial({ color: 0x2a7a4a, emissive: 0x0a2a14, side: THREE.DoubleSide }), 0, 0.84, 0)).rotation.set(0, 0, PI / 2); halo(k, 0.3, 0xfff0c0, 0, 0.8, 0.05, 0.5); P.book(k, 0.12, 0.62, 0.08, 0x8a2a1e, PI / 2); }, { tags: ['light', 'books'], lamp: [[0, 0.8, 0.1, 0xfff0c8, 0.35, 2.5]] });

  // =========================================================
  // 복층 구조 (계단 · 2층 바닥 · 기둥)
  // =========================================================
  const plankTop = tm('k10mezzplank', 128, 128, (c, w, h) => { for (let x = 0; x < w; x += 16) { c.fillStyle = ['#c8864a', '#b87a42', '#d09050'][(x / 16) % 3]; c.fillRect(x, 0, 16, h); c.fillStyle = 'rgba(80,30,10,0.35)'; c.fillRect(x, 0, 1, h); c.fillRect(x, (x * 5) % h, 16, 1); c.strokeStyle = 'rgba(90,40,10,0.12)'; c.beginPath(); c.moveTo(x + 6, 0); c.bezierCurveTo(x + 4, h / 3, x + 10, h * 2 / 3, x + 7, h); c.stroke(); } });
  plankTop.map.wrapS = plankTop.map.wrapT = THREE.RepeatWrapping; plankTop.map.repeat.set(4, 4);
  def('k10_mezzanine', '원목 복층 바닥 (기둥 · 들보)', 'misc', 8000, 7.2, 6.9, g => { const k = K(g), W = 7.2, D = 6.9, wd = T.woodgrain(OAK2); const top = k.b(W, 0.14, D, plankTop, 0, MEZZ_Y - 0.07, 0, 0.01); k.b(W, 0.22, 0.12, wd, 0, MEZZ_Y - 0.2, D / 2 - 0.06, 0.02); k.b(0.12, 0.22, D, wd, -W / 2 + 0.06, MEZZ_Y - 0.2, 0, 0.02); for (let i = 0; i < 5; i++) k.b(0.14, 0.2, D, T.woodgrain(MAH), -W / 2 + 0.7 + i * 1.5, MEZZ_Y - 0.24, 0, 0.01); for (const x of [-W / 2 + 0.15, 0, W / 2 - 0.3]) { k.b(0.24, MEZZ_Y - 0.1, 0.24, T.woodgrain(MAH), x, (MEZZ_Y - 0.1) / 2, D / 2 - 0.15, 0.02); k.b(0.34, 0.12, 0.34, T.woodgrain(MAH), x, MEZZ_Y - 0.36, D / 2 - 0.15, 0.02); } k.b(0.24, MEZZ_Y - 0.1, 0.24, T.woodgrain(MAH), -W / 2 + 0.15, (MEZZ_Y - 0.1) / 2, 0, 0.02); }, { tags: ['luxury'] });
  def('k10_stairs', '원목 계단 & 층계참 (난간)', 'misc', 3000, 1.7, 5.4, g => { const k = K(g), wd = T.woodgrain(OAK), n = 12, len = 3.8, top = MEZZ_Y; for (let i = 0; i < n; i++) { const z = len / 2 - (i + 0.5) * len / n, y = (i + 1) * top / n; k.b(1.5, 0.08, len / n + 0.04, wd, 0, y - 0.04, z, 0.01); k.b(1.5, y - 0.04, 0.03, T.woodgrain(OAK2), 0, (y - 0.04) / 2, z + len / n / 2, 0.005); } k.b(1.6, 0.14, 1.5, plankTop, 0, top - 0.07, -len / 2 - 0.75, 0.01); for (const x of [-0.75, 0.75]) k.b(0.08, 0.3, len, T.woodgrain(MAH), x, 0, 0, 0.01).rotation.x = Math.atan2(top, len); const sx = -0.75; for (let i = 0; i <= n; i += 2) { const z = len / 2 - i * len / n, y = i * top / n; k.c(0.02, 0.02, 0.85, T.woodgrain(MAH), sx, y + 0.42, z); } const hr = k.b(0.07, 0.07, Math.hypot(len, top) + 0.1, T.woodgrain(MAH), sx, top / 2 + 0.85, 0, 0.02); hr.rotation.x = Math.atan2(top, len); k.b(0.14, 1.1, 0.14, T.woodgrain(MAH), sx, 0.55, len / 2, 0.02); k.s(0.08, 0xc8a060, sx, 1.14, len / 2); for (let i = 0; i < 4; i++) k.c(0.02, 0.02, 0.85, T.woodgrain(MAH), -0.75, top + 0.42, -len / 2 - 0.2 - i * 0.4); k.b(0.07, 0.07, 1.4, T.woodgrain(MAH), -0.75, top + 0.85, -len / 2 - 0.75, 0.02); }, { tags: ['luxury'] });
  const oakShelf = (k, W, H, D, seed) => shelvesCase(k, W, H, D, OAK, Math.max(2, Math.round(H / 0.36)), seed, M(OAK2));
  def('k10_low_bookcase', '오크 낮은 책장 (2층 난간)', 'work', 1400, 1.75, 0.42, g => { const k = K(g); oakShelf(k, 1.75, 1.05, 0.4, 2); }, { tags: ['books'], use: [{ pose: 'read', dx: 0, dz: 0.75, face: 180, act: 'read_book' }] });
  def('k10_oak_tall_bookcase', '오크 벽 책장 (2층)', 'work', 2000, 1.7, 0.45, g => { const k = K(g); oakShelf(k, 1.7, 2.3, 0.42, 5); }, { tags: ['books'], use: [{ pose: 'read', dx: 0, dz: 0.8, face: 180, act: 'read_book' }] });
  const leather = T.leather(0x5a3a2a);
  def('k10_leather_armchair', '브라운 가죽 암체어', 'rest', 1600, 0.9, 0.85, g => { const k = K(g); k.b(0.8, 0.3, 0.78, leather, 0, 0.25, 0, 0.07); k.b(0.64, 0.14, 0.6, leather, 0, 0.45, 0.05, 0.06); k.b(0.8, 0.52, 0.18, leather, 0, 0.64, -0.3, 0.07); for (const s of [-1, 1]) k.b(0.14, 0.26, 0.74, leather, s * 0.36, 0.52, 0, 0.06); for (const [x, z] of [[-0.34, -0.32], [0.34, -0.32], [-0.34, 0.32], [0.34, 0.32]]) k.c(0.025, 0.02, 0.1, 0x2a1a10, x, 0.05, z); }, { use: [{ pose: 'sit', dx: 0, dz: 0.08, face: 0, act: 'read_book', seatH: 0.52 }], tags: ['sofa', 'books'] });
  def('k10_round_table_book', '블랙 원형 테이블 & 펼친 책', 'misc', 800, 0.8, 0.8, g => { const k = K(g); k.c(0.36, 0.36, 0.04, 0x2a2a2e, 0, 0.5, 0); k.t(0.36, 0.012, 0x4a4a4e, 0, 0.5, 0).rotation.x = PI / 2; for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2; const l = k.c(0.015, 0.015, 0.5, 0x2a2a2e, Math.cos(a) * 0.25, 0.25, Math.sin(a) * 0.25); l.rotation.set(Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2); } k.b(0.36, 0.03, 0.26, 0xfbf4e4, 0, 0.535, 0, 0.01); k.b(0.004, 0.035, 0.26, 0x9a8a70, 0, 0.54, 0); }, { tags: ['table', 'books'] });
  def('k10_floor_lamp', '화이트 드럼 플로어 램프 (블랙)', 'light', 700, 0.5, 0.5, g => { const k = K(g); k.c(0.16, 0.18, 0.03, 0x1a1a1a, 0, 0.015, 0); k.c(0.012, 0.012, 1.5, 0x1a1a1a, 0, 0.76, 0); k.add(mesh(geo('k10drum', () => new THREE.CylinderGeometry(0.22, 0.24, 0.3, 22, 1, true)), new THREE.MeshLambertMaterial({ color: 0xfffaf0, emissive: 0xa89070, side: THREE.DoubleSide }), 0, 1.58, 0)); k.s(0.05, glow(0xfff0d0), 0, 1.52, 0); halo(k, 0.5, 0xfff0c8, 0, 1.55, 0, 0.5); }, { tags: ['light'], lamp: [[0, 1.5, 0, 0xffe8c0, 0.55, 3.5]] });
  def('k10_easel_sketch', '이젤 & 인체 스케치', 'misc', 700, 0.6, 0.6, g => { const k = K(g), wd = T.woodgrain(OAK); for (const s of [-1, 1]) { const l = k.b(0.04, 1.5, 0.04, wd, s * 0.22, 0.75, 0.05); l.rotation.set(-0.08, 0, s * 0.08); } const bl = k.b(0.04, 1.4, 0.04, wd, 0, 0.7, -0.3); bl.rotation.x = 0.25; k.b(0.55, 0.04, 0.08, wd, 0, 0.6, 0.1); const c2 = k.b(0.5, 0.62, 0.03, 0xfbf6ea, 0, 0.95, 0.08, 0.01); c2.rotation.x = -0.08; const p = plane(k, 0.44, 0.56, pic('k10vitruv', 48, 60, (c, w, h) => { c.fillStyle = '#f4ead4'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8a6a4a'; c.lineWidth = 1; c.beginPath(); c.arc(24, 30, 18, 0, 7); c.stroke(); c.strokeRect(8, 13, 32, 34); c.beginPath(); c.arc(24, 18, 3, 0, 7); c.stroke(); c.beginPath(); c.moveTo(24, 21); c.lineTo(24, 36); c.moveTo(8, 26); c.lineTo(40, 26); c.moveTo(24, 36); c.lineTo(14, 48); c.moveTo(24, 36); c.lineTo(34, 48); c.stroke(); for (let y = 52; y < 58; y += 2) c.fillRect(8, y, 32, 0.6); }), 0, 0.95, 0.1); p.rotation.x = -0.08; }, { tags: ['art'] });
  def('k10_cactus_table', '사이드 테이블 & 선인장 화분', 'misc', 600, 0.6, 0.5, g => { const k = K(g), wd = T.woodgrain(MAH); k.b(0.55, 0.5, 0.45, wd, 0, 0.25, 0, 0.02); for (const [x, z, h, c2] of [[-0.12, -0.05, 0.28, 0x6a9a4a], [0.12, 0.08, 0.2, 0x5a8a3a]]) { k.c(0.08, 0.06, 0.1, 0xd87a4a, x, 0.55, z); k.k(0.06, h - 0.1, c2, x, 0.6 + h / 2, z); if (x < 0) { k.k(0.03, 0.06, c2, x + 0.07, 0.72, z); k.s(0.02, 0xff80a0, x, 0.62 + h, z); } } }, { tags: ['plant'] });
  def('k10_palm_tall', '대형 극락조 · 야자 화분', 'misc', 900, 0.8, 0.8, g => { const k = K(g); k.c(0.2, 0.16, 0.36, 0xf4f0e8, 0, 0.18, 0); for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2, lean = 0.3 + (i % 3) * 0.2; k.c(0.01, 0.012, 1.2, 0x4a6a3a, Math.sin(lean) * Math.cos(a) * 0.3, 0.9, Math.sin(lean) * Math.sin(a) * 0.3).rotation.set(Math.sin(a) * lean, 0, -Math.cos(a) * lean); const l = k.s(0.26, 0x4a8a3a, Math.sin(lean) * Math.cos(a) * 0.6, 1.4 + (i % 3) * 0.1, Math.sin(lean) * Math.sin(a) * 0.6, 0.35, 1.2, 0.08); l.rotation.set(Math.sin(a) * 0.7, -a, -Math.cos(a) * 0.7); } }, { tags: ['plant'] });
  def('k10_oak_desk', '오크 책상 & 서류 (2층)', 'work', 1500, 1.3, 0.65, g => { const k = K(g), wd = T.woodgrain(0x6a3a24); k.b(1.3, 0.06, 0.62, wd, 0, 0.76, 0, 0.02); for (const sx of [-1, 1]) k.b(0.06, 0.76, 0.58, wd, sx * 0.6, 0.38, 0); k.b(1.2, 0.5, 0.04, wd, 0, 0.5, -0.28); P.book(k, -0.4, 0.79, -0.1, 0x3a5a4a); P.book(k, -0.33, 0.79, -0.1, 0xd8782a); k.b(0.3, 0.01, 0.22, 0xf4ecd8, 0.1, 0.795, 0.05); P.mug(k, 0.4, 0.79, 0, 0xfbf8f2); }, { tags: ['desk'], use: [{ pose: 'type', dx: 0, dz: 0.65, face: 180, act: 'study', seatH: 0.5 }] });

  // =========================================================
  // 1층 앞 북카페 (사진 2 아래)
  // =========================================================
  const stripe = tm('k10stripe', 64, 64, (c, w, h) => { for (let x = 0; x < w; x += 8) { c.fillStyle = (x / 8) % 2 ? '#fbe0cc' : '#f0a888'; c.fillRect(x, 0, 8, h); } });
  def('k10_bistro_chair', '줄무늬 비스트로 의자', 'rest', 500, 0.5, 0.5, g => { const k = K(g); k.c(0.2, 0.2, 0.05, stripe, 0, 0.48, 0); for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2 + PI / 4; const l = k.c(0.012, 0.012, 0.48, 0x1a1a1a, Math.cos(a) * 0.14, 0.24, Math.sin(a) * 0.14); l.rotation.set(Math.sin(a) * 0.1, 0, -Math.cos(a) * 0.1); } for (const x of [-0.14, 0.14]) k.c(0.012, 0.012, 0.5, 0x1a1a1a, x, 0.72, -0.16); const bk = k.b(0.34, 0.26, 0.04, stripe, 0, 0.88, -0.17, 0.05); }, { use: [{ pose: 'sit', dx: 0, dz: 0.03, face: 0, act: 'cafe', seatH: 0.52 }], tags: ['chair', 'cafe'] });
  def('k10_bistro_table', '원목 카페 테이블 & 커피', 'work', 600, 0.6, 0.6, g => { const k = K(g), wd = T.woodgrain(0xd8905a); k.b(0.58, 0.04, 0.58, wd, 0, 0.62, 0, 0.01); for (const [x, z] of [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]]) k.c(0.012, 0.012, 0.62, 0x1a1a1a, x, 0.31, z); k.c(0.08, 0.08, 0.01, 0xfbf8f2, 0.05, 0.645, 0.05); P.mug(k, 0.05, 0.65, 0.05, 0xfbf8f2); k.c(0.035, 0.035, 0.005, 0x4a2a1a, 0.05, 0.748, 0.05); }, { tags: ['cafe', 'table'], use: [{ pose: 'drink', dx: 0, dz: 0.55, face: 180, act: 'cafe', seatH: 0.52, prop: 'teacup' }] });
  def('k10_round_bistro', '원형 원목 카페 테이블', 'work', 600, 0.6, 0.6, g => { const k = K(g), wd = T.woodgrain(0xd8905a); k.c(0.3, 0.3, 0.04, wd, 0, 0.62, 0); k.c(0.02, 0.03, 0.6, 0x1a1a1a, 0, 0.31, 0); k.c(0.18, 0.2, 0.02, 0x1a1a1a, 0, 0.01, 0); P.book(k, 0.08, 0.64, 0, 0x2a3a5a, PI / 2); }, { tags: ['cafe', 'table'] });
  def('k10_book_table_low', '낮은 테이블 & 펼친 책 · 책 더미', 'misc', 500, 0.8, 0.5, g => { const k = K(g), wd = T.woodgrain(0xd8905a); k.b(0.75, 0.04, 0.46, wd, 0, 0.36, 0, 0.01); for (const [x, z] of [[-0.33, -0.19], [0.33, -0.19], [-0.33, 0.19], [0.33, 0.19]]) k.b(0.04, 0.36, 0.04, wd, x, 0.18, z); k.b(0.42, 0.025, 0.3, 0xfbf4e4, 0, 0.395, 0, 0.01); k.b(0.004, 0.03, 0.3, 0x9a8a70, 0, 0.4, 0); for (let i = 0; i < 3; i++) k.b(0.22, 0.05, 0.16, SPINES[i * 4 % 12].replace('#', '0x') * 1, -0.3, 0.05 + i * 0.05, 0.3, 0.01); }, { tags: ['books'] });
  def('k10_rocking_chair', '다크우드 흔들의자', 'rest', 900, 0.6, 0.8, g => { const k = K(g), wd = T.woodgrain(0x4a2418); for (const s of [-1, 1]) { const r = k.t(0.6, 0.02, wd, s * 0.22, 0.62, 0, PI * 0.42); r.rotation.set(0, PI / 2, PI * 1.29); for (const z of [-0.2, 0.2]) k.c(0.02, 0.02, 0.42, wd, s * 0.22, 0.24, z); } k.b(0.5, 0.05, 0.46, wd, 0, 0.45, 0, 0.02); for (let i = 0; i < 6; i++) k.c(0.012, 0.012, 0.7, wd, -0.2 + i * 0.08, 0.82, -0.22); k.b(0.54, 0.08, 0.05, wd, 0, 1.18, -0.22, 0.02); for (const s of [-1, 1]) k.b(0.05, 0.04, 0.44, wd, s * 0.24, 0.66, 0.02); }, { use: [{ pose: 'sit', dx: 0, dz: 0.03, face: 0, act: 'read_book', seatH: 0.5 }], tags: ['chair'] });
  def('k10_coffee_stool', '원형 스툴 & 커피잔', 'misc', 300, 0.4, 0.4, g => { const k = K(g), wd = T.woodgrain(0x6a3a24); k.c(0.17, 0.17, 0.04, wd, 0, 0.42, 0); for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2; const l = k.c(0.018, 0.018, 0.42, wd, Math.cos(a) * 0.11, 0.21, Math.sin(a) * 0.11); l.rotation.set(Math.sin(a) * 0.15, 0, -Math.cos(a) * 0.15); } k.c(0.08, 0.08, 0.01, 0xfbf8f2, 0, 0.445, 0); P.mug(k, 0, 0.45, 0, 0xfbf8f2); }, { tags: ['cafe'] });
  def('k10_circ_desk', '사서 대출 데스크', 'work', 2600, 2.2, 0.8, g => { const k = K(g), wd = T.woodgrain(MAH); k.b(2.2, 1.0, 0.7, wd, 0, 0.5, 0, 0.02); k.b(2.26, 0.06, 0.8, T.woodgrain(OAK2), 0, 1.02, 0, 0.01); for (let i = 0; i < 4; i++) k.b(0.46, 0.7, 0.02, 0x4a2014, -0.78 + i * 0.52, 0.5, 0.36, 0.02); k.b(0.3, 0.2, 0.2, 0x2a2a2a, 0.6, 1.15, -0.1, 0.02); for (let i = 0; i < 6; i++) P.book(k, -0.7 + i * 0.06, 1.05, -0.05, parseInt(SPINES[i * 2 % 12].slice(1), 16)); k.c(0.04, 0.05, 0.12, 0xc8a060, -0.1, 1.1, 0.1); k.s(0.035, 0xd8b060, -0.1, 1.2, 0.1); }, { use: [{ pose: 'stand', dx: 0, dz: -0.8, face: 0, act: 'staff' }, { pose: 'stand', dx: 0, dz: 0.8, face: 180, act: 'customer' }], tags: ['counter', 'books'] });
  def('k10_brass_chandelier', '황동 샹들리에 (햇빛 보조)', 'light', 2000, 1.2, 1.2, g => { const k = K(g); k.c(0.01, 0.01, 1.2, 0x8a6a3a, 0, 5.2, 0); k.s(0.1, 0xc8a060, 0, 4.55, 0, 1, 1.3, 1); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2, x = Math.cos(a) * 0.45, z = Math.sin(a) * 0.45; const arm = k.t(0.22, 0.015, 0xc8a060, x / 2, 4.42, z / 2, PI); arm.rotation.set(0, -a, PI); k.c(0.03, 0.03, 0.1, 0xfbf6e8, x, 4.47, z); k.s(0.035, glow(0xfff0c8), x, 4.56, z, 1, 1.4, 1); halo(k, 0.15, 0xffd890, x, 4.57, z, 0.6); } }, { ceiling: true, tags: ['light'], lamp: [[0, 4.3, 0, 0xffd8a0, 0.6, 7]] });
  def('k10_hanging_ivy', '난간 넝쿨 (2층에서 늘어짐)', 'misc', 400, 1.6, 0.3, g => { const k = K(g); for (let s = 0; s < 6; s++) for (let i = 0; i < 9; i++) k.s(0.05, i % 2 ? 0x4a7a3a : 0x6a9a4a, -0.7 + s * 0.28 + Math.sin(i + s) * 0.04, MEZZ_Y - 0.1 - i * 0.12 - (s % 2) * 0.1, 0.05 + Math.cos(i) * 0.03, 1.2, 0.8, 0.5); }, { tags: ['plant'] });

  def('k10_cafe_floor', '오크 판재 바닥 (북카페)', 'misc', 800, 7.2, 6.4, g => { const k = K(g); const t = ctex('k10cafefl', 256, 256, (c, w, h) => FM.FLOOR_DRAW.libplank(c, w, h, 0xc88a52)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); rug(k, 7.2, 6.4, new THREE.MeshLambertMaterial({ map: t }), 0, 0, 0.006); }, { flat: true });

  // =========================================================
  // 도서관 정의 갱신 (18 × 14, 벽 5.8m, 복층)
  // =========================================================
  const I = FM.INTERIORS.library_in; if (!I) return;
  // 2층: x 1.9~9, z -7~-0.25 / 계단: x 0.4~1.9, z -1.9~1.9 (위로 갈수록 -z) / 층계참: x 0.3~1.9, z -3.4~-1.9
  const MZ = { x0: 1.85, x1: 9, z0: -7, z1: -0.3 };
  Object.assign(I, { w: 18, d: 14, wallH: 5.8, wallStyle: 'st_libwall', floor: 'libstone', floorColor: 0xc8bcc4, wall: 0xf1e2c4, light: 'warm', maxLamps: 10,
    zones: '1층 스테인드글라스 열람실 · 2층 북 라운지(계단) · 1층 앞 북카페',
    levels: [{ x0: MZ.x0, x1: MZ.x1, z0: MZ.z0, z1: MZ.z1, y: MEZZ_Y }, { x0: 0.3, x1: 1.9, z0: -3.4, z1: -1.9, y: MEZZ_Y }, { x0: 0.4, x1: 1.85, z0: -1.9, z1: 1.9, y: MEZZ_Y, ramp: true }],
    venueMood: { main: 0.55, lamp: 0.9, hemi: [0xffe0c0, 0x4a2a1c, 0.3], amb: [0xffd0a0, 0.08], dir: [0xffd090, 0.68], bg: 0x24160e, rim: 0.45, shadow: { pos: [-8, 11, -9], at: [0, 1], soft: 3 } },
    furn: [
      // 창 · 햇살
      f('k10_arch_window', -7.1, -6.94), f('k10_arch_window', -4.4, -6.94), f('k10_arch_window', -1.7, -6.94), f('k10_arch_window', 1.0, -6.94),
      f('k10_arch_window', -8.94, -4.3, 90), f('k10_arch_window', -8.94, -1.2, 90), f('k10_arch_window', -8.94, 1.9, 90), f('k10_arch_window', -8.94, 5.0, 90), f('k10_arch_window', 8.94, -4.3, -90), f('k10_arch_window', 8.94, -1.2, -90), f('k10_arch_window', 8.94, 2.4, -90), f('k10_arch_window', 8.94, 5.2, -90),
      f('k10_sunlight', -7.1, -6.8), f('k10_sunlight', -4.4, -6.8), f('k10_sunlight', -1.7, -6.8), f('k10_sunlight', 1.0, -6.8), f('k10_rose_cascade', -4.4, -6.94), f('k10_rose_cascade', 1.0, -6.94), f('k10_rose_cascade', -8.94, 1.9, 90),
      // 1층 열람실 (사진 1)
      f('k10_compass_floor', -4.0, -2.2), f('k10_tall_bookcase', -7.95, -6.7), f('k10_tall_bookcase_b', -6.35, -6.7), f('k10_fireplace', -4.4, -6.55), f('k10_tall_bookcase', -2.45, -6.7), f('k10_tall_bookcase_b', -0.85, -6.7), f('k10_tall_bookcase', 0.75, -6.7),
      f('k10_tall_bookcase_b', -8.7, -4.6, 90), f('k10_tall_bookcase', -8.7, -2.9, 90), f('k10_ladder', -8.2, -3.8, 90),
      f('k10_plaid_cushion', -4.6, -3.4, 15), f('k10_plaid_cushion', -3.2, -3.1, -20), f('k10_open_book', -4.0, -3.7, 10), f('k10_open_book', -2.7, -1.2, -30), f('k10_wastebasket', -2.2, -0.6),
      f('k10_pipe_organ', -8.4, 0.2, 90), f('k10_grandfather_clock', -8.55, 1.9, 90), f('k10_writing_desk', -6.3, 1.4, 180), f('k10_queen_chair', -6.1, 2.2, 180), f('k10_wastebasket', -5.1, 2.3),
      f('k10_birdhouse_lamp', -2.0, 1.0), f('k10_jukebox', -3.1, 1.7, 160), f('k10_globe_stand', -7.9, 4.2), f('k3_fig_tree', -8.4, 6.2), f('k10_tall_bookcase_b', -8.7, 5.3, 90),
      f('k10_book_trolley', -0.6, -3.8, 60), f('k10_reading_lamp_table', -6.4, -4.3), f('k10_leather_armchair', -7.2, -3.8, 60), f('k10_circ_desk', -4.2, 4.6), f('k10_book_trolley', -6.2, 5.6, 20),
      f('k10_brass_chandelier', -4.0, -2.2), f('k10_brass_chandelier', 4.6, 3.6),
      // 복층 구조
      f('k10_mezzanine', 5.45, -3.65), f('k10_stairs', 1.15, 0.0), f('k10_hanging_ivy', 3.0, -0.2), f('k10_hanging_ivy', 7.2, -0.2),
      // 2층 북 라운지 (사진 2 위)
      f('k10_low_bookcase', 2.85, -0.45, 0, MEZZ_Y), f('k10_low_bookcase', 4.62, -0.45, 0, MEZZ_Y), f('k10_low_bookcase', 6.39, -0.45, 0, MEZZ_Y), f('k10_low_bookcase', 8.1, -0.45, 0, MEZZ_Y),
      f('k10_low_bookcase', 2.1, -4.45, -90, MEZZ_Y), f('k10_low_bookcase', 2.1, -6.2, -90, MEZZ_Y),
      f('k10_oak_tall_bookcase', 3.0, -6.72, 0, MEZZ_Y), f('k10_oak_tall_bookcase', 4.75, -6.72, 0, MEZZ_Y), f('k10_oak_tall_bookcase', 6.5, -6.72, 0, MEZZ_Y), f('k10_oak_tall_bookcase', 8.2, -6.72, 0, MEZZ_Y),
      f('k10_leather_armchair', 4.1, -2.4, 90, MEZZ_Y), f('k10_round_table_book', 5.2, -2.4, 0, MEZZ_Y), f('k10_leather_armchair', 6.3, -2.4, -90, MEZZ_Y), f('k10_floor_lamp', 3.2, -3.4, 0, MEZZ_Y),
      f('k10_easel_sketch', 8.2, -2.0, -110, MEZZ_Y), f('k10_cactus_table', 7.5, -4.4, 0, MEZZ_Y), f('k10_palm_tall', 2.8, -5.4, 0, MEZZ_Y), f('k10_oak_desk', 5.2, -5.3, 180, MEZZ_Y), f('k10_queen_chair', 5.2, -4.55, 0, MEZZ_Y), f('k10_plaid_cushion', 7.0, -1.3, 0, MEZZ_Y),
      // 1층 앞 북카페 (사진 2 아래)
      f('k10_cafe_floor', 5.45, 3.75), f('k10_leather_armchair', -2.4, 5.9, 200), f('k10_reading_lamp_table', -1.5, 6.2), f('k10_plaid_cushion', -3.3, 6.2, 30), f('k10_globe_stand', -5.6, -4.6),
      f('k10_low_bookcase', 2.85, 0.35, 0), f('k10_low_bookcase', 4.62, 0.35, 0), f('k10_low_bookcase', 6.39, 0.35, 0), f('k10_low_bookcase', 8.1, 0.35, 0),
      f('k10_bistro_table', 3.2, 2.6), f('k10_bistro_chair', 3.2, 1.95), f('k10_bistro_chair', 3.2, 3.25, 180), f('k10_round_bistro', 5.4, 2.5), f('k10_bistro_chair', 4.75, 2.5, 90), f('k10_bistro_chair', 6.05, 2.5, -90),
      f('k10_bistro_table', 7.5, 2.7), f('k10_bistro_chair', 7.5, 2.05), f('k10_bistro_chair', 7.5, 3.35, 180), f('k10_rocking_chair', 2.8, 5.0, 30), f('k10_coffee_stool', 2.0, 5.6), f('k10_book_table_low', 5.2, 5.2), f('k10_bistro_chair', 5.2, 5.85, 180),
      f('k7_ficus_pot', 8.4, 6.3), f('k3_bird_paradise', 8.4, 1.3), f('k10_palm_tall', 0.8, 5.9), f('k10_bistro_table', 7.6, 5.3), f('k10_bistro_chair', 6.95, 5.3, 90),
    ] });
  // 사서 자리 · 기존 도서관 장면 위치
  const applyStaff = () => { const Ev = FM.Ev; if (!Ev || !Ev.staff) return; const s = Ev.staff.find(x => x.id === 's_librarian'); if (s) { s.x = s.sx = -4.2; s.z = s.sz = 3.8; s.ry = 0; } };
  applyStaff(); const Sim = FM.Sim, oLoad = Sim.load; Sim.load = function () { const r = oLoad.apply(this, arguments); applyStaff(); return r; };
  const st = Sim.get && Sim.get(); if (st && st.rooms && st.rooms.library_in) delete st.rooms.library_in;
})();
