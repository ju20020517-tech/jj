/* =========================================================
 *  관계 유도 & 플레이어 중재 — "다른 주민에 대해 이야기하기"
 *
 *   💘 오작교 공작      "B가 네 사진을 품에 품고 다니더라."
 *   🔥 파벌 · 라이벌 결성 "B가 너보다 ○○ 실력이 훨씬 위라고 말하고 다녀."
 *   🕵️ 비밀 스파이       "B의 방에 몰래 들어가서 다이어리 좀 보고 와!"
 *   😈 이간질 공작       "B가 너 몰래 네 방 가구를 비웃었어."
 *   🎭 위장 연애 제안    "C 질투 나게 B랑 가짜로 사귀어 봐!"
 *   🕊️ 강제 화해 중재    "B가 그때 한 말, 밤새 울면서 후회하고 있대."
 *
 *  성공률(%) = 플레이어-A 친밀도×0.4 + A-B 상성×0.3 + A의 기분×0.3 + 아이템 보정
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, W = FM.Will, D = FM.D;
  const P = 'P';
  const S = () => Sim.get();
  const pl = () => S().player;
  const byId = id => Sim.byId(id);
  const nm = id => Sim.nameOf(id);
  const day = () => Sim.time.day();
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const has = (v, k) => Sim.has(v, k);
  const sty = (v, t) => W.sty(v, FM.josa(t));
  const rel = (a, b) => Soc.rel(a, b);
  const M = (FM.Mediate = {});

  // ---------------------------------------------------------
  // 성공률 공식
  // ---------------------------------------------------------
  function compat(a, b) {
    let c = 45;
    if (Soc.tasteMatch(a, b) || Soc.tasteMatch(b, a)) c += 25;
    if (a.keys.L1 === b.keys.L1) c += 10;
    if (a.likesSpecies && b.look && a.likesSpecies === b.look.species) c += 10;
    c += (rel(a.id, b.id).friendship_point - 40) * 0.35;
    return clamp(c, 0, 100);
  }
  function moodOf(v) {
    const n = FM.Needs ? FM.Needs.of(v) : { frustr: 0 };
    return clamp(100 - (v.stress || 0) * 0.45 - (v.depression || 0) * 0.45 - n.frustr * 0.25, 0, 100);
  }
  const BOOST = { cupid: ['rose', 'love_letter'], reconcile: ['apology_letter', 'rose'], faction: [], spy: [], sabotage: [], fake: ['rose'] };
  function itemBonus(mode, use) {
    const inv = pl().inv;
    const it = (BOOST[mode] || []).find(k => (inv[k] || 0) > 0);
    if (!it) return { b: 0 };
    if (use) { inv[it]--; }
    return { b: 15, item: it };
  }
  M.rate = function (a, b, mode) {
    const f = rel(a.id, P).friendship_point;
    const r = f * 0.4 + compat(a, b) * 0.3 + moodOf(a) * 0.3 + itemBonus(mode).b;
    return clamp(r, 3, 97);
  };
  M.parts = (a, b, mode) => ({ friend: Math.round(rel(a.id, P).friendship_point), compat: Math.round(compat(a, b)), mood: Math.round(moodOf(a)), item: itemBonus(mode).b });

  // 성공 모션: 머리 위 파티클 + B에게 돌진
  function dash(a, b, emo, line, pose) {
    Sim.emote(a, emo, 3);
    Sim.fx(emo === '💘' ? 'hearts' : 'sparkle', a);
    Sim.scene({ title: '돌진', actors: { A: a }, steps: [{ emote: 'A', e: emo, t: 1.2 }, { go: 'A', to: { actor: b.id, near: 1.2 }, max: 90, run: true }, { face: 'A', at: b.id }, { emote: 'A', e: emo, t: 2 }, { say: 'A', text: line, t: 3.5 }].concat(pose ? [{ pose: 'A', p: pose, t: 2.5 }] : []) });
  }
  function fail(a, why) {
    Soc.addFriend(a.id, P, -6, -10, '들킨 공작');
    W.remember(a, 'badmouth', `${pl().name}이(가) 이상한 소문을 퍼뜨리려 했어`);
    if (FM.Needs) FM.Needs.bump(a, 'frustr', 12);
    Sim.emote(a, '😤', 3);
    return { text: sty(a, why || pick(['거짓말 마! 네가 나한테 유언비어 퍼뜨리는 거지?', '...그 말 못 믿겠어. 너 요즘 좀 이상해.', '흥, 누가 속을 줄 알고!'])) };
  }
  const tag = (a, b, mode) => { const r = Math.round(M.rate(a, b, mode)); return `(성공률 ${r}%)`; };

  // ---------------------------------------------------------
  // 공작 모드
  // ---------------------------------------------------------
  const SKILLS = ['원예', '요리', '낚시', '달리기', '노래', '패션 감각', '그림', '춤'];
  const MODES = {
    cupid(a, b) {
      if (!Soc.canRomance(a.id, b.id)) return { text: sty(a, `${b.name}이(가)? 에이, 우린 그런 사이 될 수 없어`) };
      const ok = chance(M.rate(a, b, 'cupid') / 100); itemBonus('cupid', true);
      if (!ok) return fail(a, `${b.name}이(가) 내 사진을...? 거짓말 마! 날 놀리는 거지?`);
      Soc.addRomance(a.id, b.id, 18, '오작교 공작'); Soc.addRomance(b.id, a.id, 6, '오작교 공작');
      W.remember(a, 'saw', `${b.name}이(가) 내 사진을 품고 다닌대`, { about: b.id });
      if (W.setBond && !Soc.partnerOf(a.id)) W.setBond(a.id, b.id, 'CRUSH', true);
      dash(a, b, '💘', sty(a, `저, 저기 ${b.name}... 혹시 내 사진... 아, 아니야! (얼굴이 빨개졌다)`), 'hideFace');
      Sim.log('romance', `💘 오작교 공작 성공! ${a.name}이(가) ${b.name}에게 두근거리기 시작했어요`, [a.id, b.id], 2);
      return { text: sty(a, `${b.name}이(가) 내 사진을...?! 심장이 터질 것 같아!`), close: true };
    },
    faction(a, b) {
      const sk = pick(SKILLS);
      const ok = chance(M.rate(a, b, 'faction') / 100);
      if (!ok) return fail(a, `${b.name}이(가) 그런 말을 했을 리가. ...너 이간질하는 거야?`);
      Soc.addFriend(a.id, b.id, -3, -2, '라이벌 선언');
      if (W.setBond) W.setBond(a.id, b.id, rel(a.id, b.id).friendship_point >= 45 ? 'RIVAL_FRIEND' : 'RIVAL');
      W.remember(a, 'rival', `${b.name}이(가) 나보다 ${sk} 실력이 위라고 했대`, { about: b.id });
      dash(a, b, '🔥', sty(a, `${b.name}! ${sk}(으)로 한판 붙자! 누가 진짜 위인지 보여주지!`), 'point');
      Sim.log('rel', `🔥 파벌 결성! ${a.name}이(가) ${b.name}에게 ${sk} 대결을 신청했어요`, [a.id, b.id], 2);
      return { text: sty(a, `뭐?! ${sk}(이)라면 내가 한 수 위지! 가만 안 둬!`), close: true };
    },
    spy(a, b) {
      const ok = chance(M.rate(a, b, 'spy') / 100);
      if (!ok) return fail(a, '남의 방을 뒤지라고? 그런 짓은 못 해!');
      const home = b.home;
      if (!home || !FM.INTERIORS[home]) return { text: sty(a, `${b.name} 집이 어딘지 모르겠어...`) };
      const caught = chance(0.25 + (has(a, 'ANXIOUS') ? 0.2 : 0) - (has(a, 'SCHOLARLY') ? 0.1 : 0));
      const secret = b.crush && b.crush.target ? `${b.name}이(가) ${nm(b.crush.target)}을(를) 몰래 좋아한대!` : Soc.partnerOf(b.id) ? `${b.name}이(가) ${nm(Soc.partnerOf(b.id))}에게 쓴 연애편지가 서랍 가득이었어!` : `${b.name}의 다이어리엔 "${pick(['오늘도 아무 일 없었다', '나도 언젠가 연애하고 싶다', '몰래 춤 연습 3일째', '비밀 과자 창고 위치: 침대 밑'])}"라고 적혀 있었어`;
      const st = S(); st.spies = st.spies || [];
      st.spies.push({ a: a.id, b: b.id, at: st.time + 90, caught, secret });
      Sim.scene({ title: '비밀 스파이', actors: { A: a }, steps: [{ emote: 'A', e: '🕵️', t: 2 }, { go: 'A', to: { loc: home, x: 0.5, z: 0.3 }, max: 120 }, { pose: 'A', p: 'crouch', t: 6 }, { emote: 'A', e: caught ? '😱' : '🤫', t: 2 }] });
      return { text: sty(a, '맡겨 줘... 쥐도 새도 모르게 다녀올게. (선글라스를 쓴다)'), close: true };
    },
    sabotage(a, b) {
      const ok = chance(M.rate(a, b, 'sabotage') / 100 * (rel(a.id, b.id).friendship_point > 70 ? 0.5 : 1));
      if (!ok) return fail(a);
      Soc.addFriend(a.id, b.id, -15, -12, '이간질');
      const r = rel(a.id, b.id); r.misunderstanding = { by: b.id, until: day() + 3, cause: '플레이어의 이간질' };
      if (r.friendship_point < 20 && W.setBond) W.setBond(a.id, b.id, r.friendship_point < 8 ? 'ENEMY' : 'NEMESIS');
      W.remember(a, 'fight', `${b.name}이(가) 내 가구를 비웃었대`, { about: b.id });
      if (FM.Needs) FM.Needs.bump(a, 'frustr', 20);
      dash(a, b, '💀', sty(a, `${b.name}! 네가 내 가구 비웃었다며?! 실망이야!`), 'argue');
      if (chance(0.25)) { Soc.addFriend(b.id, P, -8, -15); Sim.log('rel', `🗣️ ${b.name}이(가) ${pl().name}의 이간질을 눈치챘어요...`, [b.id, P], 1); }
      return { text: sty(a, `${b.name}이(가) 내 가구를...? 용서 못 해!`), close: true };
    },
    fake(a, b) {
      if (!Soc.canRomance(a.id, b.id) || Soc.partnerOf(a.id) || Soc.partnerOf(b.id)) return { text: sty(a, '그건 좀... 이미 사정이 복잡해') };
      // 질투를 유도할 C 고르기
      const cs = W.others(a).filter(o => o !== b && (Soc.F(o.id, a.id).romance >= 20 || (o.crush && o.crush.target === a.id) || Soc.F(a.id, o.id).romance >= 30)).slice(0, 8);
      const list = cs.length ? cs : W.others(a).filter(o => o !== b).sort((x, y) => Soc.F(y.id, a.id).romance - Soc.F(x.id, a.id).romance).slice(0, 6);
      W.mind(a).pending = { intent: 'fakeDatePick', data: { b: b.id } };
      return { text: sty(a, `${b.name}(이)랑 가짜 연애...? 누구 질투 나게 하려고?`), choices: list.map(o => ({ k: o.id, label: `🎭 ${o.name} 질투 나게 하기 (설렘 ${Math.round(Soc.F(o.id, a.id).romance)})` })), keep: true };
    },
    reconcile(a, b) {
      const r = rel(a.id, b.id);
      if (r.friendship_point >= 60 && !r.misunderstanding && !['ENEMY', 'NEMESIS'].includes(r.bond)) return { text: sty(a, `${b.name}(이)랑? 우리 사이 괜찮은데?`) };
      const ok = chance(M.rate(a, b, 'reconcile') / 100); itemBonus('reconcile', true);
      if (!ok) return fail(a, `${b.name}이(가) 후회한다고? ...그 말 못 믿어. 네가 지어낸 거지?`);
      Soc.addFriend(a.id, b.id, 22, 15, '강제 화해 중재'); Soc.addFriend(b.id, a.id, 18, 12, '강제 화해 중재');
      r.misunderstanding = null; if (['ENEMY', 'NEMESIS'].includes(r.bond)) r.bond = null;
      if (FM.Needs) FM.Needs.bump(a, 'frustr', -30);
      W.remember(a, 'reconcile', `${pl().name} 덕분에 ${b.name}와(과) 화해했어`, { about: b.id });
      Sim.scene({ title: '강제 화해', actors: { A: a, B: b }, force: true, steps: [{ go: 'A', to: { actor: b.id, near: 1.1 }, max: 90, run: true }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' }, { say: 'A', text: sty(a, `${b.name}... 밤새 울었다며. 나도 미안했어`), t: 3.5 }, { emote: 'B', e: '😭', t: 2 }, { say: 'B', text: sty(b, '흐아앙... 나도 미안해!!'), t: 3 }, { par: [{ pose: 'A', p: 'hug', t: 3 }, { pose: 'B', p: 'hug', t: 3 }] }, { fx: 'hearts', at: 'A' }] });
      Sim.log('rel', `🕊️ ${a.name}와(과) ${b.name}이(가) 화해했어요 (플레이어의 강제 중재)`, [a.id, b.id], 2);
      return { text: sty(a, `${b.name}이(가)... 그랬구나. 당장 가 볼게!`), close: true };
    },
  };
  // 위장 연애: C 선택 후 진행
  W.I.fakeDatePick = {
    w: () => 0,
    say: v => ({ text: '...', choices: [] }),
    on: (a, cId, data) => {
      const b = byId(data.b), c = byId(cId); if (!b || !c) return { text: '...' };
      const ok = chance(M.rate(a, b, 'fake') / 100 * (Soc.F(b.id, a.id).romance > 10 || rel(a.id, b.id).friendship_point > 40 ? 1 : 0.6));
      if (!ok) return fail(a, `${b.name}이(가) 그런 연기를 해 줄 리 없잖아. 괜한 소리 마.`);
      const st = S(); st.fakes = st.fakes || [];
      st.fakes.push({ a: a.id, b: b.id, c: c.id, until: st.time + 1440 * 2, day: day() });
      Soc.addFriend(a.id, b.id, 6, 4, '위장 연애 작전');
      Soc.addRomance(c.id, a.id, 6, '질투'); if (FM.Needs) FM.Needs.bump(c, 'possess', 40);
      Sim.scene({ title: '위장 연애', actors: { A: a, B: b }, force: true, steps: [{ go: 'A', to: { actor: b.id, near: 0.8 }, max: 90 }, { face: 'A', at: 'B' }, { say: 'A', text: sty(a, '(속삭이며) 연기 시작이야. 자연스럽게!'), t: 3 }, { say: 'B', text: sty(b, '어, 어어... 자기야~ 하하...'), t: 3 }, { emote: 'B', e: '💦', t: 2 }, { par: [{ pose: 'A', p: 'cute', t: 3 }, { pose: 'B', p: 'cute', t: 3 }] }] });
      Sim.log('rel', `🎭 ${a.name}와(과) ${b.name}이(가) 갑자기 커플 행세를 시작했어요... ${c.name}의 표정이 심상치 않아요`, [a.id, b.id, c.id], 2);
      return { text: sty(a, `좋아, ${c.name}이(가) 보는 앞에서 제대로 보여주지! 후후`), close: true };
    },
  };

  // 메뉴 등록 (맨 위에 '공작' 묶음)
  const NEW = [['cupid', '💘 오작교 공작 — "○○가 네 사진을 품고 다니더라"'], ['faction', '🔥 라이벌 결성 — "○○가 너보다 실력이 위래"'], ['spy', '🕵️ 비밀 스파이 — "○○ 다이어리 좀 보고 와!"'], ['sabotage', '😈 이간질 공작 — "○○가 네 가구를 비웃었어"'], ['fake', '🎭 위장 연애 — "누구 질투 나게 가짜로 사귀어 봐"'], ['recon2', '🕊️ 강제 화해 — "○○가 밤새 울면서 후회한대"']];
  W.IND.unshift(...NEW);
  W.indRate = (a, b, mode) => { const k = mode === 'recon2' ? 'reconcile' : mode; return MODES[k] ? ` · 성공률 ${Math.round(M.rate(a, b, k))}%` : ''; };
  for (const [k] of NEW) W.indExtra[k] = (a, b) => (MODES[k === 'recon2' ? 'reconcile' : k])(a, b);
  M.MODES = MODES;

  // ---------------------------------------------------------
  // 진행 중인 공작 처리 (스파이 보고 · 위장 연애 결말)
  // ---------------------------------------------------------
  let acc = 0;
  const origTick = Soc.tick;
  Soc.tick = function (dtR, dMin) {
    origTick(dtR, dMin);
    acc += dMin; if (acc < 15) return; acc = 0;
    try {
      const st = S();
      for (const sp of (st.spies || []).slice()) {
        if (st.time < sp.at) continue;
        st.spies.splice(st.spies.indexOf(sp), 1);
        const a = byId(sp.a), b = byId(sp.b); if (!a || !b) continue;
        if (sp.caught) {
          Soc.addFriend(b.id, a.id, -20, -25, '방을 뒤짐'); if (W.setBond) W.setBond(a.id, b.id, 'NEMESIS');
          Sim.log('rel', `🚨 ${a.name}이(가) ${b.name}의 방을 몰래 뒤지다 딱 걸렸어요!`, [a.id, b.id], 2);
          W.remember(b, 'fight', `${a.name}이(가) 내 방을 뒤졌어`, { about: a.id });
          FM.bus.emit('toast', `🚨 스파이 작전 실패! ${a.name}이(가) ${b.name}에게 들켰어요`);
        } else {
          st.mail.push({ from: a.id, day: day(), text: FM.josa(`🕵️ [비밀 보고서] 임무 완료. ${b.name}의 방에서 알아낸 것: ${sp.secret} (이 편지는 읽은 후 태워 줘)`), kind: 'spy' });
          Soc.addFriend(a.id, P, 3, 4, '비밀 공유');
          FM.bus.emit('toast', `🕵️ ${a.name}의 스파이 보고서가 우편함에 도착했어요!`); FM.bus.emit('mail', {});
        }
      }
      for (const f of (st.fakes || []).slice()) {
        const a = byId(f.a), b = byId(f.b), c = byId(f.c);
        if (!a || !b || !c) { st.fakes.splice(st.fakes.indexOf(f), 1); continue; }
        // C가 근처에서 보면 질투 폭발
        if (c.loc === a.loc && Math.hypot(c.x - a.x, c.z - a.z) < 8 && !f.seen) { f.seen = true; Soc.addRomance(c.id, a.id, 10, '위장 연애 목격'); if (FM.Needs) FM.Needs.bump(c, 'possess', 35); Sim.emote(c, '💢', 3); }
        if (st.time < f.until) continue;
        st.fakes.splice(st.fakes.indexOf(f), 1);
        const cRom = Soc.F(c.id, a.id).romance, abRom = Soc.F(a.id, b.id).romance + Soc.F(b.id, a.id).romance;
        if (cRom >= 50 && Soc.canRomance(c.id, a.id) && !Soc.partnerOf(c.id) && chance(0.6)) {
          Soc.runConfession && Soc.runConfession(c, a, 'fountain', { force: true });
          Sim.log('rel', `🎭➡️💌 위장 연애 작전 대성공! 질투에 불탄 ${c.name}이(가) ${a.name}에게 고백하러 달려가요`, [c.id, a.id], 2);
        } else if (abRom >= 70 && chance(0.5)) {
          const r = rel(a.id, b.id); r.status = 'DATING'; r.since = day(); r.lastDate = day(); r.boredom = 0;
          Sim.log('couple', `💕 연기가 진심이 됐어요! ${a.name}와(과) ${b.name}이(가) 진짜 연인이 되었어요`, [a.id, b.id], 3);
        } else {
          Soc.addFriend(c.id, a.id, -10, -12, '가짜 연애 들통');
          Sim.log('rel', `🎭💥 위장 연애가 들통났어요! ${c.name}이(가) ${a.name}에게 크게 실망했어요`, [c.id, a.id], 2);
        }
      }
    } catch (e) { console.error('mediate', e); }
  };
})();
