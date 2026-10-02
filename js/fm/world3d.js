/* =========================================================
 *  섬 3D 월드 — 지형, 바다, 폭포, 구름다리, 도로, 5대 구역 건물, 장식,
 *  하늘/낮밤/날씨, 아파트 창문 상태 풍선, 전광판
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE, MAP = FM.MAP, T = FM.T, PM = FM.PM;
  const H = ISLE.M.h;
  const { mat, sphere, box, cyl, mesh } = H;
  const W = (FM.W = {});

  W.seaU = { value: 0 };
  W.seaY = () => (sea ? sea.position.y : 0.06);
  let scene, sun, hemi, amb, sky, skyMat, sea, seaTex, starPts, milky, rainPts, fogCol;
  const dyn = { waters: [], fires: [], bulbs: [], lampLights: [], jets: [], birds: [], cars: [], windows: {}, board: null, termBoard: null, wedding: null, weddingTrash: [], fireflies: null, sandNames: [], leaves: null, pets: [] };
  // 성당 앞 상설 웨딩 가든 영역 (roomkit12) — 풀 · 꽃 · 가로등을 비움
  const inRect = (r, x, z) => !!r && x > r[0] - 0.4 && x < r[1] + 0.4 && z > r[2] - 0.4 && z < r[3] + 0.4;
  const inGarden = (x, z) => inRect(FM.GARDEN_RECT, x, z) || inRect(FM.SUNSET_RECT, x, z);
  W.dyn = dyn;

  // ---------------------------------------------------------
  // 하늘 (그라데이션 셰이더)
  // ---------------------------------------------------------
  function makeSky() {
    skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(0x7cc8ff) }, bottom: { value: new THREE.Color(0xdff4ff) }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color(0xfff4d0) } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 bottom; uniform vec3 sunDir; uniform vec3 sunCol; varying vec3 vP; void main(){ float h = clamp(vP.y*1.4+0.15,0.0,1.0); vec3 c = mix(bottom, top, h); float s = pow(max(dot(vP, sunDir),0.0), 180.0); float g = pow(max(dot(vP, sunDir),0.0), 8.0)*0.25; gl_FragColor = vec4(c + sunCol*(s+g), 1.0); }',
    });
    sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), skyMat);
    scene.add(sky);
    // 별 & 은하수
    const n = 1400, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const t = Math.random() * Math.PI * 2, p = Math.acos(Math.random() * 0.95); pos[i * 3] = Math.sin(p) * Math.cos(t) * 800; pos[i * 3 + 1] = Math.cos(p) * 800; pos[i * 3 + 2] = Math.sin(p) * Math.sin(t) * 800; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    starPts = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }));
    scene.add(starPts);
    const mw = PM.ctex('milky', 512, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(200,180,255,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.9})`; g.fillRect(Math.random() * w, h / 2 + (Math.random() - 0.5) * h * 0.7 * Math.random(), 1.5, 1.5); } });
    milky = new THREE.Mesh(new THREE.PlaneGeometry(1500, 260), new THREE.MeshBasicMaterial({ map: mw, transparent: true, opacity: 0, depthWrite: false, fog: false, side: THREE.DoubleSide }));
    milky.position.set(0, 520, -200); milky.rotation.set(-1.1, 0.3, 0.5);
    scene.add(milky);
    makeSkyDeco();
  }
  // 하늘 꾸미기: 몽실몽실 구름 · 열기구 · 갈매기
  function makeSkyDeco() {
    const cg = new THREE.Group(); cg.name = 'clouds';
    const puffs = [];
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * Math.PI * 2 + Math.random() * 0.2, r = 150 + Math.random() * 260, y = 70 + Math.random() * 70;
      const cx = Math.cos(a) * r, cz = Math.sin(a) * r, size = 7 + Math.random() * 9, n = 5 + (Math.random() * 4 | 0);
      for (let k = 0; k < n; k++) {
        const t = k / (n - 1) - 0.5;
        puffs.push([cx + t * size * 2.6 + (Math.random() - 0.5) * size * 0.6, y + (1 - Math.abs(t) * 1.6) * size * 0.45 + Math.random() * size * 0.2, cz + (Math.random() - 0.5) * size * 0.9, size * (0.65 + (0.5 - Math.abs(t)) * 0.7 + Math.random() * 0.2)]);
      }
    }
    const cm = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xaeb8c8, fog: false });
    const ci = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 7), cm, puffs.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
    puffs.forEach(([x, y, z, r], i) => { p3.set(x, y, z); s3.set(r, r * 0.72, r * 0.9); m4.compose(p3, q, s3); ci.setMatrixAt(i, m4); });
    cg.add(ci); scene.add(cg);
    dyn.clouds = cg; dyn.cloudMat = cm;
    // 열기구 3개
    dyn.balloons = [];
    const stripes = [['#ff8fb1', '#fff4d6'], ['#7ab8ff', '#ffffff'], ['#ffd84a', '#ff8f6a']];
    stripes.forEach(([c1, c2], i) => {
      const b = new THREE.Group();
      const tex = PM.ctex('balloon' + i, 256, 64, (g, w, h) => { for (let x = 0; x < w; x += 32) { g.fillStyle = (x / 32) % 2 ? c2 : c1; g.fillRect(x, 0, 32, h); } });
      const env = new THREE.Mesh(new THREE.LatheGeometry([[0.01, -3.2], [1.2, -2.6], [3, -0.8], [3.4, 1], [2.8, 2.8], [0.01, 3.6]].map(([x, y]) => new THREE.Vector2(x, y)), 24), H.soften(new THREE.MeshLambertMaterial({ map: tex, fog: false })));
      b.add(env);
      for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) b.add(mesh(cyl(0.02, 0.02, 2, 4), mat(0x8a5a3b), x, -4.2, z));
      b.add(mesh(box(1.3, 0.9, 1.3, 0.1), mat(0xc99760), 0, -5.5, 0));
      const ang = i / 3 * Math.PI * 2 + 0.6, rad = 90 + i * 25;
      b.userData = { ang, rad, h: 48 + i * 9, sp: 0.012 + i * 0.004 };
      b.scale.setScalar(1.6);
      scene.add(b); dyn.balloons.push(b);
    });
    // 갈매기 (V자 날개)
    dyn.gulls = [];
    for (let i = 0; i < 7; i++) {
      const gg = new THREE.Group();
      const wm = mat(0xffffff);
      const l = mesh(box(1.2, 0.06, 0.35, 0.03), wm, -0.55, 0, 0), r = mesh(box(1.2, 0.06, 0.35, 0.03), wm, 0.55, 0, 0);
      gg.add(l); gg.add(r); gg.add(mesh(sphere(0.18), wm, 0, 0, 0.1));
      gg.userData = { l, r, ang: Math.random() * 6.28, rad: 60 + Math.random() * 70, h: 26 + Math.random() * 14, sp: 0.08 + Math.random() * 0.05, cx: (Math.random() - 0.5) * 60, cz: 40 + Math.random() * 40 };
      scene.add(gg); dyn.gulls.push(gg);
    }
  }

  // ---------------------------------------------------------
  // 지형
  // ---------------------------------------------------------
  function makeTerrain() {
    const { minX, maxX, minZ, maxZ } = MAP.SIZE;
    const w = maxX - minX, d = maxZ - minZ;
    const sx = 224, sz = 196;
    const g = new THREE.PlaneGeometry(w, d, sx, sz);
    g.rotateX(-Math.PI / 2);
    g.translate(minX + w / 2, 0, minZ + d / 2);
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const surf = new Float32Array(pos.count * 2);
    const c = new THREE.Color();
    const G1 = new THREE.Color(0x76c653), G2 = new THREE.Color(0x66b84a), HG = new THREE.Color(0x88cc62), SAND = new THREE.Color(0xecd8a6), ROCK = new THREE.Color(0xd2a47a), ROCK2 = new THREE.Color(0xc0906a), UNDER = new THREE.Color(0x7fd6d8), LAWN = new THREE.Color(0x9ee07a);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const y = T.height(x, z);
      pos.setY(i, y);
      const e = 0.7;
      const slope = Math.max(Math.abs(T.height(x + e, z) - T.height(x - e, z)), Math.abs(T.height(x, z + e) - T.height(x, z - e))) / (2 * e);
      const n = (Math.sin(x * 0.31) * Math.cos(z * 0.27) + 1) * 0.5;
      if (y < 0.25) c.copy(UNDER).lerp(SAND, Math.max(0, (y + 1.5) / 1.8));
      else if (slope > 0.85) c.copy(ROCK).lerp(ROCK2, n);
      else {
        const s = T.surface(x, z);
        if (s === 'sand') c.copy(SAND);
        else if (s === 'highgrass') c.copy(HG).lerp(G1, n * 0.5);
        else c.copy(G1).lerp(G2, n);
        if (x < -86 && z < -58) c.lerp(LAWN, 0.5);
      }
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      // 무늬 가중치: x=모래, y=절벽
      const sw = y < 0.25 || T.surface(x, z) === 'sand' ? 1 : 0;
      const rw = slope > 0.85 ? 1 : slope > 0.55 ? (slope - 0.55) / 0.3 : 0;
      surf[i * 2] = sw; surf[i * 2 + 1] = rw;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('surf', new THREE.BufferAttribute(surf, 2));
    g.computeVertexNormals();
    const m = H.soften(new THREE.MeshLambertMaterial({ vertexColors: true }), 0.25);
    // 동물의 숲 풍 땅 무늬: 잔디 / 모래 / 지층 절벽을 섞어서 칠함
    const prev = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      prev(sh, r);
      sh.uniforms.tG = { value: FM.AC.grass() }; sh.uniforms.tS = { value: FM.AC.sand() }; sh.uniforms.tR = { value: FM.AC.cliff() };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 surf; varying vec2 vSurf; varying vec3 vWP;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSurf = surf; vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tG; uniform sampler2D tS; uniform sampler2D tR; varying vec2 vSurf; varying vec3 vWP;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          vec3 gcol = texture2D(tG, vWP.xz / 5.0).rgb;
          vec3 scol = texture2D(tS, vWP.xz / 4.0).rgb;
          vec3 rcol = texture2D(tR, vec2((vWP.x + vWP.z) / 9.0, vWP.y / 5.0)).rgb;
          diffuseColor.rgb *= mix(mix(gcol, scol, vSurf.x), rcol, vSurf.y) * 1.02;`);
    };
    m.customProgramCacheKey = () => 'acTerrain';
    const t = new THREE.Mesh(g, m);
    t.receiveShadow = true;
    t.name = 'terrain';
    scene.add(t);
    W.terrain = t;
  }

  // 바다 & 물
  function makeWater() {
    seaTex = ISLE.TEX.sea().clone(); seaTex.needsUpdate = true; seaTex.wrapS = seaTex.wrapT = THREE.RepeatWrapping; seaTex.repeat.set(60, 60);
    // 수심 지도 (섬 지형 높이를 텍스처로 구워서 → 얕은 곳은 투명한 옥색, 깊은 곳은 짙은 파랑, 해안선엔 밀려오는 파도 거품)
    const DB = [-170, -160, 340, 300], DN = 256, dd = new Uint8Array(DN * DN * 4);
    for (let j = 0; j < DN; j++) for (let i = 0; i < DN; i++) { const x = DB[0] + (i + 0.5) / DN * DB[2], z = DB[1] + (j + 0.5) / DN * DB[3]; const h = T.height(x, z); const k = (j * DN + i) * 4; dd[k] = Math.max(0, Math.min(255, Math.round((h + 4) / 8 * 255))); dd[k + 3] = 255; }
    const depthTex = new THREE.DataTexture(dd, DN, DN, THREE.RGBAFormat); depthTex.magFilter = depthTex.minFilter = THREE.LinearFilter; depthTex.needsUpdate = true;
    const seaM = new THREE.MeshPhongMaterial({ map: seaTex, color: 0xffffff, transparent: true, opacity: 0.94, shininess: 110, specular: 0x9fd8ee });
    seaM.onBeforeCompile = sh => {
      sh.uniforms.uDepth = { value: depthTex }; sh.uniforms.uSeaT = W.seaU; sh.uniforms.uDB = { value: new THREE.Vector4(...DB) };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSeaW;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvSeaW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vSeaW; uniform sampler2D uDepth; uniform float uSeaT; uniform vec4 uDB;')
        .replace('#include <map_fragment>', `#include <map_fragment>
          vec2 duv = (vSeaW.xz - uDB.xy) / uDB.zw;
          float hh = (duv.x < 0.0 || duv.x > 1.0 || duv.y < 0.0 || duv.y > 1.0) ? -4.0 : texture2D(uDepth, duv).r * 8.0 - 4.0;
          float dep = clamp(vSeaW.y - hh, 0.0, 4.5);
          float sh = 1.0 - smoothstep(0.0, 3.4, dep);
          float lum = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
          vec3 deepC = vec3(0.07, 0.36, 0.66), midC = vec3(0.13, 0.62, 0.80), shalC = vec3(0.42, 0.90, 0.88);
          vec3 wc = mix(deepC, midC, smoothstep(0.0, 0.55, sh));
          wc = mix(wc, shalC, smoothstep(0.5, 0.95, sh));
          wc *= 0.82 + lum * 0.32;
          // 해안으로 밀려오는 파도 띠 (수심이 얕아질수록 진하고 촘촘)
          float ph = dep * 4.2 + uSeaT * 1.25 + sin(vSeaW.x * 0.11 + vSeaW.z * 0.05) * 0.9;
          float band = smoothstep(0.74, 0.97, 0.5 + 0.5 * sin(ph));
          float brk = smoothstep(0.35, 0.75, lum + 0.25 * sin(vSeaW.x * 0.9 + uSeaT * 0.7) * cos(vSeaW.z * 0.7));
          float foam = band * (1.0 - smoothstep(0.3, 2.6, dep)) * (0.35 + 0.65 * brk);
          float edge = 1.0 - smoothstep(0.0, 0.32 + 0.12 * sin(uSeaT * 0.8 + vSeaW.x * 0.2), dep);
          foam = max(foam, edge * (0.6 + 0.4 * brk));
          // 먼바다 흰 물마루 반짝임
          foam += smoothstep(0.93, 1.0, lum) * smoothstep(1.5, 4.0, dep) * 0.35;
          diffuseColor.rgb = mix(wc, vec3(1.0), clamp(foam, 0.0, 1.0) * 0.92);
          diffuseColor.a *= mix(mix(0.97, 0.6, smoothstep(0.55, 1.0, sh)), 1.0, clamp(foam, 0.0, 1.0));`);
    };
    seaM.customProgramCacheKey = () => 'acSea2';
    sea = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1800), seaM);
    sea.rotation.x = -Math.PI / 2; sea.position.y = 0.05; sea.receiveShadow = true;
    scene.add(sea);
    dyn.waters.push(seaTex);
    const rt = ISLE.TEX.river().clone(); rt.needsUpdate = true; rt.wrapS = rt.wrapT = THREE.RepeatWrapping;
    const wm = new THREE.MeshPhongMaterial({ map: rt, color: 0xbff0ff, transparent: true, opacity: 0.88, shininess: 100 });
    dyn.waters.push(rt);
    for (const w of T.WATERS) {
      let m;
      if (w.type === 'circle') m = new THREE.Mesh(new THREE.CircleGeometry(w.r + 0.3, 32), wm);
      else m = new THREE.Mesh(new THREE.PlaneGeometry(w.x1 - w.x0 + 0.4, w.z1 - w.z0 + 0.4), wm);
      m.rotation.x = -Math.PI / 2;
      m.position.set(w.type === 'circle' ? w.x : (w.x0 + w.x1) / 2, w.level, w.type === 'circle' ? w.z : (w.z0 + w.z1) / 2);
      scene.add(m);
    }
    // 망각의 수련 폭포 — 흰 물보라와 무지개
    const wft = ISLE.TEX.waterfall().clone(); wft.needsUpdate = true; wft.wrapS = wft.wrapT = THREE.RepeatWrapping; wft.repeat.set(2, 5);
    dyn.waters.push(wft); dyn.waterfallTex = wft;
    const wf = new THREE.Mesh(new THREE.PlaneGeometry(6, 27), new THREE.MeshLambertMaterial({ map: wft, transparent: true, opacity: 0.92, emissive: 0x335566 }));
    wf.position.set(-40, 17.2, -56.9); scene.add(wf);
    const lip = mesh(box(7, 0.6, 2, 0.2), mat(0x9a8d7c), -40, 30.1, -57.8); scene.add(lip);
    const mist = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }));
    mist.scale.set(1.4, 0.6, 1); mist.position.set(-40, 4.6, -55); scene.add(mist); dyn.mist = mist;
    const rb = new THREE.Mesh(new THREE.TorusGeometry(8, 0.5, 8, 40, Math.PI), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false, vertexColors: false }));
    const rbTex = PM.ctex('rainbow', 8, 64, (g, w, h) => { const cs = ['#ff4d4d', '#ffa64d', '#ffe14d', '#6fdc6f', '#4db8ff', '#9a6bff']; cs.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * h / 6, w, h / 6); }); });
    rb.material.map = rbTex; rb.position.set(-40, 6, -51); scene.add(rb); dyn.rainbow = rb;
  }

  // 구름다리 & 계단
  function makeBridgeStairs() {
    const g = new THREE.Group();
    const B = T.BRIDGE;
    const n = 26;
    for (let i = 0; i <= n; i++) {
      const z = B.z0 + (B.z1 - B.z0) * i / n;
      const y = T.bridgeY(z);
      const p = mesh(box(3.2, 0.12, 0.5, 0.03), mat(i % 3 ? 0xa87848 : 0x8a5a3b), 0, y + 0.1, z);
      p.rotation.z = (Math.random() - 0.5) * 0.06;
      p.userData.plank = i; g.add(p);
    }
    for (const x of [-1.7, 1.7]) {
      const pts = []; for (let i = 0; i <= 20; i++) { const z = B.z0 + (B.z1 - B.z0) * i / 20; pts.push(new THREE.Vector3(x, T.bridgeY(z) + 1.1, z)); }
      g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.06, 6), mat(0xd9c49a)));
      for (let i = 0; i <= 10; i++) { const z = B.z0 + (B.z1 - B.z0) * i / 10; g.add(mesh(cyl(0.02, 0.02, 1), mat(0xd9c49a), x, T.bridgeY(z) + 0.6, z)); }
      for (const z of [B.z0, B.z1]) g.add(mesh(cyl(0.18, 0.22, 3.4), mat(0x6a4028), x, T.bridgeY(z) + 1.2, z));
    }
    const s = PM.sign('🌌 아찔한 은하수 구름다리', 5, 0.9, '#3a2a60', '#ffe7a0'); s.position.set(0, T.bridgeY(B.z0) + 3.2, B.z0 + 0.5); g.add(s);
    scene.add(g);
    dyn.bridge = g;
    // 계단 (노을 언덕 & 대성당 연결 진입로)
    const st = new THREE.Group();
    for (let i = 0; i < 32; i++) {
      const z = -24 - i * 0.5, y = T.height(0, z - 0.25);
      st.add(mesh(box(6.4, 0.6, 0.6, 0.05), mat(i % 2 ? 0xe8e0d0 : 0xdcd2c0), 0, y - 0.25, z - 0.25));
    }
    for (const x of [-3.4, 3.4]) st.add(mesh(box(0.4, 1.2, 16.6, 0.1), mat(0xcfc4ae), x, 17, -32.3).rotateX(Math.atan2(22, 16)));
    scene.add(PM.bake(st));
    // 협곡 → 절벽 아래 잔디밭 표지
    const s2 = PM.sign('⬇ 망각의 수련 폭포 · 절벽 아래 잔디밭', 5, 0.8, '#ffffff', '#3b2b20'); s2.position.set(-100, T.height(-100, -40) + 2.5, -40); scene.add(s2);
  }

  // 도로 (도로 그래프 간선 → 리본 메시)
  function makeRoads() {
    const g = new THREE.Group();
    // 흙길: 가장자리에 풀이 삐죽 (투명) · 대로: 아스팔트 무늬
    const dirtM = new THREE.MeshLambertMaterial({ map: FM.AC.dirt(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const asphalt = H.soften(new THREE.MeshLambertMaterial({ map: FM.AC.asphalt(), color: 0x7a7e8a }), 0.1);
    const MAIN = new Set(['c_s|s_n', 's_n|s_mid', 's_mid|s_deck']);
    const acc = { dirt: { pos: [], uv: [], idx: [] }, main: { pos: [], uv: [], idx: [] } };
    const joinPts = new Map();
    const push = (A, pos, uv, idx) => { const base = A.pos.length / 3; A.pos.push(...pos); A.uv.push(...uv); A.idx.push(...idx.map(i => i + base)); };
    for (const [a, b] of MAP.E) {
      const A = MAP.N[a], Bn = MAP.N[b];
      if ((a.startsWith('c_n') && b === 'c_nt') || (a === 'c_nt' && b === 'n_b')) continue; // 계단 / 다리
      const main = MAIN.has(a + '|' + b) || MAIN.has(b + '|' + a);
      const width = main ? 8 : 2.6;
      const len = Math.hypot(Bn[0] - A[0], Bn[1] - A[1]);
      const seg = Math.max(2, Math.ceil(len / 1.5));
      const dx = (Bn[0] - A[0]) / len, dz = (Bn[1] - A[1]) / len;
      const nx = -dz * width / 2, nz = dx * width / 2;
      const pos = [], idx = [], uv = [];
      for (let i = 0; i <= seg; i++) {
        const t = i / seg, x = A[0] + (Bn[0] - A[0]) * t, z = A[1] + (Bn[1] - A[1]) * t;
        for (const s of [-1, 1]) {
          const px = x + nx * s, pz = z + nz * s;
          if (T.inWater(px, pz) && !T.onBridge(px, pz)) { pos.push(px, T.groundY(px, pz) + 0.35, pz); }
          else pos.push(px, Math.max(T.height(px, pz), 0.2) + (main ? 0.07 : 0.06), pz);
          uv.push(s < 0 ? 0 : 1, t * len / 3);
        }
        if (i < seg) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      }
      push(main ? acc.main : acc.dirt, pos, uv, idx);
      if (!main) { joinPts.set(a, A); joinPts.set(b, Bn); }
      if (main) {
        // 왕복 4차선 차선 표시
        for (let i = 0; i < seg; i += 2) { const t = (i + 0.5) / seg; const x = A[0] + (Bn[0] - A[0]) * t, z = A[1] + (Bn[1] - A[1]) * t; for (const o of [-2, 0, 2]) { const ux = nx / (width / 2), uz = nz / (width / 2); const l = mesh(box(o === 0 ? 0.25 : 0.15, 0.02, 1.2, 0.01), mat(o === 0 ? 0xffd84a : 0xffffff), x + ux * o, T.height(x + ux * o, z + uz * o) + 0.1, z + uz * o); l.rotation.y = Math.atan2(dx, dz); l.castShadow = false; g.add(l); } }
      }
    }
    // 갈림길은 둥글게
    for (const [, P] of joinPts) {
      if (T.inWater(P[0], P[1])) continue;
      const r = 1.45, n = 16, pos = [P[0], Math.max(T.height(P[0], P[1]), 0.2) + 0.065, P[1]], uv = [0.5, P[1] / 3], idx = [];
      for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, x = P[0] + Math.cos(a) * r, z = P[1] + Math.sin(a) * r; pos.push(x, Math.max(T.height(x, z), 0.2) + 0.065, z); uv.push(0.5 + Math.cos(a) * 0.36, z / 3); if (i < n) idx.push(0, i + 2, i + 1); }
      push(acc.dirt, pos, uv, idx);
    }
    for (const [k, A] of Object.entries(acc)) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(A.pos, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(A.uv, 2));
      geo.setIndex(A.idx); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, k === 'main' ? asphalt : dirtM); m.receiveShadow = true; m.renderOrder = 1;
      if (k === 'dirt') m.userData.noBake = true;
      g.add(m);
    }
    // 광장 대리석 바닥
    const pl = new THREE.Mesh(new THREE.CircleGeometry(14, 48), H.soften(new THREE.MeshLambertMaterial({ color: 0xe4d6c0, map: PM.ctex('plaza2', 512, 512, (c, w, h) => { c.fillStyle = '#e8dcc6'; c.fillRect(0, 0, w, h); const cx = w / 2; for (let ring = 0; ring < 12; ring++) { const r0 = 18 + ring * 20, n = Math.round(r0 * 0.35) + 6; for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2; const v = 225 + ((i * 7 + ring * 13) % 25); c.fillStyle = ring % 3 === 2 ? `rgb(${v - 30},${v - 60},${v - 70})` : `rgb(${v},${v - 10},${v - 30})`; c.beginPath(); c.arc(cx, cx, r0 + 17, a0 + 0.02, a1 - 0.02); c.arc(cx, cx, r0 + 1, a1 - 0.02, a0 + 0.02, true); c.closePath(); c.fill(); } } }) }), 0.1));
    pl.rotation.x = -Math.PI / 2; pl.position.set(0, 6.08, 10); pl.receiveShadow = true; g.add(pl);
    // 부두 데크
    for (const b of T.FOOTBRIDGES) { const deck = mesh(box(b.x1 - b.x0, 0.3, b.z1 - b.z0, 0.05), mat(0xc99760), (b.x0 + b.x1) / 2, (b.y !== undefined ? b.y : T.groundY((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2)) - 0.15, (b.z0 + b.z1) / 2); g.add(deck); if (b.pier) for (let z = b.z0 + 1; z < b.z1; z += 3) for (const x of [b.x0 + 0.3, b.x1 - 0.3]) g.add(mesh(cyl(0.2, 0.2, 3), mat(0x8a5a3b), x, (b.y || 1) - 1.5, z)); }
    scene.add(PM.bake(g));
  }

  // 건물
  const buildings = {};
  W.buildings = buildings;
  function placeBuilding(p) {
    const d = p.door ? { x: p.door[0] - p.x, z: p.door[1] - p.z } : { x: 0, z: 1 };
    const ang = Math.atan2(d.x, d.z);
    const quarter = Math.abs(Math.round(ang / (Math.PI / 2))) % 2 === 1;
    const pp = quarter ? Object.assign({}, p, { bld: Object.assign({}, p.bld, { w: p.bld.d, d: p.bld.w }) }) : p;
    const st = FM.Sim.get();
    const ext = p.plot || p.id === 'home_p' ? ((st && st.plots.ext && st.plots.ext[p.id]) || (p.id === 'home_p' ? 'chalet' : (p.plot && p.plot.ext) || Object.keys(PM.VILLA_THEMES)[(+p.id.slice(5) || 0) % 8])) : null;
    const g = PM.building(pp, ext);
    const y = Math.min(T.height(p.x - p.bld.w / 2, p.z), T.height(p.x + p.bld.w / 2, p.z), T.height(p.x, p.z - p.bld.d / 2), T.height(p.x, p.z + p.bld.d / 2), T.height(p.x, p.z));
    g.position.set(p.x, y - 0.05, p.z);
    g.rotation.y = p.plot ? 0 : ang;
    const keep = g.userData;
    PM.bake(g);
    g.userData = keep;
    // 기초 (경사면 메움) + 접지 그림자
    const lb = p.plot ? p.bld : pp.bld;
    g.add(mesh(box(lb.w + 0.6, 3, lb.d + 0.6, 0.1), mat(0xd8d0c0), 0, -1.45, 0));
    if (PM.aoShadow) { const ao = PM.aoShadow(lb.w, lb.d); ao.position.y = 0.09; g.add(ao); }
    scene.add(g);
    buildings[p.id] = g;
    return g;
  }
  W.rebuildBuilding = function (id) {
    const old = buildings[id]; if (old) scene.remove(old);
    placeBuilding(MAP.P[id]);
  };

  // ---------------------------------------------------------
  // 동물의 숲 풍 식물: 몽글몽글 나무 · 과일 · 3D 꽃 · 흔들리는 풀 · 둥근 덤불
  // ---------------------------------------------------------
  const AC = FM.AC;
  const windU = { value: 0 };
  // 여러 지오메트리 합치기 (위치/법선/uv/색)
  function mergeGeos(list) {
    const parts = list.map(({ g, m4, color }) => { const x = (g.index ? g.toNonIndexed() : g.clone()); if (m4) x.applyMatrix4(m4); if (!x.attributes.uv) x.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2)); const n = x.attributes.position.count, c = new Float32Array(n * 3); const cc = new THREE.Color(color !== undefined ? color : 0xffffff); for (let i = 0; i < n; i++) { c[i * 3] = cc.r; c[i * 3 + 1] = cc.g; c[i * 3 + 2] = cc.b; } x.setAttribute('color', new THREE.BufferAttribute(c, 3)); return x; });
    let n = 0; for (const x of parts) n += x.attributes.position.count;
    const out = new THREE.BufferGeometry();
    for (const [k, size] of [['position', 3], ['normal', 3], ['uv', 2], ['color', 3]]) { const arr = new Float32Array(n * size); let o = 0; for (const x of parts) { arr.set(x.attributes[k].array, o); o += x.attributes[k].array.length; } out.setAttribute(k, new THREE.BufferAttribute(arr, size)); }
    return out;
  }
  const M4 = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
  // 울퉁불퉁 구 (나뭇잎 덩어리)
  function lumpy(seed, amp = 0.12, ws = 12, hs = 9) {
    const g = new THREE.SphereGeometry(1, ws, hs); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 1 + amp * (Math.sin(x * 5.1 + seed) * Math.cos(y * 4.3 + seed * 2) + Math.sin(z * 4.7 - seed) * 0.6); p.setXYZ(i, x * k, y * k, z * k); }
    g.computeVertexNormals();
    return AC.scaleUV(g, 3, 2);
  }
  // 바람에 흔들리게 (정점 셰이더)
  function sway(m, amount = 0.12, key = 'sway') {
    const prev = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      if (prev) prev(sh, r);
      sh.uniforms.uWind = windU;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          #ifdef USE_INSTANCING
            float ph = instanceMatrix[3].x * 0.35 + instanceMatrix[3].z * 0.27;
          #else
            float ph = 0.0;
          #endif
          float bend = max(position.y, 0.0);
          transformed.x += sin(uWind * 1.7 + ph) * bend * ${amount.toFixed(3)};
          transformed.z += cos(uWind * 1.3 + ph * 1.3) * bend * ${(amount * 0.6).toFixed(3)};`);
    };
    m.customProgramCacheKey = () => key + amount;
    return m;
  }

  function makeTrees() {
    const kinds = { round: [], pine: [], willow: [], palm: [] };
    for (const t of FM.DECOR.trees) if (!inGarden(t.x, t.z)) kinds[t.kind].push(t);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color();
    // 줄기: 뿌리가 살짝 퍼진 나무 기둥 (나무껍질 무늬)
    const trunkG = AC.scaleUV(new THREE.LatheGeometry([[0.0001, 0], [0.5, 0], [0.36, 0.25], [0.27, 0.8], [0.24, 1.8], [0.2, 2.6], [0.0001, 2.6]].map(([x, y]) => new THREE.Vector2(x, y)), 12), 2, 2);
    const palmG = AC.scaleUV(new THREE.LatheGeometry([[0.0001, 0], [0.34, 0], [0.24, 0.3], [0.28, 0.6], [0.22, 0.9], [0.26, 1.2], [0.2, 1.5], [0.24, 1.8], [0.18, 2.2], [0.0001, 2.2]].map(([x, y]) => new THREE.Vector2(x, y)), 10), 2, 5);
    const barkM = AC.tm('bark', 0xa87448);
    for (const [k, list] of Object.entries(kinds)) {
      if (!list.length) continue;
      const tr = new THREE.InstancedMesh(k === 'palm' ? palmG : trunkG, k === 'palm' ? AC.tm('bark', 0xc9a070) : barkM, list.length);
      list.forEach((t, i) => { p.set(t.x, T.height(t.x, t.z) - 0.1, t.z); q.setFromEuler(new THREE.Euler(0, t.x * 3, k === 'palm' ? 0.12 : 0)); sc.set(t.s, t.s * (k === 'palm' ? 2.2 : k === 'pine' ? 1.0 : 1), t.s); m4.compose(p, q, sc); tr.setMatrixAt(i, m4); });
      tr.castShadow = true; tr.receiveShadow = true; scene.add(tr);
    }
    const leafM = c => sway(AC.tm('leaf', 0xffffff).clone(), 0.035, 'leafsway');
    // 잎: 둥근 나무 = 몽글몽글 구름, 삼나무 = 가장자리가 물결치는 층층 원뿔
    const cedarG = (() => { const g = new THREE.ConeGeometry(1.5, 1.7, 12, 2); const p2 = g.attributes.position; for (let i = 0; i < p2.count; i++) { const x = p2.getX(i), y = p2.getY(i), z = p2.getZ(i); if (y < -0.5) { const a = Math.atan2(z, x); const k = 1 + Math.sin(a * 8) * 0.08; p2.setXYZ(i, x * k, y - Math.abs(Math.sin(a * 8)) * 0.12, z * k); } } g.computeVertexNormals(); return AC.scaleUV(g, 4, 1.5); })();
    const leafDefs = {
      round: { geo: lumpy(1.3, 0.1), col: 0x6cc85a, parts: [[0, 3.3, 0, 1.55], [-0.95, 2.8, 0.35, 1.1], [0.95, 2.9, -0.25, 1.15], [0.2, 2.7, 0.95, 1.0], [0.1, 4.2, 0.1, 1.0]] },
      pine: { geo: cedarG, col: 0x3f9a62, parts: [[0, 2.5, 0, 1.15], [0, 3.6, 0, 0.9], [0, 4.6, 0, 0.66], [0, 5.4, 0, 0.42]] },
      willow: { geo: lumpy(2.1, 0.14), col: 0xa6d86a, parts: [[0, 3.3, 0, 1.8], [-1.2, 2.5, 0, 1.2], [1.2, 2.5, 0, 1.2], [0, 2.4, 1.1, 1.1], [0, 2.6, -1.1, 1.0]] },
      palm: { geo: (() => { const g = new THREE.SphereGeometry(1, 8, 4); g.scale(1.9, 0.18, 0.55); g.translate(1.2, 0, 0); return AC.scaleUV(g, 3, 1); })(), col: 0x56b44a, parts: [0, 1, 2, 3, 4, 5].map(i => [0, 4.75, 0, 1, i * Math.PI / 3]) },
    };
    const fruits = [];
    for (const [k, list] of Object.entries(kinds)) {
      if (!list.length) continue;
      const def = leafDefs[k];
      const inst = new THREE.InstancedMesh(def.geo, leafM(def.col), list.length * def.parts.length);
      let i = 0;
      for (const t of list) {
        const y0 = T.height(t.x, t.z);
        const hueShift = Math.sin(t.x * 1.7 + t.z * 0.9) * 0.025;
        for (const [px, py, pz, r, ry] of def.parts) {
          p.set(t.x + (k === 'palm' ? 0 : px * t.s), y0 + py * t.s, t.z + (k === 'palm' ? 0 : pz * t.s));
          q.setFromEuler(new THREE.Euler(0, (ry || 0) + t.x, k === 'palm' ? -0.35 : 0));
          sc.set(r * t.s, r * t.s * (k === 'pine' ? 1 : 0.92), r * t.s);
          m4.compose(p, q, sc); inst.setMatrixAt(i, m4);
          col.set(def.col).offsetHSL(hueShift, 0, Math.sin(t.x * 3 + t.z + py) * 0.04 + (py > 3.5 ? 0.04 : 0)); inst.setColorAt(i, col);
          i++;
        }
        // 과일 (둥근 나무의 1/3)
        if (k === 'round' && (Math.abs(Math.sin(t.x * 12.9 + t.z * 7.1)) < 0.35)) {
          const fc = [0xe8433b, 0xff9a24, 0xffb3a0, 0xd8e05a][Math.abs(Math.round(t.x + t.z)) % 4];
          for (const [fx, fy, fz] of [[0.6, 2.6, 1.2], [-0.8, 2.4, 0.9], [0.1, 3.2, 1.45]]) fruits.push([t.x + fx * t.s, y0 + fy * t.s, t.z + fz * t.s, fc]);
        }
        if (k === 'palm') for (const [fx, fz] of [[0.25, 0.1], [-0.15, 0.25], [0, -0.25]]) fruits.push([t.x + fx * t.s, y0 + 4.5 * t.s, t.z + fz * t.s, 0x7a5a2a]);
      }
      inst.castShadow = true; inst.receiveShadow = true;
      scene.add(inst);
    }
    if (fruits.length) {
      const fi = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 7, 5), H.mat(0xffffff), fruits.length);
      fruits.forEach(([x, y, z, c], i) => { m4.makeTranslation(x, y, z); fi.setMatrixAt(i, m4); fi.setColorAt(i, col.set(c)); });
      fi.castShadow = false; scene.add(fi);
    }
  }

  // 3D 꽃: 튤립 · 코스모스 · 팬지 · 국화 (꽃잎은 인스턴스 색, 줄기는 공통)
  function flowerGeos() {
    const petal = new THREE.SphereGeometry(1, 6, 4);
    const ring = (n, r, sx, sz, tilt) => mergeGeos(Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return { g: petal, m4: M4(Math.cos(a) * r, 0, Math.sin(a) * r, 0, -a, tilt, sx, 0.022, sz) }; }));
    const tulip = mergeGeos([0, 1, 2].map(i => ({ g: petal, m4: M4(Math.cos(i * 2.1) * 0.035, 0.09, Math.sin(i * 2.1) * 0.035, 0, -i * 2.1, 0.12, 0.075, 0.13, 0.06) })).concat([0, 1, 2].map(i => ({ g: petal, m4: M4(Math.cos(i * 2.1 + 1) * 0.04, 0.08, Math.sin(i * 2.1 + 1) * 0.04, 0, -i * 2.1 - 1, 0.12, 0.07, 0.12, 0.055) }))));
    const mum = (() => { const g = new THREE.IcosahedronGeometry(0.13, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 1 + 0.12 * Math.sin(x * 60) * Math.sin(y * 60) * Math.sin(z * 60); p.setXYZ(i, x * k, y * k * 0.85, z * k); } g.computeVertexNormals(); return g; })();
    const stem = mergeGeos([
      { g: new THREE.CylinderGeometry(0.012, 0.016, 0.34, 5), m4: M4(0, 0.17, 0), color: 0x4f9e3e },
      { g: petal, m4: M4(0.06, 0.08, 0, 0, 0, 0.5, 0.09, 0.012, 0.035), color: 0x5fb04a },
      { g: petal, m4: M4(-0.05, 0.12, 0.02, 0, 0.3, -0.5, 0.08, 0.012, 0.03), color: 0x5fb04a },
    ]);
    return { tulip, cosmos: ring(8, 0.085, 0.085, 0.035, 0.25), pansy: ring(5, 0.055, 0.07, 0.06, 0.15), mum, stem };
  }
  function makeFlowers() {
    const FL = FM.Flora;
    const cols = [0xff7aa8, 0xffc933, 0xff4d5e, 0xff9a3d, 0xffffff, 0xb69cff, 0xff8fd0, 0x7ab8ff, 0xfff0a0, 0xff6f86];
    const types = FL ? ['tulip', 'daisy', 'cosmos', 'rose', 'marigold', 'pansy'] : ['tulip', 'cosmos', 'pansy', 'mum'];
    const pts = [], mounds = [], edges = [];
    const PALS = [[0xff6f9a, 0xffb3cc, 0xffffff], [0xffc933, 0xff9a3d, 0xfff0a0], [0xb69cff, 0x7ab8ff, 0xffffff], [0xff4d5e, 0xff8fb1, 0xfff3f3], [0xff9a3d, 0xffd84a, 0xff6f86], [0xffffff, 0xfff0a0, 0xc8e6ff]];
    // 동네 꽃밭: 잎 덤불 위로 꽃이 소복이 (한 꽃밭에 두 종류 섞어서)
    for (const f of FM.DECOR.flowers) {
      if (inGarden(f.x, f.z)) continue;
      // 한 꽃밭 = 어울리는 2~3색 팔레트 (무지개 뒤범벅 X) · 촘촘하게
      const n = Math.round(f.r * f.r * 26), t1 = types[Math.floor(f.col * 97) % types.length], t2 = types[Math.floor(f.col * 53 + 2) % types.length], pal = PALS[Math.floor(f.col * 131) % PALS.length];
      for (let i = 0; i < n; i++) { const a = i * 2.39996 + f.col * 9, r = Math.sqrt((i + 0.5) / n) * f.r * 0.92; const x = f.x + Math.cos(a) * r, z = f.z + Math.sin(a) * r; pts.push([x, z, pal[(i * 7 + (i >> 2)) % pal.length], i % 3 ? t1 : t2]); }
      for (let i = 0; i < 7; i++) { const a = i * 0.9 + f.col * 5, r = (i ? 0.58 : 0) * f.r; mounds.push([f.x + Math.cos(a) * r, f.z + Math.sin(a) * r, f.r * (i ? 0.46 : 0.7)]); }
      // 둥근 자갈 테두리
      const ne = Math.round(f.r * 15); for (let i = 0; i < ne; i++) { const a = i / ne * Math.PI * 2 + f.col; edges.push([f.x + Math.cos(a) * (f.r + 0.12), f.z + Math.sin(a) * (f.r + 0.1), 0.085 + ((i * 37) % 5) * 0.01]); }
    }
    // 건물 앞 꽃밭 (문 양옆)
    for (const pl of Object.values(MAP.P)) {
      if (!pl.bld || !pl.door) continue;
      const dx = pl.door[0] - pl.x, dz = pl.door[1] - pl.z, l = Math.hypot(dx, dz) || 1, fx = dx / l, fz = dz / l, rx = -fz, rz = fx;
      const half = (Math.abs(fx) > Math.abs(fz) ? pl.bld.d : pl.bld.w) / 2;
      for (const sgn of [-1, 1]) for (let i = 0; i < 12; i++) {
        const along = sgn * (1.6 + (i % 4) * 0.38 + Math.min(half - 2.6, 2.2) * 0.4), out = 0.85 + Math.floor(i / 4) * 0.3;
        const x = pl.door[0] + rx * along + fx * (out - 0.5), z = pl.door[1] + rz * along + fz * (out - 0.5);
        if (T.blockedByBuilding(x, z, 0.1) || T.inWater(x, z) || inGarden(x, z)) continue;
        pts.push([x, z, cols[(i + (pl.x | 0)) % 10], types[((pl.z | 0) + sgn + 12) % types.length]]);
        if (i % 4 === 1) mounds.push([x, z, 0.32]);
      }
    }
    const m4 = new THREE.Matrix4(), c = new THREE.Color(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(1, 1, 1), p3 = new THREE.Vector3();
    // 잎 덤불
    if (mounds.length) {
      const mi = new THREE.InstancedMesh(lumpy(3.1, 0.16, 10, 7), sway(AC.tm('leaf', 0xffffff).clone(), 0.04, 'fmound'), mounds.length);
      mounds.forEach(([x, z, r], i) => { p3.set(x, T.height(x, z) + r * 0.12, z); q.setFromEuler(new THREE.Euler(0, x * 3, 0)); s3.set(r, r * 0.55, r); m4.compose(p3, q, s3); mi.setMatrixAt(i, m4); mi.setColorAt(i, c.set(0x5aa848).offsetHSL(Math.sin(x) * 0.02, 0, Math.sin(z * 2) * 0.04)); });
      mi.castShadow = true; mi.receiveShadow = true; scene.add(mi);
    }
    if (edges.length) {
      const ei = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 7, 5), AC.tm('stone', 0xffffff), edges.length);
      edges.forEach(([x, z, r], i) => { p3.set(x, T.height(x, z) + r * 0.25, z); q.setFromEuler(new THREE.Euler(0, x * 5, 0)); s3.set(r * 1.3, r * 0.75, r); m4.compose(p3, q, s3); ei.setMatrixAt(i, m4); ei.setColorAt(i, c.set(0xe8e0d0).offsetHSL(0, 0, Math.sin(x * 9 + z) * 0.06)); });
      ei.castShadow = true; ei.receiveShadow = true; scene.add(ei);
    }
    // 꽃잎 그라데이션 (가운데 밝게 · 끝은 살짝 진하게 → 입체감)
    const petalTex = PM.ctex('petalGrad', 64, 64, (cx, w, h) => { const gr = cx.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#f4f0f2'); gr.addColorStop(0.85, '#d6cfd4'); gr.addColorStop(1, '#b8aeb6'); cx.fillStyle = gr; cx.fillRect(0, 0, w, h); cx.strokeStyle = 'rgba(255,255,255,0.5)'; cx.lineWidth = 1.2; for (let i = 0; i < 7; i++) { const a = -0.6 + i * 0.2; cx.beginPath(); cx.moveTo(32, 32); cx.lineTo(32 + Math.cos(a) * 28, 32 + Math.sin(a) * 28); cx.stroke(); } });
    const stemG = FL ? FL.stemGeo(0.36) : flowerGeos().stem;
    const stemM = sway(FL ? H.mat(0x4f9e3e).clone() : new THREE.MeshLambertMaterial({ vertexColors: true }), 0.1, 'fstem');
    const stems = new THREE.InstancedMesh(stemG, stemM, pts.length);
    const byType = {}; for (const pt of pts) (byType[pt[3]] = byType[pt[3]] || []).push(pt);
    const kOf = (x, z) => 0.9 + Math.abs(Math.sin(x * 5 + z)) * 0.35;
    pts.forEach(([x, z], i) => { p3.set(x, T.height(x, z), z); q.setFromEuler(new THREE.Euler(0, x * 7, 0)); s3.setScalar(kOf(x, z)); m4.compose(p3, q, s3); stems.setMatrixAt(i, m4); });
    stems.receiveShadow = true; scene.add(stems);
    const G2 = FL ? null : flowerGeos();
    for (const [ty, list] of Object.entries(byType)) {
      const headM = sway(H.mat(0xffffff).clone(), 0.1, 'fhead'); headM.side = THREE.DoubleSide; if (FL) { headM.map = petalTex; headM.needsUpdate = true; }
      const inst = new THREE.InstancedMesh(FL ? FL.geo(ty) : G2[ty], headM, list.length);
      const cen = FL && FL.CENTER[ty] ? new THREE.InstancedMesh(FL.centerGeo(ty), sway(H.mat(0xffffff).clone(), 0.1, 'fhead'), list.length) : null;
      list.forEach(([x, z, col], i) => {
        const k = kOf(x, z), y = T.height(x, z) + 0.36 * k;
        p3.set(x, y, z); q.setFromEuler(new THREE.Euler(ty === 'tulip' ? 0 : -0.3 - Math.abs(Math.sin(x * 3)) * 0.25, x * 7, 0, 'YXZ')); s3.setScalar(k * 1.6); m4.compose(p3, q, s3); inst.setMatrixAt(i, m4); inst.setColorAt(i, c.set(col));
        if (cen) { cen.setMatrixAt(i, m4); cen.setColorAt(i, c.set(ty === 'daffodil' ? 0xffa020 : FL.CENTER[ty][1])); }
      });
      inst.castShadow = true; scene.add(inst); if (cen) scene.add(cen);
    }
  }

  // 3D 풀 (바람에 살랑살랑)
  function roadSegs() {
    const segs = [];
    const MAIN = new Set(['c_s|s_n', 's_n|s_mid', 's_mid|s_deck']);
    for (const [a, b] of MAP.E) { const A = MAP.N[a], B2 = MAP.N[b]; segs.push([A[0], A[1], B2[0], B2[1], MAIN.has(a + '|' + b) || MAIN.has(b + '|' + a) ? 4.6 : 1.9]); }
    return segs;
  }
  function nearRoad(segs, x, z) {
    for (const [ax, az, bx, bz, w] of segs) {
      const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
      const px = ax + dx * t - x, pz = az + dz * t - z;
      if (px * px + pz * pz < w * w) return true;
    }
    return false;
  }
  function makeGrass() {
    const blades = [];
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2 + Math.random() * 0.5, r = 0.04 + Math.random() * 0.06, h = 0.13 + Math.random() * 0.13, lean = 0.06 + Math.random() * 0.1;
      const bx = Math.cos(a) * r, bz = Math.sin(a) * r, tx = bx + Math.cos(a) * lean, tz = bz + Math.sin(a) * lean, px = -Math.sin(a) * 0.045, pz = Math.cos(a) * 0.045;
      blades.push([bx - px, 0, bz - pz, 0], [bx + px, 0, bz + pz, 0], [tx, h, tz, 1]);
    }
    const pos = new Float32Array(blades.length * 3), colA = new Float32Array(blades.length * 3), nor = new Float32Array(blades.length * 3);
    const base = new THREE.Color(0x5aa844), tip = new THREE.Color(0xa8e27a), cc = new THREE.Color();
    blades.forEach(([x, y, z, t], i) => { pos.set([x, y, z], i * 3); cc.copy(base).lerp(tip, t); colA.set([cc.r, cc.g, cc.b], i * 3); nor.set([0, 1, 0], i * 3); });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(colA, 3));
    const segs = roadSegs();
    const pts = [];
    const { minX, maxX, minZ, maxZ } = MAP.SIZE;
    for (let x = minX; x < maxX; x += 1.25) for (let z = minZ; z < maxZ; z += 1.25) {
      const px = x + (Math.random() - 0.5) * 1.1, pz = z + (Math.random() - 0.5) * 1.1;
      // 여기저기 작은 풀숲으로만 (균일하게 깔지 않음)
      const clump = Math.sin(px * 0.21 + 1.3) * Math.cos(pz * 0.19) + Math.sin(px * 0.07 - pz * 0.09) * 0.8;
      if (Math.random() > (clump > 0.9 ? 0.55 : 0.03)) continue;
      const y = T.height(px, pz);
      if (y < 0.5 || T.inWater(px, pz) || T.surface(px, pz) === 'sand') continue;
      const e = 0.6, slope = Math.max(Math.abs(T.height(px + e, pz) - T.height(px - e, pz)), Math.abs(T.height(px, pz + e) - T.height(px, pz - e))) / (2 * e);
      if (slope > 0.5) continue;
      if (Math.hypot(px, pz - 10) < 15 || T.blockedByBuilding(px, pz, 0.8) || nearRoad(segs, px, pz) || inGarden(px, pz)) continue;
      pts.push([px, y, pz]);
      if (pts.length > 4200) break;
    }
    const m = sway(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), 0.28, 'grass');
    const inst = new THREE.InstancedMesh(g, m, pts.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3(), c = new THREE.Color();
    pts.forEach(([x, y, z], i) => { const k = 0.7 + Math.random() * 0.45; p3.set(x, y - 0.02, z); q.setFromEuler(new THREE.Euler(0, Math.random() * 6.28, 0)); s3.set(k, k * (0.8 + Math.random() * 0.5), k); m4.compose(p3, q, s3); inst.setMatrixAt(i, m4); inst.setColorAt(i, c.setHSL(0.27 + Math.random() * 0.04, 0.45, 0.72 + Math.random() * 0.1)); });
    inst.receiveShadow = true;
    scene.add(inst);
    W.grassCount = pts.length;
  }
  // 둥근 덤불 (광장 둘레, 건물 모퉁이) + 작은 꽃
  function makeBushes() {
    const spots = [];
    const segs = roadSegs();
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 14) { const x = Math.cos(a) * 16.2, z = 10 + Math.sin(a) * 16.2; if (!nearRoad(segs, x, z)) spots.push([x, z, 1]); }
    for (const pl of Object.values(MAP.P)) {
      if (!pl.bld || pl.bld.h > 20) continue;
      for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const x = pl.x + sx * (pl.bld.w / 2 + 0.9), z = pl.z + sz * (pl.bld.d / 2 + 0.9); if (!nearRoad(segs, x, z) && !T.blockedByBuilding(x, z, 0.2) && !T.inWater(x, z)) spots.push([x, z, 0.8 + Math.abs(Math.sin(x)) * 0.4]); }
    }
    const g = lumpy(3.3, 0.14, 10, 7);
    const bm = sway(AC.tm('leaf', 0xffffff).clone(), 0.03, 'bush');
    const inst = new THREE.InstancedMesh(g, bm, spots.length);
    const dots = [];
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3(), c = new THREE.Color();
    spots.forEach(([x, z, k], i) => {
      const y = T.height(x, z);
      p3.set(x, y + 0.55 * k, z); s3.set(0.9 * k, 0.7 * k, 0.9 * k); q.setFromEuler(new THREE.Euler(0, x, 0)); m4.compose(p3, q, s3); inst.setMatrixAt(i, m4); inst.setColorAt(i, c.set(0x5fb850).offsetHSL(Math.sin(x) * 0.02, 0, 0));
      const fc = [0xffffff, 0xff8fb1, 0xffd84a, 0xff6f61][i % 4];
      for (let j = 0; j < 7; j++) { const a = j * 0.9 + x, e = 0.3 + (j % 3) * 0.25; dots.push([x + Math.cos(a) * Math.cos(e) * 0.9 * k, y + 0.55 * k + Math.sin(e) * 0.7 * k, z + Math.sin(a) * Math.cos(e) * 0.9 * k, fc]); }
    });
    inst.castShadow = true; inst.receiveShadow = true; scene.add(inst);
    const di = new THREE.InstancedMesh(new THREE.SphereGeometry(0.08, 5, 4), H.mat(0xffffff), dots.length);
    dots.forEach(([x, y, z, col], i) => { m4.makeTranslation(x, y, z); di.setMatrixAt(i, m4); di.setColorAt(i, c.set(col)); });
    scene.add(di);
  }

  // 장식 배치
  function place(obj, x, z, ry = 0, y) {
    obj.position.set(x, y !== undefined ? y : T.groundY(x, z), z);
    obj.rotation.y = ry;
    scene.add(obj);
    return obj;
  }
  function makeDecor() {
    const P = MAP.P;
    const f = PM.decor('fountain'); place(f, 0, 10); f.traverse(o => { if (o.userData.water) dyn.waters.push(null); });
    dyn.fountain = f;
    // 가로등 (도로 교차점)
    for (const n of Object.values(MAP.N)) {
      if (Math.random() < 0.55 || T.onBridge(n[0], n[1]) || T.onStairs(n[0], n[1]) || inGarden(n[0] + 2, n[1] + 1.5)) continue;
      const l = PM.decor('lamp'); place(l, n[0] + 2, n[1] + 1.5); l.traverse(o => { if (o.userData.lampBulb) dyn.bulbs.push(o); });
    }
    // 벤치 / 테이블 / 선베드 / 해먹 ... (스폿 기반)
    for (const s of FM.Sim.SPOTS) {
      if (!s.place) continue;
      const face = s.face !== undefined ? s.face : 0;
      if (s.tags.includes('hammock')) { if (!dyn._ham) { dyn._ham = 1; place(PM.decor('hammock'), -103.5, 15); } continue; }
      if (s.tags.includes('swing')) { if (!dyn._sw) { dyn._sw = 1; place(PM.decor('swing'), -71, 12.6); } continue; }
      if (s.tags.includes('sunbed')) { place(PM.decor('sunbed'), s.x, s.z, face); continue; }
      if (s.tags.includes('cafe') && s.seat) { place(PM.decor('chair'), s.x, s.z, face); continue; }
      if (s.tags.includes('pocha') || s.tags.includes('beachbar')) continue;
      if (inGarden(s.x, s.z)) continue;
      if (s.seat && (s.tags.includes('bench') || s.tags.includes('campfire') || s.tags.includes('garden'))) { const b = PM.decor('bench'); place(b, s.x, s.z, face); continue; }
    }
    for (const [x, z] of [[21.2, 13.5], [28.2, 13.5], [21.2, 17.5], [28.2, 17.5]]) place(PM.decor('cafeTable'), x, z);
    place(PM.decor('boat'), -96, 27.5, 0.4, 5.7);
    place(PM.decor('playground'), -74, 47.5);
    for (const [x, z, c] of [[48, -78, 0xff8f6a], [58, -76, 0x4fc1e9], [44, -82, 0x8ee07a]]) place(PM.decor('tent', c), x, z);
    place(PM.decor('campfire'), 53, -79).traverse(o => { if (o.userData.fire) dyn.fires.push(o); });
    place(PM.decor('telescope'), 60, -86, 0.5);
    for (let i = 0; i < 12; i++) { const x = -64 - Math.random() * 18, z = -76 - Math.random() * 30; if (!inGarden(x, z)) place(PM.decor('silverGrass'), x, z); }
    place(PM.decor('pocha'), 40, 81.2, Math.PI);
    for (const x of [-78, -72, -66]) place(PM.decor('stall'), x, 67, Math.PI);
    place(PM.decor('soapbox'), 7, 16);
    place(PM.decor('lighthouse'), 72, 98);
    const fb = PM.decor('ferryBoat'); place(fb, 58, 102, 0, 0.6); dyn.ferry = fb;
    place(PM.decor('mailbox'), -41.5, -25);
    place(PM.decor('goal'), -66, 36);
    // 지하철 출구
    for (const [k, s] of Object.entries(MAP.STATIONS)) if (k !== 'C') place(PM.BLD.exitStation(s.name), s.x, s.z, 0);
    // 비둘기
    const pg = new THREE.Group();
    for (let i = 0; i < 9; i++) { const b = new THREE.Group(); b.add(mesh(sphere(0.16), mat(0x9aa3ad))); b.add(mesh(sphere(0.09), mat(0x7a8390), 0.12, 0.12, 0)); b.position.set(-6 + Math.random() * 4, 6.15, 18 + Math.random() * 3); b.userData.home = b.position.clone(); pg.add(b); dyn.birds.push(b); }
    scene.add(pg);
    // 주요 장소 표지판
    const labels = [['plaza', 0, 24, '⛲ 중앙 분수대 & 커뮤니티 광장'], ['park', -80, 6, '🌳 센트럴 파크 & 비밀의 숲'], ['beach', -30, 80, '🏖️ 에메랄드 해수욕장'], ['cliff', -60.5, -88.5, '🌅 노을 정원 & 맹세의 가제보'], ['playground', -81, 44.5, '🛝 마을 놀이터'], ['beachbar', 12, 83, '🏐 비치 스포츠 & 코코넛 비치 바'], ['villa9', 50, 64, '🏡 해변 코티지 마을'], ['villa16', -36, 72, '🏡 해안 주택가'], ['alley', 69, 40, '🏮 미식 골목'], ['villa', -52, -12, '🏡 커스텀 빌라 & 신혼집 단지']];
    for (const [, x, z, t] of labels) { const s = PM.sign(t, 4.6, 0.8, '#ffffff', '#3b2b20'); const post = mesh(cyl(0.06, 0.06, 2.2), mat(0x8a5a3b), 0, 1.1, 0); const g = new THREE.Group(); g.add(post); s.position.y = 2.4; g.add(s); place(g, x, z, 0); }
    // 차량 (왕복 4차선)
    for (let i = 0; i < 4; i++) { const car = PM.decor('car', [0xff6f61, 0x4fc1e9, 0xffd84a, 0x8ee07a][i]); car.userData.lane = i % 2 ? 1.8 : -1.8; car.userData.t = Math.random(); car.userData.dir = i % 2 ? 1 : -1; scene.add(car); dyn.cars.push(car); }
    // 결혼식 장식 (웨딩 아치, 꽃길, 의자)
    const wg = new THREE.Group();
    // 상설 야외 웨딩 가든(roomkit12)이 있으면 아치 · 의자는 가든 것을 쓰고, 결혼식 때는 꽃잎 길과 꽃만 덧깖
    const garden = FM.CeremonyGarden ? FM.CeremonyGarden(scene, T, PM) : null;
    if (FM.SunsetGarden) { try { FM.SunsetGarden(scene, T, PM); } catch (e) { console.error('sunset garden', e); } }
    if (FM.Beach) { try { FM.Beach(scene, T, PM); } catch (e) { console.error('beach', e); } }
    if (FM.Places2) { try { FM.Places2(scene, T, PM); } catch (e) { console.error('places2', e); } }
    if (FM.TownLife) { try { FM.TownLife(scene, T, PM); } catch (e) { console.error('townlife', e); } }
    if (!garden) { const arch = PM.decor('arch'); arch.position.set(12, 0, -70.5); wg.add(arch); }
    const path = new THREE.Mesh(new THREE.PlaneGeometry(garden ? 1.6 : 2.2, garden ? 12.6 : 16), new THREE.MeshLambertMaterial({ color: 0xff8fb1, transparent: !!garden, opacity: garden ? 0.55 : 1, polygonOffset: true, polygonOffsetFactor: -6 })); const wgY = T.height(12, -66), pY0 = T.height(12, -73.1), pY1 = T.height(12, -60.5);
    path.rotation.x = -Math.PI / 2 + (garden ? Math.atan2(pY0 - pY1, 12.6) : 0); path.position.set(12, garden ? (pY0 + pY1) / 2 - wgY + 0.1 : 0.07, garden ? -66.8 : -63); wg.add(path); dyn.aislePath = path;
    if (!garden) for (let i = 0; i < 8; i++) for (const s of [-1, 1]) { const ch = PM.decor('chair'); ch.position.set(12 + s * 3.2, 0, -66 + i * 1.1); ch.rotation.y = Math.PI; wg.add(ch); }
    for (let i = 0; i < (garden ? 12 : 16); i++) for (const s of [-1, 1]) { const fl = mesh(sphere(0.18), mat([0xff4d6d, 0xffffff, 0xffd84a][i % 3]), 12 + s * (garden ? 0.95 : 1.3), 0.15 + (garden ? T.height(12, -72 + i) - wgY + 0.06 : 0), garden ? -72 + i : -70 + i); wg.add(fl); dyn.aisleFlowers = dyn.aisleFlowers || []; dyn.aisleFlowers.push(fl); }
    wg.position.y = T.height(12, -66); wg.visible = false; scene.add(wg); dyn.wedding = wg;
    // 반딧불이 (센트럴 파크)
    const n = 60, fp = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const x = -110 + Math.random() * 50, z = 8 + Math.random() * 30; fp[i * 3] = x; fp[i * 3 + 1] = T.height(x, z) + 0.5 + Math.random() * 1.5; fp[i * 3 + 2] = z; }
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
    dyn.fireflies = new THREE.Points(fg, new THREE.PointsMaterial({ color: 0xfff27a, size: 0.25, transparent: true, opacity: 0 }));
    scene.add(dyn.fireflies);
    // 반려동물 파크 강아지
    if (ISLE.M.character) for (let i = 0; i < 3; i++) {
      const c = ISLE.M.character(ISLE.normalizeLook({ species: 'dog', top: 'tee', shirt: [0xff8fb1, 0x8fd3ff, 0xffd84a][i], fur: [0xfff6e0, 0xc98a4a, 0x3a3a3a][i] }));
      c.root.scale.setScalar(0.42);
      c.root.position.set(-62 + i * 2, T.height(-62, 28), 28 + i);
      scene.add(c.root); dyn.pets.push({ c, t: Math.random() * 10, home: c.root.position.clone() });
    }
  }

  // 비 / 낙엽 파티클
  function makeWeather() {
    const n = 1600, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - 0.5) * 80; p[i * 3 + 1] = Math.random() * 40; p[i * 3 + 2] = (Math.random() - 0.5) * 80; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    rainPts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xaad4ff, size: 0.12, transparent: true, opacity: 0.7 }));
    rainPts.visible = false; scene.add(rainPts);
    const lp = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) { lp[i * 3] = (Math.random() - 0.5) * 60; lp[i * 3 + 1] = Math.random() * 12; lp[i * 3 + 2] = (Math.random() - 0.5) * 60; }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3));
    dyn.leaves = new THREE.Points(lg, new THREE.PointsMaterial({ color: 0xc9e07a, size: 0.25 }));
    dyn.leaves.visible = false; scene.add(dyn.leaves);
  }

  // 아파트 창문 상태 풍선 (스프라이트)
  const emojiTex = e => PM.ctex('emoji:' + e, 128, 128, (g, w, h) => { g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.arc(64, 60, 54, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(50, 106); g.lineTo(64, 126); g.lineTo(78, 106); g.fill(); g.font = '64px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, 64, 64); });
  W.emojiTex = emojiTex;
  function makeWindowBubbles() {
    const apt = buildings.apartment;
    const wins = apt.userData.windows;
    for (const [id, w] of Object.entries(wins)) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex('💤') }));
      sp.scale.set(1.6, 1.6, 1); sp.visible = false; sp.renderOrder = 10;
      const wp = new THREE.Vector3(w.x, w.y + 1.2, w.z + 0.6);
      apt.localToWorld(wp);
      sp.position.copy(wp);
      scene.add(sp);
      dyn.windows[id] = { glass: w.glass, sprite: sp, world: wp, cur: null };
    }
  }

  // ---------------------------------------------------------
  // 빌드
  // ---------------------------------------------------------
  W.build = function (sc) {
    scene = sc;
    W.scene = scene;
    fogCol = new THREE.Color(0xdff4ff);
    scene.fog = new THREE.Fog(fogCol, 120, 520);
    makeSky();
    hemi = new THREE.HemisphereLight(0xfff0dc, 0x8a7a4a, 0.55); scene.add(hemi);
    amb = new THREE.AmbientLight(0xffe8d0, 0.2); scene.add(amb);
    sun = new THREE.DirectionalLight(0xffe6c4, 0.95);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1536, 1536);
    const sc2 = sun.shadow.camera; sc2.left = -48; sc2.right = 48; sc2.top = 48; sc2.bottom = -48; sc2.near = 1; sc2.far = 300;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
    scene.add(sun); scene.add(sun.target);
    makeTerrain(); makeWater(); makeBridgeStairs(); makeRoads();
    for (const p of Object.values(MAP.P)) if (p.bld) placeBuilding(p);
    dyn.board = buildings.studio.userData.board;
    dyn.termBoard = buildings.ferry && buildings.ferry.userData.board;
    makeTrees(); makeFlowers(); makeGrass(); makeBushes(); makeDecor(); makeWeather(); makeWindowBubbles();
    // 밤 조명 몇 개 (광장, 번화가, 포장마차)
    for (const [x, z, c, i] of [[0, 10, 0xffd08a, 1.3], [-20, -10, 0xffc880, 0.9], [20, -10, 0xffc880, 0.9], [-42, -22, 0xffc070, 0.8], [70, 30, 0xff6fd0, 1.4], [40, 80, 0xff8060, 1.0], [-92, 72, 0xffb060, 0.8], [53, -79, 0xff9a40, 1.2]]) { const l = new THREE.PointLight(c, 0, 40, 1.6); l.position.set(x, T.height(x, z) + 5, z); scene.add(l); dyn.lampLights.push({ l, i }); }
    W.ready = true;
  };

  // ---------------------------------------------------------
  // 시간/날씨 적용 & 매 프레임 갱신
  // ---------------------------------------------------------
  const cDay = { top: new THREE.Color(0x72c0f2), bottom: new THREE.Color(0xe4f4fc) };
  const cSet = { top: new THREE.Color(0x8a5a9a), bottom: new THREE.Color(0xffa865) };
  const cNight = { top: new THREE.Color(0x161838), bottom: new THREE.Color(0x44345e) };
  const cDawn = { top: new THREE.Color(0x7ab4f0), bottom: new THREE.Color(0xffd8b0) };
  const tmpA = new THREE.Color(), tmpB = new THREE.Color();
  W.nightness = 0;
  W.applyTime = function (h, weather, target) {
    // 낮 6~17, 노을 17~19.5 (노을 언덕 18~19 절정), 밤 20~5
    let top, bot, sunI, night;
    const mix = (a, b, t) => { tmpA.copy(a.top).lerp(b.top, t); tmpB.copy(a.bottom).lerp(b.bottom, t); };
    if (h >= 6.5 && h < 17) { mix(cDay, cDay, 0); sunI = 1; night = 0; }
    else if (h >= 17 && h < 19) { mix(cDay, cSet, (h - 17) / 2); sunI = 1 - (h - 17) / 2 * 0.5; night = 0; }
    else if (h >= 19 && h < 20.5) { mix(cSet, cNight, (h - 19) / 1.5); sunI = 0.5 - (h - 19) / 1.5 * 0.35; night = (h - 19) / 1.5; }
    else if (h >= 4.5 && h < 6.5) { mix(cNight, cDawn, (h - 4.5) / 2); sunI = 0.2 + (h - 4.5) / 2 * 0.6; night = 1 - (h - 4.5) / 2; }
    else { mix(cNight, cNight, 0); sunI = 0.18; night = 1; }
    top = tmpA.clone(); bot = tmpB.clone();
    const wet = weather === 'rain' ? 0.55 : weather === 'cloudy' ? 0.3 : weather === 'fog' ? 0.4 : 0;
    const grey = new THREE.Color(0x9aa3ad);
    top.lerp(grey, wet * (1 - night * 0.7)); bot.lerp(grey, wet * (1 - night * 0.7));
    skyMat.uniforms.top.value.copy(top); skyMat.uniforms.bottom.value.copy(bot);
    // 해 위치
    const ang = ((h - 6) / 12) * Math.PI;
    const sd = new THREE.Vector3(-Math.cos(ang), Math.max(0.08, Math.sin(ang)), -0.35).normalize();
    skyMat.uniforms.sunDir.value.copy(night > 0.6 ? new THREE.Vector3(0.3, 0.6, -0.5).normalize() : sd);
    skyMat.uniforms.sunCol.value.set(night > 0.6 ? 0x8a80b0 : (h > 16 && h < 20) ? 0xffa040 : 0xffeac0);
    const tgt = target || new THREE.Vector3();
    sun.position.copy(tgt).addScaledVector(night > 0.6 ? new THREE.Vector3(0.3, 0.8, -0.4).normalize() : sd, 120);
    sun.target.position.copy(tgt);
    sun.intensity = sunI * (1 - wet * 0.5) * (night > 0.6 ? 0.35 : 1);
    sun.color.set(night > 0.6 ? 0xb8b0e8 : (h > 16 && h < 19.5) ? 0xffb070 : h < 9 ? 0xffe2bc : 0xfff2dc);
    hemi.intensity = 0.15 + (1 - night) * 0.44; hemi.color.copy(bot).lerp(new THREE.Color(0xfff0dc), 0.45);
    hemi.groundColor.set(night > 0.5 ? 0x4a3a4a : 0x8a7a4a);
    amb.intensity = 0.13 + night * 0.03; amb.color.set(night > 0.5 ? 0xe0c8e0 : 0xffe8d0);
    starPts.material.opacity = night * (1 - wet);
    milky.material.opacity = (h >= 22 || h < 4) ? 0.7 * (1 - wet) : 0;       // 밤 22시 이후 은하수
    fogCol.copy(bot).lerp(new THREE.Color(night > 0.5 ? 0x5a4060 : 0xeaf6ff), 0.3); scene.fog.color.copy(fogCol);
    scene.fog.near = weather === 'fog' ? 8 : weather === 'rain' ? 60 : 220;
    scene.fog.far = weather === 'fog' ? 90 : weather === 'rain' ? 300 : 900;
    for (const b of dyn.bulbs) b.material.color.set(night > 0.3 ? 0xfff1b0 : 0xe8e0c0);
    for (const { l, i } of dyn.lampLights) l.intensity = night * i * 1.3;
    if (dyn.fireflies) dyn.fireflies.material.opacity = night * 0.9;
    rainPts.visible = weather === 'rain';
    dyn.leaves.visible = weather === 'windy';
    W.nightness = night;
    if (dyn.cloudMat) { const sunset = (h > 16.5 && h < 20) ? 1 - Math.abs(h - 18.3) / 1.8 : 0; dyn.cloudMat.color.set(0xffffff).lerp(new THREE.Color(0xffb89a), Math.max(0, sunset) * 0.8).lerp(new THREE.Color(0x3a3a58), night * 0.85); dyn.cloudMat.emissive.set(0xaeb8c8).multiplyScalar(1 - night * 0.8); }
    FM.AC.setNight(Math.max(0, night - 0.2) * 0.9);
    W.sunsetGlow = h >= 18 && h < 19 ? 1 : 0;
  };

  let t = 0;
  W.update = function (dt, st, camTarget, camPos) {
    t += dt;
    windU.value = t * (st && st.weather && st.weather.type === 'windy' ? 2.2 : 1);
    for (const tx of dyn.waters) if (tx) tx.offset.y -= dt * 0.03;
    if (dyn.waterfallTex) dyn.waterfallTex.offset.y += dt * 1.6;
    seaTex.offset.x += dt * 0.004;
    W.seaU.value = t; sea.position.y = 0.06 + Math.sin(t * 1.25 * 0.5) * 0.07;
    for (const f of dyn.fires) { f.scale.y = 1 + Math.sin(t * 12) * 0.15; f.scale.x = 1 + Math.cos(t * 10) * 0.1; }
    if (dyn.mist) dyn.mist.scale.x = 1.4 + Math.sin(t * 3) * 0.1;
    // 비 / 바람 파티클이 카메라를 따라감
    if (rainPts.visible) { const a = rainPts.geometry.attributes.position; for (let i = 0; i < a.count; i++) { let y = a.getY(i) - dt * 30; if (y < 0) y += 40; a.setY(i, y); } a.needsUpdate = true; rainPts.position.set(camTarget.x, camTarget.y - 5, camTarget.z); }
    if (dyn.leaves.visible) { const a = dyn.leaves.geometry.attributes.position; for (let i = 0; i < a.count; i++) { let x = a.getX(i) + dt * 8; if (x > 30) x -= 60; a.setX(i, x); a.setY(i, (a.getY(i) + Math.sin(t * 3 + i) * 0.02)); } a.needsUpdate = true; dyn.leaves.position.set(camTarget.x, camTarget.y - 2, camTarget.z); }
    // 차량
    for (const c of dyn.cars) { c.userData.t = (c.userData.t + dt * 0.02 * c.userData.dir + 1) % 1; const z = 40 + c.userData.t * 44; c.position.set(c.userData.lane, T.height(c.userData.lane, z) + 0.05, z); c.rotation.y = c.userData.dir > 0 ? 0 : Math.PI; }
    // 비둘기
    if (dyn.clouds) dyn.clouds.rotation.y = t * 0.003;
    for (const b of dyn.balloons || []) { const u = b.userData; u.ang += dt * u.sp * 0.3; b.position.set(Math.cos(u.ang) * u.rad, u.h + Math.sin(t * 0.3 + u.rad) * 2, Math.sin(u.ang) * u.rad); b.rotation.y = t * 0.05; }
    for (const g2 of dyn.gulls || []) { const u = g2.userData; u.ang += dt * u.sp; g2.position.set(u.cx + Math.cos(u.ang) * u.rad, u.h + Math.sin(t + u.rad) * 1.5, u.cz + Math.sin(u.ang) * u.rad); g2.rotation.y = -u.ang; const f = Math.sin(t * 7 + u.rad) * 0.45; u.l.rotation.z = f; u.r.rotation.z = -f; }
    for (const b of dyn.birds) { if (b.userData.flee > 0) { b.userData.flee -= dt; b.position.y += dt * 4; b.position.x += dt * 3; if (b.userData.flee <= 0) b.position.copy(b.userData.home); } else b.position.y = b.userData.home.y + Math.abs(Math.sin(t * 6 + b.userData.home.x)) * 0.05; }
    // 강아지
    for (const p of dyn.pets) { p.t += dt; const a = p.t * 0.5; p.c.root.position.set(p.home.x + Math.cos(a) * 3, p.home.y, p.home.z + Math.sin(a * 1.3) * 2); p.c.root.rotation.y = a + Math.PI / 2; ISLE.M.animate(p.c, dt, 0.6); }
    // 페리 흔들림
    if (dyn.ferry) dyn.ferry.rotation.z = Math.sin(t * 0.8) * 0.03;
    // 구름다리 흔들림 (강풍)
    if (dyn.bridge) dyn.bridge.rotation.z = Math.sin(t * 1.3) * (st.weather.type === 'windy' ? 0.012 : 0.004);
    // 결혼식 장식
    if (dyn.wedding) {
      dyn.wedding.visible = !!st.flags.weddingMode || st.quests.some(q => q.type === 'wedding_prep' && q.state === 'active');
      const fc = { rose: 0xff4d6d, tulip: 0xff9ec0, lily: 0xffffff, sunflower: 0xffd84a, lavender: 0xb69cff }[st.flags.aisleFlower || 'rose'];
      if (dyn.aisleFlowers && dyn._fc !== fc) { dyn._fc = fc; dyn.aisleFlowers.forEach((f, i) => { f.material = mat(i % 2 ? fc : 0xffffff); }); }
    }
    updateWindows(st);
    if ((dyn.boardT = (dyn.boardT || 0) - dt) < 0) { dyn.boardT = 0.5; drawBoard(st); }
  };
  W.birdsFlee = function () { for (const b of dyn.birds) b.userData.flee = 3; };

  // 창문: 불 켜진 방, 자는 방, 혼자 춤추는 방 + 상태 아이콘
  function updateWindows(st) {
    for (const [id, w] of Object.entries(dyn.windows)) {
      const room = st.rooms[id];
      const who = st.villagers.filter(v => v.loc === id);
      const owner = st.villagers.find(v => v.home === id);
      let col = 0x2a3050, icon = null;
      if (!room || !owner) col = 0x3a4058;
      else {
        const lit = room.lightOn !== false && who.length > 0;
        col = lit ? (room.disco && room.disco > st.realT ? [0xff6fd0, 0x6fd0ff, 0xffe06f][Math.floor(t * 4) % 3] : 0xffe9a8) : (W.nightness > 0.4 ? 0x1a2040 : 0x9fd6ff);
        if (who.some(v => v.act && ['dance', 'quirk_dance'].includes(v.act.id)) || who.some(v => v.pose === 'dance')) col = [0xff9ad0, 0xffe9a8][Math.floor(t * 3) % 2];
        const sleeping = who.find(v => v.act && v.act.id === 'sleep');
        const fight = who.length >= 2 && who.some(v => v.pose === 'argue');
        const guest = who.some(v => v.home !== id);
        const bal = owner.balloon;
        if (fight) icon = '🔥';
        else if (bal && (bal.kind === 'crush' || bal.kind === 'crushP' || bal.kind === 'marry')) icon = '💖';
        else if (bal) icon = '💭';
        else if (guest) icon = '🟢';
        else if (sleeping) icon = '💤';
      }
      w.glass.material.color.setHex(col);
      if (icon !== w.cur) { w.cur = icon; w.sprite.visible = !!icon; if (icon) { w.sprite.material.map = emojiTex(icon); w.sprite.material.needsUpdate = true; } }
      if (icon) w.sprite.position.y = w.world.y + Math.sin(t * 3 + w.world.x) * 0.15;
    }
  }
  W.windowAt = function (raycaster) {
    const list = Object.entries(dyn.windows).map(([id, w]) => { w.glass.userData.roomId = id; return w.glass; });
    const hits = raycaster.intersectObjects(list.concat(Object.values(dyn.windows).map(w => w.sprite)), false);
    if (!hits.length) return null;
    const o = hits[0].object;
    if (o.userData.roomId) return o.userData.roomId;
    const e = Object.entries(dyn.windows).find(([, w]) => w.sprite === o);
    return e ? e[0] : null;
  };

  // 전광판 (1일 2회 친구모아 뉴스 + 실시간 랭킹)
  let boardCanvas = null, boardTex = null, scroll = 0;
  // 광장 전광판 — 24시간 친구모아 뉴스 생방송 (앵커 얼굴 · 헤드라인 순환 · 하단 자막 흐름)
  let boardStory = 0, storyT = 0, tickX = 0, anchorImg = null, anchorKey = ''; const faceImgs = new Map();
  const wrap = (g, text, x, y, maxW, lh, maxL) => { let line = '', n = 0; for (const ch of text) { if (g.measureText(line + ch).width > maxW) { g.fillText(line, x, y + n * lh); line = ch; if (++n >= maxL - 1) { line = line; } if (n >= maxL) return; } else line += ch; } if (n < maxL) g.fillText(line, x, y + n * lh); };
  function stories(st) {
    const out = [];
    for (const t of (st.newsBoard && st.newsBoard.items) || []) out.push({ tag: '📰 뉴스', text: FM.josa(t) });
    for (const e of st.log.slice(-40).reverse()) if (e.imp >= 2 && !e.secret && out.length < 14) out.push({ tag: e.newsKind === 'drama' ? '🚨 속보' : '📡 현장', text: e.text.replace(/^[^\s]+\s/, '') });
    const R = st.rankings || {};
    if (R.insider && R.insider[0]) out.push({ tag: '🏆 랭킹', text: '섬 최고의 인싸 TOP 3 — ' + R.insider.map((x, i) => `${i + 1}위 ${x.name}`).join(' · ') });
    if (R.rich && R.rich[0]) out.push({ tag: '💰 경제', text: '부자 주민 TOP 3 — ' + R.rich.map((x, i) => `${i + 1}위 ${x.name}`).join(' · ') });
    const W2 = (FM.Ev && FM.Ev.WEATHER) || {}; out.push({ tag: '☀️ 날씨', text: `현재 섬 날씨는 ${W2[st.weather.type] || st.weather.type}. 외출하실 때 참고하세요!` });
    const busy = {}; for (const v of st.villagers) if (v.loc && v.loc.endsWith('_in') && FM.INTERIORS[v.loc] && FM.INTERIORS[v.loc].kind === 'venue') busy[v.loc] = (busy[v.loc] || 0) + 1;
    const top = Object.entries(busy).sort((a, b) => b[1] - a[1])[0]; if (top) out.push({ tag: '📍 지금 핫플', text: `지금 ${FM.INTERIORS[top[0]].name}에 주민 ${top[1]}명이 모여 있어요!` });
    if (!out.length) out.push({ tag: '📰 뉴스', text: '오늘도 평화로운 친구모아 아일랜드입니다.' });
    return out;
  }
  function drawBoard(st) {
    if (!dyn.board) return;
    if (!boardCanvas) { boardCanvas = document.createElement('canvas'); boardCanvas.width = 1024; boardCanvas.height = 560; boardTex = new THREE.CanvasTexture(boardCanvas); dyn.board.material = new THREE.MeshBasicMaterial({ map: boardTex }); if (dyn.termBoard) dyn.termBoard.material = new THREE.MeshBasicMaterial({ map: boardTex }); }
    const g = boardCanvas.getContext('2d'), list = stories(st);
    if ((storyT += 1) >= 12) { storyT = 0; boardStory++; }
    const cur = list[boardStory % list.length];
    // 앵커 얼굴 (방송국 전속 앵커)
    const anc = (FM.Ev && FM.Ev.staffById && FM.Ev.staffById('s_anchor')) || st.villagers.find(v => v.job === 'anchor');
    if (anc && FM.Face) { const u = FM.Face.url(anc, storyT % 8 < 4 ? 'smile' : 'happy'); if (u && u !== anchorKey) { anchorKey = u; let im = faceImgs.get(u); if (!im) { im = new Image(); im.onload = () => { if (anchorKey === u) { anchorImg = im; dyn.boardT = 0; } }; im.src = u; faceImgs.set(u, im); } else if (im.complete) anchorImg = im; } }
    const bg = g.createLinearGradient(0, 0, 0, 560); bg.addColorStop(0, '#101a44'); bg.addColorStop(1, '#0a0f26'); g.fillStyle = bg; g.fillRect(0, 0, 1024, 560);
    // 스튜디오 배경 줄무늬 & 로고
    g.fillStyle = 'rgba(80,140,255,0.08)'; for (let x = -560; x < 1024; x += 60) { g.beginPath(); g.moveTo(x, 70); g.lineTo(x + 30, 70); g.lineTo(x + 520, 470); g.lineTo(x + 490, 470); g.fill(); }
    g.fillStyle = '#ff3a6a'; g.fillRect(0, 0, 1024, 68); g.textBaseline = 'middle';
    g.font = '42px Jua, sans-serif'; g.fillStyle = '#ffffff'; g.fillText('📺 친구모아 뉴스', 22, 36);
    g.fillStyle = (Date.now() / 600 | 0) % 2 ? '#ffffff' : '#ffd0dc'; g.beginPath(); g.arc(398, 36, 11, 0, 7); g.fill(); g.font = '34px Jua, sans-serif'; g.fillText('LIVE', 416, 38);
    g.fillStyle = '#ffffff'; g.textAlign = 'right'; g.fillText(`${FM.Sim.time.day()}일차 ${FM.Sim.time.hm()}`, 1000, 38); g.textAlign = 'left';
    // 앵커
    g.fillStyle = '#1c2a66'; g.fillRect(24, 96, 250, 250); g.strokeStyle = '#6ab0ff'; g.lineWidth = 4; g.strokeRect(24, 96, 250, 250);
    if (anchorImg) g.drawImage(anchorImg, 29, 101, 240, 240); else { g.font = '120px sans-serif'; g.fillText('🎙️', 80, 220); }
    g.fillStyle = '#ff3a6a'; g.fillRect(24, 336, 250, 44); g.font = '28px Jua, sans-serif'; g.fillStyle = '#fff'; g.fillText('🎙️ ' + (anc ? anc.name : '친구모아 앵커'), 36, 359);
    // 헤드라인
    g.fillStyle = cur.tag.includes('속보') ? '#ff3a3a' : '#ffd84a'; const tw = g.measureText(cur.tag).width; g.fillRect(300, 100, Math.max(160, tw + 60), 50); g.fillStyle = cur.tag.includes('속보') ? '#fff' : '#1a1a2a'; g.font = '32px Jua, sans-serif'; g.fillText(cur.tag, 316, 126);
    g.fillStyle = '#ffffff'; g.font = '44px Jua, sans-serif'; wrap(g, cur.text, 300, 196, 690, 58, 4);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.font = '24px Jua, sans-serif'; g.fillText(`${(boardStory % list.length) + 1} / ${list.length}`, 940, 440);
    // 하단 자막 (계속 흐름)
    g.fillStyle = '#ffd84a'; g.fillRect(0, 470, 150, 90); g.fillStyle = '#1a1a2a'; g.font = '34px Jua, sans-serif'; g.fillText('NEWS', 26, 516);
    g.fillStyle = '#0b1230'; g.fillRect(150, 470, 874, 90);
    const tick = list.map(x => `${x.tag} ${x.text}`).join('     ◆     ') + '     ◆     ';
    g.save(); g.beginPath(); g.rect(150, 470, 874, 90); g.clip(); g.font = '36px Jua, sans-serif'; g.fillStyle = '#ffffff';
    const tl = g.measureText(tick).width || 1; tickX = (tickX + 26) % tl; g.fillText(tick, 170 - tickX, 516); g.fillText(tick, 170 - tickX + tl, 516); g.restore();
    boardTex.needsUpdate = true;
  }

  W.sun = () => sun;
})();
