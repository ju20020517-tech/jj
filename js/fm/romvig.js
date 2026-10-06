/* =========================================================
 *  💘 연애 · 💍 결혼 · ⚖️ 이혼 · 🌧️ 우울 드라마 — 30편
 *   연애 10: 첫 데이트 대참사 · 기념일 깜빡 · 폰 속 의문의 하트 · 고백 연습 들킴 · 첫 손잡기
 *            커플템 대소동 · 노래방 연적 대결 · 몰래 연애 들킴 · 뽀뽀 직전 방해꾼 · 별 보며 하는 약속
 *   결혼 8: 반지 굴러간 프러포즈 · 떨리는 상견례 · 신혼 첫 요리 · 가계부 대첩 · 설거지 내기
 *            몰래 준비한 선물 · 결혼기념일 리마인드 웨딩 · 같은 꿈을 꾼 부부
 *   이혼 6: 말 없는 냉전 · 각방 쓰는 밤 · 이혼 서류 앞에서 · 마지막 저녁 식사 · 반려 화분 양육권 · 이혼 후 우연한 재회
 *   우울 6: 닫힌 방문 · 잠 못 드는 밤 · 마음 상담실 · 나에게 쓰는 편지 · 친구들의 도시락 · 다시 웃던 날
 *  · 연인 · 부부 · 위기 부부 · 우울한 주민 상태를 보고 매시간 하나씩 (종류 · 커플마다 쿨타임)
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, Cut = FM.Cut, W = FM.Will;
  if (!Sim || !Soc || !Cut) return;
  const P = 'P';
  const S = () => Sim.get();
  const day = () => Sim.time.day();
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const J = t => (FM.josa ? FM.josa(t) : t);
  const sty = (v, t) => (v && v.id !== P && W && W.sty ? W.sty(v, J(t)) : J(t));
  const has = (v, k) => Sim.has(v, k);
  const free = v => v && !v.sceneId && !v.talkingToPlayer && !(v.status && v.status.hospital) && !(v.act && v.act.id === 'sleep');
  const keyOf = cast => Object.values(cast).map(v => v.id).sort().join('|');
  const mk = (theme, cast, beats, o = {}) => Object.assign({ theme, cast, beats, key: keyOf(cast) + '|' + (o.sub || ''), vig: true }, o);
  const logD = (type, t, ids, imp = 2) => Sim.log(type, t, ids, imp, { newsKind: 'drama' });
  const rom = (a, b, n, why) => { if (Soc.addRomance) { Soc.addRomance(a.id, b.id, n, why); Soc.addRomance(b.id, a.id, n, why); } };
  const fr = (a, b, n, t = n) => { Soc.addFriend(a.id, b.id, n, t); Soc.addFriend(b.id, a.id, n, t); };
  const mar = (a) => Soc.marriageOf && Soc.marriageOf(a.id);
  const sat = (a, n) => { const m = mar(a); if (m) m.marital_satisfaction = clamp((m.marital_satisfaction || 60) + n, 0, 100); };
  const bored = (a, b, n) => { const r = Soc.rel(a.id, b.id); r.boredom = clamp((r.boredom || 0) + n, 0, 100); };
  const dep = (v, n) => { v.depression = clamp((v.depression || 0) + n, 0, 100); v.stress = clamp((v.stress || 0) + n * 0.6, 0, 100); };
  const mem = (v, t) => { if (W && W.remember && v.id !== P) W.remember(v, 'love', t); };
  const V = { plaza: { loc: 'island', x: 3, z: 19, place: 'plaza' }, park: { loc: 'island', x: -84, z: 24, place: 'park' }, cliff: { loc: 'island', x: -72, z: -86, place: 'cliff' }, beach: { loc: 'island', x: -36, z: 86, place: 'beach' }, lighthouse: { loc: 'island', x: 119.5, z: 36, place: 'lighthouse' }, obs: { loc: 'island', x: 70, z: -84, place: 'observatory' } };
  const home = (a) => (a.home && FM.INTERIORS[a.home] ? { loc: a.home } : V.plaza);
  const RV = (FM.RomVig = {});
  const D2 = {};   // 이름 → 함수

  // =========================================================
  // 💘 연애 (A · B 연인)
  // =========================================================
  D2.dateDisaster = (A, B) => { const c = mk('confess', { A, B }, [
    { narr: '(오늘은 첫 데이트. 둘 다 밤새 데이트 코스를 짰다)', who: '해설', icon: '💘', shot: ['wide'] },
    { say: 'A', text: sty(A, '오, 오늘 진짜 예쁘다… 아니 멋있다! 아니 둘 다!') }, { fx: 'sweat', at: 'A' },
    { narr: '(…그때 갑자기 소나기가 쏟아졌다. 우산은 하나도 없다)', who: '해설', icon: '🌧️' }, { fx: 'flash' },
    { poses: [['A', 'surprise'], ['B', 'surprise']], t: 900 }, { say: 'B', text: sty(B, '…푸핫! 우리 완전 물에 빠진 생쥐 같아!') },
    { poses: [['A', 'cheer'], ['B', 'cheer']], t: 1200 }, { say: 'A', text: sty(A, '망한 데이트인데… 왜 이렇게 웃기지? 이상하게 좋다.') }, { fx: 'hearts', at: 'B' },
    { outcome: 'happy', endText: ['☔ 첫 데이트 대참사', '망해서 더 기억에 남는 날'] }], { venue: V.park, sub: '첫 데이트 대참사' });
    c.resolve = () => { rom(A, B, 10, '첫 데이트'); mem(A, `${B.name}와(과) 비 맞은 첫 데이트`); logD('date', `☔ ${A.name}♥${B.name}의 첫 데이트, 소나기에 홀딱 젖고도 웃었대요`, [A.id, B.id]); }; return c; };
  D2.forgotAnniv = (A, B) => { const c = mk('jealous', { A, B }, [
    { narr: `(사귄 지 100일. ${B.name}은(는) 케이크까지 준비했는데…)`, who: '해설', icon: '🎂', shot: ['wide'] }, { prop: { kind: 'cake', x: 0.4, z: 0.6, id: 'ck' } },
    { say: 'A', text: sty(A, '어? 웬 케이크야? 누구 생일이야?') }, { fx: 'shock' }, { emo: 'B', e: '💢' },
    { say: 'B', text: sty(B, '…오늘 100일이거든?!'), hot: true }, { pose: 'A', p: 'freeze', t: 1100 },
    { say: 'A', text: sty(A, '아, 아니야! 알고 있었어! 선물이… 선물이 지금 오는 중이야!') }, { pose: 'A', p: 'kneel', t: 1200 },
    { say: 'B', text: sty(B, '…거짓말인 거 다 알아. 대신 내일 하루 종일 내 말 들어야 해.') }, { emo: 'A', e: '😅' }, { unprop: 'ck' },
    { outcome: 'happy', endText: ['🎂 기념일 깜빡', '100일의 위기, 간신히 생존'] }], { venue: home(B), sub: '기념일 깜빡' });
    c.resolve = () => { bored(A, B, 6); rom(B, A, -3, '기념일 깜빡'); logD('romance', `🎂 ${A.name}이(가) ${B.name}와(과)의 100일을 깜빡했대요…`, [A.id, B.id], 1); }; return c; };
  D2.phoneHeart = (A, B, C) => { const c = mk('jealous', { A, B, C }, [
    { narr: `(${A.name}의 폰에 "💗"가 잔뜩 달린 메시지가 떴다. 보낸 사람: ${C.name})`, who: '해설', icon: '📱', shot: ['wide'] },
    { pose: 'B', p: 'glare', t: 1100 }, { say: 'B', text: sty(B, `…${C.name}이(가) 왜 너한테 하트를 보내?`), hot: true },
    { say: 'A', text: sty(A, '어? 아, 그거 단체방에 보낸 거…') }, { show: 'C' }, { move: ['C', 1.5, 0.3], run: true, t: 1000 },
    { say: 'C', text: sty(C, '아 그거! 내가 이모티콘 잘못 눌렀어! 원래 엄지척 보내려던 거야!') }, { fx: 'shock' },
    { poses: [['A', 'facepalm'], ['B', 'facepalm']], t: 1100 }, { say: 'B', text: sty(B, '…괜히 혼자 질투했잖아. 창피해.') },
    { outcome: 'happy', endText: ['📱 폰 속 의문의 하트', '범인은 엄지 대신 누른 하트'] }], { venue: V.plaza, slots: { A: [-0.8, 0], B: [0.8, 0], C: [3, 1] }, hidden: ['C'], sub: '폰 속 의문의 하트' });
    c.resolve = () => { rom(A, B, 4, '오해 풀림'); fr(B, C, 2); logD('jealous', `📱 ${B.name}이(가) ${A.name}의 폰에 온 하트에 질투했지만… 오타였대요`, [A.id, B.id, C.id], 1); }; return c; };
  D2.confessPractice = (A, B) => { const c = mk('confess', { A, B }, [
    { narr: `(${A.name}이(가) 나무 앞에서 고백 연습 중이다)`, who: '해설', icon: '🌳', shot: ['wide'] },
    { say: 'A', text: sty(A, `(나무에게) ${B.name}… 처음 본 순간부터… 아니야, 너무 느끼해. 다시!`) }, { pose: 'A', p: 'kneel', t: 1100 },
    { say: 'A', text: sty(A, `${B.name}! 나랑 사귀어 줘! …좋아, 이번엔 괜찮았어.`), hot: true },
    { show: 'B' }, { say: 'B', text: sty(B, '…응. 좋아.') }, { fx: 'shock' }, { pose: 'A', p: 'surprise', t: 1000 },
    { say: 'A', text: sty(A, '어, 언제부터 거기 있었어?!') }, { say: 'B', text: sty(B, '"처음 본 순간부터"부터.') }, { pose: 'A', p: 'hideFace', t: 1300 }, { fx: 'hearts', at: 'A' },
    { outcome: 'happy', endText: ['🌳 고백 연습 들킴', '연습이 실전이 됐다'] }], { venue: V.park, slots: { A: [-0.4, 0], B: [1.6, 0.8] }, hidden: ['B'], sub: '고백 연습 들킴' });
    c.resolve = () => { rom(A, B, 12, '고백'); if (Soc.rel(A.id, B.id).status !== 'DATING' && Soc.canRomance(A.id, B.id) && Soc.startDating) try { Soc.startDating(A.id, B.id); } catch (e) { /* */ } logD('couple', `🌳 ${A.name}의 고백 연습을 ${B.name}이(가) 다 들어 버렸어요… 그리고 OK!`, [A.id, B.id], 3); }; return c; };
  D2.firstHand = (A, B) => { const c = mk('confess', { A, B }, [
    { narr: '(노을 지는 산책길. 손등이 자꾸 스친다…)', who: '해설', icon: '🤝', shot: ['wide'] },
    { poses: [['A', 'look'], ['B', 'look']], t: 1100 }, { say: 'A', text: sty(A, '(…잡을까? 말까? 잡을까?)') }, { fx: 'sweat', at: 'A' },
    { say: 'B', text: sty(B, '…답답해서 내가 잡는다.') }, { poses: [['A', 'hug'], ['B', 'hug']], t: 1300 }, { emo: 'A', e: '😳' },
    { say: 'A', text: sty(A, '손이… 따뜻하다.') }, { fx: 'hearts', at: 'B' },
    { outcome: 'happy', endText: ['🤝 첫 손잡기', '심장 소리가 손으로 전해졌다'] }], { venue: V.cliff, sub: '첫 손잡기' });
    c.resolve = () => { rom(A, B, 8, '손잡기'); bored(A, B, -10); }; return c; };
  D2.coupleItem = (A, B) => { const c = mk('fashion', { A, B }, [
    { narr: '(커플템을 맞추기로 한 두 사람… 그런데 취향이 정반대다)', who: '해설', icon: '👕', shot: ['wide'] },
    { say: 'A', text: sty(A, '이거! 핑크 하트 티셔츠! 너무 귀엽지?!') }, { say: 'B', text: sty(B, '…난 검은색 무지가 좋은데.') },
    { poses: [['A', 'glare'], ['B', 'glare']], t: 1100 }, { narr: '(30분째 대치 중…)', who: '해설', icon: '⏳' },
    { say: 'B', text: sty(B, '…알았어. 하트 티셔츠. 대신 너도 내 검은 모자 써.') }, { poses: [['A', 'cheer'], ['B', 'tryon']], t: 1300 },
    { outcome: 'happy', endText: ['👕 커플템 대소동', '하트 티셔츠 + 검은 모자 = 섬 최강 커플룩'] }], { venue: { loc: 'mall_in' }, sub: '커플템 대소동' });
    c.resolve = () => { rom(A, B, 5, '커플템'); A.outfit = B.outfit = 'couple'; A.coupleHue = B.coupleHue = (Math.random() * 3) | 0; FM.bus.emit('outfit', A); FM.bus.emit('outfit', B); }; return c; };
  D2.karaokeDuel = (A, B, C) => { const c = mk('triangle', { A, B, C }, [
    { narr: `(${A.name}을(를) 두고 ${B.name}와(과) ${C.name}의 노래방 대결이 열렸다!)`, who: '해설', icon: '🎤', shot: ['wide'] },
    { pose: 'B', p: 'sing', t: 1500 }, { say: 'B', text: sty(B, '♪ 너만을 사랑해~ 오직 너만을~ ♪') }, { fx: 'sparkle', at: 'B' },
    { pose: 'C', p: 'sing', t: 1500 }, { say: 'C', text: sty(C, '♪ 내가 더 사랑해~ 백 배 더~ ♪ (삑사리)') }, { fx: 'shock' },
    { say: 'A', text: sty(A, '…둘 다 그만! 귀 아파! 그리고 나 노래 잘하는 사람이 이상형 아니거든?!'), hot: true },
    { poses: [['B', 'facepalm'], ['C', 'facepalm']], t: 1200 },
    { outcome: 'happy', endText: ['🎤 노래방 연적 대결', '승자: 없음. 고막: 패배'] }], { venue: { loc: 'club_in' }, sub: '노래방 연적 대결' });
    c.resolve = () => { Soc.addFriend(B.id, C.id, -3, -2); Soc.addFriend(A.id, B.id, 3, 1); logD('triangle', `🎤 ${A.name}을(를) 두고 ${B.name}와(과) ${C.name}의 노래방 대결! …결과는 모두 패배`, [A.id, B.id, C.id], 2); }; return c; };
  D2.secretDate = (A, B, C) => { const c = mk('affair', { A, B, C }, [
    { narr: `(아무도 모르게 사귀던 ${A.name}와(과) ${B.name}… 등대 뒤에서 몰래 만났는데)`, who: '해설', icon: '🤫', shot: ['wide'] },
    { say: 'A', text: sty(A, '쉿! 여기선 아무도 안 와.') }, { show: 'C' }, { move: ['C', 0.9, 1], t: 1000 }, { fx: 'shock' },
    { say: 'C', text: sty(C, `…어? 너희… 둘이?!`), hot: true }, { poses: [['A', 'freeze'], ['B', 'freeze']], t: 1100 },
    { say: 'B', text: sty(B, '…들켰다. 그래, 우리 사귀어!') }, { say: 'C', text: sty(C, '…축하해! 근데 이건 내일 아침이면 섬 전체가 알게 될 거야.') },
    { outcome: 'happy', endText: ['🤫 몰래 연애 들킴', '비밀 연애 종료, 공개 연애 시작'] }], { venue: V.lighthouse, slots: { A: [-0.6, 0], B: [0.6, 0], C: [3, 2] }, hidden: ['C'], sub: '몰래 연애 들킴' });
    c.resolve = () => { rom(A, B, 4); logD('couple', `🤫 ${A.name}와(과) ${B.name}이(가) 몰래 사귀다가 ${C.name}에게 딱 걸렸어요!`, [A.id, B.id, C.id], 2); }; return c; };
  D2.kissInterrupt = (A, B, C) => { const c = mk('confess', { A, B, C }, [
    { narr: '(분위기 최고. 둘의 거리가 점점 가까워지는데…)', who: '해설', icon: '💋', shot: ['wide'] },
    { poses: [['A', 'look'], ['B', 'look']], t: 1200 }, { shot: ['close', 'A'], t: 900 },
    { show: 'C' }, { say: 'C', text: sty(C, '얘들아~!! 타코야키 먹을 사람~?!'), hot: true }, { fx: 'flash' },
    { poses: [['A', 'surprise'], ['B', 'surprise']], t: 1000 }, { say: 'A', text: sty(A, `…${C.name}… 타이밍 진짜…`) },
    { say: 'C', text: sty(C, '응? 왜? 둘이 왜 얼굴이 빨개?') }, { emo: 'B', e: '😳' },
    { outcome: 'happy', endText: ['💋 뽀뽀 직전 방해꾼', '눈치 제로 친구의 습격'] }], { venue: V.beach, slots: { A: [-0.5, 0], B: [0.5, 0], C: [2.8, 1] }, hidden: ['C'], sub: '뽀뽀 직전 방해꾼' });
    c.resolve = () => { rom(A, B, 6); }; return c; };
  D2.starPromise = (A, B) => { const c = mk('fate', { A, B }, [
    { filter: 'night' }, { narr: '(천문대 언덕, 쏟아질 듯한 별 아래)', who: '해설', icon: '🌌', shot: ['wide'] },
    { poses: [['A', 'lookUp'], ['B', 'lookUp']], t: 1400 }, { say: 'B', text: sty(B, '저 별 이름 우리가 지을까?') },
    { say: 'A', text: sty(A, `"${A.name}${B.name}별"? …촌스럽다. 그래도 좋아.`) }, { fx: 'glow' },
    { say: 'B', text: sty(B, '십 년 뒤에도 같이 이 별 보러 오자. 약속.') }, { poses: [['A', 'highfive'], ['B', 'highfive']], t: 1200 }, { filter: '' },
    { outcome: 'happy', endText: ['🌌 별 보며 하는 약속', '십 년 뒤에도 여기서'] }], { venue: V.obs, sub: '별 보며 하는 약속' });
    c.resolve = () => { rom(A, B, 8); bored(A, B, -15); }; return c; };

  // =========================================================
  // 💍 결혼 (A · B 연인/부부)
  // =========================================================
  D2.ringRoll = (A, B) => { const c = mk('propose', { A, B }, [
    { narr: `(${A.name}이(가) 주머니에서 반지 상자를 꺼냈다. 손이 덜덜 떨린다)`, who: '해설', icon: '💍', shot: ['wide'] },
    { pose: 'A', p: 'kneel', t: 1200 }, { say: 'A', text: sty(A, `${B.name}… 나, 나랑…`) }, { fx: 'flash' },
    { narr: '(때굴때굴… 반지가 굴러서 하수구 쪽으로!!)', who: '해설', icon: '😱' }, { poses: [['A', 'surprise'], ['B', 'surprise']], t: 900 },
    { poses: [['A', 'crouch'], ['B', 'crouch']], t: 1300 }, { say: 'B', text: sty(B, '잡았다!! …그리고 대답은 "응"이야!'), hot: true },
    { poses: [['A', 'hug'], ['B', 'hug']], t: 1600 }, { fx: 'fireworks' },
    { outcome: 'happy', endText: ['💍 반지 굴러간 프러포즈', '반지는 그녀가 직접 주웠다'] }], { venue: V.lighthouse, sub: '반지 굴러간 프러포즈' });
    c.resolve = () => { rom(A, B, 15, '프러포즈'); const r = Soc.rel(A.id, B.id); r.engagedTalk = day(); logD('engage', `💍 ${A.name}의 프러포즈! 반지가 굴러갔지만 ${B.name}이(가) 직접 주워서 "응"`, [A.id, B.id], 3); }; return c; };
  D2.inLaws = (A, B, C) => { const c = mk('wedding', { A, B, C }, [
    { narr: `(떨리는 상견례 자리. ${C.name}이(가) 어른 대표로 나왔다)`, who: '해설', icon: '🍵', shot: ['wide'] }, { prop: { kind: 'table', x: 0, z: 0.4, id: 'tb' } },
    { say: 'C', text: sty(C, `그래, ${A.name}. 우리 ${B.name}을(를) 왜 좋아하나?`) }, { fx: 'sweat', at: 'A' },
    { say: 'A', text: sty(A, '…웃을 때 눈이 없어지는 거요! 아, 아니 성실하고 착하고…!') }, { emo: 'B', e: '😳' },
    { pose: 'C', p: 'look', t: 900 }, { say: 'C', text: sty(C, '…허허허! 정답이야. 나도 그거 때문에 이 아이를 아끼지.') },
    { poses: [['A', 'bow'], ['B', 'bow']], t: 1200 }, { unprop: 'tb' },
    { outcome: 'happy', endText: ['🍵 떨리는 상견례', '합격 이유: 눈이 없어지는 웃음'] }], { venue: { loc: 'tea_in' }, sub: '떨리는 상견례' });
    c.resolve = () => { fr(A, C, 6); rom(A, B, 5); }; return c; };
  D2.firstCook = (A, B) => { const c = mk('baby', { A, B }, [
    { narr: '(신혼 첫 아침. 아내/남편을 위해 요리에 도전!)', who: '해설', icon: '🍳', shot: ['wide'] },
    { pose: 'A', p: 'cook', t: 1500 }, { fx: 'flash' }, { narr: '(…연기가 자욱하다. 화재경보기가 울린다)', who: '해설', icon: '🚨' },
    { show: 'B' }, { say: 'B', text: sty(B, '콜록콜록! 무슨 일이야?!') }, { say: 'A', text: sty(A, '…계란 프라이가 숯이 됐어.') },
    { pose: 'B', p: 'eat', t: 1300 }, { say: 'B', text: sty(B, '…음. 바삭하네. 세상에서 제일 맛있는 숯이야.') }, { fx: 'hearts', at: 'A' },
    { outcome: 'happy', endText: ['🍳 신혼 첫 요리', '사랑이 최고의 조미료 (숯 맛)'] }], { venue: home(A), slots: { A: [0, 0], B: [2.4, 0.8] }, hidden: ['B'], sub: '신혼 첫 요리' });
    c.resolve = () => { sat(A, 6); rom(A, B, 4); }; return c; };
  D2.budgetWar = (A, B) => { const c = mk('fight', { A, B }, [
    { narr: '(가계부를 펼친 순간… 정체불명의 지출이 발견됐다)', who: '해설', icon: '📒', shot: ['wide'] },
    { say: 'A', text: sty(A, '"타코야키 47만 코인"…? 이게 뭐야?!'), hot: true }, { pose: 'B', p: 'hideFace', t: 1100 },
    { say: 'B', text: sty(B, '그게… 매일 한 판씩… 1년 치…') }, { pose: 'A', p: 'facepalm', t: 1100 },
    { say: 'A', text: sty(A, '…나도 고백할게. "인형 뽑기 38만 코인".') }, { fx: 'shock' }, { poses: [['A', 'look'], ['B', 'look']], t: 900 },
    { say: 'B', text: sty(B, '…우리 둘 다 정신 차리자. 오늘부터 용돈제!') }, { poses: [['A', 'highfive'], ['B', 'highfive']], t: 1100 },
    { outcome: 'happy', endText: ['📒 가계부 대첩', '둘 다 범인이었다'] }], { venue: home(A), sub: '가계부 대첩' });
    c.resolve = () => { sat(A, 2); const m = mar(A); if (m) m.shared_budget = (m.shared_budget || 0) + 500; }; return c; };
  D2.dishes = (A, B) => { const c = mk('party', { A, B }, [
    { narr: '(산더미 같은 설거지. 가위바위보로 정하기로 했다)', who: '해설', icon: '🍽️', shot: ['wide'] },
    { say: 'A', text: sty(A, '가위바위보! …아 잠깐 삼세판!') }, { say: 'B', text: sty(B, '오세판! …아니 칠세판!') },
    { narr: '(…스물세 판째. 설거지 물은 이미 식었다)', who: '해설', icon: '⏳' },
    { poses: [['A', 'sweep'], ['B', 'sweep']], t: 1500 }, { say: 'A', text: sty(A, '…그냥 같이 하자. 이게 제일 빨라.') }, { fx: 'sparkle', at: 'A' },
    { outcome: 'happy', endText: ['🍽️ 설거지 내기', '결론: 같이 하면 금방'] }], { venue: home(A), sub: '설거지 내기' });
    c.resolve = () => { sat(A, 4); bored(A, B, -5); }; return c; };
  D2.secretGift = (A, B) => { const c = mk('party', { A, B }, [
    { narr: `(${A.name}이(가) 몰래 선물을 준비 중이다. 그런데 ${B.name}도…?)`, who: '해설', icon: '🎁', shot: ['wide'] },
    { say: 'A', text: sty(A, '서프라이즈! 네가 갖고 싶다던 시계!') }, { say: 'B', text: sty(B, '서프라이즈! …네 시곗줄. 시계 사려고 내 시계 팔았는데.') },
    { fx: 'shock' }, { say: 'A', text: sty(A, '…나는 시계 사려고 네가 아끼던 기타 줄 팔았어…') }, { poses: [['A', 'facepalm'], ['B', 'facepalm']], t: 1100 },
    { say: 'B', text: sty(B, '…푸하하! 우리 완전 동화책 같아.') }, { poses: [['A', 'hug'], ['B', 'hug']], t: 1500 }, { fx: 'hearts', at: 'A' },
    { outcome: 'happy', endText: ['🎁 몰래 준비한 선물', '선물은 엇갈려도 마음은 같았다'] }], { venue: home(A), sub: '몰래 준비한 선물' });
    c.resolve = () => { sat(A, 8); rom(A, B, 6); }; return c; };
  D2.renewal = (A, B, guests) => { const ks = ['C', 'D'].slice(0, guests.length); const cast = Object.assign({ A, B }, Object.fromEntries(ks.map((k, i) => [k, guests[i]]))); const c = mk('wedding', cast, [
    { narr: '(결혼기념일. 친구들이 몰래 성당을 꾸며 놓았다)', who: '해설', icon: '💒', shot: ['wide'] }, { prop: { kind: 'petals', x: 0, z: 0, id: 'pt' } },
    ...ks.map(k => ({ show: k, t: 100 })), { say: ks[0] || 'A', text: sty(guests[0] || A, '리마인드 웨딩 서프라이즈~!'), hot: true },
    { poses: [['A', 'surprise'], ['B', 'surprise']], t: 1000 }, { say: 'B', text: sty(B, '…처음 결혼할 때보다 더 떨려.') }, { say: 'A', text: sty(A, '나도. 다시 해도 너야.') },
    { poses: [['A', 'hug'], ['B', 'hug']], t: 1500 }, { fx: 'fireworks' }, { unprop: 'pt' },
    { outcome: 'happy', endText: ['💒 리마인드 웨딩', '다시 해도 너야'] }], { venue: { loc: 'cathedral_in' }, hidden: ks, sub: '리마인드 웨딩' });
    c.resolve = () => { sat(A, 15); rom(A, B, 10); for (const g of guests) { fr(A, g, 4); fr(B, g, 4); } logD('wedding', `💒 ${A.name}♥${B.name} 부부의 결혼기념일, 친구들이 리마인드 웨딩을 열어 줬어요`, [A.id, B.id].concat(guests.map(g => g.id)), 2); }; return c; };
  D2.sameDream = (A, B) => { const c = mk('fate', { A, B }, [
    { narr: '(아침. 둘이 동시에 눈을 떴다)', who: '해설', icon: '🌅', shot: ['wide'] },
    { say: 'A', text: sty(A, '…나 이상한 꿈 꿨어. 우리가 할머니 할아버지가 돼서…') }, { say: 'B', text: sty(B, '…바닷가에서 손잡고 걷는 꿈? 나도 꿨어.') },
    { fx: 'shock' }, { poses: [['A', 'look'], ['B', 'look']], t: 1100 }, { say: 'A', text: sty(A, '…그 꿈, 진짜로 만들자.') }, { fx: 'glow' },
    { outcome: 'happy', endText: ['🌅 같은 꿈을 꾼 부부', '꿈에서도 너였어'] }], { venue: home(A), sub: '같은 꿈을 꾼 부부' });
    c.resolve = () => { sat(A, 6); }; return c; };

  // =========================================================
  // ⚖️ 이혼 (위기 부부)
  // =========================================================
  D2.coldWar = (A, B) => { const c = mk('fight', { A, B }, [
    { narr: '(사흘째 한 마디도 안 하는 부부. 식탁엔 숟가락 소리만)', who: '해설', icon: '🥶', shot: ['wide'] },
    { poses: [['A', 'eat'], ['B', 'eat']], t: 1500 }, { say: 'A', text: sty(A, '…소금.') }, { say: 'B', text: sty(B, '…(소금을 반대쪽 끝에 놓는다)') },
    { emo: 'A', e: '💢' }, { narr: '(고양이도 눈치를 보는 냉랭한 공기…)', who: '해설', icon: '❄️' },
    { outcome: 'sad', endText: ['🥶 말 없는 냉전', '소금보다 짠 침묵'] }], { venue: home(A), sub: '말 없는 냉전' });
    c.resolve = () => { sat(A, -8); bored(A, B, 10); }; return c; };
  D2.separateRooms = (A, B) => { const c = mk('divorce', { A, B }, [
    { filter: 'night' }, { narr: '(오늘 밤부터 각방을 쓰기로 했다)', who: '해설', icon: '🚪', shot: ['wide'] },
    { pose: 'A', p: 'lie', t: 1300 }, { say: 'A', text: sty(A, '…넓어서 좋네. …너무 넓다.') }, { pose: 'B', p: 'lie', t: 1300 },
    { say: 'B', text: sty(B, '(벽 너머) …잘 자. …라고 말할 뻔했다.') }, { split: ['A', 'B'], caps: ['🛏️', '🛏️'], t: 2000 }, { filter: '' },
    { outcome: 'sad', endText: ['🚪 각방 쓰는 밤', '벽 하나가 바다만큼 멀다'] }], { venue: home(A), slots: { A: [-1.5, 0], B: [1.5, 0] }, sub: '각방 쓰는 밤' });
    c.resolve = () => { sat(A, -6); for (const v of [A, B]) dep(v, 6); }; return c; };
  D2.divorcePaper = (A, B) => { const reconcile = chance(0.5); const c = mk('divorce', { A, B }, [
    { narr: '(시청 민원 창구. 이혼 서류에 펜을 올렸다)', who: '해설', icon: '📄', shot: ['wide'] }, { prop: { kind: 'letter', x: 0, z: 0.5, id: 'lt' } },
    { pose: 'A', p: 'write', t: 1300 }, { say: 'A', text: sty(A, '…여기 서명하면 끝이네.') }, { pose: 'B', p: 'look', t: 900 },
    { say: 'B', text: sty(B, '…우리 처음 만났을 때 기억나? 너 그때 분수에 빠졌잖아.') },
    ...(reconcile ? [{ emo: 'A', e: '🥹' }, { say: 'A', text: sty(A, '…펜이 안 움직여. 우리, 한 번만 더 해 보자.') }, { poses: [['A', 'hug'], ['B', 'hug']], t: 1500 }, { unprop: 'lt' }, { outcome: 'happy', endText: ['📄 이혼 서류 앞에서', '펜은 끝내 움직이지 않았다'] }]
      : [{ say: 'A', text: sty(A, '…기억나. 그래서 더 슬퍼.') }, { pose: 'A', p: 'write', t: 1200 }, { unprop: 'lt' }, { outcome: 'sad', endText: ['📄 이혼 서류 앞에서', '서명 두 줄로 끝난 이야기'] }]),
  ], { venue: { loc: 'hall_in' }, sub: '이혼 서류 앞에서' });
    c.resolve = () => {
      const m = mar(A);
      if (reconcile) { if (m) { m.marital_satisfaction = 55; m.lowDays = 0; m.divorceAsked = false; } bored(A, B, -40); logD('rel', `📄 이혼 서류 앞에서 ${A.name}와(과) ${B.name}이(가) 다시 해 보기로 했어요`, [A.id, B.id], 3); }
      else { const r = Soc.rel(A.id, B.id); if (Soc.doBreakup) try { Soc.doBreakup(r, 'PERSONALITY_CLASH'); } catch (e) { /* */ } if (m) m.marriage_stage = 'DIVORCED'; for (const v of [A, B]) dep(v, 15); logD('divorce', `⚖️ ${A.name}와(과) ${B.name}이(가) 결국 이혼 서류에 서명했어요…`, [A.id, B.id], 3); }
    }; return c; };
  D2.lastDinner = (A, B) => { const c = mk('divorce', { A, B }, [
    { narr: '(이혼 전날 밤, 마지막으로 함께하는 저녁)', who: '해설', icon: '🕯️', shot: ['wide'] }, { prop: { kind: 'candles', x: 0, z: 0.4, id: 'cd' } },
    { poses: [['A', 'eat'], ['B', 'eat']], t: 1400 }, { say: 'B', text: sty(B, '…네가 제일 좋아하던 된장찌개야.') },
    { say: 'A', text: sty(A, '…맛있다. 이 맛, 꽤 오래 생각날 것 같아.') }, { pose: 'B', p: 'wipeTear', t: 1300 },
    { say: 'B', text: sty(B, '…행복해야 해. 진심이야.') }, { unprop: 'cd' },
    { outcome: 'sad', endText: ['🕯️ 마지막 저녁 식사', '끝까지 따뜻했던 찌개'] }], { venue: home(A), sub: '마지막 저녁 식사' });
    c.resolve = () => { fr(A, B, 6, 4); }; return c; };
  D2.plantCustody = (A, B, J0) => { const c = mk('divorce', { A, B, C: J0 }, [
    { narr: `(법정에 선 두 사람. 쟁점은 단 하나 — 반려 화분 "초록이"의 양육권)`, who: '해설', icon: '🪴', shot: ['wide'] },
    { say: 'A', text: sty(A, '초록이는 제가 매일 물을 줬습니다!'), hot: true }, { say: 'B', text: sty(B, '말도 안 돼요! 초록이한테 노래 불러 준 건 저예요!') },
    { say: 'C', text: sty(J0, '…그럼 초록이에게 직접 물어보겠습니다.') }, { fx: 'shock' }, { narr: '(…초록이는 말이 없다. 화분이니까)', who: '해설', icon: '🌱' },
    { say: 'C', text: sty(J0, '판결! 초록이는 주말마다 번갈아 키우세요. 땅땅땅!') }, { poses: [['A', 'facepalm'], ['B', 'facepalm']], t: 1200 },
    { outcome: 'sad', endText: ['🪴 반려 화분 양육권', '이혼해도 초록이는 자란다'] }], { venue: { loc: 'hall_in' }, slots: { A: [-0.9, 0.2], B: [0.9, 0.2], C: [0, -1.3] }, sub: '반려 화분 양육권' });
    c.resolve = () => { logD('divorce', `🪴 ${A.name}와(과) ${B.name}의 반려 화분 "초록이" 양육권 재판… 주말마다 번갈아 키우기로`, [A.id, B.id, J0.id], 2); }; return c; };
  D2.exReunion = (A, B) => { const c = mk('reunion', { A, B }, [
    { narr: '(이혼하고 한참 뒤, 비 오는 버스 정류장에서 우연히 마주쳤다)', who: '해설', icon: '☔', shot: ['wide'] }, { prop: { kind: 'umbrella', x: 0.3, z: 0.1, id: 'um' } },
    { poses: [['A', 'surprise'], ['B', 'surprise']], t: 1000 }, { say: 'A', text: sty(A, '…잘 지냈어?') }, { say: 'B', text: sty(B, '…응. 너는? 아직 우산 안 들고 다니는구나.') },
    { say: 'A', text: sty(A, '…너 없으니까 챙겨 주는 사람이 없어서.') }, { emo: 'B', e: '🥹' },
    { say: 'B', text: sty(B, '…같이 쓰자. 정류장까지만.') }, { fx: 'glow' }, { unprop: 'um' },
    { outcome: 'happy', endText: ['☔ 이혼 후 우연한 재회', '정류장까지만, 이었을까'] }], { venue: V.plaza, sub: '이혼 후 우연한 재회' });
    c.resolve = () => { fr(A, B, 10, 8); if (Soc.canRomance(A.id, B.id)) rom(A, B, 8, '재회'); }; return c; };

  // =========================================================
  // 🌧️ 우울 (A: 우울한 주민, B · C: 친구)
  // =========================================================
  D2.closedDoor = (A, B) => { const c = mk('umbrella', { A, B }, [
    { narr: `(${A.name}이(가) 사흘째 방에서 나오지 않는다)`, who: '해설', icon: '🚪', shot: ['wide'] },
    { pose: 'A', p: 'sadSit', t: 1400 }, { say: 'A', text: sty(A, '…아무것도 하기 싫어. 그냥 다 귀찮아.') },
    { show: 'B' }, { pose: 'B', p: 'knockHesitate', t: 1300 }, { say: 'B', text: sty(B, `${A.name}… 문 안 열어도 돼. 그냥 여기 앉아 있을게.`) },
    { narr: '(한 시간 뒤… 문이 아주 조금 열렸다)', who: '해설', icon: '🔓' }, { say: 'A', text: sty(A, '…들어와. 아직 아무 말도 하기 싫지만.') },
    { outcome: 'happy', endText: ['🚪 닫힌 방문', '문 앞을 지켜 준 한 사람'] }], { venue: home(A), slots: { A: [0, -0.5], B: [1.8, 1.2] }, hidden: ['B'], sub: '닫힌 방문' });
    c.resolve = () => { dep(A, -10); fr(A, B, 8); }; return c; };
  D2.insomnia = (A, B) => { const c = mk('umbrella', { A, B }, [
    { filter: 'night' }, { narr: '(새벽 3시. 잠이 오지 않아 밖으로 나왔다)', who: '해설', icon: '🌙', shot: ['wide'] },
    { pose: 'A', p: 'sit', t: 1200 }, { say: 'A', text: sty(A, '…다들 자는데 나만 깨어 있는 것 같아.') },
    { show: 'B' }, { say: 'B', text: sty(B, '…나도 못 자. 같이 별이나 볼래?') }, { poses: [['A', 'lookUp'], ['B', 'lookUp']], t: 1500 },
    { say: 'A', text: sty(A, '…혼자가 아니라서 다행이다.') }, { fx: 'glow' }, { filter: '' },
    { outcome: 'happy', endText: ['🌙 잠 못 드는 밤', '같이 깨어 있어 준 사람'] }], { venue: V.park, slots: { A: [0, 0], B: [1.2, 0.3] }, hidden: ['B'], sub: '잠 못 드는 밤' });
    c.resolve = () => { dep(A, -6); fr(A, B, 6); }; return c; };
  D2.therapy = (A, B) => { const c = mk('umbrella', { A, B }, [
    { narr: `(${B.name}의 손에 이끌려 메디컬 센터 상담실에 왔다)`, who: '해설', icon: '🩺', shot: ['wide'] },
    { say: 'A', text: sty(A, '…이런 데 오는 거, 약한 사람이나 하는 줄 알았어.') }, { say: 'B', text: sty(B, '감기 걸리면 병원 가잖아. 마음도 똑같아.') },
    { pose: 'A', p: 'sit', t: 1300 }, { narr: '(상담을 마치고 나온 표정이 아주 조금 가벼워졌다)', who: '해설', icon: '🌤️' },
    { say: 'A', text: sty(A, '…다음 주에도 같이 와 줄래?') }, { poses: [['A', 'hug'], ['B', 'hug']], t: 1300 },
    { outcome: 'happy', endText: ['🩺 마음 상담실', '마음도 치료가 필요해'] }], { venue: { loc: 'med_in' }, sub: '마음 상담실' });
    c.resolve = () => { dep(A, -15); fr(A, B, 6); }; return c; };
  D2.letterToSelf = (A) => { const c = mk('umbrella', { A }, [
    { narr: `(${A.name}이(가) 일기장에 편지를 쓴다. 받는 사람은… 나 자신)`, who: '해설', icon: '✏️', shot: ['wide'] },
    { pose: 'A', p: 'write', t: 1500 }, { narr: '("요즘 많이 힘들었지. 그래도 오늘 일어나서 세수한 거, 그거 엄청 잘한 거야.")', who: A.name, icon: '📔' },
    { narr: '("남들이랑 비교하지 마. 넌 너의 속도로 가면 돼.")', who: A.name, icon: '📔' },
    { pose: 'A', p: 'wipeTear', t: 1300 }, { say: 'A', text: sty(A, '…고마워, 나.') }, { fx: 'sparkle', at: 'A' },
    { outcome: 'happy', endText: ['✏️ 나에게 쓰는 편지', '오늘의 나를 칭찬하기'] }], { venue: home(A), sub: '나에게 쓰는 편지' });
    c.resolve = () => { dep(A, -8); }; return c; };
  D2.lunchbox = (A, list) => { const ks = ['B', 'C', 'D'].slice(0, list.length); const cast = Object.assign({ A }, Object.fromEntries(ks.map((k, i) => [k, list[i]]))); const c = mk('party', cast, [
    { narr: `(밥을 잘 안 먹는다는 ${A.name}… 친구들이 도시락을 싸 들고 왔다)`, who: '해설', icon: '🍱', shot: ['wide'] },
    ...ks.map(k => ({ show: k, t: 100 })), { say: ks[0], text: sty(list[0], '짜잔! 오늘은 피크닉이야! 안 먹으면 안 보내 준다!'), hot: true },
    { say: 'A', text: sty(A, '…다들 왜 이렇게까지…') }, ...(ks[1] ? [{ say: ks[1], text: sty(list[1], '우린 네가 웃는 게 보고 싶어서 그래.') }] : []),
    { pose: 'A', p: 'eat', t: 1400 }, { say: 'A', text: sty(A, '…맛있다. 진짜로 맛있어.') }, { emo: 'A', e: '🥹' }, { fx: 'hearts', at: 'A' },
    { outcome: 'happy', endText: ['🍱 친구들의 도시락', '밥 한 숟갈만큼 가벼워진 마음'] }], { venue: V.park, hidden: ks, sub: '친구들의 도시락' });
    c.resolve = () => { dep(A, -12); for (const f of list) fr(A, f, 6); if (FM.Needs) FM.Needs.bump(A, 'social', -40); }; return c; };
  D2.smileAgain = (A, B) => { const c = mk('friend', { A, B }, [
    { narr: `(오랜만에 밖으로 나온 ${A.name}. 햇살이 눈부시다)`, who: '해설', icon: '☀️', shot: ['wide'] },
    { pose: 'A', p: 'lookUp', t: 1200 }, { say: 'A', text: sty(A, '…하늘이 원래 이렇게 파랬나?') },
    { say: 'B', text: sty(B, '돌아온 걸 환영해. 다들 기다렸어.') }, { pose: 'A', p: 'cheer', t: 1200 },
    { say: 'A', text: sty(A, '…헤헤. 나 방금 웃었지? 진짜 오랜만이다.') }, { fx: 'sparkle', at: 'A' }, { fx: 'fireworks' },
    { outcome: 'happy', endText: ['☀️ 다시 웃던 날', '긴 터널 끝의 햇살'] }], { venue: V.plaza, sub: '다시 웃던 날' });
    c.resolve = () => { A.depression = Math.min(A.depression || 0, 15); A.stress = Math.min(A.stress || 0, 20); A.mood = 80; logD('medical', `☀️ 오랫동안 힘들어하던 ${A.name}이(가) 다시 웃으며 광장에 나왔어요`, [A.id, B.id], 2); }; return c; };

  RV.make = D2;
  const KIND = {
    love: ['dateDisaster', 'forgotAnniv', 'phoneHeart', 'firstHand', 'coupleItem', 'karaokeDuel', 'secretDate', 'kissInterrupt', 'starPromise'],
    crush: ['confessPractice'],
    marry: ['ringRoll', 'inLaws', 'firstCook', 'budgetWar', 'dishes', 'secretGift', 'renewal', 'sameDream'],
    divorce: ['coldWar', 'separateRooms', 'divorcePaper', 'lastDinner', 'plantCustody'],
    ex: ['exReunion'],
    blue: ['closedDoor', 'insomnia', 'therapy', 'letterToSelf', 'lunchbox', 'smileAgain'],
  };
  RV.KIND = KIND;

  // =========================================================
  // 발생
  // =========================================================
  const done = () => { const st = S(); return st.romVig || (st.romVig = {}); };
  const seen = (k, ids) => done()[k + '|' + ids.map(v => v.id).sort().join(',')];
  const markSeen = (k, ids) => { done()[k + '|' + ids.map(v => v.id).sort().join(',')] = day(); };
  let last = -1e9;
  const adults = () => S().villagers.filter(v => !v.child && !v.staff && !v.visitor);
  const friendOf = (A, not = []) => adults().filter(o => o !== A && !not.includes(o) && free(o)).sort((x, y) => (Soc.rel(A.id, y.id).friendship_point || 0) - (Soc.rel(A.id, x.id).friendship_point || 0))[0];
  function couples() {
    const out = [], seenIds = new Set();
    for (const a of adults()) { const pid = Soc.partnerOf(a.id); if (!pid || pid === P || seenIds.has(a.id)) continue; const b = Sim.byId(pid); if (!b) continue; seenIds.add(a.id); seenIds.add(b.id); out.push([a, b, Soc.rel(a.id, b.id)]); }
    return out.sort(() => Math.random() - 0.5);
  }
  function build(k, ...args) { const c = D2[k](...args); return c; }
  function tryHour(h) {
    const st = S(); if (!st || st.time - last < 200) return null;
    const rate = (st.flags && st.flags.dramaRate) || 'normal';
    if (!chance(rate === 'high' ? 0.5 : rate === 'low' ? 0.12 : 0.28)) return null;
    // 🌧️ 우울: 가장 힘든 주민 먼저
    const blue = adults().filter(v => free(v) && ((v.depression || 0) >= 50 || (v.stress || 0) >= 80)).sort((a, b) => (b.depression || 0) - (a.depression || 0))[0];
    if (blue) {
      const pool = (blue.depression || 0) < 30 ? ['smileAgain'] : KIND.blue.filter(k => k !== 'smileAgain' && !seen(k, [blue]));
      const k = pick(pool.length ? pool : ['smileAgain']);
      if (!(k === 'insomnia' && !(h >= 0 && h <= 4)) && !(k === 'therapy' && !(h >= 9 && h <= 18))) {
        const B = friendOf(blue);
        if (k === 'letterToSelf') { markSeen(k, [blue]); return build(k, blue); }
        if (k === 'lunchbox') { const l = adults().filter(o => o !== blue && free(o)).sort((x, y) => (Soc.rel(blue.id, y.id).friendship_point || 0) - (Soc.rel(blue.id, x.id).friendship_point || 0)).slice(0, 2); if (l.length) { markSeen(k, [blue]); return build(k, blue, l); } }
        else if (B) { markSeen(k, [blue]); return build(k, blue, B); }
      }
    }
    for (const [A, B, r] of couples()) {
      if (!free(A) || !free(B)) continue;
      const m = mar(A);
      let pool;
      if (m && m.marriage_stage === 'MARRIED' && (m.marital_satisfaction || 60) < 35) pool = KIND.divorce;
      else if (m) pool = KIND.marry.filter(k => k !== 'ringRoll');
      else pool = KIND.love.concat((r.dates || 0) >= 4 && day() - (r.since || day()) >= 3 ? ['ringRoll'] : []);
      pool = pool.filter(k => !seen(k, [A, B]));
      if (!pool.length) continue;
      const k = pick(pool);
      if (k === 'starPromise' && !(h >= 20 || h <= 2)) continue;
      if ((k === 'firstCook' || k === 'sameDream') && !(h >= 7 && h <= 10)) continue;
      markSeen(k, [A, B]);
      if (['phoneHeart', 'karaokeDuel', 'secretDate', 'kissInterrupt'].includes(k)) { const C = friendOf(A, [B]); if (!C) continue; return build(k, A, B, C); }
      if (k === 'inLaws') { const C = adults().filter(o => free(o) && o !== A && o !== B).sort((x, y) => (y.age || 25) - (x.age || 25))[0]; if (!C) continue; return build(k, A, B, C); }
      if (k === 'renewal') { const g = adults().filter(o => o !== A && o !== B && free(o)).slice(0, 2); return build(k, A, B, g); }
      if (k === 'plantCustody') { const J0 = adults().find(o => o !== A && o !== B && free(o) && (Sim.has(o, 'CRANKY') || Sim.has(o, 'FORMAL'))) || friendOf(A, [B]); if (!J0) continue; return build(k, A, B, J0); }
      return build(k, A, B);
    }
    // 짝사랑 → 고백 연습
    const cr = adults().find(v => free(v) && v.crush && v.crush.target && v.crush.target !== P && (Soc.F(v.id, v.crush.target).romance || 0) >= 50);
    if (cr && h >= 10 && h <= 19) { const T = Sim.byId(cr.crush.target); if (T && free(T) && !seen('confessPractice', [cr, T])) { markSeen('confessPractice', [cr, T]); return build('confessPractice', cr, T); } }
    // 이혼한 둘 → 우연한 재회
    const div = (st.marriages || []).find(m0 => m0.marriage_stage === 'DIVORCED' && !done()['ex|' + m0.marriage_id]);
    if (div && /rain|storm/.test((st.weather && st.weather.type) || '')) { const a = Sim.byId(div.spouse_a_id), b = Sim.byId(div.spouse_b_id); if (a && b && a.id !== P && b.id !== P && free(a) && free(b)) { done()['ex|' + div.marriage_id] = day(); return build('exReunion', a, b); } }
    return null;
  }
  FM.bus.on('hour', h => { try { const c = tryHour(h); if (c) { last = S().time; Cut.enqueue(c); } } catch (e) { console.error('romvig', e); } });

  // 신의 툴
  if (FM.Vig) {
    const NAMES = { dateDisaster: '☔ 첫 데이트 대참사', forgotAnniv: '🎂 기념일 깜빡', phoneHeart: '📱 폰 속 의문의 하트', confessPractice: '🌳 고백 연습 들킴', firstHand: '🤝 첫 손잡기', coupleItem: '👕 커플템 대소동', karaokeDuel: '🎤 노래방 연적 대결', secretDate: '🤫 몰래 연애 들킴', kissInterrupt: '💋 뽀뽀 직전 방해꾼', starPromise: '🌌 별 보며 하는 약속',
      ringRoll: '💍 반지 굴러간 프러포즈', inLaws: '🍵 떨리는 상견례', firstCook: '🍳 신혼 첫 요리', budgetWar: '📒 가계부 대첩', dishes: '🍽️ 설거지 내기', secretGift: '🎁 몰래 준비한 선물', renewal: '💒 리마인드 웨딩', sameDream: '🌅 같은 꿈을 꾼 부부',
      coldWar: '🥶 말 없는 냉전', separateRooms: '🚪 각방 쓰는 밤', divorcePaper: '📄 이혼 서류 앞에서', lastDinner: '🕯️ 마지막 저녁 식사', plantCustody: '🪴 반려 화분 양육권', exReunion: '☔ 이혼 후 재회',
      closedDoor: '🚪 닫힌 방문', insomnia: '🌙 잠 못 드는 밤', therapy: '🩺 마음 상담실', letterToSelf: '✏️ 나에게 쓰는 편지', lunchbox: '🍱 친구들의 도시락', smileAgain: '☀️ 다시 웃던 날' };
    for (const [k, n] of Object.entries(NAMES)) FM.Vig.KINDS['r_' + k] = n;
    const origRun = FM.Vig.run;
    FM.Vig.run = function (kind) {
      if (typeof kind === 'string' && kind.startsWith('r_') && D2[kind.slice(2)]) {
        const k = kind.slice(2), A = adults().sort(() => Math.random() - 0.5);
        const a = A.find(v => Soc.genderOf(v.id) === 'F'), b = A.find(v => Soc.genderOf(v.id) === 'M'), c3 = A.find(v => v !== a && v !== b), d4 = A.find(v => v !== a && v !== b && v !== c3);
        const args = k === 'letterToSelf' ? [a] : k === 'lunchbox' ? [a, [b, c3]] : k === 'renewal' ? [a, b, [c3, d4]] : [a, b, c3];
        const c = D2[k](...args); c.resolve = null; return Cut.enqueue(c, true);
      }
      return origRun(kind);
    };
  }
})();
