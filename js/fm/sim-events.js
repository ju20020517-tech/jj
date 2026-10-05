/* =========================================================
 *  장소 이벤트 & 시스템
 *  북쪽/중앙/동쪽/서쪽/남쪽 5대 구역의 엉뚱 AI, 친구모아 뉴스, 랭킹,
 *  시티 코인 경제, 날씨, 병원, 꿈, 방 테마 반응, 스태프 NPC
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, D = FM.D, MAP = FM.MAP, Sim = FM.Sim, L = FM.L, Soc = FM.Soc;
  const { rnd, rint, pick, chance, clamp, dist } = Sim.u;
  const { day, hour, weekday, weekend, inH, hm } = Sim.time;
  const has = Sim.has;
  const emit = FM.bus.emit;
  const Ev = (FM.Ev = {});
  const S = () => Sim.get();
  const P = 'P';
  const byId = id => Sim.byId(id);
  const nm = id => Sim.nameOf(id);

  // =========================================================
  // 스태프 NPC (부장님, 공무원, 판사, 의사, DJ, 셰프 ...)
  // =========================================================
  const STAFF = [
    { id: 's_anchor', name: '나래', role: 'anchor', loc: 'studio_in', x: 0, z: -1.5, ry: 0, look: { species: 'cat', top: 'vest', shirt: 0x2a3a6a, shirt2: 0xffffff, bottom: 'skirt', pants: 0x2a3a6a, fur: 0xfff1e0, eyes: 'sparkle', brows: 'thin', mouth: 'smile', hairStyle: 'bob', hair: 0x3a2a24 } },
    { id: 's_boss', name: '부장님', role: 'boss', loc: 'office_in', x: 3, z: -4.7, ry: 0, look: { species: 'bear', top: 'vest', shirt: 0x2f3b4e, shirt2: 0xffffff, bottom: 'pants', pants: 0x2f3b4e, glasses: 'square', eyes: 'smug', brows: 'thick' } },
    { id: 's_clerk', name: '공무원', role: 'clerk', loc: 'hall_in', x: -4, z: -3.8, ry: 0, look: { species: 'dog', top: 'vest', shirt: 0x5b6b9a, bottom: 'pants', glasses: 'round', brows: 'worried' } },
    { id: 's_judge', name: '판사님', role: 'judge', loc: 'hall_in', x: 4.5, z: -4.2, ry: 0, look: { species: 'sheep', top: 'dress', shirt: 0x1a1a22, glasses: 'square', brows: 'thick' } },
    { id: 's_doctor', name: '의사 선생님', role: 'doctor', loc: 'med_in', x: -4, z: -4.3, ry: 0, look: { species: 'rabbit', top: 'apron', shirt: 0xffffff, shirt2: 0x8fe3c0, glasses: 'round' } },
    { id: 's_dj', name: 'DJ 네온', role: 'dj', loc: 'club_in', x: 0, z: -4.8, ry: 0, look: { species: 'fox', top: 'hoodie', shirt: 0x14101f, glasses: 'sun', hat: 'cap', hatColor: 0xff3a9a } },
    { id: 's_chef', name: '초밥 셰프', role: 'chef', loc: 'sushi_in', x: 0, z: -2.2, ry: 0, look: { species: 'penguin', top: 'apron', shirt: 0xffffff, hat: 'beanie', hatColor: 0xffffff } },
    { id: 's_pub', name: '펍 사장님', role: 'pub', loc: 'pub_in', x: 2.5, z: -3.6, ry: 0, look: { species: 'tanuki', top: 'apron', shirt: 0xc0392b } },
    { id: 's_barista', name: '바리스타', role: 'barista', loc: 'cafe_in', x: 0, z: -2.8, ry: 0, look: { species: 'squirrel', top: 'apron', shirt: 0x8a5a3b, shirt2: 0xfff4e6 } },
    { id: 's_stylist', name: '헤어 디자이너', role: 'stylist', loc: 'mall_in', x: 5, z: -2.5, ry: Math.PI, look: { species: 'cat', top: 'tee', shirt: 0x14101f, hairStyle: 'spiky', fur: 0xff3a9a } },
    { id: 's_grocer', name: '마켓 계산원', role: 'grocer', loc: 'mall_in', x: -1.3, z: 1.0, ry: 0, look: { species: 'rabbit', top: 'apron', shirt: 0x2e5a4a, shirt2: 0xfbf6ec } },
    { id: 's_clerk2', name: '편의점 알바', role: 'conv', loc: 'conv_in', x: 1.8, z: 0.4, ry: Math.PI, look: { species: 'hamster', top: 'vest', shirt: 0x7ad0a0 } },
    { id: 's_tea', name: '차관 주인장', role: 'tea', loc: 'tea_in', x: 0, z: -2.9, ry: 0, look: { species: 'koala', top: 'sweater', shirt: 0x6a4028 } },
    { id: 's_teacher', name: '선생님', role: 'teacher', loc: 'school_in', x: 0, z: -2.4, ry: Math.PI, look: { species: 'deer', top: 'sweater', shirt: 0x5fb070, glasses: 'round' } },
    { id: 's_librarian', name: '사서', role: 'librarian', loc: 'library_in', x: -5, z: 3, ry: Math.PI, look: { species: 'mouse', top: 'vest', shirt: 0x8a5a3b, glasses: 'round' } },
    { id: 's_captain', name: '페리 선장', role: 'captain', loc: 'island', x: 55, z: 92, ry: 0, look: { species: 'duck', top: 'vest', shirt: 0x2f4b6e, hat: 'cap', hatColor: 0xffffff } },
    { id: 's_pocha', name: '포장마차 이모', role: 'pocha', loc: 'island', x: 40, z: 78, ry: Math.PI, look: { species: 'pig', top: 'apron', shirt: 0xff6f61 } },
  ];
  Ev.staff = [];
  function makeStaff() {
    Ev.staff = STAFF.map(s => Object.assign({}, s, { home: s.loc, sx: s.x, sz: s.z, state: 'INTERACT_OBJ', pose: 'stand', bubble: null, emote: null, route: null, sceneId: null, keys: { L1: 'SNOB', L2: 'DILIGENT', L3: 'FORMAL', L4: 'CLEAN' }, stats: { speed: 0, idle: [3, 5] }, status: {}, staff: true,
      look: window.ISLE && ISLE.normalizeLook ? ISLE.normalizeLook(s.look) : s.look }));
  }
  Ev.staffById = id => Ev.staff.find(s => s.id === id);

  // =========================================================
  // 초기화
  // =========================================================
  Ev.init = function () {
    const st = S();
    st.weather = rollWeather();
    st.newsBoard = { items: ['친구모아 아일랜드 개장! 모든 주민이 아파트 "시티 타워"에 입주했습니다.'], at: st.time };
    st.rankings = {};
    computeRankings();
  };
  makeStaff();
  const origLoad = Sim.load;
  Sim.load = function (json) { const r = origLoad(json); makeStaff(); return r; };

  // =========================================================
  // 날씨 (맑음, 흐림, 비, 안개, 강풍)
  // =========================================================
  const WEATHER = { sunny: '☀️ 맑음', cloudy: '☁️ 흐림', rain: '🌧️ 비', fog: '🌫️ 짙은 안개', windy: '🌬️ 강한 바닷바람' };
  Ev.WEATHER = WEATHER;
  function rollWeather() {
    const r = Math.random();
    const type = r < 0.52 ? 'sunny' : r < 0.72 ? 'cloudy' : r < 0.84 ? 'rain' : r < 0.93 ? 'fog' : 'windy';
    return { type, wind: type === 'windy' ? 1 : rnd(0, 0.4) };
  }

  // =========================================================
  // 로그 → 소문 (GOSSIP_SPREAD)
  // =========================================================
  Ev.pickRumor = function (a, b) {
    const st = S();
    const recent = st.log.filter(e => st.time - e.t < 1440 * 2 && e.who.length && !e.who.includes(a.id) && ['couple', 'confess', 'breakup', 'crush', 'jealous', 'triangle', 'gossip', 'wedding', 'room', 'flea', 'medical', 'engage', 'baby', 'quirk'].includes(e.type));
    if (!recent.length) return null;
    const e = pick(recent.slice(-12));
    // 거짓 소문 (드물게) — 제3자 NPC의 거짓 소문을 믿으면 오해 발생
    if (chance(0.035)) {
      const others = st.villagers.filter(v => v !== a && v !== b && !v.child);
      const x = pick(others), y = pick(others.filter(o => o !== x));
      if (x && y) return { text: L.sty(a, `너 그거 알아? ${x.name}가 ${b.name} 험담하는 거 들었어`), reply: L.sty(b, '뭐?! 진짜로?'), false: true, x: x.id, subject: b.id };
    }
    const txt = e.text.replace(/^[^\s]+\s/, '');
    return { text: L.sty(a, `너 그거 들었어? ${txt}`.replace(/[.!]+$/, '')), reply: L.sty(b, pick(['헐, 대박!', '진짜? 몰랐어!', '어머어머!'])), e };
  };
  Ev.applyRumor = function (g, a, b) {
    const st = S();
    if (g.false) {
      // 오해와 사과 퀘스트 (Misunderstanding Event) — friendship_point -15
      const r = Soc.rel(g.subject, g.x);
      Soc.addFriend(g.subject, g.x, -15, -5);
      r.misunderstanding = { by: g.x, until: day() + 5, cause: '거짓 소문' };
      Sim.log('gossip', `😤 ${nm(g.subject)}이(가) 거짓 소문을 믿고 ${nm(g.x)}에게 삐졌어요!`, [g.subject, g.x], 2);
      Sim.emote(byId(g.subject), '💢', 4);
      Soc.addQuest({ type: 'apology', title: `🎁 ${nm(g.subject)}와(과) ${nm(g.x)} 화해시키기`, giver: g.x, target: g.subject, desc: `${nm(g.x)} 대신 '화해의 선물' 또는 '사과 편지'를 ${nm(g.subject)}에게 전달하세요. (신뢰도 +20)` });
      return;
    }
    if (g.e) for (const id of g.e.who) { const v = byId(id); if (v) v.reputation = clamp(v.reputation + (['couple', 'wedding', 'engage', 'baby'].includes(g.e.type) ? 2 : -1), 0, 100); }
    st.stats.gossip = (st.stats.gossip || 0) + 1;
  };

  // =========================================================
  // 친구모아 뉴스 (09:00 / 19:00) & 실시간 도시 랭킹
  // =========================================================
  function computeRankings() {
    const st = S();
    const vs = st.villagers.filter(v => !v.child);
    const insider = vs.map(v => ({ v, n: vs.filter(o => o !== v && Soc.hasRel(v.id, o.id) && Soc.stageAtLeast(v.id, o.id, 'FRIEND')).length * 10 + v.reputation / 10 })).sort((a, b) => b.n - a.n).slice(0, 3);
    const debt = vs.slice().sort((a, b) => (b.debt - b.coins * 0.001) - (a.debt - a.coins * 0.001)).slice(0, 3);
    const rich = vs.slice().sort((a, b) => b.coins - a.coins).slice(0, 3);
    const love = vs.map(v => ({ v, n: Object.values(st.dir).length ? vs.reduce((s, o) => s + (Soc.F(o.id, v.id).romance > 40 ? 1 : 0), 0) : 0 })).sort((a, b) => b.n - a.n).slice(0, 3);
    st.rankings = {
      insider: insider.map(x => ({ id: x.v.id, name: x.v.name, val: Math.round(x.n) })),
      debt: debt.map(v => ({ id: v.id, name: v.name, val: v.debt })),
      rich: rich.map(v => ({ id: v.id, name: v.name, val: v.coins })),
      love: love.map(x => ({ id: x.v.id, name: x.v.name, val: x.n })),
    };
  }
  Ev.computeRankings = computeRankings;
  function broadcastNews() {
    const st = S();
    const since = st.lastNewsT || 0;
    const src = st.log.filter(e => e.t > since && e.imp >= 2 && !e.secret).slice(-6);
    const items = src.map(e => (e.newsKind === 'drama' && !/속보/.test(e.text) ? '속보! ' : '') + e.text.replace(/^[^\s]+\s/, ''));
    const cards = src.map((e, i) => ({ text: items[i], who: (e.who || []).slice(0, 3), type: e.type, icon: e.newsKind === 'drama' ? '🚨' : (e.text.match(/^(\S+)\s/) || [])[1] || '📰', breaking: e.newsKind === 'drama' }));
    if (st.flea && st.flea.sold && st.flea.sold.length) for (const s of st.flea.sold.splice(0)) items.push(`${s.who}님이 벼룩시장에서 '${s.item}'을(를) ${s.price.toLocaleString()}원에 판매했습니다`);
    computeRankings();
    const R = st.rankings;
    if (R.insider[0]) items.push(`섬 최고의 인싸 주민 TOP 3: ${R.insider.map((x, i) => `${i + 1}위 ${x.name}`).join(', ')}`);
    if (R.debt[0] && R.debt[0].val > 0) items.push(`가장 빚이 많은 주민 TOP 3: ${R.debt.filter(x => x.val > 0).map((x, i) => `${i + 1}위 ${x.name}(${x.val}코인)`).join(', ')}`);
    items.push(`오늘의 날씨: ${WEATHER[st.weather.type]}`);
    if (!items.length) items.push('오늘도 평화로운 친구모아 아일랜드입니다.');
    st.lastNewsT = st.time;
    for (let i = cards.length; i < items.length; i++) cards.push({ text: items[i], who: [], type: 'info', icon: i === items.length - 1 ? '☀️' : '🏆' });
    const anc = Ev.staffById('s_anchor') || st.villagers.find(v => v.job === 'anchor');
    st.newsBoard = { items, cards, at: st.time, anchor: anc ? anc.name : '친구모아 앵커', anchorId: anc ? anc.id : null };
    st.news.push({ day: day(), hm: hm(), items, cards, anchorId: anc ? anc.id : null, seen: false });
    if (st.news.length > 40) st.news.shift();
    const anchor = st.villagers.find(v => v.job === 'anchor' && v.loc === 'studio_in');
    if (anchor) { Sim.say(anchor, `친구모아 뉴스입니다. ${items[0]}`, 6); anchor.pose = 'anchor'; }
    Sim.log('news', `📺 친구모아 뉴스 (${hm()}) — ${items[0]}`, [], 1);
    emit('news', st.newsBoard);
  }
  Ev.broadcastNews = broadcastNews;

  // =========================================================
  // 매 시간
  // =========================================================
  Ev.hourly = function (h) {
    const st = S();
    if (h === 9 || h === 19) broadcastNews();
    // 월급 (City Coin): 평일 18시 (오피스), 16시 (재택)
    if (!weekend() && (h === 18 || h === 16)) {
      for (const v of st.villagers) {
        if (v.child) continue;
        if ((h === 18 && ['office', 'anchor', 'pharmacist'].includes(v.job)) || (h === 16 && v.job === 'freelance')) {
          const pay = rint(D.ECON.payMin, D.ECON.payMax) * (v.job === 'freelance' ? 0.7 : 1) | 0;
          v.coins += pay; v.stats_pay = (v.stats_pay || 0) + pay;
          if (v.debt > 0) { const pd = Math.min(v.debt, Math.floor(v.coins / 2)); v.debt -= pd; v.coins -= pd; }
          if (weekday() === 4 && h === 18 && chance(0.25) && !v.status.hospital) queue('spree', v);
        }
      }
    }
    if (h === 7) morningEvents();
    if (h === 11 && chance(0.18)) popupStore();
    if (h === 13 && weekday() === 5) fleaMarket();
    if (h === 20 && chance(0.12)) flashMob();
    if (h === 12) st.weather.wind = st.weather.type === 'windy' ? 1 : rnd(0, 0.5);
  };

  // =========================================================
  // 매일
  // =========================================================
  Ev.daily = function () {
    const st = S();
    st.weather = rollWeather();
    for (const v of st.villagers) {
      if (v.child) continue;
      // 아파트 집세
      if (v.home && v.home.startsWith('apt')) { if (v.coins >= D.ECON.rent) v.coins -= D.ECON.rent; else { v.debt += D.ECON.rent - v.coins; v.coins = 0; } }
      // 잔고가 0이 되면 며칠간 편의점 삼각김밥만 먹는 빈곤 상태
      if (v.coins <= 0 && !v.status.poorUntil) { v.status.poorUntil = day() + 3; Sim.log('money', `💸 ${v.name}의 잔고가 0이 되었어요... 며칠간 삼각김밥만 먹어야 해요.`, [v.id], 1); }
      if (v.status.poorUntil && v.status.poorUntil <= day()) v.status.poorUntil = 0;
      // 방 청결도 (오래 스트레스 받거나 혼자 있으면 쓰레기)
      const room = st.rooms[v.home];
      if (room && v.home.startsWith) {
        const dirt = (v.stress > 50 ? 12 : 5) + (has(v, 'CLEAN') ? -8 : 0) + (has(v, 'LAZY') || has(v, 'SLOTH') ? 6 : 0);
        room.clean = clamp(room.clean - dirt, 0, 100);
        room.lastDecor = room.lastDecor || day();
        if (day() - room.lastDecor > 5) room.clean = clamp(room.clean - 5, 0, 100);   // 방을 오랫동안 안 꾸며주면
        // 스스로 청소 (청결 취향/부지런함은 자주, 게으름은 가끔)
        const cleanP = has(v, 'CLEAN') ? 0.9 : has(v, 'DILIGENT') ? 0.7 : has(v, 'LAZY') || has(v, 'SLOTH') ? 0.1 : 0.3;
        if (chance(cleanP)) { room.clean = clamp(room.clean + 45, 0, 100); room.trash.splice(0, 3); }
        const want = Math.floor((100 - room.clean) / 18);
        while (room.trash.length < want) { const s = Sim.interiorSize(v.home); room.trash.push({ kind: pick(['snack', 'dust', 'clothes']), x: rnd(-s.w / 2 + 0.6, s.w / 2 - 0.6), z: rnd(-s.d / 2 + 0.6, s.d / 2 - 0.6) }); }
      }
      if (v.status.tanUntil && v.status.tanUntil < st.time) v.status.tanUntil = 0;
      if (v.status.grassUntil && v.status.grassUntil < st.time) v.status.grassUntil = 0;
      if (v.status.forcedUntil && v.status.forcedUntil <= day()) { v.status.forcedOutfit = null; v.status.forcedUntil = 0; Sim.dressFor(v, null); }
      if (v.status.hatUntil && v.status.hatUntil <= day()) { v.status.hatOverride = null; v.status.hatUntil = 0; emit('outfit', v); }
      if (v.status.hairUntil && v.status.hairUntil <= day()) { v.status.hair = null; v.status.hairUntil = 0; emit('outfit', v); }
      if (v.status.tasteQuest && v.status.tasteQuest.until <= st.time) { v.status.tasteKnown = v.status.tasteQuest.target; v.status.tasteQuest = null; const q = st.quests.find(x => x.type === 'taste' && x.giver === v.id && x.state === 'active'); if (q) Soc.finishQuest(q, true, `${v.name}이(가) ${nm(q.target)}의 취향을 파악했어요! (고백 성공률 상승)`); }
    }
    // 비밀 지키기 7일 → [영구 절친 상태]
    for (const q of st.quests.filter(q => q.state === 'active')) {
      if (q.type === 'secret_keep' && day() >= q.until) { const r = Soc.rel(q.giver, P); r.permanent = true; r.friendship_point = Math.max(r.friendship_point, 90); r.trust_level = Math.max(r.trust_level, 90); r.friendship_stage = 'BEST_FRIEND'; Soc.finishQuest(q, true, `${nm(q.giver)}와(과) 영구 절친이 되었어요! 💎`); }
      if (q.deadline && st.time > q.deadline + 60 && q.state === 'active' && q.type !== 'wedding_prep') Soc.finishQuest(q, false, `퀘스트 시간 초과: ${q.title}`);
      if (q.type === 'secret_letter' && q.stage === 'delivered' && day() > q.deliveredDay) {
        const B = byId(q.target); q.stage = 'check';
        if (B) { Sim.balloon(B, 'think', 'gray', { from: q.giver }); Sim.emote(B, '💭', 6); Sim.log('crush', `💭 ${B.name}이(가) 편지를 읽고 고민 풍선을 띄웠어요.`, [B.id], 1); }
      }
    }
    // 타임캡슐 (14일 뒤 함께 파내기)
    for (const c of st.capsules) if (!c.dug && day() >= c.openDay && !c.notified) { c.notified = true; emit('toast', `⏳ ${nm(c.with)}와(과) 묻은 타임캡슐을 파낼 날이에요! (${c.place})`); }
    // NPC ↔ NPC 결혼 조건 충족 → 분홍색 큼직한 고민 풍선
    for (const r of Object.values(st.rel)) {
      if (r.status === 'DATING' && r.subject_id !== P && r.target_id !== P && Soc.marriageReady(r.subject_id, r.target_id) && !r.marryAsked) {
        const v = byId(pick([r.subject_id, r.target_id]));
        r.marryAsked = true;
        Sim.balloon(v, 'marry', 'pink', { partner: v.id === r.subject_id ? r.target_id : r.subject_id, big: true });
        emit('notify', { v, text: `${v.name}이(가) 프러포즈를 고민 중이에요! (분홍색 큼직한 고민 풍선)` });
      }
      // 절친 — 타임캡슐 제안
      if (r.friendship_stage === 'BEST_FRIEND' && (r.subject_id === P || r.target_id === P) && !r.capsuleOffered && chance(0.25)) {
        const v = byId(r.subject_id === P ? r.target_id : r.subject_id);
        if (v && !v.balloon) { r.capsuleOffered = true; Sim.balloon(v, 'capsule', 'yellow', {}); }
      }
    }
    // 플레이어 연인/배우자 관련
    playerLoveDaily();
    // 어린이 이벤트
    kidsDaily();
    // 휴일 아침 전광판 갱신
    computeRankings();
    // 오래 방치된 풍선 정리
    for (const v of st.villagers) if (v.balloon && st.time - v.balloon.since > 1440 * 4 && !['marry'].includes(v.balloon.kind)) v.balloon = null;
  };

  // =========================================================
  // 매 틱
  // =========================================================
  let checkT = 0;
  Ev.tick = function (dtR, dMin) {
    const st = S();
    // 스태프는 장면 중에만 움직임
    for (const s of Ev.staff) {
      if (s.sceneId) continue;
      if (s.route && s.route.length) { Sim.planRoute; stepStaff(s, dtR); continue; }
      if (s.loc !== s.home) { s.loc = s.home; s.x = s.sx; s.z = s.sz; }
      if (s.bubble && s.bubble.until < st.realT) s.bubble = null;
      if (s.emote && s.emote.until < st.realT) s.emote = null;
    }
    for (const v of st.visitors) { if (v.bubble && v.bubble.until < st.realT) v.bubble = null; }
    // 해안가 수영복 자동 환복 / 테마 드레스코드
    for (const v of st.villagers) {
      if (v.sceneId && v.outfit === 'formal') continue;
      if (v.loc === 'island' && v.z > 78 && v.x < 30 && !v.child) { if (v.outfit !== 'swim' && !['formal', 'bride', 'groom'].includes(v.outfit)) Sim.dressFor(v, 'swim'); }
      else if (v.outfit === 'swim' && !(v.status.severe && v.act && v.act.id === 'meditate_fall')) Sim.dressFor(v, null);
      if (v.loc === v.home) {
        const room = st.rooms[v.home];
        const t = room && room.theme && D.THEMES[room.theme];
        if (t && t.dress && v.outfit !== t.dress && !Sim.asleep(v, hour())) Sim.dressFor(v, t.dress);
        if (!t && ['hanbok', 'prisoner', 'worker', 'diving', 'space', 'wrestler', 'robe', 'knit', 'retro', 'baker'].includes(v.outfit)) Sim.dressFor(v, null);
      } else if (v.loc === 'island' && ['hanbok', 'prisoner', 'worker', 'diving', 'space', 'wrestler', 'robe', 'knit', 'retro', 'baker', 'suit'].includes(v.outfit) && !v.status.forcedOutfit && !(v.outfit === 'suit' && !weekend() && inH(hour(), 8.5, 18.5))) Sim.dressFor(v, null);
      // 스트레스 100 → 메디컬 센터 자동 입원
      if (v.stress >= 100 && !v.status.hospital && !v.child) admit(v);
      if (v.status.floatUntil && v.status.floatUntil < st.time) v.status.floatUntil = 0;
    }
    // 10분(게임 시간)마다 장소 이벤트 주사위
    checkT += dMin;
    if (checkT >= 10) { checkT = 0; rollEvents(); }
    runQueue();
  };
  function stepStaff(s, dtR) {
    const leg = s.route[0];
    if (!leg) return;
    if (leg.k === 'walk') {
      const [tx, tz] = leg.pts[0] || [s.x, s.z];
      const dx = tx - s.x, dz = tz - s.z, d = Math.hypot(dx, dz);
      const sp = 1.3 * S().speed * dtR;
      if (d <= sp) { s.x = tx; s.z = tz; leg.pts.shift(); if (!leg.pts.length) s.route.shift(); }
      else { s.x += dx / d * sp; s.z += dz / d * sp; s.ry = Math.atan2(dx, dz); s.moving = true; }
    } else s.route.shift();
  }

  // =========================================================
  // 지연 이벤트 큐 (다른 모듈에서 요청)
  // =========================================================
  const Q = [];
  function queue(kind, a, b) { Q.push({ kind, a, b }); }
  Ev.queue = queue;
  function runQueue() {
    while (Q.length) {
      const { kind, a, b } = Q.shift();
      try { (QH[kind] || (() => {}))(a, b); } catch (e) { console.error(e); }
    }
  }
  const QH = {
    hairChange: v => hairChange(v),
    spree: v => spree(v),
    divorce: m => divorceHearing(m),
  };

  // =========================================================
  // 장소 이벤트 주사위
  // =========================================================
  const free = v => v && !v.sceneId && !v.status.hospital && !v.child && v.loc !== 'metro' && !(v.act && v.act.id === 'sleep') && !v.talkingToPlayer && !v.following;
  const freeKid = v => v && !v.sceneId && v.child && v.child.stage === 'CHILD' && v.loc !== 'metro';
  const at = (v, placeId, r = 20) => { const p = MAP.P[placeId]; return v.loc === 'island' && Math.hypot(v.x - p.x, v.z - p.z) < r || v.loc === p.interior; };
  const inside = (v, iid) => v.loc === iid;
  const who = (f) => S().villagers.filter(v => free(v) && f(v));

  const EVENTS = [
    // ---------------- 북쪽 고지대 ----------------
    { id: 'chuuni', name: '중2병의 고독', w: 0.25, cond: () => S().weather.type === 'rain', run() {
      const v = pick(who(v => v.vain)); if (!v) return;
      Sim.scene({ title: '중2병의 고독', actors: { A: v }, steps: [{ go: 'A', to: { place: 'cliff', spot: 'hill' } }, { pose: 'A', p: 'look', t: 1 }, { say: 'A', text: L.say(v, 'chuuni', {}, true), t: 3 }, { pose: 'A', p: 'wipeTear', t: 2 }, { emote: 'A', e: '💧' }] });
      Sim.log('quirk', `🌧️ ${v.name}이(가) 비 오는 노을 절벽에서 "바람이 차군..." 하며 가짜 눈물을 훔쳤어요.`, [v.id], 1);
    } },
    { id: 'tarzan', name: '종탑 타잔 놀이', w: 0.25, cond: () => !weekend() && inH(hour(), 10, 17), run() {
      const v = pick(who(v => v.prankster)); if (!v) return;
      Sim.scene({ title: '종탑 타잔 놀이', actors: { A: v }, steps: [{ go: 'A', to: { place: 'cathedral', spot: 'belltower' } }, { tp: 'A', loc: 'island', x: 26, z: -82 }, { pose: 'A', p: 'tarzan', t: 6 }, { sfx: 'bell' }, { say: 'A', text: '아~아아~! 🔔', t: 2.5 }] });
      Sim.log('quirk', `🔔 ${v.name}이(가) 몰래 대성당 종탑에서 타잔처럼 스윙을 탔어요!`, [v.id], 1);
    } },
    { id: 'starname', name: '별 이름 짓기', w: 0.5, cond: () => inH(hour(), 22, 3), run() {
      const v = pick(who(v => v.crush && v.crush.target !== P && byId(v.crush.target) && free(byId(v.crush.target)))); if (!v) return;
      const t = byId(v.crush.target);
      const like = has(t, 'ROMANTIC') || has(t, 'DREAMY') || has(t, 'ARTISTIC') || Soc.F(t.id, v.id).romance > 40;
      Sim.scene({ title: '별 이름 짓기', actors: { A: v, B: t }, steps: [
        { par: [{ go: 'A', to: { place: 'observatory', spot: 'telescope' } }, { go: 'B', to: { place: 'observatory', spot: 'telescope', dx: 1.2 } }] }, { face: 'A', at: 'B' },
        { pose: 'A', p: 'point', t: 0.5 }, { say: 'A', text: L.say(v, 'starName', {}, true), t: 3.5 },
        like ? { emote: 'B', e: '😍', t: 3 } : { pose: 'B', p: 'retch', t: 2.5 }, like ? { fx: 'hearts', at: 'B' } : { say: 'B', text: '우웩... (헛구역질)', t: 2 },
      ], onEnd: () => { Soc.addRomance(t.id, v.id, like ? 25 : -10, '별 이름 짓기'); Soc.addFriend(t.id, v.id, like ? 8 : -3, like ? 4 : 0); } });
      Sim.log('romance', `⭐ ${v.name}이(가) 천문대에서 ${t.name}에게 "저 별 이름은 바로 너야"라고 말했어요! ${like ? '(호감도 폭등)' : '(헛구역질...)'}`, [v.id, t.id], 2);
    } },
    { id: 'marshmallow', name: '진실의 마시멜로', w: 0.45, cond: () => inH(hour(), 21, 2), run() {
      const g = who(v => true).slice().sort(() => Math.random() - 0.5).slice(0, 3); if (g.length < 2) return;
      const acts = {}; g.forEach((v, i) => { acts['A' + i] = v; });
      const spots = Sim.SPOTS.filter(s => s.tags.includes('campfire'));
      const teller = g[0];
      const secret = teller.crush ? `사실 나... ${nm(teller.crush.target)}가 좋아.` : pick(['사실 요즘 너무 외로워.', '사실 월급을 다 인형뽑기에 썼어.', '사실 나 무서운 게 제일 싫어.']);
      Sim.scene({ title: '진실의 마시멜로', actors: acts, steps: [
        { par: g.map((v, i) => ({ go: 'A' + i, to: { loc: 'island', x: spots[i % spots.length].x, z: spots[i % spots.length].z } })) },
        { par: g.map((v, i) => ({ pose: 'A' + i, p: 'sit', prop: 'marshmallow', t: 0.1 })) }, { wait: 2 },
        { say: 'A0', text: L.sty(teller, secret), t: 3.5 }, { emote: 'A1', e: '😮' },
        { say: 'A1', text: L.say(g[1], 'marshmallowBurnt', {}, true), t: 3 }, { pose: 'A1', p: 'grimace', t: 2 },
      ], onEnd: () => { for (let i = 1; i < g.length; i++) Soc.addFriend(teller.id, g[i].id, 5, 6); if (teller.crush) { Sim.log('gossip', `🔥 캠핑장에서 ${teller.name}의 속마음이 새어 나왔대요: ${nm(teller.crush.target)}를 좋아한다고!`, [teller.id, teller.crush.target], 2, { rumor: true }); } } });
    } },
    { id: 'soulvow', name: '영혼의 단짝 서약', w: 0.25, cond: () => inH(hour(), 21, 1), run() {
      const st = S();
      const r = Object.values(st.rel).find(r => r.friendship_stage === 'BEST_FRIEND' && r.friend_archetype === 'SOULMATE' && !r.soulVow && r.subject_id !== P && r.target_id !== P && free(byId(r.subject_id)) && free(byId(r.target_id)));
      if (!r) return;
      const a = byId(r.subject_id), b = byId(r.target_id);
      Sim.scene({ title: '영혼의 단짝 서약', actors: { A: a, B: b }, steps: [
        { par: [{ go: 'A', to: { place: 'observatory', spot: 'stars' } }, { go: 'B', to: { place: 'observatory', spot: 'stars', dx: 1 } }] },
        { par: [{ pose: 'A', p: 'lookUp', t: 3 }, { pose: 'B', p: 'lookUp', t: 3 }] }, { say: 'A', text: '은하수에 맹세해. 우린 영혼의 단짝이야.', t: 3.5 }, { say: 'B', text: '영원히.', t: 2 }, { fx: 'sparkle', at: 'A' },
      ], onEnd: () => { r.soulVow = true; r.permanent = true; } });
      Sim.log('friend', `🌌 ${a.name}와(과) ${b.name}이(가) 별빛 천문대에서 영혼의 단짝(Soulmate) 서약을 맺었어요!`, [a.id, b.id], 2);
    } },
    { id: 'waterfall', name: '실연 극복 수련', w: 0.5, cond: () => inH(hour(), 8, 18), run() {
      const v = pick(who(v => v.status.severe || v.depression > 75)); if (!v) return;
      Sim.scene({ title: '망각의 폭포 수련', actors: { A: v }, steps: [
        { go: 'A', to: { place: 'waterfall', spot: 'quiet' } }, { do: () => Sim.dressFor(v, 'swim') }, { tp: 'A', loc: 'island', x: -40, z: -55 }, { pose: 'A', p: 'meditate', t: 0.1 },
        { say: 'A', text: L.say(v, 'waterfallForget', {}, true), t: 4 }, { wait: 3 }, { say: 'A', text: '잊자... 잊자...', t: 4 },
      ], onEnd: () => { v.depression = clamp(v.depression - 25, 0, 100); if (v.depression < 50) v.status.severe = false; } });
      Sim.log('quirk', `💦 심각한 이별 후유증에 빠진 ${v.name}이(가) 수영복을 입고 폭포수를 맞으며 "잊자... 잊자..."를 중얼거려요.`, [v.id], 1);
    } },
    { id: 'pansori', name: '득음의 경지', w: 0.6, cond: () => inH(hour(), 9, 19), run() {
      const v = pick(who(v => v.status.karaokeZero)); if (!v) return;
      v.status.karaokeZero = false;
      Sim.scene({ title: '득음의 경지', actors: { A: v }, steps: [{ go: 'A', to: { place: 'waterfall', spot: 'quiet' } }, { pose: 'A', p: 'sing', t: 0.1 }, { say: 'A', text: L.say(v, 'pansori', {}, true), t: 4 }, { emote: 'A', e: '🔥' }] });
      Sim.log('quirk', `🎤 노래방 0점의 충격을 받은 ${v.name}이(가) 폭포 아래서 판소리하듯 목청을 다듬으며 복수를 다짐해요.`, [v.id], 1);
    } },
    // ---------------- 중앙 코어 ----------------
    { id: 'wish', name: '분수대 소원 동전', w: 0.6, cond: () => inH(hour(), 9, 21), run() {
      const v = pick(who(v => v.crush && v.crush.target)); if (!v) return;
      const center = chance(0.35);
      Sim.scene({ title: '소원 동전 던지기', actors: { A: v }, steps: [
        { go: 'A', to: { place: 'plaza', spot: 'fountain' } }, { pose: 'A', p: 'throw', t: 1 }, { say: 'A', text: L.say(v, 'wishCoin', { t: nm(v.crush.target) }, true), t: 3 },
        center ? { fx: 'glow', at: 'A' } : { wait: 0.5 }, { emote: 'A', e: center ? '✨' : '💧' },
      ], onEnd: () => { if (center) S().wishes[v.id] = S().time + 1440; } });
      if (center) Sim.log('quirk', `🪙 ${v.name}의 소원 동전이 분수대 정중앙에 빠져 빛이 났어요! (24시간 고백 성공률 +20%)`, [v.id], 1, { secret: true });
    } },
    { id: 'soapbox', name: '웅변 박스 기행', w: 0.5, cond: () => inH(hour(), 10, 19), run() {
      const v = pick(who(v => v.vain || has(v, 'ARTISTIC') || v.prankster)); if (!v) return;
      const crowd = who(o => o !== v && at(o, 'plaza', 25)).slice(0, 3);
      const acts = { A: v }; crowd.forEach((c, i) => { acts['C' + i] = c; });
      const claim = pick(D.SOAPBOX);
      Sim.scene({ title: '웅변 박스', actors: acts, steps: [
        { go: 'A', to: { place: 'plaza', spot: 'soapbox' } }, { pose: 'A', p: 'soapbox', t: 0.1 }, { say: 'A', text: L.sty(v, claim), t: 4 },
        { par: crowd.map((c, i) => ({ go: 'C' + i, to: { place: 'plaza', spot: 'soapbox', dx: -2 + i * 1.5, dz: 2 } })) },
        { par: crowd.map((c, i) => chance(0.5) ? { pose: 'C' + i, p: 'clap', t: 2 } : { emote: 'C' + i, e: '👎' }) }, { say: 'A', text: '들어라, 섬 주민들이여!', t: 2.5 },
      ] });
      Sim.log('quirk', `📢 ${v.name}이(가) 분수대 옆 사과 박스 위에서 "${claim}"라고 외쳤어요.`, [v.id], 1);
    } },
    { id: 'bubbles', name: '비눗방울 파티', w: 0.5, cond: () => inH(hour(), 10, 18) && !weekend() || inH(hour(), 10, 18), run() {
      const v = pick([...S().villagers.filter(freeKid), ...who(v => v.prankster)]); if (!v) return;
      const pass = who(o => o !== v && at(o, 'plaza', 22)).slice(0, 3);
      const acts = { A: v }; pass.forEach((c, i) => { acts['P' + i] = c; });
      Sim.scene({ title: '비눗방울 파티', actors: acts, steps: [
        { go: 'A', to: { place: 'plaza', spot: 'plaza' } }, { pose: 'A', p: 'blow', prop: 'bubbleWand', t: 0.1 }, { fx: 'bubbles', at: 'A' }, { say: 'A', text: L.say(v, 'bubble', {}, true), t: 2 },
        { par: pass.map((c, i) => ({ go: 'P' + i, to: { actor: 'A', near: 1.6 + i * 0.4 } })) }, { par: pass.map((c, i) => ({ pose: 'P' + i, p: 'jumpPop', t: 2 })) },
        { par: pass.map((c, i) => ({ emote: 'P' + i, e: '🤣' })) },
      ] });
    } },
    { id: 'cafeGossip', name: '소문 퍼뜨리기 (GOSSIP_SPREAD)', w: 0.8, cond: () => inH(hour(), 9, 18), run() {
      const g = who(v => has(v, 'GOSSIP') || has(v, 'EXTROVERT') || has(v, 'BUSYBODY') || chance(0.2)).slice(0, 2); if (g.length < 2) return;
      const [a, b] = g;
      Sim.scene({ title: '카페 가십', actors: { A: a, B: b }, steps: [
        { par: [{ go: 'A', to: { place: 'cafe', spot: 'cafe' } }, { go: 'B', to: { place: 'cafe', spot: 'cafe', dx: 2.4 } }] }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
        { par: [{ pose: 'A', p: 'drink', prop: 'teacup', t: 0.1 }, { pose: 'B', p: 'drink', prop: 'teacup', t: 0.1 }] },
        { do: sc => { const g2 = Ev.pickRumor(a, b); sc.g = g2; } },
        { say: 'A', text: sc => (sc.g ? sc.g.text : L.topic(a)), t: 3.5 }, { say: 'B', text: sc => (sc.g ? sc.g.reply : '그렇구나~'), t: 2.5 },
      ], onEnd: sc => { if (sc.g) Ev.applyRumor(sc.g, a, b); Soc.addFriend(a.id, b.id, 2, 1); a.coins -= 70; b.coins -= 70; } });
    } },
    { id: 'spit', name: '스파클링 에이드 뿜기', w: 0.5, cond: () => inH(hour(), 9, 18), run() {
      const st = S();
      const v = pick(who(v => v.crush && at(v, 'cafe', 12) && v.crush.target !== P)); if (!v) return;
      const t = byId(v.crush.target); if (!t || t.loc !== 'island') return;
      const other = st.villagers.find(o => o !== t && o !== v && o.loc === t.loc && Math.hypot(o.x - t.x, o.z - t.z) < 3);
      if (!other) return;
      Sim.scene({ title: '에이드 뿜기', actors: { A: v }, steps: [{ pose: 'A', p: 'drink', prop: 'drink', t: 1 }, { face: 'A', at: t.id }, { pose: 'A', p: 'spit', t: 1.5 }, { fx: 'splash', at: 'A' }, { say: 'A', text: '푸웁!! 콜록콜록!', t: 2 }] });
      Sim.log('quirk', `💦 ${v.name}이(가) 카페에서 ${t.name}와(과) ${other.name}이(가) 다정하게 지나가는 걸 보고 음료를 뿜었어요!`, [v.id, t.id], 1);
    } },
    { id: 'shoulder', name: '벤치 어깨 기대기', w: 0.5, cond: () => inH(hour(), 7, 10) || inH(hour(), 17, 20), run() {
      const g = who(v => at(v, 'metro', 12)).slice(0, 2); if (g.length < 2) return;
      const [a, b] = g;
      const blush = has(b, 'SHY') || has(b, 'ROMANTIC') || Soc.F(b.id, a.id).romance > 30;
      Sim.scene({ title: '벤치 어깨 기대기', actors: { A: a, B: b }, steps: [
        { par: [{ go: 'A', to: { place: 'metro', spot: 'bench' } }, { go: 'B', to: { place: 'metro', spot: 'bench', dx: 0.7 } }] },
        { par: [{ pose: 'A', p: 'sit', t: 0.1 }, { pose: 'B', p: 'sit', t: 0.1 }] }, { wait: 2 }, { pose: 'A', p: 'leanSleep', t: 3 },
        blush ? { emote: 'B', e: '😳', t: 3 } : { pose: 'B', p: 'shove', t: 1.5 }, blush ? { wait: 2 } : { say: 'B', text: L.sty(b, '어깨 빌려준 적 없거든?'), t: 2 },
      ], onEnd: () => { if (blush) Soc.addRomance(b.id, a.id, 12, '어깨 기대기'); } });
    } },
    { id: 'lostfound', name: '분실물 센터', w: 0.3, cond: () => inH(hour(), 8, 20), run() {
      const v = pick(who(v => at(v, 'metro', 15) || has(v, 'ARTISTIC'))); if (!v) return;
      Sim.scene({ title: '분실물 센터', actors: { A: v }, steps: [{ go: 'A', to: { place: 'metro', spot: 'lostfound' } }, { pose: 'A', p: 'crouch', t: 1.5 }, { do: () => { v.status.hatOverride = pick(['crown', 'nightcap', 'straw', 'bow', 'bucket']); v.status.hatUntil = day() + 3; emit('outfit', v); } }, { say: 'A', text: L.say(v, 'lostHat', {}, true), t: 3 }, { emote: 'A', e: '😎' }] });
      Sim.log('quirk', `🎩 ${v.name}이(가) 지하철 분실물 센터에서 괴상한 모자를 주워 쓰고 만족해해요.`, [v.id], 1);
    } },
    // ---------------- 동쪽 번화가 ----------------
    { id: 'billfight', name: '계산서 육탄전', w: 0.4, cond: () => inH(hour(), 18, 23), run() {
      const g = who(v => v.vain).slice(0, 2); if (g.length < 2) return;
      const [a, b] = g;
      const broke = a.coins < 300;
      Sim.scene({ title: '스카이라운지 계산서 육탄전', actors: { A: a, B: b }, steps: [
        { par: [{ go: 'A', to: { place: 'skylounge', inside: true, x: -2.5, z: 1.85 } }, { go: 'B', to: { place: 'skylounge', inside: true, x: -2.5, z: 0.15 } }] },
        { par: [{ pose: 'A', p: 'eat', t: 3 }, { pose: 'B', p: 'eat', t: 3 }] },
        { say: 'A', text: '내가 내!', t: 1.5 }, { say: 'B', text: '아니야, 내가 낸다니까!', t: 1.5 }, { par: [{ pose: 'A', p: 'tug', t: 3 }, { pose: 'B', p: 'tug', t: 3 }] },
        ...(broke ? [{ say: 'A', text: '어... 잔고가...', t: 2 }, { go: 'A', to: { place: 'skylounge', inside: true, x: 6, z: 3.5 } }, { do: () => Sim.dressFor(a, 'tux') }, { pose: 'A', p: 'cook', t: 5 }, { say: 'A', text: L.say(a, 'dishwash', {}, true), t: 3 }] : []),
      ], onEnd: () => { if (broke) { a.coins = 0; setTimeout(() => Sim.dressFor(a, null), 0); } else a.coins -= 600; } });
      Sim.log('quirk', broke ? `🍽️ ${a.name}이(가) 돈이 부족해 스카이라운지 주방에서 턱시도를 입고 설거지 알바를 하고 있어요!` : `💳 ${a.name}와(과) ${b.name}이(가) 스카이라운지에서 서로 계산하겠다며 육탄전을 벌였어요.`, [a.id, b.id], 1);
    } },
    { id: 'fashionwar', name: '한정판 명품 쟁탈전 (FASHION_WAR)', w: 0.4, cond: () => inH(hour(), 10, 18), run() {
      const g = who(v => has(v, 'FASHION') || v.vain).slice(0, 2); if (g.length < 2) return;
      const [a, b] = g;
      Sim.scene({ title: 'FASHION_WAR', actors: { A: a, B: b }, steps: [
        { par: [{ go: 'A', to: { place: 'mall', inside: true, x: -0.7, z: -2.7 } }, { go: 'B', to: { place: 'mall', inside: true, x: 0.7, z: -2.7 } }] }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
        { say: 'A', text: '이 황금 정장은 내 거야!', t: 2 }, { say: 'B', text: '내가 먼저 봤거든?!', t: 2 }, { par: [{ pose: 'A', p: 'tug', t: 4 }, { pose: 'B', p: 'tug', t: 4 }] }, { emote: 'A', e: '💢' }, { emote: 'B', e: '💢' },
      ], onEnd: () => Soc.addFriend(a.id, b.id, -3, -2) });
      Sim.log('quirk', `👔 ${a.name}와(과) ${b.name}이(가) 한정판 황금 정장을 두고 옷자락을 잡아당기며 실랑이를 벌였어요!`, [a.id, b.id], 1);
    } },
    { id: 'arcade', name: '점수 내기', w: 0.6, cond: () => inH(hour(), 17, 24) || weekend() && inH(hour(), 12, 24), run() {
      const a = pick(who(v => has(v, 'ATHLETIC'))), b = pick(who(v => v !== a && (has(v, 'CRANKY') || has(v, 'CYNICAL'))));
      const g = a && b ? [a, b] : who(v => has(v, 'PASSIONATE') || has(v, 'EXTROVERT')).slice(0, 2);
      if (g.length < 2) return;
      const [x, y] = g;
      const kind = pick(['pump', 'bowling', 'claw']);
      if (kind === 'pump') {
        const winner = chance(0.5) ? x : y, loser = winner === x ? y : x;
        Sim.scene({ title: '리듬 게임 댄스 배틀', actors: { A: x, B: y }, steps: [
          { par: [{ go: 'A', to: { place: 'arcade', inside: true, x: -5.5, z: -1 } }, { go: 'B', to: { place: 'arcade', inside: true, x: -3.5, z: -1 } }] },
          { par: [{ pose: 'A', p: 'dance', t: 5 }, { pose: 'B', p: 'dance', t: 5 }] }, { sfx: 'score' },
          { pose: loser === x ? 'A' : 'B', p: 'tantrum', t: 3 }, { say: loser === x ? 'A' : 'B', text: L.say(loser, 'arcadeLose', {}, true), t: 2.5 },
          { pose: winner === x ? 'A' : 'B', p: 'taunt', t: 3 }, { say: winner === x ? 'A' : 'B', text: L.say(winner, 'arcadeWin', {}, true), t: 2.5 },
        ], onEnd: () => { Soc.addFriend(x.id, y.id, 2, 1); x.coins -= 100; y.coins -= 100; if (chance(0.3)) loser.status.karaokeZero = true; } });
        Sim.log('quirk', `🕺 ${x.name} vs ${y.name} 펌프 댄스 배틀! 0점을 맞은 ${loser.name}이(가) 바닥에 엎드려 통곡했어요.`, [x.id, y.id], 1);
      } else if (kind === 'bowling') {
        Sim.scene({ title: '볼링 또랑 굴욕', actors: { A: x, B: y }, steps: [
          { par: [{ go: 'A', to: { place: 'arcade', inside: true, x: 1, z: 4 } }, { go: 'B', to: { place: 'arcade', inside: true, x: 3.2, z: 5 } }] }, { pose: 'A', p: 'bowl', t: 2 },
          chance(0.5) ? { say: 'A', text: '앗! 공이 뒤로...! (관람석의 ' + y.name + '에게 명중)', t: 3 } : { say: 'A', text: L.say(x, 'gutter', {}, true) + ' (레인에 같이 굴러떨어졌다)', t: 3 },
          { pose: 'A', p: 'roll', t: 2 }, { emote: 'B', e: '😵' },
        ], onEnd: () => { x.coins -= 80; } });
      } else {
        const crush = x.crush && x.crush.target !== P ? byId(x.crush.target) : null;
        Sim.scene({ title: '인형뽑기 탕진 잼', actors: { A: x }, steps: [
          { go: 'A', to: { place: 'arcade', inside: true, x: -6, z: 3.9 } }, { say: 'A', text: crush ? `${crush.name}에게 대형 인형을 뽑아주겠어!` : '이번엔 꼭 뽑는다!', t: 2.5 },
          { pose: 'A', p: 'game', t: 4 }, { say: 'A', text: L.say(x, 'clawFail', {}, true), t: 2.5 }, { pose: 'A', p: 'kick', t: 1.5 }, { sfx: 'thud' },
        ], onEnd: () => { x.coins = Math.max(0, x.coins - rint(300, 900)); } });
        Sim.log('quirk', `🧸 ${x.name}이(가) 인형뽑기에 통장 잔고를 들이붓다가 결국 기계를 발로 찼어요.`, [x.id], 1);
      }
    } },
    { id: 'sushi', name: '마지막 초밥 눈치 싸움', w: 0.5, cond: () => inH(hour(), 18, 22) || weekend() && inH(hour(), 12, 22), run() {
      const g = who(v => has(v, 'FOOD') || has(v, 'LAZY') || chance(0.3)).slice(0, 2); if (g.length < 2) return;
      const [a, b] = g;
      Sim.scene({ title: '마지막 초밥', actors: { A: a, B: b }, steps: [
        { par: [{ go: 'A', to: { place: 'sushi', inside: true, x: -2.4, z: 0.1 } }, { go: 'B', to: { place: 'sushi', inside: true, x: 2.4, z: 0.1 } }] },
        { par: [{ pose: 'A', p: 'eat', t: 3 }, { pose: 'B', p: 'eat', t: 3 }] }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
        { say: 'A', text: L.say(a, 'lastSushi', {}, true), t: 4 }, { par: [{ emote: 'A', e: '⚡' }, { emote: 'B', e: '⚡' }] }, { wait: 3 }, { pose: 'A', p: 'eat', t: 1.5 }, { emote: 'B', e: '😭' },
      ], onEnd: () => { a.coins -= 150; b.coins -= 150; a.hunger = 10; b.hunger = 20; } });
    } },
    { id: 'pub', name: '원형 테이블 & 회식 뒷담화', w: 0.5, cond: () => !weekend() && inH(hour(), 18.5, 22.5), run() {
      const g = who(v => v.job === 'office').slice(0, 3); if (g.length < 2) return;
      const acts = {}; g.forEach((v, i) => { acts['A' + i] = v; });
      const boss = Ev.staffById('s_boss');
      acts.BOSS = boss;
      const kind = chance(0.5) ? 'susan' : 'boss';
      const seats = [[-2, 1.7], [-2, -0.7], [-0.8, 0.5]];
      const steps = [{ par: g.map((v, i) => ({ go: 'A' + i, to: { place: 'pub', inside: true, x: seats[i][0], z: seats[i][1] } })) }, { par: g.map((v, i) => ({ pose: 'A' + i, p: 'eat', t: 0.1 })) }];
      if (kind === 'susan') steps.push({ say: 'A0', text: L.say(g[0], 'lazySusan', {}, true), t: 3 }, { emote: 'A1', e: '😏' });
      else steps.push({ say: 'A0', text: '우리 부장님 말이야, 진짜...', t: 2.5 }, { say: 'A1', text: '맞아맞아 ㅋㅋ', t: 1.5 }, { tp: 'BOSS', loc: 'pub_in', x: 0, z: 3 }, { go: 'BOSS', to: { loc: 'pub_in', x: -0.5, z: 2.2 } }, { par: g.map((v, i) => ({ pose: 'A' + i, p: 'freeze', t: 3 })) }, { say: 'A0', text: '(문을 열고 들어온 부장님과 눈이 마주쳤다...!) 헉.', t: 3 }, { say: 'BOSS', text: '...다들 즐거워 보이는군.', t: 2.5 });
      Sim.scene({ title: kind === 'susan' ? '원형 테이블 회전 방해' : '사내 회식 뒷담화', actors: acts, steps, onEnd: () => { boss.loc = boss.home; boss.x = boss.sx; boss.z = boss.sz; g.forEach(v => { v.coins -= 120; v.hunger = 15; }); } });
      if (kind === 'boss') Sim.log('quirk', `🍻 퇴근한 ${g.map(v => v.name).join(', ')}이(가) 부장님 흉을 보다가 들어오는 부장님과 눈이 마주쳐 얼어붙었어요.`, g.map(v => v.id), 1);
    } },
    { id: 'openmic', name: '취중 오픈마이크 폭탄 고백', w: 6, cond: () => inH(hour(), 1.8, 2.5), run() {
      const v = pick(who(v => v.loc === 'club_in' && v.crush && v.crush.target !== P)) || pick(who(v => v.crush && v.crush.target !== P && has(v, 'EXTROVERT'))); if (!v) return;
      const t = byId(v.crush.target);
      Sim.scene({ title: '취중 오픈마이크', actors: { A: v }, steps: [
        { go: 'A', to: { place: 'club', inside: true, x: -4, z: -2.8 } }, { pose: 'A', p: 'sing', prop: 'mic', t: 0.1 }, { say: 'A', text: L.say(v, 'openMic', { t: t.name }, true), t: 4 }, { say: 'A', text: '(가사를 잊어버렸다...) 라라라~ 음... 라~', t: 3 },
      ], onEnd: () => { v.crush.player_aware = true; Soc.addRomance(t.id, v.id, chance(0.5) ? 15 : -5, '오픈마이크 고백'); } });
      Sim.log('romance', `🎤 밤 02:00, ${v.name}이(가) 클럽 무대 마이크를 잡고 섬 전체에 "${t.name}야! 내가 너 좋아하는 게 죄냐!"라고 외쳤어요!`, [v.id, t.id], 3, { newsKind: 'openmic' });
    } },
    { id: 'dancebattle', name: '기괴한 댄스 배틀', w: 0.7, cond: () => inH(hour(), 22, 4), run() {
      const g = who(v => v.loc === 'club_in' || has(v, 'EXTROVERT')).slice(0, 3); if (g.length < 2) return;
      const acts = {}; g.forEach((v, i) => { acts['A' + i] = v; });
      Sim.scene({ title: '기괴한 댄스 배틀', actors: acts, steps: [
        { par: g.map((v, i) => ({ go: 'A' + i, to: { place: 'club', inside: true, x: -1 + i, z: 0.5 + (i % 2) } })) },
        ...g.flatMap((v, i) => [{ pose: 'A' + i, p: pick(['robot', 'dance', 'roll']), t: 3 }, { say: 'A' + i, text: pick(L.LINES.danceBattle), t: 2 }]),
        { par: g.map((v, i) => ({ emote: 'A' + i, e: pick(['🙌', '🔥', '😆']) })) },
      ], onEnd: () => g.forEach(v => { v.stress = clamp(v.stress - 20, 0, 100); v.coins -= 50; }) });
    } },
    // ---------------- 서쪽 주거 지구 ----------------
    { id: 'bbq', name: '마당 분쟁 (바비큐)', w: 0.6, cond: () => inH(hour(), 17, 20), run() {
      const st = S();
      const host = pick(who(v => v.home && v.home.startsWith('villa') && v.loc !== 'metro')); if (!host) return;
      const nb = pick(who(v => v !== host && v.home && v.home.startsWith('villa') && v.home !== host.home)) || pick(who(v => v !== host));
      if (!nb) return;
      const plot = MAP.P[FM.INTERIORS[host.home].place];
      const room = st.rooms[host.home];
      if (room && !room.yard) room.yard = [];
      Sim.scene({ title: '마당 바비큐 & 담장 매달리기', actors: { A: host, B: nb }, steps: [
        { go: 'A', to: { loc: 'island', x: plot.x + 3, z: plot.z + plot.plot.doorSide * 6 } }, { pose: 'A', p: 'cook', prop: 'spatula', t: 0.1 }, { fx: 'smoke', at: 'A' },
        { go: 'B', to: { loc: 'island', x: plot.x + 6.5, z: plot.z + plot.plot.doorSide * 6.5 } }, { pose: 'B', p: 'hangWall', t: 0.1 }, { say: 'B', text: L.say(nb, 'bbqSmell', {}, true), t: 3 },
        { say: 'A', text: L.sty(host, chance(0.6) ? '에이, 들어와서 같이 먹자!' : '안 돼! 내 고기야!'), t: 2.5 },
      ], onEnd: () => Soc.addFriend(host.id, nb.id, 4, 2) });
    } },
    { id: 'newlywed', name: '신혼부부의 일상', w: 0.5, cond: () => inH(hour(), 15, 20), run() {
      const st = S();
      const m = st.marriages.find(m => m.marriage_stage === 'MARRIED' && m.spouse_a_id !== P && m.spouse_b_id !== P && free(byId(m.spouse_a_id)) && free(byId(m.spouse_b_id)) && m.matrimonial_home_id.startsWith('villa'));
      if (!m) return;
      const a = byId(m.spouse_a_id), b = byId(m.spouse_b_id);
      const plot = MAP.P[FM.INTERIORS[m.matrimonial_home_id].place];
      const hose = chance(0.5);
      Sim.scene({ title: hose ? '마당 호스 물싸움' : '마당 자쿠지', actors: { A: a, B: b }, steps: [
        { par: [{ go: 'A', to: { loc: 'island', x: plot.x - 2, z: plot.z + plot.plot.doorSide * 6.5 } }, { go: 'B', to: { loc: 'island', x: plot.x + 1, z: plot.z + plot.plot.doorSide * 6.5 } }] },
        hose ? { pose: 'A', p: 'water', prop: 'hose', t: 0.1 } : { par: [{ pose: 'A', p: 'bathe', t: 0.1 }, { pose: 'B', p: 'bathe', t: 0.1 }] },
        hose ? { fx: 'splash', at: 'B' } : { fx: 'bubbles', at: 'A' }, { say: 'A', text: hose ? L.say(a, 'hose', {}, true) : '튜브 타자~!', t: 2.5 }, { par: [{ emote: 'A', e: '😆' }, { emote: 'B', e: '💕' }] },
      ], onEnd: () => { m.marital_satisfaction = clamp(m.marital_satisfaction + 3, 0, 100); const r = Soc.rel(a.id, b.id); r.lastDate = day(); r.dates++; } });
    } },
    { id: 'hammock', name: '해먹 쟁탈전', w: 0.5, cond: () => inH(hour(), 10, 18), run() {
      const sleeper = pick(who(v => has(v, 'LAZY') || has(v, 'SLOTH'))); const kicker = pick(who(v => v !== sleeper && (has(v, 'CRANKY') || v.prankster || has(v, 'LAZY'))));
      if (!sleeper || !kicker) return;
      Sim.scene({ title: '해먹 쟁탈전', actors: { A: sleeper, B: kicker }, steps: [
        { go: 'A', to: { place: 'park', spot: 'hammock' } }, { pose: 'A', p: 'lie', t: 2 }, { emote: 'A', e: '💤' },
        { go: 'B', to: { place: 'park', spot: 'hammock', dx: 0.8 } }, { pose: 'B', p: 'shake', t: 2 }, { say: 'B', text: '비켜! 여긴 오늘 내 자리야!', t: 2.5 }, { say: 'A', text: '으아, 흔들지 마~!', t: 2 },
        { go: 'A', to: { place: 'park', spot: 'lawn' } }, { go: 'B', to: { place: 'park', spot: 'hammock' } }, { pose: 'B', p: 'lie', t: 3 },
      ], onEnd: () => Soc.addFriend(sleeper.id, kicker.id, -2, -1) });
    } },
    { id: 'paperboat', name: '시냇물 종이배', w: 0.6, cond: () => inH(hour(), 9, 20), run() {
      const v = pick(who(v => v.depression > 30 || v.crush && v.crush.stage === 'OBSESSED' || v.status.slumpUntil > S().time)); if (!v) return;
      Sim.scene({ title: '시냇물 종이배', actors: { A: v }, steps: [{ go: 'A', to: { place: 'park', spot: 'stream' } }, { pose: 'A', p: 'crouch', prop: 'paperBoat', t: 2 }, { fx: 'boat', at: 'A' }, { say: 'A', text: L.say(v, 'paperBoat', {}, true), t: 3.5 }] });
    } },
    { id: 'busking', name: '통기타 버스킹 Failure', w: 0.5, cond: () => inH(hour(), 11, 19), run() {
      const v = pick(who(v => v.toneDeaf || has(v, 'MUSIC'))); if (!v) return;
      const aud = who(o => o !== v && at(o, 'park', 30)).slice(0, 2);
      const acts = { A: v }; aud.forEach((c, i) => { acts['C' + i] = c; });
      const bad = v.toneDeaf;
      Sim.scene({ title: '통기타 버스킹', actors: acts, steps: [
        { go: 'A', to: { place: 'park', spot: 'stage' } }, { pose: 'A', p: 'guitar', prop: 'guitar', t: 0.1 }, { say: 'A', text: bad ? '♪ 라~~아아아~ (음이탈) ♪' : '♪ 섬 바람에 실려~ ♪', t: 4 },
        ...(bad ? [{ do: () => emit('birdsFlee', { x: v.x, z: v.z }) }, { fx: 'birds', at: 'A' }, ...aud.map((c, i) => ({ pose: 'C' + i, p: 'earCover', t: 1 })), { par: aud.map((c, i) => ({ go: 'C' + i, to: { place: 'park', spot: 'forest' }, run: true, max: 10 })) }]
          : aud.map((c, i) => ({ pose: 'C' + i, p: 'clap', t: 2 }))),
      ] });
      if (bad) Sim.log('quirk', `🐦 음치 ${v.name}의 통기타 버스킹에 새들이 비명을 지르며 날아가고 주민들이 귀를 막고 도망쳤어요!`, [v.id], 1);
    } },
    { id: 'library', name: '도서관 로맨스', w: 0.6, cond: () => inH(hour(), 10, 19), run() {
      const kind = pick(['eyes', 'letter', 'doze']);
      if (kind === 'eyes') {
        const g = who(v => has(v, 'SHY') || has(v, 'INTROVERT') || has(v, 'SCHOLARLY') || has(v, 'STUDY')).slice(0, 2); if (g.length < 2) return;
        const [a, b] = g;
        if (!Soc.canRomance(a.id, b.id)) return;
        Sim.scene({ title: '서가 사이 눈빛 교환', actors: { A: a, B: b }, steps: [
          { par: [{ go: 'A', to: { place: 'library', inside: true, x: -1.5, z: -4.2 } }, { go: 'B', to: { place: 'library', inside: true, x: 1.5, z: -4.2 } }] },
          { par: [{ pose: 'A', p: 'reach', t: 2 }, { pose: 'B', p: 'reach', t: 2 }] }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
          { par: [{ emote: 'A', e: '😳' }, { emote: 'B', e: '😳' }] }, { par: [{ pose: 'A', p: 'hideFace', prop: 'book', t: 3 }, { pose: 'B', p: 'hideFace', prop: 'book', t: 3 }] },
        ], onEnd: () => { Soc.addRomance(a.id, b.id, 10, '책장 너머 눈맞춤'); Soc.addRomance(b.id, a.id, 10); } });
      } else if (kind === 'letter') {
        const v = pick(who(v => v.crush && v.crush.target !== P)); if (!v) return;
        Sim.scene({ title: '책 속 비밀 편지', actors: { A: v }, steps: [{ go: 'A', to: { place: 'library', inside: true, x: 4.5, z: -4.2 } }, { pose: 'A', p: 'reach', prop: 'letter', t: 2.5 }, { emote: 'A', e: '🤫' }] });
        S().bookNotes = S().bookNotes || [];
        S().bookNotes.push({ from: v.id, to: v.crush.target, day: day(), text: `${nm(v.crush.target)}에게... 너를 볼 때마다 124페이지의 주인공이 된 것 같아.` });
        Sim.log('crush', `📖 누군가 도서관 시집 124페이지에 쪽지를 몰래 끼워두었대요...`, [v.id], 1, { secret: true });
      } else {
        const v = pick(who(v => true)); if (!v) return;
        Sim.scene({ title: '공부하는 척 졸기', actors: { A: v }, steps: [{ go: 'A', to: { place: 'library', inside: true, x: -3.45, z: -0.8 } }, { pose: 'A', p: 'read', prop: 'book', t: 3 }, { pose: 'A', p: 'dozeDesk', t: 5 }, { emote: 'A', e: '💤' }, { say: 'A', text: L.say(v, 'fakeStudy', {}, true), t: 3 }] });
      }
    } },
    { id: 'wobbly', name: '엉뚱한 가구 제작', w: 0.4, cond: () => inH(hour(), 11, 17), run() {
      const v = pick(who(v => v.unskilled || has(v, 'ARTISTIC'))); if (!v) return;
      Sim.scene({ title: '기우뚱 의자 제작', actors: { A: v }, steps: [{ go: 'A', to: { place: 'workshop', inside: true, x: -2, z: -1.2 } }, { pose: 'A', p: 'hammer', prop: 'hammer', t: 5 }, { sfx: 'hammer' }, { say: 'A', text: L.say(v, 'wobbly', {}, true), t: 3.5 }, { emote: 'A', e: '😤' }],
        onEnd: () => { const room = S().rooms[v.home]; if (room) { const s = Sim.interiorSize(v.home); room.furn.push(FM.fdef('wobbly_chair', Sim.u.rnd(-s.w / 3, s.w / 3), Sim.u.rnd(-s.d / 3, s.d / 3), 0)); } } });
      Sim.log('quirk', `🪑 손재주 없는 ${v.name}이(가) 다리 길이가 전부 다른 '기우뚱 의자'를 만들고 완성작이라며 자랑했어요.`, [v.id], 1);
    } },
    { id: 'teaheal', name: '우울 수치 치유', w: 0.8, cond: () => inH(hour(), 21, 2), run() {
      const v = pick(who(v => v.depression > 25)); if (!v) return;
      Sim.scene({ title: '달빛 차관', actors: { A: v }, steps: [{ go: 'A', to: { place: 'teahouse', inside: true, x: 0, z: -1.5 } }, { pose: 'A', p: 'drink', prop: 'teacup', t: 5 }, { say: 'A', text: L.say(v, 'teaHeal', {}, true), t: 3 }], onEnd: () => { v.depression = clamp(v.depression - 20, 0, 100); v.stress = clamp(v.stress - 15, 0, 100); } });
    } },
    { id: 'guestbook', name: '방명록 자작 시', w: 0.5, cond: () => inH(hour(), 20, 2), run() {
      const v = pick(who(v => has(v, 'ROMANTIC') || has(v, 'ARTISTIC') || v.depression > 20)); if (!v) return;
      const poem = pick(D.GUESTBOOK_POEMS);
      const reader = pick(who(o => o !== v));
      const acts = { A: v }; if (reader) acts.B = reader;
      const laugh = reader && (has(reader, 'PRANKSTER') || has(reader, 'CRANKY'));
      Sim.scene({ title: '방명록', actors: acts, steps: [
        { go: 'A', to: { place: 'teahouse', inside: true, x: 3, z: 1.5 } }, { pose: 'A', p: 'write', prop: 'pen', t: 3 }, { say: 'A', text: `"${poem}"`, t: 3 }, { go: 'A', to: { place: 'teahouse', inside: true, x: -2, z: 2.5 } },
        ...(reader ? [{ go: 'B', to: { place: 'teahouse', inside: true, x: 3, z: 1.5 } }, { pose: 'B', p: 'read', t: 2 }, { say: 'B', text: laugh ? '푸하하! 이 시 뭐야? 너무 오글거려!' : '...감동이야. 누가 쓴 걸까.', t: 3 }] : []),
      ] });
      const st = S(); st.guestbook = st.guestbook || []; st.guestbook.push({ who: v.id, poem, day: day() });
    } },
    // ---------------- 남쪽 공공 & 해안 ----------------
    { id: 'office', name: '오피스 해프닝', w: 0.8, cond: () => !weekend() && (inH(hour(), 10, 12) || inH(hour(), 14, 17.5)), run() {
      const g = S().villagers.filter(v => v.loc === 'office_in' && !v.sceneId);
      if (!g.length) return;
      const kind = pick(['pudding', 'copier', 'postit']);
      const v = pick(g);
      if (kind === 'pudding') {
        const owner = pick(g.filter(o => o !== v)); if (!owner) return;
        Sim.scene({ title: '탕비실 푸딩 훔쳐 먹기', actors: { A: v, B: owner }, steps: [
          { go: 'A', to: { loc: 'office_in', x: 6.5, z: -3.7 } }, { pose: 'A', p: 'eat', prop: 'pudding', t: 2.5 }, { go: 'B', to: { loc: 'office_in', x: 5.6, z: -3.2 } }, { face: 'A', at: 'B' },
          { say: 'B', text: `그거... 내 이름 적힌 푸딩인데?`, t: 2.5 }, { pose: 'A', p: 'bow', t: 2 }, { say: 'A', text: '앗! 미, 미안해! 새로 사다 줄게!', t: 2.5 },
        ], onEnd: () => Soc.addFriend(v.id, owner.id, -3, -4) });
        Sim.log('quirk', `🍮 ${v.name}이(가) 탕비실에서 ${owner.name}의 푸딩을 몰래 먹다 걸려서 사죄했어요.`, [v.id, owner.id], 1);
      } else if (kind === 'copier') {
        Sim.scene({ title: '복사기 졸음', actors: { A: v }, steps: [{ go: 'A', to: { loc: 'office_in', x: 2.5, z: 2 } }, { pose: 'A', p: 'type', t: 2 }, { pose: 'A', p: 'dozeDesk', t: 4 }, { fx: 'flash', at: 'A' }, { say: 'A', text: L.say(v, 'copier', {}, true), t: 3 }], onEnd: () => { S().copies = (S().copies || 0) + 1; } });
      } else {
        const t = v.crush && byId(v.crush.target); if (!t || t.loc !== 'office_in') return;
        Sim.scene({ title: '사내 비밀 연애', actors: { A: v }, steps: [{ go: 'A', to: { loc: 'office_in', x: t.x + 0.5, z: t.z - 0.4 } }, { pose: 'A', p: 'point', prop: 'postit', t: 1.5 }, { fx: 'heart', at: 'A' }, { go: 'A', to: { loc: 'office_in', x: -4, z: 2 } }], onEnd: () => Soc.addRomance(t.id, v.id, 8, '하트 포스트잇') });
      }
    } },
    { id: 'cityhall', name: '행정 민원', w: 0.35, cond: () => !weekend() && inH(hour(), 10, 17), run() {
      const v = pick(who(v => true)); if (!v) return;
      const clerk = Ev.staffById('s_clerk');
      if (chance(0.5)) {
        const n = pick(D.NICK_REQUESTS);
        Sim.scene({ title: '개명 & 별명 신청', actors: { A: v, C: clerk }, steps: [{ go: 'A', to: { place: 'cityhall', inside: true, x: -4, z: -2.2 } }, { say: 'A', text: L.say(v, 'nickRequest', { n }, true), t: 3 }, { say: 'C', text: '...네, 처리되었습니다.', t: 2 }], onEnd: () => { v.nick = n; } });
        Sim.log('quirk', `🏛️ ${v.name}이(가) 시청에서 "오늘부터 날 '${n}'(으)로 불러줘"라며 별명 변경을 신청했어요.`, [v.id], 2);
      } else {
        const c = pick(D.COMPLAINTS);
        Sim.scene({ title: '황당 민원', actors: { A: v, C: clerk }, steps: [{ go: 'A', to: { place: 'cityhall', inside: true, x: -4, z: -2.2 } }, { say: 'A', text: L.say(v, 'complaint', { c }, true), t: 3.5 }, { pose: 'C', p: 'facepalm', t: 3 }, { say: 'C', text: '(머리를 짚는다...)', t: 2 }] });
        Sim.log('quirk', `📝 ${v.name}이(가) "${c}"라는 황당한 민원을 제출해 공무원이 머리를 짚었어요.`, [v.id], 1);
      }
    } },
    { id: 'floatpill', name: '약국의 이상한 약', w: 0.3, cond: () => inH(hour(), 9, 20), run() {
      const v = pick(who(v => v.prankster || has(v, 'CURIOUS') || has(v, 'ARTISTIC'))); if (!v) return;
      Sim.scene({ title: '3분 공중 부양 약', actors: { A: v }, steps: [{ go: 'A', to: { place: 'medical', inside: true, x: -3, z: 3.2 } }, { pose: 'A', p: 'drink', prop: 'pill', t: 1.5 }, { do: () => { v.status.floatUntil = S().time + 3; } }, { say: 'A', text: L.say(v, 'floatPill', {}, true), t: 3 }, { pose: 'A', p: 'float', t: 5 }] });
      Sim.log('quirk', `🎈 ${v.name}이(가) 약사가 만든 '먹으면 3분간 공중 부양하는 약'을 먹고 병원 로비를 떠다녔어요!`, [v.id], 1);
    } },
    { id: 'appleVisit', name: '병문안 사과 깎기', w: 8, cool: 60, cond: () => inH(hour(), 10, 20) && S().villagers.some(v => v.status.hospital), run() {
      const pat = pick(S().villagers.filter(v => v.status.hospital)); if (!pat) return;
      const vis = pick(who(v => v !== pat && ((v.crush && v.crush.target === pat.id) || Soc.partnerOf(v.id) === pat.id || Soc.stageAtLeast(v.id, pat.id, 'GOOD_FRIEND')))) || (S().time - (pat.status.admitT || 0) > 1440 ? pick(who(v => v !== pat && Soc.stageAtLeast(v.id, pat.id, 'FRIEND'))) || pick(who(v => v !== pat)) : null); if (!vis) return;
      Sim.scene({ title: '병문안 사과 깎기 스파크', actors: { A: vis }, steps: [{ go: 'A', to: { loc: 'med_in', x: pat.x + 0.9, z: pat.z + 0.4 } }, { face: 'A', at: pat.id }, { pose: 'A', p: 'peel', prop: 'apple', t: 3 }, { say: 'A', text: L.say(vis, 'appleVisit', {}, true), t: 3 }, { fx: 'hearts', at: 'A' }],
        onEnd: () => { Soc.addRomance(pat.id, vis.id, 20, '토끼 모양 사과'); Soc.addFriend(pat.id, vis.id, 10, 10); pat.status.cared = (pat.status.cared || 0) + 1; if (pat.status.cared >= 1) discharge(pat); } });
      Sim.log('romance', `🍎 ${vis.name}이(가) 병실로 찾아와 ${pat.name}에게 토끼 모양 사과를 깎아주었어요. 호감도 폭등!`, [vis.id, pat.id], 2);
    } },
    { id: 'beach', name: '해변 해프닝', w: 0.7, cond: () => inH(hour(), 10, 18) && S().weather.type !== 'rain', run() {
      const kind = pick(['tan', 'surf', 'ball']);
      const v = pick(who(v => kind === 'surf' ? has(v, 'ATHLETIC') || has(v, 'PASSIONATE') : true)); if (!v) return;
      if (kind === 'tan') {
        Sim.scene({ title: '이상한 선탠 자국', actors: { A: v }, steps: [{ go: 'A', to: { place: 'beach', spot: 'sunbed' } }, { do: () => Sim.dressFor(v, 'swim') }, { pose: 'A', p: 'lie', prop: null, t: 5 }, { emote: 'A', e: '💤' }, { say: 'A', text: L.say(v, 'tanLine', {}, true), t: 3 }], onEnd: () => { v.status.tanUntil = S().time + 1440 * 3; v.status.tanShape = pick(['sunglasses', 'star']); emit('outfit', v); } });
        Sim.log('quirk', `😎 ${v.name}이(가) 선베드에서 자다가 ${v.status.tanShape === 'star' ? '별' : '선글라스'} 모양으로 탔어요. 며칠간 그 상태로 섬을 돌아다녀요!`, [v.id], 1);
      } else if (kind === 'surf') {
        Sim.scene({ title: '서핑 굴욕', actors: { A: v }, steps: [{ go: 'A', to: { place: 'beach', spot: 'sea' } }, { do: () => Sim.dressFor(v, 'swim') }, { tp: 'A', loc: 'island', x: v.x, z: 99 }, { pose: 'A', p: 'surf', prop: 'surfboard', t: 3 }, { pose: 'A', p: 'tubeHelp', prop: 'tube', t: 6 }, { say: 'A', text: L.say(v, 'surfFail', {}, true), t: 4 }] });
        v.status.needRescue = S().time + 30;
        Sim.log('quirk', `🏄 ${v.name}이(가) 서핑보드를 타다 파도에 휩쓸려 튜브에 의지한 채 살려달라고 손을 흔들어요!`, [v.id], 1);
      } else {
        const b = pick(who(o => o !== v)); if (!b) return;
        Sim.scene({ title: '비치볼', actors: { A: v, B: b }, steps: [{ par: [{ go: 'A', to: { place: 'beach', spot: 'beachball' } }, { go: 'B', to: { place: 'beach', spot: 'beachball', dx: 3 } }] }, { par: [{ pose: 'A', p: 'volley', t: 4 }, { pose: 'B', p: 'volley', t: 4 }] }, { emote: 'A', e: '😆' }], onEnd: () => Soc.addFriend(v.id, b.id, 3, 1) });
      }
    } },
    { id: 'udon', name: '심야 포장마차 우동 회동', w: 1, cond: () => inH(hour(), 23, 3), run() {
      const g = who(v => v.depression > 15 || v.status.rejectedBy || v.stress > 50).slice(0, 3); if (!g.length) return;
      const acts = {}; g.forEach((v, i) => { acts['A' + i] = v; });
      acts.POCHA = Ev.staffById('s_pocha');
      Sim.scene({ title: '심야 포장마차', actors: acts, steps: [
        { par: g.map((v, i) => ({ go: 'A' + i, to: { place: 'ferry', spot: 'pocha', dx: (i - 1) * 2 } })) }, { par: g.map((v, i) => ({ pose: 'A' + i, p: 'eat', prop: 'bowl', t: 0.1 })) },
        { say: 'POCHA', text: '따뜻한 우동 나왔어~', t: 2 }, ...g.map((v, i) => ({ say: 'A' + i, text: L.say(v, 'udon', {}, true), t: 3 })),
      ], onEnd: () => g.forEach(v => { v.depression = clamp(v.depression - 15, 0, 100); v.hunger = 5; v.coins -= 100; g.forEach(o => o !== v && Soc.addFriend(v.id, o.id, 4, 5)); }) });
    } },
    { id: 'wig', name: '해풍에 모자 날아가기', w: 1, cond: () => S().weather.type === 'windy' && inH(hour(), 8, 20), run() {
      const v = pick(who(v => at(v, 'ferry', 25) || at(v, 'beach', 30) || v.look && v.look.hat && v.look.hat !== 'none')); if (!v) return;
      Sim.scene({ title: '해풍에 모자가 날아감', actors: { A: v }, steps: [
        { go: 'A', to: { place: 'ferry', spot: 'deck' } }, { do: () => { v.status.hatGone = true; emit('outfit', v); } }, { fx: 'hatFly', at: 'A' }, { say: 'A', text: L.say(v, 'wig', {}, true), t: 2.5 },
        { go: 'A', to: { place: 'beach', spot: 'sea' }, run: true }, { pose: 'A', p: 'crouch', t: 1.5 }, { do: () => { v.status.hatGone = false; emit('outfit', v); } }, { emote: 'A', e: '😮‍💨' },
      ] });
    } },
    { id: 'ferry', name: '타 섬 통상 교류', w: 0.4, cond: () => inH(hour(), 10, 17), run() { ferryVisitor(); } },
    // ---------------- 어린이 ----------------
    { id: 'kidsclub', name: '어린이 모임 (Kids Club)', w: 1.2, cond: () => inH(hour(), 14, 17), run() {
      const kids = S().villagers.filter(freeKid);
      if (kids.length < 2) return;
      const acts = {}; kids.slice(0, 5).forEach((v, i) => { acts['K' + i] = v; });
      const game = pick(['무궁화 꽃이 피었습니다', '숨바꼭질']);
      const ks = Object.keys(acts);
      const steps = [{ par: ks.map((k, i) => ({ go: k, to: { place: 'playground', spot: 'playground', dx: i * 0.8 } })) }];
      if (game === '무궁화 꽃이 피었습니다') {
        steps.push({ say: ks[0], text: '무궁화 꽃이~ 피었습니다!', t: 2.5 });
        for (let r = 0; r < 3; r++) steps.push({ par: ks.slice(1).map(k => ({ go: k, to: { place: 'playground', spot: 'playground', dx: 2 - r, dz: 3 - r }, run: true, max: 2 })) }, { par: ks.slice(1).map(k => ({ pose: k, p: 'freeze', t: 1.5 })) }, { say: ks[0], text: '무궁화 꽃이~!', t: 1.5 });
      } else {
        steps.push({ say: ks[0], text: '하나, 둘, 셋... 열! 찾는다~!', t: 2.5 }, { par: ks.slice(1).map((k, i) => ({ go: k, to: { place: 'park', spot: pick(['trees', 'forest', 'lawn']) }, run: true, max: 8 })) }, { go: ks[0], to: { place: 'park', spot: 'trees' }, run: true, max: 10 }, { say: ks[0], text: '찾았다~!', t: 2 });
      }
      steps.push({ par: ks.map(k => ({ emote: k, e: '😆' })) });
      Sim.scene({ title: `어린이 모임: ${game}`, actors: acts, steps, onEnd: () => kids.forEach(k => { k.child.env.kids++; }) });
      Sim.log('kids', `🧒 어린이들이 놀이터에 모여 '${game}'을(를) 했어요!`, kids.map(k => k.id), 1);
    } },
    { id: 'mimic', name: '부모 배우기', w: 0.6, cond: () => inH(hour(), 8, 19), run() {
      const k = pick(S().villagers.filter(freeKid)); if (!k) return;
      const p = byId(k.child.parents.find(x => x !== P)) || null;
      const prop = p ? ({ ATHLETIC: 'dumbbell', SCHOLARLY: 'magnifier', ROMANTIC: 'flower', LAZY: 'snack', MUSIC: 'mic', ARTISTIC: 'brush', SNOB: 'teacup', CRANKY: 'can', ANXIOUS: 'thermometer', EXTROVERT: 'magazine', INTROVERT: 'book' })[p.keys.L1] : 'net';
      Sim.scene({ title: '부모 배우기 (Parent Mimicry)', actors: { K: k }, steps: [{ pose: 'K', p: prop === 'dumbbell' ? 'lift' : 'look', prop, t: 4 }, { emote: 'K', e: '✨' }] });
      k.status.mimicProp = prop;
    } },
  ];
  Ev.EVENTS = EVENTS;

  const lastRun = {};
  function rollEvents() {
    const st = S();
    const n = st.villagers.length;
    const scale = Math.min(1.5, n / 10);
    for (const e of EVENTS) {
      if (lastRun[e.id] && st.time - lastRun[e.id] < (e.cool || 360)) continue;   // 같은 이벤트는 최소 6시간 간격
      if (!e.cond()) continue;
      if (chance(e.w * 0.03 * scale)) { lastRun[e.id] = st.time; try { e.run(); } catch (err) { console.error(e.id, err); } }
    }
  }
  Ev.forceEvent = id => { const e = EVENTS.find(x => x.id === id); if (e) e.run(); };

  // =========================================================
  // 개별 이벤트 구현
  // =========================================================
  function hairChange(v) {
    if (!free(v)) return;
    const stylist = Ev.staffById('s_stylist');
    const shave = chance(0.35);
    Sim.scene({ title: '실연 후 파격 머리 변신', actors: { A: v, S: stylist }, steps: [
      { go: 'A', to: { place: 'mall', inside: true, x: 4, z: -3.45 }, run: true }, { pose: 'A', p: 'sit', t: 0.1 }, { say: 'A', text: L.say(v, 'hairChange', {}, true), t: 2 }, { pose: 'S', p: 'cut', t: 3 }, { fx: 'sparkle', at: 'A' },
      { do: () => { v.status.hair = shave ? 'shaved' : 'neon'; v.status.hairUntil = day() + 7; emit('outfit', v); } }, { say: 'A', text: shave ? '(삭발을 감행했다!) 새로운 나야.' : '(형광 초록색으로 염색했다!) 어때?', t: 3 },
    ], onEnd: () => { v.coins -= 300; } });
    Sim.log('quirk', `💇 차인 ${v.name}이(가) 충격을 받고 뷰티 살롱으로 달려가 ${shave ? '삭발을 감행' : '머리를 형광 초록색으로 염색'}했어요!`, [v.id], 2);
  }
  function spree(v) {
    if (!free(v)) return;
    Sim.scene({ title: '충동구매 폭주', actors: { A: v }, steps: [
      { go: 'A', to: { place: 'mall', inside: true, x: -1.5, z: 2.3 } }, { say: 'A', text: L.say(v, 'spree', {}, true), t: 2.5 }, { pose: 'A', p: 'tryon', t: 2 },
      { do: () => { v.status.forcedOutfit = 'leather'; v.status.forcedUntil = day() + 2; Sim.dressFor(v, 'leather'); } }, { go: 'A', to: { place: 'mall', dz: 12 } }, { pose: 'A', p: 'pose', t: 3 }, { emote: 'A', e: '😎' },
    ], onEnd: () => { v.coins = Math.max(0, v.coins - rint(400, 1200)); } });
    Sim.log('quirk', `🕶️ 월급을 받은 ${v.name}이(가) 선글라스, 왕관, 괴상한 가죽 자켓을 한꺼번에 구매해 입고 길거리에서 폼을 잡아요.`, [v.id], 1);
  }
  function divorceHearing(m) {
    const a = m.spouse_a_id === P ? null : byId(m.spouse_a_id), b = m.spouse_b_id === P ? null : byId(m.spouse_b_id);
    if (!a || !b) { if (a || b) { const r = Soc.rel(m.spouse_a_id, m.spouse_b_id); Soc.doBreakup(r, 'PERSONALITY_CLASH'); } return; }
    const judge = Ev.staffById('s_judge');
    Sim.scene({ title: '이혼 조정 신청 (DIVORCE_HEARING)', major: true, actors: { A: a, B: b, J: judge }, steps: [
      { par: [{ go: 'A', to: { place: 'cityhall', inside: true, x: 3.5, z: -1.9 } }, { go: 'B', to: { place: 'cityhall', inside: true, x: 5.5, z: -1.9 } }] },
      { say: 'J', text: '재산 분할 조정을 시작하겠습니다.', t: 2.5 }, { say: 'A', text: '반려 물고기는 내 거야!', t: 2 }, { say: 'B', text: '저 소파는 내가 산 거라고!', t: 2 },
      { par: [{ pose: 'A', p: 'tug', t: 3 }, { pose: 'B', p: 'tug', t: 3 }] }, { par: [{ emote: 'A', e: '😭' }, { emote: 'B', e: '😭' }] }, { say: 'J', text: '(탕탕) 이혼을 조정합니다.', t: 2.5 },
    ], onEnd: () => {
      const r = Soc.rel(a.id, b.id);
      Soc.doBreakup(r, 'PERSONALITY_CLASH');
      m.marriage_stage = 'DIVORCED';
      const room = Sim.freeHome();
      if (room) { Soc.moveHome(b, room); S().rooms[room] = S().rooms[room] || FM.defaultRoom(b); }
    } });
    Sim.log('divorce', `⚖️ ${a.name}와(과) ${b.name}이(가) 법원에서 재산(반려 물고기, 가구)을 두고 눈물의 몸싸움을 벌이며 이혼했어요.`, [a.id, b.id], 3);
  }
  function popupStore() {
    const g = who(v => true).slice(0, 6); if (g.length < 3) return;
    const acts = {}; g.forEach((v, i) => { acts['A' + i] = v; });
    const cutter = g[g.length - 1];
    Sim.scene({ title: '한정판 굿즈 팝업 스토어', actors: acts, steps: [
      { par: g.map((v, i) => ({ go: 'A' + i, to: { place: 'mall', spot: 'popup', dx: -6 + i * 1.2, dz: 1.5 } })) }, { wait: 2 },
      { go: 'A' + (g.length - 1), to: { place: 'mall', spot: 'popup', dx: -6.5, dz: 1.2 }, run: true }, { say: 'A' + (g.length - 1), text: '(새치기!)', t: 1.5 },
      { say: 'A0', text: '야! 새치기하지 마!', t: 2 }, { say: 'A1', text: '줄 서! 줄!', t: 2 }, { par: g.slice(0, 3).map((v, i) => ({ emote: 'A' + i, e: '💢' })) },
    ], onEnd: () => g.forEach(v => { v.coins -= 200; Soc.addFriend(v.id, cutter.id, -2, -2); }) });
    Sim.log('quirk', `🛍️ 쇼핑몰 앞 한정판 굿즈 팝업 스토어에 대기 줄이 길게 들어서고, ${cutter.name}의 새치기 소동이 일어났어요!`, g.map(v => v.id), 2);
  }
  function flashMob() {
    const g = who(v => true).slice(0, 10); if (g.length < 4) return;
    const acts = {}; g.forEach((v, i) => { acts['A' + i] = v; });
    acts.DJ = Ev.staffById('s_dj');
    Sim.scene({ title: '길거리 스트리트 댄스 플래시몹', major: false, bgm: 'club', place: 'plaza', actors: acts, steps: [
      { tp: 'DJ', loc: 'island', x: 0, z: 17 }, { say: 'DJ', text: '🎧 음악 스타트!', t: 2 },
      { par: g.map((v, i) => ({ go: 'A' + i, to: { place: 'plaza', dx: (i % 5 - 2) * 2, dz: 12 + Math.floor(i / 5) * 2 }, max: 40 })) },
      { par: g.map((v, i) => ({ pose: 'A' + i, p: 'robot', t: 4 })) }, { par: g.map((v, i) => ({ pose: 'A' + i, p: 'dance', t: 4 })) }, { par: g.map((v, i) => ({ emote: 'A' + i, e: '🕺' })) },
    ], onEnd: () => { const dj = Ev.staffById('s_dj'); dj.loc = dj.home; dj.x = dj.sx; dj.z = dj.sz; g.forEach(v => { v.stress = clamp(v.stress - 10, 0, 100); }); } });
    Sim.log('quirk', `🕺 클럽 DJ가 광장으로 나와 음악을 틀자 주민 ${g.length}명이 동시에 기괴한 단체 댄스를 췄어요!`, g.map(v => v.id), 2);
  }
  function fleaMarket() {
    const st = S();
    const sellers = who(v => true).slice(0, 3);
    st.flea = { day: day(), stalls: sellers.map((v, i) => ({ who: v.id, item: pick(D.FLEA_ITEMS) })), sold: [] };
    sellers.forEach((v, i) => {
      Sim.scene({ title: '주말 플리마켓', actors: { A: v }, steps: [{ go: 'A', to: { place: 'workshop', spot: 'flea', dx: (i - 1) * 6 } }, { pose: 'A', p: 'stand', t: 1 }, { say: 'A', text: L.sty(v, `${st.flea.stalls[i].item.name} 팝니다! ${st.flea.stalls[i].item.price.toLocaleString()}원!`), t: 4 }, { wait: 20 }] });
    });
    const buyer = pick(who(v => !sellers.includes(v)));
    if (buyer && sellers[0]) {
      const s = st.flea.stalls[0];
      Sim.scene({ title: '가격 흥정', actors: { A: buyer }, steps: [{ go: 'A', to: { place: 'workshop', spot: 'flea', dx: -6, dz: 1.2 } }, { say: 'A', text: '에이~ 깎아줘요!', t: 2.5 }, { emote: 'A', e: '🤝' }],
        onEnd: () => { st.flea.sold.push({ who: nm(s.who), item: s.item.name, price: s.item.price }); buyer.coins -= s.item.price / 10; const sv = byId(s.who); if (sv) sv.coins += s.item.price / 10; } });
    }
    Sim.log('flea', `🧺 토요일 오후, ${sellers.map(v => v.name).join(', ')}이(가) 플리마켓 가판대에 이상한 물건을 올렸어요.`, sellers.map(v => v.id), 1);
  }
  function ferryVisitor() {
    const st = S();
    if (st.visitors.length >= 2) return;
    const look = window.ISLE && ISLE.randomLook ? ISLE.randomLook() : { species: 'dog' };
    const names = ['뽀삐', '마루', '해피', '라온', '바다', '소금'];
    const vis = { id: 'x' + Date.now() % 100000, name: pick(names) + '(이웃 섬)', look, loc: 'island', x: 52, z: 104, ry: Math.PI, state: 'WALK', pose: null, bubble: null, emote: null, route: null, sceneId: null, keys: { L1: 'EXTROVERT', L2: 'WANDERER', L3: 'WARM', L4: 'FOOD' }, stats: { speed: 0, idle: [2, 4] }, status: {}, visitor: true };
    st.visitors.push(vis);
    const gift = pick(['cookie', 'rare_fruit', 'sandwich', 'udon']);
    Sim.scene({ title: '페리 방문객', actors: { V: vis }, steps: [
      { go: 'V', to: { place: 'ferry', spot: 'deck' } }, { say: 'V', text: L.say(vis, 'ferryGuest', {}, true), t: 3.5 },
      { do: () => { st.guestbookFerry = st.guestbookFerry || []; st.guestbookFerry.push({ name: vis.name, day: day(), text: pick(['섬이 참 예쁘네요!', '또 놀러 올게요~', '주민들이 너무 친절해요!']) }); st.player.inv[gift] = (st.player.inv[gift] || 0) + 1; emit('toast', `⛴️ 이웃 섬 방문객 ${vis.name}이(가) 특산물 '${D.ITEMS[gift].name}'을(를) 선물로 두고 갔어요!`); } },
      { go: 'V', to: { place: 'plaza', spot: 'fountain' }, max: 60 }, { pose: 'V', p: 'photo', prop: 'camera', t: 3 }, { go: 'V', to: { place: 'ferry', spot: 'deck' }, max: 60 },
    ], onEnd: () => { st.visitors.splice(st.visitors.indexOf(vis), 1); } });
    Sim.log('ferry', `⛴️ 페리를 타고 이웃 섬 주민 ${vis.name}이(가) 놀러 와서 방명록을 남겼어요.`, [], 1);
  }
  // 구름다리 — 출렁다리 효과 (FEAR_TO_LOVE) & 겁쟁이와 장난꾸러기
  Ev.onBridge = function (v) {
    const st = S();
    if (v.bridgeT && st.time - v.bridgeT < 30) return;
    v.bridgeT = st.time;
    const other = st.villagers.find(o => o !== v && FM.T.onBridge(o.x, o.z) && Math.hypot(o.x - v.x, o.z - v.z) < 4);
    if (!other) return;
    const windy = st.weather.type === 'windy' || st.weather.wind > 0.3 || chance(0.4);
    if (other.prankster && v.coward && !other.sceneId && !v.sceneId) {
      Sim.scene({ title: '겁쟁이와 장난꾸러기', actors: { A: other, B: v }, steps: [{ pose: 'A', p: 'bounce', t: 3 }, { sfx: 'creak' }, { do: () => emit('shake', { at: v, t: 1.5 }) }, { pose: 'B', p: 'shiver', t: 4 }, { say: 'B', text: '흐아악! 흔들지 마!!!', t: 2.5 }, { say: 'A', text: L.sty(other, '겁쟁이~'), t: 2 }] });
      Sim.log('quirk', `🌉 ${other.name}이(가) 구름다리 한가운데서 방방 뛰자 겁 많은 ${v.name}이(가) 난간을 부여잡고 사시나무 떨듯 주저앉았어요.`, [other.id, v.id], 1);
      return;
    }
    if (windy && Soc.canRomance(v.id, other.id)) {
      emit('shake', { at: v, t: 1.2 });
      Sim.emote(v, '💓', 3); Sim.emote(other, '💓', 3);
      v.status.bridgeSpark = { with: other.id, until: st.time + 1440 }; other.status.bridgeSpark = { with: v.id, until: st.time + 1440 };
      Soc.addRomance(v.id, other.id, 20, '출렁다리 효과 (FEAR_TO_LOVE)'); Soc.addRomance(other.id, v.id, 20, '출렁다리 효과 (FEAR_TO_LOVE)');
      Sim.log('romance', `🌉💓 ${v.name}와(과) ${other.name}이(가) 흔들리는 구름다리 위에서 심장 박동을 호감으로 착각했어요! (FEAR_TO_LOVE)`, [v.id, other.id], 1);
    }
  };
  // 짝사랑 모래 이름 → 파도
  Ev.sandName = function (v, name) {
    const st = S();
    st.sandNames = st.sandNames || [];
    st.sandNames.push({ x: v.x, z: v.z, text: name, t: st.time });
    setTimeout0(() => {
      if (!chance(0.6)) return;
      Sim.scene({ title: '파도가 이름을 지움', actors: { A: v }, steps: [{ wait: 3 }, { fx: 'wave', at: 'A' }, { say: 'A', text: L.say(v, 'waveWipe', {}, true), t: 3 }, { pose: 'A', p: 'cry', t: 3 }] });
    });
  };
  const later = [];
  const setTimeout0 = fn => later.push(fn);

  // 메디컬 센터 자동 입원
  function admit(v) {
    const d = pick(D.DISEASES);
    v.status.hospital = true; v.status.disease = d; v.status.cared = 0; v.status.admitDay = day(); v.status.admitT = S().time;
    if (v.sceneId) Sim.endScene(Sim.scenes.find(s => s.id === v.sceneId), true);
    v.route = null; v.act = null;
    Sim.dressFor(v, 'patient');
    v.loc = 'med_in'; v.x = 2; v.z = 2;
    Sim.log('medical', `🏥 스트레스가 폭발한 ${v.name}이(가) '${d}' 판정을 받고 메디컬 센터에 입원했어요. 간병을 받아야 퇴원할 수 있어요.`, [v.id], 2);
    Soc.addQuest({ type: 'hospital_care', title: `🏥 ${v.name} 간병하기`, giver: v.id, target: v.id, desc: `메디컬 센터에 입원한 ${v.name}에게 가서 간병해 주세요. (동료 주민이 병문안을 가도 퇴원해요)` });
  }
  Ev.admit = admit;
  function discharge(v) {
    v.status.hospital = false; v.stress = 25; v.status.disease = null; Sim.freeUse(v); if (v.status.hatOverride === 'headband') v.status.hatOverride = null; v.status.bandageUntil = null;
    Sim.dressFor(v, null);
    const q = S().quests.find(x => x.type === 'hospital_care' && x.target === v.id && x.state === 'active');
    if (q) Soc.finishQuest(q, true, `${v.name}이(가) 동료의 간병으로 퇴원했어요`);
    Sim.log('medical', `🏥 ${v.name}이(가) 퇴원했어요.`, [v.id], 1);
  }
  Ev.discharge = discharge;

  // =========================================================
  // 아침 이벤트 (신혼 아침 식사, 용돈, 아침형 인간)
  // =========================================================
  function morningEvents() {
    const st = S();
    for (const m of st.marriages.filter(m => m.marriage_stage === 'MARRIED')) {
      const a = m.spouse_a_id === P ? null : byId(m.spouse_a_id), b = m.spouse_b_id === P ? null : byId(m.spouse_b_id);
      // 아침 식사 이벤트 (07:00~08:00)
      if (a && b && free(a) && free(b) && a.loc === m.matrimonial_home_id && b.loc === m.matrimonial_home_id) {
        const tbl = Sim.furnUses(m.matrimonial_home_id, u => u.u.act === 'breakfast');
        if (tbl.length >= 2) Sim.scene({ title: '신혼 아침 식사', actors: { A: a, B: b }, steps: [
          { par: [{ go: 'A', to: { loc: tbl[0].iid, x: tbl[0].x, z: tbl[0].z } }, { go: 'B', to: { loc: tbl[1].iid, x: tbl[1].x, z: tbl[1].z } }] }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
          { par: [{ pose: 'A', p: 'eat', t: 0.1 }, { pose: 'B', p: 'eat', t: 0.1 }] }, { say: 'A', text: L.MAIN_LIFE[a.keys.L1].morning, t: 3.5 }, { emote: 'B', e: '💕' }, { wait: 3 },
        ], onEnd: () => { m.marital_satisfaction = clamp(m.marital_satisfaction + 2, 0, 100); a.hunger = b.hunger = 5; } });
        // 성격별 신혼 생활 스타일 — 낭만파+다정: 매일 아침 마당에 꽃 심기
        for (const x of [a, b]) if (has(x, 'ROMANTIC') && has(x, 'WARM')) { const room = st.rooms[m.matrimonial_home_id]; if (room) { room.yardFlowers = (room.yardFlowers || 0) + 1; } }
      }
      // 플레이어와 결혼한 주민: 매일 아침 수납장에 희귀 재료/음식/골드
      const sp = a || b;
      if ((m.spouse_a_id === P || m.spouse_b_id === P) && sp) {
        const kind = pick(['coins', 'food', 'rare']);
        st.player.chest = st.player.chest || [];
        if (kind === 'coins') st.player.chest.push({ coins: rint(D.ECON.allowanceMin, D.ECON.allowanceMax) });
        else st.player.chest.push({ item: kind === 'food' ? pick(['sandwich', 'udon', 'stamina_food', 'souffle']) : pick(['rare_fruit', 'record', 'crystal', 'necklace']) });
        m.shared_budget += 1000;
        Sim.say(sp, L.say(sp, 'allowance', {}, true));
        emit('toast', `🧺 ${sp.name}: "마을에서 주워왔어!" — 신혼집 수납장을 확인해 보세요`);
      }
    }
    // [낭만파]+[반항/츤데레파]+[아침형 인간]+[음악] — 06:00 산책로, 라디오 앞에서 음악
    for (const v of st.villagers.filter(v => has(v, 'ROMANTIC') && has(v, 'CRANKY') && has(v, 'EARLY_BIRD') && free(v))) {
      const other = pick(who(o => o !== v && (o.wake || 7) <= 7));
      Sim.scene({ title: '아침 안개 산책', actors: other ? { A: v, B: other } : { A: v }, steps: [
        { go: 'A', to: { place: 'park', spot: 'lawn' } }, { pose: 'A', p: 'sway', prop: 'radio', t: 5 }, { pose: 'A', p: 'lookUp', t: 3 },
        ...(other ? [{ go: 'B', to: { actor: 'A', near: 1.3 } }, { say: 'A', text: L.say(v, 'earlyBird', {}, true), t: 3 }, { fx: 'gift', at: 'B' }, { say: 'A', text: '(아침 음료를 쥐어주고 제 갈 길을 간다)', t: 2.5 }] : []),
      ], onEnd: () => { if (other) Soc.addFriend(v.id, other.id, 4, 3); } });
    }
  }

  // =========================================================
  // 플레이어 연인/배우자/짝사랑 (일일)
  // =========================================================
  function playerLoveDaily() {
    const st = S();
    const p = st.player;
    // 권태기 방치: 14일 이상 접속하지 않거나 말을 걸지 않으면 편지 내용 변화
    const absentReal = (Date.now() - (p.lastRealVisit || Date.now())) / 86400000;
    for (const r of Object.values(st.rel)) {
      if (!(r.subject_id === P || r.target_id === P)) continue;
      if (!['DATING', 'MARRIED'].includes(r.status)) continue;
      const v = byId(r.subject_id === P ? r.target_id : r.subject_id); if (!v) continue;
      const since = day() - (p.lastTalk[v.id] || r.since);
      const lvl = absentReal >= 14 || since >= 14 ? 3 : since >= 9 ? 2 : since >= 5 ? 1 : 0;
      if (lvl > 0 && r.mailLvl !== lvl) {
        r.mailLvl = lvl;
        st.mail.push({ from: v.id, day: day(), text: L.say(v, ['missYou1', 'missYou2', 'missYou3'][lvl - 1], {}, true), kind: 'miss' });
        emit('mail');
        Soc.addBoredom(r, lvl * 10, '플레이어 방치');
        if (lvl === 3) Soc.addBoredom(r, 100, '이별 통보');
      }
    }
    // 짝사랑 주민: 주말마다 우편함에 "먹고 힘내!" 도시락
    if (weekday() >= 5) for (const v of st.villagers.filter(v => v.crush && v.crush.target === P)) {
      st.mail.push({ from: v.id, day: day(), text: L.say(v, 'lunchboxMail', {}, true), item: 'lunchbox', kind: 'lunch' });
      emit('mail');
    }
    // 선물 경쟁 (Gift War) — 플레이어 중심 삼각관계
    const lovers = st.villagers.filter(v => v.crush && v.crush.target === P || Soc.partnerOf(v.id) === P);
    if (lovers.length >= 2 && chance(0.6)) {
      const [a, b] = lovers.sort(() => Math.random() - 0.5);
      const cheap = pick(['cookie', 'rose', 'can']), pricey = pick(['necklace', 'crystal', 'stamina_food', 'souffle']);
      st.mail.push({ from: a.id, day: day(), text: L.sty(a, '오늘 생각나서 보내!'), item: cheap, kind: 'gift' });
      st.pendingMail = st.pendingMail || [];
      st.pendingMail.push({ at: day() + 1, from: b.id, text: L.say(b, 'rivalForPlayer', {}, true), item: pricey, kind: 'giftwar' });
      emit('mail');
    }
    for (const pm of (st.pendingMail || []).filter(x => x.at <= day())) { st.mail.push(Object.assign({ day: day() }, pm)); st.pendingMail.splice(st.pendingMail.indexOf(pm), 1); emit('mail'); }
  }

  // 플레이어가 집 밖으로 나올 때 (연인 데이트 신청 / 짝사랑 주민 집 앞 대기)
  Ev.onPlayerExitHome = function () {
    const st = S(), p = st.player;
    const yard = MAP.P.home_p;
    const crusher = st.villagers.find(v => free(v) && v.crush && v.crush.target === P && chance(0.5));
    if (crusher) {
      crusher.loc = 'island'; crusher.x = yard.x + 3; crusher.z = yard.z + 7; crusher.route = null;
      Sim.scene({ title: '플레이어 집 앞 대기', actors: { A: crusher }, steps: [{ face: 'A', at: P }, { pose: 'A', p: 'surprise', t: 1.5 }, { emote: 'A', e: '😳' }, { say: 'A', text: L.sty(crusher, `어, 어?! ${p.name}! 우, 우연이네! 안녕!`), t: 3 }] });
      Soc.addRomance(crusher.id, P, 2);
      return;
    }
    const lover = byId(Soc.partnerOf(P));
    if (lover && free(lover) && chance(0.35) && Soc.rel(lover.id, P).status === 'DATING') {
      lover.loc = 'island'; lover.x = yard.x + 2; lover.z = yard.z + 7; lover.route = null;
      Sim.scene({ title: '데이트 신청', actors: { A: lover }, steps: [{ face: 'A', at: P }, { say: 'A', text: L.say(lover, 'datePlayer', {}, true), t: 4 }, { emote: 'A', e: '💕' }] });
    }
  };
  // 플레이어가 집에 있을 때 — 연인/절친 방문, 초대받지 않은 손님
  let visitT = 0;
  Ev.playerHomeTick = function (dtR) {
    const st = S(), p = st.player;
    visitT += dtR * st.speed * (Sim.CLOCK || 1);
    if (visitT < 45) return;
    visitT = 0;
    if (p.loc !== 'home_p_in') return;
    const lover = byId(Soc.partnerOf(P));
    const bf = st.villagers.filter(v => free(v) && Soc.hasRel(v.id, P) && Soc.rel(v.id, P).friendship_stage === 'BEST_FRIEND' && v.id !== (lover && lover.id));
    let visitor = null, kind = '';
    if (lover && free(lover) && lover.loc !== 'home_p_in' && Soc.rel(lover.id, P).status === 'DATING' && chance(0.35)) { visitor = lover; kind = 'lover'; }
    else if (bf.length && chance(0.3)) { visitor = pick(bf); kind = 'bf'; }
    if (!visitor) return;
    const gift = kind === 'lover' ? pick(['lunchbox', 'rose', 'poem_book', 'plush']) : pick(['cookie', 'plush', 'candle', 'record']);
    Sim.scene({ title: kind === 'lover' ? '연인 방문' : '절친 불쑥 방문', actors: { A: visitor }, steps: [
      { tp: 'A', loc: 'home_p_in', x: 0, z: Sim.interiorSize('home_p_in').d / 2 - 0.5 }, { sfx: 'knock' }, { say: 'A', text: kind === 'lover' ? L.sty(visitor, '자기야~ 나 왔어! 이거 만들어 왔어') : L.say(visitor, 'bfVisit', {}, true), t: 3.5 },
      { fx: 'gift', at: 'A' }, { do: () => { Soc.giveItem(gift); emit('toast', `🎁 ${visitor.name}이(가) '${D.ITEMS[gift].name}'을(를) 두고 갔어요`); } },
      { go: 'A', to: { loc: 'home_p_in', x: 0.5, z: 0.5 } }, { pose: 'A', p: 'sit', t: 5 }, { go: 'A', to: { loc: 'home_p_in', x: 0, z: Sim.interiorSize('home_p_in').d / 2 - 0.4 } },
    ] });
  };
  // 플레이어가 주민을 초대 → 질투 많은 다른 주민이 노크도 없이 들이닥침
  Ev.onPlayerHost = function (host) {
    const st = S();
    const jealousOne = st.villagers.find(v => v !== host && free(v) && ((v.crush && v.crush.target === P) || Soc.partnerOf(v.id) === P) && (!v.jealousy || true));
    if (!jealousOne || !chance(0.6)) return;
    setTimeout0(() => {
      Sim.scene({ title: '초대받지 않은 손님', actors: { A: jealousOne }, steps: [
        { tp: 'A', loc: 'home_p_in', x: 0, z: Sim.interiorSize('home_p_in').d / 2 - 0.5 }, { say: 'A', text: L.sty(jealousOne, `${st.player.name}! 나도 왔어! ...어? ${host.name}는 왜 여기 있어?`), t: 3.5 }, { emote: 'A', e: '💢' },
      ] });
      Soc.addJealousy(jealousOne, host.id, 25, '플레이어 집 초대');
      Sim.log('jealous', `🚪 플레이어가 ${host.name}를 초대하자, ${jealousOne.name}이(가) 노크도 없이 들이닥쳤어요!`, [jealousOne.id, host.id], 1);
    });
  };

  // =========================================================
  // 어린이 (열병, 훈육)
  // =========================================================
  function kidsDaily() {
    const st = S();
    for (const k of st.villagers.filter(v => v.child)) {
      // 열병/아픔 이벤트
      if (k.child.stage !== 'BABY' && chance(0.06) && !k.status.sick) {
        k.status.sick = true;
        if (k.child.parents.includes(P)) Soc.addQuest({ type: 'kid_fever', title: `🤒 ${k.name}의 열병`, giver: k.id, target: k.id, desc: `메디컬 센터 약국에서 '어린이용 약'을 사서 ${k.name}에게 먹여주세요.` });
        else setTimeout0(() => { k.status.sick = false; Sim.log('kids', `💊 ${k.name}이(가) 열이 났지만 부모가 약을 구해다 줬어요.`, [k.id], 0); });
      }
      // 걸음마 교육 (유아기)
      if (k.child.stage === 'TODDLER' && k.child.parents.includes(P) && !st.quests.some(q => q.type === 'kid_walk' && q.target === k.id)) Soc.addQuest({ type: 'kid_walk', title: `👣 ${k.name} 걸음마 교육`, giver: k.id, target: k.id, desc: `${k.name} 앞에서 "걸음마 연습하자!"를 세 번 해주세요. (애착도 상승)` });
      // 훈육 이벤트 (어린이기)
      if (k.child.stage === 'CHILD' && chance(0.12)) {
        const what = chance(0.5) ? '마을 벽에 낙서를 했어요' : '다른 주민의 꽃밭을 밟아 놓았어요';
        if (k.child.parents.includes(P)) {
          Sim.balloon(k, 'kid', 'orange', { text: `(${k.name}이(가) ${what}...) 😣`, options: [{ id: 'discipline:scold', label: '😠 혼낸다' }, { id: 'discipline:protect', label: '🤗 감싸준다' }] });
          emit('notify', { v: k, text: `🧒 ${k.name}이(가) ${what}! 훈육이 필요해요` });
        } else {
          const pv = byId(k.child.parents[0]);
          Sim.log('kids', `🖍️ ${k.name}이(가) ${what}. ${pv ? pv.name + ': "' + Soc.parentLine(pv) + '"' : ''}`, [k.id], 1);
        }
      }
    }
  }
  Ev.playerChoose = function (v, id) {
    const [cmd, arg] = id.split(':');
    if (cmd === 'discipline') {
      v.balloon = null;
      if (arg === 'scold') { v.child.attach[P] = clamp((v.child.attach[P] || 60) - 5, 0, 100); v.child.manners = (v.child.manners || 0) + 10; return { text: '(시무룩...) 다음부터 안 그럴게요... (예의 바른 성격 수치 상승 / 애착도 소폭 감소)', options: Soc.talkOptions(v) }; }
      v.child.freedom = (v.child.freedom || 0) + 10;
      for (const o of S().villagers.filter(o => !o.child).slice(0, 4)) Soc.addFriend(o.id, P, -2, -1);
      return { text: '(헤헤!) (자유분방한 성격 수치 상승 / 타 주민들과의 친밀도 감소)', options: Soc.talkOptions(v) };
    }
    return null;
  };

  // =========================================================
  // NPC ↔ NPC 프러포즈 (디저트 반지 등) → 약혼
  // =========================================================
  Ev.proposal = function (a, b) {
    if (!a || !b) return;
    const where = pick(['sky', 'cliff', 'fountain']);
    if (where === 'sky') {
      const swallow = chance(0.25);
      Sim.scene({ title: '디저트 반지 프로포즈', major: true, bgm: 'romance', place: 'skylounge', actors: { A: a, B: b }, steps: [
        { par: [{ go: 'A', to: { place: 'skylounge', inside: true, x: 0, z: -1.15 } }, { go: 'B', to: { place: 'skylounge', inside: true, x: 0, z: -2.85 } }] }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
        { par: [{ pose: 'A', p: 'eat', t: 0.1 }, { pose: 'B', p: 'eat', t: 0.1 }] }, { say: 'A', text: L.say(a, 'ringDessert', {}, true), t: 3 }, { wait: 2 },
        ...(swallow ? [{ say: 'B', text: L.say(b, 'swallowRing', {}, true), t: 3 }, { emote: 'B', e: '😵' }, { go: 'B', to: { place: 'medical', inside: true, x: 2, z: -1.5 }, run: true }, { say: 'B', text: '(응급실에서 반지를 무사히 꺼냈다...) 그, 그래도 좋아!', t: 3.5 }]
          : [{ pose: 'B', p: 'cry', t: 2 }, { say: 'B', text: '반지...?! (감동하여 그 자리에서 눈물을 흘린다) 좋아!', t: 3.5 }, { fx: 'hearts', at: 'B' }]),
      ], onEnd: () => Soc.engage(a.id, b.id, 'dessert') });
      Sim.log('engage', swallow ? `🍰 ${b.name}이(가) 디저트 속 반지를 삼켜 응급실에 실려 갔지만... 프로포즈는 성공!` : `🍰 ${a.name}이(가) 스카이라운지 디저트 속 반지로 ${b.name}에게 프로포즈해 감동의 눈물이 흘렀어요!`, [a.id, b.id], 3);
    } else {
      Sim.scene({ title: '프로포즈', major: true, bgm: 'romance', actors: { A: a, B: b }, steps: [
        { par: [{ go: 'A', to: where === 'cliff' ? { place: 'cliff', spot: 'bench' } : { place: 'plaza', spot: 'fountain' } }, { go: 'B', to: Object.assign(where === 'cliff' ? { place: 'cliff', spot: 'bench' } : { place: 'plaza', spot: 'fountain' }, { dx: 1.3 }) }] },
        { face: 'A', at: 'B' }, { face: 'B', at: 'A' }, { pose: 'A', p: 'kneel', prop: 'ring', t: 0.1 }, { say: 'A', text: `${b.name}, 평생을 함께하자.`, t: 3.5 }, { say: 'B', text: '...응! 좋아!', t: 3 }, { fx: 'hearts', at: 'B' },
      ], onEnd: () => Soc.engage(a.id, b.id, 'ring') });
    }
  };

  // =========================================================
  // 결혼식 준비 — 식장 청소 / 꾸미기 지점
  // =========================================================
  Ev.spawnWeddingTrash = function () {
    const st = S();
    st.weddingTrash = [[8, -64], [16, -68], [4, -70]].map(([x, z]) => ({ x, z, done: false }));
    st.weddingDeco = [[10, -60], [14, -60], [12, -74]].map(([x, z]) => ({ x, z, done: false }));
  };
  Ev.weddingInteract = function (px, pz) {
    const st = S();
    const q = st.quests.find(q => q.type === 'wedding_prep' && q.state === 'active');
    if (!q) return null;
    const m = st.marriages.find(x => x.marriage_id === q.marriage);
    for (const t of st.weddingTrash || []) if (!t.done && Math.hypot(t.x - px, t.z - pz) < 2) { t.done = true; m.prep.clean++; Soc.checkWeddingPrep(q); return `🧹 식장 청소 ${m.prep.clean}/3`; }
    for (const d of st.weddingDeco || []) if (!d.done && Math.hypot(d.x - px, d.z - pz) < 2 && st.player.inv.wedding_flowers) { d.done = true; Soc.takeItem('wedding_flowers'); m.prep.decorate++; Soc.checkWeddingPrep(q); return `💮 식장 꾸미기 ${m.prep.decorate}/3`; }
    return null;
  };

  // 타임캡슐
  Ev.buryCapsule = function (v) {
    const st = S();
    const place = pick(['센트럴 파크 버드나무 아래', '노을 절벽 억새밭', '분수대 옆 화단']);
    st.capsules.push({ with: v.id, day: day(), openDay: day() + 14, place, dug: false });
    Soc.addQuest({ type: 'capsule', title: `⏳ ${v.name}와(과)의 타임캡슐`, giver: v.id, target: v.id, desc: `${place}에 묻은 타임캡슐을 14일 뒤(${day() + 14}일차) 함께 파내요. 그날 ${v.name}에게 말을 걸어주세요.`, until: day() + 14 });
    Sim.log('friend', `⏳ ${v.name}와(과) 플레이어가 "우리 우정의 증표"로 ${place}에 타임캡슐을 묻었어요.`, [v.id, P], 2);
  };
  Ev.digCapsule = function (v) {
    const st = S();
    const c = st.capsules.find(c => c.with === v.id && !c.dug && day() >= c.openDay);
    if (!c) return null;
    c.dug = true;
    Soc.addFriend(v.id, P, 10, 10, '타임캡슐');
    const q = st.quests.find(q => q.type === 'capsule' && q.giver === v.id && q.state === 'active'); if (q) Soc.finishQuest(q, true, '타임캡슐을 함께 파냈어요! 우정 MAX');
    Soc.giveItem('handmade');
    return `⏳ 14일 전의 우리가 쓴 편지가 들어 있었다! "${day() - 14}일차의 우리, 앞으로도 절친!" 🎀`;
  };

  // =========================================================
  // 방 인테리어 — 테마 선물 반응 / 세트 효과 / 자율 인테리어 / 패턴
  // =========================================================
  function themeScore(v, themeId) {
    const t = D.THEMES[themeId];
    let s = 0;
    for (const k of Sim.allKeys(v)) s += (t.aff[k] || 0);
    return s;
  }
  Ev.themeScore = themeScore;
  function reactLevel(score) { return score >= 3 ? 100 : score >= 1 ? 70 : score >= -1 ? 40 : 0; }
  Ev.reactLevel = reactLevel;
  // 인테리어 티켓 선물 (일괄 테마 변신) — 암전 후 펑!
  Ev.applyTheme = function (v, themeId, how = 'ticket') {
    const st = S();
    const iid = v.home;
    const s = Sim.interiorSize(iid);
    const prev = st.rooms[iid];
    st.rooms[iid] = FM.themeRoom(themeId, s.w, s.d);
    st.rooms[iid].prevTheme = prev ? JSON.stringify(prev) : null;
    st.rooms[iid].lastDecor = day();
    // 요람, 아이 가구 등 유지
    if (prev) for (const f of prev.furn) if (['cradle', 'kid_bed', 'kid_desk', 'storage_chest', 'photo_crush'].includes(f.type)) st.rooms[iid].furn.push(f);
    emit('blackout', { iid });
    return Ev.reactToRoom(v, themeId, how);
  };
  Ev.reactToRoom = function (v, themeId, how) {
    const st = S();
    const t = D.THEMES[themeId];
    const lv = reactLevel(themeScore(v, themeId));
    const R = D.THEME_REACT.find(r => r.lv === lv);
    const room = st.rooms[v.home];
    room.react = lv;
    room.hateNight = lv === 0;
    if (v.sceneId) Sim.endScene(Sim.scenes.find(s => s.id === v.sceneId), true);
    if (v.loc !== v.home) { v.loc = v.home; v.x = 0; v.z = 0.5; v.route = null; }
    if (t.dress) Sim.dressFor(v, t.dress);
    let steps;
    if (lv === 100) {
      steps = [{ pose: 'A', p: 'float', t: 0.1 }, { say: 'A', text: L.say(v, 'roomLove', {}, true), t: 3 }, { pose: 'A', p: 'levitateDance', t: 4 }, { fx: 'hearts', at: 'A' }];
      if (t.dance) steps.push({ say: 'A', text: `(${t.dance})`, t: 3 });
      Soc.addFriend(v.id, P, 12, 10, '인테리어 대만족');
      v.stress = clamp(v.stress - 40, 0, 100);
      room.satisfaction = 100;
    } else if (lv === 70) {
      const uses = Sim.furnUses(v.home).slice(0, 3);
      steps = [{ emote: 'A', e: '😄' }, ...uses.map(u => ({ go: 'A', to: { loc: v.home, x: u.x, z: u.z }, max: 5 })).flatMap(g => [g, { pose: 'A', p: 'touch', t: 1 }]), { say: 'A', text: L.sty(v, '우와, 이것도 좋고 저것도 좋아'), t: 2.5 }];
      Soc.addFriend(v.id, P, 5, 3, '인테리어 만족'); room.satisfaction = 70;
    } else if (lv === 40) {
      steps = [{ pose: 'A', p: 'tilt', t: 2 }, { say: 'A', text: L.say(v, 'roomMeh', {}, true), t: 3 }]; room.satisfaction = 40;
    } else {
      steps = [{ pose: 'A', p: 'faint', t: 0.5 }, { say: 'A', text: L.say(v, 'roomHate', {}, true), t: 3.5 }, { pose: 'A', p: 'cryFloor', t: 4 }];
      if (t.worst) steps.push({ say: 'A', text: `(${t.worst})`, t: 3 }, { pose: 'A', p: 'coverEyes', t: 3 });
      v.depression = clamp(v.depression + 30, 0, 100); v.stress = clamp(v.stress + 25, 0, 100);
      Soc.addFriend(v.id, P, -4, -2, '인테리어 최악'); room.satisfaction = 0;
    }
    if (t.line) steps.push({ say: 'A', text: t.line, t: 3 });
    Sim.scene({ title: `테마 반응: ${R.name}`, actors: { A: v }, steps });
    checkSet(v.home);
    Sim.log('room', `🏠 ${v.name}의 방이 '${t.name}' 테마로 바뀌었어요! 반응: ${R.name}`, [v.id], lv === 100 || lv === 0 ? 2 : 1);
    return R;
  };
  // 테마 100% 세트 효과 (80% 이상 통일)
  function checkSet(iid) {
    const room = S().rooms[iid];
    if (!room) return null;
    const counts = {};
    let n = 0;
    for (const f of room.furn) {
      const F = FM.FURN[f.type]; if (!F || F.ceiling || ['clock', 'rug', 'ceiling_light', 'cradle', 'kid_bed', 'kid_desk', 'storage_chest'].includes(f.type)) continue;
      n++;
      for (const [tid, t] of Object.entries(D.THEMES)) if (t.furn.includes(f.type)) counts[tid] = (counts[tid] || 0) + 1;
    }
    let best = null, bv = 0;
    for (const [tid, c] of Object.entries(counts)) if (c > bv) { bv = c; best = tid; }
    const ratio = n ? bv / n : 0;
    room.unity = Math.round(ratio * 100);
    room.unityTheme = best;
    room.set = ratio >= 0.8 ? best : null;
    return room.set;
  }
  Ev.checkSet = checkSet;
  // 주민 자율 인테리어 티켓 ("네 마음대로 꾸며봐!") — 혼돈의 방 (Chaos Room)
  Ev.autoInterior = function (v) {
    const st = S();
    const s = Sim.interiorSize(v.home);
    const ids = Object.keys(D.THEMES);
    const mine = ids.sort((a, b) => themeScore(v, b) - themeScore(v, a));
    const pickT = () => (chance(0.6) ? pick(mine.slice(0, 3)) : pick(ids));
    const room = FM.themeRoom(pickT(), s.w, s.d);
    const extra = [pickT(), pickT()];
    for (const t of extra) for (const f of D.THEMES[t].furn.slice(0, 2)) room.furn.push(FM.fdef(f, rnd(-s.w / 2 + 1, s.w / 2 - 1), rnd(-s.d / 2 + 1, s.d / 2 - 1), rint(0, 3) * 90));
    const wt = D.THEMES[pickT()], ft = D.THEMES[pickT()];
    room.wall = wt.wall; room.floor = ft.floor; room.floorColor = ft.floorColor; room.light = pick(Object.keys(D.LIGHT_COLORS)); room.bgm = pick(Object.keys(D.ROOM_BGM));
    room.theme = null; room.chaos = true; room.lastDecor = day();
    st.rooms[v.home] = room;
    emit('blackout', { iid: v.home });
    if (v.loc !== v.home) { v.loc = v.home; v.x = 0; v.z = 0; v.route = null; }
    Sim.scene({ title: '혼돈의 방 (Chaos Room)', actors: { A: v }, steps: [{ pose: 'A', p: 'cheer', t: 2 }, { say: 'A', text: L.sty(v, '짜잔! 완벽하지? 내 인생 최고의 방이야'), t: 3.5 }, { fx: 'sparkle', at: 'A' }] });
    Soc.addFriend(v.id, P, 8, 5, '자율 인테리어');
    v.stress = clamp(v.stress - 25, 0, 100);
    Sim.log('room', `🌀 ${v.name}이(가) 자율 인테리어 티켓으로 혼돈의 방을 탄생시키고 매우 자랑스러워해요!`, [v.id], 2);
  };
  // 방 레이아웃 코드 (인테리어 코드 / 스타일 코드)
  Ev.roomCode = function (iid) {
    if (iid === 'home_p_in') Sim.ensurePlayerRoom();
    const room = S().rooms[iid];
    if (!room) return '';
    const data = { t: room.theme, w: room.wall, f: room.floor, fc: room.floorColor, l: room.light, b: room.bgm, p: room.pattern, fu: room.furn.map(f => [f.type, +f.x.toFixed(2), +f.z.toFixed(2), f.rot || 0, f.mat || 0, f.color || 0]) };
    return 'FMI-' + btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  };
  Ev.applyCode = function (iid, code) {
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(code.replace(/^FMI-/, '').trim()))));
      const room = S().rooms[iid] || (S().rooms[iid] = FM.defaultRoom({ keys: { L1: 'LAZY', L4: 'FOOD' } }));
      Object.assign(room, { theme: data.t, wall: data.w, floor: data.f, floorColor: data.fc, light: data.l, bgm: data.b, pattern: data.p || null, furn: data.fu.map(a => ({ type: a[0], x: a[1], z: a[2], rot: a[3], mat: a[4] || undefined, color: a[5] || undefined })), lastDecor: day() });
      checkSet(iid);
      emit('blackout', { iid });
      return true;
    } catch (e) { return false; }
  };
  Ev.applyBlueprint = function (iid, bpId) {
    const bp = D.BLUEPRINTS.find(b => b.id === bpId);
    const s = Sim.interiorSize(iid);
    const room = FM.themeRoom(bp.theme, s.w, s.d);
    for (const t of bp.extra) room.furn.push(FM.fdef(t, rnd(-s.w / 2 + 1, s.w / 2 - 1), rnd(-s.d / 2 + 1, s.d / 2 - 1), rint(0, 3) * 90));
    room.blueprint = bp.name; room.lastDecor = day();
    S().rooms[iid] = room;
    checkSet(iid);
    emit('blackout', { iid });
  };
  // 도트 패턴 적용 — 자기 얼굴 도트 벽지 → 자뻑 모션
  Ev.applyPattern = function (iid, pattern, target, faceOf) {
    const st = S();
    const room = st.rooms[iid];
    if (!room) return;
    room.patterns = room.patterns || {};
    room.patterns[target] = pattern;
    room.lastDecor = day();
    const owner = st.villagers.find(v => v.home === iid && !v.child);
    if (owner && faceOf === owner.id) {
      if (owner.loc !== iid) { owner.loc = iid; owner.x = 0; owner.z = 0; owner.route = null; }
      Sim.scene({ title: '자뻑 모션', actors: { A: owner }, steps: [{ pose: 'A', p: 'pose', t: 2 }, { say: 'A', text: L.say(owner, 'roomFan', {}, true), t: 3.5 }, { emote: 'A', e: '😎' }] });
      Soc.addFriend(owner.id, P, 6, 3, '팬심 벽지');
    }
  };
  // 신(God)의 청소기
  Ev.vacuum = function (iid) {
    const room = S().rooms[iid];
    if (!room) return 0;
    const n = room.trash.length;
    room.trash = []; room.clean = 100;
    return n;
  };

  // 가구 사용 시 특수 액션 AI
  Ev.onFurn = function (v, u, act) {
    const st = S();
    if (!v.act || v.sceneId) return;
    const room = st.rooms[v.loc];
    const alone = !st.villagers.some(o => o !== v && o.loc === v.loc);
    const lazy = has(v, 'LAZY') || has(v, 'SLOTH');
    switch (act) {
      case 'karaoke':
        if (alone) {
          if (room) room.disco = st.realT + 8;
          if (v.toneDeaf) { emit('sfx', { key: 'glass', at: v }); Sim.say(v, '♪ 아아아아아악~~~ (기이한 고음) ♪'); Sim.fx('glassBreak', v); if (chance(0.3)) v.status.karaokeZero = true; }
          else Sim.say(v, '♪ 목청껏 노래하는 중 ♪');
        } else {
          const f = st.villagers.find(o => o !== v && o.loc === v.loc && Soc.stageAtLeast(v.id, o.id, 'GOOD_FRIEND') && free(o));
          if (f) Sim.scene({ title: '듀엣 랩 배틀', actors: { A: v, B: f }, steps: [{ par: [{ pose: 'A', p: 'sing', prop: 'mic', t: 3 }, { pose: 'B', p: 'sing', prop: 'mic', t: 3 }] }, { say: 'A', text: '요! 체크 잇!', t: 2 }, { say: 'B', text: '(탬버린을 머리로 친다!) 🥁', t: 2 }] });
        }
        break;
      case 'mirror':
        if (v.status.newOutfit) { v.pose = 'selfLoveDance'; Sim.say(v, L.sty(v, '오늘 나 좀 멋진데?')); v.status.newOutfit = false; }
        else { v.pose = pick(['faceCute', 'faceTough', 'faceHurt']); v.act.name = '거울 앞 표정 연습 (귀여운 척 / 터프한 척 / 상처받은 척)'; if (has(v, 'ATHLETIC')) { v.pose = 'flex'; v.act.name = '거울 보며 근육 자랑'; } }
        break;
      case 'treadmill':
        if (lazy) { v.pose = 'lie'; v.prop = 'tangerine'; v.act.name = '런닝머신 위에 돗자리 깔고 귤 까먹기'; }
        else if (chance(0.35)) Sim.scene({ title: '런닝머신 날아감', actors: { A: v }, steps: [{ pose: 'A', p: 'jog', t: 3 }, { emote: 'A', e: '💦' }, { say: 'A', text: '으아아 속도가~!', t: 1.5 }, { go: 'A', to: { loc: v.loc, x: v.x, z: v.z - 1.5 }, run: true, max: 1 }, { pose: 'A', p: 'faint', t: 2 }, { sfx: 'thud' }] });
        break;
      case 'trampoline': if (v.act) { v.act.name = '지칠 때까지 트램펄린'; v.act.t = 14; } break;
      case 'massage': v.pose = 'massage'; v.act.name = '안마의자에서 눈을 뒤집으며 시원해함'; v.stress = clamp(v.stress - 10, 0, 100); break;
      case 'couple_sofa': {
        const lover = Soc.partnerOf(v.id); const lv = lover && byId(lover);
        if (lv && lv.loc === v.loc) { v.act.name = '밀착해서 팝콘 나눠 먹기'; v.prop = 'popcorn'; }
        else if (alone) { v.act.name = '거대 커스텀 인형과 소꿉놀이'; v.pose = 'talk'; }
        break;
      }
      case 'wardrobe': if (chance(0.5)) { v.act.name = '혼자 이상한 옷을 대보기'; v.status.newOutfit = true; v.pose = 'tryon'; } break;
      case 'diary': v.act.name = '비밀 일기장 쓰기'; v.prop = 'diary'; v.diary = true; break;
      case 'stare_photo': v.act.name = '짝사랑 대상의 사진을 뚫어져라 바라보기'; break;
      case 'hug_doll': v.act.name = '인형을 안고 혼잣말로 비밀 털어놓기'; if (chance(0.4)) Sim.say(v, v.crush ? `...사실 나 ${nm(v.crush.target)} 좋아해. 비밀이야.` : '...오늘 좀 외로웠어.'); break;
      case 'sleep': {
        const F = FM.FURN[u.f.type];
        v.dream = (F.grade || 0) >= 2 ? pick(D.DREAMS.fancy) : pick(D.DREAMS.basic);    // 침대 등급에 따라 꿈 종류
        break;
      }
      case 'sushi': case 'pub': case 'dine': case 'mocktail': case 'club_dance': case 'arcade': case 'claw': case 'pump': case 'bowl': case 'shop': case 'salon':
        v.coins -= { sushi: 150, pub: 120, dine: 600, mocktail: 60, club_dance: 30, arcade: 40, claw: 100, pump: 40, bowl: 80, shop: 250, salon: 200 }[act];
        if (v.coins < 0) { v.debt += -v.coins; v.coins = 0; }
        if (act === 'shop' && chance(0.3)) { v.status.newOutfit = true; }
        break;
      case 'buy_kimbap': v.coins = Math.max(0, v.coins - 50); v.hunger = 20; break;
    }
    // 테마 전용 행동
    const t = room && room.theme && D.THEMES[room.theme];
    if (t && t.act && v.act && v.loc === v.home && chance(0.4) && act !== 'sleep') v.act.name = t.act.split(',')[0];
    // 공사장 세트 완료: 방에 들어올 때마다 "안전 제일!"
    if (room && room.set === 'construction' && chance(0.3)) Sim.say(v, L.say(v, 'safety', {}, true));
  };
  // 공사장 세트 — 방에 들어올 때
  FM.bus.on('enter', ({ v, iid }) => {
    const room = S().rooms[iid];
    if (room && room.set === 'construction' && v.home === iid) { Sim.say(v, '안전 제일!'); v.status.hardhat = true; }
  });
  Ev.onAct = function (v, id) {
    const st = S();
    // 빈곤 상태: 편의점 삼각김밥
    if (v.status.poorUntil && v.hunger > 60 && chance(0.4) && !v.sceneId) {
      Sim.scene({ title: '빈곤 상태', actors: { A: v }, steps: [{ go: 'A', to: { place: 'conv', inside: true, x: -1.5, z: -1 } }, { pose: 'A', p: 'eat', prop: 'kimbap', t: 3 }, { say: 'A', text: L.say(v, 'poor', {}, true), t: 3 }], onEnd: () => { v.hunger = 25; } });
    }
    // 짝사랑 주민이 플레이어를 따라함 (낚시)
    if (id === 'jog' && v.pattern === 'B' && st.player.loc === v.loc && Math.hypot(st.player.x - v.x, st.player.z - v.z) < 12 && chance(0.3)) Sim.say(v, L.say(v, 'coachJog', {}, true));
  };

  // 플레이어 행동 → 주변 짝사랑/연인 주민 모방
  Ev.onPlayerAction = function (kind) {
    const st = S(), p = st.player;
    for (const v of st.villagers) {
      if (!free(v) || v.loc !== p.loc || Math.hypot(v.x - p.x, v.z - p.z) > 14) continue;
      const lover = Soc.partnerOf(v.id) === P;
      const crush = v.crush && v.crush.target === P;
      const follower = p.follower === v.id;
      if (!(lover || crush || follower)) continue;
      if (kind === 'fish' || kind === 'bug' || kind === 'sit') {
        Sim.scene({ title: '플레이어의 행동 추종', actors: { A: v }, steps: [{ go: 'A', to: { loc: p.loc, x: p.x + 1.4, z: p.z + 0.4 }, max: 12 }, { pose: 'A', p: kind === 'fish' ? 'fish' : kind === 'bug' ? 'swing' : 'sit', prop: kind === 'fish' ? 'rod' : kind === 'bug' ? 'net' : null, t: 6 }] });
      } else if (kind.startsWith('emote:')) {
        Sim.emote(v, kind.slice(6), 2.5);  // 플레이어가 이모티콘을 쓰면 동일한 이모티콘으로 응답
      }
    }
  };

  // 꿈속 세계 훔쳐보기 보상
  Ev.dreamReward = function (v, score) {
    const loot = pick(D.DREAM_LOOT);
    const st = S();
    st.player.inv.dream_item = (st.player.inv.dream_item || 0) + 1;
    st.player.dreamLoot = st.player.dreamLoot || [];
    st.player.dreamLoot.push(loot);
    st.player.coins += Math.round(score * 5);
    return loot;
  };

  // 운명의 불꽃 튀기기 (Spark) — 분수대로 불러내 강제로 눈을 맞추게 함
  Ev.spark = function (a, b) {
    for (const v of [a, b]) if (v.sceneId) Sim.endScene(Sim.scenes.find(s => s.id === v.sceneId), true);
    Sim.scene({ title: '운명의 불꽃 (Spark)', actors: { A: a, B: b }, steps: [
      { par: [{ go: 'A', to: { place: 'plaza', spot: 'fountain' }, run: true }, { go: 'B', to: { place: 'plaza', spot: 'fountain', dx: 1.3 }, run: true }] },
      { face: 'A', at: 'B' }, { face: 'B', at: 'A' }, { fx: 'spark', at: 'A' }, { par: [{ emote: 'A', e: '❗' }, { emote: 'B', e: '❗' }] }, { wait: 2 }, { par: [{ emote: 'A', e: '😳' }, { emote: 'B', e: '😳' }] },
    ], onEnd: () => {
      a.status.curious = { with: b.id, until: S().time + 1440 }; b.status.curious = { with: a.id, until: S().time + 1440 };
      Soc.addRomance(a.id, b.id, 15, '운명의 불꽃'); Soc.addRomance(b.id, a.id, 15, '운명의 불꽃');
      Soc.addFriend(a.id, b.id, 8, 3);
    } });
    Sim.log('romance', `✨ 운명의 불꽃! ${a.name}와(과) ${b.name}이(가) 분수대에서 눈이 마주쳐 서로에게 호기심이 생겼어요.`, [a.id, b.id], 1);
  };

  // 진실만을 말하게 하는 홍차
  Ev.truthTea = function () {
    const st = S();
    const at_ = st.villagers.filter(v => at(v, 'cafe', 14) || v.loc === 'cafe_in');
    const pool = at_.length ? at_ : st.villagers.filter(v => free(v)).slice(0, 3);
    const out = [];
    for (const v of pool.slice(0, 4)) {
      let text;
      if (v.crush) text = `사실 나... ${nm(v.crush.target)}를 좋아해!`;
      else if (v.jealousy && v.jealousy.meter > 20) text = `솔직히 ${nm(v.jealousy.rival)} 좀 얄미워!`;
      else if (Soc.partnerOf(v.id)) text = `사실 ${nm(Soc.partnerOf(v.id))}랑 요즘 ${Soc.boredomStage(Soc.rel(v.id, Soc.partnerOf(v.id))) === 'STABLE' ? '너무 행복해' : '좀 권태로워'}...`;
      else text = `사실 나 ${pick(['월급을 다 과자에 써', '밤마다 몰래 춤 연습을 해', '비둘기가 무서워', '노래를 엄청 못 불러'])}.`;
      Sim.say(v, text, 6); Sim.emote(v, '😳', 4);
      st.player.knownSecrets.push({ owner: v.id, text, day: day() });
      if (v.crush) v.crush.player_aware = true;
      out.push(`${v.name}: "${text}"`);
    }
    Sim.log('gossip', `🫖 카페에 '진실만을 말하게 하는 홍차'가 하사되어 주민들의 속마음이 새어 나왔어요!`, pool.map(v => v.id), 2);
    return out;
  };

  // 분수대 소원 (플레이어)
  Ev.playerWish = function (targetId) {
    const st = S();
    const center = chance(0.4);
    if (center) st.wishes[P] = st.time + 1440;
    return center;
  };

  // 도서관 책 124페이지 쪽지 읽기 (플레이어)
  Ev.readBookNote = function () {
    const st = S();
    const n = (st.bookNotes || []).find(n => !n.read);
    if (!n) return null;
    n.read = true;
    Soc.addQuest({ type: 'report_letter', title: `📖 책 속 비밀 편지 제보`, giver: n.from, from: n.from, target: n.to, desc: `도서관 시집 124페이지의 쪽지를 ${nm(n.to)}에게 제보해 주세요.` });
    return `📖 시집 124페이지에 쪽지가 끼워져 있다: "${n.text}" — ${nm(n.from)}`;
  };

  // 비밀 편지 배달 (플레이어가 대상의 집 편지함에 넣음)
  Ev.deliverLetter = function (targetId) {
    const st = S();
    const q = st.quests.find(q => q.type === 'secret_letter' && q.target === targetId && q.stage === 'deliver' && q.state === 'active');
    if (!q || !Soc.takeItem(q.item)) return false;
    q.stage = 'delivered'; q.deliveredDay = day();
    q.desc = `다음 날 ${nm(targetId)}의 반응을 살펴보세요 (말을 걸어 "어제 편지 받았어?")`;
    emit('quest', q);
    return true;
  };

  // =========================================================
  // 동적 방 분위기 — 취향 적합도 & 리액션
  //  베이스(메인 성격: 벽지 색·조명) + 오버레이(특이 취향: 무늬·파티클·앰비언스)
  // =========================================================
  const rgb = c => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  const colDist = (a, b) => { const A = rgb(a), B = rgb(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
  Ev.atmoScore = function (v, room) {
    if (!room || room.theme) return null;
    const A1 = D.ATMO_L1[v.keys.L1], A4 = D.ATMO_L4[v.keys.L4];
    if (!A1 || !A4) return null;
    const wall = room.wall !== undefined ? room.wall : 0xf4efe6;
    const color = Math.max(0, 1 - Math.min(...A1.palette.map(p => colDist(wall, p))) / 160);
    let pattern = room.wallStyle === 'p_' + A4.pattern ? 1 : (room.wallStyle || '').startsWith('p_') ? 0.25 : 0.1;
    // 레퍼런스 스타일 방: 벽 색·무늬 대신 "스타일이 성격에 얼마나 맞는지"로 평가
    if (room.roomStyle && FM.RoomKit && (room.wallStyle || '').startsWith('st_')) {
      const fit = FM.RoomKit.styleFit(v.keys, room.roomStyle);
      const light = room.light === A1.light ? 1 : ['warm', 'sunset', 'mood', 'rosy', 'study', 'pastel'].includes(room.light) ? 0.45 : 0.15;
      let sc = Math.round(100 * (0.75 * fit + 0.25 * light));
      const loud = ['party', 'redneon', 'neon', 'holo', 'bright'].includes(room.light);
      if ((v.keys.L1 === 'INTROVERT' || v.keys.L1 === 'ANXIOUS') && loud) sc = 0;
      return Math.max(0, Math.min(100, sc));
    }
    const light = room.light === A1.light ? 1 : ['warm', 'sunset', 'mood', 'rosy', 'study', 'pastel'].includes(room.light) ? 0.45 : 0.15;
    let score = Math.round(100 * (0.4 * color + 0.35 * pattern + 0.25 * light));
    // 최악의 조합: 조용한/심약한 주민 + 화려한 파티 조명·파티 색
    const loud = ['party', 'redneon', 'neon', 'holo', 'bright'].includes(room.light) || colDist(wall, D.ATMO_L1.EXTROVERT.palette[1]) < 60 || colDist(wall, D.ATMO_L1.EXTROVERT.palette[0]) < 60;
    if ((v.keys.L1 === 'INTROVERT' || v.keys.L1 === 'ANXIOUS') && loud) score = 0;
    return Math.max(0, Math.min(100, score));
  };
  Ev.atmoLabel = function (v, room) {
    const A1 = D.ATMO_L1[v.keys.L1], A4 = D.ATMO_L4[v.keys.L4];
    return A1 && A4 ? `${A1.name} 베이스(${A1.pname}) + ${A4.name} 무늬(${A4.pname})` : '';
  };
  // 방 분위기 리액션: 대만족(90+) 공중부양 댄스 / 최악(10 이하) 눈 가리고 구석에 웅크림
  Ev.atmoReact = function (v, room, byPlayer) {
    const sc = Ev.atmoScore(v, room); if (sc === null) return null;
    room.atmoScore = sc; room.satisfaction = sc;
    if (v.sceneId || v.talkingToPlayer || v.following || v.child || (v.act && v.act.id === 'sleep')) return sc;
    const { w, d } = Sim.interiorSize(v.home);
    if (sc >= 90) {
      Sim.scene({ title: '방 분위기 대만족', actors: { A: v }, steps: [{ emote: 'A', e: '💖' }, { say: 'A', text: L.sty(v, '이 방… 완전 내 취향이야!'), t: 2.5 }, { pose: 'A', p: 'levitateDance', t: 4 }, { fx: 'hearts', at: 'A' }] });
      v.stress = clamp(v.stress - 30, 0, 100); v.mood = clamp(v.mood + 20, 0, 100);
      if (byPlayer) Soc.addFriend(v.id, P, 15, 10, '방 분위기 대만족');
      Sim.log('room', `💖 ${v.name}이(가) 방 분위기에 대만족해서 공중부양 댄스를 췄어요! (적합도 ${sc}%)`, [v.id], byPlayer ? 2 : 0);
    } else if (sc <= 10) {
      Sim.scene({ title: '방 분위기 최악', actors: { A: v }, steps: [{ pose: 'A', p: 'coverEyes', t: 2.5 }, { emote: 'A', e: '😣' }, { say: 'A', text: L.sty(v, '너무 눈부셔… 여긴 내 방 같지 않아'), t: 2.5 }, { go: 'A', to: { loc: v.home, x: -w / 2 + 0.6, z: -d / 2 + 0.6 }, max: 6 }, { pose: 'A', p: 'sadSit', t: 5 }] });
      v.depression = clamp((v.depression || 0) + 15, 0, 100); v.stress = clamp(v.stress + 10, 0, 100);
      if (byPlayer) Soc.addFriend(v.id, P, -3, -2, '방 분위기 최악');
      Sim.log('room', `😣 ${v.name}이(가) 방 분위기가 너무 맞지 않아 눈을 가리고 구석에 웅크렸어요… (적합도 ${sc}%)`, [v.id], byPlayer ? 2 : 0);
    }
    return sc;
  };
  // 집에 들어설 때 (방이 바뀐 뒤 처음 / 하루 한 번 가끔) 분위기에 반응
  let atmoT = 0;
  Ev.atmoTick = function (dtR) {
    if ((atmoT -= dtR) > 0) return; atmoT = 2;
    const st = S();
    for (const v of st.villagers) {
      if (v.loc !== v.home || v.child) continue;
      const room = st.rooms[v.home]; if (!room || room.theme) continue;
      const rev = room.atmoRev || 1;
      if (v.atmoSeenRev === undefined) { v.atmoSeenRev = rev; v.atmoDay = day(); room.atmoScore = Ev.atmoScore(v, room); continue; }   // 처음엔 조용히 기록만
      const fresh = v.atmoSeenRev !== rev;
      if (!fresh && (v.atmoDay === day() || Math.random() > 0.15)) { v.atmoDay = day(); continue; }
      v.atmoSeenRev = rev; v.atmoDay = day();
      Ev.atmoReact(v, room, fresh && room.atmoByPlayer);
    }
  };

  // 지연 실행 처리
  const baseTick = Ev.tick;
  Ev.tick = function (dtR, dMin) { while (later.length) { try { later.shift()(); } catch (e) { console.error(e); } } baseTick(dtR, dMin); Ev.playerHomeTick(dtR); Ev.atmoTick(dtR); };
})();
