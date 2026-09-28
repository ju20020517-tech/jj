/* 게임 데이터: 아이템, 가구, 주민, 상수 */
(() => {
  'use strict';
  const ISLE = (window.ISLE = window.ISLE || {});

  ISLE.SAVE_KEY = 'cozy-island-3d-v1';
  ISLE.OLD_SAVE_KEY = 'cozy-island-save-v1'; // 2D 버전 저장 데이터 (이어받기용)

  ISLE.W = 40;          // 섬 가로 타일 수 (x)
  ISLE.H = 34;          // 섬 세로 타일 수 (z)
  ISLE.INV_SIZE = 10;
  ISLE.STACK = 30;

  // 섬 구조물 위치 (타일 좌표)
  ISLE.HOUSE = { x: 22, z: 13, w: 4, d: 3 };      // 문은 z=15 줄의 가운데
  ISLE.SHOP = { x: 27, z: 15 };
  ISLE.LAMPS = [{ x: 21, z: 17 }, { x: 26, z: 17 }];

  ISLE.TREE_REGROW_MS = 90 * 1000;
  ISLE.SAPLING_GROW_MS = 2 * 60 * 1000;
  ISLE.ROCK_COOLDOWN_MS = 30 * 1000;
  ISLE.WEED_SPAWN_MS = 60 * 1000;
  ISLE.SHELL_SPAWN_MS = 45 * 1000;

  ISLE.FRUITS = ['apple', 'peach', 'cherry', 'orange', 'pear'];
  ISLE.FRUIT_COLOR = { apple: 0xe8433b, peach: 0xffb09f, cherry: 0xd6213f, orange: 0xff8a24, pear: 0xc9d84c };

  ISLE.ITEMS = {
    apple: { name: '사과', icon: '🍎', price: 100, kind: 'fruit' },
    peach: { name: '복숭아', icon: '🍑', price: 100, kind: 'fruit' },
    cherry: { name: '체리', icon: '🍒', price: 100, kind: 'fruit' },
    orange: { name: '오렌지', icon: '🍊', price: 100, kind: 'fruit' },
    pear: { name: '배', icon: '🍐', price: 100, kind: 'fruit' },
    mum: { name: '국화', icon: '🌼', price: 80, kind: 'flower', color: 0xffc933 },
    tulip: { name: '튤립', icon: '🌷', price: 80, kind: 'flower', color: 0xff7aa8 },
    rose: { name: '장미', icon: '🌹', price: 80, kind: 'flower', color: 0xff4d5e },
    cosmos: { name: '코스모스', icon: '🌸', price: 80, kind: 'flower', color: 0xff9a3d },
    weed: { name: '잡초', icon: '🌿', price: 10, kind: 'misc' },
    shell: { name: '조개', icon: '🐚', price: 60, kind: 'misc' },
    stone: { name: '돌멩이', icon: '🪨', price: 75, kind: 'misc' },
  };
  ISLE.FLOWERS = Object.keys(ISLE.ITEMS).filter(k => ISLE.ITEMS[k].kind === 'flower');

  // 가구 카탈로그 (w, d = 차지하는 칸 수, solid = 부딪힘 여부)
  ISLE.FURNITURE = {
    sofa_teal:    { name: '민트 소파',     icon: '🛋️', price: 1800, w: 2, d: 1, solid: true },
    sofa_pattern: { name: '무늬 소파',     icon: '🛋️', price: 2200, w: 2, d: 1, solid: true },
    armchair:     { name: '민트 1인 소파', icon: '💺', price: 1200, w: 1, d: 1, solid: true },
    coffee_table: { name: '티 테이블',     icon: '🫖', price: 1500, w: 2, d: 1, solid: true },
    chair:        { name: '나무 의자',     icon: '🪑', price: 600,  w: 1, d: 1, solid: true },
    lamp_table:   { name: '레이스 램프',   icon: '🛋', price: 1300, w: 1, d: 1, solid: true },
    floor_lamp:   { name: '스탠드 조명',   icon: '💡', price: 900,  w: 1, d: 1, solid: true },
    bookshelf:    { name: '책장',          icon: '📚', price: 2000, w: 2, d: 1, solid: true },
    tv:           { name: '텔레비전',      icon: '📺', price: 2500, w: 1, d: 1, solid: true },
    fridge:       { name: '냉장고',        icon: '🧊', price: 2400, w: 1, d: 1, solid: true },
    kitchen:      { name: '민트 주방',     icon: '🍳', price: 3000, w: 2, d: 1, solid: true },
    wardrobe:     { name: '옷장',          icon: '🚪', price: 2600, w: 2, d: 1, solid: true },
    bed:          { name: '포근한 침대',   icon: '🛏️', price: 3200, w: 2, d: 2, solid: true },
    birdcage:     { name: '새장',          icon: '🐦', price: 1400, w: 1, d: 1, solid: true },
    plant:        { name: '화분',          icon: '🪴', price: 700,  w: 1, d: 1, solid: true },
    fan:          { name: '선풍기',        icon: '🌀', price: 800,  w: 1, d: 1, solid: true },
    rug:          { name: '타일 러그',     icon: '🟫', price: 1000, w: 3, d: 2, solid: false },
  };

  ISLE.ROOM = { w: 10, d: 8 };

  // 기본 인테리어 (참고 이미지 분위기의 레트로 민트 거실)
  ISLE.DEFAULT_ROOM = [
    { type: 'rug', x: 3, z: 3, rot: 0 },
    { type: 'kitchen', x: 2, z: 0, rot: 0 },
    { type: 'fridge', x: 4, z: 0, rot: 0 },
    { type: 'bookshelf', x: 6, z: 0, rot: 0 },
    { type: 'tv', x: 8, z: 0, rot: 0 },
    { type: 'wardrobe', x: 0, z: 1, rot: 1 },
    { type: 'lamp_table', x: 1, z: 3, rot: 0 },
    { type: 'coffee_table', x: 4, z: 4, rot: 0 },
    { type: 'sofa_pattern', x: 6, z: 3, rot: 3 },
    { type: 'armchair', x: 3, z: 4, rot: 1 },
    { type: 'chair', x: 4, z: 5, rot: 2 },
    { type: 'birdcage', x: 9, z: 2, rot: 0 },
    { type: 'plant', x: 9, z: 6, rot: 0 },
    { type: 'fan', x: 0, z: 6, rot: 1 },
  ];

  // 주민 (오리지널 캐릭터)
  ISLE.VILLAGERS = [
    {
      id: 'moka', name: '모카', species: 'cat', home: { x: 30, z: 20 },
      fur: 0xa9c6e8, fur2: 0xeaf3ff, stripe: 0x6f8fb8, shirt: 0xcfd6de, pattern: 'snow', pants: 0x7d8da0,
      eyes: 'happy', mouth: 'w', ear: 0xff9fb2,
      lines: ['오늘 바람이 시원하다냥~', '폭신한 스웨터 좋지 않냥?', '나무 그늘에서 낮잠 자고 싶다냥 💤', '과일 하나만 주면 좋겠다냥…'],
      suffix: '냥',
    },
    {
      id: 'bori', name: '보리', species: 'bear', home: { x: 12, z: 24 },
      fur: 0xd9a066, fur2: 0xf7dcb6, shirt: 0xff6f61, pattern: 'stripe', pants: 0x3f5f8f,
      eyes: 'dot', mouth: 'smile', ear: 0xb77a45,
      lines: ['꿀 냄새가 나는 것 같아곰!', '다리 건너편에 예쁜 꽃이 피었곰.', '폭포 소리를 들으면 마음이 편해곰~', '같이 산책할래곰?'],
      suffix: '곰',
    },
    {
      id: 'deokbae', name: '덕배', species: 'duck', home: { x: 8, z: 7 },
      fur: 0xffcc3a, fur2: 0xffe27a, shirt: 0x9aa7b0, pattern: 'plaid', pants: 0x6b5a4a, hat: 0xf2e28a,
      eyes: 'dot', mouth: 'none', beak: 0xff8a2a,
      lines: ['언덕 위 경치 최고다꽥!', '비탈길로 올라오면 된다꽥.', '바구니 가득 과일을 모으고 싶다꽥.', '모자 어때꽥? 새로 샀다꽥!'],
      suffix: '꽥',
    },
    {
      id: 'kongi', name: '콩이', species: 'hamster', home: { x: 18, z: 26 },
      fur: 0xff8fa0, fur2: 0xffd9df, shirt: 0xffffff, pattern: 'dots', pants: 0xff6f86,
      eyes: 'sparkle', mouth: 'tooth', ear: 0x5cbf73, blush: 0xff5d7a,
      lines: ['해바라기씨 있어쪼?', '오늘도 신나게 달려보자쪼! 🏃', '조개 줍기 대회 할래쪼?', '볼주머니가 꽉 찼다쪼!'],
      suffix: '쪼',
    },
    {
      id: 'mongsil', name: '몽실', species: 'dog', home: { x: 33, z: 9 },
      fur: 0xfff6e0, fur2: 0xffffff, shirt: 0x2f4b6e, pattern: 'stripe2', pants: 0xb9c6ff, ear: 0xb3b9ff,
      eyes: 'smile', mouth: 'smile',
      lines: ['멍! 오늘 기분 최고다멍!', '언덕 위에서 섬 전체가 보인다멍.', '같이 뛰어놀자멍~ 🐾', '밤에는 반딧불이가 예쁘다멍.'],
      suffix: '멍',
    },
  ];

  ISLE.SHIRTS = [0x8fd3ff, 0xff8fb1, 0x8ee07a, 0xffd84a, 0xb69cff, 0xff9d5c, 0xffffff];
  ISLE.HAIRS = [0x8a5a3b, 0x3b2b20, 0xf2c46d, 0xe8735a, 0x7a8cff, 0xf59ac0];
  ISLE.HATS = [null, 0xffcf3a, 0xff7a8a, 0x7cc8ff];

  ISLE.DEFAULT_TODOS = [
    { text: '나무를 흔들어 과일 3개 모으기', goal: { event: 'fruit', count: 3 } },
    { text: '잡초 5개 뽑기', goal: { event: 'weed', count: 5 } },
    { text: '꽃 1송이 심기', goal: { event: 'plant_flower', count: 1 } },
    { text: '주민 3명과 대화하기', goal: { event: 'talk', count: 3 } },
    { text: '상점 상자에 물건 팔기', goal: { event: 'sell', count: 1 } },
    { text: '집에 가구 1개 새로 놓기', goal: { event: 'furniture', count: 1 } },
  ];
})();
