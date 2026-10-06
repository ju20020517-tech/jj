/* =========================================================
 *  플레이어 생(生) 시스템 — 연애 → 결혼(동거·전용 공간) → 육아 4단계 → 2세 독립 & 가문
 *
 *   영유아기 (0~3일)  요람 · 분유 · 자장가 · 달래기
 *   유아기   (4~7일)  아장아장 · 장난감 던지기 · 안아주기 · 뒤따라오기
 *   아동기   (8~14일) 동화책(탐구파) · 공놀이(운동파) · 미술 세트(예술파) … 교육으로 메인 성격 육성
 *   독립기   (15일~)  새 주민으로 등록, 빈 집에 입주해 자기만의 관계망을 만듦
 *
 *  유전: 외형 = 플레이어 50% + 배우자 50% / 성격 = 배우자 40% + 교육 40% + 돌연변이 20%
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, D = FM.D;
  const P = 'P';
  const S = () => Sim.get();
  const pl = () => S().player;
  const byId = id => Sim.byId(id);
  const nm = id => Sim.nameOf(id);
  const day = () => Sim.time.day();
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const Life = (FM.Life = {});

  // ---------------------------------------------------------
  // 성장 단계 (일수)
  // ---------------------------------------------------------
  D.PARENT.babyDays = 4; D.PARENT.toddlerDays = 4; D.PARENT.childDays = 7;
  const G0 = D.GROWTH;
  G0[0].name = '영유아기 (0~3일)'; G0[0].days = 4; G0[0].must = '분유 타 주기 · 자장가 · 달래기 · 요람 흔들기';
  G0[1].name = '유아기 (4~7일)'; G0[1].days = 4; G0[1].must = '장난감 던지기 · 안아주기 · 뒤따라오기 · 숨바꼭질';
  G0[2].name = '아동기 (8~14일)'; G0[2].days = 7; G0[2].must = '동화책 · 공놀이 · 미술 세트 · 노래 교실 — 교육으로 성격 육성';
  const INDEP_DAY = 15;
  Life.INDEP_DAY = INDEP_DAY;

  // 아동기 교육 → 메인 성격(Layer 1)
  const EDU = {
    story: { label: '📖 동화책 읽어 주기', key: 'SCHOLARLY', txt: '옛날 옛날에... (눈이 반짝반짝)' },
    ball: { label: '⚽ 공놀이 하기', key: 'ATHLETIC', txt: '뻥! 슛~ 골인!!' },
    art: { label: '🎨 미술 세트 선물', key: 'ARTISTIC', txt: '쓱싹쓱싹... 엄마 아빠 그렸어!' },
    sing: { label: '🎤 노래 교실', key: 'EXTROVERT', txt: '랄랄라~ 박수 쳐 줘!' },
    manners: { label: '🎩 예절 교육', key: 'SNOB', txt: '안녕하십니까. (꾸벅)' },
    stars: { label: '🌙 별 보며 이야기하기', key: 'ROMANTIC', txt: '저 별은 우리 가족 별이야!' },
    snack: { label: '🍪 간식 파티', key: 'LAZY', txt: '냠냠... 행복해...' },
  };
  Life.EDU = EDU;
  const TODDLER = { toy: ['🧸 장난감 던지기', '데굴데굴~ 꺄르르!', 5], hug: ['🤗 꼭 안아주기', '(폭 안긴다) 헤헤...', 6], follow: ['👣 뒤따라오게 하기', '아장아장... 따라갈래!', 4], hide: ['🙈 숨바꼭질', '(커튼 뒤에서 발이 보인다) …여기 없어!', 5], book: ['📕 그림책 읽기', '멍멍이! 멍멍이 또 읽어 죠!', 5] };
  const BABY = { soothe: ['🤱 달래기', '(울음을 그치고 새근새근)', 6], milk: ['🍼 분유 주기', '(꿀꺽꿀꺽… 끄억!) 꺄르르', 6], lullaby: ['🎶 자장가 불러 주기', '(눈꺼풀이 스르르…) 새근새근', 5], peek: ['🙈 까꿍 놀이', '까꿍! …꺄르르르!', 4] };

  const origOpts = Soc.talkOptions;
  Soc.talkOptions = function (v) {
    let O = origOpts(v);
    // 아기 · 유아에게는 어른용 대화(부추기기 · 방 치워 · 부탁 등)를 띄우지 않음
    if (v && v.child && (v.child.stage === 'BABY' || v.child.stage === 'TODDLER') && Array.isArray(O)) {
      O = O.filter(o => o.id === 'bye' || o.id === 'gift' || (typeof o.id === 'string' && o.id.startsWith('baby:')));
      if (!v.child.parents.includes(P)) { const bi = O.findIndex(o => o.id === 'bye'); O.splice(bi < 0 ? O.length : bi, 0, { id: 'baby:peek', label: '🙈 까꿍 놀이' }); }
    }
    if (!v || !v.child || !v.child.parents.includes(P)) return O;
    const add = [];
    const st2 = v.child.stage;
    if (st2 === 'BABY') for (const [k, [l]] of Object.entries(BABY)) add.push({ id: 'baby:' + k, label: l });
    if (st2 === 'TODDLER') for (const [k, [l]] of Object.entries(TODDLER)) add.push({ id: 'baby:' + k, label: l });
    if (st2 === 'CHILD') for (const [k, e] of Object.entries(EDU)) add.push({ id: 'baby:edu_' + k, label: `${e.label} → ${D.L1[e.key].icon} ${D.L1[e.key].name}` });
    const bi = O.findIndex(o => o.id === 'bye');
    O.splice(bi < 0 ? O.length : bi, 0, ...add);
    return O;
  };
  const origChoose = Soc.playerChoose;
  Soc.playerChoose = function (v, id, arg) {
    if (typeof id === 'string' && id.startsWith('baby:') && v && v.child) {
      const k = id.slice(5); const c = v.child;
      if (k.startsWith('edu_') && EDU[k.slice(4)]) {
        const e = EDU[k.slice(4)];
        c.edu = c.edu || {}; c.edu[e.key] = (c.edu[e.key] || 0) + 1;
        c.parenting_satisfaction = clamp(c.parenting_satisfaction + 4, 0, 100); c.attach[P] = clamp((c.attach[P] || 60) + 3, 0, 100);
        c.env.talk++; if (k === 'edu_ball') c.env.outdoor++;
        Sim.emote(v, pick(['😊', '✨', '🥰']));
        const top = Object.entries(c.edu).sort((a, b) => b[1] - a[1])[0];
        return { text: FM.josa(`${e.txt}  (교육 기록: ${D.L1[top[0]].icon} ${D.L1[top[0]].name} ${top[1]}회 — 독립할 때 성격에 40% 반영)`), options: Soc.talkOptions(v) };
      }
      const T = TODDLER[k] || BABY[k];
      if (T) {
        c.parenting_satisfaction = clamp(c.parenting_satisfaction + T[2], 0, 100); c.attach[P] = clamp((c.attach[P] || 60) + T[2] / 2, 0, 100); c.env.talk++;
        if (c.crying) c.crying = false;
        if (k === 'follow' && Soc.addFollower) Soc.addFollower(v, 'walk');
        if (k === 'toy') Sim.fx && Sim.fx('sparkle', v);
        Sim.emote(v, k === 'hug' ? '🥰' : k === 'lullaby' ? '💤' : k === 'milk' ? '🍼' : '😊');
        if (k === 'book') { c.edu = c.edu || {}; c.edu.SCHOLARLY = (c.edu.SCHOLARLY || 0) + 0.5; }
        return { text: T[1], options: Soc.talkOptions(v), close: k === 'follow' };
      }
    }
    return origChoose(v, id, arg);
  };

  // ---------------------------------------------------------
  // 독립 — 새 주민으로 (성격: 배우자 40% + 교육 40% + 돌연변이 20%)
  // ---------------------------------------------------------
  function inheritL1(v) {
    const c = v.child;
    const other = c.parents.find(id => id !== P) || c.parents[1];
    const O = byId(other);
    const roll = Math.random();
    const eduTop = c.edu && Object.entries(c.edu).sort((a, b) => b[1] - a[1])[0];
    if (roll < 0.4 && O) return { key: O.keys.L1, why: `${O.name}에게서 물려받음` };
    if (roll < 0.8 && eduTop) return { key: eduTop[0], why: `어릴 적 교육 (${D.L1[eduTop[0]].name} ${eduTop[1]}회)` };
    if (roll < 0.8 && c.parents.includes(P)) return { key: (pl().keys || {}).L1 || v.keys.L1, why: `${pl().name}의 성격을 닮음` };
    return { key: pick(Object.keys(D.L1)), why: '엉뚱한 돌연변이!' };
  }
  Life.inheritL1 = inheritL1;
  function lineage(v) {
    const st = S();
    const ps = v.child ? v.child.parents : (v.grownUp && v.grownUp.parents) || [];
    if (ps.includes(P)) return { house: `${pl().name} 가문`, gen: 2 };
    for (const id of ps) { const p0 = byId(id); if (p0 && p0.grownUp && p0.grownUp.house) return { house: p0.grownUp.house, gen: (p0.grownUp.gen || 2) + 1 }; }
    const a = byId(ps[0]); return { house: a ? `${a.name} 가문` : '섬 가문', gen: 2 };
    void st;
  }
  Life.lineage = lineage;
  function independence(v) {
    const c = v.child;
    const inh = inheritL1(v);
    const lin = lineage(v);
    const oldHome = v.home;
    v.grownUp = { parents: c.parents.slice(), day: day(), from: c.stage, house: lin.house, gen: lin.gen, why: inh.why, edu: c.edu || {} };
    v.keys.L1 = inh.key;
    if (c.third) v.keys.L3 = c.third;
    v.extraMain = [];
    delete v.child;
    v.job = pick(['office', 'freelance', 'office', 'pharmacist']);
    v.coins = (v.coins || 0) + 1500;
    // 빈 집 (빌라 선호) — 없으면 부모 집에 그대로
    const home = Sim.freeHome('villa');
    if (home && home !== oldHome) Soc.moveHome(v, home);
    try { Sim.derive(v); } catch (e) { /* 무시 */ }
    if (FM.Chars && FM.Chars.get) { const m = FM.Chars.get(v.id); if (m) m.key = null; }
    FM.bus.emit('outfit', v);
    for (const pid of v.grownUp.parents) { const pa = pid === P ? null : byId(pid); if (pa && FM.Will) FM.Will.remember(pa, 'family', `${v.name}이(가) 독립해서 집을 떠났어`); }
    if (FM.Will) FM.Will.remember(v, 'family', `${lin.house} ${lin.gen}세로 독립했어`);
    Sim.log('baby', `🎓 ${v.name}이(가) 어른이 되어 독립했어요! ${home && home !== oldHome ? FM.INTERIORS[home].name + '에 입주 · ' : ''}성격: ${D.L1[inh.key].icon} ${D.L1[inh.key].name} (${inh.why}) — ${lin.house} ${lin.gen}세`, v.grownUp.parents.filter(x => x !== P).concat([v.id]), 3, { newsKind: 'baby' });
    FM.bus.emit('toast', `🎓 ${v.name} 독립! ${lin.house}의 ${lin.gen}세가 새 주민이 되었어요`);
  }
  Life.independence = independence;

  // ---------------------------------------------------------
  // 결혼 & 동거 — 배우자 취향 전용 룸 · 아침 도시락 · 집안일 대행
  // ---------------------------------------------------------
  const BASIC = /bed|door|window|rug|carpet|wall|ceiling|light|lamp|curtain|crib|cradle|kid_/;
  function spouseCorner(sp) {
    const st = S(), p = pl();
    Sim.ensurePlayerRoom && Sim.ensurePlayerRoom();
    const room = st.rooms.home_p_in; if (!room || room.spouseCorner === sp.id) return;
    // 집 증축 (결혼 선물)
    const lv = p.houseLevel || 1, LV = FM.HOUSE_LEVELS;
    if (LV && lv < LV.length && LV[lv - 1]) { const a = LV[lv - 1], b = LV[lv]; p.houseLevel = lv + 1; for (const f of room.furn) { f.x *= b.w / a.w; f.z *= b.d / a.d; } }
    const sz = Sim.interiorSize('home_p_in');
    let src = null; try { src = FM.defaultRoom(sp, 6, 5, null); } catch (e) { src = null; }
    const picks = (src ? src.furn : []).filter(f => !BASIC.test(f.type || '')).slice(0, 5);
    const x0 = sz.w / 2 - 2.2, z0 = -sz.d / 2 + 1.4;
    picks.forEach((f, i) => { const g = Object.assign({}, f); g.x = x0 + (i % 2) * 1.2 - 0.3; g.z = z0 + Math.floor(i / 2) * 1.2; g.spouse = sp.id; room.furn.push(g); });
    room.spouseCorner = sp.id;
    Sim.log('home', `🏡 ${sp.name}와(과) 결혼하면서 집이 증축되고, ${sp.name}의 취향 전용 코너가 생겼어요! (${D.kw(sp.keys.L4) ? D.kw(sp.keys.L4).name : '취미'})`, [sp.id, P], 2);
    if (FM.G && FM.G.rebuildInterior && st.player.loc === 'home_p_in') FM.G.rebuildInterior();
  }
  Life.spouseCorner = spouseCorner;
  function spouseOfPlayer() {
    const m = S().marriages.find(x => x.marriage_stage === 'MARRIED' && (x.spouse_a_id === P || x.spouse_b_id === P));
    return m ? byId(m.spouse_a_id === P ? m.spouse_b_id : m.spouse_a_id) : null;
  }
  Life.spouse = spouseOfPlayer;
  function morningChores() {
    const sp = spouseOfPlayer(); if (!sp) return;
    const st = S(); const room = st.rooms.home_p_in; if (!room) return;
    spouseCorner(sp);
    const n = (room.trash || []).length;
    room.trash = []; room.clean = 100;
    const garden = st.plants ? Object.values(st.plants).filter(x => x && x.owner === P).length : 0;
    if (st.plants) for (const pl0 of Object.values(st.plants)) if (pl0 && pl0.owner === P) pl0.watered = day();
    FM.bus.emit('toast', `💞 ${sp.name}이(가) 아침 일찍 ${n ? `쓰레기 ${n}개를 치우고 ` : ''}집 청소${garden ? '와 화분 물주기' : ''}를 해 줬어요`);
    if (FM.Will) FM.Will.remember(sp, 'family', '아침에 집안일을 했어');
  }

  // ---------------------------------------------------------
  // 틱
  // ---------------------------------------------------------
  FM.bus.on('hour', h => {
    try {
      const st = S(); if (!st) return;
      if (h === 7) morningChores();
      if (h === 8) for (const v of st.villagers.slice()) if (v.child && v.child.stage === 'CHILD' && day() - v.child.birthDay >= INDEP_DAY) independence(v);
    } catch (e) { console.error('life', e); }
  });
  FM.bus.on('log', e => { try { if (e && e.type === 'wedding' && (e.who || []).includes(P)) { const sp = byId((e.who || []).find(x => x !== P)); if (sp) setTimeout(() => spouseCorner(sp), 50); } } catch (er) { /* 무시 */ } });
})();
