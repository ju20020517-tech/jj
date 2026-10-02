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
    brawl: { bg: '', floor: 0, light: [0xffc090, 0.8], hemi: [0xffa070, 0x301008, 0.5], props: 'spot', fx: 'thunder', titles: ['먼지구름 육탄전', '주먹이 먼저 나갔다', '오늘 끝장 보자'] },
    scam: { bg: '', floor: 0, light: [0xffd090, 0.6], hemi: [0x806040, 0x100808, 0.4], props: 'spot', fx: '', titles: ['위조품 암거래 현장', '단돈 10만 코인의 비밀', '사기꾼의 밤'] },
    cult: { bg: '', floor: 0, light: [0xffa040, 0.5], hemi: [0x6040a0, 0x100818, 0.35], props: 'spot', fx: 'stars', titles: ['괴기 신흥 교단', '플라스틱 오리님을 모셔라', '자정의 수상한 모임'] },
    fashion: { bg: '', floor: 0, light: [0xffffff, 0.9], hemi: [0xffffff, 0xd0a0c0, 0.6], props: 'spot', fx: 'sparkle', titles: ['패션 테러 공개 시달회', '런웨이의 반란', '시대를 앞서간 옷'] },
    runaway: { bg: '', floor: 0, light: [0xa0b0d0, 0.5], hemi: [0x8090b0, 0x202838, 0.5], props: 'lamp', fx: 'rain', titles: ['비 내리는 정거장', '떠나지 마', '야반도주'] },
    friend: { bg: '', floor: 0, light: [0xfff0d0, 0.8], hemi: [0xfff6e0, 0x80a0c0, 0.6], props: 'tree', fx: 'sparkle', titles: ['우리 우정 영원히', '너라서 다행이야', '둘도 없는 친구', '우정의 맹세'] },
    party: { bg: '', floor: 0, light: [0xffe0b0, 0.9], hemi: [0xfff0e0, 0xa08060, 0.65], props: 'spot', fx: 'sparkle', titles: ['깜짝 생일 파티', '서프라이즈!', '너의 날'] },
    umbrella: { bg: '', floor: 0, light: [0xc0d0f0, 0.6], hemi: [0xb0c0e0, 0x303848, 0.55], props: 'lamp', fx: 'rain', titles: ['우산 하나', '비 오는 날의 친구', '같이 쓰자'] },
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
    return { theme, title: sc.title, place: sc.place || null, cast: cast2, beats: beats.filter(b => !(b.say || b.emo || b.pose) || cast2[b.say || b.emo || b.pose]), outcome, key: keys.map(k => cast2[k].id).sort().join('|') };
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
    c.t = now; c.day = Sim.time.day();
    queue.push(c); if (queue.length > 8) queue.shift();
    badge();
    const s = st();
    const auto = s.flags.autoCut !== false;
    if ((force || mine || (auto && s.speed <= 15)) && !playing && !busy()) setTimeout(() => { if (!playing && !busy()) Cut.playNext(); }, 400);
    else if (!playing) teaser(c);
  }
  Cut.enqueue = enqueue;
  Cut.queueLength = () => { pruneQueue(); return queue.length; };
  // 2일이 지난 드라마는 저절로 사라짐
  const EXPIRE = 1440 * 2;
  Cut.EXPIRE_DAYS = 2;
  const pruneQueue = () => { const now = st() ? st().time : 0; for (let i = queue.length - 1; i >= 0; i--) if (now - (queue[i].t || now) >= EXPIRE) queue.splice(i, 1); };
  Cut.pruneQueue = pruneQueue;
  Cut.playNext = function () { pruneQueue(); const c = queue.shift(); badge(); if (c) play(c); };
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
  // 무대 — 게임 속 실제 장소 (섬 · 실내)에서 메인 렌더러와 시네마 카메라로 촬영
  // ---------------------------------------------------------
  const INSIDE = { skylounge: 1, club: 1, cafe: 1, teahouse: 1, cityhall: 1, pub: 1, sushi: 1, medical: 1, library: 1, office: 1 };
  const THEME_PLACE = { wedding: 'cathedral', divorce: 'cityhall', fate: 'plaza', cult: 'park', fashion: 'plaza', runaway: 'ferry', scam: 'alley' };
  function spotOf(P0) {
    const sp = (P0.spots || []).find(s => !(s[3] && s[3].seat)) || null;
    return sp ? { x: sp[0], z: sp[1] } : { x: P0.x, z: P0.z };
  }
  // 사건이 벌어지는 곳: 장면의 장소 > 테마 기본 장소 > 주인공이 지금 있는 곳
  function venueFor(c) {
    const MAP = FM.MAP;
    if (c.venue) return c.venue;
    let place = c.place || null;
    if (!place && c.theme === 'baby') { const a = Object.values(c.cast)[0]; if (a && a.home && FM.INTERIORS[a.home]) return { loc: a.home }; }
    if (!place && THEME_PLACE[c.theme]) place = THEME_PLACE[c.theme];
    if (place && MAP.P[place]) {
      const P0 = MAP.P[place];
      if (INSIDE[place] && P0.interior && FM.INTERIORS[P0.interior]) return { loc: P0.interior, place };
      if (c.theme === 'wedding' && place === 'cathedral') return { loc: 'island', x: 12, z: -70, place };
      const s = spotOf(P0); return { loc: 'island', x: s.x, z: s.z, place };
    }
    const a = Object.values(c.cast).find(v => v.id !== P) || Object.values(c.cast)[0];
    if (a && a.loc === 'island') return { loc: 'island', x: a.x, z: a.z };
    if (a && FM.INTERIORS[a.loc]) return { loc: a.loc };
    const s = spotOf(MAP.P.plaza); return { loc: 'island', x: s.x, z: s.z, place: 'plaza' };
  }
  Cut.venueFor = venueFor;
  // 카메라가 건물·나무에 가리지 않는 방향 고르기
  function clearYaw(center) {
    const G = FM.G, scene = G.islandScene;
    const rc = new THREE.Raycaster(); rc.far = 7; rc.camera = G.camera;
    const from = new THREE.Vector3(center.x, center.y + 1.0, center.z);
    const isChar = o => { for (let p = o; p; p = p.parent) if (p.userData && (p.userData.entity || p.userData.cine)) return true; return false; };
    let best = 0, bestD = -1;
    for (let i = 0; i < 12; i++) {
      const yaw = i / 12 * Math.PI * 2;
      let d = 7;
      for (const [hy, dy] of [[1.0, 0.18], [0.45, 0.1]]) {
        const f2 = from.clone(); f2.y = center.y + hy;
        const dir = new THREE.Vector3(Math.sin(yaw), dy, Math.cos(yaw)).normalize();
        rc.set(f2, dir);
        try { const hit = rc.intersectObjects(scene.children, true).find(h => h.distance > 0.9 && !isChar(h.object) && h.object.visible !== false && !(h.object.material && h.object.material.transparent && h.object.material.opacity < 0.5)); if (hit) d = Math.min(d, hit.distance); } catch (e) { /* 무시 */ }
      }
      // 남쪽(바다·햇빛) 쪽을 약간 선호
      const score = d + Math.cos(yaw) * 0.3;
      if (score > bestD) { bestD = score; best = yaw; }
    }
    return best;
  }
  const M = col => new THREE.MeshLambertMaterial({ color: col });
  // 연출용 소품 (가출 트렁크, 소파, 택배 상자, 촛불, 오리 인형 …)
  function makeProp(kind) {
    const g = new THREE.Group();
    const add = (geo, col, x, y, z, basic) => { const m = new THREE.Mesh(geo, basic ? new THREE.MeshBasicMaterial({ color: col }) : M(col)); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
    if (kind === 'suitcase') { add(new THREE.BoxGeometry(0.5, 0.62, 0.22), 0xb0503a, 0, 0.36, 0); add(new THREE.TorusGeometry(0.09, 0.02, 6, 12, Math.PI), 0x3a2a20, 0, 0.67, 0); add(new THREE.BoxGeometry(0.52, 0.04, 0.24), 0xe8c070, 0, 0.36, 0); }
    else if (kind === 'sofa') { add(new THREE.BoxGeometry(1.8, 0.4, 0.7), 0x6a8ad0, 0, 0.3, 0); add(new THREE.BoxGeometry(1.8, 0.5, 0.18), 0x5a7ac0, 0, 0.6, -0.27); add(new THREE.BoxGeometry(0.18, 0.5, 0.7), 0x5a7ac0, -0.9, 0.45, 0); add(new THREE.BoxGeometry(0.18, 0.5, 0.7), 0x5a7ac0, 0.9, 0.45, 0); }
    else if (kind === 'box') { add(new THREE.BoxGeometry(0.6, 0.5, 0.6), 0xc89a62, 0, 0.25, 0); add(new THREE.BoxGeometry(0.62, 0.06, 0.12), 0xe8e0c8, 0, 0.51, 0); }
    else if (kind === 'candles') { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; add(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8), 0xfff4e0, Math.cos(a) * 1.3, 0.1, Math.sin(a) * 1.3); add(new THREE.SphereGeometry(0.035, 6, 6), 0xffb040, Math.cos(a) * 1.3, 0.23, Math.sin(a) * 1.3, true); } g.userData.light = [0xffa040, 1.2, 5, 0.6]; }
    else if (kind === 'duck') { add(new THREE.SphereGeometry(0.22, 12, 10), 0xffd82a, 0, 0.22, 0); add(new THREE.SphereGeometry(0.13, 12, 10), 0xffd82a, 0.08, 0.46, 0.05); add(new THREE.ConeGeometry(0.05, 0.12, 8), 0xff8a2a, 0.08, 0.45, 0.19).rotation.x = Math.PI / 2; }
    else if (kind === 'table') { add(new THREE.BoxGeometry(1.0, 0.06, 0.6), 0x6a4a30, 0, 0.62, 0); for (const [x, z] of [[-0.45, -0.25], [0.45, -0.25], [-0.45, 0.25], [0.45, 0.25]]) add(new THREE.BoxGeometry(0.05, 0.6, 0.05), 0x5a3a24, x, 0.3, z); add(new THREE.BoxGeometry(0.5, 0.4, 0.05), 0xd0b080, 0, 0.9, -0.1); g.userData.light = [0xffd090, 1.3, 4, 1.4]; }
    else if (kind === 'bench') { add(new THREE.BoxGeometry(1.4, 0.08, 0.42), 0xc08a5a, 0, 0.42, 0); add(new THREE.BoxGeometry(1.4, 0.35, 0.06), 0xb07a4a, 0, 0.62, -0.2); for (const x of [-0.6, 0.6]) add(new THREE.BoxGeometry(0.06, 0.42, 0.4), 0x5a4a3a, x, 0.21, 0); }
    else if (kind === 'runway') { add(new THREE.BoxGeometry(1.2, 0.08, 4), 0xff6fa0, 0, 0.04, 0); for (let i = 0; i < 6; i++) add(new THREE.SphereGeometry(0.06, 6, 6), 0xffffff, (i % 2 ? 0.62 : -0.62), 0.12, -1.8 + Math.floor(i / 2) * 1.8, true); }
    else if (kind === 'podium') { add(new THREE.BoxGeometry(1.6, 0.9, 0.6), 0x5a3a22, 0, 0.45, 0); add(new THREE.BoxGeometry(1.7, 0.06, 0.66), 0x7a5a3a, 0, 0.92, 0); }
    else if (kind === 'cake') { add(new THREE.CylinderGeometry(0.34, 0.36, 0.22, 20), 0xfff0f4, 0, 0.72, 0); add(new THREE.CylinderGeometry(0.25, 0.27, 0.18, 20), 0xffb8d0, 0, 0.92, 0); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; add(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 6), 0x8fd3ff, Math.cos(a) * 0.15, 1.07, Math.sin(a) * 0.15); add(new THREE.SphereGeometry(0.025, 6, 6), 0xffb040, Math.cos(a) * 0.15, 1.15, Math.sin(a) * 0.15, true); } add(new THREE.CylinderGeometry(0.4, 0.4, 0.6, 12), 0xc08a5a, 0, 0.3, 0); g.userData.light = [0xffc070, 1.1, 3.5, 1.3]; }
    else if (kind === 'umbrella') { const can = add(new THREE.SphereGeometry(0.85, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xff8fb1, 0, 1.75, 0); can.scale.y = 0.45; add(new THREE.CylinderGeometry(0.02, 0.02, 1.1, 6), 0x6a4a3a, 0, 1.25, 0); }
    else if (kind === 'letter') { add(new THREE.BoxGeometry(0.3, 0.02, 0.2), 0xfff4e0, 0, 0.05, 0); add(new THREE.SphereGeometry(0.04, 6, 6), 0xff5d8a, 0, 0.07, 0); }
    g.userData.cine = true;
    return g;
  }
  // 섬 장면용 조명 풀 — 드라마마다 새 조명을 추가하면 모든 재질 셰이더가 다시 컴파일되어 몇 초씩 멈춤.
  // 처음부터 섬에 (세기 0으로) 넣어 두고 켜고 끄기만 함
  const POOL = { ready: false };
  function lightPool() {
    const sc = FM.G && FM.G.islandScene; if (!sc) return null;
    if (!POOL.ready) {
      POOL.key = new THREE.PointLight(0xfff0e0, 0, 9); POOL.spot = new THREE.SpotLight(0xffffff, 0, 14, 0.55, 0.6);
      POOL.props = [0, 1].map(() => new THREE.PointLight(0xffa040, 0, 5));
      sc.add(POOL.key, POOL.spot, POOL.spot.target, ...POOL.props); POOL.ready = true;
    }
    return POOL;
  }
  Cut.lightPool = lightPool;
  const poolT = setInterval(() => { if (lightPool()) clearInterval(poolT); }, 500);
  function buildStage(c) {
    const G = FM.G, T = FM.T;
    const venue = (c.venueUsed = venueFor(c));
    const cam = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.1, 2000);
    const group = new THREE.Group(); group.userData.cine = true;
    const inside = venue.loc !== 'island';
    let center;
    const hidden = new Set(Object.values(c.cast).map(v => v.id));
    let floorY = 0;
    const cine = { loc: venue.loc, cam, center: new THREE.Vector3(), group };
    if (!inside) {
      const y = T.groundY(venue.x, venue.z);
      center = new THREE.Vector3(venue.x, y, venue.z);
      group.position.copy(center);
      group.rotation.y = clearYaw(center);
      G.islandScene.add(group);
      // 무대 위에 서 있던 다른 주민은 잠시 비켜 줌 (조금 떨어진 주민은 구경꾼으로 남음)
      for (const v of st().villagers) if (v.loc === 'island' && Math.hypot(v.x - venue.x, v.z - venue.z) < 2.6) hidden.add(v.id);
      const pl = st().player; if (pl.loc === 'island' && Math.hypot(pl.x - venue.x, pl.z - venue.z) < 2.6 && !hidden.has(P)) hidden.add(P);
    } else {
      const sz = Sim.interiorSize(venue.loc);
      center = new THREE.Vector3(0, 0, Math.min(0, -sz.d / 2 + 2.2));
      group.position.copy(center);
      cine.onBuilt = I => { I.group.add(group); };
      for (const v of st().villagers) if (v.loc === venue.loc && Math.hypot(v.x - center.x, v.z - center.z) < 2) hidden.add(v.id);
      cine.room = sz;
    }
    cine.center.copy(center);
    FM.Chars.hidden = hidden;
    // 밤에도 주인공 얼굴이 보이도록 부드러운 키 라이트
    const h = Sim.time.hour(), night = !inside && (h >= 19 || h < 6);
    const pool = inside ? null : lightPool(); let propLightN = 0;
    group.updateMatrixWorld(true);
    const wv = (x, y, z) => group.localToWorld(new THREE.Vector3(x, y, z));
    let key; if (pool) { key = pool.key; key.position.copy(wv(0, 2.8, 2.6)); key.intensity = night ? 1.1 : 0.45; } else { key = new THREE.PointLight(0xfff0e0, night ? 1.1 : 0.45, 9); key.position.set(0, 2.8, 2.6); group.add(key); }
    const T2 = THEME[c.theme] || THEME.confess;
    let spot = null;
    if (T2.props === 'spot') { if (pool) { spot = pool.spot; spot.position.copy(wv(0, 7, 2)); spot.target.position.copy(wv(0, 0, 0)); spot.target.updateMatrixWorld(); spot.intensity = night ? 1.6 : 0.9; } else { spot = new THREE.SpotLight(0xffffff, night ? 1.6 : 0.9, 14, 0.55, 0.6); spot.position.set(0, 7, 2); spot.target.position.set(0, 0, 0); group.add(spot, spot.target); } }
    // 소품 조명 (촛불 · 케이크 · 테이블 스탠드): 섬에서는 풀 조명을 옮겨 씀
    const lightProp = g => { const L = g.userData.light; if (!L) return; const [col, inten, dist, y] = L; if (pool) { const pl = pool.props[propLightN++]; if (!pl) return; g.updateMatrixWorld(true); pl.color.setHex(col); pl.intensity = inten; pl.distance = dist; pl.position.copy(g.localToWorld(new THREE.Vector3(0, y, 0))); } else { const pl = new THREE.PointLight(col, inten, dist); pl.position.y = y; g.add(pl); } };
    // 배우
    const keys = Object.keys(c.cast);
    const n = keys.length;
    const slots = n === 1 ? [[0, 0]] : n === 2 ? [[-0.8, 0], [0.8, 0]] : n === 3 ? [[-1.05, 0.15], [1.05, 0.15], [0, -0.85]] : [[-0.8, 0], [0.8, 0], [-1.9, -0.8], [1.9, -0.8]];
    const actors = {};
    const localY = (x, z) => { if (inside) return 0; const w = group.localToWorld(new THREE.Vector3(x, 0, z)); return T.groundY(w.x, w.z) - center.y; };
    keys.forEach((k, i) => {
      const v = c.cast[k];
      let look; try { look = v.id === P ? v.look : FM.Chars.outfitLook(Object.assign({}, v, c.outfits && c.outfits[k] ? { outfit: c.outfits[k] } : {})); } catch (e) { look = v.look; }
      if (c.lookPatch && c.lookPatch[k] && !(c.outfits && c.outfits[k])) look = Object.assign({}, look, c.lookPatch[k]);
      const ch = ISLE.M.character(look || ISLE.randomLook());
      ch.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
      if (v.child && !(c.scale && c.scale[k])) ch.root.scale.multiplyScalar({ BABY: 0.45, TODDLER: 0.58, CHILD: 0.76 }[v.child.stage] || 1);
      if (c.scale && c.scale[k]) ch.root.scale.multiplyScalar(c.scale[k]);
      if (c.hidden && c.hidden.includes(k)) ch.root.visible = false;
      const [x, z] = (c.slots && c.slots[k]) || slots[i] || [i - 1.5, -1.5];
      ch.root.position.set(x, localY(x, z), z);
      group.add(ch.root);
      actors[k] = { ch, home: new THREE.Vector3(x, localY(x, z), z), pose: null, poseT: 0, emo: null, emoT: 0, enter: i < 2 && n > 1 && !(c.slots && c.slots[k]) && !(c.hidden && c.hidden.includes(k)) ? (i === 0 ? -1 : 1) : 0 };
    });
    const props = [], propIds = {};
    for (const pr of c.props || []) { const g = makeProp(pr.kind); g.position.set(pr.x || 0, localY(pr.x || 0, pr.z || 0), pr.z || 0); g.rotation.y = pr.ry || 0; group.add(g); lightProp(g); props.push(g); if (pr.id) propIds[pr.id] = g; }
    const faceAll = () => {
      for (const k of keys) {
        const a = actors[k]; const p = a.ch.root.position;
        if (c.facing && c.facing[k] !== undefined) { a.ch.root.rotation.y = c.facing[k]; continue; }
        if (keys.length >= 2 && (k === keys[0] || k === keys[1])) { const o = actors[k === keys[0] ? keys[1] : keys[0]].ch.root.position; a.ch.root.rotation.y = Math.sign(o.x - p.x || 1) * 0.62; }
        else a.ch.root.rotation.y = Math.atan2(-p.x, 4 - p.z) * 0.6;
      }
    };
    for (const k of keys) { const a = actors[k]; if (a.enter) { a.ch.root.position.x = a.home.x + a.enter * 2.6; } }
    const headLocal = k => { const v = new THREE.Vector3(); actors[k].ch.head.getWorldPosition(v); return group.worldToLocal(v); };
    // 카메라 (무대 로컬 좌표 → 월드)
    const camPos = new THREE.Vector3(0, 1.6, 8.5), camLook = new THREE.Vector3(0, 0.6, 0);
    const want = { pos: new THREE.Vector3(0, 1.1, 5.6), look: new THREE.Vector3(0, 0.62, 0), speed: 2.2 };
    const lim = inside ? Math.max(2.4, cine.room.d / 2 - center.z + 0.2) : 99;   // 실내: 앞벽 너머로는 안 나감
    let track = null;
    const shot = (kind, k, keepTrack) => {
      if (!keepTrack) track = kind !== 'wide' && k && actors[k] ? [kind, k] : null;
      const far = keys.length > 2 ? 1 : 0;
      if (kind === 'wide' || !k || !actors[k]) { want.pos.set(0, 1.25 + far * 0.25, 5.6 + far * 1.2); want.look.set(0, 0.62, -far * 0.3); want.speed = 2; }
      else {
        const h2 = headLocal(k); const side = h2.x < -0.05 ? 1 : h2.x > 0.05 ? -1 : 0;
        if (kind === 'close') { want.pos.set(h2.x + side * 0.7, h2.y + 0.12, h2.z + 3.0); want.look.set(h2.x + side * 0.15, h2.y - 0.12, h2.z); want.speed = 3; }
        else if (kind === 'two') { want.pos.set(h2.x * 0.9 + side * 1.4, h2.y + 0.25, h2.z + 3.9); want.look.set(-h2.x * 0.25, h2.y - 0.25, h2.z); want.speed = 2.4; }
        else if (kind === 'zoom') { want.pos.set(h2.x + side * 0.35, h2.y + 0.06, h2.z + 2.05); want.look.set(h2.x + side * 0.06, h2.y - 0.06, h2.z); want.speed = 8; }
        else if (kind === 'low') { want.pos.set(h2.x * 0.6 + side * 0.6, h2.y - 0.55, h2.z + 3.2); want.look.set(h2.x * 0.8, h2.y + 0.1, h2.z); want.speed = 2.4; }
        else if (kind === 'lift') { want.pos.set(h2.x + 0.4, h2.y - 0.7, h2.z + 2.2); want.look.set(h2.x, h2.y + 0.6, h2.z); want.speed = 2; }
        else if (kind === 'top') { want.pos.set(h2.x, h2.y + 4.5, h2.z + 2.5); want.look.set(h2.x, h2.y - 0.5, h2.z); want.speed = 2; }
      }
      if (want.pos.z > lim) { const k2 = lim / want.pos.z; want.pos.z = lim; want.pos.y += (1 - k2) * 1.2; }
    };
    let shake = 0, t = 0;
    const wp = new THREE.Vector3(), wl = new THREE.Vector3();
    // 카메라와 배우 사이를 가리는 꽃·풀·나무는 촬영 중에만 잠깐 숨김 (인스턴스는 그 한 그루만)
    const culled = [], culledInst = [];
    const zeroM = new THREE.Matrix4().makeScale(0, 0, 0), tmpM = new THREE.Matrix4();
    const occRC = new THREE.Raycaster();
    const isMine = o => { for (let q = o; q; q = q.parent) if (q === group || (q.userData && q.userData.entity)) return true; return false; };
    let occT = 0, zoned = false;
    // 가리는 물체 후보는 촬영 구역 정리 때 한 번만 모아 두고(무대 16m 안의 작은 물체 · 풀 인스턴스),
    // 매번 섬 전체에 레이캐스트하는 대신 '카메라 → 얼굴' 선분과의 거리만 계산 (드라마 중 끊김 방지)
    const occCand = [], occInst = [], segA = new THREE.Vector3(), segB = new THREE.Vector3(), segD = new THREE.Vector3(), segP = new THREE.Vector3();
    const segDist = (p0) => { segD.subVectors(segB, segA); const L2 = segD.lengthSq() || 1; let t2 = segP.subVectors(p0, segA).dot(segD) / L2; if (t2 < 0.02 || t2 > 1) return 1e9; return segP.copy(segA).addScaledVector(segD, t2).distanceTo(p0); };
    const cullOccluders = () => {
      if (!occCand.length && !occInst.length) return;
      const dirty = new Set();
      for (const k of keys) {
        const hp = new THREE.Vector3(); actors[k].ch.head.getWorldPosition(hp);
        segA.copy(cam.position);
        for (const yOff of [0.1, -0.45, -0.8]) {
          segB.copy(hp); segB.y += yOff; segB.addScaledVector(segD.subVectors(segA, segB).normalize(), 0.35);
          for (const cnd of occCand) if (!cnd.hid && cnd.o.visible && segDist(cnd.c) < cnd.r + 0.12) { cnd.o.visible = false; cnd.hid = true; culled.push(cnd.o); }
          for (const ci of occInst) if (!ci.hid && segDist(ci.p) < 0.55) { ci.hid = true; ci.o.getMatrixAt(ci.i, tmpM); culledInst.push([ci.o, ci.i, tmpM.clone()]); ci.o.setMatrixAt(ci.i, zeroM); dirty.add(ci.o); }
        }
      }
      for (const o of dirty) o.instanceMatrix.needsUpdate = true;
    };
    // 촬영 구역(배우 ~ 카메라 사이) 정리: 작은 소품·꽃·풀만 숨김
    const inv = new THREE.Matrix4(), wpos = new THREE.Vector3(), bs = new THREE.Sphere();
    const clearZone = root => {
      if (!root) return;
      group.updateMatrixWorld(true); inv.copy(group.matrixWorld).invert();
      const inZone = v => { v.applyMatrix4(inv); return Math.abs(v.x) < 2.5 && v.z > -1.1 && v.z < (inside ? 9 : 6.5) && v.y < 2.6; };
      const cw = new THREE.Vector3(); group.getWorldPosition(cw); const NEAR = inside ? 30 : 16;
      root.updateMatrixWorld(true);
      root.traverse(o => {
        if (!o.isMesh || !o.visible || isMine(o)) return;
        if (o.isInstancedMesh) {
          for (let i = 0; i < o.count; i++) {
            o.getMatrixAt(i, tmpM); wpos.setFromMatrixPosition(tmpM).applyMatrix4(o.matrixWorld);
            if (wpos.distanceTo(cw) < NEAR) occInst.push({ o, i, p: wpos.clone() });
            if (inZone(wpos)) { culledInst.push([o, i, tmpM.clone()]); o.setMatrixAt(i, zeroM); o.instanceMatrix.needsUpdate = true; occInst[occInst.length - 1].hid = true; }
          }
          return;
        }
        if (!o.geometry) return;
        if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
        bs.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
        if (bs.radius <= 2.2 && bs.center.distanceTo(cw) < NEAR) occCand.push({ o, c: bs.center.clone(), r: bs.radius });
        if (bs.radius > 1.6) return;               // 벽·바닥·건물은 그대로
        wpos.copy(bs.center);
        if (inZone(wpos)) { o.visible = false; culled.push(o); }
      });
    };
    const restoreOccluders = () => { for (const o of culled) o.visible = true; for (const [o, i, m] of culledInst) { o.setMatrixAt(i, m); o.instanceMatrix.needsUpdate = true; } culled.length = 0; culledInst.length = 0; };
    cine.tick = dt => {
      t += dt;
      for (const k of keys) {
        const a = actors[k], ch = a.ch;
        const p = ch.root.position;
        const dx = a.home.x - p.x, dz = a.home.z - p.z, dl = Math.hypot(dx, dz);
        const walking = dl > 0.03 && !a.fixed;
        if (walking) { const st2 = Math.min(dl, dt * (a.run ? 2.4 : 1.3)); p.x += dx / dl * st2; p.z += dz / dl * st2; p.y = localY(p.x, p.z); ch.root.rotation.y = Math.atan2(dx, dz); a.faced = false; }
        ISLE.M.animate(ch, dt, walking ? (a.run ? 1.2 : 0.6) : 0);
        if (!walking) {
          if (!a.faced) { a.faced = true; faceAll(); }
          a.poseT += dt; a.emoT += dt;
          if (a.pose && FM.Anim.POSES[a.pose]) FM.Anim.POSES[a.pose](ch, a.poseT);
          if (a.emo) FM.Anim.POSES._emoGesture(ch, a.emo, a.emoT);
          if (a.talking && !a.pose) FM.Anim.POSES.talk(ch, a.poseT);
          if (a.lift) { ch.root.position.y = a.home.y + Math.min(1, a.poseT) * 0.35; }
          if (a.raise) { const o = actors[a.raise].ch.root.position; const k3 = Math.min(1, a.poseT / 1.2); p.set(o.x, o.y + 0.9 + k3 * 0.55, o.z + 0.05); ch.root.rotation.y = 0; }
        }
        if (a.fly) { a.fly.t += dt; const k2 = Math.min(1, a.fly.t / a.fly.d); p.x = a.fly.x0 + (a.fly.x1 - a.fly.x0) * k2; p.y = a.home.y + Math.sin(k2 * Math.PI) * a.fly.h; ch.root.rotation.z = k2 * Math.PI * 4 * a.fly.spin; if (k2 >= 1) { a.fly = null; ch.root.rotation.z = 0; } }
      }
      for (const pr of props) if (pr.userData.spin) pr.rotation.y += dt * pr.userData.spin;
      if (track) { const sp = want.speed; shot(track[0], track[1], true); want.speed = sp; }
      const k2 = 1 - Math.exp(-dt * want.speed);
      camPos.lerp(want.pos, k2); camLook.lerp(want.look, k2);
      wp.copy(camPos); group.localToWorld(wp); wl.copy(camLook); group.localToWorld(wl);
      if (!inside) { const gh = T.height(wp.x, wp.z) + 0.25; if (wp.y < gh) wp.y = gh; }
      cam.position.copy(wp);
      if (shake > 0) { shake = Math.max(0, shake - dt * 2.5); cam.position.x += (Math.random() - 0.5) * shake * 0.15; cam.position.y += (Math.random() - 0.5) * shake * 0.15; }
      cam.lookAt(wl);
      if (spot) spot.intensity = (night ? 1.6 : 0.9) + Math.sin(t * 2) * 0.15;
      cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
      if (!zoned) { const root = inside ? (cine.int && cine.int.group) : G.islandScene; if (root) { zoned = true; clearZone(root); } }
      if ((occT -= dt) < 0) { occT = 0.25; cam.updateMatrixWorld(); cullOccluders(); }
    };
    G.startCine(cine);
    const toScreen = k => { const v = new THREE.Vector3(); actors[k].ch.head.getWorldPosition(v); v.y += 0.55; v.project(cam); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; };
    return {
      actors, keys, shot, toScreen, group, props,
      snap: () => { for (const k of keys) { actors[k].ch.root.position.copy(actors[k].home); actors[k].faced = true; } faceAll(); },
      shake: s => { shake = Math.max(shake, s); },
      pose: (k, p) => { const a = actors[k]; if (!a) return; a.pose = p; a.poseT = 0; resetRig(a.ch); const pe = FM.Anim.exprOfPose(p); if (pe !== undefined) ISLE.M.setExpr(a.ch, pe); },
      expr: (k, e) => { const a = actors[k]; if (a && ISLE.M.setExpr) ISLE.M.setExpr(a.ch, e); },
      emo: (k, e) => { const a = actors[k]; if (!a) return; a.emo = e; a.emoT = 0; const x = FM.Anim.exprOfEmoji(e); if (x) ISLE.M.setExpr(a.ch, x); },
      talk: (k, on) => { for (const kk of keys) actors[kk].talking = false; if (actors[k]) actors[k].talking = on; },
      move: (k, x, z, run) => { const a = actors[k]; if (!a) return; a.home.set(x, localY(x, z), z); a.faced = false; a.run = !!run; a.pose = null; },
      fly: (k, x1, h2, d) => { const a = actors[k]; if (!a) return; a.fly = { t: 0, d: d || 1, x0: a.ch.root.position.x, x1, h: h2 || 1, spin: 1 }; a.home.x = x1; },
      lift: (k, on) => { const a = actors[k]; if (a) { a.lift = on; a.poseT = 0; } },
      hide: (k, on) => { const a = actors[k]; if (a) a.ch.root.visible = !on; },
      addProp: (kind, x, z, ry, id) => { const g = makeProp(kind); g.position.set(x, localY(x, z), z); g.rotation.y = ry || 0; group.add(g); lightProp(g); props.push(g); if (id) propIds[id] = g; return g; },
      prop: id => propIds[id],
      raise: (k, over) => { const a = actors[k]; if (a) { a.raise = over; a.poseT = 0; a.fixed = true; } },
      home: k => actors[k] && actors[k].home.clone(),
      localToScreen: (x, y, z) => { const v = new THREE.Vector3(x, y, z); group.localToWorld(v); v.project(cam); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; },
      eyes: k => { const out = []; const hd = actors[k].ch.head; for (const dx of [-0.13, 0.13]) { const v = new THREE.Vector3(dx, 0.02, 0.4); hd.localToWorld(v); v.project(cam); out.push([(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]); } return out; },
      dispose() {
        restoreOccluders();
        if (pool) { pool.key.intensity = 0; pool.spot.intensity = 0; for (const pl of pool.props) pl.intensity = 0; }
        FM.Chars.hidden = null;
        if (group.parent) group.parent.remove(group);
        group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
        G.endCine();
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
  const WARM_TH = { friend: 1, party: 1, umbrella: 1, makeup: 1, baby: 1, wedding: 1, propose: 1, reunion: 1 };
  const BGM_OF = { friend: 'healing', party: 'chip', umbrella: 'piano', confess: 'romance', reunion: 'romance', fate: 'night', propose: 'romance', wedding: 'wedding', breakup: 'piano', divorce: 'piano', runaway: 'piano', crushEnd: 'piano', affair: 'night', triangle: 'night', fight: 'club', brawl: 'club', jealous: 'shy', makeup: 'healing', baby: 'opera', scam: 'night', cult: 'deepsea', fashion: 'club' };
  Cut.BGM_OF = BGM_OF;
  // 테마별 기본 표정 & 상대 리액션
  const THEME_EXPR = { confess: 'shy', wedding: 'happy', divorce: 'sad', brawl: 'angry', affair: 'shocked', scam: 'smug', cult: 'determined', fashion: 'smug', runaway: 'worried', stork: 'happy', birthday: 'laugh', breakup: 'sad', reunion: 'cry', oath: 'determined' };
  const REACT = { angry: ['shocked', 'worried', 'angry'], furious: ['shocked', 'sob', 'furious'], sad: ['worried', 'sad', 'cry'], cry: ['cry', 'worried', 'sad'], sob: ['cry', 'despair'], surprised: ['surprised', 'awkward'], shocked: ['shocked', 'surprised'],
    love: ['shy', 'love', 'surprised'], shy: ['shy', 'surprised', 'smile'], happy: ['happy', 'smile', 'laugh'], laugh: ['laugh', 'happy'], pout: ['awkward', 'smug'], smug: ['pout', 'angry', 'awkward'], awkward: ['awkward', 'worried'], determined: ['surprised', 'determined'] };
  const curExpr = {};
  function play(c) {
    const s = st();
    const T = THEME[c.theme] || THEME.confess;
    const savedSpeed = s.speed; s.speed = 0;
    FM.UI.closeDialog && !$('#dialog').hidden && FM.UI.closeDialog();
    const ep = c.replay ? c.ep : (s.flags.dramaEp = (s.flags.dramaEp || 0) + 1);
    c.ep = ep;
    const sub = c.sub || (c.sub = pick(T.titles));
    c.results = c.results || {};
    c.beats = c.beats.slice();
    const el = document.createElement('div'); el.id = 'cutscene'; el.className = 'th-' + c.theme;
    el.innerHTML = `<div class="cs-tint"></div>
      <div class="cs-amb"></div>
      <div class="cs-lines"></div><div class="cs-glow"></div><div class="cs-flash"></div>
      <div class="cs-fx"></div><div class="cs-over"></div>
      <div class="cs-bar top"></div><div class="cs-bar bot"></div>
      <div class="cs-title"><small>${c.replay ? '📼 드라마 앨범 · 다시 보기' : '친구모아 아일랜드 드라마'}</small><b>제 ${ep}화</b><span>「${esc(sub)}」</span><div class="cs-cast">${Object.values(c.cast).map(v => `<div>${FM.Face.img(v, 58)}<em>${esc(v.id === P ? v.name + ' (나)' : v.name)}</em></div>`).join('')}</div>${c.venueName ? `<small class="cs-where">📍 ${esc(c.venueName)}</small>` : ''}</div>
      <div class="cs-box" hidden><div class="cs-face"></div><div class="cs-talk"><div class="cs-name"></div><div class="cs-text"></div></div><div class="cs-next">▼</div></div>
      <div class="cs-end" hidden></div>
      <div class="cs-ui"><label class="cs-auto"><input type="checkbox" ${s.flags.autoCut !== false ? 'checked' : ''}> 드라마 자동 재생</label><button class="cs-skip">건너뛰기 ⏭</button></div>`;
    document.body.appendChild(el);
    document.body.dataset.cine = c.theme;
    ambient(el.querySelector('.cs-amb'), T.fx);
    let stage = null;
    try { stage = buildStage(c); } catch (e) { console.warn('cutscene3d', e); }
    if (!c.venueName && c.venueUsed) { const V = c.venueUsed; c.venueName = V.loc === 'island' ? (V.place && FM.MAP.P[V.place] ? FM.MAP.P[V.place].name : FM.MAP.DISTRICTS[FM.T.district(V.x, V.z)].name) : (FM.INTERIORS[V.loc] || {}).name; const w = el.querySelector('.cs-title'); if (w && c.venueName) w.insertAdjacentHTML('beforeend', `<small class="cs-where">📍 ${esc(c.venueName)}</small>`); }
    const fx = el.querySelector('.cs-fx'), over = el.querySelector('.cs-over');
    const box = el.querySelector('.cs-box');
    let i = -1, typing = null, adv = null, done = false, full = '', waiting = false;
    playing = { el, c };
    const flash = (bolt) => { const f = el.querySelector('.cs-flash'); f.className = 'cs-flash'; void f.offsetWidth; f.classList.add('on'); if (bolt) f.classList.add('bolt'); };
    const scr = k => (stage && stage.actors[k] ? stage.toScreen(k) : [innerWidth / 2, innerHeight * 0.4]);
    const finish = () => {
      if (done) return; done = true;
      clearInterval(typing); clearTimeout(adv);
      document.removeEventListener('keydown', onKey, true);
      el.classList.add('out');
      if (!c.replay) { try { if (c.resolve) c.resolve(c.results); } catch (e) { console.error('cut resolve', e); } try { Cut.saveAlbum && Cut.saveAlbum(c); } catch (e) { console.error('album', e); } }
      setTimeout(() => {
        try { if (stage) stage.dispose(); } catch (e) { console.error('cut dispose', e); try { FM.G.endCine(); FM.Chars.hidden = null; } catch (e2) { /* 무시 */ } }
        el.remove(); playing = null; delete document.body.dataset.cine; document.body.classList.remove('cine-gray', 'cine-thriller', 'cine-holy', 'cine-sepia');
        const cur = st(); if (cur && cur.speed === 0) cur.speed = savedSpeed;
        FM.UI.paint && FM.UI.paint();
        if (queue.length && cur.flags.autoCut !== false) setTimeout(() => { if (!playing && !busy()) Cut.playNext(); }, 1200);
      }, 450);
    };
    let ended = false;
    const ending = () => {
      if (ended) return finish();
      ended = true;
      box.hidden = true; over.innerHTML = '';
      if (stage) stage.shot('wide');
      const end = el.querySelector('.cs-end');
      const txt = c.endText || (c.outcome === 'happy' ? ['💕 해피 엔딩', 'Happy End'] : c.outcome === 'sad' ? ['💧 슬픈 엔딩', '...그리고 시간은 흐른다'] : c.outcome === 'comedy' ? ['🤪 막장 엔딩', '이 섬, 정말 괜찮은 걸까...?'] : ['⚡ 다음 화에 계속', 'To be continued...']);
      end.innerHTML = `<b>${esc(txt[0])}</b><small>${esc(txt[1])}</small>`;
      end.hidden = false;
      if (c.outcome === 'happy') { burst(fx, innerWidth / 2, innerHeight * 0.55, ['💕', '💖', '✨', '🎉'], 18); sfx('fireworks'); }
      else if (c.outcome === 'sad') sfx('piano');
      adv = setTimeout(finish, 3200);
    };
    const talkBox = (name, faceHtml, text, hot, pitch, speaker) => {
      full = J(text);
      box.hidden = false; box.classList.remove('in'); void box.offsetWidth; box.classList.add('in');
      box.classList.toggle('hot', !!hot);
      el.querySelector('.cs-face').innerHTML = faceHtml;
      el.querySelector('.cs-name').textContent = name;
      const tx = el.querySelector('.cs-text'); tx.textContent = '';
      let k = 0;
      typing = setInterval(() => {
        k += 1; tx.textContent = full.slice(0, k);
        if (k % 2 === 0 && full[k - 1] !== ' ') { if (speaker && FM.Voice) FM.Voice.blip(speaker, full[k - 1], pitch || 1); else if (FM.Audio.blip) FM.Audio.blip(pitch || 1); else sfx('blip'); }
        if (k >= full.length) { clearInterval(typing); typing = null; el.querySelector('.cs-next').classList.add('on'); if (stage) stage.talk(null, false); adv = setTimeout(next, 1300 + full.length * 35); }
      }, 42);
    };
    // 상호작용 (QTE · 투표 · 선택) — 결과는 c.results 에 저장, 리플레이 때는 저장된 결과로 진행
    const interact = (b) => {
      const q = b.qte || b.vote || b.choice; const id = q.id;
      if (c.replay && c.results[id] !== undefined) { over.innerHTML = `<div class="cs-replay">📼 그때의 선택: <b>${esc(q.labels ? q.labels[c.results[id]] || c.results[id] : String(c.results[id]))}</b></div>`; adv = setTimeout(() => { over.innerHTML = ''; afterInteract(b); }, 1600); return; }
      waiting = true; box.hidden = true;
      const end = r => { if (!waiting) return; waiting = false; c.results[id] = r; clearInterval(tmr); over.innerHTML = ''; afterInteract(b); };
      let tmr = null;
      if (b.qte) {
        const need = q.n || 1, time = q.time || 3500; let cnt = 0; const t0 = performance.now();
        over.innerHTML = `<div class="cs-qte ${q.kind || 'tap'}"><div class="q-title">${esc(q.title || '지금이다!')}</div><button class="q-btn">${esc(q.label)}</button><div class="q-bar"><i></i></div>${need > 1 ? `<div class="q-cnt">0 / ${need}</div>` : ''}<small>${need > 1 ? '마구 연타하세요! (스페이스바도 OK)' : '눌러서 개입하기'}</small></div>`;
        const bar = over.querySelector('.q-bar i'), cn = over.querySelector('.q-cnt');
        const hit = e => { if (e) e.stopPropagation(); cnt++; sfx('pop'); const bt = over.querySelector('.q-btn'); if (bt) { bt.classList.remove('hit'); void bt.offsetWidth; bt.classList.add('hit'); } if (cn) cn.textContent = `${cnt} / ${need}`; if (cnt >= need) end(true); };
        over.querySelector('.q-btn').onclick = hit;
        Cut._qteHit = hit;
        tmr = setInterval(() => { const k = (performance.now() - t0) / time; bar.style.width = Math.max(0, 100 - k * 100) + '%'; if (k >= 1) end(false); }, 50);
      } else {
        const opts = b.vote ? q.keys.map(k => ({ v: k, html: `${FM.Face.img(c.cast[k], 64)}<span>${esc(c.cast[k].id === P ? '나' : c.cast[k].name)}</span>` })).concat(q.none ? [{ v: 'none', html: '<span class="nob">🙅</span><span>아무도!</span>' }] : []) : q.opts.map(o => ({ v: o.v, html: `<span>${esc(o.label)}</span>` }));
        over.innerHTML = `<div class="cs-vote ${b.vote ? 'faces' : 'plain'}"><div class="q-title">${esc(q.title)}</div><div class="v-opts">${opts.map(o => `<button data-v="${esc(o.v)}">${o.html}</button>`).join('')}</div></div>`;
        over.querySelectorAll('[data-v]').forEach(x => x.onclick = e => { e.stopPropagation(); sfx('chime'); end(x.dataset.v); });
      }
    };
    const afterInteract = (b) => {
      const q = b.qte || b.vote || b.choice; const r = c.results[q.id];
      const key = b.qte ? (r ? 'win' : 'lose') : r;
      const add = (b.then && (b.then[key] || b.then.any)) || (c.branch && c.branch(q.id, r, c)) || [];
      if (!c.replay) { c.beats.splice(i + 1, 0, ...add); c.played = c.played || []; }
      adv = setTimeout(next, 200);
    };
    const next = () => {
      if (done || waiting) return;
      if (ended) return finish();
      clearTimeout(adv);
      if (typing) { clearInterval(typing); typing = null; el.querySelector('.cs-text').textContent = full; el.querySelector('.cs-next').classList.add('on'); if (stage) stage.talk(null, false); adv = setTimeout(next, 1800); return; }
      i++;
      if (i >= c.beats.length) return ending();
      const b = c.beats[i];
      el.querySelector('.cs-next').classList.remove('on');
      if (b.say && c.cast[b.say]) {
        const v = c.cast[b.say];
        const text = J(b.text); const hot = b.hot !== undefined ? b.hot : (WARM_TH[c.theme] ? false : HOT.test(text));
        if (stage) { stage.shot(b.shot || (hot ? pick(['zoom', 'close', 'low']) : pick(['close', 'close', 'two', 'low'])), b.say); stage.talk(b.say, true);
          const ex = b.expr || FM.Anim.exprOfText(text, hot) || THEME_EXPR[c.theme] || pick(['smile', null, 'happy']); curExpr[b.say] = ex; stage.expr(b.say, ex);
          for (const k2 of stage.keys) if (k2 !== b.say) { const r = REACT[ex]; if (r && Math.random() < 0.75) stage.expr(k2, pick(r)); } }
        el.classList.toggle('lines', hot);
        if (hot) { stage && stage.shake(0.6); sfx('thud'); }
        talkBox(v.id === P ? v.name + ' (나)' : v.name, FM.Face.img(v, 64, '', curExpr[b.say]), text, hot, c.pitch && c.pitch[b.say], v);
        return;
      }
      if (b.narr) { if (stage && b.shot) stage.shot(b.shot[0], b.shot[1]); talkBox(b.who || '내레이션', `<span class="cs-narr">${esc(b.icon || '🎙️')}</span>`, b.narr, b.hot); return; }
      if (b.qte || b.vote || b.choice) return interact(b);
      el.classList.toggle('lines', !!b.lines);
      let wait = 1100;
      if (b.emo) {
        if (stage) { stage.emo(b.emo, b.e); stage.shot('close', b.emo); }
        setTimeout(() => { const [x, y] = scr(b.emo); pop(fx, x, y, b.e, 'emo'); }, 250);
        if (/💓|💗|💕|❤️|🥰/.test(b.e)) sfx('heart'); else if (/💢|😠|😡/.test(b.e)) sfx('thud'); else sfx('pop');
        wait = 1300;
      } else if (b.pose) { if (stage) { stage.pose(b.pose, b.p); if (!b.noshot) stage.shot('two', b.pose); } wait = b.t || 1100; }
      else if (b.poses) { for (const [k, p0] of b.poses) stage && stage.pose(k, p0); if (stage) stage.shot('wide'); wait = b.t || 1400; }
      else if (b.shot) { stage && stage.shot(b.shot[0], b.shot[1]); wait = b.t || 1500; }
      else if (b.move) { stage && stage.move(b.move[0], b.move[1], b.move[2], b.run); wait = b.t || 1500; if (b.shotWide !== false && stage) stage.shot('wide'); }
      else if (b.unprop) { const g = stage && stage.prop(b.unprop); if (g) g.visible = false; wait = 200; }
      else if (b.show) { stage && stage.hide(b.show, false); wait = b.t || 300; }
      else if (b.hide) { stage && stage.hide(b.hide, true); wait = b.t || 300; }
      else if (b.raise) { stage && stage.raise(b.raise[0], b.raise[1]); stage && stage.shot('lift', b.raise[1]); document.body.classList.add('cine-holy'); burst(fx, innerWidth / 2, innerHeight * 0.3, ['✨', '🌟', '✦'], 16); sfx('chime'); wait = b.t || 2600; }
      else if (b.prop) { stage && stage.addProp(b.prop.kind, b.prop.x || 0, b.prop.z || 0, b.prop.ry || 0, b.prop.id); if (b.prop.drop) { stage && stage.shake(0.5); sfx('thud'); } wait = b.t || 500; }
      else if (b.breakProp) {
        const g = stage && stage.prop(b.breakProp);
        if (g) { g.visible = false; const [x, y] = stage.localToScreen(g.position.x, 0.6, g.position.z); pop(fx, x, y, '💥', 'big'); const h1 = stage.addProp('sofa', g.position.x - 0.7, g.position.z, 0.3); const h2 = stage.addProp('sofa', g.position.x + 0.7, g.position.z, -0.3); h1.scale.set(0.5, 1, 1); h2.scale.set(0.5, 1, 1); }
        stage && stage.shake(1.2); flash(); sfx('boom'); wait = 1500;
      }
      else if (b.filter !== undefined) { document.body.classList.remove('cine-gray', 'cine-thriller', 'cine-holy', 'cine-sepia'); if (b.filter) document.body.classList.add('cine-' + b.filter); if (b.filter === 'thriller') { flash(true); sfx('drone'); } wait = b.t || 700; }
      else if (b.beam) {
        if (stage) { stage.shot('zoom', b.beam); setTimeout(() => { const eyes = stage.eyes(b.beam); const [tx, ty] = b.at ? scr(b.at) : [innerWidth / 2, innerHeight / 2]; for (const [ex, ey] of eyes) { const ln = document.createElement('div'); ln.className = 'cs-beam'; const dx = tx - ex, dy = ty + 60 - ey; ln.style.left = ex + 'px'; ln.style.top = ey + 'px'; ln.style.width = Math.hypot(dx, dy) + 'px'; ln.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`; fx.appendChild(ln); setTimeout(() => ln.remove(), 1800); } }, 600); }
        sfx('boom'); wait = 2400;
      }
      else if (b.split) {
        const ks = b.split.filter(k => c.cast[k]);
        over.innerHTML = `<div class="cs-split n${ks.length}">${ks.map((k, j) => `<div class="sp" style="--d:${j * 0.12}s"><img src="${FM.Face.url(c.cast[k])}"><b>${esc(c.cast[k].id === P ? '나' : c.cast[k].name)}</b>${b.caps && b.caps[j] ? `<em>${esc(b.caps[j])}</em>` : ''}</div>`).join('')}</div>`;
        flash(); sfx('boom'); wait = b.t || 2400; setTimeout(() => { if (!done) over.innerHTML = ''; }, wait - 100);
      }
      else if (b.dust) {
        const [ka, kb] = b.dust; const [x1, y1] = scr(ka), [x2, y2] = scr(kb);
        stage && stage.hide(ka, true); stage && stage.hide(kb, true); stage && stage.shot('wide');
        const cx = (x1 + x2) / 2, cy = Math.max(y1, y2) + 90;
        const d = document.createElement('div'); d.className = 'cs-dust'; d.style.left = cx + 'px'; d.style.top = cy + 'px'; d.innerHTML = '<i></i><i></i><i></i><i></i><i></i><span class="pow">퍽!</span><span class="pow p2">빡!</span><span class="pow p3">우당탕!</span>'; fx.appendChild(d);
        let n = 0; const th = setInterval(() => { burst(fx, cx, cy, ['👟', '☕', '🏋️', '📚', '👓', '🧦', '🍩', '💢'], 3); if (++n % 2) { flash(true); sfx('thud'); } stage && stage.shake(0.5); }, 450);
        wait = b.t || 3800; setTimeout(() => { clearInterval(th); d.classList.add('gone'); setTimeout(() => d.remove(), 500); stage && stage.hide(ka, false); stage && stage.hide(kb, false); }, wait - 200);
      }
      else if (b.throw) { const [x, y] = scr(b.at || Object.keys(c.cast)[0]); for (let j = 0; j < 14; j++) setTimeout(() => { const t2 = document.createElement('div'); t2.className = 'cs-throw'; t2.textContent = pick(b.throw); const fromL = Math.random() < 0.5; t2.style.left = (fromL ? -40 : innerWidth + 40) + 'px'; t2.style.top = (innerHeight * (0.3 + Math.random() * 0.4)) + 'px'; t2.style.setProperty('--tx', (x - (fromL ? -40 : innerWidth + 40) + (Math.random() - 0.5) * 120) + 'px'); t2.style.setProperty('--ty', (y + 60 - parseFloat(t2.style.top)) + 'px'); fx.appendChild(t2); setTimeout(() => t2.remove(), 1300); if (j % 3 === 0) sfx('pop'); }, j * 130); stage && stage.shot('wide'); wait = b.t || 2600; }
      else if (b.stork) {
        const d = document.createElement('div'); d.className = 'cs-stork'; d.innerHTML = '<span class="bird">🦩</span><span class="pkg">📦</span>'; fx.appendChild(d); sfx('bird');
        setTimeout(() => d.remove(), 3200); wait = 3000;
      }
      else if (b.film) {
        document.body.classList.add('cine-sepia');
        over.innerHTML = `<div class="cs-film">${b.film.map((f2, j) => `<div class="fr" style="--d:${j * 0.5}s">${f2.face ? `<img src="${FM.Face.url(who(f2.face) || c.cast.A)}">` : ''}<span>${esc(f2.text)}</span></div>`).join('')}</div>`;
        sfx('piano'); wait = b.t || 1400 + b.film.length * 900; setTimeout(() => { if (!done) { over.innerHTML = ''; document.body.classList.remove('cine-sepia'); } }, wait - 100);
      }
      else if (b.searchlight) { over.innerHTML = '<div class="cs-search"></div>'; flash(); sfx('boom'); wait = b.t || 2000; setTimeout(() => { if (!done) over.innerHTML = ''; }, 3500); }
      else if (b.gavel) { let n = 0; const tt = setInterval(() => { pop(fx, innerWidth * (0.35 + n * 0.15), innerHeight * 0.3, '🔨 탕!', 'big'); stage && stage.shake(0.6); sfx('hammer'); if (++n >= 3) clearInterval(tt); }, 450); if (stage && b.gavel !== true) stage.shot('low', b.gavel); wait = 1800; }
      else if (b.soul) { const [x, y] = scr(b.soul); const d = document.createElement('div'); d.className = 'cs-soul'; d.textContent = '👻'; d.style.left = x + 'px'; d.style.top = (y + 55) + 'px'; fx.appendChild(d); setTimeout(() => d.remove(), 2600); stage && stage.shot('zoom', b.soul); sfx('drone'); wait = 2400; }
      else if (b.spark) { const [x1, y1] = scr(b.spark[0]), [x2, y2] = scr(b.spark[1]); const d = document.createElement('div'); d.className = 'cs-spark'; d.style.left = ((x1 + x2) / 2) + 'px'; d.style.top = ((y1 + y2) / 2 + 40) + 'px'; d.textContent = '⚡'; fx.appendChild(d); setTimeout(() => d.remove(), 1500); flash(true); sfx('boom'); stage && stage.shot('wide'); wait = 1400; }
      else if (b.smoke) { const [x, y] = b.at ? scr(b.at) : stage ? stage.localToScreen(0, 0.4, 0) : [innerWidth / 2, innerHeight / 2]; pop(fx, x, y + 60, '💨', 'big'); pop(fx, x + 40, y + 20, b.smoke === true ? '뿅!' : b.smoke, 'txt'); sfx('pop'); wait = 1300; }
      else if (b.outcome) { c.outcome = b.outcome; if (b.endText) c.endText = b.endText; wait = 10; }
      else if (b.wait) wait = b.wait;
      else if (b.sfx) { sfx(b.sfx); wait = 200; }
      else if (b.fx) {
        const at = scr(b.at);
        if (b.fx === 'hearts' || b.fx === 'heart') { burst(fx, at[0], at[1], ['💕', '💖', '💗', '❤️'], 14); sfx('heart'); el.querySelector('.cs-glow').className = 'cs-glow pink on'; }
        else if (b.fx === 'brokenHeart') { pop(fx, at[0], at[1] + 30, '💔', 'big'); stage && stage.shake(0.8); sfx('thud'); el.querySelector('.cs-glow').className = 'cs-glow blue on'; }
        else if (b.fx === 'question') { pop(fx, at[0], at[1], '❓', 'big'); sfx('pop'); }
        else if (b.fx === 'ring') { pop(fx, at[0], at[1], '💍', 'big'); burst(fx, at[0], at[1], ['✨', '✦'], 8); sfx('chime'); }
        else if (b.fx === 'fireworks') { burst(fx, innerWidth / 2, innerHeight * 0.35, ['🎆', '🎇', '✨', '🎉'], 16); sfx('fireworks'); }
        else if (b.fx === 'shock' || b.fx === 'gasp' || b.fx === 'flash') { flash(); el.classList.add('lines'); stage && stage.shake(1); sfx('boom'); }
        else if (b.fx === 'sparkle' || b.fx === 'glow') { burst(fx, at[0], at[1], ['✨', '✦', '✧'], 10); sfx('twinkle'); }
        else if (b.fx === 'glint') { pop(fx, at[0] + 10, at[1] + 40, '✨', 'emo'); sfx('twinkle'); }
        else if (b.fx === 'sweat') { pop(fx, at[0] + 30, at[1] + 20, '💦', 'emo'); pop(fx, at[0] - 30, at[1] + 30, '💦', 'emo'); }
        else if (b.fx === 'photo' || b.fx === 'camera') { flash(); sfx('camera'); }
        else wait = 10;
        if (wait > 10 && ['affair', 'fight', 'triangle', 'jealous', 'brawl'].includes(c.theme) && b.fx !== 'hearts') flash(true);
        if (wait > 10) wait = 1400;
      } else wait = 10;
      adv = setTimeout(next, wait);
    };
    const onKey = e => {
      if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); if (waiting) return; finish(); }
      else if (['Space', 'Enter', 'KeyE'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); if (waiting && Cut._qteHit && over.querySelector('.q-btn')) Cut._qteHit(); else next(); }
    };
    document.addEventListener('keydown', onKey, true);
    el.querySelector('.cs-skip').onclick = e => { e.stopPropagation(); if (waiting) { const b2 = c.beats[i]; const q = b2 && (b2.qte || b2.vote || b2.choice); if (q) { c.results[q.id] = b2.qte ? false : (b2.vote ? 'none' : q.opts[q.opts.length - 1].v); waiting = false; } } finish(); };
    el.querySelector('.cs-auto input').onchange = e => { st().flags.autoCut = e.target.checked; };
    el.querySelector('.cs-auto').onclick = e => e.stopPropagation();
    el.onclick = () => { if (!el.classList.contains('started') || waiting) return; next(); };
    try { FM.Audio.play(c.bgm || BGM_OF[c.theme] || 'romance'); } catch (e) { /* 무시 */ }
    sfx(c.theme === 'breakup' || c.theme === 'divorce' || c.theme === 'runaway' ? 'piano' : ['affair', 'fight', 'triangle', 'brawl', 'scam', 'cult'].includes(c.theme) ? 'drone' : 'chime');
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
    FM.bus.on('majorScene', sc => { try { const c = Cut.fromScene(sc); if (c) enqueue(c, c.force); } catch (e) { console.error('cut', e); } });
    FM.bus.on('log', e => { try { const c = Cut.fromLog(e); if (c) enqueue(c, c.force); } catch (er) { console.error('cutlog', er); } });
    badge();
  };
  // 대화 중 ESC 등이 컷신을 뚫고 가지 않도록
  const origModalOpen = FM.UI.modalOpen;
  FM.UI.modalOpen = () => !!playing || origModalOpen();
})();
