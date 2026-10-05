/* =========================================================
 *  지형 함수 — 계단식 고저차 (남 0m → 남쪽 2m → 중앙 6m → 북쪽 30m)
 *  3D 렌더링과 시뮬레이션(주민 높이/이동 가능 여부)이 함께 사용
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM;
  const P = FM.MAP.P;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;

  // 해안선 (초타원 + 약간의 굴곡)
  function coastVal(x, z) {
    const a = Math.atan2(z, x);
    const wob = 1 + Math.sin(a * 5 + 1.3) * 0.025 + Math.sin(a * 11 + 0.4) * 0.012;
    const ax = 136 * wob, az = (z < 0 ? 124 : 104) * wob;
    const p = 2.6;
    return Math.pow(Math.abs(x) / ax, p) + Math.pow(Math.abs(z) / az, p);
  }

  // 물 (연못, 호수, 시냇물, 강)
  const WATERS = [
    { type: 'circle', x: -40, z: -52, r: 4.6, level: 4.1, name: '폭포 연못' },
    { type: 'rect', x0: -136, x1: -43, z0: -53.3, z1: -50.7, level: 4.1, name: '협곡 강' },
    { type: 'circle', x: -97, z: 30, r: 5.2, level: 5.6, name: '공원 호수' },
    { type: 'rect', x0: -93, x1: -64, z0: 32.3, z1: 33.9, level: 5.6, name: '인공 시냇물' },
    { type: 'rect', x0: -140, x1: -101, z0: 29.4, z1: 31, level: 5.6, name: '시냇물 하류' },
  ];
  // 다리 (물 위를 걸을 수 있는 곳)
  const FOOTBRIDGES = [
    { x0: -80, x1: -75, z0: 31.5, z1: 34.7 },
    { x0: -106, x1: -102, z0: 28.6, z1: 31.8 },
    { x0: -74, x1: -69.5, z0: -54, z1: -50 },
    { x0: -106, x1: -101, z0: -54.3, z1: -49.7 },
    { x0: 49.5, x1: 54.5, z0: 90, z1: 107, y: 1.3, pier: true },       // 페리 선착장 데크
    { x0: -8, x1: 8, z0: 84.5, z1: 92, y: 1.1, pier: true },            // 워터프론트 데크
    { x0: -77.6, x1: -74.4, z0: 86.5, z1: 105, y: 1.2, pier: true },   // 낚시 대회 부두
    { x0: -80.6, x1: -71.4, z0: 104.6, z1: 110.4, y: 1.2, pier: true },  // 부두 머리
  ];
  // 구름다리 (협곡 위)
  const BRIDGE = { x: 0, hw: 1.7, z0: -42, z1: -58, y0: 28, y1: 30, sag: 1.6 };
  function bridgeY(z) {
    const t = clamp((z - BRIDGE.z0) / (BRIDGE.z1 - BRIDGE.z0), 0, 1);
    return lerp(BRIDGE.y0, BRIDGE.y1, t) - Math.sin(t * Math.PI) * BRIDGE.sag;
  }
  const onBridge = (x, z) => Math.abs(x - BRIDGE.x) <= BRIDGE.hw && z <= BRIDGE.z0 + 0.5 && z >= BRIDGE.z1 - 0.5;
  const onStairs = (x, z) => Math.abs(x) < 3.2 && z > -41 && z < -23;

  function inWater(x, z) {
    for (const w of WATERS) {
      if (w.type === 'circle' ? Math.hypot(x - w.x, z - w.z) < w.r : x > w.x0 && x < w.x1 && z > w.z0 && z < w.z1) return w;
    }
    return null;
  }

  // 기본 층 (남→북)
  // 6m → 2m 경사: 기본 z 40~50, 서쪽(x<-46) 은 z 36~44 (학교·놀이터가 평지에), 동쪽(x>54) 은 z 56~64 (미식 골목이 위 단에)
  const slope = (z, z0, z1) => z > z1 ? 2 : z > z0 ? lerp(6, 2, smooth((z - z0) / (z1 - z0))) : 6;
  function baseRaw(x, z) {
    let e;
    if (z > 96) e = 0;
    else if (z > 80) e = lerp(2, 0.2, smooth((z - 80) / 16));
    else {
      e = slope(z, 40, 50);
      const wW = smooth((-x - 38) / 8), wE = smooth((x - 46) / 8);
      if (wW > 0) e = lerp(e, slope(z, 36, 44), wW);
      if (wE > 0) e = lerp(e, slope(z, 56, 64), wE);
    }
    // 협곡 (z -42 ~ -58)
    if (z < -40) {
      const bank = smooth((-40 - z) / 5);            // 남쪽 둑: 완만
      e = lerp(e, 4.5, bank);
    }
    // 중앙 북쪽 언덕 (구름다리 머리) : |x| < 40
    if (z < -24 && z > -44 && Math.abs(x) < 42) {
      const up = smooth((-z - 25) / 7);             // z -25 → -32 급경사
      const side = 1 - smooth((Math.abs(x) - 37) / 4);
      const back = 1 - smooth((-z - 42.5) / 1.5);    // 협곡 쪽 절벽
      e = lerp(e, 28, up * side * back);
    }
    // 계단 (진입로) : |x|<3, z -24 → -40 직선 경사
    if (onStairs(x, z)) {
      const t = clamp((-z - 24) / 16, 0, 1);
      e = lerp(6, 28, t);
    }
    // 북쪽 고지대 (z < -58, x > -84)
    if (z < -56) {
      const north = smooth((-z - 56.5) / 2.0);
      const west = smooth((x + 86) / 2.5);
      const hill = 30 + Math.sin(x * 0.05) * 0.5 + Math.cos(z * 0.07) * 0.5;
      // 절벽 아래 잔디밭 (x < -84) 은 6m
      const low = lerp(4.5, 6, smooth((-z - 58) / 8));
      e = lerp(e, lerp(low, hill, west), north);
    }
    return e;
  }
  // 건물 터 고르기: 건물 바닥 + 둘레를 출입문 높이로 평평하게, 바깥은 완만한 둔덕으로 이어줌
  const PADS = [];
  for (const p of Object.values(P)) {
    if (!p.bld) continue;
    const d = p.door || [p.x, p.z];
    const tx = p.x + (d[0] - p.x) * 1.15, tz = p.z + (d[1] - p.z) * 1.15;
    const y = baseRaw(tx, tz);
    const m = 1.4, x0 = p.x - p.bld.w / 2 - m, x1 = p.x + p.bld.w / 2 + m, z0 = p.z - p.bld.d / 2 - m, z1 = p.z + p.bld.d / 2 + m;
    let dmax = 0;
    for (const [a, b] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1], [p.x, p.z]]) dmax = Math.max(dmax, Math.abs(baseRaw(a, b) - y));
    if (dmax < 0.05) continue;
    const sk = clamp(dmax * 2.2, 3, 9);
    PADS.push({ id: p.id, y, x0, x1, z0, z1, sk });
  }
  function baseHeight(x, z) {
    let e = baseRaw(x, z);
    // 가장 가까운(영향이 큰) 터 하나만 따름 → 이웃 건물 둔덕이 내 바닥을 덮지 않음
    let bw = 0, by = 0;
    for (const q of PADS) {
      if (x < q.x0 - q.sk || x > q.x1 + q.sk || z < q.z0 - q.sk || z > q.z1 + q.sk) continue;
      const dx = Math.max(q.x0 - x, 0, x - q.x1), dz = Math.max(q.z0 - z, 0, z - q.z1);
      const w = 1 - smooth(Math.hypot(dx, dz) / q.sk);
      if (w > bw) { bw = w; by = q.y; }
    }
    if (bw > 0) e = lerp(e, by, bw);
    // 폭포 연못 · 강 · 호수 파임
    const w = inWater(x, z);
    if (w) e = Math.min(e, w.level - 0.9);
    return e;
  }

  function height(x, z) {
    const v = coastVal(x, z);
    const land = baseHeight(x, z);
    if (v < 0.86) return land;
    // 해안: 남쪽은 모래사장으로 완만, 나머지는 절벽
    const t = smooth((v - 0.86) / 0.16);
    const south = z > 60 ? 1 : 0;
    const sea = -3.5;
    if (south) return lerp(land, sea, smooth((v - 0.9) / 0.12));
    return lerp(land, sea, Math.pow(t, land > 10 ? 3 : 1.5));
  }

  // 발 딛는 높이 (다리/계단 포함)
  function groundY(x, z) {
    if (onBridge(x, z)) return bridgeY(z) + 0.25;
    for (const b of FOOTBRIDGES) if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1) {
      if (b.y !== undefined) return Math.max(height(x, z), b.y);
      return Math.max(height(x, z), (inWater(x, z) || { level: height(x, z) }).level + 0.35);
    }
    return Math.max(height(x, z), -0.4);
  }

  // 건물 충돌 상자
  const SOLIDS = [];
  for (const p of Object.values(P)) {
    if (!p.bld) continue;
    SOLIDS.push({ x0: p.x - p.bld.w / 2, x1: p.x + p.bld.w / 2, z0: p.z - p.bld.d / 2, z1: p.z + p.bld.d / 2, id: p.id });
  }
  SOLIDS.push({ circle: true, x: 0, z: 10, r: 3.4, id: 'fountain' });
  const extraSolid = [];
  // 해변 시설 (원형 충돌)
  for (const b of FM.MAP.BEACH_SOLIDS || []) extraSolid.push(b);

  // 작은 사물 충돌 (나무 · 가로등 · 텐트 · 노점 · 화분 …) — 4m 격자로 빠르게 찾기
  const CELL = 4, GRID = new Map(), SMALL = [];
  const gk = (i, j) => i * 100003 + j;
  function addSolid(x, z, r, id) {
    const s = { x, z, r, id: id || 'prop', small: true }; SMALL.push(s);
    const m = r + 0.8;
    for (let i = Math.floor((x - m) / CELL); i <= Math.floor((x + m) / CELL); i++) for (let j = Math.floor((z - m) / CELL); j <= Math.floor((z + m) / CELL); j++) { const k = gk(i, j); let a = GRID.get(k); if (!a) GRID.set(k, (a = [])); a.push(s); }
    return s;
  }
  function smallSolidAt(x, z, pad = 0.3) {
    const a = GRID.get(gk(Math.floor(x / CELL), Math.floor(z / CELL))); if (!a) return null;
    for (const s of a) if (Math.hypot(x - s.x, z - s.z) < s.r + pad) return s;
    return null;
  }
  // 둥근 사물(분수 · 해변 시설 · 작은 소품) 안이면 바깥 가장자리로 밀어냄 → 주민이 사물을 통과하지 않고 가장자리를 따라 돌아감
  function pushOut(x, z, pad = 0.3) {
    for (let it = 0; it < 3; it++) {
      let s = null;
      for (const c of SOLIDS) if (c.circle && Math.hypot(x - c.x, z - c.z) < c.r + pad) { s = c; break; }
      if (!s) for (const c of extraSolid) if (Math.hypot(x - c.x, z - c.z) < c.r + pad) { s = c; break; }
      if (!s) s = smallSolidAt(x, z, pad);
      if (!s) return { x, z, moved: it > 0 };
      const dx = x - s.x, dz = z - s.z, d = Math.hypot(dx, dz) || 0.001, R = s.r + pad + 0.01;
      x = s.x + dx / d * R; z = s.z + dz / d * R;
    }
    return { x, z, moved: true };
  }
  function blockedByBuilding(x, z, pad = 0.35) {
    for (const s of SOLIDS) {
      if (s.circle) { if (Math.hypot(x - s.x, z - s.z) < s.r + pad) return s; }
      else if (x > s.x0 - pad && x < s.x1 + pad && z > s.z0 - pad && z < s.z1 + pad) return s;
    }
    for (const s of extraSolid) if (Math.hypot(x - s.x, z - s.z) < s.r + pad) return s;
    return smallSolidAt(x, z, Math.min(pad, 0.3));
  }

  // 플레이어 이동 가능 여부 (from → to)
  function canWalk(x0, z0, x1, z1) {
    if (onBridge(x1, z1)) return true;
    if (onBridge(x0, z0) && !onBridge(x1, z1)) {
      // 다리 끝으로만 내려갈 수 있음
      if (z1 < BRIDGE.z1 - 0.3 || z1 > BRIDGE.z0 + 0.3) return true;
      return false;
    }
    const fb = FOOTBRIDGES.some(b => x1 > b.x0 && x1 < b.x1 && z1 > b.z0 && z1 < b.z1);
    if (fb && !blockedByBuilding(x1, z1)) return true;
    if (!fb && inWater(x1, z1)) return false;
    const h1 = height(x1, z1);
    if (!fb && h1 < 0.15) return false; // 바다
    if (blockedByBuilding(x1, z1)) return false;
    if (onStairs(x1, z1) || onStairs(x0, z0)) return true;
    const h0 = height(x0, z0);
    const d = Math.hypot(x1 - x0, z1 - z0) || 0.001;
    return Math.abs(h1 - h0) / d < 1.1;
  }

  function district(x, z) {
    if (z < -44) return 'NORTH';
    if (z > 44 && Math.abs(x) < 60) return 'SOUTH';
    if (x < -38) return 'WEST';
    if (x > 38) return 'EAST';
    if (z > 44) return x < 0 ? 'WEST' : 'EAST';
    return 'CORE';
  }

  // 지면 종류 (색칠용)
  function surface(x, z) {
    const h = height(x, z);
    if (h < 0.5 || (z > 81 && x < 30 && x > -100) || (z > 84.5 && x < 60 && x > -100)) return 'sand';
    if (z < -58 && x > -84) return 'highgrass';
    return 'grass';
  }

  FM.T = { height, groundY, canWalk, inWater, onBridge, onStairs, bridgeY, district, surface, blockedByBuilding, coastVal, addSolid, smallSolidAt, pushOut, SMALL,
    WATERS, FOOTBRIDGES, BRIDGE, SOLIDS, extraSolid, PADS, clamp, smooth, lerp };
})();
