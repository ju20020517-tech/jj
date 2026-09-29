/* =========================================================
 *  캐릭터 빌더 — 게임과 "캐릭터 만들기" 도구가 함께 사용
 *  look 객체 하나로 종, 얼굴, 털색, 머리, 옷, 소품을 모두 표현
 * ========================================================= */
(() => {
  'use strict';
  const ISLE = window.ISLE, M = ISLE.M;
  const { mat, geo, sphere, box, capsule, lathe, roundCone, puck, mesh, soften } = M.h;
  const hex = n => '#' + (n >>> 0).toString(16).padStart(6, '0').slice(-6);

  // ---------------------------------------------------------
  // 종 정의 (기본 색 + 부위 모양)
  // ---------------------------------------------------------
  const SPECIES = {
    human:    { name: '사람',   icon: '🧒', ears: null, muzzle: 'human', tail: null, head: [1.02, 0.96, 1] },
    cat:      { name: '고양이', icon: '🐱', ears: 'cat', muzzle: 'cat', tail: 'cat', fur: 0xa9c6e8, fur2: 0xeaf3ff, ear: 0xff9fb2, marking: 'stripes', markColor: 0x6f8fb8 },
    dog:      { name: '강아지', icon: '🐶', ears: 'floppy', muzzle: 'dog', tail: 'stub', fur: 0xfff6e0, fur2: 0xffffff, ear: 0xb3b9ff },
    bear:     { name: '곰',     icon: '🐻', ears: 'round', muzzle: 'bear', tail: 'stub', fur: 0xd9a066, fur2: 0xf7dcb6, ear: 0xb77a45 },
    tanuki:   { name: '너구리', icon: '🦝', ears: 'round', muzzle: 'dog', tail: 'stripe', fur: 0xc08348, fur2: 0xf2d9b0, ear: 0x6a4020, marking: 'mask', markColor: 0x5a3418 },
    rabbit:   { name: '토끼',   icon: '🐰', ears: 'long', muzzle: 'rabbit', tail: 'puff', fur: 0xffffff, fur2: 0xfff0f4, ear: 0xffb3c6 },
    hamster:  { name: '햄스터', icon: '🐹', ears: 'small', muzzle: 'hamster', tail: 'stub', fur: 0xff8fa0, fur2: 0xffd9df, ear: 0x5cbf73, cheeks: true },
    mouse:    { name: '생쥐',   icon: '🐭', ears: 'big', muzzle: 'mouse', tail: 'thin', fur: 0xf5f0ff, fur2: 0xffffff, ear: 0xff9ec4 },
    squirrel: { name: '다람쥐', icon: '🐿️', ears: 'squirrel', muzzle: 'rabbit', tail: 'squirrel', fur: 0xfff3b0, fur2: 0xffffff, ear: 0xc9b3ff },
    duck:     { name: '오리',   icon: '🦆', ears: null, muzzle: 'duck', tail: 'flat', fur: 0xffcc3a, fur2: 0xffe27a, beak: 0xff8a2a },
    pig:      { name: '돼지',   icon: '🐷', ears: 'pig', muzzle: 'pig', tail: 'curl', fur: 0xffc2c7, fur2: 0xffa3ad, ear: 0xff9aa8, head: [1.12, 0.95, 1.02] },
    koala:    { name: '코알라', icon: '🐨', ears: 'koala', muzzle: 'koala', tail: null, fur: 0x9aa3ad, fur2: 0xe8eef5, ear: 0xffffff, head: [1.12, 0.95, 1.02] },
    sheep:    { name: '양',     icon: '🐑', ears: 'side', muzzle: 'sheep', tail: 'puff', fur: 0xfff1e0, fur2: 0xffffff, ear: 0xffc9b8, wool: true },
    frog:     { name: '개구리', icon: '🐸', ears: null, muzzle: 'frog', tail: null, fur: 0x7ccf6a, fur2: 0xe8f7c8, head: [1.2, 0.85, 1.05] },
    penguin:  { name: '펭귄',   icon: '🐧', ears: null, muzzle: 'penguin', tail: 'flat', fur: 0x3a4a6a, fur2: 0xffffff, beak: 0xffb13d, marking: 'face', markColor: 0xffffff },
    fox:      { name: '여우',   icon: '🦊', ears: 'fox', muzzle: 'fox', tail: 'fox', fur: 0xff9a4a, fur2: 0xffffff, ear: 0x3a2a20 },
    deer:     { name: '사슴',   icon: '🦌', ears: 'side', muzzle: 'deer', tail: 'puff', fur: 0xc98a5a, fur2: 0xf6e4cc, ear: 0xffd0c0, antlers: true },
    panda:    { name: '판다',   icon: '🐼', ears: 'round', muzzle: 'bear', tail: 'stub', fur: 0xffffff, fur2: 0xffffff, ear: 0x2b2b30, marking: 'patch', markColor: 0x2b2b30 },
    tiger:    { name: '호랑이', icon: '🐯', ears: 'cat', muzzle: 'cat', tail: 'cat', fur: 0xffa640, fur2: 0xfff4e0, ear: 0x3a2a20, marking: 'stripes', markColor: 0x3a2a20 },
    wolf:     { name: '늑대',   icon: '🐺', ears: 'fox', muzzle: 'fox', tail: 'fox', fur: 0x9aa3b8, fur2: 0xf4f6fa, ear: 0x55607a, marking: 'blaze', markColor: 0xffffff },
    cow:      { name: '젖소',   icon: '🐮', ears: 'side', muzzle: 'pig', tail: 'thin', fur: 0xffffff, fur2: 0xffd0d8, ear: 0x3a3a3a, marking: 'spots', markColor: 0x3a3a3a, head: [1.1, 0.95, 1.02] },
    monkey:   { name: '원숭이', icon: '🐵', ears: 'side', muzzle: 'bear', tail: 'thin', fur: 0x9a6440, fur2: 0xffd9b8, ear: 0xffd9b8, marking: 'face', markColor: 0xffd9b8 },
    chick:    { name: '병아리', icon: '🐥', ears: null, muzzle: 'duck', tail: 'puff', fur: 0xfff07a, fur2: 0xfff8c0, beak: 0xff9a3a, head: [1.08, 1.0, 1.04] },
    otter:    { name: '수달',   icon: '🦦', ears: 'small', muzzle: 'dog', tail: 'thin', fur: 0x8a5a3b, fur2: 0xe8d0b0, ear: 0x6a4028, marking: 'face', markColor: 0xe8d0b0 },
    polar:    { name: '북극곰', icon: '🐻‍❄️', ears: 'round', muzzle: 'bear', tail: 'stub', fur: 0xf6f8ff, fur2: 0xffffff, ear: 0xdfe6f0 },
    lamb:     { name: '아기양', icon: '🐏', ears: 'side', muzzle: 'sheep', tail: 'puff', fur: 0x5a4a52, fur2: 0xfff4f0, ear: 0x5a4a52, wool: true },
  };
  // 입이 주둥이 위에 입체로 붙는 종
  const MOUTH_3D = { dog: 1, bear: 1, fox: 1, deer: 1 };

  const OPT = {
    eyes: { dot: '동글', sparkle: '반짝', round: '말똥', happy: '웃음', sleepy: '졸림', smug: '새침', wink: '윙크', star: '별빛' },
    brows: { none: '없음', thin: '얇은', thick: '굵은', dots: '동그란', angry: '화난', worried: '걱정' },
    mouth: { smile: '방긋', w: 'ω', open: '헤~', grin: '활짝', tooth: '앞니', flat: '일자', pout: '뾰로통', none: '없음' },
    marking: { none: '없음', stripes: '이마 줄무늬', mask: '눈 마스크', patch: '눈 얼룩', blaze: '이마 흰줄', spots: '주근깨', face: '얼굴 무늬' },
    hairStyle: { short: '짧은 머리', bob: '단발', pigtails: '양갈래', spiky: '삐죽', long: '긴 머리', bun: '똥머리', ponytail: '포니테일', afro: '뽀글 파마', twinbun: '양쪽 똥머리', curly: '곱슬 단발', sidepart: '가르마 펌' },
    top: { tee: '티셔츠', sweater: '스웨터', hoodie: '후드티', aloha: '알로하 셔츠', vest: '조끼 정장', dress: '원피스', apron: '앞치마' },
    pattern: { plain: '무지', stripe: '줄무늬', stripe2: '알록 줄무늬', dots: '물방울', plaid: '체크', snow: '눈꽃 니트', leaf: '나뭇잎', flower: '꽃무늬', heart: '하트', star: '별' },
    bottom: { shorts: '반바지', pants: '긴바지', skirt: '치마', none: '없음' },
    hat: { none: '없음', bucket: '벙거지', cap: '야구모자', beanie: '비니', nightcap: '수면 모자', straw: '밀짚모자', bow: '리본', flower: '꽃핀', crown: '왕관', beret: '베레모', headband: '머리띠', halo: '천사 링', horns: '작은 뿔', headphones: '헤드폰' },
    glasses: { none: '없음', round: '동그란 안경', square: '네모 안경', sun: '선글라스', heart: '하트 안경' },
    acc: { none: '없음', backpack: '가방', bowtie: '나비넥타이', scarf: '목도리', necklace: '목걸이', tie: '넥타이', cape: '망토', wings: '날개', lei: '꽃목걸이', satchel: '크로스백' },
  };

  const PALETTE = {
    fur: [0xffffff, 0xfff1e0, 0xfff3b0, 0xffcc3a, 0xff9a4a, 0xd9a066, 0xc08348, 0x8a5a3b, 0x5a3a2a, 0x3a4a6a,
      0x9aa3ad, 0xa9c6e8, 0xb3b9ff, 0xc9b3ff, 0xff8fa0, 0xffc2c7, 0x7ccf6a, 0x8fd3cc, 0x4a4a52, 0x2b2b30],
    cloth: [0xffffff, 0xfff4d6, 0xff6f61, 0xff8fb1, 0xffd84a, 0xffb13d, 0x8ee07a, 0x4fbf8a, 0x8fd3ff, 0x4fc1c9,
      0x3a7bd5, 0x2f4b6e, 0xb69cff, 0x9aa7b0, 0xcfd6de, 0x8a5a3b, 0x55624a, 0x3a3a3a],
    skin: [0xfff0e0, 0xffe2c8, 0xf6cfa8, 0xe0b088, 0xc68d62, 0x9a6440, 0x6e4630],
    hair: [0x2b201c, 0x5a3a2a, 0x8a5a3b, 0xc98a4a, 0xf2c46d, 0xfff0b0, 0xe8735a, 0xff8fb1, 0xb69cff, 0x7a8cff, 0x4fc1c9, 0x9aa3ad],
    eye: [0x2b201c, 0x3a2a60, 0x1f5f7a, 0x2f6b3a, 0x7a3a2a, 0x7a4a6a],
  };

  const BASE = {
    species: 'cat', name: '',
    fur: 0xa9c6e8, fur2: 0xeaf3ff, ear: 0xff9fb2, beak: 0xff8a2a, markColor: 0x6f8fb8, marking: 'none',
    skin: 0xffe2c8, hair: 0x8a5a3b, hairStyle: 'short',
    eyes: 'dot', eyeColor: 0x2b201c, brows: 'none', mouth: 'smile', blush: 0xff7a95,
    top: 'tee', shirt: 0x8fd3ff, shirt2: 0xffffff, pattern: 'plain',
    bottom: 'shorts', pants: 0x5b6b9a, shoes: 0xffffff,
    hat: 'none', hatColor: 0xffcf3a, glasses: 'none', glassesColor: 0x3a3a3a, acc: 'none', accColor: 0xef5a4f,
    antlers: true,
  };

  // 누락된 값 채우기
  function normalizeLook(l = {}) {
    const sp = SPECIES[l.species] ? l.species : 'cat';
    const d = SPECIES[sp];
    const out = Object.assign({}, BASE, {
      fur: d.fur ?? BASE.fur, fur2: d.fur2 ?? BASE.fur2, ear: d.ear ?? BASE.ear, beak: d.beak ?? BASE.beak,
      marking: d.marking || 'none', markColor: d.markColor ?? BASE.markColor,
    }, l, { species: sp });
    for (const k of Object.keys(OPT)) {
      const key = k === 'hat' ? 'hat' : k;
      if (!(out[key] in OPT[k])) out[key] = Object.keys(OPT[k])[0];
    }
    if (out.eyes === 'dot' && !OPT.eyes[out.eyes]) out.eyes = 'dot';
    return out;
  }
  // 종을 바꿀 때 종 고유 색으로 바꿔줌 (옷은 유지)
  function withSpecies(look, sp) {
    const d = SPECIES[sp];
    const n = Object.assign({}, look, { species: sp });
    for (const k of ['fur', 'fur2', 'ear', 'beak', 'markColor']) if (d[k] !== undefined) n[k] = d[k];
    n.marking = d.marking || 'none';
    return normalizeLook(n);
  }

  // ---------------------------------------------------------
  // 텍스처 (옷 무늬, 얼굴)
  // ---------------------------------------------------------
  const texCache = new Map();
  function canvasTex(key, w, h, draw, repeat) {
    if (texCache.has(key)) return texCache.get(key);
    if (texCache.size > 160) { // 캐릭터 만들기에서 색을 많이 바꿔도 메모리가 계속 늘지 않게
      const first = texCache.keys().next().value;
      texCache.get(first).dispose();
      texCache.delete(first);
    }
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    t.anisotropy = 4;
    texCache.set(key, t);
    return t;
  }
  const circle = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
  const ellipse = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); };
  function star(g, x, y, r) {
    g.beginPath();
    for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r, a = i / 10 * Math.PI * 2 - Math.PI / 2; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.closePath(); g.fill();
  }
  function heart(g, x, y, s) {
    g.beginPath(); g.moveTo(x, y + s * 0.9);
    g.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.5, y - s * 1.3, x, y - s * 0.4);
    g.bezierCurveTo(x + s * 0.5, y - s * 1.3, x + s * 1.6, y - s * 0.2, x, y + s * 0.9);
    g.fill();
  }
  const shade = (c, k) => {
    const r = Math.min(255, Math.max(0, ((c >> 16) & 255) * k)), gg = Math.min(255, Math.max(0, ((c >> 8) & 255) * k)), b = Math.min(255, Math.max(0, (c & 255) * k));
    return (r << 16) | (gg << 8) | b;
  };

  function patternTex(pattern, base, accent) {
    return canvasTex(`pat-${pattern}-${base}-${accent}`, 256, 128, (g, w, h) => {
      const A = hex(accent);
      g.fillStyle = hex(base); g.fillRect(0, 0, w, h);
      if (pattern === 'stripe') {
        g.fillStyle = A; for (let y = 6; y < h; y += 26) g.fillRect(0, y, w, 12);
      } else if (pattern === 'stripe2') {
        const c = ['#ff6f61', A, '#4fc1c9', hex(shade(base, 0.6))];
        for (let y = 0, i = 0; y < h; y += 16, i++) { g.fillStyle = c[i % 4]; g.fillRect(0, y, w, 10); }
      } else if (pattern === 'dots') {
        const c = [A, '#ff4d4d', '#ffd23a', '#3aa0ff', '#3ac46a'];
        let i = 0;
        for (let y = 14; y < h; y += 34) for (let x = (y / 34 | 0) % 2 ? 26 : 8; x < w; x += 38) { g.fillStyle = c[i++ % c.length]; ellipse(g, x, y, 11, 8); }
      } else if (pattern === 'plaid') {
        g.globalAlpha = 0.45; g.fillStyle = A;
        for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 12, h);
        for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 12);
        g.globalAlpha = 0.8; g.fillStyle = '#fff5c0';
        for (let x = 20; x < w; x += 32) g.fillRect(x, 0, 2, h);
        g.globalAlpha = 1;
      } else if (pattern === 'snow') {
        g.fillStyle = A;
        for (let x = 8; x < w; x += 32) { star(g, x, 40, 8); circle(g, x + 16, 58, 3); }
        g.fillRect(0, 76, w, 6);
        for (let x = 0; x < w; x += 20) g.fillRect(x, 90, 10, 10);
      } else if (pattern === 'leaf') {
        g.fillStyle = A; g.strokeStyle = hex(base); g.lineWidth = 2;
        for (let y = 16; y < h; y += 42) for (let x = (y / 42 | 0) % 2 ? 30 : 6; x < w; x += 48) {
          g.save(); g.translate(x, y); g.rotate(0.6);
          ellipse(g, 0, 0, 16, 9); g.beginPath(); g.moveTo(-14, 0); g.lineTo(14, 0); g.stroke();
          g.restore();
        }
      } else if (pattern === 'flower') {
        for (let y = 18; y < h; y += 40) for (let x = (y / 40 | 0) % 2 ? 30 : 8; x < w; x += 46) {
          g.fillStyle = A;
          for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; circle(g, x + Math.cos(a) * 7, y + Math.sin(a) * 7, 6); }
          g.fillStyle = '#ffd84a'; circle(g, x, y, 4);
        }
      } else if (pattern === 'heart') {
        g.fillStyle = A;
        for (let y = 18; y < h; y += 38) for (let x = (y / 38 | 0) % 2 ? 28 : 8; x < w; x += 40) heart(g, x, y, 9);
      } else if (pattern === 'star') {
        g.fillStyle = A;
        for (let y = 18; y < h; y += 38) for (let x = (y / 38 | 0) % 2 ? 28 : 8; x < w; x += 40) star(g, x, y, 10);
      }
    }, [2, 1]);
  }

  // 얼굴: 머리 앞쪽을 덮는 구면 조각에 입히는 투명 텍스처
  function faceTex(l, blink) {
    const sp = SPECIES[l.species];
    const keyStr = ['face', l.species, l.eyes, l.eyeColor, l.brows, l.mouth, l.blush, l.marking, l.markColor, l.fur, l.skin, l.hair, blink ? 1 : 0].join('|');
    return canvasTex(keyStr, 512, 384, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const base = l.species === 'human' ? l.skin : l.fur;
      const mark = hex(l.markColor);
      const ex = [w * 0.32, w * 0.68], ey = h * 0.47;

      // 무늬
      if (l.marking === 'stripes') {
        g.strokeStyle = mark; g.lineWidth = 16; g.lineCap = 'round';
        for (const x of [w * 0.43, w * 0.5, w * 0.57]) { g.beginPath(); g.moveTo(x, 10); g.lineTo(x, 62); g.stroke(); }
      } else if (l.marking === 'mask') {
        g.fillStyle = mark;
        g.beginPath();
        g.moveTo(w * 0.08, ey - 20);
        g.bezierCurveTo(w * 0.2, ey - 70, w * 0.42, ey - 40, w * 0.5, ey - 22);
        g.bezierCurveTo(w * 0.58, ey - 40, w * 0.8, ey - 70, w * 0.92, ey - 20);
        g.bezierCurveTo(w * 0.95, ey + 50, w * 0.7, ey + 70, w * 0.5, ey + 28);
        g.bezierCurveTo(w * 0.3, ey + 70, w * 0.05, ey + 50, w * 0.08, ey - 20);
        g.fill();
      } else if (l.marking === 'patch') {
        g.fillStyle = mark; ellipse(g, ex[1] + 6, ey - 4, 62, 58, 0.3);
      } else if (l.marking === 'blaze') {
        g.fillStyle = mark;
        g.beginPath(); g.moveTo(w * 0.44, 0); g.lineTo(w * 0.56, 0); g.quadraticCurveTo(w * 0.53, ey, w * 0.5, ey + 20); g.quadraticCurveTo(w * 0.47, ey, w * 0.44, 0); g.fill();
      } else if (l.marking === 'spots') {
        g.fillStyle = mark;
        for (const [x, y, r] of [[0.14, 0.72, 7], [0.2, 0.78, 6], [0.1, 0.8, 5], [0.86, 0.72, 7], [0.8, 0.78, 6], [0.9, 0.8, 5]]) circle(g, w * x, h * y, r);
      } else if (l.marking === 'face') {
        g.fillStyle = mark;
        g.beginPath();
        g.moveTo(w * 0.5, ey - 30);
        g.bezierCurveTo(w * 0.35, ey - 110, w * 0.02, ey - 80, w * 0.06, ey + 40);
        g.bezierCurveTo(w * 0.1, h * 1.05, w * 0.9, h * 1.05, w * 0.94, ey + 40);
        g.bezierCurveTo(w * 0.98, ey - 80, w * 0.65, ey - 110, w * 0.5, ey - 30);
        g.fill();
      }

      // 볼터치
      if (l.blush !== null && l.blush !== undefined) {
        for (const x of [w * 0.16, w * 0.84]) {
          const grd = g.createRadialGradient(x, h * 0.66, 0, x, h * 0.66, 46);
          const c = hex(l.blush);
          grd.addColorStop(0, c + 'cc'); grd.addColorStop(0.6, c + '66'); grd.addColorStop(1, c + '00');
          g.fillStyle = grd; ellipse(g, x, h * 0.66, 46, 32);
        }
      }

      // 눈썹
      const browCol = hex(l.species === 'human' ? shade(l.hair, 0.8) : shade(l.marking === 'mask' ? l.markColor : base, 0.55));
      g.strokeStyle = browCol; g.fillStyle = browCol; g.lineCap = 'round';
      const by = ey - 68;
      for (const [i, x] of ex.entries()) {
        const s = i === 0 ? -1 : 1;
        if (l.brows === 'thin') { g.lineWidth = 7; g.beginPath(); g.moveTo(x - 24, by + 6); g.quadraticCurveTo(x, by - 8, x + 24, by + 6); g.stroke(); }
        else if (l.brows === 'thick') { g.lineWidth = 16; g.beginPath(); g.moveTo(x - 22, by + 4); g.quadraticCurveTo(x, by - 8, x + 22, by + 4); g.stroke(); }
        else if (l.brows === 'dots') { ellipse(g, x - s * 6, by, 14, 10); }
        else if (l.brows === 'angry') { g.lineWidth = 13; g.beginPath(); g.moveTo(x + s * 26, by - 10); g.lineTo(x - s * 22, by + 12); g.stroke(); }
        else if (l.brows === 'worried') { g.lineWidth = 11; g.beginPath(); g.moveTo(x + s * 26, by + 10); g.lineTo(x - s * 22, by - 10); g.stroke(); }
      }

      // 눈
      if (l.species !== 'frog') {
        const ink = hex(l.eyeColor);
        const lid = hex(l.marking === 'mask' ? l.markColor : base);
        const arc = (x, lw = 14) => { g.strokeStyle = '#2b201c'; g.lineWidth = lw; g.beginPath(); g.moveTo(x - 30, ey + 10); g.quadraticCurveTo(x, ey - 26, x + 30, ey + 10); g.stroke(); };
        const oval = (x, rx, ry, withStar) => {
          if (l.marking === 'mask') { g.fillStyle = '#fff'; ellipse(g, x, ey, rx + 7, ry + 7); }
          const grd = g.createLinearGradient(0, ey - ry, 0, ey + ry);
          grd.addColorStop(0, '#1d1512'); grd.addColorStop(0.55, '#2b201c'); grd.addColorStop(1, ink);
          g.fillStyle = grd; ellipse(g, x, ey, rx, ry);
          g.fillStyle = '#fff';
          if (withStar) star(g, x - rx * 0.3, ey - ry * 0.35, rx * 0.45);
          else ellipse(g, x - rx * 0.35, ey - ry * 0.38, rx * 0.36, ry * 0.3);
          circle(g, x + rx * 0.35, ey + ry * 0.4, rx * 0.16);
        };
        ex.forEach((x, i) => {
          if (blink && l.eyes !== 'happy') { g.strokeStyle = '#2b201c'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 28, ey + 4); g.quadraticCurveTo(x, ey + 18, x + 28, ey + 4); g.stroke(); return; }
          switch (l.eyes) {
            case 'happy': arc(x); break;
            case 'wink': if (i === 1) arc(x); else oval(x, 32, 41); break;
            case 'sparkle':
              oval(x, 38, 46);
              g.strokeStyle = '#2b201c'; g.lineWidth = 6;
              for (const a of [-0.5, -0.2]) { const s = i === 0 ? -1 : 1; g.beginPath(); g.moveTo(x + s * Math.cos(a) * 38, ey + Math.sin(a) * 46); g.lineTo(x + s * Math.cos(a) * 52, ey + Math.sin(a) * 58); g.stroke(); }
              break;
            case 'round':
              g.fillStyle = '#fff'; ellipse(g, x, ey, 36, 38);
              g.strokeStyle = '#2b201c'; g.lineWidth = 6; g.beginPath(); g.ellipse(x, ey, 36, 38, 0, 0, Math.PI * 2); g.stroke();
              g.fillStyle = ink; circle(g, x + (i === 0 ? 6 : -6), ey + 6, 16);
              g.fillStyle = '#fff'; circle(g, x + (i === 0 ? 1 : -11), ey, 5);
              break;
            case 'sleepy':
              oval(x, 32, 38);
              g.fillStyle = lid; g.fillRect(x - 46, ey - 50, 92, 50);
              g.strokeStyle = '#2b201c'; g.lineWidth = 9; g.beginPath(); g.moveTo(x - 36, ey); g.lineTo(x + 36, ey); g.stroke();
              break;
            case 'smug': {
              oval(x, 30, 38);
              const s = i === 0 ? -1 : 1;
              g.fillStyle = lid;
              g.beginPath(); g.moveTo(x - 50, ey - 60); g.lineTo(x + 50, ey - 60); g.lineTo(x + 50, ey - 10 + s * -12); g.lineTo(x - 50, ey - 10 - s * -12); g.closePath(); g.fill();
              g.strokeStyle = '#2b201c'; g.lineWidth = 9; g.beginPath(); g.moveTo(x - 36, ey - 10 - s * -9); g.lineTo(x + 36, ey - 10 + s * -9); g.stroke();
              break;
            }
            case 'star': oval(x, 34, 42, true); break;
            default: oval(x, 32, 41);
          }
        });
      }

      // 입 (주둥이가 큰 종은 입체 입을 따로 붙임)
      if (!MOUTH_3D[sp.muzzle]) {
        const mx = w * 0.5, my = h * (sp.muzzle === 'pig' || sp.muzzle === 'koala' ? 0.8 : l.species === 'frog' ? 0.62 : 0.71);
        drawMouth(g, l.mouth, mx, my, l.species === 'frog' ? 2 : 1);
      }
    });
  }
  function drawMouth(g, style, mx, my, s = 1) {
    g.lineWidth = 10; g.strokeStyle = '#6a3a2e'; g.lineJoin = 'round'; g.lineCap = 'round';
    const W = 30 * s;
    if (style === 'w') {
      g.beginPath(); g.moveTo(mx - W, my - 8); g.quadraticCurveTo(mx - W / 2, my + 18, mx, my - 4); g.quadraticCurveTo(mx + W / 2, my + 18, mx + W, my - 8); g.stroke();
    } else if (style === 'smile') {
      g.fillStyle = '#b8454a';
      g.beginPath(); g.moveTo(mx - W * 0.7, my - 6); g.quadraticCurveTo(mx, my + 26, mx + W * 0.7, my - 6); g.closePath(); g.fill();
      g.fillStyle = '#ff8a8a'; ellipse(g, mx, my + 8, 8 * s, 5);
    } else if (style === 'grin') {
      g.fillStyle = '#8a2f36';
      g.beginPath(); g.moveTo(mx - W, my - 8); g.quadraticCurveTo(mx, my + 44, mx + W, my - 8); g.closePath(); g.fill();
      g.fillStyle = '#ff8a8a'; ellipse(g, mx, my + 16, 14 * s, 8);
      g.fillStyle = '#fff'; g.fillRect(mx - W * 0.7, my - 8, W * 1.4, 8);
    } else if (style === 'open') {
      g.fillStyle = '#8a2f36'; ellipse(g, mx, my + 4, 16 * s, 14);
      g.fillStyle = '#ff8a8a'; ellipse(g, mx, my + 10, 9 * s, 6);
    } else if (style === 'tooth') {
      g.fillStyle = '#8a2f36'; ellipse(g, mx, my + 2, 20 * s, 16);
      g.fillStyle = '#fff'; g.fillRect(mx - 13, my - 14, 12, 14); g.fillRect(mx + 1, my - 14, 12, 14);
    } else if (style === 'flat') {
      g.beginPath(); g.moveTo(mx - 18 * s, my); g.lineTo(mx + 18 * s, my); g.stroke();
    } else if (style === 'pout') {
      g.beginPath(); g.moveTo(mx - 18 * s, my + 8); g.quadraticCurveTo(mx, my - 12, mx + 18 * s, my + 8); g.stroke();
    }
  }

  // 입체 입 (주둥이 앞에 붙는 작은 곡선)
  function mouth3D(style, parent, x, y, z) {
    const ink = mat(0x5a2e26);
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const arcGeo = r => geo(`marc${r}`, () => new THREE.TorusGeometry(r, 0.011, 6, 16, Math.PI));
    if (style === 'w') {
      for (const s of [-1, 1]) { const a = mesh(arcGeo(0.03), ink, s * 0.03, 0, 0, false); a.rotation.z = Math.PI; g.add(a); }
    } else if (style === 'smile' || style === 'grin') {
      const r = style === 'grin' ? 0.06 : 0.045;
      const a = mesh(geo(`mhalf${r}`, () => new THREE.CircleGeometry(r, 18, Math.PI, Math.PI)), mat(0xa8404a), 0, 0.01, 0, false);
      g.add(a);
      g.add(mesh(geo(`mtongue${r}`, () => new THREE.CircleGeometry(r * 0.45, 12, Math.PI, Math.PI)), mat(0xff8a8a), 0, 0.0, 0.002, false));
    } else if (style === 'open' || style === 'tooth') {
      const a = mesh(geo('mopen', () => new THREE.CircleGeometry(0.035, 16)), mat(0x8a2f36), 0, -0.01, 0, false);
      a.scale.y = 0.85;
      g.add(a);
      if (style === 'tooth') for (const s of [-1, 1]) g.add(mesh(geo('mtooth', () => new THREE.PlaneGeometry(0.018, 0.022)), mat(0xffffff), s * 0.011, 0.01, 0.002, false));
    } else if (style === 'flat') {
      const a = mesh(capsule(0.009, 0.05), ink, 0, 0, 0, false); a.rotation.z = Math.PI / 2; g.add(a);
    } else if (style === 'pout') {
      const a = mesh(arcGeo(0.03), ink, 0, -0.02, 0, false); g.add(a);
    }
    parent.add(g);
  }

  // ---------------------------------------------------------
  // 캐릭터 만들기
  // ---------------------------------------------------------
  const HEAD_R = 0.43;
  function build(lookIn) {
    const l = normalizeLook(lookIn);
    const sp = SPECIES[l.species];
    const human = l.species === 'human';
    const skin = human ? l.skin : l.fur;
    const skin2 = human ? l.skin : l.fur2;
    const root = new THREE.Group();
    const body = new THREE.Group();
    // 체형 (키 · 통통함) — 주민마다 조금씩 다름
    const shapeG = new THREE.Group();
    shapeG.scale.set(l.width || 1, l.height || 1, l.width || 1);
    shapeG.add(body);
    root.add(shapeG);

    // ----- 다리 / 발 -----
    const legColor = l.bottom === 'pants' && l.top !== 'dress' ? l.pants : skin;
    const footColor = human ? l.shoes : (l.species === 'duck' || l.species === 'penguin' ? 0xff9a3a : skin2);
    const makeLeg = side => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.1, 0.2, 0);
      pivot.add(mesh(capsule(0.075, 0.06), mat(legColor), 0, -0.07, 0));
      const foot = mesh(sphere(0.1), mat(footColor), 0, -0.15, 0.035);
      foot.scale.set(1, 0.62, 1.3);
      pivot.add(foot);
      body.add(pivot);
      return pivot;
    };
    const legL = makeLeg(-1), legR = makeLeg(1);

    // ----- 옷 -----
    const shirtMat = l.pattern === 'plain' ? mat(l.shirt) : soften(new THREE.MeshLambertMaterial({ map: patternTex(l.pattern, l.shirt, l.shirt2) }));
    const innerMat = mat(l.shirt2);
    let torsoMat = shirtMat;
    if (l.top === 'apron') torsoMat = innerMat;
    const torsoPts = l.top === 'dress'
      ? [[0.0001, 0], [0.3, 0.0], [0.32, 0.05], [0.28, 0.16], [0.24, 0.27], [0.19, 0.35], [0.1, 0.39], [0.0001, 0.395]]
      : [[0.0001, 0], [0.2, 0.005], [0.265, 0.07], [0.275, 0.16], [0.245, 0.27], [0.19, 0.35], [0.1, 0.39], [0.0001, 0.395]];
    body.add(mesh(lathe('torso-' + (l.top === 'dress' ? 'dress' : 'std'), torsoPts), torsoMat, 0, 0.12, 0));
    if (l.top === 'dress') {
      body.add(mesh(lathe('dressSkirt', [[0.0001, 0.2], [0.24, 0.2], [0.3, 0.12], [0.34, 0.02], [0.33, 0], [0.0001, 0]]), shirtMat, 0, 0.02, 0));
    } else if (l.bottom === 'shorts' || l.bottom === 'pants') {
      body.add(mesh(lathe('shorts', [[0.0001, 0], [0.22, 0.0], [0.27, 0.06], [0.275, 0.12], [0.0001, 0.12]]), mat(l.pants), 0, 0.1, 0));
    } else if (l.bottom === 'skirt') {
      body.add(mesh(lathe('skirt', [[0.0001, 0.14], [0.27, 0.14], [0.31, 0.07], [0.34, 0.0], [0.0001, 0]]), mat(l.pants), 0, 0.07, 0));
    }
    // 윗옷 종류별 디테일
    const collarAt = (color, r = 0.15, t = 0.035) => {
      const c = mesh(geo(`collar${r},${t}`, () => new THREE.TorusGeometry(r, t, 10, 28)), mat(color), 0, 0.49, 0.02);
      c.rotation.x = Math.PI / 2 - 0.2;
      body.add(c);
    };
    if (l.top === 'tee') collarAt(shade(l.shirt, 0.85), 0.14, 0.025);
    if (l.top === 'sweater') collarAt(l.shirt, 0.15, 0.05);
    if (l.top === 'dress') collarAt(0xffffff, 0.15, 0.035);
    if (l.top === 'hoodie') {
      const hood = mesh(geo('hood', () => new THREE.TorusGeometry(0.17, 0.07, 12, 28)), shirtMat, 0, 0.5, -0.04);
      hood.rotation.x = Math.PI / 2 + 0.35;
      body.add(hood);
      body.add(mesh(box(0.3, 0.12, 0.08, 0.04), mat(shade(l.shirt, 0.9)), 0, 0.26, 0.24));
      for (const s of [-1, 1]) body.add(mesh(capsule(0.01, 0.1), mat(0xffffff), s * 0.06, 0.4, 0.22, false));
    }
    if (l.top === 'aloha' || l.top === 'vest') {
      // V 자 옷깃
      for (const s of [-1, 1]) {
        const flap = mesh(box(0.14, 0.05, 0.12, 0.024), l.top === 'vest' ? innerMat : shirtMat, s * 0.08, 0.47, 0.13);
        flap.rotation.set(-0.5, s * 0.5, s * 0.5);
        body.add(flap);
      }
      for (const y of [0.4, 0.31, 0.22]) body.add(mesh(sphere(0.022), mat(l.top === 'vest' ? 0xd9b44a : 0xfff4d6), 0, y, 0.27 - (0.4 - y) * 0.12, false));
      if (l.top === 'vest') {
        const tieKnot = mesh(sphere(0.03), mat(l.accColor), 0, 0.45, 0.21, false);
        body.add(tieKnot);
      }
    }
    if (l.top === 'apron') {
      const ap = mesh(box(0.34, 0.3, 0.04, 0.05), shirtMat, 0, 0.26, 0.25);
      ap.rotation.x = -0.12;
      body.add(ap);
      body.add(mesh(box(0.14, 0.08, 0.02, 0.02), mat(shade(l.shirt, 0.85)), 0, 0.22, 0.28, false));
      for (const s of [-1, 1]) {
        const strap = mesh(capsule(0.015, 0.14), shirtMat, s * 0.13, 0.46, 0.14, false);
        strap.rotation.x = -0.6;
        body.add(strap);
      }
    }

    // ----- 팔 -----
    const longSleeve = l.top === 'sweater' || l.top === 'hoodie' || l.top === 'vest';
    const armMatTop = l.top === 'apron' ? innerMat : shirtMat;
    const makeArm = side => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.22, 0.44, 0);
      const arm = mesh(capsule(0.065, 0.09), longSleeve ? armMatTop : mat(skin), side * 0.035, -0.08, 0);
      arm.rotation.z = side * 0.35;
      pivot.add(arm);
      if (!longSleeve && l.top !== 'dress') {
        const sleeve = mesh(sphere(0.085), armMatTop, side * 0.015, -0.02, 0);
        sleeve.scale.set(1, 0.8, 1);
        pivot.add(sleeve);
      }
      const handColor = l.species === 'penguin' ? l.fur : skin2;
      pivot.add(mesh(sphere(0.078), mat(handColor), side * 0.075, -0.18, 0.01));
      body.add(pivot);
      return pivot;
    };
    const armL = makeArm(-1), armR = makeArm(1);

    // ----- 머리 -----
    const head = new THREE.Group();
    head.position.y = 0.9;
    body.add(head);
    const hs = sp.head || [1.1, 0.95, 1.02];
    const skull = mesh(sphere(HEAD_R, 36, 28), mat(skin));
    skull.scale.set(...hs);
    head.add(skull);
    const F = HEAD_R * hs[2];

    const faceGeo = geo('face', () => new THREE.SphereGeometry(HEAD_R + 0.004, 32, 20, Math.PI / 2 - 1.0, 2.0, Math.PI * 0.3, Math.PI * 0.46));
    const tFace = faceTex(l, false), tBlink = faceTex(l, true);
    const face = new THREE.Mesh(faceGeo, new THREE.MeshLambertMaterial({ map: tFace, transparent: true, depthWrite: false }));
    face.scale.set(...hs);
    face.renderOrder = 2;
    head.add(face);

    buildEars(head, l, sp, hs);
    buildMuzzle(head, l, sp, F);
    if (human) buildHair(head, l);
    if (sp.wool) {
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * Math.PI * 2;
        head.add(mesh(sphere(0.12), mat(l.fur2), Math.cos(a) * 0.27 * hs[0], 0.3 + Math.sin(a * 2) * 0.03, Math.sin(a) * 0.22 - 0.05));
      }
      head.add(mesh(sphere(0.15), mat(l.fur2), 0, 0.38, 0));
      // 몸에도 복슬복슬
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; body.add(mesh(sphere(0.07), mat(l.fur2), Math.cos(a) * 0.25, 0.47, Math.sin(a) * 0.2)); }
    }
    if (l.species === 'deer' && l.antlers) {
      for (const s of [-1, 1]) {
        const ant = new THREE.Group();
        ant.position.set(s * 0.18, HEAD_R * hs[1] - 0.02, -0.05);
        ant.rotation.z = -s * 0.35;
        const brown = mat(0xa87848);
        ant.add(mesh(capsule(0.025, 0.18), brown, 0, 0.1, 0));
        const b1 = mesh(capsule(0.02, 0.08), brown, s * 0.05, 0.14, 0); b1.rotation.z = -s * 0.9; ant.add(b1);
        const b2 = mesh(capsule(0.02, 0.06), brown, -s * 0.03, 0.2, 0); b2.rotation.z = s * 0.7; ant.add(b2);
        head.add(ant);
      }
    }
    buildHat(head, l, hs);
    buildGlasses(head, l, hs);
    buildAcc(body, l);
    buildTail(body, l, sp);

    root.traverse(o => { if (o.isMesh && o !== face) o.castShadow = true; });

    return {
      root, body, head, legL, legR, armL, armR, face, faceTex: tFace, blinkTex: tBlink, look: l,
      phase: 0, blinkT: 2 + Math.random() * 3, actionT: 0, idleT: Math.random() * 10,
      lastRot: 0, headYaw: 0, talkT: 0, waveT: 0,
    };
  }

  function buildEars(head, l, sp, hs) {
    const fur = mat(l.fur), inner = mat(l.ear);
    const pair = fn => { for (const s of [-1, 1]) fn(s); };
    switch (sp.ears) {
      case 'cat': case 'fox': case 'squirrel': {
        const big = sp.ears === 'fox' ? 1.2 : sp.ears === 'squirrel' ? 0.75 : 1;
        pair(s => {
          const e = mesh(roundCone(0.14 * big, 0.3 * big), fur, s * 0.26 * hs[0] / 1.1, 0.28, -0.02);
          e.scale.set(1, 1, 0.6); e.rotation.z = -s * 0.38; head.add(e);
          const i = mesh(roundCone(0.08 * big, 0.19 * big), sp.ears === 'fox' ? mat(l.fur2) : inner, s * 0.255 * hs[0] / 1.1, 0.3, 0.04);
          i.scale.set(1, 1, 0.35); i.rotation.z = -s * 0.38; head.add(i);
          if (sp.ears === 'fox') { const tip = mesh(sphere(0.05), inner, s * (0.26 + 0.12) * hs[0] / 1.1, 0.28 + 0.3, -0.02); head.add(tip); }
        });
        break;
      }
      case 'round': case 'small': case 'big': {
        const r = sp.ears === 'big' ? 0.2 : sp.ears === 'small' ? 0.12 : 0.13;
        const x = sp.ears === 'big' ? 0.33 : sp.ears === 'small' ? 0.27 : 0.3;
        const y = sp.ears === 'small' ? 0.32 : 0.29;
        pair(s => {
          const e = mesh(sphere(r), fur, s * x, y, -0.03); e.scale.set(1, 1, sp.ears === 'big' ? 0.45 : 0.6); head.add(e);
          const i = mesh(sphere(r * 0.62), inner, s * x, y, 0.02); i.scale.set(1, 1, 0.4); head.add(i);
        });
        break;
      }
      case 'koala':
        pair(s => {
          const e = mesh(sphere(0.19), fur, s * 0.42, 0.22, -0.04); e.scale.set(1, 1, 0.55); head.add(e);
          const i = mesh(sphere(0.12), mat(l.fur2), s * 0.42, 0.22, 0.02); i.scale.set(1, 1, 0.45); head.add(i);
          for (let k = 0; k < 3; k++) head.add(mesh(sphere(0.05), mat(l.fur2), s * (0.5 + k * 0.03), 0.14 + k * 0.08, 0.02, false));
        });
        break;
      case 'floppy':
        pair(s => {
          const e = mesh(sphere(0.15), inner, s * 0.42 * hs[0] / 1.1, 0.0, -0.02);
          e.scale.set(0.5, 1.3, 0.85); e.rotation.z = s * 0.28; head.add(e);
        });
        break;
      case 'long':
        pair(s => {
          const g = new THREE.Group();
          g.position.set(s * 0.14, 0.3, -0.05);
          g.rotation.z = -s * 0.18;
          g.add(mesh(capsule(0.09, 0.36), fur, 0, 0.24, 0));
          const i = mesh(capsule(0.05, 0.3), inner, 0, 0.24, 0.05); i.scale.z = 0.5; g.add(i);
          head.add(g);
        });
        break;
      case 'pig':
        pair(s => {
          const e = mesh(roundCone(0.13, 0.22), fur, s * 0.28, 0.3, 0.02);
          e.scale.set(1, 1, 0.5); e.rotation.set(0.7, 0, -s * 0.4); head.add(e);
        });
        break;
      case 'side':
        pair(s => {
          const e = mesh(sphere(0.11), fur, s * 0.44, 0.08, -0.02);
          e.scale.set(1.5, 0.6, 0.6); e.rotation.z = -s * 0.3; head.add(e);
          const i = mesh(sphere(0.065), inner, s * 0.46, 0.08, 0.02);
          i.scale.set(1.5, 0.5, 0.4); i.rotation.z = -s * 0.3; head.add(i);
        });
        break;
    }
  }

  function buildMuzzle(head, l, sp, F) {
    const m2 = mat(l.fur2);
    const nose = (c, x, y, z, r = 0.05) => { const n = mesh(sphere(r), mat(c), x, y, z); n.scale.set(1.3, 0.9, 0.9); head.add(n); };
    switch (sp.muzzle) {
      case 'human': head.add(mesh(sphere(0.035), mat(shade(l.skin, 0.93)), 0, -0.07, F + 0.01, false)); break;
      case 'cat': case 'rabbit':
        for (const s of [-1, 1]) { const m = mesh(sphere(0.075), m2, s * 0.055, -0.13, F - 0.04); m.scale.set(1, 0.8, 0.7); head.add(m); }
        head.add(mesh(sphere(0.035), mat(0xff8fa3), 0, -0.085, F + 0.015));
        break;
      case 'hamster':
        for (const s of [-1, 1]) head.add(mesh(sphere(0.13), m2, s * 0.27, -0.14, 0.2));
        head.add(mesh(sphere(0.03), mat(0xff6f86), 0, -0.07, F + 0.01));
        break;
      case 'mouse': {
        const sn = mesh(sphere(0.1), m2, 0, -0.1, F - 0.02); sn.scale.set(1, 0.75, 1.1); head.add(sn);
        head.add(mesh(sphere(0.035), mat(0xff8fb1), 0, -0.07, F + 0.09));
        break;
      }
      case 'dog': case 'bear': case 'deer': {
        const big = sp.muzzle === 'bear' ? 0.16 : 0.13;
        const mz = mesh(sphere(big), m2, 0, -0.13, F - 0.06);
        mz.scale.set(1.25, 0.82, 0.8); head.add(mz);
        nose(sp.muzzle === 'deer' ? 0x5a3a2a : 0x3a2520, 0, -0.08, F + 0.04, sp.muzzle === 'deer' ? 0.045 : 0.055);
        mouth3D(l.mouth, head, 0, -0.18, F + 0.045);
        break;
      }
      case 'fox': {
        const mz = mesh(sphere(0.13), m2, 0, -0.12, F - 0.02);
        mz.scale.set(1.05, 0.75, 1.25); head.add(mz);
        nose(0x2b201c, 0, -0.08, F + 0.13, 0.04);
        mouth3D(l.mouth, head, 0, -0.17, F + 0.1);
        break;
      }
      case 'pig': {
        const sn = mesh(puck(0.11, 0.1), m2, 0, -0.06, F - 0.03);
        sn.rotation.x = Math.PI / 2; head.add(sn);
        for (const s of [-1, 1]) { const n = mesh(sphere(0.022), mat(shade(l.fur2, 0.6)), s * 0.035, -0.06, F + 0.075, false); n.scale.set(0.8, 1.2, 0.3); head.add(n); }
        break;
      }
      case 'koala': {
        const n = mesh(sphere(0.1), mat(0x4a4a52), 0, -0.06, F - 0.01); n.scale.set(0.9, 1.2, 0.7); head.add(n);
        break;
      }
      case 'sheep': head.add(mesh(sphere(0.04), mat(0xff9fb2), 0, -0.07, F + 0.01)); break;
      case 'duck': { const b = mesh(sphere(0.18), mat(l.beak), 0, -0.1, F - 0.02); b.scale.set(1.25, 0.36, 1.05); head.add(b); break; }
      case 'penguin': { const b = mesh(roundCone(0.07, 0.14), mat(l.beak), 0, -0.07, F); b.rotation.x = Math.PI / 2; head.add(b); break; }
      case 'frog':
        for (const s of [-1, 1]) {
          const g = new THREE.Group();
          g.position.set(s * 0.22, 0.28, 0.1);
          g.add(mesh(sphere(0.15), mat(l.fur)));
          g.add(mesh(sphere(0.1), mat(0xffffff), 0, 0.02, 0.08));
          g.add(mesh(sphere(0.06), mat(0x1d1512), 0, 0.02, 0.15));
          g.add(mesh(sphere(0.02), mat(0xffffff), -0.02, 0.05, 0.2, false));
          head.add(g);
        }
        break;
    }
  }

  function buildHair(head, l) {
    const hm = mat(l.hair);
    const cap = mesh(geo('hair', () => new THREE.SphereGeometry(HEAD_R + 0.025, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.56)), hm);
    cap.rotation.x = -0.5;
    cap.scale.set(1.03, 0.98, 1.02);
    head.add(cap);
    const puff = (x, y, z, r, sx = 1, sy = 1, sz = 1) => { const b = mesh(sphere(r), hm, x, y, z); b.scale.set(sx, sy, sz); head.add(b); return b; };
    const bangs = () => { for (const [x, y, r] of [[-0.19, 0.2, 0.14], [-0.05, 0.25, 0.15], [0.1, 0.24, 0.15], [0.22, 0.17, 0.12]]) puff(x, y, 0.28, r, 1, 0.75, 0.62); };
    switch (l.hairStyle) {
      case 'short': bangs(); for (const s of [-1, 1]) puff(s * 0.38, -0.02, 0.02, 0.13, 0.55, 1.1, 0.9); break;
      case 'bob':
        bangs();
        for (const s of [-1, 1]) puff(s * 0.36, -0.1, 0, 0.2, 0.6, 1.2, 1.1);
        puff(0, -0.1, -0.25, 0.3, 1.3, 1, 0.6);
        break;
      case 'pigtails':
        bangs();
        for (const s of [-1, 1]) {
          puff(s * 0.47, -0.02, -0.05, 0.14, 1, 1.25, 1);
          head.add(mesh(sphere(0.04), mat(0xff6f86), s * 0.4, 0.1, -0.05));
        }
        break;
      case 'spiky':
        for (let i = 0; i < 7; i++) {
          const a = (i / 6 - 0.5) * 2.2;
          const sp = mesh(roundCone(0.1, 0.2), hm, Math.sin(a) * 0.3, 0.3 + Math.cos(a) * 0.08, 0.12 - Math.abs(a) * 0.05);
          sp.rotation.set(0.5, 0, -a * 0.8);
          head.add(sp);
        }
        for (const s of [-1, 1]) puff(s * 0.38, -0.02, 0.02, 0.12, 0.55, 1, 0.9);
        break;
      case 'long':
        bangs();
        for (const s of [-1, 1]) puff(s * 0.38, -0.2, -0.02, 0.18, 0.55, 1.6, 1);
        puff(0, -0.25, -0.26, 0.32, 1.25, 1.5, 0.55);
        break;
      case 'ponytail':
        bangs();
        for (const s of [-1, 1]) puff(s * 0.38, -0.02, 0.02, 0.13, 0.55, 1.1, 0.9);
        puff(0, 0.1, -0.42, 0.13, 1, 1, 1);
        puff(0, -0.12, -0.5, 0.15, 0.9, 1.6, 0.9);
        head.add(mesh(geo('ptTie', () => new THREE.TorusGeometry(0.07, 0.022, 8, 18)), mat(0xff6f86), 0, 0.06, -0.44));
        break;
      case 'afro':
        for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; puff(Math.cos(a) * 0.36, 0.22 + Math.sin(i * 1.7) * 0.08, Math.sin(a) * 0.3 - 0.05, 0.2); }
        puff(0, 0.42, -0.05, 0.3, 1.2, 0.8, 1.1);
        break;
      case 'twinbun':
        bangs();
        for (const s of [-1, 1]) { puff(s * 0.3, 0.42, -0.08, 0.13); puff(s * 0.38, -0.02, 0.02, 0.13, 0.55, 1.1, 0.9); }
        break;
      case 'curly':
        bangs();
        for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 3.4; puff(Math.sin(a) * 0.4, -0.12 + (i % 2) * 0.06, Math.cos(a) * -0.2, 0.14); }
        break;
      case 'sidepart':
        for (const [x, y, r] of [[-0.2, 0.24, 0.17], [-0.02, 0.28, 0.15], [0.16, 0.22, 0.12]]) puff(x, y, 0.27, r, 1.1, 0.7, 0.6);
        for (const s of [-1, 1]) puff(s * 0.38, -0.05, 0.02, 0.14, 0.6, 1.3, 0.9);
        puff(-0.28, 0.3, 0.12, 0.14, 1.2, 0.8, 1);
        break;
      case 'bun':
        bangs();
        puff(0, 0.45, -0.12, 0.16);
        head.add(mesh(geo('bunTie', () => new THREE.TorusGeometry(0.1, 0.025, 8, 20)), mat(0xff6f86), 0, 0.36, -0.1).rotateX(Math.PI / 2 + 0.4));
        for (const s of [-1, 1]) puff(s * 0.38, -0.02, 0.02, 0.13, 0.55, 1.1, 0.9);
        break;
    }
    // 머리 위 새싹 (모자가 없을 때)
    if (l.hat === 'none') {
      const sprout = new THREE.Group();
      sprout.position.set(0.02, HEAD_R + 0.05, -0.02);
      sprout.add(mesh(capsule(0.012, 0.06), mat(0x5a9e3a), 0, 0.02, 0, false));
      for (const s of [-1, 1]) { const lf = mesh(sphere(0.06), mat(0x7cc864), s * 0.05, 0.08, 0, false); lf.scale.set(1, 0.45, 0.6); lf.rotation.z = s * 0.5; sprout.add(lf); }
      if (!['bun', 'spiky', 'afro', 'twinbun'].includes(l.hairStyle)) head.add(sprout);
    }
  }

  function buildHat(head, l, hs) {
    if (l.hat === 'none') return;
    const c = mat(l.hatColor);
    const g = new THREE.Group();
    const top = HEAD_R * hs[1];
    const dome = (sy = 0.78) => {
      const d = mesh(geo('hatDome', () => new THREE.SphereGeometry(0.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)), c);
      d.scale.set(1.03, sy, 1.03); g.add(d); return d;
    };
    switch (l.hat) {
      case 'bucket': {
        dome();
        const brim = mesh(geo('hatBrim', () => new THREE.TorusGeometry(0.43, 0.065, 12, 36)), c, 0, 0.02, 0);
        brim.rotation.x = Math.PI / 2; brim.scale.set(1, 1, 0.55); g.add(brim);
        g.add(mesh(geo('hatBand', () => new THREE.TorusGeometry(0.405, 0.03, 8, 36)), mat(0xffffff), 0, 0.07, 0).rotateX(Math.PI / 2));
        g.position.set(0, top - 0.24, -0.03); g.rotation.x = -0.22;
        break;
      }
      case 'cap': {
        dome(0.72);
        const visor = mesh(box(0.42, 0.04, 0.3, 0.02), c, 0, 0.02, 0.44);
        visor.rotation.x = 0.12; g.add(visor);
        g.add(mesh(sphere(0.04), c, 0, 0.3, 0));
        g.position.set(0, top - 0.22, -0.02); g.rotation.x = -0.18;
        break;
      }
      case 'beanie': {
        dome(1.0);
        g.add(mesh(geo('beanieBand', () => new THREE.TorusGeometry(0.41, 0.07, 12, 36)), mat(shade(l.hatColor, 0.9)), 0, 0.04, 0).rotateX(Math.PI / 2));
        g.add(mesh(sphere(0.1), mat(0xffffff), 0, 0.42, 0));
        g.position.set(0, top - 0.22, -0.03); g.rotation.x = -0.22;
        break;
      }
      case 'nightcap': {
        dome(0.9);
        const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.25, 0), new THREE.Vector3(0.05, 0.45, -0.05), new THREE.Vector3(0.25, 0.5, -0.15), new THREE.Vector3(0.4, 0.3, -0.2)]);
        g.add(mesh(new THREE.TubeGeometry(curve, 16, 0.12, 12), c));
        g.add(mesh(sphere(0.11), mat(0xffffff), 0.4, 0.28, -0.2));
        g.add(mesh(geo('capBand', () => new THREE.TorusGeometry(0.42, 0.08, 12, 36)), mat(0xffffff), 0, 0.04, 0).rotateX(Math.PI / 2));
        g.position.set(0, top - 0.24, -0.03); g.rotation.x = -0.18;
        break;
      }
      case 'straw': {
        dome(0.62);
        const brim = mesh(puck(0.7, 0.05), c, 0, 0, 0); g.add(brim);
        g.add(mesh(geo('strawBand', () => new THREE.TorusGeometry(0.405, 0.04, 8, 36)), mat(0xef5a4f), 0, 0.06, 0).rotateX(Math.PI / 2));
        g.position.set(0, top - 0.2, -0.04); g.rotation.x = -0.2;
        break;
      }
      case 'bow': {
        for (const s of [-1, 1]) { const b = mesh(sphere(0.13), c, s * 0.12, 0, 0); b.scale.set(1.2, 0.8, 0.5); b.rotation.z = s * 0.3; g.add(b); }
        g.add(mesh(sphere(0.06), c, 0, 0, 0.02));
        g.position.set(0.18, top + 0.02, 0.05); g.rotation.z = -0.3;
        break;
      }
      case 'flower': {
        for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const p = mesh(sphere(0.06), c, Math.cos(a) * 0.07, Math.sin(a) * 0.07, 0); p.scale.z = 0.5; g.add(p); }
        g.add(mesh(sphere(0.045), mat(0xffd84a), 0, 0, 0.03));
        g.position.set(0.28, top - 0.05, 0.15); g.rotation.y = 0.6;
        break;
      }
      case 'crown': {
        const gold = mat(0xffd23a);
        g.add(mesh(geo('crownRing', () => new THREE.CylinderGeometry(0.2, 0.2, 0.1, 28, 1, true)), soften(new THREE.MeshLambertMaterial({ color: 0xffd23a, side: THREE.DoubleSide }))));
        for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; g.add(mesh(sphere(0.045), gold, Math.cos(a) * 0.2, 0.08, Math.sin(a) * 0.2)); }
        g.add(mesh(sphere(0.04), mat(0xff4d6d), 0, 0.02, 0.2, false));
        g.position.set(0, top + 0.02, 0);
        break;
      }
      case 'beret': {
        const b = mesh(sphere(0.42), c, 0, 0.02, 0); b.scale.set(1.05, 0.32, 1.05); g.add(b);
        g.add(mesh(capsule(0.015, 0.05), c, 0.02, 0.15, 0));
        g.position.set(0.06, top - 0.06, -0.02); g.rotation.z = -0.25;
        break;
      }
      case 'headband': {
        const hb = mesh(geo('hband', () => new THREE.TorusGeometry(0.43, 0.035, 8, 36, Math.PI)), c, 0, 0, 0);
        g.add(hb);
        g.add(mesh(sphere(0.08), c, 0.22, 0.36, 0.05));
        g.position.set(0, top - 0.42, 0.02); g.rotation.x = -0.3;
        break;
      }
      case 'halo': {
        const h = mesh(geo('halo', () => new THREE.TorusGeometry(0.24, 0.035, 10, 32)), new THREE.MeshBasicMaterial({ color: 0xfff2a0 }), 0, 0, 0);
        h.rotation.x = Math.PI / 2; g.add(h);
        g.position.set(0, top + 0.22, 0);
        break;
      }
      case 'horns': {
        for (const s of [-1, 1]) { const h = mesh(roundCone(0.06, 0.18), c, s * 0.2, 0, 0); h.rotation.z = -s * 0.35; g.add(h); }
        g.position.set(0, top - 0.02, 0.05);
        break;
      }
      case 'headphones': {
        const band = mesh(geo('hpBand', () => new THREE.TorusGeometry(0.45, 0.03, 8, 36, Math.PI)), mat(0x3a3a44), 0, 0, 0);
        g.add(band);
        for (const s of [-1, 1]) { const cup = mesh(puck(0.12, 0.08), c, s * 0.45, 0, 0); cup.rotation.z = Math.PI / 2; g.add(cup); }
        g.position.set(0, top - 0.45, 0);
        break;
      }
    }
    if (!['bow', 'flower', 'crown', 'halo', 'horns', 'headband', 'headphones', 'beret'].includes(l.hat)) g.scale.set(hs[0] / 1.02, 1, hs[2]);
    head.add(g);
  }

  function buildGlasses(head, l, hs) {
    if (l.glasses === 'none') return;
    const g = new THREE.Group();
    const frame = mat(l.glassesColor);
    const lensMat = l.glasses === 'heart' ? new THREE.MeshLambertMaterial({ color: 0xff5d8a, transparent: true, opacity: 0.55, depthWrite: false }) : l.glasses === 'sun'
      ? soften(new THREE.MeshLambertMaterial({ color: 0x1d2330 }))
      : new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false });
    for (const s of [-1, 1]) {
      const lx = s * 0.15 * hs[0];
      let rim;
      if (l.glasses === 'square') { rim = mesh(geo('gSq', () => new THREE.TorusGeometry(0.1, 0.014, 6, 4)), frame, lx, 0, 0); rim.rotation.z = Math.PI / 4; rim.scale.set(1.15, 0.9, 1); }
      else rim = mesh(geo('gRound', () => new THREE.TorusGeometry(0.1, 0.014, 8, 28)), frame, lx, 0, 0);
      g.add(rim);
      const lens = mesh(geo('gLens', () => new THREE.CircleGeometry(0.095, 24)), lensMat, lx, 0, -0.005, false);
      if (l.glasses === 'square') lens.scale.set(1.05, 0.85, 1);
      g.add(lens);
      const arm = mesh(capsule(0.01, 0.2), frame, s * 0.3 * hs[0], 0.02, -0.12, false);
      arm.rotation.x = Math.PI / 2; arm.rotation.z = s * 0.3;
      g.add(arm);
    }
    const bridge = mesh(capsule(0.01, 0.06), frame, 0, 0.02, 0.01, false);
    bridge.rotation.z = Math.PI / 2;
    g.add(bridge);
    g.position.set(0, -0.01, 0.405 * hs[2] + 0.035);
    head.add(g);
  }

  function buildAcc(body, l) {
    const c = mat(l.accColor);
    switch (l.acc) {
      case 'backpack':
        body.add(mesh(box(0.3, 0.3, 0.16, 0.07), c, 0, 0.3, -0.25));
        body.add(mesh(box(0.2, 0.1, 0.06, 0.03), mat(shade(l.accColor, 0.85)), 0, 0.23, -0.34));
        for (const s of [-1, 1]) { const st = mesh(capsule(0.018, 0.2), c, s * 0.12, 0.34, 0.05, false); st.rotation.x = 0.15; body.add(st); }
        break;
      case 'bowtie':
        for (const s of [-1, 1]) { const b = mesh(roundCone(0.06, 0.1), c, s * 0.05, 0.47, 0.19); b.rotation.z = s * Math.PI / 2; b.scale.z = 0.5; body.add(b); }
        body.add(mesh(sphere(0.03), c, 0, 0.47, 0.2));
        break;
      case 'scarf': {
        const sc = mesh(geo('scarf', () => new THREE.TorusGeometry(0.16, 0.06, 12, 28)), c, 0, 0.5, 0.01);
        sc.rotation.x = Math.PI / 2 - 0.15; body.add(sc);
        const tail = mesh(box(0.1, 0.22, 0.05, 0.025), c, 0.08, 0.38, 0.2); tail.rotation.z = 0.15; body.add(tail);
        break;
      }
      case 'tie': {
        const t = mesh(box(0.07, 0.2, 0.03, 0.015), c, 0, 0.36, 0.25); t.rotation.x = -0.25; body.add(t);
        body.add(mesh(sphere(0.035), c, 0, 0.47, 0.2));
        break;
      }
      case 'cape': {
        const cp = mesh(lathe('cape', [[0.0001, 0.42], [0.22, 0.4], [0.3, 0.2], [0.34, 0.02], [0.0001, 0.02]]), soften(new THREE.MeshLambertMaterial({ color: l.accColor, side: THREE.DoubleSide })), 0, 0.06, -0.06);
        cp.scale.set(1, 1, 0.7); body.add(cp);
        break;
      }
      case 'wings': {
        for (const s of [-1, 1]) { const w = mesh(sphere(0.16), mat(0xffffff), s * 0.18, 0.4, -0.3); w.scale.set(1.3, 0.8, 0.3); w.rotation.z = s * 0.5; body.add(w); }
        break;
      }
      case 'lei': {
        for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; body.add(mesh(sphere(0.045), mat([0xff6f86, 0xffd84a, 0xffffff][k % 3]), Math.cos(a) * 0.19, 0.46 - (Math.sin(a) > 0 ? Math.sin(a) * 0.06 : 0), Math.sin(a) * 0.19 + 0.02, false)); }
        break;
      }
      case 'satchel': {
        body.add(mesh(box(0.2, 0.16, 0.07, 0.03), c, 0.22, 0.2, 0.12));
        const st = mesh(capsule(0.014, 0.52), c, 0, 0.35, 0.18, false); st.rotation.z = 0.8; body.add(st);
        break;
      }
      case 'necklace': {
        const n = mesh(geo('necklace', () => new THREE.TorusGeometry(0.16, 0.012, 6, 28)), mat(0xffd23a), 0, 0.47, 0.03);
        n.rotation.x = Math.PI / 2 - 0.35; body.add(n);
        body.add(mesh(sphere(0.035), c, 0, 0.41, 0.2));
        break;
      }
    }
  }

  function buildTail(body, l, sp) {
    const fur = mat(l.fur), fur2 = mat(l.fur2);
    switch (sp.tail) {
      case 'cat': {
        const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.2, -0.24), new THREE.Vector3(0, 0.16, -0.42), new THREE.Vector3(0.05, 0.36, -0.52), new THREE.Vector3(0.1, 0.52, -0.44)]);
        const col = mat(l.marking === 'stripes' ? l.markColor : l.fur);
        body.add(mesh(new THREE.TubeGeometry(curve, 16, 0.045, 10), col));
        body.add(mesh(sphere(0.05), col, 0.1, 0.52, -0.44));
        break;
      }
      case 'thin': {
        const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.15, -0.24), new THREE.Vector3(0, 0.1, -0.45), new THREE.Vector3(0.15, 0.2, -0.6), new THREE.Vector3(0.25, 0.35, -0.55)]);
        body.add(mesh(new THREE.TubeGeometry(curve, 16, 0.02, 8), mat(l.ear)));
        break;
      }
      case 'fox': case 'stripe': {
        const t = new THREE.Group();
        t.position.set(0, 0.2, -0.3); t.rotation.x = -0.9;
        const main = mesh(sphere(0.16), fur, 0, 0.18, 0); main.scale.set(0.9, 1.6, 0.9); t.add(main);
        if (sp.tail === 'fox') { const tip = mesh(sphere(0.11), fur2, 0, 0.4, 0); tip.scale.set(1, 1.1, 1); t.add(tip); }
        else for (const y of [0.1, 0.26]) { const r = mesh(geo('tanRing', () => new THREE.TorusGeometry(0.135, 0.035, 8, 20)), mat(l.markColor), 0, y, 0); r.rotation.x = Math.PI / 2; t.add(r); }
        body.add(t);
        break;
      }
      case 'squirrel': {
        const t = mesh(geo('sqTail', () => new THREE.TorusGeometry(0.17, 0.1, 14, 28, Math.PI * 1.6)), fur2, 0, 0.42, -0.36);
        t.rotation.set(0, Math.PI / 2, -0.6);
        body.add(t);
        break;
      }
      case 'puff': body.add(mesh(sphere(0.09), fur2, 0, 0.2, -0.27)); break;
      case 'stub': body.add(mesh(sphere(0.09), mat(l.fur2 || l.fur), 0, 0.2, -0.27)); break;
      case 'curl': {
        const t = mesh(geo('pigTail', () => new THREE.TorusGeometry(0.05, 0.02, 8, 16, Math.PI * 1.7)), fur, 0, 0.22, -0.3);
        t.rotation.y = Math.PI / 2; body.add(t);
        break;
      }
      case 'flat': { const t = mesh(sphere(0.1), fur, 0, 0.2, -0.27); t.scale.set(1.3, 0.55, 1); body.add(t); break; }
    }
  }

  // ---------------------------------------------------------
  // 애니메이션 (통통 튀는 느낌)
  // ---------------------------------------------------------
  function animate(c, dt, moveAmount) {
    c.idleT += dt;
    const m = Math.min(1, moveAmount);
    const run = moveAmount > 1.05;
    // 걷기: 통통 튀는 종종걸음 / 달리기: 몸을 앞으로 숙이고 팔을 크게 흔듦
    if (m > 0.01) c.phase += dt * (run ? 12 + m * 4 : 7.5 + m * 5);
    const sn = Math.sin(c.phase), cs = Math.cos(c.phase);
    const sw = sn * m;
    const bounce = Math.abs(sn) * m;
    const legAmp = run ? 1.05 : 0.72, armAmp = run ? 1.25 : 0.8;
    c.legL.rotation.x = sw * legAmp;
    c.legR.rotation.x = -sw * legAmp;
    if (c.legL.userData.y0 === undefined) { c.legL.userData.y0 = c.legL.position.y; c.legR.userData.y0 = c.legR.position.y; }
    c.legL.position.y = c.legL.userData.y0 + Math.max(0, -cs) * (run ? 0.07 : 0.045) * m;   // 앞으로 나가는 발을 살짝 들어 올림
    c.legR.position.y = c.legR.userData.y0 + Math.max(0, cs) * (run ? 0.07 : 0.045) * m;
    c.armL.rotation.x = -sw * armAmp;
    c.armR.rotation.x = sw * armAmp;
    const breath = Math.sin(c.idleT * 2.4) * 0.015 * (1 - m);
    const squash = (bounce - 0.5) * (run ? 0.1 : 0.08) * m;
    c.body.position.y = bounce * (run ? 0.1 : 0.065);
    c.body.scale.set(1 - squash * 0.5 - breath * 0.5, 1 + squash + breath, 1 - squash * 0.5 - breath * 0.5);
    c.body.rotation.z = sn * 0.045 * m;
    c.body.rotation.x = (run ? 0.2 : 0.06) * m;                 // 앞으로 기울기
    c.body.rotation.y = sn * (run ? 0.12 : 0.08) * m;            // 골반 비틀기

    const rot = c.root.rotation.y;
    let dr = rot - c.lastRot;
    dr = Math.atan2(Math.sin(dr), Math.cos(dr));
    c.lastRot = rot;
    const target = Math.max(-0.35, Math.min(0.35, -dr / Math.max(dt, 0.001) * 0.05));
    c.headYaw += (target - c.headYaw) * Math.min(1, dt * 10);
    c.head.rotation.y = c.headYaw;
    c.head.rotation.z = m < 0.05 ? Math.sin(c.idleT * 1.3) * 0.06 : Math.sin(c.phase) * 0.04;
    c.head.rotation.x = m > 0.05 ? -c.body.rotation.x * 0.6 + Math.abs(sn) * 0.03 : 0;   // 기울인 만큼 고개는 앞을 봄
    c.armR.rotation.z = m > 0.05 ? 0.12 + (run ? 0.25 : 0) : 0; c.armL.rotation.z = m > 0.05 ? -0.12 - (run ? 0.25 : 0) : 0;

    if (c.actionT > 0) {
      c.actionT -= dt;
      const k = Math.sin(Math.min(1, c.actionT / 0.5) * Math.PI);
      c.armL.rotation.x = -2.4 * k;
      c.armR.rotation.x = -2.4 * k;
    }
    if (c.talkT > 0) {
      c.talkT -= dt;
      c.body.position.y += Math.max(0, Math.sin(c.talkT * 9)) * 0.08;
      c.head.rotation.x = Math.sin(c.talkT * 14) * 0.08;
      c.armR.rotation.z = Math.sin(c.talkT * 8) * 0.3 + 0.4;
      c.armL.rotation.z = -Math.sin(c.talkT * 8) * 0.3 - 0.4;
    }
    if (c.waveT > 0) {
      c.waveT -= dt;
      c.armR.rotation.x = 0;
      c.armR.rotation.z = 2.5 + Math.sin(c.idleT * 12) * 0.35;
      c.head.rotation.z = 0.12;
    }
    if (c.hopT > 0) {
      c.hopT -= dt;
      const k = (c.hopT % 0.6) / 0.6;
      c.body.position.y += Math.sin(k * Math.PI) * 0.25;
      c.armL.rotation.z = -1.2; c.armR.rotation.z = 1.2;
    }
    // 가만히 서 있을 때의 소소한 몸짓 (두리번 · 머리 긁기 · 기지개 · 발 까딱 · 흔들흔들 · 끄덕)
    if (m < 0.01) {
      if (c.idleNext === undefined) c.idleNext = 2 + Math.random() * 5;
      c.idleNext -= dt;
      if (c.idleNext < 0 && !c.idleGest) { const ks = ['look', 'scratch', 'stretch', 'tap', 'sway', 'nod', 'look', 'hands']; c.idleGest = { k: ks[(Math.random() * ks.length) | 0], t: 0, dur: 1.6 + Math.random() * 1.2 }; c.idleNext = 4 + Math.random() * 7; }
    } else c.idleGest = null;
    if (c.idleGest) {
      const G = c.idleGest; G.t += dt;
      const e = Math.sin(Math.min(1, G.t / G.dur) * Math.PI), t = G.t;
      switch (G.k) {
        case 'look': c.head.rotation.y += Math.sin(t * 2.4) * 0.75 * e; break;
        case 'scratch': c.armR.rotation.x = -2.5 * e; c.armR.rotation.z = (0.6 + Math.sin(t * 16) * 0.12) * e; c.head.rotation.z += 0.15 * e; break;
        case 'stretch': c.armL.rotation.z = -2.8 * e; c.armR.rotation.z = 2.8 * e; c.body.scale.y *= 1 + 0.05 * e; c.head.rotation.x = -0.2 * e; break;
        case 'tap': c.legR.rotation.x = -Math.abs(Math.sin(t * 9)) * 0.3 * e; c.head.rotation.z += Math.sin(t * 9) * 0.04 * e; break;
        case 'sway': c.body.rotation.z = Math.sin(t * 4) * 0.08 * e; c.head.rotation.z += Math.sin(t * 4 + 0.5) * 0.1 * e; c.armL.rotation.z = -0.3 * e; c.armR.rotation.z = 0.3 * e; break;
        case 'nod': c.head.rotation.x = Math.sin(t * 7) * 0.14 * e; break;
        case 'hands': c.armL.rotation.x = -0.9 * e; c.armR.rotation.x = -0.9 * e; c.armL.rotation.z = 0.35 * e; c.armR.rotation.z = -0.35 * e; c.body.rotation.y = Math.sin(t * 2) * 0.1 * e; break;
      }
      if (G.t > G.dur) c.idleGest = null;
    }
    c.blinkT -= dt;
    if (c.blinkT < 0) {
      c.face.material.map = c.blinkTex;
      if (c.blinkT < -0.13) { c.face.material.map = c.faceTex; c.blinkT = 2.5 + Math.random() * 3.5; }
    }
  }

  function randomLook() {
    const pick = arr => arr[(Math.random() * arr.length) | 0];
    const keys = o => Object.keys(o);
    const sp = Math.random() < 0.1 ? 'human' : pick(keys(SPECIES).filter(k => k !== 'human'));
    let l = withSpecies(normalizeLook({}), sp);
    if (Math.random() < 0.5 && sp !== 'human') { l.fur = pick(PALETTE.fur); l.fur2 = pick([0xffffff, 0xfff6e0, 0xfff0f4, l.fur2]); }
    Object.assign(l, {
      eyes: pick(keys(OPT.eyes)), brows: pick(['none', 'none', 'thin', 'thick', 'dots', 'angry', 'worried']),
      mouth: pick(['smile', 'w', 'open', 'grin', 'tooth', 'flat', 'pout']), eyeColor: pick(PALETTE.eye),
      blush: Math.random() < 0.8 ? pick([0xff7a95, 0xff9aa2, 0xffa07a, 0xff5d7a]) : null,
      skin: pick(PALETTE.skin), hair: pick(PALETTE.hair), hairStyle: pick(keys(OPT.hairStyle)),
      top: pick(keys(OPT.top)), pattern: pick(keys(OPT.pattern)), shirt: pick(PALETTE.cloth), shirt2: pick(PALETTE.cloth),
      bottom: pick(['shorts', 'pants', 'skirt', 'shorts']), pants: pick(PALETTE.cloth), shoes: pick(PALETTE.cloth),
      hat: Math.random() < 0.45 ? pick(keys(OPT.hat).slice(1)) : 'none', hatColor: pick(PALETTE.cloth),
      glasses: Math.random() < 0.2 ? pick(['round', 'square', 'sun']) : 'none',
      acc: Math.random() < 0.45 ? pick(keys(OPT.acc).slice(1)) : 'none', accColor: pick(PALETTE.cloth),
      height: +(0.9 + Math.random() * 0.2).toFixed(2), width: +(0.9 + Math.random() * 0.22).toFixed(2),
    });
    if (l.glasses === 'none' && Math.random() < 0.05) l.glasses = 'heart';
    if (l.marking !== 'none' && Math.random() < 0.3) l.marking = 'none';
    return l;
  }

  M.character = build;
  M.animate = animate;
  ISLE.SPECIES = SPECIES;
  ISLE.CHAR_OPT = OPT;
  ISLE.CHAR_PALETTE = PALETTE;
  ISLE.normalizeLook = normalizeLook;
  ISLE.withSpecies = withSpecies;
  ISLE.randomLook = randomLook;
  ISLE.CREATOR_KEY = 'cozy-island-creator-v1';
})();
