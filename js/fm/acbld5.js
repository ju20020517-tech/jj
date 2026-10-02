/* =========================================================
 *  새 건물 외관 5 — 대형마트 · 게임센터 오락실 · 메디컬 센터(도시 빌딩형 복원)
 *   🛒 대형마트   : 커다란 박스형 매장 (따뜻한 회색 패널 · 노란 간판 띠 & 스마일 · 노란 코너 기둥 간판 · 유리 전면 매장 ·
 *                   노란 캐노피 & 다운라이트 · 자동문 방풍실 · 카트 보관소 · 과일 가판 · 세일 현수막 · 옥상 실외기)
 *   🎮 게임센터   : 2층 게임센터 (1층 3m 들여 앞은 필로티 · 인형뽑기 기계 줄 · 가챠 기계 벽 · 스티커 사진 부스 ·
 *                   2층 LED 전광판 & 네온 테두리 · 세로 GAME 간판 · 전구 마퀴 · 옥상 대형 볼링핀 & 볼)
 *   🏥 메디컬 센터: 흰 층 띠 · 민트 유리 띠창 · 양쪽 둥근 모서리 탑 · 빨간 십자 · 옥상 헬기장 · 반원 캐노피 · 구급차
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
  const mcache = new Map(); const cm = (key, make) => { if (!mcache.has(key)) mcache.set(key, make()); return mcache.get(key); };
  const nightMats = B3.nightMats || [];
  const shopMat = B3.shopMat || ((k, draw) => new THREE.MeshLambertMaterial({ map: PM.ctex('s5' + k, 256, 128, draw) }));
  const sign = (t, w, h, bg, fg, gl) => PM.sign(t, w, h, bg, fg, gl);
  const bulb = (c = 0xfff0b0, r = 0.07) => { const b = M(geo('b5bulb' + r, () => new THREE.SphereGeometry(r, 8, 6)), glow(c)); b.userData.noBake = true; return b; };

  // =========================================================
  // 🛒 대형마트
  // =========================================================
  // 매장 유리 너머 그림: 진열대 줄 · 과일 코너 · 천장 조명 · 계산대
  const hyperWin = () => shopMat('hyperWin5', (c, w, h) => {
    c.fillStyle = '#f6f1e2'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#fffbe8'; for (let x = 8; x < w; x += 42) c.fillRect(x, 6, 30, 5);
    const cols = ['#e8484a', '#ffb02a', '#5ab04a', '#3a8ae8', '#ff7aa8', '#ffd84a', '#8a5ad8'];
    for (let s = 0; s < 6; s++) { const x0 = 8 + s * 42; c.fillStyle = '#c8ccd2'; c.fillRect(x0, 26, 30, h - 40); for (let r = 0; r < 5; r++) for (let i = 0; i < 5; i++) { c.fillStyle = cols[(s * 3 + r + i) % cols.length]; c.fillRect(x0 + 2 + i * 5.6, 30 + r * 17, 4.6, 12); } }
    c.fillStyle = '#ffc61a'; c.fillRect(0, h - 16, w, 6); c.fillStyle = '#d8d2c2'; c.fillRect(0, h - 10, w, 10);
  }, [1, 0.92, 0.7]);
  function cart(col = 0xd8282a) {
    const g = new THREE.Group(); const MT = 0xb8bec6;
    g.add(M(box(0.6, 0.42, 0.85, 0.03), glass(0xc8d0d8), 0, 0.72, 0));
    for (const y of [0.52, 0.93]) { g.add(M(box(0.62, 0.03, 0.03, 0.01), MT, 0, y, 0.43)); g.add(M(box(0.62, 0.03, 0.03, 0.01), MT, 0, y, -0.43)); g.add(M(box(0.03, 0.03, 0.88, 0.01), MT, 0.3, y, 0)); g.add(M(box(0.03, 0.03, 0.88, 0.01), MT, -0.3, y, 0)); }
    g.add(M(box(0.03, 0.02, 0.85, 0.01), MT, 0, 0.22, 0)); for (const s of [-1, 1]) g.add(M(box(0.03, 0.5, 0.03, 0.01), MT, s * 0.25, 0.3, 0.38));
    g.add(M(box(0.66, 0.06, 0.06, 0.03), col, 0, 1.02, -0.52)); for (const s of [-1, 1]) g.add(M(box(0.03, 0.2, 0.03, 0.01), MT, s * 0.3, 0.95, -0.48));
    for (const [x, z] of [[-0.24, 0.36], [0.24, 0.36], [-0.24, -0.36], [0.24, -0.36]]) { const wl = M(geo('cartW', () => new THREE.CylinderGeometry(0.06, 0.06, 0.04, 10)), 0x3a3a3a, x, 0.06, z); wl.rotation.z = PI / 2; g.add(wl); }
    return g;
  }
  function fruitStand() {
    const g = new THREE.Group();
    g.add(M(box(3.2, 0.08, 1.4, 0.02), 0x8a6a48, 0, 0.75, 0));
    for (const [x, z] of [[-1.5, -0.6], [1.5, -0.6], [-1.5, 0.6], [1.5, 0.6]]) g.add(M(box(0.08, 0.75, 0.08, 0.01), 0x6a4a30, x, 0.375, z));
    const F = [[0xff8a1a, 0.11], [0xe8282a, 0.1], [0xffd84a, 0.1], [0x7ac83a, 0.1], [0x8a3ab8, 0.07]];
    for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) {
      const cx = -1.25 + i * 0.62, cz = -0.3 + r * 0.62, y = 0.8 + (1 - r) * 0.22;
      g.add(tbox(0.55, 0.2, 0.5, 'plank', 0xc89a62, cx, y, cz, 0.02, 0.5));
      const [col, rad] = F[(i + r * 2) % F.length];
      for (let k = 0; k < 6; k++) g.add(M(geo('frt' + rad, () => new THREE.SphereGeometry(rad, 8, 6)), col, cx - 0.15 + (k % 3) * 0.15, y + 0.24 + Math.floor(k / 3) * 0.05, cz - 0.08 + Math.floor(k / 3) * 0.16));
      const tag = sign(['₩990', '1+1', '특가', '₩1,500', '제철'][(i + r) % 5], 0.36, 0.18, '#ffffff', '#e8282a'); tag.position.set(cx, y + 0.12, cz + 0.26); g.add(tag);
    }
    // 수박 더미
    for (let i = 0; i < 4; i++) { const wm = M(geo('wmel', () => new THREE.SphereGeometry(0.22, 12, 8)), tm('leaf', 0x3a8a3a), -1.1 + i * 0.7, 0.22, 0.95); wm.scale.set(1, 0.85, 1.15); g.add(wm); }
    // 줄무늬 파라솔 대신 노란 천막
    const aw = K.awning(3.6, 1.6, 0xffc61a, 0xffffff); aw.position.set(0, 2.2, -0.4); g.add(aw);
    for (const x of [-1.7, 1.7]) g.add(M(box(0.06, 2.2, 0.06, 0.01), 0x9aa0a8, x, 1.1, 0.6));
    return g;
  }
  BLD.mall = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld;
    const GREY = 0xe6e1d4, DARK = 0x3e4248, YEL = 0xffc61a, GH = 4.2, UH = 6.6, TOP = 0.36 + GH + UH;
    g.add(K.base(w, d, 0.4, 0xbcb8b0, 'stone'));
    // 1층: 짙은 회색 기단 + 유리 매장 (진열대가 비침, 밤엔 불)
    g.add(tbox(w, GH, d, 'panel', DARK, 0, 0.36, 0, 0.03, 1.2));
    g.add(M(box(w - 1.6, 3.1, 0.04, 0.01), hyperWin(), 0, 1.95, d / 2 + 0.04));
    for (let i = 0; i <= 10; i++) g.add(M(box(0.1, 3.2, 0.12, 0.01), 0x2a2c30, -(w - 1.6) / 2 + i * (w - 1.6) / 10, 1.95, d / 2 + 0.08));
    g.add(M(box(w - 1.4, 0.12, 0.16, 0.02), 0x2a2c30, 0, 3.55, d / 2 + 0.08));
    // 2~3층 몸체: 따뜻한 회색 금속 패널 + 가로 줄눈
    g.add(tbox(w, UH, d, 'panel', GREY, 0, 0.36 + GH, 0, 0.03, 1.6));
    for (let y = 0.36 + GH + 1.1; y < TOP - 0.6; y += 1.1) { g.add(M(box(w + 0.04, 0.05, 0.02, 0.005), 0xb8b2a4, 0, y, d / 2 + 0.01)); for (const s of [-1, 1]) g.add(M(box(0.02, 0.05, d + 0.04, 0.005), 0xb8b2a4, s * (w / 2 + 0.01), y, 0)); }
    // 옆면 높은 띠창
    for (const s of [-1, 1]) g.add(M(box(0.04, 0.7, d - 2.4, 0.01), glass(0xbfe8ff), s * (w / 2 + 0.03), TOP - 1.4, 0));
    // 노란 간판 띠 + 스마일 + 상호
    const bandY = 0.36 + GH + 2.3;
    g.add(M(box(w + 0.3, 2.3, 0.35, 0.06), YEL, 0, bandY, d / 2 + 0.16));
    g.add(M(box(w + 0.32, 0.12, 0.38, 0.02), 0xffffff, 0, bandY + 1.18, d / 2 + 0.16)); g.add(M(box(w + 0.32, 0.12, 0.38, 0.02), 0xffffff, 0, bandY - 1.18, d / 2 + 0.16));
    const smile = new THREE.Group(); smile.add(M(geo('smD', () => new THREE.CircleGeometry(0.85, 28)), glow(0xffe680))); for (const s of [-1, 1]) smile.add(M(geo('smE', () => new THREE.CircleGeometry(0.11, 12)), 0x3a3a3a, s * 0.28, 0.18, 0.01)); const mouth = M(geo('smM', () => new THREE.RingGeometry(0.4, 0.5, 20, 1, PI * 1.15, PI * 0.7)), 0x3a3a3a, 0, 0.08, 0.01); smile.add(mouth); at(g, smile, -w / 2 + 2.2, bandY, d / 2 + 0.35);
    const sg = sign('아일랜드 마트', 9.0, 1.6, '#ffc61a', '#3a3a3a'); sg.position.set(0.6, bandY, d / 2 + 0.35); g.add(sg);
    const sg2 = sign('ISLAND MART · 365일 매일 10:00 ~ 23:00', 4.6, 0.42, '#ffc61a', '#5a4a1a'); sg2.position.set(w / 2 - 3.0, bandY - 0.8, d / 2 + 0.35); g.add(sg2);
    // 지붕 파라펫 + 옥상 실외기 & 물탱크
    g.add(M(box(w + 0.3, 0.5, d + 0.3, 0.04), DARK, 0, TOP + 0.2, 0));
    g.add(M(box(w - 0.6, 0.06, d - 0.6, 0.01), 0x8a8e94, 0, TOP + 0.02, 0));
    for (let i = 0; i < 4; i++) { const u = new THREE.Group(); u.add(M(box(1.4, 0.9, 1.0, 0.05), 0xd8dce0, 0, 0.45, 0)); const f = M(geo('acFan', () => new THREE.CylinderGeometry(0.34, 0.34, 0.04, 16)), 0x5a5e64, 0, 0.92, 0); u.add(f); at(g, u, -w / 2 + 2 + i * 1.8, TOP, -d / 2 + 2); }
    const tank = M(cyl(0.9, 0.9, 1.8, 16), 0x9ac8e8, w / 2 - 2.4, TOP + 0.9, -d / 2 + 2.4); g.add(tank);
    // 노란 코너 기둥 간판 (MART 세로)
    const py = new THREE.Group(); at(g, py, w / 2 - 0.2, 0, d / 2 + 0.6);
    py.add(M(box(1.5, TOP + 3.0, 1.5, 0.08), YEL, 0, (TOP + 3.0) / 2, 0));
    py.add(M(box(1.62, 0.3, 1.62, 0.04), 0x3a3a3a, 0, TOP + 3.1, 0));
    'MART'.split('').forEach((ch, i) => { for (const f of [0, 1]) { const s = sign(ch, 1.15, 1.15, '#ffc61a', '#3a3a3a'); s.position.set(f ? 0.76 : 0, TOP + 1.9 - i * 1.4, f ? 0 : 0.76); if (f) s.rotation.y = PI / 2; py.add(s); } });
    const sm2 = smile.clone(); sm2.scale.setScalar(0.6); sm2.position.set(0, TOP + 3.9, 0.3); py.add(sm2);
    // 입구: 노란 캐노피 + 다운라이트 + 유리 방풍실 + 자동문
    const can = new THREE.Group(); at(g, can, 0, 0, d / 2);
    can.add(M(box(7.6, 0.4, 3.0, 0.06), YEL, 0, 3.9, 1.5)); can.add(M(box(7.62, 0.1, 3.02, 0.02), 0xffffff, 0, 3.68, 1.5));
    for (let i = 0; i < 6; i++) for (const zz of [0.8, 2.2]) { const b = M(geo('dlt', () => new THREE.CircleGeometry(0.12, 12)), glow(0xfff2c8), -3.1 + i * 1.24, 3.62, zz); b.rotation.x = PI / 2; b.userData.noBake = true; can.add(b); }
    for (const x of [-3.6, 3.6]) can.add(M(cyl(0.12, 0.12, 3.7, 10), 0xdfe2e6, x, 1.85, 2.85));
    can.add(M(box(5.0, 3.1, 1.4, 0.02), glass(0xd8f0ff), 0, 1.95, 0.72));
    for (const x of [-2.5, -0.02, 2.5]) can.add(M(box(0.1, 3.1, 1.44, 0.01), 0x9aa0a8, x, 1.95, 0.72));
    can.add(M(box(5.04, 0.16, 1.46, 0.01), 0x9aa0a8, 0, 3.5, 0.72));
    for (const s of [-1, 1]) can.add(M(box(1.15, 2.6, 0.04, 0.01), glass(0xe8f8ff), s * 0.62, 1.7, 1.44));
    const ws = sign('어서오세요 😊 WELCOME', 3.4, 0.36, '#3a3a3a', '#ffc61a'); ws.position.set(0, 3.25, 1.46); can.add(ws);
    const mat2 = M(box(2.4, 0.02, 1.0, 0.01), 0x3a3a3a, 0, 0.42, 2.0); can.add(mat2);
    // 세일 현수막 (1층 유리 위)
    const b1 = sign('🍓 신선 과일 · 매일 새벽 입고', 4.2, 0.55, '#e8323c', '#ffffff'); b1.position.set(-w / 2 + 3.2, 3.85, d / 2 + 0.1); g.add(b1);
    const b2 = sign('🎉 주말 1+1 대잔치', 3.6, 0.55, '#2e9a5a', '#ffffff'); b2.position.set(w / 2 - 3.6, 3.85, d / 2 + 0.1); g.add(b2);
    // 노란 볼라드
    for (let i = 0; i < 6; i++) { const x = -4.6 + i * 1.84; if (Math.abs(x) < 1.4) continue; g.add(M(cyl(0.13, 0.15, 0.8, 10), YEL, x, 0.44, d / 2 + 3.5)); g.add(M(cyl(0.14, 0.14, 0.08, 10), 0x3a3a3a, x, 0.62, d / 2 + 3.5)); }
    // 카트 보관소 (지붕 + 레일 + 카트 6대)
    const cs = new THREE.Group(); at(g, cs, w / 2 - 3.6, 0.06, d / 2 + 2.2);
    cs.add(M(box(3.2, 0.1, 1.8, 0.02), 0x3e4248, 0, 2.2, 0)); cs.add(M(box(3.22, 0.3, 0.06, 0.02), YEL, 0, 2.05, 0.9));
    for (const x of [-1.5, 1.5]) for (const z of [-0.8, 0.8]) cs.add(M(box(0.07, 2.2, 0.07, 0.01), 0x9aa0a8, x, 1.1, z));
    for (const z of [-0.45, 0.45]) cs.add(M(box(3.0, 0.05, 0.05, 0.01), 0x9aa0a8, 0, 0.7, z));
    for (let i = 0; i < 6; i++) { const ct = cart(i % 3 ? 0xd8282a : 0xffc61a); ct.position.set(-1.2 + i * 0.32, 0, 0); ct.rotation.y = PI / 2; cs.add(ct); }
    const cps = sign('🛒 카트 보관소', 1.6, 0.34, '#3e4248', '#ffc61a'); cps.position.set(0, 1.75, 0.94); cs.add(cps);
    // 과일 가판 (입구 왼쪽)
    at(g, fruitStand(), -w / 2 + 3.4, 0.06, d / 2 + 2.0);
    // 장바구니 탑 & 입간판
    const bk = new THREE.Group(); for (let i = 0; i < 6; i++) bk.add(M(box(0.5, 0.09, 0.36, 0.02), i % 2 ? 0xe8282a : 0x3a8ae8, 0, 0.1 + i * 0.09, 0)); at(g, bk, -2.9, 0.06, d / 2 + 1.0);
    const ab = new THREE.Group(); for (const sg of [1, -1]) { const pn = M(box(0.7, 1.0, 0.05, 0.02), 0x3a3a3a, 0, 0.6, sg * 0.1); pn.rotation.x = -0.15 * sg; ab.add(pn); } const abs = sign('오늘의 특가\n삼겹살 30%↓\n딸기 1+1', 0.6, 0.85, '#2a2a2a', '#ffffff'); abs.position.set(0, 0.62, 0.17); abs.rotation.x = -0.15; ab.add(abs); at(g, ab, 2.9, 0.06, d / 2 + 2.9);
    return g;
  };

  // =========================================================
  // 🎮 게임센터 오락실 & 볼링장
  // =========================================================
  const arcWin = () => shopMat('arcWin5', (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a1a4a'); gr.addColorStop(1, '#5a2a6a'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    const cols = ['#ff5ab8', '#4ae0ff', '#ffe04a', '#8aff6a', '#ff8a3a'];
    for (let i = 0; i < 7; i++) { const x = 6 + i * 36; c.fillStyle = cols[i % 5]; c.fillRect(x, 30, 28, h - 34); c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(x + 3, 40, 22, 34); for (let k = 0; k < 4; k++) { c.fillStyle = cols[(i + k + 2) % 5]; c.beginPath(); c.arc(x + 7 + (k % 2) * 13, 64 + Math.floor(k / 2) * 6, 5, 0, 7); c.fill(); } c.fillStyle = '#ffffff'; c.fillRect(x + 4, 22, 20, 6); }
    c.fillStyle = 'rgba(255,255,255,0.9)'; for (let x = 4; x < w; x += 16) c.fillRect(x, 6, 8, 3);
  }, [1, 0.85, 1]);
  const ledMat = () => shopMat('arcLED5', (c, w, h) => {
    c.fillStyle = '#0c0820'; c.fillRect(0, 0, w, h);
    const px = 8; const cols = ['#ff4ab0', '#4ae0ff', '#ffe04a', '#7aff6a'];
    for (let y = 0; y < h; y += px) for (let x = 0; x < w; x += px) { const v = Math.sin(x * 0.05 + y * 0.03) + Math.cos(y * 0.07 - x * 0.02); if (v > 1.1) { c.fillStyle = cols[((x + y) / px | 0) % 4]; c.globalAlpha = 0.35; c.fillRect(x + 1, y + 1, px - 2, px - 2); } }
    c.globalAlpha = 1; c.font = 'bold 64px Jua, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#ff4ab0'; c.shadowBlur = 16; c.fillStyle = '#ffffff'; c.fillText('GAME  ★  BOWLING', w / 2, h * 0.42);
    c.font = 'bold 26px Jua, sans-serif'; c.shadowColor = '#4ae0ff'; c.fillStyle = '#bff6ff'; c.fillText('UFO CATCHER · 리듬게임 · 레이싱 · 24H LANES', w / 2, h * 0.8);
  }, [1, 1, 1], [512, 160]);
  function clawMachine(col, plush) {
    const g = new THREE.Group();
    g.add(M(box(1.0, 0.9, 0.95, 0.06), col, 0, 0.45, 0));
    g.add(M(box(0.6, 0.05, 0.25, 0.01), 0x2a2a2a, 0, 0.92, 0.35));
    const st = M(cyl(0.025, 0.025, 0.15, 6), 0x2a2a2a, -0.12, 1.0, 0.38); g.add(st); g.add(M(sphere(0.05, 8, 6), 0xff3a3a, -0.12, 1.08, 0.38)); g.add(M(cyl(0.04, 0.04, 0.03, 10), 0x4ae0ff, 0.12, 0.96, 0.38));
    g.add(M(box(0.98, 1.2, 0.92, 0.01), glass(0xf0faff), 0, 1.52, 0));
    for (const [x, z] of [[-0.48, -0.45], [0.48, -0.45], [-0.48, 0.45], [0.48, 0.45]]) g.add(M(box(0.05, 1.22, 0.05, 0.01), col, x, 1.52, z));
    for (let i = 0; i < 9; i++) { const pm = M(geo('plush', () => new THREE.SphereGeometry(0.12, 10, 8)), plush[i % plush.length], -0.3 + (i % 3) * 0.3, 1.04 + Math.floor(i / 3) * 0.06, -0.25 + Math.floor(i / 3) * 0.22); pm.scale.y = 0.85; g.add(pm); if (i % 2 === 0) for (const s of [-1, 1]) g.add(M(geo('plE', () => new THREE.SphereGeometry(0.045, 6, 5)), plush[i % plush.length], -0.3 + (i % 3) * 0.3 + s * 0.07, 1.16 + Math.floor(i / 3) * 0.06, -0.25 + Math.floor(i / 3) * 0.22)); }
    g.add(M(cyl(0.012, 0.012, 0.4, 6), 0xd0d4d8, 0.1, 1.92, 0.05)); const cl = M(geo('claw', () => new THREE.ConeGeometry(0.1, 0.14, 6, 1, true)), 0xd0d4d8, 0.1, 1.68, 0.05); cl.rotation.x = PI; g.add(cl);
    const top = M(box(1.04, 0.32, 0.96, 0.06), glow(col === 0xffffff ? 0xffe0f0 : 0xfff6d8), 0, 2.28, 0); top.userData.noBake = true; g.add(top);
    const lb = sign('UFO CATCHER', 0.92, 0.24, '#ff4ab0', '#ffffff'); lb.position.set(0, 2.28, 0.49); g.add(lb);
    for (let i = 0; i < 6; i++) { const b = bulb([0xff4ab0, 0x4ae0ff, 0xffe04a][i % 3], 0.035); b.position.set(-0.45 + i * 0.18, 0.88, 0.48); g.add(b); }
    return g;
  }
  function gacha(col) {
    const g = new THREE.Group();
    g.add(M(box(0.5, 0.5, 0.45, 0.04), col, 0, 0.25, 0));
    g.add(M(geo('gcGl', () => new THREE.BoxGeometry(0.48, 0.5, 0.43)), glass(0xffffff), 0, 0.76, 0));
    for (let i = 0; i < 8; i++) g.add(M(geo('caps', () => new THREE.SphereGeometry(0.07, 8, 6)), [0xff6a9a, 0x6ad0ff, 0xffe04a, 0x8aff6a, 0xffffff][i % 5], -0.13 + (i % 3) * 0.13, 0.58 + Math.floor(i / 3) * 0.12, -0.08 + (i % 2) * 0.12));
    g.add(M(cyl(0.07, 0.07, 0.04, 12), 0xd8d8d8, 0, 0.32, 0.23).rotateX(PI / 2));
    g.add(M(box(0.5, 0.1, 0.45, 0.03), col, 0, 1.06, 0));
    return g;
  }
  function purikura() {
    const g = new THREE.Group();
    g.add(M(box(1.9, 2.3, 2.0, 0.1), 0xfff0f6, 0, 1.15, 0));
    const ad = shopMat('puriAd5', (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#ff9ad0'); gr.addColorStop(1, '#a0c8ff'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc((i * 47) % w, (i * 31) % h, 6 + (i % 4) * 3, 0, 7); c.fill(); } c.font = 'bold 40px Jua, sans-serif'; c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.shadowColor = '#ff3a9a'; c.shadowBlur = 10; c.fillText('PURIKURA', w / 2, h * 0.42); c.font = '24px Jua, sans-serif'; c.fillText('✨ 스티커 사진 ✨', w / 2, h * 0.75); }, [1, 0.9, 1], [256, 160]);
    g.add(M(box(1.92, 1.2, 0.02, 0.01), ad, 0, 1.6, 1.01));
    const cu = M(box(1.0, 1.0, 0.03, 0.01), 0xff7ab8, -0.35, 0.55, 1.02); g.add(cu);
    for (let i = 0; i < 5; i++) g.add(M(box(0.02, 0.98, 0.04, 0.005), 0xffb0d8, -0.8 + i * 0.22, 0.55, 1.04));
    g.add(M(box(1.96, 0.18, 2.04, 0.04), glow(0xffd0ea), 0, 2.36, 0));
    return g;
  }
  function bowlingPin(s = 1) {
    const pts = [[0, 0], [0.34, 0], [0.42, 0.4], [0.46, 0.9], [0.4, 1.4], [0.24, 1.9], [0.2, 2.2], [0.27, 2.6], [0.28, 2.85], [0.2, 3.1], [0, 3.2]].map(([x, y]) => new THREE.Vector2(x * s, y * s));
    const g = new THREE.Group();
    g.add(M(geo('pinL' + s, () => new THREE.LatheGeometry(pts, 20)), 0xfbfbf6));
    for (const y of [2.05, 2.25]) g.add(M(geo('pinR' + s + y, () => new THREE.CylinderGeometry(0.215 * s, 0.215 * s, 0.09 * s, 20, 1, true)), 0xe8282a, 0, y * s, 0));
    return g;
  }
  BLD.arcade = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld;
    const BODY = 0x2a2448, TRIM = 0x3a3060, GH = 3.6, UH = 3.9, SET = 3.0, TOP = 0.36 + GH + UH;
    g.add(K.base(w, d, 0.4, 0x8a8494, 'stone'));
    // 1층 (3m 들임) + 필로티 바닥 타일
    g.add(tbox(w, GH, d - SET, 'panel', BODY, 0, 0.36, -SET / 2, 0.03, 1.2));
    g.add(tbox(w - 0.2, 0.06, SET, 'tile', 0x4a3a5a, 0, 0.36, d / 2 - SET / 2, 0.01, 0.8));
    const fz = d / 2 - SET + 0.04;
    g.add(M(box(w - 1.2, 3.0, 0.04, 0.01), arcWin(), 0, 1.9, fz));
    for (let i = 0; i <= 8; i++) g.add(M(box(0.08, 3.1, 0.1, 0.01), 0x1a1630, -(w - 1.2) / 2 + i * (w - 1.2) / 8, 1.9, fz + 0.04));
    // 2층 (앞으로 내민 몸체) + 기둥
    g.add(tbox(w, UH, d, 'panel', TRIM, 0, 0.36 + GH, 0, 0.03, 1.4));
    for (const x of [-w / 2 + 0.3, w / 2 - 0.3]) g.add(M(box(0.5, GH, 0.5, 0.04), 0x1a1630, x, 0.36 + GH / 2, d / 2 - 0.3));
    // 필로티 천장 조명 줄
    for (let i = 0; i < 5; i++) { const b = M(box(w - 2, 0.04, 0.12, 0.01), glow(0xfff2f8), 0, 0.34 + GH - 0.02, d / 2 - 0.4 - i * 0.6); b.userData.noBake = true; g.add(b); }
    // 2층 LED 전광판 + 네온 테두리 (분홍 · 하늘)
    const ly = 0.36 + GH + UH / 2 + 0.1;
    g.add(M(box(w - 3.4, UH - 1.0, 0.06, 0.01), ledMat(), 0, ly, d / 2 + 0.04));
    const neon = (x0, y0, x1, y1, c) => { const l = Math.hypot(x1 - x0, y1 - y0); const n = M(box(l, 0.08, 0.08, 0.04), glow(c), (x0 + x1) / 2, (y0 + y1) / 2, d / 2 + 0.12); n.rotation.z = Math.atan2(y1 - y0, x1 - x0); n.userData.noBake = true; g.add(n); };
    const lx = (w - 3.4) / 2 + 0.15, lh = (UH - 1.0) / 2 + 0.15;
    neon(-lx, ly - lh, lx, ly - lh, 0xff4ab0); neon(-lx, ly + lh, lx, ly + lh, 0xff4ab0); neon(-lx, ly - lh, -lx, ly + lh, 0x4ae0ff); neon(lx, ly - lh, lx, ly + lh, 0x4ae0ff);
    neon(-w / 2 - 0.02, TOP - 0.1, w / 2 + 0.02, TOP - 0.1, 0x4ae0ff);
    // 마퀴 간판 (필로티 처마) + 전구
    const mq = sign('🎮 NEON SPARK  ·  GAME CENTER & 24H BOWLING', w - 1.6, 0.7, '#1a1030', '#ff8ae0', '#ff4ab0'); mq.position.set(0, 0.36 + GH - 0.1, d / 2 + 0.06); g.add(mq);
    for (let i = 0; i < 26; i++) { const b = bulb(i % 2 ? 0xfff0b0 : 0xffb0e0, 0.06); b.position.set(-w / 2 + 0.4 + i * (w - 0.8) / 25, 0.36 + GH + 0.32, d / 2 + 0.1); g.add(b); }
    // 세로 GAME 간판 (모서리) + 쫓아가는 전구
    const bl = new THREE.Group(); at(g, bl, -w / 2 - 0.1, 0.36 + GH - 0.2, d / 2 - 0.6);
    bl.add(M(box(0.3, 4.8, 1.3, 0.06), 0x1a1030, 0, 2.4, 0));
    'GAME'.split('').forEach((ch, i) => { for (const s of [-1, 1]) { const t = sign(ch, 1.0, 1.0, ['#ff4ab0', '#4ae0ff', '#ffe04a', '#7aff6a'][i], '#ffffff'); t.position.set(s * 0.16, 4.1 - i * 1.1, 0); t.rotation.y = s * PI / 2; bl.add(t); } });
    for (let i = 0; i < 14; i++) for (const zz of [-0.62, 0.62]) { const b = bulb(0xfff0b0, 0.05); b.position.set(0, 0.2 + i * 0.34, zz); bl.add(b); }
    // 인형뽑기 기계 4대 (문 양옆) + 가챠 벽
    const PL = [[0xffb0d0, 0xfff2a0, 0xa0e0ff], [0xfff2a0, 0xb0ffb0, 0xffc0a0], [0xd0b0ff, 0xffb0d0, 0xffffff], [0xa0e0ff, 0xffd0a0, 0xffb0d0]];
    [[-5.6, 0xff6ab8], [-3.9, 0x4ad8f0], [3.9, 0xffd84a], [5.6, 0xffffff]].forEach(([x, c], i) => at(g, clawMachine(c, PL[i]), x, 0.4, d / 2 - SET + 1.0));
    for (let i = 0; i < 6; i++) { const gc = gacha([0xff6a9a, 0x4ac8f0, 0xffd84a, 0x7ad86a, 0xb08aff, 0xff9a4a][i]); gc.position.set(-w / 2 + 0.9 + (i % 3) * 0.55, 0.4 + Math.floor(i / 3) * 1.12, d / 2 - SET + 0.4); g.add(gc); }
    // 자동문 + 빨간 카펫 + 차단봉
    g.add(M(box(2.6, 2.7, 0.06, 0.01), glass(0xe8d8ff), 0, 1.75, fz + 0.06));
    g.add(M(box(0.06, 2.7, 0.08, 0.01), 0xd0d0d8, 0, 1.75, fz + 0.08));
    g.add(M(box(2.0, 0.02, SET + 1.6, 0.01), 0xc8283a, 0, 0.43, d / 2 - SET / 2 + 0.8));
    for (const x of [-1.3, 1.3]) for (const z of [d / 2 - 0.6, d / 2 + 0.9]) { g.add(M(cyl(0.05, 0.08, 0.9, 8), 0xd8b84a, x, 0.85, z)); g.add(M(sphere(0.07, 8, 6), 0xd8b84a, x, 1.32, z)); }
    for (const x of [-1.3, 1.3]) { const r = M(cyl(0.03, 0.03, 1.5, 6), 0xc8283a, x, 1.15, d / 2 + 0.15); r.rotation.x = PI / 2; g.add(r); }
    // 스티커 사진 부스 (동쪽 옆)
    at(g, purikura(), w / 2 + 1.25, 0.06, d / 2 - 2.0, -PI / 2);
    // 옥상: 대형 볼링핀 + 볼 + 파라펫 전구
    g.add(M(box(w + 0.2, 0.4, d + 0.2, 0.04), 0x1a1630, 0, TOP + 0.2, 0));
    const pin = bowlingPin(1.25); pin.position.set(w / 2 - 3.0, TOP + 0.4, -0.5); pin.rotation.z = 0.12; g.add(pin);
    const pin2 = bowlingPin(0.9); pin2.position.set(w / 2 - 1.6, TOP + 0.4, -1.4); pin2.rotation.z = -0.25; g.add(pin2);
    const ball = M(sphere(0.9, 20, 14), 0x2a4ad8, w / 2 - 4.8, TOP + 1.3, 0.2); g.add(ball);
    for (const [a, b2] of [[0.3, 0.4], [-0.1, 0.55], [0.15, 0.7]]) g.add(M(sphere(0.12, 8, 6), 0x0a0a1a, w / 2 - 4.8 + a, TOP + 1.3 + b2, 0.2 + 0.62));
    for (let i = 0; i < 20; i++) { const b = bulb(0xfff0b0, 0.06); b.position.set(-w / 2 + 0.3 + i * (w - 0.6) / 19, TOP + 0.48, d / 2 + 0.1); g.add(b); }
    const rs = sign('★ 24H LANES ★', 3.2, 0.7, '#ff4ab0', '#ffffff', '#ffffff'); rs.position.set(-w / 2 + 3.2, TOP + 1.1, d / 2 - 0.4); g.add(rs);
    for (const x of [-w / 2 + 1.8, -w / 2 + 4.6]) g.add(M(box(0.08, 1.0, 0.08, 0.01), 0x5a5a6a, x, TOP + 0.6, d / 2 - 0.45));
    return g;
  };

  // =========================================================
  // 🏥 메디컬 센터 — 도시 모퉁이 빌딩형 (이전 디자인 복원)
  // =========================================================
  const martWin = B3.martWin || hyperWin;
  function cityBlock(g, w, d, o) {
    const WH = o.white || 0xf6f4ee, BAND = o.band, gh = o.gh || 3.8, fh = o.fh || 3.3, floors = o.floors;
    const bandM = cm('cbBand' + BAND, () => { const m = new THREE.MeshPhongMaterial({ color: BAND, shininess: 110, specular: 0xcfffff, emissive: 0x000000 }); m.userData.nr = 0.55; m.userData.ng = 0.62; m.userData.nb = 0.5; nightMats.push(m); return m; });
    g.add(K.base(w, d, 0.4, 0xc8c4bc, 'stone'));
    g.add(tbox(w, gh, d, 'panel', o.ground || 0x2a2a2e, 0, 0.36, 0, 0.04, 1.2));
    g.add(M(box(w - 3, 2.5, 0.04, 0.01), o.groundWin || martWin(), 0, 1.75, d / 2 + 0.04));
    for (let i = 0; i <= 6; i++) g.add(M(box(0.08, 2.6, 0.08, 0.01), 0x8a8e94, -(w - 3) / 2 + i * (w - 3) / 6, 1.75, d / 2 + 0.08));
    for (let f = 0; f < floors; f++) {
      const y = 0.36 + gh + f * fh;
      g.add(tbox(w, fh, d, 'panel', WH, 0, y, 0, 0.04, 1.6));
      g.add(M(box(w + 0.06, 1.35, d + 0.06, 0.02), bandM, 0, y + 1.7, 0));
      for (let i = 0; i <= Math.round(w / 1.4); i++) g.add(M(box(0.1, 1.37, 0.1, 0.01), WH, -w / 2 + i * w / Math.round(w / 1.4), y + 1.7, d / 2 + 0.04));
      g.add(M(box(w + 0.3, 0.16, d + 0.3, 0.03), WH, 0, y + fh - 0.02, 0));
    }
    const top = 0.36 + gh + floors * fh;
    for (const s of o.corners || [1]) {
      const tw = new THREE.Group(); tw.position.set(s * (w / 2 - 0.4), 0, d / 2 - 0.4); g.add(tw);
      tw.add(M(geo('cbTw' + top, () => AC.scaleUV(new THREE.CylinderGeometry(1.9, 1.9, top + 1.0, 28), 6, 6)), tm('panel', WH), 0, (top + 1.0) / 2, 0));
      for (let f = 0; f < floors; f++) tw.add(M(geo('cbTwG', () => new THREE.CylinderGeometry(1.93, 1.93, 1.35, 28)), bandM, 0, 0.36 + gh + f * fh + 1.7, 0));
      tw.add(M(geo('cbTwB', () => new THREE.CylinderGeometry(1.93, 1.93, gh - 0.4, 28)), o.ground || 0x2a2a2e, 0, 0.36 + (gh - 0.4) / 2, 0));
      tw.add(M(geo('cbTwC', () => new THREE.CylinderGeometry(2.1, 2.1, 0.3, 28)), WH, 0, top + 1.1, 0));
    }
    g.add(M(box(w + 0.2, 0.7, 0.2, 0.03), WH, 0, top + 0.35, d / 2)); g.add(M(box(w + 0.2, 0.7, 0.2, 0.03), WH, 0, top + 0.35, -d / 2));
    for (const s of [-1, 1]) g.add(M(box(0.2, 0.7, d, 0.03), WH, s * w / 2, top + 0.35, 0));
    g.add(tbox(w + 2.4, 0.08, 2.6, 'tile', 0xd8d4cc, 0, 0.0, d / 2 + 1.5, 0.01, 1.2));
    g.add(M(box(w + 2.4, 0.2, 0.25, 0.02), 0xf2c83a, 0, 0.1, d / 2 + 2.8));
    return top;
  }
  BLD.hospital = (p) => {
    const g = new THREE.Group(); const { w, d, h } = p.bld;
    const floors = Math.max(3, Math.floor((h - 4) / 3.3));
    const top = cityBlock(g, w, d, { band: 0x6ac8b0, floors, corners: [-1, 1], ground: 0xe8f4f0, groundWin: martWin() });
    const cross = new THREE.Group(); cross.add(M(box(0.9, 2.6, 0.2, 0.05), glow(0xff3a3a))); cross.add(M(box(2.6, 0.9, 0.2, 0.05), glow(0xff3a3a))); cross.add(M(box(3.0, 3.0, 0.12, 0.05), 0xffffff, 0, 0, -0.1)); at(g, cross, 0, top - 2.0, d / 2 + 0.2);
    g.add(M(cyl(4.2, 4.2, 0.2, 32), 0x55595f, 0, top + 0.1, -1)); const hp = PM.sign('H', 2.6, 2.6, '#55595f', '#ffffff'); hp.rotation.x = -PI / 2; hp.position.set(0, top + 0.22, -1); g.add(hp);
    const can = new THREE.Group(); can.add(M(geo('hospCan3', () => new THREE.CylinderGeometry(3.2, 3.2, 0.3, 28, 1, false, -PI / 2, PI)), 0x8fe3c0, 0, 3.3, 0)); for (const x of [-2.7, 2.7]) can.add(M(cyl(0.12, 0.12, 3.1, 10), 0xffffff, x, 1.6, 2)); at(g, can, 0, 0, d / 2 + 0.3);
    const dr = K.door(2.6, 2.6, 0x8fe3c0, { frame: 0xffffff, lamp: false, matColor: 0x6ac8b0 }); dr.position.set(0, 0.36, d / 2 + 0.06); g.add(dr);
    const sg = PM.sign('🏥 메디컬 센터', 4.4, 0.6, '#ffffff', '#ff3a3a'); sg.position.set(-w / 4 - 0.6, 3.75, d / 2 + 0.08); g.add(sg);
    const ph = PM.sign('✚ 24시 약국', 3.0, 0.6, '#2e9a5a', '#ffffff'); ph.position.set(w / 4 + 0.6, 3.75, d / 2 + 0.08); g.add(ph);
    const amb = new THREE.Group(); amb.add(M(box(3.0, 1.5, 1.5, 0.15), 0xffffff, 0, 1.1, 0)); amb.add(M(box(0.9, 1.0, 1.48, 0.12), 0xffffff, 1.8, 0.85, 0)); amb.add(M(box(3.02, 0.25, 1.52, 0.02), 0xff3a3a, 0, 1.1, 0)); amb.add(M(box(0.3, 0.12, 0.3, 0.02), glow(0x3a8aff), 0.4, 1.9, 0)); for (const x of [-0.9, 1.5]) for (const z of [-0.7, 0.7]) { const wl = M(cyl(0.32, 0.32, 0.2, 12), 0x2a2a2a, x, 0.32, z); wl.rotation.x = PI / 2; amb.add(wl); } at(g, amb, w / 2 + 2.6, 0.06, d / 2 - 1.5, -PI / 2);
    return g;
  };
})();
