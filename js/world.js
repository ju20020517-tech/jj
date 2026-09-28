/* 섬 지형: 생성(시드 기반), 3D 메시 만들기, 높이/충돌 계산 */
(() => {
  'use strict';
  const ISLE = window.ISLE;
  const { W, H, HOUSE, SHOP } = ISLE;
  const TILE = { GRASS: 0, WATER: 1, SAND: 2, PATH: 3, BRIDGE: 4, RAMP: 5 };
  ISLE.TILE = TILE;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  ISLE.mulberry32 = mulberry32;

  const world = {
    tiles: null,     // 타일 종류
    level: null,     // 높이 단계 (0 = 아래, 1 = 언덕 위)
    river: [],       // z 별 강 x 위치
    bridges: [],     // {x, z, level}
    ramps: [],       // {x, z}  (x, x+1 두 칸, z 가 아래쪽 칸, 위로 올라감)
    waterfall: null, // {x, z}
  };
  ISLE.world = world;

  const idx = (x, z) => z * W + x;
  const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < H;
  world.tileAt = (x, z) => inside(x, z) ? world.tiles[idx(x, z)] : TILE.WATER;
  world.levelAt = (x, z) => inside(x, z) ? world.level[idx(x, z)] : 0;

  // ---------------------------------------------------------
  // 생성
  // ---------------------------------------------------------
  world.generate = (seed) => {
    const r = mulberry32(seed);
    const phase = r() * 10;
    const tiles = new Uint8Array(W * H);
    const level = new Uint8Array(W * H);
    world.river = []; world.bridges = []; world.ramps = [];

    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
      const e = Math.min(x, W - 1 - x, z, (H - 1 - z) * 0.7)
        + Math.sin(x * 0.5 + phase) * 0.7 + Math.cos(z * 0.45 + phase * 1.3) * 0.7;
      tiles[idx(x, z)] = e < 2.2 ? TILE.WATER : e < 4.2 ? TILE.SAND : TILE.GRASS;
    }
    // 언덕 (북쪽)
    const edge = x => 10 + Math.round(Math.sin(x * 0.3 + phase) * 1.2);
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
      if (tiles[idx(x, z)] !== TILE.GRASS) continue;
      const e = Math.min(x, W - 1 - x, z);
      if (z <= edge(x) && e > 5) level[idx(x, z)] = 1;
    }
    // 강 (북 → 남, 언덕에서 폭포로 떨어짐)
    for (let z = 0; z < H; z++) {
      const cx = Math.floor(W * 0.35 + Math.sin(z * 0.25 + phase) * 2);
      world.river[z] = cx;
      for (const x of [cx, cx + 1]) tiles[idx(x, z)] = TILE.WATER;
      // 강물 높이는 양쪽 땅 중 높은 쪽을 따름
      const lv = Math.max(level[idx(cx - 1, z)], level[idx(cx + 2, z)]);
      level[idx(cx, z)] = level[idx(cx + 1, z)] = lv;
    }
    for (let z = 0; z < H - 1; z++) {
      const x = world.river[z];
      if (level[idx(x, z)] === 1 && level[idx(world.river[z + 1], z + 1)] === 0) {
        world.waterfall = { x, z: z + 1 };
        break;
      }
    }
    // 다리
    const addBridge = z => {
      const x = world.river[z];
      tiles[idx(x, z)] = tiles[idx(x + 1, z)] = TILE.BRIDGE;
      world.bridges.push({ x, z, level: level[idx(x, z)] });
      // 다리 양쪽 끝은 걸을 수 있는 땅으로
      for (const bx of [x - 1, x + 2]) if (tiles[idx(bx, z)] === TILE.WATER) tiles[idx(bx, z)] = TILE.SAND;
    };
    addBridge(20);
    addBridge(5);
    // 비탈길 (언덕 가장자리 바로 아래 칸)
    for (const rx of [8, 30]) {
      let top = -1;
      for (let z = 0; z < H; z++) if (level[idx(rx, z)] === 1 && level[idx(rx + 1, z)] === 1) top = z;
      if (top < 0) continue;
      const z = top + 1;
      for (const x of [rx, rx + 1]) { tiles[idx(x, z)] = TILE.RAMP; level[idx(x, z)] = 0; }
      // 비탈길 앞은 평지로
      for (const x of [rx, rx + 1]) if (tiles[idx(x, z + 1)] !== TILE.GRASS) tiles[idx(x, z + 1)] = TILE.GRASS;
      world.ramps.push({ x: rx, z });
    }
    // 집 앞 광장 & 길
    for (let z = HOUSE.z + HOUSE.d; z <= HOUSE.z + HOUSE.d + 1; z++)
      for (let x = HOUSE.x - 1; x <= HOUSE.x + HOUSE.w + 2; x++) tiles[idx(x, z)] = TILE.PATH;
    for (let z = HOUSE.z + HOUSE.d + 2; z <= HOUSE.z + HOUSE.d + 5; z++)
      for (const x of [HOUSE.x + 1, HOUSE.x + 2]) tiles[idx(x, z)] = TILE.PATH;

    world.tiles = tiles;
    world.level = level;
  };

  // ---------------------------------------------------------
  // 구조물 / 예약 구역
  // ---------------------------------------------------------
  world.isHouse = (x, z) => x >= HOUSE.x && x < HOUSE.x + HOUSE.w && z >= HOUSE.z && z < HOUSE.z + HOUSE.d;
  world.isShop = (x, z) => x === SHOP.x && z === SHOP.z;
  world.isLamp = (x, z) => ISLE.LAMPS.some(l => l.x === x && l.z === z);
  world.isDoor = (x, z) => z === HOUSE.z + HOUSE.d - 1 && (x === HOUSE.x + 1 || x === HOUSE.x + 2);
  world.isReserved = (x, z) => {
    if (x >= HOUSE.x - 1 && x <= HOUSE.x + HOUSE.w + 2 && z >= HOUSE.z - 1 && z <= HOUSE.z + HOUSE.d + 5) return true;
    if (Math.abs(x - SHOP.x) <= 1 && Math.abs(z - SHOP.z) <= 1) return true;
    for (const b of world.bridges) if (Math.abs(z - b.z) <= 1 && x >= b.x - 3 && x <= b.x + 4) return true;
    for (const r of world.ramps) if (x >= r.x - 1 && x <= r.x + 2 && z >= r.z - 2 && z <= r.z + 2) return true;
    for (const v of ISLE.VILLAGERS) if (Math.abs(x - v.home.x) <= 1 && Math.abs(z - v.home.z) <= 1) return true;
    if (world.waterfall && Math.abs(z - world.waterfall.z) <= 1 && Math.abs(x - world.waterfall.x) <= 3) return true;
    return false;
  };

  // 걸을 수 있는 바닥 높이 (연속값). 물이면 null
  world.heightAt = (fx, fz) => {
    const x = Math.floor(fx), z = Math.floor(fz);
    const t = world.tileAt(x, z);
    if (t === TILE.WATER) return null;
    const lv = world.levelAt(x, z);
    if (t === TILE.RAMP) return clamp01(z + 1 - fz) * 1;
    if (t === TILE.SAND) return lv - 0.06;
    if (t === TILE.BRIDGE) return lv + 0.08;
    return lv;
  };
  const clamp01 = v => Math.max(0, Math.min(1, v));

  // ---------------------------------------------------------
  // 3D 메시 만들기
  // ---------------------------------------------------------
  world.build = (scene) => {
    const TEX = ISLE.TEX;
    const group = new THREE.Group();
    const dummy = new THREE.Object3D();
    const BOTTOM = -1.4;

    // 타일 종류별 윗면 높이
    const topOf = (x, z) => {
      const t = world.tileAt(x, z), lv = world.levelAt(x, z);
      if (t === TILE.WATER || t === TILE.BRIDGE) return lv - 0.75;
      if (t === TILE.SAND) return lv - 0.06;
      if (t === TILE.RAMP) return 0;
      return lv;
    };

    const counts = { col: 0, grass: 0, sand: 0, path: 0 };
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
      counts.col++;
      const t = world.tileAt(x, z);
      if (t === TILE.GRASS || t === TILE.RAMP) counts.grass++;
      else if (t === TILE.SAND || t === TILE.WATER || t === TILE.BRIDGE) counts.sand++;
      else if (t === TILE.PATH) counts.path++;
    }

    const colMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ map: TEX.cliff() }), counts.col);
    const capGeo = new THREE.BoxGeometry(1, 0.08, 1);
    const grassMesh = new THREE.InstancedMesh(capGeo, new THREE.MeshLambertMaterial({ map: TEX.grass() }), counts.grass);
    const sandMesh = new THREE.InstancedMesh(capGeo, new THREE.MeshLambertMaterial({ map: TEX.sand() }), counts.sand);
    const pathMesh = new THREE.InstancedMesh(capGeo, new THREE.MeshLambertMaterial({ map: TEX.path() }), counts.path);
    const c = { col: 0, grass: 0, sand: 0, path: 0 };
    const color = new THREE.Color();

    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
      const t = world.tileAt(x, z);
      const top = topOf(x, z);
      const colTop = top - 0.08;
      dummy.rotation.set(0, 0, 0);
      dummy.position.set(x + 0.5, (colTop + BOTTOM) / 2, z + 0.5);
      dummy.scale.set(1, colTop - BOTTOM, 1);
      dummy.updateMatrix();
      colMesh.setMatrixAt(c.col++, dummy.matrix);

      dummy.position.set(x + 0.5, top - 0.04, z + 0.5);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      if (t === TILE.GRASS || t === TILE.RAMP) {
        grassMesh.setMatrixAt(c.grass, dummy.matrix);
        const v = 0.94 + ((x * 7 + z * 13) % 5) * 0.025 + world.levelAt(x, z) * 0.04;
        grassMesh.setColorAt(c.grass++, color.setRGB(v, v, v * 0.97));
      } else if (t === TILE.PATH) {
        pathMesh.setMatrixAt(c.path++, dummy.matrix);
      } else {
        sandMesh.setMatrixAt(c.sand, dummy.matrix);
        const v = t === TILE.WATER ? 0.85 : 1;
        sandMesh.setColorAt(c.sand++, color.setRGB(v, v, v));
      }
    }
    for (const m of [colMesh, grassMesh, sandMesh, pathMesh]) {
      m.receiveShadow = true;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      group.add(m);
    }

    // 비탈길 (쐐기 모양)
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.lineTo(1, 0); shape.lineTo(0, 1); shape.closePath();
    const rampGeo = new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: false });
    rampGeo.rotateY(-Math.PI / 2);
    for (const r of world.ramps) {
      const m = new THREE.Mesh(rampGeo, new THREE.MeshLambertMaterial({ color: 0xd8b886 }));
      m.position.set(r.x + 2, 0, r.z);
      m.receiveShadow = true;
      group.add(m);
      // 계단 줄무늬
      for (let i = 1; i < 5; i++) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(2, 0.03, 0.05), new THREE.MeshLambertMaterial({ color: 0xb8956a }));
        s.position.set(r.x + 1, 1 - i / 5 + 0.01, r.z + i / 5);
        group.add(s);
      }
    }

    // 바다 (큰 평면)
    const seaTex = TEX.sea();
    seaTex.repeat.set(40, 40);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshLambertMaterial({ map: seaTex, transparent: true, opacity: 0.86 }));
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(W / 2, -0.3, H / 2);
    sea.receiveShadow = true;
    group.add(sea);

    // 언덕 위 강물 (흐르는 텍스처)
    const riverTex = TEX.river();
    const riverMat = new THREE.MeshLambertMaterial({ map: riverTex, transparent: true, opacity: 0.9 });
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
      if ((world.tileAt(x, z) === TILE.WATER || world.tileAt(x, z) === TILE.BRIDGE) && world.levelAt(x, z) === 1) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), riverMat);
        p.rotation.x = -Math.PI / 2;
        p.position.set(x + 0.5, 0.7, z + 0.5);
        group.add(p);
      }
    }
    // 아래쪽 강물 흐름 표시
    const riverLow = new THREE.MeshLambertMaterial({ map: riverTex, transparent: true, opacity: 0.35, depthWrite: false });
    for (let z = 0; z < H; z++) {
      const x = world.river[z];
      if (world.levelAt(x, z) === 0 && world.tileAt(x, z) === TILE.WATER) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), riverLow);
        p.rotation.x = -Math.PI / 2;
        p.position.set(x + 1, -0.29, z + 0.5);
        group.add(p);
      }
    }

    // 폭포
    let fallTex = null, foam = [];
    if (world.waterfall) {
      const { x, z } = world.waterfall;
      fallTex = TEX.waterfall();
      const fall = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.02), new THREE.MeshLambertMaterial({ map: fallTex, transparent: true, opacity: 0.95 }));
      fall.position.set(x + 1, 0.2, z + 0.02);
      group.add(fall);
      const foamMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
      for (let i = 0; i < 7; i++) {
        const f = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), foamMat);
        f.position.set(x + 0.2 + i * 0.27, -0.28, z + 0.15);
        f.userData.ph = i * 1.3;
        group.add(f);
        foam.push(f);
      }
    }

    // 다리
    for (const b of world.bridges) {
      const br = ISLE.M.bridge();
      br.position.set(b.x + 1, b.level + 0.0, b.z + 0.5);
      group.add(br);
    }

    scene.add(group);
    world.group = group;

    // 매 프레임 물 애니메이션
    world.animate = (t) => {
      seaTex.offset.set(Math.sin(t * 0.00015) * 0.3, t * 0.00002);
      riverTex.offset.y = -t * 0.0006;
      if (fallTex) fallTex.offset.y = t * 0.0012;
      for (const f of foam) {
        const s = 0.8 + Math.sin(t * 0.006 + f.userData.ph) * 0.25;
        f.scale.setScalar(s);
      }
    };
  };

  // ---------------------------------------------------------
  // 오브젝트 초기 배치
  // ---------------------------------------------------------
  world.populate = (s, newId) => {
    const r = mulberry32(s.seed ^ 0x5eed);
    const occupied = new Set();
    const key = (x, z) => x + ',' + z;
    const free = (x, z, type = TILE.GRASS) =>
      world.tileAt(x, z) === type && !world.isReserved(x, z) && !occupied.has(key(x, z)) &&
      !(world.tileAt(x, z + 1) === TILE.RAMP);
    const add = o => { o.id = newId(); s.objects.push(o); occupied.add(key(o.x, o.z)); };
    const rand = n => (r() * n) | 0;

    let tries = 0, trees = 0;
    while (trees < 34 && tries++ < 4000) {
      const x = rand(W), z = rand(H);
      if (!free(x, z)) continue;
      let near = false;
      for (let dz = -1; dz <= 1 && !near; dz++)
        for (let dx = -1; dx <= 1; dx++) if (occupied.has(key(x + dx, z + dz))) { near = true; break; }
      if (near) continue;
      add({ type: 'tree', x, z, fruit: r() < 0.75 ? 3 : 0, fruitType: s.native, regrowAt: 0 });
      trees++;
    }
    for (let c = 0; c < 10; c++) {
      const cx = rand(W), cz = rand(H), f = ISLE.FLOWERS[rand(ISLE.FLOWERS.length)];
      for (let i = 0; i < 4; i++) {
        const x = cx + rand(3) - 1, z = cz + rand(3) - 1;
        if (free(x, z)) add({ type: 'flower', x, z, item: f });
      }
    }
    const scatter = (n, make, tile) => {
      let t = 0, c = 0;
      while (c < n && t++ < 3000) {
        const x = rand(W), z = rand(H);
        if (free(x, z, tile)) { add(make(x, z)); c++; }
      }
    };
    scatter(8, (x, z) => ({ type: 'bush', x, z }), TILE.GRASS);
    scatter(5, (x, z) => ({ type: 'rock', x, z, readyAt: 0 }), TILE.GRASS);
    scatter(12, (x, z) => ({ type: 'weed', x, z }), TILE.GRASS);
    scatter(6, (x, z) => ({ type: 'item', x, z, item: 'shell' }), TILE.SAND);
  };
})();
