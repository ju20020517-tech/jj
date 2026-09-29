/* =========================================================
 *  가치관 · 윤리관(확장) · 연애 성향 — 성격 7 · 8번째 레이어
 *
 *  💎 가치관: 무엇을 가장 중요하게 여기나 → 가고 싶은 건물, 하루 행동, 대화 주제, 누구와 잘 맞고 누구와 부딪히나
 *  ⚖️ 윤리관: 천사표 · 정직파 · 정의파 · 의리파 · 평범한 양심 · 실속파 · 기회주의자 · 허풍쟁이 · 뻔뻔파 · 악동 (10종, 섬 안에서 최대한 겹치지 않게)
 *  💘 연애 성향: 바람둥이 · 순애보 · 줏대없음(팔랑귀) · 금사빠 · 밀당고수 · 집착형 · 쿨한 연애 · 연애 무관심
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, D = FM.D, W = FM.Will, M = FM.Moral;
  const P = 'P';
  const S = () => Sim.get();
  const byId = id => Sim.byId(id);
  const nm = id => Sim.nameOf(id);
  const day = () => Sim.time.day();
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const has = (v, k) => Sim.has(v, k);
  const sty = (v, t) => (W ? W.sty(v, FM.josa(t)) : FM.josa(t));
  const hash = s => { let h = 7; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const V = (FM.Values = {});

  // ---------------------------------------------------------
  // 💎 가치관
  // ---------------------------------------------------------
  D.VALUES = {
    MONEY: { name: '돈이 최고', icon: '💰', desc: '열심히 벌고 아껴 쓴다. 가끔 돈 되는 일엔 양심이 흔들림', line: '결국 인생은 통장 잔고야. 너는 어떻게 생각해?' },
    FAMILY: { name: '가족 제일', icon: '👪', desc: '가족과 집이 세상의 중심. 바람은 절대 용서 못 함', line: '나는 가족이랑 저녁 먹는 시간이 제일 행복해. 너는?' },
    FRIENDSHIP: { name: '우정 제일', icon: '🤝', desc: '친구를 위해서라면 뭐든지. 친구 싸움은 꼭 말림', line: '친구는 제2의 가족이지. 너한테 친구는 어떤 의미야?' },
    FAME: { name: '인정·명예', icon: '🌟', desc: '주목받고 싶다. 방송국 · 패션쇼 · 연설 좋아함', line: '언젠가 친구모아 뉴스 첫 번째 기사로 나오고 싶어!' },
    FREEDOM: { name: '자유', icon: '🕊️', desc: '얽매이는 건 싫다. 여기저기 떠돌고 결혼은 천천히', line: '나는 누구한테도 묶이고 싶지 않아. 자유가 최고야' },
    LOVE: { name: '사랑 지상주의', icon: '💘', desc: '사랑이 전부! 설렘에 크게 반응', line: '사랑 없는 인생은 앙꼬 없는 찐빵이야. 그치?' },
    GROWTH: { name: '성장·배움', icon: '📚', desc: '어제보다 나은 나. 도서관 · 학교 · 공방 단골', line: '매일 조금씩 나아지는 게 제일 뿌듯하지 않아?' },
    HARMONY: { name: '평화·조화', icon: '☮️', desc: '다 같이 사이좋게. 먼저 사과하고 싸움을 중재함', line: '다 같이 사이좋게 지내면 좋겠어. 싸우는 건 슬퍼' },
    FUN: { name: '즐거움', icon: '🎉', desc: '재밌으면 그만! 오락실 · 클럽 · 장난', line: '인생은 짧아! 재밌게 살아야지, 안 그래?' },
    TRADITION: { name: '전통·예의', icon: '🏯', desc: '예의와 규칙을 중시. 대성당 · 찻집 단골', line: '요즘 애들은 인사를 잘 안 해... 예의가 제일 중요한데' },
  };
  // 서로 부딪히는 가치관 (말다툼 ↑) / 잘 맞는 가치관 (우정 ↑)
  const CLASH = [['MONEY', 'FREEDOM'], ['FUN', 'TRADITION'], ['FAME', 'HARMONY'], ['FREEDOM', 'FAMILY'], ['MONEY', 'FRIENDSHIP'], ['LOVE', 'FREEDOM'], ['FUN', 'GROWTH']];
  const clash = (a, b) => CLASH.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
  const VW = {  // 메인 성격별 가치관 경향
    ROMANTIC: { LOVE: 4, FAMILY: 2, HARMONY: 1 }, ATHLETIC: { GROWTH: 2, FRIENDSHIP: 2, FUN: 1, FAME: 1 }, SCHOLARLY: { GROWTH: 4, TRADITION: 1 }, LAZY: { FUN: 2, FREEDOM: 2, HARMONY: 1 },
    EXTROVERT: { FUN: 3, FRIENDSHIP: 2, FAME: 1 }, INTROVERT: { HARMONY: 2, GROWTH: 2, FREEDOM: 1 }, SNOB: { FAME: 3, MONEY: 2, TRADITION: 2 }, CRANKY: { MONEY: 2, FREEDOM: 2, TRADITION: 1 },
    ARTISTIC: { FREEDOM: 3, FAME: 1, LOVE: 1 }, ANXIOUS: { FAMILY: 2, HARMONY: 2, TRADITION: 1 },
    ADVENTURER: { FREEDOM: 4, GROWTH: 1 }, FASHIONISTA: { FAME: 3, MONEY: 1, LOVE: 1 }, MUSICIAN: { FAME: 2, FREEDOM: 2, LOVE: 1 }, GAMER: { FUN: 4, FREEDOM: 1 },
    LEADER: { FAME: 2, HARMONY: 2, FRIENDSHIP: 1, TRADITION: 1 }, CLUMSY: { FRIENDSHIP: 2, FUN: 2, FAMILY: 1 }, NATURE: { HARMONY: 3, FREEDOM: 1, FAMILY: 1 },
  };

  // ---------------------------------------------------------
  // ⚖️ 윤리관 확장 (moral.js 의 6종 + 4종)
  // ---------------------------------------------------------
  Object.assign(D.MORAL, {
    JUSTICE: { name: '정의파', icon: '🦸', con: 85, desc: '잘못을 보면 참지 못해요. 바람 · 사기를 목격하면 폭로해요' },
    LOYAL: { name: '의리파', icon: '🤜', con: 65, desc: '규칙보다 친구. 친구의 비밀은 끝까지 지켜 줘요' },
    OPPORTUNIST: { name: '기회주의자', icon: '🦎', con: 32, desc: '유리한 쪽으로 붙어요. 소문을 잘 퍼뜨려요' },
    LIAR: { name: '허풍쟁이', icon: '🤥', con: 38, desc: '거짓말과 과장이 입에 붙었어요. 들키면 뻘쭘' },
  });
  const MORALS = Object.keys(D.MORAL);
  const MW2 = { ROMANTIC: { ORDINARY: 2, HONEST: 2, LOYAL: 1 }, ATHLETIC: { HONEST: 2, JUSTICE: 2, LOYAL: 2 }, SCHOLARLY: { HONEST: 3, JUSTICE: 1 }, LAZY: { ORDINARY: 2, PRAGMATIC: 2, LIAR: 1 },
    EXTROVERT: { LOYAL: 2, OPPORTUNIST: 2, LIAR: 1, RASCAL: 1 }, INTROVERT: { SAINT: 2, HONEST: 2 }, SNOB: { PRAGMATIC: 2, OPPORTUNIST: 2, SHAMELESS: 1 }, CRANKY: { SHAMELESS: 2, JUSTICE: 1, PRAGMATIC: 2 },
    ARTISTIC: { LIAR: 1, RASCAL: 1, ORDINARY: 2, SAINT: 1 }, ANXIOUS: { SAINT: 2, HONEST: 2 }, ADVENTURER: { LOYAL: 2, JUSTICE: 1, RASCAL: 1 }, FASHIONISTA: { OPPORTUNIST: 2, PRAGMATIC: 1, LIAR: 1 },
    MUSICIAN: { LOYAL: 2, ORDINARY: 2, RASCAL: 1 }, GAMER: { PRAGMATIC: 2, RASCAL: 2, LOYAL: 1 }, LEADER: { JUSTICE: 3, HONEST: 1, LOYAL: 1 }, CLUMSY: { SAINT: 2, HONEST: 1, LIAR: 1 }, NATURE: { SAINT: 2, HONEST: 2 } };

  // ---------------------------------------------------------
  // 💘 연애 성향
  // ---------------------------------------------------------
  D.LOVESTYLE = {
    PLAYBOY: { name: '바람둥이', icon: '🦋', desc: '여기저기 설렘을 뿌려요. 연인이 있어도 한눈을 팔아요', rom: 1.4, tempt: 2.5 },
    DEVOTED: { name: '순애보', icon: '💍', desc: '한 사람만 바라봐요. 차여도 오래 기다리고, 이별하면 크게 아파해요', rom: 1.0, tempt: 0.1 },
    SPINELESS: { name: '줏대없음', icon: '🍃', desc: '팔랑귀! 누가 좋다고 하면 마음이 흔들리고 부탁도 잘 넘어가요', rom: 1.1, tempt: 1.3 },
    FAST: { name: '금사빠', icon: '💥', desc: '금방 사랑에 빠지고 금방 식어요', rom: 1.8, tempt: 1.2 },
    PUSHPULL: { name: '밀당고수', icon: '🎭', desc: '쉽게 마음을 안 줘요. 고백은 한 번에 받지 않아요', rom: 0.8, tempt: 1.0 },
    OBSESSIVE: { name: '집착형', icon: '🔗', desc: '연인에게서 눈을 못 떼요. 질투가 아주 심해요', rom: 1.2, tempt: 0.5 },
    COOL: { name: '쿨한 연애', icon: '🧊', desc: '질투 안 하고 이별도 담담. 연애는 연애일 뿐', rom: 0.8, tempt: 0.8 },
    NOLOVE: { name: '연애 무관심', icon: '🌵', desc: '연애보다 친구 · 취미가 좋아요. 설렘에 둔해요', rom: 0.3, tempt: 0.2 },
  };
  const LW = { ROMANTIC: { DEVOTED: 3, FAST: 2, OBSESSIVE: 1 }, ATHLETIC: { FAST: 2, COOL: 2, DEVOTED: 1 }, SCHOLARLY: { NOLOVE: 2, PUSHPULL: 1, DEVOTED: 1 }, LAZY: { COOL: 2, SPINELESS: 2 },
    EXTROVERT: { PLAYBOY: 2, FAST: 2, SPINELESS: 1 }, INTROVERT: { DEVOTED: 2, NOLOVE: 2 }, SNOB: { PUSHPULL: 3, COOL: 1 }, CRANKY: { PUSHPULL: 2, OBSESSIVE: 1, COOL: 1 }, ARTISTIC: { FAST: 2, PLAYBOY: 1, DEVOTED: 1 },
    ANXIOUS: { OBSESSIVE: 2, DEVOTED: 2, SPINELESS: 1 }, ADVENTURER: { COOL: 2, PLAYBOY: 1, FAST: 1 }, FASHIONISTA: { PLAYBOY: 2, PUSHPULL: 2 }, MUSICIAN: { FAST: 2, PLAYBOY: 1, DEVOTED: 1 }, GAMER: { NOLOVE: 2, DEVOTED: 1, COOL: 1 },
    LEADER: { DEVOTED: 2, PUSHPULL: 1 }, CLUMSY: { SPINELESS: 2, FAST: 1, DEVOTED: 1 }, NATURE: { DEVOTED: 2, NOLOVE: 1, COOL: 1 } };

  // ---------------------------------------------------------
  // 부여 — 같은 섬 안에서 최대한 다양하게 (이미 많은 유형은 덜 뽑힘)
  // ---------------------------------------------------------
  function balancedPick(weights, all, used, seed) {
    const w = {};
    for (const k of all) w[k] = ((weights[k] || 0) + 0.6) / (1 + 1.4 * (used[k] || 0));
    const tot = Object.values(w).reduce((a, b) => a + b, 0); let r = (seed % 100000) / 100000 * tot;
    for (const [k, x] of Object.entries(w)) { if ((r -= x) < 0) return k; }
    return all[0];
  }
  const counts = (field) => { const c = {}; for (const o of (S() ? S().villagers : [])) if (o[field]) c[o[field]] = (c[o[field]] || 0) + 1; return c; };
  function ensure(v) {
    if (!v || v.id === P) return v;
    const L1 = v.keys.L1;
    if (!v.value || !D.VALUES[v.value]) { const vw = Object.assign({}, VW[L1] || {}); if (has(v, 'WARM')) vw.FRIENDSHIP = (vw.FRIENDSHIP || 0) + 1; if (has(v, 'FORMAL')) vw.TRADITION = (vw.TRADITION || 0) + 2; v.value = balancedPick(vw, Object.keys(D.VALUES), counts('value'), hash(v.id + 'val')); }
    if (!v.value2 || v.value2 === v.value) { const k2 = Object.keys(D.VALUES).filter(k => k !== v.value); v.value2 = k2[hash(v.id + 'val2') % k2.length]; }
    if (!v.loveStyle || !D.LOVESTYLE[v.loveStyle]) { const lw = Object.assign({}, LW[L1] || {}); if (v.loveArch === 'TSUNDERE') lw.PUSHPULL = (lw.PUSHPULL || 0) + 2; if (v.value === 'LOVE') lw.FAST = (lw.FAST || 0) + 1; if (v.value === 'FREEDOM') lw.PLAYBOY = (lw.PLAYBOY || 0) + 1; if (v.value === 'FAMILY') lw.DEVOTED = (lw.DEVOTED || 0) + 2; v.loveStyle = balancedPick(lw, Object.keys(D.LOVESTYLE), counts('loveStyle'), hash(v.id + 'love')); }
    return v;
  }
  V.ensure = ensure;
  // 윤리관을 10종 중에서 섬 전체가 다채롭도록 다시 배분 (한 번)
  function rebalanceEthics() {
    const st = S(); if (!st || st.flags.ethicsV2) return;
    st.flags.ethicsV2 = true;
    const used = {};
    for (const v of st.villagers.filter(o => !o.child)) {
      const mw = Object.assign({}, MW2[v.keys.L1] || {});
      if (v.value === 'MONEY') mw.PRAGMATIC = (mw.PRAGMATIC || 0) + 1; if (v.value === 'FRIENDSHIP') mw.LOYAL = (mw.LOYAL || 0) + 2; if (v.value === 'HARMONY') mw.SAINT = (mw.SAINT || 0) + 1; if (v.value === 'TRADITION') mw.HONEST = (mw.HONEST || 0) + 1; if (v.value === 'FUN') mw.RASCAL = (mw.RASCAL || 0) + 1;
      v.moral = balancedPick(mw, MORALS, used, hash(v.id + 'eth2'));
      used[v.moral] = (used[v.moral] || 0) + 1;
    }
  }
  const origMake = Sim.makeVillager;
  Sim.makeVillager = function (o) {
    const v = origMake(o); ensure(v);
    if (S() && S().flags && S().flags.ethicsV2) { const mw = MW2[v.keys.L1] || {}; v.moral = balancedPick(mw, MORALS, counts('moral'), hash(v.id + 'eth2')); }
    return v;
  };

  // ---------------------------------------------------------
  // 효과 연결
  // ---------------------------------------------------------
  const LS = v => D.LOVESTYLE[ensure(v).loveStyle] || D.LOVESTYLE.COOL;
  // 바람 유혹 = 윤리관 × 연애 성향 × 가치관
  const baseTempt = M.temptMul;
  M.temptMul = v => clamp(baseTempt(v) * LS(v).tempt * (ensure(v).value === 'FAMILY' ? 0.5 : ensure(v).value === 'FREEDOM' ? 1.3 : 1), 0.02, 4);
  // 싸움 = 기질 × 가치관 충돌
  const baseFight = M.fightMul;
  M.fightMul = (a, b) => baseFight(a, b) * (a && b && a.id !== P && b.id !== P && (clash(ensure(a).value, ensure(b).value)) ? 1.6 : 1) * ([a, b].some(x => x && x.value === 'HARMONY') ? 0.7 : 1);
  V.apologyMul = v => (ensure(v).value === 'HARMONY' ? 2 : v.value === 'FRIENDSHIP' ? 1.5 : v.value === 'FAME' ? 0.6 : 1);
  // 설렘 증가량 = 연애 성향 · 가치관
  const origRom = Soc.addRomance;
  Soc.addRomance = function (a, b, amt, why) {
    const A = a !== P ? byId(a) : null;
    if (A && amt > 0) {
      ensure(A);
      let k = LS(A).rom * (A.value === 'LOVE' ? 1.3 : 1);
      if (A.loveStyle === 'DEVOTED') { const cur = A.crush && A.crush.target, pt = Soc.partnerOf(A.id); if ((cur && cur !== b) || (pt && pt !== b)) k *= 0.25; }
      if (A.loveStyle === 'FAST') { const f = Soc.F(a, b).romance; if (f > 60) k *= 0.6; }
      amt *= k;
    }
    return origRom(a, b, amt, why);
  };
  // 비슷한 가치관끼리는 더 빨리 친해짐
  const origAdd = Soc.addFriend;
  Soc.addFriend = function (a, b, dfp, dtr, why) {
    if (dfp > 0 && a !== P && b !== P) { const A = byId(a), B = byId(b); if (A && B && ensure(A).value === ensure(B).value) dfp *= 1.25; }
    return origAdd(a, b, dfp, dtr, why);
  };
  // 줏대없음: 부탁 · 공작에 잘 넘어감
  if (FM.Mediate) { const r0 = FM.Mediate.rate; FM.Mediate.rate = (a, b, mode) => clamp(r0(a, b, mode) + (ensure(a).loveStyle === 'SPINELESS' ? 20 : 0), 3, 97); }

  // 연애 성향 행동 (매시간)
  function loveTick() {
    const st = S();
    for (const pp of (st.pushpull || []).slice()) {
      if (day() < pp.day || Sim.time.hour() < 18) continue;
      st.pushpull.splice(st.pushpull.indexOf(pp), 1);
      const a = byId(pp.a), b = byId(pp.b);
      if (a && b && !Soc.partnerOf(a.id) && !Soc.partnerOf(b.id) && Soc.runConfession) { Soc.runConfession(a, b, 'fountain', { force: true }); Sim.log('confess', `🎭 밀당고수 ${a.name}, 어제는 튕기더니 오늘 ${b.name}에게 역고백하러 갔어요!`, [a.id, b.id], 2, { newsKind: 'drama' }); }
    }
    for (const v of st.villagers) {
      if (v.child || v.sceneId || (v.act && v.act.id === 'sleep')) continue;
      ensure(v);
      const pt = Soc.partnerOf(v.id);
      // 🦋 바람둥이: 근처 주민에게 윙크 · 추파
      if (v.loveStyle === 'PLAYBOY' && chance(0.18)) {
        const o = st.villagers.find(x => x !== v && !x.child && x.id !== pt && x.loc === v.loc && Math.hypot(x.x - v.x, x.z - v.z) < 7 && Soc.canRomance(v.id, x.id));
        if (o) {
          Sim.emote(v, '😉', 2.5); Sim.say(v, sty(v, pick([`${o.name}, 오늘따라 눈부시네~`, '어디서 좋은 향기 나지 않아?', `${o.name}, 나랑 차 한잔 어때?`])), 3);
          origRom(o.id, v.id, 4 * LS(o).rom, '추파'); origRom(v.id, o.id, 3, '추파');
          if (pt && pt !== P) { const pv = byId(pt); if (pv && FM.Needs) FM.Needs.bump(pv, 'possess', 20); }
          Sim.log('crush', `🦋 바람둥이 ${v.name}이(가) ${o.name}에게 윙크를 날렸어요${pt ? ` (${nm(pt)}이(가) 알면 큰일...)` : ''}`, [v.id, o.id], pt ? 1 : 0);
        }
      }
      // 🔗 집착형: 연인이 다른 사람과 있으면 독점욕 폭발 / 🧊 쿨한 연애: 질투 없음
      if (FM.Needs) {
        if (v.loveStyle === 'OBSESSIVE' && pt) FM.Needs.bump(v, 'possess', 4);
        if (v.loveStyle === 'COOL' || v.loveStyle === 'NOLOVE') FM.Needs.bump(v, 'possess', -6);
      }
      // 🍃 줏대없음: 자기를 더 좋아하는 사람 쪽으로 마음이 기울어짐
      if (v.loveStyle === 'SPINELESS' && v.crush && v.crush.target && chance(0.2)) {
        const fan = st.villagers.filter(o => o !== v && !o.child && Soc.canRomance(v.id, o.id) && Soc.F(o.id, v.id).romance > Soc.F(v.id, v.crush.target).romance + 10).sort((x, y) => Soc.F(y.id, v.id).romance - Soc.F(x.id, v.id).romance)[0];
        if (fan) { const old = v.crush.target; v.crush.target = fan.id; origRom(v.id, fan.id, 15, '마음이 흔들림'); Sim.log('crush', `🍃 줏대없는 ${v.name}의 마음이 ${nm(old)}에게서 ${fan.name}에게로 흔들렸어요...`, [v.id, fan.id], 1); }
      }
      // 💥 금사빠: 금방 식음
      if (v.crush && v.crush.target && (!v._cs || v._cs.t !== v.crush.target)) v._cs = { t: v.crush.target, d: day() };
      if (v.loveStyle === 'FAST' && v.crush && v.crush.target && v._cs && day() - v._cs.d >= 2 && chance(0.1)) { const t = v.crush.target; if (Soc.endCrush) Soc.endCrush(v); Sim.log('crush', `💥 금사빠 ${v.name}의 ${nm(t)}을(를) 향한 불꽃이 벌써 식었어요`, [v.id], 0); }
    }
  }
  // 이별 · 거절 반응도 연애 성향대로
  FM.bus.on('log', e => {
    try {
      if (!e || !e.who) return;
      if (e.type === 'breakup' || (e.type === 'confess' && /실패/.test(e.text))) {
        for (const id of e.who) {
          const v = byId(id); if (!v || v.id === P) continue; ensure(v);
          if (v.loveStyle === 'DEVOTED') { v.depression = clamp((v.depression || 0) + 30, 0, 100); if (W) W.remember(v, 'broken', '평생 잊지 못할 거야...'); setTimeout(() => Sim.say(v, sty(v, '...그래도 난 계속 기다릴 거야'), 4), 1200); }
          else if (v.loveStyle === 'COOL' || v.loveStyle === 'PLAYBOY') { v.depression = Math.max(0, (v.depression || 0) - 15); setTimeout(() => Sim.say(v, sty(v, v.loveStyle === 'PLAYBOY' ? '세상에 사람은 많으니까~' : '그래. 잘 지내.'), 3.5), 1200); }
        }
      }
      // 🎭 밀당고수: 고백을 한 번 거절한 뒤, 마음이 있으면 다음 날 역고백
      if (e.type === 'confess' && /실패/.test(e.text)) {
        const A = byId(e.who[0]), B = byId(e.who[1]);
        if (A && B && ensure(B).loveStyle === 'PUSHPULL' && Soc.F(B.id, A.id).romance >= 35) { const st = S(); st.pushpull = st.pushpull || []; st.pushpull.push({ a: B.id, b: A.id, day: day() + 1 }); if (W) W.remember(B, 'saw', `${A.name}의 고백을 일부러 한 번 튕겼어`, { about: A.id }); }
      }
      // 🦸 정의파는 바람 · 사기를 목격하면 가만있지 않음
      if (e.type === 'affair' && /목격/.test(e.text)) {
        const w = byId((e.who || [])[0]); if (w && w.moral === 'JUSTICE' && FM.Drama && FM.Drama.expose) {
          const af = (S().affairs || []).find(a => !a.over && !a.exposed && e.who.includes(a.a)); if (af && chance(0.6)) setTimeout(() => { try { FM.Drama.expose(af, w.id); } catch (er) { /* 무시 */ } }, 2000);
        }
      }
    } catch (er) { /* 무시 */ }
  });

  // 가치관 대화 (대화 엔진 의도로 등록)
  if (W && W.I) {
    W.I.valueTalk = {
      w: v => (ensure(v), 0.9),
      say: v => { const d = D.VALUES[ensure(v).value]; return { text: sty(v, `${d.icon} ${d.line}`), choices: [{ k: 'agree', label: '👍 "완전 공감해!"' }, { k: 'mine', label: '🤔 "나는 좀 생각이 달라"' }, { k: 'ask', label: '💬 "왜 그렇게 생각해?"' }] }; },
      on: (v, k) => {
        const d = D.VALUES[v.value];
        if (k === 'agree') { Soc.addFriend(v.id, P, 4, 3, '가치관 공감'); Sim.emote(v, '😊'); return { text: sty(v, '역시! 우리 잘 맞는다니까!') }; }
        if (k === 'mine') { const open = v.value === 'HARMONY' || v.value === 'GROWTH' || v.value === 'FREEDOM'; Soc.addFriend(v.id, P, open ? 2 : -2, open ? 2 : -1, '가치관 차이'); return { text: sty(v, open ? '오, 그런 생각도 있구나. 재밌다!' : '...흠. 그래도 난 내 생각이 맞다고 봐.') }; }
        return { text: sty(v, `${d.desc.split('.')[0]}... 그게 나한텐 제일 중요하거든.`) };
      },
    };
  }

  // 프로필 칩 확장
  const baseChips = M.chips;
  M.chips = v => { if (!v || v.id === P || v.child) return ''; ensure(v); const a = D.VALUES[v.value], b = D.VALUES[v.value2], c = D.LOVESTYLE[v.loveStyle]; return baseChips(v) + `<span class="k l7" title="${a.desc}">💎 ${a.icon} ${a.name}</span><span class="k l7 sub" title="${b.desc}">${b.icon} ${b.name}</span><span class="k l8" title="${c.desc}">💘 ${c.icon} ${c.name}</span>`; };
  V.clash = clash;

  FM.bus.on('hour', h => { try { const st = S(); if (!st) return; for (const v of st.villagers) ensure(v); rebalanceEthics(); loveTick(); } catch (e) { console.error('values', e); } });
})();
