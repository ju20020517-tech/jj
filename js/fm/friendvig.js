/* =========================================================
 *  우정 드라마 — 섬에는 싸움만 있는 게 아니다
 *   👯 우정의 맹세        절친이 되는 순간, 노을 언덕에서 새끼손가락 약속
 *   🎂 깜짝 생일 파티     친구들이 몰래 준비한 서프라이즈
 *   ☂️ 우산 하나          비 오는 날, 풀 죽은 친구에게 우산을 씌워 줌
 *   🕊️ 우정 회복 대작전   다퉜던 옛 친구가 편지를 들고 달려옴
 *   🛡️ 친구 편들어 주기   다투는 두 친구 사이에 뛰어들어 말림
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, Cut = FM.Cut, W = FM.Will;
  const P = 'P';
  const S = () => Sim.get();
  const byId = id => (id === P ? S().player : Sim.byId(id));
  const day = () => Sim.time.day();
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const sty = (v, t) => (v && v.id !== P && W ? W.sty(v, FM.josa(t)) : FM.josa(t));
  const fp = (a, b) => Soc.rel(a.id, b.id).friendship_point;
  const adults = () => S().villagers.filter(v => !v.child && !v.staff && !v.visitor);
  const free = v => v && !v.sceneId && !v.talkingToPlayer && !(v.status && v.status.hospital);
  const keyOf = cast => Object.values(cast).map(v => v.id).sort().join('|');
  const mk = (theme, cast, beats, o = {}) => Object.assign({ theme, cast, beats, key: keyOf(cast), vig: true }, o);
  const logD = (t, ids, imp = 2) => Sim.log('friend', t, ids, imp, { newsKind: 'drama' });
  const hash = s => { let h = 7; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const bday = v => (v.bday || (v.bday = (hash(v.id + 'bd') % 28) + 1));
  const FV = (FM.FriendVig = {});

  // 👯 우정의 맹세
  function oath(A, B) {
    const cast = { A, B };
    const beats = [
      { narr: '(해가 지는 언덕 위... 두 친구가 나란히 섰다)', who: '해설', icon: '🌇', shot: ['wide'] },
      { say: 'A', text: sty(A, `${B.name}, 우리 약속하자. 무슨 일이 있어도 서로 편이 되어 주기로!`), shot: 'close' },
      { emo: 'B', e: '🥹' }, { say: 'B', text: sty(B, '...응! 너는 내 평생 친구야!') },
      { poses: [['A', 'highfive'], ['B', 'highfive']], t: 1300 }, { fx: 'sparkle', at: 'A' },
      { split: ['A', 'B'], caps: ['🤙 약속', '🤙 약속'], t: 2000 },
      { say: 'A', text: sty(A, '나중에 할머니 할아버지가 돼도 이 언덕에 같이 오자!') }, { fx: 'hearts', at: 'B' },
      { outcome: 'happy', endText: ['👯 우정의 맹세', `${A.name} & ${B.name}, 평생 친구 결성!`] },
    ];
    const c = mk('friend', cast, beats, { venue: { loc: 'island', x: -72, z: -86, place: 'cliff' }, sub: '우정의 맹세' });
    c.resolve = () => { Soc.addFriend(A.id, B.id, 10, 12, '우정의 맹세'); Soc.addFriend(B.id, A.id, 10, 12, '우정의 맹세'); if (W && W.setBond) W.setBond(A.id, B.id, 'BESTIE', true); if (W) { W.remember(A, 'promise', `${B.name}와(과) 평생 친구하기로 약속했어`, { about: B.id }); W.remember(B, 'promise', `${A.name}와(과) 평생 친구하기로 약속했어`, { about: A.id }); } logD(`👯 ${A.name}와(과) ${B.name}이(가) 노을 언덕에서 '평생 친구'를 맹세했어요!`, [A.id, B.id]); };
    return c;
  }
  // 🎂 깜짝 생일 파티
  function birthday(A, friends) {
    const ks = ['B', 'C', 'D'].slice(0, friends.length);
    const cast = Object.assign({ A }, Object.fromEntries(ks.map((k, i) => [k, friends[i]])));
    const home = A.home && FM.INTERIORS[A.home] ? { loc: A.home } : { loc: 'island', x: 3, z: 19, place: 'plaza' };
    const beats = [
      { narr: `(${A.name}이(가) 집에 돌아왔는데... 불이 꺼져 있다?)`, who: '해설', icon: '🌙', shot: ['wide'] },
      { say: 'A', text: sty(A, '어...? 아무도 없나...') }, { emo: 'A', e: '❓' },
      ...ks.map(k => ({ show: k, t: 120 })), { fx: 'flash' }, { prop: { kind: 'cake', x: 0, z: 0.9, id: 'cake', drop: false } },
      { say: ks[0], text: '서프라이즈~!!! 🎉', hot: true, shot: 'wide' }, { fx: 'fireworks' }, { poses: ks.map(k => [k, 'cheer']), t: 1400 },
      { say: ks[ks.length - 1], text: sty(friends[friends.length - 1], `${A.name}, 생일 축하해!! 우리가 몰래 준비했어!`) },
      { emo: 'A', e: '😭' }, { say: 'A', text: sty(A, '다들... 내 생일 기억해 준 거야? 흐아앙 고마워!!'), hot: true }, { pose: 'A', p: 'wipeTear', t: 1300 },
      { split: ['A'].concat(ks), caps: ['🎂 주인공'].concat(ks.map(() => '🎉')), t: 2000 },
      { fx: 'hearts', at: 'A' }, { outcome: 'happy', endText: ['🎂 깜짝 생일 파티', `${A.name}, 생일 축하해!`] },
    ];
    const pos = [[-1.3, 0.3], [1.3, 0.3], [0, -1.1]];
    const c = mk('party', cast, beats, { venue: home, slots: Object.assign({ A: [0, 0.2] }, Object.fromEntries(ks.map((k, i) => [k, pos[i]]))), hidden: ks, sub: '깜짝 생일 파티' });
    c.resolve = () => {
      for (const f of friends) { Soc.addFriend(A.id, f.id, 8, 6, '생일 파티'); Soc.addFriend(f.id, A.id, 5, 4, '생일 파티'); }
      A.stress = Math.max(0, (A.stress || 0) - 30); if (FM.Needs) { FM.Needs.bump(A, 'frustr', -40); FM.Needs.bump(A, 'social', -60); }
      if (W) W.remember(A, 'gift', `${friends.map(f => f.name).join(', ')}이(가) 깜짝 생일 파티를 열어 줬어`);
      logD(`🎂 오늘은 ${A.name}의 생일! ${friends.map(f => f.name).join(', ')}이(가) 깜짝 파티를 열어 줬어요`, [A.id].concat(friends.map(f => f.id)));
    };
    return c;
  }
  // ☂️ 우산 하나
  function umbrella(A, B) {
    const cast = { A, B };
    const beats = [
      { narr: `(비가 내린다... 우산도 없이 쪼그려 앉은 ${A.name})`, who: '해설', icon: '🌧️', shot: ['wide'] },
      { pose: 'A', p: 'sadSit', t: 1300, noshot: true }, { shot: ['close', 'A'], t: 900 }, { say: 'A', text: sty(A, '...오늘은 왜 이렇게 되는 일이 없지') },
      { show: 'B' }, { move: ['B', 0.75, 0.15], run: true, t: 1500 }, { prop: { kind: 'umbrella', x: 0.35, z: 0.1, id: 'umb' } },
      { say: 'B', text: sty(B, '감기 걸려. 같이 쓰자.'), shot: 'close' }, { emo: 'A', e: '🥹' },
      { say: 'A', text: sty(A, `...${B.name}. 너는 늘 이렇게 와 주네`) }, { say: 'B', text: sty(B, '당연하지. 친구잖아.') },
      { pose: 'A', p: 'hug', t: 1500 }, { fx: 'sparkle', at: 'B' },
      { outcome: 'happy', endText: ['☂️ 우산 하나', '비 오는 날에도 마음은 따뜻했다'] },
    ];
    const c = mk('umbrella', cast, beats, { slots: { A: [0, 0], B: [-3.2, 0.9] }, hidden: ['B'], sub: '우산 하나', venue: A.loc === 'island' ? { loc: 'island', x: A.x, z: A.z } : { loc: 'island', x: -84, z: 24, place: 'park' } });
    c.resolve = () => { Soc.addFriend(A.id, B.id, 10, 10, '우산'); A.stress = Math.max(0, (A.stress || 0) - 25); if (FM.Needs) FM.Needs.bump(A, 'frustr', -35); if (W) W.remember(A, 'gift', `비 오는 날 ${B.name}이(가) 우산을 씌워 줬어`, { about: B.id }); logD(`☂️ 비 오는 날, ${B.name}이(가) 풀 죽은 ${A.name}에게 우산을 씌워 줬어요`, [A.id, B.id], 1); };
    return c;
  }
  // 🕊️ 우정 회복 대작전
  function restore(A, B) {
    const cast = { A, B };
    const beats = [
      { narr: `(다툰 뒤로 말 한마디 없던 ${A.name}와(과) ${B.name}...)`, who: '해설', icon: '💭', shot: ['wide'] },
      { pose: 'A', p: 'write', t: 1500 }, { say: 'A', text: sty(A, '(편지를 꾹꾹 눌러 쓴다) ...이번엔 내가 먼저 용기 낼게') },
      { move: ['A', -0.8, 0], run: true, t: 1400 }, { prop: { kind: 'letter', x: 0, z: 0.35, id: 'lt' } },
      { say: 'A', text: sty(A, `${B.name}! 그때는 내가 정말 미안했어. 네가 없으니까 하나도 재미없더라`), hot: true, shot: 'close' },
      { emo: 'B', e: '😢' }, { say: 'B', text: sty(B, '...바보. 나도 계속 먼저 말 걸고 싶었단 말이야!') },
      { poses: [['A', 'hug'], ['B', 'hug']], t: 1800 }, { fx: 'hearts', at: 'A' },
      { outcome: 'happy', endText: ['🕊️ 우정 회복', '다시 예전처럼'] },
    ];
    const c = mk('friend', cast, beats, { slots: { A: [-3.2, 0.6], B: [0.8, 0] }, venue: { loc: 'island', x: -84, z: 24, place: 'park' }, sub: '우정 회복 대작전' });
    c.resolve = () => {
      const r = Soc.rel(A.id, B.id); r.misunderstanding = null; r.argues = 0; if (['NEMESIS', 'ENEMY'].includes(r.bond)) r.bond = 'OLD_FRIEND';
      r.friendship_point = Math.max(r.friendship_point, 45); r.trust_level = Math.max(r.trust_level || 0, 40);
      if (W) { W.remember(A, 'reconcile', `${B.name}와(과) 다시 친구가 됐어`, { about: B.id }); W.remember(B, 'reconcile', `${A.name}이(가) 편지를 들고 와서 화해했어`, { about: A.id }); }
      logD(`🕊️ 다퉜던 ${A.name}와(과) ${B.name}이(가) 편지 한 통으로 다시 친구가 됐어요`, [A.id, B.id]);
    };
    return c;
  }
  // 🛡️ 친구 편들어 주기 — 싸움 말리기
  function defender(A, B, C) {
    const cast = { A, B, C };
    const beats = [
      { poses: [['A', 'argue'], ['B', 'argue']], t: 1300 }, { say: 'A', text: sty(A, '너 진짜 너무한 거 알아?!'), hot: true }, { say: 'B', text: sty(B, '뭐? 너야말로!'), hot: true },
      { show: 'C' }, { move: ['C', 0, 0.55], run: true, t: 1300 }, { fx: 'shock' },
      { say: 'C', text: sty(C, `그만해!! 둘 다 내 소중한 친구란 말이야!`), hot: true, shot: 'zoom' },
      { poses: [['A', 'look'], ['B', 'look']], t: 1200 }, { say: 'C', text: sty(C, '서로 한 발씩만 물러나. 응?') },
      { say: 'A', text: sty(A, '...미안. 내가 좀 흥분했어') }, { say: 'B', text: sty(B, '...나도 미안') }, { poses: [['A', 'highfive'], ['B', 'highfive'], ['C', 'cheer']], t: 1400 },
      { outcome: 'happy', endText: ['🛡️ 친구 편들어 주기', `${C.name} 덕분에 싸움이 멈췄다`] },
    ];
    const c = mk('friend', cast, beats, { slots: { A: [-0.9, 0], B: [0.9, 0], C: [3.2, 1.0] }, hidden: ['C'], sub: '둘 다 내 친구야!' });
    c.resolve = () => { Soc.addFriend(A.id, B.id, 10, 6, '중재'); Soc.addFriend(B.id, A.id, 10, 6, '중재'); const r = Soc.rel(A.id, B.id); r.argues = 0; r.misunderstanding = null; if (r.bond === 'NEMESIS') r.bond = null; Soc.addFriend(A.id, C.id, 5, 5); Soc.addFriend(B.id, C.id, 5, 5); logD(`🛡️ ${C.name}이(가) 다투던 ${A.name}와(과) ${B.name}을(를) 말려서 화해시켰어요`, [C.id, A.id, B.id], 1); };
    return c;
  }
  FV.make = { oath, birthday, umbrella, restore, defender };

  // ---------------------------------------------------------
  // 발생 조건
  // ---------------------------------------------------------
  const baseFromLog = Cut.fromLog;
  Cut.fromLog = function (e) {
    try {
      if (e && e.type === 'rel' && /👯 절친 —/.test(e.text)) { const [a, b] = (e.who || []).map(byId); if (a && b && a.id !== P && b.id !== P) return oath(a, b); }
      if (e && e.type === 'rel' && /💢/.test(e.text) && /말다툼/.test(e.text)) {
        const [a, b] = (e.who || []).map(byId);
        if (a && b && a.id !== P && b.id !== P) {
          const C = adults().filter(o => o !== a && o !== b && free(o) && o.loc === a.loc && fp(o, a) >= 45 && fp(o, b) >= 45).sort((x, y) => (fp(y, a) + fp(y, b)) - (fp(x, a) + fp(x, b)))[0];
          if (C && chance(0.6)) return defender(a, b, C);
        }
      }
    } catch (er) { console.error('friendvig', er); }
    return baseFromLog(e);
  };
  const cool = {};
  const ok = (k, h) => { const t = S().time; if (cool[k] && t - cool[k] < h * 60) return false; cool[k] = t; return true; };
  FM.bus.on('hour', h => {
    try {
      const st = S(); if (!st) return;
      const vs = adults().filter(free);
      // 생일 파티 (18시)
      if (h === 18) {
        const today = ((day() - 1) % 28) + 1;
        for (const A of vs) {
          if (bday(A) !== today || !ok('bd' + A.id, 24)) continue;
          const fr = vs.filter(o => o !== A && fp(A, o) >= 40).sort((x, y) => fp(A, y) - fp(A, x)).slice(0, 3);
          if (fr.length >= 1) { Cut.enqueue(birthday(A, fr), true); break; }
        }
      }
      // 우산 (비 오는 날)
      if (/rain|storm/.test(st.weather.type || '') && chance(0.3) && ok('umb', 12)) {
        const A = vs.find(v => v.loc === 'island' && (v.stress || 0) > 35);
        const B = A && vs.filter(o => o !== A && fp(A, o) >= 45).sort((x, y) => fp(A, y) - fp(A, x))[0];
        if (A && B) Cut.enqueue(umbrella(A, B));
      }
      // 우정 회복 (16시)
      if (h === 16 && chance(0.5) && ok('restore', 24) && FM.Needs) {
        for (const A of vs) {
          const fight = FM.Needs.mem(A).mid.concat(FM.Needs.mem(A).short).reverse().find(m => m.kind === 'fight' && m.about && Sim.byId(m.about) && S().time - m.t > 600);
          const B = fight && Sim.byId(fight.about);
          if (!B || !free(B)) continue;
          const r = Soc.rel(A.id, B.id);
          const forgiving = ['PEACEFUL', 'FORGIVING'].includes(A.temper) || (FM.Moral && FM.Moral.con(A) >= 70);
          if (r.friendship_point < 40 && forgiving) { Cut.enqueue(restore(A, B)); break; }
        }
      }
    } catch (e) { console.error('friendvig hour', e); }
  });

  // 카탈로그 · 신의 툴
  if (FM.Vig) {
    Object.assign(FM.Vig.KINDS, { oath: '👯 우정의 맹세', birthday: '🎂 깜짝 생일 파티', umbrella: '☂️ 우산 하나', restore: '🕊️ 우정 회복 대작전', defender: '🛡️ 친구 편들어 주기' });
    const origRun = FM.Vig.run;
    FM.Vig.run = function (kind) {
      const vs = adults(); const pk = n => vs.slice().sort(() => Math.random() - 0.5).slice(0, n);
      if (kind === 'oath') { const [a, b] = pk(2); return Cut.enqueue(oath(a, b), true); }
      if (kind === 'birthday') { const [a, ...r] = pk(4); return Cut.enqueue(birthday(a, r), true); }
      if (kind === 'umbrella') { const [a, b] = pk(2); return Cut.enqueue(umbrella(a, b), true); }
      if (kind === 'restore') { const [a, b] = pk(2); return Cut.enqueue(restore(a, b), true); }
      if (kind === 'defender') { const [a, b, c] = pk(3); return Cut.enqueue(defender(a, b, c), true); }
      return origRun(kind);
    };
  }
})();
