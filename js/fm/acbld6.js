/* =========================================================
 *  새 건물 외관 6 — 지중해 해안 주택 11채 (모두 다른 디자인) · 세븐일레븐풍 24시 편의점
 *   해안가 집은 모두 바다(남쪽)를 바라보고, 앞마당엔 바다 쪽 테라스.
 *   공통 재료: 회벽(화이트 · 크림 · 살구 · 레몬 · 연분홍) + 포인트색(산토리니 블루 · 청록 · 머스터드 · 테라코타 · 올리브 · 라벤더)
 *   조합 요소: 2층 블록 쌓기 · 파란 돔 · 테라코타 기와 · 동굴형 볼트 지붕 · 평지붕 테라스 · 외부 계단 · 철제 발코니 ·
 *             부겐빌레아 · 포도 덩굴 퍼걸러 · 종탑 · 줄무늬 차양 · 아치창 & 덧창 · 제라늄 창가 화분 · 레몬 나무 ·
 *             올리브 나무 · 흰 돌담 & 아치 대문 · 타일 벤치 · 랜턴 · 파라솔 & 선베드 · 빨랫줄
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE;
  const H = ISLE.M.h, { mat, geo, sphere, box, cyl, mesh } = H;
  const AC = FM.AC, K = AC.K, PM = FM.PM, BLD = PM.BLD;
  const { tbox, tm } = AC;
  const B3 = FM.AB3 || {};
  const glow = c => PM.glowMat(c), glass = c => PM.glassMat(c);
  const PI = Math.PI;
  const at = (g, o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
  const M = (g2, m, x = 0, y = 0, z = 0) => mesh(g2, typeof m === 'number' ? mat(m) : m, x, y, z);
  const KK = g => ({ add: o => { g.add(o); return o; } });
  const nightMats = B3.nightMats || [];

  // ---------------------------------------------------------
  // 부품
  // ---------------------------------------------------------
  // 아치창 + 덧창 + 창가 화분
  function archWin(acc, o = {}) {
    const g = new THREE.Group(); const w = o.w || 0.9, h = o.h || 1.3, r = w / 2;
    const gm = PM.glassMat(0x9fc8e8);
    g.add(M(box(w, h - r, 0.05, 0.01), gm, 0, (h - r) / 2, 0.02));
    g.add(M(geo('mwTop' + w, () => new THREE.CircleGeometry(r, 16, 0, PI)), gm, 0, h - r, 0.02));
    g.add(M(geo('mwRing' + w, () => new THREE.TorusGeometry(r + 0.04, 0.05, 6, 16, PI)), 0xffffff, 0, h - r, 0.05));
    g.add(M(box(0.04, h - r, 0.06, 0.005), 0xffffff, 0, (h - r) / 2, 0.05));
    if (o.shutter !== false) for (const s of [-1, 1]) { const sh = M(box(w * 0.5, h - 0.05, 0.05, 0.01), acc, s * (w * 0.75 + 0.02), (h - 0.05) / 2, 0.06); sh.rotation.y = s * 0.25; g.add(sh); for (let i = 0; i < 5; i++) g.add(M(box(w * 0.46, 0.025, 0.02, 0.003), AC.shade(acc, 0.8), s * (w * 0.75 + 0.02), 0.2 + i * (h - 0.4) / 4, 0.09)); }
    g.add(M(box(w + 0.3, 0.07, 0.22, 0.01), 0xf4ece0, 0, -0.04, 0.1));
    if (o.box !== false) {
      const bx = new THREE.Group(); bx.add(tbox(w + 0.1, 0.2, 0.22, 'plank', o.boxColor || 0xc8703a, 0, 0, 0, 0.01, 0.4)); g.add(bx); bx.position.set(0, -0.26, 0.2);
      if (FM.Flora) FM.Flora.bush(KK(bx), ['rose', 'daisy'], o.flowers || [0xe8283a, 0xff5a7a, 0xffffff], 0, 0.02, 0.28, 6, 0.75, w * 13);
    }
    return g;
  }
  function archDoor(acc, wall) {
    const g = new THREE.Group(); const w = 1.15, h = 2.25, r = w / 2;
    g.add(M(box(w, h - r, 0.08, 0.01), acc, 0, (h - r) / 2, 0.03));
    g.add(M(geo('mdTop', () => new THREE.CircleGeometry(r, 16, 0, PI)), acc, 0, h - r, 0.03));
    for (let i = 0; i < 4; i++) g.add(M(box(0.03, h - r - 0.1, 0.02, 0.003), AC.shade(acc, 0.82), -r + 0.2 + i * 0.25, (h - r) / 2, 0.08));
    g.add(M(sphere(0.05, 8, 6), 0xd8b040, r - 0.18, 1.0, 0.1));
    g.add(M(geo('mdRing', () => new THREE.TorusGeometry(r + 0.12, 0.1, 6, 16, PI)), AC.shade(wall, 0.92), 0, h - r, 0.06));
    for (const s of [-1, 1]) g.add(M(box(0.22, h - r, 0.14, 0.02), AC.shade(wall, 0.92), s * (r + 0.12), (h - r) / 2, 0.06));
    for (let i = 0; i < 2; i++) g.add(tbox(1.8 - i * 0.3, 0.14, 0.45, 'stone', 0xe8e0d4, 0, -0.14 - i * 0.14, 0.35 + i * 0.4, 0.02, 0.5));
    // 벽등
    for (const s of [-1, 1]) { const l = new THREE.Group(); l.add(M(box(0.16, 0.24, 0.16, 0.02), glass(0xfff0c8))); const b = M(sphere(0.06, 8, 6), glow(0xffd890)); b.userData.noBake = true; b.userData.lampBulb = true; l.add(b); l.add(M(geo('mdCap', () => new THREE.ConeGeometry(0.14, 0.12, 4)), 0x2a2a2e, 0, 0.17, 0).rotateY(PI / 4)); at(g, l, s * (r + 0.45), 1.95, 0.16); }
    return g;
  }
  function parapet(g, w, d, y, wall, acc, rail) {
    for (const [x, z, ww, dd] of [[0, d / 2, w + 0.1, 0.18], [0, -d / 2, w + 0.1, 0.18], [w / 2, 0, 0.18, d], [-w / 2, 0, 0.18, d]]) {
      if (rail && z > 0) { g.add(M(box(ww, 0.08, 0.08, 0.01), acc, x, y + 0.85, z)); for (let i = 0; i <= Math.round(ww / 0.3); i++) g.add(M(box(0.04, 0.8, 0.04, 0.005), acc, -ww / 2 + i * ww / Math.round(ww / 0.3), y + 0.42, z)); g.add(M(box(ww, 0.14, 0.2, 0.02), wall, x, y + 0.07, z)); }
      else g.add(tbox(ww, 0.55, dd, 'stucco', wall, x, y, z, 0.04, 0.6));
    }
  }
  function dome(r, col) {
    const g = new THREE.Group();
    g.add(M(cyl(r * 0.92, r * 0.92, r * 0.35, 20), 0xffffff, 0, r * 0.17, 0));
    g.add(M(geo('mDome' + r, () => new THREE.SphereGeometry(r, 22, 12, 0, PI * 2, 0, PI / 2)), col, 0, r * 0.35, 0));
    g.add(M(cyl(0.08, 0.08, 0.3, 8), 0xffffff, 0, r * 1.35 + 0.1, 0)); g.add(M(sphere(0.12, 8, 6), col, 0, r * 1.35 + 0.3, 0));
    return g;
  }
  function vault(w, d, col) {   // 동굴집 원통 볼트 지붕
    const g = new THREE.Group(); const m = M(geo('mVault' + w + d, () => new THREE.CylinderGeometry(w / 2, w / 2, d, 20, 1, false, -PI / 2, PI)), tm('stucco', col)); m.rotation.z = PI / 2; m.rotation.y = PI / 2; m.scale.set(1, 1, 0.55); g.add(m);
    return g;
  }
  function bougain(g, x, y, z, n, col, spread = 1) {
    const C = [col, AC.shade(col, 1.15), AC.shade(col, 0.85)];
    for (let i = 0; i < n; i++) { const a = i * 2.39, r = Math.sqrt(i / n) * spread; const s = M(geo('bgS', () => new THREE.SphereGeometry(0.16, 6, 5)), C[i % 3], x + Math.cos(a) * r, y - (i / n) * spread * 1.4 + Math.sin(i) * 0.15, z + Math.abs(Math.sin(a)) * 0.15); s.scale.z = 0.6; g.add(s); }
    for (let i = 0; i < n / 3; i++) { const l = M(geo('bgL', () => new THREE.SphereGeometry(0.18, 6, 5)), tm('leaf', 0x3a7a3a), x + Math.cos(i * 1.9) * spread * 0.8, y - (i / (n / 3)) * spread * 1.3, z - 0.02); l.scale.z = 0.4; g.add(l); }
  }
  function lemonPot(s = 1, fruit = 0xffd83a) {
    const g = new THREE.Group(); g.add(M(cyl(0.3 * s, 0.22 * s, 0.45 * s, 12), tm('stone', 0xc8703a), 0, 0.22 * s, 0)); g.add(M(cyl(0.04 * s, 0.05 * s, 0.7 * s, 6), tm('bark', 0x7a5a3a), 0, 0.75 * s, 0));
    g.add(M(sphere(0.48 * s, 12, 10), tm('leaf', 0x4a8a3a), 0, 1.3 * s, 0)); for (let i = 0; i < 7; i++) g.add(M(geo('lemon', () => new THREE.SphereGeometry(0.07, 7, 5)), fruit, Math.cos(i * 0.9) * 0.4 * s, (1.15 + (i % 3) * 0.15) * s, Math.sin(i * 0.9) * 0.4 * s));
    return g;
  }
  function olive(s = 1) {
    const g = new THREE.Group(); const tr = M(cyl(0.1 * s, 0.18 * s, 1.6 * s, 7), tm('bark', 0x8a7a68), 0, 0.8 * s, 0); tr.rotation.z = 0.15; g.add(tr);
    for (let i = 0; i < 6; i++) { const b = M(sphere((0.55 + (i % 3) * 0.1) * s, 10, 8), tm('leaf', 0x8aa070), Math.cos(i * 1.1) * 0.6 * s + 0.2, (1.8 + (i % 2) * 0.35) * s, Math.sin(i * 1.1) * 0.5 * s); b.scale.y = 0.75; g.add(b); }
    return g;
  }
  function lavender(n = 5) { const g = new THREE.Group(); g.add(tbox(1.2, 0.3, 0.4, 'stone', 0xc8703a, 0, 0, 0, 0.02, 0.4)); for (let i = 0; i < n * 3; i++) { const x = -0.5 + (i % n) * (1 / (n - 1)), z = (Math.floor(i / n) - 1) * 0.1; g.add(M(cyl(0.006, 0.006, 0.3, 3), 0x6a9a5a, x, 0.45, z)); g.add(M(geo('lavH', () => new THREE.CylinderGeometry(0.025, 0.035, 0.14, 5)), 0x9a7ad8, x, 0.62, z)); } return g; }
  function umbrella(col) {
    const g = new THREE.Group(); g.add(M(cyl(0.03, 0.03, 2.2, 6), 0xffffff, 0, 1.1, 0));
    const um = new THREE.Mesh(geo('umb', () => new THREE.ConeGeometry(1.2, 0.5, 8, 1, true)), new THREE.MeshLambertMaterial({ map: AC.stripe(col, '#ffffff'), side: THREE.DoubleSide })); um.position.y = 2.2; um.castShadow = true; g.add(um);
    for (const s of [-1, 1]) { const lc = new THREE.Group(); lc.add(tbox(0.6, 0.06, 1.6, 'plank', 0xf4ead8, 0, 0.32, 0, 0.01, 0.3)); const bk = M(box(0.6, 0.05, 0.6, 0.01), 0xf4ead8, 0, 0.55, -0.6); bk.rotation.x = 0.7; lc.add(bk); for (const z of [-0.6, 0.6]) lc.add(M(box(0.6, 0.3, 0.04, 0.005), 0xd8d0c4, 0, 0.15, z)); lc.add(M(box(0.55, 0.04, 1.2, 0.01), col, 0, 0.37, 0.15)); at(g, lc, s * 0.85, 0, 0.4); }
    return g;
  }
  function pergola(w, d, wood, vine) {
    const g = new THREE.Group(); const hh = 2.4;
    for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) g.add(tbox(0.16, hh, 0.16, 'plank', wood, x, 0, z, 0.01, 0.3));
    for (let i = 0; i <= Math.round(w / 0.5); i++) g.add(M(box(0.07, 0.1, d + 0.4, 0.01), wood, -w / 2 + i * w / Math.round(w / 0.5), hh + 0.05, 0));
    for (const z of [-d / 2, d / 2]) g.add(M(box(w + 0.4, 0.14, 0.12, 0.01), wood, 0, hh - 0.05, z));
    if (vine) for (let i = 0; i < Math.round(w * d * 1.4); i++) { const v = M(geo('pgV', () => new THREE.SphereGeometry(0.22, 6, 5)), tm('leaf', vine), -w / 2 + ((i * 0.618) % 1) * w, hh + 0.15, -d / 2 + ((i * 0.381) % 1) * d); v.scale.y = 0.45; g.add(v); }
    const lm = new THREE.MeshLambertMaterial({ color: 0xfff4d0, emissive: 0xffc860, emissiveIntensity: 0.25 }); nightMats.length >= 0 && 0;
    for (let i = 0; i < 9; i++) { const b = M(geo('pgB', () => new THREE.SphereGeometry(0.05, 6, 5)), lm, -w / 2 + i * w / 8, hh - 0.15 - Math.sin(i / 8 * PI) * 0.25, d / 2); g.add(b); }
    return g;
  }
  function stair(len, hgt, wall, acc) {   // 벽 따라 올라가는 외부 계단 (x 방향)
    const g = new THREE.Group(); const n = Math.max(6, Math.round(hgt / 0.22));
    for (let i = 0; i < n; i++) g.add(tbox(len / n + 0.02, (i + 1) * hgt / n, 0.9, 'stucco', wall, -len / 2 + (i + 0.5) * len / n, 0, 0, 0.02, 0.4));
    for (let i = 0; i <= 6; i++) { const t = i / 6; g.add(M(box(0.04, 0.8, 0.04, 0.005), acc, -len / 2 + t * len, t * hgt + 0.4, 0.42)); }
    const rl = M(box(Math.hypot(len, hgt), 0.05, 0.05, 0.01), acc, 0, hgt / 2 + 0.8, 0.42); rl.rotation.z = Math.atan2(hgt, len); g.add(rl);
    return g;
  }
  function gateWall(w, wall, acc, gateAt = 0) {
    const g = new THREE.Group(); const gw = 1.6;
    const segs = [[-w / 2, gateAt - gw / 2], [gateAt + gw / 2, w / 2]];
    for (const [a, b] of segs) { if (b - a < 0.2) continue; g.add(tbox(b - a, 0.9, 0.3, 'stucco', wall, (a + b) / 2, 0, 0, 0.03, 0.5)); g.add(M(box(b - a + 0.06, 0.08, 0.36, 0.01), AC.shade(wall, 0.93), (a + b) / 2, 0.94, 0)); }
    for (const s of [-1, 1]) g.add(tbox(0.35, 1.9, 0.35, 'stucco', wall, gateAt + s * (gw / 2 + 0.17), 0, 0, 0.03, 0.5));
    const ar = M(geo('gArc', () => new THREE.TorusGeometry(gw / 2 + 0.17, 0.17, 6, 14, PI)), tm('stucco', wall), gateAt, 1.9, 0); g.add(ar);
    for (let i = 0; i < 6; i++) g.add(M(box(0.05, 1.1, 0.04, 0.005), acc, gateAt - gw / 2 + 0.15 + i * (gw - 0.3) / 5, 0.6, 0.02));
    g.add(M(box(gw - 0.1, 0.06, 0.05, 0.01), acc, gateAt, 1.12, 0.02)); g.add(M(box(gw - 0.1, 0.06, 0.05, 0.01), acc, gateAt, 0.12, 0.02));
    return g;
  }
  function tileBench(acc) { const g = new THREE.Group(); g.add(tbox(1.6, 0.45, 0.5, 'stucco', 0xffffff, 0, 0, 0, 0.03, 0.5)); g.add(M(box(1.62, 0.06, 0.52, 0.01), new THREE.MeshLambertMaterial({ map: AC.stripe('#' + acc.toString(16).padStart(6, '0'), '#ffffff') }), 0, 0.48, 0)); for (let i = 0; i < 2; i++) { const c = M(box(0.4, 0.1, 0.35, 0.05), [0xffd84a, 0xffffff][i], -0.4 + i * 0.8, 0.56, 0); g.add(c); } return g; }
  function washLine(len) { const g = new THREE.Group(); for (const x of [-len / 2, len / 2]) g.add(M(cyl(0.03, 0.03, 1.8, 6), 0xffffff, x, 0.9, 0)); g.add(M(box(len, 0.01, 0.01, 0), 0x8a8a8a, 0, 1.75, 0)); const C = [0xffffff, 0x7ab8e8, 0xff8aa8, 0xffd84a, 0xffffff]; for (let i = 0; i < 5; i++) { const c = M(box(0.42, 0.55, 0.01, 0.01), C[i], -len / 2 + 0.5 + i * (len - 1) / 4, 1.45, 0); c.rotation.y = 0.1 * (i % 2 ? 1 : -1); g.add(c); } return g; }
  function bellTower(wall, acc) { const g = new THREE.Group(); g.add(tbox(0.9, 2.0, 0.9, 'stucco', wall, 0, 0, 0, 0.03, 0.4)); const ar = M(box(0.5, 0.6, 0.95, 0.02), 0x3a3a44, 0, 1.4, 0); void ar; g.add(M(geo('btArc', () => new THREE.CircleGeometry(0.25, 12, 0, PI)), 0x3a3a44, 0, 1.7, 0.47)); g.add(M(sphere(0.14, 8, 6), 0xd8a838, 0, 1.45, 0)); g.add(M(box(1.0, 0.12, 1.0, 0.02), wall, 0, 2.06, 0)); const rf = g.add(M(geo('btRf', () => new THREE.ConeGeometry(0.62, 0.6, 4)), acc, 0, 2.42, 0)); void rf; g.children[g.children.length - 1].rotation.y = PI / 4; return g; }

  // ---------------------------------------------------------
  // 지중해 집 한 채 — 옵션 조합으로 11채 모두 다르게
  // ---------------------------------------------------------
  function medHouse(g, w, d, h, o) {
    const W = o.wall, A = o.acc, H1 = o.h1 || 3.2;
    g.add(K.base(w, d, 0.5, o.base || 0xe0d6c4, 'stone'));
    // 1층
    g.add(tbox(w, H1, d, 'stucco', W, 0, 0.45, 0, 0.06, 1.0));
    g.add(M(box(w + 0.08, 0.22, d + 0.08, 0.04), AC.shade(W, 0.94), 0, 0.56, 0));   // 굽도리
    if (o.band) g.add(M(box(w + 0.06, 0.12, d + 0.06, 0.01), A, 0, 0.45 + H1 - 0.15, 0));
    const top = 0.45 + H1;
    // 2층 블록
    let up = null;
    if (o.stack) {
      const uw = w * (o.stackW || 0.58), ud = d * 0.62, ux = o.stack * (w - uw) / 2, uz = -d * 0.18;
      up = { w: uw, d: ud, x: ux, z: uz, y: top, h: o.h2 || 2.8 };
      g.add(tbox(uw, up.h, ud, 'stucco', o.wall2 || W, ux, top, uz, 0.06, 1.0));
      for (const i of [-1, 1]) if (uw > 3.4) at(g, archWin(A, { w: 0.8, h: 1.2, flowers: o.flowers, box: !!o.boxes }), ux + i * uw / 4, top + 0.9, uz + ud / 2 + 0.02);
      else at(g, archWin(A, { w: 0.8, h: 1.2, flowers: o.flowers, box: !!o.boxes }), ux, top + 0.9, uz + ud / 2 + 0.02);
    }
    // 1층 앞면: 아치창 + 아치문
    const xs = w > 9 ? [2.1, 4.1] : [w / 2 - 1.7];
    for (const xx of xs) for (const s of [-1, 1]) at(g, archWin(A, { w: 0.95, h: 1.45, flowers: o.flowers, box: o.boxes !== false }), s * xx, 1.35, d / 2 + 0.02);
    at(g, archDoor(o.door || A, W), 0, 0.45, d / 2 + 0.02);
    // 옆면 창
    for (const s of [-1, 1]) { const wn = archWin(A, { w: 0.8, h: 1.2, box: false, shutter: !!o.sideShutter }); wn.rotation.y = s * PI / 2; wn.position.set(s * (w / 2 + 0.02), 1.4, -d / 6); g.add(wn); }
    // 지붕
    const roofOn = up ? up : { w, d, x: 0, z: 0, y: top, h: 0 };
    const ry = roofOn.y + roofOn.h;
    if (o.roof === 'dome') { parapet(g, w, d, top, W, A, o.rail); if (up) { g.add(M(box(up.w + 0.2, 0.2, up.d + 0.2, 0.03), W, up.x, ry + 0.1, up.z)); at(g, dome(Math.min(up.w, up.d) * 0.36, o.domeCol || A), up.x, ry + 0.2, up.z); } else at(g, dome(Math.min(w, d) * 0.3, o.domeCol || A), -w / 4, top + 0.1, -d / 6); }
    else if (o.roof === 'tile') { if (up) { parapet(g, w, d, top, W, A, o.rail); const r = K.hip(up.w + 0.6, up.d + 0.6, 1.5, 0xc8603a, 'rooftile'); r.position.set(up.x, ry, up.z); g.add(r); } else { const r = K.hip(w + 0.7, d + 0.7, 1.9, 0xc8603a, 'rooftile'); r.position.y = top; g.add(r); } }
    else if (o.roof === 'vault') { if (up) { parapet(g, w, d, top, W, A, o.rail); const v = vault(up.d, up.w, o.vaultCol || W); v.position.set(up.x, ry, up.z); g.add(v); } else { const v = vault(d, w, o.vaultCol || W); v.position.set(0, top, 0); g.add(v); } }
    else { parapet(g, w, d, top, W, A, o.rail); if (up) parapet(g, up.w, up.d, ry, W, A, false); }
    // 옥상 테라스 소품 (평지붕 부분)
    if (o.roofUmbrella && (up || o.roof === 'flat')) { const rx = up ? -o.stack * w * 0.25 : w * 0.15; at(g, umbrella(o.umbCol || '#3a7bd5'), rx, top + 0.05, d * 0.12); }
    if (o.pergolaTop) { const pw = up ? w - up.w - 0.6 : w * 0.5; const px = up ? -o.stack * (w / 2 - pw / 2 - 0.3) : 0; at(g, pergola(pw, d * 0.6, 0x9a6a44, o.vine || 0x5a9a3a), px, top + 0.05, d * 0.05); }
    if (o.chimney) { g.add(tbox(0.6, 1.2, 0.6, 'stucco', W, w / 2 - 0.8, ry, -d / 2 + 0.8, 0.03, 0.4)); g.add(M(box(0.8, 0.12, 0.8, 0.02), A, w / 2 - 0.8, ry + 1.25, -d / 2 + 0.8)); }
    if (o.bell) at(g, bellTower(W, A), (up ? -o.stack : 1) * (w / 2 - 0.7), top, -d / 2 + 0.7);
    // 외부 계단 (옆벽)
    if (o.stair) { const st = stair(d * 0.75, H1, W, A); st.rotation.y = o.stair * PI / 2; st.position.set(o.stair * (w / 2 + 0.47), 0.45, 0); g.add(st); }
    // 발코니 (2층 앞)
    if (o.balcony && up) { const bl = new THREE.Group(); bl.add(M(box(up.w * 0.7, 0.12, 0.8, 0.02), W, 0, 0, 0.4)); bl.add(M(box(up.w * 0.7, 0.06, 0.06, 0.01), A, 0, 0.9, 0.78)); for (let i = 0; i <= 10; i++) bl.add(M(box(0.03, 0.85, 0.03, 0.005), A, -up.w * 0.35 + i * up.w * 0.07, 0.45, 0.78)); for (const s of [-1, 1]) bl.add(M(geo('blBr', () => new THREE.ConeGeometry(0.12, 0.5, 4)), W, s * up.w * 0.3, -0.25, 0.4).rotateX(PI)); at(g, bl, up.x, top + 0.35, up.z + up.d / 2); }
    // 차양
    if (o.awning) { const aw = K.awning(o.awningW || 2.6, 1.2, typeof o.awning === 'number' ? o.awning : A, 0xffffff); aw.position.set(o.awningX || 0, 2.75, d / 2 + 0.05); g.add(aw); }
    // 부겐빌레아
    if (o.bougain) for (const [bx, by] of o.bougainAt || [[w / 2 - 0.4, top + 0.2]]) bougain(g, bx, by, d / 2 + 0.15, 34, o.bougain, 1.0);
    // 앞마당 (바다 쪽): 테라코타 타일 · 돌담 & 아치 대문 · 화분 · 나무 · 벤치 · 파라솔
    const yd = 3.4;
    const tile = new THREE.Mesh(new THREE.PlaneGeometry(w + 1.4, yd), new THREE.MeshLambertMaterial({ map: (() => { const t = PM.ctex('medTile' + (o.tile || 0), 64, 64, (c, ww, hh) => { const cols = [['#d88a5a', '#c87a4a'], ['#e8e0d0', '#d0c8b8'], ['#7ab8e8', '#ffffff']][o.tile || 0]; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.fillStyle = cols[(x + y) % 2]; c.fillRect(x * 16, y * 16, 16, 16); } c.strokeStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * 16, 0); c.lineTo(i * 16, 64); c.stroke(); c.beginPath(); c.moveTo(0, i * 16); c.lineTo(64, i * 16); c.stroke(); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set((w + 1.4) / 1.2, yd / 1.2); return t; })(), polygonOffset: true, polygonOffsetFactor: -2 }));
    tile.rotation.x = -PI / 2; tile.position.set(0, 0.47, d / 2 + yd / 2 + 0.2); tile.receiveShadow = true; g.add(tile);
    g.add(tbox(w + 1.4, 1.6, yd, 'stone', o.base || 0xe0d6c4, 0, -1.14, d / 2 + yd / 2 + 0.2, 0.04, 0.8));   // 테라스 축대
    if (o.gateWall) at(g, gateWall(w + 1.4, W, A, o.gateAt || 0), 0, 0.46, d / 2 + yd + 0.1);
    for (const [k, x, z] of o.yard || []) {
      const zz = d / 2 + 0.4 + z * yd;
      if (k === 'lemon') at(g, lemonPot(1, o.fruit), x, 0.45, zz);
      else if (k === 'olive') at(g, olive(1), x, 0.47, zz);
      else if (k === 'lav') at(g, lavender(), x, 0.6, zz);
      else if (k === 'bench') at(g, tileBench(A), x, 0.47, zz);
      else if (k === 'umb') at(g, umbrella(o.umbCol || '#3a7bd5'), x, 0.47, zz);
      else if (k === 'wash') at(g, washLine(2.6), x, 0.47, zz);
      else if (k === 'pergola') at(g, pergola(2.8, 2.2, 0x9a6a44, o.vine || 0x5a9a3a), x, 0.47, zz);
      else if (k === 'pots') for (let i = 0; i < 3; i++) { const pt = new THREE.Group(); pt.add(M(cyl(0.18 - i * 0.03, 0.14 - i * 0.02, 0.3, 10), [A, 0xc8703a, 0xffffff][i])); if (FM.Flora) FM.Flora.bush(KK(pt), ['rose', 'daisy'], [0xff4a6a, 0xffffff, 0xff8a3a], 0, 0.1, 0.22, 5, 0.7, i + x); at(g, pt, x + i * 0.45, 0.62, zz); }
      else if (k === 'cypress') { const cy = new THREE.Group(); cy.add(M(cyl(0.06, 0.08, 0.6, 6), tm('bark', 0x6a4a34), 0, 0.3, 0)); const c = M(geo('cyp', () => new THREE.SphereGeometry(0.45, 10, 10)), tm('leaf', 0x2a5a3a), 0, 1.9, 0); c.scale.set(1, 3.2, 1); cy.add(c); at(g, cy, x, 0.47, zz); }
    }
    return g;
  }

  const WALL = { white: 0xfbfbf6, cream: 0xf6ecd8, peach: 0xf8d8c0, lemon: 0xf8ecb0, rose: 0xf8d8dc, sand: 0xece0c8 };
  const ACC = { blue: 0x2a62c8, teal: 0x2a9a98, mustard: 0xd8a830, terra: 0xc8603a, olive: 0x7a8a3a, lav: 0x8a7ac8, navy: 0x2a3a6a, green: 0x3a8a5a };
  // 11채 — 모두 다른 조합
  const VARIANTS = {
    med_oia: { name: '오이아 블루돔 하우스', o: { wall: WALL.white, acc: ACC.blue, stack: 1, roof: 'dome', rail: true, balcony: true, bougain: 0xe8287a, bougainAt: [[-4.0, 3.6]], gateWall: true, yard: [['lemon', -3.2, 0.5], ['bench', 2.8, 0.5], ['pots', -1.6, 0.85]], boxes: true } },
    med_capri: { name: '카프리 레몬 빌라', o: { wall: WALL.lemon, acc: ACC.teal, roof: 'tile', awning: 0x2a9a98, yard: [['lemon', -3, 0.35], ['lemon', 3, 0.35], ['umb', 0, 0.75]], fruit: 0xffd83a, band: true, tile: 0 } },
    med_cave: { name: '산토리니 동굴집', o: { wall: WALL.white, acc: ACC.navy, roof: 'vault', stair: -1, bougain: 0xff4a9a, bougainAt: [[2.6, 3.3]], yard: [['umb', 2, 0.55], ['pots', -3, 0.8]], tile: 1 } },
    med_bell: { name: '종탑 지중해 하우스', o: { wall: WALL.cream, acc: ACC.terra, stack: -1, roof: 'tile', bell: true, gateWall: true, gateAt: 1.2, yard: [['olive', -3, 0.4], ['lav', 2.4, 0.3], ['bench', 2.6, 0.8]], sideShutter: true, band: true } },
    med_pergola: { name: '포도덩굴 퍼걸러 테라스 하우스', o: { wall: WALL.sand, acc: ACC.olive, stack: 1, roof: 'flat', pergolaTop: true, vine: 0x4a8a3a, yard: [['pergola', -1.6, 0.5], ['cypress', 3.4, 0.3], ['pots', 1.4, 0.85]], tile: 0 } },
    med_rose: { name: '로즈 핑크 테라스 하우스', o: { wall: WALL.rose, acc: ACC.lav, stack: -1, roof: 'flat', roofUmbrella: true, umbCol: '#c86aa8', balcony: true, bougain: 0xd8288a, bougainAt: [[3.6, 3.6], [-3.6, 3.4]], flowers: [0xff8aa8, 0xffffff, 0xd88aff], yard: [['lav', -2.6, 0.4], ['lav', 2.6, 0.4]], boxes: true, tile: 1 } },
    med_mykonos: { name: '미코노스 화이트 큐브', o: { wall: WALL.white, acc: ACC.green, stack: 1, stackW: 0.48, roof: 'flat', rail: true, stair: 1, door: 0xc8303a, yard: [['wash', -2.2, 0.6], ['pots', 1.6, 0.5]], tile: 1 } },
    med_amalfi: { name: '아말피 살구빛 빌라', o: { wall: WALL.peach, acc: ACC.mustard, stack: -1, roof: 'tile', awning: 0xd8a830, awningW: 3.2, balcony: true, chimney: true, yard: [['lemon', 3.3, 0.5], ['umb', -2.4, 0.6]], fruit: 0xffa830, band: true, tile: 0 } },
    med_azure: { name: '아주르 블루 볼트 하우스', o: { wall: WALL.white, acc: ACC.blue, stack: 1, stackW: 0.5, roof: 'vault', vaultCol: 0x5a9ae8, rail: true, gateWall: true, gateAt: -1.6, yard: [['olive', 3.2, 0.4], ['bench', -2.6, 0.45]], tile: 2 } },
    med_lavfield: { name: '라벤더 정원 코티지', o: { wall: WALL.cream, acc: ACC.lav, roof: 'dome', domeCol: 0x8a7ac8, awning: 0x8a7ac8, yard: [['lav', -2.8, 0.3], ['lav', -2.8, 0.7], ['lav', 2.8, 0.3], ['lav', 2.8, 0.7]], flowers: [0x9a7ad8, 0xffffff, 0xd8b8ff], boxes: true, tile: 1 } },
    med_sunset: { name: '선셋 테라코타 하우스', o: { wall: WALL.sand, acc: ACC.terra, stack: 1, roof: 'dome', domeCol: 0xc8603a, roofUmbrella: true, umbCol: '#e8783a', stair: -1, bougain: 0xff6a2a, bougainAt: [[3.4, 3.5]], yard: [['cypress', -3.4, 0.35], ['umb', 1.6, 0.6]], tile: 0 } },
  };
  for (const [k, v] of Object.entries(VARIANTS)) PM.VILLA_THEMES[k] = { name: v.name, wall: v.o.wall, roof: v.o.acc, med: true };
  const prevVilla = BLD.villa;
  BLD.villa = (p, ext) => {
    if (!VARIANTS[ext]) return prevVilla(p, ext);
    const g = new THREE.Group(); const { w, d, h } = p.bld;
    const facing = p.plot ? p.plot.doorSide : 1;
    const inner = new THREE.Group(); if (facing < 0) inner.rotation.y = PI; g.add(inner);
    medHouse(inner, w, d, h, VARIANTS[ext].o);
    const mb = new THREE.Group(); mb.position.set(w / 2 + 0.6, 0, d / 2 + 0.9);
    mb.add(M(cyl(0.05, 0.05, 1, 6), 0xffffff, 0, 0.5, 0)); mb.add(M(box(0.42, 0.32, 0.28, 0.08), VARIANTS[ext].o.acc, 0, 1.1, 0)); inner.add(mb);
    g.userData.theme = VARIANTS[ext].name;
    return g;
  };
  FM.MED_VARIANTS = Object.keys(VARIANTS);

  // =========================================================
  // 🏪 24시 편의점 — 세븐일레븐풍 (흰 몸체 · 주황/초록/빨강 띠 · 통유리 · 초록 차양)
  // =========================================================
  const storeWin = () => (B3.shopMat || ((k, d) => new THREE.MeshLambertMaterial({ map: PM.ctex('s6' + k, 256, 128, d) })))('seven6', (c, w, h) => {
    c.fillStyle = '#f8f8f4'; c.fillRect(0, 0, w, h); c.fillStyle = '#fffbe8'; for (let x = 6; x < w; x += 40) c.fillRect(x, 4, 28, 4);
    const cols = ['#e8484a', '#ffb02a', '#5ab04a', '#3a8ae8', '#ff7aa8', '#ffd84a', '#8a5ad8', '#ffffff'];
    for (let s = 0; s < 5; s++) { const x0 = 10 + s * 50; c.fillStyle = '#d0d4da'; c.fillRect(x0, 22, 38, h - 34); for (let r = 0; r < 5; r++) for (let i = 0; i < 6; i++) { c.fillStyle = cols[(s * 3 + r + i) % cols.length]; c.fillRect(x0 + 2 + i * 6, 26 + r * 18, 5, 13); } }
    c.fillStyle = '#e8e8ee'; c.fillRect(0, h - 12, w, 12);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(60, 0); c.lineTo(0, 60); c.fill();
  }, [1, 1, 0.92]);
  BLD.shop = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld, HH = 3.8;
    const OR = 0xf08a1a, GR = 0x0a8a4a, RD = 0xe0242a;
    g.add(K.base(w, d, 0.35, 0xb8b8b4, 'stone'));
    g.add(tbox(w, HH, d, 'panel', 0xf8f8f4, 0, 0.32, 0, 0.03, 1.4));
    // 통유리 전면 (진열대가 비침 · 밤에 불)
    g.add(M(box(w - 1.0, 2.35, 0.05, 0.01), storeWin(), -0.4, 1.55, d / 2 + 0.03));
    for (let i = 0; i <= 5; i++) g.add(M(box(0.07, 2.4, 0.08, 0.01), 0x9aa0a8, -0.4 - (w - 1.0) / 2 + i * (w - 1.0) / 5, 1.55, d / 2 + 0.07));
    // 자동문 (오른쪽)
    g.add(M(box(1.5, 2.3, 0.05, 0.01), glass(0xe8f4ff), w / 2 - 1.1, 1.5, d / 2 + 0.09));
    g.add(M(box(0.04, 2.3, 0.06, 0.01), 0x9aa0a8, w / 2 - 1.1, 1.5, d / 2 + 0.11));
    // 3색 띠 간판 (주황 · 초록 · 빨강) + 흰 상단
    const bandY = 0.32 + HH - 0.75;
    g.add(M(box(w + 0.2, 0.24, 0.18, 0.01), OR, 0, bandY + 0.36, d / 2 + 0.06));
    g.add(M(box(w + 0.2, 0.24, 0.18, 0.01), GR, 0, bandY + 0.12, d / 2 + 0.06));
    g.add(M(box(w + 0.2, 0.24, 0.18, 0.01), RD, 0, bandY - 0.12, d / 2 + 0.06));
    for (const s of [-1, 1]) { g.add(M(box(0.18, 0.24, d + 0.2, 0.01), OR, s * (w / 2 + 0.06), bandY + 0.36, 0)); g.add(M(box(0.18, 0.24, d + 0.2, 0.01), GR, s * (w / 2 + 0.06), bandY + 0.12, 0)); g.add(M(box(0.18, 0.24, d + 0.2, 0.01), RD, s * (w / 2 + 0.06), bandY - 0.12, 0)); }
    // 간판 박스 (흰 바탕에 큰 숫자 7 · 24시)
    const sb = new THREE.Group(); sb.add(M(box(1.5, 1.5, 0.3, 0.06), 0xffffff, 0, 0, 0));
    const s7 = PM.ctex('seven7', 128, 128, (c) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, 128, 128); c.font = 'bold 110px Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 10; c.strokeStyle = '#f08a1a'; c.strokeText('7', 64, 66); c.fillStyle = '#0a8a4a'; c.fillText('7', 64, 66); c.fillStyle = '#e0242a'; c.fillRect(20, 104, 88, 10); });
    const f7 = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 1.36), new THREE.MeshBasicMaterial({ map: s7 })); f7.position.z = 0.16; f7.userData.noBake = true; sb.add(f7);
    at(g, sb, -w / 2 + 1.0, bandY + 0.12, d / 2 + 0.3);
    const nm = PM.sign('24시 편의점  ·  OPEN 24 HOURS', w - 2.6, 0.42, '#ffffff', '#0a8a4a'); nm.position.set(0.8, 0.32 + HH - 0.22, d / 2 + 0.2); g.add(nm);
    // 지붕 테두리 · 옥상 실외기
    g.add(M(box(w + 0.2, 0.3, d + 0.2, 0.03), 0xe8e8e4, 0, 0.32 + HH + 0.15, 0));
    for (let i = 0; i < 2; i++) { const u = new THREE.Group(); u.add(M(box(1.0, 0.7, 0.7, 0.04), 0xd8dce0, 0, 0.35, 0)); u.add(M(cyl(0.25, 0.25, 0.03, 14), 0x5a5e64, 0, 0.72, 0)); at(g, u, -1.5 + i * 1.6, 0.32 + HH + 0.3, -d / 4); }
    // 앞: 초록 줄무늬 차양 · 쓰레기통 3색 · 우산꽂이 · ATM · 아이스크림 냉동고 · 신문 꽂이 · 자전거 · 주차 블록 · 포스터
    const aw = K.awning(w - 1.2, 1.0, GR, 0xffffff); aw.position.set(-0.4, 2.85, d / 2 + 0.06); g.add(aw);
    for (let i = 0; i < 3; i++) { const bn = new THREE.Group(); bn.add(M(box(0.42, 0.85, 0.42, 0.04), [0x5a5e64, 0x2a7ad8, 0x3a9a4a][i], 0, 0.43, 0)); bn.add(M(box(0.3, 0.04, 0.05, 0.01), 0x1a1a1a, 0, 0.8, 0.22)); at(g, bn, -w / 2 + 0.4 + i * 0.5, 0.32, d / 2 + 0.5); }
    const fz = new THREE.Group(); fz.add(M(box(1.2, 0.75, 0.65, 0.05), 0xffffff, 0, 0.38, 0)); fz.add(M(box(1.1, 0.04, 0.55, 0.01), glass(0xbfe8ff), 0, 0.77, 0)); const ft = PM.sign('🍦 ICE', 0.9, 0.28, '#3a8ae8', '#ffffff'); ft.position.set(0, 0.45, 0.34); fz.add(ft); at(g, fz, 0.2, 0.32, d / 2 + 0.55);
    const atm = new THREE.Group(); atm.add(M(box(0.6, 1.5, 0.5, 0.05), 0x2a3a5a, 0, 0.75, 0)); atm.add(M(box(0.4, 0.3, 0.02, 0.01), glow(0x8ad0ff), 0, 1.15, 0.26)); const at2 = PM.sign('ATM', 0.5, 0.18, '#2a3a5a', '#ffffff'); at2.position.set(0, 1.4, 0.26); atm.add(at2); at(g, atm, w / 2 + 0.45, 0.32, d / 2 - 0.6, -PI / 2);
    for (const x of [-2.6, 0, 2.6]) g.add(M(box(1.6, 0.12, 0.25, 0.02), 0xf4f0e0, x, 0.06, d / 2 + 3.6));
    for (const x of [-2.6, 0, 2.6]) g.add(M(box(0.06, 0.01, 2.6, 0), 0xffffff, x + 1.3, 0.04, d / 2 + 2.4));
    if (B3.bike) { at(g, B3.bike(0x3a9a5a), 2.4, 0.06, d / 2 + 1.5, 0.15); at(g, B3.bike(0xffd84a), 3.2, 0.06, d / 2 + 1.6, -0.05); }
    for (let i = 0; i < 2; i++) { const pst = PM.sign(['🍙 삼각김밥 2+1', '☕ 아이스 아메리카노 1,500'][i], 1.2, 0.5, ['#f08a1a', '#0a8a4a'][i], '#ffffff'); pst.position.set(-w / 2 + 1.6 + i * 1.6, 0.9, d / 2 + 0.07); g.add(pst); }
    return g;
  };
})();
