/* 3D 모델: 캐릭터, 나무, 꽃, 소품, 집, 가구
 * 둥글둥글한 느낌을 위해 모서리가 둥근 상자, 캡슐, 회전체(lathe), 매끈한 구를 주로 사용하고
 * 모든 재질에 부드러운 림 라이트(펠트 같은 질감)를 더함 */
(() => {
  'use strict';
  const ISLE = window.ISLE;
  const TEX = ISLE.TEX;
  const M = {};

  // =========================================================
  // 재질: 램버트 + 부드러운 림 라이트
  // =========================================================
  const RIM_CHUNK = `
    {
      vec3 vd = normalize( vViewPosition );
      float rim = 1.0 - clamp( dot( vd, normal ), 0.0, 1.0 );
      outgoingLight += diffuseColor.rgb * pow( rim, 2.2 ) * SOFT_RIM;
      outgoingLight += vec3( 1.0 ) * pow( rim, 5.0 ) * 0.06;
    }
    #include <output_fragment>`;
  function soften(m, strength = 0.38) {
    m.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <output_fragment>', RIM_CHUNK)
        .replace('#include <common>', `#include <common>\n#define SOFT_RIM ${strength.toFixed(2)}`);
    };
    m.customProgramCacheKey = () => 'soft' + strength;
    return m;
  }
  M.soften = soften;

  const matCache = new Map();
  function mat(color, opts = {}) {
    const k = color + JSON.stringify(opts);
    if (matCache.has(k)) return matCache.get(k);
    const m = soften(new THREE.MeshLambertMaterial(Object.assign({ color }, opts)));
    matCache.set(k, m);
    return m;
  }

  // =========================================================
  // 도형
  // =========================================================
  const geoCache = new Map();
  function geo(key, make) {
    if (!geoCache.has(key)) geoCache.set(key, make());
    return geoCache.get(key);
  }

  // 모서리가 둥근 상자 (three.js RoundedBoxGeometry 와 같은 방식)
  function roundedBoxGeo(w, h, d, r, s = 2) {
    const seg = s * 2 + 1;
    r = Math.max(0.001, Math.min(r, w / 2, h / 2, d / 2));
    const g = new THREE.BoxGeometry(1, 1, 1, seg, seg, seg);
    const pos = g.attributes.position, nor = g.attributes.normal;
    const half = 0.5 / seg;
    const bx = w / 2 - r, by = h / 2 - r, bz = d / 2 - r;
    const v = new THREE.Vector3(), n = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      n.copy(v);
      n.x -= Math.sign(n.x) * half; n.y -= Math.sign(n.y) * half; n.z -= Math.sign(n.z) * half;
      n.normalize();
      pos.setXYZ(i, bx * Math.sign(v.x) + n.x * r, by * Math.sign(v.y) + n.y * r, bz * Math.sign(v.z) + n.z * r);
      nor.setXYZ(i, n.x, n.y, n.z);
    }
    return g;
  }
  M.roundedBoxGeo = roundedBoxGeo;

  const sphere = (r, ws = 28, hs = 20) => geo(`s${r},${ws}`, () => new THREE.SphereGeometry(r, ws, hs));
  // 기본 상자는 전부 살짝 둥글게
  const box = (w, h, d, r) => geo(`rb${w},${h},${d},${r}`, () =>
    roundedBoxGeo(w, h, d, r !== undefined ? r : Math.min(0.07, Math.min(w, h, d) * 0.3)));
  const cyl = (rt, rb, h, seg = 22) => geo(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg));
  const capsule = (r, len) => geo(`cap${r},${len}`, () => new THREE.CapsuleGeometry(r, len, 8, 16));
  // 부드러운 곡선으로 회전체 만들기
  function lathe(key, pts, seg = 28) {
    return geo('l' + key, () => {
      const curve = new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y)));
      const p = curve.getPoints(24).map(v => new THREE.Vector2(Math.max(0.0001, v.x), v.y));
      return new THREE.LatheGeometry(p, seg);
    });
  }
  // 끝이 둥근 원뿔 (고양이 귀 등)
  const roundCone = (rb, h) => lathe(`rc${rb},${h}`, [[0.0001, 0], [rb, 0.01], [rb * 0.92, h * 0.3], [rb * 0.6, h * 0.68], [rb * 0.28, h * 0.92], [0.0001, h]]);
  // 둥근 테두리의 원판 (테이블 상판 등)
  const puck = (r, h) => lathe(`pk${r},${h}`, [[0.0001, 0], [r - h * 0.5, 0], [r, h * 0.5], [r - h * 0.5, h], [0.0001, h]], 32);

  function mesh(g, m, x = 0, y = 0, z = 0, shadow = true) {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = shadow;
    o.receiveShadow = true;
    return o;
  }
  M.mat = mat;
  M.mesh = mesh;

  // 캐릭터 모델은 js/character.js 에 있음 (게임과 캐릭터 만들기 도구가 함께 사용)
  M.h = { mat, geo, sphere, box, cyl, capsule, lathe, roundCone, puck, mesh, soften, roundedBoxGeo };

  // =========================================================
  // 자연물 (몽글몽글)
  // =========================================================
  const LEAF = [0x4fae4a, 0x62c257, 0x7ad26a];
  const BLOB = () => sphere(1, 24, 18);
  M.tree = (fruitType) => {
    const g = new THREE.Group();
    const trunk = mesh(lathe('trunk', [[0.0001, 0], [0.3, 0], [0.2, 0.12], [0.15, 0.5], [0.13, 1.0], [0.15, 1.2], [0.0001, 1.22]], 16), mat(0xa3703f), 0, 0, 0);
    g.add(trunk);
    const canopy = new THREE.Group();
    canopy.position.y = 1.62;
    const blobs = [
      [0, 0.1, 0, 0.78, 1], [-0.5, -0.12, 0.08, 0.55, 0], [0.5, -0.1, -0.02, 0.57, 1],
      [0.05, -0.18, 0.46, 0.56, 1], [-0.08, -0.12, -0.46, 0.56, 0], [0.12, 0.5, 0.05, 0.5, 2],
      [-0.32, 0.32, 0.22, 0.4, 2], [0.36, 0.3, 0.25, 0.4, 2],
    ];
    for (const [x, y, z, r, c] of blobs) {
      const b = mesh(BLOB(), mat(LEAF[c]), x, y, z);
      b.scale.set(r, r * 0.92, r);
      canopy.add(b);
    }
    g.add(canopy);
    const fruits = [];
    for (const [x, y, z] of [[-0.44, -0.12, 0.6], [0.42, -0.02, 0.6], [0.02, 0.32, 0.72]]) {
      const f = M.fruit(fruitType, 1.2);
      f.position.set(x, y, z);
      canopy.add(f);
      fruits.push(f);
    }
    g.userData = { canopy, fruits };
    return g;
  };
  M.setTreeFruit = (tree, n) => tree.userData.fruits.forEach((f, i) => { f.visible = i < n; });

  M.fruit = (type, s = 1) => {
    const g = new THREE.Group();
    const col = ISLE.FRUIT_COLOR[type];
    const shine = mat(0xffffff);
    if (type === 'cherry') {
      for (const [x, y] of [[-0.065, 0], [0.065, -0.02]]) {
        g.add(mesh(sphere(0.085), mat(col), x, y, 0));
        g.add(mesh(sphere(0.022), shine, x - 0.03, y + 0.035, 0.06, false));
      }
      const stem = mesh(capsule(0.01, 0.1), mat(0x5a8a2e), 0, 0.1, 0, false);
      g.add(stem);
    } else {
      const f = mesh(sphere(0.14), mat(col), 0, 0, 0);
      if (type === 'pear') f.scale.set(0.9, 1.15, 0.9);
      else f.scale.set(1, 0.93, 1);
      g.add(f);
      g.add(mesh(sphere(0.035), shine, -0.05, 0.05, 0.1, false));
      const leaf = mesh(sphere(0.055), mat(0x5aa84a), 0.05, 0.14, 0);
      leaf.scale.set(1.4, 0.45, 0.8);
      leaf.rotation.z = -0.3;
      g.add(leaf);
    }
    g.scale.setScalar(s);
    return g;
  };

  M.flower = (itemId) => {
    const g = new THREE.Group();
    const col = ISLE.ITEMS[itemId].color;
    const spots = [[-0.18, 0.1], [0.16, -0.08], [0.02, 0.2]];
    spots.forEach(([x, z], i) => {
      const h = 0.26 + i * 0.05;
      g.add(mesh(capsule(0.018, h), mat(0x4f9e3f), x, h / 2, z, false));
      for (const side of [-1, 1]) {
        const leaf = mesh(sphere(0.06), mat(0x6cc15a), x + side * 0.055, 0.08, z, false);
        leaf.scale.set(1.3, 0.4, 0.7);
        leaf.rotation.z = side * 0.4;
        g.add(leaf);
      }
      const head = new THREE.Group();
      head.position.set(x, h + 0.03, z);
      if (itemId === 'tulip') {
        const cup = mesh(sphere(0.085), mat(col), 0, 0.02, 0, false);
        cup.scale.set(0.9, 1.2, 0.9);
        head.add(cup);
        for (let k = 0; k < 3; k++) {
          const a = k / 3 * Math.PI * 2;
          const p = mesh(sphere(0.04), mat(col), Math.cos(a) * 0.05, 0.1, Math.sin(a) * 0.05, false);
          head.add(p);
        }
      } else {
        const n = itemId === 'mum' ? 10 : 6;
        const pr = itemId === 'mum' ? 0.05 : 0.06;
        for (let k = 0; k < n; k++) {
          const a = k / n * Math.PI * 2;
          const p = mesh(sphere(pr), mat(col), Math.cos(a) * 0.075, 0, Math.sin(a) * 0.075, false);
          p.scale.set(1, 0.55, 1);
          head.add(p);
        }
        if (itemId === 'mum') head.add(mesh(sphere(0.06), mat(col), 0, 0.03, 0, false));
        head.add(mesh(sphere(0.04), mat(itemId === 'mum' ? 0xe8a020 : 0xfff0a0), 0, 0.05, 0, false));
      }
      head.rotation.x = -0.25;
      g.add(head);
    });
    return g;
  };

  M.weed = () => {
    const g = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      const b = mesh(sphere(0.06), mat(0x4c9a3c), Math.cos(a) * 0.07, 0.12, Math.sin(a) * 0.07, false);
      b.scale.set(0.55, 2.2, 0.35);
      b.rotation.set(Math.sin(a) * 0.5, -a, -Math.cos(a) * 0.5);
      g.add(b);
    }
    return g;
  };

  // 매끈하게 울퉁불퉁한 돌
  const rockGeo = (key, r, seed) => geo(key, () => {
    const g = new THREE.SphereGeometry(r, 22, 16);
    const p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = 1 + Math.sin(v.x * 7 + seed) * 0.06 + Math.cos(v.z * 6 + seed * 2) * 0.06 + Math.sin(v.y * 5) * 0.04;
      v.multiplyScalar(n);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  });
  M.rock = () => {
    const g = new THREE.Group();
    const r = mesh(rockGeo('rockA', 0.42, 1), mat(0xa6adbb), 0, 0.26, 0);
    r.scale.set(1.1, 0.75, 1);
    g.add(r);
    const r2 = mesh(rockGeo('rockB', 0.2, 4), mat(0xbcc3cf), 0.32, 0.1, 0.25);
    r2.scale.set(1, 0.7, 1);
    g.add(r2);
    return g;
  };

  M.bush = () => {
    const g = new THREE.Group();
    for (const [x, y, z, r, c] of [[0, 0.3, 0, 0.42, 0], [-0.3, 0.2, 0.1, 0.3, 1], [0.3, 0.2, 0.05, 0.32, 1], [0.05, 0.5, 0.1, 0.25, 2]]) {
      const b = mesh(BLOB(), mat([0x3f8f3e, 0x4ea449, 0x62b85a][c]), x, y, z);
      b.scale.set(r, r * 0.9, r);
      g.add(b);
    }
    return g;
  };

  M.sapling = () => {
    const g = new THREE.Group();
    const dirt = mesh(puck(0.24, 0.06), mat(0xa47b4f), 0, 0, 0, false);
    g.add(dirt);
    g.add(mesh(capsule(0.022, 0.3), mat(0x6a9c3a), 0, 0.2, 0));
    for (const side of [-1, 1]) {
      const l = mesh(sphere(0.09), mat(0x7ccf5c), side * 0.09, 0.36, 0);
      l.scale.set(1.4, 0.45, 0.75);
      l.rotation.z = side * 0.45;
      g.add(l);
    }
    return g;
  };

  M.item = (id) => {
    const it = ISLE.ITEMS[id];
    if (it.kind === 'fruit') { const f = M.fruit(id, 1.3); f.position.y = 0.17; return f; }
    if (it.kind === 'flower') { const f = M.flower(id); f.scale.setScalar(0.7); return f; }
    const g = new THREE.Group();
    if (id === 'shell') {
      const s = mesh(sphere(0.15), mat(0xffd6d0), 0, 0.04, 0);
      s.scale.set(1, 0.38, 0.85);
      g.add(s);
      for (let i = -2; i <= 2; i++) {
        const rib = mesh(capsule(0.012, 0.18), mat(0xf2a8a0), i * 0.045, 0.085, 0, false);
        rib.rotation.set(Math.PI / 2, 0, i * 0.25);
        g.add(rib);
      }
    } else if (id === 'stone') {
      const s = mesh(rockGeo('stone', 0.15, 7), mat(0xa6adbb), 0, 0.09, 0);
      s.scale.set(1, 0.75, 1);
      g.add(s);
    } else if (id === 'weed') {
      const w = M.weed(); w.scale.setScalar(0.7); g.add(w);
    }
    return g;
  };

  // =========================================================
  // 구조물
  // =========================================================
  M.house = (name) => {
    const g = new THREE.Group();
    const W = 3.5, D = 2.5, H = 1.8;
    g.add(mesh(box(W, H, D, 0.22), mat(0xfff4dc), 0, H / 2, 0));
    // 통통한 지붕 (둥근 모서리 삼각기둥)
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2 - 0.15, 0); shape.lineTo(0, 1.15); shape.lineTo(W / 2 + 0.15, 0); shape.closePath();
    const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: D + 0.2, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.18, bevelSegments: 6, curveSegments: 4 });
    roofGeo.translate(0, 0, -(D + 0.2) / 2);
    g.add(mesh(roofGeo, mat(0xf07f68), 0, H - 0.05, 0));
    g.add(mesh(box(0.42, 0.8, 0.42, 0.14), mat(0xd9735d), 0.9, H + 0.75, -0.3));
    g.add(mesh(box(0.52, 0.12, 0.52, 0.06), mat(0xc4604b), 0.9, H + 1.15, -0.3));
    // 둥근 문
    const doorShape = new THREE.Shape();
    doorShape.moveTo(-0.36, 0); doorShape.lineTo(-0.36, 0.72); doorShape.absarc(0, 0.72, 0.36, Math.PI, 0, true); doorShape.lineTo(0.36, 0); doorShape.closePath();
    const doorGeo = new THREE.ExtrudeGeometry(doorShape, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 });
    g.add(mesh(doorGeo, mat(0xb98553), 0, 0.02, D / 2 - 0.02));
    g.add(mesh(sphere(0.055), mat(0xffd84a), 0.22, 0.55, D / 2 + 0.1, false));
    g.add(mesh(box(1.2, 0.12, 0.55, 0.06), mat(0xd9c2a0), 0, 0.06, D / 2 + 0.28));
    // 동그란 창문
    const winMat = soften(new THREE.MeshLambertMaterial({ color: 0xbfe8ff, emissive: 0x000000 }));
    for (const x of [-1.1, 1.1]) {
      const frame = mesh(geo('winFrame', () => new THREE.TorusGeometry(0.3, 0.06, 12, 32)), mat(0xb98553), x, 1.05, D / 2 + 0.02);
      g.add(frame);
      const glass = mesh(geo('winGlass', () => new THREE.CircleGeometry(0.3, 32)), winMat, x, 1.05, D / 2 + 0.01, false);
      g.add(glass);
      g.add(mesh(box(0.04, 0.56, 0.04, 0.02), mat(0xb98553), x, 1.05, D / 2 + 0.03, false));
      g.add(mesh(box(0.56, 0.04, 0.04, 0.02), mat(0xb98553), x, 1.05, D / 2 + 0.03, false));
      // 화분 받침
      g.add(mesh(box(0.7, 0.1, 0.18, 0.05), mat(0xb98553), x, 0.68, D / 2 + 0.1));
      for (let i = -1; i <= 1; i++) g.add(mesh(sphere(0.07), mat([0xff7aa8, 0xffd84a, 0xff9a3d][i + 1]), x + i * 0.2, 0.78, D / 2 + 0.12, false));
    }
    // 문패
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const nameTex = new THREE.CanvasTexture(c);
    g.add(mesh(box(0.98, 0.3, 0.05, 0.08), mat(0xb98553), 0, 1.58, D / 2 + 0.02, false));
    g.add(mesh(new THREE.PlaneGeometry(0.9, 0.24), new THREE.MeshLambertMaterial({ map: nameTex }), 0, 1.58, D / 2 + 0.05, false));
    g.userData = { winMat, setName: (n) => {
      const x = c.getContext('2d');
      x.fillStyle = '#fffaf0'; x.fillRect(0, 0, 256, 64);
      x.fillStyle = '#6b4f2e'; x.font = '36px Jua, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(n + '의 집', 128, 34);
      nameTex.needsUpdate = true;
    } };
    g.userData.setName(name);
    return g;
  };

  M.shopBox = () => {
    const g = new THREE.Group();
    g.add(mesh(box(0.82, 0.55, 0.72, 0.1), mat(0xc98f55), 0, 0.28, 0));
    g.add(mesh(box(0.9, 0.1, 0.8, 0.05), mat(0x8c5d33), 0, 0.58, 0));
    for (const y of [0.17, 0.36]) g.add(mesh(box(0.84, 0.035, 0.74, 0.015), mat(0xa8713c), 0, y, 0, false));
    g.add(mesh(capsule(0.03, 0.5), mat(0x8c5d33), 0, 0.9, -0.2));
    const c = document.createElement('canvas');
    c.width = 128; c.height = 64;
    const x = c.getContext('2d');
    x.fillStyle = '#fffaf0'; x.fillRect(0, 0, 128, 64);
    x.fillStyle = '#b7862a'; x.font = '30px Jua, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('💰 판매', 64, 34);
    g.add(mesh(box(0.68, 0.36, 0.05, 0.08), mat(0x8c5d33), 0, 1.15, -0.2, false));
    g.add(mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(c) }), 0, 1.15, -0.17, false));
    return g;
  };

  M.lamp = () => {
    const g = new THREE.Group();
    g.add(mesh(capsule(0.05, 1.7), mat(0x4a4a52), 0, 0.9, 0));
    g.add(mesh(puck(0.18, 0.1), mat(0x4a4a52), 0, 0, 0));
    const bulbMat = new THREE.MeshLambertMaterial({ color: 0xfff6d0, emissive: 0x000000 });
    g.add(mesh(sphere(0.19), bulbMat, 0, 1.92, 0));
    const hat = mesh(geo('lampHat', () => new THREE.SphereGeometry(0.22, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2)), mat(0x4a4a52), 0, 2.02, 0);
    hat.scale.y = 0.5;
    g.add(hat);
    g.add(mesh(sphere(0.05), mat(0x4a4a52), 0, 2.14, 0));
    g.userData = { bulbMat };
    return g;
  };

  M.signpost = () => {
    const g = new THREE.Group();
    g.add(mesh(capsule(0.05, 1.1), mat(0x8c5d33), 0, 0.6, 0));
    const c = document.createElement('canvas');
    c.width = 128; c.height = 64;
    const x = c.getContext('2d');
    x.fillStyle = '#6fa8dc'; x.fillRect(0, 0, 128, 64);
    x.fillStyle = '#fff'; x.beginPath(); x.moveTo(14, 32); x.lineTo(44, 10); x.lineTo(44, 22); x.lineTo(112, 22); x.lineTo(112, 42); x.lineTo(44, 42); x.lineTo(44, 54); x.closePath(); x.fill();
    g.add(mesh(box(0.72, 0.38, 0.07, 0.08), mat(0x8c5d33), 0, 1.05, 0));
    g.add(mesh(new THREE.PlaneGeometry(0.62, 0.3), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(c) }), 0, 1.05, 0.04, false));
    return g;
  };

  M.bridge = () => {
    const g = new THREE.Group();
    const wood = mat(0xb98553), dark = mat(0x8c5d33);
    for (let i = 0; i < 7; i++) g.add(mesh(box(0.4, 0.12, 1.2, 0.05), i % 2 ? wood : mat(0xc49262), -1.3 + i * 0.43, 0.05, 0));
    for (const z of [-0.58, 0.58]) {
      const rail = mesh(capsule(0.05, 3.0), dark, 0, 0.48, z);
      rail.rotation.z = Math.PI / 2;
      g.add(rail);
      for (const x of [-1.5, 0, 1.5]) {
        g.add(mesh(capsule(0.07, 0.45), dark, x, 0.28, z));
        g.add(mesh(sphere(0.085), dark, x, 0.56, z));
      }
    }
    g.add(mesh(box(3.0, 0.14, 0.16, 0.06), dark, 0, -0.08, 0));
    return g;
  };

  // =========================================================
  // 가구 (앞면 = +z, 원점 = 차지하는 칸의 중심, 바닥 y=0)
  // =========================================================
  const WOOD = 0x8a5a36, WOOD_D = 0x5c3a22, TEAL = 0x8fd3cc, TEAL_D = 0x5fb3ac;
  function legs(g, w, d, h, color = WOOD_D, r = 0.035) {
    for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]])
      g.add(mesh(capsule(r, Math.max(0.01, h - r * 2)), mat(color), x, h / 2, z));
  }
  // 몽실몽실한 소파
  function sofa(g, width, fabric) {
    const f = fabric;
    g.add(mesh(box(width, 0.28, 0.8, 0.12), f, 0, 0.3, 0.02));
    g.add(mesh(box(width - 0.1, 0.58, 0.26, 0.13), f, 0, 0.58, -0.28));
    for (const s of [-1, 1]) g.add(mesh(box(0.24, 0.46, 0.82, 0.11), f, s * (width / 2 - 0.12), 0.42, 0.01));
    const n = Math.round(width);
    const cw = (width - 0.44) / n;
    for (let i = 0; i < n; i++) {
      g.add(mesh(box(cw - 0.02, 0.16, 0.62, 0.08), f, -width / 2 + 0.22 + cw * (i + 0.5), 0.5, 0.06));
      g.add(mesh(box(cw - 0.06, 0.38, 0.16, 0.08), f, -width / 2 + 0.22 + cw * (i + 0.5), 0.68, -0.12));
    }
    legs(g, width - 0.2, 0.6, 0.16);
  }

  const FURN = {
    sofa_teal: g => sofa(g, 1.85, mat(TEAL)),
    sofa_pattern: g => sofa(g, 1.85, new THREE.MeshLambertMaterial({ map: TEX.diamond() })),
    armchair: g => {
      sofa(g, 0.9, mat(TEAL));
      const throwBlanket = mesh(box(0.5, 0.05, 0.4), mat(0xf2c14e), 0.15, 0.84, -0.3);
      throwBlanket.rotation.z = 0.2;
      g.add(throwBlanket);
    },
    coffee_table: g => {
      g.add(mesh(box(1.8, 0.07, 0.85), mat(WOOD), 0, 0.5, 0));
      legs(g, 1.6, 0.65, 0.47, WOOD);
      g.add(mesh(box(0.7, 0.03, 0.45), mat(0xd9dde3), -0.35, 0.55, 0));
      const pot = mesh(sphere(0.12), mat(0xf6f0c8), -0.45, 0.66, 0);
      pot.scale.y = 0.85;
      g.add(pot);
      const spout = mesh(cyl(0.02, 0.03, 0.14, 6), mat(0xf6f0c8), -0.3, 0.68, 0);
      spout.rotation.z = -0.9;
      g.add(spout);
      g.add(mesh(sphere(0.04), mat(0xd9b44a), -0.45, 0.77, 0));
      for (const [x, z] of [[-0.18, 0.12], [-0.18, -0.12]]) {
        g.add(mesh(cyl(0.07, 0.07, 0.01, 12), mat(0xf6f0c8), x, 0.57, z));
        g.add(mesh(cyl(0.045, 0.035, 0.06, 10), mat(0xf6f0c8), x, 0.6, z));
        g.add(mesh(cyl(0.04, 0.04, 0.005, 10), mat(0xe89a4a), x, 0.632, z, false));
      }
      g.add(mesh(cyl(0.2, 0.2, 0.03, 16), mat(0x7fc8c0), 0.45, 0.55, 0));
      for (let i = 0; i < 5; i++) g.add(mesh(sphere(0.05), mat(0xe0b060), 0.4 + (i % 3) * 0.06, 0.58, -0.06 + (i >> 1) * 0.07, false));
    },
    chair: g => {
      g.add(mesh(box(0.5, 0.07, 0.5), mat(TEAL_D), 0, 0.45, 0));
      legs(g, 0.42, 0.42, 0.42);
      for (const s of [-1, 1]) g.add(mesh(box(0.05, 0.55, 0.05), mat(WOOD_D), s * 0.21, 0.72, -0.22));
      g.add(mesh(box(0.46, 0.14, 0.04), mat(WOOD_D), 0, 0.9, -0.22));
    },
    lamp_table: g => {
      g.add(mesh(puck(0.4, 0.07), mat(WOOD), 0, 0.52, 0));
      g.add(mesh(puck(0.32, 0.015), mat(0xffffff), 0, 0.59, 0, false));
      g.add(mesh(cyl(0.05, 0.08, 0.52, 8), mat(WOOD_D), 0, 0.27, 0));
      g.add(mesh(puck(0.22, 0.05), mat(WOOD_D), 0, 0, 0));
      g.add(mesh(sphere(0.1), mat(0x7a4a2a), 0, 0.68, 0));
      g.add(mesh(capsule(0.025, 0.2), mat(0x7a4a2a), 0, 0.8, 0));
      const shade = mesh(geo('shade', () => new THREE.CylinderGeometry(0.13, 0.27, 0.3, 16, 1, true)),
        new THREE.MeshLambertMaterial({ color: 0xaef0e6, emissive: 0x5fd0c0, emissiveIntensity: 0.7, side: THREE.DoubleSide }), 0, 1.02, 0, false);
      g.add(shade);
      g.add(mesh(cyl(0.275, 0.275, 0.03, 16), mat(0xe8d9a8), 0, 0.87, 0, false));
    },
    floor_lamp: g => {
      g.add(mesh(cyl(0.2, 0.22, 0.04, 12), mat(WOOD_D), 0, 0.02, 0));
      g.add(mesh(cyl(0.025, 0.025, 1.45, 6), mat(WOOD_D), 0, 0.74, 0));
      g.add(mesh(geo('shade2', () => new THREE.CylinderGeometry(0.15, 0.28, 0.32, 16, 1, true)),
        new THREE.MeshLambertMaterial({ color: 0xfff1c9, emissive: 0xffcf6a, emissiveIntensity: 0.6, side: THREE.DoubleSide }), 0, 1.55, 0, false));
    },
    bookshelf: g => {
      g.add(mesh(box(1.9, 1.85, 0.45), mat(WOOD_D), 0, 0.93, 0));
      g.add(mesh(new THREE.PlaneGeometry(1.75, 1.7), new THREE.MeshLambertMaterial({ map: TEX.books() }), 0, 0.93, 0.23, false));
    },
    tv: g => {
      g.add(mesh(box(0.95, 0.45, 0.5), mat(WOOD), 0, 0.23, 0));
      g.add(mesh(box(0.8, 0.04, 0.02), mat(WOOD_D), 0, 0.3, 0.26, false));
      g.add(mesh(box(0.12, 0.08, 0.12), mat(0x9aa1ad), 0, 0.49, 0));
      g.add(mesh(box(0.84, 0.56, 0.08), mat(0xbfc4cc), 0, 0.8, 0));
      g.add(mesh(new THREE.PlaneGeometry(0.74, 0.46), new THREE.MeshLambertMaterial({ map: TEX.tvScreen(), emissive: 0xffffff, emissiveMap: TEX.tvScreen(), emissiveIntensity: 0.6 }), 0, 0.8, 0.045, false));
    },
    fridge: g => {
      g.add(mesh(box(0.78, 1.55, 0.7), mat(0x5a4032), 0, 0.78, 0));
      g.add(mesh(box(0.8, 0.02, 0.72), mat(0x3a2820), 0, 1.05, 0, false));
      g.add(mesh(box(0.04, 0.5, 0.05), mat(0xd9dde3), 0.3, 0.7, 0.37, false));
      g.add(mesh(box(0.04, 0.25, 0.05), mat(0xd9dde3), 0.3, 1.25, 0.37, false));
      for (const [x, y, c] of [[-0.2, 1.3, 0xff6f61], [-0.05, 1.35, 0x4fc1c9], [-0.2, 0.9, 0xffd23a]])
        g.add(mesh(box(0.08, 0.08, 0.02), mat(c), x, y, 0.36, false));
      g.add(mesh(box(0.7, 0.3, 0.6), mat(0x3a3a3a), 0, 1.72, 0));
      g.add(mesh(box(0.6, 0.2, 0.02), mat(0x222222), -0.05, 1.72, 0.31, false));
    },
    kitchen: g => {
      g.add(mesh(box(1.9, 0.8, 0.7), mat(TEAL), 0, 0.4, 0));
      g.add(mesh(box(1.95, 0.06, 0.74), mat(0xd9dde3), 0, 0.83, 0));
      g.add(mesh(box(0.55, 0.05, 0.45), mat(0x8a9099), -0.35, 0.85, 0, false));
      g.add(mesh(cyl(0.02, 0.02, 0.3, 6), mat(0xd9dde3), -0.35, 1.0, -0.25));
      g.add(mesh(box(0.6, 0.03, 0.55), mat(0x2a2a2a), 0.55, 0.87, 0, false));
      for (const [x, z] of [[0.4, -0.12], [0.7, -0.12], [0.4, 0.14], [0.7, 0.14]]) g.add(mesh(cyl(0.09, 0.09, 0.01, 12), mat(0x555555), x, 0.89, z, false));
      for (const x of [-0.5, 0.45]) {
        g.add(mesh(box(0.8, 0.02, 0.02), mat(TEAL_D), x, 0.6, 0.36, false));
        g.add(mesh(box(0.2, 0.03, 0.04), mat(0xd9dde3), x, 0.45, 0.37, false));
      }
      g.add(mesh(cyl(0.1, 0.1, 0.02, 14), mat(0xffffff), -0.75, 0.87, 0.1));
      g.add(mesh(cyl(0.08, 0.06, 0.1, 12), mat(0x7fc8c0), -0.7, 0.92, -0.15));
    },
    wardrobe: g => {
      g.add(mesh(box(1.8, 1.9, 0.6), mat(WOOD_D), 0, 0.95, 0));
      for (const x of [-0.44, 0.44]) g.add(mesh(box(0.8, 1.5, 0.03), mat(0x6e4a2e), x, 1.0, 0.31, false));
      for (const x of [-0.08, 0.08]) g.add(mesh(sphere(0.04), mat(0xd9b44a), x, 1.0, 0.34, false));
      g.add(mesh(box(1.9, 0.08, 0.66), mat(0x4a2e1a), 0, 1.92, 0));
    },
    bed: g => {
      g.add(mesh(box(1.9, 0.3, 1.9), mat(WOOD), 0, 0.2, 0));
      g.add(mesh(box(1.8, 0.2, 1.8), mat(0xffffff), 0, 0.45, 0));
      g.add(mesh(box(1.85, 0.08, 1.2), mat(0xf2c14e), 0, 0.57, 0.33));
      g.add(mesh(box(0.6, 0.14, 0.35), mat(0xfff6e0), -0.45, 0.62, -0.6));
      g.add(mesh(box(0.6, 0.14, 0.35), mat(0xfff6e0), 0.45, 0.62, -0.6));
      g.add(mesh(box(1.9, 0.8, 0.1), mat(WOOD_D), 0, 0.5, -0.92));
    },
    birdcage: g => {
      g.add(mesh(cyl(0.2, 0.22, 0.04, 12), mat(0xbfe3df), 0, 0.02, 0));
      g.add(mesh(cyl(0.03, 0.03, 0.9, 6), mat(0xbfe3df), 0, 0.47, 0));
      const wire = new THREE.MeshBasicMaterial({ color: 0x9fd6cf, wireframe: true });
      g.add(mesh(geo('cage', () => new THREE.CylinderGeometry(0.24, 0.24, 0.45, 14, 3, true)), wire, 0, 1.15, 0, false));
      g.add(mesh(geo('cageTop', () => new THREE.SphereGeometry(0.24, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2)), wire, 0, 1.37, 0, false));
      g.add(mesh(cyl(0.25, 0.25, 0.03, 14), mat(0xbfe3df), 0, 0.93, 0));
      const bird = mesh(sphere(0.08), mat(0xffffff), 0, 1.1, 0);
      bird.scale.set(1, 0.9, 1.3);
      g.add(bird);
      g.add(mesh(sphere(0.05), mat(0xffffff), 0, 1.18, 0.07));
      g.add(mesh(sphere(0.015), mat(0xff9a3d), 0, 1.18, 0.12, false));
    },
    plant: g => {
      g.add(mesh(cyl(0.2, 0.15, 0.35, 12), mat(0xd9784a), 0, 0.18, 0));
      g.add(mesh(cyl(0.18, 0.18, 0.02, 12), mat(0x5a3a24), 0, 0.35, 0, false));
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI * 2;
        const l = mesh(sphere(0.16), mat(i % 2 ? 0x3f8f3e : 0x4fa84a), Math.cos(a) * 0.18, 0.62 + (i % 3) * 0.12, Math.sin(a) * 0.18);
        l.scale.set(0.5, 1.2, 0.2);
        l.rotation.set(Math.sin(a) * 0.6, -a, -Math.cos(a) * 0.6);
        g.add(l);
      }
    },
    fan: g => {
      g.add(mesh(cyl(0.18, 0.2, 0.05, 12), mat(0x7fc8c0), 0, 0.03, 0));
      g.add(mesh(cyl(0.025, 0.025, 0.8, 6), mat(0x7fc8c0), 0, 0.43, 0));
      const head = new THREE.Group();
      head.position.set(0, 0.95, 0.03);
      head.add(mesh(geo('fanRing', () => new THREE.TorusGeometry(0.24, 0.015, 6, 20)), mat(0x9fd6cf), 0, 0, 0, false));
      head.add(mesh(sphere(0.06), mat(0x7fc8c0), 0, 0, -0.03));
      const blades = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const b = mesh(sphere(0.1), mat(0xbfe3df), 0, 0.1, 0, false);
        b.scale.set(0.6, 1, 0.1);
        const piv = new THREE.Group(); piv.rotation.z = i * Math.PI * 2 / 3; piv.add(b);
        blades.add(piv);
      }
      head.add(blades);
      g.add(head);
      g.userData.spin = blades;
    },
    rug: g => {
      const r = mesh(new THREE.PlaneGeometry(2.9, 1.9), new THREE.MeshLambertMaterial({ map: TEX.rug() }), 0, 0.012, 0, false);
      r.rotation.x = -Math.PI / 2;
      g.add(r);
    },
  };

  M.furniture = (type) => {
    const g = new THREE.Group();
    FURN[type](g);
    return g;
  };

  // 방 (바닥, 벽, 창문, 시계, 액자)
  M.room = () => {
    const { w, d } = ISLE.ROOM;
    const g = new THREE.Group();
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: TEX.floor() }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(w / 2, 0, d / 2);
    floor.receiveShadow = true;
    floor.name = 'floor';
    g.add(floor);
    const wallMat = new THREE.MeshLambertMaterial({ map: TEX.wallpaper() });
    const H = 3.2;
    const back = new THREE.Mesh(new THREE.PlaneGeometry(w, H), wallMat);
    back.position.set(w / 2, H / 2, 0);
    back.receiveShadow = true;
    g.add(back);
    for (const side of [0, 1]) {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(d, H), wallMat);
      wall.position.set(side ? w : 0, H / 2, d / 2);
      wall.rotation.y = side ? -Math.PI / 2 : Math.PI / 2;
      wall.receiveShadow = true;
      g.add(wall);
      g.add(mesh(box(0.06, 0.18, d), mat(WOOD_D), side ? w - 0.03 : 0.03, 0.09, d / 2, false));
    }
    g.add(mesh(box(w, 0.18, 0.06), mat(WOOD_D), w / 2, 0.09, 0.03, false));
    // 창문
    const winMat = new THREE.MeshBasicMaterial({ map: TEX.window() });
    for (const x of [1.3, 8.9]) {
      g.add(mesh(box(1.3, 1.3, 0.08), mat(0x6e4a2e), x, 2.1, 0.02, false));
      g.add(mesh(new THREE.PlaneGeometry(1.1, 1.1), winMat, x, 2.1, 0.07, false));
      g.add(mesh(box(0.05, 1.1, 0.04), mat(0x6e4a2e), x, 2.1, 0.09, false));
      g.add(mesh(box(1.1, 0.05, 0.04), mat(0x6e4a2e), x, 2.1, 0.09, false));
    }
    // 시계
    const clock = new THREE.Group();
    clock.position.set(5, 2.55, 0.06);
    clock.add(mesh(cyl(0.3, 0.3, 0.05, 24), mat(0x444a52), 0, 0, 0, false));
    clock.children[0].rotation.x = Math.PI / 2;
    const cf = mesh(new THREE.CircleGeometry(0.27, 24), new THREE.MeshBasicMaterial({ map: TEX.clockFace() }), 0, 0, 0.03, false);
    clock.add(cf);
    const hHand = mesh(box(0.025, 0.14, 0.01), mat(0x222222), 0, 0, 0.04, false);
    const mHand = mesh(box(0.018, 0.21, 0.01), mat(0x222222), 0, 0, 0.045, false);
    hHand.geometry = hHand.geometry.clone(); hHand.geometry.translate(0, 0.07, 0);
    mHand.geometry = mHand.geometry.clone(); mHand.geometry.translate(0, 0.1, 0);
    clock.add(hHand, mHand);
    g.add(clock);
    // 액자
    const c = document.createElement('canvas');
    c.width = 128; c.height = 160;
    const x = c.getContext('2d');
    x.fillStyle = '#e9e2d0'; x.fillRect(0, 0, 128, 160);
    x.fillStyle = '#7ab0d8'; x.fillRect(10, 10, 108, 90);
    x.fillStyle = '#5a8f3a'; x.beginPath(); x.moveTo(10, 100); x.lineTo(50, 50); x.lineTo(80, 80); x.lineTo(118, 40); x.lineTo(118, 100); x.fill();
    x.fillStyle = '#fff3a0'; x.beginPath(); x.arc(95, 30, 10, 0, 7); x.fill();
    x.fillStyle = '#6b4f2e'; x.font = '18px Jua, sans-serif'; x.textAlign = 'center'; x.fillText('ISLAND', 64, 135);
    g.add(mesh(box(0.8, 1.0, 0.05), mat(0x8a5a36), 3.3, 2.2, 0.03, false));
    g.add(mesh(new THREE.PlaneGeometry(0.68, 0.86), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(c) }), 3.3, 2.2, 0.06, false));
    // 현관 매트
    const mat2 = mesh(new THREE.PlaneGeometry(1.2, 0.6), mat(0xd9c2a0), w / 2, 0.01, d - 0.35, false);
    mat2.rotation.x = -Math.PI / 2;
    g.add(mat2);
    g.userData = { floor, hHand, mHand };
    return g;
  };

  ISLE.M = M;
})();
