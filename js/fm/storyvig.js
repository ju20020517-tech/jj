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
  const STORY = {}; for (const r of FM.STORY) STORY[r[0]] = { place: r[1], item: r[2], dream: r[3], worry: r[4], crisis: r[5], lines: r[6], meta: (FM.STORY_META || {})[r[0]] || null };
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
    const title = `${d.meta ? d.meta.title : v.name + ' 이야기'} · ${TITLES[n]}`;
    let beats;
    const sceneLine = (line, shot='close') => ({ say: 'A', text: sty(v, line), shot });
    const memoryLine = past && past.memory ? past.memory : `그때 나는 ${d.worry}라는 걸 아무에게도 말하지 못했어.`;
    if (n === 0) beats = [
      { filter: 'sepia' },
      { narr: `(해 질 무렵. ${d.place}에 바람이 스친다. ${d.item} 하나가 바닥에 떨어지고, ${v.name}은 그것을 주우려다 잠시 멈춘다.)`, who:'해설', icon:'🎞️', shot:['wide'] },
      { show:'A' }, { move:['A',0.6,0.2], t:1100 }, { fx:'glow', at:'A' },
      sceneLine(L[0], 'close'),
      { narr:`(${v.name}은 웃어 보이지만 손끝은 작게 떨린다. 말하지 않은 문장이 목 끝에 걸려 있다.)`, who:'해설', icon:'🌬️' },
      { pose:'A', p:'look', t:900 }, { show:'B' }, { move:['B',1.1,-0.2], t:1000 },
      { say:'B', text: `무슨 일인지 전부 말하지 않아도 돼. 다만 네가 혼자서 해결해야 하는 일이라고 정해 두진 마.`, shot:'close' },
      { filter:'' },
      { say:'A', text: sty(v, `사실은… ${d.dream}이(가) 내 꿈이야. 그런데 입 밖으로 꺼내는 순간, 실패하면 어떡하지 싶어서 겁이 나.`) },
      { say:'B', text:'꿈을 말한다고 당장 잘해야 하는 건 아니잖아. 오늘은 첫 장면만 같이 시작하자.' },
      { narr:'(잠깐의 침묵. 멀리서 파도와 섬의 생활 소음이 다시 들려온다.)', who:'해설', icon:'🌊', shot:['wide'] },
      { poses:[['A','look'],['B','look']], t:1100 },
      { say:'A', text:sty(v,'…이상하다. 해결된 건 하나도 없는데, 아까보단 덜 무서워.') },
      { fx:'sparkle', at:'A' }, { outcome:'happy', endText:[title,`첫 장면이 시작됐다 — ${d.dream}`] }
    ];
    else if (n === 1) beats = [
      { filter:'thriller' }, { narr:`(한밤중. 불이 꺼진 ${d.place}. ${v.name}은 ${d.item}을 앞에 두고 한참 움직이지 않는다.)`, who:'해설', icon:'🌒', shot:['wide'] },
      { show:'A' }, { pose:'A',p:'sadSit',t:1500 }, sceneLine(L[1]),
      { narr:'(시선은 마주치지 않는다. 말보다 먼저 긴 침묵이 자리를 채운다.)',who:'해설',icon:'…' },
      { say:'B',text:'괜찮다는 말은 안 해도 돼. 지금 괜찮지 않다는 것부터 말해도 돼.' },
      { say:'A',text:sty(v,`다들 내가 ${d.dream}만 바라보고 사는 줄 알아. 그런데 사실은 ${d.worry}. 내가 원하는 걸 좋아하는 건지, 실패한 내가 싫은 건지 나도 모르겠어.`),shot:'close' },
      { emo:'A',e:'😢' }, { pose:'B',p:'sit',t:1300 },
      { say:'B',text:'내가 답을 대신 정해 주진 않을게. 대신 네가 네 편이 되어야 하는 순간에, 네가 혼자가 아니라는 건 기억해 줘.' },
      { say:'A',text:sty(v,`그 말이 제일 무서워. 누군가 내 편이 되어 주면, 나도 나를 믿어야 할 것 같잖아.`) },
      { narr:'(카메라는 두 사람을 멀리서 바라본다. 아무도 서두르지 않는다.)',who:'해설',icon:'🎬',shot:['wide'] },
      { say:'A',text:sty(v,'오늘은 강한 척 안 해도 되지? 그냥 조금만 여기 있어 줘.') },
      { say:'B',text:'응. 오늘은 해결하지 말고, 여기 있자.' },
      { pose:'A',p:'wipeTear',t:1400 },{filter:''},{fx:'glow'},
      { outcome:'happy',endText:[title,'답을 찾기 전, 마음을 숨기지 않기로 했다.'] }
    ];
    else if (n === 2) beats = [
      { filter:'sepia' }, { narr:`(오래된 기억. ${d.item}의 표면에 남은 흠집을 손가락이 따라간다. 현재의 소리가 멀어지고 과거의 장면이 겹친다.)`,who:'해설',icon:'🕰️',shot:['wide'] },
      { show:'A' }, { pose:'A',p:'look',t:1200 }, sceneLine(L[2]),
      { narr:`(회상의 색이 조금씩 바랜다. 기억 속에서 끝내 하지 못했던 말이 현재의 얼굴 위로 겹쳐진다: “${memoryLine}”)`,who:'해설',icon:'📼' },
      ...(cast.C ? [
        { filter:'thriller' },{show:'C'},{move:['C',1.4,0.4],t:1200},
        { say:'C',text:sty(cast.C,`${v.name}… 그때 이후로 네가 이 이야기를 꺼내지 않을 줄 알았어.`),shot:'close' },
        { emo:'A',e:'😳' },{ say:'A',text:sty(v,`나도 그랬어. 다시 만나면 화부터 날 줄 알았는데… 막상 네 얼굴을 보니까, 내가 얼마나 오래 그날에 멈춰 있었는지 알겠어.`) },
        { say:'C',text:sty(cast.C,past.kind==='원수'?'변명부터 하고 싶진 않아. 내가 한 일은 내가 책임질게.':past.kind==='전 연인'?'그때의 마음이 거짓이었다고 생각하진 않아. 다만 우린 서로를 잘 몰랐어.':'미안하다는 말 하나로 예전으로 돌아갈 수 없다는 거 알아. 그래도 이번엔 도망치지 않을게.') },
        { say:'A',text:sty(v,'예전으로 돌아가자는 게 아니야. 그때의 나를 이제 그만 놓아주고 싶은 거야.') },
        { poses:[['A','look'],['C','look']],t:1400 }
      ] : [
        { say:'A',text:sty(v,`그때의 나는 ${d.worry} 때문에 아무 말도 못 했어. 지금 생각하면, 침묵도 하나의 선택이었더라.`) },
        { say:'B',text:'과거를 바꿀 순 없어도, 그 일을 어떻게 기억할지는 지금 정할 수 있어.' }
      ]),
      { filter:'' },{show:'B'},{move:['B',0.9,0.1],t:900},
      { say:'B',text:'오늘 네가 꺼낸 이야기는 여기서 끝나지 않아. 다음에 또 말하고 싶어지면, 그때도 들어 줄게.' },
      { fx:'glow' },{narr:'(카메라는 오래된 물건에서 천천히 물러난다. 기억은 그대로지만, 그 기억을 바라보는 사람의 표정은 달라졌다.)',who:'해설',icon:'🌅',shot:['wide']},
      { outcome:'happy',endText:[title,cast.C?`${v.name}와(과) ${cast.C.name}, 멈춰 있던 시간의 다음 장`:'과거를 지우지 않고도 앞으로 걸을 수 있다.'] }
    ];
    else if (n === 3) beats = [
      { filter:'thriller' },{narr:`(갑작스러운 소란. ${d.crisis}. 손에 들려 있던 ${d.item}이 바닥에 떨어진다. 주변의 소리가 먹먹해진다.)`,who:'해설',icon:'⚡',shot:['wide']},
      {fx:'shock'},{show:'A'},{move:['A',0.5,0.2],t:700},{pose:'A',p:'cry',t:1200},
      sceneLine(L[3]),{emo:'A',e:'😰'},
      { say:'A',text:sty(v,`이걸 망치면 끝이야. 모두가 내가 할 수 있다고 믿어 줬는데, 나만 내가 못 할 거라는 걸 알고 있었나 봐.`),hot:true },
      { narr:'(주변 소리가 사라진다. 카메라는 바닥의 물건, 굳은 손, 흔들리는 눈동자를 차례로 비춘다.)',who:'해설',icon:'🔇',shot:['wide']},
      { say:'B',text:'나를 봐. 지금 당장 괜찮아질 필요 없어. 하지만 도망칠지, 도움을 청할지, 다시 시작할지는 네가 고를 수 있어.' },
      { filter:'' },
      ...(choice==='solo' ? [
        { say:'A',text:sty(v,'내가 직접 해 볼게. 누가 대신해 주길 기다리는 동안, 내 마음까지 다른 사람에게 맡기고 있었어.') },
        { say:'B',text:'좋아. 내가 대신하진 않을게. 대신 네가 손을 내밀면 바로 잡을 수 있는 곳에 있을게.' },
        { pose:'A',p:'flex',t:1300 },{fx:'glow',at:'A'},
        { say:'A',text:sty(v,'무서워도 시작할 수 있네. 자신감이 생겨서가 아니라, 무서운 채로 한 걸음 내딛는 거구나.') }
      ] : [
        { say:'A',text:sty(v,'나 혼자선 안 될 것 같아. 그 말을 하는 게 이렇게 어려운 줄 몰랐어.') },
        { say:'B',text:'그럼 같이 하자. 내가 모든 걸 해결해 주는 게 아니라, 네가 다시 설 수 있게 옆에서 받쳐 줄게.' },
        { poses:[['A','hammer'],['B','hammer']],t:1700 },
        { say:'A',text:sty(v,'나중에 이 순간을 기억하면, 실패한 날이 아니라 도움을 청한 날이라고 기억할래.') }
      ]),
      { narr:'(작은 성공 하나. 거창한 음악 대신, 숨을 고르는 소리만 남는다.)',who:'해설',icon:'🎞️',shot:['wide']},
      { poses:[['A','look'],['B','look']],t:1300 },{fx:'sparkle',at:'A'},
      { outcome:'happy',endText:[title,choice==='solo'?'스스로 선택해 다시 선 날':'도움을 청하는 용기를 배운 날'] }
    ];
    else beats = [
      { filter:'sepia' },{narr:`(아침. ${d.place}에 첫 햇살이 들어온다. 어제와 같은 장소지만, 오늘은 누군가가 먼저 문을 열어 둔다.)`,who:'해설',icon:'🌅',shot:['wide']},
      { narr:`(준비하는 손, 기다리는 사람들, 작은 실수와 다시 시작하는 순간들이 짧은 몽타주처럼 이어진다. 꿈은 한 번의 기적이 아니라 수많은 선택으로 완성된다.)`,who:'해설',icon:'🎞️'},
      { filter:'' },{fx:'fireworks'},{show:'A'},{pose:'A',p:'cheer',t:1300},
      sceneLine(L[4]),{say:'A',text:sty(v,`예전에는 ${d.dream}이라는 말을 하는 것만으로도 충분하다고 생각했어. 이제는 알아. 꿈은 누가 박수쳐 줘서 내 것이 되는 게 아니라, 내가 포기하지 않고 살아낸 시간이라서 내 것이 되는 거야.`),hot:true,shot:'close'},
      { say:'B',text:'오늘 네가 이뤄 낸 건 결과만이 아니야. 무서워도 다시 해 본 너 자신이야.' },
      { say:'A',text:sty(v,(S().story[v.id]||{}).route==='solo'?'네가 나 대신 해 주지 않아서 고마워. 내 힘으로 해냈다는 걸 이제 믿을 수 있어.':'내가 무너졌을 때 옆에 있어 줘서 고마워. 이 순간을 혼자 차지하고 싶지 않아. 우리 함께 기억하자.') },
      { narr:'(박수가 잦아든 뒤에도 두 사람은 바로 움직이지 않는다. 기쁜 순간을 서둘러 끝내고 싶지 않아서다.)',who:'해설',icon:'✨',shot:['wide']},
      { poses:[['A','hug'],['B','hug']],t:1600 },{fx:'hearts',at:'A'},
      { split:['A','B'],caps:[`🌟 ${v.name}`,'🤝 함께한 시간'],t:2000 },
      { narr:'(화면이 천천히 어두워진다. 마지막에 남는 것은 성공의 장면이 아니라, 그곳까지 걸어온 사람의 얼굴이다.)',who:'해설',icon:'🎬'},
      { outcome:'happy',endText:[`${v.name} 이야기 완결 「${TITLES[4]}」`,`${d.dream} — 마침내, 자기 자신의 이름으로.`] }
    ];
    const c = Object.assign({ theme: n === 3 ? 'fight' : n === 2 ? 'reunion' : n === 4 ? 'party' : 'friend', cast, beats, key: keyOf(cast) + '|story' + n, vig: true, sub: `${v.name} 이야기 ${n + 1}화`, force: true },
      { venue: n === 1 ? { loc: 'island', x: -72, z: -86, place: 'cliff' } : venueOf(d.place) });
    if (d.meta) {
      // 연출 메모는 컷신 데이터에 함께 보관하고, 화면에는 장면 자체만 보여 준다.
      c.directorNotes = { opening: d.meta.opening, palette: d.meta.palette, sound: d.meta.sound };
      beats.unshift({ shot: ['wide'] });
    }
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
