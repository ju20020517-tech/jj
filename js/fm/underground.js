/* =========================================================
 *  숨겨진 지하 아파트 "B1 언더하우스"
 *   · 섬에 빈 집(아파트 · 빌라)이 하나도 없을 때 처음으로 발견됨
 *     (아이 독립 · 이혼 · 새 이웃 이사 등으로 집이 필요해지는 순간)
 *   · 발견되면 시티 타워 옆에 지하 계단 입구가 생기고, 지도에도 표시됨
 *   · 로비(세탁실 · 사물함 · 오락기) + 지하 12호실, 집세는 아파트의 절반
 *   · 섬 최대 인구가 지하 호실 수만큼 늘어남
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, MAP = FM.MAP;
  if (!Sim || !FM.UG_ROOMS) return;
  const S = () => Sim.get();
  const ROOMS = FM.UG_ROOMS;
  const BASE_MAX = Sim.MAX_VILLAGERS;
  const isOpen = () => { const st = S(); return !!(st && st.ug && st.ug.open); };
  const Ug = (FM.Ug = { isOpen, ROOMS });

  function freeUg() {
    const used = new Set(S().villagers.map(v => v.home));
    return ROOMS.find(r => !used.has(r)) || null;
  }
  function unlock(reason) {
    const st = S(); if (!st || isOpen()) return;
    st.ug = { open: true, day: Sim.time.day() };
    Sim.MAX_VILLAGERS = BASE_MAX + ROOMS.length;
    Sim.log('move', '🕳️ 섬에 빈 집이 없어지자… 시티 타워 옆 낡은 계단 아래에서 숨겨진 지하 아파트 "B1 언더하우스"가 발견됐어요!', [], 3);
    FM.bus.emit('toast', '🕳️ 숨겨진 장소 발견! 시티 타워 옆에 지하 아파트 입구가 열렸어요 (12호실)');
    build();
    FM.bus.emit('ugOpen', reason || '');
  }
  Ug.unlock = unlock;

  // 빈 집 찾기: 지상 집이 없으면 지하 아파트를 열고 지하 호실 배정
  const baseFree = Sim.freeHome;
  Sim.freeHome = function (prefer) {
    const h = baseFree.apply(this, arguments);
    if (h) return h;
    const st = S(); if (!st) return null;
    if (!isOpen()) unlock('full');
    return freeUg();
  };
  const baseOpts = Sim.homeOptions;
  Sim.homeOptions = function () {
    const out = baseOpts.apply(this, arguments);
    if (isOpen()) { const r = freeUg(); if (r) out.push({ id: r, kind: 'ug', cap: 1, used: 0 }); }
    return out;
  };

  // 지하 호실 집세 (아파트의 절반)
  FM.bus.on('hour', h => {
    if (h !== 0 || !isOpen()) return;
    const rent = Math.round(((FM.D && FM.D.ECON && FM.D.ECON.rent) || 60) / 2);
    for (const v of S().villagers) if (!v.child && v.home && v.home.startsWith('ug-')) { if (v.coins >= rent) v.coins -= rent; else { v.debt = (v.debt || 0) + rent - v.coins; v.coins = 0; } }
  });

  // ---------------------------------------------------------
  // 입구 3D (계단 + 철제 아치 + 네온 간판)
  // ---------------------------------------------------------
  let built = null;
  function build() {
    const W = FM.W; if (!W || !W.scene || built || !isOpen()) return;
    const P = MAP.P.underground, T = FM.T;
    const g = new THREE.Group();
    const y0 = T && T.groundY ? T.groundY(P.x, P.z) : 0;
    g.position.set(P.x, y0, P.z);
    const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 });
    const box = (w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
    // 바닥 구멍 테두리 + 어두운 계단
    box(3.2, 0.25, 4.2, 0x8a8078, 0, 0.12, 0);
    box(2.4, 0.06, 3.4, 0x1e1a22, 0, 0.26, 0);
    for (let i = 0; i < 5; i++) box(2.2, 0.08, 0.5, 0x5a5560 - i * 0x080808, 0, 0.24 - i * 0.02, 1.3 - i * 0.6);
    // 난간
    for (const sx of [-1.25, 1.25]) { box(0.08, 0.9, 3.4, 0x3a3a44, sx, 0.7, 0); box(0.12, 0.12, 3.5, 0xd8a83a, sx, 1.18, 0); }
    // 아치 + 간판
    for (const sx of [-1.45, 1.45]) box(0.18, 2.6, 0.18, 0x2b2b30, sx, 1.3, -1.9);
    box(3.1, 0.18, 0.2, 0x2b2b30, 0, 2.6, -1.9);
    const sign = FM.PM && FM.PM.ctex ? FM.PM.ctex('ug-sign', 256, 64, (c, w, h) => { c.fillStyle = '#20182a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ff7eb6'; c.lineWidth = 4; c.strokeRect(4, 4, w - 8, h - 8); c.fillStyle = '#ffd2ea'; c.font = 'bold 30px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('B1 언더하우스', w / 2, h / 2 + 2); }) : null;
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), new THREE.MeshBasicMaterial({ map: sign, color: sign ? 0xffffff : 0xff7eb6 }));
    sm.position.set(0, 3.05, -1.88); g.add(sm);
    const sb = sm.clone(); sb.rotation.y = Math.PI; sb.position.z = -1.92; g.add(sb);
    // 따뜻한 조명
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd890 }));
    lamp.position.set(0, 2.35, -1.9); g.add(lamp);
    const pl = new THREE.PointLight(0xffc880, 0.8, 7); pl.position.set(0, 1.6, 0); g.add(pl);
    g.rotation.y = Math.PI; // 계단이 타워 반대쪽(남쪽)으로 열림
    W.scene.add(g);
    built = g;
  }
  Ug.build = build;
  // 월드가 만들어진 뒤 · 불러오기 후 입구 복원
  const tryBuild = () => { try { if (isOpen()) { Sim.MAX_VILLAGERS = Math.max(Sim.MAX_VILLAGERS, BASE_MAX + ROOMS.length); build(); } } catch (e) { console.error('ug build', e); } };
  FM.bus.on('hour', tryBuild);
  setTimeout(tryBuild, 2500);
  if (Sim.load) { const oLoad = Sim.load; Sim.load = function () { const r = oLoad.apply(this, arguments); if (built && !isOpen()) { built.parent && built.parent.remove(built); built = null; } setTimeout(tryBuild, 600); return r; }; }

  // ---------------------------------------------------------
  // 입구 메뉴 (로비 / 호실 방문)
  // ---------------------------------------------------------
  const UI = FM.UI;
  if (UI) UI.undergroundMenu = function () {
    const st = S();
    const rooms = ROOMS.map(id => ({ id, v: st.villagers.find(v => v.home === id) }));
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    UI.modal('🕳️ 지하 아파트 "B1 언더하우스"', `<p class="muted">시티 타워 아래 숨겨져 있던 지하 주거 공간이에요. 입주 ${rooms.filter(r => r.v).length}/${rooms.length}호</p>
      <button class="btn" id="ugLobby">🚪 로비로 내려가기 (세탁실 · 오락기)</button>
      <h4>🚪 주민 방 방문</h4><div class="grid-btn">${rooms.map(r => `<button data-r="${r.id}" ${r.v ? '' : 'disabled'}>${esc(FM.INTERIORS[r.id].name)}<small>${r.v ? esc(r.v.name) : '빈 방'}</small></button>`).join('')}</div>`, b => {
      b.querySelector('#ugLobby').onclick = () => { UI.closeModal(); FM.G.enterInterior('ug_lobby'); };
      b.querySelectorAll('[data-r]').forEach(x => x.onclick = () => { UI.closeModal(); FM.G.enterInterior(x.dataset.r); });
    });
  };
})();
