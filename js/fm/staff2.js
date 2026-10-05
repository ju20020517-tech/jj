/* =========================================================
 *  가게마다 일하는 NPC 2
 *   사진사 · 공방 장인 · 오락실 매니저 · 온천 여주인 · 천문학자 · 신부님 · 초밥집 점원 · 반점 웨이트리스
 *   텃밭 할아버지 · 미끼 가게 사장 · 마츠리 노점 상인 8명 (노점 뒤에서 손님 쪽을 보고 장사)
 *   가끔 혼잣말 / 호객 (플레이어가 가까이 있을 때 더 자주)
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, ISLE = window.ISLE;
  if (!Sim || !FM.Ev) return;
  const PI = Math.PI, R90 = PI / 2;
  const pick = a => a[(Math.random() * a.length) | 0];
  const L = (species, top, shirt, extra) => Object.assign({ species, top, shirt }, extra || {});

  const LIST = [
    { id: 's_photo', name: '사진사 포토 아저씨', role: 'photo', loc: 'photo_in', x: 0, z: 1.65, ry: PI, look: L('owl', 'vest', 0x2f4b6e, { shirt2: 0xffffff, hat: 'cap', hatColor: 0x2f4b6e }),
      lines: ['자, 김치~! 📸', '조명 좋네요, 오늘 사진 잘 나오겠어요!', '포즈는 자연스럽게~', '커플 사진 이벤트 중이에요 💕'] },
    { id: 's_carpenter', name: '공방 장인 나무', role: 'carpenter', loc: 'workshop_in', x: -2, z: -1.25, ry: PI, look: L('wolf', 'apron', 0x8a5a3b, { shirt2: 0xe8dcc8, hat: 'headband', hatColor: 0xffffff }),
      lines: ['나뭇결을 따라 대패질~ 🪚', '좋은 가구는 망치질 세 번에 결정돼!', '재료만 있으면 뭐든 만들어 줄게', '톱밥 냄새가 제일 좋아'] },
    { id: 's_arcade', name: '오락실 매니저 코인', role: 'arcade', loc: 'arcade_in', x: -7.55, z: 1.6, ry: R90, look: L('fox', 'hoodie', 0xff6ab8, { shirt2: 0x4ae0ff, glasses: 'sun' }),
      lines: ['이번 주 랭킹 1등은 누가 될까~? 🏆', '인형뽑기 집게 오늘 세게 해 놨어요!', '볼링 레인 3번 비었어요~', '경품 교환은 여기서!'] },
    { id: 's_onsen', name: '온천 여주인 유키', role: 'onsen', loc: 'onsen_in', x: -3.0, z: 3.4, ry: 0, look: L('lamb', 'dress', 0x3a4a8a, { shirt2: 0xffffff, acc: 'bowtie', accColor: 0xd83a3a }),
      lines: ['어서 오세요~ 따뜻하게 쉬다 가세요 ♨️', '목욕 후엔 커피 우유죠!', '유카타 빌려 드려요~', '탁구대 비었답니다 🏓'] },
    { id: 's_astro', name: '천문학자 별님', role: 'astro', loc: 'obs_in', x: 1.9, z: -0.6, ry: 0, look: { species: 'human', gender: 'F', skin: 0xffdcc4, hair: 0x2a2440, hairStyle: 'hime', eyeKit: 'calm', eyeColor: 0x6a5ad8, lashes: true, eyes: 'dot', brows: 'thin', mouth: 'smile', blush: 0xff9a88, top: 'cardigan', shirt: 0x2a3a6a, shirt2: 0xffd84a, pattern: 'star', bottom: 'longskirt', pants: 0x1f2a4a, shoes: 0x3a2a24, shoeType: 'loafer', sole: 0xffffff, glasses: 'round', glassesColor: 0xd8b040, hat: 'none', acc: 'none', height: 1, width: 1 },
      lines: ['오늘 밤은 북두칠성이 잘 보여요 🔭', '4일마다 유성우가 와요. 소원 준비하세요!', '별자리 도감, 몇 개 모았어요?', '저 빛은 수백 년 전에 출발한 거래요'] },
    { id: 's_priest', name: '성당 신부님', role: 'priest', loc: 'cathedral_in', x: 0, z: -7.0, ry: 0, look: L('sheep', 'sweater', 0xf4f4f0, { shirt2: 0xd8b040, acc: 'necklace', accColor: 0xd8b040 }),
      lines: ['평화가 함께하길 🕊️', '결혼식 준비는 웨딩 플래너와 상의하세요', '오늘도 좋은 하루 되세요', '종소리가 맑네요'] },
    { id: 's_sushi_w', name: '초밥집 점원 하나', role: 'waiter', loc: 'sushi_in', x: 0, z: 1.9, ry: 0, look: L('cat', 'vest', 0x2a4a8a, { shirt2: 0xffffff, hat: 'headband', hatColor: 0xffffff, fur: 0xf4efe6 }),
      lines: ['이랏샤이마세~! 🍣', '오늘의 추천은 참치 뱃살이에요', '녹차 더 드릴까요?', '자리 안내해 드릴게요!'] },
    { id: 's_pub_w', name: '반점 웨이트리스 링링', role: 'waiter', loc: 'pub_in', x: -0.6, z: 3.1, ry: 0, look: L('koala', 'dress', 0xd8282a, { shirt2: 0xf4d040 }),
      lines: ['어서 오세요~ 🥟', '딤섬 카트 지나갑니다!', '짜장? 짬뽕? 고민되죠~', '재스민 차 리필해 드릴게요'] },
    { id: 's_farmer', name: '텃밭 할아버지', role: 'farmer', loc: 'island', x: () => FM.MAP.P.farm.x + 3.4, z: () => FM.MAP.P.farm.z + 5.2, ry: 0, look: L('cow', 'tee', 0x6a9a3a, { shirt2: 0xf4e0b0, hat: 'straw', hatColor: 0xe8c060, bottom: 'pants', pants: 0x3a5a8a }),
      lines: ['물은 아침에 주는 게 최고여 🌱', '토마토가 빨갛게 익었구먼!', '허수아비가 까마귀를 잘 쫓아 줘', '흙 만지면 마음이 편해져'] },
    { id: 's_bait', name: '미끼 가게 사장 갈매기', role: 'bait', loc: 'island', x: -71, z: 89.4, ry: 0, look: L('duck', 'vest', 0x2f4b6e, { shirt2: 0xffffff, hat: 'cap', hatColor: 0xffffff }),
      lines: ['싱싱한 미끼 있어요~ 🎣', '토요일은 낚시 대회 날!', '오늘 바다 상태 좋다!', '월척 낚으면 사진 찍어 줄게'] },
  ];
  // 마츠리 노점 상인 (노점 뒤 · 손님 쪽을 봄)
  const YATAI_LOOK = { goldfish: 'mouse', takoyaki: 'pig', cotton: 'sheep', yakisoba: 'dog', shooting: 'wolf', kakigori: 'cat', ringo: 'deer', omen: 'fox' };
  const YATAI_LINES = {
    goldfish: ['금붕어 뜨기~ 한 판에 20코인!', '뜰채 찢어지기 전에 빨리!'], takoyaki: ['갓 구운 타코야키~ 🐙', '문어 큼직하게 넣었어요!'], cotton: ['구름 같은 솜사탕~ 🍭', '분홍? 하늘색?'],
    yakisoba: ['철판 야키소바~ 지글지글!', '마요네즈 듬뿍?'], shooting: ['명중하면 인형 경품! 🎯', '자, 한 발 쏴 봐요!'], kakigori: ['시원한 빙수~ 🍧', '딸기? 블루하와이?'],
    ringo: ['반짝반짝 사과사탕~ 🍎', '축제엔 역시 사과사탕!'], omen: ['축제 가면 골라 가세요~ 🎭', '여우 가면이 제일 인기!'],
  };
  function yatai() {
    const m = FM.MAP.P.matsuri; if (!m || !m.stalls) return [];
    return m.stalls.map((t, i) => ({ id: 's_yatai_' + t.k, name: t.n.replace(/^\S+\s/, '') + ' 상인', role: 'y_' + t.k, loc: 'island', x: t.vx, z: t.z, ry: t.s * R90 * 0.5,   // 손님 쪽 + 카메라 쪽(남쪽)으로 비스듬히 → 얼굴이 보이게
     
      look: L(YATAI_LOOK[t.k] || 'dog', 'vest', parseInt(t.c.slice(1), 16), { shirt2: 0xffffff, hat: 'headband', hatColor: 0xffffff }), lines: YATAI_LINES[t.k] || ['어서 오세요~'], idx: i }));
  }
  function add() {
    const E = FM.Ev; if (!E.staff) return;
    for (const d0 of LIST.concat(yatai())) {
      const d = Object.assign({}, d0, { x: typeof d0.x === 'function' ? d0.x() : d0.x, z: typeof d0.z === 'function' ? d0.z() : d0.z });
      const old = E.staff.find(s => s.id === d.id);
      if (old) { old.x = old.sx = d.x; old.z = old.sz = d.z; old.ry = d.ry; old.loc = old.home = d.loc; continue; }
      E.staff.push(Object.assign({}, d, { home: d.loc, sx: d.x, sz: d.z, state: 'INTERACT_OBJ', pose: 'stand', bubble: null, emote: null, route: null, sceneId: null,
        keys: { L1: 'EXTROVERT', L2: 'DILIGENT', L3: 'WARM', L4: 'CLEAN' }, stats: { speed: 0, idle: [3, 5] }, status: {}, staff: true, np: null,
        look: ISLE && ISLE.normalizeLook ? ISLE.normalizeLook(d.look) : d.look }));
    }
  }
  // 노점 · 가게 상품 (대화로 주문) — 먹을 건 사면 바로 먹는 모션, 물건은 가방에 넣는 모션
  const D = FM.D;
  Object.assign(D.ITEMS, {
    takoyaki: { name: '타코야키 (6알)', icon: '🐙', price: 25, tags: ['food', 'snack'], shop: 'y_takoyaki', stamina: 18 },
    cotton_candy: { name: '구름 솜사탕', icon: '🍭', price: 15, tags: ['food', 'snack', 'cute'], shop: 'y_cotton', stamina: 8 },
    yakisoba: { name: '철판 야키소바', icon: '🍜', price: 30, tags: ['food'], shop: 'y_yakisoba', stamina: 25 },
    kakigori: { name: '딸기 빙수', icon: '🍧', price: 20, tags: ['food', 'snack'], shop: 'y_kakigori', stamina: 12 },
    candy_apple: { name: '반짝 사과사탕', icon: '🍎', price: 20, tags: ['food', 'snack', 'cute'], shop: 'y_ringo', stamina: 10 },
    goldfish_bag: { name: '금붕어 봉지', icon: '🐟', price: 20, tags: ['cute', 'nature'], shop: 'y_goldfish' },
    fox_mask: { name: '여우 축제 가면', icon: '🦊', price: 40, tags: ['fashion', 'party'], shop: 'y_omen' },
    coffee_milk: { name: '병 커피우유', icon: '🥛', price: 15, tags: ['food'], shop: 'onsen', stamina: 15 },
  });
  const NL = FM.NpcLife;
  if (NL && NL.SHOP_OF) {
    for (const t of (FM.MAP.P.matsuri && FM.MAP.P.matsuri.stalls) || []) {
      const r = 'y_' + t.k;
      if (Object.values(D.ITEMS).some(it => it.shop === r)) NL.SHOP_OF[r] = r;
      NL.TITLE[r] = '노점 상인'; NL.TALK[r] = YATAI_LINES[t.k] || ['어서 오세요~']; NL.GREET[r] = ['축제 즐기고 계세요? 🏮', '어서 오세요~ 하나 드셔 보세요!'];
    }
    NL.SHOP_OF.onsen = 'onsen';
    Object.assign(NL.TITLE, { photo: '사진사', carpenter: '공방 장인', arcade: '오락실 매니저', onsen: '온천 여주인', astro: '천문학자', priest: '신부님', farmer: '텃밭 할아버지', bait: '미끼 가게 사장' });
    for (const d of LIST) { if (!NL.TALK[d.role] || d.role === 'waiter') NL.TALK[d.role] = (NL.TALK[d.role] || []).concat(d.lines); if (!NL.GREET[d.role]) NL.GREET[d.role] = [d.lines[0]]; }
  }
  add();
  const oLoad = Sim.load;
  Sim.load = function () { const r = oLoad.apply(this, arguments); add(); return r; };
  FM.Staff2 = { add };

  // 혼잣말 · 호객 (플레이어 근처면 자주)
  setInterval(() => {
    try {
      const st = Sim.get(); if (!st || !FM.Ev.staff) return;
      const p = st.player;
      for (const s of FM.Ev.staff) {
        if (!s.lines || s.bubble) continue;
        const near = s.loc === p.loc && Math.hypot(s.x - p.x, s.z - p.z) < (s.loc === 'island' ? 9 : 7);
        if (!near && s.loc !== 'island') continue;
        if (Math.random() < (near ? 0.22 : 0.02)) Sim.say(s, pick(s.lines), 3.2);
      }
    } catch (e) { /* */ }
  }, 2500);
})();
