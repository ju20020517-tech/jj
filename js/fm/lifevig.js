/* =========================================================
 *  🏘️ 일상 · 이웃 드라마 — 16편
 *   쌍둥이
 *    1. 👯 쌍둥이 바꿔치기 대작전   2. 🎂 쌍둥이의 같은 생일     3. 🎤 몰래 보러 간 데뷔 무대
 *   이웃 · 일상
 *    4. 🏠 이사 환영회 (누가 새로 입주하면)   5. 🍳 섬 요리 대결         6. 🔊 층간소음 분쟁
 *    7. 👛 주운 지갑                         8. 🌠 유성우 소원 (4일마다)  9. 💌 잘못 배달된 러브레터
 *   10. 🍀 복권 당첨 소동                    11. 💼 승진 턱 쏘는 날     12. 🏃 주말 섬 체육대회
 *   13. 🧹 마을 대청소의 날                  14. 🗼 등대 위 노을 고백    15. 🌊 해안 동굴 탐험대 (발견 뒤)
 *   16. 🕳️ 지하 아파트 반상회 (열린 뒤)
 *  · 매시간 조건이 맞으면 하나씩 · 종류마다 쿨타임 · 섬 전체 4시간 간격
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, Cut = FM.Cut, W = FM.Will;
  if (!Sim || !Soc || !Cut) return;
  const P = 'P';
  const S = () => Sim.get();
  const byId = id => (id === P ? S().player : Sim.byId(id));
  const day = () => Sim.time.day();
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const J = t => (FM.josa ? FM.josa(t) : t);
  const sty = (v, t) => (v && v.id !== P && W && W.sty ? W.sty(v, J(t)) : J(t));
  const fp = (a, b) => Soc.rel(a.id, b.id).friendship_point || 0;
  const adults = () => S().villagers.filter(v => !v.child && !v.staff && !v.visitor);
  const free = v => v && !v.sceneId && !v.talkingToPlayer && !(v.status && v.status.hospital) && !(v.act && v.act.id === 'sleep');
  const has = (v, k) => Sim.has(v, k);
  const keyOf = cast => Object.values(cast).map(v => v.id).sort().join('|');
  const mk = (theme, cast, beats, o = {}) => Object.assign({ theme, cast, beats, key: keyOf(cast) + '|' + (o.sub || ''), vig: true }, o);
  const logD = (t, ids, imp = 2, type = 'friend') => Sim.log(type, t, ids, imp, { newsKind: 'drama' });
  const mem = (v, kind, text, about) => { if (W && W.remember && v && v.id !== P) W.remember(v, kind, text, about ? { about } : undefined); };
  const friends = (a, b, n = 6, t = 4, why = '드라마') => { Soc.addFriend(a.id, b.id, n, t, why); Soc.addFriend(b.id, a.id, n, t, why); };
  const shuffle = a => a.slice().sort(() => Math.random() - 0.5);
  const LV = (FM.LifeVig = {});

  // 새 테마
  if (Cut.THEME) {
    Cut.THEME.daily = { bg: '', floor: 0, light: [0xfff4d8, 0.9], hemi: [0xfff8e8, 0x90a8c0, 0.62], props: 'tree', fx: 'sparkle', titles: ['오늘의 섬', '평범해서 특별한 하루', '이웃사촌', '섬 생활 일기'] };
    Cut.THEME.twins = { bg: '', floor: 0, light: [0xf0e0ff, 0.9], hemi: [0xf4ecff, 0x90b8b0, 0.62], props: 'spot', fx: 'sparkle', titles: ['쌍둥이 대소동', '모모와 도도', '거울 속의 너', '5분 차이 남매'] };
  }
  const V = {
    plaza: { loc: 'island', x: 3, z: 19, place: 'plaza' },
    park: { loc: 'island', x: -84, z: 24, place: 'park' },
    lighthouse: { loc: 'island', x: 119.5, z: 36, place: 'lighthouse' },
    observatory: { loc: 'island', x: 70, z: -84, place: 'observatory' },
    beach: { loc: 'island', x: -36, z: 86, place: 'beach' },
  };
  const twins = () => { const t = adults().filter(v => v.twin); const a = t[0], b = a && Sim.byId(a.twin); return a && b ? [a, b].sort((x, y) => (Soc.genderOf(x.id) === 'F' ? -1 : 1)) : null; };

  // =========================================================
  // 쌍둥이
  // =========================================================
  function twinSwap(F, M, C) {
    const cast = { A: F, B: M, C };
    const beats = [
      { narr: `(${F.name}와(과) ${M.name}이(가) 옷과 가발을 바꿔 입었다…!)`, who: '해설', icon: '👯', shot: ['wide'] },
      { say: 'A', text: sty(F, `(낮은 목소리로) …하아암. 나 ${M.name}인데. 졸려.`) }, { say: 'B', text: sty(M, `(억지 텐션) 안녕안녕~! ${F.name} 왔어요~! …이거 힘드네.`) },
      { show: 'C' }, { move: ['C', 0, 0.9], t: 1100 }, { say: 'C', text: sty(C, `어, ${M.name}! 오늘 따라 키가 좀 작아 보이는데…?`) }, { pose: 'C', p: 'tilt', t: 1000 },
      { poses: [['A', 'freeze'], ['B', 'freeze']], t: 1000 }, { fx: 'sweat', at: 'A' },
      { say: 'C', text: sty(C, `…잠깐. ${M.name}이(가) 저렇게 방방 뛸 리가 없잖아!!`), hot: true }, { fx: 'shock' },
      { poses: [['A', 'jumpPop'], ['B', 'facepalm']], t: 1300 }, { say: 'A', text: sty(F, '헤헤~ 들켰다! 근데 30초는 속았지?') },
      { say: 'B', text: sty(M, '…거봐, 내가 너처럼 못 웃는다고 했지.') }, { poses: [['A', 'cheer'], ['B', 'cheer'], ['C', 'clap']], t: 1300 },
      { split: ['A', 'B'], caps: ['👯 가짜 오빠', '👯 가짜 동생'], t: 2000 },
      { outcome: 'happy', endText: ['👯 쌍둥이 바꿔치기', `${C.name}만 30초 속았다`] },
    ];
    const c = mk('twins', cast, beats, { venue: V.plaza, slots: { A: [-0.8, 0], B: [0.8, 0], C: [3.0, 1.2] }, hidden: ['C'], sub: '쌍둥이 바꿔치기',
      lookPatch: { A: Object.assign({}, M.look, { lashes: true }), B: Object.assign({}, F.look, { lashes: false }) } });
    c.resolve = () => { friends(F, M, 4, 3, '장난'); friends(F, C, 3, 1); friends(M, C, 3, 1); mem(C, 'funny', `${F.name}와(과) ${M.name}이(가) 서로 바꿔치기해서 깜빡 속았어`); logD(`👯 ${F.name}와(과) ${M.name}이(가) 서로 바꿔 입고 ${C.name}을(를) 속였어요! (30초 만에 들킴)`, [F.id, M.id, C.id]); };
    return c;
  }
  function twinBirthday(F, M) {
    const cast = { A: F, B: M };
    const beats = [
      { narr: '(오늘은 둘이 같이 태어난 날. 서로 몰래 선물을 준비했다)', who: '해설', icon: '🎂', shot: ['wide'] }, { prop: { kind: 'cake', x: 0, z: 0.8, id: 'ck' } },
      { say: 'A', text: sty(F, `${M.name} 오빠! 생일 축하해~! 내가 직접 만든 거야!`), hot: true }, { pose: 'A', p: 'jumpPop', t: 900 },
      { say: 'B', text: sty(M, '…나도 있어. 너 무대에서 쓸 반짝이 머리띠.') }, { emo: 'A', e: '🥹' },
      { narr: '(그런데… 둘이 준비한 선물이 똑같은 머리띠였다)', who: '해설', icon: '🎀' }, { fx: 'shock' },
      { poses: [['A', 'surprise'], ['B', 'surprise']], t: 1100 }, { say: 'B', text: sty(M, '…역시 쌍둥이네.') }, { say: 'A', text: sty(F, '꺄하하! 둘이 똑같이 쓰고 다니자!') },
      { poses: [['A', 'hug'], ['B', 'hug']], t: 1600 }, { fx: 'hearts', at: 'A' }, { unprop: 'ck' },
      { outcome: 'happy', endText: ['🎂 쌍둥이의 같은 생일', '같은 날, 같은 선물, 같은 마음'] },
    ];
    const c = mk('party', cast, beats, { venue: F.home && FM.INTERIORS[F.home] ? { loc: F.home } : V.plaza, sub: '쌍둥이의 생일' });
    c.resolve = () => { friends(F, M, 8, 6, '생일'); for (const v of [F, M]) { v.stress = Math.max(0, (v.stress || 0) - 25); } mem(F, 'gift', `${M.name} 오빠랑 생일 선물이 똑같았어`); mem(M, 'gift', `${F.name}이랑 생일 선물이 똑같았어`); logD(`🎂 쌍둥이 ${F.name}·${M.name}의 생일! 서로 준비한 선물이 똑같은 머리띠였대요`, [F.id, M.id]); };
    return c;
  }
  function secretStage(F, M) {
    const cast = { A: F, B: M };
    const beats = [
      { narr: `(방송국 연습실 쇼케이스. 객석 맨 뒤에 모자를 눌러쓴 누군가가…)`, who: '해설', icon: '🎤', shot: ['wide'] }, { prop: { kind: 'podium', x: 0, z: -0.5, id: 'pd' } },
      { pose: 'A', p: 'dance', t: 1600 }, { say: 'A', text: sty(F, '♪ 반짝반짝 빛나는 섬의 별이 될 거야~ ♪') }, { fx: 'sparkle', at: 'A' },
      { pose: 'B', p: 'clap', t: 1200 }, { say: 'B', text: sty(M, '(작게) …잘하네. 진짜 잘하네.') },
      { pose: 'A', p: 'look', t: 900 }, { shot: ['close', 'A'], t: 900 }, { say: 'A', text: sty(F, `…어? 저기 맨 뒤… ${M.name} 오빠?!`), hot: true },
      { pose: 'B', p: 'hideFace', t: 1100 }, { say: 'B', text: sty(M, '…아, 아니야. 지나가던 온천 직원이야.') },
      { move: ['A', 0.3, 1.2], run: true, t: 1100 }, { poses: [['A', 'hug'], ['B', 'hug']], t: 1700 }, { say: 'A', text: sty(F, '흐앙~ 와 줬구나! 바쁘다더니!') },
      { fx: 'hearts', at: 'A' }, { unprop: 'pd' }, { outcome: 'happy', endText: ['🎤 몰래 보러 간 무대', '맨 뒷자리의 첫 번째 팬'] },
    ];
    const c = mk('twins', cast, beats, { venue: { loc: 'studio_in' }, slots: { A: [0, -0.4], B: [0.3, 2.2] }, sub: '몰래 보러 간 무대' });
    c.resolve = () => { friends(F, M, 10, 8, '응원'); F.mood = Math.min(100, (F.mood || 50) + 25); mem(F, 'gift', `${M.name} 오빠가 내 무대를 몰래 보러 왔어`); logD(`🎤 ${F.name}의 쇼케이스 객석 맨 뒤에서 몰래 응원하던 ${M.name}이(가) 들켰어요`, [F.id, M.id]); };
    return c;
  }

  // =========================================================
  // 이웃 · 일상
  // =========================================================
  function housewarm(N, guests) {
    const ks = ['B', 'C', 'D'].slice(0, guests.length);
    const cast = Object.assign({ A: N }, Object.fromEntries(ks.map((k, i) => [k, guests[i]])));
    const gifts = ['🧻 휴지 한 묶음', '🧼 세제 세트', '🪴 작은 화분', '🍪 직접 구운 쿠키'];
    const beats = [
      { narr: `(이삿짐을 막 푼 ${N.name}의 집… 띵동!)`, who: '해설', icon: '🏠', shot: ['wide'] },
      ...ks.map(k => ({ show: k, t: 120 })), { say: ks[0], text: sty(guests[0], `이웃이 이사 왔다길래! 환영해요~ 이건 ${gifts[0]}!`), hot: true },
      ...(ks[1] ? [{ say: ks[1], text: sty(guests[1], `${pick(gifts.slice(1))} 가져왔어. 잘 살아 보자!`) }] : []),
      { emo: 'A', e: '🥹' }, { say: 'A', text: sty(N, '와… 다들 고마워요. 섬에 오길 잘했다!') },
      { poses: ks.map(k => [k, 'cheer']).concat([['A', 'bow']]), t: 1400 }, { fx: 'sparkle', at: 'A' },
      { outcome: 'happy', endText: ['🏠 이사 환영회', `${N.name}, 섬에 온 걸 환영해!`] },
    ];
    const c = mk('party', cast, beats, { venue: N.home && FM.INTERIORS[N.home] ? { loc: N.home } : V.plaza, hidden: ks, sub: '이사 환영회' });
    c.resolve = () => { for (const g of guests) friends(N, g, 8, 5, '이사 환영'); mem(N, 'gift', `이사 왔더니 ${guests.map(g => g.name).join(', ')}이(가) 환영해 줬어`); logD(`🏠 새로 이사 온 ${N.name}에게 ${guests.map(g => g.name).join('·')}이(가) 집들이 선물을 들고 찾아왔어요`, [N.id].concat(guests.map(g => g.id))); };
    return c;
  }
  function cookOff(A, B, J0) {
    const cast = { A, B, C: J0 };
    const win = Math.random() < 0.5 ? A : B, lose = win === A ? B : A;
    const beats = [
      { narr: '(카페 앙상블 특설 무대 — 섬 요리 대결!)', who: '해설', icon: '🍳', shot: ['wide'] }, { prop: { kind: 'table', x: 0, z: 0.9, id: 'tb' } },
      { say: 'A', text: sty(A, '내 비장의 김치볶음밥 앞에서 무릎 꿇게 될 거야!') }, { say: 'B', text: sty(B, '훗, 내 수플레 오믈렛은 구름처럼 녹지!') },
      { poses: [['A', 'cook'], ['B', 'cook']], t: 1800 }, { fx: 'sparkle', at: 'A' }, { narr: '(지글지글… 고소한 냄새가 카페를 가득 채운다)', who: '해설', icon: '🔥' },
      { pose: 'C', p: 'eat', t: 1500 }, { say: 'C', text: sty(J0, '음… 음…!! 둘 다 맛있는데… 우승은…!') }, { shot: ['close', 'C'], t: 900 },
      { say: 'C', text: sty(J0, `${win.name}!!`), hot: true }, { pose: win === A ? 'A' : 'B', p: 'cheer', t: 1300 }, { fx: 'fireworks' },
      { say: lose === A ? 'A' : 'B', text: sty(lose, '…인정. 다음엔 레시피 좀 알려 줘.') }, { poses: [['A', 'highfive'], ['B', 'highfive']], t: 1200 }, { unprop: 'tb' },
      { outcome: 'happy', endText: ['🍳 섬 요리 대결', `우승: ${win.name}`] },
    ];
    const c = mk('daily', cast, beats, { venue: { loc: 'cafe_in' }, slots: { A: [-1, 0.2], B: [1, 0.2], C: [0, -1.1] }, sub: '섬 요리 대결' });
    c.resolve = () => { friends(A, B, 6, 4, '요리 대결'); friends(win, J0, 3, 2); win.mood = Math.min(100, (win.mood || 50) + 15); mem(win, 'win', '섬 요리 대결에서 우승했어!'); logD(`🍳 섬 요리 대결! ${A.name} vs ${B.name}, 심사위원 ${J0.name}의 선택은 ${win.name}`, [A.id, B.id, J0.id]); };
    return c;
  }
  function noise(U, D0) {
    const cast = { A: D0, B: U };
    const beats = [
      { filter: 'night' }, { narr: `(밤 11시… 천장에서 쿵! 쿵! 쿵!)`, who: '해설', icon: '🔊', shot: ['wide'] },
      { pose: 'A', p: 'earCover', t: 1300 }, { say: 'A', text: sty(D0, '…또야?! 오늘은 꼭 말해야겠어.') }, { fx: 'shock' },
      { move: ['A', 0.2, 0.3], t: 1000 }, { pose: 'A', p: 'knockHesitate', t: 1300 }, { show: 'B' },
      { say: 'B', text: sty(U, '어? 무슨 일로…? 앗, 혹시 시끄러웠어요?!') }, { say: 'A', text: sty(D0, '저기… 밤마다 쿵쿵 소리가…') },
      { say: 'B', text: sty(U, '아… 홈트하다가… 죄송해요!! 매트 깔게요!') }, { pose: 'B', p: 'bow', t: 1200 },
      { say: 'A', text: sty(D0, '…홈트요? 그럼 내일부터 같이 할래요? 저도 운동해야 하는데.') }, { emo: 'B', e: '😳' },
      { poses: [['A', 'highfive'], ['B', 'highfive']], t: 1200 }, { filter: '' },
      { outcome: 'happy', endText: ['🔊 층간소음 분쟁', '싸우러 갔다가 운동 메이트가 됐다'] },
    ];
    const c = mk('daily', cast, beats, { venue: D0.home && FM.INTERIORS[D0.home] ? { loc: D0.home } : V.plaza, slots: { A: [-0.8, 0.4], B: [0.9, -0.4] }, hidden: ['B'], sub: '층간소음 분쟁' });
    c.resolve = () => { friends(U, D0, 8, 6, '이웃'); mem(D0, 'neighbor', `윗집 ${U.name}이랑 층간소음 얘기하다가 운동 메이트가 됐어`); logD(`🔊 층간소음으로 찾아간 ${D0.name}, 윗집 ${U.name}와(과) 운동 메이트가 됐어요`, [U.id, D0.id]); };
    return c;
  }
  function wallet(A, B) {
    const honest = !FM.Moral || FM.Moral.con(A) >= 45;
    const cast = { A, B };
    const beats = [
      { narr: `(${A.name}이(가) 벤치 밑에서 두툼한 지갑을 주웠다)`, who: '해설', icon: '👛', shot: ['wide'] },
      { pose: 'A', p: 'crouch', t: 1000 }, { say: 'A', text: sty(A, `…${B.name}의 지갑이네. 돈이 꽤 많이 들었는데…`) }, { emo: 'A', e: '🤔' },
      ...(honest ? [
        { say: 'A', text: sty(A, '아니야. 지금쯤 엄청 찾고 있을 거야.') }, { show: 'B' }, { move: ['B', 0.7, 0], run: true, t: 1200 },
        { say: 'B', text: sty(B, '지갑… 내 지갑 못 봤어?! 월급 전부 들었는데!!'), hot: true }, { say: 'A', text: sty(A, '이거지? 벤치 밑에 떨어져 있었어.') },
        { emo: 'B', e: '😭' }, { pose: 'B', p: 'bow', t: 1200 }, { say: 'B', text: sty(B, '고마워… 진짜 고마워! 밥 살게, 꼭 살게!') }, { fx: 'hearts', at: 'B' },
        { outcome: 'happy', endText: ['👛 주운 지갑', '정직이 가장 큰 재산'] },
      ] : [
        { narr: '(…잠깐 망설이다 지갑을 주머니에 넣었다)', who: '해설', icon: '😈' }, { show: 'B' }, { move: ['B', 0.9, 0.3], run: true, t: 1200 },
        { say: 'B', text: sty(B, '혹시 지갑 못 봤어?') }, { say: 'A', text: sty(A, '…아, 아니? 못 봤는데.') }, { fx: 'sweat', at: 'A' },
        { narr: '(그날 밤, 양심이 너무 따끔거려 잠이 오지 않았다…)', who: '해설', icon: '🌙' },
        { outcome: 'sad', endText: ['👛 주운 지갑', '양심의 가책이란…'] },
      ]),
    ];
    const c = mk(honest ? 'friend' : 'daily', cast, beats, { venue: V.park, slots: { A: [0, 0], B: [3.2, 0.9] }, hidden: ['B'], sub: '주운 지갑' });
    c.resolve = () => {
      if (honest) { friends(A, B, 10, 12, '지갑을 돌려줌'); mem(B, 'gift', `${A.name}이(가) 잃어버린 지갑을 찾아 줬어`); logD(`👛 ${A.name}이(가) 주운 지갑을 ${B.name}에게 돌려줬어요. 정직왕!`, [A.id, B.id]); }
      else { A.stress = Math.min(100, (A.stress || 0) + 25); if (A.guilt != null) A.guilt += 20; B.coins = Math.max(0, (B.coins || 0) - 200); A.coins = (A.coins || 0) + 200; Sim.log('rel', `👛 ${B.name}이(가) 공원에서 지갑을 잃어버렸어요… 누군가 주웠다는 소문이`, [B.id, A.id], 1, { secret: false }); }
    };
    return c;
  }
  function meteor(list) {
    const ks = ['A', 'B', 'C'].slice(0, list.length);
    const cast = Object.fromEntries(ks.map((k, i) => [k, list[i]]));
    const WISH = ['좋아하는 사람이랑 잘 되게 해 주세요…', '부자 되게 해 주세요! 아니 건강이 먼저!', '이 섬 사람들 다 행복하게 해 주세요', '내일 떡볶이 완판되게 해 주세요!', '꼭 데뷔하게 해 주세요!', '다들 아프지 않게…'];
    const beats = [
      { filter: 'night' }, { narr: '(천문대 앞 언덕. 하늘에서 별이 비처럼 쏟아진다)', who: '해설', icon: '🌠', shot: ['wide'] },
      { poses: ks.map(k => [k, 'lookUp']), t: 1500 }, { fx: 'glow' }, { say: ks[0], text: sty(list[0], '저기! 또 떨어진다! 빨리 소원 빌어!'), hot: true },
      ...ks.map(k => ({ say: k, text: sty(cast[k], `(두 손을 모으고) ${pick(WISH)}`) })),
      { poses: ks.map(k => [k, 'sit']), t: 1400 }, { say: ks[ks.length - 1], text: sty(list[list.length - 1], '…무슨 소원 빌었는지 말하면 안 이뤄지는 거 알지?') },
      { fx: 'sparkle', at: ks[0] }, { filter: '' }, { outcome: 'happy', endText: ['🌠 유성우의 밤', '별똥별 아래서 빈 소원'] },
    ];
    const c = mk('friend', cast, beats, { venue: V.observatory, sub: '유성우 소원' });
    c.resolve = () => { for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) friends(list[i], list[j], 5, 3, '유성우'); for (const v of list) { v.stress = Math.max(0, (v.stress || 0) - 15); mem(v, 'stars', '친구들이랑 유성우 보면서 소원을 빌었어'); } logD(`🌠 유성우가 쏟아진 밤, ${list.map(v => v.name).join('·')}이(가) 천문대 언덕에서 소원을 빌었어요`, list.map(v => v.id)); };
    return c;
  }
  function wrongLetter(A, B, C) {
    const cast = { A, B, C };
    const beats = [
      { narr: `(${A.name}이(가) 밤새 쓴 러브레터… 우체통이 헷갈렸다)`, who: '해설', icon: '💌', shot: ['wide'] }, { prop: { kind: 'letter', x: 0.9, z: 0.4, id: 'lt' } },
      { pose: 'C', p: 'read', t: 1500 }, { say: 'C', text: sty(C, `"…항상 웃는 네 모습이 좋아" …어? 이거 나한테 쓴 거야?!`) }, { emo: 'C', e: '😳' },
      { show: 'A' }, { move: ['A', -0.5, 0.3], run: true, t: 1100 }, { fx: 'shock' }, { say: 'A', text: sty(A, '그, 그거 아니야!! 그거 받는 사람 다른 사람이야!!'), hot: true },
      { say: 'C', text: sty(C, '…아. 그럼 누구한테… 아하~ 혹시?') }, { pose: 'C', p: 'point', t: 900 },
      { show: 'B' }, { say: 'B', text: sty(B, '뭔데? 뭐가 그렇게 시끄러워?') }, { poses: [['A', 'hideFace']], t: 1200 },
      { say: 'C', text: sty(C, `(편지를 슥 건네며) ${B.name}, 이거 너한테 온 거래~`) }, { pose: 'B', p: 'read', t: 1400 }, { emo: 'B', e: '😳' }, { emo: 'A', e: '😳' },
      { unprop: 'lt' }, { outcome: 'happy', endText: ['💌 잘못 배달된 러브레터', '돌고 돌아 제자리로'] },
    ];
    const c = mk('confess', cast, beats, { venue: V.plaza, slots: { A: [-2.8, 1.0], B: [2.6, 1.0], C: [0.4, 0] }, hidden: ['A', 'B'], sub: '잘못 배달된 러브레터' });
    c.resolve = () => { if (Soc.addRomance) { Soc.addRomance(B.id, A.id, 10, '러브레터'); Soc.addRomance(A.id, B.id, 4, '러브레터'); } friends(A, C, 3, 2); logD(`💌 ${A.name}의 러브레터가 ${C.name}에게 잘못 배달됐다가… 결국 ${B.name}에게 전해졌대요`, [A.id, B.id, C.id], 2, 'romance'); };
    return c;
  }
  function lottery(A, others) {
    const ks = ['B', 'C', 'D'].slice(0, others.length);
    const cast = Object.assign({ A }, Object.fromEntries(ks.map((k, i) => [k, others[i]])));
    const beats = [
      { narr: `(편의점 앞… ${A.name}이(가) 복권을 긁고 있다)`, who: '해설', icon: '🍀', shot: ['wide'] },
      { pose: 'A', p: 'look', t: 1000 }, { say: 'A', text: sty(A, '…어? 어어? 1등?! 5천 코인?!'), hot: true }, { fx: 'flash' }, { pose: 'A', p: 'jumpPop', t: 1200 },
      ...ks.map(k => ({ show: k, t: 100 })), { say: ks[0], text: sty(others[0], `어머~ ${A.name}! 우리 원래 엄청 친했잖아~ 그치?`) },
      ...(ks[1] ? [{ say: ks[1], text: sty(others[1], `${A.name}아~ 오늘 저녁 뭐 먹을래? 내가 메뉴 고를게~`) }] : []),
      { emo: 'A', e: '😏' }, { say: 'A', text: sty(A, '…다들 왜 이렇게 다정해? 좋아, 오늘 저녁은 내가 쏜다!') },
      { poses: ks.map(k => [k, 'cheer']), t: 1300 }, { fx: 'fireworks' },
      { outcome: 'happy', endText: ['🍀 복권 당첨 소동', '갑자기 친구가 늘어난 날'] },
    ];
    const c = mk('party', cast, beats, { venue: { loc: 'island', x: 28, z: 40, place: 'conv' }, hidden: ks, sub: '복권 당첨 소동' });
    c.resolve = () => { A.coins = (A.coins || 0) + 5000 - 300 * others.length; for (const o of others) friends(A, o, 4, 1, '한턱'); mem(A, 'luck', '복권 1등이 됐더니 갑자기 다들 다정해졌어'); logD(`🍀 ${A.name}이(가) 복권 1등에 당첨! 갑자기 ${others.map(o => o.name).join('·')}이(가) 다정해졌대요`, [A.id].concat(others.map(o => o.id))); };
    return c;
  }
  function promotion(A, fr) {
    const ks = ['B', 'C'].slice(0, fr.length);
    const cast = Object.assign({ A }, Object.fromEntries(ks.map((k, i) => [k, fr[i]])));
    const beats = [
      { narr: `(레트로 펍. ${A.name}이(가) 잔을 높이 들었다)`, who: '해설', icon: '💼', shot: ['wide'] },
      { say: 'A', text: sty(A, '여러분! 저… 오늘 승진했습니다!!'), hot: true }, { fx: 'fireworks' }, { poses: ks.map(k => [k, 'clap']), t: 1200 },
      { say: ks[0], text: sty(fr[0], '대박! 그동안 야근한 보람이 있네!') }, { say: 'A', text: sty(A, '오늘은 제가 쏩니다! 다들 마음껏 시켜!') },
      ...(ks[1] ? [{ say: ks[1], text: sty(fr[1], '사장님~ 여기 제일 비싼 거요!') }, { emo: 'A', e: '😅' }] : []),
      { poses: [['A', 'cheer']].concat(ks.map(k => [k, 'cheer'])), t: 1400 }, { fx: 'sparkle', at: 'A' },
      { outcome: 'happy', endText: ['💼 승진 턱', `${A.name}, 승진 축하해!`] },
    ];
    const c = mk('party', cast, beats, { venue: { loc: 'pub_in' }, sub: '승진 턱' });
    c.resolve = () => { A.salaryBonus = (A.salaryBonus || 0) + 50; A.coins = Math.max(0, (A.coins || 0) - 400 + 1200); for (const f of fr) friends(A, f, 5, 3, '승진 턱'); mem(A, 'win', '승진해서 친구들한테 한턱 쐈어'); logD(`💼 ${A.name}이(가) 승진했어요! 펍에서 ${fr.map(f => f.name).join('·')}에게 한턱 쐈대요`, [A.id].concat(fr.map(f => f.id))); };
    return c;
  }
  function sportsDay(list) {
    const [A, B, C, D2] = list;
    const cast = { A, B, C, D: D2 };
    const winTeam = chance(0.5) ? ['A', 'B'] : ['C', 'D'];
    const beats = [
      { narr: '(주말 섬 체육대회! 청팀 vs 백팀 이어달리기!)', who: '해설', icon: '🏃', shot: ['wide'] },
      { say: 'A', text: sty(A, '청팀 파이팅!! 무조건 이긴다!') }, { say: 'C', text: sty(C, '백팀이 이길 거거든?!') },
      { poses: [['A', 'jog'], ['C', 'jog']], t: 900 }, { move: ['A', -0.8, -2.2], run: true, t: 1300 }, { move: ['C', 0.8, -2.2], run: true, t: 1300 },
      { narr: '(바통 터치…!)', who: '해설', icon: '🔁' }, { poses: [['B', 'jog'], ['D', 'jog']], t: 800 }, { move: ['B', -0.8, 1.6], run: true, t: 1300 }, { move: ['D', 0.8, 1.6], run: true, t: 1350 },
      ...(chance(0.4) ? [{ pose: winTeam[0] === 'A' ? 'D' : 'B', p: 'roll', t: 1100 }, { narr: '(앗! 결승선 앞에서 넘어졌다!)', who: '해설', icon: '💥' }] : []),
      { fx: 'fireworks' }, { poses: winTeam.map(k => [k, 'cheer']), t: 1400 },
      { say: winTeam[0], text: sty(cast[winTeam[0]], '이겼다아~!! 우리 팀 최고!'), hot: true },
      { poses: [['A', 'highfive'], ['C', 'highfive']], t: 1200 }, { say: winTeam[0] === 'A' ? 'C' : 'A', text: sty(winTeam[0] === 'A' ? C : A, '…다음 주에 재대결이다!') },
      { outcome: 'happy', endText: ['🏃 섬 체육대회', `${winTeam[0] === 'A' ? '청팀' : '백팀'} 승리!`] },
    ];
    const c = mk('friend', cast, beats, { venue: V.park, slots: { A: [-0.8, 0], C: [0.8, 0], B: [-0.8, -2.4], D: [0.8, -2.4] }, sub: '섬 체육대회' });
    c.resolve = () => { friends(A, B, 6, 3); friends(C, D2, 6, 3); friends(A, C, 3, 2); friends(B, D2, 3, 2); for (const v of list) { if (FM.Needs) FM.Needs.bump(v, 'social', -30); } logD(`🏃 주말 섬 체육대회! ${A.name}·${B.name} (청팀) vs ${C.name}·${D2.name} (백팀) — ${winTeam[0] === 'A' ? '청팀' : '백팀'} 승리`, list.map(v => v.id)); };
    return c;
  }
  function cleanup(list) {
    const ks = ['A', 'B', 'C', 'D'].slice(0, list.length);
    const cast = Object.fromEntries(ks.map((k, i) => [k, list[i]]));
    const beats = [
      { narr: '(오늘은 마을 대청소의 날! 해변 쓰레기를 줍자)', who: '해설', icon: '🧹', shot: ['wide'] },
      { say: 'A', text: sty(list[0], '자, 구역 나눠서 시작! 제일 많이 줍는 사람한테 아이스크림!') },
      { poses: ks.map(k => [k, 'sweep']), t: 1800 }, { fx: 'sparkle', at: 'B' },
      { say: 'B', text: sty(list[1], '…어? 병 안에 쪽지가 들어 있어!') }, { emo: 'B', e: '😲' },
      { narr: '("이 병을 주운 사람은 오늘 행운이 가득하기를" — 누군가의 오래된 편지)', who: '해설', icon: '🍾' },
      { poses: ks.map(k => [k, 'cheer']), t: 1300 }, { say: ks[ks.length - 1], text: sty(list[list.length - 1], '해변 반짝반짝해졌다! 우리 진짜 잘했어!') },
      { outcome: 'happy', endText: ['🧹 마을 대청소', '깨끗해진 해변과 병 속 편지'] },
    ];
    const c = mk('daily', cast, beats, { venue: V.beach, sub: '마을 대청소' });
    c.resolve = () => { for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) friends(list[i], list[j], 3, 2, '대청소'); S().player.coins += 0; logD(`🧹 마을 대청소의 날! ${list.map(v => v.name).join('·')}이(가) 해변을 반짝반짝하게 만들었어요 (병 속 편지 발견!)`, list.map(v => v.id)); };
    return c;
  }
  function lighthouseConfess(A, B) {
    const cast = { A, B };
    const beats = [
      { narr: '(바람의 곶, 하얀 등대 아래. 바다가 주황빛으로 물든다)', who: '해설', icon: '🗼', shot: ['wide'] },
      { poses: [['A', 'look'], ['B', 'look']], t: 1300 }, { say: 'B', text: sty(B, '…여기 진짜 예쁘다. 어떻게 알았어?') },
      { say: 'A', text: sty(A, '…너한테 꼭 보여 주고 싶었어. 그리고, 할 말이 있어서.') }, { shot: ['close', 'A'], t: 900 },
      { say: 'A', text: sty(A, '등대 불빛처럼… 언제나 너만 비추고 싶어. 나랑 사귈래?'), hot: true }, { fx: 'glow' },
      { emo: 'B', e: '😳' }, { pose: 'B', p: 'hideFace', t: 1200 }, { say: 'B', text: sty(B, '…응. 나도 계속 기다렸어.') },
      { poses: [['A', 'hug'], ['B', 'hug']], t: 1800 }, { fx: 'hearts', at: 'A' },
      { outcome: 'happy', endText: ['🗼 등대 위 노을 고백', '그날 등대는 둘만 비췄다'] },
    ];
    const c = mk('confess', cast, beats, { venue: V.lighthouse, sub: '등대 위 노을 고백' });
    c.resolve = () => { const r = Soc.rel(A.id, B.id); if (Soc.startDating) Soc.startDating(A.id, B.id); else r.status = 'DATING'; Soc.addRomance(A.id, B.id, 15, '등대 고백'); Soc.addRomance(B.id, A.id, 15, '등대 고백'); Sim.log('couple', `💕 ${A.name}와(과) ${B.name}이(가) 하얀 등대 아래에서 연인이 되었어요!`, [A.id, B.id], 3, { newsKind: 'drama' }); };
    return c;
  }
  function caveExplore(list) {
    const ks = ['A', 'B', 'C'].slice(0, list.length);
    const cast = Object.fromEntries(ks.map((k, i) => [k, list[i]]));
    const beats = [
      { narr: '(썰물 때 드러난 해안 동굴… 탐험대가 손전등을 켰다)', who: '해설', icon: '🔦', shot: ['wide'] },
      { say: 'A', text: sty(list[0], '대장은 나야! 다들 내 뒤에 붙어!') }, { poses: ks.map(k => [k, 'look']), t: 1200 },
      { say: 'B', text: sty(list[1], '…방금 뭔가 움직였어. 진짜야.') }, { fx: 'shock' }, { pose: 'A', p: 'surprise', t: 900 },
      { narr: '(…파닥! 박쥐가 아니라 길 잃은 갈매기였다)', who: '해설', icon: '🕊️' }, { emo: 'A', e: '😅' },
      { fx: 'glow' }, { narr: '(안쪽 웅덩이에서 수정이 별빛처럼 반짝인다)', who: '해설', icon: '💎' },
      { poses: ks.map(k => [k, 'lookUp']), t: 1500 }, { say: ks[ks.length - 1], text: sty(list[list.length - 1], '…우와. 우리만 아는 비밀 장소로 하자.') },
      { outcome: 'happy', endText: ['🌊 해안 동굴 탐험대', '우리만 아는 비밀 장소'] },
    ];
    const c = mk('friend', cast, beats, { venue: { loc: 'cave_in' }, sub: '해안 동굴 탐험대' });
    c.resolve = () => { for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) friends(list[i], list[j], 6, 5, '탐험'); logD(`🌊 ${list.map(v => v.name).join('·')} 탐험대가 해안 동굴 깊숙한 곳에서 빛나는 수정을 발견했어요`, list.map(v => v.id)); };
    return c;
  }
  function ugMeeting(list) {
    const ks = ['A', 'B', 'C', 'D'].slice(0, list.length);
    const cast = Object.fromEntries(ks.map((k, i) => [k, list[i]]));
    const beats = [
      { narr: '(B1 언더하우스 로비. 첫 반상회가 열렸다)', who: '해설', icon: '🕳️', shot: ['wide'] },
      { say: 'A', text: sty(list[0], '안건 1번! 세탁기 사용 시간표 정합시다!') }, { say: 'B', text: sty(list[1], '안건 2번… 오락기 최고 점수 누가 자꾸 지워요?!') },
      { poses: [['B', 'glare']], t: 900 }, ...(ks[2] ? [{ say: 'C', text: sty(list[2], '…그거 나야. 미안. 점수가 너무 낮아 보여서…') }, { fx: 'shock' }] : []),
      { poses: ks.map(k => [k, 'surprise']), t: 900 }, { say: 'A', text: sty(list[0], '…안건 3번! 이번 주말에 다 같이 오락기 대회 합시다!') },
      { poses: ks.map(k => [k, 'cheer']), t: 1400 }, { fx: 'sparkle', at: 'A' },
      { outcome: 'happy', endText: ['🕳️ 지하 아파트 반상회', '지하에도 이웃의 정은 있다'] },
    ];
    const c = mk('daily', cast, beats, { venue: { loc: 'ug_lobby' }, sub: '지하 반상회' });
    c.resolve = () => { for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) friends(list[i], list[j], 4, 3, '반상회'); logD(`🕳️ 지하 아파트 첫 반상회! 결론은… 주말 오락기 대회`, list.map(v => v.id)); };
    return c;
  }

  const MAKE = { twinSwap, twinBirthday, secretStage, housewarm, cookOff, noise, wallet, meteor, wrongLetter, lottery, promotion, sportsDay, cleanup, lighthouseConfess, caveExplore, ugMeeting };
  LV.make = MAKE;

  // =========================================================
  // 발생 조건
  // =========================================================
  const cool = {};
  const ready = (k, hours) => { const t = S().time; if (cool[k] && t - cool[k] < hours * 60) return false; return true; };
  const mark = k => { cool[k] = S().time; cool._any = S().time; };
  const hashB = s => { let h = 7; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const bdayOf = v => v.bday || (hashB(v.id + 'bd') % 28) + 1;
  function tryHour(h) {
    const st = S(); if (!st || st.villagers.length < 4) return null;
    if (cool._any && st.time - cool._any < 240) return null;
    const A = adults().filter(free), wd = Sim.time.weekday(), d = day();
    const tw = twins(); const twFree = tw && tw.every(free);
    // 쌍둥이
    if (twFree && h === 10 && bdayOf(tw[0]) === ((d - 1) % 28) + 1 && ready('twinBd', 24 * 20)) { mark('twinBd'); return twinBirthday(tw[0], tw[1]); }
    if (twFree && h >= 13 && h <= 16 && chance(0.12) && ready('twinSwap', 24 * 5)) { const C = A.filter(v => !tw.includes(v)).sort((x, y) => fp(y, tw[0]) - fp(x, tw[0]))[0]; if (C) { mark('twinSwap'); return twinSwap(tw[0], tw[1], C); } }
    if (twFree && h === 18 && chance(0.25) && ready('stage', 24 * 6)) { mark('stage'); return secretStage(tw[0], tw[1]); }
    // 유성우 (4일마다 밤)
    if (d % 4 === 0 && h === 22 && ready('meteor', 24 * 3)) { const l = shuffle(A.filter(v => has(v, 'ROMANTIC') || has(v, 'MYSTIC') || has(v, 'SCHOLARLY') || chance(0.25))).slice(0, 3); if (l.length >= 2) { mark('meteor'); return meteor(l); } }
    // 주말 체육대회 · 대청소
    if (wd === 6 && h === 10 && ready('sports', 24 * 6)) { const l = shuffle(A.filter(v => has(v, 'ATHLETIC') || has(v, 'TOMBOY') || chance(0.3))).slice(0, 4); if (l.length === 4) { mark('sports'); return sportsDay(l); } }
    if (wd === 5 && h === 8 && chance(0.6) && ready('clean', 24 * 6)) { const l = shuffle(A).slice(0, 4); if (l.length >= 3) { mark('clean'); return cleanup(l); } }
    // 요리 대결 (오후)
    if (h === 15 && chance(0.15) && ready('cook', 24 * 4)) { const ck = shuffle(A.filter(v => v.keys.L4 === 'FOOD' || has(v, 'FOOD') || /요리|셰프|떡볶이|타코야키/.test(v.castJob || ''))); const j = A.find(v => !ck.slice(0, 2).includes(v)); if (ck.length >= 2 && j) { mark('cook'); return cookOff(ck[0], ck[1], j); } }
    // 층간소음 (밤 · 아파트 위아래층)
    if (h === 23 && chance(0.2) && ready('noise', 24 * 4)) {
      for (const v of shuffle(A.filter(v => v.home && /^apt-\d0\d$/.test(v.home)))) { const fl = +v.home[4], n = v.home.slice(5); const up = A.find(o => o.home === `apt-${fl + 1}${n}`); if (up && fp(v, up) < 40) { mark('noise'); return noise(up, v); } }
    }
    // 주운 지갑
    if (h >= 11 && h <= 17 && chance(0.05) && ready('wallet', 24 * 3)) { const [a, b] = shuffle(A); if (a && b) { mark('wallet'); return wallet(a, b); } }
    // 잘못 배달된 러브레터 (짝사랑 중인 주민)
    if (h >= 10 && h <= 18 && chance(0.12) && ready('letter', 24 * 4)) { const a = A.find(v => v.crush && v.crush.target && v.crush.target !== P && free(Sim.byId(v.crush.target))); const b = a && Sim.byId(a.crush.target); const c = b && A.find(o => o !== a && o !== b); if (c) { mark('letter'); return wrongLetter(a, b, c); } }
    // 복권 · 승진
    if (h === 19 && chance(0.06) && ready('lotto', 24 * 7)) { const [a, ...o] = shuffle(A); if (o.length >= 2) { mark('lotto'); return lottery(a, o.slice(0, 2)); } }
    if (h === 20 && chance(0.08) && ready('promo', 24 * 5)) { const a = A.find(v => v.job === 'office' || v.castJob); const fr = a && A.filter(o => o !== a && fp(a, o) >= 30).slice(0, 2); if (fr && fr.length) { mark('promo'); return promotion(a, fr); } }
    // 등대 노을 고백 (서로 마음 있는 둘)
    if (h >= 17 && h <= 19 && chance(0.15) && ready('lhc', 24 * 3)) {
      for (const a of shuffle(A)) { if (Soc.partnerOf(a.id)) continue; const b = A.find(o => o !== a && !Soc.partnerOf(o.id) && Soc.canRomance(a.id, o.id) && (Soc.F(a.id, o.id).romance || 0) >= 45 && (Soc.F(o.id, a.id).romance || 0) >= 35); if (b) { mark('lhc'); return lighthouseConfess(a, b); } }
    }
    // 해안 동굴 탐험대 (발견 뒤)
    if (st.found && st.found.cave && h >= 14 && h <= 17 && chance(0.1) && ready('cave', 24 * 5)) { const l = shuffle(A.filter(v => has(v, 'ADVENTURER') || has(v, 'CURIOUS') || chance(0.3))).slice(0, 3); if (l.length >= 2) { mark('cave'); return caveExplore(l); } }
    // 지하 반상회 (열린 뒤 · 입주민 3명 이상)
    if (FM.Ug && FM.Ug.isOpen() && h === 20 && ready('ugm', 24 * 6)) { const l = A.filter(v => v.home && v.home.startsWith('ug-')).slice(0, 4); if (l.length >= 3) { mark('ugm'); return ugMeeting(l); } }
    return null;
  }
  FM.bus.on('hour', h => { try { const c = tryHour(h); if (c) Cut.enqueue(c); } catch (e) { console.error('lifevig', e); } });
  // 이사 환영회: 누가 입주하면
  const baseFromLog = Cut.fromLog;
  Cut.fromLog = function (e) {
    try {
      if (e && e.type === 'move' && /입주했어요/.test(e.text) && (e.who || []).length === 1 && ready('house', 12)) {
        const N = Sim.byId(e.who[0]);
        const g = N && shuffle(adults().filter(o => o !== N && free(o) && (has(o, 'BUSYBODY') || has(o, 'EXTROVERT') || has(o, 'WARM') || chance(0.3)))).slice(0, 2);
        if (g && g.length) { mark('house'); return housewarm(N, g); }
      }
    } catch (er) { console.error('lifevig log', er); }
    return baseFromLog(e);
  };

  // 대기 중인 드라마 이어 재생: 뉴스 · 창 · 대화가 끝나면 (자동 재생 켜져 있을 때만, 20초 간격)
  let lastStart = 0;
  FM.bus.on('cutPlay', () => { lastStart = Date.now(); });
  setInterval(() => {
    try {
      const st = S(); if (!st || !st.flags || st.flags.autoCut === false || st.speed > 15) return;
      if (!Cut.playing || Cut.playing() || !Cut.queueLength() || Date.now() - lastStart < 20000) return;
      if (document.getElementById('newsShow') || (FM.UI.modalOpen && FM.UI.modalOpen()) || FM.UI.editing) return;
      const dlg = document.getElementById('dialog'); if (dlg && !dlg.hidden) return;
      Cut.playNext();
    } catch (e) { /* */ }
  }, 3000);

  // 신의 툴 목록
  if (FM.Vig) {
    const NAMES = { twinSwap: '👯 쌍둥이 바꿔치기', twinBirthday: '🎂 쌍둥이의 생일', secretStage: '🎤 몰래 보러 간 무대', housewarm: '🏠 이사 환영회', cookOff: '🍳 섬 요리 대결', noise: '🔊 층간소음 분쟁', wallet: '👛 주운 지갑', meteor: '🌠 유성우 소원', wrongLetter: '💌 잘못 배달된 러브레터', lottery: '🍀 복권 당첨 소동', promotion: '💼 승진 턱', sportsDay: '🏃 섬 체육대회', cleanup: '🧹 마을 대청소', lighthouseConfess: '🗼 등대 위 노을 고백', caveExplore: '🌊 해안 동굴 탐험대', ugMeeting: '🕳️ 지하 반상회' };
    for (const [k, n] of Object.entries(NAMES)) FM.Vig.KINDS['l_' + k] = n;
    const origRun = FM.Vig.run;
    FM.Vig.run = function (kind) {
      if (typeof kind === 'string' && kind.startsWith('l_') && MAKE[kind.slice(2)]) {
        const k = kind.slice(2), A = shuffle(adults()), tw = twins() || [A[0], A[1]];
        const lover = () => { const a = A.find(v => Soc.genderOf(v.id) === 'F'), b = A.find(v => Soc.genderOf(v.id) === 'M'); return [a, b]; };
        const args = { twinSwap: [tw[0], tw[1], A.find(v => !tw.includes(v))], twinBirthday: tw, secretStage: tw, housewarm: [A[0], A.slice(1, 3)], cookOff: [A[0], A[1], A[2]], noise: [A[0], A[1]], wallet: [A[0], A[1]], meteor: [A.slice(0, 3)],
          wrongLetter: [A[0], A[1], A[2]], lottery: [A[0], A.slice(1, 3)], promotion: [A[0], A.slice(1, 3)], sportsDay: [A.slice(0, 4)], cleanup: [A.slice(0, 4)], lighthouseConfess: lover(), caveExplore: [A.slice(0, 3)], ugMeeting: [A.slice(0, 4)] }[k];
        const c = MAKE[k](...args); c.resolve = null; return Cut.enqueue(c, true);
      }
      return origRun(kind);
    };
  }
})();
