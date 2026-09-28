/* 3D 모델: 캐릭터, 나무, 꽃, 소품, 집, 가구 — 전부 기본 도형을 조합해서 만듦 */
(() => {
  'use strict';
  const ISLE = window.ISLE;
  const TEX = ISLE.TEX;
  const M = {};

  // ---------- 재질 / 도형 캐시 ----------
  const matCache = new Map();
  function mat(color, opts = {}) {
    const k = color + JSON.stringify(opts);
    if (matCache.has(k)) return matCache.get(k);
    const m = new THREE.MeshLambertMaterial(Object.assign({ color }, opts));
    matCache.set(k, m);
    return m;
  }
  const geoCache = new Map();
  function geo(key, make) {
    if (!geoCache.has(key)) geoCache.set(key, make());
    return geoCache.get(key);
  }
  const sphere = r => geo('s' + r, () => new THREE.SphereGeometry(r, 20, 14));
  const box = (w, h, d) => geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
  const cyl = (rt, rb, h, seg = 14) => geo(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg));
  const ico = (r, d = 1) => geo(`i${r},${d}`, () => new THREE.IcosahedronGeometry(r, d));

  function mesh(g, m, x = 0, y = 0, z = 0, shadow = true) {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = shadow;
    o.receiveShadow = true;
    return o;
  }
  M.mat = mat;
  M.mesh = mesh;

  // =========================================================
  // 캐릭터
  // =========================================================
  // look: { species, fur, fur2, shirt, pattern, pants, hair, hat, ear, beak, eyes, mouth, stripe, blush, backpack }
  M.character = (look) => {
    const human = look.species === 'human';
    const skin = human ? 0xffe0c4 : look.fur;
    const skin2 = human ? 0xffe0c4 : (look.fur2 || look.fur);
    const root = new THREE.Group();
    const body = new THREE.Group();
    root.add(body);

    // 다리
    const legMat = mat(human ? (look.pants || 0x5b6b9a) : skin);
    const shoeMat = mat(human ? 0xffffff : (look.species === 'duck' ? 0xff8a2a : skin2));
    const makeLeg = side => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.1, 0.27, 0);
      pivot.add(mesh(cyl(0.075, 0.085, 0.22), legMat, 0, -0.11, 0));
      const shoe = mesh(sphere(0.1), shoeMat, 0, -0.23, 0.03);
      shoe.scale.set(1, 0.55, 1.35);
      pivot.add(shoe);
      body.add(pivot);
      return pivot;
    };
    const legL = makeLeg(-1), legR = makeLeg(1);
    if (human) {
      // 반바지
      const shorts = mesh(cyl(0.22, 0.24, 0.12), mat(look.pants || 0x5b6b9a), 0, 0.28, 0);
      body.add(shorts);
    }

    // 몸통
    let shirtMat;
    if (look.pattern) shirtMat = new THREE.MeshLambertMaterial({ map: TEX.shirt(look.pattern, look.shirt) });
    else shirtMat = new THREE.MeshLambertMaterial({ color: look.shirt });
    const torso = mesh(cyl(0.2, 0.25, 0.36, 18), shirtMat, 0, 0.47, 0);
    body.add(torso);

    // 팔
    const makeArm = side => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.23, 0.6, 0);
      const arm = mesh(cyl(0.06, 0.065, 0.24), shirtMat, side * 0.03, -0.11, 0);
      arm.rotation.z = side * 0.25;
      pivot.add(arm);
      pivot.add(mesh(sphere(0.075), mat(skin2 === skin ? skin : skin2), side * 0.07, -0.25, 0));
      body.add(pivot);
      return pivot;
    };
    const armL = makeArm(-1), armR = makeArm(1);

    // 머리
    const head = new THREE.Group();
    head.position.y = 0.98;
    body.add(head);
    const skull = mesh(sphere(0.36), mat(skin), 0, 0, 0);
    if (!human) skull.scale.set(1.08, 0.98, 1);
    head.add(skull);

    // 얼굴 (머리 앞쪽을 덮는 구면 조각 + 투명 텍스처)
    const faceGeo = geo('face', () => new THREE.SphereGeometry(0.363, 24, 16, Math.PI / 2 - 0.95, 1.9, Math.PI * 0.3, Math.PI * 0.45));
    const faceTex = TEX.face(look, false), blinkTex = TEX.face(look, true);
    const faceMat = new THREE.MeshLambertMaterial({ map: faceTex, transparent: true, depthWrite: false });
    const face = new THREE.Mesh(faceGeo, faceMat);
    if (!human) face.scale.set(1.08, 0.98, 1);
    face.renderOrder = 2;
    head.add(face);

    const s = look.species;
    if (human) {
      const hairMat = mat(look.hair);
      const cap = mesh(geo('hair', () => new THREE.SphereGeometry(0.378, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55)), hairMat);
      cap.rotation.x = -0.5;
      head.add(cap);
      // 앞머리
      for (const [x, y, r] of [[-0.14, 0.2, 0.13], [0.02, 0.23, 0.14], [0.16, 0.19, 0.12]]) {
        const b = mesh(sphere(r), hairMat, x, y, 0.25);
        b.scale.set(1, 0.7, 0.6);
        head.add(b);
      }
      // 머리 위 잎사귀
      const leaf = mesh(sphere(0.07), mat(0x7cc864), 0.05, 0.42, 0);
      leaf.scale.set(0.8, 1.6, 0.4); leaf.rotation.z = -0.5;
      head.add(leaf);
      if (look.hat) {
        const hat = new THREE.Group();
        hat.add(mesh(cyl(0.3, 0.37, 0.22, 20), mat(look.hat), 0, 0.12, 0));
        hat.add(mesh(cyl(0.44, 0.44, 0.03, 24), mat(look.hat), 0, 0.01, 0.02));
        hat.add(mesh(cyl(0.372, 0.372, 0.05, 20), mat(0xffffff), 0, 0.05, 0));
        hat.position.set(0, 0.26, -0.04);
        hat.rotation.x = -0.22;
        head.add(hat);
        leaf.visible = false;
      }
      if (look.backpack !== false) {
        const bp = mesh(box(0.3, 0.3, 0.14), mat(0xe8433b), 0, 0.5, -0.27);
        body.add(bp);
        body.add(mesh(box(0.22, 0.1, 0.06), mat(0xc9302a), 0, 0.42, -0.35));
      }
    } else if (s === 'cat') {
      for (const side of [-1, 1]) {
        const ear = mesh(geo('catEar', () => new THREE.ConeGeometry(0.13, 0.28, 4)), mat(look.fur), side * 0.22, 0.32, 0);
        ear.rotation.set(0, Math.PI / 4, -side * 0.35);
        head.add(ear);
        const inner = mesh(geo('catEarIn', () => new THREE.ConeGeometry(0.07, 0.18, 4)), mat(look.ear || 0xffa0b4), side * 0.215, 0.3, 0.05);
        inner.rotation.set(0, Math.PI / 4, -side * 0.35);
        head.add(inner);
      }
      const muzzle = mesh(sphere(0.1), mat(look.fur2), 0, -0.1, 0.3);
      muzzle.scale.set(1.3, 0.75, 0.7);
      head.add(muzzle);
      head.add(mesh(sphere(0.035), mat(0xff8fa3), 0, -0.05, 0.37));
    } else if (s === 'bear') {
      for (const side of [-1, 1]) {
        const ear = mesh(sphere(0.12), mat(look.fur), side * 0.26, 0.26, -0.02);
        ear.scale.set(1, 1, 0.55);
        head.add(ear);
        const inner = mesh(sphere(0.065), mat(look.ear || 0x8a5a33), side * 0.26, 0.26, 0.04);
        inner.scale.set(1, 1, 0.4);
        head.add(inner);
      }
      const muzzle = mesh(sphere(0.15), mat(look.fur2), 0, -0.1, 0.27);
      muzzle.scale.set(1.2, 0.8, 0.75);
      head.add(muzzle);
      head.add(mesh(sphere(0.05), mat(0x3a2520), 0, -0.05, 0.38));
    } else if (s === 'duck') {
      const bill = mesh(sphere(0.16), mat(look.beak), 0, -0.1, 0.3);
      bill.scale.set(1.25, 0.38, 1.1);
      head.add(bill);
      if (look.hat) {
        const hat = new THREE.Group();
        hat.add(mesh(cyl(0.32, 0.38, 0.2, 20), mat(look.hat), 0, 0.1, 0));
        hat.add(mesh(cyl(0.5, 0.5, 0.03, 24), mat(look.hat), 0, 0.0, 0));
        for (let i = 0; i < 6; i++) {
          const a = i / 6 * Math.PI * 2;
          hat.add(mesh(sphere(0.04), mat(0xd9c25a), Math.cos(a) * 0.33, 0.1, Math.sin(a) * 0.33, false));
        }
        hat.position.set(0, 0.25, 0);
        hat.rotation.x = -0.1;
        head.add(hat);
      }
    } else if (s === 'hamster') {
      for (const side of [-1, 1]) {
        const ear = mesh(sphere(0.11), mat(look.fur), side * 0.24, 0.3, -0.02);
        ear.scale.set(1, 1, 0.5);
        head.add(ear);
        const inner = mesh(sphere(0.07), mat(look.ear), side * 0.24, 0.3, 0.03);
        inner.scale.set(1, 1, 0.4);
        head.add(inner);
        const cheek = mesh(sphere(0.12), mat(look.fur2), side * 0.25, -0.12, 0.17);
        head.add(cheek);
      }
    } else if (s === 'dog') {
      for (const side of [-1, 1]) {
        const ear = mesh(sphere(0.13), mat(look.ear), side * 0.35, 0.02, -0.02);
        ear.scale.set(0.55, 1.35, 0.9);
        ear.rotation.z = side * 0.3;
        head.add(ear);
      }
      const muzzle = mesh(sphere(0.12), mat(look.fur2), 0, -0.12, 0.28);
      muzzle.scale.set(1.2, 0.8, 0.8);
      head.add(muzzle);
      head.add(mesh(sphere(0.055), mat(0x3a2a40), 0, -0.07, 0.38));
    }

    // 꼬리
    if (!human) {
      if (s === 'cat') {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.35, -0.22), new THREE.Vector3(0, 0.3, -0.4),
          new THREE.Vector3(0.05, 0.5, -0.5), new THREE.Vector3(0.1, 0.65, -0.42),
        ]);
        body.add(mesh(new THREE.TubeGeometry(curve, 12, 0.04, 8), mat(look.stripe || look.fur)));
      } else {
        const tail = mesh(sphere(0.09), mat(look.fur2 || look.fur), 0, 0.32, -0.26);
        if (s === 'duck') tail.scale.set(1.2, 0.5, 1);
        body.add(tail);
      }
    }

    root.traverse(o => { if (o.isMesh && o !== face) o.castShadow = true; });

    return {
      root, body, head, legL, legR, armL, armR, face, faceTex, blinkTex,
      phase: 0, blinkT: 2 + Math.random() * 3, actionT: 0, idleT: Math.random() * 10,
    };
  };

  // 걷기/대기/행동 애니메이션
  M.animate = (c, dt, moveAmount) => {
    c.idleT += dt;
    const m = Math.min(1, moveAmount);
    if (m > 0.01) c.phase += dt * (6 + m * 7);
    const sw = Math.sin(c.phase) * m;
    c.legL.rotation.x = sw * 0.75;
    c.legR.rotation.x = -sw * 0.75;
    c.armL.rotation.x = -sw * 0.7;
    c.armR.rotation.x = sw * 0.7;
    c.body.position.y = Math.abs(Math.sin(c.phase)) * 0.06 * m;
    c.body.rotation.z = Math.sin(c.phase) * 0.04 * m;
    c.head.rotation.z = m < 0.05 ? Math.sin(c.idleT * 1.3) * 0.05 : 0;
    c.body.scale.y = 1 + Math.sin(c.idleT * 2.4) * 0.012 * (1 - m);

    if (c.actionT > 0) {
      c.actionT -= dt;
      const k = Math.sin(Math.min(1, c.actionT / 0.5) * Math.PI);
      c.armL.rotation.x = -2.3 * k;
      c.armR.rotation.x = -2.3 * k;
    }
    if (c.talkT > 0) {
      c.talkT -= dt;
      c.head.rotation.x = Math.sin(c.talkT * 14) * 0.08;
      c.armR.rotation.z = Math.sin(c.talkT * 8) * 0.3 + 0.3;
    } else {
      c.head.rotation.x = 0; c.armR.rotation.z = 0;
    }
    // 눈 깜빡임
    c.blinkT -= dt;
    if (c.blinkT < 0) {
      c.face.material.map = c.blinkTex;
      if (c.blinkT < -0.13) { c.face.material.map = c.faceTex; c.blinkT = 2.5 + Math.random() * 3.5; }
    }
  };

  // =========================================================
  // 자연물
  // =========================================================
  const LEAF = [0x3f9a45, 0x4fb04f, 0x62c25c];
  M.tree = (fruitType) => {
    const g = new THREE.Group();
    const trunk = mesh(cyl(0.13, 0.22, 1.1, 9), mat(0x9b6a3f), 0, 0.55, 0);
    g.add(trunk);
    const canopy = new THREE.Group();
    canopy.position.y = 1.55;
    const blobs = [[0, 0.15, 0, 0.82, 1], [-0.5, -0.12, 0.05, 0.6, 0], [0.5, -0.08, -0.05, 0.62, 2],
      [0.05, -0.2, 0.45, 0.62, 2], [0.1, 0.55, -0.05, 0.55, 2], [-0.1, -0.12, -0.48, 0.62, 0]];
    for (const [x, y, z, r, c] of blobs) {
      const b = mesh(ico(1, 1), mat(LEAF[c], { flatShading: true }), x, y, z);
      b.scale.setScalar(r);
      canopy.add(b);
    }
    g.add(canopy);
    const fruits = [];
    for (const [x, y, z] of [[-0.42, -0.1, 0.55], [0.4, 0.0, 0.58], [0.0, 0.35, 0.72]]) {
      const f = M.fruit(fruitType, 1.15);
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
    if (type === 'cherry') {
      g.add(mesh(sphere(0.08), mat(col), -0.06, 0, 0));
      g.add(mesh(sphere(0.08), mat(col), 0.06, -0.02, 0.02));
    } else {
      const f = mesh(sphere(0.13), mat(col), 0, 0, 0);
      if (type === 'pear') f.scale.set(0.9, 1.15, 0.9);
      g.add(f);
      const leaf = mesh(sphere(0.05), mat(0x4f9e3f), 0.04, 0.13, 0);
      leaf.scale.set(1.4, 0.5, 0.8);
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
      const h = 0.28 + i * 0.05;
      const stem = mesh(cyl(0.015, 0.02, h, 5), mat(0x4f9e3f), x, h / 2, z, false);
      g.add(stem);
      const leaf = mesh(sphere(0.06), mat(0x6cc15a), x + 0.05, 0.08, z);
      leaf.scale.set(1.3, 0.35, 0.6);
      g.add(leaf);
      let head;
      if (itemId === 'tulip') {
        head = mesh(sphere(0.08), mat(col), x, h + 0.04, z);
        head.scale.set(0.9, 1.25, 0.9);
      } else {
        head = new THREE.Group();
        head.position.set(x, h + 0.02, z);
        const petals = mesh(ico(0.12, 1), mat(col, { flatShading: true }));
        petals.scale.set(1, itemId === 'mum' ? 0.75 : 0.45, 1);
        head.add(petals);
        head.add(mesh(sphere(0.045), mat(itemId === 'mum' ? 0xd98a1a : 0xfff0a0), 0, 0.05, 0, false));
      }
      head.castShadow = true;
      g.add(head);
    });
    return g;
  };

  M.weed = () => {
    const g = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      const b = mesh(geo('weedBlade', () => new THREE.ConeGeometry(0.05, 0.32, 4)), mat(0x4c9a3c), Math.cos(a) * 0.08, 0.14, Math.sin(a) * 0.08, false);
      b.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
      g.add(b);
    }
    return g;
  };

  M.rock = () => {
    const g = new THREE.Group();
    const r = mesh(geo('rock', () => new THREE.DodecahedronGeometry(0.42, 0)), mat(0x9aa1ad, { flatShading: true }), 0, 0.3, 0);
    r.scale.set(1.1, 0.85, 1);
    g.add(r);
    const r2 = mesh(geo('rock2', () => new THREE.DodecahedronGeometry(0.2, 0)), mat(0xb8bfca, { flatShading: true }), 0.3, 0.12, 0.25);
    g.add(r2);
    return g;
  };

  M.bush = () => {
    const g = new THREE.Group();
    for (const [x, y, z, r] of [[0, 0.3, 0, 0.42], [-0.3, 0.22, 0.1, 0.3], [0.3, 0.2, 0.05, 0.32]]) {
      const b = mesh(ico(1, 1), mat(0x3f8f3e, { flatShading: true }), x, y, z);
      b.scale.setScalar(r);
      g.add(b);
    }
    return g;
  };

  M.sapling = () => {
    const g = new THREE.Group();
    const dirt = mesh(cyl(0.22, 0.26, 0.05, 12), mat(0xa47b4f), 0, 0.02, 0, false);
    g.add(dirt);
    g.add(mesh(cyl(0.02, 0.03, 0.35, 6), mat(0x6a9c3a), 0, 0.18, 0));
    for (const side of [-1, 1]) {
      const l = mesh(sphere(0.08), mat(0x7ccf5c), side * 0.08, 0.34, 0);
      l.scale.set(1.4, 0.4, 0.7);
      l.rotation.z = side * 0.4;
      g.add(l);
    }
    return g;
  };

  M.item = (id) => {
    const it = ISLE.ITEMS[id];
    if (it.kind === 'fruit') { const f = M.fruit(id, 1.3); f.position.y = 0.16; return f; }
    if (it.kind === 'flower') { const f = M.flower(id); f.scale.setScalar(0.7); return f; }
    const g = new THREE.Group();
    if (id === 'shell') {
      const s = mesh(sphere(0.14), mat(0xffd6d0), 0, 0.05, 0);
      s.scale.set(1, 0.4, 0.85);
      g.add(s);
      for (let i = -2; i <= 2; i++) {
        const rib = mesh(box(0.02, 0.02, 0.2), mat(0xf2a8a0), i * 0.045, 0.1, 0, false);
        rib.rotation.y = i * 0.25;
        g.add(rib);
      }
    } else if (id === 'stone') {
      g.add(mesh(geo('stone', () => new THREE.DodecahedronGeometry(0.14, 0)), mat(0x9aa1ad, { flatShading: true }), 0, 0.1, 0));
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
    const walls = mesh(box(W, H, D), mat(0xfff4dc), 0, H / 2, 0);
    g.add(walls);
    // 지붕 (삼각기둥)
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2 - 0.3, 0); shape.lineTo(0, 1.25); shape.lineTo(W / 2 + 0.3, 0); shape.closePath();
    const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: D + 0.5, bevelEnabled: false });
    roofGeo.translate(0, 0, -(D + 0.5) / 2);
    const roof = mesh(roofGeo, mat(0xec7a62), 0, H, 0);
    g.add(roof);
    g.add(mesh(box(W + 0.7, 0.14, D + 0.56), mat(0xd65f49), 0, H + 0.02, 0));
    g.add(mesh(box(0.35, 0.8, 0.35), mat(0xc96b56), 0.9, H + 0.8, -0.3));
    // 문
    const door = mesh(box(0.7, 1.1, 0.08), mat(0xb98553), 0, 0.55, D / 2 + 0.02);
    g.add(door);
    g.add(mesh(sphere(0.05), mat(0xffd84a), 0.22, 0.55, D / 2 + 0.08, false));
    g.add(mesh(box(1.1, 0.1, 0.5), mat(0xd9c2a0), 0, 0.05, D / 2 + 0.25));
    // 창문
    const winMat = new THREE.MeshLambertMaterial({ color: 0xbfe8ff, emissive: 0x000000 });
    for (const x of [-1.1, 1.1]) {
      g.add(mesh(box(0.72, 0.62, 0.06), mat(0xb98553), x, 1.05, D / 2 + 0.01));
      g.add(mesh(box(0.6, 0.5, 0.08), winMat, x, 1.05, D / 2 + 0.02, false));
      g.add(mesh(box(0.04, 0.5, 0.1), mat(0xb98553), x, 1.05, D / 2 + 0.03, false));
    }
    // 문패
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const nameTex = new THREE.CanvasTexture(c);
    const plate = mesh(new THREE.PlaneGeometry(0.9, 0.24), new THREE.MeshLambertMaterial({ map: nameTex }), 0, 1.5, D / 2 + 0.02, false);
    g.add(plate);
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
    g.add(mesh(box(0.8, 0.55, 0.7), mat(0xc98f55), 0, 0.28, 0));
    g.add(mesh(box(0.86, 0.08, 0.76), mat(0x8c5d33), 0, 0.58, 0));
    for (const y of [0.15, 0.35]) g.add(mesh(box(0.82, 0.04, 0.72), mat(0xa8713c), 0, y, 0, false));
    g.add(mesh(cyl(0.03, 0.03, 0.6, 6), mat(0x8c5d33), 0, 0.9, -0.2));
    const c = document.createElement('canvas');
    c.width = 128; c.height = 64;
    const x = c.getContext('2d');
    x.fillStyle = '#fffaf0'; x.fillRect(0, 0, 128, 64);
    x.fillStyle = '#b7862a'; x.font = '30px Jua, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('💰 판매', 64, 34);
    g.add(mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(c) }), 0, 1.15, -0.18, false));
    return g;
  };

  M.lamp = () => {
    const g = new THREE.Group();
    g.add(mesh(cyl(0.05, 0.07, 1.8, 8), mat(0x4a4a52), 0, 0.9, 0));
    g.add(mesh(cyl(0.15, 0.18, 0.1, 10), mat(0x4a4a52), 0, 0.05, 0));
    const bulbMat = new THREE.MeshLambertMaterial({ color: 0xfff6d0, emissive: 0x000000 });
    g.add(mesh(sphere(0.17), bulbMat, 0, 1.92, 0));
    g.add(mesh(cyl(0.2, 0.12, 0.08, 10), mat(0x4a4a52), 0, 2.1, 0));
    g.userData = { bulbMat };
    return g;
  };

  M.signpost = () => {
    const g = new THREE.Group();
    g.add(mesh(cyl(0.05, 0.05, 1.2, 6), mat(0x8c5d33), 0, 0.6, 0));
    const c = document.createElement('canvas');
    c.width = 128; c.height = 64;
    const x = c.getContext('2d');
    x.fillStyle = '#6fa8dc'; x.fillRect(0, 0, 128, 64);
    x.fillStyle = '#fff'; x.beginPath(); x.moveTo(14, 32); x.lineTo(44, 10); x.lineTo(44, 22); x.lineTo(112, 22); x.lineTo(112, 42); x.lineTo(44, 42); x.lineTo(44, 54); x.closePath(); x.fill();
    g.add(mesh(box(0.7, 0.36, 0.06), mat(0x8c5d33), 0, 1.05, 0));
    g.add(mesh(new THREE.PlaneGeometry(0.62, 0.3), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(c) }), 0, 1.05, 0.035, false));
    return g;
  };

  M.bridge = () => {
    const g = new THREE.Group();
    const wood = mat(0xb98553), dark = mat(0x8c5d33);
    for (let i = 0; i < 7; i++) g.add(mesh(box(0.42, 0.1, 1.2), i % 2 ? wood : mat(0xc49262), -1.3 + i * 0.43, 0.05, 0));
    for (const z of [-0.58, 0.58]) {
      g.add(mesh(box(3.1, 0.08, 0.08), dark, 0, 0.45, z));
      for (const x of [-1.5, 0, 1.5]) g.add(mesh(cyl(0.07, 0.07, 0.6, 8), dark, x, 0.25, z));
    }
    g.add(mesh(box(3.0, 0.14, 0.14), dark, 0, -0.08, 0));
    return g;
  };

  // =========================================================
  // 가구 (앞면 = +z, 원점 = 차지하는 칸의 중심, 바닥 y=0)
  // =========================================================
  const WOOD = 0x8a5a36, WOOD_D = 0x5c3a22, TEAL = 0x8fd3cc, TEAL_D = 0x5fb3ac;
  function legs(g, w, d, h, color = WOOD_D, r = 0.035) {
    for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]])
      g.add(mesh(cyl(r, r * 0.7, h, 6), mat(color), x, h / 2, z));
  }
  function sofa(g, width, fabric) {
    const f = fabric;
    g.add(mesh(box(width, 0.26, 0.78), f, 0, 0.28, 0.02));
    g.add(mesh(box(width, 0.55, 0.22), f, 0, 0.55, -0.3));
    for (const s of [-1, 1]) g.add(mesh(box(0.2, 0.42, 0.8), f, s * (width / 2 - 0.1), 0.38, 0.01));
    const n = Math.round(width);
    for (let i = 0; i < n; i++) {
      const cw = (width - 0.4) / n;
      g.add(mesh(box(cw - 0.04, 0.1, 0.62), f, -width / 2 + 0.2 + cw * (i + 0.5), 0.45, 0.06));
    }
    legs(g, width - 0.15, 0.6, 0.15);
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
      g.add(mesh(cyl(0.38, 0.38, 0.05, 20), mat(WOOD), 0, 0.55, 0));
      g.add(mesh(cyl(0.3, 0.3, 0.01, 20), mat(0xffffff), 0, 0.58, 0, false));
      g.add(mesh(cyl(0.05, 0.08, 0.52, 8), mat(WOOD_D), 0, 0.27, 0));
      g.add(mesh(cyl(0.2, 0.22, 0.04, 12), mat(WOOD_D), 0, 0.02, 0));
      g.add(mesh(cyl(0.02, 0.06, 0.35, 8), mat(0x7a4a2a), 0, 0.76, 0));
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
