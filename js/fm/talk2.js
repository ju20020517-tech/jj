/* =========================================================
 *  의지 대화 엔진 (Will-driven Dialogue)
 *  주민은 "지금 하고 싶은 말"을 스스로 고른다.
 *
 *   1) 마음 상태(v.mind) : 기억 · 질문과 답 · 약속 · 최근에 한 말 · 오늘 받은 부탁 수
 *   2) 의도(Intent)       : 배고픔/외로움/짝사랑/험담/소문/부탁/초대/질문/회상/질투/연인... 30여 가지
 *                          → 상황 점수 × 성격 가중치 × (최근에 한 말이면 감점) 으로 하나를 고름
 *   3) 선택지             : 의도마다 플레이어 선택지 3~4개, 선택 결과는 성격에 따라 반응이 다르고
 *                          관계 수치 · 기억 · 다른 주민과의 관계 · 약속으로 이어짐
 *   4) 명령 · 관계 유도 · 연애 : 플레이어가 주도하는 메뉴 (주민이 거절하거나 조건을 걸 수도 있음)
 *   5) 주민끼리 관계 이벤트 : 게임 시간 30~60분마다 같은 곳에 있는 주민 사이에 사건 발생
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, D = FM.D, L = FM.L, Sim = FM.Sim, Soc = FM.Soc;
  const P = 'P';
  const S = () => Sim.get();
  const pl = () => S().player;
  const day = () => Sim.time.day();
  const hour = () => Sim.time.hour();
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const has = (v, k) => Sim.has(v, k);
  const byId = id => Sim.byId(id);
  const nm = id => Sim.nameOf(id);
  // 말투(L3) — 질문·감탄 모양을 망가뜨리지 않는 어미 조립
  const tail0 = t => t.replace(/[.!~]+$/, '');
  const SPEECH = {
    WARM: t => pick([t, tail0(t) + '~', t.endsWith('?') ? t : tail0(t) + '~ 헤헤']),
    FORMAL: t => t,
    CYNICAL: t => pick(['흥, ', '딱히... ', '', '...']) + t + (chance(0.25) && !t.endsWith('?') ? ' 딱히 너 때문은 아니야' : ''),
    CUTE: t => t.endsWith('?') ? t + pick([' 헤헤', ' 응응?', '']) : tail0(t) + pick(['! 라구', '~ 헤헤', '! 뿌잉']),
    PRANKSTER: t => t + pick([' ㅋㅋ', ' ㅋㅋㅋ', ' ~지롱', ' 킥킥']),
    DREAMY: t => t.endsWith('?') ? t.slice(0, -1) + '...?' : tail0(t) + pick(['... 랄까나', '...', '~ 구름처럼 말이야']),
    PASSIONATE: t => t.endsWith('?') ? t + '!' : tail0(t) + pick(['!!', '!!!', '!! 우오오']),
    SHY: t => pick(['...저기, ', '...저, 저기... ', '']) + t + pick([' (꼼지락)', '', '...']),
  };
  const sty = (v, t) => { const f = SPEECH[(v && v.keys && v.keys.L3) || 'WARM']; return f ? f(t) : t; };
  const J = t => (FM.Sim.josa ? FM.Sim.josa(t) : t);
  const rel = (a, b) => Soc.rel(a, b);
  const fp = (a, b) => rel(a, b).friendship_point;
  const alive = () => S().villagers.filter(v => !v.child && !v.staff && !v.visitor);
  const others = v => alive().filter(o => o !== v);
  const W = (FM.Will = {});

  // ---------------------------------------------------------
  // 마음 상태
  // ---------------------------------------------------------
  function mind(v) {
    if (!v.mind) v.mind = { mem: [], asked: {}, recent: [], lines: [], orders: { day: 0, n: 0 }, flirt: { day: 0, n: 0 }, confessCd: 0, pending: null, promiseBroken: null, told: {} };
    return v.mind;
  }
  W.mind = mind;
  function remember(v, kind, text, extra = {}) {
    const m = mind(v);
    m.mem.push(Object.assign({ kind, text, day: day() }, extra));
    if (m.mem.length > 24) m.mem.splice(0, m.mem.length - 24);
  }
  W.remember = remember;
  const prof = () => pl().prof || (pl().prof = {});     // 플레이어가 주민들에게 털어놓은 취향 (소문처럼 퍼짐)

  // 성격 톤 (L1) — 같은 의도라도 말하는 방식이 다름
  const TONE = {
    ROMANTIC: 'soft', ATHLETIC: 'loud', SCHOLARLY: 'calm', LAZY: 'lazy', EXTROVERT: 'loud',
    INTROVERT: 'soft', SNOB: 'posh', CRANKY: 'rough', ARTISTIC: 'odd', ANXIOUS: 'nervous',
  };
  const tone = v => TONE[v.keys.L1] || 'calm';
  // 톤별 대사 고르기: { soft: [...], loud: [...], ... , any: [...] }
  function T(v, pool, vars = {}) {
    const m = mind(v);
    let arr = (pool[tone(v)] || []).concat(pool.any || []);
    if (!arr.length) arr = Object.values(pool).flat();
    const fresh = arr.filter(t => !m.lines.includes(t));
    const t = pick(fresh.length ? fresh : arr);
    m.lines.push(t); if (m.lines.length > 30) m.lines.shift();
    return sty(v, L.fill ? L.fill(t, vars) : t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? ''));
  }
  const fill = (t, vars) => t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

  // ---------------------------------------------------------
  // 주민 스스로의 취향 (결정적) — 질문에 대한 주민의 답
  // ---------------------------------------------------------
  const hash = s => { let h = 7; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const QUESTIONS = [
    { k: 'season', q: ['너는 어느 계절이 제일 좋아?', '계절 중에 하나만 고르라면?'], a: ['🌸 봄', '🏖️ 여름', '🍁 가을', '❄️ 겨울'], why: ['꽃 냄새', '바다', '낙엽 밟는 소리', '눈 오는 밤'] },
    { k: 'food', q: ['너 제일 좋아하는 음식이 뭐야?', '배고플 때 제일 먼저 생각나는 음식은?'], a: ['🍰 달달한 디저트', '🌶️ 매콤한 떡볶이', '🍜 따끈한 국물', '🍓 과일'], why: ['달콤함은 행복이야', '매운 게 스트레스 풀리지', '국물은 영혼을 데워줘', '상큼한 게 최고지'] },
    { k: 'color', q: ['좋아하는 색 있어?', '너한테 어울리는 색은 뭐라고 생각해?'], a: ['🩷 분홍', '🩵 하늘색', '💚 초록', '🖤 검정'], why: ['포근해', '시원해', '마음이 편해져', '멋있잖아'] },
    { k: 'pet', q: ['반려동물 키운다면 뭐 키울래?', '강아지파야 고양이파야?'], a: ['🐶 강아지', '🐱 고양이', '🐹 햄스터', '🐠 물고기'], why: ['꼬리 흔드는 게 귀여워', '도도한 게 매력이지', '볼 빵빵한 거 봐', '보고만 있어도 힐링'] },
    { k: 'time', q: ['너는 아침형이야, 밤형이야?', '하루 중에 언제가 제일 좋아?'], a: ['🌅 이른 아침', '☀️ 한낮', '🌇 해질녘', '🌙 한밤중'], why: ['공기가 맑잖아', '에너지 넘쳐', '노을이 예뻐', '조용해서 좋아'] },
    { k: 'hobby', q: ['쉬는 날엔 보통 뭐 해?', '요즘 빠진 취미 있어?'], a: ['🎣 낚시', '📚 독서', '🏃 운동', '🎮 게임'], why: ['기다리는 맛이 있지', '다른 세상에 가는 기분', '땀 흘리면 개운해', '이기면 짜릿해'] },
    { k: 'love', q: ['연애할 때 제일 중요한 게 뭐라고 생각해?', '좋아하는 사람의 어떤 점에 끌려?'], a: ['💗 다정함', '😂 재미', '🤝 믿음', '✨ 외모'], why: ['따뜻한 게 최고야', '같이 웃을 수 있어야지', '믿을 수 있어야 해', '첫눈에 반하는 것도 있잖아'] },
    { k: 'dream', q: ['어릴 때 꿈이 뭐였어?', '다시 태어나면 뭐가 되고 싶어?'], a: ['🚀 우주비행사', '🍳 요리사', '🎤 가수', '🌱 농부'], why: ['별을 만지고 싶었어', '맛있는 걸 나눠주고 싶어', '무대에 서고 싶었지', '흙냄새가 좋아'] },
    { k: 'fear', q: ['너 무서워하는 거 있어?', '세상에서 제일 싫은 게 뭐야?'], a: ['🕷️ 벌레', '👻 귀신', '🏔️ 높은 곳', '🫥 혼자 남는 것'], why: ['다리가 너무 많아', '밤에 화장실 못 가', '다리가 후들거려', '외로운 게 제일 무서워'] },
    { k: 'place', q: ['이 섬에서 제일 좋아하는 곳이 어디야?', '혼자 있고 싶을 때 어디 가?'], a: ['🏖️ 해변', '⛲ 광장', '☕ 카페', '🔭 천문대'], why: ['파도 소리', '북적북적한 게 좋아', '커피 향', '별 보면 고민이 작아져'] },
    { k: 'weekend', q: ['완벽한 주말은 어떤 모습이야?', '하루 자유 시간이 생기면?'], a: ['🛌 하루 종일 자기', '🎉 친구들이랑 파티', '🧺 소풍', '🧩 혼자 취미'], why: ['잠이 보약이지', '시끌벅적해야 주말이지', '도시락 싸서!', '나만의 시간이 필요해'] },
    { k: 'music', q: ['어떤 음악 좋아해?', '노래방 가면 뭐 불러?'], a: ['🎸 락', '🎹 발라드', '🕺 댄스', '🎻 클래식'], why: ['심장이 뛰어', '가사가 좋아', '몸이 저절로 움직여', '마음이 차분해져'] },
  ];
  // 성격에 따라 답이 기울어짐
  const LEAN = { ATHLETIC: { hobby: 2, weekend: 2, music: 2 }, LAZY: { weekend: 0, food: 0 }, SCHOLARLY: { hobby: 1, place: 3, music: 3 }, ROMANTIC: { love: 0, color: 0, time: 2 }, EXTROVERT: { weekend: 1, music: 2 }, INTROVERT: { weekend: 3, place: 3, time: 3 }, SNOB: { music: 3, food: 0 }, CRANKY: { color: 3, music: 0 }, ANXIOUS: { fear: 3, pet: 1 }, ARTISTIC: { dream: 2, music: 1 } };
  function ownAnswer(v, k) {
    const q = QUESTIONS.find(x => x.k === k);
    const lean = (LEAN[v.keys.L1] || {})[k];
    if (lean !== undefined && hash(v.id + k) % 3) return lean;
    return hash(v.id + ':' + k) % q.a.length;
  }

  // ---------------------------------------------------------
  // 의도 (Intents)
  //  w(v, c) → 점수 (0 이면 안 나옴) / say(v, c) → { text, choices:[{k,label}], data }
  //  on(v, choice, data) → { text, close?, then? }
  // ---------------------------------------------------------
  const I = {};
  const ctx = v => {
    const st = S(), r = rel(v.id, P);
    const lover = Soc.partnerOf(v.id);
    return { st, r, lover, pLover: pl().lover || Soc.partnerOf(P), stage: r.friendship_stage, fpP: r.friendship_point, trust: r.trust_level, rom: Soc.F(v.id, P).romance, ge: s => Soc.stageAtLeast(v.id, P, s) };
  };

  // 1. 배고픔
  I.hungry = {
    w: (v) => v.hunger > 60 ? 3 + (v.hunger - 60) / 10 : 0,
    say: v => ({ text: T(v, { soft: ['배가 너무 고파... 혹시 먹을 거 있어?', '꼬르륵... 들었어? 부끄럽다'], loud: ['배고파서 힘이 안 나! 뭐 먹을 거 없어?!', '밥! 밥이 필요해!'], lazy: ['배고픈데 움직이기 싫어... 누가 밥 좀 떠먹여 주면 좋겠다', '먹고 자고 먹고 자고 싶다'], posh: ['식사 시간이 한참 지났군요. 품위가 떨어지려 합니다', '티타임이 간절하군요'], rough: ['배고파서 예민하니까 건드리지 마', '...뭐, 배고프다고. 됐냐?'], any: ['오늘 아직 아무것도 못 먹었어'] }),
      choices: [{ k: 'give', label: '🍪 먹을 거 줄게' }, { k: 'eat', label: '🍜 같이 밥 먹으러 가자!' }, { k: 'tease', label: '😏 "다이어트 좋잖아?"' }] }),
    on: (v, k) => {
      if (k === 'give') { const food = Object.keys(pl().inv).find(id => D.ITEMS[id] && D.ITEMS[id].stamina && pl().inv[id] > 0); if (!food) return { text: sty(v, '...없구나. 괜찮아, 마음만 받을게') }; Soc.takeItem(food); v.hunger = Math.max(0, v.hunger - 50); Soc.addFriend(v.id, P, 6, 4, '먹을 것 나눔'); remember(v, 'fed', `${D.ITEMS[food].name}을(를) 나눠줬어`, { item: food }); return { text: sty(v, `${D.ITEMS[food].name}! 너 진짜 천사야`) }; }
      if (k === 'eat') { Soc.addFollower(v, 'walk'); v.hunger = Math.max(0, v.hunger - 10); remember(v, 'meal', '같이 밥 먹으러 가자고 했어'); Soc.addFriend(v.id, P, 3, 2, '같이 식사'); return { text: sty(v, '좋아! 식당 쪽으로 가자, 따라갈게'), close: true }; }
      Soc.addFriend(v.id, P, has(v, 'PRANKSTER') || has(v, 'EXTROVERT') ? 1 : -3, 0);
      return { text: has(v, 'PRANKSTER') ? sty(v, '너 오늘 나한테 한 대 맞는다 ㅋㅋ') : has(v, 'CRANKY') ? sty(v, '...말 다 했냐?') : sty(v, '너무해... 😢') };
    },
  };

  // 2. 외로움 — 친구가 적음
  I.lonely = {
    w: v => { const n = others(v).filter(o => fp(v.id, o.id) >= 30).length; return n <= 1 ? 4 : n <= 2 ? 1.5 : 0; },
    say: v => ({ text: T(v, { soft: ['요즘 좀 외로워... 이 섬에 아직 친한 친구가 별로 없거든', '다들 친해 보이는데 나만 겉도는 것 같아'], nervous: ['나... 친구 만드는 거 너무 어려워. 말 걸면 싫어할까 봐', '누가 나랑 친해지고 싶어 할까...?'], rough: ['딱히 친구 필요 없어. ...진짜야', '혼자가 편해. ...아마도'], any: ['주말에 같이 놀 사람이 없어'] }),
      choices: [{ k: 'intro', label: '🤝 내가 친구 소개해 줄게' }, { k: 'me', label: '🫶 "내가 있잖아!"' }, { k: 'walk', label: '🚶 같이 산책하자' }] }),
    on: (v, k) => {
      if (k === 'intro') return { text: sty(v, '정말? 누구를 소개해 줄 건데?'), choices: introChoices(v, 'introduce') };
      if (k === 'me') { Soc.addFriend(v.id, P, 5, 5, '위로'); v.depression = clamp((v.depression || 0) - 10, 0, 100); remember(v, 'comfort', '"내가 있잖아"라고 해줬어'); return { text: sty(v, '...고마워. 그 말 오래 기억할게') }; }
      Soc.addFollower(v, 'walk'); return { text: sty(v, '응! 오늘은 같이 다니자'), close: true };
    },
  };

  // 3. 소문 전하기 (실제 섬 뉴스에서)
  function freshNews(v) {
    const log = S().log.slice(-60).reverse();
    return log.find(e => e.day >= day() - 2 && ['couple', 'breakup', 'wedding', 'jealous', 'friend', 'fight', 'confess', 'baby', 'rel'].includes(e.type) && !(e.who || []).includes(v.id) && !mind(v).told[e.text]);
  }
  I.gossip = {
    w: v => { mind(v).told = mind(v).told || {}; return freshNews(v) ? (has(v, 'GOSSIP') || has(v, 'EXTROVERT') || has(v, 'BUSYBODY') ? 6 : 2.5) : 0; },
    say: v => {
      const e = freshNews(v); mind(v).told[e.text] = 1;
      const who = (e.who || []).filter(id => id !== P);
      const lead = T(v, { loud: ['야야, 그 소식 들었어?!', '대박 뉴스 있어!'], soft: ['있잖아... 이거 들었어?', '소문 하나 들었는데...'], rough: ['관심 없겠지만 알려줄게.', '...들었냐?'], posh: ['흥미로운 소식이 있더군요.'], any: ['이거 비밀인데...'] });
      return { text: `${lead} ${e.text.replace(/^[^\s]+\s/, '')}`, data: { who },
        choices: [{ k: 'good', label: '😊 "잘됐다! 축하해 주자"' }, { k: 'knew', label: '😎 "그럴 줄 알았어"' }, { k: 'bad', label: '🤨 "글쎄, 별로 안 어울리던데?"' }, { k: 'stop', label: '🤐 "남 얘기는 그만하자"' }] };
    },
    on: (v, k, d) => {
      for (const id of d.who) {
        if (k === 'good') Soc.addFriend(v.id, id, 2, 1);
        if (k === 'bad') Soc.addFriend(v.id, id, -3, -2);
      }
      if (k === 'stop') { Soc.addFriend(v.id, P, has(v, 'GOSSIP') ? -2 : 1, 3); return { text: has(v, 'GOSSIP') ? sty(v, '칫, 재미없어...') : sty(v, '맞아, 내가 좀 오지랖이었다') }; }
      if (k === 'bad') { remember(v, 'opinion', `${d.who.map(nm).join(', ')} 얘기에 별로라고 했어`); return { text: has(v, 'GOSSIP') ? sty(v, '그치?! 나도 그렇게 생각했어! 다른 애들한테도 말해야지') : sty(v, '음... 네 말 듣고 보니 그런가') }; }
      Soc.addFriend(v.id, P, 2, 1);
      return { text: k === 'good' ? sty(v, '역시 너는 착하다니까') : sty(v, '오~ 촉 좋네!') };
    },
  };

  // 4. 누군가에 대한 의견 (좋아함 / 싫어함)
  function strongest(v) {
    const list = others(v).map(o => ({ o, f: fp(v.id, o.id), r: rel(v.id, o.id) })).filter(x => x.r.greetDay || x.f > 40 || x.f < 20);
    list.sort((a, b) => Math.abs(b.f - 45) - Math.abs(a.f - 45));
    return list[0];
  }
  I.opinion = {
    w: v => { const s = strongest(v); return s && Math.abs(s.f - 45) > 20 ? 3 : 0; },
    say: v => {
      const s = strongest(v), o = s.o, like = s.f > 45;
      if (like) return { data: { o: o.id, like }, text: T(v, { soft: ['{o}는 참 좋은 애야. 같이 있으면 편해', '요즘 {o}랑 자주 얘기해. 말이 잘 통해'], loud: ['{o} 최고야! 걔랑 있으면 시간 가는 줄 몰라!'], rough: ['{o}? ...뭐, 나쁘진 않아'], posh: ['{o}은(는) 품위를 아는 친구입니다'], odd: ['{o}는 나랑 같은 주파수야. 삐빅'], any: ['{o}랑 더 친해지고 싶다'] }, { o: o.name }),
        choices: [{ k: 'closer', label: `🤝 "${o.name}랑 오늘 놀아 봐!"` }, { k: 'love', label: '😏 "혹시... 좋아하는 거 아냐?"' }, { k: 'meh', label: `😒 "${o.name}? 난 별로던데"` }] };
      return { data: { o: o.id, like }, text: T(v, { soft: ['{o}랑은... 좀 어색해. 나를 싫어하는 것 같아', '{o} 때문에 속상한 일이 있었어'], loud: ['{o} 진짜 짜증나! 어제도 나 무시했어!'], rough: ['{o} 얘기 꺼내지 마. 기분 나빠'], nervous: ['{o}가 나 보면서 수군거리는 것 같아...'], posh: ['{o}은(는) 예의가 부족하더군요'], any: ['{o}랑은 안 맞는 것 같아'] }, { o: o.name }),
        choices: [{ k: 'reconcile', label: '🕊️ "화해해 봐, 내가 도와줄게"' }, { k: 'side', label: '🛡️ "난 네 편이야"' }, { k: 'blame', label: '🤔 "너도 잘못한 거 아냐?"' }] };
    },
    on: (v, k, d) => {
      const o = byId(d.o); if (!o) return { text: '...' };
      if (k === 'closer') { Sim.scene({ title: '놀러 가기', actors: { A: v }, steps: [{ go: 'A', to: { actor: o.id, near: 1.2 }, max: 60 }, { face: 'A', at: o.id }, { say: 'A', text: sty(v, `${o.name}! 같이 놀자!`), t: 2.5 }] }); setTimeout(() => Soc.startChat(v, o), 200); Soc.addFriend(v.id, o.id, 6, 3, '플레이어 권유'); return { text: sty(v, '그래! 지금 가볼게'), close: true }; }
      if (k === 'love') { if (Soc.canRomance(v.id, o.id)) { Soc.addRomance(v.id, o.id, rnd(10, 20), '플레이어의 한마디'); return { text: v.loveArch === 'TSUNDERE' || has(v, 'CYNICAL') ? sty(v, '뭐, 뭐래! 아니거든?! ...(귀가 빨개졌다)') : sty(v, `에...? ${o.name}를...? 생각해 본 적 없는데... 이상하게 두근거리네`) }; } return { text: sty(v, '에이, 그런 사이 아니야 ㅋㅋ') }; }
      if (k === 'meh') { Soc.addFriend(v.id, o.id, -4, -2); Soc.addFriend(v.id, P, -2, -1); remember(v, 'opinion', `${o.name}를 별로라고 했어`); return { text: sty(v, `...${o.name}가 뭘 잘못했는데? 좀 섭섭하다`) }; }
      if (k === 'reconcile') return startReconcile(v, o);
      if (k === 'side') { Soc.addFriend(v.id, P, 3, 5, '편들어줌'); Soc.addFriend(v.id, o.id, -4, -3); setBond(v.id, o.id, 'NEMESIS', true); return { text: sty(v, '역시 너밖에 없어!') }; }
      Soc.addFriend(v.id, P, has(v, 'CRANKY') ? -4 : -1, 1); Soc.addFriend(v.id, o.id, 4, 2);
      return { text: has(v, 'CRANKY') ? sty(v, '...쳇. 알았어, 나도 좀 심했어') : sty(v, '...듣고 보니 나도 오해했을 수 있겠다') };
    },
  };

  // 5. 짝사랑 고민 (주민 → 주민, 아직 풍선이 뜨기 전 단계)
  function budding(v) {
    return others(v).filter(o => Soc.canRomance(v.id, o.id) && Soc.partnerOf(v.id) !== o.id).map(o => ({ o, r: Soc.F(v.id, o.id).romance })).filter(x => x.r >= 25 && x.r < 60).sort((a, b) => b.r - a.r)[0];
  }
  I.budding = {
    w: (v, c) => budding(v) && c.trust >= 30 ? 4 : 0,
    say: v => { const b = budding(v); return { data: { o: b.o.id }, text: T(v, { soft: ['있잖아... 요즘 {o} 생각이 자꾸 나. 이상하지?', '{o}가 웃으면 나도 모르게 따라 웃게 돼'], loud: ['나 {o}만 보면 심장이 쿵쾅거려! 이거 병인가?!'], rough: ['{o}가... 자꾸 신경 쓰여. 짜증나게'], nervous: ['{o}랑 눈 마주치면 얼굴이 뜨거워져... 어떡해'], posh: ['요즘 {o}의 안부가 궁금하군요... 이 감정은 무엇일까요'], any: ['{o}한테 잘 보이고 싶어'] }, { o: b.o.name }),
      choices: [{ k: 'love', label: '💘 "그거 사랑이야!"' }, { k: 'date', label: '☕ "내가 둘이 만나게 해줄게"' }, { k: 'tip', label: `🎁 "${b.o.name}가 좋아하는 걸 알아봐"` }, { k: 'no', label: '🙅 "착각이야, 그냥 친구지"' }] }; },
    on: (v, k, d) => {
      const o = byId(d.o); if (!o) return { text: '...' };
      if (k === 'love') { Soc.addRomance(v.id, o.id, rnd(12, 22), '플레이어의 확신'); v.confidence = clamp((v.confidence || 0) + 15, 0, 100); return { text: sty(v, '사, 사랑...? 그렇구나... 나 어떡해') }; }
      if (k === 'date') return setupDate(v, o);
      if (k === 'tip') { const like = (o.giftLikes || [])[0]; remember(v, 'tip', `${o.name}가 좋아하는 건 ${like || '비밀'}`); Soc.addRomance(v.id, o.id, 5); return { text: sty(v, like ? `${o.name}는 ${like} 좋아한다고? 기억해 둘게! 다음에 선물해야지` : '좋아, 몰래 알아볼게!') }; }
      Soc.F(v.id, o.id).romance = Math.max(0, Soc.F(v.id, o.id).romance - 18);
      return { text: sty(v, '...그렇겠지? 그냥 친구니까') };
    },
  };

  // 6. 플레이어에게 질문 — 대답을 기억하고, 나중에 다시 꺼냄
  I.ask = {
    w: v => QUESTIONS.some(q => mind(v).asked[q.k] === undefined) ? 3 : 0,
    say: v => {
      const pool = QUESTIONS.filter(q => mind(v).asked[q.k] === undefined);
      const q = pick(pool);
      const heard = prof()[q.k] !== undefined && chance(0.5) ? prof()[q.k] : null;
      if (heard !== null) {
        const src = prof()['_' + q.k];
        return { data: { k: q.k, heard }, text: sty(v, `${src ? nm(src) + '한테 들었는데, ' : ''}너 ${q.a[heard].replace(/^\S+\s/, '')} 좋아한다며? 진짜야?`), choices: [{ k: 'yes', label: '👍 "응, 맞아!"' }, { k: 'no', label: '🙅 "아니, 사실은..."' }] };
      }
      return { data: { k: q.k }, text: sty(v, pick(q.q)), choices: q.a.map((a, i) => ({ k: 'a' + i, label: a })) };
    },
    on: (v, k, d) => {
      const q = QUESTIONS.find(x => x.k === d.k);
      if (k === 'no') return { text: sty(v, '어? 그럼 뭐 좋아하는데?'), choices: q.a.map((a, i) => ({ k: 'a' + i, label: a })), keep: true };
      const ans = k === 'yes' ? d.heard : +k.slice(1);
      mind(v).asked[d.k] = ans; prof()[d.k] = ans; prof()['_' + d.k] = v.id;
      const mine = ownAnswer(v, d.k);
      const same = mine === ans;
      remember(v, 'answer', `${q.k}: ${q.a[ans]}`);
      if (same) {
        Soc.addFriend(v.id, P, 5, 2, '취향이 통함');
        if (Soc.canRomance(v.id, P)) Soc.addRomance(v.id, P, d.k === 'love' ? 10 : 4, '취향 일치');
        return { text: T(v, { loud: ['우와!!! 나도! 우리 완전 통했다!', '진짜?! 나랑 똑같아!'], soft: ['정말? 나도 그래... 신기하다', '우리 좀 닮았나 봐'], rough: ['...흥, 취향은 괜찮네'], posh: ['훌륭한 안목이군요. 저도 같은 생각입니다'], any: ['나도야! {why}!'] }, { why: q.why[ans] }) };
      }
      Soc.addFriend(v.id, P, 2, 1);
      const mineTxt = q.a[mine];
      return { text: T(v, { loud: ['에이~ 난 {m}! 그래도 {a}도 좋지!'], soft: ['그렇구나. 난 {m} 쪽인데... 네 얘기 들으니까 궁금해진다'], rough: ['{a}? 이상한 취향이네. 난 {m}야'], posh: ['흥미롭군요. 저는 {m} 쪽이랍니다'], lazy: ['음... 난 {m}. 이유는... 귀찮아서 생략'], odd: ['{a}... 그건 우주의 몇 번째 색일까? 난 {m}'], any: ['난 {m}! 다음엔 네가 좋아하는 거 같이 해보자'] }, { a: q.a[ans], m: mineTxt }) };
    },
  };

  // 7. 회상 — 전에 있었던 일을 기억하고 다시 이야기함
  I.recall = {
    w: v => { const m = mind(v); const mem = m.mem.filter(x => day() - x.day >= 1 && !x.recalled); return mem.length ? 3.5 : Object.keys(m.asked).length ? 1.5 : 0; },
    say: v => {
      const m = mind(v);
      const mem = m.mem.filter(x => day() - x.day >= 1 && !x.recalled);
      if (mem.length) {
        const x = pick(mem); x.recalled = true;
        const ago = day() - x.day === 1 ? '어제' : `${day() - x.day}일 전에`;
        const lines = {
          fed: [`${ago} 네가 {t}. 그 맛 아직도 생각나`, `${ago} 배고플 때 챙겨준 거 고마웠어`],
          gift: [`${ago} 준 {i} 말이야, 방에 잘 두고 있어!`, `${ago} 받은 선물 보면서 네 생각 했어`],
          comfort: [`${ago} 네가 해준 말 덕분에 힘냈어`, `그때 "내가 있잖아"라고 해준 거... 아직 기억해`],
          promise: [`${ago} 약속 지켜줘서 진짜 좋았어!`], broken: [`${ago} 기다렸는데... 안 왔잖아. 좀 서운했어`],
          date: [`${ago} 데이트, 계속 생각나`, `${ago} 같이 본 풍경 잊을 수 없어`],
          order: [`${ago} 네가 시킨 거 해봤는데 은근 재밌더라`], answer: [`네가 {a} 좋다고 했잖아. 그래서 오늘 그거 보고 네 생각 났어`],
          reconcile: [`${ago} 화해시켜 준 거 고마워. 요즘 사이 좋아졌어`], intro: [`${ago} 소개해 준 친구랑 요즘 잘 지내!`],
        };
        const t = pick(lines[x.kind] || [`${ago} 있었던 일 기억나? ${x.text}`]);
        const a = x.kind === 'answer' ? x.text.split(': ')[1] : '';
        return { data: { kind: x.kind }, text: sty(v, fill(t, { t: x.text, i: x.item && D.ITEMS[x.item] ? D.ITEMS[x.item].name : '선물', a })),
          choices: x.kind === 'broken' ? [{ k: 'sorry', label: '🙇 "미안해, 정말 깜빡했어"' }, { k: 'excuse', label: '😅 "일이 좀 있었어"' }] : [{ k: 'warm', label: '😊 "나도 기억해!"' }, { k: 'again', label: '🔁 "또 그러자!"' }] };
      }
      const k = pick(Object.keys(m.asked)); const q = QUESTIONS.find(x => x.k === k);
      return { data: { kind: 'answer' }, text: sty(v, `네가 ${q.a[m.asked[k]]} 좋다고 했던 거 기억나서, 오늘 그거 생각하면서 하루 보냈어`), choices: [{ k: 'warm', label: '😊 "기억해 줬구나!"' }, { k: 'again', label: '💬 "너는 요즘 뭐가 좋아?"' }] };
    },
    on: (v, k, d) => {
      if (k === 'sorry') { Soc.addFriend(v.id, P, 3, 4); return { text: sty(v, '...진심으로 사과하니까 봐줄게. 다음엔 꼭 와!') }; }
      if (k === 'excuse') { Soc.addFriend(v.id, P, -2, -3); return { text: has(v, 'CRANKY') ? sty(v, '핑계는. 됐어') : sty(v, '...그랬구나. 알았어') }; }
      Soc.addFriend(v.id, P, 3, 2, '추억');
      if (Soc.canRomance(v.id, P) && (d.kind === 'date' || d.kind === 'comfort')) Soc.addRomance(v.id, P, 3);
      return { text: k === 'again' ? sty(v, '응! 약속이다!') : sty(v, '헤헤, 우리만의 추억이다') };
    },
  };

  // 8. 하고 싶은 것 (취미 욕구) → 같이 하자 / 혼자 다녀와
  const HOBBY_ACT = {
    GARDEN: { t: '꽃밭에 물 주러', place: 'park', spot: 'flowers', pose: 'water', prop: 'wateringCan' }, FOOD: { t: '카페에서 수플레 먹으러', place: 'cafe', pose: 'eat', prop: 'sandwich' },
    STUDY: { t: '도서관에 책 읽으러', place: 'library', pose: 'read', prop: 'book' }, FISHING: { t: '폭포에 낚시하러', place: 'waterfall', spot: 'fish', pose: 'fish', prop: 'rod' },
    FASHION: { t: '쇼핑몰 구경하러', place: 'mall', pose: 'mirror' }, MUSIC: { t: '광장에서 노래하러', place: 'plaza', pose: 'sing', prop: 'mic' },
    GOSSIP: { t: '광장에서 수다 떨러', place: 'plaza', pose: 'talk' }, CLEAN: { t: '해변 쓰레기 주우러', place: 'beach', spot: 'sand', pose: 'sweep', prop: 'broom' },
    OCCULT: { t: '천문대에 별 보러', place: 'observatory', spot: 'stars', pose: 'lookUp' }, FITNESS: { t: '광장 조깅하러', place: 'plaza', pose: 'jog' },
  };
  I.want = {
    w: v => HOBBY_ACT[v.keys.L4] && (v.mood || 50) > 25 ? 2.5 : 0,
    say: v => { const a = HOBBY_ACT[v.keys.L4]; return { text: T(v, { loud: ['오늘따라 {t} 가고 싶다! 같이 갈래?!'], soft: ['날씨가 좋아서 {t} 가고 싶어... 같이 갈래?'], lazy: ['{t} 가고 싶은데... 누가 업어주면 갈래'], rough: ['{t} 갈 건데. 따라오든지'], posh: ['{t} 갈 예정입니다. 동행하시겠습니까?'], any: ['{t} 갈까 생각 중이야'] }, { t: a.t }),
      choices: [{ k: 'go', label: '🙌 "같이 가자!"' }, { k: 'solo', label: '👋 "재밌게 다녀와"' }, { k: 'later', label: '🕕 "이따 저녁에 같이 가자" (약속)' }] }; },
    on: (v, k) => {
      const a = HOBBY_ACT[v.keys.L4];
      if (k === 'go') { Soc.addFollower(v, 'walk'); Soc.addFriend(v.id, P, 4, 2, '같이 취미'); remember(v, 'promise', `${a.t} 같이 갔어`); return { text: sty(v, '신난다! 가자!'), close: true }; }
      if (k === 'solo') { doActivity(v, a, 30); return { text: sty(v, '응! 다녀올게!'), close: true }; }
      return makePact(v, a.place, 18, 'hang', `${a.t} 같이 가기`);
    },
  };

  // 9. 초대 — 시간과 장소를 정해 약속, 안 지키면 기억함
  const MEET = [['plaza', '⛲ 광장'], ['cafe', '☕ 카페'], ['beach', '🏖️ 해변'], ['park', '🌳 공원'], ['observatory', '🔭 천문대'], ['cliff', '🌅 절벽 언덕']];
  I.invite = {
    w: (v, c) => c.ge('FRIEND') && !(S().pacts || []).some(p => p.v === v.id) ? 2.5 : 0,
    say: v => { const [place, name] = pick(MEET), h = Math.max(hour() + 2, 17) % 24; return { data: { place, h }, text: T(v, { loud: ['오늘 {h}시에 {p}에서 만나자! 할 얘기 있어!'], soft: ['혹시... 오늘 {h}시쯤 {p}에서 만날 수 있어?', '{h}시에 {p}에서 기다려도 될까?'], rough: ['{h}시. {p}. 늦으면 간다'], posh: ['{h}시에 {p}에서 담소를 나누시겠습니까?'], any: ['이따 {h}시에 {p} 어때?'] }, { h, p: name.slice(2) }),
      choices: [{ k: 'yes', label: '👌 "좋아, 꼭 갈게!"' }, { k: 'no', label: '🙏 "오늘은 안 될 것 같아"' }] }; },
    on: (v, k, d) => {
      if (k === 'no') { Soc.addFriend(v.id, P, -1, 0); return { text: has(v, 'ANXIOUS') ? sty(v, '...그렇구나. 내가 괜히 물어봤나 봐') : sty(v, '아쉽다. 다음에!') }; }
      return makePact(v, d.place, d.h, 'meet', `${MEET.find(m => m[0] === d.place)[1]}에서 ${v.name} 만나기`);
    },
  };

  // 10. 기분 (우울 / 신남)
  I.sad = {
    w: v => (v.depression || 0) > 35 || (v.status && v.status.slumpUntil > S().time) ? 5 : (v.mood || 50) < 25 ? 3 : 0,
    say: v => ({ text: T(v, { soft: ['오늘은 좀... 기운이 없어', '괜히 눈물이 날 것 같은 날이야'], loud: ['...오늘은 나도 조용히 있고 싶어'], rough: ['건드리지 마. ...그냥 기분이 별로야'], nervous: ['나 뭘 해도 안 될 것 같아...'], odd: ['마음에 구름이 꼈어. 비 올 것 같아'], any: ['요즘 좀 힘들어'] }),
      choices: [{ k: 'hug', label: '🤗 꼭 안아주기' }, { k: 'listen', label: '👂 "무슨 일인지 말해 봐"' }, { k: 'joke', label: '🤪 웃긴 얘기 해주기' }, { k: 'cheer', label: '💪 "힘내! 넌 할 수 있어"' }] }),
    on: (v, k) => {
      const fit = { hug: ['ROMANTIC', 'ANXIOUS', 'INTROVERT'], listen: ['SCHOLARLY', 'INTROVERT', 'SNOB'], joke: ['EXTROVERT', 'LAZY', 'ARTISTIC'], cheer: ['ATHLETIC', 'CRANKY', 'EXTROVERT'] }[k];
      const good = fit.includes(v.keys.L1);
      v.depression = clamp((v.depression || 0) - (good ? 25 : 8), 0, 100); v.mood = clamp((v.mood || 50) + (good ? 25 : 8), 0, 100);
      Soc.addFriend(v.id, P, good ? 6 : 2, good ? 6 : 2, '위로');
      if (good && Soc.canRomance(v.id, P)) Soc.addRomance(v.id, P, 4, '위로');
      remember(v, 'comfort', good ? '힘들 때 딱 필요한 걸 해줬어' : '힘들 때 곁에 있어 줬어');
      if (k === 'hug' && !Soc.stageAtLeast(v.id, P, 'FRIEND')) return { text: sty(v, '어, 어어...? 갑자기...? (당황했지만 조금 웃었다)') };
      return { text: good ? T(v, { any: ['...고마워. 네 덕분에 좀 살 것 같아', '역시 너야. 딱 이게 필요했어'] }) : T(v, { any: ['...응, 마음은 고마워', '헤헤... 조금 나아졌어'] }) };
    },
  };
  I.happy = {
    w: v => (v.mood || 50) > 80 ? 2 : 0,
    say: v => ({ text: T(v, { loud: ['오늘 기분 최고야! 뭐든 할 수 있을 것 같아!'], soft: ['오늘은 괜히 기분이 좋아. 너 만나서 그런가?'], rough: ['...오늘은 봐줄게. 기분 좋으니까'], odd: ['오늘은 무지개 맛이 나는 날이야'], any: ['좋은 일이 있었어!'] }),
      choices: [{ k: 'what', label: '😆 "무슨 좋은 일인데?"' }, { k: 'dance', label: '💃 "그럼 춤이라도 춰!"' }] }),
    on: (v, k) => {
      if (k === 'dance') { Sim.scene({ title: '신나는 춤', actors: { A: v }, steps: [{ pose: 'A', p: 'dance', t: 5 }, { emote: 'A', e: '🎵' }] }); return { text: sty(v, '좋아! 보라고!'), close: true }; }
      const m = mind(v).mem.slice(-1)[0];
      return { text: m ? sty(v, `음~ 그냥! ${m.text}... 그런 일들이 쌓여서?`) : sty(v, '비밀~ 헤헤') };
    },
  };

  // 11. 부탁 (심부름) — 원래 있던 부탁 시스템 연결
  I.favor = {
    w: (v, c) => c.ge('FRIEND') ? 1.5 : 0.5,
    say: v => ({ text: T(v, { soft: ['저기... 부탁 하나만 해도 될까?'], loud: ['너 지금 한가해?! 부탁이 있어!'], rough: ['...할 거 없으면 좀 도와주든가'], posh: ['실례가 안 된다면 작은 부탁이 있습니다'], any: ['혹시 시간 있으면 도와줄래?'] }),
      choices: [{ k: 'ok', label: '💪 "뭔데? 말해 봐"' }, { k: 'no', label: '🙏 "지금은 좀 바빠"' }] }),
    on: (v, k) => {
      if (k === 'no') return { text: sty(v, '그래, 다음에 부탁할게') };
      return { redirect: 'errand' };
    },
  };

  // 12. 질투 — 플레이어가 다른 사람과 가까울 때
  I.jealousP = {
    w: (v, c) => c.rom >= 45 && c.pLover && c.pLover !== v.id ? 5 : 0,
    say: (v, c) => ({ data: { o: c.pLover }, text: T(v, { soft: ['요즘 {o}랑 많이 붙어 다니더라... 아니, 그냥 그렇다고', '{o} 좋아? ...아냐, 대답 안 해도 돼'], rough: ['{o}랑 잘해 봐. ...난 신경 안 써', '흥, {o} 만나러 가지 그래?'], loud: ['{o}만 챙기고! 나도 좀 봐줘!'], any: ['{o}랑 있을 때 너 웃는 거, 봤어'] }, { o: nm(c.pLover) }),
      choices: [{ k: 'sorry', label: '🫂 "너도 소중한 친구야"' }, { k: 'truth', label: '💬 "혹시 나 좋아해?"' }, { k: 'cold', label: '🧊 "그건 네가 상관할 일 아니야"' }] }),
    on: (v, k) => {
      if (k === 'sorry') { Soc.addFriend(v.id, P, 4, 3); Soc.F(v.id, P).romance = Math.max(0, Soc.F(v.id, P).romance - 6); return { text: sty(v, '...친구. 응, 알았어') }; }
      if (k === 'truth') { Soc.addRomance(v.id, P, 5); return { text: v.loveArch === 'TSUNDERE' || has(v, 'CYNICAL') ? sty(v, '누, 누가! ...그냥 신경 쓰인 것뿐이야!') : sty(v, '...응. 사실 조금... 아니 많이') }; }
      Soc.addFriend(v.id, P, -6, -4); v.depression = clamp((v.depression || 0) + 10, 0, 100);
      return { text: sty(v, '...그래. 미안') };
    },
  };

  // 13. 플레이어에게 설렘 (짝사랑 전 단계)
  I.flirtP = {
    w: (v, c) => Soc.canRomance(v.id, P) && c.rom >= 35 && c.lover !== P ? 3 + c.rom / 30 : 0,
    say: v => ({ text: T(v, { soft: ['너랑 있으면 시간이 너무 빨리 가', '오늘 왠지 너 보고 싶었어'], loud: ['너 오늘 왜 이렇게 멋있어?! 반칙이야!'], rough: ['...너 오늘 좀 괜찮네. 딱 오늘만'], nervous: ['저, 저기... 오늘 입은 거 잘 어울려...!'], posh: ['당신과의 대화는 언제나 즐겁군요'], odd: ['너한테서 별 냄새가 나. 좋은 뜻이야'], any: ['너랑 얘기하면 기분이 좋아져'] }),
      choices: [{ k: 'same', label: '💗 "나도 너랑 있는 게 좋아"' }, { k: 'tease', label: '😏 "갑자기 왜 그래~?"' }, { k: 'friend', label: '🙂 "우린 좋은 친구지!"' }] }),
    on: (v, k) => {
      if (k === 'same') { Soc.addRomance(v.id, P, rnd(6, 12), '설레는 대답'); Sim.emote(v, '💗'); return { text: sty(v, '...진짜? 헤헤, 오늘 잠 못 자겠다') }; }
      if (k === 'tease') { Soc.addRomance(v.id, P, 2); return { text: has(v, 'CYNICAL') || v.loveArch === 'TSUNDERE' ? sty(v, '아, 아무것도 아니거든!') : sty(v, '그, 그냥...! 몰라!') }; }
      Soc.F(v.id, P).romance = Math.max(0, Soc.F(v.id, P).romance - 10); Soc.addFriend(v.id, P, 3, 2);
      return { text: sty(v, '...응, 친구. 맞아, 친구지') };
    },
  };

  // 14. 연인(플레이어) 전용
  I.loverP = {
    w: (v, c) => c.lover === P ? 6 : 0,
    say: (v, c) => {
      const m = Soc.marriageOf(v.id), married = m && m.marriage_stage === 'MARRIED' || c.r.status === 'MARRIED';
      const kids = Soc.childrenOf ? Soc.childrenOf(v.id).length : 0;
      if (married && !kids && day() - (c.r.since || 0) >= 3 && chance(0.4)) return { data: { kind: 'baby' }, text: T(v, { soft: ['있잖아... 우리 닮은 아기가 있으면 어떨까?'], loud: ['우리 아기 생기면 매일 놀아줄 거야! ...아기 갖고 싶지 않아?'], any: ['요즘 아기들 보면 너무 귀여워... 우리도?'] }), choices: [{ k: 'baby', label: '👶 "좋아, 우리 아기 갖자"' }, { k: 'wait', label: '⏳ "조금만 더 둘이 지내자"' }] };
      const pool = married ? ['오늘 저녁은 뭐 먹을까, {n}?', '{n}, 오늘도 무사히 돌아와 줘서 고마워', '결혼하길 정말 잘했어'] : ['{n}! 보고 싶었어', '오늘 데이트할까? 가고 싶은 데 있어', '우리 사귄 지 벌써 {d}일이야!'];
      return { data: { kind: 'love' }, text: sty(v, fill(pick(pool), { n: c.r.nickname[P] || pl().name, d: day() - (c.r.since || day()) + 1 })), choices: [{ k: 'date', label: '💑 "데이트하자!" (장소 고르기)' }, { k: 'love', label: '💗 "사랑해"' }, { k: 'gift', label: '🎁 선물 주기' }] };
    },
    on: (v, k) => {
      if (k === 'baby') return babyTalk(v);
      if (k === 'wait') { Soc.addFriend(v.id, P, 1, 2); return { text: sty(v, '응, 천천히 하자. 둘만의 시간도 소중하니까') }; }
      if (k === 'date') return dateMenu(v);
      if (k === 'gift') return { redirect: 'gift' };
      Soc.addRomance(v.id, P, 3); const r = rel(v.id, P); Soc.addBoredom && Soc.addBoredom(r, -5, '사랑 표현');
      return { text: T(v, { soft: ['나도... 많이 사랑해'], loud: ['나도 사랑해!!! 섬 전체에 외치고 싶어!'], rough: ['...알아. 나도 그래'], any: ['나도야, 제일 많이'] }) };
    },
  };

  // 15. 섬 생활 (시간/날씨/장소 반응)
  I.situ = {
    w: () => 1.2,
    say: v => {
      const h = hour(), weather = (S().weather || {}).kind || '';
      const where = v.loc === v.home ? 'home' : v.loc;
      let pool;
      if (h >= 22 || h < 5) pool = { soft: ['이 시간까지 안 자? 나도 잠이 안 와서...'], lazy: ['이 시간엔 원래 자야 하는데... 하암'], rough: ['밤늦게 뭐 하냐'], any: ['밤공기 좋다. 별 보여?'] };
      else if (/rain|비/.test(weather)) pool = { soft: ['빗소리 좋다... 우산 같이 쓸래?'], loud: ['비 온다! 웅덩이 밟으러 가자!'], rough: ['비 오는 날은 딱 질색이야'], any: ['비 오니까 따뜻한 차 마시고 싶다'] };
      else if (where === 'home') pool = { soft: ['우리 집 어때? 좀 꾸며봤어'], posh: ['제 거처가 마음에 드시는지요'], rough: ['남의 집 구경 오래 하지 마라'], any: ['편하게 있어! 차 줄까?'] };
      else if (h < 10) pool = { loud: ['좋은 아침! 오늘 뭐 할 거야?!'], lazy: ['아침이다... 5분만 더...'], any: ['아침 햇살 좋다'] };
      else pool = { any: ['오늘 섬이 참 평화롭다', '광장에 사람 많던데 가봤어?', '오늘 무슨 날인지 알아? ...그냥 좋은 날'] };
      return { text: T(v, pool), choices: [{ k: 'agree', label: '😊 "그러게!"' }, { k: 'plan', label: '🗺️ "그럼 뭐 할까?"' }] };
    },
    on: (v, k) => {
      Soc.addFriend(v.id, P, 1, 0.5);
      if (k === 'plan') return { text: sty(v, '음... 네가 하자는 거 할래!'), choices: cmdChoices(v) };
      return { text: sty(v, '헤헤') };
    },
  };

  // 16. 엉뚱한 질문 (정답 없음, 성격 반응)
  const WHATIF = [
    ['섬에 하루 동안 우리 둘만 남으면 뭐 할 거야?', ['🏝️ 섬 전체 탐험', '🍳 모든 식당 음식 다 먹기', '😴 광장 한가운데서 낮잠', '🎤 광장에서 콘서트']],
    ['초능력 하나 생긴다면?', ['🕊️ 하늘 날기', '⏳ 시간 멈추기', '🧠 마음 읽기', '🌀 순간이동']],
    ['무인도에 하나만 가져간다면?', ['🎣 낚싯대', '📚 책 한 권', '🧸 곰 인형', '🙋 너']],
    ['로또 되면 제일 먼저 뭐 할래?', ['🏠 집 증축', '✈️ 세계 여행', '🎁 친구들 선물', '💰 저금']],
    ['동물로 다시 태어난다면?', ['🐬 돌고래', '🦅 독수리', '🐈 고양이', '🦥 나무늘보']],
  ];
  const WHATIF_FAV = { ATHLETIC: 0, EXTROVERT: 3, LAZY: 2, SCHOLARLY: 1, ROMANTIC: 3, INTROVERT: 1, SNOB: 3, CRANKY: 1, ARTISTIC: 0, ANXIOUS: 2 };
  I.whatif = {
    w: () => 1.6,
    say: v => { const i = (Math.random() * WHATIF.length) | 0, [q, a] = WHATIF[i]; return { data: { i }, text: sty(v, `갑자기 궁금한데, ${q}`), choices: a.map((x, j) => ({ k: 'a' + j, label: x })) }; },
    on: (v, k, d) => {
      const j = +k.slice(1), fav = WHATIF_FAV[v.keys.L1] ?? 0, a = WHATIF[d.i][1];
      if (a[j].includes('🙋')) { if (Soc.canRomance(v.id, P)) Soc.addRomance(v.id, P, 8, '"너"를 고름'); Soc.addFriend(v.id, P, 4, 3); return { text: sty(v, '...나?! 그, 그런 대답은 반칙이야!') }; }
      if (j === fav) { Soc.addFriend(v.id, P, 4, 2); return { text: sty(v, `${a[j]}! 나도 그거 고르려고 했어! 우리 뇌 연결됐나 봐`) }; }
      Soc.addFriend(v.id, P, 1.5, 1);
      return { text: sty(v, `${a[j]}? 너답다 ㅋㅋ 난 ${a[fav]}!`) };
    },
  };

  // 17. 라이벌 · 경쟁
  I.rival = {
    w: v => bondOf(v, 'RIVAL') ? 3 : 0,
    say: v => { const o = bondOf(v, 'RIVAL'); return { data: { o }, text: T(v, { loud: ['{o}한테 절대 질 수 없어! 나 응원해 줄 거지?!'], rough: ['{o} 녀석... 다음엔 내가 이긴다'], any: ['{o}랑 또 시합하기로 했어'] }, { o: nm(o) }),
      choices: [{ k: 'cheer', label: '📣 "당연하지! 네가 이겨!"' }, { k: 'fair', label: '🤝 "둘 다 멋져. 사이좋게 해"' }, { k: 'other', label: `😈 "${nm(o)}가 더 잘하던데?"` }] }; },
    on: (v, k, d) => {
      if (k === 'cheer') { Soc.addFriend(v.id, P, 4, 2); v.confidence = clamp((v.confidence || 0) + 15, 0, 100); return { text: sty(v, '좋았어! 네 응원이면 무조건 이긴다!') }; }
      if (k === 'fair') { Soc.addFriend(v.id, d.o, 5, 3); setBond(v.id, d.o, 'RIVAL_FRIEND'); return { text: sty(v, '...그래, 좋은 라이벌이지') }; }
      Soc.addFriend(v.id, P, -3, -2); Soc.addFriend(v.id, d.o, -5, -2);
      return { text: sty(v, '뭐?! 두고 봐, 이번엔 진짜 이긴다!!') };
    },
  };

  // 18. 방 이야기 (집에 있을 때)
  I.room = {
    w: v => v.loc === v.home && FM.Ev && FM.Ev.atmoScore ? 2 : 0,
    say: v => { const sc = FM.Ev.atmoScore(v, S().rooms[v.home]) || 50; return { data: { sc }, text: sc >= 70 ? T(v, { any: ['내 방 어때? 요즘 여기 있으면 진짜 행복해', '이 방 분위기 완전 내 스타일이야'] }) : T(v, { any: ['방이 좀... 나랑 안 맞는 것 같아. 바꿔볼까?', '요즘 방에 있으면 기분이 가라앉아'] }), choices: [{ k: 'nice', label: '😍 "완전 예쁘다!"' }, { k: 'redo', label: '🎨 "내가 같이 꾸며줄게" (무료)' }] }; },
    on: (v, k) => {
      if (k === 'redo') { const R = FM.RoomKit; if (R) { const { w, d } = Sim.interiorSize(v.home); Object.assign(S().rooms[v.home], R.styleRoom(R.pickStyle(v.keys, (Math.random() * 1e9) | 0), w, d, (FM.INTERIORS[v.home] || {}).door, (Math.random() * 1e9) | 0, v.keys)); FM.G && FM.G.interior && FM.G.interior.iid === v.home && FM.G.rebuildInterior(); } Soc.addFriend(v.id, P, 4, 3); return { text: sty(v, '우와! 새 방이다! 고마워!') }; }
      Soc.addFriend(v.id, P, 2, 1); return { text: sty(v, '헤헤, 너한테 칭찬받으니까 더 좋다') };
    },
  };

  // 19. 비밀 털어놓기 (신뢰가 높을 때)
  const SECRETS = ['사실 나 {o}한테 빌린 책을 아직 못 돌려줬어', '가끔 밤에 혼자 광장에서 노래 연습해', '어릴 때 꿈이 가수였던 거, 아무도 몰라', '나 사실 벌레가 너무 무서워', '{o} 생일 몰래 준비하고 있어'];
  I.secret = {
    w: (v, c) => c.trust >= 55 && !mind(v).secretDay ? 2.5 : 0,
    say: v => { mind(v).secretDay = day(); const o = pick(others(v)); const t = fill(pick(SECRETS), { o: o ? o.name : '누군가' }); pl().knownSecrets.push({ owner: v.id, text: t, day: day() }); return { text: sty(v, `너한테만 말하는 건데... ${t}`), choices: [{ k: 'keep', label: '🤐 "비밀 지킬게"' }, { k: 'tease', label: '😆 "그거 다 말할 거다~"' }] }; },
    on: (v, k) => {
      if (k === 'keep') { Soc.addFriend(v.id, P, 3, 8, '비밀 공유'); return { text: sty(v, '고마워. 너니까 말한 거야') }; }
      Soc.addFriend(v.id, P, has(v, 'PRANKSTER') ? 2 : -4, has(v, 'PRANKSTER') ? 1 : -8);
      return { text: has(v, 'PRANKSTER') ? sty(v, '그럼 나도 네 비밀 다 말한다 ㅋㅋ') : sty(v, '...장난이지? 진짜 장난이지?!') };
    },
  };

  // ---------------------------------------------------------
  // 의도 고르기 — 점수 × 무작위 × 최근 사용 감점
  // ---------------------------------------------------------
  function chooseIntent(v) {
    const c = ctx(v), m = mind(v);
    const cands = [];
    for (const [id, it] of Object.entries(I)) {
      let w = 0; try { w = it.w(v, c) || 0; } catch (e) { w = 0; }
      if (w <= 0) continue;
      const recentIdx = m.recent.lastIndexOf(id);
      if (recentIdx >= 0) w *= 0.1 + 0.15 * (m.recent.length - 1 - recentIdx);
      w *= rnd(0.6, 1.4);
      cands.push([id, w]);
    }
    if (!cands.length) return 'situ';
    const tot = cands.reduce((a, b) => a + b[1], 0);
    let r = Math.random() * tot;
    for (const [id, w] of cands) { if ((r -= w) < 0) return id; }
    return cands[0][0];
  }
  function runIntent(v, id) {
    const it = I[id]; const c = ctx(v);
    const out = it.say(v, c);
    const m = mind(v);
    m.recent.push(id); if (m.recent.length > 8) m.recent.shift();
    m.pending = { intent: id, data: out.data || {} };
    return { text: out.text, options: out.choices.map(ch => ({ id: 'w', label: ch.label, arg: ch.k })).concat(tail(v)) };
  }
  const tail = v => [{ id: 'wMore', label: '💬 다른 얘기 하자' }, { id: 'menu', label: '📋 다른 행동 하기…' }, { id: 'bye', label: '👋 잘 가' }];
  W.chooseIntent = chooseIntent;
  W.runIntent = runIntent;

  // ---------------------------------------------------------
  // 명령 (행동 부탁) — 주민이 거절하거나 조건을 걸 수 있음
  // ---------------------------------------------------------
  const CMDS = {
    dance: { label: '💃 춤춰 봐!', kind: 'show', pose: 'dance', t: 6, line: '좋아, 잘 봐!', like: ['EXTROVERT', 'ARTISTIC', 'MUSIC', 'PASSIONATE'], hate: ['INTROVERT', 'SHY', 'CRANKY'] },
    sing: { label: '🎤 노래 한 곡 불러줘', kind: 'show', pose: 'sing', prop: 'mic', t: 6, line: '에헴! 들어봐~ ♪', like: ['MUSIC', 'EXTROVERT', 'ROMANTIC'], hate: ['SHY', 'INTROVERT'] },
    cheer: { label: '🙌 나 응원해 줘!', kind: 'show', pose: 'cheer', t: 4, line: '힘내라 힘내라!', like: ['ATHLETIC', 'PASSIONATE', 'WARM'], hate: ['CYNICAL'] },
    sit: { label: '🪑 잠깐 앉아서 쉬어', kind: 'show', pose: 'sit', t: 8, line: '휴~ 좋다', like: ['LAZY', 'SLOTH'], hate: ['ATHLETIC'] },
    wait: { label: '✋ 여기서 잠깐 기다려', kind: 'wait', t: 40, line: '응, 여기 있을게', like: ['DILIGENT', 'WARM'], hate: ['WANDERER', 'BUSYBODY'] },
    follow: { label: '🚶 나 따라와', kind: 'follow', line: '어디 가는데? 따라갈게', like: ['WARM', 'CUTE'], hate: ['INTROVERT'] },
    home: { label: '🏠 집에 가서 푹 쉬어', kind: 'home', line: '응, 들어가서 쉴게', like: ['LAZY', 'HOMEBODY', 'INTROVERT'], hate: ['WANDERER', 'EXTROVERT'] },
    fish: { label: '🎣 낚시 좀 하고 와', kind: 'act', act: { place: 'waterfall', spot: 'fish', pose: 'fish', prop: 'rod' }, line: '월척 잡아올게!', like: ['FISHING', 'LAZY'], hate: ['FASHION'] },
    gym: { label: '💪 운동 좀 해!', kind: 'act', act: { place: 'plaza', pose: 'jog' }, line: '좋아, 뛰고 올게!', like: ['ATHLETIC', 'FITNESS', 'PASSIONATE'], hate: ['LAZY', 'SLOTH'] },
    study: { label: '📚 도서관 가서 공부해', kind: 'act', act: { place: 'library', pose: 'read', prop: 'book' }, line: '책 읽고 올게', like: ['SCHOLARLY', 'STUDY', 'CURIOUS'], hate: ['ATHLETIC', 'PRANKSTER'] },
    cafe: { label: '☕ 카페에서 쉬다 와', kind: 'act', act: { place: 'cafe', pose: 'drink', prop: 'teacup' }, line: '수플레 먹고 올래!', like: ['FOOD', 'ROMANTIC', 'SNOB'], hate: [] },
    beach: { label: '🏖️ 해변 산책하고 와', kind: 'act', act: { place: 'beach', spot: 'sea', pose: 'look' }, line: '바다 보고 올게~', like: ['ROMANTIC', 'DREAMY', 'WANDERER'], hate: [] },
    clean: { label: '🧹 방 청소 좀 해', kind: 'redirect', to: 'cleanOrder', like: ['CLEAN', 'DILIGENT'], hate: ['LAZY', 'SLOTH'] },
    // 사회적 명령
    talkTo: { label: '🗣️ ○○한테 말 걸어 봐', kind: 'social', line: '알았어, 가볼게!', like: ['EXTROVERT', 'GOSSIP'], hate: ['SHY', 'INTROVERT'] },
    giftTo: { label: '🎁 ○○한테 선물해 줘', kind: 'social', line: '선물... 뭐가 좋을까?', like: ['WARM', 'ROMANTIC'], hate: ['CRANKY'] },
    sorryTo: { label: '🙇 ○○한테 사과해', kind: 'social', line: '...알았어, 사과할게', like: ['WARM', 'ANXIOUS'], hate: ['CRANKY', 'SNOB', 'CYNICAL'] },
    confessTo: { label: '💌 ○○한테 고백해!', kind: 'social', line: '지, 지금?! ...해볼게!', like: ['PASSIONATE', 'ROMANTIC'], hate: ['SHY', 'ANXIOUS'] },
    playWith: { label: '🤸 ○○랑 같이 놀아', kind: 'social', line: '좋아! 같이 놀자고 해볼게', like: ['EXTROVERT', 'CUTE'], hate: ['INTROVERT'] },
  };
  function compliance(v, key) {
    const c = CMDS[key], r = rel(v.id, P), m = mind(v);
    if (m.orders.day !== day()) m.orders = { day: day(), n: 0 };
    let p = 0.28 + r.friendship_point / 170 + r.trust_level / 260;
    if (Soc.partnerOf(v.id) === P) p += 0.25;
    for (const k of c.like || []) if (has(v, k)) p += 0.18;
    for (const k of c.hate || []) if (has(v, k)) p -= 0.2;
    if (has(v, 'CRANKY') || has(v, 'CYNICAL')) p -= 0.08;
    if ((v.mood || 50) < 25) p -= 0.15;
    p -= Math.max(0, m.orders.n - 2) * 0.12;          // 너무 많이 시키면 싫어함
    return clamp(p, 0.05, 0.97);
  }
  function cmdChoices(v) {
    return Object.entries(CMDS).filter(([k]) => k !== 'clean' || v.loc === v.home).map(([k, c]) => ({ id: 'cmd', label: c.label, arg: k })).concat([{ id: 'menu', label: '↩️ 돌아가기' }]);
  }
  const REFUSE = {
    any: ['음... 지금은 좀 싫은데?', '왜 내가 그래야 하는데?', '오늘은 그럴 기분 아니야'],
    soft: ['미안... 오늘은 못 하겠어', '그건 좀 부끄러워...'], rough: ['싫어. 내가 네 부하야?', '귀찮아. 다른 애한테 시켜'],
    lazy: ['하암... 지금 움직이면 녹아버릴 거야', '5분만... 아니 5시간만 이따가'], posh: ['정중히 사양하겠습니다', '품위에 맞지 않는 일이군요'],
    loud: ['에이~ 지금 딴 거 하고 싶어!'], nervous: ['나, 나는 그런 거 못 해...!'], odd: ['지금은 달이 허락하지 않아'],
  };
  function doActivity(v, a, secs = 30) {
    const steps = [{ go: 'A', to: { place: a.place, spot: a.spot }, max: 90 }, { pose: 'A', p: a.pose, prop: a.prop || null, t: secs }, { emote: 'A', e: pick(['😊', '🎵', '✨']) }];
    Sim.scene({ title: '부탁받은 일', actors: { A: v }, steps, onEnd: () => { v.mood = clamp((v.mood || 50) + 8, 0, 100); } });
  }
  function execCmd(v, key, target) {
    const c = CMDS[key]; const m = mind(v); m.orders.n++;
    v.talkingToPlayer = false;
    remember(v, 'order', `${c.label.replace(/^\S+\s/, '').replace('○○', target ? nm(target) : '')} 부탁을 들어줬어`);
    Soc.addFriend(v.id, P, 0.5, 1);
    if (c.kind === 'show') { Sim.scene({ title: '부탁: ' + key, actors: { A: v }, steps: [{ say: 'A', text: sty(v, c.line), t: 1.5 }, { pose: 'A', p: c.pose, prop: c.prop || null, t: c.t }, { emote: 'A', e: pick(['😆', '✨', '🎵']) }] }); return { text: sty(v, c.line), close: true }; }
    if (c.kind === 'wait') { Sim.scene({ title: '기다리기', actors: { A: v }, steps: [{ pose: 'A', p: 'look', t: c.t }] }); return { text: sty(v, c.line), close: true }; }
    if (c.kind === 'follow') { Soc.addFollower(v, 'walk'); return { text: sty(v, c.line), close: true }; }
    if (c.kind === 'home') { Sim.scene({ title: '집에 가기', actors: { A: v }, steps: [{ go: 'A', to: { home: 'A', x: 0, z: 0 }, max: 120 }, { pose: 'A', p: 'sit', t: 10 }] }); v.stress = clamp((v.stress || 0) - 10, 0, 100); return { text: sty(v, c.line), close: true }; }
    if (c.kind === 'act') { doActivity(v, c.act, 40); return { text: sty(v, c.line), close: true }; }
    if (c.kind === 'redirect') return { redirect: c.to };
    // 사회적 명령
    const o = byId(target); if (!o) return { text: '...' };
    if (key === 'talkTo' || key === 'playWith') {
      Sim.scene({ title: '말 걸기', actors: { A: v }, steps: [{ go: 'A', to: { actor: o.id, near: 1.2 }, max: 80 }, { face: 'A', at: o.id }] , onEnd: () => { Soc.startChat(v, o); Soc.addFriend(v.id, o.id, key === 'playWith' ? 7 : 4, 3, '플레이어 권유'); if (key === 'playWith' && chance(0.5)) setBond(v.id, o.id, sameHobby(v, o) ? 'HOBBY' : 'BUDDY'); } });
      return { text: sty(v, c.line), close: true };
    }
    if (key === 'giftTo') {
      Sim.scene({ title: '선물 전하기', actors: { A: v }, steps: [{ go: 'A', to: { actor: o.id, near: 1.1 }, max: 80 }, { face: 'A', at: o.id }, { say: 'A', text: sty(v, `${o.name}, 이거 받아!`), t: 2.5 }, { fx: 'gift', at: 'A' }], onEnd: () => { Soc.addFriend(o.id, v.id, 8, 4, '선물'); if (Soc.canRomance(o.id, v.id)) Soc.addRomance(o.id, v.id, 6, '선물'); Sim.say(o, sty(o, '나한테? 고마워!')); } });
      return { text: sty(v, c.line), close: true };
    }
    if (key === 'sorryTo') return startReconcile(v, o, true);
    if (key === 'confessTo') {
      if (!Soc.canRomance(v.id, o.id)) return { text: sty(v, `${o.name}? 그런 사이 아니야!`) };
      const rom = Soc.F(v.id, o.id).romance;
      if (rom < 30) return { text: sty(v, `에?! 난 ${o.name} 그런 감정 아닌데...? (설렘 ${Math.round(rom)}/30)`) };
      Soc.runConfession(v, o, pick(D.CONFESS_SPOTS).id, { force: true });
      return { text: sty(v, c.line), close: true };
    }
    return { text: '...' };
  }
  function cmdMenu(v, key) {
    const c = CMDS[key];
    if (c.kind === 'social') return { text: sty(v, '누구한테?'), options: others(v).filter(o => o.loc === v.loc || o.loc === 'island').slice(0, 10).map(o => ({ id: 'cmdTo', label: `${o.name} (${Soc.stageName(rel(v.id, o.id).friendship_stage)})`, arg: key + '|' + o.id })).concat([{ id: 'cmdList', label: '↩️ 돌아가기' }]) };
    return tryCmd(v, key, null);
  }
  function tryCmd(v, key, target, bonus = 0) {
    const p = clamp(compliance(v, key) + bonus, 0, 0.98);
    if (chance(p)) return execCmd(v, key, target);
    const m = mind(v);
    m.pending = { intent: 'refuse', data: { key, target, tries: (m.pending && m.pending.intent === 'refuse' && m.pending.data.key === key ? m.pending.data.tries + 1 : 1) } };
    const food = Object.keys(pl().inv).find(id => D.ITEMS[id] && D.ITEMS[id].stamina && pl().inv[id] > 0);
    const opts = [{ id: 'cmdBeg', label: '🥺 "제발~ 한 번만!"' }];
    if (food) opts.push({ id: 'cmdBribe', label: `🍪 "${D.ITEMS[food].name} 줄게!" (조건 걸기)`, arg: food });
    opts.push({ id: 'cmdList', label: '🙂 "알았어, 다른 거 하자"' }, { id: 'bye', label: '👋 잘 가' });
    return { text: T(v, REFUSE) + ` (들어줄 확률 ${Math.round(p * 100)}%)`, options: opts };
  }

  // ---------------------------------------------------------
  // 관계 유도 (주민 A ↔ 주민 B)
  // ---------------------------------------------------------
  const BONDS = {
    BESTIE: '👯 절친', RIVAL: '🏆 라이벌', RIVAL_FRIEND: '🔥 선의의 라이벌', NEMESIS: '⚡ 앙숙', MENTOR: '🎓 스승과 제자', SIBLING: '👫 의남매', HOBBY: '🎣 취미 메이트', BUDDY: '🤜🤛 단짝', SECRET: '🤫 비밀 친구', CRUSH: '💘 썸',
  };
  W.BONDS = BONDS;
  function setBond(a, b, kind, quiet) {
    const r = rel(a, b); if (r.bond === kind) return;
    r.bond = kind; r.bondDay = day();
    if (!quiet) Sim.log('rel', `${BONDS[kind] || kind} — ${nm(a)} ↔ ${nm(b)}`, [a, b], 1);
  }
  W.setBond = setBond;
  function bondOf(v, kind) { const o = others(v).find(o => rel(v.id, o.id).bond === kind); return o ? o.id : null; }
  const sameHobby = (a, b) => a.keys.L4 === b.keys.L4;
  function introChoices(v, mode) {
    return others(v).sort((a, b) => fp(v.id, a.id) - fp(v.id, b.id)).slice(0, 10).map(o => ({ id: 'indDo', label: `${o.name} (${Soc.stageName(rel(v.id, o.id).friendship_stage)}${rel(v.id, o.id).bond ? ' · ' + BONDS[rel(v.id, o.id).bond] : ''})`, arg: mode + '|' + o.id }));
  }
  const IND = [
    ['introduce', '🤝 친해지게 소개하기'], ['matchmake', '💞 소개팅 주선 (데이트 약속 잡기)'], ['praise', '💬 "○○가 너 칭찬하더라" 전하기'], ['badmouth', '😈 "○○가 네 험담하더라" 이간질'],
    ['reconcile', '🕊️ 화해 주선하기'], ['bestie', '👯 절친 맺어주기'], ['rival', '🔥 선의의 라이벌 만들기'], ['mentor', '🎓 스승·제자 맺어주기'], ['sibling', '👫 의남매 맺어주기'],
    ['breakup', '💔 "그 사람이랑은 헤어지는 게 좋겠어"'], ['marry', '💍 "이제 결혼해!" 부추기기'],
  ];
  function indMenu(v) { return { text: sty(v, '응? 누구 얘기?'), options: IND.map(([k, l]) => ({ id: 'indPick', label: l, arg: k })).concat([{ id: 'menu', label: '↩️ 돌아가기' }]) }; }
  function indDo(v, mode, oid) {
    const o = byId(oid); if (!o) return { text: '...' };
    const r = rel(v.id, o.id), f = r.friendship_point;
    const trust = rel(v.id, P).trust_level;
    const believe = chance(0.35 + trust / 150);
    switch (mode) {
      case 'introduce': {
        Sim.scene({ title: '소개', actors: { A: v }, steps: [{ go: 'A', to: { actor: o.id, near: 1.2 }, max: 80 }, { face: 'A', at: o.id }, { say: 'A', text: sty(v, `안녕 ${o.name}! ${pl().name}가 우리 잘 맞을 거래!`), t: 2.5 }], onEnd: () => { Soc.startChat(v, o); Soc.addFriend(v.id, o.id, 10, 5, '플레이어의 소개'); } });
        remember(v, 'intro', `${o.name}를 소개해 줬어`);
        return { text: sty(v, `${o.name}? 좋아, 가서 인사해 볼게!`), close: true };
      }
      case 'matchmake': {
        if (!Soc.canRomance(v.id, o.id)) return { text: sty(v, `${o.name}랑? 에이, 우린 그런 사이 될 수 없어`) };
        if (Soc.partnerOf(v.id) && Soc.partnerOf(v.id) !== o.id) return { text: sty(v, `나 ${nm(Soc.partnerOf(v.id))}가 있잖아!`) };
        return setupDate(v, o);
      }
      case 'praise': {
        Soc.addFriend(v.id, o.id, believe ? 7 : 2, 3); if (believe && Soc.canRomance(v.id, o.id)) Soc.addRomance(v.id, o.id, 5);
        return { text: believe ? sty(v, `${o.name}가? 헤헤... 기분 좋다. 나도 ${o.name} 좋아해!`) : sty(v, '...진짜? 입에 발린 말 같은데') };
      }
      case 'badmouth': {
        if (!believe) { Soc.addFriend(v.id, P, -4, -8); return { text: sty(v, `${o.name}가 그럴 리 없어. ...너 왜 그런 말을 해?`) }; }
        Soc.addFriend(v.id, o.id, -12, -10); r.misunderstanding = { by: o.id, until: day() + 3, cause: '플레이어의 이간질' };
        if (r.friendship_point < 20) setBond(v.id, o.id, 'NEMESIS');
        if (chance(0.3)) { Soc.addFriend(o.id, P, -10, -20); Sim.log('rel', `🗣️ ${o.name}이(가) ${pl().name}이(가) 자기 험담을 퍼뜨렸다는 걸 알게 됐어요...`, [o.id, P], 2); }
        return { text: T(v, { rough: ['뭐?! {o} 이 녀석...!'], soft: ['{o}가 그런 말을...? 믿었는데...'], any: ['{o}가 나를...? 충격이야'] }, { o: o.name }) };
      }
      case 'reconcile': return startReconcile(v, o);
      case 'bestie': {
        if (f < 45) return { text: sty(v, `${o.name}랑? 아직 그렇게 친하진 않은데... (친밀도 ${Math.round(f)}/45)`) };
        Soc.addFriend(v.id, o.id, 20, 15, '절친 맺기'); setBond(v.id, o.id, 'BESTIE');
        Sim.scene({ title: '절친 맺기', actors: { A: v }, steps: [{ go: 'A', to: { actor: o.id, near: 1.1 }, max: 80 }, { face: 'A', at: o.id }, { say: 'A', text: sty(v, `${o.name}! 우리 오늘부터 절친이다!`), t: 2.5 }, { pose: 'A', p: 'cheer', t: 2 }, { emote: 'A', e: '✨' }] });
        return { text: sty(v, '맞아! 걔랑 절친하고 싶었어!'), close: true };
      }
      case 'rival': { Soc.addFriend(v.id, o.id, 4, 2); setBond(v.id, o.id, 'RIVAL'); r.friend_archetype = 'RIVAL_FRIEND'; return { text: T(v, { loud: ['{o}랑 승부?! 좋아, 불타오른다!'], rough: ['{o}? 상대도 안 되지만 붙어주지'], any: ['{o}랑 경쟁... 재밌겠다!'] }, { o: o.name }) }; }
      case 'mentor': { const teacher = (has(v, 'SCHOLARLY') || has(v, 'DILIGENT')) ? v : o; Soc.addFriend(v.id, o.id, 8, 8); setBond(v.id, o.id, 'MENTOR'); r.friend_archetype = 'MENTOR'; return { text: teacher === v ? sty(v, `${o.name}한테 내가 아는 걸 다 알려줄게!`) : sty(v, `${o.name}한테 배우면 나도 성장할 수 있겠지?`) }; }
      case 'sibling': { if (f < 35) return { text: sty(v, `${o.name}랑 의남매...? 아직 어색한데 (친밀도 ${Math.round(f)}/35)`) }; Soc.addFriend(v.id, o.id, 12, 12); setBond(v.id, o.id, 'SIBLING'); return { text: sty(v, `${o.name}가 오늘부터 내 가족이야!`) }; }
      case 'breakup': {
        const pt = Soc.partnerOf(v.id); if (!pt || pt === P) return { text: sty(v, '나 지금 사귀는 사람 없는데?') };
        const pr = rel(v.id, pt); Soc.addBoredom && Soc.addBoredom(pr, 35, '플레이어의 말');
        return { text: pr.boredom > 60 ? sty(v, `...사실 요즘 ${nm(pt)}랑 잘 안 맞긴 했어. 생각해 볼게`) : sty(v, `무슨 소리야! 난 ${nm(pt)} 좋아!`) };
      }
      case 'marry': {
        const pt = Soc.partnerOf(v.id); if (!pt || pt === P) return { text: sty(v, '결혼할 사람이 있어야 결혼을 하지...') };
        const pr = rel(v.id, pt); if (pr.status === 'MARRIED') return { text: sty(v, '우리 이미 결혼했잖아 ㅋㅋ') };
        Soc.addRomance(v.id, pt, 10, '결혼 부추김'); v.confidence = clamp((v.confidence || 0) + 20, 0, 100);
        if (Soc.marriageReady && Soc.marriageReady(v.id, pt)) { FM.Ev && FM.Ev.proposal ? FM.Ev.proposal(v, byId(pt)) : Soc.engage(v.id, pt); return { text: sty(v, '그래! 오늘 청혼할래!'), close: true }; }
        return { text: sty(v, `결혼...! 아직 좀 이르지만, ${nm(pt)}랑 더 가까워지면...!`) };
      }
    }
    return { text: '...' };
  }
  function startReconcile(v, o, fromCmd) {
    const r = rel(v.id, o.id);
    const will = fromCmd || chance(0.45 + rel(v.id, P).trust_level / 160);
    if (!will) return { text: T(v, { rough: ['싫어. {o}가 먼저 사과해야지'], soft: ['아직은... 마음의 준비가 안 됐어'], any: ['조금만 더 시간을 줘'] }, { o: o.name }) };
    Sim.scene({ title: '화해', actors: { A: v, B: o }, steps: [
      { par: [{ go: 'A', to: { place: 'plaza', dx: -1 } }, { go: 'B', to: { place: 'plaza', dx: 1 } }] }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
      { say: 'A', text: sty(v, `${o.name}... 그동안 미안했어`), t: 2.6 }, { say: 'B', text: sty(o, '...나도 미안해'), t: 2.2 }, { par: [{ pose: 'A', p: 'hug', t: 2 }, { pose: 'B', p: 'hug', t: 2 }] }, { fx: 'hearts', at: 'A' },
    ], onEnd: () => { r.misunderstanding = null; Soc.addFriend(v.id, o.id, 15, 12, '화해'); if (r.bond === 'NEMESIS') r.bond = null; Sim.log('rel', `🕊️ ${v.name}와(과) ${o.name}이(가) 화해했어요`, [v.id, o.id], 2); remember(v, 'reconcile', `${o.name}랑 화해했어`); } });
    return { text: sty(v, `...알았어. ${o.name}한테 가볼게`), close: true };
  }
  // 데이트 약속 (주민 ↔ 주민)
  function setupDate(v, o) {
    const place = pick(['cafe', 'beach', 'observatory', 'park']);
    const st = S(); st.npcDates = st.npcDates || [];
    let at = (day() - 1) * 1440 + 18 * 60; if (st.time > at - 30) at = st.time + 90;
    st.npcDates.push({ a: v.id, b: o.id, at, place });
    Soc.addRomance(v.id, o.id, 5, '데이트 약속');
    return { text: sty(v, `${o.name}랑 둘이서...?! ${Math.floor((at % 1440) / 60)}시에 ${{ cafe: '카페', beach: '해변', observatory: '천문대', park: '공원' }[place]}... 떨린다!`), close: true };
  }

  // ---------------------------------------------------------
  // 약속 (플레이어 ↔ 주민) — 지키면 큰 보상, 어기면 기억해서 따짐
  // ---------------------------------------------------------
  function makePact(v, place, h, kind, title) {
    const st = S(); st.pacts = st.pacts || [];
    let at = (day() - 1) * 1440 + h * 60; if (at < st.time + 20) at += 1440;
    st.pacts.push({ v: v.id, place, at, kind, until: at + 120, arrived: false });
    Soc.addQuest({ type: 'pact', title: `🤙 ${title}`, giver: v.id, target: v.id, desc: `${Math.floor((at % 1440) / 60)}시에 ${FM.MAP.P[place] ? FM.MAP.P[place].name : place}(으)로 가세요. ${v.name}이(가) 기다려요.`, deadline: at + 120 });
    return { text: sty(v, `약속했다! ${Math.floor((at % 1440) / 60)}시야, 늦지 마!`), close: true };
  }
  function dateMenu(v) {
    return { text: sty(v, '어디 갈까?'), options: [['cafe', '☕ 카페에서 달달한 디저트'], ['beach', '🌅 해변에서 노을 보기'], ['observatory', '🔭 천문대에서 별 보기'], ['park', '🧺 공원 소풍'], ['arcade', '🎮 오락실 데이트']].map(([k, l]) => ({ id: 'dateAt', label: l, arg: k })).concat([{ id: 'menu', label: '↩️ 돌아가기' }]) };
  }
  function pactTick() {
    const st = S(); if (!st.pacts || !st.pacts.length) return;
    const p = pl();
    for (const pc of st.pacts.slice()) {
      const v = byId(pc.v); if (!v) { st.pacts.splice(st.pacts.indexOf(pc), 1); continue; }
      const P0 = FM.MAP.P[pc.place]; if (!P0) { st.pacts.splice(st.pacts.indexOf(pc), 1); continue; }
      // 약속 시간 20분 전: 장소로 출발
      if (!pc.went && st.time >= pc.at - 20 && !v.sceneId && !v.talkingToPlayer) {
        pc.went = true;
        Sim.scene({ title: '약속 장소로', actors: { A: v }, steps: [{ go: 'A', to: { place: pc.place }, max: 150 }, { pose: 'A', p: 'look', t: 90 }] });
      }
      const near = p.loc === 'island' && Math.hypot(p.x - P0.x, p.z - P0.z) < 14 && st.time >= pc.at - 30 && st.time <= pc.until;
      if (near && !pc.arrived) {
        pc.arrived = true;
        const q = st.quests.find(q => q.type === 'pact' && q.giver === v.id && q.state === 'active'); if (q) Soc.finishQuest(q, true, `${v.name}과(와)의 약속을 지켰어요! 친밀도·신뢰도 크게 상승`);
        const isDate = pc.kind === 'date';
        Soc.addFriend(v.id, P, isDate ? 8 : 10, 12, '약속 지킴');
        if (isDate) { Soc.addRomance(v.id, P, 12, '데이트'); const r = rel(v.id, P); r.lastDate = day(); r.dates = (r.dates || 0) + 1; Soc.addBoredom && Soc.addBoredom(r, -25, '데이트'); }
        remember(v, isDate ? 'date' : 'promise', isDate ? `${P0.name}에서 데이트했어` : `${P0.name}에서 만나기로 한 약속을 지켜줬어`);
        if (v.sceneId) { const sc = Sim.scenes.find(s => s.id === v.sceneId); if (sc) Sim.endScene(sc, true); }
        Sim.scene({ title: isDate ? '데이트' : '약속', actors: { A: v }, steps: [{ go: 'A', to: { x: p.x + 1, z: p.z + 1, loc: 'island' }, max: 15 }, { face: 'A', at: P }, { say: 'A', text: isDate ? sty(v, '와줬구나! 오늘 너무 설레') : sty(v, '진짜 왔네! 기다렸어!'), t: 3 }, { emote: 'A', e: isDate ? '💕' : '😆' }, isDate ? { fx: 'hearts', at: 'A' } : { wait: 0.3 }] });
        st.pacts.splice(st.pacts.indexOf(pc), 1);
        continue;
      }
      if (st.time > pc.until) {
        st.pacts.splice(st.pacts.indexOf(pc), 1);
        const q = st.quests.find(q => q.type === 'pact' && q.giver === v.id && q.state === 'active'); if (q) Soc.finishQuest(q, false, `${v.name}이(가) 기다리다 돌아갔어요...`);
        Soc.addFriend(v.id, P, -6, -10, '약속 어김');
        remember(v, 'broken', `${P0.name}에서 기다렸는데 안 왔어`);
        Sim.log('rel', `⌛ ${v.name}이(가) ${P0.name}에서 ${p.name}을(를) 기다리다 돌아갔어요...`, [v.id, P], 1);
      }
    }
    // 주민끼리 데이트 약속
    for (const dt of (st.npcDates || []).slice()) {
      if (st.time < dt.at) continue;
      st.npcDates.splice(st.npcDates.indexOf(dt), 1);
      const a = byId(dt.a), b = byId(dt.b); if (!a || !b) continue;
      const P0 = FM.MAP.P[dt.place];
      const match = Soc.tasteMatch(a, b) || Soc.tasteMatch(b, a);
      Sim.scene({ title: '소개팅', actors: { A: a, B: b }, force: true, steps: [
        { par: [{ go: 'A', to: { place: dt.place, dx: -0.7 } }, { go: 'B', to: { place: dt.place, dx: 0.7 } }] }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
        { say: 'A', text: sty(a, '아, 안녕... 와줘서 고마워'), t: 2.5 }, { say: 'B', text: match ? sty(b, '나도 기대했어!') : sty(b, '응... 안녕'), t: 2.2 },
        { par: [{ pose: 'A', p: 'talk', t: 4 }, { pose: 'B', p: 'talk', t: 4 }] }, { emote: 'A', e: match ? '💗' : '😅' }, { emote: 'B', e: match ? '💗' : '😐' },
      ], onEnd: () => {
        Soc.addFriend(a.id, b.id, 8, 4, '소개팅');
        Soc.addRomance(a.id, b.id, match ? rnd(15, 30) : rnd(4, 10), '소개팅'); Soc.addRomance(b.id, a.id, match ? rnd(12, 25) : rnd(2, 8), '소개팅');
        if (match) setBond(a.id, b.id, 'CRUSH');
        Sim.log('rel', `☕ ${a.name}와(과) ${b.name}의 소개팅 (${P0 ? P0.name : ''}) — ${match ? '분위기 최고! 💘' : '조금 어색했어요 😅'}`, [a.id, b.id], 2);
      } });
    }
  }

  // ---------------------------------------------------------
  // 플레이어 연애
  // ---------------------------------------------------------
  function flirtMenu(v) {
    const lines = ['💗 "오늘 유난히 멋있다/예쁘다"', '💗 "너랑 있으면 시간이 빨리 가"', '💗 "너 웃는 거 좋아"', '💗 "다음에 둘이서만 놀러 갈래?"'];
    return { text: sty(v, '...응?'), options: lines.map((l, i) => ({ id: 'flirtDo', label: l, arg: String(i) })).concat([{ id: 'menu', label: '↩️ 돌아가기' }]) };
  }
  function flirtDo(v, i) {
    const m = mind(v); if (m.flirt.day !== day()) m.flirt = { day: day(), n: 0 };
    m.flirt.n++;
    const rom = Soc.F(v.id, P).romance, ok = Soc.stageAtLeast(v.id, P, 'FRIEND');
    if (!Soc.canRomance(v.id, P)) return { text: sty(v, '에이, 장난치지 마 ㅋㅋ') };
    if (m.flirt.n > 3) { Soc.addFriend(v.id, P, -2, -1); return { text: sty(v, '...오늘 좀 이상하다? 너무 들이대는 거 아냐?') }; }
    if (!ok) { Soc.addFriend(v.id, P, -1, 0); return { text: sty(v, '어...? 우리 아직 그렇게 친하진 않잖아...') }; }
    Soc.addRomance(v.id, P, rnd(4, 9) * (+i === 3 ? 1.3 : 1), '설레는 말');
    if (+i === 3 && rom >= 30) return makePact(v, pick(['cafe', 'beach', 'observatory']), 19, 'date', `${v.name}와(과) 둘만의 약속`);
    Sim.emote(v, rom > 50 ? '💗' : '😳');
    return { text: rom > 60 ? T(v, { soft: ['...그런 말 하면 나 진짜 설렌단 말이야'], loud: ['너 그거 반칙이야!!! 심장 터질 뻔했잖아!'], rough: ['...바보. (얼굴이 새빨개졌다)'], any: ['헤헤... 나도 너랑 있는 거 좋아'] }) : rom > 30 ? T(v, { any: ['...에? 갑자기? (볼이 붉어졌다)', '뭐, 뭐야... 칭찬해 줘서 고마워'] }) : T(v, { any: ['어... 고마워? ㅎㅎ', '갑자기 왜 그래~ 웃기다'] }) };
  }
  function confessDirect(v) {
    const m = mind(v), p = pl(), r = rel(v.id, P);
    if (!Soc.canRomance(v.id, P)) return { text: sty(v, '미안... 우린 그럴 수 없어') };
    if (Soc.partnerOf(v.id) && Soc.partnerOf(v.id) !== P) return { text: sty(v, `...나 ${nm(Soc.partnerOf(v.id))}랑 사귀고 있어. 미안해`) };
    if (m.confessCd > day()) return { text: sty(v, '...아직 생각 중이야. 조금만 기다려 줘') };
    const aff = Soc.affection(v.id, P), rom = Soc.F(v.id, P).romance;
    if (aff >= 60 && rom >= 50) {
      r.status = 'DATING'; r.since = day(); r.lastDate = day(); p.lover = v.id; Soc.endCrush(v);
      Sim.fx('hearts', v); remember(v, 'date', '네가 먼저 고백해 줬어');
      Sim.log('couple', `💕 ${p.name}이(가) ${v.name}에게 고백해서 연인이 되었어요!`, [P, v.id], 3, { newsKind: 'couple' });
      return { text: T(v, { soft: ['...나도 계속 좋아하고 있었어. 잘 부탁해'], loud: ['진짜?!?! 나도야!!! 오늘 최고의 날이다!'], rough: ['...늦었잖아, 바보. 나도 좋아'], nervous: ['나, 나를...? 꿈 아니지? ...좋아!'], posh: ['영광입니다. 저 역시 같은 마음이었습니다'], any: ['나도 좋아해!'] }) + ' 💕', options: [{ id: 'petname', label: '💕 애칭 정하기' }, { id: 'bye', label: '👋 (설레는 마음으로 헤어지기)' }] };
    }
    m.confessCd = day() + 2;
    Soc.addRomance(v.id, P, 6, '고백받음');
    const why = aff < 60 ? `아직 너를 잘 모르겠어 (호감 ${Math.round(aff)}/60)` : `설레는 마음이 아직... (설렘 ${Math.round(rom)}/50)`;
    return { text: T(v, { soft: ['고마워... 근데 {w}'], rough: ['...갑자기 뭐래. {w}'], loud: ['어?! 어어... 너무 갑작스러워! {w}'], any: ['마음은 고마워. 하지만 {w}'] }, { w: why }) };
  }
  function babyTalk(v) {
    const m = Soc.marriageOf(v.id);
    const r = rel(v.id, P);
    if (!(m && m.marriage_stage === 'MARRIED') && r.status !== 'MARRIED') return { text: sty(v, '아기는... 결혼하고 나서 생각하자!') };
    Soc.makeChild(P, v.id);
    Sim.fx('hearts', v); remember(v, 'baby', '우리 아기가 생겼어');
    return { text: sty(v, '우리 아기...! 잘 키워보자, 우리 둘이서') , close: true };
  }

  // ---------------------------------------------------------
  // 근황 · 관계 이야기 (누구랑 친한지 스스로 말함)
  // ---------------------------------------------------------
  function news(v) {
    const rs = others(v).map(o => ({ o, r: rel(v.id, o.id), f: fp(v.id, o.id), rom: Soc.F(v.id, o.id).romance }));
    const best = rs.slice().sort((a, b) => b.f - a.f)[0], worst = rs.slice().sort((a, b) => a.f - b.f)[0];
    const bonds = rs.filter(x => x.r.bond).map(x => `${x.o.name}(${BONDS[x.r.bond]})`);
    const trust = rel(v.id, P).trust_level;
    const crush = rs.filter(x => x.rom >= 40).sort((a, b) => b.rom - a.rom)[0];
    const pt = Soc.partnerOf(v.id);
    let t = best ? `요즘 제일 친한 건 ${best.o.name}야. ` : '';
    if (bonds.length) t += `${bonds.slice(0, 3).join(', ')}... 뭐 그런 사이지. `;
    if (worst && worst.f < 20) t += `${worst.o.name}랑은 좀 불편하고. `;
    if (pt) t += pt === P ? '그리고... 나한텐 네가 있잖아. ' : `아, 그리고 나 ${nm(pt)}랑 사귀어! `;
    else if (crush && trust >= 45) t += `...너한테만 말하는데 ${crush.o.name}가 자꾸 신경 쓰여. `;
    const opts = [];
    if (worst && worst.f < 30) opts.push({ id: 'indDo', label: `🕊️ "${worst.o.name}랑 화해해 봐"`, arg: 'reconcile|' + worst.o.id });
    if (crush && !pt) opts.push({ id: 'indDo', label: `💞 "${crush.o.name}랑 데이트 잡아줄게"`, arg: 'matchmake|' + crush.o.id });
    if (best && !best.r.bond && best.f >= 45) opts.push({ id: 'indDo', label: `👯 "${best.o.name}랑 절친 해!"`, arg: 'bestie|' + best.o.id });
    return { text: sty(v, t || '음... 요즘 그냥 그래'), options: opts.concat([{ id: 'wMore', label: '💬 다른 얘기 하자' }, { id: 'menu', label: '📋 다른 행동 하기…' }]) };
  }

  // ---------------------------------------------------------
  // 원래 대화 시스템과 연결
  // ---------------------------------------------------------
  const origTalk = Soc.playerTalk, origOpts = Soc.talkOptions, origChoose = Soc.playerChoose;
  // 대화 시작: 특별 풍선/수면/입원이 아니면 주민이 스스로 화제를 꺼냄
  Soc.playerTalk = function (v) {
    const base = origTalk(v);
    if (v.child || v.balloon || v.status.hospital || (v.act && v.act.id === 'sleep') || (Sim.asleep && Sim.asleep(v, hour()) && v.loc === v.home) || !base.options.length) return base;
    const r = rel(v.id, P);
    if (r.greetDay !== day()) { r.greetDay = day(); pl().lastTalk[v.id] = day(); Soc.addFriend(v.id, P, D.FRIEND_TRIGGERS.greet.fp, D.FRIEND_TRIGGERS.greet.trust, '인사'); }
    const t = runIntent(v, chooseIntent(v));
    return { text: `${base.text} ${t.text}`, options: t.options };
  };
  Soc.talkOptions = function (v) {
    const O = origOpts(v);
    if (v.child || v.balloon) return O;
    const out = O.filter(o => o.id !== 'bye');
    const c = ctx(v);
    const extra = [{ id: 'news', label: '🗂️ "요즘 어때?" (근황·관계 듣기)' }, { id: 'cmdList', label: '📣 부탁하기 (행동 시키기)' }, { id: 'indList', label: '🤝 다른 주민과 관계 만들어주기' }];
    if (Soc.canRomance(v.id, P) && c.lover !== P) {
      extra.push({ id: 'flirt', label: '💗 설레는 말 하기' });
      if (c.ge('FRIEND') && !(c.lover && c.lover !== P)) extra.push({ id: 'confessD', label: '💌 고백하기' });
    }
    if (c.lover === P) extra.push({ id: 'dateMenu', label: '💑 데이트 신청 (장소 약속)' });
    const m = Soc.marriageOf(v.id);
    if (c.lover === P && ((m && m.marriage_stage === 'MARRIED') || c.r.status === 'MARRIED')) extra.push({ id: 'babyAsk', label: '👶 "우리 아기 갖자"' });
    return extra.concat(out, [{ id: 'bye', label: '👋 잘 가' }]);
  };
  Soc.playerChoose = function (v, id, arg) {
    Sim.talkChoosing = true;
    try {
      v.talkUntil = S().realT + 120;
      const r = choose(v, id, arg);
      if (r) return r;
    } finally { Sim.talkChoosing = false; }
    if (id === 'bye' && v.sceneId) { v.talkingToPlayer = false; return { text: sty(v, '또 봐!'), close: true, options: [] }; }
    return origChoose(v, id, arg);
  };
  const fin = (v, o) => {
    if (!o) return null;
    if (o.redirect) return origChoose(v, o.redirect);
    if (o.close) return { text: o.text, close: true, options: [] };
    if (o.options) return o;
    if (o.choices) { const m = mind(v); if (!o.keep) m.pending = { intent: m.pending.intent, data: m.pending.data }; return { text: o.text, options: o.choices.map(ch => ch.id ? ch : ({ id: 'w', label: ch.label, arg: ch.k })).concat(tail(v)) }; }
    return { text: o.text, options: [{ id: 'wMore', label: '💬 그리고 또?' }, { id: 'menu', label: '📋 다른 행동 하기…' }, { id: 'bye', label: '👋 잘 가' }] };
  };
  function choose(v, id, arg) {
    const m = mind(v);
    switch (id) {
      case 'chat': case 'wMore': return runIntent(v, chooseIntent(v));
      case 'w': { const pd = m.pending; if (!pd || !I[pd.intent]) return runIntent(v, chooseIntent(v)); return fin(v, I[pd.intent].on(v, arg, pd.data)); }
      case 'menu': return { text: sty(v, '응, 뭐 할까?'), options: Soc.talkOptions(v) };
      case 'news': return news(v);
      case 'cmdList': return { text: sty(v, '나한테 뭐 시키려고?'), options: cmdChoices(v) };
      case 'cmd': return fin(v, cmdMenu(v, arg));
      case 'cmdTo': { const [k, o] = arg.split('|'); return fin(v, tryCmd(v, k, o)); }
      case 'cmdBeg': { const d = m.pending && m.pending.data; if (!d) return null; Soc.addFriend(v.id, P, -0.5, 0); return fin(v, tryCmd(v, d.key, d.target, d.tries > 2 ? -0.1 : 0.2)); }
      case 'cmdBribe': { const d = m.pending && m.pending.data; if (!d) return null; Soc.takeItem(arg); v.hunger = Math.max(0, (v.hunger || 0) - 30); return fin(v, tryCmd(v, d.key, d.target, 0.45)); }
      case 'indList': return indMenu(v);
      case 'indPick': return { text: sty(v, '누구?'), options: introChoices(v, arg).concat([{ id: 'indList', label: '↩️ 돌아가기' }]) };
      case 'indDo': { const [mode, o] = arg.split('|'); return fin(v, indDo(v, mode, o)); }
      case 'flirt': return flirtMenu(v);
      case 'flirtDo': return fin(v, flirtDo(v, arg));
      case 'confessD': return fin(v, confessDirect(v));
      case 'dateMenu': return dateMenu(v);
      case 'dateAt': return fin(v, makePact(v, arg, Math.min(23, Math.max(hour() + 2, 18)), 'date', `${v.name}와(과) 데이트`));
      case 'babyAsk': return fin(v, babyTalk(v));
    }
    return null;
  }

  // 선물은 기억에 남음
  const origGift = Soc.playerGift;
  Soc.playerGift = function (v, itemId) {
    const r = origGift(v, itemId);
    if (itemId && D.ITEMS[itemId]) remember(v, 'gift', `${D.ITEMS[itemId].name}을(를) 선물해 줬어`, { item: itemId });
    return r;
  };

  // ---------------------------------------------------------
  // 주민끼리 관계 이벤트 — 더 빠르고 다양하게
  // ---------------------------------------------------------
  let evT = 0;
  const EVENTS = [
    { id: 'help', w: () => 3, run: (a, b) => { Soc.addFriend(a.id, b.id, 6, 5); return `🤲 ${a.name}이(가) ${b.name}의 짐을 들어줬어요`; } },
    { id: 'hobby', w: (a, b) => sameHobby(a, b) ? 5 : 0, run: (a, b) => { Soc.addFriend(a.id, b.id, 9, 4); if (fp(a.id, b.id) > 50) setBond(a.id, b.id, 'HOBBY', true); return `🎣 ${a.name}와(과) ${b.name}이(가) 같은 취미로 신나게 떠들었어요`; } },
    { id: 'argue', w: (a, b) => (has(a, 'CRANKY') || has(b, 'CRANKY') || has(a, 'CYNICAL') ? 2.5 : 0.8), run: (a, b) => { Soc.addFriend(a.id, b.id, -8, -5); const r = rel(a.id, b.id); if (r.friendship_point < 15) setBond(a.id, b.id, 'NEMESIS'); Sim.emote(a, '💢'); Sim.emote(b, '😤'); return `💢 ${a.name}와(과) ${b.name}이(가) 사소한 일로 말다툼했어요`; } },
    { id: 'compliment', w: () => 2.5, run: (a, b) => { Soc.addFriend(a.id, b.id, 5, 2); if (Soc.canRomance(b.id, a.id)) Soc.addRomance(b.id, a.id, rnd(2, 6)); Sim.emote(b, '😊'); return `💐 ${a.name}이(가) ${b.name}의 옷차림을 칭찬했어요`; } },
    { id: 'prank', w: a => has(a, 'PRANKSTER') ? 4 : 0, run: (a, b) => { const ok = has(b, 'PRANKSTER') || has(b, 'EXTROVERT') || chance(0.5); Soc.addFriend(a.id, b.id, ok ? 5 : -6, ok ? 2 : -4); Sim.emote(b, ok ? '😂' : '💢'); return ok ? `🤪 ${a.name}의 장난에 ${b.name}이(가) 배꼽 잡고 웃었어요` : `😠 ${a.name}의 장난에 ${b.name}이(가) 화났어요`; } },
    { id: 'race', w: (a, b) => (has(a, 'ATHLETIC') || has(a, 'PASSIONATE')) && (has(b, 'ATHLETIC') || has(b, 'PASSIONATE')) ? 4 : 0, run: (a, b) => { Soc.addFriend(a.id, b.id, 4, 2); setBond(a.id, b.id, 'RIVAL', true); return `🏃 ${a.name}와(과) ${b.name}이(가) 즉석 달리기 시합을 했어요 (라이벌!)`; } },
    { id: 'teach', w: (a, b) => (has(a, 'SCHOLARLY') && (has(b, 'CURIOUS') || has(b, 'ANXIOUS'))) ? 4 : 0, run: (a, b) => { Soc.addFriend(a.id, b.id, 7, 7); setBond(a.id, b.id, 'MENTOR', true); return `🎓 ${a.name}이(가) ${b.name}에게 이것저것 가르쳐 줬어요`; } },
    { id: 'confide', w: (a, b) => fp(a.id, b.id) > 45 ? 3 : 0, run: (a, b) => { Soc.addFriend(a.id, b.id, 5, 9); if (fp(a.id, b.id) > 70 && chance(0.3)) setBond(a.id, b.id, 'SECRET', true); return `🤫 ${a.name}이(가) ${b.name}에게 고민을 털어놓았어요`; } },
    { id: 'spark', w: (a, b) => Soc.canRomance(a.id, b.id) && !Soc.partnerOf(a.id) && !Soc.partnerOf(b.id) ? (Soc.tasteMatch(a, b) ? 4 : 1.5) : 0, run: (a, b) => { Soc.addRomance(a.id, b.id, rnd(5, 12), '눈 마주침'); Soc.addRomance(b.id, a.id, rnd(3, 9)); Sim.emote(a, '💗'); return `💗 ${a.name}와(과) ${b.name}의 눈이 마주쳤어요... 어색한 미소`; } },
    { id: 'share', w: (a) => (has(a, 'WARM') || has(a, 'FOOD')) ? 3 : 1, run: (a, b) => { Soc.addFriend(a.id, b.id, 6, 3); b.hunger = Math.max(0, (b.hunger || 0) - 20); return `🍪 ${a.name}이(가) ${b.name}에게 간식을 나눠줬어요`; } },
    { id: 'jealous', w: (a, b) => { const pa = Soc.partnerOf(a.id); return pa && pa !== b.id && pa !== P && Soc.F(b.id, pa).romance > 40 ? 3 : 0; }, run: (a, b) => { Soc.addFriend(a.id, b.id, -6, -6); Sim.emote(a, '😤'); return `😤 ${a.name}이(가) 자기 애인 곁을 맴도는 ${b.name}을(를) 경계하고 있어요`; } },
  ];
  function relTick(dMin) {
    evT += dMin; if (evT < rnd(30, 60)) return; evT = 0;
    const vs = alive().filter(v => !v.sceneId && !v.talkingToPlayer && v.loc !== 'metro');
    const pairs = [];
    for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) { const a = vs[i], b = vs[j]; if (a.loc === b.loc && (a.loc !== 'island' || Math.hypot(a.x - b.x, a.z - b.z) < 35)) pairs.push([a, b]); }
    if (!pairs.length) return;
    for (let n = 0; n < Math.min(2, pairs.length); n++) {
      const [x, y] = pick(pairs); const [a, b] = chance(0.5) ? [x, y] : [y, x];
      const cands = EVENTS.map(e => [e, e.w(a, b) || 0]).filter(e => e[1] > 0);
      const tot = cands.reduce((s, e) => s + e[1], 0); let r = Math.random() * tot, ev = cands[0][0];
      for (const [e, w] of cands) { if ((r -= w) < 0) { ev = e; break; } }
      const text = ev.run(a, b);
      if (text) Sim.log(ev.id === 'spark' ? 'crush' : 'rel', text, [a.id, b.id], ev.id === 'argue' || ev.id === 'spark' ? 1 : 0);
    }
  }
  // 대화 한 번의 친밀도도 조금 더 (기존 +2 → +4 수준)
  FM.bus.on('sceneEnd', sc => {
    if (sc.title !== 'TALK_NPC') return;
    const a = sc.actors.A, b = sc.actors.B; if (!a || !b) return;
    Soc.addFriend(a.id, b.id, 2, 1);
  });
  const origTick = Soc.tick;
  Soc.tick = function (dtR, dMin) { origTick(dtR, dMin); try { pactTick(); relTick(dMin); } catch (e) { console.error(e); } };

  // 결혼 · 육아 조건 완화 (너무 느리지 않게)
  Object.assign(D.MARRIAGE, { minDatingDays: 7, affection: 85, romance: 70 });
  D.PARENT.afterDays = Math.min(D.PARENT.afterDays, 7);
})();
