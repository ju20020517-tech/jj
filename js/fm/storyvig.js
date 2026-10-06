/* =========================================================
 *  📖 주민별 스토리 드라마 (40명 × 5화 = 200편) + 주민 간 과거 인연
 *   · 플레이어와 친해질수록 한 화씩 열림 (호감 12 · 25 · 40 · 55 · 70)
 *   · 말을 걸면 "너한테만 할 얘기가 있어" → 플레이어가 함께하는 드라마로 재생
 *      1화 부탁 · 2화 숨겨진 고민 · 3화 과거의 그림자(과거 인연 주민 등장) · 4화 위기(플레이어 선택) · 5화 꿈을 이루다
 *   · 4화 선택: 함께 해결하기(호감↑) / 혼자 해 보라고 응원(성장↑) — 5화 대사가 달라짐
 *   · 과거 인연: 게임 시작(또는 불러오기) 때 관계에 반영, 대화 화제 · 프로필에 표시
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, Cut = FM.Cut, W = FM.Will, MAP = FM.MAP;
  if (!Sim || !Soc || !Cut || !FM.STORY) return;
  const P = 'P';
  const S = () => Sim.get();
  const pl = () => S().player;
  const day = () => Sim.time.day();
  const pick = a => a[(Math.random() * a.length) | 0];
  const J = t => (FM.josa ? FM.josa(t) : t);
  const sty = (v, t) => (v && v.id !== P && W && W.sty ? W.sty(v, J(t)) : J(t));
  const toast = t => FM.bus.emit('toast', J(t));
  const byCast = id => S().villagers.find(v => v.castId === id || v.id === id);
  const ST = (FM.StoryVig = {});
  const STORY = {}; for (const r of FM.STORY) STORY[r[0]] = { place: r[1], item: r[2], dream: r[3], worry: r[4], crisis: r[5], lines: r[6] };
  const NEED = [12, 25, 40, 55, 70];
  const TITLES = ['부탁', '숨겨진 고민', '과거의 그림자', '위기', '꿈을 이루다'];

  // ---------------------------------------------------------
  // 과거 인연
  // ---------------------------------------------------------
  const pastsOf = v => (FM.PASTS || []).filter(p => p[0] === v.castId || p[1] === v.castId).map(p => {
    const mine = p[0] === v.castId;
    return { other: byCast(mine ? p[1] : p[0]), kind: p[2], memory: mine ? p[3] : p[4], fp: p[5], rom: p[6] };
  }).filter(x => x.other);
  ST.pastsOf = pastsOf;
  function applyPasts() {
    const st = S(); if (!st || st.pastsApplied) return;
    for (const p of FM.PASTS || []) {
      const a = byCast(p[0]), b = byCast(p[1]); if (!a || !b) continue;
      for (const [x, y] of [[a, b], [b, a]]) {
        const r = Soc.rel(x.id, y.id);
        r.friendship_point = Math.max(r.friendship_point || 0, p[5]); r.past = p[2];
        if (p[6] && Soc.canRomance && Soc.canRomance(x.id, y.id)) { const f = Soc.F(x.id, y.id); f.romance = Math.max(f.romance || 0, p[6]); }
        if (p[2] === '원수' || p[2] === '라이벌') r.bond = r.bond || (p[2] === '원수' ? 'NEMESIS' : 'RIVAL');
      }
    }
    st.pastsApplied = true;
  }
  const pastTimer = setInterval(() => { try { const st = S(); if (st && st.villagers && st.villagers.length) { applyPasts(); } } catch (e) { console.error('pasts', e); } }, 2000);
  void pastTimer;
  if (Sim.load) { const oL = Sim.load; Sim.load = function () { const r = oL.apply(this, arguments); setTimeout(() => { try { applyPasts(); } catch (e) { /* */ } }, 1500); return r; }; }
  // 대화 화제: 과거 인연 얘기
  if (W && W.I && FM.Speech) {
    W.I.pastTalk = {
      w: v => (pastsOf(v).length ? 1.2 : 0),
      say: v => { const p = pick(pastsOf(v)); return { text: FM.Speech.apply(v, J(`${p.other.name} 얘기 들었어? …(${p.kind}) ${p.memory}`)), choices: [{ k: 'ask', label: '❓ "둘이 그런 사이였어?"' }, { k: 'deep', label: '🫶 "그런 추억이 있었구나"' }, { k: 'tease', label: '😏 "에이~ 아직 신경 쓰이는구나?"' }] }; },
      on: (v, k) => ({ text: FM.Speech.apply(v, J({ ask: '응… 언젠가 자세히 얘기해 줄게.', deep: '…응. 지금 생각하면 다 소중한 기억이야.', tease: '뭐, 뭐래! 하나도 안 신경 쓰이거든!' }[k] || '헤헤.')) }),
    };
  }

  // ---------------------------------------------------------
  // 스토리 드라마
  // ---------------------------------------------------------
  const keyOf = cast => Object.values(cast).map(v => v.id).sort().join('|');
  const venueOf = id => { const p0 = MAP.P[id]; if (!p0) return { loc: 'island', x: 3, z: 19, place: 'plaza' }; if (p0.interior && FM.INTERIORS[p0.interior]) return { loc: p0.interior }; return { loc: 'island', x: p0.x, z: p0.z + 3, place: id }; };
  function episode(v, n, choice) {
    const d = STORY[v.castId]; if (!d) return null;
    const p = pl(), L = d.lines;
    const past = pastsOf(v)[0];
    const cast = { A: v, B: p };
    if (n === 2 && past && past.other && !past.other.sceneId) cast.C = past.other;
    const title = `${v.name} 이야기 ${n + 1}화 「${TITLES[n]}」`;
    let beats;
    if (n === 0) beats = [
      { narr: `(${v.name}이(가) ${d.item}을(를) 들고 다가왔다)`, who: '해설', icon: '📖', shot: ['wide'] },
      { say: 'A', text: sty(v, L[0]), shot: 'close' }, { pose: 'B', p: 'look', t: 900 },
      { narr: `(${p.name}은(는) 고개를 끄덕였다. 둘이 함께하니 금방 해결됐다)`, who: '해설', icon: '🤝' },
      { poses: [['A', 'cheer'], ['B', 'cheer']], t: 1200 }, { say: 'A', text: sty(v, `고마워! 사실 내 꿈은 ${d.dream}이야. …처음 말해 보는 거야.`) },
      { fx: 'sparkle', at: 'A' }, { outcome: 'happy', endText: [title, `${v.name}의 꿈: ${d.dream}`] }];
    else if (n === 1) beats = [
      { narr: `(평소와 다르게 ${v.name}의 표정이 어둡다)`, who: '해설', icon: '🌧️', shot: ['wide'] },
      { pose: 'A', p: 'sadSit', t: 1300 }, { say: 'A', text: sty(v, L[1]), shot: 'close' }, { emo: 'A', e: '😢' },
      { narr: `(${p.name}은(는) 말없이 옆에 앉아 이야기를 들어 주었다)`, who: '해설', icon: '🫂' },
      { pose: 'B', p: 'sit', t: 1100 }, { say: 'A', text: sty(v, `…${d.worry}. 이 얘기, 너한테만 하는 거야.`) },
      { pose: 'A', p: 'wipeTear', t: 1200 }, { say: 'A', text: sty(v, '들어 줘서 고마워. 조금 가벼워졌어.') },
      { outcome: 'happy', endText: [title, '털어놓는 것만으로도'] }];
    else if (n === 2) beats = [
      { filter: 'sepia' }, { narr: `(${v.name}이(가) ${d.item}을(를) 꼭 쥐고 옛날 이야기를 꺼냈다)`, who: '해설', icon: '🕰️', shot: ['wide'] },
      { say: 'A', text: sty(v, L[2]), shot: 'close' },
      ...(cast.C ? [{ show: 'C' }, { move: ['C', 1.4, 0.4], t: 1100 }, { filter: '' }, { say: 'C', text: sty(cast.C, past.kind === '원수' || past.kind === '라이벌' ? `…${v.name}. 여기서 또 보네.` : `${v.name}? …오랜만이다.`) },
        { emo: 'A', e: '😳' }, { say: 'A', text: sty(v, `(${past.kind}) ${past.memory}`) },
        { say: 'C', text: sty(cast.C, past.kind === '원수' ? '…그 일은, 나도 미안했어.' : past.kind === '전 연인' ? '…잘 지내는 것 같아서 다행이야.' : '그때 생각나네. 우리 참 어렸지.') },
        { poses: [['A', 'look'], ['C', 'look']], t: 1200 }] : [{ filter: '' }, { say: 'A', text: sty(v, '…이 얘기를 한 건 네가 처음이야.') }]),
      { fx: 'glow' }, { outcome: 'happy', endText: [title, cast.C ? `${v.name}와(과) ${cast.C.name}의 지난 이야기` : '과거와 마주한 날'] }];
    else if (n === 3) beats = [
      { filter: 'thriller' }, { narr: `(큰일이다! ${d.crisis}!)`, who: '해설', icon: '⚡', shot: ['wide'] }, { fx: 'shock' },
      { pose: 'A', p: 'cry', t: 1200 }, { say: 'A', text: sty(v, L[3]), hot: true, shot: 'close' },
      { filter: '' }, ...(choice === 'solo' ? [
        { say: 'B', text: J(`${v.name}, 넌 할 수 있어. 내가 옆에서 지켜볼게. 네 힘으로 해 봐!`) }, { emo: 'A', e: '😤' },
        { pose: 'A', p: 'flex', t: 1300 }, { say: 'A', text: sty(v, '…그래. 내가 해 볼게! 끝까지!') }] : [
        { say: 'B', text: J('같이 하자! 혼자 끙끙대지 마!') }, { emo: 'A', e: '🥹' },
        { poses: [['A', 'hammer'], ['B', 'hammer']], t: 1600 }, { say: 'A', text: sty(v, '…너 없었으면 진짜 포기했을 거야.') }]),
      { fx: 'sparkle', at: 'A' }, { outcome: 'happy', endText: [title, choice === 'solo' ? '스스로 일어선 날' : '함께라서 버틴 날'] }];
    else beats = [
      { narr: `(드디어 그날이 왔다. ${v.name}의 꿈 — ${d.dream})`, who: '해설', icon: '🌟', shot: ['wide'] },
      { fx: 'fireworks' }, { pose: 'A', p: 'cheer', t: 1300 }, { say: 'A', text: sty(v, L[4]), hot: true, shot: 'close' },
      { say: 'A', text: sty(v, (S().story[v.id] || {}).route === 'solo' ? '네가 믿어 줘서 혼자 일어설 수 있었어. 고마워.' : '힘들 때마다 네가 옆에 있었잖아. 이건 우리 둘의 꿈이야.') },
      { poses: [['A', 'hug'], ['B', 'hug']], t: 1700 }, { fx: 'hearts', at: 'A' },
      { split: ['A', 'B'], caps: [`🌟 ${v.name}`, '🤝 나'], t: 2000 },
      { outcome: 'happy', endText: [`${v.name} 이야기 완결 「${TITLES[4]}」`, `${d.dream} — 이루었다!`] }];
    const c = Object.assign({ theme: n === 3 ? 'fight' : n === 2 ? 'reunion' : n === 4 ? 'party' : 'friend', cast, beats, key: keyOf(cast) + '|story' + n, vig: true, sub: `${v.name} 이야기 ${n + 1}화`, force: true },
      { venue: n === 1 ? { loc: 'island', x: -72, z: -86, place: 'cliff' } : venueOf(d.place) });
    c.resolve = () => {
      const s = S().story[v.id] || (S().story[v.id] = {});
      s.ep = n + 1; s.day = day();
      Soc.addFriend(v.id, P, n === 4 ? 12 : 6, n === 4 ? 12 : 6, '스토리');
      if (W && W.remember) W.remember(v, 'story', `${pl().name}와(과) 함께한 ${TITLES[n]}`, { about: P });
      if (n === 2 && cast.C) { Soc.addFriend(v.id, cast.C.id, 8, 6, '과거와 화해'); Soc.addFriend(cast.C.id, v.id, 8, 6, '과거와 화해'); }
      if (n === 4) { pl().coins += 1000; toast(`🌟 ${v.name}의 이야기를 끝까지 함께했어요! (🪙 +1000)`); FM.Diary && FM.Diary.bump && FM.Diary.bump('storyDone'); }
      FM.Diary && FM.Diary.bump && FM.Diary.bump('storyEps');
      Sim.log('friend', `📖 ${v.name} 이야기 ${n + 1}화 「${TITLES[n]}」 — ${pl().name}와(과) 함께`, [v.id], 2, { newsKind: 'drama' });
    };
    return c;
  }
  ST.episode = episode;
  const nextEp = v => { const st = S(); st.story = st.story || {}; const s = st.story[v.id] || {}; return s.ep || 0; };
  const ready = v => {
    if (!v || v.child || !STORY[v.castId]) return false;
    const n = nextEp(v); if (n >= 5) return false;
    const s = (S().story || {})[v.id] || {};
    if (s.day === day()) return false;
    return (Soc.rel(v.id, P).friendship_point || 0) >= NEED[n];
  };
  ST.ready = ready;

  // 말을 걸면: 너한테만 할 얘기가 있어
  const oTalk = Soc.playerTalk;
  Soc.playerTalk = function (v) {
    const r = oTalk.apply(this, arguments);
    try {
      if (r && r.options && ready(v) && !r.options.some(o => o.id === 'storyGo')) {
        const n = nextEp(v);
        r.text = `${sty(v, pick(['…있잖아, 너한테만 할 얘기가 있어.', '잠깐 시간 돼? 꼭 같이 가 줬으면 하는 데가 있어.', '…들어 줄래? 아무한테도 안 한 얘기야.']))}`;
        r.options.unshift({ id: 'storyGo', label: `📖 ${v.name} 이야기 ${n + 1}화 「${TITLES[n]}」 보기` });
      }
    } catch (e) { console.error('story talk', e); }
    return r;
  };
  const oChoose = Soc.playerChoose;
  Soc.playerChoose = function (v, id, arg) {
    if (id === 'storyGo' && v) {
      const n = nextEp(v);
      if (n === 3) return { text: sty(v, `${STORY[v.castId].crisis}… 어떡하지? 나 어떻게 해야 할까?`), options: [{ id: 'storyGo4', label: '🤝 "내가 같이 할게!"', arg: 'together' }, { id: 'storyGo4', label: '💪 "넌 혼자서도 할 수 있어!"', arg: 'solo' }] };
      const c = episode(v, n); if (c) Cut.enqueue(c, true);
      return { text: sty(v, '고마워. …가자!'), close: true, options: [] };
    }
    if (id === 'storyGo4' && v) {
      const st = S(); st.story = st.story || {}; (st.story[v.id] = st.story[v.id] || {}).route = arg;
      const c = episode(v, 3, arg); if (c) Cut.enqueue(c, true);
      return { text: sty(v, arg === 'solo' ? '…응. 해 볼게!' : '…응! 같이 가자!'), close: true, options: [] };
    }
    return oChoose.apply(this, arguments);
  };

  // 업적
  if (FM.Diary && FM.Diary.ACH) {
    const sv = k => ((S() && S().stats) || {})[k] || 0;
    FM.Diary.ACH.push(['story1', '📖 첫 이야기', '주민 스토리 1화 보기', () => sv('storyEps') >= 1, 200], ['story10', '📚 이야기 수집가', '주민 스토리 10화 보기', () => sv('storyEps') >= 10, 800],
      ['storyDone', '🌟 끝까지 함께', '주민 한 명의 이야기 완결', () => sv('storyDone') >= 1, 1500], ['storyDone5', '🏝️ 섬의 이야기꾼', '주민 5명 이야기 완결', () => sv('storyDone') >= 5, 4000]);
  }
  // 프로필용
  ST.progress = v => ({ ep: nextEp(v), total: 5, story: STORY[v.castId] || null, pasts: pastsOf(v) });

  // 신의 툴: 아무 주민의 다음 화 바로 보기
  if (FM.Vig) {
    FM.Vig.KINDS.story_next = '📖 주민 스토리 다음 화 (아무나)';
    const origRun = FM.Vig.run;
    FM.Vig.run = function (kind) {
      if (kind === 'story_next') { const v = S().villagers.find(x => STORY[x.castId] && nextEp(x) < 5); if (v) { const c = episode(v, nextEp(v), 'together'); c.resolve = null; Cut.enqueue(c, true); } return; }
      return origRun(kind);
    };
  }
})();
