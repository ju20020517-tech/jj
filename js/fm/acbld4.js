/* =========================================================
 *  새 건물 외관 4 — 노천 온천 · 사진관
 *   ♨️ 달맞이 노천 온천 : 목조 료칸 (세로 판벽 · 장지 & 둥근 눈창 · 미닫이 판문 · 툇마루 평상 · 2층 난간 회랑 · 분재 · 목욕탕 굴뚝)
 *                        + 바위로 두른 노천탕 (뿌연 우윳빛 물 · 대나무 담장 · 대나무 물받이 · 석등 · 소나무 · 김이 피어오름)
 *   📸 추억 사진관      : 네이비 & 화이트 2층 (물결 캔버스 차양 · 원목 기둥 · 견본 사진 쇼윈도 · 벽돌 화분의 파란 루피너스 · 칠판 · 술통 · 램프)
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE;
  const H = ISLE.M.h, { mat, geo, sphere, box, cyl, mesh } = H;
  const AC = FM.AC, K = AC.K, PM = FM.PM, BLD = PM.BLD;
  const { tbox, tm } = AC;
  const B3 = FM.AB3;
  const glow = c => PM.glowMat(c), glass = c => PM.glassMat(c);
  const PI = Math.PI;
  const at = (g, o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
  const M = (g2, m, x = 0, y = 0, z = 0) => mesh(g2, typeof m === 'number' ? mat(m) : m, x, y, z);

  // 김 (위로 피어오르는 하얀 입자) — bake 에서 빼도록 keep
  function steam(n, x0, x1, z0, z1, y0, hgt, size = 0.9) {
    const pos = new Float32Array(n * 3), base = [];
    for (let i = 0; i < n; i++) base.push([x0 + ((i * 0.618) % 1) * (x1 - x0), z0 + ((i * 0.414) % 1) * (z1 - z0), i * 1.37]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const tex = PM.ctex('steamPuff', 64, 64, (c, w, h) => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.75)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
    const m = new THREE.PointsMaterial({ map: tex, size, transparent: true, opacity: 0.55, depthWrite: false });
    const p = new THREE.Points(g, m); p.userData.keep = true; p.frustumCulled = false;
    p.onBeforeRender = () => { const t = performance.now() / 1000, a = g.attributes.position; for (let i = 0; i < n; i++) { const b = base[i], k = (t * 0.25 + b[2]) % 1; a.array[i * 3] = b[0] + Math.sin(t * 0.6 + b[2]) * 0.3 * k; a.array[i * 3 + 1] = y0 + k * hgt; a.array[i * 3 + 2] = b[1] + Math.cos(t * 0.5 + b[2]) * 0.3 * k; } a.needsUpdate = true; };
    return p;
  }

  // =========================================================
  // ♨️ 노천 온천
  // =========================================================
  BLD.onsen = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld;
    const WOOD = 0xa0785a, DARK = 0x4a3222, ROOF = 0x4a3a30, PL = 0xece0c8;
    g.add(K.base(w, d, 0.5, 0x9a948a, 'stone'));
    // 1층 몸체: 세로 판벽 + 앞면 장지 칸
    g.add(tbox(w, 3.2, d, 'yakisugi', WOOD, 0, 0.45, 0, 0.03, 1.1));
    for (let i = 0; i < 6; i++) { const x = -w / 2 + 0.2 + i * (w - 0.4) / 5; g.add(M(box(0.22, 3.3, 0.22, 0.02), DARK, x, 2.1, d / 2 + 0.05)); }
    const bay = (x, wd) => { g.add(M(box(wd, 1.9, 0.04, 0.01), B3.shojiMat(), x, 1.9, d / 2 + 0.08)); for (let k = 0; k < 2; k++) { const cx = x - wd / 4 + k * wd / 2; const rw = M(geo('yukiR', () => new THREE.TorusGeometry(0.2, 0.05, 6, 16)), DARK, cx, 2.35, d / 2 + 0.12); g.add(rw); g.add(M(geo('yukiC', () => new THREE.CircleGeometry(0.19, 16)), 0x3a2a1a, cx, 2.35, d / 2 + 0.115)); } g.add(M(box(wd, 0.08, 0.08, 0.01), DARK, x, 1.2, d / 2 + 0.12)); };
    bay(-w / 2 + 1.8, 2.8); bay(-w / 2 + 4.9, 2.8); bay(w / 2 - 1.8, 2.8); bay(w / 2 - 4.9, 2.8);
    // 가운데 큰 미닫이 판문 2짝 + 노렌
    for (const s of [-1, 1]) { g.add(tbox(1.1, 2.6, 0.12, 'plank', 0x8a6040, s * 0.56, 0.45, d / 2 + 0.08, 0.02, 0.4)); for (let k = 0; k < 6; k++) g.add(M(box(1.06, 0.05, 0.05, 0.005), DARK, s * 0.56, 0.75 + k * 0.42, d / 2 + 0.16)); }
    at(g, B3.noren(2.4, '#24406a', '♨ 온천'), 0, 3.35, d / 2 + 0.3);
    // 1층 외처마 (나무 너와 차양)
    at(g, B3.pent(w + 0.8, 1.6, ROOF, 'shake', 0.36), 0, 3.6, d / 2 - 0.05);
    // 툇마루 평상 (앞) + 바퀴 달린 원목 평상 2
    g.add(tbox(w - 1, 0.2, 1.3, 'plank', 0xc8925a, 0, 0.45, d / 2 + 0.85, 0.02, 0.5));
    for (const x of [-w / 2 + 2.8, w / 2 - 2.8]) { const bn = new THREE.Group(); bn.add(tbox(2.4, 0.14, 0.8, 'plank', 0xc8925a, 0, 0.42, 0, 0.02, 0.5)); for (const xx of [-1.0, 1.0]) for (const zz of [-0.3, 0.3]) bn.add(M(sphere(0.1, 8, 6), 0x2a2a2e, xx, 0.12, zz)); for (const xx of [-1.0, 1.0]) bn.add(M(box(0.12, 0.32, 0.7, 0.01), 0x8a6040, xx, 0.26, 0)); at(g, bn, x, 0.06, d / 2 + 2.3); }
    // 2층: 들여 지은 목조 + 난간 회랑 + 분재 화분
    const up = new THREE.Group(); up.position.set(0, 3.65, -1.0); g.add(up);
    const uw = w - 2, ud = d - 3;
    up.add(tbox(uw, 2.6, ud, 'yakisugi', WOOD, 0, 0, 0, 0.03, 1.1));
    for (const x of [-uw / 2 + 2, -uw / 2 + 5, uw / 2 - 5, uw / 2 - 2]) { up.add(M(box(2.2, 1.6, 0.04, 0.01), B3.shojiMat(), x, 1.3, ud / 2 + 0.03)); for (let k = 0; k < 5; k++) up.add(M(box(0.05, 1.65, 0.05, 0.005), DARK, x - 1.0 + k * 0.5, 1.3, ud / 2 + 0.07)); }
    up.add(M(box(1.8, 2.2, 0.06, 0.01), tm('plank', 0x6a4a30), 0, 1.15, ud / 2 + 0.04));
    const rail = new THREE.Group(); rail.position.set(0, 0.05, ud / 2 + 1.0); up.add(rail);
    rail.add(tbox(uw + 0.6, 0.12, 1.9, 'plank', 0xc8925a, 0, -0.06, -0.9, 0.02, 0.5));
    for (const y of [0.55, 1.0]) rail.add(M(box(uw + 0.6, 0.1, 0.1, 0.02), tm('plank', 0xd8a068), 0, y, 0));
    for (let i = 0; i <= 10; i++) rail.add(M(box(0.12, 1.1, 0.12, 0.02), tm('plank', 0xd8a068), -uw / 2 - 0.3 + i * (uw + 0.6) / 10, 0.55, 0));
    for (const x of [-uw / 2 + 1.2, uw / 2 - 1.2, 1.6]) { const bp = new THREE.Group(); bp.add(M(cyl(0.28, 0.2, 0.3, 14), 0xf4f0e8, 0, 0.15, 0)); bp.add(M(cyl(0.29, 0.29, 0.04, 14), 0x2a4aa0, 0, 0.22, 0)); const pine = B3.bonsaiPine(0.32); pine.position.y = 0.28; bp.add(pine); at(rail, bp, x, 0, -0.6); }
    const r = K.gable(uw + 0.4, ud + 0.4, 2.0, ROOF, { kind: 'shake', wallKind: 'yakisugi', wallColor: WOOD, gableWindow: false, over: 0.9 }); r.position.y = 2.6; up.add(r);
    // 목욕탕 굴뚝 + ♨ 표시
    const ch = new THREE.Group(); ch.position.set(w / 2 - 1.4, 0, -d / 2 + 1.2); g.add(ch);
    ch.add(M(cyl(0.45, 0.6, 11, 12), tm('brick', 0xe8e0d4), 0, 5.5, 0)); ch.add(M(cyl(0.5, 0.5, 0.5, 12), 0x3a3a3a, 0, 11.0, 0));
    const cs = PM.sign('♨', 1.0, 1.0, '#e8e0d4', '#c0392b'); cs.position.set(0, 8.6, 0.52); ch.add(cs);
    g.add(steam(16, w / 2 - 1.8, w / 2 - 1.0, -d / 2 + 0.8, -d / 2 + 1.6, 11.3, 4, 1.4));
    // 등롱 · 큰 나무 통 욕조 · 석등
    for (const s of [-1, 1]) at(g, B3.lantern(0xfff0d0, 1.0, 'ゆ'), s * 1.7, 3.1, d / 2 + 0.6);
    const tub = new THREE.Group(); tub.add(M(cyl(1.0, 0.95, 0.9, 20), tm('plank', 0xc8925a), 0, 0.45, 0)); for (const y of [0.2, 0.7]) tub.add(M(geo('tubR', () => new THREE.TorusGeometry(1.0, 0.04, 6, 24)), 0x5a5a5a, 0, y, 0).rotateX(PI / 2));
    const tw = M(geo('tubW', () => new THREE.CircleGeometry(0.95, 20)), new THREE.MeshPhongMaterial({ color: 0xd8f0e8, shininess: 90, transparent: true, opacity: 0.85 }), 0, 0.85, 0); tw.rotation.x = -PI / 2; tub.add(tw);
    for (let i = 0; i < 8; i++) tub.add(M(sphere(0.1, 8, 6), 0xf8d040, Math.cos(i * 0.8) * 0.55, 0.88, Math.sin(i * 0.8) * 0.55));   // 유자
    at(g, tub, w / 2 + 1.8, 0.06, d / 2 - 0.6);
    // 노천탕 (왼쪽)
    const R = new THREE.Group(); R.position.set(-14, 0.06, 0); g.add(R);
    R.add(tbox(10.5, 0.14, 11, 'plank', 0xb08458, 1.6, 0, 0, 0.02, 0.5));
    const water = M(geo('rotW', () => { const sh = new THREE.Shape(); for (let i = 0; i <= 24; i++) { const a = i / 24 * PI * 2, rr = 3.3 + Math.sin(a * 3) * 0.35 + Math.cos(a * 5) * 0.2; i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } return new THREE.ShapeGeometry(sh); }), new THREE.MeshPhongMaterial({ color: 0xbfe8e0, emissive: 0x1a3a38, shininess: 120, specular: 0xffffff, transparent: true, opacity: 0.88 }), 0, 0.22, 0);
    water.rotation.x = -PI / 2; R.add(water);
    for (let i = 0; i < 26; i++) { const a = i / 26 * PI * 2, rr = 3.5 + Math.sin(a * 3) * 0.35 + Math.cos(a * 5) * 0.2; const st = M(sphere(0.42 + (i % 3) * 0.12, 9, 7), tm('stone', [0x8a8682, 0x9a948a, 0x7a7672][i % 3]), Math.cos(a) * rr, 0.25, Math.sin(a) * rr); st.scale.y = 0.6; st.rotation.y = i; R.add(st); }
    for (const [x, z, s] of [[-2.6, -2.8, 1.0], [2.4, -2.9, 0.8], [-3.2, 1.6, 0.7]]) { const b = M(sphere(0.7 * s, 9, 7), tm('stone', 0x8a8682), x, 0.6 * s, z); b.scale.y = 0.9; R.add(b); }
    // 대나무 물받이 (물줄기)
    const kk = new THREE.Group(); kk.add(M(cyl(0.07, 0.07, 1.6, 8), 0x8aa04a, 0, 0.8, 0)); const sp = M(cyl(0.06, 0.06, 1.2, 8), 0x8aa04a, 0.5, 1.5, 0); sp.rotation.z = PI / 2 - 0.2; kk.add(sp);
    const fall = M(cyl(0.04, 0.06, 1.1, 6), new THREE.MeshBasicMaterial({ color: 0xe8f8ff, transparent: true, opacity: 0.6 }), 1.1, 0.85, 0); kk.add(fall); at(R, kk, -3.6, 0.2, -2.6);
    // 대나무 담장 (바깥 두 면) + 석등 + 소나무 + 단풍
    const fence = (len) => { const f = new THREE.Group(); for (let i = 0; i < Math.round(len / 0.13); i++) f.add(M(cyl(0.06, 0.06, 2.2, 6), [0x9aa85a, 0x8a9a4a, 0xa8b46a][i % 3], -len / 2 + i * 0.13, 1.1, 0)); for (const y of [0.5, 1.7]) f.add(M(box(len, 0.08, 0.1, 0.01), 0x5a3a28, 0, y, 0.08)); return f; };
    at(R, fence(11), -3.6, 0, 0, PI / 2); at(R, fence(10.5), 1.6, 0, -5.4);
    at(R, B3.stoneLantern(), 3.6, 0.1, 3.8); at(R, B3.bonsaiPine(1.0), -2.4, 0.1, -4.4); at(R, B3.blossomTree(0xd84a2a, 0x4a3022, 0.9), 4.6, 0.1, -4.4);
    g.add(steam(30, -16.8, -11.2, -2.6, 2.6, 0.46, 2.6, 1.2));
    // 탈의 그늘막 (나무 지붕)
    const sh = new THREE.Group(); for (const [x, z] of [[-0.9, -0.6], [0.9, -0.6], [-0.9, 0.6], [0.9, 0.6]]) sh.add(M(box(0.12, 2.3, 0.12, 0.02), DARK, x, 1.15, z)); sh.add(tbox(2.4, 0.12, 1.8, 'shake', ROOF, 0, 2.3, 0, 0.02, 1)); sh.add(tbox(1.8, 0.4, 0.5, 'plank', 0xc8925a, 0, 0, -0.4, 0.02, 0.5)); for (let i = 0; i < 3; i++) sh.add(M(cyl(0.16, 0.13, 0.22, 10), 0xf8d040, -0.5 + i * 0.5, 0.52, -0.4)); at(R, sh, 4.2, 0.1, 0.5);
    // 간판
    const sg = PM.sign('♨ 달맞이 노천 온천 · 月見湯', 4.8, 0.62, '#3a2416', '#ffe8c0'); sg.position.set(0, 4.25, d / 2 + 0.95); sg.rotation.x = -0.15; g.add(sg);
    return g;
  };

  // =========================================================
  // 📸 추억 사진관
  // =========================================================
  const photoWin = () => B3.shopMat('photoWin', (c, w, h) => {
    c.fillStyle = '#e8eef4'; c.fillRect(0, 0, w, h);
    const cols = ['#ffd0dc', '#c8e8ff', '#fff0c0', '#d8f0d0'];
    for (let i = 0; i < 6; i++) { const x = 10 + (i % 3) * 82, y = 8 + Math.floor(i / 3) * 60; c.fillStyle = '#5a3a24'; c.fillRect(x - 3, y - 3, 70, 52); c.fillStyle = cols[i % 4]; c.fillRect(x, y, 64, 46); c.fillStyle = '#f4d0b0'; c.beginPath(); c.arc(x + 22, y + 20, 8, 0, 7); c.arc(x + 42, y + 22, 8, 0, 7); c.fill(); c.fillStyle = '#3a5a8a'; c.fillRect(x + 14, y + 30, 16, 16); c.fillStyle = '#e86a8a'; c.fillRect(x + 34, y + 32, 16, 14); }
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(30, h); c.lineTo(80, 0); c.lineTo(100, 0); c.lineTo(50, h); c.fill();
  }, [1, 0.85, 0.6]);
  // 물결 끝단 캔버스 차양 (흰색)
  function scallopAwning(wd, dep, col = 0xf4f0e6) {
    const g = new THREE.Group(); const m = tm('plaster', col);
    const top = M(box(wd, 0.08, dep, 0.02), m, 0, 0, dep / 2); g.add(top);
    const n = Math.round(wd / 0.5); for (let i = 0; i < n; i++) { const x = -wd / 2 + (i + 0.5) * wd / n; const sc = M(geo('scal' + (wd / n).toFixed(2), () => new THREE.CylinderGeometry(wd / n / 2, wd / n / 2, 0.06, 14, 1, false, 0, PI)), m, x, -0.02, dep); sc.rotation.set(PI / 2, 0, PI); g.add(sc); }
    g.add(M(box(wd, 0.35, 0.05, 0.01), m, 0, -0.16, dep));
    g.rotation.x = 0.22; return g;
  }
  // 벽돌 화분 + 파란 루피너스
  function lupineBox(len = 1.6) {
    const g = new THREE.Group(); g.add(tbox(len, 0.55, 0.7, 'brick', 0xb86a4a, 0, 0, 0, 0.03, 0.6)); g.add(M(box(len - 0.1, 0.06, 0.6, 0.01), 0x4a3a2a, 0, 0.53, 0));
    const n = Math.round(len * 4); for (let i = 0; i < n; i++) { const x = -len / 2 + 0.2 + i * (len - 0.4) / (n - 1), z = (i % 2 - 0.5) * 0.25, hgt = 0.5 + (i % 3) * 0.12; g.add(M(cyl(0.02, 0.025, hgt, 5), 0x4a8a3a, x, 0.55 + hgt / 2, z)); for (let k = 0; k < 6; k++) g.add(M(sphere(0.055 - k * 0.005, 6, 5), [0x3a5ad8, 0x5a7ae8, 0x2a4ab8][(i + k) % 3], x, 0.55 + hgt * 0.45 + k * 0.08, z)); }
    for (let i = 0; i < 3; i++) { const l = M(sphere(0.18, 8, 6), tm('leaf', 0x6a5a3a), -len / 3 + i * len / 3, 0.62, 0); l.scale.set(1.6, 0.4, 0.8); g.add(l); }
    return g;
  }
  BLD.photostudio = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld;
    const NAVY = 0x23365e, WH = 0xf6f2ea, WOODP = 0x6a4028;
    g.add(K.base(w, d, 0.5, 0xd8d4cc, 'stone'));
    // 1층: 흰 회벽 + 네이비 판넬 (오른쪽)
    g.add(tbox(w, 3.2, d, 'plaster', WH, 0, 0.45, 0, 0.04, 1.4));
    g.add(tbox(w * 0.42, 3.2, 0.1, 'panel', NAVY, w * 0.29, 0.45, d / 2 + 0.04, 0.02, 1));
    // 견본 사진 쇼윈도 + 원목 기둥 3개
    g.add(M(box(w * 0.44, 1.7, 0.04, 0.01), photoWin(), -w * 0.24, 1.95, d / 2 + 0.06));
    g.add(M(box(w * 0.46, 0.12, 0.3, 0.02), WH, -w * 0.24, 1.05, d / 2 + 0.15));
    for (let i = 0; i < 3; i++) g.add(tbox(0.22, 3.0, 0.22, 'plank', WOODP, -w / 2 + 0.5 + i * 0.4, 0.45, d / 2 + 0.6, 0.02, 0.5));
    // 문 (네이비 판 안 · 철제 장식 유리문)
    const dr = K.door(1.3, 2.4, NAVY, { frame: WH, lamp: false, matColor: 0x8a6a3a }); dr.position.set(w * 0.29, 0.45, d / 2 + 0.1); g.add(dr);
    for (let i = 0; i < 3; i++) g.add(tbox(2.2 - i * 0.3, 0.16, 0.45, 'stone', 0x8a8a92, w * 0.29, 0.0 + i * 0.15, d / 2 + 1.2 - i * 0.38, 0.02, 1));
    // 물결 캔버스 차양 + 전구 줄
    at(g, scallopAwning(w * 0.55, 1.6), -w * 0.2, 3.5, d / 2 + 0.06);
    for (let i = 0; i < 12; i++) { const b = M(sphere(0.09, 8, 6), glow(0xfff4d0), -w / 2 + 0.6 + i * (w - 1.2) / 11, 3.25 - Math.sin(i / 11 * PI) * 0.2, d / 2 + 1.55); b.userData.noBake = true; g.add(b); }
    // 2층: 네이비 벽 + 흰 창 · 갈색 꽃상자 + 하프팀버 띠
    const up = new THREE.Group(); up.position.y = 3.65; g.add(up);
    up.add(tbox(w, 2.6, d, 'panel', NAVY, 0, 0, 0, 0.04, 1.2));
    up.add(M(box(w + 0.2, 0.22, d + 0.2, 0.03), tm('plank', WOODP), 0, 0.05, 0));
    for (let i = 0; i < 9; i++) { const br = M(box(0.12, 0.9, 0.06, 0.01), tm('plank', WOODP), -w / 2 + 0.6 + i * (w - 1.2) / 8, 0.55, d / 2 + 0.04); br.rotation.z = i % 2 ? 0.6 : -0.6; up.add(br); }
    for (const x of [-w / 4 - 0.4, w / 4 + 0.4]) at(up, K.window(1.2, 1.1, { box: true, boxColor: 0x6a4028, frame: WH, curtain: '#eaf2ff', seed: x > 0 ? 1 : 3 }), x, 1.6, d / 2 + 0.02);
    const rf = K.hip(w + 0.8, d + 0.8, 2.4, 0x2f4a7a, 'rooftile'); rf.position.y = 2.6; up.add(rf);
    const dm = K.dormer(WH, 0x2f4a7a, 'plaster'); dm.position.set(0, 3.0, d / 4); dm.scale.setScalar(0.85); up.add(dm);
    at(up, K.chimney(1.4, 0x8a7a6a), w / 2 - 1.2, 2.8, -d / 4);
    // 간판 · 매다는 카메라 간판 · 벽 램프
    const sg = PM.sign('📸 추억 사진관  PHOTO BLUE', 4.6, 0.55, '#f6f2ea', '#23365e'); sg.position.set(-w * 0.18, 3.42, d / 2 + 0.12); g.add(sg);
    at(g, K.hangSign('📷', '#23365e', '#ffffff', 0.8), w / 2 - 0.1, 3.2, d / 2 - 0.4, PI / 2);
    for (const x of [w * 0.29 - 1.0, w * 0.29 + 1.0]) at(g, B3.wallLamp(0x3a2a1a), x, 2.5, d / 2 + 0.1);
    // 앞마당: 벽돌 화분 루피너스 · 칠판 · 술통 · 벤치 · 가로등
    for (const [x, z] of [[-w / 2 + 1.2, d / 2 + 2.2], [w / 2 - 0.6, d / 2 + 2.4]]) at(g, lupineBox(1.6), x, 0.06, z);
    const cb = new THREE.Group(); for (const s of [-1, 1]) { const b = M(box(0.7, 0.95, 0.05, 0.01), 0x2a3a30, 0, 0.5, s * 0.14); b.rotation.x = s * 0.18; cb.add(b); } const ct = PM.sign('오늘의 촬영 📸\n가족 · 커플 · 우정', 0.6, 0.7, '#2a3a30', '#ffffff'); ct.position.set(0, 0.55, 0.19); ct.rotation.x = -0.18; cb.add(ct); at(g, cb, -1.6, 0.06, d / 2 + 1.7, 0.2);
    const br2 = new THREE.Group(); br2.add(M(cyl(0.34, 0.3, 0.75, 14), tm('plank', 0x8a5a34), 0, 0.38, 0)); for (const y of [0.15, 0.6]) br2.add(M(geo('brR2', () => new THREE.TorusGeometry(0.33, 0.02, 6, 18)), 0x3a3a3a, 0, y, 0).rotateX(PI / 2)); at(g, br2, -w / 2 - 0.4, 0.06, d / 2 + 0.8);
    const lp = new THREE.Group(); lp.add(M(cyl(0.06, 0.08, 2.8, 8), 0x6a4a30, 0, 1.4, 0)); lp.add(M(sphere(0.22, 12, 10), glass(0xfff4d8), 0, 2.95, 0)); const bb = M(sphere(0.12, 8, 6), glow(0xffd890), 0, 2.95, 0); bb.userData.noBake = true; bb.userData.lampBulb = true; lp.add(bb); lp.add(M(geo('lpTop', () => new THREE.ConeGeometry(0.26, 0.2, 10)), 0x6a4a30, 0, 3.2, 0)); at(g, lp, w / 2 + 1.0, 0.06, d / 2 + 2.6);
    return g;
  };
})();
