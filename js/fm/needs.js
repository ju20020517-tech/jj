/* =========================================================
 *  자율 의지 AI — 5대 욕구 · 3단 기억 · 맥락 센서 · 4단계 동적 문장 합성
 *
 *  [내부 욕구 5종] → [단/중/장기 기억] → [환경·맥락 센서]
 *        → [4단계 문장 합성기 (도입 · 기억 · 의도 · 떡밥)] → [어조 변환] → 대사
 *
 *  욕구가 80을 넘으면 주민이 먼저 플레이어를 찾아와 말을 건다 (선제 대화 목표)
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, W = FM.Will, D = FM.D;
  const P = 'P';
  const S = () => Sim.get();
  const pl = () => S().player;
  const byId = id => Sim.byId(id);
  const nm = id => Sim.nameOf(id);
  const day = () => Sim.time.day();
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const has = (v, k) => Sim.has(v, k);
  const sty = (v, t) => W.sty(v, t);
  const N = (FM.Needs = {});

  // ---------------------------------------------------------
  // 1. 5대 욕구
  // ---------------------------------------------------------
  const NEEDS = {
    social:  { name: '외로움', icon: '🫂', color: '#8fc8ff' },
    flex:    { name: '과시욕', icon: '✨', color: '#ffd45c' },
    curious: { name: '호기심·가십', icon: '🕵️', color: '#b08aff' },
    possess: { name: '독점욕·질투', icon: '💢', color: '#ff7fa8' },
    frustr:  { name: '스트레스·억울함', icon: '🌧️', color: '#9aa3ad' },
  };
  N.NEEDS = NEEDS;
  const needs = v => v.needs || (v.needs = { social: rnd(20, 45), flex: rnd(10, 35), curious: rnd(15, 40), possess: rnd(0, 20), frustr: rnd(0, 20) });
  N.of = needs;
  const bump = (v, k, d) => { const n = needs(v); n[k] = clamp(n[k] + d, 0, 100); };
  N.bump = bump;
  // 성격별 민감도
  const SENS = {
    social: { EXTROVERT: 1.6, ROMANTIC: 1.2, INTROVERT: 0.45, SNOB: 0.8, ANXIOUS: 1.2 },
    flex: { SNOB: 1.8, EXTROVERT: 1.3, ARTISTIC: 1.2, INTROVERT: 0.6, LAZY: 0.6 },
    curious: { SCHOLARLY: 1.5, EXTROVERT: 1.4, ANXIOUS: 1.1, LAZY: 0.6 },
    possess: { ROMANTIC: 1.4, ANXIOUS: 1.5, CRANKY: 1.3, LAZY: 0.6 },
    frustr: { CRANKY: 1.6, ANXIOUS: 1.4, ATHLETIC: 0.9, LAZY: 0.7 },
  };
  const sens = (v, k) => (SENS[k][v.keys.L1] || 1) * ((v.extraMain || []).reduce((a, x) => a * (SENS[k][x] || 1), 1));
  // 독점하고 싶은 대상: 연인 > 짝사랑 > 플레이어(설렘·친밀이 높을 때)
  function ownTarget(v) {
    const pt = Soc.partnerOf(v.id); if (pt) return pt;
    if (v.crush && v.crush.target) return v.crush.target;
    if (Soc.F(v.id, P).romance >= 35 || Soc.rel(v.id, P).friendship_point >= 75) return P;
    return null;
  }
  N.ownTarget = ownTarget;

  function tickNeeds(dMin) {
    const st = S(), p = pl();
    const k = dMin / 10;
    const newLogs = st.log.filter(e => e.t > (N._lastLogT || 0) && e.imp >= 2 && !e.secret);
    N._lastLogT = st.time;
    for (const v of st.villagers) {
      if (v.child || v.staff || v.visitor) continue;
      const n = needs(v);
      const near = st.villagers.filter(o => o !== v && o.loc === v.loc && Math.hypot(o.x - v.x, o.z - v.z) < 6);
      const talking = v.state === 'TALK_NPC' || v.state === 'TALK_PLAYER' || v.talkingToPlayer || (v.sceneId && near.length);
      const asleep = v.act && v.act.id === 'sleep';
      // 외로움
      if (talking) n.social -= 14 * k; else if (near.some(o => Soc.rel(v.id, o.id).friendship_point >= 40)) n.social -= 3 * k; else if (!asleep) n.social += 0.5 * k * sens(v, 'social');
      // 과시욕 — 부자 · 새 연애 · 방을 새로 꾸밈
      let fl = 0.05;
      if (v.coins > 3000) fl += 0.07;
      const r0 = Soc.partnerOf(v.id) && Soc.rel(v.id, Soc.partnerOf(v.id)); if (r0 && day() - (r0.since || 0) < 3) fl += 0.5;
      const room = st.rooms[v.home]; if (room && room.lastDecor === day()) fl += 0.5;
      n.flex += fl * k * sens(v, 'flex') - (talking ? 4 * k : 0);
      // 호기심·가십 — 새 소문이 생길수록
      n.curious += 0.1 * k * sens(v, 'curious') + Math.min(6, newLogs.filter(e => !(e.who || []).includes(v.id)).length * 0.7) * sens(v, 'curious');
      if (v.state === 'TALK_NPC') n.curious -= 5 * k;
      // 독점욕 — 내 사람이 다른 사람과 붙어 있으면
      const tgt = ownTarget(v);
      if (tgt) {
        const T = byId(tgt);
        const rivalNear = T && st.villagers.some(o => o !== v && o.id !== tgt && o.loc === T.loc && !o.child && Math.hypot(o.x - T.x, o.z - T.z) < 2.6);
        const pTalking = tgt === P && G_talkingWith() && G_talkingWith() !== v.id;
        if (rivalNear || pTalking) n.possess += 2.2 * k * sens(v, 'possess'); else n.possess -= 0.35 * k;
      } else n.possess -= 3 * k;
      // 스트레스·억울함
      n.frustr += ((v.stress || 0) / 40 + (v.depression || 0) / 60 - 0.8) * k * sens(v, 'frustr');
      for (const key of Object.keys(n)) n[key] = clamp(n[key], 0, 100);
    }
  }
  const G_talkingWith = () => { const g = FM.G; return g && g.talkFocus; };
  N.tick = tickNeeds;

  // ---------------------------------------------------------
  // 2. 3단 기억 (단기 48시간 · 중기 30일 · 장기 영구)
  // ---------------------------------------------------------
  const LONG = { gift: 1, wedding: 1, birth: 1, movein: 1, confess: 1, firstDate: 1, promise: 1, family: 1, capsule: 1 };
  const MID = { date: 1, fight: 1, breakup: 1, broken: 1, badmouth: 1, intro: 1, mediate: 1, saw: 1, sawPlayerWith: 1, advice: 1, meal: 1, reconcile: 1, rival: 1 };
  const mem = v => v.mem3 || (v.mem3 = { short: [], mid: [], long: [] });
  N.mem = mem;
  function store(v, kind, text, extra) {
    const m = mem(v);
    const tier = LONG[kind] ? 'long' : MID[kind] ? 'mid' : 'short';
    m[tier].push(Object.assign({ kind, text: FM.josa(text), t: S().time, day: day() }, extra || {}));
    prune(v);
  }
  function prune(v) {
    const m = mem(v), now = S().time;
    m.short = m.short.filter(e => now - e.t < 2880).slice(-16);
    m.mid = m.mid.filter(e => now - e.t < 1440 * 30).slice(-24);
    m.long = m.long.slice(-40);
  }
  N.store = store;
  // 기존 대화 엔진의 기억도 3단 기억으로 흘려보냄
  const origRemember = W.remember;
  W.remember = function (v, kind, text, extra) { origRemember(v, kind, text, extra); try { store(v, kind, text, extra); } catch (e) { /* 무시 */ } };
  const agoTxt = t => { const d = Math.floor((S().time - t) / 1440); return d <= 0 ? (S().time - t < 180 ? '아까' : '오늘') : d === 1 ? '어제' : d < 7 ? `${d}일 전에` : '예전에'; };
  N.agoTxt = agoTxt;

  // ---------------------------------------------------------
  // 3. 맥락 센서
  // ---------------------------------------------------------
  const TOOL = { fish: '낚싯대', bug: '잠자리채', axe: '도끼', water: '물뿌리개', shovel: '삽' };
  function sensors(v) {
    const st = S(), p = pl(), h = Sim.time.hour();
    const tool = p.lastTool && st.time - p.lastTool.t < 120 ? p.lastTool.k : null;
    return {
      weather: st.weather.type,
      time: h >= 21 || h < 5 ? 'night' : h < 10 ? 'morning' : h >= 17 ? 'evening' : 'day',
      tool, outfit: p.outfit || null,
      recentTarget: p.recentTarget && st.time - p.recentTarget.t < 1440 ? p.recentTarget.id : null,
      place: p.loc === 'island' ? FM.MAP.DISTRICTS[FM.T.district(p.x, p.z)].short : (FM.INTERIORS[p.loc] || {}).name,
    };
  }
  N.sensors = sensors;

  // ---------------------------------------------------------
  // 4. 4단계 동적 문장 합성 (Intro · Memory_Ref · Intent · Hook)
  // ---------------------------------------------------------
  const TONE = { ROMANTIC: 'soft', ATHLETIC: 'loud', SCHOLARLY: 'calm', LAZY: 'lazy', EXTROVERT: 'loud', INTROVERT: 'soft', SNOB: 'posh', CRANKY: 'rough', ARTISTIC: 'odd', ANXIOUS: 'nervous' };
  const tone = v => TONE[v.keys.L1] || 'calm';
  const tp = (v, pool) => { const a = (pool[tone(v)] || []).concat(pool.any || []); return pick(a.length ? a : Object.values(pool).flat()); };
  const fill = (t, o) => t.replace(/\{(\w+)\}/g, (_, k) => (o[k] !== undefined ? o[k] : ''));
  const WEATHER_TXT = { rain: '비도 오는데', storm: '이렇게 비바람이 부는데', snow: '눈도 오는데', windy: '바람이 이렇게 부는데', cloudy: '날도 흐린데', sunny: '날씨도 좋은데', clear: '날씨도 좋은데', fog: '안개도 자욱한데' };
  const TIME_TXT = { night: '이 밤중에', morning: '아침부터', evening: '해 질 녘에', day: '' };
  function intro(v, c) {
    const w = WEATHER_TXT[c.weather] || '';
    const tm = TIME_TXT[c.time];
    if (c.tool && chance(0.7)) return fill(tp(v, {
      soft: ['{w} {tool} 들고 서 있는 모습이 참 인상적이네.', '{w} {tool} 챙겨 다니는 거 보니까 부지런하다...'],
      loud: ['오! {tool}! {w} 열심이네!', '{tool} 들고 뭐 해?! {w} 대단하다!'],
      rough: ['{w} {tool}은 왜 들고 다녀.', '...{tool} 휘두르다 다친다.'],
      posh: ['{w} {tool}을 드신 모습이 제법 우아하군.'],
      nervous: ['{w} {tool}... 조, 조심해...!'],
      any: ['{w} {tool} 들고 있네?'] }), { w, tool: c.tool }).trim();
    return fill(tp(v, {
      soft: ['{w} {tm} 너를 보니까 마음이 놓인다.', '{tm} {w}... 너 생각하고 있었어.'],
      loud: ['{tm} 만났다! {w} 딱 좋다!', '야! {w} 여기서 뭐 해?!'],
      lazy: ['{w}... 하암, {tm} 무슨 일이야...', '{tm} 움직이기 귀찮은데... 마침 잘 왔다.'],
      rough: ['{w} 뭘 그렇게 돌아다녀.', '{tm} 또 너냐.'],
      posh: ['{tm} {w} 마주치다니, 우연이 참 우아하군.'],
      nervous: ['아, 깜짝이야...! {w} 너였구나.'],
      odd: ['{w} 구름 모양이 너랑 닮았어...', '{tm} 공기에서 네 냄새가 났어.'],
      any: ['{w} 마침 잘 만났다.'] }), { w, tm }).replace(/\s+/g, ' ').trim();
  }
  const pickMem = (v, filterFn) => { const m = mem(v); const all = m.short.concat(m.mid, m.long).filter(filterFn); return all.length ? all[all.length - 1] : null; };
  // 욕구별 합성 재료
  const COMPOSE = {
    social: v => {
      const last = pickMem(v, e => ['date', 'meal', 'walk', 'play', 'gift', 'promise', 'firstDate'].includes(e.kind));
      return {
        mem: last ? `${agoTxt(last.t)} ${last.text.replace(/[.!]$/, '')}던 거, 아직도 생각나.` : tp(v, { soft: ['요즘은 하루 종일 아무하고도 말을 못 했어.'], loud: ['요즘 다들 바쁜지 놀아 주는 사람이 없어!'], nervous: ['다, 다들 나 피하는 것 같아...'], any: ['요즘 좀 심심했거든.'] }),
        intent: tp(v, { soft: ['잠깐이라도 같이 있어 줄래?'], loud: ['나랑 놀자! 지금 당장!'], lazy: ['그냥 옆에 앉아만 있어 줘...'], rough: ['...딱히 외로운 건 아닌데, 시간 있으면 좀 있다 가.'], posh: ['차 한 잔 함께하는 영광을 주겠나?'], any: ['나랑 같이 시간 보내 줄래?'] }),
        hook: tp(v, { soft: ['너도 가끔 외로울 때 있어?'], loud: ['어때, 콜?!'], rough: ['싫으면 말고.'], any: ['어때?'] }),
      };
    },
    flex: v => {
      const room = S().rooms[v.home];
      const pt = Soc.partnerOf(v.id);
      const brag = pt && chance(0.5) ? `나 요즘 ${nm(pt)}(이)랑 연애 중인 거 알지? 섬에서 제일 잘 어울린대` : v.coins > 3000 && chance(0.5) ? `이번 달에 ${Math.floor(v.coins).toLocaleString()}코인이나 모았어` : room && room.roomStyle && FM.RoomKit && FM.RoomKit.STYLES[room.roomStyle] ? `내 방을 '${FM.RoomKit.STYLES[room.roomStyle].name.replace(/^\S+\s/, '')}' 느낌으로 싹 꾸몄거든` : '오늘 내 옷 좀 봐, 완전 신상이야';
      const m0 = pickMem(v, e => e.kind === 'gift' || e.kind === 'praise');
      return {
        mem: m0 ? `${agoTxt(m0.t)} ${m0.text.replace(/[.!]$/, '')}잖아? 그 뒤로 자신감이 붙었어.` : '',
        intent: tp(v, { posh: [`후후, ${brag}. 품격이 다르지?`], loud: [`${brag}!! 대박이지?!`], soft: [`있잖아... ${brag}. 헤헤`], rough: [`${brag}. ...부러우면 부럽다고 해.`], any: [`${brag}!`] }),
        hook: tp(v, { posh: ['자네 눈에도 그리 보이나?'], rough: ['뭐, 할 말 있어?'], any: ['어때, 멋지지?', '부럽지?'] }),
      };
    },
    curious: v => {
      const st = S();
      const g = st.log.slice(-40).reverse().find(e => e.imp >= 2 && !(e.who || []).includes(v.id) && (e.who || []).length);
      const c = sensors(v);
      const tgt = c.recentTarget && c.recentTarget !== v.id ? byId(c.recentTarget) : null;
      return {
        mem: tgt ? `${agoTxt(pl().recentTarget.t)} 너 ${tgt.name}(이)랑 꽤 오래 얘기하던데?` : g ? `${agoTxt(g.t)} 들었는데... ${g.text.replace(/^\S+\s/, '').replace(/[.!…]+$/, '')}래.` : '',
        intent: tp(v, { loud: ['나 궁금해서 잠이 안 와! 뭐 아는 거 없어?!'], calm: ['데이터가 부족해. 네가 아는 정보를 공유해 줘.'], nervous: ['나만 모르는 거 있는 거 아니지...?'], rough: ['...뭐 재밌는 얘기 없냐.'], any: ['요즘 섬에 무슨 일 있는지 알아?'] }),
        hook: tgt ? `솔직히 ${tgt.name}(이)랑 무슨 얘기 했어?` : tp(v, { any: ['비밀 하나만 알려줘, 응?', '너는 누구 편이야?'] }),
      };
    },
    possess: v => {
      const t = ownTarget(v);
      const seen = pickMem(v, e => e.kind === 'sawPlayerWith' || e.kind === 'saw');
      const other = seen && seen.about ? byId(seen.about) : null;
      const isP = t === P;
      const tn = isP ? '너' : nm(t);
      const giftTo = other && pickMem(v, e => e.kind === 'sawGift' && e.about === other.id);
      return {
        mem: seen ? (seen.what ? `${agoTxt(seen.t)} ${isP ? '네가' : seen.who + '이(가)'} ${nm(seen.about)}와(과) ${seen.what} 모습이 자꾸 눈에 잔상처럼 남더라고.` : `${agoTxt(seen.t)} ${seen.text.replace(/[.!]$/, '')}... 그게 자꾸 눈에 밟혀.`) : isP ? '요즘 네가 다른 애들이랑만 노는 것 같아서.' : `요즘 ${tn} 옆에 자꾸 누가 붙어 있어서.`,
        intent: other && isP ? tp(v, {
          soft: [`나한테는 ${giftTo ? '아무것도' : '말 한마디'} 안 건네더니, ${other.name}한테는 ${giftTo ? '선물까지 줬다며?' : '그렇게 웃어 주더라?'}`],
          rough: [`${other.name}이(가) 그렇게 좋냐?`], loud: [`${other.name}(이)랑 왜 그렇게 붙어 다녀?!`], nervous: [`${other.name}... 나보다 더 좋아...?`],
          any: [`${other.name}(이)랑은 무슨 사이야?`] }) : tp(v, { soft: [`${tn}${isP ? '를' : '을(를)'} 누가 채 갈까 봐 불안해.`], rough: ['내 거에 누가 손대는 거 딱 질색이야.'], any: ['신경 쓰여서 미치겠어.'] }),
        hook: other ? (has(v, 'ARTISTIC') || v.keys.L4 === 'READ' || v.keys.L4 === 'STUDY' ? `솔직하게 말해봐. 내가 ${other.name}보다 못하다는 뜻이야?` : `솔직하게 말해. 나야, ${other.name}(이)야?`) : tp(v, { any: ['나만 봐 주면 안 돼?', '너는 내 편이지?'] }),
      };
    },
    frustr: v => {
      const bad = pickMem(v, e => ['fight', 'broken', 'badmouth', 'breakup', 'rejected'].includes(e.kind));
      const room = S().rooms[v.home];
      return {
        mem: bad ? `${agoTxt(bad.t)} ${bad.text.replace(/[.!]$/, '')}던 거, 생각할수록 억울해.` : room && (room.unity || 100) < 40 ? '방이 영 마음에 안 들어서 잠도 안 와.' : '요즘 되는 일이 하나도 없어.',
        intent: tp(v, { rough: ['아 진짜 다 때려치우고 싶다.'], nervous: ['나 이러다 이 섬 떠날지도 몰라...'], loud: ['속이 부글부글 끓어서 폭발할 것 같아!'], soft: ['누구한테라도 털어놓고 싶었어...'], any: ['한숨만 나와.'] }),
        hook: tp(v, { any: ['내 얘기 좀 들어줄 수 있어?', '넌 내 편 맞지?'] }),
      };
    },
  };
  // 최종 합성
  N.compose = function (v, key) {
    const c = sensors(v);
    const parts = COMPOSE[key](v, c);
    const out = { Intro: intro(v, c), Memory_Ref: parts.mem || '', Intent: parts.intent || '', Hook: sty(v, parts.hook || '') };
    for (const k of ['Intro', 'Memory_Ref', 'Intent', 'Hook']) out[k] = FM.josa(out[k]);
    out.text = [out.Intro, out.Memory_Ref, out.Intent, out.Hook].filter(Boolean).join(' ').replace(/\s+/g, ' ');
    out.sensors = c;
    return out;
  };
  // JSON 파라미터 (디버그 · 프로필 '속마음 분석'용)
  N.schema = function (v) {
    const n = needs(v); const top = Object.entries(n).sort((a, b) => b[1] - a[1])[0][0];
    const m = mem(v); const last = m.short.concat(m.mid).slice(-1)[0];
    return {
      Villager_ID: v.id, Base_Personality: { Layer1: v.keys.L1, Layer4: v.keys.L4 },
      Current_Needs: Object.fromEntries(Object.entries(n).map(([k, x]) => [k, Math.round(x)])),
      Context_Sensors: sensors(v),
      Retrieved_Memory: last ? { Event: last.text, Days_Ago: Math.floor((S().time - last.t) / 1440) } : null,
      Generated_Dialogue_Structure: N.compose(v, top),
    };
  };

  // ---------------------------------------------------------
  // 5. 욕구 의도 → 대화 엔진에 등록 (선택지 · 결과)
  // ---------------------------------------------------------
  const wOf = key => v => {
    const n = needs(v)[key];
    if (v.wantsTalk && v.wantsTalk.need === key && v.wantsTalk.until > S().time) return 500;
    return n >= 80 ? 6 + (n - 80) / 3 : n >= 65 ? 1.2 : 0;
  };
  const done = v => { v.wantsTalk = null; };
  const INT = {
    social: { choices: [['play', '🫂 "좋아, 같이 놀자!"'], ['cafe', '☕ "카페 갈래? 내가 살게"'], ['busy', '😅 "미안, 지금 좀 바빠서…"']],
      on: (v, k) => {
        if (k === 'busy') { bump(v, 'social', 5); bump(v, 'frustr', 6); Soc.addFriend(v.id, P, -2, -1, '거절'); W.remember(v, 'rejected', '같이 있자고 했는데 바쁘다고 했어'); return { text: sty(v, '...그래, 바쁘구나. 다음엔 꼭이야') }; }
        bump(v, 'social', -45); Soc.addFriend(v.id, P, 4, 3, '같이 시간 보내기'); W.remember(v, k === 'cafe' ? 'meal' : 'play', k === 'cafe' ? '카페에서 같이 차 마셨어' : '같이 놀아 줬어');
        if (k === 'cafe') { Soc.addFollower && Soc.addFollower(v, 'walk'); return { text: sty(v, '진짜?! 신난다, 가자!'), close: true }; }
        Sim.emote(v, '😊'); return { text: sty(v, '역시 너밖에 없어!') };
      } },
    flex: { choices: [['wow', '👏 "우와, 진짜 대단하다!"'], ['meh', '😒 "그게 뭐 어때서?"'], ['show', '👀 "나도 좀 보여줘!"']],
      on: (v, k) => {
        if (k === 'meh') { bump(v, 'flex', -10); bump(v, 'frustr', 12); Soc.addFriend(v.id, P, -3, -2, '무시'); W.remember(v, 'fight', '자랑했는데 무시당했어'); return { text: sty(v, has(v, 'CRANKY') ? '흥, 볼 줄도 모르면서.' : '...너무해. 칭찬 한마디가 그렇게 어렵니?') }; }
        bump(v, 'flex', -45); Soc.addFriend(v.id, P, 3, 2, '칭찬'); W.remember(v, 'praise', '자랑했더니 대단하다고 해 줬어');
        if (k === 'show') { v.reputation = clamp((v.reputation || 50) + 3, 0, 100); Sim.emote(v, '✨'); return { text: sty(v, '후후, 언제 우리 집 놀러 와! 제대로 보여줄게') }; }
        Sim.emote(v, '😆'); return { text: sty(v, '그치그치?! 역시 넌 보는 눈이 있어!') };
      } },
    curious: { choices: [['secret', '🤫 "비밀 하나 알려줄게…"'], ['no', '🙊 "소문 퍼뜨리면 못 써"'], ['spy', '🕵️ "같이 조사해 볼래?"']],
      on: (v, k) => {
        if (k === 'no') { bump(v, 'curious', -10); Soc.addFriend(v.id, P, 0, 4, '입이 무거움'); return { text: sty(v, '칫... 입 무거운 건 인정') }; }
        bump(v, 'curious', -50); Soc.addFriend(v.id, P, 3, 1, '비밀 공유');
        const sec = N.realSecret(v);
        if (k === 'spy') { W.remember(v, 'spy', '같이 조사하기로 했어'); return { text: sec ? sty(v, `좋아! 일단 내가 아는 건... ${sec}. 더 캐 볼게!`) : sty(v, '좋아, 탐정 콤비 결성이다!') }; }
        if (sec) { W.remember(v, 'saw', `${sec}라는 비밀을 들었어`); if (chance(0.4)) Sim.log('gossip', `🗣️ ${v.name}이(가) "${sec}"라는 소문을 퍼뜨리기 시작했어요`, [v.id], 1); return { text: sty(v, `헉... ${sec}?! 대박. 아무한테도 말 안 할게! (아마도)`) }; }
        return { text: sty(v, '에이, 그게 다야? 그래도 고마워') };
      } },
    possess: { choices: [['only', '💗 "너밖에 없어"'], ['friend', '🙏 "오해야, 그냥 친구야"'], ['cute', '😏 "질투해? 귀엽네"'], ['none', '🙄 "네가 무슨 상관이야"']],
      on: (v, k, data) => {
        const other = data && data.other && byId(data.other);
        if (k === 'none') { bump(v, 'possess', 10); bump(v, 'frustr', 18); Soc.addFriend(v.id, P, -8, -8, '무시'); if (other && other.id !== P) { Soc.addFriend(v.id, other.id, -8, -6, '질투'); if (Soc.rel(v.id, other.id).friendship_point < 15 && W.setBond) W.setBond(v.id, other.id, 'NEMESIS'); } W.remember(v, 'fight', '질투했더니 무슨 상관이냐고 했어'); return { text: sty(v, '...그래, 알았어. 나 혼자 바보였네.') }; }
        if (k === 'only') { const dating = Soc.partnerOf(v.id) === P; bump(v, 'possess', -60); if (Soc.canRomance(v.id, P)) Soc.addRomance(v.id, P, dating ? 6 : 9, '너밖에 없어'); Sim.emote(v, '💗'); W.remember(v, 'promise', '나밖에 없다고 말해 줬어'); if (pl().lover && pl().lover !== v.id) { const lv = byId(pl().lover); if (lv) W.remember(lv, 'saw', `${pl().name}이(가) ${v.name}한테 "너밖에 없어"라고 했대`); } return { text: sty(v, dating ? '...바보. 알고 있었어. 그래도 듣고 싶었어' : '지, 진짜...? 그 말 믿는다!') }; }
        if (k === 'cute') { const romantic = has(v, 'ROMANTIC') || has(v, 'EXTROVERT'); bump(v, 'possess', romantic ? -35 : -5); if (romantic && Soc.canRomance(v.id, P)) Soc.addRomance(v.id, P, 5, '장난스러운 말'); else bump(v, 'frustr', 8); return { text: romantic ? sty(v, '누, 누가 질투했다고...! (얼굴이 빨개졌다)') : sty(v, '장난하지 마. 나 진지해.') }; }
        const trust = Soc.rel(v.id, P).trust_level;
        const ok = chance(0.35 + trust / 140);
        bump(v, 'possess', ok ? -35 : -8); if (!ok) bump(v, 'frustr', 8);
        return { text: ok ? sty(v, '...정말이지? 한 번만 믿어 볼게') : sty(v, '말로는 뭘 못 해. 두고 볼 거야.') };
      } },
    frustr: { choices: [['listen', '🫂 "다 들어줄게, 말해 봐"'], ['gift', '🎁 "이거 먹고 기분 풀어"'], ['fix', '⚖️ "내가 해결해 줄게"'], ['stop', '😤 "그만 좀 투덜대"']],
      on: (v, k, data) => {
        if (k === 'stop') { bump(v, 'frustr', 15); Soc.addFriend(v.id, P, -5, -6, '면박'); W.remember(v, 'fight', '털어놓으려 했는데 면박을 줬어'); if (needs(v).frustr >= 95) v.runawayRisk = (v.runawayRisk || 0) + 1; return { text: sty(v, '...됐어. 너까지 이러면 나 진짜 떠날 거야.') }; }
        if (k === 'gift') { const food = Object.keys(pl().inv).find(id => D.ITEMS[id] && D.ITEMS[id].stamina && pl().inv[id] > 0); if (!food) return { text: sty(v, '...마음만 받을게') }; Soc.takeItem(food); bump(v, 'frustr', -30); Soc.addFriend(v.id, P, 4, 2, '위로 선물'); W.remember(v, 'gift', '힘들 때 먹을 걸 줬어'); return { text: sty(v, '고마워... 조금 살 것 같아') }; }
        if (k === 'fix') { const who = data && data.who && byId(data.who); bump(v, 'frustr', -20); if (who && who.id !== P) { Soc.addFriend(v.id, who.id, 6, 4, '플레이어의 중재'); W.remember(v, 'mediate', `${who.name}(이)랑 화해하게 도와준대`); return { text: sty(v, `${who.name}(이)랑...? 네가 그렇게 말하면 한번 믿어 볼게`) }; } return { text: sty(v, '고마워. 든든하다') }; }
        bump(v, 'frustr', -40); v.stress = Math.max(0, (v.stress || 0) - 10); Soc.addFriend(v.id, P, 3, 5, '고민 상담'); W.remember(v, 'advice', '속상한 얘기를 다 들어 줬어');
        return { text: sty(v, '(한참 털어놓고 나니) ...후련하다. 너한테 말하길 잘했어') };
      } },
  };
  for (const [key, def] of Object.entries(INT)) {
    W.I['need_' + key] = {
      w: wOf(key),
      say: v => {
        const c = N.compose(v, key);
        const seen = pickMem(v, e => e.kind === 'sawPlayerWith');
        const bad = pickMem(v, e => e.about && ['fight', 'badmouth', 'broken'].includes(e.kind));
        return { text: `${NEEDS[key].icon} ${c.text}`, choices: def.choices.map(([k, label]) => ({ k, label })), data: { other: seen && seen.about, who: bad && bad.about } };
      },
      on: (v, k, data) => { done(v); return def.on(v, k, data); },
    };
  }
  // 섬에 실제로 있는 비밀 하나
  N.realSecret = function (v) {
    const st = S();
    const cs = st.villagers.filter(o => o !== v && o.crush && o.crush.target && o.crush.target !== v.id);
    if (cs.length && chance(0.6)) { const o = pick(cs); return `${o.name}이(가) 사실 ${nm(o.crush.target)}을(를) 좋아한대`; }
    const af = (st.affairs || []).find(a => !a.over && a.a !== v.id && a.b !== v.id);
    if (af && chance(0.5)) return `${nm(af.a)}(이)랑 ${nm(af.b)}이(가) 밤에 몰래 만난대`;
    const e = st.log.slice(-60).reverse().find(x => x.secret);
    return e ? e.text.replace(/^\S+\s/, '') : null;
  };

  // ---------------------------------------------------------
  // 6. 관찰 — 주민은 플레이어를 보고 기억한다
  // ---------------------------------------------------------
  function observe() {
    const st = S(), p = pl();
    const c = { tool: p.lastTool && st.time - p.lastTool.t < 90 ? p.lastTool.k : null };
    for (const v of st.villagers) {
      if (v.child || v.loc !== p.loc || Math.hypot(v.x - p.x, v.z - p.z) > 12) continue;
      v._obsT = v._obsT || 0; if (st.time - v._obsT < 180) continue;
      v._obsT = st.time;
      const where = p.loc === 'island' ? FM.MAP.DISTRICTS[FM.T.district(p.x, p.z)].short + ' 지구' : (FM.INTERIORS[p.loc] || {}).name || '';
      if (c.tool) store(v, 'sawTool', `${p.name}이(가) ${where}에서 ${c.tool} 들고 다니는 걸 봤어`);
      else store(v, 'sawPlace', `${p.name}을(를) ${where}에서 봤어`);
    }
  }
  // 플레이어가 누군가와 데이트·선물·고백 → 근처에서 본 주민이 기억하고 독점욕 상승
  // 나쁜 일이 생기면 억울함 · 좋은 일이면 과시욕
  function feel(e) {
    const ids = e.who || [];
    const BAD = { breakup: 30, divorce: 35, jealous: 12, gossip: 10 };
    for (const id of ids) {
      const v = byId(id); if (!v || v.id === P || v.child) continue;
      if (BAD[e.type]) bump(v, 'frustr', BAD[e.type]);
      if (e.type === 'rel' && /원수|말다툼|화났|험담|들통/.test(e.text)) bump(v, 'frustr', 18);
      if (e.type === 'confess' && /실패/.test(e.text) && ids[0] === id) bump(v, 'frustr', 28);
      if (e.type === 'couple' || e.type === 'engage' || e.type === 'wedding') bump(v, 'flex', 30);
      if (e.type === 'affair' && /들통/.test(e.text)) bump(v, 'frustr', 35);
    }
  }
  function witness(e) {
    if (!e || !(e.who || []).includes(P)) return;
    const other = (e.who || []).find(id => id !== P); if (!other) return;
    const kinds = { date: '데이트하던', couple: '사귀기 시작한', romance: '꽁냥거리던', gift: '선물 주던', confess: '고백하던' };
    const what = kinds[e.type]; if (!what) return;
    const st = S(), p = pl();
    for (const v of st.villagers) {
      if (v.id === other || v.child || v.loc !== p.loc || Math.hypot(v.x - p.x, v.z - p.z) > 16) continue;
      store(v, 'sawPlayerWith', `${p.name}이(가) ${nm(other)}와(과) ${what.replace(/던$/, '')}는 걸 봤어`, { about: other, what, who: p.name });
      if (e.type === 'gift') store(v, 'sawGift', `${p.name}이(가) ${nm(other)}한테 선물 줬어`, { about: other });
      if (ownTarget(v) === P) bump(v, 'possess', 25);
    }
  }

  // ---------------------------------------------------------
  // 7. 선제 대화 — 욕구 80↑ 이면 주민이 먼저 찾아옴
  // ---------------------------------------------------------
  const CALL = {
    social: ['저기! 잠깐 시간 있어?', '{p}! 나랑 얘기 좀 해!'], flex: ['{p}! 이것 좀 봐 봐!', '잠깐! 나 자랑할 거 있어!'],
    curious: ['{p}! 너 그 소식 들었어?', '잠깐만, 물어볼 게 있어!'], possess: ['{p}... 잠깐 얘기 좀 해.', '거기 서! 할 말 있어.'], frustr: ['{p}... 나 좀 도와줘...', '하아... 잠깐 얘기 좀 들어줄래?'],
  };
  function initiative() {
    const st = S(), p = pl();
    if (FM.UI && FM.UI.modalOpen && FM.UI.modalOpen()) return;
    if (FM.Cut && FM.Cut.playing && FM.Cut.playing()) return;
    if (st.villagers.some(v => v.wantsTalk && v.wantsTalk.until > st.time)) return;
    const cands = st.villagers.filter(v => !v.child && !v.sceneId && !v.talkingToPlayer && !(v.status && v.status.hospital) && !(v.act && v.act.id === 'sleep') && v.loc === p.loc && Math.hypot(v.x - p.x, v.z - p.z) < 28 && (v.mind ? (v.mind.initCd || 0) : 0) < st.time);
    let best = null, bk = null, bn = 0;
    for (const v of cands) for (const [k, x] of Object.entries(needs(v))) if (x >= 80 && x > bn) { best = v; bk = k; bn = x; }
    if (!best || !chance(0.45)) return;
    const v = best;
    W.mind(v).initCd = st.time + 240;
    v.wantsTalk = { need: bk, until: st.time + 45 };
    const call = sty(v, pick(CALL[bk]).replace('{p}', p.name));
    Sim.scene({ title: '할 말 있어', actors: { A: v }, steps: [{ go: 'A', to: { actor: P, near: 1.3 }, max: 60, run: bk === 'possess' || bk === 'curious' }, { face: 'A', at: P }, { emote: 'A', e: bk === 'possess' ? '💢' : bk === 'frustr' ? '💧' : '❗', t: 2.5 }, { say: 'A', text: call, t: 3.5 }] });
    FM.bus.emit('toast', `${NEEDS[bk].icon} ${v.name}이(가) 할 말이 있대요! 다가가서 말을 걸어 보세요 (E)`);
  }

  // ---------------------------------------------------------
  // 틱 연결
  // ---------------------------------------------------------
  let acc = 0, obsAcc = 0, iniAcc = 0;
  const origTick = Soc.tick;
  Soc.tick = function (dtR, dMin) {
    origTick(dtR, dMin);
    try {
      acc += dMin; obsAcc += dMin; iniAcc += dMin;
      if (acc >= 10) { tickNeeds(acc); acc = 0; }
      if (obsAcc >= 20) { obsAcc = 0; observe(); }
      if (iniAcc >= 15) { iniAcc = 0; initiative(); }
    } catch (e) { console.error('needs', e); }
  };
  FM.bus.on('log', e => { try { witness(e); feel(e); } catch (er) { /* 무시 */ } });
  // 플레이어 행동 센서 (도구 · 최근 대화 상대)
  const hookUI = () => {
    const UI = FM.UI;
    if (UI && UI.talk && !UI._needsHook) {
      UI._needsHook = true;
      const tk = UI.talk;
      UI.talk = function (v) { if (v && v.id) pl().recentTarget = { id: v.id, t: S().time }; return tk.apply(this, arguments); };
    }
  };
  FM.bus.on('hour', hookUI);
  setTimeout(hookUI, 0);
  N.hookUI = hookUI;
})();
