/* =========================================================
 *  가구 미리보기 썸네일 — 가구를 작은 3D 스튜디오에서 찍어 이미지로 보여줌
 *  (방 꾸미기 가구 목록에서 이름 대신 그림을 보고 고를 수 있게)
 *  · 화면에 보이는 버튼만 한 프레임에 몇 개씩 찍음 → 목록이 길어도 버벅이지 않음
 *  · 한 번 찍은 그림은 캐시해 다시 열 때 즉시 표시
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM;
  const FT = (FM.FurnThumb = {});
  const SIZE = 128;
  let R = null, scene, cam, cv, failed = false;
  const cache = new Map(), queue = [], queued = new Set();
  let running = false, io = null;

  function init() {
    if (R || failed) return !!R;
    try {
      cv = document.createElement('canvas'); cv.width = cv.height = SIZE;
      R = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
      R.setPixelRatio(1); R.setSize(SIZE, SIZE, false); R.outputEncoding = THREE.sRGBEncoding; R.setClearColor(0x000000, 0);
      scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xfffaf2, 0x6a5a58, 0.5));
      scene.add(new THREE.AmbientLight(0xffffff, 0.08));
      const key = new THREE.DirectionalLight(0xfff0e0, 0.6); key.position.set(3, 5, 4); scene.add(key);
      const rim = new THREE.DirectionalLight(0xe0e8ff, 0.3); rim.position.set(-4, 2, -3); scene.add(rim);
      cam = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
    } catch (e) { failed = true; R = null; }
    return !!R;
  }

  // 가구 한 개 찍기 → dataURL
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  FT.render = function (type) {
    if (cache.has(type)) return cache.get(type);
    if (!init() || !FM.FURN[type]) return null;
    const F = FM.FURN[type];
    let g;
    try { g = FM.PM.furniture(type, {}); } catch (e) { cache.set(type, ''); return ''; }
    scene.add(g);
    const box = new THREE.Box3().setFromObject(g), size = box.getSize(V(0, 0, 0)), c = box.getCenter(V(0, 0, 0));
    // 벽걸이는 정면, 러그는 위에서, 나머지는 3/4 각도
    const dir = F.wall ? V(0.28, 0.12, 1) : F.flat ? V(0.25, 1.5, 0.75) : F.ceiling ? V(0.8, 0.2, 1.1) : V(0.85, 0.7, 1.15);
    const r = Math.max(0.15, size.length() / 2);
    const dist = r / Math.sin((cam.fov / 2) * Math.PI / 180) * 0.92;
    cam.position.copy(c).add(dir.normalize().multiplyScalar(dist)); cam.near = dist / 50; cam.far = dist * 4; cam.updateProjectionMatrix(); cam.lookAt(c);
    let url = '';
    const rim = window.ISLE && ISLE.M.rimU, rim0 = rim ? rim.value : 1; if (rim) rim.value = 1;
    try { R.render(scene, cam); url = cv.toDataURL('image/png'); } catch (e) { url = ''; }
    if (rim) rim.value = rim0;
    scene.remove(g);
    cache.set(type, url);
    return url;
  };

  // 한 프레임에 몇 개씩 처리
  function pump() {
    running = true;
    const t0 = performance.now();
    while (queue.length && performance.now() - t0 < 14) {
      const img = queue.shift(); queued.delete(img);
      if (!img.isConnected) continue;
      const url = FT.render(img.dataset.ft);
      if (url) { img.src = url; img.classList.add('ok'); } else img.classList.add('none');
    }
    if (queue.length) requestAnimationFrame(pump); else running = false;
  }
  function enqueue(img) {
    if (img.classList.contains('ok') || queued.has(img)) return;
    const hit = cache.get(img.dataset.ft);
    if (hit) { img.src = hit; img.classList.add('ok'); return; }
    queued.add(img); queue.push(img);
    if (!running) requestAnimationFrame(pump);
  }
  // 목록 안의 <img data-ft="가구id"> 들을 보이는 순서대로 채움
  FT.fill = function (root) {
    const imgs = root.querySelectorAll('img[data-ft]');
    if (!('IntersectionObserver' in window)) { imgs.forEach(enqueue); return; }
    if (!io) io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { io.unobserve(e.target); enqueue(e.target); } }, { rootMargin: '120px' });
    imgs.forEach(img => { const hit = cache.get(img.dataset.ft); if (hit) { img.src = hit; img.classList.add('ok'); } else io.observe(img); });
  };
  FT.cache = cache;
})();
