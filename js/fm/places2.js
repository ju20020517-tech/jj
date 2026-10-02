/* =========================================================
 *  새 명소 2 — 🎤 버스킹 무대 · 🌱 주민 텃밭 · 🏮 마츠리 광장(🎆 불꽃놀이) · 🎣 낚시 대회 부두 · ♨️ 노천탕 이용
 *   - 3D: 각 명소의 무대/텃밭/축제 소품 (월드 생성 때 FM.Places2(scene, T) 로 지음)
 *   - 놀이: 플레이어 선택지 + 주민 이벤트 + 일정표(야외 명소) 연결
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, D = FM.D;
  if (!Sim || !Soc) return;
  const PI = Math.PI;
  const P = 'P', S = () => Sim.get();
  const hour = () => Sim.time.hour(), day = () => Sim.time.day();
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const W2 = FM.Will;
  const sty = (v, t) => (v && W2 && W2.sty ? W2.sty(v, t) : t);
  const free = v => v && !v.child && !v.staff && !v.visitor && !v.sceneId && !v.talkingToPlayer && !(v.status && v.status.hospital) && v.loc !== 'metro' && !(Sim.asleep && Sim.asleep(v, hour()));
  const has = (v, k) => Sim.has(v, k);
  const toast = t => FM.UI && FM.UI.toast(t), sfx = k => FM.Audio && FM.Audio.sfx && FM.Audio.sfx(k);
  const log = (t, ids, imp = 2) => Sim.log('rel', t, ids, imp);

  // ---------- 새 행동 ----------
  Object.assign(D.ACTIONS, {
    tend_crop: { name: '텃밭 물 주기', state: 'INTERACT_OBJ', pose: 'water', prop: 'wateringCan', need: 'farm', emote: '🌱', dur: 7 },
    busk_watch: { name: '버스킹 구경', state: 'SIT_REST', pose: 'sit', seat: true, need: 'busk_seat', emote: '🎵', dur: 9 },
    festival_food: { name: '노점 먹거리', state: 'INTERACT_OBJ', pose: 'eat', prop: 'snack', need: 'yatai', emote: '🍡', dur: 6 },
    festival_watch: { name: '축제 구경', state: 'WATCH_LOOK', pose: 'lookUp', need: 'fireworks', emote: '🏮', dur: 7 },
    soak: { name: '노천탕에 몸 담그기', state: 'SIT_REST', pose: 'bathe', need: 'onsen', emote: '♨️', dur: 12 },
    wash: { name: '몸 씻기', state: 'SIT_REST', pose: 'sit', emote: '🧼', dur: 6 },
    photo_pose: { name: '사진 포즈', state: 'INTERACT_OBJ', pose: 'pose', emote: '📸', dur: 5 },
    makeup: { name: '화장 고치기', state: 'INTERACT_OBJ', pose: 'mirror', emote: '💄', dur: 6 },
  });
  // ---------- 일정표 연결 ----------
  const w = (v, t) => { let s = 0.3; for (const [k, x] of Object.entries(t)) if (has(v, k) || v.value === k || v.moral === k) s += x; return s; };
  const Sch = FM.Schedule;
  if (Sch && Sch.OUT) {
    Sch.OUT.push(
      ['busk', 15, 23, '버스킹 무대 구경', v => w(v, { MUSIC: 3, MUSICIAN: 3, ARTISTIC: 2, EXTROVERT: 1, ROMANTIC: 1, FUN: 1 }), [[18, 22, 1.6]], ['busk_watch', 'cheer', 'look_around']],
      ['farm', 6, 19, '텃밭 가꾸기', v => w(v, { GARDEN: 4, NATURE: 3, DILIGENT: 1.5, FAMILY: 1, HOMEBODY: 1, PURE: 1 }), [[6, 10, 1.5], [16, 18.5, 1.2]], ['tend_crop', 'pull_weeds', 'tend_crop']],
      ['matsuri', 16, 24, '마츠리 광장 축제', v => w(v, { FUN: 2.5, EXTROVERT: 2, FOOD: 2, TRADITION: 1.5, ROMANTIC: 1, CUTIE: 1, BEAGLE: 1 }), [[19, 23, 1.8]], ['festival_food', 'festival_watch', 'look_around']],
      ['fishpier', 6, 20, '부두 낚시', v => w(v, { FISHING: 4, NATURE: 1.5, INTROVERT: 1, ADVENTURER: 1, LAZY: 0.5 }), [[6, 9, 1.4], [16, 19, 1.3]], ['fish', 'watch_sea', 'fish']],
    );
    if (Sch.NIGHT) ['matsuri', 'busk', 'onsen'].forEach(k => Sch.NIGHT.add(k));
    if (Sch.PEAK) Object.assign(Sch.PEAK, { onsen: [[18, 24, 1.8], [6, 8, 1.3]], photo: [[11, 18, 1.2]] });
  }
  if (FM.Outing && FM.Outing.BUILDINGS) {
    const B = FM.Outing.BUILDINGS;
    if (!B.some(b => b[0] === 'onsen')) B.push(['onsen', 6, 25, '달맞이 온천', v => w(v, { LAZY: 2, ANXIOUS: 1.5, TRADITION: 1.5, NATURE: 1, ELEGANT: 1, HOMEBODY: 0.5, SLOTH: 1.5 }) + ((v.stress || 0) > 45 ? 2 : 0) + ((v.depression || 0) > 40 ? 1.5 : 0)]);
    if (!B.some(b => b[0] === 'photo')) B.push(['photo', 10, 20, '추억 사진관', v => w(v, { FASHIONISTA: 2, CUTIE: 2, FAME: 1.5, ROMANTIC: 1.5, FAMILY: 1.5, FRIENDSHIP: 1.5, CHIC: 1 }) + (Soc.partnerOf(v.id) ? 1 : 0)]);
  }

  // 명소 안의 원래 나무는 치움 (소품 자리)
  const RECTS = [[9, 25, 51, 65], [-117, -103, -79, -64], [45, 79, -40, -6], [-50, -20, -100, -82], [-80, -70, 84, 90], [29, 43, -26, -12], [103, 117, -42, -26], [104, 124, -20, -2]];
  const inR = (x, z) => RECTS.some(([a, b, c, d]) => x > a && x < b && z > c && z < d);
  if (FM.DECOR) { const a = FM.DECOR.trees; for (let i = a.length - 1; i >= 0; i--) if (inR(a[i].x, a[i].z)) a.splice(i, 1); const fl = FM.DECOR.flowers; for (let i = fl.length - 1; i >= 0; i--) if (inR(fl[i].x, fl[i].z)) fl.splice(i, 1); }
  if (Sim.SPOTS) { const Sp = Sim.SPOTS; for (let i = Sp.length - 1; i >= 0; i--) if (!Sp[i].place && inR(Sp[i].x, Sp[i].z)) Sp.splice(i, 1); }

  // =========================================================
  // 3D 소품
  // =========================================================
  const mc = new Map();
  const lam = (c, o) => { const k = c + JSON.stringify(o || {}); if (!mc.has(k)) mc.set(k, new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}))); return mc.get(k); };
  const glow = c => FM.PM.glowMat(c), glass = c => FM.PM.glassMat(c);
  const tm = (k, c) => FM.AC.tm(k, c);
  const GC = {}; const geo = (k, f) => GC[k] || (GC[k] = f());
  const B = (w, h, d) => geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
  const C = (a, b, h, s = 12) => geo(`c${a},${b},${h},${s}`, () => new THREE.CylinderGeometry(a, b, h, s));
  const SP = (r, a = 10, b = 8) => geo(`s${r},${a},${b}`, () => new THREE.SphereGeometry(r, a, b));
  const add = (g, gg, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(gg, typeof m === 'number' ? lam(m) : m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  const sign = (t, w, h, bg, fg) => FM.PM.sign(t, w, h, bg, fg);
  const KK = g => ({ add: o => { g.add(o); return o; } });
  let T0 = null, SCENE = null;
  const put = (root, o, x, z, ry = 0, dy = 0) => { o.position.set(x, T0.height(x, z) + dy, z); o.rotation.y = ry; root.add(o); return o; };
  const disc = (root, x, z, r, map, y = 0.07) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 40), map); m.rotation.x = -PI / 2; m.position.set(x, T0.height(x, z) + y, z); m.receiveShadow = true; root.add(m); return m; };
  const rect = (root, x, z, w, d, map, y = 0.07) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), map); m.rotation.x = -PI / 2; m.position.set(x, T0.height(x, z) + y, z); m.receiveShadow = true; root.add(m); return m; };
  const ctexMat = (key, w, h, draw, rep) => { const t = FM.PM.ctex(key, w, h, draw); if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return new THREE.MeshLambertMaterial({ map: t, polygonOffset: true, polygonOffsetFactor: -4 }); };
  const radialTex = () => FM.PM.ctex('p2rad2', 64, 64, (c, w, h) => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, 'rgba(255,255,255,0.85)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
  const nightGlows = [];

  // ---------- 🎤 산토리니 버스킹 무대 ----------
  function buildBusk(root) {
    const g = new THREE.Group(); const X = 17, Z = 58;
    const cob = ctexMat('p2cobW', 128, 128, (c, w, h) => { c.fillStyle = '#9a9a9e'; c.fillRect(0, 0, w, h); for (let y = 0; y < h + 18; y += 18) for (let x = ((y / 18) % 2) * 12 - 12; x < w + 12; x += 24) { c.fillStyle = `rgb(${236 + ((x + y) % 14)},${236 + ((x + y) % 14)},${234})`; c.beginPath(); c.ellipse(x + 10, y + 8, 10.5, 7.5, 0.1, 0, 7); c.fill(); } }, [5, 5]);
    disc(root, X, Z, 7.6, cob);
    // 무대 (흰 단 + 파란 타일 띠) · 흰 산토리니 벽
    put(root, (() => { const s = new THREE.Group(); add(s, B(5.2, 0.45, 2.6), 0xfbfbf6, 0, 0.22, 0); add(s, B(5.22, 0.2, 0.02), tm('tile', 0x3a6ad8), 0, 0.22, 1.31); for (let i = 0; i < 3; i++) add(s, B(1.6, 0.15, 0.4), 0xf0f0ec, 0, 0.07 + i * 0.0, 1.5 + i * 0.0); return s; })(), X, 55.6);
    const wall = new THREE.Group();
    add(wall, B(7.2, 3.0, 0.5), tm('stucco', 0xfbfbf6), 0, 1.5, 0); add(wall, B(2.4, 1.2, 0.5), tm('stucco', 0xfbfbf6), -1.2, 3.4, 0); const dome = add(wall, SP(1.0, 16, 8), 0x2a5ad0, -1.2, 4.0, 0); dome.scale.y = 0.6;
    for (const x of [-2.6, 1.4, 2.8]) { add(wall, B(0.6, 1.0, 0.06), 0x2a5ad0, x, 1.8, 0.27); const a = add(wall, geo('p2arch', () => new THREE.CircleGeometry(0.3, 12, 0, PI)), 0x2a5ad0, x, 2.3, 0.28); void a; }
    add(wall, B(1.0, 2.0, 0.06), 0x2a5ad0, 0.0, 1.0, 0.27);
    for (let i = 0; i < 26; i++) add(wall, SP(0.16, 6, 5), [0xe83a8a, 0xff6aaa, 0xd82a7a][i % 3], 2.2 + (i % 6) * 0.22 - 0.5, 2.8 + Math.floor(i / 6) * 0.2 - (i % 6) * 0.08, 0.3);   // 부겐빌레아
    for (let i = 0; i < 8; i++) add(wall, SP(0.2, 6, 5), tm('leaf', 0x3a7a3a), 1.7 + (i % 4) * 0.35, 2.4 + Math.floor(i / 4) * 0.4, 0.28).scale.z = 0.5;
    const lights = []; for (let i = 0; i <= 12; i++) { const t = i / 12; const b = add(wall, SP(0.07, 6, 5), glow(0xfff4c8), -3.4 + t * 6.8, 2.9 - Math.sin(t * PI) * 0.35, 1.6); lights.push(b); }
    put(root, wall, X, 54.0);
    // 흰 업라이트 피아노 + 의자
    const pn = new THREE.Group(); add(pn, B(1.5, 1.25, 0.6), 0xfbfaf6, 0, 0.62, 0); add(pn, B(1.4, 0.06, 0.32), 0xfbfaf6, 0, 0.78, 0.42); for (let i = 0; i < 14; i++) add(pn, B(0.09, 0.02, 0.18), i % 3 === 2 ? 0x1a1a1a : 0xffffff, -0.6 + i * 0.093, 0.82, 0.46); add(pn, B(0.4, 0.3, 0.02), 0xfbf6e8, 0, 1.08, 0.31); add(pn, B(0.7, 0.4, 0.4), 0xfbfaf6, 0, 0.2, 0.9);
    put(root, pn, 14.6, 55.6, 0, 0.45);
    // 줄무늬 커피 노점 · 파란 공중전화 · 이정표 · 플라밍고 · 서핑보드 · 가로등 · 청록 난간
    const kiosk = new THREE.Group(); add(kiosk, B(2.0, 1.0, 0.8), new THREE.MeshLambertMaterial({ map: FM.AC.stripe('#2a5ad0', '#ffffff') }), 0, 0.5, 0); add(kiosk, B(2.1, 0.06, 0.9), 0xfbfbf6, 0, 1.03, 0); for (const s of [-1, 1]) add(kiosk, B(0.06, 1.4, 0.06), 0xfbfbf6, s * 0.95, 1.75, -0.35); const aw = add(kiosk, B(2.3, 0.06, 1.1), new THREE.MeshLambertMaterial({ map: FM.AC.stripe('#2a5ad0', '#ffffff') }), 0, 2.45, 0.1); aw.rotation.x = 0.2; add(kiosk, B(0.4, 0.45, 0.35), 0x23365e, -0.5, 1.28, -0.1); add(kiosk, C(0.06, 0.05, 0.1), 0xffffff, 0.2, 1.11, 0.1); add(kiosk, C(0.06, 0.05, 0.1), 0x2a5ad0, 0.45, 1.11, 0.05);
    put(root, kiosk, 11.0, 54.8, 0.25);
    const booth = new THREE.Group(); add(booth, B(0.9, 2.3, 0.9), 0x1a4ab8, 0, 1.15, 0); add(booth, B(0.7, 1.5, 0.02), glass(0xcfe8ff), 0, 1.2, 0.46); add(booth, B(1.0, 0.15, 1.0), 0x1a4ab8, 0, 2.38, 0); const bs = sign('TELEPHONE', 0.7, 0.14, '#1a4ab8', '#ffffff'); bs.position.set(0, 2.15, 0.47); booth.add(bs); put(root, booth, 23.2, 55.4, -0.3);
    const post = new THREE.Group(); add(post, C(0.06, 0.07, 2.8), 0xfbf6e8, 0, 1.4, 0); [['🏖️ 해변', 0.3], ['♨️ 온천', -0.25], ['🎆 마츠리', 0.4], ['📸 사진관', -0.35], ['🎣 낚시 부두', 0.2]].forEach(([t, r], i) => { const s = sign(t, 1.1, 0.24, '#e8f4fb', '#2a5ad0'); s.position.set(0.45, 2.5 - i * 0.32, 0); s.rotation.y = r; post.add(s); }); put(root, post, 24.2, 60.8);
    const fl = new THREE.Group(); add(fl, SP(0.25, 10, 8), 0xff8ab0, 0, 1.1, 0).scale.set(1.3, 0.9, 0.8); const nk = add(fl, C(0.04, 0.05, 0.6), 0xff8ab0, 0.2, 1.5, 0); nk.rotation.z = -0.3; add(fl, SP(0.1, 8, 6), 0xff8ab0, 0.32, 1.78, 0); add(fl, C(0.015, 0.015, 0.9), 0xff8ab0, -0.05, 0.45, 0); put(root, fl, 22.4, 53.6);
    const sb = new THREE.Group(); const brd = add(sb, SP(0.5, 14, 8), new THREE.MeshLambertMaterial({ map: FM.AC.stripe('#2a5ad0', '#ffffff') })); brd.scale.set(0.4, 2.2, 0.08); brd.position.y = 1.05; brd.rotation.z = 0.1; put(root, sb, 20.6, 53.7);
    for (const [x, z] of [[13.4, 54.6], [20.6, 54.6], [10.6, 61.8], [23.4, 61.8]]) { const lp = new THREE.Group(); add(lp, C(0.07, 0.1, 3.0), 0xfbf6e8, 0, 1.5, 0); add(lp, B(0.36, 0.5, 0.36), glass(0xfff4d8), 0, 3.2, 0); const b = add(lp, SP(0.12, 8, 6), glow(0xffe0a0), 0, 3.2, 0); b.userData.lampBulb = true; add(lp, geo('p2lc', () => new THREE.ConeGeometry(0.3, 0.25, 4)), 0xfbf6e8, 0, 3.55, 0).rotation.y = PI / 4; put(root, lp, x, z); }
    const rail = (len) => { const r = new THREE.Group(); for (const y of [0.45, 0.95]) add(r, B(len, 0.1, 0.1), 0x2aa8a0, 0, y, 0); for (let i = 0; i <= Math.round(len / 0.9); i++) add(r, B(0.14, 1.1, 0.14), 0x2aa8a0, -len / 2 + i * len / Math.round(len / 0.9), 0.55, 0); return r; };
    put(root, rail(4.6), 11.2, 63.8, 0.15); put(root, rail(4.6), 22.8, 63.8, -0.15);
    for (const [x, z] of [[12.0, 64.6], [22.0, 64.6]]) { const pl = new THREE.Group(); add(pl, B(1.2, 0.5, 0.5), 0xfbfbf6, 0, 0.25, 0); if (FM.Flora) FM.Flora.bush(KK(pl), ['daisy', 'bell'], [0xffffff, 0x6a9aff, 0x2a5ad0], 0, 0, 0.4, 9, 0.85, x); put(root, pl, x, z); }
    root.add(g);
    return { lights };
  }

  // ---------- 🌱 텃밭 ----------
  const CROPS = {
    tomato: { name: '🍅 방울토마토', price: 20, sell: 70 }, carrot: { name: '🥕 당근', price: 15, sell: 55 }, cabbage: { name: '🥬 양배추', price: 15, sell: 55 },
    strawberry: { name: '🍓 딸기', price: 25, sell: 85 }, corn: { name: '🌽 옥수수', price: 20, sell: 65 }, pumpkin: { name: '🎃 호박', price: 30, sell: 110 }, sunflower: { name: '🌻 해바라기', price: 15, sell: 60 },
  };
  const FO = [FM.MAP.P.farm.x + 115, FM.MAP.P.farm.z - 50];   // 텃밭 원래 자리(-115, 50) 기준 이동량
  const BEDS = [[-117.6, 46.4], [-112.4, 46.4], [-117.6, 49.4], [-112.4, 49.4], [-117.6, 52.4], [-112.4, 52.4]].map(([x, z]) => [x + FO[0], z + FO[1]]);
  const farm = () => { const st = S(); if (!st.farm) st.farm = { beds: BEDS.map((_, i) => (i < 3 ? { crop: ['tomato', 'cabbage', 'carrot'][i], g: 1 + (i % 2), wet: day() } : { crop: null, g: 0 })) }; return st.farm; };
  let farmRoot = null;
  function cropMesh(crop, stage) {
    const g = new THREE.Group(); const leaf = tm('leaf', 0x5aa848);
    if (!crop) return g;
    if (stage <= 0) { for (let i = 0; i < 6; i++) add(g, SP(0.05, 5, 4), 0x8aa060, -1.2 + i * 0.48, 0.42, (i % 2 - 0.5) * 0.4); return g; }
    const s = stage >= 3 ? 1 : stage === 2 ? 0.75 : 0.45;
    for (let i = 0; i < 6; i++) {
      const x = -1.25 + i * 0.5, z = (i % 2 - 0.5) * 0.45, sub = new THREE.Group(); sub.position.set(x, 0.38, z); g.add(sub);
      if (crop === 'tomato') { add(sub, C(0.015, 0.015, 1.1 * s, 4), 0xc8a060, 0, 0.55 * s, 0); for (let k = 0; k < 4; k++) add(sub, SP(0.14 * s, 7, 5), leaf, Math.cos(k * 1.6) * 0.1, (0.3 + k * 0.2) * s, Math.sin(k * 1.6) * 0.1); if (stage >= 3) for (let k = 0; k < 5; k++) add(sub, SP(0.05, 6, 5), 0xe8302a, Math.cos(k * 1.3) * 0.13, (0.35 + k * 0.12), Math.sin(k * 1.3) * 0.13); }
      else if (crop === 'carrot') { for (let k = 0; k < 5; k++) { const l = add(sub, C(0.006, 0.02, 0.35 * s, 3), 0x4a9a3a, Math.cos(k * 1.3) * 0.04, 0.17 * s, Math.sin(k * 1.3) * 0.04); l.rotation.set(Math.sin(k) * 0.4, 0, Math.cos(k) * 0.4); } if (stage >= 3) add(sub, C(0.05, 0.01, 0.12, 6), 0xff8a2a, 0, 0.03, 0); }
      else if (crop === 'cabbage') { const b = add(sub, SP(0.2 * s, 9, 7), tm('leaf', 0x8ac86a), 0, 0.15 * s, 0); b.scale.y = 0.8; for (let k = 0; k < 5; k++) { const l = add(sub, SP(0.13 * s, 6, 5), leaf, Math.cos(k * 1.26) * 0.2 * s, 0.08, Math.sin(k * 1.26) * 0.2 * s); l.scale.y = 0.4; } }
      else if (crop === 'strawberry') { for (let k = 0; k < 5; k++) { const l = add(sub, SP(0.08 * s + 0.03, 6, 5), leaf, Math.cos(k * 1.26) * 0.12, 0.08, Math.sin(k * 1.26) * 0.12); l.scale.y = 0.5; } if (stage >= 3) for (let k = 0; k < 4; k++) add(sub, geo('berry', () => new THREE.ConeGeometry(0.04, 0.08, 6)), 0xe8203a, Math.cos(k * 1.6 + 0.5) * 0.16, 0.05, Math.sin(k * 1.6 + 0.5) * 0.16).rotation.x = PI; if (stage >= 2) add(sub, SP(0.025, 5, 4), 0xffffff, 0, 0.14, 0); }
      else if (crop === 'corn') { add(sub, C(0.03, 0.04, 1.6 * s, 5), 0x6aa04a, 0, 0.8 * s, 0); for (let k = 0; k < 4; k++) { const l = add(sub, B(0.05, 0.6 * s, 0.01), 0x5aa848, Math.cos(k * 1.6) * 0.08, (0.5 + k * 0.25) * s, Math.sin(k * 1.6) * 0.08); l.rotation.set(Math.sin(k * 1.6) * 0.8, k, Math.cos(k * 1.6) * 0.8); } if (stage >= 3) add(sub, C(0.05, 0.04, 0.26, 7), 0xf8d040, 0.06, 1.0, 0).rotation.z = 0.3; }
      else if (crop === 'pumpkin') { if (i % 2 === 0) { for (let k = 0; k < 4; k++) { const l = add(sub, SP(0.14, 6, 5), leaf, Math.cos(k * 1.6) * 0.25, 0.06, Math.sin(k * 1.6) * 0.25); l.scale.y = 0.35; } if (stage >= 2) { const pk = add(sub, SP(0.24 * s, 10, 8), 0xf08a2a, 0.05, 0.16 * s, 0); pk.scale.y = 0.75; add(sub, C(0.02, 0.02, 0.1, 5), 0x5a7a3a, 0.05, 0.36 * s, 0); } } }
      else if (crop === 'sunflower') { add(sub, C(0.025, 0.035, 1.8 * s, 5), 0x5a9a3a, 0, 0.9 * s, 0); for (let k = 0; k < 3; k++) { const l = add(sub, SP(0.1, 6, 5), leaf, Math.cos(k * 2.1) * 0.1, (0.4 + k * 0.4) * s, Math.sin(k * 2.1) * 0.1); l.scale.set(1.4, 0.3, 0.9); } if (stage >= 2 && FM.Flora) { const fh = FM.Flora.bloom(KK(sub), 'daisy', 0xffc820, 0, 1.75 * s, 0.05, stage >= 3 ? 3.2 : 2.0, -0.4, 0); void fh; } }
    }
    return g;
  }
  function refreshFarm() {
    if (!farmRoot || !T0) return;
    while (farmRoot.children.length) farmRoot.remove(farmRoot.children[0]);
    farm().beds.forEach((b, i) => { const [x, z] = BEDS[i]; const m = cropMesh(b.crop, b.g); m.position.set(x, T0.height(x, z), z); m.traverse(o => { if (o.isMesh) { o.castShadow = true; } }); farmRoot.add(m); if (b.crop && b.g >= 3) { const sp = new THREE.Mesh(SP(0.08, 6, 5), glow(0xfff6a0)); sp.position.set(x + 1.6, T0.height(x, z) + 1.0, z); farmRoot.add(sp); } });
  }
  function buildFarm(root) {
    const putF = (r, o, x, z, ry, dy) => put(r, o, x + FO[0], z + FO[1], ry, dy), rectF = (r, x, z, w, d, m, y) => rect(r, x + FO[0], z + FO[1], w, d, m, y);
    const soil = ctexMat('p2soil', 64, 64, (c, w, h) => { c.fillStyle = '#6a4a32'; c.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(${40 + (i % 3) * 20},${25 + (i % 4) * 10},15,0.6)`; c.fillRect((i * 37) % w, (i * 23) % h, 3, 2); } for (let y = 6; y < h; y += 12) { c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(0, y, w, 3); } }, [2, 1]);
    rectF(root, -115, 50.5, 11, 11.6, ctexMat('p2path', 64, 64, (c, w, h) => { c.fillStyle = '#c8a878'; c.fillRect(0, 0, w, h); for (let i = 0; i < 80; i++) { c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect((i * 29) % w, (i * 17) % h, 2, 2); c.fillStyle = 'rgba(90,60,30,0.25)'; c.fillRect((i * 13) % w, (i * 31) % h, 2, 2); } }, [4, 4]), 0.06);
    BEDS.forEach(([x, z]) => { const bx = new THREE.Group(); add(bx, B(3.4, 0.36, 1.5), tm('plank', 0x9a6a3e), 0, 0.18, 0); const s2 = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.3), soil); s2.rotation.x = -PI / 2; s2.position.y = 0.37; bx.add(s2); put(root, bx, x, z); });
    // 울타리 (낮은 원목) + 문
    const fence = (len) => { const f = new THREE.Group(); for (let i = 0; i <= Math.round(len / 1.0); i++) add(f, B(0.12, 0.9, 0.12), tm('bark', 0x8a6a4a), -len / 2 + i * len / Math.round(len / 1.0), 0.45, 0); for (const y of [0.35, 0.72]) add(f, B(len, 0.08, 0.06), tm('plank', 0xa87a4a), 0, y, 0); return f; };
    putF(root, fence(11), -115, 44.6); putF(root, fence(11.6), -120.6, 50.4, PI / 2); putF(root, fence(11.6), -109.4, 50.4, PI / 2); putF(root, fence(4.2), -118.4, 56.2); putF(root, fence(4.2), -111.6, 56.2);
    const gate = new THREE.Group(); for (const s of [-1, 1]) add(gate, B(0.16, 2.0, 0.16), tm('bark', 0x7a5a3a), s * 1.3, 1.0, 0); add(gate, B(3.0, 0.14, 0.16), tm('plank', 0xa87a4a), 0, 2.0, 0); const gs = sign('🌱 주민 텃밭 · 초록 손', 2.6, 0.5, '#f4ead0', '#4a6a2a'); gs.position.set(0, 2.35, 0.1); gate.add(gs); putF(root, gate, -115, 56.3);
    // 허수아비 · 공구 창고 · 물통 · 물뿌리개 · 수레 · 해바라기
    const sc = new THREE.Group(); add(sc, C(0.04, 0.05, 1.8), tm('bark', 0x8a6a4a), 0, 0.9, 0); add(sc, B(1.2, 0.06, 0.06), tm('bark', 0x8a6a4a), 0, 1.35, 0); add(sc, B(0.6, 0.6, 0.3), 0x5a7ad8, 0, 1.25, 0); add(sc, SP(0.2, 10, 8), 0xf4e0b0, 0, 1.75, 0); add(sc, C(0.32, 0.32, 0.03, 14), 0xe8c060, 0, 1.92, 0); add(sc, C(0.16, 0.2, 0.16, 12), 0xe8c060, 0, 2.0, 0); for (const s of [-1, 1]) add(sc, SP(0.03, 5, 4), 0x1a1a1a, s * 0.07, 1.78, 0.18); putF(root, sc, -115, 47.9);
    const shed = new THREE.Group(); add(shed, B(1.6, 1.8, 1.4), tm('plank', 0xb8824a), 0, 0.9, 0); const rf = add(shed, B(1.9, 0.08, 1.8), tm('corrug', 0x8a3a2a), 0, 1.92, 0); rf.rotation.x = 0.15; add(shed, B(0.7, 1.4, 0.04), tm('plank', 0x6a4a2a), 0, 0.7, 0.71); for (let i = 0; i < 3; i++) add(shed, C(0.02, 0.02, 1.1), 0x8a6a4a, -0.6 + i * 0.12, 0.6, 0.78).rotation.z = 0.15; putF(root, shed, -119.4, 55.0, PI / 2);
    const bar = new THREE.Group(); add(bar, C(0.35, 0.32, 0.8, 14), tm('plank', 0x8a5a34), 0, 0.4, 0); const wt = add(bar, C(0.32, 0.32, 0.02, 14), lam(0x5aa8c8, { transparent: true, opacity: 0.8 }), 0, 0.78, 0); void wt; add(bar, C(0.12, 0.1, 0.18, 10), 0x4a9ac8, 0.55, 0.09, 0.1); add(bar, C(0.02, 0.02, 0.25, 5), 0x4a9ac8, 0.72, 0.15, 0.1).rotation.z = -0.9; putF(root, bar, -110.6, 55.0);
    const wb = new THREE.Group(); add(wb, B(0.8, 0.3, 0.55), 0x3a8a5a, 0, 0.45, 0); add(wb, C(0.2, 0.2, 0.08, 12), 0x2a2a2a, 0.4, 0.2, 0).rotation.x = PI / 2; for (const s of [-1, 1]) add(wb, B(0.8, 0.04, 0.04), 0x8a6a4a, -0.6, 0.5, s * 0.22); for (let i = 0; i < 4; i++) add(wb, SP(0.1, 6, 5), [0xe8302a, 0xff8a2a, 0x8ac86a, 0xf8d040][i], -0.2 + i * 0.13, 0.65, (i % 2 - 0.5) * 0.2); putF(root, wb, -110.6, 45.8, 0.4);
    farmRoot = new THREE.Group(); root.add(farmRoot); refreshFarm();
  }

  // ---------- 🏮 마츠리 광장 (30×30 · 도리이 2 · 신사 · 야구라 · 노점 8 · 연못) ----------
  const MP = () => FM.MAP.P.matsuri;
  function bench(len = 1.8) { const g = new THREE.Group(); add(g, B(len, 0.08, 0.42), tm('plank', 0xb8824a), 0, 0.46, 0); add(g, B(len, 0.36, 0.06), tm('plank', 0xb8824a), 0, 0.72, -0.2); for (const s of [-1, 1]) add(g, B(0.08, 0.46, 0.4), 0x3a2a20, s * (len / 2 - 0.15), 0.23, 0); return g; }
  function torii(w = 4.6, h = 4.6) {
    const t = new THREE.Group(); const red = lam(0xe0401a);
    for (const s of [-1, 1]) { add(t, C(0.22, 0.26, h, 14), red, s * w / 2.55, h / 2, 0); add(t, C(0.3, 0.3, 0.5, 14), 0x1a1a1a, s * w / 2.55, 0.25, 0); }
    add(t, B(w, 0.3, 0.36), red, 0, h * 0.78, 0); add(t, B(w + 0.9, 0.28, 0.5), 0x1a1a1a, 0, h - 0.1, 0); for (const s of [-1, 1]) { const tip = add(t, B(0.6, 0.22, 0.48), 0x1a1a1a, s * (w / 2 + 0.55), h, 0); tip.rotation.z = s * 0.18; }
    add(t, B(0.6, 0.8, 0.08), 0x1a1a1a, 0, h * 0.88, 0.12); const pq = sign('祭', 0.46, 0.66, '#1a1a1a', '#e8c050'); pq.position.set(0, h * 0.88, 0.17); t.add(pq);
    return t;
  }
  function stall(t, lanM) {
    const s = new THREE.Group(); const col = t.c;
    add(s, B(2.6, 0.95, 0.9), tm('plank', 0xb8824a), 0, 0.48, 0); add(s, B(2.7, 0.08, 1.0), tm('plank', 0xd8a86a), 0, 0.98, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(s, B(0.1, 2.5, 0.1), tm('bark', 0x8a5a34), sx * 1.25, 1.25, sz * 0.55 - 0.2);
    add(s, B(2.6, 1.5, 0.06), tm('plank', 0xa8784a), 0, 1.6, -0.78);
    const cm2 = new THREE.MeshLambertMaterial({ map: FM.AC.stripe(col, '#ffffff') }); const rf = add(s, B(3.0, 0.08, 1.7), cm2, 0, 2.55, 0.0); rf.rotation.x = 0.2;
    for (let i = 0; i < 9; i++) { const v = add(s, B(0.33, 0.24, 0.02), cm2, -1.33 + i * 0.333, 2.32, 0.86); void v; }   // 물결 차양 끝
    const nm = sign(t.n, 2.3, 0.46, col, '#ffffff'); nm.position.set(0, 2.05, 0.6); s.add(nm);
    const k = t.k;
    if (k === 'goldfish') { add(s, B(1.8, 0.25, 0.7), lam(0x3a8ad8, { transparent: true, opacity: 0.75 }), 0, 1.15, 0.05); for (let i = 0; i < 8; i++) add(s, SP(0.05, 6, 5), [0xff5a2a, 0xffffff, 0xff8a2a][i % 3], -0.7 + i * 0.2, 1.24, (i % 2 - 0.5) * 0.3).scale.set(1.6, 0.6, 0.8); for (let i = 0; i < 3; i++) add(s, SP(0.14, 8, 6), lam(0xbfe8ff, { transparent: true, opacity: 0.55 }), -0.9 + i * 0.3, 1.9 - i * 0.05, -0.55); }
    if (k === 'takoyaki') { add(s, B(1.5, 0.12, 0.6), 0x2a2a2a, 0, 1.08, 0); for (let i = 0; i < 12; i++) add(s, SP(0.065, 6, 5), 0xc8823a, -0.55 + (i % 6) * 0.22, 1.17, (Math.floor(i / 6) - 0.5) * 0.26); }
    if (k === 'cotton') for (let i = 0; i < 6; i++) { add(s, C(0.01, 0.01, 0.4, 4), 0xffffff, -1.0 + i * 0.4, 1.2, 0.3); add(s, SP(0.16, 8, 6), [0xffb8d8, 0xb8e0ff, 0xffffff][i % 3], -1.0 + i * 0.4, 1.46, 0.3); }
    if (k === 'shooting') { for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) add(s, B(0.18, 0.24, 0.12), [0xff6a8a, 0xffd84a, 0x6ac8ff, 0xb8ff8a][(i + r) % 4], -0.9 + i * 0.36, 1.35 + r * 0.45, -0.6); add(s, B(0.9, 0.06, 0.08), 0x6a4a2a, 0.3, 1.08, 0.3); }
    if (k === 'yakisoba') { add(s, B(1.6, 0.08, 0.7), 0x3a3a3a, 0, 1.06, 0); for (let i = 0; i < 20; i++) add(s, B(0.18, 0.025, 0.03), [0xc8902a, 0xe8b04a, 0x5aa83a][i % 3], -0.6 + (i % 10) * 0.13, 1.12, (Math.floor(i / 10) - 0.5) * 0.25).rotation.y = i; }
    if (k === 'kakigori') for (let i = 0; i < 4; i++) { add(s, C(0.12, 0.08, 0.14, 10), lam(0xe8f4ff, { transparent: true, opacity: 0.8 }), -0.75 + i * 0.5, 1.1, 0.15); add(s, SP(0.14, 10, 8), [0xff4a6a, 0x4ad0ff, 0x8aff6a, 0xffd84a][i], -0.75 + i * 0.5, 1.24, 0.15); }
    if (k === 'ringo') for (let i = 0; i < 10; i++) { add(s, C(0.008, 0.008, 0.3, 4), 0xf4ead8, -0.9 + (i % 5) * 0.45, 1.15, (Math.floor(i / 5) - 0.5) * 0.3); add(s, SP(0.08, 8, 6), lam(0xe8203a, { emissive: 0x400010 }), -0.9 + (i % 5) * 0.45, 1.33, (Math.floor(i / 5) - 0.5) * 0.3); }
    if (k === 'omen') for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const m2 = add(s, SP(0.15, 10, 8), [0xffffff, 0xff9aa8, 0xffd84a, 0x8ad0ff, 0xff6a3a, 0x8aff9a][(i + r * 2) % 6], -1.0 + i * 0.4, 1.4 + r * 0.42, -0.72); m2.scale.z = 0.4; }
    else for (let i = 0; i < 4; i++) { const m2 = add(s, SP(0.11, 8, 6), [0xffffff, 0xff9aa8, 0xffd84a, 0x8ad0ff][i], -0.9 + i * 0.6, 2.2, -0.72); m2.scale.z = 0.4; }
    for (const sx of [-1.05, 1.05]) { const lm = new THREE.Mesh(SP(0.17, 8, 6), lanM); lm.scale.y = 1.25; lm.position.set(sx, 2.15, 0.75); s.add(lm); }
    return s;
  }
  function buildMatsuri(root) {
    const P0 = MP(), X = P0.x, Z = P0.z, H = 15;
    const red = lam(0xe0401a);
    rect(root, X, Z, H * 2, H * 2, ctexMat('p2grav', 64, 64, (c, w, h) => { c.fillStyle = '#d8ccb0'; c.fillRect(0, 0, w, h); for (let i = 0; i < 120; i++) { c.fillStyle = `rgba(${120 + (i % 5) * 20},${110 + (i % 5) * 18},${90 + (i % 5) * 14},0.45)`; c.beginPath(); c.arc((i * 37) % w, (i * 23) % h, 1.5 + (i % 3), 0, 7); c.fill(); } }, [8, 8]), 0.06);
    const stoneM = ctexMat('p2stone', 64, 64, (c, w, h) => { c.fillStyle = '#8a8a8e'; c.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) { c.fillStyle = `rgb(${160 + i * 8},${160 + i * 8},${164})`; c.beginPath(); c.ellipse(10 + (i % 3) * 22, 14 + Math.floor(i / 3) * 32, 10, 13, i, 0, 7); c.fill(); } }, [1, 8]);
    rect(root, X, Z + 1.5, 3, 27, stoneM, 0.075);
    const stoneM2 = ctexMat('p2stoneB', 64, 64, (c, w, h) => { c.fillStyle = '#8a8a8e'; c.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) { c.fillStyle = `rgb(${160 + i * 8},${160 + i * 8},${164})`; c.beginPath(); c.ellipse(14 + Math.floor(i / 3) * 32, 10 + (i % 3) * 22, 13, 10, i, 0, 7); c.fill(); } }, [6, 1]);
    rect(root, X + 8, Z - 5, 15, 3, stoneM2, 0.076);
    put(root, torii(5.0, 5.0), X, Z + H - 0.4, 0);
    put(root, torii(4.4, 4.4), X + H - 0.4, Z - 5, PI / 2);
    // 붉은 격자 울타리 (입구 두 곳 비움)
    const lattice = (len) => { const f = new THREE.Group(); const m = lam(0xd8401a); const n = Math.max(1, Math.round(len / 1.4)); for (let i = 0; i <= n; i++) { const x = -len / 2 + i * len / n; add(f, B(0.16, 1.2, 0.16), m, x, 0.6, 0); add(f, SP(0.1, 8, 6), 0xd4a848, x, 1.26, 0); } for (const y of [0.2, 0.55, 1.0]) add(f, B(len, 0.08, 0.08), m, 0, y, 0); return f; };
    put(root, lattice(H * 2), X, Z - H);
    put(root, lattice(H - 2.6), X - H / 2 - 1.3, Z + H); put(root, lattice(H - 2.6), X + H / 2 + 1.3, Z + H);
    put(root, lattice(H * 2), X - H, Z, PI / 2);
    put(root, lattice(H - 7.5), X + H, Z - H + (H - 7.5) / 2, PI / 2); put(root, lattice(H + 3.5), X + H, Z + H - (H + 3.5) / 2, PI / 2);
    // 신사 (북쪽): 돌 기단 · 붉은 기둥 · 녹청 기와 · 새전함 · 방울 줄 · 고마이누
    const sh = new THREE.Group();
    add(sh, B(7.4, 0.6, 4.8), tm('stone', 0xa8a49c), 0, 0.3, 0); for (let i = 0; i < 3; i++) add(sh, B(2.4, 0.2, 0.4), tm('stone', 0xb8b4ac), 0, 0.1 + i * 0.2, 2.6 - i * 0.35);
    add(sh, B(6.0, 2.6, 3.4), tm('timber', 0xf0e4cc), 0, 1.9, -0.4);
    for (const x of [-3.0, -1.0, 1.0, 3.0]) add(sh, C(0.16, 0.18, 2.8, 12), red, x, 2.0, 1.45);
    add(sh, B(6.4, 0.24, 0.3), red, 0, 3.25, 1.45);
    const rf = add(sh, geo('shRoof', () => new THREE.CylinderGeometry(0.01, 4.8, 2.2, 4, 1, false, PI / 4)), tm('jptile', 0x3a6a5a), 0, 4.4, -0.2); rf.scale.set(1.0, 1, 0.72);
    add(sh, B(7.6, 0.22, 5.4), tm('jptile', 0x3a6a5a), 0, 3.4, -0.2);
    const box2 = add(sh, B(1.4, 0.6, 0.6), tm('plank', 0x6a4a2a), 0, 0.9, 1.9); void box2; const ss = sign('奉納', 0.8, 0.26, '#6a4a2a', '#f4e0b0'); ss.position.set(0, 0.95, 2.21); sh.add(ss);
    add(sh, C(0.03, 0.03, 2.0, 6), 0xe8d8a0, 0, 2.2, 1.6); add(sh, SP(0.16, 10, 8), 0xd8b040, 0, 3.2, 1.6);
    for (const s of [-1, 1]) { const ko = new THREE.Group(); add(ko, B(0.7, 0.6, 0.7), tm('stone', 0xa8a49c), 0, 0.3, 0); add(ko, SP(0.32, 10, 8), tm('stone', 0xbab6ae), 0, 0.85, 0); add(ko, SP(0.24, 10, 8), tm('stone', 0xbab6ae), 0, 1.25, 0.12); ko.position.set(s * 3.3, 0, 2.9); sh.add(ko); }
    const shName = sign('⛩️ 여름 신사', 1.8, 0.4, '#1a1a1a', '#e8c050'); shName.position.set(0, 3.05, 1.62); sh.add(shName);
    put(root, sh, X, Z - H + 3.2);
    // 야구라 (가운데) + 홍백 천 + 북
    const yag = new THREE.Group();
    for (const [x, z] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) add(yag, B(0.22, 3.8, 0.22), tm('bark', 0x8a5a34), x, 1.9, z);
    add(yag, B(3.6, 0.18, 3.6), tm('plank', 0xb8824a), 0, 2.8, 0);
    const kohaku = new THREE.MeshLambertMaterial({ map: FM.AC.stripe('#e83030', '#ffffff'), side: THREE.DoubleSide });
    for (let s = 0; s < 4; s++) { const pnl = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 1.2), kohaku); pnl.position.set(Math.sin(s * PI / 2) * 1.8, 2.2, Math.cos(s * PI / 2) * 1.8); pnl.rotation.y = s * PI / 2; yag.add(pnl); }
    const roof = add(yag, geo('yagR2', () => new THREE.ConeGeometry(2.9, 1.3, 4)), tm('jptile', 0x3a3a40), 0, 4.45, 0); roof.rotation.y = PI / 4;
    const tk = new THREE.Group(); add(tk, C(0.48, 0.48, 0.8, 18), 0x8a2a1a, 0, 0, 0).rotation.z = PI / 2; for (const s of [-1, 1]) add(tk, C(0.51, 0.51, 0.04, 18), 0xf4ead8, s * 0.41, 0, 0).rotation.z = PI / 2; tk.position.set(0, 3.4, 0); yag.add(tk);
    for (let i = 0; i < 6; i++) add(yag, B(0.5, 0.1, 0.24), tm('plank', 0x8a5a34), 0, 0.3 + i * 0.45, 1.85 + i * 0.0).rotation.x = 0;
    put(root, yag, X, Z);
    const dr = new THREE.Group(); add(dr, B(0.9, 0.5, 0.6), tm('bark', 0x5a3a24), 0, 0.25, 0); add(dr, C(0.4, 0.4, 0.6, 18), 0x8a2a1a, 0, 0.85, 0).rotation.x = PI / 2; for (const s of [-1, 1]) add(dr, C(0.42, 0.42, 0.04, 18), 0xf4ead8, 0, 0.85, s * 0.31).rotation.x = PI / 2; put(root, dr, X, Z + 3.0);
    // 초롱 줄 (야구라 꼭대기 → 둘레 장대 10)
    const lanM = new THREE.MeshLambertMaterial({ color: 0xfff0e0, emissive: 0xff6a3a, emissiveIntensity: 0.15 });
    const lanM2 = new THREE.MeshLambertMaterial({ color: 0xff5a3a, emissive: 0xff3a1a, emissiveIntensity: 0.15 });
    const top = new THREE.Vector3(X, T0.height(X, Z) + 4.9, Z);
    const poles = [[-14, -14], [0, -14.2], [14, -14], [-14, 0], [14, 1], [-14, 14], [-3, 14.2], [3, 14.2], [14, 14], [14, -8]].map(([a, b]) => [X + a, Z + b]);
    for (const [px, pz] of poles) {
      const pl = new THREE.Group(); add(pl, C(0.08, 0.1, 4.8), tm('bark', 0x8a5a34), 0, 2.4, 0); put(root, pl, px, pz);
      const end = new THREE.Vector3(px, T0.height(px, pz) + 4.7, pz);
      const pts = []; for (let t = 0; t <= 1.0001; t += 0.1) pts.push(new THREE.Vector3().lerpVectors(top, end, t).add(new THREE.Vector3(0, -Math.sin(t * PI) * 1.2, 0)));
      root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.015, 3), lam(0x2a2a2a)));
      for (let k = 1; k < 11; k++) { const t = k / 11; const p = new THREE.Vector3().lerpVectors(top, end, t).add(new THREE.Vector3(0, -Math.sin(t * PI) * 1.2 - 0.25, 0)); const l = new THREE.Mesh(SP(0.2, 10, 8), k % 2 ? lanM : lanM2); l.scale.y = 1.3; l.position.copy(p); root.add(l); }
    }
    // 둘레 초롱 줄 (울타리 위)
    const ring = [[-H, -H], [H, -H], [H, H], [-H, H], [-H, -H]];
    for (let e = 0; e < 4; e++) { const [ax, az] = ring[e], [bx, bz] = ring[e + 1]; for (let k = 1; k < 12; k++) { const t = k / 12, x = X + ax + (bx - ax) * t, z = Z + az + (bz - az) * t; const l = new THREE.Mesh(SP(0.15, 8, 6), k % 3 ? lanM : lanM2); l.scale.y = 1.3; l.position.set(x, T0.height(x, z) + 1.75, z); root.add(l); } }
    nightGlows.push(lanM, lanM2);
    // 노점 8 (서쪽 4 · 동쪽 4 — 손님은 가운데 쪽에서, 상인은 뒤쪽)
    for (const t of P0.stalls) put(root, stall(t, lanM), t.x, t.z, t.s * PI / 2);
    // 벤치 · 동백 · 분홍 등 · 노보리 깃발 · 연못 & 붉은 아치 다리
    for (const [x, z, r] of [[X - 6.5, Z - 3, PI / 2], [X + 6.5, Z + 3, -PI / 2], [X - 6, Z + 13, PI], [X + 6, Z + 13, PI]]) put(root, bench(), x - Math.sin(r) * 0.2, z - Math.cos(r) * 0.2, r);
    if (FM.Flora) for (const [x, z] of [[X - 12.5, Z - 13], [X - 8, Z - 13], [X + 8.5, Z - 13], [X + 12.8, Z - 13.2], [X - 13, Z + 13], [X + 13, Z + 13]]) { const g = new THREE.Group(); FM.Flora.bush(KK(g), ['rose', 'cosmos'], [0xe8302a, 0xff8a2a, 0xffd040], 0, 0, 0.6, 12, 0.95, x); put(root, g, x, z); }
    for (const [x, z] of [[X - 3.4, Z + H - 1.2], [X + 3.4, Z + H - 1.2], [X + H - 1.2, Z - 8.2], [X + H - 1.2, Z - 1.8]]) { const st = new THREE.Group(); add(st, C(0.05, 0.06, 1.6), 0x2a2a2a, 0, 0.8, 0); add(st, B(0.45, 0.6, 0.45), new THREE.MeshLambertMaterial({ color: 0xffd0e0, emissive: 0xff7aa8, emissiveIntensity: 0.3 }), 0, 1.85, 0); add(st, geo('p2stR', () => new THREE.ConeGeometry(0.4, 0.3, 4)), 0x2a2a2a, 0, 2.3, 0).rotation.y = PI / 4; put(root, st, x, z); }
    const NOB = [['夏祭', '#e83030'], ['金魚', '#2a6ad8'], ['花火', '#8a4ad8'], ['祭', '#e8902a']];
    for (let i = 0; i < 8; i++) { const [tx, col] = NOB[i % 4]; const nb = new THREE.Group(); add(nb, C(0.03, 0.03, 3.4, 6), 0x8a7a6a, 0, 1.7, 0); const f = sign(tx, 0.6, 2.2, col, '#ffffff'); f.position.set(0.31, 2.1, 0.02); nb.add(f); const f2 = sign(tx, 0.6, 2.2, col, '#ffffff'); f2.position.set(0.31, 2.1, -0.02); f2.rotation.y = PI; nb.add(f2); put(root, nb, X - 13.6 + (i % 4) * 2.4 + (i >= 4 ? 17 : 0), Z + H + 0.9, 0); }
    const pond = new THREE.Group(); const pw = new THREE.Mesh(new THREE.CircleGeometry(2.2, 24), new THREE.MeshPhongMaterial({ color: 0x4a8ab8, shininess: 100, transparent: true, opacity: 0.85 })); pw.rotation.x = -PI / 2; pw.position.y = 0.1; pond.add(pw);
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; const s2 = add(pond, SP(0.26, 7, 5), tm('stone', 0x8a8682), Math.cos(a) * 2.2, 0.1, Math.sin(a) * 2.2); s2.scale.y = 0.55; }
    for (let i = 0; i < 4; i++) { const kf = add(pond, SP(0.07, 6, 5), [0xff5a2a, 0xffffff, 0xff8a2a, 0xffd84a][i], Math.cos(i * 1.7) * 1.1, 0.13, Math.sin(i * 1.7) * 1.1); kf.scale.set(1.8, 0.5, 0.8); }
    const br = new THREE.Group(); for (let i = 0; i < 10; i++) { const t = (i + 0.5) / 10; const p2 = add(br, B(0.4, 0.06, 1.0), tm('plank', 0xc8823a), -1.8 + t * 3.6, 0.25 + Math.sin(t * PI) * 0.5, 0); p2.rotation.z = Math.cos(t * PI) * 0.45; } for (const z of [-0.5, 0.5]) for (let i = 0; i <= 4; i++) { const t = i / 4; add(br, C(0.05, 0.05, 0.6), red, -1.8 + t * 3.6, 0.55 + Math.sin(t * PI) * 0.5, z); }
    pond.add(br); put(root, pond, X + 6.5, Z - 9.5, 0.3);
  }

  // ---------- 🎣 낚시 부두 ----------
  let boardTex = null, boardCanvas = null;
  function paintBoard() {
    if (!boardCanvas) return; const c = boardCanvas.getContext('2d'), w = boardCanvas.width, h = boardCanvas.height;
    c.fillStyle = '#2a3a30'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c8a070'; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8);
    c.fillStyle = '#ffe8a0'; c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.fillText('🎣 은빛 바늘 낚시 대회', w / 2, 34);
    const dv = derby(); c.font = '15px sans-serif'; c.fillStyle = '#ffffff';
    if (dv.active) { const top = dv.catches.slice().sort((a, b) => b.size - a.size).slice(0, 3); c.fillText('🔴 대회 진행 중!', w / 2, 60); top.forEach((r, i) => c.fillText(`${['🥇', '🥈', '🥉'][i]} ${r.name} · ${r.fish} ${r.size}cm`, w / 2, 88 + i * 24)); if (!top.length) c.fillText('아직 기록 없음 — 첫 대물을 노려라!', w / 2, 90); }
    else { c.fillText('매주 토요일 9시 ~ 15시', w / 2, 62); const last = dv.history[dv.history.length - 1]; if (last) { c.fillText(`지난 우승: ${last.name}`, w / 2, 92); c.fillText(`${last.fish} ${last.size}cm 🏆`, w / 2, 116); } else c.fillText('첫 대회를 기다리는 중...', w / 2, 96); }
    if (boardTex) boardTex.needsUpdate = true;
  }
  function buildPier(root) {
    const rope = lam(0xd8c8a0);
    // 부두 양옆 흰 볼라드 + 밧줄, 가로등, 깃발
    for (const x of [-77.75, -74.25]) { let prev = null; for (let z = 87.5; z <= 104; z += 2.2) { const b = new THREE.Group(); add(b, C(0.12, 0.14, 0.55, 10), 0xf4f4f0, 0, 0.27, 0); add(b, SP(0.13, 8, 6), 0xf4f4f0, 0, 0.56, 0); put(root, b, x, z, 0, 0); b.position.y = 1.2; if (prev) { const pts = [new THREE.Vector3(x, 1.65, prev), new THREE.Vector3(x, 1.5, (prev + z) / 2), new THREE.Vector3(x, 1.65, z)]; root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, 0.025, 4), rope)); } prev = z; } }
    for (const [x, z] of [[-77.9, 91], [-74.1, 97], [-77.9, 103], [-80.4, 110.2], [-71.6, 110.2]]) { const lp = new THREE.Group(); add(lp, C(0.06, 0.09, 2.9), 0x6a4a30, 0, 1.45, 0); add(lp, SP(0.2, 10, 8), glass(0xfff4d8), 0, 3.0, 0); const bb = add(lp, SP(0.11, 8, 6), glow(0xffd890), 0, 3.0, 0); bb.userData.lampBulb = true; add(lp, geo('p2plc', () => new THREE.ConeGeometry(0.26, 0.22, 10)), 0x6a4a30, 0, 3.25, 0); lp.position.set(x, 1.2, z); root.add(lp); }
    for (let i = 0; i < 8; i++) { const f = new THREE.Mesh(geo('p2flag', () => new THREE.ConeGeometry(0.18, 0.35, 3)), lam([0xff5a3a, 0xffd84a, 0x4ab0f0, 0xffffff][i % 4])); f.rotation.x = PI; f.position.set(-80.4 + i * 1.25, 3.0 - Math.sin(i / 7 * PI) * 0.4, 110.2); root.add(f); }
    // 기록판 (동적) · 낚싯대 거치대 · 아이스박스 · 구명부표
    boardCanvas = document.createElement('canvas'); boardCanvas.width = 320; boardCanvas.height = 180; boardTex = new THREE.CanvasTexture(boardCanvas); paintBoard();
    const bd = new THREE.Group(); for (const s of [-1, 1]) add(bd, B(0.14, 2.6, 0.14), tm('plank', 0x6a4028), s * 1.2, 1.3, 0); add(bd, B(2.7, 1.6, 0.12), tm('plank', 0x8a5a34), 0, 1.9, 0); const fc = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.35), new THREE.MeshBasicMaterial({ map: boardTex })); fc.position.set(0, 1.9, 0.07); bd.add(fc); const fish = add(bd, SP(0.3, 10, 8), 0x4ab0d8, 0, 3.0, 0); fish.scale.set(2.2, 0.8, 0.4); add(bd, geo('p2ft', () => new THREE.ConeGeometry(0.25, 0.4, 3)), 0x4ab0d8, -0.75, 3.0, 0).rotation.z = PI / 2;
    bd.position.set(-71.9, 1.2, 105.6); bd.rotation.y = -PI / 2; root.add(bd);
    const rack = new THREE.Group(); add(rack, B(1.4, 0.1, 0.4), tm('plank', 0x8a5a34), 0, 0.5, 0); for (let i = 0; i < 4; i++) { const r2 = add(rack, C(0.015, 0.02, 2.4, 4), [0x2a2a2a, 0xd84a3a, 0x3a6ad8, 0xf0c040][i], -0.5 + i * 0.33, 1.4, 0); r2.rotation.x = -0.15; } rack.position.set(-80.0, 1.2, 105.4); root.add(rack);
    const ice = new THREE.Group(); add(ice, B(0.7, 0.45, 0.45), 0x3a8ad8, 0, 0.22, 0); add(ice, B(0.72, 0.08, 0.47), 0xffffff, 0, 0.48, 0); ice.position.set(-76, 1.2, 104.0); root.add(ice);
    const ring = new THREE.Mesh(geo('p2ring', () => new THREE.TorusGeometry(0.32, 0.1, 8, 18)), lam(0xff5a3a)); ring.position.set(-71.5, 2.0, 108.0); ring.rotation.y = PI / 2; root.add(ring);
    // 미끼 가게 (네이비 & 화이트 · 물결 차양) — 육지
    const sh = new THREE.Group(); add(sh, B(2.6, 2.3, 1.8), tm('plaster', 0xf6f2ea), 0, 1.15, 0); add(sh, B(2.62, 1.0, 1.82), tm('panel', 0x23365e), 0, 0.5, 0); add(sh, B(1.6, 0.9, 0.04), FM.AB3 ? FM.AB3.martWin() : 0x9ad0f0, 0, 1.5, 0.92);
    const aw = new THREE.Group(); const am = tm('plaster', 0xf4f0e6); add(aw, B(2.8, 0.06, 1.0), am, 0, 0, 0.5); for (let i = 0; i < 6; i++) { const sc = add(aw, geo('p2sc', () => new THREE.CylinderGeometry(0.23, 0.23, 0.05, 12, 1, false, 0, PI)), am, -1.17 + i * 0.47, -0.02, 1.0); sc.rotation.set(PI / 2, 0, PI); } aw.rotation.x = 0.25; aw.position.set(0, 2.35, 0.9); sh.add(aw);
    const sg2 = sign('🪱 미끼 · 낚싯대 대여', 2.2, 0.4, '#23365e', '#ffffff'); sg2.position.set(0, 2.65, 0.93); sh.add(sg2); add(sh, B(2.4, 0.08, 0.5), tm('plank', 0x8a5a34), 0, 0.95, 1.15);
    put(root, sh, -71.0, 87.4, PI);
  }

  // =========================================================
  // 🎆 불꽃놀이
  // =========================================================
  const bursts = [];
  const FW_COLS = [0xff2050, 0xffb000, 0x20c0ff, 0x9a60ff, 0x30ff70, 0xff6a10, 0xff50c8];
  // 색이 들어간 불꽃 입자 (가운데 하양 → 바깥 색 번짐)
  const fwTex = col => FM.PM.ctex('fw' + col, 64, 64, (c) => { const h = '#' + col.toString(16).padStart(6, '0'); const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.14, h); gr.addColorStop(0.4, h + '66'); gr.addColorStop(1, h + '00'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); });
  function launch(n = 6, cx, cz, spread = 16) {
    if (cx === undefined) { const m = FM.MAP.P.matsuri; cx = m.x; cz = m.z - 24; }
    if (!SCENE) return;
    for (let k = 0; k < n; k++) setTimeout(() => {
      const N = 150, pos = new Float32Array(N * 3), vel = [];
      const ox = cx + (Math.random() - 0.5) * spread, oz = cz + (Math.random() - 0.5) * spread * 0.6, oy = 22 + Math.random() * 10;
      for (let i = 0; i < N; i++) { const u = Math.random() * 2 - 1, a = Math.random() * PI * 2, r = Math.sqrt(1 - u * u), sp = 9 + Math.random() * 4; vel.push([Math.cos(a) * r * sp, u * sp, Math.sin(a) * r * sp]); pos[i * 3] = ox; pos[i * 3 + 1] = oy; pos[i * 3 + 2] = oz; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const m = new THREE.PointsMaterial({ map: fwTex(pick(FW_COLS)), size: 2.4, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false });
      const p = new THREE.Points(g, m); p.frustumCulled = false; p.visible = false; SCENE.add(p);
      // 올라가는 꼬리
      const trail = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([ox, T0.height(cx, cz) + 1, oz]), 3)), new THREE.PointsMaterial({ map: radialTex(), color: 0xfff0c0, size: 0.9, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); trail.frustumCulled = false; SCENE.add(trail);
      bursts.push({ p, g, m, vel, ox, oy, oz, t: -0.9, trail, y0: T0.height(cx, cz) + 1 });
      sfx('pop');
    }, k * 380 + Math.random() * 200);
  }
  function tickFireworks(dt) {
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i]; b.t += dt;
      if (b.t < 0) { const k = 1 + b.t / 0.9; b.trail.geometry.attributes.position.setXYZ(0, b.ox, b.y0 + (b.oy - b.y0) * k, b.oz); b.trail.geometry.attributes.position.needsUpdate = true; continue; }
      if (b.trail) { SCENE.remove(b.trail); b.trail.geometry.dispose(); b.trail = null; b.p.visible = true; }
      const a = b.g.attributes.position;
      for (let j = 0; j < b.vel.length; j++) { const v = b.vel[j], tt = b.t; a.array[j * 3] = b.ox + v[0] * tt * (1 - tt * 0.25); a.array[j * 3 + 1] = b.oy + v[1] * tt * (1 - tt * 0.25) - 3.2 * tt * tt; a.array[j * 3 + 2] = b.oz + v[2] * tt * (1 - tt * 0.25); }
      a.needsUpdate = true; b.m.opacity = Math.max(0, 1 - b.t / 2.4); b.m.size = 2.4 + b.t * 0.6;
      if (b.t > 2.5) { SCENE.remove(b.p); b.g.dispose(); b.m.dispose(); bursts.splice(i, 1); }
    }
  }
  FM.Fireworks = { launch, _b: bursts, _tick: tickFireworks };

  // =========================================================
  // 월드 생성
  // =========================================================
  let busk = null;
  FM.Places2 = (scene, T) => {
    SCENE = scene; T0 = T;
    const root = new THREE.Group(); root.name = 'places2';
    try { busk = buildBusk(root); } catch (e) { console.error('busk', e); }
    try { buildFarm(root); } catch (e) { console.error('farm', e); }
    try { buildMatsuri(root); } catch (e) { console.error('matsuri', e); }
    try { buildPier(root); } catch (e) { console.error('pier', e); }
    root.traverse(o => { if (o.isMesh && !o.material.transparent) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(root);
    let last = performance.now();
    const tick = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial()); tick.frustumCulled = false;
    tick.onBeforeRender = () => { const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now; tickFireworks(dt); const nt = (FM.W && FM.W.nightness) || 0; for (const m of nightGlows) m.emissiveIntensity = 0.15 + Math.max(0, nt - 0.15) * 1.1; if (fwShow.left > 0 && now > fwShow.next) { fwShow.left--; fwShow.next = now + 1400 + Math.random() * 900; launch(2 + ((Math.random() * 3) | 0)); } };
    scene.add(tick);
    return root;
  };
  const fwShow = { left: 0, next: 0 };

  // =========================================================
  // 놀이 시스템
  // =========================================================
  // ---------- 🌱 텃밭 성장 ----------
  FM.bus.on('hour', h => {
    try {
      const fm = farm();
      if (h === 6) { let ch = false; for (const b of fm.beds) if (b.crop && b.g < 3 && b.wet >= day() - 1) { b.g++; ch = true; } if (ch) refreshFarm(); }
      // 주민이 빈 칸에 씨앗을 심거나, 익은 걸 수확 (정원 가꾸기 좋아하는 주민)
      if (h >= 7 && h <= 17 && chance(0.3)) {
        const vs = S().villagers.filter(v => free(v) && (has(v, 'GARDEN') || has(v, 'NATURE')) && v.loc === 'island');
        const v = pick(vs); if (!v) return;
        const ripe = fm.beds.findIndex(b => b.crop && b.g >= 3), empty = fm.beds.findIndex(b => !b.crop);
        if (ripe >= 0 && chance(0.6)) { const b = fm.beds[ripe]; Sim.scene({ title: '🧺 텃밭 수확', actors: { A: v }, steps: [{ go: 'A', to: { loc: 'island', x: BEDS[ripe][0], z: BEDS[ripe][1] + 1.2 } }, { pose: 'A', p: 'crouch', t: 3 }, { emote: 'A', e: '🧺' }, { say: 'A', text: sty(v, `${CROPS[b.crop].name.split(' ')[1]} 잘 익었다~ 나눠 먹어야지!`), t: 3 }], onEnd: () => { b.crop = null; b.g = 0; refreshFarm(); v.mood = Math.min(100, (v.mood || 50) + 8); log(`🧺 ${v.name}이(가) 주민 텃밭에서 채소를 수확했어요`, [v.id], 1); } }); }
        else if (empty >= 0) { const crop = pick(Object.keys(CROPS)); const b = fm.beds[empty]; Sim.scene({ title: '🌱 씨앗 심기', actors: { A: v }, steps: [{ go: 'A', to: { loc: 'island', x: BEDS[empty][0], z: BEDS[empty][1] + 1.2 } }, { pose: 'A', p: 'crouch', t: 3 }, { emote: 'A', e: '🌱' }], onEnd: () => { b.crop = crop; b.g = 0; b.wet = day(); b.owner = v.id; refreshFarm(); } }); }
      }
    } catch (e) { console.error('farm tick', e); }
  });
  FM.bus.on('act', ({ v, id }) => { if (id === 'tend_crop' || (id === 'water_flowers' && v && Math.hypot(v.x + 115, v.z - 50) < 8)) { const fm = farm(); const b = fm.beds.filter(q => q.crop && q.wet < day()).sort(() => Math.random() - 0.5)[0]; if (b) b.wet = day(); } });

  // ---------- 🎤 버스킹 ----------
  function buskShow(A) {
    const st = S(); const crowd = st.villagers.filter(v => free(v) && v !== A && v.loc === 'island').sort(() => Math.random() - 0.5).slice(0, 3);
    const inst = pick(has(A, 'MUSICIAN') || has(A, 'ARTISTIC') ? ['guitar', 'piano', 'sing', 'sax'] : ['sing', 'guitar']);
    const seats = [[12.8, 61.6], [17, 62.2], [21.2, 61.6]];
    const actors = { A }; crowd.forEach((v, i) => { actors['BCD'[i]] = v; });
    const go = crowd.map((v, i) => ({ go: 'BCD'[i], to: { loc: 'island', x: seats[i][0], z: seats[i][1] } }));
    Sim.scene({ title: '🎤 버스킹 공연', actors, steps: [
      { par: [{ go: 'A', to: inst === 'piano' ? { place: 'busk', spot: 'busk_piano' } : { place: 'busk', spot: 'busk' } }].concat(go) },
      { par: [{ pose: 'A', p: inst, t: 8 }].concat(crowd.map((v, i) => ({ pose: 'BCD'[i], p: 'sit', t: 8 }))) },
      { say: 'A', text: sty(A, pick(['오늘 밤도 들어 줘서 고마워요 🎵', '이 노래는... 우리 섬을 위해!', '앵콜은 박수 크기에 달렸어요~'])), t: 3 },
      { par: crowd.map((v, i) => ({ pose: 'BCD'[i], p: 'clap', t: 3 })).concat([{ pose: 'A', p: inst, t: 3 }]) },
      { par: crowd.map((v, i) => ({ emote: 'BCD'[i], e: pick(['👏', '🎵', '😍', '✨']) })) },
    ], onEnd: () => { for (const v of crowd) Soc.addFriend(v.id, A.id, 3, 2, '버스킹'); A.mood = Math.min(100, (A.mood || 50) + 10); log(`🎤 ${A.name}이(가) 역 앞 버스킹 무대에서 공연했어요${crowd.length ? ` · 관객 ${crowd.map(v => v.name).join(', ')}` : ''}`, [A.id].concat(crowd.map(v => v.id)), 2); } });
  }
  FM.bus.on('hour', h => { try { if (h >= 16 && h <= 22 && chance(0.3)) { const st = S(); if ((st.buskDay || 0) === day() && (st.buskN || 0) >= 2) return; const A = pick(st.villagers.filter(v => free(v) && v.loc === 'island' && (has(v, 'MUSIC') || has(v, 'MUSICIAN') || has(v, 'ARTISTIC') || has(v, 'EXTROVERT')))); if (A) { if (st.buskDay !== day()) { st.buskDay = day(); st.buskN = 0; } st.buskN++; buskShow(A); } } } catch (e) { console.error('busk ev', e); } });

  // ---------- 🎆 마츠리 불꽃놀이 축제 (매일 밤 21시, 주말엔 더 크게) ----------
  function festival(big) {
    fwShow.left = big ? 30 : 18; fwShow.next = performance.now() + 500;
    const st = S(); const vs = st.villagers.filter(v => free(v) && v.loc === 'island').sort(() => Math.random() - 0.5).slice(0, big ? 6 : 4);
    const spots = [[91, 35], [93.5, 36.8], [99, 37], [101.6, 35], [96, 38.6], [89.6, 37.4]];
    vs.forEach((v, i) => {
      const pid = Soc.partnerOf(v.id); const mate = pid && vs.find(o => o.id === pid);
      Sim.scene({ title: '🎆 불꽃놀이', actors: { A: v }, steps: [{ go: 'A', to: { loc: 'island', x: spots[i % 6][0], z: spots[i % 6][1] } }, { face: 'A', at: mate ? mate.id : null }, { pose: 'A', p: 'lookUp', t: 10 }, { emote: 'A', e: mate ? '💕' : pick(['🎆', '✨', '😍']) }, { pose: 'A', p: mate ? 'cute' : 'cheer', t: 3 }], onEnd: () => { if (mate) Soc.addRomance(v.id, mate.id, 4); v.mood = Math.min(100, (v.mood || 50) + 6); } });
    });
    log(`🎆 마츠리 광장에서 ${big ? '주말 대형 ' : ''}불꽃놀이가 펼쳐졌어요!${vs.length ? ` (${vs.map(v => v.name).join(', ')} 관람)` : ''}`, vs.map(v => v.id), 2);
    toast('🎆 마츠리 광장에서 불꽃놀이가 시작됐어요! 동쪽 하늘을 보세요');
  }
  FM.bus.on('hour', h => { try { if (h === 21) festival(Sim.time.weekend()); } catch (e) { console.error('festival', e); } });
  FM.Fireworks.festival = festival;

  // ---------- 🎣 낚시 대회 (토요일 9 ~ 15시) ----------
  const FISH = [['전갱이', 18, 32], ['고등어', 25, 45], ['도미', 30, 60], ['광어', 35, 70], ['농어', 40, 80], ['참치', 60, 140], ['황금 잉어', 30, 55]];
  const derby = () => { const st = S(); if (!st.derby) st.derby = { active: false, catches: [], history: [] }; return st.derby; };
  function rollFish(bonus = 0) { const f = pick(FISH); const r = Math.random(); const size = Math.round(f[1] + (f[2] - f[1]) * Math.pow(r, 1.6 - Math.min(0.8, bonus))); return { fish: f[0], size }; }
  function addCatch(id, name, bonus) { const dv = derby(); const c = Object.assign({ id, name, day: day() }, rollFish(bonus)); dv.catches.push(c); paintBoard(); return c; }
  const onPier = (x, z) => x > -81 && x < -71 && z > 86 && z < 111;
  FM.bus.on('hour', h => {
    try {
      const dv = derby(), wd = Sim.time.weekday();
      if (wd === 5 && h === 9 && !dv.active) { dv.active = true; dv.catches = []; dv.day = day(); paintBoard(); log('🎣 은빛 바늘 낚시 대회가 시작됐어요! (15시까지 · 가장 큰 물고기가 우승)', [], 3); toast('🎣 낚시 대회 시작! 남서쪽 해변 부두로 가서 낚싯대를 드리워 보세요'); }
      if (dv.active && h >= 9 && h < 15) {
        const st = S(); const fishers = st.villagers.filter(v => free(v) && v.loc === 'island' && (has(v, 'FISHING') || has(v, 'NATURE') || has(v, 'ADVENTURER') || chance(0.15))).sort(() => Math.random() - 0.5).slice(0, 3);
        const spots = Sim.SPOTS.filter(s => s.place === 'fishpier' && s.tags.includes('derby'));
        fishers.forEach((v, i) => { const sp = spots[(i + h) % spots.length]; if (!sp) return; Sim.scene({ title: '🎣 낚시 대회', actors: { A: v }, steps: [{ go: 'A', to: { loc: 'island', x: sp.x, z: sp.z } }, { pose: 'A', p: 'fish', t: 8 }, { emote: 'A', e: '🎣' }], onEnd: () => { const c = addCatch(v.id, v.name, has(v, 'FISHING') ? 0.4 : 0); Sim.emote(v, c.size > 60 ? '🤩' : '🐟', 3); } }); });
      }
      if (dv.active && h === 15) {
        dv.active = false; const top = dv.catches.slice().sort((a, b) => b.size - a.size);
        if (top.length) { const w1 = top[0]; dv.history.push({ name: w1.name, id: w1.id, fish: w1.fish, size: w1.size, day: day() }); if (dv.history.length > 10) dv.history.shift();
          log(`🏆 낚시 대회 우승: ${w1.name} — ${w1.fish} ${w1.size}cm!${top[1] ? ` (2위 ${top[1].name} ${top[1].size}cm)` : ''}`, [w1.id].filter(x => x !== P), 3);
          if (w1.id === P) { S().player.coins += 500; Soc.giveItem('big_fish'); toast(`🏆 낚시 대회 우승! 상금 500🪙 + 대회급 대물 생선`); } else { const v = Sim.byId(w1.id); if (v) { v.mood = Math.min(100, (v.mood || 50) + 15); Sim.emote(v, '🏆', 5); } }
          if (top.slice(1, 3).some(t => t.id === P)) { S().player.coins += 150; toast('🥈 낚시 대회 입상! 상금 150🪙'); } }
        paintBoard();
      }
    } catch (e) { console.error('derby', e); }
  });
  // 플레이어가 부두에서 낚은 물고기를 대회 기록으로
  const oGive = Soc.giveItem;
  Soc.giveItem = function (id, n) { const r = oGive.apply(this, arguments); try { if (id === 'fish_catch') { const st = S(), p = st.player; if (derby().active && p.loc === 'island' && onPier(p.x, p.z)) { const c = addCatch(P, p.name, 0.2); setTimeout(() => toast(`📏 ${c.fish} ${c.size}cm! 대회 기록판에 올라갔어요`), 400); } } } catch (e) { /* */ } return r; };
  FM.Derby = { derby, addCatch, paintBoard };

  // =========================================================
  // 플레이어 선택지
  // =========================================================
  if (FM.Play && FM.Play.options) {
    const oOpt = FM.Play.options;
    FM.Play.options = function (addOpt) {
      const r = oOpt.apply(this, arguments);
      try {
        const st = S(), p = st.player, h = hour();
        const d = (x, z) => Math.hypot(p.x - x, p.z - z);
        if (p.loc === 'island') {
          // 🎤 버스킹
          if (d(17, 57) < 6) addOpt(2.0, '🎤 버스킹 공연하기', () => {
            FM.UI.modal('🎤 무엇으로 공연할까요?', `<div class="grid-btn">${[['sing', '🎤 노래'], ['guitar', '🎸 기타'], ['piano', '🎹 피아노'], ['dance', '💃 댄스']].map(([k, n]) => `<button data-k="${k}">${n}</button>`).join('')}</div>`, b => b.querySelectorAll('[data-k]').forEach(x => x.onclick = () => {
              FM.UI.closeModal(); const k = x.dataset.k; if (k === 'piano') { p.x = 14.6; p.z = 56.6; } else { p.x = 17; p.z = 56.4; } p.ry = 0; p.pose = k; p.busy = true;
              const crowd = st.villagers.filter(v => free(v) && v.loc === 'island' && Math.hypot(v.x - 17, v.z - 58) < 26).slice(0, 4);
              crowd.forEach((v, i) => { Sim.planRoute && Sim.planRoute(v, { loc: 'island', x: [12.8, 17, 21.2, 11.2][i], z: [61.6, 62.2, 61.6, 58.6][i] }); setTimeout(() => { Sim.emote(v, pick(['👏', '🎵', '😍'])); Soc.addFriend(v.id, P, 3, 2, '버스킹'); }, 4000); });
              setTimeout(() => { p.pose = null; p.busy = false; const tip = 20 + crowd.length * 25 + ((Math.random() * 40) | 0); p.coins += tip; toast(`🎵 공연 끝! 관객 ${crowd.length}명 · 팁 +${tip}🪙`); sfx('coin'); }, 6500);
              toast('🎶 공연을 시작했어요!');
            }));
          });
          // 🌱 텃밭
          if (d(FM.MAP.P.farm.x, FM.MAP.P.farm.z) < 8) {
            const fm = farm(); let bi = -1, bd = 9; BEDS.forEach(([x, z], i) => { const dd = d(x, z); if (dd < bd) { bd = dd; bi = i; } });
            const b = fm.beds[bi];
            if (bi >= 0 && bd < 3) {
              if (!b.crop) addOpt(1.9, '🌱 씨앗 심기', () => FM.UI.modal('🌱 어떤 씨앗을 심을까요?', `<div class="grid-btn">${Object.entries(CROPS).map(([k, c]) => `<button data-c="${k}">${c.name}<small>${c.price}🪙</small></button>`).join('')}</div><p class="muted">물을 준 날마다 한 단계씩 자라고, 3일째에 수확해요</p>`, bb => bb.querySelectorAll('[data-c]').forEach(x => x.onclick = () => { const c = CROPS[x.dataset.c]; if (p.coins < c.price) return toast('코인이 부족해요'); p.coins -= c.price; b.crop = x.dataset.c; b.g = 0; b.wet = day(); b.owner = P; refreshFarm(); FM.UI.closeModal(); toast(`${c.name} 씨앗을 심고 물을 줬어요 🌱`); })));
              else if (b.g >= 3) addOpt(1.9, `🧺 ${CROPS[b.crop].name} 수확하기`, () => { const c = CROPS[b.crop]; Soc.giveItem('veggie_basket'); p.coins += c.sell; const nb = st.villagers.filter(v => v.loc === 'island' && Math.hypot(v.x - p.x, v.z - p.z) < 10).slice(0, 2); nb.forEach(v => { Soc.addFriend(v.id, P, 3, 2, '텃밭 수확 나눔'); Sim.emote(v, '😋', 3); }); toast(`🧺 ${c.name} 수확! +${c.sell}🪙 · 채소 바구니${nb.length ? ` · ${nb.map(v => v.name).join(', ')}와(과) 나눠 먹었어요` : ''}`); b.crop = null; b.g = 0; refreshFarm(); sfx('coin'); });
              else addOpt(1.9, b.wet >= day() ? `💧 ${CROPS[b.crop].name} (오늘은 물을 줬어요 · ${b.g}/3)` : `💧 ${CROPS[b.crop].name}에 물 주기 (${b.g}/3)`, () => { if (b.wet >= day()) return toast('오늘은 이미 물을 줬어요. 내일 아침에 자라요 🌱'); b.wet = day(); p.pose = 'water'; p.prop = 'wateringCan'; setTimeout(() => { p.pose = null; p.prop = null; }, 2200); toast('💧 물을 듬뿍 줬어요! 내일 아침에 쑥 자라요'); });
            }
          }
          // 🏮 마츠리
          if (d(MP().x, MP().z) < 17) {
            const night = h >= 18 || h < 2;
            addOpt(1.9, night ? '🎆 불꽃놀이 쏘아 올리기 (50🪙)' : '🎆 불꽃놀이 (밤에만 · 18시 이후)', () => {
              if (!night) return toast('🌙 불꽃놀이는 밤에 쏘아 올릴 수 있어요');
              if (p.coins < 50) return toast('코인이 부족해요'); p.coins -= 50; launch(10);
              const nb = st.villagers.filter(v => v.loc === 'island' && Math.hypot(v.x - p.x, v.z - p.z) < 25 && !v.sceneId).slice(0, 5);
              nb.forEach(v => { Sim.emote(v, pick(['🎆', '😍', '✨', '🎇']), 4); Soc.addFriend(v.id, P, 2, 2, '불꽃놀이'); });
              const pid = Soc.partnerOf(P), mate = pid && Sim.byId(pid); if (mate && nb.includes(mate)) { Soc.addRomance(mate.id, P, 8); Sim.say(mate, sty(mate, '우와... 너랑 같이 봐서 더 예쁘다 💕'), 4); }
              toast(`🎆 펑! 펑! 밤하늘에 불꽃이 피었어요${nb.length ? ` · ${nb.length}명이 함께 봤어요` : ''}`);
            });
            if (d(MP().x, MP().z + 3.0) < 2.6) addOpt(2.0, '🥁 야구라 북 치기', () => { p.pose = 'drums'; setTimeout(() => { p.pose = null; }, 3500); sfx('drum'); const nb = st.villagers.filter(v => v.loc === 'island' && Math.hypot(v.x - p.x, v.z - p.z) < 14 && !v.sceneId).slice(0, 4); nb.forEach(v => Sim.emote(v, '🥁', 3)); toast('🥁 둥! 둥! 축제 분위기가 달아올라요'); });
            for (const t of MP().stalls) {
              if (d(t.cx, t.z) > 2.4) continue;
              const vend = FM.Ev && FM.Ev.staffById && FM.Ev.staffById('s_yatai_' + t.k);
              const buy = (price, fn) => () => { if (p.coins < price) return toast('코인이 부족해요'); p.coins -= price; sfx('coin'); if (vend) { Sim.emote(vend, pick(['😊', '🙇', '✨']), 2); } fn(); };
              const A = {
                goldfish: ['🐟 금붕어 뜨기 (20🪙)', 20, () => { const n = Math.random() < 0.35 ? 0 : 1 + ((Math.random() * 3) | 0); toast(n ? `🐟 금붕어 ${n}마리를 건졌어요!` : '💦 앗, 뜰채가 찢어졌어요...'); }],
                takoyaki: ['🐙 타코야키 사 먹기 (25🪙)', 25, () => { p.stamina = Math.min(100, (p.stamina || 0) + 18); toast('🐙 앗 뜨거! 겉바속촉 타코야키 (스태미나 +18)'); }],
                cotton: ['🍭 솜사탕 사기 (15🪙)', 15, () => { p.stamina = Math.min(100, (p.stamina || 0) + 8); toast('🍭 구름처럼 폭신한 솜사탕!'); }],
                yakisoba: ['🍜 야키소바 사 먹기 (30🪙)', 30, () => { p.stamina = Math.min(100, (p.stamina || 0) + 25); toast('🍜 철판에서 갓 볶은 야키소바! (스태미나 +25)'); }],
                shooting: ['🎯 사격 게임 (20🪙)', 20, () => { const hit = (Math.random() * 6) | 0; if (hit >= 4) { Soc.giveItem('plush'); toast(`🎯 ${hit}발 명중! 인형 경품 획득 🧸`); } else toast(`🎯 ${hit}발 명중... 아쉬워요!`); }],
                kakigori: ['🍧 빙수 사 먹기 (20🪙)', 20, () => { p.stamina = Math.min(100, (p.stamina || 0) + 12); toast(pick(['🍧 딸기 시럽 빙수! 머리가 띵~', '🍧 블루하와이 빙수! 혀가 파래졌어요'])); }],
                ringo: ['🍎 사과사탕 사기 (20🪙)', 20, () => { p.stamina = Math.min(100, (p.stamina || 0) + 10); toast('🍎 반짝반짝 새빨간 사과사탕!'); }],
                omen: ['🎭 축제 가면 사기 (40🪙)', 40, () => { const m = pick(['여우', '고양이', '도깨비', '토끼', '히어로']); toast(`🎭 ${m} 가면을 샀어요! 주민들이 깜짝 놀랄지도?`); const nb = st.villagers.filter(v => v.loc === 'island' && Math.hypot(v.x - p.x, v.z - p.z) < 10).slice(0, 3); nb.forEach(v => Sim.emote(v, pick(['😆', '😲', '🦊']), 3)); }],
              }[t.k];
              if (A) addOpt(2.0, A[0], buy(A[1], A[2]));
            }
          }
          // 🎣 부두
          if (onPier(p.x, p.z) || d(-76, 86) < 5) {
            const dv = derby();
            addOpt(2.2, dv.active ? `🏆 낚시 대회 기록판 (진행 중 · ${dv.catches.length}마리)` : '🏆 낚시 대회 기록판 보기', () => { const top = dv.catches.slice().sort((a, b) => b.size - a.size).slice(0, 5); FM.UI.modal('🎣 은빛 바늘 낚시 대회', `${dv.active ? '<p>🔴 진행 중 (토요일 15시까지) — 부두에서 낚은 물고기가 자동으로 기록돼요!</p>' : '<p>📅 매주 토요일 9시 ~ 15시. 우승 상금 500🪙</p>'}${top.length ? `<ol>${top.map(t => `<li>${t.name} — ${t.fish} <b>${t.size}cm</b></li>`).join('')}</ol>` : ''}<h4>역대 우승</h4>${dv.history.length ? `<ul>${dv.history.slice().reverse().map(t => `<li>D+${t.day} ${t.name} · ${t.fish} ${t.size}cm</li>`).join('')}</ul>` : '<p class="muted">아직 없어요</p>'}`); });
          }
          // ♨️ 노천탕
          if (d(-44, -92) < 5) addOpt(1.8, '♨️ 노천탕에 몸 담그기', () => { p.x = -44; p.z = -91; p.pose = 'bathe'; setTimeout(() => { p.pose = null; }, 4000); p.stamina = Math.min(100, (p.stamina || 0) + 40); const nb = st.villagers.filter(v => v.loc === 'island' && Math.hypot(v.x + 44, v.z + 92) < 6); nb.forEach(v => { Soc.addFriend(v.id, P, 4, 3, '노천탕'); Sim.emote(v, '♨️', 3); }); toast(`♨️ 하아~ 따끈따끈... 피로가 싹 풀려요 (스태미나 +40)${nb.length ? ` · ${nb.map(v => v.name).join(', ')}와(과) 속 깊은 이야기를 나눴어요` : ''}`); });
        }
        if (p.loc === 'onsen_in') {
          addOpt(1.8, '♨️ 편백 대욕조에서 목욕하기', () => { p.pose = 'bathe'; setTimeout(() => { p.pose = null; }, 4000); p.stamina = Math.min(100, (p.stamina || 0) + 35); toast('♨️ 편백 향이 은은해요... (스태미나 +35)'); });
          addOpt(2.0, '🥛 목욕 후 커피우유 (15🪙)', () => { if (p.coins < 15) return toast('코인이 부족해요'); p.coins -= 15; p.stamina = Math.min(100, (p.stamina || 0) + 10); toast('🥛 허리에 손 얹고 꿀꺽! 역시 목욕 후엔 커피우유'); });
        }
      } catch (e) { console.error('places2 options', e); }
      return r;
    };
  }
})();
