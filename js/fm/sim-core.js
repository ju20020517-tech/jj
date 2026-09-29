/* =========================================================
 *  시뮬레이션 코어
 *  - 시간/날씨, 주민 생성(4레이어 성격), 스탯 가중치 융합
 *  - 길 찾기(도로 그래프 + 지하철), 실내/실외 이동
 *  - 24시간 스케줄, 행동 두뇌(스마트 오브젝트 우선순위), 장면(Scene) 엔진
 *  THREE 없이도 동작 (Node 테스트 가능)
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, D = FM.D, MAP = FM.MAP, T = FM.T;
  const Sim = (FM.Sim = {});

  // ---------------------------------------------------------
  // 이벤트 버스
  // ---------------------------------------------------------
  const listeners = {};
  FM.bus = {
    on(e, fn) { (listeners[e] = listeners[e] || []).push(fn); },
    emit(e, d) { (listeners[e] || []).forEach(fn => { try { fn(d); } catch (err) { console.error(err); } }); },
  };
  const emit = FM.bus.emit;

  // ---------------------------------------------------------
  // 유틸
  // ---------------------------------------------------------
  const rnd = (a = 0, b = 1) => a + Math.random() * (b - a);
  const rint = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function weighted(obj) {
    let sum = 0; for (const k in obj) sum += Math.max(0, obj[k]);
    let r = Math.random() * sum;
    for (const k in obj) { r -= Math.max(0, obj[k]); if (r <= 0) return k; }
    return Object.keys(obj)[0];
  }
  Sim.u = { rnd, rint, pick, chance, clamp, dist, weighted, mulberry32 };

  // 한국어 조사 자동 교정: "모카이(가)" → "모카가", "보리을(를)" → "보리를"
  const hasBatchim = ch => { const c = ch.charCodeAt(0); if (c < 0xac00 || c > 0xd7a3) return null; return (c - 0xac00) % 28; };
  const JOSA = [['이(가)', '이', '가'], ['을(를)', '을', '를'], ['은(는)', '은', '는'], ['와(과)', '과', '와'], ['아(야)', '아', '야'], ['이(라)', '이라', '라']];
  function josa(text) {
    if (!text || typeof text !== 'string') return text;
    for (const [tag, withB, noB] of JOSA) {
      if (!text.includes(tag)) continue;
      text = text.split(tag).map((part, i, arr) => {
        if (i === arr.length - 1) return part;
        const b = hasBatchim(part.slice(-1));
        return part + (b === null ? noB : b ? withB : noB);
      }).join('');
    }
    if (text.includes('(으)로')) text = text.split('(으)로').map((part, i, arr) => {
      if (i === arr.length - 1) return part;
      const b = hasBatchim(part.slice(-1));
      return part + (b === null || b === 0 || b === 8 ? '로' : '으로');
    }).join('');
    if (text.includes('(이)')) text = text.split('(이)').map((part, i, arr) => {
      if (i === arr.length - 1) return part;
      const b = hasBatchim(part.slice(-1));
      return part + (b ? '이' : '');
    }).join('');
    return text;
  }
  FM.josa = josa;

  let S = null;
  Sim.get = () => S;

  // ---------------------------------------------------------
  // 시간
  // ---------------------------------------------------------
  const day = () => Math.floor(S.time / 1440) + 1;
  const hour = () => (S.time % 1440) / 60;
  const weekday = () => (day() - 1) % 7;                // 0=월
  const weekend = () => weekday() >= 5;
  const hm = (h = hour()) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`;
  const inH = (h, a, b) => (a <= b ? h >= a && h < b : h >= a || h < b); // 자정 넘어가는 구간 지원
  Sim.time = { day, hour, weekday, weekend, hm, inH };

  // ---------------------------------------------------------
  // 장식 (나무, 꽃밭) — 3D와 시뮬레이션이 같은 위치를 공유 (시드 고정)
  // ---------------------------------------------------------
  const DECOR = (FM.DECOR = { trees: [], flowers: [], lamps: [] });
  (function buildDecor() {
    const r = mulberry32(20260928);
    const onRoad = (x, z) => {
      for (const [a, b] of MAP.E) {
        const A = MAP.N[a], B = MAP.N[b];
        const dx = B[0] - A[0], dz = B[1] - A[1];
        const t = clamp(((x - A[0]) * dx + (z - A[1]) * dz) / (dx * dx + dz * dz || 1), 0, 1);
        if (Math.hypot(x - (A[0] + dx * t), z - (A[1] + dz * t)) < 3.2) return true;
      }
      return false;
    };
    const free = (x, z, pad = 2) => {
      if (T.blockedByBuilding(x, z, pad + 2)) return false;
      if (T.inWater(x, z) || T.height(x, z) < 0.8) return false;
      if (onRoad(x, z)) return false;
      if (T.onStairs(x, z) || Math.abs(x) < 4 && z < -40 && z > -60) return false;
      for (const p of Object.values(MAP.P)) for (const s of p.spots) if (Math.hypot(s[0] - x, s[1] - z) < 2.2) return false;
      if (Math.hypot(x, z - 10) < 15) return false; // 광장
      for (const t of DECOR.trees) if (Math.hypot(t.x - x, t.z - z) < pad) return false;
      return true;
    };
    const zones = [
      { x0: -125, x1: -60, z0: 5, z1: 40, n: 38, kind: 'park' },      // 센트럴 파크 & 비밀의 숲
      { x0: -128, x1: -108, z0: 10, z1: 34, n: 26, kind: 'forest' },   // 비밀의 숲 (빽빽)
      { x0: -80, x1: 110, z0: -118, z1: -62, n: 36, kind: 'north' },
      { x0: -125, x1: -88, z0: -110, z1: -60, n: 12, kind: 'lawn' },
      { x0: -130, x1: -45, z0: -45, z1: -38, n: 10, kind: 'west' },
      { x0: 40, x1: 128, z0: -40, z1: 60, n: 26, kind: 'east' },
      { x0: -40, x1: 40, z0: -24, z1: 40, n: 22, kind: 'core' },
      { x0: -100, x1: 60, z0: 74, z1: 90, n: 14, kind: 'palm' },
      { x0: -130, x1: -40, z0: 40, z1: 80, n: 18, kind: 'west' },
    ];
    for (const zn of zones) {
      let tries = 0, made = 0;
      while (made < zn.n && tries++ < zn.n * 30) {
        const x = zn.x0 + r() * (zn.x1 - zn.x0), z = zn.z0 + r() * (zn.z1 - zn.z0);
        if (T.coastVal(x, z) > 0.8 || !free(x, z, zn.kind === 'forest' ? 3 : 5)) continue;
        DECOR.trees.push({ x, z, kind: zn.kind === 'palm' ? 'palm' : (zn.kind === 'forest' || r() < 0.3 ? 'pine' : (zn.kind === 'park' && r() < 0.2 ? 'willow' : 'round')), s: 0.8 + r() * 0.6 });
        made++;
      }
    }
    // 꽃밭
    const fz = [[-12, -5], [12, -5], [-80, 20], [-72, -86], [-8, -80], [-62, -24], [-80, -24], [-98, -24], [-116, -24], [-37, -24], [26, 2], [-95, 64], [60, 30], [-30, 62]];
    for (const [x, z] of fz) DECOR.flowers.push({ x, z, r: 1.6, col: r() });
    for (let i = 0; i < 40; i++) {
      const x = -130 + r() * 250, z = -110 + r() * 200;
      if (free(x, z, 3) && T.coastVal(x, z) < 0.8) DECOR.flowers.push({ x, z, r: 0.9, col: r() });
    }
  })();

  // ---------------------------------------------------------
  // 행동 지점 (spot) 목록
  // ---------------------------------------------------------
  const SPOTS = [];
  for (const p of Object.values(MAP.P)) {
    for (const s of p.spots) SPOTS.push({ x: s[0], z: s[1], tags: s[2], seat: !!(s[3] && s[3].seat), lie: !!(s[3] && s[3].lie), face: s[3] ? s[3].face : undefined, place: p.id, district: p.district, occ: null });
  }
  for (const t of DECOR.trees) if (t.kind !== 'palm') SPOTS.push({ x: t.x + 1.4, z: t.z + 1.2, tags: ['trees', 'bugs'], place: null, district: T.district(t.x, t.z), occ: null });
  for (const f of DECOR.flowers) SPOTS.push({ x: f.x + f.r + 0.5, z: f.z, tags: ['flowers', 'bugs'], place: null, district: T.district(f.x, f.z), occ: null });
  // 물가 (낚시)
  for (const [x, z] of [[-35, -47.5], [-60, -48.5], [-92, -48.5], [-97, 36], [-88, 31], [52, 105], [-15, 97], [-55, 96]]) SPOTS.push({ x, z, tags: ['fish', 'sea', 'quiet'], place: null, district: T.district(x, z), occ: null });
  Sim.SPOTS = SPOTS;

  // ---------------------------------------------------------
  // 길 찾기 그래프 (Floyd–Warshall 다음 경유지 표)
  // ---------------------------------------------------------
  const NODE_IDS = Object.keys(MAP.N);
  const NODES = NODE_IDS.map(id => ({ id, x: MAP.N[id][0], z: MAP.N[id][1], y: T.groundY(MAP.N[id][0], MAP.N[id][1]) }));
  const NI = Object.fromEntries(NODE_IDS.map((id, i) => [id, i]));
  const nN = NODES.length;
  const DIST = Array.from({ length: nN }, () => new Float64Array(nN).fill(Infinity));
  const NEXT = Array.from({ length: nN }, () => new Int16Array(nN).fill(-1));
  for (let i = 0; i < nN; i++) { DIST[i][i] = 0; NEXT[i][i] = i; }
  for (const [a, b] of MAP.E) {
    const i = NI[a], j = NI[b];
    if (i === undefined || j === undefined) { console.warn('bad edge', a, b); continue; }
    const d = Math.hypot(NODES[i].x - NODES[j].x, NODES[i].z - NODES[j].z) + Math.abs(NODES[i].y - NODES[j].y) * 0.5;
    DIST[i][j] = DIST[j][i] = d; NEXT[i][j] = j; NEXT[j][i] = i;
  }
  for (let k = 0; k < nN; k++) for (let i = 0; i < nN; i++) {
    const dik = DIST[i][k]; if (dik === Infinity) continue;
    for (let j = 0; j < nN; j++) { const d = dik + DIST[k][j]; if (d < DIST[i][j]) { DIST[i][j] = d; NEXT[i][j] = NEXT[i][k]; } }
  }
  function nearestNode(x, z) {
    const y = T.groundY(x, z);
    let best = -1, bd = Infinity;
    for (let i = 0; i < nN; i++) {
      const n = NODES[i];
      if (Math.abs(n.y - y) > 7) continue;
      const d = Math.hypot(n.x - x, n.z - z);
      if (d < bd) { bd = d; best = i; }
    }
    if (best < 0) for (let i = 0; i < nN; i++) { const d = Math.hypot(NODES[i].x - x, NODES[i].z - z); if (d < bd) { bd = d; best = i; } }
    return best;
  }
  function graphPath(x0, z0, x1, z1) {
    const a = nearestNode(x0, z0), b = nearestNode(x1, z1);
    const pts = [];
    if (DIST[a][b] === Infinity) return { pts: [[x1, z1]], len: Math.hypot(x1 - x0, z1 - z0) };
    let i = a;
    pts.push([NODES[i].x, NODES[i].z]);
    while (i !== b) { i = NEXT[i][b]; pts.push([NODES[i].x, NODES[i].z]); }
    // 되돌아가는 첫 지점 생략
    if (pts.length > 1) {
      const [p0, p1] = pts;
      if (Math.hypot(p1[0] - x0, p1[1] - z0) < Math.hypot(p1[0] - p0[0], p1[1] - p0[1])) pts.shift();
    }
    if (pts.length > 1) {
      const pl = pts[pts.length - 1], pp = pts[pts.length - 2];
      if (Math.hypot(pp[0] - x1, pp[1] - z1) < Math.hypot(pp[0] - pl[0], pp[1] - pl[1])) pts.pop();
    }
    pts.push([x1, z1]);
    let len = 0, px = x0, pz = z0;
    for (const [x, z] of pts) { len += Math.hypot(x - px, z - pz); px = x; pz = z; }
    return { pts, len };
  }
  Sim.graphPath = graphPath;
  Sim.NODES = NODES;

  function nearestStation(x, z) {
    let best = null, bd = Infinity;
    for (const [id, s] of Object.entries(MAP.STATIONS)) {
      const d = graphPath(x, z, s.x, s.z).len;
      if (d < bd) { bd = d; best = id; }
    }
    return { id: best, d: bd };
  }

  // ---------------------------------------------------------
  // 실내/실외 좌표 도우미
  // ---------------------------------------------------------
  const INT = FM.INTERIORS;
  function interiorDoor(iid) {
    const I = INT[iid];
    if (I.door) return I.door;
    return { x: 0, z: I.d / 2 - 0.4 };
  }
  function placeDoor(placeId) {
    const p = MAP.P[placeId];
    const d = p.door || [p.x, p.z];
    return { x: d[0], z: d[1] };
  }
  function interiorSize(iid) {
    const I = INT[iid];
    if (I.player) { const lv = FM.HOUSE_LEVELS[(S.player.houseLevel || 1) - 1]; return { w: lv.w, d: lv.d }; }
    return { w: I.w, d: I.d };
  }
  Sim.interiorDoor = iid => { const I = INT[iid]; if (I.player) { const s = interiorSize(iid); return { x: 0, z: s.d / 2 - 0.4 }; } return interiorDoor(iid); };
  Sim.placeDoor = placeDoor;
  Sim.interiorSize = interiorSize;

  // ---------------------------------------------------------
  // 경로 계획 (걷기 / 실내 출입 / 지하철)
  // ---------------------------------------------------------
  function islandLegs(ax, az, bx, bz, opts = {}) {
    const legs = [];
    const walk = graphPath(ax, az, bx, bz);
    let useMetro = !!opts.viaMetro;
    let sa, sb;
    if (!opts.noMetro) {
      sa = nearestStation(ax, az); sb = nearestStation(bx, bz);
      if (sa.id !== sb.id) {
        const metroCost = sa.d + sb.d + 30;
        if (walk.len > 110 && metroCost < walk.len * 0.75) useMetro = true;
      } else if (opts.viaMetro) useMetro = false;
    }
    if (useMetro && sa && sb && sa.id !== sb.id) {
      const A = MAP.STATIONS[sa.id], B = MAP.STATIONS[sb.id];
      legs.push({ k: 'walk', pts: graphPath(ax, az, A.x, A.z).pts });
      if (sa.id !== 'C' && sb.id !== 'C') {
        // 모든 주민이 반드시 거쳐 가는 센트럴 환승역 — 잠깐 지상으로 나와 환승
        const C = MAP.STATIONS.C;
        legs.push({ k: 'ride', from: sa.id, to: 'C', t: 3 });
        legs.push({ k: 'walk', pts: [[C.x + 2.5, C.z - 1.5], [C.x, C.z]] });
        legs.push({ k: 'ride', from: 'C', to: sb.id, t: 3 });
      } else legs.push({ k: 'ride', from: sa.id, to: sb.id, t: 3 });
      legs.push({ k: 'walk', pts: graphPath(B.x, B.z, bx, bz).pts });
      return legs;
    }
    legs.push({ k: 'walk', pts: walk.pts });
    return legs;
  }
  // dest: { loc, x, z }
  function planRoute(v, dest, opts = {}) {
    const legs = [];
    let cur = { loc: v.loc, x: v.x, z: v.z };
    if (cur.loc === 'metro') return false;
    if (cur.loc !== 'island' && cur.loc !== dest.loc) {
      const dd = Sim.interiorDoor(cur.loc);
      legs.push({ k: 'walk', pts: [[dd.x, dd.z]] });
      legs.push({ k: 'exit', from: cur.loc });
      const pd = placeDoor(INT[cur.loc].place);
      cur = { loc: 'island', x: pd.x, z: pd.z };
    }
    if (dest.loc === cur.loc) {
      if (cur.loc === 'island') legs.push(...islandLegs(cur.x, cur.z, dest.x, dest.z, opts));
      else legs.push({ k: 'walk', pts: [[dest.x, dest.z]] });
    } else if (dest.loc !== 'island') {
      const pd = placeDoor(INT[dest.loc].place);
      legs.push(...islandLegs(cur.x, cur.z, pd.x, pd.z, opts));
      legs.push({ k: 'enter', to: dest.loc });
      legs.push({ k: 'walk', pts: [[dest.x, dest.z]] });
    }
    v.route = legs;
    v.routeT = 0;
    return true;
  }
  Sim.planRoute = planRoute;

  function doorOut(placeId) {
    const p = MAP.P[placeId];
    const d = placeDoor(placeId);
    // 문 밖으로 한 걸음
    const dx = d.x - p.x, dz = d.z - p.z, l = Math.hypot(dx, dz) || 1;
    return { x: d.x + dx / l * 0.8, z: d.z + dz / l * 0.8 };
  }

  // 한 틱 이동
  function moveAlong(v, dtR) {
    if (!v.route || !v.route.length) return true;
    const leg = v.route[0];
    if (leg.k === 'walk') {
      if (!leg.pts.length) { v.route.shift(); return !v.route.length; }
      let budget = speedOf(v) * dtR;
      while (budget > 0 && leg.pts.length) {
        const [tx, tz] = leg.pts[0];
        const dx = tx - v.x, dz = tz - v.z, d = Math.hypot(dx, dz);
        if (d < 0.05) { leg.pts.shift(); continue; }
        const s = Math.min(d, budget);
        v.x += dx / d * s; v.z += dz / d * s;
        v.ry = Math.atan2(dx, dz);
        budget -= s;
        if (s >= d - 1e-6) leg.pts.shift();
      }
      v.moving = true;
      if (!leg.pts.length) v.route.shift();
    } else if (leg.k === 'enter') {
      v.loc = leg.to;
      const dd = Sim.interiorDoor(leg.to);
      v.x = dd.x; v.z = dd.z - 0.3; v.ry = Math.PI;
      v.route.shift();
      emit('enter', { v, iid: leg.to });
    } else if (leg.k === 'exit') {
      const o = doorOut(INT[leg.from].place);
      v.loc = 'island'; v.x = o.x; v.z = o.z;
      v.route.shift();
    } else if (leg.k === 'ride') {
      if (v.loc !== 'metro') { v.loc = 'metro'; v.rideT = leg.t; v.rideTo = leg.to; S.stats.metroRiders = (S.stats.metroRiders || 0) + 1; }
      v.rideT -= dtR * S.speed; // 게임 분 단위 (1초 = 1분 × 배속)
      if (v.rideT <= 0) {
        const st = MAP.STATIONS[leg.to];
        v.loc = 'island'; v.x = st.x + rnd(-1, 1); v.z = st.z + rnd(0.5, 1.5);
        v.route.shift();
      }
    } else if (leg.k === 'wait') {
      leg.t -= dtR; if (leg.t <= 0) v.route.shift();
    }
    return !v.route.length;
  }

  // ---------------------------------------------------------
  // 주민 생성 — [1. 메인] + [2. 서브] + [3. 대화] + [4. 취향]
  // ---------------------------------------------------------
  const NAMES = ['모카', '보리', '덕배', '콩이', '몽실', '두부', '호두', '밤이', '쿠키', '라떼', '치즈', '망고', '자두', '구름', '솜이', '까미', '초코', '레오', '미미', '봉구',
    '탱자', '도토리', '감자', '찹쌀', '하루', '누리', '별이', '달이', '뭉치', '방울', '딸기', '호떡', '만두', '루루', '제리', '피치', '토리', '단비', '나비', '코코', '율무', '보라', '유자', '팥떡'];
  const QUIRKS = ['음치', '덜렁이', '손재주꽝', '허세', '겁쟁이', '장난기'];
  const DISLIKE = { ROMANTIC: ['sport'], ATHLETIC: ['book'], SCHOLARLY: ['party'], LAZY: ['sport'], EXTROVERT: ['book'], INTROVERT: ['party'], SNOB: ['weird'], CRANKY: ['romance', 'plush'], ARTISTIC: ['luxury'], ANXIOUS: ['weird', 'occult'] };

  function allKeys(v) {
    const k = [v.keys.L1, v.keys.L2, v.keys.L3, v.keys.L4, ...(v.extraMain || [])];
    if (v.child && v.child.third) k.push(v.child.third);
    return k.filter(Boolean);
  }
  Sim.allKeys = allKeys;
  const has = (v, k) => allKeys(v).includes(k);
  Sim.has = has;

  function comboTitle(v) {
    const ks = [v.keys.L1, v.keys.L2, v.keys.L3, v.keys.L4];
    for (const ex of D.COMBO_EXAMPLES) if (ex.keys.every((k, i) => ks[i] === k)) return ex.title;
    const noun = (D.TITLE_NOUN[v.keys.L1] || {})[v.keys.L4] || '주민';
    const a2 = D.TITLE_ADJ_L2[v.keys.L2] || '', a3 = D.TITLE_ADJ_L3[v.keys.L3] || '';
    return `${a3} ${a2} ${noun}`.replace(/\s+/g, ' ').trim();
  }

  // 4가지 수치 스탯 계산법 (Behavior Metrics)
  function deriveStats(v) {
    const keys = allKeys(v);
    const kws = keys.map(k => D.kw(k)).filter(Boolean);
    // 2) 이동 속도 & 템포 — 속도 가중치 합산
    let speed = 0;
    for (const k of kws) speed += k.speed || 0;
    // 1) 활동 범위 — 가장 좁은 영역 우선, 넓은 태그는 외출 명분
    const ranges = kws.map(k => k.range).filter(Boolean);
    let range = 'TOWN';
    if (ranges.length) range = ranges.reduce((a, b) => (D.RANGE[b].order < D.RANGE[a].order ? b : a));
    const excuse = ranges.some(r => D.RANGE[r].order > D.RANGE[range].order);
    // 3) 대기/휴식 시간
    const idles = kws.map(k => k.idle).filter(Boolean);
    let idle = [3, 5];
    if (idles.length) { const lo = idles.reduce((s, i) => s + D.IDLE[i][0], 0) / idles.length, hi = idles.reduce((s, i) => s + D.IDLE[i][1], 0) / idles.length; idle = [lo, hi]; }
    // 4) 행동 가중치 테이블 — 각 키워드는 고유 행동에 +30%
    const acts = {};
    for (const a of D.BASE_ACTIONS) acts[a] = 10;
    for (const k of kws) for (const a of k.acts || []) acts[a] = (acts[a] || 10) + 30;
    // 선호 오브젝트 (Priority 3)
    const pref = [...new Set(kws.flatMap(k => k.pref || []))];
    // 예시 합산 결과 [운동파]+[집돌이]: 활동 범위 "자기 집 마당 ~ 집 주변 10m"
    let radius = D.RANGE[range].radius;
    if (range === 'HOME' && excuse) radius = 10;
    v.stats = { speed, range, radius, excuse, idle, acts, pref };
    v.speedLabel = speed >= 40 ? '빠름 (달리기)' : speed >= 20 ? '약간 빠름' : speed > -10 ? '보통 걸음' : speed > -30 ? '느릿느릿' : '아주 느긋';
  }
  function speedOf(v) {
    let s = D.BASE_WALK * (1 + (v.stats ? v.stats.speed : 0) / 100);
    if (v.run) s *= 2.1;
    if (v.child) s *= v.child.stage === 'TODDLER' ? 0.5 : 0.85;
    if (v.slowWalk) s *= 0.5;                      // 유아 동행 산책 (속도 50% 감소)
    if (v.syncSpeed) s = v.syncSpeed;
    return Math.max(0.35, s) * S.speed;
  }
  Sim.speedOf = speedOf;

  function loveArchetype(v) {
    const pts = { BOLD: 0, SHY: 0, TSUNDERE: 0, FREE: 0 };
    for (const k of allKeys(v)) for (const a in pts) pts[a] += (D.LOVE_POINTS[a][k] || 0);
    let best = 'BOLD', bv = -1;
    for (const a in pts) if (pts[a] > bv) { bv = pts[a]; best = a; }
    if (bv === 0) best = { ROMANTIC: 'SHY', CRANKY: 'TSUNDERE', ARTISTIC: 'FREE' }[v.keys.L1] || 'BOLD';
    return best;
  }
  function jealousType(v) {
    const k = allKeys(v);
    if (k.includes('CRANKY') || k.includes('CYNICAL') || k.includes('SNOB')) return 'PASSIVE_AGGRESSIVE';
    if (k.includes('ATHLETIC') || k.includes('PASSIONATE') || k.includes('EXTROVERT')) return 'CONFRONTATIONAL';
    if (k.includes('ANXIOUS') || k.includes('INTROVERT') || k.includes('SHY') || k.includes('ROMANTIC')) return 'DEPRESSIVE';
    return 'PASSIVE_AGGRESSIVE';
  }
  // 24시간 패턴 A/B/C
  function patternOf(v) {
    const [a, b, c] = [v.keys.L1, v.keys.L2, v.keys.L3];
    if (a === 'ROMANTIC' && b === 'HOMEBODY' && c === 'SHY') return 'A';
    if (a === 'ATHLETIC' && b === 'BUSYBODY' && c === 'PASSIONATE') return 'B';
    if (a === 'CRANKY' && b === 'DILIGENT' && c === 'CYNICAL') return 'C';
    return null;
  }
  Sim.PATTERN_NAMES = { A: '달빛의 시인', B: '마을의 열정 코치', C: '비밀의 츤데레 정원사' };

  function derive(v) {
    deriveStats(v);
    v.title = v.customTitle || comboTitle(v);
    v.loveArch = loveArchetype(v);
    v.jealType = jealousType(v);
    v.pattern = patternOf(v);
    const l2 = D.L2[v.keys.L2] || {};
    v.wake = l2.wake !== undefined ? l2.wake : 7;
    v.sleepAt = l2.sleep !== undefined ? l2.sleep : 23;
    if (v.pattern === 'A') { v.wake = 8; v.sleepAt = 23; }
    if (v.pattern === 'B') { v.wake = 6; v.sleepAt = 22; }
    if (v.pattern === 'C') { v.wake = 7; v.sleepAt = 1; }
    v.giftLikes = [...new Set([...(D.L1[v.keys.L1].likes || []), ...(D.L4[v.keys.L4].likes || [])])];
    v.giftDislikes = (DISLIKE[v.keys.L1] || []).filter(t => !v.giftLikes.includes(t));
    v.clumsy = v.quirks.includes('덜렁이') || has(v, 'ANXIOUS') || has(v, 'DREAMY');
    v.toneDeaf = v.quirks.includes('음치');
    v.vain = v.quirks.includes('허세') || has(v, 'SNOB');
    v.coward = v.quirks.includes('겁쟁이') || has(v, 'ANXIOUS') || has(v, 'SHY');
    v.prankster = v.quirks.includes('장난기') || has(v, 'PRANKSTER');
    v.unskilled = v.quirks.includes('손재주꽝');
  }
  Sim.derive = derive;

  function freeName() {
    const used = new Set(S.villagers.map(v => v.name));
    const pool = NAMES.filter(n => !used.has(n));
    return pool.length ? pick(pool) : '주민' + (S.villagers.length + 1);
  }
  function freeAptRoom() {
    const used = new Set(S.villagers.map(v => v.home));
    return FM.APT_ROOMS.find(r => !used.has(r)) || null;
  }
  Sim.freeAptRoom = freeAptRoom;

  // 성격 조합이 옷차림과 표정에 묻어남
  const STYLE = {
    L1: {
      ROMANTIC: { top: ['dress', 'sweater'], pattern: ['heart', 'flower', 'dots'], cloth: [0xff8fb1, 0xffc6de, 0xfff4d6], hat: ['flower', 'bow', 'headband'], acc: ['lei', 'necklace'], eyes: ['sparkle', 'happy'] },
      ATHLETIC: { top: ['tee', 'hoodie'], pattern: ['stripe', 'plain', 'star'], cloth: [0xff6f61, 0x3a7bd5, 0xffd84a], bottom: ['shorts'], hat: ['cap', 'headband'], acc: ['backpack'], height: [1.02, 1.12] },
      SCHOLARLY: { top: ['sweater', 'vest'], pattern: ['plaid', 'plain'], cloth: [0x55624a, 0x8a5a3b, 0x2f4b6e], glasses: ['round', 'square'], acc: ['satchel', 'tie'], brows: ['thin'] },
      LAZY: { top: ['hoodie', 'sweater'], pattern: ['plain', 'snow'], cloth: [0x9aa7b0, 0xcfd6de, 0xb69cff], hat: ['nightcap', 'beanie'], eyes: ['sleepy'], width: [1.05, 1.15] },
      EXTROVERT: { top: ['aloha', 'tee'], pattern: ['stripe2', 'flower', 'star'], cloth: [0xffb13d, 0x4fc1c9, 0xff6f61], glasses: ['sun', 'heart'], acc: ['lei', 'scarf'], mouth: ['grin', 'open'] },
      INTROVERT: { top: ['hoodie', 'sweater'], pattern: ['plain', 'leaf'], cloth: [0x55624a, 0x9aa3ad, 0x2f4b6e], hat: ['beanie', 'headphones'], mouth: ['flat', 'w'] },
      SNOB: { top: ['vest', 'dress'], pattern: ['plain'], cloth: [0x2b2b30, 0xfff4d6, 0xb69cff], hat: ['crown', 'beret'], acc: ['bowtie', 'necklace', 'cape'], eyes: ['smug'] },
      CRANKY: { top: ['vest', 'tee'], pattern: ['plain', 'plaid'], cloth: [0x3a3a3a, 0x8a5a3b, 0x55624a], brows: ['angry', 'thick'], mouth: ['pout', 'flat'], acc: ['tie'] },
      ARTISTIC: { top: ['apron', 'aloha'], pattern: ['dots', 'stripe2', 'star'], cloth: [0x4fc1c9, 0xff8fb1, 0xffd84a], hat: ['beret'], acc: ['scarf'], hair: ['curly', 'afro', 'sidepart'] },
      ANXIOUS: { top: ['sweater', 'hoodie'], pattern: ['plain', 'dots'], cloth: [0xfff4d6, 0xcfd6de, 0x8fd3ff], brows: ['worried'], eyes: ['round'], acc: ['scarf'], height: [0.9, 0.98] },
    },
    // 생활 리듬 → 소품
    L2: {
      DILIGENT: { acc: ['tie', 'satchel'], hat: ['none', 'cap'] }, SLOTH: { hat: ['nightcap', 'none'], eyes: ['sleepy'], top: ['hoodie'] },
      CURIOUS: { acc: ['backpack', 'satchel'], glasses: ['round'], eyes: ['round', 'sparkle'] }, HOMEBODY: { top: ['sweater', 'hoodie'], acc: ['scarf'], pattern: ['snow', 'plaid'] },
      WANDERER: { acc: ['backpack'], hat: ['bucket', 'straw'] }, BUSYBODY: { acc: ['satchel'], mouth: ['open', 'grin'] },
      NIGHT_OWL: { hat: ['headphones', 'beanie'], cloth: [0x2f4b6e, 0x3a3a3a, 0xb69cff], pattern: ['star'] }, EARLY_BIRD: { hat: ['cap', 'headband'], cloth: [0xffd84a, 0xfff4d6, 0x8ee07a] },
    },
    // 말투 → 표정 · 색감
    L3: {
      WARM: { cloth: [0xffb13d, 0xfff4d6, 0xff8fb1], mouth: ['smile', 'w'], eyes: ['happy', 'dot'] }, FORMAL: { top: ['vest'], acc: ['bowtie', 'tie'], pattern: ['plain'] },
      CYNICAL: { eyes: ['smug'], mouth: ['flat'], cloth: [0x3a3a3a, 0x55624a] }, CUTE: { hat: ['bow', 'flower'], eyes: ['sparkle', 'dot'], mouth: ['w'], pattern: ['heart', 'dots'], glasses: ['heart', 'none'] },
      PRANKSTER: { eyes: ['wink'], mouth: ['grin', 'tooth'], pattern: ['stripe2', 'dots'] }, DREAMY: { eyes: ['star', 'sparkle'], hat: ['halo', 'flower'], cloth: [0xc9b3ff, 0x8fd3ff, 0xffc6de] },
      PASSIONATE: { cloth: [0xff6f61, 0xffb13d], brows: ['thick'], mouth: ['grin', 'open'], hat: ['headband'] }, SHY: { eyes: ['round', 'dot'], brows: ['worried'], acc: ['scarf'], mouth: ['w'] },
    },
    // 취미 → 아이템
    L4: {
      MUSIC: { hat: ['headphones'], pattern: ['star', 'stripe'] }, FASHION: { glasses: ['sun', 'heart'], acc: ['necklace', 'cape'], hat: ['beret', 'bow'] },
      FITNESS: { hat: ['headband', 'cap'], top: ['tee'], bottom: ['shorts'] }, STUDY: { glasses: ['round', 'square'], acc: ['satchel'] },
      OCCULT: { hat: ['horns', 'halo'], acc: ['cape'], eyes: ['star'], cloth: [0x2b2b30, 0xb69cff] }, GARDEN: { hat: ['straw', 'flower'], top: ['apron'], pattern: ['leaf', 'flower'] },
      FOOD: { top: ['apron'], hat: ['beanie', 'none'] }, CLEAN: { top: ['apron'], hat: ['headband'] }, GOSSIP: { acc: ['satchel', 'necklace'] },
      FISHING: { hat: ['bucket', 'straw'], top: ['vest', 'aloha'], acc: ['backpack'] },
    },
  };
  // 색을 살짝 흔들어 같은 성격끼리도 옷 색이 겹치지 않게
  const jitterC = c => { const r = ((c >> 16) & 255), g = ((c >> 8) & 255), b = c & 255, j = () => ((Math.random() - 0.5) * 36) | 0, k = x => Math.min(255, Math.max(0, x + j())); return (k(r) << 16) | (k(g) << 8) | k(b); };
  function styleByPersonality(l, keys) {
    const apply = (st, p) => {
      if (!st || !chance(p)) return;
      if (st.top && chance(0.7)) l.top = pick(st.top);
      if (st.pattern && chance(0.6)) l.pattern = pick(st.pattern);
      if (st.cloth && chance(0.7)) { l.shirt = pick(st.cloth); if (chance(0.5)) l.shirt2 = pick(st.cloth); }
      if (st.bottom) l.bottom = pick(st.bottom);
      if (st.hat && chance(0.55)) { l.hat = pick(st.hat); if (l.hat === 'halo') l.hatColor = 0xfff2a0; }
      if (st.glasses && chance(0.6)) l.glasses = pick(st.glasses);
      if (st.acc && chance(0.5)) l.acc = pick(st.acc);
      if (st.eyes && chance(0.5)) l.eyes = pick(st.eyes);
      if (st.brows && chance(0.6)) l.brows = pick(st.brows);
      if (st.mouth && chance(0.5)) l.mouth = pick(st.mouth);
      if (st.hair && l.species === 'human') l.hairStyle = pick(st.hair);
      if (st.height) l.height = +rnd(...st.height).toFixed(2);
      if (st.width) l.width = +rnd(...st.width).toFixed(2);
    };
    apply(STYLE.L1[keys.L1], 1);
    apply(STYLE.L2[keys.L2], 0.45);
    apply(STYLE.L3[keys.L3], 0.6);
    apply(STYLE.L4[keys.L4], 0.85);
    l.shirt = jitterC(l.shirt); l.shirt2 = jitterC(l.shirt2); l.pants = jitterC(l.pants);
    if (l.hat !== 'none' && l.hat !== 'halo') l.hatColor = jitterC(l.hatColor);
    if (l.top === 'dress') l.bottom = 'none';
  }
  Sim.styleByPersonality = styleByPersonality;
  function makeVillager(o = {}) {
    const keys = o.keys || {
      L1: pick(Object.keys(D.L1)), L2: pick(Object.keys(D.L2)), L3: pick(Object.keys(D.L3)), L4: pick(Object.keys(D.L4)),
    };
    let look = o.look || (window.ISLE && ISLE.randomLook ? ISLE.randomLook() : { species: 'cat' });
    if (!o.look && window.ISLE && ISLE.withSpecies) {
      // 이미 섬에 많은 종은 피해서 다양하게
      const count = {}; for (const v of (S ? S.villagers : [])) count[v.look && v.look.species] = (count[v.look && v.look.species] || 0) + 1;
      // 아직 없는(가장 적은) 종을 우선 → 섬에 같은 종이 겹치지 않게
      if (look.species === 'human' && chance(0.6) || (count[look.species] || 0) >= 1) {
        const all = Object.keys(ISLE.SPECIES).filter(k => k !== 'human');
        const min = Math.min(...all.map(k => count[k] || 0));
        const sps = all.filter(k => (count[k] || 0) === min);
        look = ISLE.withSpecies(look, pick(sps));
        if (ISLE.furVariant) Object.assign(look, ISLE.furVariant(look.species));
      }
      // 같은 종이 있으면 털색이 확실히 다르도록 다시 뽑기
      const dist = (a, b) => Math.abs(((a >> 16) & 255) - ((b >> 16) & 255)) + Math.abs(((a >> 8) & 255) - ((b >> 8) & 255)) + Math.abs((a & 255) - (b & 255));
      for (let t = 0; t < 12 && ISLE.furVariant; t++) {
        const clash = (S ? S.villagers : []).some(v => v.look && v.look.species === look.species && dist(v.look.fur, look.fur) < 90);
        if (!clash) break;
        Object.assign(look, ISLE.furVariant(look.species));
      }
      styleByPersonality(look, keys);
    }
    const qs = [];
    if (keys.L3 === 'PRANKSTER') qs.push('장난기');
    if (keys.L1 === 'SNOB' || keys.L3 === 'PASSIONATE') qs.push('허세');
    if (keys.L1 === 'ANXIOUS' || keys.L3 === 'SHY') qs.push('겁쟁이');
    if (chance(0.7)) qs.push(pick(QUIRKS));
    const v = {
      id: o.id || 'v' + (S.nextId++), name: o.name || freeName(), look, keys, extraMain: o.extraMain || [],
      phrase: o.phrase || '', quirks: [...new Set(qs)].slice(0, 2),
      likesKeys: o.likesKeys || [pick(Object.keys(D.L1)), pick(Object.keys(D.L3))],
      likesSpecies: o.likesSpecies || (chance(0.4) ? pick(window.ISLE && ISLE.SPECIES ? Object.keys(ISLE.SPECIES) : ['cat', 'dog', 'bear']) : null),
      home: o.home || freeAptRoom(), job: 'office', coins: rint(300, 1500), debt: 0,
      hunger: rint(10, 40), energy: 100, stress: rint(0, 25), depression: 0, mood: 70, reputation: 50, popularity: 0,
      loc: 'island', x: 0, z: 0, ry: 0, route: null, state: 'WALK', act: null, idleT: rnd(0, 3), prop: null, pose: null,
      bubble: null, emote: null, balloon: null, crush: null, jealousy: null, status: {}, outfit: null, sceneId: null, thought: null,
      child: o.child || null, birthDay: o.birthDay || 1, created: S ? day() : 1,
    };
    derive(v);
    return v;
  }
  Sim.makeVillager = makeVillager;

  function assignJobs() {
    for (const v of S.villagers) {
      if (v.child) { v.job = 'child'; continue; }
      if (v.job === 'anchor' || v.job === 'pharmacist') continue;
      v.job = (v.stats.range === 'HOME' || v.keys.L2 === 'NIGHT_OWL' || v.pattern) ? 'freelance' : 'office';
    }
    const adults = S.villagers.filter(v => !v.child);
    if (!adults.some(v => v.job === 'anchor')) {
      const c = adults.filter(v => v.job === 'office').sort((a, b) => (has(b, 'EXTROVERT') + has(b, 'FORMAL')) - (has(a, 'EXTROVERT') + has(a, 'FORMAL')))[0];
      if (c) c.job = 'anchor';
    }
    if (!adults.some(v => v.job === 'pharmacist')) {
      const c = adults.filter(v => v.job === 'office').sort((a, b) => (has(b, 'SCHOLARLY') + has(b, 'ANXIOUS')) - (has(a, 'SCHOLARLY') + has(a, 'ANXIOUS')))[0];
      if (c) c.job = 'pharmacist';
    }
  }
  Sim.assignJobs = assignJobs;
  Sim.JOB_NAMES = { office: '회사원 (오피스 타워)', freelance: '재택 프리랜서', anchor: '친구모아 뉴스 앵커', pharmacist: '24시 약국 약사', child: '어린이', none: '무직' };

  // 입주 (집 배정 + 방 기본 가구)
  function moveIn(v, silent) {
    if (!v.home) v.home = freeAptRoom();
    if (!v.home) return false;
    S.villagers.push(v);
    if (!S.rooms[v.home]) S.rooms[v.home] = FM.defaultRoom(v);
    const ap = doorOut('apartment');
    v.loc = v.home; const s = interiorSize(v.home); v.x = rnd(-s.w / 4, s.w / 4); v.z = rnd(-s.d / 4, s.d / 4);
    if (!silent) { Sim.log('move', `🏠 ${v.name}(${v.title})이(가) ${INT[v.home].name}에 입주했어요!`, [v.id], 2); }
    for (const o of S.villagers) if (o !== v) FM.Soc && FM.Soc.rel(v.id, o.id);
    FM.Soc && FM.Soc.rel(v.id, 'P');
    assignJobs();
    emit('villagers');
    return ap && true;
  }
  Sim.moveIn = moveIn;

  // ---------------------------------------------------------
  // 새 게임 / 불러오기
  // ---------------------------------------------------------
  function newState() {
    return {
      v: 1, time: 7 * 60, speed: 1, nextId: 1, seed: (Math.random() * 1e9) | 0,
      weather: { type: 'sunny', until: 0, wind: 0 },
      player: { name: '플레이어', look: null, coins: D.ECON.startCoins, stamina: 100, loc: 'island', x: 0, z: 2, ry: Math.PI, inv: { rose: 2, cookie: 3, can: 2, vacuum: 1, rod: 1, net: 1 },
        houseLevel: 1, knownSecrets: [], lastTalk: {}, lastRealVisit: Date.now(), spouse: null, lover: null, nick: {}, emote: null, hosting: null, follower: null, fishing: false },
      villagers: [], rel: {}, dir: {}, marriages: [], quests: [], mail: [], log: [], news: [], rooms: {}, plots: {}, flags: {}, capsules: [], appts: [],
      stats: {}, fx: [], newsIdx: 0, lastDay: 1, lastHour: 7, wishes: {}, visitors: [], flea: [], popup: null,
    };
  }
  // 플레이어 집 방 데이터 보장
  function ensurePlayerRoom() {
    if (!S || !S.rooms || S.rooms.home_p_in) return;
    const sz = interiorSize('home_p_in');
    S.rooms.home_p_in = FM.defaultRoom({ id: 'P', keys: S.player.keys || { L1: 'ROMANTIC', L2: 'HOMEBODY', L3: 'WARM', L4: 'STUDY' } }, sz.w, sz.d, FM.INTERIORS.home_p_in.door);
  }
  Sim.ensurePlayerRoom = ensurePlayerRoom;
  Sim.newGame = function (opts = {}) {
    S = newState();
    Sim.S = S;
    if (opts.playerLook) S.player.look = opts.playerLook;
    if (opts.playerName) S.player.name = opts.playerName;
    const n = opts.count || D.START_VILLAGERS;
    const imported = opts.imported || [];
    for (const c of imported) { if (S.villagers.length >= n) break; moveIn(makeVillager(c), true); }
    // 기획서의 예시 조합 3종(패턴 A/B/C)은 섬에 꼭 한 명씩 등장
    for (const ex of D.COMBO_EXAMPLES) {
      if (S.villagers.length >= n) break;
      if (S.villagers.some(v => ex.keys.every((k, i) => [v.keys.L1, v.keys.L2, v.keys.L3, v.keys.L4][i] === k))) continue;
      moveIn(makeVillager({ keys: { L1: ex.keys[0], L2: ex.keys[1], L3: ex.keys[2], L4: ex.keys[3] } }), true);
    }
    while (S.villagers.length < n) moveIn(makeVillager(), true);
    // 첫날 아침: 모두 자기 방에서 시작
    for (const v of S.villagers) { v.loc = v.home; const s = interiorSize(v.home); v.x = rnd(-1.5, 1.5); v.z = rnd(-1, 1); }
    ensurePlayerRoom();
    FM.Soc && FM.Soc.init && FM.Soc.init();
    FM.Ev && FM.Ev.init && FM.Ev.init();
    Sim.log('system', `🏝️ 친구모아 아일랜드에 오신 것을 환영해요! 주민 ${S.villagers.length}명이 아파트 "시티 타워"에 입주했어요.`, [], 3);
    emit('villagers');
    return S;
  };
  Sim.load = function (json) {
    S = json; Sim.S = S;
    for (const v of S.villagers) { derive(v); v.talkingToPlayer = false; v.followUse = null; v.route = null; v.sceneId = null; v.act = null; v.bubble = null; if (v.loc === 'metro') { v.loc = 'island'; const st = MAP.STATIONS.C; v.x = st.x; v.z = st.z + 1; } }
    S.fx = [];
    if (!S.rooms) S.rooms = {};
    // 예전 저장: 손대지 않은 주민 방은 성격에 맞는 레퍼런스 스타일 방으로 새로 꾸밈
    if (FM.RoomKit) for (const v of S.villagers) {
      const r = v.home && S.rooms[v.home];
      if (!r || (r.roomStyle !== undefined && (r.kitRev || 1) >= FM.RoomKit.REV) || r.theme || r.edited || r.atmoByPlayer || v.child) continue;
      const { w, d } = Sim.interiorSize(v.home);
      Object.assign(r, FM.RoomKit.styleRoom(r.roomStyle || FM.RoomKit.pickStyle(v.keys || {}, 0), w, d, (FM.INTERIORS[v.home] || {}).door));
    }
    ensurePlayerRoom();
    FM.Soc && FM.Soc.onLoad && FM.Soc.onLoad();
    emit('villagers');
    return S;
  };
  Sim.serialize = function () {
    const copy = Object.assign({}, S, { fx: [] });
    copy.villagers = S.villagers.map(v => Object.assign({}, v, { route: null, sceneId: null, act: null, bubble: null, stats: undefined }));
    return JSON.stringify(copy);
  };

  // ---------------------------------------------------------
  // 로그 (뉴스/소문의 재료)
  // ---------------------------------------------------------
  Sim.log = function (type, text, who = [], imp = 1, extra) {
    const e = Object.assign({ t: S.time, day: day(), hm: hm(), type, text: josa(text), who, imp }, extra || {});
    S.log.push(e);
    if (S.log.length > 400) S.log.splice(0, S.log.length - 400);
    emit('log', e);
    return e;
  };
  Sim.byId = id => (id === 'P' ? S.player : S.villagers.find(v => v.id === id));
  Sim.nameOf = id => (id === 'P' ? S.player.name : (Sim.byId(id) || {}).name || '???');

  // ---------------------------------------------------------
  // 말풍선 / 이모티콘 / 풍선
  // ---------------------------------------------------------
  Sim.say = (v, text, t = 3.2) => { text = josa(text); v.bubble = { text, until: S.realT + t }; emit('say', { v, text }); };
  Sim.emote = (v, e, t = 2.2) => { v.emote = { e, until: S.realT + t }; };
  // 고민 풍선 (!) — color: pink/red/purple/gray, kind: crush/jealous/bored/...
  Sim.balloon = (v, kind, color, data) => { v.balloon = { kind, color, data, since: S.time }; emit('balloon', v); };
  Sim.fx = (kind, at, extra) => { S.fx.push(Object.assign({ kind, at: at && at.id ? { id: at.id } : at, t: S.realT }, extra || {})); };

  // ---------------------------------------------------------
  // 장면(Scene) 엔진
  // ---------------------------------------------------------
  const scenes = [];
  Sim.scenes = scenes;
  let sceneSeq = 1;
  Sim.scene = function (def) {
    const actors = {};
    for (const [k, v] of Object.entries(def.actors || {})) {
      if (!v) return null;
      if (v.sceneId && !def.force) return null;
      // 플레이어와 대화 중인 주민은 다른 장면에 끌려가지 않음 (대화 선택지로 시작된 장면 제외)
      if (v.talkingToPlayer && !Sim.talkChoosing) { if (!def.major) return null; emit('talkInterrupt', v); v.talkingToPlayer = false; }
      actors[k] = v;
    }
    const sc = { id: sceneSeq++, title: def.title || '', major: !!def.major, steps: def.steps.slice(), actors, i: 0, st: null, t: 0, onEnd: def.onEnd, place: def.place, bgm: def.bgm };
    for (const v of Object.values(actors)) { if (v.sceneId) endScene(scenes.find(s => s.id === v.sceneId)); v.sceneId = sc.id; v.route = null; v.act = null; v.pose = null; releaseSpot(v); }
    scenes.push(sc);
    if (sc.major) emit('majorScene', sc);
    if (sc.bgm) emit('bgm', { key: sc.bgm, scene: sc.id, place: sc.place });
    return sc;
  };
  function endScene(sc, aborted) {
    if (!sc) return;
    const i = scenes.indexOf(sc); if (i >= 0) scenes.splice(i, 1);
    for (const v of Object.values(sc.actors)) if (v.sceneId === sc.id) { v.sceneId = null; v.pose = null; v.run = false; v.idleT = rnd(0.5, 1.5); }
    if (sc.bgm) emit('bgmEnd', { scene: sc.id });
    if (!aborted && sc.onEnd) try { sc.onEnd(sc); } catch (e) { console.error(e); }
    emit('sceneEnd', sc);
  }
  Sim.endScene = endScene;
  function resolveTarget(sc, to, actor) {
    if (!to) return null;
    if (to.actor) {
      const o = sc.actors[to.actor] || Sim.byId(to.actor);
      if (!o) return null;
      const ang = to.ang !== undefined ? to.ang : Math.atan2(actor.x - o.x, actor.z - o.z);
      const d = to.near !== undefined ? to.near : 1.2;
      return { loc: o.loc === 'metro' ? 'island' : o.loc, x: o.x + Math.sin(ang) * d, z: o.z + Math.cos(ang) * d };
    }
    if (to.place) {
      const p = MAP.P[to.place];
      if (to.spot) {
        const sp = SPOTS.find(s => s.place === to.place && s.tags.includes(to.spot));
        if (sp) return { loc: 'island', x: sp.x + (to.dx || 0), z: sp.z + (to.dz || 0) };
      }
      if (to.inside && p.interior) return { loc: p.interior, x: to.x || 0, z: to.z || 0 };
      return { loc: 'island', x: (to.x !== undefined ? to.x : p.x) + (to.dx || 0), z: (to.z !== undefined ? to.z : p.z) + (to.dz || 0) };
    }
    if (to.home) {
      const who = sc.actors[to.home] || actor;
      return { loc: who.home, x: to.x || 0, z: to.z || 0 };
    }
    return to;
  }
  const sceneSpeed = () => Math.min(S.speed, 3);
  function stepScene(sc, dtR) {
    const dt = dtR * sceneSpeed();
    if (sc.i >= sc.steps.length) { endScene(sc); return; }
    const step = sc.steps[sc.i];
    if (!sc.st) sc.st = startStep(sc, step);
    if (runStep(sc, step, sc.st, dt, dtR)) { sc.i++; sc.st = null; }
  }
  function startStep(sc, step) {
    const st = { t: 0 };
    const A = k => sc.actors[k];
    if (step.par) st.subs = step.par.map(s => ({ s, st: startStep(sc, s), done: false }));
    else if (step.go) {
      const v = A(step.go);
      if (v) {
        const tgt = resolveTarget(sc, step.to, v);
        v.run = !!step.run;
        if (tgt) planRoute(v, tgt, step.opts || {});
        if (step.slow) v.slowWalk = true;
      }
    } else if (step.say) {
      const v = A(step.say); if (v) { const text = typeof step.text === 'function' ? step.text(sc) : step.text; Sim.say(v, text, (step.t || 3) / sceneSpeed() + 0.3); if (sc.major || step.log) Sim.log('talk', `${v.name}: "${text}"`, [v.id], 0); }
    } else if (step.emote) { const v = A(step.emote); if (v) Sim.emote(v, step.e, (step.t || 2) / sceneSpeed() + 0.3); }
    else if (step.pose) { const v = A(step.pose); if (v) { v.pose = step.p; v.prop = step.prop !== undefined ? step.prop : v.prop; v.poseT = 0; } }
    else if (step.face) { const v = A(step.face), o = A(step.at) || Sim.byId(step.at); if (v && o) v.ry = Math.atan2(o.x - v.x, o.z - v.z); }
    else if (step.fx) { const v = A(step.at); Sim.fx(step.fx, v, step.extra); }
    else if (step.sfx) emit('sfx', { key: step.sfx, at: A(step.at) });
    else if (step.bgm) emit('bgm', { key: step.bgm, scene: sc.id, place: sc.place });
    else if (step.do) { try { step.do(sc); } catch (e) { console.error(e); } }
    else if (step.tp) { const v = A(step.tp); if (v) { v.loc = step.loc || v.loc; v.x = step.x; v.z = step.z; v.route = null; } }
    return st;
  }
  function runStep(sc, step, st, dt, dtR) {
    st.t += dt;
    if (step.par) { let all = true; for (const s of st.subs) { if (!s.done) s.done = runStep(sc, s.s, s.st, dt, dtR); all = all && s.done; } return all; }
    if (step.go) {
      const v = sc.actors[step.go];
      if (!v) return true;
      const done = moveAlong(v, dtR);
      if (done || st.t > (step.max || 90)) { v.moving = false; v.run = false; v.slowWalk = false; if (!done) { v.route = null; } return true; }
      return false;
    }
    if (step.say) return st.t >= (step.t || 3);
    if (step.emote) return st.t >= (step.wait || 0.1);
    if (step.pose) return st.t >= (step.t || 0.01);
    if (step.wait) return st.t >= step.wait;
    return true;
  }

  // ---------------------------------------------------------
  // 스폿 선택 / 점유
  // ---------------------------------------------------------
  function releaseSpot(v) {
    if (v.spot) { if (v.spot.occ === v.id) v.spot.occ = null; v.spot = null; }
  }
  Sim.releaseSpot = releaseSpot;
  function homeCenter(v) {
    const pid = INT[v.home] ? INT[v.home].place : 'apartment';
    const d = placeDoor(pid);
    return d;
  }
  Sim.homeCenter = homeCenter;
  function yardPlace(v) {
    const pid = INT[v.home] ? INT[v.home].place : 'apartment';
    return pid === 'apartment' ? 'apt_yard' : pid;
  }
  Sim.yardPlace = yardPlace;

  // 활동 범위 안에 있는지
  function inRange(v, x, z) {
    const r = v.stats.radius;
    if (r >= 999) return true;
    const c = homeCenter(v);
    if (v.stats.range === 'TOWN') return Math.hypot(x - c.x, z - c.z) < 60 || T.district(x, z) === 'CORE';
    return Math.hypot(x - c.x, z - c.z) < r + 6;
  }
  Sim.inRange = inRange;

  function findSpots(filter) { return SPOTS.filter(filter); }
  function chooseSpot(v, opts = {}) {
    const tags = opts.tags;
    let cand = SPOTS.filter(s => (!s.occ || s.occ === v.id) && (!tags || tags.some(t => s.tags.includes(t))));
    if (opts.district) cand = cand.filter(s => s.district === opts.district);
    if (opts.place) cand = cand.filter(s => s.place === opts.place);
    if (!opts.ignoreRange) { const inR = cand.filter(s => inRange(v, s.x, s.z)); if (inR.length) cand = inR; else if (!opts.allowOut) return null; }
    if (!cand.length) return null;
    if (opts.near) cand.sort((a, b) => Math.hypot(a.x - v.x, a.z - v.z) - Math.hypot(b.x - v.x, b.z - v.z));
    // 떠돌이: 외딴곳 선호
    if (has(v, 'WANDERER') && !opts.near) cand.sort((a, b) => Math.hypot(b.x, b.z) - Math.hypot(a.x, a.z));
    const top = cand.slice(0, opts.near ? 3 : Math.max(4, Math.ceil(cand.length / (has(v, 'WANDERER') ? 3 : 1))));
    return pick(top);
  }
  Sim.chooseSpot = chooseSpot;

  // 실내 가구 사용 지점
  function furnUses(iid, filter) {
    const room = S.rooms[iid] || INT[iid];
    const furn = (room && room.furn) || [];
    const out = [];
    furn.forEach((f, idx) => {
      const F = FM.FURN[f.type]; if (!F || !F.use) return;
      F.use.forEach((u, ui) => {
        const r = (f.rot || 0) * Math.PI / 180;
        const x = f.x + u.dx * Math.cos(r) + u.dz * Math.sin(r), z = f.z - u.dx * Math.sin(r) + u.dz * Math.cos(r);
        const o = { iid, idx, ui, f, F, u, x, z, ry: ((u.face || 0) + (f.rot || 0)) * Math.PI / 180, key: iid + ':' + idx + ':' + ui };
        if (!filter || filter(o)) out.push(o);
      });
    });
    return out;
  }
  Sim.furnUses = furnUses;
  const useOcc = {};
  Sim.useOcc = useOcc;
  function takeUse(v, u) { if (v.useKey) delete useOcc[v.useKey]; v.useKey = u.key; useOcc[u.key] = v.id; }
  function freeUse(v) { if (v.useKey && useOcc[v.useKey] === v.id) delete useOcc[v.useKey]; v.useKey = null; }
  Sim.freeUse = freeUse;

  // ---------------------------------------------------------
  // 스케줄 (24시간)
  // ---------------------------------------------------------
  function asleep(v, h) {
    if (v.status.nightOut && inH(h, v.sleepAt, v.sleepAt + 3)) return false;
    return inH(h, v.sleepAt, v.wake);
  }
  Sim.asleep = asleep;
  function dayPref(v) {
    // 오늘 놀러 갈 지구 (주민+날짜 시드)
    const r = mulberry32((day() * 131 + v.id.charCodeAt(1) * 7 + v.id.length) | 0);
    const w = { CORE: 2, WEST: 1, EAST: 1, NORTH: 0.6, SOUTH: 0.8 };
    const k = allKeys(v);
    const bump = (d, ks, n) => { for (const x of ks) if (k.includes(x)) w[d] += n; };
    bump('WEST', ['INTROVERT', 'SCHOLARLY', 'ROMANTIC', 'GARDEN', 'STUDY', 'ANXIOUS', 'DREAMY', 'HOMEBODY'], 1.2);
    bump('EAST', ['EXTROVERT', 'SNOB', 'FASHION', 'FOOD', 'ATHLETIC', 'PASSIONATE', 'MUSIC'], 1.2);
    bump('NORTH', ['ROMANTIC', 'OCCULT', 'WANDERER', 'ARTISTIC'], 1.1);
    bump('SOUTH', ['LAZY', 'FISHING', 'ATHLETIC', 'SLOTH'], 1.0);
    bump('CORE', ['GOSSIP', 'BUSYBODY', 'EXTROVERT', 'SNOB'], 1.0);
    if (S.weather.type === 'rain') { w.SOUTH *= 0.3; w.NORTH *= 0.5; }
    let sum = 0; for (const d in w) sum += w[d];
    let x = r() * sum; for (const d in w) { x -= w[d]; if (x <= 0) return d; }
    return 'CORE';
  }
  Sim.dayPref = dayPref;

  // 현재 시간 블록
  function block(v) {
    const h = hour(), wd = weekday(), we = wd >= 5;
    if (v.status.hospital) return { k: 'hospital' };
    if (v.child) return childBlock(v, h, wd);
    if (asleep(v, h)) return { k: 'sleep' };
    // 패턴 A/B/C (복합 성격별 24시간 행동 알고리즘)
    if (v.pattern === 'A') {
      if (inH(h, 8, 12)) return { k: 'home', acts: ['read_book', 'write_poem'], label: '[기상 및 집 안 생활] 연애소설 읽기' };
      if (inH(h, 12, 16)) return { k: 'free', radius: 10, prefer: ['bench', 'flowers'], acts: ['read_book', 'observe_bugs'], label: '[조용한 외출] 집 주변 10m 이내' };
      if (inH(h, 16, 19)) return { k: 'free', radius: 10, avoidOthers: 5, acts: ['read_book', 'watch_sky'], label: '[타 주민 회피]' };
      return { k: 'go', district: 'NORTH', tags: ['hill', 'sea', 'stars'], acts: ['stargaze', 'write_poem', 'watch_sea'], label: '[밤 산책 & 감성 타임]' };
    }
    if (v.pattern === 'B') {
      if (inH(h, 6, 9)) return { k: 'go', place: 'plaza', tags: ['plaza', 'dumbbell'], acts: ['jog', 'workout', 'stretch'], run: true, label: '[새벽 조깅 & 기지개]' };
      if (inH(h, 9, 14)) return { k: 'free', world: true, meddle: true, acts: ['meddle', 'chat', 'stretch'], label: '[주민 간섭 & 수다]' };
      if (inH(h, 14, 18)) return { k: 'free', world: true, tags: ['trees'], acts: ['stick_swing', 'shake_tree'], coachPlayer: true, label: '[체육 활동 및 플레이어 참견]' };
      return { k: 'free', world: true, noSit: true, acts: ['jog', 'stretch'], label: '[야간 운동 & 고백 직진]' };
    }
    if (v.pattern === 'C') {
      if (inH(h, 7, 11)) return { k: 'free', world: true, tags: ['flowers'], acts: ['water_flowers', 'pull_weeds'], label: '[마을 환경 정비]' };
      if (inH(h, 11, 15)) return { k: 'free', tags: ['bench'], acts: ['drink_can', 'sit_bench'], leaveIfJoined: true, label: '[츤데레 상호작용]' };
      if (inH(h, 15, 20)) return { k: 'free', nearFriend: true, acts: ['water_flowers', 'look_around'], label: '[비밀 선물 & 짝사랑 챙기기]' };
      return { k: 'free', tags: ['trees', 'bench', 'quiet'], acts: ['drink_can', 'alone_sit'], label: '[야간 홀로 휴식]' };
    }
    // 직업
    if (!we && v.job === 'anchor' && inH(h, 8.5, 19.6)) return { k: 'work', place: 'studio', label: '방송국 근무' };
    if (!we && v.job === 'pharmacist' && inH(h, 9, 18)) return { k: 'work', place: 'medical', label: '약국 근무' };
    if (!we && v.job === 'office') {
      if (inH(h, v.wake, 8.5)) {
        if (has(v, 'ATHLETIC') || has(v, 'DILIGENT') || has(v, 'EARLY_BIRD') || has(v, 'FITNESS')) return { k: 'go', place: 'plaza', tags: ['plaza'], acts: ['jog', 'stretch', 'morning_stretch'], label: '아파트 기상 ➔ 광장 조깅' };
        return { k: 'home', acts: ['cook', 'breakfast'], label: '아침 식사' };
      }
      if (inH(h, 8.5, 9)) return { k: 'commute', to: 'office', label: '지하철역 이용 (남쪽 오피스로 출근)' };
      if (inH(h, 9, 12) || inH(h, 13, 18)) return { k: 'work', place: 'office', label: '오피스 타워 근무' };
      if (inH(h, 12, 13)) return { k: 'go', district: 'SOUTH', tags: ['pocha', 'sand', 'deck'], acts: ['eat_snack', 'watch_sea'], label: '12:00 해변/포장마차 점심' };
      if (inH(h, 18, 19)) return { k: 'commute', to: 'home', label: '퇴근길 지하철역 집결' };
      if (inH(h, 19, 19.5)) return { k: 'go', place: 'studio', tags: ['news'], acts: ['look_around'], label: '광장 전광판 뉴스 시청' };
    }
    if (!we && v.job === 'freelance' && (inH(h, 10, 12) || inH(h, 14, 16))) return { k: 'home', acts: ['work_home'], label: '재택 근무' };
    // 저녁/밤
    if (inH(h, 22, 5)) {
      const party = has(v, 'EXTROVERT') || has(v, 'PASSIONATE') || has(v, 'MUSIC') || has(v, 'NIGHT_OWL');
      if (party && (we || chance(0.02)) && v.stats.range !== 'HOME') return { k: 'go', place: 'club', inside: true, label: '올나잇 클럽' };
      if (has(v, 'OCCULT') || has(v, 'NIGHT_OWL')) return { k: 'go', place: 'observatory', tags: ['stars', 'campfire'], acts: ['stargaze'], label: '별빛 천문대' };
    }
    if (inH(h, 21, 2) && (has(v, 'INTROVERT') || has(v, 'ROMANTIC') || v.depression > 40) && v.stats.range !== 'HOME') return { k: 'go', place: 'teahouse', inside: true, label: '달빛 차관 / 비밀의 숲' };
    if (inH(h, 20, 24) || inH(h, 0, 5)) return { k: 'home', label: '방 안 혼자 놀기' };
    // 자유 시간 (주말/퇴근 후)
    return { k: 'free', label: we ? '주말 나들이' : '자유 시간' };
  }
  Sim.block = block;
  function childBlock(v, h, wd) {
    const c = v.child;
    if (c.stage === 'BABY') return { k: 'baby' };
    if (inH(h, 20, 7.5)) return { k: 'sleep' };
    if (c.stage === 'TODDLER') return { k: 'toddler' };
    if (wd < 5 && inH(h, 9, 13)) return { k: 'work', place: 'school', label: '마을 학교' };
    if (inH(h, 14, 17)) return { k: 'go', place: 'playground', tags: ['playground'], acts: ['look_around'], kids: true, label: '어린이 모임 (Kids Club)' };
    return { k: 'free', label: '마을 탐험' };
  }

  // ---------------------------------------------------------
  // 행동 두뇌
  // ---------------------------------------------------------
  function nearbyVillagers(v, r) {
    return S.villagers.filter(o => o !== v && o.loc === v.loc && o.loc !== 'metro' && Math.hypot(o.x - v.x, o.z - v.z) < r);
  }
  Sim.nearby = nearbyVillagers;

  function goSpot(v, sp, actId) {
    releaseSpot(v); freeUse(v);
    if (sp.seat) sp.occ = v.id;
    v.spot = sp;
    v.pendingAct = actId || null;
    const jx = sp.seat ? 0 : rnd(-0.6, 0.6), jz = sp.seat ? 0 : rnd(-0.6, 0.6);
    planRoute(v, { loc: 'island', x: sp.x + jx, z: sp.z + jz });
    v.state = v.run ? 'RUN' : 'WALK';
  }
  function goUse(v, u, actId) {
    releaseSpot(v); freeUse(v);
    takeUse(v, u);
    v.useTarget = u;
    v.pendingAct = actId || u.u.act;
    planRoute(v, { loc: u.iid, x: u.x, z: u.z });
    v.state = 'WALK';
  }
  Sim.goUse = goUse;
  Sim.goSpot = goSpot;

  function startAct(v, id, extra = {}) {
    const A = D.ACTIONS[id] || {};
    v.act = Object.assign({ id, t: (extra.dur || A.dur || 4) * rnd(0.8, 1.3), name: A.name || extra.name || id }, extra);
    v.state = extra.state || A.state || 'INTERACT_OBJ';
    v.pose = extra.pose || A.pose || null;
    v.prop = extra.prop !== undefined ? extra.prop : (A.prop || heldItem(v, v.state));
    if (A.emote && chance(0.6)) Sim.emote(v, A.emote);
    if (v.spot && v.spot.face !== undefined) v.ry = v.spot.face;
    // 섬의 벤치/카페 의자에 앉으면 좌석 높이에 맞춰 앉음
    if (v.loc === 'island' && v.spot && v.spot.seat && !v.spot.lie && v.spot.tags.includes('bench') && v.act.seatH === undefined && Math.hypot(v.x - v.spot.x, v.z - v.spot.z) < 0.8) v.act.seatH = v.spot.tags.includes('cafe') ? 0.48 : 0.49;
    if (v.useTarget && v.useTarget.ry !== undefined) v.ry = v.useTarget.ry;
    FM.bus.emit('act', { v, id });
    if (FM.Ev && FM.Ev.onAct) FM.Ev.onAct(v, id);
  }
  Sim.startAct = startAct;
  // 행동 상태별로 손에 쥐는 아이템 (특이 취향 우선)
  function heldItem(v, state) {
    const l4 = D.L4[v.keys.L4];
    if (state === 'WALK' || state === 'RUN') {
      if (v.keys.L4 === 'FOOD') return pick(['can', 'snack', 'sandwich']);
      if (v.keys.L4 === 'FISHING') return pick(['rod', 'net']);
      if (v.keys.L4 === 'STUDY') return chance(0.4) ? 'book' : null;
      if (v.keys.L4 === 'FITNESS') return chance(0.4) ? 'dumbbell' : null;
      return chance(0.15) ? pick(['can', 'snack']) : null;
    }
    if (state === 'SIT_REST') return pick(l4 && l4.props && chance(0.5) ? l4.props : ['book', 'snack', 'can', 'magnifier']);
    if (state === 'TALK_NPC') return chance(0.4) ? 'drink' : null;
    if (state === 'WATCH_LOOK') return chance(0.3) ? pick(['telescope', 'camera', 'magnifier']) : null;
    if (state === 'HOME_LIFE') return null;
    return null;
  }

  // 도착 후 행동 주사위 (Action Priority Weight)
  function rollAction(v, sp, preferActs) {
    const h = hour();
    const w = {};
    const add = (id, n) => { w[id] = (w[id] || 0) + n; };
    for (const [id, n] of Object.entries(v.stats.acts)) add(id, n);
    if (preferActs) for (const a of preferActs) add(a, 60);
    for (const id of Object.keys(w)) {
      const A = D.ACTIONS[id];
      if (!A) { delete w[id]; continue; }
      if (A.need && !(sp && sp.tags.includes(A.need))) delete w[id];
      else if (A.night && !inH(h, 19, 5)) delete w[id];
      else if (A.morning && !inH(h, 5, 10)) delete w[id];
      else if (A.home || A.yard) delete w[id];
      else if (A.seat && !(sp && sp.seat)) w[id] *= 0.35;
    }
    if (sp && sp.tags.includes('fountain')) add('look_around', 15);
    if (sp && sp.seat) add('sit_bench', 25);
    // 게으름: 의자나 나무 그늘만 보이면 누워서 쉼
    if (has(v, 'SLOTH') && sp && (sp.seat || sp.tags.includes('trees'))) add(sp.seat ? 'nap' : 'lie_shade', 80);
    if (!Object.keys(w).length) return 'look_around';
    return weighted(w);
  }
  Sim.rollAction = rollAction;

  // 실내(집) 행동
  const HOME_ACTS = { sleep: 'HOME_LIFE', cook: 'HOME_LIFE', sofa: 'HOME_LIFE', read_book: 'HOME_LIFE', diary: 'HOME_LIFE', mirror: 'HOME_LIFE', karaoke: 'HOME_LIFE', treadmill: 'HOME_LIFE',
    trampoline: 'HOME_LIFE', massage: 'HOME_LIFE', wardrobe: 'HOME_LIFE', hug_doll: 'HOME_LIFE', stare_photo: 'HOME_LIFE', watch_tv: 'HOME_LIFE', breakfast: 'HOME_LIFE' };
  function homeAction(v, preferActs) {
    const iid = v.loc;
    const uses = furnUses(iid, u => !useOcc[u.key] || useOcc[u.key] === v.id);
    const w = {};
    uses.forEach((u, i) => {
      let n = 10;
      const a = u.u.act;
      if (a === 'sleep') n = asleep(v, hour()) ? 400 : (has(v, 'SLOTH') || has(v, 'LAZY') ? 12 : 2);
      if (preferActs && preferActs.includes(a)) n += 80;
      if (a === 'cook' || a === 'breakfast') n += inH(hour(), 6, 9) || inH(hour(), 18, 20) ? 30 : 0;
      if (a === 'workout' || a === 'treadmill' || a === 'sandbag' || a === 'trampoline') n += has(v, 'ATHLETIC') || has(v, 'FITNESS') ? 40 : 0;
      if (a === 'read_book' || a === 'diary' || a === 'study') n += has(v, 'STUDY') || has(v, 'SCHOLARLY') || has(v, 'INTROVERT') ? 35 : 0;
      if (a === 'mirror' || a === 'wardrobe') n += has(v, 'FASHION') || v.vain ? 40 : 0;
      if (a === 'karaoke' || a === 'listen_radio' || a === 'lp') n += has(v, 'MUSIC') ? 45 : 0;
      if (a === 'stare_photo') n += v.crush ? 60 : 0;
      if (a === 'hug_doll') n += has(v, 'ANXIOUS') || has(v, 'INTROVERT') ? 25 : 0;
      if (a === 'nibble' && has(v, 'FOOD')) n += 40;
      if (a === 'meditate' || a === 'pilot' || a === 'shake_bars' || a === 'rope_bounce' || a === 'bubble_slide' || a === 'hammer') n += 35; // 테마 전용 행동
      w[i] = n;
    });
    // 엉뚱 모션 (벽에 머리 박기, 방바닥 구르기, 가사 짓기, 표정 연습)
    const quirkW = 18;
    if (!uses.length || chance(0.22)) {
      const q = pick([['roll', '방바닥에서 영문 모를 구르기'], ['headbang', '벽에 머리 박고 고민하기'], ['lyrics', '혼잣말로 노래 가사 짓기'], ['faces', '혼자 거울 보고 특이한 표정 짓기'], ['dance', '혼자 춤추기'], ['clean', '방 청소']]);
      const s = interiorSize(iid);
      planRoute(v, { loc: iid, x: rnd(-s.w / 3, s.w / 3), z: rnd(-s.d / 3, s.d / 3) });
      v.pendingAct = 'quirk:' + q[0]; v.pendingName = q[1];
      return;
    }
    const idx = weighted(w);
    const u = uses[idx];
    if (u) goUse(v, u);
    void quirkW;
  }
  Sim.homeAction = homeAction;

  // 한 명의 두뇌
  // 배고프면 먹으러 감 (집 주방 / 카페 / 편의점 / 포장마차 / 회전초밥)
  function goEat(v) {
    if (v.loc === v.home || v.stats.range === 'HOME') {
      const k = furnUses(v.home, u => ['cook', 'breakfast', 'nibble', 'eat'].includes(u.u.act))[0];
      if (k) { if (v.loc !== v.home) { planRoute(v, { loc: v.home, x: 0, z: 0 }); v.pendingAct = null; return true; } goUse(v, k); return true; }
      startAct(v, 'eat_snack', { state: 'HOME_LIFE', dur: 6 }); v.hunger = 20; return true;
    }
    const opts = v.status.poorUntil ? ['conv'] : [T.district(v.x, v.z) === 'EAST' ? pick(['sushi', 'pub', 'conv']) : T.district(v.x, v.z) === 'SOUTH' ? 'pocha' : pick(['cafe', 'conv'])];
    const o = opts[0];
    if (o === 'pocha') { const sp = SPOTS.find(s => s.tags.includes('pocha') && !s.occ); if (sp) { goSpot(v, sp, 'eat_snack'); return true; } }
    if (o === 'cafe') { const sp = SPOTS.find(s => s.tags.includes('cafe') && !s.occ); if (sp) { goSpot(v, sp, 'eat_snack'); return true; } }
    const p = MAP.P[o];
    if (p && p.interior) { planRoute(v, { loc: p.interior, x: rnd(-1, 1), z: rnd(-0.5, 1) }); v.pendingAct = 'eat_out'; return true; }
    return false;
  }
  function think(v) {
    const blk = block(v);
    v.blockLabel = blk.label || '';
    if (v.hunger > 70 && !v.child && ['free', 'home', 'go'].includes(blk.k) && !v.status.hospital && goEat(v)) return;
    // 관계 레이어가 먼저 덮어씀 (육아 > 짝사랑/질투/이별 > 일상)
    if (FM.Soc && FM.Soc.override) { if (FM.Soc.override(v, blk)) return; }
    switch (blk.k) {
      case 'hospital': return goHospital(v);
      case 'sleep': return goSleep(v);
      case 'home': return goHome(v, blk.acts);
      case 'work': return goWork(v, blk.place);
      case 'commute': {
        if (blk.to === 'office') { dressFor(v, 'suit'); planRoute(v, { loc: 'office_in', x: rnd(-4, 0), z: rnd(-2, 2) }, { viaMetro: true }); v.state = 'WALK'; v.pendingAct = null; return; }
        planRoute(v, { loc: 'island', x: MAP.STATIONS.C.x + rnd(-2, 2), z: MAP.STATIONS.C.z + rnd(1, 3) }, { viaMetro: true }); v.state = 'WALK'; v.pendingAct = null; return;
      }
      case 'go': return goBlock(v, blk);
      case 'baby': return babyThink(v);
      case 'toddler': return FM.Soc && FM.Soc.toddlerThink ? FM.Soc.toddlerThink(v) : goHome(v);
      default: return freeThink(v, blk);
    }
  }
  Sim.think = think;

  function goHospital(v) {
    const beds = furnUses('med_in', u => u.u.act === 'hospital');
    const u = beds.find(b => !useOcc[b.key] || useOcc[b.key] === v.id);
    if (v.loc === 'med_in' && v.useKey) { startAct(v, 'hospital', { state: 'SIT_REST', pose: 'sleep', dur: 20, name: '입원 중' }); return; }
    if (u) goUse(v, u, 'hospital'); else { planRoute(v, { loc: 'med_in', x: 0, z: 2 }); v.pendingAct = 'look_around'; }
  }
  function goSleep(v) {
    const home = v.home;
    if (v.loc !== home) { planRoute(v, { loc: home, x: 0, z: 0 }); v.state = 'WALK'; v.pendingAct = null; dressFor(v, null); return; }
    // 최악의 테마: 밤에 불 끄고 구석에 앉아있음
    const room = S.rooms[home];
    if (room && room.hateNight && inH(hour(), 21, 2)) {
      room.lightOn = false;
      const s = interiorSize(home);
      if (Math.hypot(v.x + s.w / 2 - 0.7, v.z + s.d / 2 - 0.7) > 0.5) { planRoute(v, { loc: home, x: -s.w / 2 + 0.7, z: -s.d / 2 + 0.7 }); v.pendingAct = 'corner'; return; }
      startAct(v, 'corner', { state: 'HOME_LIFE', pose: 'sadSit', dur: 20, name: '불 끄고 구석에 앉아있음' });
      return;
    }
    const beds = furnUses(home, u => u.u.act === 'sleep');
    let u = beds.find(b => useOcc[b.key] === v.id) || beds.find(b => !useOcc[b.key]) || beds[0];
    if (u && v.useKey === u.key && Math.hypot(v.x - u.x, v.z - u.z) < 0.4) {
      startAct(v, 'sleep', { state: 'HOME_LIFE', pose: 'sleep', dur: 30, name: '침대 수면', prop: null });
      if (room) room.lightOn = false;
      return;
    }
    if (u) { if (useOcc[u.key] && useOcc[u.key] !== v.id) { const sp = { ...u, key: u.key + ':2', x: u.x + 0.5 }; goUse(v, sp, 'sleep'); } else goUse(v, u, 'sleep'); }
    else startAct(v, 'sleep', { state: 'HOME_LIFE', pose: 'sleep', dur: 30, name: '바닥에서 수면' });
  }
  function goHome(v, acts) {
    if (v.loc !== v.home) { planRoute(v, { loc: v.home, x: 0, z: 0.5 }); v.state = 'WALK'; v.pendingAct = null; return; }
    const room = S.rooms[v.home];
    if (room && !room.lightOn && !asleep(v, hour())) room.lightOn = true;
    if (acts && acts.includes('work_home') && chance(0.6)) {
      const desk = furnUses(v.home, u => u.F.tags && u.F.tags.includes('desk'))[0];
      if (desk) { goUse(v, desk, 'work_home'); return; }
    }
    homeAction(v, acts);
  }
  function goWork(v, placeId) {
    const p = MAP.P[placeId];
    const iid = p.interior;
    if (v.loc !== iid) { if (placeId === 'office' || placeId === 'studio' || placeId === 'medical') dressFor(v, 'suit'); if (v.child) dressFor(v, 'uniform'); planRoute(v, { loc: iid, x: rnd(-2, 2), z: rnd(-1, 1) }); v.state = 'WALK'; v.pendingAct = null; return; }
    let filt = u => ['work_desk', 'copier', 'pantry', 'gossip_cooler', 'anchor', 'staff', 'class', 'boss'].includes(u.u.act);
    if (placeId === 'studio') filt = u => u.u.act === 'anchor';
    if (placeId === 'medical') filt = u => u.u.act === 'staff';
    if (placeId === 'school') filt = u => u.u.act === 'class';
    const uses = furnUses(iid, u => filt(u) && (!useOcc[u.key] || useOcc[u.key] === v.id));
    let u = uses.find(x => useOcc[x.key] === v.id);
    if (!u || chance(0.3)) {
      const pool = uses.filter(x => x.u.act !== 'boss');
      u = pick(pool.filter(x => x.u.act === 'work_desk' || x.u.act === 'anchor' || x.u.act === 'staff' || x.u.act === 'class').concat(chance(0.2) ? pool : [])) || pool[0];
    }
    if (u) goUse(v, u); else startAct(v, 'look_around');
  }
  function goBlock(v, blk) {
    v.run = !!blk.run;
    if (blk.inside) {
      const p = MAP.P[blk.place];
      if (v.loc === p.interior) return venueAction(v, p.interior);
      planRoute(v, { loc: p.interior, x: rnd(-2, 2), z: rnd(-1, 2) }); v.pendingAct = null; v.state = 'WALK'; return;
    }
    const sp = chooseSpot(v, { tags: blk.tags, place: blk.place, district: blk.district, ignoreRange: true });
    if (!sp) return freeThink(v, blk);
    if (v.spot === sp && dist(v, sp) < 2) {
      if (blk.acts && (blk.acts.includes('jog'))) { startAct(v, 'jog'); return; }
      startAct(v, rollAction(v, sp, blk.acts));
      return;
    }
    goSpot(v, sp, blk.acts ? rollAction(v, sp, blk.acts) : null);
  }
  // 공용 장소 실내에서 할 일
  function venueAction(v, iid) {
    const uses = furnUses(iid, u => !useOcc[u.key] || useOcc[u.key] === v.id).filter(u => !['staff', 'boss', 'anchor', 'hearing'].includes(u.u.act));
    if (!uses.length) { const s = interiorSize(iid); planRoute(v, { loc: iid, x: rnd(-s.w / 3, s.w / 3), z: rnd(-s.d / 3, s.d / 3) }); v.pendingAct = 'look_around'; return; }
    goUse(v, pick(uses));
  }
  Sim.venueAction = venueAction;

  // 자유 시간 — 스마트 오브젝트 반응 우선순위
  function freeThink(v, blk = {}) {
    // HOME 범위: 집/마당
    if (v.stats.range === 'HOME' && !blk.world && !blk.district) {
      // [사교파]+[집돌이]: 다른 주민이 마당 근처로 오면 반갑게 뛰어나가 대화
      if (has(v, 'EXTROVERT') || v.stats.excuse) {
        const yard = MAP.P[yardPlace(v)];
        const comer = S.villagers.find(o => o !== v && o.loc === 'island' && Math.hypot(o.x - yard.x, o.z - yard.z) < 10);
        if (comer && chance(0.6)) { v.run = true; if (FM.Soc && FM.Soc.startChat) return FM.Soc.startChat(v, comer, 'yardGreet'); }
      }
      if (v.loc === v.home ? chance(0.5) : chance(0.2)) return goHome(v, blk.acts);
      // [운동파]+[집돌이]: 집 마당에서 운동 → 마당 의자에서 책 읽기
      const sp = chooseSpot(v, { place: yardPlace(v), ignoreRange: true }) || chooseSpot(v, { tags: ['bench', 'flowers'], near: true });
      if (sp) {
        const pref = has(v, 'ATHLETIC') ? (v.lastAct === 'situps' ? ['read_book'] : ['situps', 'workout']) : blk.acts;
        return goSpot(v, sp, rollAction(v, sp, pref));
      }
      return goHome(v, blk.acts);
    }
    // Priority 2: 짝사랑/연인/친구 주민 접근 ──> 성격별 대화 또는 같이 앉기 [TALK_NPC]
    if (v.loc !== 'metro' && FM.Soc && chance(0.55)) {
      const near = nearbyVillagers(v, D.DETECT_R).filter(o => !o.sceneId && !o.status.hospital && !Sim.asleep(o, hour()));
      if (near.length && FM.Soc.priority2(v, near)) return;
    }
    // 사교적인 주민은 멀리 있는 친구도 찾아가 수다 (소문, 친구 만들기)
    const social = (has(v, 'EXTROVERT') ? 0.25 : 0) + (has(v, 'GOSSIP') ? 0.15 : 0) + (has(v, 'BUSYBODY') ? 0.2 : 0) + (has(v, 'WARM') ? 0.1 : 0) + 0.12 - (has(v, 'INTROVERT') ? 0.1 : 0);
    if (v.loc === 'island' && FM.Soc && chance(social)) {
      const cands = S.villagers.filter(o => o !== v && o.loc === 'island' && !o.sceneId && !o.child && !o.status.hospital && Math.hypot(o.x - v.x, o.z - v.z) < 35 && !(o.act && o.act.id === 'sleep'));
      if (cands.length) { const o = pick(cands); if (FM.Soc.startChat(v, o)) return; }
    }
    // Priority 3: 성격 선호 오브젝트 발견 ──> [INTERACT_OBJ]
    if (v.loc === 'island' && chance(0.7)) {
      const pref = v.stats.pref;
      const sp = SPOTS.filter(s => (!s.occ) && Math.hypot(s.x - v.x, s.z - v.z) < D.DETECT_R && s.tags.some(t => pref.includes(t)))[0];
      if (sp && sp !== v.spot) return goSpot(v, sp, rollAction(v, sp, blk.acts));
    }
    // 실내 공용 장소에 있으면 거기서 놀기
    if (v.loc !== 'island' && v.loc !== v.home && INT[v.loc] && INT[v.loc].kind === 'venue' && chance(0.6)) return venueAction(v, v.loc);
    // Priority 4: 일반 무작위 지점으로 산책 ──> [WALK]
    let sp = null;
    const radius = blk.radius;
    if (radius) {
      const c = homeCenter(v);
      const cand = SPOTS.filter(s => !s.occ && Math.hypot(s.x - c.x, s.z - c.z) < radius + 4 && (!blk.prefer || blk.prefer.some(t => s.tags.includes(t))));
      sp = cand.length ? pick(cand) : null;
    }
    if (!sp && blk.tags) sp = chooseSpot(v, { tags: blk.tags, ignoreRange: !!blk.world });
    if (!sp) {
      const dpref = blk.world || v.stats.range === 'WORLD' ? dayPref(v) : null;
      // 서쪽 지구 전용 주민 라이프 AI 루틴 / 동쪽 소비 시스템
      const h = hour();
      if (dpref === 'EAST' && !blk.world) {
        if (inH(h, 10, 18) && chance(0.6)) return goBlock(v, { place: 'mall', inside: true });
        if (inH(h, 18, 22) && chance(0.6)) return goBlock(v, { place: pick(['sushi', 'pub', 'arcade']), inside: true });
      }
      if (dpref === 'WEST' && !blk.world) {
        if (inH(h, 11, 16) && chance(0.5)) return goBlock(v, { place: pick(['library', 'workshop']), inside: true });
      }
      sp = chooseSpot(v, { district: dpref || undefined, ignoreRange: !!dpref }) || chooseSpot(v, {});
    }
    if (!sp) return goHome(v);
    // 호기심 천국: 동선이 계속 튐
    goSpot(v, sp, rollAction(v, sp, blk.acts));
  }
  Sim.freeThink = freeThink;

  function babyThink(v) {
    // 신혼집 안 요람 주변 2m 이내 제한
    if (v.loc !== v.home) { v.loc = v.home; }
    const cr = furnUses(v.home, u => u.u.act === 'rock_cradle')[0];
    if (cr) { v.x = cr.f.x; v.z = cr.f.z; }
    startAct(v, 'baby', { state: 'HOME_LIFE', pose: 'baby', dur: 10, name: '요람에서 꼼지락' });
  }

  // ---------------------------------------------------------
  // 옷 (드레스코드 자동 환복)
  // ---------------------------------------------------------
  function dressFor(v, code) {
    if (v.outfit === code) return;
    if (v.status.forcedOutfit && code !== v.status.forcedOutfit) code = v.status.forcedOutfit;
    v.outfit = code;
    emit('outfit', v);
  }
  Sim.dressFor = dressFor;

  // ---------------------------------------------------------
  // 도착 처리
  // ---------------------------------------------------------
  function arrive(v) {
    v.moving = false;
    v.run = false;
    const pa = v.pendingAct; v.pendingAct = null;
    if (pa && pa.startsWith && pa.startsWith('quirk:')) {
      const q = pa.slice(6);
      startAct(v, 'quirk_' + q, { state: 'HOME_LIFE', pose: q === 'roll' ? 'roll' : q === 'headbang' ? 'headbang' : q === 'lyrics' ? 'write' : q === 'faces' ? 'faces' : q === 'clean' ? 'sweep' : 'dance', dur: 6, name: v.pendingName, prop: q === 'clean' ? 'broom' : q === 'lyrics' ? 'notebook' : null });
      if (q === 'clean') { const r = S.rooms[v.loc]; if (r) { r.trash = r.trash.slice(0, Math.max(0, r.trash.length - 2)); r.clean = Math.min(100, r.clean + 15); } }
      return;
    }
    if (v.useTarget && v.loc === v.useTarget.iid) {
      const u = v.useTarget;
      v.x = u.x; v.z = u.z; v.ry = u.ry;
      const a = pa || u.u.act;
      const extra = { state: v.loc === v.home ? 'HOME_LIFE' : (u.u.pose === 'sit' || u.u.pose === 'eat' || u.u.pose === 'drink' ? 'SIT_REST' : 'INTERACT_OBJ'), pose: u.u.pose, dur: rnd(6, 14), name: (D.ACTIONS[a] || {}).name || u.F.name, prop: u.u.prop || null, y: u.u.y || 0, seatH: u.u.seatH || 0, bed: u.F.bed && u.u.pose === 'sleep' ? u.F.bed : null };
      if (a === 'sleep') { extra.dur = 30; extra.state = 'HOME_LIFE'; }
      startAct(v, a, extra);
      FM.Ev && FM.Ev.onFurn && FM.Ev.onFurn(v, u, a);
      return;
    }
    if (pa === 'eat_out') { v.hunger = 15; v.coins -= 45; if (v.coins < 0) { v.debt -= v.coins; v.coins = 0; } return startAct(v, 'eat_snack', { state: 'SIT_REST', pose: 'eat', dur: 8, name: '외식' }); }
    if (pa === 'corner') return startAct(v, 'corner', { state: 'HOME_LIFE', pose: 'sadSit', dur: 20, name: '불 끄고 구석에 앉아있음' });
    if (pa === 'hospital') return startAct(v, 'hospital', { state: 'SIT_REST', pose: 'sleep', dur: 20 });
    if (pa) return startAct(v, pa);
    if (v.spot) return startAct(v, rollAction(v, v.spot));
    if (v.loc !== 'island' && INT[v.loc] && INT[v.loc].kind === 'venue') return venueAction(v, v.loc);
    v.idleT = rnd(...v.stats.idle) * 0.5;
  }

  // ---------------------------------------------------------
  // 매 틱 주민 업데이트
  // ---------------------------------------------------------
  function updateVillager(v, dtR) {
    v.moving = false;
    if (v.sceneId) return; // 장면이 제어
    // 동행 중: 움직임은 플레이어 쪽(main.js)에서 처리
    if (v.following && S.player.followers && S.player.followers.includes(v.id)) { v.route = null; if (!v.followUse) v.act = null; return; }
    // 플레이어와 대화 중: 그 자리에 가만히 서서 플레이어를 바라봄
    if (v.talkingToPlayer) {
      if (!(v.talkUntil > S.realT)) { v.talkingToPlayer = false; v.idleT = 1; }
      else {
        v.route = null; v.act = null; v.run = false; v.state = 'TALK_PLAYER'; v.pose = v.talkPose || 'listen';
        const p = S.player; if (p.loc === v.loc) v.ry = Math.atan2(p.x - v.x, p.z - v.z);
        return;
      }
    }
    if (v.loc === 'metro' || (v.route && v.route.length)) {
      const done = moveAlong(v, dtR);
      if (v.route && v.route.length && v.route[0].k === 'walk') v.state = v.run ? 'RUN' : 'WALK';
      if (done) arrive(v);
      // 걷는 도중 감지 (반경 6m) — 호기심 천국은 동선이 계속 튐
      if (!done && v.loc === 'island' && (v.checkT = (v.checkT || 0) - dtR) < 0) {
        v.checkT = has(v, 'CURIOUS') ? 1.2 : 2.5;
        if (FM.Soc && FM.Soc.onWalkCheck) FM.Soc.onWalkCheck(v);
        if (has(v, 'CURIOUS') && chance(0.12) && !v.child) {
          const sp = SPOTS.find(s => !s.occ && s !== v.spot && Math.hypot(s.x - v.x, s.z - v.z) < D.DETECT_R);
          if (sp) { goSpot(v, sp, 'inspect'); Sim.emote(v, '❓'); }
        }
      }
      return;
    }
    if (v.act) {
      v.act.t -= dtR * S.speed;
      if (v.act.id === 'jog' && !v.route) {
        // 광장 한 바퀴
        const a = rnd(0, Math.PI * 2), c = v.spot || v;
        planRoute(v, { loc: v.loc, x: c.x + Math.cos(a) * 6, z: c.z + Math.sin(a) * 6 }, { noMetro: true });
        v.run = true; v.state = 'RUN';
      }
      if (v.act.t <= 0) {
        v.lastAct = v.act.id;
        v.act = null; v.pose = null; v.prop = null; v.run = false;
        const idle = rnd(...v.stats.idle) * (D.L2[v.keys.L2] && D.L2[v.keys.L2].restMul || 1);
        v.idleT = idle;
        if (v.state !== 'HOME_LIFE') v.state = 'WATCH_LOOK';
      }
      return;
    }
    v.idleT -= dtR * S.speed;
    if (v.idleT > 0) return;
    v.idleT = 0;
    think(v);
  }

  // ---------------------------------------------------------
  // 필요 수치 (배고픔, 에너지, 스트레스)
  // ---------------------------------------------------------
  function updateNeeds(v, dMin) {
    const sleeping = v.act && v.act.id === 'sleep';
    v.hunger = clamp(v.hunger + dMin * (sleeping ? 0.03 : 0.065), 0, 100);
    v.energy = clamp(v.energy + dMin * (sleeping ? 0.25 : -0.06), 0, 100);
    if (v.act && ['eat_snack', 'sushi', 'pub', 'dine', 'cook', 'breakfast', 'eat', 'bbq', 'nibble', 'buy_kimbap', 'cafe', 'snack', 'sandwich'].includes(v.act.id)) v.hunger = clamp(v.hunger - dMin * 3, 0, 100);
    let ds = 0;
    if (v.act && ['work_desk', 'copier', 'staff', 'anchor', 'work_home'].includes(v.act.id)) ds += 0.035;
    if (v.act && ['sleep', 'tea_heal', 'massage', 'sofa', 'nap', 'club_dance', 'karaoke', 'jacuzzi', 'bathe'].includes(v.act.id)) ds -= 0.06;
    if (v.hunger > 90) ds += 0.02;
    if (!v.act || !['work_desk', 'copier', 'staff', 'anchor', 'work_home'].includes(v.act.id)) ds -= 0.012; // 자유 시간의 소소한 휴식
    if (v.status.slumpUntil > S.time) ds += 0.02;
    const room = S.rooms[v.home];
    if (room && room.hateNight) ds += 0.01;
    if (room && room.clean < 30) ds += 0.01;
    v.stress = clamp(v.stress + ds * dMin, 0, 100);
    v.depression = clamp(v.depression - dMin * 0.004 + (v.status.slumpUntil > S.time ? dMin * 0.01 : 0), 0, 100);
    v.mood = clamp(100 - v.stress * 0.6 - v.depression * 0.4 - (v.hunger > 70 ? 15 : 0), 0, 100);
  }

  // 속마음 (속마음 돋보기)
  Sim.thought = function (v) {
    const c = [];
    if (v.hunger > 70) c.push([v.hunger, '배고픔']);
    if (v.coins <= 0) c.push([90, '돈']);
    else if (v.coins < 200) c.push([55, '돈']);
    if (v.crush && v.crush.target) c.push([v.crush.intensity, `${Sim.nameOf(v.crush.target)}의 얼굴`]);
    if (v.jealousy && v.jealousy.meter > 30) c.push([v.jealousy.meter, `${Sim.nameOf(v.jealousy.rival)} 미워!`]);
    if (v.stress > 60) c.push([v.stress, '스트레스']);
    if (v.depression > 40) c.push([v.depression, '외로움']);
    if (v.energy < 25) c.push([80 - v.energy, '졸려']);
    if (v.status.hospital) c.push([95, '퇴원하고 싶다']);
    const room = S.rooms[v.home];
    if (room && room.clean < 40) c.push([60, '방 청소']);
    if (room && room.hateNight) c.push([70, '인테리어 불만']);
    if (!c.length) c.push([30, pick(['오늘 저녁 메뉴', '날씨 좋다', D.L4[v.keys.L4].name, '뒹굴뒹굴', '친구 만들기'])]);
    c.sort((a, b) => b[0] - a[0]);
    return c[0][1];
  };

  // ---------------------------------------------------------
  // 메인 틱
  // ---------------------------------------------------------
  let lastHourInt = -1;
  Sim.tick = function (dtR) {
    if (!S) return;
    dtR = Math.min(dtR, 0.25);
    S.realT = (S.realT || 0) + dtR;
    const dMin = dtR * S.speed;          // 1 실제 초 = 1 게임 분 (배속 적용)
    S.time += dMin;
    const d = day(), h = Math.floor(hour());
    if (d !== S.lastDay) { S.lastDay = d; FM.Soc && FM.Soc.daily && FM.Soc.daily(); FM.Ev && FM.Ev.daily && FM.Ev.daily(); emit('day', d); }
    if (h !== lastHourInt) { lastHourInt = h; FM.Ev && FM.Ev.hourly && FM.Ev.hourly(h); emit('hour', h); }
    for (const sc of scenes.slice()) { try { stepScene(sc, dtR); } catch (e) { console.error('scene', sc.title, e); endScene(sc, true); } }
    for (const v of S.villagers) {
      updateNeeds(v, dMin);
      try { updateVillager(v, dtR); } catch (e) { console.error('villager', v.name, e); v.act = null; v.route = null; v.idleT = 2; }
      if (v.bubble && v.bubble.until < S.realT) v.bubble = null;
      if (v.emote && v.emote.until < S.realT) v.emote = null;
    }
    FM.Soc && FM.Soc.tick && FM.Soc.tick(dtR, dMin);
    FM.Ev && FM.Ev.tick && FM.Ev.tick(dtR, dMin);
    if (S.fx.length > 60) S.fx.splice(0, S.fx.length - 60);
  };

  // 개발용: 시간을 빠르게 흘리기
  Sim.fastForward = function (minutes, step = 0.2) {
    const sp = S.speed; S.speed = 30;
    let left = minutes;
    while (left > 0) { Sim.tick(step); left -= step * S.speed; }
    S.speed = sp;
  };
})();
