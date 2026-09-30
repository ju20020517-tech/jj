/* =========================================================
 *  축복의 마블 대성당 리뉴얼 (12×14 → 16×18, 천장 7.2m) + 성당 앞 야외 웨딩 가든
 *   ⛪ 성당 (사진 1) : 흰 & 금 파이프 오르간(은빛 파이프) · 호박색 스테인드글라스 격자창 & 유화 액자 · 흰 난간 갤러리 · 기둥 위 아치 회랑
 *                      글로브 펜던트 · 금 샹들리에 · 성경 독서대 · 백합 문장(플뢰르 드 리스) 포디움 · 촛대 테이블 · 백합 화병 · 와인잔
 *                      분홍 · 회색 다이아몬드 격자 대리석 바닥 · 버건디 카펫 러너 · 흰 장미 & 금 리본 부케를 단 짙은 원목 장의자
 *                      옆벽 고딕 납선 유리창(장미창 머리) · 3구 촛대 벽등 · 아르누보 액자 · 장미 꽃 스탠드 · 조각 의자 · 봉헌 촛불대 · 천사상
 *   💒 야외 식장 (사진 2) : 흰 대리석 광장 · 금 드레이프 & 흰 장미 아치 · 흰 장미 산울타리 버진로드 · 금 화환 스탠드 · 웰컴 이젤 · 랜턴 가로등
 *                      흰 철제 하객 벤치 · 하프 · 흰 피아노 · 대형 백합 받침대 · 흰 테이블보 & 금 러너 연회 테이블 · 웨딩 케이크 · 흰 장미 화단 · 반짝이
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, RK = FM.RoomKit;
  const { K, T, P, def, ctex, glow, glass, mesh, geo } = RK._h;
  const { rrect, tm, cm, pic, rug, plane } = RK._h3;
  const { halo, beam, lightPatch } = RK._h5;
  const PI = Math.PI;
  const f = (type, x, z, rot = 0, y = 0) => ({ type, x, z, rot, y });
  const WH = 0xf8f4ec, IVORY = 0xefe6d4, CREAM = 0xe8dcc4, DKW = 0x3e2414, RED = 0x6e1520, LEAF = 0x4a7a3a, ROSE = 0xfbf6f2;
  const gold = new THREE.MeshPhongMaterial({ color: 0xd4a848, shininess: 70, specular: 0xfff0b0 });
  const silver = new THREE.MeshPhongMaterial({ color: 0xd4d8e2, shininess: 120, specular: 0xffffff });
  const wood = T.woodgrain(0x4a2a18);
  const flame = glow(0xffc860);
  // 촛불 하나 (초 + 불꽃 + 번짐)
  const candle = (k, x, y, z, h = 0.16, r = 0.025, hal = 0.2) => { k.c(r, r, h, 0xfbf4e0, x, y + h / 2, z); k.s(r * 0.7, flame, x, y + h + r * 0.9, z, 1, 1.9, 1); if (hal) halo(k, hal, 0xffb860, x, y + h + 0.03, z, 0.55); };
  // 장미 한 송이 (겹꽃잎 느낌: 큰 구 + 안쪽 작은 구)
  const rose = (k, x, y, z, c = ROSE, s = 1) => { k.s(0.05 * s, c, x, y, z, 1, 0.8, 1); k.s(0.028 * s, c === ROSE ? 0xf2e6dc : c, x, y + 0.025 * s, z, 1, 0.7, 1); };
  const leaves = (k, x, y, z, n = 5, r = 0.08, c = LEAF) => { for (let i = 0; i < n; i++) { const a = i / n * PI * 2 + 0.3; k.s(0.04, c, x + Math.cos(a) * r, y, z + Math.sin(a) * r, 1.5, 0.35, 0.8).rotation.y = -a; } };

  // ---------------------------------------------------------
  // 벽 · 바닥
  // ---------------------------------------------------------
  Object.assign(RK.WALLS, {
    cathback: { tileW: 0, w: 1024, h: 460, draw: (g, w, h) => {   // 안쪽 벽: 크림 석조 + 코니스 + 필라스터
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e2d2b4'); gr.addColorStop(0.55, '#ece0c8'); gr.addColorStop(1, '#e4d6bc'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(150,120,80,0.14)'; g.lineWidth = 1; for (let y = 18; y < h * 0.5; y += 22) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = ((y / 22) % 2) * 32; x < w; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 22); g.stroke(); } }
      const cy = h * (1 - 3.55 / 7.2); g.fillStyle = '#f6f0e4'; g.fillRect(0, cy - 8, w, 12); g.fillStyle = '#c8a050'; g.fillRect(0, cy + 4, w, 2);
      g.fillStyle = '#f4ecdc'; g.fillRect(0, 0, w, 10); g.fillStyle = '#c8a050'; g.fillRect(0, 10, w, 2); for (let x = 0; x < w; x += 12) { g.fillStyle = '#e8dcc4'; g.fillRect(x, 12, 7, 6); }
      g.fillStyle = '#cdbb98'; g.fillRect(0, h - 10, w, 10);
    } },
    cathside: { tileW: 3.6, w: 256, h: 512, draw: (g, w, h) => {   // 옆벽: 석재 블록 + 흰 징두리 판넬 + 금 몰딩
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#dccaa8'); gr.addColorStop(1, '#eadcc2'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(140,110,70,0.16)'; g.lineWidth = 1; const by = h * (1 - 1.15 / 7.2);
      for (let y = 14; y < by; y += 26) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = ((y / 26 | 0) % 2) * 40; x < w; x += 80) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 26); g.stroke(); } }
      for (let i = 0; i < 60; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(120,90,50,0.05)'; g.fillRect((i * 47) % w, (i * 83) % by, 22, 10); }
      g.fillStyle = '#f4ecdc'; g.fillRect(0, 0, w, 9); g.fillStyle = '#c8a050'; g.fillRect(0, 9, w, 2);
      g.fillStyle = '#f6f0e4'; g.fillRect(0, by, w, h - by); g.fillStyle = '#c8a050'; g.fillRect(0, by, w, 3);
      g.strokeStyle = '#d8c8a8'; g.lineWidth = 2; for (let x = 10; x < w; x += 64) { g.strokeRect(x, by + 14, 44, h - by - 34); g.strokeStyle = 'rgba(200,160,80,0.5)'; g.strokeRect(x + 5, by + 19, 34, h - by - 44); g.strokeStyle = '#d8c8a8'; }
      g.fillStyle = '#b8a482'; g.fillRect(0, h - 10, w, 10);
    } },
  });
  Object.assign(FM.FLOOR_DRAW, {
    // 분홍 · 회색 다이아몬드 격자 대리석 (1칸 = 1m)
    cathlattice(g, w, h) {
      g.fillStyle = '#f1ebe6'; g.fillRect(0, 0, w, h); const s = 32;
      for (let j = 0; j < h / s; j++) for (let i = 0; i < w / s; i++) { const cx = i * s + s / 2, cy = j * s + s / 2; g.fillStyle = (i + j) % 2 ? '#e7c9c4' : '#d5d0d4'; g.beginPath(); g.moveTo(cx, cy - 14); g.lineTo(cx + 14, cy); g.lineTo(cx, cy + 14); g.lineTo(cx - 14, cy); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(cx, cy - 9); g.lineTo(cx + 4, cy - 5); g.lineTo(cx, cy - 1); g.lineTo(cx - 4, cy - 5); g.fill(); }
      g.strokeStyle = 'rgba(140,120,130,0.45)'; g.lineWidth = 1; for (let d = -h; d < w + h; d += s) { g.beginPath(); g.moveTo(d, 0); g.lineTo(d + h, h); g.stroke(); g.beginPath(); g.moveTo(d, h); g.lineTo(d + h, 0); g.stroke(); }
      for (let j = 0; j <= h / s; j++) for (let i = 0; i <= w / s; i++) { g.fillStyle = '#b89a9e'; g.fillRect(i * s - 2, j * s - 2, 4, 4); }
      g.strokeStyle = 'rgba(150,150,165,0.18)'; g.lineWidth = 1.5; for (let i = 0; i < 6; i++) { g.beginPath(); let x = (i * 53) % w, y = 0; g.moveTo(x, y); while (y < h) { x += Math.sin(i * 7 + y * 0.05) * 9; y += 16; g.lineTo(x, y); } g.stroke(); }
    },
  });
  Object.assign(FM.D.FLOOR_SOUND || {}, { cathlattice: '또각' });
  const flatRug = (id, name, W, D, draw, rw = 2, rd = 2) => def(id, name, 'misc', 600, W, D, g => { const k = K(g); const t = ctex('k12' + id, 128, 128, draw); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(Math.max(1, Math.round(W / rw)), Math.max(1, Math.round(D / rd))); rug(k, W, D, new THREE.MeshLambertMaterial({ map: t }), 0, 0, 0.009); }, { flat: true, tags: ['rug'] });
  // 버건디 카펫 러너 (금 테두리 + 은은한 메달리온)
  const runnerDraw = (c, w, h) => { c.fillStyle = '#6a1420'; c.fillRect(0, 0, w, h); c.fillStyle = '#7e1c2a'; for (let y = 0; y < h; y += 64) { c.beginPath(); c.moveTo(w / 2, y + 8); c.lineTo(w / 2 + 26, y + 32); c.lineTo(w / 2, y + 56); c.lineTo(w / 2 - 26, y + 32); c.fill(); c.strokeStyle = 'rgba(210,160,80,0.35)'; c.lineWidth = 1.5; c.stroke(); } for (let i = 0; i < 500; i++) { c.fillStyle = i % 2 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.03)'; c.fillRect((i * 37) % w, (i * 53) % h, 2, 2); } for (const x of [4, w - 10]) { c.fillStyle = '#c8a050'; c.fillRect(x, 0, 6, h); } for (const x of [14, w - 18]) { c.fillStyle = '#a07a38'; c.fillRect(x, 0, 2, h); } };
  flatRug('k12c_runner', '버건디 카펫 러너 (금 테두리)', 2.0, 14, runnerDraw, 2, 2);
  flatRug('k12c_runner_x', '버건디 카펫 (가로)', 1.2, 9.4, runnerDraw, 2, 2);

  // =========================================================
  // ⛪ 제단부 : 파이프 오르간 · 제단 · 독서대 · 포디움
  // =========================================================
  def('k12c_organ', '흰 & 금 파이프 오르간 (은빛 파이프)', 'venue', 9000, 4.6, 1.8, g => {
    const k = K(g);
    k.b(4.6, 1.3, 1.0, WH, 0, 0.65, -0.15, 0.03); k.b(4.66, 0.07, 1.06, gold, 0, 1.32, -0.15); k.b(4.66, 0.1, 1.06, IVORY, 0, 0.05, -0.15);
    for (const x of [-1.75, -1.0, 1.0, 1.75]) { k.b(0.6, 0.8, 0.02, IVORY, x, 0.66, 0.36, 0.02); for (const [w2, h2, dy] of [[0.6, 0.03, 0.4], [0.6, 0.03, -0.4]]) k.b(w2, h2, 0.03, gold, x, 0.66 + dy, 0.37); }
    // 연주대 (짙은 원목 · 건반 2단 · 악보대)
    k.b(1.5, 0.78, 0.6, wood, 0, 0.39, 0.6, 0.03); k.b(1.56, 0.05, 0.66, DKW, 0, 0.8, 0.6, 0.01);
    for (const [y, z] of [[0.84, 0.72], [0.93, 0.56]]) { k.b(1.3, 0.035, 0.16, 0xfbf8f0, 0, y, z, 0.005); for (let i = 0; i < 18; i++) if (i % 7 !== 2 && i % 7 !== 6) k.b(0.03, 0.025, 0.09, 0x1a1a1a, -0.6 + i * 0.07, y + 0.03, z - 0.03); }
    const stand = k.b(0.8, 0.4, 0.03, wood, 0, 1.2, 0.46); stand.rotation.x = -0.25; const pg = tm('k12score', 64, 32, (c, w, h) => { c.fillStyle = '#f8f2e0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#3a2a1a'; c.lineWidth = 0.6; for (let s = 0; s < 3; s++) for (let l = 0; l < 5; l++) { c.beginPath(); c.moveTo(3, 4 + s * 9 + l * 1.4); c.lineTo(w - 3, 4 + s * 9 + l * 1.4); c.stroke(); } c.fillStyle = '#1a1a1a'; for (let i = 0; i < 24; i++) c.fillRect(6 + (i * 5) % 54, 4 + ((i / 8) | 0) * 9 + (i % 3), 2, 2); c.fillStyle = '#c8b890'; c.fillRect(w / 2 - 0.5, 0, 1, h); });
    const sc = k.b(0.62, 0.3, 0.01, pg, 0, 1.24, 0.48); sc.rotation.x = -0.25;
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) k.c(0.018, 0.018, 0.04, i % 2 ? 0xfbf8f0 : 0xc84a3a, s * (0.62 + (i % 2) * 0.05), 0.9 + ((i / 2) | 0) * 0.07, 0.42).rotation.x = PI / 2;
    k.b(1.2, 0.07, 0.34, wood, 0, 0.5, 1.02, 0.02); for (const x of [-0.52, 0.52]) k.b(0.06, 0.5, 0.3, wood, x, 0.25, 1.02);
    // 파이프 탑 (가운데 높은 탑 + 양옆 탑)
    const pipes = (x0, n, gap, base, top, drop, z, r = 0.055) => { for (let i = 0; i < n; i++) { const d = Math.abs(i - (n - 1) / 2), h = top - d * drop, x = x0 + (i - (n - 1) / 2) * gap; k.cone(r, 0.26, silver, x, base + 0.13, z).rotation.x = PI; k.c(r, r, h, silver, x, base + 0.26 + h / 2, z); k.b(r * 1.3, 0.05, 0.012, 0x1a1a1a, x, base + 0.38, z + r * 0.95); k.b(r * 1.4, 0.015, 0.02, silver, x, base + 0.36, z + r * 0.9); } };
    k.b(1.6, 3.6, 0.8, WH, 0, 3.1, -0.3, 0.03); pipes(0, 9, 0.16, 1.5, 3.1, 0.2, 0.16);
    k.b(1.72, 0.18, 0.92, WH, 0, 4.98, -0.3, 0.02); k.b(1.76, 0.05, 0.96, gold, 0, 4.88, -0.3);
    const arch = k.t(0.62, 0.09, WH, 0, 5.08, 0.02, PI); arch.scale.set(1.25, 0.8, 1); k.t(0.62, 0.03, gold, 0, 5.1, 0.12, PI).scale.set(1.25, 0.8, 1);
    k.c(0.3, 0.3, 0.06, gold, 0, 5.45, 0.08).rotation.x = PI / 2; k.c(0.22, 0.22, 0.02, WH, 0, 5.45, 0.12).rotation.x = PI / 2; for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; k.b(0.025, 0.2, 0.02, gold, Math.cos(a) * 0.42, 5.45 + Math.sin(a) * 0.42, 0.08).rotation.z = a + PI / 2; }
    k.cone(0.06, 0.2, gold, 0, 5.98, 0.02); k.s(0.05, gold, 0, 5.86, 0.02);
    for (const s of [-1, 1]) {
      k.b(1.05, 3.0, 0.7, WH, s * 1.55, 2.8, -0.3, 0.03); pipes(s * 1.55, 6, 0.15, 1.5, 2.3, 0.14, 0.1, 0.05);
      k.b(1.14, 0.16, 0.8, WH, s * 1.55, 4.36, -0.3, 0.02); k.b(1.18, 0.04, 0.84, gold, s * 1.55, 4.26, -0.3);
      k.t(0.3, 0.035, gold, s * 1.55, 4.46, 0.08, PI); k.c(0.1, 0.07, 0.18, gold, s * 1.55, 4.56, -0.1); k.s(0.08, gold, s * 1.55, 4.72, -0.1); k.cone(0.03, 0.14, gold, s * 1.55, 4.86, -0.1);
      for (const x of [s * 0.82, s * 2.28]) { k.c(0.05, 0.05, 3.0, gold, x, 2.8, 0.1); k.s(0.07, gold, x, 4.36, 0.1); }
      const sc2 = k.t(0.22, 0.03, gold, s * 0.95, 1.55, 0.18, PI * 1.2); sc2.rotation.z = s > 0 ? PI * 0.8 : 0;
    }
    halo(k, 1.3, 0xfff0d0, 0, 3.2, 0.3, 0.18);
  }, { tags: ['music', 'luxury'], use: [{ pose: 'type', dx: 0, dz: 1.0, face: 180, act: 'sit', seatH: 0.55 }], lamp: [[0, 3.0, 1.2, 0xffe8c0, 0.5, 6]] });

  const lace = tm('k12lace', 64, 64, (c, w, h) => { c.fillStyle = '#fbf8f2'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(200,190,170,0.6)'; c.lineWidth = 1; for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) { c.beginPath(); c.arc(x + 8, y + 8, 5, 0, 7); c.stroke(); c.beginPath(); c.arc(x + 8, y + 8, 2, 0, 7); c.stroke(); } c.beginPath(); for (let x = 0; x < w; x += 8) { c.moveTo(x, h - 1); c.arc(x + 4, h - 1, 4, PI, 0); } c.stroke(); });
  const lily = (k, x, y, z, s = 1, n = 7) => { for (let i = 0; i < n; i++) { const a = i / n * PI * 2 + (i % 2) * 0.3, r = 0.1 * s + (i % 3) * 0.03 * s, yy = y + 0.15 * s + (i % 3) * 0.08 * s; const st2 = k.c(0.005, 0.005, 0.3 * s, 0x5a8a3a, x + Math.cos(a) * r * 0.5, yy - 0.12 * s, z + Math.sin(a) * r * 0.5); st2.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); const fl = k.cone(0.055 * s, 0.14 * s, 0xfdfcf6, x + Math.cos(a) * r, yy, z + Math.sin(a) * r, 6); fl.rotation.set(Math.sin(a) * 1.1 + PI, 0, -Math.cos(a) * 1.1); k.s(0.012 * s, 0xe8b040, x + Math.cos(a) * r * 1.2, yy + 0.05 * s, z + Math.sin(a) * r * 1.2); } for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; const l = k.s(0.05 * s, LEAF, x + Math.cos(a) * 0.1 * s, y + 0.06 * s, z + Math.sin(a) * 0.1 * s, 0.5, 0.25, 1.8); l.rotation.y = -a + PI / 2; l.rotation.x = 0.4; } };
  const wineGlass = (k, x, y, z) => { k.c(0.03, 0.03, 0.005, glass(0xf4faff), x, y + 0.003, z); k.c(0.004, 0.004, 0.08, glass(0xf4faff), x, y + 0.045, z); k.c(0.035, 0.02, 0.07, glass(0xf4faff), x, y + 0.12, z); k.c(0.028, 0.017, 0.03, 0x7a1024, x, y + 0.105, z); };
  def('k12c_altar', '대리석 제단 (레이스 · 금 촛대 · 백합 · 와인잔)', 'venue', 4000, 2.6, 1.0, g => {
    const k = K(g); k.b(2.4, 0.92, 0.82, WH, 0, 0.46, 0, 0.03); k.b(2.5, 0.06, 0.9, IVORY, 0, 0.95, 0, 0.01); k.b(2.44, 0.1, 0.86, IVORY, 0, 0.05, 0, 0.01);
    for (const x of [-0.8, 0, 0.8]) { k.b(0.6, 0.6, 0.02, IVORY, x, 0.46, 0.415, 0.02); k.b(0.5, 0.5, 0.02, gold, x, 0.46, 0.418); k.b(0.44, 0.44, 0.02, WH, x, 0.46, 0.425, 0.02); }
    k.b(0.12, 0.3, 0.02, gold, 0, 0.5, 0.44); k.b(0.24, 0.05, 0.02, gold, 0, 0.56, 0.44);
    k.b(2.56, 0.03, 0.94, lace, 0, 0.99, 0, 0.005); k.b(1.4, 0.34, 0.012, lace, 0, 0.83, 0.475, 0.003); k.b(1.4, 0.04, 0.015, gold, 0, 0.67, 0.477);
    for (const s of [-1, 1]) { k.c(0.07, 0.09, 0.04, gold, s * 0.9, 1.02, -0.1); k.c(0.018, 0.022, 0.42, gold, s * 0.9, 1.24, -0.1); k.t(0.035, 0.012, gold, s * 0.9, 1.25, -0.1).rotation.x = PI / 2; k.c(0.05, 0.03, 0.04, gold, s * 0.9, 1.46, -0.1); candle(k, s * 0.9, 1.48, -0.1, 0.28, 0.03, 0.26); }
    for (const [x, h] of [[-0.45, 0.2], [-0.33, 0.14], [0.52, 0.18]]) candle(k, x, 1.0, 0.15, h, 0.04, 0.16);
    k.c(0.09, 0.07, 0.24, WH, 0, 1.12, -0.12); k.t(0.09, 0.012, gold, 0, 1.23, -0.12).rotation.x = PI / 2; lily(k, 0, 1.2, -0.12, 1.4, 9);
    wineGlass(k, 0.25, 1.0, 0.18); wineGlass(k, 0.35, 1.0, 0.1);
    const bk = k.b(0.34, 0.03, 0.24, 0x5a1a1a, -0.05, 1.02, 0.2, 0.01); bk.rotation.y = 0.2; const pgs = k.b(0.3, 0.012, 0.2, 0xfbf6e8, -0.05, 1.04, 0.2, 0.003); pgs.rotation.y = 0.2;
  }, { tags: ['wedding', 'table'], use: [{ pose: 'stand', dx: 0, dz: -0.8, face: 0, act: 'pray' }], lamp: [[0, 1.6, 0.4, 0xffc070, 0.55, 5]] });

  const fleur = tm('k12fleur', 64, 96, (c, w, h) => { c.fillStyle = '#f6f0e4'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c8a050'; c.lineWidth = 3; c.strokeRect(5, 5, w - 10, h - 10); c.lineWidth = 1; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = '#d0a848'; c.save(); c.translate(w / 2, h / 2); c.beginPath(); c.moveTo(0, -26); c.bezierCurveTo(9, -14, 8, -2, 0, 6); c.bezierCurveTo(-8, -2, -9, -14, 0, -26); c.fill(); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 3, 2); c.bezierCurveTo(s * 18, -12, s * 22, 4, s * 14, 10); c.bezierCurveTo(s * 12, 4, s * 8, 4, s * 3, 8); c.fill(); } c.fillRect(-12, 8, 24, 4); c.beginPath(); c.moveTo(0, 12); c.lineTo(5, 24); c.lineTo(-5, 24); c.fill(); c.restore(); });
  def('k12c_podium', '백합 문장 조각 포디움 (필라 캔들)', 'venue', 1600, 0.7, 0.7, g => {
    const k = K(g); k.b(0.62, 0.12, 0.62, IVORY, 0, 0.06, 0, 0.02); k.b(0.5, 0.9, 0.5, fleur, 0, 0.57, 0, 0.02); k.b(0.64, 0.1, 0.64, IVORY, 0, 1.07, 0, 0.02); k.b(0.66, 0.025, 0.66, gold, 0, 1.01, 0);
    for (const [x, z, h] of [[-0.12, -0.08, 0.3], [0.1, -0.1, 0.22], [0, 0.12, 0.16]]) candle(k, x, 1.12, z, h, 0.055, 0.2);
  }, { tags: ['luxury', 'light'], lamp: [[0, 1.5, 0.2, 0xffb860, 0.3, 3]] });
  def('k12c_lectern', '성경 독서대 (조각 원목 · 펼친 책)', 'venue', 1400, 0.8, 0.7, g => {
    const k = K(g); k.b(0.5, 0.08, 0.5, wood, 0, 0.04, 0, 0.02); k.c(0.12, 0.16, 0.9, wood, 0, 0.5, 0); for (let i = 0; i < 4; i++) k.t(0.14, 0.02, DKW, 0, 0.25 + i * 0.2, 0).rotation.x = PI / 2;
    const top = new THREE.Group(); top.position.set(0, 1.08, 0); top.rotation.x = -0.4; g.add(top); const kt = K(top); kt.b(0.7, 0.05, 0.5, wood, 0, 0, 0, 0.02); kt.b(0.72, 0.04, 0.03, gold, 0, 0.02, 0.26); kt.b(0.62, 0.2, 0.04, fleur, 0, -0.12, 0.25, 0.01);
    for (const s of [-1, 1]) { const pgm = kt.b(0.27, 0.025, 0.36, 0xfbf6e4, s * 0.14, 0.045, 0, 0.005); pgm.rotation.z = s * -0.08; } kt.p(0.24, 0.3, tm('k12bible', 32, 40, (c, w, h) => { c.fillStyle = '#fbf6e4'; c.fillRect(0, 0, w, h); c.fillStyle = '#a02020'; c.fillRect(3, 3, 8, 8); c.fillStyle = '#4a3a2a'; for (let y = 14; y < h - 2; y += 3) c.fillRect(3, y, w - 6, 1); for (let y = 4; y < 12; y += 3) c.fillRect(13, y, w - 16, 1); }), 0.14, 0.06, 0).rotation.x = -PI / 2; kt.p(0.24, 0.3, tm('k12bible', 32, 40, () => {}), -0.14, 0.06, 0).rotation.x = -PI / 2; kt.b(0.012, 0.01, 0.34, 0xc8202a, 0.02, 0.07, 0.05);
  }, { tags: ['books'], use: [{ pose: 'read', dx: 0, dz: -0.7, face: 0, act: 'pray' }] });
  def('k12c_candle_table', '촛대 테이블 (필라 캔들 · 레이스)', 'venue', 1200, 0.8, 0.8, g => {
    const k = K(g); k.c(0.34, 0.34, 0.04, wood, 0, 0.8, 0); k.c(0.36, 0.36, 0.02, lace, 0, 0.83, 0); k.c(0.04, 0.06, 0.76, wood, 0, 0.4, 0); for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2; const l = k.b(0.3, 0.04, 0.05, wood, Math.cos(a) * 0.14, 0.04, Math.sin(a) * 0.14, 0.02); l.rotation.y = -a; }
    k.c(0.2, 0.22, 0.02, gold, 0, 0.85, 0); for (const [x, z, h] of [[0, 0, 0.34], [0.12, 0.06, 0.24], [-0.11, 0.07, 0.2], [0.05, -0.12, 0.28], [-0.08, -0.1, 0.14]]) candle(k, x, 0.86, z, h, 0.045, 0.2);
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; rose(k, Math.cos(a) * 0.24, 0.88, Math.sin(a) * 0.24, i % 3 ? ROSE : 0xf2c4cc, 0.8); }
  }, { tags: ['light', 'table'], lamp: [[0, 1.3, 0, 0xffb050, 0.4, 3.5]] });
  def('k12c_lily_urn', '대형 백합 화병 (흰 항아리 · 받침대)', 'misc', 1500, 0.7, 0.7, g => {
    const k = K(g); k.b(0.5, 0.7, 0.5, IVORY, 0, 0.35, 0, 0.02); k.b(0.56, 0.05, 0.56, gold, 0, 0.72, 0); k.c(0.14, 0.1, 0.12, WH, 0, 0.8, 0); k.s(0.2, WH, 0, 1.0, 0, 1, 1.1, 1); k.c(0.14, 0.18, 0.14, WH, 0, 1.2, 0); k.t(0.16, 0.015, gold, 0, 1.26, 0).rotation.x = PI / 2;
    lily(k, 0, 1.22, 0, 2.2, 11); for (let i = 0; i < 7; i++) { const a = i * 0.9; k.s(0.03, 0xfdfcf6, Math.cos(a) * 0.3, 1.35 + (i % 3) * 0.1, Math.sin(a) * 0.3); }
  }, { tags: ['flower', 'wedding'] });
  def('k12c_angel', '천사 조각상 (대리석 받침)', 'misc', 2200, 0.7, 0.7, g => {
    const k = K(g), S = 0xf4f0e8; k.b(0.56, 0.9, 0.56, IVORY, 0, 0.45, 0, 0.02); k.b(0.62, 0.06, 0.62, gold, 0, 0.92, 0); k.b(0.48, 0.1, 0.48, S, 0, 0.99, 0, 0.02);
    k.cone(0.22, 0.95, S, 0, 1.5, 0, 12); k.s(0.12, S, 0, 1.98, 0, 1, 1.1, 1); k.s(0.13, S, 0, 2.03, -0.03, 1, 0.8, 1); k.t(0.1, 0.012, gold, 0, 2.2, 0).rotation.x = PI / 2;
    for (const s of [-1, 1]) { const wg = k.s(0.28, S, s * 0.2, 1.75, -0.15, 0.35, 1.3, 0.12); wg.rotation.set(0.2, s * 0.5, s * -0.3); k.k(0.04, 0.26, S, s * 0.1, 1.62, 0.1).rotation.set(-0.9, 0, s * 0.3); }
    k.s(0.04, S, 0, 1.62, 0.2);
  }, { tags: ['luxury', 'art'] });
  // 제단 단상 (흰 대리석 + 금 모서리 + 버건디 카펫)
  def('k12c_dais', '제단 단상 (대리석 · 카펫)', 'misc', 3000, 9.6, 3.6, g => {
    const k = K(g); k.b(9.6, 0.16, 3.6, 0xf4eee6, 0, 0.08, 0, 0.01); k.b(9.62, 0.025, 0.04, gold, 0, 0.16, 1.8); for (const s of [-1, 1]) k.b(0.04, 0.025, 3.6, gold, s * 4.8, 0.16, 0);
    const t = ctex('k12dais', 128, 128, runnerDraw); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 2); rug(k, 3.2, 3.4, new THREE.MeshLambertMaterial({ map: t }), 0, 0, 0.17);
  }, { flat: true, tags: ['rug'] });

  // =========================================================
  // ⛪ 안쪽 벽 : 아치 회랑 · 갤러리 난간 · 호박색 스테인드글라스 · 유화
  // =========================================================
  const nicheMat = tm('k12niche', 32, 64, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8a7456'); gr.addColorStop(1, '#b8a07c'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
  const archShape = (hw, sp, r) => { const s = new THREE.Shape(); s.moveTo(-hw, 0); s.lineTo(-hw, sp); s.absarc(0, sp, r, PI, 0, true); s.lineTo(hw, 0); s.lineTo(-hw, 0); return s; };
  def('k12c_arcade', '기둥 위 아치 회랑 (벽)', 'wall', 3000, 5.2, 0.5, g => {
    const k = K(g), cols = [-2.4, -0.8, 0.8, 2.4];
    for (let i = 0; i < 3; i++) { const cx = (cols[i] + cols[i + 1]) / 2; const n = k.add(mesh(geo('k12nich', () => new THREE.ShapeGeometry(archShape(0.66, 2.6, 0.66), 12)), nicheMat, cx, 0, 0.03, false)); n.receiveShadow = true; k.t(0.72, 0.08, WH, cx, 2.62, 0.3, PI); k.t(0.72, 0.02, gold, cx, 2.62, 0.38, PI); }
    for (const x of cols) { k.b(0.4, 0.22, 0.4, IVORY, x, 0.11, 0.3, 0.02); k.c(0.12, 0.14, 2.24, WH, x, 1.34, 0.3); k.b(0.38, 0.12, 0.38, WH, x, 2.52, 0.3, 0.02); k.b(0.4, 0.03, 0.4, gold, x, 2.45, 0.3); k.t(0.08, 0.02, gold, x - 0.12, 2.52, 0.49); k.t(0.08, 0.02, gold, x + 0.12, 2.52, 0.49); }
    k.b(5.2, 0.14, 0.44, WH, 0, 3.42, 0.22, 0.02); k.b(5.2, 0.025, 0.46, gold, 0, 3.34, 0.23);
    // 아치 사이 벽감: 가운데 작은 성화, 양옆 촛대
    k.b(0.46, 0.6, 0.03, gold, 0, 1.75, 0.06, 0.01); plane(k, 0.38, 0.52, tm('k12icon', 32, 44, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d8b060'); gr.addColorStop(1, '#8a5a2a'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#f0d890'; c.beginPath(); c.arc(16, 14, 7, 0, 7); c.fill(); c.fillStyle = '#2a4a8a'; c.beginPath(); c.moveTo(16, 18); c.lineTo(27, 42); c.lineTo(5, 42); c.fill(); c.fillStyle = '#e8c8a8'; c.beginPath(); c.arc(16, 14, 4, 0, 7); c.fill(); }), 0, 1.75, 0.08);
    for (const x of [-1.6, 1.6]) { k.b(0.1, 0.03, 0.14, gold, x, 1.5, 0.1); candle(k, x, 1.52, 0.12, 0.18, 0.03, 0.18); }
  }, { wall: true, tags: ['luxury'], lamp: [[0, 1.8, 0.5, 0xffb860, 0.22, 3]] });
  def('k12c_gallery', '흰 난간 갤러리 (벽 발코니)', 'wall', 2600, 5.2, 0.9, g => {
    const k = K(g), y0 = 3.5; k.b(5.2, 0.18, 0.84, WH, 0, y0, 0.42, 0.02); for (let i = 0; i < 26; i++) k.b(0.08, 0.07, 0.06, gold, -2.5 + i * 0.2, y0 - 0.12, 0.8);
    for (let x = -2.5; x <= 2.51; x += 0.16) { k.c(0.024, 0.04, 0.1, WH, x, y0 + 0.14, 0.76); k.s(0.045, WH, x, y0 + 0.25, 0.76, 1, 1.35, 1); k.c(0.034, 0.024, 0.12, WH, x, y0 + 0.37, 0.76); }
    k.b(5.2, 0.05, 0.1, WH, 0, y0 + 0.11, 0.76, 0.01); k.b(5.24, 0.07, 0.12, WH, 0, y0 + 0.46, 0.76, 0.02); k.b(5.24, 0.02, 0.13, gold, 0, y0 + 0.5, 0.76);
    for (const x of [-2.6, -1.3, 0, 1.3, 2.6]) { k.b(0.14, 0.5, 0.14, WH, x, y0 + 0.28, 0.76, 0.02); k.s(0.05, gold, x, y0 + 0.58, 0.76); }
  }, { wall: true, tags: ['luxury'] });
  const amberTex = ctex('k12amber', 128, 200, (c, w, h) => {
    c.fillStyle = '#2a1608'; c.fillRect(0, 0, w, h); const cols = ['#f0b050', '#e89a38', '#c8742a', '#f6d07a', '#a85a20', '#e8a848', '#f8e0a0', '#8a4a1a'];
    let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let py = 0; py < 3; py++) for (let px = 0; px < 2; px++) { const x0 = px * 64 + 4, y0 = py * 66 + 4, pw = 56, ph = 58;
      for (let y = y0; y < y0 + ph; y += 10) for (let x = x0; x < x0 + pw; x += 14) { const cw = Math.min(13, x0 + pw - x), ch = Math.min(9, y0 + ph - y); const col = cols[(rnd() * cols.length) | 0]; const gr = c.createLinearGradient(x, y, x + cw, y + ch); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(90,40,10,0.9)'); c.fillStyle = gr; c.fillRect(x + 1, y + 1, cw - 1, ch - 1); c.fillStyle = 'rgba(255,240,200,0.18)'; c.fillRect(x + 2, y + 2, cw * 0.4, 2); }
      if (py === 0) { const cx = x0 + pw / 2, cy = y0 + ph / 2; c.fillStyle = '#2a1608'; c.beginPath(); c.arc(cx, cy, 20, 0, 7); c.fill(); for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; c.fillStyle = i % 2 ? '#f6d07a' : '#c85a2a'; c.beginPath(); c.ellipse(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10, 8, 4, a, 0, 7); c.fill(); } c.fillStyle = '#fff0b0'; c.beginPath(); c.arc(cx, cy, 5, 0, 7); c.fill(); }
      if (py === 2) { c.fillStyle = 'rgba(60,120,60,0.8)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(x0 + 8 + i * 11, y0 + ph - 10, 5, 9, 0.3 * (i - 2), 0, 7); c.fill(); } } }
  });
  const amberMat = new THREE.MeshBasicMaterial({ map: amberTex });
  def('k12c_clerestory', '호박색 스테인드글라스 격자창 (짙은 원목 틀)', 'wall', 2400, 1.4, 0.3, g => {
    const k = K(g), yc = 5.6, W = 1.3, H = 2.03; plane(k, W, H, amberMat, 0, yc, 0.05);
    k.b(W + 0.16, 0.12, 0.12, wood, 0, yc + H / 2 + 0.03, 0.06, 0.01); k.b(W + 0.2, 0.1, 0.2, wood, 0, yc - H / 2 - 0.04, 0.1, 0.01); for (const x of [-W / 2 - 0.02, 0, W / 2 + 0.02]) k.b(x ? 0.1 : 0.06, H, 0.1, wood, x, yc, 0.07, 0.01); for (const y of [-H / 6, H / 6]) k.b(W, 0.05, 0.08, wood, 0, yc + y, 0.07);
    halo(k, 1.1, 0xffc070, 0, yc, 0.15, 0.3); beam(k, 1.2, 6.4, 0xffc878, 0, 3.3, 2.4, 0.62, 0, 0.07); lightPatch(k, 'k12amb', 1.3, 2.2, 0xffb860, 0, 5.2, 0, 0.2, 2, 3);
  }, { wall: true, tags: ['window', 'luxury'], lamp: [[0, 4.6, 1.2, 0xffb868, 0.35, 7]] });
  const oil = (key, draw) => tm(key, 64, 80, draw);
  const paintA = oil('k12oilA', (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e8c888'); gr.addColorStop(0.5, '#b88a50'); gr.addColorStop(1, '#4a3a20'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#3a4a2a'; c.beginPath(); c.moveTo(0, 60); c.bezierCurveTo(20, 48, 40, 56, 64, 46); c.lineTo(64, 80); c.lineTo(0, 80); c.fill(); c.fillStyle = '#2a3a1a'; c.beginPath(); c.ellipse(44, 34, 12, 18, 0, 0, 7); c.fill(); c.fillRect(43, 44, 3, 16); c.fillStyle = '#fff4d0'; c.beginPath(); c.arc(16, 20, 6, 0, 7); c.fill(); });
  const paintB = oil('k12oilB', (c, w, h) => { c.fillStyle = '#3a2a1a'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8c070'; c.beginPath(); c.arc(32, 24, 14, 0, 7); c.fill(); c.fillStyle = '#e8c8a8'; c.beginPath(); c.arc(32, 26, 7, 0, 7); c.fill(); c.fillStyle = '#2a4a8a'; c.beginPath(); c.moveTo(32, 20); c.bezierCurveTo(50, 30, 52, 70, 54, 80); c.lineTo(10, 80); c.bezierCurveTo(12, 70, 14, 30, 32, 20); c.fill(); c.fillStyle = '#a02a2a'; c.beginPath(); c.moveTo(32, 36); c.lineTo(40, 80); c.lineTo(24, 80); c.fill(); c.fillStyle = '#f4e0c0'; c.beginPath(); c.arc(32, 52, 6, 0, 7); c.fill(); });
  const paintC = oil('k12oilC', (c, w, h) => { c.fillStyle = '#2a2018'; c.fillRect(0, 0, w, h); c.fillStyle = '#6a4a2a'; c.fillRect(0, 60, w, 20); c.fillStyle = '#8a8aa0'; c.beginPath(); c.moveTo(22, 60); c.lineTo(42, 60); c.lineTo(38, 40); c.lineTo(26, 40); c.fill(); for (let i = 0; i < 12; i++) { c.fillStyle = ['#e8e0d0', '#d86a6a', '#e8b0c0', '#f4d070'][i % 4]; c.beginPath(); c.arc(32 + Math.cos(i * 2.1) * (8 + i), 30 + Math.sin(i * 2.1) * (6 + i * 0.6), 5, 0, 7); c.fill(); } c.fillStyle = '#4a6a3a'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(20 + i * 5, 40, 3, 7, i, 0, 7); c.fill(); } });
  const framed = (k, W, H, m, y) => { plane(k, W, H, m, 0, y, 0.06); for (const [x, yy, ww, hh] of [[0, H / 2 + 0.05, W + 0.2, 0.1], [0, -H / 2 - 0.05, W + 0.2, 0.1], [-W / 2 - 0.05, 0, 0.1, H], [W / 2 + 0.05, 0, 0.1, H]]) k.b(ww, hh, 0.08, gold, x, y + yy, 0.05, 0.02); for (const [x, yy] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) k.s(0.06, gold, x * (W / 2 + 0.05), y + yy * (H / 2 + 0.05), 0.09); k.s(0.08, gold, 0, y + H / 2 + 0.12, 0.08, 1.6, 1, 0.6); };
  def('k12c_oil_a', '금 액자 유화 (풍경)', 'wall', 1500, 1.1, 0.15, g => framed(K(g), 0.9, 1.12, paintA, 5.6), { wall: true, tags: ['art'] });
  def('k12c_oil_b', '금 액자 유화 (성모)', 'wall', 1500, 1.1, 0.15, g => framed(K(g), 0.9, 1.12, paintB, 5.6), { wall: true, tags: ['art'] });
  def('k12c_oil_c', '금 액자 유화 (정물 꽃)', 'wall', 1500, 1.1, 0.15, g => framed(K(g), 0.9, 1.12, paintC, 5.6), { wall: true, tags: ['art'] });

  // =========================================================
  // ⛪ 옆벽 : 고딕 납선 유리창 · 촛대 벽등 · 아르누보 액자
  // =========================================================
  const gothPath = (c, w, h, i) => { const R = w - 2 * i, ah = i + R * 0.87; c.beginPath(); c.moveTo(i, h - i); c.lineTo(i, ah); c.arc(w - i, ah, R, PI, PI * 4 / 3); c.arc(i, ah, R, PI * 5 / 3, PI * 2); c.lineTo(w - i, h - i); c.closePath(); };
  const gothGlass = cm('k12goth', 128, 432, (c, w, h) => {
    c.save(); gothPath(c, w, h, 4); c.clip(); const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fff6e0'); gr.addColorStop(0.5, '#eef0ea'); gr.addColorStop(1, '#dde6ea'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(${i % 3 ? '255,240,210' : '200,220,235'},0.25)`; c.fillRect((i * 29) % w, 120 + (i * 71) % (h - 120), 14, 14); }
    c.strokeStyle = 'rgba(70,70,80,0.55)'; c.lineWidth = 1.2; for (let d = -h; d < w + h; d += 14) { c.beginPath(); c.moveTo(d, 0); c.lineTo(d + h * 0.5, h); c.stroke(); c.beginPath(); c.moveTo(d, h); c.lineTo(d + h * 0.5, 0); c.stroke(); }
    const rc = 72; c.fillStyle = '#e8e0d0'; c.beginPath(); c.arc(w / 2, rc, 34, 0, 7); c.fill(); for (let k2 = 0; k2 < 8; k2++) { const a = k2 / 8 * PI * 2; c.fillStyle = ['#e89aa8', '#f0c060', '#7aa0d8', '#9ad0a0'][k2 % 4]; c.beginPath(); c.arc(w / 2 + Math.cos(a) * 20, rc + Math.sin(a) * 20, 10, 0, 7); c.fill(); } c.fillStyle = '#f8e8a0'; c.beginPath(); c.arc(w / 2, rc, 9, 0, 7); c.fill();
    c.strokeStyle = '#4a4a50'; c.lineWidth = 2.5; c.beginPath(); c.arc(w / 2, rc, 34, 0, 7); c.stroke(); for (let k2 = 0; k2 < 8; k2++) { const a = k2 / 8 * PI * 2; c.beginPath(); c.arc(w / 2 + Math.cos(a) * 20, rc + Math.sin(a) * 20, 10, 0, 7); c.stroke(); }
    c.lineWidth = 4; c.strokeStyle = '#5a5a60'; c.beginPath(); c.moveTo(w / 2, 108); c.lineTo(w / 2, h); c.stroke(); c.lineWidth = 2.5; for (let y = 150; y < h; y += 70) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    for (let y = 120; y < h - 10; y += 18) for (const x of [10, w - 16]) { c.fillStyle = ['#e89aa8', '#f0c060', '#7aa0d8'][(y / 18 | 0) % 3]; c.fillRect(x, y, 6, 10); }
    c.restore();
  }, true);
  const gothFrame = cm('k12gothf', 144, 460, (c, w, h) => { c.fillStyle = '#efe6d4'; gothPath(c, w, h, 0); c.fill(); c.strokeStyle = '#c8b894'; c.lineWidth = 3; gothPath(c, w, h, 6); c.stroke(); c.strokeStyle = '#c8a050'; c.lineWidth = 1.5; gothPath(c, w, h, 11); c.stroke(); c.globalCompositeOperation = 'destination-out'; gothPath(c, w, h, 16); c.fill(); });
  def('k12c_gothic_window', '고딕 납선 유리창 (장미창 머리 · 햇살)', 'wall', 3200, 1.6, 0.3, g => {
    const k = K(g); plane(k, 1.3, 4.39, gothGlass, 0, 3.4, 0.04); plane(k, 1.46, 4.66, gothFrame, 0, 3.4, 0.07); k.b(1.6, 0.1, 0.26, IVORY, 0, 1.12, 0.12, 0.02); k.b(1.64, 0.025, 0.28, gold, 0, 1.06, 0.12);
    halo(k, 1.3, 0xfff4e0, 0, 3.7, 0.2, 0.32); beam(k, 1.2, 6.0, 0xfff2dc, 0, 2.6, 2.1, 0.66, 0, 0.1); lightPatch(k, 'k12goth', 1.3, 2.8, 0xfff0d8, 0, 4.0, 0, 0.3, 2, 5, true);
  }, { wall: true, tags: ['window'], lamp: [[0, 3.2, 1.4, 0xfff0dc, 0.45, 7]] });
  def('k12c_sconce', '3구 촛대 벽등 (금)', 'wall', 800, 0.6, 0.35, g => {
    const k = K(g); const bp = k.s(0.1, gold, 0, 2.2, 0.02, 1, 1.6, 0.3); void bp; k.c(0.02, 0.02, 0.22, gold, 0, 2.2, 0.12).rotation.x = PI / 2;
    for (const x of [-0.2, 0, 0.2]) { if (x) { const a = k.t(0.1, 0.014, gold, x / 2, 2.2, 0.22, PI); a.rotation.z = x > 0 ? PI : 0; a.rotation.x = PI / 2; } k.c(0.04, 0.025, 0.04, gold, x, x ? 2.22 : 2.32, 0.22); candle(k, x, x ? 2.24 : 2.34, 0.22, 0.16, 0.022, 0.24); }
    k.s(0.03, gold, 0, 2.02, 0.2); k.cone(0.02, 0.08, gold, 0, 1.96, 0.2).rotation.x = PI;
  }, { wall: true, tags: ['light'], lamp: [[0, 2.4, 0.4, 0xffb458, 0.34, 3.6]] });
  const nouveau = (key, hair, robe, bg) => tm(key, 72, 120, (c, w, h) => {
    c.fillStyle = bg; c.fillRect(0, 0, w, h); c.strokeStyle = '#b89048'; c.lineWidth = 2; c.strokeRect(4, 4, w - 8, h - 8);
    c.fillStyle = '#e8d8a8'; c.beginPath(); c.arc(w / 2, 40, 26, 0, 7); c.fill(); c.strokeStyle = '#b89048'; c.lineWidth = 1.5; c.beginPath(); c.arc(w / 2, 40, 26, 0, 7); c.stroke(); c.beginPath(); c.arc(w / 2, 40, 21, 0, 7); c.stroke(); for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * 21, 40 + Math.sin(a) * 21); c.lineTo(w / 2 + Math.cos(a) * 26, 40 + Math.sin(a) * 26); c.stroke(); }
    c.fillStyle = hair; c.beginPath(); c.moveTo(w / 2 - 12, 30); c.bezierCurveTo(w / 2 - 30, 50, w / 2 - 20, 70, w / 2 - 26, 92); c.lineTo(w / 2 - 10, 60); c.lineTo(w / 2 + 10, 60); c.lineTo(w / 2 + 26, 92); c.bezierCurveTo(w / 2 + 20, 70, w / 2 + 30, 50, w / 2 + 12, 30); c.bezierCurveTo(w / 2 + 6, 22, w / 2 - 6, 22, w / 2 - 12, 30); c.fill();
    c.fillStyle = '#f0d8c0'; c.beginPath(); c.ellipse(w / 2, 40, 8, 10, 0, 0, 7); c.fill(); c.fillStyle = robe; c.beginPath(); c.moveTo(w / 2 - 10, 52); c.bezierCurveTo(w / 2 - 22, 80, w / 2 - 16, 100, w / 2 - 20, 112); c.lineTo(w / 2 + 20, 112); c.bezierCurveTo(w / 2 + 16, 100, w / 2 + 22, 80, w / 2 + 10, 52); c.fill();
    for (let i = 0; i < 6; i++) { c.fillStyle = ['#e8a0a8', '#f4e0a0', '#fff'][i % 3]; c.beginPath(); c.arc(w / 2 - 18 + i * 7, 20 + (i % 2) * 4, 3, 0, 7); c.fill(); }
    c.fillStyle = '#c8a860'; c.fillRect(8, h - 16, w - 16, 8);
  });
  const nvA = nouveau('k12nvA', '#8a5a3a', '#6a9a8a', '#e8e0c8'), nvB = nouveau('k12nvB', '#c8904a', '#c89aa8', '#dde4d0');
  const nvFrame = (k, m) => { const y = 2.0; k.b(0.84, 1.36, 0.04, 0x8a6a30, 0, y, 0.02, 0.01); plane(k, 0.72, 1.2, m, 0, y, 0.045); k.t(0.4, 0.03, gold, 0, y + 0.62, 0.05, PI); for (const x of [-0.42, 0.42]) k.b(0.04, 1.36, 0.06, gold, x, y, 0.04); k.b(0.88, 0.05, 0.06, gold, 0, y - 0.68, 0.04); };
  def('k12c_nouveau_a', '아르누보 액자 (그린 드레스)', 'wall', 1300, 0.9, 0.12, g => nvFrame(K(g), nvA), { wall: true, tags: ['art'] });
  def('k12c_nouveau_b', '아르누보 액자 (핑크 드레스)', 'wall', 1300, 0.9, 0.12, g => nvFrame(K(g), nvB), { wall: true, tags: ['art'] });

  // =========================================================
  // ⛪ 회중석 : 장의자 · 꽃 스탠드 · 의자 · 봉헌 촛불 · 샹들리에 · 글로브 펜던트
  // =========================================================
  const bouquet = (k, x, y, z, side) => {
    for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2; rose(k, x + side * 0.02, y + Math.sin(a) * 0.09, z + Math.cos(a) * 0.09, i % 4 ? ROSE : 0xf6e2d8, 1.1); } rose(k, x + side * 0.05, y, z, ROSE, 1.2);
    for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2 + 0.2; k.s(0.04, LEAF, x, y + Math.sin(a) * 0.14, z + Math.cos(a) * 0.14, 0.3, 1, 1.6).rotation.x = a; }
    for (const s of [-1, 1]) { const b = k.t(0.05, 0.014, gold, x + side * 0.03, y - 0.14, z + s * 0.05); b.rotation.y = PI / 2; b.scale.set(1.4, 0.7, 1); const tl = k.b(0.01, 0.34, 0.035, gold, x + side * 0.03, y - 0.32, z + s * 0.05); tl.rotation.x = s * 0.18; }
  };
  const pew = (k, bSide) => {
    k.b(3.6, 0.08, 0.5, wood, 0, 0.45, 0.02, 0.02); const bk = k.b(3.6, 0.56, 0.06, wood, 0, 0.8, -0.24, 0.02); bk.rotation.x = -0.12; k.b(3.64, 0.07, 0.1, wood, 0, 1.08, -0.28, 0.03);
    for (let x = -1.5; x <= 1.51; x += 0.6) k.b(0.06, 0.4, 0.02, DKW, x, 0.8, -0.2);
    for (const s of [-1, 1]) { k.b(0.08, 0.92, 0.66, wood, s * 1.82, 0.46, -0.02, 0.02); k.c(0.1, 0.1, 0.08, wood, s * 1.82, 0.96, -0.3).rotation.z = PI / 2; k.b(0.09, 0.5, 0.4, DKW, s * 1.83, 0.5, 0.02, 0.02); }
    k.b(3.4, 0.14, 0.1, wood, 0, 0.62, -0.36, 0.01); for (let i = 0; i < 10; i++) k.b(0.05, 0.16, 0.1, [0x5a1a1a, 0x1a1a2a, 0x2a3a5a][i % 3], -1.5 + i * 0.33, 0.72, -0.36, 0.005);
    k.b(3.4, 0.06, 0.18, 0x6a1a24, 0, 0.18, -0.52, 0.02);
    bouquet(k, bSide * 1.9, 0.82, 0.05, bSide);
  };
  const PEW_USE = { use: [-1.15, 0, 1.15].map(x => ({ pose: 'sit', dx: x, dz: 0.06, face: 0, act: 'pray', seatH: 0.5 })), tags: ['chair', 'wedding'] };
  def('k12c_pew_l', '원목 장의자 (흰 장미 · 금 리본 부케, 오른쪽 통로)', 'venue', 2400, 3.8, 0.9, g => pew(K(g), -1), PEW_USE);
  def('k12c_pew_r', '원목 장의자 (흰 장미 · 금 리본 부케, 왼쪽 통로)', 'venue', 2400, 3.8, 0.9, g => pew(K(g), 1), PEW_USE);
  def('k12c_rose_stand', '금 꽃 스탠드 (핑크 · 흰 장미)', 'misc', 1200, 0.6, 0.6, g => {
    const k = K(g); for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2; const l = k.t(0.16, 0.018, gold, Math.cos(a) * 0.14, 0.14, Math.sin(a) * 0.14, PI); l.rotation.y = -a + PI / 2; } k.c(0.025, 0.025, 1.0, gold, 0, 0.6, 0); k.t(0.08, 0.015, gold, 0, 0.5, 0).rotation.x = PI / 2; k.c(0.16, 0.08, 0.1, gold, 0, 1.13, 0);
    for (let i = 0; i < 22; i++) { const a = i * 2.4, r = 0.05 + (i % 5) * 0.045; rose(k, Math.cos(a) * r, 1.24 + (i % 4) * 0.05 - r * 0.4, Math.sin(a) * r, [0xf6c8d0, ROSE, 0xf0a8b8, 0xfbe8e8][i % 4], 1.1); } for (let i = 0; i < 10; i++) { const a = i * 0.63; k.s(0.05, LEAF, Math.cos(a) * 0.26, 1.16, Math.sin(a) * 0.26, 1.6, 0.3, 0.7).rotation.y = -a; }
    for (let i = 0; i < 5; i++) { const a = i * 1.26; rose(k, Math.cos(a) * 0.24, 1.0 - i * 0.04, Math.sin(a) * 0.24, ROSE, 0.9); }
  }, { tags: ['flower', 'wedding'] });
  def('k12c_chair', '조각 원목 의자 (버건디 벨벳)', 'rest', 900, 0.6, 0.6, g => {
    const k = K(g); k.b(0.52, 0.1, 0.5, 0x7a1a28, 0, 0.48, 0, 0.04); k.b(0.54, 0.05, 0.52, wood, 0, 0.42, 0, 0.02); for (const [x, z] of [[-0.23, -0.21], [0.23, -0.21], [-0.23, 0.21], [0.23, 0.21]]) k.c(0.025, 0.02, 0.42, wood, x, 0.21, z);
    for (const x of [-0.23, 0.23]) { k.c(0.025, 0.025, 0.7, wood, x, 0.8, -0.23); k.s(0.035, gold, x, 1.16, -0.23); } k.b(0.4, 0.46, 0.05, 0x7a1a28, 0, 0.82, -0.23, 0.04); k.t(0.2, 0.025, wood, 0, 1.06, -0.23, PI);
  }, { tags: ['chair'], use: [{ pose: 'sit', dx: 0, dz: 0.03, face: 0, act: 'sit', seatH: 0.5 }] });
  def('k12c_votive', '봉헌 촛불대 (호박 유리컵 3단)', 'misc', 1500, 1.2, 0.6, g => {
    const k = K(g); for (let r = 0; r < 3; r++) { k.b(1.1, 0.04, 0.2, 0x2a2a2a, 0, 0.55 + r * 0.18, 0.12 - r * 0.16, 0.01); for (let i = 0; i < 9 - r; i++) { const x = -0.48 + i * (0.96 / (8 - r)), y = 0.57 + r * 0.18, z = 0.12 - r * 0.16; k.c(0.035, 0.03, 0.07, glass((i + r) % 3 ? 0xd8602a : 0xe8a038), x, y + 0.035, z); k.s(0.012, flame, x, y + 0.08, z, 1, 1.6, 1); if ((i + r) % 2 === 0) halo(k, 0.1, 0xff9a40, x, y + 0.08, z, 0.6); } }
    for (const x of [-0.53, 0.53]) for (const z of [-0.2, 0.2]) k.c(0.015, 0.015, 0.95, 0x2a2a2a, x, 0.47, z); k.b(0.2, 0.3, 0.14, 0x3a2a1a, 0.4, 0.15, 0.15, 0.02); k.b(0.08, 0.01, 0.02, 0xc8a050, 0.4, 0.3, 0.2);
  }, { tags: ['light'], lamp: [[0, 1.0, 0.2, 0xff9a40, 0.32, 3.5]] });
  def('k12c_font', '대리석 성수대', 'misc', 1100, 0.6, 0.6, g => { const k = K(g); k.c(0.2, 0.26, 0.08, IVORY, 0, 0.04, 0); k.c(0.08, 0.12, 0.8, WH, 0, 0.48, 0); k.t(0.1, 0.02, gold, 0, 0.3, 0).rotation.x = PI / 2; k.add(mesh(geo('k12font', () => new THREE.SphereGeometry(0.28, 20, 8, 0, PI * 2, PI / 2, PI / 2)), new THREE.MeshLambertMaterial({ color: WH, side: THREE.DoubleSide }), 0, 1.0, 0)).rotation.x = PI; k.c(0.26, 0.26, 0.01, glass(0xbfe0f0), 0, 0.96, 0); k.t(0.28, 0.02, gold, 0, 1.0, 0).rotation.x = PI / 2; }, { tags: ['luxury'] });
  def('k12c_aisle_candle', '통로 촛대 (금 · 흰 장미 · 필라 캔들)', 'misc', 900, 0.5, 0.5, g => { const k = K(g); k.c(0.18, 0.22, 0.05, gold, 0, 0.025, 0); k.c(0.03, 0.04, 1.3, gold, 0, 0.7, 0); for (let i = 0; i < 3; i++) k.t(0.05, 0.012, gold, 0, 0.4 + i * 0.35, 0).rotation.x = PI / 2; k.c(0.16, 0.08, 0.06, gold, 0, 1.38, 0); for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; rose(k, Math.cos(a) * 0.15, 1.42, Math.sin(a) * 0.15, ROSE, 0.9); } candle(k, 0, 1.41, 0, 0.3, 0.06, 0.3); }, { tags: ['light', 'wedding'], lamp: [[0, 1.9, 0, 0xffc070, 0.26, 3]] });
  def('k12c_globe', '글로브 펜던트 조명 (황동 체인)', 'light', 800, 0.6, 0.6, g => { const k = K(g); k.c(0.06, 0.06, 0.03, 0xb89040, 0, 7.18, 0); for (let i = 0; i < 16; i++) k.t(0.025, 0.006, 0xb89040, 0, 7.12 - i * 0.14, 0).rotation.y = (i % 2) * PI / 2; k.c(0.05, 0.08, 0.1, 0xb89040, 0, 4.86, 0); k.s(0.28, glow(0xfff1d8), 0, 4.58, 0); halo(k, 0.9, 0xffe0b0, 0, 4.58, 0, 0.55); }, { ceiling: true, tags: ['light'], lamp: [[0, 4.3, 0, 0xffd8a0, 0.55, 8]] });
  def('k12c_chandelier', '금 촛불 샹들리에 (크리스털)', 'light', 3000, 1.8, 1.8, g => {
    const k = K(g); k.c(0.012, 0.012, 2.1, gold, 0, 6.15, 0); k.s(0.12, gold, 0, 5.05, 0, 1, 1.4, 1); k.c(0.04, 0.04, 0.9, gold, 0, 4.6, 0); k.s(0.1, gold, 0, 4.1, 0);
    for (const [R, y, n] of [[0.85, 4.35, 12], [0.5, 4.8, 8]]) { k.t(R, 0.025, gold, 0, y, 0).rotation.x = PI / 2; for (let i = 0; i < n; i++) { const a = i / n * PI * 2, x = Math.cos(a) * R, z = Math.sin(a) * R; k.c(0.04, 0.03, 0.04, gold, x, y + 0.03, z); candle(k, x, y + 0.05, z, 0.14, 0.02, 0.22); k.s(0.025, glass(0xf4fbff), x, y - 0.08, z, 1, 1.6, 1); const arm = k.t(R / 2, 0.012, gold, x / 2, y - 0.08, z / 2, PI); arm.rotation.y = -a; } }
    for (let i = 0; i < 24; i++) { const a = i / 24 * PI * 2; k.s(0.018, glass(0xf8fcff), Math.cos(a) * 0.7, 4.18 - (i % 3) * 0.05, Math.sin(a) * 0.7, 1, 1.8, 1); }
    halo(k, 1.6, 0xffd8a0, 0, 4.5, 0, 0.35);
  }, { ceiling: true, tags: ['light', 'luxury'], lamp: [[0, 4.2, 0, 0xffcc88, 0.8, 11]] });

  // =========================================================
  // 대성당 정의 갱신 (16 × 18, 천장 7.2m)
  // =========================================================
  const C = FM.INTERIORS.cathedral_in;
  if (C) {
    const pews = []; for (const z of [-3.8, -2.0, -0.2, 1.6, 3.4, 5.2]) pews.push(f('k12c_pew_l', -4.15, z, 180), f('k12c_pew_r', 4.15, z, 180));
    Object.assign(C, { w: 16, d: 18, wallH: 7.2, wallStyle: 'st_cathback', wallStyleL: 'st_cathside', wallStyleR: 'st_cathside', floor: 'cathlattice', floorColor: 0xf1ebe6, wall: 0xece0c8, light: 'warm', maxLamps: 14,
      zones: '안쪽 제단 & 파이프 오르간 · 버건디 카펫 버진로드 · 장의자 회중석 · 옆 회랑(고딕 창 · 촛대 · 꽃 스탠드)',
      levels: [{ x0: -4.8, x1: 4.8, z0: -8.95, z1: -5.3, y: 0.16 }],
      venueMood: { main: 0.34, lamp: 0.85, hemi: [0xfff0d8, 0x5a4030, 0.3], amb: [0xffe8cc, 0.08], dir: [0xffe2b8, 0.5], bg: 0x241a12, rim: 0.3, shadow: { pos: [-7, 12, 5], soft: 4 } },
      furn: [
        // 제단 & 오르간 (사진 1 가운데)
        f('k12c_dais', 0, -7.1), f('k12c_organ', 0, -8.2, 0, 0.16), f('k12c_altar', 0, -6.2, 0, 0.16), f('k12c_lectern', -2.7, -5.8, 20, 0.16), f('k12c_podium', 2.7, -5.9, 0, 0.16), f('k12c_podium', -3.9, -7.9, 0, 0.16),
        f('k12c_candle_table', 2.3, -7.6, 0, 0.16), f('k12c_candle_table', -2.3, -7.4, 0, 0.16), f('k12c_lily_urn', 4.2, -6.2, 0, 0.16), f('k12c_lily_urn', -4.25, -6.3, 0, 0.16), f('k12c_angel', 3.9, -8.2, 0, 0.16), f('k12c_rose_stand', -1.6, -5.55, 0, 0.16), f('k12c_rose_stand', 1.6, -5.55, 0, 0.16),
        // 안쪽 벽 : 아치 회랑 · 갤러리 · 스테인드글라스 격자창 · 유화
        f('k12c_arcade', -5.25, -8.94), f('k12c_arcade', 5.25, -8.94), f('k12c_gallery', -5.25, -8.94), f('k12c_gallery', 5.25, -8.94),
        f('k12c_clerestory', -7.05, -8.94), f('k12c_clerestory', -4.35, -8.94), f('k12c_clerestory', 4.35, -8.94), f('k12c_clerestory', 7.05, -8.94),
        f('k12c_oil_b', -5.7, -8.94), f('k12c_oil_a', -3.05, -8.94), f('k12c_oil_c', 3.05, -8.94), f('k12c_oil_b', 5.7, -8.94),
        // 카펫 · 통로 촛대 · 장의자
        f('k12c_runner', 0, 1.9), f('k12c_runner_x', 0, -4.75, 90), f('k12c_aisle_candle', -1.3, -4.7), f('k12c_aisle_candle', 1.3, -4.7), f('k12c_aisle_candle', -1.3, 7.2), f('k12c_aisle_candle', 1.3, 7.2), ...pews,
        // 옆벽 : 고딕 창 · 촛대 벽등 · 아르누보 액자
        f('k12c_gothic_window', -7.94, -4.3, 90), f('k12c_gothic_window', -7.94, 0.7, 90), f('k12c_gothic_window', -7.94, 5.7, 90), f('k12c_gothic_window', 7.94, -4.3, -90), f('k12c_gothic_window', 7.94, 0.7, -90), f('k12c_gothic_window', 7.94, 5.7, -90),
        f('k12c_sconce', -7.94, -1.8, 90), f('k12c_sconce', -7.94, 3.2, 90), f('k12c_sconce', 7.94, -1.8, -90), f('k12c_sconce', 7.94, 3.2, -90), f('k12c_sconce', -7.94, 7.9, 90), f('k12c_sconce', 7.94, 7.9, -90),
        f('k12c_nouveau_a', -7.94, -6.9, 90), f('k12c_nouveau_b', 7.94, -6.9, -90), f('k12c_nouveau_b', -7.94, 8.4, 90), f('k12c_nouveau_a', 7.94, 8.4, -90),
        // 옆 회랑 소품
        f('k12c_rose_stand', -7.3, -1.8), f('k12c_rose_stand', 7.3, -1.8), f('k12c_rose_stand', -7.3, 3.2), f('k12c_rose_stand', 7.3, 3.2), f('k12c_chair', -7.2, -6.9, 90), f('k12c_chair', 7.2, -6.9, -90),
        f('k12c_votive', -6.7, 7.9, 0), f('k12c_font', 6.9, 7.6), f('k12c_chair', 7.2, 5.9, -90), f('k12c_lily_urn', -7.2, 5.9), f('k12c_angel', -6.5, -8.3),
        // 조명
        f('k12c_chandelier', 0, 0.2), f('k12c_chandelier', 0, 6.0), f('k12c_globe', -4.15, -3.0), f('k12c_globe', 4.15, -3.0), f('k12c_globe', -4.15, 1.6), f('k12c_globe', 4.15, 1.6), f('k12c_globe', -4.15, 5.8), f('k12c_globe', 4.15, 5.8),
      ] });
    const st = FM.Sim && FM.Sim.get && FM.Sim.get(); if (st && st.rooms && st.rooms.cathedral_in) delete st.rooms.cathedral_in;
  }

  // =========================================================
  // 💒 야외 웨딩 가든 소품 (사진 2)
  // =========================================================
  const IRON = 0xfbfaf6;
  const scrollback = cm('k12iron', 128, 48, (c, w, h) => { c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(2, 2, w - 4, h - 4); c.lineWidth = 2.2; for (let x = 16; x < w; x += 32) { c.beginPath(); c.arc(x, h / 2, 10, 0, PI * 1.7); c.stroke(); c.beginPath(); c.arc(x + 4, h / 2 + 2, 4, PI, PI * 2.6); c.stroke(); c.beginPath(); c.moveTo(x + 16, 4); c.lineTo(x + 16, h - 4); c.stroke(); } });
  def('k12g_bench', '흰 철제 하객 벤치 (소용돌이 등받이)', 'rest', 1200, 2.3, 0.7, g => {
    const k = K(g); for (let i = 0; i < 6; i++) k.b(2.2, 0.035, 0.07, IRON, 0, 0.45, -0.18 + i * 0.075, 0.01);
    const bk = plane(k, 2.2, 0.5, scrollback, 0, 0.78, -0.24); bk.material.side = THREE.DoubleSide; bk.rotation.x = -0.1; k.b(2.24, 0.04, 0.05, IRON, 0, 1.04, -0.27, 0.01);
    for (const x of [-1.08, 1.08]) { k.c(0.02, 0.02, 0.45, IRON, x, 0.225, 0.2); k.c(0.02, 0.02, 1.0, IRON, x, 0.5, -0.24); const ar = k.t(0.16, 0.018, IRON, x, 0.64, 0.02, PI); ar.rotation.y = PI / 2; k.s(0.03, IRON, x, 0.62, 0.2); }
    for (let i = 0; i < 3; i++) rose(k, -1.12, 0.95 - i * 0.12, -0.2 + i * 0.03, ROSE, 0.9); k.s(0.04, LEAF, -1.14, 0.8, -0.18, 0.4, 1.4, 0.8);
  }, { tags: ['chair', 'wedding', 'outdoor'], use: [-0.7, 0, 0.7].map(x => ({ pose: 'sit', dx: x, dz: 0.05, face: 0, act: 'sit', seatH: 0.48 })) });
  const drape = new THREE.MeshLambertMaterial({ color: 0xf0cc78, transparent: true, opacity: 0.82, side: THREE.DoubleSide });
  def('k12g_arch', '금 드레이프 & 흰 장미 웨딩 아치', 'misc', 5000, 3.6, 1.2, g => {
    const k = K(g), W = 1.5, H = 2.5;
    for (const s of [-1, 1]) { for (const z of [-0.3, 0.3]) k.c(0.04, 0.04, H, IRON, s * W, H / 2, z); for (let y = 0.3; y < H; y += 0.35) k.b(0.04, 0.03, 0.6, IRON, s * W, y, 0); k.b(0.5, 0.12, 0.8, IVORY, s * W, 0.06, 0, 0.02); }
    for (const z of [-0.3, 0.3]) k.t(W, 0.04, IRON, 0, H, z, PI);
    for (let i = 0; i <= 12; i++) { const a = i / 12 * PI; k.b(0.03, 0.03, 0.6, IRON, Math.cos(a) * W, H + Math.sin(a) * W, 0).rotation.z = a; }
    // 흰 장미 가랜드 (기둥 → 아치 꼭대기)
    for (let i = 0; i < 44; i++) { const t = i / 43; let x, y; if (t < 0.25) { x = -W; y = t / 0.25 * H; } else if (t > 0.75) { x = W; y = (1 - t) / 0.25 * H; } else { const a = PI - (t - 0.25) / 0.5 * PI; x = Math.cos(a) * W; y = H + Math.sin(a) * W; } const zz = ((i * 7) % 5 - 2) * 0.08; rose(k, x + ((i % 3) - 1) * 0.06, y, zz, i % 5 ? ROSE : 0xf8e4dc, 1.15); if (i % 2) k.s(0.05, LEAF, x, y - 0.05, zz + 0.1, 1.4, 0.4, 0.8).rotation.z = i; }
    for (const s of [-1, 1]) { for (let i = 0; i < 12; i++) rose(k, s * (W + 0.1) + ((i % 3) - 1) * 0.12, 0.2 + (i % 4) * 0.08, ((i % 5) - 2) * 0.12, ROSE, 1.6); leaves(k, s * W, 0.15, 0, 7, 0.28); }
    // 금 드레이프 (꼭대기에서 양옆으로 늘어진 천)
    for (const s of [-1, 1]) { const shp = new THREE.Shape(); shp.moveTo(0, 0); shp.bezierCurveTo(s * 0.6, -0.35, s * 1.0, -0.2, s * 1.35, -0.1); shp.lineTo(s * 1.45, -1.9); shp.bezierCurveTo(s * 1.3, -1.2, s * 0.9, -0.6, 0, -0.22); shp.lineTo(0, 0); const dm = k.add(mesh(geo('k12drape' + s, () => new THREE.ShapeGeometry(shp, 12)), drape, 0, H + W - 0.05, 0.36, false)); dm.userData.noBake = true;
      const dm2 = k.add(mesh(geo('k12drape' + s, () => new THREE.ShapeGeometry(shp, 12)), drape, 0, H + W - 0.1, 0.4, false)); dm2.rotation.y = 0.05; dm2.userData.noBake = true; }
    for (let i = 0; i < 7; i++) rose(k, (i - 3) * 0.08, H + W + 0.02 - Math.abs(i - 3) * 0.02, 0.38, ROSE, 1.7); k.s(0.07, gold, 0, H + W - 0.06, 0.42);
  }, { tags: ['wedding', 'flower', 'outdoor'] });
  def('k12g_hedge', '흰 장미 산울타리', 'misc', 700, 1.6, 0.5, g => { const k = K(g); k.b(1.6, 0.5, 0.46, 0x3f6e34, 0, 0.25, 0, 0.12); k.b(1.5, 0.08, 0.4, 0x4a7a3c, 0, 0.5, 0, 0.06); for (let i = 0; i < 16; i++) rose(k, -0.72 + (i * 0.097), 0.5 + (i % 2) * 0.05, ((i * 5) % 3 - 1) * 0.14, i % 4 ? ROSE : 0xf6e8e0, 1.3); for (let i = 0; i < 10; i++) rose(k, -0.7 + i * 0.155, 0.28 + (i % 3) * 0.06, 0.24, ROSE, 1.1); }, { tags: ['plant', 'wedding', 'outdoor'] });
  def('k12g_wreath', '금 화환 스탠드 (흰 장미 리스)', 'misc', 900, 0.6, 0.5, g => {
    const k = K(g); for (const s of [-1, 1]) { const l = k.c(0.015, 0.015, 1.6, gold, s * 0.16, 0.8, 0); l.rotation.z = s * 0.1; } k.c(0.012, 0.012, 1.1, gold, 0, 0.55, -0.2).rotation.x = 0.2; k.b(0.36, 0.03, 0.03, gold, 0, 0.9, 0);
    const y = 1.35; for (let i = 0; i < 26; i++) { const a = i / 26 * PI * 2; rose(k, Math.cos(a) * 0.3, y + Math.sin(a) * 0.3, 0.02, i % 3 ? ROSE : 0xf6e2d8, 1.2); k.s(0.04, LEAF, Math.cos(a + 0.1) * 0.36, y + Math.sin(a + 0.1) * 0.36, -0.01, 1.5, 0.4, 0.6).rotation.z = a; }
    for (const s of [-1, 1]) { const b = k.t(0.06, 0.016, gold, s * 0.06, y - 0.34, 0.06); b.scale.set(1.3, 0.7, 1); k.b(0.03, 0.35, 0.01, gold, s * 0.05, y - 0.55, 0.06).rotation.z = s * 0.2; }
  }, { tags: ['wedding', 'flower', 'outdoor'] });
  def('k12g_lantern', '흰 랜턴 가로등', 'misc', 900, 0.5, 0.5, g => { const k = K(g); k.c(0.14, 0.18, 0.12, IRON, 0, 0.06, 0); k.c(0.035, 0.04, 2.1, IRON, 0, 1.1, 0); for (let i = 0; i < 3; i++) k.t(0.05, 0.012, IRON, 0, 0.5 + i * 0.6, 0).rotation.x = PI / 2; k.b(0.3, 0.04, 0.3, IRON, 0, 2.18, 0, 0.01); for (const [x, z] of [[-0.13, -0.13], [0.13, -0.13], [-0.13, 0.13], [0.13, 0.13]]) k.c(0.012, 0.012, 0.4, IRON, x, 2.4, z); k.b(0.24, 0.36, 0.24, glass(0xfff4d8), 0, 2.4, 0); k.s(0.05, glow(0xffe0a0), 0, 2.38, 0, 1, 1.5, 1); k.cone(0.22, 0.2, IRON, 0, 2.7, 0, 4).rotation.y = PI / 4; k.s(0.03, gold, 0, 2.82, 0); halo(k, 0.5, 0xffd8a0, 0, 2.4, 0, 0.45); for (let i = 0; i < 5; i++) rose(k, Math.cos(i * 1.26) * 0.1, 2.12, Math.sin(i * 1.26) * 0.1, ROSE, 1); }, { tags: ['light', 'outdoor'], lamp: [[0, 2.4, 0, 0xffd8a0, 0.3, 4]] });
  const welcome = pic('k12welcome', 96, 128, (c, w, h) => { c.fillStyle = '#fbf6ec'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c8a050'; c.lineWidth = 2; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#b08a3a'; c.textAlign = 'center'; c.font = 'italic bold 16px serif'; c.fillText('Welcome', w / 2, 44); c.font = '9px serif'; c.fillText('to our wedding', w / 2, 58); c.fillStyle = '#d88a9a'; c.font = '16px serif'; c.fillText('♥', w / 2, 80); c.fillStyle = '#8a7a6a'; c.font = '8px sans-serif'; c.fillText('FRIENDS ISLAND', w / 2, 100); for (const [x, y] of [[12, 12], [w - 12, 12], [12, h - 12], [w - 12, h - 12]]) { for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#f4d0d8' : '#fff'; c.beginPath(); c.arc(x + Math.cos(i * 1.26) * 5, y + Math.sin(i * 1.26) * 5, 4, 0, 7); c.fill(); } c.fillStyle = '#8ab07a'; c.beginPath(); c.ellipse(x + 8, y, 5, 2, 0.4, 0, 7); c.fill(); } });
  def('k12g_easel', '웰컴 보드 이젤 (금 · 장미)', 'misc', 700, 0.8, 0.6, g => { const k = K(g); for (const s of [-1, 1]) { const l = k.b(0.04, 1.8, 0.04, gold, s * 0.3, 0.88, 0.05); l.rotation.z = s * 0.1; l.rotation.x = -0.08; } k.b(0.04, 1.6, 0.04, gold, 0, 0.78, -0.3).rotation.x = 0.3; k.b(0.72, 0.04, 0.1, gold, 0, 0.62, 0.1); const bd = k.b(0.66, 0.88, 0.03, 0xfbf6ec, 0, 1.08, 0.1, 0.01); bd.rotation.x = -0.08; plane(k, 0.62, 0.84, welcome, 0, 1.08, 0.12).rotation.x = -0.08; for (let i = 0; i < 9; i++) rose(k, -0.3 + (i % 5) * 0.03 + (i > 4 ? 0.5 : 0), 1.5 - (i % 5) * 0.05, 0.14, i % 3 ? ROSE : 0xf4c8d0, 1.3); leaves(k, -0.26, 1.46, 0.14, 4, 0.08); }, { tags: ['wedding', 'outdoor'] });
  def('k12g_harp', '금빛 하프', 'misc', 3000, 0.8, 0.8, g => { const k = K(g); k.b(0.4, 0.08, 0.5, gold, 0, 0.04, 0, 0.02); const pl = k.b(0.1, 1.7, 0.12, gold, 0, 0.9, -0.18); pl.rotation.x = 0.08; const nk = k.t(0.28, 0.04, gold, 0, 1.62, 0.02, PI); nk.rotation.y = PI / 2; const sb = k.b(0.18, 1.5, 0.12, 0xe8c070, 0, 0.8, 0.26); sb.rotation.x = -0.35; for (let i = 0; i < 12; i++) { const z = -0.12 + i * 0.035, top = 1.62 + Math.sin((i / 11) * PI) * 0.22 - i * 0.02; k.c(0.004, 0.004, top - 0.15 - i * 0.07, i % 7 === 0 ? 0xc83a3a : 0xf4f0e0, 0, (top + 0.15 + i * 0.07) / 2, z); } k.s(0.05, gold, 0, 1.78, -0.2); }, { tags: ['music', 'wedding', 'outdoor'] });
  def('k12g_piano', '흰 그랜드 피아노 (촛대 · 악보)', 'misc', 5000, 1.6, 1.8, g => { const k = K(g); const shp = new THREE.Shape(); shp.moveTo(-0.7, -0.8); shp.lineTo(0.7, -0.8); shp.lineTo(0.7, 0.1); shp.bezierCurveTo(0.7, 0.9, 0.1, 0.5, -0.1, 0.9); shp.lineTo(-0.7, 0.9); shp.lineTo(-0.7, -0.8); const bd = k.add(mesh(geo('k12pno', () => new THREE.ExtrudeGeometry(shp, { depth: 0.3, bevelEnabled: false })), new THREE.MeshPhongMaterial({ color: 0xfbfaf6, shininess: 90 }), 0, 0.95, 0)); bd.rotation.x = PI / 2; const lid = k.add(mesh(geo('k12pnol', () => new THREE.ShapeGeometry(shp)), new THREE.MeshPhongMaterial({ color: 0xfbfaf6, shininess: 90, side: THREE.DoubleSide }), 0, 1.0, 0.1)); lid.rotation.x = -PI / 2 + 0.6; lid.position.set(0, 1.05, 0); for (const [x, z] of [[-0.6, -0.7], [0.6, -0.7], [-0.4, 0.75]]) k.c(0.05, 0.04, 0.66, 0xfbfaf6, x, 0.33, z); k.b(1.36, 0.04, 0.2, 0xfbf8f0, 0, 0.9, -0.88); for (let i = 0; i < 16; i++) if (i % 7 !== 2 && i % 7 !== 6) k.b(0.035, 0.03, 0.1, 0x1a1a1a, -0.6 + i * 0.08, 0.93, -0.84); k.b(1.2, 0.07, 0.36, 0xfbfaf6, 0, 0.5, -1.3, 0.02); candle(k, 0.55, 1.0, -0.6, 0.2, 0.03, 0.2); }, { tags: ['music', 'wedding', 'outdoor'], use: [{ pose: 'type', dx: 0, dz: -1.3, face: 0, act: 'sit', seatH: 0.55 }] });
  def('k12g_lily_pedestal', '대형 백합 받침대 (흰 기둥)', 'misc', 1500, 0.8, 0.8, g => { const k = K(g); k.b(0.5, 0.1, 0.5, IVORY, 0, 0.05, 0, 0.02); k.c(0.16, 0.18, 1.0, WH, 0, 0.6, 0, 16); for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; k.b(0.02, 1.0, 0.02, IVORY, Math.cos(a) * 0.17, 0.6, Math.sin(a) * 0.17); } k.b(0.46, 0.08, 0.46, IVORY, 0, 1.14, 0, 0.02); k.c(0.18, 0.12, 0.2, WH, 0, 1.28, 0); lily(k, 0, 1.36, 0, 2.6, 13); for (let i = 0; i < 10; i++) { const a = i * 0.63; rose(k, Math.cos(a) * 0.22, 1.36, Math.sin(a) * 0.22, ROSE, 1.2); } for (let i = 0; i < 6; i++) { const a = i * 1.05; k.s(0.05, LEAF, Math.cos(a) * 0.34, 1.3, Math.sin(a) * 0.34, 1.8, 0.3, 0.7).rotation.y = -a; } }, { tags: ['flower', 'wedding', 'outdoor'] });
  const settings = (k, x, z, a) => { const cx = Math.sin(a), cz = Math.cos(a); k.c(0.13, 0.13, 0.012, 0xfbfbf8, x, 0.772, z); k.c(0.1, 0.1, 0.014, 0xf4f0e8, x, 0.78, z); k.t(0.1, 0.006, gold, x, 0.786, z).rotation.x = PI / 2; const nap = k.cone(0.05, 0.12, 0xfbf6ec, x, 0.84, z, 3); nap.rotation.y = a; for (const s of [-1, 1]) k.b(0.012, 0.004, 0.16, 0xd8d8e0, x + cz * s * 0.16, 0.772, z - cx * s * 0.16).rotation.y = a; wineGlass(k, x - cx * 0.02 + cz * 0.14, 0.766, z - cz * 0.02 - cx * 0.14 - 0.12 * cz); };
  const ironChair = (k, x, z, a) => { const sub = new THREE.Group(); sub.position.set(x, 0, z); sub.rotation.y = a; k.add(sub); const kk = K(sub); kk.c(0.2, 0.2, 0.04, IRON, 0, 0.46, 0); for (let i = 0; i < 4; i++) { const b = i / 4 * PI * 2 + PI / 4; kk.c(0.012, 0.012, 0.46, IRON, Math.cos(b) * 0.15, 0.23, Math.sin(b) * 0.15); } const bk = plane(kk, 0.4, 0.42, scrollback, 0, 0.72, -0.19); bk.material.side = THREE.DoubleSide; kk.t(0.2, 0.014, IRON, 0, 0.92, -0.19, PI); kk.c(0.18, 0.18, 0.03, 0xfbf6ec, 0, 0.49, 0); };
  def('k12g_banquet', '연회 원형 테이블 (흰 보 · 금 러너 · 흰 철제 의자 4)', 'misc', 3200, 2.4, 2.4, g => {
    const k = K(g); k.c(0.62, 0.66, 0.76, 0xfbfaf6, 0, 0.38, 0, 28); k.c(0.64, 0.64, 0.02, 0xfbfaf6, 0, 0.765, 0, 28); const run = k.b(1.34, 0.006, 0.3, gold, 0, 0.775, 0); run.rotation.y = 0.785; const r2 = k.b(0.3, 0.3, 0.004, gold, 0.47, 0.62, 0.47); r2.rotation.y = 0.785;
    for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2; settings(k, Math.sin(a) * 0.46, Math.cos(a) * 0.46, a); ironChair(k, Math.sin(a) * 0.95, Math.cos(a) * 0.95, a + PI); }
    k.c(0.08, 0.1, 0.12, gold, 0, 0.84, 0); for (let i = 0; i < 12; i++) { const a = i * 2.4, r = 0.03 + (i % 4) * 0.025; rose(k, Math.cos(a) * r, 0.94 + (3 - i % 4) * 0.02, Math.sin(a) * r, i % 3 ? ROSE : 0xf4c8d0, 1.1); } for (const [x, z] of [[0.2, 0.05], [-0.2, -0.05]]) { k.c(0.02, 0.03, 0.2, gold, x, 0.87, z); candle(k, x, 0.97, z, 0.1, 0.018, 0.14); }
  }, { tags: ['table', 'wedding', 'outdoor'], use: [0, 1, 2, 3].map(i => { const a = i / 4 * PI * 2; return { pose: 'eat', dx: Math.sin(a) * 0.9, dz: Math.cos(a) * 0.9, face: i * 90 + 180, act: 'dine', seatH: 0.5 }; }) });
  def('k12g_cake', '웨딩 케이크 테이블 (4단 · 장미 · 샴페인)', 'misc', 3000, 1.9, 0.9, g => {
    const k = K(g); k.b(1.8, 0.74, 0.8, 0xfbfaf6, 0, 0.37, 0, 0.02); k.b(1.84, 0.12, 0.84, lace, 0, 0.7, 0, 0.01); k.b(1.84, 0.01, 0.2, gold, 0, 0.765, 0);
    k.c(0.2, 0.22, 0.04, gold, 0, 0.79, 0); let y = 0.81; for (const [r, h] of [[0.3, 0.2], [0.23, 0.18], [0.17, 0.16], [0.11, 0.14]]) { k.c(r, r, h, 0xfdfbf6, 0, y + h / 2, 0, 24); k.t(r, 0.012, 0xf0e4d0, 0, y + 0.02, 0).rotation.x = PI / 2; for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + y * 3; k.s(0.012, 0xf4ecd8, Math.cos(a) * r, y + h * 0.6, Math.sin(a) * r); } y += h; }
    for (let i = 0; i < 7; i++) rose(k, 0.2 - i * 0.06, 0.95 + i * 0.1, 0.18 - Math.abs(i - 3) * 0.02, i % 2 ? ROSE : 0xf4c8d0, 1.1); rose(k, 0, y + 0.04, 0, ROSE, 1.4);
    for (let i = 0; i < 6; i++) { const x = 0.5 + (i % 3) * 0.12, z = -0.15 + ((i / 3) | 0) * 0.14; wineGlass(k, x, 0.76, z); k.c(0.024, 0.014, 0.03, 0xf4e090, x, 0.865, z); } k.c(0.04, 0.045, 0.3, 0x1a3a2a, -0.6, 0.91, -0.1); k.c(0.015, 0.02, 0.08, gold, -0.6, 1.1, -0.1); k.c(0.1, 0.08, 0.14, silver, -0.65, 0.83, 0.15);
    for (let i = 0; i < 8; i++) rose(k, -0.85 + i * 0.24, 0.62, 0.43, ROSE, 1.2);
  }, { tags: ['table', 'wedding', 'outdoor'] });
  def('k12g_rose_border', '흰 장미 화단 (낮은 경계)', 'misc', 600, 3.0, 0.6, g => { const k = K(g); k.b(3.0, 0.14, 0.56, IVORY, 0, 0.07, 0, 0.02); k.b(2.9, 0.1, 0.46, 0x4a3a2a, 0, 0.15, 0); for (let i = 0; i < 26; i++) { const x = -1.38 + i * 0.11, z = ((i * 7) % 3 - 1) * 0.12; k.s(0.07, i % 2 ? 0x3f6e34 : 0x4f8040, x, 0.26, z, 1, 0.8, 1); rose(k, x, 0.36 + (i % 2) * 0.05, z, i % 5 ? ROSE : 0xf6e2dc, 1.2); } }, { tags: ['plant', 'wedding', 'outdoor'] });
  def('k12g_gifts', '축하 선물 테이블 (리본 상자)', 'misc', 1200, 1.4, 0.7, g => { const k = K(g); k.b(1.3, 0.72, 0.62, 0xfbfaf6, 0, 0.36, 0, 0.02); k.b(1.34, 0.08, 0.66, lace, 0, 0.7, 0, 0.01); for (const [x, z, s, c] of [[-0.4, 0, 0.28, 0xfbfaf6], [-0.1, 0.1, 0.2, 0xf4d8e0], [0.25, -0.05, 0.3, 0xf0e4c8], [0.5, 0.12, 0.16, 0xfbfaf6], [-0.3, -0.1, 0.14, 0xe8d0a0]]) { k.b(s, s * 0.8, s, c, x, 0.74 + s * 0.4, z, 0.01); k.b(s + 0.01, s * 0.8 + 0.01, 0.03, gold, x, 0.74 + s * 0.4, z); k.b(0.03, s * 0.8 + 0.01, s + 0.01, gold, x, 0.74 + s * 0.4, z); k.t(0.04, 0.012, gold, x, 0.74 + s * 0.8 + 0.03, z).rotation.y = 0.6; } k.b(0.3, 0.2, 0.2, 0xfbfaf6, 0.25, 1.07, -0.05, 0.02); k.b(0.08, 0.015, 0.02, gold, 0.25, 1.17, -0.05); }, { tags: ['wedding', 'outdoor'] });

  // ---------------------------------------------------------
  // 성당 앞 광장 조립 (world3d 가 호출)
  // ---------------------------------------------------------
  const X0 = 2, X1 = 22, Z0 = -76.4, Z1 = -59.8, AX = 12;
  const marbleTex = () => { const t = ctex('k12plaza', 256, 256, (c, w, h) => { c.fillStyle = '#f6f3ee'; c.fillRect(0, 0, w, h); const s = 128; for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { c.fillStyle = (i + j) % 2 ? '#f2eee8' : '#faf8f4'; c.fillRect(i * s, j * s, s, s); } c.strokeStyle = 'rgba(160,160,175,0.22)'; c.lineWidth = 1.5; for (let i = 0; i < 7; i++) { c.beginPath(); let x = (i * 41) % w, y = 0; c.moveTo(x, y); while (y < h) { x += Math.sin(i * 5 + y * 0.04) * 10; y += 14; c.lineTo(x, y); } c.stroke(); } c.fillStyle = 'rgba(190,170,130,0.55)'; c.fillRect(0, 0, w, 2); c.fillRect(0, 0, 2, h); c.fillRect(0, s, w, 1); c.fillRect(s, 0, 1, h); for (const [x, y] of [[0, 0], [s, 0], [0, s], [s, s]]) { c.fillStyle = '#d8c090'; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + 6, y); c.lineTo(x, y + 6); c.lineTo(x - 6, y); c.fill(); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const aisleTex = () => { const t = ctex('k12aisle', 64, 128, (c, w, h) => { c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, w, h); c.fillStyle = '#d8bc78'; c.fillRect(3, 0, 3, h); c.fillRect(w - 6, 0, 3, h); c.fillStyle = 'rgba(212,168,72,0.45)'; for (let y = 16; y < h; y += 32) { c.beginPath(); c.moveTo(w / 2, y - 8); c.lineTo(w / 2 + 8, y); c.lineTo(w / 2, y + 8); c.lineTo(w / 2 - 8, y); c.fill(); } for (let i = 0; i < 16; i++) { c.fillStyle = '#f4d8de'; c.beginPath(); c.arc(10 + (i * 17) % (w - 20), (i * 29) % h, 1.6, 0, 7); c.fill(); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  // 지형을 따라 휘는 판 (광장 바닥 · 버진로드)
  const conform = (Tt, x0, x1, z0, z1, off, m) => { const W = x1 - x0, D = z1 - z0, g2 = new THREE.PlaneGeometry(W, D, Math.ceil(W), Math.ceil(D)); g2.rotateX(-PI / 2); const p = g2.attributes.position, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; for (let i = 0; i < p.count; i++) p.setY(i, Tt.height(cx + p.getX(i), cz + p.getZ(i)) + off); g2.computeVertexNormals(); const o = new THREE.Mesh(g2, m); o.position.set(cx, 0, cz); o.receiveShadow = true; return o; };
  const LAYOUT = [
    // 입구 대형 아치 · 백합 받침대 · 버진로드 아치
    ['k12g_arch', AX, -72.3, 0], ['k12g_lily_pedestal', AX - 2.6, -72.6, 0], ['k12g_lily_pedestal', AX + 2.6, -72.6, 0], ['k12g_arch', AX, -66.9, 0], ['k12g_arch', AX, -61.2, 0],
    // 버진로드 양옆 흰 장미 산울타리 · 금 화환
    ...[-70.7, -68.9, -65.2, -63.4].flatMap(z => [['k12g_hedge', AX - 1.45, z, 90], ['k12g_hedge', AX + 1.45, z, 90]]),
    ['k12g_wreath', AX - 2.1, -68.2, 20], ['k12g_wreath', AX + 2.1, -68.2, -20], ['k12g_wreath', AX - 2.1, -62.6, 20], ['k12g_wreath', AX + 2.1, -62.6, -20],
    // 하객 벤치
    ...[-65.4, -63.6, -61.8].flatMap(z => [['k12g_bench', AX - 3.7, z, 180], ['k12g_bench', AX + 3.7, z, 180]]),
    ['k12g_lily_pedestal', AX - 5.3, -67.6, 0], ['k12g_lily_pedestal', AX + 5.3, -67.6, 0],
    // 연주 (하프 · 피아노) — 오른쪽 안
    ['k12g_harp', 17.8, -71.6, -40], ['k12g_piano', 20.0, -71.4, 200],
    // 연회 (원형 테이블 · 케이크) — 왼쪽
    ['k12g_banquet', 5.3, -70.0, 0], ['k12g_banquet', 5.0, -66.3, 30], ['k12g_cake', 5.8, -73.4, 0], ['k12g_gifts', 19.9, -64.3, -90],
    // 웰컴 이젤 · 랜턴
    ['k12g_easel', AX - 2.4, -60.5, 20], ['k12g_easel', AX + 2.6, -60.6, -20],
    ['k12g_lantern', X0 + 0.7, Z0 + 0.8, 0], ['k12g_lantern', X1 - 0.7, Z0 + 0.8, 0], ['k12g_lantern', X0 + 0.7, Z1 - 0.7, 0], ['k12g_lantern', X1 - 0.7, Z1 - 0.7, 0], ['k12g_lantern', AX - 5.6, -61.4, 0], ['k12g_lantern', AX + 5.6, -61.4, 0], ['k12g_lantern', AX - 2.4, -74.6, 0], ['k12g_lantern', AX + 2.4, -74.6, 0],
    // 가장자리 흰 장미 화단
    ['k12g_rose_border', 4.3, Z1 - 0.25, 0], ['k12g_rose_border', 7.6, Z1 - 0.25, 0], ['k12g_rose_border', 16.4, Z1 - 0.25, 0], ['k12g_rose_border', 19.7, Z1 - 0.25, 0],
    ['k12g_rose_border', X1 - 0.3, -63.5, 90], ['k12g_rose_border', X1 - 0.3, -68.0, 90], ['k12g_rose_border', X0 + 0.3, -63.2, 90],
    ['k12g_rose_border', 4.3, Z0 + 0.25, 0], ['k12g_rose_border', 7.9, Z0 + 0.25, 0], ['k12g_rose_border', 16.1, Z0 + 0.25, 0], ['k12g_rose_border', 19.7, Z0 + 0.25, 0],
  ];
  FM.GARDEN_RECT = [X0, X1, Z0, Z1];
  FM.CeremonyGarden = (scene, Tt, PM) => {
    const root = new THREE.Group(); root.name = 'ceremonyGarden';
    const mt = marbleTex(); mt.repeat.set((X1 - X0) / 2, (Z1 - Z0) / 2);
    const po = { polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 };
    root.add(conform(Tt, X0, X1, Z0, Z1, 0.05, new THREE.MeshLambertMaterial(Object.assign({ map: mt }, po))));
    const at = aisleTex(); at.repeat.set(1, 7); root.add(conform(Tt, AX - 0.95, AX + 0.95, -73.6, Z1, 0.07, new THREE.MeshLambertMaterial(Object.assign({ map: at }, po))));
    const props = new THREE.Group();
    for (const [id, x, z, r] of LAYOUT) { const F = FM.FURN[id]; if (!F) continue; const g = new THREE.Group(); F.build(g); g.position.set(x, Tt.height(x, z) + 0.06, z); g.rotation.y = r * PI / 180; g.traverse(o => { if (o.isMesh) { o.castShadow = !o.material.transparent && !o.userData.noBake; o.receiveShadow = true; } }); props.add(g); }
    const glows = []; props.traverse(o => { if (o.isMesh && o.material && o.material.blending === THREE.AdditiveBlending) glows.push(o); });
    root.add(props); if (PM && PM.bake) PM.bake(props);
    // 반짝이 (낮엔 은은한 반짝임, 밤엔 별가루)
    const n = 140, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const x = X0 + ((i * 0.618) % 1) * (X1 - X0), z = Z0 + ((i * 0.414 + 0.2) % 1) * (Z1 - Z0); pos[i * 3] = x; pos[i * 3 + 1] = Tt.height(x, z) + 0.6 + ((i * 0.732) % 1) * 4.2; pos[i * 3 + 2] = z; }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const spTex = ctex('k12spark', 32, 32, (c, w, h) => { const gr = c.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,240,200,0.5)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(15, 2, 2, 28); c.fillRect(2, 15, 28, 2); });
    const pm = new THREE.PointsMaterial({ map: spTex, size: 0.35, color: 0xfff0c8, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending });
    const pts = new THREE.Points(pg, pm); pts.userData.keep = true; pts.frustumCulled = false;
    pts.onBeforeRender = () => { const t = performance.now() / 1000, nt = (FM.W && FM.W.nightness) || 0; pm.opacity = (0.25 + nt * 0.55) * (0.7 + Math.sin(t * 2.3) * 0.3); pm.size = 0.25 + nt * 0.2 + Math.sin(t * 3.1) * 0.05; const on = nt > 0.25; for (const o of glows) o.visible = on; };
    root.add(pts); scene.add(root); return root;
  };
})();
