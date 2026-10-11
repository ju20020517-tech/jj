/* =========================================================
 *  가게 외관 리뉴얼 2 — 내부와 어울리는 진짜 건축물 같은 외관 + 디테일
 *   🎷 재즈바 "블루문" : 2층 붉은 벽돌 · 원목 아치 쇼윈도 · 전구 마퀴 캐노피 · 세로 JAZZ 블레이드 사인 · 레드카펫 & 금 차단봉 · 가스등 · 철제 발코니 · 옥상 물탱크 · 네온 색소폰
 *   🛒 "플래티넘 마켓 & 로즈 부티크" : 흰 벽돌 마켓 홀(초록 박공 · 줄무늬 차양 · 과일 가판 · 카트 · 칠판) + 핑크 사암 성 부티크(성가퀴 · 원뿔 탑 · 아치 쇼윈도 · 넝쿨 장미 · 발코니)
 *                           가운데 시계탑 유리 현관
 *   + 카페 테라스 · 초밥집 등롱 & 대나무 · 펍 홍등 & 포차 테이블 · 편의점 ATM & 자전거 · 오락실 가챠 & 네온 조이스틱 · 방송국 위성 안테나 & LED
 *     스카이라운지 레드카펫 캐노피 · 찻집 돌등 · 공방 장작 & 화분 · 도서관 벤치 & 가로등
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE;
  const H = ISLE.M.h, { mat, geo, sphere, box, cyl, mesh } = H;
  const AC = FM.AC, K = AC.K, PM = FM.PM, BLD = PM.BLD;
  const { tbox, tm } = AC;
  const glow = c => PM.glowMat(c), glass = c => PM.glassMat(c);
  const PI = Math.PI;
  const at = (g, o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
  const M = (geo2, m, x, y, z) => mesh(geo2, typeof m === 'number' ? mat(m) : m, x, y, z);
  const sign = (text, w, h, bg, fg, gl) => PM.sign(text, w, h, bg, fg, gl);
  const gold = new THREE.MeshPhongMaterial({ color: 0xd4a848, shininess: 70, specular: 0xfff0b0 });

  // ---------- 공용 소품 ----------
  // 전구 줄 (두 점 사이 늘어진 곡선)
  function stringLights(g, a, b, n = 12, sag = 0.5, c = 0xfff0b0) {
    for (let i = 0; i <= n; i++) { const t = i / n, x = a[0] + (b[0] - a[0]) * t, z = a[2] + (b[2] - a[2]) * t, y = a[1] + (b[1] - a[1]) * t - Math.sin(t * PI) * sag; g.add(M(sphere(0.07, 8, 6), glow(c), x, y, z)); if (i < n) { const t2 = (i + 0.5) / n; const w2 = M(cyl(0.01, 0.01, Math.hypot(b[0] - a[0], b[2] - a[2]) / n + 0.02, 4), 0x3a3a3a, a[0] + (b[0] - a[0]) * t2, a[1] + (b[1] - a[1]) * t2 - Math.sin(t2 * PI) * sag + 0.06, a[2] + (b[2] - a[2]) * t2); w2.rotation.z = PI / 2; w2.rotation.y = -Math.atan2(b[2] - a[2], b[0] - a[0]); g.add(w2); } }
  }
  function post(h = 2.6, c = 0x3a3a44) { const g = new THREE.Group(); g.add(M(cyl(0.06, 0.08, h, 8), c, 0, h / 2, 0)); return g; }
  function gasLamp(c = 0x1a1a1e, bulb = 0xffd890) { const g = new THREE.Group(); g.add(M(box(0.08, 0.5, 0.08, 0.02), c, 0, 0, -0.05)); g.add(M(box(0.06, 0.06, 0.4, 0.02), c, 0, 0.15, 0.15)); g.add(M(box(0.3, 0.42, 0.3, 0.03), glass(0xfff4d8), 0, -0.1, 0.35)); g.add(M(sphere(0.09, 10, 8), glow(bulb), 0, -0.1, 0.35)); const cap = M(geo('glcap', () => new THREE.ConeGeometry(0.25, 0.2, 4)), c, 0, 0.18, 0.35); cap.rotation.y = PI / 4; g.add(cap); return g; }
  function palm(pot = 0x3a2418) { const g = new THREE.Group(); g.add(M(cyl(0.32, 0.26, 0.55, 12), pot, 0, 0.28, 0)); g.add(M(cyl(0.05, 0.07, 1.6, 8), tm('bark', 0x8a6a40), 0, 1.3, 0)); for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; const l = M(sphere(0.5, 8, 6), tm('leaf', 0x4e9e44), Math.cos(a) * 0.45, 2.05 - (i % 2) * 0.15, Math.sin(a) * 0.45); l.scale.set(1.4, 0.12, 0.4); l.rotation.y = -a; l.rotation.z = 0.35; g.add(l); } return g; }
  function topiary(pot = 0xf4ece4, c = 0x4e9e44) { const g = new THREE.Group(); g.add(M(box(0.6, 0.55, 0.6, 0.05), pot, 0, 0.28, 0)); g.add(M(cyl(0.04, 0.05, 0.8, 6), 0x6a4a30, 0, 0.9, 0)); g.add(M(sphere(0.42, 14, 10), tm('leaf', c), 0, 1.45, 0)); return g; }
  function bench(c = 0x8a5a3b, leg = 0x2a2a2e) { const g = new THREE.Group(); for (let i = 0; i < 3; i++) g.add(M(box(1.6, 0.06, 0.12, 0.02), tm('plank', c), 0, 0.45, -0.15 + i * 0.15)); for (let i = 0; i < 2; i++) g.add(M(box(1.6, 0.12, 0.05, 0.02), tm('plank', c), 0, 0.7 + i * 0.16, -0.3)); for (const x of [-0.7, 0.7]) { g.add(M(box(0.06, 0.45, 0.4, 0.02), leg, x, 0.22, 0)); g.add(M(box(0.06, 0.5, 0.06, 0.02), leg, x, 0.7, -0.3)); } return g; }
  function cafeTable(umb = 0xff6f61, umb2 = 0xffffff) { const g = new THREE.Group(); g.add(M(cyl(0.45, 0.45, 0.05, 18), 0xfbfaf6, 0, 0.75, 0)); g.add(M(cyl(0.04, 0.05, 0.72, 8), 0x3a3a3a, 0, 0.37, 0)); g.add(M(cyl(0.02, 0.02, 2.2, 6), 0x9aa0a8, 0, 1.35, 0)); for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; const p2 = M(geo('umbP', () => new THREE.ConeGeometry(1.15, 0.5, 3, 1, true, 0, PI * 2 / 8 * 1.02)), new THREE.MeshLambertMaterial({ color: i % 2 ? umb : umb2, side: THREE.DoubleSide }), 0, 2.35, 0); p2.rotation.y = a; g.add(p2); } for (const a of [0, PI]) { const c = new THREE.Group(); c.position.set(Math.sin(a) * 0.75, 0, Math.cos(a) * 0.75); c.rotation.y = a + PI; c.add(M(box(0.42, 0.05, 0.42, 0.03), 0xfbfaf6, 0, 0.45, 0)); c.add(M(box(0.42, 0.4, 0.05, 0.03), 0xfbfaf6, 0, 0.68, -0.19)); for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) c.add(M(cyl(0.015, 0.015, 0.45, 5), 0x3a3a3a, x, 0.22, z)); g.add(c); } g.add(M(cyl(0.05, 0.04, 0.08, 8), 0xffffff, 0.1, 0.81, 0)); return g; }
  function crateStall(cols) { const g = new THREE.Group(); g.add(M(box(2.4, 0.08, 1.0, 0.02), tm('plank', 0xb88050), 0, 0.72, 0)); for (const x of [-1.1, 1.1]) for (const z of [-0.4, 0.4]) g.add(M(box(0.07, 0.72, 0.07, 0.02), 0x8a5a3b, x, 0.36, z)); cols.forEach((c, i) => { const x = -0.8 + i * 0.8; const cr = M(box(0.7, 0.22, 0.6, 0.02), tm('plank', 0xd8a868), x, 0.9, 0); cr.rotation.x = -0.25; g.add(cr); for (let j = 0; j < 9; j++) g.add(M(sphere(0.085, 8, 6), c, x - 0.22 + (j % 3) * 0.22, 1.02 + (j / 3 | 0) * 0.03, -0.15 + (j / 3 | 0) * 0.15)); }); return g; }
  function aFrame(text, bg = '#3a4a3a', fg = '#ffffff') { const g = new THREE.Group(); g.add(M(box(0.8, 1.0, 0.06, 0.02), 0x3a2418, 0, 0.6, 0.12)); const t = sign(text, 0.7, 0.8, bg, fg); t.position.set(0, 0.62, 0.16); g.add(t); for (const s of [-1, 1]) { const l = M(box(0.05, 1.2, 0.05, 0.02), 0x3a2418, s * 0.38, 0.55, 0); l.rotation.x = 0.2; g.add(l); const l2 = M(box(0.05, 1.2, 0.05, 0.02), 0x3a2418, s * 0.38, 0.55, -0.25); l2.rotation.x = -0.2; g.add(l2); } return g; }
  function bike(c = 0x4fc1e9) { const g = new THREE.Group(); for (const x of [-0.5, 0.5]) { const w2 = M(geo('bkW', () => new THREE.TorusGeometry(0.32, 0.03, 6, 20)), 0x2a2a2a, x, 0.34, 0); g.add(w2); } const fr = M(box(1.0, 0.05, 0.05, 0.02), c, 0, 0.55, 0); g.add(fr); const f2 = M(box(0.05, 0.5, 0.05, 0.02), c, -0.15, 0.6, 0); f2.rotation.z = 0.4; g.add(f2); g.add(M(box(0.25, 0.06, 0.12, 0.03), 0x2a2a2a, -0.25, 0.85, 0)); g.add(M(box(0.05, 0.05, 0.45, 0.02), 0x2a2a2a, 0.45, 0.9, 0)); g.add(M(box(0.3, 0.2, 0.28, 0.03), tm('plank', 0xc8a070), 0.62, 0.72, 0)); return g; }
  function neonPlane(key, w, h, draw) { const t = PM.ctex('nx' + key, 256, Math.round(256 * h / w), draw); const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }); const o = M(geo('np' + w + ',' + h, () => new THREE.PlaneGeometry(w, h)), m, 0, 0, 0); o.userData.noBake = true; return o; }

  // =========================================================
  // 🎷 재즈바 "블루문"
  // =========================================================
  BLD.club = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld, h = 7.2, DK = 0x2a1a10;
    const body0 = new THREE.Group(); g.add(body0);
    body0.add(K.base(w, d, 0.45, 0x5a5058, 'stone'));
    body0.add(tbox(w, h, d, 'brick', 0x9a4230, 0, 0.4, 0, 0.1, 1));
    for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) body0.add(tbox(0.4, h, 0.4, 'brick', 0x7a3222, x, 0.4, z, 0.06, 1));
    body0.add(M(box(w + 0.3, 0.28, d + 0.3, 0.05), DK, 0, 3.9, 0));
    at(g, K.cornice(w, d, 0x3a2418), 0, h + 0.4, 0);
    // 1층 원목 쇼프론트 + 아치 쇼윈도 (따뜻한 실내 불빛)
    g.add(tbox(w - 0.9, 3.3, 0.18, 'plank', DK, 0, 0.4, d / 2 + 0.08, 0.04, 1));
    for (const x of [-2.9, 2.9]) { const win = K.window(2.1, 2.1, { arch: true, box: false, frame: 0x3a2418, curtain: '#ffa860' }); at(g, win, x, 1.95, d / 2 + 0.2); g.add(M(box(2.2, 0.12, 0.3, 0.03), 0xc8a040, x, 0.85, d / 2 + 0.28)); }
    const dr = K.door(1.7, 2.6, 0x3a1a10, { frame: 0xc8a040, arch: true, lamp: false, matColor: 0x9a1a2a }); dr.position.set(0, 0.42, d / 2 + 0.2); g.add(dr);
    // 전구 마퀴 캐노피 + 간판
    const can = new THREE.Group(); can.position.set(0, 3.35, d / 2 + 0.2); g.add(can);
    can.add(M(box(4.6, 0.4, 1.8, 0.05), DK, 0, 0, 0.9)); can.add(M(box(4.7, 0.08, 1.9, 0.02), 0xc8a040, 0, -0.22, 0.9));
    for (let i = 0; i < 16; i++) can.add(M(sphere(0.07, 8, 6), glow(0xfff0b0), -2.2 + i * 0.293, -0.05, 1.82));
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) can.add(M(sphere(0.07, 8, 6), glow(0xfff0b0), s * 2.32, -0.05, 0.1 + i * 0.33));
    const ms = sign('🌙 BLUE MOON · LIVE JAZZ TONIGHT', 4.3, 0.34, '#1a0c08', '#ffd890', '#ffb060'); ms.position.set(0, 0, 1.815); can.add(ms);
    for (const s of [-1, 1]) { const ch = M(cyl(0.015, 0.015, 1.4, 4), 0x2a2a2a, s * 2.0, 0.6, 0.9); ch.rotation.x = -0.9; can.add(ch); }
    // 레드카펫 & 금 차단봉
    g.add(M(box(1.7, 0.03, 3.0, 0.01), 0x9a1a2a, 0, 0.44, d / 2 + 1.9));
    for (const s of [-1, 1]) { for (let i = 0; i < 3; i++) { const z = d / 2 + 0.9 + i * 1.0; g.add(M(cyl(0.05, 0.05, 0.95, 8), gold, s * 1.15, 0.9, z)); g.add(M(sphere(0.08, 10, 8), gold, s * 1.15, 1.4, z)); g.add(M(cyl(0.16, 0.18, 0.05, 12), gold, s * 1.15, 0.44, z)); if (i < 2) { const r = M(geo('rope', () => new THREE.TorusGeometry(0.5, 0.035, 6, 14, PI)), 0x9a1a2a, s * 1.15, 1.3, z + 0.5); r.rotation.set(0, PI / 2, PI); g.add(r); } } }
    // 가스등 · 포스터 액자
    for (const s of [-1, 1]) at(g, gasLamp(), s * 1.35, 2.8, d / 2 + 0.2);
    for (const s of [-1, 1]) { const pf = new THREE.Group(); pf.add(M(box(0.9, 1.3, 0.08, 0.02), 0xc8a040, 0, 0, 0)); const ps = sign(s < 0 ? '🎷 JAZZ NIGHT\n매일 밤 8시' : '🎹 PIANO & BAR\n칵테일 · 디너', 0.8, 1.15, '#3a1a4a', '#ffd890'); ps.position.z = 0.05; pf.add(ps); at(g, pf, s * (w / 2 + 0.07), 1.9, d / 2 - 1.4, s * PI / 2); }
    // 2층 창 & 철제 발코니
    for (const x of [-3.0, 0, 3.0]) { const win = K.window(1.1, 1.7, { box: false, frame: 0xf4e8d0, curtain: '#ff9a6a' }); at(g, win, x, 5.6, d / 2 + 0.02); g.add(M(box(1.5, 0.2, 0.2, 0.04), 0xf4e8d0, x, 6.6, d / 2 + 0.1)); at(g, K.balcony(1.6, 0.55, 0x1a1a1a, { floorKind: 'metal', floorColor: 0x2a2a2e }), x, 4.55, d / 2 + 0.02); }
    for (const z of [-1.8, 1.2]) { const win = K.window(1.0, 1.5, { box: false, frame: 0xf4e8d0, curtain: '#ff9a6a' }); at(g, win, -w / 2 - 0.02, 5.6, z, -PI / 2); at(g, K.window(1.0, 1.5, { box: false, frame: 0xf4e8d0, curtain: '#ff9a6a' }), w / 2 + 0.02, 5.6, z, PI / 2); }
    // 세로 블레이드 사인 "JAZZ"
    const bl = new THREE.Group(); bl.position.set(w / 2 - 0.35, 4.3, d / 2 + 0.7); g.add(bl);
    bl.add(M(box(0.2, 0.2, 0.9, 0.03), 0x2a2a2a, 0, 1.8, -0.4)); bl.add(M(box(0.2, 0.2, 0.9, 0.03), 0x2a2a2a, 0, -0.1, -0.4));
    bl.add(M(box(0.3, 3.6, 0.9, 0.05), DK, 0, 1.0, 0.1));
    'JAZZ'.split('').forEach((ch, i) => { for (const s of [-1, 1]) { const t = sign(ch, 0.7, 0.7, '#1a0c08', '#ffd060', '#ff9a30'); t.position.set(s * 0.16, 2.35 - i * 0.82, 0.1); t.rotation.y = s * PI / 2; bl.add(t); } });
    for (let i = 0; i < 11; i++) for (const s of [-1, 1]) bl.add(M(sphere(0.05, 6, 5), glow(0xfff0b0), s * 0.16, -0.7 + i * 0.35, 0.58));
    // 옆벽 네온 색소폰
    const sax = neonPlane('sax', 2.2, 2.2, (c, W, H2) => { c.lineCap = 'round'; c.lineJoin = 'round'; const draw = () => { c.moveTo(150, 30); c.lineTo(150, 170); c.quadraticCurveTo(150, 215, 110, 215); c.quadraticCurveTo(75, 215, 75, 185); c.lineTo(75, 170); c.moveTo(150, 30); c.lineTo(185, 15); for (let i = 0; i < 5; i++) { c.moveTo(142, 60 + i * 22); c.arc(142, 60 + i * 22, 5, 0, 7); } }; for (const [lw, col, bl2] of [[14, 'rgba(90,160,255,0.35)', 22], [6, '#5ab0ff', 12], [2, '#e0f0ff', 3]]) { c.shadowColor = col; c.shadowBlur = bl2; c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); draw(); c.stroke(); } c.font = 'italic bold 30px serif'; c.shadowColor = '#ff6ab8'; c.shadowBlur = 12; c.fillStyle = '#ffd0ec'; c.fillText('Blue Moon', 20, 250); });
    sax.position.set(-w / 2 - 0.06, 4.8, 0.5); sax.rotation.y = -PI / 2; g.add(sax);
    // 옥상 물탱크 & 실외기
    const wt = new THREE.Group(); wt.position.set(-2.4, h + 0.9, -1.4); g.add(wt); for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) wt.add(M(cyl(0.05, 0.05, 1.4, 6), 0x3a3a3a, x, 0.7, z)); wt.add(M(cyl(0.9, 0.9, 1.5, 16), tm('plank', 0x8a6a4a), 0, 2.0, 0)); wt.add(M(geo('wtR', () => new THREE.ConeGeometry(1.0, 0.7, 16)), 0x3a3a3a, 0, 3.1, 0));
    g.add(tbox(1.4, 0.9, 1.0, 'metal', 0xc8ccd4, 2.4, h + 0.4, -1.8, 0.05, 1));
    // 화분 야자 · 벤치
    for (const s of [-1, 1]) at(g, palm(), s * (w / 2 - 0.5), 0.4, d / 2 + 0.9);
    at(g, aFrame('🎺 오늘의 공연\n20:00 재즈 트리오', '#2a1a3a', '#ffd890'), 2.9, 0.42, d / 2 + 1.9, -0.3);
    at(g, bench(0x6a4028), -3.2, 0.42, d / 2 + 1.7, 0);
    return g;
  };

  // =========================================================
  // 🛒 플래티넘 마켓 & 🌹 로즈 부티크
  // =========================================================
  BLD.mall = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld, GR = 0x2e6a50, CRE = 0xfbf6ec;
    g.add(K.base(w, d, 0.5, 0xe8e0d4, 'stone'));
    // --- 왼쪽: 흰 벽돌 마켓 홀 ---
    const L = new THREE.Group(); L.position.x = -w / 4 - 0.1; g.add(L); const lw = w / 2 - 0.4, lh = 5.0;
    L.add(tbox(lw, lh, d, 'brick', 0xf4efe6, 0, 0.4, 0, 0.1, 1)); for (const x of [-lw / 2, lw / 2]) L.add(M(box(0.34, lh, d + 0.1, 0.08), GR, x, 0.4 + lh / 2, 0));
    const rf = K.gable(lw, d, 2.6, 0x3a8a60, { wallKind: 'siding', wallColor: CRE }); rf.position.y = lh + 0.4; L.add(rf);
    for (const x of [-2.4, 1.4]) { at(L, K.window(2.6, 2.0, { box: false, frame: GR, curtain: '#fff0c8' }), x, 1.95, d / 2 + 0.02); }
    for (const x of [-2.6, 0, 2.6]) at(L, K.window(1.0, 1.0, { shutters: GR, curtain: '#ffe0a0' }), x, 4.3, d / 2 + 0.02);
    const aw = K.awning(lw - 0.6, 1.8, GR, CRE); aw.position.set(0, 3.3, d / 2 + 0.1); L.add(aw);
    const ms = sign('🥕 MARKET · 식자재 마켓', 4.6, 0.8, '#2e6a50', '#fbf6ec'); ms.position.set(-0.5, 5.25, d / 2 + 0.25); L.add(ms);
    at(L, crateStall([0xd83a2a, 0x8ac04a, 0xf08a2a]), -2.2, 0.45, d / 2 + 1.3);
    at(L, crateStall([0xe8c040, 0xc82a3a, 0x6a3a8a]), 0.6, 0.45, d / 2 + 1.6, 0.15);
    at(L, aFrame('오늘의 특가 🍅\n토마토 · 딸기', '#2a3a2a', '#ffffff'), 2.9, 0.45, d / 2 + 1.2, -0.4);
    for (const x of [-3.4, -1.0, 1.4]) { const lp = new THREE.Group(); lp.add(M(cyl(0.01, 0.01, 0.4, 4), 0x2a2a2a, 0, 0.2, 0)); lp.add(M(geo('mkP', () => new THREE.ConeGeometry(0.22, 0.2, 14, 1, true)), new THREE.MeshLambertMaterial({ color: 0xe8703a, side: THREE.DoubleSide }), 0, 0, 0)); lp.add(M(sphere(0.07, 8, 6), glow(0xfff0c0), 0, -0.06, 0)); at(L, lp, x, 2.85, d / 2 + 1.2); }
    at(L, bike(0x2e6a50), -3.9, 0.45, d / 2 + 2.4, 0.3);
    // --- 오른쪽: 핑크 사암 성 부티크 ---
    const R = new THREE.Group(); R.position.x = w / 4 + 0.1; g.add(R); const rw = w / 2 - 0.4, rh = 5.4, PK = 0xf0c0aa;
    R.add(tbox(rw, rh, d, 'ashlar', PK, 0, 0.4, 0, 0.1, 1.4));
    for (let x = -rw / 2 + 0.3; x <= rw / 2; x += 0.9) R.add(tbox(0.5, 0.55, 0.5, 'ashlar', PK, x, rh + 0.4, d / 2 - 0.25, 0.04, 1.4));
    for (let z = -d / 2 + 0.3; z <= d / 2; z += 0.9) R.add(tbox(0.5, 0.55, 0.5, 'ashlar', PK, rw / 2 - 0.25, rh + 0.4, z, 0.04, 1.4));
    R.add(M(box(rw + 0.2, 0.2, d + 0.2, 0.05), 0xfbeee4, 0, rh + 0.35, 0));
    for (const x of [-2.2, 1.9]) { at(R, K.window(1.9, 2.2, { arch: true, box: false, frame: 0xfbf0e8, curtain: '#ffc8d8' }), x, 1.95, d / 2 + 0.02); const a2 = K.awning(2.2, 1.0, 0xf4a8b8, 0xfbf6f0); a2.position.set(x, 3.55, d / 2 + 0.1); R.add(a2); }
    // 쇼윈도 속 드레스 마네킹
    for (const x of [-2.2, 1.9]) { const dress = new THREE.Group(); dress.add(M(geo('bdC', () => new THREE.ConeGeometry(0.35, 0.9, 14)), 0xf0a0b0, 0, 0.55, 0)); dress.add(M(sphere(0.18, 10, 8), 0xf0a0b0, 0, 1.1, 0)); dress.add(M(cyl(0.02, 0.02, 0.4, 4), 0x3a3a3a, 0, 0.2, 0)); at(R, dress, x + 0.35, 0.7, d / 2 - 0.25); }
    const bs = sign('🌹 Rose Boutique', 3.8, 0.9, '#fbf0f0', '#c8607a'); bs.position.set(0, 4.6, d / 2 + 0.25); R.add(bs); R.add(M(box(4.1, 1.1, 0.1, 0.04), gold, 0, 4.6, d / 2 + 0.18));
    at(R, K.balcony(2.8, 0.6, 0xfbf0e8, { floorKind: 'stone', floorColor: 0xf4e4dc }), -0.2, 3.9, d / 2 + 0.02);
    // 원뿔 탑 (오른쪽 앞 모서리)
    const tw = new THREE.Group(); tw.position.set(rw / 2 - 0.2, 0.4, d / 2 - 0.4); R.add(tw);
    tw.add(M(geo('bTw', () => AC.scaleUV(new THREE.CylinderGeometry(1.2, 1.3, 7.2, 20), 6, 5)), tm('ashlar', PK), 0, 3.6, 0));
    for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; tw.add(tbox(0.4, 0.45, 0.4, 'ashlar', PK, Math.cos(a) * 1.15, 7.2, Math.sin(a) * 1.15, 0.03, 1.4)); }
    const cone = K.cone(1.55, 2.6, 0xd87a90, 'shingle', 20); cone.position.y = 8.9; tw.add(cone); tw.add(M(cyl(0.03, 0.03, 1.0, 4), 0x9a8a70, 0, 10.6, 0)); const flag = M(box(0.6, 0.35, 0.02, 0.01), 0xff6f86, 0.3, 10.9, 0); tw.add(flag);
    for (const y of [2.4, 5.0]) at(tw, K.window(0.6, 1.1, { arch: true, box: false, frame: 0xfbf0e8, curtain: '#ffd0dc' }), 0, y, 1.28);
    for (const x of [-rw / 2 + 0.3, 0.6]) at(R, K.vines(4.8, 1.2, 0xff8fb1), x, 0.4, d / 2 + 0.04);
    for (const x of [-3.4, 3.2]) at(R, topiary(0xfbf0e8, 0x4e9e44), x, 0.45, d / 2 + 1.1);
    at(R, bench(0xf4c8d0, 0xfbf0e8), 0.9, 0.45, d / 2 + 1.8, 0);
    // --- 가운데: 시계탑 유리 현관 ---
    const C = new THREE.Group(); C.position.set(0, 0, d / 2 - 0.6); g.add(C);
    C.add(tbox(3.4, 6.6, 1.8, 'stucco', CRE, 0, 0.4, 0, 0.08, 1));
    const cr = K.gable(3.4, 1.8, 1.2, 0x3a8a60, { wallKind: 'stucco', wallColor: CRE, gableWindow: false }); cr.rotation.y = PI / 2; cr.position.y = 7.0; C.add(cr);
    C.add(M(cyl(0.7, 0.7, 0.12, 24), 0xfbf6ec, 0, 5.8, 0.95)).rotation.x = PI / 2; const face = sign('🕐', 1.1, 1.1, '#fbf6ec', '#2e3a2e'); face.position.set(0, 5.8, 1.02); C.add(face); C.add(M(geo('ckR', () => new THREE.TorusGeometry(0.7, 0.06, 8, 24)), gold, 0, 5.8, 1.0));
    const cd = K.door(2.2, 2.9, GR, { frame: 0xd4a848, arch: true, lamp: false, matColor: 0x2e6a50 }); cd.position.set(0, 0.42, 0.93); C.add(cd);
    const ts = sign('PLATINUM MARKET', 3.0, 0.5, '#2e6a50', '#fbf6ec'); ts.position.set(0, 4.15, 0.95); C.add(ts);
    for (const s of [-1, 1]) { at(C, gasLamp(0x2e6a50), s * 1.45, 2.8, 0.9); at(C, K.planter(0xd8d0c4, 0xff8fb1), s * 1.3, 0.4, 1.6); }
    return g;
  };

  // =========================================================
  // 다른 가게 외관 디테일 (기존 건물 위에 덧붙임)
  // =========================================================
  const EXTRA = {
    cafe: (g, p) => { const { w, d } = p.bld; for (const s of [-1, 1]) at(g, post(2.9, 0x3a3a3a), s * (w / 2 + 0.2), 0.4, d / 2 + 3.6); stringLights(g, [-w / 2 - 0.2, 3.3, d / 2 + 3.6], [w / 2 + 0.2, 3.3, d / 2 + 3.6], 16, 0.4); stringLights(g, [-w / 2 - 0.2, 3.3, d / 2 + 3.6], [-w / 2 + 0.3, 3.6, d / 2 + 0.2], 6, 0.25); stringLights(g, [w / 2 + 0.2, 3.3, d / 2 + 3.6], [w / 2 - 0.3, 3.6, d / 2 + 0.2], 6, 0.25); at(g, bike(0xff8fb1), w / 2 + 0.9, 0.4, d / 2 - 0.5, PI / 2); for (const x of [-w / 2 + 0.4, w / 2 - 0.4]) at(g, K.basket(0xff6f86), x, 3.2, d / 2 + 0.3); },
    restaurant: (g, p) => {
      const { w, d } = p.bld, red = p.id === 'pub';
      if (!red) {
        // 초밥집: 대나무 울타리 · 돌등롱 · 붉은 평상 & 우산 · 물고기 깃발
        for (const s of [-1, 1]) { for (let i = 0; i < 10; i++) g.add(M(cyl(0.05, 0.05, 1.5 + (i % 3) * 0.1, 6), 0x8fbf5a, s * (w / 2 + 0.4), 1.15, -d / 2 + 0.6 + i * (d - 1.2) / 9)); g.add(M(box(0.08, 0.06, d - 1, 0.02), 0x6a8a3a, s * (w / 2 + 0.4), 1.5, 0)); }
        const tr = new THREE.Group(); tr.add(M(box(0.5, 0.12, 0.5, 0.03), 0xb8b0a4, 0, 0.06, 0)); tr.add(M(cyl(0.1, 0.12, 0.6, 8), 0xb8b0a4, 0, 0.4, 0)); tr.add(M(box(0.45, 0.35, 0.45, 0.04), 0xb8b0a4, 0, 0.88, 0)); tr.add(M(box(0.3, 0.2, 0.46, 0.01), glow(0xffe0a0), 0, 0.88, 0)); tr.add(M(geo('trR', () => new THREE.ConeGeometry(0.5, 0.35, 4)), 0xa8a094, 0, 1.25, 0)).rotation.y = PI / 4; at(g, tr, -w / 2 - 1.2, 0.4, d / 2 + 1.2);
        const bench2 = new THREE.Group(); bench2.add(M(box(1.6, 0.08, 0.7, 0.02), 0xc0392b, 0, 0.5, 0)); for (const x of [-0.7, 0.7]) bench2.add(M(box(0.08, 0.5, 0.6, 0.02), 0x5a3a28, x, 0.25, 0)); bench2.add(M(cyl(0.02, 0.02, 2.3, 6), 0x5a3a28, 0.5, 1.2, 0.1)); const um = M(geo('wagasa', () => new THREE.ConeGeometry(1.2, 0.45, 16, 1, true)), new THREE.MeshLambertMaterial({ color: 0xd8403a, side: THREE.DoubleSide }), 0.5, 2.35, 0.1); bench2.add(um); at(g, bench2, w / 2 + 1.6, 0.4, d / 2 + 1.4, -0.3);
        const fl = new THREE.Group(); fl.add(M(cyl(0.04, 0.04, 3.4, 6), 0x5a3a28, 0, 1.7, 0)); for (let i = 0; i < 2; i++) { const f2 = M(geo('koi', () => new THREE.CylinderGeometry(0.22, 0.05, 1.3, 10, 1, true)), new THREE.MeshLambertMaterial({ color: i ? 0x3a6ab8 : 0xd83a3a, side: THREE.DoubleSide }), 0.7, 3.0 - i * 0.6, 0); f2.rotation.z = PI / 2; fl.add(f2); } at(g, fl, -w / 2 - 0.6, 0.4, d / 2 + 2.4);
      } else {
        // 펍: 홍등 줄 · 포차 테이블 · 네온 酒
        for (const s of [-1, 1]) at(g, post(3.0, 0xc0392b), s * (w / 2 + 0.3), 0.4, d / 2 + 3.4);
        for (let i = 0; i <= 8; i++) { const t = i / 8, x = -w / 2 - 0.3 + (w + 0.6) * t, y = 3.2 - Math.sin(t * PI) * 0.45; const l = M(sphere(0.2, 10, 8), glow(0xff3a2a), x, y, d / 2 + 3.4); l.scale.y = 1.3; g.add(l); g.add(M(cyl(0.21, 0.21, 0.05, 10), 0xffd23a, x, y + 0.26, d / 2 + 3.4)); }
        for (const x of [-2.4, 2.4]) { const t2 = new THREE.Group(); t2.add(M(cyl(0.5, 0.5, 0.05, 16), 0xd8453a, 0, 0.7, 0)); t2.add(M(cyl(0.05, 0.05, 0.7, 6), 0x3a3a3a, 0, 0.35, 0)); for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2; t2.add(M(cyl(0.18, 0.16, 0.42, 10), 0x3a8ad8, Math.cos(a) * 0.8, 0.21, Math.sin(a) * 0.8)); } t2.add(M(cyl(0.2, 0.2, 0.1, 14), 0x9aa0a8, 0, 0.77, 0)); t2.add(M(cyl(0.04, 0.045, 0.2, 8), glass(0x3a8a3a), 0.25, 0.82, 0.1)); at(g, t2, x, 0.4, d / 2 + 2.0); }
        const nz = neonPlane('sake', 1.0, 1.0, (c) => { c.font = 'bold 170px serif'; c.textAlign = 'center'; c.shadowColor = '#ff3a5a'; c.shadowBlur = 20; c.fillStyle = '#ffd0d8'; c.fillText('酒', 128, 190); }); nz.position.set(w / 2 + 0.06, 2.6, d / 2 - 1.2); nz.rotation.y = PI / 2; g.add(nz);
      }
    },
    shop: (g, p) => { const { w, d, h } = p.bld; const atm = new THREE.Group(); atm.add(M(box(0.8, 1.8, 0.6, 0.04), 0x9aa0a8, 0, 0.9, 0)); atm.add(M(box(0.5, 0.35, 0.02, 0.01), glow(0x5aa0ff), 0, 1.35, 0.31)); atm.add(sign('ATM', 0.6, 0.2, '#1a3a8a', '#ffffff')); atm.children[2].position.set(0, 1.7, 0.31); at(g, atm, -w / 2 - 0.7, 0.4, d / 2 - 0.6);
      for (let i = 0; i < 3; i++) at(g, bike([0x4fc1e9, 0xffd84a, 0xff6f61][i]), -w / 2 + 0.8 + i * 0.7, 0.4, d / 2 + 2.2, PI / 2); g.add(M(box(2.4, 0.06, 0.06, 0.02), 0x9aa0a8, -w / 2 + 1.5, 0.9, d / 2 + 1.7));
      for (const [x, c] of [[w / 2 + 0.5, 0x3a8a5a], [w / 2 + 1.1, 0x3a6ab8]]) { g.add(M(box(0.5, 0.9, 0.5, 0.05), c, x, 0.85, d / 2 + 0.6)); g.add(M(box(0.52, 0.06, 0.52, 0.02), 0x2a2a2a, x, 1.32, d / 2 + 0.6)); }
      const py = new THREE.Group(); py.add(M(box(0.2, 4.6, 0.2, 0.03), 0x9aa0a8, 0, 2.3, 0)); py.add(M(box(1.6, 1.2, 0.3, 0.06), 0xffffff, 0, 4.4, 0)); const ps2 = sign('🏪 24H', 1.4, 1.0, '#3a9a6a', '#ffffff'); ps2.position.set(0, 4.4, 0.16); py.add(ps2); at(g, py, w / 2 + 1.8, 0.4, d / 2 + 2.2);
      const ic = new THREE.Group(); ic.add(M(box(1.2, 0.8, 0.6, 0.05), 0xffffff, 0, 0.4, 0)); ic.add(sign('ICE 🧊', 1.0, 0.3, '#4fc1e9', '#ffffff')); ic.children[1].position.set(0, 0.5, 0.31); at(g, ic, 1.2, 0.4, d / 2 + 0.7); void h; },
    arcade: (g, p) => { const { w, d } = p.bld; for (let i = 0; i < 4; i++) { const gc = new THREE.Group(); const c = [0xff6f86, 0x4fc1e9, 0xffd84a, 0x8ee07a][i]; gc.add(M(box(0.6, 0.8, 0.5, 0.05), c, 0, 0.4, 0)); gc.add(M(box(0.55, 0.55, 0.45, 0.05), glass(0xe8f8ff), 0, 1.08, 0)); for (let j = 0; j < 6; j++) gc.add(M(sphere(0.08, 8, 6), [0xff6f86, 0xffd84a, 0x4fc1e9, 0xffffff][j % 4], -0.15 + (j % 3) * 0.15, 0.95 + (j / 3 | 0) * 0.14, 0)); gc.add(M(cyl(0.06, 0.06, 0.05, 10), 0xc8ccd4, 0.15, 0.6, 0.26)).rotation.x = PI / 2; at(g, gc, -w / 2 + 1.0 + i * 0.75, 0.4, d / 2 + 0.6); }
      const js = new THREE.Group(); js.add(M(box(2.6, 0.5, 1.8, 0.1), 0x2a1a4a, 0, 0.25, 0)); js.add(M(cyl(0.12, 0.12, 2.0, 10), 0x2a2a2a, -0.5, 1.4, 0)); js.add(M(sphere(0.5, 16, 12), glow(0xff3a5a), -0.5, 2.5, 0)); for (const [x, c] of [[0.5, 0x39ffb0], [1.0, 0xffd84a]]) js.add(M(cyl(0.26, 0.26, 0.2, 14), glow(c), x, 0.6, 0)); at(g, js, w / 2 - 2.2, 8.0, 0);
      for (let i = 0; i < 7; i++) g.add(M(box(0.9, 0.9, 0.05, 0.02), glow([0xff3a9a, 0x39ffb0, 0xffd84a, 0x4fc1e9][i % 4]), -w / 2 + 1.2 + i * ((w - 2.4) / 6), 4.7, d / 2 + 0.06)); },
    studio: (g, p) => { const { w, d, h } = p.bld; const top = h + 0.4; for (const [x, r] of [[-w / 2 + 1.5, 1.1], [w / 2 - 2.0, 0.8]]) { const dish = new THREE.Group(); dish.add(M(cyl(0.08, 0.1, 0.9, 8), 0x9aa0a8, 0, 0.45, 0)); const sd = M(geo('dish' + r, () => new THREE.SphereGeometry(r, 18, 8, 0, PI * 2, 0, PI / 3)), new THREE.MeshLambertMaterial({ color: 0xf4f6f8, side: THREE.DoubleSide }), 0, 1.2, 0); sd.rotation.x = -2.1; dish.add(sd); dish.add(M(cyl(0.02, 0.02, r * 0.9, 4), 0x3a3a3a, 0, 1.2 + r * 0.25, r * 0.3)).rotation.x = -0.6; at(g, dish, x, top, -0.8, 0.4); }
      const tower = new THREE.Group(); for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2 + PI / 4; const l = M(cyl(0.04, 0.05, 6, 6), 0xd83a3a, Math.cos(a) * 0.4, 3.0, Math.sin(a) * 0.4); l.rotation.set(Math.sin(a) * 0.06, 0, -Math.cos(a) * 0.06); tower.add(l); } for (let i = 0; i < 6; i++) tower.add(M(box(0.9 - i * 0.1, 0.05, 0.9 - i * 0.1, 0.01), i % 2 ? 0xffffff : 0xd83a3a, 0, 0.8 + i * 0.95, 0)); tower.add(M(sphere(0.12, 10, 8), glow(0xff3a3a), 0, 6.2, 0)); at(g, tower, w / 2 - 1.2, top, d / 2 - 1.8);
      const oa = sign('● ON AIR', 2.0, 0.5, '#ff2a3a', '#ffffff', '#ff5a5a'); oa.position.set(-w / 2 + 1.8, 3.4, d / 2 + 0.12); g.add(oa);
      const van = new THREE.Group(); van.add(M(box(3.2, 1.6, 1.6, 0.2), 0xfbfbf8, 0, 1.2, 0)); van.add(M(box(1.0, 1.1, 1.58, 0.15), 0xfbfbf8, 1.9, 0.95, 0)); van.add(M(box(0.05, 0.6, 1.4, 0.02), glass(0x9ac8f0), 2.42, 1.2, 0)); for (const x of [-1.0, 1.6]) for (const z of [-0.8, 0.8]) van.add(M(cyl(0.34, 0.34, 0.25, 14), 0x2a2a2a, x, 0.36, z)).rotation.x = PI / 2; van.add(M(box(3.22, 0.3, 1.62, 0.02), 0xff3a6a, 0, 1.4, 0)); const vs = sign('찐구모아 NEWS 중계차', 2.6, 0.4, '#ffffff', '#1a2a5a'); vs.position.set(0, 1.0, 0.82); van.add(vs); van.add(M(cyl(0.05, 0.05, 0.6, 6), 0x9aa0a8, -0.6, 2.3, 0)); const vd = M(geo('vdish', () => new THREE.SphereGeometry(0.5, 14, 6, 0, PI * 2, 0, PI / 3)), new THREE.MeshLambertMaterial({ color: 0xf4f6f8, side: THREE.DoubleSide }), -0.6, 2.7, 0); vd.rotation.x = -2.0; van.add(vd); at(g, van, w / 2 + 2.6, 0.2, d / 2 + 0.4, -PI / 2);
      for (const s of [-1, 1]) { const sp = new THREE.Group(); sp.add(M(cyl(0.04, 0.06, 1.8, 6), 0x2a2a2e, 0, 0.9, 0)); const hd = M(cyl(0.2, 0.26, 0.4, 12), 0x2a2a2e, 0, 1.9, 0.1); hd.rotation.x = -0.9; sp.add(hd); sp.add(M(cyl(0.18, 0.18, 0.02, 12), glow(0xfff4e0), 0, 2.02, 0.28)).rotation.x = -0.9; at(g, sp, s * (w / 2 - 0.3), 0.4, d / 2 + 1.4, s * 0.4); } },
    skyscraper: (g, p) => { const { w, d } = p.bld; const can = new THREE.Group(); can.add(M(box(4.4, 0.25, 3.0, 0.05), 0x1a1a2a, 0, 3.2, 1.5)); can.add(M(box(4.5, 0.06, 3.1, 0.02), gold, 0, 3.05, 1.5)); for (const x of [-2.0, 2.0]) can.add(M(cyl(0.08, 0.08, 2.8, 8), gold, x, 1.6, 2.8)); for (let i = 0; i < 14; i++) can.add(M(sphere(0.06, 6, 5), glow(0xfff0c8), -2.1 + i * 0.32, 3.0, 3.0)); can.add(M(box(1.8, 0.03, 4.0, 0.01), 0x9a1a2a, 0, 0.44, 2.2)); for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { can.add(M(cyl(0.04, 0.04, 0.9, 6), gold, s * 1.1, 0.9, 1.0 + i * 1.2)); can.add(M(sphere(0.07, 8, 6), gold, s * 1.1, 1.38, 1.0 + i * 1.2)); } const nb = sign('NEBULA · 80F FINE DINING', 4.0, 0.3, '#1a1a2a', '#e8d4ff', '#b48cff'); nb.position.set(0, 3.2, 3.02); can.add(nb); at(g, can, 0, 0, d / 2); for (const s of [-1, 1]) at(g, topiary(0x2a2a3a, 0x3a7a3a), s * 2.8, 0.4, d / 2 + 1.0); },
    teahouse: (g, p) => { const { w, d } = p.bld; for (const s of [-1, 1]) { for (let i = 0; i < 6; i++) g.add(M(cyl(0.12, 0.12, 0.04, 10), 0xb8b0a4, s * 0.6 + (i % 2) * 0.1 * s, 0.42, d / 2 + 1.2 + i * 0.55)); } const bb = new THREE.Group(); for (let i = 0; i < 12; i++) bb.add(M(cyl(0.04, 0.04, 2.2 + (i % 4) * 0.3, 6), 0x7ab04a, (i % 4) * 0.2 - 0.3, 1.2, (i / 4 | 0) * 0.2)); for (let i = 0; i < 10; i++) bb.add(M(sphere(0.25, 8, 6), tm('leaf', 0x6aa84a), (i % 4) * 0.2 - 0.3, 2.0 + (i % 3) * 0.3, (i / 4 | 0) * 0.2 + 0.1)); at(g, bb, -w / 2 - 0.8, 0.4, d / 2 - 0.5); at(g, bench(0x6a4028), w / 2 + 1.2, 0.4, d / 2 + 0.8, -PI / 2); },
    workshop: (g, p) => { const { w, d } = p.bld; const wp = new THREE.Group(); for (let r = 0; r < 3; r++) for (let i = 0; i < 5 - r; i++) { const l = M(cyl(0.16, 0.16, 1.2, 8), tm('bark', 0x9a6a3e), -0.7 + i * 0.35 + r * 0.17, 0.18 + r * 0.3, 0); l.rotation.x = PI / 2; wp.add(l); } at(g, wp, -w / 2 - 1.0, 0.4, d / 2 - 0.4, PI / 2); for (const x of [-w / 2 + 0.8, w / 2 - 0.8]) at(g, K.planter(0xb8864a, 0xffd84a), x, 0.4, d / 2 + 1.0); at(g, aFrame('🔨 오늘의 클래스\n원목 도마 만들기', '#5a3a28', '#fff4dc'), 1.8, 0.42, d / 2 + 1.6, -0.2); },
    library: (g, p) => { const { w, d } = p.bld; for (const s of [-1, 1]) { at(g, bench(0x8a5a3b), s * 3.8, 0.4, d / 2 + 2.2); const lp = new THREE.Group(); lp.add(M(cyl(0.06, 0.08, 3.2, 8), 0x2a2a2e, 0, 1.6, 0)); lp.add(M(sphere(0.22, 12, 10), glow(0xfff0c8), 0, 3.35, 0)); at(g, lp, s * 5.2, 0.4, d / 2 + 2.0); at(g, K.planter(0xe8e0d4, 0xb69cff), s * 1.8, 0.4, d / 2 + 1.0); } },
  };
  for (const [k, fn] of Object.entries(EXTRA)) {
    const orig = BLD[k]; if (!orig) continue;
    BLD[k] = (p, ext) => { const g = orig(p, ext); try { fn(g, p, ext); } catch (e) { console.error('ext2', k, e); } return g; };
  }
})();
