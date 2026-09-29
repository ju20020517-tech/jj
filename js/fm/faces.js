/* =========================================================
 *  주민 얼굴 썸네일 — 목록·프로필·관계도·뉴스에 이모티콘 대신 진짜 얼굴
 *  작은 오프스크린 렌더러로 한 번 그려서 dataURL 로 캐시
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE;
  const Face = (FM.Face = {});
  const SIZE = 128;
  let R = null, scene, cam, cv;
  const cache = new Map();
  function init() {
    cv = document.createElement('canvas'); cv.width = cv.height = SIZE;
    R = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    R.setPixelRatio(1); R.setSize(SIZE, SIZE, false); R.outputEncoding = THREE.sRGBEncoding; R.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff4e8, 0x9a8078, 0.95));
    const k = new THREE.DirectionalLight(0xffeedd, 0.7); k.position.set(1.5, 2.5, 4); scene.add(k);
    cam = new THREE.PerspectiveCamera(22, 1, 0.1, 30);
  }
  const lookOf = v => {
    if (!v) return null;
    if (v.id === 'P' || v === (FM.Sim.get() || {}).player) return v.look || ISLE.normalizeLook({ species: 'human' });
    try { return FM.Chars.outfitLook(v); } catch (e) { return v.look; }
  };
  Face.url = function (v, emo) {
    const look = lookOf(v); if (!look) return '';
    const key = JSON.stringify(look) + (v.child ? v.child.stage : '') + (emo || '');
    if (cache.has(key)) return cache.get(key);
    try {
      if (!R) init();
      const l = Object.assign({}, look);
      if (emo === 'happy') { l.eyes = 'happy'; l.mouth = 'grin'; }
      const c = ISLE.M.character(l);
      c.root.rotation.y = -0.2;
      scene.add(c.root);
      c.root.updateMatrixWorld(true);
      const h = new THREE.Vector3(); c.head.getWorldPosition(h);
      cam.position.set(h.x + 0.4, h.y + 0.14, h.z + 3.6); cam.lookAt(h.x, h.y - 0.02, h.z);
      R.render(scene, cam);
      const url = cv.toDataURL('image/png');
      scene.remove(c.root);
      if (cache.size > 200) cache.delete(cache.keys().next().value);
      cache.set(key, url);
      return url;
    } catch (e) { console.error('face', e); return ''; }
  };
  // <img> 태그 (크기 px)
  Face.img = function (v, px = 40, cls = '') {
    const u = Face.url(v);
    if (!u) { const ic = v && v.look && ISLE.SPECIES[v.look.species] ? ISLE.SPECIES[v.look.species].icon : '🙂'; return `<span class="face-emo ${cls}" style="font-size:${px * 0.7}px">${ic}</span>`; }
    return `<img class="face ${cls}" src="${u}" width="${px}" height="${px}" alt="" draggable="false">`;
  };
})();
