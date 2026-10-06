/* =========================================================
 *  관계 시스템
 *  친구(우정 4단계) · 짝사랑(4단계) · 연애(4대 심리 스탯) · 질투/삼각관계 ·
 *  권태기/이별/재회 · 결혼/결혼식 · 육아/유전 · 퀘스트 · 플레이어 대화
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, D = FM.D, MAP = FM.MAP, Sim = FM.Sim, L = FM.L;
  const { rnd, rint, pick, chance, clamp, dist } = Sim.u;
  const { day, hour, weekday, inH } = Sim.time;
  const has = Sim.has;
  const emit = FM.bus.emit;
  const Soc = (FM.Soc = {});
  const S = () => Sim.get();
  const P = 'P';
  const byId = id => Sim.byId(id);
  const nm = id => Sim.nameOf(id);

  // =========================================================
  // 1. 우정 핵심 데이터 구조
  // =========================================================
  const key = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
  function rel(a, b) {
    const k = key(a, b);
    const st = S();
    if (!st.rel[k]) {
      const isP = a === P || b === P;
      st.rel[k] = {
        friendship_id: 'friend_' + String(Object.keys(st.rel).length + 1).padStart(3, '0'),
        subject_id: a < b ? a : b, target_id: a < b ? b : a,
        friendship_point: isP ? 5 : rint(5, 32), trust_level: isP ? 10 : rint(10, 35),
        friendship_stage: 'ACQUAINTANCE', friend_archetype: null, secret_shared: false, nickname: {},
        greetDay: 0, lastDay: day(), permanent: false,
        status: 'NONE', since: 0, dates: 0, lastDate: day(), boredom: 0, stagnation_days: 0, breakup_cause: null, cooldown_until: 0, sameLine: 0, lastLine: '',
        misunderstanding: null, avoidZone: null,
      };
      st.rel[k].friend_archetype = archetypeOf(a, b);
      updateStage(st.rel[k]);
    }
    return st.rel[k];
  }
  Soc.rel = rel;
  Soc.hasRel = (a, b) => !!S().rel[key(a, b)];
  function F(a, b) { const k = a + '>' + b; const st = S(); return st.dir[k] || (st.dir[k] = { romance: 0, affection: 0 }); }
  Soc.F = F;

  // 성격 조합별 우정 케미스트리
  function archetypeOf(a, b) {
    const A = a === P ? null : byId(a), B = b === P ? null : byId(b);
    const ks = [...(A ? Sim.allKeys(A) : []), ...(B ? Sim.allKeys(B) : [])];
    const pair = (x, y) => (A && B) && ((has(A, x) && has(B, y)) || (has(A, y) && has(B, x)));
    if (pair('ATHLETIC', 'CRANKY')) return 'RIVAL_FRIEND';
    if (pair('SCHOLARLY', 'INTROVERT') || pair('SCHOLARLY', 'SHY') || pair('SCHOLARLY', 'CURIOUS') || pair('SCHOLARLY', 'ANXIOUS')) return 'MENTOR';
    if (pair('ROMANTIC', 'WARM') || pair('ROMANTIC', 'DREAMY') || pair('ROMANTIC', 'ROMANTIC')) return 'SOULMATE';
    if (ks.includes('ATHLETIC') && ks.filter(k => k === 'ATHLETIC' || k === 'PASSIONATE').length >= 2) return 'RIVAL_FRIEND';
    if (ks.includes('SCHOLARLY')) return 'MENTOR';
    if (ks.includes('ROMANTIC') || ks.includes('DREAMY')) return 'SOULMATE';
    return 'PARTNER_IN_CRIME';
  }
  function updateStage(r) {
    const fp = r.friendship_point, tr = r.trust_level;
    let st = 'ACQUAINTANCE';
    if (fp >= 30) st = 'FRIEND';
    if (fp >= 60 && tr >= 35) st = 'GOOD_FRIEND';
    if (fp >= 85 && tr >= 55) st = 'BEST_FRIEND';
    if (r.permanent) st = 'BEST_FRIEND';
    const prev = r.friendship_stage;
    r.friendship_stage = st;
    return prev !== st ? { prev, st } : null;
  }
  const STAGE_ORDER = ['ACQUAINTANCE', 'FRIEND', 'GOOD_FRIEND', 'BEST_FRIEND'];
  Soc.stageAtLeast = (a, b, st) => STAGE_ORDER.indexOf(rel(a, b).friendship_stage) >= STAGE_ORDER.indexOf(st);
  Soc.stageName = id => (D.FRIEND_STAGES.find(s => s.id === id) || {}).name || id;

  function addFriend(a, b, dfp, dtr, why) {
    if ((a === P || b === P) && Soc.repMul) dfp = Soc.repMul(dfp);   // 평판에 따라 호감 오르는 속도
    const r = rel(a, b);
    r.friendship_point = clamp(r.friendship_point + dfp, 0, 100);
    r.trust_level = clamp(r.trust_level + dtr, 0, 100);
    r.lastDay = day();
    const ch = updateStage(r);
    if (ch) {
      const up = STAGE_ORDER.indexOf(ch.st) > STAGE_ORDER.indexOf(ch.prev);
      Sim.log('friend', `${up ? '🤝' : '💔'} ${nm(a)} ↔ ${nm(b)} : ${Soc.stageName(ch.prev)} → ${Soc.stageName(ch.st)}`, [a, b], up && ch.st === 'BEST_FRIEND' ? 2 : 1);
      if (up && (a === P || b === P)) emit('toast', `${nm(a === P ? b : a)}와(과) ${Soc.stageName(ch.st)} 사이가 되었어요! (${D.FRIEND_STAGES.find(s => s.id === ch.st).unlock})`);
    }
    // 호감도 (Affection) = 친밀도 및 신뢰도
    if (a !== P) F(a, b).affection = (r.friendship_point + r.trust_level) / 2;
    if (b !== P) F(b, a).affection = (r.friendship_point + r.trust_level) / 2;
    if (why && (a === P || b === P)) emit('relchange', { a, b, dfp, dtr, why });
    return r;
  }
  Soc.addFriend = addFriend;
  const affection = (a, b) => { const r = rel(a, b); return (r.friendship_point + r.trust_level) / 2; };
  Soc.affection = affection;

  // =========================================================
  // 가족 / 연인 도우미
  // =========================================================
  function partnerOf(id) {
    const st = S();
    for (const r of Object.values(st.rel)) {
      if (['DATING', 'ENGAGED', 'MARRIED'].includes(r.status) && (r.subject_id === id || r.target_id === id)) return r.subject_id === id ? r.target_id : r.subject_id;
    }
    return null;
  }
  Soc.partnerOf = partnerOf;
  function family(a, b) {
    if (a === b) return true;
    const A = a === P ? S().player : byId(a), B = b === P ? S().player : byId(b);
    if (!A || !B) return false;
    if ((A.siblings || []).includes(b) || (B.siblings || []).includes(a)) return true;   // 남매
    const pa = (A.child && A.child.parents) || [], pb = (B.child && B.child.parents) || [];
    if (pa.includes(b) || pb.includes(a)) return true;
    if (pa.length && pa.some(x => pb.includes(x))) return true;
    return false;
  }
  Soc.family = family;
  const adult = v => v === P || (v && !v.child);
  // 성별: 연애는 남녀끼리만
  function genderOf(id) {
    const v = id === P ? S().player : byId(id); if (!v) return null;
    if (v.gender) return v.gender;
    const l = v.look || {}; return l.gender || (l.lashes || l.top === 'dress' || l.bottom === 'skirt' ? 'F' : 'M');
  }
  Soc.genderOf = genderOf;
  function canRomance(a, b) {
    if (family(a, b)) return false;
    const ga = genderOf(a), gb = genderOf(b); if (ga && gb && ga === gb) return false;
    const A = a === P ? P : byId(a), B = b === P ? P : byId(b);
    if (!adult(A) || !adult(B)) return false;
    const r = rel(a, b);
    if (r.status === 'EX' && r.cooldown_until > day()) return false;
    const pa = partnerOf(a), pb = partnerOf(b);
    if (pa && pa !== b) { const pr = rel(a, pa); if (pr.status === 'MARRIED') return false; }
    if (pb && pb !== a) { const pr = rel(b, pb); if (pr.status === 'MARRIED') return false; }
    return true;
  }
  Soc.canRomance = canRomance;

  // =========================================================
  // 설렘 (Romance) — 취향 저격, 부추김, 로맨틱 장소
  // =========================================================
  function tasteMatch(v, other) {
    if (other === P || other === S().player) {
      const pl = S().player;
      return v.likesSpecies === 'human' || (pl.look && v.likesSpecies === pl.look.species) || chance(0.3);
    }
    const ks = Sim.allKeys(other);
    return v.likesKeys.some(k => ks.includes(k)) || (v.likesSpecies && other.look && other.look.species === v.likesSpecies);
  }
  Soc.tasteMatch = tasteMatch;
  function addRomance(aId, bId, n, why) {
    if (aId === P) return;
    const v = byId(aId); if (!v || !canRomance(aId, bId)) return;
    const arch = D.LOVE_ARCH[v.loveArch];
    if (n > 0 && arch.romanceMul) n *= arch.romanceMul;
    const f = F(aId, bId);
    const before = f.romance;
    f.romance = clamp(f.romance + n, 0, 100);
    // 짝사랑 진입 기준: crush_intensity 60 이상
    if (f.romance >= 60 && before < 60) enterCrush(v, bId, why);
    if (v.crush && v.crush.target === bId) syncCrush(v);
    // 직진형: 설렘 수치가 50만 넘어도 즉시 고백 시도
    if (v.loveArch === 'BOLD' && f.romance >= 50 && before < 50 && partnerOf(aId) !== bId && !partnerOf(aId)) {
      setTimeout0(() => selfConfess(v, bId));
    }
  }
  Soc.addRomance = addRomance;
  const later = [];
  const setTimeout0 = fn => later.push(fn);

  function enterCrush(v, target, why) {
    if (partnerOf(v.id) === target) return;
    if (v.crush && v.crush.target && v.crush.target !== target) {
      // 자유로운 영혼형은 금방 다른 주민에게 설렘
      if (v.loveArch !== 'FREE' && F(v.id, v.crush.target).romance > F(v.id, target).romance) return;
    }
    v.crush = { crush_target_id: target, target, crush_intensity: F(v.id, target).romance, intensity: F(v.id, target).romance, heartbreak_risk: v.crush ? v.crush.heartbreak_risk : 0,
      crush_stage: 'SECRET_CRUSH', stage: 'SECRET_CRUSH', secret_actions_done: [], player_aware: false, since: day(), readySince: 0 };
    Sim.log('crush', `💗 ${v.name}이(가) 몰래 ${nm(target)}을(를) 좋아하기 시작했어요...${why ? ' (' + why + ')' : ''}`, [v.id, target], 1, { secret: true });
    syncCrush(v);
    // 삼각관계 탐지
    detectTriangles(v);
  }
  function crushStageOf(n) {
    for (const s of D.CRUSH_STAGES) if (n >= s.min && n <= s.max) return s.id;
    return n > 100 ? 'CONFESSION_READY' : null;
  }
  function syncCrush(v) {
    const c = v.crush; if (!c) return;
    const n = F(v.id, c.target).romance;
    c.intensity = c.crush_intensity = Math.round(n);
    const st = crushStageOf(n);
    if (!st) { endCrush(v, 'fade'); return; }
    if (st !== c.stage) {
      c.stage = c.crush_stage = st;
      if (st === 'CONFESSION_READY') {
        c.readySince = day();
        if (c.target === P) { playerCrushConfess(v); return; }
        Sim.balloon(v, 'crush', 'pink', { target: c.target });
        Sim.log('crush', `💭 ${v.name}의 머리 위에 분홍색 고민 풍선(!)이 떴어요.`, [v.id], 2);
        emit('notify', { v, text: `${v.name}에게 연애 고민이 있어요! (분홍색 고민 풍선)` });
      }
      if (st === 'OBSESSED') Sim.emote(v, chance(0.5) ? '🟣' : '💗', 4);
    }
  }
  function endCrush(v, why) {
    if (!v.crush) return;
    if (v.balloon && v.balloon.kind === 'crush') v.balloon = null;
    v.crush = null;
    void why;
  }
  Soc.endCrush = endCrush;

  // =========================================================
  // 대화 (TALK_NPC) — 2~3초간 수다/손짓/웃음
  // =========================================================
  function startChat(a, b, kind) {
    if (a.sceneId || b.sceneId || a.loc !== b.loc || a.loc === 'metro') return false;
    const r = rel(a.id, b.id);
    if (r.misunderstanding && r.misunderstanding.until > day() && chance(0.8)) { Sim.emote(a, '💢'); Sim.emote(b, '😤'); return false; }
    if (r.status === 'EX' && r.cooldown_until > day()) return false;
    const best = r.friendship_stage === 'BEST_FRIEND';
    const steps = [
      { go: 'A', to: { actor: 'B', near: 1.1 }, run: !!a.run, max: 25 },
      { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
    ];
    // 절친 — 시그니처 인사 (하이파이브, 힙합 인사, 양손 댄스) + 반짝이
    if (best) {
      const sg = r.signature || (r.signature = pick(D.SIGNATURE_GREETS).id);
      steps.push({ par: [{ pose: 'A', p: sg, t: 1.6 }, { pose: 'B', p: sg, t: 1.6 }] }, { emote: 'A', e: '✨' }, { emote: 'B', e: '✨' });
    }
    let line = kind === 'yardGreet' ? '안녕! 우리 집 앞에 왔네? 반가워!' : L.topic(a);
    if (kind === 'yardAsk') line = L.say(a, 'yardAsk', {}, true);
    // 결혼한 주민에게 — 신혼 전용 축하 대사
    const pb = partnerOf(b.id);
    if (pb && rel(b.id, pb).status === 'MARRIED' && rel(b.id, pb).since > day() - 14 && chance(0.6)) line = L.say(a, 'coupleCongrats');
    // 소문 나누기
    let gossip = null;
    if ((has(a, 'GOSSIP') || has(a, 'EXTROVERT') || a.act && a.act.id === 'gossip') && chance(0.6)) gossip = FM.Ev && FM.Ev.pickRumor ? FM.Ev.pickRumor(a, b) : null;
    if (gossip) line = gossip.text;
    steps.push(
      { par: [{ pose: 'A', p: 'talk', t: 0.1 }, { pose: 'B', p: 'talk', t: 0.1 }] },
      { say: 'A', text: line, t: 2.6 },
      { say: 'B', text: () => replyLine(b, a, gossip), t: 2.2 },
      { par: [{ emote: 'A', e: pick(['😆', '😊', '🎵', '💬']) }, { emote: 'B', e: pick(['😄', '😊', '👍', '💬']) }] },
      { wait: 0.6 },
    );
    const sc = Sim.scene({ title: 'TALK_NPC', actors: { A: a, B: b }, steps, onEnd: () => afterChat(a, b, kind, gossip) });
    if (sc) { a.state = b.state = 'TALK_NPC'; observe('talk1on1', a, b); }
    return !!sc;
  }
  Soc.startChat = startChat;
  function replyLine(b, a, gossip) {
    if (gossip) return gossip.reply || L.sty(b, '헐, 진짜?');
    if (has(b, 'CRANKY') || has(b, 'CYNICAL')) return L.sty(b, '흥, 그래서?');
    if (b.crush && b.crush.target === a.id) return b.loveArch === 'TSUNDERE' ? L.say(b, 'tsundereCrushReply') : L.sty(b, '어, 어어... 그렇구나');
    return L.topic(b);
  }
  function afterChat(a, b, kind, gossip) {
    const r = rel(a.id, b.id);
    const once = r.greetDay !== day();
    r.greetDay = day();
    addFriend(a.id, b.id, once ? 2 : 0.5, once ? 1 : 0.3);
    // 취향 저격 사건: 상대방의 성격/외모/행동이 자신의 선호 키워드와 일치할 때 crush_intensity +25
    for (const [x, y] of [[a, b], [b, a]]) {
      if (!canRomance(x.id, y.id)) continue;
      if (tasteMatch(x, y) && chance(0.4)) addRomance(x.id, y.id, 25, '취향 저격!');
      else addRomance(x.id, y.id, tasteMatch(x, y) ? rnd(3, 7) : rnd(0.5, 3));
    }
    if (gossip && FM.Ev) FM.Ev.applyRumor(gossip, a, b);
    // 권태기: 동일한 대사 패턴 5회 이상 반복 (+10)
    if (partnerOf(a.id) === b.id) {
      const line = a.bubble ? a.bubble.text : '';
      r.sameLine = r.lastLine === (a.keys.L1 + ':' + (kind || '')) ? r.sameLine + 1 : 1;
      r.lastLine = a.keys.L1 + ':' + (kind || '');
      if (r.sameLine >= 5) { addBoredom(r, D.BOREDOM_RULES.sameLine5.v, '동일한 대사 반복'); r.sameLine = 0; }
      void line;
    }
    // 절친 동반 활동 & 케미스트리
    if (r.friendship_stage === 'BEST_FRIEND' && chance(0.25)) chemistryActivity(a, b, r);
  }

  // 성격 조합별 우정 케미스트리 활동
  function chemistryActivity(a, b, r) {
    const arch = r.friend_archetype;
    if (arch === 'RIVAL_FRIEND') {
      Sim.scene({ title: '광장 달리기 시합', actors: { A: a, B: b }, steps: [
        { say: 'A', text: L.say(a, 'rivalBrag'), t: 2 }, { say: 'B', text: L.sty(b, '웃기지 마! 광장 한 바퀴 승부다'), t: 2 },
        { par: [{ go: 'A', to: { place: 'plaza', dx: -8, dz: 8 }, run: true }, { go: 'B', to: { place: 'plaza', dx: -7, dz: 9 }, run: true }] },
        { par: [{ go: 'A', to: { place: 'plaza', dx: 8, dz: 8 }, run: true }, { go: 'B', to: { place: 'plaza', dx: 8.5, dz: 9 }, run: true }] },
        { emote: 'A', e: pick(['🏆', '💢']) }, { emote: 'B', e: pick(['💢', '🏆']) }, { say: 'B', text: L.sty(b, '다음엔 안 져'), t: 2 },
      ] });
      Sim.log('friend', `🏃 ${a.name}와(과) ${b.name}이(가) 광장에서 티격태격 달리기 시합을 했어요 (악우/라이벌)`, [a.id, b.id], 1);
    } else if (arch === 'MENTOR') {
      Sim.scene({ title: '멘토-멘티', actors: { A: a, B: b }, steps: [
        { say: 'A', text: L.say(a, 'mentor'), t: 2 }, { pose: 'A', p: 'crouch', prop: 'magnifier', t: 0.1 }, { pose: 'B', p: 'look', t: 0.1 },
        { emote: 'B', e: '✨' }, { wait: 3 }, { say: 'B', text: L.sty(b, '우와... 신기하다'), t: 2 },
      ] });
    } else if (arch === 'SOULMATE') {
      const sp = Sim.chooseSpot(a, { tags: ['sea', 'hill', 'bench'], ignoreRange: true });
      if (sp) Sim.scene({ title: '소울메이트 노을 감상', actors: { A: a, B: b }, steps: [
        { par: [{ go: 'A', to: { x: sp.x, z: sp.z, loc: 'island' } }, { go: 'B', to: { x: sp.x + 1, z: sp.z, loc: 'island' } }] },
        { par: [{ pose: 'A', p: 'sit', t: 0.1 }, { pose: 'B', p: 'sit', t: 0.1 }] }, { wait: 5 },
        { say: 'A', text: L.sty(a, '말하지 않아도 알 것 같아'), t: 3 }, { emote: 'B', e: '🌅' }, { wait: 3 },
        { say: 'B', text: L.sty(b, '이 꽃, 너 줄게'), t: 2 }, { fx: 'flower', at: 'A' },
      ] });
    } else {
      Sim.scene({ title: '같이 낚시', actors: { A: a, B: b }, steps: [
        { say: 'A', text: L.sty(a, '같이 낚시하러 가자'), t: 2 },
        { par: [{ go: 'A', to: { place: 'waterfall', spot: 'fish' } }, { go: 'B', to: { place: 'waterfall', spot: 'fish', dx: 1.5 } }] },
        { par: [{ pose: 'A', p: 'fish', prop: 'rod', t: 0.1 }, { pose: 'B', p: 'fish', prop: 'rod', t: 0.1 }] }, { wait: 6 },
        { emote: 'A', e: '🐟' }, { say: 'B', text: L.sty(b, '내가 더 큰 거 잡았어'), t: 2 },
      ] });
    }
  }

  // Priority 2: 짝사랑/연인/친구 주민 접근 ──> 성격별 대화 또는 같이 앉기
  Soc.priority2 = function (v, near) {
    const lover = near.find(o => partnerOf(v.id) === o.id);
    if (lover && FM.Soc.coupleAct(v, lover)) return true;
    if (v.crush && near.some(o => o.id === v.crush.target)) return false; // 짝사랑 레이어가 처리
    near.sort((a, b) => affection(v.id, b.id) - affection(v.id, a.id));
    const o = near[0];
    const r = rel(v.id, o.id);
    // 오지랖: 대화 중인 곳에 끼어듦
    if (has(v, 'BUSYBODY') && o.sceneId) return meddle(v, o);
    if (o.sceneId || o.act && o.act.id === 'sleep') return false;
    // 일반 친구 이상: 벤치 같이 앉기 해금
    if (Soc.stageAtLeast(v.id, o.id, 'FRIEND') && o.state === 'SIT_REST' && o.spot && chance(0.4)) {
      const seat = Sim.SPOTS.find(s => s !== o.spot && s.seat && !s.occ && Math.hypot(s.x - o.spot.x, s.z - o.spot.z) < 2.5);
      if (seat) { Sim.goSpot(v, seat, 'sit_bench'); observe('sameBench', v, o); return true; }
    }
    const want = v.stats.acts.chat || 10;
    if (chance(Math.min(0.85, want / 60 + r.friendship_point / 200))) return startChat(v, o);
    // [사교파]+[내향파]: 다가가서는 쑥스러워 말을 못 걸고 꽃밭에 물을 주며 딴청
    if (has(v, 'EXTROVERT') && has(v, 'INTROVERT')) {
      const sp = Sim.SPOTS.find(s => s.tags.includes('flowers') && Math.hypot(s.x - o.x, s.z - o.z) < 10);
      if (sp) { Sim.goSpot(v, sp, 'water_flowers'); return true; }
    }
    return false;
  };
  function meddle(v, o) {
    const sc = Sim.scenes.find(s => s.id === o.sceneId);
    if (!sc) return false;
    const others = Object.values(sc.actors);
    Sim.goSpot(v, { x: o.x + 0.8, z: o.z + 0.8, tags: [], occ: null }, 'stretch');
    Sim.emote(v, '👀');
    // 썸 타는 커플 사이에 끼어들어 고백하라고 부추김
    const [x, y] = others;
    if (x && y && (F(x.id, y.id).romance > 40 || F(y.id, x.id).romance > 40)) {
      setTimeout0(() => { Sim.say(v, L.say(v, 'coachLove', {}, true)); addRomance(x.id, y.id, 6, '오지랖 코치의 부추김'); addRomance(y.id, x.id, 6); });
      if (partnerOf(x.id) === y.id) observe('coupleAct', x, y);
    }
    return true;
  }

  // =========================================================
  // 질투 & 삼각관계
  // =========================================================
  function jealousyOf(v) {
    const partner = partnerOf(v.id) || (v.crush && v.crush.target);
    if (!partner) { v.jealousy = null; return null; }
    if (!v.jealousy || v.jealousy.partner !== partner) v.jealousy = { subject_npc_id: v.id, partner_npc_id: partner, partner, rival_id: null, rival: null, jealousy_meter: 0, meter: 0, jealousy_threshold: 60, jealousy_type: v.jealType, rivalry_stage: 'AWARE', stage: 'AWARE' };
    return v.jealousy;
  }
  // 목격 이벤트 — 애정 대상과 라이벌
  function observe(trig, a, b) {
    const st = S();
    const T = D.JEALOUS_TRIGGERS[trig];
    for (const w of st.villagers) {
      if (w === a || w === b || w.loc !== (a.loc || 'island')) continue;
      const aId = a.id || P, bId = b.id || P;
      const j = jealousyOf(w); if (!j) continue;
      let rival = null;
      if (j.partner === aId) rival = bId; else if (j.partner === bId) rival = aId; else continue;
      if (family(j.partner, rival) || rival === w.id) continue;
      // 친구끼리의 대화는 가볍게
      const pos = a.x !== undefined ? a : st.player;
      if (Math.hypot(w.x - pos.x, w.z - pos.z) > 14) continue;
      let n = T.base;
      for (const [k, m] of Object.entries(T.mul)) if (has(w, k)) n *= m;
      if (trig === 'talk1on1' && F(j.partner, rival).romance < 20 && partnerOf(j.partner) !== rival) n *= 0.35;
      addJealousy(w, rival, n, T.name);
    }
  }
  Soc.observe = observe;
  function addJealousy(w, rival, n, why) {
    const j = jealousyOf(w); if (!j) return;
    j.rival = j.rival_id = rival;
    if (!Number.isFinite(n)) return;
    if (!Number.isFinite(j.meter)) j.meter = 0;
    const before = j.meter;
    j.meter = j.jealousy_meter = clamp(j.meter + n, 0, 100);
    const st = (D.JEALOUS_STAGES.find(s => j.meter >= s.min && j.meter <= s.max) || D.JEALOUS_STAGES[0]).id;
    if (st !== j.stage) {
      j.stage = j.rivalry_stage = st;
      if (st === 'OPEN_CONFLICT' || st === 'BREAKUP_THREAT') {
        Sim.balloon(w, 'jealous', 'red', { partner: j.partner, rival });
        emit('notify', { v: w, text: `${w.name}이(가) 질투로 폭발 직전이에요! (붉은색 고민 풍선)` });
        Sim.log('jealous', `⚡ ${w.name}이(가) ${nm(j.partner)}와(과) ${nm(rival)}의 사이를 질투해요! (${D.JEALOUS_STAGES.find(s => s.id === st).name})`, [w.id, j.partner, rival], 2);
      }
    }
    if (before < 1 && n > 0) Sim.emote(w, '🌧️', 3);
    // 연인이면 권태기: 질투/갈등 미해결 상태
    void why;
  }
  Soc.addJealousy = addJealousy;

  function detectTriangles(v) {
    const st = S();
    const t = v.crush && v.crush.target; if (!t) return;
    for (const o of st.villagers) {
      if (o === v || !o.crush) continue;
      if (o.crush.target === t) { // 유형 1: 양방향 라이벌전 / 유형 3: 플레이어 중심
        const type = t === P ? 3 : 1;
        const k = [v.id, o.id].sort().join('~') + '@' + t;
        st.flags.tri = st.flags.tri || {};
        if (!st.flags.tri[k]) { st.flags.tri[k] = type; Sim.log('triangle', type === 3 ? `🔺 ${v.name}와(과) ${o.name}이(가) 모두 ${nm(t)}을(를) 독점하고 싶어해요! (플레이어 중심 삼각관계)` : `🔺 ${v.name}와(과) ${o.name}이(가) 모두 ${nm(t)}을(를) 좋아해요! (양방향 라이벌전)`, [v.id, o.id, t], 2); }
      }
    }
    const pt = partnerOf(t);
    if (pt && pt !== v.id) Sim.log('triangle', `🔺 ${v.name}이(가) 연인이 있는 ${nm(t)}을(를) 짝사랑해요... (짝사랑 대 커플)`, [v.id, t, pt], 1, { secret: true });
  }
  Soc.triangleType = function (a, b) {
    const k = [a, b].sort().join('~');
    const tri = S().flags.tri || {};
    for (const [kk, type] of Object.entries(tri)) if (kk.startsWith(k + '@')) return type;
    return 0;
  };

  // =========================================================
  // 커플 (연인 전용 AI 행동 패턴)
  // =========================================================
  Soc.coupleAct = function (a, b) {
    const r = rel(a.id, b.id);
    if (a.sceneId || b.sceneId || b.act && ['sleep', 'work_desk', 'anchor', 'staff'].includes(b.act.id)) return false;
    const stage = boredomStage(r);
    if (stage === 'DANGER' || stage === 'CRITICAL') {
      // 상대 주민이 접근하면 반대 방향으로 멀어짐(WALK)
      const ang = Math.atan2(a.x - b.x, a.z - b.z);
      Sim.planRoute(a, { loc: a.loc, x: a.x + Math.sin(ang) * 8, z: a.z + Math.cos(ang) * 8 }, { noMetro: true });
      Sim.balloon(a, 'bored', 'purple', { partner: b.id });
      return true;
    }
    if (!chance(stage === 'MILD_BOREDOM' ? 0.3 : 0.6)) return false;
    const roll = Math.random();
    if (a.loc === 'island' && roll < 0.45) return coupleWalk(a, b, r, stage);
    if (a.loc === 'island' && roll < 0.8) return benchDate(a, b, r, stage);
    return coupleObject(a, b, r);
  };
  function coupleWalk(a, b, r, stage) {
    const sp = Sim.chooseSpot(a, { tags: ['plaza', 'sea', 'flowers', 'hill', 'lawn', 'park', 'fountain'], ignoreRange: true, near: false });
    if (!sp) return false;
    const gap = stage === 'MILD_BOREDOM' ? 4 : 1.5; // 권태기 커플은 4m 이상 떨어져 걸음
    const hand = stage === 'STABLE' && chance(0.3);    // 30% 확률로 '손잡기 애니메이션' 발동
    Sim.scene({ title: '커플 산책 (Hand-holding Walk)', actors: { A: a, B: b }, steps: [
      { go: 'B', to: { actor: 'A', near: gap }, max: 80 },
      { do: () => { b.syncSpeed = Sim.speedOf(a) / S().speed; a.syncSpeed = b.syncSpeed; a.hand = hand ? b.id : null; b.hand = hand ? a.id : null; } },
      { par: [{ go: 'A', to: { loc: 'island', x: sp.x, z: sp.z } }, { go: 'B', to: { loc: 'island', x: sp.x + gap, z: sp.z + 0.3 } }] },
      { do: () => { a.syncSpeed = b.syncSpeed = null; a.hand = b.hand = null; } },
      { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
      ...(stage === 'STABLE' ? [{ emote: 'A', e: '💕' }, { wait: 0.6 }, { emote: 'B', e: '💕' }] : [{ emote: 'A', e: '😮‍💨' }]),
    ], onEnd: () => { a.syncSpeed = b.syncSpeed = null; a.hand = b.hand = null; dateDone(r, a, b, 'walk'); if (hand) observe('coupleAct', a, b); } });
    return true;
  }
  function benchDate(a, b, r, stage) {
    const seats = Sim.SPOTS.filter(s => s.seat && !s.occ && s.tags.some(t => ['bench', 'cafe', 'sunbed'].includes(t)));
    const s1 = seats.sort((x, y) => dist(a, x) - dist(a, y))[0];
    if (!s1) return false;
    const s2 = seats.find(s => s !== s1 && Math.hypot(s.x - s1.x, s.z - s1.z) < 3) || { x: s1.x + 1, z: s1.z };
    const bored = stage !== 'STABLE';
    const singer = chance(0.4);
    Sim.scene({ title: '커플 벤치 휴식 (Bench Date)', actors: { A: a, B: b }, steps: [
      { par: [{ go: 'A', to: { loc: 'island', x: s1.x, z: s1.z } }, { go: 'B', to: { loc: 'island', x: s2.x, z: s2.z } }] },
      { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
      ...(bored ? [{ do: () => { a.ry += Math.PI; b.ry += Math.PI; } }] : []),
      { par: [{ pose: 'A', p: 'drink', prop: 'can', t: 0.1 }, { pose: 'B', p: 'drink', prop: 'can', t: 0.1 }] },
      { wait: 3 },
      ...(bored ? [{ emote: 'A', e: '💗' }, { wait: 0.8 }, { emote: 'B', e: '💦' }] :
        singer ? [{ pose: 'A', p: 'sing', prop: 'mic', t: 0.1 }, { say: 'A', text: '♪ 라라라~ 너와 나의 섬~ ♪', t: 3 }, { pose: 'B', p: 'clap', prop: null, t: 2.5 }, { emote: 'B', e: '👏' }]
          : [{ emote: 'A', e: '💕' }, { wait: 0.6 }, { emote: 'B', e: '💕' }, { say: 'A', text: L.MAIN_LIFE[a.keys.L1].loveLine, t: 3 }]),
    ], onEnd: () => dateDone(r, a, b, 'bench') });
    return true;
  }
  function coupleObject(a, b, r) {
    const obj = pick([['park', 'swing', '커플 그네'], ['park', 'boat', '2인용 보트'], ['cafe', 'cafe', '마을 카페']]);
    Sim.scene({ title: `커플 가구: ${obj[2]}`, actors: { A: a, B: b }, steps: [
      { par: [{ go: 'A', to: { place: obj[0], spot: obj[1] } }, { go: 'B', to: { place: obj[0], spot: obj[1], dx: 1 } }] },
      { par: [{ pose: 'A', p: obj[1] === 'boat' ? 'row' : 'sit', t: 0.1 }, { pose: 'B', p: 'sit', t: 0.1 }] },
      { emote: 'A', e: '💕' }, { wait: 4 }, { emote: 'B', e: '💕' }, { wait: 2 },
    ], onEnd: () => dateDone(r, a, b, 'object') });
    Sim.log('date', `💑 ${a.name}와(과) ${b.name}이(가) ${obj[2]}에서 데이트 중이에요.`, [a.id, b.id], 1);
    return true;
  }
  function dateDone(r, a, b, kind) {
    r.dates++; r.lastDate = day();
    addFriend(a.id, b.id, 3, 2);
    addBoredom(r, D.BOREDOM_RULES.date.v, '데이트');
    addRomance(a.id, b.id, 1.5); addRomance(b.id, a.id, 1.5);
    const m = marriageOf(a.id); if (m) m.marital_satisfaction = clamp(m.marital_satisfaction + 2, 0, 100);
    void kind;
  }

  // =========================================================
  // 권태기 (Boredom)
  // =========================================================
  function boredomStage(r) { return D.BOREDOM_STAGES.find(s => r.boredom >= s.min && r.boredom <= s.max).id; }
  Soc.boredomStage = boredomStage;
  function addBoredom(r, n, why) {
    const a = r.subject_id, b = r.target_id;
    const A = a === P ? null : byId(a), B = b === P ? null : byId(b);
    if (n > 0 && ((A && A.loveArch === 'FREE') || (B && B.loveArch === 'FREE'))) n *= D.LOVE_ARCH.FREE.boredomMul;
    const before = r.boredom;
    r.boredom = clamp(r.boredom + n, 0, 100);
    r.breakup_risk_stage = boredomStage(r);
    if (r.status !== 'DATING' && r.status !== 'MARRIED') return;
    // 연애 기간 30일 이상 + 데이트 횟수 부족으로 권태기 수치 80 → 이별 고민 풍선
    if (r.boredom >= 70 && before < 70) {
      const who = A && B ? pick([A, B]) : (A || B);
      if (who) { Sim.balloon(who, 'bored', 'purple', { partner: who.id === a ? b : a }); emit('notify', { v: who, text: `${who.name}이(가) 연애 고민 중이에요 (보라색 찌그러진 풍선)` }); }
    }
    if (r.boredom >= 90 && before < 90) {
      if (a === P || b === P) { if (r.boredom >= 100) playerBreakup(A || B); }
      else scheduleBreakup(r);
    }
    void why;
  }
  Soc.addBoredom = addBoredom;

  function scheduleBreakup(r) {
    const st = S();
    st.appts.push({ type: 'breakup', a: r.subject_id, b: r.target_id, at: (day() - 1) * 1440 + (hour() < 18 ? 18 * 60 : 18 * 60 + 1440), spot: pick(D.BREAKUP_SPOTS) });
  }
  // 이별 이벤트 연출 (Breakup Scene) — 해질녘 18:00~20:00
  function breakupScene(aId, bId, spotKey) {
    const a = byId(aId), b = byId(bId);
    if (!a || !b) return;
    const spot = spotKey === 'sunset_cliff' ? { place: 'cliff', spot: 'bench' } : spotKey === 'beach' ? { place: 'beach', spot: 'sea' } : { place: 'waterfall', spot: 'bench' };
    const r = rel(aId, bId);
    Sim.scene({ title: '💔 이별 씬', major: true, place: spot.place, bgm: 'piano', actors: { A: a, B: b }, steps: [
      { par: [{ go: 'A', to: spot }, { go: 'B', to: Object.assign({ dx: 1.3 }, spot) }] },
      { face: 'A', at: 'B' }, { face: 'B', at: 'A' }, { wait: 1.5 },
      { say: 'A', text: L.say(a, 'breakupA', {}, true), t: 3.5 },
      { say: 'B', text: L.say(b, 'breakupB', {}, true), t: 3.5 },
      { fx: 'brokenHeart', at: 'A' }, { fx: 'brokenHeart', at: 'B' }, { par: [{ emote: 'A', e: '😢', t: 3 }, { emote: 'B', e: '💧', t: 3 }] }, { wait: 1 },
      { par: [{ go: 'A', to: { home: 'A' }, slow: true }, { pose: 'B', p: 'look', t: 3 }] },
    ], onEnd: () => {} });
    doBreakup(r, 'NEGLIGENT');
    Sim.log('breakup', `💔 ${a.name}와(과) ${b.name}이(가) 헤어졌어요... (냉각기 7일)`, [aId, bId], 3);
  }
  function doBreakup(r, cause) {
    const a = r.subject_id, b = r.target_id;
    r.status = 'EX'; r.breakup_cause = cause; r.cooldown_until = day() + 7; r.cooldown_days_left = 7; r.exSince = day();
    r.boredom = 0;
    // 이별 후 동선 자동 격리 (마을 맵 2분할)
    r.avoidZone = { [a]: 'WEST', [b]: 'EAST' };
    for (const id of [a, b]) {
      const v = id === P ? null : byId(id);
      if (!v) continue;
      v.status.exUntil = day() + 7;
      v.status.ex = id === a ? b : a;
      v.status.slumpUntil = S().time + 1440 * 2;
      v.depression = clamp(v.depression + 35, 0, 100);
      if (v.depression > 70) v.status.severe = true; // SEVERE_DEPRESSION
      if (v.balloon && ['bored', 'jealous'].includes(v.balloon.kind)) v.balloon = null;
      if (v.jealousy) v.jealousy = null;
      F(id, id === a ? b : a).romance = Math.min(F(id, id === a ? b : a).romance, 30);
    }
    const m = marriageOf(a);
    if (m && (m.spouse_a_id === b || m.spouse_b_id === b)) m.marriage_stage = 'DIVORCED';
  }
  Soc.doBreakup = doBreakup;

  // =========================================================
  // 고백 씬 (Confession Event)
  // =========================================================
  function confessSpotPlace(k) {
    return { beach_sunset: { place: 'beach', spot: 'sea' }, sunset_cliff: { place: 'cliff', spot: 'bench' }, fountain: { place: 'plaza', spot: 'fountain' }, cafe: { place: 'cafe', spot: 'cafe' }, skylounge: { place: 'skylounge', inside: true }, club: { place: 'club', inside: true } }[k] || { place: 'plaza', spot: 'fountain' };
  }
  function confessionLine(a, b) {
    if (has(a, 'ATHLETIC') && a.loveArch === 'BOLD' && (has(b, 'LAZY') || has(b, 'SLOTH'))) return `${b.name}! 너랑 같이 달릴 때가 세상에서 제일 행복해! 내 인생의 페이스메이커가 되어줘!`;
    if (a.loveArch === 'TSUNDERE' || has(a, 'CRANKY')) return '딱히... 네가 특별해서 이런 꽃을 준비한 건 아니거든?! 그냥 지나가다 주운 거야!';
    if (has(a, 'ATHLETIC') && has(a, 'ROMANTIC')) return `(숨차게 뛰어 올라와 장미꽃을 내민다) ${b.name}! 좋아해!`;
    return chance(0.5) ? L.MAIN_LIFE[a.keys.L1].loveLine : L.fill(pick(L.LINES.confessGeneric), { t: b.name });
  }
  function acceptLine(b, a) {
    if ((has(b, 'LAZY') || has(b, 'SLOTH')) && has(a, 'ATHLETIC')) return '에헤헤... 나 달리는 건 느린데... 그래도 네 옆이라면 같이 걸어갈래!';
    if (has(b, 'ROMANTIC') && (a.loveArch === 'TSUNDERE' || has(a, 'CRANKY'))) return '후후, 거짓말. 눈동자가 이렇게 떨리는데? 고마워, 소중히 간직할게!';
    return L.say(b, 'acceptGeneric', {}, true);
  }
  function successChance(a, b, spotKey) {
    const st = S();
    let p = 0.12 + F(b.id, a.id).romance / 100 * 0.6 + affection(a.id, b.id) / 100 * 0.3;
    if (spotKey === 'sunset_cliff') p += 0.08;                       // 가장 성공 확률이 높은 곳
    if ((st.wishes[a.id] || 0) > st.time) p += 0.2;                  // 분수대 소원 동전 +20% (24시간)
    if (a.status.bridgeSpark && a.status.bridgeSpark.with === b.id) p += 0.1;
    if (has(a, 'ANXIOUS')) p *= 0.5 + Math.min(0.5, (a.confidence || 0) / 100);  // 칭찬과 용기가 필요
    if (a.status.tasteKnown === b.id) p += 0.12;                     // 전략 코칭
    if (partnerOf(b.id) && partnerOf(b.id) !== a.id) p -= 0.35;
    return clamp(p, 0.03, 0.95);
  }
  Soc.successChance = successChance;
  function runConfession(a, b, spotKey, opts = {}) {
    if (!a || !b || a.sceneId && !opts.force) return false;
    const pa = partnerOf(a.id);
    if (pa && pa !== b.id) return false;                   // 연인이 있으면 다른 주민에게 고백하지 않음
    const spot = confessSpotPlace(spotKey);
    const pb = partnerOf(b.id);
    const ok = (!pb || pb === a.id) && chance(successChance(a, b, spotKey));
    const shy = a.loveArch === 'SHY';
    const steps = [
      { par: [{ go: 'A', to: spot }, { go: 'B', to: Object.assign({ dx: 1.4 }, spot) }] },
      { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
      { bgm: shy ? 'shy' : 'romance' },
      { wait: 1.2 }, { emote: 'A', e: '💓', t: 1.5 },
      { say: 'A', text: confessionLine(a, b), t: 4 }, { wait: 1 },
    ];
    if (ok) steps.push({ say: 'B', text: acceptLine(b, a), t: 3.5 }, { fx: 'hearts', at: 'B' }, { emote: 'B', e: '❤️', t: 3 }, { par: [{ pose: 'A', p: 'cheer', t: 1.5 }, { pose: 'B', p: 'cute', t: 1.5 }] });
    else {
      steps.push({ say: 'B', text: L.say(b, 'rejectGeneric', {}, true), t: 3.5 }, { fx: chance(0.5) ? 'question' : 'brokenHeart', at: 'B' }, { emote: 'A', e: '💔', t: 3 });
      if (spotKey === 'sunset_cliff') steps.push({ say: 'A', text: '으아아아아~ (눈물을 뿌리며 절벽 아래 잔디밭으로 데굴데굴 굴러떨어진다)', t: 2.5 }, { pose: 'A', p: 'roll', t: 0.1 }, { go: 'A', to: { place: 'cliff_lawn' }, max: 8 }, { tp: 'A', loc: 'island', x: -98, z: -92 }, { pose: 'A', p: 'faint', t: 2 });
      else steps.push({ pose: 'A', p: 'cry', t: 2 });
    }
    Sim.scene({ title: '💌 고백 씬', major: true, place: spot.place, bgm: shy ? 'shy' : 'romance', actors: { A: a, B: b }, steps, force: opts.force, onEnd: () => confessResult(a, b, ok, spotKey) });
    Sim.log('confess', `💌 ${a.name}이(가) ${D.CONFESS_SPOTS.find(s => s.id === spotKey) ? D.CONFESS_SPOTS.find(s => s.id === spotKey).name : '특별한 곳'}에서 ${b.name}에게 고백을 시작했어요!`, [a.id, b.id], 2);
    return true;
  }
  Soc.runConfession = runConfession;
  function confessResult(a, b, ok, spotKey) {
    const r = rel(a.id, b.id);
    endCrush(a);
    if (ok) {
      r.status = 'DATING'; r.since = day(); r.lastDate = day(); r.dates = 1; r.boredom = 0; r.love_since = day();
      if (b.crush && b.crush.target === a.id) endCrush(b);
      F(b.id, a.id).romance = Math.max(F(b.id, a.id).romance, 65);
      Sim.log('couple', `💕 ${a.name}와(과) ${b.name}이(가) 공식 연인이 되었어요!`, [a.id, b.id], 3, { newsKind: 'couple', spot: spotKey });
      emit('toast', `💕 ${a.name} ♥ ${b.name} 커플 탄생!`);
      // 지켜보던 짝사랑 주민의 질투
      for (const w of S().villagers) if (w.crush && (w.crush.target === a.id || w.crush.target === b.id) && w !== a && w !== b) addJealousy(w, w.crush.target === a.id ? b.id : a.id, 40, '짝사랑 상대의 커플 성립');
    } else {
      const arch = D.LOVE_ARCH[a.loveArch];
      a.status.slumpUntil = S().time + 1440 * (a.loveArch === 'BOLD' ? arch.slumpDays : 3); // 실패한 A: 3일간 집 밖으로 나오지 않음
      a.depression = clamp(a.depression + (a.loveArch === 'SHY' ? 45 : 25), 0, 100);
      F(a.id, b.id).romance = Math.max(0, F(a.id, b.id).romance - 30);
      if (spotKey === 'sunset_cliff') a.status.grassUntil = S().time + 1440 * 3; // 이후 3일간 옷에 잔디가 묻어 있음
      a.status.rejectedBy = b.id;
      Sim.log('confess', `💔 ${a.name}의 고백은 실패했어요... ${b.name}의 머리 위에 물음표가 떴어요.`, [a.id, b.id], 2, { newsKind: 'reject' });
      // 실연 후 파격 머리 변신
      if (chance(0.35)) FM.Ev && FM.Ev.queue && FM.Ev.queue('hairChange', a);
    }
    if (a.status.appt) a.status.appt = null;
  }
  function selfConfess(v, tId) {
    if (tId === P) return playerCrushConfess(v);
    const t = byId(tId); if (!t || v.sceneId || t.sceneId) return;
    if (!canRomance(v.id, tId)) return;
    runConfession(v, t, pick(['fountain', 'beach_sunset', 'sunset_cliff', 'cafe']));
  }

  // 주민이 플레이어를 짝사랑 → 고백
  function playerCrushConfess(v) {
    Sim.balloon(v, 'crushP', 'pink', { target: P });
    emit('notify', { v, text: `${v.name}이(가) 할 말이 있대요... (분홍 하트 풍선)` });
  }

  // =========================================================
  // 짝사랑 · 질투 · 이별 · 육아 레이어 (일상 AI 위에 덮어쓰기)
  // =========================================================
  Soc.override = function (v, blk) {
    const st = S();
    // 육아 상태(Parenting Mode) 최우선
    if (!v.child && parentOverride(v, blk)) return true;
    if (blk.k === 'sleep' || blk.k === 'hospital' || blk.k === 'work' || blk.k === 'commute') return false;
    // 고백 약속 (경로 A)
    const ap = st.appts.find(x => x.type === 'confess' && (x.a === v.id || (x.b === v.id && x.bInvited)) && Math.abs(st.time - x.at) < 50);
    if (ap && !ap.started) {
      const spot = confessSpotPlace(ap.spot);
      if (v.loc !== 'island' || dist(v, MAP.P[spot.place]) > 8) { const p = MAP.P[spot.place]; Sim.planRoute(v, { loc: 'island', x: p.x + rnd(-1, 1), z: p.z + rnd(-1, 1) }); v.pendingAct = 'look_around'; return true; }
      Sim.startAct(v, 'look_around', { dur: 3, name: '고백 스폿에서 기다리는 중' }); return true;
    }
    // 실연 슬럼프
    if (v.status.slumpUntil > st.time) {
      if (chance(0.6)) { if (v.loc !== v.home) { Sim.planRoute(v, { loc: v.home, x: 0, z: 0 }); return true; } Sim.startAct(v, 'slump', { state: 'HOME_LIFE', pose: 'lie', dur: 10, name: '침대에 누워 있음 (슬럼프)' }); if (chance(0.2)) Sim.say(v, L.say(v, 'slump', {}, true)); return true; }
      const sp = Sim.chooseSpot(v, { tags: ['sea'], ignoreRange: true });
      if (sp) { Sim.goSpot(v, sp, 'watch_sea'); Sim.emote(v, '😢', 4); return true; }
    }
    // 이별 후 태도 (7일 냉각기)
    if (v.status.exUntil > day()) { if (postBreakup(v)) return true; }
    // 질투 행동
    if (v.jealousy && v.jealousy.meter >= 40 && chance(0.5)) { if (jealousAct(v)) return true; }
    // 짝사랑 행동
    if (v.crush && chance(0.55)) { if (crushAct(v)) return true; }
    // 커플 동기화 AI 스케줄 — 연인이 된 두 주민은 서로를 찾아가 데이트
    const pt = partnerOf(v.id);
    if (pt && pt !== P && (blk.k === 'free' || blk.k === 'go' || blk.k === 'home') && chance(0.3)) {
      const o = byId(pt);
      if (o && !o.sceneId && !o.status.hospital && !Sim.asleep(o, hour()) && !(o.act && ['work_desk', 'anchor', 'staff', 'class'].includes(o.act.id)) && o.loc !== 'metro') {
        const m = marriageOf(v.id);
        // 결혼 후: 40% 확률로 서로의 뒤를 따라다니며 손을 잡고 걸음
        if (m && m.marriage_stage === 'MARRIED' && chance(0.4) && o.loc === 'island' && v.loc === 'island') return coupleWalk(v, o, rel(v.id, pt), 'STABLE');
        if (Soc.coupleAct(v, o)) return true;
      }
    }
    return false;
  };

  function crushAct(v) {
    const c = v.crush, st = S();
    const tId = c.target;
    const t = tId === P ? st.player : byId(tId);
    if (!t) return false;
    const h = hour();
    const near = t.loc === v.loc && Math.hypot(t.x - v.x, t.z - v.z) < 10;
    switch (c.stage) {
      case 'SECRET_CRUSH': {
        if (!near) return false;
        // 시선 고정 / 눈이 마주치면 깜짝 놀라 반대 방향으로
        const approaching = t.moving && Math.hypot(t.x - v.x, t.z - v.z) < 4;
        if (approaching) {
          const ang = Math.atan2(v.x - t.x, v.z - t.z);
          v.run = true;
          Sim.planRoute(v, { loc: v.loc, x: v.x + Math.sin(ang) * 9, z: v.z + Math.cos(ang) * 9 }, { noMetro: true });
          Sim.emote(v, '💓'); rec(c, 'SHY_RETREAT');
          return true;
        }
        v.watching = tId;
        Sim.startAct(v, 'crush_watch', { state: 'WATCH_LOOK', pose: 'look', dur: 5, name: `${nm(tId)} 바라보기` });
        rec(c, 'GAZE');
        return true;
      }
      case 'NOTICEABLE': {
        // 대상 주민의 집 앞 마당이나 자주 가는 장소를 서성임
        if (chance(0.4) && tId !== P) {
          const others = S().villagers.filter(o => o !== v && o !== t && o.loc === v.loc && Math.hypot(o.x - v.x, o.z - v.z) < 8);
          if (others.length) { const o = others[0]; Sim.say(v, L.say(v, 'crushAskAbout', { t: nm(tId) })); rec(c, 'ASK_AROUND'); addFriend(v.id, o.id, 0.5, 0); }
        }
        const home = tId === P ? MAP.P.home_p : MAP.P[FM.INTERIORS[t.home].place];
        const yard = home.id === 'apartment' ? MAP.P.apt_yard : home;
        Sim.planRoute(v, { loc: 'island', x: yard.x + rnd(-4, 4), z: yard.z + rnd(2, 6) });
        v.pendingAct = 'look_around'; rec(c, 'STALKING');
        // 스토킹 모드: 대상이 이동하면 3~5초 뒤 일정 거리를 두고 뒤따라 움직임
        if (near && t.moving) { v.route = null; Sim.scene({ title: 'Shadowing', actors: { A: v }, steps: [{ wait: rnd(3, 5) }, { go: 'A', to: { actor: tId, near: 5 }, max: 12 }] }); }
        return true;
      }
      case 'OBSESSED': {
        if (inH(h, 19, 3)) {
          // 밤 22:00 이후 대상 주민의 집 문 앞: 3초간 손을 들었다가 차마 두드리지 못하고 돌아섬
          if (inH(h, 22, 3) && chance(0.5) && tId !== P) {
            const door = Sim.placeDoor(FM.INTERIORS[t.home].place);
            Sim.scene({ title: '문 앞 망설임', actors: { A: v }, steps: [
              { go: 'A', to: { loc: 'island', x: door.x, z: door.z + 1 } }, { pose: 'A', p: 'knockHesitate', t: 3 }, { emote: 'A', e: '💧' }, { go: 'A', to: { home: 'A' }, slow: true },
            ] });
            rec(c, 'DOOR_HESITATE');
            return true;
          }
          Sim.startAct(v, 'sigh_sky', { state: 'WATCH_LOOK', pose: 'lookUp', dur: 7, name: '밤하늘 보며 한숨' });
          Sim.emote(v, chance(0.5) ? '🟣' : '💗', 4); rec(c, 'SIGH');
          return true;
        }
        if (chance(0.3)) { Sim.startAct(v, 'write_lyrics', { state: 'SIT_REST', pose: 'write', prop: 'notebook', dur: 7, name: '비련의 가사 끄적이기' }); rec(c, 'LETTER_DRAFT'); return true; }
        return styleCrush(v, t, tId);
      }
      case 'CONFESSION_READY': {
        // 플레이어에게 달려와 [분홍색 고민 풍선 (!)] — 내향파는 부추김이 없으면 포기
        if (has(v, 'INTROVERT') && c.readySince && day() - c.readySince >= 3) {
          F(v.id, tId).romance = 40; c.heartbreak_risk = clamp(c.heartbreak_risk + 30, 0, 100);
          Sim.log('crush', `🍂 ${v.name}은(는) 끝내 고백하지 못하고 마음을 접었어요...`, [v.id], 1);
          endCrush(v); return false;
        }
        if (v.loveArch === 'BOLD' || v.loveArch === 'FREE' && chance(0.3)) { selfConfess(v, tId); return true; }
        const pl = st.player;
        if (pl.loc === 'island' && v.loc === 'island' && Math.hypot(pl.x - v.x, pl.z - v.z) < 40 && chance(0.5)) {
          v.run = true; Sim.planRoute(v, { loc: 'island', x: pl.x + 1.5, z: pl.z + 1.5 }, { noMetro: true }); v.pendingAct = 'fidget';
          return true;
        }
        return styleCrush(v, t, tId);
      }
    }
    return false;
  }
  function rec(c, k) { if (!c.secret_actions_done.includes(k)) c.secret_actions_done.push(k); }
  // 복합 성격별 짝사랑 표현 양식
  function styleCrush(v, t, tId) {
    if (tId === P) return false;
    if (has(v, 'ROMANTIC') && (has(v, 'SHY') || has(v, 'INTROVERT'))) {
      // 바닷가에 홀로 앉아 나뭇가지로 모래에 대상 주민의 이름을 썼다가 황급히 지움
      Sim.scene({ title: '모래 위 이름', actors: { A: v }, steps: [
        { go: 'A', to: { place: 'beach', spot: 'sand' } }, { pose: 'A', p: 'write', prop: 'stick', t: 0.1 }, { say: 'A', text: L.say(v, 'sandName', { t: t.name }, true), t: 3 }, { emote: 'A', e: '😳' }, { pose: 'A', p: 'sweep', t: 2 },
      ] });
      FM.Ev && FM.Ev.sandName && FM.Ev.sandName(v, t.name);
      rec(v.crush, 'SAND_NAME');
      return true;
    }
    if (has(v, 'ATHLETIC') && (has(v, 'BUSYBODY') || has(v, 'PASSIONATE'))) {
      // 길목을 미리 알아채고 먼저 뛰어가서 아령을 들고 운동하는 척
      Sim.scene({ title: '근육 자랑', actors: { A: v }, steps: [
        { go: 'A', to: { actor: tId, near: 4, ang: t.ry || 0 }, run: true, max: 20 }, { pose: 'A', p: 'lift', prop: 'dumbbell', t: 3 }, { emote: 'A', e: '💪' },
        { pose: 'A', p: 'shake', prop: null, t: 1.5 }, { fx: 'fruit', at: 'A' }, { say: 'A', text: L.sty(v, '훗, 이 정도야 뭐'), t: 2 },
      ] });
      rec(v.crush, 'SHOW_OFF');
      return true;
    }
    if (has(v, 'CRANKY') || has(v, 'CYNICAL')) {
      // 대상 주민 몰래 희귀한 과일이나 곤충을 집 앞에 무심하게 던져놓고 도망감
      const door = Sim.placeDoor(FM.INTERIORS[t.home].place);
      Sim.scene({ title: '선물 던지고 도망', actors: { A: v }, steps: [
        { go: 'A', to: { loc: 'island', x: door.x + 0.8, z: door.z + 1 } }, { pose: 'A', p: 'throw', t: 1 }, { fx: 'gift', at: 'A' }, { emote: 'A', e: '💨' },
        { go: 'A', to: { loc: 'island', x: door.x + 12, z: door.z + 8 }, run: true },
      ] });
      t.status.giftFrom = v.id;
      addRomance(tId, v.id, 3, '문 앞의 선물');
      rec(v.crush, 'GIFT_DROP');
      return true;
    }
    // 대상 주민이 집을 비웠을 때 마당 의자에 앉아 냄새를 맡거나 꽃밭에 몰래 물을 주고 감
    if (t.loc !== FM.INTERIORS[t.home].place && chance(0.5)) {
      const yardId = Sim.yardPlace(t);
      const sp = Sim.chooseSpot(v, { place: yardId, ignoreRange: true });
      if (sp) { Sim.goSpot(v, sp, sp.tags.includes('flowers') ? 'water_flowers' : 'sit_bench'); rec(v.crush, 'YARD_VISIT'); return true; }
    }
    return false;
  }

  function jealousAct(v) {
    const j = v.jealousy;
    const partner = j.partner === P ? S().player : byId(j.partner);
    const rival = j.rival === P ? S().player : byId(j.rival);
    if (!partner || !rival || rival === S().player && j.rival !== P) return false;
    const togetherNear = partner.loc === rival.loc && Math.hypot(partner.x - rival.x, partner.z - rival.z) < 5;
    switch (j.stage) {
      case 'COLD_WAR': {
        if (!togetherNear || partner === S().player) return false;
        // 둘 사이에 비집고 들어가 기지개 / 애정 대상을 불러냄
        Sim.scene({ title: '방해 공작', actors: { A: v }, steps: [
          { go: 'A', to: { loc: partner.loc, x: (partner.x + rival.x) / 2, z: (partner.z + rival.z) / 2 } }, { pose: 'A', p: 'stretch', t: 2 },
          { say: 'A', text: L.say(v, 'jealousCold', { partner: partner.name, rival: rival.name }), t: 3 },
        ] });
        return true;
      }
      case 'OPEN_CONFLICT': case 'BREAKUP_THREAT': {
        if (j.stage === 'BREAKUP_THREAT' && partner !== S().player && chance(0.25) && partnerOf(v.id) === partner.id) {
          // 파트너에게 이별 선언
          breakupScene(v.id, partner.id, pick(D.BREAKUP_SPOTS)); rel(v.id, partner.id).breakup_cause = 'JEALOUSY_EXPLODE';
          return true;
        }
        if (!rival.id || rival === S().player || rival.sceneId) return false;
        const style = v.jealType;
        let text = L.say(v, 'jealousConflict', { partner: partner.name, rival: rival.name });
        if (has(v, 'ATHLETIC') || v.loveArch === 'BOLD') text = L.say(v, 'jealousBold', { partner: partner.name }, true);
        if (style === 'DEPRESSIVE') {
          // [낭만파 + 소심함]: 멀리서 나무 뒤에 숨어 바라보며 눈물 / 밤 바닷가 비련의 대사
          const sp = Sim.chooseSpot(v, { tags: inH(hour(), 19, 3) ? ['sea'] : ['trees'], ignoreRange: true });
          if (sp) { Sim.goSpot(v, sp, 'watch_sea'); Sim.emote(v, '😢', 4); Sim.say(v, L.say(v, 'jealousShy', {}, true)); return true; }
          return false;
        }
        if (style === 'PASSIVE_AGGRESSIVE') {
          if (partner.id && partner.loc === v.loc && dist(v, partner) < 12) { Sim.say(v, L.say(v, 'jealousTsun', {}, true)); Sim.emote(v, '💢'); }
          // 라이벌이 자리를 비우면 슬그머니 고급 선물을 애정 대상 집 문 앞에 툭
          if (chance(0.4) && partner.home) {
            const door = Sim.placeDoor(FM.INTERIORS[partner.home].place);
            Sim.scene({ title: '문 앞 고급 선물', actors: { A: v }, steps: [{ go: 'A', to: { loc: 'island', x: door.x + 0.6, z: door.z + 1 } }, { pose: 'A', p: 'throw', t: 1 }, { fx: 'gift', at: 'A' }] });
          }
          return true;
        }
        // CONFRONTATIONAL: 라이벌에게 다가가 손가락질하며 말싸움
        Sim.scene({ title: '직접 대립', actors: { A: v, B: rival }, steps: [
          { go: 'A', to: { actor: 'B', near: 1.2 }, run: true, max: 25 }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
          { pose: 'A', p: 'point', t: 0.1 }, { emote: 'A', e: '⚡' }, { say: 'A', text, t: 3 }, { emote: 'B', e: '😰' }, { say: 'B', text: L.sty(rival, '뭐, 뭐야 갑자기?'), t: 2 },
          { par: [{ pose: 'A', p: 'argue', t: 2.5 }, { pose: 'B', p: 'argue', t: 2.5 }] }, { emote: 'A', e: '💢' },
        ] });
        addFriend(v.id, rival.id, -4, -3);
        return true;
      }
      default: {
        // AWARE: 반경 5m에서 뚫어지게 노려봄 + 먹구름
        if (!togetherNear) return false;
        Sim.goSpot(v, { x: partner.x + 4, z: partner.z + 3, tags: [], occ: null }, 'glare');
        v.watching = j.rival;
        Sim.emote(v, '🌧️', 4);
        return true;
      }
    }
  }

  // 이별 후 태도
  function postBreakup(v) {
    const ex = v.status.ex;
    const r = rel(v.id, ex);
    const since = r.exSince || day();
    // 반경 10m 이내 접근 시: 한쪽 NPC가 즉시 경로를 수정하여 반대편으로 이동 (Avoider AI)
    const exV = ex === P ? S().player : byId(ex);
    if (exV && exV.loc === v.loc && Math.hypot(exV.x - v.x, exV.z - v.z) < 10 && v.loc === 'island') {
      const ang = Math.atan2(v.x - exV.x, v.z - exV.z);
      Sim.planRoute(v, { loc: 'island', x: v.x + Math.sin(ang) * 14, z: v.z + Math.cos(ang) * 14 }, { noMetro: true });
      return true;
    }
    if ((has(v, 'ROMANTIC') || has(v, 'SHY') || has(v, 'INTROVERT')) && day() - since < 3) {
      if (v.loc !== v.home) { Sim.planRoute(v, { loc: v.home, x: 0, z: 0 }); return true; }
      Sim.startAct(v, 'memory', { state: 'HOME_LIFE', pose: 'sadSit', dur: 10, name: '추억 가구 바라보기' });
      return true;
    }
    if ((has(v, 'ROMANTIC') || has(v, 'SHY')) && inH(hour(), 18, 20)) {
      Sim.scene({ title: '모래밭 지우기', actors: { A: v }, steps: [{ go: 'A', to: { place: 'beach', spot: 'sand' } }, { pose: 'A', p: 'sweep', prop: 'stick', t: 5 }, { say: 'A', text: L.say(v, 'postBreakupRomantic', {}, true), t: 3 }] });
      return true;
    }
    if (has(v, 'ATHLETIC') || has(v, 'PASSIONATE')) {
      if (chance(0.5)) { Sim.scene({ title: '미친 듯이 조깅', actors: { A: v }, steps: [{ go: 'A', to: { place: 'plaza', spot: 'dumbbell' }, run: true }, { pose: 'A', p: 'lift', prop: 'dumbbell', t: 4 }, { say: 'A', text: L.say(v, 'postBreakupAthletic', {}, true), t: 3 }] }); return true; }
      return false;
    }
    if ((has(v, 'CRANKY') || has(v, 'CYNICAL')) && inH(hour(), 21, 2) && ex !== P) {
      const exv = byId(ex); if (!exv) return false;
      const door = Sim.placeDoor(FM.INTERIORS[exv.home].place);
      Sim.scene({ title: '전 연인 집 앞 지나가기', actors: { A: v }, steps: [{ go: 'A', to: { loc: 'island', x: door.x + 3, z: door.z + 3 } }, { pose: 'A', p: 'look', t: 2 }, { go: 'A', to: { home: 'A' } }] });
      return true;
    }
    // 동선 격리: 자기 구역으로
    const zone = r.avoidZone && r.avoidZone[v.id];
    if (zone && chance(0.5)) {
      const sp = Sim.chooseSpot(v, { district: zone === 'WEST' ? 'WEST' : 'EAST', ignoreRange: true }) || Sim.chooseSpot(v, { district: zone === 'WEST' ? 'CORE' : 'SOUTH', ignoreRange: true });
      if (sp) { Sim.goSpot(v, sp); return true; }
    }
    return false;
  }

  // 걷는 도중 감지
  Soc.onWalkCheck = function (v) {
    // 구름다리 — 출렁다리 효과 & 겁쟁이와 장난꾸러기
    if (FM.T.onBridge(v.x, v.z)) FM.Ev && FM.Ev.onBridge && FM.Ev.onBridge(v);
  };

  // =========================================================
  // 육아 레이어
  // =========================================================
  function childrenOf(id) { return S().villagers.filter(c => c.child && c.child.parents.includes(id)); }
  Soc.childrenOf = childrenOf;
  function parentOverride(v, blk) {
    const kids = childrenOf(v.id);
    if (!kids.length) return false;
    const baby = kids.find(k => k.child.stage === 'BABY');
    const toddler = kids.find(k => k.child.stage === 'TODDLER');
    const h = hour();
    if (baby) {
      // 아기 울음 반응: 마을 어디서든 울음 감지 시 귀가 → Hold_Baby
      if (baby.child.crying) {
        if (v.loc !== baby.loc) { v.run = true; Sim.planRoute(v, { loc: baby.loc, x: baby.x + 0.8, z: baby.z + 0.6 }); Sim.emote(v, '💦'); v.pendingAct = 'hold_baby'; return true; }
        Sim.startAct(v, 'hold_baby', { state: 'HOME_LIFE', pose: 'holdBaby', dur: 6, name: '아기 안아주기 (Hold_Baby)' });
        baby.child.crying = false; baby.child.parenting_satisfaction = clamp(baby.child.parenting_satisfaction + 4, 0, 100);
        baby.child.attach[v.id] = clamp((baby.child.attach[v.id] || 50) + 3, 0, 100);
        baby.child.env.talk++;
        if (chance(0.5)) Sim.say(v, parentLine(v, 'baby'));
        return true;
      }
      // 야간 외출 제한 (20:00 이후 반드시 집 안 거주)
      if (inH(h, 20, 7) && blk.k !== 'sleep') { if (v.loc !== v.home) { Sim.planRoute(v, { loc: v.home, x: 0, z: 0 }); return true; } }
      // 외출 가중치 감소: 마을 산책 시간이 50% 감소 + 교대 근무 (한쪽이 외출 시 다른 쪽은 집을 지킴)
      if (blk.k === 'free' || blk.k === 'go') {
        const other = baby.child.parents.find(p => p !== v.id);
        const ov = other === P ? S().player : byId(other);
        const otherOut = ov && ov.loc !== baby.loc;
        if (otherOut || chance(0.5)) {
          if (v.loc !== v.home) { Sim.planRoute(v, { loc: v.home, x: 0, z: 0 }); return true; }
          const cr = Sim.furnUses(v.home, u => u.u.act === 'rock_cradle')[0];
          if (cr) { Sim.goUse(v, cr, 'rock_cradle'); return true; }
        }
      }
    }
    if (toddler && (blk.k === 'free' || blk.k === 'go') && chance(0.5) && toddler.loc === v.loc) {
      // 동행 산책: 속도 50% 감소, 5초마다 멈춰 서서 아이를 바라봄
      const sp = Sim.chooseSpot(v, { tags: ['playground', 'plaza', 'flowers', 'lawn'], ignoreRange: true });
      if (!sp || toddler.sceneId) return false;
      const st = [{ do: () => { v.slowWalk = true; } }];
      const leg = { loc: 'island', x: sp.x, z: sp.z };
      st.push({ par: [{ go: 'A', to: leg, max: 5 }, { go: 'K', to: { actor: 'A', near: 1 }, max: 5 }] }, { face: 'A', at: 'K' }, { wait: 1 });
      st.push({ par: [{ go: 'A', to: leg, max: 5 }, { go: 'K', to: { actor: 'A', near: 1 }, max: 5 }] }, { face: 'A', at: 'K' }, { wait: 1 });
      st.push({ par: [{ go: 'A', to: leg, max: 40 }, { go: 'K', to: { actor: 'A', near: 1 }, max: 40 }] }, { do: () => { v.slowWalk = false; } });
      if (has(v, 'EXTROVERT')) st.push({ say: 'A', text: L.say(v, 'kidGreet', {}, true), t: 2.5 });
      if (has(v, 'ATHLETIC')) st.push({ say: 'A', text: L.say(v, 'kidAthletic', {}, true), t: 2.5 });
      Sim.scene({ title: '보호자 동행 (Chaperone Walk)', actors: { A: v, K: toddler }, steps: st, onEnd: () => { v.slowWalk = false; toddler.child.env.outdoor++; toddler.child.parenting_satisfaction = clamp(toddler.child.parenting_satisfaction + 2, 0, 100); } });
      return true;
    }
    // 어린이 단계: 부모는 다시 기존 성격 스케줄로 복귀 (가끔 부모 배우기 교류)
    return false;
  }
  function parentLine(v, kind) {
    if (has(v, 'ATHLETIC')) return L.say(v, 'kidAthletic', {}, true);
    if (has(v, 'CRANKY') && has(v, 'ANXIOUS')) return L.say(v, 'kidCranky', {}, true);
    if (has(v, 'CRANKY')) return L.say(v, 'kidTsun', {}, true);
    if (has(v, 'SNOB')) return L.say(v, 'kidSnob', {}, true);
    if (has(v, 'ANXIOUS')) return L.say(v, 'kidAnxious', {}, true);
    if (has(v, 'LAZY')) return '자, 맛있는 거 먹고 뚝! (Feed_Baby)';
    if (has(v, 'ROMANTIC')) return '옛날 옛적에... (동화책을 읽어준다)';
    if (has(v, 'EXTROVERT')) return L.say(v, 'kidGreet', {}, true);
    return L.sty(v, '괜찮아, 괜찮아');
    void kind;
  }
  Soc.parentLine = parentLine;
  Soc.toddlerThink = function (v) {
    const c = v.child;
    const parents = c.parents.map(id => id === P ? S().player : byId(id)).filter(Boolean);
    const p = parents.find(x => x.loc === v.loc && x !== S().player) || parents[0];
    // 돌발 행동: 길가에 앉아 떼쓰기
    if (v.loc === 'island' && chance(0.12)) {
      Sim.startAct(v, 'tantrum', { state: 'THINKING', pose: 'cry', dur: 5, name: '길가에 앉아 떼쓰기' }); Sim.emote(v, '😭', 4);
      c.tantrum = true;
      const pv = parents.find(x => x !== S().player && x.loc === v.loc);
      if (pv && !pv.sceneId) Sim.scene({ title: '떼쓰는 유아 달래기', actors: { A: pv, K: v }, steps: [
        { go: 'A', to: { actor: 'K', near: 0.8 }, run: true, max: 20 }, { pose: 'A', p: 'holdBaby', prop: has(pv, 'LAZY') || has(pv, 'FOOD') ? 'snack' : null, t: 2.5 }, { say: 'A', text: parentLine(pv), t: 2.5 }, { emote: 'K', e: '😊' },
      ], onEnd: () => { c.tantrum = false; c.parenting_satisfaction = clamp(c.parenting_satisfaction + 3, 0, 100); } });
      return;
    }
    if (p && p !== S().player && p.loc === v.loc && dist(v, p) > 1.5) { Sim.planRoute(v, { loc: p.loc, x: p.x + 0.8, z: p.z + 0.8 }, { noMetro: true }); v.slowWalk = true; return; }
    if (v.loc !== v.home && (!p || p.loc !== v.loc)) { Sim.planRoute(v, { loc: v.home, x: 0.5, z: 0.5 }); return; }
    Sim.startAct(v, 'toddle', { state: 'WALK', pose: 'toddle', dur: 5, name: '아장아장 걷기' });
  };

  // =========================================================
  // 결혼
  // =========================================================
  function marriageOf(id) { return S().marriages.find(m => (m.spouse_a_id === id || m.spouse_b_id === id) && m.marriage_stage !== 'DIVORCED'); }
  Soc.marriageOf = marriageOf;
  function marriageReady(a, b) {
    const r = rel(a, b);
    if (r.status !== 'DATING') return false;
    const M = D.MARRIAGE;
    if (day() - r.since < M.minDatingDays) return false;
    const fa = a === P ? 100 : affection(a, b), fb = b === P ? 100 : affection(b, a);
    const ra = a === P ? 100 : F(a, b).romance, rb = b === P ? 100 : F(b, a).romance;
    return fa >= M.affection && fb >= M.affection && ra >= M.romance && rb >= M.romance;
  }
  Soc.marriageReady = marriageReady;
  // 주거 공간 (신혼집): 최소 2인 이상 거주 가능한 2단계 이상 증축된 집
  function homeFor(a, b) {
    const st = S();
    if (a === P || b === P) return (st.player.houseLevel || 1) >= D.MARRIAGE.houseLevel ? 'home_p_in' : null;
    for (const id of [a, b]) { const v = byId(id); if (v.home && v.home.startsWith('villa') && FM.MAP.PLOTS.find(p => p.id + '_in' === v.home).size === 'large') return v.home; }
    const plot = st.plots.granted && Object.entries(st.plots.granted).find(([pid, g]) => g && g.includes(a) && g.includes(b));
    if (plot) return plot[0] + '_in';
    return null;
  }
  Soc.homeFor = homeFor;
  Soc.freePlots = function (size) {
    const st = S();
    const used = new Set(st.villagers.map(v => v.home));
    const granted = st.plots.granted || {};
    return FM.MAP.PLOTS.filter(p => (!size || p.size === size) && !used.has(p.id + '_in') && !granted[p.id]);
  };
  // 신혼집 / 절친 룸메이트 부지 하사 (플레이어 툴)
  Soc.grantPlot = function (plotId, ids) {
    const st = S();
    st.plots.granted = st.plots.granted || {};
    st.plots.granted[plotId] = ids;
    Sim.log('home', `🏡 ${ids.map(nm).join(', ')}에게 ${FM.MAP.P[plotId].name} 부지를 하사했어요!`, ids, 2);
    // 독채(small)에는 1명 즉시 이사, 대형 획지는 결혼/절친 룸메이트
    if (ids.length === 1 || !ids.some(id => partnerOf(id))) for (const id of ids) moveHome(byId(id), plotId + '_in');
    return true;
  };
  function moveHome(v, iid) {
    if (!v) return;
    const old = v.home;
    v.home = iid;
    const st = S();
    if (!st.rooms[iid]) {
      const s = Sim.interiorSize(iid);
      // 새 집 크기에 맞춰 성격 스타일 방을 새로 꾸밈 (예전 방에 직접 꾸민 게 있으면 그대로 옮김)
      if (st.rooms[old] && st.rooms[old].edited) { st.rooms[iid] = JSON.parse(JSON.stringify(st.rooms[old])); for (const f of st.rooms[iid].furn) { f.x = clamp(f.x * s.w / 8, -s.w / 2 + 0.6, s.w / 2 - 0.6); f.z = clamp(f.z * s.d / 6, -s.d / 2 + 0.6, s.d / 2 - 0.6); } }
      else st.rooms[iid] = FM.defaultRoom(v, s.w, s.d, (FM.INTERIORS[iid] || {}).door);
    }
    if (old && old.startsWith('apt') && !st.villagers.some(o => o !== v && o.home === old)) delete st.rooms[old];
    Sim.log('home', `🚚 ${v.name}이(가) ${FM.INTERIORS[iid].name}(으)로 이사했어요.`, [v.id], 1);
  }
  Soc.moveHome = moveHome;

  function engage(a, b, how) {
    const r = rel(a, b);
    r.status = 'ENGAGED'; r.engagedDay = day();
    // 결혼식 당일 (약혼 후 3일 뒤) 오전 10:00 — 대성당 웨딩 홀은 주말 결혼식
    let wd = day() + D.MARRIAGE.prepDays;
    while ((wd - 1) % 7 < 5) wd++;
    const st = S();
    const m = { marriage_id: 'marriage_' + String(st.marriages.length + 1).padStart(3, '0'), spouse_a_id: a, spouse_b_id: b, marriage_stage: 'ENGAGED', wedding_date: wd, wedding_day: wd,
      matrimonial_home_id: homeFor(a, b), marital_satisfaction: 85, shared_budget: 0, family_tree_id: 'family_' + String(st.marriages.length + 1).padStart(3, '0'), prep: { clean: 0, invite: [], decorate: 0 }, flower: 'rose' };
    st.marriages.push(m);
    m.marriage_stage = 'WEDDING_PREP';
    Sim.log('engage', `💍 ${nm(a)}와(과) ${nm(b)}이(가) 약혼했어요! 결혼식은 ${wd}일차(${D.WEEKDAYS[(wd - 1) % 7]}) 오전 10:00, 축복의 마블 대성당에서!`, [a, b], 3, { newsKind: 'engage' });
    // 결혼식 준비 퀘스트 (식장 청소, 청첩장 배부, 식장 꾸미기)
    addQuest({ type: 'wedding_prep', title: `💒 ${nm(a)} ♥ ${nm(b)} 결혼식 준비`, giver: a === P ? b : a, target: b, marriage: m.marriage_id,
      desc: '결혼식 장소 청소(대성당 앞 쓰레기 3개), 청첩장 배부(주민 5명), 식장 꾸미기(꽃 장식 3곳)', deadline: (wd - 1) * 1440 + 10 * 60 });
    st.player.inv.invitation = (st.player.inv.invitation || 0) + 6;
    st.player.inv.wedding_flowers = (st.player.inv.wedding_flowers || 0) + 3;
    FM.Ev && FM.Ev.spawnWeddingTrash && FM.Ev.spawnWeddingTrash();
    void how;
    return m;
  }
  Soc.engage = engage;

  // 마을 대규모 결혼식 연출
  function wedding(m) {
    const st = S();
    const a = m.spouse_a_id, b = m.spouse_b_id;
    const A = a === P ? null : byId(a), B = b === P ? null : byId(b);
    st.flags.weddingMode = m.marriage_id;
    const guests = st.villagers.filter(v => v !== A && v !== B && !v.status.hospital && (!v.child || v.child.stage !== 'BABY')).slice(0, 18);
    for (const g of guests) { if (g.sceneId) Sim.endScene(Sim.scenes.find(s => s.id === g.sceneId), true); Sim.dressFor(g, 'formal'); }
    if (A) Sim.dressFor(A, 'groom'); if (B) Sim.dressFor(B, chance(0.5) && A ? 'bride' : 'groom');
    if (A && B && A.outfit === 'groom' && B.outfit === 'groom') Sim.dressFor(B, 'bride');
    const acts = {}; guests.forEach((g, i) => { acts['G' + i] = g; });
    if (A) acts.A = A; if (B) acts.B = B;
    const cx = 12, cz = -66;
    const steps = [];
    // 1. 성당이 웨딩 아치, 꽃길, 의자로 자동 리모델링 (3D에서 weddingMode 표시)
    steps.push({ bgm: 'wedding' });
    // 2. 모든 주민이 포멀한 하객 의상을 입고 모임
    // 하객들은 북쪽 고지대역에서 내려 식장 앞에 모임
    guests.forEach((g, i) => steps.push({ tp: 'G' + i, loc: 'island', x: cx + rnd(-6, 6), z: cz + 8 + rnd(0, 6) }));
    if (A) steps.push({ tp: 'A', loc: 'island', x: cx - 0.6, z: cz + 13 });
    if (B) steps.push({ tp: 'B', loc: 'island', x: cx + 0.6, z: cz + 13 });
    steps.push({ par: guests.map((g, i) => ({ go: 'G' + i, to: { loc: 'island', x: cx + (i % 2 ? 3.2 : -3.2) + rnd(-0.5, 0.5), z: cz + 2 + Math.floor(i / 2) * 1.1 }, max: 30, opts: { noMetro: true } })) });
    // 4. 신랑/신부 입장 애니메이션
    const couple = [];
    if (A) couple.push({ go: 'A', to: { loc: 'island', x: cx - 0.6, z: cz + 12 }, max: 60 });
    if (B) couple.push({ go: 'B', to: { loc: 'island', x: cx + 0.6, z: cz + 12 }, max: 60 });
    steps.push({ par: couple });
    steps.push({ par: [A ? { go: 'A', to: { loc: 'island', x: cx - 0.6, z: cz - 4 }, max: 30 } : { wait: 0.1 }, B ? { go: 'B', to: { loc: 'island', x: cx + 0.6, z: cz - 4 }, max: 30 } : { wait: 0.1 }] });
    if (A) steps.push({ face: 'A', at: B ? 'B' : 'P' }); if (B) steps.push({ face: 'B', at: A ? 'A' : 'P' });
    // 막장 드라마 난입 (희귀 확률)
    const objector = st.villagers.find(v => v.crush && (v.crush.target === a || v.crush.target === b) && v !== A && v !== B && !v.child);
    if (objector && chance(0.35)) {
      const oi = Object.entries(acts).find(([k, v]) => v === objector);
      const ok = oi ? oi[0] : 'O';
      if (!oi) acts.O = objector;
      steps.push({ go: ok, to: { loc: 'island', x: cx, z: cz + 14 }, run: true, max: 40 }, { say: ok, text: L.say(objector, 'objection', {}, true), t: 3 }, { fx: 'gasp', at: ok },
        ...guests.slice(0, 4).map((g, i) => ({ emote: 'G' + i, e: '😱' })), { wait: 1.5 }, { say: ok, text: '...아니야, 둘이 행복해라! (눈물)', t: 2.5 }, { go: ok, to: { loc: 'island', x: cx + 10, z: cz + 20 }, run: true, max: 10 });
      Sim.log('wedding', `😱 결혼식에 ${objector.name}이(가) "이 결혼 반대야!"라며 난입했어요!`, [objector.id, a, b], 3, { newsKind: 'objection' });
    }
    // 서약 및 반지 교환 (덜렁대는 성격은 반지를 떨어뜨림)
    const giver = A || B;
    const gKey = A ? 'A' : 'B';
    steps.push({ say: gKey, text: '평생 함께할 것을 맹세합니다.', t: 3 });
    if (giver && giver.clumsy && chance(0.6)) {
      steps.push({ say: gKey, text: '앗! 반지가...!', t: 1.5 }, { fx: 'ring', at: gKey },
        { par: guests.slice(0, 6).map((g, i) => ({ go: 'G' + i, to: { loc: 'island', x: cx + 6, z: cz + 6 }, run: true, max: 8 })) },
        { wait: 1 }, { par: guests.slice(0, 6).map((g, i) => ({ go: 'G' + i, to: { loc: 'island', x: cx + (i % 2 ? 3.2 : -3.2), z: cz + 2 + Math.floor(i / 2) * 1.1 }, max: 10 })) });
      Sim.log('wedding', `💍 ${giver.name}이(가) 반지를 떨어뜨려 하객들이 다 같이 굴러가는 반지를 쫓아갔어요!`, [giver.id], 2);
    }
    steps.push({ fx: 'ring', at: gKey }, { say: A && B ? 'B' : gKey, text: '네, 맹세합니다!', t: 2.5 });
    // 키스 애니메이션
    if (A) steps.push({ pose: 'A', p: 'kiss', t: 0.1 }); if (B) steps.push({ pose: 'B', p: 'kiss', t: 0.1 });
    steps.push({ wait: 2 }, { fx: 'hearts', at: gKey });
    // 5. 하객 NPC들이 폭죽을 터뜨리고 하트/축하 이모티콘
    steps.push({ par: guests.map((g, i) => ({ emote: 'G' + i, e: pick(['🎉', '❤️', '👏', '🥳']), t: 3 })) }, { fx: 'fireworks', at: gKey }, { sfx: 'fireworks' }, { wait: 3 });
    // 6. 마을 단체 기념 사진 촬영 후 신혼집으로 자동 이동
    steps.push({ fx: 'photo', at: gKey }, { sfx: 'camera' }, { do: () => { st.album = st.album || []; st.album.push({ day: day(), title: `${nm(a)} ♥ ${nm(b)} 결혼식 단체 사진`, who: [a, b, ...guests.map(g => g.id)] }); emit('photo', {}); } }, { wait: 1.5 });
    if (A) steps.push({ go: 'A', to: { home: 'A' }, max: 5 });
    Sim.scene({ title: `💒 ${nm(a)} ♥ ${nm(b)} 결혼식`, major: true, place: 'cathedral', bgm: 'wedding', actors: acts, force: true, steps, onEnd: () => marry(m) });
    if (a === P || b === P) emit('playerWedding', m);
    Sim.log('wedding', `💒 오늘 10:00, ${nm(a)}와(과) ${nm(b)}의 결혼식이 대성당에서 열렸어요! 온 동네 주민이 축가를 불렀어요.`, [a, b], 3, { newsKind: 'wedding' });
  }
  Soc.wedding = wedding;
  function marry(m) {
    const st = S();
    const a = m.spouse_a_id, b = m.spouse_b_id;
    const r = rel(a, b);
    r.status = 'MARRIED'; r.since = day(); r.boredom = 0;
    m.marriage_stage = 'MARRIED'; m.married_day = day();
    st.flags.weddingMode = null;
    for (const v of st.villagers) if (['formal', 'groom', 'bride'].includes(v.outfit)) Sim.dressFor(v, null);
    // 합가 (Co-habitation)
    let home = homeFor(a, b);
    if (!home) { const pl = Soc.freePlots('large')[0]; if (pl) { home = pl.id + '_in'; st.plots.granted = st.plots.granted || {}; st.plots.granted[pl.id] = [a, b]; } }
    m.matrimonial_home_id = home || (a === P || b === P ? 'home_p_in' : byId(a).home);
    for (const id of [a, b]) {
      if (id === P) { st.player.spouse = a === P ? b : a; continue; }
      const v = byId(id);
      if (v.home !== m.matrimonial_home_id) moveHome(v, m.matrimonial_home_id);
    }
    // 부부 성격에 따른 가구 (꽃병, 운동기구, 분담표 ...)
    const room = st.rooms[m.matrimonial_home_id] || (st.rooms[m.matrimonial_home_id] = FM.defaultRoom(byId(a === P ? b : a)));
    for (const id of [a, b]) {
      if (id === P) continue;
      const v = byId(id);
      for (const t of L.MAIN_LIFE[v.keys.L1].furn || []) if (!room.furn.some(f => f.type === t)) { const s = Sim.interiorSize(m.matrimonial_home_id); room.furn.push(FM.fdef(t, rnd(-s.w / 3, s.w / 3), rnd(-s.d / 3, s.d / 3), 0)); }
    }
    if (!room.furn.some(f => f.type === 'dining_table')) room.furn.push(FM.fdef('dining_table', 1.5, 1));
    if (!room.furn.some(f => f.type === 'storage_chest') && (a === P || b === P)) room.furn.push(FM.fdef('storage_chest', -2.5, 1.8, 90));
    emit('toast', `💒 ${nm(a)} ♥ ${nm(b)} 결혼! 신혼집: ${FM.INTERIORS[m.matrimonial_home_id].name}`);
    emit('villagers');
  }

  // =========================================================
  // 육아 시스템 & 유전 (Genetic Genome)
  // =========================================================
  function mixColor(c1, c2) {
    const ch = (c, s) => (c >> s) & 255;
    const mix = s => clamp(Math.round((ch(c1, s) * 0.5 + ch(c2, s) * 0.5) * (1 + rnd(-0.05, 0.05))), 0, 255); // ±5% 미세 돌연변이
    return (mix(16) << 16) | (mix(8) << 8) | mix(0);
  }
  const hexs = n => '#' + (n >>> 0).toString(16).padStart(6, '0');
  function makeChild(aId, bId) {
    const st = S();
    const A = aId === P ? { id: P, keys: st.player.keys || { L1: st.player.mainKey || 'ROMANTIC', L2: 'CURIOUS', L3: 'WARM', L4: 'STUDY' }, look: st.player.look || {}, name: st.player.name } : byId(aId);
    const B = bId === P ? { id: P, keys: st.player.keys || { L1: st.player.mainKey || 'ROMANTIC', L2: 'CURIOUS', L3: 'WARM', L4: 'STUDY' }, look: st.player.look || {}, name: st.player.name } : byId(bId);
    const la = Object.assign({}, A.look), lb = Object.assign({}, B.look);
    // 외모 유전 — 종: 플레이어(인간)와 주민 결합 시 주민의 종 프레임을 베이스로
    let species;
    if (aId === P) species = lb.species || 'cat';
    else if (bId === P) species = la.species || 'cat';
    else species = chance(0.5) ? la.species : lb.species;
    const base = window.ISLE && ISLE.normalizeLook ? ISLE.normalizeLook({ species }) : { species };
    const look = Object.assign({}, base);
    const human = aId === P ? A : bId === P ? B : null;
    // 보간 형질: 피부/털 색상 50:50 + ±5%
    const furA = la.species === 'human' ? la.skin : la.fur, furB = lb.species === 'human' ? lb.skin : lb.fur;
    look.fur = mixColor(furA || 0xd9a066, furB || 0xd9a066);
    look.skin = mixColor(la.skin || 0xffe2c8, lb.skin || 0xffe2c8);
    // 머리/갈기 색상: 한쪽을 베이스, 서브 하이라이트에 상대 부모의 색상
    const hairBase = chance(0.5) ? A : B;
    const hairOther = hairBase === A ? B : A;
    look.hair = (human ? human.look.hair : hairBase.look.hair) || 0x8a5a3b;
    look.fur2 = hairOther.look.fur2 || hairOther.look.hair || look.fur;
    // 단일 형질: 눈 모양 47.5% / 47.5% / 돌연변이 5%
    const eyeOpts = window.ISLE && ISLE.CHAR_OPT ? Object.keys(ISLE.CHAR_OPT.eyes) : ['dot', 'sparkle', 'round'];
    const er = Math.random();
    look.eyes = human ? human.look.eyes || 'dot' : er < 0.475 ? la.eyes : er < 0.95 ? lb.eyes : pick(eyeOpts);
    look.eyeColor = (chance(0.5) ? la.eyeColor : lb.eyeColor) || 0x2b201c;       // 눈동자 50:50
    look.marking = chance(0.5) ? la.marking || 'none' : lb.marking || 'none';
    look.hairStyle = chance(0.5) ? la.hairStyle : lb.hairStyle;
    look.top = 'tee'; look.shirt = pick([0xffd84a, 0x8fd3ff, 0xff8fb1, 0x8ee07a]); look.bottom = 'shorts';
    const kidSex = chance(0.5) ? 'F' : 'M'; look.gender = kidSex; look.lashes = kidSex === 'F';
    const height = ((la.height || 1) + (lb.height || 1)) / 2 * (1 + rnd(-0.03, 0.03));
    // 성격 유전: 부모 A 메인 + 부모 B 메인 → 유아기 복합 성격
    const keys = { L1: A.keys.L1, L2: pick([A.keys.L2, B.keys.L2]), L3: pick([A.keys.L3, B.keys.L3]), L4: pick([A.keys.L4, B.keys.L4]) };
    const v = Sim.makeVillager({ keys, look, extraMain: A.keys.L1 !== B.keys.L1 ? [B.keys.L1] : [], name: undefined,
      child: { parents: [aId, bId], parent_a_id: aId, parent_b_id: bId, stage: 'BABY', growth_stage: 'BABY', birth_date: day(), birthDay: day(),
        genetics: { skin_color: hexs(look.fur), personality_primary: A.keys.L1, personality_secondary: B.keys.L1 },
        dna: { phenotype: { skin_tone: hexs(look.fur), eye_shape: look.eyes, eye_color: hexs(look.eyeColor || 0), hair_texture: look.hairStyle || (look.species + '_ears'), hair_color: hexs(look.hair), height_factor: +height.toFixed(2) },
          genotype_personality: { dominant_a: A.keys.L1, dominant_b: B.keys.L1, recessive_a: A.keys.L3, recessive_b: B.keys.L3 } },
        epigenetics: { parenting_score: 50, environment_bias: 'INDOOR', expressed_third_trait: null },
        parenting_satisfaction: 70, attach: { [aId]: 80, [bId]: 80 }, env: { talk: 0, outdoor: 0, kids: 0, neglect: 0 }, third: null, crying: false } });
    v.child.attach_a = 80; v.child.attach_b = 80; v.gender = kidSex;
    const m = marriageOf(aId);
    v.home = m ? m.matrimonial_home_id : (aId === P ? 'home_p_in' : A.home);
    v.loc = v.home; v.x = 0; v.z = 0;
    st.villagers.push(v);
    Sim.derive(v);
    const room = st.rooms[v.home];
    if (room && !room.furn.some(f => f.type === 'cradle')) { const s = Sim.interiorSize(v.home); room.furn.push(FM.fdef('cradle', s.w / 2 - 1.2, -s.d / 2 + 1.2)); }
    for (const o of st.villagers) if (o !== v) rel(v.id, o.id);
    for (const pid of [aId, bId]) { const r = rel(v.id, pid); r.friendship_point = 90; r.trust_level = 90; updateStage(r); }
    rel(v.id, P);
    Sim.log('baby', `👶 ${nm(aId)}와(과) ${nm(bId)}의 아기 ${v.name}이(가) 태어났어요! (신혼집에 요람 추가)`, [aId, bId, v.id], 3, { newsKind: 'baby' });
    emit('toast', `👶 ${v.name} 탄생! 부모: ${nm(aId)} & ${nm(bId)}`);
    emit('villagers');
    return v;
  }
  Soc.makeChild = makeChild;

  function growChild(v) {
    const c = v.child;
    const age = day() - c.birthDay;
    if (c.stage === 'BABY' && age >= D.PARENT.babyDays) {
      c.stage = c.growth_stage = 'TODDLER';
      Sim.log('baby', `🍼 ${v.name}이(가) 유아(TODDLER)로 자랐어요! 이제 아장아장 걸어요.`, [v.id], 2);
      emit('outfit', v);
    } else if (c.stage === 'TODDLER' && age >= D.PARENT.babyDays + D.PARENT.toddlerDays) {
      c.stage = c.growth_stage = 'CHILD';
      // 후천적 발현: 3번째 성격 키워드 개화
      const e = c.env;
      let third = 'WARM';
      if (c.parenting_satisfaction >= 80 && e.talk >= 6) third = 'WARM';
      else if (c.parenting_satisfaction <= 40 || e.neglect >= 5) third = 'CYNICAL';
      else if (e.outdoor >= e.kids && e.outdoor >= 4) third = 'CURIOUS';
      else if (e.kids >= 4) third = 'BUSYBODY';
      else third = c.parenting_satisfaction >= 60 ? 'WARM' : 'CYNICAL';
      c.third = third; c.epigenetics.expressed_third_trait = third;
      c.epigenetics.environment_bias = e.outdoor >= e.kids ? 'OUTDOOR' : 'INDOOR';
      Sim.derive(v);
      // 자기만의 방: 전용 침대와 책상
      const room = S().rooms[v.home];
      if (room) { const s = Sim.interiorSize(v.home); room.furn.push(FM.fdef('kid_bed', -s.w / 2 + 1, s.d / 2 - 1.3), FM.fdef('kid_desk', s.w / 2 - 1, s.d / 2 - 0.6, 180)); room.furn = room.furn.filter(f => f.type !== 'cradle'); }
      Sim.log('baby', `🎒 ${v.name}이(가) 어린이(CHILD)가 되었어요! 3번째 성격 [${D.kw(third).name}] 개화 → 최종 인격: ${Sim.allKeys(v).filter((k, i, a) => a.indexOf(k) === i && D.L1[k] || k === third).map(k => D.kw(k).name).join(' + ')}`, [v.id], 3, { newsKind: 'child' });
      emit('outfit', v);
    }
  }

  // =========================================================
  // 퀘스트
  // =========================================================
  let qSeq = 1;
  function addQuest(q) {
    const st = S();
    q.id = 'q' + (st.quests.length + qSeq++);
    q.day = day(); q.state = 'active'; q.created = st.time;
    st.quests.push(q);
    emit('quest', q);
    emit('toast', `📜 새 퀘스트: ${q.title}`);
    return q;
  }
  Soc.addQuest = addQuest;

  // =========================================================
  // 동행 (최대 4명) — 플레이어를 따라다니고 건물에도 함께 들어감
  // =========================================================
  Soc.followers = function () {
    const p = pl();
    if (!p.followers) p.followers = p.follower ? [p.follower] : [];
    p.followers = p.followers.filter(id => { const v = byId(id); return v && v.following && !v.status.hospital; });
    p.follower = p.followers[0] || null;
    return p.followers.map(byId);
  };
  Soc.addFollower = function (v, mode = 'walk') {
    const p = pl(); Soc.followers();
    if (!p.followers.includes(v.id)) p.followers.push(v.id);
    p.follower = p.followers[0];
    v.following = mode; v.followUntil = S().time + (mode === 'walk' ? 240 : 120);
    v.route = null; v.act = null; Sim.releaseSpot && Sim.releaseSpot(v); Sim.freeUse(v);
    emit('toast', `🚶 ${v.name}이(가) 함께 다녀요! (${mode === 'walk' ? '동행 산책' : '근처 건물 구경'})`);
  };
  Soc.removeFollower = function (v, line) {
    const p = pl();
    v.following = false; v.followUntil = 0; v.idleT = 1; v.pose = null; v.act = null; v.followUse = null;
    if (Sim.useOcc && v.useKey && Sim.useOcc[v.useKey] === v.id) Sim.freeUse(v);
    p.followers = (p.followers || []).filter(id => id !== v.id);
    p.follower = p.followers[0] || null;
    if (line) Sim.say(v, L.sty(v, line));
  };
  function finishQuest(q, ok = true, msg) {
    q.state = ok ? 'done' : 'failed';
    q.doneAt = S().time;
    emit('quest', q);
    if (msg) emit('toast', (ok ? '✅ ' : '❌ ') + msg);
  }
  Soc.finishQuest = finishQuest;
  // 퀘스트 포기: 의뢰한 주민이 살짝 서운해함 (친밀도 -2, 신뢰도 -3)
  Soc.abandonQuest = function (q) {
    if (!q || q.state !== 'active') return;
    q.abandoned = true;
    finishQuest(q, false, `'${q.title}' 퀘스트를 포기했어요`);
    q.state = 'abandoned';
    const g = q.giver && q.giver !== P ? byId(q.giver) : null;
    if (g && !g.child) { addFriend(g.id, P, -2, -3, '퀘스트 포기'); Sim.say(g, L.sty(g, '아… 괜찮아. 다음엔 꼭 도와줘')); Sim.emote(g, '😢'); }
    if (g && g.balloon) g.balloon = null;
    if (S().pinQuest === q.id) S().pinQuest = null;
    emit('quest', q);
  };
  Soc.activeQuests = () => S().quests.filter(q => q.state === 'active');

  // =========================================================
  // 매일 / 매 틱
  // =========================================================
  Soc.init = function () {
    // 입주 전부터 알던 이웃 몇 쌍 + 은근한 설렘 (섬이 금방 북적이도록)
    const vs = S().villagers.filter(v => !v.child);
    for (let i = 0; i < Math.min(6, vs.length); i++) {
      const a = pick(vs), b = pick(vs.filter(x => x !== a));
      if (!b) continue;
      const r = rel(a.id, b.id); r.friendship_point = rint(30, 62); r.trust_level = rint(30, 60); updateStage(r);
      F(a.id, b.id).affection = F(b.id, a.id).affection = (r.friendship_point + r.trust_level) / 2;
    }
    for (let i = 0; i < 3; i++) {
      const a = pick(vs), b = pick(vs.filter(x => x !== a && tasteMatch(a, x)));
      if (a && b) F(a.id, b.id).romance = rint(35, 58);
    }
  };
  Soc.onLoad = function () {};
  Soc.daily = function () {
    const st = S();
    const d = day();
    for (const r of Object.values(st.rel)) {
      // 3일 이상 무관심/방치 → -2/일 (일정 수준 이하로는 하락 방지)
      if (d - r.lastDay >= 3 && r.friendship_point > D.FRIEND_TRIGGERS.neglect.floor && !r.permanent) { r.friendship_point = Math.max(D.FRIEND_TRIGGERS.neglect.floor, r.friendship_point - 2); updateStage(r); }
      if (r.status === 'DATING' || r.status === 'MARRIED') {
        r.stagnation_days = d - r.lastDate;
        if (d - r.lastDate >= 3) addBoredom(r, D.BOREDOM_RULES.noDate3.v, '3일 이상 데이트 없음');
        const A = byId(r.subject_id), B = byId(r.target_id);
        if ((A && A.jealousy && A.jealousy.meter >= 70) || (B && B.jealousy && B.jealousy.meter >= 70)) addBoredom(r, D.BOREDOM_RULES.unresolved.v, '질투/갈등 미해결');
        if (r.status === 'DATING' && d - r.since >= 30 && r.dates < (d - r.since) / 4) addBoredom(r, 4, '데이트 횟수 부족');
        if (d - r.lastDate <= 2) { r.friendship_point = clamp(r.friendship_point + 1, 0, 100); r.trust_level = clamp(r.trust_level + 1, 0, 100); updateStage(r); }
      }
      if (r.status === 'EX') {
        r.cooldown_days_left = Math.max(0, r.cooldown_until - d);
        // 이별 후 4~7일차: 전 연인 중 한 명이 플레이어에게 고민 풍선
        if (d - r.exSince >= 4 && d - r.exSince <= 7 && !r.reunionAsked) {
          const who = [byId(r.subject_id), byId(r.target_id)].filter(Boolean);
          if (who.length) { const w = pick(who); r.reunionAsked = true; Sim.balloon(w, 'reunion', chance(0.5) ? 'purple' : 'pink', { ex: w.id === r.subject_id ? r.target_id : r.subject_id }); emit('notify', { v: w, text: `${w.name}이(가) 전 연인 때문에 고민 중이에요` }); }
        }
        if (r.cooldown_until <= d && r.status === 'EX') { r.status = r.friendship_point >= 30 ? 'NONE' : 'NONE'; r.avoidZone = null; }
      }
    }
    // 설렘은 시간이 지나면 조금씩 감소
    for (const [k, f] of Object.entries(st.dir)) { if (f.romance > 0) f.romance = Math.max(0, f.romance - 0.6); }
    for (const v of st.villagers) {
      if (v.crush) syncCrush(v);
      if (v.jealousy) { v.jealousy.meter = v.jealousy.jealousy_meter = Math.max(0, v.jealousy.meter - 8); if (v.jealousy.meter < 40 && v.balloon && v.balloon.kind === 'jealous') v.balloon = null; }
      if (v.status.exUntil && v.status.exUntil <= d) { v.status.exUntil = 0; v.status.ex = null; v.status.severe = false; }
      if (v.child) {
        growChild(v);
        if (v.child.stage !== 'CHILD') {
          // 방치 체크 (부모 상호작용이 적으면 충족도 하락)
          v.child.parenting_satisfaction = clamp(v.child.parenting_satisfaction - 3, 0, 100);
          if (v.child.parenting_satisfaction < 40) v.child.env.neglect++;
          v.child.epigenetics.parenting_score = Math.round(v.child.parenting_satisfaction);
        }
      }
    }
    // 결혼 진행 / 만족도 / 육아 진입 / 용돈
    for (const m of st.marriages) {
      if (m.marriage_stage === 'WEDDING_PREP' && d > m.wedding_day) m.wedding_day = d; // 놓친 경우 오늘
      if (m.marriage_stage !== 'MARRIED') continue;
      const r = rel(m.spouse_a_id, m.spouse_b_id);
      m.marital_satisfaction = clamp(m.marital_satisfaction + (d - r.lastDate <= 2 ? 1 : -3) - r.boredom / 50, 0, 100);
      if (m.marital_satisfaction < 20) { m.lowDays = (m.lowDays || 0) + 1; if (m.lowDays >= 5 && !m.divorceAsked) { m.divorceAsked = true; FM.Ev && FM.Ev.queue && FM.Ev.queue('divorce', m); } } else m.lowDays = 0;
      // 결혼 14일 차 + 만족도 80 이상 → 아기 탄생 / 입양
      const kids = S().villagers.filter(v => v.child && v.child.parents.includes(m.spouse_a_id) && v.child.parents.includes(m.spouse_b_id));
      if (d - m.married_day >= D.PARENT.afterDays && m.marital_satisfaction >= D.PARENT.satisfaction && !kids.some(k => k.child.stage !== 'CHILD') && kids.length < 3 && st.villagers.length < 40) {
        if (m.spouse_a_id === P || m.spouse_b_id === P) { if (!m.babyAsked || d - m.babyAsked > 3) { m.babyAsked = d; emit('babyOffer', m); } }
        else if (chance(0.5)) makeChild(m.spouse_a_id, m.spouse_b_id);
      }
    }
    later.length = 0;
  };

  let jDecayT = 0;
  Soc.tick = function (dtR, dMin) {
    const st = S();
    while (later.length) { try { later.shift()(); } catch (e) { console.error(e); } }
    // 약속 처리 (고백 / 이별)
    for (const ap of st.appts.slice()) {
      if (ap.started || st.time < ap.at) continue;
      ap.started = true;
      st.appts.splice(st.appts.indexOf(ap), 1);
      if (ap.type === 'breakup') { const r = rel(ap.a, ap.b); if (r.status === 'DATING' || r.status === 'MARRIED') breakupScene(ap.a, ap.b, ap.spot); }
      if (ap.type === 'confess') {
        const a = byId(ap.a), b = byId(ap.b);
        if (!a || !b) continue;
        if (!ap.bInvited && chance(0.6)) {
          // 약속한 시간에 만나지 않음 — 고백 불발
          Sim.say(a, '...안 오네. 역시 난 안 되나 봐.');
          a.status.slumpUntil = st.time + 1440; endCrush(a);
          Sim.log('confess', `🕕 ${a.name}은(는) ${D.CONFESS_SPOTS.find(s => s.id === ap.spot).name}에서 기다렸지만 ${b.name}은(는) 오지 않았어요...`, [a.id, b.id], 2);
          continue;
        }
        runConfession(a, b, ap.spot, { force: true });
      }
    }
    // 결혼식 당일 10:00
    for (const m of st.marriages) {
      if ((m.marriage_stage === 'WEDDING_PREP' || m.marriage_stage === 'ENGAGED') && day() >= m.wedding_day && hour() >= D.MARRIAGE.weddingHour && !m.weddingStarted) {
        m.weddingStarted = true; wedding(m);
      }
    }
    // 질투 서서히 감쇄
    jDecayT += dMin;
    if (jDecayT > 60) {
      jDecayT = 0;
      for (const v of st.villagers) if (v.jealousy && v.jealousy.meter > 0) v.jealousy.meter = v.jealousy.jealousy_meter = Math.max(0, v.jealousy.meter - 2);
      // 아기 울음 (BABY_CRYING)
      for (const v of st.villagers) if (v.child && v.child.stage === 'BABY' && !v.child.crying && chance(0.12)) {
        v.child.crying = true; v.child.cryAt = st.time; Sim.emote(v, '😭', 6);
        Sim.log('baby', `😭 ${v.name}이(가) 울고 있어요! 부모가 달려가요.`, [v.id], 0);
        if (v.child.parents.includes(P)) emit('notify', { v, text: `👶 ${v.name}이(가) 울어요! 집으로 가서 달래주세요` });
      }
      for (const v of st.villagers) if (v.child && v.child.crying && st.time - v.child.cryAt > 180) { v.child.crying = false; v.child.parenting_satisfaction = clamp(v.child.parenting_satisfaction - 6, 0, 100); v.child.env.neglect++; }
    }
    // 권태기 100 (플레이어 연인)
    // 부모 배우기: 어린이는 부모의 소품을 들고 다님
  };

  // =========================================================
  // 플레이어 상호작용 API
  // =========================================================
  const pl = () => S().player;
  function giveItem(id, n = 1) { const inv = pl().inv; inv[id] = (inv[id] || 0) + n; }
  function takeItem(id, n = 1) { const inv = pl().inv; if ((inv[id] || 0) < n) return false; inv[id] -= n; if (inv[id] <= 0) delete inv[id]; return true; }
  Soc.giveItem = giveItem; Soc.takeItem = takeItem;
  const stageOf = v => rel(v.id, P).friendship_stage;
  function nickFor(v) {
    const r = rel(v.id, P);
    const pn = r.nickname[P] || null;       // 주민이 플레이어를 부르는 애칭
    return pn || pl().name;
  }
  Soc.nickFor = nickFor;

  // 대화 시작 (TALK_PLAYER) — Priority 1
  Soc.playerTalk = function (v) {
    const st = S();
    if (v.sceneId) { const sc = Sim.scenes.find(s => s.id === v.sceneId); if (sc && !sc.major && sc.title !== '입원') Sim.endScene(sc, true); else return { text: L.say(v, 'busy'), options: [] }; }
    v.route = null; v.act = null; Sim.releaseSpot(v); Sim.freeUse(v);
    v.state = 'TALK_PLAYER'; v.pose = 'talk'; v.talkingToPlayer = true; v.talkUntil = st.realT + 120;
    const p = pl();
    if (p.loc === v.loc) v.ry = Math.atan2(p.x - v.x, p.z - v.z);
    // 플레이어 쟁탈전: 다른 짝사랑 주민이 뒤에서 발을 구르며 기다림
    for (const o of st.villagers) if (o !== v && o.crush && o.crush.target === P && o.loc === p.loc && Math.hypot(o.x - p.x, o.z - p.z) < 15 && !o.sceneId) {
      Sim.scene({ title: '발 구르며 기다리기', actors: { A: o }, steps: [{ go: 'A', to: { loc: p.loc, x: p.x + 3, z: p.z + 2 } }, { pose: 'A', p: 'stomp', t: 4 }, { emote: 'A', e: '💢' }] });
      o.status.waitingForPlayer = true;
    }
    return { text: openingLine(v), options: Soc.talkOptions(v) };
  };
  function openingLine(v) {
    const st = S();
    const r = rel(v.id, P);
    if (v.status.hospital) return L.say(v, 'hospital');
    if (!(v.wokeUntil > st.realT) && (v.act && v.act.id === 'sleep' || Sim.asleep(v, hour()) && v.loc === v.home)) return L.say(v, 'sleepy', {}, true);
    if (r.misunderstanding && r.misunderstanding.until > day()) return L.say(v, 'misunderstanding', { t: nm(r.misunderstanding.by) });
    if (r.status === 'EX' || r.exPlayer) return L.say(v, 'exAwkward', {}, true);
    if (v.balloon) {
      const b = v.balloon;
      if (b.kind === 'crush') return L.say(v, 'crushConsult', { t: nm(b.data.target), p: nickFor(v) }, true);
      if (b.kind === 'crushP') return `${nickFor(v)}... 나, 사실 너를 좋아해. 나랑 사귀어 줄래?`;
      if (b.kind === 'jealous') return L.say(v, 'jealousConsult', { partner: nm(b.data.partner), rival: nm(b.data.rival) }, true);
      if (b.kind === 'bored') return L.say(v, 'boredConsult', { partner: nm(b.data.partner) }, true);
      if (b.kind === 'reunion') return L.say(v, 'reunionConsult', {}, true);
      if (b.kind === 'marry') return L.say(v, 'weddingAsk', { t: nm(b.data.partner) }, true);
      if (b.kind === 'secret') return L.say(v, 'secretTell', {}, true) + ' ' + b.data.text;
      if (b.kind === 'kid') return b.data.text;
      if (b.kind === 'capsule') return L.say(v, 'capsuleAsk', {}, true);
      if (b.kind === 'errand') return b.data.text;
    }
    if (v.hunger > 85) return L.say(v, 'hungry');
    if (v.coins <= 0) return L.say(v, 'poor');
    const pt = partnerOf(v.id);
    if (pt === P) { const m = marriageOf(v.id); if (m && inH(hour(), 6, 10)) return L.MAIN_LIFE[v.keys.L1].morning; return L.sty(v, `${r.nickname[P] || pl().name}, 보고 싶었어`); }
    if (v.pattern === 'B' && inH(hour(), 14, 18)) return L.say(v, 'coachJog', {}, true);
    if (v.pattern === 'C') return L.say(v, 'waterGrumble', {}, true);
    if (v.pattern === 'A' && inH(hour(), 19, 23)) return L.say(v, 'moonShy', {}, true);
    const once = r.greetDay !== day();
    if (once) return L.greet(v, r.friendship_stage, { p: pl().name, n: r.nickname.forP || pl().name });
    return L.topic(v);
  }

  Soc.talkOptions = function (v) {
    const st = S();
    const r = rel(v.id, P);
    const O = [];
    const stage = r.friendship_stage;
    const ge = s => Soc.stageAtLeast(v.id, P, s);
    const b = v.balloon;
    if (b && b.kind === 'crush') {
      O.push({ id: 'coach1', label: '"완벽한 사랑이야! 당장 마음을 고백해!" (직진 코칭)' });
      O.push({ id: 'coach2', label: '"일단 취향부터 파악해 봐" (전략 코칭)' });
      O.push({ id: 'coach3', label: '"집에 몰래 러브레터를 넣어두는 건 어때?" (비밀 편지)' });
      O.push({ id: 'coach4', label: '"아냐, 그건 그냥 우정이야. 정신 차려!" (연애 억제)' });
      O.push({ id: 'coachC', label: '"그 사람은 너랑 안 어울려. 포기해" (마음 정돈)' });
      return O;
    }
    if (b && b.kind === 'crushP') { O.push({ id: 'acceptP', label: '💕 "나도 좋아!" (연인이 되기)' }, { id: 'declineP', label: '"미안, 우린 친구로 지내자"' }); return O; }
    if (b && b.kind === 'jealous') {
      O.push({ id: 'jeal1', label: '"오해일 거야. 내가 진짜 마음을 알아봐 줄게" (오해 해소)' });
      O.push({ id: 'jeal2', label: '"놓치기 전에 너도 당당하게 애정을 표현해!" (정면 돌파)' });
      O.push({ id: 'jealWarn', label: `"${nm(b.data.rival)}에게 건드리지 말라고 경고할게"` });
      O.push({ id: 'jeal3', label: `"${nm(b.data.rival)}가 훨씬 멋지긴 하지. 네가 포기해" (이별 유도)` });
      return O;
    }
    if (b && b.kind === 'bored') {
      O.push({ id: 'bored1', label: '"둘만의 데이트를 해봐! 내가 분위기 잡아줄게" (연애 코칭)' });
      O.push({ id: 'bored2', label: '"즐겁지 않다면... 헤어지는 게 맞을지도"' });
      return O;
    }
    if (b && b.kind === 'reunion') {
      O.push({ id: 'reunion1', label: '"아직 늦지 않았어! 가서 사과하고 다시 잡아!" (재회 루트)' });
      O.push({ id: 'reunion2', label: '"지나간 인연이야. 새 출발을 준비해" (마음 정리 루트)' });
      return O;
    }
    if (b && b.kind === 'marry') { O.push({ id: 'marryYes', label: '💍 "좋아! 프러포즈를 도와줄게!"' }, { id: 'marryNo', label: '"조금만 더 기다려 봐"' }); return O; }
    if (b && b.kind === 'secret') { O.push({ id: 'secretKeep', label: '🤐 "절대 아무한테도 말 안 할게"' }); return O; }
    if (b && b.kind === 'capsule') { O.push({ id: 'capsuleYes', label: '⏳ "좋아! 같이 묻자!"' }, { id: 'capsuleNo', label: '"다음에 하자"' }); return O; }
    if (b && b.kind === 'errand') { O.push({ id: 'errandYes', label: '📦 "알겠어, 맡겨줘!"' }, { id: 'errandNo', label: '"지금은 바빠"' }); return O; }
    if (b && b.kind === 'kid') { for (const o of b.data.options) O.push(o); return O; }
    O.push({ id: 'chat', label: '💬 대화하기' });
    O.push({ id: 'gift', label: '🎁 선물하기', disabled: !ge('FRIEND') && !Object.keys(pl().inv).some(k => D.ITEMS[k] && D.ITEMS[k].special === 'confess'), hint: '일반 친구부터 해금' });
    O.push({ id: 'praise', label: '👏 칭찬하기' });
    if (ge('FRIEND')) O.push({ id: 'nickname', label: '🏷️ 별명 만들기' });
    if (ge('GOOD_FRIEND')) O.push({ id: 'consult', label: '🤫 비밀 고민 상담' });
    if (v.following) O.push({ id: 'unfollow', label: '👋 오늘 동행은 여기까지! (헤어지기)' });
    else if (ge('GOOD_FRIEND')) O.push({ id: 'walk', label: partnerOf(v.id) === P ? '💑 같이 가자 (데이트 동행 · 건물도 함께)' : '🚶 동행 산책 (건물도 함께 들어가요)' });
    else if (ge('FRIEND')) O.push({ id: 'joinIn', label: '🚪 근처 건물 같이 구경 갈래?' });
    if (ge('GOOD_FRIEND')) O.push({ id: 'invite', label: '🏠 우리 집에 초대하기' });
    O.push({ id: 'errand', label: '📦 도와줄 일 있어?' });
    O.push({ id: 'nudge', label: '💘 "너 OO랑 잘 어울리던데?" (부추기기)', disabled: !!v.child });
    if (pl().knownSecrets.length) O.push({ id: 'leak', label: '🗣️ 다른 주민의 비밀 말하기' });
    if (partnerOf(v.id) === P) {
      O.push({ id: 'petname', label: '💕 애칭 설정' });
      if (rel(v.id, P).status === 'DATING') O.push({ id: 'propose', label: '💍 청혼하기', disabled: !(pl().inv.ring || pl().inv.feather), hint: '약혼반지 또는 청혼의 깃털 필요' });
      O.push({ id: 'breakupP', label: '💔 헤어지자' });
    }
    if (v.loc === v.home && v.loc !== 'home_p_in') O.push({ id: 'cleanOrder', label: '🧹 "방 좀 치워!"' });
    if (v.status.hospital) O.push({ id: 'care', label: '🍎 간병하기 (토끼 모양 사과)' });
    // 퀘스트 관련
    for (const q of Soc.activeQuests()) {
      if (q.type === 'invite_confess' && q.target === v.id) O.push({ id: 'qInvite:' + q.id, label: `📣 "${q.hm}에 ${q.spotName}(으)로 나와봐!"` });
      if (q.type === 'jealousy_investigate' && q.target === v.id) O.push({ id: 'qInvestigate:' + q.id, label: `🔍 "${nm(q.partner)}와(과) 무슨 사이야?"` });
      if (q.type === 'jealousy_warn' && q.target === v.id) O.push({ id: 'qWarn:' + q.id, label: `✋ "${nm(q.partner)} 건드리지 마!"` });
      if (q.type === 'wedding_prep' && !(q.invited || []).includes(v.id) && pl().inv.invitation) O.push({ id: 'qInvitation:' + q.id, label: '✉️ 청첩장 전달하기' });
      if (q.type === 'errand' && q.target === v.id && (!q.item || pl().inv[q.item])) O.push({ id: 'qErrand:' + q.id, label: `📦 ${q.item ? D.ITEMS[q.item].name + ' 전달하기' : '전해줄 말: "' + q.msg + '"'}` });
      if (q.type === 'kid_walk' && q.target === v.id) O.push({ id: 'qWalk:' + q.id, label: '🚶 걸음마 연습하자! (한 걸음씩)' });
      if (q.type === 'secret_letter' && q.target === v.id && q.stage === 'check') O.push({ id: 'qLetterCheck:' + q.id, label: '💌 "어제 편지 받았어?"' });
      if (q.type === 'kid_fever' && q.target === v.id && pl().inv.medicine_kid) O.push({ id: 'qFever:' + q.id, label: '💊 어린이용 약 먹이기' });
      if (q.type === 'hospital_care' && q.target === v.id) O.push({ id: 'care', label: '🍎 간병하기' });
      if (q.type === 'report_letter' && q.target === v.id) O.push({ id: 'qReport:' + q.id, label: `📖 "${nm(q.from)}가 도서관 책에 너한테 쪽지를 남겼어"` });
    }
    // 아기 돌보기 (플레이어가 부모일 때)
    if (v.child && v.child.parents.includes(P)) {
      if (v.child.stage === 'BABY') O.push({ id: 'baby:milk', label: '🍼 우유 주기' }, { id: 'baby:rock', label: '🧺 요람 흔들기' }, { id: 'baby:lullaby', label: '🎶 자장가 불러주기' }, { id: 'baby:diaper', label: '🧷 기저귀 교환' });
      if (v.child.stage === 'TODDLER') O.push({ id: 'baby:hide', label: '🙈 함께 숨바꼭질' }, { id: 'baby:playground', label: '🛝 놀이터 가기' });
      if (v.child.stage === 'CHILD') O.push({ id: 'baby:teach', label: '🎣 곤충 채집/낚시 가르치기' });
    }
    O.push({ id: 'bye', label: '👋 잘 가' });
    void stage; void st;
    return O;
  };

  // 선택 처리 → { text, options?, close? }
  Soc.playerChoose = function (v, id, arg) {
    Sim.talkChoosing = true;
    try {
      if (id !== 'bye') v.talkUntil = S().realT + 120;
      return choose0(v, id, arg);
    } finally { Sim.talkChoosing = false; }
  };
  function choose0(v, id, arg) {
    const st = S();
    const r = rel(v.id, P);
    const p = pl();
    const ret = (text, close = false, options) => ({ text, close, options: options || (close ? [] : Soc.talkOptions(v)) });
    const clearBalloon = () => { v.balloon = null; };
    const [cmd, qid] = id.split(':');
    const Q = qid ? st.quests.find(q => q.id === qid) : null;
    switch (cmd) {
      case 'bye': v.talkingToPlayer = false; v.state = 'WATCH_LOOK'; v.pose = null; v.idleT = 1.5; releaseWaiters(); return ret(L.sty(v, '또 봐!'), true);
      case 'chat': {
        const once = r.greetDay !== day();
        r.greetDay = day(); p.lastTalk[v.id] = day();
        addFriend(v.id, P, once ? D.FRIEND_TRIGGERS.greet.fp : 0.3, once ? D.FRIEND_TRIGGERS.greet.trust : 0, '인사');
        if (v.child) v.child.env.talk++;
        if (canRomance(v.id, P) && chance(0.4)) addRomance(v.id, P, rnd(0.5, 2));
        if (partnerOf(v.id) === P) { r.lastDate = day(); addBoredom(r, -3); }
        return ret(L.topic(v));
      }
      case 'praise': {
        v.confidence = clamp((v.confidence || 0) + 20, 0, 100);
        addFriend(v.id, P, 1, 1, '칭찬');
        if (has(v, 'ANXIOUS')) { addRomance(v.id, P, 1); return ret(L.say(v, 'praiseAnxious', {}, true)); }
        if (v.crush && v.crush.target !== P) addRomance(v.id, v.crush.target, 2, '플레이어의 격려');
        return ret(L.say(v, 'praise'));
      }
      case 'gift': return Soc.playerGift(v, arg);
      case 'nickname': {
        if (!arg) return ret('어떤 별명으로 부를까?', false, [{ id: 'nickname', label: '별명 입력', input: true }]);
        r.nickname.byP = arg; v.nick = arg;
        addFriend(v.id, P, 2, 1, '별명');
        return ret(L.sty(v, `${arg}? 헤헤, 마음에 들어`));
      }
      case 'petname': {
        if (!arg) return ret('나를 뭐라고 불러줄래?', false, D.PET_NAMES.map(n => ({ id: 'petname', label: n, arg: n })));
        r.nickname[P] = arg;
        return ret(L.sty(v, `응! 앞으로 ${arg}(이)라고 부를게`));
      }
      case 'consult': {
        if (!Soc.stageAtLeast(v.id, P, 'GOOD_FRIEND')) return ret('아직은 좀...');
        addFriend(v.id, P, D.FRIEND_TRIGGERS.secret.fp, D.FRIEND_TRIGGERS.secret.trust, '비밀 상담');
        // 친밀도 80 이상 — 절친 전용 비밀 퀘스트
        if (r.friendship_point >= 80 && !r.secret_shared) {
          const target = v.crush ? nm(v.crush.target) : pick(st.villagers.filter(o => o !== v)).name;
          const text = L.fill(pick(L.LINES.secretKinds), { t: target });
          r.secret_shared = true;
          p.knownSecrets.push({ owner: v.id, text, day: day() });
          if (v.crush) v.crush.player_aware = true;
          addQuest({ type: 'secret_keep', title: `🤫 ${v.name}의 비밀 지키기`, giver: v.id, target: v.id, desc: '7일 동안 다른 주민에게 비밀을 누설하지 않으면 [영구 절친 상태]로 전환', until: day() + 7 });
          return ret(L.say(v, 'secretTell', {}, true) + ' ' + text, false, [{ id: 'secretKeep', label: '🤐 "절대 아무한테도 말 안 할게"' }]);
        }
        if (v.crush) { v.crush.player_aware = true; return ret(L.say(v, 'crushConsult', { t: nm(v.crush.target), p: nickFor(v) }, true)); }
        return ret(L.sty(v, pick(['요즘 조금 외로웠는데 얘기 들어줘서 고마워', '사실 일이 좀 힘들었어. 들어줘서 고마워', '너한테 털어놓으니까 속이 시원하다'])));
      }
      case 'secretKeep': clearBalloon(); return ret(L.sty(v, '역시 너밖에 없어. 고마워'));
      case 'leak': {
        if (!arg) return ret('누구의 비밀을 말할까?', false, p.knownSecrets.filter(s => s.owner !== v.id).map((s, i) => ({ id: 'leak', label: `${nm(s.owner)}: "${s.text}"`, arg: String(p.knownSecrets.indexOf(s)) })).concat([{ id: 'chat', label: '역시 그만두자' }]));
        const sec = p.knownSecrets[+arg]; if (!sec) return ret('...');
        p.knownSecrets.splice(+arg, 1);
        // 타인에게 비밀 누설 시 신뢰도 -50 (관계 격하)
        const rr = addFriend(sec.owner, P, -10, D.FRIEND_TRIGGERS.leak.trust, '비밀 누설');
        rr.permanent = false; updateStage(rr);
        const q = st.quests.find(x => x.type === 'secret_keep' && x.giver === sec.owner && x.state === 'active'); if (q) finishQuest(q, false, `${nm(sec.owner)}의 비밀을 누설했어요... 신뢰도 -50`);
        Sim.log('gossip', `🗣️ ${nm(sec.owner)}의 비밀이 퍼졌어요: "${sec.text}"`, [sec.owner, v.id], 2, { rumor: true });
        return ret(L.sty(v, '헐... 진짜? 대박이다'));
      }
      case 'unfollow': Soc.removeFollower(v); return ret(L.sty(v, '오늘 같이 다녀서 즐거웠어! 또 불러줘'), true);
      case 'joinIn': {
        if (Soc.followers().length >= 4) return ret(L.sty(v, '벌써 일행이 많네~ 다음에 같이 가자!'));
        if (!chance(0.45 + r.friendship_point / 150 + r.trust_level / 300)) return ret(L.sty(v, '음... 지금은 좀 바빠서. 다음에 같이 가자!'));
        Soc.addFollower(v, 'short');
        return ret(L.sty(v, '좋아! 어디 들어갈 건데? 같이 가자'), true);
      }
      case 'walk': {
        if (Soc.followers().length >= 4) return ret(L.sty(v, '벌써 일행이 많네~ 다음에 같이 가자!'));
        Soc.addFollower(v, 'walk');
        if (partnerOf(v.id) === P) { r.lastDate = day(); r.dates++; addBoredom(r, D.BOREDOM_RULES.date.v, '데이트 동행'); }
        return ret(L.sty(v, '좋아! 어디든 따라갈게'), true);
      }
      case 'invite': {
        p.hosting = v.id;
        v.status.invitedByP = st.time;
        Sim.planRoute(v, { loc: 'home_p_in', x: 1, z: 0.5 });
        v.pendingAct = 'look_around';
        FM.Ev && FM.Ev.onPlayerHost && FM.Ev.onPlayerHost(v);
        return ret(L.sty(v, '초대해 줘서 고마워! 지금 갈게'), true);
      }
      case 'errand': return errandOffer(v);
      case 'errandYes': { clearBalloon(); const q = v.pendingErrand; v.pendingErrand = null; if (q) { addQuest(q); if (q.item && q.giveItem) giveItem(q.item); } return ret(L.sty(v, '고마워! 부탁할게'), true); }
      case 'errandNo': clearBalloon(); v.pendingErrand = null; return ret(L.sty(v, '그래, 다음에 부탁할게'));
      case 'nudge': {
        if (!arg) return ret('누구랑 잘 어울린다고 할까?', false, st.villagers.filter(o => o !== v && canRomance(v.id, o.id)).slice(0, 12).map(o => ({ id: 'nudge', label: o.name, arg: o.id })));
        const o = byId(arg);
        // 플레이어의 부추김: 확률적으로 짝사랑 상태 진입
        const n = tasteMatch(v, o) ? rnd(15, 35) : rnd(5, 15);
        addRomance(v.id, o.id, n, '플레이어의 부추김');
        if (chance(0.3) && F(v.id, o.id).romance < 60 && F(v.id, o.id).romance > 35) addRomance(v.id, o.id, 60 - F(v.id, o.id).romance, '플레이어의 부추김');
        const on = v.crush && v.crush.target === o.id;
        return ret(on ? L.sty(v, `에이, 무슨... ${o.name}? ...(얼굴이 빨개졌다)`) : L.sty(v, `${o.name}? 음... 생각해 본 적 없는데`));
      }
      case 'propose': return Soc.playerPropose(v);
      case 'breakupP': {
        doBreakup(r, 'PERSONALITY_CLASH'); r.exPlayer = true; p.lover = null;
        return ret(L.say(v, 'breakupB', {}, true), true);
      }
      case 'cleanOrder': {
        const room = st.rooms[v.home];
        Sim.scene({ title: '방 청소 (투덜투덜)', actors: { A: v }, steps: [{ say: 'A', text: L.say(v, 'roomCleanOrder', {}, true), t: 3 }, { pose: 'A', p: 'sweep', prop: 'broom', t: 5 }, { do: () => { if (room) { room.trash = []; room.clean = 100; } } }, { emote: 'A', e: '😤' }] });
        addFriend(v.id, P, -1, 0);
        return ret(L.say(v, 'roomCleanOrder', {}, true), true);
      }
      case 'care': return careVisit(v);
      // ---- 짝사랑 코칭 ----
      case 'coach1': {
        clearBalloon();
        const t = v.crush && v.crush.target; if (!t) return ret('...', true);
        return ret('언제, 어디서 고백하게 할까? (시간과 장소를 지정해 주세요)', false, [
          ...D.CONFESS_SPOTS.map(s => ({ id: 'coachSpot', label: `🕕 오늘 18:00 · ${s.name}`, arg: s.id })),
        ]);
      }
      case 'coachSpot': {
        const t = v.crush && v.crush.target; if (!t) return ret('...', true);
        let at = (day() - 1) * 1440 + 18 * 60; if (st.time > at - 20) at += 1440;
        const ap = { type: 'confess', a: v.id, b: t, at, spot: arg, bInvited: false };
        st.appts.push(ap);
        addQuest({ type: 'invite_confess', title: `📣 ${nm(t)}를 ${D.CONFESS_SPOTS.find(s => s.id === arg).name}로 불러내기`, giver: v.id, target: t, appt: ap, spotName: D.CONFESS_SPOTS.find(s => s.id === arg).name, hm: '18시',
          desc: `${nm(t)}에게 찾아가 "18시에 ${D.CONFESS_SPOTS.find(s => s.id === arg).name}(으)로 나와봐!"라고 말해주세요.`, deadline: at });
        v.confidence = clamp((v.confidence || 0) + 25, 0, 100);
        r.coached = day();
        return ret(L.sty(v, '알았어... 해볼게! 떨린다...'), true);
      }
      case 'coach2': {
        clearBalloon();
        const t = v.crush && v.crush.target; if (!t) return ret('...', true);
        v.status.tasteQuest = { target: t, until: st.time + 1440 };
        Sim.log('crush', `🕵️ ${v.name}이(가) ${nm(t)}의 뒤를 몰래 쫓아다니며 취향을 조사하기 시작했어요.`, [v.id, t], 1, { secret: true });
        addQuest({ type: 'taste', title: `🕵️ ${v.name}의 취향 조사`, giver: v.id, target: t, desc: `${v.name}이(가) 하루 동안 ${nm(t)}을(를) 몰래 따라다니며 취향을 조사해요. (자동 진행)`, until: day() + 1 });
        return ret(L.sty(v, '좋아, 몰래몰래 알아볼게!'), true);
      }
      case 'coach3': {
        clearBalloon();
        const t = v.crush && v.crush.target; if (!t) return ret('...', true);
        const item = has(v, 'ROMANTIC') && has(v, 'SHY') ? 'poem_secret' : 'love_letter';
        giveItem(item);
        addQuest({ type: 'secret_letter', title: `💌 비밀 우렁각시: ${nm(t)}의 편지함`, giver: v.id, target: t, item, stage: 'deliver',
          desc: `${v.name}의 ${D.ITEMS[item].name}을(를) ${nm(t)}의 집 편지함(현관 앞)에 몰래 넣고 오세요.` });
        return ret(item === 'poem_secret' ? L.say(v, 'crushPoemAsk', {}, true) : L.sty(v, '이 편지... 몰래 넣어줘. 부탁해!'), true);
      }
      case 'coach4': {
        clearBalloon();
        const t = v.crush && v.crush.target;
        if (t) F(v.id, t).romance = Math.max(0, F(v.id, t).romance - 40); // 설렘 수치 -40, 짝사랑 중단
        endCrush(v);
        return ret(L.sty(v, '...그렇겠지? 그냥 우정이었나 봐'), true);
      }
      case 'coachC': {
        clearBalloon();
        const t = v.crush && v.crush.target;
        if (t) F(v.id, t).romance = 0;                     // 짝사랑 수치 0으로 초기화
        if (v.crush) v.crush.heartbreak_risk = clamp(v.crush.heartbreak_risk + 40, 0, 100);
        endCrush(v);
        v.status.slumpUntil = st.time + 1440 * rint(2, 3);  // 2~3일간 바닷가나 집 안에서 비련의 대사
        v.depression = clamp(v.depression + 20, 0, 100);
        return ret(L.sty(v, '...알았어. 마음 정리할게'), true);
      }
      case 'acceptP': {
        clearBalloon(); endCrush(v);
        r.status = 'DATING'; r.since = day(); r.lastDate = day(); p.lover = v.id;
        Sim.fx('hearts', v);
        Sim.log('couple', `💕 ${v.name}와(과) ${p.name}이(가) 연인이 되었어요!`, [v.id, P], 3, { newsKind: 'couple' });
        return ret(L.say(v, 'acceptGeneric', {}, true));
      }
      case 'declineP': clearBalloon(); F(v.id, P).romance = 30; endCrush(v); v.status.slumpUntil = st.time + 1440; return ret(L.sty(v, '...응, 알겠어'), true);
      // ---- 질투 중재 ----
      case 'jeal1': {
        clearBalloon();
        const d = v.jealousy;
        addQuest({ type: 'jealousy_investigate', title: `🔍 ${nm(d.rival)}의 진짜 마음 알아보기`, giver: v.id, target: d.rival, partner: d.partner, desc: `${nm(d.rival)}에게 가서 ${nm(d.partner)}와(과) 무슨 사이인지 물어보세요.` });
        return ret(L.sty(v, '정말? 부탁할게...'), true);
      }
      case 'jeal2': {
        clearBalloon();
        giveItem('special_gift');
        const d = v.jealousy;
        addQuest({ type: 'jealousy_gift', title: `💝 ${v.name}에게 '특별한 선물' 쥐어주기`, giver: v.id, target: v.id, partner: d.partner, desc: `가방의 '특별한 선물'을 ${v.name}에게 선물하면 ${nm(d.partner)}에게 전달해요.` });
        return ret(L.sty(v, '당당하게...! 알았어!'), true);
      }
      case 'jealWarn': {
        clearBalloon();
        const d = v.jealousy;
        addQuest({ type: 'jealousy_warn', title: `✋ ${nm(d.rival)}에게 경고하기`, giver: v.id, target: d.rival, partner: d.partner, desc: `${nm(d.rival)}에게 "${nm(d.partner)} 건드리지 마"라고 경고하세요.` });
        return ret(L.sty(v, '고마워... 네가 최고야'), true);
      }
      case 'jeal3': {
        clearBalloon();
        const d = v.jealousy;
        v.jealousy.meter = 100;
        if (d.partner !== P && partnerOf(v.id) === d.partner) breakupScene(v.id, d.partner, 'sunset_cliff');
        return ret(L.sty(v, '...그래. 다 끝이야!'), true);
      }
      case 'qInvestigate': {
        // C를 조사하여 단순 친구 관계임을 확인 ➔ A의 질투 수치 -50 차감
        const A = byId(Q.giver);
        const romantic = F(v.id, Q.partner).romance >= 50;
        finishQuest(Q, true, romantic ? `${v.name}은(는) 사실 ${nm(Q.partner)}에게 마음이 있었어요...` : `${v.name}와(과) ${nm(Q.partner)}은(는) 단순 친구 사이였어요! ${A.name}의 질투 -50`);
        if (!romantic && A.jealousy) { A.jealousy.meter = Math.max(0, A.jealousy.meter - 50); A.jealousy.jealousy_meter = A.jealousy.meter; A.jealousy.stage = 'AWARE'; }
        addFriend(Q.giver, P, 3, 8, '오해 해소');
        return ret(romantic ? L.sty(v, `...사실 ${nm(Q.partner)}가 좋긴 해`) : L.sty(v, `${nm(Q.partner)}? 그냥 친구야! 오해하지 말라고 전해줘`));
      }
      case 'qWarn': {
        finishQuest(Q, true, `${v.name}에게 경고했어요`);
        addFriend(v.id, P, -5, -3);
        F(v.id, Q.partner).romance = Math.max(0, F(v.id, Q.partner).romance - 25);
        const A = byId(Q.giver); if (A && A.jealousy) { A.jealousy.meter = Math.max(0, A.jealousy.meter - 35); }
        addFriend(Q.giver, P, 3, 6, '편들어줌');
        return ret(L.sty(v, '뭐, 뭐야... 알았어'));
      }
      case 'qInvite': {
        Q.appt.bInvited = true;
        finishQuest(Q, true, `${v.name}에게 약속 장소를 전했어요. 18:00에 고백 이벤트!`);
        return ret(L.sty(v, `18시에 ${Q.spotName}? 음... 알았어, 갈게`));
      }
      case 'qInvitation': {
        takeItem('invitation');
        Q.invited = Q.invited || [];
        Q.invited.push(v.id);
        const m = st.marriages.find(x => x.marriage_id === Q.marriage);
        if (m) m.prep.invite = Q.invited;
        checkWeddingPrep(Q);
        return ret(L.sty(v, '청첩장이다! 꼭 갈게, 축하해!'));
      }
      case 'qErrand': {
        if (Q.item) takeItem(Q.item);
        const inTime = !Q.deadline || st.time <= Q.deadline;
        // 심부름/퀘스트 성공 +8 / +10 (제한시간 내 완수 시 신뢰도 폭등)
        addFriend(Q.giver, P, D.FRIEND_TRIGGERS.errand.fp, inTime ? D.FRIEND_TRIGGERS.errand.trust * 1.5 : D.FRIEND_TRIGGERS.errand.trust, '심부름');
        if (Q.msgRomance) addRomance(v.id, Q.giver, 5);
        addFriend(v.id, Q.giver, 3, 2);
        p.coins += Q.reward || 0;
        finishQuest(Q, true, `심부름 완료! ${inTime ? '(제한시간 내 — 신뢰도 폭등)' : ''} +${Q.reward || 0}코인`);
        return ret(L.sty(v, `${nm(Q.giver)}가? 고마워!`));
      }
      case 'qLetterCheck': {
        const A = byId(Q.giver);
        const good = F(v.id, Q.giver).romance >= 30 || tasteMatch(v, A);
        addRomance(v.id, Q.giver, good ? 25 : 5, '비밀 편지');
        v.balloon = null;
        finishQuest(Q, true, good ? `${v.name}이(가) 편지에 설렜대요!` : `${v.name}은(는) 누가 보낸 건지 궁금해하고 있어요`);
        return ret(good ? L.sty(v, '누가 보낸 걸까... 두근두근해') : L.sty(v, '편지? 누가 보낸 거지?'));
      }
      case 'qReport': {
        addRomance(v.id, Q.from, 15, '책 속 비밀 편지');
        finishQuest(Q, true, `${v.name}에게 책 속 쪽지를 제보했어요`);
        return ret(L.sty(v, `${nm(Q.from)}가...? 세상에`));
      }
      case 'qWalk': {
        Q.steps = (Q.steps || 0) + 1;
        Sim.startAct(v, 'toddle', { state: 'WALK', pose: 'toddle', dur: 2 });
        v.x += 0.5;
        if (Q.steps >= 3) { v.child.attach[P] = clamp((v.child.attach[P] || 60) + 10, 0, 100); v.child.parenting_satisfaction = clamp(v.child.parenting_satisfaction + 8, 0, 100); finishQuest(Q, true, `${v.name}이(가) 걸음마에 성공했어요! 애착도 상승`); return ret('(아장아장... 세 걸음 성공!) 👣✨'); }
        return ret(`(한 걸음 기어왔다!) ${Q.steps}/3`);
      }
      case 'qFever': {
        takeItem('medicine_kid');
        v.status.sick = false; v.child.parenting_satisfaction = clamp(v.child.parenting_satisfaction + 10, 0, 100);
        finishQuest(Q, true, `${v.name}의 열이 내렸어요!`);
        return ret('(약을 먹고 새근새근 잠들었다) 😴');
      }
      case 'secretLetterDone': return ret('...');
      // ---- 권태기 ----
      case 'bored1': {
        clearBalloon();
        const pt = partnerOf(v.id);
        const rr = pt ? rel(v.id, pt) : null;
        if (rr) { addBoredom(rr, D.BOREDOM_RULES.coach.v, '플레이어 연애 코칭'); const o = byId(pt); if (o) Soc.coupleAct(v, o) || benchDate(v, o, rr, 'STABLE'); }
        return ret(L.sty(v, '...맞아, 요즘 둘이 제대로 놀러 간 적이 없었어. 해볼게!'), true);
      }
      case 'bored2': { clearBalloon(); const pt = partnerOf(v.id); if (pt) { const rr = rel(v.id, pt); rr.boredom = 95; if (pt === P) playerBreakup(v); else scheduleBreakup(rr); } return ret(L.sty(v, '...그래. 오늘 이야기해볼게'), true); }
      // ---- 재회 / 마음 정리 ----
      case 'reunion1': {
        clearBalloon();
        const ex = v.status.ex || (v.balloon && v.balloon.data.ex);
        giveItem('apology_gift');
        addQuest({ type: 'reunion', title: `💞 재회 루트: ${nm(ex)}에게 사과의 선물 전달`, giver: v.id, target: ex, desc: `가방의 '화해의 선물'을 ${nm(ex)}에게 선물하세요.` });
        return ret(L.sty(v, '...응. 한 번만 더 용기 내볼게'), true);
      }
      case 'reunion2': {
        clearBalloon();
        const ex = v.status.ex;
        if (ex) { const rr = rel(v.id, ex); rr.cooldown_until = day(); rr.status = 'NONE'; rr.avoidZone = null; v.status.exUntil = 0; const o = byId(ex); if (o) o.status.exUntil = 0; }
        return ret(L.sty(v, '새 출발... 해볼게. 고마워'), true);
      }
      // ---- 결혼 ----
      case 'marryYes': {
        clearBalloon();
        const pt = partnerOf(v.id);
        if (!homeFor(v.id, pt)) {
          const free = Soc.freePlots('large');
          if (!free.length) return ret('신혼집으로 쓸 2단계 이상 집(대형 획지)이 없어요... 빌라 단지에 빈 부지가 생기면 다시 도와주세요.', true);
          Soc.grantPlot(free[0].id, [v.id, pt]);
        }
        FM.Ev && FM.Ev.proposal ? FM.Ev.proposal(v, byId(pt)) : engage(v.id, pt);
        return ret(L.sty(v, '고마워! 오늘 꼭 청혼할게!'), true);
      }
      case 'marryNo': clearBalloon(); return ret(L.sty(v, '응... 조금만 더 기다려볼게'));
      case 'capsuleYes': { clearBalloon(); FM.Ev && FM.Ev.buryCapsule && FM.Ev.buryCapsule(v); return ret(L.sty(v, '14일 뒤에 같이 파내자! 약속!'), true); }
      case 'capsuleNo': clearBalloon(); return ret(L.sty(v, '아쉽다~ 다음에 꼭!'));
      case 'baby': return babyCare(v, qid);
      default:
        if (FM.Ev && FM.Ev.playerChoose) { const x = FM.Ev.playerChoose(v, id, arg); if (x) return x; }
        return ret('...');
    }
  };
  function releaseWaiters() {
    const st = S();
    for (const o of st.villagers) if (o.status.waitingForPlayer) {
      o.status.waitingForPlayer = false;
      // 대화가 끝나자마자 즉시 플레이어에게 달려와 자기랑 놀자고 고집
      const p = st.player;
      if (o.loc === p.loc) Sim.scene({ title: '같이 놀자!', actors: { A: o }, steps: [{ go: 'A', to: { loc: p.loc, x: p.x + 1, z: p.z + 1 }, run: true, max: 10 }, { say: 'A', text: L.sty(o, '이제 나랑 놀자! 나랑!'), t: 3 }, { emote: 'A', e: '💗' }] });
    }
  }
  function careVisit(v) {
    const st = S();
    addFriend(v.id, P, 6, 8, '간병');
    v.status.cared = (v.status.cared || 0) + 1;
    Sim.fx('hearts', v);
    const q = st.quests.find(x => x.type === 'hospital_care' && x.target === v.id && x.state === 'active');
    if (q) finishQuest(q, true, `${v.name}을(를) 간병했어요. 곧 퇴원할 거예요!`);
    if (v.status.hospital) { v.status.hospital = false; v.stress = 30; v.status.disease = null; Sim.freeUse(v); Sim.dressFor(v, null); if (v.status.hatOverride === 'headband') v.status.hatOverride = null; v.status.bandageUntil = null; Sim.log('medical', `🏥 ${v.name}이(가) 플레이어의 간병 덕분에 퇴원했어요!`, [v.id], 1); }
    if (v.crush && v.crush.target === P || canRomance(v.id, P)) addRomance(v.id, P, 8, '병문안 사과 깎기');
    return { text: L.say(v, 'appleVisit', {}, true).replace('깎아왔어', '깎아줘서 고마워') , close: true, options: [] };
  }
  function babyCare(v, kind) {
    const c = v.child;
    const map = { milk: ['🍼 꿀꺽꿀꺽', 6], rock: ['🧺 흔들흔들...', 4], lullaby: ['🎶 자장자장~', 5], diaper: ['🧷 뽀송뽀송!', 5], hide: ['🙈 까꿍! 꺄르르', 5], playground: ['🛝 신나!', 6], teach: ['🦋 잡았다!', 6] };
    const [txt, n] = map[kind] || ['😊', 2];
    c.parenting_satisfaction = clamp(c.parenting_satisfaction + n, 0, 100);
    c.attach[P] = clamp((c.attach[P] || 60) + n / 2, 0, 100);
    c.env.talk++;
    if (kind === 'playground' || kind === 'teach') c.env.outdoor++;
    if (c.crying) c.crying = false;
    Sim.emote(v, '😊');
    return { text: txt, options: Soc.talkOptions(v) };
  }

  // 선물 주기
  Soc.playerGift = function (v, itemId) {
    const st = S(), p = pl();
    const r = rel(v.id, P);
    const it = D.ITEMS[itemId];
    if (!itemId || !it) return { text: '무엇을 줄까?', options: Object.keys(p.inv).filter(k => D.ITEMS[k] && p.inv[k] > 0 && !D.ITEMS[k].tool).map(k => ({ id: 'gift', label: `${D.ITEMS[k].icon} ${D.ITEMS[k].name} ×${p.inv[k]}`, arg: k })).concat([{ id: 'chat', label: '그만두기' }]) };
    // 고백의 꽃다발 — 플레이어와 주민 간의 직접 연애
    if (it.special === 'confess') return Soc.playerConfess(v);
    if (it.special === 'propose') return Soc.playerPropose(v, itemId);
    // 심부름 물건을 '선물'로 건네도 심부름 완료로 처리
    const qe = Soc.activeQuests().find(q => q.type === 'errand' && q.target === v.id && q.item === itemId);
    if (qe) return Soc.playerChoose(v, 'qErrand:' + qe.id);
    const qf = itemId === 'medicine_kid' && Soc.activeQuests().find(q => q.type === 'kid_fever' && q.target === v.id);
    if (qf) return Soc.playerChoose(v, 'qFever:' + qf.id);
    if (!Soc.stageAtLeast(v.id, P, 'FRIEND') && !['apology_gift', 'apology_letter', 'special_gift', 'love_letter', 'poem_secret', 'medicine_kid'].includes(itemId)) return { text: L.say(v, 'giftAwkward', {}, true), options: Soc.talkOptions(v) };
    takeItem(itemId);
    // 퀘스트 연결 선물
    const q = Soc.activeQuests().find(q => (q.type === 'reunion' || q.type === 'apology') && q.target === v.id && (it.special === 'apology'));
    if (q) return questGift(v, q, itemId);
    const qg = Soc.activeQuests().find(q => q.type === 'jealousy_gift' && q.target === v.id && itemId === 'special_gift');
    if (qg) {
      finishQuest(qg, true, `${v.name}이(가) 특별한 선물을 ${nm(qg.partner)}에게 전달하러 가요`);
      const pt = qg.partner === P ? null : byId(qg.partner);
      if (pt) Sim.scene({ title: '특별한 선물 전달', actors: { A: v, B: pt }, steps: [{ go: 'A', to: { actor: 'B', near: 1.1 }, max: 60 }, { face: 'A', at: 'B' }, { say: 'A', text: L.sty(v, '이거... 너 주려고 준비했어'), t: 3 }, { fx: 'gift', at: 'B' }, { emote: 'B', e: '💕' }],
        onEnd: () => { addRomance(pt.id, v.id, 12); addRomance(v.id, pt.id, 5); const rr = rel(v.id, pt.id); addBoredom(rr, -20); if (v.jealousy) v.jealousy.meter = Math.max(0, v.jealousy.meter - 30); } });
      return { text: L.sty(v, '고마워! 당당하게 전해볼게!'), close: true, options: [] };
    }
    const like = (it.tags || []).some(t => v.giftLikes.includes(t));
    const dislike = (it.tags || []).some(t => v.giftDislikes.includes(t));
    let text;
    if (like) { addFriend(v.id, P, rint(D.FRIEND_TRIGGERS.giftLike.fp[0], D.FRIEND_TRIGGERS.giftLike.fp[1]), D.FRIEND_TRIGGERS.giftLike.trust, '선호 선물'); text = L.say(v, 'giftLike'); Sim.emote(v, '💖'); }
    else if (dislike) { addFriend(v.id, P, D.FRIEND_TRIGGERS.giftDislike.fp, 0, '비선호 선물'); text = L.say(v, 'giftDislike'); Sim.emote(v, '💧'); }
    else { addFriend(v.id, P, 2, 1, '선물'); text = L.say(v, 'giftNeutral'); }
    if ((it.tags || []).includes('romance') && canRomance(v.id, P)) addRomance(v.id, P, like ? 5 : 2, '로맨틱한 선물');
    if (it.stamina && v.hunger > 30) v.hunger = Math.max(0, v.hunger - it.stamina);
    if (v.child) { v.child.env.talk++; v.child.parenting_satisfaction = clamp(v.child.parenting_satisfaction + 2, 0, 100); }
    // 목격: 라이벌이 애정 대상에게 선물 전달
    observe('rivalGift', st.player, v);
    return { text, options: Soc.talkOptions(v) };
  };
  function questGift(v, q, itemId) {
    const st = S();
    if (q.type === 'reunion') {
      finishQuest(q, true, `${v.name}에게 사과의 선물을 전달했어요 — 재회 이벤트!`);
      const A = byId(q.giver);
      Sim.scene({ title: '💞 REUNION_EVENT', major: true, bgm: 'romance', actors: { A, B: v }, steps: [
        { par: [{ go: 'A', to: { place: 'plaza', spot: 'fountain' } }, { go: 'B', to: { place: 'plaza', spot: 'fountain', dx: 1.3 } }] }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
        { say: 'A', text: '미안해... 내가 이기적이었어. 다시 시작할 수 있을까?', t: 3.5 }, { say: 'B', text: '...나도 보고 싶었어.', t: 3 }, { fx: 'hearts', at: 'A' },
      ], onEnd: () => {
        const r = rel(A.id, v.id);
        r.status = 'DATING'; r.boredom = 0; r.cooldown_until = 0; r.since = day(); r.lastDate = day(); r.avoidZone = null;   // 관계 [DATING]으로 복구 (권태기 수치 0 리셋)
        A.status.exUntil = 0; v.status.exUntil = 0;
        Sim.log('couple', `💞 ${A.name}와(과) ${v.name}이(가) 다시 연인이 되었어요! (재회)`, [A.id, v.id], 3, { newsKind: 'reunion' });
      } });
      return { text: L.sty(v, '...이걸 나한테? ...잠깐 얘기 좀 하자'), close: true, options: [] };
    }
    // 오해와 사과 퀘스트 — 사과 선물을 전달받은 NPC가 마음을 풀고 신뢰도 +20 폭등
    const r = rel(v.id, q.giver);
    r.misunderstanding = null;
    addFriend(v.id, q.giver, 5, 20, '사과');
    addFriend(v.id, P, 3, 5, '중재');
    finishQuest(q, true, `${v.name}이(가) 마음을 풀었어요! (신뢰도 +20)`);
    void itemId; void st;
    return { text: L.say(v, 'apologyThanks', {}, true), options: Soc.talkOptions(v) };
  }

  // 플레이어 고백 (고백의 꽃다발)
  Soc.playerConfess = function (v) {
    const st = S(), p = pl();
    const r = rel(v.id, P);
    if (!canRomance(v.id, P)) return { text: L.sty(v, '에... 이건 받을 수 없어'), options: Soc.talkOptions(v) };
    takeItem('bouquet');
    // 목격한 짝사랑 주민: 질투/상심 모드
    for (const o of st.villagers) if (o !== v && o.crush && o.crush.target === P && o.loc === p.loc && Math.hypot(o.x - p.x, o.z - p.z) < 18) {
      F(o.id, P).romance = Math.max(0, F(o.id, P).romance - 30); syncCrush(o);
      Sim.emote(o, '💔', 4); addJealousy(o, v.id, 50, '고백의 꽃다발 목격');
      Sim.log('jealous', `💔 ${o.name}이(가) 플레이어가 ${v.name}에게 꽃다발을 주는 걸 목격했어요...`, [o.id, v.id], 1);
    }
    // 연애 시작 조건: 호감도 80 이상 + 설렘 지수 70 이상
    // 분수대 소원 동전: 24시간 동안 고백 성공률 20% 상승 (조건 완화)
    const wish = (st.wishes[P] || 0) > st.time ? 0.8 : 1;
    if (affection(v.id, P) >= 80 * wish && F(v.id, P).romance >= 70 * wish) {
      r.status = 'DATING'; r.since = day(); r.lastDate = day(); p.lover = v.id;
      endCrush(v);
      Sim.fx('hearts', v);
      Sim.log('couple', `💕 ${p.name}와(과) ${v.name}이(가) 연인이 되었어요!`, [P, v.id], 3, { newsKind: 'couple' });
      return { text: L.say(v, 'acceptGeneric', {}, true) + ' 💕', options: [{ id: 'petname', label: '💕 애칭 정하기' }, { id: 'bye', label: '👋' }] };
    }
    F(v.id, P).romance = clamp(F(v.id, P).romance + 5, 0, 100);
    return { text: L.say(v, 'rejectGeneric', {}, true) + ` (호감도 ${Math.round(affection(v.id, P))}/80 · 설렘 ${Math.round(F(v.id, P).romance)}/70)`, options: Soc.talkOptions(v) };
  };
  // 플레이어 ↔ 주민 프러포즈 반응
  Soc.playerPropose = function (v, itemId) {
    const p = pl();
    const r = rel(v.id, P);
    const item = itemId || (p.inv.ring ? 'ring' : p.inv.feather ? 'feather' : null);
    if (!item) return { text: '청혼 징표(약혼반지 또는 청혼의 깃털)가 필요해요.', options: Soc.talkOptions(v) };
    if (r.status !== 'DATING') return { text: L.sty(v, '에? 우린 아직 사귀지도 않잖아...'), options: Soc.talkOptions(v) };
    const okHouse = (p.houseLevel || 1) >= D.MARRIAGE.houseLevel;
    const okDays = day() - r.since >= D.MARRIAGE.minDatingDays;
    const okAff = affection(v.id, P) >= D.MARRIAGE.affection;
    const okRom = F(v.id, P).romance >= D.MARRIAGE.romance;
    if (okHouse && okDays && okAff && okRom) {
      takeItem(item);
      engage(P, v.id, item);
      Sim.fx('hearts', v); Sim.fx('ring', v);
      return { text: L.say(v, 'proposeAccept', {}, true), close: true, options: [] };
    }
    // 거절: 쑥스러워하거나 "아직은 준비가 안 됐어..."라며 아이템을 반납함
    const why = [!okDays && `연애 ${day() - r.since}/${D.MARRIAGE.minDatingDays}일`, !okAff && `호감도 ${Math.round(affection(v.id, P))}/95`, !okRom && `설렘 ${Math.round(F(v.id, P).romance)}/80`, !okHouse && '2단계 이상 증축된 집 필요'].filter(Boolean).join(', ');
    return { text: L.say(v, 'proposeRefuse', {}, true) + ` (아이템을 돌려받았어요 — ${why})`, options: Soc.talkOptions(v) };
  };
  // 플레이어에게 이별 선언 (권태기 100)
  function playerBreakup(v) {
    if (!v) return;
    const st = S();
    const p = st.player;
    Sim.scene({ title: '💔 이별 선언', major: true, bgm: 'piano', actors: { A: v }, steps: [
      { go: 'A', to: { place: 'home_p', spot: 'yard' } }, { say: 'A', text: L.say(v, 'playerBreakup', {}, true), t: 4 }, { emote: 'A', e: '💧', t: 3 }, { go: 'A', to: { home: 'A' }, slow: true },
    ] });
    const r = rel(v.id, P);
    r.nickname[P] = null;                                   // '애칭 해제' 및 '연인 상태 해제'
    doBreakup(r, 'NEGLIGENT'); r.exPlayer = true;
    p.lover = null;
    if (p.spouse === v.id) p.spouse = null;
    Sim.log('breakup', `💔 ${v.name}이(가) 플레이어에게 이별을 선언했어요...`, [v.id, P], 3);
  }
  Soc.playerBreakup = playerBreakup;

  // 심부름 제안
  function errandOffer(v) {
    const st = S();
    const others = st.villagers.filter(o => o !== v && !o.child);
    const t = pick(others);
    if (!t) return { text: L.sty(v, '지금은 괜찮아!'), options: Soc.talkOptions(v) };
    const kind = pick(['deliver', 'fetch']);
    let q;
    if (kind === 'deliver') {
      const item = pick(['cookie', 'rose', 'can', 'book']);
      q = { type: 'errand', title: `📦 ${v.name}의 심부름: ${t.name}에게 ${D.ITEMS[item].name} 전달`, giver: v.id, target: t.id, item, giveItem: true, reward: 150, deadline: st.time + 180, desc: `3시간 안에 ${t.name}에게 ${D.ITEMS[item].name}을(를) 전해주세요. (제한시간 내 완수 시 신뢰도 폭등)` };
    } else {
      const want = pick(v.giftLikes.map(tag => Object.keys(D.ITEMS).find(k => D.ITEMS[k].shop && (D.ITEMS[k].tags || []).includes(tag))).filter(Boolean)) || 'cookie';
      q = { type: 'errand', title: `🛒 ${v.name}의 심부름: ${D.ITEMS[want].name} 가져다주기`, giver: v.id, target: v.id, item: want, reward: D.ITEMS[want].price + 100, deadline: st.time + 240, desc: `4시간 안에 ${D.ITEMS[want].name}을(를) 구해서 ${v.name}에게 가져다주세요.` };
    }
    v.pendingErrand = q;
    Sim.balloon(v, 'errand', 'yellow', { text: L.sty(v, q.desc) });
    return { text: L.sty(v, q.desc.replace(/\(.+\)/, '').trim() + ' 부탁해도 될까'), options: [{ id: 'errandYes', label: '📦 "알겠어, 맡겨줘!"' }, { id: 'errandNo', label: '"지금은 바빠"' }] };
  }

  function checkWeddingPrep(q) {
    const m = S().marriages.find(x => x.marriage_id === q.marriage);
    if (!m) return;
    const p = m.prep;
    if (p.clean >= 3 && (p.invite || []).length >= 5 && p.decorate >= 3 && q.state === 'active') {
      finishQuest(q, true, '결혼식 준비 완료! 결혼식 날 오전 10:00 대성당으로!');
      addFriend(m.spouse_a_id === P ? m.spouse_b_id : m.spouse_a_id, P, 10, 15, '결혼식 준비');
    }
  }
  Soc.checkWeddingPrep = checkWeddingPrep;
})();
