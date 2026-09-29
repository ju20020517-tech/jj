/* =========================================================
 *  포즈 / 모션 — 캐릭터 리그(root, body, head, 팔다리 피벗)에 적용
 *  ISLE.M.animate(걷기·숨쉬기) 이후에 덮어씀
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM;
  const S = Math.sin, C = Math.cos, PI = Math.PI;
  const A = {};
  const arms = (c, lx, lz, rx, rz) => { c.armL.rotation.x = lx; c.armL.rotation.z = lz; c.armR.rotation.x = rx; c.armR.rotation.z = rz; };
  const legs = (c, l, r) => { c.legL.rotation.x = l; c.legR.rotation.x = r; };
  // 엉덩이(몸통 아래 ≈ body 기준 0.11)를 좌석 높이(월드)에 맞춤. seatH 0 = 바닥에 앉기
  const HIP = 0.11, SHAPE_Y = 0.07;
  const bodyYFor = (c, worldY) => (worldY / (c.rs || 1) - SHAPE_Y) / (c.hh || 1) - HIP;
  const sitBase = (c, t) => {
    const sh = c.seatH || 0;
    if (sh > 0) { legs(c, -1.3, -1.3); c.body.position.y = bodyYFor(c, sh + 0.01); c.body.position.z = 0.04; }
    else { legs(c, -1.5, -1.5); c.body.position.y = bodyYFor(c, 0.02); }
    c.seated = true;
  };
  // 누울 때는 몸 가운데가 제자리에 오도록 (머리가 벽 너머로 넘어가지 않게)
  // 눕기: 몸 한가운데(배꼽)가 제자리에 오도록, 누울 면 높이(lieOn.h)만큼 올림
  const lieBase = (c) => {
    c.body.rotation.x = -PI / 2; c.body.position.z = 0.62; legs(c, 0.06, -0.06); c.lying = true;
    const L = c.lieOn, k = (c.rs || 1) * (c.hh || 1);
    c.body.position.y = 0.3 + (L ? L.h / k : 0);
    if (L && L.along === 'x' && c.shape) c.shape.rotation.y = PI / 2;
  };
  A._sitBase = sitBase;

  A.stand = () => {};
  A.look = (c, t) => { c.head.rotation.y = S(t * 0.8) * 0.5; };
  A.lookUp = (c, t) => { c.head.rotation.x = -0.45; arms(c, 0, -0.2, 0, 0.2); };
  A.shade = (c, t) => { c.head.rotation.x = -0.1; arms(c, 0, 0, -2.4, 0.6); };
  // 수다: 2.2초마다 손짓이 바뀜 (설명하는 손 · 어깨 으쓱 · 가슴에 손 얹고 끄덕)
  A.talk = (c, t) => {
    const ph = Math.floor(t / 2.2) % 4, k = S(Math.min(1, (t % 2.2) / 0.3) * PI / 2);
    c.body.position.y += Math.max(0, S(t * 8)) * 0.03; c.head.rotation.x = S(t * 10) * 0.06;
    if (ph === 0) { arms(c, 0, -0.15, (-0.9 + S(t * 5) * 0.35) * k, 0.45 * k); c.head.rotation.z = 0.08; }
    else if (ph === 1) { arms(c, -0.35 * k, (-0.95 - S(t * 3) * 0.12) * k, -0.35 * k, (0.95 + S(t * 3) * 0.12) * k); c.head.rotation.z = 0.16 * k; c.body.position.y += 0.03 * k; }
    else if (ph === 2) { arms(c, 0, -0.15, -1.25 * k, -0.45 * k); c.head.rotation.x = S(t * 6) * 0.14; }
    else { arms(c, (-0.6 + S(t * 6) * 0.4) * k, -0.3 * k, 0, 0.15); c.body.rotation.y = S(t * 2) * 0.12; }
  };
  // 감정 몸짓 (이모티콘이 뜰 때 잠깐)
  const EMO_G = {
    joy: (c, t) => { c.body.position.y += Math.abs(S(t * 9)) * 0.14; arms(c, 0, -2.3, 0, 2.3); },
    love: (c, t) => { arms(c, -2.2, 0.9, -2.2, -0.9); c.body.rotation.z = S(t * 4) * 0.1; c.head.rotation.z = S(t * 4 + 0.5) * 0.14; },
    sad: (c, t) => { arms(c, 0, 0, -2.0 + S(t * 12) * 0.2, -0.3); c.head.rotation.x = 0.28; },
    angry: (c, t) => { const s = Math.abs(S(t * 10)); c.legL.rotation.x = -s * 0.5; c.legR.rotation.x = -Math.abs(S(t * 10 + 1.5)) * 0.5; arms(c, 0.1, 0.3, 0.1, -0.3); c.body.position.x = S(t * 40) * 0.02; },
    think: (c, t) => { arms(c, -0.5, 0.2, -1.9, -0.45); c.head.rotation.z = 0.22; c.head.rotation.y = S(t) * 0.2; },
    surprise: (c, t) => { arms(c, 0, -2.5, 0, 2.5); c.body.position.y += Math.max(0, S(Math.min(1, t * 3) * PI)) * 0.2; c.head.rotation.x = -0.15; },
    wave: (c, t) => { c.armR.rotation.x = 0; c.armR.rotation.z = 2.5 + S(t * 12) * 0.35; c.head.rotation.z = 0.12; },
    dance: (c, t) => { c.body.rotation.z = S(t * 6) * 0.12; arms(c, 0, -1.2 - S(t * 6) * 0.5, 0, 1.2 - S(t * 6) * 0.5); c.body.position.y += Math.abs(S(t * 6)) * 0.06; },
    sleepy: (c, t) => { c.head.rotation.x = 0.35 + S(t * 1.5) * 0.08; arms(c, 0, -0.05, 0, 0.05); },
  };
  const EMO_MAP = { '😊': 'joy', '😆': 'joy', '😄': 'joy', '🎉': 'joy', '👏': 'joy', '🙌': 'joy', '❤️': 'love', '💖': 'love', '💕': 'love', '💗': 'love', '😍': 'love', '🥰': 'love', '😢': 'sad', '😭': 'sad', '💧': 'sad', '😣': 'sad', '💢': 'angry', '😡': 'angry', '😠': 'angry', '❓': 'think', '🤔': 'think', '❗': 'surprise', '😲': 'surprise', '😳': 'surprise', '👋': 'wave', '🎵': 'dance', '🎶': 'dance', '🕺': 'dance', '💤': 'sleepy', '😴': 'sleepy' };
  A._emoGesture = (c, emoji, t) => { const g = EMO_G[EMO_MAP[emoji]]; if (g && t < 2) { g(c, t); return true; } return false; };
  A.chatter = A.talk;
  A.swingSit = (c, t) => { sitBase(c); const k = S(t * 2.6); c.body.position.z = k * 0.45; c.body.position.y = -0.2 + Math.abs(k) * 0.12; c.body.rotation.x = -k * 0.3; arms(c, -2.6, 0.1, -2.6, -0.1); };
  A.seesaw = (c, t) => { sitBase(c); c.body.position.y = -0.2 + (S(t * 2.2) + 1) * 0.25; arms(c, -1.3, 0.2, -1.3, -0.2); };
  A.listen = (c, t) => { c.head.rotation.z = S(t * 0.9) * 0.06; c.head.rotation.x = 0.04 + S(t * 1.3) * 0.02; arms(c, 0.05, -0.12, 0.05, 0.12); };   // 가만히 서서 귀 기울이기
  A.crouch = (c, t) => { legs(c, -1.1, -1.1); c.body.position.y = -0.15; c.body.rotation.x = 0.35; arms(c, -1 + S(t * 4) * 0.2, 0, -1.1 - S(t * 4) * 0.2, 0); };
  A.water = (c, t) => { arms(c, 0, 0, -1.2, 0.2); c.body.rotation.z = S(t * 2) * 0.05; c.head.rotation.x = 0.3; };
  A.write = (c, t) => { arms(c, -0.9, 0.1, -1.1 + S(t * 10) * 0.08, -0.1); c.head.rotation.x = 0.35; };
  A.read = (c, t) => { arms(c, -1.1, 0.25, -1.1, -0.25); c.head.rotation.x = 0.3; };
  A.lift = (c, t) => { const k = (S(t * 4) + 1) / 2; arms(c, -0.4 - k * 1.6, -0.2, -0.4 - k * 1.6, 0.2); c.body.position.y -= k * 0.03; };
  A.flex = (c, t) => { arms(c, 0, -2.2, 0, 2.2); c.armL.rotation.x = -0.4; c.armR.rotation.x = -0.4; c.body.scale.x *= 1.05 + S(t * 6) * 0.03; };
  A.stretch = (c, t) => { arms(c, 0, -2.9, 0, 2.9); c.body.rotation.z = S(t * 1.5) * 0.25; };
  A.jog = (c, t) => { const s = S(t * 14); legs(c, s * 0.9, -s * 0.9); arms(c, -s * 0.9, -0.3, s * 0.9, 0.3); c.body.position.y = Math.abs(s) * 0.08; };
  A.situps = (c, t) => { lieBase(c); c.body.rotation.x = -PI / 2 + (S(t * 4) + 1) * 0.6; arms(c, -2.8, -0.4, -2.8, 0.4); };
  A.fish = (c, t) => { arms(c, -1.2, 0.1, -1.3, -0.1); c.head.rotation.x = 0.15; };
  A.swing = (c, t) => { arms(c, 0, 0, -1.5 + S(t * 6) * 1.2, 0.2); c.body.rotation.y = S(t * 6) * 0.3; };
  A.eat = (c, t) => { sitBase(c); arms(c, -1.2, 0.2, -1.9 + S(t * 6) * 0.3, -0.2); c.head.rotation.x = S(t * 6) * 0.06; };
  A.drink = (c, t) => { sitBase(c); arms(c, -0.4, 0, -2.1, -0.3); c.head.rotation.x = -0.25; };
  A.sit = (c, t) => { sitBase(c); arms(c, -0.6, -0.1, -0.6, 0.1); };
  A.sadSit = (c, t) => { sitBase(c); c.head.rotation.x = 0.5; arms(c, -1.3, 0.2, -1.3, -0.2); };
  // 누워서 쉬기: 한 손은 배 위, 한 손은 머리 밑, 가끔 발 까딱
  A.lie = (c, t) => { lieBase(c); arms(c, -0.5, 0.35, -2.7, -0.5); legs(c, 0.06 + Math.max(0, S(t * 1.3)) * 0.12, -0.06); c.head.rotation.y = S(t * 0.2) * 0.25; };
  // 침대: 머리는 베개 위, 몸은 매트리스 위, 이불을 어깨까지 덮고 새근새근
  A.sleep = (c, t) => {
    lieBase(c);
    const bed = c.bed, rs = c.rs || 1, ww = c.ww || 1;
    if (bed) {
      c.body.position.z = bed.headZ / (rs * ww) + 0.93;
      c.body.position.y = ((bed.top + 0.22 * rs) / rs - SHAPE_Y) / (c.hh || 1);
    } else c.body.position.y = 0.3;
    arms(c, 0, -0.08, 0, 0.08);
    // 베개에 고개를 살짝 숙여 기대고(귀가 벽으로 안 넘어가게), 가끔 고개를 돌려 뒤척임
    c.head.rotation.x = 0.5;
    c.head.rotation.y = S(t * 0.15) > 0.3 ? 0.3 : S(t * 0.15) < -0.3 ? -0.3 : 0;
    const br = 1 + S(t * 1.6) * 0.025;
    if (c.blanket) {
      c.blanket.visible = true;
      c.blanket.scale.set(1, 1, br);
      if (bed && c.blanket.userData.col !== bed.color) { c.blanket.userData.quilt.color.setHex(bed.color); c.blanket.userData.col = bed.color; }
    }
    c.face.material.map = c.blinkTex; c.eyesShut = true;
  };
  A.nap = A.lie;
  A.cheer = (c, t) => { arms(c, 0, -2.6 - S(t * 10) * 0.3, 0, 2.6 + S(t * 10) * 0.3); c.body.position.y = Math.abs(S(t * 8)) * 0.15; };
  A.mirror = (c, t) => { arms(c, 0, -0.6, -1.6, -0.2); c.head.rotation.y = S(t * 1.5) * 0.4; };
  A.bow = (c, t) => { c.body.rotation.x = 0.5 * Math.min(1, t * 2); arms(c, 0.2, -0.1, 0.2, 0.1); };
  A.kick = (c, t) => { legs(c, 0, -1.2 * Math.abs(S(t * 4))); arms(c, 0.3, -0.5, 0.3, 0.5); };
  A.paint = (c, t) => { arms(c, -0.4, 0, -1.6 + S(t * 5) * 0.4, 0.3 + C(t * 5) * 0.3); };
  A.dance = (c, t) => { const s = S(t * 9); c.body.rotation.y = s * 0.6; arms(c, s, -1.8, -s, 1.8); legs(c, s * 0.5, -s * 0.5); c.body.position.y = Math.abs(C(t * 9)) * 0.12; };
  A.weird = A.dance;
  A.robot = (c, t) => { const k = Math.floor(t * 3) % 4; arms(c, [-1.6, 0, -1.6, 0][k], -0.2, [0, -1.6, -1.6, 0][k], 0.2); c.head.rotation.y = [0.5, -0.5, 0, 0][k]; c.body.rotation.y = [0.3, -0.3, 0.3, -0.3][k]; };
  A.fidget = (c, t) => { c.body.rotation.y = S(t * 3) * 0.4; arms(c, -0.8, 0.3, -0.8, -0.3); c.head.rotation.x = 0.2; };
  A.sweep = (c, t) => { arms(c, -0.9, 0.2, -0.9, -0.3); c.body.rotation.y = S(t * 4) * 0.35; c.body.rotation.x = 0.2; };
  A.sing = (c, t) => { arms(c, 0, -0.5 - S(t * 3) * 0.4, -2.2, -0.3); c.head.rotation.x = -0.2; c.body.rotation.z = S(t * 4) * 0.08; };
  A.guitar = (c, t) => { arms(c, -1.0, 0.5, -0.8 + S(t * 12) * 0.25, -0.2); c.body.rotation.z = S(t * 3) * 0.06; };
  A.sway = (c, t) => { c.body.rotation.z = S(t * 2.5) * 0.12; c.head.rotation.z = S(t * 2.5) * 0.15; };
  A.spin = (c, t) => { c.body.rotation.y = t * 8; arms(c, 0, -1.3, 0, 1.3); };
  A.crystal = (c, t) => { arms(c, -1.3, 0.4 + S(t * 3) * 0.1, -1.3, -0.4 - S(t * 3) * 0.1); c.head.rotation.x = 0.3; };
  A.shake = (c, t) => { arms(c, -1.5, 0.1, -1.5, -0.1); c.body.position.x = S(t * 30) * 0.05; };
  A.photo = (c, t) => { arms(c, -1.5, 0.3, -1.5, -0.3); };
  A.cook = (c, t) => { arms(c, -1.1, 0.1, -1.2 + S(t * 8) * 0.3, -0.2); c.head.rotation.x = 0.35; };
  A.tryon = (c, t) => { arms(c, -1.3, 0.2, -1.3, -0.2); c.body.rotation.y = S(t * 2) * 0.4; };
  A.massage = (c, t) => { sitBase(c); c.body.position.x = S(t * 24) * 0.03; c.head.rotation.x = -0.3; arms(c, 0, -0.1, 0, 0.1); };
  A.bounce = (c, t) => { const k = Math.abs(S(t * 5)); c.body.position.y = k * 0.9; arms(c, 0, -2.2 * k, 0, 2.2 * k); legs(c, -0.3 * k, -0.3 * k); };
  A.punch = (c, t) => { const s = S(t * 10); arms(c, -1.5 - Math.max(0, s) * 0.2, 0.1, -1.5 - Math.max(0, -s) * 0.2, -0.1); c.body.rotation.y = s * 0.2; };
  A.game = (c, t) => { arms(c, -1.3 + S(t * 14) * 0.1, 0.1, -1.3 + C(t * 13) * 0.1, -0.1); c.head.rotation.x = 0.1; };
  A.dj = (c, t) => { arms(c, -1.2, 0.2, -1.3 + S(t * 7) * 0.3, -0.2); c.body.position.y = Math.abs(S(t * 7)) * 0.06; c.head.rotation.x = S(t * 7) * 0.15; };
  A.pilot = (c, t) => { sitBase(c); arms(c, -1.3 + S(t * 2) * 0.2, 0.1, -1.3 - S(t * 2) * 0.2, -0.1); };
  A.type = (c, t) => { arms(c, -1.25 + S(t * 16) * 0.08, 0.15, -1.25 + C(t * 15) * 0.08, -0.15); c.head.rotation.x = 0.15; };
  A.meditate = (c, t) => { legs(c, -1.5, -1.5); c.legL.rotation.z = 0.9; c.legR.rotation.z = -0.9; c.body.position.y = -0.25; arms(c, -0.3, -0.5, -0.3, 0.5); c.body.scale.y *= 1 + S(t * 1.3) * 0.015; };
  A.hug = (c, t) => { arms(c, -1.3, 0.6, -1.3, -0.6); c.body.rotation.z = S(t * 2) * 0.08; };
  A.stare = (c, t) => { c.head.rotation.x = -0.15; arms(c, -0.2, -0.2, -0.2, 0.2); };
  A.rock = (c, t) => { arms(c, -1.1, 0.2, -1.1, -0.2); c.body.rotation.x = 0.25 + S(t * 2.4) * 0.1; };
  A.hammer = (c, t) => { const k = Math.abs(S(t * 6)); arms(c, -0.9, 0.1, -2.4 * k - 0.4, -0.2); c.body.rotation.x = 0.15; };
  A.bathe = (c, t) => { sitBase(c); c.body.position.y = -0.45; arms(c, -1.3, -0.8, -1.3, 0.8); };
  A.swim = (c, t) => { lieBase(c); c.body.position.y = 0.1; arms(c, -3 + S(t * 4) * 0.8, 0, -3 - S(t * 4) * 0.8, 0); legs(c, S(t * 8) * 0.3, -S(t * 8) * 0.3); };
  A.slide = (c, t) => { lieBase(c); c.body.rotation.x = -PI / 2; c.body.position.z = S(t * 1.5) * 1.2; arms(c, -3, -0.2, -3, 0.2); };
  A.wrestle = (c, t) => { c.body.position.x = S(t * 2) * 1.2; arms(c, 0, -2.4, 0, 2.4); c.body.rotation.z = S(t * 2) * 0.3; };
  A.point = (c, t) => { arms(c, 0, -0.2, -1.6, 0); };
  A.argue = (c, t) => { arms(c, -0.6 + S(t * 9) * 0.4, -0.5, -1.4 + C(t * 8) * 0.4, 0.3); c.body.position.y = Math.abs(S(t * 9)) * 0.05; c.head.rotation.x = S(t * 10) * 0.1; };
  A.glare = (c, t) => { c.head.rotation.x = 0.1; arms(c, 0.2, -0.6, 0.2, 0.6); };
  A.knockHesitate = (c, t) => { arms(c, 0, 0, t < 3 ? -2.3 : 0, 0.2); c.head.rotation.x = 0.2; };
  A.throw = (c, t) => { arms(c, 0, -0.1, -2.6 + t * 3, 0.2); };
  A.surprise = (c, t) => { c.body.position.y = Math.max(0, S(Math.min(t, 0.5) * PI * 2)) * 0.3; arms(c, 0, -2.4, 0, 2.4); };
  A.hideFace = (c, t) => { arms(c, -2.2, 0.5, -2.2, -0.5); c.head.rotation.x = 0.35; };
  A.cute = (c, t) => { arms(c, -2.2, 0.8, -2.2, -0.8); c.head.rotation.z = 0.25; c.body.rotation.y = S(t * 3) * 0.2; };
  A.toddle = (c, t) => { const s = S(t * 8); legs(c, s * 0.4, -s * 0.4); c.body.rotation.z = s * 0.12; arms(c, 0, -0.8, 0, 0.8); };
  A.holdBaby = (c, t) => { arms(c, -1.1, 0.7, -1.1, -0.7); c.body.rotation.z = S(t * 2) * 0.1; c.head.rotation.x = 0.35; };
  A.baby = (c, t) => { lieBase(c); c.body.position.y = 0.55; arms(c, -1.5 + S(t * 3) * 0.5, 0.3, -1.5 - S(t * 3) * 0.5, -0.3); };
  A.cry = (c, t) => { arms(c, -2.1, 0.5, -2.1, -0.5); c.head.rotation.x = 0.3; c.body.position.y = Math.abs(S(t * 6)) * 0.03; };
  A.cryFloor = (c, t) => { lieBase(c); c.body.rotation.x = -PI / 2 + 0.2; arms(c, -3 + S(t * 8) * 0.4, -0.4, -3 - S(t * 8) * 0.4, 0.4); legs(c, S(t * 9) * 0.5, -S(t * 9) * 0.5); };
  A.faint = (c, t) => { c.body.rotation.x = -Math.min(1, t * 3) * PI / 2; c.body.position.y = Math.min(1, t * 3) * 0.3; c.body.position.z = -Math.min(1, t * 3) * 0.35; arms(c, 0, -1.2, 0, 1.2); };
  A.roll = (c, t) => { c.body.rotation.x = t * 7; c.body.position.y = 0.35; legs(c, -1.2, -1.2); arms(c, -1.6, 0.4, -1.6, -0.4); };
  A.headbang = (c, t) => { c.body.rotation.x = 0.3 + Math.abs(S(t * 5)) * 0.3; arms(c, -0.4, -0.2, -0.4, 0.2); };
  A.faces = (c, t) => { const k = Math.floor(t * 1.2) % 3; c.head.rotation.z = [0.3, -0.3, 0][k]; arms(c, [-2.2, 0, -1][k], [0.6, -0.3, 0][k], [-2.2, -2, 0][k], [-0.6, 0.3, 0][k]); };
  A.faceCute = (c, t) => A.cute(c, t);
  A.faceTough = (c, t) => { arms(c, 0, -2.2, 0, 2.2); c.armL.rotation.x = -0.4; c.armR.rotation.x = -0.4; c.head.rotation.x = -0.15; };
  A.faceHurt = (c, t) => { arms(c, -1.8, 0.2, 0, 0.2); c.head.rotation.x = 0.3; c.body.rotation.z = 0.15; };
  A.kiss = (c, t) => { c.body.rotation.x = 0.15; c.head.rotation.x = 0.1; arms(c, -0.9, 0.5, -0.9, -0.5); };
  A.highfive = (c, t) => { arms(c, 0, -0.2, -2.8 + Math.abs(S(t * 4)) * 0.5, 0.2); c.body.position.y = Math.abs(S(t * 4)) * 0.2; };
  A.hiphop = (c, t) => { arms(c, -1.5, -0.5 + S(t * 6) * 0.5, -1.5, 0.5 - S(t * 6) * 0.5); c.body.position.y = Math.abs(S(t * 6)) * 0.08; c.head.rotation.x = S(t * 6) * 0.15; };
  A.handdance = (c, t) => { arms(c, 0, -2.2 + S(t * 8) * 0.6, 0, 2.2 - S(t * 8) * 0.6); c.body.rotation.y = S(t * 4) * 0.5; };
  A.stomp = (c, t) => { legs(c, -Math.abs(S(t * 6)) * 0.6, 0); arms(c, 0.3, -0.5, 0.3, 0.5); c.body.position.y = Math.abs(S(t * 6)) * 0.05; };
  A.tarzan = (c, t) => { arms(c, 0, -2.9, 0, 2.9); c.body.position.x = S(t * 2) * 1.2; c.body.position.y = 0.5 - Math.abs(C(t * 2)) * 0.3; legs(c, -0.6, -0.2); };
  A.retch = (c, t) => { c.body.rotation.x = 0.6; arms(c, -1.9, 0.5, -1.2, -0.2); c.body.position.y = Math.abs(S(t * 8)) * 0.03; };
  A.wipeTear = (c, t) => { arms(c, 0, -0.1, -2.2, -0.6); c.head.rotation.x = -0.1; };
  A.blow = (c, t) => { arms(c, -0.2, -0.1, -2.1, -0.4); c.head.rotation.x = -0.1; };
  A.jumpPop = (c, t) => { c.body.position.y = Math.abs(S(t * 6)) * 0.35; arms(c, 0, -0.2, -2.7, 0.2); };
  A.soapbox = (c, t) => { c.body.position.y = 0.5 + Math.abs(S(t * 5)) * 0.05; arms(c, 0, -0.3, -2.4 + S(t * 5) * 0.4, 0.3); };
  A.spit = (c, t) => { c.body.rotation.x = -0.3 + Math.min(1, t * 4) * 0.5; c.head.rotation.x = 0.3; arms(c, -1.5, 0.2, -0.3, -0.2); };
  A.leanSleep = (c, t) => { sitBase(c); c.body.rotation.z = -0.35; c.head.rotation.z = -0.3; };
  A.shove = (c, t) => { arms(c, -1.5, -0.3, -1.5, 0.3); c.body.rotation.x = 0.2; };
  A.tug = (c, t) => { arms(c, -1.5, 0.1, -1.5, -0.1); c.body.rotation.x = -0.35 + S(t * 6) * 0.1; c.body.position.z = -0.1 + S(t * 6) * 0.08; };
  A.freeze = (c, t) => { arms(c, -0.5, -0.8, -0.3, 0.8); c.body.position.x = S(t * 40) * 0.01; };
  A.tantrum = (c, t) => { lieBase(c); arms(c, -3 + S(t * 12) * 0.8, 0, -3 - S(t * 12) * 0.8, 0); legs(c, S(t * 12) * 0.8, -S(t * 12) * 0.8); };
  A.taunt = (c, t) => { c.body.rotation.y = S(t * 6) * 0.7; arms(c, 0, -2 - S(t * 6) * 0.5, 0, 2 + S(t * 6) * 0.5); c.body.position.y = Math.abs(C(t * 6)) * 0.12; };
  A.bowl = (c, t) => { const k = Math.min(1, t * 1.2); c.body.rotation.x = 0.5 * k; arms(c, 0, 0, -1.5 + k * 2.5, 0); legs(c, -0.6 * k, 0.4 * k); };
  A.earCover = (c, t) => { arms(c, -2.6, 1.2, -2.6, -1.2); c.body.position.y = Math.abs(S(t * 10)) * 0.03; };
  A.reach = (c, t) => { arms(c, 0, -0.2, -2.8, 0.1); c.body.position.y = Math.abs(S(t * 3)) * 0.08; };
  A.dozeDesk = (c, t) => { c.body.rotation.x = 0.7; c.head.rotation.x = 0.4; arms(c, -1.6, 0.4, -1.6, -0.4); };
  A.facepalm = (c, t) => { arms(c, 0, -0.1, -2.3, -0.8); c.head.rotation.x = 0.35; };
  A.peel = (c, t) => { sitBase(c); arms(c, -1.3, 0.3, -1.4 + S(t * 10) * 0.1, -0.3); c.head.rotation.x = 0.35; };
  A.float = (c, t) => { c.body.position.y = 0.8 + S(t * 2) * 0.25; arms(c, 0, -1.5 + S(t * 3) * 0.3, 0, 1.5 - S(t * 3) * 0.3); legs(c, S(t * 2) * 0.3, -S(t * 2) * 0.3); };
  A.levitateDance = (c, t) => { A.float(c, t); c.body.rotation.y = t * 3; };
  A.touch = (c, t) => { arms(c, 0, -0.2, -1.4 + S(t * 6) * 0.2, 0.1); c.body.position.y = Math.abs(S(t * 5)) * 0.08; };
  A.tilt = (c, t) => { c.head.rotation.z = 0.35 * Math.min(1, t * 2); arms(c, 0, -0.2, -2, -0.4); };
  A.coverEyes = (c, t) => { sitBase(c); arms(c, -2.3, 0.5, -2.3, -0.5); c.head.rotation.x = 0.3; };
  A.selfLoveDance = (c, t) => { A.dance(c, t); c.head.rotation.z = S(t * 4) * 0.3; };
  A.kneel = (c, t) => { legs(c, -1.4, 0.2); c.body.position.y = -0.2; arms(c, 0, -0.2, -1.4, -0.1); };
  A.clap = (c, t) => { const k = S(t * 12); arms(c, -1.3, 0.6 - k * 0.3, -1.3, -0.6 + k * 0.3); };
  A.volley = (c, t) => { c.body.position.y = Math.abs(S(t * 4)) * 0.3; arms(c, 0, -2.7, 0, 2.7); };
  A.surf = (c, t) => { arms(c, 0, -1.4, 0, 1.4); c.body.rotation.z = S(t * 3) * 0.25; c.body.position.y = 0.2; legs(c, 0.3, -0.3); };
  A.tubeHelp = (c, t) => { c.body.position.y = -0.3 + S(t * 2) * 0.1; arms(c, 0, -0.3, 0, 2.6 + S(t * 12) * 0.3); };
  A.hangWall = (c, t) => { c.body.position.y = 0.4; arms(c, -2.6, 0.3, -2.6, -0.3); legs(c, S(t * 5) * 0.4, -S(t * 5) * 0.4); };
  A.grimace = (c, t) => { c.body.position.x = S(t * 25) * 0.03; c.head.rotation.z = 0.2; arms(c, -1.9, 0.3, -0.5, -0.2); };
  A.cut = (c, t) => { arms(c, -1.3, 0.1, -1.5 + S(t * 10) * 0.2, -0.2); };
  A.row = (c, t) => { sitBase(c); arms(c, -1.3 + S(t * 3) * 0.5, 0.2, -1.3 + S(t * 3) * 0.5, -0.2); c.body.rotation.x = S(t * 3) * 0.15; };
  A.shiver = (c, t) => { legs(c, -1.2, -1.2); c.body.position.y = -0.2; c.body.position.x = S(t * 40) * 0.03; arms(c, -1.6, 0.6, -1.6, -0.6); };
  A.pose = (c, t) => { arms(c, 0, -0.2, 0, 2.2); c.armR.rotation.x = -0.5; c.head.rotation.z = 0.15; c.body.rotation.y = 0.3; };
  A.anchor = (c, t) => { arms(c, -1.2, 0.1, -1.2, -0.1); c.head.rotation.x = S(t * 8) * 0.04; };
  A.volleyball = A.volley;
  A.trampoline = A.bounce;

  // 표시할 포즈 결정: v.pose (명시) > 행동/상태 기본
  const STATE_POSE = { SIT_REST: 'sit', TALK_NPC: 'talk', TALK_PLAYER: 'talk', THINKING: 'fidget', WATCH_LOOK: 'look' };
  FM.Anim = {
    POSES: A,
    apply(c, v, t) {
      c.seated = false; c.lying = false;
      if (c.blanket) c.blanket.visible = false;
      if (c.shape) c.shape.rotation.y = 0;
      if (c.eyesShut) { c.face.material.map = c.faceTex; c.eyesShut = false; }
      const p = v.pose || (v.moving ? null : STATE_POSE[v.state]);
      if (!p) return;
      const f = A[p];
      if (f) f(c, t);
      // 의자/벤치/소파 위: 어떤 포즈든 좌석 위에 제대로 앉힘
      const sh = c.seatH || 0;
      if (sh > 0) {
        if (c.lying) {
          // 벤치 · 소파 위 낮잠: 좌석 높이에 맞춰, 좌석 긴 방향으로 눕힘
          if (!c.lieOn) { c.body.position.y += sh / ((c.rs || 1) * (c.hh || 1)); if (c.shape) c.shape.rotation.y = PI / 2; }
        } else if (!c.seated && !NO_SEAT[p]) sitBase(c, t);
      }
    },
  };
  const NO_SEAT = { stand: 1, float: 1, levitateDance: 1, dance: 1, cheer: 1, jog: 1, bounce: 1, swim: 1, hangWall: 1 };
})();
