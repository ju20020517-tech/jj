/* =========================================================
 *  섬 구조 — '중심 방사형 + 계단식 고저차(Radial & Tiered)' 메가 아일랜드
 *  남쪽 바다(0m) ➔ 남쪽 공공지구(2m) ➔ 중앙/동/서(6m) ➔ 북쪽 고지대(30m)
 *  좌표: x = 동(+)/서(-), z = 남(+)/북(-), 단위 1 = 1m
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM;

  const DISTRICTS = {
    CORE:  { name: '중앙 코어 관찰 구역', short: '중앙', color: '#ffb84d', desc: '관찰과 일상의 교차점' },
    NORTH: { name: '북쪽 고지대 랜드마크', short: '북쪽', color: '#b48cff', desc: '서사의 클라이맥스 (Elev 30m)' },
    WEST:  { name: '서쪽 프라이빗 커스텀 주거 지구', short: '서쪽', color: '#6fcf7f', desc: '힐링, 지식, 커스텀' },
    EAST:  { name: '동쪽 24시 메가 번화가', short: '동쪽', color: '#ff6fb5', desc: '소비, 유흥, 갈등' },
    SOUTH: { name: '남쪽 공공 & 워터프론트', short: '남쪽', color: '#4fc1e9', desc: '직장, 행정, 휴양 (Elev 0m)' },
  };

  // ---------------------------------------------------------
  // 장소 (bld: 건물 외형, door: 출입문, interior: 실내 id, spots: 행동 지점)
  // spot: [x, z, tags, opts]  opts.seat = 앉는 곳, opts.face = 바라보는 방향(rad)
  // ---------------------------------------------------------
  const P = {};
  const place = (id, o) => { P[id] = Object.assign({ id, tags: [], spots: [] }, o); };

  // ===== 중앙 코어 =====
  place('apartment', { name: '5층 메가 아파트 "시티 타워"', district: 'CORE', x: 0, z: -15,
    bld: { type: 'apartment', w: 30, d: 11, h: 17 }, door: [0, -9], tags: ['home'],
    desc: '모든 주민이 섬에 처음 이주했을 때 입주하는 5층, 20호실 규모의 주거 관찰 전용 타워' });
  place('apt_yard', { name: '아파트 앞 마당', district: 'CORE', x: 0, z: -5, r: 14, tags: ['yard', 'flowers', 'bench'],
    spots: [[-12, -5, ['flowers']], [12, -5, ['flowers']], [-7, -3.5, ['bench'], { seat: true, face: 0 }], [7, -3.5, ['bench'], { seat: true, face: 0 }], [-16, -2, ['trees']], [16, -2, ['trees']]] });
  place('plaza', { name: '중앙 분수대 & 커뮤니티 광장', district: 'CORE', x: 0, z: 10, r: 14, tags: ['plaza', 'fountain', 'bench', 'pigeons', 'party'],
    spots: [[0, 4.5, ['fountain'], { face: 0 }], [-4, 10, ['fountain'], { face: Math.PI / 2 }], [4, 10, ['fountain'], { face: -Math.PI / 2 }],
      [7, 16, ['soapbox']], [-9, 5, ['bench'], { seat: true, face: Math.PI / 2 }], [9, 5, ['bench'], { seat: true, face: -Math.PI / 2 }],
      [-9, 15, ['bench'], { seat: true, face: Math.PI / 2 }], [9, 15, ['bench'], { seat: true, face: -Math.PI / 2 }],
      [-6, 19, ['pigeons']], [0, 18, ['plaza', 'dumbbell']], [-3, 2, ['plaza']], [3, 18, ['plaza']]],
    desc: '아파트 바로 아래 펼쳐진 이탈리아식 대리석 광장' });
  place('cafe', { name: '올데이 브런치 테라스 "카페 앙상블"', district: 'CORE', x: 25, z: 6,
    bld: { type: 'cafe', w: 10, d: 7, h: 5, color: 0xfff4e6 }, door: [25, 9.6], interior: 'cafe_in', tags: ['cafe', 'food', 'gossip'],
    spots: [[20, 13.5, ['cafe', 'bench'], { seat: true, face: Math.PI / 2 }], [22.4, 13.5, ['cafe', 'bench'], { seat: true, face: -Math.PI / 2 }],
      [27, 13.5, ['cafe', 'bench'], { seat: true, face: Math.PI / 2 }], [29.4, 13.5, ['cafe', 'bench'], { seat: true, face: -Math.PI / 2 }],
      [20, 17.5, ['cafe', 'bench'], { seat: true, face: Math.PI / 2 }], [22.4, 17.5, ['cafe', 'bench'], { seat: true, face: -Math.PI / 2 }],
      [27, 17.5, ['cafe', 'bench'], { seat: true, face: Math.PI / 2 }], [29.4, 17.5, ['cafe', 'bench'], { seat: true, face: -Math.PI / 2 }]],
    desc: '섬 안에서 일어난 온갖 연애 사건과 소문이 가장 먼저 모이고 확산되는 소문 발산지' });
  place('metro', { name: '센트럴 메트로 환승 지하철역', district: 'CORE', x: -20, z: 29,
    bld: { type: 'station', w: 12, d: 7, h: 5 }, door: [-20, 25.2], tags: ['station', 'bench'],
    spots: [[-25, 23, ['bench', 'station'], { seat: true, face: 0 }], [-15, 23, ['bench', 'station'], { seat: true, face: 0 }], [-13, 27, ['lostfound']]],
    desc: '동, 서, 남, 북으로 이동하는 모든 주민이 반드시 거쳐 가는 대중교통 허브' });
  place('studio', { name: '친구모아 중앙 전광판 & 방송 스튜디오', district: 'CORE', x: 20, z: 29,
    bld: { type: 'studio', w: 12, d: 7, h: 14 }, door: [20, 25.2], interior: 'studio_in', tags: ['news'],
    spots: [[14, 22, ['news']], [18, 21, ['news']], [22, 21, ['news']]],
    desc: '광장 중앙 마천루 벽면에 걸린 거대 LED 전광판과 그 뒤의 방송 스튜디오' });
  place('stairs', { name: '노을 언덕 & 대성당 연결 진입로', district: 'CORE', x: 0, z: -30, tags: ['stairs'] });

  // ===== 북쪽 고지대 =====
  place('bridge', { name: '아찔한 은하수 구름다리', district: 'NORTH', x: 0, z: -50, tags: ['bridge'],
    spots: [[0, -50, ['bridge']]], desc: '고지대와 하부 주거/상업 구역을 잇는 유일한 도보 통로' });
  place('cliff', { name: '노을 정원 & 맹세의 가제보', district: 'NORTH', x: -74, z: -92, r: 12, tags: ['hill', 'stars', 'confess', 'breakup', 'quiet', 'garden', 'romance'],
    spots: [[-79.9, -89.6, ['bench', 'hill', 'sunset'], { seat: true, face: -Math.PI / 2 }], [-79.9, -94.4, ['bench', 'hill', 'sunset'], { seat: true, face: -Math.PI / 2 }],
      [-73.25, -91.55, ['bench', 'gazebo'], { seat: true, face: -Math.PI / 2 }], [-73.25, -92.45, ['bench', 'gazebo'], { seat: true, face: -Math.PI / 2 }],
      [-69.5, -87.2, ['hill', 'flowers']], [-78.5, -96.8, ['hill', 'flowers']], [-68.2, -85.6, ['fountain', 'flowers']], [-80.8, -92, ['hill', 'sunset']], [-74, -99.9, ['bridge', 'hill']],
      ...[[-70.0, -89.1, 180], [-64.2, -89.1, 180], [-70.0, -94.9, 0], [-64.2, -94.9, 0], [-76.6, -86.4, 90], [-71.4, -86.4, -90], [-76.6, -96.9, 90], [-71.4, -96.9, -90]].map(([x, z, r]) => [x, z, ['bench', 'park'], { seat: true, face: r * Math.PI / 180 }])],
    desc: '해 질 녘(18:00~19:00)에만 주변이 짙은 주황색과 보라색 그라데이션으로 물드는 곳' });
  place('cliff_lawn', { name: '절벽 아래 잔디밭', district: 'NORTH', x: -98, z: -92, tags: ['lawn'], spots: [[-98, -92, ['lawn']]] });
  place('cathedral', { name: '축복의 마블 대성당 & 비밀 서약 정원', district: 'NORTH', x: 12, z: -90,
    bld: { type: 'cathedral', w: 20, d: 24, h: 16 }, door: [12, -77.6], interior: 'cathedral_in', tags: ['wedding', 'flowers'],
    spots: [[-8, -80, ['flowers', 'garden'], { face: 0 }], [-12, -84, ['bench', 'garden'], { seat: true, face: Math.PI / 2 }], [12, -70, ['wedding']], [26, -82, ['belltower']]],
    desc: '섬 주민들의 연인 수치가 MAX에 달했을 때 화려한 주말 결혼식이 열리는 성스러운 장소' });
  place('observatory', { name: '별빛 천문대 & 심야 낭만 캠핑장', district: 'NORTH', x: 70, z: -96,
    bld: { type: 'observatory', w: 14, d: 14, h: 12 }, door: [70, -88.6], interior: 'obs_in', tags: ['stars', 'quiet'],
    spots: [[60, -86, ['stars', 'telescope']], [52, -80, ['campfire', 'bench'], { seat: true, face: 0 }], [56, -78, ['campfire', 'bench'], { seat: true, face: -Math.PI / 2 }], [50, -76, ['campfire', 'bench'], { seat: true, face: Math.PI / 2 }], [46, -86, ['stars']]],
    desc: '밤 22시 이후 은하수가 가장 선명하게 보이는 고지대 꼭대기' });
  place('waterfall', { name: '망각의 수련 폭포', district: 'NORTH', x: -40, z: -50, tags: ['waterfall', 'quiet', 'fish'],
    spots: [[-40, -54.5, ['waterfall_under']], [-35, -48, ['fish', 'quiet']], [-45, -47, ['quiet', 'bench'], { seat: true, face: Math.PI }]],
    desc: '절벽 한 켠에서 엄청난 수압으로 쏟아져 내리는 폭포와 그 아래 얕은 연못', hub: 'W' });

  // ===== 서쪽 프라이빗 주거 지구 =====
  // 커스텀 빌라 & 신혼집 단지 — 독채 4필지 + 신혼/절친 대형 획지 4필지
  const PLOTS = [
    { id: 'villa1', size: 'small', x: -62, z: -30, doorSide: 1 }, { id: 'villa2', size: 'small', x: -80, z: -30, doorSide: 1 },
    { id: 'villa3', size: 'small', x: -98, z: -30, doorSide: 1 }, { id: 'villa4', size: 'small', x: -116, z: -30, doorSide: 1 },
    { id: 'villa5', size: 'large', x: -62, z: -3, doorSide: -1 }, { id: 'villa6', size: 'large', x: -82, z: -3, doorSide: -1 },
    { id: 'villa7', size: 'large', x: -102, z: -3, doorSide: -1 }, { id: 'villa8', size: 'large', x: -120, z: -3, doorSide: -1 },
    // 해변 코티지 마을 (동쪽 바닷가 골목) · 남쪽 해안 주택가 · 서쪽 해변 타운하우스 — 주민 30명 + 아이들이 자라서 독립할 집
    { id: 'villa9', size: 'small', x: 58, z: 69, doorSide: 1, ext: 'cottage', area: '해변 코티지' }, { id: 'villa10', size: 'small', x: 70, z: 69, doorSide: 1, ext: 'beach', area: '해변 코티지' },
    { id: 'villa11', size: 'small', x: 82, z: 69, doorSide: 1, ext: 'cottage', area: '해변 코티지' }, { id: 'villa12', size: 'small', x: 64, z: 81, doorSide: -1, ext: 'beach', area: '해변 코티지' },
    { id: 'villa13', size: 'small', x: 76, z: 81, doorSide: -1, ext: 'cottage', area: '해변 코티지' },
    { id: 'villa14', size: 'large', x: -79, z: 78, doorSide: -1, ext: 'euro', area: '바닷가 타운하우스' }, { id: 'villa15', size: 'large', x: -65, z: 78, doorSide: -1, ext: 'tudor', area: '바닷가 타운하우스' },
    { id: 'villa16', size: 'large', x: -26, z: 77, doorSide: -1, ext: 'euro', area: '해안 주택가' }, { id: 'villa17', size: 'small', x: -12, z: 77, doorSide: -1, ext: 'tudor', area: '해안 주택가' },
    { id: 'villa18', size: 'small', x: 14, z: 77, doorSide: -1, ext: 'beach', area: '해안 주택가' }, { id: 'villa19', size: 'small', x: 24, z: 77, doorSide: -1, ext: 'cottage', area: '해안 주택가' },
  ];
  for (const pl of PLOTS) {
    const dz = pl.size === 'small' ? 4.6 : 5.6;
    place(pl.id, { name: `${pl.area || '커스텀 빌라'} ${pl.id.slice(5)}번지`, district: +pl.id.slice(5) > 8 ? (pl.x > 40 ? 'EAST' : pl.x < -40 ? 'WEST' : 'SOUTH') : 'WEST', x: pl.x, z: pl.z, plot: pl,
      bld: { type: 'villa', w: pl.size === 'small' ? 8 : 11, d: pl.size === 'small' ? 7 : 9, h: 6 }, door: [pl.x, pl.z + pl.doorSide * dz], interior: pl.id + '_in',
      tags: ['home', 'villa'], spots: [[pl.x + 5.5, pl.z + pl.doorSide * 6.5, ['yard', 'flowers']], [pl.x - 5.5, pl.z + pl.doorSide * 6.5, ['yard', 'bench'], { seat: true, face: 0 }]] });
  }
  place('home_p', { name: '플레이어의 집', district: 'WEST', x: -46.5, z: -31, bld: { type: 'villa', w: 9, d: 7, h: 6, player: true }, door: [-46.5, -26.4], interior: 'home_p_in',
    tags: ['home'], spots: [[-41.5, -24, ['yard', 'mailbox']], [-51.5, -24, ['yard', 'bench'], { seat: true, face: 0 }]] });
  place('park', { name: '센트럴 파크 & 비밀의 숲', district: 'WEST', x: -86, z: 22, r: 22, tags: ['park', 'flowers', 'trees', 'bench', 'bugs'],
    spots: [[-80, 20, ['lawn', 'flowers']], [-86, 14, ['lawn']], [-101, 13, ['hammock'], { seat: true, lie: true, face: 0 }], [-106, 17, ['hammock'], { seat: true, lie: true, face: 0 }],
      [-70, 13, ['swing', 'couple'], { seat: true, face: Math.PI }], [-72, 13, ['swing', 'couple'], { seat: true, face: Math.PI }],
      [-88, 33, ['stream', 'fish', 'quiet']], [-78, 34, ['stream', 'quiet'], { seat: true, face: Math.PI }],
      [-62, 28, ['pets']], [-118, 22, ['forest', 'bugs', 'quiet']], [-112, 28, ['forest', 'trees']],
      [-95, 26, ['boat', 'couple']], [-84, 25, ['lawn', 'stage']], [-92, 10, ['trees', 'bugs']]],
    desc: '단지 한가운데 펼쳐진 거대한 자연 친화적 공원' });
  place('playground', { name: '마을 놀이터', district: 'WEST', x: -74, z: 47.5, tags: ['playground', 'kids'],
    spots: [[-76, 47.5, ['playground']], [-72, 49.5, ['playground']], [-70, 45.5, ['playground']], [-78, 51.5, ['playground', 'bench'], { seat: true, face: 0 }]] });
  place('school', { name: '섬 어린이 학교', district: 'WEST', x: -54, z: 46, bld: { type: 'school', w: 12, d: 8, h: 6 }, door: [-54, 50.6], interior: 'school_in', tags: ['school', 'kids'] });
  place('library', { name: '시립 도서관 & 힐링 북카페', district: 'WEST', x: -100, z: 52, bld: { type: 'library', w: 16, d: 12, h: 12 }, door: [-100, 58.6], interior: 'library_in', tags: ['books', 'quiet', 'museum'],
    desc: '3층 높이의 중정 통유리 건물 (1층 앤티크 북카페, 2층 정숙 열람실, 3층 거대 서가 벽면, 자연사 전시실)' });
  place('workshop', { name: '마을 공방 & 플리마켓 마당', district: 'WEST', x: -72, z: 58, bld: { type: 'workshop', w: 11, d: 8, h: 6 }, door: [-72, 62.6], interior: 'workshop_in', tags: ['workshop', 'flea'],
    spots: [[-78, 68, ['flea']], [-72, 68, ['flea']], [-66, 68, ['flea']]], desc: '주민들이 가구나 소품을 직접 만들고, 쓰던 물건을 자갈 마당에 나와 파는 곳' });
  place('teahouse', { name: '앤티크 심야 찻집 "달빛 차관"', district: 'WEST', x: -92, z: 72, bld: { type: 'teahouse', w: 10, d: 8, h: 5 }, door: [-92, 67.4], interior: 'tea_in', tags: ['tea', 'quiet'],
    desc: '서쪽 골목 구석, 덩굴식물로 둘러싸인 목조 건물' });

  // ===== 동쪽 24시 메가 번화가 =====
  place('skylounge', { name: '80층 스카이라운지 파인 다이닝 "네뷸라"', district: 'EAST', x: 90, z: -16, bld: { type: 'skyscraper', w: 14, d: 14, h: 72 }, door: [90, -8.6], interior: 'sky_in', tags: ['fancy', 'confess'],
    desc: '번화가 한가운데 솟은 마천루 꼭대기의 최고급 코스 요리 레스토랑' });
  place('mall', { name: '메가 쇼핑몰 & 스타일 뷰티 살롱 "플래티넘 타워"', district: 'EAST', x: 64, z: 16, bld: { type: 'mall', w: 18, d: 13, h: 16 }, door: [64, 22.6], interior: 'mall_in', tags: ['mall', 'fashion'],
    spots: [[62, 27, ['popup']], [66, 27, ['popup']], [70, 27, ['popup']]], desc: '패션 브랜드, 모자/액세서리 숍, 트렌디 미용실이 모여있는 소비의 성지' });
  place('arcade', { name: '네온 오락실 & 24시 볼링장 "네온 스파크"', district: 'EAST', x: 102, z: 16, bld: { type: 'arcade', w: 16, d: 13, h: 8 }, door: [102, 22.6], interior: 'arcade_in', tags: ['arcade', 'gym'],
    desc: '승부욕이 강한 주민들의 자존심 싸움터' });
  place('sushi', { name: '미식 골목: 24시 회전초밥', district: 'EAST', x: 60, z: 50, bld: { type: 'restaurant', w: 10, d: 8, h: 5, color: 0xf4e1c1 }, door: [60, 45.6], interior: 'sushi_in', tags: ['food'] });
  place('pub', { name: '미식 골목: 레트로 차이니스 펍', district: 'EAST', x: 78, z: 52, bld: { type: 'restaurant', w: 10, d: 8, h: 5, color: 0xc93a2a }, door: [78, 47.6], interior: 'pub_in', tags: ['food'] });
  place('club', { name: '올나잇 라이브 클럽 & K-POP 무대 "더 베이스먼트"', district: 'EAST', x: 102, z: 50, bld: { type: 'club', w: 10, d: 8, h: 4 }, door: [102, 45.6], interior: 'club_in', tags: ['party', 'stage'],
    desc: '밤 22시가 되면 네온사인이 가장 밝게 빛나는 지하 클럽' });
  place('conv', { name: '24시 편의점', district: 'EAST', x: 46, z: 36, bld: { type: 'shop', w: 8, d: 6, h: 4, color: 0x7ad0a0 }, door: [46, 32.6], interior: 'conv_in', tags: ['food'] });
  place('alley', { name: '미식 골목', district: 'EAST', x: 69, z: 44, tags: ['food'], spots: [[69, 44, ['lantern']]] });

  // ===== 남쪽 공공 & 워터프론트 =====
  place('office', { name: '메가 오피스 타워 & 테라스 탕비실', district: 'SOUTH', x: -24, z: 56, bld: { type: 'office', w: 16, d: 12, h: 34 }, door: [-15.6, 56], doorFace: 'east', interior: 'office_in', tags: ['office'],
    desc: '섬 주민들이 평일 낮(09:00~18:00) 정장을 입고 출근하여 일하고 월급(City Coin)을 버는 마천루' });
  place('cityhall', { name: '시티 행정 복합 센터 & 법원', district: 'SOUTH', x: -44, z: 72, bld: { type: 'cityhall', w: 18, d: 10, h: 10 }, door: [-44, 67.6], doorFace: 'north', interior: 'hall_in', tags: ['cityhall'],
    desc: '주민들의 공식적인 신분 변화, 민원 신청, 갈등 조정이 이루어지는 행정의 중심지' });
  place('medical', { name: '메디컬 센터 & 24시 약국', district: 'SOUTH', x: 36, z: 62, bld: { type: 'hospital', w: 18, d: 12, h: 16 }, door: [36, 68.6], interior: 'med_in', tags: ['medical'],
    desc: '주민들의 건강을 책임지는 종합병원' });
  place('beach', { name: '에메랄드 해수욕장 & 워터프론트 데크', district: 'SOUTH', x: -36, z: 90, r: 26, tags: ['beach', 'sea', 'confess', 'breakup'],
    spots: [[-30, 93, ['sand', 'sea']], [-50, 92.5, ['sand', 'sea']], [-24, 94, ['sand', 'sea']], [-40, 86, ['sunbed'], { seat: true, lie: true, face: Math.PI }], [-34, 86, ['sunbed'], { seat: true, lie: true, face: Math.PI }],
      [-28, 86, ['sunbed'], { seat: true, lie: true, face: Math.PI }], [-62, 90, ['sea', 'quiet']], [-4, 88, ['deck', 'sea', 'bench'], { seat: true, face: Math.PI }], [4, 88, ['deck', 'sea']],
      // 비치발리볼 코트 (그물 x=-17)
      [-20.5, 91, ['beachball', 'volley'], { face: Math.PI / 2 }], [-13.5, 91, ['volley'], { face: -Math.PI / 2 }],
      // 라이프가드 타워 · 모닥불 · 서핑 렌탈 · 카바나
      [-46, 88.4, ['lifeguard', 'sea']], [-56.6, 91.6, ['campfire', 'bench'], { seat: true, face: Math.PI / 2 }], [-51.4, 91.6, ['campfire', 'bench'], { seat: true, face: -Math.PI / 2 }],
      [-54, 89.0, ['campfire', 'bench'], { seat: true, face: 0 }], [-66, 87.5, ['surf', 'sea']], [32, 92.2, ['sunbed', 'cabana'], { seat: true, lie: true, face: Math.PI }],
      [38, 92.2, ['sunbed', 'cabana'], { seat: true, lie: true, face: Math.PI }], [44, 92.2, ['sunbed', 'cabana'], { seat: true, lie: true, face: Math.PI }], [-8, 95, ['sand', 'castle']]],
    desc: '하얀 모래사장과 에메랄드빛 바다가 펼쳐진 휴양 스폿 — 비치발리볼 코트, 라이프가드 타워, 모닥불, 서핑 렌탈, 카바나' });
  place('beachbar', { name: '코코넛 비치 바', district: 'SOUTH', x: 22, z: 88, bld: { type: 'beachbar', w: 7, d: 4, h: 4 }, door: [22, 90.6], tags: ['beach', 'sea', 'food', 'cafe'],
    spots: [[19.6, 91.6, ['beachbar', 'bench'], { seat: true, face: Math.PI }], [21.2, 91.6, ['beachbar', 'bench'], { seat: true, face: Math.PI }], [22.8, 91.6, ['beachbar', 'bench'], { seat: true, face: Math.PI }],
      [24.4, 91.6, ['beachbar', 'bench'], { seat: true, face: Math.PI }], [16.2, 94, ['beachbar', 'bench', 'sea'], { seat: true, face: 0 }], [27.8, 94, ['beachbar', 'bench', 'sea'], { seat: true, face: 0 }]],
    desc: '야자잎 지붕 아래 코코넛 칵테일과 스무디를 파는 해변 바. 밤엔 전구가 켜진다' });
  place('ferry', { name: '페리 터미널 & 심야 해풍 포장마차', district: 'SOUTH', x: 52, z: 86, bld: { type: 'terminal', w: 12, d: 7, h: 6 }, door: [52, 89.6], tags: ['sea', 'ferry'],
    spots: [[52, 96, ['deck', 'sea']], [55, 102, ['deck', 'sea']], [40, 80, ['pocha', 'bench'], { seat: true, face: 0 }], [42, 80, ['pocha', 'bench'], { seat: true, face: 0 }], [38, 80, ['pocha', 'bench'], { seat: true, face: 0 }], [70, 94, ['lighthouse', 'sea']]],
    desc: '외부 세계(다른 플레이어의 섬)와 연결되는 통로이자, 붉은 천막 아래 밤 깊은 대화를 나누는 곳' });

  // ===== 새 명소 (온천 · 사진관 · 버스킹 · 텃밭 · 마츠리 · 낚시 부두) =====
  const R90 = Math.PI / 2;
  place('onsen', { name: '달맞이 노천 온천 "츠키미유"', district: 'NORTH', x: -30, z: -92, bld: { type: 'onsen', w: 16, d: 12, h: 7 }, door: [-30, -85.4], interior: 'onsen_in', tags: ['onsen', 'quiet', 'heal'],
    spots: [[-45.4, -90.6, ['onsen', 'bath'], { face: R90 }], [-43.2, -93.6, ['onsen', 'bath'], { face: Math.PI * 0.8 }], [-46.6, -93.4, ['onsen', 'bath'], { face: R90 * 0.5 }], [-42.6, -90.2, ['onsen', 'bath'], { face: -R90 }],
      [-39.8, -85.2, ['onsen', 'bench'], { seat: true, face: 0 }], [-21, -84.4, ['onsen', 'bench', 'quiet'], { seat: true, face: 0 }]],
    desc: '고지대 숲속, 달을 올려다보며 몸을 담그는 노천탕과 목조 대욕장 · 붉은 연회장' });
  place('photo', { name: '추억 사진관 "포토 블루"', district: 'CORE', x: -28, z: 3, bld: { type: 'photostudio', w: 10, d: 8, h: 6 }, door: [-28, 7.6], interior: 'photo_in', tags: ['photo'],
    spots: [[-32.4, 9.2, ['photo', 'bench'], { seat: true, face: 0 }]], desc: '네이비 & 화이트 외관의 사진관. 주민과 함께 표정 · 포즈를 골라 사진을 찍고 앨범에 모아요' });
  place('busk', { name: '버스킹 무대 "블루 하모니"', district: 'SOUTH', x: 17, z: 58, r: 8, tags: ['busk', 'music', 'stage', 'party'],
    spots: [[17, 56.2, ['busk', 'stage'], { face: 0 }], [14.6, 56.4, ['busk_piano', 'stage'], { seat: true, face: 0 }], [12.8, 61.6, ['busk_seat', 'bench'], { seat: true, face: Math.PI }], [17, 62.2, ['busk_seat', 'bench'], { seat: true, face: Math.PI }],
      [21.2, 61.6, ['busk_seat', 'bench'], { seat: true, face: Math.PI }], [11.2, 58.6, ['busk_crowd'], { face: R90 }], [22.8, 58.6, ['busk_crowd'], { face: -R90 }]],
    desc: '하얀 회벽과 파란 줄무늬 차양의 산토리니풍 무대. 역 앞이라 오가는 주민이 발걸음을 멈춰요' });
  place('farm', { name: '주민 텃밭 "초록 손"', district: 'WEST', x: -115, z: 50, r: 7, tags: ['farm', 'garden', 'quiet'],
    spots: [[-117.6, 46.4, ['farm'], { face: 0 }], [-112.4, 46.4, ['farm'], { face: 0 }], [-117.6, 49.4, ['farm'], { face: 0 }], [-112.4, 49.4, ['farm'], { face: 0 }],
      [-117.6, 52.4, ['farm'], { face: 0 }], [-112.4, 52.4, ['farm'], { face: 0 }], [-115, 55.6, ['farm', 'bench'], { seat: true, face: Math.PI }]],
    desc: '나무 상자 텃밭 6칸 · 허수아비 · 공구 창고. 씨앗을 심고 물을 주면 며칠 뒤 수확해요' });
  place('matsuri', { name: '여름 축제 마츠리 광장', district: 'EAST', x: 96, z: 35, r: 12, tags: ['matsuri', 'festival', 'party', 'food'],
    spots: [[89.2, 31.2, ['yatai', 'food'], { face: Math.PI }], [94.6, 31.2, ['yatai', 'food'], { face: Math.PI }], [106.2, 31.2, ['yatai', 'food'], { face: Math.PI }], [89.2, 39.4, ['yatai', 'food'], { face: 0 }],
      [96, 33.6, ['drum'], { face: 0 }], [91, 35, ['fireworks'], { face: Math.PI }], [93.5, 36.8, ['fireworks'], { face: Math.PI }], [99, 37, ['fireworks'], { face: Math.PI }], [101.6, 35, ['fireworks'], { face: Math.PI }],
      [86.8, 35.4, ['matsuri', 'bench'], { seat: true, face: R90 }], [105.2, 39.2, ['matsuri', 'bench'], { seat: true, face: -R90 }]],
    desc: '붉은 도리이 · 붉은 격자 울타리 · 야구라 북 · 노점과 초롱 줄. 밤엔 불꽃놀이!' });
  place('fishpier', { name: '낚시 대회 부두 "은빛 바늘"', district: 'SOUTH', x: -76, z: 98, tags: ['fish', 'sea', 'derby', 'quiet'],
    spots: [[-77.9, 93, ['fish', 'sea', 'derby'], { face: -R90 }], [-74.1, 95, ['fish', 'sea', 'derby'], { face: R90 }], [-77.9, 98, ['fish', 'sea', 'derby'], { face: -R90 }], [-74.1, 100, ['fish', 'sea', 'derby'], { face: R90 }],
      [-79.4, 108.4, ['fish', 'sea', 'derby'], { face: 0 }], [-76, 109.4, ['fish', 'sea', 'derby'], { face: 0 }], [-72.6, 108.4, ['fish', 'sea', 'derby'], { face: 0 }], [-73, 105.4, ['derby_board'], { face: -R90 }]],
    desc: '바다로 길게 뻗은 나무 부두. 토요일엔 낚시 대회가 열려 가장 큰 물고기를 낚은 주민이 우승!' });

  // ---------------------------------------------------------
  // 지하철 (별 모양 노선: 중앙 환승역 ↔ 각 지구 출구)
  // ---------------------------------------------------------
  // 해변 시설 충돌 (원형)
  const BEACH_SOLIDS = [{ x: -46, z: 90.6, r: 1.5, id: 'lifeguard' }, { x: -54, z: 91.6, r: 0.9, id: 'bonfire' }, { x: -66, z: 85, r: 2.2, id: 'surfshack' }];

  const STATIONS = {
    C: { name: '센트럴 환승역', x: -20, z: 24, district: 'CORE' },
    N: { name: '북쪽 고지대역', x: 30, z: -66, district: 'NORTH' },
    W: { name: '서쪽 주거단지역', x: -48, z: 32, district: 'WEST' },
    E: { name: '동쪽 번화가역', x: 48, z: 0, district: 'EAST' },
    S: { name: '남쪽 해안역', x: 14, z: 48, district: 'SOUTH' },
  };

  // ---------------------------------------------------------
  // 길 찾기 그래프 (도로 교차점)
  // ---------------------------------------------------------
  const N = {
    // 중앙
    c_apt: [0, -7], c_agw: [-10, -4], c_age: [10, -4], c_pl: [0, 1], c_plw: [-13, 10], c_ple: [13, 10], c_pls: [0, 21],
    c_cafe: [20, 11], c_metro: [-20, 22], c_news: [20, 22], c_s: [0, 38], c_w: [-34, 10], c_e: [34, 10], c_n: [0, -22], c_nt: [0, -40], c_nw1: [-17.5, -7], c_nw2: [-17.5, -22.5], c_ne1: [17.5, -7], c_ne2: [17.5, -22.5],
    // 북쪽
    n_b: [0, -60], n_c: [12, -66], n_cd: [12, -75], n_g: [-8, -76], n_w: [-36, -66], n_wf: [-40, -61], n_cl: [-61, -92], n_e: [40, -72],
    n_metro: [30, -69], n_tower: [26, -80], n_ce: [24, -75], n_camp: [52, -82], n_obs: [66, -86],
    // 협곡 / 절벽 아래 저지대
    g_pond: [-40, -47], g_mid: [-72, -48], g_w: [-104, -48], l_lawn: [-98, -80],
    // 서쪽
    w_e: [-46, 10], w_metro: [-48, 28], w_home: [-42, -18], w_vs0: [-52, -17], w_vs1: [-71, -17], w_vs2: [-90, -17], w_vs3: [-109, -17], w_vs4: [-122, -17],
    w_park: [-80, 18], w_ham: [-100, 17], w_swing: [-71, 16], w_lake: [-92, 24], w_pet: [-62, 26], w_forest: [-114, 24], w_stream: [-82, 30],
    w_play: [-72, 38], w_school: [-54, 54], w_lib: [-100, 62], w_work: [-72, 65], w_flea: [-72, 69], w_tea: [-92, 64], w_s: [-44, 53], w_n: [-107, -38], w_ps: [-63, 53], w_wk: [-63.5, 65], w_gap: [-92, 6],
    // 동쪽
    e_w: [46, 10], e_metro: [48, 4], e_sky: [90, -6], e_mall: [64, 25], e_arc: [102, 25], e_conv: [46, 30], e_alley: [69, 42], e_sushi: [60, 43],
    e_pub: [78, 45], e_club: [102, 43], e_s: [46, 52], e_mid: [80, 6], e_mw: [54, 6], e_am: [76, 26], e_ar: [90, 27], e_cs: [52.5, 38], e_cn: [51, 30.5], e_md: [47.5, 71],
    // 남쪽
    s_n: [0, 48], s_metro: [14, 46], s_off: [-12, 56], s_hall: [-44, 64], s_med: [36, 71], s_mid: [0, 70], s_deck: [0, 84], s_beach: [-30, 84], s_beachw: [-58, 84],
    s_pocha: [40, 78], s_ferry: [52, 92], s_light: [66, 92], s_hallE: [-20, 70], s_fw: [44.5, 92], s_hw: [-56.5, 64],
    s_bar: [22, 84], s_pier: [-76, 85.2], n_onsen: [-30, -80], c_photo: [-28, 10], s_busk: [17, 53.5], w_farm: [-113, 60], e_matsuri: [96, 28], s_volley: [-17, 86], s_camp: [-54, 87.5], s_cot0: [47.5, 75.2], s_cot1: [64, 75.2], s_cot2: [80, 75.2], s_hbeach: [-72, 72.5], s_cen: [0, 75],
  };
  const E = [
    // 중앙 십자
    ['c_apt', 'c_agw'], ['c_apt', 'c_age'], ['c_apt', 'c_pl'], ['c_agw', 'c_plw'], ['c_age', 'c_ple'], ['c_pl', 'c_plw'], ['c_pl', 'c_ple'], ['c_plw', 'c_pls'], ['c_ple', 'c_pls'],
    ['c_ple', 'c_cafe'], ['c_pls', 'c_metro'], ['c_pls', 'c_news'], ['c_pls', 'c_s'], ['c_plw', 'c_w'], ['c_ple', 'c_e'], ['c_cafe', 'c_e'],
    ['c_agw', 'c_nw1'], ['c_nw1', 'c_nw2'], ['c_nw2', 'c_n'], ['c_age', 'c_ne1'], ['c_ne1', 'c_ne2'], ['c_ne2', 'c_n'], ['c_n', 'c_nt'], ['c_nt', 'n_b'],
    // 북쪽
    ['n_b', 'n_c'], ['n_c', 'n_cd'], ['n_b', 'n_g'], ['n_g', 'n_cd'], ['n_g', 'n_w'], ['n_w', 'n_wf'], ['n_w', 'n_cl'], ['n_c', 'n_metro'], ['n_metro', 'n_e'], ['n_cd', 'n_ce'], ['n_ce', 'n_tower'],
    ['n_tower', 'n_e'], ['n_e', 'n_camp'], ['n_camp', 'n_obs'],
    // 협곡 / 저지대 (서쪽에서 진입)
    ['w_n', 'g_w'], ['g_w', 'g_mid'], ['g_mid', 'g_pond'], ['g_w', 'l_lawn'],
    // 서쪽
    ['c_w', 'w_e'], ['w_e', 'w_metro'], ['w_e', 'w_home'], ['w_home', 'w_vs0'], ['w_vs0', 'w_vs1'], ['w_vs1', 'w_vs2'], ['w_vs2', 'w_vs3'], ['w_vs3', 'w_vs4'], ['w_vs3', 'w_n'],
    ['w_e', 'w_swing'], ['w_swing', 'w_park'], ['w_park', 'w_ham'], ['w_park', 'w_lake'], ['w_lake', 'w_forest'], ['w_ham', 'w_forest'], ['w_park', 'w_stream'], ['w_metro', 'w_pet'],
    ['w_pet', 'w_stream'], ['w_stream', 'w_play'], ['w_metro', 'w_play'], ['w_play', 'w_ps'], ['w_ps', 'w_s'], ['w_metro', 'w_s'], ['w_s', 'w_school'], ['w_ps', 'w_wk'], ['w_wk', 'w_work'], ['w_work', 'w_flea'], ['w_flea', 'w_lib'],
    ['w_lib', 'w_tea'], ['w_flea', 'w_tea'], ['w_s', 's_hall'], ['w_vs1', 'w_swing'], ['w_vs2', 'w_gap'], ['w_gap', 'w_park'],
    // 동쪽
    ['c_e', 'e_w'], ['e_w', 'e_metro'], ['e_metro', 'e_sky'], ['e_w', 'e_mw'], ['e_mw', 'e_mid'], ['e_mid', 'e_sky'], ['e_mid', 'e_am'], ['e_am', 'e_mall'], ['e_mid', 'e_ar'], ['e_ar', 'e_arc'], ['e_am', 'e_ar'], ['e_w', 'e_conv'], ['e_conv', 'e_mall'],
    ['e_mall', 'e_alley'], ['e_arc', 'e_club'], ['e_alley', 'e_sushi'], ['e_alley', 'e_pub'], ['e_pub', 'e_club'], ['e_conv', 'e_cn'], ['e_cn', 'e_cs'], ['e_cs', 'e_s'], ['e_sushi', 'e_cs'], ['e_s', 'e_md'], ['e_md', 's_med'],
    // 남쪽
    ['c_s', 's_n'], ['s_n', 's_metro'], ['s_n', 's_off'], ['s_n', 's_mid'], ['s_off', 's_hallE'], ['s_hallE', 's_hall'], ['s_hallE', 's_mid'], ['s_mid', 's_med'], ['s_mid', 's_deck'],
    ['s_deck', 's_beach'], ['s_beach', 's_beachw'], ['s_deck', 's_pocha'], ['s_pocha', 's_fw'], ['s_fw', 's_ferry'], ['s_ferry', 's_light'], ['s_metro', 's_mid'], ['s_hall', 's_hw'], ['s_hw', 's_beachw'],
    ['s_deck', 's_bar'], ['s_beachw', 's_pier'], ['s_pier', 's_camp'], ['n_w', 'n_onsen'], ['n_onsen', 'n_g'], ['c_plw', 'c_photo'], ['c_photo', 'c_w'], ['s_metro', 's_busk'], ['s_busk', 's_mid'], ['w_lib', 'w_farm'], ['e_ar', 'e_matsuri'], ['e_matsuri', 'e_arc'], ['s_bar', 's_pocha'], ['s_deck', 's_volley'], ['s_volley', 's_beach'], ['s_beachw', 's_camp'], ['s_camp', 's_beach'],
    ['e_md', 's_cot0'], ['s_pocha', 's_cot0'], ['s_cot0', 's_cot1'], ['s_cot1', 's_cot2'], ['w_flea', 's_hbeach'], ['s_hbeach', 's_hw'], ['s_mid', 's_cen'], ['s_cen', 's_deck'],
  ];

  // 각 장소가 속한 지하철 구역(가장 가까운 역)
  const HUB = { CORE: 'C', NORTH: 'N', WEST: 'W', EAST: 'E', SOUTH: 'S' };
  for (const p of Object.values(P)) if (!p.hub) p.hub = HUB[p.district];

  FM.MAP = { DISTRICTS, P, PLOTS, BEACH_SOLIDS, STATIONS, N, E, HUB, SIZE: { minX: -140, maxX: 140, minZ: -130, maxZ: 115 } };
})();
