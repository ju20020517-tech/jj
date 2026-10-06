/* =========================================================
 *  ⚡ 렉 줄이기 — 무거운 장식 묶음은 멀리 있을 때 숨김
 *   · 섬 장면에서 삼각형이 많은 묶음(예식 정원 · 노을 정원 등)을 찾아
 *     카메라가 보고 있는 곳에서 멀면 숨기고, 가까이 가면 다시 보여 줌 (그림자도 같이 빠짐)
 *   · 0.3초마다 거리만 확인하므로 매 프레임 비용 없음
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM;
  const HEAVY = 120000;       // 이 이상 삼각형을 가진 묶음만 대상
  const NEAR = 55;            // 보이는 거리 (묶음 반지름 바깥으로)
  let list = [], scanned = 0;
  const triCount = o => { let t = 0; o.traverse(m => { if (m.isMesh) { const g = m.geometry; const k = g.index ? g.index.count / 3 : (g.attributes.position ? g.attributes.position.count / 3 : 0); t += m.isInstancedMesh ? k * m.count : k; } }); return t; };
  function scan() {
    const G = FM.G; if (!G || !G.islandScene) return;
    const chars = new Set(); if (FM.Chars && FM.Chars.models) FM.Chars.models.forEach(m => chars.add(m.c.root));
    list = [];
    for (const ch of G.islandScene.children) {
      if (chars.has(ch) || ch.isLight || ch.userData.keepAlways) continue;
      const t = triCount(ch); if (t < HEAVY) continue;
      const box = new THREE.Box3().setFromObject(ch); if (box.isEmpty()) continue;
      const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
      const r = Math.max(size.x, size.z) / 2;
      if (r > 90) continue;   // 섬 전체에 퍼진 묶음(지형 · 거리 소품)은 제외
      list.push({ o: ch, x: c.x, z: c.z, r, t });
    }
    scanned = performance.now();
  }
  setInterval(() => {
    try {
      const G = FM.G; if (!G || !G.islandScene) return;
      if (!list.length || performance.now() - scanned > 8000) scan();
      const tgt = G.cine && G.cine.cam ? G.cine.cam.position : (G.camera ? G.camera.position : null); if (!tgt) return;
      for (const L of list) {
        const d = Math.hypot(L.x - tgt.x, L.z - tgt.z) - L.r;
        const vis = d < NEAR;
        if (L.o.visible !== vis) L.o.visible = vis;
      }
    } catch (e) { /* */ }
  }, 300);
  FM.Perf = { list: () => list.map(L => ({ name: L.o.name, tris: L.t, r: Math.round(L.r), visible: L.o.visible })) };
})();
