/* =========================================================
 *  섬 건물 리디자인 3 — 참고 사진 속 건물 구조를 따라 만든 외관
 *   ☕ 카페 앙상블   : 유럽 운하 골목 타운하우스 3채 (박공 기와 · 덩굴 · 줄무늬 차양 · 꽃상자 · 프렌치 발코니 · 돌길)
 *   🍣 회전초밥      : 일본 옛 거리 상점 (검은 기와 2단 지붕 · 격자 코시 · 쪽빛 노렌 · 종이 등롱 · 노보리 깃발 · 벚나무)
 *   🥟 홍등반점      : 붉은 기둥 회랑 · 금빛 격자창 · 녹유 기와 위로 휜 처마 · 홍등 줄 · 돌사자
 *   🍵 달빛 다실     : 검게 그을린 삼나무 판벽 · 깊은 처마 · 툇마루 · 빛나는 장지문 · 둥근 창 · 석등 · 단풍나무
 *   🏪 편의점        : 일본 동네 모퉁이 가게 (함석 차양 · 자판기 3대 · 빨간 공중전화 · 자전거 · 전봇대 & 전선)
 *   🛍️ 쇼핑몰       : 도시 모퉁이 빌딩 (흰 층 띠 · 청록 띠창 · 둥근 모서리 · 옥상 광고판 · 어두운 1층 상점 · 노란 연석)
 *   🔨 공방          : 초록 지붕 흰 판자 코티지 + 현관 기둥 포치 + 유리 온실 + 흰 울타리 + 연못
 *   🏫 학교          : 종탑 시계가 있는 크림색 목조 학교
 *   🍹 코코넛 비치 바: 야자잎 초가지붕 · 대나무 바 · 티키 횃불 · 전구 줄
 *   🏡 집 테마 4종   : 그린 지붕 코티지 · 유럽 타운하우스 · 튜더 하프팀버 · 파스텔 비치하우스
 *  + 모든 건물 아래 부드러운 접지 그림자(AO)
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE;
  const H = ISLE.M.h, { mat, geo, sphere, box, cyl, mesh } = H;
  const AC = FM.AC, K = AC.K, PM = FM.PM, BLD = PM.BLD, T = AC.T;
  const { tbox, tm } = AC;
  const glow = c => PM.glowMat(c), glass = c => PM.glassMat(c);
  const PI = Math.PI;
  const at = (g, o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
  const M = (g2, m, x = 0, y = 0, z = 0) => mesh(g2, typeof m === 'number' ? mat(m) : m, x, y, z);
  let sd = 11; const rnd = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; };

  // ---------------------------------------------------------
  // 새 무늬 (회색조 → 재질 색으로 물듦)
  // ---------------------------------------------------------
  // 일본 기와 (둥근 골 기와 줄 + 끝 막새)
  T.jptile = () => AC.tex('jptile', 256, (g, w, h) => {
    g.fillStyle = '#5a5a5a'; g.fillRect(0, 0, w, h);
    const cw = 32, rh = 64;
    for (let y = 0; y < h; y += rh) for (let x = 0; x < w; x += cw) {
      const gr = g.createLinearGradient(x, 0, x + cw, 0); gr.addColorStop(0, '#6a6a6a'); gr.addColorStop(0.42, '#f0f0f0'); gr.addColorStop(0.6, '#cfcfcf'); gr.addColorStop(1, '#5e5e5e');
      g.fillStyle = gr; g.fillRect(x + 2, y, cw - 4, rh - 5);
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x, y + rh - 5, cw, 5);
      g.fillStyle = '#d6d6d6'; g.beginPath(); g.ellipse(x + cw / 2, y + rh - 7, cw / 2 - 3, 5, 0, 0, PI * 2); g.fill();
    }
  });
  // 튜더 하프팀버 (흰 회벽 + 짙은 들보 · 가새)
  T.timber = () => AC.tex('timber', 256, (g, w, h) => {
    g.fillStyle = '#f6f6f2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(0,0,0,${0.02 + rnd() * 0.04})`; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 4, 2 + rnd() * 3); }
    const B = '#3c3632', bw = 14;
    g.fillStyle = B; g.fillRect(0, 0, w, bw); g.fillRect(0, h / 2 - bw / 2, w, bw);
    for (const x of [0, w / 2, w]) g.fillRect(x - bw / 2, 0, bw, h);
    g.strokeStyle = B; g.lineWidth = bw - 2; g.lineCap = 'butt';
    g.beginPath(); g.moveTo(bw / 2, h / 2); g.lineTo(w / 2 - bw / 2, h - 2); g.stroke();
    g.beginPath(); g.moveTo(w - bw / 2, h / 2); g.lineTo(w / 2 + bw / 2, h - 2); g.stroke();
    g.beginPath(); g.moveTo(w / 4, bw); g.lineTo(w / 4, h / 2); g.stroke(); g.beginPath(); g.moveTo(w * 3 / 4, bw); g.lineTo(w * 3 / 4, h / 2); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.12)'; for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 1);
  });
  // 나무 너와 (불규칙 폭 · 줄마다 엇갈림)
  T.shake = () => AC.tex('shake', 256, (g, w, h) => {
    g.fillStyle = '#4a4a4a'; g.fillRect(0, 0, w, h);
    const rh = 32;
    for (let y = 0; y < h; y += rh) { let x = -rnd() * 20; while (x < w) { const sw = 14 + rnd() * 22, v = 165 + rnd() * 80 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x + 1, y, sw - 2, rh - 3); g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(x + 2, y, sw - 4, 4); g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(x + 1, y + rh - 7, sw - 2, 4); for (let k = 0; k < 2; k++) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(x + 3 + rnd() * (sw - 6), y + 3, 1, rh - 10); } x += sw; } }
  });
  // 초가 / 야자잎
  T.thatch = () => AC.tex('thatch', 256, (g, w, h) => {
    g.fillStyle = '#a8a8a8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1500; i++) { const x = rnd() * w, y = rnd() * h, l = 10 + rnd() * 24, v = 140 + rnd() * 115 | 0; g.strokeStyle = `rgba(${v},${v},${v},0.9)`; g.lineWidth = 1 + rnd() * 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 5, y + l); g.stroke(); }
    for (let y = 0; y < h; y += 64) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, y + 57, w, 7); }
  });
  // 그을린 삼나무 판 (야키스기)
  T.yakisugi = () => AC.tex('yakisugi', 256, (g, w, h) => {
    for (let x = 0; x < w; x += 32) {
      const v = 120 + rnd() * 40 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, 0, 32, h);
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(x, 0, 3, h);
      for (let i = 0; i < 46; i++) { g.fillStyle = `rgba(0,0,0,${0.15 + rnd() * 0.3})`; g.fillRect(x + 3 + rnd() * 26, rnd() * h, 2 + rnd() * 9, 1.5); }
      g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(x + 7, 0, 4, h);
    }
  });
  // 돌길 (둥근 자갈)
  T.cobble = () => AC.tex('cobble', 256, (g, w, h) => {
    g.fillStyle = '#8c8c8c'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h + 22; y += 22) for (let x = ((y / 22) % 2) * 14 - 14; x < w + 14; x += 28) { const v = 185 + rnd() * 60 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.ellipse(x + 12, y + 10, 12, 9.5, 0, 0, PI * 2); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.ellipse(x + 9, y + 7, 6, 3.5, 0, 0, PI * 2); g.fill(); }
  });
  // 골함석 (물결 철판)
  T.corrug = () => AC.tex('corrug', 128, (g, w, h) => { for (let x = 0; x < w; x++) { const v = 170 + Math.sin(x / w * PI * 16) * 60 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, 0, 1, h); } for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(120,80,50,0.12)'; g.fillRect(rnd() * w, rnd() * h, 3 + rnd() * 6, 8 + rnd() * 20); } });

  // ---------------------------------------------------------
  // 밤에 켜지는 가게 유리창 (실내 그림) — AC.setNight 에 함께 묶음
  // ---------------------------------------------------------
  const nightMats = [];
  const prevNight = AC.setNight;
  AC.setNight = k => { prevNight(k); for (const m of nightMats) m.emissive.setRGB(k * m.userData.nr, k * m.userData.ng, k * m.userData.nb); };
  const mcache = new Map();
  function shopMat(key, draw, lit = [1, 0.8, 0.5], size = [256, 128]) {
    if (mcache.has(key)) return mcache.get(key);
    const t = PM.ctex('s3' + key, size[0], size[1], draw);
    const m = new THREE.MeshLambertMaterial({ map: t, emissive: 0x000000 });
    m.userData.nr = lit[0]; m.userData.ng = lit[1]; m.userData.nb = lit[2];
    nightMats.push(m); mcache.set(key, m); return m;
  }
  const cm = (key, make) => { if (!mcache.has(key)) mcache.set(key, make()); return mcache.get(key); };
  // 카페 쇼윈도 (선반 · 펜던트 등 · 케이크)
  const cafeWin = () => shopMat('cafeWin', (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5a3a24'); gr.addColorStop(1, '#b8804a'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,220,150,0.5)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(30 + i * 64, 22, 9, 0, PI * 2); c.fill(); c.fillRect(29 + i * 64, 0, 2, 14); }
    c.fillStyle = '#3a2416'; c.fillRect(0, 54, w, 5); c.fillRect(0, 96, w, 6);
    for (let i = 0; i < 18; i++) { c.fillStyle = ['#f4e4c8', '#e8b07a', '#ffffff', '#c86a4a'][i % 4]; c.fillRect(8 + i * 14, 40, 9, 14); }
    for (let i = 0; i < 6; i++) { c.fillStyle = '#fff4e4'; c.beginPath(); c.arc(24 + i * 42, 88, 10, PI, 0); c.fill(); c.fillStyle = '#ff9ab0'; c.fillRect(15 + i * 42, 86, 18, 3); }
    c.fillStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); c.moveTo(20, h); c.lineTo(70, 0); c.lineTo(95, 0); c.lineTo(45, h); c.fill();
  }, [1, 0.75, 0.42]);
  // 일본 가게 장지 / 격자 너머 빛
  const shojiMat = () => shopMat('shoji', (c, w, h) => { c.fillStyle = '#fff2d8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#6a4a30'; c.lineWidth = 4; for (let x = 0; x <= w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } c.fillStyle = 'rgba(255,190,110,0.25)'; c.fillRect(0, h * 0.5, w, h * 0.5); }, [1, 0.72, 0.38]);
  // 편의점 / 상점 유리 (진열대)
  const martWin = () => shopMat('martWin', (c, w, h) => {
    c.fillStyle = '#eef6f2'; c.fillRect(0, 0, w, h);
    for (let r = 0; r < 3; r++) { c.fillStyle = '#c8d0d4'; c.fillRect(0, 34 + r * 34, w, 4); for (let i = 0; i < 30; i++) { c.fillStyle = ['#ff6a5a', '#ffd84a', '#5ab0ff', '#7ad08a', '#ff9ad0', '#ffffff'][(i + r) % 6]; c.fillRect(4 + i * 8.5, 18 + r * 34, 6, 16); } }
    c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.moveTo(30, h); c.lineTo(80, 0); c.lineTo(100, 0); c.lineTo(50, h); c.fill();
    c.fillStyle = 'rgba(40,120,90,0.85)'; c.fillRect(0, h - 10, w, 10);
  }, [0.95, 1, 0.95]);
  // 부티크 쇼윈도 (마네킹 · 꽃)
  const boutiqueWin = () => shopMat('boutWin', (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffe8ee'); gr.addColorStop(1, '#f4c4d0'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { const x = 32 + i * 64; c.fillStyle = '#f8f0ec'; c.beginPath(); c.arc(x, 30, 9, 0, PI * 2); c.fill(); c.fillStyle = ['#ff6f9a', '#ffffff', '#b69cff', '#ffd84a'][i]; c.beginPath(); c.moveTo(x - 16, 112); c.lineTo(x - 8, 42); c.lineTo(x + 8, 42); c.lineTo(x + 16, 112); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(20, h); c.lineTo(70, 0); c.lineTo(90, 0); c.lineTo(40, h); c.fill();
  }, [1, 0.85, 0.85]);
  // 중국집 금빛 격자창
  const latticeMat = () => shopMat('cnLat', (c, w, h) => {
    c.fillStyle = '#ffcf7a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#7a1a10'; c.lineWidth = 7;
    for (let x = 0; x <= w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.lineWidth = 4; for (let x = 0; x < w; x += 64) for (let y = 0; y < h; y += 64) { c.strokeRect(x + 12, y + 12, 40, 40); }
  }, [1, 0.6, 0.3], [256, 256]);
  // 자판기 앞면
  const vendMat = (col, key) => shopMat('vend' + key, (c, w, h) => {
    c.fillStyle = col; c.fillRect(0, 0, w, h); c.fillStyle = '#f4faff'; c.fillRect(10, 14, w - 20, h * 0.5);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { c.fillStyle = ['#ff4a3a', '#ffd84a', '#3a9aff', '#5ad06a', '#ff8ac0', '#a07a4a'][(i + r * 2) % 6]; c.fillRect(16 + i * 18, 22 + r * 40, 12, 28); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(18 + i * 18, 24 + r * 40, 3, 22); }
    c.fillStyle = '#1a1a1a'; c.fillRect(20, h * 0.72, w - 40, 26); c.fillStyle = '#ffffff'; c.font = 'bold 22px sans-serif'; c.fillText(key === 'r' ? 'Coke' : key === 'b' ? 'POCARI' : 'TEA', 26, h * 0.68);
  }, [0.9, 0.95, 1], [128, 256]);

  // ---------------------------------------------------------
  // 공용 부품
  // ---------------------------------------------------------
  // 박공면이 앞(+z)을 보는 지붕 (용마루 z 방향)
  function frontGable(w, d, rise, color, o) { const r = K.gable(d, w, rise, color, o); r.rotation.y = PI / 2; return r; }
  // 차양식 외처마 (앞으로 기울어진 판)
  function pent(w, dep, color, kind = 'jptile', tilt = 0.4) { const g = new THREE.Group(); g.add(tbox(w, 0.14, dep, kind, color, 0, 0, dep / 2, 0.03, 1)); g.rotation.x = tilt; return g; }
  // 처마 끝이 위로 휜 장식 (중국/일본 지붕 모서리)
  function flare(color) { const g = new THREE.Group(); const c = M(geo('flare2', () => new THREE.ConeGeometry(0.11, 0.55, 8)), color); c.rotation.z = -0.75; c.position.set(0.12, 0.2, 0); g.add(c); g.add(M(sphere(0.12, 8, 6), color, 0, 0.02, 0)); return g; }
  // 종이 등롱
  function lantern(c = 0xff3a2a, s = 1, txt) {
    const g = new THREE.Group();
    const b = M(sphere(0.26 * s, 14, 10), glow(c)); b.scale.y = 1.35; b.userData.noBake = true; g.add(b);
    for (const y of [0.33, -0.33]) g.add(M(cyl(0.16 * s, 0.16 * s, 0.07 * s, 12), 0x1a1a1a, 0, y * s, 0));
    g.add(M(cyl(0.01, 0.01, 0.4, 4), 0x1a1a1a, 0, 0.55 * s, 0));
    if (txt) { const t = PM.sign(txt, 0.3 * s, 0.3 * s, 'rgba(0,0,0,0)', '#1a1a1a'); t.position.set(0, 0, 0.27 * s); g.add(t); }
    return g;
  }
  // 노보리 깃발
  function nobori(col, txt) { const g = new THREE.Group(); g.add(M(cyl(0.03, 0.03, 3.2, 6), 0x8a7a6a, 0, 1.6, 0)); g.add(M(box(0.62, 0.04, 0.04, 0.01), 0x8a7a6a, 0.31, 3.05, 0)); const f = PM.sign(txt, 0.6, 2.2, col, '#ffffff'); f.position.set(0.31, 1.9, 0.02); g.add(f); const f2 = PM.sign(txt, 0.6, 2.2, col, '#ffffff'); f2.position.set(0.31, 1.9, -0.02); f2.rotation.y = PI; g.add(f2); return g; }
  // 노렌 (가게 입구 천)
  function noren(w, col, txt) { const g = new THREE.Group(); g.add(M(cyl(0.025, 0.025, w + 0.3, 6), 0x5a3a28, 0, 0, 0).rotateZ(PI / 2)); const n = 3; for (let i = 0; i < n; i++) { const s = PM.sign(i === 1 ? txt : '', w / n - 0.04, 0.85, col, '#ffffff'); s.position.set(-w / 2 + (i + 0.5) * w / n, -0.45, 0.02); g.add(s); } return g; }
  // 자전거
  function bike(c = 0x4fc1e9) { const g = new THREE.Group(); for (const x of [-0.5, 0.5]) { const wl = M(geo('bkW', () => new THREE.TorusGeometry(0.32, 0.035, 6, 18)), 0x2a2a2a, x, 0.34, 0); g.add(wl); } const fr = M(box(1.0, 0.05, 0.05, 0.01), c, 0, 0.5, 0); g.add(fr); const s = M(box(0.05, 0.5, 0.05, 0.01), c, -0.15, 0.62, 0); s.rotation.z = 0.25; g.add(s); g.add(M(box(0.26, 0.06, 0.12, 0.02), 0x3a2a20, -0.22, 0.88, 0)); g.add(M(box(0.05, 0.05, 0.5, 0.01), 0x9aa0a8, 0.42, 0.92, 0)); g.add(M(box(0.3, 0.18, 0.3, 0.02), 0x9aa0a8, 0.62, 0.72, 0)); return g; }
  // 흰 울타리
  function picket(len, c = 0xffffff) { const g = new THREE.Group(); const n = Math.max(2, Math.round(len / 0.22)); for (let i = 0; i <= n; i++) { const x = -len / 2 + i * len / n; g.add(M(box(0.08, 0.8, 0.04, 0.01), c, x, 0.4, 0)); g.add(M(geo('pkTip', () => new THREE.ConeGeometry(0.06, 0.12, 4)), c, x, 0.86, 0)); } for (const y of [0.25, 0.6]) g.add(M(box(len, 0.07, 0.04, 0.01), c, 0, y, -0.03)); return g; }
  // 벽 등 (작은 가스등)
  function wallLamp(c = 0x2a2a2a) { const g = new THREE.Group(); g.add(M(box(0.06, 0.06, 0.32, 0.01), c, 0, 0.2, 0.16)); g.add(M(box(0.22, 0.3, 0.22, 0.02), glass(0xfff4d8), 0, 0, 0.32)); const b = M(sphere(0.07, 8, 6), glow(0xffd890), 0, 0, 0.32); b.userData.noBake = true; g.add(b); g.add(M(geo('wlCap', () => new THREE.ConeGeometry(0.18, 0.14, 4)), c, 0, 0.21, 0.32).rotateY(PI / 4)); return g; }
  // 둥근 나무 (벚꽃 · 단풍)
  function blossomTree(leaf = 0xffb8d0, trunk = 0x6a4a38, s = 1) { const g = new THREE.Group(); const tr = M(cyl(0.12 * s, 0.2 * s, 2.2 * s, 8), tm('bark', trunk), 0, 1.1 * s, 0); g.add(tr); for (let i = 0; i < 7; i++) { const a = i * 0.9; const b = M(sphere((0.75 + (i % 3) * 0.15) * s, 12, 10), tm('leaf', leaf), Math.cos(a) * 0.7 * s, (2.4 + (i % 2) * 0.45) * s, Math.sin(a) * 0.6 * s); g.add(b); } return g; }
  // 석등
  function stoneLantern() { const g = new THREE.Group(); const S = 0xb8b0a4; g.add(M(box(0.5, 0.12, 0.5, 0.03), tm('stone', S), 0, 0.06, 0)); g.add(M(cyl(0.1, 0.12, 0.6, 8), tm('stone', S), 0, 0.42, 0)); g.add(M(box(0.44, 0.08, 0.44, 0.02), tm('stone', S), 0, 0.76, 0)); g.add(M(box(0.34, 0.3, 0.34, 0.03), tm('stone', S), 0, 0.95, 0)); const l = M(box(0.18, 0.16, 0.36, 0.01), glow(0xffc870), 0, 0.95, 0); l.userData.noBake = true; g.add(l); const r = M(geo('slRoof', () => new THREE.ConeGeometry(0.42, 0.28, 4)), tm('stone', S), 0, 1.24, 0); r.rotation.y = PI / 4; g.add(r); g.add(M(sphere(0.06, 8, 6), tm('stone', S), 0, 1.42, 0)); return g; }

  // =========================================================
  // ☕ 카페 앙상블 — 유럽 타운하우스 3채
  // =========================================================
  BLD.cafe = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld;
    const HS = [{ f: 0.34, h: 6.6, c: 0xf7e3b5, roof: 0xb8553a, aw: [0x2e7a52, 0xfff8ec], sh: 0x2e7a52 }, { f: 0.32, h: 7.7, c: 0xf3c6ae, roof: 0x4f5866, aw: [0xc0392b, 0xfff8ec], sh: 0x7a3a2a }, { f: 0.34, h: 6.9, c: 0xe2ead6, roof: 0xa8492e, aw: [0x2f4b6e, 0xfff8ec], sh: 0x2f4b6e }];
    g.add(K.base(w, d, 0.45, 0xd9d0c2, 'stone'));
    // 앞 돌길 (운하 둑 느낌)
    g.add(tbox(w + 2.6, 0.06, 3.0, 'cobble', 0xe6ddd0, 0, 0.0, d / 2 + 1.7, 0.01, 1.3));
    g.add(tbox(w + 2.6, 0.22, 0.3, 'stone', 0xcfc6b8, 0, 0.0, d / 2 + 3.2, 0.03, 1));
    let x0 = -w / 2;
    HS.forEach((c, i) => {
      const hw = w * c.f, cx = x0 + hw / 2; x0 += hw;
      const hs = new THREE.Group(); hs.position.x = cx; g.add(hs);
      hs.add(tbox(hw - 0.05, c.h, d, 'plaster', c.c, 0, 0.4, 0, 0.06, 1.4));
      // 1층 상점 정면 (짙은 원목 틀 + 쇼윈도)
      hs.add(tbox(hw - 0.3, 2.7, 0.14, 'plank', 0x3a2a22, 0, 0.42, d / 2 + 0.05, 0.03, 0.6));
      const sw = M(box(hw - 0.9, 1.7, 0.03, 0.01), cafeWin(), i === 1 ? 0 : 0, 1.85, d / 2 + 0.14); if (i === 1) { sw.scale.x = 0.32; sw.position.x = -hw / 2 + 0.55; } hs.add(sw);
      if (i === 1) { const sw2 = M(box(hw - 0.9, 1.7, 0.03, 0.01), cafeWin(), hw / 2 - 0.55, 1.85, d / 2 + 0.14); sw2.scale.x = 0.32; hs.add(sw2); }
      for (const xx of [-hw / 2 + 0.3, hw / 2 - 0.3]) hs.add(M(box(0.12, 2.7, 0.2, 0.02), 0x2a1e18, xx, 1.77, d / 2 + 0.12));
      hs.add(M(box(hw - 0.3, 0.4, 0.06, 0.02), 0x2a1e18, 0, 2.95, d / 2 + 0.16));
      // 층 사이 흰 띠 · 처마 몰딩
      hs.add(M(box(hw, 0.16, d + 0.12, 0.03), 0xfbf8f2, 0, 3.32, 0));
      hs.add(M(box(hw + 0.1, 0.2, d + 0.2, 0.04), 0xfbf8f2, 0, c.h + 0.32, 0));
      // 위층 창 (덧창 · 꽃상자)
      const rows = c.h > 7.2 ? [4.35, 6.4] : [4.4];
      for (const y of rows) for (const s of [-1, 1]) at(hs, K.window(0.82, 1.3, { shutters: c.sh, curtain: '#fff4dc', seed: i * 3 + (s > 0 ? 1 : 0) }), s * hw * 0.24, y, d / 2 + 0.02);
      if (c.h <= 7.2) at(hs, K.window(0.7, 0.9, { box: false, curtain: '#fff4dc' }), 0, c.h - 0.6, d / 2 + 0.02);
      // 지붕 (박공면이 정면)
      const r = frontGable(hw + 0.12, d, 2.5, c.roof, { kind: 'rooftile', wallKind: 'plaster', wallColor: c.c, over: 0.35 }); r.position.y = c.h + 0.4; hs.add(r);
      // 줄무늬 차양 + 간판
      const aw = K.awning(hw - 0.5, 1.5, c.aw[0], c.aw[1]); aw.position.set(0, 3.12, d / 2 + 0.14); hs.add(aw);
      // 뒷면 · 옆면 창
      for (const y of [1.9, 4.4]) at(hs, K.window(0.8, 1.1, { box: false, curtain: '#fff4dc' }), 0, y, -d / 2 - 0.02, PI);
    });
    // 덩굴 (왼쪽 집 모서리 · 오른쪽 집 전면)
    at(g, K.vines(5.8, 1.4, 0xffffff), -w / 2 + 0.35, 0.4, d / 2 + 0.06); at(g, K.vines(6.2, 1.8, 0xff8fb1), w / 2 - 0.9, 0.4, d / 2 + 0.06);
    // 가운데 집 프렌치 발코니 · 문
    at(g, K.balcony(1.9, 0.55, 0x2a2a2a, { flowers: true, floorColor: 0x8a8a8a }), w * (-0.5 + 0.34 + 0.16), 5.55, d / 2 + 0.02);
    const dr = K.door(1.25, 2.3, 0x2e4a3a, { frame: 0x2a1e18, lamp: false, matColor: 0x9a3a2a }); dr.position.set(0, 0.42, d / 2 + 0.08); g.add(dr);
    const sg = PM.sign('카페 앙상블  ·  Brunch & Coffee', 4.6, 0.36, '#2a1e18', '#ffe2a8'); sg.position.set(0, 2.95, d / 2 + 0.21); g.add(sg);
    at(g, K.hangSign('☕', '#fff4dc', '#3a2a22', 0.8), w / 2 - 0.2, 3.55, d / 2 + 0.05, PI / 2);
    for (const x of [-w * 0.33, w * 0.33]) at(g, wallLamp(), x, 2.55, d / 2 + 0.12);
    // 굴뚝 · 꽃 화분 · 자전거 · 칠판
    at(g, K.chimney(1.3, 0xb8553a), -w / 2 + 1.0, 6.9, -1.2);
    for (const x of [-w / 2 + 0.6, -1.3, 1.3, w / 2 - 0.6]) { const pl = K.planter(0xc87a4a, [0xff6f86, 0xffffff, 0xffd84a, 0xb69cff][Math.abs(Math.round(x)) % 4]); pl.scale.setScalar(0.85); pl.position.set(x, 0.42, d / 2 + 0.55); g.add(pl); }
    at(g, bike(0x2e7a52), -w / 2 + 1.6, 0.06, d / 2 + 2.6, 0.1);
    const cb = new THREE.Group(); cb.add(M(box(0.8, 1.0, 0.06, 0.02), 0x2e3a30, 0, 0.7, 0)); const ct = PM.sign('오늘의 수플레 🥞\n라떼 · 크루아상', 0.7, 0.8, '#2e3a30', '#ffffff'); ct.position.set(0, 0.72, 0.04); cb.add(ct); for (const s of [-1, 1]) { const l = M(box(0.05, 1.3, 0.05, 0.01), tm('plank', 0x9a6a44), s * 0.4, 0.6, 0.08); l.rotation.x = 0.18; cb.add(l); } at(g, cb, 2.4, 0.06, d / 2 + 1.6, -0.25);
    return g;
  };

  // =========================================================
  // 🍣 회전초밥 (일본 거리 상점) / 🥟 홍등반점 (중국 누각)
  // =========================================================
  function sushiShop(p) {
    const g = new THREE.Group(); const { w, d } = p.bld;
    const ROOF = 0x3c3f46, WOOD = 0x4a3426, PL = 0xf3ede2;
    g.add(K.base(w, d, 0.45, 0xbdb5a8, 'stone'));
    // 1층: 회벽 + 앞면 짙은 원목, 격자(코시)
    g.add(tbox(w, 3.0, d, 'plaster', PL, 0, 0.4, 0, 0.05, 1.4));
    g.add(tbox(w - 0.1, 2.8, 0.12, 'plank', WOOD, 0, 0.42, d / 2 + 0.03, 0.02, 0.6));
    for (const [x0, x1] of [[-w / 2 + 0.4, -1.2], [1.2, w / 2 - 0.4]]) {
      g.add(M(box(x1 - x0, 1.7, 0.03, 0.01), shojiMat(), (x0 + x1) / 2, 1.85, d / 2 + 0.1));
      for (let x = x0; x <= x1 + 0.01; x += 0.14) g.add(M(box(0.05, 1.8, 0.06, 0.005), 0x3a2618, x, 1.85, d / 2 + 0.15));
      g.add(M(box(x1 - x0 + 0.1, 0.08, 0.1, 0.01), 0x3a2618, (x0 + x1) / 2, 0.95, d / 2 + 0.15)); g.add(M(box(x1 - x0 + 0.1, 0.08, 0.1, 0.01), 0x3a2618, (x0 + x1) / 2, 2.75, d / 2 + 0.15));
    }
    // 입구: 미닫이 + 쪽빛 노렌
    g.add(M(box(2.1, 2.3, 0.04, 0.01), shojiMat(), 0, 1.6, d / 2 + 0.1));
    at(g, noren(2.2, '#24566a', 'すし'), 0, 2.72, d / 2 + 0.22);
    // 1층 외처마
    at(g, pent(w + 0.8, 1.3, ROOF), 0, 3.2, d / 2 - 0.05);
    for (const s of [-1, 1]) g.add(M(box(0.16, 3.0, 0.16, 0.02), 0x2a1a12, s * (w / 2 + 0.02), 1.9, d / 2 + 0.02));
    // 2층 (안쪽으로 들인 회벽 + 검은 기둥 + 무시코 창)
    const up = new THREE.Group(); up.position.set(0, 3.4, -0.4); g.add(up);
    up.add(tbox(w - 0.4, 2.2, d - 0.8, 'plaster', PL, 0, 0, 0, 0.05, 1.4));
    for (const x of [-w / 2 + 0.2, -w / 6, w / 6, w / 2 - 0.2]) up.add(M(box(0.14, 2.2, 0.06, 0.01), 0x2a1a12, x, 1.1, (d - 0.8) / 2 + 0.02));
    up.add(M(box(w - 0.4, 0.12, 0.06, 0.01), 0x2a1a12, 0, 2.1, (d - 0.8) / 2 + 0.02));
    for (const s of [-1, 1]) { up.add(M(box(1.8, 0.7, 0.03, 0.01), shojiMat(), s * w / 3.4, 1.1, (d - 0.8) / 2 + 0.03)); for (let i = 0; i < 9; i++) up.add(M(box(0.05, 0.75, 0.05, 0.005), 0x2a1a12, s * w / 3.4 - 0.85 + i * 0.21, 1.1, (d - 0.8) / 2 + 0.07)); }
    // 뒷면 · 옆면 격자창
    for (const x of [-w / 3, w / 3]) { g.add(M(box(1.6, 1.0, 0.03, 0.01), shojiMat(), x, 1.9, -d / 2 - 0.02)); for (let i = 0; i < 8; i++) g.add(M(box(0.05, 1.05, 0.05, 0.005), 0x3a2618, x - 0.75 + i * 0.214, 1.9, -d / 2 - 0.05)); }
    for (const s of [-1, 1]) { g.add(M(box(0.03, 1.0, 1.8, 0.01), shojiMat(), s * (w / 2 + 0.02), 1.9, -0.6)); for (let i = 0; i < 8; i++) g.add(M(box(0.05, 1.05, 0.05, 0.005), 0x3a2618, s * (w / 2 + 0.05), 1.9, -1.45 + i * 0.24)); up.add(M(box(0.03, 0.7, 1.4, 0.01), shojiMat(), s * ((w - 0.4) / 2 + 0.02), 1.1, 0)); }
    up.add(M(box(1.8, 0.7, 0.03, 0.01), shojiMat(), 0, 1.1, -(d - 0.8) / 2 - 0.02));
    // 큰 지붕 (검은 기와) + 지붕 간판
    const r = K.gable(w - 0.2, d - 0.8, 1.7, ROOF, { kind: 'jptile', wallKind: 'plaster', wallColor: PL, gableWindow: false, ridge: 0x26282c, over: 0.75 }); r.position.set(0, 5.6, -0.4); g.add(r);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) at(g, flare(ROOF), sx * (w / 2 + 0.5), 5.55, -0.4 + sz * ((d - 0.8) / 2 + 0.85), sx > 0 ? 0 : PI);
    const kb = new THREE.Group(); kb.add(M(box(4.2, 1.0, 0.14, 0.03), tm('plank', 0x6a4a30), 0, 0.5, 0)); const kt = PM.sign('回転寿司  바다마을', 3.9, 0.8, '#f4ecdc', '#1a2a3a'); kt.position.set(0, 0.5, 0.08); kb.add(kt); for (const s of [-1, 1]) kb.add(M(box(0.1, 0.8, 0.1, 0.02), 0x3a2618, s * 1.8, -0.3, -0.05)); at(g, kb, 0, 6.6, 0.4);
    // 종이 등롱 · 노보리 깃발 · 화분 · 평상 · 벚나무 · 자전거
    for (const s of [-1, 1]) at(g, lantern(0xff4a3a, 1.1, '寿'), s * 1.55, 2.55, d / 2 + 0.5);
    for (const s of [-1, 1]) at(g, nobori(s > 0 ? '#2a8a8a' : '#c0392b', s > 0 ? '활어 초밥' : '오늘의 참치'), s * (w / 2 + 0.5), 0.06, d / 2 + 0.9);
    for (const x of [-w / 2 + 0.7, w / 2 - 0.7]) { const pt = new THREE.Group(); pt.add(M(cyl(0.28, 0.22, 0.4, 10), 0x3a3a44, 0, 0.2, 0)); const b = M(sphere(0.4, 10, 8), tm('leaf', 0x3a7a3a), 0, 0.7, 0); b.scale.y = 0.6; pt.add(b); pt.add(M(sphere(0.28, 10, 8), tm('leaf', 0x4a8a44), 0.12, 1.0, 0)); at(g, pt, x, 0.42, d / 2 + 0.45); }
    const bc = new THREE.Group(); bc.add(M(box(1.7, 0.08, 0.6, 0.02), 0xc0392b, 0, 0.48, 0)); for (const x of [-0.75, 0.75]) bc.add(M(box(0.08, 0.46, 0.5, 0.01), 0x4a3426, x, 0.23, 0)); at(g, bc, -w / 2 - 1.3, 0.06, d / 2 - 1.0, PI / 2);
    at(g, blossomTree(0xffbcd2, 0x5a3a2a, 1.05), w / 2 + 2.0, 0.06, -0.6);
    at(g, bike(0xc0392b), w / 2 + 0.6, 0.06, d / 2 + 0.2, PI / 2 + 0.15);
    return g;
  }
  function chineseHall(p) {
    const g = new THREE.Group(); const { w, d } = p.bld;
    const RED = 0xb02a1e, GOLD = 0xe0b040, ROOF = 0x2e6a4c, WALL = 0xd8d0c4;
    const goldM = cm('cnGold', () => new THREE.MeshPhongMaterial({ color: GOLD, shininess: 80, specular: 0xfff0b0 }));
    // 화강암 기단 + 계단
    g.add(tbox(w + 1.2, 0.7, d + 1.2, 'ashlar', 0xc8c0b4, 0, -0.02, 0, 0.06, 1.2));
    for (let i = 0; i < 3; i++) g.add(tbox(3.2, 0.24, 0.5, 'ashlar', 0xd0c8bc, 0, -0.02 + i * 0.22, d / 2 + 1.5 - i * 0.42, 0.03, 1.2));
    // 벽 (회색 벽돌) + 정면 붉은 판벽
    g.add(tbox(w - 0.6, 3.4, d - 1.0, 'brick', WALL, 0, 0.66, -0.4, 0.05, 0.9));
    g.add(tbox(w - 0.7, 3.2, 0.1, 'plank', RED, 0, 0.68, d / 2 - 0.88, 0.02, 0.8));
    // 회랑 붉은 기둥 6개 + 금 받침
    for (let i = 0; i < 6; i++) { const x = -w / 2 + 0.5 + i * (w - 1) / 5; g.add(M(cyl(0.17, 0.19, 3.3, 14), RED, x, 0.68 + 1.65, d / 2 - 0.05)); g.add(M(cyl(0.26, 0.26, 0.16, 14), goldM, x, 0.76, d / 2 - 0.05)); g.add(M(box(0.5, 0.18, 0.5, 0.03), goldM, x, 3.9, d / 2 - 0.05)); }
    // 금빛 격자창 + 붉은 문
    for (const s of [-1, 1]) g.add(M(box(2.6, 1.9, 0.04, 0.01), latticeMat(), s * 2.9, 2.2, d / 2 - 0.8));
    const dr = new THREE.Group(); for (const s of [-1, 1]) { dr.add(tbox(0.95, 2.5, 0.1, 'plank', 0x8a1a12, s * 0.5, 0, 0, 0.02, 0.6)); for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) dr.add(M(sphere(0.045, 6, 5), goldM, s * 0.5 - 0.3 + c * 0.3, 0.5 + r * 0.5, 0.07)); dr.add(M(geo('cnRing', () => new THREE.TorusGeometry(0.09, 0.02, 6, 14)), goldM, s * 0.12, 1.25, 0.08)); }
    at(g, dr, 0, 0.68, d / 2 - 0.78);
    // 현판 (검은 판 + 금 글씨)
    const pl = new THREE.Group(); pl.add(M(box(3.4, 0.8, 0.1, 0.03), 0x1a1a1a, 0, 0, 0)); pl.add(M(box(3.55, 0.95, 0.06, 0.03), goldM, 0, 0, -0.04)); const pt = PM.sign('紅燈飯店  홍등반점', 3.2, 0.66, '#1a1a1a', '#f0c050'); pt.position.z = 0.06; pl.add(pt); at(g, pl, 0, 3.4, d / 2 - 0.72);
    // 아래 처마 (녹유 기와) + 붉은 들보
    g.add(M(box(w + 0.2, 0.3, 0.3, 0.03), RED, 0, 4.1, d / 2 - 0.05));
    g.add(M(box(w + 0.2, 0.08, 0.32, 0.01), goldM, 0, 3.92, d / 2 - 0.05));
    at(g, pent(w + 1.4, 1.5, ROOF, 'jptile', 0.42), 0, 4.25, d / 2 - 0.25);
    for (const s of [-1, 1]) at(g, flare(ROOF), s * (w / 2 + 0.7), 3.75, d / 2 + 1.15, s > 0 ? 0 : PI);
    // 2층 누각
    const up = new THREE.Group(); up.position.set(0, 4.3, -0.6); g.add(up);
    up.add(tbox(w - 2.4, 2.3, d - 2.4, 'plank', RED, 0, 0, 0, 0.04, 0.8));
    for (const s of [-1, 1]) up.add(M(box(1.8, 1.2, 0.04, 0.01), latticeMat(), s * 1.6, 1.15, (d - 2.4) / 2 + 0.03));
    at(up, K.balcony(w - 2.0, 0.7, RED, { flowers: false, floorColor: 0x6a2a1a }), 0, 0.05, (d - 2.4) / 2);
    const r = K.gable(w - 2.0, d - 2.0, 1.8, ROOF, { kind: 'jptile', wallKind: 'plank', wallColor: RED, gableWindow: false, ridge: 0x1e4a34, over: 0.9 }); r.position.y = 2.3; up.add(r);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) at(up, flare(ROOF), sx * ((w - 2.0) / 2 + 0.8), 2.25, sz * ((d - 2.0) / 2 + 0.9), sx > 0 ? 0 : PI);
    // 용마루 장식 (금 구슬 + 물고기 꼬리)
    up.add(M(sphere(0.3, 14, 10), goldM, 0, 4.4, 0));
    for (const s of [-1, 1]) { const tail = M(geo('cnTail', () => new THREE.TorusGeometry(0.32, 0.09, 8, 16, PI * 1.2)), goldM, s * ((w - 2.0) / 2 + 0.6), 4.35, 0); tail.rotation.y = PI / 2; up.add(tail); }
    // 홍등 줄 (처마 아래 · 2층) + 금 술
    for (let i = 0; i < 7; i++) { const x = -w / 2 + 0.6 + i * (w - 1.2) / 6; const l = lantern(0xff3a24, 1.0); l.position.set(x, 3.35, d / 2 + 0.3); g.add(l); g.add(M(cyl(0.03, 0.01, 0.3, 4), goldM, x, 2.85, d / 2 + 0.3)); }
    for (const s of [-1, 1]) { const l = lantern(0xff3a24, 1.3, '福'); l.position.set(s * (w / 2 - 1.6), 6.2, (d - 2.4) / 2 - 0.2); up.add(l); }
    // 돌사자 한 쌍
    for (const s of [-1, 1]) { const li = new THREE.Group(); const S = 0xc8c0b0; li.add(M(box(0.7, 0.5, 0.7, 0.05), tm('ashlar', S), 0, 0.25, 0)); const bd = M(sphere(0.32, 12, 10), tm('stone', S), 0, 0.78, -0.05); bd.scale.set(1, 1.15, 1.2); li.add(bd); li.add(M(sphere(0.27, 12, 10), tm('stone', S), 0, 1.18, 0.12)); li.add(M(sphere(0.16, 10, 8), tm('stone', 0xa8a090), 0, 1.25, 0.12).translateY(0.1)); li.add(M(sphere(0.1, 8, 6), tm('stone', S), s * -0.12, 0.62, 0.32)); at(g, li, s * 2.1, 0.68, d / 2 + 0.9); }
    // 대나무 화분 · 측면 녹색 창
    for (const s of [-1, 1]) { const bb = new THREE.Group(); bb.add(M(cyl(0.35, 0.3, 0.5, 12), 0x2a5a8a, 0, 0.25, 0)); for (let i = 0; i < 6; i++) { const st = M(cyl(0.03, 0.03, 2.2, 6), 0x6aa04a, Math.cos(i) * 0.15, 1.3, Math.sin(i) * 0.15); bb.add(st); bb.add(M(sphere(0.2, 8, 6), tm('leaf', 0x5a9a3a), Math.cos(i) * 0.2, 2.0 + (i % 3) * 0.25, Math.sin(i) * 0.2)); } at(bb, new THREE.Group(), 0, 0, 0); at(g, bb, s * (w / 2 + 0.2), 0.68, d / 2 + 0.2); }
    for (const s of [-1, 1]) for (const z of [-1.5, 0.8]) { const win = M(box(0.04, 1.2, 1.4, 0.01), latticeMat(), s * ((w - 0.6) / 2 + 0.03), 2.3, z); g.add(win); }
    return g;
  }
  BLD.restaurant = (p) => (p.id === 'pub' ? chineseHall(p) : sushiShop(p));

  // =========================================================
  // 🍵 달빛 다실
  // =========================================================
  BLD.teahouse = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld;
    const ROOF = 0x34373c, DARK = 0x9a8470, PL = 0xece2cc;
    g.add(K.base(w, d, 0.55, 0xa8a094, 'stone'));
    // 몸체: 아랫단 그을린 판벽 + 윗단 회벽 + 기둥
    g.add(tbox(w - 0.6, 1.3, d - 0.6, 'yakisugi', DARK, 0, 0.5, 0, 0.03, 1.2));
    g.add(tbox(w - 0.6, 2.0, d - 0.6, 'plaster', PL, 0, 1.8, 0, 0.03, 1.4));
    for (let i = 0; i < 5; i++) { const x = -(w - 0.6) / 2 + i * (w - 0.6) / 4; for (const z of [-(d - 0.6) / 2, (d - 0.6) / 2]) g.add(M(box(0.18, 3.3, 0.18, 0.02), 0x2a1c14, x, 2.15, z)); }
    g.add(M(box(w - 0.4, 0.16, d - 0.4, 0.02), 0x2a1c14, 0, 3.75, 0));
    // 정면 장지문 (빛남) + 툇마루
    for (const s of [-1, 1]) { const sj = M(box(2.9, 2.3, 0.04, 0.01), shojiMat(), s * 1.9, 1.85, (d - 0.6) / 2 + 0.04); g.add(sj); }
    g.add(tbox(w - 0.2, 0.14, 1.1, 'plank', 0x8a6040, 0, 0.55, (d - 0.6) / 2 + 0.5, 0.02, 0.5));
    for (const x of [-w / 2 + 0.3, 0, w / 2 - 0.3]) g.add(M(box(0.12, 0.6, 0.12, 0.02), 0x3a2618, x, 0.3, (d - 0.6) / 2 + 0.95));
    // 입구 노렌 '茶'
    at(g, noren(1.6, '#2a3a5a', '茶'), 0, 3.0, (d - 0.6) / 2 + 0.12);
    // 깊은 처마 기와 지붕 (모임 + 박공)
    const r = K.gable(w + 0.4, d + 0.4, 2.0, ROOF, { kind: 'jptile', wallKind: 'plaster', wallColor: PL, gableWindow: false, ridge: 0x222428, over: 1.2 }); r.position.y = 3.85; g.add(r);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) at(g, flare(ROOF), sx * (w / 2 + 1.2), 3.75, sz * (d / 2 + 1.3), sx > 0 ? 0 : PI);
    // 둥근 창 (옆면)
    for (const s of [-1, 1]) { const rw = M(geo('maru', () => new THREE.CircleGeometry(0.75, 28)), shojiMat(), s * ((w - 0.6) / 2 + 0.03), 2.4, -0.8); rw.rotation.y = s * PI / 2; g.add(rw); const rr = M(geo('maruR', () => new THREE.TorusGeometry(0.78, 0.08, 8, 28)), 0x2a1c14, s * ((w - 0.6) / 2 + 0.05), 2.4, -0.8); rr.rotation.y = PI / 2; g.add(rr); }
    // 등롱 · 석등 · 디딤돌 · 대나무 울타리 · 단풍나무 · 이끼
    for (const s of [-1, 1]) at(g, lantern(0xfff0d0, 0.95, '月'), s * 1.1, 3.25, (d - 0.6) / 2 + 0.9);
    at(g, stoneLantern(), -w / 2 - 0.4, 0.06, d / 2 + 1.0); at(g, stoneLantern(), w / 2 + 0.6, 0.06, d / 2 + 2.2);
    for (let i = 0; i < 5; i++) { const st = M(cyl(0.32, 0.36, 0.08, 10), tm('stone', 0xb8b0a4), (i % 2 ? 0.25 : -0.25), 0.06, d / 2 + 1.0 + i * 0.6); st.scale.z = 0.8; g.add(st); }
    for (const s of [-1, 1]) { const fen = new THREE.Group(); for (let i = 0; i < 14; i++) fen.add(M(cyl(0.045, 0.045, 1.4, 6), 0x8a9a4a, 0, 0.7, -1.4 + i * 0.22)); for (const y of [0.4, 1.05]) fen.add(M(box(0.06, 0.06, 3.1, 0.01), 0x5a3a28, 0.06, y, 0)); at(g, fen, s * (w / 2 + 0.6), 0.06, -1.0); }
    at(g, blossomTree(0xd84a2a, 0x4a3022, 0.95), -w / 2 - 1.8, 0.06, -1.6);
    for (let i = 0; i < 6; i++) { const m2 = M(sphere(0.3, 8, 6), tm('leaf', 0x5a8a3a), -w / 2 + 0.6 + i * 0.5, 0.18, d / 2 + 0.3); m2.scale.y = 0.4; g.add(m2); }
    return g;
  };

  // =========================================================
  // 🏪 편의점 — 일본 동네 모퉁이 가게
  // =========================================================
  BLD.shop = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld; const CRE = 0xf1e6cf, TEAL = 0x2f8a80;
    g.add(K.base(w, d, 0.4, 0xc8c0b4, 'stone'));
    g.add(tbox(w, 3.0, d, 'siding', CRE, 0, 0.36, 0, 0.04, 1));
    g.add(tbox(w - 0.2, 2.4, d - 0.2, 'siding', 0xe8dcc4, 0, 3.36, -0.1, 0.04, 1));
    // 1층 유리 미닫이 + 진열대
    g.add(M(box(w - 1.0, 2.1, 0.04, 0.01), martWin(), 0, 1.5, d / 2 + 0.04));
    for (let i = 0; i <= 4; i++) g.add(M(box(0.08, 2.2, 0.08, 0.01), 0xb8c0c8, -(w - 1.0) / 2 + i * (w - 1.0) / 4, 1.5, d / 2 + 0.08));
    g.add(M(box(w - 0.9, 0.08, 0.1, 0.01), 0xb8c0c8, 0, 2.6, d / 2 + 0.08));
    // 함석 차양 + 간판
    at(g, pent(w + 0.4, 1.4, TEAL, 'corrug', 0.32), 0, 3.12, d / 2 + 0.05);
    const sb = PM.sign('🏪 마을 편의점 24', w - 0.6, 0.55, '#2f8a80', '#ffffff'); sb.position.set(0, 2.88, d / 2 + 0.1); g.add(sb);
    const vt = new THREE.Group(); vt.add(M(box(0.5, 1.6, 0.1, 0.02), 0xc0392b, 0, 0, 0)); const vtt = PM.sign('たばこ', 0.4, 1.4, '#c0392b', '#ffffff'); vtt.position.z = 0.06; vt.add(vtt); at(vt, new THREE.Group(), 0, 0, 0); at(g, vt, w / 2 + 0.12, 4.0, d / 2 - 0.3, PI / 2);
    // 2층 창 · 에어컨 실외기 · 빨래대
    for (const s of [-1, 1]) at(g, K.window(1.2, 0.9, { box: false, curtain: '#d8e8f0', frame: 0xd8dcd8 }), s * 1.8, 4.7, (d - 0.2) / 2 - 0.08);
    const ac = new THREE.Group(); ac.add(M(box(0.8, 0.55, 0.32, 0.03), 0xe8ecec)); ac.add(M(cyl(0.2, 0.2, 0.02, 14), 0x6a6e70, 0.12, 0, 0.17).rotateX(PI / 2)); at(g, ac, 0, 4.3, (d - 0.2) / 2 + 0.1);
    // 지붕 (얕은 박공 골함석)
    const rf = K.gable(w + 0.2, d, 0.9, 0x8a4a3a, { kind: 'corrug', wallKind: 'siding', wallColor: 0xe8dcc4, gableWindow: false, over: 0.4 }); rf.position.y = 5.75; g.add(rf);
    // 자판기 3대
    [[0xd8282a, 'r'], [0xf4f4f4, 'w'], [0x2a6ad8, 'b']].forEach(([c, k], i) => { const v = new THREE.Group(); v.add(M(box(0.9, 1.85, 0.75, 0.04), c, 0, 0.92, 0)); v.add(M(box(0.8, 1.6, 0.02, 0.01), vendMat(k === 'r' ? '#d8282a' : k === 'b' ? '#2a6ad8' : '#e8e8e8', k), 0, 1.0, 0.38)); v.add(M(box(0.95, 0.08, 0.8, 0.02), 0x2a2a2a, 0, 1.88, 0)); at(g, v, -w / 2 - 0.6 - i * 0.98, 0.06, d / 2 - 0.4); });
    // 빨간 공중전화 · 우체통 · 자전거 · 음료 상자 · 아이스크림 냉동고
    const ph = new THREE.Group(); ph.add(M(box(0.12, 1.0, 0.12, 0.02), 0x8a8a8a, 0, 0.5, 0)); ph.add(M(box(0.55, 0.65, 0.4, 0.06), 0xd8282a, 0, 1.3, 0)); ph.add(M(box(0.4, 0.2, 0.02, 0.01), 0xe8e8e0, 0, 1.4, 0.21)); ph.add(M(box(0.6, 0.06, 0.45, 0.02), 0xd8282a, 0, 1.66, 0)); at(g, ph, w / 2 + 0.8, 0.06, d / 2 + 0.3, -0.3);
    const pb = new THREE.Group(); pb.add(M(cyl(0.28, 0.28, 1.2, 14), 0xd8282a, 0, 0.6, 0)); pb.add(M(sphere(0.28, 14, 8), 0xd8282a, 0, 1.2, 0)); pb.add(M(box(0.3, 0.05, 0.05, 0.01), 0x1a1a1a, 0, 1.0, 0.27)); at(g, pb, w / 2 + 1.6, 0.06, d / 2 + 0.6);
    at(g, bike(0x3a9a5a), 1.6, 0.06, d / 2 + 1.4, 0.2); at(g, bike(0xffd84a), 0.6, 0.06, d / 2 + 1.55, 0.05);
    for (let i = 0; i < 3; i++) { const cr = new THREE.Group(); cr.add(M(box(0.6, 0.3, 0.4, 0.02), [0x2a6ad8, 0xffd84a, 0xd8282a][i])); for (let k = 0; k < 6; k++) cr.add(M(cyl(0.05, 0.05, 0.22, 6), 0xe8f4f8, -0.22 + (k % 3) * 0.22, 0.2, -0.08 + Math.floor(k / 3) * 0.16)); at(g, cr, -1.6, 0.21 + i * 0.31, d / 2 + 0.55); }
    const fz = new THREE.Group(); fz.add(M(box(1.3, 0.75, 0.7, 0.05), 0xffffff, 0, 0.38, 0)); fz.add(M(box(1.2, 0.04, 0.6, 0.01), glass(0xbfe8ff), 0, 0.77, 0)); const ft = PM.sign('ICE 🍦', 1.0, 0.3, '#4fc1e9', '#ffffff'); ft.position.set(0, 0.45, 0.36); fz.add(ft); at(g, fz, -2.9, 0.06, d / 2 + 0.6);
    // 전봇대 + 변압기 + 전선
    const pole = new THREE.Group(); pole.add(M(cyl(0.14, 0.18, 8.5, 10), 0x9a948a, 0, 4.25, 0)); pole.add(M(box(2.0, 0.12, 0.12, 0.02), 0x6a6a6a, 0, 7.6, 0)); pole.add(M(box(1.4, 0.1, 0.1, 0.02), 0x6a6a6a, 0, 7.0, 0)); pole.add(M(cyl(0.3, 0.3, 0.8, 12), 0x8a9098, 0.35, 6.2, 0)); for (const x of [-0.9, 0, 0.9]) pole.add(M(cyl(0.05, 0.05, 0.15, 6), 0xe8e8e8, x, 7.72, 0));
    for (const [x, y] of [[-0.9, 7.68], [0, 7.68], [0.9, 7.68], [-0.6, 7.06], [0.6, 7.06]]) { const wi = M(cyl(0.012, 0.012, 9, 3), 0x1a1a1a, x, y - 0.25, -4.5); wi.rotation.x = PI / 2 + 0.06; pole.add(wi); }
    at(g, pole, w / 2 + 2.4, 0.06, d / 2 + 1.6);
    return g;
  };

  // =========================================================
  // 🛍️ 쇼핑몰 — 도시 모퉁이 빌딩
  // =========================================================
  BLD.mall = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld;
    const WH = 0xf6f4ee, TEAL = 0x3aa8a0, DK = 0x2a2a2e, floors = 3, fh = 3.3, gh = 3.8;
    g.add(K.base(w, d, 0.4, 0xc8c4bc, 'stone'));
    // 보도 + 노란 연석
    g.add(tbox(w + 2.4, 0.08, 2.6, 'tile', 0xd8d4cc, 0, 0.0, d / 2 + 1.5, 0.01, 1.2));
    g.add(M(box(w + 2.4, 0.2, 0.25, 0.02), 0xf2c83a, 0, 0.1, d / 2 + 2.8));
    // 1층: 어두운 상점 정면 + 쇼윈도 (왼쪽 마켓 · 오른쪽 부티크)
    g.add(tbox(w, gh, d, 'panel', DK, 0, 0.36, 0, 0.04, 1.2));
    for (const s of [-1, 1]) { g.add(M(box(w / 2 - 2.2, 2.4, 0.04, 0.01), s < 0 ? martWin() : boutiqueWin(), s * (w / 4 + 0.5), 1.75, d / 2 + 0.04)); for (let i = 0; i <= 3; i++) g.add(M(box(0.08, 2.5, 0.08, 0.01), 0x6a6a6e, s * (1.6 + i * (w / 2 - 2.2) / 3), 1.75, d / 2 + 0.08)); }
    for (const [s, c1, c2, t, bg] of [[-1, 0x2e7a52, 0xfff8ec, '🥬 FRESH MARKET', '#2e7a52'], [1, 0xff8fb1, 0xffffff, '🌹 ROSE BOUTIQUE', '#d86a8a']]) { const aw = K.awning(w / 2 - 1.8, 1.4, c1, c2); aw.position.set(s * (w / 4 + 0.5), 3.35, d / 2 + 0.06); g.add(aw); const sg = PM.sign(t, w / 2 - 2.6, 0.45, bg, '#ffffff'); sg.position.set(s * (w / 4 + 0.5), 3.75, d / 2 + 0.06); g.add(sg); }
    // 위층: 흰 층 띠 + 청록 띠창
    const tealGl = cm('mallTeal', () => { const m = new THREE.MeshPhongMaterial({ color: TEAL, shininess: 110, specular: 0xcfffff, emissive: 0x000000 }); m.userData.nr = 0.5; m.userData.ng = 0.7; m.userData.nb = 0.6; nightMats.push(m); return m; });
    for (let f = 0; f < floors; f++) {
      const y = 0.36 + gh + f * fh;
      g.add(tbox(w, fh, d, 'panel', WH, 0, y, 0, 0.04, 1.6));
      g.add(M(box(w + 0.06, 1.4, d + 0.06, 0.02), tealGl, 0, y + 1.75, 0));
      for (let i = 0; i <= 12; i++) { const x = -w / 2 + i * w / 12; g.add(M(box(0.1, 1.42, 0.1, 0.01), WH, x, y + 1.75, d / 2 + 0.04)); }
      for (let i = 0; i <= 8; i++) { const z = -d / 2 + i * d / 8; for (const s of [-1, 1]) g.add(M(box(0.1, 1.42, 0.1, 0.01), WH, s * (w / 2 + 0.04), y + 1.75, z)); }
      g.add(M(box(w + 0.3, 0.18, d + 0.3, 0.03), WH, 0, y + fh - 0.02, 0));
    }
    // 둥근 모서리 탑 (앞 오른쪽)
    const top = 0.36 + gh + floors * fh;
    const tw = new THREE.Group(); tw.position.set(w / 2 - 0.4, 0, d / 2 - 0.4); g.add(tw);
    tw.add(M(geo('mallTw', () => AC.scaleUV(new THREE.CylinderGeometry(2.0, 2.0, top + 1.2, 28), 6, 6)), tm('panel', WH), 0, (top + 1.2) / 2, 0));
    for (let f = 0; f < floors; f++) tw.add(M(geo('mallTwG', () => new THREE.CylinderGeometry(2.03, 2.03, 1.4, 28)), tealGl, 0, 0.36 + gh + f * fh + 1.75, 0));
    tw.add(M(geo('mallTwB', () => new THREE.CylinderGeometry(2.03, 2.03, gh - 0.4, 28)), DK, 0, 0.36 + (gh - 0.4) / 2, 0));
    tw.add(M(geo('mallTwC', () => new THREE.CylinderGeometry(2.2, 2.2, 0.3, 28)), WH, 0, top + 1.3, 0));
    // 옥상: 난간 + 광고판 2개 + 물탱크
    g.add(M(box(w + 0.2, 0.7, 0.2, 0.03), WH, 0, top + 0.35, d / 2)); g.add(M(box(w + 0.2, 0.7, 0.2, 0.03), WH, 0, top + 0.35, -d / 2));
    for (const s of [-1, 1]) g.add(M(box(0.2, 0.7, d, 0.03), WH, s * w / 2, top + 0.35, 0));
    for (const [x, t, bg, fg] of [[-w / 4, 'PLATINUM  SALE  50%', '#ff4a7a', '#ffffff'], [w / 6, 'FRESH MARKET 🍓', '#2e7a52', '#fff4c0']]) { const bb = new THREE.Group(); for (const s of [-1, 1]) bb.add(M(box(0.12, 2.6, 0.12, 0.02), 0x5a5a5e, s * 2.2, 1.3, 0)); bb.add(M(box(4.8, 0.1, 0.1, 0.02), 0x5a5a5e, 0, 0.9, 0)); const bs = PM.sign(t, 5.0, 1.5, bg, fg); bs.position.set(0, 2.4, 0.08); bb.add(bs); bb.add(M(box(5.1, 1.6, 0.1, 0.02), 0xf4f4f0, 0, 2.4, 0)); at(g, bb, x, top, -d / 2 + 2.0); }
    const tk = new THREE.Group(); tk.add(M(cyl(1.0, 1.0, 1.6, 16), 0x9aa0a8, 0, 2.2, 0)); for (let i = 0; i < 4; i++) tk.add(M(box(0.1, 1.4, 0.1, 0.01), 0x6a6e72, Math.cos(i * PI / 2) * 0.8, 0.7, Math.sin(i * PI / 2) * 0.8)); at(g, tk, w / 2 - 3, top, -d / 2 + 2.2);
    // 정문 (가운데 유리문 + 캐노피)
    const dr = K.door(2.4, 2.6, 0x3a3a3e, { frame: 0x9aa0a8, lamp: false, matColor: 0x3aa8a0 }); dr.position.set(0, 0.36, d / 2 + 0.06); g.add(dr);
    g.add(M(box(3.6, 0.16, 1.6, 0.03), 0xf6f4ee, 0, 3.0, d / 2 + 0.8));
    // 화분 · 가로수 · 벤치
    for (const x of [-w / 2 + 0.8, w / 2 - 3.2]) { const pl = K.planter(0x9a9aa0, 0xff8fb1); pl.position.set(x, 0.08, d / 2 + 1.0); g.add(pl); }
    return g;
  };

  // 도시 블록 (흰 층 띠 + 색 띠창 + 둥근 모서리 탑) — 오피스 · 병원
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
  function billboard(t, bg, fg, wd = 5) { const bb = new THREE.Group(); for (const s of [-1, 1]) bb.add(M(box(0.12, 2.6, 0.12, 0.02), 0x5a5a5e, s * (wd / 2 - 0.3), 1.3, 0)); bb.add(M(box(wd - 0.2, 0.1, 0.1, 0.02), 0x5a5a5e, 0, 0.9, 0)); bb.add(M(box(wd + 0.1, 1.6, 0.1, 0.02), 0xf4f4f0, 0, 2.4, 0)); const bs = PM.sign(t, wd, 1.5, bg, fg); bs.position.set(0, 2.4, 0.08); bb.add(bs); return bb; }
  BLD.office = (p) => {
    const g = new THREE.Group(); const { w, d, h } = p.bld;
    const floors = Math.max(4, Math.floor((h - 4) / 3.3));
    const top = cityBlock(g, w, d, { band: 0x4a9ad8, floors, corners: [1] });
    at(g, billboard('MEGA OFFICE  ·  City Coin', '#2f4b6e', '#ffffff', 6), -w / 4, top, -d / 2 + 2.0);
    const ant = new THREE.Group(); ant.add(M(cyl(0.08, 0.1, 5, 8), 0xdfe6f0, 0, 2.5, 0)); ant.add(M(sphere(0.2, 10, 8), glow(0xff3a3a), 0, 5.1, 0)); at(g, ant, w / 4, top, -1);
    // 옥상 테라스 탕비실 (화분 · 파라솔)
    for (const [x, z] of [[w / 4 - 2, 2], [w / 4 + 1.5, 2.5]]) { const pl = K.planter(0xd8d0c4, 0xffd84a); pl.position.set(x, top, z); g.add(pl); }
    const can = new THREE.Group(); can.add(M(box(6, 0.25, 2.4, 0.06), 0x2f4b6e, 0, 3.4, 1)); for (const x of [-2.7, 2.7]) can.add(M(cyl(0.12, 0.12, 3.2, 10), 0xdfe6f0, x, 1.7, 2)); at(g, can, 0, 0, d / 2 + 0.3);
    const dr = K.door(2.4, 2.6, 0x3a3a3e, { frame: 0x9aa0a8, lamp: false, matColor: 0x2f4b6e }); dr.position.set(0, 0.36, d / 2 + 0.06); g.add(dr);
    const sg = PM.sign('🏢 메가 오피스 타워', 5.5, 0.7, '#2f4b6e', '#ffffff'); sg.position.set(0, 3.8, d / 2 + 0.08); g.add(sg);
    for (const x of [-w / 2 + 1.0, w / 2 - 3.0]) { const pl = K.planter(0x9a9aa0, 0xffd84a); pl.position.set(x, 0.08, d / 2 + 1.0); g.add(pl); }
    return g;
  };
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
    // 구급차
    const amb = new THREE.Group(); amb.add(M(box(3.0, 1.5, 1.5, 0.15), 0xffffff, 0, 1.1, 0)); amb.add(M(box(0.9, 1.0, 1.48, 0.12), 0xffffff, 1.8, 0.85, 0)); amb.add(M(box(3.02, 0.25, 1.52, 0.02), 0xff3a3a, 0, 1.1, 0)); amb.add(M(box(0.3, 0.12, 0.3, 0.02), glow(0x3a8aff), 0.4, 1.9, 0)); for (const x of [-0.9, 1.5]) for (const z of [-0.7, 0.7]) { const wl = M(cyl(0.32, 0.32, 0.2, 12), 0x2a2a2a, x, 0.32, z); wl.rotation.x = PI / 2; amb.add(wl); } at(g, amb, w / 2 + 2.6, 0.06, d / 2 - 1.5, -PI / 2);
    return g;
  };

  // =========================================================
  // 🔨 공방 — 초록 지붕 코티지 + 온실 + 연못
  // =========================================================
  function cottageCore(g, w, d, o) {
    // w×d 몸체 (흰 판자) + 초록 너와 지붕 + 도머 + 현관 포치
    const WALL = o.wall || 0xfbfaf4, ROOF = o.roof || 0x5f8a5a, TRIM = o.trim || 0xffffff, hh = o.h || 3.2;
    g.add(K.base(w, d, 0.5, o.base || 0xc8c0b4, 'stone'));
    g.add(tbox(w, hh, d, 'siding', WALL, 0, 0.45, 0, 0.05, 0.9));
    for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) g.add(M(box(0.24, hh, 0.24, 0.03), TRIM, x, 0.45 + hh / 2, z));
    const r = K.gable(w, d, o.rise || 2.6, ROOF, { kind: 'shake', wallKind: 'siding', wallColor: WALL, ridge: AC.shade(ROOF, 0.7), over: 0.55 }); r.position.y = hh + 0.45; g.add(r);
    if (o.dormers !== false) for (const x of o.dormerX || [-w / 4, w / 4]) { const dm = K.dormer(WALL, ROOF, 'siding'); dm.position.set(x, hh + 0.75, d / 4 - 0.2); g.add(dm); }
    // 포치 (기둥 + 지붕 + 난간)
    const pw = o.porchW || Math.min(w - 1, 5), pd = 1.7;
    g.add(tbox(pw + 0.4, 0.2, pd, 'plank', 0xd8c8a8, 0, 0.42, d / 2 + pd / 2, 0.02, 0.5));
    for (const s of [-1, 1]) for (const x of [pw / 2, pw / 6]) at(g, K.column(2.5, TRIM), s * x, 0.6, d / 2 + pd - 0.15);
    const pr = pent(pw + 0.8, pd + 0.4, ROOF, 'shake', 0.3); pr.position.set(0, 3.25, d / 2 - 0.1); g.add(pr);
    for (const s of [-1, 1]) { const rl = new THREE.Group(); for (let i = 0; i <= 6; i++) rl.add(M(box(0.06, 0.6, 0.06, 0.01), TRIM, i * (pw / 2 - pw / 6 - 0.2) / 6, 0.3, 0)); rl.add(M(box(pw / 2 - pw / 6, 0.08, 0.1, 0.01), TRIM, (pw / 2 - pw / 6 - 0.2) / 2, 0.62, 0)); at(rl, new THREE.Group(), 0, 0, 0); rl.position.set(s > 0 ? pw / 6 + 0.1 : -pw / 2 + 0.1, 0.6, d / 2 + pd - 0.15); g.add(rl); }
    const dr = K.door(1.2, 2.3, o.door || 0x3a6a4a, { frame: TRIM, lamp: true, matColor: 0xc8a070 }); dr.position.set(0, 0.45, d / 2 + 0.05); g.add(dr);
    for (const s of [-1, 1]) at(g, K.window(1.0, 1.35, { shutters: o.shutter, curtain: o.curtain || '#fff4dc', frame: TRIM, seed: s > 0 ? 2 : 0 }), s * (w / 2 - 1.2), 2.05, d / 2 + 0.02);
    for (const s of [-1, 1]) at(g, K.window(0.9, 1.2, { box: false, curtain: o.curtain || '#fff4dc', frame: TRIM }), s * (w / 2 + 0.02), 2.05, 0, s * PI / 2);
    at(g, K.window(0.9, 1.2, { box: false, curtain: o.curtain || '#fff4dc', frame: TRIM }), 0, 2.05, -d / 2 - 0.02, PI);
    if (o.chimney !== false) at(g, K.chimney(2.0, 0xa85a44), w / 2 - 1.0, hh + 0.6, -d / 4);
  }
  function greenhouse(gw, gd, gh) {
    const g = new THREE.Group(); const W = 0xffffff;
    g.add(tbox(gw, 0.5, gd, 'brick', 0xd8a088, 0, 0, 0, 0.03, 0.8));
    g.add(M(box(gw - 0.1, gh, gd - 0.1, 0.01), glass(0xd8f4ff), 0, 0.5 + gh / 2, 0));
    for (let i = 0; i <= 4; i++) { const x = -gw / 2 + i * gw / 4; for (const z of [-gd / 2, gd / 2]) g.add(M(box(0.07, gh, 0.07, 0.01), W, x, 0.5 + gh / 2, z)); }
    for (let i = 0; i <= 3; i++) { const z = -gd / 2 + i * gd / 3; for (const s of [-1, 1]) g.add(M(box(0.07, gh, 0.07, 0.01), W, s * gw / 2, 0.5 + gh / 2, z)); }
    for (const y of [0.5 + gh / 2, 0.5 + gh]) g.add(M(box(gw + 0.05, 0.07, gd + 0.05, 0.01), W, 0, y, 0));
    const ang = Math.atan2(0.9, gd / 2), sl = Math.hypot(0.9, gd / 2);
    for (const s of [-1, 1]) { const pv = new THREE.Group(); pv.position.set(0, 0.5 + gh + 0.9, 0); pv.rotation.x = s * ang; pv.add(M(box(gw, 0.04, sl, 0.01), glass(0xd8f4ff), 0, 0, s * sl / 2)); for (let i = 0; i <= 4; i++) pv.add(M(box(0.06, 0.06, sl, 0.01), W, -gw / 2 + i * gw / 4, 0.02, s * sl / 2)); g.add(pv); }
    g.add(M(box(gw + 0.1, 0.1, 0.1, 0.01), W, 0, 0.5 + gh + 0.92, 0));
    // 안쪽 식물 선반
    for (let i = 0; i < 8; i++) { const x = -gw / 2 + 0.4 + (i % 4) * (gw - 0.8) / 3, z = i < 4 ? -gd / 4 : gd / 4; g.add(M(cyl(0.15, 0.12, 0.25, 8), 0xc8744a, x, 0.95, z)); g.add(M(sphere(0.26, 10, 8), tm('leaf', [0x5aae4a, 0x3a8a3a, 0x7ac05a][i % 3]), x, 1.25, z)); if (i % 2) g.add(M(sphere(0.07, 6, 5), [0xff6f86, 0xffd84a][i % 2 ? 0 : 1], x + 0.1, 1.42, z)); }
    for (const z of [-gd / 4, gd / 4]) g.add(M(box(gw - 0.4, 0.08, 0.5, 0.01), 0x8a6a4a, 0, 0.8, z));
    return g;
  }
  function pond(r = 1.6) { const g = new THREE.Group(); const wM = cm('pondW', () => new THREE.MeshPhongMaterial({ color: 0x5ab8c8, shininess: 120, specular: 0xffffff, transparent: true, opacity: 0.85 })); const wt = M(geo('pondW' + r, () => new THREE.CircleGeometry(r, 28)), wM, 0, 0.12, 0); wt.rotation.x = -PI / 2; wt.userData.noBake = true; g.add(wt); for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; const st = M(sphere(0.26, 8, 6), tm('stone', 0xc8c0b4), Math.cos(a) * r, 0.12, Math.sin(a) * r * 1.0); st.scale.y = 0.55; g.add(st); } for (let i = 0; i < 4; i++) { const lp = M(geo('lily', () => new THREE.CircleGeometry(0.22, 12, 0.3, PI * 1.8)), 0x5aa04a, Math.cos(i * 1.7) * r * 0.5, 0.15, Math.sin(i * 1.7) * r * 0.5); lp.rotation.x = -PI / 2; g.add(lp); if (i % 2) g.add(M(sphere(0.08, 8, 6), 0xffb8d0, Math.cos(i * 1.7) * r * 0.5, 0.2, Math.sin(i * 1.7) * r * 0.5)); } return g; }
  BLD.workshop = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld;
    const core = new THREE.Group(); core.position.x = -1.6; g.add(core);
    cottageCore(core, w - 3.6, d, { roof: 0x5f8a5a, porchW: 4.2, dormerX: [-1.4, 1.4], curtain: '#f4ead8' });
    at(g, greenhouse(3.3, d - 1.6, 2.2), w / 2 - 1.6, 0.05, -0.4);
    const sg = PM.sign('🔨 마을 공방 · 플리마켓', 3.2, 0.5, '#fbfaf4', '#3a5a3a'); sg.position.set(-1.6, 3.05, d / 2 + 1.75); g.add(sg);
    // 흰 울타리 · 연못 · 꽃밭 · 장작
    for (const [x, len] of [[-w / 2 + 0.4, 2.6], [w / 2 - 1.2, 3.2]]) at(g, picket(len), x, 0.06, d / 2 + 2.6);
    at(g, pond(1.3), -w / 2 - 1.2, 0.0, d / 2 + 0.6);
    for (let i = 0; i < 10; i++) g.add(M(sphere(0.12, 8, 6), [0xff6f86, 0xffffff, 0xffd84a, 0xb69cff][i % 4], -w / 2 + 0.4 + i * 0.32, 0.3, d / 2 + 2.25));
    const wp = new THREE.Group(); for (let r = 0; r < 3; r++) for (let i = 0; i < 5 - r; i++) { const l = M(cyl(0.16, 0.16, 1.1, 8), tm('bark', 0x9a6a3e), -0.7 + i * 0.35 + r * 0.17, 0.18 + r * 0.3, 0); l.rotation.x = PI / 2; wp.add(l); } at(g, wp, -w / 2 - 0.4, 0.06, -1.6, PI / 2);
    return g;
  };

  // =========================================================
  // 🏫 학교 — 종탑 시계 목조 학교
  // =========================================================
  BLD.school = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld; const WALL = 0xf8ecd0, ROOF = 0xa8483a, TRIM = 0xffffff, hh = 3.6;
    g.add(K.base(w, d, 0.5, 0xc8c0b4, 'stone'));
    g.add(tbox(w, hh, d, 'siding', WALL, 0, 0.45, 0, 0.05, 0.9));
    for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) g.add(M(box(0.26, hh, 0.26, 0.03), TRIM, x, 0.45 + hh / 2, z));
    const r = K.gable(w, d, 2.4, ROOF, { kind: 'shingle', wallKind: 'siding', wallColor: WALL, over: 0.6 }); r.position.y = hh + 0.45; g.add(r);
    windows3(g, w, d, [2.2], 5, TRIM);
    for (let i = 0; i < 5; i++) at(g, K.window(1.1, 1.5, { box: false, curtain: '#e8f4ff', frame: TRIM }), -w / 2 + 1.2 + i * (w - 2.4) / 4, 2.2, -d / 2 - 0.02, PI);
    // 가운데 박공 현관 + 종탑 시계
    const C = new THREE.Group(); C.position.set(0, 0, d / 2); g.add(C);
    C.add(tbox(3.4, hh + 1.0, 1.2, 'siding', WALL, 0, 0.45, 0.3, 0.05, 0.9));
    const cr = frontGable(3.4, 1.4, 1.4, ROOF, { kind: 'shingle', wallKind: 'siding', wallColor: WALL, over: 0.25, gableWindow: false }); cr.position.set(0, hh + 1.45, 0.3); C.add(cr);
    const dr = K.door(1.7, 2.5, 0x3a6a8a, { frame: TRIM, arch: true, matColor: 0xffd84a }); dr.position.set(0, 0.45, 0.92); C.add(dr);
    const ck = M(cyl(0.6, 0.6, 0.1, 24), 0xfbfbf6, 0, hh + 0.4, 0.95); ck.rotation.x = PI / 2; C.add(ck); const cf = PM.sign('🕘', 0.95, 0.95, '#fbfbf6', '#2a2a2a'); cf.position.set(0, hh + 0.4, 1.01); C.add(cf);
    const bt = new THREE.Group(); bt.position.set(0, hh + 2.6, -0.4); g.add(bt);
    bt.add(tbox(1.6, 1.4, 1.6, 'siding', WALL, 0, 0, 0, 0.04, 0.9)); bt.add(M(box(1.2, 0.9, 1.7, 0.02), 0x3a2a24, 0, 0.75, 0)); bt.add(M(box(1.7, 0.9, 1.2, 0.02), 0x3a2a24, 0, 0.75, 0));
    bt.add(M(H.lathe('schBell', [[0.0001, 0.45], [0.15, 0.42], [0.22, 0.2], [0.34, 0]], 16), 0xd9b44a, 0, 0.55, 0));
    const sp = K.hip(1.9, 1.9, 1.5, ROOF); sp.position.y = 1.4; bt.add(sp); bt.add(M(cyl(0.03, 0.03, 0.9, 6), 0x3a3a3a, 0, 3.3, 0)); bt.add(M(sphere(0.1, 8, 6), 0xffd84a, 0, 3.75, 0));
    const sg = PM.sign('🏫 섬 어린이 학교', 3.2, 0.5, '#3a6a8a', '#ffffff'); sg.position.set(0, 3.25, d / 2 + 0.95); g.add(sg);
    // 국기 게양대 · 화단 · 자전거 거치대
    const fp = new THREE.Group(); fp.add(M(cyl(0.05, 0.06, 6, 8), 0xdfe4ea, 0, 3, 0)); fp.add(M(sphere(0.1, 8, 6), 0xffd84a, 0, 6.05, 0)); const fl = PM.sign('🌈', 1.2, 0.8, '#ffffff', '#ff6f86'); fl.position.set(0.62, 5.5, 0); fp.add(fl); at(g, fp, -w / 2 - 1.5, 0.06, d / 2 + 1.2);
    for (const s of [-1, 1]) { const bed = new THREE.Group(); bed.add(tbox(3.2, 0.35, 0.8, 'plank', 0x9a6a44, 0, 0, 0, 0.02, 0.5)); for (let i = 0; i < 9; i++) bed.add(M(sphere(0.14, 8, 6), [0xff6f86, 0xffd84a, 0xffffff, 0xff9a3d][i % 4], -1.4 + i * 0.35, 0.45, (i % 2) * 0.2 - 0.1)); at(g, bed, s * (w / 4 + 1.0), 0.06, d / 2 + 0.7); }
    for (let i = 0; i < 3; i++) at(g, bike([0xff6f86, 0x4fc1e9, 0x8ee07a][i]), w / 2 + 1.2, 0.06, d / 2 - 1.5 + i * 0.7, PI / 2);
    return g;
  };
  function windows3(g, w, d, ys, n, frame) { for (const y of ys) for (let i = 0; i < n; i++) { const x = -w / 2 + 1.2 + i * (w - 2.4) / (n - 1); if (Math.abs(x) < 2.0) continue; at(g, K.window(1.1, 1.5, { shutters: 0x3a6a8a, curtain: '#e8f4ff', frame, seed: i }), x, y, d / 2 + 0.02); } }

  // =========================================================
  // 🍹 코코넛 비치 바
  // =========================================================
  BLD.beachbar = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld; const BAM = 0xc8a060;
    g.add(tbox(w + 1.6, 0.25, d + 3.2, 'plank', 0xd8b88a, 0, 0.0, 0.8, 0.02, 0.5));
    // 대나무 기둥 + 초가 모임지붕 2겹
    for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2 + 0.8], [w / 2, d / 2 + 0.8]]) { g.add(M(cyl(0.12, 0.14, 3.4, 8), tm('bark', BAM), x, 1.95, z)); for (let k = 0; k < 4; k++) g.add(M(cyl(0.15, 0.15, 0.05, 8), 0x8a6a3a, x, 0.8 + k * 0.8, z)); }
    const r1 = K.hip(w + 2.2, d + 3.2, 1.9, 0xd8b878, 'thatch'); r1.position.set(0, 3.55, 0.4); g.add(r1);
    for (let i = 0; i < 40; i++) { const t = i / 40 * PI * 2; const fr = M(box(0.25, 0.4, 0.04, 0.01), tm('thatch', 0xc8a868), Math.cos(t) * (w / 2 + 1.1) * 1.0, 3.45, 0.4 + Math.sin(t) * (d / 2 + 1.6)); fr.rotation.y = -t + PI / 2; g.add(fr); }
    // 바 카운터 (대나무 겉면) + 뒤 선반 술병
    g.add(tbox(w - 0.6, 1.1, 0.6, 'log', BAM, 0, 0.25, d / 2 - 0.1, 0.03, 0.4));
    g.add(tbox(w - 0.4, 0.1, 0.8, 'plank', 0x8a5a3a, 0, 1.35, d / 2 - 0.1, 0.02, 0.5));
    g.add(tbox(w - 0.8, 1.6, 0.4, 'plank', 0x8a5a3a, 0, 0.25, -d / 2 + 0.4, 0.02, 0.5));
    for (let i = 0; i < 14; i++) { const x = -w / 2 + 0.8 + i * (w - 1.6) / 13; g.add(M(cyl(0.06, 0.07, 0.3, 8), [0x7ad08a, 0xffd84a, 0x4fc1e9, 0xff6a5a, 0xffffff][i % 5], x, 1.95 + (i % 2) * 0.55, -d / 2 + 0.5)); }
    // 서핑보드 간판 · 전구 줄 · 티키 횃불 · 코코넛 · 메뉴판
    const sb = new THREE.Group(); const bd = M(sphere(0.5, 16, 10), 0x4fc1e9); bd.scale.set(2.8, 0.55, 0.12); sb.add(bd); const st = PM.sign('COCONUT BAR 🥥', 2.2, 0.42, 'rgba(0,0,0,0)', '#ffffff'); st.position.z = 0.07; sb.add(st); at(sb, new THREE.Group(), 0, 0, 0); at(g, sb, 0, 3.1, d / 2 + 0.95);
    for (let i = 0; i <= 14; i++) { const t = i / 14, x = -w / 2 + w * t; const b = M(sphere(0.08, 8, 6), glow([0xfff0a0, 0xff9a6a, 0x9af0ff][i % 3]), x, 2.85 - Math.sin(t * PI) * 0.3, d / 2 + 0.85); b.userData.noBake = true; g.add(b); }
    for (const s of [-1, 1]) { const tk = new THREE.Group(); tk.add(M(cyl(0.05, 0.06, 1.9, 6), tm('bark', BAM), 0, 0.95, 0)); tk.add(M(cyl(0.12, 0.08, 0.3, 8), 0x6a4a2a, 0, 1.95, 0)); const fl = M(geo('tikiF', () => new THREE.ConeGeometry(0.11, 0.35, 8)), glow(0xffa83a), 0, 2.25, 0); fl.userData.noBake = true; tk.add(fl); at(g, tk, s * (w / 2 + 1.0), 0.12, d / 2 + 2.6); }
    for (let i = 0; i < 4; i++) g.add(M(sphere(0.13, 10, 8), 0x6a4a2a, -w / 2 + 1.0 + i * 0.3, 1.52, d / 2 - 0.2));
    // 스툴 4개 (spot 위치) · 해변 의자 2개 + 파라솔
    for (let i = 0; i < 4; i++) { const x = -2.4 + i * 1.6; const s = new THREE.Group(); s.add(M(cyl(0.05, 0.06, 0.75, 6), tm('bark', BAM), 0, 0.38, 0)); s.add(M(cyl(0.24, 0.22, 0.1, 12), 0xff8a5a, 0, 0.78, 0)); at(g, s, x, 0.12, 3.6); }
    for (const s of [-1, 1]) { const ch = new THREE.Group(); ch.add(M(box(0.7, 0.08, 0.7, 0.02), 0xffffff, 0, 0.4, 0)); const bk = M(box(0.7, 0.8, 0.08, 0.02), 0xffffff, 0, 0.75, -0.38); bk.rotation.x = -0.35; ch.add(bk); for (const x of [-0.32, 0.32]) ch.add(M(box(0.08, 0.4, 0.7, 0.02), 0xffffff, x, 0.2, 0)); at(g, ch, s * 5.8, 0.06, 6.0, 0); const um = new THREE.Group(); um.add(M(cyl(0.04, 0.04, 2.4, 6), 0xffffff, 0, 1.2, 0)); const tp = M(geo('bbUmb', () => new THREE.ConeGeometry(1.3, 0.5, 12, 1, true)), cm('bbUmbM', () => new THREE.MeshLambertMaterial({ map: AC.stripe('#ff6a5a', '#ffffff'), side: THREE.DoubleSide })), 0, 2.45, 0); um.add(tp); at(g, um, s * 5.0, 0.06, 6.6); }
    return g;
  };

  // =========================================================
  // 🏡 집 테마 4종 (빌라)
  // =========================================================
  Object.assign(PM.VILLA_THEMES, {
    cottage: { name: '그린 지붕 코티지', wall: 0xfbfaf4, roof: 0x5f8a5a },
    euro: { name: '유럽 운하 타운하우스', wall: 0xf3d8b0, roof: 0xb8553a },
    tudor: { name: '튜더 하프팀버 하우스', wall: 0xf6f0e2, roof: 0x5a4a44 },
    beach: { name: '파스텔 비치하우스', wall: 0x9ad8e0, roof: 0xffffff },
  });
  const VNEW = {
    cottage: (g, w, d, h) => {
      cottageCore(g, w, d, { h: h - 2.6, porchW: Math.min(w - 1.2, 4.6), dormerX: w > 9 ? [-w / 4, w / 4] : [0], curtain: '#fff0dc', shutter: null });
      // 흰 울타리 · 연못 · 작은 온실
      for (const s of [-1, 1]) at(g, picket(w / 2 - 1.4), s * (w / 4 + 0.7), 0.06, d / 2 + 2.6);
      at(g, greenhouse(2.2, 2.4, 1.7), w / 2 + 1.6, 0.05, -d / 4);
      at(g, pond(0.9), -w / 2 - 1.3, 0.0, d / 2 - 0.4);
    },
    euro: (g, w, d, h) => {
      const n = w > 9 ? 3 : 2, cols = [0xf3d8b0, 0xd8e4d0, 0xf0c0a8], roofs = [0xb8553a, 0x4f5866, 0xa8492e];
      g.add(K.base(w, d, 0.45, 0xd0c8bc, 'stone'));
      for (let i = 0; i < n; i++) {
        const hw = w / n, cx = -w / 2 + hw * (i + 0.5), hh = h - 1.2 + (i % 2) * 0.8;
        const hs = new THREE.Group(); hs.position.x = cx; g.add(hs);
        hs.add(tbox(hw - 0.04, hh, d, 'plaster', cols[i], 0, 0.4, 0, 0.05, 1.4));
        hs.add(M(box(hw, 0.15, d + 0.1, 0.02), 0xffffff, 0, 2.95, 0));
        const r = frontGable(hw + 0.1, d, 2.0, roofs[i], { kind: 'rooftile', wallKind: 'plaster', wallColor: cols[i], over: 0.3 }); r.position.y = hh + 0.4; hs.add(r);
        for (const s of [-1, 1]) at(hs, K.window(0.7, 1.15, { shutters: [0x2e7a52, 0x2f4b6e, 0x7a3a2a][i], curtain: '#fff4dc', seed: i + s + 1 }), s * hw * 0.24, 4.0, d / 2 + 0.02);
        if (i !== Math.floor(n / 2)) at(hs, K.window(0.9, 1.3, { shutters: [0x2e7a52, 0x2f4b6e, 0x7a3a2a][i], curtain: '#fff4dc', seed: i }), 0, 1.75, d / 2 + 0.02);
        const aw = K.awning(hw - 0.6, 0.9, [0x2e7a52, 0xc0392b, 0x2f4b6e][i], 0xfff8ec); aw.position.set(0, 2.75, d / 2 + 0.1); hs.add(aw);
        for (const y of [1.75, 4.0]) at(hs, K.window(0.8, 1.1, { box: false, curtain: '#fff4dc' }), 0, y, -d / 2 - 0.02, PI);
      }
      at(g, K.vines(h - 1.6, 1.6, 0xffffff), -w / 2 + 0.4, 0.4, d / 2 + 0.05); at(g, K.vines(h - 2.2, 1.4, 0xff8fb1), w / 2 - 0.5, 0.4, d / 2 + 0.05);
      at(g, K.balcony(1.8, 0.5, 0x2a2a2a, { flowers: true }), 0, 3.15, d / 2 + 0.02);
      const dr = K.door(1.2, 2.3, 0x2e4a5a, { frame: 0xffffff, matColor: 0xc0392b }); dr.position.set(0, 0.42, d / 2 + 0.05); g.add(dr);
      g.add(tbox(w + 1.6, 0.06, 2.2, 'cobble', 0xe0d8cc, 0, 0.0, d / 2 + 1.2, 0.01, 1.3));
      for (const x of [-w / 2 + 0.6, w / 2 - 0.6]) { const pl = K.planter(0xc87a4a, 0xff6f86); pl.scale.setScalar(0.85); pl.position.set(x, 0.06, d / 2 + 0.6); g.add(pl); }
      at(g, bike(0x2f4b6e), w / 2 + 0.8, 0.06, d / 2 + 0.6, PI / 2);
    },
    tudor: (g, w, d, h) => {
      const hh = h - 2.4, ROOF = 0x5a4a44;
      g.add(K.base(w, d, 0.5, 0xb8b0a4, 'stone'));
      g.add(tbox(w, 1.1, d, 'brick', 0xb8664a, 0, 0.4, 0, 0.04, 0.9));
      g.add(tbox(w, hh - 1.1, d, 'timber', 0xf6efe0, 0, 1.5, 0, 0.04, 2.6));
      const r = K.gable(w, d, 3.0, ROOF, { kind: 'shingle', wallKind: 'timber', wallColor: 0xf6efe0, over: 0.6 }); r.position.y = hh + 0.4; g.add(r);
      // 앞쪽 뾰족 박공 날개
      const wing = new THREE.Group(); wing.position.set(-w / 4, 0, d / 2); g.add(wing);
      wing.add(tbox(w / 2 - 0.4, hh, 1.2, 'timber', 0xf6efe0, 0, 0.4, 0.3, 0.04, 2.6)); wing.add(tbox(w / 2 - 0.4, 1.1, 1.24, 'brick', 0xb8664a, 0, 0.4, 0.3, 0.04, 0.9));
      const wr = frontGable(w / 2 - 0.3, 1.6, 2.6, ROOF, { kind: 'shingle', wallKind: 'timber', wallColor: 0xf6efe0, over: 0.3, gableWindow: false }); wr.position.set(0, hh + 0.4, 0.3); wing.add(wr);
      at(wing, K.window(1.6, 1.3, { box: true, curtain: '#fff0d0', frame: 0x3c3632, boxColor: 0x5a3a28 }), 0, 2.2, 0.92);
      at(wing, K.window(1.0, 0.9, { box: false, curtain: '#fff0d0', frame: 0x3c3632 }), 0, hh + 1.2, 0.92);
      const dr = K.door(1.15, 2.3, 0x5a2a20, { frame: 0x3c3632, arch: true, matColor: 0x8a6a3a }); dr.position.set(w / 4 - 0.2, 0.45, d / 2 + 0.05); g.add(dr);
      at(g, K.window(0.9, 1.1, { box: true, curtain: '#fff0d0', frame: 0x3c3632, boxColor: 0x5a3a28 }), w / 2 - 0.8, 2.2, d / 2 + 0.02);
      for (const s of [-1, 1]) at(g, K.window(0.9, 1.1, { box: false, curtain: '#fff0d0', frame: 0x3c3632 }), s * (w / 2 + 0.02), 2.2, 0, s * PI / 2);
      at(g, K.chimney(2.8, 0xa85a44), w / 2 - 0.9, hh + 0.3, -d / 4);
      at(g, K.vines(hh - 0.5, 1.2, 0xff6f86), w / 2 - 0.2, 0.4, d / 2 + 0.05);
      at(g, wallLamp(), w / 4 + 0.7, 2.3, d / 2 + 0.05);
      for (let i = 0; i < 6; i++) g.add(M(sphere(0.22, 8, 6), tm('leaf', 0x4e8e3e), -w / 2 + 0.4 + i * 0.5, 0.3, d / 2 + 1.75));
    },
    beach: (g, w, d, h) => {
      const COL = [0x9ad8e0, 0xffd0c0, 0xfff0a8][Math.abs(Math.round(w * 7 + d)) % 3], hh = h - 2.4;
      // 기둥 위 데크 (고상식) + 계단
      g.add(tbox(w + 2.0, 0.2, d + 2.4, 'plank', 0xd8c4a0, 0, 0.75, 0.5, 0.02, 0.5));
      for (const x of [-w / 2 - 0.8, 0, w / 2 + 0.8]) for (const z of [-d / 2 - 0.6, d / 2 + 1.5]) g.add(M(cyl(0.12, 0.14, 0.9, 8), tm('bark', 0x8a6a4a), x, 0.45, z));
      for (let i = 0; i < 4; i++) g.add(tbox(1.6, 0.12, 0.35, 'plank', 0xd8c4a0, 0, 0.6 - i * 0.18, d / 2 + 1.9 + i * 0.32, 0.02, 0.5));
      g.add(tbox(w, hh, d, 'siding', COL, 0, 0.95, 0, 0.04, 0.8));
      for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) g.add(M(box(0.22, hh, 0.22, 0.03), 0xffffff, x, 0.95 + hh / 2, z));
      const r = K.gable(w, d, 2.1, 0xf8f8f4, { kind: 'metal', wallKind: 'siding', wallColor: COL, over: 0.6, ridge: 0xe0e0dc }); r.position.y = hh + 0.95; g.add(r);
      // 데크 난간 · 셔터 창 · 해먹 · 서핑보드 · 문
      for (const s of [-1, 1]) { const rl = new THREE.Group(); for (let i = 0; i <= 8; i++) rl.add(M(box(0.05, 0.7, 0.05, 0.01), 0xffffff, -w / 4 + 0.6 + i * (w / 2 - 1.8) / 8 * 0.9, 0.35, 0)); rl.add(M(box(w / 2 - 1.2, 0.07, 0.08, 0.01), 0xffffff, -w / 4 + 0.6 + (w / 2 - 1.8) * 0.45, 0.72, 0)); rl.position.set(s * (w / 4 + 0.6) - (-w / 4 + 0.6 + (w / 2 - 1.8) * 0.45) + 0, 0.85, d / 2 + 1.6); g.add(rl); }
      for (const s of [-1, 1]) at(g, K.window(1.1, 1.3, { shutters: 0xffffff, curtain: '#ffffff', frame: 0xffffff, seed: s > 0 ? 1 : 3 }), s * (w / 2 - 1.3), 2.6, d / 2 + 0.02);
      const dr = K.door(1.2, 2.2, 0xffffff, { frame: 0xffffff, matColor: 0x4fc1e9 }); dr.position.set(0, 0.95, d / 2 + 0.05); g.add(dr);
      for (let i = 0; i < 3; i++) { const sb = M(sphere(0.5, 14, 8), [0xff8a5a, 0xffd84a, 0x4fc1e9][i]); sb.scale.set(0.42, 2.2, 0.08); sb.position.set(w / 2 + 0.5 + i * 0.32, 1.95, d / 2 + 0.6); sb.rotation.z = -0.12; g.add(sb); }
      const hm = new THREE.Group(); hm.add(M(geo('bhHam', () => { const c = new THREE.CylinderGeometry(0.6, 0.6, 2.0, 12, 1, true, PI * 0.6, PI * 0.8); return c; }), cm('bhHamM', () => new THREE.MeshLambertMaterial({ map: AC.stripe('#ff8a5a', '#ffffff'), side: THREE.DoubleSide }))).rotateZ(PI / 2)); at(g, hm, -w / 2 + 1.6, 1.85, d / 2 + 1.0);
      for (const x of [-w / 2 - 0.6, w / 2 + 0.7]) { const pl = K.planter(0xffffff, 0xff6f86); pl.scale.setScalar(0.8); pl.position.set(x, 0.85, d / 2 + 1.2); g.add(pl); }
    },
  };
  const prevVilla = BLD.villa;
  BLD.villa = (p, ext) => {
    if (!VNEW[ext]) return prevVilla(p, ext);
    const g = new THREE.Group(); const { w, d, h } = p.bld;
    const facing = p.plot ? p.plot.doorSide : 1;
    const inner = new THREE.Group(); if (facing < 0) inner.rotation.y = PI; g.add(inner);
    VNEW[ext](inner, w, d, h);
    const mb = new THREE.Group(); mb.position.set(w / 2 + 1, 0, d / 2 + 1.6);
    mb.add(M(cyl(0.06, 0.06, 1, 6), 0x8a5a3b, 0, 0.5, 0)); mb.add(M(box(0.45, 0.35, 0.3, 0.08), 0xff6f61, 0, 1.1, 0)); inner.add(mb);
    if (p.bld.player) { const s = PM.sign('🏡 ' + (FM.Sim.get() ? FM.Sim.get().player.name : '플레이어') + '의 집', 4, 0.9, '#ffffff', '#3b2b20'); s.position.set(0, h + 0.8, d / 2); inner.add(s); }
    g.userData.theme = PM.VILLA_THEMES[ext].name;
    return g;
  };

  // ---------------------------------------------------------
  // 접지 그림자 (AO) — 건물 둘레가 땅에 붙어 보이게
  // ---------------------------------------------------------
  let aoMat = null;
  PM.aoShadow = (w, d) => {
    if (!aoMat) {
      const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
      x.filter = 'blur(10px)'; x.fillStyle = 'rgba(0,0,0,1)'; x.fillRect(22, 22, 84, 84);
      const t = new THREE.CanvasTexture(c);
      aoMat = new THREE.MeshBasicMaterial({ map: t, color: 0x1a1410, transparent: true, opacity: 0.42, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
    }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.45 + 2, d * 1.45 + 2), aoMat); m.rotation.x = -PI / 2; m.renderOrder = 1; m.userData.noBake = true; return m;
  };
})();
