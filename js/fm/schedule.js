/* =========================================================
 *  주민 하루 일정표 — 성격 · 성향 · 가치관 · 요일 · 시간대 · 날씨에 따라 매일 아침 랜덤으로 짜는 일정
 *  회사 · 대성당 · 카페 · 레스토랑 · 회전초밥 · 펍 · 오락실 · 클럽 · 천문대 · 도서관 · 찻집 · 쇼핑몰 …
 *  + 공원 · 해변 · 절벽 · 폭포 · 선착장 · 미식 골목 같은 야외 명소까지 섬 전체를 돌아다니게 함
 *  (자유 시간 · 집 블록만 덮어씀 — 잠 · 출근 · 병원 · 성격 패턴의 핵심 시간은 그대로)
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, MAP = FM.MAP;
  const S = () => Sim.get();
  const has = (v, k) => Sim.has(v, k);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const chance = p => Math.random() < p;
  const inWin = (h, a, b) => { const hh = h < a && b > 24 ? h + 24 : h; return hh >= a && hh < b; };
  const Sch = (FM.Schedule = {});

  // 성향 점수: 해당 키(성격 · 성향 · 가치관 · 도덕 · 연애 스타일)가 있으면 가산
  const w = (v, table) => { let s = 0.3; for (const [k, x] of Object.entries(table)) { if (has(v, k) || v.value === k || v.moral === k || v.loveStyle === k) s += x; else if (v.value2 === k) s += x * 0.4; } return s; };
  // 야외 명소 (실내 없는 장소) — [장소, 가능 시간, 이름, 가중치, 좋아하는 시간대, 할 일]
  const OUT = [
    ['park', 7, 21, '센트럴 파크 산책', v => w(v, { NATURE: 3, ATHLETIC: 1.5, FAMILY: 1, INTROVERT: 1, PURE: 1.5, HARMONY: 1, BUGS: 2 }), [[8, 12, 1.3], [15, 18, 1.2]], ['read_book', 'observe_bugs', 'sit_bench', 'stretch']],
    ['beach', 8, 20, '에메랄드 해수욕장', v => w(v, { FUN: 2, ATHLETIC: 1.5, EXTROVERT: 1.5, FRESH: 2.5, TOMBOY: 1.5, ROMANTIC: 1, ADVENTURER: 1, BEAGLE: 1 }), [[11, 17, 1.5]], ['watch_sea', 'sunbathe', 'look_around']],
    ['cliff', 6, 23, '노을 절벽 전망', v => w(v, { ROMANTIC: 2.5, INTROVERT: 1.5, MYSTIC: 2, ARTISTIC: 1.5, ANXIOUS: 1, PURE: 1 }), [[17, 20.5, 2]], ['watch_sea', 'watch_sky', 'write_poem']],
    ['waterfall', 8, 19, '폭포 명상', v => w(v, { NATURE: 2, MYSTIC: 2, INTROVERT: 1.5, CLASSIC: 1, TRADITION: 1, ANXIOUS: 1 }), [[9, 16, 1.2]], ['meditate', 'look_around']],
    ['ferry', 7, 20, '선착장 바다 구경', v => w(v, { ADVENTURER: 2.5, WANDERER: 2.5, ROMANTIC: 1, FISHING: 2 }), [[7, 10, 1.3], [16, 19, 1.3]], ['watch_sea', 'look_around']],
    ['alley', 16, 25, '미식 골목 먹방', v => w(v, { FOOD: 3, EXTROVERT: 1, FUN: 1.5, BEAGLE: 1.5, TOMBOY: 1, GOSSIP: 1 }), [[18, 22, 1.6]], ['eat_snack', 'look_around']],
    ['playground', 9, 18, '놀이터 산책', v => w(v, { FAMILY: 2, BEAGLE: 1.5, CUTIE: 1.5, FUN: 1 }) * 0.7, [], ['look_around', 'sit_bench']],
    ['cliff_lawn', 8, 19, '절벽 아래 잔디밭 피크닉', v => w(v, { NATURE: 1.5, FRIENDSHIP: 1.5, PURE: 1, FRESH: 1 }), [[11, 15, 1.3]], ['sit_bench', 'look_around']],
    ['apt_yard', 7, 22, '아파트 화단', v => w(v, { HOMEBODY: 2, NATURE: 1 }) * 0.5, [], ['water_flowers', 'sit_bench']],
    ['plaza', 7, 23, '중앙 광장', v => w(v, { EXTROVERT: 1, GOSSIP: 1, FRIENDSHIP: 1 }) * 0.35, [], ['look_around', 'chat']],
  ];
  // 실내 장소별 좋아하는 시간대 (가중치 배수)
  const PEAK = {
    cafe: [[8, 11, 1.6], [14, 17, 1.3]], cathedral: [[8, 12, 1.5], [17, 19, 1.2]], observatory: [[19, 26, 1.8]], skylounge: [[18, 23, 2.2]], sushi: [[11.5, 14, 1.8], [18, 21, 1.5]],
    pub: [[18, 25, 1.7]], club: [[19, 26, 2.2]], arcade: [[14, 23, 1.4]], library: [[9, 18, 1.3]], teahouse: [[15, 23, 1.4]], mall: [[11, 20, 1.3]], studio: [[10, 18, 1]],
    office: [[9, 18, 1]], workshop: [[10, 18, 1.2]], conv: [[0, 24, 0.6]], cityhall: [[9, 17, 0.7]], medical: [[9, 18, 0.5]], school: [[9, 16, 0.6]],
  };
  const NIGHT = new Set(['club', 'observatory', 'pub', 'skylounge', 'teahouse', 'conv', 'alley', 'arcade', 'cliff']);
  const bld = () => (FM.Outing && FM.Outing.BUILDINGS) || [];
  const reachable = id => { const p = MAP.P[id]; return p && (!p.interior || FM.INTERIORS[p.interior]); };

  // 후보 목록: [id, 이름, 실내 여부, 시작, 끝, 가중치 함수, 피크, 할 일]
  const cands = () => {
    const a = bld().filter(b => reachable(b[0]) && MAP.P[b[0]].interior).map(b => ({ id: b[0], name: b[3], inside: true, o: b[1], c: b[2], wf: b[4], peak: PEAK[b[0]] || [] }));
    for (const o of OUT) if (reachable(o[0]) && (MAP.P[o[0]].spots || []).length) a.push({ id: o[0], name: o[3], inside: false, o: o[1], c: o[2], wf: o[4], peak: o[5], acts: o[6] });
    return a;
  };
  const rainy = () => { const t = S().weather && S().weather.type; return t === 'rain' || t === 'storm' || t === 'snow'; };
  function score(v, c, t, used) {
    if (!inWin(t, c.o, c.c) || !inWin(t + 0.8, c.o, c.c + 0.01)) return 0;
    if (t >= 22 && !NIGHT.has(c.id)) return 0;
    if (c.id === 'office' && v.job === 'office') return 0;
    if (c.id === 'medical' && !((v.stress || 0) > 55 || (v.depression || 0) > 50)) return 0;
    let s = Math.max(0, c.wf(v)); if (!s) return 0;
    for (const [a, b, m] of c.peak) if (inWin(t, a, b)) s *= m;
    s *= c.inside ? 1.45 : 0.75;                                                    // 건물 안 일정 비중 ↑
    if (!c.inside && rainy()) s *= 0.25;
    if (c.id === 'cathedral' && Sim.time.weekday() === 6) s *= 2;                 // 일요일 예배
    if (Sim.time.weekend() && ['mall', 'arcade', 'beach', 'park', 'club'].includes(c.id)) s *= 1.4;
    if (used[c.id]) s *= 0.15;                                                      // 같은 곳 두 번은 드물게
    if (v.lastOuting === c.id) s *= 0.5;
    const p = MAP.P[c.id], hx = v.x || 0, hz = v.z || 0;                           // 너무 먼 곳은 살짝 덜
    if (p && v.stats && v.stats.range === 'HOME') s *= Math.hypot(p.x - hx, p.z - hz) > 70 ? 0.4 : 1;
    return s * rnd(0.6, 1.4);
  }
  const pickW = list => { const tot = list.reduce((a, x) => a + x[1], 0); if (!tot) return null; let r = Math.random() * tot; for (const x of list) if ((r -= x[1]) < 0) return x[0]; return list[0][0]; };
  // 하루에 잡을 일정 수 (외향 · 방랑 ↑ / 집순이 · 내향 ↓)
  function slotCount(v) {
    let n = 3.6 + (Sim.time.weekend() ? 1 : 0);
    if (has(v, 'EXTROVERT')) n += 1; if (has(v, 'WANDERER') || has(v, 'ADVENTURER')) n += 1; if (has(v, 'FUN') || has(v, 'HIP') || has(v, 'BEAGLE') || has(v, 'FRESH')) n += 0.6; if (has(v, 'BUSYBODY') || has(v, 'GOSSIP')) n += 0.5;
    if (has(v, 'HOMEBODY')) n -= 1.4; if (has(v, 'INTROVERT')) n -= 0.6; if (has(v, 'LAZY')) n -= 0.6; if (v.stats && v.stats.range === 'HOME') n -= 0.8;
    if (v.pattern) n = Math.min(n, 1.6);
    return Math.max(1, Math.min(6, Math.round(n + rnd(-0.6, 0.6))));
  }
  // 일하는 시간 (일정을 잡지 않음)
  function busy(v, t) {
    if (Sim.time.weekend()) return false;
    if (v.job === 'office') return t < 19;
    if (v.job === 'anchor') return t >= 8.5 && t < 19.6;
    if (v.job === 'pharmacist') return t >= 9 && t < 18;
    if (v.job === 'freelance') return (t >= 10 && t < 12) || (t >= 14 && t < 16);
    return false;
  }
  Sch.plan = function (v, fromH) {
    const day = Sim.time.day(), wake = v.wake !== undefined ? v.wake : 7;
    let end = v.sleepAt !== undefined ? v.sleepAt : 23; if (end < 12) end += 24; end = Math.min(end - 0.4, 26);
    const list = cands(), slots = [], used = {}, N = slotCount(v);
    let t = Math.max(fromH, wake + rnd(0.3, 1.4)), guard = 0;
    while (slots.length < N && t < end - 0.8 && guard++ < 40) {
      if (busy(v, t)) { t += 0.5; continue; }
      const scored = list.map(c => [c, score(v, c, t, used)]).filter(x => x[1] > 0);
      const c = pickW(scored); if (!c) { t += 0.75; continue; }
      let dur = c.inside ? rnd(1.4, 2.8) : rnd(1.1, 2.2); dur = Math.min(dur, end - t, (c.c > 24 ? c.c : Math.min(c.c, 24)) - t);
      let tt = t; while (tt < t + dur && !busy(v, tt)) tt += 0.25; dur = tt - t;
      if (dur >= 0.6) { slots.push({ from: t, to: t + dur, place: c.id, name: c.name, inside: c.inside, acts: c.acts }); used[c.id] = 1; }
      t += Math.max(dur, 0.5) + rnd(0.2, 1.4) * (N > 3 ? 0.7 : 1);
    }
    v.sched = { day, slots };
    return v.sched;
  };
  const posOf = v => { if (v.loc === 'island' || v.loc === 'metro') return [v.x || 0, v.z || 0]; const I = FM.INTERIORS[v.loc], p = I && I.place && MAP.P[I.place]; if (p) return p.door || [p.x, p.z]; const ap = MAP.P.apartment; return ap ? [ap.x, ap.z] : [0, 0]; };
  function travelH(v, place) { const p = MAP.P[place]; if (!p) return 0; const [x, z] = posOf(v), tx = p.door ? p.door[0] : p.x, tz = p.door ? p.door[1] : p.z; const d = Math.hypot(tx - x, tz - z); if (d < 12) return 0; const walkMin = d * 1.3 / 1.35; return Math.min(walkMin, d > 45 ? 14 + d * 0.03 : walkMin) / 60; }
  Sch.travelH = travelH;
  const curHour = () => { const h = Sim.time.hour(); return h < 5 ? h + 24 : h; };
  Sch.current = function (v) {
    if (!v.sched) return null;
    const d = Sim.time.day(), h0 = Sim.time.hour(); let h;
    if (v.sched.day === d && h0 >= 5) h = h0; else if (v.sched.day === d - 1 && h0 < 5) h = h0 + 24; else return null;   // 자정 넘긴 클럽 · 천문대 일정
    // 약속 시간에 맞춰 이동 시간만큼 미리 출발 (걸어서 분당 1.35m, 멀면 지하철)
    return v.sched.slots.find(s => h >= s.from - travelH(v, s.place) && h < s.to) || null;
  };
  const venueOf = loc => { const I = FM.INTERIORS[loc]; return I && I.kind === 'venue' ? I : null; };
  // sim-core think() 가 부르는 훅: 기본 블록을 받아서 일정으로 덮어씀
  Sim.blockHook = function (v, b) {
    if (!v || v.child || v.staff || v.visitor || v.sceneId || v.status.hospital) return null;
    if (!b || !['free', 'home'].includes(b.k)) return null;
    const h = Sim.time.hour();
    if (h >= 5 && (!v.sched || v.sched.day !== Sim.time.day())) Sch.plan(v, h);
    const s = Sch.current(v);
    if (s) {
      if (s !== v._slot) { v._slot = s; v.outing = null; v.lastOuting = s.place; const st = S(); st.schedStats = st.schedStats || {}; st.schedStats[s.place] = (st.schedStats[s.place] || 0) + 1; }
      const label = `📅 ${Math.floor(s.from % 24)}:${String(Math.round((s.from % 1) * 60)).padStart(2, '0')} ${s.name}`;
      if (s.inside) return { k: 'go', place: s.place, inside: true, metro: true, label };
      return { k: 'go', place: s.place, acts: s.acts, metro: true, label };
    }
    v._slot = null;
    // 일정이 끝났는데 아직 가게 안이면 밖으로 나와서 다음 할 일로
    if (venueOf(v.loc) && !v.outing && b.k === 'free') {
      const p = Object.values(MAP.P).find(q => q.interior === v.loc), d = p && (p.door || [p.x, p.z + 4]);
      if (d) return { k: 'go', tags: ['bench', 'flowers', 'trees', 'plaza', 'park', 'sea', 'food'], district: FM.T.district(d[0], d[1]), label: '일정 끝 · 산책' };
    }
    return null;
  };
  // 프로필용: 오늘 일정 텍스트
  Sch.describe = function (v) {
    if (!v.sched || v.sched.day !== Sim.time.day() || !v.sched.slots.length) return '';
    const h = curHour(), f = x => `${Math.floor(x % 24)}:${String(Math.round((x % 1) * 60)).padStart(2, '0')}`;
    return v.sched.slots.map(s => `${h >= s.from && h < s.to ? '▶ ' : h >= s.to ? '✓ ' : ''}${f(s.from)} ${s.name}`).join(' · ');
  };
})();
// 일정 시작 알림: 약속 시간이 되면 하던 산책 · 멍때리기를 정리하고 바로 출발 (게임 10분마다 확인)
(() => {
  const FM = window.FM, Sim = FM.Sim, Sch = FM.Schedule, oTick = Sim.tick;
  const SOFT = new Set(['WALK', 'RUN', 'WATCH_LOOK', 'INTERACT_OBJ', 'HOME_LIFE', 'IDLE']);
  let acc = 0;
  Sim.tick = function (dtR) {
    const r = oTick.apply(this, arguments);
    const st = Sim.get(); if (!st) return r;
    acc += dtR * (st.speed || 0); if (acc < 10) return r; acc = 0;
    for (const v of st.villagers) {
      if (v.child || v.staff || v.visitor || v.sceneId || v.loc === 'metro' || v.status.hospital || !SOFT.has(v.state)) continue;
      const s = Sch.current(v); if (!s || s === v._slot) continue;
      const b = Sim.block(v); if (!b || !['free', 'home'].includes(b.k)) continue;
      if (v.act && v.act.id === 'sleep') continue;
      Sim.releaseSpot(v); Sim.freeUse(v); v.route = null; v.act = null; v.pose = null; v.prop = null; v.useTarget = null; v.pendingAct = null; v.idleT = 0; v.state = 'WATCH_LOOK';
      Sim.think(v);
    }
    return r;
  };
})();
// 배고플 때 갈 식당 고르기 (sim-core goEat 이 부름)
(() => {
  const FM = window.FM, Sim = FM.Sim, MAP = FM.MAP, has = (v, k) => Sim.has(v, k);
  const w = (v, t) => { let s = 0.4; for (const [k, x] of Object.entries(t)) if (has(v, k) || v.value === k || v.loveStyle === k) s += x; return s; };
  const inWin = (h, a, b) => { const hh = h < a && b > 24 ? h + 24 : h; return hh >= a && hh < b; };
  // [id, 이름, 시작, 끝, 가격, 가중치, 좋아하는 시간대, 야외 스팟 태그]
  const R = [
    ['cafe', '카페 앙상블 브런치', 8, 21, 35, v => w(v, { CHIC: 1.5, FRESH: 1.5, CUTIE: 1.5, ROMANTIC: 1, GOSSIP: 1 }), [[8, 11.5, 1.8], [14, 17, 1.3]]],
    ['sushi', '24시 회전초밥', 11, 22, 55, v => w(v, { FOOD: 2.5, LAZY: 1, TOMBOY: 1.5, FRESH: 0.5 }), [[11.5, 14, 1.8], [18, 21, 1.5]]],
    ['pub', '레트로 차이니스 펍', 17, 26, 50, v => w(v, { EXTROVERT: 1.5, FUN: 1.5, TOMBOY: 1.5, CRANKY: 1 }) + ((v.stress || 0) > 50 ? 1.5 : 0), [[18, 23, 1.6]]],
    ['skylounge', '스카이라운지 파인 다이닝', 17, 24, 140, v => w(v, { SNOB: 2.5, MONEY: 2, ELEGANT: 2.5, DANDY: 2, CHARISMA: 1, ROMANTIC: 1 }) + (FM.Soc && FM.Soc.partnerOf && FM.Soc.partnerOf(v.id) ? 1.5 : 0), [[18, 22, 2]]],
    ['club', '재즈바 블루문 디너', 18, 26, 70, v => w(v, { ARTISTIC: 2.5, MUSICIAN: 2.5, CLASSIC: 1.5, ROMANTIC: 1, NIGHT_OWL: 1.5, HIP: 1 }), [[19, 24, 1.6]]],
    ['mall', '마켓 델리 코너', 10, 21, 30, v => w(v, { FOOD: 1.5, FAMILY: 1.5, DILIGENT: 1, FASHIONISTA: 1, CUTIE: 1 }), [[11.5, 14, 1.4]]],
    ['conv', '24시 편의점 도시락', 0, 24, 15, v => w(v, { LAZY: 2, GAMER: 1.5, TOMBOY: 0.5 }) * 0.7, [[22, 29, 2]]],
    ['alley', '미식 골목 포장마차', 16, 25, 25, v => w(v, { FOOD: 2, EXTROVERT: 1, BEAGLE: 1.5, FUN: 1 }), [[18, 23, 1.5]], 'food'],
    ['beach', '해변 포장마차', 11, 21, 25, v => w(v, { FRESH: 1.5, FUN: 1, TOMBOY: 1 }) * 0.8, [[12, 14, 1.3]], 'pocha'],
  ];
  const pos = v => { if (v.loc === 'island') return [v.x, v.z]; const I = FM.INTERIORS[v.loc], p = I && I.place && MAP.P[I.place]; if (p) return p.door || [p.x, p.z]; const ap = MAP.P.apartment; return ap ? [ap.x, ap.z] : [0, 0]; };
  Sim.pickRestaurant = function (v) {
    const h = Sim.time.hour(), [x, z] = pos(v), poor = v.status && v.status.poorUntil || (v.coins || 0) < 40;
    const list = [];
    for (const [id, name, o, c, price, wf, peak, spot] of R) {
      const P = MAP.P[id]; if (!P || !inWin(h, o, c)) continue;
      if (!spot && !(P.interior && FM.INTERIORS[P.interior])) continue;
      if (poor && price > 30) continue; if ((v.coins || 0) < price * 0.8 && price > 60) continue;
      let s = Math.max(0.05, wf(v)); for (const [a, b, m] of peak) if (inWin(h, a, b)) s *= m;
      const P0 = P.door || [P.x, P.z]; s /= 1 + Math.hypot(P0[0] - x, P0[1] - z) / 70;
      if (v.lastMeal === id) s *= 0.35;
      list.push([{ id, name, price, iid: spot ? null : P.interior, spot }, s * (0.6 + Math.random() * 0.8)]);
    }
    const tot = list.reduce((a, b) => a + b[1], 0); if (!tot) return null;
    let r = Math.random() * tot; for (const [o, s] of list) if ((r -= s) < 0) return o; return list[0][0];
  };
})();
