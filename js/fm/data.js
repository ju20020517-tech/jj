/* =========================================================
 *  친구모아 아일랜드 — 기획 데이터
 *  (성격 4레이어, 행동 스탯, 행동 상태, 관계 단계, 테마, 아이템)
 *  기획서 문구는 가능한 그대로 옮겨 적고, 로직은 sim-*.js 에서 사용
 * ========================================================= */
(() => {
  'use strict';
  const FM = (window.FM = window.FM || {});
  const D = (FM.D = {});

  D.SAVE_KEY = 'friendmoa-island-v1';
  D.MAX_APT = 20;          // 5층 × 4호실
  D.START_VILLAGERS = 10;

  // =========================================================
  // 1. 성격 키워드 조합 모듈 (4-Layer System)
  // [1. 메인 성격] + [2. 서브 성향] + [3. 대화 태도] + [4. 특이 취향]
  //   (기본 욕구)    (행동 패턴)    (말투/반응)    (상호작용)
  // =========================================================
  // speed: 속도 가중치, range: 활동 범위 태그, idle: 대기 시간 태그, acts: 고유 행동(+30%)
  D.L1 = {
    ROMANTIC:  { name: '낭만파', en: 'Romantic', icon: '🌹', desc: '사랑, 분위기, 감성, 관계 발전에 집착', range: 'NEIGHBOR', idle: 'normal', speed: 0,
      acts: ['smell_flower', 'watch_sky', 'write_poem'], pref: ['flowers', 'stars', 'hill'], likes: ['flower', 'romance', 'poem'] },
    ATHLETIC:  { name: '운동파', en: 'Athletic', icon: '💪', desc: '체력, 경쟁, 야외 활동, 신체 단련 우선', idle: 'short', speed: 30,
      acts: ['workout', 'stretch', 'jog'], pref: ['plaza', 'dumbbell', 'gym'], likes: ['sport', 'food'] },
    SCHOLARLY: { name: '탐구파', en: 'Scholarly', icon: '🔎', desc: '지식, 관찰, 실험, 수집(곤충/물고기/책)에 집중', range: 'NEIGHBOR', idle: 'normal', speed: 0,
      acts: ['observe_bugs', 'read_book', 'fish'], pref: ['bugs', 'fish', 'books'], likes: ['book', 'science'] },
    LAZY:      { name: '미식/휴식파', en: 'Lazy/Glutton', icon: '🍩', desc: '맛있는 음식, 수면, 편안함 최우선', idle: 'long', speed: -30, slowName: '느긋함',
      acts: ['eat_snack', 'nap', 'drink_can'], pref: ['bench', 'cafe', 'food'], likes: ['food', 'snack'] },
    EXTROVERT: { name: '사교파', en: 'Extrovert/Party', icon: '🎉', desc: '소문, 친구 만들기, 이벤트, 시끌벅적함 선호', range: 'WORLD', idle: 'normal', speed: 10,
      acts: ['chat', 'gossip', 'cheer'], pref: ['plaza', 'cafe', 'party'], likes: ['party', 'fashion'] },
    INTROVERT: { name: '내향파', en: 'Introvert/Quiet', icon: '🌙', desc: '혼자만의 시간, 조용한 장소, 개인 공간 중시', range: 'HOME', idle: 'long', speed: -10,
      acts: ['alone_sit', 'read_book', 'daydream'], pref: ['quiet', 'books', 'bench'], likes: ['book', 'tea'] },
    SNOB:      { name: '명예/신사파', en: 'Snob/Formal', icon: '🎩', desc: '교양, 예의, 고급스러운 물건, 신분/평판 신경 씀', idle: 'normal', speed: -10,
      acts: ['tea', 'mirror_check', 'polite_bow'], pref: ['cafe', 'fancy', 'fountain'], likes: ['luxury', 'tea'] },
    CRANKY:    { name: '반항/츤데레파', en: 'Cranky/Rebel', icon: '💢', desc: '툴툴거림, 마이웨이, 쉽게 솔직해지지 못함', idle: 'normal', speed: 0,
      acts: ['grumble_kick', 'drink_can', 'alone_sit'], pref: ['quiet', 'bench'], likes: ['food', 'sport'] },
    ARTISTIC:  { name: '예술/엉뚱파', en: 'Artistic/Quirky', icon: '🎨', desc: '공상, 특이한 패션, 독창적 예술 활동, 4차원', idle: 'normal', speed: 0,
      acts: ['paint', 'daydream', 'weird_dance'], pref: ['stars', 'weird', 'flowers'], likes: ['art', 'weird'] },
    ANXIOUS:   { name: '걱정/심약파', en: 'Anxious', icon: '💦', desc: '사소한 일에 놀람, 건강 염려, 플레이어나 주민에게 의존', range: 'HOME', idle: 'normal', speed: 0,
      acts: ['fidget', 'check_health', 'follow_friend'], pref: ['quiet', 'home'], likes: ['medicine', 'tea', 'plush'] },
  };
  // [Layer 2] 서브 행동 성향 — 실제 필드에서 움직이는 이동 템포와 동선
  D.L2 = {
    DILIGENT:   { name: '부지런함', en: 'Diligent', icon: '🧹', desc: '쉬는 시간이 짧고 끊임없이 무언가를 함 (꽃 물주기, 청소)', range: 'NEIGHBOR', idle: 'short', speed: 20, restMul: 0.5,
      acts: ['water_flowers', 'sweep'] },
    SLOTH:      { name: '게으름', en: 'Sloth', icon: '🦥', desc: '걸음 속도가 느리고, 의자나 나무 그늘만 보이면 누워서 쉼', idle: 'long', speed: -30, slowName: '느긋함',
      acts: ['nap', 'lie_shade'] },
    CURIOUS:    { name: '호기심 천국', en: 'Curious', icon: '❓', desc: '눈앞에 보이는 새로운 사람, 곤충, 오브젝트로 동선이 계속 튐', idle: 'short', speed: 10, jumpy: true,
      acts: ['inspect', 'observe_bugs'] },
    HOMEBODY:   { name: '집돌이/집순이', en: 'Homebody', icon: '🏠', desc: '마을 산책보다 자기 집 안이나 마당에 머무는 시간이 길음', range: 'HOME', idle: 'normal', speed: -20,
      acts: ['home_life', 'yard_potter'] },
    WANDERER:   { name: '떠돌이', en: 'Wanderer', icon: '🧭', desc: '마을 외곽, 언덕, 숲속 등 멀리 떨어진 외딴곳을 주로 다님', range: 'WORLD', idle: 'normal', speed: 10, remote: true,
      acts: ['gaze_far', 'hike'] },
    BUSYBODY:   { name: '오지랖', en: 'Busybody', icon: '👀', desc: '다른 주민들이 대화하거나 상호작용하는 곳에 계속 끼어듦', range: 'WORLD', idle: 'short', speed: 10,
      acts: ['meddle', 'chat'] },
    NIGHT_OWL:  { name: '밤깨비', en: 'Night Owl', icon: '🦉', desc: '낮에는 자고 야간/새벽 시간대에 주로 활동함', idle: 'normal', speed: 0, wake: 13, sleep: 5,
      acts: ['stargaze', 'night_walk'] },
    EARLY_BIRD: { name: '아침형 인간', en: 'Early Bird', icon: '🐓', desc: '해가 뜨자마자 가장 먼저 나와서 활동함', idle: 'normal', speed: 0, wake: 6, sleep: 22,
      acts: ['morning_stretch', 'jog'] },
  };
  // [Layer 3] 대화 태도 및 말투 태그 — 대사 문장의 톤과 고유 어미
  D.L3 = {
    WARM:       { name: '다정다감', en: 'Warm', icon: '🤗', endings: ['~했어?', '~란다'], desc: '상대방의 안부를 자주 물음', idle: 'normal', acts: ['ask_wellbeing'] },
    FORMAL:     { name: '단정/격식', en: 'Formal', icon: '🙇', endings: ['~입니다', '~군요'], desc: '존댓말을 쓰며 정중함', acts: ['polite_bow'] },
    CYNICAL:    { name: '시니컬/츤데레', en: 'Cynical', icon: '😒', endings: ['... 딱히', '~이거든?'], desc: '툴툴거리지만 마지막엔 챙겨줌', acts: ['grumble_kick'] },
    CUTE:       { name: '귀엽/앙칼짐', en: 'Cute', icon: '🎀', endings: ['~라구!', '~야!'], desc: '감정 표현이 크고 애교 섞임', acts: ['cute_pose'] },
    PRANKSTER:  { name: '장난꾸러기', en: 'Prankster', icon: '😜', endings: ['~지롱', 'ㅋㅋㅋ'], desc: '농담을 자주 건네고 깜짝 놀래킴', acts: ['prank'] },
    DREAMY:     { name: '몽상/나른함', en: 'Dreamy', icon: '☁️', endings: ['~랄까나...', '~인 거 같아'], desc: '문장이 길고 끝을 흐림', idle: 'long', speed: -20, slowName: '나른함', acts: ['daydream'] },
    PASSIONATE: { name: '열정/오버', en: 'Passionate', icon: '🔥', endings: ['~다!!!', '~ 가자!'], desc: '느낌표가 많고 에너지가 넘침', idle: 'short', speed: 20, acts: ['cheer'] },
    SHY:        { name: '쑥스러움', en: 'Shy', icon: '😳', endings: ['...저기,', '~일지도...'], desc: '말을 머뭇거리고 수줍어함', acts: ['hide_face'] },
  };
  // [Layer 4] 특이 취향 — 마을에서 가장 많이 손에 쥐거나 상호작용하는 대상
  D.L4 = {
    GARDEN:  { name: '원예', icon: '🌷', desc: '꽃, 나무, 길가 잡초에 집착', props: ['wateringCan'], acts: ['water_flowers', 'pull_weeds'], pref: ['flowers', 'trees'], likes: ['flower', 'plant'] },
    FOOD:    { name: '미식', icon: '🥪', desc: '캔 음료, 과자, 샌드위치를 항시 소지', props: ['can', 'snack', 'sandwich'], acts: ['eat_snack', 'drink_can'], pref: ['cafe', 'food'], likes: ['food', 'snack'] },
    STUDY:   { name: '독서/공부', icon: '📖', desc: '책, 돋보기, 지도/스케치북 소지', props: ['book', 'magnifier', 'sketchbook'], acts: ['read_book', 'sketch'], pref: ['books', 'bench'], likes: ['book', 'science'] },
    FISHING: { name: '낚시/채집', icon: '🎣', desc: '낚싯대, 잠자리채를 들고 다님', props: ['rod', 'net'], acts: ['fish', 'bug_catch'], pref: ['fish', 'bugs'], likes: ['fishing', 'science'] },
    FASHION: { name: '패션', icon: '👗', desc: '옷가게 자주 방문, 거울 보기, 옷 자랑', props: ['handMirror'], acts: ['mirror_check', 'show_off'], pref: ['mall', 'mirror'], likes: ['fashion', 'luxury'] },
    MUSIC:   { name: '음악', icon: '🎵', desc: '라디오 근처에서 노래 부르기, 악기 연주', props: ['mic', 'guitar'], acts: ['sing', 'play_guitar', 'listen_radio'], pref: ['radio', 'stage'], likes: ['music'] },
    GOSSIP:  { name: '연애/수다', icon: '💬', desc: '주민 간의 소문, 짝사랑 이야기 언급', props: ['magazine'], acts: ['gossip', 'chat'], pref: ['cafe', 'plaza'], likes: ['romance', 'party'] },
    CLEAN:   { name: '청결', icon: '🧽', desc: '마당 쓸기, 먼지 털기, 분리수거', props: ['broom', 'duster'], acts: ['sweep', 'dust', 'recycle'], pref: ['home', 'plaza'], likes: ['clean', 'tea'] },
    OCCULT:  { name: '주술/운세', icon: '🔮', desc: '밤에 별 보기, 촛불 켜기, 운세 언급', props: ['candle', 'crystal'], acts: ['stargaze', 'candle', 'fortune'], pref: ['stars', 'quiet'], likes: ['weird', 'occult'] },
    FITNESS: { name: '운동기구', icon: '🏋️', desc: '아령, 스트레칭, 런닝', props: ['dumbbell'], acts: ['workout', 'stretch', 'jog'], pref: ['gym', 'dumbbell', 'plaza'], likes: ['sport'] },
  };
  D.LAYERS = [D.L1, D.L2, D.L3, D.L4];
  D.LAYER_NAMES = ['메인 성격', '서브 행동 성향', '대화 태도', '특이 취향'];
  D.kw = id => D.L1[id] || D.L2[id] || D.L3[id] || D.L4[id];

  // =========================================================
  // 2. 키워드 조합 예시 (실제 생성되는 복합 주민)
  // =========================================================
  D.COMBO_EXAMPLES = [
    { keys: ['ROMANTIC', 'HOMEBODY', 'SHY', 'STUDY'], title: '방구석 연애소설 매니아',
      pattern: '낮에는 자기 집에서 연애소설 책을 읽거나 시를 씀. 밤에 슬그머니 나와 산책함.',
      line: '...저기, 오늘 달빛이 예쁜 것 같아... (~랄까나)',
      love: '좋아하는 NPC가 생겨도 말을 못 걸고, 밤에 그 NPC 집 문 앞에 몰래 편지나 선물만 두고 도망침.' },
    { keys: ['ATHLETIC', 'BUSYBODY', 'PASSIONATE', 'GOSSIP'], title: '열정 넘치는 사랑의 사랑꾼 코치',
      pattern: '마을을 땀 흘리며 뛰어다니다가, 썸타는 주민 커플을 발견하면 사이에 끼어들어 고백하라고 부추김.',
      line: '사랑도 운동이야! 망설이지 말고 직진해라!!! (~다!)',
      love: '마음에 드는 상대가 생기면 매일 아침 집 앞으로 찾아가 같이 조깅하자고 직진 고백함.' },
    { keys: ['CRANKY', 'DILIGENT', 'CYNICAL', 'GARDEN'], title: '툴툴거리는 비밀의 정원사',
      pattern: '마을 전체를 걸어다니며 시든 꽃에 물을 주고 다니지만, 누군가 다가오면 괜히 화냄.',
      line: '내가 물 주고 싶어서 준 거 아니거든? 지나가는 길에 그냥 쏟아진 거야... (~이거든?)',
      love: '상대를 좋아하면서도 일부러 관심 없는 척함. 상대가 고민 아이콘(!)을 띄우면 제일 먼저 달려옴.' },
  ];
  // 예시에 없는 조합의 조합명 조각 (서브 성향 수식어 + 대화 태도 수식어 + 취향/성격 명사)
  D.TITLE_ADJ_L2 = { DILIGENT: '부지런한', SLOTH: '느긋한', CURIOUS: '호기심 많은', HOMEBODY: '방구석', WANDERER: '떠돌이', BUSYBODY: '오지랖 넓은', NIGHT_OWL: '한밤중의', EARLY_BIRD: '새벽의' };
  D.TITLE_ADJ_L3 = { WARM: '다정한', FORMAL: '품격 있는', CYNICAL: '툴툴대는', CUTE: '앙칼진', PRANKSTER: '장난꾸러기', DREAMY: '몽롱한', PASSIONATE: '열혈', SHY: '수줍은' };
  D.TITLE_NOUN = {
    ROMANTIC: { GARDEN: '꽃밭의 시인', FOOD: '디저트 로맨티스트', STUDY: '연애소설 매니아', FISHING: '바다의 음유시인', FASHION: '분위기 메이커', MUSIC: '세레나데 가수', GOSSIP: '사랑의 전령', CLEAN: '향기로운 살림꾼', OCCULT: '별자리 점술가', FITNESS: '장미꽃 러너' },
    ATHLETIC: { GARDEN: '근육 정원사', FOOD: '단백질 미식가', STUDY: '운동 이론가', FISHING: '철인 낚시꾼', FASHION: '스포티 패셔니스타', MUSIC: '응원단장', GOSSIP: '사랑꾼 코치', CLEAN: '청소 트레이너', OCCULT: '기합 도사', FITNESS: '헬스 마니아' },
    SCHOLARLY: { GARDEN: '식물 박사', FOOD: '맛 분석가', STUDY: '만물 박사', FISHING: '곤충 채집가', FASHION: '패션 연구가', MUSIC: '음향학자', GOSSIP: '연애 통계학자', CLEAN: '위생 연구원', OCCULT: '천문학자', FITNESS: '운동 생리학자' },
    LAZY: { GARDEN: '낮잠 정원사', FOOD: '간식 요정', STUDY: '누워서 책 읽는 자', FISHING: '졸린 낚시꾼', FASHION: '파자마 모델', MUSIC: '자장가 가수', GOSSIP: '소파 수다쟁이', CLEAN: '가끔 청소부', OCCULT: '꿈 해몽가', FITNESS: '런닝머신 위 낮잠꾼' },
    EXTROVERT: { GARDEN: '꽃잔치 주최자', FOOD: '맛집 투어 대장', STUDY: '북클럽 회장', FISHING: '낚시 대회 사회자', FASHION: '핵인싸', MUSIC: '파티 DJ', GOSSIP: '소문의 진원지', CLEAN: '동네 반장', OCCULT: '운세 전도사', FITNESS: '줌바 강사' },
    INTROVERT: { GARDEN: '비밀 정원사', FOOD: '혼밥 미식가', STUDY: '도서관 지박령', FISHING: '고독한 낚시꾼', FASHION: '거울 앞 모델', MUSIC: '이어폰 음악가', GOSSIP: '조용한 관찰자', CLEAN: '정리의 달인', OCCULT: '달빛 점성술사', FITNESS: '홈트레이너' },
    SNOB: { GARDEN: '장미 귀족', FOOD: '미식 평론가', STUDY: '교양 신사', FISHING: '요트 클럽 회원', FASHION: '명품 수집가', MUSIC: '오페라 애호가', GOSSIP: '사교계 인사', CLEAN: '결벽 귀족', OCCULT: '타로 귀부인', FITNESS: '승마 신사' },
    CRANKY: { GARDEN: '비밀의 정원사', FOOD: '까칠한 미식가', STUDY: '독설 평론가', FISHING: '마이웨이 낚시꾼', FASHION: '반항아 패셔니스타', MUSIC: '펑크 로커', GOSSIP: '츤데레 상담가', CLEAN: '잔소리 청소반장', OCCULT: '저주 전문가', FITNESS: '골목 복서' },
    ARTISTIC: { GARDEN: '4차원 정원사', FOOD: '분자 요리 예술가', STUDY: '공상 과학자', FISHING: '물고기 초상화가', FASHION: '전위 패셔니스타', MUSIC: '실험 음악가', GOSSIP: '소문 창작가', CLEAN: '먼지 조각가', OCCULT: '우주 교신가', FITNESS: '행위 예술 댄서' },
    ANXIOUS: { GARDEN: '물 과잉 정원사', FOOD: '영양제 수집가', STUDY: '걱정 백과사전', FISHING: '떨리는 낚시꾼', FASHION: '옷 고민러', MUSIC: '떨리는 가수', GOSSIP: '걱정 상담가', CLEAN: '소독 마니아', OCCULT: '부적 수집가', FITNESS: '조심조심 운동러' },
  };

  // =========================================================
  // 주민 행동 — [스탯 가중치 융합]
  // 활동 범위 (Activity Range)
  // =========================================================
  D.RANGE = {
    WORLD:    { name: '마을 전체 (World)', radius: 999, order: 3 },
    TOWN:     { name: '생활권 (기본)', radius: 60, order: 2 },
    NEIGHBOR: { name: '집 주변 15m (Neighborhood)', radius: 15, order: 1 },
    HOME:     { name: '집 마당 & 집 안 (Home Area)', radius: 6, order: 0 },
  };
  // 대기/휴식 시간 (초) — 짧음 1~2초 / 보통 3~5초 / 긺 6~10초
  D.IDLE = { short: [1, 2], normal: [3, 5], long: [6, 10] };
  D.BASE_WALK = 1.35; // m/s (속도 0 = 보통 걸음)

  // =========================================================
  // 주민 행동 상태(Behavior State) — 8가지 기본 행동 상태
  // =========================================================
  D.STATES = {
    WALK:         { name: 'WALK / RUN', ko: '걷는 중', desc: '지정한 좌표를 향해 걷거나 달림 (성격에 따라 속도 차이)', items: ['none', 'can', 'snack'] },
    RUN:          { name: 'WALK / RUN', ko: '달리는 중', desc: '지정한 좌표를 향해 걷거나 달림 (성격에 따라 속도 차이)', items: ['none', 'can', 'snack'] },
    SIT_REST:     { name: 'SIT_REST', ko: '앉아서 휴식', desc: '벤치, 의자, 바위, 나무 그늘에 앉아 휴식', items: ['book', 'snack', 'can', 'magnifier'] },
    INTERACT_OBJ: { name: 'INTERACT_OBJ', ko: '물건 만지작', desc: '필드 오브젝트(꽃, 나무, 라디오 등)와 상호작용', items: ['wateringCan', 'stick', 'mic'] },
    WATCH_LOOK:   { name: 'WATCH_LOOK', ko: '구경 중', desc: '멈춰 서서 하늘, 바다, 곤충, 별, 타 주민을 바라봄', items: ['telescope', 'camera', 'magnifier'] },
    TALK_PLAYER:  { name: 'TALK_PLAYER', ko: '나와 대화', desc: '플레이어를 바라보며 대화창 출력 및 풍선 이모티콘 표출', items: ['none'] },
    TALK_NPC:     { name: 'TALK_NPC', ko: '수다 중', desc: '다른 NPC와 마주 보고 2~3초간 수다/손짓/웃음', items: ['drink', 'prop'] },
    HOME_LIFE:    { name: 'HOME_LIFE', ko: '집안일', desc: '자기 집 안에서 요리, 청소, 침대 수면, 인테리어 변경', items: ['spatula', 'broom'] },
    THINKING:     { name: 'THINKING (!)', ko: '고민 중', desc: '머리 위에 고민/하트/먹구름 풍선을 띄우고 서성임', items: ['none'] },
  };

  // 행동 사전: state, pose, prop, 지속(초), 필요한 장소 태그, 이모티콘
  D.ACTIONS = {
    smell_flower:   { name: '꽃향기 맡기', state: 'INTERACT_OBJ', pose: 'crouch', need: 'flowers', emote: '🌸', dur: 5 },
    water_flowers:  { name: '꽃에 물 주기', state: 'INTERACT_OBJ', pose: 'water', prop: 'wateringCan', need: 'flowers', emote: '💧', dur: 6 },
    pull_weeds:     { name: '잡초 뽑기', state: 'INTERACT_OBJ', pose: 'crouch', need: 'flowers', emote: '🌿', dur: 5 },
    watch_sky:      { name: '하늘 바라보기', state: 'WATCH_LOOK', pose: 'lookUp', emote: '☁️', dur: 6 },
    write_poem:     { name: '시 쓰기', state: 'SIT_REST', pose: 'write', prop: 'notebook', emote: '✒️', dur: 8 },
    workout:        { name: '아령 들기', state: 'INTERACT_OBJ', pose: 'lift', prop: 'dumbbell', emote: '💦', dur: 6 },
    stretch:        { name: '스트레칭', state: 'INTERACT_OBJ', pose: 'stretch', emote: '🙆', dur: 4 },
    jog:            { name: '조깅', state: 'RUN', pose: 'jog', dur: 8, move: 'loop' },
    situps:         { name: '윗몸 일으키기', state: 'INTERACT_OBJ', pose: 'situps', emote: '💪', dur: 6 },
    observe_bugs:   { name: '곤충 관찰', state: 'WATCH_LOOK', pose: 'crouch', prop: 'magnifier', need: 'bugs', emote: '🐞', dur: 6 },
    read_book:      { name: '책 읽기', state: 'SIT_REST', pose: 'read', prop: 'book', seat: true, emote: '📖', dur: 9 },
    sketch:         { name: '스케치', state: 'SIT_REST', pose: 'write', prop: 'sketchbook', seat: true, emote: '✏️', dur: 8 },
    fish:           { name: '낚시', state: 'INTERACT_OBJ', pose: 'fish', prop: 'rod', need: 'fish', emote: '🎣', dur: 10 },
    bug_catch:      { name: '곤충 채집', state: 'INTERACT_OBJ', pose: 'swing', prop: 'net', need: 'bugs', emote: '🦋', dur: 6 },
    eat_snack:      { name: '과자 먹기', state: 'SIT_REST', pose: 'eat', prop: 'snack', seat: true, emote: '😋', dur: 6 },
    drink_can:      { name: '캔 음료 마시기', state: 'SIT_REST', pose: 'drink', prop: 'can', seat: true, emote: '🥤', dur: 5 },
    nap:            { name: '낮잠', state: 'SIT_REST', pose: 'lie', seat: true, emote: '💤', dur: 12 },
    lie_shade:      { name: '나무 그늘에 눕기', state: 'SIT_REST', pose: 'lie', need: 'trees', emote: '💤', dur: 12 },
    chat:           { name: '수다 떨기', state: 'TALK_NPC', pose: 'talk', dur: 3, social: true },
    gossip:         { name: '소문 나누기', state: 'TALK_NPC', pose: 'talk', prop: 'magazine', dur: 3, social: true, gossip: true },
    cheer:          { name: '응원하기', state: 'INTERACT_OBJ', pose: 'cheer', emote: '📣', dur: 3 },
    alone_sit:      { name: '혼자 앉아 있기', state: 'SIT_REST', pose: 'sit', seat: true, need: 'quiet', emote: '…', dur: 10 },
    daydream:       { name: '공상하기', state: 'WATCH_LOOK', pose: 'lookUp', emote: '💭', dur: 7 },
    tea:            { name: '티타임', state: 'SIT_REST', pose: 'drink', prop: 'teacup', seat: true, emote: '☕', dur: 7 },
    mirror_check:   { name: '거울 보기', state: 'INTERACT_OBJ', pose: 'mirror', prop: 'handMirror', emote: '✨', dur: 4 },
    polite_bow:     { name: '정중한 인사', state: 'INTERACT_OBJ', pose: 'bow', dur: 2 },
    grumble_kick:   { name: '돌멩이 툭 차기', state: 'INTERACT_OBJ', pose: 'kick', emote: '💢', dur: 3 },
    paint:          { name: '그림 그리기', state: 'INTERACT_OBJ', pose: 'paint', prop: 'brush', emote: '🎨', dur: 8 },
    weird_dance:    { name: '4차원 춤', state: 'INTERACT_OBJ', pose: 'dance', emote: '🌀', dur: 5 },
    fidget:         { name: '안절부절', state: 'THINKING', pose: 'fidget', emote: '💦', dur: 4 },
    check_health:   { name: '건강 체크', state: 'INTERACT_OBJ', pose: 'fidget', prop: 'thermometer', emote: '🌡️', dur: 4 },
    follow_friend:  { name: '친구 따라가기', state: 'WALK', social: true, follow: true, dur: 8 },
    sweep:          { name: '빗자루질', state: 'INTERACT_OBJ', pose: 'sweep', prop: 'broom', emote: '🧹', dur: 6 },
    dust:           { name: '먼지 털기', state: 'INTERACT_OBJ', pose: 'sweep', prop: 'duster', emote: '✨', dur: 5 },
    recycle:        { name: '분리수거', state: 'INTERACT_OBJ', pose: 'crouch', prop: 'bag', emote: '♻️', dur: 5 },
    inspect:        { name: '신기한 것 살펴보기', state: 'WATCH_LOOK', pose: 'crouch', emote: '❓', dur: 3 },
    home_life:      { name: '집에서 뒹굴기', state: 'HOME_LIFE', pose: 'sit', dur: 10, home: true },
    yard_potter:    { name: '마당 서성이기', state: 'WALK', dur: 6, yard: true },
    gaze_far:       { name: '먼 곳 바라보기', state: 'WATCH_LOOK', pose: 'shade', prop: 'telescope', emote: '🔭', dur: 6 },
    hike:           { name: '외딴곳 산책', state: 'WALK', dur: 8, remote: true },
    meddle:         { name: '참견하기', state: 'TALK_NPC', pose: 'talk', dur: 3, social: true, meddle: true },
    stargaze:       { name: '별 보기', state: 'WATCH_LOOK', pose: 'lookUp', prop: 'telescope', emote: '⭐', dur: 8, night: true },
    night_walk:     { name: '밤 산책', state: 'WALK', dur: 8, night: true },
    morning_stretch:{ name: '아침 기지개', state: 'INTERACT_OBJ', pose: 'stretch', emote: '☀️', dur: 4, morning: true },
    ask_wellbeing:  { name: '안부 묻기', state: 'TALK_NPC', pose: 'talk', dur: 3, social: true },
    cute_pose:      { name: '애교 포즈', state: 'INTERACT_OBJ', pose: 'cute', emote: '💕', dur: 2 },
    prank:          { name: '깜짝 놀래키기', state: 'TALK_NPC', pose: 'surprise', dur: 2, social: true, prank: true },
    hide_face:      { name: '얼굴 가리기', state: 'INTERACT_OBJ', pose: 'hideFace', emote: '😳', dur: 3 },
    sing:           { name: '노래 부르기', state: 'INTERACT_OBJ', pose: 'sing', prop: 'mic', emote: '🎵', dur: 6 },
    play_guitar:    { name: '악기 연주', state: 'INTERACT_OBJ', pose: 'guitar', prop: 'guitar', emote: '🎸', dur: 7 },
    listen_radio:   { name: '라디오 듣기', state: 'INTERACT_OBJ', pose: 'sway', need: 'radio', emote: '📻', dur: 7 },
    show_off:       { name: '옷 자랑', state: 'INTERACT_OBJ', pose: 'spin', emote: '👗', dur: 3 },
    candle:         { name: '촛불 켜기', state: 'INTERACT_OBJ', pose: 'crouch', prop: 'candle', emote: '🕯️', dur: 6, night: true },
    fortune:        { name: '운세 보기', state: 'INTERACT_OBJ', pose: 'crystal', prop: 'crystal', emote: '🔮', dur: 5 },
    stick_swing:    { name: '나뭇가지 휘두르기', state: 'INTERACT_OBJ', pose: 'swing', prop: 'stick', emote: '🌿', dur: 4 },
    shake_tree:     { name: '나무 흔들기', state: 'INTERACT_OBJ', pose: 'shake', need: 'trees', emote: '🍎', dur: 3 },
    look_around:    { name: '두리번거리기', state: 'WATCH_LOOK', pose: 'look', dur: 3 },
    sit_bench:      { name: '벤치에서 쉬기', state: 'SIT_REST', pose: 'sit', seat: true, dur: 8 },
    watch_sea:      { name: '바다 바라보기', state: 'WATCH_LOOK', pose: 'look', need: 'sea', emote: '🌊', dur: 7 },
    take_photo:     { name: '사진 찍기', state: 'WATCH_LOOK', pose: 'photo', prop: 'camera', emote: '📸', dur: 3 },
  };
  // 기본 행동 풀 (각 행동 기본 가중치 10) — 키워드마다 고유 행동에 +30 %
  D.BASE_ACTIONS = ['look_around', 'sit_bench', 'watch_sky', 'stretch', 'chat', 'take_photo', 'watch_sea', 'drink_can'];

  // 스마트 오브젝트(Smart Object) 반응 우선순위 — Priority 3 성격 선호 오브젝트
  D.SMART_PREF = {
    ROMANTIC: ['flowers', 'stars', 'hill'],
    ATHLETIC: ['plaza', 'dumbbell', 'gym'],
    LAZY: ['bench', 'cafe', 'food'],
    SCHOLARLY: ['bugs', 'fish', 'books'],
  };
  D.DETECT_R = 6; // 주민 AI 감지 범위 (반경 6m)

  // =========================================================
  // 친구 관계 시스템 (Friendship Specification)
  // =========================================================
  D.FRIEND_STAGES = [
    { id: 'ACQUAINTANCE', name: '어색한 이웃', min: 0, max: 29, unlock: '기본 인사, 정중한 대화만 가능.', face: '어색한 미소, 정중한 어조 ("안녕하세요, OOO님").' },
    { id: 'FRIEND', name: '일반 친구', min: 30, max: 59, unlock: '선물 주기, 별명 만들기, 벤치 같이 앉기 해금.', face: '반가운 표정, 편안한 반말 섞임 ("어, 왔어?").' },
    { id: 'GOOD_FRIEND', name: '친한 친구', min: 60, max: 84, unlock: '무단 집 방문(깜짝 놀러오기), 비밀 고민 상담, 동행 산책.', face: '신나는 표정, 전용 애칭/별명 사용.' },
    { id: 'BEST_FRIEND', name: '절친 (Best Friend)', min: 85, max: 100, unlock: '신혼집/마당 가구 공동 배치, 시그니처 인사법, 전용 보물찾기.', face: '하이파이브, 머리 위 별/반짝이 이모티콘.' },
  ];
  D.FRIEND_ARCH = {
    SOULMATE: { name: '소울메이트형', desc: '말없이 풍경 감상 / 감성 공유·시 쓰기' },
    PARTNER_IN_CRIME: { name: '단짝 공범형', desc: '같이 장난치고 붙어다니는 사이' },
    RIVAL_FRIEND: { name: '악우/라이벌형', desc: '티격태격 승부욕 / "내가 너보단 낫지"' },
    MENTOR: { name: '멘토-멘티형', desc: '지식 전수 및 보호 / "내가 알려줄게!"' },
  };
  // 친밀도 및 신뢰도 수치 변동 트리거
  D.FRIEND_TRIGGERS = {
    greet:   { fp: 2, trust: 1, note: '하루 1회 한정' },
    giftLike: { fp: [5, 10], trust: 3, note: '비선호 선물 시 친밀도 -5' },
    giftDislike: { fp: -5, trust: 0 },
    errand:  { fp: 8, trust: 10, note: '제한시간 내 완수 시 신뢰도 폭등' },
    secret:  { fp: 5, trust: 15, note: '타인에게 비밀 누설 시 신뢰도 -50 (관계 격하)' },
    leak:    { fp: 0, trust: -50 },
    neglect: { fp: -2, trust: 0, note: '3일 이상 무관심/방치 시 하루 -2, 일정 수준 이하로는 하락 방지', floor: 10 },
  };
  D.SIGNATURE_GREETS = [{ id: 'highfive', name: '하이파이브' }, { id: 'hiphop', name: '힙합 인사' }, { id: 'handdance', name: '양손 댄스' }];

  // =========================================================
  // 연애 — 4대 심리 스탯 / 연애 성향 (Love Archetype)
  // =========================================================
  D.LOVE_ARCH = {
    BOLD:     { name: '직진형 (Bold)', desc: '설렘 수치가 50만 넘어도 즉시 고백을 시도함. 실패해도 충격이 짧음.', confessAt: 50, slumpDays: 1 },
    SHY:      { name: '해바라기형 (Shy/Devoted)', desc: '설렘 수치가 90 이상이어야 겨우 용기를 냄. 고백 실패 시 긴 슬럼프에 빠짐.', confessAt: 90, slumpDays: 5 },
    TSUNDERE: { name: '츤데레형 (Tsundere)', desc: '호감도는 높으나 표현을 반대로 함. 플레이어의 개입이 필수적.', confessAt: 999, slumpDays: 3 },
    FREE:     { name: '자유로운 영혼형 (Free-spirit)', desc: '권태기 수치가 빠르게 오르며 여러 주민에게 금방 설렘을 느낌.', confessAt: 75, slumpDays: 2, boredomMul: 1.8, romanceMul: 1.6 },
  };
  D.LOVE_POINTS = {
    BOLD: { ATHLETIC: 3, EXTROVERT: 2, PASSIONATE: 3, CUTE: 1, BUSYBODY: 1, EARLY_BIRD: 1 },
    SHY: { INTROVERT: 3, ANXIOUS: 2, SHY: 3, ROMANTIC: 1, HOMEBODY: 1 },
    TSUNDERE: { CRANKY: 3, CYNICAL: 3, SNOB: 1 },
    FREE: { ARTISTIC: 3, WANDERER: 2, PRANKSTER: 2, DREAMY: 1, CURIOUS: 1 },
  };
  D.CRUSH_STAGES = [
    { id: 'SECRET_CRUSH', name: '혼자 속앓이', min: 60, max: 69, field: '대상 주민이 반경 10m에 있으면 멈춰서서 바라봄(WATCH_LOOK).', mind: '눈이 마주치면 깜짝 놀라 반대 방향으로 걷거나 딴청을 피움.' },
    { id: 'NOTICEABLE', name: '주변 얼씬거리기', min: 70, max: 79, field: '대상 주민의 집 앞 마당이나 자주 가는 장소를 서성임(WALK).', mind: '주변 주민들에게 대상 주민에 관한 이야기를 슬그머니 물어봄.' },
    { id: 'OBSESSED', name: '마음고생 연출', min: 80, max: 89, field: '밤하늘을 보며 한숨을 쉬거나, 혼자 비련의 가사를 끄적임.', mind: '머리 위에 [보라색 음울 풍선]이나 [분홍 하트 핑]을 띄움.' },
    { id: 'CONFESSION_READY', name: '고백 준비', min: 90, max: 100, field: '플레이어에게 달려와 [분홍색 고민 풍선 (!)]을 띄움.', mind: '플레이어의 코칭에 따라 고백 여부를 최종 결정함.' },
  ];
  D.CONFESS_SPOTS = [
    { id: 'beach_sunset', name: '해질녘 바닷가' }, { id: 'sunset_cliff', name: '노을 언덕' },
    { id: 'fountain', name: '광장 분수대' }, { id: 'cafe', name: '카페' },
  ];
  // 질투
  D.JEALOUS_TRIGGERS = {
    talk1on1:   { base: 15, name: '애정 대상이 라이벌과 1:1 대화', mul: { PASSIONATE: 1.5, ATHLETIC: 1.5, LAZY: 0.5, SLOTH: 0.5, CYNICAL: 0.5 } },
    sameBench:  { base: 25, name: '애정 대상과 라이벌이 같은 벤치에 앉음', mul: { ANXIOUS: 1.5, ROMANTIC: 1.3 } },
    rivalGift:  { base: 35, name: '라이벌이 애정 대상에게 선물 전달', mul: { PASSIONATE: 1.5, ATHLETIC: 1.5 } },
    coupleAct:  { base: 50, name: '라이벌과 애정 대상의 커플 행동(손잡기/이모티콘 핑퐁)', mul: {} },
  };
  D.JEALOUS_STAGES = [
    { id: 'AWARE', name: '은근한 신경전', min: 0, max: 39, field: '라이벌과 애정 대상이 대화할 때 distant(반경 5m)에서 뚫어지게 노려봄.', face: '머리 위에 [음울한 먹구름] 표출.' },
    { id: 'COLD_WAR', name: '방해 공작', min: 40, max: 69, field: '둘 사이에 비집고 들어가 기지개를 켜거나, 애정 대상을 다른 곳으로 불러냄.', face: '의도적인 딴청, 비꼬는 대사 출력.' },
    { id: 'OPEN_CONFLICT', name: '직접 대립', min: 70, max: 89, field: '라이벌에게 다가가 손가락질을 하며 말싸움 애니메이션 실행.', face: '머리 위에 [번개/화남 이모티콘].' },
    { id: 'BREAKUP_THREAT', name: '최후통첩', min: 90, max: 100, field: '플레이어에게 달려와 [붉은색 고민 풍선 (!)]을 띄우거나 파트너에게 이별 선언.', face: '극도의 스트레스/눈물 연출.' },
  ];
  D.JEALOUS_TYPES = { PASSIVE_AGGRESSIVE: '은근한 견제', CONFRONTATIONAL: '직접 충돌', DEPRESSIVE: '의기소침/자책' };
  // 권태기
  D.BOREDOM_STAGES = [
    { id: 'STABLE', name: '정상 연애', min: 0, max: 39, field: '손을 잡고 걷거나 마주 보며 하트 이모티콘 표출.', face: '따뜻함, 눈빛 동기화.' },
    { id: 'MILD_BOREDOM', name: '무관심', min: 40, max: 69, field: '같은 공간에 있어도 각자 딴청을 피움(SIT_REST). 손을 잡지 않음.', face: '한숨 이모티콘, 단답형 대사.' },
    { id: 'DANGER', name: '이별 고민', min: 70, max: 89, field: '상대 주민이 접근하면 반대 방향으로 멀어짐(WALK).', face: '머리 위에 [보라색 찌그러진 고민 풍선 (!)].' },
    { id: 'CRITICAL', name: '위기/이별', min: 90, max: 100, field: '상대 주민의 집 앞이나 해질녘 바닷가에서 이별 씬 발동.', face: '눈물, 굳은 표정, 묵음 연출.' },
  ];
  D.BOREDOM_RULES = {
    noDate3: { v: 5, name: '3일 이상 둘만의 데이트 없음 (+5/일)' },
    sameLine5: { v: 10, name: '동일한 대사 패턴 5회 이상 반복 (+10)' },
    unresolved: { v: 15, name: '질투/갈등 미해결 상태 지속 (+15/일)' },
    date: { v: -20, name: '공동 데이트 / 커플 오브젝트 이용 (-20)' },
    coach: { v: -35, name: '플레이어의 연애 코칭/이벤트 성공 (-35)' },
  };
  D.BREAKUP_SPOTS = ['sunset_cliff', 'beach', 'lonely_bench'];

  // =========================================================
  // 결혼 / 육아 / 유전
  // =========================================================
  D.MARRIAGE = { minDatingDays: 14, affection: 95, romance: 80, prepDays: 3, weddingHour: 10, houseLevel: 2 };
  D.PARENT = { afterDays: 14, satisfaction: 80, babyDays: 7, toddlerDays: 14 };
  D.GROWTH = [
    { id: 'BABY', name: '신생아 (BABY)', days: 7, range: '신혼집 안 요람 주변 2m 이내 제한', must: '우유 주기, 요람 흔들기, 자장가 불러주기, 기저귀 교환' },
    { id: 'TODDLER', name: '유아 (TODDLER)', days: 14, range: '신혼집 마당 및 마을 (부모 동행)', must: '아장아장 걷기, 걸음마 교육, 놀이터 가기, 함께 숨바꼭질' },
    { id: 'CHILD', name: '어린이 (CHILD)', days: Infinity, range: '마을 전체 (독립 AI 동작)', must: '곤충 채집/낚시 가르치기, 마을 학교/놀이터 이용, 심부름' },
  ];
  // 어린이기 3번째 성격 개화 조건
  D.THIRD_TRAIT = [
    { key: 'WARM', name: '다정다감 (Warm-hearted)', cond: '육아 충족도 80 이상 + 대화/스킨십 다수', field: '부모나 플레이어를 보면 달려와 안김, 꽃에 물주기.' },
    { key: 'CYNICAL', name: '반항/시니컬 (Rebellious)', cond: '육아 충족도 40 이하 + 방치/울음 지속', field: '말을 걸면 툴툴거림, 길가에 낙서하기, 혼자 있기.' },
    { key: 'CURIOUS', name: '탐구파/호기심 (Inquisitive)', cond: '야외 활동(곤충/낚시/산책) 동행 빈도 높음', field: '돋보기/채집망을 들고 다니며 필드 탐사, 박물관 방문.' },
    { key: 'BUSYBODY', name: '사교파/오지랖 (Outgoing)', cond: '마을 놀이터/타 어린이 NPC와 교류 많음', field: '마을 어린이 모임 주도, 광장에서 미니게임 제안.' },
  ];

  // =========================================================
  // 주민집 — 방 레이어, 테마, 재질
  // =========================================================
  D.ROOM_LAYERS = [
    { id: 'surface', name: '1. 벽면 & 바닥', items: '벽지, 바닥재, 걸레받이, 창문 틀 스타일', ai: '테마에 따라 발걸음 소리가 바뀜 (예: 통나무 바닥 ➔ 삐걱 소리, 대리석 ➔ 또각 소리).' },
    { id: 'rest', name: '2. 휴식 가구', items: '침대, 소파, 안마의자, 해먹', ai: '침대 등급에 따라 수면 시 [꿈 종류]가 달라짐. 안마의자에 앉으면 눈을 뒤집으며 시원해함.' },
    { id: 'work', name: '3. 작업/수납 가구', items: '책상, 옷장, 서랍장, 진열장', ai: '옷장을 열고 혼자 이상한 옷을 대보거나, 책상에서 비밀 일기장을 쓰다 플레이어와 눈이 마주치면 급히 덮음.' },
    { id: 'smart', name: '4. 스마트 오브젝트', items: '노래방 기계, 런닝머신, 트램펄린, 거울', ai: '가구에 접근 시 [특수 액션 AI] 발동. 거울을 보며 근육 자랑을 하거나, 트램펄린에서 지칠 때까지 뜀.' },
    { id: 'wall', name: '5. 벽걸이 & 소품', items: '시계, 액자, 포스터, 식물, 인형', ai: '벽에 걸린 짝사랑 대상의 사진을 뚫어져라 바라보거나, 인형을 안고 혼잣말로 비밀을 털어놓음.' },
    { id: 'light', name: '6. 조명 & 앰비언스', items: '천장 등, 네온사인, 룸 BGM, 효과음', ai: '조명 색상(노을빛, 붉은 네온, 어두움) 변경 및 방 안에서 흐르는 BGM(Lo-Fi, 8-bit, 웅장한 오페라) 설정.' },
  ];
  D.MATERIALS = {
    wood:   { name: '원목(Wood)', color: 0xb07a4a },
    marble: { name: '대리석(Marble)', color: 0xf1eee8 },
    glass:  { name: '투명 글래스(Glass)', color: 0xbfe8ff },
    felt:   { name: '파스텔 펠트(Felt)', color: 0xffc9de },
    neon:   { name: '네온 플라스틱(Neon)', color: 0x39ffb0 },
    rust:   { name: '녹슨 메탈(Rust)', color: 0x9a5a36 },
    gold:   { name: '골드(Gold)', color: 0xffcf3a },
    jelly:  { name: '말랑 젤리(Jelly)', color: 0xff7ac0 },
  };
  D.LIGHT_COLORS = {
    warm: { name: '따뜻한 조명', color: 0xfff1d6 }, sunset: { name: '노을빛', color: 0xffa060 }, neon: { name: '붉은 네온', color: 0xff3a6a }, dark: { name: '어두움', color: 0x30304a }, cool: { name: '형광등', color: 0xe8f4ff },
    // 동적 방 분위기 — 메인 성격(Layer 1)별 조명 톤
    rosy: { name: '노을빛 스팟 조명', color: 0xffb8a0, k: 1.0 },
    bright: { name: '강렬한 하이라이트', color: 0xffffff, k: 1.35 },
    study: { name: '서재형 눈부심 방지 조명', color: 0xfff0d2, k: 0.85 },
    mood: { name: '주황빛 무드등', color: 0xffb468, k: 0.8 },
    party: { name: '미러볼 & 네온 반사', color: 0xff5fd0, k: 1.1, fx: 'party' },
    dim: { name: '낮은 암막형 감성 조명', color: 0xffe0c0, k: 0.5 },
    chandelier: { name: '은은한 샹들리에', color: 0xffe2a0, k: 1.0 },
    redneon: { name: '붉은 네온 앰비언스', color: 0xff4a4a, k: 0.9, fx: 'flicker' },
    holo: { name: '4차원 홀로그램', color: 0xb49cff, k: 1.0, fx: 'holo' },
    pastel: { name: '파스텔 수면등', color: 0xd8e8ff, k: 0.7 },
  };
  // =========================================================
  // 동적 방 분위기 생성 시스템
  //  최종 방 분위기 = 메인 성격(베이스 색상/조명) + 특이 취향(벽지 무늬/파티클/앰비언스)
  // =========================================================
  D.ATMO_L1 = {
    ROMANTIC: { name: '낭만파', palette: [0xf7b8c8, 0xffd3b0], pname: '로즈 핑크 & 웜 피치', light: 'rosy', tone: '파스텔 감성의 따뜻하고 포근한 노을빛 스팟 조명' },
    ATHLETIC: { name: '운동파', palette: [0xffa050, 0x4fb8ff], pname: '비비드 오렌지 & 에너제틱 네온 블루', light: 'bright', tone: '시야가 명확하고 활력 넘치는 강렬한 하이라이트 조명' },
    SCHOLARLY: { name: '탐구파', palette: [0x3f6e56, 0x2f3f6a], pname: '딥 그리너리 & 클래식 네이비', light: 'study', tone: '눈이 편안한 서재형 차분한 눈부심 방지 조명' },
    LAZY: { name: '미식/휴식파', palette: [0xf3e3c8, 0xffe79a], pname: '크림 베이지 & 버터 옐로우', light: 'mood', tone: '나른하고 오순도순한 은은한 주황빛 무드등' },
    EXTROVERT: { name: '사교파', palette: [0xffe14a, 0xff4fb0], pname: '팝 옐로우 & 파티 마젠타', light: 'party', tone: '시끌벅적하고 화려한 미러볼 및 네온사인 반사 조명' },
    INTROVERT: { name: '내향파', palette: [0x5a5a62, 0xb8b4ae], pname: '스모키 묵빛 & 아늑한 무채색', light: 'dim', tone: '조용하고 안락한 낮은 암막형 감성 조명' },
    SNOB: { name: '명예/신사파', palette: [0x7a2238, 0xd4a73a], pname: '클래식 버건디 & 딥 로열 골드', light: 'chandelier', tone: '고급스럽고 품격 있는 은은한 샹들리에형 조명' },
    CRANKY: { name: '반항/츤데레파', palette: [0x4a4a52, 0xa8443a], pname: '빈티지 다크 그레이 & 브릭 레드', light: 'redneon', tone: '날카로우면서도 분위기 있는 붉은 네온 앰비언스' },
    ARTISTIC: { name: '예술/엉뚱파', palette: [0x8a5ad8, 0x9ff0e0], pname: '사이키델릭 바이올렛 & 오로라 파스텔', light: 'holo', tone: '몽환적이고 기상천외한 4차원 홀로그램 조명' },
    ANXIOUS: { name: '걱정/심약파', palette: [0xbfeedd, 0xa8c8f0], pname: '파스텔 민트 & 세레니티 블루', light: 'pastel', tone: '시각적 자극을 줄여주는 정서 안정용 파스텔 수면등' },
  };
  D.ATMO_L4 = {
    GARDEN: { name: '원예', pattern: 'vine', pname: '덩굴 & 플로럴 그리너리', particle: 'leaves', sound: 'crickets', sname: '싱그러운 풀벌레 소리' },
    FOOD: { name: '미식', pattern: 'dessert', pname: '디저트 & 음료 격자 무늬', particle: 'steam', sound: 'sizzle', sname: '달콤한 김 & 고소한 냄새' },
    STUDY: { name: '독서/공부', pattern: 'books', pname: '양장본 책장 & 클래식 문서', particle: null, sound: 'pages', sname: '종이 넘기는 소리' },
    FISHING: { name: '낚시/채집', pattern: 'waves', pname: '잔물결 & 수중 무늬', particle: 'caustic', sound: 'surf', sname: '잔잔한 파도 소리' },
    FASHION: { name: '패션', pattern: 'chevron', pname: '모던 스트라이프 & 셰브론', particle: 'sparkle', sound: 'chime', sname: '반짝이는 소리' },
    MUSIC: { name: '음악', pattern: 'vinyl', pname: '음표 & 바이닐 LP & 음파', particle: 'notes', sound: 'hum', sname: '룸 BGM 음질 향상 & 미러볼' },
    GOSSIP: { name: '연애/수다', pattern: 'hearts', pname: '레터링 & 하트 실루엣', particle: 'hearts', sound: 'twinkle', sname: '하트 핑 소리' },
    CLEAN: { name: '청결', pattern: 'grid', pname: '깨끗한 격자 타일 & 빗살', particle: 'shine', sound: 'fresh', sname: '상쾌한 청결 효과음' },
    OCCULT: { name: '주술/운세', pattern: 'sacred', pname: '신성기하학 & 별자리', particle: 'galaxy', sound: 'drone', sname: '몽환적인 은하수 소리' },
    FITNESS: { name: '운동기구', pattern: 'track', pname: '굵은 사선 스포티 라인 & 트랙', particle: null, sound: 'beat', sname: '파이팅 넘치는 비트' },
  };
  D.ATMO_PATTERNS = Object.fromEntries(Object.values(D.ATMO_L4).map(a => ['p_' + a.pattern, a.pname]));
  D.ROOM_BGM = { lofi: 'Lo-Fi', chip: '8-bit', opera: '웅장한 오페라', healing: '힐링', none: '없음' };
  D.FLOOR_SOUND = { wood: '삐걱', log: '삐걱', marble: '또각', tile: '톡톡', carpet: '사박', metal: '텅텅', candy: '말랑', water: '찰박', sand: '사각', mat: '폭신' };

  // 10대 대표 스타일 테마 + 인테리어 티켓 테마
  // aff: 성격/취향 키워드별 선호도 (+ 좋아함, - 싫어함)
  D.THEMES = {
    modern:   { name: '모던', cat: '티켓', wall: 0xeef1f4, floor: 'tile', floorColor: 0xd8dde3, light: 'cool', bgm: 'lofi',
      furn: ['sofa_modern', 'coffee_round', 'tv', 'floor_lamp', 'plant_monstera', 'bed_basic', 'desk'], aff: { SNOB: 1, INTROVERT: 1, CLEAN: 2, ARTISTIC: -1 },
      act: '소파에 앉아 모던하게 TV 보기' },
    princess: { name: '공주님 분홍 파티룸', cat: '티켓', wall: 0xffc6de, floor: 'carpet', floorColor: 0xffa6c9, light: 'warm', bgm: 'opera',
      furn: ['bed_canopy', 'vanity_mirror', 'heart_sofa', 'chandelier', 'plush_bear', 'cake_table'], aff: { ROMANTIC: 3, CUTE: 2, FASHION: 1, CRANKY: -2, ATHLETIC: -1 },
      dance: '캐노피 침대에 누워 하트를 날림', act: '캐노피 침대에 누워 하트 날리기' },
    spaceship:{ name: '우주선', cat: '티켓', wall: 0x1c2240, floor: 'metal', floorColor: 0x55607a, light: 'cool', bgm: 'chip',
      furn: ['cockpit', 'capsule_bed', 'hologram', 'space_window', 'robot'], aff: { SCHOLARLY: 2, CURIOUS: 2, ARTISTIC: 1, ANXIOUS: -1 },
      act: '조종석에 앉아 우주선 조종하는 척', dress: 'space' },
    party:    { name: '파티룸', cat: '티켓', wall: 0x6a3cff, floor: 'tile', floorColor: 0x3a2a70, light: 'neon', bgm: 'chip',
      furn: ['mirrorball', 'karaoke', 'dj_booth', 'balloon', 'sofa_modern'], aff: { EXTROVERT: 3, PASSIONATE: 2, MUSIC: 2, INTROVERT: -2, SHY: -1 },
      act: '미러볼 아래에서 혼자 파티' },
    gym:      { name: '체육관', cat: '티켓', wall: 0xdfe6ea, floor: 'mat', floorColor: 0x3a8fd8, light: 'cool', bgm: 'chip',
      furn: ['treadmill', 'sandbag', 'dumbbell_rack', 'mirror_full', 'trampoline', 'bench_press'], aff: { ATHLETIC: 3, FITNESS: 3, PASSIONATE: 1, LAZY: -2, SLOTH: -2 },
      dance: '샌드백을 치며 기뻐하고, 바닥에서 윗몸일으키기를 함', act: '샌드백 치기, 윗몸일으키기' },
    cyberpunk:{ name: '싸이버펑크 네온룸', cat: '티켓', wall: 0x14101f, floor: 'metal', floorColor: 0x221a33, light: 'neon', bgm: 'chip',
      furn: ['neon_sign', 'glass_chair', 'arcade_cab', 'hologram', 'bed_basic'], aff: { ARTISTIC: 2, NIGHT_OWL: 2, CURIOUS: 1, SHY: -3, ANXIOUS: -3, INTROVERT: -1 },
      worst: '눈이 부시다며 눈을 가리고 방 구석에 주저앉음', act: '네온 불빛 아래 게임하기' },
    // [현실 & 감성]
    scandi:   { name: '스칸디나비아 모던', cat: '현실 & 감성', wall: 0xf6efe4, floor: 'wood', floorColor: 0xd9b88a, light: 'warm', bgm: 'healing',
      furn: ['round_table_wood', 'plant_monstera', 'floor_lamp', 'armchair_knit', 'bed_basic', 'bookshelf'], aff: { INTROVERT: 2, SCHOLARLY: 1, CLEAN: 1, SNOB: 1, WARM: 1 },
      act: '차를 마시며 잡지를 읽는 차분한 모션, 힐링 BGM 출력', dress: 'knit' },
    hanok:    { name: '전통 고즈넉 한옥', cat: '현실 & 감성', wall: 0xf1e2c4, floor: 'wood', floorColor: 0xc99760, light: 'warm', bgm: 'healing',
      furn: ['daecheong', 'byeongpung', 'brass_bowls', 'calligraphy_desk', 'ibul'], aff: { SNOB: 2, FORMAL: 2, INTROVERT: 1, SCHOLARLY: 1, PASSIONATE: -1 },
      act: '한복을 입고 가부좌를 틀고 앉아 정좌 명상을 하거나 시를 읊음', dress: 'hanbok' },
    lp80s:    { name: '80s 앤티크 LP 룸', cat: '현실 & 감성', wall: 0x8a3a2a, floor: 'wood', floorColor: 0x6a4028, light: 'sunset', bgm: 'lofi',
      furn: ['turntable', 'retro_sofa_red', 'typewriter', 'wall_amp', 'record_shelf'], aff: { MUSIC: 3, ROMANTIC: 1, DREAMY: 2, ARTISTIC: 1 },
      act: 'LP판을 교체하며 감성에 젖고, 고풍스러운 타자기를 침', dress: 'retro' },
    // [판타지 & SF]
    aquarium: { name: '심해 아쿠아리움', cat: '판타지 & SF', wall: 0x1f6fb0, floor: 'water', floorColor: 0x2a8fc0, light: 'cool', bgm: 'healing',
      furn: ['coral_bed', 'sub_window', 'fish_tank', 'shell_chair', 'kelp'], aff: { FISHING: 3, DREAMY: 2, SCHOLARLY: 1, ANXIOUS: -1 },
      act: '주민이 잠수모를 쓰고 천천히 헤엄치는 동작을 취함 (물방울 소리)', dress: 'diving', line: '쿨럭... 가끔은 육지의 흙냄새가 그리워.',
      set: '방 안 전체에 물결 잔영 빛 효과(Caustics)가 일고 은은한 심해 음향 출력.' },
    space:    { name: '우주 전진 기지', cat: '판타지 & SF', wall: 0x111633, floor: 'metal', floorColor: 0x3a4466, light: 'cool', bgm: 'chip',
      furn: ['cockpit', 'capsule_bed', 'hologram', 'space_window', 'oxygen_tank'], aff: { SCHOLARLY: 2, CURIOUS: 2, OCCULT: 1, NIGHT_OWL: 1 },
      act: '무중력 상태처럼 방 안을 둥둥 떠다니며 조종간을 조작함', dress: 'space',
      set: '방 안의 중력이 50% 감소하여 주민과 오브젝트가 살짝 공중에 떠다님.' },
    candy:    { name: '헨젤과 그레텔 과자의 집', cat: '판타지 & SF', wall: 0xffd6a8, floor: 'candy', floorColor: 0xff9ec0, light: 'warm', bgm: 'chip',
      furn: ['choco_bed', 'candy_chair', 'cupcake_table', 'jelly_sofa', 'lollipop'], aff: { FOOD: 3, LAZY: 2, CUTE: 2, CLEAN: -1 },
      act: '가구를 몰래 한 입씩 갉아먹다가 입가에 크림을 묻히고 웃음', dress: 'baker', line: '이 벽지는 딸기 맛일까? (할짝)' },
    // [병맛 & 이색] (친구모아 갬성)
    prison:   { name: '최첨단 비밀 감옥', cat: '병맛 & 이색', wall: 0x8c9096, floor: 'tile', floorColor: 0x6a6e74, light: 'cool', bgm: 'chip',
      furn: ['jail_bars', 'chain_bunk', 'metal_table', 'cctv', 'toilet'], aff: { CRANKY: 1, PRANKSTER: 2, ARTISTIC: 1, SNOB: -3, ANXIOUS: -2 },
      act: '죄수복을 입고 팔굽혀펴기를 하거나 철창을 잡고 흔들며 억울해함', dress: 'prisoner', line: '난 죄가 없다! 단지 너무 귀여웠을 뿐...' },
    wrestling:{ name: '프로레슬링 사각링', cat: '병맛 & 이색', wall: 0x2a2a3a, floor: 'mat', floorColor: 0x2f6fd8, light: 'neon', bgm: 'opera',
      furn: ['ring_ropes', 'belt_display', 'spot_light', 'bench_press'], aff: { ATHLETIC: 3, PASSIONATE: 2, FITNESS: 1, SHY: -2, INTROVERT: -1 },
      act: '주민이 로프 반동을 이용해 방 안을 튕겨 다니며 프로레슬링 포즈를 취함', dress: 'wrestler' },
    construction: { name: '위험천만 공사장', cat: '병맛 & 이색', wall: 0xd7c08a, floor: 'tile', floorColor: 0x9a8f80, light: 'warm', bgm: 'chip',
      furn: ['mixer', 'cones', 'excavator_bed', 'styrofoam', 'scaffold'], aff: { DILIGENT: 2, ATHLETIC: 1, PRANKSTER: 1, CLEAN: -2, SNOB: -2 },
      act: '안전모를 쓰고 망치질을 하거나, 바닥에 스티로폼을 깔고 잠듦', dress: 'worker',
      set: '주민이 방에 들어올 때마다 "안전 제일!"을 외치며 안전모를 착용함.' },
    bath:     { name: '거대 바스 킹덤 (욕실)', cat: '병맛 & 이색', wall: 0xcff0ff, floor: 'water', floorColor: 0xffffff, light: 'cool', bgm: 'healing',
      furn: ['giant_tub', 'rubber_duck', 'bubbles', 'towel_rack', 'shower'], aff: { CLEAN: 3, LAZY: 2, PRANKSTER: 1, CYNICAL: -1 },
      act: '목욕가운을 입고 바닥 비누 거품에서 미끄러지며 슬라이딩 기행', dress: 'robe' },
  };
  D.THEME_REACT = [
    { lv: 100, id: 'LOVE', name: '💖 대만족 (100%)', text: '공중부양 댄스 + "이거 완전 내 꿈의 방이야!"', note: '(거주 만족도 MAX, 플레이어 친밀도 폭등)' },
    { lv: 70, id: 'LIKE', name: '😄 만족 (70%)', text: '신나서 가구를 하나씩 터치하며 리액션 모션 취함' },
    { lv: 40, id: 'MEH', name: '😐 보통 (40%)', text: '"음... 나쁘진 않네." 하며 고개를 갸웃거림' },
    { lv: 0, id: 'HATE', name: '😱 최악 (0%)', text: '바닥에 쓰러져 통곡 + "제발 예전 방으로 돌려줘!"', note: '(우울 수치 상승, 밤에 불 끄고 구석에 앉아있음)' },
  ];
  D.DRESSCODE = {
    hanbok: '한복', prisoner: '죄수복', worker: '작업복과 안전모', diving: '잠수모', space: '우주복', wrestler: '레슬링 복장', robe: '목욕가운',
    knit: '니트', retro: '레트로 룩', baker: '파티시에 복장', suit: '정장', formal: '포멀 하객 의상', swim: '수영복/튜브', pajama: '잠옷',
    bride: '웨딩드레스', groom: '턱시도', patient: '환자복', uniform: '어린이 교복', leather: '괴상한 가죽 자켓', couple: '커플 룩', tux: '턱시도 (설거지 알바)',
  };
  // 스타일 템플릿 마켓 (Style Blueprint Gallery) — 다른 플레이어가 꾸민 레전드 방
  D.BLUEPRINTS = [
    { id: 'pcbang90', name: '완벽한 90년대 PC방', by: '레트로섬 주민', theme: 'cyberpunk', extra: ['arcade_cab', 'desk', 'desk', 'glass_chair', 'neon_sign', 'cup_ramen'] },
    { id: 'magic', name: '해리포터 마법방 (마법 학교 기숙사 풍)', by: '호그섬 주민', theme: 'lp80s', extra: ['canopy_bed_red', 'bookshelf', 'candle_stand', 'crystal_ball', 'owl_cage'] },
    { id: 'cafe', name: '감성 카페 원룸', by: '브런치섬 주민', theme: 'scandi', extra: ['espresso', 'round_table_wood', 'plant_monstera'] },
    { id: 'dojo', name: '한밤의 도장', by: '무도섬 주민', theme: 'hanok', extra: ['sandbag', 'byeongpung', 'calligraphy_desk'] },
  ];

  // =========================================================
  // 아이템 (플레이어 가방 / 상점)
  // tags: 선물 선호 판정용
  // =========================================================
  D.ITEMS = {
    // 선물/음식
    rose:        { name: '장미 한 송이', icon: '🌹', price: 120, tags: ['flower', 'romance'], shop: 'mall' },
    tulip:       { name: '튤립 화분', icon: '🌷', price: 150, tags: ['flower', 'plant'], shop: 'mall' },
    cookie:      { name: '수제 쿠키', icon: '🍪', price: 80, tags: ['food', 'snack'], shop: 'conv', stamina: 15 },
    kimbap:      { name: '삼각김밥', icon: '🍙', price: 50, tags: ['food'], shop: 'conv', stamina: 20 },
    can:         { name: '캔 음료', icon: '🥤', price: 40, tags: ['food', 'snack'], shop: 'conv', stamina: 10 },
    sandwich:    { name: '샌드위치', icon: '🥪', price: 90, tags: ['food'], shop: 'cafe', stamina: 25 },
    souffle:     { name: '수플레 팬케이크', icon: '🥞', price: 180, tags: ['food', 'luxury', 'snack'], shop: 'cafe', stamina: 30 },
    espresso:    { name: '에스프레소', icon: '☕', price: 70, tags: ['tea', 'luxury'], shop: 'cafe', stamina: 10 },
    jujube_tea:  { name: '대추차', icon: '🍵', price: 60, tags: ['tea'], shop: 'tea', stamina: 15 },
    udon:        { name: '포장마차 우동', icon: '🍜', price: 100, tags: ['food'], shop: 'pocha', stamina: 35 },
    lunchbox:    { name: '수제 도시락', icon: '🍱', price: 0, tags: ['food', 'romance'], stamina: 50 },
    stamina_food:{ name: '고급 회복 음식', icon: '🍲', price: 300, tags: ['food', 'luxury'], shop: 'mall', stamina: 80 },
    book:        { name: '소설책', icon: '📕', price: 200, tags: ['book'], shop: 'library' },
    poem_book:   { name: '시집', icon: '📘', price: 220, tags: ['book', 'poem', 'romance'], shop: 'library' },
    magnifier:   { name: '돋보기', icon: '🔍', price: 250, tags: ['science', 'book'], shop: 'mall' },
    rod:         { name: '낚싯대', icon: '🎣', price: 400, tags: ['fishing'], shop: 'mall', tool: 'fish' },
    net:         { name: '잠자리채', icon: '🥅', price: 350, tags: ['fishing', 'science'], shop: 'mall', tool: 'bug' },
    dumbbell:    { name: '아령', icon: '🏋️', price: 300, tags: ['sport'], shop: 'mall' },
    protein:     { name: '단백질 쉐이크', icon: '🥛', price: 150, tags: ['sport', 'food'], shop: 'conv', stamina: 25 },
    sunglasses:  { name: '선글라스', icon: '🕶️', price: 500, tags: ['fashion', 'luxury'], shop: 'mall' },
    necklace:    { name: '진주 목걸이', icon: '📿', price: 900, tags: ['luxury', 'fashion'], shop: 'mall' },
    record:      { name: 'LP 레코드', icon: '💿', price: 350, tags: ['music'], shop: 'mall' },
    guitar:      { name: '통기타', icon: '🎸', price: 800, tags: ['music'], shop: 'mall' },
    candle:      { name: '향초', icon: '🕯️', price: 120, tags: ['occult', 'tea'], shop: 'mall' },
    crystal:     { name: '수정 구슬', icon: '🔮', price: 600, tags: ['occult', 'weird'], shop: 'mall' },
    plush:       { name: '곰 인형', icon: '🧸', price: 280, tags: ['plush', 'romance'], shop: 'mall' },
    art_weird:   { name: '기묘한 조각상', icon: '🗿', price: 450, tags: ['art', 'weird'], shop: 'flea' },
    clean_kit:   { name: '청소 세트', icon: '🧽', price: 180, tags: ['clean'], shop: 'mall' },
    magazine:    { name: '연예 잡지', icon: '📰', price: 60, tags: ['romance', 'party'], shop: 'conv' },
    party_popper:{ name: '파티 폭죽', icon: '🎉', price: 100, tags: ['party'], shop: 'conv' },
    bug_jar:     { name: '곤충 표본', icon: '🦋', price: 0, tags: ['science', 'fishing'] },
    fish_catch:  { name: '갓 잡은 물고기', icon: '🐟', price: 0, tags: ['fishing', 'food'] },
    rare_fruit:  { name: '희귀 과일', icon: '🍑', price: 0, tags: ['food', 'luxury'] },
    // 관계 전용
    bouquet:     { name: '고백의 꽃다발', icon: '💐', price: 1500, tags: ['flower', 'romance'], shop: 'mall', special: 'confess' },
    ring:        { name: '약혼반지', icon: '💍', price: 8000, tags: ['luxury', 'romance'], shop: 'mall', special: 'propose' },
    feather:     { name: '청혼의 깃털', icon: '🪶', price: 5000, tags: ['romance'], shop: 'workshop', special: 'propose' },
    apology_gift:{ name: '화해의 선물', icon: '🎁', price: 400, tags: ['romance', 'food'], shop: 'mall', special: 'apology' },
    apology_letter:{ name: '사과 편지', icon: '💌', price: 30, tags: [], shop: 'conv', special: 'apology' },
    claw_plush: { name: '뽑기 인형', icon: '🧸', price: 120, tags: ['cute', 'romance'] },
    claw_plush_rare: { name: '레어 유니콘 인형', icon: '🦄', price: 400, tags: ['cute', 'romance', 'luxury'] },
    special_gift:{ name: '특별한 선물', icon: '💝', price: 700, tags: ['romance', 'luxury'], shop: 'mall', special: 'special' },
    love_letter: { name: '러브레터', icon: '💌', price: 0, tags: ['romance'], quest: true },
    poem_secret: { name: '비밀 시집', icon: '📗', price: 0, tags: ['romance', 'poem'], quest: true },
    handmade:    { name: '수제 선물', icon: '🎀', price: 0, tags: ['romance'], quest: true },
    invitation:  { name: '청첩장', icon: '✉️', price: 0, tags: [], quest: true },
    wedding_flowers: { name: '식장 장식 꽃', icon: '💮', price: 0, tags: [], quest: true },
    medicine_kid:{ name: '어린이용 약', icon: '💊', price: 250, tags: ['medicine'], shop: 'pharmacy', special: 'kidmed' },
    medicine:    { name: '종합 감기약', icon: '💊', price: 150, tags: ['medicine'], shop: 'pharmacy' },
    float_pill:  { name: '3분 공중 부양 약', icon: '🎈', price: 777, tags: ['weird'], shop: 'pharmacy', special: 'float' },
    rabbit_apple:{ name: '토끼 모양 사과', icon: '🍎', price: 0, tags: ['food', 'romance'] },
    // 툴/티켓
    vacuum:      { name: '신(God)의 청소기', icon: '🌀', price: 0, tool: 'vacuum' },
    truth_tea:   { name: '진실만을 말하게 하는 홍차', icon: '🫖', price: 600, shop: 'cafe', special: 'truth' },
    wish_coin:   { name: '소원 동전', icon: '🪙', price: 100, shop: 'conv', special: 'wish' },
    auto_ticket: { name: '주민 자율 인테리어 티켓', icon: '🎟️', price: 1200, shop: 'mall', special: 'autoInterior' },
    time_capsule:{ name: '타임캡슐', icon: '⏳', price: 0, quest: true },
    face_copy:   { name: '얼굴 복사 종이', icon: '📄', price: 0, tags: ['weird', 'art'] },
    dream_item:  { name: '꿈속 가품', icon: '🌈', price: 0, tags: ['weird'] },
  };
  // 테마별 인테리어 티켓 자동 생성
  for (const [id, t] of Object.entries(D.THEMES)) {
    D.ITEMS['ticket_' + id] = { name: `인테리어 티켓: ${t.name}`, icon: '🎫', price: 900, shop: 'mall', special: 'ticket', theme: id };
  }
  D.FLEA_ITEMS = [
    { name: '누군가 씹던 껌 세트', icon: '🫧', price: 5000 }, { name: '이상한 모양의 돌멩이', icon: '🪨', price: 1200 },
    { name: '한쪽만 남은 양말', icon: '🧦', price: 300 }, { name: '반쯤 녹은 초', icon: '🕯️', price: 150 },
    { name: '기우뚱 의자', icon: '🪑', price: 800 }, { name: '누군가의 일기장 (빈 칸)', icon: '📓', price: 450 },
  ];

  // =========================================================
  // 엉뚱 질병 / 꿈 / 뉴스
  // =========================================================
  D.DISEASES = ['엉뚱 댄스 멈춤 불가증', '하트 모양 눈꺼풀 경련', '딸꾹질 무지개 증후군', '말끝마다 노래하는 병', '거꾸로 걷기 열병'];
  D.DREAMS = {
    basic: [{ id: 'giant', name: '거인화되어 섬을 부수는 꿈' }, { id: 'fried', name: '음식이 되어 튀겨지는 꿈' }],
    fancy: [{ id: 'giant', name: '거인화되어 섬을 부수는 꿈' }, { id: 'fried', name: '음식이 되어 튀겨지는 꿈' }, { id: 'fly', name: '구름 위를 나는 꿈' }, { id: 'star', name: '별똥별을 줍는 꿈' }],
  };
  D.DREAM_LOOT = ['꿈속 무지개 조각', '말하는 베개', '거인의 발자국', '바삭한 튀김옷', '별 부스러기', '구름 솜사탕'];
  D.SOAPBOX = ['오이 피클은 사실 음모다!', '비둘기는 사실 정부의 드론이다!', '월요일을 폐지하라!', '양말은 짝이 안 맞아야 자유다!', '분수대 물은 사실 사이다다!'];
  D.COMPLAINTS = ['옆집 주민이 내 꿈에 나와서 춤춘 것을 처벌해달라', '달이 너무 밝아서 잠을 못 잔다', '비둘기가 나를 째려본다', '내 그림자가 나보다 빠르다'];
  D.NICK_REQUESTS = ['피자의 지배자', '우주 최강 귀요미', '섬의 전설', '낮잠 챔피언', '사랑의 전도사'];
  D.GUESTBOOK_POEMS = ['사랑은 차갑고... 찻잔은 따뜻하다...', '너 없는 섬은 소금 없는 바다...', '달빛이 내 마음을 우려낸다...', '이별은 식은 대추차 같아...'];

  // 월급 / 경제
  D.ECON = { payMin: 100, payMax: 300, rent: 60, startCoins: 5000, allowanceMin: 1000, allowanceMax: 5000 };
  D.WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

  // 플레이어 이모티콘
  D.EMOTES = ['👋', '😊', '😢', '😡', '❤️', '❓', '🎵', '💤'];
  D.PET_NAMES = ['자기야', '내 사랑', '대장님', '여보', '내 반쪽', '귀염둥이', '햇살'];
})();
