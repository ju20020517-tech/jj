/* =========================================================
 *  🗞️ 소문 수첩 — 소식지는 "내가 알게 된 소문"만
 *   소문이 들어오는 길
 *    1) 대화 중 주민이 말해 줌 (소문 화제 · "요즘 어때?")
 *    2) 수다쟁이 주민이 직접 다가와서 알려 줌 (하루 최대 3번)
 *    3) 근처에서 주민끼리 수다 떠는 걸 엿들음 (9m 안)
 *    4) 사건을 직접 목격함 (같은 곳 · 12m 안)
 *   소문 쓰기 — 주민에게 "🗞️ 소문 전하기"
 *    · 연애 소식 → 짝사랑 중이던 주민은 질투/실연, 아니면 축하하러 찾아감 (관계 생김)
 *    · 이별 소식 → 그 사람을 좋아하던 주민에겐 기회 (설렘↑), 아니면 위로하러 감
 *    · 다툼 소식 → 더 친한 쪽 편을 듦 (한쪽과 가까워지고 한쪽과 멀어짐)
 *    · 우정 · 아기 · 입원 소식 → 축하 · 병문안 (관계 생김)
 *    같은 소문은 같은 주민에게 한 번만 · 너무 많이 퍼뜨리면 "소문쟁이" 평판
 *   헛소문 — 엿들은 소문 · 수다쟁이가 전한 소문은 가끔 사실이 아님
 *    · 소문 속 당사자에게 "🔍 사실이야?" 하고 물어 확인할 수 있음 (✔ 사실 / ❌ 헛소문)
 *    · 확인 안 된 헛소문을 퍼뜨리면 들킴 → 나와 당사자 사이 신뢰 하락, 당사자는 처음 퍼뜨린 주민을 원망
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, W = FM.Will;
  if (!Sim || !Soc) return;
  const P = 'P', S = () => Sim.get(), pl = () => S().player;
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const day = () => Sim.time.day(), hour = () => Sim.time.hour();
  const byId = id => Sim.byId(id), nm = id => Sim.nameOf(id);
  const J = t => (FM.josa ? FM.josa(t) : t);
  const sty = (v, t) => (FM.Speech ? FM.Speech.apply(v, J(t)) : J(t));
  const toast = t => FM.bus.emit('toast', J(t));
  const R = (FM.Rumor = {});
  const gossipy = v => Sim.has && (Sim.has(v, 'GOSSIP') || Sim.has(v, 'EXTROVERT') || Sim.has(v, 'BUSYBODY') || Sim.has(v, 'BEAGLE'));
  const book = () => { const st = S(); return st.rumors || (st.rumors = []); };
  const nice = t => (W && W.niceNews ? W.niceNews(t) : String(t).replace(/^[^\s가-힣]+\s*/, ''));
  const RELTYPES = ['couple', 'romance', 'confess', 'wedding', 'engage', 'breakup', 'divorce', 'fight', 'jealous', 'triangle', 'affair', 'friend', 'rel', 'baby', 'medical', 'crush', 'quirk', 'date'];
  function kindOf(e) {
    const t = e.type;
    if (['couple', 'romance', 'confess', 'date', 'crush'].includes(t)) return /헤어|차였|거절/.test(e.text) ? 'breakup' : 'couple';
    if (['wedding', 'engage'].includes(t)) return 'wedding';
    if (['breakup', 'divorce'].includes(t)) return 'breakup';
    if (['fight', 'jealous', 'triangle', 'affair'].includes(t)) return 'fight';
    if (t === 'rel') return /멀어|싸|다퉜|어색/.test(nice(e.text)) ? 'fight' : 'friend';
    if (t === 'friend') return 'friend';
    if (t === 'baby') return 'baby';
    if (t === 'medical') return 'sick';
    return 'misc';
  }
  const KIND_ICON = { couple: '💕', wedding: '💒', breakup: '💔', fight: '⚡', friend: '🤝', baby: '👶', sick: '🏥', misc: '🗞️' };
  const keyOf = e => `${e.t}|${e.text}`;
  const known = e => book().some(r => r.key === keyOf(e));
  const isRumorish = e => e && e.text && (e.who || []).some(id => id !== P) && RELTYPES.includes(e.type) && !e.secret;
  // 소문 기록
  function add(e, src, byIdV, quiet) {
    if (!isRumorish(e) || known(e)) return null;
    const r = { key: keyOf(e), t: e.t, at: S().time, day: day(), hm: Sim.time.hm ? Sim.time.hm() : '', text: nice(e.text), raw: e.text, type: e.type, newsKind: e.newsKind || null,
      who: (e.who || []).filter(id => id !== P), kind: kindOf(e), src, by: byIdV || null, told: {} };
    r.icon = KIND_ICON[r.kind];
    maybeFake(r, src, byIdV);
    const b = book(); b.push(r); if (b.length > 80) b.splice(0, b.length - 80);
    if (!quiet) {
      const how = { told: `${nm(byIdV)}에게 들은 소문`, heard: '엿들은 소문', seen: '직접 본 일' }[src] || '소문';
      toast(`🗞️ 소문 수첩에 적었어요 (${how}): ${r.text}`);
    }
    FM.bus.emit('rumor', r);
    return r;
  }
  // 헛소문: 엿들은 소문 25% · 수다쟁이가 전한 소문 15% · 그 밖에 전해 들은 소문 6% (직접 본 일은 항상 사실)
  const FAKE_TPL = {
    couple: ['{A}와(과) {C}이(가) 몰래 사귄대요', '{A}이(가) {C}한테 고백했대요'],
    breakup: ['{A}와(과) {C}이(가) 헤어졌대요'],
    fight: ['{A}와(과) {C}이(가) 크게 싸웠대요', '{A}이(가) {C}랑 말도 안 한대요'],
    friend: ['{A}와(과) {C}이(가) 절친이 됐대요'],
  };
  function maybeFake(r, src, byIdV) {
    if (!FAKE_TPL[r.kind] || r.who.length < 1) return;
    const by = byIdV && byId(byIdV);
    const p = src === 'heard' ? 0.25 : src === 'told' ? (by && gossipy(by) ? 0.15 : 0.06) : 0;
    if (!chance(p)) return;
    const a = byId(r.who[0]); if (!a) return;
    const pool = S().villagers.filter(x => !x.child && x.id !== a.id && !r.who.includes(x.id) && (r.kind !== 'couple' || !Soc.canRomance || Soc.canRomance(a.id, x.id)));
    const c = pick(pool); if (!c) return;
    r.fake = true; r.key += '|fake'; r.who = [a.id, c.id];
    r.text = J(pick(FAKE_TPL[r.kind]).replace('{A}', a.name).replace('{C}', c.name));
  }
  const live = r => !r.debunked;
  const sureTag = r => r.debunked ? ' · ❌ 헛소문' : r.sure ? ' · ✔ 사실' : r.src === 'heard' ? ' · 긴가민가' : '';
  R.sureTag = sureTag;
  R.add = add; R.book = book; R.kindOf = kindOf; R.KIND_ICON = KIND_ICON;
  // 주민이 아직 플레이어에게 말 안 한 따끈한 소문
  function freshFor(v) {
    const st = S();
    return st.log.slice(-80).reverse().find(e => e.day >= day() - 3 && isRumorish(e) && !(e.who || []).includes(v.id) && !known(e));
  }
  R.freshFor = freshFor;

  // ---------------------------------------------------------
  // 1) 대화에서 들음 — talk2 소문 화제 · "요즘 어때?"
  // ---------------------------------------------------------
  if (W && W.I && W.I.gossip) {
    const G = W.I.gossip, oSay = G.say;
    G.say = function (v, c) {
      const m = W.mind(v); const before = Object.assign({}, m.told || {});
      const out = oSay.apply(this, arguments);
      try { const k = Object.keys(m.told || {}).find(t => !before[t]); const e = k && S().log.slice().reverse().find(x => x.text === k); if (e) add(e, 'told', v.id, true); } catch (er) { /* */ }
      return out;
    };
  }
  const oChoose = Soc.playerChoose;
  Soc.playerChoose = function (v, id, arg) {
    if (id === 'rumorMenu') return rumorMenu(v);
    if (id === 'rumorTell') return tellRumor(v, arg);
    if (id === 'rumorCheck') return checkRumor(v, arg);
    const r = oChoose.apply(this, arguments);
    try {
      if (id === 'news' && r && v && !v.child) {
        const e = freshFor(v);
        if (e) { const rr = add(e, 'told', v.id, true); if (rr) r.text = `${r.text} ${sty(v, pick(['아, 그리고 이거 들었어?', '참, 소문 하나 알려 줄까?', '그건 그렇고, 너 그 얘기 알아?']))} ${J(rr.text)}`; }
      }
    } catch (er) { console.error('rumor news', er); }
    return r;
  };

  // ---------------------------------------------------------
  // 2) 수다쟁이 주민이 직접 다가와서 알려 줌
  // ---------------------------------------------------------
  FM.bus.on('hour', h => {
    try {
      if (h < 8 || h > 21) return;
      const st = S(), p = pl(); st.rumorVisits = st.rumorVisits || {};
      if ((st.rumorVisits[day()] || 0) >= 3 || !chance(0.45)) return;
      const cands = st.villagers.filter(v => !v.child && !v.sceneId && !v.talkingToPlayer && v.loc === p.loc && Math.hypot(v.x - p.x, v.z - p.z) < 30 && !(v.status && v.status.hospital) && (gossipy(v) || chance(0.15)) && freshFor(v));
      const v = pick(cands); if (!v) return;
      const e = freshFor(v);
      st.rumorVisits[day()] = (st.rumorVisits[day()] || 0) + 1;
      Sim.scene({ title: '소문 전하러 옴', actors: { A: v }, steps: [{ go: 'A', to: { loc: p.loc, x: p.x + 1, z: p.z + 0.8 }, max: 40 }, { face: 'A', at: P }, { emote: 'A', e: '❗' },
        { say: 'A', text: () => sty(v, `${pick(['있잖아! 그 얘기 들었어?', '야야, 대박 소식!', '너한테만 말해 주는 건데…'])} ${nice(e.text)}`), t: 4 },
        { do: () => add(e, 'told', v.id) }] });
    } catch (er) { console.error('rumor visit', er); }
  });

  // ---------------------------------------------------------
  // 3) 엿듣기 — 주민끼리 수다(소문)를 떨 때 근처에 있으면
  // ---------------------------------------------------------
  const Ev = FM.Ev;
  if (Ev && Ev.pickRumor) {
    const oPick = Ev.pickRumor;
    Ev.pickRumor = function (a, b) {
      const g = oPick.apply(this, arguments);
      try {
        const p = pl();
        if (g && g.e && a && p.loc === a.loc && Math.hypot(a.x - p.x, a.z - p.z) < 9 && !known(g.e))
          setTimeout(() => { if (add(g.e, 'heard', a.id, true)) toast(`👂 ${a.name}와(과) ${b ? b.name : ''}의 수다를 엿들었어요: "${nice(g.e.text)}"`); }, 2500);
      } catch (er) { /* */ }
      return g;
    };
  }
  // ---------------------------------------------------------
  // 4) 목격 — 근처에서 벌어진 사건
  // ---------------------------------------------------------
  FM.bus.on('log', e => {
    try {
      if (!isRumorish(e) || (e.imp || 0) < 2) return;
      const p = pl(); if (!p) return;
      const near = (e.who || []).some(id => { const v = byId(id); return v && v.loc === p.loc && Math.hypot(v.x - p.x, v.z - p.z) < 12; });
      if (near) add(e, 'seen', null);
    } catch (er) { /* */ }
  });

  // ---------------------------------------------------------
  // 소문 전하기 → 주민 사이 관계
  // ---------------------------------------------------------
  const oOpts = Soc.talkOptions;
  Soc.talkOptions = function (v) {
    const O = oOpts.apply(this, arguments);
    try {
      if (!v || v.child || v.balloon || !Array.isArray(O) || !O.some(o => o.id === 'bye')) return O;
      const n = book().filter(r => live(r) && !r.told[v.id] && !r.who.includes(v.id) && day() - r.day <= 5).length;
      const i = () => { const k = O.findIndex(o => o.id === 'bye'); return k < 0 ? O.length : k; };
      if (n) O.splice(i(), 0, { id: 'rumorMenu', label: `🗞️ 소문 전하기 (${n})` });
      const q = book().slice().reverse().find(r => live(r) && !r.sure && r.who.includes(v.id) && day() - r.day <= 7);
      if (q) O.splice(i(), 0, { id: 'rumorCheck', label: '🔍 그 소문, 사실이야?', arg: q.key });
    } catch (er) { /* */ }
    return O;
  };
  function rumorMenu(v) {
    const list = book().filter(r => live(r) && !r.told[v.id] && !r.who.includes(v.id) && day() - r.day <= 5).slice(-8).reverse();
    return { text: sty(v, pick(['뭔데뭔데? 얘기해 봐!', '소문? 무슨 소문?', '…궁금하네. 말해 봐.'])), options: list.map(r => ({ id: 'rumorTell', label: `${r.icon} ${r.text}${sureTag(r)}`, arg: r.key })).concat([{ id: 'menu', label: '↩️ 돌아가기' }]) };
  }
  function goSee(v, o, line, onEnd) {
    if (!o || o.loc === 'metro' || v.sceneId || o.sceneId) { if (onEnd) onEnd(); return; }
    Sim.scene({ title: '소문 듣고 찾아감', actors: { A: v, B: o }, steps: [{ go: 'A', to: { actor: 'B', near: 1.1 }, max: 90 }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' }, { say: 'A', text: sty(v, line), t: 3 }, { emote: 'B', e: '😊' }], onEnd });
  }
  function tellRumor(v, key) {
    const r = book().find(x => x.key === key); if (!r) return { text: sty(v, '응?'), options: Soc.talkOptions(v) };
    r.told[v.id] = day();
    const st = S(); st.rumorSpread = st.rumorSpread || {}; st.rumorSpread[day()] = (st.rumorSpread[day()] || 0) + 1;
    const [a, b] = r.who.map(byId); const fA = a ? Soc.rel(v.id, a.id).friendship_point : 0, fB = b ? Soc.rel(v.id, b.id).friendship_point : 0;
    let text = '', fx = null;
    if (r.fake) return tellFake(v, r, a, b);
    const crushOn = x => x && v.crush && v.crush.target === x.id;
    const romOn = x => x && Soc.F(v.id, x.id).romance;
    if (r.kind === 'couple' || r.kind === 'wedding') {
      const hurt = [a, b].find(x => crushOn(x) || romOn(x) >= 40);
      if (hurt) {
        const rival = hurt === a ? b : a; if (rival) Soc.addFriend(v.id, rival.id, -6, -4, '연적 소식');
        if (Soc.endCrush && crushOn(hurt)) Soc.endCrush(v);
        Soc.F(v.id, hurt.id).romance = Math.max(0, romOn(hurt) - 25);
        v.mood = Math.max(0, (v.mood || 50) - 20); Sim.emote(v, '💔');
        text = pick([`…그랬구나. ${hurt.name}… 나 사실 좋아했는데.`, `거짓말… ${hurt.name}이(가)? …괜찮아, 안 괜찮지만.`, `…알려 줘서 고마워. 혼자 있고 싶어.`]);
        fx = 'heartbreak';
      } else {
        for (const x of [a, b]) if (x) Soc.addFriend(v.id, x.id, 4, 2, '축하');
        const o = a && b ? (fA >= fB ? a : b) : a || b;
        text = pick(['우와, 진짜?! 축하해 줘야겠다!', '대박! 둘이 잘 어울려. 가서 축하해 줄래!', '헐, 몰랐어! 축하 선물 사야지!']);
        goSee(v, o, pick(['축하해! 소식 들었어!', '둘이 진짜 잘 어울려!', '행복해야 해!']), () => o && Soc.addFriend(o.id, v.id, 5, 3, '축하해 줌'));
        fx = 'congrats';
      }
    } else if (r.kind === 'breakup') {
      const chanceOn = [a, b].find(x => x && Soc.canRomance(v.id, x.id) && (romOn(x) >= 25 || crushOn(x)));
      if (chanceOn) {
        Soc.addRomance(v.id, chanceOn.id, 12, '이별 소식'); Sim.emote(v, '😳');
        text = pick([`${chanceOn.name}이(가) 헤어졌다고? …그럼 나한테도 기회가…? 아, 아니야!`, `…${chanceOn.name} 많이 힘들겠다. 내가 위로해 줘도 될까?`]);
        goSee(v, chanceOn, '…괜찮아? 힘들면 나한테 기대도 돼.', () => { Soc.addFriend(chanceOn.id, v.id, 6, 4, '위로'); Soc.addRomance(chanceOn.id, v.id, 6, '위로'); });
        fx = 'chance';
      } else {
        const o = a && b ? (fA >= fB ? a : b) : a || b;
        if (o) Soc.addFriend(v.id, o.id, 3, 2, '걱정');
        text = pick(['어머… 마음 아프겠다. 위로해 주러 가야겠어.', '헤어졌구나… 괜찮으려나?', '…그런 일이 있었구나.']);
        goSee(v, o, '소식 들었어… 힘내. 맛있는 거 먹으러 가자!', () => o && Soc.addFriend(o.id, v.id, 5, 3, '위로'));
        fx = 'comfort';
      }
    } else if (r.kind === 'fight') {
      if (a && b) {
        const side = fA >= fB ? a : b, other = side === a ? b : a;
        Soc.addFriend(v.id, side.id, 4, 3, '편들기'); Soc.addFriend(v.id, other.id, -5, -4, '소문');
        text = pick([`역시 ${other.name}이(가) 너무했네. 난 ${side.name} 편이야.`, `${side.name}이(가) 속상했겠다… ${other.name}한테 한마디 해야겠어.`]);
        goSee(v, side, '얘기 들었어. 난 네 편이야!', () => Soc.addFriend(side.id, v.id, 4, 3, '편들어 줌'));
        fx = 'side';
      } else { text = '…싸움은 안 좋은데.'; }
    } else if (r.kind === 'friend') {
      for (const x of [a, b]) if (x) Soc.addFriend(v.id, x.id, 3, 1, '소문');
      text = pick(['오~ 둘이 친해졌구나! 나도 끼워 달라고 해야지.', '좋다! 나도 같이 놀고 싶어.']);
      const o = a || b; goSee(v, o, '나도 같이 놀자!', () => o && Soc.addFriend(o.id, v.id, 4, 2, '같이 놀기'));
      fx = 'join';
    } else if (r.kind === 'baby') {
      for (const x of [a, b]) if (x) Soc.addFriend(v.id, x.id, 4, 2, '축하');
      text = '아기가?! 축하 선물 들고 가 봐야겠다!'; fx = 'congrats';
    } else if (r.kind === 'sick') {
      const o = a; if (o) { Soc.addFriend(v.id, o.id, 4, 3, '걱정'); }
      text = '어떡해… 병문안 가 봐야겠어.';
      if (o && o.status && o.status.hospital) goSee(v, o, '괜찮아? 빨리 나아!', () => { o.status.cared = (o.status.cared || 0) + 1; Soc.addFriend(o.id, v.id, 6, 4, '병문안'); });
      fx = 'visit';
    } else { text = pick(['오, 그런 일이?', '재밌는 소식이네!', '처음 들었어!']); }
    // 플레이어 평판: 하루에 소문을 너무 많이 퍼뜨리면 신뢰가 조금 깎임
    const spread = st.rumorSpread[day()];
    Soc.addFriend(v.id, P, spread > 4 ? -1 : 2, spread > 4 ? -3 : 1, '소문');
    if (spread === 5) toast('🤐 오늘 소문을 너무 많이 퍼뜨렸어요… 주민들이 "소문쟁이"라고 수군거려요 (신뢰 조금 하락)');
    if (W && W.remember) W.remember(v, 'rumor', `${pl().name}한테 "${r.text}" 소식을 들었어`);
    return { text: sty(v, text), options: Soc.talkOptions(v) };
  }
  R.tell = tellRumor;

  // 확인 안 된 헛소문을 퍼뜨림 → 듣는 사람이 당사자를 찾아갔다가 들통
  function tellFake(v, r, a, b) {
    const o = [a, b].filter(Boolean).sort((x, y) => Soc.rel(v.id, y.id).friendship_point - Soc.rel(v.id, x.id).friendship_point)[0];
    const text = pick(['헐, 진짜? 직접 물어봐야겠다!', '에이, 설마… 확인해 볼게!', '그게 정말이야? 가서 물어볼래.']);
    const debunk = () => {
      if (r.debunked) return; r.debunked = true;
      Soc.addFriend(v.id, P, -3, -4, '헛소문');
      if (o) { Soc.addFriend(o.id, P, -4, -5, '헛소문'); if (r.by && r.by !== o.id) Soc.addFriend(o.id, r.by, -4, -3, '헛소문을 퍼뜨림'); }
      toast(`❌ 헛소문이었어요! ${o ? o.name : '당사자'}이(가) "그런 적 없다"고 했대요… (${v.name}${o ? '·' + o.name : ''}의 신뢰 하락)`);
      Sim.log('rel', `😤 ${o ? o.name : ''}이(가) 자기에 대한 헛소문에 화가 났어요`, [o && o.id, v.id].filter(Boolean), 1);
    };
    if (o && !o.sceneId && !v.sceneId && o.loc !== 'metro') {
      Sim.scene({ title: '헛소문 확인', actors: { A: v, B: o }, steps: [{ go: 'A', to: { actor: 'B', near: 1.1 }, max: 90 }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
        { say: 'A', text: sty(v, `너 그거 진짜야? ${r.text}`), t: 3 }, { emote: 'B', e: '💢' },
        { say: 'B', text: () => sty(o, pick(['뭐?! 그런 적 없어! 누가 그래?', '…그거 완전 헛소문이야.', '하… 누가 그런 말을 퍼뜨려?'])), t: 3 }], onEnd: debunk });
    } else setTimeout(debunk, 4000);
    if (W && W.remember) W.remember(v, 'rumor', `${pl().name}한테 "${r.text}" 얘기를 들었어`);
    return { text: sty(v, text), options: Soc.talkOptions(v) };
  }

  // 당사자에게 직접 확인
  function checkRumor(v, key) {
    const r = book().find(x => x.key === key); if (!r) return { text: sty(v, '응?'), options: Soc.talkOptions(v) };
    let text;
    if (r.fake) {
      r.debunked = true; Sim.emote(v, '💢');
      const by = r.by && byId(r.by);
      if (by && by.id !== v.id) Soc.addFriend(v.id, by.id, -3, -2, '헛소문을 퍼뜨림');
      Soc.addFriend(v.id, P, 1, 2, '직접 물어봐 줌');
      text = pick([`뭐어?! 그런 적 없거든! ${by ? `${by.name}이(가) 그래? …두고 봐.` : '누가 그런 말을 해?'}`, '헛소문이야. 그래도 나한테 직접 물어봐 줘서 고마워.', '…그런 소문이 돌아? 진짜 어이없다.']);
      toast(`❌ 헛소문이었어요 — 소문 수첩에 표시했어요`);
    } else {
      r.sure = true; Soc.addFriend(v.id, P, 1, 1, '솔직한 대화');
      text = { couple: pick(['…응, 맞아. 어떻게 알았어?! 아직 비밀이야!', '헤헤… 소문 빠르네. 맞아.']), wedding: '응! 결혼해! 꼭 와 줘!', breakup: pick(['…응. 그렇게 됐어. 괜찮아, 이제.', '맞아… 아직 좀 힘들어.']), fight: pick(['…응. 좀 다퉜어. 곧 풀겠지.', '그 얘긴 하고 싶지 않아… 근데 맞아.']), friend: '응! 요즘 진짜 친해!', baby: '맞아! 우리 아기 보러 와!', sick: '응… 이제 좀 괜찮아. 걱정해 줘서 고마워.' }[r.kind] || '응, 맞아.';
      if (r.kind === 'breakup' || r.kind === 'fight' || r.kind === 'sick') Sim.emote(v, '😢'); else Sim.emote(v, '😊');
      toast(`✔ 사실로 확인된 소문이에요`);
    }
    return { text: sty(v, text), options: Soc.talkOptions(v) };
  }
  R.check = checkRumor;

  // 새 소문 배지 (폰 · 소식 앱)
  function badge() {
    let el = document.getElementById('rumorBadge');
    if (!el) { el = document.createElement('span'); el.id = 'rumorBadge'; el.style.display = 'none'; document.body.appendChild(el); }
    const st = S(); const seen = st && st.rumorSeen || 0;
    const n = st ? book().filter(r => (r.at || 0) > seen).length : 0;
    el.dataset.badge = n ? String(n) : '';
  }
  FM.bus.on('rumor', badge);
  const UI = FM.UI;
  if (UI && UI.tab) {
    const oTab = UI.tab;
    UI.tab = function (t) { if (t === 'news') { const st = S(); if (st) { st.rumorSeen = st.time; badge(); } } return oTab.apply(this, arguments); };
  }
})();
