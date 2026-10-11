/* =========================================================
 *  카페 좌석 확장 · 중국집 "홍등반점" · 일본풍 찻집 "달빛 다실" · 섬 어린이 학교 교실 — 레퍼런스 사진대로
 *   ☕ 카페 : 앞쪽으로 2m 넓혀 레몬 체어 원형 테이블 2세트 + 쿠키 테이블 의자 (좌석 +8)
 *   🏮 중국집 (12×9) : 대나무 발 벽 · 수묵 대나무 벽 · 붉은 무늬 러그 · 붉은 원형 회전 테이블(요리 가득 · 검정 의자 4) 3세트
 *            · 격자 누각 · 격자 병풍 · 대나무 숲 화분 · 붉은 칠 장식장 & TV · 명식 찻상 · 격자 소파 · 청화 항아리 · 궁등 · 모란 등 · 치파오 · 서예 족자
 *   🍵 찻집 (12×9) : 어두운 원목 툇마루 · 발 벽 · 숲 배경의 안뜰 정원(이끼 · 바위 연못 · 대나무 물받이 · 석등 · 소나무 정원수) · 난간 · 기둥
 *            · 초롱 줄 · 큰 종이 등 · 코타츠 2 (방석 4씩) · 좌식 의자 · 대나무 평상 · 분재 선반 · 안돈 · 다도 준비상
 *   🏫 학교 (14×10) : 흰 세로 판자 벽 · 헤링본 원목 바닥 · 초록 칠판 · 바퀴 화이트보드 · 형광등 · 책걸상 9 · 긴 작업대 & 스툴
 *            · 교탁 & 초록 의자 · 바인더 책장 · 세계지도 · 알파벳/숫자 포스터 · 게시판 · 벽걸이 선풍기 · 창문 · 골격 모형 · 소화기
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, RK = FM.RoomKit, INT = FM.INTERIORS;
  const { K, T, P, def, ctex, glow, glass, mesh, geo } = RK._h;
  const { rrect, tm, cm, pic, rug, plane } = RK._h3;
  const { halo, beam, lightPatch } = RK._h5;
  const PI = Math.PI;
  const f = (type, x, z, rot = 0, y = 0) => ({ type, x, z, rot, y });
  const hex = c => '#' + c.toString(16).padStart(6, '0');
  const tone = (c, k) => { const r = Math.min(255, ((c >> 16) & 255) * k) | 0, g = Math.min(255, ((c >> 8) & 255) * k) | 0, b = Math.min(255, (c & 255) * k) | 0; return `rgb(${r},${g},${b})`; };
  const lam = (c, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o));
  const phong = (c, sh = 60) => new THREE.MeshPhongMaterial({ color: c, shininess: sh, specular: 0x554444 });

  // =========================================================
  // ☕ 카페 — 앞쪽으로 넓혀 좌석 추가
  // =========================================================
  const LEMON = 0xf6d860, MINT = 0xa8dcc8, CREAM = 0xfbf4e0, OAK = T.woodgrain(0xd8b080);
  def('k18f_cafe_round', '레몬 체어 원형 카페 테이블 (케이크 · 라떼 · 3인석)', 'misc', 1600, 2.0, 2.0, g => {
    const k = K(g);
    k.c(0.5, 0.5, 0.04, OAK, 0, 0.74, 0, 28); k.c(0.05, 0.07, 0.72, 0xfbfaf6, 0, 0.36, 0); k.c(0.26, 0.28, 0.03, 0xfbfaf6, 0, 0.015, 0);
    k.c(0.12, 0.12, 0.01, 0xfbfbf8, -0.15, 0.765, 0.1); k.c(0.05, 0.06, 0.07, 0xfff4e0, -0.15, 0.8, 0.1); k.c(0.045, 0.045, 0.012, 0xf4e0c8, -0.15, 0.838, 0.1);
    k.c(0.1, 0.1, 0.01, 0xfbfbf8, 0.18, 0.765, -0.08); const cake = k.b(0.1, 0.07, 0.08, 0xfff0f4, 0.18, 0.805, -0.08, 0.01); cake.rotation.y = 0.5; k.s(0.018, 0xe8354a, 0.18, 0.85, -0.08);
    k.c(0.03, 0.03, 0.12, glass(0xe8f8ff), 0, 0.82, -0.2); for (let i = 0; i < 3; i++) k.s(0.02, [0xffd84a, 0xff9ab0, 0xffffff][i], (i - 1) * 0.015, 0.9, -0.2);
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * PI * 2 + PI / 6, x = Math.sin(a) * 0.8, z = Math.cos(a) * 0.8;
      const sub = new THREE.Group(); sub.position.set(x, 0, z); sub.rotation.y = a + PI; g.add(sub); const q = K(sub);
      q.b(0.5, 0.1, 0.46, LEMON, 0, 0.43, 0, 0.05); q.b(0.5, 0.42, 0.1, LEMON, 0, 0.68, -0.2, 0.05); for (const s of [-1, 1]) q.b(0.08, 0.2, 0.4, LEMON, s * 0.24, 0.55, 0, 0.04);
      for (const [lx, lz] of [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]]) q.c(0.02, 0.018, 0.4, OAK, lx, 0.19, lz);
      q.b(0.3, 0.2, 0.06, MINT, 0, 0.65, -0.14, 0.03);
    }
  }, { tags: ['table', 'cafe'], use: [0, 1, 2].map(i => { const a = i / 3 * PI * 2 + PI / 6; return { pose: 'eat', dx: Math.sin(a) * 0.78, dz: Math.cos(a) * 0.78, face: (a * 180 / PI) + 180, act: 'cafe', seatH: 0.48 }; }) });
  def('k18f_wall_bench', '민트 쿠션 창가 벤치 & 원목 테이블 (2인석)', 'misc', 1400, 1.8, 1.3, g => {
    const k = K(g);
    k.b(1.7, 0.42, 0.5, 0xfbfaf6, 0, 0.21, -0.38, 0.03); k.b(1.66, 0.1, 0.48, MINT, 0, 0.47, -0.38, 0.05); k.b(1.66, 0.45, 0.12, MINT, 0, 0.72, -0.6, 0.05);
    for (let i = 0; i < 3; i++) k.s(0.12, [0xfff4d6, LEMON, 0xf4b8c8][i], -0.55 + i * 0.55, 0.62, -0.5, 1, 0.8, 0.45);
    k.b(1.3, 0.04, 0.55, OAK, 0, 0.72, 0.28, 0.02); for (const x of [-0.58, 0.58]) k.b(0.05, 0.7, 0.45, OAK, x, 0.35, 0.28);
    P.mug(k, -0.3, 0.74, 0.25, 0xfbf4e0); P.mug(k, 0.35, 0.74, 0.3, 0xa8dcc8); k.c(0.1, 0.1, 0.01, 0xfbfbf8, 0, 0.745, 0.3); k.s(0.05, 0xd8a050, 0, 0.77, 0.3, 1.3, 0.6, 1);
  }, { tags: ['table', 'cafe'], use: [-0.45, 0.45].map(x => ({ pose: 'eat', dx: x, dz: -0.3, face: 0, act: 'cafe', seatH: 0.5 })) });
  const CAFE = INT.cafe_in;
  if (CAFE) {
    CAFE.d = 8;
    for (const o of CAFE.furn) { o.z -= 1; if (o.type === 'plant_monstera') { o.x = -4.05; o.z = 3.55; } }
    CAFE.furn.push(
      f('k18f_cafe_round', -2.9, 2.75), f('k18f_cafe_round', 2.9, 2.75, 60), f('k18f_wall_bench', 3.55, -0.6, -90),
      f('k8_lemon_chair', -3.45, 1.05, 90), f('k8_lemon_chair', -1.75, 1.05, -90), f('k8_drum_pendant', -2.9, 2.75), f('k8_drum_pendant', 2.9, 2.75), f('plant_monstera', 4.05, 3.55),
    );
    CAFE.furn = CAFE.furn.filter(o => !(o.type === 'k8_dot_stool' && Math.abs(o.x - 3.3) < 0.1) && !(o.type === 'k8_bottle_side' && o.x > 3));
  }

  // =========================================================
  // 🏮 중국집 "홍등반점"
  // =========================================================
  const RED = 0xb8261e, RED2 = 0x8a1a14, LAQ = phong(0xb02a1c, 50), BLACKW = phong(0x1a1210, 40), GOLD = new THREE.MeshPhongMaterial({ color: 0xd8a838, shininess: 80, specular: 0xfff0b0 }), BAMBOO = 0x6aa84a;
  Object.assign(RK.WALLS, {
    cnslat: { tileW: 2, w: 256, h: 256, draw: (g, w, h) => { for (let x = 0; x < w; x += 8) { g.fillStyle = tone(0x6a2a18, 0.8 + ((x * 13) % 5) * 0.06); g.fillRect(x, 0, 7, h); g.fillStyle = 'rgba(255,200,150,0.08)'; g.fillRect(x + 1, 0, 1.5, h); g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(x + 7, 0, 1, h); } for (const y of [h * 0.3, h * 0.72]) { g.fillStyle = '#3a140a'; g.fillRect(0, y, w, 5); } g.fillStyle = '#4a1a10'; g.fillRect(0, h - 18, w, 18); } },
    cnink: { tileW: 4, w: 512, h: 288, draw: (g, w, h) => { g.fillStyle = '#f2ece0'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,90,70,0.55)'; for (let i = 0; i < 7; i++) { const x = 30 + i * 70 + (i % 2) * 18; g.lineWidth = 5; g.beginPath(); g.moveTo(x, h); g.lineTo(x + 6, 20); g.stroke(); for (let y = 40; y < h; y += 46) { g.fillStyle = 'rgba(60,70,50,0.6)'; g.fillRect(x - 3, y, 12, 3); } for (let j = 0; j < 5; j++) { const y = 30 + j * 50 + (i % 3) * 10; g.fillStyle = 'rgba(70,90,60,0.5)'; g.beginPath(); g.ellipse(x + 26, y, 26, 5, -0.4, 0, 7); g.fill(); g.beginPath(); g.ellipse(x - 20, y + 16, 22, 4, 0.5, 0, 7); g.fill(); } } g.fillStyle = 'rgba(180,120,90,0.5)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(120 + i * 110, 60 + (i % 2) * 30, 5, 0, 7); g.fill(); } g.fillStyle = '#3a1a10'; g.fillRect(0, 0, 10, h); g.fillRect(w - 10, 0, 10, h); g.fillRect(0, h - 16, w, 16); } },
  });
  Object.assign(FM.FLOOR_DRAW, {
    cnwood(g, w, h) { for (let y = 0; y < h; y += 32) for (let x = -((y / 32) % 2) * 64; x < w; x += 128) { g.fillStyle = tone(0x5a2418, 0.82 + ((x * 3 + y) % 7) * 0.04); g.fillRect(x, y, 127, 31); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x, y + 31, 128, 1); g.fillRect(x + 127, y, 1, 32); g.strokeStyle = 'rgba(255,180,140,0.06)'; g.beginPath(); g.moveTo(x + 8, y + 12); g.bezierCurveTo(x + 40, y + 6, x + 80, y + 20, x + 120, y + 14); g.stroke(); } },
    jpwood(g, w, h) { for (let x = 0; x < w; x += 42) { g.fillStyle = tone(0x3a2416, 0.8 + ((x / 42) % 4) * 0.07); g.fillRect(x, 0, 41, h); g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(x + 41, 0, 1, h); g.strokeStyle = 'rgba(255,200,150,0.05)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x + 8 + i * 11, 0); g.bezierCurveTo(x + 4 + i * 11, h / 3, x + 14 + i * 11, h * 0.7, x + 7 + i * 11, h); g.stroke(); } } },
    herring(g, w, h) { const L = 48, s = 12; for (let y = -L; y < h + L; y += s * 2) for (let x = -L; x < w + L; x += L) { for (let i = 0; i < 2; i++) { g.save(); g.translate(x + i * s, y + i * s); g.rotate(i ? -PI / 4 : PI / 4); g.fillStyle = tone(0x8a5a34, 0.82 + (((x + y + i * 7) / 12) % 5) * 0.05); g.fillRect(0, 0, L * 0.7, s - 1); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, s - 1, L * 0.7, 1); g.restore(); } } },
  });
  Object.assign(FM.D.FLOOR_SOUND || {}, { cnwood: '또각', jpwood: '사각', herring: '또각' });
  const dish = (k, x, y, z, c, r = 0.1) => { k.c(r, r * 0.8, 0.02, 0xfbfbf8, x, y + 0.01, z); k.s(r * 0.7, c, x, y + 0.02, z, 1, 0.3, 1); };
  const cnChair = (k, x, z, a) => {
    const sub = new THREE.Group(); sub.position.set(x, 0, z); sub.rotation.y = a; k.add(sub); const q = K(sub);
    q.b(0.44, 0.04, 0.42, BLACKW, 0, 0.44, 0, 0.01); q.b(0.4, 0.05, 0.38, RED, 0, 0.48, 0, 0.02);
    for (const [lx, lz] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) q.b(0.035, 0.44, 0.035, BLACKW, lx, 0.22, lz);
    for (const lx of [-0.19, 0.19]) q.b(0.035, 0.7, 0.035, BLACKW, lx, 0.8, -0.19); q.b(0.42, 0.05, 0.04, BLACKW, 0, 1.13, -0.19, 0.01); q.b(0.12, 0.55, 0.02, BLACKW, 0, 0.82, -0.19); q.b(0.3, 0.02, 0.02, BLACKW, 0, 0.6, -0.19);
  };
  def('k18c_table', '붉은 원형 회전 테이블 (딤섬 · 탕 · 요리 가득 · 검정 의자 4)', 'misc', 3600, 2.4, 2.4, g => {
    const k = K(g);
    k.c(0.66, 0.66, 0.05, LAQ, 0, 0.74, 0, 32); k.c(0.68, 0.68, 0.02, GOLD, 0, 0.715, 0, 32); k.c(0.08, 0.14, 0.7, BLACKW, 0, 0.36, 0); k.c(0.34, 0.38, 0.05, BLACKW, 0, 0.025, 0, 24);
    k.c(0.42, 0.42, 0.02, glass(0xffe8e0), 0, 0.775, 0, 32); k.c(0.44, 0.44, 0.012, lam(0x8a1a14), 0, 0.768, 0, 32);
    k.c(0.13, 0.1, 0.09, 0xfbfbf8, 0, 0.83, 0); k.c(0.12, 0.12, 0.01, 0xd8702a, 0, 0.87, 0); k.c(0.01, 0.01, 0.14, 0xfbfbf8, 0.06, 0.9, 0.02).rotation.z = 0.6;
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2, x = Math.cos(a) * 0.3, z = Math.sin(a) * 0.3; if (i % 3 === 0) { k.c(0.08, 0.08, 0.07, T.woodgrain(0xd8b070), x, 0.82, z); for (let j = 0; j < 3; j++) k.s(0.025, 0xfbf4e8, x + (j - 1) * 0.035, 0.87, z); } else dish(k, x, 0.785, z, [0xc83a1a, 0xe8a030, 0x5a8a3a, 0x8a3a1a][i % 4], 0.08); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2 + PI / 4, x = Math.sin(a) * 0.52, z = Math.cos(a) * 0.52; k.c(0.07, 0.06, 0.012, 0xfbfbf8, x, 0.772, z); k.c(0.035, 0.03, 0.04, 0xfbfbf8, x + 0.08, 0.79, z); const cs = k.b(0.008, 0.005, 0.2, BLACKW, x - 0.06, 0.78, z); cs.rotation.y = a; }
    k.s(0.06, 0xfbfbf8, 0.2, 0.83, -0.15, 1, 0.8, 1); k.c(0.01, 0.015, 0.06, 0xfbfbf8, 0.27, 0.84, -0.15).rotation.z = -0.8;
    for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2; cnChair(k, Math.sin(a) * 0.95, Math.cos(a) * 0.95, a + PI); }
  }, { tags: ['table', 'chinese'], use: [0, 1, 2, 3].map(i => { const a = i / 4 * PI * 2; return { pose: 'eat', dx: Math.sin(a) * 0.9, dz: Math.cos(a) * 0.9, face: i * 90 + 180, act: 'pub', seatH: 0.48 }; }) });
  const latticeTex = () => cm('k18lattice', 128, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = hex(0xb02a1c); c.lineWidth = 7; c.strokeRect(4, 4, w - 8, h - 8); c.lineWidth = 4; for (let y = 24; y < h - 20; y += 40) { c.strokeRect(20, y, w - 40, 30); c.beginPath(); c.moveTo(20, y + 15); c.lineTo(w - 20, y + 15); c.moveTo(w / 2, y); c.lineTo(w / 2, y + 30); c.stroke(); } c.beginPath(); c.arc(w / 2, h / 2, 26, 0, 7); c.stroke(); c.strokeRect(w / 2 - 14, h / 2 - 14, 28, 28); });
  def('k18c_screen', '붉은 격자 병풍 (3폭)', 'misc', 1500, 1.8, 0.4, g => {
    const k = K(g); const lt = latticeTex(); lt.side = THREE.DoubleSide;
    for (let i = 0; i < 3; i++) { const sub = new THREE.Group(); sub.position.set(-0.58 + i * 0.58, 0, (i % 2) * 0.12); sub.rotation.y = (i - 1) * 0.35; g.add(sub); const q = K(sub); plane(q, 0.56, 1.7, lt, 0, 0.95, 0); for (const x of [-0.28, 0.28]) q.b(0.04, 1.8, 0.04, LAQ, x, 0.9, 0); q.b(0.56, 0.04, 0.04, LAQ, 0, 1.82, 0); q.b(0.56, 0.12, 0.03, LAQ, 0, 0.1, 0); }
  }, { tags: ['chinese', 'screen'] });
  def('k18c_pavilion', '붉은 격자 누각 (방 칸막이 룸 캐노피)', 'misc', 5000, 2.8, 2.8, g => {
    const k = K(g), H = 2.35, lt = latticeTex();
    for (const [x, z] of [[-1.35, -1.35], [1.35, -1.35], [-1.35, 1.35], [1.35, 1.35]]) { k.b(0.1, H, 0.1, LAQ, x, H / 2, z); k.b(0.16, 0.08, 0.16, GOLD, x, 0.04, z); }
    for (const s of [-1, 1]) { k.b(2.8, 0.1, 0.1, LAQ, 0, H, s * 1.35); k.b(0.1, 0.1, 2.8, LAQ, s * 1.35, H, 0); const fr = k.b(2.6, 0.32, 0.02, lt, 0, H - 0.22, s * 1.35); fr.material = lt; const fr2 = k.b(0.02, 0.32, 2.6, lt, s * 1.35, H - 0.22, 0); fr2.material = lt; }
    for (let i = -2; i <= 2; i++) { k.b(0.05, 0.05, 2.7, LAQ, i * 0.55, H + 0.06, 0); k.b(2.7, 0.05, 0.05, LAQ, 0, H + 0.06, i * 0.55); }
    for (const s of [-1, 1]) for (const t of [-1, 1]) { const tas = k.c(0.015, 0.03, 0.22, RED, s * 1.35, H - 0.45, t * 1.35); tas.userData.noBake = true; k.s(0.03, GOLD, s * 1.35, H - 0.32, t * 1.35); }
  }, { tags: ['chinese'] });
  def('k18c_bamboo', '대나무 숲 화분 (흰 자갈 판)', 'misc', 900, 0.8, 0.6, g => {
    const k = K(g); k.b(0.8, 0.06, 0.6, 0x1a1a22, 0, 0.03, 0, 0.01); k.b(0.72, 0.03, 0.52, 0xf4f0e8, 0, 0.07, 0);
    for (let i = 0; i < 9; i++) { const x = -0.28 + (i % 4) * 0.19 + ((i * 7) % 3) * 0.02, z = -0.16 + ((i / 4) | 0) * 0.16, h = 1.5 + ((i * 37) % 11) * 0.1; const c = k.c(0.035, 0.04, h, BAMBOO + ((i * 17) % 3) * 0x060800, x, h / 2 + 0.07, z, 10); c.rotation.z = ((i % 3) - 1) * 0.03; for (let y = 0.35; y < h; y += 0.34) k.c(0.041, 0.041, 0.02, 0x4a7a32, x, y + 0.07, z, 10); }
  }, { tags: ['chinese', 'plant'] });
  def('k18c_cabinet', '붉은 칠 장식장 & TV (황동 장식)', 'misc', 2400, 1.8, 0.55, g => {
    const k = K(g); k.b(1.8, 0.78, 0.52, LAQ, 0, 0.43, 0, 0.02); k.b(1.86, 0.05, 0.56, LAQ, 0, 0.84, 0, 0.01); for (const x of [-0.8, 0.8]) k.b(0.06, 0.1, 0.5, BLACKW, x, 0.03, 0);
    for (let i = 0; i < 4; i++) { const x = -0.66 + i * 0.44; k.b(0.4, 0.5, 0.01, lam(0x9a2016), x, 0.46, 0.265); k.s(0.025, GOLD, x + (i % 2 ? -0.14 : 0.14), 0.46, 0.275); k.b(0.3, 0.02, 0.005, GOLD, x, 0.66, 0.272); }
    k.b(0.9, 0.55, 0.06, lam(0xc02a1c), 0, 1.16, -0.02, 0.02); k.b(0.8, 0.45, 0.01, new THREE.MeshBasicMaterial({ color: 0x2a0a0a }), 0, 1.17, 0.015); k.b(0.3, 0.04, 0.2, lam(0xc02a1c), 0, 0.88, -0.02);
    k.b(0.5, 0.03, 0.3, BLACKW, 0.6, 0.88, 0.05); for (let i = 0; i < 3; i++) k.c(0.03, 0.025, 0.04, 0xfbfbf8, 0.45 + i * 0.12, 0.915, 0.05); k.s(0.06, 0xfbfbf8, 0.62, 0.95, -0.05, 1, 0.8, 1);
  }, { tags: ['chinese', 'storage'] });
  def('k18c_tea_table', '명식 곡선 다리 찻상 (다기 세트)', 'misc', 1500, 1.3, 0.6, g => {
    const k = K(g); k.b(1.3, 0.06, 0.6, LAQ, 0, 0.44, 0, 0.02); k.b(1.2, 0.08, 0.5, LAQ, 0, 0.38, 0);
    for (const s of [-1, 1]) { const l = k.b(0.08, 0.4, 0.5, LAQ, s * 0.56, 0.2, 0); const sc = k.t(0.12, 0.025, LAQ, s * 0.6, 0.12, 0, PI); sc.rotation.y = PI / 2; sc.rotation.z = s > 0 ? 0 : PI; void l; }
    k.b(0.5, 0.03, 0.3, BLACKW, 0, 0.485, 0); k.s(0.06, 0xfbfbf8, -0.1, 0.54, 0, 1.1, 0.8, 1); k.c(0.01, 0.015, 0.06, 0xfbfbf8, -0.02, 0.55, 0).rotation.z = -0.9; for (let i = 0; i < 3; i++) k.c(0.025, 0.02, 0.035, 0xfbfbf8, 0.08 + i * 0.07, 0.52, 0.08);
  }, { tags: ['chinese', 'table'] });
  def('k18c_sofa', '붉은 격자 팔걸이 소파 (자수 쿠션)', 'rest', 2600, 1.9, 0.85, g => {
    const k = K(g); const lt = latticeTex();
    k.b(1.8, 0.2, 0.75, LAQ, 0, 0.25, 0, 0.02); k.b(1.7, 0.16, 0.66, lam(0xd8342a), 0, 0.43, 0.02, 0.06); k.b(1.8, 0.62, 0.08, LAQ, 0, 0.76, -0.34, 0.02); plane(k, 1.5, 0.45, lt, 0, 0.8, -0.29);
    for (const s of [-1, 1]) { k.b(0.1, 0.35, 0.7, LAQ, s * 0.87, 0.55, 0, 0.02); k.s(0.16, lam(0xe8a030), s * 0.55, 0.66, -0.2, 1, 1, 0.45); } for (const x of [-0.8, 0.8]) k.b(0.08, 0.15, 0.08, BLACKW, x, 0.075, 0.3);
  }, { tags: ['chinese', 'sofa'], use: [-0.4, 0.4].map(x => ({ pose: 'drink', dx: x, dz: 0.08, face: 0, act: 'pub', seatH: 0.5, prop: 'teacup' })) });
  def('k18c_vase', '대형 청자 매화 항아리', 'misc', 1200, 0.6, 0.6, g => {
    const k = K(g), pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(0.08 + Math.sin(t * PI) * 0.22 + (t > 0.85 ? (t - 0.85) * 0.6 : 0), t * 1.1)); }
    const m = lam(0xd8c898); k.add(mesh(geo('k18vase', () => new THREE.LatheGeometry(pts, 24)), m, 0, 0, 0));
    for (let i = 0; i < 9; i++) { const a = i * 0.8; k.s(0.03, 0x8a3a3a, Math.cos(a) * 0.27, 0.45 + (i % 3) * 0.12, Math.sin(a) * 0.27, 1, 1, 0.4); } k.t(0.14, 0.015, 0x8a6a3a, 0, 1.08, 0).rotation.x = PI / 2;
  }, { tags: ['chinese', 'deco'] });
  def('k18c_orb', '붉은 구름무늬 달 조명 (받침)', 'misc', 1200, 0.6, 0.5, g => {
    const k = K(g), tx = new THREE.MeshBasicMaterial({ map: ctex('k18orb', 128, 128, (c, w, h) => { const gr = c.createRadialGradient(56, 50, 10, 64, 64, 70); gr.addColorStop(0, '#fff0a0'); gr.addColorStop(1, '#f0a020'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = '#d8301a'; c.lineWidth = 6; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(20 + i * 24, 40 + (i % 2) * 40, 16, PI, 0); c.arc(40 + i * 24, 40 + (i % 2) * 40, 8, PI, 0); c.stroke(); } }) });
    k.b(0.4, 0.3, 0.3, LAQ, 0, 0.15, 0, 0.02); k.c(0.04, 0.05, 0.2, GOLD, 0, 0.4, 0); k.s(0.26, tx, 0, 0.72, 0); halo(k, 0.8, 0xffb040, 0, 0.72, 0.1, 0.5);
  }, { tags: ['chinese', 'lamp'], lamp: [[0, 0.8, 0.2, 0xffa040, 0.6, 4]] });
  const palaceTex = () => new THREE.MeshBasicMaterial({ map: ctex('k18palace', 64, 96, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffcc60'); gr.addColorStop(0.5, '#ff9a30'); gr.addColorStop(1, '#e05a20'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = '#8a1a10'; c.lineWidth = 4; c.strokeRect(2, 2, w - 4, h - 4); c.fillStyle = '#c82a1a'; c.font = 'bold 30px serif'; c.textAlign = 'center'; c.fillText('福', w / 2, h / 2 + 12); }), side: THREE.DoubleSide });
  def('k18c_palace_lantern', '궁등 (붉은 금 육각 등 · 술)', 'misc', 1300, 0.6, 0.6, g => {
    const k = K(g), y = 2.35, mt = palaceTex();
    k.c(0.008, 0.008, 1.0, 0x1a1a1a, 0, y + 0.6, 0);
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; const pl = plane(k, 0.2, 0.34, mt, Math.sin(a) * 0.17, y, Math.cos(a) * 0.17); pl.rotation.y = a; k.b(0.025, 0.4, 0.025, LAQ, Math.sin(a + PI / 6) * 0.2, y, Math.cos(a + PI / 6) * 0.2); }
    for (const dy of [-0.2, 0.2]) k.c(0.23, 0.2, 0.05, LAQ, 0, y + dy, 0, 6); k.cone(0.14, 0.12, LAQ, 0, y + 0.29, 0, 6);
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + PI / 6; const t = k.c(0.012, 0.03, 0.3, lam(0xd8201a), Math.sin(a) * 0.22, y - 0.38, Math.cos(a) * 0.22, 6); t.userData.noBake = true; k.s(0.022, GOLD, Math.sin(a) * 0.22, y - 0.22, Math.cos(a) * 0.22); }
    k.c(0.02, 0.05, 0.35, lam(0xd8201a), 0, y - 0.45, 0, 8); halo(k, 0.9, 0xffa040, 0, y, 0, 0.55);
  }, { ceiling: true, tags: ['chinese', 'lamp'], lamp: [[0, 2.2, 0, 0xffa050, 0.75, 6]] });
  def('k18c_peony_lantern', '흰 모란 비단 등 (둥근 · 술)', 'misc', 1100, 0.6, 0.6, g => {
    const k = K(g), y = 2.45; const mt = new THREE.MeshBasicMaterial({ map: ctex('k18peony', 128, 64, (c, w, h) => { c.fillStyle = '#fff6ea'; c.fillRect(0, 0, w, h); for (let i = 0; i < 3; i++) { const x = 22 + i * 42; c.fillStyle = '#e8506a'; for (let j = 0; j < 7; j++) { c.beginPath(); c.arc(x + Math.cos(j) * 7, 32 + Math.sin(j) * 7, 7, 0, 7); c.fill(); } c.fillStyle = '#5a8a3a'; c.beginPath(); c.ellipse(x + 12, 46, 9, 4, 0.5, 0, 7); c.fill(); } c.strokeStyle = '#c8a050'; c.lineWidth = 2; for (const yy of [6, 58]) { c.beginPath(); c.moveTo(0, yy); c.lineTo(w, yy); c.stroke(); } }) });
    k.c(0.008, 0.008, 0.9, 0x1a1a1a, 0, y + 0.55, 0); const bl = k.s(0.28, mt, 0, y, 0, 1, 0.8, 1); void bl; k.c(0.1, 0.12, 0.05, BLACKW, 0, y + 0.23, 0); k.c(0.1, 0.1, 0.04, BLACKW, 0, y - 0.23, 0); k.c(0.015, 0.035, 0.4, lam(0x2a1a14), 0, y - 0.45, 0, 8);
    halo(k, 0.8, 0xfff0d0, 0, y, 0, 0.4);
  }, { ceiling: true, tags: ['chinese', 'lamp'], lamp: [[0, 2.3, 0, 0xfff0d0, 0.5, 5]] });
  def('k18c_counter', '붉은 칠 계산대 (주판 · 복고양이 · 금원보)', 'misc', 2800, 3.0, 0.8, g => {
    const k = K(g); k.b(3.0, 1.0, 0.75, LAQ, 0, 0.5, 0, 0.02); k.b(3.08, 0.05, 0.82, BLACKW, 0, 1.02, 0, 0.01); for (let i = 0; i < 5; i++) { k.b(0.5, 0.7, 0.01, lam(0x9a2016), -1.2 + i * 0.6, 0.5, 0.38); k.b(0.3, 0.3, 0.005, GOLD, -1.2 + i * 0.6, 0.5, 0.39).rotation.z = PI / 4; }
    k.b(0.4, 0.04, 0.2, T.woodgrain(0x8a5a2a), -0.8, 1.06, 0.1); for (let r = 0; r < 5; r++) { k.c(0.004, 0.004, 0.38, 0x4a3a2a, -0.8, 1.08, 0.02 + r * 0.035).rotation.z = PI / 2; for (let b = 0; b < 5; b++) k.s(0.013, 0x2a1a10, -0.95 + b * 0.06, 1.08, 0.02 + r * 0.035); }
    k.s(0.1, 0xfbfbf8, 0.9, 1.15, 0.1, 1, 1.1, 0.9); k.s(0.07, 0xfbfbf8, 0.9, 1.3, 0.12); k.b(0.03, 0.1, 0.03, 0xfbfbf8, 0.98, 1.37, 0.12).rotation.z = -0.3; k.s(0.02, 0xd8201a, 0.9, 1.22, 0.2);
    k.s(0.05, GOLD, 0.3, 1.08, 0.2, 1.4, 0.6, 0.8); k.b(0.2, 0.1, 0.14, 0x3a3a44, 0.3, 1.1, -0.15);
  }, { tags: ['chinese', 'counter'], use: [{ pose: 'stand', dx: 0, dz: -0.65, face: 0, act: 'staff' }] });
  def('k18c_jar_shelf', '술 항아리 벽 선반 (복 자 · 고량주)', 'wall', 1400, 2.4, 0.35, g => {
    const k = K(g); for (const y of [1.3, 1.85]) { k.b(2.4, 0.05, 0.32, LAQ, 0, y, 0.16); for (let i = 0; i < 6; i++) { const x = -1.0 + i * 0.4, c = [0x6a3a1a, 0xe8d8b0, 0x3a2a1a][(i + (y > 1.5 ? 1 : 0)) % 3]; k.s(0.13, c, x, y + 0.13, 0.16, 1, 1.2, 1); k.c(0.06, 0.07, 0.06, c, x, y + 0.3, 0.16); k.b(0.1, 0.1, 0.005, lam(0xd8201a), x, y + 0.14, 0.29).rotation.z = PI / 4; } }
    for (const x of [-1.18, 1.18]) k.b(0.05, 0.9, 0.3, LAQ, x, 1.6, 0.15);
  }, { wall: true, tags: ['chinese'] });
  const callig = (key, txt) => pic(key, 64, 192, (c, w, h) => { c.fillStyle = '#f4ecd8'; c.fillRect(0, 0, w, h); c.fillStyle = '#6a4a2a'; c.fillRect(0, 0, w, 10); c.fillRect(0, h - 10, w, 10); c.fillStyle = '#1a1a1a'; c.font = 'bold 34px serif'; c.textAlign = 'center'; [...txt].forEach((ch, i) => c.fillText(ch, w / 2, 50 + i * 42)); c.fillStyle = '#c82a1a'; c.fillRect(w / 2 - 8, h - 36, 16, 16); });
  def('k18c_scroll', '서예 족자 (福祿壽)', 'wall', 500, 0.5, 0.05, g => { const k = K(g); plane(k, 0.45, 1.3, callig('k18sc1', '福祿壽'), 0, 1.55, 0.03); k.c(0.02, 0.02, 0.55, 0x4a2a1a, 0, 2.22, 0.035).rotation.z = PI / 2; k.c(0.025, 0.025, 0.52, 0x4a2a1a, 0, 0.9, 0.035).rotation.z = PI / 2; }, { wall: true, tags: ['chinese', 'art'] });
  def('k18c_scroll2', '서예 족자 (大吉)', 'wall', 500, 0.5, 0.05, g => { const k = K(g); plane(k, 0.45, 1.3, callig('k18sc2', '大吉祥'), 0, 1.55, 0.03); k.c(0.02, 0.02, 0.55, 0x4a2a1a, 0, 2.22, 0.035).rotation.z = PI / 2; k.c(0.025, 0.025, 0.52, 0x4a2a1a, 0, 0.9, 0.035).rotation.z = PI / 2; }, { wall: true, tags: ['chinese', 'art'] });
  def('k18c_qipao', '벽걸이 치파오 & 옷걸이', 'wall', 900, 0.8, 0.1, g => {
    const k = K(g); k.c(0.012, 0.012, 0.6, BLACKW, 0, 1.95, 0.08).rotation.z = PI / 2; k.t(0.03, 0.006, BLACKW, 0, 2.0, 0.08, PI);
    const shp = new THREE.Shape(); shp.moveTo(-0.12, 0); shp.lineTo(-0.22, -0.12); shp.lineTo(-0.16, -0.2); shp.lineTo(-0.13, -0.45); shp.lineTo(-0.17, -0.95); shp.lineTo(0.17, -0.95); shp.lineTo(0.13, -0.45); shp.lineTo(0.16, -0.2); shp.lineTo(0.22, -0.12); shp.lineTo(0.12, 0); shp.lineTo(0, -0.05); shp.lineTo(-0.12, 0);
    const m = new THREE.MeshLambertMaterial({ map: ctex('k18qp', 64, 128, (c, w, h) => { c.fillStyle = '#c8201a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#f0c040'; c.lineWidth = 2; for (let i = 0; i < 10; i++) { c.beginPath(); c.arc((i * 23) % w, (i * 37) % h, 6, 0, 5); c.stroke(); } }), side: THREE.DoubleSide });
    const q = k.add(mesh(geo('k18qpg', () => { const g2 = new THREE.ShapeGeometry(shp); const uv = g2.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) + 0.5, uv.getY(i) + 1); return g2; }), m, 0, 1.97, 0.07, false)); void q;
    k.b(0.06, 0.02, 0.005, GOLD, 0.06, 1.85, 0.075);
  }, { wall: true, tags: ['chinese', 'fashion'] });
  def('k18c_rug', '붉은 전통 무늬 러그', 'misc', 800, 3.0, 2.6, g => { const k = K(g); rug(k, 3.0, 2.6, new THREE.MeshLambertMaterial({ map: ctex('k18rug', 256, 224, (c, w, h) => { c.fillStyle = '#9a2a1e'; c.fillRect(0, 0, w, h); c.strokeStyle = '#e8b050'; c.lineWidth = 6; c.strokeRect(10, 10, w - 20, h - 20); c.strokeStyle = '#3a2a5a'; c.lineWidth = 10; c.strokeRect(24, 24, w - 48, h - 48); c.fillStyle = '#d84a2a'; for (let y = 50; y < h - 40; y += 30) for (let x = 50; x < w - 40; x += 30) { c.save(); c.translate(x, y); c.rotate(PI / 4); c.fillRect(-7, -7, 14, 14); c.restore(); } c.fillStyle = '#e8b050'; c.beginPath(); c.arc(w / 2, h / 2, 34, 0, 7); c.fill(); c.fillStyle = '#9a2a1e'; c.beginPath(); c.arc(w / 2, h / 2, 22, 0, 7); c.fill(); }) }), 0, 0, 0.01); }, { flat: true, tags: ['rug', 'chinese'] });
  def('k18c_dimsum_cart', '딤섬 찜기 카트 (김 모락)', 'misc', 1100, 0.9, 0.6, g => {
    const k = K(g); k.b(0.85, 0.05, 0.55, LAQ, 0, 0.8, 0); k.b(0.85, 0.05, 0.55, LAQ, 0, 0.3, 0); for (const [x, z] of [[-0.38, -0.23], [0.38, -0.23], [-0.38, 0.23], [0.38, 0.23]]) { k.c(0.015, 0.015, 0.8, GOLD, x, 0.42, z); k.s(0.04, BLACKW, x, 0.04, z); }
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const x = -0.25 + i * 0.25, z = -0.12 + j * 0.24; for (let t = 0; t < 2 + (i % 2); t++) k.c(0.1, 0.1, 0.06, T.woodgrain(0xd8b070), x, 0.86 + t * 0.065, z); }
    const st = k.s(0.14, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false }), 0, 1.15, 0, 1.6, 0.8, 1); st.userData.noBake = true;
  }, { tags: ['chinese', 'food'] });
  const PUB = INT.pub_in;
  if (PUB) {
    Object.assign(PUB, { w: 12, d: 9, wallH: 3.2, wallStyle: 'st_cnslat', wallStyleL: 'st_cnslat', wallStyleR: 'st_cnink', floor: 'cnwood', floorColor: 0x5a2418, wall: 0x6a2a18, light: 'warm', maxLamps: 10, name: '홍등반점 (중국집)',
      venueMood: { main: 0.42, lamp: 1.0, hemi: [0xffd0b0, 0x401810, 0.36], amb: [0xffa880, 0.1], dir: [0xffd8b0, 0.4], bg: 0x1a0a06, rim: 0.4, shadow: { pos: [-4, 8, 3], soft: 5 } },
      furn: [
        f('k18c_rug', -3.3, -1.3), f('k18c_rug', 0.7, 1.4), f('k18c_rug', 3.9, 1.5),
        f('k18c_table', -3.3, -1.3), f('k18c_table', 0.7, 1.4, 20), f('k18c_table', 3.9, 1.5, 45), f('k18c_pavilion', 3.9, 1.5),
        f('k18c_counter', 3.4, -3.6), f('k18c_jar_shelf', 3.4, -4.44), f('k18c_dimsum_cart', 1.2, -3.6), f('k18c_scroll', 0.0, -4.44), f('k18c_scroll2', -5.94, -1.6, 90),
        f('k18c_cabinet', -3.2, -4.15), f('k18c_bamboo', -5.3, -3.9), f('k18c_bamboo', -1.5, -3.95), f('k18c_bamboo', 5.5, 3.9), f('k18c_bamboo', -1.9, 3.9, 90),
        f('k18c_sofa', -4.9, 2.4, 90), f('k18c_tea_table', -3.9, 2.4, 90), f('k18c_orb', -5.4, 4.0), f('k18c_screen', -2.4, 1.8, 90),
        f('k18c_vase', -5.45, 0.2), f('k18c_vase', 5.45, -1.1), f('k18c_vase', 2.0, 4.0), f('k14_palm', 5.3, -3.9), f('k14_palm', -5.4, -2.7),
        f('k18c_qipao', -5.94, 0.9, 90), f('k18c_qipao', 5.94, -2.6, -90),
        f('k18c_palace_lantern', -3.3, -1.3), f('k18c_palace_lantern', 0.7, 1.4), f('k18c_peony_lantern', 3.9, 1.5), f('k18c_peony_lantern', -4.4, 2.6), f('k18c_palace_lantern', 3.4, -3.2), f('k18c_peony_lantern', -1.2, -2.8),
      ] });
  }

  // =========================================================
  // 🍵 일본풍 찻집 "달빛 다실"
  // =========================================================
  const DK = 0x2a1a10, DK2 = 0x4a3020, NAVY = 0x22284a, MOSS = 0x3a5a2a, ROCK = 0x8a8278;
  Object.assign(RK.WALLS, {
    jpforest: { tileW: 0, w: 512, h: 256, draw: (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#030503'); gr.addColorStop(0.6, '#0a1008'); gr.addColorStop(1, '#141c0c'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { const x = 20 + i * 58; g.fillStyle = 'rgba(22,14,8,0.95)'; g.fillRect(x, 20, 14 + (i % 3) * 5, h); } for (let i = 0; i < 160; i++) { const x = (i * 71) % w, y = (i * 37) % (h * 0.75); g.fillStyle = `rgba(${14 + (i % 5) * 5},${24 + (i % 7) * 6},${10 + (i % 3) * 4},0.85)`; g.beginPath(); g.arc(x, y, 14 + (i % 4) * 6, 0, 7); g.fill(); } g.fillStyle = 'rgba(120,40,30,0.7)'; for (let i = 0; i < 20; i++) { g.beginPath(); g.arc((i * 97) % w, h * 0.8 + (i % 4) * 8, 3, 0, 7); g.fill(); } } },
    jpsudare: { tileW: 2, w: 256, h: 256, draw: (g, w, h) => { g.fillStyle = '#3a2214'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 4) { g.fillStyle = tone(0x8a4a2a, 0.55 + ((y * 7) % 5) * 0.06); g.fillRect(0, y, w, 3); } for (const x of [40, 128, 216]) { g.fillStyle = 'rgba(20,10,5,0.8)'; g.fillRect(x, 0, 3, h); } g.fillStyle = '#1a0e08'; g.fillRect(0, h - 20, w, 20); } },
  });
  def('k18j_garden_floor', '안뜰 이끼 정원 바닥 (돌 · 낙엽)', 'misc', 1000, 8.4, 2.6, g => { const k = K(g); rug(k, 8.4, 2.6, new THREE.MeshLambertMaterial({ map: ctex('k18moss', 512, 160, (c, w, h) => { c.fillStyle = '#34501e'; c.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${60 + (i % 5) * 10},${90 + (i % 7) * 12},${30 + (i % 3) * 8},0.6)`; c.fillRect((i * 53) % w, (i * 29) % h, 3, 3); } c.fillStyle = 'rgba(160,60,30,0.55)'; for (let i = 0; i < 40; i++) { c.beginPath(); c.ellipse((i * 131) % w, (i * 47) % h, 4, 2, i, 0, 7); c.fill(); } }) }), 0, 0, 0.02); }, { flat: true, tags: ['japanese', 'garden'] });
  def('k18j_pond', '바위 연못 & 대나무 물받이 (시시오도시)', 'misc', 3200, 2.8, 1.9, g => {
    const k = K(g); const wm = new THREE.MeshPhongMaterial({ color: 0x1a2a2a, shininess: 120, specular: 0x88aaaa, transparent: true, opacity: 0.92 });
    const w = k.add(mesh(geo('k18pondw', () => new THREE.CircleGeometry(0.85, 24)), wm, 0, 0.1, 0, false)); w.rotation.x = -PI / 2; w.scale.set(1.3, 0.85, 1);
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2, rx = Math.cos(a) * 1.15, rz = Math.sin(a) * 0.78; k.s(0.18 + (i % 3) * 0.05, ROCK - (i % 4) * 0x080808, rx, 0.1, rz, 1.3, 0.7, 1); }
    for (const [x, z, s] of [[-0.9, -0.7, 0.4], [-0.3, -0.85, 0.32], [0.8, -0.75, 0.36], [1.2, -0.3, 0.3]]) k.s(s, ROCK - 0x101010, x, s * 0.7, z, 1.2, 1, 1);
    const bb = k.c(0.04, 0.04, 0.6, 0x9a8a3a, -0.5, 0.75, -0.55, 10); bb.rotation.x = 1.0; k.c(0.05, 0.05, 0.55, 0x8a7a3a, -0.5, 0.55, -0.9, 10);
    const st = k.c(0.012, 0.01, 0.4, new THREE.MeshBasicMaterial({ color: 0xcfe8f0, transparent: true, opacity: 0.6 }), -0.5, 0.4, -0.2); st.userData.noBake = true;
    for (let i = 0; i < 3; i++) k.s(0.05, [0xff8a3a, 0xfbfbf8, 0xff5a2a][i], -0.2 + i * 0.35, 0.11, 0.1 + (i % 2) * 0.2, 1.6, 0.4, 0.7);
    k.b(0.3, 0.3, 0.02, T.woodgrain(0x9a6a3a), 0.9, 0.75, -0.55).rotation.z = 0.08; k.c(0.02, 0.02, 0.6, DK2, 0.9, 0.3, -0.55);
  }, { tags: ['japanese', 'garden', 'water'] });
  def('k18j_pine', '소나무 정원수 (층층 가지)', 'misc', 2400, 1.4, 1.4, g => {
    const k = K(g); const tr = k.c(0.09, 0.14, 1.9, 0x4a3424, 0, 0.95, 0, 10); tr.rotation.z = 0.12;
    for (const [x, y, z, s] of [[0.3, 1.9, 0, 1], [-0.4, 1.5, 0.1, 0.9], [0.45, 1.15, -0.15, 0.8], [-0.1, 2.3, 0.05, 0.75], [-0.5, 0.9, -0.1, 0.6]]) { k.s(0.5 * s, 0x2a4a22, x, y, z, 1.4, 0.45, 1); k.s(0.36 * s, 0x3a5a2a, x + 0.1, y + 0.08, z, 1.3, 0.4, 1); }
    for (let i = 0; i < 5; i++) k.s(0.22, ROCK, -0.4 + i * 0.2, 0.05, 0.4 - (i % 2) * 0.7, 1.2, 0.5, 1);
  }, { tags: ['japanese', 'plant', 'garden'] });
  def('k18j_toro', '석등 (도로)', 'misc', 1200, 0.6, 0.6, g => {
    const k = K(g), s = 0xa8a090; k.b(0.4, 0.12, 0.4, s, 0, 0.06, 0, 0.02); k.c(0.08, 0.1, 0.45, s, 0, 0.35, 0, 8); k.b(0.36, 0.08, 0.36, s, 0, 0.62, 0, 0.02); k.b(0.3, 0.26, 0.3, s, 0, 0.79, 0, 0.02);
    for (const [x, z] of [[0, 0.151], [0, -0.151]]) k.b(0.14, 0.12, 0.005, glow(0xffd070), x, 0.8, z); k.cone(0.34, 0.2, s, 0, 1.02, 0, 4).rotation.y = PI / 4; k.s(0.05, s, 0, 1.15, 0); halo(k, 0.5, 0xffc060, 0, 0.8, 0.2, 0.5);
  }, { tags: ['japanese', 'garden', 'lamp'], lamp: [[0, 0.8, 0.2, 0xffc060, 0.4, 3]] });
  def('k18j_rail', '어두운 원목 툇마루 난간', 'misc', 700, 3.0, 0.2, g => { const k = K(g); k.b(3.0, 0.07, 0.1, DK, 0, 0.8, 0, 0.01); k.b(3.0, 0.05, 0.08, DK, 0, 0.35, 0); for (const x of [-1.45, 0, 1.45]) k.b(0.1, 0.85, 0.1, DK, x, 0.42, 0); }, { tags: ['japanese'] });
  def('k18j_pillar', '검은 원목 기둥 & 들보', 'misc', 900, 0.4, 0.4, g => { const k = K(g); k.b(0.36, 3.2, 0.36, T.woodgrain(0x2a1a10), 0, 1.6, 0); k.b(0.44, 0.12, 0.44, DK, 0, 0.06, 0); }, { tags: ['japanese'] });
  const chochinTex = () => new THREE.MeshBasicMaterial({ map: ctex('k18chochin', 64, 64, (c, w, h) => { const gr = c.createRadialGradient(32, 32, 4, 32, 32, 40); gr.addColorStop(0, '#fff4d0'); gr.addColorStop(1, '#f0b060'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(160,90,40,0.5)'; for (let y = 6; y < h; y += 7) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } }) });
  def('k18j_chochin_string', '초롱 줄 (종이 등 5개)', 'wall', 900, 2.6, 0.2, g => {
    const k = K(g), mt = chochinTex(), y = 2.55; const wire = k.c(0.005, 0.005, 2.6, 0x1a1a1a, 0, y + 0.18, 0.12); wire.rotation.z = PI / 2;
    for (let i = 0; i < 5; i++) { const x = -1.04 + i * 0.52, yy = y - Math.sin(i / 4 * PI) * 0.08; k.s(0.14, mt, x, yy, 0.14, 1, 1.15, 1); k.c(0.07, 0.07, 0.03, DK, x, yy + 0.16, 0.14); k.c(0.07, 0.07, 0.03, DK, x, yy - 0.16, 0.14); halo(k, 0.35, 0xffc070, x, yy, 0.2, 0.55); }
  }, { wall: true, tags: ['japanese', 'lamp'], lamp: [[0, 2.5, 0.3, 0xffb060, 0.5, 4]] });
  def('k18j_big_lantern', '큰 종이 등 (꽃 그림 · 펜던트)', 'misc', 1500, 0.8, 0.8, g => {
    const k = K(g), y = 2.3; const mt = new THREE.MeshBasicMaterial({ map: ctex('k18bigl', 128, 64, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fff8e0'); gr.addColorStop(1, '#f8d8a0'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = '#4a3020'; c.lineWidth = 2; for (let x = 0; x < w; x += 16) { c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + 6, h / 3, x - 6, h * 0.66, x, h); c.stroke(); } c.fillStyle = '#e8603a'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(90 + Math.cos(i * 1.3) * 8, 32 + Math.sin(i * 1.3) * 8, 6, 0, 7); c.fill(); } c.fillStyle = '#5a7a3a'; c.beginPath(); c.ellipse(76, 44, 10, 4, 0.4, 0, 7); c.fill(); }) });
    k.c(0.008, 0.008, 0.9, 0x1a1a1a, 0, y + 0.8, 0); k.s(0.36, mt, 0, y, 0, 1.25, 0.8, 1.25); k.c(0.15, 0.2, 0.08, DK, 0, y + 0.31, 0, 12); k.c(0.2, 0.15, 0.06, DK, 0, y - 0.3, 0, 12); k.c(0.012, 0.012, 0.35, DK, 0, y - 0.5, 0); halo(k, 1.1, 0xffd090, 0, y, 0, 0.6);
  }, { tags: ['japanese', 'lamp'], lamp: [[0, 2.2, 0, 0xffc880, 0.8, 6]] });
  const zabuton = (k, x, z, c, a = 0) => { const zb = k.b(0.5, 0.08, 0.5, c, x, 0.04, z, 0.04); zb.rotation.y = a; for (const [dx, dz] of [[0.23, 0.23], [-0.23, 0.23], [0.23, -0.23], [-0.23, -0.23]]) k.s(0.02, 0xd8b070, x + dx * Math.cos(a) + dz * Math.sin(a), 0.07, z - dx * Math.sin(a) + dz * Math.cos(a)); };
  const futonTex = () => new THREE.MeshLambertMaterial({ map: ctex('k18futon', 128, 64, (c, w, h) => { c.fillStyle = '#22284a'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8e4d8'; for (let y = 8; y < h; y += 16) for (let x = 8; x < w; x += 16) { c.save(); c.translate(x, y); c.rotate(PI / 4); c.fillRect(-2.5, -2.5, 5, 5); c.restore(); c.fillRect(x - 5, y - 0.5, 3, 1); c.fillRect(x + 2, y - 0.5, 3, 1); } }) });
  def('k18j_kotatsu', '코타츠 & 다기 쟁반 (방석 4)', 'misc', 2800, 2.2, 2.2, g => {
    const k = K(g), ft = futonTex();
    k.b(1.05, 0.34, 1.05, ft, 0, 0.19, 0, 0.1); k.b(0.95, 0.06, 0.95, T.woodgrain(0x8a5a2a), 0, 0.38, 0, 0.02); k.b(0.97, 0.02, 0.97, DK, 0, 0.355, 0);
    k.b(0.46, 0.05, 0.3, DK, 0, 0.435, 0); k.s(0.07, 0x3a4a5a, -0.1, 0.5, 0, 1.1, 0.8, 1); k.c(0.012, 0.012, 0.08, 0x3a4a5a, -0.02, 0.51, 0).rotation.z = -0.8; k.t(0.05, 0.008, 0x2a2a2a, -0.1, 0.56, 0);
    for (let i = 0; i < 4; i++) k.c(0.025, 0.022, 0.05, 0x3a4a5a, 0.07 + (i % 2) * 0.08, 0.485, -0.07 + ((i / 2) | 0) * 0.14);
    const cols = [0xe8dcc8, 0xb04a3a, NAVY, 0xb04a3a];
    for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2; zabuton(k, Math.sin(a) * 0.82, Math.cos(a) * 0.82, cols[i], a); }
  }, { tags: ['japanese', 'table'], use: [0, 1, 2, 3].map(i => { const a = i / 4 * PI * 2; return { pose: 'drink', dx: Math.sin(a) * 0.8, dz: Math.cos(a) * 0.8, face: i * 90 + 180, act: 'tea_heal', seatH: 0.12, prop: 'teacup' }; }) });
  def('k18j_zaisu', '좌식 의자 & 방석', 'rest', 700, 0.6, 0.6, g => { const k = K(g); zabuton(k, 0, 0.02, NAVY); k.b(0.44, 0.04, 0.44, DK2, 0, 0.1, 0.02, 0.02); const b = k.b(0.4, 0.5, 0.04, T.woodgrain(0x6a4028), 0, 0.34, -0.2, 0.03); b.rotation.x = -0.25; k.b(0.08, 0.2, 0.01, DK, 0, 0.4, -0.17).rotation.x = -0.25; }, { tags: ['japanese', 'chair'], use: [{ pose: 'drink', dx: 0, dz: 0.05, face: 0, act: 'tea_heal', seatH: 0.16, prop: 'teacup' }] });
  def('k18j_bench', '대나무 평상 & 방석', 'rest', 1400, 1.8, 0.6, g => {
    const k = K(g); for (let i = 0; i < 8; i++) k.c(0.03, 0.03, 1.75, 0x8a3a2a, 0, 0.36, -0.24 + i * 0.07, 10).rotation.z = PI / 2; for (const x of [-0.8, 0.8]) for (const z of [-0.22, 0.22]) k.c(0.03, 0.03, 0.34, DK, x, 0.17, z);
    k.b(0.6, 0.1, 0.45, 0xe8dcc0, 0.4, 0.44, 0, 0.05); k.b(1.75, 0.03, 0.03, 0x1a1a1a, 0, 0.3, 0.26);
  }, { tags: ['japanese', 'bench'], use: [-0.45, 0.4].map(x => ({ pose: 'drink', dx: x, dz: 0.05, face: 0, act: 'tea_heal', seatH: 0.42, prop: 'teacup' })) });
  def('k18j_shelf', '낮은 원목 선반 & 분재 · 안돈', 'misc', 1300, 1.6, 0.45, g => {
    const k = K(g); k.b(1.6, 0.05, 0.42, DK2, 0, 0.62, 0); k.b(1.6, 0.05, 0.42, DK2, 0, 0.25, 0); for (const x of [-0.76, 0.76]) k.b(0.06, 0.64, 0.4, DK2, x, 0.32, 0);
    k.b(0.36, 0.08, 0.22, 0x3a4a5a, -0.3, 0.69, 0, 0.02); const tr = k.c(0.03, 0.05, 0.25, 0x5a4030, -0.3, 0.84, 0); tr.rotation.z = 0.4; for (const [x, y, s] of [[-0.18, 0.96, 0.14], [-0.4, 0.9, 0.11], [-0.28, 1.02, 0.1]]) k.s(s, 0x2a4a22, x, y, 0, 1.4, 0.5, 1);
    k.b(0.16, 0.22, 0.16, new THREE.MeshBasicMaterial({ color: 0xfff0c8 }), 0.4, 0.76, 0); k.b(0.18, 0.02, 0.18, DK, 0.4, 0.88, 0); halo(k, 0.4, 0xffc070, 0.4, 0.76, 0.1, 0.5);
    k.b(0.3, 0.1, 0.2, 0xb04a3a, 0.2, 0.32, 0); k.b(0.3, 0.1, 0.2, 0x3a4a5a, 0.2, 0.42, 0);
  }, { tags: ['japanese', 'storage', 'plant'], lamp: [[0.4, 0.8, 0.2, 0xffc070, 0.3, 3]] });
  def('k18j_andon', '안돈 바닥 등 (꽃무늬 종이)', 'misc', 500, 0.4, 0.4, g => { const k = K(g); k.c(0.18, 0.18, 0.03, 0x8a5a3a, 0, 0.015, 0, 16); k.c(0.12, 0.12, 0.26, new THREE.MeshBasicMaterial({ map: ctex('k18andon', 64, 64, (c, w, h) => { c.fillStyle = '#fff4d8'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8603a'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(16 + i * 12, 30 + (i % 2) * 10, 4, 0, 7); c.fill(); } }) }), 0, 0.17, 0, 16); k.c(0.13, 0.13, 0.02, DK, 0, 0.31, 0, 16); halo(k, 0.4, 0xffc070, 0, 0.2, 0, 0.55); }, { tags: ['japanese', 'lamp'], lamp: [[0, 0.3, 0, 0xffc070, 0.25, 2.5]] });
  def('k18j_tea_prep', '다도 준비상 (무쇠 주전자 · 화로 · 다구)', 'misc', 1800, 1.3, 0.6, g => {
    const k = K(g); k.b(1.3, 0.05, 0.6, T.woodgrain(0x6a4028), 0, 0.42, 0, 0.02); for (const x of [-0.6, 0.6]) k.b(0.06, 0.4, 0.55, DK, x, 0.2, 0);
    k.c(0.16, 0.14, 0.14, 0x3a2a1a, -0.3, 0.52, 0); k.s(0.04, 0xff5a1a, -0.3, 0.6, 0, 1.4, 0.4, 1.4); k.s(0.12, 0x2a2a2a, -0.3, 0.72, 0, 1, 0.85, 1); k.t(0.08, 0.01, 0x2a2a2a, -0.3, 0.84, 0, PI);
    k.c(0.06, 0.05, 0.06, 0x2a3a2a, 0.1, 0.48, 0.05); k.c(0.04, 0.04, 0.08, 0x8a3a2a, 0.25, 0.49, -0.1); k.c(0.03, 0.012, 0.06, 0xe8dcc0, 0.4, 0.48, 0.08); k.c(0.012, 0.008, 0.18, 0xd8c890, 0.5, 0.46, -0.1).rotation.z = PI / 2;
    const st = k.s(0.08, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false }), -0.3, 0.98, 0, 1, 1.6, 1); st.userData.noBake = true;
  }, { tags: ['japanese', 'counter'], use: [{ pose: 'cook', dx: 0, dz: -0.55, face: 0, act: 'staff' }] });
  def('k18j_book_stack', '책 더미 (낡은 표지)', 'misc', 200, 0.35, 0.3, g => { const k = K(g); for (let i = 0; i < 7; i++) { const b = k.b(0.3 - (i % 3) * 0.02, 0.06, 0.22, [0x6a2a1a, 0x3a2a1a, 0x8a6a3a, 0x2a3a4a][i % 4], ((i * 7) % 3 - 1) * 0.02, 0.03 + i * 0.062, 0); b.rotation.y = ((i * 5) % 3 - 1) * 0.12; } }, { tags: ['japanese', 'book'] });
  def('k18j_plant', '청자 화분 드라세나', 'misc', 500, 0.5, 0.5, g => { const k = K(g); k.b(0.34, 0.32, 0.34, 0x2a5a5a, 0, 0.16, 0, 0.03); k.c(0.03, 0.04, 0.9, 0x5a4030, 0, 0.75, 0); for (let i = 0; i < 12; i++) { const a = i * 2.4; const l = k.s(0.16, 0x3a6a2a, Math.cos(a) * 0.14, 1.0 + (i % 4) * 0.12, Math.sin(a) * 0.14, 0.3, 0.05, 1); l.rotation.y = -a; } }, { tags: ['japanese', 'plant'] });
  const TEA = INT.tea_in;
  if (TEA) {
    Object.assign(TEA, { w: 12, d: 9, wallH: 3.2, wallStyle: 'st_jpforest', wallStyleL: 'st_jpsudare', wallStyleR: 'st_jpsudare', floor: 'jpwood', floorColor: 0x3a2416, wall: 0x3a2214, light: 'warm', maxLamps: 12, name: '달빛 다실 (일본풍 찻집)',
      venueMood: { main: 0.2, lamp: 1.0, hemi: [0xffc890, 0x100804, 0.2], amb: [0xffb070, 0.06], dir: [0xffd0a0, 0.22], bg: 0x0a0604, rim: 0.4, shadow: { pos: [0, 8, 4], soft: 5 } },
      furn: [
        f('k18j_garden_floor', 0, -3.2), f('k18j_pond', 0.2, -3.4), f('k18j_pine', -3.1, -3.6), f('k18j_pine', 3.2, -3.5, 180), f('k18j_toro', 1.9, -2.5), f('k18j_toro', -2.0, -2.4), f('k18j_andon', 0.9, -2.2),
        f('k18j_pillar', -4.2, -1.9), f('k18j_pillar', 4.2, -1.9), f('k18j_rail', -2.6, -1.9), f('k18j_rail', 2.6, -1.9),
        f('k18j_chochin_string', -5.94, -1.0, 90), f('k18j_chochin_string', 5.94, -1.0, -90), f('k18j_chochin_string', -5.94, 2.2, 90), f('k18j_chochin_string', 5.94, 2.2, -90), f('k18j_big_lantern', 0, -0.2),
        f('k18j_kotatsu', -1.6, 0.9), f('k18j_kotatsu', 2.2, 2.4), f('k18j_zaisu', 4.6, 0.2, -90), f('k18j_zaisu', -4.6, 3.3, 90), f('k18j_bench', 4.9, -1.0, -90), f('k18j_bench', -1.0, 3.9, 180),
        f('k18j_shelf', -5.65, 0.6, 90), f('k18j_tea_prep', -3.9, -0.8), f('k18j_book_stack', -0.1, -0.9), f('k18j_plant', 5.4, 3.8), f('k18j_plant', -5.4, -1.3),
        f('k18j_andon', -3.0, 2.6), f('k18j_andon', 0.6, 4.0), f('k18j_andon', 4.4, 1.3), f('guestbook', 5.3, 2.6, -90),
      ] });
  }

  // =========================================================
  // 🏫 섬 어린이 학교 — 교실
  // =========================================================
  Object.assign(RK.WALLS, {
    schoolplank: { tileW: 2, w: 256, h: 256, draw: (g, w, h) => { for (let x = 0; x < w; x += 24) { g.fillStyle = tone(0xf4efe4, 0.94 + ((x / 24) % 3) * 0.025); g.fillRect(x, 0, 23, h); g.fillStyle = 'rgba(120,100,80,0.28)'; g.fillRect(x + 23, 0, 1, h); g.fillStyle = 'rgba(150,130,100,0.1)'; g.fillRect(x + 6, (x * 7) % h, 2, 6); } g.fillStyle = '#c8b8a0'; g.fillRect(0, h - 14, w, 14); } },
  });
  const SWOOD = T.woodgrain(0xd89a5a), METAL = 0x6a6a70, WHITEM = 0xf4f2ee;
  const kidChair = (k, x, z, a = 0) => { const sub = new THREE.Group(); sub.position.set(x, 0, z); sub.rotation.y = a; k.add(sub); const q = K(sub); q.b(0.38, 0.03, 0.36, SWOOD, 0, 0.42, 0, 0.01); q.b(0.36, 0.2, 0.03, SWOOD, 0, 0.66, -0.17, 0.02); for (const lx of [-0.17, 0.17]) { q.c(0.012, 0.012, 0.42, WHITEM, lx, 0.21, 0.16); q.c(0.012, 0.012, 0.78, WHITEM, lx, 0.39, -0.16); } q.b(0.36, 0.015, 0.015, WHITEM, 0, 0.55, -0.16); };
  def('k18s_desk', '학생 책걸상 (흰 철제 · 원목)', 'misc', 600, 0.7, 1.0, g => {
    const k = K(g); k.b(0.66, 0.03, 0.46, SWOOD, 0, 0.66, -0.15, 0.01); k.b(0.6, 0.12, 0.4, 0xe8e6e0, 0, 0.58, -0.15); for (const x of [-0.3, 0.3]) for (const z of [-0.34, 0.04]) k.c(0.012, 0.012, 0.64, WHITEM, x, 0.32, z);
    k.b(0.12, 0.16, 0.06, 0xf8f8f4, 0.36, 0.45, -0.1); kidChair(k, 0, 0.32, PI);
  }, { tags: ['school', 'desk'], use: [{ pose: 'write', dx: 0, dz: 0.3, face: 180, act: 'class', seatH: 0.44, prop: 'pen' }] });
  def('k18s_long_table', '긴 원목 작업대 & 의자 (그림 도구 · 책)', 'misc', 1600, 2.6, 1.3, g => {
    const k = K(g); k.b(2.5, 0.05, 0.7, SWOOD, 0, 0.7, 0, 0.02); for (const x of [-1.15, 1.15]) { k.b(0.05, 0.68, 0.05, METAL, x, 0.34, -0.3); k.b(0.05, 0.68, 0.05, METAL, x, 0.34, 0.3); k.b(0.05, 0.05, 0.6, METAL, x, 0.12, 0); }
    k.b(0.32, 0.005, 0.22, 0xfbfbf8, -0.5, 0.73, 0.05).rotation.y = 0.2; k.b(0.3, 0.06, 0.22, 0x6a2a1a, 0.4, 0.755, -0.05, 0.01); k.c(0.005, 0.005, 0.14, 0xe84a3a, -0.2, 0.735, 0.1).rotation.z = PI / 2;
    for (const x of [-0.8, 0, 0.8]) kidChair(k, x, 0.52, PI);
  }, { tags: ['school', 'table'], use: [-0.8, 0, 0.8].map(x => ({ pose: 'write', dx: x, dz: 0.5, face: 180, act: 'class', seatH: 0.44, prop: 'pen' })) });
  def('k18s_craft_table', '원목 공작 테이블 & 스툴 4 (연필꽂이 · 공룡 인형 · 선물 상자)', 'misc', 1800, 2.0, 2.2, g => {
    const k = K(g); k.b(1.6, 0.06, 1.1, SWOOD, 0, 0.66, 0, 0.02); for (const [x, z] of [[-0.74, -0.5], [0.74, -0.5], [-0.74, 0.5], [0.74, 0.5]]) k.b(0.07, 0.64, 0.07, SWOOD, x, 0.32, z);
    for (const [x, z] of [[-0.45, -0.85], [0.45, -0.85], [-0.45, 0.85], [0.45, 0.85]]) { k.b(0.34, 0.04, 0.34, SWOOD, x, 0.44, z, 0.01); for (const [dx, dz] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) k.b(0.035, 0.42, 0.035, SWOOD, x + dx, 0.21, z + dz); }
    k.c(0.06, 0.05, 0.1, 0xe8b020, -0.4, 0.74, -0.2); for (let i = 0; i < 4; i++) k.c(0.006, 0.006, 0.16, [0xe84a3a, 0x3a7ae8, 0x3aa84a, 0xe8c83a][i], -0.42 + (i % 2) * 0.03, 0.8, -0.2 + ((i / 2) | 0) * 0.03);
    k.b(0.4, 0.01, 0.3, 0x3a8a3a, 0.35, 0.695, 0.15); const d = k.s(0.08, 0x8ad8c0, 0.38, 0.8, 0.15, 1, 1.4, 0.8); void d; k.s(0.05, 0x8ad8c0, 0.42, 0.93, 0.18); k.b(0.3, 0.14, 0.22, 0x2a5a3a, -0.1, 0.76, 0.3, 0.01); k.b(0.32, 0.02, 0.04, 0xe84a3a, -0.1, 0.84, 0.3);
  }, { tags: ['school', 'table'], use: [[-0.45, -0.85, 0], [0.45, -0.85, 0], [-0.45, 0.85, 180], [0.45, 0.85, 180]].map(([x, z, fc]) => ({ pose: 'write', dx: x, dz: z, face: fc, act: 'class', seatH: 0.46, prop: 'pen' })) });
  def('k18s_chalkboard', '초록 칠판 & 분필 받침', 'wall', 1500, 3.4, 0.1, g => {
    const k = K(g); k.b(3.4, 1.35, 0.06, T.woodgrain(0xc8a070), 0, 1.55, 0.03); k.b(3.24, 1.2, 0.02, new THREE.MeshLambertMaterial({ map: ctex('k18chalk', 256, 96, (c, w, h) => { c.fillStyle = '#2a5a3a'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 30; i++) c.fillRect((i * 37) % w, (i * 19) % h, 30, 2); c.strokeStyle = 'rgba(255,255,255,0.5)'; c.font = '14px sans-serif'; c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillText('오늘의 목표: 친구와 사이좋게 ♡', 20, 30); c.fillText('1 + 2 = 3', 30, 60); c.fillStyle = 'rgba(255,220,120,0.8)'; c.fillText('★ 숙제 ★', 180, 70); }) }), 0, 1.55, 0.07);
    k.b(3.3, 0.04, 0.12, T.woodgrain(0xc8a070), 0, 0.9, 0.1); for (let i = 0; i < 4; i++) k.c(0.008, 0.008, 0.07, [0xffffff, 0xffe070, 0xff8ab0, 0xffffff][i], -1.2 + i * 0.1, 0.93, 0.12).rotation.z = PI / 2; k.b(0.14, 0.04, 0.05, 0x3a3a3a, 1.2, 0.94, 0.12, 0.01);
  }, { wall: true, tags: ['school'] });
  def('k18s_whiteboard', '바퀴 달린 화이트보드 (영어 단어)', 'misc', 900, 1.2, 0.6, g => {
    const k = K(g); k.b(1.1, 0.8, 0.03, new THREE.MeshLambertMaterial({ map: ctex('k18wb', 128, 96, (c, w, h) => { c.fillStyle = '#fbfbf8'; c.fillRect(0, 0, w, h); c.font = '10px sans-serif'; c.fillStyle = '#2a3a8a'; ['apple - 사과', 'book - 책', 'friend - 친구', 'smile - 미소'].forEach((t, i) => c.fillText(t, 8, 18 + i * 18)); c.strokeStyle = '#d83a2a'; c.lineWidth = 2; c.beginPath(); c.ellipse(34, 50, 30, 9, 0, 0, 7); c.stroke(); }) }), 0, 1.3, 0);
    k.b(1.16, 0.86, 0.02, 0xd8d8dc, 0, 1.3, -0.01); for (const x of [-0.55, 0.55]) { k.c(0.015, 0.015, 1.7, METAL, x, 0.85, 0); k.b(0.05, 0.03, 0.5, METAL, x, 0.05, 0); for (const z of [-0.22, 0.22]) k.s(0.03, 0x2a2a2a, x, 0.03, z); }
  }, { tags: ['school'] });
  def('k18s_teacher_desk', '교탁 & 초록 가죽 의자 (주황 머그 · 출석부)', 'misc', 1800, 1.5, 1.3, g => {
    const k = K(g); k.b(1.4, 0.72, 0.65, SWOOD, 0, 0.36, 0, 0.02); k.b(1.46, 0.04, 0.7, SWOOD, 0, 0.74, 0, 0.01); k.b(0.5, 0.2, 0.01, T.woodgrain(0xb88050), -0.3, 0.55, 0.33);
    P.mug(k, 0.45, 0.76, 0.05, 0xe8602a); k.b(0.28, 0.04, 0.2, 0x3a5a8a, -0.2, 0.78, 0, 0.01); k.b(0.24, 0.01, 0.18, 0xfbfbf8, 0.1, 0.765, 0.1).rotation.y = 0.3;
    const sub = new THREE.Group(); sub.position.set(0, 0, -0.6); g.add(sub); const q = K(sub); q.b(0.5, 0.1, 0.48, 0x2a6a4a, 0, 0.48, 0, 0.04); q.b(0.5, 0.6, 0.12, 0x2a6a4a, 0, 0.85, -0.2, 0.06); q.c(0.03, 0.03, 0.4, 0x2a2a2a, 0, 0.25, 0); for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; q.b(0.26, 0.03, 0.04, 0x2a2a2a, Math.cos(a) * 0.13, 0.05, Math.sin(a) * 0.13).rotation.y = -a; }
  }, { tags: ['school', 'desk'], use: [{ pose: 'type', dx: 0, dz: -0.6, face: 0, act: 'staff', seatH: 0.5 }] });
  def('k18s_binder_shelf', '바인더 책장 & 수납장 (상자 · 책 더미)', 'misc', 1500, 1.5, 0.45, g => {
    const k = K(g); k.b(1.5, 0.8, 0.44, 0xd8dcd4, 0, 0.4, 0, 0.01); for (const x of [-0.37, 0.37]) k.b(0.7, 0.7, 0.01, 0xe4e8e0, x, 0.42, 0.225); for (const x of [-0.05, 0.05]) k.b(0.01, 0.1, 0.02, 0x6a6a6a, x, 0.5, 0.23);
    k.b(1.5, 0.8, 0.36, 0xd8dcd4, 0, 1.2, -0.04, 0.01); for (const y of [0.98, 1.38]) for (let i = 0; i < 11; i++) k.b(0.1, 0.34, 0.26, [0x3a5a9a, 0x5aa84a, 0xf4f0e8, 0xe8a0b0, 0x8a5aa8][(i + (y > 1.2 ? 2 : 0)) % 5], -0.6 + i * 0.12, y, 0.02);
    k.b(1.46, 0.02, 0.34, 0xc8ccc4, 0, 1.2, -0.02); k.b(0.4, 0.3, 0.34, [0x5a8a3a, 0x8a8a8a][0], -0.4, 1.76, 0, 0.01); for (let i = 0; i < 6; i++) k.b(0.3, 0.05, 0.22, [0x6a2a1a, 0x3a6a3a, 0xd8b050][i % 3], 0.4, 1.63 + i * 0.05, 0).rotation.y = (i % 3 - 1) * 0.1;
  }, { tags: ['school', 'storage'] });
  const poster = (key, w, h, draw) => pic(key, w, h, draw);
  def('k18s_posters', '알파벳 · 숫자 포스터', 'wall', 400, 2.4, 0.05, g => {
    const k = K(g); plane(k, 0.9, 0.62, poster('k18abc', 128, 96, (c, w, h) => { c.fillStyle = '#fbf4e8'; c.fillRect(0, 0, w, h); const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; c.font = 'bold 11px sans-serif'; [...L].forEach((ch, i) => { c.fillStyle = ['#e84a3a', '#3a7ae8', '#3aa84a', '#e8a03a'][i % 4]; c.fillRect(6 + (i % 6) * 20, 6 + ((i / 6) | 0) * 18, 18, 16); c.fillStyle = '#fff'; c.fillText(ch, 10 + (i % 6) * 20, 18 + ((i / 6) | 0) * 18); }); }), 0.6, 2.3, 0.03);
    plane(k, 0.62, 0.62, poster('k18num', 96, 96, (c, w, h) => { c.fillStyle = '#eaf4fb'; c.fillRect(0, 0, w, h); c.font = 'bold 12px sans-serif'; for (let i = 0; i < 16; i++) { c.fillStyle = ['#e8a03a', '#e84a3a', '#3a7ae8'][i % 3]; c.fillRect(6 + (i % 4) * 22, 6 + ((i / 4) | 0) * 22, 20, 20); c.fillStyle = '#fff'; c.fillText(String(i + 1), 9 + (i % 4) * 22, 20 + ((i / 4) | 0) * 22); } }), -0.6, 2.3, 0.03);
  }, { wall: true, tags: ['school', 'art'] });
  def('k18s_map', '세계지도 & 상장 액자', 'wall', 500, 2.0, 0.05, g => { const k = K(g); plane(k, 1.2, 0.8, poster('k18map', 160, 108, (c, w, h) => { c.fillStyle = '#9ad0f0'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8c860'; for (const [x, y, rx, ry] of [[40, 40, 22, 18], [30, 76, 10, 20], [80, 40, 14, 16], [90, 70, 12, 16], [122, 42, 26, 16], [132, 82, 10, 8]]) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); } c.fillStyle = '#7ab85a'; c.beginPath(); c.ellipse(118, 38, 14, 8, 0, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(1, 1, w - 2, h - 2); }), -0.3, 2.0, 0.03); k.b(0.5, 0.36, 0.03, T.woodgrain(0x8a5a2a), 0.75, 1.75, 0.02); plane(k, 0.42, 0.28, poster('k18cert', 64, 44, (c, w, h) => { c.fillStyle = '#fbf8ec'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c8a050'; c.strokeRect(3, 3, w - 6, h - 6); c.fillStyle = '#3a2a1a'; c.font = 'bold 9px serif'; c.fillText('상 장', 20, 18); c.fillStyle = '#d83a2a'; c.beginPath(); c.arc(50, 34, 5, 0, 7); c.fill(); }), 0.75, 1.75, 0.04); }, { wall: true, tags: ['school', 'art'] });
  def('k18s_board', '코르크 게시판 (그림 · 메모)', 'wall', 400, 1.0, 0.05, g => { const k = K(g); k.b(1.0, 0.7, 0.03, T.woodgrain(0xa87848), 0, 1.75, 0.015); plane(k, 0.9, 0.6, poster('k18cork', 96, 64, (c, w, h) => { c.fillStyle = '#c8905a'; c.fillRect(0, 0, w, h); for (let i = 0; i < 7; i++) { c.fillStyle = ['#fbfbf8', '#ffe070', '#ff9ab0', '#a8d8f0'][i % 4]; c.save(); c.translate(10 + (i % 4) * 22, 12 + ((i / 4) | 0) * 26); c.rotate((i % 3 - 1) * 0.15); c.fillRect(0, 0, 18, 20); c.restore(); c.fillStyle = '#d83a2a'; c.beginPath(); c.arc(19 + (i % 4) * 22, 13 + ((i / 4) | 0) * 26, 2, 0, 7); c.fill(); } }), 0, 1.75, 0.035); }, { wall: true, tags: ['school'] });
  def('k18s_fan', '벽걸이 선풍기 (민트)', 'wall', 500, 0.6, 0.3, g => { const k = K(g); k.b(0.12, 0.2, 0.08, 0x9ac8b0, 0, 2.2, 0.04); k.c(0.04, 0.04, 0.2, 0x9ac8b0, 0, 2.18, 0.16).rotation.x = PI / 2; const cage = k.t(0.25, 0.01, 0x8ab8a0, 0, 2.18, 0.3); void cage; k.c(0.25, 0.25, 0.08, new THREE.MeshLambertMaterial({ color: 0xb8e0cc, transparent: true, opacity: 0.35 }), 0, 2.18, 0.3, 20).rotation.x = PI / 2; for (let i = 0; i < 3; i++) { const b = k.s(0.1, 0x9ac8b0, Math.cos(i * 2.1) * 0.1, 2.18 + Math.sin(i * 2.1) * 0.1, 0.3, 1, 0.5, 0.1); b.rotation.z = i * 2.1; } }, { wall: true, tags: ['school'] });
  def('k18s_window', '흰 나무 창틀 창문 (햇살)', 'wall', 800, 1.3, 0.1, g => { const k = K(g); k.b(1.3, 1.1, 0.06, 0xf4f0e8, 0, 1.55, 0.03); k.b(1.14, 0.94, 0.02, new THREE.MeshBasicMaterial({ color: 0xfff4d8 }), 0, 1.55, 0.05); k.b(0.04, 0.94, 0.03, 0xf4f0e8, 0, 1.55, 0.07); k.b(1.14, 0.04, 0.03, 0xf4f0e8, 0, 1.55, 0.07); k.b(1.4, 0.05, 0.14, 0xf4f0e8, 0, 1.0, 0.08); }, { wall: true, tags: ['school', 'window'] });
  def('k18s_extinguisher', '소화기', 'misc', 200, 0.3, 0.3, g => { const k = K(g); k.c(0.08, 0.08, 0.5, 0xd8201a, 0, 0.3, 0); k.s(0.08, 0xd8201a, 0, 0.55, 0); k.c(0.02, 0.02, 0.1, 0x2a2a2a, 0, 0.65, 0); k.b(0.12, 0.02, 0.03, 0x2a2a2a, 0.04, 0.68, 0); k.b(0.08, 0.1, 0.01, 0xfbfbf8, 0, 0.35, 0.08); k.c(0.1, 0.1, 0.05, 0x3a3a3a, 0, 0.025, 0); }, { tags: ['school'] });
  def('k18s_fluor', '천장 형광등 (매달린 2등)', 'misc', 600, 1.6, 0.4, g => { const k = K(g), y = 2.75; for (const x of [-0.6, 0.6]) k.c(0.006, 0.006, 0.5, 0x8a8a8a, x, y + 0.28, 0); k.b(1.6, 0.06, 0.26, 0xf0ece4, 0, y, 0, 0.01); for (const z of [-0.06, 0.06]) k.c(0.025, 0.025, 1.5, glow(0xfffbf0), 0, y - 0.04, z).rotation.z = PI / 2; }, { ceiling: true, tags: ['school', 'lamp'], lamp: [[0, 2.6, 0, 0xfff8ec, 0.5, 6]] });
  const SCH = INT.school_in;
  if (SCH) {
    Object.assign(SCH, { w: 14, d: 10, wallH: 3.2, wallStyle: 'st_schoolplank', floor: 'herring', floorColor: 0x8a5a34, wall: 0xf4efe4, light: 'warm', maxLamps: 8,
      venueMood: { main: 0.75, lamp: 0.9, hemi: [0xfff4e0, 0x6a5040, 0.45], amb: [0xfff0d8, 0.14], dir: [0xfff0d8, 0.6], bg: 0x3a2a20, shadow: { pos: [-8, 7, 2], soft: 5 } },
      furn: [
        f('k18s_chalkboard', -0.8, -4.94), f('k18s_posters', -0.8, -4.94), f('k18s_map', 3.6, -4.94), f('k18s_board', -6.94, -2.4, 90), f('k18s_fan', -6.94, -3.9, 90), f('k18s_window', -6.94, 0.6, 90), f('k18s_window', -6.94, 3.0, 90), f('k18s_window', 6.94, 0.6, -90),
        f('k11_skeleton', -5.4, -4.4), f('k11_anatomy', -4.7, -4.4), f('k11_ficus', -3.6, -4.45), f('k18s_whiteboard', 1.8, -3.7, -12), f('k18s_binder_shelf', 4.4, -4.72), f('k18s_binder_shelf', 6.1, -4.72), f('k18s_extinguisher', 6.7, -3.6),
        f('k18s_teacher_desk', 4.6, -2.3),
        ...[-5.0, -3.5, -2.0].flatMap(x => [-2.1, -0.4].map(z => f('k18s_desk', x, z))), f('k18s_desk', -0.5, -2.1), f('k18s_desk', -0.5, -0.4), f('k18s_desk', 1.0, -2.1),
        f('k18s_long_table', -3.8, 1.9), f('k18s_long_table', -3.8, 3.7), f('k18s_craft_table', 2.6, 2.2), f('k18s_craft_table', 5.3, 2.2), f('k11_ficus', 6.4, 4.4), f('k13_book_stack', -6.2, 4.5),
        f('k18s_fluor', -3.5, -1.5), f('k18s_fluor', 1.5, -1.5), f('k18s_fluor', -3.5, 2.6), f('k18s_fluor', 3.5, 2.6),
      ] });
  }
  // 저장된 방 데이터는 새 배치로 교체
  const RESET = ['cafe_in', 'pub_in', 'tea_in', 'school_in'];
  const reset = () => { const st = FM.Sim.get && FM.Sim.get(); if (st && st.rooms) for (const id of RESET) delete st.rooms[id]; };
  reset(); const oLoad = FM.Sim.load; FM.Sim.load = function () { const r = oLoad.apply(this, arguments); reset(); return r; };
  if (FM.MAP.P.pub) FM.MAP.P.pub.name = '홍등반점 (중국집)';
  if (FM.MAP.P.teahouse) FM.MAP.P.teahouse.name = '달빛 다실 (일본풍 찻집)';
})();
