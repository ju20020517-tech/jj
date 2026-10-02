/* =========================================================
 *  🌅 노을 정원 & 맹세의 가제보 — 절벽 위를 낭만적인 정원으로 (레퍼런스: 푸른 수국 정원 · 돔 가제보)
 *   돔 가제보 · 자갈 산책로 · 원형 광장 · 푸른 수국 · 히아신스 & 은방울꽃 · 돌 항아리 화분 줄 · 빅토리아 가로등 · 바닥 랜턴
 *   · 돌기둥 철제 울타리 · 둥근 정원수 · 2단 분수 · 실개천 & 아치 돌다리 · 절벽 끝 사랑의 자물쇠 난간 · 하트 장미 아치 · 노을 벤치
 *   · 흩날리는 꽃잎 & 밤 반딧불 · 소원 등불
 *  + 노을 정원 이벤트 (드라마 · 실시간 장면)
 *   🌅 가제보 노을 데이트 · 🔒 사랑의 자물쇠 · 🏮 소원 등불 날리기 · 🎻 가제보 음악회 · 🤗 노을 아래 위로 · 💐 수국 고백
 *   플레이어: 자물쇠 걸기 · 소원 등불 날리기 · 가제보에서 노을 보기
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, RK = FM.RoomKit, Sim = FM.Sim;
  const { K, T, P, def, ctex, glow, glass, mesh, geo } = RK._h;
  const { halo } = RK._h5;
  const PI = Math.PI;
  const X0 = -82, X1 = -62, Z0 = -104, Z1 = -80, CX = -74, CZ = -92;
  FM.SUNSET_RECT = [X0, X1, Z0, Z1];
  const BENCHES = [[-70.0, -89.1, 180], [-64.2, -89.1, 180], [-70.0, -94.9, 0], [-64.2, -94.9, 0], [-76.6, -86.4, 90], [-71.4, -86.4, -90], [-76.6, -96.9, 90], [-71.4, -96.9, -90]];
  FM.SUNSET_BENCHES = BENCHES;
  // 정원 안의 원래 나무 · 나무 스폿 치우기
  const inR = (x, z) => x > X0 - 0.5 && x < X1 + 0.5 && z > Z0 - 0.5 && z < Z1 + 0.5;
  if (FM.DECOR) for (const k of ['trees', 'flowers', 'lamps']) { const a = FM.DECOR[k]; if (a) for (let i = a.length - 1; i >= 0; i--) if (inR(a[i].x, a[i].z)) a.splice(i, 1); }
  if (Sim.SPOTS) for (let i = Sim.SPOTS.length - 1; i >= 0; i--) { const sp = Sim.SPOTS[i]; if (!sp.place && inR(sp.x, sp.z)) Sim.SPOTS.splice(i, 1); }
  const STONE = 0xd8d2c4, STONE2 = 0xbcb4a4, IRON = 0x1e2024, LEAF = 0x2f5a2a, LEAF2 = 0x3c6e32;
  const SLATE = new THREE.MeshLambertMaterial({ map: ctex('k19slate', 128, 128, (c, w, h) => { c.fillStyle = '#5a6e86'; c.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 10) for (let x = -((y / 10) % 2) * 8; x < w; x += 16) { c.fillStyle = `rgb(${70 + ((x + y) % 5) * 6},${90 + ((x * 3 + y) % 5) * 6},${115 + ((x + y * 3) % 5) * 7})`; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 15, y); c.lineTo(x + 15, y + 8); c.quadraticCurveTo(x + 7.5, y + 12, x, y + 8); c.fill(); } for (let x = 0; x < w; x += 32) { c.fillStyle = 'rgba(200,210,220,0.35)'; c.fillRect(x, 0, 3, h); } }) });
  const flowerMat = (key, base, dot) => new THREE.MeshLambertMaterial({ map: ctex(key, 64, 64, (c, w, h) => { c.fillStyle = base; c.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { const x = (i * 23) % w, y = (i * 41) % h; c.fillStyle = i % 3 ? dot : '#ffffff'; c.beginPath(); for (let j = 0; j < 4; j++) { const a = j / 4 * PI * 2; c.moveTo(x, y); c.arc(x + Math.cos(a) * 2.2, y + Math.sin(a) * 2.2, 2, 0, 7); } c.fill(); } }) });
  const HYD = flowerMat('k19hydY', '#f0b818', '#ffe050'), HYD2 = flowerMat('k19hyd2Y', '#f89a20', '#ffd040'), HYC = flowerMat('k19hycY', '#f8d020', '#fff27a');
  const gold = new THREE.MeshPhongMaterial({ color: 0xd4a848, shininess: 70, specular: 0xfff0b0 });

  // ---------------------------------------------------------
  // 소품
  // ---------------------------------------------------------
  def('k19_gazebo', '맹세의 돔 가제보 (푸른 슬레이트 돔 · 8기둥 · 돌계단)', 'misc', 20000, 5.2, 5.2, g => {
    const k = K(g), R = 1.9, H = 2.5;
    k.c(2.55, 2.6, 0.14, STONE2, 0, 0.07, 0, 8).rotation.y = PI / 8; k.c(2.25, 2.3, 0.18, STONE, 0, 0.23, 0, 8).rotation.y = PI / 8;
    k.c(2.2, 2.2, 0.01, new THREE.MeshLambertMaterial({ map: ctex('k19gzfloor', 128, 128, (c, w, h) => { c.fillStyle = '#e8e2d4'; c.fillRect(0, 0, w, h); c.strokeStyle = '#b8b0a0'; c.lineWidth = 2; for (let r = 12; r < 64; r += 14) { c.beginPath(); c.arc(64, 64, r, 0, 7); c.stroke(); } for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; c.beginPath(); c.moveTo(64, 64); c.lineTo(64 + Math.cos(a) * 64, 64 + Math.sin(a) * 64); c.stroke(); } c.fillStyle = '#8ab0d8'; c.beginPath(); c.arc(64, 64, 8, 0, 7); c.fill(); }) }), 0, 0.325, 0, 8).rotation.y = PI / 8;
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * PI * 2 + PI / 8, x = Math.sin(a) * R, z = Math.cos(a) * R;
      k.b(0.3, 0.14, 0.3, STONE, x, 0.39, z, 0.02); k.c(0.1, 0.12, H, 0xf0ebe0, x, 0.32 + H / 2, z, 12); k.b(0.3, 0.12, 0.3, STONE, x, 0.32 + H - 0.02, z, 0.02); k.c(0.13, 0.1, 0.1, STONE, x, 0.32 + H - 0.12, z, 12);
      for (let j = 0; j < 3; j++) k.c(0.105, 0.105, 0.02, STONE2, x, 0.6 + j * 0.9, z, 12);
    }
    const top = 0.32 + H + 0.05;
    k.c(R + 0.25, R + 0.2, 0.28, STONE, 0, top + 0.1, 0, 8).rotation.y = PI / 8; k.c(R + 0.3, R + 0.3, 0.06, STONE2, 0, top + 0.26, 0, 8).rotation.y = PI / 8;
    const dome = k.add(mesh(geo('k19dome', () => new THREE.SphereGeometry(R + 0.18, 24, 10, 0, PI * 2, 0, PI / 2)), SLATE, 0, top + 0.28, 0)); dome.scale.set(1, 0.72, 1);
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; const rib = k.add(mesh(geo('k19rib', () => new THREE.TorusGeometry(R + 0.19, 0.035, 6, 20, PI / 2)), new THREE.MeshLambertMaterial({ color: 0xc8d0d8 }), 0, top + 0.28, 0)); rib.rotation.set(0, a, 0); rib.rotation.order = 'YXZ'; rib.rotateZ(0); rib.scale.set(1, 0.72, 1); rib.rotation.y = a; rib.rotation.x = 0; }
    const ty = top + 0.28 + (R + 0.18) * 0.72;
    k.c(0.22, 0.3, 0.2, STONE, 0, ty + 0.05, 0, 12); k.s(0.2, STONE, 0, ty + 0.28, 0); k.cone(0.1, 0.35, STONE, 0, ty + 0.58, 0, 12); k.s(0.05, STONE, 0, ty + 0.78, 0);
    for (const s of [-1, 1]) { const st = k.b(1.2, 0.12, 0.4, STONE, 0, 0.06, s * 2.55, 0.02); void st; }
    // 안쪽 벤치 (서쪽 바다를 바라봄)
    k.b(0.5, 0.08, 1.7, STONE, 0.75, 0.74, 0, 0.03); for (const z of [-0.65, 0.65]) k.b(0.4, 0.4, 0.2, STONE2, 0.75, 0.52, z); k.b(0.1, 0.5, 1.7, STONE, 1.0, 1.0, 0, 0.03);
    k.b(0.36, 0.06, 0.55, 0x8ab0d8, 0.72, 0.8, -0.4, 0.03); k.b(0.36, 0.06, 0.55, 0xf4d8e0, 0.72, 0.8, 0.4, 0.03);
    // 돔 안 샹들리에 랜턴
    k.c(0.008, 0.008, 0.6, IRON, 0, top - 0.1, 0); const lb = k.b(0.2, 0.26, 0.2, glow(0xffe0a0), 0, top - 0.5, 0, 0.02); lb.userData.nightGlow = true; k.cone(0.16, 0.12, IRON, 0, top - 0.32, 0, 4).rotation.y = PI / 4;
    const hl = halo(k, 1.3, 0xffd090, 0, top - 0.5, 0, 0.7); hl.userData.nightOnly = true;
    // 기둥을 감은 흰 장미 넝쿨
    for (let i = 0; i < 8; i += 2) { const a = i / 8 * PI * 2 + PI / 8, x = Math.sin(a) * R, z = Math.cos(a) * R; for (let j = 0; j < 7; j++) { const t = j * 0.9; k.s(0.07, j % 3 ? LEAF2 : 0xffd84a, x + Math.cos(t) * 0.13, 0.5 + j * 0.3, z + Math.sin(t) * 0.13); } }
  }, { tags: ['outdoor', 'garden', 'romance'] });
  def('k19_hydrangea', '노란 꽃 덤불 (메리골드 · 노란 장미)', 'misc', 600, 1.0, 1.0, g => {
    const k = K(g); k.s(0.42, LEAF, 0, 0.3, 0, 1.2, 0.75, 1.1); k.s(0.3, LEAF2, 0.2, 0.36, -0.15, 1, 0.7, 1);
    const pts = [[0, 0.62, 0], [0.26, 0.54, 0.12], [-0.24, 0.52, 0.16], [0.14, 0.5, -0.26], [-0.2, 0.55, -0.2], [0.34, 0.42, -0.08], [-0.34, 0.42, 0.02]];
    pts.forEach(([x, y, z], i) => k.s(0.15 + (i % 3) * 0.02, i % 4 === 3 ? HYD2 : HYD, x, y, z, 1, 0.85, 1));
    for (let i = 0; i < 6; i++) { const a = i * 1.05; const l = k.s(0.1, LEAF2, Math.cos(a) * 0.4, 0.22, Math.sin(a) * 0.4, 1.3, 0.35, 0.8); l.rotation.y = -a; }
  }, { tags: ['outdoor', 'flower', 'garden'] });
  def('k19_hyacinth', '수선화 & 은방울꽃', 'misc', 300, 0.7, 0.7, g => {
    const k = K(g);
    for (let i = 0; i < 5; i++) { const a = i * 1.26, x = Math.cos(a) * 0.18, z = Math.sin(a) * 0.18, h = 0.36 + (i % 3) * 0.06; k.c(0.012, 0.015, h * 0.6, LEAF2, x, h * 0.3, z, 6); k.c(0.05, 0.065, h * 0.55, HYC, x, h * 0.62, z, 8); k.s(0.05, HYC, x, h * 0.9, z); for (let j = 0; j < 2; j++) { const lf = k.b(0.03, 0.26, 0.012, LEAF, x + (j ? 0.03 : -0.03), 0.13, z); lf.rotation.z = j ? -0.3 : 0.3; } }
    for (let i = 0; i < 2; i++) { const x = 0.22 * (i ? 1 : -1), z = 0.2; const st = k.c(0.006, 0.006, 0.3, LEAF2, x, 0.15, z, 5); st.rotation.x = 0.3; for (let j = 0; j < 4; j++) k.s(0.022, 0xfbfbf8, x + 0.02, 0.18 + j * 0.03, z + 0.06 + j * 0.015, 1, 1.2, 1); k.b(0.06, 0.28, 0.01, LEAF, x - 0.04, 0.14, z - 0.04).rotation.z = 0.2; }
  }, { tags: ['outdoor', 'flower', 'garden'] });
  def('k19_urn', '돌 항아리 화분 (받침 · 푸른 꽃)', 'misc', 700, 0.7, 0.7, g => {
    const k = K(g); k.b(0.44, 0.1, 0.44, STONE2, 0, 0.05, 0, 0.02); k.b(0.3, 0.34, 0.3, STONE, 0, 0.27, 0, 0.02); k.b(0.38, 0.06, 0.38, STONE2, 0, 0.46, 0, 0.02);
    const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(0.08 + t * 0.12 + Math.sin(t * PI) * 0.08 + (t > 0.85 ? (t - 0.85) * 0.8 : 0), t * 0.42)); }
    k.add(mesh(geo('k19urn', () => new THREE.LatheGeometry(pts, 20)), new THREE.MeshLambertMaterial({ color: STONE, side: THREE.DoubleSide }), 0, 0.49, 0)); k.t(0.3, 0.03, STONE, 0, 0.91, 0).rotation.x = PI / 2;
    k.c(0.27, 0.27, 0.02, 0x4a3a2a, 0, 0.88, 0); for (let i = 0; i < 7; i++) { const a = i * 0.9; k.s(0.07, i % 2 ? HYD : HYD2, Math.cos(a) * 0.15, 0.95, Math.sin(a) * 0.15); } k.s(0.08, LEAF2, 0, 0.94, 0, 1.4, 0.5, 1.4);
  }, { tags: ['outdoor', 'garden', 'flower'] });
  def('k19_lamp', '빅토리아 가로등 (검은 철제 · 유리 랜턴)', 'misc', 900, 0.5, 0.5, g => {
    const k = K(g); k.c(0.16, 0.2, 0.18, IRON, 0, 0.09, 0, 8); k.c(0.07, 0.1, 0.4, IRON, 0, 0.38, 0, 8); k.c(0.035, 0.045, 2.2, IRON, 0, 1.6, 0, 10); for (let i = 0; i < 3; i++) k.t(0.05, 0.012, IRON, 0, 0.8 + i * 0.6, 0).rotation.x = PI / 2;
    k.c(0.13, 0.08, 0.08, IRON, 0, 2.74, 0, 6); const gl = k.c(0.13, 0.1, 0.34, glow(0xffe4a8), 0, 2.95, 0, 6); gl.userData.nightGlow = true; for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; k.b(0.015, 0.36, 0.015, IRON, Math.cos(a) * 0.13, 2.95, Math.sin(a) * 0.13); }
    k.cone(0.2, 0.18, IRON, 0, 3.2, 0, 6); k.s(0.035, IRON, 0, 3.32, 0); const h = halo(k, 1.3, 0xffd89a, 0, 2.95, 0, 0.8); h.userData.nightOnly = true;
  }, { tags: ['outdoor', 'lamp'] });
  def('k19_glantern', '정원 바닥 랜턴 (철제)', 'misc', 300, 0.3, 0.3, g => { const k = K(g); k.c(0.03, 0.03, 0.4, IRON, 0, 0.2, 0); k.b(0.16, 0.2, 0.16, IRON, 0, 0.5, 0, 0.01); const gl = k.b(0.12, 0.16, 0.17, glow(0xffe0a0), 0, 0.5, 0); gl.userData.nightGlow = true; k.cone(0.13, 0.1, IRON, 0, 0.66, 0, 4).rotation.y = PI / 4; const h = halo(k, 0.5, 0xffd08a, 0, 0.5, 0, 0.7); h.userData.nightOnly = true; }, { tags: ['outdoor', 'lamp'] });
  def('k19_fence', '돌기둥 & 검은 철제 울타리', 'misc', 500, 2.0, 0.3, g => {
    const k = K(g); for (const x of [-0.95, 0.95]) { k.b(0.28, 0.9, 0.28, STONE, x, 0.45, 0, 0.02); k.b(0.34, 0.08, 0.34, STONE2, x, 0.94, 0, 0.02); k.s(0.08, STONE, x, 1.04, 0); }
    k.b(1.64, 0.18, 0.2, STONE2, 0, 0.09, 0, 0.02); for (const y of [0.35, 0.78]) k.b(1.62, 0.025, 0.025, IRON, 0, y, 0); for (let i = 0; i < 9; i++) { const x = -0.72 + i * 0.18; k.b(0.018, 0.62, 0.018, IRON, x, 0.5, 0); k.cone(0.025, 0.06, IRON, x, 0.84, 0, 4); }
  }, { tags: ['outdoor', 'fence'] });
  def('k19_tree', '둥근 정원수', 'misc', 900, 2.0, 2.0, g => {
    const k = K(g); k.c(0.14, 0.2, 1.6, 0x6a4a30, 0, 0.8, 0, 10); for (const [x, z, a] of [[0.2, 0.1, 0.5], [-0.2, -0.1, -0.5]]) { const b = k.c(0.06, 0.08, 0.7, 0x6a4a30, x, 1.5, z, 8); b.rotation.z = a; }
    for (const [x, y, z, r] of [[0, 2.3, 0, 0.9], [0.55, 1.95, 0.2, 0.62], [-0.55, 2.0, -0.1, 0.66], [0.1, 1.9, -0.55, 0.6], [-0.1, 2.0, 0.55, 0.6], [0.05, 2.85, 0.05, 0.55]]) k.s(r, ((x * 13 + z * 7) | 0) % 2 ? LEAF : LEAF2, x, y, z, 1, 0.85, 1);
  }, { tags: ['outdoor', 'plant', 'garden'] });
  def('k19_fountain', '2단 돌 분수', 'misc', 3000, 2.2, 2.2, g => {
    const k = K(g), wm = new THREE.MeshPhongMaterial({ color: 0x8ac8e8, shininess: 110, transparent: true, opacity: 0.85 });
    k.c(1.0, 1.05, 0.4, STONE, 0, 0.2, 0, 24); k.c(0.9, 0.9, 0.02, wm, 0, 0.38, 0, 24); k.c(0.12, 0.16, 0.9, STONE, 0, 0.8, 0, 12); k.c(0.5, 0.2, 0.18, STONE, 0, 1.25, 0, 20); k.c(0.44, 0.44, 0.02, wm, 0, 1.34, 0, 20); k.c(0.06, 0.08, 0.35, STONE, 0, 1.5, 0, 10); k.s(0.1, STONE, 0, 1.72, 0);
    const sp = k.c(0.02, 0.2, 0.5, new THREE.MeshBasicMaterial({ color: 0xe8f8ff, transparent: true, opacity: 0.45, depthWrite: false }), 0, 1.6, 0, 10); sp.userData.noBake = true;
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; const d = k.c(0.01, 0.02, 0.45, new THREE.MeshBasicMaterial({ color: 0xe8f8ff, transparent: true, opacity: 0.35, depthWrite: false }), Math.cos(a) * 0.48, 1.1, Math.sin(a) * 0.48, 6); d.userData.noBake = true; }
  }, { tags: ['outdoor', 'water', 'garden'] });
  def('k19_bench', '노을 전망 벤치 (돌 · 철제 팔걸이 · 수국 화분)', 'misc', 1100, 1.9, 0.7, g => {
    const k = K(g); k.b(1.6, 0.08, 0.5, STONE, 0, 0.46, 0, 0.03); for (const x of [-0.65, 0.65]) k.b(0.2, 0.42, 0.44, STONE2, x, 0.21, 0, 0.02); k.b(1.6, 0.44, 0.08, STONE, 0, 0.82, -0.22, 0.03);
    for (const x of [-0.82, 0.82]) { k.t(0.16, 0.02, IRON, x, 0.62, 0, PI).rotation.y = PI / 2; k.b(0.03, 0.18, 0.03, IRON, x, 0.55, 0.14); }
    k.b(0.3, 0.2, 0.3, STONE2, -1.0, 0.1, -0.1, 0.02); for (let i = 0; i < 4; i++) k.s(0.08, i % 2 ? HYD : HYD2, -1.0 + (i % 2 - 0.5) * 0.12, 0.26, -0.1 + (((i / 2) | 0) - 0.5) * 0.12);
  }, { tags: ['outdoor', 'chair', 'garden'] });
  def('k19_lovelock', '절벽 끝 사랑의 자물쇠 난간 (하트 자물쇠)', 'misc', 1800, 3.2, 0.3, g => {
    const k = K(g); for (const x of [-1.55, 0, 1.55]) k.b(0.12, 1.05, 0.12, IRON, x, 0.52, 0); for (const y of [0.25, 0.6, 1.0]) k.b(3.2, 0.03, 0.03, IRON, 0, y, 0); for (let i = 0; i < 25; i++) k.b(0.012, 0.75, 0.012, IRON, -1.5 + i * 0.125, 0.62, 0);
    const cols = [0xff5a7a, 0xffd84a, 0x5ab0ff, 0xff9ac8, 0xd8a838, 0x7ae0a8, 0xe84a4a, 0xb88aff];
    for (let i = 0; i < 46; i++) { const x = -1.45 + ((i * 0.618) % 1) * 2.9, y = 0.3 + ((i * 0.414) % 1) * 0.66, c = cols[i % cols.length]; k.b(0.05, 0.055, 0.018, c, x, y, 0.02 + (i % 2) * 0.01, 0.01); k.t(0.016, 0.005, IRON, x, y + 0.04, 0.02, PI); }
    const hs = new THREE.Shape(); hs.moveTo(0, -0.14); hs.bezierCurveTo(-0.18, 0, -0.18, 0.14, -0.08, 0.14); hs.bezierCurveTo(0, 0.14, 0, 0.06, 0, 0.06); hs.bezierCurveTo(0, 0.06, 0, 0.14, 0.08, 0.14); hs.bezierCurveTo(0.18, 0.14, 0.18, 0, 0, -0.14);
    const hm = k.add(mesh(geo('k19heartlock', () => new THREE.ExtrudeGeometry(hs, { depth: 0.04, bevelEnabled: false })), new THREE.MeshPhongMaterial({ color: 0xff4a6a, shininess: 90 }), 0, 1.25, -0.02)); void hm; k.t(0.06, 0.012, gold, 0, 1.44, 0, PI);
  }, { tags: ['outdoor', 'romance'] });
  def('k19_heart_arch', '하트 장미 아치 (노을 포토 스폿)', 'misc', 3000, 2.4, 0.6, g => {
    const k = K(g), pts = [];
    for (let i = 0; i <= 40; i++) { const t = i / 40 * PI * 2; const x = 16 * Math.pow(Math.sin(t), 3), y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); pts.push([x * 0.062, y * 0.062 + 1.55]); }
    for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; const len = Math.hypot(x1 - x0, y1 - y0); const b = k.b(0.04, len + 0.01, 0.04, 0xfbfaf6, (x0 + x1) / 2, (y0 + y1) / 2, 0); b.rotation.z = Math.atan2(x0 - x1, y1 - y0); if (i % 2 === 0) { k.s(0.07, i % 4 ? 0xffd040 : 0xfbf6e0, x0, y0, 0.04); k.s(0.05, LEAF2, x0 + 0.05, y0 - 0.04, 0.02); } }
    for (const s of [-1, 1]) { k.b(0.06, 0.62, 0.06, 0xfbfaf6, s * 0.3, 0.31, 0); k.b(0.3, 0.1, 0.3, STONE, s * 0.3, 0.05, 0, 0.02); for (let i = 0; i < 4; i++) k.s(0.08, 0xffd040, s * 0.3 + (i % 2 - 0.5) * 0.12, 0.12 + i * 0.12, 0.05); }
  }, { tags: ['outdoor', 'romance', 'flower'] });
  def('k19_bridge', '아치 돌다리 (실개천)', 'misc', 3500, 2.4, 3.4, g => {
    const k = K(g), n = 10;
    for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, z0 = -1.7 + t0 * 3.4, z1 = -1.7 + t1 * 3.4, y0 = Math.sin(t0 * PI) * 0.5, y1 = Math.sin(t1 * PI) * 0.5; const len = Math.hypot(z1 - z0, y1 - y0) + 0.02, cz = (z0 + z1) / 2, cy = (y0 + y1) / 2; const d = k.b(2.1, 0.16, len, 0xcfc8b8, 0, cy + 0.12, cz); d.rotation.x = -Math.atan2(y1 - y0, z1 - z0); for (const s of [-1, 1]) { const p2 = k.b(0.16, 0.36, len, STONE, s * 1.0, cy + 0.38, cz, 0.02); p2.rotation.x = d.rotation.x; } }
    for (const s of [-1, 1]) for (const z of [-1.7, 1.7]) { k.b(0.26, 0.7, 0.26, STONE, s * 1.0, 0.35, z, 0.02); k.s(0.1, STONE, s * 1.0, 0.76, z); }
    for (const s of [-1, 1]) { const a = k.t(0.62, 0.12, STONE2, s * 0.9, 0.0, 0, PI); a.rotation.y = PI / 2; a.scale.set(1, 0.6, 1); }
  }, { tags: ['outdoor', 'bridge'] });
  def('k19_rosebush', '노란 장미 덤불', 'misc', 500, 0.9, 0.9, g => { const k = K(g); k.s(0.38, LEAF, 0, 0.3, 0, 1.2, 0.8, 1.1); for (let i = 0; i < 9; i++) { const a = i * 0.7, r = 0.2 + (i % 3) * 0.08; k.s(0.07, i % 3 ? 0xffd040 : 0xfff6d8, Math.cos(a) * r, 0.45 + (i % 2) * 0.12, Math.sin(a) * r); } }, { tags: ['outdoor', 'flower'] });

  const BIRCH = new THREE.MeshLambertMaterial({ map: ctex('k19birch', 32, 128, (c, w, h) => { c.fillStyle = '#f4f2ec'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a2a2a'; for (let i = 0; i < 18; i++) c.fillRect((i * 13) % w, (i * 29) % h, 6 + (i % 3) * 3, 2); }) });
  const YFL = [0xffd030, 0xffe060, 0xfff2a0, 0xf8b820];
  def('k19_pergola', '노란 꽃 퍼걸러 (꽃 터널 · 구슬 등불)', 'misc', 4000, 2.8, 2.8, g => {
    const k = K(g), H = 2.7, WD = 0xf0ece4;
    for (const [x, z] of [[-1.2, -1.25], [1.2, -1.25], [-1.2, 1.25], [1.2, 1.25]]) { k.b(0.18, H, 0.18, WD, x, H / 2, z, 0.02); k.b(0.26, 0.12, 0.26, 0xd8d2c4, x, 0.06, z, 0.02); for (let i = 0; i < 6; i++) k.s(0.07, i % 2 ? LEAF2 : YFL[i % 4], x + Math.cos(i * 1.7) * 0.12, 0.5 + i * 0.35, z + Math.sin(i * 1.7) * 0.12); }
    for (const z of [-1.25, 1.25]) k.b(2.9, 0.14, 0.16, WD, 0, H, z, 0.02); for (let i = 0; i < 6; i++) k.b(0.1, 0.1, 3.0, WD, -1.25 + i * 0.5, H + 0.12, 0, 0.02);
    for (let i = 0; i < 46; i++) { const x = -1.35 + ((i * 0.618) % 1) * 2.7, z = -1.4 + ((i * 0.414) % 1) * 2.8; k.s(0.16 + (i % 3) * 0.04, i % 4 === 0 ? LEAF : HYD, x, H + 0.2 + (i % 3) * 0.06, z, 1.2, 0.55, 1.2); }
    for (let i = 0; i < 18; i++) { const x = -1.3 + ((i * 0.618) % 1) * 2.6, z = (i % 2 ? -1 : 1) * (1.0 + ((i * 0.37) % 1) * 0.35), len = 0.4 + (i % 4) * 0.18; for (let j = 0; j < 5; j++) k.s(0.05 - j * 0.006, YFL[(i + j) % 4], x, H - 0.05 - j * len / 5, z, 1, 1.2, 1); }
    for (const [x, z] of [[-0.6, -0.6], [0.6, 0.6], [-0.6, 0.6], [0.6, -0.6]]) { k.c(0.004, 0.004, 0.4, 0x8a8a8a, x, H - 0.2, z); const gl = k.s(0.09, glow(0xfff0d0), x, H - 0.45, z); gl.userData.nightGlow = true; const h = halo(k, 0.45, 0xffe0a0, x, H - 0.45, z, 0.7); h.userData.nightOnly = true; }
  }, { tags: ['outdoor', 'garden', 'flower'] });
  def('k19_festoon', '자작나무 기둥 꼬마전구 줄', 'misc', 800, 3.2, 0.3, g => {
    const k = K(g), H = 2.5; for (const x of [-1.5, 1.5]) { k.c(0.06, 0.07, H, BIRCH, x, H / 2, 0, 10); k.c(0.12, 0.12, 0.1, 0xd8d2c4, x, 0.05, 0); }
    for (let i = 0; i <= 12; i++) { const t = i / 12, x = -1.5 + t * 3, y = H - 0.05 - Math.sin(t * PI) * 0.35; if (i < 12) { const nx = -1.5 + (i + 1) / 12 * 3, ny = H - 0.05 - Math.sin((i + 1) / 12 * PI) * 0.35; const w = k.b(Math.hypot(nx - x, ny - y), 0.008, 0.008, 0x2a2a2a, (x + nx) / 2, (y + ny) / 2, 0); w.rotation.z = Math.atan2(ny - y, nx - x); } if (i > 0 && i < 12) { const b = k.s(0.05, glow(0xfff2c8), x, y - 0.08, 0); b.userData.nightGlow = true; const h = halo(k, 0.25, 0xffd890, x, y - 0.08, 0, 0.8); h.userData.nightOnly = true; } }
  }, { tags: ['outdoor', 'lamp'] });
  def('k19_planter', '흰 화분 상자 (작은 나무 · 아이비)', 'misc', 1200, 1.8, 0.9, g => {
    const k = K(g); k.b(1.7, 0.6, 0.8, 0xf4f2ec, 0, 0.3, 0, 0.03); k.b(1.76, 0.06, 0.86, 0xe8e4dc, 0, 0.62, 0, 0.02); k.b(1.6, 0.04, 0.7, 0x4a3a2a, 0, 0.6, 0);
    k.c(0.04, 0.06, 1.6, 0x8a7a5a, -0.3, 1.4, 0, 8); for (const [x, y, z, r] of [[-0.3, 2.3, 0, 0.42], [-0.05, 2.0, 0.1, 0.32], [-0.55, 2.05, -0.1, 0.3], [-0.3, 2.6, 0.05, 0.28]]) k.s(r, LEAF2, x, y, z, 1, 1.1, 1);
    for (let i = 0; i < 14; i++) { const x = -0.8 + (i % 7) * 0.26, z = i < 7 ? 0.36 : -0.36; for (let j = 0; j < 3; j++) k.s(0.07, j % 2 ? LEAF : 0x5a8a3a, x, 0.62 - j * 0.14, z + (z > 0 ? 0.06 : -0.06), 1.2, 0.8, 0.6); }
    for (let i = 0; i < 6; i++) k.s(0.07, YFL[i % 4], 0.35 + (i % 3) * 0.18, 0.7, -0.15 + ((i / 3) | 0) * 0.3);
  }, { tags: ['outdoor', 'plant', 'garden'] });
  def('k19_topiary', '원뿔 토피어리 (돌 화분)', 'misc', 700, 0.7, 0.7, g => { const k = K(g); k.c(0.24, 0.2, 0.36, STONE, 0, 0.18, 0, 12); for (let i = 0; i < 4; i++) k.cone(0.34 - i * 0.07, 0.6, LEAF, 0, 0.62 + i * 0.32, 0, 12); k.s(0.05, 0xffd040, 0, 1.75, 0); }, { tags: ['outdoor', 'plant'] });
  def('k19_topiary_spiral', '나선 토피어리 (돌 화분)', 'misc', 800, 0.7, 0.7, g => { const k = K(g); k.c(0.24, 0.2, 0.36, STONE, 0, 0.18, 0, 12); for (let i = 0; i < 20; i++) { const t = i / 20, a = t * PI * 6, r = 0.3 * (1 - t) + 0.06; k.s(0.13 * (1 - t * 0.6), LEAF2, Math.cos(a) * r * 0.5, 0.45 + t * 1.4, Math.sin(a) * r * 0.5); } }, { tags: ['outdoor', 'plant'] });
  def('k19_park_bench', '원목 공원 벤치 (주철 다리 · 노란 꽃 쿠션)', 'misc', 1100, 1.8, 0.7, g => {
    const k = K(g), W = T.woodgrain(0xb07a48); for (let i = 0; i < 4; i++) k.b(1.6, 0.04, 0.1, W, 0, 0.45, -0.15 + i * 0.11, 0.01); for (let i = 0; i < 3; i++) { const b = k.b(1.6, 0.1, 0.03, W, 0, 0.62 + i * 0.13, -0.25, 0.01); b.rotation.x = -0.15; }
    for (const x of [-0.72, 0.72]) { k.b(0.05, 0.45, 0.5, IRON, x, 0.22, 0, 0.01); k.b(0.05, 0.5, 0.05, IRON, x, 0.7, -0.25); k.t(0.12, 0.02, IRON, x, 0.58, 0.05, PI).rotation.y = PI / 2; }
    k.b(0.36, 0.1, 0.36, lam(0xffd860), -0.4, 0.52, 0.0, 0.04); P.mug && P.mug(k, 0.45, 0.47, 0.05, 0xf8e070);
  }, { tags: ['outdoor', 'chair', 'garden'] });
  const lam = (c) => new THREE.MeshLambertMaterial({ color: c });
  const roseTile = () => { const t = ctex('k19rosetile', 128, 128, (c, w, h) => { for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const x = i * 64, y = j * 64; c.fillStyle = (i + j) % 2 ? '#fbf2dc' : '#f8ead0'; c.fillRect(x, y, 64, 64); c.strokeStyle = 'rgba(200,170,110,0.6)'; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, 62, 62); c.strokeStyle = 'rgba(230,170,40,0.7)'; c.lineWidth = 2.5; for (let r = 6; r < 24; r += 5) { c.beginPath(); c.arc(x + 32, y + 32, r, r * 0.3, r * 0.3 + 5); c.stroke(); } c.fillStyle = 'rgba(120,150,70,0.6)'; c.beginPath(); c.ellipse(x + 50, y + 50, 8, 3, -0.6, 0, 7); c.fill(); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  // ---------------------------------------------------------
  // 정원 조립 (world3d 가 부름)
  // ---------------------------------------------------------
  const cobble = () => { const t = ctex('k19cobble', 128, 128, (c, w, h) => { c.fillStyle = '#8a8e96'; c.fillRect(0, 0, w, h); for (let i = 0; i < 70; i++) { const x = (i * 37) % w, y = (i * 53 + (i % 3) * 11) % h, r = 7 + (i % 4) * 2; c.fillStyle = `rgb(${150 + (i % 5) * 10},${156 + (i % 7) * 8},${168 + (i % 3) * 8})`; c.beginPath(); c.ellipse(x, y, r, r * 0.8, i, 0, 7); c.fill(); c.strokeStyle = 'rgba(60,64,72,0.5)'; c.stroke(); } c.fillStyle = 'rgba(250,200,40,0.8)'; for (let i = 0; i < 10; i++) { c.beginPath(); c.arc((i * 71) % w, (i * 29) % h, 2.5, 0, 7); c.fill(); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const bord = () => { const t = ctex('k19bord', 64, 64, (c, w, h) => { c.fillStyle = '#6a6e78'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(250,200,40,0.9)'; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc((i * 23) % w, 8 + (i * 17) % (h - 16), 3, 0, 7); c.fill(); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  function conformRect(Tt, x0, x1, z0, z1, off, m) {
    const W = x1 - x0, D = z1 - z0, g2 = new THREE.PlaneGeometry(W, D, Math.max(1, Math.ceil(W)), Math.max(1, Math.ceil(D))); g2.rotateX(-PI / 2);
    const p = g2.attributes.position, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; for (let i = 0; i < p.count; i++) { const x = p.getX(i) + cx, z = p.getZ(i) + cz; p.setXYZ(i, x, Tt.height(x, z) + off, z); } g2.computeVertexNormals();
    const o = new THREE.Mesh(g2, m); o.receiveShadow = true; return o;
  }
  function conformDisc(Tt, x, z, r, off, m) {
    const g2 = new THREE.CircleGeometry(r, 40, 0, PI * 2); g2.rotateX(-PI / 2); const p = g2.attributes.position;
    for (let i = 0; i < p.count; i++) { const vx = p.getX(i) + x, vz = p.getZ(i) + z; p.setXYZ(i, vx, Tt.height(vx, vz) + off, vz); } g2.computeVertexNormals(); const o = new THREE.Mesh(g2, m); o.receiveShadow = true; return o;
  }
  const L = [];
  const add = (id, x, z, r = 0) => L.push([id, x, z, r]);
  (() => {
    add('k19_gazebo', CX, CZ, 0);
    // 서쪽 절벽 끝: 하트 아치 · 사랑의 자물쇠 · 노을 벤치
    add('k19_heart_arch', -80.8, CZ, 90); add('k19_lovelock', -81.4, CZ - 3.3, 90); add('k19_lovelock', -81.4, CZ + 3.3, 90);
    add('k19_bench', -79.9, -89.6, -90); add('k19_bench', -79.9, -94.4, -90); add('k19_rosebush', -80.9, -87.4); add('k19_rosebush', -80.9, -96.6);
    // 산책로 가로등 · 바닥 랜턴
    add('k19_lamp', -80.9, -88.4); add('k19_lamp', -80.9, -95.6); add('k19_lamp', -79.8, -98.6); add('k19_lamp', -64.8, -98.6); add('k19_lamp', -79.8, -85.2); add('k19_lamp', -62.8, -85.2);
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + PI / 8; add('k19_glantern', CX + Math.sin(a) * 3.7, CZ + Math.cos(a) * 3.7); }
    // 🌼 노란 꽃 퍼걸러 (사진처럼 길 위를 덮는 꽃 터널) · 자작나무 꼬마전구 줄
    add('k19_pergola', -66.8, CZ, 0); add('k19_pergola', CX, -83.0, 90); add('k19_pergola', CX, -102.2, 90);
    for (const [x, z, r] of [[-69.75, CZ - 1.6, 0], [-69.75, CZ + 1.6, 0], [-63.45, CZ - 1.6, 0], [-63.45, CZ + 1.6, 0], [CX - 1.6, -86.4, 90], [CX + 1.6, -86.4, 90], [CX - 1.6, -96.9, 90], [CX + 1.6, -96.9, 90]]) add('k19_festoon', x, z, r);
    // 장미 타일 광장 양옆 흰 화분 (작은 나무 · 아이비) · 토피어리
    add('k19_planter', -68.9, -89.3, 0); add('k19_planter', -68.9, -94.7, 0); add('k19_planter', -76.3, -82.2, 90); add('k19_planter', -71.7, -82.2, 90);
    for (const [x, z, k] of [[-77.2, -88.8, 0], [-70.8, -88.8, 1], [-77.2, -95.2, 1], [-70.8, -95.2, 0], [-62.6, -89.6, 0], [-62.6, -94.4, 0]]) add(k ? 'k19_topiary_spiral' : 'k19_topiary', x, z);
    // 공원 벤치 (길을 바라봄)
    for (const [x, z, r] of BENCHES) add('k19_park_bench', x, z, r);
    // 돌 항아리 줄 (사진처럼 앞줄) + 사이사이 노란 꽃
    for (const x of [-80.2, -77.9, -70.1, -67.8, -65.5, -63.2]) { add('k19_urn', x, -86.6); }
    for (const x of [-79.05, -76.75, -71.25, -68.95, -66.65, -64.35]) add('k19_hydrangea', x, -86.4);
    // 사분면 화단: 노란 꽃 덤불 · 수선화 (다른 소품 자리는 비움)
    const beds = [[-79.5, -76.4, -90.5, -87.8], [-71.6, -64, -90.5, -87.8], [-79.5, -76.4, -97.4, -93.6], [-71.6, -64, -97.4, -93.6], [-79.5, -76.4, -103.4, -100.6], [-71.6, -64, -103.4, -100.6], [-79.5, -76.4, -85.4, -81.2], [-71.6, -63, -85.4, -81.2]];
    const busy = L.filter(o => !/hydrangea|hyacinth|urn/.test(o[0])).map(o => [o[1], o[2], /pergola|park_bench|planter|fountain|tree/.test(o[0]) ? 1.6 : 0.9]);
    let n = 0;
    for (const [bx0, bx1, bz0, bz1] of beds) for (let x = bx0 + 0.5; x < bx1; x += 1.25) for (let z = bz0 + 0.5; z < bz1; z += 1.2) { n++; const jx = ((n * 0.37) % 1 - 0.5) * 0.4, jz = ((n * 0.61) % 1 - 0.5) * 0.4; if (Math.hypot(x - CX, z - CZ) < 4.2 || busy.some(([bx, bz, r]) => Math.hypot(x + jx - bx, z + jz - bz) < r)) continue; add(n % 3 === 0 ? 'k19_hyacinth' : n % 5 === 0 ? 'k19_rosebush' : 'k19_hydrangea', x + jx, z + jz, (n * 47) % 360); }
    // 정원수 · 분수 · 울타리
    for (const [x, z] of [[-80.4, -82.2], [-66.2, -82.4], [-80.5, -102.6], [-63.2, -102.4], [-63.0, -95.6], [-78.2, -98.2]]) add('k19_tree', x, z);
    add('k19_fountain', -68.2, -83.2);
    for (let x = X0 + 2; x < X1 - 1; x += 2.05) { if (Math.abs(x - CX) < 1.8) continue; add('k19_fence', x, Z0 + 0.3, 0); }
    for (let x = X0 + 2; x < X1 - 1; x += 2.05) { if (Math.abs(x - CX) < 1.8) continue; add('k19_fence', x, Z1 - 0.3, 0); }
    add('k19_bridge', CX, -99, 0);
  })();
  const WAVE = new THREE.MeshPhongMaterial({ color: 0x5aa8d8, shininess: 120, specular: 0xffffff, transparent: true, opacity: 0.85, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 });
  let SCENE = null, T0 = null;
  FM.SunsetGarden = (scene, Tt, PM) => {
    SCENE = scene; T0 = Tt;
    const root = new THREE.Group(); root.name = 'sunsetGarden';
    const po = { polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 };
    const cb = cobble(); cb.repeat.set(1, 1);
    const cm2 = (rx, rz) => { const t = cb.clone(); t.needsUpdate = true; t.repeat.set(rx, rz); return new THREE.MeshLambertMaterial(Object.assign({ map: t }, po)); };
    root.add(conformRect(Tt, X0 + 0.6, X1, CZ - 1.1, CZ + 1.1, 0.05, cm2(18, 2)));
    root.add(conformRect(Tt, CX - 1.1, CX + 1.1, Z0, -99.8, 0.05, cm2(2, 4))); root.add(conformRect(Tt, CX - 1.1, CX + 1.1, -98.2, Z1, 0.05, cm2(2, 17)));
    root.add(conformDisc(Tt, CX, CZ, 3.5, 0.055, cm2(5, 5)));
    const rt = roseTile(); rt.repeat.set(2, 2); root.add(conformRect(Tt, -70.6, -67.0, CZ - 1.6, CZ + 1.6, 0.065, new THREE.MeshLambertMaterial({ map: rt, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 })));
    const bm = bord(); bm.repeat.set(10, 1);
    for (const s of [-1, 1]) root.add(conformRect(Tt, X0 + 0.6, X1, CZ + s * 1.1 - 0.14, CZ + s * 1.1 + 0.14, 0.06, new THREE.MeshLambertMaterial(Object.assign({ map: bm }, po))));
    // 실개천
    root.add(conformRect(Tt, X0 + 1.2, X1 - 3.6, -99.6, -98.4, 0.07, WAVE));
    for (const z of [-99.7, -98.3]) root.add(conformRect(Tt, X0 + 1.2, X1 - 3.6, z - 0.12, z + 0.12, 0.12, new THREE.MeshLambertMaterial({ color: STONE2 })));
    const props = new THREE.Group();
    for (const [id, x, z, r] of L) { const F = FM.FURN[id]; if (!F) continue; const g = new THREE.Group(); F.build(g); g.position.set(x, Tt.height(x, z) + 0.04, z); g.rotation.y = r * PI / 180; g.traverse(o => { if (o.isMesh) { o.castShadow = !o.material.transparent && !o.userData.noBake && !o.userData.nightOnly; o.receiveShadow = true; } }); props.add(g); }
    const nightOnly = [], nightGlow = []; props.traverse(o => { if (o.userData.nightOnly || (o.isMesh && o.material && o.material.blending === THREE.AdditiveBlending)) nightOnly.push(o); if (o.userData.nightGlow) nightGlow.push(o); });
    root.add(props); if (PM && PM.bake) PM.bake(props);
    // 흩날리는 푸른 꽃잎 (낮) · 반딧불 (밤)
    const n = 120, pos = new Float32Array(n * 3), base = [];
    for (let i = 0; i < n; i++) { const x = X0 + ((i * 0.618) % 1) * (X1 - X0), z = Z0 + ((i * 0.414 + 0.2) % 1) * (Z1 - Z0), y = Tt.height(x, z) + 0.4 + ((i * 0.732) % 1) * 3; base.push([x, y, z, i * 1.7]); pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const tex = ctex('k19petal', 32, 32, (c, w, h) => { const gr = c.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
    const pm = new THREE.PointsMaterial({ map: tex, size: 0.25, color: 0xffe070, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending });
    const pts = new THREE.Points(pg, pm); pts.userData.keep = true; pts.frustumCulled = false;
    pts.onBeforeRender = () => {
      const t = performance.now() / 1000, nt = (FM.W && FM.W.nightness) || 0, a = pg.attributes.position;
      for (let i = 0; i < n; i++) { const b = base[i]; a.array[i * 3] = b[0] + Math.sin(t * 0.4 + b[3]) * 0.8; a.array[i * 3 + 1] = b[1] + Math.sin(t * 0.7 + b[3]) * 0.35; a.array[i * 3 + 2] = b[2] + Math.cos(t * 0.3 + b[3]) * 0.8; }
      a.needsUpdate = true;
      pm.color.setHex(nt > 0.3 ? 0xfff27a : 0xffe680); pm.size = nt > 0.3 ? 0.3 + Math.sin(t * 3) * 0.06 : 0.2; pm.opacity = nt > 0.3 ? 0.55 + Math.sin(t * 2.2) * 0.3 : 0.55;
      const on = nt > 0.25; for (const o of nightOnly) o.visible = on;
    };
    root.add(pts); scene.add(root);
    return root;
  };

  // 🏮 소원 등불 (섬 위로 떠오르는 등불)
  const flights = [];
  function lanterns(count = 10, at) {
    if (!SCENE || !T0) return;
    const c = at || { x: CX, z: CZ }, n = count, pos = new Float32Array(n * 3), seed = [];
    for (let i = 0; i < n; i++) { const x = c.x + (Math.random() - 0.5) * 6, z = c.z + (Math.random() - 0.5) * 6; seed.push([x, T0.height(x, z) + 1.0, z, Math.random() * 6, 0.35 + Math.random() * 0.3]); }
    const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const tx = ctex('k19lantern', 32, 32, (cc, w, h) => { const gr = cc.createRadialGradient(16, 18, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,250,210,1)'); gr.addColorStop(0.35, 'rgba(255,190,90,0.95)'); gr.addColorStop(1, 'rgba(255,140,40,0)'); cc.fillStyle = gr; cc.fillRect(0, 0, w, h); });
    const m = new THREE.PointsMaterial({ map: tx, size: 0.9, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const p = new THREE.Points(g2, m); p.frustumCulled = false; p.userData.keep = true; const t0 = performance.now() / 1000;
    p.onBeforeRender = () => { const t = performance.now() / 1000 - t0, a = g2.attributes.position; for (let i = 0; i < n; i++) { const s = seed[i]; a.array[i * 3] = s[0] + Math.sin(t * 0.5 + s[3]) * 0.6 + t * 0.12; a.array[i * 3 + 1] = s[1] + t * s[4]; a.array[i * 3 + 2] = s[2] + Math.cos(t * 0.4 + s[3]) * 0.6; } a.needsUpdate = true; m.opacity = t < 2 ? t / 2 : Math.max(0, 1 - (t - 26) / 8); m.size = 0.9 + Math.sin(t * 4) * 0.08; if (t > 34) { SCENE.remove(p); g2.dispose(); m.dispose(); const k = flights.indexOf(p); if (k >= 0) flights.splice(k, 1); } };
    SCENE.add(p); flights.push(p);
  }
  FM.SunsetGarden.lanterns = lanterns;
  FM.SunsetGarden.RECT = FM.SUNSET_RECT;
})();

// =========================================================
// 노을 정원 이벤트 (드라마 · 실시간 장면 · 플레이어 행동)
// =========================================================
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, Cut = FM.Cut, W = FM.Will;
  if (!Sim || !Soc) return;
  const P = 'P', S = () => Sim.get();
  const day = () => Sim.time.day(), hour = () => Sim.time.hour();
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const sty = (v, t) => (v && v.id !== P && W && W.sty ? W.sty(v, FM.josa ? FM.josa(t) : t) : (FM.josa ? FM.josa(t) : t));
  const adults = () => S().villagers.filter(v => !v.child && !v.staff && !v.visitor);
  const free = v => v && !v.sceneId && !v.talkingToPlayer && !(v.status && v.status.hospital) && v.loc !== 'metro' && !(Sim.asleep && Sim.asleep(v, hour()));
  const keyOf = cast => Object.values(cast).map(v => v.id).sort().join('|');
  const VENUE = { loc: 'island', x: -77.6, z: -92, place: 'cliff' };
  const mk = (theme, cast, beats, o = {}) => Object.assign({ theme, cast, beats, key: keyOf(cast) + '|sg' + (o.sub || ''), vig: true, venue: VENUE }, o);
  const fp = (a, b) => Soc.rel(a.id, b.id).friendship_point || 0;
  const G = FM.SGEv = {};
  const cap = (k, n = 1) => { const st = S(); if (!st.sgEv || st.sgEv.day !== day()) st.sgEv = { day: day(), n: {} }; const c = st.sgEv.n[k] || 0; if (c >= n) return false; st.sgEv.n[k] = c + 1; return true; };
  const log = (t, ids, imp = 2) => Sim.log('rel', t, ids, imp, { newsKind: 'drama' });

  // 🌅 가제보 노을 데이트
  function date(A, B) {
    const beats = [
      { narr: '(하늘이 주황빛에서 보랏빛으로 물드는 시간... 가제보 아래 두 사람이 나란히 앉았다)', who: '해설', icon: '🌅', shot: ['wide'] },
      { say: 'A', text: sty(A, pick(['여기서 보는 노을이 섬에서 제일 예쁜 것 같아.', '매일 이 시간에 너랑 여기 오고 싶어.', '수국 향기 좋다... 너처럼.'])), shot: 'two' },
      { emo: 'B', e: '😳' }, { say: 'B', text: sty(B, pick(['...나는 노을보다 네 옆얼굴을 보고 있었는데.', '그럼 내일도, 모레도 같이 오자.', '이런 순간이 영원했으면 좋겠다.'])), shot: 'close' },
      { poses: [['A', 'cute'], ['B', 'cute']], t: 1200 }, { fx: 'hearts', at: 'B' },
      { split: ['A', 'B'], caps: ['💗 두근', '💗 두근'], t: 1800 },
      { outcome: 'happy', endText: ['🌅 가제보 노을 데이트', `${A.name} ♥ ${B.name}, 오늘도 한 뼘 더 가까워졌다`] },
    ];
    const c = mk('confess', { A, B }, beats, { sub: '가제보 노을 데이트' });
    c.resolve = () => { Soc.addRomance(A.id, B.id, 8); Soc.addRomance(B.id, A.id, 8); const r = Soc.rel(A.id, B.id); if (r.boredom) r.boredom = Math.max(0, r.boredom - 15); for (const v of [A, B]) v.depression = clamp((v.depression || 0) - 8, 0, 100); log(`🌅 ${A.name}와(과) ${B.name}이(가) 노을 정원 가제보에서 노을 데이트를 했어요`, [A.id, B.id]); };
    return c;
  }
  // 🔒 사랑의 자물쇠
  function lock(A, B) {
    const beats = [
      { narr: '(절벽 끝 난간, 수백 개의 자물쇠가 노을빛에 반짝인다)', who: '해설', icon: '🔒', shot: ['wide'] },
      { say: 'A', text: sty(A, `${B.name}, 우리 이름 새겨 왔어. 같이 걸자!`) }, { emo: 'B', e: '🥹' },
      { poses: [['A', 'reach'], ['B', 'reach']], t: 1400 }, { fx: 'sparkle', at: 'A' },
      { say: 'B', text: sty(B, '열쇠는... 저 바다에 던지자. 절대 못 풀게!'), hot: true }, { poses: [['B', 'throw']], t: 900 },
      { say: 'A', text: sty(A, '평생 잠겨 있을 거야. 우리 마음도!') }, { fx: 'hearts', at: 'A' },
      { outcome: 'happy', endText: ['🔒 사랑의 자물쇠', `${A.name} ♥ ${B.name}의 자물쇠가 노을 정원에 걸렸다`] },
    ];
    const c = mk('confess', { A, B }, beats, { sub: '사랑의 자물쇠' });
    c.resolve = () => { Soc.addRomance(A.id, B.id, 10); Soc.addRomance(B.id, A.id, 10); const st = S(); (st.loveLocks = st.loveLocks || []).push({ a: A.id, b: B.id, day: day() }); log(`🔒 ${A.name}와(과) ${B.name}이(가) 노을 정원 난간에 사랑의 자물쇠를 걸었어요`, [A.id, B.id]); };
    return c;
  }
  // 🏮 소원 등불 날리기
  function lanternNight(A, others) {
    const ks = ['B', 'C', 'D'].slice(0, others.length); const cast = Object.assign({ A }, Object.fromEntries(ks.map((k, i) => [k, others[i]])));
    const wishes = ['우리 우정 영원하게 해 주세요!', '내년에도 다 같이 여기 오게 해 주세요', '좋아하는 사람이랑 잘 되게 해 주세요...', '아픈 친구가 빨리 낫게 해 주세요', '부자 되게 해 주세요!! 🤑', '섬 사람들 모두 행복하게 해 주세요'];
    const beats = [
      { narr: '(별이 뜬 노을 정원... 친구들이 종이 등불에 소원을 적었다)', who: '해설', icon: '🏮', shot: ['wide'] },
      ...['A'].concat(ks).map(k => ({ say: k, text: sty(cast[k], pick(wishes)) })),
      { say: 'A', text: sty(A, '하나, 둘, 셋... 날리자!'), hot: true }, { poses: ['A'].concat(ks).map(k => [k, 'lookUp']), t: 1600 }, { fx: 'sparkle', at: 'A' },
      { narr: '(주황빛 등불들이 천천히 밤하늘로 떠올랐다)', who: '해설', icon: '✨' },
      { outcome: 'happy', endText: ['🏮 소원 등불 날리기', '우리의 소원이 하늘에 닿기를'] },
    ];
    const c = mk('friend', cast, beats, { sub: '소원 등불 날리기' });
    c.resolve = () => { const all = [A].concat(others); for (const a of all) { a.depression = clamp((a.depression || 0) - 8, 0, 100); for (const b of all) if (a !== b) Soc.addFriend(a.id, b.id, 4, 3, '소원 등불'); } FM.SunsetGarden && FM.SunsetGarden.lanterns(14); log(`🏮 ${all.map(v => v.name).join(', ')}이(가) 노을 정원에서 소원 등불을 날렸어요`, all.map(v => v.id)); };
    return c;
  }
  // 🤗 노을 아래 위로
  function comfort(A, B) {
    const beats = [
      { narr: `(노을 벤치에 ${A.name}이(가) 혼자 앉아 있다... 어깨가 작아 보인다)`, who: '해설', icon: '🌇', shot: ['wide'] },
      { say: 'A', text: sty(A, pick(['...요즘 다 내 맘대로 안 돼.', '나 같은 건 없어도 아무도 모를 거야...', '노을이 예뻐서 더 슬프네.'])) }, { pose: 'A', p: 'sadSit', t: 1200 },
      { say: 'B', text: sty(B, `${A.name}! 여기 있었구나. 한참 찾았잖아.`) }, { emo: 'A', e: '😢' },
      { say: 'B', text: sty(B, pick(['넌 혼자가 아니야. 내가 옆에 있을게.', '울어도 돼. 노을이 다 가려 줄 거야.', '힘들 땐 기대. 친구 좋다는 게 뭐야.'])), shot: 'close' },
      { poses: [['A', 'hug'], ['B', 'hug']], t: 1800 }, { fx: 'sparkle', at: 'A' },
      { say: 'A', text: sty(A, '...고마워. 진짜로.') },
      { outcome: 'happy', endText: ['🤗 노을 아래 위로', `${B.name}의 한마디에 ${A.name}의 마음이 조금 녹았다`] },
    ];
    const c = mk('friend', { A, B }, beats, { sub: '노을 아래 위로' });
    c.resolve = () => { A.depression = clamp((A.depression || 0) - 18, 0, 100); A.stress = clamp((A.stress || 0) - 10, 0, 100); Soc.addFriend(A.id, B.id, 8, 10, '위로'); Soc.addFriend(B.id, A.id, 5, 5, '위로'); if (W && W.remember) W.remember(A, 'kind', `${B.name}이(가) 노을 정원에서 위로해 줬어`, { about: B.id }); log(`🤗 ${B.name}이(가) 노을 정원에서 울적해하던 ${A.name}을(를) 위로해 줬어요`, [A.id, B.id], 1); };
    return c;
  }
  // 🎻 가제보 음악회 (실시간 장면)
  function concert(A) {
    const aud = adults().filter(o => o !== A && free(o) && o.loc === 'island' && Math.hypot(o.x + 74, o.z + 92) < 60).slice(0, 3);
    const actors = { A }; aud.forEach((v, i) => { actors['B' + i] = v; });
    const inst = pick([['guitar', 'guitar'], ['sax', 'sax'], ['sing', 'mic']]);
    const steps = [{ go: 'A', to: { place: 'cliff', spot: 'gazebo' }, max: 90 }, { tp: 'A', loc: 'island', x: -74, z: -92.9 }, { face: 'A', at: 'B0' },
      ...aud.map((v, i) => ({ go: 'B' + i, to: { x: -74 + (i - 1) * 1.3, z: -88.6, loc: 'island' }, max: 90 })),
      { say: 'A', text: sty(A, '노을 정원 작은 음악회에 오신 걸 환영해요 🎶'), t: 3 },
      { pose: 'A', p: inst[0], prop: inst[1], t: 6 }, { emote: 'A', e: '🎶' },
      ...aud.map((_, i) => ({ par: [{ pose: 'B' + i, p: 'clap', t: 0.1 }, { emote: 'B' + i, e: pick(['👏', '😍', '🎶']) }] })),
      { wait: 4 }, { say: 'B0', text: '브라보~!! 앵콜!', t: 2.4 }, { pose: 'A', p: 'bow', prop: null, t: 1.5 }];
    const sc = Sim.scene({ title: '🎻 가제보 음악회', actors, steps, onEnd: () => { A.reputation = clamp((A.reputation || 50) + 3, 0, 100); A.depression = clamp((A.depression || 0) - 6, 0, 100); for (const v of aud) { Soc.addFriend(v.id, A.id, 3, 2, '음악회'); v.depression = clamp((v.depression || 0) - 4, 0, 100); } log(`🎻 ${A.name}이(가) 노을 정원 가제보에서 작은 음악회를 열었어요`, [A.id].concat(aud.map(v => v.id)), 1); } });
    return !!sc;
  }
  G.make = { date, lock, lanternNight, comfort, concert };
  const partnerOf = id => (Soc.partnerOf ? Soc.partnerOf(id) : null);
  function roll(h) {
    const vs = adults().filter(free); if (!vs.length || !Cut) return;
    const opts = [];
    const couples = vs.filter(v => { const p = partnerOf(v.id); return p && p !== P && vs.some(o => o.id === p) && v.id < p; });
    if (couples.length && h >= 17 && h <= 20) opts.push(['date', 3]);
    if (couples.length && h >= 16 && h <= 21) opts.push(['lock', 1.5]);
    if (h >= 19 && h <= 22 && vs.length >= 3) opts.push(['lantern', 2]);
    if (h >= 16 && h <= 20 && vs.some(v => Sim.canPerform && Sim.canPerform(v))) opts.push(['concert', 2]);
    if (vs.some(v => (v.depression || 0) > 45)) opts.push(['comfort', 3]);
    if (vs.some(v => v.crush && v.crush.target && v.crush.target !== P && (v.crush.intensity || 0) >= 55) && h >= 17 && h <= 20) opts.push(['confess', 1.5]);
    if (!opts.length) return;
    let t = opts.reduce((s, o) => s + o[1], 0) * Math.random(), k = opts[0][0]; for (const [id, w] of opts) { t -= w; if (t <= 0) { k = id; break; } }
    if (!cap(k)) return;
    try {
      if (k === 'date' || k === 'lock') { const a = pick(couples), b = Sim.byId(partnerOf(a.id)); if (b) Cut.enqueue(k === 'date' ? date(a, b) : lock(a, b)); }
      else if (k === 'lantern') { const a = pick(vs); const fr = vs.filter(o => o !== a && fp(a, o) >= 30).slice(0, 3); if (fr.length >= 2) Cut.enqueue(lanternNight(a, fr)); }
      else if (k === 'concert') { concert(pick(vs.filter(v => Sim.canPerform(v)))); }
      else if (k === 'comfort') { const a = vs.filter(v => (v.depression || 0) > 45).sort((x, y) => y.depression - x.depression)[0]; const b = vs.filter(o => o !== a && fp(o, a) >= 35).sort((x, y) => fp(y, a) - fp(x, a))[0]; if (a && b) Cut.enqueue(comfort(a, b)); }
      else if (k === 'confess') { const a = pick(vs.filter(v => v.crush && v.crush.target && v.crush.target !== P && (v.crush.intensity || 0) >= 55)); const b = a && Sim.byId(a.crush.target); if (a && b && free(b) && Soc.runConfession) Soc.runConfession(a, b, 'sunset_cliff'); }
    } catch (e) { console.error('sunset event', e); }
  }
  G.roll = roll;
  FM.bus.on('hour', h => { if (h >= 16 && h <= 22 && chance(0.45)) roll(h); });
  // 디버그 · 테스트용
  G.trigger = kind => { const vs = adults().filter(free); const [a, b, c, d] = vs; if (kind === 'date') return Cut.enqueue(date(a, b), true); if (kind === 'lock') return Cut.enqueue(lock(a, b), true); if (kind === 'lantern') return Cut.enqueue(lanternNight(a, [b, c, d].filter(Boolean)), true); if (kind === 'comfort') return Cut.enqueue(comfort(a, b), true); if (kind === 'concert') return concert(a); };

  // 플레이어: 노을 정원에서 할 수 있는 일
  if (FM.Play && FM.Play.options) {
    const oOpt = FM.Play.options;
    FM.Play.options = function (add) {
      const r = oOpt.apply(this, arguments);
      try {
        const st = S(), p = st.player; if (p.loc !== 'island' || Math.hypot(p.x + 74, p.z + 92) > 12) return r;
        const pt = partnerOf(P), mate = pt && Sim.byId(pt);
        add(2.2, '🔒 사랑의 자물쇠 걸기', () => {
          if (mate && mate.loc === 'island' && Math.hypot(mate.x - p.x, mate.z - p.z) < 10) { Soc.addRomance(mate.id, P, 12); (st.loveLocks = st.loveLocks || []).push({ a: P, b: mate.id, day: day() }); Sim.emote(mate, '💞', 3); Sim.say(mate, sty(mate, '우리 자물쇠... 평생 풀지 말자 💗'), 3); FM.UI.toast(`🔒 ${mate.name}와(과) 사랑의 자물쇠를 걸었어요! 애정 +12`); }
          else { (st.loveLocks = st.loveLocks || []).push({ a: P, day: day() }); FM.UI.toast('🔒 언젠가 만날 인연을 위해 빈 자물쇠를 걸었어요... ✨'); }
          FM.Audio && FM.Audio.sfx('chime');
        });
        add(2.3, '🏮 소원 등불 날리기 (30🪙)', () => {
          if (p.coins < 30) return FM.UI.toast('코인이 부족해요');
          p.coins -= 30; FM.SunsetGarden && FM.SunsetGarden.lanterns(6, { x: p.x, z: p.z }); FM.Audio && FM.Audio.sfx('chime');
          const near = st.villagers.filter(v => v.loc === 'island' && Math.hypot(v.x - p.x, v.z - p.z) < 8 && !v.sceneId);
          for (const v of near) { Soc.addFriend(v.id, P, 2, 2, '소원 등불'); Sim.emote(v, '✨', 3); }
          FM.UI.toast(`🏮 소원 등불이 하늘로 떠올라요${near.length ? ` · 곁에 있던 ${near.map(v => v.name).slice(0, 3).join(', ')}도 함께 소원을 빌었어요` : ''}`);
        });
        add(2.4, '🌅 가제보에서 노을 보기', () => { p.x = -73.3; p.z = -92; p.ry = -Math.PI / 2; p.stamina = Math.min(100, (p.stamina || 0) + 15); FM.UI.toast(hour() >= 17 && hour() < 20 ? '🌅 하늘이 주황빛에서 보랏빛으로... 마음이 편안해져요 (스태미나 +15)' : '🌸 푸른 수국 사이 가제보에 앉아 쉬었어요 (스태미나 +15)'); });
      } catch (e) { console.error('sunset options', e); }
      return r;
    };
  }
})();
