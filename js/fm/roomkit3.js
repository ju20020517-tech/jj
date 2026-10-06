/* =========================================================
 *  주민 방 스타일 키트 3 — 레퍼런스 사진 5종 (소품 무늬 · 텍스처까지 재현)
 *   kawaii  : 🎀 핑크 큐트 게이머 (핑크 줄무늬 벽 · 하트 체크 바닥 · 구름 침대 · 무지개 소파 · 토끼 러그 · 쌍둥이 별 러그 · 트리플 모니터)
 *   modern  : 🖤 다크 모던 라운지 (테라코타 벽 · 헤링본 마루 · 블랙 L소파 · 도시 야경 통창 · 선인장 · 검은 고양이)
 *  (roomkit4.js : 🍒 레드 깅엄 코티지 · 🌿 그린 인더스트리얼 · ⭐ 블루 별밤 아이방)
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, RK = FM.RoomKit;
  const { K, T, P, def, tmat, ctex, glow, glass, mesh, geo, f, M } = RK._h;
  const F = FM.FURN, PI = Math.PI, css = FM.PM.css;

  // ---------------------------------------------------------
  // 공용 그리기 도구 (다음 키트에서도 사용)
  // ---------------------------------------------------------
  const star = (g, x, y, r, ri = 0.45, n = 5, rot = -PI / 2) => { g.beginPath(); for (let i = 0; i < n * 2; i++) { const rr = i % 2 ? r * ri : r, a = rot + i / (n * 2) * PI * 2; i ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); };
  const heart = (g, x, y, s) => { g.beginPath(); g.moveTo(x, y + s * 0.35); g.bezierCurveTo(x - s * 0.9, y - s * 0.25, x - s * 0.4, y - s * 0.95, x, y - s * 0.4); g.bezierCurveTo(x + s * 0.4, y - s * 0.95, x + s * 0.9, y - s * 0.25, x, y + s * 0.35); g.closePath(); };
  const rrect = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  // 캔버스 무늬 재질 (불투명 · 램버트)
  const tm = (key, w, h, draw, extra) => tmat('k3' + key, () => ctex('k3' + key, w, h, draw), extra);
  // 모양대로 오린 재질 (러그 · 스티커 · 그림) — 투명 부분은 잘라냄
  const cut = new Map();
  const cm = (key, w, h, draw, basic) => { if (!cut.has(key)) { const map = ctex('k3c' + key, w, h, draw); cut.set(key, basic ? new THREE.MeshBasicMaterial({ map, transparent: true, alphaTest: 0.35 }) : FM.PM && new THREE.MeshLambertMaterial({ map, transparent: true, alphaTest: 0.35 })); } return cut.get(key); };
  const pic = (key, w, h, draw) => { if (!cut.has('p' + key)) cut.set('p' + key, new THREE.MeshBasicMaterial({ map: ctex('k3p' + key, w, h, draw) })); return cut.get('p' + key); };
  // 바닥에 까는 평면 (러그)
  const rug = (k, W, D, m, x = 0, z = 0, y = 0.012) => { const o = k.add(mesh(geo(`k3rug${W},${D}`, () => new THREE.PlaneGeometry(W, D)), m, x, y, z, false)); o.rotation.x = -PI / 2; o.receiveShadow = true; return o; };
  // 세워진 평면 (그림 · 화면)
  const plane = (k, W, H, m, x, y, z, ry = 0) => { const o = k.add(mesh(geo(`k3pl${W},${H}`, () => new THREE.PlaneGeometry(W, H)), m, x, y, z, false)); o.rotation.y = ry; return o; };
  // 별 입체
  const starGeo = (r, depth = 0.04, ri = 0.45) => geo(`k3star${r},${depth},${ri}`, () => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * ri : r, a = i / 10 * PI * 2 + PI / 2; i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.3, bevelSize: r * 0.08, bevelSegments: 2 }); });
  const star3 = (k, r, m, x, y, z, depth) => { const o = k.add(mesh(starGeo(r, depth), M(m), x, y, z)); return o; };
  const heartGeo = (s, depth = 0.05) => geo(`k3heart${s},${depth}`, () => { const h = new THREE.Shape(); h.moveTo(0, -s * 0.35); h.bezierCurveTo(-s * 0.9, s * 0.25, -s * 0.4, s * 0.95, 0, s * 0.4); h.bezierCurveTo(s * 0.4, s * 0.95, s * 0.9, s * 0.25, 0, -s * 0.35); return new THREE.ExtrudeGeometry(h, { depth, bevelEnabled: true, bevelThickness: depth * 0.4, bevelSize: s * 0.06, bevelSegments: 2 }); });
  RK._h3 = { star, heart, rrect, tm, cm, pic, rug, plane, starGeo, star3, heartGeo };

  // ---------------------------------------------------------
  // 벽지
  // ---------------------------------------------------------
  Object.assign(RK.WALLS, {
    pinkstripe: { tileW: 1.0, draw: (g, w, h) => {   // 핑크 · 연핑크 세로 줄무늬 + 하얀 핀 스트라이프 + 작은 도트
      for (let x = 0; x < w; x += 32) { g.fillStyle = (x / 32) % 2 ? '#fcd6de' : '#f5aabd'; g.fillRect(x, 0, 32, h); }
      g.fillStyle = 'rgba(255,255,255,0.75)'; for (let x = 0; x < w; x += 64) { g.fillRect(x + 3, 0, 2, h); g.fillRect(x + 27, 0, 2, h); }
      g.fillStyle = 'rgba(255,255,255,0.55)'; for (let y = 10; y < h; y += 22) for (let x = 48; x < w; x += 64) { g.beginPath(); g.arc(x, y + ((x / 64) % 2) * 11, 2.2, 0, 7); g.fill(); }
      g.fillStyle = '#fff4f6'; g.fillRect(0, h - 22, w, 22); g.fillStyle = '#f0c0cc'; g.fillRect(0, h - 22, w, 3);
    } },
    pinkdot: { tileW: 0.9, draw: (g, w, h) => {   // 핑크 바탕 흰 물방울 + 작은 하트
      g.fillStyle = '#f8c4d0'; g.fillRect(0, 0, w, h);
      for (let y = 12, r = 0; y < h - 24; y += 24, r++) for (let x = (r % 2) * 16 + 8; x < w; x += 32) { if ((x + y) % 5 === 0) { g.fillStyle = '#ff9ab4'; heart(g, x, y, 7); g.fill(); } else { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, 4.5, 0, 7); g.fill(); } }
      g.fillStyle = '#fff4f6'; g.fillRect(0, h - 22, w, 22); g.fillStyle = '#f0c0cc'; g.fillRect(0, h - 22, w, 3);
    } },
    terracotta: { tileW: 1.6, draw: (g, w, h) => {   // 테라코타 회벽 (미장 얼룩 · 은은한 그라데이션) + 짙은 걸레받이
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#a9694a'); gr.addColorStop(0.55, '#b87a58'); gr.addColorStop(1, '#9a5c40'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${i % 2 ? '255,230,210' : '70,30,20'},0.035)`; g.beginPath(); g.ellipse((i * 67) % w, (i * 131) % h, 10 + i % 22, 6 + i % 9, i, 0, 7); g.fill(); }
      g.fillStyle = '#2a201c'; g.fillRect(0, h - 16, w, 16);
    } },
    darkpanel: { tileW: 1.2, draw: (g, w, h) => {   // 짙은 월넛 판넬 + 블랙 스틸 몰딩
      g.fillStyle = '#3e2c24'; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 64) { g.fillStyle = `rgba(255,220,190,${0.03 + (x / 64 % 2) * 0.03})`; g.fillRect(x + 4, 0, 56, h); g.fillStyle = '#1c1614'; g.fillRect(x, 0, 4, h); g.strokeStyle = 'rgba(0,0,0,0.25)'; for (let y = 10; y < h; y += 9) { g.beginPath(); g.moveTo(x + 6, y); g.bezierCurveTo(x + 22, y + 3, x + 40, y - 3, x + 58, y + 1); g.stroke(); } }
      g.fillStyle = '#1c1614'; g.fillRect(0, h - 16, w, 16);
    } },
  });

  // ---------------------------------------------------------
  // 바닥재 (interior3d floorTex 확장)
  // ---------------------------------------------------------
  FM.FLOOR_DRAW = FM.FLOOR_DRAW || {};
  const tone = (c, k) => { const f = v => Math.min(255, Math.max(0, Math.round(v * k))); return `rgb(${f((c >> 16) & 255)},${f((c >> 8) & 255)},${f(c & 255)})`; };
  Object.assign(FM.FLOOR_DRAW, {
    heartcheck(g, w, h, c) {   // 핑크 · 크림 체크 타일, 핑크 칸에 하트 · 크림 칸에 레이스 무늬
      const s = 64;
      for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
        const dark = ((x + y) / s) % 2 === 0; g.fillStyle = dark ? tone(c, 1) : '#fdeef2'; g.fillRect(x, y, s, s);
        if (dark) { g.fillStyle = 'rgba(255,255,255,0.55)'; for (const [dx, dy] of [[16, 16], [48, 16], [16, 48], [48, 48]]) { heart(g, x + dx, y + dy + 3, 9); g.fill(); } }
        else { g.strokeStyle = 'rgba(240,150,180,0.45)'; g.lineWidth = 2; g.beginPath(); g.arc(x + s / 2, y + s / 2, 14, 0, 7); g.stroke(); for (let i = 0; i < 8; i++) { const a = i / 8 * 7; g.beginPath(); g.arc(x + s / 2 + Math.cos(a) * 20, y + s / 2 + Math.sin(a) * 20, 4, 0, 7); g.stroke(); } }
        g.fillStyle = 'rgba(200,120,140,0.25)'; g.fillRect(x, y, s, 1.5); g.fillRect(x, y, 1.5, s);
      }
    },
    herringbone(g, w, h, c) {   // 헤링본 원목 마루
      const L = 64, W = 16;
      for (let col = -6; col * W < w + L; col++) for (let row = -4; row * W * 2 < h + L; row++) {   // 가장자리까지 채워 이음매 없이 반복
        const odd = ((col % 2) + 2) % 2, dir = odd ? 1 : -1, cx = col * W, cy = row * W * 2 + odd * W;
        const k = 0.86 + ((((col * 7 + row * 13) % 6) + 6) % 6) * 0.05;
        g.save(); g.translate(cx, cy); g.rotate(dir * PI / 4); g.fillStyle = tone(c, k); g.fillRect(-L / 2, -W / 2, L, W);
        g.strokeStyle = 'rgba(60,30,10,0.35)'; g.lineWidth = 1.2; g.strokeRect(-L / 2, -W / 2, L, W);
        g.strokeStyle = 'rgba(90,50,20,0.12)'; g.beginPath(); g.moveTo(-L / 2 + 3, -2); g.bezierCurveTo(-8, 1, 8, -3, L / 2 - 3, 1); g.stroke(); g.restore();
      }
    },
    darkplank(g, w, h, c) {   // 짙은 보랏빛 월넛 긴 판재
      for (let y = 0; y < h; y += 32) for (let x = -((y / 32) % 4) * 32; x < w; x += 128) {   // 128 × 32 판재 → 256px 이음매 없음
        g.fillStyle = tone(c, 0.85 + ((((x + 128) / 32 + y / 32) % 5)) * 0.06); g.fillRect(x, y, 128, 32);
        g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1; for (let i = 0; i < 3; i++) { const gy = y + 8 + i * 8; g.beginPath(); g.moveTo(x + 4, gy); g.bezierCurveTo(x + 40, gy - 2, x + 80, gy + 3, x + 124, gy); g.stroke(); }
        g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(x, y, 2, 32); g.fillRect(x, y, 128, 1.5);
      }
    },
    blueplank(g, w, h, c) {   // 화이트워시 블루 판재 (결 · 옹이)
      for (let x = 0; x < w; x += 32) { g.fillStyle = tone(c, 0.92 + ((x / 32) % 3) * 0.05); g.fillRect(x, 0, 32, h); g.fillStyle = 'rgba(40,60,110,0.35)'; g.fillRect(x, 0, 1.5, h); for (let y = ((x / 32) % 4) * 60; y < h; y += 240) g.fillRect(x, y, 32, 1.5);
        g.strokeStyle = 'rgba(255,255,255,0.3)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x + 8 + i * 8, 0); g.bezierCurveTo(x + 4 + i * 8, h / 3, x + 12 + i * 8, h * 2 / 3, x + 8 + i * 8, h); g.stroke(); }
        g.fillStyle = 'rgba(60,80,130,0.25)'; g.beginPath(); g.ellipse(x + 16, (x * 7) % h, 3, 6, 0, 0, 7); g.fill(); }
    },
    gingerplank(g, w, h, c) {   // 허니 원목 마루 (판재마다 톤 · 결 · 못 자국, 이음매 없이 반복)
      for (let y = 0; y < h; y += 32) for (let x = -((y / 32) % 4) * 32; x < w; x += 128) {
        g.fillStyle = tone(c, 0.88 + ((((x + 128) / 32 + y / 32) % 4)) * 0.05); g.fillRect(x, y, 128, 32);
        g.strokeStyle = 'rgba(120,70,30,0.14)'; g.lineWidth = 1; for (let i = 0; i < 3; i++) { const gy = y + 8 + i * 8; g.beginPath(); g.moveTo(x + 4, gy); g.bezierCurveTo(x + 40, gy - 3, x + 80, gy + 3, x + 124, gy); g.stroke(); }
        g.fillStyle = 'rgba(90,50,20,0.35)'; g.fillRect(x, y, 2, 32); g.fillRect(x, y, 128, 1.5); g.fillStyle = 'rgba(60,30,10,0.4)'; for (const dx of [6, 120]) { g.beginPath(); g.arc(x + dx, y + 16, 1.4, 0, 7); g.fill(); }
      }
    },
  });
  Object.assign(FM.D.FLOOR_SOUND || {}, { heartcheck: '톡톡', herringbone: '삐걱', darkplank: '또각', blueplank: '삐걱', gingerplank: '삐걱' });

  // =========================================================
  // 🎀 1. 핑크 큐트 게이머
  // =========================================================
  const PINK = 0xf7a8c0, PINK2 = 0xffc8d8, CREAM = 0xfff6f0, WHITE = 0xfafafa;
  // 별 이불 (하양 바탕 노랑 · 핑크 · 하늘 별)
  const starQuilt = tm('starquilt', 256, 256, (g, w, h) => { g.fillStyle = '#fdfcff'; g.fillRect(0, 0, w, h); const cols = ['#ffd84a', '#ffb0c8', '#9ad8ff', '#ffe890']; for (let i = 0; i < 26; i++) { g.fillStyle = cols[i % 4]; star(g, (i * 97) % w, (i * 61 + (i % 3) * 20) % h, 8 + (i % 3) * 3); g.fill(); } g.strokeStyle = 'rgba(200,190,230,0.35)'; g.setLineDash([5, 4]); for (let x = 0; x < w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } g.setLineDash([]); });
  const rainbowCols = [0xff9ab0, 0xffc890, 0xfff0a0, 0xa8e8b0, 0x9ad0ff, 0xc8a8ff];

  def('k3_cloud_bed', '구름 별 침대 (무지개 헤드)', 'rest', 5200, 1.7, 2.3, g => {
    const k = K(g);
    k.b(1.6, 0.3, 2.2, 0xffd0dc, 0, 0.18, 0, 0.08);                                       // 핑크 프레임
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; k.s(0.26, 0xffffff, Math.cos(a) * 0.7, 0.38, Math.sin(a) * 0.98, 1, 0.55, 1); }   // 구름 테두리
    k.b(1.38, 0.2, 1.95, 0xffffff, 0, 0.42, 0, 0.1);
    k.b(1.42, 0.12, 1.35, starQuilt, 0, 0.55, 0.3, 0.08);                                // 별 이불
    for (let i = 0; i < 4; i++) k.s(0.2, 0xffffff, -0.5 + i * 0.33, 0.62, 1.0, 1, 0.45, 0.8);   // 이불 끝 구름 주름
    k.b(0.58, 0.14, 0.32, 0xfff4f8, -0.32, 0.6, -0.78, 0.07); k.b(0.58, 0.14, 0.32, 0xffe0ea, 0.32, 0.6, -0.78, 0.07);
    rainbowCols.forEach((c, i) => { const t = k.t(0.78 - i * 0.07, 0.04, c, 0, 0.55, -1.05, PI); t.scale.z = 0.8; });   // 무지개 아치
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) k.s(0.16 - i * 0.02, 0xffffff, sx * (0.78 - i * 0.12), 0.5 + i * 0.05, -1.02, 1, 0.8, 0.8);   // 무지개 끝 구름
    star3(k, 0.1, 0xffd84a, -0.35, 1.2, -1.1, 0.04); star3(k, 0.07, 0xffb0d0, 0.4, 1.05, -1.1, 0.04);
  }, { grade: 3, bed: { top: 0.6, headZ: -0.49, color: 0xfdfcff }, use: [{ pose: 'sleep', dx: 0, dz: 0, face: 0, act: 'sleep' }], tags: ['bed', 'plush'] });

  def('k3_bunny_rug', '핑크 토끼 얼굴 러그', 'misc', 900, 2.2, 2.0, g => {
    const k = K(g);
    rug(k, 2.2, 2.0, cm('bunnyrug', 256, 232, (c, w, h) => {
      c.fillStyle = '#f4a0b8'; c.beginPath(); c.ellipse(w / 2, h * 0.58, w * 0.47, h * 0.4, 0, 0, 7); c.fill();                  // 후드
      for (const sx of [-1, 1]) { c.save(); c.translate(w / 2 + sx * 58, h * 0.24); c.rotate(sx * 0.35); c.beginPath(); c.ellipse(0, -10, 30, 60, 0, 0, 7); c.fill(); c.fillStyle = '#ffe0ea'; c.beginPath(); c.ellipse(0, -6, 16, 42, 0, 0, 7); c.fill(); c.restore(); c.fillStyle = '#f4a0b8'; }
      c.fillStyle = '#fff8f8'; c.beginPath(); c.ellipse(w / 2, h * 0.64, w * 0.32, h * 0.27, 0, 0, 7); c.fill();                  // 얼굴
      c.fillStyle = '#3a2a2a'; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(w / 2 + sx * 30, h * 0.62, 5, 8, 0, 0, 7); c.fill(); }
      c.fillStyle = '#ffd24a'; c.beginPath(); c.ellipse(w / 2, h * 0.7, 7, 5, 0, 0, 7); c.fill();
      c.fillStyle = '#ffb8c8'; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(w / 2 + sx * 52, h * 0.7, 12, 7, 0, 0, 7); c.fill(); }
      c.fillStyle = '#ff6f9a'; c.save(); c.translate(w / 2 + 62, h * 0.36); for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(0, 0); c.lineTo(sx * 22, -12); c.lineTo(sx * 22, 12); c.closePath(); c.fill(); } c.beginPath(); c.arc(0, 0, 6, 0, 7); c.fill(); c.restore();
      c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 3; c.setLineDash([6, 5]); c.beginPath(); c.ellipse(w / 2, h * 0.58, w * 0.44, h * 0.37, 0, 0, 7); c.stroke();
    }));
  }, { flat: true, tags: ['plush'] });

  def('k3_twinstar_rug', '쌍둥이 별 러그', 'misc', 900, 2.0, 1.9, g => {
    const k = K(g);
    rug(k, 2.0, 1.9, cm('twinstar', 256, 244, (c, w, h) => {
      c.fillStyle = '#ffe070'; star(c, w / 2, h * 0.55, w * 0.5, 0.52); c.fill(); c.strokeStyle = '#f0c040'; c.lineWidth = 6; c.stroke();
      c.strokeStyle = '#fff4b0'; c.lineWidth = 3; c.setLineDash([7, 5]); star(c, w / 2, h * 0.55, w * 0.43, 0.52); c.stroke(); c.setLineDash([]);
      const kid = (x, y, hair, s) => { c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(x, y + 26 * s, 24 * s, 30 * s, 0, 0, 7); c.fill();        // 잠옷
        c.fillStyle = '#ffe8d8'; c.beginPath(); c.arc(x, y, 20 * s, 0, 7); c.fill();
        c.fillStyle = hair; c.beginPath(); c.arc(x, y - 6 * s, 21 * s, PI, 0); c.fill(); c.beginPath(); c.arc(x + 8 * s, y - 24 * s, 7 * s, 0, 7); c.fill();
        c.fillStyle = '#3a2a3a'; for (const sx of [-1, 1]) { c.beginPath(); c.arc(x + sx * 7 * s, y + 3 * s, 2.4 * s, 0, 7); c.fill(); }
        c.fillStyle = '#ffb0c0'; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(x + sx * 12 * s, y + 8 * s, 4 * s, 2.5 * s, 0, 0, 7); c.fill(); } };
      kid(w * 0.4, h * 0.5, '#8ad8e8', 1.1); kid(w * 0.6, h * 0.55, '#ffb0cc', 1.05);
    }));
  }, { flat: true, tags: ['plush'] });

  def('k3_rainbow_sofa', '무지개 구름 소파', 'rest', 3200, 2.0, 0.95, g => {
    const k = K(g);
    k.b(1.9, 0.3, 0.85, 0xffb8cc, 0, 0.25, 0.02, 0.1); k.b(1.7, 0.16, 0.7, 0xffc8d8, 0, 0.46, 0.08, 0.08);
    for (const x of [-0.42, 0.42]) k.b(0.8, 0.12, 0.62, 0xffd4e0, x, 0.56, 0.1, 0.06);
    k.b(1.9, 0.55, 0.2, 0xffb8cc, 0, 0.7, -0.33, 0.1);
    for (let i = 0; i < 6; i++) k.s(0.19, 0xffb8cc, -0.8 + i * 0.32, 1.0, -0.33, 1, 0.8, 0.7);          // 구름 등받이
    rainbowCols.forEach((c, i) => { const t = k.t(0.95 - i * 0.05, 0.035, c, 0, 0.7, -0.44, PI); t.scale.set(1, 0.42, 1); });
    for (const sx of [-1, 1]) { k.s(0.2, 0x9ad8e8, sx * 0.96, 0.5, 0.02, 0.7, 1.1, 1.3); star3(k, 0.12, 0xffe070, sx * 1.0, 0.9, -0.1, 0.05).rotation.y = sx * 0.4; }
    star3(k, 0.12, 0xc8a8ff, 0.5, 0.66, 0.2, 0.08).rotation.x = -0.6; k.s(0.11, 0xfff4a0, -0.45, 0.68, 0.18, 1.2, 0.8, 0.6);
    for (const x of [-0.85, 0.85]) k.c(0.04, 0.03, 0.1, 0xffffff, x, 0.05, 0.3);
  }, { use: [{ pose: 'sit', dx: -0.42, dz: 0.12, face: 0, act: 'sofa', seatH: 0.62 }, { pose: 'sit', dx: 0.42, dz: 0.12, face: 0, act: 'sofa', seatH: 0.62 }], tags: ['sofa'] });

  def('k3_pink_chandelier', '핑크 크리스탈 샹들리에', 'light', 2600, 1.1, 1.1, g => {
    const k = K(g); k.c(0.012, 0.012, 0.5, 0xd88aa8, 0, 2.78, 0); k.s(0.1, 0xf4a0c0, 0, 2.5, 0, 1, 1.3, 1); k.c(0.03, 0.1, 0.3, 0xf4a0c0, 0, 2.28, 0);
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2, x = Math.cos(a) * 0.42, z = Math.sin(a) * 0.42;
      const arm = k.t(0.21, 0.018, 0xf4a0c0, x / 2, 2.12, z / 2, PI); arm.rotation.set(0, -a, PI); k.c(0.06, 0.04, 0.05, 0xffc0d8, x, 2.14, z); k.c(0.022, 0.022, 0.12, 0xfff8fa, x, 2.23, z); k.s(0.025, glow(0xfff0c0), x, 2.32, z, 1, 1.5, 1);
      k.add(mesh(geo('k3crys', () => new THREE.OctahedronGeometry(0.03)), glass(0xffd0e8), x * 0.7, 1.98, z * 0.7)); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; k.add(mesh(geo('k3crys2', () => new THREE.OctahedronGeometry(0.04)), glass(0xffc0e0), Math.cos(a) * 0.2, 2.0 - (i % 2) * 0.06, Math.sin(a) * 0.2)).scale.y = 1.8; }
  }, { ceiling: true, tags: ['light', 'luxury'], lamp: [[0, 2.2, 0, 0xffd8e8, 1.1, 6]] });

  def('k3_white_triple_desk', '화이트 트리플 모니터 데스크', 'work', 3800, 1.9, 0.75, g => {
    const k = K(g);
    k.b(1.9, 0.05, 0.72, 0xfafafa, 0, 0.75, 0, 0.02); for (const x of [-0.88, 0.88]) { k.b(0.06, 0.73, 0.06, 0xf0f0f4, x, 0.37, -0.28); k.b(0.06, 0.73, 0.06, 0xf0f0f4, x, 0.37, 0.28); const cr = k.b(0.03, 0.8, 0.03, 0xffb8d0, x, 0.37, 0); cr.rotation.x = 0.9; }
    const scr = pic('purplescr', 128, 80, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#6a4ae0'); gr.addColorStop(0.5, '#c070ff'); gr.addColorStop(1, '#ff8ad8'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 3; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0, 20 + i * 18); c.bezierCurveTo(w / 3, i * 18, w * 2 / 3, 40 + i * 18, w, 16 + i * 18); c.stroke(); } });
    for (const [x, ry, y] of [[-0.58, 0.4, 1.12], [0, 0, 1.12], [0.58, -0.4, 1.12], [0, 0, 1.46]]) { const zz = -0.2 + Math.abs(x) * 0.14 - (y > 1.3 ? 0.02 : 0); const m = k.b(0.56, 0.32, 0.03, 0xf4f4f6, x, y, zz, 0.01); m.rotation.y = ry; plane(k, 0.52, 0.28, scr, x + Math.sin(ry) * 0.016, y, zz + 0.017, ry); }
    k.b(0.04, 0.5, 0.04, 0xf4f4f6, 0, 1.0, -0.25);
    k.b(0.5, 0.02, 0.16, 0xffffff, 0, 0.79, 0.12, 0.005); for (let i = 0; i < 12; i++) k.b(0.03, 0.006, 0.03, [0xff8ad8, 0x9ad8ff, 0xfff08a, 0xa8ffb0][i % 4], -0.2 + (i % 6) * 0.075, 0.803, 0.08 + ((i / 6) | 0) * 0.07);
    k.s(0.04, 0xffffff, 0.35, 0.8, 0.12, 1, 0.5, 1.4);
    k.add(mesh(heartGeo(0.12, 0.03), M(0xff7a9a), 0.7, 0.9, 0.12));
    k.b(0.22, 0.45, 0.45, 0xf4f4f6, 0.62, 0.23, -0.05, 0.02); for (let y = 0.08; y < 0.42; y += 0.05) for (let x = 0.54; x < 0.72; x += 0.05) k.s(0.012, glow(0xff8ad8), x, y, 0.18);   // 핑크 LED PC
  }, { use: [{ pose: 'type', dx: -0.1, dz: 0.72, face: 180, act: 'type', seatH: 0.55 }], tags: ['desk', 'game'], lamp: [[0, 1.2, 0.35, 0xc890ff, 0.55, 3]] });

  def('k3_white_gamer_chair', '화이트 게이밍 의자', 'rest', 1500, 0.7, 0.7, g => {
    const k = K(g); for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; k.b(0.34, 0.04, 0.05, 0xe8e8ee, Math.cos(a) * 0.16, 0.08, Math.sin(a) * 0.16, 0.02).rotation.y = -a; k.s(0.035, 0x3a3a44, Math.cos(a) * 0.32, 0.035, Math.sin(a) * 0.32); }
    k.c(0.03, 0.03, 0.35, 0xd8d8e0, 0, 0.26, 0); k.b(0.56, 0.12, 0.52, 0xfafafa, 0, 0.48, 0, 0.06);
    const bk = k.b(0.52, 0.9, 0.14, 0xfafafa, 0, 0.98, -0.25, 0.08); bk.rotation.x = -0.12; for (const x of [-0.17, 0.17]) { const s = k.b(0.08, 0.8, 0.02, 0xffb8d0, x, 0.98, -0.17, 0.01); s.rotation.x = -0.12; }
    k.b(0.3, 0.14, 0.1, 0xffd0e0, 0, 1.3, -0.2, 0.05); for (const x of [-0.3, 0.3]) k.b(0.06, 0.04, 0.34, 0xe8e8ee, x, 0.66, 0, 0.02);
  }, { use: [{ pose: 'type', dx: 0, dz: 0.02, face: 0, act: 'type', seatH: 0.55 }], tags: ['chair'] });

  def('k3_cream_bookshelf', '크림 책장 (책 가득)', 'work', 1800, 1.2, 0.4, g => {
    const k = K(g), wd = T.woodgrain(0xf4e4cc);
    k.b(1.2, 1.9, 0.38, wd, 0, 0.95, 0, 0.02);
    for (let i = 0; i < 4; i++) { const y = 0.3 + i * 0.44; k.b(1.1, 0.36, 0.3, T.books('k3shelf' + i, [0x2f6b8e, 0x3a8a6a, 0xe8e0c8, 0xc03a4a, 0x2b2b30, 0x8ab0d8, 0xf0c070].slice(i % 3)), 0, y + 0.02, 0.05, 0.005); }
    k.b(0.3, 0.14, 0.2, 0xf4a0c0, 0.35, 1.96, 0, 0.02); P.plant(k, -0.35, 1.9, 0, 0.7, 0xfafafa, 0x5fae5a);
  }, { use: [{ pose: 'read', dx: 0, dz: 0.8, face: 180, act: 'read_book' }], tags: ['books'] });

  def('k3_pink_drawer', '핑크 서랍장 & 소품', 'work', 1200, 0.8, 0.45, g => {
    const k = K(g); k.b(0.8, 0.75, 0.44, 0xf7a8c0, 0, 0.38, 0, 0.03);
    for (let i = 0; i < 3; i++) { k.b(0.72, 0.2, 0.02, 0xffc0d4, 0, 0.14 + i * 0.23, 0.22, 0.02); k.s(0.025, 0xffffff, 0, 0.14 + i * 0.23, 0.24); }
    k.b(0.36, 0.3, 0.3, 0xfafafa, -0.15, 0.93, 0, 0.02); k.b(0.3, 0.12, 0.02, 0xffd0e0, -0.15, 0.95, 0.15);
    P.mug(k, 0.2, 0.76, 0.05, 0xff8ab0); k.c(0.05, 0.05, 0.2, 0x3a3a3a, 0.28, 0.86, -0.08);
  }, { tags: ['storage'] });

  def('k3_slat_divider', '화이트 슬랫 파티션', 'misc', 900, 1.4, 0.2, g => { const k = K(g); for (let i = 0; i < 12; i++) k.b(1.4, 0.05, 0.05, 0xfafafa, 0, 0.25 + i * 0.17, 0, 0.01); for (const x of [-0.68, 0.68]) k.b(0.06, 2.2, 0.08, 0xf4f0ec, x, 1.1, 0, 0.01); for (const x of [-0.6, 0.6]) k.b(0.3, 0.04, 0.3, 0xf4f0ec, x, 0.02, 0, 0.01); }, { tags: ['divider'] });

  def('k3_plush_wall_shelf', '토끼 인형 벽선반', 'wall', 900, 1.4, 0.3, g => {
    const k = K(g); k.b(1.4, 0.05, 0.28, 0xfafafa, 0, 2.2, 0.14, 0.01);
    [[0xff7a8a, 'bunny'], [0xffb0c8, 'bunny'], [0xf4a0c0, 'bear'], [0x8a8aff, 'bunny'], [0xc8a8ff, 'bunny'], [0xffe08a, 'bear']].forEach(([c, e], i) => P.plush(k, -0.58 + i * 0.23, 2.23, 0.14, c, e, 0.62));
  }, { wall: true, tags: ['plush'] });

  def('k3_paper_chain', '파스텔 종이 고리 가랜드', 'wall', 400, 1.8, 0.2, g => {
    const k = K(g); const cols = [0xffb0c8, 0xa8e8ff, 0xfff0a0, 0xc8f0b0, 0xd8b8ff];
    for (let i = 0; i < 22; i++) { const x = -0.88 + i * 0.084, y = 2.55 - Math.sin(i / 21 * PI) * 0.4; const r = k.t(0.045, 0.012, cols[i % 5], x, y, 0.1); r.rotation.y = i % 2 ? PI / 2 : 0; r.scale.set(1, 1.4, 1); }
  }, { wall: true, tags: ['party'] });

  def('k3_piggy_cabinet', '화이트 수납장 & 돼지 저금통', 'work', 1300, 0.9, 0.45, g => {
    const k = K(g); k.b(0.9, 0.95, 0.44, 0xfafafa, 0, 0.48, 0, 0.02); k.b(0.84, 0.02, 0.02, 0xe8e8ec, 0, 0.5, 0.22);
    k.s(0.16, 0xffb0c0, 0.1, 1.1, 0, 1.2, 1, 1); k.s(0.06, 0xff98b0, 0.1, 1.1, 0.18, 1, 0.9, 0.5); for (const sx of [-1, 1]) { k.cone(0.04, 0.07, 0xff98b0, 0.1 + sx * 0.08, 1.26, 0.08); k.s(0.015, 0x2b2b30, 0.1 + sx * 0.05, 1.14, 0.15); }
    for (const [x, z] of [[-0.02, -0.08], [0.22, -0.08], [-0.02, 0.08], [0.22, 0.08]]) k.c(0.025, 0.025, 0.06, 0xff98b0, x, 0.98, z);
    k.b(0.05, 0.006, 0.01, 0x8a4a5a, 0.1, 1.26, 0); k.s(0.04, 0xfff08a, 0.2, 1.24, -0.05);
    k.b(0.28, 0.2, 0.02, 0x9a7a5a, -0.28, 1.04, -0.1, 0.01).rotation.x = -0.2;
  }, { tags: ['storage'] });

  def('k3_candy_lamp', '캔디 병 스탠드 조명', 'light', 1400, 0.4, 0.4, g => {
    const k = K(g); k.c(0.15, 0.18, 0.08, 0xa8d8ff, 0, 0.04, 0);
    for (let i = 0; i < 4; i++) { k.add(mesh(geo('k3jar', () => new THREE.SphereGeometry(0.13, 16, 12)), glass(0xe8f4ff), 0, 0.28 + i * 0.36, 0)).scale.y = 1.3; for (let j = 0; j < 6; j++) k.s(0.035, glow([0xff8ab0, 0xfff08a, 0x8ad8ff, 0xc8a8ff][(i + j) % 4]), Math.cos(j) * 0.06, 0.24 + i * 0.36 + (j % 2) * 0.04, Math.sin(j) * 0.06); k.c(0.06, 0.07, 0.06, 0xa8d8ff, 0, 0.46 + i * 0.36, 0); }
    k.s(0.08, 0xff8ab0, 0, 1.72, 0);
  }, { tags: ['light'], lamp: [[0, 1.0, 0.2, 0xffc8f0, 0.55, 3]] });

  def('k3_white_rocker', '화이트 흔들의자 (하트 방석)', 'rest', 1100, 0.7, 0.8, g => {
    const k = K(g); for (const sx of [-1, 1]) { const r = k.t(0.55, 0.02, 0xfafafa, sx * 0.25, 0.55, 0, PI * 0.5); r.rotation.set(0, PI / 2, PI * 1.25); for (const z of [-0.2, 0.2]) k.b(0.04, 0.4, 0.04, 0xfafafa, sx * 0.25, 0.25, z); }
    k.b(0.56, 0.05, 0.5, 0xfafafa, 0, 0.45, 0, 0.02); for (let i = 0; i < 5; i++) k.b(0.04, 0.6, 0.03, 0xfafafa, -0.2 + i * 0.1, 0.8, -0.24, 0.01); k.b(0.58, 0.05, 0.04, 0xfafafa, 0, 1.1, -0.24, 0.02);
    k.add(mesh(heartGeo(0.34, 0.06), M(0xffb8cc), 0, 0.49, 0.18)).rotation.x = -PI / 2;
  }, { use: [{ pose: 'sit', dx: 0, dz: 0.05, face: 0, act: 'sit', seatH: 0.5 }], tags: ['chair'] });

  def('k3_laptop_shelf', '핑크 벽 데스크 (노트북 · 태블릿)', 'wall', 1100, 0.9, 0.4, g => {
    const k = K(g); k.b(0.9, 0.04, 0.38, 0xfafafa, 0, 1.0, 0.19, 0.01); k.b(0.9, 0.04, 0.3, 0xfafafa, 0, 1.6, 0.15, 0.01); for (const x of [-0.43, 0.43]) k.b(0.03, 0.9, 0.03, 0xf4f0ec, x, 1.15, 0.36);
    k.b(0.38, 0.015, 0.26, 0xffb0c8, -0.12, 1.03, 0.2, 0.005); const scr = k.b(0.38, 0.26, 0.012, 0xffb0c8, -0.12, 1.16, 0.08, 0.005); scr.rotation.x = -0.25; const sp = plane(k, 0.34, 0.22, T.screen('pc'), -0.12, 1.16, 0.09); sp.rotation.x = -0.25;
    const tb = k.b(0.22, 0.3, 0.015, 0x3a3a44, 0.28, 1.18, 0.22, 0.01); tb.rotation.x = -0.2; plane(k, 0.19, 0.26, T.screen('drama'), 0.28, 1.18, 0.23).rotation.x = -0.2;
    P.plant(k, 0.25, 1.62, 0.15, 0.7, 0xfafafa, 0x4a9a4a); k.c(0.04, 0.04, 0.2, 0x3a6a3a, -0.25, 1.72, 0.15);
  }, { wall: true, tags: ['desk'] });

  def('k3_candy_poster', '캔디 스트라이프 포스터', 'wall', 500, 0.7, 0.1, g => { const k = K(g); k.b(0.66, 0.66, 0.02, 0xfafafa, 0, 1.75, 0.02, 0.01); plane(k, 0.6, 0.6, pic('candyposter', 128, 128, (c, w, h) => { c.fillStyle = '#ff8aa8'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffffff'; for (let i = -h; i < w; i += 24) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 12, 0); c.lineTo(i + 12 + h, h); c.lineTo(i + h, h); c.fill(); } c.fillStyle = '#ff5a8a'; heart(c, 64, 70, 60); c.fill(); c.fillStyle = '#fff'; c.font = 'bold 18px sans-serif'; c.textAlign = 'center'; c.fillText('LOVE', 64, 66); }), 0, 1.75, 0.035); }, { wall: true, tags: ['romance'] });
  def('k3_pink_pendant', '핑크 돔 펜던트', 'light', 600, 0.5, 0.5, g => { const k = K(g); k.c(0.006, 0.006, 0.7, 0xe8a0b8, 0, 2.65, 0); k.add(mesh(geo('k3dome', () => new THREE.SphereGeometry(0.24, 20, 10, 0, PI * 2, 0, PI / 2)), new THREE.MeshLambertMaterial({ color: 0xf7a8c0, side: THREE.DoubleSide }), 0, 2.1, 0)); k.s(0.07, glow(0xfff0e0), 0, 2.08, 0); }, { ceiling: true, tags: ['light'] });
  def('k3_pink_fan', '핑크 탁상 선풍기', 'misc', 400, 0.4, 0.4, g => { const k = K(g); k.c(0.14, 0.16, 0.04, 0xf7a8c0, 0, 0.02, 0); k.c(0.025, 0.025, 0.5, 0xf7a8c0, 0, 0.28, 0); k.t(0.2, 0.012, 0xf7a8c0, 0, 0.62, 0.02); for (let i = 0; i < 5; i++) { const b = k.s(0.08, 0xffc8d8, Math.cos(i / 5 * PI * 2) * 0.09, 0.62 + Math.sin(i / 5 * PI * 2) * 0.09, 0.03, 1, 0.5, 0.2); b.rotation.z = i / 5 * PI * 2; } k.s(0.035, 0xf7a8c0, 0, 0.62, 0.05); }, { tags: ['cute'] });
  def('k3_star_pillow', '별 쿠션 더미', 'misc', 300, 0.7, 0.6, g => { const k = K(g); star3(k, 0.2, 0xc8a8ff, -0.12, 0.2, 0, 0.1).rotation.x = -1.2; star3(k, 0.16, 0xffe070, 0.18, 0.15, 0.08, 0.1).rotation.x = -1.4; k.s(0.14, 0xffffff, 0.05, 0.1, -0.2, 1.3, 0.6, 1); }, { tags: ['plush'] });

  // =========================================================
  // 🖤 2. 다크 모던 라운지
  // =========================================================
  const BLACK = 0x1e1c1c, LEATHER = 0x0c0b0b, CHROME = 0xc8ccd4;
  def('k3_city_window', '도시 야경 통창 & 시어 커튼', 'wall', 3200, 2.8, 0.25, g => {
    const k = K(g);
    plane(k, 2.0, 2.2, pic('duskcity', 256, 280, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6a5a6a'); gr.addColorStop(0.35, '#c89a80'); gr.addColorStop(0.5, '#e8b890'); gr.addColorStop(0.55, '#8a7a78'); gr.addColorStop(1, '#3a3438'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) { const bw = 8 + (i * 7) % 18, bh = 30 + (i * 37) % 120, x = (i * 53) % w, y = h * 0.52 + (i % 3) * 8; c.fillStyle = ['#4a4448', '#5a5458', '#3e3a3e', '#6a6468'][i % 4]; c.fillRect(x, y + (h * 0.5 - bh) * 0.3, bw, h); c.fillStyle = 'rgba(255,220,160,0.5)'; for (let yy = y + (h * 0.5 - bh) * 0.3 + 4; yy < h; yy += 6) if ((yy + x) % 3 === 0) c.fillRect(x + 2, yy, 2, 2); }
      c.fillStyle = 'rgba(255,230,200,0.15)'; c.fillRect(0, 0, w, h);
    }), 0, 1.55, 0.02);
    for (let x = -1.0; x <= 1.01; x += 0.5) k.b(0.05, 2.25, 0.06, 0x1a1a1a, x, 1.55, 0.04);          // 블랙 창틀
    for (let y = 0.45; y <= 2.66; y += 0.55) k.b(2.05, 0.05, 0.06, 0x1a1a1a, 0, y, 0.04);
    k.b(2.1, 0.08, 0.12, 0x1a1a1a, 0, 0.44, 0.06);
    const sheer = new THREE.MeshLambertMaterial({ color: 0xf6f0ea, transparent: true, opacity: 0.82, side: THREE.DoubleSide });
    for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) { const c2 = k.k(0.06, 2.55, sheer, sx * (1.05 + i * 0.07), 1.5, 0.14 + (i % 2) * 0.03); c2.scale.set(1, 1, 0.5); c2.material = sheer; }
    const rod = k.c(0.015, 0.015, 2.8, 0x1a1a1a, 0, 2.85, 0.16); rod.rotation.z = PI / 2;
  }, { wall: true, tags: ['window'] });

  def('k3_l_sofa', '블랙 가죽 L자 소파', 'rest', 4200, 2.5, 1.7, g => {
    const k = K(g), lm = T.leather(LEATHER);
    k.b(2.5, 0.1, 0.9, 0x0e0e10, 0, 0.06, -0.4, 0.02); k.b(0.95, 0.1, 0.8, 0x0e0e10, -0.78, 0.06, 0.45, 0.02);
    for (const x of [-0.6, 0.2, 1.0]) k.b(0.78, 0.26, 0.7, lm, x, 0.3, -0.34, 0.05);                 // 좌석 쿠션
    k.b(0.9, 0.26, 0.8, lm, -0.78, 0.3, 0.44, 0.05);                                               // 카우치
    k.b(2.5, 0.48, 0.22, lm, 0, 0.62, -0.74, 0.05); for (const x of [-0.6, 0.2, 1.0]) k.b(0.76, 0.34, 0.14, lm, x, 0.66, -0.6, 0.06);
    k.b(0.22, 0.48, 1.7, lm, -1.14, 0.62, -0.02, 0.05); k.b(0.18, 0.2, 0.9, lm, 1.16, 0.46, -0.36, 0.05);
    for (const [x, z] of [[-1.15, -0.8], [1.15, -0.8], [-1.15, 0.8], [-0.35, 0.8]]) k.b(0.05, 0.08, 0.05, CHROME, x, 0.03, z, 0.01);
  }, { use: [{ pose: 'sit', dx: 0.2, dz: -0.25, face: 0, act: 'sofa', seatH: 0.46 }, { pose: 'sit', dx: 1.0, dz: -0.25, face: 0, act: 'sofa', seatH: 0.46 }, { pose: 'sit', dx: -0.78, dz: 0.3, face: 90, act: 'sofa', seatH: 0.46 }], tags: ['sofa', 'luxury'] });

  def('k3_black_coffee_cactus', '블랙 유리 테이블 & 미니 선인장', 'misc', 1400, 1.2, 0.65, g => {
    const k = K(g); k.b(1.2, 0.04, 0.62, 0x1a1a1c, 0, 0.42, 0, 0.01); k.b(1.14, 0.02, 0.56, 0x2a2a2c, 0, 0.14, 0, 0.005);
    for (const x of [-0.58, 0.58]) for (const z of [-0.29, 0.29]) k.b(0.025, 0.42, 0.025, CHROME, x, 0.21, z);
    for (const [x, h, c] of [[-0.1, 0.18, 0x5fae5a], [0.08, 0.14, 0x4a9a50], [0.24, 0.2, 0x6aba60]]) { k.c(0.06, 0.045, 0.08, 0xd8805a, x, 0.48, 0.02); k.k(0.045, h - 0.06, c, x, 0.52 + h / 2, 0.02); if (x > 0) k.s(0.022, 0xff80b0, x, 0.55 + h, 0.02); }
  }, { tags: ['plant'] });
  def('k3_brown_rug', '초콜릿 브라운 러그', 'misc', 700, 2.4, 1.6, g => { const k = K(g); rug(k, 2.4, 1.6, tm('brownrug', 128, 96, (c, w, h) => { c.fillStyle = '#5a3a2a'; c.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { c.fillStyle = i % 2 ? 'rgba(255,220,190,0.06)' : 'rgba(0,0,0,0.1)'; c.fillRect((i * 37) % w, (i * 53) % h, 2, 2); } })); }, { flat: true });
  def('k3_floor_cushion', '브라운 원형 방석', 'rest', 300, 0.6, 0.6, g => { const k = K(g); k.c(0.28, 0.28, 0.12, 0x8a5a3a, 0, 0.07, 0); k.s(0.28, 0x9a6a48, 0, 0.13, 0, 1, 0.15, 1); k.s(0.02, 0x6a4028, 0, 0.17, 0); }, { use: [{ pose: 'sit', dx: 0, dz: 0, face: 0, act: 'sit', seatH: 0.17 }], tags: ['chair'] });
  def('k3_shag_round', '크림 원형 퍼 러그', 'misc', 600, 1.6, 1.6, g => { const k = K(g); rug(k, 1.6, 1.6, cm('shagr', 128, 128, (c, w, h) => { c.fillStyle = '#e8ddd4'; c.beginPath(); c.arc(64, 64, 62, 0, 7); c.fill(); for (let i = 0; i < 700; i++) { const a = i * 2.4, r = (i * 7) % 60; c.fillStyle = i % 2 ? 'rgba(255,255,255,0.35)' : 'rgba(150,130,120,0.18)'; c.fillRect(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 2, 3); } })); }, { flat: true });
  def('k3_black_cat', '검은 고양이 (식빵 자세)', 'misc', 800, 0.7, 0.4, g => {
    const k = K(g); k.s(0.2, 0x1c1a1c, 0, 0.12, 0, 1.4, 0.6, 0.8); k.s(0.11, 0x1c1a1c, 0.26, 0.14, 0.04); for (const sx of [-1, 1]) k.cone(0.04, 0.07, 0x1c1a1c, 0.28, 0.25, 0.04 + sx * 0.06);
    for (const sx of [-1, 1]) k.s(0.015, glow(0xd8c040), 0.34, 0.16, 0.04 + sx * 0.04); const t = k.k(0.03, 0.3, 0x1c1a1c, -0.3, 0.05, 0.12); t.rotation.set(0, 0.4, PI / 2); for (const z of [-0.05, 0.08]) k.s(0.04, 0x1c1a1c, 0.26, 0.03, z, 1.4, 0.6, 1);
  }, { tags: ['pet', 'plush'], use: [{ pose: 'hug', dx: 0, dz: 0.6, face: 180, act: 'hug_doll' }] });
  def('k3_saguaro', '대형 사와로 선인장', 'misc', 1200, 0.6, 0.6, g => { const k = K(g); k.c(0.2, 0.16, 0.3, 0x2a2826, 0, 0.15, 0); k.c(0.19, 0.19, 0.02, 0x5a4030, 0, 0.3, 0); k.k(0.1, 1.6, 0x6a8a4a, 0, 1.2, 0); for (const [sx, y, h] of [[-1, 1.0, 0.6], [1, 1.3, 0.5]]) { const a = k.k(0.07, 0.2, 0x6a8a4a, sx * 0.14, y, 0); a.rotation.z = PI / 2; k.k(0.07, h, 0x6a8a4a, sx * 0.24, y + h / 2, 0); } for (let i = 0; i < 16; i++) k.b(0.005, 1.5, 0.005, 0x4a6a34, Math.cos(i / 16 * PI * 2) * 0.1, 1.2, Math.sin(i / 16 * PI * 2) * 0.1); }, { tags: ['plant'] });
  def('k3_fig_tree', '대형 벤자민 나무', 'misc', 1300, 0.8, 0.8, g => { const k = K(g); k.c(0.2, 0.17, 0.32, 0x1a1a1a, 0, 0.16, 0); k.c(0.02, 0.03, 1.4, 0x9a8a78, 0, 1.0, 0); for (let i = 0; i < 40; i++) { const a = i * 2.4, y = 1.0 + (i % 10) * 0.12, r = 0.15 + (i % 4) * 0.08; k.s(0.07, i % 3 ? 0x4a8a3a : 0x6aa850, Math.cos(a) * r, y, Math.sin(a) * r, 1, 0.5, 1.4).rotation.y = a; } }, { tags: ['plant'] });
  def('k3_bird_paradise', '극락조 화분 (블랙 팟)', 'misc', 1000, 0.7, 0.7, g => { const k = K(g); k.c(0.2, 0.15, 0.4, 0x1a1a1a, 0, 0.2, 0); for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; k.c(0.01, 0.01, 0.7, 0x4a7a3a, Math.cos(a) * 0.05, 0.75, Math.sin(a) * 0.05).rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); const l = k.s(0.2, 0x3a7a3a, Math.cos(a) * 0.22, 1.15 + (i % 3) * 0.1, Math.sin(a) * 0.22, 0.45, 1.2, 0.08); l.rotation.set(Math.sin(a) * 0.5, -a, -Math.cos(a) * 0.5); } }, { tags: ['plant'] });
  def('k3_globe_chandelier', '블랙 3구 글로브 샹들리에', 'light', 1800, 0.9, 0.5, g => { const k = K(g); k.c(0.008, 0.008, 0.45, 0x1a1a1a, 0, 2.78, 0); k.c(0.04, 0.04, 0.05, 0x1a1a1a, 0, 2.55, 0); for (const sx of [-1, 0, 1]) { const a = k.t(0.18, 0.012, 0x3a3230, sx * 0.14, 2.42, 0, PI); a.rotation.z = PI; k.s(0.16, glow(0xfff4e0), sx * 0.3, 2.3 + (sx ? 0 : 0.05), sx ? 0 : 0.12); } }, { ceiling: true, tags: ['light'], lamp: [[0, 2.2, 0, 0xffe8c8, 0.95, 6]] });
  def('k3_black_pendant', '블랙 인더스트리얼 펜던트', 'light', 600, 0.5, 0.5, g => { const k = K(g); k.c(0.006, 0.006, 0.8, 0x1a1a1a, 0, 2.6, 0); k.add(mesh(geo('k3ind', () => new THREE.LatheGeometry([[0.02, 0.2], [0.06, 0.19], [0.1, 0.1], [0.26, 0], [0.27, -0.01]].map(([x, y]) => new THREE.Vector2(x, y)), 24)), new THREE.MeshLambertMaterial({ color: 0x1c1c1e, side: THREE.DoubleSide }), 0, 2.02, 0)); k.s(0.06, glow(0xfff0d0), 0, 2.02, 0); }, { ceiling: true, tags: ['light'] });
  def('k3_task_floor_lamp', '블랙 태스크 플로어 램프', 'light', 700, 0.5, 0.5, g => { const k = K(g); k.c(0.16, 0.18, 0.03, 0x1a1a1a, 0, 0.015, 0); const a = k.c(0.012, 0.012, 1.3, 0x1a1a1a, 0.05, 0.65, 0); a.rotation.z = -0.08; const b = k.c(0.012, 0.012, 0.8, 0x1a1a1a, 0.3, 1.5, 0); b.rotation.z = -1.0; k.cone(0.1, 0.18, 0x1a1a1a, 0.62, 1.66, 0).rotation.z = 2.4; k.s(0.04, glow(0xfff0d0), 0.66, 1.6, 0); }, { tags: ['light'], lamp: [[0.6, 1.4, 0, 0xffe0b8, 0.5, 3]] });
  def('k3_espresso_bar', '다크 바 카운터 (에스프레소 · 머핀)', 'work', 3000, 2.2, 0.7, g => {
    const k = K(g), wd = T.woodgrain(0x2e2624);
    k.b(2.2, 0.95, 0.66, wd, 0, 0.48, 0, 0.02); k.b(2.26, 0.05, 0.72, 0x1a1616, 0, 0.97, 0, 0.01);
    k.b(0.36, 0.36, 0.3, 0x2a2a2a, -0.7, 1.18, -0.08, 0.03); k.b(0.3, 0.12, 0.2, CHROME, -0.7, 1.1, 0.05, 0.02); for (const x of [-0.78, -0.62]) k.c(0.012, 0.012, 0.08, CHROME, x, 1.0, 0.1); P.mug(k, -0.7, 0.99, 0.12, 0xfafafa);
    k.c(0.16, 0.16, 0.015, 0xe8d8b8, 0, 1.0, 0.05); for (let i = 0; i < 3; i++) { k.c(0.05, 0.04, 0.05, 0x8a5a3a, -0.06 + i * 0.06, 1.03, 0.05 + (i % 2) * 0.05); k.s(0.055, 0x6a3a22, -0.06 + i * 0.06, 1.08, 0.05 + (i % 2) * 0.05, 1, 0.6, 1); }
    for (let i = 0; i < 3; i++) { k.c(0.05, 0.06, 0.28, 0xf4f0ea, 0.45 + i * 0.12, 1.14, -0.1); k.c(0.02, 0.03, 0.08, 0xf4f0ea, 0.45 + i * 0.12, 1.32, -0.1); }
    k.b(0.9, 0.35, 0.3, 0x1c1a1a, 0.55, 1.95, -0.2, 0.02); k.b(0.86, 0.3, 0.02, 0x2a2626, 0.55, 1.95, -0.05, 0.01);
    P.plant(k, 0.9, 2.12, -0.2, 0.9, 0xd8805a, 0x3a7a3a); k.s(0.07, 0xd8303a, 0.95, 2.35, -0.15, 1, 1.3, 0.3);
  }, { use: [{ pose: 'cook', dx: -0.6, dz: 0.7, face: 180, act: 'cook' }, { pose: 'drink', dx: 0.3, dz: 0.75, face: 180, act: 'tea' }], tags: ['kitchen', 'cafe'] });
  def('k3_bar_stool', '블랙 인더스트리얼 스툴', 'rest', 400, 0.45, 0.45, g => { const k = K(g); k.c(0.18, 0.18, 0.05, 0x1c1c1e, 0, 0.62, 0); k.c(0.02, 0.02, 0.35, 0x2a2a2a, 0, 0.42, 0); for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2; const l = k.c(0.015, 0.015, 0.5, 0x1c1c1e, Math.cos(a) * 0.12, 0.24, Math.sin(a) * 0.12); l.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); } k.t(0.13, 0.01, 0x1c1c1e, 0, 0.2, 0).rotation.x = PI / 2; }, { use: [{ pose: 'sit', dx: 0, dz: 0, face: 0, act: 'sit', seatH: 0.66 }], tags: ['chair'] });
  def('k3_black_dining', '블랙 다이닝 테이블 (흰 국화 화병)', 'work', 1800, 1.5, 0.9, g => { const k = K(g); k.b(1.5, 0.05, 0.88, 0x3a3230, 0, 0.74, 0, 0.01); k.b(1.46, 0.01, 0.84, 0x4a4240, 0, 0.77, 0, 0.005); for (const x of [-0.7, 0.7]) for (const z of [-0.4, 0.4]) k.b(0.04, 0.74, 0.04, 0x1a1a1a, x, 0.37, z); k.c(0.06, 0.08, 0.16, 0xe8e4e0, 0, 0.85, 0); k.c(0.006, 0.006, 0.2, 0x5a8a4a, 0, 1.0, 0); for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; k.s(0.035, 0xfaf6ea, Math.cos(a) * 0.05, 1.12 + (i % 2) * 0.02, Math.sin(a) * 0.05, 0.6, 1.4, 0.6).rotation.set(Math.sin(a), 0, Math.cos(a)); } }, { use: [{ pose: 'eat', dx: 0, dz: 0.7, face: 180, act: 'eat', seatH: 0.48 }], tags: ['table'] });
  def('k3_wire_chair', '블랙 와이어 체어', 'rest', 500, 0.55, 0.55, g => { const k = K(g); k.b(0.48, 0.04, 0.46, 0x2a2626, 0, 0.46, 0, 0.02); for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) { const l = k.c(0.012, 0.012, 0.48, 0x1a1a1a, x, 0.23, z); l.rotation.set(z * 0.3, 0, -x * 0.3); } for (let i = -3; i <= 3; i++) { const t = k.t(0.26, 0.008, 0x1a1a1a, 0, 0.72, -0.12, PI); t.rotation.set(-0.3, 0, 0); t.scale.set(1, 1 - Math.abs(i) * 0.08, 1); t.position.y = 0.5 + i * 0.05 + 0.2; } }, { use: [{ pose: 'sit', dx: 0, dz: 0.03, face: 0, act: 'sit', seatH: 0.5 }], tags: ['chair'] });
  def('k3_stripe_rug', '그레이 스트라이프 러그', 'misc', 600, 2.6, 2.0, g => { const k = K(g); rug(k, 2.6, 2.0, tm('striperug', 128, 96, (c, w, h) => { c.fillStyle = '#e8e4de'; c.fillRect(0, 0, w, h); c.fillStyle = '#5a5654'; for (let y = 6; y < h; y += 16) c.fillRect(0, y, w, 6); c.fillStyle = '#8a8480'; for (let y = 3; y < h; y += 32) c.fillRect(0, y, w, 2); })); }, { flat: true });
  def('k3_tv_console_black', '블랙 TV 콘솔 & 머쉬룸 램프', 'smart', 2200, 1.9, 0.5, g => { const k = K(g); k.b(1.2, 0.4, 0.45, 0x1c1a1a, 0, 0.26, 0, 0.02); for (const x of [-0.3, 0.3]) k.b(0.56, 0.3, 0.02, 0x2a2626, x, 0.26, 0.23); for (const x of [-0.55, 0.55]) k.b(0.03, 0.06, 0.03, 0x1a1a1a, x, 0.03, 0.18); k.b(0.95, 0.56, 0.05, 0x111113, 0, 0.8, -0.05, 0.01); plane(k, 0.9, 0.5, T.screen('off'), 0, 0.8, -0.02); k.b(0.3, 0.02, 0.18, 0x111113, 0, 0.47, -0.05);
    for (const sx of [-1, 1]) { k.b(0.3, 0.5, 0.35, 0x1a1a1a, sx * 0.8, 0.25, 0, 0.02); for (let i = 0; i < 5; i++) k.t(0.06, 0.01, 0x2a2a2a, sx * 0.8, 0.55 + i * 0.04, 0).rotation.x = PI / 2; k.s(0.14, glow(0xfff4e8), sx * 0.8, 0.8, 0, 1, 0.75, 1); } }, { use: [{ pose: 'sit', dx: 0, dz: 1.5, face: 180, act: 'watch_tv' }], tags: ['tv'], lamp: [[-0.8, 0.8, 0.2, 0xfff0d8, 0.45, 3], [0.8, 0.8, 0.2, 0xfff0d8, 0.45, 3]] });
  def('k3_hanging_shelf', '블랙 행잉 선반 (그릇 · 머그)', 'wall', 1000, 1.2, 0.35, g => { const k = K(g); for (const x of [-0.58, 0.58]) k.b(0.03, 0.9, 0.03, 0x1a1a1a, x, 1.9, 0.3); for (const y of [1.55, 1.95, 2.3]) k.b(1.2, 0.03, 0.3, 0x1a1a1a, 0, y, 0.16, 0.005); for (let i = 0; i < 3; i++) k.c(0.1, 0.06, 0.05, 0x3a5a8a, -0.3 + i * 0.1, 1.6, 0.16); P.mug(k, 0.2, 1.56, 0.16, 0x7a8aa0); P.mug(k, 0.35, 1.56, 0.16, 0xe8e0d0); k.c(0.03, 0.03, 0.22, 0x3a2a1a, -0.3, 2.07, 0.16); P.plant(k, 0.2, 1.97, 0.16, 0.8, 0x8a6a4a, 0x5a8a3a); k.b(0.3, 0.12, 0.2, 0x8a6a4a, 0.25, 2.37, 0.16, 0.01); }, { wall: true, tags: ['kitchen'] });
  def('k3_magazine_poster', '레트로 음악 잡지 포스터', 'wall', 400, 0.5, 0.08, g => { const k = K(g); k.b(0.44, 0.6, 0.02, 0x2a2626, 0, 1.6, 0.01, 0.005); plane(k, 0.4, 0.56, pic('magp', 96, 128, (c, w, h) => { c.fillStyle = '#e8d8a0'; c.fillRect(0, 0, w, h); c.fillStyle = '#d8502a'; c.font = 'bold 22px sans-serif'; c.fillText('KEE', 6, 24); c.fillStyle = '#e88a3a'; c.beginPath(); c.ellipse(52, 80, 26, 36, 0.4, 0, 7); c.fill(); c.fillStyle = '#3a2a24'; c.fillRect(48, 30, 6, 60); }), 0, 1.6, 0.025); }, { wall: true, tags: ['music'] });
  def('k3_cube_shelf_candle', '월넛 큐브 책장 & 캔들', 'work', 900, 0.8, 0.35, g => { const k = K(g), wd = T.woodgrain(0x5a3a2a); k.b(0.8, 0.8, 0.34, wd, 0, 0.4, 0, 0.02); for (const y of [0.22, 0.6]) k.b(0.7, 0.3, 0.26, 0x2a1c16, 0, y, 0.05, 0.005); P.book(k, -0.2, 0.08, 0.05, 0x3a5a8a); P.book(k, -0.13, 0.08, 0.05, 0xc0a060); k.c(0.06, 0.06, 0.08, 0xfff4e0, 0.1, 0.84, 0); k.s(0.015, glow(0xffd070), 0.1, 0.9, 0); k.s(0.06, 0x4a8a3a, 0.2, 0.52, 0.05); }, { tags: ['books'], lamp: [[0.1, 0.95, 0.15, 0xffc070, 0.25, 2]] });

  // ---------------- 스타일 등록 ----------------
  const S = RK.STYLES;
  S.kawaii = {
    name: '🎀 핑크 큐트 게이머', desc: '핑크 줄무늬 벽 · 하트 체크 바닥 · 무지개 구름 침대 · 토끼 러그 · 쌍둥이 별 러그 · 크리스탈 샹들리에 · 트리플 모니터',
    wall: 'pinkstripe', wallL: 'pinkstripe', wallR: 'pinkdot', floor: 'heartcheck', floorColor: 0xf7bccb,
    aff: { L1: { CUTIE: 4, FRESH: 2, GAMER: 2, FASHIONISTA: 1, ROMANTIC: 1, CLUMSY: 1 }, L2: { HOMEBODY: 1, NIGHT_OWL: 1 }, L3: { CUTE: 3, DREAMY: 1, SHY: 1 }, L4: { FASHION: 1, MUSIC: 1, GOSSIP: 1 } },
    mood: { main: 0.8, lamp: 0.95, hemi: [0xffe0ec, 0x9a6a78, 0.46], amb: [0xffd0e0, 0.14], dir: [0xfff0f4, 0.3], bg: 0x3a2430, shadow: { pos: [-4, 9, 3], soft: 6 } },
    vars: { lights: ['base', 'pastel', 'night', 'golden'], hues: [0, 0, 0, 0.04, -0.04], walls: [0xffffff] },
    furn: [f('k3_bunny_rug', -2.55, 0.55), f('k3_cloud_bed', -2.9, -1.55), f('k3_plush_wall_shelf', -2.9, -2.94), f('k3_slat_divider', -1.75, -1.3, 90), f('k3_pink_drawer', -1.0, -2.72), f('k3_cream_bookshelf', 0.2, -2.78),
      f('k3_rainbow_sofa', 0.3, -1.45), f('k3_star_pillow', 1.55, -1.1), f('k3_pink_chandelier', 0.3, -0.6), f('k3_twinstar_rug', 0.4, 0.75), f('k3_paper_chain', 0.9, -2.94), f('k3_paper_chain', -3.94, 0.6, 90),
      f('k3_white_triple_desk', 3.55, 0.45, -90), f('k3_white_gamer_chair', 2.7, 0.45, 90), f('k3_pink_pendant', 2.9, 0.45), f('k3_candy_poster', 3.94, -1.1, -90), f('k3_piggy_cabinet', 3.5, 2.2, -90), f('k3_candy_lamp', 2.6, 2.5),
      f('k3_white_rocker', -1.2, 1.5, 150), f('k3_laptop_shelf', -3.94, 1.7, 90), f('k3_pink_fan', 1.5, 2.45), f('k3_star_pillow', -2.4, 2.3)],
    fill: ['k3_star_pillow', 'k_plush_pile', 'k_cushion_pink', 'k3_pink_fan', 'k_heart_lamp', 'k_basket_pink', 'k3_candy_lamp', 'k_plant_trio'],
    wallFill: ['k3_candy_poster', 'k3_paper_chain', 'k_heart_mirror', 'k_ribbon_deco', 'k3_plush_wall_shelf'],
  };
  S.modern = {
    name: '🖤 다크 모던 라운지', desc: '테라코타 벽 · 헤링본 마루 · 도시 야경 통창 · 블랙 가죽 L소파 · 글로브 샹들리에 · 사와로 선인장 · 검은 고양이',
    wall: 'terracotta', wallL: 'terracotta', wallR: 'darkpanel', floor: 'herringbone', floorColor: 0xc8804e,
    aff: { L1: { CHIC: 4, DANDY: 3, CHARISMA: 2, SNOB: 2, CLASSIC: 1, INTROVERT: 1 }, L2: { NIGHT_OWL: 2, DILIGENT: 1 }, L3: { CYNICAL: 2, FORMAL: 2 }, L4: { FOOD: 1, MUSIC: 1, CLEAN: 1 } },
    mood: { main: 0.42, lamp: 0.95, hemi: [0xffd8b8, 0x2a2220, 0.3], amb: [0xffc098, 0.1], dir: [0xffa870, 0.34], bg: 0x1c1614, shadow: { pos: [1, 7, -7], soft: 4 } },
    vars: { lights: ['base', 'sunset', 'night', 'golden'], hues: [0], walls: [0xffffff, 0xfff0e4, 0xf4e8e0] },
    furn: [f('k3_espresso_bar', -2.75, -2.62), f('k3_bar_stool', -3.2, -1.85), f('k3_bar_stool', -2.35, -1.85), f('k3_black_pendant', -3.2, -1.9), f('k3_black_pendant', -2.3, -1.9),
      f('k3_stripe_rug', -2.4, 1.0), f('k3_black_dining', -2.4, 1.0), f('k3_wire_chair', -2.75, 0.25), f('k3_wire_chair', -2.05, 0.25), f('k3_wire_chair', -2.75, 1.75, 180), f('k3_wire_chair', -2.05, 1.75, 180),
      f('k3_city_window', 0.95, -2.94), f('k3_saguaro', -0.75, -2.55), f('k3_l_sofa', 1.05, -1.8), f('k3_brown_rug', 1.15, -0.35), f('k3_black_coffee_cactus', 1.2, -0.45), f('k3_floor_cushion', 1.2, 0.35),
      f('k3_globe_chandelier', 1.1, -0.6), f('k3_task_floor_lamp', -0.45, -1.1), f('k3_tv_console_black', 3.6, 0.7, -90), f('k3_bird_paradise', 3.45, 2.35), f('k3_shag_round', 2.2, 1.9), f('k3_black_cat', 2.2, 1.9, 30),
      f('k3_hanging_shelf', 3.94, -1.2, -90), f('k3_magazine_poster', 3.94, 2.1, -90), f('k3_fig_tree', 0.1, 2.3), f('k3_cube_shelf_candle', 1.2, 2.55, 180)],
    fill: ['k3_bird_paradise', 'k3_floor_cushion', 'k_magazines', 'k3_cube_shelf_candle', 'k_books_floor', 'k3_task_floor_lamp', 'k_plant_trio'],
    wallFill: ['k3_magazine_poster', 'k3_hanging_shelf', 'k_station_clock', 'k_bridge_frame'],
  };
})();
