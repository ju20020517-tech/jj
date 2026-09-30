/* =========================================================
 *  카운터 뒤 직원 발판 — 카운터에 가려 얼굴이 안 보이던 직원들이 발판 위에 올라서서 손님 · 카메라에 얼굴이 보이게
 *  (발판 영역은 FM.levelY 높이 영역으로 등록 → 그 위에 선 사람은 발판 높이만큼 올라감)
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, RK = FM.RoomKit;
  const { K, T, def } = RK._h;
  const H = 0.24;
  const wood = T.woodgrain(0x7a5234);
  // [실내, x0, x1, z0, z1]
  const STEPS = [
    ['cafe_in', -0.68, 0.68, -3.98, -3.32],      // 바리스타 (쇼케이스 카운터 뒤)
    ['sushi_in', -2.6, 2.6, -2.34, -1.76],       // 초밥 셰프 (조리대 ~ 카운터 사이)
    ['pub_in', 1.9, 4.9, -4.48, -4.02],          // 중국집 사장님
    ['hall_in', -5.5, -2.5, -4.4, -3.42],        // 민원 창구 공무원
    ['conv_in', -3.78, -2.99, 1.12, 2.45],       // 편의점 계산대
    ['library_in', -5.3, -3.1, 3.35, 4.18],      // 사서 대출 데스크
    ['med_in', -7.6, -5.0, -0.95, -0.12],        // 메디컬 센터 접수 데스크
    ['mall_in', 4.0, 6.4, -5.6, -4.92],          // 부티크 계산대
    ['club_in', 6.6, 7.3, -1.9, 2.3],            // 재즈바 바텐더
  ];
  FM.STAFF_STEPS = STEPS;
  for (const [iid, x0, x1, z0, z1] of STEPS) {
    const I = FM.INTERIORS[iid]; if (!I) continue;
    const w = +(x1 - x0).toFixed(2), d = +(z1 - z0).toFixed(2), id = `k17_step_${iid}`;
    def(id, '직원용 원목 발판 (미끄럼 방지 매트)', 'misc', 300, w, d, g => {
      const k = K(g);
      k.b(w, H - 0.03, d, wood, 0, (H - 0.03) / 2, 0, 0.02);
      k.b(w - 0.08, 0.03, d - 0.08, 0x2f3a36, 0, H - 0.015, 0, 0.01);           // 고무 매트
      for (let x = -w / 2 + 0.2; x < w / 2 - 0.1; x += 0.2) k.b(0.02, 0.005, d - 0.12, 0x46524d, x, H + 0.002, 0);  // 매트 홈
      k.b(w, 0.03, 0.03, 0xd8b048, 0, H - 0.01, d / 2 - 0.015);                // 앞쪽 노란 경계선
    }, { tags: ['staff'] });
    (I.furn = I.furn || []).push({ type: id, x: +((x0 + x1) / 2).toFixed(2), z: +((z0 + z1) / 2).toFixed(2), rot: 0 });
    (I.levels = I.levels || []).push({ x0, x1, z0, z1, y: H });
  }
  // 저장된 방 데이터에도 발판 넣기
  const add = () => { const st = FM.Sim.get && FM.Sim.get(); if (!st || !st.rooms) return; for (const [iid] of STEPS) { const r = st.rooms[iid], I = FM.INTERIORS[iid]; if (!r || !r.furn || !I) continue; const id = `k17_step_${iid}`; if (!r.furn.some(o => o.type === id)) r.furn.push(I.furn.find(o => o.type === id)); } };
  const oLoad = FM.Sim.load; FM.Sim.load = function () { const r = oLoad.apply(this, arguments); add(); return r; };
})();
