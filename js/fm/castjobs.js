/* =========================================================
 *  고정 주민 30명의 직업별 근무지 · 근무 시간 · 월급
 *   - 근무 시간에는 그 장소로 출근해서 일하는 동작을 함 (실내는 가게 안 / 야외는 그 장소)
 *   - 근무 끝나면 그날 일당을 받음
 *   - 연인이 일하는 곳에 찾아가면 반가워함 (근무 중 대화 보너스)
 *   - 플레이어의 아이가 독립하면 성격에 맞는 직업 · 근무지를 정해 줌
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, D = FM.D, MAP = FM.MAP;
  if (!Sim) return;
  const S = () => Sim.get();
  const pick = a => a[(Math.random() * a.length) | 0];
  // 시간 h 가 [a, b) 안인지 (자정 넘김 허용: b > 24)
  const inWin = (h, a, b) => { const hh = h < a && b > 24 ? h + 24 : h; return hh >= a && hh < b; };
  const fmtH = x => { const h = Math.floor(x) % 24, m = Math.round((x % 1) * 60); return `${h}:${String(m).padStart(2, '0')}`; };

  // [근무지 장소 id, 시작, 끝, 쉬는 요일(0=월 … 6=일), 하는 일, 근무지 이름, 일당]
  const WD = [5, 6];
  const JOBS = {
    c01: ['cliff', 8, 16, WD, ['water_flowers', 'smell_flower', 'pull_weeds'], '노을 정원 꽃 가판대', 160],
    c02: ['conv', 15, 22, [2], null, '24시 편의점', 150],
    c03: ['observatory', 20, 25, [0], ['stargaze', 'fortune', 'candle'], '별빛 천문대 타로 부스', 170],
    c04: ['teahouse', 11, 19, [0], null, '달빛 차관', 210],
    c05: ['park', 8, 15, WD, ['observe_bugs', 'bug_catch', 'look_around'], '센트럴 파크 곤충 채집', 140],
    c06: ['farm', 7, 14, [6], ['water_flowers', 'pull_weeds', 'sweep'], '주민 텃밭 "초록 손"', 150],
    c07: ['arcade', 12, 20, [1], null, '네온 오락실 인형 코너', 150],
    c08: ['library', 9, 17, WD, null, '시립 도서관', 170],
    c09: ['arcade', 20, 26, [3], null, '네온 오락실 게임 대회석', 140],
    c10: ['photo', 11, 19, [0], null, '추억 사진관 "포토 블루"', 200],
    c11: ['cafe', 7, 15, [2], null, '카페 앙상블 베이커리', 190],
    c12: ['busk', 18, 22, [1], ['sing', 'play_guitar'], '야외 버스킹 공연장', 150],
    c13: ['cityhall', 8, 17, WD, null, '시티 행정 센터 자경단', 220],
    c14: ['workshop', 9, 15, [6], null, '마을 공방 뜨개 교실', 140],
    c15: ['home', 10, 16, [6], ['write_poem', 'read_book', 'daydream'], '집 (재택 연애소설 집필)', 180],
    c16: ['plaza', 15, 19, [6], ['jog', 'workout', 'stretch'], '중앙 광장 축구 연습', 120],
    c17: ['workshop', 8, 17, WD, null, '마을 공방 목공소', 200],
    c18: ['fishpier', 6, 12, [3], ['fish', 'watch_sea'], '낚시 부두 "은빛 바늘"', 160],
    c19: ['skylounge', 16, 24, [0], null, '스카이라운지 "네뷸라"', 260],
    c20: ['library', 10, 18, [2, 6], null, '시립 도서관 헌책 코너', 150],
    c21: ['club', 21, 28, [0, 1], null, '라이브 클럽 "더 베이스먼트" DJ 부스', 230],
    c22: ['park', 7, 15, WD, ['water_flowers', 'pull_weeds', 'sweep'], '센트럴 파크 정원 관리', 170],
    c23: ['ferry', 8, 17, WD, ['look_around', 'watch_sea'], '페리 터미널 관제실', 220],
    c24: ['alley', 10, 17, [4], ['paint', 'sketch', 'look_around'], '미식 골목 벽화 작업', 150],
    c25: ['farm', 7, 15, [5], ['water_flowers', 'pull_weeds', 'eat_snack'], '주민 텃밭 과수원', 140],
    c26: ['ferry', 6, 15, [6], ['look_around', 'watch_sea', 'polite_bow'], '페리 선착장 (선장)', 240],
    c27: ['photo', 10, 19, [3], null, '추억 사진관 "포토 블루"', 140],
    c28: ['medical', 9, 18, WD, null, '메디컬 센터 24시 약국', 200],
    c29: ['waterfall', 9, 16, [0], ['look_around', 'alone_sit', 'observe_bugs'], '망각의 수련 폭포 숲길', 160],
    c30: ['mall', 11, 20, [2], null, '플래티넘 타워 편집숍', 250],
  };
  // 독립한 아이: 메인 성격 → 직업
  const CAREER = {
    ROMANTIC: ['꽃집 플로리스트', 'cliff', 8, 16, ['water_flowers', 'smell_flower']], ATHLETIC: ['광장 체육 코치', 'plaza', 8, 15, ['jog', 'workout']],
    SCHOLARLY: ['도서관 사서', 'library', 9, 17, null], LAZY: ['카페 제빵사', 'cafe', 8, 15, null], EXTROVERT: ['편집숍 매니저', 'mall', 11, 19, null],
    INTROVERT: ['찻집 직원', 'teahouse', 11, 19, null], SNOB: ['스카이라운지 소믈리에', 'skylounge', 16, 23, null], CRANKY: ['공원 정원사', 'park', 7, 15, ['water_flowers', 'pull_weeds']],
    ARTISTIC: ['벽화 화가', 'alley', 10, 17, ['paint', 'sketch']], ANXIOUS: ['약국 약사', 'medical', 9, 18, null], ADVENTURER: ['낚시꾼', 'fishpier', 6, 12, ['fish', 'watch_sea']],
    FASHIONISTA: ['패션 디자이너', 'mall', 11, 19, null], MUSICIAN: ['버스킹 가수', 'busk', 18, 22, ['sing', 'play_guitar']], GAMER: ['오락실 직원', 'arcade', 13, 21, null],
    LEADER: ['행정 센터 공무원', 'cityhall', 8, 17, null], CLUMSY: ['텃밭 농부', 'farm', 7, 14, ['water_flowers', 'pull_weeds']], NATURE: ['숲 해설가', 'waterfall', 9, 16, ['look_around', 'alone_sit']],
    ELEGANT: ['찻집 다도 선생님', 'teahouse', 11, 18, null], CHIC: ['사진작가', 'photo', 11, 19, null], PURE: ['꽃집 플로리스트', 'cliff', 8, 16, ['water_flowers', 'smell_flower']],
    FRESH: ['편의점 점장', 'conv', 9, 17, null], BEAGLE: ['사진관 조수', 'photo', 10, 18, null], MYSTIC: ['타로 리더', 'observatory', 20, 25, ['stargaze', 'fortune']],
    CHARISMA: ['페리 관제사', 'ferry', 8, 17, ['look_around', 'watch_sea']], HIP: ['클럽 DJ', 'club', 21, 27, null], CLASSIC: ['공방 장인', 'workshop', 9, 16, null],
    CUTIE: ['인형 가게 점원', 'arcade', 12, 20, null], DANDY: ['스카이라운지 지배인', 'skylounge', 16, 23, null], TOMBOY: ['곤충 채집가', 'park', 8, 15, ['observe_bugs', 'bug_catch']],
  };

  const jobOf = v => v && (v.castWork || (v.castId && JOBS[v.castId] ? { place: JOBS[v.castId][0], from: JOBS[v.castId][1], to: JOBS[v.castId][2], off: JOBS[v.castId][3], acts: JOBS[v.castId][4], where: JOBS[v.castId][5], pay: JOBS[v.castId][6], title: v.castJob } : null));
  const placeName = id => id === 'home' ? '집' : (MAP.P[id] ? MAP.P[id].name : id);
  const Job = (FM.CastJobs = { JOBS, CAREER, jobOf });
  // 지금 근무 중인지
  Job.working = function (v, hRaw) {
    const j = jobOf(v); if (!j || v.child) return false;
    const st = S(); const h = hRaw != null ? hRaw : (st.time % 1440) / 60;
    const wd = Sim.time.weekday();
    // 자정 넘는 근무: 새벽 시간은 전날 요일 기준
    const dayIdx = j.to > 24 && h < j.to - 24 ? (wd + 6) % 7 : wd;
    if ((j.off || []).includes(dayIdx)) return false;
    return inWin(h, j.from, j.to);
  };
  Job.label = v => { const j = jobOf(v); return j ? `${j.title || ''} · ${j.where} (${fmtH(j.from)}~${fmtH(j.to)})` : null; };
  Job.placeName = placeName;

  // ---------------------------------------------------------
  // 하루 일정: 근무 시간에는 근무지로
  // ---------------------------------------------------------
  const oBlock = Sim.block;
  Sim.block = function (v) {
    const b = oBlock(v);
    try {
      if (!b || b.k === 'sleep' || b.k === 'hospital' || v.child) return b;
      const j = jobOf(v); if (!j || !Job.working(v)) return b;
      const label = `💼 ${j.where} 근무 중`;
      if (j.place === 'home') return { k: 'home', acts: j.acts || ['home_life'], label };
      const P = MAP.P[j.place]; if (!P) return b;
      if (P.interior) return { k: 'go', place: j.place, inside: true, label, work: true };
      return { k: 'go', place: j.place, tags: P.tags, acts: j.acts || ['look_around'], label, work: true };
    } catch (e) { return b; }
  };

  // 직업 이름 (프로필 · 주민 카드)
  const JN = Sim.JOB_NAMES;
  function applyJob(v) {
    const j = jobOf(v); if (!j) return;
    if (v.castId === 'c28') v.job = 'pharmacist';
    else v.job = 'cast_' + (v.castId || v.id);
    JN[v.job] = `${j.title || ''} — ${j.where}`;
  }
  const oAssign = Sim.assignJobs;
  Sim.assignJobs = function () {
    oAssign.apply(this, arguments);
    for (const v of S().villagers) applyJob(v);
  };
  const ensureAll = () => { const st = S(); if (!st) return; for (const v of st.villagers) { if (!v.castId) { const c = (window.ISLE && ISLE.CAST || []).find(x => x.id === v.id); if (c) { v.castId = c.id; v.castJob = c.job; v.gender = c.gender; v.age = c.age; } } applyJob(v); } };

  // ---------------------------------------------------------
  // 일당 · 출근 소식
  // ---------------------------------------------------------
  FM.bus.on('hour', h => {
    try {
      const st = S(); if (!st) return;
      for (const v of st.villagers) {
        const j = jobOf(v); if (!j || v.child) continue;
        const end = Math.round(j.to) % 24;
        if (h === end && Job.working(v, ((h + 23.9) % 24))) {
          v.coins = (v.coins || 0) + j.pay; v.stats_pay = (v.stats_pay || 0) + j.pay;
          if (v.debt > 0) { const pd = Math.min(v.debt, Math.floor(v.coins / 2)); v.debt -= pd; v.coins -= pd; }
          v.workDays = (v.workDays || 0) + 1;
        }
      }
    } catch (e) { console.error('castjobs', e); }
  });

  // ---------------------------------------------------------
  // 대화: 근무 중 인사 · 연인이 찾아오면 반가워함 · 도시락 전해 주기
  // ---------------------------------------------------------
  const Soc = FM.Soc;
  const WORK_LINES = {
    c01: '어서 오세요~ 오늘 핀 꽃 보여드릴까요?', c02: '어서오세요! 1+1 행사 중이에요~', c03: '별이 당신 카드를 고르고 있어…', c04: '따뜻한 차 한 잔 내어 드릴까요?',
    c05: '쉿! 지금 사슴벌레 노리는 중이야!', c06: '흙 묻었으니까 조심해~', c07: '인형 하나 뽑아 볼래? 오늘 확률 좋대!', c08: '…도서관에서는 조용히요. (속삭임)',
    c09: '잠깐만, 이 판만 끝나고!', c10: '움직이지 마. …찰칵. 좋네.', c11: '갓 구운 크루아상 나왔어~ 하나 먹어 봐!', c12: '신곡 들으러 왔구나! 맨 앞에 앉아!',
    c13: '순찰 중 이상 무! 너도 조심해!', c14: '우리 강아지 왔니? 목도리 하나 떠 줄까?', c15: '…지금 마감 중이라. 그래도 와 줘서 좋다.', c16: '패스 받아! …아 미안, 일하던 중이었지!',
    c17: '톱밥 날리니까 뒤로 물러서~ 하하!', c18: '…쉿. 물고기 도망가.', c19: '어서 오십시오. 오늘의 추천 코스를 안내해 드리죠.', c20: '아, 어서 오세요… 찾는 책 있으세요?',
    c21: '요~ 오늘 셋리스트 장난 아니야!', c22: '…뭐야, 일하는 거 구경 왔냐?', c23: '입항 예정 정상. 무슨 일이야?', c24: '이 벽에 고래를 그릴 거야. 하늘에서 헤엄치는 고래!',
    c25: '어어? 사과가 또 굴러간다~!', c26: '승선을 환영합니다. 오늘 바다는 잔잔합니다.', c27: '깜짝 사진 찍었지롱! ㅋㅋ', c28: '아, 어서 오세요… 어디 아프신 건 아니죠?',
    c29: '저기 봐, 물총새야. 소리 내지 말고.', c30: '이 셔츠 오늘 들어온 거야. 너한테 딱인데?',
  };
  if (Soc) {
    const oOpts = Soc.talkOptions;
    Soc.talkOptions = function (v) {
      const O = oOpts.apply(this, arguments);
      try {
        if (v && !v.child && Job.working(v) && Soc.partnerOf(v.id) === 'P') {
          const food = Object.keys(S().player.inv).find(k => S().player.inv[k] > 0 && FM.Consume && FM.Consume.isFood(k));
          const bi = O.findIndex(o => o.id === 'bye');
          O.splice(bi < 0 ? O.length : bi, 0, { id: 'workLunch', label: food ? `🍱 일하는 중인 연인에게 ${D.ITEMS[food].name} 건네주기` : '🍱 도시락 건네주기 (먹을 것 필요)', disabled: !food, hint: '가방에 먹을 것이 있어야 해요', arg: food });
        }
      } catch (e) { /* */ }
      return O;
    };
    const oChoose = Soc.playerChoose;
    Soc.playerChoose = function (v, id, arg) {
      if (id === 'workLunch' && v && arg) {
        Soc.takeItem(arg);
        Soc.addRomance(v.id, 'P', 10, '일터로 찾아온 도시락');
        Soc.addFriend(v.id, 'P', 4, 6, '도시락');
        v.hunger = Math.max(0, (v.hunger || 0) - 40);
        Sim.emote(v, '🥰');
        if (FM.Will) FM.Will.remember(v, 'date', '일하는데 도시락을 가져다줬어');
        Sim.log('romance', `🍱 ${S().player.name}이(가) ${jobOf(v).where}에서 일하는 ${v.name}에게 도시락을 건넸어요`, [v.id, 'P'], 1);
        return { text: FM.josa(`어?! 일하는 데까지 와 준 거야? …고마워, 진짜 힘 난다. (${D.ITEMS[arg].name}을(를) 받았다)`), options: Soc.talkOptions(v) };
      }
      return oChoose.apply(this, arguments);
    };
    // 근무 중 첫인사
    const oTalk = Soc.playerTalk;
    Soc.playerTalk = function (v) {
      const r = oTalk.apply(this, arguments);
      try {
        if (r && v && !v.child && !v.balloon && Job.working(v) && WORK_LINES[v.castId] && Math.random() < 0.6) {
          const lover = Soc.partnerOf(v.id) === 'P';
          if (lover && v.workVisitDay !== Sim.time.day()) { v.workVisitDay = Sim.time.day(); Soc.addRomance(v.id, 'P', 4, '일터로 찾아옴'); }
          r.text = (lover ? '(일하다가 너를 보고 눈이 반짝) ' : '') + WORK_LINES[v.castId] + ' ' + r.text;
        }
      } catch (e) { /* */ }
      return r;
    };
  }

  // ---------------------------------------------------------
  // 플레이어 아이가 독립하면 성격에 맞는 직업
  // ---------------------------------------------------------
  FM.bus.on('log', e => {
    try {
      if (!e || e.type !== 'baby' || !/독립/.test(e.text || '')) return;
      for (const id of e.who || []) {
        const v = Sim.byId(id); if (!v || v.child || v.castWork || !v.grownUp) continue;
        const c = CAREER[v.keys.L1] || pick(Object.values(CAREER));
        v.castWork = { place: c[1], from: c[2], to: c[3], off: [6], acts: c[4], where: placeName(c[1]).replace(/\s*["“].*$/, ''), pay: 180, title: c[0] };
        v.castJob = c[0];
        applyJob(v);
        Sim.log('baby', `💼 ${v.name}이(가) '${c[0]}'(으)로 첫 출근을 시작해요! 근무지: ${v.castWork.where}`, [v.id], 2);
      }
    } catch (er) { console.error('castjobs', er); }
  });

  FM.bus.on('villagers', () => { try { ensureAll(); } catch (e) { /* */ } });
  const oLoad = Sim.load;
  if (oLoad) Sim.load = function () { const r = oLoad.apply(this, arguments); try { ensureAll(); } catch (e) { /* */ } return r; };
  Job.ensureAll = ensureAll;
})();
