/* =========================================================
 *  새 장소 — 서쪽 곶의 "하얀 등대" + 숨겨진 "별빛 해안 동굴"
 *   🗼 등대 (동쪽 곶): 빨간 줄무늬 탑 · 밤이면 빙글 도는 불빛 · 바다를 보는 벤치 2개
 *      안에는 망원경과 등대 일지 (처음 들어가면 동굴 단서를 얻음)
 *      주민들이 낭만 · 산책 · 혼자 있고 싶을 때 찾아옴
 *   🌊 해안 동굴: 썰물(새벽 5~7시 · 저녁 5~7시)에 등대 아래로 가면 입구 발견
 *      안에서는 하루 한 번 "소원 웅덩이"에 소원을 빌 수 있음 (사랑 · 우정 · 재물 · 건강)
 *      발견 뒤에는 주민들도 몰래 데이트 장소로 씀
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, MAP = FM.MAP;
  if (!Sim || !MAP.P.lighthouse) return;
  const S = () => Sim.get();
  const day = () => Sim.time.day(), hour = () => Sim.time.hour();
  const pick = a => a[(Math.random() * a.length) | 0];
  const toast = t => FM.bus.emit('toast', FM.josa ? FM.josa(t) : t);
  const P3 = (FM.Places3 = {});
  const found = () => { const st = S(); return (st && (st.found || (st.found = {}))) || {}; };

  // 등대 · 동굴 주변 나무 치우기 (월드가 만들어지기 전에)
  if (FM.DECOR) {
    const L = MAP.P.lighthouse, C = MAP.P.seacave, a = FM.DECOR.trees;
    for (let i = a.length - 1; i >= 0; i--) if (Math.hypot(a[i].x - L.x, a[i].z - L.z) < 11 || Math.hypot(a[i].x - C.x, a[i].z - C.z) < 5) a.splice(i, 1);
  }
  // ---------------------------------------------------------
  // 3D
  // ---------------------------------------------------------
  let built = false, beam = null, lamp = null, caveG = null;
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.75 }, o));
  function mesh(geo, m, x, y, z, g) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; }
  function buildLighthouse() {
    const W = FM.W, T = FM.T, L = MAP.P.lighthouse;
    const g = new THREE.Group(); g.position.set(L.x, T.groundY(L.x, L.z), L.z); g.name = 'lighthouse';
    // 받침 바위 + 등대지기 오두막
    mesh(new THREE.CylinderGeometry(3.2, 3.6, 0.6, 20), mat(0x9a948a), 0, 0.3, 0, g);
    const hut = new THREE.Group(); hut.position.set(0, 0, 2.9); hut.rotation.y = Math.PI / 2; g.add(hut);
    mesh(new THREE.BoxGeometry(2.2, 1.8, 2.4), mat(0xf4f0e6), 0, 1.2, 0, hut);
    const roof = mesh(new THREE.ConeGeometry(1.9, 1.1, 4), mat(0xc0392b), 0, 2.65, 0, hut); roof.rotation.y = Math.PI / 4;
    mesh(new THREE.BoxGeometry(0.08, 1.2, 0.8), mat(0x6a4a30), 1.12, 0.95, 0, hut);
    // 줄무늬 탑 (위로 갈수록 가늘게)
    const H = 11, seg = 6;
    for (let i = 0; i < seg; i++) {
      const y0 = 0.6 + (H / seg) * i, r0 = 1.9 - 0.55 * (i / seg), r1 = 1.9 - 0.55 * ((i + 1) / seg);
      mesh(new THREE.CylinderGeometry(r1, r0, H / seg, 22), mat(i % 2 ? 0xd8343a : 0xfaf6ee), 0, y0 + H / seg / 2, 0, g);
    }
    // 창문
    for (let i = 1; i < 5; i += 2) { const w = mesh(new THREE.BoxGeometry(0.35, 0.55, 0.1), mat(0x7ab8e8, { emissive: 0x2a4a6a }), -(1.75 - 0.09 * i), 0.6 + (H / seg) * i + 0.9, 0, g); w.rotation.y = Math.PI / 2; w.castShadow = false; }
    // 전망대 난간 + 유리 등실 + 지붕
    const top = 0.6 + H;
    mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.22, 24), mat(0x2b2b30), 0, top + 0.1, 0, g);
    for (let a = 0; a < 16; a++) { const x = Math.cos(a / 16 * Math.PI * 2) * 1.65, z = Math.sin(a / 16 * Math.PI * 2) * 1.65; mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 5), mat(0x2b2b30), x, top + 0.5, z, g); }
    mesh(new THREE.TorusGeometry(1.65, 0.04, 6, 32), mat(0x2b2b30), 0, top + 0.8, 0, g).rotation.x = Math.PI / 2;
    const glass = mesh(new THREE.CylinderGeometry(0.95, 0.95, 1.3, 16), new THREE.MeshStandardMaterial({ color: 0xcfefff, transparent: true, opacity: 0.45, roughness: 0.1 }), 0, top + 0.85, 0, g); glass.castShadow = false;
    lamp = mesh(new THREE.SphereGeometry(0.42, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff2b0 }), 0, top + 0.85, 0, g); lamp.castShadow = false;
    mesh(new THREE.ConeGeometry(1.25, 1.0, 16), mat(0xd8343a), 0, top + 2.0, 0, g);
    mesh(new THREE.SphereGeometry(0.16, 10, 8), mat(0xffd23a), 0, top + 2.6, 0, g);
    // 빙글 도는 빛줄기 (밤에만)
    beam = new THREE.Group(); beam.position.set(0, top + 0.85, 0); g.add(beam);
    const bm = new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
    for (const s of [1, -1]) { const c = new THREE.Mesh(new THREE.ConeGeometry(2.2, 26, 16, 1, true), bm); c.rotation.z = s * Math.PI / 2; c.position.x = s * 13; beam.add(c); }
    beam.visible = false;
    W.scene.add(g);
    // 바다를 보는 벤치
    for (const sp of L.spots.filter(s => s[3] && s[3].seat)) {
      const b = new THREE.Group(); b.position.set(sp[0], T.groundY(sp[0], sp[1]), sp[1]); b.rotation.y = sp[3].face + Math.PI;
      mesh(new THREE.BoxGeometry(1.6, 0.1, 0.5), mat(0xb07a4a), 0, 0.45, 0, b); mesh(new THREE.BoxGeometry(1.6, 0.5, 0.08), mat(0xb07a4a), 0, 0.75, 0.24, b);
      for (const x of [-0.7, 0.7]) mesh(new THREE.BoxGeometry(0.08, 0.45, 0.45), mat(0x3a3a44), x, 0.22, 0, b);
      W.scene.add(b);
    }
    if (T.addSolid) { T.addSolid(L.x, L.z, 2.0, 'lighthouse'); T.addSolid(L.x, L.z + 2.9, 1.3, 'lh_hut'); }
  }
  function buildCave() {
    if (caveG || !found().cave) return;
    const W = FM.W, T = FM.T, C = MAP.P.seacave;
    const g = new THREE.Group(); g.position.set(C.x, T.groundY(C.x, C.z), C.z); g.rotation.y = Math.PI;
    const rock = mat(0x6a6670);
    for (const [x, y, z, r] of [[-1.6, 0.9, 0, 1.2], [1.6, 0.9, 0, 1.2], [-0.9, 2.0, -0.2, 1.0], [0.9, 2.0, -0.2, 1.0], [0, 2.4, -0.3, 1.1], [-2.4, 0.5, -0.6, 0.9], [2.4, 0.5, -0.6, 0.9]]) mesh(new THREE.DodecahedronGeometry(r, 0), rock, x, y, z, g);
    const hole = mesh(new THREE.CircleGeometry(1.15, 20), new THREE.MeshBasicMaterial({ color: 0x0c0a14 }), 0, 1.05, 0.55, g); hole.castShadow = false;
    for (const [x, y, c] of [[-0.5, 0.5, 0x8fe3ff], [0.4, 0.8, 0xc8a8ff], [0.1, 0.35, 0xffd2ea]]) { const cr = mesh(new THREE.OctahedronGeometry(0.16, 0), new THREE.MeshBasicMaterial({ color: c }), x, y, 0.6, g); cr.castShadow = false; }
    W.scene.add(g); caveG = g;
  }
  function tryBuild() {
    try { if (!FM.W || !FM.W.scene) return; if (!built) { buildLighthouse(); built = true; } buildCave(); } catch (e) { console.error('places3 build', e); }
  }
  setTimeout(tryBuild, 2200);
  FM.bus.on('hour', tryBuild);
  setInterval(() => {
    if (!beam) return;
    const night = (FM.W.nightness || 0) > 0.35;
    beam.visible = night; if (lamp) lamp.material.color.setHex(night ? 0xfff2b0 : 0xe8e0c8);
    if (night) beam.rotation.y += 0.035;
  }, 50);

  // ---------------------------------------------------------
  // 동굴 발견 (썰물 시간에 등대 아래로)
  // ---------------------------------------------------------
  const lowTide = h => (h >= 5 && h < 7) || (h >= 17 && h < 19);
  function discover() {
    const f = found(); if (f.cave) return;
    f.cave = day();
    Sim.log('move', '🌊 썰물이 빠지자 등대 아래 절벽에서 숨겨진 "별빛 해안 동굴" 입구가 드러났어요!', [], 3);
    toast('🌊 숨겨진 장소 발견! 등대 아래 "별빛 해안 동굴" — 안에는 소원 웅덩이가 있대요');
    buildCave(); FM.bus.emit('found', 'cave');
  }
  P3.discover = discover;
  let lastLoc = null;
  setInterval(() => {
    try {
      const st = S(); if (!st || !st.player) return;
      const p = st.player;
      if (p.loc === 'island' && !found().cave && lowTide(hour())) {
        const C = MAP.P.seacave; if (Math.hypot(p.x - C.x, p.z - C.z) < 9) discover();
      }
      if (p.loc !== lastLoc) { const prev = lastLoc; lastLoc = p.loc; if (prev !== null) onEnter(p.loc); }
    } catch (e) { /* */ }
  }, 500);

  function onEnter(loc) {
    const st = S(), f = found();
    if (loc === 'lh_in' && !f.lhJournal) {
      f.lhJournal = day();
      setTimeout(() => FM.UI.modal('📜 등대 일지', `<p>…낡은 일지의 마지막 장에 이렇게 적혀 있다.</p>
        <blockquote style="margin:10px 0;padding:10px 12px;border-left:4px solid #d8343a;background:rgba(0,0,0,.04);border-radius:8px">"썰물이 가장 낮아지는 <b>새벽 5~7시</b>, <b>저녁 5~7시</b>에는 등대 아래 남쪽 절벽에 작은 동굴 입구가 드러난다. 그 안쪽 웅덩이는 소원을 들어준다는 소문이…"</blockquote>
        <p class="muted">${f.cave ? '이미 발견한 동굴이에요!' : '시간을 맞춰 등대 아래로 가 보세요 🌊'}</p>`), 700);
    }
    if (loc === 'cave_in') setTimeout(wishMenu, 900);
  }

  // 소원 웅덩이 (하루 한 번)
  const WISH = {
    love: ['💘 사랑', p => { const r = Soc.partnerOf ? Soc.partnerOf(P) : null; void r; const v = pick(S().villagers.filter(x => !x.child && Soc.canRomance && Soc.canRomance(x.id, 'P'))); if (v) { Soc.addRomance(v.id, 'P', 8, '소원 웅덩이'); return `어디선가 ${v.name}이(가) 내 생각을 하고 있는 것 같아요… (💗 +8)`; } return '물결이 하트 모양으로 퍼졌어요.'; }],
    friend: ['🤝 우정', () => { const vs = S().villagers.filter(x => !x.child).sort(() => Math.random() - 0.5).slice(0, 3); vs.forEach(v => Soc.addFriend(v.id, 'P', 4, 3, '소원 웅덩이')); return `${vs.map(v => v.name).join(', ')}와(과) 조금 더 가까워진 느낌이에요 (친밀도 +4)`; }],
    money: ['🪙 재물', p => { const n = pick([200, 300, 500, 800, 1500]); p.coins += n; return `웅덩이 바닥에서 반짝이는 동전을 발견했어요! (🪙 +${n})`; }],
    health: ['🍀 건강', p => { p.energy = 100; p.stamina = 100; return '차가운 물에 손을 담그자 몸이 개운해졌어요 (기력 회복)'; }],
  };
  const P = 'P';
  function wishMenu() {
    const st = S(), p = st.player, f = found();
    if (p.loc !== 'cave_in') return;
    if (f.wishDay === day()) return toast('💧 소원 웅덩이: 오늘은 이미 소원을 빌었어요. 내일 또 와요!');
    FM.UI.modal('💧 소원 웅덩이', `<p>별빛 수정이 비치는 맑은 웅덩이… 하루에 한 번 소원을 빌 수 있어요.</p><div class="grid-btn">${Object.entries(WISH).map(([k, w]) => `<button data-w="${k}">${w[0]}</button>`).join('')}</div>`, b => {
      b.querySelectorAll('[data-w]').forEach(x => x.onclick = () => {
        f.wishDay = day(); f.wishes = (f.wishes || 0) + 1;
        const msg = WISH[x.dataset.w][1](p);
        FM.UI.closeModal(); FM.Audio && FM.Audio.sfx && FM.Audio.sfx('chime');
        toast(`✨ 소원을 빌었어요 — ${msg}`); FM.bus.emit('wish', x.dataset.w);
      });
    });
  }
  P3.wishMenu = wishMenu;

  // ---------------------------------------------------------
  // 주민 잡담: 새 장소 · 소문 · 행사 이야기 (대화 화제로 섞여 나옴)
  // ---------------------------------------------------------
  const W = FM.Will;
  if (W && W.I && FM.Speech) {
    const apply = (v, t) => FM.Speech.apply(v, FM.josa ? FM.josa(t) : t);
    const LINES = () => {
      const f = found(), d = day(), out = [
        '동쪽 곶에 하얀 등대 가 봤어? 해 질 녘에 진짜 예뻐.', '등대 불빛이 밤마다 빙글빙글 도는 거 봤어? 멍하니 보게 돼.',
        '등대 벤치에서 고백하면 꼭 이루어진대. …누가 그러더라.', `${4 - (d % 4) === 4 ? '오늘 밤' : `${4 - (d % 4)}일 뒤`} 유성우래! 천문대 언덕으로 가자.`,
        '토요일엔 낚시 대회랑 플리마켓이 있잖아. 벌써 설레!', '폰 다이어리에 오늘 할 일 적어 놨어? 다 하면 보너스 준대.',
      ];
      if (!f.cave) out.push('등대지기 일지에 썰물 때 뭔가 보인다고 적혀 있었대… 궁금하지 않아?', '새벽이나 저녁에 등대 아래 바닷물이 쫙 빠진대.');
      else out.push('해안 동굴 소원 웅덩이에 소원 빌어 봤어? 난 비밀이야.', '동굴 안 수정이 별처럼 반짝여. 데이트 장소로 딱이야.');
      if (FM.Ug && FM.Ug.isOpen()) out.push('지하 아파트 로비 오락기, 최고 점수 누가 자꾸 지운대.', '지하 아파트 세탁실 은근 아늑하더라.');
      const tw = S().villagers.filter(v => v.twin); if (tw.length >= 2) out.push(`${tw[0].name}랑 ${tw[1].name}, 쌍둥이인데 성격이 정반대더라!`);
      return out;
    };
    W.I.pl3_news = { w: () => 1.1, say: v => ({ text: apply(v, pick(LINES())), choices: [{ k: 'agree', label: '😄 "나도 가 볼래!"' }, { k: 'ask', label: '❓ "더 얘기해 줘"' }] }), on: (v, k) => (W.I.t3_mono ? W.I.t3_mono.on(v, k) : { text: apply(v, '헤헤.') }) };
  }

  // ---------------------------------------------------------
  // 주민 나들이 목록에 추가 (동굴은 발견 뒤에만)
  // ---------------------------------------------------------
  const O = FM.Outing;
  if (O && O.BUILDINGS) {
    const has = (v, k) => Sim.has(v, k);
    O.BUILDINGS.push(
      ['lighthouse', 9, 21, '하얀 등대', v => 0.3 + (has(v, 'ROMANTIC') ? 1.5 : 0) + (has(v, 'INTROVERT') ? 1 : 0) + (has(v, 'ADVENTURER') ? 1.5 : 0) + (has(v, 'NATURE') ? 1 : 0) + (has(v, 'SCHOLARLY') ? 0.8 : 0) + (Soc.partnerOf(v.id) ? 0.8 : 0)],
      ['seacave', 0, 24, '해안 동굴', v => (found().cave ? 0.2 + (has(v, 'ADVENTURER') ? 1.5 : 0) + (has(v, 'MYSTIC') ? 1.5 : 0) + (Soc.partnerOf(v.id) ? 1 : 0) : 0)],
      ['underground', 0, 24, '지하 로비', v => (FM.Ug && FM.Ug.isOpen() ? (v.home && v.home.startsWith('ug-') ? 1.8 : 0.15) : 0)],
    );
  }
})();
