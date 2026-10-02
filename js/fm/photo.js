/* =========================================================
 *  📸 추억 사진관 — 진짜 사진 찍기 게임 + 우리 집 앨범 + 주민들의 사진 액자
 *   - 사진관 안에서 '사진 찍기' → 함께 찍을 주민(최대 3명) · 배경 · 사람마다 표정 & 포즈 → 미리보기 → 찰칵!
 *   - 오프스크린 3D 렌더러로 실제 캐릭터를 포즈 · 표정 그대로 그려서 폴라로이드 사진으로 저장
 *   - 사진은 '우리 집'의 앨범 책상에 모임 (집에서 앨범을 펼쳐 봄) · 벽에 걸 수도 있음
 *   - 사진에 함께 나온 주민이 나와 친하거나 연인 · 가족이면 그 주민도 자기 집 벽에 사진을 걸어 둠
 *   - 친한 주민끼리(연인 · 단짝 · 가족)도 가끔 사진관에 가서 둘이 사진을 찍고 서로의 집에 걸어 둠
 *  저장: st.photos{id: {url, who, day, cap, bg}} · st.album[id] · v.album[id] · 액자 가구 f.photoId
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE, Sim = FM.Sim, Soc = FM.Soc;
  if (!Sim || !Soc) return;
  const P = 'P', S = () => Sim.get();
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const Ph = (FM.Photo = {});
  const W = 288, H = 216;   // 저장 크기 (작게 → 저장 공간 절약)

  // ---------------------------------------------------------
  // 배경 · 표정 · 포즈 목록
  // ---------------------------------------------------------
  const BG = {
    sky: { name: '☁️ 맑은 하늘', draw: (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#5ab0f0'); g.addColorStop(1, '#d8f0ff'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,0.95)'; for (const [x, y, s] of [[60, 50, 22], [90, 44, 28], [120, 52, 20], [360, 80, 24], [395, 72, 30], [430, 84, 20]]) { c.beginPath(); c.arc(x, y, s, 0, 7); c.fill(); } c.fillStyle = '#7ad06a'; c.beginPath(); c.ellipse(140, h + 40, 260, 110, 0, 0, 7); c.fill(); c.fillStyle = '#5ab84a'; c.beginPath(); c.ellipse(420, h + 50, 240, 110, 0, 0, 7); c.fill(); } },
    sakura: { name: '🌸 벚꽃', draw: (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffe4ee'); g.addColorStop(1, '#fff6f8'); c.fillStyle = g; c.fillRect(0, 0, w, h); for (let i = 0; i < 70; i++) { const x = (i * 97) % w, y = (i * 53) % (h * 0.6); c.fillStyle = ['#ffb8d0', '#ffd0e0', '#ff9cc0'][i % 3]; c.beginPath(); c.arc(x, y, 16 + (i % 4) * 6, 0, 7); c.fill(); } c.fillStyle = '#8a5a4a'; c.fillRect(30, 80, 14, h); c.fillRect(w - 50, 70, 14, h); for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(255,170,200,0.8)'; c.beginPath(); c.ellipse((i * 61) % w, h * 0.5 + (i * 37) % (h * 0.5), 5, 3, i, 0, 7); c.fill(); } } },
    sunset: { name: '🌅 바다 노을', draw: (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h * 0.62); g.addColorStop(0, '#6a4aa8'); g.addColorStop(0.55, '#ff8a6a'); g.addColorStop(1, '#ffd08a'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = '#ffe8a0'; c.beginPath(); c.arc(w * 0.7, h * 0.58, 46, 0, 7); c.fill(); const s = c.createLinearGradient(0, h * 0.6, 0, h); s.addColorStop(0, '#3a6ab8'); s.addColorStop(1, '#1a3a78'); c.fillStyle = s; c.fillRect(0, h * 0.62, w, h); c.fillStyle = 'rgba(255,220,160,0.6)'; for (let i = 0; i < 8; i++) c.fillRect(w * 0.6 + (i % 2) * 20, h * 0.65 + i * 10, 80 - i * 8, 3); } },
    stars: { name: '🌙 별밤', draw: (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0a1440'); g.addColorStop(1, '#3a2a6a'); c.fillStyle = g; c.fillRect(0, 0, w, h); for (let i = 0; i < 140; i++) { c.fillStyle = `rgba(255,255,${200 + (i % 55)},${0.4 + (i % 5) * 0.12})`; c.fillRect((i * 131) % w, (i * 71) % h, 2, 2); } c.fillStyle = '#fff4c0'; c.beginPath(); c.arc(w * 0.82, 60, 30, 0, 7); c.fill(); c.fillStyle = '#0a1440'; c.beginPath(); c.arc(w * 0.82 + 12, 52, 28, 0, 7); c.fill(); } },
    hearts: { name: '💗 파스텔 하트', draw: (c, w, h) => { c.fillStyle = '#ffe0ec'; c.fillRect(0, 0, w, h); for (let i = 0; i < 30; i++) { const x = (i * 83) % w, y = (i * 47) % h, s = 10 + (i % 4) * 6; c.fillStyle = ['#ffb0cc', '#fff0f6', '#ffc8dc'][i % 3]; c.beginPath(); c.moveTo(x, y + s * 0.3); c.bezierCurveTo(x, y, x - s, y, x - s, y + s * 0.4); c.bezierCurveTo(x - s, y + s, x, y + s * 1.2, x, y + s * 1.5); c.bezierCurveTo(x, y + s * 1.2, x + s, y + s, x + s, y + s * 0.4); c.bezierCurveTo(x + s, y, x, y, x, y + s * 0.3); c.fill(); } } },
    studio: { name: '🤍 화이트 스튜디오', draw: (c, w, h) => { const g = c.createRadialGradient(w / 2, h * 0.45, 20, w / 2, h * 0.5, w * 0.7); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c8ccd4'); c.fillStyle = g; c.fillRect(0, 0, w, h); } },
    fireworks: { name: '🎆 불꽃놀이', draw: (c, w, h) => { c.fillStyle = '#0c0a2a'; c.fillRect(0, 0, w, h); for (const [x, y, col] of [[110, 80, '#ff6a8a'], [300, 60, '#ffd84a'], [420, 120, '#6ae0ff'], [200, 140, '#b69cff']]) for (let i = 0; i < 24; i++) { const a = i / 24 * 7; c.strokeStyle = col; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10); c.lineTo(x + Math.cos(a) * 46, y + Math.sin(a) * 46); c.stroke(); } c.fillStyle = '#c0392b'; c.fillRect(0, h - 40, w, 40); for (let i = 0; i < 10; i++) { c.fillStyle = '#ffd890'; c.beginPath(); c.ellipse(24 + i * 52, h - 52, 10, 13, 0, 0, 7); c.fill(); } } },
    onsen: { name: '♨️ 온천 후지산', draw: (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8ad0f0'); g.addColorStop(1, '#e8f6ff'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = '#4a6aa8'; c.beginPath(); c.moveTo(w * 0.2, h * 0.7); c.lineTo(w * 0.5, h * 0.18); c.lineTo(w * 0.8, h * 0.7); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(w * 0.42, h * 0.3); c.lineTo(w * 0.5, h * 0.18); c.lineTo(w * 0.58, h * 0.3); c.lineTo(w * 0.52, h * 0.27); c.lineTo(w * 0.47, h * 0.31); c.fill(); c.fillStyle = '#c8925a'; c.fillRect(0, h * 0.7, w, h * 0.3); c.fillStyle = 'rgba(255,255,255,0.4)'; for (let i = 0; i < 12; i++) { c.beginPath(); c.arc(30 + i * 40, h * 0.68, 14, 0, 7); c.fill(); } } },
  };
  const EXPR = { happy: '😊 웃음', laugh: '😆 활짝', love: '😍 하트눈', shy: '😳 수줍', smug: '😏 새침', surprised: '😲 깜짝', pout: '😤 뾰로통', determined: '🔥 결의', sleepy: '😪 졸림', cry: '🥹 감동' };
  const POSE = { stand: '🧍 기본', pose: '✌️ 브이', cheer: '🙌 만세', cute: '🥰 귀요미', highfive: '🖐️ 하이파이브', point: '👉 가리키기', bow: '🙇 인사', dance: '💃 댄스', hug: '🤗 포옹', photo: '📷 찰칵', kiss: '😘 뽀뽀', jumpPop: '🦘 점프' };
  Ph.BG = BG; Ph.EXPR = EXPR; Ph.POSE = POSE;

  // ---------------------------------------------------------
  // 오프스크린 렌더러 (캐릭터만, 투명 배경) → 2D 캔버스에 배경 · 그림자 · 폴라로이드 합성
  // ---------------------------------------------------------
  let R = null, scene, cam, cv;
  const bgCache = new Map();
  function init() {
    cv = document.createElement('canvas'); cv.width = 480; cv.height = 360;
    R = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    R.setPixelRatio(1); R.setSize(480, 360, false); R.outputEncoding = THREE.sRGBEncoding; R.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff4e8, 0x8a7a88, 0.9));
    scene.add(new THREE.AmbientLight(0xffeef0, 0.18));
    const key = new THREE.DirectionalLight(0xffeedd, 0.75); key.position.set(2, 4, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0xd8e8ff, 0.5); rim.position.set(-3, 3, -3); scene.add(rim);
    cam = new THREE.PerspectiveCamera(28, 480 / 360, 0.1, 50);
  }
  const lookOf = id => { const st = S(); if (id === P) return st.player.look || ISLE.normalizeLook({ species: 'human' }); const v = Sim.byId(id); if (!v) return null; try { return FM.Chars.outfitLook(v); } catch (e) { return v.look; } };
  const kidScale = id => { const v = id === P ? null : Sim.byId(id); return v && v.child ? ({ BABY: 0.6, TODDLER: 0.72, CHILD: 0.86 }[v.child.stage] || 1) : 1; };
  const nameOf = id => (id === P ? S().player.name : (Sim.byId(id) || {}).name || '?');
  function bgCanvas(key) {
    if (bgCache.has(key)) return bgCache.get(key);
    const c = document.createElement('canvas'); c.width = 480; c.height = 360; (BG[key] || BG.studio).draw(c.getContext('2d'), 480, 360); bgCache.set(key, c); return c;
  }
  // people: [{id, expr, pose}] → 480×360 캔버스
  function renderScene(people, bg) {
    if (!R) init();
    const objs = [];
    const n = people.length, gap = 1.05;
    people.forEach((pp, i) => {
      const look = lookOf(pp.id); if (!look) return;
      const c = ISLE.M.character(Object.assign({}, look));
      if (pp.expr && ISLE.M.setExpr) ISLE.M.setExpr(c, pp.expr);
      const k = kidScale(pp.id); c.root.scale.setScalar(k);
      c.root.position.set((i - (n - 1) / 2) * gap, 0, (i % 2) * 0.12);
      c.root.rotation.y = ((n - 1) / 2 - i) * 0.12;
      scene.add(c.root); objs.push(c);
      try { ISLE.M.animate(c, 0.016, 0); c.body.rotation.set(0, 0, 0); c.body.position.set(0, 0, 0); c.head.rotation.set(0, 0, 0); const f = FM.Anim.POSES[pp.pose]; if (f && pp.pose !== 'stand') f(c, 0.55); } catch (e) { /* 포즈 없음 */ }
    });
    const dist = 3.0 + n * 0.75;
    cam.position.set(0, 1.05, dist); cam.lookAt(0, 0.72, 0); cam.updateProjectionMatrix();
    R.render(scene, cam);
    const out = document.createElement('canvas'); out.width = 480; out.height = 360; const g = out.getContext('2d');
    g.drawImage(bgCanvas(bg), 0, 0);
    // 바닥 그림자
    g.fillStyle = 'rgba(0,0,0,0.18)'; people.forEach((pp, i) => { const x = 240 + (i - (n - 1) / 2) * gap * (480 / (dist * 0.55)) * 0.5; g.beginPath(); g.ellipse(x, 318, 46, 11, 0, 0, 7); g.fill(); });
    g.drawImage(cv, 0, 0);
    // 비네트 + 따뜻한 빛
    const vg = g.createRadialGradient(240, 170, 120, 240, 180, 330); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(40,20,0,0.28)'); g.fillStyle = vg; g.fillRect(0, 0, 480, 360);
    g.fillStyle = 'rgba(255,200,140,0.08)'; g.fillRect(0, 0, 480, 360);
    for (const c of objs) scene.remove(c.root);
    return out;
  }
  // 폴라로이드 틀 + 글씨 → 저장용 작은 JPEG
  function polaroid(src, cap) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.fillStyle = '#fbf8f2'; g.fillRect(0, 0, W, H);
    g.drawImage(src, 0, 0, 480, 360, 10, 8, W - 20, (W - 20) * 0.75);
    g.fillStyle = '#5a4a3a'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.fillText((cap || '').slice(0, 26), W / 2, H - 6);
    g.fillStyle = '#e8803a'; g.font = '9px monospace'; g.textAlign = 'right'; g.fillText(`D+${Sim.time.day()}`, W - 14, 8 + (W - 20) * 0.75 - 6);
    return c.toDataURL('image/jpeg', 0.74);
  }
  Ph.render = (people, bg, cap) => polaroid(renderScene(people, bg), cap);
  Ph.preview = (people, bg) => renderScene(people, bg).toDataURL('image/jpeg', 0.8);

  // ---------------------------------------------------------
  // 저장 · 관계 · 액자
  // ---------------------------------------------------------
  const store = () => { const st = S(); st.photos = st.photos || {}; st.album = st.album || []; return st; };
  Ph.url = id => { const st = S(); return st && st.photos && st.photos[id] ? st.photos[id].url : ''; };
  const close = (a, b) => {
    if (a === b) return false;
    if (Soc.partnerOf(a) === b) return true;
    const va = a === P ? null : Sim.byId(a), vb = b === P ? null : Sim.byId(b);
    const fam = x => x && x.child && x.child.parents || [];
    if (fam(va).includes(b) || fam(vb).includes(a)) return true;
    if (a === P || b === P) { const v = a === P ? vb : va; return v && (Soc.rel(v.id, P).friendship_point || 0) >= 35; }
    return (Soc.rel(a, b).friendship_point || 0) >= 45;
  };
  Ph.close = close;
  // 방 벽에 사진 액자 걸기 (뒷벽 → 왼벽 → 오른벽 순서로 빈 자리)
  function hang(iid, photoId) {
    const st = S(); const room = st.rooms[iid]; if (!room || !room.furn) return false;
    const sz = Sim.interiorSize ? Sim.interiorSize(iid) : { w: 8, d: 6 };
    const mine = room.furn.filter(q => q.photoId);
    if (iid !== 'home_p_in' && mine.length >= 2) { const old = mine[0]; room.furn.splice(room.furn.indexOf(old), 1); }
    const walls = room.furn.filter(q => (FM.FURN[q.type] || {}).wall);
    const hz = sz.d / 2, hx = sz.w / 2;
    const tryAt = (x, z, rot) => { const side = rot === 0 ? 'b' : rot > 0 ? 'l' : 'r'; const a = side === 'b' ? x : z; const clash = walls.some(q => { const qs = Math.abs(q.z + hz) < 0.3 ? 'b' : q.x < 0 ? 'l' : 'r'; const qa = qs === 'b' ? q.x : q.z; return qs === side && Math.abs(qa - a) < ((FM.FURN[q.type] || {}).w || 0.8) / 2 + 0.45; }); if (clash) return false; room.furn.push({ type: 'frame', x: +x.toFixed(2), z: +z.toFixed(2), rot, mat: null, color: null, photoId, y: 0.35 }); return true; };
    for (let x = -hx + 0.8; x <= hx - 0.8; x += 0.7) if (tryAt(x, -hz + 0.06, 0)) return done();
    for (let z = -hz + 0.9; z <= hz - 1.2; z += 0.7) if (tryAt(-hx + 0.06, z, 90)) return done();
    for (let z = -hz + 0.9; z <= hz - 1.2; z += 0.7) if (tryAt(hx - 0.06, z, -90)) return done();
    return false;
    function done() { if (FM.G && FM.G.interior && FM.G.interior.iid === iid && FM.G.rebuildInterior) FM.G.rebuildInterior(); return true; }
  }
  Ph.hang = hang;
  function gc() {
    const st = store(); const used = new Set(st.album);
    for (const v of st.villagers) for (const id of v.album || []) used.add(id);
    for (const r of Object.values(st.rooms)) for (const q of r.furn || []) if (q.photoId) used.add(q.photoId);
    for (const id of Object.keys(st.photos)) if (!used.has(id)) delete st.photos[id];
  }
  function save(people, bg, cap) {
    const st = store();
    const id = 'ph' + Date.now().toString(36) + ((Math.random() * 1e4) | 0);
    st.photos[id] = { url: Ph.render(people, bg, cap), who: people.map(p => p.id), day: Sim.time.day(), cap, bg };
    return id;
  }
  // 함께 찍은 주민들에게 나눠 주기 (친한 사이만 자기 집에 걸어 둠)
  function share(id, ids) {
    const st = store(); const got = [];
    for (const vid of ids) {
      if (vid === P) continue; const v = Sim.byId(vid); if (!v || !v.home) continue;
      const withClose = ids.some(o => o !== vid && close(vid, o));
      if (!withClose) continue;
      v.album = (v.album || []).concat(id).slice(-6);
      if (hang(v.home, id)) got.push(v.name);
    }
    return got;
  }
  Ph.save = save; Ph.share = share;

  // ---------------------------------------------------------
  // 촬영 UI
  // ---------------------------------------------------------
  function candidates() {
    const st = S(), p = st.player;
    const near = st.villagers.filter(v => !v.staff && !v.visitor && (v.loc === p.loc || (v.loc === 'island' && Math.hypot(v.x - p.x, v.z - p.z) < 10)));
    const score = v => (Soc.partnerOf(P) === v.id ? 500 : 0) + (v.child && v.child.parents.includes(P) ? 400 : 0) + (Soc.rel(v.id, P).friendship_point || 0) + (near.includes(v) ? 60 : 0);
    return st.villagers.filter(v => !v.staff && !v.visitor && !(v.status && v.status.hospital)).sort((a, b) => score(b) - score(a)).slice(0, 12);
  }
  Ph.open = function () {
    const UI = FM.UI, st = S();
    const cands = candidates();
    const sel = cands.filter(v => v.loc === st.player.loc).slice(0, 2).map(v => v.id);
    if (!sel.length && Soc.partnerOf(P)) sel.push(Soc.partnerOf(P));
    const people = () => [{ id: P }].concat(sel.map(id => ({ id })));
    const cfg = { bg: 'sky', cap: '', per: { [P]: { expr: 'happy', pose: 'pose' } } };
    const perOf = id => cfg.per[id] || (cfg.per[id] = { expr: pick(['happy', 'laugh', 'shy', 'love']), pose: pick(['pose', 'cute', 'cheer', 'stand']) });
    const opt = (obj, cur) => Object.entries(obj).map(([k, n]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${n}</option>`).join('');
    const html = `<div class="ph-wrap" style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start">
      <div style="flex:1 1 320px;min-width:260px"><div style="position:relative"><img id="phPrev" style="width:100%;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.25);background:#ddd;aspect-ratio:4/3"><div id="phFlash" style="position:absolute;inset:0;background:#fff;opacity:0;border-radius:10px;pointer-events:none;transition:opacity .35s"></div></div>
        <input id="phCap" maxlength="26" placeholder="사진 한 줄 메모 (예: 우리 첫 사진 💕)" style="width:100%;margin-top:8px;padding:6px 8px;border-radius:8px;border:1px solid #ddd"></div>
      <div style="flex:1 1 240px;min-width:220px">
        <h4 style="margin:0 0 4px">👥 함께 찍을 주민 (최대 3명)</h4><div id="phWho" class="chips" style="display:flex;flex-wrap:wrap;gap:4px"></div>
        <h4 style="margin:10px 0 4px">🖼️ 배경</h4><select id="phBg" style="width:100%">${opt(Object.fromEntries(Object.entries(BG).map(([k, b]) => [k, b.name])), cfg.bg)}</select>
        <h4 style="margin:10px 0 4px">🎭 표정 & 포즈</h4><div id="phPer"></div>
        <div style="display:flex;gap:6px;margin-top:12px"><button class="btn small" id="phRand">🎲 랜덤</button><button class="btn main" id="phShot" style="flex:1">📸 찰칵! (30🪙)</button></div>
      </div></div>`;
    UI.modal('📸 추억 사진관 — 사진 찍기', html, (b) => {
      const prev = b.querySelector('#phPrev'); let tm = 0;
      const refresh = () => { clearTimeout(tm); tm = setTimeout(() => { try { prev.src = Ph.preview(people().map(p => Object.assign({ id: p.id }, perOf(p.id))), cfg.bg); } catch (e) { console.error('photo preview', e); } }, 60); };
      const paintWho = () => { b.querySelector('#phWho').innerHTML = cands.map(v => `<button class="btn small ${sel.includes(v.id) ? 'on' : ''}" data-v="${v.id}" style="color:#5a3a2a;${sel.includes(v.id) ? 'background:#ffb8cc;font-weight:700' : 'background:#fff8ef'}">${FM.Face ? FM.Face.img(v, 18) : ''} ${esc(v.name)}${Soc.partnerOf(P) === v.id ? ' 💕' : ''}</button>`).join(''); b.querySelectorAll('[data-v]').forEach(x => x.onclick = () => { const id = x.dataset.v; const i = sel.indexOf(id); if (i >= 0) sel.splice(i, 1); else if (sel.length < 3) sel.push(id); else return UI.toast('최대 3명까지 함께 찍을 수 있어요'); paintWho(); paintPer(); refresh(); }); };
      const paintPer = () => { b.querySelector('#phPer').innerHTML = people().map(p => { const c = perOf(p.id); return `<div style="display:flex;gap:4px;align-items:center;margin:3px 0"><b style="flex:0 0 64px;font-size:12px;overflow:hidden;white-space:nowrap">${esc(nameOf(p.id))}</b><select data-e="${p.id}" style="flex:1">${opt(EXPR, c.expr)}</select><select data-p="${p.id}" style="flex:1">${opt(POSE, c.pose)}</select></div>`; }).join(''); b.querySelectorAll('[data-e]').forEach(x => x.onchange = () => { perOf(x.dataset.e).expr = x.value; refresh(); }); b.querySelectorAll('[data-p]').forEach(x => x.onchange = () => { perOf(x.dataset.p).pose = x.value; refresh(); }); };
      b.querySelector('#phBg').onchange = e => { cfg.bg = e.target.value; refresh(); };
      b.querySelector('#phRand').onclick = () => { for (const p of people()) cfg.per[p.id] = { expr: pick(Object.keys(EXPR)), pose: pick(Object.keys(POSE)) }; cfg.bg = pick(Object.keys(BG)); b.querySelector('#phBg').value = cfg.bg; paintPer(); refresh(); };
      b.querySelector('#phShot').onclick = () => {
        const p = st.player; if (p.coins < 30) return UI.toast('코인이 부족해요 (30🪙)');
        p.coins -= 30; const fl = b.querySelector('#phFlash'); fl.style.opacity = 1; setTimeout(() => { fl.style.opacity = 0; }, 120);
        FM.Audio && FM.Audio.sfx && FM.Audio.sfx('camera');
        const ppl = people().map(q => Object.assign({ id: q.id }, perOf(q.id)));
        const cap = (b.querySelector('#phCap').value || '').trim() || `${ppl.map(q => nameOf(q.id)).join(' · ')}`;
        const id = save(ppl, cfg.bg, cap); store().album.push(id); if (store().album.length > 24) store().album.shift();
        for (const q of ppl) if (q.id !== P) { const v = Sim.byId(q.id); if (v) { Soc.addFriend(v.id, P, 4, 2, '사진관'); Sim.emote(v, pick(['📸', '😊', '💕', '✨']), 3); } }
        const got = share(id, ppl.map(q => q.id)); gc();
        if (Soc.partnerOf(P) && ppl.some(q => q.id === Soc.partnerOf(P))) Sim.log('rel', `📸 ${p.name}와(과) ${nameOf(Soc.partnerOf(P))}이(가) 사진관에서 커플 사진을 찍었어요`, [P, Soc.partnerOf(P)], 2);
        setTimeout(() => {
          UI.modal('📸 사진이 나왔어요!', `<div style="text-align:center"><img src="${Ph.url(id)}" style="width:100%;max-width:420px;border-radius:6px;box-shadow:0 8px 22px rgba(0,0,0,.3);transform:rotate(-1.5deg)"><p style="margin:10px 0 4px">📖 우리 집 <b>사진 앨범</b>에 넣었어요.</p>${got.length ? `<p style="margin:2px 0;color:#c0567a">🖼️ ${got.map(esc).join(', ')}도 사진을 자기 집 벽에 걸어 뒀어요!</p>` : ''}
            <div style="display:flex;gap:8px;justify-content:center;margin-top:10px"><button class="btn" id="phHang">🖼️ 우리 집 벽에 걸기</button><button class="btn" id="phMore">📸 한 장 더</button><button class="btn main" id="phOk">확인</button></div></div>`, b2 => {
            b2.querySelector('#phHang').onclick = () => { Sim.ensurePlayerRoom && Sim.ensurePlayerRoom(); UI.toast(hang('home_p_in', id) ? '🖼️ 우리 집 벽에 걸었어요!' : '벽에 빈 자리가 없어요'); };
            b2.querySelector('#phMore').onclick = () => Ph.open();
            b2.querySelector('#phOk').onclick = () => UI.closeModal();
          });
        }, 260);
      };
      paintWho(); paintPer(); refresh();
    }, true);
  };

  // ---------------------------------------------------------
  // 우리 집 앨범 (집 안 앨범 책상에서 펼침)
  // ---------------------------------------------------------
  Ph.album = function () {
    const UI = FM.UI, st = store();
    const list = st.album.slice().reverse().filter(id => st.photos[id]);
    const html = list.length ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px">${list.map((id, i) => { const ph = st.photos[id]; return `<figure data-i="${id}" style="margin:0;cursor:pointer;transform:rotate(${(i % 3 - 1) * 1.5}deg)"><img src="${ph.url}" style="width:100%;border-radius:4px;box-shadow:0 4px 10px rgba(0,0,0,.25)"><figcaption style="font-size:11px;color:#8a6a4a;text-align:center">D+${ph.day}</figcaption></figure>`; }).join('')}</div>`
      : '<p style="text-align:center;color:#8a6a4a">아직 사진이 없어요. 사진관에서 주민과 함께 찍어 보세요 📸</p>';
    UI.modal(`📖 우리 집 사진 앨범 (${list.length}장)`, `<div style="background:#f6efe2;padding:12px;border-radius:10px">${html}</div>`, b => {
      b.querySelectorAll('[data-i]').forEach(x => x.onclick = () => { const id = x.dataset.i, ph = st.photos[id]; UI.modal('🖼️ 사진', `<div style="text-align:center"><img src="${ph.url}" style="width:100%;max-width:440px;border-radius:6px"><p>${esc(ph.cap || '')} · D+${ph.day}</p><div style="display:flex;gap:8px;justify-content:center"><button class="btn" id="aHang">🖼️ 벽에 걸기</button><button class="btn" id="aDel">🗑️ 앨범에서 빼기</button><button class="btn main" id="aBack">← 앨범</button></div></div>`, b2 => {
        b2.querySelector('#aHang').onclick = () => UI.toast(hang('home_p_in', id) ? '🖼️ 벽에 걸었어요!' : '벽에 빈 자리가 없어요');
        b2.querySelector('#aDel').onclick = () => { st.album = st.album.filter(q => q !== id); gc(); Ph.album(); };
        b2.querySelector('#aBack').onclick = () => Ph.album();
      }); });
    }, true);
  };
  // 주민 집의 사진 보기 (관찰 중 프로필 등에서)
  Ph.villagerAlbum = function (v) { const st = store(); const ids = (v.album || []).filter(id => st.photos[id]); FM.UI.modal(`📷 ${esc(v.name)}의 사진들`, ids.length ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px">${ids.map(id => `<img src="${st.photos[id].url}" style="width:100%;border-radius:4px">`).join('')}</div>` : '<p>아직 사진이 없어요</p>'); };

  // ---------------------------------------------------------
  // 친한 주민끼리 사진관 나들이 (하루 한 번쯤)
  // ---------------------------------------------------------
  function pairTrip() {
    const st = S(); const free = v => v && !v.child && !v.staff && !v.visitor && !v.sceneId && !v.talkingToPlayer && !(v.status && v.status.hospital) && !(Sim.asleep && Sim.asleep(v, Sim.time.hour()));
    const vs = st.villagers.filter(free); const pairs = [];
    for (const a of vs) { const pid = Soc.partnerOf(a.id); if (pid && pid !== P) { const b = Sim.byId(pid); if (free(b) && a.id < b.id) pairs.push([a, b, 3]); } }
    if (!pairs.length) for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) if (close(vs[i].id, vs[j].id)) pairs.push([vs[i], vs[j], 1]);
    if (!pairs.length) return;
    const [A, B, kind] = pick(pairs);
    Sim.scene({ title: '📸 사진관 나들이', actors: { A, B }, steps: [
      { par: [{ go: 'A', to: { place: 'photo', inside: true, x: -0.6, z: -1.2 } }, { go: 'B', to: { place: 'photo', inside: true, x: 0.6, z: -1.2 } }] },
      { par: [{ pose: 'A', p: kind > 1 ? 'cute' : 'pose', t: 3 }, { pose: 'B', p: kind > 1 ? 'hug' : 'cheer', t: 3 }] },
      { emote: 'A', e: '📸' }, { emote: 'B', e: kind > 1 ? '💕' : '✨' },
    ], onEnd: () => { try { const ppl = [{ id: A.id, expr: kind > 1 ? 'love' : 'laugh', pose: kind > 1 ? 'cute' : 'pose' }, { id: B.id, expr: kind > 1 ? 'shy' : 'happy', pose: kind > 1 ? 'hug' : 'cheer' }]; const id = save(ppl, pick(kind > 1 ? ['hearts', 'sunset', 'sakura'] : ['sky', 'studio', 'fireworks']), `${A.name} & ${B.name}`); share(id, [A.id, B.id]); gc(); Sim.log('rel', `📸 ${A.name}와(과) ${B.name}이(가) 사진관에서 ${kind > 1 ? '커플' : '우정'} 사진을 찍어 서로의 집에 걸어 뒀어요`, [A.id, B.id], 2); } catch (e) { console.error('pair photo', e); } } });
  }
  FM.bus.on('hour', h => { if (h >= 11 && h <= 18 && chance(0.12)) { const st = S(); if (st.photoTripDay !== Sim.time.day()) { st.photoTripDay = Sim.time.day(); pairTrip(); } } });
  Ph.pairTrip = pairTrip;

  // ---------------------------------------------------------
  // 플레이어 선택지: 사진관 안 '사진 찍기' · 집 안 '앨범 보기'
  // ---------------------------------------------------------
  if (FM.Play && FM.Play.options) {
    const oOpt = FM.Play.options;
    FM.Play.options = function (add) {
      const r = oOpt.apply(this, arguments);
      try {
        const p = S().player;
        if (p.loc === 'photo_in') add(1.5, '📸 사진 찍기 (주민과 함께 · 표정 & 포즈)', () => Ph.open());
        if (p.loc === 'home_p_in') add(2.6, `📖 사진 앨범 보기 (${(S().album || []).length}장)`, () => Ph.album());
        if (p.loc === 'island' && Math.hypot(p.x + 28, p.z - 8) < 5) add(2.0, '📸 추억 사진관 들어가서 사진 찍기', () => { FM.G && FM.G.enterInterior ? FM.G.enterInterior('photo_in') : null; setTimeout(() => Ph.open(), 600); });
      } catch (e) { console.error('photo options', e); }
      return r;
    };
  }
})();
