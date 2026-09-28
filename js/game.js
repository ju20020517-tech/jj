/* =========================================================
 *  두근두근 섬 생활 3D — 게임 본체
 *  - Three.js 로 섬/집 안을 렌더링
 *  - 모든 진행 상황은 localStorage 에 자동 저장
 * ========================================================= */
(() => {
  'use strict';
  const ISLE = window.ISLE, M = ISLE.M, world = ISLE.world, TILE = ISLE.TILE;
  const { W, H, HOUSE, SHOP, ITEMS, FURNITURE, ROOM, INV_SIZE, STACK } = ISLE;

  const $ = id => document.getElementById(id);
  const now = () => Date.now();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = n => n.toLocaleString('ko-KR');
  const key = (x, z) => x + ',' + z;
  const josa = (word, a, b) => {
    const c = word.charCodeAt(word.length - 1);
    if (c < 0xac00 || c > 0xd7a3) return word + a;
    return word + ((c - 0xac00) % 28 ? a : b);
  };
  const lerpAngle = (a, b, t) => {
    let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    return a + d * t;
  };
  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isTouch = () => matchMedia('(hover: none), (pointer: coarse)').matches;

  // =========================================================
  // 상태 & 저장
  // =========================================================
  let state;
  let objMap = new Map();
  const newId = () => state.nextId++;

  function defaultPlayer() {
    return {
      name: '주민', shirt: ISLE.SHIRTS[0], hair: ISLE.HAIRS[0], hat: ISLE.HATS[1],
      scene: 'island',
      island: { x: HOUSE.x + 2, z: HOUSE.z + HOUSE.d + 0.9, rot: 0 },
      house: { x: ROOM.w / 2, z: ROOM.d - 0.9, rot: Math.PI },
    };
  }

  function createNewState() {
    const s = {
      v: 1,
      seed: (Math.random() * 1e9) | 0,
      native: 'orange',
      island: '두근두근 섬',
      player: defaultPlayer(),
      bells: 3000,
      inventory: new Array(INV_SIZE).fill(null),
      selected: 0,
      objects: [],
      furniture: [],
      todos: [],
      stats: { fruit: 0, weed: 0, sold: 0, planted: 0, talk: 0, furniture: 0 },
      friends: {},
      nextId: 1,
      timers: { weed: now(), shell: now() },
      createdAt: now(),
    };
    s.native = ISLE.FRUITS[(Math.random() * ISLE.FRUITS.length) | 0];
    state = s;
    world.generate(s.seed);
    world.populate(s, newId);
    for (const f of ISLE.DEFAULT_ROOM) s.furniture.push({ id: newId(), ...f });
    for (const t of ISLE.DEFAULT_TODOS) s.todos.push({ id: newId(), text: t.text, done: false, goal: { ...t.goal }, progress: 0, createdAt: now() });
    s.inventory[0] = { id: 'mum', count: 3 };
    s.inventory[1] = { id: s.native, count: 1 };
    migrateFrom2D(s);
    return s;
  }

  // 2D 버전에서 쓰던 저장 데이터가 있으면 할 일/벨/가방/이름을 이어받음
  function migrateFrom2D(s) {
    try {
      const raw = localStorage.getItem(ISLE.OLD_SAVE_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      if (!o || o.v !== 1) return;
      const rename = { daisy: 'mum', hibiscus: 'cosmos' };
      if (Array.isArray(o.todos)) {
        const mine = o.todos.filter(t => t && !t.goal && typeof t.text === 'string');
        for (const t of mine) s.todos.push({ id: newId(), text: t.text.slice(0, 40), done: !!t.done, createdAt: t.createdAt || now() });
      }
      if (typeof o.bells === 'number') s.bells = Math.max(s.bells, o.bells);
      if (Array.isArray(o.inventory)) {
        s.inventory = o.inventory.slice(0, INV_SIZE).map(it => {
          if (!it) return null;
          const id = rename[it.id] || it.id;
          return ITEMS[id] ? { id, count: clamp(it.count | 0, 1, STACK) } : null;
        });
        while (s.inventory.length < INV_SIZE) s.inventory.push(null);
      }
      if (o.player) {
        if (o.player.name) s.player.name = String(o.player.name).slice(0, 8);
        const toNum = c => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? parseInt(c.slice(1), 16) : null;
        const sh = toNum(o.player.shirt), hr = toNum(o.player.hair);
        if (sh !== null) s.player.shirt = sh;
        if (hr !== null) s.player.hair = hr;
      }
      if (o.island) s.island = String(o.island).slice(0, 10);
      s.migrated = true;
    } catch (e) { /* 무시 */ }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(ISLE.SAVE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || s.v !== 1 || !Array.isArray(s.objects) || !Array.isArray(s.todos) || !Array.isArray(s.furniture)) return null;
      s.inventory = Array.isArray(s.inventory) ? s.inventory.slice(0, INV_SIZE) : [];
      while (s.inventory.length < INV_SIZE) s.inventory.push(null);
      s.inventory = s.inventory.map(it => (it && ITEMS[it.id] && it.count > 0) ? it : null);
      s.player = Object.assign(defaultPlayer(), s.player);
      s.stats = Object.assign({ fruit: 0, weed: 0, sold: 0, planted: 0, talk: 0, furniture: 0 }, s.stats);
      s.timers = Object.assign({ weed: now(), shell: now() }, s.timers);
      s.friends = s.friends || {};
      s.furniture = s.furniture.filter(f => FURNITURE[f.type]);
      s.objects = s.objects.filter(o => o.type !== 'item' || ITEMS[o.item]);
      return s;
    } catch (e) {
      console.warn('저장 데이터를 불러오지 못했어요.', e);
      return null;
    }
  }

  let saveWarned = false;
  function save() {
    try {
      localStorage.setItem(ISLE.SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      if (!saveWarned) { toast('⚠️ 저장에 실패했어요 (저장 공간 확인)'); saveWarned = true; }
    }
  }

  // =========================================================
  // 렌더러 / 장면
  // =========================================================
  const canvas = $('game');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 250);
  let aspect = 1;
  let camZoom = 1;

  // ---------- 섬 ----------
  const islandScene = new THREE.Scene();
  islandScene.background = new THREE.Color(0x8fd8f7);
  islandScene.fog = new THREE.Fog(0x8fd8f7, 26, 60);
  const hemi = new THREE.HemisphereLight(0xe8f6ff, 0x7a9a5a, 0.5);
  const sun = new THREE.DirectionalLight(0xfff1d6, 0.6);
  const ambient = new THREE.AmbientLight(0xffffff, 0.06);
  sun.castShadow = true;
  const shadowSize = isTouch() ? 1024 : 2048;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 70 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  islandScene.add(hemi, sun, sun.target, ambient);

  const objGroup = new THREE.Group();
  islandScene.add(objGroup);
  let houseModel, lampModels = [], lampLights = [];

  // ---------- 집 안 ----------
  const houseScene = new THREE.Scene();
  houseScene.background = new THREE.Color(0x2e231d);
  const roomHemi = new THREE.HemisphereLight(0xfff4e0, 0x5a4a3a, 0.62);
  const roomSun = new THREE.DirectionalLight(0xffe9c4, 0.55);
  roomSun.position.set(2, 9, 9);
  roomSun.target.position.set(5, 0, 3);
  roomSun.castShadow = true;
  roomSun.shadow.mapSize.set(1024, 1024);
  Object.assign(roomSun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 });
  roomSun.shadow.bias = -0.0008;
  const roomLamp = new THREE.PointLight(0xffd9a0, 0.45, 14);
  roomLamp.position.set(5, 3, 4);
  houseScene.add(roomHemi, roomSun, roomSun.target, roomLamp, new THREE.AmbientLight(0xffffff, 0.12));
  const room = M.room();
  houseScene.add(room);
  const furnGroup = new THREE.Group();
  houseScene.add(furnGroup);

  let mode = 'island';   // 'island' | 'house'

  // =========================================================
  // 섬 오브젝트 메시
  // =========================================================
  const objMeshes = new Map();

  function indexObjects() {
    objMap = new Map();
    for (const o of state.objects) objMap.set(key(o.x, o.z), o);
  }
  const objAt = (x, z) => objMap.get(key(x, z));

  function groundY(x, z) {
    const h = world.heightAt(x + 0.5, z + 0.5);
    return h == null ? 0 : h;
  }

  function makeObjMesh(o, pop) {
    let m;
    switch (o.type) {
      case 'tree': m = M.tree(o.fruitType); M.setTreeFruit(m, o.fruit || 0); break;
      case 'flower': m = M.flower(o.item); break;
      case 'weed': m = M.weed(); break;
      case 'rock': m = M.rock(); break;
      case 'bush': m = M.bush(); break;
      case 'sapling': m = M.sapling(); break;
      case 'item': m = M.item(o.item); break;
      default: return;
    }
    const hsh = (o.x * 928371 + o.z * 12377) % 1000 / 1000;
    m.position.set(o.x + 0.5, groundY(o.x, o.z), o.z + 0.5);
    m.rotation.y = o.type === 'tree' ? (hsh - 0.5) * 0.6 : hsh * Math.PI * 2;
    if (o.type === 'flower' || o.type === 'weed' || o.type === 'item') m.traverse(c => { c.castShadow = false; });
    m.userData.baseY = m.position.y;
    if (pop) m.userData.popT = 0.001;
    if (o.type === 'sapling') updateSaplingScale(o, m);
    objGroup.add(m);
    objMeshes.set(o.id, m);
    return m;
  }
  function updateSaplingScale(o, m) {
    const p = clamp(1 - (o.grownAt - now()) / ISLE.SAPLING_GROW_MS, 0, 1);
    m.scale.setScalar(0.8 + p * 0.9);
  }
  function removeObjMesh(o) {
    const m = objMeshes.get(o.id);
    if (m) { objGroup.remove(m); objMeshes.delete(o.id); }
  }
  function addObject(o, pop = true) {
    o.id = newId();
    state.objects.push(o);
    objMap.set(key(o.x, o.z), o);
    return makeObjMesh(o, pop);
  }
  function removeObject(o) {
    const i = state.objects.indexOf(o);
    if (i >= 0) state.objects.splice(i, 1);
    objMap.delete(key(o.x, o.z));
    removeObjMesh(o);
  }

  function buildIsland() {
    world.build(islandScene);
    for (const o of state.objects) makeObjMesh(o, false);

    houseModel = M.house(state.player.name);
    houseModel.position.set(HOUSE.x + HOUSE.w / 2, 0, HOUSE.z + HOUSE.d / 2);
    islandScene.add(houseModel);

    const shop = M.shopBox();
    shop.position.set(SHOP.x + 0.5, 0, SHOP.z + 0.5);
    islandScene.add(shop);

    for (const l of ISLE.LAMPS) {
      const lm = M.lamp();
      lm.position.set(l.x + 0.5, 0, l.z + 0.5);
      islandScene.add(lm);
      lampModels.push(lm);
      const pl = new THREE.PointLight(0xffd88a, 0, 7, 1.6);
      pl.position.set(l.x + 0.5, 1.9, l.z + 0.5);
      islandScene.add(pl);
      lampLights.push(pl);
    }
    const low = world.bridges.find(b => b.level === 0);
    if (low) {
      const sp = M.signpost();
      sp.position.set(low.x + 3.5, groundY(low.x + 3, low.z - 1), low.z - 0.6);
      sp.rotation.y = -0.2;
      islandScene.add(sp);
    }
  }

  // =========================================================
  // 캐릭터 / 주민
  // =========================================================
  const playerLook = () => ({
    id: 'player', species: 'human', shirt: state.player.shirt, hair: state.player.hair,
    hat: state.player.hat, pants: 0x55624a, eyes: 'dot', mouth: 'smile',
  });

  const player = { x: 0, z: 0, y: 0, rot: 0, targetRot: 0, move: 0, char: null };

  function rebuildPlayerModel() {
    const parent = player.char ? player.char.root.parent : null;
    if (player.char && parent) parent.remove(player.char.root);
    player.char = M.character(playerLook());
    (parent || (mode === 'house' ? houseScene : islandScene)).add(player.char.root);
    syncPlayerMesh();
  }
  function syncPlayerMesh() {
    player.char.root.position.set(player.x, player.y, player.z);
    player.char.root.rotation.y = player.rot;
  }

  const villagers = [];
  function spawnVillagers() {
    for (const spec of ISLE.VILLAGERS) {
      const char = M.character(spec);
      let x = spec.home.x + 0.5, z = spec.home.z + 0.5;
      // 집 위치가 막혀 있으면 근처 빈 곳 찾기
      for (let i = 0; i < 40 && islandBlocked(x, z, world.heightAt(x, z) ?? 0, null); i++) {
        x = spec.home.x + 0.5 + ((Math.random() * 7) | 0) - 3;
        z = spec.home.z + 0.5 + ((Math.random() * 7) | 0) - 3;
      }
      const v = {
        spec, char, x, z, y: world.heightAt(x, z) ?? 0, rot: Math.random() * 6,
        target: null, wait: Math.random() * 3, talkUntil: 0, move: 0, stuck: 0,
      };
      char.root.position.set(v.x, v.y, v.z);
      islandScene.add(char.root);
      villagers.push(v);
    }
  }

  // =========================================================
  // 충돌
  // =========================================================
  function solidTile(x, z) {
    if (world.isHouse(x, z) || world.isShop(x, z) || world.isLamp(x, z)) return true;
    const o = objAt(x, z);
    return !!o && (o.type === 'tree' || o.type === 'rock' || o.type === 'bush');
  }
  function islandBlocked(nx, nz, curH, self) {
    const hc = world.heightAt(nx, nz);
    if (hc == null || Math.abs(hc - curH) > 0.35) return true;
    const r = 0.26;
    for (const [dx, dz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) {
      const px = nx + dx, pz = nz + dz;
      const h = world.heightAt(px, pz);
      if (h == null || Math.abs(h - hc) > 0.35) return true;
      if (solidTile(Math.floor(px), Math.floor(pz))) return true;
    }
    // 캐릭터끼리 겹치지 않게
    if (self !== player && Math.hypot(nx - player.x, nz - player.z) < 0.6) return true;
    for (const v of villagers) if (self && v !== self && Math.hypot(nx - v.x, nz - v.z) < 0.6) {
      if (Math.hypot(nx - v.x, nz - v.z) < Math.hypot(self.x - v.x, self.z - v.z)) return true;
    }
    return false;
  }

  let houseOcc = new Map();
  function rebuildOcc() {
    houseOcc = new Map();
    for (const f of state.furniture) {
      if (!FURNITURE[f.type].solid) continue;
      const [w, d] = footprint(f.type, f.rot);
      for (let x = f.x; x < f.x + w; x++) for (let z = f.z; z < f.z + d; z++) houseOcc.set(key(x, z), f.id);
    }
  }
  function houseBlocked(nx, nz) {
    if (nx < 0.3 || nx > ROOM.w - 0.3 || nz < 0.35 || nz > ROOM.d - 0.15) return true;
    const r = 0.24;
    for (const [dx, dz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) {
      if (houseOcc.has(key(Math.floor(nx + dx), Math.floor(nz + dz)))) return true;
    }
    return false;
  }

  function moveEntity(e, dx, dz) {
    let moved = false;
    if (mode === 'house' && e === player) {
      if (dx && !houseBlocked(e.x + dx, e.z)) { e.x += dx; moved = true; }
      if (dz && !houseBlocked(e.x, e.z + dz)) { e.z += dz; moved = true; }
      return moved;
    }
    const h = world.heightAt(e.x, e.z) ?? 0;
    if (dx && !islandBlocked(e.x + dx, e.z, h, e)) { e.x += dx; moved = true; }
    const h2 = world.heightAt(e.x, e.z) ?? 0;
    if (dz && !islandBlocked(e.x, e.z + dz, h2, e)) { e.z += dz; moved = true; }
    return moved;
  }

  // 바라보는 칸
  const facingPoint = (dist = 0.75) => [player.x + Math.sin(player.rot) * dist, player.z + Math.cos(player.rot) * dist];
  function facingTile() {
    const [fx, fz] = facingPoint();
    return [Math.floor(fx), Math.floor(fz)];
  }
  const ownTile = () => [Math.floor(player.x), Math.floor(player.z)];

  function villagerInFront() {
    let best = null, bd = 1.6;
    const fx = Math.sin(player.rot), fz = Math.cos(player.rot);
    for (const v of villagers) {
      const dx = v.x - player.x, dz = v.z - player.z;
      const d = Math.hypot(dx, dz);
      if (d < bd && (dx * fx + dz * fz) / (d || 1) > 0.35) { best = v; bd = d; }
    }
    return best;
  }

  // =========================================================
  // 인벤토리
  // =========================================================
  function addItem(id, n = 1) {
    const inv = state.inventory;
    let slot = inv.findIndex(s => s && s.id === id && s.count + n <= STACK);
    if (slot < 0) slot = inv.findIndex(s => !s);
    if (slot < 0) { toast('🎒 가방이 가득 찼어요!'); return false; }
    if (inv[slot]) inv[slot].count += n;
    else inv[slot] = { id, count: n };
    renderInventory();
    return true;
  }
  function takeSelected(n = 1) {
    const s = state.inventory[state.selected];
    if (!s) return null;
    s.count -= n;
    const id = s.id;
    if (s.count <= 0) state.inventory[state.selected] = null;
    renderInventory();
    return id;
  }
  const selectedItem = () => state.inventory[state.selected];

  // =========================================================
  // 할 일 — 추가/삭제/완료 시 자동 저장
  // =========================================================
  let todoFilter = 'all';
  function addTodo(text) {
    text = text.trim();
    if (!text) return;
    state.todos.push({ id: newId(), text, done: false, createdAt: now() });
    save();
    renderTodos();
  }
  function deleteTodo(id) {
    state.todos = state.todos.filter(t => t.id !== id);
    save();
    renderTodos();
  }
  function toggleTodo(id) {
    const t = state.todos.find(t => t.id === id);
    if (!t) return;
    t.done = !t.done;
    save();
    renderTodos();
  }
  function progressTodos(event, n = 1) {
    let changed = false;
    for (const t of state.todos) {
      if (t.done || !t.goal || t.goal.event !== event) continue;
      t.progress = Math.min(t.goal.count, (t.progress || 0) + n);
      changed = true;
      if (t.progress >= t.goal.count) {
        t.done = true;
        if (!t.rewarded) {
          t.rewarded = true;
          state.bells += 500;
          toast(`✅ "${t.text}" 완료! 보상 500벨`);
          burst(player.x, player.y + 1.6, player.z, 'star', 14);
        }
      }
    }
    if (changed) { renderTodos(); renderHud(); }
  }

  // =========================================================
  // 파티클 (스프라이트)
  // =========================================================
  const spriteTex = {};
  function makeSpriteTex(name, draw) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    draw(c.getContext('2d'));
    spriteTex[name] = new THREE.CanvasTexture(c);
  }
  makeSpriteTex('leaf', g => { g.fillStyle = '#5fbf5a'; g.beginPath(); g.ellipse(32, 32, 26, 12, 0.6, 0, 7); g.fill(); });
  makeSpriteTex('dust', g => { g.fillStyle = '#fff8ea'; g.beginPath(); g.arc(32, 32, 24, 0, 7); g.fill(); });
  makeSpriteTex('petal', g => { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(32, 32, 22, 14, 0.4, 0, 7); g.fill(); });
  makeSpriteTex('star', g => {
    g.fillStyle = '#ffe066'; g.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 11 : 28, a = i / 10 * Math.PI * 2 - Math.PI / 2; g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); }
    g.fill();
  });
  makeSpriteTex('heart', g => {
    g.fillStyle = '#ff7aa8'; g.beginPath();
    g.moveTo(32, 54); g.bezierCurveTo(-6, 28, 16, 0, 32, 18); g.bezierCurveTo(48, 0, 70, 28, 32, 54); g.fill();
  });
  makeSpriteTex('glow', g => {
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,200,1)'); grd.addColorStop(0.3, 'rgba(255,240,140,.6)'); grd.addColorStop(1, 'rgba(255,240,140,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  });

  const particles = [];
  function burst(x, y, z, type, n, color) {
    const scene = mode === 'house' ? houseScene : islandScene;
    for (let i = 0; i < n; i++) {
      const m = new THREE.SpriteMaterial({ map: spriteTex[type], transparent: true, depthWrite: false, color: color || 0xffffff });
      const s = new THREE.Sprite(m);
      const size = type === 'dust' ? 0.25 : type === 'heart' ? 0.3 : 0.22;
      s.scale.setScalar(size);
      s.position.set(x, y, z);
      const a = Math.random() * Math.PI * 2, sp = 0.8 + Math.random() * 1.8;
      const up = type === 'heart' || type === 'star';
      particles.push({ s, scene, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: up ? 1.5 + Math.random() : 1 + Math.random() * 1.5, life: 0.8 + Math.random() * 0.5, up });
      scene.add(s);
    }
  }
  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.s.position.x += p.vx * dt; p.s.position.y += p.vy * dt; p.s.position.z += p.vz * dt;
      p.vy -= (p.up ? 0.5 : 5) * dt;
      p.vx *= 0.96; p.vz *= 0.96;
      p.s.material.opacity = clamp(p.life / 0.4, 0, 1);
      if (p.life <= 0) { p.scene.remove(p.s); p.s.material.dispose(); particles.splice(i, 1); }
    }
  }

  // 나비 & 반딧불이
  const critters = [];
  function spawnCritters() {
    const wingMat = cols => cols.map(c => new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));
    const mats = wingMat([0xfff3a8, 0xffc4e0, 0xc9e7ff, 0xffffff]);
    const wingGeo = new THREE.CircleGeometry(0.09, 10);
    for (let i = 0; i < 8; i++) {
      const g = new THREE.Group();
      const wl = new THREE.Mesh(wingGeo, mats[i % 4]), wr = new THREE.Mesh(wingGeo, mats[i % 4]);
      wl.position.x = -0.08; wr.position.x = 0.08;
      const pl = new THREE.Group(), pr = new THREE.Group();
      pl.add(wl); pr.add(wr);
      g.add(pl, pr);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteTex.glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      glow.scale.setScalar(0.5);
      g.add(glow);
      const x = 6 + Math.random() * (W - 12), z = 6 + Math.random() * (H - 12);
      g.position.set(x, 1, z);
      islandScene.add(g);
      critters.push({ g, pl, pr, glow, vx: 0, vz: 0, ph: Math.random() * 6 });
    }
  }
  function updateCritters(dt, t, night) {
    for (const c of critters) {
      c.ph += dt;
      c.vx = clamp(c.vx + (Math.random() - 0.5) * dt * 4, -0.8, 0.8);
      c.vz = clamp(c.vz + (Math.random() - 0.5) * dt * 4, -0.8, 0.8);
      const p = c.g.position;
      p.x = clamp(p.x + c.vx * dt, 5, W - 5);
      p.z = clamp(p.z + c.vz * dt, 5, H - 6);
      const gy = world.heightAt(p.x, p.z) ?? 0;
      p.y = gy + 0.9 + Math.sin(c.ph * 2) * 0.25;
      c.g.rotation.y = Math.atan2(c.vx, c.vz);
      const f = Math.sin(t * 0.03 + c.ph) * 1.1;
      c.pl.rotation.y = f; c.pr.rotation.y = -f;
      c.pl.visible = c.pr.visible = !night;
      c.glow.visible = night;
      c.glow.material.opacity = 0.5 + Math.sin(t * 0.004 + c.ph * 3) * 0.5;
    }
  }

  // =========================================================
  // 말풍선 / 이름표 / 토스트 (HTML 오버레이)
  // =========================================================
  const bubbleLayer = $('bubbleLayer');
  const bubbles = [];
  function say(who, text, ms = 3000) {
    const old = bubbles.findIndex(b => b.who === who);
    if (old >= 0) { bubbles[old].el.remove(); bubbles.splice(old, 1); }
    const el = document.createElement('div');
    el.className = 'bubble-pos';
    const inner = document.createElement('div');
    inner.className = 'bubble';
    if (who !== player) {
      const n = document.createElement('b');
      n.textContent = who.spec.name;
      inner.appendChild(n);
    }
    inner.appendChild(document.createTextNode(text));
    el.appendChild(inner);
    bubbleLayer.appendChild(el);
    bubbles.push({ who, el, until: performance.now() + ms });
  }
  const tagEls = new Map();
  const tmpV = new THREE.Vector3();
  function toScreen(x, y, z) {
    tmpV.set(x, y, z).project(camera);
    return [(tmpV.x * 0.5 + 0.5) * canvas.clientWidth, (-tmpV.y * 0.5 + 0.5) * canvas.clientHeight, tmpV.z < 1];
  }
  function updateOverlays() {
    const t = performance.now();
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      const visible = mode === 'island' || b.who === player;
      if (t > b.until) { b.el.remove(); bubbles.splice(i, 1); continue; }
      const [sx, sy, ok] = toScreen(b.who.x, b.who.y + 2.05, b.who.z);
      b.el.style.display = visible && ok ? '' : 'none';
      b.el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -100%)`;
    }
    for (const v of villagers) {
      let el = tagEls.get(v);
      if (!el) {
        el = document.createElement('div');
        el.className = 'nametag';
        el.textContent = v.spec.name;
        bubbleLayer.appendChild(el);
        tagEls.set(v, el);
      }
      const near = mode === 'island' && Math.hypot(v.x - player.x, v.z - player.z) < 4 && !bubbles.some(b => b.who === v);
      el.style.display = near ? '' : 'none';
      if (near) {
        const [sx, sy] = toScreen(v.x, v.y + 1.75, v.z);
        el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -100%)`;
      }
    }
  }
  const toastBox = $('toastBox');
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    toastBox.appendChild(el);
    while (toastBox.children.length > 3) toastBox.firstChild.remove();
    setTimeout(() => el.remove(), 2700);
  }

  // =========================================================
  // 섬에서의 행동
  // =========================================================
  function describeTarget() {
    if (mode !== 'island') return null;
    const v = villagerInFront();
    if (v) return { kind: 'npc', v, label: `${josa(v.spec.name, '와', '과')} 대화하기` };
    const [fx, fz] = facingTile();
    if (world.isShop(fx, fz)) return { kind: 'shop', label: '물건 팔기' };
    if (world.isDoor(fx, fz)) return { kind: 'door', label: '집에 들어가기' };
    const [ox, oz] = ownTile();
    let o = objAt(fx, fz);
    if (o && Math.abs(groundY(fx, fz) - player.y) > 0.4) o = null;   // 절벽 위/아래는 손이 안 닿음
    if (!o) { const own = objAt(ox, oz); if (own && own.type !== 'tree' && own.type !== 'rock' && own.type !== 'bush') o = own; }
    if (!o) return null;
    const labels = { tree: '나무 흔들기', rock: '바위 두드리기', flower: '꽃 꺾기', weed: '잡초 뽑기', item: '줍기', sapling: '묘목 캐기', bush: '덤불 살펴보기' };
    return { kind: 'obj', obj: o, label: labels[o.type] };
  }

  let lastActionAt = 0;
  function action() {
    const t = performance.now();
    if (t - lastActionAt < 280 || fading) return;
    lastActionAt = t;
    if (mode === 'house') return houseAction();

    const target = describeTarget();
    player.char.actionT = 0.5;
    if (!target) { say(player, ['음… 아무것도 없네.', '♪ 흥얼흥얼~', '오늘도 좋은 하루!'][(Math.random() * 3) | 0], 1800); return; }
    if (target.kind === 'npc') return talkTo(target.v);
    if (target.kind === 'shop') { sellSelected(); save(); return; }
    if (target.kind === 'door') return enterHouse();

    const o = target.obj;
    const it = o.item ? ITEMS[o.item] : null;
    switch (o.type) {
      case 'tree': shakeTree(o); break;
      case 'rock': hitRock(o); break;
      case 'bush': shakeMesh(o); say(player, '바스락바스락… 🍃', 1600); burst(o.x + 0.5, 0.6, o.z + 0.5, 'leaf', 6); break;
      case 'flower':
        if (addItem(o.item)) { removeObject(o); burst(o.x + 0.5, player.y + 0.4, o.z + 0.5, 'petal', 8, it.color); toast(`${it.icon} ${josa(it.name, '을', '를')} 꺾었다!`); }
        break;
      case 'weed':
        if (addItem('weed')) {
          removeObject(o); state.stats.weed++;
          burst(o.x + 0.5, player.y + 0.3, o.z + 0.5, 'leaf', 7);
          toast('🌿 잡초를 뽑았다! 섬이 깨끗해졌어요');
          progressTodos('weed');
        }
        break;
      case 'item':
        if (addItem(o.item)) {
          removeObject(o);
          burst(o.x + 0.5, player.y + 0.4, o.z + 0.5, 'star', 6);
          toast(`${it.icon} ${josa(it.name, '을', '를')} 주웠다!`);
          if (it.kind === 'fruit') { state.stats.fruit++; progressTodos('fruit'); }
        }
        break;
      case 'sapling':
        if (addItem(o.fruitType)) { removeObject(o); toast('🌱 묘목을 다시 캤어요'); }
        break;
    }
    save();
    renderHud();
  }

  function shakeMesh(o) {
    const m = objMeshes.get(o.id);
    if (m) m.userData.shakeT = 0.6;
  }

  function shakeTree(tree) {
    shakeMesh(tree);
    const baseY = groundY(tree.x, tree.z);
    burst(tree.x + 0.5, baseY + 1.6, tree.z + 0.5, 'leaf', 10);
    if (tree.fruit > 0) {
      const spots = [[0, 1], [-1, 1], [1, 1], [-1, 0], [1, 0], [0, -1]];
      let dropped = 0;
      for (const [dx, dz] of spots) {
        if (dropped >= tree.fruit) break;
        const x = tree.x + dx, z = tree.z + dz;
        const tt = world.tileAt(x, z);
        if ((tt === TILE.GRASS || tt === TILE.SAND || tt === TILE.PATH) && !objAt(x, z) && !world.isHouse(x, z) && !world.isShop(x, z) && !world.isLamp(x, z)
          && Math.abs(groundY(x, z) - baseY) < 0.3) {
          const m = addObject({ type: 'item', x, z, item: tree.fruitType }, false);
          m.userData.fallT = 0.001;
          m.position.y = baseY + 1.5;
          dropped++;
        }
      }
      for (let i = dropped; i < tree.fruit; i++) if (addItem(tree.fruitType)) { state.stats.fruit++; progressTodos('fruit'); }
      toast(`${ITEMS[tree.fruitType].icon} ${josa(ITEMS[tree.fruitType].name, '이', '가')} 떨어졌다!`);
      tree.fruit = 0;
      tree.regrowAt = now() + ISLE.TREE_REGROW_MS;
      M.setTreeFruit(objMeshes.get(tree.id), 0);
    } else if (Math.random() < 0.12) {
      const b = 100 + ((Math.random() * 5) | 0) * 100;
      state.bells += b;
      toast(`💰 나무에서 ${fmt(b)}벨이 떨어졌다!`);
      burst(tree.x + 0.5, baseY + 0.5, tree.z + 0.5, 'star', 10);
    } else {
      say(player, '살랑살랑~ 아무것도 없네.', 1800);
    }
    progressTodos('shake');
  }

  function hitRock(rock) {
    shakeMesh(rock);
    if (now() < (rock.readyAt || 0)) { say(player, '지금은 아무것도 안 나와…', 1800); return; }
    if (addItem('stone')) {
      rock.readyAt = now() + ISLE.ROCK_COOLDOWN_MS;
      burst(rock.x + 0.5, groundY(rock.x, rock.z) + 0.4, rock.z + 0.5, 'dust', 8);
      toast('🪨 돌멩이를 얻었다!');
    }
  }

  function sellSelected() {
    const s = selectedItem();
    if (!s) { say(player, '팔 물건을 먼저 골라야 해!', 1800); return; }
    const it = ITEMS[s.id];
    const total = it.price * s.count;
    state.bells += total;
    state.stats.sold += s.count;
    toast(`📦 ${it.icon} ${it.name} ${s.count}개를 ${fmt(total)}벨에 팔았다!`);
    state.inventory[state.selected] = null;
    burst(SHOP.x + 0.5, 1.2, SHOP.z + 0.5, 'star', 12);
    renderInventory();
    progressTodos('sell');
  }

  function talkTo(v) {
    v.talkUntil = performance.now() + 3000;
    v.target = null;
    v.rot = Math.atan2(player.x - v.x, player.z - v.z);
    player.targetRot = Math.atan2(v.x - player.x, v.z - player.z);
    v.char.talkT = 1.2;
    const s = selectedItem();
    const f = state.friends[v.spec.id] || 0;
    if (s && ITEMS[s.id].kind === 'fruit') {
      const name = ITEMS[s.id].name;
      takeSelected(1);
      state.friends[v.spec.id] = f + 1;
      state.bells += 300;
      say(v, `와! ${josa(name, '이', '가')}다${v.spec.suffix}! 고마워~ 답례로 300벨! 💕`);
      burst(v.x, v.y + 1.8, v.z, 'heart', 8);
    } else {
      const lines = v.spec.lines.concat(
        f >= 3 ? [`${state.player.name}, 우리 완전 단짝이다${v.spec.suffix}! 💖`] : [],
        [`${state.player.name}! 반가워${v.spec.suffix}~`]);
      say(v, lines[(Math.random() * lines.length) | 0]);
    }
    state.stats.talk++;
    progressTodos('talk');
    save();
    renderHud();
  }

  function placeSelected() {
    if (mode === 'house') { if (placeMode) placeFurniture(); return; }
    const s = selectedItem();
    if (!s) { toast('먼저 가방에서 아이템을 골라주세요'); return; }
    const [fx, fz] = facingTile();
    const t = world.tileAt(fx, fz);
    const walkable = t === TILE.GRASS || t === TILE.SAND || t === TILE.PATH;
    if (!walkable || solidTile(fx, fz) || objAt(fx, fz) || villagerInFront() || Math.abs(groundY(fx, fz) - player.y) > 0.3) {
      say(player, '여기엔 놓을 수 없어!', 1600);
      return;
    }
    const it = ITEMS[s.id];
    player.char.actionT = 0.4;
    if (it.kind === 'flower' && t === TILE.GRASS) {
      takeSelected(1);
      addObject({ type: 'flower', x: fx, z: fz, item: s.id });
      state.stats.planted++;
      toast(`${it.icon} ${josa(it.name, '을', '를')} 심었다!`);
      progressTodos('plant_flower');
    } else if (it.kind === 'fruit' && t === TILE.GRASS) {
      takeSelected(1);
      addObject({ type: 'sapling', x: fx, z: fz, fruitType: s.id, grownAt: now() + ISLE.SAPLING_GROW_MS });
      state.stats.planted++;
      toast(`🌱 ${josa(it.name, '을', '를')} 심었다! 곧 나무가 자랄 거예요`);
      progressTodos('plant_tree');
    } else {
      takeSelected(1);
      addObject({ type: 'item', x: fx, z: fz, item: s.id });
      toast(`${it.icon} ${josa(it.name, '을', '를')} 내려놓았다`);
    }
    burst(fx + 0.5, player.y + 0.2, fz + 0.5, 'dust', 5);
    save();
  }

  // 시간 흐름: 과일 재생, 묘목 성장, 잡초/조개 생성
  function tickWorld() {
    const t = now();
    let changed = false;
    for (const o of state.objects) {
      if (o.type === 'tree' && o.fruit < 3 && o.regrowAt && t >= o.regrowAt) {
        o.fruit = 3; o.regrowAt = 0; changed = true;
        M.setTreeFruit(objMeshes.get(o.id), 3);
      } else if (o.type === 'sapling') {
        const m = objMeshes.get(o.id);
        if (t >= o.grownAt) {
          if (Math.hypot(o.x + 0.5 - player.x, o.z + 0.5 - player.z) < 0.7 && mode === 'island') continue; // 위에 서 있으면 잠시 대기
          removeObjMesh(o);
          o.type = 'tree'; o.fruit = 0; o.regrowAt = t + ISLE.TREE_REGROW_MS;
          delete o.grownAt;
          makeObjMesh(o, true);
          changed = true;
          toast('🌳 심었던 묘목이 나무로 자랐어요!');
        } else if (m) updateSaplingScale(o, m);
      }
    }
    const count = pred => state.objects.filter(pred).length;
    const spawnOn = (tile, make) => {
      for (let i = 0; i < 50; i++) {
        const x = (Math.random() * W) | 0, z = (Math.random() * H) | 0;
        if (world.tileAt(x, z) !== tile || objAt(x, z) || world.isReserved(x, z)) continue;
        if (Math.hypot(x + 0.5 - player.x, z + 0.5 - player.z) < 3) continue;
        addObject(make(x, z));
        return true;
      }
      return false;
    };
    if (t - state.timers.weed > ISLE.WEED_SPAWN_MS) {
      state.timers.weed = t;
      if (count(o => o.type === 'weed') < 14 && spawnOn(TILE.GRASS, (x, z) => ({ type: 'weed', x, z }))) changed = true;
    }
    if (t - state.timers.shell > ISLE.SHELL_SPAWN_MS) {
      state.timers.shell = t;
      if (count(o => o.item === 'shell') < 7 && spawnOn(TILE.SAND, (x, z) => ({ type: 'item', x, z, item: 'shell' }))) changed = true;
    }
    if (changed) save();
  }

  // =========================================================
  // 주민 AI
  // =========================================================
  function updateVillagers(dt) {
    const tNow = performance.now();
    for (const v of villagers) {
      let moving = 0;
      if (tNow < v.talkUntil) {
        v.rot = lerpAngle(v.rot, Math.atan2(player.x - v.x, player.z - v.z), 1 - Math.exp(-dt * 8));
      } else if (!v.target) {
        v.wait -= dt;
        // 가까이 있으면 플레이어 쪽을 바라봄
        if (Math.hypot(player.x - v.x, player.z - v.z) < 2.2) v.rot = lerpAngle(v.rot, Math.atan2(player.x - v.x, player.z - v.z), 1 - Math.exp(-dt * 3));
        if (v.wait <= 0) {
          for (let i = 0; i < 12; i++) {
            const tx = v.spec.home.x + ((Math.random() * 11) | 0) - 5 + 0.5;
            const tz = v.spec.home.z + ((Math.random() * 11) | 0) - 5 + 0.5;
            const h = world.heightAt(tx, tz);
            if (h != null && Math.abs(h - v.y) < 0.3 && !solidTile(Math.floor(tx), Math.floor(tz))) { v.target = { x: tx, z: tz }; v.stuck = 0; break; }
          }
          v.wait = 1.5 + Math.random() * 4;
        }
      } else {
        const dx = v.target.x - v.x, dz = v.target.z - v.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.1) v.target = null;
        else {
          const sp = 1.3 * dt;
          const mx = dx / d * sp, mz = dz / d * sp;
          v.rot = lerpAngle(v.rot, Math.atan2(dx, dz), 1 - Math.exp(-dt * 8));
          if (moveEntity(v, mx, mz)) moving = 0.55;
          else if ((v.stuck += dt) > 0.5) v.target = null;
        }
      }
      v.move += (moving - v.move) * Math.min(1, dt * 10);
      const gh = world.heightAt(v.x, v.z) ?? v.y;
      v.y += (gh - v.y) * Math.min(1, dt * 12);
      v.char.root.position.set(v.x, v.y, v.z);
      v.char.root.rotation.y = v.rot;
      M.animate(v.char, dt, v.move);
    }
  }

  // =========================================================
  // 집 안 / 가구 배치
  // =========================================================
  const furnMeshes = new Map();
  let placeMode = null;       // { type, rot, moveId }
  let selectedFid = null;
  let cursorCell = null;      // 마우스로 가리키는 칸
  let cursorSource = 'player';

  function footprint(type, rot) {
    const f = FURNITURE[type];
    return rot % 2 ? [f.d, f.w] : [f.w, f.d];
  }
  function positionFurn(g, f) {
    const [w, d] = footprint(f.type, f.rot);
    g.position.set(f.x + w / 2, 0, f.z + d / 2);
    g.rotation.y = f.rot * Math.PI / 2;
  }
  function addFurnMesh(f, pop) {
    const g = M.furniture(f.type);
    positionFurn(g, f);
    g.traverse(o => { o.userData.fid = f.id; });
    if (pop) g.userData.popT = 0.001;
    furnGroup.add(g);
    furnMeshes.set(f.id, g);
  }
  function removeFurnMesh(id) {
    const g = furnMeshes.get(id);
    if (g) { furnGroup.remove(g); furnMeshes.delete(id); }
  }
  function buildFurniture() {
    for (const f of state.furniture) addFurnMesh(f, false);
    rebuildOcc();
  }

  const DOOR_CELLS = [[4, ROOM.d - 1], [5, ROOM.d - 1]];
  function canPlace(type, x, z, rot, ignoreId) {
    const [w, d] = footprint(type, rot);
    if (x < 0 || z < 0 || x + w > ROOM.w || z + d > ROOM.d) return false;
    const def = FURNITURE[type];
    for (let cx = x; cx < x + w; cx++) for (let cz = z; cz < z + d; cz++) {
      if (def.solid) {
        const occ = houseOcc.get(key(cx, cz));
        if (occ && occ !== ignoreId) return false;
        if (DOOR_CELLS.some(([a, b]) => a === cx && b === cz)) return false;
        if (Math.floor(player.x) === cx && Math.floor(player.z) === cz) return false;
      } else {
        for (const f of state.furniture) {
          if (f.id === ignoreId || FURNITURE[f.type].solid) continue;
          const [fw, fd] = footprint(f.type, f.rot);
          if (cx >= f.x && cx < f.x + fw && cz >= f.z && cz < f.z + fd) return false;
        }
      }
    }
    return true;
  }

  // 배치 미리보기
  const ghostOk = new THREE.MeshBasicMaterial({ color: 0x7cf0a0, transparent: true, opacity: 0.55, depthWrite: false });
  const ghostBad = new THREE.MeshBasicMaterial({ color: 0xff6b6b, transparent: true, opacity: 0.55, depthWrite: false });
  let ghost = null;
  const selMarker = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.45, depthWrite: false }));
  selMarker.rotation.x = -Math.PI / 2;
  selMarker.visible = false;
  houseScene.add(selMarker);

  function makeGhost(type) {
    if (ghost) houseScene.remove(ghost);
    ghost = M.furniture(type);
    ghost.traverse(o => { if (o.isMesh) { o.material = ghostOk; o.castShadow = false; } });
    houseScene.add(ghost);
  }

  function startPlace(type, moveId = null) {
    if (mode !== 'house') { toast('🏠 가구는 집 안에서 배치할 수 있어요! 문 앞에서 Space'); return; }
    const f = moveId ? state.furniture.find(x => x.id === moveId) : null;
    placeMode = { type, rot: f ? f.rot : 0, moveId };
    selectedFid = null;
    makeGhost(type);
    updatePlaceBar();
  }
  function cancelPlace() {
    placeMode = null;
    if (ghost) { houseScene.remove(ghost); ghost = null; }
    updatePlaceBar();
  }
  function placeAnchor() {
    if (!placeMode) return null;
    const [w, d] = footprint(placeMode.type, placeMode.rot);
    let cx, cz;
    if (cursorSource === 'mouse' && cursorCell) [cx, cz] = cursorCell;
    else {
      const [fx, fz] = facingPoint(0.9 + Math.max(w, d) * 0.35);
      cx = Math.floor(fx); cz = Math.floor(fz);
    }
    const x = clamp(cx - Math.floor((w - 1) / 2), 0, ROOM.w - w);
    const z = clamp(cz - Math.floor((d - 1) / 2), 0, ROOM.d - d);
    return [x, z];
  }
  function placeFurniture() {
    if (!placeMode) return;
    const [x, z] = placeAnchor();
    const { type, rot, moveId } = placeMode;
    if (!canPlace(type, x, z, rot, moveId)) { toast('🚫 여기에는 놓을 수 없어요'); return; }
    if (moveId) {
      const f = state.furniture.find(f => f.id === moveId);
      f.x = x; f.z = z; f.rot = rot;
      positionFurn(furnMeshes.get(f.id), f);
      toast(`${FURNITURE[type].icon} ${josa(FURNITURE[type].name, '을', '를')} 옮겼어요`);
      cancelPlace();
    } else {
      const price = FURNITURE[type].price;
      if (state.bells < price) { toast(`💰 벨이 부족해요 (${fmt(price)}벨 필요)`); return; }
      state.bells -= price;
      const f = { id: newId(), type, x, z, rot };
      state.furniture.push(f);
      addFurnMesh(f, true);
      state.stats.furniture++;
      toast(`${FURNITURE[type].icon} ${josa(FURNITURE[type].name, '을', '를')} 놓았어요! (-${fmt(price)}벨)`);
      progressTodos('furniture');
    }
    rebuildOcc();
    const [w, d] = footprint(type, rot);
    burst(x + w / 2, 0.3, z + d / 2, 'star', 8);
    save();
    renderHud();
  }
  function rotateCurrent() {
    if (placeMode) { placeMode.rot = (placeMode.rot + 1) % 4; return; }
    const f = state.furniture.find(f => f.id === selectedFid);
    if (!f) return;
    const nr = (f.rot + 1) % 4;
    if (!canPlace(f.type, f.x, f.z, nr, f.id)) { toast('🚫 회전할 공간이 없어요'); return; }
    f.rot = nr;
    positionFurn(furnMeshes.get(f.id), f);
    rebuildOcc();
    save();
  }
  function removeSelectedFurniture() {
    const f = state.furniture.find(f => f.id === selectedFid);
    if (!f) return;
    const def = FURNITURE[f.type];
    state.furniture = state.furniture.filter(x => x !== f);
    removeFurnMesh(f.id);
    state.bells += def.price;
    selectedFid = null;
    rebuildOcc();
    toast(`${def.icon} ${josa(def.name, '을', '를')} 회수했어요 (+${fmt(def.price)}벨)`);
    burst(f.x + 0.5, 0.4, f.z + 0.5, 'dust', 8);
    save();
    renderHud();
    updatePlaceBar();
  }
  function selectFurniture(id) {
    selectedFid = selectedFid === id ? null : id;
    updatePlaceBar();
  }
  function furnitureInFront() {
    for (const dist of [0.7, 1.2]) {
      const [fx, fz] = facingPoint(dist);
      const k = key(Math.floor(fx), Math.floor(fz));
      if (houseOcc.has(k)) return houseOcc.get(k);
    }
    // 러그
    const [fx, fz] = facingPoint(0.7);
    const rug = state.furniture.find(f => !FURNITURE[f.type].solid && (() => {
      const [w, d] = footprint(f.type, f.rot);
      return fx >= f.x && fx < f.x + w && fz >= f.z && fz < f.z + d;
    })());
    return rug ? rug.id : null;
  }
  function houseAction() {
    if (placeMode) return placeFurniture();
    const id = furnitureInFront();
    if (id) { selectFurniture(id); return; }
    say(player, ['우리 집 최고! 🏠', '가구 탭에서 새 가구를 골라볼까?', '여기 뭘 놓으면 좋을까~'][(Math.random() * 3) | 0], 1800);
  }

  function updatePlaceBar() {
    const bar = $('placeBar');
    if (placeMode) {
      const def = FURNITURE[placeMode.type];
      bar.hidden = false;
      $('placeTitle').textContent = `${def.icon} ${def.name}${placeMode.moveId ? ' 옮기는 중' : ` · ${fmt(def.price)}벨`}`;
      $('pbPlace').hidden = false; $('pbMove').hidden = true; $('pbRemove').hidden = true;
      $('pbCancel').textContent = '취소 (Esc)';
    } else if (selectedFid) {
      const f = state.furniture.find(f => f.id === selectedFid);
      const def = FURNITURE[f.type];
      bar.hidden = false;
      $('placeTitle').textContent = `${def.icon} ${def.name}`;
      $('pbPlace').hidden = true; $('pbMove').hidden = false; $('pbRemove').hidden = false;
      $('pbCancel').textContent = '닫기 (Esc)';
    } else {
      bar.hidden = true;
    }
  }

  function updateHouseVisuals(dt) {
    // 미리보기 위치/색
    if (placeMode && ghost) {
      const [x, z] = placeAnchor();
      const [w, d] = footprint(placeMode.type, placeMode.rot);
      ghost.position.set(x + w / 2, 0.02, z + d / 2);
      ghost.rotation.y = placeMode.rot * Math.PI / 2;
      const ok = canPlace(placeMode.type, x, z, placeMode.rot, placeMode.moveId);
      ghost.traverse(o => { if (o.isMesh) o.material = ok ? ghostOk : ghostBad; });
      const mv = placeMode.moveId && furnMeshes.get(placeMode.moveId);
      if (mv) mv.visible = false;
    }
    for (const [id, g] of furnMeshes) if (!placeMode || placeMode.moveId !== id) g.visible = true;
    // 선택 표시
    const f = selectedFid && state.furniture.find(f => f.id === selectedFid);
    selMarker.visible = !!f;
    if (f) {
      const [w, d] = footprint(f.type, f.rot);
      selMarker.scale.set(w, d, 1);
      selMarker.position.set(f.x + w / 2, 0.03, f.z + d / 2);
      selMarker.material.opacity = 0.35 + Math.sin(performance.now() * 0.006) * 0.15;
    }
    // 가구 애니메이션 (등장, 선풍기)
    for (const g of furnMeshes.values()) {
      if (g.userData.popT) {
        g.userData.popT += dt;
        const k = Math.min(1, g.userData.popT / 0.3);
        g.scale.setScalar(0.4 + 0.6 * k + Math.sin(k * Math.PI) * 0.15);
        if (k >= 1) { g.userData.popT = 0; g.scale.setScalar(1); }
      }
      if (g.userData.spin) g.userData.spin.rotation.z += dt * 12;
    }
    // 시계
    const d = new Date();
    room.userData.hHand.rotation.z = -((d.getHours() % 12) + d.getMinutes() / 60) / 12 * Math.PI * 2;
    room.userData.mHand.rotation.z = -d.getMinutes() / 60 * Math.PI * 2;
  }

  // 마우스로 가구 고르기/놓기
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pickFromEvent(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  }
  function bindPointer() {
    canvas.addEventListener('pointermove', e => {
      if (mode !== 'house' || e.pointerType === 'touch') return;
      pickFromEvent(e);
      const hit = raycaster.intersectObject(room.userData.floor)[0];
      if (hit) { cursorCell = [Math.floor(hit.point.x), Math.floor(hit.point.z)]; cursorSource = 'mouse'; }
    });
    canvas.addEventListener('click', e => {
      if (mode !== 'house') return;
      pickFromEvent(e);
      if (placeMode) {
        const hit = raycaster.intersectObject(room.userData.floor)[0];
        if (hit) { cursorCell = [Math.floor(hit.point.x), Math.floor(hit.point.z)]; cursorSource = 'mouse'; placeFurniture(); }
        return;
      }
      const hit = raycaster.intersectObjects(furnGroup.children, true)[0];
      if (hit && hit.object.userData.fid) selectFurniture(hit.object.userData.fid);
      else { selectedFid = null; updatePlaceBar(); }
    });
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      camZoom = clamp(camZoom + Math.sign(e.deltaY) * 0.08, 0.7, 1.5);
    }, { passive: false });
  }

  // =========================================================
  // 장면 전환 (페이드)
  // =========================================================
  let fading = false;
  function fadeTo(fn) {
    if (fading) return;
    fading = true;
    const f = $('fade');
    f.classList.add('on');
    setTimeout(() => {
      fn();
      setTimeout(() => { f.classList.remove('on'); fading = false; }, 120);
    }, 380);
  }
  function enterHouse() {
    fadeTo(() => {
      storePlayerPos();
      mode = 'house';
      state.player.scene = 'house';
      islandScene.remove(player.char.root);
      houseScene.add(player.char.root);
      const p = state.player.house;
      player.x = ROOM.w / 2; player.z = ROOM.d - 0.9; player.rot = player.targetRot = Math.PI;
      if (houseBlocked(player.x, player.z)) { player.x = p.x; player.z = p.z; }
      player.y = 0;
      syncPlayerMesh();
      snapCamera();
      progressTodos('enter_house');
      save();
      updateModeUI();
      say(player, '다녀왔습니다~ 🏠', 1600);
    });
  }
  function exitHouse() {
    cancelPlace();
    selectedFid = null;
    updatePlaceBar();
    fadeTo(() => {
      storePlayerPos();
      mode = 'island';
      state.player.scene = 'island';
      houseScene.remove(player.char.root);
      islandScene.add(player.char.root);
      player.x = HOUSE.x + 2; player.z = HOUSE.z + HOUSE.d + 0.7; player.rot = player.targetRot = 0;
      player.y = world.heightAt(player.x, player.z) ?? 0;
      syncPlayerMesh();
      snapCamera();
      save();
      updateModeUI();
    });
  }
  function storePlayerPos() {
    const p = { x: +player.x.toFixed(3), z: +player.z.toFixed(3), rot: +player.rot.toFixed(3) };
    if (mode === 'house') state.player.house = p; else state.player.island = p;
  }

  // =========================================================
  // 입력
  // =========================================================
  const keys = new Set();
  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ShiftLeft: 'run', ShiftRight: 'run',
  };
  const stick = { id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
  const typing = () => {
    const a = document.activeElement;
    return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA');
  };

  function bindInput() {
    window.addEventListener('keydown', e => {
      if (typing()) return;
      const k = KEYMAP[e.code];
      if (k) { keys.add(k); e.preventDefault(); if (k !== 'run') cursorSource = 'player'; return; }
      if (e.repeat) return;
      if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter' || e.code === 'KeyZ') { e.preventDefault(); action(); }
      else if (e.code === 'KeyQ' || e.code === 'KeyX' && mode === 'island') { e.preventDefault(); placeSelected(); }
      else if (e.code === 'KeyR' && mode === 'house') rotateCurrent();
      else if ((e.code === 'Delete' || e.code === 'Backspace' || e.code === 'KeyX') && mode === 'house') removeSelectedFurniture();
      else if (e.code === 'Escape') { if (placeMode) cancelPlace(); else { selectedFid = null; updatePlaceBar(); } }
      else if (/^Digit\d$/.test(e.code)) {
        const n = +e.code.slice(5);
        selectSlot(n === 0 ? 9 : n - 1);
      }
    });
    window.addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) keys.delete(k); });
    window.addEventListener('blur', () => keys.clear());

    // 가상 조이스틱 (터치)
    const stickEl = $('stick'), knob = $('stickKnob');
    canvas.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch' || stick.id !== null) return;
      stick.id = e.pointerId; stick.ox = e.clientX; stick.oy = e.clientY; stick.dx = stick.dy = 0;
      const r = canvas.getBoundingClientRect();
      stickEl.style.left = (e.clientX - r.left) + 'px';
      stickEl.style.top = (e.clientY - r.top) + 'px';
      stickEl.classList.add('on');
      knob.style.transform = 'translate(-50%,-50%)';
      cursorSource = 'player';
    });
    window.addEventListener('pointermove', e => {
      if (e.pointerId !== stick.id) return;
      let dx = e.clientX - stick.ox, dy = e.clientY - stick.oy;
      const d = Math.hypot(dx, dy), max = 50;
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      stick.dx = dx / max; stick.dy = dy / max;
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    });
    const end = e => {
      if (e.pointerId !== stick.id) return;
      stick.id = null; stick.dx = stick.dy = 0;
      stickEl.classList.remove('on');
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);

    $('btnA').addEventListener('pointerdown', e => { e.preventDefault(); action(); });
    $('btnB').addEventListener('pointerdown', e => { e.preventDefault(); placeSelected(); });
    $('btnRun').addEventListener('pointerdown', e => { e.preventDefault(); keys.has('run') ? keys.delete('run') : keys.add('run'); $('btnRun').classList.toggle('on', keys.has('run')); });
  }

  function inputVector() {
    let x = 0, z = 0;
    if (keys.has('left')) x -= 1;
    if (keys.has('right')) x += 1;
    if (keys.has('up')) z -= 1;
    if (keys.has('down')) z += 1;
    if (stick.id !== null) { x += stick.dx; z += stick.dy; }
    const m = Math.hypot(x, z);
    if (m > 1) { x /= m; z /= m; }
    return { x, z, m: Math.min(1, m) };
  }

  // =========================================================
  // 낮과 밤
  // =========================================================
  const SKY = [
    [0, 0x16213e, 0.12, 0.3], [5, 0x16213e, 0.12, 0.3], [6.5, 0xffb88a, 0.45, 0.5],
    [8, 0x8fd8f7, 0.62, 0.5], [16.5, 0x8fd8f7, 0.62, 0.5], [18, 0xff9f6b, 0.5, 0.5],
    [19.5, 0x1d2b52, 0.15, 0.32], [24, 0x16213e, 0.12, 0.3],
  ];
  const hourOverride = (() => { const h = new URLSearchParams(location.search).get('hour'); return h === null ? null : +h; })();
  const currentHour = () => {
    if (hourOverride !== null && !isNaN(hourOverride)) return hourOverride;
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  };
  const cA = new THREE.Color(), cB = new THREE.Color();
  let isNight = false;
  function updateSky() {
    const h = currentHour();
    let i = 0;
    while (i < SKY.length - 2 && SKY[i + 1][0] <= h) i++;
    const a = SKY[i], b = SKY[i + 1];
    const k = clamp((h - a[0]) / (b[0] - a[0]), 0, 1);
    cA.setHex(a[1]); cB.setHex(b[1]);
    cA.lerp(cB, k);
    islandScene.background.copy(cA);
    islandScene.fog.color.copy(cA);
    sun.intensity = a[2] + (b[2] - a[2]) * k;
    hemi.intensity = a[3] + (b[3] - a[3]) * k;
    const warm = h > 16 && h < 19.5 || h > 5 && h < 8;
    sun.color.setHex(warm ? 0xffc890 : 0xfff1d6);
    isNight = h < 5.8 || h >= 19;
    for (const l of lampLights) l.intensity = isNight ? 1.3 : 0;
    for (const lm of lampModels) lm.userData.bulbMat.emissive.setHex(isNight ? 0xffd070 : 0x000000);
    if (houseModel) houseModel.userData.winMat.emissive.setHex(isNight ? 0xffc860 : 0x000000);
  }

  // =========================================================
  // 메인 루프
  // =========================================================
  const camTarget = new THREE.Vector3();
  const camOffIsland = new THREE.Vector3(0, 6.4, 9.2);
  const camOffHouse = new THREE.Vector3(0, 7.6, 9.4);
  function camGoal(out) {
    if (mode === 'house') {
      out.set(ROOM.w / 2 + (player.x - ROOM.w / 2) * 0.35, 0.6, ROOM.d / 2 - 0.2 + (player.z - ROOM.d / 2) * 0.25);
    } else out.set(player.x, player.y + 0.7, player.z - 0.8);
    return out;
  }
  function placeCamera() {
    const off = mode === 'house' ? camOffHouse : camOffIsland;
    const fit = mode === 'house' ? clamp(1.35 / aspect, 1, 2.3) : clamp(1.15 / aspect, 1, 1.7);
    camera.position.copy(camTarget).addScaledVector(off, fit * camZoom);
    camera.lookAt(camTarget);
  }
  function snapCamera() { camGoal(camTarget); placeCamera(); }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }

  const marker = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.strokeStyle = '#ffffff'; g.lineWidth = 10; g.setLineDash([22, 14]);
    g.beginPath(); g.roundRect ? g.roundRect(10, 10, 108, 108, 26) : g.rect(10, 10, 108, 108); g.stroke();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.renderOrder = 3;
    islandScene.add(m);
    return m;
  })();

  let lastPosSave = 0, posDirty = false, worldAcc = 0, skyAcc = 99;

  function update(dt, t) {
    const inp = fading ? { x: 0, z: 0, m: 0 } : inputVector();
    const run = keys.has('run');
    let moveAmt = 0;
    if (inp.m > 0.1) {
      player.targetRot = Math.atan2(inp.x, inp.z);
      const sp = (run ? 5.6 : 3.4) * dt * inp.m;
      if (moveEntity(player, inp.x * sp, inp.z * sp)) { moveAmt = inp.m * (run ? 1 : 0.65); posDirty = true; }
      if (mode === 'island' && run && moveAmt && Math.random() < 0.25) burst(player.x, player.y + 0.05, player.z, 'dust', 1);
      // 집 들어가기: 문으로 걸어가면 자동으로
      if (mode === 'island' && inp.z < -0.5 && !moveAmt) {
        const [fx, fz] = facingTile();
        if (world.isDoor(fx, fz)) enterHouse();
      }
      if (mode === 'house' && inp.z > 0.5 && player.z > ROOM.d - 0.3 && Math.abs(player.x - ROOM.w / 2) < 1) exitHouse();
    }
    player.rot = lerpAngle(player.rot, player.targetRot, 1 - Math.exp(-dt * 14));
    player.move += ((moveAmt) - (player.move || 0)) * Math.min(1, dt * 12);
    const gh = mode === 'house' ? 0 : (world.heightAt(player.x, player.z) ?? player.y);
    player.y += (gh - player.y) * Math.min(1, dt * 14);
    syncPlayerMesh();
    M.animate(player.char, dt, player.move);

    if (posDirty && t - lastPosSave > 1500) {
      storePlayerPos();
      save();
      lastPosSave = t; posDirty = false;
    }

    updateParticles(dt);

    if (mode === 'island') {
      updateVillagers(dt);
      updateCritters(dt, t, isNight);
      world.animate(t);
      // 오브젝트 애니메이션
      for (const [id, m] of objMeshes) {
        const u = m.userData;
        if (u.popT) {
          u.popT += dt;
          const k = Math.min(1, u.popT / 0.3);
          const s = 0.3 + 0.7 * k + Math.sin(k * Math.PI) * 0.2;
          m.scale.setScalar(s);
          if (k >= 1) { u.popT = 0; m.scale.setScalar(1); }
        }
        if (u.fallT) {
          u.fallT += dt;
          const k = Math.min(1, u.fallT / 0.45);
          m.position.y = u.baseY + (1 - k * k) * 1.5 + Math.sin(k * Math.PI) * 0.1;
          if (k >= 1) { u.fallT = 0; m.position.y = u.baseY; }
        }
        if (u.shakeT > 0) {
          u.shakeT -= dt;
          const w = Math.sin(u.shakeT * 40) * u.shakeT * 0.12;
          if (u.canopy) u.canopy.rotation.z = w; else m.rotation.z = w;
        }
      }
      // 바라보는 칸 표시
      const tgt = describeTarget();
      const [fx, fz] = facingTile();
      const showMarker = (tgt && tgt.kind !== 'npc') || (!tgt && selectedItem());
      marker.visible = !!showMarker;
      if (showMarker) {
        const tx = tgt && tgt.obj ? tgt.obj.x : fx, tz = tgt && tgt.obj ? tgt.obj.z : fz;
        marker.position.set(tx + 0.5, groundY(tx, tz) + 0.03, tz + 0.5);
        marker.material.opacity = 0.6 + Math.sin(t * 0.008) * 0.3;
      }
      worldAcc += dt;
      if (worldAcc > 1) { worldAcc = 0; tickWorld(); }
      skyAcc += dt;
      if (skyAcc > 5) { skyAcc = 0; updateSky(); }
      sun.position.set(player.x - 8, 22, player.z + 10);
      sun.target.position.set(player.x, 0, player.z);
    } else {
      updateHouseVisuals(dt);
    }

    camGoal(tmpGoal);
    camTarget.lerp(tmpGoal, 1 - Math.exp(-dt * 6));
    placeCamera();
  }
  const tmpGoal = new THREE.Vector3();

  let lastT = 0;
  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0);
    lastT = t;
    update(dt, t);
    renderer.render(mode === 'house' ? houseScene : islandScene, camera);
    updateOverlays();
    updateHint();
    requestAnimationFrame(loop);
  }

  // =========================================================
  // UI
  // =========================================================
  const slotEls = [];
  function buildHotbar() {
    const hotbar = $('hotbar');
    hotbar.innerHTML = '';
    for (let i = 0; i < INV_SIZE; i++) {
      const b = document.createElement('button');
      b.className = 'slot'; b.type = 'button';
      b.addEventListener('click', () => selectSlot(i));
      hotbar.appendChild(b);
      slotEls.push(b);
    }
  }
  function selectSlot(i) { state.selected = i; renderInventory(); save(); }
  function renderInventory() {
    state.inventory.forEach((s, i) => {
      const el = slotEls[i];
      el.classList.toggle('selected', i === state.selected);
      el.innerHTML = `<span class="num">${(i + 1) % 10}</span>` + (s ? `${ITEMS[s.id].icon}<span class="count">${s.count}</span>` : '');
      el.title = s ? `${ITEMS[s.id].name} × ${s.count} (${fmt(ITEMS[s.id].price)}벨)` : '빈 칸';
    });
    const s = selectedItem();
    $('selectedName').textContent = s ? `${ITEMS[s.id].icon} ${ITEMS[s.id].name} × ${s.count} · 개당 ${fmt(ITEMS[s.id].price)}벨` : '선택한 아이템 없음';
    renderHud();
  }
  function renderHud() {
    $('bells').textContent = fmt(state.bells);
    $('playerChip').textContent = `🙂 ${state.player.name}`;
    $('islandTitle').textContent = state.island;
    document.title = `${state.island} 생활 3D`;
    renderStats();
    renderCatalogAfford();
  }
  let lastHint = null;
  function updateHint() {
    const touch = isTouch();
    const A = touch ? '행동' : 'Space', B = touch ? '심기' : 'Q';
    let h = '';
    if (mode === 'house') {
      if (placeMode) h = touch ? '조이스틱으로 이동 · 행동: 놓기' : '마우스 클릭 또는 Space: 놓기 · R: 회전 · Esc: 취소';
      else if (selectedFid) h = touch ? '아래 버튼으로 회전/옮기기/회수' : 'R: 회전 · X: 회수 · Esc: 닫기';
      else {
        const id = furnitureInFront();
        h = id ? `${A}: ${FURNITURE[state.furniture.find(f => f.id === id).type].name} 선택` : '🛋️ 가구 탭에서 가구를 골라 꾸며보세요 · 아래로 나가기';
      }
    } else {
      const t = describeTarget();
      if (t) h = `${A}: ${t.label}`;
      else if (selectedItem()) {
        const it = ITEMS[selectedItem().id];
        h = `${B}: ${it.name} ${it.kind === 'fruit' || it.kind === 'flower' ? '심기' : '내려놓기'}`;
      }
    }
    if (h !== lastHint) { $('hint').textContent = h; lastHint = h; }
  }
  function updateClock() {
    const d = new Date();
    const hh = hourOverride !== null ? Math.floor(hourOverride) : d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const icon = hh >= 6 && hh < 17 ? '☀️' : hh >= 17 && hh < 19 ? '🌇' : '🌙';
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    $('clock').textContent = `${icon} ${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]}) ${hh < 12 ? '오전' : '오후'} ${hh % 12 || 12}:${m}`;
  }
  function updateModeUI() {
    document.body.classList.toggle('in-house', mode === 'house');
    $('btnB').textContent = mode === 'house' ? '놓기' : '심기';
    $('locChip').textContent = mode === 'house' ? '🏠 우리 집' : '🏝️ ' + state.island;
  }

  // 할 일 목록
  function renderTodos() {
    const list = $('todoList');
    const items = state.todos.filter(t => todoFilter === 'all' || (todoFilter === 'done' ? t.done : !t.done));
    list.innerHTML = '';
    if (!items.length) {
      const li = document.createElement('li');
      li.className = 'todo-empty';
      li.textContent = todoFilter === 'done' ? '아직 완료한 일이 없어요' : '할 일이 없어요. 여유로운 섬 생활~ 🌴';
      list.appendChild(li);
    }
    for (const t of items) {
      const li = document.createElement('li');
      li.className = 'todo-item' + (t.done ? ' done' : '');
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = t.done;
      cb.addEventListener('change', () => toggleTodo(t.id));
      const text = document.createElement('div');
      text.className = 'text';
      if (t.goal) {
        const badge = document.createElement('span');
        badge.className = 'badge'; badge.textContent = '섬 미션';
        text.appendChild(badge);
      }
      text.appendChild(document.createTextNode(t.text));
      if (t.goal) {
        const prog = document.createElement('div');
        prog.className = 'prog';
        prog.textContent = `진행 ${t.done ? t.goal.count : (t.progress || 0)}/${t.goal.count} · 보상 500벨`;
        text.appendChild(prog);
      }
      const del = document.createElement('button');
      del.className = 'del'; del.type = 'button'; del.textContent = '✕'; del.title = '삭제';
      del.addEventListener('click', () => deleteTodo(t.id));
      li.append(cb, text, del);
      list.appendChild(li);
    }
    const left = state.todos.filter(t => !t.done).length;
    $('todoCount').textContent = `남은 일 ${left}개 / 전체 ${state.todos.length}개`;
  }

  function renderStats() {
    const el = $('stats');
    const days = Math.max(1, Math.ceil((now() - (state.createdAt || now())) / 86400000));
    const friends = ISLE.VILLAGERS.map(v => `${v.name} ${'💗'.repeat(Math.min(5, state.friends[v.id] || 0)) || '🤍'}`).join('<br>');
    el.innerHTML = `
      🏝️ 섬 이름: <b>${escapeHtml(state.island)}</b><br>
      ${ITEMS[state.native].icon} 특산 과일: ${ITEMS[state.native].name}<br>
      📅 섬 생활 ${days}일째<br>
      🍊 모은 과일 ${state.stats.fruit} · 🌿 뽑은 잡초 ${state.stats.weed}<br>
      🌱 심은 것 ${state.stats.planted} · 📦 판 물건 ${state.stats.sold}<br>
      🛋️ 놓은 가구 ${state.furniture.length}개<br>
      <div class="friends">${friends}</div>`;
  }

  // 가구 카탈로그
  function buildCatalog() {
    const box = $('catalog');
    box.innerHTML = '';
    for (const [type, def] of Object.entries(FURNITURE)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cat-item';
      b.dataset.type = type;
      b.innerHTML = `<span class="ic">${def.icon}</span><span class="nm">${def.name}</span><span class="pr">${fmt(def.price)}벨 · ${def.w}×${def.d}</span>`;
      b.addEventListener('click', () => startPlace(type));
      box.appendChild(b);
    }
  }
  function renderCatalogAfford() {
    document.querySelectorAll('.cat-item').forEach(b => b.classList.toggle('poor', FURNITURE[b.dataset.type].price > state.bells));
  }

  function buildSwatches(elId, colors, prop, after) {
    const box = $(elId);
    box.innerHTML = '';
    for (const c of colors) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch' + (state.player[prop] === c ? ' active' : '') + (c === null ? ' none' : '');
      if (c !== null) b.style.background = ISLE.hex(c);
      b.title = c === null ? '없음' : '';
      b.addEventListener('click', () => {
        state.player[prop] = c;
        save();
        buildSwatches(elId, colors, prop, after);
        after && after();
      });
      box.appendChild(b);
    }
  }

  function bindUI() {
    document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + tab.dataset.tab));
    }));

    $('todoForm').addEventListener('submit', e => {
      e.preventDefault();
      addTodo($('todoInput').value);
      $('todoInput').value = '';
    });
    $('todoFilter').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      todoFilter = b.dataset.filter;
      $('todoFilter').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      renderTodos();
    });
    $('clearDone').addEventListener('click', () => {
      const n = state.todos.filter(t => t.done).length;
      if (!n) return;
      state.todos = state.todos.filter(t => !t.done);
      save();
      renderTodos();
      toast(`🧹 완료한 일 ${n}개를 정리했어요`);
    });

    $('nameInput').value = state.player.name;
    $('islandInput').value = state.island;
    $('nameInput').addEventListener('input', e => {
      state.player.name = e.target.value.trim() || '주민';
      houseModel.userData.setName(state.player.name);
      save(); renderHud();
    });
    $('islandInput').addEventListener('input', e => {
      state.island = e.target.value.trim() || '두근두근 섬';
      save(); renderHud(); updateModeUI();
    });
    buildSwatches('shirtSwatches', ISLE.SHIRTS, 'shirt', rebuildPlayerModel);
    buildSwatches('hairSwatches', ISLE.HAIRS, 'hair', rebuildPlayerModel);
    buildSwatches('hatSwatches', ISLE.HATS, 'hat', rebuildPlayerModel);
    $('resetBtn').addEventListener('click', () => {
      if (!confirm('정말 섬을 처음부터 다시 시작할까요?\n모든 저장 데이터가 사라져요.')) return;
      resetting = true;
      try { localStorage.removeItem(ISLE.SAVE_KEY); localStorage.removeItem(ISLE.OLD_SAVE_KEY); } catch (e) { /* 무시 */ }
      location.reload();
    });

    $('btnPlace').addEventListener('click', placeSelected);
    $('pbPlace').addEventListener('click', placeFurniture);
    $('pbRotate').addEventListener('click', rotateCurrent);
    $('pbMove').addEventListener('click', () => {
      const f = state.furniture.find(f => f.id === selectedFid);
      if (f) startPlace(f.type, f.id);
    });
    $('pbRemove').addEventListener('click', removeSelectedFurniture);
    $('pbCancel').addEventListener('click', () => { if (placeMode) cancelPlace(); else { selectedFid = null; updatePlaceBar(); } });
    $('zoomIn').addEventListener('click', () => { camZoom = clamp(camZoom - 0.12, 0.7, 1.5); });
    $('zoomOut').addEventListener('click', () => { camZoom = clamp(camZoom + 0.12, 0.7, 1.5); });
  }

  // =========================================================
  // 시작
  // =========================================================
  let resetting = false;

  function start() {
    const loaded = loadState();
    if (loaded) { state = loaded; world.generate(state.seed); }
    else createNewState();
    indexObjects();

    buildIsland();
    buildFurniture();
    spawnCritters();

    mode = state.player.scene === 'house' ? 'house' : 'island';
    const p = mode === 'house' ? state.player.house : state.player.island;
    player.x = p.x; player.z = p.z; player.rot = player.targetRot = p.rot || 0;
    rebuildPlayerModel();
    if (mode === 'island') {
      player.y = world.heightAt(player.x, player.z) ?? 0;
      if (islandBlocked(player.x, player.z, player.y, player)) {
        const d = defaultPlayer().island;
        player.x = d.x; player.z = d.z; player.y = 0;
      }
    } else if (houseBlocked(player.x, player.z)) {
      player.x = ROOM.w / 2; player.z = ROOM.d - 0.9;
    }
    spawnVillagers();
    syncPlayerMesh();

    buildHotbar();
    buildCatalog();
    renderInventory();
    renderTodos();
    bindUI();
    bindInput();
    bindPointer();
    resize();
    window.addEventListener('resize', resize);
    updateSky();
    updateClock();
    setInterval(updateClock, 1000);
    snapCamera();
    updateModeUI();

    const flush = () => { if (resetting) return; storePlayerPos(); save(); };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

    save();
    if (loaded) toast(`🏝️ ${state.player.name}님, ${state.island}에 다시 오신 걸 환영해요!`);
    else if (state.migrated) toast('✨ 2D 섬의 할 일과 가방을 그대로 가져왔어요!');
    else toast('🏝️ 새로운 섬에 도착했어요! 도움말 탭을 확인해 보세요');
    if (mode === 'island') {
      const v = villagers[0];
      setTimeout(() => say(v, `${state.player.name}! 오늘도 즐겁게 놀자${v.spec.suffix}~`), 900);
    }

    $('loading').remove();
    requestAnimationFrame(t => { lastT = t; loop(t); });
    ISLE.debug = { state: () => state, player, save, snapCamera, updateSky, islandBlocked, solidTile, objAt, villagers, get mode() { return mode; }, enterHouse, exitHouse, startPlace, placeFurniture };
  }

  try { start(); }
  catch (e) {
    console.error(e);
    const l = $('loading');
    if (l) l.textContent = '😢 3D를 시작하지 못했어요. 브라우저가 WebGL을 지원하는지 확인해 주세요.';
  }
})();
