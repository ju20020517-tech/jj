/* =========================================================
 *  두근두근 섬 생활 — Vanilla JS 섬 생활 게임
 *  - Canvas 로 섬/캐릭터를 그리고, 모든 진행 상황은 localStorage 에 자동 저장
 * ========================================================= */
(() => {
  'use strict';

  // ---------------------------------------------------------
  // 상수
  // ---------------------------------------------------------
  const SAVE_KEY = 'cozy-island-save-v1';
  const T = 48;            // 타일 크기(px)
  const W = 44, H = 34;    // 맵 크기(타일)
  const TILE = { GRASS: 0, WATER: 1, SAND: 2, PATH: 3, BRIDGE: 4 };
  const INV_SIZE = 10;
  const STACK = 30;

  const HOUSE = { x: 24, y: 8, w: 4, h: 3 };
  const SHOP = { x: 29, y: 10 };
  const NPC_HOME = { x: 32, y: 15 };

  const FRUITS = ['apple', 'peach', 'cherry', 'orange', 'pear'];
  const FRUIT_COLOR = { apple: '#e8433b', peach: '#ffb09f', cherry: '#d6213f', orange: '#ff9a2e', pear: '#c9d84c' };

  const ITEMS = {
    apple:  { name: '사과',   icon: '🍎', price: 100, kind: 'fruit' },
    peach:  { name: '복숭아', icon: '🍑', price: 100, kind: 'fruit' },
    cherry: { name: '체리',   icon: '🍒', price: 100, kind: 'fruit' },
    orange: { name: '오렌지', icon: '🍊', price: 100, kind: 'fruit' },
    pear:   { name: '배',     icon: '🍐', price: 100, kind: 'fruit' },
    tulip:  { name: '튤립',   icon: '🌷', price: 80, kind: 'flower', color: '#ff7aa8' },
    rose:   { name: '장미',   icon: '🌹', price: 80, kind: 'flower', color: '#ff4d5e' },
    daisy:  { name: '데이지', icon: '🌼', price: 80, kind: 'flower', color: '#ffd84a' },
    hibiscus: { name: '히비스커스', icon: '🌺', price: 80, kind: 'flower', color: '#ff8a3d' },
    weed:   { name: '잡초',   icon: '🌿', price: 10, kind: 'misc' },
    shell:  { name: '조개',   icon: '🐚', price: 60, kind: 'misc' },
    stone:  { name: '돌멩이', icon: '🪨', price: 75, kind: 'misc' },
  };
  const FLOWERS = Object.keys(ITEMS).filter(k => ITEMS[k].kind === 'flower');

  const SHIRTS = ['#6cc6ff', '#ff8fb1', '#8ee07a', '#ffd84a', '#b69cff', '#ff9d5c', '#ffffff'];
  const HAIRS = ['#8a5a3b', '#3b2b20', '#f2c46d', '#e8735a', '#7a8cff', '#f59ac0'];

  const TREE_REGROW_MS = 90 * 1000;
  const SAPLING_GROW_MS = 2 * 60 * 1000;
  const ROCK_COOLDOWN_MS = 30 * 1000;
  const WEED_SPAWN_MS = 60 * 1000;
  const SHELL_SPAWN_MS = 45 * 1000;

  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  const DEFAULT_TODOS = [
    { text: '나무를 흔들어 과일 3개 모으기', goal: { event: 'fruit', count: 3 } },
    { text: '잡초 5개 뽑기', goal: { event: 'weed', count: 5 } },
    { text: '꽃 1송이 심기', goal: { event: 'plant_flower', count: 1 } },
    { text: '뭉치와 대화하기', goal: { event: 'talk', count: 1 } },
    { text: '상점 상자에 물건 팔기', goal: { event: 'sell', count: 1 } },
  ];

  // ---------------------------------------------------------
  // 유틸
  // ---------------------------------------------------------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hash2 = (x, y) => {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const key = (x, y) => x + ',' + y;
  const now = () => Date.now();
  const fmt = n => n.toLocaleString('ko-KR');
  const josa = (word, a, b) => {
    const c = word.charCodeAt(word.length - 1);
    if (c < 0xac00 || c > 0xd7a3) return word + a;
    return word + ((c - 0xac00) % 28 ? a : b);
  };

  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function ellipse(ctx, x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function circle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---------------------------------------------------------
  // 맵 생성 (시드 기반 → 저장할 필요 없음)
  // ---------------------------------------------------------
  let map, river = [], bridges = [];

  function genMap(seed) {
    const r = mulberry32(seed);
    const phase = r() * 10;
    const m = new Uint8Array(W * H);
    river = []; bridges = [];

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const e = Math.min(x, W - 1 - x, y, (H - 1 - y) * 0.7)
          + Math.sin(x * 0.5 + phase) * 0.7 + Math.cos(y * 0.45 + phase * 1.3) * 0.7;
        let t = TILE.GRASS;
        if (e < 2.2) t = TILE.WATER;
        else if (e < 4.2) t = TILE.SAND;
        m[y * W + x] = t;
      }
    }
    // 강
    for (let y = 0; y < H; y++) {
      const cx = Math.floor(W * 0.33 + Math.sin(y * 0.28 + phase) * 2.5);
      river[y] = cx;
      m[y * W + cx] = TILE.WATER;
      m[y * W + cx + 1] = TILE.WATER;
    }
    // 다리
    for (const by of [10, 21]) {
      const cx = river[by];
      m[by * W + cx] = TILE.BRIDGE;
      m[by * W + cx + 1] = TILE.BRIDGE;
      bridges.push({ x: cx, y: by });
    }
    // 집 앞 광장 & 길
    for (let y = HOUSE.y + 3; y <= HOUSE.y + 4; y++)
      for (let x = HOUSE.x - 1; x <= HOUSE.x + HOUSE.w; x++) m[y * W + x] = TILE.PATH;
    for (let y = HOUSE.y + 5; y <= HOUSE.y + 8; y++) {
      m[y * W + HOUSE.x + 1] = TILE.PATH;
      m[y * W + HOUSE.x + 2] = TILE.PATH;
    }
    return m;
  }

  const tileAt = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? TILE.WATER : map[y * W + x];
  const isHouse = (x, y) => x >= HOUSE.x && x < HOUSE.x + HOUSE.w && y >= HOUSE.y && y < HOUSE.y + HOUSE.h;
  const isShop = (x, y) => x === SHOP.x && y === SHOP.y;
  const isDoor = (x, y) => y === HOUSE.y + HOUSE.h - 1 && (x === HOUSE.x + 1 || x === HOUSE.x + 2);

  function isReserved(x, y) {
    if (x >= HOUSE.x - 1 && x <= HOUSE.x + HOUSE.w && y >= HOUSE.y - 1 && y <= HOUSE.y + 8) return true;
    if (Math.abs(x - SHOP.x) <= 1 && Math.abs(y - SHOP.y) <= 1) return true;
    if (Math.abs(x - NPC_HOME.x) <= 1 && Math.abs(y - NPC_HOME.y) <= 1) return true;
    for (const b of bridges) if (Math.abs(y - b.y) <= 1 && Math.abs(x - b.x) <= 3) return true;
    return false;
  }

  // ---------------------------------------------------------
  // 상태 & 저장
  // ---------------------------------------------------------
  let state;
  let objMap = new Map();

  function newId() { return state.nextId++; }

  function createNewState() {
    const s = {
      v: 1,
      seed: (Math.random() * 1e9) | 0,
      native: FRUITS[(Math.random() * FRUITS.length) | 0],
      island: '두근두근 섬',
      player: { x: HOUSE.x + 2, y: HOUSE.y + 4.7, dir: 'down', name: '주민', shirt: SHIRTS[0], hair: HAIRS[0] },
      bells: 1000,
      inventory: new Array(INV_SIZE).fill(null),
      selected: 0,
      objects: [],
      todos: [],
      stats: { fruit: 0, weed: 0, sold: 0, planted: 0, talk: 0 },
      friend: 0,
      nextId: 1,
      timers: { weed: now(), shell: now() },
      createdAt: now(),
    };
    state = s;
    map = genMap(s.seed);
    populate(s);
    for (const t of DEFAULT_TODOS) {
      s.todos.push({ id: newId(), text: t.text, done: false, goal: { ...t.goal }, progress: 0, createdAt: now() });
    }
    s.inventory[0] = { id: 'tulip', count: 3 };
    s.inventory[1] = { id: s.native, count: 1 };
    return s;
  }

  function populate(s) {
    const r = mulberry32(s.seed ^ 0x5eed);
    const occupied = new Set();
    const free = (x, y, type = TILE.GRASS) =>
      tileAt(x, y) === type && !isReserved(x, y) && !occupied.has(key(x, y));
    const add = o => { o.id = s.nextId++; s.objects.push(o); occupied.add(key(o.x, o.y)); };
    const rand = n => (r() * n) | 0;

    // 나무 (이웃한 나무와 간격을 둠)
    let tries = 0, trees = 0;
    while (trees < 38 && tries++ < 3000) {
      const x = rand(W), y = rand(H);
      if (!free(x, y)) continue;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++)
        for (let dx = -1; dx <= 1; dx++) if (occupied.has(key(x + dx, y + dy))) { near = true; break; }
      if (near) continue;
      add({ type: 'tree', x, y, fruit: r() < 0.7 ? 3 : 0, fruitType: s.native, regrowAt: 0 });
      trees++;
    }
    // 꽃 무리
    for (let c = 0; c < 9; c++) {
      const cx = rand(W), cy = rand(H), f = FLOWERS[rand(FLOWERS.length)];
      for (let i = 0; i < 4; i++) {
        const x = cx + rand(3) - 1, y = cy + rand(3) - 1;
        if (free(x, y)) add({ type: 'flower', x, y, item: f });
      }
    }
    const scatter = (n, make, tile) => {
      let t = 0, c = 0;
      while (c < n && t++ < 2000) {
        const x = rand(W), y = rand(H);
        if (free(x, y, tile)) { add(make(x, y)); c++; }
      }
    };
    scatter(5, (x, y) => ({ type: 'rock', x, y, readyAt: 0 }), TILE.GRASS);
    scatter(12, (x, y) => ({ type: 'weed', x, y }), TILE.GRASS);
    scatter(6, (x, y) => ({ type: 'item', x, y, item: 'shell' }), TILE.SAND);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || s.v !== 1 || !Array.isArray(s.objects) || !Array.isArray(s.todos)) return null;
      // 누락 필드 보정
      s.inventory = Array.isArray(s.inventory) ? s.inventory.slice(0, INV_SIZE) : [];
      while (s.inventory.length < INV_SIZE) s.inventory.push(null);
      s.inventory = s.inventory.map(it => (it && ITEMS[it.id] && it.count > 0) ? it : null);
      s.stats = Object.assign({ fruit: 0, weed: 0, sold: 0, planted: 0, talk: 0 }, s.stats);
      s.timers = Object.assign({ weed: now(), shell: now() }, s.timers);
      s.friend = s.friend || 0;
      // 애니메이션용 타임스탬프(performance.now 기준)는 새로고침 후 의미가 없으므로 제거
      for (const o of s.objects) { delete o.plantedAt; delete o.dropAt; delete o.shakeAt; }
      return s;
    } catch (e) {
      console.warn('저장 데이터를 불러오지 못했어요.', e);
      return null;
    }
  }

  let saveWarned = false;
  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      if (!saveWarned) { toast('⚠️ 저장에 실패했어요 (저장 공간 확인)'); saveWarned = true; }
    }
  }

  function indexObjects() {
    objMap = new Map();
    for (const o of state.objects) objMap.set(key(o.x, o.y), o);
  }
  const objAt = (x, y) => objMap.get(key(x, y));

  function addObject(o) {
    o.id = newId();
    state.objects.push(o);
    objMap.set(key(o.x, o.y), o);
  }
  function removeObject(o) {
    const i = state.objects.indexOf(o);
    if (i >= 0) state.objects.splice(i, 1);
    objMap.delete(key(o.x, o.y));
  }

  // ---------------------------------------------------------
  // 인벤토리
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // 할 일(Todo) — 추가/삭제/완료 시 자동 저장
  // ---------------------------------------------------------
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
          burst(player.x, player.y - 1, 'star', 14);
        }
      }
    }
    if (changed) renderTodos();
  }

  // ---------------------------------------------------------
  // 런타임 (저장 X)
  // ---------------------------------------------------------
  let player, npc;
  const keys = new Set();
  const particles = [];
  const critters = [];
  const bubbles = [];
  let lastPosSave = 0, posDirty = false;
  let lastActionAt = 0;
  let worldTickAcc = 0;

  function initRuntime() {
    const p = state.player;
    player = {
      x: p.x, y: p.y, dir: p.dir || 'down',
      phase: 0, moving: false, idle: 0,
    };
    // 벽 안에 끼었으면 집 앞으로
    if (blocked(player.x, player.y)) { player.x = HOUSE.x + 2; player.y = HOUSE.y + 4.7; }
    npc = {
      name: '뭉치', x: NPC_HOME.x + 0.5, y: NPC_HOME.y + 0.7, dir: 'down',
      phase: 0, moving: false, idle: 0, target: null, wait: 1.5, talkUntil: 0,
    };
    critters.length = 0;
    for (let i = 0; i < 7; i++) {
      critters.push({
        x: 4 + Math.random() * (W - 8), y: 4 + Math.random() * (H - 10),
        vx: 0, vy: 0, ph: Math.random() * 6,
        color: ['#fff3a8', '#ffc4e0', '#c9e7ff', '#ffffff'][i % 4],
      });
    }
  }

  // ---------------------------------------------------------
  // 충돌
  // ---------------------------------------------------------
  function isSolid(tx, ty) {
    const t = tileAt(tx, ty);
    if (t === TILE.WATER) return true;
    if (isHouse(tx, ty) || isShop(tx, ty)) return true;
    const o = objAt(tx, ty);
    return !!o && (o.type === 'tree' || o.type === 'rock');
  }
  function blocked(x, y) {
    const r = 0.28, top = 0.25;
    return isSolid(Math.floor(x - r), Math.floor(y - top)) || isSolid(Math.floor(x + r), Math.floor(y - top)) ||
      isSolid(Math.floor(x - r), Math.floor(y - 0.02)) || isSolid(Math.floor(x + r), Math.floor(y - 0.02));
  }
  function moveEntity(e, dx, dy) {
    let moved = false;
    if (dx && !blocked(e.x + dx, e.y)) { e.x += dx; moved = true; }
    if (dy && !blocked(e.x, e.y + dy)) { e.y += dy; moved = true; }
    return moved;
  }
  const ownTile = e => [Math.floor(e.x), Math.floor(e.y - 0.15)];
  function facingTile() {
    const [ox, oy] = ownTile(player);
    const d = DIRS[player.dir];
    return [ox + d[0], oy + d[1]];
  }
  function npcInFront() {
    const [fx, fy] = facingTile();
    const dF = Math.hypot(npc.x - (fx + 0.5), npc.y - (fy + 0.6));
    const dP = Math.hypot(npc.x - player.x, npc.y - player.y);
    return dF < 0.9 || dP < 0.9;
  }

  // ---------------------------------------------------------
  // 행동
  // ---------------------------------------------------------
  function describeTarget() {
    if (npcInFront()) return { kind: 'npc', label: '대화하기' };
    const [fx, fy] = facingTile();
    if (isShop(fx, fy)) return { kind: 'shop', label: '물건 팔기' };
    if (isDoor(fx, fy)) return { kind: 'door', label: '문 두드리기' };
    const [ox, oy] = ownTile(player);
    const o = objAt(fx, fy) || objAt(ox, oy);
    if (!o) return null;
    const labels = { tree: '나무 흔들기', rock: '바위 두드리기', flower: '꽃 꺾기', weed: '잡초 뽑기', item: '줍기', sapling: '묘목 캐기' };
    return { kind: 'obj', obj: o, label: labels[o.type] };
  }

  function action() {
    const t = now();
    if (t - lastActionAt < 250) return;
    lastActionAt = t;

    const target = describeTarget();
    if (!target) { say(player, ['음… 아무것도 없네.', '♪ 흥얼흥얼~', '오늘도 좋은 하루!'][(Math.random() * 3) | 0]); return; }

    if (target.kind === 'npc') return talkToNpc();
    if (target.kind === 'shop') { sellSelected(); save(); return; }
    if (target.kind === 'door') { say(player, '똑똑… 🏠 나의 아늑한 집이야!'); return; }

    const o = target.obj;
    switch (o.type) {
      case 'tree': shakeTree(o); break;
      case 'rock': hitRock(o); break;
      case 'flower':
        if (addItem(o.item)) { removeObject(o); burst(o.x + 0.5, o.y + 0.5, 'petal', 8, ITEMS[o.item].color); toast(`${ITEMS[o.item].icon} ${josa(ITEMS[o.item].name, '을', '를')} 꺾었다!`); }
        break;
      case 'weed':
        if (addItem('weed')) {
          removeObject(o); state.stats.weed++;
          burst(o.x + 0.5, o.y + 0.5, 'leaf', 6);
          toast('🌿 잡초를 뽑았다! 섬이 깨끗해졌어요');
          progressTodos('weed');
        }
        break;
      case 'item': {
        const it = ITEMS[o.item];
        if (addItem(o.item)) {
          removeObject(o);
          burst(o.x + 0.5, o.y + 0.5, 'star', 6);
          toast(`${it.icon} ${josa(it.name, '을', '를')} 주웠다!`);
          if (it.kind === 'fruit') { state.stats.fruit++; progressTodos('fruit'); }
        }
        break;
      }
      case 'sapling':
        if (addItem(o.fruitType)) { removeObject(o); toast('🌱 묘목을 다시 캤어요'); }
        break;
    }
    save();
    renderHud();
  }

  function shakeTree(tree) {
    tree.shakeAt = performance.now();
    burst(tree.x + 0.5, tree.y - 0.3, 'leaf', 8);
    if (tree.fruit > 0) {
      const spots = [[0, 1], [-1, 1], [1, 1], [-1, 0], [1, 0]];
      let dropped = 0;
      for (const [dx, dy] of spots) {
        if (dropped >= tree.fruit) break;
        const x = tree.x + dx, y = tree.y + dy;
        const tt = tileAt(x, y);
        if ((tt === TILE.GRASS || tt === TILE.SAND || tt === TILE.PATH) && !objAt(x, y) && !isHouse(x, y) && !isShop(x, y)) {
          addObject({ type: 'item', x, y, item: tree.fruitType, dropAt: performance.now() });
          dropped++;
        }
      }
      for (let i = dropped; i < tree.fruit; i++) {
        if (addItem(tree.fruitType)) { state.stats.fruit++; progressTodos('fruit'); }
      }
      toast(`${ITEMS[tree.fruitType].icon} ${josa(ITEMS[tree.fruitType].name, '이', '가')} 떨어졌다!`);
      tree.fruit = 0;
      tree.regrowAt = now() + TREE_REGROW_MS;
    } else if (Math.random() < 0.12) {
      const b = 100 + ((Math.random() * 5) | 0) * 100;
      state.bells += b;
      toast(`💰 나무에서 ${fmt(b)}벨이 떨어졌다!`);
      burst(tree.x + 0.5, tree.y + 0.5, 'star', 10);
    } else {
      say(player, '살랑살랑~ 아무것도 없네.');
    }
    progressTodos('shake');
  }

  function hitRock(rock) {
    rock.shakeAt = performance.now();
    if (now() < (rock.readyAt || 0)) { say(player, '지금은 아무것도 안 나와…'); return; }
    if (addItem('stone')) {
      rock.readyAt = now() + ROCK_COOLDOWN_MS;
      burst(rock.x + 0.5, rock.y + 0.4, 'dust', 8);
      toast('🪨 돌멩이를 얻었다!');
    }
  }

  function sellSelected() {
    const s = selectedItem();
    if (!s) { say(player, '팔 물건을 먼저 골라야 해!'); return; }
    const it = ITEMS[s.id];
    const total = it.price * s.count;
    state.bells += total;
    state.stats.sold += s.count;
    toast(`📦 ${it.icon} ${it.name} ${s.count}개를 ${fmt(total)}벨에 팔았다!`);
    state.inventory[state.selected] = null;
    burst(SHOP.x + 0.5, SHOP.y, 'star', 12);
    renderInventory();
    progressTodos('sell');
  }

  const NPC_LINES = [
    '오늘 날씨 정말 좋다냥~ ☀️',
    '나무를 흔들면 과일이 떨어진다냥!',
    '상점 상자에 물건을 넣으면 벨을 받을 수 있다냥.',
    '과일을 땅에 심으면 나무로 자란다냥 🌱',
    '잡초가 많으면 섬이 슬퍼한다냥…',
    '바닷가에는 조개가 떠밀려 온다냥 🐚',
    '꽃을 심어서 섬을 예쁘게 꾸며보자냥!',
  ];
  function talkToNpc() {
    npc.talkUntil = performance.now() + 2500;
    npc.target = null;
    npc.dir = Math.abs(player.x - npc.x) > Math.abs(player.y - npc.y)
      ? (player.x < npc.x ? 'left' : 'right') : (player.y < npc.y ? 'up' : 'down');

    const s = selectedItem();
    if (s && ITEMS[s.id].kind === 'fruit') {
      const name = ITEMS[s.id].name;
      takeSelected(1);
      state.friend++;
      state.bells += 300;
      say(npc, `와! ${josa(name, '이', '가')}다냥! 고마워~ 답례로 300벨! 💕`);
      burst(npc.x, npc.y - 1.2, 'heart', 8);
    } else {
      const extra = state.friend >= 3 ? [`${state.player.name}, 우리 완전 단짝이다냥! 💖`] : [];
      const lines = NPC_LINES.concat(extra);
      say(npc, lines[(Math.random() * lines.length) | 0]);
    }
    state.stats.talk++;
    progressTodos('talk');
    save();
    renderHud();
  }

  function placeSelected() {
    const s = selectedItem();
    if (!s) { toast('먼저 가방에서 아이템을 골라주세요'); return; }
    const [fx, fy] = facingTile();
    const t = tileAt(fx, fy);
    const walkable = t === TILE.GRASS || t === TILE.SAND || t === TILE.PATH;
    if (!walkable || isHouse(fx, fy) || isShop(fx, fy) || objAt(fx, fy) || npcInFront()) {
      say(player, '여기엔 놓을 수 없어!');
      return;
    }
    const it = ITEMS[s.id];
    if (it.kind === 'flower' && t === TILE.GRASS) {
      takeSelected(1);
      addObject({ type: 'flower', x: fx, y: fy, item: s.id, plantedAt: performance.now() });
      state.stats.planted++;
      toast(`${it.icon} ${josa(it.name, '을', '를')} 심었다!`);
      progressTodos('plant_flower');
    } else if (it.kind === 'fruit' && t === TILE.GRASS) {
      takeSelected(1);
      addObject({ type: 'sapling', x: fx, y: fy, fruitType: s.id, grownAt: now() + SAPLING_GROW_MS });
      state.stats.planted++;
      toast(`🌱 ${josa(it.name, '을', '를')} 심었다! 곧 나무가 자랄 거예요`);
      progressTodos('plant_tree');
    } else {
      takeSelected(1);
      addObject({ type: 'item', x: fx, y: fy, item: s.id, dropAt: performance.now() });
      toast(`${it.icon} ${josa(it.name, '을', '를')} 내려놓았다`);
    }
    burst(fx + 0.5, fy + 0.6, 'dust', 5);
    save();
  }

  // ---------------------------------------------------------
  // 월드 시간 흐름 (과일 재생, 묘목 성장, 잡초/조개 생성)
  // ---------------------------------------------------------
  function tickWorld() {
    const t = now();
    let changed = false;
    for (const o of state.objects) {
      if (o.type === 'tree' && o.fruit < 3 && o.regrowAt && t >= o.regrowAt) {
        o.fruit = 3; o.regrowAt = 0; changed = true;
      } else if (o.type === 'sapling' && t >= o.grownAt) {
        o.type = 'tree'; o.fruit = 0; o.regrowAt = t + TREE_REGROW_MS; o.shakeAt = performance.now();
        delete o.grownAt; changed = true;
        // 플레이어가 그 자리에 있으면 살짝 밀어냄
        if (blocked(player.x, player.y)) player.y += 0.6;
        toast('🌳 심었던 묘목이 나무로 자랐어요!');
      }
    }
    const count = type => state.objects.filter(o => o.type === type || (type === 'shell' && o.item === 'shell')).length;
    const spawnOn = (tile, make) => {
      for (let i = 0; i < 40; i++) {
        const x = (Math.random() * W) | 0, y = (Math.random() * H) | 0;
        if (tileAt(x, y) !== tile || objAt(x, y) || isReserved(x, y)) continue;
        if (Math.hypot(x + 0.5 - player.x, y + 0.5 - player.y) < 3) continue;
        addObject(make(x, y));
        return true;
      }
      return false;
    };
    if (t - state.timers.weed > WEED_SPAWN_MS) {
      state.timers.weed = t;
      if (count('weed') < 14 && spawnOn(TILE.GRASS, (x, y) => ({ type: 'weed', x, y }))) changed = true;
    }
    if (t - state.timers.shell > SHELL_SPAWN_MS) {
      state.timers.shell = t;
      if (count('shell') < 7 && spawnOn(TILE.SAND, (x, y) => ({ type: 'item', x, y, item: 'shell' }))) changed = true;
    }
    if (changed) save();
  }

  // ---------------------------------------------------------
  // NPC
  // ---------------------------------------------------------
  function updateNpc(dt) {
    const tNow = performance.now();
    npc.idle += dt;
    if (tNow < npc.talkUntil) { npc.moving = false; return; }
    if (!npc.target) {
      npc.moving = false;
      npc.wait -= dt;
      if (npc.wait <= 0) {
        for (let i = 0; i < 10; i++) {
          const tx = NPC_HOME.x + ((Math.random() * 9) | 0) - 4;
          const ty = NPC_HOME.y + ((Math.random() * 7) | 0) - 3;
          if (!isSolid(tx, ty)) { npc.target = { x: tx + 0.5, y: ty + 0.7 }; npc.stuck = 0; break; }
        }
        npc.wait = 1 + Math.random() * 3;
      }
      return;
    }
    const dx = npc.target.x - npc.x, dy = npc.target.y - npc.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.08) { npc.target = null; return; }
    const sp = 1.6 * dt;
    const mx = clamp(dx, -sp, sp), my = clamp(dy, -sp, sp);
    // 플레이어와 겹치지 않게
    const nx = npc.x + mx, ny = npc.y + my;
    if (Math.hypot(nx - player.x, ny - player.y) < 0.6) { npc.target = null; return; }
    const moved = moveEntity(npc, mx, my);
    npc.moving = moved;
    if (Math.abs(dx) > Math.abs(dy)) npc.dir = dx < 0 ? 'left' : 'right';
    else npc.dir = dy < 0 ? 'up' : 'down';
    if (moved) npc.phase += dt * 10;
    else if ((npc.stuck += dt) > 0.6) npc.target = null;
  }

  // ---------------------------------------------------------
  // 파티클 / 말풍선 / 토스트
  // ---------------------------------------------------------
  function burst(x, y, type, n, color) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 2.5;
      particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2,
        life: 0.7 + Math.random() * 0.6, max: 1.3, type, color,
        rot: Math.random() * 6,
      });
    }
  }
  function say(who, text) {
    const i = bubbles.findIndex(b => b.who === who);
    if (i >= 0) bubbles.splice(i, 1);
    bubbles.push({ who, text, until: performance.now() + 2600 });
  }
  const toastBox = document.getElementById('toastBox');
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    toastBox.appendChild(el);
    while (toastBox.children.length > 3) toastBox.firstChild.remove();
    setTimeout(() => el.remove(), 2700);
  }

  // ---------------------------------------------------------
  // 그리기 — 타일
  // ---------------------------------------------------------
  function drawTile(ctx, x, y, time) {
    const t = tileAt(x, y);
    const px = x * T, py = y * T;
    const h = hash2(x, y);
    if (t === TILE.GRASS) {
      ctx.fillStyle = (x + y) % 2 ? '#93d46c' : '#8dcf66';
      ctx.fillRect(px, py, T, T);
      if (h % 4 === 0) {
        ctx.strokeStyle = '#72b653'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        const gx = px + 10 + (h % 26), gy = py + 14 + ((h >> 5) % 22);
        ctx.beginPath();
        ctx.moveTo(gx - 4, gy - 5); ctx.lineTo(gx - 1, gy);
        ctx.moveTo(gx + 4, gy - 6); ctx.lineTo(gx + 1, gy);
        ctx.stroke();
      } else if (h % 11 === 1) {
        ctx.fillStyle = '#fff'; circle(ctx, px + 12 + (h % 24), py + 12 + ((h >> 4) % 24), 2);
      }
    } else if (t === TILE.SAND) {
      ctx.fillStyle = '#f6e3a8'; ctx.fillRect(px, py, T, T);
      ctx.fillStyle = '#ead08a';
      circle(ctx, px + 8 + (h % 30), py + 10 + ((h >> 3) % 28), 1.6);
      circle(ctx, px + 6 + ((h >> 6) % 34), py + 6 + ((h >> 9) % 34), 1.3);
    } else if (t === TILE.PATH) {
      ctx.fillStyle = '#e2c595'; ctx.fillRect(px, py, T, T);
      ctx.fillStyle = '#d4b27d';
      rr(ctx, px + 6 + (h % 10), py + 8 + ((h >> 4) % 10), 12, 8, 4); ctx.fill();
      rr(ctx, px + 24 + ((h >> 2) % 10), py + 26 + ((h >> 6) % 10), 14, 9, 4); ctx.fill();
    } else { // 물 & 다리
      ctx.fillStyle = '#5cc4e8'; ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2;
      const off = Math.sin(time / 700 + x * 0.9 + y * 0.6) * 4;
      ctx.beginPath();
      ctx.moveTo(px + 8 + off, py + 18); ctx.quadraticCurveTo(px + 14 + off, py + 13, px + 20 + off, py + 18);
      ctx.moveTo(px + 26 - off, py + 36); ctx.quadraticCurveTo(px + 32 - off, py + 31, px + 38 - off, py + 36);
      ctx.stroke();
      // 물가 거품
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      const land = (tx, ty) => { const k = tileAt(tx, ty); return k !== TILE.WATER && k !== TILE.BRIDGE; };
      const f = 3 + Math.sin(time / 500 + x + y) * 1.5;
      if (land(x, y - 1)) ctx.fillRect(px, py, T, f);
      if (land(x, y + 1)) ctx.fillRect(px, py + T - f, T, f);
      if (land(x - 1, y)) ctx.fillRect(px, py, f, T);
      if (land(x + 1, y)) ctx.fillRect(px + T - f, py, f, T);
      if (t === TILE.BRIDGE) {
        ctx.fillStyle = '#b98553'; ctx.fillRect(px, py + 4, T, T - 8);
        ctx.strokeStyle = '#8c5d33'; ctx.lineWidth = 2;
        for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(px + i * 12, py + 4); ctx.lineTo(px + i * 12, py + T - 4); ctx.stroke(); }
        ctx.fillStyle = '#8c5d33'; ctx.fillRect(px, py + 2, T, 4); ctx.fillRect(px, py + T - 6, T, 4);
      }
    }
  }

  // ---------------------------------------------------------
  // 그리기 — 오브젝트
  // ---------------------------------------------------------
  function drawFruit(ctx, x, y, type, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (type === 'cherry') {
      ctx.strokeStyle = '#5a8a2e'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-4, 0); ctx.quadraticCurveTo(0, -8, 1, -9); ctx.moveTo(4, 1); ctx.quadraticCurveTo(2, -6, 1, -9); ctx.stroke();
      ctx.fillStyle = FRUIT_COLOR.cherry; circle(ctx, -4, 1, 4.5); circle(ctx, 4, 2, 4.5);
      ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(ctx, -5.5, -0.5, 1.3); circle(ctx, 2.5, 0.5, 1.3);
    } else {
      ctx.fillStyle = FRUIT_COLOR[type];
      if (type === 'pear') { circle(ctx, 0, 2, 7); circle(ctx, 0, -3, 4.8); }
      else circle(ctx, 0, 0, 7.5);
      if (type === 'peach') { ctx.strokeStyle = 'rgba(220,110,110,.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -6); ctx.quadraticCurveTo(-3, 0, 0, 6); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.55)'; circle(ctx, -2.8, -2.8, 2);
      ctx.fillStyle = '#5a8a2e'; ctx.beginPath(); ctx.ellipse(3, -8, 3.5, 1.8, -0.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawShadow(ctx, x, y, rx, ry) {
    ctx.fillStyle = 'rgba(40,70,20,.2)';
    ellipse(ctx, x, y, rx, ry);
  }

  function drawTree(ctx, o, time) {
    const cx = (o.x + 0.5) * T, base = (o.y + 1) * T - 8;
    const sh = o.shakeAt ? Math.max(0, 1 - (time - o.shakeAt) / 500) : 0;
    const sway = Math.sin(time / 40) * 4 * sh;
    drawShadow(ctx, cx, base, 22, 7);
    ctx.fillStyle = '#9b6a3f'; rr(ctx, cx - 7, base - 26, 14, 26, 5); ctx.fill();
    ctx.fillStyle = '#86592f'; ctx.fillRect(cx + 1, base - 24, 3, 20);
    ctx.save(); ctx.translate(cx + sway, base - 34);
    ctx.fillStyle = '#3f9a45'; circle(ctx, 0, 6, 27); circle(ctx, -17, 10, 17); circle(ctx, 17, 10, 17);
    ctx.fillStyle = '#56b858'; circle(ctx, 0, -2, 24); circle(ctx, -15, 4, 15); circle(ctx, 15, 4, 15);
    ctx.fillStyle = '#6fcb68'; circle(ctx, -6, -10, 10); circle(ctx, 9, -6, 7);
    const spots = [[-12, 6], [11, 8], [0, -8]];
    for (let i = 0; i < (o.fruit || 0); i++) drawFruit(ctx, spots[i][0], spots[i][1], o.fruitType, 0.95);
    ctx.restore();
  }

  function drawSapling(ctx, o, time) {
    const cx = (o.x + 0.5) * T, base = (o.y + 1) * T - 12;
    const p = clamp(1 - (o.grownAt - now()) / SAPLING_GROW_MS, 0, 1);
    const s = 0.6 + p * 0.6;
    drawShadow(ctx, cx, base + 2, 10, 4);
    ctx.fillStyle = '#b89464'; ellipse(ctx, cx, base, 11, 4);
    ctx.save(); ctx.translate(cx, base); ctx.scale(s, s);
    ctx.rotate(Math.sin(time / 600 + o.x) * 0.05);
    ctx.strokeStyle = '#6a9c3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -20); ctx.stroke();
    ctx.fillStyle = '#7ccf5c';
    ctx.beginPath(); ctx.ellipse(-7, -20, 8, 4, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(7, -22, 8, 4, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawFlower(ctx, o, time) {
    const it = ITEMS[o.item];
    const cx = (o.x + 0.5) * T, base = (o.y + 1) * T - 12;
    const grow = o.plantedAt ? clamp((time - o.plantedAt) / 400, 0, 1) : 1;
    drawShadow(ctx, cx, base + 2, 9, 3);
    ctx.save(); ctx.translate(cx, base); ctx.scale(grow, grow);
    ctx.rotate(Math.sin(time / 800 + o.x * 1.7 + o.y) * 0.08);
    ctx.strokeStyle = '#4f9e3f'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -16); ctx.stroke();
    ctx.fillStyle = '#6cc15a'; ctx.beginPath(); ctx.ellipse(-5, -6, 5, 2.5, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = it.color;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      circle(ctx, Math.cos(a) * 6, -20 + Math.sin(a) * 6, 5);
    }
    ctx.fillStyle = o.item === 'daisy' ? '#ff9d2e' : '#fff3a0'; circle(ctx, 0, -20, 3.5);
    ctx.restore();
  }

  function drawWeed(ctx, o) {
    const cx = (o.x + 0.5) * T, base = (o.y + 1) * T - 14;
    ctx.fillStyle = '#4f9e3f';
    for (const [dx, h, a] of [[-6, 12, -0.4], [0, 16, 0], [6, 12, 0.4], [-2, 10, -0.15], [3, 11, 0.2]]) {
      ctx.save(); ctx.translate(cx + dx, base); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(-2.5, 0); ctx.quadraticCurveTo(0, -h * 1.2, 0.5, -h); ctx.quadraticCurveTo(1, -h * 0.5, 2.5, 0); ctx.fill();
      ctx.restore();
    }
  }

  function drawRock(ctx, o, time) {
    const cx = (o.x + 0.5) * T, base = (o.y + 1) * T - 8;
    const sh = o.shakeAt ? Math.max(0, 1 - (time - o.shakeAt) / 300) : 0;
    const jx = Math.sin(time / 25) * 2 * sh;
    drawShadow(ctx, cx, base, 20, 6);
    ctx.fillStyle = '#9aa1ad';
    ctx.beginPath(); ctx.ellipse(cx + jx, base - 14, 20, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b8bfca'; ctx.beginPath(); ctx.ellipse(cx - 5 + jx, base - 19, 11, 8, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#eef1f5'; circle(ctx, cx - 9 + jx, base - 22, 3);
  }

  function drawItem(ctx, o, time) {
    const cx = (o.x + 0.5) * T, cy = (o.y + 1) * T - 18;
    const d = o.dropAt ? clamp((time - o.dropAt) / 350, 0, 1) : 1;
    const hop = (1 - d) * -30 + Math.sin(d * Math.PI) * -8;
    drawShadow(ctx, cx, cy + 10, 9, 3);
    const it = ITEMS[o.item];
    if (it.kind === 'fruit') drawFruit(ctx, cx, cy + hop, o.item, 1.2);
    else {
      ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(it.icon, cx, cy + hop);
    }
  }

  function drawHouse(ctx, time, night) {
    const x = HOUSE.x * T, y = HOUSE.y * T, w = HOUSE.w * T;
    drawShadow(ctx, x + w / 2, y + 3 * T - 4, w / 2 + 6, 10);
    // 벽
    ctx.fillStyle = '#fff4dc'; rr(ctx, x + 8, y + T * 0.9, w - 16, T * 2.1 - 4, 8); ctx.fill();
    ctx.strokeStyle = '#e7d3aa'; ctx.lineWidth = 3; ctx.stroke();
    // 굴뚝
    ctx.fillStyle = '#c96b56'; ctx.fillRect(x + w - 50, y - 26, 16, 34);
    // 연기
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    for (let i = 0; i < 3; i++) {
      const p = ((time / 1600) + i / 3) % 1;
      circle(ctx, x + w - 42 + Math.sin(p * 6) * 5, y - 30 - p * 40, 5 + p * 6);
    }
    // 지붕
    ctx.fillStyle = '#ec7a62';
    ctx.beginPath();
    ctx.moveTo(x - 6, y + T); ctx.lineTo(x + 24, y - 20); ctx.lineTo(x + w - 24, y - 20); ctx.lineTo(x + w + 6, y + T);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d65f49'; ctx.fillRect(x - 6, y + T - 8, w + 12, 10);
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    for (let i = 0; i < 6; i++) ctx.fillRect(x + 22 + i * 26, y - 10, 12, 4);
    // 창문
    const win = night ? '#ffe28a' : '#bfe8ff';
    for (const wx of [x + 22, x + w - 58]) {
      ctx.fillStyle = win; rr(ctx, wx, y + T * 1.35, 36, 30, 6); ctx.fill();
      ctx.strokeStyle = '#b98553'; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(wx + 18, y + T * 1.35); ctx.lineTo(wx + 18, y + T * 1.35 + 30); ctx.stroke();
      if (night) { ctx.fillStyle = 'rgba(255,220,120,.25)'; circle(ctx, wx + 18, y + T * 1.35 + 15, 34); }
    }
    // 문
    ctx.fillStyle = '#b98553'; rr(ctx, x + w / 2 - 20, y + T * 2.1, 40, T * 0.9 - 4, 10); ctx.fill();
    ctx.fillStyle = '#ffd84a'; circle(ctx, x + w / 2 + 12, y + T * 2.55, 3);
    // 문패
    ctx.fillStyle = '#fff'; rr(ctx, x + w / 2 - 26, y + T * 1.1, 52, 18, 6); ctx.fill();
    ctx.fillStyle = '#6b4f2e'; ctx.font = '12px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(state.player.name, x + w / 2, y + T * 1.1 + 9);
  }

  function drawShop(ctx) {
    const cx = (SHOP.x + 0.5) * T, base = (SHOP.y + 1) * T - 6;
    drawShadow(ctx, cx, base, 22, 6);
    ctx.fillStyle = '#c98f55'; rr(ctx, cx - 20, base - 30, 40, 30, 5); ctx.fill();
    ctx.fillStyle = '#a8713c'; ctx.fillRect(cx - 20, base - 20, 40, 3); ctx.fillRect(cx - 20, base - 10, 40, 3);
    ctx.fillStyle = '#8c5d33'; rr(ctx, cx - 23, base - 36, 46, 9, 4); ctx.fill();
    ctx.fillStyle = '#fff'; rr(ctx, cx - 16, base - 58, 32, 20, 6); ctx.fill();
    ctx.strokeStyle = '#e7d3aa'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#b7862a'; ctx.font = '13px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('💰판매', cx, base - 48);
  }

  // ---------------------------------------------------------
  // 그리기 — 캐릭터
  // ---------------------------------------------------------
  function drawCharacter(ctx, e, look, time) {
    const px = e.x * T, py = e.y * T;
    const walk = e.moving ? Math.sin(e.phase) : 0;
    const bob = e.moving ? Math.abs(Math.sin(e.phase)) * 2.5 : Math.sin(e.idle * 2.2) * 0.8;
    const side = e.dir === 'left' ? -1 : e.dir === 'right' ? 1 : 0;
    const blink = (time % 3600) < 120;
    const skin = look.animal ? look.fur : '#ffe0c4';

    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = 'rgba(40,70,20,.22)'; ellipse(ctx, 0, 0, 14, 5);
    ctx.translate(0, -bob);

    // 꼬리 (고양이)
    if (look.animal) {
      ctx.strokeStyle = look.fur; ctx.lineWidth = 5; ctx.lineCap = 'round';
      const tx = side ? -side * 10 : 9;
      ctx.beginPath(); ctx.moveTo(tx * 0.6, -16);
      ctx.quadraticCurveTo(tx * 1.8, -18, tx * 1.6, -30 + Math.sin(time / 300) * 3); ctx.stroke();
    }

    // 다리
    ctx.fillStyle = look.pants;
    if (side === 0) {
      const l1 = Math.max(0, walk) * 3, l2 = Math.max(0, -walk) * 3;
      rr(ctx, -8, -13 - l1, 7, 11, 3); ctx.fill();
      rr(ctx, 1, -13 - l2, 7, 11, 3); ctx.fill();
      ctx.fillStyle = '#7a5236';
      rr(ctx, -9, -5 - l1, 9, 5, 2.5); ctx.fill();
      rr(ctx, 0, -5 - l2, 9, 5, 2.5); ctx.fill();
    } else {
      rr(ctx, -4 + walk * 4, -13, 7, 11, 3); ctx.fill();
      rr(ctx, -3 - walk * 4, -13, 7, 11, 3); ctx.fill();
      ctx.fillStyle = '#7a5236';
      rr(ctx, -4 + walk * 4 + side * 1, -5, 9, 5, 2.5); ctx.fill();
      rr(ctx, -3 - walk * 4 + side * 1, -5, 9, 5, 2.5); ctx.fill();
    }

    // 팔 (뒤쪽)
    ctx.fillStyle = skin;
    if (side === 0) {
      circle(ctx, -14, -21 + walk * 2, 4.5);
      circle(ctx, 14, -21 - walk * 2, 4.5);
    }

    // 몸
    ctx.fillStyle = look.shirt; rr(ctx, -12, -32, 24, 22, 9); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.08)'; rr(ctx, -12, -16, 24, 6, 4); ctx.fill();
    if (e.dir === 'down') {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(-7, -32); ctx.lineTo(0, -26); ctx.lineTo(7, -32); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(ctx, 0, -22, 1.5); circle(ctx, 0, -17, 1.5);
    }
    if (side !== 0) {
      ctx.fillStyle = skin; circle(ctx, walk * 6, -21, 4.5);
    }

    // 귀 (고양이)
    const hy = -48;
    if (look.animal) {
      ctx.fillStyle = look.fur;
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(s * 17, hy - 4); ctx.lineTo(s * 13, hy - 23); ctx.lineTo(s * 3, hy - 14); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = '#ffb3c6';
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(s * 14, hy - 8); ctx.lineTo(s * 12.5, hy - 18); ctx.lineTo(s * 6, hy - 13); ctx.closePath(); ctx.fill();
      }
    }

    // 머리
    ctx.fillStyle = skin; circle(ctx, 0, hy, 18);

    // 머리카락 (사람)
    if (!look.animal) {
      ctx.fillStyle = look.hair;
      if (e.dir === 'up') {
        circle(ctx, 0, hy, 18.8);
      } else if (side === 0) {
        ctx.beginPath(); ctx.arc(0, hy, 18.8, Math.PI, Math.PI * 2); ctx.fill();
        circle(ctx, -9, hy - 7, 8); circle(ctx, 1, hy - 9, 9); circle(ctx, 10, hy - 7, 7);
        rr(ctx, -19.5, hy - 6, 7, 16, 3.5); ctx.fill();
        rr(ctx, 12.5, hy - 6, 7, 16, 3.5); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(0, hy, 18.8, Math.PI, Math.PI * 2); ctx.fill();
        circle(ctx, -side * 8, hy + 1, 14);
        circle(ctx, side * 6, hy - 8, 8);
      }
    } else {
      // 이마 줄무늬
      ctx.strokeStyle = look.stripe; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath();
      for (const s of [-5, 0, 5]) { ctx.moveTo(s, hy - 17); ctx.lineTo(s, hy - 11); }
      ctx.stroke();
    }

    // 얼굴
    if (e.dir !== 'up') {
      const eyes = side === 0 ? [-6.5, 6.5] : [side * 8];
      ctx.fillStyle = '#3a2a22';
      for (const ex of eyes) {
        if (blink) { ctx.fillRect(ex - 3, hy + 3, 6, 1.8); continue; }
        ellipse(ctx, ex, hy + 3, 2.8, 3.8);
        ctx.fillStyle = '#fff'; circle(ctx, ex - 0.9, hy + 1.6, 1.2); ctx.fillStyle = '#3a2a22';
      }
      ctx.fillStyle = 'rgba(255,120,140,.45)';
      const cheeks = side === 0 ? [-11.5, 11.5] : [side * 12];
      for (const c of cheeks) ellipse(ctx, c, hy + 9, 3.8, 2.3);
      const mx = side === 0 ? 0 : side * 10;
      if (look.animal) {
        ctx.fillStyle = '#fff5e6'; ellipse(ctx, mx * 0.9, hy + 10, 6.5, 4.5);
        ctx.fillStyle = '#ff8fa3'; ellipse(ctx, mx * 0.9, hy + 7.5, 2.2, 1.6);
        ctx.strokeStyle = 'rgba(80,60,40,.5)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for (const s of side === 0 ? [-1, 1] : [side]) {
          ctx.moveTo(mx + s * 7, hy + 9); ctx.lineTo(mx + s * 15, hy + 7);
          ctx.moveTo(mx + s * 7, hy + 11); ctx.lineTo(mx + s * 15, hy + 12);
        }
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#a8563f'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(mx, hy + 9, 2.6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      }
    }

    // 머리 위 잎사귀
    if (look.leaf) {
      ctx.save(); ctx.translate(3, hy - 19); ctx.rotate(0.4 + Math.sin(time / 500) * 0.1);
      ctx.fillStyle = '#7cc864'; ctx.beginPath(); ctx.ellipse(0, -5, 4, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#4f9e3f'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, -10); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawBubble(ctx, x, y, text) {
    ctx.font = '14px Jua, sans-serif';
    const maxW = 210;
    const lines = [];
    let line = '';
    for (const ch of text) {
      if (ctx.measureText(line + ch).width > maxW) { lines.push(line); line = ch; }
      else line += ch;
    }
    if (line) lines.push(line);
    const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 22;
    const h = lines.length * 18 + 14;
    const bx = x - w / 2, by = y - h - 10;
    ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = '#e0cfa8'; ctx.lineWidth = 3;
    rr(ctx, bx, by, w, h, 12); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 7, by + h - 1); ctx.lineTo(x, by + h + 9); ctx.lineTo(x + 7, by + h - 1); ctx.closePath();
    ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 7, by + h); ctx.lineTo(x, by + h + 9); ctx.lineTo(x + 7, by + h); ctx.stroke();
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(x - 6, by + h - 3, 12, 3);
    ctx.fillStyle = '#6b4f2e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, x, by + 16 + i * 18));
  }

  function drawNameTag(ctx, x, y, text) {
    ctx.font = '13px Jua, sans-serif';
    const w = ctx.measureText(text).width + 14;
    ctx.fillStyle = 'rgba(255,143,177,.95)'; rr(ctx, x - w / 2, y - 10, w, 20, 10); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + 1);
  }

  // ---------------------------------------------------------
  // 파티클 / 곤충 그리기
  // ---------------------------------------------------------
  function drawParticles(ctx) {
    for (const p of particles) {
      const a = clamp(p.life / 0.6, 0, 1);
      ctx.globalAlpha = a;
      const x = p.x * T, y = p.y * T;
      if (p.type === 'leaf') { ctx.fillStyle = '#5fbf5a'; ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot); ctx.beginPath(); ctx.ellipse(0, 0, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      else if (p.type === 'petal') { ctx.fillStyle = p.color || '#ff9ebd'; circle(ctx, x, y, 3.5); }
      else if (p.type === 'dust') { ctx.fillStyle = '#e8dcc2'; circle(ctx, x, y, 4); }
      else if (p.type === 'heart') { ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💗', x, y); }
      else { ctx.fillStyle = '#ffe066'; drawStar(ctx, x, y, 5, p.rot); }
    }
    ctx.globalAlpha = 1;
  }
  function drawStar(ctx, x, y, r, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? r * 0.45 : r;
      const a = (i / 10) * Math.PI * 2;
      ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function drawCritters(ctx, time, night) {
    for (const c of critters) {
      const x = c.x * T, y = c.y * T;
      if (night) {
        const g = 0.5 + Math.sin(time / 300 + c.ph) * 0.5;
        ctx.fillStyle = `rgba(255,240,140,${0.25 * g})`; circle(ctx, x, y, 10);
        ctx.fillStyle = `rgba(255,250,190,${0.6 + g * 0.4})`; circle(ctx, x, y, 2.5);
      } else {
        const f = Math.abs(Math.sin(time / 90 + c.ph));
        ctx.fillStyle = c.color;
        ctx.beginPath(); ctx.ellipse(x - 4 * f, y, 5 * f + 1, 4, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 4 * f, y, 5 * f + 1, 4, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#6b4f2e'; ctx.fillRect(x - 0.8, y - 3, 1.6, 6);
      }
    }
  }

  // ---------------------------------------------------------
  // 낮/밤
  // ---------------------------------------------------------
  function daylight() {
    const d = new Date();
    const h = d.getHours() + d.getMinutes() / 60;
    // 반환: [밤 어둠 정도, 노을 정도]
    if (h >= 7 && h < 17) return [0, 0];
    if (h >= 17 && h < 19) return [(h - 17) / 2 * 0.2, 0.18];
    if (h >= 19 && h < 20) return [0.2 + (h - 19) * 0.2, 0.1 * (20 - h)];
    if (h >= 5 && h < 7) return [0.4 * (7 - h) / 2, 0.12];
    return [0.42, 0];
  }

  // ---------------------------------------------------------
  // 메인 루프
  // ---------------------------------------------------------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let cw = 0, ch = 0, dpr = 1, zoom = 1;

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = r.width; ch = r.height;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    zoom = clamp(cw / (15 * T), 0.62, 1.25);
  }

  function update(dt) {
    let dx = 0, dy = 0;
    if (keys.has('left')) dx -= 1;
    if (keys.has('right')) dx += 1;
    if (keys.has('up')) dy -= 1;
    if (keys.has('down')) dy += 1;
    player.idle += dt;
    if (dx || dy) {
      if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
      const run = keys.has('run');
      const sp = (run ? 6.2 : 3.8) * dt;
      if (dy) player.dir = dy < 0 ? 'up' : 'down';
      if (dx && (!dy || Math.abs(dx) >= Math.abs(dy))) player.dir = dx < 0 ? 'left' : 'right';
      const moved = moveEntity(player, dx * sp, dy * sp);
      player.moving = moved;
      if (moved) {
        player.phase += dt * (run ? 16 : 11);
        posDirty = true;
        if (run && Math.random() < 0.3) particles.push({ x: player.x, y: player.y, vx: -dx, vy: -0.5, life: 0.4, type: 'dust', rot: 0 });
      }
    } else {
      player.moving = false;
    }

    // 위치 저장 (1.5초 간격으로 스로틀)
    const t = performance.now();
    if (posDirty && t - lastPosSave > 1500) {
      syncPlayer();
      save();
      lastPosSave = t; posDirty = false;
    }

    updateNpc(dt);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += 5 * dt; p.rot += dt * 4;
      if (p.type === 'heart' || p.type === 'star') p.vy -= 4.5 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (const c of critters) {
      c.ph += dt;
      c.vx += (Math.random() - 0.5) * dt * 6; c.vy += (Math.random() - 0.5) * dt * 6;
      c.vx = clamp(c.vx, -1.2, 1.2); c.vy = clamp(c.vy, -1.2, 1.2);
      c.x = clamp(c.x + c.vx * dt, 3, W - 3); c.y = clamp(c.y + c.vy * dt, 3, H - 5);
    }
    for (let i = bubbles.length - 1; i >= 0; i--) if (t > bubbles[i].until) bubbles.splice(i, 1);

    worldTickAcc += dt;
    if (worldTickAcc > 1) { worldTickAcc = 0; tickWorld(); }
  }

  function syncPlayer() {
    state.player.x = +player.x.toFixed(3);
    state.player.y = +player.y.toFixed(3);
    state.player.dir = player.dir;
  }

  const lookPlayer = () => ({ shirt: state.player.shirt, hair: state.player.hair, pants: '#5b6b9a', leaf: true });
  const lookNpc = { animal: true, fur: '#f4b860', stripe: '#d98f3a', shirt: '#ff8fb1', pants: '#e76f94' };

  function render(time) {
    const [dark, dusk] = daylight();
    const night = dark > 0.25;
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0);
    const vw = cw / zoom, vh = ch / zoom;
    const camX = W * T <= vw ? (W * T - vw) / 2 : clamp(player.x * T - vw / 2, 0, W * T - vw);
    const camY = H * T <= vh ? (H * T - vh) / 2 : clamp((player.y - 0.5) * T - vh / 2, 0, H * T - vh);
    ctx.fillStyle = '#5cc4e8';
    ctx.fillRect(0, 0, vw, vh);
    ctx.save();
    ctx.translate(-Math.round(camX), -Math.round(camY));

    const x0 = Math.max(0, Math.floor(camX / T) - 1), x1 = Math.min(W - 1, Math.ceil((camX + vw) / T) + 1);
    const y0 = Math.max(0, Math.floor(camY / T) - 1), y1 = Math.min(H - 1, Math.ceil((camY + vh) / T) + 2);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) drawTile(ctx, x, y, time);

    // 바라보는 칸 표시
    const target = describeTarget();
    const [fx, fy] = facingTile();
    if (target || selectedItem()) {
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
      ctx.lineDashOffset = -time / 60;
      rr(ctx, fx * T + 4, fy * T + 4, T - 8, T - 8, 10); ctx.stroke();
      ctx.setLineDash([]);
    }

    // 깊이 정렬
    const list = [];
    for (const o of state.objects) {
      if (o.x < x0 - 1 || o.x > x1 + 1 || o.y < y0 - 1 || o.y > y1 + 2) continue;
      const depth = o.type === 'tree' || o.type === 'rock' ? o.y + 0.85 : o.y + 0.6;
      list.push({ d: depth, fn: () => drawObject(o, time) });
    }
    list.push({ d: HOUSE.y + HOUSE.h - 0.05, fn: () => drawHouse(ctx, time, night) });
    list.push({ d: SHOP.y + 0.9, fn: () => drawShop(ctx) });
    list.push({ d: npc.y, fn: () => drawCharacter(ctx, npc, lookNpc, time) });
    list.push({ d: player.y, fn: () => drawCharacter(ctx, player, lookPlayer(), time) });
    list.sort((a, b) => a.d - b.d);
    for (const it of list) it.fn();

    drawParticles(ctx);
    drawCritters(ctx, time, night);

    if (Math.hypot(npc.x - player.x, npc.y - player.y) < 3.5 && !bubbles.some(b => b.who === npc)) {
      drawNameTag(ctx, npc.x * T, npc.y * T - 84, '🐱 ' + npc.name);
    }
    for (const b of bubbles) drawBubble(ctx, b.who.x * T, b.who.y * T - 78, b.text);

    ctx.restore();

    // 낮/밤 오버레이
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (dusk) { ctx.fillStyle = `rgba(255,140,70,${dusk})`; ctx.fillRect(0, 0, cw, ch); }
    if (dark) { ctx.fillStyle = `rgba(20,30,90,${dark})`; ctx.fillRect(0, 0, cw, ch); }
  }

  function drawObject(o, time) {
    switch (o.type) {
      case 'tree': return drawTree(ctx, o, time);
      case 'sapling': return drawSapling(ctx, o, time);
      case 'flower': return drawFlower(ctx, o, time);
      case 'weed': return drawWeed(ctx, o);
      case 'rock': return drawRock(ctx, o, time);
      case 'item': return drawItem(ctx, o, time);
    }
  }

  let lastT = 0;
  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0);
    lastT = t;
    update(dt);
    render(t);
    updateHint();
    requestAnimationFrame(loop);
  }

  // ---------------------------------------------------------
  // UI (HUD / 인벤토리 / 할 일 / 캐릭터)
  // ---------------------------------------------------------
  const $ = id => document.getElementById(id);
  const hotbar = $('hotbar');
  const slotEls = [];

  function buildHotbar() {
    hotbar.innerHTML = '';
    for (let i = 0; i < INV_SIZE; i++) {
      const b = document.createElement('button');
      b.className = 'slot';
      b.type = 'button';
      b.addEventListener('click', () => selectSlot(i));
      hotbar.appendChild(b);
      slotEls.push(b);
    }
  }
  function selectSlot(i) {
    state.selected = i;
    renderInventory();
    save();
  }
  function renderInventory() {
    state.inventory.forEach((s, i) => {
      const el = slotEls[i];
      el.classList.toggle('selected', i === state.selected);
      el.innerHTML = `<span class="num">${(i + 1) % 10}</span>` +
        (s ? `${ITEMS[s.id].icon}<span class="count">${s.count}</span>` : '');
      el.title = s ? `${ITEMS[s.id].name} × ${s.count} (${fmt(ITEMS[s.id].price)}벨)` : '빈 칸';
    });
    const s = selectedItem();
    $('selectedName').textContent = s
      ? `${ITEMS[s.id].icon} ${ITEMS[s.id].name} × ${s.count} · 개당 ${fmt(ITEMS[s.id].price)}벨`
      : '선택한 아이템 없음';
    renderHud();
  }
  function renderHud() {
    $('bells').textContent = fmt(state.bells);
    $('playerChip').textContent = `🙂 ${state.player.name}`;
    $('islandTitle').textContent = state.island;
    document.title = `${state.island} 생활`;
    renderStats();
  }
  let lastHint = null;
  function updateHint() {
    const t = describeTarget();
    const touch = matchMedia('(hover: none), (pointer: coarse)').matches;
    let h = t ? `${touch ? '행동' : 'Space'}: ${t.label}` : '';
    if (!t && selectedItem()) {
      const it = ITEMS[selectedItem().id];
      h = `${touch ? '심기' : 'Q'}: ${it.name} ${it.kind === 'fruit' || it.kind === 'flower' ? '심기' : '내려놓기'}`;
    }
    if (h !== lastHint) { $('hint').textContent = h; lastHint = h; }
  }
  function updateClock() {
    const d = new Date();
    const h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
    const icon = h >= 7 && h < 17 ? '☀️' : h >= 17 && h < 20 ? '🌇' : '🌙';
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    $('clock').textContent = `${icon} ${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]}) ${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${m}`;
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
    if (!el) return;
    const days = Math.max(1, Math.ceil((now() - (state.createdAt || now())) / 86400000));
    el.innerHTML = `
      🏝️ 섬 이름: <b>${escapeHtml(state.island)}</b><br>
      ${ITEMS[state.native].icon} 특산 과일: ${ITEMS[state.native].name}<br>
      📅 섬 생활 ${days}일째<br>
      🍎 모은 과일: ${state.stats.fruit}개 · 🌿 뽑은 잡초: ${state.stats.weed}개<br>
      🌱 심은 것: ${state.stats.planted}개 · 📦 판 물건: ${state.stats.sold}개<br>
      🐱 뭉치와의 우정: ${'💗'.repeat(Math.min(5, state.friend)) || '🤍'}`;
  }
  const escapeHtml = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function buildSwatches(elId, colors, prop) {
    const box = $(elId);
    box.innerHTML = '';
    for (const c of colors) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch' + (state.player[prop] === c ? ' active' : '');
      b.style.background = c;
      b.addEventListener('click', () => {
        state.player[prop] = c;
        save();
        buildSwatches(elId, colors, prop);
      });
      box.appendChild(b);
    }
  }

  function bindUI() {
    // 탭
    document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + tab.dataset.tab));
    }));

    // 할 일
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

    // 캐릭터
    $('nameInput').value = state.player.name;
    $('islandInput').value = state.island;
    $('nameInput').addEventListener('input', e => {
      state.player.name = e.target.value.trim() || '주민';
      save(); renderHud();
    });
    $('islandInput').addEventListener('input', e => {
      state.island = e.target.value.trim() || '두근두근 섬';
      save(); renderHud();
    });
    buildSwatches('shirtSwatches', SHIRTS, 'shirt');
    buildSwatches('hairSwatches', HAIRS, 'hair');
    $('resetBtn').addEventListener('click', () => {
      if (!confirm('정말 섬을 처음부터 다시 시작할까요?\n모든 저장 데이터가 사라져요.')) return;
      try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 무시 */ }
      resetting = true;
      location.reload();
    });

    $('btnPlace').addEventListener('click', placeSelected);
  }

  // ---------------------------------------------------------
  // 입력
  // ---------------------------------------------------------
  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ShiftLeft: 'run', ShiftRight: 'run',
  };
  const typing = () => {
    const a = document.activeElement;
    return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA');
  };

  function bindInput() {
    window.addEventListener('keydown', e => {
      if (typing()) return;
      const k = KEYMAP[e.code];
      if (k) { keys.add(k); e.preventDefault(); return; }
      if (e.repeat) return;
      if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter' || e.code === 'KeyZ') { e.preventDefault(); action(); }
      else if (e.code === 'KeyQ' || e.code === 'KeyX') { e.preventDefault(); placeSelected(); }
      else if (/^Digit\d$/.test(e.code)) {
        const n = +e.code.slice(5);
        selectSlot(n === 0 ? 9 : n - 1);
      }
    });
    window.addEventListener('keyup', e => {
      const k = KEYMAP[e.code];
      if (k) keys.delete(k);
    });
    window.addEventListener('blur', () => keys.clear());

    // 터치 패드
    document.querySelectorAll('.dpad .d').forEach(btn => {
      const k = btn.dataset.key;
      const on = e => { e.preventDefault(); keys.add(k); btn.classList.add('pressed'); };
      const off = e => { e.preventDefault(); keys.delete(k); btn.classList.remove('pressed'); };
      btn.addEventListener('pointerdown', on);
      btn.addEventListener('pointerup', off);
      btn.addEventListener('pointerleave', off);
      btn.addEventListener('pointercancel', off);
    });
    $('btnA').addEventListener('pointerdown', e => { e.preventDefault(); action(); });
    $('btnB').addEventListener('pointerdown', e => { e.preventDefault(); placeSelected(); });
  }

  // ---------------------------------------------------------
  // 시작
  // ---------------------------------------------------------
  let resetting = false;

  function start() {
    const loaded = loadState();
    if (loaded) {
      state = loaded;
      map = genMap(state.seed);
    } else {
      createNewState();
    }
    indexObjects();
    initRuntime();
    buildHotbar();
    renderInventory();
    renderTodos();
    bindUI();
    bindInput();
    resize();
    window.addEventListener('resize', resize);
    updateClock();
    setInterval(updateClock, 1000);

    // 새로고침/탭 닫기 직전에 위치 저장
    const flush = () => { if (resetting) return; syncPlayer(); save(); };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

    save();
    if (loaded) toast(`🏝️ ${state.player.name}님, ${state.island}에 다시 오신 걸 환영해요!`);
    else toast('🏝️ 새로운 섬에 도착했어요! 도움말 탭을 확인해 보세요');
    setTimeout(() => say(npc, `안녕 ${state.player.name}! 오늘도 즐겁게 놀자냥~`), 800);

    requestAnimationFrame(t => { lastT = t; loop(t); });
  }

  start();
})();
