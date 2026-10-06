/* =========================================================
 *  👶 아기와 함께하는 성장 드라마 — 18편
 *   영유아기 (BABY)
 *    1. 🌙 새벽 3시의 울음        2. 🍼 첫 분유 대소동        3. 😊 첫 배냇짓 미소
 *    4. 🛁 첫 목욕                 5. 🔄 첫 뒤집기
 *   유아기 (TODDLER)
 *    6. 👣 첫 걸음마 (유아기가 되는 날)                       7. 🗣️ 첫 마디 "엄마? 아빠?"
 *    8. 🎁 돌잡이 (집은 물건이 교육 기록에 반영)               9. 🦷 첫 이가 났어요
 *   10. 🖍️ 벽에 그린 첫 그림       11. 😭 장난감 떼쓰기
 *   아동기 (CHILD)
 *   12. 🎒 첫 등교 날 (아동기가 되는 날)                      13. 🚲 보조 바퀴 떼던 날
 *   14. 🎤 학예회 무대             15. 🤒 열나는 밤 간호        16. 💌 부모님께 쓴 편지
 *   독립
 *   17. 📸 독립 전날 밤 (성장 앨범) 18. 🚪 독립하는 날 배웅
 *  · 아이마다 한 편씩 한 번만 · 같은 아이는 하루 한 편 · 섬 전체 3시간 간격
 *  · 내 아이(플레이어가 부모)면 바로 재생, 다른 집 아이면 대기열
 *  · 결과: 애착 · 육아 만족도 · 교육 기록 · 추억이 쌓이고 소문/뉴스가 됨
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, Cut = FM.Cut, W = FM.Will, D = FM.D;
  if (!Sim || !Soc || !Cut) return;
  const P = 'P';
  const S = () => Sim.get();
  const pl = () => S().player;
  const byId = id => (id === P ? pl() : Sim.byId(id));
  const day = () => Sim.time.day();
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const J = t => (FM.josa ? FM.josa(t) : t);
  const sty = (v, t) => (v && v.id !== P && W && W.sty ? W.sty(v, J(t)) : J(t));
  const free = v => v && (v.id === P || (!v.sceneId && !v.talkingToPlayer && !(v.status && v.status.hospital)));
  const keyOf = cast => Object.values(cast).map(v => v.id).sort().join('|');
  const mk = (cast, beats, o = {}) => Object.assign({ theme: 'baby', cast, beats, key: keyOf(cast) + '|' + (o.sub || ''), vig: true }, o);
  const logB = (t, ids, imp = 2) => Sim.log('baby', t, ids, imp, { newsKind: 'baby' });
  const gOf = v => (v.id === P ? pl().gender || 'F' : (Soc.genderOf ? Soc.genderOf(v.id) : v.gender) || 'F');
  const role = v => (gOf(v) === 'M' ? '아빠' : '엄마');
  const BV = (FM.BabyVig = {});

  // 공통 슬롯: 부모 A · B 양옆, 아이 K 가운데 앞
  const SLOTS = { A: [-0.95, 0], B: [0.95, 0], K: [0, 0.65] };
  const homeOf = K => (K.home && FM.INTERIORS[K.home] ? { loc: K.home } : { loc: 'island', x: 3, z: 19, place: 'plaza' });
  function parentsOf(K) {
    const c = K.child || K.grownUp; if (!c) return [];
    return (c.parents || []).map(byId).filter(Boolean);
  }
  function bond(K, ps, att, sat) {
    const c = K.child; if (!c) return;
    for (const p of ps) c.attach[p.id] = clamp((c.attach[p.id] || 60) + att, 0, 100);
    c.parenting_satisfaction = clamp((c.parenting_satisfaction || 60) + sat, 0, 100);
    c.env = c.env || { talk: 0, outdoor: 0, kids: 0, neglect: 0 }; c.env.talk++;
  }
  function memo(ps, text, K) { if (!W || !W.remember) return; for (const p of ps) if (p.id !== P) W.remember(p, 'family', text, { about: K.id }); }
  function cast3(K) { const [A, B] = parentsOf(K); return B ? { A, B, K } : { A, K }; }

  // =========================================================
  // 영유아기
  // =========================================================
  function nightCry(K) {
    const cast = cast3(K), { A, B } = cast;
    const beats = [
      { filter: 'night' }, { narr: '(새벽 3시... 온 집이 고요한데)', who: '해설', icon: '🌙', shot: ['wide'] },
      { pose: 'K', p: 'cry', t: 1500 }, { say: 'K', text: '으앙~! 으아앙~!!', hot: true, shot: 'close' }, { fx: 'shock' },
      { poses: [['A', 'surprise']].concat(B ? [['B', 'surprise']] : []), t: 900 },
      { say: 'A', text: sty(A, B ? `…${B.name}, 이번엔 네 차례 아니야…?` : '…또 깼구나. 그래, 엄마 아빠 여기 있어…') },
      ...(B ? [{ say: 'B', text: sty(B, '(비몽사몽) 기저귀… 아니 분유… 아니 둘 다…!') }, { poses: [['A', 'holdBaby'], ['B', 'touch']], t: 1600 }] : [{ pose: 'A', p: 'holdBaby', t: 1600 }]),
      { say: 'A', text: sty(A, '자장자장~ 우리 아가~ 잘도 잔다~ ♪'), shot: 'close' }, { fx: 'glow' },
      { pose: 'K', p: 'sleep', t: 1400 }, { narr: '(…새근새근. 드디어 잠들었다)', who: '해설', icon: '💤' },
      { emo: 'A', e: '😴' }, ...(B ? [{ emo: 'B', e: '😴' }] : []),
      { outcome: 'happy', endText: ['🌙 새벽 3시의 울음', '오늘 밤도 무사히… 부모가 된다는 건'] },
    ];
    const c = mk(cast, beats, { venue: homeOf(K), slots: SLOTS, sub: '새벽 3시의 울음' });
    c.resolve = () => { const ps = parentsOf(K); bond(K, ps, 4, 5); for (const p of ps) if (p.id !== P) p.stress = clamp((p.stress || 0) + 8, 0, 100); memo(ps, `새벽에 ${K.name} 달래느라 한숨도 못 잤어`, K); logB(`🌙 새벽 3시, ${K.name}의 울음에 ${ps.map(p => p.name).join('·')}이(가) 번갈아 일어났어요`, ps.map(p => p.id).concat(K.id), 1); };
    return c;
  }
  function firstMilk(K) {
    const cast = cast3(K), { A, B } = cast;
    const beats = [
      { narr: '(처음으로 분유를 타 보는 날…)', who: '해설', icon: '🍼', shot: ['wide'] },
      { pose: 'A', p: 'cook', t: 1500 }, { say: 'A', text: sty(A, '물 온도 40도… 가루 세 스푼… 아니 네 스푼이었나?!') },
      { fx: 'sweat', at: 'A' }, ...(B ? [{ say: 'B', text: sty(B, '손목에 떨어뜨려서 온도 확인해야 한대!') }, { pose: 'B', p: 'point', t: 900 }] : []),
      { fx: 'flash' }, { narr: '(퓨슉— 젖병 뚜껑이 덜 잠겨서 분유가 사방으로!)', who: '해설', icon: '💦' },
      { emo: 'A', e: '😱' }, { pose: 'K', p: 'baby', t: 1200 }, { say: 'K', text: '꺄르르르~!', shot: 'close' },
      { say: 'A', text: sty(A, '…웃었다. 분유 범벅인데 웃었어!') }, { fx: 'hearts', at: 'K' },
      { outcome: 'happy', endText: ['🍼 첫 분유 대소동', '반은 바닥에, 반은 아기 배 속에'] },
    ];
    const c = mk(cast, beats, { venue: homeOf(K), slots: SLOTS, sub: '첫 분유 대소동' });
    c.resolve = () => { const ps = parentsOf(K); bond(K, ps, 3, 4); memo(ps, `${K.name} 첫 분유 타다가 온 집이 분유 범벅이 됐어`, K); logB(`🍼 ${ps.map(p => p.name).join('·')}의 첫 분유 타기… 부엌이 분유 범벅이 됐어요`, ps.map(p => p.id).concat(K.id), 1); };
    return c;
  }
  function firstSmile(K) {
    const cast = cast3(K), { A, B } = cast;
    const beats = [
      { narr: '(요람을 들여다보던 순간…)', who: '해설', icon: '🧺', shot: ['wide'] },
      { pose: 'A', p: 'crouch', t: 1000 }, { say: 'A', text: sty(A, `${K.name}~ 까꿍!`) },
      { pose: 'K', p: 'baby', t: 900 }, { emo: 'K', e: '😊' }, { shot: ['close', 'K'], t: 1100 }, { narr: '(…방긋. 처음으로 아기가 웃었다)', who: '해설', icon: '✨' },
      { fx: 'sparkle', at: 'K' }, { emo: 'A', e: '🥹' }, { say: 'A', text: sty(A, B ? `${B.name}!! 빨리 와 봐! 웃었어! 나 보고 웃었어!!` : '웃었다… 나 보고 웃었어…!'), hot: true },
      ...(B ? [{ move: ['B', 0.6, 0.2], run: true, t: 900 }, { say: 'B', text: sty(B, '어디어디?! …으앗, 나 보고도 웃었다!') }, { poses: [['A', 'cheer'], ['B', 'cheer']], t: 1200 }] : [{ pose: 'A', p: 'cheer', t: 1200 }]),
      { split: Object.keys(cast), caps: Object.keys(cast).map(k => (k === 'K' ? '😊 첫 미소' : '🥹')), t: 2000 },
      { outcome: 'happy', endText: ['😊 첫 배냇짓 미소', '그 미소 하나로 피로가 싹'] },
    ];
    const c = mk(cast, beats, { venue: homeOf(K), slots: SLOTS, sub: '첫 배냇짓 미소' });
    c.resolve = () => { const ps = parentsOf(K); bond(K, ps, 6, 6); for (const p of ps) if (p.id !== P) p.stress = clamp((p.stress || 0) - 20, 0, 100); memo(ps, `${K.name}이(가) 처음으로 날 보고 웃었어`, K); logB(`😊 ${K.name}이(가) 처음으로 방긋 웃었어요! ${ps.map(p => p.name).join('·')} 감동`, ps.map(p => p.id).concat(K.id), 2); };
    return c;
  }
  function firstBath(K) {
    const cast = cast3(K), { A, B } = cast;
    const beats = [
      { narr: '(작은 아기 욕조에 따뜻한 물을 받았다)', who: '해설', icon: '🛁', shot: ['wide'] },
      { prop: { kind: 'duck', x: 0, z: 0.9, id: 'duck' } }, { pose: 'A', p: 'bathe', t: 1500 },
      { say: 'A', text: sty(A, '목은 이렇게 받치고… 살살… 살살…') }, ...(B ? [{ say: 'B', text: sty(B, '(사진 찍는 중) 이 순간 영원히 남겨야 해!') }, { fx: 'camera' }] : []),
      { pose: 'K', p: 'baby', t: 900 }, { say: 'K', text: '바부바~ 첨벙첨벙!', shot: 'close' }, { fx: 'flash' },
      { narr: '(첨벙! 물벼락은 고스란히 부모 얼굴로)', who: '해설', icon: '💦' }, { emo: 'A', e: '😳' }, ...(B ? [{ emo: 'B', e: '😆' }] : []),
      { say: 'A', text: sty(A, '…그래, 시원하다. 너만 좋으면 됐어.') }, { fx: 'hearts', at: 'K' }, { unprop: 'duck' },
      { outcome: 'happy', endText: ['🛁 첫 목욕', '뽀송뽀송, 아기 냄새 가득'] },
    ];
    const c = mk(cast, beats, { venue: homeOf(K), slots: SLOTS, sub: '첫 목욕' });
    c.resolve = () => { const ps = parentsOf(K); bond(K, ps, 4, 4); memo(ps, `${K.name} 첫 목욕시키다가 물벼락 맞았어`, K); logB(`🛁 ${K.name}의 첫 목욕! 아기는 신나고 부모는 흠뻑 젖었어요`, ps.map(p => p.id).concat(K.id), 1); };
    return c;
  }
  function firstRoll(K) {
    const cast = cast3(K), { A, B } = cast;
    const beats = [
      { narr: '(이불 위에서 버둥버둥… 끙… 끙…)', who: '해설', icon: '🧸', shot: ['wide'] },
      { pose: 'K', p: 'fidget', t: 1300 }, { say: 'K', text: '끄응… 끄으응…!', shot: 'close' },
      { poses: [['A', 'crouch']].concat(B ? [['B', 'crouch']] : []), t: 900 }, { say: 'A', text: sty(A, '조금만! 조금만 더! 할 수 있어!!'), hot: true },
      ...(B ? [{ say: 'B', text: sty(B, '힘내! 영차! 영차!') }] : []),
      { pose: 'K', p: 'roll', t: 1400 }, { fx: 'sparkle', at: 'K' }, { narr: '(데구르르— 드디어 첫 뒤집기 성공!)', who: '해설', icon: '🎉' },
      { poses: [['A', 'cheer']].concat(B ? [['B', 'cheer']] : []), t: 1400 }, { fx: 'fireworks' },
      { pose: 'K', p: 'cry', t: 1000 }, { say: 'K', text: '…으앙! (다시 못 돌아와서 운다)' }, { emo: 'A', e: '😅' },
      { outcome: 'happy', endText: ['🔄 첫 뒤집기', '세상이 처음으로 뒤집힌 날'] },
    ];
    const c = mk(cast, beats, { venue: homeOf(K), slots: SLOTS, sub: '첫 뒤집기' });
    c.resolve = () => { const ps = parentsOf(K); bond(K, ps, 4, 5); memo(ps, `${K.name}이(가) 처음으로 뒤집기에 성공했어`, K); logB(`🔄 ${K.name}, 생애 첫 뒤집기 성공! (그리고 울었어요)`, ps.map(p => p.id).concat(K.id), 2); };
    return c;
  }

  // =========================================================
  // 유아기
  // =========================================================
  function firstSteps(K) {
    const cast = cast3(K), { A, B } = cast;
    const beats = [
      { narr: `(${K.name}이(가) 소파를 붙잡고 일어섰다…!)`, who: '해설', icon: '👣', shot: ['wide'] },
      { pose: 'A', p: 'crouch', t: 900 }, { say: 'A', text: sty(A, `${K.name}~ ${role(A)}한테 와 볼까? 이리 와~`) },
      { pose: 'K', p: 'toddle', t: 1500 }, { move: ['K', -0.3, 0.3], t: 1300 }, { say: 'K', text: '아… 아…!', shot: 'close' },
      { fx: 'shock' }, { pose: 'K', p: 'toddle', t: 1200 }, { move: ['K', -0.6, 0.1], t: 1200 },
      { narr: '(한 걸음, 두 걸음, 세 걸음…!)', who: '해설', icon: '✨' }, { pose: 'A', p: 'hug', t: 1500 }, { fx: 'hearts', at: 'A' },
      { emo: 'A', e: '😭' }, { say: 'A', text: sty(A, '걸었어…! 혼자 걸었어!!'), hot: true },
      ...(B ? [{ say: 'B', text: sty(B, '찍었어? 찍었지?! 아 나 못 찍었어!!') }, { pose: 'B', p: 'tantrum', t: 1000 }] : []),
      { split: ['K', 'A'], caps: ['👣 첫 걸음', '😭 감동'], t: 2000 },
      { outcome: 'happy', endText: ['👣 첫 걸음마', `${K.name}, 세상을 향해 첫 발을 내딛다`] },
    ];
    const c = mk(cast, beats, { venue: homeOf(K), slots: { A: [-1.6, 0], B: [1.2, 0], K: [0.6, 0.4] }, sub: '첫 걸음마' });
    c.resolve = () => { const ps = parentsOf(K); bond(K, ps, 6, 6); memo(ps, `${K.name}이(가) 처음 걸어서 나한테 안겼어`, K); logB(`👣 ${K.name}이(가) 첫 걸음마를 뗐어요! 세 걸음 걸어서 ${A.name}의 품에 안겼대요`, ps.map(p => p.id).concat(K.id), 3); };
    return c;
  }
  function firstWord(K) {
    const cast = cast3(K), { A, B } = cast;
    const winner = B ? ((K.child.attach[A.id] || 0) >= (K.child.attach[B.id] || 0) ? A : B) : A;
    const loser = B ? (winner === A ? B : A) : null;
    const beats = [
      { narr: '(첫 마디를 두고 부모의 은밀한 경쟁이 시작됐다)', who: '해설', icon: '🗣️', shot: ['wide'] },
      { say: 'A', text: sty(A, `자~ 따라 해 봐. ${role(A)}~ ${role(A)}~`) }, ...(B ? [{ say: 'B', text: sty(B, `아니야, ${role(B)}~ ${role(B)} 먼저!`), hot: true }, { poses: [['A', 'glare'], ['B', 'glare']], t: 1000 }] : []),
      { pose: 'K', p: 'tilt', t: 1200 }, { shot: ['close', 'K'], t: 900 }, { narr: '(두근… 두근…)', who: '해설', icon: '💓' },
      { say: 'K', text: `…${role(winner)}!`, hot: true, shot: 'close' }, { fx: 'sparkle', at: 'K' },
      { emo: winner === A ? 'A' : 'B', e: '😭' }, { pose: winner === A ? 'A' : 'B', p: 'cheer', t: 1300 },
      ...(loser ? [{ emo: loser === A ? 'A' : 'B', e: '😤' }, { say: loser === A ? 'A' : 'B', text: sty(loser, '…두 번째 단어는 내 거야. 두고 봐.') }, { say: 'K', text: '…맘마!' }, { narr: '(두 번째 단어는 "밥"이었다)', who: '해설', icon: '🍚' }] : []),
      { outcome: 'happy', endText: ['🗣️ 첫 마디', `${K.name}의 첫 마디는 "${role(winner)}"!`] },
    ];
    const c = mk(cast, beats, { venue: homeOf(K), slots: SLOTS, sub: '첫 마디' });
    c.resolve = () => { const ps = parentsOf(K); bond(K, ps, 3, 4); K.child.attach[winner.id] = clamp((K.child.attach[winner.id] || 60) + 5, 0, 100); K.child.firstWord = role(winner); memo(ps, `${K.name}의 첫 마디는 "${role(winner)}"였어`, K); logB(`🗣️ ${K.name}의 첫 마디는 "${role(winner)}"! ${winner.name} 승리${loser ? `, ${loser.name}은(는) 분해하는 중` : ''}`, ps.map(p => p.id).concat(K.id), 2); };
    return c;
  }
  const DOL = [
    { item: '📖 연필', key: 'SCHOLARLY', line: '공부를 잘하려나 봐!' },
    { item: '⚽ 공', key: 'ATHLETIC', line: '운동선수가 되려나?!' },
    { item: '🎨 붓', key: 'ARTISTIC', line: '화가가 될 거야!' },
    { item: '🎤 마이크', key: 'EXTROVERT', line: '섬의 아이돌 탄생?!' },
    { item: '🪙 동전', key: 'SNOB', line: '부자 되겠다!' },
    { item: '🍪 쿠키', key: 'LAZY', line: '…먹는 거구나. 역시 내 새끼.' },
  ];
  function dolJabi(K) {
    const cast = cast3(K), { A, B } = cast;
    const d = pick(DOL);
    const beats = [
      { narr: `(${K.name}의 돌잔치! 상 위에 물건들이 놓였다)`, who: '해설', icon: '🎂', shot: ['wide'] },
      { prop: { kind: 'table', x: 0, z: 1.05, id: 'tb' } }, { prop: { kind: 'cake', x: 0, z: 1.05, id: 'ck' } },
      { say: 'A', text: sty(A, '자, 연필 · 공 · 붓 · 마이크 · 동전 · 쿠키… 뭘 잡을까?') }, ...(B ? [{ say: 'B', text: sty(B, '(속닥) 동전… 동전 잡아라…') }] : []),
      { pose: 'K', p: 'toddle', t: 1200 }, { pose: 'K', p: 'reach', t: 1300 }, { shot: ['close', 'K'], t: 900 }, { fx: 'flash' },
      { narr: `(${K.name}이(가) 집은 건… ${d.item}!)`, who: '해설', icon: '✨' }, { fx: 'sparkle', at: 'K' },
      { poses: [['A', 'clap']].concat(B ? [['B', 'clap']] : []), t: 1300 }, { say: 'A', text: sty(A, d.line), hot: true }, { fx: 'fireworks' },
      { unprop: 'ck' }, { unprop: 'tb' },
      { outcome: 'happy', endText: ['🎁 돌잡이', `${K.name}의 선택: ${d.item}`] },
    ];
    const c = mk(cast, beats, { venue: homeOf(K), slots: SLOTS, sub: '돌잡이' });
    c.resolve = () => { const ps = parentsOf(K); bond(K, ps, 3, 5); const ch = K.child; ch.edu = ch.edu || {}; ch.edu[d.key] = (ch.edu[d.key] || 0) + 2; ch.dol = d.item; memo(ps, `${K.name} 돌잡이에서 ${d.item}을(를) 집었어`, K); logB(`🎁 ${K.name}의 돌잡이! 집은 물건은 ${d.item} — ${d.line} (교육 기록 +2)`, ps.map(p => p.id).concat(K.id), 2); };
    return c;
  }
  function firstTooth(K) {
    const cast = cast3(K), { A, B } = cast;
    const beats = [
      { narr: '(요즘 들어 뭐든 깨무는 아기…)', who: '해설', icon: '🦷', shot: ['wide'] },
      { pose: 'K', p: 'cry', t: 1200 }, { say: 'K', text: '으으… 이잉…' }, { say: 'A', text: sty(A, '잇몸이 간지러운가 봐… 어디 보자, 아~') },
      { pose: 'A', p: 'crouch', t: 900 }, { shot: ['close', 'K'], t: 1000 }, { fx: 'glint', at: 'K' },
      { narr: '(반짝! 아랫니 하나가 쏙 올라와 있다!)', who: '해설', icon: '✨' }, { emo: 'A', e: '😲' },
      { say: 'A', text: sty(A, B ? `${B.name}! 이 났어! 쌀알만 한 이!` : '이가 났어…! 쌀알만 한 이!'), hot: true },
      ...(B ? [{ say: 'B', text: sty(B, '어디?! …아얏! 물렸다…! 근데 귀여워…') }, { emo: 'B', e: '🥹' }] : [{ say: 'A', text: sty(A, '아얏! …물렸는데 귀여워.') }]),
      { pose: 'K', p: 'cute', t: 1200 }, { say: 'K', text: '헤에~' }, { fx: 'hearts', at: 'K' },
      { outcome: 'happy', endText: ['🦷 첫 이가 났어요', '쌀알만 한 아랫니 하나'] },
    ];
    const c = mk(cast, beats, { venue: homeOf(K), slots: SLOTS, sub: '첫 이가 났어요' });
    c.resolve = () => { const ps = parentsOf(K); bond(K, ps, 3, 3); memo(ps, `${K.name}의 첫 이가 났어 (그리고 물렸어)`, K); logB(`🦷 ${K.name}의 첫 이가 났어요! 확인하던 부모는 물렸대요`, ps.map(p => p.id).concat(K.id), 1); };
    return c;
  }
  function wallArt(K) {
    const cast = cast3(K), { A, B } = cast;
    const beats = [
      { narr: '(유난히 조용한 오후… 조용하면 사고다)', who: '해설', icon: '🤫', shot: ['wide'] },
      { pose: 'K', p: 'paint', t: 1600 }, { say: 'K', text: '쓱쓱~ 쓱싹~ 헤헤!', shot: 'close' },
      { show: 'A' }, { move: ['A', -0.9, 0.1], t: 900 }, { fx: 'shock' }, { emo: 'A', e: '😱' },
      { say: 'A', text: sty(A, `${K.name}!! 벽에… 벽에다 크레파스로…!`), hot: true }, { pose: 'K', p: 'surprise', t: 900 },
      { say: 'K', text: `…${role(A)}… ${B ? `${role(B)}… ` : ''}그려써.` }, { narr: '(삐뚤빼뚤한 동그라미들… 자세히 보니 가족 얼굴이다)', who: '해설', icon: '🖍️' },
      { emo: 'A', e: '🥹' }, { say: 'A', text: sty(A, '…이건 지우지 말자. 액자 테두리 그려 줄게.') },
      ...(B ? [{ say: 'B', text: sty(B, '(사진 찰칵) 우리 집 첫 번째 명화네.') }, { fx: 'camera' }] : []),
      { pose: 'K', p: 'jumpPop', t: 1000 }, { fx: 'sparkle', at: 'K' },
      { outcome: 'happy', endText: ['🖍️ 벽에 그린 첫 그림', '혼내려다 액자를 걸었다'] },
    ];
    const c = mk(cast, beats, { venue: homeOf(K), slots: { A: [-2.2, 0.4], B: [1.1, 0], K: [0, 0.4] }, hidden: ['A'], sub: '벽에 그린 첫 그림' });
    c.resolve = () => { const ps = parentsOf(K); bond(K, ps, 4, 3); const ch = K.child; ch.edu = ch.edu || {}; ch.edu.ARTISTIC = (ch.edu.ARTISTIC || 0) + 1; memo(ps, `${K.name}이(가) 벽에 우리 가족을 그렸어`, K); logB(`🖍️ ${K.name}이(가) 벽에 가족 그림을 그렸어요. 혼내려던 부모가 액자를 걸었대요`, ps.map(p => p.id).concat(K.id), 1); };
    return c;
  }
  function tantrum(K) {
    const cast = cast3(K), { A, B } = cast;
    const beats = [
      { narr: '(마트 장난감 코너 앞… 위기가 찾아왔다)', who: '해설', icon: '🧸', shot: ['wide'] },
      { pose: 'K', p: 'point', t: 900 }, { say: 'K', text: '저거! 저거 사 죠!!' }, { say: 'A', text: sty(A, '집에 비슷한 거 있잖아~ 오늘은 안 돼.') },
      { pose: 'K', p: 'cryFloor', t: 1800 }, { say: 'K', text: '시러어어~!! 으아아앙~!!', hot: true, shot: 'close' }, { fx: 'shock' },
      { narr: '(바닥에 드러누운 아이. 지나가던 주민들의 시선이 꽂힌다)', who: '해설', icon: '👀' }, { fx: 'sweat', at: 'A' },
      ...(B ? [{ say: 'B', text: sty(B, '(작게) 하나… 둘… 셋 세면 일어나는 거야.') }, { pose: 'B', p: 'crouch', t: 900 }] : [{ pose: 'A', p: 'crouch', t: 900 }]),
      { say: 'A', text: sty(A, '대신 집에 가서 같이 블록 쌓기 할까? 제일 높게!') }, { pose: 'K', p: 'tilt', t: 900 },
      { say: 'K', text: '…제일 높게?' }, { pose: 'K', p: 'jumpPop', t: 900 }, { say: 'K', text: '조아!' }, { fx: 'sparkle', at: 'K' },
      { pose: 'A', p: 'wipeTear', t: 1100 }, { narr: '(위기 탈출. 부모 레벨 +1)', who: '해설', icon: '🏅' },
      { outcome: 'happy', endText: ['😭 장난감 떼쓰기', '오늘의 협상 결과: 블록 쌓기'] },
    ];
    const c = mk(cast, beats, { venue: { loc: 'island', x: -15, z: 32, place: 'plaza' }, slots: SLOTS, sub: '장난감 떼쓰기' });
    c.resolve = () => { const ps = parentsOf(K); bond(K, ps, 2, 3); for (const p of ps) if (p.id !== P) p.stress = clamp((p.stress || 0) + 6, 0, 100); memo(ps, `${K.name}이(가) 마트에서 드러누웠어… 블록 쌓기로 겨우 달랬어`, K); logB(`😭 ${K.name}의 장난감 떼쓰기 사건! 부모가 블록 쌓기로 협상에 성공했어요`, ps.map(p => p.id).concat(K.id), 1); };
    return c;
  }

  // =========================================================
  // 아동기
  // =========================================================
  function firstSchool(K) {
    const cast = cast3(K), { A, B } = cast;
    const beats = [
      { narr: `(새 가방을 멘 ${K.name}… 오늘은 첫 등교 날!)`, who: '해설', icon: '🎒', shot: ['wide'] },
      { pose: 'K', p: 'pose', t: 1100 }, { say: 'K', text: '나 이제 언니(형아)야! 혼자 갈 수 있어!' },
      { say: 'A', text: sty(A, '손수건 챙겼지? 친구한테 먼저 인사하고… 물 많이 마시고…') }, ...(B ? [{ say: 'B', text: sty(B, '(이미 눈가가 촉촉) …벌써 학교라니.') }, { emo: 'B', e: '🥹' }] : []),
      { move: ['K', 0, -1.6], t: 1500 }, { pose: 'K', p: 'look', t: 700 }, { narr: '(교문 앞에서… 아이가 뒤를 돌아본다)', who: '해설', icon: '🏫' },
      { say: 'K', text: `${role(A)}! ${B ? `${role(B)}! ` : ''}이따 꼭 데리러 와야 돼!`, hot: true, shot: 'close' },
      { poses: [['A', 'cheer']].concat(B ? [['B', 'cheer']] : []), t: 1300 }, { say: 'A', text: sty(A, '당연하지! 제일 먼저 와 있을게!') },
      { split: ['K', 'A'].concat(B ? ['B'] : []), caps: ['🎒 첫 등교', '👋', '🥹'], t: 2000 },
      { outcome: 'happy', endText: ['🎒 첫 등교 날', '작은 등이 오늘따라 커 보였다'] },
    ];
    const c = mk(cast, beats, { venue: { loc: 'island', x: -54, z: 54, place: 'school' }, slots: { A: [-0.9, 0.6], B: [0.9, 0.6], K: [0, 0] }, sub: '첫 등교 날' });
    c.resolve = () => { const ps = parentsOf(K); bond(K, ps, 4, 4); K.child.env.kids = (K.child.env.kids || 0) + 2; memo(ps, `${K.name}의 첫 등교 날… 교문 앞에서 뒤돌아보더라`, K); logB(`🎒 ${K.name}의 첫 등교! 교문 앞에서 "꼭 데리러 와야 돼!"`, ps.map(p => p.id).concat(K.id), 2); };
    return c;
  }
  function bike(K) {
    const cast = cast3(K), { A, B } = cast;
    const beats = [
      { narr: '(공원 길… 오늘은 보조 바퀴를 떼는 날)', who: '해설', icon: '🚲', shot: ['wide'] },
      { say: 'K', text: `${role(A)}, 놓으면 안 돼! 절대 놓지 마!` }, { say: 'A', text: sty(A, '안 놔~ 꽉 잡고 있어~') },
      { poses: [['K', 'jog'], ['A', 'jog']], t: 1300 }, { move: ['K', 0, -1.4], run: true, t: 1500 }, { move: ['A', -0.6, -0.4], run: true, t: 1400 },
      { pose: 'A', p: 'stand', t: 600 }, { narr: '(…사실 아까부터 손을 놓고 있었다)', who: '해설', icon: '🤫' },
      { move: ['K', 0, -2.6], run: true, t: 1500 }, { pose: 'K', p: 'look', t: 800 }, { fx: 'shock' },
      { say: 'K', text: '어?! 혼자 가고 있어! 나 혼자 타고 있어!!', hot: true, shot: 'close' }, { pose: 'K', p: 'cheer', t: 1300 },
      ...(B ? [{ say: 'B', text: sty(B, '거봐! 넌 할 수 있다니까!') }, { pose: 'B', p: 'clap', t: 1200 }] : [{ pose: 'A', p: 'clap', t: 1200 }]),
      { fx: 'sparkle', at: 'K' }, { outcome: 'happy', endText: ['🚲 보조 바퀴 떼던 날', '놓아 주는 것도 사랑'] },
    ];
    const c = mk(cast, beats, { venue: { loc: 'island', x: -84, z: 24, place: 'park' }, slots: { A: [-0.5, 0.5], B: [1.4, 0.8], K: [0.2, 0.3] }, sub: '보조 바퀴 떼던 날' });
    c.resolve = () => { const ps = parentsOf(K); bond(K, ps, 4, 4); const ch = K.child; ch.env.outdoor = (ch.env.outdoor || 0) + 2; ch.edu = ch.edu || {}; ch.edu.ATHLETIC = (ch.edu.ATHLETIC || 0) + 1; memo(ps, `${K.name}이(가) 혼자 자전거를 탔어`, K); logB(`🚲 ${K.name}, 보조 바퀴 없이 자전거 성공! (부모는 몰래 손을 놓았대요)`, ps.map(p => p.id).concat(K.id), 2); };
    return c;
  }
  function recital(K) {
    const cast = cast3(K), { A, B } = cast;
    const beats = [
      { narr: '(섬 어린이 학교 학예회… 다음 순서는…!)', who: '해설', icon: '🎭', shot: ['wide'] }, { prop: { kind: 'podium', x: 0, z: -0.4, id: 'pd' } },
      { pose: 'K', p: 'freeze', t: 1200 }, { say: 'K', text: '(얼음…) …', shot: 'close' }, { narr: '(긴장해서 가사를 까먹은 것 같다)', who: '해설', icon: '😰' },
      { say: 'A', text: sty(A, `(객석에서 크게) ${K.name}! 파이팅!!`), hot: true }, ...(B ? [{ say: 'B', text: sty(B, '(응원봉 흔들며) 우리 애 최고!!') }, { pose: 'B', p: 'cheer', t: 1100 }] : []),
      { pose: 'K', p: 'sing', t: 1800 }, { say: 'K', text: '♪ 반짝반짝 작은 섬~ 우리 집이 제일 좋아~ ♪' }, { fx: 'glow' },
      { pose: 'K', p: 'dance', t: 1500 }, { pose: 'K', p: 'bow', t: 1200 }, { fx: 'fireworks' },
      { poses: [['A', 'clap']].concat(B ? [['B', 'clap']] : []), t: 1400 }, { emo: 'A', e: '😭' },
      { unprop: 'pd' }, { outcome: 'happy', endText: ['🎤 학예회 무대', `오늘의 주인공은 ${K.name}!`] },
    ];
    const c = mk(cast, beats, { venue: { loc: 'island', x: -54, z: 54, place: 'school' }, slots: { A: [-1.1, 1.8], B: [1.1, 1.8], K: [0, -0.2] }, sub: '학예회 무대' });
    c.resolve = () => { const ps = parentsOf(K); bond(K, ps, 4, 5); const ch = K.child; ch.edu = ch.edu || {}; ch.edu.EXTROVERT = (ch.edu.EXTROVERT || 0) + 1; memo(ps, `${K.name} 학예회 무대… 가사 까먹었다가 끝까지 해냈어`, K); logB(`🎤 학예회에서 ${K.name}이(가) 노래했어요! 얼어붙었다가 부모 응원에 끝까지 완창`, ps.map(p => p.id).concat(K.id), 2); };
    return c;
  }
  function fever(K) {
    const cast = cast3(K), { A, B } = cast;
    const beats = [
      { filter: 'night' }, { narr: '(밤 11시. 이마가 불덩이처럼 뜨겁다)', who: '해설', icon: '🌡️', shot: ['wide'] },
      { pose: 'K', p: 'lie', t: 1400 }, { say: 'K', text: `${role(A)}… 머리 아파…`, shot: 'close' },
      { pose: 'A', p: 'crouch', t: 900 }, { say: 'A', text: sty(A, '괜찮아, 괜찮아. 물수건 올려 줄게…') }, { fx: 'sweat', at: 'A' },
      ...(B ? [{ say: 'B', text: sty(B, '해열제 사 올게! 24시 약국 열려 있지?!') }, { move: ['B', 2.5, 1.2], run: true, t: 1200 }] : []),
      { narr: '(밤새 머리맡을 지킨다… 시계는 새벽 4시)', who: '해설', icon: '🕓' }, { pose: 'A', p: 'leanSleep', t: 1500 },
      { filter: '' }, { narr: '(아침… 아이가 먼저 눈을 떴다)', who: '해설', icon: '🌅' },
      { pose: 'K', p: 'sit', t: 900 }, { say: 'K', text: `${role(A)}… 나 다 나았어. ${role(A)}도 이제 자.` }, { emo: 'A', e: '🥹' }, { pose: 'A', p: 'hug', t: 1500 }, { fx: 'hearts', at: 'K' },
      { outcome: 'happy', endText: ['🤒 열나는 밤', '밤새 지킨 머리맡'] },
    ];
    const c = mk(cast, beats, { venue: homeOf(K), slots: SLOTS, sub: '열나는 밤 간호' });
    c.resolve = () => { const ps = parentsOf(K); bond(K, ps, 7, 4); for (const p of ps) if (p.id !== P) p.stress = clamp((p.stress || 0) + 10, 0, 100); memo(ps, `${K.name}이(가) 열이 나서 밤새 간호했어`, K); logB(`🤒 ${K.name}이(가) 밤새 열이 났지만, 부모의 간호로 아침에 씩씩하게 일어났어요`, ps.map(p => p.id).concat(K.id), 2); };
    return c;
  }
  function letter(K) {
    const cast = cast3(K), { A, B } = cast;
    const beats = [
      { narr: '(식탁 위에 삐뚤빼뚤한 글씨의 편지가 놓여 있다)', who: '해설', icon: '💌', shot: ['wide'] }, { prop: { kind: 'letter', x: 0, z: 0.5, id: 'lt' } },
      { pose: 'A', p: 'read', t: 1600 }, { narr: `("${role(A)}${B ? ` ${role(B)}` : ''}에게. 맨날 나 때문에 피곤하지? …)`, who: K.name, icon: '✏️' },
      { narr: '("내가 커서 맛있는 거 많이 사 줄게. 그러니까 오래오래 살아야 돼.")', who: K.name, icon: '✏️' },
      { emo: 'A', e: '😭' }, { pose: 'A', p: 'wipeTear', t: 1300 }, ...(B ? [{ say: 'B', text: sty(B, '…뭐야, 왜 울어. …나도 울 거 같잖아.') }, { emo: 'B', e: '😭' }] : []),
      { show: 'K' }, { move: ['K', 0, 0.2], run: true, t: 1000 }, { say: 'K', text: '편지 읽었어? 헤헤… 사랑해!', hot: true, shot: 'close' },
      { poses: [['A', 'hug'], ['K', 'hug']].concat(B ? [['B', 'hug']] : []), t: 1800 }, { fx: 'hearts', at: 'K' }, { unprop: 'lt' },
      { outcome: 'happy', endText: ['💌 부모님께 쓴 편지', '"오래오래 살아야 돼"'] },
    ];
    const c = mk(cast, beats, { venue: homeOf(K), slots: { A: [-0.8, 0], B: [0.8, 0], K: [2.6, 1.0] }, hidden: ['K'], sub: '부모님께 쓴 편지' });
    c.resolve = () => { const ps = parentsOf(K); bond(K, ps, 6, 6); for (const p of ps) if (p.id !== P) p.stress = clamp((p.stress || 0) - 25, 0, 100); memo(ps, `${K.name}이(가) "오래오래 살아야 돼"라고 편지를 써 줬어`, K); logB(`💌 ${K.name}이(가) 부모님께 첫 편지를 썼어요. "커서 맛있는 거 많이 사 줄게!"`, ps.map(p => p.id).concat(K.id), 2); };
    return c;
  }

  // =========================================================
  // 독립
  // =========================================================
  function album(K) {
    const cast = cast3(K), { A, B } = cast;
    const ch = K.child || {};
    const beats = [
      { filter: 'sepia' }, { narr: '(내일이면 독립하는 아이. 마지막 밤, 가족 앨범을 펼쳤다)', who: '해설', icon: '📸', shot: ['wide'] },
      { pose: 'A', p: 'read', t: 1300 }, { say: 'A', text: sty(A, '이건 너 처음 태어난 날… 황새가 택배 상자를 떨어뜨렸지.') },
      { say: 'K', text: '그거 진짜야?! 헤헤.' }, ...(ch.firstWord ? [{ say: 'A', text: sty(A, `첫 마디는 "${ch.firstWord}"였어. 기억나?`) }] : []),
      ...(ch.dol ? [{ narr: `(돌잡이 사진 — ${ch.dol}을(를) 꼭 쥐고 웃는 아기)`, who: '해설', icon: '🎁' }] : []),
      { split: Object.keys(cast), caps: Object.keys(cast).map(k => (k === 'K' ? '👶→🧒' : '📖')), t: 2200 },
      ...(B ? [{ say: 'B', text: sty(B, '…언제 이렇게 컸니. 어제 요람에 누워 있었던 것 같은데.') }] : []),
      { say: 'K', text: '나 내일 가도… 자주 놀러 올게. 약속!', shot: 'close' }, { poses: [['K', 'hug'], ['A', 'hug']].concat(B ? [['B', 'hug']] : []), t: 1800 },
      { fx: 'glow' }, { outcome: 'happy', endText: ['📸 독립 전날 밤', '앨범 한 장 한 장이 다 너였다'] },
    ];
    const c = mk(cast, beats, { venue: homeOf(K), slots: SLOTS, sub: '독립 전날 밤' });
    c.resolve = () => { const ps = parentsOf(K); bond(K, ps, 5, 5); memo(ps, `${K.name} 독립 전날 밤, 가족 앨범을 같이 봤어`, K); logB(`📸 독립을 하루 앞둔 ${K.name}, 가족과 함께 성장 앨범을 넘겨 봤어요`, ps.map(p => p.id).concat(K.id), 2); };
    return c;
  }
  function sendOff(K) {
    const ps = parentsOf(K); const [A, B] = ps;
    const cast = B ? { A, B, K } : { A, K };
    const beats = [
      { narr: `(짐을 챙긴 ${K.name}. 어느새 부모만큼 자랐다)`, who: '해설', icon: '🧳', shot: ['wide'] }, { prop: { kind: 'suitcase', x: 0.35, z: 0.4, id: 'sc' } },
      { say: 'K', text: sty(K, `${role(A)}${B ? `, ${role(B)}` : ''}. 그동안 키워 줘서 고마워요.`) }, { pose: 'K', p: 'bow', t: 1300 },
      { emo: 'A', e: '😭' }, { say: 'A', text: sty(A, '…밥 잘 챙겨 먹고, 힘들면 언제든 와. 네 방은 그대로 둘게.') },
      ...(B ? [{ say: 'B', text: sty(B, '…가서 멋지게 살아. 우리 아기.') }, { pose: 'B', p: 'wipeTear', t: 1200 }] : []),
      { poses: [['K', 'hug'], ['A', 'hug']].concat(B ? [['B', 'hug']] : []), t: 2000 }, { fx: 'hearts', at: 'K' },
      { move: ['K', 0, -2.4], t: 1800 }, { pose: 'K', p: 'cheer', t: 1300 }, { poses: [['A', 'cheer']].concat(B ? [['B', 'cheer']] : []), t: 1300 },
      { split: Object.keys(cast), caps: Object.keys(cast).map(k => (k === 'K' ? '🚪 새 출발' : '👋')), t: 2000 },
      { unprop: 'sc' }, { outcome: 'happy', endText: ['🚪 독립하는 날', `${K.name}, 이제 섬의 어엿한 주민`] },
    ];
    const c = mk(cast, beats, { venue: { loc: 'island', x: 0, z: 6, place: 'apt_yard' }, slots: { A: [-0.9, 0.6], B: [0.9, 0.6], K: [0, 0] }, sub: '독립하는 날 배웅' });
    c.resolve = () => { for (const p of ps) { Soc.addFriend(K.id, p.id, 6, 6, '배웅'); Soc.addFriend(p.id, K.id, 6, 6, '배웅'); } memo(ps, `${K.name}이(가) 독립했어. 문 앞에서 오래 손을 흔들었어`, K); };
    return c;
  }

  const MAKE = { nightCry, firstMilk, firstSmile, firstBath, firstRoll, firstSteps, firstWord, dolJabi, firstTooth, wallArt, tantrum, firstSchool, bike, recital, fever, letter, album, sendOff };
  BV.make = MAKE;
  // 단계별 · 시간대별 후보 (성장 전환 드라마 firstSteps/firstSchool/sendOff 는 로그로 발동)
  const PLAN = {
    BABY: [['firstSmile', [9, 18], 0], ['firstMilk', [8, 20], 0], ['firstBath', [18, 21], 1], ['firstRoll', [10, 17], 2], ['nightCry', [1, 4], 0]],
    TODDLER: [['firstWord', [9, 19], 0], ['dolJabi', [11, 17], 1], ['firstTooth', [9, 20], 0], ['wallArt', [13, 17], 1], ['tantrum', [11, 18], 1]],
    CHILD: [['bike', [10, 17], 1], ['recital', [14, 17], 2], ['fever', [21, 23], 1], ['letter', [8, 11], 3], ['album', [20, 23], 5]],
  };

  // ---------------------------------------------------------
  // 발생
  // ---------------------------------------------------------
  const lastAt = { t: -1e9 };
  function canRun(K, kind) {
    const c = K.child; if (!c) return false;
    c.vig = c.vig || {};
    if (c.vig[kind] || c.vigDay === day()) return false;
    const ps = parentsOf(K); if (!ps.length || !ps.every(free) || !free(K)) return false;
    return true;
  }
  function run(K, kind, force) {
    const ps = parentsOf(K);
    const c = MAKE[kind](K);
    if (!c) return false;
    if (K.child) { K.child.vig = K.child.vig || {}; K.child.vig[kind] = day(); K.child.vigDay = day(); }
    lastAt.t = S().time;
    Cut.enqueue(c, force || ps.some(p => p.id === P));
    return true;
  }
  BV.run = run;
  FM.bus.on('hour', h => {
    try {
      const st = S(); if (!st) return;
      if (st.time - lastAt.t < 180) return;
      const kids = st.villagers.filter(v => v.child && PLAN[v.child.stage]).sort(() => Math.random() - 0.5);
      for (const K of kids) {
        const age = day() - (K.child.birthDay || day());
        const stageStart = K.child.stage === 'BABY' ? 0 : K.child.stage === 'TODDLER' ? D.PARENT.babyDays : D.PARENT.babyDays + D.PARENT.toddlerDays;
        const inStage = age - stageStart;
        const cands = PLAN[K.child.stage].filter(([k, [h0, h1], minDay]) => h >= h0 && h <= h1 && inStage >= minDay && canRun(K, k));
        if (kind_album(K, cands)) continue;
        const pk = cands[0];
        if (pk && chance(K.child.parents.includes(P) ? 0.5 : 0.3)) { run(K, pk[0]); return; }
      }
    } catch (e) { console.error('babyvig hour', e); }
  });
  // 독립 전날 밤 앨범: 독립 하루 전에만
  function kind_album(K, cands) {
    const i = cands.findIndex(x => x[0] === 'album'); if (i < 0) return false;
    const indep = FM.Life && FM.Life.INDEP_DAY ? FM.Life.INDEP_DAY : 15;
    if (day() - (K.child.birthDay || day()) !== indep - 1) cands.splice(i, 1);
    return false;
  }

  // 성장 전환 순간: 걸음마 · 첫 등교 · 독립 배웅
  const baseFromLog = Cut.fromLog;
  Cut.fromLog = function (e) {
    try {
      if (e && e.type === 'baby' && Array.isArray(e.who)) {
        if (/유아\(TODDLER\)로 자랐어요/.test(e.text)) { const K = byId(e.who[0]); if (K && K.child && canRun(K, 'firstSteps')) { K.child.vig.firstSteps = day(); return firstSteps(K); } }
        if (/어린이\(CHILD\)가 되었어요/.test(e.text)) { const K = byId(e.who[0]); if (K && K.child && canRun(K, 'firstSchool')) { K.child.vig.firstSchool = day(); return firstSchool(K); } }
        if (/어른이 되어 독립했어요/.test(e.text)) { const K = byId(e.who[e.who.length - 1]); if (K && K.grownUp && !K.grownUp.sentOff && parentsOf(K).length) { K.grownUp.sentOff = true; return sendOff(K); } }
      }
    } catch (er) { console.error('babyvig log', er); }
    return baseFromLog(e);
  };

  // 신의 툴 · 드라마 목록
  if (FM.Vig) {
    const NAMES = { nightCry: '🌙 새벽 3시의 울음', firstMilk: '🍼 첫 분유 대소동', firstSmile: '😊 첫 배냇짓 미소', firstBath: '🛁 첫 목욕', firstRoll: '🔄 첫 뒤집기', firstSteps: '👣 첫 걸음마', firstWord: '🗣️ 첫 마디', dolJabi: '🎁 돌잡이', firstTooth: '🦷 첫 이가 났어요', wallArt: '🖍️ 벽에 그린 첫 그림', tantrum: '😭 장난감 떼쓰기', firstSchool: '🎒 첫 등교 날', bike: '🚲 보조 바퀴 떼던 날', recital: '🎤 학예회 무대', fever: '🤒 열나는 밤 간호', letter: '💌 부모님께 쓴 편지', album: '📸 독립 전날 밤', sendOff: '🚪 독립하는 날 배웅' };
    for (const [k, n] of Object.entries(NAMES)) FM.Vig.KINDS['b_' + k] = n;
    const STAGE = { nightCry: 'BABY', firstMilk: 'BABY', firstSmile: 'BABY', firstBath: 'BABY', firstRoll: 'BABY', firstSteps: 'TODDLER', firstWord: 'TODDLER', dolJabi: 'TODDLER', firstTooth: 'TODDLER', wallArt: 'TODDLER', tantrum: 'TODDLER', firstSchool: 'CHILD', bike: 'CHILD', recital: 'CHILD', fever: 'CHILD', letter: 'CHILD', album: 'CHILD', sendOff: 'CHILD' };
    const origRun = FM.Vig.run;
    FM.Vig.run = function (kind) {
      if (typeof kind === 'string' && kind.startsWith('b_') && MAKE[kind.slice(2)]) {
        const k = kind.slice(2);
        let K = S().villagers.find(v => v.child && v.child.stage === STAGE[k]) || S().villagers.find(v => v.child);
        if (!K) { const ad = S().villagers.filter(v => !v.child); const a = ad.find(v => Soc.genderOf(v.id) === 'F'), b = ad.find(v => Soc.genderOf(v.id) === 'M'); if (a && b && Soc.makeChild) K = Soc.makeChild(a.id, b.id); }
        if (!K) return;
        if (K.child && K.child.stage !== STAGE[k]) { K.child.stage = K.child.growth_stage = STAGE[k]; FM.bus.emit('outfit', K); }
        if (k === 'sendOff') { const c = sendOff(Object.assign(Object.create(K), { grownUp: { parents: K.child.parents } })); c.resolve = null; return Cut.enqueue(c, true); }
        const c = MAKE[k](K); return Cut.enqueue(c, true);
      }
      return origRun(kind);
    };
  }
})();
