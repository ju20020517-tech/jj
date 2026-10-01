/* =========================================================
 *  🌼 꽃 키트 — 꽃잎이 한 장 한 장 있는 진짜 꽃 모양
 *   데이지 · 코스모스 · 튤립 · 장미 · 메리골드(폼폼) · 수선화 · 팬지 · 종꽃
 *   - FM.Flora.geo(kind): 꽃송이 지오메트리 (위를 보는 꽃, 단위 크기, 캐시)
 *   - FM.Flora.bloom(k, kind, color, x, y, z, s, tilt): 가구 키트(K) 위에 꽃 한 송이 + 꽃술
 *   - FM.Flora.bush(k, ...): 잎 덤불 + 꽃 여러 송이
 *  섬 꽃밭(world3d)과 노을 정원 꽃 덤불(k19_*)이 이 키트를 씀
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM;
  const PI = Math.PI;
  const cache = new Map();
  const M4 = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz));
  function merge(list) {
    const parts = list.map(([g, m]) => { const x = g.index ? g.toNonIndexed() : g.clone(); x.applyMatrix4(m); return x; });
    let n = 0; for (const p of parts) n += p.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    let o = 0; for (const p of parts) { pos.set(p.attributes.position.array, o * 3); nor.set(p.attributes.normal.array, o * 3); if (p.attributes.uv) uv.set(p.attributes.uv.array, o * 2); o += p.attributes.position.count; }
    const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    return out;
  }
  // 꽃잎 하나: 끝이 둥근 납작한 타원 (뿌리가 원점, +x 방향으로 뻗음, 살짝 오목)
  const petalG = (() => { const g = new THREE.CircleGeometry(1, 8); g.rotateX(-PI / 2); g.translate(1, 0, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, z * z * 0.35 + x * x * 0.05); } g.computeVertexNormals(); return g; })();
  const ring = (n, len, wid, thick, tilt, y = 0, rot = 0) => Array.from({ length: n }, (_, i) => [petalG, M4(0, y, 0, 0, rot + i / n * PI * 2, tilt, len / 2, wid / 2, wid / 2)]);
  const GEO = {
    daisy: () => merge(ring(14, 0.13, 0.03, 0.008, 0.18)),
    cosmos: () => merge(ring(8, 0.12, 0.06, 0.01, 0.22)),
    pansy: () => merge([...ring(5, 0.085, 0.08, 0.012, 0.12)]),
    tulip: () => merge([...ring(3, 0.16, 0.09, 0.018, 1.25, 0, 0), ...ring(3, 0.15, 0.085, 0.018, 1.32, 0.005, PI / 3)].map(([g, m]) => [g, m])),
    rose: () => merge([...ring(5, 0.09, 0.07, 0.014, 0.35), ...ring(5, 0.075, 0.06, 0.014, 0.8, 0.01, 0.6), ...ring(4, 0.055, 0.05, 0.014, 1.2, 0.02, 1.1), [new THREE.SphereGeometry(0.03, 6, 4), M4(0, 0.045, 0, 0, 0, 0, 1, 1.3, 1)]]),
    marigold: () => { const L = []; for (let r = 0; r < 4; r++) L.push(...ring(9 + r * 2, 0.07 - r * 0.012, 0.035, 0.01, 0.2 + r * 0.42, r * 0.016, r * 0.4)); L.push([new THREE.SphereGeometry(0.03, 6, 4), M4(0, 0.06, 0)]); return merge(L); },
    daffodil: () => merge([...ring(6, 0.12, 0.055, 0.01, 0.15)]),
    bell: () => { const L = []; for (let i = 0; i < 7; i++) { const a = i * 2.4, r = 0.03 + (i % 3) * 0.025; L.push([new THREE.CylinderGeometry(0.028, 0.012, 0.045, 8, 1, true), M4(Math.cos(a) * r, -0.02 - i * 0.012, Math.sin(a) * r, PI)]); } return merge(L); },
  };
  // 꽃술 (가운데)
  const CENTER = { daisy: [0.028, 0xf8c020], cosmos: [0.026, 0xf8d040], pansy: [0.02, 0x4a2a5a], daffodil: [0.035, 0xffa020], tulip: null, rose: null, marigold: null, bell: null };
  const centerGeo = (kind) => { const k = 'c' + kind; if (!cache.has(k)) { const r = (CENTER[kind] || [0.02])[0]; const g = kind === 'daffodil' ? new THREE.CylinderGeometry(r * 0.9, r * 0.6, 0.05, 12, 1, true).translate(0, 0.02, 0) : new THREE.SphereGeometry(r, 7, 4).scale(1, 0.55, 1); cache.set(k, g); } return cache.get(k); };
  function geo(kind) { if (!cache.has(kind)) cache.set(kind, (GEO[kind] || GEO.daisy)()); return cache.get(kind); }
  // 줄기 + 잎 2장 (높이 h)
  const stemCache = new Map();
  function stemGeo(h = 0.36) { const k = h.toFixed(2); if (!stemCache.has(k)) { const leaf = new THREE.SphereGeometry(1, 5, 3); stemCache.set(k, merge([[new THREE.CylinderGeometry(0.008, 0.013, h, 4), M4(0, h / 2, 0)], [leaf, M4(0.05, h * 0.3, 0, 0, 0, 0.6, 0.07, 0.012, 0.025)], [leaf, M4(-0.045, h * 0.5, 0.01, 0, 0.4, -0.6, 0.065, 0.012, 0.022)]])); } return stemCache.get(k); }
  const mats = new Map();
  const lam = (c, ds) => { const k = c + (ds ? 'd' : ''); if (!mats.has(k)) mats.set(k, new THREE.MeshLambertMaterial({ color: c, side: ds ? THREE.DoubleSide : THREE.FrontSide })); return mats.get(k); };
  // 가구 키트 위에 꽃 한 송이
  function bloom(k, kind, color, x, y, z, s = 1, tilt = 0, stem = 0.36) {
    if (stem > 0) { const st = new THREE.Mesh(stemGeo(stem), lam(0x4f9e3e)); st.position.set(x, y, z); st.scale.setScalar(s); st.castShadow = true; k.add(st); }
    const hy = y + stem * s;
    const h = new THREE.Mesh(geo(kind), lam(color, true)); h.position.set(x, hy, z); h.rotation.set(tilt, (x * 13 + z * 7) % 6.28, 0, 'YXZ'); h.scale.setScalar(s); h.castShadow = true; k.add(h);
    const c = CENTER[kind]; if (c) { const cm = new THREE.Mesh(centerGeo(kind), lam(kind === 'daffodil' ? shade(color, 0.85, 0xffa020) : c[1])); cm.position.set(x, hy + 0.012 * s, z); cm.rotation.copy(h.rotation); cm.scale.setScalar(s); k.add(cm); }
    return h;
  }
  const shade = (c, k, alt) => alt || c;
  // 잎 덤불 + 꽃 (r 반경, n 송이)
  const leafMat = () => (FM.AC && FM.AC.tm ? FM.AC.tm('leaf', 0x5aa848) : lam(0x5aa848));
  function bush(k, kinds, colors, x, z, r = 0.4, n = 9, h = 0.3, seed = 1) {
    const lm = leafMat();
    for (let i = 0; i < 4; i++) { const a = i * 1.7 + seed; const m = new THREE.Mesh(new THREE.SphereGeometry(r * (0.62 + (i % 2) * 0.15), 10, 8), lm); m.position.set(x + Math.cos(a) * r * 0.35, h * 0.55, z + Math.sin(a) * r * 0.35); m.scale.y = 0.62; m.castShadow = true; m.receiveShadow = true; k.add(m); }
    for (let i = 0; i < n; i++) { const a = i * 2.39996 + seed, rr = Math.sqrt((i + 0.5) / n) * r * 0.9; bloom(k, kinds[i % kinds.length], colors[i % colors.length], x + Math.cos(a) * rr, h * 0.55, z + Math.sin(a) * rr, 1.15 + ((i * 7) % 3) * 0.12, (rr / r) * 0.5, 0.18 + ((i * 5) % 3) * 0.04); }
  }
  FM.Flora = { geo, centerGeo, stemGeo, bloom, bush, CENTER, KINDS: Object.keys(GEO) };

  // ---------------------------------------------------------
  // 노을 정원 꽃 덤불을 진짜 꽃으로 교체 (노란 톤 유지)
  // ---------------------------------------------------------
  const F = FM.FURN;
  if (F) {
    const YEL = [0xffd030, 0xffe878, 0xf8b818, 0xfff4c0, 0xffc040];
    const swap = (id, fn) => { if (F[id]) F[id].build = fn; };
    const KK = g => ({ add: o => { g.add(o); return o; } });
    swap('k19_hydrangea', g => { const k = KK(g); bush(k, ['marigold', 'rose', 'marigold', 'daisy'], YEL, 0, 0, 0.48, 16, 0.42, 1); bush(k, ['marigold', 'daisy'], [0xf8a020, 0xffe060], 0.28, 0.22, 0.26, 6, 0.3, 3); });
    swap('k19_hyacinth', g => { const k = KK(g); for (let i = 0; i < 7; i++) { const a = i * 0.9, r = 0.08 + (i % 3) * 0.06; bloom(k, i % 3 === 2 ? 'bell' : 'daffodil', i % 3 === 2 ? 0xfffbe8 : YEL[i % 3], Math.cos(a) * r, 0, Math.sin(a) * r, 1.3, 0.35, 0.34 + (i % 3) * 0.06); } for (let i = 0; i < 6; i++) { const lf = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.32, 0.01), lam(0x4a9a3a)); lf.position.set(Math.cos(i) * 0.1, 0.15, Math.sin(i) * 0.1); lf.rotation.set(Math.sin(i) * 0.3, i, Math.cos(i) * 0.3); g.add(lf); } });
    swap('k19_rosebush', g => { const k = KK(g); bush(k, ['rose'], [0xffd040, 0xfff2c8, 0xffe070, 0xf8c030], 0, 0, 0.44, 13, 0.55, 2); });
  }
})();
