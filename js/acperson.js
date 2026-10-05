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
  const { mat, geo, sphere, box, capsule, lathe, roundCone, soften } = M.h;
  const D2R = Math.PI / 180;
  const shade = M.shade;
  const hex = n => '#' + (n >>> 0).toString(16).padStart(6, '0').slice(-6);
  const mix = (a, b, t) => [16, 8, 0].reduce((o, s) => o | (Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * t) << s), 0);
  let PART = null;
  const tag = o => { if (PART) o.userData.part = PART; return o; };
  const mesh = (...a) => tag(M.h.mesh(...a));
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
    const quad = (a, b, c, d, dx, dy, dz) => {
      if (a < 0 || b < 0 || c < 0 || d < 0) return;
      const ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2];
      const ux = P[b * 3] - ax, uy = P[b * 3 + 1] - ay, uz = P[b * 3 + 2] - az, wx = P[c * 3] - ax, wy = P[c * 3 + 1] - ay, wz = P[c * 3 + 2] - az;
      const nxx = uy * wz - uz * wy, nyy = uz * wx - ux * wz, nzz = ux * wy - uy * wx;
      if (nxx * dx + nyy * dy + nzz * dz >= 0) idx.push(a, b, c, a, c, d); else idx.push(a, c, b, a, d, c);
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
    g.setIndex(idx);
    // 기울기가 애매한 곳(합집합 경계)은 면 노멀로 보정 → 검은 점 방지
    const gN = N.slice();
    g.computeVertexNormals();
    const fn = g.attributes.normal;
    for (let i = 0; i < fn.count; i++) {
      const ax = gN[i * 3], ay = gN[i * 3 + 1], az = gN[i * 3 + 2], bx = fn.getX(i), by = fn.getY(i), bz = fn.getZ(i);
      const dot = ax * bx + ay * by + az * bz, gl = hyp(ax, ay, az);
      if (gl > 0.5 && dot > 0.2) { const nx2 = ax * 0.75 + bx * 0.25, ny2 = ay * 0.75 + by * 0.25, nz2 = az * 0.75 + bz * 0.25, nl = hyp(nx2, ny2, nz2) || 1; fn.setXYZ(i, nx2 / nl, ny2 / nl, nz2 / nl); }
    }
    g.computeBoundingSphere();
    return g;
  }
  const sdfGeo = (key, f, min, max, cell, post) => geo('sdf:' + key, () => { const g = nets(f, min, max, cell); if (post) post(g); return g; });

  // =========================================================
  // 머리 (머리 로컬 좌표, 이후 HEAD_SCALE 배)
  // =========================================================
  const HEAD_SCALE = 0.86;
  function headSDF(x, y, z) {
    let d = sEll(x, y, z, 0, 0.03, -0.01, 0.44, 0.42, 0.42);
    d = smin(d, sEll(x, y, z, 0, -0.12, 0.03, 0.41, 0.3, 0.37), 0.16);
    d = smin(d, sEll(A(x), y, z, 0.43, -0.07, -0.03, 0.05, 0.085, 0.065), 0.035);
    d = smin(d, sCone(x, y, z, 0, -0.055, 0.38, 0, -0.085, 0.445, 0.034, 0.02), 0.03);
    return d;
  }
  const FC = [0, -0.03, 0];
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
  const LID = '#3a2420';
  const EYE_AZ = 25, EYE_POL = 93;
  function drawEye(g, x, y, s, l, kind) {
    const ic = l.eyeColor != null ? l.eyeColor : 0x3a2a20;
    const arc = (up, lw = 10) => { g.strokeStyle = LID; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); if (up) { g.moveTo(x - 28, y + 10); g.quadraticCurveTo(x, y - 28, x + 28, y + 10); } else { g.moveTo(x - 28, y - 4); g.quadraticCurveTo(x, y + 22, x + 28, y - 4); } g.stroke(); };
    if (kind === 'happy') return arc(true, 10);
    if (kind === 'closed') return arc(false, 9);
    if (kind === 'x') { g.strokeStyle = LID; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + s * 18, y - 18); g.lineTo(x - s * 13, y); g.lineTo(x + s * 18, y + 18); g.stroke(); return; }
    if (kind === 'heart') { g.fillStyle = '#ff4f7b'; heart(g, x, y - 2, 26); g.fillStyle = '#fff'; circle(g, x - 8, y - 10, 5); return; }
    let rx = 34, ry = 42, irx = 25, iry = 33, iy = 4, ix = -s * 3;
    if (kind === 'dot') { rx = 27; ry = 33; irx = 18; iry = 24; }
    if (kind === 'sharp') { rx = 36; ry = 33; irx = 22; iry = 27; iy = 3; }
    if (kind === 'shock') { irx = 11; iry = 13; iy = 0; ix = 0; }
    if (kind === 'sparkle' || kind === 'star') { rx = 36; ry = 45; irx = 27; iry = 35; }
    g.save();
    const lidClip = (yo, yi, c) => { g.beginPath(); g.moveTo(x - s * 70, y + 80); g.lineTo(x + s * 70, y + 80); g.lineTo(x + s * 70, y + yo); g.quadraticCurveTo(x, y + c, x - s * 70, y + yi); g.closePath(); g.clip(); };
    if (kind === 'sleepy') lidClip(-1, -1, -5);
    if (kind === 'droopy' || kind === 'sad') lidClip(-4, -28, -26);
    if (kind === 'sharp' || kind === 'glare') lidClip(-28, -4, -22);
    if (kind === 'smug') lidClip(-10, -10, -13);
    g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = '#ffffff'; g.fill(); g.clip();
    const grd = g.createLinearGradient(0, y + iy - iry, 0, y + iy + iry);
    grd.addColorStop(0, hex(shade(ic, 0.5))); grd.addColorStop(0.6, hex(ic)); grd.addColorStop(1, hex(shade(ic, 1.45)));
    g.fillStyle = grd; ellipse(g, x + ix, y + iy, irx, iry);
    g.fillStyle = hex(shade(ic, 0.32)); ellipse(g, x + ix, y + iy + 2, irx * 0.46, iry * 0.48);
    g.fillStyle = '#fff';
    if (kind === 'star') star(g, x + ix - 7, y + iy - 10, 10); else circle(g, x + ix - 7, y + iy - 10, irx * 0.34);
    circle(g, x + ix + 8, y + iy + 12, irx * 0.13);
    g.restore();
    g.strokeStyle = LID; g.lineCap = 'round'; g.lineWidth = 7.5;
    g.beginPath();
    if (kind === 'sleepy') { g.moveTo(x - rx * 0.96, y - 1); g.quadraticCurveTo(x, y - 7, x + rx * 0.96, y - 1); }
    else if (kind === 'droopy' || kind === 'sad') { g.moveTo(x - s * rx * 0.9, y - 31); g.quadraticCurveTo(x, y - 33, x + s * rx * 0.96, y - 5); }
    else if (kind === 'sharp' || kind === 'glare') { g.moveTo(x - s * rx * 0.96, y - 5); g.quadraticCurveTo(x, y - 27, x + s * rx * 0.96, y - 31); }
    else if (kind === 'smug') { g.moveTo(x - rx * 0.97, y - 11); g.quadraticCurveTo(x, y - 16, x + rx * 0.97, y - 11); }
    else { g.moveTo(x - rx * 0.9, y - ry * 0.38); g.quadraticCurveTo(x, y - ry * 1.16, x + rx * 0.9, y - ry * 0.38); }
    g.stroke();
    if (l.lashes) { g.lineWidth = 5; for (const [dx, dy, ex, ey] of [[0.86, -0.5, 8, -6], [0.97, -0.2, 9, -2]]) { g.beginPath(); g.moveTo(x + s * rx * dx, y + ry * dy); g.lineTo(x + s * (rx * dx + ex), y + ry * dy + ey); g.stroke(); } }
    if (l.mole && ((l.mole === 'L' && s < 0) || (l.mole === 'R' && s > 0))) { g.fillStyle = '#5a3426'; circle(g, x + s * 24, y + 42, 3.6); }
  }
  const fcache = new Map();
  function faceTexture(l, blink, small) {
    const key = ['acf2', l.eyes, l.eyeKit, l.eyeColor, l.brows, l.mouth, l.blush, l.skin, l.hair, l.fx || '', l.lashes ? 1 : 0, l.mole || '', l.freckles ? 1 : 0, blink ? 1 : 0, small ? 1 : 0, l.nose || ''].join('|');
    if (fcache.has(key)) return fcache.get(key);
    if (fcache.size > 240) { const k0 = fcache.keys().next().value; fcache.get(k0).dispose(); fcache.delete(k0); }
    const cv = document.createElement('canvas'); cv.width = small ? CW / 2 : CW; cv.height = small ? CH / 2 : CH;
    const g = cv.getContext('2d'); if (small) g.scale(0.5, 0.5);
    g.fillStyle = hex(l.skin); g.fillRect(0, 0, CW, CH);
    const noseC = l.nose != null ? l.nose : mix(l.skin, 0xff7f5a, 0.42);
    { const gr = g.createRadialGradient(X(0), Y(100), 0, X(0), Y(100), 24); gr.addColorStop(0, hex(noseC)); gr.addColorStop(0.65, hex(noseC)); gr.addColorStop(1, hex(noseC) + '00'); g.fillStyle = gr; ellipse(g, X(0), Y(100.5), 24, 24); }
    if (l.blush !== 'none') { const bc = typeof l.blush === 'number' ? l.blush : 0xff9a88; for (const az of [-40, 40]) { const x = X(az), y = Y(105); const gr = g.createRadialGradient(x, y, 0, x, y, 28); gr.addColorStop(0, hex(bc) + '55'); gr.addColorStop(1, hex(bc) + '00'); g.fillStyle = gr; ellipse(g, x, y, 30, 22); } }
    if (l.freckles) { g.fillStyle = 'rgba(150,85,55,0.5)'; for (const [az, p] of [[-36, 100], [-42, 102], [-33, 104], [36, 100], [42, 102], [33, 104]]) circle(g, X(az), Y(p), 3); }
    const ex = [X(-EYE_AZ), X(EYE_AZ)], ey = Y(EYE_POL);
    const browC = hex(shade(l.hair, l.hair < 0x404040 ? 1.25 : 0.82));
    g.strokeStyle = browC; g.fillStyle = browC; g.lineCap = 'round';
    const by = Y(75);
    for (const [i, x] of ex.entries()) {
      const s = i === 0 ? -1 : 1, b = l.brows || 'thin';
      if (b === 'none') continue;
      g.lineWidth = b === 'thick' ? 10 : 6;
      g.beginPath();
      if (b === 'angry') { g.moveTo(x + s * 20, by - 9); g.lineTo(x - s * 18, by + 8); }
      else if (b === 'worried') { g.moveTo(x + s * 20, by + 7); g.lineTo(x - s * 18, by - 8); }
      else if (b === 'dots') { ellipse(g, x - s * 4, by, 9, 6); continue; }
      else { g.moveTo(x - 18, by + 4); g.quadraticCurveTo(x, by - 6, x + 18, by + 4); }
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
    M.drawMouth(g, l.mouth || 'smile', X(0), Y(113), 0.9);
    if (l.fx) M.drawFx(g, CW, CH, l.fx, ex, ey);
    const t = new THREE.CanvasTexture(cv); t.anisotropy = 4;
    fcache.set(key, t);
    return t;
  }

  // =========================================================
  // 헤어 (머리 로컬 좌표)
  // =========================================================
  const azOf = (x, z) => Math.atan2(x, z) / D2R;
  function hairSDF(sp) {
    const R = sp.r || [0.5, 0.47, 0.48];
    const L = sp.L, k = sp.k || 0.035;
    const dr = sp.drape;
    return (x, y, z) => {
      const az = azOf(x, z + 0.01);
      let d = sEll(x, y, z, 0, 0.05, -0.02, R[0], R[1], R[2]);
      if (sp.bump) d -= sp.bump(az, y);
      const pol = Math.acos(clamp((y - 0.02) / (hyp(x, y - 0.02, z) || 1), -1, 1)) / D2R;
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
      if (sp.extra) for (const [fn, kk] of sp.extra) d = smin(d, fn(x, y, z), kk);
      return d;
    };
  }
  const prof = (bang, side, back, bw = 52) => a => {
    const x = A(a);
    return x < bw ? bang(a) : x < 105 ? lerp(bang(Math.sign(a) * bw), side, sstep(bw, bw + 22, x)) : lerp(side, back, sstep(105, 150, x));
  };
  const scal = (base, amp, n) => a => base + amp * A(Math.sin(a * D2R * n));
  const sph = (cx, cy, cz, r) => (x, y, z) => sSph(x, y, z, cx, cy, cz, r);
  const ell = (cx, cy, cz, rx, ry, rz) => (x, y, z) => sEll(x, y, z, cx, cy, cz, rx, ry, rz);
  const cone = (a, b, r1, r2) => (x, y, z) => sCone(x, y, z, a[0], a[1], a[2], b[0], b[1], b[2], r1, r2);
  const mirror = fn => (x, y, z) => fn(A(x), y, z);
  const chain = (pts, r0, r1) => (x, y, z) => { let d = 1e9; pts.forEach((p, i) => { d = smin(d, sSph(x, y, z, p[0], p[1], p[2], lerp(r0, r1, i / (pts.length - 1))), 0.03); }); return d; };
  const surf = (az, el, off = 0.06) => { const a = az * D2R, e = el * D2R, r = 0.44 + off; return [Math.sin(a) * Math.cos(e) * r, 0.04 + Math.sin(e) * r, Math.cos(a) * Math.cos(e) * r - 0.02]; };
  const spikeAt = (az, el, len, r, tilt = 0) => cone(surf(az, el, 0.0), surf(az, el + tilt, len), r, 0.012);
  const polOf = (x, y, z) => Math.acos(clamp((y - 0.05) / (hyp(x, y - 0.05, z) || 1), -1, 1)) / D2R;

  const HAIR = {
    // ---------------- 여자 ----------------
    bobbang: { L: prof(scal(70, 4, 6), 102, 108), drape: { y: a => -0.34 - (A(a) > 120 ? 0.04 : 0), t: 0.075, fw: 54, curl: 0.05 } },
    longbang: { L: prof(scal(69, 3, 7), 104, 108), drape: { y: -0.8, t: 0.08, fw: 50, flare: 0.06 } },
    longwave: { L: prof(a => 60 + clamp(a + 55, 0, 110) * 0.2, 104, 108, 56), part: -24, drape: { y: -0.74, t: 0.085, fw: 48, wave: [13, 0.022], flare: 0.08 } },
    hime: { L: prof(() => 71, 102, 108, 50), drape: { y: a => A(a) < 80 ? -0.24 : -0.82, t: 0.08, fw: 50 } },
    sidelong: { L: prof(a => 56 + clamp(a + 50, 0, 100) * 0.26, 104, 108, 56), part: -30, drape: { y: -0.66, t: 0.08, fw: 50, curl: -0.08 } },
    pony: { L: prof(a => 50 + A(a) * 0.12, 100, 110), extra: [[sph(0, 0.36, -0.42, 0.08), 0.03], [cone([0, 0.34, -0.48], [0, 0.0, -0.66], 0.1, 0.11), 0.04], [cone([0, 0.0, -0.66], [0, -0.42, -0.6], 0.11, 0.035), 0.05]] },
    twintail: { L: prof(a => 64 + A(Math.sin(a * D2R * 6)) * 4 + (a > 0 ? 6 : 0), 104, 110), extra: [[mirror(cone([0.4, 0.02, -0.18], [0.62, -0.22, -0.26], 0.085, 0.05)), 0.04]] },
    bun: { L: prof(a => 54 + A(Math.sin(a * D2R * 4)) * 5, 100, 108), extra: [[sph(0, 0.55, -0.12, 0.16), 0.05]] },
    braids: { L: prof(scal(68, 4, 6), 104, 110), part: 0, extra: [[mirror(chain([[0.42, -0.1, -0.06], [0.44, -0.2, -0.02], [0.45, -0.3, 0.01], [0.46, -0.4, 0.03], [0.46, -0.5, 0.05], [0.46, -0.6, 0.06]], 0.07, 0.045)), 0.03]] },
    pixie: { L: prof(a => 62 + clamp(a + 50, 0, 100) * 0.14 + A(Math.sin(a * D2R * 7)) * 3, 98, 108, 56) },
    curlybob: { L: prof(scal(68, 5, 6), 102, 108), drape: { y: -0.3, t: 0.08, fw: 54 }, extra: [[(x, y, z) => { const az = azOf(x, z); if (A(az) < 55) return 1; const a = Math.round(az / 24) * 24 * D2R; return sSph(x, y, z, Math.sin(a) * 0.5, -0.32, Math.cos(a) * 0.48 - 0.03, 0.1); }, 0.04]] },
    curtainmid: { L: prof(a => 50 + Math.min(A(a), 42) * 0.78, 104, 110, 50), part: 0, drape: { y: -0.5, t: 0.08, fw: 46, curl: -0.04 } },
    odango: { L: prof(scal(68, 4, 6), 102, 108), extra: [[mirror(sph(0.3, 0.47, -0.04, 0.14)), 0.04]] },
    lowbun: { L: prof(a => 52 + A(a) * 0.2, 100, 110), part: -22, extra: [[ell(0, -0.16, -0.48, 0.16, 0.14, 0.13), 0.06]] },
    halfup: { L: prof(scal(69, 3, 7), 104, 108), drape: { y: -0.74, t: 0.08, fw: 50 }, extra: [[sph(0, 0.16, -0.52, 0.09), 0.04]] },
    // ---------------- 남자 ----------------
    boyshort: { L: prof(a => 64 + A(Math.sin(a * D2R * 5)) * 5 + clamp(a, -30, 30) * 0.12, 96, 108, 56) },
    spiky: { L: prof(a => 68 + A(Math.sin(a * D2R * 6)) * 5, 98, 110), extra: [[spikeAt(0, 64, 0.2, 0.09, 12), 0.04], [spikeAt(-35, 58, 0.18, 0.08, 8), 0.04], [spikeAt(35, 58, 0.18, 0.08, 8), 0.04], [spikeAt(-80, 46, 0.16, 0.08, 4), 0.04], [spikeAt(80, 46, 0.16, 0.08, 4), 0.04], [spikeAt(-130, 40, 0.16, 0.09, 0), 0.04], [spikeAt(130, 40, 0.16, 0.09, 0), 0.04], [spikeAt(180, 50, 0.16, 0.09, -6), 0.04], [spikeAt(-160, 70, 0.14, 0.08, 0), 0.04], [spikeAt(160, 70, 0.14, 0.08, 0), 0.04]] },
    sideswept: { L: prof(a => 58 + clamp(a + 50, 0, 100) * 0.22, 98, 110, 56), part: -40, extra: [[spikeAt(60, 12, 0.08, 0.05, -10), 0.03]] },
    centerpart: { L: prof(a => 52 + Math.min(A(a), 36) * 0.8, 100, 112, 52), part: 0 },
    shaggy: { L: prof(a => 74 + A(Math.sin(a * D2R * 6)) * 6, 112, 118), drape: { y: a => -0.22 + A(Math.sin(a * D2R * 7)) * 0.06, t: 0.07, fw: 58 }, extra: [[spikeAt(150, -20, 0.12, 0.07, -10), 0.04], [spikeAt(-150, -20, 0.12, 0.07, -10), 0.04], [spikeAt(180, -26, 0.12, 0.07, -10), 0.04]] },
    buzz: { r: [0.462, 0.442, 0.452], L: prof(() => 50, 94, 108), k: 0.02 },
    slick: { L: prof(() => 44, 96, 110), extra: [[ell(0, 0.4, 0.18, 0.26, 0.13, 0.2), 0.12]] },
    curlyshort: { L: prof(() => 58, 98, 110), extra: [[(x, y, z) => { const az = azOf(x, z), pol = polOf(x, y, z); if (pol > 104 || (A(az) < 52 && pol > 62)) return 1; const a = Math.round(az / 30) * 30, p = Math.round(pol / 22) * 22; const q = surf(a + (p % 44 ? 15 : 0), 90 - p, 0.05); return sSph(x, y, z, q[0], q[1], q[2], 0.085); }, 0.03]] },
    manbun: { L: prof(a => 48 + A(a) * 0.15, 98, 108), part: 24, extra: [[sph(0, 0.4, -0.38, 0.1), 0.04]] },
    bowl: { r: [0.52, 0.49, 0.5], L: prof(() => 73, 100, 112) },
    wavyshort: { L: prof(scal(64, 9, 4), 100, 112), bump: (az, y) => Math.sin(az * D2R * 9) * 0.012 * clamp(y + 0.2, 0, 1) },
    mohawk: { r: [0.458, 0.44, 0.45], L: prof(() => 48, 92, 104), extra: [[ell(0, 0.47, -0.02, 0.07, 0.14, 0.42), 0.06]] },
    tiedlong: { L: prof(a => 60 + clamp(a + 40, 0, 80) * 0.18, 104, 112, 56), part: -24, extra: [[cone([0, -0.16, -0.47], [0, -0.62, -0.46], 0.08, 0.05), 0.05]] },
    cloud: { L: prof(() => 54, 102, 112), extra: [[(x, y, z) => { const az = azOf(x, z), pol = polOf(x, y, z); if (pol > 112 || (A(az) < 50 && pol > 60)) return 1; const a = Math.round(az / 34) * 34, p = Math.round(pol / 26) * 26; const q = surf(a + (p % 52 ? 17 : 0), 90 - p, 0.08); return sSph(x, y, z, q[0], q[1], q[2], 0.12); }, 0.04]] },
    grandpa: { L: () => 0, extra: [[(x, y, z) => { if (A(azOf(x, z)) < 70) return 1; return sEll(A(x), y, z, 0.38, -0.02, -0.14, 0.12, 0.13, 0.28); }, 0.05], [ell(0, 0.0, -0.4, 0.3, 0.13, 0.12), 0.05]] },
  };
  const HAIR_NAMES = {
    bobbang: '일자 단발', longbang: '긴 생머리', longwave: '긴 웨이브', hime: '히메컷', sidelong: '옆가르마 롱', pony: '포니테일', twintail: '양갈래', bun: '똥머리', braids: '양 땋은 머리',
    pixie: '숏컷', curlybob: '뽀글 단발', curtainmid: '커튼뱅 중단발', odango: '양쪽 똥머리', lowbun: '쪽머리', halfup: '반묶음',
    boyshort: '기본 숏', spiky: '삐죽 머리', sideswept: '옆으로 넘긴 머리', centerpart: '5:5 가르마', shaggy: '덥수룩 미디엄', buzz: '버즈컷', slick: '올백', curlyshort: '곱슬 숏',
    manbun: '맨번', bowl: '바가지 머리', wavyshort: '웨이브 숏', mohawk: '모히칸', tiedlong: '묶은 장발', cloud: '뭉게 파마', grandpa: '할아버지 머리',
  };
  Object.assign(OPT.hairStyle, HAIR_NAMES);
  const LEGACY = { short: 'boyshort', bob: 'bobbang', long: 'longbang', ponytail: 'pony', pigtails: 'twintail', twinbun: 'odango', afro: 'cloud', curly: 'curlyshort', sidepart: 'sideswept' };
  function hairGeo(style) {
    const sp = HAIR[style];
    const lowest = sp.drape ? -0.92 : sp.extra ? -0.8 : -0.5;
    return sdfGeo('hair:' + style, hairSDF(sp), [-0.72, lowest, -0.78], [0.72, 0.75, 0.62], 0.017, g => {
      const n = g.attributes.normal, p = g.attributes.position, c = new Float32Array(n.count * 3);
      for (let i = 0; i < n.count; i++) { const ny = n.getY(i), band = Math.exp(-Math.pow((ny - 0.62) / 0.16, 2)) * (p.getZ(i) > -0.1 ? 1 : 0.5); const k = 0.94 + band * 0.18 - (ny < -0.2 ? 0.07 : 0); c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = k; }
      g.setAttribute('color', new THREE.BufferAttribute(c, 3));
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

  function clothMat(l, color, accent) {
    if (!l.pattern || l.pattern === 'plain') return mat(color);
    return soften(new THREE.MeshLambertMaterial({ map: M.patternTex(l.pattern, color, accent) }));
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
      const tx = new THREE.CanvasTexture(c); tx.anisotropy = 4; return tx;
    });
    return soften(new THREE.MeshLambertMaterial({ map: t }));
  }

  // =========================================================
  // 조립
  // =========================================================
  Object.assign(OPT.top, { shirt: '셔츠', jacket: '재킷', coat: '코트', cardigan: '가디건', pinafore: '멜빵 원피스', jersey: '저지', sailor: '세일러', tank: '민소매', longtee: '긴팔 티', kimono: '유카타', puffer: '패딩', varsity: '야구점퍼', uniform: '제복' });
  Object.assign(OPT.bottom, { jeans: '청바지', longskirt: '롱스커트', pleats: '플리츠', cargo: '카고 팬츠', wide: '와이드 팬츠' });
  Object.assign(OPT.acc, { earring: '귀걸이', choker: '초커', tote: '에코백', camera: '목걸이 카메라', neckphones: '목 헤드폰', mustache: '콧수염', crossbag: '크로스백', pendant: '펜던트' });
  Object.assign(OPT.hat, { flowercrown: '꽃 화관', tiara: '티아라', bandana: '반다나', captain: '선장 모자', fedora: '페도라', hibiscus: '히비스커스', knit: '니트 비니', boater: '보터햇' });
  const HS = [1, 1, 1]; HS.yaw = EYE_AZ * D2R * 0.95; HS.th = 94 * D2R;

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
      if (longPants || bottom === 'shorts') { PART = 'bottom'; const k = bottom === 'shorts' ? 'shorts' : bottom === 'jeans' ? 'jeans' : bottom === 'wide' ? 'wide' : 'pants'; pivot.add(M_('pleg:' + k, pantLegSDF(k), [-0.1, -0.28, -0.1], [0.1, 0.07, 0.1], 0.008, mat(l.pants))); }
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
    let torsoM = clothMat(l, l.shirt, l.shirt2);
    if (top === 'jersey') torsoM = jerseyMat(l.shirt, l.shirt2, l.jerseyNo, l.jerseyLabel);
    if (OPEN[top] || top === 'pinafore') torsoM = clothMat(l, l.shirt2, l.shirt);
    body.add(tag(new THREE.Mesh(torsoGeo(OPEN[top] ? 'tee' : (top === 'pinafore' ? 'tee' : tk)), torsoM)));
    if (OPEN[top]) body.add(tag(new THREE.Mesh(shellGeo(top === 'coat' ? 'coat' : top), soften(new THREE.MeshLambertMaterial({ color: l.shirt, side: THREE.DoubleSide })))));
    PART = 'head';
    body.add(mesh(capsule(0.045, 0.08), skinM, 0, 0.61, 0));
    if (bottom !== 'none' && bottom) { PART = 'bottom'; const bk = ['skirt', 'pleats', 'longskirt'].includes(bottom) ? bottom : 'pants'; body.add(tag(new THREE.Mesh(bottomGeo(bk), clothMat(l, l.pants, shade(l.pants, 1.25))))); }
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
    if (l.apron != null) body.add(M_('apron', (x, y, z) => { let d = sCone(x, y, z / 0.84, 0, 0.36, 0, 0, 0.1, 0, 0.17, 0.27) * 0.86 - 0.012; d = A(d + 0.006) - 0.006; d = smax(d, 0.1 - y, 0.01); d = smax(d, y - 0.34, 0.01); d = smax(d, -z + 0.02, 0.02); return d; }, [-0.34, 0.05, -0.1], [0.34, 0.4, 0.32], 0.01, soften(new THREE.MeshLambertMaterial({ color: l.apron, side: THREE.DoubleSide }))));

    // ----- 팔 -----
    PART = 'arms';
    const sleeveKind = l.sleeve === 'none' || top === 'tank' || top === 'jersey' ? 'none' : (l.sleeve === 'long' || (l.sleeve !== 'short' && ['sweater', 'hoodie', 'longtee', 'shirt', 'jacket', 'coat', 'cardigan', 'varsity', 'puffer', 'kimono', 'uniform'].includes(top))) ? 'long' : 'short';
    const sleeveM = top === 'varsity' ? mat(l.shirt2) : OPEN[top] ? mat(l.shirt) : top === 'pinafore' ? clothMat(l, l.shirt2, l.shirt) : (top === 'jersey' ? mat(l.shirt) : clothMat(l, l.shirt, l.shirt2));
    const makeArm = side => {
      const pivot = new THREE.Group(); pivot.position.set(side * 0.14, 0.52, 0);
      const inner = new THREE.Group(); inner.rotation.z = side * 0.48; pivot.add(inner);
      inner.add(M_('armSkin', armSkinSDF, [-0.08, -0.31, -0.08], [0.08, 0.06, 0.08], 0.0075, skinM));
      if (sleeveKind !== 'none') inner.add(M_('sleeve:' + sleeveKind, sleeveSDF(sleeveKind), [-0.09, -0.22, -0.09], [0.09, 0.09, 0.09], 0.0075, sleeveM));
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
    const face = new THREE.Mesh(headGeo(), soften(new THREE.MeshLambertMaterial({ map: tFace })));
    face.userData.part = 'face';
    head.add(face);
    PART = 'hair';
    const hs = HAIR[l.hairStyle] ? l.hairStyle : LEGACY[l.hairStyle] || 'boyshort';
    const hair = tag(new THREE.Mesh(hairGeo(hs), soften(new THREE.MeshLambertMaterial({ color: l.hair, vertexColors: true, side: THREE.DoubleSide }))));
    if (l.hairFlip) hair.scale.x = -1;
    if (l.hat !== 'none' && !['flower', 'bow', 'flowercrown', 'hibiscus', 'tiara', 'headband', 'halo', 'horns', 'bandana'].includes(l.hat)) hair.scale.set(hair.scale.x * 0.97, 0.94, 0.97);
    head.add(hair);
    if (l.hairTie != null || ['pony', 'twintail', 'bun', 'odango', 'halfup', 'tiedlong', 'braids'].includes(hs)) addTies(head, hs, l);
    PART = 'hat';
    if (EXTRA_HATS[l.hat]) EXTRA_HATS[l.hat](head, l);
    else if (l.hat !== 'none') { const hg = new THREE.Group(); hg.scale.setScalar(1.08); hg.position.y = 0.02; M.buildHat(hg, l, [1.04, 1.04, 1.04]); head.add(hg); }
    PART = 'glasses';
    if (l.glasses !== 'none') { const gg = new THREE.Group(); M.buildGlasses(gg, l, HS); gg.scale.set(1.08, 1.06, 1.06); head.add(gg); }
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
    flowercrown(head, l) {
      const cols = [0xff5a6e, 0xffb13d, 0xffffff, 0xff8fb1, 0xb69cff];
      for (let i = 0; i < 9; i++) { const a = (-64 + i * 16) * D2R; const p = V(Math.sin(a) * 0.4, 0.44 - A(i - 4) * 0.006, Math.cos(a) * 0.38 - 0.08); const f = new THREE.Group(); for (let k = 0; k < 6; k++) { const pa = k / 6 * Math.PI * 2; const pe = mesh(sphere(0.034, 10, 8), mat(cols[i % 5]), Math.cos(pa) * 0.034, Math.sin(pa) * 0.034, 0); pe.scale.z = 0.5; f.add(pe); } f.add(mesh(sphere(0.024, 8, 6), mat(i % 2 ? 0x3a2a20 : 0xffd84a), 0, 0, 0.015)); f.position.copy(p); f.lookAt(p.clone().multiplyScalar(2).setY(p.y * 2 + 0.3)); head.add(f); if (i % 2) head.add(mesh(sphere(0.028, 8, 6), mat(0x4f9a45), p.x * 1.04, p.y - 0.03, p.z)); }
    },
    hibiscus(head, l) { const f = new THREE.Group(); for (let k = 0; k < 5; k++) { const pa = k / 5 * Math.PI * 2; const p = mesh(sphere(0.06, 12, 10), mat(l.hatColor || 0xff3a5a), Math.cos(pa) * 0.058, Math.sin(pa) * 0.058, 0); p.scale.z = 0.4; f.add(p); } f.add(mesh(capsule(0.008, 0.05), mat(0xffd84a), 0, 0, 0.03).rotateX(1.2)); f.position.set(0.4, 0.25, 0.16); f.rotation.y = 1.0; head.add(f); },
    tiara(head, l) { const g = mesh(geo('tiara', () => new THREE.TorusGeometry(0.3, 0.014, 6, 30, Math.PI)), mat(0xe8e4f0), 0, 0.44, 0.04); g.rotation.x = -0.4; head.add(g); for (let i = -2; i <= 2; i++) head.add(mesh(roundCone(0.022, 0.08 - A(i) * 0.012), mat(0xf4f0ff), i * 0.1, 0.5 - A(i) * 0.02, 0.2 - A(i) * 0.03)); head.add(mesh(sphere(0.02), mat(0x9fd8ff), 0, 0.56, 0.2)); },
    bandana(head, l) { const b = mesh(geo('acBand', () => new THREE.SphereGeometry(0.51, 32, 14, 0, Math.PI * 2, 0, Math.PI * 0.4)), clothMat({ pattern: l.hatPattern || 'dots' }, l.hatColor || 0xd8343a, 0xffffff), 0, 0.06, -0.03); b.rotation.x = -0.28; head.add(b); head.add(mesh(sphere(0.06), mat(l.hatColor || 0xd8343a), 0, 0.14, -0.52)); },
    captain(head, l) {
      const g = new THREE.Group(), w = mat(0xffffff), n = mat(0x1f2a4a);
      g.add(mesh(geo('cpTop', () => new THREE.CylinderGeometry(0.56, 0.46, 0.16, 32)), w, 0, 0.12, 0));
      g.add(mesh(geo('cpBand', () => new THREE.CylinderGeometry(0.47, 0.47, 0.09, 32)), n, 0, 0.0, 0));
      const v = mesh(geo('cpVisor', () => new THREE.CylinderGeometry(0.3, 0.32, 0.025, 24, 1, false, -Math.PI / 2, Math.PI)), n, 0, -0.04, 0.3); v.rotation.x = 0.25; v.scale.set(1, 1, 0.75); g.add(v);
      g.add(mesh(box(0.34, 0.02, 0.02, 0.008), mat(0xd9b44a), 0, 0.03, 0.47));
      g.add(mesh(geo('cpBadge', () => new THREE.CylinderGeometry(0.06, 0.06, 0.012, 16)), mat(0xd9b44a), 0, 0.13, 0.5).rotateX(Math.PI / 2));
      g.position.set(0, 0.42, -0.02); g.rotation.x = -0.12; head.add(g);
    },
    fedora(head, l) {
      const g = new THREE.Group(), c = mat(l.hatColor);
      g.add(mesh(geo('fdTop', () => new THREE.CylinderGeometry(0.34, 0.42, 0.24, 30)), c, 0, 0.12, 0));
      g.add(mesh(lathe('fdBrim', [[0.38, 0], [0.7, 0.0], [0.74, 0.04], [0.68, 0.025], [0.38, 0.025]], 32), c, 0, 0, 0));
      g.add(mesh(geo('fdBand', () => new THREE.CylinderGeometry(0.423, 0.423, 0.05, 30)), mat(l.accColor || 0x2b2b30), 0, 0.03, 0));
      g.position.set(0, 0.4, -0.02); g.rotation.x = -0.08; head.add(g);
    },
    knit(head, l) {
      const c = mat(l.hatColor);
      const d = mesh(geo('knitD', () => { const g = new THREE.SphereGeometry(0.52, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.5); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { if (p.getY(i) > 0.2) p.setY(i, p.getY(i) + (p.getY(i) - 0.2) * 0.9); } g.computeVertexNormals(); return g; }), c, 0, 0.12, -0.02); d.rotation.x = -0.18; head.add(d);
      const r = mesh(geo('knitR', () => new THREE.TorusGeometry(0.5, 0.06, 10, 36)), mat(shade(l.hatColor, 0.92)), 0, 0.14, -0.01); r.rotation.x = Math.PI / 2 - 0.18; head.add(r);
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
        case 'cape': { const cp = mesh(lathe('acCape', [[0.0001, 0.6], [0.11, 0.58], [0.19, 0.36], [0.23, 0.12], [0.0001, 0.12]]), soften(new THREE.MeshLambertMaterial({ color: col, side: THREE.DoubleSide })), 0, 0, -0.05); cp.scale.z = 0.6; body.add(cp); break; }
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
