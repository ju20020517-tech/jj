/* =========================================================
 *  마을 건물 나들이 — 주민들이 성격 · 가치관 · 기분에 따라 섬의 모든 건물에 들어가서 이용
 *  카페 · 방송국 · 대성당 · 천문대 · 학교 · 도서관 · 공방 · 찻집 · 스카이라운지 · 쇼핑몰 · 오락실
 *  회전초밥 · 펍 · 클럽 · 편의점 · 오피스 · 시청 · 메디컬 센터
 *  (영업시간이 있고, 안에서는 가구를 사용하며 잠시 머물다 나옴)
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, MAP = FM.MAP;
  const S = () => Sim.get();
  const has = (v, k) => Sim.has(v, k);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const chance = p => Math.random() < p;
  const O = (FM.Outing = {});
  // [장소, 영업시간(시작, 끝), 이름, 가중치 함수]
  const w = (v, table) => {
    let s = 0.25;
    for (const [k, x] of Object.entries(table)) {
      if (has(v, k) || v.value === k || v.moral === k || v.loveStyle === k) s += x;
      else if (v.value2 === k) s += x * 0.4;
    }
    return s;
  };
  const B = [
    ['cafe', 8, 21, '카페 앙상블', v => w(v, { EXTROVERT: 2, ROMANTIC: 1.5, FASHIONISTA: 1.5, GOSSIP: 2, FOOD: 1, FRIENDSHIP: 1, LOVE: 1 })],
    ['studio', 9, 20, '방송국', v => w(v, { FAME: 3, EXTROVERT: 1, LEADER: 1.5, MUSICIAN: 1 })],
    ['cathedral', 8, 20, '대성당', v => w(v, { TRADITION: 3, FAMILY: 1.5, SAINT: 1.5, HONEST: 1, ROMANTIC: 1, OCCULT: 1, DEVOTED: 1 })],
    ['observatory', 18, 26, '천문대', v => w(v, { SCHOLARLY: 2, ROMANTIC: 1.5, ADVENTURER: 1.5, OCCULT: 2, INTROVERT: 1, NIGHT_OWL: 1.5 })],
    ['school', 9, 17, '어린이 학교', v => w(v, { GROWTH: 2.5, SCHOLARLY: 1.5, LEADER: 1, FAMILY: 1 })],
    ['library', 9, 21, '도서관', v => w(v, { SCHOLARLY: 3, INTROVERT: 2, GROWTH: 2, STUDY: 2, CLUMSY: 0.5 })],
    ['workshop', 10, 19, '마을 공방', v => w(v, { ARTISTIC: 2.5, DILIGENT: 1.5, GROWTH: 1, NATURE: 1, CLUMSY: 1 })],
    ['teahouse', 14, 24, '달빛 차관', v => w(v, { TRADITION: 2, INTROVERT: 1.5, SNOB: 1.5, HARMONY: 1, ANXIOUS: 1, NATURE: 1 })],
    ['skylounge', 17, 24, '스카이라운지', v => w(v, { SNOB: 2.5, MONEY: 2, FAME: 1, LOVE: 1, FASHIONISTA: 1 }) + (FM.Soc.partnerOf(v.id) ? 1.5 : 0)],
    ['mall', 10, 22, '쇼핑몰', v => w(v, { FASHIONISTA: 3, FASHION: 2, SNOB: 1.5, EXTROVERT: 1, FAME: 1, FUN: 0.5 })],
    ['arcade', 11, 24, '오락실', v => w(v, { GAMER: 4, FUN: 2.5, LAZY: 1, PRANKSTER: 1, CLUMSY: 0.5 })],
    ['sushi', 11, 22, '회전초밥', v => w(v, { FOOD: 2.5, LAZY: 2, FUN: 1 }) + (v.hunger > 55 ? 2 : 0)],
    ['pub', 17, 26, '레트로 펍', v => w(v, { EXTROVERT: 1.5, FUN: 1.5, CRANKY: 1, MUSICIAN: 0.5 }) + ((v.stress || 0) > 50 ? 2 : 0)],
    ['club', 21, 28, '클럽', v => w(v, { FUN: 2.5, EXTROVERT: 2, MUSICIAN: 2, NIGHT_OWL: 1.5, PLAYBOY: 2 })],
    ['conv', 0, 24, '편의점', v => w(v, { LAZY: 1.5, GAMER: 1 }) + 0.3 + (v.hunger > 50 ? 1 : 0)],
    ['office', 9, 19, '오피스 타워', v => w(v, { MONEY: 2, DILIGENT: 1 }) * (v.job === 'office' ? 0.3 : 1)],
    ['cityhall', 9, 18, '시청 · 법원', v => w(v, { CRANKY: 2, LEADER: 2, JUSTICE: 1.5, TRADITION: 0.5 })],
    ['medical', 0, 24, '메디컬 센터', v => w(v, { ANXIOUS: 1.5 }) * 0.5 + ((v.stress || 0) > 55 ? 3 : 0) + ((v.depression || 0) > 55 ? 1.5 : 0)],
  ];
  O.BUILDINGS = B;
  const open = (b, h) => { const [, o, c] = b; const hh = h < o && c > 24 ? h + 24 : h; return hh >= o && hh < c; };
  // 성격별 외출 성향 (얼마나 자주 건물에 가나)
  const outgoing = v => 0.5 + (has(v, 'EXTROVERT') ? 0.12 : 0) + (has(v, 'WANDERER') ? 0.1 : 0) + (has(v, 'ADVENTURER') ? 0.08 : 0) + (has(v, 'BUSYBODY') ? 0.05 : 0)
    - (has(v, 'HOMEBODY') ? 0.12 : 0) - (has(v, 'INTROVERT') ? 0.05 : 0) - (v.stats && v.stats.range === 'HOME' ? 0.1 : 0);
  O.pick = function (v, h) {
    const cands = B.filter(b => open(b, h) && MAP.P[b[0]] && MAP.P[b[0]].interior && FM.INTERIORS[MAP.P[b[0]].interior]).map(b => [b, Math.max(0, b[4](v))]).filter(x => x[1] > 0);
    if (v.lastOuting) for (const c of cands) if (c[0][0] === v.lastOuting) c[1] *= 0.35;   // 같은 곳만 가지 않게
    const tot = cands.reduce((a, c) => a + c[1], 0); if (!tot) return null;
    let r = Math.random() * tot; for (const [b, x] of cands) if ((r -= x) < 0) return b;
    return cands[0][0];
  };
  // sim-core freeThink 앞단 훅
  Sim.outingHook = function (v, blk) {
    if (!v || v.child || v.staff || v.visitor) return false;
    const st = S(), h = Sim.time.hour();
    const o = v.outing;
    if (o) {
      const P0 = MAP.P[o.place], iid = P0 && P0.interior;
      if (!iid) { v.outing = null; return false; }
      if (st.time >= o.until) {                                    // 볼일 끝 → 밖으로
        v.outing = null;
        if (v.loc === iid) { const d = P0.door || [P0.x, P0.z + 4]; Sim.planRoute(v, { loc: 'island', x: d[0] + rnd(-1.5, 1.5), z: d[1] + rnd(1, 3) }); v.state = 'WALK'; v.pendingAct = 'look_around'; return true; }
        return false;
      }
      if (v.loc === iid) { Sim.venueAction(v, iid); return true; }  // 안에서 가구 사용
      if (v.loc === 'island' || v.loc === v.home) { Sim.planRoute(v, { loc: iid, x: rnd(-2, 2), z: rnd(-1, 2) }); v.pendingAct = null; v.state = 'WALK'; return true; }
      return false;
    }
    if (blk && (blk.radius || blk.world || blk.district)) return false;   // 성격 패턴 블록은 존중
    if (v.loc !== 'island' && v.loc !== v.home) return false;
    if ((v.stats && v.stats.range === 'HOME') && !chance(0.3)) return false;
    if (!chance(outgoing(v))) return false;
    const b = O.pick(v, h); if (!b) return false;
    v.outing = { place: b[0], until: st.time + rnd(35, 110), name: b[3] };
    v.lastOuting = b[0];
    v.blockLabel = `🏢 ${b[3]} 이용 중`;
    st.outingStats = st.outingStats || {}; st.outingStats[b[0]] = (st.outingStats[b[0]] || 0) + 1;
    const P0 = MAP.P[b[0]];
    Sim.planRoute(v, { loc: P0.interior, x: rnd(-2, 2), z: rnd(-1, 2) }); v.pendingAct = null; v.state = 'WALK';
    return true;
  };
})();
