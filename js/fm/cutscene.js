/* =========================================================
 *  드라마 컷신 — 고백 · 이별 · 프로포즈 · 결혼 · 바람 들통 · 삼각관계 …
 *  사건이 생기면 친구모아 아일랜드처럼 '한 편의 애니메이션 드라마'로 보여 줌
 *  - 전용 3D 무대 (테마별 배경 · 조명 · 소품)
 *  - 카메라 컷 (와이드 → 말하는 주민 클로즈업 → 리액션 · 줌인)
 *  - 만화 연출 (집중선 · 반짝이 · 하트 · 비 · 번개 · 흔들림 · 에피소드 타이틀/엔딩 카드)
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE, Sim = FM.Sim;
  const Cut = (FM.Cut = {});
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const J = t => FM.josa(t);
  const st = () => Sim.get();
  const P = 'P';
  const pick = a => a[(Math.random() * a.length) | 0];
  const who = id => (id === P ? st().player : Sim.byId(id));
  const sfx = k => { try { FM.Audio.sfx(k); } catch (e) { /* 무시 */ } };

  // ---------------------------------------------------------
  // 테마 — 배경 · 조명 · 소품 · 에피소드 제목
  // ---------------------------------------------------------
  const THEME = {
    confess: { bg: 'linear-gradient(180deg,#ff9a8b 0%,#ffc3a0 38%,#ffe0c8 60%,#9fd8f0 61%,#6cc4e8 100%)', floor: 0x9fdc7a, light: [0xffd0b0, 0.9], hemi: [0xffe8d8, 0x8a70a0, 0.6], props: 'tree', fx: 'sparkle',
      titles: ['너에게 닿기를', '노을빛 고백', '두근두근 고백 대작전', '심장이 터질 것 같아', '용기를 낸 날'] },
    reunion: { bg: 'linear-gradient(180deg,#ffb8d0 0%,#ffd6e6 50%,#fff0f6 100%)', floor: 0xffe4ee, light: [0xfff0f4, 0.85], hemi: [0xffffff, 0xd09ab0, 0.65], props: 'lamp', fx: 'sparkle',
      titles: ['다시 만난 우리', '돌고 돌아 너에게', '그때 그 사람'] },
    fate: { bg: 'radial-gradient(circle at 50% 20%,#4a3a8a 0%,#1f1a44 60%,#120e2a 100%)', floor: 0x6a6a9a, light: [0xb0c0ff, 0.8], hemi: [0x9ab0ff, 0x302050, 0.5], props: 'fountain', fx: 'stars',
      titles: ['운명의 불꽃', '눈이 마주친 순간', '별이 쏟아지는 밤'] },
    propose: { bg: 'radial-gradient(circle at 50% 30%,#fff 0%,#ffe6f0 50%,#ffc8dc 100%)', floor: 0xfff4f8, light: [0xffffff, 0.9], hemi: [0xffffff, 0xe0a0c0, 0.65], props: 'arch', fx: 'petals',
      titles: ['평생을 약속해', '반지 속 비밀', '나와 결혼해 줄래?'] },
    wedding: { bg: 'radial-gradient(circle at 50% 25%,#fffdf6 0%,#fff0f6 45%,#ffd6e6 100%)', floor: 0xffffff, light: [0xfff8f0, 0.95], hemi: [0xffffff, 0xe0b0c8, 0.7], props: 'arch', fx: 'petals',
      titles: ['행복한 결혼식', '두 사람의 약속', '웨딩 벨이 울리면'] },
    breakup: { bg: 'linear-gradient(180deg,#5a6a80 0%,#8594a8 55%,#a8b4c4 100%)', floor: 0x7a8a8a, light: [0xb8c8e0, 0.55], hemi: [0xa0b0c8, 0x303848, 0.55], props: 'lamp', fx: 'rain',
      titles: ['안녕, 나의 사랑', '비 오는 날의 이별', '우리 여기까지인가 봐', '엇갈린 마음'] },
    affair: { bg: 'radial-gradient(circle at 50% 30%,#6a2a5a 0%,#2a1030 70%,#140818 100%)', floor: 0x4a3050, light: [0xff90c0, 0.75], hemi: [0xc080ff, 0x200818, 0.45], props: 'spot', fx: 'thunder',
      titles: ['들켜 버린 비밀', '배신의 밤', '거짓말의 끝', '충격! 그날의 진실'] },
    fight: { bg: 'radial-gradient(circle at 50% 40%,#ff9a5a 0%,#c0402a 60%,#5a1a10 100%)', floor: 0x8a5a4a, light: [0xffc090, 0.8], hemi: [0xffa070, 0x301008, 0.5], props: 'spot', fx: 'thunder',
      titles: ['불꽃 튀는 대결', '용서 못 해!', '원수가 된 날', '전쟁의 시작'] },
    triangle: { bg: 'radial-gradient(circle at 50% 30%,#8a4ab0 0%,#4a2060 60%,#200a30 100%)', floor: 0x6a4a80, light: [0xe0a0ff, 0.75], hemi: [0xd0a0ff, 0x200830, 0.45], props: 'spot', fx: 'thunder',
      titles: ['엇갈린 화살표', '삼각관계의 시작', '누구를 선택할까', '같은 사람을 좋아해'] },
    makeup: { bg: 'linear-gradient(180deg,#a8e6ff 0%,#e0f6ff 55%,#fff8e0 100%)', floor: 0xa8e08a, light: [0xfff4e0, 0.9], hemi: [0xffffff, 0x80b0a0, 0.65], props: 'tree', fx: 'sparkle',
      titles: ['다시 친구', '화해의 악수', '미안해, 고마워'] },
    baby: { bg: 'radial-gradient(circle at 50% 30%,#fffbe0 0%,#fff0c8 50%,#ffe0b0 100%)', floor: 0xfff0d8, light: [0xfff4e0, 0.95], hemi: [0xffffff, 0xe0c090, 0.7], props: 'crib', fx: 'stars',
      titles: ['새로운 가족', '작은 기적', '어서 와, 아가야'] },
    divorce: { bg: 'linear-gradient(180deg,#8a6a4a 0%,#b89a78 60%,#d8c4a8 100%)', floor: 0x9a7a5a, light: [0xffe8c8, 0.7], hemi: [0xfff0d8, 0x503820, 0.55], props: 'bench', fx: 'rain',
      titles: ['각자의 길', '법정에 선 두 사람', '마지막 인사'] },
    jealous: { bg: 'radial-gradient(circle at 50% 40%,#b0e070 0%,#5a8a30 60%,#1a3010 100%)', floor: 0x7a9a5a, light: [0xe0ffb0, 0.75], hemi: [0xe0ffb0, 0x203010, 0.5], props: 'spot', fx: 'thunder',
      titles: ['질투의 화신', '부글부글', '저 둘 뭐야?!'] },
    crushEnd: { bg: 'linear-gradient(180deg,#d0a070 0%,#e8c8a0 50%,#f4e0c8 100%)', floor: 0xc8a070, light: [0xffd8a8, 0.7], hemi: [0xffe0c0, 0x604020, 0.55], props: 'tree', fx: 'leaves',
      titles: ['전하지 못한 마음', '낙엽처럼', '짝사랑 안녕'] },
  };
  function themeOfTitle(t) {
    t = t || '';
    if (/고백/.test(t)) return 'confess';
    if (/이혼/.test(t)) return 'divorce';
    if (/이별/.test(t)) return 'breakup';
    if (/결혼식/.test(t)) return 'wedding';
    if (/프로포즈/.test(t)) return 'propose';
    if (/REUNION|재회/.test(t)) return 'reunion';
    if (/바람/.test(t)) return 'affair';
    if (/화해/.test(t)) return 'makeup';
    return null;
  }

  // ---------------------------------------------------------
  // 대본 만들기
  // ---------------------------------------------------------
  const HOT = /[!！]{2}|‼|안 돼|뭐라고|어떻게 이럴|배신|용서|싫어|헤어지|반대/;
  function flatten(steps, out = []) {
    for (const s of steps || []) { if (s.par) flatten(s.par, out); else out.push(s); }
    return out;
  }
  // Sim.scene → 컷신 대본
  Cut.fromScene = function (sc) {
    const theme = themeOfTitle(sc.title); if (!theme) return null;
    const cast = {};
    for (const [k, v] of Object.entries(sc.actors)) if (v) cast[k] = v;
    const beats = [];
    for (const s of flatten(sc.steps)) {
      if (s.say && cast[s.say]) { const text = typeof s.text === 'function' ? s.text() : s.text; if (text) beats.push({ say: s.say, text: String(text) }); }
      else if (s.emote && cast[s.emote]) beats.push({ emo: s.emote, e: s.e });
      else if (s.fx) beats.push({ fx: s.fx, at: s.at });
      else if (s.pose && cast[s.pose] && s.p) beats.push({ pose: s.pose, p: s.p });
    }
    if (!beats.some(b => b.say)) return null;
    // 대사에 나오는 배우 위주로 무대에 세움 (최대 4명)
    const speak = [...new Set(beats.filter(b => b.say).map(b => b.say))];
    const keys = [...new Set(['A', 'B'].filter(k => cast[k]).concat(speak))].slice(0, 4);
    const cast2 = {}; for (const k of keys) cast2[k] = cast[k];
    const outcome = beats.some(b => b.fx === 'hearts' || b.fx === 'ring' || b.fx === 'fireworks') ? 'happy' : beats.some(b => b.fx === 'brokenHeart' || b.fx === 'question') ? 'sad' : null;
    return { theme, title: sc.title, cast: cast2, beats: beats.filter(b => !(b.say || b.emo || b.pose) || cast2[b.say || b.emo || b.pose]), outcome, key: keys.map(k => cast2[k].id).sort().join('|') };
  };

  // 로그 → 컷신 (장면 없이 기록만 남는 사건)
  const sty = (v, t) => (v && v.id !== P && FM.L && FM.L.sty ? FM.L.sty(v, t) : t);
  const LOGCUT = [
    { type: 'triangle', re: /삼각관계!/, make: ids => { const [a, b, t] = ids.map(who); if (!a || !b || !t) return null; return { theme: 'triangle', cast: { A: a, B: b, C: t }, beats: [
      { say: 'C', text: sty(t, '어... 둘 다 여기서 뭐 해?') }, { emo: 'A', e: '😳' },
      { say: 'A', text: sty(a, `${t.name}은(는) 내가 먼저 좋아했어!`) }, { fx: 'shock' },
      { say: 'B', text: sty(b, '무슨 소리야! 마음에 먼저가 어디 있어?') }, { emo: 'B', e: '💢' }, { pose: 'A', p: 'glare' }, { pose: 'B', p: 'glare' },
      { say: 'C', text: sty(t, '(어, 어떡하지... 두 사람 다 소중한데...)') }, { emo: 'C', e: '💦' }], outcome: 'tbc' }; } },
    { type: 'triangle', re: /모두 .*독점하고|사각/, make: ids => { const vs = ids.map(who).filter(Boolean).slice(0, 3); if (vs.length < 3) return null; const [a, b, t] = vs; return { theme: 'triangle', cast: { A: a, B: b, C: t }, beats: [
      { emo: 'A', e: '💢' }, { emo: 'B', e: '💢' }, { say: 'A', text: sty(a, `${t.name === st().player.name ? '너' : t.name}의 옆자리는 내 거야!`) }, { fx: 'shock' },
      { say: 'B', text: sty(b, '웃기지 마! 내가 먼저였거든?') }, { pose: 'A', p: 'tug' }, { pose: 'B', p: 'tug' }, { say: 'C', text: sty(t, '둘 다 진정해...!') }, { emo: 'C', e: '💦' }], outcome: 'tbc' }; } },
    { type: 'triangle', re: /연인이 있는 .*연적이 됐어요/, make: ids => { const [a, t, pt] = ids.map(who); if (!a || !t || !pt) return null; return { theme: 'triangle', cast: { A: a, B: pt, C: t }, beats: [
      { say: 'C', text: sty(t, `${pt.name === st().player.name ? '자기' : pt.name}야, 오늘 산책 갈까?`) }, { emo: 'A', e: '😳' },
      { say: 'A', text: sty(a, `(${t.name}에겐 연인이 있는데... 왜 자꾸 눈이 가는 걸까)`) }, { emo: 'B', e: '😠' },
      { say: 'B', text: sty(pt, '...방금 그 눈빛 뭐야? 내 사람한테 관심 끄지?') }, { fx: 'shock' }, { pose: 'A', p: 'glare' }, { pose: 'B', p: 'glare' },
      { say: 'A', text: sty(a, '마음은... 내 마음대로 안 되는 거라고!') }], outcome: 'tbc' }; } },
    { type: 'rel', re: /라이벌 —|앙숙 —/, make: ids => { const [a, b] = ids.map(who); if (!a || !b) return null; return { theme: 'fight', cast: { A: a, B: b }, beats: [
      { pose: 'A', p: 'point' }, { say: 'A', text: sty(a, '이번엔 절대 안 져! 두고 봐!') }, { fx: 'shock' },
      { say: 'B', text: sty(b, '흥, 그 말 몇 번째야? 덤벼!') }, { emo: 'B', e: '🔥' }, { pose: 'B', p: 'flex' }, { pose: 'A', p: 'stomp' }], outcome: 'tbc' }; } },
    { type: 'rel', re: /화해했어요/, make: ids => { const [a, b] = ids.map(who); if (!a || !b) return null; return { theme: 'makeup', cast: { A: a, B: b }, beats: [
      { say: 'A', text: sty(a, '저기... 그때는 내가 미안했어') }, { emo: 'B', e: '😳' }, { say: 'B', text: sty(b, '...나도. 사실 계속 신경 쓰였어') },
      { pose: 'A', p: 'highfive' }, { pose: 'B', p: 'highfive' }, { fx: 'sparkle', at: 'A' }, { emo: 'A', e: '😊' }], outcome: 'happy' }; } },
    { type: 'affair', re: /목격했/, make: ids => { const [w, a, b] = ids.map(who); if (!w || !a || !b) return null; return { theme: 'affair', cast: { A: a, B: b, C: w }, beats: [
      { say: 'A', text: sty(a, '여기라면 아무도 못 보겠지?') }, { say: 'B', text: sty(b, '쉿... 누가 오면 어떡해') }, { emo: 'B', e: '💕' },
      { fx: 'shock' }, { emo: 'C', e: '😱' }, { say: 'C', text: sty(w, '저, 저 둘... 설마?!') }, { pose: 'C', p: 'coverEyes' }], outcome: 'tbc' }; } },
    { type: 'rel', re: /원수가 됐어요/, make: ids => { const [a, b] = ids.map(who); if (!a || !b) return null; return { theme: 'fight', cast: { A: a, B: b }, beats: [
      { pose: 'A', p: 'glare' }, { pose: 'B', p: 'glare' }, { say: 'A', text: sty(a, '이제 참는 것도 끝이야!') }, { fx: 'shock' },
      { say: 'B', text: sty(b, '그건 내가 할 말이야! 다시는 말 걸지 마!') }, { emo: 'A', e: '💢' }, { emo: 'B', e: '💢' }, { pose: 'A', p: 'stomp' }], outcome: 'sad' }; } },
    { type: 'jealous', re: /질투해요/, make: ids => { const [w, p1, r] = ids.map(who); if (!w || !p1) return null; const c = { A: w, B: p1 }; if (r) c.C = r; return { theme: 'jealous', cast: c, beats: [
      { say: 'B', text: sty(p1, r ? `${r.name}랑 얘기하는 거 재밌더라~` : '오늘 재밌었어~') }, { emo: 'A', e: '😠' },
      { say: 'A', text: sty(w, '...흥! 나보다 그쪽이 더 좋은가 보지?') }, { fx: 'shock' }, { say: 'B', text: sty(p1, '에? 왜 화났어?!') }, { emo: 'B', e: '❓' }, { pose: 'A', p: 'tantrum' }], outcome: 'tbc' }; } },
    { type: 'baby', re: /태어났어요/, make: ids => { const [a, b] = ids.map(who); if (!a || !b) return null; return { theme: 'baby', cast: { A: a, B: b }, beats: [
      { emo: 'A', e: '😭' }, { say: 'A', text: sty(a, '우리 아기... 너무 작고 소중해...') }, { pose: 'A', p: 'holdBaby' },
      { say: 'B', text: sty(b, '어서 와, 아가야. 우리가 행복하게 해 줄게') }, { fx: 'hearts', at: 'B' }, { emo: 'B', e: '🥰' }], outcome: 'happy' }; } },
    { type: 'romance', re: /운명의 불꽃/, make: ids => { const [a, b] = ids.map(who); if (!a || !b) return null; return { theme: 'fate', cast: { A: a, B: b }, beats: [
      { emo: 'A', e: '😳' }, { emo: 'B', e: '😳' }, { fx: 'shock' }, { say: 'A', text: sty(a, '(방금... 눈이 마주쳤어...)') }, { say: 'B', text: sty(b, '(심장이... 왜 이렇게 뛰지?)') }, { fx: 'hearts', at: 'A' }, { emo: 'A', e: '💓' }], outcome: 'tbc' }; } },
    { type: 'crush', re: /마음을 접었어요/, make: ids => { const [a] = ids.map(who); if (!a) return null; const t = a.crush && who(a.crush.target); return { theme: 'crushEnd', cast: t ? { A: a, B: t } : { A: a }, beats: [
      { say: 'A', text: sty(a, '결국... 한마디도 못 했네') }, { emo: 'A', e: '😢' }, { pose: 'A', p: 'wipeTear' }, { say: 'A', text: sty(a, '그래도 좋아했던 시간은 행복했어. 안녕, 내 첫 마음') }], outcome: 'sad' }; } },
    { type: 'couple', re: /헤어지고 .*사귀|공개 연애/, make: ids => { const [a, b] = ids.map(who); if (!a || !b) return null; return { theme: 'affair', cast: { A: a, B: b }, beats: [
      { say: 'A', text: sty(a, '이제 더는 숨기지 않을래') }, { say: 'B', text: sty(b, '세상이 뭐라 해도... 너만 있으면 돼') }, { fx: 'hearts', at: 'A' }, { fx: 'shock' }], outcome: 'tbc' }; } },
  ];
  function fromLog(e) {
    if (!e || e.secret) return null;
    for (const r of LOGCUT) if (r.type === e.type && r.re.test(e.text)) {
      const ids = (e.who || []).slice();
      const c = r.make(ids); if (!c) return null;
      c.title = e.text; c.fromLog = true; c.key = Object.values(c.cast).map(v => v.id).sort().join('|');
      return c;
    }
    return null;
  }

  // ---------------------------------------------------------
  // 큐 · 자동 재생
  // ---------------------------------------------------------
  const queue = [];
  const recent = new Map();
  let playing = null;
  const busy = () => (FM.UI.modalOpen && FM.UI.modalOpen()) || FM.UI.editing || $('#newsShow') || (FM.G && FM.G.view === 'observe' && false);
  function enqueue(c, force) {
    if (!c) return;
    const now = st().time;
    const last = recent.get(c.key + c.theme);
    if (last !== undefined && now - last < 60) return;           // 같은 사건 중복 방지 (게임 1시간)
    if (c.fromLog) { const lt = recent.get('theme:' + c.theme); if (lt !== undefined && now - lt < 180) return; recent.set('theme:' + c.theme, now); }
    recent.set(c.key + c.theme, now);
    const mine = Object.values(c.cast).some(v => v.id === P);
    c.mine = mine;
    queue.push(c); if (queue.length > 8) queue.shift();
    badge();
    const s = st();
    const auto = s.flags.autoCut !== false;
    if ((force || mine || (auto && s.speed <= 15)) && !playing && !busy()) setTimeout(() => { if (!playing && !busy()) Cut.playNext(); }, 400);
    else if (!playing) teaser(c);
  }
  Cut.enqueue = enqueue;
  Cut.playNext = function () { const c = queue.shift(); badge(); if (c) play(c); };
  function badge() {
    const b = $('#btnCut'); if (!b) return;
    b.dataset.badge = queue.length ? String(queue.length) : '';
    b.classList.toggle('pulse', !!queue.length);
  }
  function teaser(c) {
    const el = $('#cutTeaser'); if (!el) return;
    const vs = Object.values(c.cast).slice(0, 3);
    el.innerHTML = `<span class="ct-tag">🎬 드라마</span>${vs.map(v => FM.Face.img(v, 30)).join('')}<span class="ct-t">${esc(THEME[c.theme].titles[0])} — 보러 가기</span>`;
    el.hidden = false; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
    clearTimeout(el._t); el._t = setTimeout(() => { el.hidden = true; }, 7000);
    el.onclick = () => { el.hidden = true; if (!playing) Cut.playNext(); };
  }

  // ---------------------------------------------------------
  // 3D 무대
  // ---------------------------------------------------------
  function buildStage(cv, c) {
    const T = THEME[c.theme];
    const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.4 : 2));
    R.outputEncoding = THREE.sRGBEncoding; R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(T.hemi[0], T.hemi[1], T.hemi[2]));
    const key = new THREE.DirectionalLight(T.light[0], T.light[1]); key.position.set(2.5, 5, 4); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 }); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.35); rim.position.set(-3, 3, -4); scene.add(rim);
    const M = col => new THREE.MeshLambertMaterial({ color: col });
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.3, 40), M(T.floor)); floor.position.y = -0.15; floor.receiveShadow = true; scene.add(floor);
    const g = new THREE.Group(); scene.add(g);
    // 소품
    if (T.props === 'tree') {
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.6, 8), M(0x9a6a44)); tr.position.set(-2.3, 0.8, -1.8); tr.castShadow = true; g.add(tr);
      for (const [x, y, r] of [[-2.3, 2, 0.8], [-1.8, 1.7, 0.55], [-2.8, 1.75, 0.55]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), M(c.theme === 'confess' ? 0xffb8d0 : 0x7fd06a)); b.position.set(x, y, -1.8); b.castShadow = true; g.add(b); }
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.45), M(0xc08a5a)); bench.position.set(2.2, 0.42, -1.5); g.add(bench);
      for (const sx of [-0.6, 0.6]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.4), M(0x7a5a3a)); l.position.set(2.2 + sx, 0.21, -1.5); g.add(l); }
    } else if (T.props === 'arch') {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.09, 8, 32, Math.PI), M(0xffffff)); arch.position.set(0, 0, -1.3); g.add(arch);
      const fc = [0xff8fb1, 0xffffff, 0xffd6e6, 0xffe08a];
      for (let i = 0; i <= 18; i++) { const a = i / 18 * Math.PI; const f = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), M(fc[i % 4])); f.position.set(Math.cos(a) * 1.7, Math.sin(a) * 1.7, -1.3); g.add(f); }
      for (const sx of [-2.6, 2.6]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.1, 12), M(0xffffff)); p.position.set(sx, 0.55, -0.8); g.add(p); const fl = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), M(0xffb8d0)); fl.position.set(sx, 1.25, -0.8); g.add(fl); }
    } else if (T.props === 'lamp') {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.4, 8), M(0x3a3a48)); pole.position.set(2.1, 1.2, -1.4); g.add(pole);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff0b0 })); bulb.position.set(2.1, 2.45, -1.4); g.add(bulb);
      const pl = new THREE.PointLight(0xffe0a0, 0.8, 5); pl.position.copy(bulb.position); g.add(pl);
    } else if (T.props === 'fountain') {
      const b1 = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.4, 0.4, 24), M(0xd8d8e8)); b1.position.set(0, 0.2, -2); g.add(b1);
      const w = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.05, 24), new THREE.MeshBasicMaterial({ color: 0x80b8ff })); w.position.set(0, 0.4, -2); g.add(w);
      const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.2, 10), M(0xd8d8e8)); c2.position.set(0, 0.9, -2); g.add(c2);
    } else if (T.props === 'crib') {
      const cr = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.7), M(0xffffff)); cr.position.set(0, 0.5, -1.4); g.add(cr);
      const bl = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 0.55), M(0xffd6e6)); bl.position.set(0, 0.82, -1.4); g.add(bl);
      for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), new THREE.MeshBasicMaterial({ color: [0xffd84a, 0x8fd3ff, 0xff8fb1][i % 3] })); s.position.set(-0.6 + i * 0.3, 1.9, -1.4); g.add(s); }
    } else if (T.props === 'bench') {
      const d = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 0.6), M(0x6a4a30)); d.position.set(0, 0.45, -2.2); g.add(d);
    }
    let spot = null;
    if (T.props === 'spot' || c.theme === 'affair' || c.theme === 'triangle') {
      spot = new THREE.SpotLight(0xffffff, 1.2, 12, 0.5, 0.6); spot.position.set(0, 6, 2); spot.target.position.set(0, 0, 0); scene.add(spot, spot.target);
    }
    // 배우
    const keys = Object.keys(c.cast);
    const n = keys.length;
    const slots = n === 1 ? [[0, 0]] : n === 2 ? [[-0.8, 0], [0.8, 0]] : n === 3 ? [[-1.05, 0.15], [1.05, 0.15], [0, -0.85]] : [[-0.8, 0], [0.8, 0], [-1.9, -0.8], [1.9, -0.8]];
    const actors = {};
    keys.forEach((k, i) => {
      const v = c.cast[k];
      let look; try { look = v.id === P ? v.look : FM.Chars.outfitLook(v); } catch (e) { look = v.look; }
      const ch = ISLE.M.character(look || ISLE.randomLook());
      ch.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
      const [x, z] = slots[i];
      ch.root.position.set(x, 0, z);
      scene.add(ch.root);
      actors[k] = { ch, home: new THREE.Vector3(x, 0, z), pose: null, poseT: 0, emo: null, emoT: 0, enter: i < 2 ? (i === 0 ? -1 : 1) : 0 };
    });
    // 서로 마주보기 (두 주인공), 나머지는 가운데를 봄
    // 무대 연출: 카메라 쪽을 보면서 상대에게 살짝 몸을 튼 3/4 자세 (얼굴이 잘 보이게)
    const faceAll = () => {
      for (const k of keys) {
        const a = actors[k]; const p = a.ch.root.position;
        if (keys.length >= 2 && (k === keys[0] || k === keys[1])) { const o = actors[k === keys[0] ? keys[1] : keys[0]].ch.root.position; a.ch.root.rotation.y = Math.sign(o.x - p.x || 1) * 0.62; }
        else a.ch.root.rotation.y = Math.atan2(-p.x, 4 - p.z) * 0.6;
      }
    };
    // 입장 — 양옆에서 걸어 들어옴
    for (const k of keys) { const a = actors[k]; if (a.enter) a.ch.root.position.x = a.home.x + a.enter * 2.6; }
    const headPos = k => { const v = new THREE.Vector3(); actors[k].ch.head.getWorldPosition(v); return v; };
    // 카메라
    const camPos = new THREE.Vector3(0, 1.4, 8), camLook = new THREE.Vector3(0, 0.6, 0);
    const want = { pos: new THREE.Vector3(0, 1.05, 5.4), look: new THREE.Vector3(0, 0.62, 0), speed: 2.2 };
    const shot = (kind, k) => {
      const far = keys.length > 2 ? 1 : 0;
      if (kind === 'wide' || !k || !actors[k]) { want.pos.set(0, 1.1 + far * 0.2, 5.4 + far * 1.1); want.look.set(0, 0.62, -far * 0.3); want.speed = 2; return; }
      const h = headPos(k); const side = h.x < -0.05 ? 1 : h.x > 0.05 ? -1 : 0;   // 상대(가운데) 쪽에서 비스듬히
      if (kind === 'close') { want.pos.set(h.x + side * 0.7, h.y + 0.12, h.z + 3.0); want.look.set(h.x + side * 0.15, h.y - 0.12, h.z); want.speed = 3; }
      else if (kind === 'two') { want.pos.set(h.x * 0.9 + side * 1.4, h.y + 0.25, h.z + 3.9); want.look.set(-h.x * 0.25, h.y - 0.25, h.z); want.speed = 2.4; }
      else if (kind === 'zoom') { want.pos.set(h.x + side * 0.35, h.y + 0.06, h.z + 2.05); want.look.set(h.x + side * 0.06, h.y - 0.06, h.z); want.speed = 8; }
      else if (kind === 'low') { want.pos.set(h.x * 0.6 + side * 0.6, 0.3, h.z + 3.5); want.look.set(h.x * 0.8, h.y, h.z); want.speed = 2.4; }
    };
    const resize = () => { const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    window.addEventListener('resize', resize); resize();
    let raf = 0, last = performance.now(), alive = true, t = 0;
    let shake = 0;
    const loop = now => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      for (const k of keys) {
        const a = actors[k], ch = a.ch;
        const p = ch.root.position;
        const dx = a.home.x - p.x;
        const walking = Math.abs(dx) > 0.02;
        if (walking) { p.x += Math.sign(dx) * Math.min(Math.abs(dx), dt * 1.3); ch.root.rotation.y = Math.atan2(Math.sign(dx), 0); }
        ISLE.M.animate(ch, dt, walking ? 0.6 : 0);
        if (!walking) {
          if (!a.faced) { a.faced = true; faceAll(); }
          a.poseT += dt; a.emoT += dt;
          if (a.pose && FM.Anim.POSES[a.pose]) FM.Anim.POSES[a.pose](ch, a.poseT);
          if (a.emo) FM.Anim.POSES._emoGesture(ch, a.emo, a.emoT);
          if (a.talking && !a.pose) FM.Anim.POSES.talk(ch, a.poseT);
        }
      }
      const k2 = 1 - Math.exp(-dt * want.speed);
      camPos.lerp(want.pos, k2); camLook.lerp(want.look, k2);
      cam.position.copy(camPos);
      if (shake > 0) { shake = Math.max(0, shake - dt * 2.5); cam.position.x += (Math.random() - 0.5) * shake * 0.15; cam.position.y += (Math.random() - 0.5) * shake * 0.15; }
      cam.lookAt(camLook);
      if (spot) spot.intensity = 1 + Math.sin(t * 2) * 0.15;
      R.render(scene, cam);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const toScreen = k => { const v = headPos(k); v.y += 0.55; v.project(cam); return [(v.x + 1) / 2 * cv.clientWidth, (1 - v.y) / 2 * cv.clientHeight]; };
    return {
      actors, keys, shot, toScreen,
      snap: () => { for (const k of keys) { actors[k].ch.root.position.copy(actors[k].home); actors[k].faced = true; } faceAll(); },
      shake: s => { shake = Math.max(shake, s); },
      pose: (k, p) => { const a = actors[k]; if (!a) return; a.pose = p; a.poseT = 0; resetRig(a.ch); },
      emo: (k, e) => { const a = actors[k]; if (!a) return; a.emo = e; a.emoT = 0; },
      talk: (k, on) => { for (const kk of keys) actors[kk].talking = false; if (actors[k]) actors[k].talking = on; },
      dispose() {
        alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', resize);
        scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
        R.dispose(); try { R.forceContextLoss(); } catch (e) { /* 무시 */ }
      },
    };
  }
  function resetRig(ch) {
    for (const p of [ch.armL, ch.armR, ch.legL, ch.legR, ch.head]) if (p) p.rotation.set(0, 0, 0);
    if (ch.body) { ch.body.rotation.set(0, 0, 0); ch.body.position.z = 0; }
  }

  // ---------------------------------------------------------
  // 연출 효과 (CSS)
  // ---------------------------------------------------------
  function pop(el, x, y, txt, cls) {
    const d = document.createElement('div'); d.className = 'cs-pop ' + (cls || ''); d.textContent = txt;
    d.style.left = x + 'px'; d.style.top = y + 'px'; el.appendChild(d);
    setTimeout(() => d.remove(), 2200);
  }
  function burst(el, x, y, set, n) {
    for (let i = 0; i < n; i++) {
      const d = document.createElement('div'); d.className = 'cs-burst'; d.textContent = pick(set);
      d.style.left = x + 'px'; d.style.top = y + 'px';
      d.style.setProperty('--dx', ((Math.random() - 0.5) * 260) + 'px'); d.style.setProperty('--dy', (-60 - Math.random() * 200) + 'px');
      d.style.animationDelay = (i * 0.05) + 's'; d.style.fontSize = (18 + Math.random() * 20) + 'px';
      el.appendChild(d); setTimeout(() => d.remove(), 2400);
    }
  }
  function ambient(layer, kind) {
    const n = { rain: 70, petals: 26, sparkle: 26, stars: 30, leaves: 18, thunder: 0 }[kind] || 0;
    let h = '';
    for (let i = 0; i < n; i++) {
      const x = Math.random() * 100, d = (kind === 'rain' ? 0.5 + Math.random() * 0.4 : 4 + Math.random() * 5).toFixed(2), dl = (-Math.random() * 6).toFixed(2), s = (0.6 + Math.random() * 0.9).toFixed(2);
      const ch = kind === 'petals' ? pick(['🌸', '🌸', '💮', '🤍']) : kind === 'sparkle' ? pick(['✦', '✧', '♡', '·']) : kind === 'stars' ? pick(['✦', '✧', '⋆', '·']) : kind === 'leaves' ? pick(['🍂', '🍁']) : '';
      h += `<i class="amb ${kind}" style="left:${x}%;animation-duration:${d}s;animation-delay:${dl}s;--s:${s}">${ch}</i>`;
    }
    layer.innerHTML = h;
  }

  // ---------------------------------------------------------
  // 재생
  // ---------------------------------------------------------
  function play(c) {
    const s = st();
    const T = THEME[c.theme];
    const savedSpeed = s.speed; s.speed = 0;
    FM.UI.closeDialog && !$('#dialog').hidden && FM.UI.closeDialog();
    const ep = (s.flags.dramaEp = (s.flags.dramaEp || 0) + 1);
    const sub = pick(T.titles);
    const el = document.createElement('div'); el.id = 'cutscene'; el.className = 'th-' + c.theme;
    el.innerHTML = `<div class="cs-bg" style="background:${T.bg}"></div>
      <div class="cs-amb"></div>
      <canvas class="cs-cv"></canvas>
      <div class="cs-lines"></div><div class="cs-glow"></div><div class="cs-flash"></div>
      <div class="cs-fx"></div>
      <div class="cs-bar top"></div><div class="cs-bar bot"></div>
      <div class="cs-title"><small>친구모아 아일랜드 드라마</small><b>제 ${ep}화</b><span>「${esc(sub)}」</span><div class="cs-cast">${Object.values(c.cast).map(v => `<div>${FM.Face.img(v, 58)}<em>${esc(v.id === P ? v.name + ' (나)' : v.name)}</em></div>`).join('')}</div></div>
      <div class="cs-box" hidden><div class="cs-face"></div><div class="cs-talk"><div class="cs-name"></div><div class="cs-text"></div></div><div class="cs-next">▼</div></div>
      <div class="cs-end" hidden></div>
      <div class="cs-ui"><label class="cs-auto"><input type="checkbox" ${s.flags.autoCut !== false ? 'checked' : ''}> 드라마 자동 재생</label><button class="cs-skip">건너뛰기 ⏭</button></div>`;
    document.body.appendChild(el);
    ambient(el.querySelector('.cs-amb'), T.fx);
    let stage = null;
    try { stage = buildStage(el.querySelector('.cs-cv'), c); } catch (e) { console.warn('cutscene3d', e); }
    const fx = el.querySelector('.cs-fx');
    const box = el.querySelector('.cs-box');
    let i = -1, typing = null, adv = null, done = false, full = '';
    playing = { el, c };
    const finish = () => {
      if (done) return; done = true;
      clearInterval(typing); clearTimeout(adv);
      document.removeEventListener('keydown', onKey, true);
      el.classList.add('out');
      setTimeout(() => {
        if (stage) stage.dispose();
        el.remove(); playing = null;
        const cur = st(); if (cur && cur.speed === 0) cur.speed = savedSpeed;
        FM.UI.paint && FM.UI.paint();
        if (queue.length && cur.flags.autoCut !== false) setTimeout(() => { if (!playing && !busy()) Cut.playNext(); }, 1200);
      }, 450);
    };
    const ending = () => {
      box.hidden = true;
      if (stage) stage.shot('wide');
      const end = el.querySelector('.cs-end');
      const txt = c.outcome === 'happy' ? ['💕 해피 엔딩', 'Happy End'] : c.outcome === 'sad' ? ['💧 슬픈 엔딩', '...그리고 시간은 흐른다'] : ['⚡ 다음 화에 계속', 'To be continued...'];
      end.innerHTML = `<b>${txt[0]}</b><small>${txt[1]}</small>`;
      end.hidden = false;
      if (c.outcome === 'happy') { const r = el.getBoundingClientRect(); burst(fx, r.width / 2, r.height * 0.55, ['💕', '💖', '✨', '🎉'], 18); sfx('fireworks'); }
      else if (c.outcome === 'sad') sfx('piano');
      adv = setTimeout(finish, 3200);
    };
    const next = () => {
      if (done) return;
      clearTimeout(adv);
      // 타이핑 중이면 끝까지 보여 주기
      if (typing) { clearInterval(typing); typing = null; el.querySelector('.cs-text').textContent = full; el.querySelector('.cs-next').classList.add('on'); if (stage) stage.talk(null, false); adv = setTimeout(next, 1800); return; }
      i++;
      if (i >= c.beats.length) return ending();
      const b = c.beats[i];
      el.querySelector('.cs-next').classList.remove('on');
      if (b.say) {
        const v = c.cast[b.say];
        full = J(b.text);
        const hot = HOT.test(full);
        box.hidden = false; box.classList.remove('in'); void box.offsetWidth; box.classList.add('in');
        box.classList.toggle('hot', hot);
        el.querySelector('.cs-face').innerHTML = FM.Face.img(v, 64);
        el.querySelector('.cs-name').textContent = v.id === P ? v.name + ' (나)' : v.name;
        const tx = el.querySelector('.cs-text'); tx.textContent = '';
        if (stage) { stage.shot(hot ? 'zoom' : pick(['close', 'close', 'two', 'low']), b.say); stage.talk(b.say, true); }
        el.classList.toggle('lines', hot);
        if (hot) { stage && stage.shake(0.6); sfx('thud'); }
        let k = 0;
        typing = setInterval(() => {
          k += 1; tx.textContent = full.slice(0, k);
          if (k % 3 === 0) sfx('blip');
          if (k >= full.length) { clearInterval(typing); typing = null; el.querySelector('.cs-next').classList.add('on'); if (stage) stage.talk(null, false); adv = setTimeout(next, 1300 + full.length * 35); }
        }, 42);
        return;
      }
      el.classList.remove('lines');
      if (b.emo) {
        if (stage) { stage.emo(b.emo, b.e); stage.shot('close', b.emo); }
        setTimeout(() => { if (!stage) return; const [x, y] = stage.toScreen(b.emo); pop(fx, x, y, b.e, 'emo'); }, 250);
        if (/💓|💗|💕|❤️|🥰/.test(b.e)) sfx('heart'); else if (/💢|😠|😡/.test(b.e)) sfx('thud'); else sfx('pop');
        adv = setTimeout(next, 1300);
      } else if (b.pose) {
        if (stage) { stage.pose(b.pose, b.p); stage.shot('two', b.pose); }
        adv = setTimeout(next, 1100);
      } else if (b.fx) {
        const r = el.getBoundingClientRect();
        const at = b.at && stage && stage.actors[b.at] ? stage.toScreen(b.at) : [r.width / 2, r.height * 0.4];
        if (b.fx === 'hearts' || b.fx === 'heart') { burst(fx, at[0], at[1], ['💕', '💖', '💗', '❤️'], 14); sfx('heart'); el.querySelector('.cs-glow').className = 'cs-glow pink on'; }
        else if (b.fx === 'brokenHeart') { pop(fx, at[0], at[1] + 30, '💔', 'big'); stage && stage.shake(0.8); sfx('thud'); el.querySelector('.cs-glow').className = 'cs-glow blue on'; }
        else if (b.fx === 'question') { pop(fx, at[0], at[1], '❓', 'big'); sfx('pop'); }
        else if (b.fx === 'ring') { pop(fx, at[0], at[1], '💍', 'big'); burst(fx, at[0], at[1], ['✨', '✦'], 8); sfx('chime'); }
        else if (b.fx === 'fireworks') { burst(fx, r.width / 2, r.height * 0.35, ['🎆', '🎇', '✨', '🎉'], 16); sfx('fireworks'); }
        else if (b.fx === 'shock' || b.fx === 'gasp' || b.fx === 'flash') { const f = el.querySelector('.cs-flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); el.classList.add('lines'); stage && stage.shake(1); sfx('boom'); }
        else if (b.fx === 'sparkle' || b.fx === 'glow') { burst(fx, at[0], at[1], ['✨', '✦', '✧'], 10); sfx('twinkle'); }
        else if (b.fx === 'photo' || b.fx === 'camera') { const f = el.querySelector('.cs-flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); sfx('camera'); }
        else { adv = setTimeout(next, 10); return; }
        if (c.theme === 'affair' || c.theme === 'fight' || c.theme === 'triangle' || c.theme === 'jealous') { const f = el.querySelector('.cs-flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on', 'bolt'); }
        adv = setTimeout(next, 1400);
      } else adv = setTimeout(next, 10);
    };
    const onKey = e => {
      if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(); }
      else if (['Space', 'Enter', 'KeyE'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); next(); }
    };
    document.addEventListener('keydown', onKey, true);
    el.querySelector('.cs-skip').onclick = e => { e.stopPropagation(); finish(); };
    el.querySelector('.cs-auto input').onchange = e => { st().flags.autoCut = e.target.checked; };
    el.querySelector('.cs-auto').onclick = e => e.stopPropagation();
    el.onclick = () => { if (!el.classList.contains('started')) return; next(); };
    sfx(c.theme === 'breakup' || c.theme === 'divorce' ? 'piano' : c.theme === 'affair' || c.theme === 'fight' || c.theme === 'triangle' ? 'drone' : 'chime');
    // 타이틀 카드 → 입장 → 첫 대사
    setTimeout(() => { el.classList.add('started'); el.querySelector('.cs-title').classList.add('gone'); if (stage) stage.shot('wide'); setTimeout(() => { if (stage) stage.snap(); next(); }, 1500); }, 2300);
  }
  Cut.play = play;
  Cut.fromLog = fromLog;
  Cut.playing = () => !!playing;
  Cut.THEME = THEME;

  // ---------------------------------------------------------
  // 연결 — 큰 장면 · 사건 기록
  // ---------------------------------------------------------
  const origInit = FM.UI.init;
  FM.UI.init = function () {
    origInit();
    const hb = $('.hud-btns');
    if (hb && !$('#btnCut')) { const b = document.createElement('button'); b.id = 'btnCut'; b.title = '드라마 다시 보기'; b.textContent = '🎬'; hb.insertBefore(b, hb.firstChild); b.onclick = () => { if (queue.length) Cut.playNext(); else FM.UI.toast('🎬 아직 새 드라마가 없어요. 고백 · 이별 · 결혼 같은 사건이 생기면 여기에 쌓여요!'); }; }
    if (!$('#cutTeaser')) { const d = document.createElement('div'); d.id = 'cutTeaser'; d.hidden = true; $('#hud').appendChild(d); }
    FM.bus.on('majorScene', sc => { try { enqueue(Cut.fromScene(sc)); } catch (e) { console.error('cut', e); } });
    FM.bus.on('log', e => { try { const c = fromLog(e); if (c) enqueue(c); } catch (er) { console.error('cutlog', er); } });
    badge();
  };
  // 대화 중 ESC 등이 컷신을 뚫고 가지 않도록
  const origModalOpen = FM.UI.modalOpen;
  FM.UI.modalOpen = () => !!playing || origModalOpen();
})();
