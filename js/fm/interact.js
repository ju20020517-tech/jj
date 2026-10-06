/* =========================================================
 *  🤝 주민 상호작용 정리 — 선택지 반응 · 평판 · 바람 · 플레이어 드라마
 *   1) 대화 선택지 반응: 주민 성격 · 기분 · 대화 분위기와 안 맞는 대답을 고르면 호감도가 깎임
 *      (예: 우울한 얘기에 "에이~ 설마" → 💔 / 예민한 주민 놀리기 → 💢)  잘 맞으면 살짝 오름
 *   2) 평판 (0~100, 처음 50)
 *      · 오름: 칭찬 · 선물 · 부탁 들어주기 · 중재 · 소문 진실 확인
 *      · 내림: 바람(들키면 크게) · 소문 퍼뜨리기 과다 · 헛소문 퍼뜨림 · 험담 · 무례한 대답
 *      · 등급: 🌟 섬의 인기인(75↑) · 🙂 평범한 주민 · 🤨 수상한 사람(40↓) · 🚫 섬의 문제아(20↓)
 *      · 효과: 호감 오르는 속도 ×1.25 ~ ×0.4, 평판 나쁘면 차갑게 인사하거나 대화를 거절
 *   3) 바람: 연인 · 배우자가 있는데 다른 주민에게 플러팅 · 데이트 · 고백 → 근처에 본 사람이 있으면 들통
 *   4) 플레이어 드라마: 첫 선물 · 플레이어와 절친 · 바람 들통 · 공개 비난 · 인기인 팬미팅 · 화해 사과
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, W = FM.Will, Cut = FM.Cut;
  if (!Sim || !Soc) return;
  const P = 'P';
  const S = () => Sim.get();
  const pl = () => S().player;
  const day = () => Sim.time.day();
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const J = t => (FM.josa ? FM.josa(t) : t);
  const sty = (v, t) => (v && v.id !== P && W && W.sty ? W.sty(v, J(t)) : J(t));
  const toast = t => FM.bus.emit('toast', J(t));
  const has = (v, k) => Sim.has(v, k);
  const IA = (FM.Interact = {});

  // =========================================================
  // 2) 평판
  // =========================================================
  const TIERS = [[75, '🌟 섬의 인기인', 1.25], [40, '🙂 평범한 주민', 1], [20, '🤨 수상한 사람', 0.7], [0, '🚫 섬의 문제아', 0.4]];
  const rep = () => { const p = pl(); if (p.rep == null) p.rep = 50; return p.rep; };
  const tierOf = r => TIERS.find(t => r >= t[0]) || TIERS[TIERS.length - 1];
  IA.rep = rep; IA.tier = () => tierOf(rep());
  function addRep(n, why) {
    const p = pl(); if (!p) return;
    const st = S(); const lg = st.repLog || (st.repLog = {});
    // 좋은 일로 오르는 평판은 하루 +8까지
    if (n > 0) { const k = 'd' + day(); lg[k] = (lg[k] || 0); if (lg[k] >= 8) return; n = Math.min(n, 8 - lg[k]); lg[k] += n; }
    const before = tierOf(rep());
    p.rep = clamp(rep() + n, 0, 100);
    const after = tierOf(p.rep);
    if (n <= -3) toast(`📉 평판 ${n} — ${why} (지금: ${after[1]} ${Math.round(p.rep)})`);
    if (before !== after) {
      toast(after[0] > before[0] ? `📈 평판이 올랐어요! 이제 섬에서 "${after[1]}"(으)로 불려요` : `📉 평판이 떨어졌어요… 주민들이 당신을 "${after[1]}"(이)라고 수군거려요`);
      FM.bus.emit('repTier', { from: before, to: after });
    }
  }
  IA.addRep = addRep;
  // 호감 오르는 속도에 평판 반영 (플레이어 대상 · 올라갈 때만)
  Soc.repMul = dfp => (dfp > 0 ? dfp * tierOf(rep())[2] : dfp);

  // =========================================================
  // 1) 선택지 반응
  // =========================================================
  const SAD = /우울|힘들|슬퍼|슬프|외로|아파|아프|속상|눈물|울었|울고|무서|걱정|불안|헤어졌|차였|망했|죽겠|지쳐|피곤|고민|미안/;
  const RUDE = /😒|🙄|😤|😈|무시|관심 ?없|별로|시끄|그만|귀찮|됐어|몰라|흥\b|저리|싫어|지루|노잼|어쩌라고|딴 ?얘기/;
  const TEASE = /😏|에이~|설마|장난|놀리|ㅋㅋ|웃기네/;
  const DEEP = /🫶|알 것 같아|이해해|힘내|괜찮아|토닥|위로/;
  const SENS = v => has(v, 'ANXIOUS') || has(v, 'SHY') || has(v, 'CRANKY') || has(v, 'SNOB') || has(v, 'TSUNDERE') || has(v, 'DREAMY');
  const FUNNY = v => has(v, 'PRANKSTER') || has(v, 'EXTROVERT') || has(v, 'CUTE') || has(v, 'BUSYBODY');
  const REACT_BAD = {
    sadTease: ['…지금 그게 웃겨? 나 진짜 힘들다고 했잖아.', '…됐어. 너한테 말한 내가 바보지.', '(입술을 꽉 깨문다) …상처야.'],
    sensTease: ['…놀리지 마. 나 그런 거 싫어해.', '흥! 그렇게 생각하면 할 수 없지.', '(얼굴이 빨개진다) 너 진짜…!'],
    rude: ['…말을 꼭 그렇게 해야 돼?', '그래, 알았어. 나 간다.', '(표정이 굳는다) …기분 나쁘네.'],
    coldDeep: ['…갑자기 왜 그렇게 진지해? 부담스럽게.', '어, 어… 그 정도까진 아닌데.'],
  };
  function judge(v, label, line) {
    const sadTopic = SAD.test(line || '') || (v.mood || 50) < 35 || (v.stress || 0) > 70;
    if (RUDE.test(label)) return { bad: 'rude', fp: SENS(v) ? -6 : -4, rep: -1, why: '무례한 대답' };
    if (TEASE.test(label) && sadTopic) return { bad: 'sadTease', fp: -6, rep: -1, why: '힘든 얘기에 장난' };
    if (TEASE.test(label) && SENS(v) && !FUNNY(v)) return { bad: 'sensTease', fp: -3, why: '놀리는 걸 싫어함' };
    if (DEEP.test(label) && !sadTopic && (has(v, 'CYNICAL') || has(v, 'LAZY')) && chance(0.5)) return { bad: 'coldDeep', fp: -1, why: '진지한 건 부담' };
    // 잘 맞는 대답
    if (DEEP.test(label) && sadTopic) return { good: true, fp: 3, why: '위로' };
    if (TEASE.test(label) && FUNNY(v) && !sadTopic) return { good: true, fp: 2, why: '장난이 통함' };
    return null;
  }
  const lastLine = new Map(), lastOpts = new Map();
  const oChoose = Soc.playerChoose;
  Soc.playerChoose = function (v, id, arg) {
    let verdict = null;
    try {
      if (v && !v.child && !v.staff && id === 'w' && arg != null) {
        const label = (lastOpts.get(v.id) || {})[arg] || '';
        verdict = judge(v, label, lastLine.get(v.id));
      }
    } catch (e) { verdict = null; }
    const r = oChoose.apply(this, arguments);
    try {
      if (verdict && r) {
        Soc.addFriend(v.id, P, verdict.fp, verdict.bad ? -2 : 1, verdict.why);
        if (verdict.bad) {
          r.text = sty(v, pick(REACT_BAD[verdict.bad]));
          Sim.emote && Sim.emote(v, verdict.bad === 'sadTease' ? '😢' : '💢');
          toast(`💔 ${v.name}의 호감도 ${verdict.fp} (${verdict.why})`);
          if (verdict.rep) addRep(verdict.rep, verdict.why);
          if (W && W.remember) W.remember(v, 'hurt', `${pl().name}이(가) 내 말에 ${verdict.why === '무례한 대답' ? '무례하게' : '장난스럽게'} 대답했어`);
        } else if (chance(0.5)) toast(`💗 ${v.name}의 호감도 +${verdict.fp} (${verdict.why})`);
      }
      if (v && r) { if (r.text) lastLine.set(v.id, r.text); if (r.options) lastOpts.set(v.id, Object.fromEntries(r.options.filter(o => o.id === 'w').map(o => [o.arg, o.label]))); }
      // 평판 올리는 행동
      if (v && !v.child) {
        if (id === 'praise') addRep(1, '칭찬');
        if (id === 'gift' && arg) addRep(1, '선물');
        if (id === 'rumorCheck') addRep(1, '소문의 진실 확인');
        if (id === 'indPick') v._bm = arg === 'badmouth';
        if (id === 'indDo' && arg && v._bm) { v._bm = false; addRep(-4, '험담'); }
        cheatCheck(v, id, arg);
      }
    } catch (e) { console.error('interact', e); }
    return r;
  };
  // 대화 시작 문장도 기억 (첫 질문에 대한 대답 판정용)
  const oTalk = Soc.playerTalk;
  Soc.playerTalk = function (v) {
    // 평판이 나쁘면 차갑게 · 거절
    try {
      const r0 = rep(), fp = Soc.rel(v.id, P).friendship_point || 0;
      if (v && !v.child && !v.staff && r0 < 20 && fp < 45 && chance(0.55) && Soc.partnerOf(v.id) !== P) {
        Sim.emote && Sim.emote(v, '😒');
        return { text: sty(v, pick(['…너랑 할 얘기 없어. 소문 다 들었거든.', '저리 가. 섬 사람들 다 너 피하는 거 알지?', '(못 본 척 고개를 돌린다)', '…또 무슨 소문 퍼뜨리려고?'])), options: [{ id: 'bye', label: '😥 …잘 가' }] };
      }
    } catch (e) { /* */ }
    const r = oTalk.apply(this, arguments);
    try {
      if (r && v) {
        const r0 = rep();
        if (r0 < 40 && !v.child && chance(0.5)) r.text = `${sty(v, pick(['…아, 너구나.', '(경계하는 눈빛) …왜?', '…요즘 너에 대한 소문이 좀 그렇던데.']))} ${r.text}`;
        else if (r0 >= 75 && chance(0.35)) r.text = `${sty(v, pick(['우와, 섬의 인기인이다!', '어머, 마침 너 생각했는데!', '헤헤, 오늘도 반가워!']))} ${r.text}`;
        if (r.text) lastLine.set(v.id, r.text);
        if (r.options) lastOpts.set(v.id, Object.fromEntries(r.options.filter(o => o.id === 'w').map(o => [o.arg, o.label])));
      }
    } catch (e) { /* */ }
    return r;
  };

  // 소문 퍼뜨리기 · 헛소문 → 평판
  FM.bus.on('rumorSpread', n => { if (n > 4) addRep(-2, '소문을 너무 많이 퍼뜨림'); });
  FM.bus.on('rumorFake', () => addRep(-6, '헛소문을 퍼뜨림'));
  if (FM.Rumor && FM.Rumor.tell) {
    const oTell = FM.Rumor.tell;
    FM.Rumor.tell = function () { const r = oTell.apply(this, arguments); try { const st = S(); FM.bus.emit('rumorSpread', (st.rumorSpread || {})[day()] || 0); } catch (e) { /* */ } return r; };
  }

  // =========================================================
  // 3) 바람
  // =========================================================
  const LOVE_IDS = /^(flirt|flirtDo|confessD|dateAt|loveHug|spark)$/;
  const myPartner = () => { const p = pl(); const id = p.spouse || p.lover || Soc.partnerOf(P); return id && id !== P ? Sim.byId(id) : null; };
  IA.myPartner = myPartner;
  function cheatCheck(v, id, arg) {
    if (!LOVE_IDS.test(id)) return;
    const pt = myPartner(); if (!pt || pt.id === v.id) return;
    const st = S(), p = pl();
    st.cheat = st.cheat || { n: 0, last: 0 };
    st.cheat.n++; st.cheat.with = v.id;
    // 목격자: 같은 곳 12m 안의 주민
    const wit = st.villagers.filter(o => o !== v && !o.child && o.loc === p.loc && Math.hypot(o.x - p.x, o.z - p.z) < 12 && !o.sceneId);
    const caughtByPartner = wit.includes(pt);
    const anyWit = wit.length > 0;
    addRep(anyWit ? -8 : -2, anyWit ? '바람 피우는 걸 들킴' : '양다리…');
    if (anyWit) {
      const w0 = caughtByPartner ? pt : pick(wit);
      Sim.log('affair', `💔 ${p.name}이(가) ${pt.name} 몰래 ${v.name}에게 작업을 거는 걸 ${w0.name}이(가) 봤대요…`, [P, v.id, pt.id, w0.id], 3);
      if (FM.Rumor && FM.Rumor.add && !caughtByPartner) { const e = S().log[S().log.length - 1]; e.who = [v.id, pt.id]; }
      if (caughtByPartner || chance(0.5)) setTimeout(() => cheatCaught(pt, v, w0), 2500);
    }
  }
  function cheatCaught(pt, other, witness) {
    const st = S(); if (st.cheat && st.cheat.last === day()) return; st.cheat.last = day();
    Soc.addFriend(pt.id, P, -25, -35, '바람'); if (Soc.addRomance) Soc.addRomance(pt.id, P, -40, '바람');
    Soc.addFriend(pt.id, other.id, -15, -15, '연적');
    if (W && W.remember) W.remember(pt, 'betray', `${pl().name}이(가) ${other.name}와(과) 바람을 피웠어`, { about: P });
    if (Cut && Cut.enqueue) Cut.enqueue(pvCheat(pt, other, witness), true);
  }

  // =========================================================
  // 4) 플레이어 드라마
  // =========================================================
  const keyOf = cast => Object.values(cast).map(v => v.id).sort().join('|');
  const mk = (theme, cast, beats, o = {}) => Object.assign({ theme, cast, beats, key: keyOf(cast) + '|' + (o.sub || ''), vig: true }, o);
  const ME = () => pl();
  function pvCheat(pt, other, witness) {
    const p = ME();
    const cast = { A: pt, B: p, C: other };
    const beats = [
      { filter: 'thriller' }, { narr: `(${witness && witness !== pt ? `${witness.name}의 제보를 받고 달려온` : '모든 걸 목격한'} ${pt.name}…)`, who: '해설', icon: '⚡', shot: ['wide'] },
      { show: 'A' }, { move: ['A', 0, 0.9], run: true, t: 1100 }, { fx: 'shock' },
      { say: 'A', text: sty(pt, `${p.name}…! 지금 뭐 하는 거야? ${other.name}(이)랑?!`), hot: true, shot: 'close' },
      { pose: 'C', p: 'surprise', t: 900 }, { say: 'C', text: sty(other, '나, 나는 몰랐어! 둘이 사귀는 줄…!') },
      { pose: 'A', p: 'cry', t: 1400 }, { say: 'A', text: sty(pt, '…믿었는데. 너만은 다를 줄 알았는데.') },
      { split: ['A', 'B', 'C'], caps: ['💔', '😰', '😳'], t: 2000 },
      { say: 'A', text: sty(pt, '…당분간 연락하지 마.'), hot: true }, { move: ['A', 0, 3], t: 1400 },
      { filter: '' }, { outcome: 'sad', endText: ['⚡ 바람 들통', '섬 전체가 이 소식을 알게 되는 건 시간문제…'] },
    ];
    const c = mk('affair', cast, beats, { slots: { A: [0, 3], B: [-0.7, 0], C: [0.7, 0] }, hidden: ['A'], sub: '바람 들통', force: true });
    c.resolve = () => { addRep(-6, '바람이 소문남'); Sim.log('breakup', `💔 ${pt.name}이(가) ${p.name}의 바람을 알아버렸어요`, [pt.id, P], 3, { newsKind: 'drama' }); };
    return c;
  }
  function pvFirstGift(v, item) {
    const p = ME(); const cast = { A: v, B: p };
    const beats = [
      { narr: `(${p.name}이(가) 처음으로 ${v.name}에게 선물을 내밀었다)`, who: '해설', icon: '🎁', shot: ['wide'] },
      { emo: 'A', e: '😳' }, { say: 'A', text: sty(v, `에? 나한테…? ${item ? item + '…?' : ''}`), shot: 'close' },
      { pose: 'A', p: 'surprise', t: 900 }, { say: 'A', text: sty(v, '이 섬에 와서 선물 받은 건 처음이야. …고마워. 진짜로.') },
      { pose: 'A', p: 'hug', t: 1300 }, { fx: 'sparkle', at: 'A' },
      { outcome: 'happy', endText: ['🎁 첫 선물', `${v.name}의 마음에 작은 불이 켜졌다`] },
    ];
    const c = mk('friend', cast, beats, { sub: '첫 선물', force: true });
    c.resolve = () => { Soc.addFriend(v.id, P, 4, 4, '첫 선물'); };
    return c;
  }
  function pvBestie(v) {
    const p = ME(); const cast = { A: v, B: p };
    const beats = [
      { narr: `(노을 지는 언덕. ${v.name}이(가) 할 말이 있다며 불러냈다)`, who: '해설', icon: '🌇', shot: ['wide'] },
      { say: 'A', text: sty(v, `${p.name}, 너 처음 섬에 왔을 때 기억나? 그땐 이렇게 친해질 줄 몰랐는데.`) },
      { say: 'A', text: sty(v, '…앞으로도 계속 내 편 해 줄 거지? 나도 무조건 네 편이야!'), hot: true, shot: 'close' },
      { poses: [['A', 'highfive'], ['B', 'highfive']], t: 1300 }, { fx: 'hearts', at: 'A' },
      { split: ['A', 'B'], caps: ['🤙 평생 친구', '🤙 평생 친구'], t: 2000 },
      { outcome: 'happy', endText: ['👯 절친 선언', `${v.name}와(과) 평생 친구가 됐다`] },
    ];
    return mk('friend', cast, beats, { venue: { loc: 'island', x: -72, z: -86, place: 'cliff' }, sub: '절친 선언', force: true });
  }
  function pvShame(list) {
    const p = ME(); const ks = ['A', 'C', 'D'].slice(0, list.length);
    const cast = Object.assign({ B: p }, Object.fromEntries(ks.map((k, i) => [k, list[i]])));
    const beats = [
      { narr: `(광장에 들어서자… 주민들이 수군거리기 시작한다)`, who: '해설', icon: '👀', shot: ['wide'] },
      { say: ks[0], text: sty(list[0], `저기 ${p.name} 온다… 그 소문 들었어?`) }, ...(ks[1] ? [{ say: ks[1], text: sty(list[1], '쉿, 들리겠어. …근데 진짜 그랬대?') }] : []),
      { poses: ks.map(k => [k, 'glare']), t: 1300 }, { pose: 'B', p: 'sadSit', t: 1300 },
      { narr: '(평판이 바닥까지 떨어졌다… 칭찬 · 선물 · 부탁 들어주기로 신뢰를 되찾아야 한다)', who: '해설', icon: '📉' },
      { outcome: 'sad', endText: ['👀 섬의 문제아', '평판은 쌓기는 어렵고 무너지긴 쉽다'] },
    ];
    return mk('fight', cast, beats, { venue: { loc: 'island', x: 3, z: 19, place: 'plaza' }, sub: '섬의 문제아', force: true });
  }
  function pvFanMeet(list) {
    const p = ME(); const ks = ['A', 'C', 'D'].slice(0, list.length);
    const cast = Object.assign({ B: p }, Object.fromEntries(ks.map((k, i) => [k, list[i]])));
    const beats = [
      { narr: `(광장에 들어서자… 주민들이 우르르 몰려온다?!)`, who: '해설', icon: '🌟', shot: ['wide'] },
      { say: ks[0], text: sty(list[0], `${p.name}다! 섬의 인기인! 사인해 줘!`), hot: true }, ...(ks[1] ? [{ say: ks[1], text: sty(list[1], '나랑 사진 한 장만! 제발!') }, { fx: 'camera' }] : []),
      { poses: ks.map(k => [k, 'cheer']), t: 1300 }, { pose: 'B', p: 'cheer', t: 1100 }, { fx: 'fireworks' },
      { outcome: 'happy', endText: ['🌟 섬의 인기인', '평범한 내가 이 섬에선… 우주최강?!'] },
    ];
    return mk('party', cast, beats, { venue: { loc: 'island', x: 3, z: 19, place: 'plaza' }, sub: '섬의 인기인 팬미팅', force: true });
  }
  function pvApology(v) {
    const p = ME(); const cast = { A: v, B: p };
    const beats = [
      { narr: `(꽃다발을 들고 ${v.name}의 집 앞에 섰다…)`, who: '해설', icon: '💐', shot: ['wide'] },
      { pose: 'B', p: 'bow', t: 1300 }, { say: 'A', text: sty(v, '…무슨 일이야. 사과하러 온 거면… 들어는 볼게.') },
      { narr: `(${p.name}이(가) 진심을 다해 사과했다)`, who: '해설', icon: '🙏' }, { emo: 'A', e: '🥹' },
      { say: 'A', text: sty(v, '…다음엔 진짜 안 봐준다? …이번만이야.') }, { poses: [['A', 'hug'], ['B', 'hug']], t: 1500 },
      { outcome: 'happy', endText: ['💐 진심 어린 사과', '다시 시작할 기회'] },
    ];
    const c = mk('makeup', cast, beats, { sub: '진심 어린 사과', force: true });
    c.resolve = () => { Soc.addFriend(v.id, P, 15, 15, '사과'); if (Soc.addRomance) Soc.addRomance(v.id, P, 10, '사과'); addRep(3, '진심 어린 사과'); };
    return c;
  }
  IA.make = { pvCheat, pvFirstGift, pvBestie, pvShame, pvFanMeet, pvApology };

  // 발생: 첫 선물 · 절친 · 평판 등급 변화
  const oChoose2 = Soc.playerChoose;
  Soc.playerChoose = function (v, id, arg) {
    const before = v && Soc.rel(v.id, P).friendship_stage;
    const r = oChoose2.apply(this, arguments);
    try {
      if (v && !v.child && id === 'gift' && arg) { const m = v.firstGiftFromP; if (!m) { v.firstGiftFromP = day(); const it = FM.D.ITEMS && FM.D.ITEMS[arg]; if (Cut && chance(0.6)) Cut.enqueue(pvFirstGift(v, it ? `${it.icon} ${it.name}` : ''), true); } }
      const after = v && Soc.rel(v.id, P).friendship_stage;
      if (v && before !== after && after === 'BEST_FRIEND' && !v.bestieDrama) { v.bestieDrama = day(); Cut && Cut.enqueue(pvBestie(v), true); }
      // 화해 사과: 사이가 틀어진 주민(바람 상대 · 호감 낮음)에게 꽃 선물
      if (v && id === 'gift' && arg && /flower|bouquet|꽃/.test(String(arg)) && (Soc.rel(v.id, P).friendship_point || 0) < 30 && !v.apologyDay) { v.apologyDay = day(); Cut && Cut.enqueue(pvApology(v), true); }
    } catch (e) { console.error('interact pv', e); }
    return r;
  };
  FM.bus.on('repTier', ({ to }) => {
    try {
      const vs = S().villagers.filter(v => !v.child && v.loc === 'island' && !v.sceneId).sort(() => Math.random() - 0.5).slice(0, 3);
      if (vs.length < 2 || !Cut) return;
      if (to[0] === 0) Cut.enqueue(pvShame(vs), true);
      if (to[0] === 75) Cut.enqueue(pvFanMeet(vs), true);
    } catch (e) { /* */ }
  });
  // 평판은 시간이 지나면 천천히 50 쪽으로 회복
  FM.bus.on('day', () => { const p = pl(); if (!p) return; const r0 = rep(); if (r0 < 50) p.rep = Math.min(50, r0 + 2); });

  // 다이어리 · 프로필에서 보기
  IA.badge = () => { const t = tierOf(rep()); return `${t[1]} · 평판 ${Math.round(rep())}`; };
})();
