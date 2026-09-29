/* =========================================================
 *  관계 드라마 & 성격 기반 자율 의지
 *   · 과거사(백스토리): 옛친구 · 옛 연인 · 원수 · 라이벌을 섬 시작 때 몇 쌍 심어둠
 *   · 드라마 감지: 삼각관계(연적) · 사각관계 · 바람(비밀 연애) → 뉴스 · 대화 · 사건
 *   · 자율 의지: 주민이 성격과 관계에 따라 스스로 목표를 정해 움직임
 *       짝사랑에게 다가가기 · 연인 만나기 · 절친과 놀기 · 라이벌 도발 · 원수 노려보기/피하기
 *       옛 연인 마주침(어색함/재회) · 옛친구 추억 · 몰래 만나기(바람) · 목격과 폭로
 *   · 대화 의도 · 관계 유도 메뉴 확장 · 🕸️ 관계도
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, D = FM.D, Sim = FM.Sim, Soc = FM.Soc, W = FM.Will;
  const P = 'P';
  const S = () => Sim.get();
  const day = () => Sim.time.day();
  const hour = () => Sim.time.hour();
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const has = (v, k) => Sim.has(v, k);
  const byId = id => Sim.byId(id);
  const nm = id => Sim.nameOf(id);
  const rel = (a, b) => Soc.rel(a, b);
  const rom = (a, b) => Soc.F(a, b).romance;
  const sty = (v, t) => W.sty(v, t);
  const alive = () => S().villagers.filter(v => !v.child && !v.staff && !v.visitor);
  const DR = (FM.Drama = {});
  const st = () => { const s = S(); return s.drama || (s.drama = { seeded: false, affairs: [], tri: {}, sq: {}, met: {} }); };

  Object.assign(W.BONDS, { ENEMY: '☠️ 원수', OLD_FRIEND: '📼 옛친구', EX_LOVER: '💔 옛 연인', RIVAL_LOVE: '⚔️ 연적', AFFAIR: '🔥 비밀 연애' });

  // ---------------------------------------------------------
  // 과거사 심기
  // ---------------------------------------------------------
  const HIST = {
    OLD_FRIEND: ['어릴 적 같은 동네에서 자란 소꿉친구', '학교 다닐 때 둘도 없는 단짝이었지만 이사로 연락이 끊긴 사이', '예전에 같은 밴드를 했던 동료', '할머니 댁 옆집에 살던 여름방학 친구'],
    EX_LOVER: ['장거리 연애 끝에 헤어진 사이', '사소한 오해가 쌓여 이별한 사이', '한쪽이 먼저 떠나버린 첫사랑', '결혼 직전까지 갔다가 파혼한 사이'],
    ENEMY: ['요리 대회에서 부정행위 의혹으로 크게 싸운 사이', '빌려간 돈을 갚지 않아 원수가 된 사이', '짝사랑을 빼앗겼다고 생각하는 사이', '가게 자리를 두고 다툰 뒤 말도 안 섞는 사이', '어릴 때 장난이 큰 사고로 번져 앙금이 남은 사이'],
    RIVAL: ['매번 같은 대회에서 1, 2등을 다투는 사이', '누가 섬 최고 인기인인지 겨루는 사이'],
  };
  function seedBackstory() {
    const d = st(); if (d.seeded) return; d.seeded = true;
    const vs = alive(); if (vs.length < 4) return;
    const used = new Set();
    const pair = (ok) => {
      for (let k = 0; k < 40; k++) { const a = pick(vs), b = pick(vs); if (a === b || used.has(a.id + b.id) || used.has(b.id + a.id) || rel(a.id, b.id).bond) continue; if (ok && !ok(a, b)) continue; used.add(a.id + b.id); return [a, b]; }
      return null;
    };
    const set = (a, b, kind, extra) => { const r = rel(a.id, b.id); r.bond = kind; r.history = pick(HIST[kind]); r.bondDay = day(); Object.assign(r, extra || {}); return r; };
    for (let i = 0; i < 2; i++) { const p = pair(); if (p) { set(p[0], p[1], 'OLD_FRIEND'); Soc.addFriend(p[0].id, p[1].id, 18, 25); } }
    for (let i = 0; i < 2; i++) {
      const p = pair((a, b) => Soc.canRomance(a.id, b.id) && !Soc.partnerOf(a.id) && !Soc.partnerOf(b.id));
      if (p) { const r = set(p[0], p[1], 'EX_LOVER', { status: 'EX', exSince: day() - 30, cooldown_until: 0, breakup_cause: 'PAST' }); Soc.F(p[0].id, p[1].id).romance = rnd(10, 55); Soc.F(p[1].id, p[0].id).romance = rnd(10, 55); void r; }
    }
    { const p = pair(); if (p) { set(p[0], p[1], 'ENEMY'); const r = rel(p[0].id, p[1].id); r.friendship_point = 4; r.trust_level = 3; } }
    { const p = pair((a, b) => a.keys.L4 === b.keys.L4 || (has(a, 'ATHLETIC') && has(b, 'ATHLETIC')) || has(a, 'PASSIONATE')); if (p) set(p[0], p[1], 'RIVAL'); }
  }
  DR.seed = seedBackstory;

  // ---------------------------------------------------------
  // 드라마 감지 (삼각 · 사각 · 바람)
  // ---------------------------------------------------------
  const TEMPT = v => 0.15 + (has(v, 'ROMANTIC') ? 0.15 : 0) + (has(v, 'PASSIONATE') ? 0.12 : 0) + (has(v, 'PRANKSTER') ? 0.1 : 0) + (has(v, 'EXTROVERT') ? 0.08 : 0) - (has(v, 'FORMAL') ? 0.12 : 0) - (has(v, 'DILIGENT') ? 0.1 : 0) - (has(v, 'SHY') ? 0.08 : 0);
  const affairOf = id => st().affairs.find(a => !a.over && (a.a === id || a.b === id));
  DR.affairOf = affairOf;
  function startAffair(x, z, why) {
    const partner = Soc.partnerOf(x.id); if (!partner || partner === z.id || affairOf(x.id)) return null;
    const af = { a: x.id, b: z.id, partner, since: day(), meets: 0, exposed: false, over: false, known: false };
    st().affairs.push(af);
    const r = rel(x.id, z.id); r.bond = 'AFFAIR'; r.bondDay = day();
    Sim.log('affair', `🔥 ${x.name}이(가) ${nm(partner)} 몰래 ${z.name}와(과) 가까워지고 있어요... (비밀)`, [x.id, z.id], 1, { secret: true });
    W.remember(x, 'affair', `${z.name}를 몰래 만나기 시작했어`);
    return af;
  }
  DR.startAffair = startAffair;
  function detect() {
    const d = st(), vs = alive();
    // 삼각관계: 한 사람을 두 명이 좋아함 (또는 연인 + 짝사랑)
    for (const t of vs.concat([{ id: P, name: S().player.name }])) {
      const fans = vs.filter(a => a.id !== t.id && rom(a.id, t.id) >= 45);
      const pt = t.id === P ? S().player.lover : Soc.partnerOf(t.id);
      const inTri = fans.filter(a => a.id !== pt);
      if (pt && inTri.length) for (const a of inTri) {
        const k = [pt, a.id].sort().join('~') + '@' + t.id; if (d.tri[k]) continue;
        d.tri[k] = { kind: 'couple', a: a.id, b: pt, t: t.id, day: day() };
        rel(a.id, pt === P ? a.id : pt).bond !== 'ENEMY' && pt !== P && (rel(a.id, pt).bond = 'RIVAL_LOVE');
        Sim.log('triangle', `🔺 ${a.name}이(가) 연인이 있는 ${nm(t.id)}에게 마음을 품었어요 — ${nm(pt)}와(과) 연적이 됐어요!`, [a.id, t.id, pt], 2);
      }
      if (fans.length >= 2) for (let i = 0; i < fans.length; i++) for (let j = i + 1; j < fans.length; j++) {
        const a = fans[i], b = fans[j]; if (a.id === pt || b.id === pt) continue;
        const k = [a.id, b.id].sort().join('~') + '@' + t.id; if (d.tri[k]) continue;
        d.tri[k] = { kind: 'rivals', a: a.id, b: b.id, t: t.id, day: day() };
        rel(a.id, b.id).bond = 'RIVAL_LOVE';
        Sim.log('triangle', `🔺 삼각관계! ${a.name}와(과) ${b.name}이(가) 둘 다 ${nm(t.id)}을(를) 좋아해요`, [a.id, b.id, t.id], 2);
      }
    }
    // 사각관계: 두 커플이 서로 엇갈린 마음 / 4명 짝사랑 사슬
    const couples = [];
    for (const v of vs) { const p = Soc.partnerOf(v.id); if (p && p !== P && v.id < p) couples.push([v.id, p]); }
    for (let i = 0; i < couples.length; i++) for (let j = i + 1; j < couples.length; j++) {
      const [a, b] = couples[i], [c, e] = couples[j];
      const cross = [[a, c], [a, e], [b, c], [b, e], [c, a], [c, b], [e, a], [e, b]].filter(([x, y]) => rom(x, y) >= 45);
      if (cross.length >= 2) { const k = [a, b, c, e].sort().join('~'); if (!d.sq[k]) { d.sq[k] = { kind: 'swap', ids: [a, b, c, e], day: day() }; Sim.log('triangle', `🔷 사각관계! ${nm(a)}♥${nm(b)} 커플과 ${nm(c)}♥${nm(e)} 커플 사이에 엇갈린 마음이...`, [a, b, c, e], 2); } }
    }
    const best = id => { let top = null, tv = 45; for (const o of vs) if (o.id !== id && rom(id, o.id) > tv) { tv = rom(id, o.id); top = o.id; } return top; };
    for (const a of vs) {
      const b = best(a.id), c = b && best(b), e = c && best(c);
      if (b && c && e && new Set([a.id, b, c, e]).size === 4 && best(e) !== a.id) {
        const k = [a.id, b, c, e].join('>'); const ks = [a.id, b, c, e].sort().join('~');
        if (!d.sq[ks]) { d.sq[ks] = { kind: 'chain', ids: [a.id, b, c, e], day: day() }; Sim.log('triangle', `🔷 엇갈린 사각 짝사랑: ${nm(a.id)} → ${nm(b)} → ${nm(c)} → ${nm(e)}`, [a.id, b, c, e], 2); }
        void k;
      }
    }
    // 바람: 연인이 있는데 다른 사람에게 강하게 끌림 + 권태/성격
    for (const x of vs) {
      const pt = Soc.partnerOf(x.id); if (!pt || affairOf(x.id)) continue;
      const bored = (rel(x.id, pt).boredom || 0) / 100;
      for (const z of vs) {
        if (z === x || z.id === pt || !Soc.canRomance(x.id, z.id)) continue;
        if (rom(x.id, z.id) >= 55 && rom(z.id, x.id) >= 35 && chance(clamp(TEMPT(x) + bored * 0.4, 0.02, 0.8) * 0.3)) { startAffair(x, z); break; }
      }
    }
  }
  DR.detect = detect;

  // ---------------------------------------------------------
  // 폭로
  // ---------------------------------------------------------
  function expose(af, by) {
    if (af.exposed || af.over) return;
    af.exposed = true; af.known = true;
    const x = byId(af.a), z = byId(af.b), pt = af.partner === P ? null : byId(af.partner);
    const r = rel(af.a, af.partner);
    Sim.log('affair', `💥 바람 들통! ${nm(af.a)}이(가) ${nm(af.partner)} 몰래 ${nm(af.b)}을(를) 만나 온 사실이 ${by ? nm(by) + '에 의해 ' : ''}드러났어요!`, [af.a, af.b, af.partner], 3, { newsKind: 'breakup' });
    if (pt && x && !x.sceneId && !pt.sceneId) {
      Sim.scene({ title: '바람 들통', major: true, actors: { A: pt, B: x }, steps: [
        { go: 'A', to: { actor: 'B', near: 1.1 }, run: true, max: 60 }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
        { say: 'A', text: sty(pt, `${nm(af.b)}랑... 몰래 만났다며? 어떻게 나한테 이럴 수 있어!`), t: 3 }, { emote: 'A', e: '💢' },
        { say: 'B', text: sty(x, '미, 미안해... 그게...'), t: 2.5 }, { pose: 'A', p: 'cry', t: 2.5 }, { emote: 'B', e: '💧' },
        { say: 'A', text: sty(pt, '우린 끝이야.'), t: 2.5 },
      ], onEnd: () => {
        Soc.doBreakup(r, 'CHEATING');
        const e1 = rel(af.partner, af.b); e1.bond = 'ENEMY'; e1.history = `${nm(af.a)}를 빼앗아 간 사이`; e1.friendship_point = Math.min(e1.friendship_point, 5);
        Soc.addFriend(af.partner, af.a, -30, -50);
        // 소문을 들은 주민들의 시선
        for (const o of alive()) if (o.id !== af.a && o.id !== af.partner && o.id !== af.b && chance(0.5)) Soc.addFriend(o.id, af.a, -4, -6);
        // 바람 상대와 이어지거나, 둘 다 외톨이가 되거나
        if (rom(af.b, af.a) >= 55 && chance(0.5)) { const rr = rel(af.a, af.b); rr.status = 'DATING'; rr.since = day(); rr.bond = null; Sim.log('couple', `💘 결국 ${nm(af.a)}와(과) ${nm(af.b)}이(가) 공개 연애를 시작했어요...`, [af.a, af.b], 2); }
        else { Soc.F(af.b, af.a).romance *= 0.4; rel(af.a, af.b).bond = null; }
        af.over = true;
      } });
    } else { Soc.doBreakup(r, 'CHEATING'); af.over = true; }
  }
  DR.expose = expose;

  // ---------------------------------------------------------
  // 자율 의지 — 성격 · 관계로 목표를 고르고 움직임
  // ---------------------------------------------------------
  const busy = v => v.sceneId || v.talkingToPlayer || v.child || v.status.hospital || (v.act && ['sleep', 'work_desk', 'anchor', 'staff', 'class', 'hospital'].includes(v.act.id)) || v.following || (Sim.asleep && Sim.asleep(v, hour()));
  const nearby = (v, r = 30) => alive().filter(o => o !== v && o.loc === v.loc && !busy(o) && (v.loc !== 'island' || Math.hypot(o.x - v.x, o.z - v.z) < r));
  const P_WILL = v => 0.18 + (has(v, 'EXTROVERT') ? 0.1 : 0) + (has(v, 'PASSIONATE') ? 0.08 : 0) + (has(v, 'BUSYBODY') ? 0.08 : 0) + (has(v, 'CURIOUS') ? 0.05 : 0) - (has(v, 'LAZY') ? 0.08 : 0) - (has(v, 'SLOTH') ? 0.08 : 0) - (has(v, 'INTROVERT') ? 0.05 : 0);
  const say = (v, t) => sty(v, t);
  const GOALS = {
    crush: {
      w: (v, near) => { const t = near.filter(o => Soc.canRomance(v.id, o.id) && Soc.partnerOf(v.id) !== o.id && rom(v.id, o.id) >= 35).sort((a, b) => rom(v.id, b.id) - rom(v.id, a.id))[0]; return t ? [3 + rom(v.id, t.id) / 25, t] : null; },
      run: (v, t) => {
        if (has(v, 'SHY') || has(v, 'ANXIOUS') || has(v, 'INTROVERT')) {
          Sim.scene({ title: '몰래 바라보기', actors: { A: v }, steps: [{ go: 'A', to: { actor: t.id, near: 5 }, max: 40 }, { face: 'A', at: t.id }, { pose: 'A', p: 'hideFace', t: 3 }, { emote: 'A', e: '💗' }, { say: 'A', text: say(v, `(${t.name}... 오늘도 멋있다)`), t: 2.5 }] });
          Soc.addRomance(v.id, t.id, 2); return `💗 ${v.name}이(가) 멀리서 ${t.name}을(를) 몰래 바라봐요`;
        }
        const gift = has(v, 'ROMANTIC') || chance(0.3);
        Sim.scene({ title: '다가가기', actors: { A: v, B: t }, steps: [{ go: 'A', to: { actor: 'B', near: 1.1 }, run: has(v, 'PASSIONATE'), max: 50 }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
          { say: 'A', text: say(v, gift ? `${t.name}, 이거... 너 주려고 꺾어 왔어` : `${t.name}! 오늘 뭐 해? 같이 있을래?`), t: 2.6 }, gift ? { fx: 'flower', at: 'B' } : { wait: 0.2 },
          { say: 'B', text: () => rom(t.id, v.id) > 40 ? sty(t, '헤헤... 고마워') : sty(t, '어? 응...'), t: 2 }, { emote: 'B', e: rom(t.id, v.id) > 40 ? '💗' : '😅' }],
          onEnd: () => { Soc.addRomance(t.id, v.id, gift ? rnd(4, 9) : rnd(2, 6), '다가옴'); Soc.addFriend(v.id, t.id, 3, 2); } });
        return null;
      },
    },
    lover: {
      w: (v, near) => { const p = Soc.partnerOf(v.id); const o = near.find(x => x.id === p); return o ? [3.5, o] : null; },
      run: (v, o) => { Soc.coupleAct(v, o); return null; },
    },
    bestie: {
      w: (v, near) => { const o = near.filter(x => ['BESTIE', 'OLD_FRIEND', 'SIBLING', 'BUDDY', 'HOBBY'].includes(rel(v.id, x.id).bond) || rel(v.id, x.id).friendship_point >= 70)[0]; return o ? [2.5 + (has(v, 'EXTROVERT') ? 1 : 0), o] : null; },
      run: (v, o) => { Sim.scene({ title: '절친 찾아가기', actors: { A: v }, steps: [{ go: 'A', to: { actor: o.id, near: 1.3 }, run: true, max: 50 }, { emote: 'A', e: '😆' }], onEnd: () => Soc.startChat(v, o) }); return null; },
    },
    rival: {
      w: (v, near) => { const o = near.find(x => ['RIVAL', 'RIVAL_FRIEND', 'RIVAL_LOVE'].includes(rel(v.id, x.id).bond)); return o ? [2.2 + (has(v, 'PASSIONATE') || has(v, 'ATHLETIC') ? 1.5 : 0), o] : null; },
      run: (v, o) => {
        const love = rel(v.id, o.id).bond === 'RIVAL_LOVE';
        const lines = love ? [`${o.name}, 나 절대 안 물러나`, `누가 먼저 마음을 얻나 보자`] : [`${o.name}! 오늘도 승부다!`, `이번엔 내가 이긴다, ${o.name}!`];
        Sim.scene({ title: love ? '연적 신경전' : '라이벌 도발', actors: { A: v, B: o }, steps: [{ go: 'A', to: { actor: 'B', near: 1.3 }, max: 50 }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' }, { say: 'A', text: say(v, pick(lines)), t: 2.4 }, { par: [{ emote: 'A', e: '⚡' }, { emote: 'B', e: '💢' }] }, { say: 'B', text: sty(o, love ? '흥, 두고 봐' : '웃기지 마!'), t: 2 },
          ...(love ? [] : [{ par: [{ go: 'A', to: { actor: 'B', near: 8, ang: 1 }, run: true }, { go: 'B', to: { actor: 'A', near: 8, ang: 2 }, run: true }] }, { emote: chance(0.5) ? 'A' : 'B', e: '🏆' }])],
          onEnd: () => { Soc.addFriend(v.id, o.id, love ? -2 : 2, 1); } });
        return love ? `⚔️ 연적 ${v.name}와(과) ${o.name}이(가) 불꽃 튀는 신경전을 벌였어요` : `🏁 라이벌 ${v.name}이(가) ${o.name}에게 도전장을 내밀었어요`;
      },
    },
    enemy: {
      w: (v, near) => { const o = near.find(x => ['ENEMY', 'NEMESIS'].includes(rel(v.id, x.id).bond)); return o ? [3, o] : null; },
      run: (v, o) => {
        if (has(v, 'INTROVERT') || has(v, 'SHY') || has(v, 'ANXIOUS')) { Sim.scene({ title: '원수 피하기', actors: { A: v }, steps: [{ face: 'A', at: o.id }, { emote: 'A', e: '😰' }, { go: 'A', to: { actor: o.id, near: 16 }, run: true, max: 30 }] }); return `😰 ${v.name}이(가) ${o.name}을(를) 보자마자 황급히 자리를 피했어요`; }
        const r = rel(v.id, o.id);
        Sim.scene({ title: '원수와 마주침', actors: { A: v, B: o }, steps: [{ go: 'A', to: { actor: 'B', near: 1.4 }, max: 40 }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' }, { say: 'A', text: say(v, r.history ? `${o.name}... 그 일 아직 안 잊었어` : `또 너냐, ${o.name}`), t: 2.6 }, { say: 'B', text: sty(o, '나도 너 보기 싫거든?'), t: 2.2 }, { par: [{ emote: 'A', e: '💢' }, { emote: 'B', e: '💢' }] }, { par: [{ pose: 'A', p: 'stomp', t: 1.6 }, { pose: 'B', p: 'stomp', t: 1.6 }] }],
          onEnd: () => { Soc.addFriend(v.id, o.id, -3, -2); v.stress = clamp((v.stress || 0) + 8, 0, 100); } });
        return `☠️ 원수 ${v.name}와(과) ${o.name}이(가) 마주쳐서 으르렁댔어요`;
      },
    },
    ex: {
      w: (v, near) => { const o = near.find(x => rel(v.id, x.id).bond === 'EX_LOVER' || (rel(v.id, x.id).status === 'EX' && (rel(v.id, x.id).cooldown_until || 0) <= day())); return o ? [2.5, o] : null; },
      run: (v, o) => {
        const a = rom(v.id, o.id), b = rom(o.id, v.id), r = rel(v.id, o.id);
        if (a >= 55 && b >= 50 && !Soc.partnerOf(v.id) && !Soc.partnerOf(o.id)) {
          Sim.scene({ title: '옛 연인과 재회', major: true, actors: { A: v, B: o }, steps: [{ go: 'A', to: { actor: 'B', near: 1.1 }, max: 50 }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' }, { say: 'A', text: say(v, `${o.name}... 아직도 가끔 네 생각이 나`), t: 3 }, { say: 'B', text: sty(o, '...나도야. 우리 다시 시작해 볼까?'), t: 3 }, { par: [{ pose: 'A', p: 'hug', t: 2 }, { pose: 'B', p: 'hug', t: 2 }] }, { fx: 'hearts', at: 'A' }],
            onEnd: () => { r.status = 'DATING'; r.since = day(); r.bond = null; Sim.log('couple', `💞 옛 연인 ${v.name}와(과) ${o.name}이(가) 다시 사귀기 시작했어요!`, [v.id, o.id], 3, { newsKind: 'couple' }); } });
          return null;
        }
        if (a >= 40) { Sim.scene({ title: '옛 연인 그리워하기', actors: { A: v }, steps: [{ face: 'A', at: o.id }, { emote: 'A', e: '💧' }, { say: 'A', text: say(v, `(${o.name}... 잘 지내는구나)`), t: 2.6 }, { pose: 'A', p: 'look', t: 3 }] }); return `💔 ${v.name}이(가) 옛 연인 ${o.name}을(를) 먼발치에서 바라보다 한숨 쉬었어요`; }
        Sim.scene({ title: '어색한 마주침', actors: { A: v, B: o }, steps: [{ face: 'A', at: 'B' }, { face: 'B', at: 'A' }, { par: [{ emote: 'A', e: '😅' }, { emote: 'B', e: '😶' }] }, { say: 'A', text: say(v, '아... 안녕'), t: 1.8 }, { go: 'A', to: { actor: 'B', near: 10 }, max: 20 }] });
        return `😅 옛 연인 ${v.name}와(과) ${o.name}이(가) 마주쳐서 어색하게 인사만 했어요`;
      },
    },
    oldFriend: {
      w: (v, near) => { const o = near.find(x => rel(v.id, x.id).bond === 'OLD_FRIEND'); return o ? [2.2, o] : null; },
      run: (v, o) => {
        const r = rel(v.id, o.id), first = !st().met[[v.id, o.id].sort().join('~')];
        st().met[[v.id, o.id].sort().join('~')] = 1;
        Sim.scene({ title: first ? '옛친구와 재회' : '옛친구와 추억', major: first, actors: { A: v, B: o }, steps: [{ go: 'A', to: { actor: 'B', near: 1.2 }, run: first, max: 50 }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' },
          { say: 'A', text: say(v, first ? `${o.name}?! 너 ${o.name} 맞지? 우리 ${r.history || '옛날 친구'}잖아!` : pick([`${o.name}, 그때 기억나? 우리 밤새 떠들던 거`, '어릴 때 비밀기지 아직 있을까?', '우리 옛날 사진 보면 진짜 웃겨'])), t: 3 },
          { say: 'B', text: sty(o, first ? '세상에! 이 섬에서 다시 만날 줄이야!' : '당연하지, 그걸 어떻게 잊어 ㅋㅋ'), t: 2.5 }, { par: [{ pose: 'A', p: 'hug', t: 1.8 }, { pose: 'B', p: 'hug', t: 1.8 }] }, { par: [{ emote: 'A', e: '🥹' }, { emote: 'B', e: '😆' }] }],
          onEnd: () => Soc.addFriend(v.id, o.id, first ? 15 : 5, first ? 15 : 4, '옛친구') });
        return first ? `📼 ${v.name}와(과) ${o.name}이(가) 섬에서 극적으로 재회했어요! (${r.history || '옛친구'})` : null;
      },
    },
    affair: {
      w: v => { const af = affairOf(v.id); return af && !af.exposed && af.a === v.id && (hour() >= 19 || hour() < 1) ? [4, af] : null; },
      run: (v, af) => {
        const z = byId(af.b); if (!z || busy(z)) return null;
        const place = pick(['alley', 'cliff', 'beach', 'observatory']);
        af.meets++;
        Sim.scene({ title: '몰래 만나기', actors: { A: v, B: z }, steps: [{ par: [{ go: 'A', to: { place, dx: -0.6 } }, { go: 'B', to: { place, dx: 0.6 } }] }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' }, { say: 'A', text: say(v, '아무도 안 봤지...?'), t: 2.2 }, { say: 'B', text: sty(z, '쉿... 보고 싶었어'), t: 2.2 }, { par: [{ emote: 'A', e: '💗' }, { emote: 'B', e: '💗' }] }, { wait: 3 }],
          onEnd: () => {
            Soc.addRomance(v.id, z.id, 4); Soc.addRomance(z.id, v.id, 4);
            Soc.addBoredom && Soc.addBoredom(rel(v.id, af.partner), 6, '몰래 만남');
            // 목격: 같은 곳에 있던 주민 (가십 성격일수록 잘 봄)
            for (const o of alive()) {
              if (o === v || o === z || o.loc !== v.loc || Math.hypot(o.x - v.x, o.z - v.z) > 22) continue;
              const p = 0.25 + (has(o, 'GOSSIP') || has(o, 'BUSYBODY') ? 0.3 : 0);
              if (!chance(p)) continue;
              if (o.id === af.partner) { expose(af, o.id); return; }
              af.witness = af.witness || []; if (!af.witness.includes(o.id)) af.witness.push(o.id);
              Sim.log('affair', `👀 ${o.name}이(가) ${v.name}와(과) ${z.name}이(가) 몰래 만나는 걸 목격했어요...`, [o.id, v.id, z.id], 1, { secret: true });
              W.remember(o, 'saw', `${v.name}가 ${z.name}랑 몰래 만나는 걸 봤어`);
              if (has(o, 'GOSSIP') && chance(0.5)) expose(af, o.id);
            }
            if (af.meets >= 6 && chance(0.3)) expose(af, null);
          } });
        return null;
      },
    },
    lonelyWander: {
      w: v => (has(v, 'WANDERER') || has(v, 'CURIOUS') || has(v, 'EXTROVERT')) ? [1.2, null] : [0.4, null],
      run: v => {
        const tags = has(v, 'WANDERER') ? ['sea', 'hill', 'quiet', 'trees'] : has(v, 'EXTROVERT') ? ['bench', 'cafe', 'plaza', 'soapbox'] : ['flowers', 'bench', 'trees', 'sea'];
        const sp = Sim.chooseSpot(v, { tags, ignoreRange: true }); if (!sp) return null;
        Sim.goSpot(v, sp, pick(['look_around', 'watch_sky', 'stretch', 'sit_bench']));
        return null;
      },
    },
  };
  let willT = 0;
  function willTick(dMin) {
    willT += dMin; if (willT < 12) return; willT = 0;
    for (const v of alive()) {
      if (busy(v) || v.loc === 'metro' || v.moving) continue;
      if (!chance(P_WILL(v))) continue;
      const near = nearby(v);
      const cands = [];
      for (const [k, g] of Object.entries(GOALS)) { try { const r = g.w(v, near); if (r) cands.push([k, r[0] * rnd(0.6, 1.4), r[1]]); } catch (e) { /* ignore */ } }
      if (!cands.length) continue;
      cands.sort((a, b) => b[1] - a[1]);
      const [k, , arg] = cands[0];
      let text = null; try { text = GOALS[k].run(v, arg); } catch (e) { console.error('will', k, e); }
      if (text) Sim.log(k === 'affair' ? 'affair' : 'rel', text, [v.id].concat(arg && arg.id ? [arg.id] : []), k === 'ex' || k === 'oldFriend' ? 2 : 1);
    }
  }

  // ---------------------------------------------------------
  // 대화 의도 추가
  // ---------------------------------------------------------
  const I = W.I;
  const triOf = v => Object.values(st().tri).find(t => t.kind === 'rivals' && (t.a === v.id || t.b === v.id) || (t.kind === 'couple' && t.a === v.id));
  I.triangle = {
    w: (v, c) => triOf(v) && c.trust >= 25 ? 5 : 0,
    say: v => {
      const t = triOf(v), rival = t.kind === 'rivals' ? (t.a === v.id ? t.b : t.a) : t.b;
      return { data: { t: t.t, rival }, text: sty(v, t.kind === 'couple' ? `나... ${nm(t.t)}를 좋아하게 됐어. 근데 ${nm(t.t)}한텐 ${nm(rival)}가 있잖아. 어떡하지?` : `${nm(rival)}도 ${nm(t.t)}를 좋아하는 것 같아... 나 어떡해?`),
        choices: [{ k: 'fight', label: '⚔️ "정정당당하게 경쟁해!"' }, { k: 'confess', label: '💌 "먼저 고백해 버려!"' }, { k: 'sabotage', label: `😈 "${nm(rival)} 안 좋은 소문을 내"` }, { k: 'give', label: '🕊️ "포기하는 것도 용기야"' }] };
    },
    on: (v, k, d) => {
      const t = byId(d.t), r = byId(d.rival);
      if (k === 'fight') { rel(v.id, d.rival).bond = 'RIVAL_LOVE'; v.confidence = clamp((v.confidence || 0) + 20, 0, 100); if (t) Soc.addRomance(t.id, v.id, 5); return { text: sty(v, '좋아, 정정당당하게! 지지 않을 거야!') }; }
      if (k === 'confess') { if (!t || d.t === P) return { text: sty(v, '...그, 그건 좀') }; if (Soc.partnerOf(d.t) && Soc.partnerOf(d.t) !== v.id && TEMPT(t) < 0.25 && rom(d.t, v.id) < 60) return { text: sty(v, `${t.name}는 ${nm(Soc.partnerOf(d.t))}랑 행복해 보여... 역시 안 될 거야`) }; Soc.runConfession(v, t, pick(D.CONFESS_SPOTS).id, { force: true }); return { text: sty(v, '지금 당장 가서 말할게!'), close: true }; }
      if (k === 'sabotage') {
        if (!r) return { text: '...' };
        Soc.addFriend(d.t, d.rival, -8, -8); rel(v.id, d.rival).bond = 'ENEMY';
        if (chance(0.35)) { Soc.addFriend(d.t, v.id, -10, -15); Sim.log('rel', `🗣️ ${v.name}이(가) 연적 ${r.name}의 험담을 퍼뜨린 게 들통났어요!`, [v.id, d.rival], 2); return { text: sty(v, '...했는데 들킨 것 같아. 망했어') }; }
        return { text: sty(v, '...좀 미안하지만, 해볼게') };
      }
      Soc.F(v.id, d.t).romance *= 0.4; Soc.endCrush && Soc.endCrush(v); v.depression = clamp((v.depression || 0) + 10, 0, 100);
      return { text: sty(v, '...응. 마음 정리할게. 들어줘서 고마워') };
    },
  };
  I.affairConfess = {
    w: (v, c) => { const af = affairOf(v.id); return af && !af.exposed && af.a === v.id && c.trust >= 50 ? 6 : 0; },
    say: v => { const af = affairOf(v.id); af.known = true; return { data: {}, text: sty(v, `너한테만 말하는 건데... 나 ${nm(af.partner)} 몰래 ${nm(af.b)}를 만나고 있어. 나 나쁜 사람이지?`),
      choices: [{ k: 'keep', label: '🤐 "비밀은 지켜줄게"' }, { k: 'end', label: '✋ "당장 정리해!"' }, { k: 'choose', label: `💘 "${nm(af.b)}가 진짜 사랑이면 솔직하게 헤어지고 가"` }, { k: 'tell', label: `📢 "${nm(af.partner)}한테 말할 거야"` }] }; },
    on: (v, k) => {
      const af = affairOf(v.id); if (!af) return { text: '...' };
      if (k === 'keep') { Soc.addFriend(v.id, P, 3, 6); return { text: sty(v, '고마워... 나도 이러면 안 되는 거 아는데') }; }
      if (k === 'end') { af.over = true; rel(af.a, af.b).bond = null; Soc.F(af.a, af.b).romance *= 0.3; Soc.addBoredom && Soc.addBoredom(rel(af.a, af.partner), -20); Soc.addFriend(v.id, P, 2, 5); Sim.log('affair', `🕊️ ${v.name}이(가) 비밀 연애를 정리했어요`, [v.id], 1, { secret: true }); return { text: sty(v, '...맞아. 오늘 끝낼게. 고마워') }; }
      if (k === 'choose') { const r = rel(af.a, af.partner); Soc.doBreakup(r, 'CHEATING'); af.over = true; const rr = rel(af.a, af.b); rr.status = 'DATING'; rr.since = day(); rr.bond = null; Sim.log('couple', `💘 ${v.name}이(가) ${nm(af.partner)}와(과) 헤어지고 ${nm(af.b)}와(과) 사귀기 시작했어요`, [af.a, af.b, af.partner], 2); return { text: sty(v, '...응. 솔직해질게') }; }
      Soc.addFriend(v.id, P, -10, -25); expose(af, P);
      return { text: sty(v, '뭐?! 안 돼...!'), close: true };
    },
  };
  I.suspicion = {
    w: (v, c) => { const af = st().affairs.find(a => !a.over && !a.exposed && a.partner === v.id && a.meets >= 2); return af && c.trust >= 30 ? 5 : 0; },
    say: v => { const af = st().affairs.find(a => !a.over && !a.exposed && a.partner === v.id); return { data: {}, text: sty(v, `요즘 ${nm(af.a)}가 좀 이상해... 연락도 뜸하고. 혹시 뭐 아는 거 있어?`),
      choices: [{ k: 'truth', label: `😣 "사실... ${nm(af.b)}랑 몰래 만나는 것 같아"` }, { k: 'calm', label: '🙂 "바빠서 그렇겠지, 걱정 마"' }, { k: 'watch', label: '🕵️ "내가 알아봐 줄게"' }] }; },
    on: (v, k) => {
      const af = st().affairs.find(a => !a.over && !a.exposed && a.partner === v.id); if (!af) return { text: '...' };
      if (k === 'truth') { Soc.addFriend(v.id, P, 5, 10); expose(af, P); return { text: sty(v, '...그럴 줄 알았어. 가서 확인할게'), close: true }; }
      if (k === 'calm') { Soc.addFriend(v.id, P, 1, -2); W.remember(v, 'lie', '괜찮을 거라고 했어'); return { text: sty(v, '...그렇겠지? 내가 예민한 거겠지') }; }
      Soc.addQuest({ type: 'affair_watch', title: `🕵️ ${nm(af.a)}의 수상한 밤`, giver: v.id, target: af.a, desc: `밤 7시 이후 ${nm(af.a)}이(가) 어디 가는지 지켜보세요. 두 사람이 함께 있는 걸 보면 ${v.name}에게 알려주세요.`, until: day() + 3 });
      return { text: sty(v, '부탁할게... 고마워') };
    },
  };
  I.exTalk = {
    w: (v, c) => { const o = W.others(v).find(o => rel(v.id, o.id).bond === 'EX_LOVER'); return o && c.trust >= 25 ? 3 : 0; },
    say: v => { const o = W.others(v).find(o => rel(v.id, o.id).bond === 'EX_LOVER'), r = rel(v.id, o.id), a = rom(v.id, o.id);
      return { data: { o: o.id }, text: sty(v, a >= 40 ? `사실 ${o.name}랑 예전에 사귀었었어. ${r.history || ''}... 아직도 가끔 생각나` : `${o.name}? 아, 걔랑은 예전에... 뭐, ${r.history || '지난 일'}이야`),
        choices: [{ k: 'again', label: '💞 "다시 만나 봐!"' }, { k: 'friend', label: '🤝 "친구로 지내는 건 어때?"' }, { k: 'forget', label: '🧹 "지난 일은 잊어"' }] }; },
    on: (v, k, d) => {
      const o = byId(d.o); if (!o) return { text: '...' };
      if (k === 'again') return exReunion(v, o);
      if (k === 'friend') { const r = rel(v.id, o.id); r.bond = null; r.status = 'NONE'; Soc.addFriend(v.id, o.id, 10, 8); return { text: sty(v, '친구... 그래, 그게 좋겠다') }; }
      Soc.F(v.id, o.id).romance *= 0.4; return { text: sty(v, '...응. 이제 놓아줄게') };
    },
  };
  I.enemyTalk = {
    w: (v, c) => W.others(v).some(o => rel(v.id, o.id).bond === 'ENEMY') && c.trust >= 20 ? 3 : 0,
    say: v => { const o = W.others(v).find(o => rel(v.id, o.id).bond === 'ENEMY'), r = rel(v.id, o.id);
      return { data: { o: o.id }, text: sty(v, `${o.name} 얘기는 꺼내지도 마. ${r.history ? '우린 ' + r.history + '야.' : '걔랑은 원수야.'}`),
        choices: [{ k: 'peace', label: '🕊️ "이제 그만 화해해"' }, { k: 'revenge', label: '😈 "복수 도와줄게"' }, { k: 'listen', label: '👂 "무슨 일이 있었는데?"' }] }; },
    on: (v, k, d) => {
      const o = byId(d.o), r = rel(v.id, d.o); if (!o) return { text: '...' };
      if (k === 'peace') {
        if (!chance(0.3 + rel(v.id, P).trust_level / 200)) return { text: sty(v, '싫어. 절대 못 해') };
        Sim.scene({ title: '원수와 화해', major: true, actors: { A: v, B: o }, steps: [{ par: [{ go: 'A', to: { place: 'plaza', dx: -1 } }, { go: 'B', to: { place: 'plaza', dx: 1 } }] }, { face: 'A', at: 'B' }, { face: 'B', at: 'A' }, { say: 'A', text: sty(v, `${o.name}... 그때 일, 이제 그만 잊자`), t: 3 }, { say: 'B', text: sty(o, '...나도 사실 미안했어'), t: 2.5 }, { par: [{ pose: 'A', p: 'hug', t: 2 }, { pose: 'B', p: 'hug', t: 2 }] }],
          onEnd: () => { r.bond = null; Soc.addFriend(v.id, o.id, 25, 20, '원수와 화해'); Sim.log('rel', `🕊️ 원수였던 ${v.name}와(과) ${o.name}이(가) 화해했어요!`, [v.id, o.id], 3); } });
        return { text: sty(v, '...알았어. 이번 한 번만이야'), close: true };
      }
      if (k === 'revenge') {
        Sim.scene({ title: '복수 장난', actors: { A: v }, steps: [{ go: 'A', to: { actor: o.id, near: 1.2 }, max: 60 }, { say: 'A', text: sty(v, '받아라!'), t: 1.5 }, { fx: 'splash', at: 'A' }, { emote: 'A', e: '😈' }], onEnd: () => { Sim.say(o, sty(o, '야!!! 너 거기 서!')); Soc.addFriend(v.id, o.id, -6, -4); } });
        Soc.addFriend(v.id, P, 4, 3); if (chance(0.3)) Soc.addFriend(o.id, P, -8, -12);
        return { text: sty(v, '크크, 좋아! 같이 골려주자'), close: true };
      }
      Soc.addFriend(v.id, P, 2, 5);
      return { text: sty(v, `${r.history ? r.history + '... 그 일 때문에' : '말하자면 길어...'} 아직도 생각하면 화가 나`) };
    },
  };
  I.oldFriendTalk = {
    w: (v, c) => W.others(v).some(o => rel(v.id, o.id).bond === 'OLD_FRIEND') ? 2 : 0,
    say: v => { const o = W.others(v).find(o => rel(v.id, o.id).bond === 'OLD_FRIEND'), r = rel(v.id, o.id);
      return { data: { o: o.id }, text: sty(v, `${o.name}랑 나는 ${r.history || '오래된 친구'}야. ${st().met[[v.id, o.id].sort().join('~')] ? '요즘 다시 자주 만나서 좋아!' : '이 섬에 있는 줄 몰랐는데... 보고 싶다'}`),
        choices: [{ k: 'meet', label: '📼 "지금 만나러 가 봐!"' }, { k: 'story', label: '😆 "어릴 때 얘기 해줘"' }] }; },
    on: (v, k, d) => {
      const o = byId(d.o); if (!o) return { text: '...' };
      if (k === 'meet') { GOALS.oldFriend.run(v, o); return { text: sty(v, '응! 지금 갈게!'), close: true }; }
      Soc.addFriend(v.id, P, 3, 3);
      return { text: sty(v, pick([`${o.name}랑 몰래 과수원에서 사과 따다가 혼난 적 있어 ㅋㅋ`, `옛날에 ${o.name}가 내 도시락 다 먹어서 한 달 동안 말 안 했어`, `${o.name}랑 비밀 일기장을 같이 썼었어. 아직 어딘가 있을걸?`])) };
    },
  };
  I.cheatP = {
    w: v => v.drama && v.drama.caughtP && S().player.lover === v.id ? 20 : 0,
    say: v => { const o = v.drama.caughtP; return { data: {}, text: sty(v, `...${nm(o)}랑 무슨 사이야? 다 들었어. 설명해 봐`),
      choices: [{ k: 'sorry', label: '🙇 "미안해, 흔들렸어. 다신 안 그럴게"' }, { k: 'deny', label: '🙅 "오해야! 아무 사이 아니야"' }, { k: 'end', label: '💔 "사실... 우리 그만하자"' }] }; },
    on: (v, k) => {
      const r = rel(v.id, P), o = v.drama.caughtP; v.drama.caughtP = null;
      if (k === 'sorry') { Soc.addFriend(v.id, P, -8, -20); Soc.F(v.id, P).romance -= 10; return { text: sty(v, '...이번 한 번만이야. 또 그러면 끝이야') }; }
      if (k === 'deny') { if (chance(0.45)) { Soc.addFriend(v.id, P, -2, -5); return { text: sty(v, '...진짜지? 믿어볼게') }; } Soc.addFriend(v.id, P, -15, -30); Soc.doBreakup(r, 'CHEATING'); r.exPlayer = true; S().player.lover = null; const e = rel(v.id, o); e.bond = 'ENEMY'; e.history = '연인을 빼앗은 사이'; return { text: sty(v, '거짓말까지 해? 끝이야!'), close: true }; }
      Soc.doBreakup(r, 'CHEATING'); r.exPlayer = true; S().player.lover = null; rel(v.id, P).bond = 'EX_LOVER';
      return { text: sty(v, '...그래. 행복해'), close: true };
    },
  };

  // 플레이어가 다른 사람에게 설레는 말/고백 → 연인이 알게 될 수 있음
  const origChoose = Soc.playerChoose;
  Soc.playerChoose = function (v, id, arg) {
    const r = origChoose(v, id, arg);
    try {
      const lover = S().player.lover;
      if (lover && lover !== v.id && (id === 'flirtDo' || id === 'confessD' || (id === 'gift' && arg && (D.ITEMS[arg] || {}).tags && D.ITEMS[arg].tags.includes('romance')))) {
        const L = byId(lover);
        const seen = L && L.loc === v.loc && (v.loc !== 'island' || Math.hypot(L.x - v.x, L.z - v.z) < 20);
        const gossip = alive().some(o => o !== v && o !== L && o.loc === v.loc && (has(o, 'GOSSIP') || has(o, 'BUSYBODY')) && Math.hypot(o.x - v.x, o.z - v.z) < 18);
        if (L && (seen || (gossip && chance(0.5)) || chance(0.12))) {
          L.drama = L.drama || {}; L.drama.caughtP = v.id;
          Soc.addFriend(lover, v.id, -10, -10); rel(lover, v.id).bond = 'RIVAL_LOVE';
          Sim.emote(L, '💢', 4);
          Sim.log('affair', `👀 ${L.name}이(가) ${S().player.name}이(가) ${v.name}에게 추파를 던지는 걸 ${seen ? '직접 봤어요' : '소문으로 들었어요'}!`, [lover, v.id, P], 2);
          if (seen) FM.bus.emit('toast', `💢 ${L.name}이(가) 지켜보고 있었어요...!`);
        }
      }
    } catch (e) { console.error(e); }
    return r;
  };

  // ---------------------------------------------------------
  // 관계 유도 메뉴 확장
  // ---------------------------------------------------------
  W.IND.push(['triangle', '🔺 삼각관계 만들기 (○○에게 마음 품게)'], ['affair', '🔥 바람 부추기기'], ['expose', '📢 ○○의 바람 폭로하기'], ['enemy', '☠️ 원수 만들기'], ['exReunion', '💞 옛 연인 재회 주선'], ['oldFriend', '📼 옛친구로 맺어주기']);
  function exReunion(v, o) {
    const a = rom(v.id, o.id), b = rom(o.id, v.id);
    Soc.addRomance(v.id, o.id, 12, '재회 주선'); Soc.addRomance(o.id, v.id, 8, '재회 주선');
    if (a + 12 >= 55 && b + 8 >= 50 && !Soc.partnerOf(v.id) && !Soc.partnerOf(o.id)) { GOALS.ex.run(v, o); return { text: sty(v, '...한 번만 더 용기 내볼게'), close: true }; }
    return { text: sty(v, `${o.name}랑...? 아직 마음의 준비가... 그래도 생각은 해볼게`) };
  }
  Object.assign(W.indExtra, {
    triangle: (v, o) => {
      if (!Soc.canRomance(v.id, o.id)) return { text: sty(v, `${o.name}? 그런 감정은 안 생겨`) };
      Soc.addRomance(v.id, o.id, rnd(18, 30), '플레이어의 부추김');
      const pt = Soc.partnerOf(o.id);
      return { text: pt && pt !== v.id ? sty(v, `${o.name}한텐 ${nm(pt)}가 있는데... 왜 자꾸 신경 쓰이지?`) : sty(v, `${o.name}...? 듣고 보니 괜찮은 것 같기도...`) };
    },
    affair: (v, o) => {
      const pt = Soc.partnerOf(v.id);
      if (!pt || pt === P) return { text: sty(v, '나 사귀는 사람 없는데? 그냥 연애하면 되잖아 ㅋㅋ') };
      if (pt === o.id) return { text: sty(v, '그게 내 애인인데?') };
      if (!Soc.canRomance(v.id, o.id)) return { text: sty(v, '말도 안 돼') };
      if (!chance(TEMPT(v) + (rel(v.id, pt).boredom || 0) / 200 + rom(v.id, o.id) / 200)) { Soc.addFriend(v.id, P, -5, -8); return { text: sty(v, `나한텐 ${nm(pt)}뿐이야. 그런 말 하지 마`) }; }
      Soc.addRomance(v.id, o.id, 20); Soc.addRomance(o.id, v.id, 15); startAffair(v, o);
      return { text: sty(v, `...${nm(pt)}한텐 비밀이야. 알았지?`) };
    },
    expose: (v, o) => {
      const af = st().affairs.find(a => !a.over && !a.exposed && (a.a === o.id) && a.partner === v.id) || st().affairs.find(a => !a.over && !a.exposed && a.a === o.id);
      if (!af) { Soc.addFriend(v.id, P, -3, -6); if (Soc.partnerOf(v.id) === o.id) Soc.addBoredom && Soc.addBoredom(rel(v.id, o.id), 15); return { text: sty(v, `${o.name}가 바람을? ...증거 있어? 괜히 의심하게 만들지 마`) }; }
      expose(af, P); return { text: sty(v, '뭐...? 그게 사실이야?!'), close: true };
    },
    enemy: (v, o) => {
      if (!chance(0.3 + rel(v.id, P).trust_level / 150)) { Soc.addFriend(v.id, P, -4, -8); return { text: sty(v, `${o.name}가 뭘 어쨌다고? 난 안 믿어`) }; }
      const r = rel(v.id, o.id); r.bond = 'ENEMY'; r.history = pick(HIST.ENEMY); r.friendship_point = Math.min(r.friendship_point, 8); r.trust_level = Math.min(r.trust_level, 8);
      Sim.log('rel', `☠️ ${v.name}와(과) ${o.name}이(가) 원수가 됐어요 (${r.history})`, [v.id, o.id], 2);
      return { text: sty(v, `${o.name}... 절대 용서 못 해!`) };
    },
    exReunion: (v, o) => {
      const r = rel(v.id, o.id);
      if (!(r.bond === 'EX_LOVER' || r.status === 'EX')) return { text: sty(v, `${o.name}랑 사귄 적 없는데?`) };
      return exReunion(v, o);
    },
    oldFriend: (v, o) => { const r = rel(v.id, o.id); if (r.friendship_point < 30) return { text: sty(v, `${o.name}랑은 아직 잘 몰라 (친밀도 ${Math.round(r.friendship_point)}/30)`) }; r.bond = 'OLD_FRIEND'; r.history = r.history || '오래 알고 지낸 동네 친구'; GOALS.oldFriend.run(v, o); return { text: sty(v, '맞아, 우린 오랜 친구지!'), close: true }; },
  });

  // ---------------------------------------------------------
  // 틱
  // ---------------------------------------------------------
  let detT = 0;
  const origTick = Soc.tick;
  Soc.tick = function (dtR, dMin) {
    origTick(dtR, dMin);
    try {
      if (!st().seeded && alive().length >= 4) seedBackstory();
      detT += dMin; if (detT >= 60) { detT = 0; detect(); }
      willTick(dMin);
      // 바람 지켜보기 퀘스트: 밤에 두 사람이 함께 있는 걸 플레이어가 보면
      const p = S().player;
      for (const q of Soc.activeQuests().filter(q => q.type === 'affair_watch')) {
        const af = affairOf(q.target); if (!af || af.exposed) { Soc.finishQuest(q, true, '더 이상 지켜볼 필요가 없어요'); continue; }
        const a = byId(af.a), b = byId(af.b);
        if (a && b && a.loc === p.loc && b.loc === p.loc && Math.hypot(a.x - b.x, a.z - b.z) < 3 && Math.hypot(a.x - p.x, a.z - p.z) < 14) { Soc.finishQuest(q, true, `${a.name}와(과) ${b.name}이(가) 함께 있는 걸 목격했어요!`); expose(af, P); }
      }
    } catch (e) { console.error('drama', e); }
  };

  // ---------------------------------------------------------
  // 🕸️ 관계도
  // ---------------------------------------------------------
  const EDGE = {
    DATING: ['#ff5d8a', 4, ''], MARRIED: ['#ff2d6a', 5, ''], EX: ['#9aa3ad', 2, '6 4'], EX_LOVER: ['#9aa3ad', 2, '6 4'], ENEMY: ['#2b2b30', 3, ''], NEMESIS: ['#5a3a3a', 2, '3 3'],
    RIVAL: ['#ff9a3a', 3, ''], RIVAL_FRIEND: ['#ffb13d', 2, ''], RIVAL_LOVE: ['#e84a3a', 3, '8 3'], BESTIE: ['#3ab86a', 3, ''], OLD_FRIEND: ['#7a9a5a', 3, '2 3'], SIBLING: ['#5ab8c8', 2, ''], MENTOR: ['#6a7ad8', 2, ''], HOBBY: ['#8ac86a', 2, ''], BUDDY: ['#8ac86a', 2, ''], SECRET: ['#9a6ad0', 2, '2 2'], CRUSH: ['#ff8fb1', 2, '4 3'], AFFAIR: ['#c040c0', 3, '1 4'],
  };
  DR.EDGE = EDGE;
  // 두 사람 사이의 대표 관계 종류 (관계도 선)
  DR.kindOf = function (a, b) {
    if (!Soc.hasRel || !Soc.hasRel(a, b)) return null;
    const r = rel(a, b); let k = r.status === 'DATING' || r.status === 'MARRIED' ? r.status : r.bond;
    if (k === 'AFFAIR') { const af = st().affairs.find(x => !x.over && ((x.a === a && x.b === b) || (x.a === b && x.b === a))); if (!af || !(af.known || af.exposed || (af.witness || []).length)) k = null; }
    if (!k && r.status === 'EX') k = 'EX';
    return k && EDGE[k] ? k : null;
  };
  DR.rom = rom;
  DR.dramaLines = function (id) {
    const d = st(), out = [];
    const has = (...ids) => !id || ids.includes(id);
    for (const t of Object.values(d.tri)) if (has(t.a, t.b, t.t)) out.push(t.kind === 'couple' ? `🔺 ${nm(t.a)} → ${nm(t.t)} ♥ ${nm(t.b)} (연인 있는 사람을 짝사랑)` : `🔺 ${nm(t.a)} ⚔️ ${nm(t.b)} — 둘 다 ${nm(t.t)}을(를) 좋아함`);
    for (const q of Object.values(d.sq)) if (has(...q.ids)) out.push(q.kind === 'swap' ? `🔷 ${nm(q.ids[0])}·${nm(q.ids[1])} 커플 ↔ ${nm(q.ids[2])}·${nm(q.ids[3])} 커플 엇갈린 마음` : `🔷 ${q.ids.map(nm).join(' → ')} 짝사랑 사슬`);
    for (const af of d.affairs) if ((af.known || af.exposed || (af.witness || []).length) && has(af.a, af.b, af.partner)) out.push(`${af.exposed ? '💥' : '🔥'} ${nm(af.a)} ⇄ ${nm(af.b)} (연인 ${nm(af.partner)} 몰래) ${af.exposed ? '— 들통남' : af.over ? '— 정리함' : ''}`);
    return out;
  };
  DR.histOf = function (a, b) { const k = Soc.hasRel(a, b) ? rel(a, b) : null; return k && k.history ? k.history : ''; };
  DR.openMapAll = function () {
    const vs = alive(); const n = vs.length; const R = 170, cx = 220, cy = 210;
    const pos = {}; vs.forEach((v, i) => { const a = i / n * Math.PI * 2 - Math.PI / 2; pos[v.id] = [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; });
    pos[P] = [cx, cy];
    const edges = [];
    const all = vs.map(v => v.id).concat([P]);
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const a = all[i], b = all[j]; if (!Soc.hasRel || !Soc.hasRel(a, b)) continue;
      const k = DR.kindOf(a, b);
      if (k) edges.push([a, b, k]);
    }
    const crushes = []; for (const v of vs) for (const o of all) if (o !== v.id && rom(v.id, o) >= 45 && Soc.partnerOf(v.id) !== o) crushes.push([v.id, o]);
    const svg = `<svg viewBox="0 0 440 420" style="width:100%;max-width:560px;display:block;margin:auto">
      <defs><marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 z" fill="#ff8fb1"/></marker></defs>
      ${edges.map(([a, b, k]) => { const [c, w, dsh] = EDGE[k]; return `<line x1="${pos[a][0]}" y1="${pos[a][1]}" x2="${pos[b][0]}" y2="${pos[b][1]}" stroke="${c}" stroke-width="${w}" ${dsh ? `stroke-dasharray="${dsh}"` : ''} opacity=".85"/>`; }).join('')}
      ${crushes.map(([a, b]) => { const [x1, y1] = pos[a], [x2, y2] = pos[b]; const mx = (x1 + x2) / 2 + (y2 - y1) * 0.12, my = (y1 + y2) / 2 - (x2 - x1) * 0.12; const t = 0.86; const ex = x1 + (x2 - x1) * t, ey = y1 + (y2 - y1) * t; return `<path d="M${x1},${y1} Q${mx},${my} ${ex},${ey}" stroke="#ff8fb1" stroke-width="1.6" fill="none" stroke-dasharray="4 3" marker-end="url(#arr)"/>`; }).join('')}
      ${all.map(id => { const [x, y] = pos[id]; const v = byId(id); const ic = id === P ? '🧑' : (window.ISLE && ISLE.SPECIES[v.look.species] ? ISLE.SPECIES[v.look.species].icon : '🙂'); return `<g><circle cx="${x}" cy="${y}" r="17" fill="${id === P ? '#fff4c0' : '#fffaf2'}" stroke="#e8c8a8" stroke-width="2"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-size="17">${ic}</text><text x="${x}" y="${y + 31}" text-anchor="middle" font-size="11" fill="#5a4030">${nm(id)}</text></g>`; }).join('')}
    </svg>`;
    const legend = Object.entries({ DATING: '💕 연인', MARRIED: '💍 부부', EX: '💔 옛 연인', ENEMY: '☠️ 원수', RIVAL: '🏆 라이벌', RIVAL_LOVE: '⚔️ 연적', BESTIE: '👯 절친', OLD_FRIEND: '📼 옛친구', SIBLING: '👫 의남매', MENTOR: '🎓 스승·제자', AFFAIR: '🔥 비밀 연애(알려진 것)' }).map(([k, l]) => `<span style="display:inline-flex;align-items:center;gap:4px;margin:2px 8px 2px 0;font-size:12px"><i style="display:inline-block;width:22px;height:0;border-top:${EDGE[k][1]}px ${EDGE[k][2] ? 'dashed' : 'solid'} ${EDGE[k][0]}"></i>${l}</span>`).join('') + '<span style="font-size:12px;color:#ff6f9f">⇢ 짝사랑(설렘 45↑)</span>';
    const d = st();
    const dramas = [];
    for (const t of Object.values(d.tri)) dramas.push(t.kind === 'couple' ? `🔺 ${nm(t.a)} → ${nm(t.t)} ♥ ${nm(t.b)} (연인 있는 사람을 짝사랑)` : `🔺 ${nm(t.a)} ⚔️ ${nm(t.b)} — 둘 다 ${nm(t.t)}을(를) 좋아함`);
    for (const q of Object.values(d.sq)) dramas.push(q.kind === 'swap' ? `🔷 ${nm(q.ids[0])}·${nm(q.ids[1])} 커플 ↔ ${nm(q.ids[2])}·${nm(q.ids[3])} 커플 엇갈린 마음` : `🔷 ${q.ids.map(nm).join(' → ')} 짝사랑 사슬`);
    for (const af of d.affairs) if (af.known || af.exposed || (af.witness || []).length) dramas.push(`${af.exposed ? '💥' : '🔥'} ${nm(af.a)} ⇄ ${nm(af.b)} (연인 ${nm(af.partner)} 몰래) ${af.exposed ? '— 들통남' : af.over ? '— 정리함' : ''}`);
    const hist = []; for (const k of Object.keys(S().rel)) { const r = S().rel[k]; if (r.history && r.bond) hist.push(`${W.BONDS[r.bond] || r.bond} ${nm(r.subject_id)} · ${nm(r.target_id)} — ${r.history}`); }
    FM.UI.modal('🕸️ 섬 관계도', `${svg}<div style="margin:6px 0 10px">${legend}</div>
      <h4>🎭 진행 중인 드라마</h4>${dramas.length ? dramas.map(x => `<div class="muted" style="margin:3px 0">${x}</div>`).join('') : '<p class="muted">아직 조용해요... (주민들이 돌아다니다 보면 생겨요)</p>'}
      <h4>📜 사연</h4>${hist.length ? hist.map(x => `<div class="muted" style="margin:3px 0">${x}</div>`).join('') : '<p class="muted">-</p>'}`, null, true);
  };
  DR.openMap = DR.openMapAll;
})();
