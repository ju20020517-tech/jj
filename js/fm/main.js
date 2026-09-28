/* =========================================================
 *  메인 — 렌더러, 카메라, 플레이어 조작, 상호작용, 화면 전환(섬/실내/관찰), 저장
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE, D = FM.D, MAP = FM.MAP, T = FM.T, Sim = FM.Sim, Soc = FM.Soc, Ev = FM.Ev;
  const G = (FM.G = { view: 'island', obs: null, interior: null, camMode: 'orbit', keys: {}, target: null });
  const $ = s => document.querySelector(s);
  let renderer, camera, islandScene, intScene, clock;
  let camYaw = 0.6, camPitch = 0.62, camDist = 16, camTarget = new THREE.Vector3(), camPos = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  G.raycaster = raycaster;

  // ---------------------------------------------------------
  // 시작
  // ---------------------------------------------------------
  function initRenderer() {
    const canvas = $('#game');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
    islandScene = new THREE.Scene();
    intScene = new THREE.Scene();
    intScene.background = new THREE.Color(0x3a2a34);
    intScene.add(new THREE.HemisphereLight(0xffeedd, 0x5a4048, 0.6));
    intScene.add(new THREE.AmbientLight(0xffe4cc, 0.22));
    const dl = new THREE.DirectionalLight(0xffe2c0, 0.38); dl.position.set(3, 8, 6); intScene.add(dl);
    G.intScene = intScene; G.islandScene = islandScene; G.camera = camera; G.renderer = renderer;
    resize();
    window.addEventListener('resize', resize);
  }
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  // 저장 / 불러오기
  G.save = function () {
    try { const st = Sim.get(); if (!st) return; st.player.lastRealVisit = Date.now(); localStorage.setItem(D.SAVE_KEY, Sim.serialize()); G.savedAt = Date.now(); } catch (e) { console.warn('save failed', e); if (!G._quotaWarned && /quota/i.test(String(e && (e.name + e.message)))) { G._quotaWarned = true; FM.UI.toast('⚠️ 저장 공간이 가득 찼어요. 붙인 사진을 몇 장 떼어 주세요'); } }
  };
  G.hasSave = () => { try { return !!localStorage.getItem(D.SAVE_KEY); } catch (e) { return false; } };
  G.loadSave = function () {
    try { const j = JSON.parse(localStorage.getItem(D.SAVE_KEY)); if (!j || !j.villagers) return false; Sim.load(j); return true; } catch (e) { console.warn(e); return false; }
  };
  G.reset = function () { try { localStorage.removeItem(D.SAVE_KEY); } catch (e) {} location.reload(); };

  G.start = function (opts) {
    if (opts && opts.fresh) {
      Sim.newGame(opts);
      const st = Sim.get();
      st.player.keys = opts.playerKeys || { L1: Sim.u.pick(Object.keys(D.L1)), L2: Sim.u.pick(Object.keys(D.L2)), L3: Sim.u.pick(Object.keys(D.L3)), L4: Sim.u.pick(Object.keys(D.L4)) };
      st.player.look = opts.playerLook || st.player.look || ISLE.normalizeLook(Object.assign(ISLE.randomLook(), { species: 'human' }));
    } else if (!G.loadSave()) return G.start({ fresh: true });
    const st = Sim.get();
    // 오랜만에 접속 (실제 시간) — 플레이어 부재 체크는 매일 처리
    st.player.lastRealVisit = st.player.lastRealVisit || Date.now();
    if (!st.player.look) st.player.look = ISLE.normalizeLook(Object.assign(ISLE.randomLook(), { species: 'human' }));
    if (!st.player.keys) st.player.keys = { L1: 'ROMANTIC', L2: 'CURIOUS', L3: 'WARM', L4: 'STUDY' };
    FM.W.build(islandScene);
    makeBeacons();
    const p = st.player;
    if (p.loc !== 'island' && !FM.INTERIORS[p.loc]) { p.loc = 'island'; p.x = 0; p.z = 2; }
    if (p.loc !== 'island') enterInterior(p.loc, true); else setView('island');
    camTarget.set(p.x, T.groundY(p.x, p.z), p.z);
    FM.UI.init();
    clock = new THREE.Clock();
    requestAnimationFrame(loop);
    setInterval(G.save, 10000);
    window.addEventListener('beforeunload', G.save);
    $('#loading').hidden = true;
  };

  // ---------------------------------------------------------
  // 화면 전환
  // ---------------------------------------------------------
  function setView(v) {
    G.view = v;
    document.body.dataset.view = v;
    FM.UI && FM.UI.onView && FM.UI.onView(v);
  }
  G.setView = setView;
  function buildInterior(iid) {
    if (G.interior) intScene.remove(G.interior.group);
    G.interior = FM.Int3D.build(iid);
    intScene.add(G.interior.group);
    const room = Sim.get().rooms[iid];
    const I = FM.INTERIORS[iid];
    intScene.background = new THREE.Color(room && room.theme === 'space' ? 0x05081a : room && room.theme === 'aquarium' ? 0x0a3a5a : I.kind === 'venue' ? 0x2a2438 : 0x3a3048);
  }
  G.rebuildInterior = () => { if (G.interior) buildInterior(G.interior.iid); };
  function enterInterior(iid, silent) {
    const st = Sim.get(), p = st.player;
    p.loc = iid;
    const d = Sim.interiorDoor(iid);
    if (!silent) { p.x = d.x; p.z = d.z - 0.6; p.ry = Math.PI; }
    buildInterior(iid);
    setView('interior');
    camDist = 9; camPitch = 0.75; camYaw = 0.35;
    if (iid === 'home_p_in') { Ev.onPlayerHost && 0; }
    fade();
    const fl = Soc.followers();
    fl.forEach((f, i) => { f.loc = iid; f.x = p.x + (i % 2 ? -0.9 : 0.9) * (1 + (i >> 1) * 0.6); f.z = p.z - 0.4 - (i >> 1) * 0.6; f.route = null; f.followUse = null; });
    FM.UI.toast(`🚪 ${FM.INTERIORS[iid].name}${fl.length ? ` — ${fl.map(f => f.name).join(', ')}와(과) 함께` : ''}`);
    if (fl.length) setTimeout(() => { const f = fl[(Math.random() * fl.length) | 0]; if (f && f.loc === iid) Sim.say(f, FM.L.sty(f, ['우와, 여기 처음 와봐!', '분위기 좋다~', '뭐 하고 놀까?', '여기 자주 와?'][(Math.random() * 4) | 0])); }, 900);
  }
  G.enterInterior = enterInterior;
  function exitInterior() {
    const st = Sim.get(), p = st.player;
    const I = FM.INTERIORS[p.loc];
    const pl = MAP.P[I.place];
    const d = Sim.placeDoor(I.place);
    const dx = d.x - pl.x, dz = d.z - pl.z, l = Math.hypot(dx, dz) || 1;
    const wasHome = p.loc === 'home_p_in';
    p.loc = 'island'; p.x = d.x + dx / l * 1.4; p.z = d.z + dz / l * 1.4; p.ry = Math.atan2(dx, dz);
    if (G.interior) { intScene.remove(G.interior.group); G.interior = null; }
    setView('island');
    camDist = 16; camPitch = 0.62;
    fade();
    Soc.followers().forEach((f, i) => {
      f.loc = 'island'; f.x = p.x + (i % 2 ? -1 : 1) * (1 + (i >> 1) * 0.7); f.z = p.z + 0.6; f.route = null; f.followUse = null; f.pose = null;
      if (f.following === 'short') Soc.removeFollower(f, '구경 재밌었다! 나 이제 가볼게~');
    });
    FM.Play && FM.Play.stop(true);
    if (wasHome) Ev.onPlayerExitHome();
    if (p.hosting) p.hosting = null;
  }
  G.exitInterior = exitInterior;

  // 아파트 관찰 모드 (2.5D 전경 그리드 뷰 → 창문 줌인)
  G.observe = function (roomId) {
    const st = Sim.get();
    G.prevView = G.view === 'observe' ? G.prevView : G.view;
    G.obs = roomId || null;
    if (!roomId) {
      if (G.interior && G.view === 'observe') { intScene.remove(G.interior.group); G.interior = null; }
      setView('observe');
      G.camMode = 'facade';
      return;
    }
    // 창문이 열리며 방 안 3D 공간으로 카메라가 유연하게 침투
    const w = FM.W.dyn.windows[roomId];
    G.zoomAnim = { t: 0, from: camera.position.clone(), to: w ? w.world.clone().add(new THREE.Vector3(0, -1, 1.2)) : camera.position.clone(), room: roomId };
  };
  function finishZoom(roomId) {
    buildInterior(roomId);
    setView('observe');
    G.camMode = 'window';
    G.obsYaw = 0; camDist = 8.5; camPitch = 0.5;
    fade(0.3);
  }
  G.endObserve = function () {
    if (G.interior && G.view === 'observe') { intScene.remove(G.interior.group); G.interior = null; }
    G.obs = null;
    const p = Sim.get().player;
    if (p.loc !== 'island') { buildInterior(p.loc); setView('interior'); } else setView('island');
  };
  // 빌라/플레이어 집 등 다른 실내 관찰 (관찰 카메라 UI 공용)
  G.observeInterior = function (iid) { G.prevView = G.view; G.obs = iid; finishZoom(iid); };
  function fade(t = 0.35) { const f = $('#fade'); f.classList.add('on'); setTimeout(() => f.classList.remove('on'), t * 1000); }
  G.fade = fade;

  // ---------------------------------------------------------
  // 입력
  // ---------------------------------------------------------
  function initInput() {
    window.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      G.keys[e.code] = true;
      if (FM.UI.editing && FM.UI.editKey && FM.UI.editKey(e)) { e.preventDefault(); return; }
      if (!$('#dialog').hidden) { if (['KeyE', 'Space', 'Enter'].includes(e.code)) { e.preventDefault(); FM.UI.vnAdvance(); } if (e.code === 'Escape') FM.UI.escape(); if (/^Digit[1-9]$/.test(e.code)) FM.UI.vnPick(+e.code.slice(5) - 1); return; }
      if (e.code === 'KeyE' || e.code === 'Space') { e.preventDefault(); interact(); }
      if (e.code === 'Escape') FM.UI.escape();
      if (e.code === 'KeyM') FM.UI.toggleMap();
      if (e.code === 'KeyR' && !FM.UI.modalOpen()) FM.UI.actionMenu();
      if (e.code === 'KeyO') { if (G.view === 'observe') G.endObserve(); else G.observe(); }
      if (e.code === 'KeyF') playerAction('fish');
      if (e.code === 'KeyB') playerAction('bug');
      if (e.code === 'KeyC') playerAction('sit');
      if (e.code === 'Digit1' && e.altKey) { }
    });
    window.addEventListener('keyup', e => { G.keys[e.code] = false; });
    const cv = $('#game');
    let drag = null;
    // 방 꾸미기: 가구를 잡고 끌어서 옮기기
    const floorPoint = e => {
      if (!G.interior) return null;
      mouse.x = e.clientX / window.innerWidth * 2 - 1; mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const fl = G.interior.group.getObjectByName('floor'); if (!fl) return null;
      const h = raycaster.intersectObject(fl, false)[0];
      return h ? G.interior.group.worldToLocal(h.point.clone()) : null;
    };
    const furnAt = e => {
      if (!FM.UI.editing || !G.interior) return null;
      mouse.x = e.clientX / window.innerWidth * 2 - 1; mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      for (const h of raycaster.intersectObjects(G.interior.group.children, true)) { if (h.object.userData.furnIdx !== undefined) return h.object.userData.furnIdx; if (h.object.userData.entity) continue; }
      return null;
    };
    // 휴대폰: 두 손가락으로 벌리고 오므려서 확대/축소
    const touches = new Map(); let pinchD = 0;
    cv.addEventListener('pointerdown', e => { touches.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (touches.size === 2) { const [a, b] = [...touches.values()]; pinchD = Math.hypot(a.x - b.x, a.y - b.y); drag = null; } });
    window.addEventListener('pointermove', e => {
      if (!touches.has(e.pointerId)) return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2 && pinchD) { const [a, b] = [...touches.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); camDist = Math.max(4, Math.min(G.view === 'island' ? 90 : 20, camDist * pinchD / Math.max(20, d))); pinchD = d; }
    });
    const tEnd = e => { touches.delete(e.pointerId); if (touches.size < 2) pinchD = 0; };
    window.addEventListener('pointerup', tEnd); window.addEventListener('pointercancel', tEnd);
    cv.addEventListener('pointerdown', e => {
      if (touches.size >= 2) return;
      drag = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
      const idx = furnAt(e);
      if (idx !== null) { drag.furn = idx; FM.UI.selectFurn(idx); cv.style.cursor = 'grabbing'; }
    });
    window.addEventListener('pointermove', e => {
      if (!drag || drag.id !== e.pointerId) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      if (drag.moved && drag.furn !== undefined) { const fp = floorPoint(e); if (fp) { drag.last = fp; FM.UI.dragFurn(drag.furn, fp.x, fp.z, false); } return; }
      if (drag.moved) {
        if (G.view === 'observe' && G.camMode === 'window') { G.obsYaw = Math.max(-0.5, Math.min(0.5, (G.obsYaw || 0) - dx * 0.003)); }
        else { camYaw -= dx * 0.006; camPitch = Math.max(0.15, Math.min(1.35, camPitch + dy * 0.004)); }
        drag.x = e.clientX; drag.y = e.clientY;
      }
    });
    window.addEventListener('pointerup', e => {
      if (!drag || drag.id !== e.pointerId) return;
      if (drag.furn !== undefined) { cv.style.cursor = ''; if (drag.moved && drag.last) FM.UI.dragFurn(drag.furn, drag.last.x, drag.last.z, true); drag = null; return; }
      if (!drag.moved && e.target === cv) click(e);
      drag = null;
    });
    cv.addEventListener('wheel', e => { e.preventDefault(); camDist = Math.max(4, Math.min(G.view === 'island' ? 90 : 20, camDist * (1 + Math.sign(e.deltaY) * 0.1))); }, { passive: false });
    // 모바일 조이스틱
    const stick = $('#stick'), knob = $('#knob');
    let sp = null;
    stick.addEventListener('pointerdown', e => { sp = { x: e.clientX, y: e.clientY, id: e.pointerId }; stick.setPointerCapture(e.pointerId); });
    stick.addEventListener('pointermove', e => { if (!sp || sp.id !== e.pointerId) return; const dx = e.clientX - sp.x, dy = e.clientY - sp.y, l = Math.min(40, Math.hypot(dx, dy)), a = Math.atan2(dy, dx); knob.style.transform = `translate(${Math.cos(a) * l}px,${Math.sin(a) * l}px)`; G.joy = { x: Math.cos(a) * l / 40, y: Math.sin(a) * l / 40 }; });
    const end = () => { sp = null; G.joy = null; knob.style.transform = ''; };
    stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
  }

  // 클릭: 주민 선택 / 창문 줌인 / 땅 클릭 이동 / 가구 편집
  function click(e) {
    mouse.x = e.clientX / window.innerWidth * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const st = Sim.get();
    if (G.view === 'observe' && !G.obs) {
      const id = FM.W.windowAt(raycaster);
      if (id) { G.observe(id); return; }
    }
    const sceneObj = G.view === 'island' ? islandScene : intScene;
    const hits = raycaster.intersectObjects(sceneObj.children, true);
    for (const h of hits) {
      let o = h.object;
      // 캐릭터
      while (o && !o.userData.entity && o.parent) o = o.parent;
      if (o && o.userData.entity) {
        const id = o.userData.entity;
        if (FM.UI.godPick && FM.UI.godPick(id)) return;
        const v = Sim.byId(id);
        if (v && v !== st.player) {
          if (G.view === 'observe' || (v.loc === st.player.loc && Math.hypot(v.x - st.player.x, v.z - st.player.z) < 5) || e.shiftKey) { FM.UI.talk(v); return; }
          FM.UI.showProfile(v); return;
        }
        if (Ev.staffById(id)) { FM.UI.staffTalk(Ev.staffById(id)); return; }
      }
      // 가구 (편집 모드)
      let f = h.object;
      if (FM.UI.editing && f.userData.furnIdx !== undefined) { FM.UI.selectFurn(f.userData.furnIdx); return; }
      if (FM.UI.editing && FM.UI.placing !== null && h.object.name === 'floor' && G.interior) { const p = G.interior.group.worldToLocal(h.point.clone()); FM.UI.moveFurnTo(p.x, p.z); return; }
      if (G.view === 'observe') continue;
      // 땅 클릭 → 이동
      if (h.object.name === 'terrain' || h.object.name === 'floor') {
        const p = h.point;
        if (G.view === 'interior' && G.interior) { const lp = G.interior.group.worldToLocal(p.clone()); G.target = { x: lp.x, z: lp.z }; }
        else G.target = { x: p.x, z: p.z };
        FM.UI.marker(p);
        return;
      }
      if (h.object.isMesh && !h.object.userData.furnIdx) continue;
    }
  }

  // ---------------------------------------------------------
  // 플레이어 이동
  // ---------------------------------------------------------
  let stepT = 0;
  function movePlayer(dt) {
    const st = Sim.get(), p = st.player;
    let ix = 0, iz = 0;
    const k = G.keys;
    if (k.KeyW || k.ArrowUp) iz -= 1; if (k.KeyS || k.ArrowDown) iz += 1;
    if (k.KeyA || k.ArrowLeft) ix -= 1; if (k.KeyD || k.ArrowRight) ix += 1;
    if (G.joy) { ix += G.joy.x; iz += G.joy.y; }
    // 앉아 있거나 가구를 쓰는 중에 방향키를 누르면 일어남
    if (p.sitting && (ix || iz) && G.view !== 'observe' && !FM.UI.modalOpen()) FM.Play.stop();
    if (G.view === 'observe' || FM.UI.modalOpen() || p.sitting || p.busy) { p.moving = false; return; }
    let dx = 0, dz = 0;
    if (ix || iz) {
      G.target = null; if (G.autoPath) { G.autoPath = null; G.autoDest = null; }
      const l = Math.hypot(ix, iz); ix /= Math.max(1, l); iz /= Math.max(1, l);
      const s = Math.sin(camYaw), c = Math.cos(camYaw);
      dx = ix * c + iz * s; dz = -ix * s + iz * c;
    } else if (G.target) {
      const tx = G.target.x - p.x, tz = G.target.z - p.z, d = Math.hypot(tx, tz);
      if (d < (G.autoPath ? 0.6 : 0.25)) {
        G.target = null;
        if (G.autoPath && G.autoPath.length) G.target = G.autoPath.shift();
        else if (G.autoPath) { G.autoPath = null; const r = G.autoDest; G.autoDest = null; if (r) { FM.UI.toast(`🎉 ${r.label}에 도착했어요!`); FM.Audio.sfx('pop'); FM.Guide.clearWaypointIfNear(); if (r.ry !== undefined && !r.villager) p.ry = r.ry; } }
      } else { dx = tx / d; dz = tz / d; }
    }
    const running = (k.ShiftLeft || k.ShiftRight || G.runBtn) && p.stamina > 0;
    const sp = (running ? 7 : G.autoPath ? 6 : 3.8) * dt;
    p.moving = !!(dx || dz);
    p.run = running && p.moving;
    if (!p.moving) return;
    if (running) p.stamina = Math.max(0, p.stamina - dt * 2.5);
    const nx = p.x + dx * sp, nz = p.z + dz * sp;
    if (p.loc === 'island') {
      if (T.canWalk(p.x, p.z, nx, nz)) { p.x = nx; p.z = nz; }
      else if (T.canWalk(p.x, p.z, nx, p.z)) p.x = nx;
      else if (T.canWalk(p.x, p.z, p.x, nz)) p.z = nz;
      else if (G.autoPath && G.autoPath.length) { G.target = G.autoPath.shift(); }
      else if (G.autoPath) { G.autoPath = null; G.target = null; const r = G.autoDest; G.autoDest = null; if (r) FM.UI.toast(`🚶 ${r.label} 근처에 도착했어요`); }
      else G.target = null;
      // 문으로 걸어 들어가기
      const door = nearDoor(p.x, p.z);
      if (door && G.autoDoor !== door.id && door.dist < 1.1) { G.autoDoor = door.id; FM.UI.hint(`E: ${door.name} 들어가기`); }
    } else {
      const { w, d } = Sim.interiorSize(p.loc);
      p.x = Math.max(-w / 2 + 0.35, Math.min(w / 2 - 0.35, nx));
      p.z = Math.max(-d / 2 + 0.35, Math.min(d / 2 - 0.2, nz));
    }
    p.ry = Math.atan2(dx, dz);
    // 발걸음 소리 (바닥 재질에 따라: 통나무 ➔ 삐걱, 대리석 ➔ 또각)
    stepT -= dt * (running ? 1.6 : 1);
    if (stepT < 0) {
      stepT = 0.38;
      let kind = 'grass';
      if (p.loc !== 'island') { const room = st.rooms[p.loc] || FM.INTERIORS[p.loc]; kind = room.floor || 'wood'; }
      else if (T.onBridge(p.x, p.z)) { kind = 'wood'; if (Math.random() < 0.3) FM.Audio.sfx('creak'); G.shake = Math.max(G.shake || 0, 0.15); }
      else if (p.z > 81) kind = 'sand';
      FM.Audio.sfx('step_' + kind);
    }
  }
  // 동행 모드: 플레이어를 따라다님 (여러 명이면 줄지어)
  function followAll(dt) {
    const st = Sim.get(), p = st.player;
    const fl = Soc.followers();
    fl.forEach((f, i) => followUpdate(p, f, i, fl.length, st));
    // 로맨틱한 장소 방문 (설렘 상승)
    if (p.loc === 'island' && fl.length && Math.random() < 0.004) {
      const rp = ['cliff', 'beach', 'observatory', 'park'].find(id => { const pl = MAP.P[id]; return Math.hypot(p.x - pl.x, p.z - pl.z) < 20; });
      if (rp) for (const f of fl) if (Soc.canRomance(f.id, 'P')) { Soc.addRomance(f.id, 'P', 1.5, '로맨틱한 장소'); Sim.emote(f, '💗'); }
    }
  }
  function followUpdate(p, f, i, n, st) {
    if (!f || f.sceneId) return;
    if (st.time > (f.followUntil || 0)) { Soc.removeFollower(f, '앗, 나 이제 가봐야 해! 오늘 즐거웠어~'); return; }
    f.route = null;
    if (f.loc !== p.loc) { f.loc = p.loc; f.x = p.x; f.z = p.z; f.followUse = null; }
    // 플레이어가 가구를 쓰면 근처 빈 자리에서 같이 놀기
    if (p.using && p.loc !== 'island') {
      if (!f.followUse) {
        const cand = Sim.furnUses(p.loc).filter(u => !Sim.useOcc[u.key] && Math.hypot(u.x - p.x, u.z - p.z) < 4.5).sort((a, b) => (a.F.id === p.using.type ? -1 : 0) - (b.F.id === p.using.type ? -1 : 0) || Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
        if (cand) { Sim.useOcc[cand.key] = f.id; f.useKey = cand.key; f.followUse = cand; f.x = cand.x; f.z = cand.z; f.ry = cand.ry; f.pose = cand.u.pose; f.act = { id: 'follow_' + cand.u.act, name: cand.F.name, t: 999, y: cand.u.y || 0 }; f.state = 'INTERACT_OBJ'; Sim.emote(f, '😆'); }
        else f.followUse = 'none';
      }
      if (f.followUse && f.followUse !== 'none') return;
    } else if (f.followUse) {
      if (f.followUse !== 'none') Sim.freeUse(f);
      f.followUse = null; f.pose = null; f.act = null;
    }
    f.act = null;
    // 뒤따르는 위치: 플레이어 뒤쪽으로 부채꼴
    const back = p.ry || 0, side = (i % 2 ? -1 : 1) * (0.7 + (i >> 1) * 0.5), dist = 1.3 + (i >> 1) * 0.9;
    const tx = p.x - Math.sin(back) * dist + Math.cos(back) * side, tz = p.z - Math.cos(back) * dist - Math.sin(back) * side;
    const d = Math.hypot(tx - f.x, tz - f.z);
    if (d > 0.35) {
      const k = Math.min(1, (d > 6 ? 0.3 : 0.12) * (p.moving ? 1.2 : 0.8));
      let nx = f.x + (tx - f.x) * k, nz = f.z + (tz - f.z) * k;
      if (p.loc !== 'island') { const sz = Sim.interiorSize(p.loc); nx = Math.max(-sz.w / 2 + 0.4, Math.min(sz.w / 2 - 0.4, nx)); nz = Math.max(-sz.d / 2 + 0.4, Math.min(sz.d / 2 - 0.3, nz)); }
      else if (d > 25) { nx = tx; nz = tz; }
      f.ry = Math.atan2(nx - f.x, nz - f.z); f.x = nx; f.z = nz; f.moving = d > 0.6; f.idleT = 2; f.pose = null; f.state = 'WALK';
    } else if (!p.moving) { f.moving = false; f.state = 'WATCH_LOOK'; f.ry = Math.atan2(p.x - f.x, p.z - f.z); }
    // 로맨틱한 장소 방문 (설렘 상승)
    const rp = ['cliff', 'beach', 'observatory', 'park'].find(id => { const pl = MAP.P[id]; return Math.hypot(p.x - pl.x, p.z - pl.z) < 20; });
    if (rp && Soc.canRomance(f.id, 'P') && Math.random() < 0.004) { Soc.addRomance(f.id, 'P', 1.5, '로맨틱한 장소'); Sim.emote(f, '💗'); }
  }

  function nearDoor(x, z) {
    let best = null;
    for (const pl of Object.values(MAP.P)) {
      if (!pl.door || !pl.interior && pl.id !== 'apartment') continue;
      const d = Math.hypot(pl.door[0] - x, pl.door[1] - z);
      if (d < 2.2 && (!best || d < best.dist)) best = { id: pl.id, dist: d, name: pl.name, place: pl };
    }
    return best;
  }

  // ---------------------------------------------------------
  // 상호작용 (E / Space)
  // ---------------------------------------------------------
  function interactables() {
    const st = Sim.get(), p = st.player;
    const out = [];
    const add = (dist, label, fn, pri = 0) => out.push({ dist: dist - pri, label, fn });
    // 주민 / 스태프
    for (const v of st.villagers.concat(Ev.staff, st.visitors)) {
      if (v.loc !== p.loc) continue;
      const d = Math.hypot(v.x - p.x, v.z - p.z);
      if (d < 2.4) add(d, `💬 ${v.name}에게 말 걸기`, () => (v.staff ? FM.UI.staffTalk(v) : v.visitor ? FM.UI.toast(`${v.name}: "섬이 참 예쁘네요!"`) : FM.UI.talk(v)), 0.5);
    }
    if (p.loc === 'island') {
      const dr = nearDoor(p.x, p.z);
      if (dr) add(dr.dist, dr.id === 'apartment' ? '🏢 시티 타워 (관찰 / 방문)' : `🚪 ${dr.name} 들어가기`, () => (dr.id === 'apartment' ? FM.UI.apartmentMenu() : enterInterior(dr.place.interior)));
      for (const [k, s] of Object.entries(MAP.STATIONS)) { const d = Math.hypot(s.x - p.x, s.z - p.z); if (d < 3.2) add(d, `🚇 ${s.name} (지하철 타기)`, () => FM.UI.metro(k)); }
      const mb = MAP.P.home_p.spots[0]; if (Math.hypot(mb[0] - p.x, mb[1] - p.z) < 2) add(1, '📮 우편함 열기', () => FM.UI.mailbox());
      if (Math.hypot(p.x, p.z - 10) < 5) add(2, '🪙 분수대 소원 동전 던지기', () => FM.UI.wish());
      if (Math.hypot(p.x - 12, p.z + 66) < 6) add(2.2, '💐 버진로드 꽃 종류 바꾸기', () => FM.UI.aisle());
      // 결혼식 준비 (청소/장식)
      const wi = Ev.weddingInteract && (st.weddingTrash || []).some(t => !t.done && Math.hypot(t.x - p.x, t.z - p.z) < 2) || (st.weddingDeco || []).some(t => !t.done && Math.hypot(t.x - p.x, t.z - p.z) < 2);
      if (wi) add(0.5, '💒 결혼식장 준비하기', () => { const r = Ev.weddingInteract(p.x, p.z); if (r) FM.UI.toast(r); });
      // 편지함 (주민 집 문 앞) — 비밀 편지 넣기
      for (const q of Soc.activeQuests().filter(q => q.type === 'secret_letter' && q.stage === 'deliver')) {
        const t = Sim.byId(q.target); if (!t) continue;
        const dd = Sim.placeDoor(FM.INTERIORS[t.home].place);
        const d = Math.hypot(dd.x - p.x, dd.z - p.z);
        if (d < 3) add(d, `💌 ${t.name}의 편지함에 몰래 넣기`, () => { if (Ev.deliverLetter(t.id)) FM.UI.toast('💌 몰래 편지함에 넣었어요! 다음 날 반응을 살펴보세요'); });
      }
      // 플리마켓 가판대
      if (st.flea && st.flea.day === Sim.time.day() && Math.hypot(p.x + 72, p.z - 67) < 7) add(2, '🧺 플리마켓 구경하기', () => FM.UI.flea());
      // 페리 방명록
      if (Math.hypot(p.x - 52, p.z - 96) < 5) add(2.4, '📖 페리 방명록 보기', () => FM.UI.ferryBook());
      // 빌라 마당 꾸미기
      for (const pl of FM.MAP.PLOTS.concat([{ id: 'home_p' }])) { const P2 = MAP.P[pl.id]; const d = Math.hypot(P2.x - p.x, P2.z - p.z); if (d < 9 && d > 3) add(d + 3, `🏡 ${P2.name} 외관/마당 꾸미기`, () => FM.UI.yardEditor(pl.id)); }
      // 물가 / 나무 (낚시, 곤충 채집)
      if (nearWater(p.x, p.z)) add(3, '🎣 낚시하기 (F)', () => playerAction('fish'));
      // 서핑하다 떠내려간 주민 구조
      for (const v of st.villagers) if (v.status.needRescue && v.status.needRescue > st.time - 60 && Math.hypot(v.x - p.x, v.z - p.z) < 8) add(1, `🛟 ${v.name} 구조하기`, () => { v.status.needRescue = 0; Soc.addFriend(v.id, 'P', 8, 10, '구조'); v.pose = null; v.x = v.x; v.z = 94; FM.UI.toast(`🛟 ${v.name}을(를) 구조했어요! 친밀도·신뢰도 상승`); });
    } else {
      // 실내
      const I = FM.INTERIORS[p.loc];
      const dd = Sim.interiorDoor(p.loc);
      const dDoor = Math.hypot(dd.x - p.x, dd.z - p.z);
      if (dDoor < 1.5 && p.loc !== 'metro') add(dDoor, '🚪 밖으로 나가기', () => exitInterior());
      const shop = { mall_in: 'mall', conv_in: 'conv', cafe_in: 'cafe', med_in: 'pharmacy', library_in: 'library', workshop_in: 'workshop', tea_in: 'tea' }[p.loc];
      if (shop) add(2.5, '🛍️ 상점 이용하기', () => FM.UI.shop(shop));
      if (p.loc === 'hall_in') add(2.5, '🏛️ 민원 창구 (별명 변경, 가계도, 이혼, 부지 하사, 집 증축)', () => FM.UI.cityHall());
      if (p.loc === 'office_in') add(2.6, '💼 오피스 아르바이트 하기 (+코인)', () => FM.UI.partTime());
      if (p.loc === 'library_in') add(2.8, '📖 시집 124페이지 펼쳐보기', () => { const r = Ev.readBookNote(); FM.UI.toast(r || '📖 아무 쪽지도 없어요.'); });
      if (p.loc === 'tea_in') add(2.8, '📜 방명록 읽기', () => FM.UI.guestbook());
      if (p.loc === 'cafe_in' && p.inv.truth_tea) add(1.2, "🫖 '진실의 홍차' 하사하기", () => { Soc.takeItem('truth_tea'); FM.UI.dialogList('🫖 진실만을 말하게 하는 홍차', Ev.truthTea()); });
      if (p.loc === 'home_p_in') {
        add(2.9, '🛏️ 쉬기 (스태미나 회복)', () => { p.stamina = 100; FM.UI.toast('😴 푹 쉬었어요! 스태미나 100'); });
        if (p.spouse || (p.chest && p.chest.length)) add(2.7, '🧺 신혼집 수납장 열기', () => FM.UI.chest());
        add(3, '🏠 우리 집 꾸미기', () => FM.UI.openRoomEditor('home_p_in'));
      }
      if (I.kind === 'room' && p.loc !== 'home_p_in') add(3, '🔭 이 방 관찰 화면 열기', () => G.observeInterior(p.loc));
    }
    FM.Play.options(add);
    out.sort((a, b) => a.dist - b.dist);
    return out;
  }
  G.interactables = interactables;
  function nearWater(x, z) {
    for (let a = 0; a < 8; a++) { const px = x + Math.cos(a * Math.PI / 4) * 2, pz = z + Math.sin(a * Math.PI / 4) * 2; if (T.inWater(px, pz) || T.height(px, pz) < 0.15) return true; }
    return false;
  }
  function interact() {
    if (FM.UI.modalOpen()) return;
    const st = Sim.get();
    if (st.player.sitting) { FM.Play.stop(); return; }
    const list = interactables();
    if (list.length) list[0].fn();
  }
  G.interact = interact;

  // 플레이어 행동 (낚시, 곤충 채집, 앉기) — 짝사랑/연인 주민이 따라함
  function playerAction(kind) {
    const st = Sim.get(), p = st.player;
    if (G.view === 'observe' || p.busy) return;
    if (kind === 'sit') { p.sitting = !p.sitting; p.pose = p.sitting ? 'sit' : null; Ev.onPlayerAction('sit'); return; }
    if (kind === 'fish') {
      if (!p.inv.rod) return FM.UI.toast('낚싯대가 필요해요 (쇼핑몰)');
      if (!nearWater(p.x, p.z) && p.loc === 'island') return FM.UI.toast('물가에서 낚시할 수 있어요');
      if (p.stamina < 5) return FM.UI.toast('스태미나가 부족해요. 음식을 먹거나 집에서 쉬세요');
      p.busy = true; p.pose = 'fish'; p.prop = 'rod'; p.stamina -= 5;
      Ev.onPlayerAction('fish');
      setTimeout(() => { p.busy = false; p.pose = null; p.prop = null; if (Math.random() < 0.65) { Soc.giveItem('fish_catch'); FM.UI.toast('🐟 물고기를 낚았어요!'); } else FM.UI.toast('💨 놓쳤어요...'); }, 2600);
      return;
    }
    if (kind === 'bug') {
      if (!p.inv.net) return FM.UI.toast('잠자리채가 필요해요 (쇼핑몰)');
      if (p.stamina < 3) return FM.UI.toast('스태미나가 부족해요');
      p.busy = true; p.pose = 'swing'; p.prop = 'net'; p.stamina -= 3;
      Ev.onPlayerAction('bug');
      setTimeout(() => { p.busy = false; p.pose = null; p.prop = null; if (Math.random() < 0.5) { Soc.giveItem('bug_jar'); FM.UI.toast('🦋 곤충을 잡았어요!'); } else FM.UI.toast('💨 날아가 버렸어요'); }, 1400);
    }
  }
  G.playerAction = playerAction;

  // ---------------------------------------------------------
  // 카메라
  // ---------------------------------------------------------
  function updateCamera(dt) {
    const st = Sim.get(), p = st.player;
    if (G.zoomAnim) {
      const z = G.zoomAnim; z.t += dt / 0.9;
      const k = Math.min(1, z.t), e = k * k * (3 - 2 * k);
      camera.position.lerpVectors(z.from, z.to, e);
      camera.lookAt(z.to.x, z.to.y, z.to.z - 3);
      if (k >= 1) { G.zoomAnim = null; finishZoom(z.room); }
      return;
    }
    if (G.view === 'observe' && !G.obs) {
      // 2.5D 전경 그리드 뷰: 아파트 정면
      const tgt = new THREE.Vector3(0, 14, -9);
      const pos = new THREE.Vector3(0, 16, 26);
      camera.position.lerp(pos, Math.min(1, dt * 3));
      camera.lookAt(tgt);
      return;
    }
    if (G.view === 'observe' && G.obs) {
      const { d } = Sim.interiorSize(G.obs);
      if (G.camMode === 'window') {
        // 2D 창문 정면 뷰
        const y = G.obsYaw || 0;
        camera.position.set(Math.sin(y) * (d + 3), 2.4, Math.cos(y) * (d / 2 + 5.5));
        camera.lookAt(0, 1.1, 0);
      } else {
        // 3D 풀 오비트(Orbit) 자유 카메라
        const cp = Math.max(0.2, Math.min(1.3, camPitch));
        camera.position.set(Math.sin(camYaw) * Math.cos(cp) * camDist, Math.sin(cp) * camDist + 0.8, Math.cos(camYaw) * Math.cos(cp) * camDist);
        camera.lookAt(0, 0.9, 0);
      }
      return;
    }
    // 따라가기
    const gy = p.loc === 'island' ? T.groundY(p.x, p.z) : 0;
    const want = new THREE.Vector3(p.x, gy + 1.0, p.z);
    let dist = camDist;
    // 미연시 대화 중: 두 사람 사이로 카메라를 부드럽게 당김
    const tf = G.talkFocus && Sim.byId(G.talkFocus);
    if (tf && tf.loc === p.loc) { want.set((p.x + tf.x) / 2, gy + 1.0, (p.z + tf.z) / 2); G.talkDist = (G.talkDist || camDist) + (Math.min(camDist, 8) - (G.talkDist || camDist)) * Math.min(1, dt * 3); dist = G.talkDist; }
    else G.talkDist = null;
    camTarget.lerp(want, Math.min(1, dt * 6));
    camPos.set(camTarget.x + Math.sin(camYaw) * Math.cos(camPitch) * dist, camTarget.y + Math.sin(camPitch) * dist, camTarget.z + Math.cos(camYaw) * Math.cos(camPitch) * dist);
    if (p.loc === 'island') { const gh = T.height(camPos.x, camPos.z) + 1.2; if (camPos.y < gh) camPos.y = gh; }
    camera.position.copy(camPos);
    if (G.shake > 0) { G.shake -= dt; camera.position.x += (Math.random() - 0.5) * 0.12; camera.position.y += (Math.random() - 0.5) * 0.08; }
    camera.lookAt(camTarget);
  }
  G.setCam = (yaw, pitch, dist) => { camYaw = yaw; camPitch = pitch; camDist = dist; };
  G.focusOn = function (x, z) { const p = Sim.get().player; if (p.loc !== 'island') return; camTarget.set(x, T.groundY(x, z), z); };

  // ---------------------------------------------------------
  // 루프
  // ---------------------------------------------------------
  let saveT = 0, bgmT = 0;
  function loop() {
    requestAnimationFrame(loop);
    try { frame(); } catch (e) { console.error(e); }
  }
  // 목적지 빛기둥: ⭐ 퀘스트(노랑) · 📍 표시한 목적지(분홍)
  const beacons = {};
  function makeBeacon(color) {
    const g = new THREE.Group();
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.9, 40, 16, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
    beam.position.y = 20; g.add(beam);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.12, 8, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.15; g.add(ring);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 16), new THREE.MeshBasicMaterial({ color }));
    cone.rotation.x = Math.PI; g.add(cone);
    g.userData = { ring, cone, beam };
    g.visible = false; islandScene.add(g);
    return g;
  }
  function makeBeacons() { if (beacons.q) return; beacons.q = makeBeacon(0xffc83a); beacons.w = makeBeacon(0xff7fb0); }
  function updateBeacons(dt, st) {
    if (!beacons.q) return;
    const p = st.player, t = performance.now() / 1000;
    const q = FM.Guide.pinned(); const qd = q && FM.Guide.questDest(q);
    const list = [[beacons.q, qd && FM.Guide.resolve(qd)], [beacons.w, FM.Guide.waypointPos()]];
    if (list[1][1] && list[0][1] && Math.hypot(list[1][1].x - list[0][1].x, list[1][1].z - list[0][1].z) < 2) list[1][1] = null;
    for (const [b, pos] of list) {
      const show = !!pos && G.view === 'island' && p.loc === 'island' && Math.hypot(pos.x - p.x, pos.z - p.z) > 2.5;
      b.visible = show; if (!show) continue;
      const y = T.groundY(pos.x, pos.z);
      b.position.set(pos.x, y, pos.z);
      const u = b.userData;
      u.cone.position.y = 3.2 + Math.sin(t * 3) * 0.35; u.cone.rotation.y = t * 2;
      const k = 1 + (t % 1.5) / 1.5 * 0.8; u.ring.scale.set(k, k, k); u.ring.material.opacity = 0.9 - (t % 1.5) / 1.5 * 0.8;
      u.beam.material.opacity = 0.18 + Math.sin(t * 2) * 0.06;
    }
    FM.Guide.clearWaypointIfNear();
  }
  function frame() {
    const dt = Math.min(0.05, clock.getDelta());
    const st = Sim.get();
    if (!FM.UI.paused()) Sim.tick(dt);
    movePlayer(dt);
    followAll(dt);
    updateCamera(dt);
    const p = st.player;
    const h = Sim.time.hour();
    // 렌더 대상
    const ents = st.villagers.concat(Ev.staff, st.visitors, [Object.assign(p, { id: 'P', outfit: p.outfit || null, state: p.moving ? 'WALK' : 'IDLE' })]);
    if (G.view === 'island' || (G.view === 'observe' && !G.obs) || G.zoomAnim) {
      FM.W.applyTime(h, st.weather.type, camTarget);
      FM.W.update(dt, st, camTarget, camera.position);
      updateBeacons(dt, st);
      FM.Chars.sync(ents, 'island', islandScene, dt, { cullFrom: G.view === 'observe' ? { x: 0, z: -10 } : camTarget, cullR: G.view === 'observe' ? 60 : Math.max(70, camDist * 3) });
      renderer.render(islandScene, camera);
    } else {
      const iid = G.view === 'observe' ? G.obs : p.loc;
      if (G.interior && G.interior.iid !== iid) buildInterior(iid);
      if (!G.interior) buildInterior(iid);
      FM.Int3D.update(G.interior, dt, performance.now() / 1000);
      FM.Chars.sync(ents, iid, G.interior.group, dt, { spaceFloat: G.interior.set === 'space' });
      renderer.render(intScene, camera);
    }
    // BGM
    if ((bgmT -= dt) < 0) { bgmT = 1; FM.UI.pickBgm(); }
    FM.UI.frame(dt, camera);
  }

  // 부트
  window.addEventListener('DOMContentLoaded', () => {
    initRenderer();
    initInput();
    FM.UI.startScreen();
  });
  FM.bus.on('shake', () => { G.shake = 0.8; });
  FM.bus.on('birdsFlee', () => { FM.W.birdsFlee(); FM.Audio.sfx('bird'); });
  FM.bus.on('blackout', ({ iid }) => { if (G.interior && G.interior.iid === iid) { G.fade(0.6); FM.Audio.sfx('boom'); setTimeout(() => G.rebuildInterior(), 250); } });
})();
