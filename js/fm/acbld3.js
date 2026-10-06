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
  // 🍣 회전초밥 (일본 거리 상점) / 🥟 홍등반점 (중국 누각)
  // =========================================================
  function sushiShop(p) {
    const g = new THREE.Group(); const { w, d } = p.bld;
    const ROOF = 0x3c3f46, WOOD = 0x7a5234, PL = 0xead6b8;
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

  // ---------------------------------------------------------
  // 일본 정원 (참고: 검은 기와 담장 · 흰 회벽 · 돌 기단 · 연못 & 아치 나무다리 · 석등 · 분재 선반 · 소나무)
  // ---------------------------------------------------------
  function kawaraWall(len, h = 1.5) {
    const g = new THREE.Group();
    g.add(tbox(len, 0.45, 0.42, 'ashlar', 0x8a8682, 0, 0, 0, 0.03, 0.8));
    g.add(tbox(len, h - 0.45, 0.34, 'plaster', 0xf2ece0, 0, 0.45, 0, 0.03, 1.4));
    const cap = new THREE.Group(); cap.position.y = h; g.add(cap);
    for (const s of [-1, 1]) { const pv = new THREE.Group(); pv.rotation.x = s * 0.5; cap.add(pv); pv.add(tbox(len + 0.1, 0.07, 0.42, 'jptile', 0x34373c, 0, 0, s * 0.18, 0.02, 0.6)); }
    cap.add(M(box(len + 0.12, 0.12, 0.14, 0.03), 0x26282c, 0, 0.14, 0));
    return g;
  }
  function archBridge(len = 3.4, wd = 1.3, rise = 0.55) {
    const g = new THREE.Group(); const WD = tm('plank', 0xc8823a), n = 12;
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, x = -len / 2 + t * len, y = Math.sin(t * PI) * rise + 0.3, a = Math.cos(t * PI) * rise * PI / len; const pl = M(box(len / n + 0.02, 0.08, wd, 0.01), WD, x, y, 0); pl.rotation.z = a; g.add(pl); }
    for (const z of [-wd / 2, wd / 2]) {
      const pts = []; for (let t = 0; t <= 1.0001; t += 0.1) pts.push(new THREE.Vector3(-len / 2 + t * len, Math.sin(t * PI) * rise + 1.0, z));
      g.add(M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.05, 6), WD));
      for (let i = 0; i <= 4; i++) { const t = i / 4; g.add(M(cyl(0.06, 0.07, 0.75, 8), WD, -len / 2 + t * len, Math.sin(t * PI) * rise + 0.65, z)); g.add(M(sphere(0.08, 8, 6), 0x2a2a2a, -len / 2 + t * len, Math.sin(t * PI) * rise + 1.06, z)); }
    }
    return g;
  }
  function bonsaiPine(s = 1) {
    const g = new THREE.Group(); const bark = tm('bark', 0x5a4a3a), lf = tm('leaf', 0x2f6a3a);
    const t1 = M(cyl(0.12 * s, 0.26 * s, 1.8 * s, 8), bark, 0.2 * s, 0.9 * s, 0); t1.rotation.z = -0.35; g.add(t1);
    const t2 = M(cyl(0.08 * s, 0.13 * s, 1.4 * s, 8), bark, 0.75 * s, 2.0 * s, 0); t2.rotation.z = 0.6; g.add(t2);
    for (const [x, y, z, r] of [[1.3, 2.4, 0.2, 0.9], [0.1, 2.9, -0.2, 0.8], [-0.6, 2.2, 0.4, 0.7], [1.0, 3.2, -0.3, 0.6], [-0.2, 1.7, -0.5, 0.55]]) { const p = M(sphere(1, 12, 8), lf, x * s, y * s, z * s); p.scale.set(r * s, r * 0.38 * s, r * 0.85 * s); g.add(p); }
    return g;
  }
  function bonsaiShelf() {
    const g = new THREE.Group(); g.add(tbox(2.2, 0.08, 0.55, 'plank', 0xb87a48, 0, 0.5, 0, 0.01, 0.5)); for (const x of [-1, 1]) g.add(M(box(0.08, 0.5, 0.5, 0.01), 0x8a5a34, x, 0.25, 0));
    for (let i = 0; i < 4; i++) { const x = -0.8 + i * 0.53; g.add(M(box(0.34, 0.12, 0.24, 0.02), [0xf2ece0, 0x8a3a2a, 0x3a5a7a, 0xf2ece0][i], x, 0.64, 0)); g.add(M(cyl(0.02, 0.03, 0.22, 5), 0x5a4a3a, x, 0.8, 0)); const c = M(sphere(0.15, 8, 6), tm('leaf', 0x3a7a3a), x + 0.05, 0.92, 0); c.scale.y = 0.5; g.add(c); g.add(M(sphere(0.1, 8, 6), tm('leaf', 0x4a8a44), x - 0.08, 0.86, 0.02)); }
    return g;
  }
  function jpGarden(g, w, d) {
    const X = w / 2 + 1.4, ZB = -d / 2 - 0.6, ZF = d / 2 + 5.5;
    for (const sx of [-1, 1]) { const wl = kawaraWall(ZF - ZB); wl.rotation.y = PI / 2; wl.position.set(sx * X, 0.02, (ZF + ZB) / 2); g.add(wl); }
    const back = kawaraWall(2 * X); back.position.set(0, 0.02, ZB); g.add(back);
    for (const sx of [-1, 1]) { const len = X - 1.5, fw = kawaraWall(len); fw.position.set(sx * (1.5 + len / 2), 0.02, ZF); g.add(fw); const gp = M(box(0.3, 2.2, 0.3, 0.03), 0x2a1c14, sx * 1.5, 1.1, ZF); g.add(gp); }
    g.add(M(box(3.4, 0.3, 0.4, 0.03), 0x2a1c14, 0, 2.2, ZF)); const gr = pent(3.8, 0.6, 0x34373c, 'jptile', 0.3); gr.position.set(0, 2.42, ZF - 0.3); g.add(gr);
    // 연못 + 아치 다리 (왼쪽)
    const pd = pond(1.7); pd.position.set(-3.6, 0.0, d / 2 + 2.7); pd.scale.set(1.25, 1, 0.9); g.add(pd);
    at(g, archBridge(3.6, 1.1, 0.5), -3.6, 0.0, d / 2 + 2.7);
    // 돌바닥 · 징검돌 (문 → 대문)
    for (let i = 0; i < 9; i++) { const st = M(cyl(0.34, 0.38, 0.08, 7), tm('stone', 0x8a8682), (i % 2 ? 0.3 : -0.3), 0.06, d / 2 + 1.0 + i * 0.52); st.rotation.y = i; g.add(st); }
    // 석등 · 분재 선반 · 소나무 · 흰 꽃 덤불 · 벤치
    at(g, stoneLantern(), -X + 0.8, 0.06, d / 2 + 4.6); at(g, stoneLantern(), X - 0.8, 0.06, -d / 2 + 0.6);
    at(g, bonsaiShelf(), 3.0, 0.06, d / 2 + 4.7);
    at(g, bonsaiPine(1.05), X - 1.6, 0.06, d / 2 + 2.6);
    if (FM.Flora) for (const [x, z] of [[-1.6, d / 2 + 4.5], [-5.6, d / 2 + 1.2], [1.6, d / 2 + 1.4]]) FM.Flora.bush({ add: o => { g.add(o); return o; } }, ['daisy', 'cosmos'], [0xffffff, 0xf4f0ff], x, z, 0.42, 9, 0.4, x);
    const bn = new THREE.Group(); bn.add(tbox(1.8, 0.08, 0.5, 'plank', 0xb87a48, 0, 0.45, 0, 0.01, 0.5)); for (const x of [-0.75, 0.75]) bn.add(M(box(0.08, 0.45, 0.45, 0.01), 0x8a5a34, x, 0.22, 0)); at(g, bn, X - 0.6, 0.06, d / 2 + 0.8, -PI / 2);
    // 정원 바닥 이끼 + 판석
    const moss = M(geo('jpMoss' + w, () => new THREE.PlaneGeometry(2 * X - 0.4, ZF - d / 2 - 0.3)), 0x6a8a4a, 0, 0.05, (ZF + d / 2) / 2); moss.rotation.x = -PI / 2; g.add(moss);
  }

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
    jpGarden(g, w, d);
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
  // 📚 도서관 & 북카페 — 돌 아치 회랑 테라스 건물 (참고: 돌 아치 1층 · 테라스 난간 · 파란 슬레이트 지붕 + 주황 기와 박공 · 발코니 꽃상자 · 담쟁이)
  // =========================================================
  const bookWin = () => shopMat('bookWin', (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a2418'); gr.addColorStop(1, '#8a5a34'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (let r = 0; r < 4; r++) { c.fillStyle = '#2a1810'; c.fillRect(0, 20 + r * 26, w, 3); for (let i = 0; i < 40; i++) { c.fillStyle = ['#c84a3a', '#3a6aa8', '#e8c060', '#4a8a5a', '#f4ead8', '#8a4a8a'][(i + r) % 6]; c.fillRect(2 + i * 6.3, 6 + r * 26, 5, 14 - (i % 3) * 2); } }
    c.fillStyle = 'rgba(255,220,150,0.45)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(40 + i * 88, 10, 7, 0, PI * 2); c.fill(); }
  }, [1, 0.72, 0.4]);
  function stoneArch(wd, ht, stone) {
    const g = new THREE.Group(); const r = wd / 2;
    g.add(M(box(wd, ht - r, 0.05, 0.01), bookWin(), 0, (ht - r) / 2, 0.02));
    const top = M(geo('arTop' + wd, () => new THREE.CircleGeometry(r, 20, 0, PI)), bookWin(), 0, ht - r, 0.02); g.add(top);
    const ring = M(geo('arRing' + wd, () => new THREE.TorusGeometry(r + 0.12, 0.16, 8, 20, PI)), tm('ashlar', stone), 0, ht - r, 0.12); g.add(ring);
    for (const s of [-1, 1]) g.add(tbox(0.3, ht - r, 0.3, 'ashlar', stone, s * (r + 0.12), 0, 0.12, 0.03, 0.8));
    return g;
  }
  // 흰 돌 테두리 아치창 (책장이 비치고 밤엔 불)
  const B3bike = typeof bike === 'function' ? bike : null;
  function libArch(wd, ht) {
    const g = new THREE.Group(); const r = wd / 2;
    g.add(M(box(wd, ht - r, 0.05, 0.01), bookWin(), 0, (ht - r) / 2, 0.02));
    g.add(M(geo('arTop' + wd, () => new THREE.CircleGeometry(r, 20, 0, PI)), bookWin(), 0, ht - r, 0.02));
    g.add(M(geo('lbRing' + wd, () => new THREE.TorusGeometry(r + 0.1, 0.12, 8, 20, PI)), 0xf6f2ea, 0, ht - r, 0.1));
    for (const s of [-1, 1]) g.add(M(box(0.2, ht - r, 0.2, 0.02), 0xf6f2ea, s * (r + 0.1), (ht - r) / 2, 0.1));
    g.add(M(box(wd + 0.5, 0.14, 0.32, 0.02), 0xf6f2ea, 0, -0.05, 0.14));
    g.add(M(box(0.34, 0.42, 0.2, 0.02), 0xf6f2ea, 0, ht + 0.12, 0.12));   // 쐐기돌
    for (let i = 1; i < 3; i++) g.add(M(box(0.04, ht - r, 0.03, 0.005), 0xf6f2ea, -r + i * wd / 3, (ht - r) / 2, 0.06));
    return g;
  }
  function column(h, c = 0xfbf8f2) {
    const g = new THREE.Group();
    g.add(M(box(0.62, 0.22, 0.62, 0.02), c, 0, 0.11, 0)); g.add(M(cyl(0.26, 0.3, 0.18, 16), c, 0, 0.3, 0));
    g.add(M(geo('colSh' + h, () => new THREE.CylinderGeometry(0.22, 0.26, h - 0.8, 16)), tm('marble', c), 0, 0.39 + (h - 0.8) / 2, 0));
    g.add(M(cyl(0.3, 0.24, 0.2, 16), c, 0, h - 0.32, 0)); g.add(M(box(0.66, 0.16, 0.66, 0.02), c, 0, h - 0.12, 0));
    return g;
  }
  function owlStatue() {
    const g = new THREE.Group(), S2 = 0xc8c4bc;
    g.add(tbox(0.7, 0.9, 0.7, 'ashlar', 0xb8b4ac, 0, 0, 0, 0.03, 0.6));
    g.add(M(sphere(0.32, 14, 10), tm('stone', S2), 0, 1.22, 0)).scale.set(1, 1.15, 0.9);
    g.add(M(sphere(0.24, 14, 10), tm('stone', S2), 0, 1.62, 0.02));
    for (const s of [-1, 1]) { g.add(M(sphere(0.08, 10, 8), 0xf4f0e8, s * 0.1, 1.66, 0.21)); g.add(M(sphere(0.035, 8, 6), 0x2a2a2a, s * 0.1, 1.66, 0.28)); g.add(M(geo('owlEar', () => new THREE.ConeGeometry(0.07, 0.16, 6)), tm('stone', S2), s * 0.15, 1.84, 0)); }
    g.add(M(geo('owlBeak', () => new THREE.ConeGeometry(0.04, 0.1, 6)), 0xd8a848, 0, 1.58, 0.24).rotateX(PI / 2));
    g.add(M(box(0.34, 0.08, 0.26, 0.01), 0x3a5a9a, 0, 1.0, 0.24));   // 펼친 책
    return g;
  }
  BLD.library = (p) => {
    const g = new THREE.Group(); const { w, d } = p.bld;
    const BRICK = 0xc4694a, WH = 0xf6f2ea, SLATE = 0x4a5a72, COPPER = 0x5ab8a0, H1 = 3.6, H2 = 3.2, TOP = 0.6 + H1 + H2;
    g.add(K.base(w, d, 0.62, 0xb8b2a6, 'ashlar'));
    g.add(tbox(w, H1 + H2, d, 'brick', BRICK, 0, 0.6, 0, 0.04, 1.3));
    // 흰 띠 · 코니스 · 모서리 돌
    g.add(M(box(w + 0.16, 0.24, d + 0.16, 0.02), WH, 0, 0.6 + H1, 0));
    g.add(M(box(w + 0.4, 0.34, d + 0.4, 0.03), WH, 0, TOP + 0.05, 0)); g.add(M(box(w + 0.2, 0.5, d + 0.2, 0.03), WH, 0, TOP - 0.3, 0));
    for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) for (let i = 0; i < 8; i++) g.add(M(box(i % 2 ? 0.56 : 0.42, 0.34, i % 2 ? 0.42 : 0.56, 0.02), WH, x, 0.8 + i * 0.86, z));
    // 1층 큰 아치창 4 · 2층 아치창 6 (책장이 비침)
    for (const x of [-6.0, -3.6, 3.6, 6.0]) at(g, libArch(1.7, 2.7), x, 0.95, d / 2 + 0.02);
    for (const x of [-6.0, -3.6, -1.2, 1.2, 3.6, 6.0]) at(g, libArch(1.3, 2.1), x, 0.6 + H1 + 0.45, d / 2 + 0.02);
    for (const s of [-1, 1]) for (const z of [-3.2, 0, 3.2]) { const a = libArch(1.4, 2.5); a.rotation.y = s * PI / 2; a.position.set(s * (w / 2 + 0.02), 1.0, z); g.add(a); }
    // 슬레이트 모임지붕 + 가운데 청동 돔 (창 달린 원통 위) + 랜턴 & 첨탑
    const rf = K.hip(w + 0.6, d + 0.6, 2.4, SLATE, 'rooftile'); rf.position.y = TOP + 0.2; g.add(rf);
    const dm = new THREE.Group(); dm.position.set(0, TOP + 1.4, 0.6); g.add(dm);
    dm.add(M(cyl(2.3, 2.4, 1.8, 24), WH, 0, 0.9, 0));
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; const wn = M(box(0.42, 0.9, 0.06, 0.02), glow(0xffe0a0), Math.sin(a) * 2.36, 0.95, Math.cos(a) * 2.36); wn.rotation.y = a; wn.userData.noBake = true; dm.add(wn); dm.add(M(box(0.16, 1.5, 0.16, 0.02), WH, Math.sin(a + PI / 12) * 2.4, 0.9, Math.cos(a + PI / 12) * 2.4)); }
    dm.add(M(cyl(2.55, 2.55, 0.2, 24), WH, 0, 1.85, 0));
    dm.add(M(geo('libDome', () => new THREE.SphereGeometry(2.35, 28, 14, 0, PI * 2, 0, PI / 2)), tm('metal', COPPER), 0, 1.92, 0));
    for (let i = 0; i < 12; i++) { const rib = M(geo('libRib', () => new THREE.TorusGeometry(2.37, 0.04, 6, 20, PI / 2)), 0x3a8a78, 0, 1.92, 0); rib.rotation.set(0, i / 12 * PI * 2, PI / 2); rib.rotation.order = 'YZX'; dm.add(rib); }
    dm.add(M(cyl(0.45, 0.5, 0.7, 12), WH, 0, 4.55, 0)); dm.add(M(geo('libLan', () => new THREE.ConeGeometry(0.55, 0.6, 12)), tm('metal', COPPER), 0, 5.2, 0)); dm.add(M(cyl(0.03, 0.03, 0.9, 6), 0xd8b040, 0, 5.9, 0)); dm.add(M(sphere(0.1, 8, 6), 0xd8b040, 0, 6.35, 0));
    const lan = M(cyl(0.35, 0.35, 0.5, 12), glow(0xffd890), 0, 4.55, 0); lan.userData.noBake = true; dm.add(lan);
    // 입구 포르티코: 흰 기둥 4 · 엔타블러처 · 삼각 박공 (책 문장) · 넓은 계단
    const po = new THREE.Group(); po.position.set(0, 0.6, d / 2); g.add(po);
    const ch = H1 + 0.9, pz = 1.9;
    po.add(tbox(6.8, 0.2, pz + 0.4, 'marble', 0xece6da, 0, -0.18, pz / 2, 0.02, 1));
    for (const x of [-2.7, -0.95, 0.95, 2.7]) at(po, column(ch), x, 0, pz);
    po.add(M(box(6.6, 0.5, pz + 0.6, 0.03), WH, 0, ch + 0.25, pz / 2));
    const sg = PM.sign('📚 시립 도서관  ·  CITY LIBRARY', 5.6, 0.42, '#3a5a9a', '#fff8e8'); sg.position.set(0, ch + 0.25, pz + 0.32); po.add(sg);
    const tri = new THREE.Shape(); tri.moveTo(-3.5, 0); tri.lineTo(3.5, 0); tri.lineTo(0, 1.5); tri.lineTo(-3.5, 0);
    const ped = M(geo('libPed', () => new THREE.ExtrudeGeometry(tri, { depth: 0.5, bevelEnabled: false })), WH, 0, ch + 0.5, pz - 0.3); po.add(ped);
    const tri2 = new THREE.Shape(); tri2.moveTo(-2.9, 0.18); tri2.lineTo(2.9, 0.18); tri2.lineTo(0, 1.22); tri2.lineTo(-2.9, 0.18);
    po.add(M(geo('libPed2', () => new THREE.ExtrudeGeometry(tri2, { depth: 0.04, bevelEnabled: false })), 0x9ab8d8, 0, ch + 0.5, pz + 0.21));
    const emb = new THREE.Group(); emb.add(M(cyl(0.42, 0.42, 0.08, 20), 0xd8b040).rotateX(PI / 2)); emb.add(M(box(0.5, 0.34, 0.06, 0.02), 0xfbf8f2, 0, 0, 0.06)); emb.add(M(box(0.02, 0.34, 0.07, 0.005), 0x3a5a9a, 0, 0, 0.08)); emb.position.set(0, ch + 1.05, pz + 0.28); po.add(emb);
    const dr = K.door(1.8, 2.7, 0x5a3a24, { frame: WH, arch: true, lamp: false, matColor: 0x8a2a2a }); dr.position.set(0, 0, 0.06); po.add(dr);
    for (let i = 0; i < 4; i++) g.add(tbox(6.4 - i * 0.3, 0.16, 0.5, 'marble', 0xe4ded2, 0, 0.6 - 0.16 * (i + 1), d / 2 + pz + 0.45 + i * 0.45, 0.02, 1));
    // 현수막 (기둥 사이) · 부엉이 석상 · 반납함 · 자전거 거치대
    for (const [x, t, c] of [[-1.82, '📖 READ', '#c4694a'], [1.82, '✨ 독서 주간', '#3a5a9a']]) { const bn = PM.sign(t, 0.7, 1.8, c, '#ffffff'); bn.position.set(x, ch - 1.3, pz + 0.05); po.add(bn); }
    for (const s of [-1, 1]) at(g, owlStatue(), s * 3.9, 0.06, d / 2 + pz + 1.6, -s * 0.2);
    const ret = new THREE.Group(); ret.add(M(box(0.8, 1.1, 0.6, 0.12), 0x3a5a9a, 0, 0.55, 0)); ret.add(M(box(0.5, 0.06, 0.04, 0.01), 0x1a1a1a, 0, 0.85, 0.31)); const rs = PM.sign('📕 반납함', 0.62, 0.22, '#3a5a9a', '#ffffff'); rs.position.set(0, 0.62, 0.31); ret.add(rs); at(g, ret, w / 2 - 1.0, 0.06, d / 2 + 1.4);
    if (B3bike) at(g, B3bike(0xd85a3a), -w / 2 + 1.4, 0.06, d / 2 + 1.6, 0.3);
    // 독서 정원: 회양목 울타리 · 꽃밭 · 벤치 · 가로등
    for (const s of [-1, 1]) {
      const hx = s * (w / 2 - 2.2);
      g.add(M(box(3.4, 0.7, 0.7, 0.2), tm('leaf', 0x4a8a3a), hx, 0.41, d / 2 + 3.4));
      if (FM.Flora) { const fb = new THREE.Group(); FM.Flora.bush({ add: o => { fb.add(o); return o; } }, s < 0 ? ['tulip', 'rose'] : ['daisy', 'cosmos'], s < 0 ? [0xff4d5e, 0xff8fb1, 0xffffff] : [0xffffff, 0xffd84a, 0xb69cff], 0, 0, 0.9, 14, 1.0, s + 3); at(g, fb, hx, 0.06, d / 2 + 2.3); }
      const bn = new THREE.Group(); bn.add(tbox(1.6, 0.08, 0.45, 'plank', 0x9a6a44, 0, 0.45, 0, 0.01, 0.4)); bn.add(tbox(1.6, 0.4, 0.06, 'plank', 0x9a6a44, 0, 0.55, -0.2, 0.01, 0.4)); for (const q of [-0.7, 0.7]) bn.add(M(box(0.06, 0.48, 0.42, 0.01), 0x2a2a2e, q, 0.22, 0)); at(g, bn, s * (w / 2 + 1.3), 0.06, d / 2 - 1.5, -s * PI / 2);
    }
    for (const x of [-w / 2 - 0.4, w / 2 + 0.4]) { const lp = new THREE.Group(); lp.add(M(cyl(0.06, 0.09, 2.8, 8), 0x2a2a2e, 0, 1.4, 0)); lp.add(M(box(0.34, 0.42, 0.34, 0.03), glass(0xfff4d8), 0, 3.0, 0)); const b = M(sphere(0.1, 8, 6), glow(0xffd890), 0, 3.0, 0); b.userData.noBake = true; b.userData.lampBulb = true; lp.add(b); lp.add(M(geo('lbCap', () => new THREE.ConeGeometry(0.3, 0.2, 4)), 0x2a2a2e, 0, 3.3, 0).rotateY(PI / 4)); at(g, lp, x, 0.06, d / 2 + 2.6); }
    at(g, K.vines(4.0, 1.4, 0xffffff), -w / 2 + 0.2, 0.6, d / 2 + 0.06); at(g, K.vines(3.6, 1.2, 0xffffff), w / 2 - 0.2, 0.6, d / 2 + 0.06);
    return g;
  };

  // =========================================================
  // 🎮 오락실 앞 구멍가게 (참고: 쇼와 시대 동네 과자 가게 — 함석 처마 · 과자 진열장 · 레트로 오락기 · 빨간 의자 · 공중전화)
  // =========================================================
  const prevArcade = BLD.arcade;
  BLD.arcade = (p) => {
    const g = prevArcade(p); const { w, d } = p.bld;
    const st = new THREE.Group(); st.position.set(w / 2 - 3.2, 0.06, d / 2 + 1.5); g.add(st);
    st.add(tbox(4.4, 2.4, 1.2, 'yakisugi', 0xb89a7a, 0, 0, -0.3, 0.03, 1));
    const pr = pent(5.0, 1.5, 0x6a5a4a, 'corrug', 0.32); pr.position.set(0, 2.5, 0.25); st.add(pr);
    for (const y of [0.55, 1.05, 1.55]) { st.add(M(box(4.0, 0.05, 0.5, 0.01), 0x6a4a30, 0, y, 0.35)); for (let i = 0; i < 9; i++) { const x = -1.8 + i * 0.45; if (y > 1.4) { st.add(M(cyl(0.11, 0.11, 0.3, 10), glass(0xe8f8ff), x, y + 0.17, 0.35)); st.add(M(sphere(0.08, 6, 5), [0xff6f86, 0xffd84a, 0x8ee07a, 0x4fc1e9][i % 4], x, y + 0.12, 0.35)); st.add(M(cyl(0.12, 0.12, 0.05, 10), 0xd8282a, x, y + 0.34, 0.35)); } else st.add(M(box(0.34, 0.3, 0.3, 0.02), [0xff8a3a, 0x3a9aff, 0xffd84a, 0xff6f9a, 0x5ad06a][(i + Math.round(y * 3)) % 5], x, y + 0.16, 0.35)); } }
    const sg = PM.sign('駄菓子 · 추억의 구멍가게', 3.2, 0.42, '#f4ead8', '#8a2a1a'); sg.position.set(0, 2.25, 0.62); st.add(sg);
    for (let i = 0; i < 2; i++) { const cab = new THREE.Group(); cab.add(M(box(0.75, 1.55, 0.7, 0.04), i ? 0xf4f4f0 : 0xe84a4a, 0, 0.78, 0)); const sc = M(box(0.6, 0.45, 0.04, 0.01), glow(i ? 0x6ad8ff : 0xffd84a), 0, 1.15, 0.33); sc.rotation.x = -0.2; cab.add(sc); cab.add(M(box(0.7, 0.1, 0.35, 0.02), 0x2a2a2a, 0, 0.85, 0.3)); cab.add(M(sphere(0.05, 6, 5), 0xff3a3a, -0.15, 0.93, 0.35)); at(st, cab, -2.9 - i * 0.85, 0, 0.1); }
    const stool = new THREE.Group(); stool.add(M(cyl(0.2, 0.2, 0.06, 12), 0xd8282a, 0, 0.45, 0)); stool.add(M(cyl(0.03, 0.03, 0.45, 6), 0x9aa0a8, 0, 0.22, 0)); at(st, stool, -2.4, 0, 1.2);
    const ball = M(sphere(0.18, 12, 8), 0xffffff, -1.7, 0.18, 1.4); st.add(ball);
    const ph = new THREE.Group(); ph.add(M(box(0.5, 0.8, 0.45, 0.04), 0x3a2a20, 0, 0.4, 0)); ph.add(M(box(0.4, 0.45, 0.35, 0.06), 0xd8282a, 0, 1.05, 0)); at(st, ph, 2.6, 0, 0.3);
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

  FM.AB3 = { shopMat, shojiMat, martWin, lantern, noren, pent, frontGable, stoneLantern, wallLamp, bike, picket, pond, bonsaiPine, kawaraWall, archBridge, flare, blossomTree, nightMats };
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
