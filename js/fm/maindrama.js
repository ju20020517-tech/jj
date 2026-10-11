/* =========================================================
 * 🎬 메인 드라마: 은비와 오래된 축제의 기록
 * - 개인 스토리 데이터와 분리된 진행형 미스터리
 * - 기존 주민 관계 시뮬레이션(drama.js)은 유지하고, 메인 연출만 담당
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, Cut = FM.Cut;
  if (!FM.MAIN_STORY || !Sim || !Soc || !Cut) return;
  const MD = FM.MainDrama = {};
  const S = () => Sim.get();
  const day = () => Sim.time.day();
  const byCast = id => S().villagers.find(v => v.castId === id || v.id === id);
  const nm = id => (byCast(id) || {}).name || id;
  const castFor = ids => ids.map(byCast).filter(Boolean);
  const totalPersonalEpisodes = () => Object.values(S().story || {}).reduce((n, st) => n + Math.min(5, st.ep || 0), 0);
  const state = () => {
    const s = S();
    s.mainDrama = s.mainDrama || { completed: [], choice: {}, lastDay: -1 };
    return s.mainDrama;
  };
  const unlocks = [
    () => totalPersonalEpisodes() >= 3,
    () => totalPersonalEpisodes() >= 8,
    () => totalPersonalEpisodes() >= 15,
    () => totalPersonalEpisodes() >= 24,
    () => totalPersonalEpisodes() >= 32 && ((S().story || {})[byCast('c07') && byCast('c07').id] || {}).ep >= 4,
  ];
  const venue = id => {
    const m = FM.MAP && FM.MAP.P && FM.MAP.P[id];
    if (m && m.interior && FM.INTERIORS && FM.INTERIORS[m.interior]) return { loc: m.interior };
    return m ? { loc: 'island', x: m.x, z: m.z + 2, place: id } : { loc: 'island', x: 3, z: 19, place: 'plaza' };
  };
  const titleChoices = (ep) => ([
    ['📣 원본을 공개한다', '🕵️ 당사자를 먼저 찾는다'],
    ['🖼️ 사진을 공개한다', '🗣️ 증언을 더 모은다'],
    ['📚 기록을 복원한다', '🏠 가족에게 먼저 묻는다'],
    ['🎆 축제 재현을 진행한다', '🛟 안전 기록을 먼저 공개한다'],
    ['📢 모두에게 진실을 알린다', '🕊️ 은비가 말할 시간을 기다린다'],
  ][ep] || ['계속 조사한다', '잠시 멈추고 생각한다']);
  const question = ep => ([
    '곰인형 안쪽에서 오래된 축제 초대장이 나왔어. 어떻게 할까?',
    '사진에서 지워진 사람을 발견했어. 어디부터 확인할까?',
    '명단에서 사라진 이름이 있어. 누구의 방식으로 진실을 찾을까?',
    '축제 마지막 밤의 무전 기록이 끊겨 있어. 축제를 먼저 재현할까?',
    '이제 기록이 거의 맞춰졌어. 은비가 진실을 말할 준비가 될 때까지 기다릴까?',
  ][ep] || '다음 단서를 어떻게 다룰까?');
  function episode(ep, choice) {
    const data = FM.MAIN_STORY[ep], actors = castFor(data.cast);
    if (!data || !actors.length) return null;
    const A = actors[0], B = actors[1] || actors[0], C = actors[2] || actors[1] || actors[0];
    const selected = titleChoices(ep)[choice === 'second' ? 1 : 0];
    const beats = [
      { filter: ep === 0 ? 'sepia' : 'thriller' },
      { narr: '(오래된 축제의 기록을 다시 펼친다. 먼지 쌓인 종이에서 바닷바람 냄새가 난다)', who: '해설', icon: '📜', shot: ['wide'] },
      { show: 'A' }, { move: ['A', 0.8, 0.3], t: 850 },
      { say: 'A', text: ep === 0 ? '이 곰인형은 어릴 때부터 내 곁에 있었어. 안에 이런 게 들어 있는 줄 몰랐어.' : '기록이 서로 맞지 않아. 누군가 기억을 감추려 했거나, 우리가 아직 모르는 일이 있는 거야.', shot: 'close' },
      { show: 'B' }, { move: ['B', 1.2, -0.2], t: 900 },
      { say: 'B', text: data.clue + '… 이건 우연이라고 보기 어려워.' },
      ...(actors.length > 2 ? [{ show: 'C' }, { move: ['C', 1.8, 0.4], t: 900 }, { say: 'C', text: ep === 4 ? '은비, 이번엔 네가 어떻게 말할지 우리가 기다릴게.' : '잠깐, 이 기록의 날짜가 다른 자료와 맞아. 다음 단서로 이어질 수 있겠어.' }] : []),
      { filter: '' },
      { say: 'A', text: choice === 'second' ? selected + ' 이쪽부터 해 보자. 서두르다가 누군가를 또 다치게 하고 싶진 않아.' : selected + ' 더는 이 기록을 모른 척할 수 없어.' },
      { poses: actors.slice(0, 3).map((v, i) => [String.fromCharCode(65 + i), 'look']), t: 1000 },
      { fx: ep === 4 ? 'fireworks' : 'glow' },
      { outcome: 'happy', endText: ['🎬 ' + data.title, ep === 4 ? '은비의 선택을 존중하며, 섬의 이야기를 마무리한다.' : '단서는 이어졌다. 다음 장에서 오래된 축제의 빈칸이 조금 더 채워진다.'] },
    ];
    const c = { theme: ep === 4 ? 'party' : 'reunion', cast: { A, B, ...(actors[2] ? { C } : {}) }, beats,
      key: 'mainDrama|' + data.id, vig: true, force: true, sub: data.title, venue: venue(data.cast[0]) };
    c.resolve = () => {
      const st = state();
      if (!st.completed.includes(data.id)) st.completed.push(data.id);
      st.choice[data.id] = choice || 'first';
      st.lastDay = day();
      if (A && B && A.id !== B.id) {
        Soc.addFriend(A.id, B.id, 5, 5, '축제 미스터리');
        Soc.addFriend(B.id, A.id, 5, 5, '축제 미스터리');
      }
      Sim.log('friend', '🎬 ' + data.title + ' — ' + selected, actors.map(v => v.id), 3, { newsKind: 'drama' });
      if (ep === 4) { st.ending = choice === 'second' ? 'gentle' : 'open'; }
    };
    return c;
  }
  MD.progress = () => ({ completed: state().completed.slice(), total: FM.MAIN_STORY.length, next: FM.MAIN_STORY.findIndex((d, i) => !state().completed.includes(d.id) && unlocks[i]()) });
  MD.ready = () => {
    const next = MD.progress().next;
    return next >= 0 && next < FM.MAIN_STORY.length && state().lastDay !== day();
  };
  MD.start = (ep, choice) => {
    const c = episode(ep, choice || 'first');
    if (c) Cut.enqueue(c, true);
    return !!c;
  };

  const oldTalk = Soc.playerTalk;
  if (oldTalk) Soc.playerTalk = function(v) {
    const r = oldTalk.apply(this, arguments);
    try {
      if (r && r.options && v && (v.castId === 'c07' || v.id === (byCast('c07') || {}).id) && MD.ready() && !r.options.some(o => o.id === 'mainDramaStart')) {
        const p = MD.progress();
        const d = FM.MAIN_STORY[p.next];
        r.options.unshift({ id: 'mainDramaStart', label: '🎬 ' + d.title });
        r.text = '…예전 축제 기록에서 이상한 걸 찾았어. 이번엔 네가 같이 봐 줬으면 해.';
      }
    } catch (e) { console.error('main drama talk', e); }
    return r;
  };
  const oldChoose = Soc.playerChoose;
  if (oldChoose) Soc.playerChoose = function(v, id, arg) {
    if (id === 'mainDramaStart') {
      const ep = MD.progress().next;
      if (ep < 0 || ep >= FM.MAIN_STORY.length) return { text: '지금은 새로 확인할 단서가 없어.', close: true, options: [] };
      return { text: question(ep), options: [
        { id: 'mainDramaPlay', label: titleChoices(ep)[0], arg: 'first' },
        { id: 'mainDramaPlay', label: titleChoices(ep)[1], arg: 'second' },
      ] };
    }
    if (id === 'mainDramaPlay') {
      const ep = MD.progress().next;
      if (ep >= 0 && ep < FM.MAIN_STORY.length) MD.start(ep, arg);
      return { text: '…좋아. 우리가 고른 방식으로 단서를 따라가 보자.', close: true, options: [] };
    }
    return oldChoose ? oldChoose.apply(this, arguments) : null;
  };
})();
