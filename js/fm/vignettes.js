/* =========================================================
 *  B급 멜로드라마 연출 카탈로그 (Cinematic Vignettes)
 *  모든 장면은 게임 속 실제 장소에서 촬영된다 (cutscene.js 무대)
 *
 *   1. 💘 고백 난입 & 4각 관계 극장 (플레이어 투표)
 *   2. 💔 밀회 적발 & 바람의 파국 (스릴러 톤 · 눈에서 광선)
 *   3. 👊 몸싸움 & 먼지 구름 육탄전 (싸움 말리기 QTE)
 *   4. 🕵️ 사기 & 위조품 암거래 적발 (손전등 서치라이트)
 *   5. 🔮 비밀 주술 & 괴기 신흥 교단 (플라스틱 오리 인형)
 *   6. 👗 패션 테러 & 공개 시달회 (칭찬 / 야유 · 영혼 탈출)
 *   7. 🏃 야반도주 & 비 내리는 정거장 가출 (회상 필름 · 바짓가랑이 연타 QTE)
 *   8. 💍 광란의 황당 결혼식 (하객이 생선 · 덤벨 · 책을 던짐)
 *   9. 👶 황새 & 택배 상자 출산 (라이온 퀸 들어 올리기)
 *  10. ⚖️ 이혼 & 가구 재산 분할 소송 (소파 두 동강 · 흑백 필터)
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, Cut = FM.Cut, D = FM.D;
  const P = 'P';
  const S = () => Sim.get();
  const pl = () => S().player;
  const byId = id => (id === P ? pl() : Sim.byId(id));
  const nm = id => Sim.nameOf(id);
  const day = () => Sim.time.day();
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const has = (v, k) => Sim.has(v, k);
  const sty = (v, t) => (v && v.id !== P && FM.Will ? FM.Will.sty(v, FM.josa(t)) : FM.josa(t));
  const adults = () => S().villagers.filter(v => !v.child && !v.staff && !v.visitor);
  const free = v => v && !v.sceneId && !v.talkingToPlayer && !(v.status && v.status.hospital);
  const bump = (v, k, d) => FM.Needs && v && v.id !== P && FM.Needs.bump(v, k, d);
  const Vig = (FM.Vig = {});
  const keyOf = cast => Object.values(cast).map(v => v.id).sort().join('|');
  const mk = (theme, cast, beats, o = {}) => Object.assign({ theme, cast, beats, key: keyOf(cast), force: true, vig: true }, o);

  // ---------------------------------------------------------
  // 1. 고백 난입 & 4각 관계
  // ---------------------------------------------------------
  function confessCrash(sc, base) {
    const A = sc.actors.A, B = sc.actors.B; if (!A || !B || A.id === P || B.id === P) return null;
    const rivals = adults().filter(o => o !== A && o !== B && Soc.canRomance(o.id, B.id) && !Soc.partnerOf(o.id) && Soc.F(o.id, B.id).romance >= 38 && free(o))
      .sort((x, y) => Soc.F(y.id, B.id).romance - Soc.F(x.id, B.id).romance).slice(0, 2);
    if (!rivals.length || !chance(rivals.length > 1 ? 0.7 : 0.45)) return null;
    const [C, Dd] = rivals;
    const cast = { A, B, C }; if (Dd) cast.D = Dd;
    const line = (base.beats.find(b => b.say === 'A') || {}).text || sty(A, `${B.name}, 나... 너를 좋아해!`);
    const beats = [
      { pose: 'A', p: 'kneel', t: 900 }, { emo: 'A', e: '🌹' }, { say: 'A', text: line, shot: 'close' }, { emo: 'B', e: '😳' },
      { sfx: 'thud' }, { narr: '(그 순간, 흐르던 BGM이 뚝 멈췄다...)', who: '해설', icon: '🎵', shot: ['wide'] },
      { show: 'C' }, { move: ['C', 1.9, 0.75], run: true, t: 1300 }, { say: 'C', text: sty(C, '그 고백, 반대한다!!'), hot: true }, { fx: 'shock' },
    ];
    if (Dd) beats.push({ show: 'D' }, { move: ['D', -1.9, 0.75], run: true, t: 1300 }, { say: 'D', text: sty(Dd, `나도 ${B.name}을(를) 좋아한단 말이야!!`), hot: true }, { fx: 'shock' });
    beats.push({ split: Dd ? ['A', 'C', 'D', 'B'] : ['A', 'C', 'B'], caps: Dd ? ['고백 중', '난입 ①', '난입 ②', '주인공'] : ['고백 중', '난입!', '주인공'], t: 2600 });
    const keys = Dd ? ['A', 'C', 'D'] : ['A', 'C'];
    beats.push({ vote: { id: 'pick', title: `🗳️ ${B.name}은(는) 누구의 마음을 받아야 할까? 당신이 정해 주세요!`, keys, none: true, labels: Object.fromEntries(keys.map(k => [k, cast[k].name]).concat([['none', '아무도']])) } });
    const c = mk('confess', cast, beats, { place: base.place, slots: { A: [-0.8, 0], B: [0.8, 0], C: [3.4, 0.9], D: [-3.4, 0.9] }, hidden: ['C', 'D'], sub: '고백 난입! 4각 관계 극장' });
    c.branch = (id, r) => {
      if (r === 'none') return [{ say: 'B', text: sty(B, '미, 미안... 난 아무도 못 고르겠어!!'), hot: true }, { poses: keys.map(k => [k, 'faint']), t: 1500 }, { narr: '(선택받지 못한 이들은 모두 그 자리에 쓰러졌다...)', who: '해설', icon: '🎬' }, { outcome: 'comedy' }];
      const X = cast[r];
      return [{ shot: ['close', 'B'], t: 800 }, { say: 'B', text: sty(B, `${X.name}... 사실 나도 너였어!`), shot: 'zoom' }, { fx: 'hearts', at: r }, { poses: [[r, 'cheer'], ['B', 'cute']].concat(keys.filter(k => k !== r).map(k => [k, 'cryFloor'])), t: 1800 },
        { narr: '(선택받지 못한 이들은 땅을 치며 통곡했다)', who: '해설', icon: '😭' }, { outcome: 'happy', endText: ['💕 4각 관계 종결!', `${B.name} ♥ ${X.name}`] }];
    };
    c.resolve = res => {
      const r = res.pick; const losers = keys.filter(k => k !== r).map(k => cast[k]);
      if (r && r !== 'none') {
        const X = cast[r];
        if (Soc.canRomance(B.id, X.id) && !Soc.partnerOf(B.id) && !Soc.partnerOf(X.id)) {
          const rr = Soc.rel(B.id, X.id); rr.status = 'DATING'; rr.since = day(); rr.lastDate = day(); rr.boredom = 0;
          Soc.F(B.id, X.id).romance = Math.max(Soc.F(B.id, X.id).romance, 65);
          if (X.crush && X.crush.target === B.id && Soc.endCrush) Soc.endCrush(X);
          Sim.log('couple', `💕 고백 난입 끝에 ${B.name}이(가) ${X.name}을(를) 선택! (플레이어 투표)`, [B.id, X.id], 3, { newsKind: 'drama' });
        }
      } else Sim.log('rel', `🙅 고백 난입 소동... ${B.name}은(는) 결국 아무도 선택하지 않았어요`, [B.id].concat(keys.map(k => cast[k].id)), 3, { newsKind: 'drama' });
      for (const L of losers) { Soc.F(L.id, B.id).romance = Math.max(0, Soc.F(L.id, B.id).romance - 25); bump(L, 'frustr', 30); if (L.crush && L.crush.target === B.id && Soc.endCrush) Soc.endCrush(L); if (FM.Will) FM.Will.remember(L, 'rejected', `${B.name}에게 선택받지 못했어`); }
      if (keys.length > 1) for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) { const a = cast[keys[i]], b = cast[keys[j]]; if (FM.Will && FM.Will.setBond) FM.Will.setBond(a.id, b.id, 'RIVAL_LOVE', true); }
    };
    Sim.endScene(sc, true);
    Sim.log('rel', `🎭 고백 난입! ${A.name}의 고백 현장에 ${C.name}${Dd ? '와(과) ' + Dd.name : ''}이(가) 뛰어들었어요!`, Object.values(cast).map(v => v.id), 3, { newsKind: 'drama' });
    return c;
  }

  // ---------------------------------------------------------
  // 2. 밀회 적발 — 스릴러 톤
  // ---------------------------------------------------------
  function affairThriller(sc, base) {
    const A = sc.actors.A, B = sc.actors.B; if (!A || !B) return null;
    const af = (S().affairs || []).find(x => (x.a === B.id || x.b === B.id) && x.partner === A.id) || (S().affairs || []).find(x => x.partner === A.id);
    const Cid = af ? (af.a === B.id ? af.b : af.a) : null;
    const C = Cid && Cid !== B.id ? byId(Cid) : null;
    const cast = Object.assign({}, base.cast); if (C && !Object.values(cast).includes(C)) cast.C = C;
    const cn = C ? C.name : '그 사람';
    const pre = [
      { fx: 'hearts', at: 'B' }, { narr: `(늦은 밤, 분홍빛 하트가 흩날린다... ${B.name}와(과) ${cn}의 달콤한 밀회)`, who: '해설', icon: '🌙' },
      { move: ['A', -0.8, 0], t: 1200 }, { filter: 'thriller' }, { beam: 'A', at: 'B' },
      { say: 'A', text: sty(A, `너... 내 전용 가구 사 오겠다더니 여기서 ${cn}(이)랑 시를 읊고 있었어?!`), hot: true },
      { split: C ? ['B', 'A', 'C'] : ['B', 'A'], caps: C ? ['😰 들켰다', '👁️ 목격자', '🌙 모른 척'] : ['😰 들켰다', '👁️ 목격자'], t: 2400 },
      { fx: 'sweat', at: 'B' }, { pose: 'B', p: 'shiver', t: 1200 },
    ];
    if (C) pre.push({ pose: 'C', p: 'lookUp', t: 1400 }, { say: 'C', text: sty(C, '(휘파람) ...오늘따라 달이 참 밝네~'), shot: 'close' });
    const beats = pre.concat(base.beats.filter(b => !b.pose || b.pose !== 'B'), [{ filter: null }]);
    return Object.assign(mk('affair', cast, beats, { place: base.place, slots: C ? { A: [-2.8, 0.6], B: [0.4, 0], C: [1.5, -0.2] } : { A: [-2.8, 0.6], B: [0.8, 0] }, sub: '밀회 적발! 바람의 파국', outcome: 'sad' }), { key: base.key });
  }

  // ---------------------------------------------------------
  // 3. 몸싸움 — 먼지 구름
  // ---------------------------------------------------------
  function brawl(A, B) {
    const cast = { A, B };
    const beats = [
      { poses: [['A', 'glare'], ['B', 'glare']], t: 1200 }, { spark: ['A', 'B'] },
      { say: 'A', text: sty(A, '오늘 끝장을 보자!!'), hot: true }, { say: 'B', text: sty(B, '덤벼!! 안 참아!!'), hot: true },
      { dust: ['A', 'B'], t: 3800 },
      { qte: { id: 'stop', title: '👊 싸움이 붙었다! 말려야 해!', label: '✋ 싸움 말리기!', n: 3, time: 3200 },
        then: {
          win: [{ narr: `(${pl().name}이(가) 두 사람 사이로 몸을 던졌다!)`, who: '해설', icon: '🛡️' }, { say: 'A', text: sty(A, '...흥, 오늘은 봐준다.') }, { say: 'B', text: sty(B, '나야말로!') }, { outcome: 'comedy', endText: ['🛡️ 싸움 중재 성공', '다행히 큰 부상은 없었다'] }],
          lose: [{ poses: [['A', 'faint'], ['B', 'faint']], t: 1500 }, { narr: '(구름이 걷히자... 둘 다 머리에 혹을 달고 붕대를 감고 있었다)', who: '해설', icon: '🩹' }, { poses: [['A', 'spit'], ['B', 'spit']], t: 800 }, { say: 'A', text: '퉤!' }, { say: 'B', text: '퉤퉤!!' }, { move: ['A', -3.2, 0.4], t: 800 }, { move: ['B', 3.2, 0.4], t: 1500 }, { outcome: 'sad', endText: ['🩹 상처뿐인 싸움', '둘 사이는 더 멀어졌다'] }],
        } },
    ];
    const c = mk('brawl', cast, beats, { sub: pick(THEMES().brawl.titles) });
    c.resolve = r => {
      if (r.stop) { Soc.addFriend(A.id, B.id, -3, -2, '싸움'); Soc.addFriend(A.id, P, 4, 4, '싸움 말림'); Soc.addFriend(B.id, P, 4, 4, '싸움 말림'); Sim.log('rel', `🛡️ ${pl().name}이(가) ${A.name}와(과) ${B.name}의 몸싸움을 말렸어요!`, [A.id, B.id, P], 3, { newsKind: 'drama' }); }
      else {
        for (const v of [A, B]) { v.status.hatOverride = 'headband'; v.status.bandageUntil = day() + 2; bump(v, 'frustr', 25); v.stress = clamp((v.stress || 0) + 15, 0, 100); }
        Soc.addFriend(A.id, B.id, -15, -12, '몸싸움'); Soc.addFriend(B.id, A.id, -15, -12, '몸싸움');
        if (FM.Will && FM.Will.setBond) FM.Will.setBond(A.id, B.id, Soc.rel(A.id, B.id).friendship_point < 10 ? 'ENEMY' : 'NEMESIS', true);
        Sim.log('rel', `👊 속보! ${A.name}와(과) ${B.name}의 충격적인 몸싸움 현장! 둘 다 붕대를 감았어요`, [A.id, B.id], 3, { newsKind: 'drama' });
      }
    };
    return c;
  }

  // ---------------------------------------------------------
  // 4. 사기 & 위조품 암거래
  // ---------------------------------------------------------
  function scam(A, B) {
    const cast = { A, B };
    const item = pick(['대리석 침대', '황금 변기', '진품 명화 「해바라기」', '공룡 화석 식탁', '달나라 흙 화분']);
    const price = pick(['10만', '5만', '99,999']);
    const beats = [
      { narr: '(어두운 골목 창고, 앤틱 조명 하나만 켜져 있다...)', who: '해설', icon: '🕯️', shot: ['wide'] },
      { say: 'A', text: sty(A, `이건 전 세계에 하나뿐인 ${item}야... 단돈 ${price} 코인!`), shot: 'zoom' }, { fx: 'glint', at: 'A' },
      { say: 'B', text: sty(B, '와아... 진짜 싸다! 당장 살게!') }, { pose: 'B', p: 'reach', t: 1000 },
      { choice: { id: 'bust', title: '🕵️ 사기 현장이다! 어떻게 할까?', opts: [{ v: 'bust', label: '🔦 손전등 비추며 현장 적발!' }, { v: 'ignore', label: '👀 못 본 척 지나가기' }], labels: { bust: '현장 적발', ignore: '못 본 척' } },
        then: {
          bust: [{ searchlight: true }, { say: 'P', text: '거기 꼼짝 마!!', hot: true }, { pose: 'A', p: 'surprise', t: 900 }, { say: 'A', text: sty(A, `이, 이건 그냥 목재에 페인트칠한 거잖아! (실토)`), hot: true }, { emo: 'B', e: '😡' }, { outcome: 'comedy', endText: ['🔦 사기 현장 적발', `${A.name}의 평판이 뚝 떨어졌다`] }],
          ignore: [{ say: 'A', text: sty(A, '거래 완료~ 후후후') }, { emo: 'B', e: '🥰' }, { narr: `(다음 날, 비를 맞은 ${item}에서 페인트가 줄줄 벗겨졌다...)`, who: '해설', icon: '🌧️' }, { outcome: 'sad', endText: ['💸 당하고 말았다', `${B.name}의 코인이 사라졌다`] }],
        } },
    ];
    const c = mk('scam', Object.assign({ P: pl() }, cast), beats, { venue: null, slots: { A: [-0.7, 0], B: [0.7, 0], P: [2.6, 1.4] }, hidden: [], props: [{ kind: 'table', x: 0, z: -0.8 }], sub: pick(THEMES().scam.titles) });
    c.cast = Object.assign({}, cast, { P: pl() });
    c.resolve = r => {
      if (r.bust === 'bust') { A.reputation = clamp((A.reputation || 50) - 15, 0, 100); bump(A, 'frustr', 20); Soc.addFriend(B.id, P, 8, 10, '사기 막아 줌'); Soc.addFriend(A.id, P, -6, -8, '사기 적발'); Sim.log('rel', `🔦 속보! ${pl().name}이(가) ${A.name}의 위조품 사기를 현장에서 적발했어요!`, [A.id, B.id, P], 3, { newsKind: 'drama' }); }
      else { const loss = Math.min(800, Math.floor(B.coins || 0)); B.coins -= loss; A.coins = (A.coins || 0) + loss; bump(B, 'frustr', 30); if (FM.Will) FM.Will.remember(B, 'fight', `${A.name}한테 가짜 ${item}을(를) 샀어`, { about: A.id }); Sim.log('gossip', `💸 ${B.name}이(가) ${A.name}에게 가짜 ${item}을(를) ${loss}코인에 샀대요...`, [A.id, B.id], 2, { newsKind: 'drama' }); }
    };
    return c;
  }

  // ---------------------------------------------------------
  // 5. 비밀 주술 교단
  // ---------------------------------------------------------
  function cult(members) {
    const ks = ['A', 'B', 'C', 'D'].slice(0, members.length);
    const cast = Object.fromEntries(ks.map((k, i) => [k, members[i]]));
    const pos = [[0, -1.2], [-1.2, 0.1], [1.2, 0.1], [0, 1.25]];
    const slots = Object.fromEntries(ks.map((k, i) => [k, pos[i]]));
    const facing = Object.fromEntries(ks.map((k, i) => [k, Math.atan2(-pos[i][0], -pos[i][1])]));
    const A = members[0];
    const idol = pick(['플라스틱 오리 인형', '황금 변기 모형', '고무 오리님']);
    const beats = [
      { narr: `(자정의 공원... 촛불 사이로 후드를 쓴 수상한 무리가 모였다)`, who: '해설', icon: '🕯️', shot: ['top', 'A'] },
      { say: 'A', text: sty(A, `위대하신 ${idol}이시여... 저희에게 무한한 간식을 내려 주소서...`), shot: 'low' },
      { poses: ks.map(k => [k, 'bow']), t: 1600 }, { say: 'B', text: '꽥꽥... 꽥꽥...' },
      { poses: ks.map(k => [k, pick(['crystal', 'weird', 'sway'])]), t: 2600 }, { fx: 'sparkle', at: 'A' },
      { fx: 'shock' }, { narr: `(그때, ${pl().name}이(가) 수풀을 헤치고 나타났다!)`, who: '해설', icon: '👀' },
      { poses: ks.map(k => [k, 'surprise']), t: 900 }, { say: 'A', text: sty(A, '이, 이건 그냥 동호회 모임이야!!'), hot: true },
      { say: ks[1], text: sty(members[1], '마, 맞아! 오리 사랑 동호회!') },
      ...ks.map((k, i) => ({ move: [k, pos[i][0] * 4, pos[i][1] * 4], run: true, t: i === ks.length - 1 ? 1600 : 150, shotWide: i === 0 })),
      { outcome: 'comedy', endText: ['🔮 신흥 교단 해산', '...하지만 다음 주에 또 모였다고 한다'] },
    ];
    const c = mk('cult', cast, beats, { place: 'park', slots, facing, props: [{ kind: 'candles', x: 0, z: 0 }, { kind: 'duck', x: 0, z: 0 }], sub: pick(THEMES().cult.titles) });
    c.resolve = () => {
      for (let i = 0; i < members.length; i++) for (let j = i + 1; j < members.length; j++) { Soc.addFriend(members[i].id, members[j].id, 8, 6, '비밀 모임'); if (FM.Will && FM.Will.setBond && chance(0.4)) FM.Will.setBond(members[i].id, members[j].id, 'SECRET', true); }
      Sim.log('quirk', `🔮 속보! 한밤중 공원에서 ${members.map(v => v.name).join(', ')}이(가) ${idol}에게 절을 하는 수상한 의식이 목격됐어요`, members.map(v => v.id), 3, { newsKind: 'drama' });
    };
    return c;
  }

  // ---------------------------------------------------------
  // 6. 패션 테러 & 공개 시달회
  // ---------------------------------------------------------
  function fashion(A, aud) {
    const ks = ['B', 'C', 'D'].slice(0, aud.length);
    const cast = Object.assign({ A }, Object.fromEntries(ks.map((k, i) => [k, aud[i]])));
    const praise = aud.filter(v => ['ARTISTIC', 'EXTROVERT', 'ROMANTIC'].includes(v.keys.L1)).length >= Math.ceil(aud.length / 2);
    const concept = pick(['오징어 탈 + 발레 튜튜', '냄비 모자 + 턱시도', '양배추 드레스 + 장화', '형광 우주복 + 왕관']);
    const beats = [
      { narr: '(런웨이 조명 ON! 광장에 패션쇼 BGM이 울려 퍼진다~)', who: '해설', icon: '📸', shot: ['wide'] }, { sfx: 'fireworks' },
      { move: ['A', 0, 1.0], t: 2600 }, { pose: 'A', p: 'pose', t: 1000 }, { fx: 'photo' },
      { say: 'A', text: sty(A, `오늘의 콘셉트는 '${concept}'! 어때, 숨 막히지?`), shot: 'low' },
      { split: ['A'].concat(ks), caps: ['✨ 모델'].concat(ks.map(() => '👀 관객')), t: 2000 },
    ];
    if (praise) beats.push({ say: ks[0], text: sty(aud[0], '아방가르드해...! 시대를 앞서갔어!!'), hot: true }, { poses: ks.map(k => [k, 'clap']), t: 1500 }, { emo: ks[0], e: '😭' }, { fx: 'sparkle', at: 'A' }, { outcome: 'happy', endText: ['👗 패션계의 혁명', `${A.name}, 섬 최고의 패셔니스타 등극`] });
    else beats.push({ poses: ks.map(k => [k, 'point']), t: 1000 }, { say: ks[ks.length - 1], text: sty(aud[aud.length - 1], '푸하하하하! 저게 뭐야!!'), hot: true }, { poses: ks.map(k => [k, 'rock']), t: 1200 }, { soul: 'A' }, { narr: `(충격을 받은 ${A.name}의 영혼이 입 밖으로 빠져나갔다...)`, who: '해설', icon: '👻' }, { outcome: 'comedy', endText: ['👗 패션 테러', '...시대가 아직 따라오지 못했을 뿐'] });
    const c = mk('fashion', cast, beats, { venue: { loc: 'island', x: 3, z: 19, place: 'plaza' }, slots: Object.assign({ A: [0, -1.9] }, Object.fromEntries(ks.map((k, i) => [k, [[-1.7, 0.9], [1.7, 0.9], [-1.9, -0.4]][i]]))), facing: { B: 0.9, C: -0.9, D: 1.2 },
      props: [{ kind: 'runway', x: 0, z: -0.3 }], lookPatch: { A: { hat: pick(['crown', 'flower', 'straw']), glasses: 'sun', top: 'dress', shirt: pick([0x39ff14, 0xff00c8, 0x00e5ff]), pattern: 'star', acc: 'lei' } }, sub: pick(THEMES().fashion.titles) });
    c.resolve = () => {
      if (praise) { A.reputation = clamp((A.reputation || 50) + 8, 0, 100); bump(A, 'flex', -60); } else { bump(A, 'frustr', 30); bump(A, 'flex', -40); A.reputation = clamp((A.reputation || 50) - 5, 0, 100); }
      Sim.log('quirk', `👗 ${A.name}의 광장 패션쇼 '${concept}' — ${praise ? '관객 기립 박수! 😭👏' : '야유 폭발... 영혼이 빠져나갔어요 👻'}`, [A.id].concat(aud.map(v => v.id)), 3, { newsKind: 'drama' });
    };
    return c;
  }

  // ---------------------------------------------------------
  // 7. 야반도주 & 비 내리는 정거장
  // ---------------------------------------------------------
  function runaway(A) {
    const m = FM.Needs ? FM.Needs.mem(A) : { short: [], mid: [], long: [] };
    const memories = m.long.concat(m.mid).slice(-4).map(e => ({ face: e.about || A.id, text: `${FM.Needs.agoTxt(e.t)} · ${e.text}` }));
    if (memories.length < 3) for (const e of S().log.filter(x => (x.who || []).includes(A.id)).slice(-4)) memories.push({ face: (e.who || []).find(id => id !== A.id) || A.id, text: `${e.day}일차 · ${e.text.replace(/^\S+\s/, '')}` });
    const cast = { A, P: pl() };
    const beats = [
      { narr: '(비 내리는 밤, 페리 터미널. 커다란 트렁크 옆에 누군가 앉아 있다...)', who: '해설', icon: '🌧️', shot: ['wide'] },
      { pose: 'A', p: 'sadSit', t: 1400, noshot: true }, { shot: ['close', 'A'], t: 1000 },
      { say: 'A', text: sty(A, '...이 섬에서의 추억도 이제 안녕이야.') },
      { film: memories.slice(-4) },
      { say: 'A', text: sty(A, '아무도 날 필요로 하지 않으니까.') },
      { show: 'P' }, { move: ['P', -0.9, 0.3], run: true, t: 1300 }, { say: 'P', text: `${A.name}!! 가지 마!!`, hot: true },
      { qte: { id: 'hold', title: '🏃 떠나려 한다! 바짓가랑이를 붙잡아!', label: '🫳 바짓가랑이 잡기!', n: 12, time: 4500, kind: 'mash' },
        then: {
          win: [{ pose: 'P', p: 'kneel', t: 800 }, { say: 'A', text: sty(A, '...이렇게까지 붙잡아 주는 사람이 있었구나. 나... 안 갈래!'), hot: true }, { poses: [['A', 'hug'], ['P', 'hug']], t: 1800 }, { fx: 'hearts', at: 'A' }, { outcome: 'happy', endText: ['🫂 눈물의 포옹', `${A.name}은(는) 섬에 남기로 했다`] }],
          lose: [{ say: 'A', text: sty(A, '...고마웠어. 잘 있어.') }, { move: ['A', 3.4, -0.4], t: 2000 }, { narr: '(다음 날, 정거장에 그 모습은 없었다...)', who: '해설', icon: '🧳' }, { outcome: 'sad', endText: ['🧳 떠나간 사람', `${A.name}이(가) 섬을 떠났다`] }],
        } },
    ];
    const c = mk('runaway', cast, beats, { place: 'ferry', slots: { A: [0.4, 0], P: [-3.4, 1.0] }, hidden: ['P'], props: [{ kind: 'suitcase', x: 1.15, z: 0.1 }, { kind: 'bench', x: 0.4, z: -0.45 }], sub: pick(THEMES().runaway.titles) });
    c.resolve = r => {
      if (r.hold) { if (FM.Needs) FM.Needs.of(A).frustr = 20; A.stress = Math.max(0, (A.stress || 0) - 30); Soc.addFriend(A.id, P, 15, 15, '가출을 말려 줌'); if (FM.Will) FM.Will.remember(A, 'promise', '떠나려던 날 붙잡아 줬어'); Sim.log('rel', `🫂 비 내리는 정거장... ${pl().name}이(가) 떠나려던 ${A.name}을(를) 붙잡았어요`, [A.id, P], 3, { newsKind: 'drama' }); }
      else leaveIsland(A);
    };
    return c;
  }
  function leaveIsland(v) {
    const st = S();
    const tied = Soc.marriageOf && Soc.marriageOf(v.id) || Soc.childrenOf && Soc.childrenOf(v.id).length;
    if (tied) { if (FM.Needs) FM.Needs.of(v).frustr = 50; Sim.log('rel', `🧳 ${v.name}이(가) 가출했다가... 가족이 눈에 밟혀 첫차로 돌아왔어요`, [v.id], 3, { newsKind: 'drama' }); return; }
    const pt = Soc.partnerOf(v.id); if (pt && Soc.doBreakup) try { Soc.doBreakup(Soc.rel(v.id, pt), 'LEFT'); } catch (e) { /* 무시 */ }
    st.departed = st.departed || [];
    st.departed.push({ id: v.id, name: v.name, look: v.look, keys: v.keys, day: day() });
    const i = st.villagers.indexOf(v); if (i >= 0) st.villagers.splice(i, 1);
    if (v.home && v.home.startsWith('apt') && !st.villagers.some(o => o.home === v.home)) delete st.rooms[v.home];
    Sim.log('move', `🧳 속보! ${v.name}이(가) 비 내리는 밤, 섬을 떠났어요... (드라마 앨범에 기록이 남았어요)`, [v.id], 3, { newsKind: 'drama' });
    FM.bus.emit('villagers');
  }
  Vig.leaveIsland = leaveIsland;

  // ---------------------------------------------------------
  // 8. 광란의 결혼식 / 10. 이혼 소파 분할 — 기존 장면에 연출 덧붙이기
  // ---------------------------------------------------------
  function weddingChaos(base) {
    const ks = Object.keys(base.cast); const A = base.cast.A, B = base.cast.B; if (!A || !B) return base;
    const extra = [
      { narr: '신랑과 신부는 서로의 가구를 훔치지 않고, 평생 사랑할 것을 맹세합니까?', who: '주례', icon: '🎩', shot: ['wide'] },
      { say: 'A', text: '네!!', hot: true, shot: 'close' }, { say: 'B', text: '네!!!', hot: true, shot: 'close' },
      { narr: '(하객들이 축하의 의미로 쌀알 대신... 무언가를 던지기 시작했다!)', who: '해설', icon: '🎉' },
      { throw: ['🐟', '🏋️', '📚', '🍪', '💦', '🥾', '🍌'], at: 'A' }, { poses: [['A', 'surprise'], ['B', 'faint']], t: 1200 }, { fx: 'fireworks' },
      { outcome: 'happy', endText: ['💒 광란의 결혼식', '...그래도 둘은 행복하게 잘 살았답니다?'] },
    ];
    base.beats = base.beats.concat(extra); base.sub = pick(['광란의 황당 결혼식', '생선이 날아온 날', '평생 가구 안 훔치기 맹세']);
    void ks; return base;
  }
  function divorceSofa(base) {
    const A = base.cast.A, B = base.cast.B; if (!A || !B) return base;
    const J = base.cast.J;
    base.beats = [
      { gavel: J ? 'J' : true }, J ? { say: 'J', text: '탕! 탕! 탕! 지금부터 가구 재산 분할 소송을 시작합니다!', hot: true } : { narr: '탕! 탕! 탕! 지금부터 가구 재산 분할 소송을 시작합니다!', who: '판사', icon: '⚖️' },
      { prop: { kind: 'sofa', x: 0, z: 0.6, id: 'sofa', drop: true } }, { move: ['A', -1.05, 0.6], t: 600 }, { move: ['B', 1.05, 0.6], t: 1200 },
      { poses: [['A', 'tug'], ['B', 'tug']], t: 1200 }, { say: 'A', text: sty(A, '이 소파는 내가 산 거야!'), hot: true }, { say: 'B', text: sty(B, '아니야! 내가 먼지 턴 횟수가 더 많아!'), hot: true },
      { breakProp: 'sofa' }, { poses: [['A', 'faint'], ['B', 'faint']], t: 1400 }, { filter: 'gray' },
      ...base.beats.filter(b => b.say && b.say !== 'J').slice(-2),
      { outcome: 'sad', endText: ['⚖️ 각자의 길', '소파도 사랑도 두 동강...'] },
    ];
    base.sub = '이혼 & 가구 재산 분할 소송';
    base.slots = J ? { A: [-0.9, 0.2], B: [0.9, 0.2], J: [0, -1.3] } : null;
    return base;
  }
  // 9. 황새 & 택배 상자 출산
  function stork(parents, baby) {
    const [A, B] = parents;
    const cast = { A, B, C: baby };
    const beats = [
      { filter: 'holy' }, { narr: '(집 전체에 황금빛 후광이 비치고... 오페라가 울려 퍼진다~ 🎶)', who: '해설', icon: '🎼', shot: ['wide'] },
      { stork: true }, { prop: { kind: 'box', x: 0, z: 0.7, id: 'box', drop: true } }, { narr: '(로봇 황새가 \'귀중품 택배 상자\'를 떨어뜨리고 날아갔다!)', who: '해설', icon: '🦩' },
      { emo: 'A', e: '😭' }, { say: 'A', text: sty(A, '이, 이 상자는...?! 설마...!'), shot: 'close' }, { poses: [['A', 'reach'], ['B', 'reach']], t: 1000 },
      { smoke: '뿅!' }, { unprop: 'box' }, { show: 'C' }, { say: 'C', text: '응애~!', shot: 'close' },
      { raise: ['C', 'A'] }, { narr: '(부모가 아기를 높이 들어 올렸다... 이 섬의 새로운 생명이여!)', who: '해설', icon: '🦁' },
      { say: 'B', text: sty(B, `우리 아가... 환영해! 이름은 ${baby.name}(이)야!`) }, { fx: 'hearts', at: 'B' },
      { outcome: 'happy', endText: ['👶 황새가 데려온 아기', `${baby.name}, 섬에 온 걸 환영해!`] },
    ];
    return mk('baby', cast, beats, { slots: { A: [-0.8, 0], B: [0.8, 0], C: [0, 0.7] }, hidden: ['C'], sub: '황새와 택배 상자', force: parents.includes(pl()) });
  }

  const THEMES = () => Cut.THEME;

  // ---------------------------------------------------------
  // 컷신 엔진에 연결
  // ---------------------------------------------------------
  const baseFromScene = Cut.fromScene;
  Cut.fromScene = function (sc) {
    const base = baseFromScene(sc);
    if (!base) return null;
    try {
      if (base.theme === 'confess') { const cr = confessCrash(sc, base); if (cr) return cr; }
      if (base.theme === 'affair') return affairThriller(sc, base);
      if (base.theme === 'wedding') return weddingChaos(base);
      if (base.theme === 'divorce') return divorceSofa(base);
    } catch (e) { console.error('vig', e); }
    return base;
  };
  const baseFromLog = Cut.fromLog;
  Cut.fromLog = function (e) {
    try {
      if (e && !e.secret && e.type === 'rel' && /말다툼|원수가 됐어요/.test(e.text)) {
        const [a, b] = (e.who || []).map(byId);
        if (a && b && a.id !== P && b.id !== P && free(a) && free(b) && Soc.rel(a.id, b.id).friendship_point < 30 && chance(/원수/.test(e.text) ? 0.7 : 0.25)) return Object.assign(brawl(a, b), { fromLog: true });
      }
      if (e && e.type === 'baby' && /태어났어요/.test(e.text)) {
        const ids = e.who || []; const baby = byId(ids[2]); const ps = ids.slice(0, 2).map(byId).filter(Boolean);
        if (baby && ps.length === 2) return stork(ps, baby);
      }
    } catch (er) { console.error('vig log', er); }
    const c = baseFromLog(e);
    if (c && c.theme === 'triangle' && c.cast.C) c.beats.unshift({ split: ['A', 'C', 'B'], caps: ['💘', '❓', '⚔️'], t: 2200 });
    return c;
  };

  // ---------------------------------------------------------
  // 사건 발생 (매시간 체크)
  // ---------------------------------------------------------
  const onIsland = v => v.loc === 'island' || !!FM.INTERIORS[v.loc];
  const recent = {};
  const cool = (k, h) => { const t = S().time; if (recent[k] && t - recent[k] < h * 60) return false; recent[k] = t; return true; };
  function hourly(h) {
    const st = S(); if (!st || st.villagers.length < 4) return;
    const vs = adults().filter(v => free(v) && onIsland(v) && !(v.act && v.act.id === 'sleep'));
    // 7. 가출: 억울함 95↑ 밤
    if (h >= 20 && h <= 23) {
      const r = vs.find(v => FM.Needs && FM.Needs.of(v).frustr >= 95 && (v.runawayRisk || 0) >= 0);
      if (r && chance(0.5) && cool('run' + r.id, 48)) return Cut.enqueue(runaway(r), true);
    }
    // 4. 사기 (밤 22시)
    if (h === 22 && chance(0.12) && cool('scam', 30)) {
      const A = vs.find(v => ['SNOB', 'ARTISTIC', 'EXTROVERT', 'CRANKY'].includes(v.keys.L1)); const B = vs.find(v => v !== A && ['ANXIOUS', 'ROMANTIC', 'LAZY'].includes(v.keys.L1) && (v.coins || 0) > 400);
      if (A && B) return Cut.enqueue(Object.assign(scam(A, B), { venue: { loc: 'island', x: 69, z: 44, place: 'alley' } }), true);
    }
    // 5. 교단 (자정 무렵)
    if (h === 23 && chance(0.08) && cool('cult', 48)) {
      const lead = vs.find(v => ['ARTISTIC', 'ANXIOUS', 'SCHOLARLY'].includes(v.keys.L1));
      if (lead) { const mem = [lead].concat(vs.filter(v => v !== lead).sort(() => Math.random() - 0.5).slice(0, 3)); if (mem.length >= 3) return Cut.enqueue(cult(mem)); }
    }
    // 6. 패션쇼 (오후 2시)
    if (h === 14 && chance(0.1) && cool('fashion', 36)) {
      const A = vs.find(v => v.keys.L4 === 'FASHION' || ((['ARTISTIC', 'EXTROVERT', 'SNOB'].includes(v.keys.L1)) && FM.Needs && FM.Needs.of(v).flex >= 45));
      if (A) { const aud = vs.filter(v => v !== A).sort(() => Math.random() - 0.5).slice(0, 3); if (aud.length >= 2) return Cut.enqueue(fashion(A, aud)); }
    }
  }
  FM.bus.on('hour', h => { try { hourly(h); } catch (e) { console.error('vig hour', e); } });
  // 붕대 풀기
  FM.bus.on('hour', h => { if (h !== 6) return; const st = S(); if (!st) return; for (const v of st.villagers) if (v.status && v.status.bandageUntil && v.status.bandageUntil <= day()) { v.status.bandageUntil = null; if (v.status.hatOverride === 'headband') v.status.hatOverride = null; } });

  // 테스트 · 신의 툴에서 바로 틀기
  Vig.make = { brawl, scam, cult, fashion, runaway, stork, confessCrash, affairThriller };
  Vig.run = function (kind) {
    const vs = adults();
    const pk = n => vs.slice().sort(() => Math.random() - 0.5).slice(0, n);
    let c = null;
    if (kind === 'brawl') { const [a, b] = pk(2); c = brawl(a, b); }
    if (kind === 'scam') { const [a, b] = pk(2); c = Object.assign(scam(a, b), { venue: { loc: 'island', x: 69, z: 44, place: 'alley' } }); }
    if (kind === 'cult') c = cult(pk(4));
    if (kind === 'fashion') { const [a, ...r] = pk(4); c = fashion(a, r); }
    if (kind === 'runaway') { const [a] = pk(1); c = runaway(a); }
    if (kind === 'stork') { const [a, b] = pk(2); const kid = vs.find(v => v.child) || pk(1)[0]; c = stork([a, b], kid); c.resolve = null; }
    if (kind === 'confess') { const [a, b, x, y] = pk(4); for (const o of [x, y]) Soc.addRomance(o.id, b.id, 60); FM.Soc.runConfession(a, b, 'sunset_cliff', { force: true }); return; }
    if (kind === 'affair') { const [a, b, x] = pk(3); const r = Soc.rel(a.id, b.id); r.status = 'DATING'; S().affairs = S().affairs || []; const af = { a: b.id, b: x.id, partner: a.id, day: day(), witness: [] }; S().affairs.push(af); if (FM.Drama && FM.Drama.expose) FM.Drama.expose(af, P); return; }
    if (kind === 'wedding' && Soc.wedding) { const [a, b] = pk(2); const m = { marriage_id: 'mtest', spouse_a_id: a.id, spouse_b_id: b.id, marriage_stage: 'WEDDING_PREP', wedding_day: day(), family_tree_id: 'ftest', prep: { clean: 0, invite: [], decorate: 0 }, marital_satisfaction: 80 }; S().marriages.push(m); Soc.rel(a.id, b.id).status = 'ENGAGED'; Soc.wedding(m); return; }
    if (kind === 'divorce' && FM.Ev && FM.Ev.queue) { const [a, b] = pk(2); const m = { marriage_id: 'mdiv', spouse_a_id: a.id, spouse_b_id: b.id, marriage_stage: 'MARRIED', wedding_day: 1, family_tree_id: 'fdiv', marital_satisfaction: 5 }; S().marriages.push(m); Soc.rel(a.id, b.id).status = 'MARRIED'; FM.Ev.queue('divorce', m); return; }
    if (c) Cut.enqueue(c, true);
  };
  Vig.KINDS = { confess: '💘 고백 난입 & 4각 관계', affair: '💔 밀회 적발', brawl: '👊 먼지 구름 육탄전', scam: '🕵️ 위조품 사기 적발', cult: '🔮 괴기 신흥 교단', fashion: '👗 패션 테러', runaway: '🏃 비 내리는 정거장 가출', wedding: '💍 광란의 결혼식', stork: '👶 황새 택배 출산', divorce: '⚖️ 소파 재산 분할 소송' };
})();
