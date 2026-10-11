/* =========================================================
 *  새 메인 성격 19종 — 기존 10종(낭만 · 운동 · 탐구 · 미식/휴식 · 사교 · 내향 · 명예 · 반항 · 예술 · 걱정) 외
 *   🧭 모험파 · 👗 패션파 · 🎸 음악파 · 🎮 게이머 · 👑 리더파 · 🌀 허당파 · 🌿 자연파
 *   분위기(무드)형: 🦢 우아함 · 🖤 시크함 · 🤍 청순함 · 🍑 과즙미 · 🐶 비글미 · 🌙 몽환미 · 🔥 카리스마
 *                  🧢 힙함 · 🎻 클래식 · 🎀 큐트 · 🎩 댄디 · 🛹 털털함
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

    // ---------------- 분위기(무드)형 성격 ----------------
    ELEGANT: {
      L1: { name: '우아함', en: 'Elegant', icon: '🦢', desc: '느린 걸음, 바른 자세, 티타임, 품위 있는 말투', range: 'TOWN', idle: 'long', speed: -10, acts: ['tea', 'polite_bow', 'smell_flower'], pref: ['fancy', 'flowers', 'fountain'], likes: ['luxury', 'flower', 'art'] },
      life: { love: '서두르지 않는 고전적인 연애. 손편지와 장미 한 송이로 마음을 전하고, 고백은 달빛 아래 분수대 앞에서.', loveLine: '당신과 함께하는 시간은… 오후의 홍차처럼 향기로워요.', marriage: '매일 저녁 촛불 만찬을 차리고, 결혼기념일마다 왈츠를 춥니다.', parenting: '아이에게 인사 예절과 피아노를 가르치며 "품위는 마음에서 나온단다"라고 말합니다.', furn: ['grand_piano', 'chandelier'], morning: '좋은 아침이에요. 홍차 한 잔 드릴까요?' },
      atmo: { name: '우아함', palette: [0xf4ecd8, 0xc9a86a], pname: '아이보리 & 앤티크 골드', light: 'chandelier', tone: '살롱 같은 은은한 샹들리에 조명' },
      style: { top: ['dress', 'vest'], pattern: ['plain', 'flower'], cloth: [0xf4ecd8, 0xc9b3ff, 0x2f4b6e], hat: ['beret', 'none', 'flower'], acc: ['necklace', 'scarf'], eyes: ['sleepy', 'dot'], mouth: ['smile'] },
      dislike: ['weird', 'snack'], topics: ['오늘 오후엔 장미 정원에서 티타임을 가질 생각이에요', '말 한마디에도 품격이 묻어나는 법이죠', '대성당 종소리는 언제 들어도 마음이 차분해져요'],
      title: '백조', voice: { wave: 'sine', speed: 0.85, vol: 1.0, mul: 1.04, vib: 0.015, glide: 0.03, range: 1.4, bright: 2.5 },
    },
    CHIC: {
      L1: { name: '시크함', en: 'Chic', icon: '🖤', desc: '무심한 듯 세련됨, 짧은 대답, 혼자만의 카페 타임', range: 'TOWN', idle: 'long', speed: 0, acts: ['alone_sit', 'gaze_far', 'mirror_check'], pref: ['cafe', 'quiet', 'mall'], likes: ['fashion', 'luxury'] },
      life: { love: '관심 없는 척하지만 기념일은 절대 안 잊음. 고백은 "…나랑 사귈래?" 한 마디로 끝.', loveLine: '…딱히 너 기다린 거 아니야. 그냥, 같이 갈래?', marriage: '모노톤 인테리어의 미니멀 신혼집. 말은 적어도 행동으로 챙깁니다.', parenting: '아이에게 "남 눈치 보지 말고 네 스타일대로 살아"라고 쿨하게 말합니다.', furn: ['glass_chair', 'brass_lamp'], morning: '…일어났어? 커피 내려 뒀어.' },
      atmo: { name: '시크함', palette: [0x2b2b30, 0xd8d8dc], pname: '차콜 블랙 & 실버 그레이', light: 'cool', tone: '갤러리처럼 절제된 차가운 조명' },
      style: { top: ['vest', 'hoodie', 'tee'], pattern: ['plain', 'stripe'], cloth: [0x2b2b30, 0x9aa3ad, 0xf4f4f4], glasses: ['sun', 'none'], hat: ['none', 'beanie'], acc: ['none', 'scarf'], eyes: ['smug', 'sleepy'], mouth: ['flat'] },
      dislike: ['plush', 'weird'], topics: ['…그냥. 커피 마시러 왔어', '유행? 난 내 스타일 입어', '시끄러운 건 별로야. 조용한 데 없나'],
      title: '도시인', voice: { wave: 'triangle', speed: 0.9, vol: 0.95, mul: 0.94, range: 0.9, bright: 2.2 },
    },
    PURE: {
      L1: { name: '청순함', en: 'Pure', icon: '🤍', desc: '맑은 미소, 수줍은 인사, 꽃과 책, 봄바람 산책', range: 'NEIGHBOR', idle: 'normal', speed: -5, acts: ['smell_flower', 'read_book', 'hide_face'], pref: ['flowers', 'books', 'trees'], likes: ['flower', 'book', 'poem'] },
      life: { love: '첫사랑처럼 설레는 연애. 손만 잡아도 얼굴이 빨개지고, 교환일기를 씁니다.', loveLine: '저… 사실 처음 본 날부터… 좋아했어요.', marriage: '하얀 들꽃 부케로 작은 결혼식을 올리고, 소박하고 따뜻한 신혼을 보냅니다.', parenting: '아이와 함께 들꽃 이름을 외우고 동화책을 매일 읽어 줍니다.', furn: ['vase_flowers', 'bookshelf'], morning: '좋은 아침… 창문 열었더니 꽃향기가 나요.' },
      atmo: { name: '청순함', palette: [0xffffff, 0xcfe8ff], pname: '퓨어 화이트 & 스카이 블루', light: 'bright', tone: '커튼 사이로 햇살이 드는 맑은 조명' },
      style: { top: ['dress', 'sweater'], pattern: ['plain', 'flower'], cloth: [0xffffff, 0xcfe8ff, 0xfff4d6], hat: ['headband', 'flower', 'none'], acc: ['none', 'scarf'], eyes: ['round', 'dot'], mouth: ['smile', 'w'] },
      dislike: ['weird', 'party'], topics: ['오늘 도서관 창가 자리에서 시집을 읽었어요', '벚꽃잎이 머리에 떨어졌는데… 소원 빌었어요', '바람이 참 부드럽죠?'],
      title: '첫사랑', voice: { wave: 'sine', speed: 0.95, vol: 0.95, mul: 1.12, range: 1.5, bright: 3 },
    },
    FRESH: {
      L1: { name: '과즙미', en: 'Juicy Fresh', icon: '🍑', desc: '상큼 발랄, 톡톡 튀는 리액션, 과일 음료, 비타민 에너지', range: 'TOWN', idle: 'short', speed: 15, acts: ['cheer', 'cute_pose', 'drink_can'], pref: ['cafe', 'sea', 'plaza'], likes: ['food', 'snack', 'fashion'] },
      life: { love: '연애도 상큼하게! 데이트마다 과일 에이드를 나눠 마시고 볼 콕 셀카를 찍어요.', loveLine: '너 보면 막~ 톡 터지는 복숭아 맛이 나! 좋아해!', marriage: '신혼집 냉장고는 늘 과일로 꽉! 주방에서 매일 스무디 파티.', parenting: '아이와 과일 모양 도시락을 싸고 바닷가 소풍을 떠납니다.', furn: ['candy_chair', 'jelly_sofa'], morning: '굿모닝~! 오늘의 비타민 충전 완료!' },
      atmo: { name: '과즙미', palette: [0xffa07a, 0xb8f07a], pname: '피치 오렌지 & 라임 그린', light: 'pastel', tone: '과일 에이드처럼 톡 쏘는 상큼한 조명' },
      style: { top: ['tee', 'aloha', 'dress'], pattern: ['dots', 'heart', 'stripe2'], cloth: [0xffa07a, 0xffd84a, 0xb8f07a], hat: ['bow', 'cap', 'headband'], glasses: ['heart', 'none'], eyes: ['sparkle', 'happy'], mouth: ['grin', 'open'] },
      dislike: ['book', 'occult'], topics: ['카페 신메뉴 복숭아 에이드 먹어 봤어? 완전 내 스타일!', '오늘 바닷가 햇살 미쳤어~ 같이 가자!', '에너지 충전! 나랑 하이파이브!'],
      title: '비타민', voice: { wave: 'triangle', speed: 1.2, vol: 1.1, mul: 1.14, range: 2.4, bright: 5 },
    },
    BEAGLE: {
      L1: { name: '비글미', en: 'Beagle', icon: '🐶', desc: '넘치는 에너지, 장난, 뛰어다니기, 가만히 못 있음', range: 'TOWN', idle: 'short', speed: 25, acts: ['prank', 'weird_dance', 'jog'], pref: ['plaza', 'party', 'fountain'], likes: ['party', 'snack', 'weird'] },
      life: { love: '연애도 놀이처럼! 몰래카메라 고백을 하고, 연인을 웃기는 게 인생 목표.', loveLine: '짜잔~! 놀랐지? 근데 이건 장난 아니고 진짜… 좋아해!', marriage: '신혼집에선 매일 베개 싸움. 이웃이 시끄럽다고 찾아올 정도.', parenting: '아이보다 더 신나게 뛰어놀고, 아이와 한 팀이 되어 배우자에게 장난을 칩니다.', furn: ['balloon', 'plush_giant'], morning: '일어나 일어나~!! 아침이다아아!!' },
      atmo: { name: '비글미', palette: [0xffd84a, 0x4fc1c9], pname: '레몬 옐로 & 민트 블루', light: 'party', tone: '놀이터처럼 들썩이는 파티 조명' },
      style: { top: ['tee', 'hoodie'], pattern: ['stripe2', 'dots', 'star'], cloth: [0xffd84a, 0x4fc1c9, 0xff6f61], hat: ['cap', 'headband', 'horns'], acc: ['backpack', 'none'], eyes: ['wink', 'happy'], mouth: ['tooth', 'grin'] },
      dislike: ['book', 'luxury'], topics: ['아까 분수대에 뛰어들 뻔했어 ㅋㅋㅋ', '우리 광장에서 술래잡기 할래?! 지금!!', '심심해~ 뭐 재밌는 거 없어?!'],
      title: '장난꾸러기', voice: { wave: 'square', speed: 1.35, vol: 1.15, mul: 1.1, range: 2.8, bright: 4.5 },
    },
    MYSTIC: {
      L1: { name: '몽환미', en: 'Dreamy Mystic', icon: '🌙', desc: '멍하니 하늘 보기, 별자리, 알 수 없는 말, 새벽 감성', range: 'NEIGHBOR', idle: 'long', speed: -15, acts: ['daydream', 'stargaze', 'candle'], pref: ['stars', 'waterfall', 'quiet'], likes: ['occult', 'art', 'poem'] },
      life: { love: '꿈에서 본 사람과 사랑에 빠지는 타입. 별똥별이 떨어지는 밤에 고백합니다.', loveLine: '어젯밤 꿈에… 네가 나왔어. 그건 운명이라는 뜻이야.', marriage: '신혼집 천장에 별빛 조명을 달고, 매일 밤 서로의 꿈 이야기를 나눕니다.', parenting: '아이에게 달님과 별님의 옛이야기를 들려주며 재웁니다.', furn: ['crystal_ball', 'lantern'], morning: '…음, 아직 꿈속인 것 같아. 안녕, 아침.' },
      atmo: { name: '몽환미', palette: [0xc9b3ff, 0x8fd3ff], pname: '라벤더 & 오로라 블루', light: 'holo', tone: '꿈속을 떠다니는 듯한 홀로그램 오로라 조명' },
      style: { top: ['dress', 'sweater'], pattern: ['star', 'snow'], cloth: [0xc9b3ff, 0x8fd3ff, 0xffc6de], hat: ['halo', 'nightcap', 'flower'], acc: ['cape', 'wings', 'none'], eyes: ['star', 'sleepy'], mouth: ['w', 'smile'] },
      dislike: ['sport', 'party'], topics: ['구름 모양이 고래 같지 않아…? 헤엄치는 것 같아', '천문대에서 보니까 별들이 나한테 속삭였어', '가끔은 이 섬 전체가 꿈인 것 같아'],
      title: '달의 아이', voice: { wave: 'sine', speed: 0.8, vol: 0.95, mul: 1.06, vib: 0.04, glide: 0.06, range: 1.8, bright: 2 },
    },
    CHARISMA: {
      L1: { name: '카리스마', en: 'Charismatic', icon: '🔥', desc: '강렬한 눈빛, 단호한 말투, 무리의 중심, 존재감', range: 'WORLD', idle: 'normal', speed: 5, acts: ['show_off', 'meddle', 'gaze_far'], pref: ['plaza', 'stage', 'soapbox'], likes: ['luxury', 'music', 'sport'] },
      life: { love: '직진형 연애. "내 사람 해." 한마디로 고백하고, 연인을 누구보다 든든하게 지킵니다.', loveLine: '고민하지 마. 오늘부터 넌 내 사람이야.', marriage: '가족의 든든한 기둥. 섬 누구도 우리 가족을 함부로 못 건드립니다.', parenting: '아이에게 "당당하게 고개 들어"를 가르치며 무대 위의 자신감을 물려줍니다.', furn: ['mirror_full', 'neon_sign'], morning: '일어났으면 가자. 오늘도 우리가 주인공이야.' },
      atmo: { name: '카리스마', palette: [0x1a1a1a, 0xc8102e], pname: '블랙 & 크림슨 레드', light: 'redneon', tone: '무대 위 스포트라이트 같은 강렬한 레드 네온' },
      style: { top: ['vest', 'hoodie'], pattern: ['plain', 'stripe'], cloth: [0x1a1a1a, 0xc8102e, 0xe8c070], glasses: ['sun', 'none'], hat: ['none', 'crown'], acc: ['cape', 'necklace', 'tie'], eyes: ['smug'], brows: ['thick', 'angry'], mouth: ['flat', 'smile'] },
      dislike: ['plush', 'weird'], topics: ['광장에서 내가 한마디 하니까 다들 조용해지더라', '어설프게 할 거면 시작도 하지 마', '따라와. 재밌는 거 보여 줄게'],
      title: '보스', voice: { wave: 'sawtooth', speed: 0.95, vol: 1.25, mul: 0.86, range: 1.1, bright: 2.8, gruff: 0.3 },
    },
    HIP: {
      L1: { name: '힙함', en: 'Hip', icon: '🧢', desc: '스트릿 패션, 힙합, 그래피티, 남들이 모르는 핫플', range: 'TOWN', idle: 'normal', speed: 10, acts: ['weird_dance', 'listen_radio', 'take_photo'], pref: ['stage', 'mall', 'radio'], likes: ['music', 'fashion', 'art'] },
      life: { love: '연애도 스웩 있게! 자작 랩으로 고백하고, 커플 스냅은 무조건 필름 카메라로.', loveLine: 'Yo, 너 없인 내 비트가 완성이 안 돼. 내 벌스에 들어와 줄래?', marriage: '창고형 신혼집에 턴테이블과 그래피티 벽을 만들고 매주 홈파티를 엽니다.', parenting: '아이에게 첫 스냅백을 씌워 주고, 동요를 리믹스해서 들려줍니다.', furn: ['dj_booth', 'turntable'], morning: '굿모닝, 오늘 바이브 좋은데? 🎧' },
      atmo: { name: '힙함', palette: [0x39ff14, 0x2b2b30], pname: '애시드 그린 & 아스팔트 블랙', light: 'neon', tone: '지하 클럽 같은 애시드 네온 조명' },
      style: { top: ['hoodie', 'tee'], pattern: ['stripe2', 'star'], cloth: [0x2b2b30, 0x39ff14, 0xff6f61], hat: ['cap', 'bucket', 'beanie'], glasses: ['sun', 'square'], acc: ['necklace', 'backpack'], eyes: ['smug', 'wink'], mouth: ['grin'] },
      dislike: ['poem', 'flower'], topics: ['요즘 클럽 DJ 셋리스트 들어 봤어? 미쳤어', '그 핫플 아직 아무도 몰라. 너만 알려 줄게', '유행 따라가는 건 안 힙해. 만드는 게 힙이지'],
      title: '스트리트 아티스트', voice: { wave: 'square', speed: 1.15, vol: 1.1, mul: 0.96, range: 1.6, bright: 3.8 },
    },
    CLASSIC: {
      L1: { name: '클래식', en: 'Classic', icon: '🎻', desc: '레트로 취향, 클래식 음악, 옛날 영화, 전통과 예의', range: 'NEIGHBOR', idle: 'long', speed: -10, acts: ['listen_radio', 'read_book', 'polite_bow'], pref: ['books', 'radio', 'bench'], likes: ['music', 'book', 'art'] },
      life: { love: '흑백 영화 같은 로맨스. 편지로 마음을 전하고, 첫 데이트는 음악회.', loveLine: '제 마음을 이 편지에 담았습니다. 천천히 읽어 주세요.', marriage: '축음기 음악이 흐르는 신혼집에서 매년 같은 날 같은 곡에 맞춰 춤을 춥니다.', parenting: '아이에게 할머니의 요리법과 옛날 동요를 그대로 물려줍니다.', furn: ['record_shelf', 'brass_lamp'], morning: '좋은 아침입니다. 오늘은 바흐로 하루를 시작해 볼까요.' },
      atmo: { name: '클래식', palette: [0x6b3a2a, 0xe8d4a8], pname: '마호가니 브라운 & 빈티지 크림', light: 'study', tone: '오래된 서재처럼 차분한 호박빛 조명' },
      style: { top: ['vest', 'sweater'], pattern: ['plaid', 'plain'], cloth: [0x6b3a2a, 0x2f4b6e, 0xe8d4a8], hat: ['beret', 'none'], glasses: ['round', 'none'], acc: ['bowtie', 'tie', 'satchel'], eyes: ['dot'], mouth: ['smile'] },
      dislike: ['weird', 'party'], topics: ['요즘 노래도 좋지만, 역시 옛 명곡만 한 게 없죠', '달빛 차관의 전통차는 언제나 한결같아요', '예의는 시대가 바뀌어도 변하지 않는 법입니다'],
      title: '신사숙녀', voice: { wave: 'triangle', speed: 0.9, vol: 1.0, mul: 0.98, vib: 0.02, range: 1.2, bright: 2.6 },
    },
    CUTIE: {
      L1: { name: '큐트', en: 'Cutie', icon: '🎀', desc: '애교, 하트 뿅뿅, 인형 수집, 귀여운 것 최고', range: 'NEIGHBOR', idle: 'normal', speed: 5, acts: ['cute_pose', 'hide_face', 'eat_snack'], pref: ['flowers', 'cafe', 'mall'], likes: ['plush', 'snack', 'fashion'] },
      life: { love: '애교가 연애의 무기! 하트 편지와 곰인형 선물로 연인의 마음을 녹입니다.', loveLine: '나… 너 좋아하면 안 돼? 히잉, 대답해 줘~ 💕', marriage: '신혼집이 인형 박물관이 되고, 커플 잠옷은 곰돌이 무늬.', parenting: '아이와 똑같은 머리핀을 하고 "우리 애기 세상에서 제일 귀여워!"를 외칩니다.', furn: ['plush_bear', 'heart_sofa'], morning: '굿모닝~ 뽀뽀는 3번! 약속~ 🎀' },
      atmo: { name: '큐트', palette: [0xffc6de, 0xfff0a8], pname: '베이비 핑크 & 버터 옐로', light: 'rosy', tone: '솜사탕처럼 말랑한 핑크 조명' },
      style: { top: ['dress', 'sweater', 'hoodie'], pattern: ['heart', 'dots'], cloth: [0xffc6de, 0xfff0a8, 0xb69cff], hat: ['bow', 'flower', 'headband'], glasses: ['heart', 'none'], eyes: ['sparkle', 'happy'], mouth: ['w'] },
      dislike: ['sport', 'occult'], topics: ['이 인형 봐 봐! 너무 귀엽지이~?', '오늘 머리핀 새로 했는데 알아봤어? 히히', '귀여운 건 세상을 구한다구!'],
      title: '애교쟁이', voice: { wave: 'sine', speed: 1.15, vol: 1.05, mul: 1.2, range: 2.6, bright: 4.5 },
    },
    DANDY: {
      L1: { name: '댄디', en: 'Dandy', icon: '🎩', desc: '깔끔한 셔츠, 매너, 향수, 여유로운 미소', range: 'TOWN', idle: 'normal', speed: 0, acts: ['polite_bow', 'mirror_check', 'tea'], pref: ['cafe', 'fancy', 'plaza'], likes: ['luxury', 'fashion', 'book'] },
      life: { love: '매너가 곧 연애. 문을 열어 주고, 우산을 씌워 주고, 기념일엔 꽃과 레스토랑.', loveLine: '괜찮다면… 오늘 저녁, 당신 시간을 제게 주시겠어요?', marriage: '셔츠 다림질이 취미가 되고, 배우자에게 매일 아침 커피를 내려 줍니다.', parenting: '아이에게 매너와 넥타이 매는 법을 가르칩니다.', furn: ['clothes_rack', 'brass_lamp'], morning: '좋은 아침. 오늘도 멋진 하루 보내요.' },
      atmo: { name: '댄디', palette: [0x2f4b6e, 0xd8c8a8], pname: '네이비 & 베이지 트위드', light: 'warm', tone: '테일러숍처럼 정돈된 따뜻한 조명' },
      style: { top: ['vest', 'sweater'], pattern: ['plain', 'stripe'], cloth: [0x2f4b6e, 0xd8c8a8, 0xffffff], hat: ['none', 'beret'], acc: ['tie', 'bowtie', 'scarf'], eyes: ['dot', 'smug'], mouth: ['smile'] },
      dislike: ['weird', 'snack'], topics: ['셔츠 깃이 반듯하면 하루가 반듯해지죠', '스카이라운지 야경, 혼자 보긴 아깝더군요', '향수는 기억에 남는 인사 같은 거예요'],
      title: '젠틀맨', voice: { wave: 'triangle', speed: 0.95, vol: 1.05, mul: 0.92, range: 1.3, bright: 3 },
    },
    TOMBOY: {
      L1: { name: '털털함', en: 'Easygoing', icon: '🛹', desc: '보이시, 쿨한 성격, 뒤끝 없음, 스케이트와 운동', range: 'TOWN', idle: 'short', speed: 15, acts: ['stick_swing', 'jog', 'chat'], pref: ['plaza', 'gym', 'sea'], likes: ['sport', 'food', 'snack'] },
      life: { love: '친구 같은 연애. 어깨동무 데이트를 하고, 고백도 "야, 우리 사귈래?"로 털털하게.', loveLine: '야, 솔직히 말할게. 너랑 있는 게 제일 편하고… 좋아.', marriage: '신혼집 현관에 스케이트보드 두 개. 싸워도 치킨 한 마리로 바로 화해.', parenting: '아이와 공놀이를 하며 "넘어져도 툭툭 털고 일어나!"를 가르칩니다.', furn: ['bench_press', 'tv'], morning: '야 일어나! 오늘 날씨 완전 좋아, 나가자!' },
      atmo: { name: '털털함', palette: [0x4fc1c9, 0xf4f4f4], pname: '틸 블루 & 코튼 화이트', light: 'bright', tone: '운동장처럼 탁 트인 밝은 조명' },
      style: { top: ['tee', 'hoodie'], pattern: ['plain', 'stripe2'], cloth: [0x4fc1c9, 0x2b2b30, 0xff6f61], hat: ['cap', 'bucket', 'none'], acc: ['backpack', 'none'], eyes: ['happy', 'dot'], mouth: ['grin'] },
      dislike: ['plush', 'luxury'], topics: ['뒤끝? 그런 거 없어. 다 잊었어!', '편의점 라면 먹으러 갈 사람~!', '오늘 광장에서 공 차다가 창문 깰 뻔했어 ㅋㅋ'],
      title: '골목대장', voice: { wave: 'triangle', speed: 1.15, vol: 1.15, mul: 0.98, range: 1.7, bright: 3.8 },
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
