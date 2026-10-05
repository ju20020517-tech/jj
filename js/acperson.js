/* =========================================================
 *  사람 캐릭터 (동물의 숲 플레이어 스타일)
 *  - 모든 덩어리(머리 · 몸통 · 팔 · 다리 · 신발 · 헤어)를 SDF 부드러운 합집합으로
 *    정의하고 서피스 넷으로 메시화 → 이음새 없이 매끈하게 이어진 몸
 *  - 얼굴은 머리 메시에 직접 투영한 텍스처 (흰자 있는 큰 눈 · 작은 주황 코 · 입)
 *  - 리그 구조(root/shape/body/head/arm/leg 피벗)는 기존과 같아서 걷기 · 포즈 · 소품 · 표정이 그대로 동작
 * ========================================================= */
(() => {
  'use strict';
  const ISLE = window.ISLE, M = ISLE.M;
  const { geo, sphere, box, capsule, lathe, roundCone, soften } = M.h;
  const D2R = Math.PI / 180;
  const shade = M.shade;
  const hex = n => '#' + (n >>> 0).toString(16).padStart(6, '0').slice(-6);
  const mix = (a, b, t) => [16, 8, 0].reduce((o, s) => o | (Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * t) << s), 0);
  // 캐릭터 색은 sRGB → 선형으로 바꿔 써서 물 빠지지 않고 선명하게
  const lin = c => new THREE.Color(c).convertSRGBToLinear();
  const mcache = new Map();
  const matL = (c, o = {}) => { const k = c + JSON.stringify(o); if (!mcache.has(k)) mcache.set(k, soften(new THREE.MeshLambertMaterial(Object.assign({ color: lin(c) }, o)), 0.25)); return mcache.get(k); };
  const mat = (c, o) => matL(c, Object.assign({ vertexColors: true }, o || {}));
  const srgb = t => { if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; t.needsUpdate = true; return t; };
  let PART = null;
  const tag = o => { if (PART) o.userData.part = PART; return o; };
  const mesh = (g, ...a) => tag(M.h.mesh(plain(g), ...a));
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const OPT = ISLE.CHAR_OPT;
  const A = Math.abs, hyp = Math.hypot, clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

  // =========================================================
  // SDF 기본 도형
  // =========================================================
  const smin = (a, b, k) => { const h = Math.max(k - A(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  const smax = (a, b, k) => -smin(-a, -b, k);
  const sSph = (x, y, z, cx, cy, cz, r) => hyp(x - cx, y - cy, z - cz) - r;
  function sEll(x, y, z, cx, cy, cz, rx, ry, rz) {
    const X = (x - cx) / rx, Y = (y - cy) / ry, Z = (z - cz) / rz;
    const k0 = hyp(X, Y, Z), k1 = hyp(X / rx, Y / ry, Z / rz);
    return k1 < 1e-9 ? -Math.min(rx, ry, rz) : k0 * (k0 - 1) / k1;
  }
  function sCone(x, y, z, ax, ay, az, bx, by, bz, r1, r2) {
    const px = x - ax, py = y - ay, pz = z - az, dx = bx - ax, dy = by - ay, dz = bz - az;
    const t = clamp((px * dx + py * dy + pz * dz) / (dx * dx + dy * dy + dz * dz), 0, 1);
    return hyp(px - dx * t, py - dy * t, pz - dz * t) - lerp(r1, r2, t);
  }
  const sTorY = (x, y, z, cx, cy, cz, R, r) => hyp(hyp(x - cx, z - cz) - R, y - cy) - r;

  // =========================================================
  // 서피스 넷 (SDF → 매끈한 메시)
  // =========================================================
  function nets(f, min, max, cell) {
    const nx = Math.ceil((max[0] - min[0]) / cell), ny = Math.ceil((max[1] - min[1]) / cell), nz = Math.ceil((max[2] - min[2]) / cell);
    const NX = nx + 1, NY = ny + 1, NZ = nz + 1;
    const v = new Float32Array(NX * NY * NZ);
    // 성긴 격자로 먼저 재고, 표면 근처만 촘촘하게 계산 (속도)
    const S = 4, cx = Math.ceil(nx / S) + 1, cy = Math.ceil(ny / S) + 1, cz = Math.ceil(nz / S) + 1, cs = cell * S;
    const C = new Float32Array(cx * cy * cz);
    for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) C[i + cx * (j + cy * k)] = f(min[0] + i * cs, min[1] + j * cs, min[2] + k * cs);
    const band = cs * 1.8;
    for (let k = 0; k < NZ; k++) {
      const z = min[2] + k * cell, K = Math.min(cz - 2, (k / S) | 0), fz = k / S - K;
      for (let j = 0; j < NY; j++) {
        const y = min[1] + j * cell, J = Math.min(cy - 2, (j / S) | 0), fy = j / S - J, o = NX * (j + NY * k);
        for (let i = 0; i < NX; i++) {
          const I = Math.min(cx - 2, (i / S) | 0), fx = i / S - I;
          const b = I + cx * (J + cy * K);
          const c000 = C[b], c100 = C[b + 1], c010 = C[b + cx], c110 = C[b + cx + 1], c001 = C[b + cx * cy], c101 = C[b + cx * cy + 1], c011 = C[b + cx * cy + cx], c111 = C[b + cx * cy + cx + 1];
          const mn = Math.min(A(c000), A(c100), A(c010), A(c110), A(c001), A(c101), A(c011), A(c111));
          const same = (c000 < 0) === (c100 < 0) && (c000 < 0) === (c010 < 0) && (c000 < 0) === (c110 < 0) && (c000 < 0) === (c001 < 0) && (c000 < 0) === (c101 < 0) && (c000 < 0) === (c011 < 0) && (c000 < 0) === (c111 < 0);
          if (same && mn > band) {
            const x0 = lerp(lerp(c000, c100, fx), lerp(c010, c110, fx), fy), x1 = lerp(lerp(c001, c101, fx), lerp(c011, c111, fx), fy);
            v[i + o] = lerp(x0, x1, fz);
          } else v[i + o] = f(min[0] + i * cell, y, z);
        }
      }
    }
    const gi = (i, j, k) => i + NX * (j + NY * k);
    const cid = new Int32Array(nx * ny * nz).fill(-1);
    const ci = (i, j, k) => i + nx * (j + ny * k);
    const P = [];
    const cv = new Float32Array(8);
    const EDG = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      let mask = 0;
      for (let c = 0; c < 8; c++) { const val = v[gi(i + (c & 1), j + ((c >> 1) & 1), k + ((c >> 2) & 1))]; cv[c] = val; if (val < 0) mask |= 1 << c; }
      if (mask === 0 || mask === 255) continue;
      let sx = 0, sy = 0, sz = 0, n = 0;
      for (const [a, b] of EDG) {
        if ((cv[a] < 0) === (cv[b] < 0)) continue;
        const t = cv[a] / (cv[a] - cv[b]);
        sx += (a & 1) + ((b & 1) - (a & 1)) * t; sy += ((a >> 1) & 1) + (((b >> 1) & 1) - ((a >> 1) & 1)) * t; sz += ((a >> 2) & 1) + (((b >> 2) & 1) - ((a >> 2) & 1)) * t; n++;
      }
      cid[ci(i, j, k)] = P.length / 3;
      P.push(min[0] + (i + sx / n) * cell, min[1] + (j + sy / n) * cell, min[2] + (k + sz / n) * cell);
    }
    const idx = [];
    const tri = (a, b, c, dx, dy, dz) => {
      const ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2];
      const ux = P[b * 3] - ax, uy = P[b * 3 + 1] - ay, uz = P[b * 3 + 2] - az, wx = P[c * 3] - ax, wy = P[c * 3 + 1] - ay, wz = P[c * 3 + 2] - az;
      const cx2 = uy * wz - uz * wy, cy2 = uz * wx - ux * wz, cz2 = ux * wy - uy * wx;
      if (cx2 * cx2 + cy2 * cy2 + cz2 * cz2 < 1e-14) return;
      if (cx2 * dx + cy2 * dy + cz2 * dz >= 0) idx.push(a, b, c); else idx.push(a, c, b);
    };
    const quad = (a, b, c, d, dx, dy, dz) => {
      if (a < 0 || b < 0 || c < 0 || d < 0) return;
      tri(a, b, c, dx, dy, dz); tri(a, c, d, dx, dy, dz);
    };
    for (let k = 0; k < NZ; k++) for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const ins = v[gi(i, j, k)] < 0, s = ins ? 1 : -1;
      if (i < nx && j >= 1 && j < ny && k >= 1 && k < nz && (v[gi(i + 1, j, k)] < 0) !== ins)
        quad(cid[ci(i, j - 1, k - 1)], cid[ci(i, j, k - 1)], cid[ci(i, j, k)], cid[ci(i, j - 1, k)], s, 0, 0);
      if (j < ny && i >= 1 && i < nx && k >= 1 && k < nz && (v[gi(i, j + 1, k)] < 0) !== ins)
        quad(cid[ci(i - 1, j, k - 1)], cid[ci(i, j, k - 1)], cid[ci(i, j, k)], cid[ci(i - 1, j, k)], 0, s, 0);
      if (k < nz && i >= 1 && i < nx && j >= 1 && j < ny && (v[gi(i, j, k + 1)] < 0) !== ins)
        quad(cid[ci(i - 1, j - 1, k)], cid[ci(i, j - 1, k)], cid[ci(i, j, k)], cid[ci(i - 1, j, k)], 0, 0, s);
    }
    // 표면으로 투영 + SDF 기울기로 매끈한 노멀
    const N = new Float32Array(P.length), h = cell * 0.5;
    for (let q = 0; q < P.length; q += 3) {
      let x = P[q], y = P[q + 1], z = P[q + 2];
      for (let it = 0; it < 3; it++) {
        const d = f(x, y, z);
        let gx = f(x + h, y, z) - f(x - h, y, z), gy = f(x, y + h, z) - f(x, y - h, z), gz = f(x, y, z + h) - f(x, y, z - h);
        const gl = hyp(gx, gy, gz) || 1; gx /= gl; gy /= gl; gz /= gl;
        if (it < 2) { const st = clamp(d, -cell * 0.6, cell * 0.6); x -= gx * st; y -= gy * st; z -= gz * st; }
        else { N[q] = gx; N[q + 1] = gy; N[q + 2] = gz; }
      }
      P[q] = x; P[q + 1] = y; P[q + 2] = z;
    }
    const g = new THREE.BufferGeometry();
    nets.count = (nets.count || 0) + 1;
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    // 면 방향이 SDF 기울기와 반대인 삼각형은 뒤집기 (뒷면이 보여 생기는 점 제거)
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t], b = idx[t + 1], c = idx[t + 2];
      const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2], wx = P[c * 3] - P[a * 3], wy = P[c * 3 + 1] - P[a * 3 + 1], wz = P[c * 3 + 2] - P[a * 3 + 2];
      const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
      const gx = N[a * 3] + N[b * 3] + N[c * 3], gy = N[a * 3 + 1] + N[b * 3 + 1] + N[c * 3 + 1], gz = N[a * 3 + 2] + N[b * 3 + 2] + N[c * 3 + 2];
      if (nx * gx + ny * gy + nz * gz < 0) { idx[t + 1] = c; idx[t + 2] = b; }
    }
    g.setIndex(idx);
    // 기울기가 0 인 곳만 면 노멀로 대체 (나머지는 SDF 기울기 그대로 → 매끈)
    const gN = N.slice();
    g.computeVertexNormals();
    const fn = g.attributes.normal;
    for (let i = 0; i < fn.count; i++) {
      const ax = gN[i * 3], ay = gN[i * 3 + 1], az = gN[i * 3 + 2];
      if (hyp(ax, ay, az) > 0.5 && ax * fn.getX(i) + ay * fn.getY(i) + az * fn.getZ(i) > -0.2) fn.setXYZ(i, ax, ay, az);
      const L2 = hyp(fn.getX(i), fn.getY(i), fn.getZ(i));
      if (!(L2 > 0.3)) { const px = g.attributes.position.getX(i), py = g.attributes.position.getY(i), pz = g.attributes.position.getZ(i), pl = hyp(px, py, pz) || 1; fn.setXYZ(i, px / pl, py / pl, pz / pl); }
      else fn.setXYZ(i, fn.getX(i) / L2, fn.getY(i) / L2, fn.getZ(i) / L2);
    }
    g.computeBoundingSphere();
    return g;
  }
  // SDF 앰비언트 오클루전 → 접히는 곳 · 겨드랑이 · 머리 밑이 자연스럽게 어두워짐
  function bakeAO(g, f, step) {
    const p = g.attributes.position, n = g.attributes.normal, c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i);
      let occ = 0, w = 1;
      for (let k = 1; k <= 5; k++) { const h = step * k; occ += (h - f(x + nx * h, y + ny * h, z + nz * h)) * w; w *= 0.6; }
      const ao = clamp(1 - Math.max(0, occ) * 2.4 / step / 5, 0.62, 1);
      c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = ao;
    }
    // 이웃 평균 두 번 → 얼룩 없는 부드러운 그늘
    const ix = g.index.array;
    for (let pass = 0; pass < 2; pass++) {
      const sum = new Float32Array(p.count), cnt = new Float32Array(p.count);
      for (let t = 0; t < ix.length; t += 3) for (let e = 0; e < 3; e++) { const a = ix[t + e]; for (let f2 = 0; f2 < 3; f2++) { sum[a] += c[ix[t + f2] * 3]; cnt[a]++; } }
      for (let i = 0; i < p.count; i++) if (cnt[i]) c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = sum[i] / cnt[i];
    }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  }
  const sdfGeo = (key, f, min, max, cell, post, aoStep) => geo('sdf:' + key, () => { const g = nets(f, min, max, cell); bakeAO(g, f, aoStep || cell * 1.6); if (window.__NOAO) g.attributes.color.array.fill(1); if (post) post(g); return g; });
  // 일반 지오메트리에도 흰 버텍스 컬러 (vertexColors 재질 공용)
  const plain = g => { if (!g.attributes.color) { const c = new Float32Array(g.attributes.position.count * 3).fill(1); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); } return g; };

  // =========================================================
  // 머리 (머리 로컬 좌표, 이후 HEAD_SCALE 배)
  // =========================================================
  const HEAD_SCALE = 0.86;
  // Q판(치비) 얼굴형: 둥근 이마 · 통통한 볼 · 작은 턱 · 낮은 귀, 코 없음
  function headSDF(x, y, z) {
    let d = sEll(x, y, z, 0, 0.04, -0.02, 0.45, 0.44, 0.43);
    d = smin(d, sEll(x, y, z, 0, -0.14, 0.05, 0.39, 0.27, 0.34), 0.14);
    d = smin(d, sSph(A(x), y, z, 0.21, -0.2, 0.15, 0.15), 0.1);
    d = smin(d, sSph(x, y, z, 0, -0.29, 0.11, 0.1), 0.08);
    d = smin(d, sEll(A(x), y, z, 0.43, -0.12, -0.04, 0.045, 0.075, 0.06), 0.03);
    return d;
  }
  const FC = [0, -0.03, 0];
  const MOUTH_POL = 117;
  const FX = az => (az + 70) / 140, FY = pol => (pol - 40) / 100;
  function headGeo() {
    return sdfGeo('head', headSDF, [-0.53, -0.5, -0.5], [0.53, 0.5, 0.52], 0.0155, g => {
      const p = g.attributes.position, uv = new Float32Array(p.count * 2);
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i) - FC[0], y = p.getY(i) - FC[1], z = p.getZ(i) - FC[2];
        const az = Math.atan2(x, z) / D2R, pol = Math.acos(clamp(y / (hyp(x, y, z) || 1), -1, 1)) / D2R;
        uv[i * 2] = FX(az); uv[i * 2 + 1] = 1 - FY(pol);
      }
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    });
  }

  // ---------------------------------------------------------
  // 얼굴 그리기 (512 × 384 = 방위 140° × 극각 100°)
  // ---------------------------------------------------------
  const CW = 512, CH = 384;
  const X = az => FX(az) * CW, Y = pol => FY(pol) * CH;
  const ellipse = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); };
  const circle = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
  function heart(g, x, y, s) { g.beginPath(); g.moveTo(x, y + s * 0.9); g.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.5, y - s * 1.3, x, y - s * 0.4); g.bezierCurveTo(x + s * 0.5, y - s * 1.3, x + s * 1.6, y - s * 0.2, x, y + s * 0.9); g.fill(); }
  function star(g, x, y, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r, a = i / 10 * Math.PI * 2 - Math.PI / 2; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
  const LID = '#3a1a1e';
  const EYE_AZ = 25, EYE_POL = 100;
  // Q판 눈: 큰 세로 타원 · 홍채 그라데이션(위는 진하게, 아래는 분홍 반사) · 굵은 윗 속눈썹 · 반짝이
  function drawEye(g, x, y, s, l, kind) {
    const ic = l.eyeColor != null ? l.eyeColor : 0x6a3a2a;
    g.lineCap = 'round'; g.lineJoin = 'round';
    const arc = (up, lw = 8) => { g.strokeStyle = LID; g.lineWidth = lw; g.beginPath(); if (up) { g.moveTo(x - 24, y + 6); g.quadraticCurveTo(x, y - 22, x + 24, y + 6); } else { g.moveTo(x - 24, y - 2); g.quadraticCurveTo(x, y + 16, x + 24, y - 2); } g.stroke(); };
    if (kind === 'happy') return arc(true);
    if (kind === 'closed') return arc(false);
    if (kind === 'x') { g.strokeStyle = LID; g.lineWidth = 8; g.beginPath(); g.moveTo(x + s * 16, y - 15); g.lineTo(x - s * 13, y); g.lineTo(x + s * 16, y + 15); g.stroke(); return; }
    if (kind === 'heart') { g.fillStyle = '#ff4f7b'; heart(g, x, y - 2, 22); g.fillStyle = '#fff'; circle(g, x - 7, y - 8, 4); return; }
    if (kind === 'bean' || kind === 'dot') {   // 까만 콩 눈 + 큰 하이라이트
      const r = kind === 'dot' ? 0.55 : 1;
      g.fillStyle = '#1e1416'; ellipse(g, x, y, 36 * r, 44 * r);
      g.fillStyle = '#fff'; ellipse(g, x - 11 * r, y - 15 * r, 13 * r, 15 * r, -0.3); circle(g, x + 13 * r, y + 14 * r, 6 * r); circle(g, x + 5 * r, y - 25 * r, 3.5 * r);
      if (kind === 'bean') { g.strokeStyle = '#1e1416'; g.lineWidth = 4; g.beginPath(); g.moveTo(x + s * 22, y - 20); g.quadraticCurveTo(x + s * 30, y - 26, x + s * 34, y - 22); g.stroke(); }
      return;
    }
    const W = 41, H = 58;
    g.save();
    const lidClip = (yo, yi, c) => { g.beginPath(); g.moveTo(x - s * 60, y + 70); g.lineTo(x + s * 60, y + 70); g.lineTo(x + s * 60, y + yo); g.quadraticCurveTo(x, y + c, x - s * 60, y + yi); g.closePath(); g.clip(); };
    if (kind === 'sleepy') lidClip(-6, -6, -8);
    if (kind === 'droopy' || kind === 'sad') lidClip(-8, -36, -30);
    if (kind === 'sharp' || kind === 'glare') lidClip(-36, -8, -25);
    if (kind === 'smug') lidClip(-14, -14, -17);
    g.beginPath(); g.ellipse(x, y, W, H, 0, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill(); g.clip();
    // 홍채
    const cx = x - s * 1.5, cy = y + 3, rx = W * 0.86, ry = H * 0.94;
    const grd = g.createLinearGradient(0, cy - ry, 0, cy + ry);
    grd.addColorStop(0, hex(shade(ic, 0.32))); grd.addColorStop(0.42, hex(shade(ic, 0.85))); grd.addColorStop(0.72, hex(shade(ic, 1.35))); grd.addColorStop(1, hex(mix(shade(ic, 1.5), 0xff8fb0, 0.55)));
    g.fillStyle = grd; ellipse(g, cx, cy, rx, ry);
    g.fillStyle = hex(shade(ic, 0.22)); ellipse(g, cx, cy - 4, rx * 0.38, ry * 0.42);
    g.fillStyle = 'rgba(20,10,20,0.35)'; ellipse(g, cx, cy - ry * 0.85, rx * 1.1, ry * 0.32);
    g.strokeStyle = hex(shade(ic, 0.3)); g.lineWidth = 2.5; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.stroke();
    // 반짝이
    g.fillStyle = '#fff';
    if (kind === 'sparkle' || kind === 'star') { star(g, cx - 10, cy - 15, 15); circle(g, cx + 13, cy + 17, 5.5); circle(g, cx + 11, cy - 23, 3.5); }
    else { ellipse(g, cx - 12, cy - 17, 12, 15, -0.35); circle(g, cx + 13, cy + 17, 5.5); circle(g, cx + 9, cy - 24, 3); }
    g.restore();
    // 윗 속눈썹 (굵게 + 바깥 꼬리)
    g.strokeStyle = LID; g.fillStyle = LID; g.lineWidth = 11;
    g.beginPath();
    if (kind === 'sleepy') { g.moveTo(x - W, y - 5); g.quadraticCurveTo(x, y - 11, x + W, y - 5); }
    else if (kind === 'droopy' || kind === 'sad') { g.moveTo(x - s * W * 0.95, y - 38); g.quadraticCurveTo(x, y - 42, x + s * W * 1.05, y - 10); }
    else if (kind === 'sharp' || kind === 'glare') { g.moveTo(x - s * W, y - 10); g.quadraticCurveTo(x, y - 32, x + s * W * 1.08, y - 39); }
    else if (kind === 'smug') { g.moveTo(x - W, y - 14); g.quadraticCurveTo(x, y - 19, x + W, y - 14); }
    else { g.moveTo(x - s * W * 1.02, y - H * 0.28); g.quadraticCurveTo(x - s * W * 0.2, y - H * 1.18, x + s * W * 1.06, y - H * 0.42); }
    g.stroke();
    if (kind !== 'sleepy' && kind !== 'smug') { g.beginPath(); const tx = x + s * W * 1.02, ty = kind === 'sharp' || kind === 'glare' ? y - 39 : kind === 'droopy' || kind === 'sad' ? y - 10 : y - H * 0.42; g.moveTo(tx - s * 6, ty - 6); g.lineTo(tx + s * 16, ty - (kind === 'droopy' ? -3 : 9)); g.lineTo(tx - s * 3, ty + 7); g.closePath(); g.fill(); }
    if (l.lashes) { g.lineWidth = 5; for (const [dx, dy] of [[0.7, -0.85], [0.9, -0.62]]) { g.beginPath(); g.moveTo(x + s * W * dx, y + H * dy); g.lineTo(x + s * (W * dx + 10), y + H * dy - 11); g.stroke(); } }
    // 아래 속눈썹 점
    g.strokeStyle = 'rgba(120,50,60,0.55)'; g.lineWidth = 3;
    for (const k of [0.55, 0.8]) { g.beginPath(); g.moveTo(x + s * W * k, y + H * 0.88); g.lineTo(x + s * (W * k + 3), y + H * 0.88 + 6); g.stroke(); }
    if (l.mole && ((l.mole === 'L' && s < 0) || (l.mole === 'R' && s > 0))) { g.fillStyle = '#5a3426'; circle(g, x + s * 22, y + 44, 3.2); }
  }
  function drawMouthAC(g, style, x, y) {
    const D = (w, h) => {
      g.fillStyle = '#9a2e3e'; g.beginPath(); g.moveTo(x - w, y - h * 0.25); g.quadraticCurveTo(x, y - h * 0.35, x + w, y - h * 0.25); g.quadraticCurveTo(x + w * 0.85, y + h, x, y + h); g.quadraticCurveTo(x - w * 0.85, y + h, x - w, y - h * 0.25); g.fill();
      g.save(); g.clip(); g.fillStyle = '#ff8a9a'; ellipse(g, x, y + h * 0.95, w * 0.62, h * 0.5); g.restore();
    };
    g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#7a3a36';
    switch (style) {
      case 'grin': D(15, 15); break;
      case 'open': D(11, 11); break;
      case 'smile': g.lineWidth = 4; g.beginPath(); g.moveTo(x - 10, y - 1); g.quadraticCurveTo(x, y + 8, x + 10, y - 1); g.stroke(); break;
      case 'w': g.lineWidth = 4; g.beginPath(); g.moveTo(x - 12, y - 2); g.quadraticCurveTo(x - 6, y + 7, x, y); g.quadraticCurveTo(x + 6, y + 7, x + 12, y - 2); g.stroke(); break;
      case 'flat': g.lineWidth = 4; g.beginPath(); g.moveTo(x - 7, y + 2); g.lineTo(x + 7, y + 2); g.stroke(); break;
      case 'pout': g.lineWidth = 4; g.beginPath(); g.moveTo(x - 8, y + 4); g.quadraticCurveTo(x, y - 4, x + 8, y + 4); g.stroke(); break;
      case 'tooth': D(12, 12); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x + 4, y - 3); g.lineTo(x + 9, y - 3); g.lineTo(x + 6.5, y + 3); g.fill(); break;
      case 'none': break;
      default: M.drawMouth(g, style, x, y, 0.5);
    }
  }
  const fcache = new Map();
  function faceTexture(l, blink, small) {
    const key = ['qf', l.eyes, l.eyeKit, l.eyeColor, l.brows, l.mouth, l.blush, l.skin, l.hair, l.fx || '', l.lashes ? 1 : 0, l.mole || '', l.freckles ? 1 : 0, blink ? 1 : 0, small ? 1 : 0].join('|');
    if (fcache.has(key)) return fcache.get(key);
    if (fcache.size > 240) { const k0 = fcache.keys().next().value; fcache.get(k0).dispose(); fcache.delete(k0); }
    const cv = document.createElement('canvas'); cv.width = small ? CW / 2 : CW; cv.height = small ? CH / 2 : CH;
    const g = cv.getContext('2d'); if (small) g.scale(0.5, 0.5);
    g.fillStyle = hex(l.skin); g.fillRect(0, 0, CW, CH);
    // 볼터치 (눈 바로 아래 분홍 타원)
    if (l.blush !== 'none') { const bc = typeof l.blush === 'number' ? l.blush : 0xff8fa0; for (const az of [-30, 30]) { const x = X(az), y = Y(114); const gr = g.createRadialGradient(x, y, 0, x, y, 30); gr.addColorStop(0, hex(bc) + '90'); gr.addColorStop(0.55, hex(bc) + '45'); gr.addColorStop(1, hex(bc) + '00'); g.fillStyle = gr; ellipse(g, x, y, 32, 18); } }
    if (l.freckles) { g.fillStyle = 'rgba(150,85,55,0.5)'; for (const [az, p] of [[-30, 108], [-36, 110], [-26, 112], [30, 108], [36, 110], [26, 112]]) circle(g, X(az), Y(p), 2.6); }
    const ex = [X(-EYE_AZ), X(EYE_AZ)], ey = Y(EYE_POL);
    // 눈썹 (짧고 가늘게)
    const browC = hex(shade(l.hair, l.hair < 0x404040 ? 1.3 : 0.78));
    g.strokeStyle = browC; g.fillStyle = browC; g.lineCap = 'round';
    const by = Y(78);
    for (const [i, x] of ex.entries()) {
      const s = i === 0 ? -1 : 1, b = l.brows || 'thin';
      if (b === 'none') continue;
      g.lineWidth = b === 'thick' ? 7 : 4;
      g.beginPath();
      if (b === 'angry') { g.moveTo(x + s * 16, by - 8); g.lineTo(x - s * 14, by + 6); }
      else if (b === 'worried') { g.moveTo(x + s * 16, by + 6); g.lineTo(x - s * 14, by - 7); }
      else if (b === 'dots') { ellipse(g, x - s * 3, by, 7, 5); continue; }
      else { g.moveTo(x - 13, by + 2); g.quadraticCurveTo(x, by - 5, x + 13, by + 2); }
      g.stroke();
    }
    const map = { dot: l.eyeKit || 'round', round: 'round', sparkle: 'sparkle', star: 'star', happy: 'happy', closed: 'closed', sleepy: 'sleepy', smug: 'smug', wink: 'wink', sad: 'sad', shock: 'shock', heart: 'heart', x: 'x', glare: 'glare' };
    const kind = map[l.eyes] || l.eyeKit || 'round';
    ex.forEach((x, i) => {
      const s = i === 0 ? -1 : 1;
      if (blink && kind !== 'happy' && kind !== 'closed') return drawEye(g, x, ey, s, l, 'closed');
      if (kind === 'wink') return drawEye(g, x, ey, s, l, i === 1 ? 'happy' : (l.eyeKit || 'round'));
      drawEye(g, x, ey, s, l, kind);
    });
    drawMouthAC(g, l.mouth || 'smile', X(0), Y(MOUTH_POL));
    if (l.fx) M.drawFx(g, CW, CH, l.fx, ex, ey);
    const t = srgb(new THREE.CanvasTexture(cv)); t.anisotropy = 4;
    fcache.set(key, t);
    return t;
  }

  // =========================================================
  // 헤어 (머리 로컬 좌표)
  // =========================================================
  const azOf = (x, z) => Math.atan2(x, z) / D2R;
  function hairSDF(sp) {
    const R = sp.r || [0.53, 0.51, 0.51];
    const L = sp.L, k = sp.k || 0.022;
    if (!sp.gro && L.gro) sp.gro = L.gro;
    const dr = sp.drape;
    return (x, y, z) => {
      const az = azOf(x, z + 0.01);
      let d = sEll(x, y, z, 0, 0.06, -0.02, R[0], R[1], R[2]);
      const pol = Math.acos(clamp((y - 0.02) / (hyp(x, y - 0.02, z) || 1), -1, 1)) / D2R;
      if (sp.bump) d -= sp.bump(az, y, pol);
      // 가닥 사이 홈 (앞머리 덩어리가 갈라져 보이게)
      if (sp.gro) { const f = ((az * sp.gro[0] / 360 + (sp.gro[1] || 0)) % 1 + 1) % 1; d += 0.016 * Math.pow(A(f * 2 - 1), 10) * sstep(25, 55, pol) * (A(az) < 110 ? 1 : 0.4); }
      d = smax(d, (pol - L(az)) * D2R * 0.45, k);
      if (dr) {
        const yEnd = typeof dr.y === 'function' ? dr.y(az) : dr.y;
        const t = sstep(yEnd + 0.16, yEnd, y);
        const sc = 1 - (dr.curl || 0) * t + (dr.flare || 0) * clamp(-y, 0, 1);
        const wave = dr.wave ? Math.sin(y * dr.wave[0]) * dr.wave[1] : 0;
        const rx = R[0] * (dr.w || 1) * sc + wave, rz = R[2] * (dr.d || 1) * sc + wave;
        const dc = (hyp(x / rx, (z + 0.03) / rz) - 1) * Math.min(rx, rz);
        let e = A(dc + dr.t / 2) - dr.t / 2;
        e = smax(e, y - 0.12, 0.03);
        e = smax(e, yEnd - y, 0.05);
        e = smax(e, ((dr.fw || 50) - A(az)) * D2R * 0.45, 0.085);
        d = smin(d, e, 0.06);
      }
      if (sp.part != null) d = smax(d, -sCone(x, y, z, Math.sin(sp.part * D2R) * 0.22, 0.6, 0.32, Math.sin(sp.part * D2R) * 0.04, 0.55, -0.12, 0.014, 0.008), 0.012);
      // 얼굴 옆으로 내려오는 뾰족한 옆머리
      if (sp.locks) for (const [laz, el0, yEnd, r, out] of sp.locks) for (const sg of (sp.oneSide ? [1] : [-1, 1])) {
        const p0 = surf(sg * laz, el0, 0.05), x1 = p0[0] * (out || 1.08), z1 = p0[2] * 0.85 + 0.02;
        d = smin(d, sCone(x, y, z, p0[0], p0[1], p0[2], x1, yEnd, z1, r, 0.012), 0.05);
      }
      // 바보털
      if (sp.ahoge) { d = smin(d, sCone(x, y, z, 0.02, 0.55, 0.08, 0.06, 0.74, 0.14, 0.035, 0.016), 0.03); d = smin(d, sCone(x, y, z, 0.06, 0.74, 0.14, 0.16, 0.76, 0.24, 0.016, 0.006), 0.02); }
      if (sp.extra) for (const [fn, kk] of sp.extra) d = smin(d, fn(x, y, z), kk);
      return d;
    };
  }
  const prof = (bang, side, back, bw = 52) => { const fn = a => {
    const x = A(a);
    return x < bw ? bang(a) : x < 105 ? lerp(bang(Math.sign(a) * bw), side, sstep(bw, bw + 22, x)) : lerp(side, back, sstep(105, 150, x));
  }; fn.gro = bang.gro; return fn; };
  const scal = (base, amp, n) => a => base + amp * A(Math.sin(a * D2R * n));
  const sph = (cx, cy, cz, r) => (x, y, z) => sSph(x, y, z, cx, cy, cz, r);
  const ell = (cx, cy, cz, rx, ry, rz) => (x, y, z) => sEll(x, y, z, cx, cy, cz, rx, ry, rz);
  const cone = (a, b, r1, r2) => (x, y, z) => sCone(x, y, z, a[0], a[1], a[2], b[0], b[1], b[2], r1, r2);
  const mirror = fn => (x, y, z) => fn(A(x), y, z);
  const chain = (pts, r0, r1) => (x, y, z) => { let d = 1e9; pts.forEach((p, i) => { d = smin(d, sSph(x, y, z, p[0], p[1], p[2], lerp(r0, r1, i / (pts.length - 1))), 0.03); }); return d; };
  const surf = (az, el, off = 0.06) => { const a = az * D2R, e = el * D2R, r = 0.44 + off; return [Math.sin(a) * Math.cos(e) * r, 0.04 + Math.sin(e) * r, Math.cos(a) * Math.cos(e) * r - 0.02]; };
  const spikeAt = (az, el, len, r, tilt = 0) => cone(surf(az, el, 0.0), surf(az, el + tilt, len), r, 0.012);
  const polOf = (x, y, z) => Math.acos(clamp((y - 0.05) / (hyp(x, y - 0.05, z) || 1), -1, 1)) / D2R;

  // 뾰족한 가닥 앞머리: n 가닥, 가닥 끝이 아래로 뾰족하게 (amp 만큼 길어짐)
  const spikes = (base, amp, n, phase = 0, sharp = 1.25) => { const fn = a => { const f = ((a * n / 360 + phase) % 1 + 1) % 1; return base + amp * Math.pow(1 - A(f * 2 - 1), sharp); }; fn.gro = [n, phase]; return fn; };
  const sweep = (fn, k) => { const f2 = a => fn(a) + clamp(a + 50, 0, 100) * k; f2.gro = fn.gro; return f2; };
  const HAIR = {
    // ---------------- 여자 ----------------
    bobbang: { L: prof(spikes(66, 12, 14), 104, 110), locks: [[60, 30, -0.3, 0.07]], drape: { y: a => -0.32 - (A(a) > 120 ? 0.05 : 0), t: 0.08, fw: 56, curl: 0.06 } },
    longbang: { L: prof(spikes(64, 13, 12), 104, 108), locks: [[58, 30, -0.42, 0.075], [72, 26, -0.55, 0.08]], drape: { y: -0.82, t: 0.08, fw: 54, flare: 0.06 }, ahoge: true },
    longwave: { L: prof(sweep(spikes(56, 13, 9, 0.2), 0.16), 104, 108, 56), part: -26, locks: [[60, 26, -0.5, 0.08, 1.12]], drape: { y: -0.74, t: 0.085, fw: 50, wave: [13, 0.024], flare: 0.08 } },
    hime: { L: prof(spikes(70, 6, 22, 0, 1), 102, 108, 50), drape: { y: a => A(a) < 80 ? -0.24 : -0.84, t: 0.08, fw: 52 } },
    sidelong: { L: prof(sweep(spikes(52, 13, 11), 0.28), 104, 108, 58), part: -32, locks: [[64, 28, -0.48, 0.075]], drape: { y: -0.66, t: 0.08, fw: 52, curl: -0.08 } },
    pony: { L: prof(spikes(56, 15, 11, 0.5), 100, 110), locks: [[58, 28, -0.24, 0.05]], extra: [[sph(0, 0.38, -0.44, 0.08), 0.03], [cone([0, 0.36, -0.5], [0, 0.02, -0.7], 0.1, 0.12), 0.04], [cone([0, 0.02, -0.7], [0, -0.44, -0.62], 0.12, 0.02), 0.05]], ahoge: true },
    twintail: { L: prof(spikes(64, 13, 12), 104, 110), locks: [[60, 28, -0.22, 0.05]], extra: [[mirror(cone([0.42, 0.06, -0.18], [0.66, -0.12, -0.26], 0.09, 0.08)), 0.04], [mirror(cone([0.66, -0.12, -0.26], [0.6, -0.62, -0.2], 0.08, 0.015)), 0.05]] },
    bun: { L: prof(spikes(56, 13, 9, 0.5), 100, 108), locks: [[60, 28, -0.3, 0.04]], extra: [[sph(0, 0.58, -0.12, 0.16), 0.05]] },
    braids: { L: prof(spikes(66, 11, 12), 104, 110), part: 0, extra: [[mirror(chain([[0.44, -0.1, -0.06], [0.46, -0.2, -0.02], [0.47, -0.3, 0.01], [0.48, -0.4, 0.03], [0.48, -0.5, 0.05], [0.48, -0.6, 0.06]], 0.07, 0.045)), 0.03]] },
    pixie: { L: prof(sweep(spikes(62, 13, 12), 0.12), 98, 108, 56), locks: [[66, 26, -0.16, 0.05]], ahoge: true },
    curlybob: { L: prof(spikes(66, 11, 11), 102, 108), drape: { y: -0.3, t: 0.08, fw: 54 }, extra: [[(x, y, z) => { const az = azOf(x, z); if (A(az) < 50) return 1; return sTorY(x, y, z + 0.03, 0, -0.31, 0, 0.5, 0.09) - 0.014 * Math.sin(az * D2R * 12); }, 0.05]] },
    curtainmid: { L: prof(a => 50 + Math.min(A(a), 42) * 0.7 + (A(a) > 20 ? 6 * Math.pow(1 - A(((A(a) * 6 / 360) % 1) * 2 - 1), 1.6) : 0), 104, 110, 50), part: 0, locks: [[54, 28, -0.4, 0.07]], drape: { y: -0.5, t: 0.08, fw: 48, curl: -0.05 } },
    odango: { L: prof(spikes(66, 12, 12), 102, 108), locks: [[60, 28, -0.26, 0.05]], extra: [[mirror(sph(0.31, 0.5, -0.04, 0.14)), 0.04]] },
    lowbun: { L: prof(sweep(spikes(52, 11, 9), 0.18), 100, 110), part: -24, locks: [[62, 28, -0.3, 0.045]], extra: [[ell(0, -0.16, -0.5, 0.16, 0.14, 0.13), 0.06]] },
    halfup: { L: prof(spikes(64, 13, 12), 104, 108), locks: [[58, 28, -0.45, 0.075]], drape: { y: -0.76, t: 0.08, fw: 54 }, extra: [[sph(0, 0.18, -0.54, 0.09), 0.04]] },
    // ---------------- 남자 ----------------
    boyshort: { L: prof(spikes(64, 14, 11, 0.1), 96, 108, 56), locks: [[70, 22, -0.1, 0.05]], ahoge: true },
    spiky: { L: prof(spikes(66, 15, 11), 100, 112), extra: [[spikeAt(0, 64, 0.24, 0.1, 18), 0.04], [spikeAt(-38, 58, 0.22, 0.09, 14), 0.04], [spikeAt(38, 58, 0.22, 0.09, 14), 0.04], [spikeAt(-82, 44, 0.2, 0.09, 6), 0.04], [spikeAt(82, 44, 0.2, 0.09, 6), 0.04], [spikeAt(-130, 38, 0.18, 0.1, 0), 0.04], [spikeAt(130, 38, 0.18, 0.1, 0), 0.04], [spikeAt(180, 46, 0.18, 0.1, -6), 0.04], [spikeAt(-160, 70, 0.16, 0.09, 4), 0.04], [spikeAt(160, 70, 0.16, 0.09, 4), 0.04]] },
    sideswept: { L: prof(a => 58 + clamp(a + 40, 0, 90) * 0.42 + 6 * Math.pow(1 - A(((((a + 180) * 7 / 360) % 1) * 2 - 1)), 1.7), 98, 110, 60), part: -42, locks: [[66, 24, -0.18, 0.05]] },
    centerpart: { L: prof(a => 52 + Math.min(A(a), 36) * 0.9 + 5 * Math.pow(1 - A((((A(a) * 7 / 360) % 1) * 2 - 1)), 1.7), 100, 112, 52), part: 0, locks: [[62, 24, -0.22, 0.06]] },
    shaggy: { L: prof(spikes(70, 15, 14), 112, 118), drape: { y: a => -0.24 + Math.pow(1 - A(((((a + 180) * 9 / 360) % 1) * 2 - 1)), 2) * -0.1, t: 0.07, fw: 60 }, extra: [[spikeAt(150, -18, 0.14, 0.07, -10), 0.04], [spikeAt(-150, -18, 0.14, 0.07, -10), 0.04], [spikeAt(180, -24, 0.14, 0.07, -10), 0.04], [spikeAt(-60, 60, 0.16, 0.08, 10), 0.04], [spikeAt(40, 66, 0.16, 0.08, 10), 0.04], [spikeAt(140, 56, 0.15, 0.08, 6), 0.04]], ahoge: true },
    buzz: { r: [0.47, 0.455, 0.455], L: prof(() => 50, 94, 108), k: 0.02 },
    slick: { L: prof(a => 46 + 4 * Math.pow(1 - A((((a + 180) * 6 / 360) % 1) * 2 - 1), 1.5), 96, 110), part: -36, extra: [[ell(-0.04, 0.44, 0.18, 0.3, 0.15, 0.22), 0.12], [spikeAt(30, 30, 0.1, 0.05, -20), 0.03]] },
    curlyshort: { r: [0.55, 0.53, 0.53], L: prof(spikes(64, 11, 14), 100, 112), bump: (az, y, pol) => 0.024 * Math.pow(A(Math.sin(az * D2R * 7) * Math.sin(pol * D2R * 8)), 0.6) },
    manbun: { L: prof(sweep(spikes(48, 11, 9), 0.1), 98, 108), part: 24, extra: [[sph(0, 0.42, -0.4, 0.1), 0.04]] },
    bowl: { r: [0.55, 0.52, 0.53], L: prof(spikes(70, 12, 16), 100, 112) },
    wavyshort: { L: prof(spikes(62, 15, 9, 0.25), 100, 112), bump: (az, y) => Math.sin(az * D2R * 9) * 0.014 * clamp(y + 0.2, 0, 1), locks: [[66, 24, -0.2, 0.06]] },
    mohawk: { r: [0.47, 0.45, 0.455], L: prof(() => 48, 92, 104), extra: [[ell(0, 0.5, -0.02, 0.07, 0.16, 0.44), 0.06]] },
    tiedlong: { L: prof(sweep(spikes(58, 13, 11), 0.16), 104, 112, 56), part: -24, locks: [[64, 26, -0.3, 0.06]], extra: [[cone([0, -0.16, -0.5], [0, -0.64, -0.48], 0.08, 0.02), 0.05]] },
    cloud: { r: [0.6, 0.56, 0.58], L: prof(a => 56 + A(Math.sin(a * D2R * 6)) * 6, 106, 116), bump: (az, y, pol) => 0.035 * Math.pow(A(Math.sin(az * D2R * 6) * Math.sin(pol * D2R * 7)), 0.5) },
    grandpa: { L: () => 0, extra: [[(x, y, z) => { if (A(azOf(x, z)) < 70) return 1; return sEll(A(x), y, z, 0.4, -0.04, -0.14, 0.12, 0.13, 0.28); }, 0.05], [ell(0, -0.02, -0.42, 0.3, 0.13, 0.12), 0.05]] },
  };
  const HAIR_NAMES = {
    bobbang: '일자 단발', longbang: '긴 생머리', longwave: '긴 웨이브', hime: '히메컷', sidelong: '옆가르마 롱', pony: '포니테일', twintail: '양갈래', bun: '똥머리', braids: '양 땋은 머리',
    pixie: '숏컷', curlybob: '뽀글 단발', curtainmid: '커튼뱅 중단발', odango: '양쪽 똥머리', lowbun: '쪽머리', halfup: '반묶음',
    boyshort: '기본 숏', spiky: '삐죽 머리', sideswept: '옆으로 넘긴 머리', centerpart: '5:5 가르마', shaggy: '덥수룩 미디엄', buzz: '버즈컷', slick: '올백', curlyshort: '곱슬 숏',
    manbun: '맨번', bowl: '바가지 머리', wavyshort: '웨이브 숏', mohawk: '모히칸', tiedlong: '묶은 장발', cloud: '뭉게 파마', grandpa: '할아버지 머리',
  };
  Object.assign(OPT.hairStyle, HAIR_NAMES);
  const LEGACY = { short: 'boyshort', bob: 'bobbang', long: 'longbang', ponytail: 'pony', pigtails: 'twintail', twinbun: 'odango', afro: 'cloud', curly: 'curlyshort', sidepart: 'sideswept' };
  function hairGeo(style, hatOn) {
    const sp = hatOn && HAIR[style].ahoge ? Object.assign({}, HAIR[style], { ahoge: false }) : HAIR[style];
    if (sp !== HAIR[style]) style += ':nohg';
    const lowest = sp.drape ? -0.92 : sp.extra ? -0.8 : -0.5;
    return sdfGeo('hair:' + style, hairSDF(sp), [-0.72, lowest, -0.78], [0.72, 0.75, 0.62], 0.017, g => {
      const n = g.attributes.normal, p = g.attributes.position, c = g.attributes.color.array, uv = new Float32Array(n.count * 2);
      for (let i = 0; i < n.count; i++) {
        const ny = n.getY(i), band = Math.exp(-Math.pow((ny - 0.6) / 0.13, 2)) * (p.getZ(i) > -0.15 ? 1 : 0.45);
        const k = (0.97 + band * 0.32 - (ny < -0.2 ? 0.06 : 0)) * c[i * 3];
        c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = k;
        // 머릿결 UV: 방위각(가로) × 정수리에서 내려오는 거리(세로)
        uv[i * 2] = (Math.atan2(p.getX(i), p.getZ(i)) / (Math.PI * 2) + 0.5) * 6;
        uv[i * 2 + 1] = Math.acos(clamp((p.getY(i) - 0.05) / (hyp(p.getX(i), p.getY(i) - 0.05, p.getZ(i)) || 1), -1, 1)) * 1.2 + Math.max(0, -p.getY(i)) * 2;
      }
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    });
  }

  // =========================================================
  // 몸 (body 로컬 좌표: 바닥 y = -0.07)
  // =========================================================
  const DZ = 0.78;
  function torsoSDF(kind) {
    const dress = kind === 'dress', coat = kind === 'coat', hood = kind === 'hoodie', puff = kind === 'puffer', sleeveless = kind === 'tank';
    const bottom = dress ? 0.08 : coat ? 0.1 : 0.2;
    return (x, y, z) => {
      const zz = z / DZ;
      let d = sEll(x, y, zz, 0, 0.39, 0, 0.152, 0.18, 0.15) * 0.9;
      d = smin(d, sCone(x, y, zz, 0, 0.23, 0, 0, 0.43, 0, 0.168, 0.13) * 0.88, 0.06);
      d = smin(d, sSph(A(x), y, z, sleeveless ? 0.1 : 0.118, 0.5, 0, sleeveless ? 0.055 : 0.066), 0.05);
      if (dress) d = smin(d, sCone(x, y, z / 0.84, 0, 0.36, 0, 0, 0.08, 0, 0.15, 0.27) * 0.86, 0.05);
      if (coat) d = smin(d, sCone(x, y, zz, 0, 0.36, 0, 0, 0.1, 0, 0.16, 0.205) * 0.86, 0.05);
      if (hood) d = smin(d, sTorY(x, y, z, 0, 0.57, -0.05, 0.085, 0.045), 0.04);
      if (puff) for (const yy of [0.3, 0.41]) d = smin(d, sTorY(x, y, zz, 0, yy, 0, 0.16 - (yy - 0.3) * 0.15, 0.028), 0.03);
      d = smax(d, bottom - y, 0.02);
      d = smax(d, y - 0.585, 0.03);
      return d;
    };
  }
  function shellSDF(kind) {
    const base = torsoSDF(kind === 'coat' ? 'coat' : 'tee');
    const gap = kind === 'cardigan' ? 0.03 : 0.045;
    return (x, y, z) => {
      let d = base(x, y, z) - 0.013;
      d = A(d + 0.012) - 0.012;
      d = smax(d, -Math.max(A(x) - gap - (0.56 - y) * 0.12, -z), 0.012);
      return d;
    };
  }
  function bottomSDF(kind) {
    return (x, y, z) => {
      const zz = z / 0.82;
      let d;
      if (kind === 'skirt') { d = sCone(x, y, zz, 0, 0.3, 0, 0, 0.12, 0, 0.165, 0.24) * 0.86; d = smax(d, 0.11 - y, 0.02); }
      else if (kind === 'pleats') { d = sCone(x, y, zz, 0, 0.3, 0, 0, 0.12, 0, 0.165, 0.245) * 0.86; d -= Math.sin(Math.atan2(x, z) * 22) * 0.006 * clamp((0.3 - y) * 6, 0, 1); d = smax(d, 0.11 - y, 0.015); }
      else if (kind === 'longskirt') { d = sCone(x, y, zz, 0, 0.3, 0, 0, -0.03, 0, 0.165, 0.27) * 0.86; d = smax(d, -0.04 - y, 0.02); }
      else { d = sCone(x, y, zz, 0, 0.25, 0, 0, 0.18, 0, 0.15, 0.152) * 0.9; d = smin(d, sCone(A(x), y, zz, 0.074, 0.19, 0, 0.074, 0.13, 0, 0.068, 0.066), 0.04); d = smax(d, 0.13 - y, 0.02); }
      d = smax(d, y - 0.31, 0.02);
      return d;
    };
  }
  const legSkinSDF = (x, y, z) => sCone(x, y, z, 0, 0.0, 0, 0, -0.27, 0, 0.05, 0.042);
  function pantLegSDF(kind) {
    const end = kind === 'shorts' ? -0.09 : -0.24;
    return (x, y, z) => { let d = sCone(x, y, z, 0, 0.02, 0, 0, end, 0, 0.066, kind === 'wide' ? 0.075 : 0.06); d = smax(d, end - y, 0.012); d = smax(d, y - 0.04, 0.02); if (kind === 'jeans') d = smin(d, sTorY(x, y, z, 0, end + 0.012, 0, 0.058, 0.016), 0.01); return d; };
  }
  function shoeSDF(kind) {
    return (x, y, z) => {
      let d = sEll(x, y, z, 0, -0.29, 0.03, 0.06, 0.045, 0.088);
      d = smin(d, sCone(x, y, z, 0, kind === 'boots' ? -0.13 : -0.25, 0, 0, -0.29, 0, 0.053, 0.056), 0.035);
      d = smax(d, -0.333 - y, 0.012);
      if (kind === 'sandal') d = smax(d, y + 0.3, 0.01);
      return d;
    };
  }
  const soleSDF = (x, y, z) => smax(sEll(x, y, z, 0, -0.325, 0.03, 0.064, 0.02, 0.092), -0.335 - y, 0.006);
  const armSkinSDF = (x, y, z) => smin(sCone(x, y, z, 0, 0, 0, 0, -0.19, 0, 0.035, 0.032), sSph(x, y, z, 0, -0.235, 0.004, 0.053), 0.03);
  function sleeveSDF(kind) {
    const end = kind === 'long' ? -0.18 : -0.075;
    return (x, y, z) => smax(sCone(x, y, z, 0, 0.02, 0, 0, end, 0, 0.057, kind === 'long' ? 0.043 : 0.05), end - y, 0.01);
  }
  const cylUV = (y0, y1) => g => { const p = g.attributes.position, uv = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { uv[i * 2] = Math.atan2(p.getX(i), p.getZ(i)) / (Math.PI * 2) + 0.5; uv[i * 2 + 1] = (p.getY(i) - y0) / (y1 - y0); } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); };
  const torsoGeo = kind => sdfGeo('torso:' + kind, torsoSDF(kind), [-0.32, 0.02, -0.28], [0.32, 0.66, 0.28], 0.012, cylUV(0.05, 0.62));
  const shellGeo = kind => sdfGeo('shell:' + kind, shellSDF(kind), [-0.32, 0.05, -0.28], [0.32, 0.66, 0.28], 0.011);
  const bottomGeo = kind => sdfGeo('bottom:' + kind, bottomSDF(kind), [-0.32, -0.1, -0.3], [0.32, 0.34, 0.3], 0.012, cylUV(-0.05, 0.32));

  // 회색조 결 텍스처 (색은 재질 color 로 곱함)
  const texC = new Map();
  function grayTex(kind) {
    if (texC.has(kind)) return texC.get(kind);
    const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
    const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    g.fillStyle = '#fff'; g.fillRect(0, 0, N, N);
    if (kind === 'hair') {
      for (let x = 0; x < N; x++) { const v = 0.9 + rnd() * 0.1; g.fillStyle = `rgba(${v * 255 | 0},${v * 255 | 0},${v * 255 | 0},1)`; g.fillRect(x, 0, 1, N); }
      for (let i = 0; i < 60; i++) { const x = rnd() * N; g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x, 0, 1, N); }
      for (let i = 0; i < 24; i++) { const x = rnd() * N; g.fillStyle = 'rgba(60,40,30,0.14)'; g.fillRect(x, 0, 1.5, N); }
    } else if (kind === 'knit') {
      for (let x = 0; x < N; x += 8) { const gr = g.createLinearGradient(x, 0, x + 8, 0); gr.addColorStop(0, '#d8d8d8'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(1, '#d8d8d8'); g.fillStyle = gr; g.fillRect(x, 0, 8, N); }
      g.strokeStyle = 'rgba(0,0,0,0.06)'; for (let y = 0; y < N; y += 6) for (let x = 0; x < N; x += 8) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4, y + 4); g.lineTo(x + 8, y); g.stroke(); }
    } else if (kind === 'denim') {
      for (let i = -N; i < N * 2; i += 4) { g.strokeStyle = `rgba(0,0,30,${0.08 + rnd() * 0.08})`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + N, N); g.stroke(); }
      for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(rnd() * N, rnd() * N, 1, 2); }
    } else {
      for (let i = 0; i < 1400; i++) { const v = rnd(); g.fillStyle = `rgba(0,0,0,${v * 0.05})`; g.fillRect(rnd() * N, rnd() * N, 1, 1); }
      g.strokeStyle = 'rgba(0,0,0,0.03)'; for (let y = 0; y < N; y += 3) { g.beginPath(); g.moveTo(0, y); g.lineTo(N, y); g.stroke(); }
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    if (kind !== 'hair') t.repeat.set(8, 5);
    texC.set(kind, t); return t;
  }
  const FABRIC = { sweater: 'knit', cardigan: 'knit', puffer: 'cotton', jeans: 'denim', pinafore: 'denim' };
  function clothMat(l, color, accent, fab) {
    if (l.pattern && l.pattern !== 'plain') return soften(new THREE.MeshLambertMaterial({ map: srgb(M.patternTex(l.pattern, color, accent)), vertexColors: true }), 0.25);
    return matL(color, { vertexColors: true, map: grayTex(fab || 'cotton') });
  }
  function jerseyMat(color, accent, num, label) {
    const t = geo(`jt${color},${accent},${num},${label}`, () => {
      const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
      g.fillStyle = hex(color); g.fillRect(0, 0, 512, 256);
      g.fillStyle = hex(accent); g.textAlign = 'center';
      const n = String(num != null ? num : 10);
      g.font = 'bold 30px sans-serif'; g.fillText(label || 'FMIS', 256, 92);
      g.font = 'bold 84px sans-serif'; g.fillText(n, 256, 172);
      g.font = 'bold 72px sans-serif'; g.fillText(n, 0, 150); g.fillText(n, 512, 150);
      const tx = srgb(new THREE.CanvasTexture(c)); tx.anisotropy = 4; return tx;
    });
    return soften(new THREE.MeshLambertMaterial({ map: t, vertexColors: true }), 0.25);
  }

  // =========================================================
  // 조립
  // =========================================================
  Object.assign(OPT.top, { shirt: '셔츠', jacket: '재킷', coat: '코트', cardigan: '가디건', pinafore: '멜빵 원피스', jersey: '저지', sailor: '세일러', tank: '민소매', longtee: '긴팔 티', kimono: '유카타', puffer: '패딩', varsity: '야구점퍼', uniform: '제복' });
  Object.assign(OPT.bottom, { jeans: '청바지', longskirt: '롱스커트', pleats: '플리츠', cargo: '카고 팬츠', wide: '와이드 팬츠' });
  Object.assign(OPT.acc, { earring: '귀걸이', choker: '초커', tote: '에코백', camera: '목걸이 카메라', neckphones: '목 헤드폰', mustache: '콧수염', crossbag: '크로스백', pendant: '펜던트' });
  Object.assign(OPT.hat, { flowercrown: '꽃 화관', tiara: '티아라', bandana: '반다나', captain: '선장 모자', fedora: '페도라', hibiscus: '히비스커스', knit: '니트 비니', boater: '보터햇' });
  const HS = [1, 1, 1]; HS.yaw = EYE_AZ * D2R * 0.95; HS.th = 100 * D2R;

  function build(lookIn) {
    let l = ISLE.normalizeLook(lookIn);
    if (l.species !== 'human') l = ISLE.normalizeLook(ISLE.humanize(l, lookIn));
    const skinM = mat(l.skin);
    const root = new THREE.Group();
    const shapeG = new THREE.Group();
    shapeG.scale.set(l.width || 1, l.height || 1, l.width || 1);
    shapeG.position.y = 0.07;
    const body = new THREE.Group();
    shapeG.add(body); root.add(shapeG);
    const top = l.top;
    const onePiece = top === 'dress' || top === 'pinafore' || top === 'kimono';
    const bottom = onePiece ? 'none' : l.bottom;
    const longPants = ['pants', 'jeans', 'cargo', 'wide'].includes(bottom);
    const M_ = (k, f, mn, mx, c, m) => tag(new THREE.Mesh(sdfGeo(k, f, mn, mx, c), m));

    // ----- 다리 -----
    const makeLeg = side => {
      const pivot = new THREE.Group(); pivot.position.set(side * 0.072, 0.26, 0);
      PART = 'legs';
      pivot.add(M_('legSkin', legSkinSDF, [-0.08, -0.34, -0.08], [0.08, 0.06, 0.08], 0.008, l.legwear != null ? mat(l.legwear) : skinM));
      if (longPants || bottom === 'shorts') { PART = 'bottom'; const k = bottom === 'shorts' ? 'shorts' : bottom === 'jeans' ? 'jeans' : bottom === 'wide' ? 'wide' : 'pants'; pivot.add(tag(new THREE.Mesh(sdfGeo('pleg:' + k, pantLegSDF(k), [-0.1, -0.28, -0.1], [0.1, 0.07, 0.1], 0.008, cylUV(-0.3, 0.1)), clothMat(l.pattern ? Object.assign({}, l, { pattern: 'plain' }) : l, l.pants, 0, bottom === 'jeans' ? 'denim' : 'cotton')))); }
      if (l.socks != null) { PART = 'legs'; pivot.add(mesh(geo('acSock', () => new THREE.CylinderGeometry(0.047, 0.047, 0.07, 16)), mat(l.socks), 0, -0.235, 0)); }
      PART = 'shoes';
      const st = l.shoeType || 'sneaker';
      pivot.add(M_('shoe:' + st, shoeSDF(st), [-0.09, -0.36, -0.08], [0.09, -0.1, 0.14], 0.007, mat(l.shoes)));
      if (st === 'sneaker' || st === 'boots') pivot.add(M_('sole', soleSDF, [-0.09, -0.36, -0.08], [0.09, -0.29, 0.14], 0.006, mat(st === 'boots' ? shade(l.shoes, 0.55) : (l.sole != null ? l.sole : 0xffffff))));
      if (st === 'mary') pivot.add(mesh(box(0.11, 0.012, 0.018, 0.006), mat(l.shoes), 0, -0.262, 0.035, false));
      body.add(pivot);
      return pivot;
    };
    const legL = makeLeg(-1), legR = makeLeg(1);

    // ----- 몸통 -----
    PART = 'top';
    const OPEN = { jacket: 1, coat: 1, cardigan: 1, varsity: 1 };
    const tk = onePiece ? 'dress' : top === 'coat' ? 'coat' : top === 'hoodie' ? 'hoodie' : top === 'puffer' ? 'puffer' : (top === 'tank' || top === 'jersey') ? 'tank' : 'tee';
    let torsoM = clothMat(l, l.shirt, l.shirt2, FABRIC[top]);
    if (top === 'jersey') torsoM = jerseyMat(l.shirt, l.shirt2, l.jerseyNo, l.jerseyLabel);
    if (OPEN[top] || top === 'pinafore') torsoM = clothMat(top === 'pinafore' ? l : Object.assign({}, l, { pattern: 'plain' }), l.shirt2, l.shirt);
    body.add(tag(new THREE.Mesh(torsoGeo(OPEN[top] ? 'tee' : (top === 'pinafore' ? 'tee' : tk)), torsoM)));
    if (OPEN[top]) body.add(tag(new THREE.Mesh(shellGeo(top === 'coat' ? 'coat' : top), matL(l.shirt, { side: THREE.DoubleSide, vertexColors: true, map: grayTex(top === 'cardigan' ? 'knit' : top === 'jacket' && l.denim ? 'denim' : 'cotton') }))));
    PART = 'head';
    body.add(mesh(capsule(0.045, 0.08), skinM, 0, 0.61, 0));
    if (bottom !== 'none' && bottom) { PART = 'bottom'; const bk = ['skirt', 'pleats', 'longskirt'].includes(bottom) ? bottom : 'pants'; body.add(tag(new THREE.Mesh(bottomGeo(bk), clothMat(Object.assign({}, l, { pattern: l.bottomPattern || 'plain' }), l.pants, shade(l.pants, 1.25), bottom === 'jeans' ? 'denim' : 'cotton')))); }
    PART = 'top';
    const btn = (x, y, z, c = 0xf6f0e4) => body.add(mesh(sphere(0.011, 8, 6), mat(c), x, y, z, false));
    const fz = y => 0.15 * DZ - Math.max(0, y - 0.45) * 0.25;
    const collar = (c, open) => { for (const s of [-1, 1]) { const f = mesh(box(0.075, 0.022, 0.06, 0.01), mat(c), s * 0.045, 0.565, 0.075); f.rotation.set(-0.55, s * 0.55, s * (open ? 0.75 : 0.55)); body.add(f); } };
    switch (top) {
      case 'shirt': case 'aloha': collar(top === 'aloha' ? l.shirt : (l.shirt2 === l.shirt ? shade(l.shirt, 1.08) : l.shirt2)); for (const y of [0.48, 0.41, 0.34, 0.27]) btn(0, y, fz(y) + 0.008); break;
      case 'uniform': collar(l.shirt2); for (const y of [0.5, 0.42, 0.34, 0.26]) btn(0.035, y, fz(y) + 0.008, 0xd9b44a); { const b = mesh(geo('acUBelt', () => new THREE.TorusGeometry(0.163, 0.012, 6, 28)), mat(l.accColor), 0, 0.3, 0); b.rotation.x = Math.PI / 2; b.scale.y = DZ * 1.02; body.add(b); } break;
      case 'vest': collar(l.shirt2); for (const y of [0.45, 0.37, 0.29]) btn(0, y, fz(y) + 0.008, 0xd9b44a); break;
      case 'hoodie': for (const s of [-1, 1]) body.add(mesh(capsule(0.005, 0.06), mat(0xffffff), s * 0.035, 0.49, fz(0.49) + 0.01, false)); body.add(mesh(box(0.17, 0.065, 0.02, 0.018), mat(shade(l.shirt, 0.92)), 0, 0.3, fz(0.3) + 0.004)); break;
      case 'sailor': { const c = mat(l.shirt2); const b = mesh(box(0.2, 0.11, 0.012, 0.008), c, 0, 0.52, -0.1); b.rotation.x = 0.45; body.add(b); for (const s of [-1, 1]) { const f = mesh(box(0.045, 0.12, 0.012, 0.006), c, s * 0.045, 0.52, 0.1); f.rotation.set(-0.35, 0, -s * 0.5); body.add(f); } body.add(mesh(sphere(0.022), mat(l.accColor), 0, 0.46, fz(0.46) + 0.012)); break; }
      case 'jacket': case 'coat': for (const s of [-1, 1]) { const lp = mesh(box(0.04, 0.13, 0.014, 0.006), mat(shade(l.shirt, 0.9)), s * 0.06, 0.49, fz(0.49) + 0.012); lp.rotation.set(-0.3, 0, -s * 0.38); body.add(lp); } if (top === 'coat') { const b = mesh(geo('acCoatBelt', () => new THREE.TorusGeometry(0.17, 0.012, 6, 30)), mat(shade(l.shirt, 0.82)), 0, 0.31, 0); b.rotation.x = Math.PI / 2; b.scale.y = DZ * 1.08; body.add(b); } break;
      case 'cardigan': for (const y of [0.46, 0.39, 0.32, 0.25]) btn(0.05, y, fz(y) + 0.02, 0xffffff); break;
      case 'varsity': for (const y of [0.47, 0.39, 0.31]) btn(0.05, y, fz(y) + 0.02, 0xffffff); break;
      case 'pinafore': {
        const pc = l.pinColor != null ? l.pinColor : l.shirt, pm = mat(pc);
        body.add(M_('pinSkirt', (x, y, z) => { let d = sCone(x, y, z / 0.84, 0, 0.36, 0, 0, 0.08, 0, 0.162, 0.275) * 0.86; d = smax(d, 0.07 - y, 0.02); d = smax(d, y - 0.37, 0.02); return d; }, [-0.33, 0.0, -0.3], [0.33, 0.42, 0.3], 0.012, pm));
        body.add(mesh(box(0.15, 0.13, 0.02, 0.012), pm, 0, 0.42, fz(0.42) + 0.006));
        for (const s of [-1, 1]) { const st = mesh(capsule(0.011, 0.12), pm, s * 0.065, 0.51, 0.06, false); st.rotation.x = -0.75; body.add(st); btn(s * 0.06, 0.475, fz(0.475) + 0.016, 0xffd84a); }
        body.add(mesh(box(0.06, 0.045, 0.01, 0.006), mat(shade(pc, 0.88)), 0, 0.41, fz(0.41) + 0.018, false));
        break;
      }
      case 'kimono': { for (const s of [-1, 1]) { const f = mesh(box(0.035, 0.2, 0.012, 0.006), mat(l.shirt2), s * 0.03, 0.46, fz(0.46) + 0.004); f.rotation.set(-0.15, 0, s * 0.45); body.add(f); } const ob = mesh(geo('acObi', () => new THREE.CylinderGeometry(0.158, 0.165, 0.065, 28)), mat(l.accColor), 0, 0.34, 0); ob.scale.z = DZ * 1.05; body.add(ob); body.add(mesh(box(0.11, 0.07, 0.045, 0.02), mat(l.accColor), 0, 0.35, -0.13)); break; }
      case 'dress': if (l.bow) body.add(mesh(sphere(0.026), mat(l.accColor), 0, 0.53, 0.11)); break;
    }
    if (l.apron != null) body.add(M_('apron', (x, y, z) => { let d = sCone(x, y, z / 0.84, 0, 0.36, 0, 0, 0.1, 0, 0.17, 0.27) * 0.86 - 0.012; d = A(d + 0.006) - 0.006; d = smax(d, 0.1 - y, 0.01); d = smax(d, y - 0.34, 0.01); d = smax(d, -z + 0.02, 0.02); return d; }, [-0.34, 0.05, -0.1], [0.34, 0.4, 0.32], 0.01, matL(l.apron, { side: THREE.DoubleSide, vertexColors: true })));

    // ----- 팔 -----
    PART = 'arms';
    const sleeveKind = l.sleeve === 'none' || top === 'tank' || top === 'jersey' ? 'none' : (l.sleeve === 'long' || (l.sleeve !== 'short' && ['sweater', 'hoodie', 'longtee', 'shirt', 'jacket', 'coat', 'cardigan', 'varsity', 'puffer', 'kimono', 'uniform'].includes(top))) ? 'long' : 'short';
    const sleeveM = top === 'varsity' ? clothMat({}, l.shirt2, 0, 'knit') : OPEN[top] ? clothMat({}, l.shirt, 0, top === 'cardigan' ? 'knit' : 'cotton') : top === 'pinafore' ? clothMat(l, l.shirt2, l.shirt) : (top === 'jersey' ? mat(l.shirt) : clothMat(l, l.shirt, l.shirt2, FABRIC[top]));
    const makeArm = side => {
      const pivot = new THREE.Group(); pivot.position.set(side * 0.14, 0.52, 0);
      const inner = new THREE.Group(); inner.rotation.z = side * 0.48; pivot.add(inner);
      inner.add(M_('armSkin', armSkinSDF, [-0.08, -0.31, -0.08], [0.08, 0.06, 0.08], 0.0075, skinM));
      if (sleeveKind !== 'none') inner.add(tag(new THREE.Mesh(sdfGeo('sleeve:' + sleeveKind, sleeveSDF(sleeveKind), [-0.09, -0.22, -0.09], [0.09, 0.09, 0.09], 0.0075, cylUV(-0.25, 0.1)), sleeveM)));
      if (sleeveKind === 'long' && (top === 'varsity' || top === 'sweater' || top === 'cardigan')) { const cf = mesh(geo('acCuff', () => new THREE.TorusGeometry(0.041, 0.011, 6, 16)), mat(top === 'varsity' ? l.shirt : shade(l.shirt, 0.92)), 0, -0.175, 0); cf.rotation.x = Math.PI / 2; inner.add(cf); }
      body.add(pivot);
      return pivot;
    };
    const armL = makeArm(-1), armR = makeArm(1);

    // ----- 머리 -----
    PART = 'head';
    const head = new THREE.Group();
    head.position.y = 0.95;
    head.scale.setScalar(HEAD_SCALE);
    body.add(head);
    const tFace = faceTexture(l, false), tBlink = faceTexture(l, true);
    const face = new THREE.Mesh(headGeo(), soften(new THREE.MeshLambertMaterial({ map: tFace, vertexColors: true }), 0.22));
    face.userData.part = 'face';
    head.add(face);
    PART = 'hair';
    const hs = HAIR[l.hairStyle] ? l.hairStyle : LEGACY[l.hairStyle] || 'boyshort';
    const hair = tag(new THREE.Mesh(hairGeo(hs, l.hat !== 'none' && !['flower', 'bow', 'flowercrown', 'hibiscus', 'tiara', 'headband', 'halo', 'horns'].includes(l.hat)), soften(new THREE.MeshLambertMaterial({ color: lin(l.hair), vertexColors: true, side: THREE.DoubleSide, map: window.__NOMAP ? null : grayTex('hair') }), 0.3)));
    if (l.hairFlip) hair.scale.x = -1;
    if (l.hat !== 'none' && !['flower', 'bow', 'flowercrown', 'hibiscus', 'tiara', 'headband', 'halo', 'horns', 'bandana'].includes(l.hat)) hair.scale.set(hair.scale.x * 0.97, 0.94, 0.97);
    head.add(hair);
    if (l.hairTie != null || ['pony', 'twintail', 'bun', 'odango', 'halfup', 'tiedlong', 'braids'].includes(hs)) addTies(head, hs, l);
    PART = 'hat';
    if (EXTRA_HATS[l.hat]) EXTRA_HATS[l.hat](head, l);
    else if (l.hat !== 'none') { const hg = new THREE.Group(); hg.scale.setScalar(1.08); hg.position.y = 0.02; M.buildHat(hg, l, [1.04, 1.04, 1.04]); fixLegacy(hg); head.add(hg); }
    PART = 'glasses';
    if (l.glasses !== 'none') { const gg = new THREE.Group(); M.buildGlasses(gg, l, HS); fixLegacy(gg); gg.scale.set(1.08, 1.06, 1.06); head.add(gg); }
    PART = 'acc';
    buildAccs(body, head, l);
    PART = null;

    const blanket = new THREE.Group();
    const quilt = new THREE.MeshLambertMaterial({ map: M.quiltTex(), color: 0x8fd3ff });
    blanket.add(M.h.mesh(box(0.8, 0.9, 0.42, 0.18), quilt, 0, 0.25, 0.04));
    blanket.add(M.h.mesh(box(0.82, 0.12, 0.46, 0.06), mat(0xfffaf2), 0, 0.68, 0.05));
    blanket.visible = false; blanket.userData.quilt = quilt;
    blanket.traverse(o => { o.userData.part = 'blanket'; });
    body.add(blanket);
    root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return {
      root, shape: shapeG, body, head, legL, legR, armL, armR, face, faceTex: tFace, blinkTex: tBlink, baseFace: tFace, baseBlink: tBlink, expr: null, look: l, size: 1, blanket,
      phase: 0, blinkT: 2 + Math.random() * 3, actionT: 0, idleT: Math.random() * 10, lastRot: 0, headYaw: 0, talkT: 0, waveT: 0,
      hip: 0.2, headZ: 0.95, faceFn: faceTexture, person: true, hairStyle: hs,
    };
  }
  // 예전 빌더(모자 · 안경)가 만든 재질도 같은 색 공간으로
  function fixLegacy(g) { g.traverse(o => { if (o.isMesh && o.material && o.material.color && !o.material.userData.lin) { const m = o.material.clone(); m.color.convertSRGBToLinear(); m.userData.lin = true; o.material = m; } }); }
  function addTies(head, hs, l) {
    PART = 'hair';
    const c = mat(l.hairTie != null ? l.hairTie : (l.accColor || 0xff6f86));
    const T = (x, y, z, rx, r = 0.06) => { const t = mesh(geo('acTie' + r, () => new THREE.TorusGeometry(r, 0.022, 8, 20)), c, x, y, z); t.rotation.x = rx; head.add(t); };
    if (hs === 'pony') T(0, 0.34, -0.47, 0.9, 0.075);
    if (hs === 'twintail') for (const s of [-1, 1]) head.add(mesh(sphere(0.045), c, s * 0.44, 0.04, -0.17));
    if (hs === 'bun') T(0, 0.43, -0.1, Math.PI / 2 + 0.25, 0.12);
    if (hs === 'odango') for (const s of [-1, 1]) { const t = mesh(geo('acOdT', () => new THREE.TorusGeometry(0.1, 0.022, 8, 20)), c, s * 0.27, 0.37, -0.03); t.rotation.set(Math.PI / 2, 0, -s * 0.5); head.add(t); }
    if (hs === 'halfup') T(0, 0.16, -0.44, 0, 0.05);
    if (hs === 'tiedlong') T(0, -0.15, -0.45, Math.PI / 2 - 0.1, 0.07);
    if (hs === 'braids') for (const s of [-1, 1]) head.add(mesh(sphere(0.035), c, s * 0.46, -0.66, 0.07));
  }

  const EXTRA_HATS = {
    cap(head, l) {
      const c = matL(l.hatColor, { vertexColors: true, map: grayTex('cotton') });
      const d = mesh(geo('acCapD', () => new THREE.SphereGeometry(0.54, 36, 16, 0, Math.PI * 2, 0, Math.PI * 0.5)), c, 0, 0.12, -0.04); d.scale.set(1, 1.0, 1); d.rotation.x = -0.15; head.add(d);
      const v = mesh(geo('acCapV', () => new THREE.CylinderGeometry(0.4, 0.4, 0.035, 30, 1, false, -Math.PI / 2, Math.PI)), c, 0, 0.16, 0.26); v.rotation.x = 0.2; v.scale.set(0.85, 1, 0.9); head.add(v);
      head.add(mesh(sphere(0.045), c, 0, 0.66, -0.1));
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const ln = mesh(capsule(0.006, 0.36), matL(shade(l.hatColor, 0.8)), Math.sin(a) * 0.25, 0.42, Math.cos(a) * 0.25 - 0.06); ln.visible = false; }
    },
    bucket(head, l) {
      const c = matL(l.hatColor, { vertexColors: true, map: grayTex('cotton') });
      const d = mesh(geo('acBkD', () => new THREE.SphereGeometry(0.52, 34, 14, 0, Math.PI * 2, 0, Math.PI * 0.5)), c, 0, 0.16, -0.02); d.scale.set(1, 0.72, 1); head.add(d);
      head.add(mesh(lathe('acBkB2', [[0.5, 0.0], [0.7, -0.1], [0.73, -0.08], [0.52, 0.04]], 36), c, 0, 0.16, -0.02));
      head.add(mesh(geo('acBkBand', () => new THREE.CylinderGeometry(0.52, 0.53, 0.06, 32)), matL(shade(l.hatColor, 0.85), { vertexColors: true }), 0, 0.2, -0.02));
    },
    headband(head, l) {
      const c = matL(l.hatColor, { vertexColors: true });
      const g = new THREE.Group(); g.position.set(0, 0.02, 0.0); g.rotation.x = 0.12; g.scale.set(0.98, 1.02, 1); head.add(g);
      g.add(mesh(geo('acHB2', () => new THREE.TorusGeometry(0.53, 0.03, 10, 40, Math.PI)), c));
      for (let i = 0; i < 15; i++) { const a = 0.08 + (i / 14) * (Math.PI - 0.16); const f = mesh(sphere(0.036, 10, 8), c, Math.cos(a) * 0.54, Math.sin(a) * 0.54, 0.03); f.scale.set(1, 0.75, 0.55); g.add(f); }
    },
    cap(head, l) {
      const c = matL(l.hatColor, { vertexColors: true, map: grayTex('cotton') });
      const d = mesh(geo('acCapD', () => new THREE.SphereGeometry(0.54, 36, 16, 0, Math.PI * 2, 0, Math.PI * 0.5)), c, 0, 0.12, -0.04); d.scale.set(1, 1.0, 1); d.rotation.x = -0.15; head.add(d);
      const v = mesh(geo('acCapV', () => new THREE.CylinderGeometry(0.4, 0.4, 0.035, 30, 1, false, -Math.PI / 2, Math.PI)), c, 0, 0.16, 0.26); v.rotation.x = 0.2; v.scale.set(0.85, 1, 0.9); head.add(v);
      head.add(mesh(sphere(0.045), c, 0, 0.66, -0.1));
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const ln = mesh(capsule(0.006, 0.36), matL(shade(l.hatColor, 0.8)), Math.sin(a) * 0.25, 0.42, Math.cos(a) * 0.25 - 0.06); ln.visible = false; }
    },
    bucket(head, l) {
      const c = matL(l.hatColor, { vertexColors: true, map: grayTex('cotton') });
      const d = mesh(geo('acBkD', () => new THREE.SphereGeometry(0.52, 34, 14, 0, Math.PI * 2, 0, Math.PI * 0.5)), c, 0, 0.16, -0.02); d.scale.set(1, 0.72, 1); head.add(d);
      head.add(mesh(lathe('acBkB2', [[0.5, 0.0], [0.7, -0.1], [0.73, -0.08], [0.52, 0.04]], 36), c, 0, 0.16, -0.02));
      head.add(mesh(geo('acBkBand', () => new THREE.CylinderGeometry(0.52, 0.53, 0.06, 32)), matL(shade(l.hatColor, 0.85), { vertexColors: true }), 0, 0.2, -0.02));
    },
    flowercrown(head, l) {
      const cols = [0xff5a6e, 0xffb13d, 0xffffff, 0xff8fb1, 0xb69cff];
      for (let i = 0; i < 9; i++) { const a = (-64 + i * 16) * D2R; const p = V(Math.sin(a) * 0.4, 0.44 - A(i - 4) * 0.006, Math.cos(a) * 0.38 - 0.08); const f = new THREE.Group(); for (let k = 0; k < 6; k++) { const pa = k / 6 * Math.PI * 2; const pe = mesh(sphere(0.034, 10, 8), mat(cols[i % 5]), Math.cos(pa) * 0.034, Math.sin(pa) * 0.034, 0); pe.scale.z = 0.5; f.add(pe); } f.add(mesh(sphere(0.024, 8, 6), mat(i % 2 ? 0x3a2a20 : 0xffd84a), 0, 0, 0.015)); f.position.copy(p); f.lookAt(p.clone().multiplyScalar(2).setY(p.y * 2 + 0.3)); head.add(f); if (i % 2) head.add(mesh(sphere(0.028, 8, 6), mat(0x4f9a45), p.x * 1.04, p.y - 0.03, p.z)); }
    },
    hibiscus(head, l) { const f = new THREE.Group(); for (let k = 0; k < 5; k++) { const pa = k / 5 * Math.PI * 2; const p = mesh(sphere(0.06, 12, 10), mat(l.hatColor || 0xff3a5a), Math.cos(pa) * 0.058, Math.sin(pa) * 0.058, 0); p.scale.z = 0.4; f.add(p); } f.add(mesh(capsule(0.008, 0.05), mat(0xffd84a), 0, 0, 0.03).rotateX(1.2)); f.position.set(0.4, 0.25, 0.16); f.rotation.y = 1.0; head.add(f); },
    tiara(head, l) { const g = mesh(geo('tiara', () => new THREE.TorusGeometry(0.3, 0.014, 6, 30, Math.PI)), mat(0xe8e4f0), 0, 0.44, 0.04); g.rotation.x = -0.4; head.add(g); for (let i = -2; i <= 2; i++) head.add(mesh(roundCone(0.022, 0.08 - A(i) * 0.012), mat(0xf4f0ff), i * 0.1, 0.5 - A(i) * 0.02, 0.2 - A(i) * 0.03)); head.add(mesh(sphere(0.02), mat(0x9fd8ff), 0, 0.56, 0.2)); },
    bandana(head, l) { const b = mesh(geo('acBand', () => new THREE.SphereGeometry(0.51, 32, 14, 0, Math.PI * 2, 0, Math.PI * 0.4)), clothMat({ pattern: l.hatPattern || 'dots' }, l.hatColor || 0xd8343a, 0xffffff), 0, 0.06, -0.03); b.rotation.x = -0.28; head.add(b); head.add(mesh(sphere(0.06), mat(l.hatColor || 0xd8343a), 0, 0.14, -0.52)); },
    captain(head, l) {
      const g = new THREE.Group(), w = mat(0xffffff), n = mat(0x1f2a4a);
      g.add(mesh(geo('cpTop2', () => new THREE.CylinderGeometry(0.6, 0.5, 0.16, 32)), w, 0, 0.12, 0));
      g.add(mesh(geo('cpBand2', () => new THREE.CylinderGeometry(0.51, 0.51, 0.1, 32)), n, 0, 0.0, 0));
      const v = mesh(geo('cpVisor', () => new THREE.CylinderGeometry(0.3, 0.32, 0.025, 24, 1, false, -Math.PI / 2, Math.PI)), n, 0, -0.04, 0.3); v.rotation.x = 0.25; v.scale.set(1, 1, 0.75); g.add(v);
      g.add(mesh(box(0.34, 0.02, 0.02, 0.008), mat(0xd9b44a), 0, 0.03, 0.47));
      g.add(mesh(geo('cpBadge', () => new THREE.CylinderGeometry(0.06, 0.06, 0.012, 16)), mat(0xd9b44a), 0, 0.13, 0.5).rotateX(Math.PI / 2));
      g.position.set(0, 0.36, -0.02); g.rotation.x = -0.12; head.add(g);
    },
    fedora(head, l) {
      const g = new THREE.Group(), c = mat(l.hatColor);
      g.add(mesh(geo('fdTop2', () => new THREE.CylinderGeometry(0.36, 0.5, 0.26, 30)), c, 0, 0.13, 0));
      g.add(mesh(lathe('fdBrim2', [[0.38, 0], [0.64, -0.01], [0.68, 0.03], [0.62, 0.02], [0.38, 0.025]], 32), c, 0, 0, 0));
      g.add(mesh(geo('fdBand2', () => new THREE.CylinderGeometry(0.49, 0.5, 0.06, 30)), mat(l.accColor || 0x2b2b30), 0, 0.04, 0));
      g.position.set(0, 0.33, -0.02); g.rotation.x = -0.08; head.add(g);
    },
    knit(head, l) {
      const c = matL(l.hatColor, { vertexColors: true, map: grayTex('knit') });
      const d = mesh(geo('knitD2', () => { const g = new THREE.SphereGeometry(0.53, 36, 18, 0, Math.PI * 2, 0, Math.PI * 0.52); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > 0.25) p.setY(i, y + (y - 0.25) * 0.35); } g.computeVertexNormals(); return g; }), c, 0, 0.1, -0.02); d.rotation.x = -0.2; head.add(d);
      const r = mesh(geo('knitR2', () => new THREE.TorusGeometry(0.52, 0.065, 10, 40)), matL(shade(l.hatColor, 0.9), { vertexColors: true, map: grayTex('knit') }), 0, 0.12, -0.01); r.rotation.x = Math.PI / 2 - 0.2; head.add(r);
    },
    boater(head, l) {
      const g = new THREE.Group(), c = mat(l.hatColor || 0xe8c870);
      g.add(mesh(geo('btTop', () => new THREE.CylinderGeometry(0.42, 0.44, 0.16, 30)), c, 0, 0.08, 0));
      g.add(mesh(geo('btBrim', () => new THREE.CylinderGeometry(0.72, 0.72, 0.025, 34)), c, 0, 0, 0));
      g.add(mesh(geo('btBand', () => new THREE.CylinderGeometry(0.445, 0.445, 0.06, 30)), mat(l.accColor || 0xc0392b), 0, 0.05, 0));
      g.position.set(0, 0.42, -0.02); g.rotation.x = -0.1; head.add(g);
    },
  };
  function buildAccs(body, head, l) {
    for (const [i, a] of [l.acc, l.acc2].entries()) {
      if (!a || a === 'none') continue;
      const col = i ? (l.acc2Color != null ? l.acc2Color : l.accColor) : l.accColor, c = mat(col);
      switch (a) {
        case 'tie': { const t = mesh(box(0.034, 0.12, 0.012, 0.006), c, 0, 0.48, 0.118); t.rotation.x = -0.18; body.add(t); body.add(mesh(sphere(0.017), c, 0, 0.545, 0.098)); break; }
        case 'bowtie': for (const s of [-1, 1]) { const b = mesh(roundCone(0.03, 0.05), c, s * 0.026, 0.55, 0.1); b.rotation.z = s * Math.PI / 2; b.scale.z = 0.5; body.add(b); } body.add(mesh(sphere(0.016), c, 0, 0.55, 0.105)); break;
        case 'scarf': { const sc = mesh(geo('acScarf', () => new THREE.TorusGeometry(0.085, 0.036, 10, 24)), c, 0, 0.585, 0.0); sc.rotation.x = Math.PI / 2 - 0.12; body.add(sc); const t2 = mesh(box(0.05, 0.13, 0.025, 0.012), c, 0.045, 0.49, 0.12); t2.rotation.z = 0.15; body.add(t2); break; }
        case 'necklace': case 'pendant': case 'chain': { const n = mesh(geo('acNeckl', () => new THREE.TorusGeometry(0.09, 0.006, 6, 26)), mat(a === 'chain' ? 0xe8c870 : a === 'pendant' ? 0x6a4a30 : col), 0, 0.53, 0.035); n.rotation.x = Math.PI / 2 - 0.65; body.add(n); body.add(mesh(sphere(a === 'pendant' ? 0.024 : 0.016), mat(a === 'pendant' ? 0xe8c870 : col), 0, 0.47, 0.118, false)); break; }
        case 'choker': { const n = mesh(geo('acChok', () => new THREE.TorusGeometry(0.048, 0.011, 6, 20)), c, 0, 0.625, 0); n.rotation.x = Math.PI / 2; body.add(n); break; }
        case 'backpack': body.add(mesh(box(0.2, 0.22, 0.09, 0.045), c, 0, 0.4, -0.17)); for (const s of [-1, 1]) body.add(mesh(capsule(0.011, 0.18), c, s * 0.075, 0.44, 0.03, false)); body.add(mesh(box(0.13, 0.07, 0.035, 0.018), mat(shade(col, 0.85)), 0, 0.34, -0.225)); break;
        case 'satchel': case 'crossbag': { const st = mesh(capsule(0.008, 0.4), c, 0, 0.39, 0.0); st.rotation.z = 0.66; body.add(st); body.add(mesh(box(0.1, 0.08, 0.035, 0.016), c, 0.15, 0.22, 0.06)); break; }
        case 'tote': body.add(mesh(box(0.13, 0.15, 0.025, 0.01), mat(col), 0.2, 0.25, 0.02)); { const st = mesh(geo('acTote', () => new THREE.TorusGeometry(0.16, 0.007, 6, 22, Math.PI)), mat(col), 0.1, 0.36, 0.02); st.rotation.z = -0.9; body.add(st); } break;
        case 'camera': body.add(mesh(box(0.08, 0.055, 0.045, 0.014), mat(0x2b2b30), 0, 0.37, 0.14)); body.add(mesh(geo('acCamL', () => new THREE.CylinderGeometry(0.018, 0.022, 0.035, 12)), mat(0x5a5f6a), 0, 0.37, 0.17).rotateX(Math.PI / 2)); break;
        case 'neckphones': { const b = mesh(geo('acNph', () => new THREE.TorusGeometry(0.09, 0.012, 6, 22, Math.PI)), mat(0x2b2b30), 0, 0.59, -0.02); b.rotation.set(Math.PI / 2 + 0.3, 0, Math.PI); body.add(b); for (const s of [-1, 1]) body.add(mesh(geo('acNphC', () => new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16)), c, s * 0.09, 0.57, 0.05).rotateZ(Math.PI / 2)); break; }
        case 'cape': { const cp = mesh(lathe('acCape', [[0.0001, 0.6], [0.11, 0.58], [0.19, 0.36], [0.23, 0.12], [0.0001, 0.12]]), matL(col, { side: THREE.DoubleSide, vertexColors: true }), 0, 0, -0.05); cp.scale.z = 0.6; body.add(cp); break; }
        case 'wings': for (const s of [-1, 1]) { const w = mesh(sphere(0.11), mat(0xffffff), s * 0.12, 0.46, -0.17); w.scale.set(1.3, 0.8, 0.3); w.rotation.z = s * 0.5; body.add(w); } break;
        case 'lei': for (let k = 0; k < 10; k++) { const a2 = k / 10 * Math.PI * 2; body.add(mesh(sphere(0.027), mat([0xff6f86, 0xffd84a, 0xffffff][k % 3]), Math.cos(a2) * 0.1, 0.56 - (Math.sin(a2) > 0 ? Math.sin(a2) * 0.05 : 0), Math.sin(a2) * 0.09 + 0.01, false)); } break;
        case 'earring': for (const s of [-1, 1]) head.add(mesh(sphere(0.024, 10, 8), c, s * 0.445, -0.17, -0.02, false)); break;
        case 'mustache': for (const s of [-1, 1]) { const m = mesh(sphere(0.05, 14, 10), mat(shade(l.hair, 0.9)), s * 0.045, -0.14, 0.42); m.scale.set(1.4, 0.55, 0.6); m.rotation.z = -s * 0.35; head.add(m); } break;
      }
    }
  }

  // ---------------------------------------------------------
  // 동물 외형 → 사람 (예전 저장 · 스태프 · 이웃 섬 방문객)
  // ---------------------------------------------------------
  const hashS = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); };
  const NAT_HAIR = [0x2b201c, 0x3a2a24, 0x5a3a2a, 0x7a4a30, 0x8a5a3b, 0xb07a4a, 0xd9a86a, 0x1f1f26, 0x4a3a34];
  const SKINS = [0xffdcc4, 0xffd2b4, 0xf2bc94, 0xe0a478, 0xc4855a, 0x9a6440];
  const F_STY = ['bobbang', 'longbang', 'pony', 'bun', 'hime', 'longwave', 'halfup', 'pixie', 'braids', 'twintail', 'curtainmid', 'curlybob'];
  const M_STY = ['boyshort', 'sideswept', 'centerpart', 'shaggy', 'spiky', 'wavyshort', 'slick', 'curlyshort', 'buzz', 'bowl'];
  const KITS = ['round', 'round', 'sleepy', 'droopy', 'sharp', 'dot'];
  ISLE.humanize = function (l, src) {
    const h = hashS(JSON.stringify([l.species, l.fur, l.shirt, l.top, l.hat, l.eyes, src && src.name]));
    const fem = l.top === 'dress' || l.bottom === 'skirt' || h % 2 === 0;
    const pool = fem ? F_STY : M_STY;
    const fb = ((l.fur >> 16) & 255) + ((l.fur >> 8) & 255) + (l.fur & 255);
    return Object.assign({}, l, {
      species: 'human', skin: SKINS[h % 5], hair: fb > 560 || h % 4 === 0 ? NAT_HAIR[h % NAT_HAIR.length] : shade(l.fur, 0.62), hairStyle: pool[(h >> 3) % pool.length],
      eyeKit: KITS[(h >> 5) % KITS.length], eyes: ['happy', 'sleepy', 'smug', 'wink'].includes(l.eyes) ? l.eyes : 'dot', eyeColor: [0x3a2a20, 0x2b201c, 0x4a6a8a, 0x3a5a3a][(h >> 2) % 4], lashes: fem,
      marking: 'none', shoeType: ['sneaker', 'loafer', 'sneaker', 'boots'][(h >> 7) % 4], brows: l.brows === 'none' ? 'thin' : l.brows, blush: 0xff9a88, height: 1, width: 1,
    });
  };
  const rl0 = ISLE.randomLook;
  ISLE.randomLook = function () {
    const l = rl0();
    if (!ISLE.HUMAN_ONLY) return l;
    const fem = Math.random() < 0.5, pk = a => a[(Math.random() * a.length) | 0];
    return ISLE.normalizeLook(Object.assign(l, {
      species: 'human', marking: 'none', skin: pk(SKINS), hair: pk(NAT_HAIR), hairStyle: pk(fem ? F_STY : M_STY), eyeKit: pk(KITS), eyes: 'dot', lashes: fem,
      brows: 'thin', blush: 0xff9a88, mouth: pk(['smile', 'smile', 'grin', 'open']), pattern: 'plain',
      top: pk(['tee', 'shirt', 'cardigan', 'hoodie', 'sweater', 'jacket', 'longtee', fem ? 'dress' : 'tee']), bottom: fem ? pk(['skirt', 'jeans', 'pleats', 'shorts']) : pk(['jeans', 'pants', 'shorts', 'cargo']),
      shoeType: pk(['sneaker', 'loafer', 'boots']), hat: Math.random() < 0.2 ? pk(['cap', 'knit', 'bucket']) : 'none', glasses: Math.random() < 0.12 ? 'round' : 'none',
      acc: Math.random() < 0.25 ? pk(['backpack', 'satchel', 'scarf', 'tote']) : 'none', height: 1, width: 1,
    }));
  };

  ISLE.Person = { build, wants: l => !!l && (l.species === 'human' || !!ISLE.HUMAN_ONLY), faceTexture, HAIR, HAIR_NAMES, nets, hairGeo, headGeo };
})();
