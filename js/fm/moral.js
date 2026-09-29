/* =========================================================
 *  도덕 의식 & 기질 — 성격 세분화 (5 · 6번째 레이어)
 *
 *  ⚖️ 도덕 성향 (양심 점수): 천사표 · 정직파 · 평범한 양심 · 실속파 · 뻔뻔파 · 악동
 *     → 바람 · 사기 · 이간질 같은 나쁜 짓의 유혹, 저지른 뒤의 죄책감 · 우울, 자백 여부
 *  🌡️ 기질: 평화주의 · 뒤끝 없음 · 예민함 · 뒤끝형 · 다혈질
 *     → 싸움 빈도, 사이가 나빠지는 정도, 화해 · 회복 속도
 *
 *  그리고 섬 전체가 너무 싸우지 않도록: 부정 이벤트 완화 · 하루 상한 · 시간이 약 · 먼저 사과하기
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, D = FM.D, W = FM.Will;
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
  const M = (FM.Moral = {});

  D.MORAL = {
    SAINT: { name: '천사표', icon: '😇', con: 95, desc: '나쁜 짓은 상상도 못 해요. 작은 잘못에도 밤새 자책해요' },
    HONEST: { name: '정직파', icon: '🙆', con: 80, desc: '원칙을 지키고 거짓말을 싫어해요. 잘못하면 스스로 털어놓아요' },
    ORDINARY: { name: '평범한 양심', icon: '🙂', con: 60, desc: '가끔 흔들리지만, 잘못하면 미안해서 끙끙 앓아요' },
    PRAGMATIC: { name: '실속파', icon: '🤑', con: 40, desc: '"들키지만 않으면 괜찮지 않아?" 죄책감은 조금만' },
    SHAMELESS: { name: '뻔뻔파', icon: '😏', con: 18, desc: '나쁜 짓도 당당하게. 들켜도 "그래서 뭐?"' },
    RASCAL: { name: '악동', icon: '😈', con: 8, desc: '말썽이 취미. 들키면 오히려 자랑해요' },
  };
  D.TEMPER = {
    PEACEFUL: { name: '평화주의', icon: '🕊️', fight: 0.3, neg: 0.45, heal: 1.6, desc: '싸움을 피하고 먼저 사과해요' },
    FORGIVING: { name: '뒤끝 없음', icon: '🌤️', fight: 0.7, neg: 0.55, heal: 1.9, desc: '화내도 금방 풀려요' },
    SENSITIVE: { name: '예민함', icon: '🌧️', fight: 0.9, neg: 0.9, heal: 0.9, desc: '작은 말에도 상처받아요' },
    GRUDGE: { name: '뒤끝형', icon: '🧊', fight: 0.8, neg: 0.85, heal: 0.4, desc: '한번 서운하면 오래 기억해요' },
    HOTHEAD: { name: '다혈질', icon: '🔥', fight: 1.5, neg: 1.0, heal: 1.3, desc: '욱하지만 금방 식어요' },
  };
  // 성격 조합에 따른 성향 가중치
  const MW = {
    ROMANTIC: { ORDINARY: 3, HONEST: 2, PRAGMATIC: 1 }, ATHLETIC: { HONEST: 3, ORDINARY: 2, PRAGMATIC: 1 }, SCHOLARLY: { HONEST: 3, SAINT: 1, ORDINARY: 2 },
    LAZY: { ORDINARY: 3, PRAGMATIC: 2 }, EXTROVERT: { ORDINARY: 2, PRAGMATIC: 2, SHAMELESS: 1, RASCAL: 1 }, INTROVERT: { HONEST: 2, SAINT: 1, ORDINARY: 2 },
    SNOB: { PRAGMATIC: 3, SHAMELESS: 1, HONEST: 1 }, CRANKY: { PRAGMATIC: 2, SHAMELESS: 2, ORDINARY: 2, HONEST: 1 }, ARTISTIC: { ORDINARY: 2, PRAGMATIC: 1, RASCAL: 1, SAINT: 1 },
    ANXIOUS: { HONEST: 2, SAINT: 2, ORDINARY: 1 },
  };
  const TW = {
    ROMANTIC: { SENSITIVE: 2, FORGIVING: 2, PEACEFUL: 1 }, ATHLETIC: { FORGIVING: 3, HOTHEAD: 2 }, SCHOLARLY: { PEACEFUL: 2, SENSITIVE: 2, GRUDGE: 1 },
    LAZY: { PEACEFUL: 3, FORGIVING: 2 }, EXTROVERT: { FORGIVING: 3, HOTHEAD: 1 }, INTROVERT: { PEACEFUL: 2, SENSITIVE: 2, GRUDGE: 1 },
    SNOB: { GRUDGE: 2, SENSITIVE: 2, PEACEFUL: 1 }, CRANKY: { HOTHEAD: 3, GRUDGE: 2, FORGIVING: 1 }, ARTISTIC: { SENSITIVE: 3, HOTHEAD: 1, FORGIVING: 1 },
    ANXIOUS: { SENSITIVE: 3, PEACEFUL: 2 },
  };
  const hash = s => { let h = 7; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  function weighted(obj, seed) {
    const tot = Object.values(obj).reduce((a, b) => a + b, 0); let r = (seed % 10000) / 10000 * tot;
    for (const [k, w] of Object.entries(obj)) { if ((r -= w) < 0) return k; }
    return Object.keys(obj)[0];
  }
  function ensure(v) {
    if (!v || v.id === P) return v;
    if (!v.moral || !D.MORAL[v.moral]) {
      const mw = Object.assign({}, MW[v.keys.L1] || { ORDINARY: 1 });
      if (has(v, 'PRANKSTER')) mw.RASCAL = (mw.RASCAL || 0) + 3;
      if (has(v, 'CYNICAL')) mw.SHAMELESS = (mw.SHAMELESS || 0) + 2;
      if (has(v, 'WARM')) { mw.SAINT = (mw.SAINT || 0) + 1; mw.HONEST = (mw.HONEST || 0) + 1; }
      if (has(v, 'FORMAL')) mw.HONEST = (mw.HONEST || 0) + 2;
      v.moral = weighted(mw, hash(v.id + ':moral'));
    }
    if (!v.temper || !D.TEMPER[v.temper]) {
      const tw = Object.assign({}, TW[v.keys.L1] || { FORGIVING: 1 });
      if (has(v, 'WARM')) tw.FORGIVING = (tw.FORGIVING || 0) + 2;
      if (has(v, 'CYNICAL')) tw.GRUDGE = (tw.GRUDGE || 0) + 1;
      if (has(v, 'PASSIONATE')) tw.HOTHEAD = (tw.HOTHEAD || 0) + 2;
      v.temper = weighted(tw, hash(v.id + ':temper'));
    }
    if (v.guilt === undefined) v.guilt = 0;
    return v;
  }
  M.ensure = ensure;
  const MO = v => D.MORAL[ensure(v).moral] || D.MORAL.ORDINARY;
  const TE = v => D.TEMPER[ensure(v).temper] || D.TEMPER.FORGIVING;
  M.con = v => (!v || v.id === P ? 60 : MO(v).con);
  M.temptMul = v => clamp((100 - M.con(v)) / 45, 0.05, 2.2);
  M.fightMul = (a, b) => ((a && a.id !== P ? TE(a).fight : 1) + (b && b.id !== P ? TE(b).fight : 1)) / 2;
  M.chips = v => { if (!v || v.id === P || v.child) return ''; const m = MO(v), t = TE(v); return `<span class="k l5" title="${m.desc}">⚖️ ${m.icon} ${m.name}</span><span class="k l6" title="${t.desc}">🌡️ ${t.icon} ${t.name}</span>`; };

  // 새 주민 · 불러온 주민 모두 성향 부여
  const origMake = Sim.makeVillager;
  Sim.makeVillager = function (o) { const v = origMake(o); ensure(v); return v; };

  // ---------------------------------------------------------
  // 1. 사이 나빠지는 정도 완화 — 주민끼리의 감점만 (기질 반영 + 하루 상한)
  // ---------------------------------------------------------
  const origAdd = Soc.addFriend;
  Soc.addFriend = function (a, b, dfp, dtr, why) {
    if ((dfp < 0 || dtr < 0) && a !== P && b !== P) {
      const A = byId(a), B = byId(b);
      if (A && B) {
        const k = TE(A).neg;
        const st = S(); st.negDay = st.negDay && st.negDay.day === day() ? st.negDay : { day: day(), m: {} };
        const key = a < b ? a + '~' + b : b + '~' + a;
        const used = st.negDay.m[key] || 0;
        let f = dfp < 0 ? dfp * k : dfp;
        if (f < 0) { const room = Math.max(0, 12 - used); f = Math.max(f, -room); st.negDay.m[key] = used - f; }
        const r = Soc.rel(a, b); r.lastConflict = day();
        return origAdd(a, b, f, dtr < 0 ? dtr * k : dtr, why);
      }
    }
    return origAdd(a, b, dfp, dtr, why);
  };

  // 시간이 약: 매일 새벽 나쁜 사이가 조금씩 회복 · 앙숙/원수가 누그러짐
  function heal() {
    const st = S(); const today = day();
    for (const r of Object.values(st.rel || {})) {
      if (!r || r.subject_id === P || r.target_id === P) continue;
      const A = byId(r.subject_id), B = byId(r.target_id); if (!A || !B) continue;
      const h = (TE(A).heal + TE(B).heal) / 2;
      const fresh = (r.lastConflict || 0) >= today - 1 || (r.misunderstanding && r.misunderstanding.until > today);
      if (!fresh && r.friendship_point < 35) { r.friendship_point = Math.min(35, r.friendship_point + 2.5 * h); r.trust_level = Math.min(40, (r.trust_level || 0) + 1.5 * h); }
      if (r.bond === 'NEMESIS' && !fresh && (r.friendship_point >= 18 || chance(0.25 * h))) {
        r.bond = null; r.argues = 0;
        if (chance(0.5)) Sim.log('rel', `🌤️ ${A.name}와(과) ${B.name} 사이가 조금 누그러졌어요`, [A.id, B.id], 0);
      } else if (r.bond === 'ENEMY' && !fresh && (r.lastGrowl || 0) < today - 2 && chance(0.3 * h)) {
        r.bond = 'NEMESIS'; r.friendship_point = Math.max(r.friendship_point, 12);
        Sim.log('rel', `🧊→🌤️ 원수였던 ${A.name}와(과) ${B.name}, 시간이 흘러 앙금이 조금 풀렸어요`, [A.id, B.id], 1);
      }
    }
  }

  // 따뜻한 순간들 (먼저 사과하기 · 위로 · 함께 산책)
  function kindness() {
    const st = S();
    const vs = st.villagers.filter(v => !v.child && !v.sceneId && !v.talkingToPlayer && v.loc !== 'metro');
    const pairs = [];
    for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) { const a = vs[i], b = vs[j]; if (a.loc === b.loc && (a.loc !== 'island' || Math.hypot(a.x - b.x, a.z - b.z) < 30)) pairs.push([a, b]); }
    if (!pairs.length) return;
    const [x, y] = pick(pairs); const [a, b] = chance(0.5) ? [x, y] : [y, x];
    const r = Soc.rel(a.id, b.id);
    const kind = ensure(a).temper === 'PEACEFUL' || a.temper === 'FORGIVING' || M.con(a) >= 70;
    if ((r.bond === 'NEMESIS' || r.misunderstanding || (r.argues || 0) > 0 || (r.lastConflict || 0) >= day() - 2) && kind && chance(0.7)) {
      origAdd(a.id, b.id, 9, 6, '사과'); origAdd(b.id, a.id, 6, 4, '사과');
      r.misunderstanding = null; r.argues = 0; if (r.bond === 'NEMESIS') r.bond = null;
      Sim.emote(a, '🙏'); Sim.emote(b, '😊');
      if (W) { W.remember(a, 'reconcile', `${b.name}에게 먼저 사과했어`, { about: b.id }); W.remember(b, 'reconcile', `${a.name}이(가) 먼저 사과해 줬어`, { about: a.id }); }
      return Sim.log('rel', `🙏 ${a.name}이(가) ${b.name}에게 먼저 사과했어요. 둘은 다시 웃으며 얘기해요`, [a.id, b.id], 1);
    }
    if ((b.stress || 0) > 55 && r.friendship_point >= 25) {
      origAdd(a.id, b.id, 6, 6, '위로'); b.stress = Math.max(0, b.stress - 12); if (FM.Needs) FM.Needs.bump(b, 'frustr', -15);
      Sim.emote(a, '🫂'); return Sim.log('friend', `🫂 ${a.name}이(가) 힘들어하는 ${b.name}을(를) 다정하게 위로했어요`, [a.id, b.id], 0);
    }
    if (chance(0.5)) { origAdd(a.id, b.id, 4, 3, '산책'); return Sim.log('friend', `🚶 ${a.name}와(과) ${b.name}이(가) 함께 산책하며 수다를 떨었어요`, [a.id, b.id], 0); }
  }

  // ---------------------------------------------------------
  // 2. 죄책감 — 양심에 따라 우울 · 자백 · 정리 / 뻔뻔하면 당당
  // ---------------------------------------------------------
  const affairOfV = v => (S().affairs || []).find(a => !a.over && a.a === v.id);
  M.bumpGuilt = (v, amount) => { if (!v || v.id === P) return; ensure(v); v.guilt = clamp(v.guilt + amount * M.con(v) / 60, 0, 100); };
  function guiltTick() {
    const st = S();
    for (const v of st.villagers) {
      if (v.child) continue;
      ensure(v);
      const con = M.con(v);
      const af = affairOfV(v);
      if (af) v.guilt = clamp(v.guilt + con * 0.1, 0, 100);
      else v.guilt = clamp(v.guilt - (1 + (100 - con) / 40), 0, 100);
      if (v.guilt > 30) {
        v.depression = clamp((v.depression || 0) + v.guilt * 0.03, 0, 100);
        v.stress = clamp((v.stress || 0) + v.guilt * 0.02, 0, 100);
        if (chance(0.15)) Sim.emote(v, pick(['😔', '💧', '😣']), 3);
      }
      // 한계에 달하면: 정직한 주민은 자백, 보통은 몰래 정리
      if (af && v.guilt >= 70) {
        const pt = byId(af.partner);
        if (con >= 75 && pt && !pt.sceneId && !v.sceneId) {
          v.guilt = 35;
          Sim.scene({ title: '💧 죄책감의 고백', major: true, actors: { A: v, B: pt }, steps: [
            { go: 'A', to: { actor: 'B', near: 1.2 }, max: 90 }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
            { emote: 'A', e: '😣', t: 2 }, { say: 'A', text: sty(v, `${pt.name}... 나 너한테 숨긴 게 있어. 더는 거짓말 못 하겠어`), t: 4 },
            { say: 'A', text: sty(v, `사실 ${nm(af.b)}(이)랑 몰래 만났어... 정말 미안해`), t: 4 }, { fx: 'brokenHeart', at: 'B' }, { emote: 'B', e: '😢', t: 2.5 },
            { say: 'B', text: sty(pt, M.con(pt) >= 70 || ensure(pt).temper === 'FORGIVING' ? '...솔직하게 말해 줘서 고마워. 시간을 좀 줘' : '...어떻게 나한테 이럴 수 있어!'), t: 3.5 },
          ], onEnd: () => {
            af.known = true;
            if (FM.Drama && FM.Drama.expose) try { FM.Drama.expose(af, v.id); } catch (e) { af.over = true; }
          } });
          Sim.log('affair', `😭 죄책감을 견디지 못한 ${v.name}이(가) ${pt.name}에게 스스로 바람을 고백했어요`, [v.id, pt.id], 3, { newsKind: 'drama' });
        } else if (con >= 45) {
          af.over = true; v.guilt = 25;
          if (W) W.remember(v, 'broken', `죄책감 때문에 ${nm(af.b)}와(과)의 비밀 만남을 끝냈어`);
          Sim.log('affair', `🕊️ 죄책감에 잠 못 이루던 ${v.name}이(가) 비밀 연애를 조용히 정리했어요`, [v.id, af.b], 1, { secret: true });
        }
      }
      // 뻔뻔파 · 악동: 오히려 당당
      if (af && con < 30 && chance(0.12)) {
        Sim.say(v, sty(v, pick(['들키지만 않으면 되지~ 후후', '인생은 한 번뿐이잖아?', '사랑에 죄가 있나?'])), 3.5);
        if (FM.Needs) FM.Needs.bump(v, 'flex', 10);
      }
    }
  }
  // 바람이 들통났을 때 반응도 양심에 따라
  FM.bus.on('log', e => {
    try {
      if (!e) return;
      if (e.type === 'affair' && /바람 들통/.test(e.text)) {
        const ch = (e.who || []).map(byId).find(v => v && v.id !== P && (S().affairs || []).some(af => af.a === v.id));
        if (!ch) return; ensure(ch);
        if (M.con(ch) < 30) setTimeout(() => Sim.say(ch, sty(ch, pick(['그래서 뭐? 마음이 가는 걸 어떡해', '흥, 들킬 줄 알았지 뭐', '...난 후회 안 해'])), 4), 1500);
        else { ch.guilt = clamp(ch.guilt + M.con(ch) * 0.6, 0, 100); ch.depression = clamp((ch.depression || 0) + M.con(ch) * 0.35, 0, 100); if (W) W.remember(ch, 'broken', '바람이 들통났어... 모두에게 미안해'); }
      }
      // 사기 · 몸싸움 · 이간질 → 저지른 쪽 죄책감
      if (e.type === 'gossip' && /가짜/.test(e.text)) { const a = byId((e.who || [])[0]); M.bumpGuilt(a, 40); }
      if (e.type === 'rel' && /몸싸움/.test(e.text)) for (const id of e.who || []) M.bumpGuilt(byId(id), 20);
    } catch (er) { /* 무시 */ }
  });
  // 속마음
  const origThought = Sim.thought;
  Sim.thought = function (v) {
    if (v && v.guilt >= 35 && v.id !== P) {
      const af = affairOfV(v);
      return af ? pick([`${nm(af.partner)}한테 너무 미안해... 이러면 안 되는데`, '죄책감 때문에 밥이 안 넘어가', '모든 걸 털어놓고 싶어...']) : pick(['내가 너무 했어... 사과하고 싶다', '마음이 무거워...']);
    }
    if (v && v.id !== P && v.guilt < 5 && affairOfV(v) && M.con(v) < 30) return '들키지만 않으면 괜찮아~';
    return origThought(v);
  };

  // ---------------------------------------------------------
  // 3. 나쁜 짓 부탁 — 양심 있는 주민은 거절, 뻔뻔하면 신나서
  // ---------------------------------------------------------
  const BAD = { sabotage: 1, spy: 1, fake: 1, enemy: 1, affair: 1, badmouth: 1 };
  if (W && W.indExtra) {
    for (const k of Object.keys(BAD)) {
      const orig = W.indExtra[k]; if (!orig) continue;
      W.indExtra[k] = (a, b) => {
        ensure(a);
        const con = M.con(a);
        if (con >= 80 || (con >= 60 && chance(0.4))) {
          origAdd(a.id, P, 0, -3, '나쁜 부탁');
          return { text: sty(a, pick(con >= 90 ? ['그, 그런 나쁜 짓은 못 해...! 상상만 해도 심장이 쿵쾅거려', '안 돼. 누군가 상처받는 일은 싫어.'] : ['그건 비겁한 짓이야. 난 안 할래.', '미안, 그런 건 내 원칙에 어긋나.', '...너도 그런 말 하지 마. 실망이야.'])) };
        }
        const out = orig(a, b);
        if (con < 30 && out && out.text && chance(0.6)) out.text += sty(a, pick([' (히죽) 재밌겠다!', ' 후후, 이런 거 내 전문이지~']));
        M.bumpGuilt(a, 15);
        return out;
      };
    }
  }
  if (FM.Mediate) {
    const origRate = FM.Mediate.rate;
    FM.Mediate.rate = (a, b, mode) => { const r = origRate(a, b, mode); return BAD[mode] ? clamp(r * (1.35 - M.con(a) / 100), 3, 97) : r; };
  }

  // ---------------------------------------------------------
  // 틱
  // ---------------------------------------------------------
  let accK = 0;
  const origTick = Soc.tick;
  Soc.tick = function (dtR, dMin) {
    origTick(dtR, dMin);
    try { accK += dMin; if (accK >= 50) { accK = 0; kindness(); } } catch (e) { console.error('moral', e); }
  };
  FM.bus.on('hour', h => {
    try {
      const st = S(); if (!st) return;
      for (const v of st.villagers) ensure(v);
      guiltTick();
      if (h === 5) heal();
    } catch (e) { console.error('moral hour', e); }
  });
  M.heal = heal; M.kindness = kindness; M.guiltTick = guiltTick;
})();
