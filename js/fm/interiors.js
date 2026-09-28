/* =========================================================
 *  실내 공간 정의 — 아파트 20호실, 빌라, 플레이어 집, 공용 장소
 *  좌표: 방 중심이 (0,0), x ∈ [-w/2, w/2], z ∈ [-d/2, d/2]
 *  앞쪽(+z)은 관찰 카메라를 위해 열려 있음 (창문/유리벽)
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM;
  const I = {};
  const f = (type, x, z, rot = 0) => ({ type, x, z, rot });

  // ---------- 공용 장소 (고정 배치) ----------
  const venue = (id, o) => { I[id] = Object.assign({ id, kind: 'venue', wall: 0xf4efe6, floor: 'wood', floorColor: 0xd9b88a, light: 'warm' }, o); };

  venue('cafe_in', { name: '카페 앙상블', place: 'cafe', w: 9, d: 6, floor: 'tile', floorColor: 0xf0e6d6, wall: 0xfff4e6,
    furn: [f('counter', 0, -2), f('espresso', -3, -2.6), f('cafe_table', -2.5, 1), f('cafe_table', 2.5, 1), f('plant_monstera', 3.8, -2.4)] });
  venue('studio_in', { name: '방송 스튜디오', place: 'studio', w: 10, d: 7, floor: 'tile', floorColor: 0x3a3a44, wall: 0x2f4b6e, light: 'cool',
    furn: [f('anchor_desk', 0, -1.5), f('tv_camera', -2, 2), f('tv_camera', 2, 2), f('spot_light', -4, -2.5), f('spot_light', 4, -2.5), f('holo_board', 0, -3.3)] });
  venue('cathedral_in', { name: '축복의 마블 대성당', place: 'cathedral', w: 12, d: 14, floor: 'marble', floorColor: 0xf1eee8, wall: 0xf6f0e8,
    furn: [f('altar', 0, -5.5), f('stained_glass', 0, -6.8), f('stained_glass', -5.8, -3, 90), f('stained_glass', 5.8, -3, -90), f('pew', -3, -2), f('pew', 3, -2), f('pew', -3, 0.5), f('pew', 3, 0.5), f('pew', -3, 3), f('pew', 3, 3), f('chandelier', 0, 0)] });
  venue('obs_in', { name: '별빛 천문대', place: 'observatory', w: 10, d: 10, floor: 'metal', floorColor: 0x3a4466, wall: 0x1c2240, light: 'dark',
    furn: [f('telescope_big', 0, -1), f('star_map', 0, -4.8), f('bench_long', 0, 3, 180), f('hologram', -3.5, -3)] });
  venue('school_in', { name: '섬 어린이 학교', place: 'school', w: 10, d: 7, floor: 'wood', floorColor: 0xe0c08a, wall: 0xfff4d6,
    furn: [f('blackboard', 0, -3.3), f('school_desk', -2.5, 0), f('school_desk', 0, 0), f('school_desk', 2.5, 0), f('school_desk', -2.5, 2), f('school_desk', 0, 2), f('school_desk', 2.5, 2)] });
  venue('library_in', { name: '시립 도서관 & 힐링 북카페', place: 'library', w: 14, d: 11, floor: 'wood', floorColor: 0xc99760, wall: 0xf1e2c4,
    furn: [f('shelf_tall', -4.5, -5), f('shelf_tall', -1.5, -5), f('shelf_tall', 1.5, -5), f('shelf_tall', 4.5, -5), f('reading_table', -3, -1.5), f('reading_table', 3, -1.5),
      f('shelf_tall', -6.6, 0, 90), f('museum_case', 5.5, 1.5, -90), f('museum_case', 5.5, 3.5, -90), f('cafe_table', -3, 3), f('cafe_table', 0, 3.5), f('espresso', -6.5, 4, 90)],
    zones: '1층 앤티크 북카페 · 2층 정숙 열람실 · 3층 거대 서가 벽면 · 자연사 전시실' });
  venue('workshop_in', { name: '마을 공방', place: 'workshop', w: 10, d: 7, floor: 'wood', floorColor: 0xb08a5a, wall: 0xe8d8b8,
    furn: [f('workbench', -2, -2), f('workbench', 2.5, -2), f('wood_pile', -4, 1.5), f('wobbly_chair', 1, 1.5), f('chair', 3, 1.5), f('sale_table', 0, 2.5)] });
  venue('tea_in', { name: '달빛 차관', place: 'teahouse', w: 9, d: 7, floor: 'wood', floorColor: 0x6a4028, wall: 0x8a5a3b, light: 'sunset',
    furn: [f('tea_counter', 0, -2.2), f('brass_lamp', -2, -1.5), f('brass_lamp', 2, -1.5), f('guestbook', 3.6, 1.5, -90), f('tea_table', -2.5, 1.8), f('turntable', -3.8, -2.8), f('plant_monstera', 3.8, -2.8)] });
  venue('sky_in', { name: '스카이라운지 "네뷸라"', place: 'skylounge', w: 14, d: 10, floor: 'marble', floorColor: 0x2a2a3a, wall: 0x1a1a2a, light: 'sunset', skyline: true,
    furn: [f('grand_piano', -4.5, -3), f('champagne_tower', 4.5, -3.5), f('dining_set', -2.5, 1), f('dining_set', 2.5, 1), f('dining_set', 0, -2), f('sink', 6, 3.5, -90), f('chandelier', 0, 0)] });
  venue('mall_in', { name: '플래티넘 타워', place: 'mall', w: 16, d: 11, floor: 'marble', floorColor: 0xf1eee8, wall: 0xffffff, light: 'cool',
    furn: [f('clothes_rack', -5, -3.5), f('clothes_rack', -5, -0.5), f('mannequin_gold', 0, -3), f('accessory_shelf', -1.5, 1.5), f('salon_chair', 4, -3.5), f('salon_chair', 6, -3.5),
      f('counter', 4.5, 1.5), f('holo_board', 0, -5.3), f('mirror_full', -7.5, 2, 90)] });
  venue('arcade_in', { name: '네온 스파크', place: 'arcade', w: 16, d: 12, floor: 'tile', floorColor: 0x1a1030, wall: 0x14101f, light: 'neon',
    furn: [f('arcade_cab', -6.5, -4.5), f('arcade_cab', -5.3, -4.5), f('arcade_cab', -4.1, -4.5), f('pump_pad', -5.5, -1), f('pump_pad', -3.5, -1), f('claw_machine', -6, 3),
      f('bowling_lane', 1, 0), f('bowling_lane', 2.5, 0), f('bowling_lane', 4, 0), f('bowling_lane', 5.5, 0), f('bench_long', 3.2, 5.3, 180), f('neon_sign', 0, -5.8)] });
  venue('sushi_in', { name: '24시 회전초밥', place: 'sushi', w: 9, d: 6, floor: 'wood', floorColor: 0xd9b88a, wall: 0xf4e1c1,
    furn: [f('sushi_conveyor', 0, -1), f('stool', -2.4, 0.3), f('stool', -1.2, 0.3), f('stool', 0, 0.3), f('stool', 1.2, 0.3), f('stool', 2.4, 0.3), f('lantern', -3, 1.5), f('lantern', 3, 1.5)] });
  venue('pub_in', { name: '레트로 차이니스 펍', place: 'pub', w: 9, d: 7, floor: 'wood', floorColor: 0x8a3a2a, wall: 0xc0392b, light: 'sunset',
    furn: [f('lazy_susan', -2, 0.5), f('lazy_susan', 2.3, 0.5), f('steamer', -3.6, -2.8), f('steamer', -2.6, -2.8), f('lantern', -2, -1), f('lantern', 2, -1), f('counter', 2.5, -2.8)] });
  venue('club_in', { name: '더 베이스먼트', place: 'club', w: 13, d: 10, floor: 'tile', floorColor: 0x14101f, wall: 0x0a0812, light: 'neon',
    furn: [f('dance_floor', 0, 0.5), f('mirrorball', 0, 0.5), f('dj_booth', 0, -4), f('stage_mic', -4, -3.5), f('bar_counter', 4.5, 3.5, 180), f('spot_light', -6, -4.5), f('spot_light', 6, -4.5)] });
  venue('conv_in', { name: '24시 편의점', place: 'conv', w: 7, d: 5, floor: 'tile', floorColor: 0xeef2f4, wall: 0xffffff, light: 'cool',
    furn: [f('conv_shelf', -1.5, -1.8), f('conv_shelf', 1.5, -1.8), f('counter', 1.8, 1.2, 180), f('cup_ramen', -3, 1.5)] });
  venue('office_in', { name: '메가 오피스 타워', place: 'office', w: 16, d: 11, floor: 'tile', floorColor: 0xc8ccd2, wall: 0xe8ecf0, light: 'cool',
    furn: [f('office_desk', -5, -2.5), f('office_desk', -2.8, -2.5), f('office_desk', -0.6, -2.5), f('office_desk', -5, 1), f('office_desk', -2.8, 1), f('office_desk', -0.6, 1),
      f('boss_desk', 3, -3.8, 180), f('copier', 2.5, 1.2), f('office_fridge', 6.5, -4.5), f('water_cooler', 7.3, -2.5, -90), f('bench_long', 5.5, 3.5, 180), f('plant_monstera', 7.2, 4.5)],
    zones: '파티션 구획 오피스 · 복사기와 탕비실 정수기 · 옥상 휴게 테라스(오른쪽 아래)' });
  venue('hall_in', { name: '시티 행정 복합 센터 & 법원', place: 'cityhall', w: 16, d: 11, floor: 'marble', floorColor: 0xf1eee8, wall: 0xf6f0e8,
    furn: [f('counter', -4, -3), f('number_machine', -7, 1), f('bench_long', -4, 1.5), f('bench_long', -4, 3.5), f('judge_bench', 4.5, -3.2), f('bench_long', 4.5, 1.5), f('bench_long', 4.5, 3.5), f('clock', 0, -5.4)],
    zones: '민원 창구(왼쪽) · 법정(오른쪽)' });
  venue('med_in', { name: '메디컬 센터 & 24시 약국', place: 'medical', w: 16, d: 11, floor: 'tile', floorColor: 0xeef6fa, wall: 0xffffff, light: 'cool',
    furn: [f('reception', -4, -3.5), f('bench_long', -4, 1.5), f('hospital_bed', 2, -2.5), f('hospital_bed', 4.5, -2.5), f('hospital_bed', 7, -2.5), f('iv_stand', 3.2, -1), f('pharmacy_shelf', -6.5, 4.5, 180), f('counter', -3, 4, 180)],
    zones: '로비 · 응급실 병상 · 24시 약국' });

  // ---------- 주거 공간 ----------
  // 아파트 20호실 (101~504)
  const APT_ROOMS = [];
  for (let fl = 1; fl <= 5; fl++) for (let n = 1; n <= 4; n++) {
    const id = `apt-${fl}0${n}`;
    APT_ROOMS.push(id);
    I[id] = { id, kind: 'room', name: `${fl}0${n}호`, place: 'apartment', floor: fl, idx: n, w: 8, d: 6, door: { x: 3.2, z: -2.6 } };
  }
  for (const pl of FM.MAP.PLOTS) {
    const big = pl.size === 'large';
    I[pl.id + '_in'] = { id: pl.id + '_in', kind: 'room', name: FM.MAP.P[pl.id].name, place: pl.id, w: big ? 12 : 10, d: big ? 9 : 7, door: { x: 0, z: (big ? 9 : 7) / 2 - 0.4 }, villa: true };
  }
  I.home_p_in = { id: 'home_p_in', kind: 'room', name: '플레이어의 집', place: 'home_p', w: 8, d: 6, door: { x: 0, z: 2.6 }, player: true };
  const HOUSE_LEVELS = [
    { lv: 1, name: '원룸 (1단계)', w: 8, d: 6, price: 0, cap: 1 },
    { lv: 2, name: '2인 거주 증축 (2단계)', w: 12, d: 9, price: 30000, cap: 2 },
    { lv: 3, name: '가족 주택 (3단계)', w: 14, d: 10, price: 80000, cap: 5 },
  ];

  // 기본 방 꾸미기 (새 주민 입주 시)
  const PERSONAL = {
    ROMANTIC: ['vase_flowers', 'chandelier'], ATHLETIC: ['dumbbell_rack', 'treadmill'], SCHOLARLY: ['bookshelf', 'fish_tank'], LAZY: ['sofa_modern', 'cake_table'],
    EXTROVERT: ['karaoke', 'balloon'], INTROVERT: ['bookshelf', 'plush_bear'], SNOB: ['display_case', 'chandelier'], CRANKY: ['radio', 'sandbag'],
    ARTISTIC: ['art_weird', 'poster'], ANXIOUS: ['plush_bear', 'safety_gate'],
    MUSIC: ['radio'], FASHION: ['mirror_full'], FITNESS: ['dumbbell_rack'], STUDY: ['bookshelf'], OCCULT: ['crystal_ball'], GARDEN: ['plant_monstera'], FOOD: ['kitchen'], CLEAN: ['drawer'], GOSSIP: ['tv'], FISHING: ['fish_tank'],
  };
  function defaultRoom(v, w = 8, d = 6) {
    const hx = w / 2, hz = d / 2;
    const furn = [
      f('bed_basic', -hx + 1.2, -hz + 1.35), f('wardrobe', -hx + 3.1, -hz + 0.4), f('desk', hx - 1.0, -hz + 0.45), f('ceiling_light', 0, 0),
      f('clock', 0, -hz + 0.05), f('plant_monstera', hx - 0.5, hz - 0.6), f('rug', 0.3, 0.6),
    ];
    const extra = [...(PERSONAL[v.keys.L1] || []), ...(PERSONAL[v.keys.L4] || [])];
    const slots = [[hx - 1.2, 0.8, -90], [-hx + 0.8, 1.6, 90], [0.6, -hz + 0.5, 0], [-1.2, 1.9, 180]];
    let i = 0;
    for (const t of [...new Set(extra)]) { if (i >= slots.length) break; const [x, z, r] = slots[i++]; furn.push(f(t, x, z, r)); }
    furn.push(f('kitchen', -hx + 1.1, hz - 0.5, 180));
    return { theme: null, wall: 0xf4efe6, floor: 'wood', floorColor: 0xd9b88a, light: 'warm', lightOn: true, bgm: 'none', furn, trash: [], clean: 100, pattern: null, patternFace: null, set: null };
  }
  // 테마 방 (인테리어 티켓)
  function themeRoom(themeId, w = 8, d = 6) {
    const t = FM.D.THEMES[themeId];
    const hx = w / 2, hz = d / 2;
    const slots = [[-hx + 1.3, -hz + 1.35, 0], [hx - 1.3, -hz + 0.7, 0], [0, -hz + 0.6, 0], [-hx + 0.8, 1, 90], [hx - 1.0, 1.2, -90], [0.8, 1.5, 180], [-1.5, 0.6, 0]];
    const furn = t.furn.map((type, i) => {
      const F = FM.FURN[type];
      if (F && F.ceiling) return f(type, 0, 0);
      const s = slots[i % slots.length];
      return f(type, s[0], s[1], s[2]);
    });
    if (!t.furn.some(x => FM.FURN[x] && FM.FURN[x].grade !== undefined)) furn.push(f('bed_basic', -hx + 1.2, -hz + 1.35));
    if (!furn.some(x => x.type === 'ceiling_light' || (FM.FURN[x.type] || {}).ceiling)) furn.push(f('ceiling_light', 0, 0));
    return { theme: themeId, wall: t.wall, floor: t.floor, floorColor: t.floorColor, light: t.light, lightOn: true, bgm: t.bgm, furn, trash: [], clean: 100, pattern: null, patternFace: null, set: null };
  }

  FM.INTERIORS = I;
  FM.APT_ROOMS = APT_ROOMS;
  FM.HOUSE_LEVELS = HOUSE_LEVELS;
  FM.defaultRoom = defaultRoom;
  FM.themeRoom = themeRoom;
  FM.fdef = f;
})();
