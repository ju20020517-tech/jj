/* =========================================================
 *  🏖️ 에메랄드 해변 개발 — 놀 수 있는 해변
 *   - 라이프가드 타워 · 비치발리볼 코트 · 모닥불 · 서핑 렌탈 · 카바나 3동 · 파라솔 · 모래성
 *   - 해변 데크길(보드워크) + 가로등 · 부표 줄 · 수영 뗏목 · 카약 · 비치 타월
 *   - 플레이어: 비치발리볼 / 칵테일 / 서핑 / 모닥불 / 카바나 낮잠 / 망루에서 바다 보기
 *   - 주민: 낮엔 비치발리볼 · 서핑, 밤엔 모닥불에 둘러앉아 이야기
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM;
  const PI = Math.PI;
  const lam = c => new THREE.MeshLambertMaterial({ color: c });
  const mc = new Map(); const L = c => { if (!mc.has(c)) mc.set(c, lam(c)); return mc.get(c); };
  const glowM = c => FM.PM.glowMat(c);
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), C = (a, b, h, s = 10) => new THREE.CylinderGeometry(a, b, h, s), Sp = (r, a = 12, b = 10) => new THREE.SphereGeometry(r, a, b);
  const add = (g, geo, m, x, y, z) => { const o = new THREE.Mesh(geo, typeof m === 'number' ? L(m) : m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  const stripe = (a, b) => FM.AC.stripe(a, b);

  function lifeguard() {
    const g = new THREE.Group(); const W = 0xffffff, R = 0xe8483a, WD = 0xd8c4a0;
    for (const [x, z] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) { const l = add(g, C(0.08, 0.1, 2.4, 8), WD, x * 0.85, 1.2, z * 0.85); l.rotation.set(z * 0.06, 0, -x * 0.06); }
    add(g, B(2.4, 0.14, 2.4), WD, 0, 2.4, 0);
    add(g, B(1.8, 1.4, 1.6), W, 0, 3.15, -0.2);
    add(g, B(1.82, 0.36, 1.62), R, 0, 3.4, -0.2);
    add(g, B(1.2, 0.7, 0.04), FM.PM.glassMat(0xbfe8ff), 0, 3.25, 0.62);
    const roof = add(g, new THREE.ConeGeometry(1.7, 0.7, 4), R, 0, 4.2, -0.2); roof.rotation.y = PI / 4;
    for (let i = 0; i < 7; i++) add(g, B(0.9, 0.06, 0.2), WD, 0, 0.3 + i * 0.33, 1.5 - i * 0.11);
    for (const s of [-1, 1]) add(g, B(0.06, 2.6, 0.06), WD, s * 0.45, 1.3, 1.15).rotation.x = -0.32;
    for (const s of [-1, 1]) add(g, B(0.06, 0.6, 2.4), W, s * 1.15, 2.75, 0);
    add(g, B(2.4, 0.06, 0.06), W, 0, 3.05, 1.18);
    const ring = add(g, new THREE.TorusGeometry(0.32, 0.1, 8, 18), R, 1.05, 2.9, 1.22); ring.rotation.y = 0;
    add(g, C(0.03, 0.03, 2.2, 6), 0x9aa0a8, -1.0, 5.0, -1.0);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), new THREE.MeshLambertMaterial({ map: stripe('#e8483a', '#ffd84a'), side: THREE.DoubleSide })); fl.position.set(-0.55, 5.8, -1.0); g.add(fl); g.userData.flag = fl;
    const s = FM.PM.sign('🛟 LIFEGUARD', 1.6, 0.36, '#e8483a', '#ffffff'); s.position.set(0, 3.88, 0.62); g.add(s);
    return g;
  }
  function volleyCourt() {
    const g = new THREE.Group(); const W = 0xffffff;
    for (const [w, d, x, z] of [[9, 0.12, 0, -2.4], [9, 0.12, 0, 2.4], [0.12, 4.9, -4.5, 0], [0.12, 4.9, 4.5, 0], [0.08, 4.9, 0, 0]]) add(g, B(w, 0.02, d), W, x, 0.03, z);
    for (const s of [-1, 1]) { add(g, C(0.06, 0.07, 2.5, 8), 0xe0e0e0, 0, 1.25, s * 2.9); }
    const net = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 0.9), new THREE.MeshLambertMaterial({ map: FM.PM.ctex('vNet', 128, 32, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = '#fafafa'; c.lineWidth = 1.5; for (let x = 0; x <= w; x += 6) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 6) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, 4); }), transparent: true, side: THREE.DoubleSide, alphaTest: 0.3 }));
    net.position.set(0, 1.95, 0); net.rotation.y = PI / 2; g.add(net);
    const ball = add(g, Sp(0.16, 14, 10), new THREE.MeshLambertMaterial({ map: stripe('#ffd84a', '#3a8af0') }), 2.2, 0.16, 1.2); ball.rotation.z = 0.6;
    // 관전 벤치
    for (const s of [-1, 1]) { const b = new THREE.Group(); add(b, B(1.8, 0.08, 0.4), 0xd8c4a0, 0, 0.45, 0); for (const x of [-0.8, 0.8]) add(b, B(0.08, 0.45, 0.35), 0xc8b490, x, 0.22, 0); b.position.set(s * 3.2, 0, -3.4); g.add(b); }
    return g;
  }
  function bonfire() {
    const g = new THREE.Group();
    for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; const s = add(g, Sp(0.2, 8, 6), 0x9a948a, Math.cos(a) * 0.65, 0.1, Math.sin(a) * 0.65); s.scale.y = 0.6; }
    for (let i = 0; i < 4; i++) { const l = add(g, C(0.08, 0.08, 1.0, 6), 0x6a4a2a, 0, 0.25, 0); l.rotation.set(PI / 2 - 0.5, i * PI / 2, 0); }
    const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.0, 10), glowM(0xffa03a)); f1.position.y = 0.6; g.add(f1);
    const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.7, 8), glowM(0xfff07a)); f2.position.y = 0.5; g.add(f2);
    const light = new THREE.PointLight(0xff9a4a, 0, 9, 2); light.position.y = 1.2; g.add(light);
    g.userData.fire = [f1, f2]; g.userData.light = light;
    return g;
  }
  function surfShack() {
    const g = new THREE.Group(); const WD = 0x7ac0c8;
    add(g, B(3.4, 2.4, 2.4), new THREE.MeshLambertMaterial({ map: FM.AC.T.siding(), color: WD }), 0, 1.4, 0);
    add(g, B(3.8, 0.12, 2.9), 0xffffff, 0, 2.7, 0.2).rotation.x = -0.12;
    add(g, B(2.2, 1.0, 0.06), 0x3a3a3a, 0, 1.6, 1.22);
    add(g, B(3.6, 0.2, 2.8), 0xd8c4a0, 0, 0.1, 0.2);
    const s = FM.PM.sign('🏄 SURF RENTAL', 2.6, 0.5, '#ffffff', '#1a8a9a'); s.position.set(0, 2.35, 1.25); g.add(s);
    const cols = [0xff8a5a, 0xffd84a, 0x4fc1e9, 0xff6f9a, 0x8ee07a];
    for (let i = 0; i < 5; i++) { const b = add(g, Sp(0.5, 14, 8), cols[i], -1.4 + i * 0.7, 1.35, 1.9); b.scale.set(0.42, 2.5, 0.08); b.rotation.x = -0.18; }
    add(g, B(3.6, 0.08, 0.12), 0x8a6a4a, 0, 0.9, 1.95);
    return g;
  }
  function cabana(c) {
    const g = new THREE.Group(); const W = 0xffffff;
    for (const [x, z] of [[-1, -1.2], [1, -1.2], [-1, 1.2], [1, 1.2]]) add(g, C(0.05, 0.05, 2.4, 6), W, x, 1.2, z);
    const top = add(g, B(2.3, 0.1, 2.7), new THREE.MeshLambertMaterial({ map: stripe(c, '#ffffff') }), 0, 2.45, 0);
    add(g, new THREE.ConeGeometry(1.65, 0.5, 4), new THREE.MeshLambertMaterial({ map: stripe(c, '#ffffff') }), 0, 2.75, 0).rotation.y = PI / 4;
    const cm = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    for (const s of [-1, 1]) { const cu = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 2.2), cm); cu.position.set(s * 1.0, 1.3, -1.2); g.add(cu); const cu2 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 2.2), cm); cu2.position.set(s * 1.0, 1.3, 1.1); cu2.rotation.y = s * 0.6; g.add(cu2); }
    void top; return g;
  }
  function parasol(c1, c2) { const g = new THREE.Group(); add(g, C(0.04, 0.04, 2.3, 6), 0xffffff, 0, 1.15, 0); const tp = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.5, 12, 1, true), new THREE.MeshLambertMaterial({ map: stripe(c1, c2), side: THREE.DoubleSide })); tp.position.y = 2.35; tp.castShadow = true; g.add(tp); return g; }
  function sandcastle() { const g = new THREE.Group(); const S = 0xf0d8a8; add(g, B(1.4, 0.4, 1.4), S, 0, 0.2, 0); for (const [x, z] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) { add(g, C(0.22, 0.26, 0.8, 10), S, x, 0.4, z); add(g, new THREE.ConeGeometry(0.25, 0.35, 10), S, x, 0.98, z); } add(g, C(0.3, 0.34, 1.1, 12), S, 0, 0.55, 0); add(g, new THREE.ConeGeometry(0.34, 0.5, 12), S, 0, 1.35, 0); add(g, C(0.01, 0.01, 0.5, 4), 0x8a6a4a, 0, 1.8, 0); const f = add(g, B(0.25, 0.15, 0.01), 0xff6f86, 0.12, 1.95, 0); void f; add(g, C(0.15, 0.12, 0.3, 10), 0x4fc1e9, 1.1, 0.15, 0.4); return g; }
  function kayak(c) { const g = new THREE.Group(); const k = add(g, Sp(0.5, 16, 8), c, 0, 0.2, 0); k.scale.set(0.55, 0.32, 3.0); add(g, B(0.5, 0.06, 0.8), 0x2a2a2a, 0, 0.36, 0); const p = add(g, C(0.03, 0.03, 2.0, 6), 0xdddddd, 0.5, 0.1, 0.3); p.rotation.z = PI / 2; return g; }
  function towel(c) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 1.8), new THREE.MeshLambertMaterial({ map: stripe(c, '#ffffff') })); t.receiveShadow = true; return t; }
  function raft() { const g = new THREE.Group(); add(g, B(3, 0.25, 3), new THREE.MeshLambertMaterial({ map: FM.AC.T.plank(), color: 0xd8b88a }), 0, 0.25, 0); for (const [x, z] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) add(g, C(0.3, 0.3, 0.4, 10), 0xffffff, x, 0.0, z); for (const s of [-1, 1]) add(g, C(0.03, 0.03, 1.2, 6), 0xc0c4c8, s * 0.3, 0.6, -1.5).rotation.x = 0.3; return g; }
  function lampPost() { const g = new THREE.Group(); add(g, C(0.05, 0.07, 2.8, 8), 0x2a3a4a, 0, 1.4, 0); const b = new THREE.Mesh(Sp(0.18, 12, 10), glowM(0xfff0c8)); b.position.y = 2.95; b.userData.lampBulb = true; g.add(b); add(g, new THREE.ConeGeometry(0.26, 0.18, 10), 0x2a3a4a, 0, 3.15, 0); return g; }

  let dyn = null;
  FM.Beach = (scene, T) => {
    const root = new THREE.Group(); root.name = 'beachDev';
    const put = (o, x, z, ry = 0, dy = 0) => { o.position.set(x, Math.max(T.height(x, z), 0.05) + dy, z); o.rotation.y = ry; root.add(o); return o; };
    const lg = put(lifeguard(), -46, 90.6, 0);
    put(volleyCourt(), -17, 91, 0);
    const bf = put(bonfire(), -54, 91.6);
    put(surfShack(), -66, 85, 0.15);
    [['#4fc1e9', 32], ['#ff8fb1', 38], ['#ffd84a', 44]].forEach(([c, x]) => put(cabana(c), x, 92.2));
    [['#ff6a5a', '#ffffff', -37, 87.6], ['#4fc1e9', '#ffffff', -31, 87.6], ['#ffd84a', '#ff8fb1', -25, 87.6]].forEach(([a, b, x, z]) => put(parasol(a, b), x, z));
    put(sandcastle(), -8, 95.2, 0.3);
    put(kayak(0xff8a3a), 8, 94.5, 0.2); put(kayak(0x3ab0ff), 10, 94.8, 0.1);
    [['#ff6f86', -22, 88.4, 0.2], ['#4fc1e9', -33, 91.2, -0.3], ['#8ee07a', -42, 92.6, 0.5], ['#ffd84a', 2, 95.5, 0.1]].forEach(([c, x, z, r]) => put(towel(c), x, z, r, 0.02));
    // 보드워크 (모래 위 데크길) + 가로등
    const pm = new THREE.MeshLambertMaterial({ map: FM.AC.T.plank(), color: 0xd8c09a });
    for (let x = -60; x < 16; x += 2) { if (x > -10 && x < 10) continue; const pl = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.12, 1.8), pm); pl.receiveShadow = true; put(pl, x + 1, 83.2, 0, 0.05); }
    const lamps = []; for (const x of [-58, -46, -34, -22, 14, 28]) lamps.push(put(lampPost(), x, 82.0));
    // 부표 줄 · 수영 뗏목
    const buoys = []; for (let x = -56; x <= 20; x += 2.4) { const b = new THREE.Mesh(Sp(0.22, 10, 8), L(Math.round(x / 2.4) % 2 ? 0xff5a3a : 0xffffff)); b.position.set(x, 0.1, 106 + Math.sin(x * 0.1) * 1.5); root.add(b); buoys.push(b); }
    const rf = raft(); rf.position.set(-24, 0.05, 111); root.add(rf);
    // 야자수 (해변 시설 사이)
    root.traverse(o => { if (o.isMesh && !o.material.transparent) { o.castShadow = true; o.receiveShadow = true; } });
    dyn = { lg, bf, lamps, buoys, rf };
    root.onBeforeRender = () => {};
    const tick = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial()); tick.frustumCulled = false;
    tick.onBeforeRender = () => {
      const t = performance.now() / 1000, nt = (FM.W && FM.W.nightness) || 0, sy = FM.W && FM.W.seaY ? FM.W.seaY() : 0.06;
      for (const b of buoys) b.position.y = sy + 0.06 + Math.sin(t * 1.4 + b.position.x * 0.4) * 0.06;
      rf.position.y = sy - 0.05 + Math.sin(t * 1.1) * 0.05; rf.rotation.z = Math.sin(t * 0.9) * 0.03;
      if (lg.userData.flag) lg.userData.flag.rotation.y = Math.sin(t * 3) * 0.25;
      const on = nt > 0.25 || (FM.SimHour && (FM.SimHour() >= 19 || FM.SimHour() < 2));
      for (const f of bf.userData.fire) { f.visible = on; f.scale.y = 1 + Math.sin(t * 13 + f.id) * 0.18; f.scale.x = 1 + Math.cos(t * 11) * 0.1; }
      bf.userData.light.intensity = on ? 1.6 + Math.sin(t * 9) * 0.3 : 0;
    };
    root.add(tick);
    scene.add(root);
    return root;
  };
  FM.SimHour = () => (FM.Sim && FM.Sim.time ? FM.Sim.time.hour() : 12);
})();

// =========================================================
// 해변 놀이 — 플레이어 선택지 + 주민 이벤트
// =========================================================
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc;
  if (!Sim || !Soc) return;
  const P = 'P', S = () => Sim.get();
  const hour = () => Sim.time.hour(), day = () => Sim.time.day();
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const W = FM.Will;
  const sty = (v, t) => (v && W && W.sty ? W.sty(v, t) : t);
  const free = v => v && !v.child && !v.staff && !v.visitor && !v.sceneId && !v.talkingToPlayer && !(v.status && v.status.hospital) && v.loc !== 'metro' && !(Sim.asleep && Sim.asleep(v, hour()));
  const near = (x, z, r) => S().villagers.filter(v => v.loc === 'island' && Math.hypot(v.x - x, v.z - z) < r && free(v));
  const cap = (k, n = 1) => { const st = S(); if (!st.beachEv || st.beachEv.day !== day()) st.beachEv = { day: day(), n: {} }; const c = st.beachEv.n[k] || 0; if (c >= n) return false; st.beachEv.n[k] = c + 1; return true; };
  const log = (t, ids) => Sim.log('rel', t, ids, 2);
  const dress = v => { if (Sim.dressFor) try { Sim.dressFor(v, 'swim'); } catch (e) { /* 옷 없음 */ } };

  // ---- 주민: 비치발리볼 · 모닥불 · 서핑 ----
  function volley() {
    const vs = S().villagers.filter(free).filter(v => v.loc === 'island'); if (vs.length < 2) return;
    const [A, B] = vs.sort(() => Math.random() - 0.5);
    Sim.scene({ title: '🏐 비치발리볼', actors: { A, B }, steps: [
      { par: [{ go: 'A', to: { place: 'beach', spot: 'beachball' } }, { go: 'B', to: { place: 'beach', spot: 'beachball', dx: 7 } }] },
      { do: () => { dress(A); dress(B); } }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
      { par: [{ pose: 'A', p: 'volley', t: 4 }, { pose: 'B', p: 'volley', t: 4 }] },
      { say: 'A', text: sty(A, pick(['간다~ 스파이크!', '받아랏!', '이번엔 안 봐줘!'])), t: 2.5 },
      { par: [{ pose: 'A', p: 'volley', t: 3 }, { pose: 'B', p: 'volley', t: 3 }] },
      { emote: pick(['A', 'B']), e: pick(['😆', '🏆', '💦']) },
    ], onEnd: () => { Soc.addFriend(A.id, B.id, 4, 2, '비치발리볼'); log(`🏐 ${A.name}와(과) ${B.name}이(가) 해변에서 비치발리볼을 했어요`, [A.id, B.id]); } });
  }
  function campfire() {
    const vs = S().villagers.filter(free).filter(v => v.loc === 'island').sort(() => Math.random() - 0.5).slice(0, 3); if (vs.length < 2) return;
    const actors = {}; vs.forEach((v, i) => { actors['ABC'[i]] = v; });
    const spots = [[-56.6, 91.6, Math.PI / 2], [-51.4, 91.6, -Math.PI / 2], [-54, 89.0, 0]];
    const go = vs.map((v, i) => ({ go: 'ABC'[i], to: { loc: 'island', x: spots[i][0], z: spots[i][1] } }));
    const sit = vs.map((v, i) => ({ pose: 'ABC'[i], p: 'sit', t: 9 }));
    const A = vs[0], B = vs[1];
    Sim.scene({ title: '🔥 해변 모닥불', actors, steps: [
      { par: go }, { par: sit },
      { say: 'A', text: sty(A, pick(['파도 소리 들으면서 불 보고 있으니까 좋다...', '마시멜로 구워 왔어! 하나씩 먹어~', '우리 이렇게 모이는 거 오랜만이다.'])), t: 3.5 },
      { emote: 'B', e: pick(['🔥', '😊', '🌙']) },
      { say: 'B', text: sty(B, pick(['별도 엄청 많다. 소원 빌자.', '사실... 요즘 고민이 있었는데 털어놓을게.', '이 순간 사진으로 남기고 싶어.'])), t: 3.5 },
      { par: vs.map((v, i) => ({ emote: 'ABC'[i], e: '✨' })) },
    ], onEnd: () => { for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) Soc.addFriend(vs[i].id, vs[j].id, 3, 2, '모닥불'); for (const v of vs) v.depression = Math.max(0, (v.depression || 0) - 5); log(`🔥 ${vs.map(v => v.name).join(', ')}이(가) 해변 모닥불에 둘러앉아 밤 이야기를 나눴어요`, vs.map(v => v.id)); } });
  }
  function surf() {
    const vs = S().villagers.filter(free).filter(v => v.loc === 'island' && ((v.keys && (v.keys.L1 === 'ADVENTUROUS' || v.keys.L2 === 'ACTIVE')) || chance(0.4))); if (!vs.length) return;
    const A = pick(vs);
    Sim.scene({ title: '🏄 서핑', actors: { A }, steps: [
      { go: 'A', to: { place: 'beach', spot: 'surf' } }, { do: () => dress(A) }, { go: 'A', to: { loc: 'island', x: -62, z: 96 } },
      { pose: 'A', p: 'surf', t: 3 }, { emote: 'A', e: pick(['🌊', '😎', '💦']) }, { say: 'A', text: sty(A, pick(['파도 탔다!!', '으앗, 물 먹었어...', '오늘 파도 최고야!'])), t: 2.5 },
    ], onEnd: () => { A.depression = Math.max(0, (A.depression || 0) - 4); } });
  }
  FM.bus.on('hour', h => {
    try {
      if (h >= 10 && h <= 17 && chance(0.28) && cap('volley', 2)) volley();
      if (h >= 9 && h <= 16 && chance(0.18) && cap('surf', 2)) surf();
      if (h >= 19 && h <= 23 && chance(0.4) && cap('fire', 1)) campfire();
    } catch (e) { console.error('beach ev', e); }
  });
  FM.BeachEv = { volley, campfire, surf };

  // ---- 플레이어 선택지 ----
  if (FM.Play && FM.Play.options) {
    const oOpt = FM.Play.options;
    FM.Play.options = function (addOpt) {
      const r = oOpt.apply(this, arguments);
      try {
        const st = S(), p = st.player; if (p.loc !== 'island' || p.z < 78) return r;
        const d = (x, z) => Math.hypot(p.x - x, p.z - z);
        const toast = t => FM.UI.toast(t), sfx = k => FM.Audio && FM.Audio.sfx && FM.Audio.sfx(k);
        if (d(-17, 91) < 7) addOpt(2.1, '🏐 비치발리볼 한 판', () => {
          const v = near(-17, 91, 30)[0];
          p.x = -13.5; p.z = 91; p.ry = -Math.PI / 2; p.stamina = Math.max(0, (p.stamina || 0) - 8);
          if (!v) return toast('🏐 혼자 서브 연습을 했어요... 같이 할 주민을 데려와 봐요!');
          Sim.scene({ title: '🏐 비치발리볼', actors: { A: v }, steps: [{ go: 'A', to: { place: 'beach', spot: 'beachball' } }, { do: () => dress(v) }, { pose: 'A', p: 'volley', t: 4 }, { say: 'A', text: sty(v, pick(['받아라~!', `${p.name}, 제법인데?`, '한 판 더!'])), t: 2.5 }, { pose: 'A', p: 'volley', t: 3 }, { emote: 'A', e: '😆' }], onEnd: () => Soc.addFriend(v.id, P, 5, 3, '비치발리볼') });
          toast(`🏐 ${v.name}와(과) 비치발리볼 시작! (우정 +5)`); sfx('pop');
        });
        if (d(22, 90.5) < 7) addOpt(2.1, '🍹 코코넛 칵테일 주문 (25🪙)', () => {
          if (p.coins < 25) return toast('코인이 부족해요'); p.coins -= 25; p.stamina = Math.min(100, (p.stamina || 0) + 20); sfx('chime');
          const vs = near(22, 90, 10); for (const v of vs.slice(0, 3)) { Soc.addFriend(v.id, P, 2, 1, '비치 바'); Sim.emote(v, '🍹', 3); }
          toast(`🍹 시원한 코코넛 칵테일! 스태미나 +20${vs.length ? ` · ${vs.slice(0, 3).map(v => v.name).join(', ')}와(과) 건배!` : ''}`);
        });
        if (d(-66, 86) < 7) addOpt(2.2, '🏄 서핑하기 (15🪙)', () => { if (p.coins < 15) return toast('코인이 부족해요'); p.coins -= 15; p.stamina = Math.max(0, (p.stamina || 0) - 10); p.x = -62; p.z = 94; toast(pick(['🏄 큰 파도를 멋지게 탔어요! 🌊', '🏄 몇 번 넘어졌지만 결국 일어섰어요! 💦', '🏄 바닷바람이 상쾌해요~'])); sfx('splash'); });
        if (d(-54, 91.6) < 7 && (hour() >= 18 || hour() < 2)) addOpt(2.0, '🔥 모닥불 피우고 둘러앉기', () => {
          p.x = -54; p.z = 93.2; p.ry = Math.PI; const vs = near(-54, 91, 25).slice(0, 3);
          vs.forEach((v, i) => { Sim.planRoute && Sim.planRoute(v, { loc: 'island', x: [-56.6, -51.4, -54][i], z: [91.6, 91.6, 89.0][i] }); Soc.addFriend(v.id, P, 3, 2, '모닥불'); });
          toast(vs.length ? `🔥 모닥불 곁으로 ${vs.map(v => v.name).join(', ')}이(가) 모여들었어요` : '🔥 탁탁 타는 모닥불... 파도 소리가 들려요');
        });
        if (d(38, 92) < 8) addOpt(2.3, '⛱️ 카바나에서 낮잠', () => { p.x = 38; p.z = 92.2; p.stamina = Math.min(100, (p.stamina || 0) + 25); toast('⛱️ 하얀 커튼이 살랑이는 카바나에서 푹 쉬었어요 (스태미나 +25)'); });
        if (d(-46, 89) < 6) addOpt(2.3, '🛟 망루에 올라 바다 보기', () => { p.stamina = Math.min(100, (p.stamina || 0) + 10); toast(pick(['🛟 멀리 페리가 지나가요 ⛴️', '🛟 에메랄드빛 바다 위로 갈매기가 날아요', '🛟 부표 너머 수영 뗏목에서 누가 손을 흔들어요 👋'])); });
        if (d(-8, 95) < 5) addOpt(2.4, '🏰 모래성 쌓기', () => { p.stamina = Math.max(0, (p.stamina || 0) - 5); toast('🏰 탑이 네 개 달린 멋진 모래성을 완성했어요!'); });
      } catch (e) { console.error('beach options', e); }
      return r;
    };
  }
})();
