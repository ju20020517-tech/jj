/* =========================================================
 *  🌸 벚꽃길 & 꽉 찬 거리 — 마을 분위기 키트
 *   - 벚꽃 대로: 중앙 광장 남쪽 대로(x=0, z 26~68) 양옆 벚나무 가로수 · 흩날리는 꽃잎 · 인도 꽃잎 카펫
 *                나무 사이를 잇는 분홍 · 흰 종이 등 줄(밤에 켜짐) · 꽃구경 벤치 (장소는 아님, 그냥 거리 구역)
 *   - 거리 소품: 모든 길을 따라 지역 분위기에 맞춰 화분 · 벤치 · 자판기 · 자전거 거치대 · 전봇대 & 전선 · 우체통
 *                · 꽃 술통 · 쓰레기통 · 입간판 · 소화전 · 석등 · 가로등
 *   - 빛: 밤이 되면 가로등 · 등 아래 땅에 따뜻한 빛 웅덩이
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE;
  const PI = Math.PI;
  const SAKURA = { x0: -9, x1: 9, z0: 24, z1: 70 };
  const inSak = (x, z) => x > SAKURA.x0 && x < SAKURA.x1 && z > SAKURA.z0 && z < SAKURA.z1;
  const TREES = [];   // 벚꽃 가로수는 제거 (거리 소품만 유지)
  const mc = new Map();
  const lam = (c, o) => { const k = c + JSON.stringify(o || {}); if (!mc.has(k)) mc.set(k, new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}))); return mc.get(k); };
  const glow = c => FM.PM.glowMat(c);
  const tm = (k, c) => FM.AC.tm(k, c);
  const G = {}; const geo = (k, f) => G[k] || (G[k] = f());
  const add = (g, gg, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(gg, typeof m === 'number' ? lam(m) : m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  const B = (w, h, d) => geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
  const C = (a, b, h, s = 10) => geo(`c${a},${b},${h},${s}`, () => new THREE.CylinderGeometry(a, b, h, s));
  const SP = (r, a = 10, b = 8) => geo(`s${r},${a},${b}`, () => new THREE.SphereGeometry(r, a, b));
  const lumpy = (seed, amp) => geo('lmp' + seed, () => { const g = new THREE.SphereGeometry(1, 12, 9); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 1 + amp * (Math.sin(x * 5.1 + seed) * Math.cos(y * 4.3 + seed * 2) + Math.sin(z * 4.7 - seed) * 0.6); p.setXYZ(i, x * k, y * k, z * k); } g.computeVertexNormals(); return FM.AC.scaleUV(g, 3, 2); });

  // ---------------------------------------------------------
  // 벚나무 (굽은 줄기 + 가지 + 분홍 꽃구름 + 늘어진 꽃송이)
  // ---------------------------------------------------------
  const PINK = [0xffc4d8, 0xffb0cc, 0xffd8e6, 0xff9cc0];
  function sakuraTree(seed, s = 1) {
    const g = new THREE.Group(); const bark = tm('bark', 0x6a4a40);
    const tr = add(g, C(0.16 * s, 0.26 * s, 2.4 * s, 9), bark, 0, 1.2 * s, 0); tr.rotation.z = Math.sin(seed) * 0.08;
    for (let i = 0; i < 4; i++) { const a = i * 1.6 + seed; const br = add(g, C(0.05 * s, 0.11 * s, 1.5 * s, 7), bark, Math.cos(a) * 0.45 * s, 2.6 * s, Math.sin(a) * 0.45 * s); br.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7); }
    const lm = tm('leaf', 0xffffff);
    const parts = [[0, 3.6, 0, 1.45], [-1.1, 3.2, 0.3, 1.05], [1.1, 3.3, -0.2, 1.1], [0.2, 3.1, 1.05, 0.95], [-0.3, 3.2, -1.0, 0.95], [0.3, 4.3, 0.1, 0.9], [-0.8, 3.9, -0.5, 0.8], [0.9, 3.9, 0.6, 0.8]];
    parts.forEach(([x, y, z, r], i) => { const m = lam(PINK[(i + (seed | 0)) % 4]); const o = add(g, lumpy(1.7 + i * 0.3, 0.13), FM.AC.tm('leaf', PINK[(i + (seed | 0)) % 4]), x * s, y * s, z * s); o.scale.set(r * s, r * 0.82 * s, r * s); void m; void lm; });
    // 늘어진 꽃송이
    for (let i = 0; i < 10; i++) { const a = i * 0.63 + seed, r = 1.25 * s; add(g, SP(0.22 * s, 7, 5), PINK[i % 4], Math.cos(a) * r, (2.55 + (i % 3) * 0.15) * s, Math.sin(a) * r).scale.y = 1.5; }
    return g;
  }

  // ---------------------------------------------------------
  // 거리 소품
  // ---------------------------------------------------------
  const P = {};
  P.planter = (seed) => { const g = new THREE.Group(); add(g, B(1.2, 0.45, 0.5), tm('plank', 0x9a6a44), 0, 0.225, 0); if (FM.Flora) { const kinds = [['tulip', 'daisy'], ['marigold', 'cosmos'], ['rose', 'pansy'], ['daisy', 'cosmos']][seed % 4]; const cols = [[0xff6f86, 0xffffff, 0xffd84a], [0xff9a3d, 0xffc933, 0xff6f86], [0xff4d5e, 0xffffff, 0xb69cff], [0xffffff, 0xff8fd0, 0x7ab8ff]][seed % 4]; const k = { add: o => { g.add(o); return o; } }; for (let i = 0; i < 7; i++) FM.Flora.bloom(k, kinds[i % 2], cols[i % 3], -0.48 + i * 0.16, 0.42, (i % 2 - 0.5) * 0.18, 1.2, 0.2, 0.2 + (i % 3) * 0.05); add(g, SP(0.26, 8, 6), tm('leaf', 0x5aa848), -0.3, 0.5, 0).scale.set(1.2, 0.5, 0.8); add(g, SP(0.26, 8, 6), tm('leaf', 0x5aa848), 0.3, 0.5, 0).scale.set(1.2, 0.5, 0.8); } return g; };
  P.bench = () => { const g = new THREE.Group(); const w = tm('plank', 0xb87a48); for (let i = 0; i < 3; i++) add(g, B(1.6, 0.06, 0.13), w, 0, 0.46, -0.16 + i * 0.15); for (let i = 0; i < 2; i++) add(g, B(1.6, 0.12, 0.05), w, 0, 0.7 + i * 0.17, -0.27).rotation.x = -0.12; for (const x of [-0.7, 0.7]) { add(g, B(0.06, 0.46, 0.46), 0x2a2a2e, x, 0.23, -0.02); add(g, B(0.06, 0.5, 0.05), 0x2a2a2e, x, 0.7, -0.29); } return g; };
  P.vending = (seed) => { const g = new THREE.Group(); [[0xd8282a], [0xf4f4f4], [0x2a8a5a], [0x2a6ad8]].slice(seed % 2, seed % 2 + 2).forEach(([c], i) => { add(g, B(0.85, 1.8, 0.7), c, -0.45 + i * 0.9, 0.9, 0); const f = add(g, B(0.7, 0.9, 0.02), glow(0xf4faff), -0.45 + i * 0.9, 1.25, 0.36); f.userData.noBake = false; for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) add(g, B(0.08, 0.2, 0.02), [0xff4a3a, 0xffd84a, 0x3a9aff, 0x5ad06a, 0xff8ac0][(k + r) % 5], -0.45 + i * 0.9 - 0.26 + k * 0.13, 0.95 + r * 0.28, 0.375); add(g, B(0.5, 0.12, 0.05), 0x1a1a1a, -0.45 + i * 0.9, 0.45, 0.37); }); return g; };
  P.bikes = () => { const g = new THREE.Group(); add(g, B(2.2, 0.05, 0.05), 0x9aa0a8, 0, 0.55, 0); for (const x of [-1.0, 1.0]) add(g, B(0.05, 0.55, 0.05), 0x9aa0a8, x, 0.27, 0); [0xff6f86, 0x4fc1e9, 0xf4e8d0].forEach((c, i) => { const b = new THREE.Group(); for (const z of [-0.45, 0.45]) { const w = add(b, geo('bkw', () => new THREE.TorusGeometry(0.3, 0.03, 6, 16)), 0x2a2a2a, 0, 0.32, z); w.rotation.y = PI / 2; } add(b, B(0.04, 0.04, 0.9), c, 0, 0.48, 0); add(b, B(0.04, 0.45, 0.04), c, 0, 0.6, -0.12); add(b, B(0.1, 0.05, 0.22), 0x3a2a20, 0, 0.85, -0.18); add(b, B(0.45, 0.04, 0.04), 0x9aa0a8, 0, 0.88, 0.38); add(b, B(0.28, 0.16, 0.24), 0x9aa0a8, 0, 0.7, 0.55); b.position.x = -0.7 + i * 0.7; g.add(b); }); return g; };
  P.pole = () => { const g = new THREE.Group(); add(g, C(0.11, 0.15, 7.5, 8), tm('stone', 0xa8a49c), 0, 3.75, 0); add(g, B(1.6, 0.1, 0.1), 0x6a6a6a, 0, 6.9, 0); add(g, B(1.0, 0.08, 0.08), 0x6a6a6a, 0, 6.3, 0); add(g, C(0.22, 0.22, 0.6, 10), 0x8a9098, 0.28, 5.6, 0); for (const x of [-0.7, 0, 0.7]) add(g, C(0.04, 0.04, 0.12, 6), 0xe8e8e8, x, 7.0, 0); const sg = FM.PM.sign('섬마을 1-2', 0.3, 1.0, '#e8eef4', '#2a3a5a'); sg.position.set(0, 2.4, 0.16); g.add(sg); return g; };
  P.mailbox = () => { const g = new THREE.Group(); add(g, C(0.22, 0.22, 1.0, 14), 0xd8282a, 0, 0.5, 0); add(g, SP(0.22, 14, 8), 0xd8282a, 0, 1.0, 0).scale.y = 0.6; add(g, B(0.26, 0.04, 0.05), 0x1a1a1a, 0, 0.85, 0.21); return g; };
  P.barrel = (seed) => { const g = new THREE.Group(); add(g, C(0.32, 0.28, 0.6, 14), tm('plank', 0x8a5a34), 0, 0.3, 0); for (const y of [0.12, 0.48]) add(g, geo('brR', () => new THREE.TorusGeometry(0.31, 0.02, 6, 18)), 0x3a3a3a, 0, y, 0).rotation.x = PI / 2; if (FM.Flora) FM.Flora.bush({ add: o => { g.add(o); return o; } }, [['daisy', 'tulip'], ['rose'], ['cosmos', 'marigold']][seed % 3], [[0xffffff, 0xffd84a, 0xff6f86], [0xff4d5e, 0xff8fb1], [0xff8fd0, 0xff9a3d]][seed % 3], 0, 0, 0.3, 8, 1.15, seed); return g; };
  P.bins = () => { const g = new THREE.Group(); [0x3a8a5a, 0x3a6ab8, 0xf0c040].forEach((c, i) => { add(g, B(0.4, 0.7, 0.4), c, -0.45 + i * 0.45, 0.35, 0); add(g, B(0.42, 0.06, 0.42), 0x2a2a2a, -0.45 + i * 0.45, 0.72, 0); }); return g; };
  P.aboard = (seed) => { const g = new THREE.Group(); for (const s of [-1, 1]) { const b = add(g, B(0.6, 0.85, 0.04), 0x2a3a30, 0, 0.45, s * 0.14); b.rotation.x = s * 0.18; } const t = FM.PM.sign(['오늘의 추천 ☕', 'SALE 🌸', '맛집 👍', '꽃구경 🌸'][seed % 4], 0.5, 0.55, '#2a3a30', '#ffffff'); t.position.set(0, 0.5, 0.18); t.rotation.x = -0.18; g.add(t); return g; };
  P.hydrant = () => { const g = new THREE.Group(); add(g, C(0.12, 0.14, 0.55, 10), 0xd8282a, 0, 0.27, 0); add(g, SP(0.13, 10, 6), 0xd8282a, 0, 0.56, 0).scale.y = 0.6; for (const s of [-1, 1]) add(g, C(0.05, 0.05, 0.12, 8), 0xd8282a, s * 0.15, 0.36, 0).rotation.z = PI / 2; return g; };
  P.stoneLantern = () => { const g = new THREE.Group(); const S = tm('stone', 0xb8b0a4); add(g, B(0.5, 0.12, 0.5), S, 0, 0.06, 0); add(g, C(0.1, 0.12, 0.6, 8), S, 0, 0.42, 0); add(g, B(0.44, 0.08, 0.44), S, 0, 0.76, 0); add(g, B(0.34, 0.3, 0.34), S, 0, 0.95, 0); add(g, B(0.18, 0.16, 0.36), glow(0xffc870), 0, 0.95, 0); add(g, geo('slR', () => new THREE.ConeGeometry(0.42, 0.28, 4)), S, 0, 1.24, 0).rotation.y = PI / 4; return g; };
  P.lamp = () => { const g = new THREE.Group(); add(g, C(0.06, 0.09, 3.2, 8), 0x2a3a4a, 0, 1.6, 0); add(g, B(0.5, 0.05, 0.05), 0x2a3a4a, 0.22, 3.15, 0); const b = add(g, SP(0.16, 10, 8), glow(0xfff0c8), 0.42, 3.0, 0); b.userData.lampBulb = true; b.userData.noBake = true; add(g, geo('lpCap', () => new THREE.ConeGeometry(0.24, 0.18, 10)), 0x2a3a4a, 0.42, 3.15, 0); return g; };
  P.topiary = () => { const g = new THREE.Group(); add(g, B(0.55, 0.5, 0.55), 0xf0ece4, 0, 0.25, 0); add(g, C(0.04, 0.05, 0.6, 6), 0x6a4a30, 0, 0.75, 0); add(g, SP(0.38, 12, 10), tm('leaf', 0x4e9e44), 0, 1.2, 0); return g; };

  const KITS = {
    CORE: ['planter', 'bench', 'bikes', 'bins', 'aboard', 'planter', 'topiary', 'hydrant', 'lamp', 'mailbox'],
    EAST: ['vending', 'aboard', 'bikes', 'planter', 'bins', 'hydrant', 'vending', 'lamp', 'barrel'],
    WEST: ['barrel', 'planter', 'bench', 'mailbox', 'barrel', 'lamp', 'topiary', 'bikes'],
    SOUTH: ['planter', 'bench', 'bikes', 'vending', 'barrel', 'lamp', 'bins'],
    NORTH: ['stoneLantern', 'planter', 'bench', 'stoneLantern', 'barrel'],
  };
  const POLE_DIST = { EAST: true, SOUTH: true, WEST: true };

  FM.TownLife = (scene, T) => {
    const MAP = FM.MAP, root = new THREE.Group(); root.name = 'townLife';
    const inRect = (r, x, z) => r && x > r[0] && x < r[1] && z > r[2] && z < r[3];
    const inGarden = (x, z) => inRect(FM.GARDEN_RECT, x, z) || inRect(FM.SUNSET_RECT, x, z);
    const spots = FM.Sim ? FM.Sim.SPOTS : [];
    const used = [];
    const free = (x, z, r = 1.3) => {
      if (T.blockedByBuilding(x, z, r) || T.inWater(x, z) || T.height(x, z) < 0.6 || inGarden(x, z) || T.onStairs(x, z) || T.onBridge(x, z)) return false;
      if (FM.T.FOOTBRIDGES.some(b => x > b.x0 - 1 && x < b.x1 + 1 && z > b.z0 - 1 && z < b.z1 + 1)) return false;
      for (const s of spots) if (Math.abs(s.x - x) < 1.8 && Math.abs(s.z - z) < 1.8) return false;
      for (const pl of Object.values(MAP.P)) if (pl.door && Math.hypot(pl.door[0] - x, pl.door[1] - z) < 6.5) return false;
      for (const t of FM.DECOR.trees) if (Math.abs(t.x - x) < 1.6 && Math.abs(t.z - z) < 1.6) return false;
      for (const n of Object.values(MAP.N)) if (Math.abs(n[0] - x) < 3.2 && Math.abs(n[1] - z) < 3.2) return false;
      for (const u of used) if (Math.abs(u[0] - x) < 2.4 && Math.abs(u[1] - z) < 2.4) return false;
      for (const [tx, tz] of TREES) if (Math.abs(tx - x) < 2 && Math.abs(tz - z) < 2) return false;
      if (Math.hypot(x, z - 10) < 15) return false;
      if (Math.abs(x) < 6.2 && z > 36 && z < 86) return false;   // 4차선 대로 위
      return true;
    };
    const MAIN = new Set(['c_s|s_n', 's_n|s_mid', 's_mid|s_deck']);
    const groups = {}; const grp = d => groups[d] || (groups[d] = new THREE.Group());
    const lampPos = [];
    let seed = 0;
    const nearDoor = (x, z, r) => Object.values(MAP.P).some(pl => pl.door && Math.hypot(pl.door[0] - x, pl.door[1] - z) < r);
    const polesByEdge = [];
    for (const [a, b] of MAP.E) {
      if ((a.startsWith('c_n') && b === 'c_nt') || (a === 'c_nt' && b === 'n_b')) continue;
      const A = MAP.N[a], Bn = MAP.N[b]; const len = Math.hypot(Bn[0] - A[0], Bn[1] - A[1]); if (len < 7) continue;
      const main = MAIN.has(a + '|' + b) || MAIN.has(b + '|' + a);
      const ux = (Bn[0] - A[0]) / len, uz = (Bn[1] - A[1]) / len, nx = -uz, nz = ux;
      const off = main ? 5.0 : 2.3, step = main ? 7 : 8;
      const poles = [];
      for (let d = 4, k = 0; d < len - 3.5; d += step, k++) {
        const side = k % 2 ? 1 : -1;
        const x = A[0] + ux * d + nx * off * side, z = A[1] + uz * d + nz * off * side;
        const dist = T.district(x, z);
        if (!free(x, z)) continue;
        const kit = KITS[dist] || KITS.CORE; const kind = kit[(seed++) % kit.length];
        const o = P[kind](seed); const face = Math.atan2(-nx * side, -nz * side);
        o.position.set(x, T.height(x, z), z); o.rotation.y = face; grp(dist).add(o); used.push([x, z]);
        if (kind === 'lamp') lampPos.push([x + Math.sin(face + PI / 2) * 0.42, z + Math.cos(face + PI / 2) * 0.42]);
      }
      // 전봇대 (주택가 · 번화가 · 남쪽): 한쪽 가장자리를 따라 16m 마다 + 전선
      if (POLE_DIST[T.district(A[0], A[1])] && !main && len > 14) {
        for (let d = 2.5; d < len - 2; d += 16) { const x = A[0] + ux * d + nx * 1.9, z = A[1] + uz * d + nz * 1.9; if (T.blockedByBuilding(x, z, 0.5) || T.inWater(x, z) || T.height(x, z) < 0.6 || inGarden(x, z) || nearDoor(x, z, 7.5)) { poles.length = 0; continue; } const o = P.pole(); o.position.set(x, T.height(x, z), z); o.rotation.y = Math.atan2(ux, uz) + PI / 2; grp('poles').add(o); poles.push([x, T.height(x, z), z]); }
        polesByEdge.push(poles.slice());
      }
    }
    // 전선 (처지는 곡선 3가닥)
    const wireM = lam(0x1a1a1a);
    for (const poles of polesByEdge) for (let i = 0; i + 1 < poles.length; i++) {
      const [x0, y0, z0] = poles[i], [x1, y1, z1] = poles[i + 1];
      for (const [h, o] of [[6.95, -0.7], [6.95, 0.7], [6.35, 0]]) {
        const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), px = -dz / L * o, pz = dx / L * o;
        const pts = []; for (let t = 0; t <= 1.0001; t += 0.1) pts.push(new THREE.Vector3(x0 + dx * t + px, (y0 + (y1 - y0) * t) + h - Math.sin(t * PI) * 0.5, z0 + dz * t + pz));
        const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.015, 3), wireM); root.add(tube);
      }
    }
    for (const g of Object.values(groups)) { FM.PM.bake(g); root.add(g); }

    // ---------- 밤 빛 웅덩이 (가로등 · 등 아래) ----------
    scene.updateMatrixWorld(true);
    scene.traverse(o => { if (o.userData && o.userData.lampBulb) { const v = new THREE.Vector3(); o.getWorldPosition(v); if (v.y - T.groundY(v.x, v.z) < 6) lampPos.push([v.x, v.z, 1]); } });
    const rad = FM.PM.ctex('lpRad', 64, 64, (c, w, h) => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
    const poolM = new THREE.MeshBasicMaterial({ map: rad, color: 0xffb860, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -8 });
    const seen = new Set();
    const pools = new THREE.InstancedMesh(geo('pool', () => new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2)), poolM, lampPos.length);
    let pi = 0; const pp = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), m4 = new THREE.Matrix4();
    for (const [x, z, k] of lampPos) { const key = Math.round(x * 2) + ',' + Math.round(z * 2); if (seen.has(key)) continue; seen.add(key); pp.set(x, T.groundY(x, z) + 0.12, z); q.identity(); const r = (k || 1) * 6.5; sc.set(r, 1, r); m4.compose(pp, q, sc); pools.setMatrixAt(pi++, m4); }
    pools.count = pi; pools.renderOrder = 3; pools.frustumCulled = false; root.add(pools);

    // 매 프레임: 꽃잎 날림 · 밤 빛
    const tick = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial()); tick.frustumCulled = false;
    tick.onBeforeRender = () => {
      const nt = (FM.W && FM.W.nightness) || 0;
      poolM.opacity = Math.min(0.55, Math.max(0, nt - 0.15) * 0.8);
    };
    root.add(tick);
    scene.add(root);
    return root;
  };
})();
