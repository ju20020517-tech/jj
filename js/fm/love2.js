/* =========================================================
 *  💞 연애 · 결혼 · 육아 확장 (메인 컨텐츠)
 *   - 📱 폰 '연애' 앱: 내 연인/배우자 카드(D+일 · 설렘 · 호감 · 권태 · 다음 목표) · 받은 문자 · 데이트 기록
 *                      · 나를 좋아하는 주민(썸) · 우리 아이들 성장 · 섬의 커플
 *   - 💌 연인 문자: 아침 인사 / 보고 싶다 / 잘 자 — 폰으로 답장 보내기 (하루 1번)
 *   - 🎉 기념일: 사귄 지 D+7·14·30·50·100·200·365, 결혼 D+7·30·100·365 → 선물 + 축하 대화
 *   - ⭐ 데이트 평점: 장소 취향에 따라 별점 · 반응 · 기록
 *   - 🍽️ 부부: 저녁 같이 먹기 · "오늘 일은 어땠어?" · 주말 가족 나들이
 *   - 🌙 육아: 아이 재워 주기 (밤) · 아이 성장 일기
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, D = FM.D, UI = FM.UI;
  if (!Sim || !Soc) return;
  const P = 'P', S = () => Sim.get(), pl = () => S().player;
  const day = () => Sim.time.day(), hour = () => Sim.time.hour();
  const byId = id => Sim.byId(id);
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sty = (v, t) => (v && FM.Will && FM.Will.sty ? FM.Will.sty(v, t) : t);
  const J = t => (FM.josa ? FM.josa(t) : t);
  const toast = t => FM.bus.emit('toast', t);
  const L2 = () => { const st = S(); return st.love || (st.love = { msgs: [], dates: [], diary: [], anniv: {}, once: {} }); };
  const once = (k) => { const o = L2().once; if (o[k] === day()) return false; o[k] = day(); return true; };
  const did = k => L2().once[k] === day();

  // 내 연인 / 배우자
  function myLove() {
    const id = Soc.partnerOf(P); if (!id) return null;
    const v = byId(id); if (!v) return null;
    const r = Soc.rel(v.id, P), m = Soc.marriageOf(P);
    const married = r.status === 'MARRIED' || (m && m.marriage_stage === 'MARRIED');
    return { v, r, m, married, engaged: r.status === 'ENGAGED', since: married && m && m.married_day ? m.married_day : r.since };
  }
  const myKids = () => S().villagers.filter(c => (c.child && c.child.parents.includes(P)) || (c.grownUp && (c.grownUp.parents || []).includes(P)));
  const isMine = v => { const L = myLove(); return L && L.v === v; };
  const dPlus = L => day() - (L.since || day()) + 1;

  // ---------------------------------------------------------
  // 💌 문자
  // ---------------------------------------------------------
  const MSG = {
    morning: ['좋은 아침! 오늘도 네 생각부터 났어 ☀️', '일어났어? 오늘 하루도 화이팅 💪', '꿈에 너 나왔다? …뭐였는지는 비밀 😳', '아침 꼭 챙겨 먹어! 안 먹으면 혼난다 🍞'],
    married: ['여보~ 아침 차려 놨어. 같이 먹자 🍳', '오늘 저녁 뭐 먹고 싶어? 퇴근하고 장 봐 갈게 🛒', '어제 잠꼬대한 거 알아? ㅋㅋ 귀여웠어', '오늘도 우리 가족 화이팅! 🏡'],
    miss: ['…요즘 너무 못 본 것 같아. 보고 싶어 🥺', '바빠? 잠깐이라도 얼굴 보고 싶다…', '오늘은 꼭 만나자. 약속! 🤙'],
    night: ['오늘 고마웠어. 잘 자 🌙', '자기 전에 네 목소리 듣고 싶었는데… 잘 자 💤', '내일 또 보자! 좋은 꿈 꿔 ✨'],
    work: ['나 지금 출근! {w} 가는 중 🚶', '오늘 {w} 손님 많다… 그래도 너 생각하면서 버틴다 💪', '{w} 끝나고 시간 돼? 보고 싶어'],
  };
  const REPLY = [['💕 보고 싶어', 6], ['😊 힘내!', 4], ['🍰 간식 사 갈게', 5], ['😘 사랑해', 8]];
  function sendMsg(v, kind) {
    const L = L2(); const j = FM.CastJobs && FM.CastJobs.jobOf(v);
    let t = pick(MSG[kind]); t = t.replace('{w}', j ? j.where : '일터');
    L.msgs.unshift({ day: day(), hm: Sim.time.hm ? Sim.time.hm() : '', v: v.id, text: sty(v, t), replied: false });
    if (L.msgs.length > 30) L.msgs.length = 30;
    toast(`💌 ${v.name}: ${sty(v, t)}`);
    FM.Audio && FM.Audio.sfx && FM.Audio.sfx('page');
  }
  FM.bus.on('hour', h => {
    try {
      const Lv = myLove(); if (!Lv || Lv.v.status && Lv.v.status.hospital) return;
      const v = Lv.v, last = (pl().lastTalk || {})[v.id] || 0;
      if (h === 8) sendMsg(v, day() - last >= 2 ? 'miss' : Lv.married ? 'married' : 'morning');
      else if (h === 23 && chance(0.6)) sendMsg(v, 'night');
      else if (FM.CastJobs && FM.CastJobs.working(v) && !FM.CastJobs.working(v, (h + 23) % 24) && chance(0.5)) sendMsg(v, 'work');
    } catch (e) { console.error('love2 msg', e); }
  });
  function replyMsg(i, k) {
    const L = L2(), m = L.msgs[i]; if (!m || m.replied) return;
    const v = byId(m.v); if (!v) return;
    m.replied = REPLY[k][0];
    if (once('reply')) { Soc.addRomance(v.id, P, REPLY[k][1], '문자 답장'); Soc.addFriend(v.id, P, 2, 2, '문자'); }
    toast(`📱 ${v.name}에게 답장: ${REPLY[k][0]}`);
  }

  // ---------------------------------------------------------
  // 🎉 기념일
  // ---------------------------------------------------------
  const ANNIV_D = [7, 14, 30, 50, 100, 200, 365], ANNIV_M = [7, 30, 100, 365];
  const GIFTS = ['rose', 'cookie', 'souffle', 'necklace', 'plush', 'candle', 'love_letter', 'handmade', 'record'];
  function annivToday() {
    const Lv = myLove(); if (!Lv) return null;
    const n = dPlus(Lv); const list = Lv.married ? ANNIV_M : ANNIV_D;
    return list.includes(n) ? { n, Lv, label: `${Lv.married ? '결혼' : '사귄 지'} ${n}일` } : null;
  }
  FM.bus.on('hour', h => {
    try {
      if (h !== 9) return;
      const a = annivToday(); if (!a) return;
      const L = L2(), key = `${a.Lv.v.id}:${a.Lv.married ? 'm' : 'd'}${a.n}`; if (L.anniv[key]) return; L.anniv[key] = day();
      const v = a.Lv.v, g = GIFTS.filter(k => D.ITEMS[k]); const gi = pick(g);
      if (gi) Soc.giveItem(gi);
      L.msgs.unshift({ day: day(), v: v.id, text: sty(v, `오늘 우리 ${a.label}이야!! 🎉 작은 선물 가방에 넣어 놨어. ${D.ITEMS[gi] ? D.ITEMS[gi].name : ''} 🎁`), replied: false });
      Soc.addRomance(v.id, P, 6, '기념일');
      Sim.log('romance', `🎉 ${pl().name} ♥ ${v.name} — ${a.label} 기념일!`, [v.id, P], 2);
      toast(`🎉 ${v.name}와(과) ${a.label} 기념일! 선물: ${D.ITEMS[gi] ? D.ITEMS[gi].name : ''} — 만나서 축하해 주세요`);
    } catch (e) { console.error('love2 anniv', e); }
  });

  // ---------------------------------------------------------
  // ⭐ 데이트 평점 (talk2 의 데이트 약속을 지켰을 때)
  // ---------------------------------------------------------
  const LIKE = {
    ROMANTIC: ['beach', 'observatory'], ATHLETIC: ['park', 'beach'], SCHOLARLY: ['observatory', 'cafe'], LAZY: ['cafe', 'park'], EXTROVERT: ['arcade', 'beach'],
    INTROVERT: ['observatory', 'cafe'], SNOB: ['cafe', 'observatory'], CRANKY: ['park'], ARTISTIC: ['beach', 'cafe'], ANXIOUS: ['cafe'], ADVENTURER: ['beach', 'park'],
    FASHIONISTA: ['cafe', 'arcade'], MUSICIAN: ['beach', 'arcade'], GAMER: ['arcade'], LEADER: ['park'], CLUMSY: ['park', 'arcade'], NATURE: ['park', 'observatory'],
    ELEGANT: ['cafe', 'observatory'], CHIC: ['cafe', 'beach'], PURE: ['park', 'beach'], FRESH: ['beach', 'park'], BEAGLE: ['arcade', 'park'], MYSTIC: ['observatory'],
    CHARISMA: ['beach'], HIP: ['arcade'], CLASSIC: ['cafe'], CUTIE: ['arcade', 'cafe'], DANDY: ['observatory', 'cafe'], TOMBOY: ['park', 'arcade'],
  };
  const RATE_LINE = [
    '음… 오늘은 좀 피곤했나 봐. 다음엔 다른 데 가자.', '나쁘지 않았어! 그래도 다음엔 더 재밌는 데 가 보자.', '재밌었어! 너랑 있으면 시간 빨리 간다.',
    '오늘 진짜 좋았어… 또 오자, 꼭!', '완벽한 하루였어. 평생 기억할 거야 💕',
  ];
  const seen = new Map();
  setInterval(() => {
    try {
      const st = S(); if (!st || !st.pacts) return;
      const now = new Set();
      for (const pc of st.pacts) if (pc.kind === 'date') { const k = pc.v + '@' + pc.at; now.add(k); if (!seen.has(k)) seen.set(k, { v: pc.v, place: pc.place, dates: Soc.rel(pc.v, P).dates || 0 }); }
      for (const [k, s] of seen) {
        if (now.has(k)) continue; seen.delete(k);
        if ((Soc.rel(s.v, P).dates || 0) > s.dates) setTimeout(() => rateDate(byId(s.v), s.place), 9000);
      }
    } catch (e) { /* */ }
  }, 1500);
  function rateDate(v, place) {
    if (!v) return;
    const liked = (LIKE[v.keys && v.keys.L1] || []).includes(place);
    const r = Soc.rel(v.id, P), f = Soc.F(v.id, P);
    const score = 35 + (liked ? 30 : 0) + f.romance / 6 - (r.boredom || 0) / 5 + Math.random() * 20;
    const stars = clamp(Math.round(score / 20), 1, 5);
    const P0 = FM.MAP.P[place];
    Soc.addRomance(v.id, P, stars * 2 - 2, '데이트 평점');
    if (stars <= 2 && Soc.addBoredom) Soc.addBoredom(r, 5, '아쉬운 데이트');
    const L = L2(); L.dates.unshift({ day: day(), v: v.id, place: P0 ? P0.name : place, stars, liked }); if (L.dates.length > 20) L.dates.length = 20;
    const line = sty(v, RATE_LINE[stars - 1]) + (liked ? ` (${P0 ? P0.name : ''} 진짜 좋아하는 곳이야!)` : '');
    Sim.say(v, line, 5);
    if (FM.Will) FM.Will.remember(v, 'date', `${P0 ? P0.name : place} 데이트 ${'★'.repeat(stars)}`);
    toast(`💑 데이트 평점 ${'★'.repeat(stars)}${'☆'.repeat(5 - stars)} — ${v.name}: "${line}"`);
    Sim.log('romance', `💑 ${pl().name}와(과) ${v.name}의 ${P0 ? P0.name : ''} 데이트 ${'★'.repeat(stars)}`, [v.id, P], stars >= 4 ? 2 : 1);
  }

  // ---------------------------------------------------------
  // 💬 대화 선택지 (연인 · 배우자 · 아이)
  // ---------------------------------------------------------
  const WORK_TALK = {
    c01: '오늘 해바라기가 다 폈어! 손님이 꽃 보고 웃는 거 보면 나도 행복해져.', c02: '진상 손님 왔었는데… 너 생각하면서 웃으면서 넘겼어. 칭찬해 줘!',
    c03: '오늘 카드가 계속 "연인"만 나오더라. …무슨 뜻인지 알지?', c04: '새 블렌딩 차를 만들었어. 이름은 아직 비밀 — 너 이름 붙일까 고민 중.',
    c05: '장수풍뎅이 잡았어!! 엄청 커! 내일 보여줄게!', c06: '토마토가 빨갛게 익었어. 제일 예쁜 건 너 주려고 숨겨 놨지.',
    c07: '인형 기계 집게 고쳤어! 이제 확률 좋아졌다? 뽑으러 와!', c08: '반납 안 된 책 찾느라 하루 다 갔어… 그래도 조용해서 좋았어.',
    c09: '대회 1등 했어!! 상금으로 맛있는 거 사 줄게!', c10: '오늘 찍은 사진 중에 제일 잘 나온 건… 사실 너 사진이야.',
    c11: '오늘 크루아상이 완벽하게 구워졌어! 하나 챙겨 왔지~', c12: '오늘 관객이 엄청 많았어! 근데 네가 없어서 좀 허전했어.',
    c13: '순찰하다가 길 잃은 강아지 주인 찾아줬어! 뿌듯해!', c14: '뜨개 교실 할머니들이 너 언제 데려오냐고 난리야~',
    c15: '오늘 원고 3장 썼어. 남자 주인공 대사가… 좀 너 같아.', c16: '연습하다 넘어졌는데 안 아파! 진짜 괜찮아! …호 해 줄래?',
    c17: '의자 하나 다 만들었어. 우리 집에 둘까? 너 앉을 자리.', c18: '대물 낚았다! 오늘 저녁은 회다!',
    c19: '오늘 VIP 손님이 와인을 칭찬했어. 근데 네 칭찬이 더 듣고 싶네.', c20: '희귀본이 하나 들어왔어. 제일 먼저 너한테 보여주고 싶었어.',
    c21: '어제 공연 반응 미쳤어! 다음엔 너 이름 넣은 곡 틀 거야.', c22: '…장미 가지치기 했다. 별일 없었어. 너는?',
    c23: '배 시간 다 정확했어. 완벽한 하루. …너 보러 온 것까지 포함해서.', c24: '벽화 고래 꼬리 다 그렸어! 완성되면 제일 먼저 보여줄게.',
    c25: '사과 따다가 굴러떨어졌어 ㅋㅋ 안 다쳤어! 사과도 무사해!', c26: '오늘 바다가 잔잔했다. 너와 걷기 좋은 날씨였지.',
    c27: '오늘 몰래 찍은 사진 중에 웃긴 거 많아 ㅋㅋ 보여줄까?', c28: '감기 환자가 많더라. 너도 따뜻하게 입어. 약 챙겨 줄게.',
    c29: '숲에서 반딧불이 봤어. 다음엔 같이 보러 가자.', c30: '신상 들어왔는데 너한테 어울릴 옷만 눈에 보이더라.',
    c31: '오늘 떡볶이 완판이야! 네 몫은 따로 빼놨지.', c32: '오늘 안무 드디어 다 외웠어! 칭찬해 줘!', c33: '오늘 성당 스테인드글라스를 닦았사옵니다. 주인님처럼 빛나더군요.', c34: '…손님 많았어. 피곤해. 오늘은 네가 내 어깨 주물러 줘.', c35: '오늘 타코야키 다 팔았어! 너 주려고 한 판 남겼지, 얼씨구!',
    c36: '오늘 손님이 강호의 고수들처럼 몰려왔소! 그대 생각으로 버텼지.', c37: '오늘 관객이 박수 쳐 줬어! 근데 제일 보여 주고 싶은 건 너야.', c38: '오늘 운행 이상 없었습니다! …보고 싶었습니다.', c39: '아이들이 오늘 그림을 그려 줬어. 우리 둘이 그려져 있더라!', c40: '오늘 그린 그림… 사실 너야. 보여 줘도 돼?',
  };
  const kidAge = c => c.child ? day() - (c.child.birthDay || c.child.birth_date || day()) : null;
  const oOpts = Soc.talkOptions;
  Soc.talkOptions = function (v) {
    const O = oOpts.apply(this, arguments);
    try {
      if (!v || v.balloon) return O;
      const add = [];
      const h = hour(), p = pl();
      if (isMine(v)) {
        const Lv = myLove(), a = annivToday();
        if (a && !did('annivTalk')) add.push({ id: 'annivTalk', label: `🎉 "오늘 우리 ${a.label}이야!"` });
        const j = FM.CastJobs && FM.CastJobs.jobOf(v);
        if (j && !FM.CastJobs.working(v) && !did('workTalk:' + v.id)) add.push({ id: 'workTalk', label: '💼 "오늘 일은 어땠어?"' });
        if (Lv.married && h >= 17 && h < 22 && v.loc === p.loc && !did('dinner')) add.push({ id: 'dinnerTogether', label: '🍽️ 저녁 같이 먹자' });
        if (Lv.married && Sim.time.weekend() && h >= 9 && h < 17 && !did('outing')) add.push({ id: 'familyOuting', label: myKids().some(c => c.child && c.child.stage !== 'BABY') ? '👨‍👩‍👧 가족 나들이 가자!' : '🚶 둘이 산책 가자' });
        if (!did('hug:' + v.id)) add.push({ id: 'loveHug', label: Lv.married ? '🤗 꼭 안아 주기' : '🤝 손 잡기' });
      }
      if (v.child && v.child.parents.includes(P) && (h >= 20 || h < 2) && !did('tuck:' + v.id)) add.push({ id: 'baby:tuck', label: '🌙 재워 주기 (이불 덮어 주기)' });
      if (!add.length) return O;
      const bi = O.findIndex(o => o.id === 'bye');
      O.splice(bi < 0 ? O.length : bi, 0, ...add);
    } catch (e) { console.error('love2 opts', e); }
    return O;
  };
  const oChoose = Soc.playerChoose;
  Soc.playerChoose = function (v, id, arg) {
    try {
      const back = text => ({ text: J(text), options: Soc.talkOptions(v) });
      if (id === 'annivTalk') {
        const a = annivToday(); once('annivTalk');
        Soc.addRomance(v.id, P, 12, '기념일 축하'); Soc.addFriend(v.id, P, 6, 6, '기념일');
        Sim.emote(v, '💖'); Sim.fx && Sim.fx('hearts', v);
        if (FM.Will) FM.Will.remember(v, 'date', `${a ? a.label : ''} 기념일을 같이 축하했어`);
        L2().diary.unshift({ day: day(), text: `🎉 ${v.name}와(과) ${a ? a.label : ''} 기념일을 축하했다` });
        return back(sty(v, `기억하고 있었구나…! ${a ? a.n + '일' : ''} 동안 고마워. 앞으로도 잘 부탁해 💕`));
      }
      if (id === 'workTalk') {
        once('workTalk:' + v.id);
        const j = FM.CastJobs && FM.CastJobs.jobOf(v);
        Soc.addFriend(v.id, P, 4, 5, '일 얘기 들어줌'); Soc.addRomance(v.id, P, 3, '다정한 관심');
        v.stress = Math.max(0, (v.stress || 0) - 15);
        Sim.emote(v, '😊');
        return back(sty(v, WORK_TALK[v.castId] || `${j ? j.where : '일터'}에서 좀 바빴어. 그래도 네가 물어봐 주니까 피로가 싹 풀린다.`));
      }
      if (id === 'dinnerTogether') {
        once('dinner');
        Soc.addRomance(v.id, P, 8, '함께한 저녁'); Soc.addFriend(v.id, P, 4, 4, '저녁 식사');
        v.hunger = 0; if (pl().hunger != null) pl().hunger = 0;
        const kids = myKids().filter(c => c.child && c.loc === v.loc);
        for (const c of kids) c.child.parenting_satisfaction = clamp((c.child.parenting_satisfaction || 50) + 5, 0, 100);
        Sim.emote(v, '🍽️');
        Sim.log('romance', `🍽️ ${pl().name}네 가족이 함께 저녁을 먹었어요${kids.length ? ` (아이 ${kids.length}명과 함께)` : ''}`, [v.id, P].concat(kids.map(c => c.id)), 1);
        L2().diary.unshift({ day: day(), text: `🍽️ ${v.name}${kids.length ? ', 아이들' : ''}와(과) 저녁을 먹었다` });
        const menu = pick(['된장찌개', '파스타', '카레', '김치볶음밥', '스테이크', '생선구이']);
        return back(sty(v, `오늘 저녁은 ${menu}! 같이 먹으니까 더 맛있다. ${WORK_TALK[v.castId] ? '아 맞다, 오늘 있잖아 — ' + WORK_TALK[v.castId] : ''}`));
      }
      if (id === 'familyOuting') {
        once('outing');
        const kids = myKids().filter(c => c.child && c.child.stage !== 'BABY' && !c.status.hospital);
        Soc.addFollower(v, 'walk');
        for (const c of kids) { Soc.addFollower(c, 'walk'); c.child.parenting_satisfaction = clamp((c.child.parenting_satisfaction || 50) + 8, 0, 100); if (c.child.env) c.child.env.outdoor = (c.child.env.outdoor || 0) + 1; }
        Soc.addRomance(v.id, P, 10, '가족 나들이'); Soc.addBoredom && Soc.addBoredom(Soc.rel(v.id, P), -20, '나들이');
        Sim.log('romance', `👨‍👩‍👧 ${pl().name}네 가족 주말 나들이!`, [v.id, P].concat(kids.map(c => c.id)), 2);
        L2().diary.unshift({ day: day(), text: `👨‍👩‍👧 ${kids.length ? '가족 모두' : v.name + '와(과) 둘이서'} 주말 나들이를 갔다` });
        return { text: J(sty(v, kids.length ? '좋아! 얘들아~ 나들이 간다! 엄마 아빠 손 꼭 잡아!' : '좋아! 어디로 갈까? 네가 앞장서!')), close: true };
      }
      if (id === 'loveHug') {
        once('hug:' + v.id);
        const Lv = myLove();
        Soc.addRomance(v.id, P, 4, Lv.married ? '포옹' : '손잡기'); Soc.addBoredom && Soc.addBoredom(Lv.r, -8, '스킨십');
        Sim.emote(v, Lv.married ? '🤗' : '😳'); Sim.fx && Sim.fx('hearts', v);
        return back(sty(v, Lv.married ? '…이렇게 있으면 하루 피로가 다 녹아.' : '에, 갑자기…? …놓지 마.'));
      }
      if (id === 'baby:tuck') {
        once('tuck:' + v.id);
        v.child.parenting_satisfaction = clamp((v.child.parenting_satisfaction || 50) + 6, 0, 100);
        v.energy = 100; Sim.emote(v, '💤');
        if (FM.Will) FM.Will.remember(v, 'family', '이불 덮어 주고 재워 줬어');
        L2().diary.unshift({ day: day(), text: `🌙 ${v.name}을(를) 재웠다 (${kidAge(v) + 1}일째)` });
        const sp = Soc.partnerOf(P); if (sp) Soc.addRomance(sp, P, 2, '육아 분담');
        return { text: J(pick(['…엄마 아빠, 내일도 놀아 줘… (새근새근)', '자장가 한 번 더… zzz', '오늘 재밌었어… 사랑해… 💤', '불 끄지 마… 아니 꺼도 돼… 쿨쿨'])), close: true };
      }
    } catch (e) { console.error('love2 choose', e); }
    return oChoose.apply(this, arguments);
  };

  // 아이 성장 일기 (단계가 바뀌면 기록)
  FM.bus.on('hour', h => {
    try {
      if (h !== 7) return;
      const L = L2(); L.kidStage = L.kidStage || {};
      for (const c of myKids()) {
        const sg = c.child ? c.child.stage : 'ADULT';
        if (L.kidStage[c.id] && L.kidStage[c.id] !== sg) {
          const nm = { TODDLER: '아장아장 걷기 시작했다', CHILD: '어린이가 되었다', ADULT: '어른이 되어 독립했다' }[sg] || '한 뼘 더 자랐다';
          L.diary.unshift({ day: day(), text: `🌱 ${c.name}이(가) ${nm}` });
          toast(`🌱 ${c.name}이(가) ${nm}!`);
        }
        L.kidStage[c.id] = sg;
      }
      if (L.diary.length > 40) L.diary.length = 40;
    } catch (e) { /* */ }
  });

  // ---------------------------------------------------------
  // 📱 폰 '연애' 앱
  // ---------------------------------------------------------
  const face = (v, px) => (FM.Face && v ? FM.Face.img(v, px) : '🙂');
  const bar = (n, c) => `<div class="pa-bar"><i style="width:${clamp(n || 0, 0, 100)}%${c ? ';background:' + c : ''}"></i></div>`;
  const STAGE_KO = { DATING: '💗 연애 중', ENGAGED: '💍 약혼', MARRIED: '💒 결혼' };
  const KID_KO = { BABY: '👶 아기', TODDLER: '🧸 유아', CHILD: '🎒 어린이' };
  let lv = { tab: 'me' };
  function nextGoal(Lv) {
    const M = D.MARRIAGE, r = Lv.r, p = pl();
    if (Lv.married) {
      const kids = myKids();
      if (!kids.length) return '👶 "우리 아기 갖자" — 배우자와 대화해 보세요';
      const c = kids.find(k => k.child); return c ? `🌱 ${c.name} 독립까지 ${Math.max(0, (FM.Life ? FM.Life.INDEP_DAY : 15) - kidAge(c))}일 — 매일 돌봐 주세요` : '🏡 행복한 가족! 주말엔 가족 나들이를';
    }
    if (Lv.engaged) return '💒 결혼식 준비 중 — 곧 결혼식이에요!';
    const need = [];
    const dd = day() - r.since; if (dd < M.minDatingDays) need.push(`연애 ${dd}/${M.minDatingDays}일`);
    const af = Soc.affection(Lv.v.id, P); if (af < M.affection) need.push(`호감 ${Math.round(af)}/${M.affection}`);
    const ro = Soc.F(Lv.v.id, P).romance; if (ro < M.romance) need.push(`설렘 ${Math.round(ro)}/${M.romance}`);
    if ((p.houseLevel || 1) < M.houseLevel) need.push('집 2단계 증축');
    if (!(p.inv.ring || p.inv.feather)) need.push('약혼반지');
    return need.length ? `💍 청혼까지: ${need.join(' · ')}` : '💍 지금 청혼할 수 있어요! 반지를 들고 말을 걸어 보세요';
  }
  function viewMe() {
    const Lv = myLove(), L = L2();
    if (!Lv) {
      const crushes = S().villagers.filter(v => !v.child && Soc.canRomance(v.id, P)).map(v => [v, Soc.F(v.id, P).romance]).filter(x => x[1] > 5).sort((a, b) => b[1] - a[1]).slice(0, 5);
      return `<div class="pa-card pa-empty"><div style="font-size:44px">💌</div><b>아직 연인이 없어요</b><div class="pa-sub">친해진 주민에게 💗 설레는 말을 하고, 친구 단계가 되면 💌 고백해 보세요</div></div>
        <div class="pa-sub" style="margin:10px 4px 4px">💘 나에게 설레는 주민</div>
        ${crushes.length ? crushes.map(([v, n]) => `<button class="pa-todo" data-lgo="${v.id}">${face(v, 36)}<span style="flex:1">${esc(v.name)} <small>${esc(v.castJob || '')}</small>${bar(n)}</span><small>${Math.round(n)}</small></button>`).join('') : '<div class="pa-todo"><span>아직 없어요 — 말을 많이 걸어 보세요</span></div>'}`;
    }
    const v = Lv.v, r = Lv.r, f = Soc.F(v.id, P), af = Soc.affection(v.id, P);
    const bs = Soc.boredomStage ? Soc.boredomStage(r) : 'STABLE';
    const bsKo = { STABLE: '😊 안정', MILD_BOREDOM: '😐 시들', DANGER: '😟 위기', CRITICAL: '💔 이별 직전' }[bs];
    const w = FM.Guide && FM.Guide.whereIs ? FM.Guide.whereIs(v) : null;
    const j = FM.CastJobs && FM.CastJobs.jobOf(v), work = j && FM.CastJobs.working(v);
    const a = annivToday();
    const nextA = (Lv.married ? ANNIV_M : ANNIV_D).find(n => n > dPlus(Lv));
    const msgs = L.msgs.slice(0, 4);
    return `<div class="pa-card">
        <div><span class="pa-tag">${STAGE_KO[r.status] || (Lv.married ? STAGE_KO.MARRIED : '')}</span></div>
        <div class="pa-ring" style="margin-top:8px">${face(v, 104)}</div>
        <div class="pa-name">${esc(v.name)} 💕 ${esc(pl().name)}</div>
        <div class="pa-sub" style="font-size:20px;color:#ff6fa8">${Lv.married ? '결혼' : '사귄 지'} D+${dPlus(Lv)}</div>
        <div class="pa-sub">${a ? `🎉 오늘 ${a.label} 기념일!` : nextA ? `다음 기념일: ${Lv.married ? '결혼' : ''} ${nextA}일 (D-${nextA - dPlus(Lv)})` : ''}</div>
        <div class="pa-sub" style="text-align:left;margin-top:8px">💗 설렘 ${Math.round(f.romance)}</div>${bar(f.romance)}
        <div class="pa-sub" style="text-align:left">🤝 호감 ${Math.round(af)}</div>${bar(af, 'linear-gradient(90deg,#7ad8f0,#9ab8f0)')}
        <div class="pa-sub" style="text-align:left">🥱 권태 ${Math.round(r.boredom || 0)} · ${bsKo}</div>${bar(r.boredom, 'linear-gradient(90deg,#d8d0e8,#9a8cb8)')}
        <div class="pa-sub">📍 ${esc(w ? w.label : '')}${work ? ` · 💼 ${esc(j.where)} 근무 중` : j ? ` · 💼 ${esc(j.where)} (${Math.floor(j.from)}시~${Math.floor(j.to) % 24}시)` : ''}</div>
        <div class="pa-sub">💑 데이트 ${r.dates || 0}회</div>
        <div class="pa-todo" style="margin-top:8px"><span>${esc(nextGoal(Lv))}</span></div>
        <div class="pa-acts"><button class="on" data-la="talk">💬 만나기</button><button data-la="date">💑 데이트</button><button data-la="prof">👤</button></div>
      </div>
      <div class="pa-sub" style="margin:10px 4px 4px">💌 받은 문자</div>
      ${msgs.length ? msgs.map((m, i) => { const mv = byId(m.v); return `<div class="pa-todo" style="flex-wrap:wrap">${face(mv, 30)}<span style="flex:1">${esc(m.text)}<br><small>${m.day}일차 ${esc(m.hm || '')}</small></span>${m.replied ? `<small>↪ ${esc(m.replied)}</small>` : `<div style="display:flex;gap:4px;flex-wrap:wrap;width:100%">${REPLY.map((x, k) => `<button class="pa-mini" style="flex:1;font-size:12px" data-rep="${i}:${k}">${x[0]}</button>`).join('')}</div>`}</div>`; }).join('') : '<div class="pa-todo"><span>아직 문자가 없어요</span></div>'}
      ${L.dates.length ? `<div class="pa-sub" style="margin:10px 4px 4px">⭐ 데이트 기록</div>${L.dates.slice(0, 5).map(d => `<div class="pa-todo"><span style="flex:1">${d.day}일차 · ${esc(d.place)}${d.liked ? ' 💖' : ''}</span><small style="color:#ffb000">${'★'.repeat(d.stars)}${'☆'.repeat(5 - d.stars)}</small></div>`).join('')}` : ''}`;
  }
  function viewFamily() {
    const kids = myKids(), L = L2();
    const k = kids.length ? kids.map(c => {
      const age = kidAge(c), indep = FM.Life ? FM.Life.INDEP_DAY : 15;
      const sat = c.child ? c.child.parenting_satisfaction || 0 : 100;
      const cw = FM.CastJobs && FM.CastJobs.jobOf(c);
      return `<div class="pa-card" style="margin-bottom:8px;text-align:left;display:flex;gap:12px;align-items:center">${face(c, 64)}<div style="flex:1">
        <b>${esc(c.name)}</b> <small>${c.child ? KID_KO[c.child.stage] || '' : '🎓 독립'}</small>
        <div class="pa-sub">${c.child ? `${age + 1}일째 · 독립까지 ${Math.max(0, indep - age)}일` : cw ? `💼 ${esc(cw.title || '')} · ${esc(cw.where)}` : '어른이 되었어요'}</div>
        ${c.child ? `<div class="pa-sub">🥰 육아 만족도 ${Math.round(sat)}</div>${bar(sat, 'linear-gradient(90deg,#ffe070,#ffb07a)')}` : ''}
        <div class="pa-acts" style="margin-top:4px"><button data-lgo="${c.id}">📍 가기</button></div></div></div>`;
    }).join('') : `<div class="pa-card pa-empty"><div style="font-size:44px">🍼</div><b>아직 아이가 없어요</b><div class="pa-sub">결혼 후 배우자에게 👶 "우리 아기 갖자"라고 말해 보세요</div></div>`;
    return k + `<div class="pa-sub" style="margin:10px 4px 4px">📔 가족 일기</div>${L.diary.length ? L.diary.slice(0, 8).map(d => `<div class="pa-todo"><span style="flex:1">${esc(J(d.text))}</span><small>${d.day}일차</small></div>`).join('') : '<div class="pa-todo"><span>아직 기록이 없어요</span></div>'}`;
  }
  function viewIsland() {
    const st = S(), seenK = new Set(), out = [];
    for (const r of Object.values(st.rel)) {
      if (!['DATING', 'ENGAGED', 'MARRIED'].includes(r.status) || r.subject_id === P || r.target_id === P) continue;
      const k = [r.subject_id, r.target_id].sort().join(); if (seenK.has(k)) continue; seenK.add(k);
      const a = byId(r.subject_id), b = byId(r.target_id); if (!a || !b) continue;
      out.push(`<div class="pa-todo">${face(a, 32)}<b style="color:#ff6fa8">♥</b>${face(b, 32)}<span style="flex:1">${esc(a.name)} · ${esc(b.name)}<br><small>${STAGE_KO[r.status]} · D+${day() - (r.since || day()) + 1}</small></span></div>`);
    }
    const crushes = st.villagers.filter(v => v.crush && v.crush.target && v.crush.target !== P).slice(0, 6).map(v => `<div class="pa-todo">${face(v, 30)}<span style="flex:1">${esc(v.name)} → ${esc(Sim.nameOf(v.crush.target))} <small>짝사랑 중</small></span></div>`);
    return `<div class="pa-sub" style="margin:4px">💑 섬의 커플 (${out.length})</div>${out.join('') || '<div class="pa-todo"><span>아직 커플이 없어요 — 🤝 관계 만들어주기로 이어 주세요</span></div>'}
      <div class="pa-sub" style="margin:10px 4px 4px">💘 짝사랑 중</div>${crushes.join('') || '<div class="pa-todo"><span>조용하네요…</span></div>'}`;
  }
  function render() {
    const body = document.querySelector('#sideBody'); if (!body) return;
    const seg = `<div class="pa-seg">${[['me', '💕 우리'], ['family', '👨‍👩‍👧 가족'], ['island', '🏝️ 섬 커플']].map(([k, t]) => `<button data-lt="${k}" class="${lv.tab === k ? 'on' : ''}">${t}</button>`).join('')}</div>`;
    const html = ({ me: viewMe, family: viewFamily, island: viewIsland })[lv.tab]();
    body.innerHTML = `<div class="pa">${seg}${html}</div>`;
    body.querySelectorAll('[data-lt]').forEach(b => b.onclick = () => { lv.tab = b.dataset.lt; render(); });
    body.querySelectorAll('[data-rep]').forEach(b => b.onclick = () => { const [i, k] = b.dataset.rep.split(':').map(Number); replyMsg(i, k); render(); });
    body.querySelectorAll('[data-lgo]').forEach(b => b.onclick = () => { const v = byId(b.dataset.lgo); if (!v) return; UI.phone && UI.phone.close(); if (FM.Guide && FM.Guide.walkTo) FM.Guide.walkTo({ villager: v.id }); else UI.goTo(v); });
    body.querySelectorAll('[data-la]').forEach(b => b.onclick = () => {
      const Lv = myLove(); if (!Lv) return; const v = Lv.v, p = pl(), a = b.dataset.la;
      if (a === 'prof') return UI.showProfile && UI.showProfile(v);
      UI.phone && UI.phone.close();
      const near = v.loc === p.loc && Math.hypot(v.x - p.x, v.z - p.z) < 4;
      if (a === 'talk') { if (near) UI.talk(v); else { if (FM.Guide && FM.Guide.walkTo) FM.Guide.walkTo({ villager: v.id }); else UI.goTo(v); UI.toast(`📍 ${v.name}에게 가는 중…`); } }
      if (a === 'date') { UI.toast(`📱 ${v.name}에게 데이트 신청 전화 중…`); if (near) UI.talk(v); else { const r = Soc.playerChoose(v, 'dateMenu'); if (r && r.options) chooseDate(v, r.options); } }
    });
  }
  // 전화로 데이트 장소 정하기
  function chooseDate(v, opts) {
    const places = opts.filter(o => o.id === 'dateAt');
    if (!UI.modal) { UI.talk(v); return; }
    UI.modal(`📞 ${v.name}: "어디 갈까?"`, `<div class="act-list">${places.map((o, i) => `<button data-di="${i}">${esc(o.label)}</button>`).join('')}</div>`, b => {
      b.querySelectorAll('[data-di]').forEach(x => x.onclick = () => {
        const o = places[+x.dataset.di]; UI.closeModal();
        const r = Soc.playerChoose(v, 'dateAt', o.arg); Sim.talkChoosing = false;
        if (r && r.text) UI.toast(`📞 ${v.name}: ${r.text}`);
      });
    });
  }
  FM.Love = { myLove, myKids, render, rateDate, sendMsg };
  if (UI && UI.tab) {
    const oTab = UI.tab;
    UI.tab = function (t) {
      if (t !== 'love') return oTab.apply(this, arguments);
      let r; try { r = oTab.apply(this, arguments); } catch (e) { /* ui.js 에 없는 탭 */ }
      try { render(); } catch (e) { console.error('love2 app', e); }
      return r;
    };
  }
})();
