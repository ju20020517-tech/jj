/* =========================================================
 *  NPC 라이프 — 가게 직원들의 근무 동선 · 병원 간호사 2명 · 직원과 대화하고 대화로 물건 사기
 *  + 건물 안에서 성격대로 어울리는 주민들 (합석 · 수다 · 건배 · 위로 · 말다툼 · 박수)
 *  + 우울감 (싸움 · 이별 · 실연 · 외로움 → 누적) : 60↑ 집에 틀어박힘, 85↑ 메디컬 센터 입원
 *  + 싸움에서 진 주민은 메디컬 센터에 잠깐 입원 (타박상)
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, D = FM.D;
  const S = () => Sim.get();
  const P = 'P';
  const has = (v, k) => Sim.has(v, k);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const chance = p => Math.random() < p;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const R = Math.PI / 180;
  const hour = () => Sim.time.hour();
  const day = () => Sim.time.day();
  const sty = (v, t) => (FM.L && FM.L.sty && v && !v.staff ? FM.L.sty(v, t) : t);
  const Ev = () => FM.Ev;
  const NL = (FM.NpcLife = {});

  // =========================================================
  // 1. 새 직원: 간호사 2명 + 레스토랑 웨이터
  // =========================================================
  const NEW_STAFF = [
    { id: 's_nurse1', name: '간호사 미소', role: 'nurse', loc: 'med_in', x: 2.55, z: 1.6, ry: 0, look: { species: 'sheep', top: 'dress', shirt: 0xffd6e4, shirt2: 0xffffff, hat: 'headband', hatColor: 0xffffff } },
    { id: 's_nurse2', name: '간호사 하늘', role: 'nurse', loc: 'med_in', x: 2.2, z: -0.8, ry: 0, look: { species: 'cat', top: 'dress', shirt: 0xcfe8ff, shirt2: 0xffffff, hat: 'headband', hatColor: 0xffffff, fur: 0xf4efe6 } },
    { id: 's_pharm', name: '약사 선생님', role: 'pharmacist', loc: 'med_in', x: 8.35, z: 2.6, ry: -90 * R, look: { species: 'human', gender: 'F', lashes: true, hairStyle: 'bob', hair: 0x3a2418, top: 'apron', shirt: 0xffffff, shirt2: 0x2f9a5a, glasses: 'round', eyes: 'dot', mouth: 'smile' } },
    { id: 's_waiter', name: '웨이터 제이', role: 'waiter', loc: 'sky_in', x: 7.1, z: 5.0, ry: -40 * R, look: { species: 'dog', top: 'vest', shirt: 0x1a1a22, shirt2: 0xffffff } },
  ];
  // 얼굴이 벽/등 쪽을 보던 직원들 자리 보정 (카메라 · 손님 쪽을 보도록)
  const FIX = { s_barista: [0, -3.8, 0], s_tea: [-3.9, -1.45, 0], s_pub: [3.4, -4.15, 0], s_clerk2: [-3.4, 1.3, 60], s_dj: [6.95, 0.2, -60], s_teacher: [-0.8, -4.2, 0], s_grocer: [-1.3, 0.85, 0], s_stylist: [5.2, -5.15, 0] };
  function addStaff() {
    const E = Ev(); if (!E || !E.staff) return;
    for (const d of NEW_STAFF) {
      if (E.staff.some(s => s.id === d.id)) continue;
      E.staff.push(Object.assign({}, d, { home: d.loc, sx: d.x, sz: d.z, state: 'INTERACT_OBJ', pose: 'stand', bubble: null, emote: null, route: null, sceneId: null, keys: { L1: 'SNOB', L2: 'DILIGENT', L3: 'FORMAL', L4: 'CLEAN' }, stats: { speed: 0, idle: [3, 5] }, status: {}, staff: true, look: window.ISLE && ISLE.normalizeLook ? ISLE.normalizeLook(d.look) : d.look }));
    }
    for (const [id, nm] of Object.entries({ s_pub: '반점 사장님', s_tea: '다실 주인장' })) { const s = E.staffById(id); if (s) s.name = nm; }
    for (const [id, [x, z, f]] of Object.entries(FIX)) { const s = E.staffById(id); if (s) { s.x = s.sx = x; s.z = s.sz = z; s.ry = f * R; } }
    for (const s of E.staff) s.np = null;
  }
  addStaff();
  const oLoad = Sim.load;
  Sim.load = function () { const r = oLoad.apply(this, arguments); addStaff(); return r; };

  // =========================================================
  // 2. 직원 근무 동선 — 자리(st) · 작업 지점(spots) · 카운터 밖 통로(out) · 서빙
  //    spot: [x, z, 방향(도, 0 = 카메라 쪽 +z), 포즈, 소품, 이름, 혼잣말, 카운터 밖이면 1]
  // =========================================================
  const sp = (x, z, f, pose, prop, label, say, o) => ({ x, z, f, pose, prop: prop || null, label, say: say || null, o: o ? 1 : 0 });
  const WORK = {
    s_barista: { st: sp(0, -3.8, 0, 'stand'), inside: (x, z) => z < -3.3 && Math.abs(x) < 0.8, out: [[0.55, -3.45], [1.25, -3.45], [1.5, -2.6]],
      spots: [sp(0.4, -3.75, 0, 'cook', 'teacup', '커피 내리는 중', ['에스프레소 한 샷 추출~ ☕', '라떼 아트 도전!', '우유 스팀 치이익~']), sp(-0.4, -3.75, 0, 'cook', 'pudding', '디저트 담는 중', ['갓 구운 스콘 나왔어요!', '수플레 팬케이크 굽는 중~']), sp(-3.9, 3.0, -150, 'water', 'wateringCan', '화분 물 주는 중', null, 1), sp(1.8, -0.9, 0, 'sweep', 'broom', '바닥 청소', null, 1)],
      serve: ['cafe', 'sit'], tray: 'teacup', lines: ['주문하신 라떼 나왔습니다~ ☕', '수플레 팬케이크 나왔어요! 🥞', '맛있게 드세요 😊', '리필 필요하시면 불러 주세요~'] },
    s_chef: { st: sp(0, -2.05, 0, 'stand'), lane: { axis: 'z', v: -2.05, min: -2.1, max: 2.1, f: 0 },
      spots: [sp(-1.4, -2.05, 180, 'cook', 'spatula', '초밥 쥐는 중', ['샤리는 체온으로!']), sp(1.4, -2.05, 180, 'cook', null, '생선 손질 중', ['오늘 참치 상태 최고!']), sp(-0.7, -2.05, 0, 'cook', null, '초밥 내는 중', ['참치 뱃살 한 접시!', '연어 초밥 나왔습니다!']), sp(0.8, -2.05, 0, 'cook', 'bowl', '미소국 담는 중')],
      serve: ['sushi', 'sit'], tray: 'bowl', lines: ['오마카세 한 점 드려요! 🍣', '장어 초밥 서비스~', '와사비 괜찮으세요?', '이건 오늘 들어온 성게입니다!'] },
    s_pub: { st: sp(3.4, -4.15, 0, 'stand'), inside: (x, z) => z < -3.2 && x > 1.9, out: [[1.6, -4.15], [1.4, -2.8]],
      spots: [sp(2.5, -4.15, 0, 'cook', 'bowl', '탕수육 튀기는 중', ['탕수육 소스는 부먹이지!']), sp(4.4, -4.15, 0, 'cook', 'spatula', '짜장 볶는 중', ['불맛 제대로 입혀야지!']), sp(1.2, -3.0, 160, 'cook', null, '딤섬 찌는 중', ['딤섬 다 쪄졌다~'], 1), sp(-3.9, 3.2, -90, 'reach', 'teacup', '보이차 따르는 중', null, 1)],
      serve: ['pub'], tray: 'bowl', lines: ['탕수육 나왔어요~ 🥢', '꿔바로우 서비스!', '짬뽕 국물 뜨거우니 조심!', '딤섬 따끈할 때 드세요!'] },
    s_dj: { st: sp(6.95, 0.2, -60, 'stand'), lane: { axis: 'x', v: 6.95, min: -1.6, max: 2.0, f: -70 },
      spots: [sp(6.95, -1.2, -60, 'cook', 'drink', '칵테일 셰이킹', ['셰이킹~ 셰이킹~ 🍸']), sp(6.95, 1.5, -60, 'cook', 'drink', '잔 닦는 중', ['오늘 밤 추천은 블루문 칵테일']), sp(6.95, 0.6, -40, 'stand', null, '재즈 감상', ['이 색소폰 솔로... 좋다 🎷'])],
      serve: ['mocktail'], tray: 'drink', lines: ['블루문 칵테일 나왔습니다 🍸', '논알콜 모히또 한 잔!', '오늘 연주 멋지죠?', '얼음 하나 더 넣어 드렸어요'] },
    s_clerk2: { st: sp(-3.4, 1.3, 60, 'stand'), inside: (x, z) => x < -3.0 && z > -0.2, out: [[-3.5, -0.1]],
      spots: [sp(-3.65, -1.2, -90, 'reach', 'snack', '과자 진열 중', ['유통기한 체크 완료!'], 1), sp(-1.8, -1.95, 180, 'reach', 'can', '음료 채우는 중', null, 1), sp(-1.2, 0.2, 0, 'sweep', 'broom', '바닥 청소', ['어서오세요~!'], 1), sp(1.1, 1.0, 0, 'sweep', 'broom', '바닥 청소', null, 1), sp(-3.4, 1.9, 60, 'type', null, '포스기 정산', ['삑! 삑!'])],
      serve: ['eat'], tray: 'kimbap', lines: ['전자레인지 다 됐어요~', '삼각김밥 1+1 챙겨 가세요!'] },
    s_tea: { st: sp(-3.9, -1.45, 0, 'cook', 'teacup'),
      spots: [sp(-3.5, -1.45, 0, 'cook', 'teacup', '말차 격불 중', ['말차를 곱게 풀어요... 🍵']), sp(-4.3, -1.45, 0, 'cook', null, '무쇠 주전자 물 데우는 중'), sp(-1.2, -2.7, 180, 'water', 'wateringCan', '안뜰 정원 물 주기', ['이끼가 촉촉해야 예뻐요']), sp(1.2, -2.6, 180, 'reach', null, '석등 불 켜기')],
      via: { '-1.2,-2.7': [[-0.4, -1.5], [-0.4, -2.5]], '1.2,-2.6': [[0.4, -1.5], [0.4, -2.4]] }, serve: ['tea_heal'], tray: 'teacup', lines: ['따뜻한 말차 한 잔 드세요 🍵', '화과자도 곁들여 보세요~', '코타츠 따뜻하죠?', '천천히 쉬다 가세요'] },
    s_teacher: { st: sp(-0.8, -4.2, 0, 'talk', 'book'),
      spots: [sp(-1.8, -4.45, 180, 'write', 'pen', '판서 중', ['자, 칠판 보세요~']), sp(0.2, -4.45, 180, 'write', 'pen', '판서 중'), sp(1.2, -3.4, 30, 'point', null, '화이트보드 설명', ['이 단어 따라 읽어 볼까요?']), sp(4.6, -2.95, 0, 'write', 'pen', '채점 중', ['오, 100점!']), sp(-2.7, 0.7, 0, 'look', 'book', '책상 사이 순회', null)],
      serve: ['class'], tray: null, lines: ['잘하고 있어요! 👍', '여기 글씨 예쁘다~', '다 풀었으면 손 들기!'] },
    s_librarian: { st: sp(-4.2, 3.8, 0, 'stand'),
      spots: [sp(-6.35, -6.1, 180, 'reach', 'book', '책 정리 중'), sp(-2.45, -6.1, 180, 'reach', 'book', '책 정리 중'), sp(-0.4, -3.1, 180, 'reach', 'book', '반납 도서 꽂기'), sp(-6.2, 4.85, 0, 'reach', 'book', '북 트롤리 정리', ['반납 도서가 한가득!']), sp(-3.6, 3.75, 0, 'write', 'pen', '대출 기록')],
      via: { '-6.2,4.85': [[-5.6, 3.9]] }, serve: ['read_book', 'study'], tray: 'book', lines: ['찾으시던 책 여기 있어요 📚', '이 책도 추천드려요~', '반납일은 일주일 뒤예요'] },
    s_clerk: { st: sp(-4.0, -3.8, 0, 'stand'), inside: (x, z) => z < -2.6 && x > -5.5 && x < -2.5, out: [[-5.9, -3.8], [-5.9, -2.1]],
      spots: [sp(-5.0, -3.8, 0, 'type', null, '민원 처리 중', ['도장 쾅!']), sp(-3.0, -3.8, 0, 'write', 'pen', '서류 작성'), sp(-7.0, 1.6, 180, 'reach', null, '번호표 채우기', null, 1)],
      serve: ['wait'], tray: 'postit', lines: ['다음 번호 고객님~', '서류 여기 도장 찍어 주세요', '잠시만 기다려 주세요!'] },
    s_judge: { st: sp(4.5, -4.2, 0, 'stand'), spots: [sp(3.9, -4.3, 0, 'read', 'book', '판례 검토'), sp(5.1, -4.3, 0, 'write', 'pen', '판결문 작성', ['음... 흥미로운 사건이군'])] },
    s_boss: { st: sp(6.4, -6.15, 0, 'stand'), inside: (x, z) => x > 5 && z < -5.6, out: [[8.1, -6.1], [8.1, -3.8]],
      spots: [sp(-8.95, -4.3, -90, 'drink', 'teacup', '커피 한 잔', ['커피가 없으면 일이 안 돼...'], 1), sp(-8.0, -5.6, 180, 'point', null, '주간 회의 준비', ['이번 주 목표는 이거야!'], 1), sp(5.6, -6.1, 0, 'read', 'book', '결재 서류 검토', ['음... 반려!']), sp(7.2, -6.1, 0, 'type', null, '메일 확인')],
      serve: ['work_desk', 'copier'], tray: null, lines: ['이 보고서 오늘까지 되지?', '오, 잘하고 있네! 👍', '회의 10분 뒤에 시작!', '다들 힘내자고!'] },
    s_grocer: { st: sp(-1.3, 0.85, 0, 'stand'),
      spots: [sp(-4.3, 0.75, 0, 'reach', null, '아이스크림 채우기'), sp(-1.2, -1.9, -90, 'reach', 'bag', '빵 진열', ['갓 구운 식빵 나왔어요~']), sp(-0.35, -3.2, -90, 'reach', 'drink', '주스 채우기'), sp(-3.3, 3.0, 0, 'reach', 'apple', '과일 진열', ['사과 특가 세일!']), sp(-0.8, 3.7, 0, 'water', 'wateringCan', '꽃 물 주기')],
      via: { '-3.3,3': [[-3.0, 0.8], [-3.0, 2.9]], '-0.8,3.7': [[0.2, 0.6], [0.2, 3.7]] }, serve: ['shop'], tray: 'bag', lines: ['봉투 필요하세요?', '이거 오늘 특가예요!', '포인트 적립해 드릴게요~'], near: [-6, 1.5, -4, 5] },
    s_stylist: { st: sp(5.2, -5.15, 0, 'stand'), inside: (x, z) => x > 3.9 && x < 6.5 && z < -4.7, out: (tx) => (tx < 5.2 ? [[3.6, -5.0]] : [[6.8, -5.0]]),
      spots: [sp(2.35, -4.6, -90, 'reach', null, '옷 정리 중', ['신상 원피스 들어왔어요~'], 1), sp(8.05, -4.6, 90, 'reach', null, '옷 정리 중', null, 1), sp(2.2, -2.2, 150, 'reach', null, '모자 진열', null, 1), sp(4.6, -5.2, 0, 'write', 'pen', '재고 기록')],
      serve: ['shop', 'tryon', 'mirror', 'fashion_war'], tray: null, lines: ['손님 너무 잘 어울려요! ✨', '그 색이 딱이에요~', '사이즈 하나 작은 걸로 드릴까요?', '이건 이번 시즌 신상이에요!'], near: [0, 10, -7, 0] },
    s_doctor: { st: sp(-7.6, -3.3, 90, 'stand'), inside: (x, z) => x < -3.1 && z < -2.2, out: [[-3.6, -1.9], [-3.6, 1.2]],
      spots: [sp(-8.1, -4.5, -90, 'type', null, '진료 기록 입력'), sp(-6.0, -3.3, 180, 'write', 'pen', '진찰'), sp(-7.3, -6.0, 180, 'reach', 'pill', '약장 확인')],
      serve: ['hospital', 'wait', 'visit'], tray: 'thermometer', rounds: true, lines: ['상태 좀 볼게요~ 🩺', '많이 좋아졌네요!', '푹 쉬는 게 제일 좋은 약이에요', '오늘은 열이 내렸어요'] },
    s_pharm: { st: sp(8.35, 2.6, -90, 'stand'), inside: (x, z) => x > 7.9 && z > 1.4 && z < 5.3, out: [[8.4, 5.6], [6.8, 5.6]],
      spots: [sp(8.95, 2.0, 90, 'reach', 'pill', '약 꺼내는 중', ['감기약 여기 있어요~']), sp(8.95, 4.5, 90, 'reach', 'pill', '약 정리', null), sp(8.35, 3.5, -90, 'write', 'pen', '처방전 확인')],
      tray: 'pill', lines: ['식후 30분에 드세요 💊', '이 약은 졸릴 수 있어요~', '물 많이 드시고 푹 쉬세요', '영양제도 하나 챙겨 드릴까요?'] },
    s_nurse1: { st: sp(2.55, 1.6, 0, 'type'), inside: (x, z) => z < 2.0, out: [[0.0, 1.2], [0.0, 3.7]],
      spots: [sp(3.6, 0.85, 0, 'reach', 'pill', '처치 카트 정리', ['주사기 소독 완료!']), sp(1.2, 1.55, 0, 'write', 'pen', '차트 정리'), sp(-2.3, 4.55, 90, 'reach', null, '세면대 정리', null, 1)],
      serve: ['wait', 'hospital', 'visit'], tray: 'thermometer', rounds: true, lines: ['체온 잴게요~ 🌡️', '곧 진료 들어가실게요!', '링거 거의 다 들어갔네요', '불편한 곳 있으면 부르세요 💗'] },
    s_nurse2: { st: sp(2.2, -0.8, 0, 'stand'),
      spots: [sp(1.4, -3.4, 180, 'reach', null, '링거 교체', ['수액 교체해 드릴게요']), sp(3.6, 0.85, 0, 'reach', 'pill', '약 준비'), sp(-1.2, -3.65, 180, 'reach', null, '침대 시트 정리'), sp(8.1, 1.4, 180, 'reach', 'thermometer', '처치 준비')],
      serve: ['hospital', 'visit'], tray: 'pill', rounds: true, lines: ['약 드실 시간이에요 💊', '혈압 재 볼게요~', '오늘 표정이 밝아 보여요!', '물 많이 드세요~'] },
    s_waiter: { st: sp(7.1, 5.0, -40, 'stand'),
      spots: [sp(-4.9, 4.7, 0, 'reach', 'pudding', '디저트 카트 정리', ['오늘의 디저트는 마카롱!']), sp(-6.0, 1.0, 180, 'reach', 'drink', '샴페인 타워 점검'), sp(7.4, 5.0, -60, 'write', 'pen', '예약 장부 확인', ['오늘 저녁 예약 만석이네요!'])],
      serve: ['dine', 'mocktail', 'sofa'], tray: 'drink', lines: ['주문하신 스테이크 나왔습니다 🍽️', '와인 한 잔 더 드릴까요?', '오늘의 디저트는 마카롱이에요', '야경 좋은 자리로 모셨어요 ✨'] },
  };
  NL.WORK = WORK;

  // 직원 한 명의 상태 머신
  const inside = (w, x, z) => !!(w.inside && w.inside(x, z));
  function outPath(w, tx) { return typeof w.out === 'function' ? w.out(tx) : (w.out || []); }
  function pathTo(s, w, t) {
    const pts = [];
    const from = inside(w, s.x, s.z), to = inside(w, t.x, t.z);
    if (w.out && from !== to) { const o = outPath(w, from ? t.x : s.x); pts.push(...(from ? o : o.slice().reverse())); }
    const via = w.via && w.via[`${+t.x.toFixed(2)},${+t.z.toFixed(2)}`];
    if (via) pts.push(...via);
    pts.push([t.x, t.z]);
    return pts;
  }
  function roomClamp(iid, x, z) { const I = FM.INTERIORS[iid]; if (!I) return [x, z]; return [clamp(x, -I.w / 2 + 0.45, I.w / 2 - 0.45), clamp(z, -I.d / 2 + 0.45, I.d / 2 - 0.45)]; }
  const faceTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
  const busyStaff = s => s.sceneId || s.loc === 'island' || !WORK[s.id];
  // 서빙할 손님 고르기 (앉아서 먹고 마시는 · 입원한 · 일하는 주민)
  function serveTarget(s, w) {
    if (!w.serve) return null;
    const rt = S().realT;
    const c = S().villagers.filter(v => v.loc === s.loc && !v.moving && !(v.route && v.route.length) && !v.sceneId && v.act && w.serve.includes(v.act.id) && !(v._servedT > rt) && (!w.near || (v.x > w.near[0] && v.x < w.near[1] && v.z > w.near[2] && v.z < w.near[3])));
    if (!c.length) return null;
    return pick(c);
  }
  function standBeside(s, w, v) {
    if (w.lane) { const L = w.lane; if (L.axis === 'z') return { x: clamp(v.x, L.min, L.max), z: L.v, f: L.f, lane: true }; return { x: L.v, z: clamp(v.z, L.min, L.max), f: L.f, lane: true }; }
    const f = v.ry || 0;
    // 손님의 옆 (0.7m) 중 직원 쪽에 가까운 쪽
    const sx = Math.cos(f), sz = -Math.sin(f);
    const a = { x: v.x + sx * 0.7, z: v.z + sz * 0.7 }, b = { x: v.x - sx * 0.7, z: v.z - sz * 0.7 };
    const o = Math.hypot(a.x - s.x, a.z - s.z) < Math.hypot(b.x - s.x, b.z - s.z) ? a : b;
    const [x, z] = roomClamp(v.loc, o.x, o.z);
    return { x, z };
  }
  function setSpotPose(s, t) {
    s.pose = t.pose || 'stand'; s.prop = t.prop || null;
    s.act = t.seatH ? { id: 'staff_sit', t: 1e9, seatH: t.seatH } : (s.act && s.act.id === 'anchor' ? s.act : null);
  }
  function go(s, w, t, kind, data) {
    const n = s.np;
    n.path = pathTo(s, w, t); n.goal = t; n.kind = kind; n.data = data || null;
    s.pose = null; s.act = null; s.prop = kind === 'serve' ? (w.tray || null) : null;
    n.label = kind === 'serve' ? '서빙 중' : kind === 'home' ? '자리로 돌아가는 중' : (t.label || '이동 중');
  }
  function arrive(s, w) {
    const n = s.np, t = n.goal;
    s.moving = false; n.path = null;
    if (n.kind === 'serve' && n.data) {
      const v = n.data;
      if (v.loc === s.loc && !v.sceneId) {
        s.ry = t.lane ? faceTo(s, v) : faceTo(s, v);
        s.pose = w.rounds ? pick(['reach', 'point', 'write']) : w.tray ? 'reach' : 'point'; s.prop = w.rounds ? w.tray : (w.tray || null);
        Sim.say(s, pick(w.lines), 3.2);
        serveReact(s, v);
      }
      n.t = rnd(3, 5); n.label = '손님 응대';
      n.after = 'back';
      return;
    }
    s.ry = (t.f || 0) * R;
    setSpotPose(s, t);
    if (t.say && chance(0.5)) Sim.say(s, pick(t.say), 3);
    n.label = t.label || (n.kind === 'home' ? '근무 중' : '');
    n.t = n.kind === 'home' ? rnd(8, 16) : rnd(6, 12);
  }
  function nextTask(s, w) {
    const n = s.np;
    if (n.after === 'back') { n.after = null; return go(s, w, w.st, 'home'); }
    const atHome = Math.hypot(s.x - w.st.x, s.z - w.st.z) < 0.3;
    const tgt = chance(0.5) ? serveTarget(s, w) : null;
    if (tgt) { tgt._servedT = S().realT + 60; const b = standBeside(s, w, tgt); return go(s, w, b, 'serve', tgt); }
    if (!atHome && chance(0.6)) return go(s, w, w.st, 'home');
    if (w.spots && w.spots.length && chance(atHome ? 0.55 : 0.4)) { const t = pick(w.spots); return go(s, w, t, 'spot'); }
    if (!atHome) return go(s, w, w.st, 'home');
    // 자리에서 잠깐 다른 일
    s.pose = pick(['stand', 'stand', w.st.pose || 'stand', 'look']); n.t = rnd(6, 12); n.label = '근무 중';
  }
  function tickStaff(s, dt) {
    const w = WORK[s.id];
    if (!w || s.sceneId || s.loc === 'island') return;
    if (s.loc !== s.home) return;
    const n = s.np || (s.np = { t: rnd(2, 8), path: null });
    const p = S().player;
    if (s.talkingP && !(cur && cur.s === s && active())) s.talkingP = false;
    // 플레이어와 대화 중: 멈춰서 플레이어를 봄
    if (s.talkingP) { s.moving = false; if (p.loc === s.loc) s.ry = faceTo(s, p); if (!s.pose) s.pose = 'talk'; return; }
    if (n.path && n.path.length) {
      const [tx, tz] = n.path[0];
      const dx = tx - s.x, dz = tz - s.z, d = Math.hypot(dx, dz);
      const v = 1.1 * dt;
      if (d <= v) { s.x = tx; s.z = tz; n.path.shift(); if (!n.path.length) arrive(s, w); }
      else { s.x += dx / d * v; s.z += dz / d * v; s.ry = Math.atan2(dx, dz); s.moving = true; }
      return;
    }
    s.moving = false;
    // 가까이 온 플레이어 쪽을 봐 줌 (자리에서 쉬는 중일 때)
    if (p.loc === s.loc && Math.hypot(p.x - s.x, p.z - s.z) < 2.6 && n.kind !== 'serve') { s.ry = faceTo(s, p); if (!n.greetT || n.greetT < S().realT) { n.greetT = S().realT + 40; Sim.say(s, pick(GREET[s.role] || ['어서 오세요!']), 2.6); } }
    n.t -= dt;
    if (n.t <= 0) nextTask(s, w);
  }
  NL.tickStaff = tickStaff;
  const GREET = {
    barista: ['어서 오세요~ 카페 앙상블입니다 ☕'], chef: ['이랏샤이마세~! 🍣'], pub: ['어서 와요~ 자리 편한 데 앉아요!'], dj: ['블루문에 오신 걸 환영해요 🎷'], conv: ['어서오세요~ 편의점입니다!'], tea: ['어서 오세요, 차 한 잔 하고 가요 🍵'],
    teacher: ['어머, 견학 오셨어요?'], librarian: ['도서관에 오신 걸 환영해요 (소곤)'], clerk: ['번호표 뽑고 기다려 주세요~'], judge: ['...정숙.'], boss: ['음? 자네는 누군가?'], grocer: ['어서 오세요~ 오늘 과일 특가예요!'],
    stylist: ['어서 오세요~ 로즈 부티크예요 🌹'], doctor: ['어디가 불편하세요?'], nurse: ['접수 도와드릴까요? 💗'], waiter: ['네뷸라에 오신 걸 환영합니다 ✨'],
  };
  // 서빙 받은 주민의 성격별 반응
  function serveReact(s, v) {
    const r = S().realT;
    const lines = [];
    if (s.role === 'boss') {
      if (has(v, 'DILIGENT') || has(v, 'LEADER')) { lines.push('넵! 바로 하겠습니다!'); Sim.emote(v, '💪'); }
      else if (has(v, 'LAZY') || has(v, 'CYNICAL')) { lines.push('(한숨) ...네에.'); Sim.emote(v, '😩'); v.stress = clamp(v.stress + 3, 0, 100); }
      else { lines.push('네, 부장님!'); Sim.emote(v, '😅'); }
    } else if (['doctor', 'nurse'].includes(s.role)) {
      lines.push(v.status.hospital ? pick(['고마워요... 조금 나아졌어요', '언제 퇴원할 수 있어요?', '여기 밥 맛있어요 ㅎㅎ']) : pick(['네, 감사합니다!', '많이 기다려야 해요?']));
      Sim.emote(v, '💗');
      v.stress = clamp(v.stress - 4, 0, 100); v.depression = clamp((v.depression || 0) - (v.status.hospital ? 4 : 1), 0, 100);
      v.status.nurseCare = (v.status.nurseCare || 0) + 1;
    } else if (s.role === 'teacher') { lines.push(pick(['네 선생님!', '헤헤', '저 다 했어요!'])); Sim.emote(v, '✏️'); }
    else if (s.role === 'stylist') { lines.push(has(v, 'FASHION') || has(v, 'FASHIONISTA') ? '역시 제 안목이죠? 💅' : pick(['정말요? 헤헤', '음... 좀 더 볼게요'])); Sim.emote(v, '✨'); }
    else if (s.role === 'librarian') { lines.push('(소곤) 감사합니다'); Sim.emote(v, '📖'); }
    else {
      if (v.keys && v.keys.L4 === 'FOOD' || has(v, 'FOODIE')) lines.push('와아 맛있겠다!! 😋');
      else if (has(v, 'CRANKY')) lines.push('흠, 좀 늦었네요.');
      else if (has(v, 'SHY') || has(v, 'INTROVERT')) lines.push('아, 가, 감사합니다...');
      else lines.push(pick(['감사합니다~!', '잘 먹겠습니다!', '냄새 좋다~']));
      Sim.emote(v, pick(['😋', '😊', '🍽️']));
    }
    later(1.4, () => { if (v.loc === s.loc) Sim.say(v, sty(v, lines[0]), 2.6); });
    v._servedT = r + 90;
  }
  // 손님이 가게 가구를 쓰기 시작하면 가까운 직원이 손님 쪽을 보며 인사
  FM.bus.on('act', ({ v, id }) => {
    if (!v || v.staff || !v.loc || v.loc === 'island' || v.loc === v.home) return;
    const E = Ev(); if (!E) return;
    if (!['customer', 'shop', 'buy_kimbap', 'wait', 'mocktail', 'sushi', 'tea_heal', 'dine'].includes(id) || chance(0.5)) return;
    const s = E.staff.filter(x => x.loc === v.loc && !x.sceneId && !(x.np && x.np.path) && !x.talkingP).sort((a, b) => Math.hypot(a.x - v.x, a.z - v.z) - Math.hypot(b.x - v.x, b.z - v.z))[0];
    if (!s || Math.hypot(s.x - v.x, s.z - v.z) > 6) return;
    s.ry = faceTo(s, v);
    if (!s.bubble) Sim.say(s, pick(GREET[s.role] || ['어서 오세요!']), 2.4);
  });

  // 짧은 지연 실행 (실제 초)
  const TL = [];
  function later(sec, fn) { TL.push({ t: (S().realT || 0) + sec, fn }); }
  function runLater() { const now = S().realT; for (let i = TL.length - 1; i >= 0; i--) if (TL[i].t <= now) { const f = TL.splice(i, 1)[0].fn; try { f(); } catch (e) { console.error('npclife', e); } } }

  // =========================================================
  // 3. 건물 안 주민들의 성격별 상호작용
  // =========================================================
  const soc = v => clamp(0.25 + (has(v, 'EXTROVERT') ? 0.35 : 0) + (has(v, 'GOSSIP') ? 0.25 : 0) + (has(v, 'BUSYBODY') ? 0.2 : 0) + (has(v, 'WARM') ? 0.15 : 0) + (has(v, 'LEADER') ? 0.1 : 0) + (has(v, 'FRIENDSHIP') ? 0.15 : 0) - (has(v, 'INTROVERT') ? 0.2 : 0) - (has(v, 'SHY') ? 0.1 : 0), 0.05, 1);
  const settled = v => v && !v.child && !v.sceneId && !v.moving && !(v.route && v.route.length) && !v.talkingToPlayer && v.act && !['sleep', 'hospital_sleep'].includes(v.act.id) && v.loc !== 'island' && v.loc !== 'metro';
  const FOODACT = ['dine', 'sushi', 'pub', 'cafe', 'eat', 'mocktail', 'breakfast', 'tea', 'tea_heal'];
  const VENUE_TALK = {
    office_in: ['이번 분기 실적 어때?', '부장님 오늘 기분 좋아 보이지 않아?', '점심 뭐 먹을래?', '야근 안 했으면 좋겠다...', '이 엑셀 수식 좀 봐 줄래?'],
    cathedral_in: ['(소곤) 오늘 기도 뭐 했어?', '(소곤) 스테인드글라스 너무 예쁘다', '(소곤) 마음이 편해지네'],
    club_in: ['이 곡 너무 좋다... 🎷', '분위기 끝내준다!', '다음 곡은 뭘까?', '칵테일 한 잔 더 할래?'],
    med_in: ['빨리 나아야 할 텐데...', '여기 간호사님들 친절하다', '병원 밥 생각보다 맛있어'],
    library_in: ['(소곤) 이 책 읽어 봤어?', '(소곤) 결말 스포하지 마!', '(소곤) 시험 공부 중이야'],
    mall_in: ['이거 어때? 나한테 어울려?', '와 이거 세일한다!', '장바구니 무거워...', '이 원피스 색 예쁘다!'],
    arcade_in: ['한 판 더! 이번엔 이긴다!', '최고 기록 깼어!!', '너 진짜 고수다...'],
    sky_in: ['야경 진짜 예쁘다...', '여기 스테이크 맛집이래', '와인 잔 부딪칠래?'],
    cafe_in: ['여기 수플레 진짜 맛있어!', '라떼 아트 봐 봐 ㅎㅎ', '오늘 날씨 딱 카페 날씨다'],
    sushi_in: ['참치 뱃살 녹는다...', '오늘 몇 접시 먹을 거야?', '와사비 너무 많이 넣었다 😭'],
    pub_in: ['탕수육은 부먹이지!', '딤섬 하나 더 시킬까?', '오늘 하루도 고생했어'],
    tea_in: ['차 향 너무 좋다...', '여기 오면 마음이 편해져', '대추차 한 잔 더?'],
    obs_in: ['저기 봐, 토성 고리 보여!', '별이 쏟아질 것 같아...'],
  };
  function inviteSeat(a, b) {
    // b가 a 근처 빈자리로 옮겨 앉음 (합석)
    const occ = Sim.useOcc;
    const us = Sim.furnUses(a.loc, u => (!occ[u.key] || occ[u.key] === b.id) && !['staff', 'boss', 'anchor', 'hearing', 'perform', 'hospital'].includes(u.u.act) && Math.hypot(u.x - a.x, u.z - a.z) < 2.4 && Math.hypot(u.x - a.x, u.z - a.z) > 0.3);
    if (!us.length) return false;
    us.sort((x, y) => Math.hypot(x.x - a.x, x.z - a.z) - Math.hypot(y.x - a.x, y.z - a.z));
    Sim.goUse(b, us[0]); return true;
  }
  const lineFor = (a, b) => {
    const pool = VENUE_TALK[a.loc];
    if (pool && chance(0.55)) return pick(pool);
    return FM.L && FM.L.topic ? FM.L.topic(a) : '요즘 어떻게 지내?';
  };
  function reply(b, a) {
    if (has(b, 'CRANKY') || has(b, 'CYNICAL')) return sty(b, pick(['흥, 그래서?', '...별로 관심 없어', '그걸 이제 알았어?']));
    if (has(b, 'SHY') || has(b, 'INTROVERT')) return sty(b, pick(['아, 응... 그렇네', '(끄덕끄덕)', '...나도 그렇게 생각해']));
    if (has(b, 'EXTROVERT') || has(b, 'FUN')) return sty(b, pick(['ㅋㅋㅋ 완전 공감!!', '대박 진짜?!', '나도나도!!']));
    if (b.crush && b.crush.target === a.id) return sty(b, '어, 어어... 그렇구나 (두근)');
    return FM.L && FM.L.topic ? FM.L.topic(b) : sty(b, '그러게~');
  }
  function social(a, b, kind) {
    const rt = S().realT;
    a._socT = rt + rnd(25, 45); b._socT = rt + rnd(20, 40);
    const tm = S().time;
    a.lastSocialT = b.lastSocialT = tm;
    const Soc = FM.Soc;
    const r = Soc.rel(a.id, b.id);
    switch (kind) {
      case 'toast':
        Sim.say(a, sty(a, pick(['우리 건배할까? 🥂', '오늘을 위하여~!', '짠! 🍻'])), 2.6);
        later(1.2, () => { Sim.say(b, sty(b, pick(['짠~! 🥂', '건배!!', '좋아, 짠!'])), 2.4); Sim.emote(a, '🥂', 2.5); Sim.emote(b, '🥂', 2.5); });
        Soc.addFriend(a.id, b.id, 2, 1); a.depression = clamp(a.depression - 2, 0, 100); b.depression = clamp(b.depression - 2, 0, 100);
        return;
      case 'gossip': {
        const g = Ev() && Ev().pickRumor ? Ev().pickRumor(a, b) : null;
        if (!g) return social(a, b, 'chat');
        Sim.say(a, g.text, 3.4); Sim.emote(a, '🤫');
        later(1.8, () => { Sim.say(b, g.reply || sty(b, '헐, 진짜?'), 2.6); Sim.emote(b, '😲'); try { Ev().applyRumor(g, a, b); } catch (e) { /* 무시 */ } });
        Soc.addFriend(a.id, b.id, 1, 0.5); return;
      }
      case 'compliment':
        Sim.say(a, sty(a, pick(['오늘 옷 진짜 예쁘다!', '그 머리 스타일 잘 어울려!', '너 오늘 좀 멋있는데?'])), 2.8);
        later(1.4, () => { Sim.say(b, sty(b, pick(['헤헤 정말? 고마워!', '너도 오늘 예뻐~', '에이 뭘~ 😳'])), 2.4); Sim.emote(b, '😊'); });
        Soc.addFriend(b.id, a.id, 3, 1); b.depression = clamp(b.depression - 3, 0, 100); return;
      case 'flirt':
        Sim.say(a, sty(a, pick(['저, 저기... 여기 자주 와?', '너랑 있으면 시간 가는 줄 모르겠다', '다음에 또 같이 올래?'])), 2.8); Sim.emote(a, '💓');
        later(1.5, () => { Sim.say(b, reply(b, a), 2.4); if (Soc.canRomance ? Soc.canRomance(b.id, a.id) : true) Soc.addRomance(a.id, b.id, 3); });
        return;
      case 'console':
        Sim.say(a, sty(a, pick(['요즘 힘들어 보여... 무슨 일 있어?', '괜찮아? 내가 들어 줄게', '힘내, 내가 옆에 있잖아'])), 3.0); Sim.emote(a, '🤗');
        later(1.8, () => { Sim.say(b, sty(b, pick(['...고마워. 조금 나아졌어', '흑... 너밖에 없다 😢', '말해 줘서 고마워'])), 2.8); Sim.emote(b, '🥹'); });
        b.depression = clamp(b.depression - 10, 0, 100); b.stress = clamp(b.stress - 5, 0, 100); Soc.addFriend(b.id, a.id, 4, 4);
        if (FM.Will && FM.Will.remember) FM.Will.remember(b, 'kind', `${a.name}이(가) 힘들 때 위로해 줬어`, { about: a.id });
        return;
      case 'grumble': {
        Sim.say(a, sty(a, pick(['좀 조용히 해 줄래?', '거기 좀 비켜 줄래?', '아 진짜 시끄럽네...'])), 2.6); Sim.emote(a, '😒');
        const hot = (r.friendship_point || 0) < 15 && (FM.Moral ? FM.Moral.fightOK(a, b) : 1) && chance(0.35);
        later(1.4, () => {
          if (hot) { Sim.say(b, sty(b, '뭐? 너나 조용히 해!'), 2.4); Sim.emote(a, '💢'); Sim.emote(b, '💢'); Soc.addFriend(a.id, b.id, -4, -3); const pl = placeName(a.loc); Sim.log('rel', `💢 ${a.name}와(과) ${b.name}이(가) ${pl}에서 말다툼했어요`, [a.id, b.id], 1); }
          else { Sim.say(b, sty(b, pick(['아, 미안미안!', '...알았어', '(움찔)'])), 2.2); Soc.addFriend(a.id, b.id, -1, 0); }
        });
        return;
      }
      case 'invite':
        Sim.say(a, sty(a, pick(['여기 자리 있어! 같이 앉자~', '이쪽으로 와! 합석하자!', '같이 먹을래?'])), 2.6); Sim.emote(a, '👋');
        later(1.2, () => { if (settled(b) && inviteSeat(a, b)) { Sim.say(b, sty(b, pick(['좋아~!', '오 고마워!', '헤헤 그럴까?'])), 2.2); Soc.addFriend(a.id, b.id, 2, 1); } else Sim.say(b, sty(b, '나 여기 편해~ 다음에!'), 2.2); });
        return;
      default: {
        const line = lineFor(a, b);
        Sim.say(a, sty(a, line), 3); Sim.emote(a, pick(['💬', '😊', '🎵']));
        later(1.6, () => { Sim.say(b, reply(b, a), 2.6); Sim.emote(b, pick(['😄', '😊', '👍', '💬'])); });
        Soc.addFriend(a.id, b.id, 1.2, 0.5);
        a.depression = clamp(a.depression - 1.5, 0, 100); b.depression = clamp(b.depression - 1.5, 0, 100);
        // 도서관에서 떠들면 사서가 쉿!
        if (a.loc === 'library_in') later(2.8, () => { const lb = Ev() && Ev().staffById('s_librarian'); if (lb && lb.loc === a.loc) { lb.ry = faceTo(lb, a); Sim.say(lb, '쉿~ 도서관에서는 조용히 해 주세요 🤫', 2.6); Sim.emote(a, '😅'); Sim.emote(b, '🤫'); } });
      }
    }
  }
  function placeName(iid) { const I = FM.INTERIORS[iid]; return I ? I.name : '건물 안'; }
  function chooseKind(a, b) {
    const W = [];
    const add = (k, w) => { if (w > 0) W.push([k, w]); };
    const r = FM.Soc.rel(a.id, b.id), fp = r.friendship_point || 0;
    add('chat', 3);
    if (has(a, 'GOSSIP') || has(a, 'BUSYBODY')) add('gossip', 2.5);
    if (FOODACT.includes(a.act.id) && FOODACT.includes(b.act.id)) add('toast', has(a, 'EXTROVERT') || has(a, 'FUN') ? 2.5 : 1.2);
    if (has(a, 'FASHION') || has(a, 'FASHIONISTA') || (a.keys && a.keys.L4 === 'FASHION')) add('compliment', 2);
    else add('compliment', 0.4);
    if (a.crush && a.crush.target === b.id) add('flirt', 4);
    if ((b.depression || 0) > 40 && (has(a, 'WARM') || has(a, 'KIND') || has(a, 'FRIENDSHIP') || fp > 50)) add('console', 5);
    if ((has(a, 'CRANKY') || has(a, 'CYNICAL') || has(a, 'SNOB')) && fp < 30) add('grumble', 1.6);
    if ((has(a, 'EXTROVERT') || has(a, 'WARM') || fp > 45) && Math.hypot(a.x - b.x, a.z - b.z) > 1.6) add('invite', 1.2);
    let t = W.reduce((s, x) => s + x[1], 0) * Math.random();
    for (const [k, w] of W) { t -= w; if (t <= 0) return k; }
    return 'chat';
  }
  let socAcc = 0;
  function tickSocial(dt) {
    socAcc += dt; if (socAcc < 1.5) return; socAcc = 0;
    const st = S(), rt = st.realT;
    const by = {};
    for (const v of st.villagers) if (v.loc && v.loc !== 'island' && v.loc !== 'metro' && v.loc !== v.home && FM.INTERIORS[v.loc]) (by[v.loc] = by[v.loc] || []).push(v);
    for (const [iid, list] of Object.entries(by)) {
      // 재즈바: 연주 중인 주민이 있으면 관객이 박수 · 환호
      if (iid === 'club_in') {
        const perf = list.filter(v => v.act && v.act.id === 'perform' && !v.moving);
        if (perf.length && chance(0.35)) { const aud = list.filter(v => settled(v) && v.act.id !== 'perform' && !(v._clapT > rt)); const x = aud.length && pick(aud); if (x) { x._clapT = rt + 20; Sim.emote(x, pick(['👏', '🎶', '😍']), 2.5); if (chance(0.5)) Sim.say(x, sty(x, pick(['브라보!', '앵콜~!', '와 소름...', '최고야!!'])), 2.4); const pf = pick(perf); pf.depression = clamp(pf.depression - 2, 0, 100); pf.reputation = clamp((pf.reputation || 50) + 0.5, 0, 100); } }
      }
      if (list.length < 2) continue;
      const free = list.filter(v => settled(v) && !(v._socT > rt));
      if (free.length < 2 || !chance(0.5)) continue;
      // 사교적인 주민일수록 먼저 말을 검
      let tot = free.reduce((s, v) => s + soc(v), 0) * Math.random(), a = free[0];
      for (const v of free) { tot -= soc(v); if (tot <= 0) { a = v; break; } }
      if (!chance(soc(a) + 0.15)) continue;
      const R0 = iid === 'club_in' || iid === 'sky_in' || iid === 'office_in' ? 4.5 : 3.4;
      const near = free.filter(o => o !== a && Math.hypot(o.x - a.x, o.z - a.z) < R0);
      if (!near.length) continue;
      // 친한 사람 · 짝사랑 상대 우선
      near.sort((x, y) => ((FM.Soc.rel(a.id, y.id).friendship_point || 0) + (a.crush && a.crush.target === y.id ? 50 : 0)) - ((FM.Soc.rel(a.id, x.id).friendship_point || 0) + (a.crush && a.crush.target === x.id ? 50 : 0)));
      const b = chance(0.7) ? near[0] : pick(near);
      const r = FM.Soc.rel(a.id, b.id);
      if (r.status === 'EX' && r.cooldown_until > day()) { Sim.emote(a, '😶'); a._socT = rt + 30; continue; }
      social(a, b, chooseKind(a, b));
    }
  }
  // 가게에 들어오면: 사교적인 주민은 친구 옆자리부터 찾아 앉음
  const oVA = Sim.venueAction;
  Sim.venueAction = function (v, iid) {
    try {
      if (!v.child && v.loc === iid && chance(soc(v) * 0.7)) {
        const friends = S().villagers.filter(o => o !== v && o.loc === iid && settled(o) && ((FM.Soc.rel(v.id, o.id).friendship_point || 0) > 30 || (v.crush && v.crush.target === o.id)));
        if (friends.length) { const f = pick(friends); if (inviteSeat(f, v)) { Sim.emote(v, pick(['😊', '👋', '💕'])); v.lastSocialT = S().time; return; } }
      }
    } catch (e) { console.error('npclife seat', e); }
    return oVA(v, iid);
  };

  // =========================================================
  // 4. 우울감 — 싸움 · 이별 · 실연 · 외로움으로 쌓이고, 수다 · 위로 · 취미로 풀림
  //    60↑ : 집에 틀어박힘   85↑ : 메디컬 센터 입원 (마음의 감기)
  // =========================================================
  const WITHDRAW = 60, ADMIT = 85, RECOVER = 45;
  const adult = v => v && !v.child && v.id !== P && !v.staff && !v.visitor;
  function addDep(v, n, why) {
    if (!adult(v)) return;
    v.depression = clamp((v.depression || 0) + n, 0, 100);
    if (n > 0 && why) { (v.depLog = v.depLog || []).push({ t: S().time, why, n }); if (v.depLog.length > 8) v.depLog.shift(); }
  }
  NL.addDep = addDep;
  // 싸움 기록 (모든 종류의 싸움이 여기로 모임)
  if (FM.Moral && FM.Moral.recordFight) {
    const oRF = FM.Moral.recordFight;
    FM.Moral.recordFight = function (a, b, why) {
      const r = oRF.apply(this, arguments);
      try { if (a && b && a.id !== P && b.id !== P) afterFight(a, b, why || '싸움'); } catch (e) { console.error('npclife fight', e); }
      return r;
    };
  }
  const power = v => 50 + (has(v, 'ATHLETIC') ? 22 : 0) + (has(v, 'TOMBOY') ? 12 : 0) + (has(v, 'LEADER') ? 6 : 0) + (v.energy || 50) * 0.2 - (v.stress || 0) * 0.1 - (v.depression || 0) * 0.1 + rnd(0, 35);
  function afterFight(a, b, why) {
    const physical = /몸싸움|주먹|크게 다툼/.test(why);
    const [win, lose] = power(a) >= power(b) ? [a, b] : [b, a];
    addDep(win, 4, `${lose.name}와(과) ${why}`); addDep(lose, 10, `${win.name}와(과) ${why}해서 졌어`);
    // 말다툼도 가끔 주먹다짐으로 번짐 → 진 쪽은 병원 신세
    const escalate = !physical && chance(0.3) && !win.sceneId && !lose.sceneId;
    if (physical || escalate) {
      if (escalate) later(1, () => Sim.log('rel', `👊 ${win.name}와(과) ${lose.name}의 말다툼이 주먹다짐으로 번졌어요! 진 쪽은 ${lose.name}...`, [win.id, lose.id], 2, { newsKind: 'drama' }));
      later(physical ? 6 : 2, () => admitInjury(lose, win));
      Sim.emote(win, '😤', 3);
    }
  }
  NL.afterFight = afterFight;
  function toHospital(v) {
    const sc = v.sceneId && Sim.scenes.find(s => s.id === v.sceneId);
    if (sc && sc.major) return false;
    if (sc) Sim.endScene(sc, true);
    Sim.freeUse(v); Sim.releaseSpot && Sim.releaseSpot(v);
    v.route = null; v.act = null; v.pose = null; v.prop = null; v.moving = false; v.pendingAct = null;
    Sim.dressFor(v, 'patient');
    v.loc = 'med_in'; v.x = rnd(-1, 2); v.z = rnd(0.5, 3); v.idleT = 0.5;
    return true;
  }
  function admitInjury(v, by) {
    if (!adult(v) || v.status.hospital || v.loc === 'metro') return;
    if (!toHospital(v)) { later(8, () => admitInjury(v, by)); return; }
    v.status.hospital = true; v.status.disease = '타박상 (싸움에서 짐)'; v.status.cared = 0; v.status.admitDay = day(); v.status.admitT = S().time;
    v.status.injuryUntil = S().time + rnd(180, 360);
    v.status.hatOverride = 'headband'; v.status.bandageUntil = day() + 1;
    Sim.emote(v, '🤕', 4);
    Sim.log('medical', `🚑 ${by ? by.name + '와(과)의 싸움에서 진 ' : ''}${v.name}이(가) 타박상으로 메디컬 센터에 잠깐 입원했어요.`, by ? [v.id, by.id] : [v.id], 2);
  }
  NL.admitInjury = admitInjury;
  function admitMind(v) {
    if (!adult(v) || v.status.hospital || v.loc === 'metro') return;
    if (!toHospital(v)) return;
    v.status.hospital = true; v.status.disease = '마음의 감기 (깊은 우울감)'; v.status.cared = 0; v.status.admitDay = day(); v.status.admitT = S().time; v.status.mind = true;
    Sim.emote(v, '😞', 4);
    Sim.log('medical', `🏥 우울감이 깊어진 ${v.name}이(가) 메디컬 센터에 입원했어요. 따뜻한 말 한마디와 병문안이 필요해요.`, [v.id], 2);
    if (FM.Soc.addQuest) FM.Soc.addQuest({ type: 'hospital_care', title: `🏥 ${v.name} 병문안 가기`, giver: v.id, target: v.id, desc: `마음이 많이 지친 ${v.name}에게 병문안을 가 주세요. (간호사 · 친구의 위로로도 조금씩 회복해요)` });
  }
  NL.admitMind = admitMind;
  function discharge(v, text) {
    v.status.hospital = false; v.status.disease = null; v.status.injuryUntil = 0; v.status.mind = false; v.status.withdrawn = false; if (v.status.hatOverride === 'headband') v.status.hatOverride = null; v.status.bandageUntil = null;
    Sim.freeUse(v); Sim.dressFor(v, null); v.act = null; v.pose = null; v.idleT = 1;
    const q = S().quests.find(x => x.type === 'hospital_care' && x.target === v.id && x.state === 'active');
    if (q && FM.Soc.finishQuest) FM.Soc.finishQuest(q, true, `${v.name}이(가) 퇴원했어요`);
    Sim.log('medical', text, [v.id], 1);
  }
  // 이별 · 이혼 · 실연 · 결혼 같은 사건을 로그에서 받아 우울감 반영
  FM.bus.on('log', e => {
    try {
      if (!e || !e.who) return;
      const vs = e.who.map(id => Sim.byId(id)).filter(adult);
      if (e.type === 'breakup') vs.slice(0, 2).forEach(v => addDep(v, 25, '이별'));
      else if (e.type === 'divorce') vs.slice(0, 2).forEach(v => addDep(v, 30, '이혼'));
      else if (e.type === 'crushEnd') vs.slice(0, 1).forEach(v => addDep(v, 12, '짝사랑이 끝남'));
      else if (e.type === 'wedding' || e.type === 'couple') vs.slice(0, 2).forEach(v => { v.depression = clamp(v.depression - 20, 0, 100); });
      else if (e.type === 'friend') vs.slice(0, 2).forEach(v => { v.depression = clamp(v.depression - 5, 0, 100); });
      else if (e.type === 'rel' && /원수가 됐어요|절교/.test(e.text)) vs.slice(0, 2).forEach(v => addDep(v, 8, '친구와 멀어짐'));
    } catch (er) { /* 무시 */ }
  });
  // 대화 장면이 끝나면 외로움 해소
  FM.bus.on('sceneEnd', sc => { if (!sc) return; const t = S().time; for (const v of Object.values(sc.actors || {})) if (adult(v)) { v.lastSocialT = t; if (sc.title === 'TALK_NPC') v.depression = clamp(v.depression - 1, 0, 100); } });
  // 매 시간: 외로움 · 실연 슬럼프 체크, 우울감 단계 전환
  function hourly() {
    const st = S(), t = st.time, h = hour();
    for (const v of st.villagers) {
      if (!adult(v)) continue;
      if (v.lastSocialT === undefined) v.lastSocialT = t;
      if (v.talkingToPlayer) v.lastSocialT = t;
      // 실연 슬럼프가 새로 시작되면 한 번 크게
      if (v.status.slumpUntil > t && v._slumpSeen !== v.status.slumpUntil) { v._slumpSeen = v.status.slumpUntil; addDep(v, 15, '실연'); }
      // 외로움: 오래 아무와도 어울리지 못하면 조금씩 쌓임 (자는 시간 제외)
      const awake = !(Sim.asleep && Sim.asleep(v, h));
      const alone = (t - v.lastSocialT) / 60;
      if (awake && alone > 8) {
        const friends = st.villagers.filter(o => o !== v && (FM.Soc.rel(v.id, o.id).friendship_point || 0) >= 50).length;
        let rate = 0.9 * (has(v, 'EXTROVERT') ? 1.6 : has(v, 'INTROVERT') ? 0.5 : 1) * (friends < 2 ? 1.4 : 1) * (FM.Soc.partnerOf && FM.Soc.partnerOf(v.id) ? 0.6 : 1);
        addDep(v, rate, alone > 20 ? '외로움' : null);
        if (v.depression > 40 && v._lonelyDay !== day() && chance(0.25)) { v._lonelyDay = day(); Sim.log('mood', `😔 ${v.name}이(가) 요즘 부쩍 외로움을 느끼고 있어요...`, [v.id], 1); Sim.emote(v, '😔', 4); }
      }
      // 입원 중 회복 / 퇴원
      if (v.status.hospital) {
        if (v.status.injuryUntil && t >= v.status.injuryUntil) discharge(v, `🩹 ${v.name}이(가) 타박상을 치료받고 퇴원했어요.`);
        else if (v.status.mind && v.depression < 40 && t - v.status.admitT > 360) discharge(v, `🌈 ${v.name}이(가) 마음을 추스르고 퇴원했어요. 다시 웃는 얼굴이에요!`);
        else if (!v.status.mind && !v.status.injuryUntil && v.status.admitT && t - v.status.admitT > 1440 * 1.5 && Ev() && Ev().discharge) Ev().discharge(v);
        continue;
      }
      // 단계 전환
      if (v.depression >= ADMIT) admitMind(v);
      else if (v.depression >= WITHDRAW && !v.status.withdrawn) { v.status.withdrawn = true; Sim.log('mood', `🏠 깊은 우울감에 빠진 ${v.name}이(가) 집 밖으로 나오지 않고 있어요...`, [v.id], 2); }
      else if (v.status.withdrawn && v.depression < RECOVER) { v.status.withdrawn = false; Sim.log('mood', `🌤️ ${v.name}이(가) 기운을 조금 되찾고 다시 밖으로 나왔어요.`, [v.id], 1); }
    }
  }
  FM.bus.on('hour', () => { try { hourly(); } catch (e) { console.error('npclife hourly', e); } });
  // 즐거운 활동 · 입원 치료 중에는 우울감이 서서히 풀림
  const FUN = ['perform', 'club_dance', 'karaoke', 'pray', 'tea_heal', 'dine', 'cafe', 'mocktail', 'game', 'arcade', 'read_book', 'sofa', 'jacuzzi', 'meditate'];
  function tickMood(dMin) {
    for (const v of S().villagers) {
      if (!adult(v)) continue;
      if (v.status.hospital) v.depression = clamp(v.depression - dMin * (v.status.mind ? 0.05 : 0.02), 0, 100);
      else if (v.act && FUN.includes(v.act.id)) v.depression = clamp(v.depression - dMin * 0.015, 0, 100);
    }
  }
  // 틀어박힌 주민: 집으로 돌아가 누워 있거나 구석에 웅크림
  const oTH = Sim.thinkHook;
  Sim.thinkHook = function (v, blk) {
    if (oTH && oTH(v, blk)) return true;
    if (!v.status.withdrawn || v.status.hospital || v.child || v.sceneId || blk.k === 'sleep' || blk.k === 'hospital') return false;
    if (v.loc !== v.home) { if (chance(0.9)) { Sim.planRoute(v, { loc: v.home, x: 0, z: 0 }); v.state = 'WALK'; v.pendingAct = null; Sim.dressFor(v, null); return true; } return false; }
    if (v.hunger > 70) { Sim.startAct(v, 'eat_snack', { state: 'HOME_LIFE', pose: 'eat', dur: 8, name: '혼자 배달 음식' }); return true; }
    const r = Math.random();
    if (r < 0.5) Sim.startAct(v, 'slump', { state: 'HOME_LIFE', pose: 'lie', dur: rnd(15, 30), name: '침대에 누워 있음 (우울)' });
    else if (r < 0.8) Sim.startAct(v, 'corner', { state: 'HOME_LIFE', pose: 'sadSit', dur: rnd(12, 25), name: '구석에 웅크려 있음 (우울)' });
    else Sim.startAct(v, 'stare_window', { state: 'HOME_LIFE', pose: 'stare', dur: rnd(10, 20), name: '멍하니 창밖 보기' });
    if (chance(0.25)) Sim.say(v, sty(v, pick(['...아무것도 하기 싫어', '다들 나 없어도 괜찮겠지...', '(한숨)', '오늘은 그냥 누워 있을래'])), 3);
    Sim.emote(v, pick(['😞', '🌧️', '💧']), 3);
    return true;
  };
  // 친한 친구가 틀어박힌 주민을 찾아가 위로 (하루 몇 번)
  function visitFriend() {
    const st = S();
    const sad = st.villagers.filter(v => adult(v) && v.status.withdrawn && !v.status.hospital && v.loc === v.home && !v.sceneId);
    if (!sad.length) return;
    const v = pick(sad);
    const fr = st.villagers.filter(o => adult(o) && o !== v && !o.sceneId && !o.status.hospital && !o.status.withdrawn && o.loc !== 'metro' && (FM.Soc.rel(o.id, v.id).friendship_point || 0) >= 40 && !(Sim.asleep && Sim.asleep(o, hour())));
    if (!fr.length) return;
    const o = pick(fr);
    Sim.scene({ title: '🤗 우울한 친구 찾아가기', actors: { A: o, B: v }, steps: [
      { go: 'A', to: { actor: 'B', near: 1.0 }, max: 120 }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
      { say: 'A', text: sty(o, pick(['요즘 연락이 없어서 걱정돼서 왔어...', '문 좀 열어 봐, 맛있는 거 사 왔어!', '괜찮아? 얼굴 좀 보자'])), t: 3 },
      { say: 'B', text: sty(v, pick(['...와 줘서 고마워', '흑... 사실 많이 힘들었어', '나 같은 거 신경 써 주는구나...'])), t: 3 },
      { par: [{ pose: 'A', p: 'hug', t: 2 }, { pose: 'B', p: 'hug', t: 2 }] }, { emote: 'B', e: '🥹' },
    ], onEnd: () => { addDep(v, -18); v.stress = clamp(v.stress - 8, 0, 100); FM.Soc.addFriend(v.id, o.id, 6, 6); v.lastSocialT = S().time; Sim.log('mood', `🤗 ${o.name}이(가) 우울해하던 ${v.name}을(를) 찾아가 위로해 줬어요`, [o.id, v.id], 1); } });
  }
  FM.bus.on('hour', h => { if (h >= 10 && h <= 20 && chance(0.25)) try { visitFriend(); } catch (e) { console.error('npclife visit', e); } });

  // =========================================================
  // 4-1. 가게 음식은 가게 안에서, 자리에 앉아서, 먹는 모션으로
  // =========================================================
  const SHOPS = ['cafe_in', 'sushi_in', 'pub_in', 'sky_in', 'club_in', 'tea_in', 'conv_in', 'mall_in', 'library_in'];
  const EAT_ACTS = ['dine', 'sushi', 'pub', 'cafe', 'eat', 'mocktail', 'breakfast', 'tea', 'tea_heal', 'eat_seat', 'eat_snack'];
  const PICKUP = ['cafe', 'buy_kimbap'];   // 서서 고르는 곳 (뷔페 · 계산대 · 진열대) → 고른 뒤 자리에 앉아서 먹음
  const MENU = {
    cafe_in: [['eat', 'sandwich'], ['drink', 'teacup'], ['eat', 'pudding']], sushi_in: [['eat', 'bowl'], ['drink', 'teacup']], pub_in: [['eat', 'bowl'], ['drink', 'drink']],
    sky_in: [['eat', 'bowl'], ['drink', 'drink']], club_in: [['drink', 'drink'], ['eat', 'snack']], tea_in: [['drink', 'teacup'], ['eat', 'pudding']], conv_in: [['eat', 'kimbap'], ['drink', 'can']],
    mall_in: [['drink', 'teacup'], ['eat', 'sandwich']], library_in: [['drink', 'teacup'], ['eat', 'pudding']],
  };
  const DRINKS = ['mocktail', 'tea', 'tea_heal'];
  FM.bus.on('act', ({ v, id }) => {
    if (!v || v.staff || !v.act) return;
    // 섬의 카페 테라스에서는 음식을 먹지 않고 쉬기만 (가게 음식은 안에서)
    if (v.loc === 'island' && id === 'eat_snack' && v.spot && v.spot.tags && v.spot.tags.includes('cafe')) { v.pose = 'sit'; v.prop = null; v.act.name = '테라스에서 쉬는 중'; v.act.id = 'sit_rest'; return; }
    if (!SHOPS.includes(v.loc) || !EAT_ACTS.includes(id)) return;
    const seated = (v.act.seatH || 0) > 0 || ['eat', 'drink', 'sit'].includes(v.act.pose || v.pose) && !['reach', 'stand'].includes(v.pose);
    if (!seated) { if (PICKUP.includes(id)) { v._eatSeat = v.loc; v.act.t = Math.min(v.act.t, 3); v.act.name = '음식 고르는 중'; } return; }
    const m = MENU[v.loc] || [['eat', 'bowl']];
    const first = DRINKS.includes(id) ? m.find(x => x[0] === 'drink') || m[0] : m[0];
    v.pose = first[0]; v.prop = first[1]; v.act.food = { i: 0, t: rnd(3, 5) };
    v.act.name = DRINKS.includes(id) ? '앉아서 마시는 중' : '앉아서 식사 중';
    v.act.t = Math.max(v.act.t, rnd(10, 16));
    v._eatSeat = null;
  });
  function tickFood(dt) {
    const occ = Sim.useOcc;
    for (const v of S().villagers) {
      const a = v.act;
      if (a && a.food && !v.moving && !v.sceneId) {
        a.food.t -= dt;
        if (a.food.t <= 0) {
          const m = MENU[v.loc] || [['eat', 'bowl']];
          const opts = a.id === 'mocktail' ? m.filter(x => x[0] === 'drink').concat([['drink', 'drink']]) : m;
          a.food.i = (a.food.i + 1) % opts.length; a.food.t = rnd(3.5, 6);
          v.pose = opts[a.food.i][0]; v.prop = opts[a.food.i][1];
          if (chance(0.3)) Sim.emote(v, pick(['😋', '🍽️', '☕', '✨']), 2);
        }
        continue;
      }
      // 고른 음식을 들고 빈자리에 앉기
      if (v._eatSeat && !v.act && !v.moving && !(v.route && v.route.length) && !v.sceneId) {
        const iid = v._eatSeat; v._eatSeat = null;
        if (v.loc !== iid) continue;
        const seats = Sim.furnUses(iid, u => (EAT_ACTS.includes(u.u.act) || u.u.pose === 'sit') && ((u.u.seatH || 0) > 0 || ['eat', 'drink', 'sit'].includes(u.u.pose)) && !['staff', 'perform'].includes(u.u.act) && !occ[u.key]);
        if (seats.length) { seats.sort((x, y) => Math.hypot(x.x - v.x, x.z - v.z) - Math.hypot(y.x - v.x, y.z - v.z)); Sim.goUse(v, seats[Math.floor(Math.random() * Math.min(3, seats.length))], 'eat_seat'); v.prop = (MENU[iid] || [['eat', 'bowl']])[0][1]; }
      }
    }
  }

  // =========================================================
  // 5. 틱 (게임 루프에 연결)
  // =========================================================
  const oTick = Sim.tick;
  Sim.tick = function (dtR) {
    oTick.apply(this, arguments);
    const st = S(); if (!st) return;
    const d = Math.min(dtR, 0.25);
    const k = Math.min(st.speed || 0, 4);
    try {
      runLater();
      if (k > 0) {
        const E = Ev();
        if (E && E.staff) for (const s of E.staff) tickStaff(s, d * k);
        tickSocial(d * k);
        tickFood(d * k);
        tickMood(d * st.speed * (Sim.CLOCK || 1));
      }
    } catch (e) { console.error('npclife tick', e); }
  };

  // =========================================================
  // 6. 직원과 대화 (미연시 창) — 인사 · 잡담 · 소문 · 대화로 주문/구매 · 팔기
  // =========================================================
  const SHOP_OF = { barista: 'cafe', conv: 'conv', stylist: 'mall', grocer: 'mall', tea: 'tea', pocha: 'pocha', librarian: 'library', pharmacist: 'pharmacy' };
  const FASHION = it => (it.tags || []).some(t => ['fashion', 'luxury', 'romance', 'plush'].includes(t)) || ['ticket', 'autoInterior', 'confess', 'propose', 'apology', 'special'].includes(it.special);
  function menuOf(s) {
    const key = SHOP_OF[s.role]; if (!key) return [];
    let items = Object.entries(D.ITEMS).filter(([, it]) => it.shop === key);
    if (s.role === 'stylist') items = items.filter(([, it]) => FASHION(it));
    if (s.role === 'grocer') items = items.filter(([, it]) => !FASHION(it));
    return items;
  }
  const TALK = {
    barista: ['요즘 라떼 아트 연습 중이에요. 하트는 성공했어요!', '오후 3시쯤이 제일 한가해요~', '단골손님 얼굴은 다 외웠답니다 ☕'],
    chef: ['생선은 새벽에 선착장에서 직접 골라요!', '초밥은 손의 온도가 생명이죠.', '오늘 참치가 아주 좋습니다!'],
    pub: ['탕수육은 부먹이 정답이지! 안 그래?', '여기 딤섬은 우리 할머니 레시피야~', '장사 30년에 이런 섬은 처음이야!'],
    dj: ['오늘 밤 무대는 누가 설까요? 🎷', '재즈는 즉흥이 매력이죠.', '비 오는 날엔 블루스가 딱이에요'],
    conv: ['밤 근무는 졸려요... 하암', '삼각김밥은 참치마요가 1등이에요!', '요즘 컵라면이 불티나게 팔려요'],
    tea: ['차는 마음을 데우는 음료지요.', '천천히 마셔야 향이 살아나요 🍵', '요즘 지친 손님이 많아 걱정이에요'],
    teacher: ['아이들이 쑥쑥 크는 게 보여요!', '받아쓰기 100점 받은 아이가 있어요 ㅎㅎ', '오늘 급식은 카레예요!'],
    librarian: ['(소곤) 요즘 연애소설이 인기예요', '(소곤) 시집 124페이지에 뭔가 끼워져 있대요...', '(소곤) 조용히 해 주셔서 감사해요'],
    clerk: ['민원이 너무 많아요... 😵', '서류는 항상 두 장씩!', '번호표 뽑으셨나요?'],
    judge: ['정의는 늘 조용히 이긴다.', '...정숙.', '다툼은 대화로 푸는 게 제일이지.'],
    boss: ['요즘 젊은 사람들은 일을 참 잘해!', '이번 분기 목표는 두 배야!', '커피 한 잔 할 텐가?'],
    grocer: ['오늘 사과가 제일 달아요! 🍎', '장바구니는 입구에 있어요~', '저녁 7시엔 떨이 세일해요!'],
    stylist: ['이번 시즌은 파스텔이 대세예요 🌸', '거울 앞에서 한 바퀴 돌아 보세요!', '손님은 핑크가 잘 어울릴 것 같아요'],
    doctor: ['잘 먹고 잘 자는 게 최고의 약입니다.', '엉뚱한 병도 다 고쳐 드려요!', '마음이 아플 때도 병원에 오세요.'],
    nurse: ['환자분들이 빨리 나으셨으면 좋겠어요 💗', '밤 근무엔 별이 잘 보여요', '마음이 힘든 분들도 많이 오세요...'],
    waiter: ['창가 자리는 예약이 꽉 찼어요!', '오늘의 추천은 안심 스테이크입니다', '야경은 밤 9시가 제일 예뻐요 ✨'],
    captain: ['⛴️ 오늘도 이웃 섬 손님이 올 거예요.'], pocha: ['어서 와~ 우동 한 그릇 해!', '추운 날엔 어묵 국물이 최고지!'], anchor: ['방송 5분 전이에요!', '오늘도 좋은 소식만 전하고 싶어요 📺'],
  };
  const TITLE = { barista: '바리스타', chef: '셰프', pub: '펍 사장님', dj: '바텐더', conv: '편의점 알바', tea: '차관 주인', teacher: '선생님', librarian: '사서', clerk: '공무원', judge: '판사', boss: '부장님', grocer: '마켓 계산원', stylist: '부티크 점원', doctor: '의사', nurse: '간호사', waiter: '웨이터', captain: '선장', pocha: '포차 사장님', anchor: '앵커' };
  const $ = q => document.querySelector(q);
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  let cur = null, typeT = null, full = '', shown = 0;
  const active = () => cur && !$('#dialog').hidden && $('#dialog').dataset.npc === '1';
  function skeleton(d) {
    d.innerHTML = `
      <div class="vn-stage"><canvas id="vnC"></canvas><div class="vn-fallback" id="vnFb"></div></div>
      <div class="vn-opts" id="vnOpts"></div>
      <div class="vn-box" id="vnBox">
        <div class="vn-name" id="vnName"></div>
        <div class="vn-meta" id="vnMeta"></div>
        <p class="vn-text" id="vnText"></p>
        <span class="vn-next" id="vnNext">▼</span>
        <div class="vn-tools"><button id="vnX" title="대화 끝내기 (Esc)">✕ 닫기</button></div>
      </div>`;
    $('#vnX').onclick = e => { e.stopPropagation(); close(); };
    $('#vnBox').onclick = () => finish();
  }
  function finish() {
    if (!cur) return;
    clearInterval(typeT); typeT = null; shown = full.length; $('#vnText').textContent = full; $('#vnNext').hidden = false;
    paintOpts();
  }
  function paintOpts() {
    const box = $('#vnOpts'); if (!box || !cur) return;
    const opts = cur.opts || [];
    box.innerHTML = opts.map((o, i) => `<button data-i="${i}" class="${o.bye ? 'bye' : ''}" ${o.disabled ? 'disabled' : ''} style="animation-delay:${i * 0.03}s">${esc(o.label)}${o.hint ? `<small>${esc(o.hint)}</small>` : ''}</button>`).join('');
    box.classList.toggle('many', opts.length > 7);
    box.querySelectorAll('button').forEach(b => b.onclick = e => { e.stopPropagation(); const o = cur.opts[+b.dataset.i]; if (o && !o.disabled) o.fn(); });
  }
  function show(text, opts, emo) {
    const s = cur.s, d = $('#dialog');
    if (d.hidden || d.dataset.npc !== '1' || !$('#vnBox')) skeleton(d);
    d.hidden = false; d.dataset.npc = '1'; document.body.classList.add('vn-on');
    cur.opts = opts;
    $('#vnName').innerHTML = `<b>${esc(s.name)}</b><small>${esc(TITLE[s.role] || '직원')}</small>`;
    $('#vnMeta').innerHTML = `<span class="tag">${esc(placeName(s.loc) || '')}</span><span class="tag">🪙 ${Math.floor(S().player.coins).toLocaleString()}</span>`;
    const e = emo || (FM.Portrait ? FM.Portrait.emotionOf(text, s) : 'calm');
    s.talkPose = FM.Portrait && (FM.Portrait.FACE[e] || FM.Portrait.FACE.calm).pose;
    const ok = FM.Portrait ? FM.Portrait.show($('#vnC'), s, e) : false;
    $('#vnFb').hidden = ok; if (!ok) $('#vnFb').textContent = '🙂';
    d.dataset.emo = e;
    $('#vnOpts').innerHTML = '';
    full = text; shown = 0; $('#vnNext').hidden = true;
    const el = $('#vnText'); el.textContent = '';
    clearInterval(typeT);
    const t0 = performance.now();
    typeT = setInterval(() => {
      const n = Math.min(full.length, Math.floor((performance.now() - t0) / 1000 * 36) + 1);
      if (n === shown) return;
      if (Math.floor(n / 2) !== Math.floor(shown / 2) && full[n - 1] !== ' ') { if (FM.Voice && FM.Voice.blip) FM.Voice.blip(s, full[n - 1]); else FM.Audio && FM.Audio.sfx('blip'); }
      shown = n; el.textContent = full.slice(0, shown);
      if (shown >= full.length) finish();
    }, 30);
    FM.Audio && FM.Audio.sfx('page');
  }
  function close() {
    const d = $('#dialog'); d.hidden = true; d.dataset.npc = ''; document.body.classList.remove('vn-on');
    clearInterval(typeT); typeT = null;
    FM.Portrait && FM.Portrait.hide();
    if (cur) { cur.s.talkingP = false; cur.s.talkPose = null; if (cur.s.np) cur.s.np.t = rnd(2, 4); }
    if (FM.G) FM.G.talkFocus = null;
    cur = null;
    FM.UI && FM.UI.paint && FM.UI.paint();
  }
  NL.close = close;
  const bye = () => ({ label: '👋 안녕히 계세요', bye: true, fn: () => { Sim.say(cur.s, pick(['또 오세요~!', '좋은 하루 보내세요!', '감사합니다~']), 2.4); close(); } });
  function mainMenu(text) {
    const s = cur.s, O = [];
    const menu = menuOf(s);
    if (menu.length) O.push({ label: s.role === 'doctor' || s.role === 'nurse' ? '💊 약 처방받고 싶어요' : s.role === 'librarian' ? '📚 책을 사고 싶어요' : '🛍️ 주문할게요 / 뭐 파세요?', fn: () => shopTalk(0) });
    const sell = ['fish_catch', 'bug_jar', 'dream_item', 'face_copy', 'rare_fruit'].filter(k => S().player.inv[k]);
    if (menu.length && sell.length && ['grocer', 'conv', 'pocha', 'chef'].includes(s.role)) O.push({ label: '💰 물건 팔고 싶어요', fn: sellTalk });
    O.push({ label: '💬 요즘 어때요?', fn: () => show(sty(s, pick(TALK[s.role] || ['열심히 일하고 있어요!'])), mainOpts()) });
    O.push({ label: '👂 요즘 마을 소문 없어요?', fn: rumorTalk });
    if (s.role === 'doctor' || s.role === 'nurse') O.push({ label: '🏥 입원한 환자들은 어때요?', fn: patientTalk });
    if (s.role === 'doctor' || s.role === 'nurse') O.push({ label: '🩺 저도 진찰받고 싶어요', fn: () => { const p = S().player; p.stamina = Math.min(100, (p.stamina || 0) + 30); show('음~ 푹 쉬고 잘 먹으면 금방 괜찮아질 거예요! 비타민 한 알 드릴게요 💊 (스태미나 +30)', mainOpts(), 'happy'); } });
    if (s.role === 'clerk' || s.role === 'judge') O.push({ label: '🏛️ 민원 창구 이용하기', fn: () => { close(); FM.UI.cityHall(); } });
    if (s.role === 'stylist') O.push({ label: '👗 저한테 어울리는 옷 추천해 주세요', fn: () => show(pick(['손님은 파스텔 핑크 원피스가 찰떡이에요! 🌸', '오늘은 베레모에 트렌치코트 어때요?', '심플한 흰 셔츠에 진주 목걸이! 우아함 그 자체예요 ✨']), mainOpts(), 'happy') });
    if (s.role === 'teacher') O.push({ label: '🧒 아이들 잘 지내요?', fn: () => { const kids = S().villagers.filter(v => v.child && v.child.stage !== 'BABY'); show(kids.length ? `${kids.slice(0, 3).map(k => k.name).join(', ')}... 다들 씩씩하게 잘 크고 있어요! 😊` : '아직 학교에 다니는 아이가 없어서 조금 심심해요~', mainOpts()); } });
    O.push(bye());
    show(text, O);
  }
  const mainOpts = () => [{ label: '↩️ 다른 이야기', fn: () => mainMenu(sty(cur.s, '또 궁금한 거 있으세요?')) }, bye()];
  function shopTalk(page) {
    const s = cur.s, p = S().player, menu = menuOf(s);
    const per = 7, pages = Math.ceil(menu.length / per), list = menu.slice(page * per, page * per + per);
    const intro = { barista: '오늘은 이런 메뉴가 있어요! 뭘로 드릴까요? ☕', conv: '찾으시는 거 있으세요? 이런 거 있어요~', stylist: '이번 시즌 추천 아이템이에요 🌹', grocer: '오늘 들어온 물건들이에요! 🍎', tea: '어떤 차로 드릴까요? 🍵', librarian: '(소곤) 판매용 도서는 이쪽이에요', doctor: '필요한 약을 말씀해 주세요.', nurse: '처방 없이 살 수 있는 약들이에요~', pocha: '뭐 먹을래? 다 맛있어!' }[s.role] || '뭘 드릴까요?';
    const O = list.map(([k, it]) => ({ label: `${it.icon} ${it.name}`, hint: `${it.price.toLocaleString()} 🪙${p.coins < it.price ? ' · 코인 부족' : ''}`, fn: () => confirmBuy(k, page) }));
    if (pages > 1) O.push({ label: `➡️ 다른 상품 보기 (${page + 1}/${pages})`, fn: () => shopTalk((page + 1) % pages) });
    O.push({ label: '📋 메뉴판 전체 보기', fn: () => { const key = SHOP_OF[s.role]; close(); origShop(key); } });
    O.push({ label: '↩️ 괜찮아요', fn: () => mainMenu(sty(s, '천천히 둘러보세요~')) });
    show(page ? '이런 것도 있어요!' : intro, O);
  }
  function confirmBuy(k, page) {
    const s = cur.s, it = D.ITEMS[k], p = S().player;
    const ask = { barista: `${it.name} 말씀이시죠? ${it.price}코인입니다! 따뜻하게 드릴까요?`, conv: `${it.name} ${it.price}코인이요~ 봉투 필요하세요?`, stylist: `${it.name}! 안목이 좋으시네요 ✨ ${it.price.toLocaleString()}코인이에요.`, grocer: `${it.name}이요? ${it.price}코인입니다! 신선해요~`, tea: `${it.name} 한 잔, ${it.price}코인이에요. 천천히 우려 드릴게요.`, doctor: `${it.name}... 용법을 꼭 지켜 주세요. ${it.price}코인입니다.`, nurse: `${it.name} ${it.price}코인이에요. 식후 30분에 드세요 💊`, librarian: `(소곤) ${it.name}, ${it.price}코인이에요.`, pocha: `${it.name}? 좋지! ${it.price}코인!` }[s.role] || `${it.name}, ${it.price}코인입니다.`;
    show(ask, [
      { label: `💳 네, 계산할게요 (${it.price.toLocaleString()}🪙)`, disabled: p.coins < it.price, hint: p.coins < it.price ? '코인이 부족해요' : '', fn: () => {
        if (p.coins < it.price) return;
        p.coins -= it.price; FM.Soc.giveItem(k); FM.Audio && FM.Audio.sfx('coin');
        cur.s.pose = 'bow'; cur.s.prop = null;
        FM.UI.toast(`${it.icon} ${it.name}을(를) 샀어요!`);
        if (FM.Consume) { const kk = k; setTimeout(() => { if (cur) close(); FM.Consume.afterBuy(kk); }, 1400); }
        const thanks = { barista: '감사합니다! 맛있게 드세요~ ☕', conv: '감사합니다~ 또 오세요!', stylist: '정말 잘 어울리실 거예요! 🌹', grocer: '감사합니다! 포인트 적립해 드렸어요~', tea: '따뜻할 때 드세요 🍵', doctor: '빨리 나으세요!', nurse: '몸조리 잘하세요 💗', librarian: '(소곤) 즐거운 독서 되세요', pocha: '고마워~ 또 와!' }[s.role] || '감사합니다!';
        show(thanks, [{ label: '🛍️ 더 살래요', fn: () => shopTalk(page) }, { label: '↩️ 다른 이야기', fn: () => mainMenu(sty(s, '또 필요한 거 있으세요?')) }, bye()], 'happy');
      } },
      { label: '🤔 음... 다른 거 볼게요', fn: () => shopTalk(page) },
    ]);
  }
  function sellTalk() {
    const s = cur.s, p = S().player;
    const sell = ['fish_catch', 'bug_jar', 'dream_item', 'face_copy', 'rare_fruit'].filter(k => p.inv[k]);
    show('오, 뭘 가져오셨어요? 한 개에 80코인씩 쳐 드릴게요!', sell.map(k => ({ label: `${D.ITEMS[k].icon} ${D.ITEMS[k].name} ×${p.inv[k]}`, hint: '+80 🪙', fn: () => { if (FM.Soc.takeItem(k)) { p.coins += 80; FM.Audio && FM.Audio.sfx('coin'); } sellTalk2(); } })).concat([{ label: '↩️ 됐어요', fn: () => mainMenu(sty(s, '또 가져오세요~')) }]));
  }
  function sellTalk2() { const p = S().player; const any = ['fish_catch', 'bug_jar', 'dream_item', 'face_copy', 'rare_fruit'].some(k => p.inv[k]); if (any) sellTalk(); else show('좋은 물건 고마워요! 다 샀어요~', mainOpts(), 'happy'); }
  function rumorTalk() {
    const s = cur.s, st = S();
    const log = (st.log || []).slice(-80).reverse().find(e => ['rel', 'couple', 'breakup', 'wedding', 'medical', 'mood', 'gossip'].includes(e.type) && e.day >= day() - 2);
    const text = log ? `${pick(['(소곤) 그거 들었어요?', '손님들이 그러는데요,', '여기서만 하는 얘긴데...'])} ${log.text.replace(/^\S+\s/, '')}` : pick(['요즘은 조용하네요~ 평화로운 섬이에요.', '특별한 소문은 없어요. 다들 잘 지내요!']);
    show(text, mainOpts(), log && /💔|🚑|🏥|😔|💢/.test(log.text) ? 'sad' : 'calm');
  }
  function patientTalk() {
    const pts = S().villagers.filter(v => v.status.hospital);
    show(pts.length ? `지금 ${pts.length}명이 입원해 있어요. ${pts.slice(0, 4).map(v => `${v.name} (${v.status.disease || '치료 중'})`).join(', ')}... 병문안 가 주시면 다들 기운 낼 거예요 💗` : '지금은 입원한 분이 없어요. 다행이죠! 😊', mainOpts(), pts.length ? 'sad' : 'happy');
  }
  function npcTalk(s, toShop) {
    if (!s) return;
    if (cur && cur.s !== s) close();
    const G = FM.G;
    if (s.sceneId) { FM.UI.toast(`${s.name}은(는) 지금 바빠요`); return; }
    cur = { s, opts: [] };
    s.talkingP = true; if (s.np) { s.np.path = null; } s.moving = false;
    const p = S().player; if (p.loc === s.loc) s.ry = faceTo(s, p);
    if (G) { G.talkFocus = s.id; G.target = null; G.autoPath = null; }
    if (toShop && menuOf(s).length) return shopTalk(0);
    const h = hour();
    const hi = h < 11 ? '좋은 아침이에요!' : h < 18 ? '안녕하세요!' : '좋은 저녁이에요~';
    mainMenu(`${hi} ${pick(GREET[s.role] || ['무엇을 도와드릴까요?'])}`);
  }
  NL.talk = npcTalk;
  NL.SHOP_OF = SHOP_OF; NL.TALK = TALK; NL.TITLE = TITLE; NL.GREET = GREET;
  // UI 연결: 직원 클릭 · 말 걸기 → 대화 창 / 상점 이용하기 → 직원과 대화로 주문
  const origShop = FM.UI.shop;
  FM.UI.staffTalk = s => npcTalk(s);
  FM.UI.shop = function (key) {
    const p = S().player, E = Ev();
    if (!active() && E && p && p.loc !== 'island') {
      const roles = Object.entries(SHOP_OF).filter(([, k]) => k === key).map(([r]) => r);
      const cand = E.staff.filter(s => s.loc === p.loc && roles.includes(s.role) && !s.sceneId).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
      if (cand.length) return npcTalk(cand[0], true);
    }
    return origShop(key);
  };
  const oPick = FM.UI.vnPick, oAdv = FM.UI.vnAdvance, oEsc = FM.UI.escape;
  FM.UI.vnPick = i => { if (active()) { if (shown < full.length) return finish(); const b = document.querySelectorAll('#vnOpts button')[i]; if (b && !b.disabled) b.click(); return; } return oPick(i); };
  FM.UI.vnAdvance = () => { if (active()) { if (shown < full.length) finish(); return; } return oAdv(); };
  FM.UI.escape = () => { if (active()) return close(); return oEsc(); };
})();
