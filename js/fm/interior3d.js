/* =========================================================
 *  실내 3D — 방 6개 레이어(벽/바닥, 가구, 스마트 오브젝트, 벽걸이, 조명/BGM),
 *  재질·색 교체, DIY 무늬, 청결도(쓰레기), 테마 세트 효과
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE, PM = FM.PM, D = FM.D;
  const H = ISLE.M.h;
  const { mat, sphere, box, cyl, mesh } = H;
  const I3 = (FM.Int3D = {});

  const WALL_H = 3;
  function floorTex(kind, color) {
    const css = PM.css(color);
    return PM.ctex(`floor:${kind}:${color}`, 256, 256, (g, w, h) => {
      g.fillStyle = css; g.fillRect(0, 0, w, h);
      const dark = 'rgba(0,0,0,0.12)', light = 'rgba(255,255,255,0.15)';
      switch (kind) {
        case 'wood': case 'log': for (let y = 0; y < h; y += 32) { g.fillStyle = dark; g.fillRect(0, y, w, 2); for (let x = (y / 32 % 2) * 64; x < w; x += 128) g.fillRect(x, y, 2, 32); } break;
        case 'tile': for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { g.fillStyle = ((x + y) / 64) % 2 ? dark : light; g.fillRect(x, y, 64, 64); } break;
        case 'marble': for (let i = 0; i < 8; i++) { g.strokeStyle = 'rgba(150,150,170,0.3)'; g.lineWidth = 2; g.beginPath(); let x = Math.random() * w, y = 0; g.moveTo(x, y); while (y < h) { x += (Math.random() - 0.5) * 40; y += 16; g.lineTo(x, y); } g.stroke(); } g.strokeStyle = dark; for (let i = 0; i <= w; i += 128) { g.strokeRect(i, 0, 128, 128); g.strokeRect(i, 128, 128, 128); } break;
        case 'carpet': for (let i = 0; i < 1400; i++) { g.fillStyle = Math.random() < 0.5 ? dark : light; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } break;
        case 'metal': for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { g.strokeStyle = dark; g.strokeRect(x + 2, y + 2, 60, 60); g.fillStyle = light; g.fillRect(x + 6, y + 6, 4, 4); g.fillRect(x + 54, y + 54, 4, 4); } break;
        case 'candy': for (let x = -h; x < w; x += 40) { g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 20, 0); g.lineTo(x + 20 + h, h); g.lineTo(x + h, h); g.fill(); } break;
        case 'water': for (let i = 0; i < 30; i++) { g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 3; g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / 20) * 5); g.stroke(); } break;
        case 'mat': for (let y = 0; y < h; y += 128) for (let x = 0; x < w; x += 128) { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 4; g.strokeRect(x, y, 128, 128); } break;
        case 'sand': for (let i = 0; i < 900; i++) { g.fillStyle = dark; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } break;
      }
    }, [2, 2]);
  }
  function wallTex(theme, color) {
    const css = PM.css(color);
    return PM.ctex(`wall:${theme}:${color}`, 256, 256, (g, w, h) => {
      g.fillStyle = css; g.fillRect(0, 0, w, h);
      switch (theme) {
        case 'aquarium': for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 3 + Math.random() * 10, 0, Math.PI * 2); g.fill(); } g.fillStyle = 'rgba(255,160,90,0.8)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 12, 6, 0, 0, Math.PI * 2); g.fill(); } break;
        case 'space': for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${Math.random()})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } g.fillStyle = 'rgba(255,160,90,0.8)'; g.beginPath(); g.arc(190, 70, 26, 0, Math.PI * 2); g.fill(); break;
        case 'prison': for (let y = 0; y < h; y += 32) for (let x = (y / 32 % 2) * 32; x < w; x += 64) { g.strokeStyle = 'rgba(0,0,0,0.2)'; g.strokeRect(x, y, 64, 32); } break;
        case 'candy': for (let x = 0; x < w; x += 32) { g.fillStyle = x / 32 % 2 ? 'rgba(255,120,170,0.45)' : 'rgba(255,255,255,0.4)'; g.fillRect(x, 0, 32, h); } break;
        case 'hanok': g.strokeStyle = 'rgba(120,80,40,0.45)'; g.lineWidth = 4; for (let i = 0; i <= w; i += 42) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } break;
        case 'lp80s': for (let x = 0; x < w; x += 24) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, 0, 3, h); } break;
        case 'cyberpunk': case 'party': for (let i = 0; i < 12; i++) { g.strokeStyle = ['#ff3a9a', '#39ffb0', '#39c0ff'][i % 3]; g.lineWidth = 3; g.beginPath(); g.moveTo(0, i * 22); g.lineTo(w, i * 22 + 30); g.stroke(); } break;
        case 'princess': g.fillStyle = 'rgba(255,255,255,0.5)'; for (let y = 16; y < h; y += 48) for (let x = 16; x < w; x += 48) { g.beginPath(); g.moveTo(x, y + 8); g.bezierCurveTo(x - 12, y - 2, x - 4, y - 10, x, y - 3); g.bezierCurveTo(x + 4, y - 10, x + 12, y - 2, x, y + 8); g.fill(); } break;
        case 'bath': for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { g.strokeStyle = 'rgba(0,0,0,0.12)'; g.strokeRect(x, y, 32, 32); } break;
        case 'construction': g.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i < 200; i++) g.fillRect(Math.random() * w, Math.random() * h, 4, 1); g.fillStyle = '#ffd23a'; for (let x = -h; x < w; x += 48) { g.beginPath(); g.moveTo(x, h - 30); g.lineTo(x + 24, h - 30); g.lineTo(x + 54, h); g.lineTo(x + 30, h); g.fill(); } break;
        case 'heart': g.fillStyle = 'rgba(255,120,160,0.28)'; for (let y = 20; y < h; y += 56) for (let x = (y / 56 % 2) * 28 + 14; x < w; x += 56) { g.beginPath(); g.moveTo(x, y + 7); g.bezierCurveTo(x - 11, y - 2, x - 4, y - 10, x, y - 3); g.bezierCurveTo(x + 4, y - 10, x + 11, y - 2, x, y + 7); g.fill(); } break;
        case 'stripe': for (let x = 0; x < w; x += 32) { g.fillStyle = x / 32 % 2 ? 'rgba(255,255,255,0.35)' : 'rgba(80,140,200,0.12)'; g.fillRect(x, 0, 32, h); } break;
        case 'wainscot': g.fillStyle = 'rgba(120,80,40,0.18)'; g.fillRect(0, h * 0.62, w, h * 0.38); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(0, h * 0.6, w, 5); for (let x = 16; x < w; x += 64) { g.strokeStyle = 'rgba(90,60,30,0.2)'; g.lineWidth = 2; g.strokeRect(x, h * 0.68, 44, h * 0.26); } for (let y = 12; y < h * 0.55; y += 26) for (let x = (y / 26 % 2) * 20; x < w; x += 40) { g.fillStyle = 'rgba(180,140,80,0.18)'; g.fillRect(x, y, 4, 4); } break;
        case 'star': g.fillStyle = 'rgba(255,190,60,0.45)'; for (let i = 0; i < 18; i++) { const x = (i * 73) % w, y = (i * 47) % h; g.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 4 : 10, a = k / 10 * Math.PI * 2 - Math.PI / 2; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); } break;
        case 'leaf': g.fillStyle = 'rgba(90,150,90,0.25)'; for (let y = 16; y < h; y += 44) for (let x = (y / 44 % 2) * 22 + 10; x < w; x += 44) { g.beginPath(); g.ellipse(x, y, 10, 5, 0.7, 0, Math.PI * 2); g.fill(); } break;
        case 'brick': for (let y = 0; y < h; y += 24) for (let x = (y / 24 % 2) * 24; x < w; x += 48) { g.fillStyle = `rgba(150,80,60,${0.12 + ((x * 7 + y) % 5) * 0.03})`; g.fillRect(x + 1, y + 1, 46, 22); } break;
        case 'splatter': for (let i = 0; i < 40; i++) { g.fillStyle = ['rgba(255,111,97,0.4)', 'rgba(79,193,201,0.4)', 'rgba(255,216,74,0.5)', 'rgba(154,107,255,0.35)'][i % 4]; g.beginPath(); g.arc((i * 97) % w, (i * 61) % h, 3 + (i % 5) * 3, 0, Math.PI * 2); g.fill(); } break;
        case 'check': for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) if ((x + y) / 32 % 2) { g.fillStyle = 'rgba(120,150,220,0.12)'; g.fillRect(x, y, 32, 32); } break;
        default: g.fillStyle = 'rgba(255,255,255,0.18)'; for (let y = 0; y < h; y += 32) for (let x = (y / 32 % 2) * 16; x < w; x += 32) { g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill(); }
      }
    }, [2, 1]);
  }
  // DIY 무늬 (dataURL) → 텍스처
  const patCache = new Map();
  function patTex(dataUrl) {
    if (!dataUrl) return null;
    if (patCache.has(dataUrl)) return patCache.get(dataUrl);
    const img = new Image();
    const t = new THREE.Texture(img);
    img.onload = () => { t.needsUpdate = true; };
    img.src = dataUrl;
    t.magFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping;
    patCache.set(dataUrl, t);
    return t;
  }
  I3.patTex = patTex;
  // 내가 올린 사진 → 텍스처 (부드럽게)
  const imgCache = new Map();
  function imgTex(dataUrl) {
    if (imgCache.has(dataUrl)) return imgCache.get(dataUrl);
    const img = new Image(); const t = new THREE.Texture(img);
    img.onload = () => { t.needsUpdate = true; };
    img.src = dataUrl; t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    if (imgCache.size > 40) imgCache.clear();
    imgCache.set(dataUrl, t); return t;
  }
  I3.imgTex = imgTex;
  // 짝사랑 대상의 사진
  function faceTex(id) {
    const st = FM.Sim.get();
    const v = FM.Sim.byId(id);
    const name = id === 'P' ? st.player.name : v ? v.name : '?';
    const sp = id === 'P' ? '🧑' : v && ISLE.SPECIES[v.look.species] ? ISLE.SPECIES[v.look.species].icon : '🙂';
    return PM.ctex('photo:' + id, 128, 160, (g, w, h) => { g.fillStyle = '#ffe0ec'; g.fillRect(0, 0, w, h); g.font = '72px serif'; g.textAlign = 'center'; g.fillText(sp, w / 2, 80); g.font = '22px Jua, sans-serif'; g.fillStyle = '#c0306a'; g.fillText('♥ ' + name, w / 2, 135); });
  }

  // ---------------------------------------------------------
  // 빌드
  // ---------------------------------------------------------
  I3.build = function (iid) {
    const st = FM.Sim.get();
    const I = FM.INTERIORS[iid];
    const room = st.rooms[iid] || I;
    const { w, d } = FM.Sim.interiorSize(iid);
    const group = new THREE.Group();
    const res = { iid, group, w, d, furnObjs: [], trashObjs: [], lights: [], floatObjs: [], caustic: null, bubbles: null, disco: null, room };
    const themeId = room.theme || null;
    const theme = themeId ? D.THEMES[themeId] : null;
    // 1. 벽면 & 바닥
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), H.soften(new THREE.MeshLambertMaterial({ map: room.patterns && room.patterns.floor ? patTex(room.patterns.floor) : floorTex(room.floor || 'wood', room.floorColor || 0xd9b88a) }), 0.1));
    fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; fl.name = 'floor';
    group.add(fl);
    const wallMap = room.patterns && room.patterns.wall ? patTex(room.patterns.wall) : wallTex(themeId || room.wallStyle || 'plain', room.wall || 0xf4efe6);
    const wm = H.soften(new THREE.MeshLambertMaterial({ map: wallMap, side: THREE.DoubleSide }), 0.1);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(w, WALL_H), wm); back.position.set(0, WALL_H / 2, -d / 2); back.receiveShadow = true; group.add(back);
    for (const s of [-1, 1]) { const side = new THREE.Mesh(new THREE.PlaneGeometry(d, WALL_H), wm); side.position.set(s * w / 2, WALL_H / 2, 0); side.rotation.y = -s * Math.PI / 2; side.receiveShadow = true; group.add(side); side.name = 'sideWall'; }
    // 걸레받이
    const bb = mat(0xffffff);
    group.add(mesh(box(w, 0.12, 0.06, 0.02), bb, 0, 0.06, -d / 2 + 0.03));
    for (const s of [-1, 1]) group.add(mesh(box(0.06, 0.12, d, 0.02), bb, s * (w / 2 - 0.03), 0.06, 0));
    // 창문 틀 (뒷벽) / 스카이라인
    if (I.kind === 'room' || I.skyline) {
      const win = new THREE.Group(); win.position.set(I.skyline ? 0 : -w / 4, 1.7, -d / 2 + 0.05);
      const sky = new THREE.Mesh(new THREE.PlaneGeometry(I.skyline ? w - 1 : 1.6, I.skyline ? 1.8 : 1.1), new THREE.MeshBasicMaterial({ map: I.skyline ? PM.ctex('skyline', 512, 128, (g, W2, H2) => { g.fillStyle = '#1a1a3a'; g.fillRect(0, 0, W2, H2); for (let x = 0; x < W2; x += 22) { const hh = 30 + Math.random() * 80; g.fillStyle = '#0a0a1a'; g.fillRect(x, H2 - hh, 18, hh); g.fillStyle = '#ffe9a8'; for (let y = H2 - hh + 6; y < H2; y += 10) if (Math.random() < 0.5) g.fillRect(x + 4, y, 3, 3); } }) : null, color: I.skyline ? 0xffffff : (FM.W.nightness > 0.5 ? 0x1a2040 : 0x9fd6ff) }));
      win.add(sky);
      const frameCol = theme && themeId === 'hanok' ? 0x8a5a3b : themeId === 'prison' ? 0x55595f : 0xffffff;
      if (!I.skyline) for (const [x, y, ww, hh] of [[0, 0.58, 1.8, 0.1], [0, -0.58, 1.8, 0.1], [-0.85, 0, 0.1, 1.2], [0.85, 0, 0.1, 1.2], [0, 0, 0.06, 1.1]]) win.add(mesh(box(ww, hh, 0.08, 0.02), mat(frameCol), x, y, 0.02));
      if (themeId === 'prison' && !I.skyline) for (let i = -2; i <= 2; i++) win.add(mesh(cyl(0.02, 0.02, 1.1), mat(0x55595f), i * 0.3, 0, 0.05));
      group.add(win);
    }
    // 가구 (2~5 레이어)
    const furn = (st.rooms[iid] && st.rooms[iid].furn) || I.furn || [];
    const pats = room.patterns || {};
    furn.forEach((f, idx) => {
      const F = FM.FURN[f.type]; if (!F) return;
      const tags = F.tags || [];
      let pattern = null;
      if (pats.bed && tags.includes('bed')) pattern = patTex(pats.bed);
      if (pats.sofa && tags.includes('sofa')) pattern = patTex(pats.sofa);
      if (pats.frame && (tags.includes('frame') || f.type === 'poster')) pattern = patTex(pats.frame);
      if (f.img && F.photo) pattern = imgTex(f.img);
      const opts = { mat: f.mat, color: f.color, pattern };
      if (f.type === 'photo_crush') { const owner = st.villagers.find(v => v.home === iid); const tgt = f.target || (owner && owner.crush && owner.crush.target); if (tgt) opts.faceTex = faceTex(tgt); }
      const o = PM.furniture(f.type, opts);
      if (pattern && !f.img && !F.parts.some(p => (p[8] || '').includes('pic'))) o.traverse(m => { if (m.isMesh && m.userData.main) { m.material = new THREE.MeshLambertMaterial({ map: pattern }); } });
      o.position.set(f.x, 0, f.z);
      o.rotation.y = (f.rot || 0) * Math.PI / 180;
      o.userData.furnIdx = idx;
      o.traverse(m => { m.userData.furnIdx = idx; });
      group.add(o);
      res.furnObjs.push(o);
      if (F.ceiling || F.layer === 'light') {
        const lc = D.LIGHT_COLORS[room.light || 'warm'] || D.LIGHT_COLORS.warm;
        const pl = new THREE.PointLight(lc.color, room.lightOn === false ? 0.05 : (f.type === 'ceiling_light' || f.type === 'chandelier' ? 0.9 : 0.45), Math.max(w, d) * 1.4, 1.5);
        pl.position.set(f.x, 2.5, f.z);
        group.add(pl); res.lights.push(pl);
      }
      if (f.type === 'mirrorball') res.disco = o;
    });
    // 조명이 하나도 없으면 기본 조명
    if (!res.lights.length) { const pl = new THREE.PointLight((D.LIGHT_COLORS[room.light || 'warm'] || D.LIGHT_COLORS.warm).color, room.lightOn === false ? 0.05 : 0.8, Math.max(w, d) * 1.5, 1.5); pl.position.set(0, 2.6, 0); group.add(pl); res.lights.push(pl); }
    // 쓰레기 (과자 껍질, 먼지 뭉치, 널브러진 옷가지)
    for (const t of (st.rooms[iid] && st.rooms[iid].trash) || []) {
      let o;
      if (t.kind === 'snack') { o = mesh(box(0.25, 0.04, 0.18, 0.02), mat(0xffd84a), t.x, 0.02, t.z); o.rotation.y = t.x * 3; }
      else if (t.kind === 'dust') { o = mesh(sphere(0.14), mat(0xb0b0b8), t.x, 0.1, t.z); o.scale.y = 0.7; }
      else { o = mesh(box(0.5, 0.05, 0.4, 0.04), mat([0xff8fb1, 0x8fd3ff, 0xffd84a][Math.abs(Math.round(t.x * 7)) % 3]), t.x, 0.03, t.z); o.rotation.y = t.z; }
      group.add(o); res.trashObjs.push(o);
    }
    // 문 표시
    const door = FM.Sim.interiorDoor(iid);
    const dm = mesh(box(1.2, 0.03, 0.7, 0.02), mat(0xc0392b), door.x, 0.015, door.z); group.add(dm);
    const exitSign = PM.sign('🚪 나가기', 1.2, 0.3, '#ffffff', '#c0392b'); exitSign.position.set(door.x, 0.4, door.z + 0.2); exitSign.rotation.x = -Math.PI / 2.5; group.add(exitSign);
    res.door = door;
    // 세트 효과 (테마 통일도 80%)
    const set = st.rooms[iid] && st.rooms[iid].set;
    if (set === 'aquarium' || themeId === 'aquarium') {
      const ct = PM.ctex('caustic', 128, 128, (g, W2, H2) => { g.clearRect(0, 0, W2, H2); g.strokeStyle = 'rgba(200,255,255,0.55)'; g.lineWidth = 3; for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(Math.random() * W2, Math.random() * H2); for (let k = 0; k < 4; k++) g.quadraticCurveTo(Math.random() * W2, Math.random() * H2, Math.random() * W2, Math.random() * H2); g.stroke(); } }, [3, 3]);
      const cm = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: ct, transparent: true, opacity: set ? 0.6 : 0.25, blending: THREE.AdditiveBlending, depthWrite: false }));
      cm.rotation.x = -Math.PI / 2; cm.position.y = 0.02; group.add(cm); res.caustic = ct;
      const n = 60, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - 0.5) * w; p[i * 3 + 1] = Math.random() * 3; p[i * 3 + 2] = (Math.random() - 0.5) * d; }
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(p, 3));
      res.bubbles = new THREE.Points(bg, new THREE.PointsMaterial({ color: 0xe8ffff, size: 0.08, transparent: true, opacity: 0.8 })); group.add(res.bubbles);
    }
    if (set === 'space') res.furnObjs.forEach(o => { if (!FM.FURN[furn[o.userData.furnIdx].type].ceiling) res.floatObjs.push(o); });
    res.set = set;
    return res;
  };

  // 매 프레임
  I3.update = function (res, dt, t) {
    if (!res) return;
    const st = FM.Sim.get();
    const room = st.rooms[res.iid];
    if (res.caustic) { res.caustic.offset.x += dt * 0.05; res.caustic.offset.y += dt * 0.03; }
    if (res.bubbles) { const a = res.bubbles.geometry.attributes.position; for (let i = 0; i < a.count; i++) { let y = a.getY(i) + dt * 0.6; if (y > 3) y = 0; a.setY(i, y); } a.needsUpdate = true; }
    for (const o of res.floatObjs) o.position.y = 0.3 + Math.sin(t * 1.2 + o.position.x) * 0.2;
    // 노래방: 조명이 어두워지며 미러볼이 돌아감
    const disco = room && room.disco && room.disco > st.realT;
    for (const l of res.lights) {
      if (disco) { l.color.setHSL((t * 0.5) % 1, 0.9, 0.6); l.intensity = 0.8; }
      else if (room) { l.color.setHex((D.LIGHT_COLORS[room.light || 'warm'] || D.LIGHT_COLORS.warm).color); l.intensity = room.lightOn === false ? 0.04 : 0.9; }
    }
    if (res.disco) res.disco.rotation.y += dt * 2;
  };
})();
