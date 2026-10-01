/* =========================================================
 *  주민 방 스타일 키트 21 — 분위기 & 빛 디테일 업그레이드
 *   🫧 에어로   : 진짜 일렁이는 물빛 바닥 (천문대 물빛 셰이더 · 타일 · 물결 링 · 반짝임 · 물고기 그림자)
 *                 + 맑은 하늘 창 & 햇살 줄기 · 떠오르는 비눗방울 · 구름 조명 · 돌고래 인형 · 미니 수족관 · 젤리 쿠션
 *   🌻 노랑     : 레몬 나무 · 꿀단지 선반 & 오리 · 깅엄 커튼 햇살 창 · 데이지 러그 · 오리 인형 · 전구 줄 · 해바라기 화병
 *   🍊 시트러스 : 오렌지 상자 책장 · 풍선 다발 · 별 무드등 · 햇살 창 · 놀이 텐트 · 과일 쿠션 · 전구 줄
 *   + 모든 스타일 방을 더 촘촘하게 (밀도 ↑) · 손대지 않은 방은 새 구성으로 갱신
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, RK = FM.RoomKit;
  if (!RK || !RK._h5) return;
  const { K, T, P, def, ctex, glow, glass, mesh, geo } = RK._h;
  const { cm, pic, rug, plane } = RK._h3;
  const { halo, beam, lightPatch, dust } = RK._h5;
  const PI = Math.PI;
  const f = (type, x, z, rot = 0) => ({ type, x, z, rot });
  const lam = (c, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o));
  const now = () => performance.now() / 1000;
  const anim = (o, fn) => { o.userData.noBake = true; o.onBeforeRender = () => fn(o, now()); return o; };
  // 창 → 방으로 들어오는 햇살 (빛줄기 2겹 + 바닥 창빛 + 먼지)
  const sunIn = (k, key, c, w = 1.2, len = 3.2, op = 0.13, pop = 0.3) => { beam(k, w, len, c, 0, 1.25, 0.9, 0.85, 0, op); beam(k, w * 0.6, len * 0.9, c, 0.3, 1.35, 0.8, 0.8, 0, op * 0.7); lightPatch(k, key, w * 1.05, 1.6, c, 0, 2.0, 0, pop, 2, 3); dust(k, 14, 0xfff8e0, -0.5, 0.5, 0.5, 2.0, 0.3, 2.2, 0.008); };

  // =========================================================
  // 🫧 진짜 물빛 바닥 (셰이더)
  // =========================================================
  const worley = (key, cells, seed) => ctex('k21wor' + key, 256, 256, (c, w, h) => {
    let sd = seed; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const cs = w / cells, P2 = []; for (let j = 0; j < cells; j++) for (let i = 0; i < cells; i++) P2.push([(i + 0.15 + rnd() * 0.7) * cs, (j + 0.15 + rnd() * 0.7) * cs]);
    const img = c.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ci = (x / cs) | 0, cj = (y / cs) | 0; let f1 = 1e9, f2 = 1e9;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = (ci + di + cells) % cells, jj = (cj + dj + cells) % cells, p = P2[jj * cells + ii]; const px = p[0] + (ci + di - ii) * cs, py = p[1] + (cj + dj - jj) * cs; const dd = Math.hypot(px - x, py - y); if (dd < f1) { f2 = f1; f1 = dd; } else if (dd < f2) f2 = dd; }
      const e = (f2 - f1) / cs, v = Math.pow(Math.max(0, 1 - e * 2.3), 2.4) * 0.85 + Math.pow(Math.max(0, 1 - e * 1.1), 5) * 0.3; const q = Math.min(255, v * 255) | 0, o = (y * w + x) * 4;
      d[o] = d[o + 1] = d[o + 2] = q; d[o + 3] = 255;
    }
    c.putImageData(img, 0, 0);
  }, [1, 1]);
  let waterMat = null;
  const waterFloorMat = () => {
    if (waterMat) return waterMat;
    const wA = worley('a', 5, 11), wB = worley('b', 4, 97); for (const t of [wA, wB]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; }
    waterMat = new THREE.ShaderMaterial({
      uniforms: { tA: { value: wA }, tB: { value: wB }, t: { value: 0 }, deep: { value: new THREE.Color(0x0a4ec0) }, shal: { value: new THREE.Color(0x2aa8f0) } },
      vertexShader: 'varying vec2 vUv; varying vec2 vP; void main(){ vUv = uv; vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform sampler2D tA; uniform sampler2D tB; uniform float t; uniform vec3 deep; uniform vec3 shal; varying vec2 vUv; varying vec2 vP;
        void main(){
          vec2 u = vP * 0.3;
          vec2 wob = vec2(sin(u.y * 6.0 + t * 1.1) + sin(u.y * 2.6 - t * 0.7), cos(u.x * 5.0 + t * 0.9) + cos(u.x * 2.2 + t * 0.6)) * 0.022;
          float a = texture2D(tA, u + wob + vec2(t * 0.02, t * 0.013)).r;
          float b = texture2D(tB, u * 0.8 - wob * 1.3 + vec2(-t * 0.015, t * 0.019)).r;
          float c = smoothstep(0.1, 1.0, (a * 0.55 + b * 0.45) * 0.75 + a * b * 1.1);
          vec2 g = fract(vP * 1.6 + wob * 4.0); float grid = smoothstep(0.0, 0.035, g.x) * smoothstep(0.0, 0.035, g.y) * smoothstep(1.0, 0.965, g.x) * smoothstep(1.0, 0.965, g.y);
          vec2 cu = vUv - 0.5; float vig = clamp(1.0 - dot(cu, cu) * 1.6, 0.0, 1.0);
          vec3 base = mix(deep, shal, vig) * (0.84 + 0.16 * grid);
          float rip = 0.0;
          for (int i = 0; i < 3; i++) { float fi = float(i); vec2 cp = vec2(sin(fi * 2.1 + 1.0) * 1.8, cos(fi * 1.7) * 1.2); float ph = fract(t * 0.22 + fi * 0.33); float d = length(vP - cp); rip += smoothstep(0.07, 0.0, abs(d - ph * 2.4)) * (1.0 - ph); }
          vec3 col = base + vec3(0.7, 0.95, 1.0) * c * 0.6 + vec3(0.9, 1.0, 1.0) * rip * 0.3;
          col += step(0.975, texture2D(tA, u * 2.7 + vec2(t * 0.05, -t * 0.03)).r) * 0.55;
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    return waterMat;
  };
  def('k21_water_floor', '진짜 일렁이는 물빛 바닥 (수영장 타일 · 물결)', 'misc', 2400, 7.6, 5.6, g => {
    const k = K(g);
    const p = k.add(mesh(geo('k21wf', () => new THREE.PlaneGeometry(7.6, 5.6)), waterFloorMat(), 0, 0.016, 0, false)); p.rotation.x = -PI / 2; p.renderOrder = 1;
    anim(p, () => { waterMat.uniforms.t.value = now(); });
    // 물고기 그림자 2마리 (빙글빙글)
    const sm = new THREE.MeshBasicMaterial({ color: 0x062a5a, transparent: true, opacity: 0.35, depthWrite: false });
    for (const [r, sp, ph] of [[1.6, 0.25, 0], [1.0, -0.35, 2]]) { const fish = new THREE.Group(); fish.userData.keep = true; g.add(fish); const kf = K(fish); const bd = kf.s(0.12, sm, 0, 0.03, 0, 2.4, 0.05, 0.8); const tl = kf.cone(0.08, 0.16, sm, -0.36, 0.03, 0, 3); tl.rotation.z = PI / 2; tl.scale.z = 0.2; [bd, tl].forEach(o => anim(o, (o2, t) => { const a = t * sp + ph; fish.position.set(Math.cos(a) * r, 0, Math.sin(a) * r * 0.7); fish.rotation.y = -a + (sp > 0 ? -PI / 2 : PI / 2); })); }
  }, { flat: true, tags: ['aero', 'water'] });
  // 맑은 하늘 창 (블리스 언덕) + 햇살
  const skyWin = pic('k21sky', 128, 96, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a8af0'); gr.addColorStop(0.6, '#9ad8ff'); gr.addColorStop(0.61, '#7ad04a'); gr.addColorStop(1, '#3a9a2a'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#5ab83a'; c.beginPath(); c.ellipse(40, h, 70, 32, 0, PI, 0); c.fill(); c.fillStyle = '#ffffff'; for (const [x, y, s] of [[26, 18, 9], [38, 16, 11], [50, 19, 8], [92, 30, 7], [102, 28, 9]]) { c.beginPath(); c.arc(x, y, s, 0, 7); c.fill(); } c.fillStyle = 'rgba(255,255,240,0.9)'; c.beginPath(); c.arc(110, 12, 8, 0, 7); c.fill(); });
  def('k21_sky_window', '맑은 하늘 창 & 햇살 줄기', 'wall', 1500, 1.6, 0.1, g => {
    const k = K(g); k.b(1.6, 1.3, 0.06, 0xffffff, 0, 1.7, 0.02, 0.06); plane(k, 1.42, 1.12, skyWin, 0, 1.7, 0.055); k.b(0.05, 1.12, 0.03, 0xffffff, 0, 1.7, 0.07); k.b(1.42, 0.05, 0.03, 0xffffff, 0, 1.7, 0.07);
    k.b(1.75, 0.07, 0.2, 0xffffff, 0, 1.03, 0.1); for (const x of [-0.6, 0.55]) P.plant(k, x, 1.07, 0.12, 0.7, 0x8ee03a, 0x4ab03a);
    for (const s of [-1, 1]) { const cu = plane(k, 0.32, 1.45, lam(0xd8f4ff, { transparent: true, opacity: 0.75, side: THREE.DoubleSide }), s * 0.92, 1.72, 0.12); cu.rotation.z = s * 0.02; }
    const sub = new THREE.Group(); g.add(sub); sunIn(K(sub), 'k21skyp', 0xf4fcff, 1.3, 3.4, 0.15, 0.32);
  }, { wall: true, tags: ['aero', 'window', 'light'] });
  // 떠오르는 비눗방울 기계
  def('k21_bubble_machine', '비눗방울 기계 (떠오르는 방울)', 'misc', 600, 0.5, 0.5, g => {
    const k = K(g); k.b(0.34, 0.26, 0.28, 0x5ac8f0, 0, 0.13, 0, 0.06); k.c(0.06, 0.06, 0.1, 0xffffff, 0.12, 0.3, 0.12).rotation.x = 0.6; k.s(0.03, 0x2a2a3a, -0.08, 0.2, 0.15);
    const bm = new THREE.MeshPhongMaterial({ color: 0xe8f8ff, transparent: true, opacity: 0.35, shininess: 120, specular: 0xffffff, depthWrite: false });
    for (let i = 0; i < 9; i++) { const r = 0.05 + (i % 3) * 0.025; const b = k.s(r, bm, 0, 0.4, 0); anim(b, (o, t) => { const ph = (t * 0.18 + i / 9) % 1; o.position.set(0.12 + Math.sin(t * 0.9 + i) * 0.3 * ph, 0.4 + ph * 2.0, 0.12 + Math.cos(t * 0.7 + i * 2) * 0.35 * ph); const s = ph < 0.9 ? 1 : (1 - ph) * 10; o.scale.setScalar(s); }); }
  }, { tags: ['aero', 'cute', 'toy'] });
  // 구름 조명 (천장)
  def('k21_cloud_lamp', '뭉게구름 조명 (천장)', 'misc', 900, 1.2, 0.7, g => {
    const k = K(g), y = 2.35; const cm2 = lam(0xffffff, { emissive: 0xc8e8ff, emissiveIntensity: 0.45 });
    for (const [x, z, r] of [[-0.35, 0, 0.26], [0, 0.05, 0.34], [0.36, 0, 0.25], [0.12, -0.12, 0.24], [-0.18, 0.12, 0.22]]) k.s(r, cm2, x, y, z, 1, 0.75, 0.9);
    k.c(0.005, 0.005, 0.5, 0xd8dce4, 0, y + 0.45, 0); for (let i = 0; i < 5; i++) { k.c(0.003, 0.003, 0.4 + (i % 2) * 0.2, 0xd8f0ff, -0.3 + i * 0.15, y - 0.4, 0); k.s(0.025, glow(0x9ad8ff), -0.3 + i * 0.15, y - 0.62 - (i % 2) * 0.1, 0); }
    halo(k, 1.1, 0xbfe8ff, 0, y, 0, 0.5);
  }, { ceiling: true, tags: ['aero', 'lamp', 'cute'], lamp: [[0, 2.2, 0, 0xd8f0ff, 0.5, 4]] });
  def('k21_dolphin', '돌고래 인형 & 조개 쿠션', 'misc', 500, 0.7, 0.5, g => {
    const k = K(g); const dm = lam(0x7ac8f0); const b = k.s(0.16, dm, 0, 0.22, 0, 2.0, 0.9, 0.9); b.rotation.z = 0.25; k.s(0.13, lam(0xe8f8ff), 0.02, 0.18, 0, 1.6, 0.6, 0.85).rotation.z = 0.25; k.cone(0.05, 0.12, dm, 0.04, 0.38, 0, 8);
    const tl = k.cone(0.08, 0.14, dm, -0.32, 0.12, 0, 3); tl.rotation.z = PI / 2 + 0.4; k.c(0.035, 0.05, 0.08, dm, 0.33, 0.29, 0).rotation.z = -1.2; for (const s of [-1, 1]) k.s(0.018, 0x1a2a3a, 0.24, 0.27, s * 0.08);
    const sh = k.s(0.2, lam(0xffc8d8), 0.1, 0.08, 0.18, 1.2, 0.35, 1); void sh; for (let i = 0; i < 5; i++) k.b(0.015, 0.02, 0.22, lam(0xff9ab8), 0.1 + (i - 2) * 0.07, 0.15, 0.18).rotation.y = (i - 2) * 0.2;
  }, { tags: ['aero', 'cute', 'plush'] });
  def('k21_aquarium', '미니 수족관 (흰 받침 · 발광)', 'misc', 1600, 0.9, 0.45, g => {
    const k = K(g); k.b(0.9, 0.6, 0.42, 0xffffff, 0, 0.3, 0, 0.04); k.b(0.86, 0.5, 0.38, new THREE.MeshPhongMaterial({ color: 0x6ad8ff, transparent: true, opacity: 0.55, shininess: 120 }), 0, 0.87, 0);
    k.b(0.8, 0.06, 0.34, 0xf0e0b0, 0, 0.65, 0); for (let i = 0; i < 4; i++) k.k(0.015, 0.2 + (i % 2) * 0.1, lam(0x3ab04a), -0.3 + i * 0.18, 0.78, -0.08);
    for (let i = 0; i < 3; i++) { const fi = new THREE.Group(); fi.userData.keep = true; g.add(fi); const kf = K(fi); const c = [0xff8a3a, 0xffd84a, 0xff5a8a][i]; kf.s(0.04, glow(c), 0, 0, 0, 1.6, 1, 0.6); const tl = kf.cone(0.03, 0.05, glow(c), -0.07, 0, 0, 3); tl.rotation.z = PI / 2; fi.children.forEach(o => anim(o, (o2, t) => { fi.position.set(Math.sin(t * 0.5 + i * 2) * 0.32, 0.85 + Math.sin(t * 0.8 + i) * 0.1, Math.cos(t * 0.6 + i) * 0.08); fi.rotation.y = Math.cos(t * 0.5 + i * 2) > 0 ? 0 : PI; })); }
    k.b(0.9, 0.04, 0.42, 0xffffff, 0, 1.13, 0); halo(k, 0.6, 0x6ae8ff, 0, 0.9, 0.24, 0.5);
  }, { tags: ['aero', 'fish', 'light'], lamp: [[0, 0.9, 0.3, 0x6ae8ff, 0.3, 2.5]] });
  def('k21_jelly_cushions', '말랑 젤리 쿠션 3', 'misc', 400, 0.8, 0.6, g => {
    const k = K(g); [[0x9af0ff, -0.22, 0], [0xc8ff8a, 0.18, 0.05], [0xffc8ec, 0, -0.18]].forEach(([c, x, z]) => { k.s(0.2, new THREE.MeshPhongMaterial({ color: c, transparent: true, opacity: 0.85, shininess: 120, specular: 0xffffff }), x, 0.14, z, 1, 0.65, 1); k.s(0.05, glass(0xffffff), x - 0.06, 0.24, z + 0.08); });
  }, { tags: ['aero', 'cute'], use: [{ pose: 'sit', dx: 0, dz: 0, face: 0, act: 'sit', seatH: 0.22 }] });

  // =========================================================
  // 🌻 노랑 원목 오두막 — 더 귀엽고 상큼하게
  // =========================================================
  const gingham = ctex('k21ging', 32, 32, (c, w, h) => { c.fillStyle = '#fffbe8'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(248,200,40,0.55)'; c.fillRect(0, 0, 16, h); c.fillRect(0, 0, w, 16); c.fillStyle = 'rgba(248,200,40,0.35)'; c.fillRect(0, 0, 16, 16); });
  gingham.wrapS = gingham.wrapT = THREE.RepeatWrapping; gingham.repeat.set(4, 6);
  const lakeWin = pic('k21lake', 128, 96, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9ad8ff'); gr.addColorStop(0.5, '#e8f8ff'); gr.addColorStop(0.51, '#6ab04a'); gr.addColorStop(0.62, '#4a9a3a'); gr.addColorStop(0.63, '#6ac0e8'); gr.addColorStop(1, '#3a90c8'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#2a6a2a'; for (let i = 0; i < 12; i++) { c.beginPath(); c.moveTo(i * 12, 52); c.lineTo(i * 12 + 6, 30 + (i % 3) * 5); c.lineTo(i * 12 + 12, 52); c.fill(); } c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(20, 70, 30, 2); c.fillRect(70, 80, 24, 2); });
  def('k21_sun_window', '깅엄 커튼 햇살 창 (호수 풍경)', 'wall', 1400, 1.6, 0.12, g => {
    const k = K(g), wd = T.woodgrain(0xe8b878); k.b(1.5, 1.2, 0.08, wd, 0, 1.65, 0.02); plane(k, 1.32, 1.02, lakeWin, 0, 1.65, 0.065); k.b(0.05, 1.02, 0.03, wd, 0, 1.65, 0.08); k.b(1.32, 0.05, 0.03, wd, 0, 1.65, 0.08);
    k.b(1.7, 0.06, 0.2, wd, 0, 1.03, 0.1); P.plant(k, -0.5, 1.06, 0.12, 0.7, 0xf8d040, 0x5aae4a); P.mug(k, 0.45, 1.06, 0.12, 0xf8d040);
    k.c(0.012, 0.012, 1.9, 0xc89a5a, 0, 2.33, 0.14).rotation.z = PI / 2;
    for (const s of [-1, 1]) { const cu = plane(k, 0.42, 1.4, new THREE.MeshLambertMaterial({ map: gingham, side: THREE.DoubleSide }), s * 0.8, 1.62, 0.15); cu.rotation.z = s * 0.04; k.b(0.06, 0.08, 0.02, 0xf8c828, s * 0.78, 1.25, 0.17); }
    const pl = plane(k, 1.6, 0.18, new THREE.MeshLambertMaterial({ map: gingham, side: THREE.DoubleSide }), 0, 2.24, 0.15); void pl;
    const sub = new THREE.Group(); g.add(sub); sunIn(K(sub), 'k21sunp', 0xfff0b8, 1.25, 3.3, 0.15, 0.34);
  }, { wall: true, tags: ['yellow', 'window', 'light', 'cute'] });
  def('k21_lemon_tree', '레몬 나무 화분', 'misc', 900, 0.7, 0.7, g => {
    const k = K(g); k.c(0.22, 0.17, 0.36, lam(0xf8f0e0), 0, 0.18, 0); k.t(0.22, 0.02, 0xf8c828, 0, 0.33, 0).rotation.x = PI / 2; k.c(0.03, 0.04, 0.8, 0x8a6a40, 0, 0.75, 0);
    for (let i = 0; i < 9; i++) { const a = i * 0.7; k.s(0.2, 0x4ea83e, Math.cos(a) * 0.18, 1.2 + (i % 3) * 0.12, Math.sin(a) * 0.18, 1, 0.8, 1); }
    for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.3; k.s(0.05, 0xf8e040, Math.cos(a) * 0.3, 1.1 + (i % 3) * 0.14, Math.sin(a) * 0.3, 1, 1.25, 1); }
  }, { tags: ['yellow', 'plant', 'cute'] });
  def('k21_honey_shelf', '꿀단지 & 고무오리 벽 선반', 'wall', 600, 1.2, 0.25, g => {
    const k = K(g), wd = T.woodgrain(0xd8a060); for (const y of [1.35, 1.8]) { k.b(1.1, 0.04, 0.22, wd, 0, y, 0.12); for (const x of [-0.5, 0.5]) k.b(0.04, 0.12, 0.18, wd, x, y - 0.08, 0.1); }
    for (let i = 0; i < 4; i++) { const x = -0.38 + i * 0.25; k.c(0.06, 0.07, 0.15, new THREE.MeshPhongMaterial({ color: 0xf8b828, transparent: true, opacity: 0.85, shininess: 80 }), x, 1.45, 0.13); k.c(0.065, 0.065, 0.03, 0xffffff, x, 1.54, 0.13); }
    for (let i = 0; i < 3; i++) { const x = -0.3 + i * 0.3; k.s(0.07, 0xf8d828, x, 1.88, 0.13, 1.2, 0.8, 1); k.s(0.045, 0xf8d828, x + 0.06, 1.97, 0.13); k.cone(0.02, 0.05, 0xff8a28, x + 0.11, 1.96, 0.13, 6).rotation.z = -PI / 2; }
  }, { wall: true, tags: ['yellow', 'cute', 'shelf'] });
  def('k21_daisy_rug', '데이지 꽃 러그', 'misc', 600, 1.6, 1.6, g => { const k = K(g); rug(k, 1.6, 1.6, cm('k21daisy', 128, 128, (c, w, h) => { c.fillStyle = '#ffffff'; for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; c.beginPath(); c.ellipse(64 + Math.cos(a) * 36, 64 + Math.sin(a) * 36, 26, 15, a, 0, 7); c.fill(); } c.fillStyle = '#f8c828'; c.beginPath(); c.arc(64, 64, 30, 0, 7); c.fill(); c.fillStyle = 'rgba(200,140,20,0.4)'; for (let i = 0; i < 20; i++) { c.beginPath(); c.arc(64 + Math.cos(i) * (i % 4) * 6, 64 + Math.sin(i) * (i % 4) * 6, 2, 0, 7); c.fill(); } })); }, { flat: true, tags: ['yellow', 'rug', 'cute'] });
  def('k21_duck_plush', '왕 오리 인형 & 해바라기 화병', 'misc', 500, 0.7, 0.5, g => {
    const k = K(g); k.s(0.2, 0xf8d838, -0.12, 0.2, 0, 1.15, 0.95, 1); k.s(0.14, 0xf8d838, -0.05, 0.44, 0.04); k.cone(0.05, 0.12, 0xff9a28, 0.04, 0.42, 0.16, 8).rotation.x = PI / 2; for (const s of [-1, 1]) k.s(0.018, 0x1a1a1a, -0.05 + s * 0.06, 0.5, 0.15); k.s(0.08, 0xf8d838, -0.3, 0.24, -0.02, 0.6, 1, 1.2);
    k.c(0.07, 0.06, 0.25, glass(0xd8f0ff), 0.22, 0.13, 0); for (let i = 0; i < 3; i++) { const a = i * 2.1; k.c(0.006, 0.006, 0.35, 0x4a8a3a, 0.22 + Math.cos(a) * 0.03, 0.42, Math.sin(a) * 0.03); const fl = k.s(0.06, 0xf8c828, 0.22 + Math.cos(a) * 0.07, 0.6 + (i % 2) * 0.05, Math.sin(a) * 0.07, 1, 0.3, 1); fl.rotation.x = 0.6; k.s(0.025, 0x6a3a18, 0.22 + Math.cos(a) * 0.07, 0.62 + (i % 2) * 0.05, Math.sin(a) * 0.07 + 0.02); }
  }, { tags: ['yellow', 'cute', 'plush'] });
  def('k21_bulb_string', '따뜻한 전구 줄 (벽)', 'wall', 400, 2.4, 0.1, g => { const k = K(g); for (let i = 0; i < 11; i++) { const x = -1.1 + i * 0.22, y = 2.45 - Math.sin(i / 10 * PI) * 0.22; k.s(0.035, glow(0xfff0b0), x, y, 0.08); halo(k, 0.14, 0xffd890, x, y, 0.1, 0.55); } for (let i = 0; i < 10; i++) { const x = -1.0 + i * 0.22; const w2 = k.c(0.004, 0.004, 0.23, 0x3a3a3a, x, 2.45 - Math.sin((i + 0.5) / 10 * PI) * 0.22 + 0.02, 0.08); w2.rotation.z = PI / 2; } }, { wall: true, tags: ['lamp', 'cute'], lamp: [[0, 2.35, 0.3, 0xffd890, 0.25, 3]] });

  // =========================================================
  // 🍊 시트러스 아이방 — 더 상큼하게
  // =========================================================
  def('k21_orange_crates', '오렌지 상자 책장 (그림책 · 장난감)', 'storage', 900, 1.2, 0.45, g => {
    const k = K(g), wd = T.woodgrain(0xe8b070);
    for (const [x, y] of [[-0.3, 0.2], [0.3, 0.2], [0, 0.6]]) { k.b(0.56, 0.38, 0.4, wd, x, y, 0, 0.02); k.b(0.5, 0.32, 0.02, 0x8a5a2a, x, y, -0.18); plane(k, 0.3, 0.1, pic('k21crate', 64, 20, (c, w, h) => { c.fillStyle = '#e8b070'; c.fillRect(0, 0, w, h); c.fillStyle = '#ff7a1a'; c.beginPath(); c.arc(10, 10, 7, 0, 7); c.fill(); c.font = 'bold 12px sans-serif'; c.fillText('ORANGE', 20, 15); }), x, y - 0.1, 0.205); }
    for (let i = 0; i < 6; i++) P.book(k, -0.5 + i * 0.07, 0.08, 0, [0xff7a1a, 0x3a9aff, 0xf8d040, 0x5ac05a, 0xff6a8a, 0xffffff][i], 0.05);
    for (let i = 0; i < 3; i++) k.s(0.06, 0xff8a1a, 0.15 + i * 0.12, 0.08, 0.02);
    P.plush(k, 0, 0.8, 0, 0xffb060, 'bunny', 0.7);
  }, { tags: ['citrus', 'storage', 'cute'] });
  def('k21_balloons', '풍선 다발 (오렌지 · 민트 · 레몬)', 'misc', 400, 0.5, 0.5, g => {
    const k = K(g); k.b(0.12, 0.08, 0.12, 0xff8a1a, 0, 0.04, 0, 0.02);
    [[0xff8a1a, -0.15, 1.6, 0], [0x8ae0c8, 0.12, 1.75, 0.05], [0xf8e040, 0.02, 1.95, -0.08], [0xff9ab8, -0.05, 1.5, 0.15]].forEach(([c, x, y, z], i) => { const b = k.s(0.16, new THREE.MeshPhongMaterial({ color: c, shininess: 90, specular: 0xffffff }), x, y, z, 1, 1.15, 1); anim(b, (o, t) => { o.position.y = y + Math.sin(t * 1.2 + i) * 0.04; }); const s = k.c(0.003, 0.003, y - 0.08, 0xffffff, x * 0.5, (y - 0.08) / 2, z * 0.5); s.rotation.z = -x * 0.3; });
  }, { tags: ['citrus', 'cute', 'toy'] });
  def('k21_star_nightlight', '별 · 달 무드등', 'misc', 500, 0.4, 0.4, g => {
    const k = K(g); k.c(0.12, 0.14, 0.05, 0xfff4e0, 0, 0.025, 0); const st = k.add(mesh(geo('k21st', () => new THREE.OctahedronGeometry(0.13)), glow(0xfff0a0), 0, 0.25, 0)); st.scale.set(1, 1.2, 0.5);
    k.t(0.12, 0.035, glow(0xffe8c0), 0.16, 0.38, 0, PI * 1.2).rotation.z = 0.8; halo(k, 0.5, 0xffe8a0, 0, 0.3, 0.1, 0.6);
  }, { tags: ['citrus', 'lamp', 'cute'], lamp: [[0, 0.4, 0.2, 0xffd890, 0.25, 2]] });
  def('k21_play_tent', '오렌지 줄무늬 놀이 텐트', 'misc', 1100, 1.1, 1.1, g => {
    const k = K(g); const tm2 = new THREE.MeshLambertMaterial({ map: FM.AC ? FM.AC.stripe('#ff9a3a', '#fff8ec') : null, side: THREE.DoubleSide });
    const tn = k.add(mesh(geo('k21tent', () => new THREE.ConeGeometry(0.6, 1.4, 4, 1, true)), tm2, 0, 0.7, 0)); tn.rotation.y = PI / 4;
    for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2; const p2 = k.c(0.01, 0.01, 1.6, 0xd8b080, Math.cos(a) * 0.32, 0.8, Math.sin(a) * 0.32); p2.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); }
    k.s(0.2, lam(0xfff0d8), 0, 0.08, 0.1, 1.3, 0.3, 1.1); for (let i = 0; i < 6; i++) { k.cone(0.05, 0.08, [0xff8a1a, 0x8ae0c8, 0xf8e040][i % 3], -0.45 + i * 0.18, 1.12 - Math.abs(i - 2.5) * 0.04, 0.42, 3).rotation.x = PI; }
    halo(k, 0.35, 0xffd890, 0, 0.5, 0.2, 0.4);
  }, { tags: ['citrus', 'cute', 'toy'], use: [{ pose: 'sit', dx: 0, dz: 0.1, face: 0, act: 'sit', seatH: 0.12 }] });
  def('k21_fruit_cushions', '과일 쿠션 (오렌지 · 수박 · 레몬)', 'misc', 400, 0.8, 0.6, g => {
    const k = K(g); k.s(0.17, 0xff8a1a, -0.22, 0.15, 0, 1, 0.8, 1); k.s(0.04, 0x4aa03a, -0.22, 0.29, 0, 1.6, 0.4, 1);
    const wm = k.s(0.18, 0x3aa03a, 0.18, 0.14, 0.04, 1, 0.75, 1); void wm; k.c(0.16, 0.16, 0.02, 0xff5a6a, 0.18, 0.15, 0.13, 20).rotation.x = PI / 2;
    k.s(0.13, 0xf8e040, 0, 0.12, -0.2, 1.3, 0.85, 1);
  }, { tags: ['citrus', 'cute'], use: [{ pose: 'sit', dx: 0, dz: 0, face: 0, act: 'sit', seatH: 0.24 }] });
  def('k21_orange_window', '오렌지 체크 커튼 햇살 창', 'wall', 1300, 1.6, 0.12, g => {
    const k = K(g), wd = T.woodgrain(0xf4e4c8); k.b(1.5, 1.2, 0.08, wd, 0, 1.65, 0.02); plane(k, 1.32, 1.02, skyWin, 0, 1.65, 0.065); k.b(0.05, 1.02, 0.03, wd, 0, 1.65, 0.08); k.b(1.32, 0.05, 0.03, wd, 0, 1.65, 0.08);
    const og = ctex('k21oging', 32, 32, (c, w, h) => { c.fillStyle = '#fff6e8'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,140,30,0.5)'; c.fillRect(0, 0, 16, h); c.fillRect(0, 0, w, 16); }); og.wrapS = og.wrapT = THREE.RepeatWrapping; og.repeat.set(4, 6);
    for (const s of [-1, 1]) plane(k, 0.42, 1.4, new THREE.MeshLambertMaterial({ map: og, side: THREE.DoubleSide }), s * 0.8, 1.62, 0.15);
    k.b(1.7, 0.06, 0.2, wd, 0, 1.03, 0.1); for (const x of [-0.5, 0.0, 0.5]) k.s(0.06, 0xff8a1a, x, 1.12, 0.12);
    const sub = new THREE.Group(); g.add(sub); sunIn(K(sub), 'k21orp', 0xfff0c8, 1.25, 3.3, 0.15, 0.32);
  }, { wall: true, tags: ['citrus', 'window', 'light'] });

  // =========================================================
  // 스타일 갱신 — 더 촘촘하게 · 더 귀엽게
  // =========================================================
  const S = RK.STYLES;
  if (S.aero) {
    S.aero.floorColor = 0x1a7ae0;
    S.aero.furn.unshift(f('k21_water_floor', 0, 0));
    S.aero.furn.push(f('k21_sky_window', -1.4, -2.94), f('k21_sky_window', 3.94, -1.6, -90), f('k21_bubble_machine', -0.4, 2.55), f('k21_cloud_lamp', 0.4, 0.6), f('k21_dolphin', 2.9, 1.25), f('k21_aquarium', -3.5, 1.05, 90), f('k21_jelly_cushions', 0.3, 1.5));
    S.aero.fill.push('k21_bubble_machine', 'k21_dolphin', 'k21_jelly_cushions'); S.aero.wallFill.push('k21_sky_window', 'k21_bulb_string');
    S.aero.density = 1.6; S.aero.maxSame = 3;
    Object.assign(S.aero.mood, { main: 0.95, lamp: 1.15 });
  }
  if (S.yellow) {
    S.yellow.furn.push(f('k21_sun_window', -0.6, -2.94), f('k21_lemon_tree', 3.55, -2.45), f('k21_honey_shelf', -3.94, 0.4, 90), f('k21_daisy_rug', 1.4, 1.6), f('k21_duck_plush', 1.5, 2.55), f('k21_bulb_string', 3.94, 0.0, -90), f('k21_bulb_string', -2.4, -2.94));
    S.yellow.fill.push('k21_lemon_tree', 'k21_duck_plush', 'k21_lemon_tree'); S.yellow.wallFill.push('k21_honey_shelf', 'k21_bulb_string', 'k21_sun_window');
    S.yellow.density = 1.55; S.yellow.maxSame = 3;
    Object.assign(S.yellow.mood, { main: 1.0, lamp: 1.15, dir: [0xfff0c0, 0.58] });
  }
  if (S.citrus) {
    S.citrus.furn.push(f('k21_orange_window', 3.94, 0.9, -90), f('k21_orange_crates', -3.4, 0.0, 90), f('k21_balloons', -3.55, -1.4), f('k21_star_nightlight', 3.6, 1.6), f('k21_play_tent', -2.8, 2.2), f('k21_fruit_cushions', 0.9, 1.6), f('k21_bulb_string', -3.94, 1.9, 90));
    S.citrus.fill.push('k21_balloons', 'k21_fruit_cushions', 'k21_star_nightlight'); S.citrus.wallFill.push('k21_bulb_string', 'k21_orange_window');
    S.citrus.density = 1.6; S.citrus.maxSame = 3;
    Object.assign(S.citrus.mood, { main: 0.98, lamp: 1.15 });
  }
  // 모든 스타일: 덜 휑하게 (빈 곳 채우기 밀도 ↑ — 각 스타일 값의 1.3배, 최소 1.3)
  // 바닥에 뜬금없이 놓이는 책 더미는 빈 곳 채우기에서 뺌 (서가 · 선반 위 책은 그대로)
  const FLOOR_BOOKS = /^(k_books_floor|k13_book_stack|k9_book_piles|k18j_book_stack)$/;
  for (const st of Object.values(S)) { if (st.fill) st.fill = st.fill.filter(t => !FLOOR_BOOKS.test(t)); if (st.furn) st.furn = st.furn.filter(o => !FLOOR_BOOKS.test(o.type)); }
  for (const st of Object.values(S)) { st.density = Math.max(1.3, (st.density || 1) * (st === S.aero || st === S.yellow || st === S.citrus ? 1 : 1.3)); if (!st.maxSame) st.maxSame = 3; }
})();

// =========================================================
// 🍵 달빛 다실 · 🥟 홍등반점 — 바닥 책 치우고 좌석 늘리기 + 빛 웅덩이 · 천장 등롱
// =========================================================
(() => {
  'use strict';
  const FM = window.FM, RK = FM.RoomKit, INT = FM.INTERIORS;
  if (!RK || !RK._h5 || !INT) return;
  const { K, T, def, ctex, glow, mesh, geo } = RK._h;
  const { rug, plane, pic } = RK._h3;
  const { halo, lightPatch, dust } = RK._h5;
  const PI = Math.PI;
  const f = (type, x, z, rot = 0) => ({ type, x, z, rot });
  const lam = (c, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o));
  const DK = T.woodgrain(0x3a2416), DK2 = T.woodgrain(0x5a3a22);
  const zab = (k, x, z, c, a = 0) => { const zb = k.b(0.5, 0.08, 0.5, c, x, 0.04, z, 0.04); zb.rotation.y = a; k.s(0.03, 0xd8b070, x, 0.09, z); };
  // 차부다이 (둥근 좌식 밥상) + 방석 3 + 다기
  def('k21j_chabudai', '둥근 좌식 밥상 (방석 3 · 다기 · 화과자)', 'misc', 1800, 1.9, 1.9, g => {
    const k = K(g); k.c(0.5, 0.5, 0.05, DK2, 0, 0.36, 0, 28); for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2 + PI / 4; k.b(0.06, 0.34, 0.06, DK, Math.cos(a) * 0.36, 0.17, Math.sin(a) * 0.36, 0.01); }
    k.c(0.07, 0.06, 0.1, lam(0x3a4a3a), 0, 0.44, 0); for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2 + 0.5; k.c(0.035, 0.03, 0.05, 0xf4ecdc, Math.cos(a) * 0.28, 0.41, Math.sin(a) * 0.28); }
    k.c(0.11, 0.11, 0.015, 0x8a2a1a, 0.18, 0.395, -0.12); for (let i = 0; i < 3; i++) k.s(0.03, [0xffb8c8, 0xf4f0e0, 0x8ac06a][i], 0.15 + i * 0.04, 0.42, -0.12);
    for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2; zab(k, Math.sin(a) * 0.78, Math.cos(a) * 0.78, [0x2a3a5a, 0x7a2a2a, 0x3a5a3a][i], a); }
    halo(k, 0.5, 0xffc070, 0, 0.5, 0, 0.25);
  }, { tags: ['japanese', 'table', 'tea'], use: [0, 1, 2].map(i => { const a = i / 3 * PI * 2; return { pose: 'drink', dx: Math.sin(a) * 0.78, dz: Math.cos(a) * 0.78, face: i * 120 + 180, act: 'tea_heal', seatH: 0.12, prop: 'teacup' }; }) });
  // 천장 종이 등롱 줄 (3개) + 따뜻한 빛 웅덩이
  def('k21j_ceiling_lanterns', '천장 종이 등롱 3 (빛 웅덩이)', 'misc', 900, 2.2, 0.6, g => {
    const k = K(g); const pm = lam(0xfff0d8, { emissive: 0xffb860, emissiveIntensity: 0.55 });
    for (const x of [-0.8, 0, 0.8]) { const y = 2.25 - (x === 0 ? 0.15 : 0); k.c(0.004, 0.004, 0.6, 0x2a2a2a, x, y + 0.5, 0); k.s(0.2, pm, x, y, 0, 1, 1.3, 1); for (const dy of [-0.25, 0.25]) k.c(0.12, 0.12, 0.04, 0x1a1a1a, x, y + dy, 0); halo(k, 0.55, 0xffb860, x, y, 0, 0.6); }
    lightPatch(k, 'k21jlp', 2.6, 1.6, 0xffb060, 0, 0, 0, 0.22, 1, 1, false);
  }, { ceiling: true, tags: ['japanese', 'lamp'], lamp: [[0, 2.1, 0, 0xffb060, 0.35, 4]] });
  // 장지 창빛 (바닥에 떨어지는 격자 달빛)
  def('k21j_shoji_glow', '바닥에 비친 장지 격자 빛', 'misc', 200, 1.6, 1.4, g => { const k = K(g); lightPatch(k, 'k21jsg', 1.6, 1.4, 0xffd8a0, 0, 0, 0, 0.3, 4, 3, false); dust(k, 10, 0xfff0d0, -0.6, 0.6, 0.3, 1.8, -0.5, 0.5, 0.008); }, { flat: true, tags: ['japanese', 'light'] });
  // 다다미 평상 (2인 좌석)
  def('k21j_tatami_bench', '다다미 평상 (방석 2 · 차 쟁반)', 'misc', 1400, 1.6, 0.9, g => {
    const k = K(g); k.b(1.6, 0.36, 0.9, DK, 0, 0.18, 0, 0.03); k.b(1.5, 0.04, 0.8, lam(0xc8c088), 0, 0.38, 0, 0.01); for (let i = 0; i < 4; i++) k.b(0.02, 0.041, 0.8, lam(0x8a7a48), -0.6 + i * 0.4, 0.39, 0);
    for (const x of [-0.4, 0.4]) { const zb = k.b(0.46, 0.07, 0.46, 0x7a2a2a, x, 0.43, 0.05, 0.04); void zb; }
    k.b(0.36, 0.03, 0.24, DK2, 0, 0.42, -0.25, 0.01); k.c(0.03, 0.025, 0.05, 0xf4ecdc, -0.06, 0.46, -0.25); k.c(0.03, 0.025, 0.05, 0xf4ecdc, 0.06, 0.46, -0.25);
  }, { tags: ['japanese', 'chair'], use: [-0.4, 0.4].map(x => ({ pose: 'drink', dx: x, dz: 0.05, face: 0, act: 'tea_heal', seatH: 0.46, prop: 'teacup' })) });

  // 중국집: 천장 큰 홍등 (빛 웅덩이) · 2인 사각 테이블
  def('k21c_big_lantern', '천장 큰 홍등 (금 술 · 빛 웅덩이)', 'misc', 900, 1.0, 1.0, g => {
    const k = K(g); const lm = lam(0xe0301a, { emissive: 0xff4a20, emissiveIntensity: 0.6 }); const y = 2.3;
    k.c(0.006, 0.006, 0.5, 0x2a2a2a, 0, y + 0.55, 0); k.s(0.32, lm, 0, y, 0, 1, 0.85, 1); for (const dy of [-0.26, 0.26]) k.c(0.18, 0.18, 0.06, lam(0xd4a848), 0, y + dy, 0);
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; k.c(0.006, 0.006, 0.36, 0xc8201a, Math.cos(a) * 0.32, y - 0.1, Math.sin(a) * 0.32); }
    k.c(0.02, 0.05, 0.3, lam(0xd4a848), 0, y - 0.48, 0); halo(k, 0.9, 0xff6a30, 0, y, 0, 0.65);
    lightPatch(k, 'k21clp', 1.8, 1.8, 0xff8a40, 0, 0, 0, 0.24, 1, 1, false);
  }, { ceiling: true, tags: ['chinese', 'lamp'], lamp: [[0, 2.1, 0, 0xff7a40, 0.4, 4]] });
  def('k21c_floor_glow', '홍등 아래 붉은 빛 웅덩이', 'misc', 100, 2.0, 2.0, g => { const k = K(g); lightPatch(k, 'k21cfg', 2.2, 2.2, 0xff7a3a, 0, 0, 0, 0.2, 1, 1, false); }, { flat: true, tags: ['chinese', 'light'] });
  def('k21c_tea_table', '2인 자단 찻상 (청화 찻잔 · 월병)', 'misc', 1500, 1.6, 1.0, g => {
    const k = K(g), RW = T.woodgrain(0x5a1a10); k.b(0.8, 0.05, 0.6, RW, 0, 0.72, 0, 0.02); for (const [x, z] of [[-0.35, -0.25], [0.35, -0.25], [-0.35, 0.25], [0.35, 0.25]]) k.b(0.05, 0.7, 0.05, RW, x, 0.35, z, 0.01);
    k.c(0.08, 0.07, 0.12, lam(0xf4f0e8), 0, 0.81, 0); k.c(0.03, 0.03, 0.04, 0x2a4aa0, 0, 0.88, 0); for (const x of [-0.2, 0.2]) k.c(0.035, 0.03, 0.05, 0xf4f0e8, x, 0.77, 0.12); k.c(0.06, 0.06, 0.03, 0xc89040, 0.22, 0.76, -0.14);
    for (const s of [-1, 1]) { const sub = new THREE.Group(); sub.position.set(s * 0.68, 0, 0); g.add(sub); const q = K(sub); q.b(0.42, 0.05, 0.42, RW, 0, 0.46, 0, 0.02); for (const [x, z] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) q.b(0.04, 0.44, 0.04, RW, x, 0.22, z, 0.01); q.b(0.04, 0.5, 0.4, RW, s * 0.19, 0.74, 0, 0.01); q.b(0.4, 0.04, 0.38, lam(0xc8201a), 0, 0.5, 0, 0.02); }
  }, { tags: ['chinese', 'table'], use: [-1, 1].map(s => ({ pose: 'eat', dx: s * 0.68, dz: 0, face: s * -90, act: 'pub', seatH: 0.5 })) });

  const TEA = INT.tea_in;
  if (TEA) {
    TEA.furn = TEA.furn.filter(x => x.type !== 'k18j_book_stack');
    TEA.furn.push(f('k21j_chabudai', 0.3, -0.75), f('k21j_chabudai', -3.6, 1.5), f('k21j_chabudai', 3.8, 3.3), f('k21j_tatami_bench', 4.6, -2.0, -90),
      f('k21j_ceiling_lanterns', -1.6, 0.9), f('k21j_ceiling_lanterns', 2.2, 2.4), f('k21j_ceiling_lanterns', 0.3, -0.75),
      f('k21j_shoji_glow', -4.6, 2.4), f('k21j_shoji_glow', 4.6, 1.9), f('k21j_shoji_glow', -4.6, -3.0));
    TEA.maxLamps = 18;
  }
  const PUB = INT.pub_in;
  if (PUB) {
    PUB.furn = PUB.furn.filter(x => !/book_stack/.test(x.type));
    PUB.furn.push(f('k18c_rug', 1.6, -1.5), f('k18c_table', 1.6, -1.5, 30), f('k21c_big_lantern', 1.6, -1.5), f('k21c_tea_table', -0.85, -0.9), f('k21c_tea_table', 3.4, 3.6),
      f('k21c_floor_glow', -3.3, -1.3), f('k21c_floor_glow', 0.7, 1.4), f('k21c_floor_glow', 3.9, 1.5), f('k21c_floor_glow', -4.2, 2.5));
    PUB.maxLamps = 18;
  }
  const SCH = INT.school_in;
  if (SCH) SCH.furn = SCH.furn.filter(x => x.type !== 'k13_book_stack');
})();
