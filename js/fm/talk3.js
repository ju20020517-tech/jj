/* =========================================================
 *  💬 주민 대화 3.0 — 말투 17종 · 조합형 대사 수천 가지 · 같은 말 반복 금지
 *   1) 말투 엔진: 문장 끝에 아무 말이나 붙이던 방식 → 문장 단위로 자연스럽게
 *      (존댓말 변환 · 말머리 · 말꼬리 · 사투리 · 인터넷체 · 중2병 · 아재개그 …)
 *   2) 인사: 시간 · 날씨 · 장소 · 친밀도 · 기분을 섞어서 매번 다르게 (플레이어 이름이 '나'여도 자연스럽게)
 *   3) 화제: 성격 · 관심사 · 지금 있는 곳 · 직업 · 다른 주민 · 섬 소식 · 음식 · 꿈 · 만약에 질문 · 추억 · 농담 …
 *      화제마다 반응 선택지(맞장구 · 놀리기 · 더 물어보기 · 진지하게)가 있고 반응도 말투대로
 *   4) 정리: 자는 주민은 깨우기/조용히 가기만 · 중복 메뉴(대화하기 · 별명 만들기) 정리
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, D = FM.D, W = FM.Will;
  if (!Sim || !Soc || !W) return;
  const P = 'P', S = () => Sim.get(), pl = () => S().player;
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const hour = () => Sim.time.hour(), day = () => Sim.time.day();
  const byId = id => Sim.byId(id);
  const J = t => (FM.josa ? FM.josa(t) : t);
  const has = (v, k) => (Sim.has ? Sim.has(v, k) : false);
  const fill = (t, o) => t.replace(/\{(\w+)\}/g, (_, k) => (o[k] !== undefined ? o[k] : ''));

  // =========================================================
  // 1. 말투 엔진
  // =========================================================
  // 존댓말 변환 (문장 끝 어미만 바꿈 · 이미 존댓말/평서 '다'면 그대로)
  const POLITE_END = [['거야', '거예요'], ['이야', '이에요'], ['할래', '할래요'], ['줄래', '줄래요'], ['래', '래요'], ['거든', '거든요'], ['는데', '는데요'], ['구나', '군요'], ['잖아', '잖아요'],
    ['해', '해요'], ['줘', '주세요'], ['봐', '봐요'], ['어', '어요'], ['아', '아요'], ['워', '워요'], ['와', '와요'], ['져', '져요'], ['쳐', '쳐요'], ['여', '여요'], ['대', '대요'], ['돼', '돼요'], ['게', '게요'], ['걸', '걸요'],
    ['지', '죠'], ['네', '네요'], ['까', '까요'], ['니', '나요'], ['나', '나요'], ['군', '군요'], ['고', '고요'], ['야', '예요'], ['자', '요'], ['어때', '어때요'], ['괜찮아', '괜찮아요']];
  function toPolite(t) {
    t = t.replace(/(^|\s)나는 /g, '$1저는 ').replace(/(^|\s)내가 /g, '$1제가 ').replace(/(^|\s)나도 /g, '$1저도 ').replace(/(^|\s)나랑 /g, '$1저랑 ').replace(/(^|\s)내 /g, '$1제 ').replace(/(^|\s)나 /g, '$1저 ');
    return t.replace(/([가-힣]+)([^가-힣]*?)(?=([.!?~…]+|$)(\s|$))/g, (m, word, mid, _p3, _p4, off, str) => {
      if (/(요|다|니다|죠|세요)$/.test(word)) return m;
      if ((off === 0 || /[.!?~…]\s*$/.test(str.slice(Math.max(0, off - 2), off))) && str.charAt(off + m.length) === '?') return m;   // 한 단어짜리 질문("미래?")은 그대로
      for (const [a, b] of POLITE_END) if (word.endsWith(a) && word.length >= a.length) return word.slice(0, word.length - a.length) + b + mid;
      // 그 밖의 해체 어미(바빠 · 어때 · 귀여워 …): 받침 없는 ㅏ/ㅐ/ㅓ/ㅔ/ㅕ/ㅘ/ㅙ/ㅝ/ㅞ 로 끝나면 '요'
      const c = word.charCodeAt(word.length - 1) - 0xac00;
      if (c >= 0 && c < 11172 && c % 28 === 0 && [0, 1, 4, 5, 6, 9, 10, 14, 15].includes(Math.floor(c / 28) % 21) && word.length >= 2 && str.charAt(off + m.length) !== '?') return word + '요' + mid;   // 질문(과거? 미래?)은 명사일 수 있어 제외
      return m;
    });
  }
  const dot2bang = t => t.replace(/\.(\s|$)/g, '!$1');
  const PUNS = ['바나나가 웃으면? 바나나킥! 허허', '세상에서 제일 가난한 왕은? 최저임금! 허허허', '왕이 넘어지면? 킹콩! 하하', '소가 웃으면? 우하하! 크흠', '물고기의 반대말은? 불고기! 허허', '오리가 얼면? 언덕! 하하하', '딸기가 직장을 잃으면? 딸기시럽! 허허'];
  const SPEECH = {
    warm: { name: '다정한 반말', pre: ['헤헤,', '아,', '음~'], post: ['😊', '헤헤', '(싱긋)'], pr: 0.2, po: 0.25 },
    polite: { name: '공손한 존댓말', polite: true, pre: ['아,', '저기,', '음,'], post: ['😊', '(살짝 웃는다)'], pr: 0.15, po: 0.15 },
    formal: { name: '격식체 집사 말투', polite: true, pre: ['흠흠,', '실례지만,', '말씀드리자면,'], post: ['(정중하게 고개를 숙인다)', '(넥타이를 고쳐 맨다)'], pr: 0.3, po: 0.2 },
    cute: { name: '애교 말투', pre: ['히힛,', '에헤헤~', '앗,', '있잖아앙~'], post: ['뿌잉뿌잉!', '헤헷 ♡', '(볼 빵빵)', '히히', '꺄아~'], pr: 0.3, po: 0.45 },
    tsundere: { name: '츤데레', pre: ['흥,', '딱히…', '뭐,', '…착각하지 마.'], post: ['…착각하지 마!', '흥!', '(고개를 홱 돌린다)', '딱히 너 때문은 아니거든?'], pr: 0.35, po: 0.35 },
    cool: { name: '시크 단답', fx: t => { const m = t.match(/^[^.!?…]*[.!?…]+/); return (m ? m[0] : t).replace(/!+/g, '.'); }, pre: ['…', '음.', '뭐.'], post: ['…', '(시선을 돌린다)', '(무심한 표정)'], pr: 0.25, po: 0.2 },
    hyper: { name: '텐션 폭발', fx: dot2bang, pre: ['우와아!', '대박!', '야야야!', '헐 대박!'], post: ['!!!', '완전 신나!', '🔥', '꺄하하!'], pr: 0.4, po: 0.4 },
    net: { name: '인터넷체', fx: t => t.replace(/정말|진짜/g, () => pick(['ㄹㅇ', '진짜', '완전', '찐으로'])), pre: ['헐', 'ㄹㅇ', '아 맞다', '와'], post: ['ㅋㅋㅋ', 'ㅇㅈ?', '실화냐', '(폰을 보며)', 'ㅋㅋ 개웃겨'], pr: 0.35, po: 0.5 },
    dreamy: { name: '몽환 말투', pre: ['음…', '있잖아…', '별이 그러는데…', '꿈에서…'], post: ['…☁️', '…아마도.', '…꿈에서 본 것 같아.', '(먼 곳을 본다)'], pr: 0.3, po: 0.35 },
    shy: { name: '수줍은 말투', pre: ['저, 저기…', '그, 그게…', '…', '혹시…'], post: ['(꼼지락)', '(얼굴이 빨개진다)', '…헤헤', '(눈을 못 마주친다)'], pr: 0.4, po: 0.4 },
    grandma: { name: '할머니 말투', pre: ['아이고~', '허허,', '우리 강아지,', '아이구야,'], post: ['아이고 예뻐라.', '허허허.', '밥은 꼭 챙겨 먹고.', '할미가 다 안다.'], pr: 0.45, po: 0.4 },
    gyeongsang: { name: '경상도 사투리', fx: t => t.replace(/뭐 해\?/g, '뭐 하노?').replace(/진짜/g, '억수로').replace(/정말/g, '참말로').replace(/그래\?/g, '그렇나?').replace(/왜\?/g, '와?'), pre: ['마,', '아이고 마,', '와,', '머꼬,'], post: ['아이가!', '맞제?', '고마 됐다!', '알긋나?'], pr: 0.4, po: 0.45 },
    jeolla: { name: '전라도 사투리', fx: t => t.replace(/진짜/g, '허벌나게').replace(/정말/g, '참말로').replace(/그래\?/g, '그라제?'), pre: ['아따,', '오매,', '거시기,', '워메,'], post: ['잉~', '그라제?', '허벌나게 좋구만잉.', '알것제?'], pr: 0.4, po: 0.45 },
    dad: { name: '아재개그', pre: ['허허,', '어흠,', '하하,'], post: PUNS.map(x => `(아재개그) ${x}`).concat(['…농담이야, 하하!', '허허허!']), pr: 0.25, po: 0.22 },
    chuuni: { name: '중2병', pre: ['크큭…', '봉인된 오른팔이 욱신거린다…', '후후후…', '어둠의 계약자여…'], post: ['…이것이 운명인가.', '(망토를 휘날린다)', '…어둠이 속삭이는군.', '크큭, 너도 각성할 날이 올 거다.'], pr: 0.45, po: 0.45 },
    posh: { name: '귀족 말투', polite: true, pre: ['오호호,', '어머,', '어머나,'], post: ['오호호호!', '우아하지 않나요?', '(부채를 펼친다)', '후훗.'], pr: 0.35, po: 0.35 },
    sporty: { name: '운동부 말투', fx: dot2bang, pre: ['오케이!', '좋았어!', '파이팅!', '자!'], post: ['파이팅!!', '가즈아!', '💪', '한 바퀴 더!'], pr: 0.35, po: 0.35 },
    sailor: { name: '뱃사람 말투', pre: ['어이,', '흠,', '이봐,'], post: ['…바다가 그렇게 말하더군.', '(먼 바다를 본다)', '파도가 잔잔하군.'], pr: 0.3, po: 0.3 },
  };
  // 고정 주민별 말투 (성격 · 컨셉에 맞춰)
  const CAST_SPEECH = {
    c01: 'shy', c02: 'net', c03: 'dreamy', c04: 'polite', c05: 'hyper', c06: 'jeolla', c07: 'cute', c08: 'polite', c09: 'net', c10: 'cool',
    c11: 'warm', c12: 'hyper', c13: 'sporty', c14: 'grandma', c15: 'dreamy', c16: 'sporty', c17: 'dad', c18: 'cool', c19: 'posh', c20: 'shy',
    c21: 'net', c22: 'tsundere', c23: 'formal', c24: 'chuuni', c25: 'gyeongsang', c26: 'sailor', c27: 'hyper', c28: 'polite', c29: 'warm', c30: 'posh',
    c31: 'gyeongsang', c32: 'cute', c33: 'formal', c34: 'tsundere', c35: 'dad', c36: 'jeolla', c37: 'chuuni', c38: 'cool', c39: 'warm', c40: 'shy',
  };
  const L3_SPEECH = { WARM: 'warm', FORMAL: 'polite', CYNICAL: 'tsundere', CUTE: 'cute', PRANKSTER: 'net', DREAMY: 'dreamy', PASSIONATE: 'hyper', SHY: 'shy' };
  const speechOf = v => (v && (v.speech || CAST_SPEECH[v.castId] || L3_SPEECH[v.keys && v.keys.L3])) || 'warm';
  const isPolite = v => !!(SPEECH[speechOf(v)] || {}).polite;
  function apply(v, t, opt = {}) {
    if (!t || typeof t !== 'string' || !v || v.id === P || v.staff || v.child && v.child.stage !== 'CHILD') return t;
    const sp = SPEECH[speechOf(v)]; if (!sp) return t;
    t = t.trim();
    if (sp.polite) t = toPolite(t);
    if (sp.fx) t = sp.fx(t);
    if (!opt.noPre && !sp.pre.some(p => t.includes(p)) && chance(sp.pr)) t = `${pick(sp.pre)} ${t}`;
    // 질문 끝에는 말투 감탄사 대신 몸짓(괄호) · 이모지만
    const posts = /\?\s*$/.test(t) ? sp.post.filter(p => /^[(\u2600-\u27bf\ud83c-\udbff…]/.test(p)) : sp.post;
    if (posts.length && !sp.post.some(p => t.includes(p)) && chance(sp.po)) t = `${t} ${pick(posts)}`;
    return t;
  }
  FM.Speech = { apply, speechOf, SPEECH, CAST_SPEECH, toPolite, isPolite };

  // 플레이어를 부르는 말 (이름이 '나' · '너'면 이름 대신 자연스럽게)
  function nameOf(v) {
    const r = Soc.rel(v.id, P); const n = (r.nickname && r.nickname[P]) || pl().name || '';
    return ['나', '너', '저', '내', ''].includes(n.trim()) ? '' : n;
  }
  const voc = v => { const n = nameOf(v); if (!n) return ''; return isPolite(v) ? `${n} 님,` : J(`${n}아(야),`); };
  const you = v => (isPolite(v) ? (nameOf(v) ? `${nameOf(v)} 님` : '그쪽') : '너');

  // 같은 대사 반복 방지 (주민별 최근 60줄)
  function fresh(v, arr) {
    const m = W.mind ? W.mind(v) : (v._mind || (v._mind = {}));
    const seen = m.seen3 || (m.seen3 = []);
    const pool = arr.filter(t => !seen.includes(t));
    const t = pick(pool.length ? pool : arr);
    seen.push(t); if (seen.length > 60) seen.shift();
    return t;
  }

  // =========================================================
  // 2. 인사 — 시간 · 날씨 · 장소 · 친밀도 · 기분 조합
  // =========================================================
  const TIME_LINE = {
    dawn: ['일찍 일어났네? 아침 공기 진짜 상쾌하다.', '좋은 아침! 해 뜨는 거 봤어?', '아직 졸려… 근데 너 보니까 잠이 깬다.', '새벽 이슬 밟는 소리 좋지 않아?', '아침부터 부지런하다!'],
    morning: ['좋은 아침이야!', '아침은 먹었어?', '오늘 하루 계획 있어?', '오전 햇살 좋다~', '벌써 나와 있었구나!'],
    noon: ['점심 먹었어?', '배고프지 않아? 슬슬 점심시간인데.', '한낮이라 좀 덥다.', '오후엔 뭐 할 거야?', '점심 메뉴 고민 중이었는데 마침 잘 왔다.'],
    afternoon: ['나른한 오후다~', '오후 산책 중이야?', '이 시간엔 간식이 당기더라.', '오늘 날씨 오후가 제일 좋다.', '하품 나오는 시간이야.'],
    evening: ['노을 봤어? 오늘 하늘 예쁘다.', '저녁 먹을 시간이네.', '하루 잘 보냈어?', '해 지는 거 보니까 기분이 몽글몽글해.', '저녁 바람 시원하다.'],
    night: ['이 시간에 산책이야?', '밤공기 좋다. 별 보여?', '오늘 하루 어땠어?', '밤엔 섬이 조용해서 좋아.', '늦었는데 안 피곤해?'],
    late: ['아직 안 자?', '이 시간까지 깨어 있었어?', '쉿, 다들 자고 있어.', '밤샘하는 거야?', '졸린 눈인데 어쩐 일이야?'],
  };
  const WEATHER_LINE = {
    sunny: ['오늘 날씨 진짜 좋다!', '햇살이 반짝반짝해.', '빨래하기 딱 좋은 날이야.', '하늘 봐, 구름 한 점 없어.'],
    cloudy: ['하늘이 좀 흐리네.', '구름이 잔뜩 꼈다.', '흐린 날은 괜히 차분해져.', '비 올 것 같기도 하고…'],
    rain: ['비 오는데 우산은 챙겼어?', '빗소리 좋지 않아?', '비 와서 신발 다 젖었어.', '이런 날은 부침개가 생각나.'],
    fog: ['안개 때문에 앞이 잘 안 보여.', '안개 낀 섬, 좀 신비롭지 않아?', '안개 속에서 너 알아보고 깜짝 놀랐어.'],
    windy: ['바람 엄청 분다! 모자 날아갈 뻔했어.', '머리 다 헝클어졌어…', '바람 소리 무섭지 않아?', '연 날리기 딱 좋은 날이다!'],
  };
  const STAGE_LINE = {
    ACQUAINTANCE: ['아, 안녕.', '어… 안녕?', '여기서 보네.', '아, 너구나.', '안녕! 우리 아직 얘기 별로 안 해 봤지?'],
    FRIEND: ['어, 왔어?', '안녕! 반가워.', '오, 너다!', '마침 심심했는데 잘 왔다.', '오늘도 만났네!'],
    GOOD_FRIEND: ['딱 너 생각하고 있었어!', '왔구나! 기다렸어.', '오늘 같이 놀자!', '할 얘기 엄청 많아!', '너 오면 기분이 좋아져.'],
    BEST_FRIEND: ['내 절친 왔다!!', '우리 인사법 알지? (하이파이브)', '너 없으면 심심해 죽는 줄 알았어.', '역시 너밖에 없어!', '오늘도 우리가 최고야!'],
  };
  const MOOD_LINE = { happy: ['오늘 기분 최고야!', '좋은 일 있었거든.'], sad: ['…오늘은 좀 우울해.', '기운이 좀 없어…'], tired: ['아이고 피곤해.', '오늘따라 몸이 무겁네.'], hungry: ['배가 너무 고파…', '꼬르륵… 들었어?'] };
  const tod = h => (h < 5 ? 'late' : h < 8 ? 'dawn' : h < 11 ? 'morning' : h < 14 ? 'noon' : h < 17 ? 'afternoon' : h < 20 ? 'evening' : h < 24 ? 'night' : 'late');
  function moodKey(v) { if ((v.hunger || 0) > 70) return 'hungry'; if ((v.energy !== undefined && v.energy < 25)) return 'tired'; if ((v.mood || 50) >= 75) return 'happy'; if ((v.mood || 50) <= 30 || (v.depression || 0) > 50) return 'sad'; return null; }
  function greet(v, stage) {
    const parts = [];
    const vc = voc(v);
    const st = S(), w = st.weather ? st.weather.type : 'sunny';
    const a = fresh(v, STAGE_LINE[stage] || STAGE_LINE.FRIEND);
    parts.push(vc ? `${vc} ${a}` : a);
    const roll = Math.random();
    if (roll < 0.35) parts.push(fresh(v, TIME_LINE[tod(hour())]));
    else if (roll < 0.6) parts.push(fresh(v, WEATHER_LINE[w] || WEATHER_LINE.sunny));
    else if (roll < 0.75) { const mk = moodKey(v); if (mk) parts.push(fresh(v, MOOD_LINE[mk])); }
    else { const pl2 = placeLine(v); if (pl2) parts.push(pl2); }
    return apply(v, parts.join(' '), { noPre: true });
  }
  if (FM.L) { FM.L.greet = (v, stage) => greet(v, stage); FM.L.sty = (v, t) => apply(v, t); FM.L.STYLE = FM.L.STYLE || {}; }

  // 지금 있는 곳 · 하는 일
  const PLACE_TALK = {
    cafe_in: ['여기 크루아상 진짜 맛있어.', '카페 창가 자리가 제일 좋아.', '커피 향 맡으면 정신이 번쩍 들어.'], library_in: ['도서관 냄새 좋지 않아? 종이 냄새.', '쉿, 여기선 조용히…', '어제 읽다 만 책이 있어서 왔어.'],
    arcade_in: ['인형뽑기 한 판만 더…!', '오늘 최고 점수 갈아 치울 거야.', '오락실 음악 들으면 신나.'], obs_in: ['여기서 보면 별이 쏟아질 것 같아.', '망원경으로 토성 고리 봤어!', '천문대는 밤이 제일 예뻐.'],
    club_in: ['오늘 음악 장난 아니다!', '재즈 듣고 있으면 어른이 된 기분이야.', '춤추러 온 거지?'], med_in: ['병원 냄새는 좀 무서워…', '건강이 최고야, 진짜로.', '간호사님들 너무 친절해.'],
    mall_in: ['신상 구경 중이야!', '이 옷 어때? 사고 싶은데 고민돼.', '쇼핑은 언제나 옳아.'], tea_in: ['차 한 잔 하니까 마음이 차분해져.', '다실은 시간이 느리게 가는 것 같아.', '오늘의 차는 뭘까?'],
    onsen_in: ['온천은 진짜 최고야~', '물이 딱 좋다…', '목욕 후엔 커피 우유지!'], workshop_in: ['나무 깎는 소리 좋다.', '뭐 만들러 왔어?', '공방에 오면 손이 근질근질해.'],
    cathedral_in: ['여기 오면 마음이 경건해져.', '스테인드글라스 빛 봐, 예쁘다.', '언젠가 여기서 결혼식 하고 싶어.'], sushi_in: ['오늘 참치 상태 좋대!', '초밥은 손으로 먹는 거래.'], pub_in: ['여기 짜장면 진짜 맛있어.', '반점 사장님 손맛 최고야.'],
    conv_in: ['편의점 신상 과자 나왔대!', '삼각김밥 고르는 중이야.'], island: ['섬 공기 진짜 좋다.', '여기 경치 좋지?', '산책하기 딱 좋은 날이야.'],
  };
  function placeLine(v) {
    if (v.loc !== 'island') return PLACE_TALK[v.loc] ? fresh(v, PLACE_TALK[v.loc]) : null;
    const MP = FM.MAP && FM.MAP.P; let best = null, bd = 18;
    if (MP) for (const p of Object.values(MP)) { const d = Math.hypot(p.x - v.x, p.z - v.z); if (d < bd && p.name) { bd = d; best = p; } }
    return best ? fresh(v, [`${best.name.replace(/\s*["“].*$/, '')} 근처는 언제 와도 좋아.`, `여기 ${best.name.replace(/\s*["“].*$/, '')}, 내가 좋아하는 곳이야.`, `${best.name.replace(/\s*["“].*$/, '')} 쪽에 자주 와?`]) : fresh(v, PLACE_TALK.island);
  }

  // =========================================================
  // 3. 화제 데이터 (손으로 쓴 대사 + 조합)
  // =========================================================
  const MONO = {
    ROMANTIC: ['노을 보면 괜히 누가 보고 싶어져.', '운명 같은 만남이 있다고 믿어?', '편지 쓰는 거 좋아해. 손글씨엔 마음이 담기잖아.', '오늘 길에서 네잎클로버 찾았어! 행운이 올 거야.', '사랑 노래 들으면 가슴이 찡해.', '언젠가 바닷가에서 프러포즈 받고 싶어.', '꽃말 공부 중이야. 튤립은 사랑의 고백이래.', '별똥별 보면 무슨 소원 빌 거야?'],
    ATHLETIC: ['오늘 광장 열 바퀴 뛰었어!', '근육은 절대 배신하지 않아.', '아침 조깅만큼 상쾌한 건 없어.', '스트레칭 안 하면 다쳐, 꼭 해!', '내일은 팔굽혀펴기 100개 도전이야.', '땀 흘리고 나서 마시는 물이 세상에서 제일 맛있어.', '같이 운동할 사람 구해! 너 어때?', '줄넘기 2단 뛰기 성공했어!'],
    SCHOLARLY: ['오늘 발견한 무당벌레 점이 정확히 7개였어.', '도서관에 새 책이 들어왔어.', '구름 모양에도 다 이유가 있대.', '바닷물이 왜 짠지 알아?', '별빛은 수천 년 전에 출발한 빛이래. 신기하지?', '요즘 고대 문자 해독하는 중이야.', '공부는 하면 할수록 모르는 게 많아져.', '오늘의 단어: 세렌디피티. 뜻밖의 행운이라는 뜻이야.'],
    LAZY: ['배고파… 뭐 맛있는 거 없을까.', '낮잠 자기 딱 좋은 날씨야.', '벤치에 누워 있으면 세상이 평화로워.', '오늘은 아무것도 안 하는 게 목표야.', '움직이기 귀찮아… 업어 줄래?', '이불 밖은 위험해.', '내일 할 수 있는 일은 내일 하자.', '간식 먹고 자고 간식 먹고 자고… 완벽한 하루.'],
    EXTROVERT: ['너 그 소문 들었어? 대박이야.', '오늘 파티 있으면 나 불러 줘!', '광장에 사람 많은 게 좋아.', '새 친구 사귀는 게 제일 재밌어.', '다 같이 노래방 가자!', '나 오늘 다섯 명이랑 수다 떨었어!', '심심하면 나한테 연락해, 언제든!', '조용한 건 못 참겠어. 뭐 재밌는 거 없나?'],
    INTROVERT: ['조용한 곳에 있으면 마음이 편해.', '오늘은 혼자 책 읽고 싶은 날이야.', '사람 많은 곳은 조금 피곤해.', '창밖 보면서 차 마시는 게 행복이야.', '너랑은 조용히 있어도 어색하지 않아.', '혼자만의 시간도 꼭 필요해.', '이어폰 끼고 걷는 거 좋아해.', '말보다 글이 편할 때가 있어.'],
    SNOB: ['오늘 홍차는 향이 아주 훌륭했어.', '예의는 사람을 만든다고.', '이 넥타이, 수입품이야.', '격식 있는 자리는 언제나 설레.', '좋은 물건은 오래 써도 질리지 않아.', '와인은 향부터 즐기는 거야.', '어디서든 품위를 지켜야 해.', '클래식 음악 듣다가 감동했어.'],
    CRANKY: ['요즘 애들은 인사를 안 해.', '시끄러운 건 질색이야.', '…뭐, 그럭저럭 지낸다.', '날씨가 왜 이래, 짜증 나게.', '내 화단에 누가 발자국 냈어.', '잔소리 아니고 다 너 잘되라고 하는 말이야.', '커피는 무조건 블랙이지.', '흥, 칭찬해도 아무것도 안 나와.'],
    ARTISTIC: ['구름이 고래처럼 생겼어. 그려야겠다.', '세상은 거대한 캔버스야.', '영감이 떠오르면 잠이 안 와.', '이 노을 색, 물감으로 못 만들 것 같아.', '오늘 그린 그림 망쳤어… 그것도 예술이지.', '음악 들으면 색깔이 보여.', '어제 꿈을 그림으로 그려 봤어.', '예술은 설명하는 게 아니라 느끼는 거야.'],
    ANXIOUS: ['혹시 내가 뭐 실수한 거 없지?', '내일 비 오면 어떡하지…', '문 잠갔는지 세 번 확인했어.', '괜찮겠지? 괜찮을 거야…', '걱정이 많아서 잠을 못 잤어.', '너랑 얘기하면 마음이 좀 놓여.', '약속 시간 30분 전에 도착하는 편이야.', '혹시 나 이상해 보여?'],
    ADVENTURER: ['저 산 너머엔 뭐가 있을까?', '지도에 없는 길로 가 보는 게 좋아.', '언젠가 배 타고 세계 일주 할 거야.', '오늘 동굴 하나 발견했어! 비밀이야.', '모험엔 나침반이랑 간식이 필수야.', '길을 잃어야 새 길을 찾는 법이지.'],
    FASHIONISTA: ['오늘 코디 어때? 포인트는 신발이야.', '이번 시즌 유행 색은 라벤더래.', '옷은 그날의 기분이야.', '쇼핑몰 신상 봤어? 대박이야.', '액세서리 하나로 분위기가 확 바뀌어.', '패션은 자신감이야!'],
    MUSICIAN: ['머릿속에 멜로디가 계속 맴돌아.', '오늘 신곡 쓰다가 밤새웠어.', '바닷소리도 하나의 음악이야.', '기타 줄 갈았더니 소리가 맑아졌어.', '노래는 마음을 전하는 가장 빠른 방법이야.', '내 공연 보러 올 거지?'],
    GAMER: ['어제 보스 잡느라 밤새웠어.', '인생도 레벨 업이 되면 좋겠다.', '오락실 랭킹 1위 탈환할 거야.', '세이브 포인트가 현실에도 있었으면.', '너 게임 잘해? 한 판 붙자!', '이번 이벤트 보상 대박이야.'],
    LEADER: ['오늘 섬 순찰 이상 무!', '모두가 행복한 섬을 만들고 싶어.', '회의는 짧고 굵게!', '문제 있으면 언제든 말해, 내가 해결할게.', '규칙은 다 같이 지키라고 있는 거야.', '리더는 먼저 움직이는 사람이야.'],
    CLUMSY: ['오늘 또 넘어졌어… 헤헤.', '컵을 세 개나 깨 먹었어.', '길에서 사과 굴러가는 거 쫓아갔다가 넘어졌어.', '나 왜 이렇게 덤벙댈까?', '양말 짝짝이로 신고 나왔어.', '그래도 다친 데는 없어!'],
    NATURE: ['숲에서 다람쥐 봤어!', '나무에 귀를 대면 물 올라가는 소리가 들려.', '새소리로 시간을 알 수 있어.', '오늘 이슬 맺힌 거미줄 봤어. 보석 같았어.', '자연은 최고의 선생님이야.', '바람 냄새가 달라졌어. 계절이 바뀌나 봐.'],
    ELEGANT: ['차는 천천히 음미하는 거예요.', '오늘 꽃꽂이 연습했어요.', '우아함은 여유에서 나오는 거죠.', '조용히 내리는 비를 좋아해요.', '오래된 것들에는 기품이 있어요.'],
    CHIC: ['…사진 한 장 찍어도 돼?', '빛이 좋은 시간은 짧아.', '흑백 사진이 더 많은 걸 말해.', '꾸민 듯 안 꾸민 게 진짜 멋이지.', '말은 적게, 셔터는 많이.'],
    PURE: ['오늘 꽃이 활짝 폈어요!', '착하게 살면 좋은 일이 생길 거예요.', '아침 햇살이 너무 따뜻해요.', '작은 새가 창가에 앉아 있었어요.', '모두 사이좋게 지냈으면 좋겠어요.'],
    FRESH: ['요즘 핫한 거 다 알려 줄게!', '오늘 찍은 사진 반응 대박이야!', '새로운 건 일단 해 봐야지!', '이번 주말에 뭐 하지? 설렌다!', '신상 음료 먹어 봤어?'],
    BEAGLE: ['킁킁, 어디서 맛있는 냄새 나!', '산책 가자 산책!', '꼬리가 있었으면 지금 흔들고 있었을 거야.', '공 던지기 하자!', '너 보니까 신난다!'],
    MYSTIC: ['오늘 타로 카드에서 연인이 나왔어.', '네 오라가 오늘 보라색이야.', '달의 기운이 강한 날이야.', '꿈은 미래를 보여 주기도 해.', '수정 구슬이 뭔가 보여 주려 해.'],
    CHARISMA: ['따라와. 내가 안내할게.', '오늘도 계획대로 착착.', '실수는 한 번이면 충분해.', '믿어도 좋아. 내가 책임질게.', '바다는 거짓말을 안 해.'],
    HIP: ['오늘 플레이리스트 미쳤어.', '비트에 몸을 맡겨 봐.', '스웩은 태도에서 나와.', '이번 주 클럽 라인업 봤어?', '리듬 타는 거 어렵지 않아.'],
    CLASSIC: ['요즘 건 다 금방 망가져.', '손으로 만든 물건엔 온기가 있어.', '예전 노래가 더 좋아.', '천천히, 꼼꼼하게. 그게 장인 정신이야.', '오래 쓸수록 길이 드는 법이지.'],
    CUTIE: ['이 인형 너무 귀엽지?', '핑크색은 사랑이야!', '오늘 머리끈 리본으로 바꿨어!', '귀여운 건 세상을 구해!', '말랑말랑한 거 좋아!'],
    DANDY: ['좋은 하루를 보내고 계십니까.', '셔츠 깃은 언제나 반듯하게.', '와인 한 잔이 하루의 피로를 씻어 주지요.', '신사는 약속 시간을 지킵니다.', '멋은 디테일에서 나오는 법.'],
    TOMBOY: ['오늘 사슴벌레 잡았어! 이만해!', '치마보다 반바지가 편해.', '나무 타기 시합할래?', '흙 묻는 거 하나도 안 무서워.', '벌레 무서워하는 애들 이해가 안 돼.'],
  };
  const INTEREST = {
    GARDEN: ['토마토 싹이 났어!', '꽃은 말을 걸어 주면 더 잘 자란대.', '흙 만지면 마음이 편해져.', '장미 가지치기 하다가 가시에 찔렸어.'],
    FOOD: ['오늘 점심 뭐 먹었어? 나는 {food}!', '맛집 하나 알아냈어. 알려 줄까?', '요리는 사랑이야.', '{food} 만드는 법 배웠어!'],
    STUDY: ['오늘 공부 계획 다 지켰어.', '노트 정리하는 게 은근 재밌어.', '시험은 없지만 공부는 계속해.', '새로운 걸 알게 되면 짜릿해.'],
    FISHING: ['오늘 대물 놓쳤어… 이만했는데!', '낚시는 기다림의 예술이야.', '새벽 부두는 고요해서 좋아.', '미끼는 지렁이가 최고지.'],
    FASHION: ['색 조합 고민하느라 한 시간 걸렸어.', '모자 하나로 분위기가 달라져.', '네 옷 오늘 진짜 잘 어울린다.', '옷장 정리했더니 입을 옷이 없어.'],
    MUSIC: ['요즘 흥얼거리는 노래가 있어.', '피아노 소리는 비랑 잘 어울려.', '좋아하는 노래 있으면 알려 줘.', '음악 없으면 하루도 못 살아.'],
    GOSSIP: ['너만 알고 있어, 진짜 비밀인데…', '요즘 섬에서 제일 핫한 커플 누군지 알아?', '내 정보력은 섬 최고야.', '소문은 바람보다 빨라.'],
    CLEAN: ['방 청소 싹 했어. 반짝반짝해!', '먼지 한 톨도 용서 못 해.', '정리 정돈하면 마음도 정리돼.', '빨래 냄새 좋지 않아?'],
    OCCULT: ['오늘 밤 보름달이야. 조심해.', '이 섬에 숨겨진 전설 알아?', '타로 한 장 뽑아 볼래?', '귀신 이야기 해 줄까? 흐흐.'],
    FITNESS: ['오늘 운동 루틴 끝!', '단백질 챙겨 먹어야 해.', '스쿼트 100개 했어.', '운동은 습관이야.'],
  };
  const FOODS = ['떡볶이', '김밥', '라면', '초밥', '파스타', '짜장면', '치킨', '붕어빵', '팬케이크', '딸기 케이크', '타코야키', '호떡', '아이스크림', '크루아상', '카레', '된장찌개', '피자', '마카롱', '빙수', '군고구마'];
  const DREAM_WHO = ['고래', '거대한 고양이', '말하는 해바라기', '우주 비행사', '어릴 적 친구', '구름 위 기차', '하늘을 나는 펭귄', '초콜릿 성', '용', '유령 선장'];
  const DREAM_WHAT = ['랑 같이 바다 위를 걸었어', '한테 쫓기다가 깼어', '가 나한테 비밀을 알려 줬는데 기억이 안 나', '랑 춤을 췄어', '가 내 방에 놀러 왔어', '랑 별을 따러 갔어', '가 생일 축하 노래를 불러 줬어'];
  const WHATIF = [
    { q: '만약에 하루 동안 투명 인간이 된다면 뭐 할 거야?', a: ['🍰 몰래 케이크 먹기', '🕵️ 비밀 엿듣기', '😴 그냥 잠자기'], r: ['ㅋㅋ 역시 먹는 게 최고지!', '헉, 그건 좀 무서운데?', '투명해도 잠은 자야지, 인정!'] },
    { q: '무인도에 딱 하나만 가져갈 수 있으면?', a: ['🔪 칼', '📚 책', '👫 친구'], r: ['현실적이다!', '책이라니 낭만 있네.', '친구라니… 감동이야.'] },
    { q: '시간 여행을 한다면 과거? 미래?', a: ['⏪ 과거', '⏩ 미래', '🙅 지금이 좋아'], r: ['과거로 가서 뭘 바꾸고 싶어?', '미래의 나는 뭐 하고 있을까?', '오, 그 대답 멋지다.'] },
    { q: '초능력 하나 고를 수 있으면?', a: ['🕊️ 하늘 날기', '🧠 마음 읽기', '⏱️ 시간 멈추기'], r: ['나도 날고 싶어!', '내 마음은 읽지 마! 비밀이야.', '시간 멈추면 낮잠 무한대네.'] },
    { q: '평생 한 가지 음식만 먹어야 한다면?', a: ['🍚 밥', '🍜 라면', '🍰 디저트'], r: ['역시 한국인은 밥심!', '라면이라니 진정한 승부사다.', '이빨 다 썩겠다 ㅋㅋ'] },
    { q: '로또 1등 되면 제일 먼저 뭐 할 거야?', a: ['🏝️ 섬 하나 더 사기', '🎁 친구들 선물', '🏦 저금'], r: ['스케일 봐!', '나도 선물 받는 거지?', '현명하다… 존경해.'] },
    { q: '동물이랑 대화할 수 있다면 누구랑 먼저 얘기할래?', a: ['🐱 고양이', '🐬 돌고래', '🐦 새'], r: ['고양이는 분명 츤데레일 거야.', '돌고래는 수다쟁이일 것 같아!', '새들은 섬 소문 다 알 거야.'] },
    { q: '하루만 다른 사람으로 살 수 있으면 누구로 살래?', a: ['👑 왕', '🦸 영웅', '🙂 그냥 나'], r: ['왕관 무겁지 않을까?', '망토 펄럭!', '너다운 대답이다.'] },
    { q: '좀비가 나타나면 어디로 숨을 거야?', a: ['🏬 쇼핑몰', '⛪ 성당', '🚢 배 타고 도망'], r: ['먹을 건 많겠다!', '든든하긴 하겠다.', '바다로 가는 거 똑똑하다!'] },
    { q: '내일 지구가 멸망한다면 오늘 뭐 할래?', a: ['🍗 맛있는 거 먹기', '💌 고백하기', '🌅 노을 보기'], r: ['마지막 만찬이다!', '…누구한테? 궁금하다!', '낭만적이야.'] },
    { q: '꿈의 직업이 뭐였어?', a: ['🚀 우주 비행사', '🎤 가수', '👩‍🍳 요리사'], r: ['멋있다! 지금도 늦지 않았어.', '노래 한 소절 불러 줘!', '요리해 주면 매일 갈게.'] },
    { q: '비 오는 날 제일 하고 싶은 거?', a: ['☕ 창가에서 차 마시기', '🌧️ 빗속 산책', '🛏️ 이불 속 뒹굴기'], r: ['분위기 있다~', '감기 조심해!', '세상에서 제일 행복한 순간이지.'] },
  ];
  const JOKES = [
    { q: '세상에서 가장 뜨거운 과일은?', a: '천도복숭아!' }, { q: '왕이 넘어지면?', a: '킹콩!' }, { q: '바다가 화나면?', a: '파도파도 끝이 없다!' }, { q: '아몬드가 죽으면?', a: '다이아몬드!' },
    { q: '세상에서 가장 쉬운 숫자는?', a: '190000! (십구만)' }, { q: '자동차를 톡 치면?', a: '카톡!' }, { q: '오리가 얼면?', a: '언덕!' }, { q: '소가 계단을 오르면?', a: '소오름!' },
    { q: '신발이 화나면?', a: '신발끈!' }, { q: '반성문을 영어로 하면?', a: '글로벌!' }, { q: '도둑이 가장 싫어하는 아이스크림은?', a: '누가바!' }, { q: '할아버지가 좋아하는 돈은?', a: '할머니!' },
  ];
  const COMPLIMENT = ['오늘 표정이 밝아 보여!', '너랑 있으면 시간이 빨리 가.', '너는 진짜 좋은 친구야.', '오늘 머리 잘 됐다!', '너 웃는 거 보면 나도 웃게 돼.', '섬에 네가 와서 다행이야.', '너는 말을 참 예쁘게 해.', '너 오늘 좀 멋있다?'];
  const THOUGHTS = ['구름은 왜 하얄까?', '어른이 된다는 건 뭘까?', '우리 섬 이름 바꿀 수 있으면 뭐로 하고 싶어?', '세상에서 제일 행복한 소리는 웃음소리 같아.', '가끔은 아무 이유 없이 기분이 좋아.', '고양이는 무슨 생각을 할까?', '오늘 하늘 색 이름을 지어 주고 싶어.', '모래성 쌓다가 파도에 다 무너졌어. 그래도 재밌었어.', '어제 본 별똥별에 소원 빌었는데 비밀이야.', '시간이 멈췄으면 좋겠는 순간 있어?', '섬에 놀이공원이 생기면 좋겠다.', '바다 끝에는 뭐가 있을까?'];
  const REACT = {
    agree: { label: ['😄 "맞아맞아!"', '👍 "완전 공감!"', '🙌 "그치그치!"'], fp: 2, line: ['그치? 역시 너는 말이 통해!', '역시 너밖에 없다니까!', '너도 그렇게 생각하지? 헤헤.', '우리 진짜 잘 맞는다!'] },
    ask: { label: ['❓ "더 얘기해 줘"', '👂 "그래서 어떻게 됐어?"', '🤔 "왜 그렇게 생각해?"'], fp: 3, line: ['음, 그러니까 말이야… 사실 별거 아닌데 들어 줘서 고마워.', '듣고 싶어? 나중에 천천히 다 얘기해 줄게!', '그냥… 요즘 그런 생각이 자주 들어.', '너한테만 하는 얘기야. 고마워, 들어 줘서.'] },
    tease: { label: ['😏 "에이~ 설마"', '🤪 "너 좀 이상해 ㅋㅋ"', '😜 "또 그 소리야?"'], fp: 0, line: ['야! 놀리지 마!', '흥, 너 그럴 줄 알았어 ㅋㅋ', '…진지하게 말한 건데!', '하하, 너도 참!'] },
    deep: { label: ['🫶 "네 마음 알 것 같아"', '💭 "나도 그런 적 있어"', '🤝 "언제든 얘기해"'], fp: 4, line: ['…고마워. 그 말 듣고 싶었나 봐.', '역시 너는 내 마음을 알아주는구나.', '너한테 말하길 잘했다.', '너 같은 친구가 있어서 다행이야.'] },
  };
  const reactChoices = (keys = ['agree', 'ask', 'tease', 'deep']) => keys.slice().sort(() => Math.random() - 0.5).slice(0, 3).map(k => ({ k, label: pick(REACT[k].label) }));
  function onReact(v, k) {
    const R = REACT[k] || REACT.agree;
    let fp = R.fp;
    if (k === 'tease') fp = has(v, 'PRANKSTER') || has(v, 'EXTROVERT') || has(v, 'BEAGLE') ? 2 : has(v, 'CRANKY') || has(v, 'ANXIOUS') || has(v, 'SNOB') ? -2 : 0;
    Soc.addFriend(v.id, P, fp, fp > 0 ? 1 : 0, '대화');
    if (fp > 2 && Soc.canRomance(v.id, P) && chance(0.3)) Soc.addRomance(v.id, P, 1, '대화');
    Sim.emote(v, fp > 2 ? '💗' : fp > 0 ? '😊' : fp < 0 ? '💢' : '😆');
    return { text: apply(v, fresh(v, R.line)) };
  }

  // =========================================================
  // 4. 새 화제 (talk2 의도 시스템에 추가 — 기존 화제와 섞여서 나옴)
  // =========================================================
  const I = W.I;
  const reg = (id, w, say, on) => { I[id] = { w, say, on: on || ((v, k) => onReact(v, k)) }; };
  const mk = (v, text, keys) => ({ text: apply(v, text), choices: reactChoices(keys) });
  const otherOf = v => { const cands = S().villagers.filter(o => o !== v && !o.child && !o.staff); return cands.length ? pick(cands) : null; };

  reg('t3_mono', v => (MONO[v.keys.L1] ? 2.2 : 0), v => mk(v, fresh(v, MONO[v.keys.L1])));
  reg('t3_interest', v => (INTEREST[v.keys.L4] ? 1.6 : 0), v => mk(v, fill(fresh(v, INTEREST[v.keys.L4]), { food: pick(FOODS) })));
  reg('t3_place', v => 1.2, v => { const t = placeLine(v); return t ? mk(v, t, ['agree', 'ask', 'deep']) : mk(v, fresh(v, THOUGHTS)); });
  reg('t3_job', v => (FM.CastJobs && FM.CastJobs.jobOf(v) ? 1.3 : 0), v => {
    const j = FM.CastJobs.jobOf(v), working = FM.CastJobs.working(v), where = j.where.replace(/\s*["“].*$/, '');
    const L = working ? [`지금 ${where}에서 일하는 중이야. 바쁘지만 보람 있어.`, `손님이 많아서 정신없어! 그래도 와 줘서 반가워.`, `일하는 모습 들킨 거야? 부끄럽다.`, `${where} 일, 생각보다 재밌어.`]
      : [`오늘 ${where} 일 끝나고 쉬는 중이야.`, `내일 또 ${where}에 출근해야 해.`, `${where}에서 있었던 웃긴 일 얘기해 줄까?`, `쉬는 날엔 ${where} 생각 안 하려고!`, `월급날이 기다려져~`];
    return mk(v, fresh(v, L));
  });
  reg('t3_villager', v => 1.8, v => {
    const st = S(); let o = null, kind = 'friend';
    if (v.crush && v.crush.target && v.crush.target !== P) { o = byId(v.crush.target); kind = 'crush'; }
    else { const pt = Soc.partnerOf(v.id); if (pt && pt !== P && chance(0.5)) { o = byId(pt); kind = 'partner'; } }
    if (!o) { o = otherOf(v); const r = o && Soc.rel(v.id, o.id); if (r) kind = r.friendship_point >= 60 ? 'friend' : r.friendship_point < 20 ? 'meh' : 'know'; }
    if (!o) return mk(v, fresh(v, THOUGHTS));
    const n = o.name;
    const L = {
      crush: [`…${n}(이)랑 눈 마주쳤는데 심장이 터지는 줄 알았어.`, `${n}은(는) 무슨 꽃을 좋아할까?`, `있잖아, ${n} 요즘 누구 만나는 사람 있대?`, `${n} 앞에만 가면 말이 안 나와.`],
      partner: [`${n}(이)랑 어제 산책했어. 헤헤.`, `${n}이(가) 요즘 좀 바빠서 서운해.`, `${n} 생일 선물 뭐 하지? 같이 골라 줄래?`, `${n}(이)랑 사귀길 진짜 잘한 것 같아.`],
      friend: [`${n}(이)랑 어제 같이 밥 먹었어!`, `${n}은(는) 진짜 좋은 애야.`, `${n}이(가) 나한테 선물 줬어!`, `${n}(이)랑 같이 있으면 웃음이 안 멈춰.`],
      know: [`${n} 요즘 뭐 하고 지내는지 알아?`, `${n}이(가) 광장에서 춤추는 거 봤어 ㅋㅋ`, `${n}(이)랑 좀 더 친해지고 싶은데…`, `${n}이(가) 아까 혼자 웃고 있던데 무슨 일일까?`],
      meh: [`솔직히 ${n}(이)랑은 좀 안 맞아.`, `${n}이(가) 나한테 인사를 안 하더라.`, `${n}… 나쁜 애는 아닌데 좀 어색해.`],
    }[kind];
    return mk(v, fresh(v, L));
  });
  reg('t3_news', v => (S().log && S().log.length ? 1.2 : 0), v => {
    const st = S(); const ev = st.log.slice(-25).filter(e => e.imp >= 2 && !(e.who || []).includes(v.id)).pop();
    if (!ev) return mk(v, fresh(v, THOUGHTS));
    const t = W.niceNews ? W.niceNews(ev.text) : String(ev.text).replace(/^[^\s가-힣]+\s*/, '');
    return mk(v, fresh(v, [`들었어? ${t}`, `섬 소식 봤어? ${t} 놀랍지 않아?`, `방금 들은 얘긴데… ${t}`]), ['agree', 'ask', 'tease']);
  });
  reg('t3_food', v => ((v.hunger || 0) > 40 ? 2 : 0.8), v => {
    const a = pick(FOODS), b = pick(FOODS.filter(x => x !== a));
    return mk(v, fresh(v, [`갑자기 ${a} 먹고 싶다…`, `${a}이(가) 좋아, ${b}이(가) 좋아?`, `오늘 저녁은 무조건 ${a}야.`, `${a} 맛집 아는 데 있어?`, `${a} 생각하니까 배고파졌어.`].map(J)), ['agree', 'ask', 'tease']);
  });
  reg('t3_dream', v => (hour() < 12 ? 1.2 : 0.5), v => mk(v, `어젯밤 꿈에 ${J(pick(DREAM_WHO) + pick(DREAM_WHAT).replace(/^랑/, '(이)랑').replace(/^가/, '이(가)').replace(/^한테/, '한테'))}.`, ['ask', 'tease', 'deep']));
  reg('t3_whatif', v => 1.5, v => { const q = pick(WHATIF); return { text: apply(v, q.q), choices: q.a.map((a, i) => ({ k: 'w' + i, label: a })), data: { qi: WHATIF.indexOf(q) } }; },
    (v, k, data) => { const q = WHATIF[data.qi] || WHATIF[0]; const i = +String(k).slice(1) || 0; Soc.addFriend(v.id, P, 2, 1, '대화'); Sim.emote(v, '😆'); return { text: apply(v, q.r[i] || q.r[0]) }; });
  reg('t3_joke', v => (has(v, 'PRANKSTER') || speechOf(v) === 'dad' ? 2 : 0.6), v => { const j = pick(JOKES); return { text: apply(v, `퀴즈! ${j.q}`), choices: [{ k: 'know', label: '💡 "정답은…!"' }, { k: 'give', label: '🤷 "모르겠어"' }, { k: 'boo', label: '🥶 "썰렁해…"' }], data: { ji: JOKES.indexOf(j) } }; },
    (v, k, data) => { const j = JOKES[data.ji] || JOKES[0]; Soc.addFriend(v.id, P, k === 'boo' ? 0 : 2, 1, '퀴즈'); Sim.emote(v, k === 'boo' ? '😤' : '😆'); return { text: apply(v, k === 'boo' ? `썰렁하다니! 정답은 ${j.a} …웃어 줘.` : k === 'know' ? `오! 정답은 ${j.a} 맞혔어? 대단한데?` : `정답은~ ${j.a} 하하!`) }; });
  reg('t3_memory', v => { const m = W.mind ? W.mind(v) : null; return m && m.mem && m.mem.some(x => day() - x.day >= 1) ? 1.4 : 0; }, v => {
    const m = W.mind(v); const mem = pick(m.mem.filter(x => day() - x.day >= 1));
    const ago = day() - mem.day; const when = ago <= 1 ? '어제' : ago < 7 ? `${ago}일 전에` : '예전에';
    return mk(v, fresh(v, [`${when} ${mem.text}… 기억나?`, `있잖아, ${when} 일 아직도 생각나. ${mem.text}.`, `${mem.text}. 그때 진짜 고마웠어.`]), ['agree', 'deep', 'tease']);
  });
  reg('t3_compliment', v => (Soc.stageAtLeast(v.id, P, 'FRIEND') ? 1.0 : 0), v => mk(v, fresh(v, COMPLIMENT), ['agree', 'deep', 'tease']));
  reg('t3_thought', v => 1.0, v => mk(v, fresh(v, THOUGHTS), ['agree', 'ask', 'deep']));
  reg('t3_weather', v => 0.9, v => { const w = S().weather ? S().weather.type : 'sunny'; return mk(v, fresh(v, WEATHER_LINE[w] || WEATHER_LINE.sunny), ['agree', 'tease', 'ask']); });
  reg('t3_phrase', v => (v.castId && ISLE_CAST()[v.castId] ? 0.6 : 0), v => mk(v, ISLE_CAST()[v.castId].phrase));
  function ISLE_CAST() { const m = {}; for (const c of (window.ISLE && ISLE.CAST) || []) m[c.id] = c; return m; }

  // =========================================================
  // 5. 대화 메뉴 정리 · 자는 주민
  // =========================================================
  const asleep = v => !(v.wokeUntil > S().realT) && ((v.act && v.act.id === 'sleep') || (Sim.asleep && Sim.asleep(v, hour()) && v.loc === v.home));
  const oTalk = Soc.playerTalk;
  Soc.playerTalk = function (v) {
    if (v && !v.child && !v.balloon && asleep(v)) {
      v.talkingToPlayer = true; v.talkUntil = S().realT + 60;
      return { text: pick(['(새근새근… 깊이 잠들어 있다)', '쿨… 음냐… (자고 있다)', '(이불을 끌어안고 자고 있다)']), options: [{ id: 'wake', label: '🔔 살짝 깨우기' }, { id: 'bye', label: '🤫 조용히 두고 가기' }] };
    }
    return oTalk.apply(this, arguments);
  };
  const oOpts = Soc.talkOptions;
  Soc.talkOptions = function (v) {
    let O = oOpts.apply(this, arguments);
    try {
      if (!v || v.child) return O;
      if (asleep(v) && !v.balloon) return [{ id: 'wake', label: '🔔 살짝 깨우기' }, { id: 'bye', label: '🤫 조용히 두고 가기' }];
      // 개발자 정리: 첫 화면 · '다른 얘기'와 겹치는 '대화하기', 거의 안 쓰는 '별명 만들기', 짝사랑 없는 주민의 '부추기기', 깨끗한 방의 '방 좀 치워' 제거
      const room = S().rooms[v.home];
      O = O.filter(o => !(o.id === 'chat' || o.id === 'nickname'
        || (o.id === 'nudge' && !(v.crush && v.crush.target && v.crush.target !== P))
        || (o.id === 'cleanOrder' && !(room && room.trash && room.trash.length >= 3))));
    } catch (e) { /* */ }
    return O;
  };
  const oChoose = Soc.playerChoose;
  Soc.playerChoose = function (v, id, arg) {
    if (id === 'wake' && v) {
      v.act = null; v.pose = null; v.state = 'TALK_PLAYER'; v.wokeUntil = S().realT + 180;
      const cranky = has(v, 'CRANKY') || has(v, 'LAZY');
      Soc.addFriend(v.id, P, cranky ? -3 : -1, 0, '잠 깨움');
      Sim.emote(v, cranky ? '💢' : '😪');
      return { text: apply(v, cranky ? pick(['…지금 몇 시인 줄 알아? 왜 깨워…', '으으… 꿈 좋았는데…']) : pick(['으음… 너구나. 무슨 일이야?', '하암… 깜짝이야. 무슨 일 있어?'])), options: Soc.talkOptions(v) };
    }
    return oChoose.apply(this, arguments);
  };
})();
