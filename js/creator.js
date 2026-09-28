/* =========================================================
 *  캐릭터 만들기 도구
 *  - 3D 미리보기 (드래그 회전, 확대, 포즈)
 *  - 종/얼굴/털색/머리/옷/소품 편집
 *  - 도감: localStorage 에 저장/삭제, 내 캐릭터 지정, 섬 초대, 내보내기/가져오기
 * ========================================================= */
(() => {
  'use strict';
  const ISLE = window.ISLE, M = ISLE.M;
  const SPECIES = ISLE.SPECIES, OPT = ISLE.CHAR_OPT, PAL = ISLE.CHAR_PALETTE;
  const $ = id => document.getElementById(id);
  const hex = n => '#' + (n >>> 0).toString(16).padStart(6, '0').slice(-6);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // =========================================================
  // 저장소
  // =========================================================
  let store = { v: 1, characters: [], playerId: null, invited: [], draft: null };
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(ISLE.CREATOR_KEY) || 'null');
      if (d && Array.isArray(d.characters)) {
        store = Object.assign(store, d);
        store.invited = Array.isArray(store.invited) ? store.invited : [];
      }
    } catch (e) { /* 새로 시작 */ }
  }
  function save() {
    try { localStorage.setItem(ISLE.CREATOR_KEY, JSON.stringify(store)); }
    catch (e) { toast('⚠️ 저장 공간이 부족해요. 안 쓰는 캐릭터를 지워주세요.'); }
  }

  // 편집 중인 캐릭터
  let look, name = '', phrase = '', editingId = null;
  let draftTimer = 0;
  function saveDraft() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => { store.draft = { look, name, phrase, editingId }; save(); }, 300);
  }

  // =========================================================
  // 3D 무대
  // =========================================================
  const canvas = $('view');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: false });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  scene.add(new THREE.HemisphereLight(0xeaf6ff, 0xb9a878, 0.62));
  scene.add(new THREE.AmbientLight(0xffffff, 0.08));
  const key = new THREE.DirectionalLight(0xfff1d6, 0.6);
  key.position.set(2.5, 5, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 1, far: 15 });
  key.shadow.radius = 6; key.shadow.blurSamples = 12; key.shadow.bias = -0.0004;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffe0f0, 0.18);
  fill.position.set(-3, 2, 2);
  scene.add(fill);

  // 잔디 받침대
  const pedestal = new THREE.Group();
  const H = M.h;
  pedestal.add(H.mesh(H.puck(1.15, 0.22), H.mat(0x8fd46a), 0, -0.22, 0, false));
  pedestal.add(H.mesh(H.puck(1.18, 0.12), H.mat(0xc9a06a), 0, -0.3, 0, false));
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2 + 0.3;
    const f = M.flower(ISLE.FLOWERS[i % ISLE.FLOWERS.length]);
    f.scale.setScalar(0.55);
    f.position.set(Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95 * 0.9);
    if (Math.sin(a) > 0.2 && Math.abs(Math.cos(a)) < 0.5) continue; // 앞쪽은 비워서 발이 잘 보이게
    pedestal.add(f);
  }
  pedestal.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
  scene.add(pedestal);

  const holder = new THREE.Group();
  scene.add(holder);
  let char = null;
  let pose = 'idle';
  let spin = false;
  let yaw = 0.35, yawVel = 0, zoom = 1;

  function rebuild() {
    if (char) {
      holder.remove(char.root);
      char.root.traverse(o => { if (o.isMesh && o.material === char.face.material) o.material.dispose(); });
    }
    char = M.character(look);
    char.root.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
    holder.add(char.root);
    $('stageName').textContent = name;
  }
  let rebuildQueued = false;
  function queueRebuild() {
    if (rebuildQueued) return;
    rebuildQueued = true;
    requestAnimationFrame(() => { rebuildQueued = false; rebuild(); });
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  function placeCamera() {
    const fit = clamp(0.75 / camera.aspect, 1, 2.2);
    const d = 4.4 * zoom * fit;
    camera.position.set(0, 1.25 + 0.6 * zoom, d);
    camera.lookAt(0, 0.62, 0);
  }

  // 드래그로 돌리기
  let drag = null;
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, id: e.pointerId }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    drag.x = e.clientX;
    yaw += dx * 0.012;
    yawVel = dx * 0.012;
  });
  const endDrag = () => { drag = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoom = clamp(zoom + Math.sign(e.deltaY) * 0.08, 0.55, 1.5); }, { passive: false });

  let lastT = 0;
  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0);
    lastT = t;
    if (!drag) { yaw += yawVel; yawVel *= 0.92; if (spin) yaw += dt * 0.8; }
    holder.rotation.y = yaw;
    if (char) {
      if (pose === 'wave') char.waveT = 0.2;
      if (pose === 'hop') char.hopT = char.hopT > 0.05 ? char.hopT : 0.6;
      if (pose === 'talk') char.talkT = char.talkT > 0.05 ? char.talkT : 1.2;
      M.animate(char, dt, pose === 'walk' ? 0.7 : 0);
    }
    placeCamera();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  // 현재 모습을 이미지로 (썸네일, 사진)
  function snapshot(size, withCard) {
    const prevYaw = yaw, prevZoom = zoom;
    holder.rotation.y = 0.35;
    zoom = withCard ? 0.78 : 0.62;
    if (char) M.animate(char, 0.001, 0);
    placeCamera();
    renderer.render(scene, camera);
    const src = canvas;
    const out = document.createElement('canvas');
    const W = size, Hh = withCard ? Math.round(size * 1.25) : size;
    out.width = W; out.height = Hh;
    const g = out.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, Hh);
    grd.addColorStop(0, '#bfe9ff'); grd.addColorStop(0.6, '#e8f7ff'); grd.addColorStop(1, '#fff6dc');
    g.fillStyle = grd; g.fillRect(0, 0, W, Hh);
    // 캐릭터가 가운데 오도록 정사각형으로 잘라서 그림
    const s = Math.min(src.width, src.height);
    const sx = (src.width - s) / 2, sy = (src.height - s) / 2;
    g.drawImage(src, sx, sy + s * 0.02, s, s * 0.96, 0, 0, W, W * 0.96);
    if (withCard) {
      g.fillStyle = '#ff8fb1';
      const label = (name || '이름 없음') + (phrase ? `  "${phrase}~"` : '');
      g.font = `${Math.round(W * 0.07)}px Jua, sans-serif`;
      const tw = g.measureText(label).width + W * 0.1;
      const bx = (W - tw) / 2, by = W * 1.02, bh = W * 0.12;
      g.beginPath(); g.roundRect ? g.roundRect(bx, by, tw, bh, bh / 2) : g.rect(bx, by, tw, bh); g.fill();
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(label, W / 2, by + bh / 2 + 2);
      g.fillStyle = '#a08660'; g.font = `${Math.round(W * 0.04)}px Jua, sans-serif`;
      g.fillText(`${SPECIES[look.species].icon} ${SPECIES[look.species].name} · 두근두근 섬 주민증`, W / 2, W * 1.2);
    }
    holder.rotation.y = prevYaw;
    zoom = prevZoom;
    return out.toDataURL('image/png');
  }

  // =========================================================
  // 편집 패널
  // =========================================================
  const panels = $('edPanels');
  function set(k, v) {
    look[k] = v;
    queueRebuild();
    refreshActive();
    saveDraft();
  }

  function group(title, content) {
    const g = document.createElement('div');
    g.className = 'group';
    const h = document.createElement('h4');
    h.textContent = title;
    g.append(h, content);
    return g;
  }
  function chips(k, options) {
    const box = document.createElement('div');
    box.className = 'chips';
    for (const [val, label] of Object.entries(options)) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip-btn'; b.textContent = label;
      b.dataset.k = k; b.dataset.v = val;
      b.addEventListener('click', () => set(k, val));
      box.appendChild(b);
    }
    return box;
  }
  function swatches(k, palette, allowNone) {
    const box = document.createElement('div');
    box.className = 'swatch-row';
    if (allowNone) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'swatch none'; b.title = '없음';
      b.dataset.k = k; b.dataset.c = 'null';
      b.addEventListener('click', () => set(k, null));
      box.appendChild(b);
    }
    for (const c of palette) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'swatch'; b.style.background = hex(c);
      b.dataset.k = k; b.dataset.c = String(c);
      b.addEventListener('click', () => set(k, c));
      box.appendChild(b);
    }
    const pick = document.createElement('input');
    pick.type = 'color'; pick.title = '직접 고르기'; pick.dataset.k = k;
    pick.addEventListener('input', () => set(k, parseInt(pick.value.slice(1), 16)));
    box.appendChild(pick);
    return box;
  }
  function panel(id, children) {
    const p = document.createElement('div');
    p.className = 'ed-panel' + (id === 'species' ? ' active' : '');
    p.id = 'ed-' + id;
    children.forEach(c => c && p.appendChild(c));
    panels.appendChild(p);
    return p;
  }

  function buildPanels() {
    panels.innerHTML = '';
    // 종
    const grid = document.createElement('div');
    grid.className = 'species-grid';
    for (const [k, sp] of Object.entries(SPECIES)) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'species-btn'; b.dataset.species = k;
      b.innerHTML = `<span class="ic">${sp.icon}</span>${sp.name}`;
      b.addEventListener('click', () => {
        look = ISLE.withSpecies(look, k);
        queueRebuild(); refreshActive(); saveDraft();
      });
      grid.appendChild(b);
    }
    panel('species', [group('어떤 동물로 할까요?', grid)]);

    // 얼굴
    panel('face', [
      group('눈', chips('eyes', OPT.eyes)),
      group('눈동자 색', swatches('eyeColor', PAL.eye)),
      group('눈썹', chips('brows', OPT.brows)),
      group('입', chips('mouth', OPT.mouth)),
      group('볼터치', swatches('blush', [0xff7a95, 0xff9aa2, 0xffa07a, 0xff5d7a, 0xffb3d0, 0xe0a0ff], true)),
      group('얼굴 무늬', chips('marking', OPT.marking)),
    ]);

    // 털색
    panel('color', [
      group('몸 색', swatches('fur', PAL.fur)),
      group('주둥이·배 색', swatches('fur2', [0xffffff, 0xfff6e0, 0xfff0f4, 0xf7dcb6, 0xf2d9b0, 0xffe27a, 0xffd9df, 0xe8f7c8, 0xeaf3ff, 0x9aa3ad])),
      group('귀 안쪽 색', swatches('ear', [0xff9fb2, 0xffb3c6, 0xb77a45, 0x6a4020, 0x5cbf73, 0xb3b9ff, 0xc9b3ff, 0xffffff, 0x3a2a20])),
      group('무늬 색', swatches('markColor', [0x6f8fb8, 0x5a3418, 0x2b2b30, 0xffffff, 0x8a5a3b, 0xff8fb1, 0xd98f3a, 0x9aa3ad])),
      group('부리 색 (오리·펭귄)', swatches('beak', [0xff8a2a, 0xffb13d, 0xffd23a, 0xff6f61])),
      (() => { const n = document.createElement('p'); n.className = 'panel-note'; n.id = 'humanColorNote'; n.textContent = '사람은 머리 탭에서 피부색을 골라요.'; return n; })(),
    ]);

    // 머리
    panel('hair', [
      (() => { const n = document.createElement('p'); n.className = 'panel-note'; n.id = 'hairNote'; n.textContent = '머리 스타일은 사람만 고를 수 있어요. 동물 친구는 소품 탭에서 모자나 리본을 써 보세요! 🎀'; return n; })(),
      group('피부색', swatches('skin', PAL.skin)),
      group('머리 모양', chips('hairStyle', OPT.hairStyle)),
      group('머리 색', swatches('hair', PAL.hair)),
    ]);

    // 옷
    panel('clothes', [
      group('윗옷', chips('top', OPT.top)),
      group('무늬', chips('pattern', OPT.pattern)),
      group('옷 색', swatches('shirt', PAL.cloth)),
      group('무늬·안쪽 색', swatches('shirt2', PAL.cloth)),
      group('아래옷', chips('bottom', OPT.bottom)),
      group('아래옷 색', swatches('pants', PAL.cloth)),
      group('신발 색 (사람)', swatches('shoes', PAL.cloth)),
    ]);

    // 소품
    const antler = document.createElement('label');
    antler.className = 'toggle-row';
    antler.innerHTML = '<input type="checkbox" id="antlerIn" /> 사슴 뿔 달기';
    antler.querySelector('input').addEventListener('change', e => set('antlers', e.target.checked));
    panel('acc', [
      group('모자·머리 장식', chips('hat', OPT.hat)),
      group('모자 색', swatches('hatColor', PAL.cloth)),
      group('안경', chips('glasses', OPT.glasses)),
      group('안경 색', swatches('glassesColor', [0x3a3a3a, 0x8a5a3b, 0xd9b44a, 0xff6f61, 0x3a7bd5, 0xffffff])),
      group('액세서리', chips('acc', OPT.acc)),
      group('액세서리 색', swatches('accColor', PAL.cloth)),
      group('기타', antler),
    ]);

    document.querySelectorAll('#edTabs .tab').forEach(t => t.addEventListener('click', () => {
      document.querySelectorAll('#edTabs .tab').forEach(x => x.classList.toggle('active', x === t));
      document.querySelectorAll('.ed-panel').forEach(p => p.classList.toggle('active', p.id === 'ed-' + t.dataset.tab));
    }));
  }

  // 선택된 항목 표시
  function refreshActive() {
    document.querySelectorAll('.species-btn').forEach(b => b.classList.toggle('active', b.dataset.species === look.species));
    document.querySelectorAll('.chip-btn').forEach(b => b.classList.toggle('active', String(look[b.dataset.k]) === b.dataset.v));
    document.querySelectorAll('.swatch-row .swatch').forEach(b => b.classList.toggle('active', String(look[b.dataset.k]) === b.dataset.c));
    document.querySelectorAll('.swatch-row input[type=color]').forEach(inp => {
      const v = look[inp.dataset.k];
      if (typeof v === 'number') inp.value = hex(v);
    });
    const human = look.species === 'human';
    $('hairNote').hidden = human;
    $('humanColorNote').hidden = !human;
    document.querySelectorAll('#ed-hair .group').forEach(g => { g.style.display = human ? '' : 'none'; });
    $('antlerIn').checked = !!look.antlers;
    $('antlerIn').closest('.group').style.display = look.species === 'deer' ? '' : 'none';
  }

  // =========================================================
  // 도감 (저장된 캐릭터)
  // =========================================================
  const newId = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function saveCurrent() {
    const thumb = snapshot(160, false);
    const now = Date.now();
    if (editingId && store.characters.some(c => c.id === editingId)) {
      const c = store.characters.find(c => c.id === editingId);
      Object.assign(c, { name: name || c.name, phrase, look: { ...look }, thumb, updatedAt: now });
      toast(`💾 "${c.name}" 수정 내용을 저장했어요`);
    } else {
      const c = { id: newId(), name: name || `주민${store.characters.length + 1}`, phrase, look: { ...look }, thumb, createdAt: now, updatedAt: now };
      store.characters.unshift(c);
      editingId = c.id;
      name = c.name; $('nameIn').value = name;
      toast(`💾 "${c.name}"를 도감에 저장했어요`);
    }
    store.draft = { look, name, phrase, editingId };
    save();
    renderGallery();
  }
  function deleteChar(id) {
    const c = store.characters.find(c => c.id === id);
    if (!c || !confirm(`"${c.name}"를 도감에서 지울까요?`)) return;
    store.characters = store.characters.filter(x => x.id !== id);
    store.invited = store.invited.filter(x => x !== id);
    if (store.playerId === id) store.playerId = null;
    if (editingId === id) editingId = null;
    save();
    renderGallery();
    toast(`🗑️ "${c.name}"를 지웠어요`);
  }
  function openChar(c) {
    look = ISLE.normalizeLook(c.look);
    name = c.name; phrase = c.phrase || '';
    editingId = c.id;
    $('nameIn').value = name; $('phraseIn').value = phrase;
    rebuild(); refreshActive(); saveDraft(); renderGallery();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function togglePlayer(id) {
    store.playerId = store.playerId === id ? null : id;
    save(); renderGallery();
    toast(store.playerId ? '🙋 섬에서 이 캐릭터로 플레이해요!' : '기본 캐릭터로 돌아갔어요');
  }
  function toggleInvite(id) {
    const i = store.invited.indexOf(id);
    if (i >= 0) store.invited.splice(i, 1);
    else {
      if (store.invited.length >= 8) { toast('섬에는 최대 8명까지 초대할 수 있어요'); return; }
      store.invited.push(id);
    }
    save(); renderGallery();
    toast(i >= 0 ? '초대를 취소했어요' : '🏝️ 섬에 초대했어요! 섬에 가면 만날 수 있어요');
  }

  function renderGallery() {
    const box = $('gallery');
    box.innerHTML = '';
    for (const c of store.characters) {
      const card = document.createElement('div');
      card.className = 'card' + (c.id === editingId ? ' editing' : '');
      const img = document.createElement('img');
      img.alt = c.name; img.src = c.thumb || '';
      const nm = document.createElement('div');
      nm.className = 'nm';
      nm.textContent = `${SPECIES[c.look.species] ? SPECIES[c.look.species].icon : '🐾'} ${c.name}`;
      const badges = document.createElement('div');
      badges.className = 'badges';
      if (store.playerId === c.id) badges.innerHTML += '<span class="badge">🙋 내 캐릭터</span>';
      if (store.invited.includes(c.id)) badges.innerHTML += '<span class="badge island">🏝️ 섬 주민</span>';
      const btns = document.createElement('div');
      btns.className = 'card-btns';
      const bMe = document.createElement('button');
      bMe.textContent = '🙋 내 캐릭터'; bMe.className = store.playerId === c.id ? 'on' : '';
      bMe.addEventListener('click', e => { e.stopPropagation(); togglePlayer(c.id); });
      const bInv = document.createElement('button');
      bInv.textContent = '🏝️ 초대'; bInv.className = store.invited.includes(c.id) ? 'on' : '';
      bInv.addEventListener('click', e => { e.stopPropagation(); toggleInvite(c.id); });
      btns.append(bMe, bInv);
      const del = document.createElement('button');
      del.className = 'del'; del.textContent = '✕'; del.title = '삭제';
      del.addEventListener('click', e => { e.stopPropagation(); deleteChar(c.id); });
      card.append(img, nm, badges, btns, del);
      card.addEventListener('click', () => openChar(c));
      box.appendChild(card);
    }
    $('galCount').textContent = store.characters.length ? `(${store.characters.length})` : '';
  }

  // 추천 스타일 (오리지널 캐릭터)
  const PRESETS = [
    ...ISLE.VILLAGERS.map(v => ({ name: v.name, phrase: v.suffix, look: v })),
    { name: '솜사탕', phrase: '깡', look: { species: 'rabbit', fur: 0xffe0ec, eyes: 'sparkle', mouth: 'w', top: 'dress', pattern: 'heart', shirt: 0xffb3d0, shirt2: 0xffffff, hat: 'bow', hatColor: 0xff6f86, blush: 0xff7a95 } },
    { name: '여우비', phrase: '콩', look: { species: 'fox', eyes: 'smug', brows: 'thin', mouth: 'smile', top: 'hoodie', pattern: 'plain', shirt: 0x4fbf8a, bottom: 'pants', pants: 0x2f4b6e } },
    { name: '몽글이', phrase: '매', look: { species: 'sheep', eyes: 'sleepy', mouth: 'w', top: 'sweater', pattern: 'snow', shirt: 0xb69cff, shirt2: 0xffffff, hat: 'nightcap', hatColor: 0x8fd3ff } },
    { name: '개굴', phrase: '굴', look: { species: 'frog', mouth: 'grin', top: 'aloha', pattern: 'leaf', shirt: 0xfff4d6, shirt2: 0x4fbf8a, hat: 'straw', hatColor: 0xf2d27a } },
    { name: '펭펭', phrase: '펭', look: { species: 'penguin', eyes: 'dot', mouth: 'none', top: 'tee', pattern: 'star', shirt: 0x8fd3ff, shirt2: 0xffd84a, acc: 'scarf', accColor: 0xff6f61, hat: 'beanie', hatColor: 0xff6f61 } },
    { name: '꿀꿀이', phrase: '꿀', look: { species: 'pig', eyes: 'happy', mouth: 'smile', top: 'apron', pattern: 'flower', shirt: 0xfff4d6, shirt2: 0xff8fb1, bottom: 'skirt', pants: 0xff6f61 } },
    { name: '도토리', phrase: '톨', look: { species: 'squirrel', eyes: 'smug', brows: 'angry', mouth: 'pout', top: 'vest', shirt: 0x2f4b6e, shirt2: 0xffffff, bottom: 'pants', pants: 0xcfd6de, acc: 'bowtie', accColor: 0xff6f61 } },
    { name: '밤송이', phrase: '너굴', look: { species: 'tanuki', eyes: 'round', mouth: 'smile', top: 'aloha', pattern: 'leaf', shirt: 0xe8fff6, shirt2: 0x4fc1c9, bottom: 'shorts', pants: 0xcfc6a8 } },
    { name: '라떼', phrase: '라', look: { species: 'koala', eyes: 'dot', brows: 'worried', mouth: 'flat', top: 'sweater', pattern: 'plaid', shirt: 0xc98a4a, shirt2: 0xfff4d6, glasses: 'round', glassesColor: 0x8a5a3b } },
    { name: '꽃사슴', phrase: '슴', look: { species: 'deer', eyes: 'sparkle', mouth: 'smile', marking: 'spots', markColor: 0xffffff, top: 'dress', pattern: 'flower', shirt: 0xfff4d6, shirt2: 0xff8fb1, hat: 'flower', hatColor: 0xffb3d0 } },
    { name: '치즈', phrase: '찍', look: { species: 'mouse', fur: 0xfff3b0, eyes: 'star', mouth: 'tooth', top: 'tee', pattern: 'dots', shirt: 0xffffff, shirt2: 0xff6f61, hat: 'crown', acc: 'necklace', accColor: 0xff4d6d } },
    { name: '하루', phrase: '요', look: { species: 'human', skin: 0xffe2c8, hairStyle: 'pigtails', hair: 0x5a3a2a, eyes: 'dot', mouth: 'smile', top: 'tee', pattern: 'stripe', shirt: 0xffd84a, shirt2: 0xffffff, bottom: 'skirt', pants: 0x3a7bd5, acc: 'backpack', accColor: 0xef5a4f } },
  ];
  function renderPresets() {
    const box = $('presets');
    box.innerHTML = '';
    for (const p of PRESETS) {
      const card = document.createElement('div');
      card.className = 'card';
      const sp = SPECIES[p.look.species];
      card.innerHTML = `<div class="ic">${sp.icon}</div><div class="nm"></div><div class="badges"><span class="badge island">${sp.name}</span></div>`;
      card.querySelector('.nm').textContent = p.name;
      card.addEventListener('click', () => {
        look = ISLE.normalizeLook(p.look);
        name = p.name; phrase = p.phrase || '';
        editingId = null;
        $('nameIn').value = name; $('phraseIn').value = phrase;
        rebuild(); refreshActive(); saveDraft(); renderGallery();
        toast(`✨ "${p.name}" 스타일을 불러왔어요. 마음대로 바꿔보세요!`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      box.appendChild(card);
    }
  }

  // 내보내기 / 가져오기
  function exportAll() {
    const data = { app: 'cozy-island-creator', v: 1, characters: store.characters.map(({ thumb, ...rest }) => rest) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'my-island-characters.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function importFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result);
        const list = Array.isArray(d) ? d : d.characters;
        if (!Array.isArray(list)) throw new Error('형식 오류');
        let n = 0;
        const prev = { look, name, phrase };
        for (const c of list) {
          if (!c || !c.look) continue;
          const lk = ISLE.normalizeLook(c.look);
          // 썸네일 만들기
          look = lk; name = String(c.name || '주민').slice(0, 8); phrase = String(c.phrase || '').slice(0, 4);
          rebuild();
          store.characters.push({ id: newId(), name, phrase, look: lk, thumb: snapshot(160, false), createdAt: Date.now(), updatedAt: Date.now() });
          n++;
        }
        ({ look, name, phrase } = prev);
        rebuild();
        save(); renderGallery();
        toast(`⬆️ 캐릭터 ${n}명을 가져왔어요`);
      } catch (e) {
        toast('😢 가져오기에 실패했어요. JSON 파일을 확인해주세요.');
      }
    };
    reader.readAsText(file);
  }

  function toast(msg) {
    const box = $('toastBox');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => el.remove(), 2700);
  }

  // =========================================================
  // 시작
  // =========================================================
  function bind() {
    $('nameIn').addEventListener('input', e => { name = e.target.value.trim(); $('stageName').textContent = name; saveDraft(); });
    $('phraseIn').addEventListener('input', e => { phrase = e.target.value.trim(); saveDraft(); });
    $('randomBtn').addEventListener('click', () => {
      look = ISLE.randomLook();
      queueRebuild(); refreshActive(); saveDraft();
      char && (char.hopT = 0.6);
    });
    $('newBtn').addEventListener('click', () => {
      look = ISLE.normalizeLook({ species: 'cat' });
      name = ''; phrase = ''; editingId = null;
      $('nameIn').value = ''; $('phraseIn').value = '';
      rebuild(); refreshActive(); saveDraft(); renderGallery();
    });
    $('saveBtn').addEventListener('click', saveCurrent);
    $('photoBtn').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = snapshot(720, true);
      a.download = `${name || 'character'}.png`;
      a.click();
      toast('📷 사진을 저장했어요');
    });
    $('exportBtn').addEventListener('click', exportAll);
    $('importIn').addEventListener('change', e => { if (e.target.files[0]) importFile(e.target.files[0]); e.target.value = ''; });
    document.querySelectorAll('#poseBar button').forEach(b => b.addEventListener('click', () => {
      pose = b.dataset.pose;
      document.querySelectorAll('#poseBar button').forEach(x => x.classList.toggle('active', x === b));
      if (char) { char.waveT = 0; char.hopT = 0; char.talkT = 0; }
    }));
    $('spinBtn').addEventListener('click', () => { spin = !spin; $('spinBtn').classList.toggle('on', spin); });
    $('zoomInBtn').addEventListener('click', () => { zoom = clamp(zoom - 0.1, 0.55, 1.5); });
    $('zoomOutBtn').addEventListener('click', () => { zoom = clamp(zoom + 0.1, 0.55, 1.5); });
    window.addEventListener('resize', resize);
  }

  function start() {
    load();
    const d = store.draft;
    if (d && d.look) {
      look = ISLE.normalizeLook(d.look);
      name = d.name || ''; phrase = d.phrase || '';
      editingId = d.editingId && store.characters.some(c => c.id === d.editingId) ? d.editingId : null;
    } else {
      look = ISLE.normalizeLook(PRESETS[0].look);
      name = PRESETS[0].name; phrase = PRESETS[0].phrase;
    }
    $('nameIn').value = name; $('phraseIn').value = phrase;
    buildPanels();
    bind();
    resize();
    rebuild();
    refreshActive();
    renderGallery();
    renderPresets();
    $('loading').remove();
    requestAnimationFrame(t => { lastT = t; loop(t); });
    ISLE.creatorDebug = { get look() { return look; }, set: (k, v) => set(k, v), setLook: l => { look = ISLE.normalizeLook(l); rebuild(); refreshActive(); }, store: () => store, snapshot };
  }

  try { start(); }
  catch (e) {
    console.error(e);
    const l = $('loading');
    if (l) l.textContent = '😢 3D를 시작하지 못했어요. 브라우저가 WebGL을 지원하는지 확인해 주세요.';
  }
})();
