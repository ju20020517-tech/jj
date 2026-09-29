/* =========================================================
 *  새 메인 성격 7종 — 기존 10종(낭만 · 운동 · 탐구 · 미식/휴식 · 사교 · 내향 · 명예 · 반항 · 예술 · 걱정) 외
 *   🧭 모험파 · 👗 패션파 · 🎸 음악파 · 🎮 게이머 · 👑 리더파 · 🌀 허당파 · 🌿 자연파
 *  각 성격마다 행동 · 선호 장소 · 선물 취향 · 옷차림 · 방 분위기 · 연애/결혼/육아 방식 · 대화 주제 · 목소리를 갖춤
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, D = FM.D, L = FM.L, Sim = FM.Sim;
  const NEW = {
    ADVENTURER: {
      L1: { name: '모험파', en: 'Adventurer', icon: '🧭', desc: '새로운 장소 탐험, 여행, 도전, 지도 그리기', range: 'WORLD', idle: 'short', speed: 20, acts: ['hike', 'gaze_far', 'take_photo'], pref: ['hill', 'sea', 'bridge', 'waterfall'], likes: ['sport', 'science'] },
      life: { love: '데이트도 탐험처럼! 섬 구석구석 숨은 장소로 연인을 데려가고, 고백은 전망 좋은 절벽 끝에서 합니다.', loveLine: '너랑이라면 세상 끝까지도 가 볼 수 있을 것 같아!', marriage: '신혼집 벽에 섬 지도를 붙이고 주말마다 새로운 곳을 탐험합니다.', parenting: '아이에게 나침반을 선물하고 "오늘은 어디로 모험 갈까?"를 입버릇처럼 말합니다.', furn: ['telescope_big', 'star_map'], morning: '좋은 아침! 오늘은 어디로 떠나 볼까?' },
      atmo: { name: '모험파', palette: [0x6a8f5a, 0xd8b070], pname: '카키 그린 & 사막 샌드', light: 'sunset', tone: '지도와 캠핑 랜턴이 어우러진 여행가의 노을빛 조명' },
      style: { top: ['vest', 'hoodie'], pattern: ['plain', 'plaid'], cloth: [0x6a8f5a, 0xc89a62, 0x3a5a7a], hat: ['bucket', 'straw', 'cap'], acc: ['backpack', 'satchel'] },
      dislike: ['plush'], topics: ['어제 폭포 뒤에 작은 동굴이 있는 걸 발견했어!', '지도에 아직 안 가 본 곳이 세 군데 남았어', '언젠가 페리 타고 이웃 섬 끝까지 가 볼 거야'],
      title: '탐험가', voice: { wave: 'triangle', speed: 1.15, vol: 1.1, mul: 0.98, range: 1.6, bright: 3.5 },
    },
    FASHIONISTA: {
      L1: { name: '패션파', en: 'Fashionista', icon: '👗', desc: '유행, 옷 쇼핑, 거울 체크, 남의 코디 평가', range: 'TOWN', idle: 'normal', speed: 0, acts: ['mirror_check', 'show_off', 'cute_pose'], pref: ['plaza', 'cafe', 'flowers'], likes: ['fashion', 'luxury'] },
      life: { love: '연인과 커플룩 맞추기가 필수! 첫 데이트에는 3시간 동안 옷을 고릅니다.', loveLine: '오늘 너 코디 완벽해... 아니, 너 자체가 완벽해.', marriage: '드레스룩 웨딩 화보를 매년 찍고, 옷장이 방 하나를 차지합니다.', parenting: '아이 옷을 날마다 바꿔 입히고 "우리 애가 섬 최고의 패셔니스타"라며 자랑합니다.', furn: ['mirror_full', 'clothes_rack'], morning: '일어났어? 오늘은 커플룩 뭐 입을까?' },
      atmo: { name: '패션파', palette: [0xffc6de, 0xe8d4a8], pname: '블러시 핑크 & 샴페인 골드', light: 'chandelier', tone: '런웨이 같은 화사한 샹들리에 스팟 조명' },
      style: { top: ['dress', 'vest', 'aloha'], pattern: ['heart', 'star', 'stripe2'], cloth: [0xff8fb1, 0xfff4d6, 0x2b2b30], glasses: ['sun', 'heart'], hat: ['beret', 'bow', 'crown'], acc: ['necklace', 'scarf'] },
      dislike: ['sport'], topics: ['요즘 섬에서 베레모가 유행이래!', '너 오늘 신발 새로 샀지? 딱 보여', '패션은 자신감이야, 알지?'],
      title: '패셔니스타', voice: { wave: 'triangle', speed: 1.1, vol: 1.05, mul: 1.08, glide: 0.05, range: 1.8, bright: 5 },
    },
    MUSICIAN: {
      L1: { name: '음악파', en: 'Musician', icon: '🎸', desc: '노래, 악기 연주, 버스킹, 흥얼거림', range: 'TOWN', idle: 'normal', speed: 5, acts: ['sing', 'play_guitar', 'listen_radio'], pref: ['plaza', 'bench', 'stars'], likes: ['music', 'party'] },
      life: { love: '고백은 무조건 세레나데! 연인을 위한 자작곡을 매주 만듭니다.', loveLine: '너를 생각하면 멜로디가 저절로 떠올라... 들어 볼래?', marriage: '결혼식 축가를 직접 부르고, 집 거실은 작은 공연장이 됩니다.', parenting: '자장가를 매일 새로 작곡해 불러 주고, 아이와 가족 밴드를 꿈꿉니다.', furn: ['turntable', 'record_shelf'], morning: '♪ 좋은 아침~ 오늘의 노래는 너를 위한 곡이야' },
      atmo: { name: '음악파', palette: [0x3a2a5a, 0xffb13d], pname: '딥 퍼플 & 앰버 스테이지', light: 'neon', tone: '작은 라이브 클럽 같은 네온 무대 조명' },
      style: { top: ['tee', 'hoodie', 'aloha'], pattern: ['star', 'stripe'], cloth: [0x2b2b30, 0xb69cff, 0xffb13d], hat: ['headphones', 'beanie'], acc: ['scarf', 'none'] },
      dislike: ['book'], topics: ['어제 광장에서 버스킹했는데 비둘기가 박수 쳤어', '새 노래 가사가 안 떠올라... 도와줄래?', '분수 소리도 들어 보면 리듬이 있어'],
      title: '버스커', voice: { wave: 'triangle', speed: 1.0, vol: 1.1, mul: 1.02, vib: 0.03, range: 2.6, bright: 4 },
    },
    GAMER: {
      L1: { name: '게이머', en: 'Gamer', icon: '🎮', desc: '게임, 오락실, 승부욕, 밤샘', range: 'TOWN', idle: 'long', speed: -10, acts: ['alone_sit', 'fidget', 'listen_radio'], pref: ['bench', 'quiet'], likes: ['science', 'snack'] },
      life: { love: '데이트는 오락실 협동 플레이! 연인에게 최고 기록을 선물합니다.', loveLine: '너는... 내 인생 최고의 레어 아이템이야.', marriage: '신혼집에 게임방을 차리고, 부부 대결 전적을 벽에 기록합니다.', parenting: '아이와 함께 레벨업! 숙제를 퀘스트처럼 만들어 줍니다.', furn: ['arcade_cab', 'tv'], morning: '...5분만. 아 아니, 좋은 아침! 오늘 일일 퀘스트 같이 하자' },
      atmo: { name: '게이머', palette: [0x1a1a3a, 0x39ff14], pname: '미드나잇 네이비 & 네온 그린', light: 'neon', tone: 'RGB 키보드처럼 반짝이는 게이밍 네온 조명' },
      style: { top: ['hoodie', 'tee'], pattern: ['plain', 'star'], cloth: [0x2b2b30, 0x2f4b6e, 0x39ff14], hat: ['headphones', 'cap'], glasses: ['square', 'none'], eyes: ['sleepy'] },
      dislike: ['sport', 'flower'], topics: ['오락실 펌프 기록 갱신했어! 전설이 되었지', '어제 새벽 4시까지 게임했어... 졸려', '인생도 세이브 포인트가 있으면 좋겠다'],
      title: '게이머', voice: { wave: 'square', speed: 1.2, vol: 0.95, mul: 1.0, range: 1.2, bright: 3 },
    },
    LEADER: {
      L1: { name: '리더파', en: 'Leader', icon: '👑', desc: '모임 주도, 마을 일 챙기기, 연설, 정의감', range: 'WORLD', idle: 'short', speed: 10, acts: ['meddle', 'cheer', 'ask_wellbeing'], pref: ['plaza', 'soapbox'], likes: ['party', 'luxury'] },
      life: { love: '연애도 계획적으로! 100일, 200일 기념 이벤트를 치밀하게 준비합니다.', loveLine: '내가 지켜 줄게. 앞으로 쭉, 네 옆에서.', marriage: '가족 회의를 매주 열고, 신혼집 운영 계획표를 벽에 붙입니다.', parenting: '아이에게 "스스로 결정하는 사람이 돼라"며 반장 선거를 적극 응원합니다.', furn: ['chore_chart', 'desk'], morning: '좋은 아침! 오늘 우리 가족 일정 브리핑 시작합니다' },
      atmo: { name: '리더파', palette: [0x8a1a2a, 0xe8c070], pname: '로열 크림슨 & 골드', light: 'warm', tone: '회의실처럼 또렷하고 위엄 있는 따뜻한 조명' },
      style: { top: ['vest', 'sweater'], pattern: ['plain', 'stripe'], cloth: [0x8a1a2a, 0x2f4b6e, 0xfff4d6], hat: ['crown', 'cap', 'none'], acc: ['tie', 'cape'] },
      dislike: ['weird'], topics: ['광장 벤치 하나 더 놓자고 시청에 건의할 거야', '다음 주 마을 운동회는 내가 준비할게!', '다들 요즘 잘 지내나? 한 명씩 챙겨 봐야겠어'],
      title: '마을 반장', voice: { wave: 'triangle', speed: 1.05, vol: 1.2, mul: 0.92, range: 1.3, bright: 3.5 },
    },
    CLUMSY: {
      L1: { name: '허당파', en: 'Clumsy', icon: '🌀', desc: '넘어지고 잃어버리고 까먹지만 해맑음', range: 'NEIGHBOR', idle: 'normal', speed: -5, acts: ['fidget', 'look_around', 'cute_pose'], pref: ['flowers', 'bench'], likes: ['snack', 'plush'] },
      life: { love: '고백하다가 꽃다발을 떨어뜨리고, 데이트 약속 장소를 헷갈리지만 그래서 더 사랑스럽습니다.', loveLine: '저, 저기! 좋아해... 아 잠깐, 준비한 편지 어디 갔지?!', marriage: '결혼반지를 매일 찾아 헤매지만, 배우자가 늘 찾아 줍니다.', parenting: '아이보다 먼저 넘어지고, 아이가 "괜찮아?" 하고 챙겨 주는 가족이 됩니다.', furn: ['plush_giant', 'storage_chest'], morning: '좋은 아침! ...어, 양말 한 짝 어디 갔지?' },
      atmo: { name: '허당파', palette: [0xffe0a0, 0xa8d8f0], pname: '레몬 크림 & 베이비 블루', light: 'pastel', tone: '어수선하지만 포근한 파스텔 조명' },
      style: { top: ['sweater', 'tee'], pattern: ['dots', 'star'], cloth: [0xffd84a, 0x8fd3ff, 0xffc6de], hat: ['bucket', 'bow', 'none'], eyes: ['round', 'happy'], mouth: ['open', 'w'] },
      dislike: ['luxury'], topics: ['아까 분수대에 동전 던지다가 지갑을 던질 뻔했어!', '오늘 문을 당겨야 하는데 밀었어. 세 번이나', '내가 뭐 하러 여기 왔더라...?'],
      title: '해맑은 허당', voice: { wave: 'sine', speed: 1.1, vol: 1.0, mul: 1.1, range: 2.0, bright: 3.5 },
    },
    NATURE: {
      L1: { name: '자연파', en: 'Nature Lover', icon: '🌿', desc: '식물 키우기, 곤충 관찰, 산책, 친환경', range: 'NEIGHBOR', idle: 'long', speed: -5, acts: ['water_flowers', 'smell_flower', 'observe_bugs'], pref: ['flowers', 'trees', 'waterfall'], likes: ['flower', 'science'] },
      life: { love: '연인에게 직접 키운 꽃을 선물하고, 숲속 피크닉 데이트를 즐깁니다.', loveLine: '너랑 있으면... 봄 햇살 아래 새싹이 된 기분이야.', marriage: '신혼집을 작은 식물원으로 만들고, 마당에 둘만의 나무를 심습니다.', parenting: '아이 이름을 딴 나무를 심고 함께 자라는 모습을 기록합니다.', furn: ['plant_monstera', 'lawn_farm'], morning: '좋은 아침~ 창가 화분에 새잎이 났어!' },
      atmo: { name: '자연파', palette: [0x8fcf7a, 0xf4ecd8], pname: '새싹 그린 & 리넨 화이트', light: 'warm', tone: '햇살이 식물 사이로 스며드는 자연광 조명' },
      style: { top: ['apron', 'sweater'], pattern: ['leaf', 'flower'], cloth: [0x8fcf7a, 0xc89a62, 0xfff4d6], hat: ['straw', 'flower'], acc: ['backpack'] },
      dislike: ['luxury', 'party'], topics: ['오늘 공원에서 네잎클로버 찾았어!', '폭포 옆에 반딧불이가 산대', '식물한테 말 걸면 더 잘 자란다는 거 알아?'],
      title: '숲지기', voice: { wave: 'sine', speed: 0.9, vol: 0.95, mul: 1.0, vib: 0.01, range: 1.2, bright: 3 },
    },
  };
  const TITLE_L4 = { GARDEN: '정원', FOOD: '미식', STUDY: '공부', FISHING: '낚시', FASHION: '패션', MUSIC: '음악', GOSSIP: '소문', CLEAN: '청소', OCCULT: '신비', FITNESS: '운동' };
  for (const [k, d] of Object.entries(NEW)) {
    D.L1[k] = d.L1;
    if (L && L.MAIN_LIFE) L.MAIN_LIFE[k] = d.life;
    if (D.ATMO_L1) D.ATMO_L1[k] = d.atmo;
    if (Sim.OUTFIT_STYLE) Sim.OUTFIT_STYLE.L1[k] = d.style;
    if (Sim.DISLIKE_T) Sim.DISLIKE_T[k] = d.dislike;
    if (L && L.TOPIC) L.TOPIC[k] = d.topics;
    if (D.TITLE_NOUN) D.TITLE_NOUN[k] = Object.fromEntries(Object.entries(TITLE_L4).map(([k4, n]) => [k4, `${n} ${d.title}`]));
    if (FM.Voice && FM.Voice.PERS) FM.Voice.PERS[k] = d.voice;
  }
  FM.Persona = { NEW: Object.keys(NEW) };
})();
