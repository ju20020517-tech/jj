/* =========================================================
 *  동물의 숲 풍 건물 — 무늬 벽 · 비늘 지붕 · 덧창 창문 · 화분 · 차양 · 굴뚝
 *  (props.js 의 네모 건물을 덮어씀. 문은 항상 +z 쪽)
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE;
  const H = ISLE.M.h, { mat, geo, sphere, box, cyl, mesh, lathe } = H;
  const AC = FM.AC, K = AC.K, PM = FM.PM, BLD = PM.BLD;
  const { tbox, tm } = AC;
  const glow = c => PM.glowMat(c), glass = c => PM.glassMat(c);

  // ---------- 공통 도우미 ----------
  // 벽 몸통 + 모서리 기둥 + 처마 띠 + 돌 기단
  function body(g, w, h, d, kind, color, o = {}) {
    g.add(K.base(w, d, o.baseH || 0.45, o.baseColor || 0xd9cfc0, o.baseKind || 'stone'));
    g.add(tbox(w, h, d, kind, color, 0, 0.4, 0, 0.12, o.scale || 1));
    const trimM = o.trimKind ? tm(o.trimKind, o.trim || 0xffffff) : mat(o.trim || 0xffffff);
    if (o.corners !== false) for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) g.add(mesh(o.trimKind ? geo('trC' + h, () => AC.wuv(box(0.34, h, 0.34, 0.1), 1.5)) : box(0.34, h, 0.34, 0.1), trimM, x, 0.4 + h / 2, z));
    if (o.band !== false) g.add(mesh(o.trimKind ? geo(`trB${w},${d}`, () => AC.wuv(box(w + 0.3, 0.26, d + 0.3, 0.08), 1.5)) : box(w + 0.3, 0.26, d + 0.3, 0.08), trimM, 0, 0.4 + h - 0.1, 0));
    // 아랫단 두른 벽 (타일/대리석 등)
    if (o.wainscot) g.add(tbox(w + 0.04, o.wainscotH || 1.0, d + 0.04, o.wainscot, o.wainscotColor || 0xffffff, 0, 0.4, 0, 0.08, 1));
  }
  // 한 면에 창문 줄 세우기 (face: 'front'|'back'|'left'|'right')
  function windows(g, w, h, d, face, ys, o = {}) {
    const len = face === 'front' || face === 'back' ? w : d;
    const n = o.n || Math.max(1, Math.floor(len / (o.gap || 3.2)));
    for (const y of ys) for (let i = 0; i < n; i++) {
      const t = -len / 2 + (i + 0.5) * len / n;
      if (face === 'front' && o.skipDoor && Math.abs(t) < (o.skipDoor || 1.2)) continue;
      const win = K.window(o.ww || 1.1, o.wh || 1.25, Object.assign({ seed: i }, o));
      if (face === 'front') { win.position.set(t, y, d / 2 + 0.02); }
      else if (face === 'back') { win.position.set(t, y, -d / 2 - 0.02); win.rotation.y = Math.PI; }
      else if (face === 'left') { win.position.set(-w / 2 - 0.02, y, t); win.rotation.y = -Math.PI / 2; }
      else { win.position.set(w / 2 + 0.02, y, t); win.rotation.y = Math.PI / 2; }
      g.add(win);
    }
  }
  function frontDoor(g, d, o = {}) { const dr = K.door(o.w || 1.4, o.h || 2.3, o.color || 0x8a5a3b, o); dr.position.set(o.x || 0, 0.42, d / 2 + 0.03); g.add(dr); return dr; }
  function sign(g, text, w, y, z, bg, fg, glowC) { const s = PM.sign(text, w, w / 4, bg, fg, glowC); s.position.set(0, y, z); g.add(s); return s; }
  // 나무 판 간판 (둥근 판 + 테두리)
  function woodSign(g, text, w, y, z, bg = '#fff4dc', fg = '#6a4028') {
    g.add(mesh(box(w + 0.3, w / 4 + 0.3, 0.16, 0.1), tm('plank', 0x9a6a44), 0, y, z - 0.05));
    return sign(g, text, w, y, z + 0.05, bg, fg);
  }
  const bulbRow = (g, x0, x1, y, z, c = 0xfff0a0, n = 10) => { for (let i = 0; i < n; i++) { const b = mesh(sphere(0.1, 8, 6), glow(c), x0 + (x1 - x0) * i / (n - 1), y, z); b.userData.noBake = true; g.add(b); } };

  // =========================================================
  // 카페 앙상블 — 빨간 비늘 지붕 코티지 + 줄무늬 차양
  // =========================================================
  BLD.cafe = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld, h = 3.6;
    body(g, w, h, d, 'siding', 0xfff4e2, { trim: 0xffffff, wainscot: 'tile', wainscotColor: 0xa8e6d4, wainscotH: 1.1 });
    const roof = K.gable(w, d, 2.6, 0xff6a58, { wallColor: 0xffe8f0 }); roof.position.y = h + 0.4; g.add(roof);
    const ch = K.chimney(1.8, 0xc9765a); ch.position.set(w / 2 - 1.6, h + 1.2, -1); g.add(ch);
    windows(g, w, h, d, 'front', [2.1], { n: 4, skipDoor: 1.8, ww: 1.5, wh: 1.4, shutters: 0x5fae6a, curtain: '#ffe0a0' });
    windows(g, w, h, d, 'left', [2.1], { n: 2, shutters: 0x5fae6a });
    windows(g, w, h, d, 'right', [2.1], { n: 2, shutters: 0x5fae6a });
    frontDoor(g, d, { color: 0xc0392b, arch: true, w: 1.3 });
    const aw = K.awning(w - 0.4, 1.8, 0xe74c3c, 0xffffff); aw.position.set(0, h - 0.1, d / 2 + 0.1); g.add(aw);
    woodSign(g, '☕ 카페 앙상블', 4.2, h + 1.6, d / 2 + 0.45);
    // 칠판 메뉴판
    const cb = new THREE.Group(); cb.position.set(2.6, 0.4, d / 2 + 1.6); cb.rotation.y = -0.3;
    cb.add(mesh(box(0.9, 1.1, 0.08, 0.03), mat(0x3a4a3a), 0, 0.75, 0)); for (const s of [-1, 1]) { const l = mesh(box(0.06, 1.3, 0.06, 0.02), tm('plank', 0x9a6a44), s * 0.45, 0.6, 0.1); l.rotation.x = 0.2; cb.add(l); }
    const txt = PM.sign('오늘의 수플레 🥞', 0.8, 0.5, '#3a4a3a', '#ffffff'); txt.position.set(0, 0.8, 0.05); cb.add(txt); g.add(cb);
    for (const x of [-w / 2 + 0.7, w / 2 - 0.7]) { const pl = K.planter(0xd9a066, 0xff8fb1); pl.position.set(x, 0.4, d / 2 + 0.7); g.add(pl); }
    return g;
  };

  // =========================================================
  // 센트럴 메트로 — 둥근 아치 지붕 승강장
  // =========================================================
  BLD.station = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld;
    g.add(K.base(w, d, 0.5, 0xe8e4f0, 'tile'));
    g.add(tbox(w, 0.1, d, 'terrazzo', 0xffffff, 0, 0.45, 0, 0.02, 2));
    for (const x of [-w / 2 + 0.5, 0, w / 2 - 0.5]) for (const z of [-d / 2 + 0.5, d / 2 - 0.5]) { g.add(mesh(cyl(0.16, 0.2, 3.6, 14), mat(0x3a7bd5), x, 2.3, z)); g.add(mesh(sphere(0.26, 12, 8), mat(0x2f5fb0), x, 4.1, z)); }
    const vault = mesh(geo('stVault' + w + d, () => AC.scaleUV(new THREE.CylinderGeometry(d / 2 + 0.6, d / 2 + 0.6, w + 1.2, 24, 1, true, 0, Math.PI), 6, w / 1.2)), tm('metal', 0x5b9ae6), 0, 4.1, 0);
    vault.rotation.z = Math.PI / 2; vault.material.side = THREE.DoubleSide; vault.scale.set(0.45, 1, 1); g.add(vault);
    const esc = mesh(box(3, 0.2, 4, 0.05), mat(0x55595f), 0, 0.5, 0.5); esc.rotation.x = -0.35; g.add(esc);
    for (const s of [-1, 1]) g.add(mesh(box(0.15, 0.9, 4, 0.05), glass(0xbfe8ff), s * 1.6, 1.0, 0.5).rotateX(-0.35));
    sign(g, 'Ⓜ 센트럴 메트로 환승역', 6.5, 5.8, d / 2 - 0.2, '#3a7bd5', '#ffffff');
    const board = PM.sign('노선도: Ⓒ센트럴 ─ Ⓝ북 · Ⓔ동 · Ⓦ서 · Ⓢ남', 4.5, 1.1, '#1a2340', '#ffd84a'); board.position.set(-w / 2 - 0.1, 2.2, 0); board.rotation.y = -Math.PI / 2; g.add(board);
    for (const x of [-3.5, 3.5]) { const pl = K.planter(0xe0d0b8, 0xffd84a); pl.position.set(x, 0.5, d / 2 - 0.9); g.add(pl); }
    return g;
  };
  BLD.exitStation = (label) => {
    const g = new THREE.Group();
    g.add(tbox(3.6, 0.3, 3, 'stone', 0xe8e0d4, 0, 0, 0, 0.08, 1));
    for (const x of [-1.6, 1.6]) g.add(mesh(cyl(0.1, 0.12, 2.6, 12), mat(0x3a7bd5), x, 1.4, 1.2));
    const v = mesh(geo('exVault', () => AC.scaleUV(new THREE.CylinderGeometry(1.9, 1.9, 4, 18, 1, true, 0, Math.PI), 4, 3)), tm('metal', 0x5b9ae6), 0, 2.7, 0); v.rotation.z = Math.PI / 2; v.scale.set(0.4, 1, 1); v.material.side = THREE.DoubleSide; g.add(v);
    const s = PM.sign('Ⓜ ' + label, 3.4, 0.7, '#3a7bd5', '#ffffff'); s.position.set(0, 3.6, 1.5); g.add(s);
    return g;
  };

  // =========================================================
  // 방송국 — 둥근 모서리 유리 빌딩 + 안테나 + 전광판(동적)
  // =========================================================
  const oldStudio = BLD.studio;
  BLD.studio = (p) => {
    const g = oldStudio(p); const { w, d, h } = p.bld;
    g.add(K.base(w, d, 0.5, 0xd0d4dc));
    for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) g.add(mesh(cyl(0.45, 0.45, h, 16), tm('panel', 0x2f4b6e), x, h / 2, z));
    g.add(mesh(cyl(0.12, 0.12, 6, 8), mat(0xdfe6f0), -w / 4, h + 3, -1)); g.add(mesh(sphere(0.25, 10, 8), glow(0xff3a3a), -w / 4, h + 6, -1));
    const dish = mesh(geo('dish', () => new THREE.SphereGeometry(1.4, 20, 10, 0, Math.PI * 2, 0, Math.PI / 3)), mat(0xf4f6f8), w / 4, h + 1.5, -1); dish.rotation.x = -0.9; g.add(dish);
    const aw = K.awning(4, 1.6, 0x2f4b6e, 0xffd84a); aw.position.set(0, 3.1, d / 2 + 0.1); g.add(aw);
    return g;
  };

  // =========================================================
  // 대성당 — 돌벽 · 보라 비늘 지붕 · 뾰족 종탑 · 장미창
  // =========================================================
  BLD.cathedral = (p) => {
    const g = new THREE.Group(); const { w, d, h } = p.bld; const hh = h - 5;
    body(g, w, hh, d, 'ashlar', 0xfff8ee, { trim: 0xfbf8f2, trimKind: 'marble', baseKind: 'marble', baseColor: 0xf4eee6, scale: 1.6 });
    const nave = K.gable(d, w, 6, 0x8a6aa8, { wallKind: 'ashlar', wallColor: 0xfff8ee, ridge: 0xd9b44a }); nave.rotation.y = Math.PI / 2; nave.position.y = hh + 0.4; g.add(nave);
    const dome = K.dome(5, 0x8a6aa8); dome.position.set(0, hh + 4, -5); g.add(dome);
    g.add(mesh(cyl(0.5, 0.2, 2.5), mat(0xffd23a), 0, hh + 10, -5));
    // 부벽
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const b = tbox(0.8, hh * 0.7, 1.2, 'marble', 0xfbf8f2, s * (w / 2 + 0.4), 0.4, -d / 2 + 3 + i * (d - 6) / 3, 0.15, 1.4); g.add(b); }
    // 종탑
    const t = new THREE.Group(); t.position.set(w / 2 + 3, 0, 7);
    t.add(K.base(4, 4, 0.5, 0xf4eee6, 'marble')); t.add(tbox(4, 19, 4, 'ashlar', 0xfff8ee, 0, 0.4, 0, 0.1, 1.6));
    const spire = K.cone(3.3, 6, 0x8a6aa8, 'shingle', 4); spire.rotation.y = Math.PI / 4; spire.position.y = 22.6; t.add(spire);
    t.add(mesh(sphere(0.3, 10, 8), mat(0xffd23a), 0, 25.8, 0));
    t.add(mesh(box(2.6, 3, 4.2, 0.1), mat(0x3a2a40), 0, 16.5, 0));
    t.add(mesh(lathe('bell', [[0.0001, 0.9], [0.3, 0.85], [0.45, 0.4], [0.7, 0]], 18), mat(0xd9b44a), 0, 16.2, 0));
    g.add(t);
    g.userData.bellTower = { x: w / 2 + 3, y: 16, z: 7 };
    const rose = new THREE.Mesh(new THREE.CircleGeometry(3, 32), new THREE.MeshBasicMaterial({ map: PM.ctex('roseWin', 256, 256, (c, W2) => { const cols = ['#ff5d7a', '#ffd84a', '#4fc1e9', '#8ee07a', '#b69cff', '#ff9a4a']; for (let i = 0; i < 12; i++) { c.fillStyle = cols[i % 6]; c.beginPath(); c.moveTo(128, 128); c.arc(128, 128, 128, i / 12 * Math.PI * 2, (i + 1) / 12 * Math.PI * 2); c.fill(); } c.strokeStyle = '#3a2a40'; c.lineWidth = 6; for (let r = 30; r < 128; r += 34) { c.beginPath(); c.arc(128, 128, r, 0, Math.PI * 2); c.stroke(); } for (let i = 0; i < 12; i++) { c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.cos(i / 6 * Math.PI) * 128, 128 + Math.sin(i / 6 * Math.PI) * 128); c.stroke(); } }) }));
    rose.position.set(0, hh - 2.5, d / 2 + 0.06); rose.userData.noBake = true; g.add(rose);
    g.add(mesh(geo('roseRing', () => new THREE.TorusGeometry(3.05, 0.25, 10, 40)), tm('marble', 0xfbf8f2), 0, hh - 2.5, d / 2 + 0.1));
    windows(g, w, hh, d, 'left', [4.5], { n: 5, ww: 1.2, wh: 3, arch: true, box: false, curtain: '#b69cff' });
    windows(g, w, hh, d, 'right', [4.5], { n: 5, ww: 1.2, wh: 3, arch: true, box: false, curtain: '#b69cff' });
    const door = K.door(2.8, 3.6, 0x6a4028, { arch: true, frame: 0xe8dcc8, matColor: 0xff8fb1 }); door.position.set(0, 0.42, d / 2 + 0.03); g.add(door);
    sign(g, '⛪ 축복의 마블 대성당', 7, hh + 1.2, d / 2 + 0.5, '#ffffff', '#8a6aa8');
    for (const x of [-4, 4]) { const pl = K.planter(0xf0e6d8, 0xffffff); pl.position.set(x, 0.4, d / 2 + 1); g.add(pl); }
    for (const x of [-2.4, 2.4]) { const c = K.column(4.4); c.position.set(x, 0.4, d / 2 + 0.5); g.add(c); }
    for (let i = 0; i < 3; i++) g.add(tbox(6 - i * 0.4, 0.16, 0.5, 'marble', 0xfbf8f2, 0, 0.1 + i * 0.15, d / 2 + 1.6 - i * 0.45, 0.04, 2));
    return g;
  };

  // =========================================================
  // 천문대 — 돌 원통 + 금속 돔 + 발코니
  // =========================================================
  BLD.observatory = (p) => {
    const g = new THREE.Group();
    g.add(mesh(geo('obsBase', () => AC.scaleUV(new THREE.CylinderGeometry(7.1, 7.3, 0.6, 32), 30, 0.5)), tm('marble', 0xf4eee6), 0, 0.3, 0));
    g.add(mesh(geo('obsBody', () => AC.scaleUV(new THREE.CylinderGeometry(6.5, 6.8, 6, 32, 1, true), 28, 4)), tm('ashlar', 0xfff6ea), 0, 3.4, 0));
    g.add(mesh(geo('obsTop', () => new THREE.CylinderGeometry(6.5, 6.5, 0.2, 32)), mat(0xf1eadc), 0, 6.4, 0));
    g.add(mesh(geo('obsRail', () => new THREE.TorusGeometry(7.2, 0.08, 6, 48)), mat(0xffffff), 0, 7.2, 0).rotateX(Math.PI / 2));
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; g.add(mesh(cyl(0.05, 0.05, 0.8, 6), mat(0xffffff), Math.cos(a) * 7.2, 6.8, Math.sin(a) * 7.2)); }
    g.add(mesh(geo('obsDeck', () => new THREE.CylinderGeometry(7.3, 7.3, 0.25, 32)), tm('plank', 0xc99760), 0, 6.45, 0));
    const dome = K.dome(6.2, 0xdfe6f0, 'metal'); dome.position.y = 6.5; g.add(dome);
    g.add(mesh(box(1.4, 6, 1, 0.1), mat(0x2b2b30), 0, 9.5, 2.2).rotateX(-0.6));
    const tel = mesh(cyl(0.6, 0.8, 5), mat(0xffffff), 0, 11.5, 3.5); tel.rotation.x = -0.9; g.add(tel);
    windows(g, 13, 6, 13, 'left', [3.6], { n: 1, curtain: '#8fa0ff' }); windows(g, 13, 6, 13, 'right', [3.6], { n: 1, curtain: '#8fa0ff' });
    const dr = K.door(1.6, 2.4, 0x3a4466, { arch: true }); dr.position.set(0, 0.55, 6.72); g.add(dr);
    sign(g, '🔭 별빛 천문대', 5, 5.2, 6.9, '#1c2240', '#ffd84a');
    return g;
  };

  // =========================================================
  // 스카이라운지 — 층층이 줄어드는 둥근 유리 타워
  // =========================================================
  const winT = (key, cols, rows, lit, tint) => PM.ctex('acwin:' + key, 256, 256, (c, W2, H2) => { c.fillStyle = '#e8eef8'; c.fillRect(0, 0, W2, H2); const cw = W2 / cols, rh = H2 / rows; for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { c.fillStyle = Math.random() < lit ? '#fff1b0' : (tint || '#8fc8f0'); c.fillRect(x * cw + 4, y * rh + 5, cw - 8, rh - 9); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x * cw + 6, y * rh + 7, (cw - 12) * 0.4, rh - 14); } });
  function glassCyl(r, h, key, cols, rows, lit, tint, seg = 24) { const t = winT(key, cols, rows, lit, tint); return mesh(geo(`gc${r},${h},${key}`, () => new THREE.CylinderGeometry(r, r, h, seg)), H.soften(new THREE.MeshLambertMaterial({ map: t })), 0, h / 2, 0); }
  BLD.skyscraper = (p) => {
    const g = new THREE.Group(); const { w, d, h } = p.bld;
    g.add(K.base(w, d, 0.8, 0xf4f0ea, 'marble'));
    const t1 = glassCyl(w / 2, h * 0.45, 'sky1', 10, 12, 0.35, '#9ab8ff', 8); t1.position.y = 0.4; t1.rotation.y = Math.PI / 8; t1.scale.set(1.08, 1, 1.08); g.add(t1);
    g.add(mesh(cyl(w / 2 + 0.6, w / 2 + 0.6, 0.6, 8), mat(0x2a2a3a), 0, h * 0.45 + 0.7, 0).rotateY(Math.PI / 8));
    const t2 = glassCyl(w * 0.4, h * 0.32, 'sky2', 12, 10, 0.4, '#b8a8ff'); t2.position.y = h * 0.45 + 1; g.add(t2);
    g.add(mesh(cyl(w * 0.44, w * 0.44, 0.5, 24), mat(0x2a2a3a), 0, h * 0.77 + 1.2, 0));
    const t3 = glassCyl(w * 0.3, h * 0.22, 'sky3', 10, 7, 0.55, '#d8c8ff'); t3.position.y = h * 0.77 + 1.4; g.add(t3);
    const topY = h * 0.99 + 1.4;
    g.add(mesh(cyl(w * 0.34, w * 0.34, 0.8, 24), mat(0x2a2a3a), 0, topY, 0));
    const ring = mesh(geo('skyRing2', () => new THREE.TorusGeometry(w * 0.42, 0.25, 8, 40)), glow(0xb48cff), 0, topY + 1.2, 0); ring.rotation.x = Math.PI / 2; ring.userData.noBake = true; g.add(ring);
    g.add(mesh(cyl(0.08, 0.3, 9, 8), mat(0xdfe6f0), 0, topY + 5, 0)); const tip = mesh(sphere(0.3, 10, 8), glow(0xff5d7a), 0, topY + 9.6, 0); tip.userData.noBake = true; g.add(tip);
    sign(g, '✨ NEBULA 80F 스카이라운지', 9, 8, w / 2 + 0.7, '#1a1a2a', '#e8d4ff', '#b48cff');
    const lobby = new THREE.Group(); lobby.position.set(0, 0.4, w / 2 + 0.4);
    for (const x of [-2, 2]) lobby.add(mesh(cyl(0.2, 0.2, 3.4, 12), mat(0xd9b44a), x, 1.7, 1.2));
    lobby.add(mesh(box(5, 0.3, 3, 0.1), mat(0x2a2a3a), 0, 3.5, 0.6)); g.add(lobby);
    const dr = K.door(2.4, 2.8, 0x2a2a3a, { frame: 0xd9b44a, lamp: false }); dr.position.set(0, 0.42, w / 2 + 0.55); g.add(dr);
    return g;
  };

  // =========================================================
  // 쇼핑몰 — 양끝이 둥근 유리몰 + 1층 가게 차양
  // =========================================================
  BLD.mall = (p) => {
    const g = new THREE.Group(); const { w, d, h } = p.bld;
    g.add(K.base(w, d, 0.5, 0xfbf6f8, 'marble'));
    const core = mesh(geo('mallCore' + w, () => new THREE.BoxGeometry(w - d, h, d)), H.soften(new THREE.MeshLambertMaterial({ map: winT('mall', 8, 4, 0.5, '#ffc8e8') })), 0, h / 2 + 0.4, 0); g.add(core);
    for (const s of [-1, 1]) { const c = glassCyl(d / 2, h, 'mallc', 6, 4, 0.5, '#ffc8e8'); c.position.set(s * (w - d) / 2, 0.4, 0); g.add(c); }
    for (let f = 1; f < 4; f++) { g.add(mesh(box(w - d, 0.3, d + 0.3, 0.05), mat(0xffffff), 0, f * 4 + 0.4, 0)); for (const s of [-1, 1]) g.add(mesh(cyl(d / 2 + 0.15, d / 2 + 0.15, 0.3, 24), mat(0xffffff), s * (w - d) / 2, f * 4 + 0.4, 0)); }
    g.add(mesh(cyl(d / 2 + 0.3, d / 2 + 0.3, 0.5, 24), mat(0xff8fb1), -(w - d) / 2, h + 0.6, 0)); g.add(mesh(cyl(d / 2 + 0.3, d / 2 + 0.3, 0.5, 24), mat(0xff8fb1), (w - d) / 2, h + 0.6, 0)); g.add(mesh(box(w - d, 0.5, d + 0.6, 0.1), mat(0xff8fb1), 0, h + 0.6, 0));
    for (let i = 0; i < 6; i++) { const b = K.planter(0xffffff, [0xff8fb1, 0xffd84a][i % 2]); b.position.set(-w / 2 + 3 + i * (w - 6) / 5, h + 0.8, (i % 2 ? -1 : 1) * 2); g.add(b); }
    const cols = [[0xff8fb1, 0xffffff], [0x4fc1e9, 0xffffff], [0xffd84a, 0xffffff]];
    [-5, 5].forEach((x, i) => { const aw = K.awning(4, 1.4, cols[i][0], cols[i][1]); aw.position.set(x, 3.3, d / 2 + 0.1); g.add(aw); });
    const holo = PM.sign('💎 PLATINUM TOWER · 한정판 SALE', w - 6, 2.6, '#ff3a9a', '#ffffff', '#ffffff'); holo.position.set(0, h - 2.5, d / 2 + 0.2); g.add(holo);
    const dr = K.door(3, 2.8, 0xffffff, { frame: 0xff8fb1, lamp: false }); dr.position.set(0, 0.42, d / 2 + 0.03); g.add(dr);
    const salon = PM.sign('✂️ 스타일 뷰티 살롱', 4, 1, '#14101f', '#ff8fd0'); salon.position.set(5, 4.6, d / 2 + 0.2); g.add(salon);
    return g;
  };

  // =========================================================
  // 오락실 — 둥근 반원 지붕 + 네온 전구 테두리 + 볼링핀
  // =========================================================
  BLD.arcade = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld, h = 5.5;
    body(g, w, h, d, 'tile', 0x9a7ae8, { trim: 0x39ffb0, band: false, baseKind: 'terrazzo', baseColor: 0xffffff });
    const vault = mesh(geo('arcVault' + w + d, () => AC.scaleUV(new THREE.CylinderGeometry(d / 2, d / 2, w + 0.4, 28, 1, false, 0, Math.PI), 8, w)), tm('metal', 0x8a5ad0), 0, h + 0.4, 0); vault.rotation.z = Math.PI / 2; vault.scale.set(0.35, 1, 1); g.add(vault);
    const s = PM.sign('🎮 NEON SPARK · 오락실 & 24시 볼링장', w - 3, 2, '#14101f', '#39ffb0', '#39ffb0'); s.position.set(0, h - 0.8, d / 2 + 0.3); g.add(s);
    bulbRow(g, -w / 2 + 1.2, w / 2 - 1.2, h + 0.35, d / 2 + 0.3, 0xfff0a0, 16);
    bulbRow(g, -w / 2 + 1.2, w / 2 - 1.2, h - 2, d / 2 + 0.3, 0xff8fd0, 16);
    windows(g, w, h, d, 'front', [2.2], { n: 4, skipDoor: 2.2, ww: 2, wh: 1.4, box: false, curtain: '#39ffb0', frame: 0xff3a9a });
    const pin = new THREE.Group(); pin.position.set(w / 2 - 1.5, h + 1.2, 0);
    pin.add(mesh(lathe('pin', [[0.0001, 0], [0.7, 0.1], [0.9, 1], [0.45, 2], [0.6, 2.6], [0.0001, 3]]), mat(0xffffff)));
    pin.add(mesh(geo('pinBand', () => new THREE.TorusGeometry(0.5, 0.08, 8, 20)), mat(0xff3a3a), 0, 2.05, 0).rotateX(Math.PI / 2));
    g.add(pin);
    const dr = K.door(2.4, 2.6, 0xff3a9a, { frame: 0x39ffb0, lamp: false, matColor: 0x39ffb0 }); dr.position.set(0, 0.42, d / 2 + 0.03); g.add(dr);
    return g;
  };

  // =========================================================
  // 미식 골목 — 초밥집(일식 기와 + 노렌) / 차이니스 펍(붉은 기둥 + 휘어진 지붕)
  // =========================================================
  BLD.restaurant = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld, h = 3.4;
    const red = p.id === 'pub';
    body(g, w, h, d, red ? 'stucco' : 'plank', red ? 0xffe6d0 : 0xf0d0a0, { trim: red ? 0xd8453a : 0x5a3a28, wainscot: red ? 'tile' : null, wainscotColor: 0xe8584a, wainscotH: 0.9 });
    const roof = K.gable(w, d, 2.2, red ? 0x2f8a5a : 0x3a4a6a, { kind: 'rooftile', wallKind: red ? 'stucco' : 'plank', wallColor: red ? 0xffe6d0 : 0xf0d0a0, ridge: red ? 0xffd23a : 0x2a3448, gableWindow: false });
    roof.position.y = h + 0.4; g.add(roof);
    // 휘어 올라간 처마 끝 장식
    for (const [x, z] of [[-w / 2 - 0.6, -d / 2 - 0.6], [w / 2 + 0.6, -d / 2 - 0.6], [-w / 2 - 0.6, d / 2 + 0.6], [w / 2 + 0.6, d / 2 + 0.6]]) { const c = mesh(geo('eaveTip', () => new THREE.ConeGeometry(0.22, 0.8, 8)), mat(red ? 0xffd23a : 0x2a3448), x, h + 0.6, z); c.rotation.set(z > 0 ? -0.7 : 0.7, 0, x > 0 ? -0.7 : 0.7); g.add(c); }
    if (red) for (const x of [-w / 2 + 0.6, -1.4, 1.4, w / 2 - 0.6]) g.add(mesh(cyl(0.2, 0.22, h, 14), mat(0xc0392b), x, 0.4 + h / 2, d / 2 + 0.6));
    const noren = new THREE.Group(); noren.position.set(0, h - 0.4, d / 2 + 0.12);
    for (let i = 0; i < 4; i++) { const n = mesh(box(0.55, 0.9, 0.04, 0.02), mat(red ? 0xffd84a : 0x2f4b6e), -0.9 + i * 0.6, -0.45, 0); noren.add(n); }
    g.add(noren);
    for (const x of [-w / 2 + 1, w / 2 - 1]) { const l = mesh(sphere(0.35, 14, 10), glow(red ? 0xff3a2a : 0xffe8b0), x, h - 0.8, d / 2 + 0.6); l.scale.y = 1.3; l.userData.noBake = true; g.add(l); g.add(mesh(cyl(0.02, 0.02, 0.5, 4), mat(0x3a3a44), x, h - 0.2, d / 2 + 0.6)); }
    windows(g, w, h, d, 'front', [1.9], { n: 2, skipDoor: 1.4, ww: 1.8, wh: 1.2, box: !red, frame: red ? 0xc0392b : 0x5a3a28, curtain: red ? '#ffd84a' : '#ffffff' });
    frontDoor(g, d, { color: red ? 0xc0392b : 0x8a5a3b, w: 1.3, frame: red ? 0xffd23a : 0x5a3a28, lamp: false });
    const s = PM.sign(red ? '🥟 레트로 차이니스 펍' : '🍣 24시 회전초밥', w - 2, 1.1, red ? '#6a1a1a' : '#fff8ec', red ? '#ffd84a' : '#2f4b6e'); s.position.set(0, h + 1.4, d / 2 + 0.95); g.add(s);
    if (!red) for (let i = 0; i < 9; i++) g.add(mesh(cyl(0.05, 0.05, 1.4, 6), mat(0x8fbf5a), w / 2 + 0.3, 1.1, -d / 2 + 0.5 + i * (d - 1) / 8));
    return g;
  };

  // =========================================================
  // 클럽 — 벽돌 + 네온 계단 + 전구 간판
  // =========================================================
  BLD.club = (p) => {
    const g = new THREE.Group(); const { w, d, h } = p.bld;
    body(g, w, h, d, 'brick', 0x3a2a4a, { trim: 0xff3a9a, band: false });
    g.add(mesh(box(w + 0.3, 0.2, d + 0.3, 0.05), glow(0xff3a9a), 0, h + 0.4, 0));
    const s = PM.sign('🎧 THE BASEMENT · 지하 클럽', w - 1, 1.3, '#14101f', '#ff3a9a', '#ff3a9a'); s.position.set(0, h + 1.3, d / 2 + 0.1); g.add(s);
    bulbRow(g, -w / 2 + 0.6, w / 2 - 0.6, h + 2.1, d / 2 + 0.1, 0xfff0a0, 12);
    for (let i = 0; i < 5; i++) g.add(mesh(box(2.2, 0.2, 0.6, 0.03), mat(0x55595f), 0, 0.3 - i * 0.05, d / 2 + 0.6 + i * 0.5));
    for (const s2 of [-1, 1]) g.add(mesh(box(0.1, 0.1, 2.5, 0.02), glow(0x39c0ff), s2 * 1.2, 0.8, d / 2 + 1.5));
    frontDoor(g, d, { color: 0x3a2a70, w: 1.6, frame: 0xff3a9a, lamp: false, step: false });
    return g;
  };

  // =========================================================
  // 편의점 — 흰 패널 + 초록 띠 + 둥근 차양 + 자판기
  // =========================================================
  BLD.shop = (p) => {
    const g = new THREE.Group(); const { w, d, h } = p.bld; const c = p.bld.color || 0x7ad0a0;
    body(g, w, h - 0.4, d, 'tile', 0xffffff, { trim: 0xffffff, baseKind: 'terrazzo', baseColor: 0xffffff });
    g.add(mesh(box(w + 0.3, 0.7, d + 0.3, 0.12), mat(c), 0, h - 0.2, 0));
    g.add(mesh(box(w + 0.1, 0.2, d + 0.1, 0.06), mat(0xffb13d), 0, h - 0.6, 0));
    g.add(mesh(box(w - 2.2, 2, 0.1, 0.03), glass(0xbfe8ff), -0.6, 1.5, d / 2 + 0.05));
    for (let i = 0; i < 4; i++) g.add(mesh(box(0.35, 0.5, 0.2, 0.05), mat([0xffd84a, 0xff6f61, 0x8fd3ff, 0xffffff][i]), -2.6 + i * 0.9, 1.0, d / 2 - 0.3));
    const aw = K.awning(w - 1, 1.3, c, 0xffffff); aw.position.set(0, h - 0.8, d / 2 + 0.1); g.add(aw);
    frontDoor(g, d, { x: 2, color: c, w: 1.2, frame: 0xffffff });
    const vm = new THREE.Group(); vm.position.set(w / 2 + 0.6, 0.4, d / 2 - 0.8);
    vm.add(mesh(box(1, 1.9, 0.8, 0.08), mat(0xff6f61), 0, 0.95, 0)); vm.add(mesh(box(0.7, 0.9, 0.05, 0.02), glass(0xe8f8ff), 0, 1.25, 0.41));
    for (let i = 0; i < 6; i++) vm.add(mesh(cyl(0.06, 0.06, 0.2, 8), mat([0xffd84a, 0x4fc1e9, 0x8ee07a][i % 3]), -0.2 + (i % 3) * 0.2, 1.05 + Math.floor(i / 3) * 0.35, 0.3));
    g.add(vm);
    sign(g, '🏪 24시 편의점', w - 1.5, h + 0.9, d / 2 + 0.2, '#ffffff', '#3a9a6a');
    return g;
  };

  // =========================================================
  // 오피스 / 병원 — 기존 유리 빌딩 + 돌 기단 + 입구 캐노피 + 화단
  // =========================================================
  const oldOffice = BLD.office, oldHosp = BLD.hospital;
  BLD.office = (p) => {
    const g = oldOffice(p); const { w, d } = p.bld;
    const can = new THREE.Group(); can.position.set(0, 0, d / 2 + 0.4);
    can.add(mesh(box(6, 0.3, 2.4, 0.1), mat(0x2f4b6e), 0, 3.4, 1)); for (const x of [-2.7, 2.7]) can.add(mesh(cyl(0.14, 0.14, 3.2, 10), mat(0xdfe6f0), x, 1.7, 2)); g.add(can);
    for (const x of [-w / 2 + 1.5, w / 2 - 1.5]) { const pl = K.planter(0xd8d0c4, 0xffd84a); pl.position.set(x, 0, d / 2 + 1); g.add(pl); }
    const H2 = p.bld.h;
    for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) g.add(mesh(cyl(0.8, 0.8, H2, 18), tm('panel', 0x3a5a8a), x, H2 / 2, z));
    for (let f = 1; f < 6; f++) g.add(mesh(box(w + 0.4, 0.35, d + 0.4, 0.12), mat(0xf4f6f8), 0, f * H2 / 6, 0));
    g.add(mesh(K.dome(4, 0x3a5a8a, 'metal').geometry, tm('metal', 0x3a5a8a), 0, H2 + 1, -2));
    return g;
  };
  BLD.hospital = (p) => {
    const g = oldHosp(p); const { w, d } = p.bld;
    for (const s of [-1, 1]) { const c = glassCyl(3, p.bld.h - 2, 'hospc', 6, 5, 0.3, '#bfe8ff'); c.position.set(s * (w / 2), 0.5, d / 2 - 3); g.add(c); g.add(mesh(cyl(3.2, 3.2, 0.4, 24), mat(0x8fe3c0), s * (w / 2), p.bld.h - 1.3, d / 2 - 3)); }
    const can = new THREE.Group(); can.position.set(0, 0, d / 2 + 0.3);
    can.add(mesh(geo('hospCan', () => new THREE.CylinderGeometry(3.4, 3.4, 0.3, 28, 1, false, -Math.PI / 2, Math.PI)), mat(0x8fe3c0), 0, 3.3, 0)); for (const x of [-2.8, 2.8]) can.add(mesh(cyl(0.12, 0.12, 3.1, 10), mat(0xffffff), x, 1.6, 2)); g.add(can);
    return g;
  };

  // =========================================================
  // 시청 — 돌벽 + 기둥 + 박공 + 시계 돔 + 깃발
  // =========================================================
  const oldHall = BLD.cityhall;
  BLD.cityhall = (p) => {
    const g = oldHall(p); const { w, d, h } = p.bld;
    g.add(tbox(w + 0.08, h - 2.05, d + 0.08, 'marble', 0xfbf8f2, 0, 0, 0, 0.12, 2.2));
    for (let i = 0; i < 7; i++) { const c = K.column(h - 2.6); c.position.set(-w / 2 + 1.5 + i * (w - 3) / 6, 0.5, d / 2 + 0.8); g.add(c); }
    for (let i = 0; i < 3; i++) g.add(tbox(w + 2 - i * 0.6, 0.18, 0.6, 'marble', 0xf4f0e8, 0, i * 0.17, d / 2 + 2.4 - i * 0.5, 0.04, 2));
    windows(g, w, h - 2, d, 'left', [3.5], { n: 2, arch: true, shutters: 0x5a7ab8 }); windows(g, w, h - 2, d, 'right', [3.5], { n: 2, arch: true, shutters: 0x5a7ab8 });
    const dome = K.dome(3, 0x5aa89a, 'metal'); dome.position.set(0, h - 1.6, -1.5); g.add(dome);
    const clock = mesh(cyl(1.1, 1.1, 0.2, 28), mat(0xffffff), 0, h + 0.8, 1.3); clock.rotation.x = Math.PI / 2; g.add(clock);
    g.add(mesh(box(0.08, 0.8, 0.05, 0.02), mat(0x2b2b30), 0, h + 1.0, 1.42)); g.add(mesh(box(0.6, 0.08, 0.05, 0.02), mat(0x2b2b30), 0.25, h + 0.8, 1.42));
    for (const [x, c] of [[-w / 2 - 1.5, 0xff6f61], [w / 2 + 1.5, 0x4fc1e9]]) { g.add(mesh(cyl(0.07, 0.07, 7, 8), mat(0xdfe6f0), x, 3.5, d / 2 + 2)); const f = mesh(box(1.6, 1, 0.04, 0.02), mat(c), x + 0.85, 6.3, d / 2 + 2); g.add(f); }
    return g;
  };

  // =========================================================
  // 도서관 — 벽돌 + 아치 창 + 청록 금속 지붕 + 둥근 탑
  // =========================================================
  BLD.library = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld, h = 7.5;
    body(g, w, h, d, 'brick', 0xe0906a, { trim: 0xfbf8f2, trimKind: 'marble', baseKind: 'marble', baseColor: 0xf4eee6 });
    const roof = K.gable(w, d, 4, 0x4a9a8a, { kind: 'metal', wallKind: 'brick', wallColor: 0xd8845a }); roof.position.y = h + 0.4; g.add(roof);
    const tw = new THREE.Group(); tw.position.set(w / 2 - 1.2, 0, -d / 2 + 1.2);
    tw.add(mesh(geo('libTw', () => AC.scaleUV(new THREE.CylinderGeometry(2, 2, h + 3.5, 24), 12, h + 3.5)), tm('brick', 0xc9744a), 0, (h + 3.5) / 2 + 0.4, 0));
    const tc = K.cone(2.5, 3.2, 0x4a9a8a, 'metal', 24); tc.position.y = h + 5.5; tw.add(tc); g.add(tw);
    windows(g, w, h, d, 'front', [2.4, 5.4], { n: 4, skipDoor: 2.4, ww: 1.3, wh: 1.8, arch: true, box: false, frame: 0xfff4e6, curtain: '#fff4dc' });
    windows(g, w, h, d, 'left', [2.4, 5.4], { n: 3, ww: 1.3, wh: 1.8, arch: true, box: false, frame: 0xfff4e6, curtain: '#fff4dc' });
    for (const x of [-2, 2]) { const c = K.column(4); c.position.set(x, 0.4, d / 2 + 1.2); g.add(c); }
    g.add(mesh(geo('libPed', () => { const s = new THREE.Shape(); s.moveTo(-3, 0); s.lineTo(0, 1.4); s.lineTo(3, 0); s.lineTo(-3, 0); return AC.wuv(new THREE.ExtrudeGeometry(s, { depth: 1.8, bevelEnabled: false }), 1.5); }), tm('marble', 0xfbf8f2), 0, 4.4, d / 2 + 0.2));
    frontDoor(g, d, { color: 0x6a4028, arch: true, w: 1.8, h: 2.6, frame: 0xfff4e6 });
    woodSign(g, '📚 시립 도서관 & 힐링 북카페', 5.5, 6.5, d / 2 + 0.3);
    for (let i = 0; i < 3; i++) g.add(tbox(4.4 - i * 0.2, 0.16, 0.5, 'marble', 0xf4f0e8, 0, 0.1 + i * 0.15, d / 2 + 2.2 - i * 0.45, 0.04, 2));
    return g;
  };

  // =========================================================
  // 공방 — 통나무 벽 + 빨간 헛간 지붕 + 큰 문 + 장작
  // =========================================================
  BLD.workshop = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld, h = 3.8;
    body(g, w, h, d, 'log', 0xc98a52, { trim: 0x8a5a3b });
    const roof = K.gable(w, d, 2.8, 0xb8483a, { wallKind: 'plank', wallColor: 0xc98a52 }); roof.position.y = h + 0.4; g.add(roof);
    const ch = K.chimney(2, 0x9a9a9a); ch.position.set(-w / 2 + 1.5, h + 1.2, -1.2); g.add(ch);
    const bd = new THREE.Group(); bd.position.set(0, 0.42, d / 2 + 0.04);
    for (const s of [-1, 1]) { const leaf = tbox(1.2, 2.8, 0.16, 'plank', 0xb8483a, s * 0.62, 0, 0, 0.04, 1); bd.add(leaf); const x1 = mesh(box(1.5, 0.12, 0.05, 0.02), mat(0xffffff), s * 0.62, 1.4, 0.1); x1.rotation.z = s * 0.95; bd.add(x1); }
    g.add(bd);
    windows(g, w, h, d, 'front', [2.2], { n: 2, skipDoor: 1.6, shutters: 0x5a8a4a, ww: 1.2 });
    windows(g, w, h, d, 'left', [2.2], { n: 2, shutters: 0x5a8a4a });
    for (let i = 0; i < 8; i++) { const l = mesh(cyl(0.18, 0.18, 1.3, 10), tm('bark', 0x9a6a3e), w / 2 + 0.7, 0.6 + Math.floor(i / 4) * 0.34, d / 2 - 1 - (i % 4) * 0.38 - (Math.floor(i / 4)) * 0.19); l.rotation.x = Math.PI / 2; g.add(l); }
    woodSign(g, '🔨 마을 공방 & 플리마켓', 4.6, h + 1.5, d / 2 + 0.45);
    return g;
  };

  // =========================================================
  // 달빛 차관 — 한옥 풍 휘어진 기와 지붕 + 창살 창 + 등불
  // =========================================================
  BLD.teahouse = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld, h = 3.2;
    g.add(tbox(w + 0.6, 0.7, d + 0.6, 'stone', 0xcfc6b8, 0, -0.05, 0, 0.1, 1));
    g.add(tbox(w, h, d, 'stucco', 0xfff4dc, 0, 0.6, 0, 0.08, 1.4));
    for (const x of [-w / 2, -w / 4, 0.01, w / 4, w / 2]) for (const z of [-d / 2, d / 2]) g.add(mesh(box(0.28, h, 0.28, 0.06), tm('plank', 0x8a5a3b), x, 0.6 + h / 2, z));
    g.add(mesh(box(w + 0.3, 0.3, d + 0.3, 0.06), tm('plank', 0x6a4028), 0, 0.6 + h, 0));
    // 휘어진 기와 지붕
    const roof = new THREE.Mesh(geo('hanokRoof' + w + d, () => { const s = new THREE.Shape(); const o = 1.6; s.moveTo(-d / 2 - o, -0.3); s.quadraticCurveTo(-d / 4, 0.9, 0, 2.6); s.quadraticCurveTo(d / 4, 0.9, d / 2 + o, -0.3); s.lineTo(d / 2 + o, -0.05); s.quadraticCurveTo(d / 4, 1.2, 0, 2.9); s.quadraticCurveTo(-d / 4, 1.2, -d / 2 - o, -0.05); s.closePath(); const e = new THREE.ExtrudeGeometry(s, { depth: w + 2.4, bevelEnabled: false }); e.translate(0, 0, -(w + 2.4) / 2); e.rotateY(Math.PI / 2); e.computeVertexNormals(); return AC.wuv(e, 1.8); }), tm('rooftile', 0x5a5a6a));
    roof.position.y = h + 0.8; roof.castShadow = true; g.add(roof);
    const ends = mesh(geo('hanokEnd' + d, () => { const s = new THREE.Shape(); s.moveTo(-d / 2, 0); s.quadraticCurveTo(-d / 4, 1.0, 0, 2.5); s.quadraticCurveTo(d / 4, 1.0, d / 2, 0); s.closePath(); const e = new THREE.ExtrudeGeometry(s, { depth: w - 0.2, bevelEnabled: false }); e.translate(0, 0, -(w - 0.2) / 2); e.rotateY(Math.PI / 2); return e; }), mat(0xf6ead0), 0, h + 0.8, 0); g.add(ends);
    // 창살 창 (한지)
    const lat = PM.ctex('lattice', 128, 128, (c, W2) => { c.fillStyle = '#fff8e8'; c.fillRect(0, 0, W2, W2); c.strokeStyle = '#8a5a3b'; c.lineWidth = 5; for (let i = 0; i <= W2; i += 21) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, W2); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(W2, i); c.stroke(); } });
    for (const x of [-w / 2 + 1.6, w / 2 - 1.6]) { const pnl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshLambertMaterial({ map: lat, emissive: 0x332200 })); pnl.position.set(x, 2.3, d / 2 + 0.03); g.add(pnl); }
    const lanM = glow(0xffb13d);
    for (const x of [-w / 2 - 0.4, w / 2 + 0.4]) { const l = mesh(geo('lan', () => new THREE.CylinderGeometry(0.28, 0.28, 0.6, 12)), lanM, x, 3, d / 2 + 0.6); l.userData.noBake = true; g.add(l); g.add(mesh(cyl(0.3, 0.3, 0.06, 12), mat(0x3a2a20), x, 3.32, d / 2 + 0.6)); }
    for (let i = 0; i < 10; i++) { const b2 = mesh(sphere(0.45, 10, 8), tm('leaf', [0x3f8f3e, 0x4ea449, 0x62b85a][i % 3]), -w / 2 - 0.3, 0.8 + (i % 5) * 0.6, -d / 2 + 0.6 + Math.floor(i / 5) * 1.2); b2.scale.x = 0.5; g.add(b2); }
    frontDoor(g, d, { color: 0x6a4028, w: 1.4, h: 2.2, frame: 0x8a5a3b, lamp: false });
    woodSign(g, '🍵 달빛 차관', 2.8, h + 0.3, d / 2 + 0.35, '#3a2a20', '#ffd84a');
    return g;
  };

  // =========================================================
  // 어린이 학교 — 붉은 벽돌 + 크림 벽 + 시계탑
  // =========================================================
  BLD.school = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld, h = 4.2;
    body(g, w, h, d, 'siding', 0xfff4d6, { trim: 0xffffff });
    g.add(tbox(w + 0.04, 1.2, d + 0.04, 'tile', 0x9fd8f5, 0, 0.4, 0, 0.1, 1));
    const roof = K.gable(w, d, 2.4, 0xff8f6a, { wallColor: 0xfff4d6 }); roof.position.y = h + 0.4; g.add(roof);
    const tw = new THREE.Group(); tw.position.set(0, h + 0.4, d / 2 - 1.2);
    tw.add(tbox(2, 3.6, 2, 'fishscale', 0xfff4d6, 0, 0, 0, 0.06, 1));
    const cr = K.cone(1.8, 2.2, 0xff8f6a, 'shingle', 4); cr.rotation.y = Math.PI / 4; cr.position.y = 4.7; tw.add(cr);
    const clock = mesh(cyl(0.7, 0.7, 0.12, 24), mat(0xffffff), 0, 2.3, 1.05); clock.rotation.x = Math.PI / 2; tw.add(clock);
    tw.add(mesh(box(0.06, 0.5, 0.04, 0.01), mat(0x2b2b30), 0, 2.45, 1.13)); tw.add(mesh(box(0.4, 0.06, 0.04, 0.01), mat(0x2b2b30), 0.16, 2.3, 1.13));
    g.add(tw);
    windows(g, w, h, d, 'front', [2.6], { n: 4, skipDoor: 1.6, shutters: 0x4fc1e9, curtain: '#ffe8a0' });
    windows(g, w, h, d, 'left', [2.6], { n: 2, shutters: 0x4fc1e9 }); windows(g, w, h, d, 'right', [2.6], { n: 2, shutters: 0x4fc1e9 });
    frontDoor(g, d, { color: 0x4fc1e9, w: 1.8, arch: true });
    g.add(mesh(cyl(0.06, 0.06, 5, 8), mat(0x9aa3ad), w / 2 + 1.5, 2.5, d / 2));
    g.add(mesh(box(1.4, 0.9, 0.05, 0.02), mat(0xffd84a), w / 2 + 2.2, 4.5, d / 2));
    woodSign(g, '🎒 섬 어린이 학교', 3.4, h - 0.2, d / 2 + 0.4);
    return g;
  };

  // =========================================================
  // 페리 터미널 — 흰 판자 + 파란 둥근 지붕 + 구명튜브 (출항판은 동적)
  // =========================================================
  BLD.terminal = (p) => {
    const g = new THREE.Group(); const { w, d, h } = p.bld;
    body(g, w, h - 1.2, d, 'siding', 0xf8fbff, { trim: 0x2f6bb0, wainscot: 'tile', wainscotColor: 0x7ab8f0, wainscotH: 0.9, baseKind: 'terrazzo', baseColor: 0xffffff });
    const vault = mesh(geo('termVault' + w + d, () => AC.scaleUV(new THREE.CylinderGeometry(d / 2 + 0.6, d / 2 + 0.6, w + 1, 28, 1, false, 0, Math.PI), 8, w)), tm('metal', 0x3a7bd5), 0, h - 0.8, 0); vault.rotation.z = Math.PI / 2; vault.scale.set(0.42, 1, 1); g.add(vault);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(w - 2, 2.6), new THREE.MeshBasicMaterial({ color: 0x222222 }));
    scr.position.set(0, h + 2.2, 0); scr.rotation.y = Math.PI; scr.userData.dyn = true; g.add(scr);
    g.add(mesh(box(w - 1.5, 3, 0.3, 0.05), mat(0x2b2b30), 0, h + 2.2, 0.2));
    for (const x of [-w / 2 + 1, w / 2 - 1]) { const buoy = mesh(geo('buoy', () => new THREE.TorusGeometry(0.45, 0.14, 10, 20)), mat(0xff6f61), x, 2.4, d / 2 + 0.15); g.add(buoy); for (let k = 0; k < 4; k++) { const st = mesh(box(0.2, 0.3, 0.3, 0.03), mat(0xffffff), x + Math.cos(k * Math.PI / 2) * 0.45, 2.4 + Math.sin(k * Math.PI / 2) * 0.45, d / 2 + 0.15); g.add(st); } }
    windows(g, w, h - 1.2, d, 'front', [2.4], { n: 2, skipDoor: 1.6, ww: 1.6, shutters: 0x3a7bd5, box: false });
    frontDoor(g, d, { color: 0x2f4b6e, w: 2, frame: 0xffffff });
    sign(g, '⛴️ 페리 터미널', 4.5, h - 0.4, d / 2 + 0.25, '#2f4b6e', '#ffffff');
    g.userData.board = scr;
    return g;
  };

  // =========================================================
  // 시티 타워 아파트 — 창문(동적) 위치는 그대로, 벽/지붕/발코니를 동물의 숲 풍으로
  // =========================================================
  const oldApt = BLD.apartment;
  BLD.apartment = (p) => {
    const g = oldApt(p); const { w, d, h } = p.bld;
    // 기존 흰 상자를 무늬 벽으로 덮기 (창문 틀보다 살짝 뒤)
    g.add(tbox(w + 0.06, h - 3.3, d + 0.06, 'stucco', 0xfff4e4, 0, 3.3, 0, 0.1, 1.6));
    g.add(tbox(w + 0.09, 3.35, d + 0.09, 'ashlar', 0xf6ecdc, 0, -0.02, 0, 0.1, 1.6));
    g.traverse(o => { if (o.isMesh && o.material && o.material.map && o.userData.noBake && Math.abs(o.position.y - (h + 2.2)) < 0.1) { o.position.set(0, h + 2.4, d / 2 - 0.1); } });
    const roof = K.gable(w, d, 4.2, 0xff8f6a, { wallColor: 0xfff2e0 }); roof.position.y = h + 0.5; g.add(roof);
    for (const x of [-9, 0, 9]) { const dm = new THREE.Group(); dm.position.set(x, h + 0.9, d / 2 - 1.2); dm.add(tbox(2.2, 1.6, 1.6, 'fishscale', 0xfff4e4, 0, 0, 0, 0.06, 1)); const r2 = K.gable(2.2, 1.6, 1.0, 0xff8f6a, { over: 0.25, gableWindow: false, wallColor: 0xfff2e0 }); r2.rotation.y = Math.PI / 2; r2.position.y = 1.6; dm.add(r2); const wn = K.window(0.9, 0.9, { box: false, curtain: '#ffe0a0' }); wn.position.set(0, 0.8, 0.82); dm.add(wn); g.add(dm); }
    for (const x of [-w / 2 + 3, w / 2 - 3]) { const ch = K.chimney(2.4, 0xc9765a); ch.position.set(x, h + 1.4, -1.5); g.add(ch); }
    const can = new THREE.Group(); can.position.set(0, 3, d / 2 + 0.1);
    can.add(K.awning(4.4, 1.6, 0xff8f6a, 0xffffff)); g.add(can);
    for (const x of [-4, 4]) { const pl = K.planter(0xd9a066, 0xff6f86); pl.position.set(x, 0, d / 2 + 1.2); g.add(pl); }
    return g;
  };

  // =========================================================
  // 빌라 8종 — 테마별 벽 무늬 / 지붕 / 덧창 / 굴뚝 / 현관
  // =========================================================
  const VILLA_LOOK = {
    glass: { wall: 'marble', color: 0xffffff, roof: 0x55595f, flat: true, shutter: null, curtain: '#e8f8ff' },
    log: { wall: 'log', color: 0xc98a52, roof: 0x6a8a4a, shutter: 0x8a5a3b, chimney: 0x9a9a9a },
    hanok: { wall: 'plaster', color: 0xf6ead0, roof: 0x3a3a44, hanok: true, shutter: null },
    chalet: { wall: 'fishscale', color: 0xffcfe4, roof: 0xff6f9f, shutter: 0xffffff, chimney: 0xffffff },
    med: { wall: 'stucco', color: 0xffffff, roof: 0x3a7bd5, flat: true, dome: true, shutter: 0x3a7bd5 },
    tree: { wall: 'log', color: 0x9a6a44, roof: 0x4fae4a, tree: true, shutter: 0x4fae4a },
    castle: { wall: 'ashlar', color: 0xf0ece6, roof: 0x8a6aa8, castle: true, shutter: null, curtain: '#b69cff' },
    container: { wall: 'metal', color: 0xff8a24, roof: 0x2f4b6e, flat: true, shutter: null },
  };
  const oldVilla = BLD.villa;
  BLD.villa = (p, ext) => {
    const L = VILLA_LOOK[ext] || VILLA_LOOK.log;
    if (L.tree || L.hanok) {   // 트리하우스/한옥은 고유 모양 유지 + 무늬만 덧씌움
      const g0 = oldVilla(p, ext);
      const th = PM.VILLA_THEMES[ext];
      g0.traverse(o => {
        if (!o.isMesh || !o.material || !o.material.color || o.material.map) return;
        const c = o.material.color.getHex();
        const kind = c === th.wall ? (L.tree ? 'log' : 'plaster') : c === th.roof ? (L.tree ? 'leaf' : 'rooftile') : c === 0x8a5a3b ? 'bark' : null;
        if (!kind) return;
        o.geometry = AC.wuv(o.geometry, kind === 'rooftile' ? 1.6 : 1);
        o.material = tm(kind, c === th.roof && L.tree ? 0x5fb850 : c);
      });
      return g0;
    }
    const g = new THREE.Group(); const { w, d, h } = p.bld; const hh = h - 2.2;
    const facing = p.plot ? p.plot.doorSide : 1;
    const inner = new THREE.Group(); if (facing < 0) inner.rotation.y = Math.PI; g.add(inner);
    body(inner, w, hh, d, L.wall, L.color, { trim: L.wall === 'metal' ? 0x2f4b6e : 0xffffff, scale: L.wall === 'ashlar' ? 1.4 : L.wall === 'marble' ? 2 : 1, baseKind: L.wall === 'marble' || L.wall === 'ashlar' ? 'marble' : 'stone' });
    if (L.flat) {
      inner.add(mesh(box(w + 0.6, 0.45, d + 0.6, 0.15), mat(L.roof), 0, hh + 0.6, 0));
      if (L.dome) { const dm = K.dome(1.8, L.roof, 'metal'); dm.position.set(-w / 4, hh + 0.8, -d / 4); inner.add(dm); }
      if (ext === 'glass') inner.add(mesh(box(w - 1, hh - 0.6, 0.08, 0.02), glass(0xbfe8ff), 0, 0.4 + hh / 2, d / 2 + 0.06));
      for (let i = 0; i < 3; i++) { const pl = K.planter(0xffffff, 0xff8fb1); pl.position.set(-w / 2 + 1 + i * (w - 2) / 2, hh + 0.8, d / 2 - 0.8); inner.add(pl); }
    } else if (L.castle) {
      for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) { inner.add(mesh(geo('cTw' + hh, () => AC.scaleUV(new THREE.CylinderGeometry(0.95, 1.05, hh + 2, 16), 5, hh + 2)), tm('ashlar', L.color), x, 0.4 + (hh + 2) / 2, z)); const c = K.cone(1.25, 2.2, L.roof, 'shingle', 16); c.position.set(x, 0.4 + hh + 3.1, z); inner.add(c); }
      for (let i = 0; i < 7; i++) inner.add(tbox(0.6, 0.6, d + 0.1, 'ashlar', L.color, -w / 2 + 0.8 + i * (w - 1.6) / 6, hh + 0.4, 0, 0.05, 1.3));
    } else {
      const roof = K.gable(w, d, 2.6, L.roof, { wallKind: L.wall, wallColor: L.color }); roof.position.y = hh + 0.4; inner.add(roof);
      if (L.chimney) { const ch = K.chimney(1.6, L.chimney === 0xffffff ? 0xd27a5a : L.chimney); ch.position.set(w / 2 - 1.4, hh + 1.3, -0.8); inner.add(ch); }
    }
    windows(inner, w, hh, d, 'front', [2.1], { n: 2, skipDoor: 1.2, shutters: L.shutter || undefined, curtain: L.curtain || '#ffb3c6' });
    windows(inner, w, hh, d, 'left', [2.1], { n: 1, shutters: L.shutter || undefined, curtain: L.curtain || '#ffb3c6' });
    windows(inner, w, hh, d, 'right', [2.1], { n: 1, shutters: L.shutter || undefined, curtain: L.curtain || '#ffb3c6' });
    frontDoor(inner, d, { color: ext === 'container' ? 0x2f4b6e : 0x6a4028, arch: ext === 'chalet' || ext === 'castle', w: 1.3, h: 2.2 });
    // 현관 포치
    const porch = new THREE.Group(); porch.position.set(0, 0.4, d / 2 + 0.9);
    porch.add(tbox(2.6, 0.12, 1.6, 'plank', 0xc99760, 0, 0, -0.1, 0.03, 1));
    if (!L.flat && !L.castle) { for (const x of [-1.1, 1.1]) porch.add(mesh(cyl(0.08, 0.08, 2.5, 10), mat(0xffffff), x, 1.25, 0.5)); const pr = K.gable(2.8, 1.8, 0.7, L.roof, { over: 0.15, gableWindow: false, wallKind: false }); pr.position.y = 2.5; pr.rotation.y = Math.PI / 2; pr.scale.set(1, 1, 1); porch.add(pr); }
    inner.add(porch);
    const mb = new THREE.Group(); mb.position.set(w / 2 + 1, 0, d / 2 + 1.5);
    mb.add(mesh(cyl(0.06, 0.06, 1), tm('plank', 0x8a5a3b), 0, 0.5, 0)); mb.add(mesh(box(0.45, 0.35, 0.3, 0.12), mat(0xff6f61), 0, 1.1, 0)); mb.add(mesh(box(0.03, 0.25, 0.06, 0.01), mat(0xffd23a), 0.25, 1.25, 0));
    inner.add(mb);
    for (const x of [-w / 2 + 0.6, w / 2 - 0.6]) { const pl = K.planter(0xd9a066, [0xff8fb1, 0xffd84a, 0xffffff][(x > 0 ? 1 : 0) + (p.x | 0) % 2]); pl.position.set(x, 0.4, d / 2 + 0.6); inner.add(pl); }
    if (p.bld.player) { const s = PM.sign('🏡 ' + (FM.Sim.get() ? FM.Sim.get().player.name : '플레이어') + '의 집', 4, 0.9, '#ffffff', '#3b2b20'); s.position.set(0, hh + 3.4, d / 2); inner.add(s); }
    g.userData.theme = (PM.VILLA_THEMES[ext] || {}).name;
    return g;
  };

  // =========================================================
  // 입체 장식 단계 — 퇴창 · 발코니 · 벽기둥 · 코니스 · 풍향계 · 덩굴 · 꽃바구니 · 도머
  // =========================================================
  const at = (g, o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
  const lanternPost = () => { const g = new THREE.Group(); g.add(tbox(0.45, 0.25, 0.45, 'stone', 0xd8d0c4, 0, 0, 0, 0.05, 1)); g.add(mesh(cyl(0.1, 0.12, 0.8, 8), tm('stone', 0xd8d0c4), 0, 0.65, 0)); const lamp = mesh(box(0.42, 0.34, 0.42, 0.04), glow(0xffd890), 0, 1.2, 0); lamp.userData.noBake = true; g.add(lamp); g.add(mesh(geo('lanRoof', () => new THREE.ConeGeometry(0.42, 0.3, 4)), tm('stone', 0xc8c0b4), 0, 1.52, 0).rotateY(Math.PI / 4)); return g; };
  const barrel = () => mesh(geo('barrel', () => AC.scaleUV(new THREE.CylinderGeometry(0.34, 0.3, 0.8, 14), 2, 1)), tm('plank', 0xb07a4a));
  const pennant = (c) => { const g = new THREE.Group(); g.add(mesh(cyl(0.04, 0.04, 2, 6), mat(0x8a8a90), 0, 1, 0)); const f = mesh(geo('pen', () => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.9, 0.22); s.lineTo(0, 0.44); s.closePath(); return new THREE.ShapeGeometry(s); }), mat(c), 0.02, 1.5, 0); f.material.side = THREE.DoubleSide; g.add(f); return g; };
  const DECO = {
    cafe: (g, p) => {
      const { w, d } = p.bld;
      at(g, K.bay(2.4, 2.2, 0.8, 'siding', 0xfff4e2, 0xff6a58, { curtain: '#ffe0a0' }), -w / 2, 0.4, 0.3, -Math.PI / 2);
      at(g, K.vane(), -w / 4, 3.6 + 0.4 + 2.8, 0);
      for (const x of [-w / 2 + 0.4, w / 2 - 0.4]) at(g, K.basket(0xff6f86), x, 3.4, d / 2 + 0.3);
      at(g, K.vines(3.2, 1.2, 0xffffff), w / 2 - 0.3, 0.4, d / 2 + 0.02);
    },
    apartment: (g, p) => {
      const { w, d, h } = p.bld; const xs = [-10.5, -3.5, 3.5, 10.5];
      for (let f = 2; f <= 5; f++) for (let n = 0; n < 4; n++) if ((f + n) % 2 === 0) at(g, K.balcony(4.2, 0.85, 0xffffff, { floorKind: 'stone', floorColor: 0xe8e0d4 }), xs[n], (f - 1) * 3.3 + 0.36, d / 2 + 0.18);
      for (const x of [-14, -7, 0, 7, 14]) at(g, K.pilaster(h - 3.4, 0xfffaf2, 'marble'), x, 3.35, d / 2 + 0.1);
      at(g, K.cornice(w, d, 0xfffaf2), 0, h + 0.15, 0);
      for (const x of [-12.5, 12.5]) at(g, K.vines(3, 1.4), x, 0, d / 2 + 0.1);
    },
    school: (g, p) => {
      const { w, d } = p.bld;
      at(g, K.vane(0x5a5a64), 0, 4.2 + 0.4 + 5.9, d / 2 - 1.2);
      for (const x of [-w / 2 + 0.5, w / 2 - 0.5]) at(g, K.vines(3.4, 1.0, 0xffd84a), x, 0.4, d / 2 + 0.03);
      at(g, K.bay(2.6, 2.3, 0.7, 'siding', 0xfff4d6, 0xff8f6a, { curtain: '#ffe8a0' }), w / 2, 0.45, 0, Math.PI / 2);
    },
    library: (g, p) => {
      const { w, d } = p.bld;
      at(g, K.cornice(w, d, 0xfbf8f2), 0, 7.5 + 0.4, 0);
      for (const z of [-2, 2]) at(g, K.vines(5, 1.4, 0xb69cff), -w / 2 - 0.02, 0.4, z, -Math.PI / 2);
    },
    workshop: (g, p) => {
      const { w, d } = p.bld;
      const shed = new THREE.Group(); shed.position.set(w / 2 + 1.2, 0, -0.5);
      shed.add(tbox(2.4, 2.4, d - 2, 'plank', 0xa8784a, 0, 0.4, 0, 0.05, 1));
      const rf = tbox(2.9, 0.18, d - 1.6, 'metal', 0x8a9aa8, 0.1, 2.75, 0, 0.04, 1); rf.rotation.z = -0.25; shed.add(rf);
      for (let i = 0; i < 3; i++) at(shed, barrel(), 1.5, 0.8, -1 + i * 0.75);
      g.add(shed);
      at(g, K.vane(), w / 4, 3.8 + 0.4 + 3.0, 0);
    },
    teahouse: (g, p) => { const { w, d } = p.bld; for (const x of [-w / 2 + 0.2, w / 2 - 0.2]) at(g, lanternPost(), x, 0.3, d / 2 + 1.6); },
    restaurant: (g, p) => {
      const { w, d } = p.bld; const red = p.id === 'pub';
      for (let i = 0; i < 9; i++) { const l = mesh(sphere(0.16, 10, 8), glow(red ? 0xff5a4a : 0xfff0c0), -w / 2 + 0.6 + i * (w - 1.2) / 8, 3.4 + 0.45 - Math.sin(i / 8 * Math.PI) * 0.35, d / 2 + 1.1); l.scale.y = 1.25; l.userData.noBake = true; g.add(l); }
      if (red) at(g, K.balcony(3.6, 0.7, 0xd8453a, { floorColor: 0x8a3a2a }), 0, 2.6, d / 2 + 0.05);
    },
    cityhall: (g, p) => { const { w, d, h } = p.bld; at(g, K.cornice(w, d, 0xfbf8f2), 0, h - 2.1, 0); for (const x of [-w / 2 - 1.5, w / 2 + 1.5]) at(g, K.planter(0xf0ece4, 0xff8fb1), x, 0, d / 2 + 3.2); },
    terminal: (g, p) => { const { w, d } = p.bld; [[-w / 2 - 0.8, 0xff6f61], [-w / 2 - 0.8 + 0.01, 0xffd84a], [w / 2 + 0.8, 0x4fc1e9]].forEach(([x, c], i) => at(g, pennant(c), x, 0, d / 2 - i * 0.8)); },
    cathedral: (g, p) => { const { w, d } = p.bld; for (const x of [-w / 2 + 1.2, w / 2 - 1.2]) at(g, K.vines(6, 1.6, 0xffffff), x, 0.4, d / 2 + 0.04); },
    shop: (g, p) => { const { w, d, h } = p.bld; at(g, tbox(1.4, 0.8, 1, 'metal', 0xdfe6f0, 0, 0, 0, 0.05, 1), -w / 4, h + 0.3, -1); for (let i = 0; i < 5; i++) g.add(mesh(box(0.05, 0.6, 0.9, 0.01), mat(0x9aa3ad), -w / 4 - 0.5 + i * 0.25, h + 0.72, -1)); },
    villa: (g, p, ext) => {
      const inner = g.children[0]; if (!inner || !VILLA_LOOK[ext]) return;
      const L = VILLA_LOOK[ext]; const { w, d } = p.bld; const hh = p.bld.h - 2.2;
      if (ext === 'log') { at(inner, K.dormer(0xc98a52, L.roof, 'log'), -w / 4, hh + 0.5, d / 4); at(inner, K.vane(), w / 4, hh + 0.4 + 2.6, 0); for (let i = 0; i < 6; i++) { const l = mesh(cyl(0.16, 0.16, 1.2, 8), tm('bark', 0x9a6a3e), -w / 2 - 0.5, 0.5 + Math.floor(i / 3) * 0.3, -1 + (i % 3) * 0.34 + Math.floor(i / 3) * 0.17); l.rotation.x = Math.PI / 2; inner.add(l); } }
      if (ext === 'chalet') { at(inner, K.bay(2.2, 2.2, 0.7, 'fishscale', L.color, L.roof, { curtain: '#ffffff' }), w / 2, 0.45, -0.5, Math.PI / 2); for (const x of [-1.1, 1.1]) at(inner, K.basket(0xff8fb1), x, 2.7, d / 2 + 1.35); at(inner, K.dormer(L.color, L.roof), 0, hh + 0.5, d / 4 + 0.2); }
      if (ext === 'med') { at(inner, K.balcony(w, 0.01, 0xffffff, { flowers: true }), 0, hh + 0.8, -d / 2 + 0.3); at(inner, K.vines(3.4, 1.6, 0xff4fb0), -w / 2 + 0.4, 0.4, d / 2 + 0.03); at(inner, K.vines(3.4, 1.6, 0xff4fb0), w / 2 - 0.4, 0.4, d / 2 + 0.03); }
      if (ext === 'glass') { for (const x of [-w / 2 + 1.5, 0, w / 2 - 1.5]) at(inner, K.pilaster(hh, 0xffffff), x, 0.4, d / 2 + 0.1); at(inner, K.cornice(w, d, 0xffffff, false), 0, hh + 0.35, 0); }
      if (ext === 'castle') { [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]].forEach(([x, z], i) => at(inner, pennant([0xff6f86, 0x4fc1e9, 0xffd84a, 0x8ee07a][i]), x, hh + 4.2, z)); at(inner, K.vines(4, 1.6, 0xff6f86), 0, 0.4, d / 2 + 0.04); }
      if (ext === 'container') { const st2 = new THREE.Group(); st2.position.set(w / 2 + 0.6, 0.4, 0); for (let i = 0; i < 7; i++) st2.add(tbox(0.9, 0.12, 0.5, 'metal', 0x2f4b6e, 0, i * 0.52, -d / 2 + 1 + i * 0.5, 0.02, 1)); inner.add(st2); at(inner, K.balcony(w, 0.01, 0x2f4b6e, { flowers: false }), 0, hh + 0.85, -d / 2 + 0.2); const port = mesh(geo('port', () => new THREE.TorusGeometry(0.45, 0.1, 8, 20)), mat(0x2f4b6e), -w / 4, 2.4, d / 2 + 0.08); inner.add(port); }
    },
  };
  for (const [k, fn] of Object.entries(DECO)) {
    const orig = BLD[k]; if (!orig) continue;
    BLD[k] = (p, ext) => { const g = orig(p, ext); try { fn(g, p, ext); } catch (e) { console.error('deco', k, e); } return g; };
  }
})();
