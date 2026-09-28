/* =========================================================
 *  미연시(비주얼 노벨) 스탠딩 초상화 — 대화 중인 주민을 전용 캔버스에 3D로 크게 그림
 *  표정(기쁨/설렘/슬픔/화남/놀람/평온)에 맞춰 눈·입·눈썹과 포즈가 바뀜
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE;
  const Pt = (FM.Portrait = {});
  let renderer, scene, camera, canvas, model = null, modelKey = '', pose = 'listen', poseT = 0, running = false, last = 0, bob = 0;

  // 표정 → 얼굴 & 포즈
  const FACE = {
    calm:     { mouth: 'smile', pose: 'listen' },
    happy:    { eyes: 'happy', mouth: 'grin', pose: 'vnHappy' },
    love:     { eyes: 'happy', mouth: 'w', blush: 0xff5d8a, pose: 'cute' },
    shy:      { mouth: 'w', blush: 0xff7a95, pose: 'vnShy' },
    sad:      { eyes: 'sleepy', mouth: 'flat', brows: 'worried', pose: 'vnSad' },
    angry:    { mouth: 'pout', brows: 'angry', pose: 'vnAngry' },
    surprise: { eyes: 'round', mouth: 'open', pose: 'surprise' },
    sleepy:   { eyes: 'sleepy', mouth: 'flat', pose: 'vnSad' },
  };
  Pt.FACE = FACE;

  // 대사 → 표정 추정
  Pt.emotionOf = function (text, v) {
    const t = String(text || '');
    if (/💢|😡|화나|짜증|싫어|건드리지|용서 못|흥!|질투|배신/.test(t)) return 'angry';
    if (/😭|😢|💔|흑|슬퍼|미안|외로|힘들|헤어지|눈물|아파/.test(t)) return 'sad';
    if (/💕|❤|💖|사랑|좋아해|사귀|결혼|자기야|설레/.test(t)) return 'love';
    if (/😳|부끄|수줍|어\.\.\.|사실\.\.\.|몰래/.test(t)) return 'shy';
    if (/zz|졸려|쿨쿨|하암/.test(t)) return 'sleepy';
    if (/\?!|!\?|깜짝|뭐어|헉|정말\?|진짜\?/.test(t)) return 'surprise';
    if (/고마워|최고|좋아!|신나|ㅎㅎ|하하|😄|🎉|야호|✨|반가워|안녕/.test(t)) return 'happy';
    if (v && v.mood !== undefined && v.mood < 35) return 'sad';
    return 'calm';
  };

  // 초상화 전용 포즈
  const A = FM.Anim.POSES;
  const S = Math.sin;
  const arms = (c, lx, lz, rx, rz) => { c.armL.rotation.x = lx; c.armL.rotation.z = lz; c.armR.rotation.x = rx; c.armR.rotation.z = rz; };
  A.listen = A.listen || ((c, t) => { c.head.rotation.z = S(t * 0.9) * 0.06; c.head.rotation.x = 0.04 + S(t * 1.3) * 0.02; arms(c, 0.05, -0.12, 0.05, 0.12); });
  A.vnHappy = A.vnHappy || ((c, t) => { c.body.position.y += Math.abs(S(t * 5)) * 0.04 * Math.max(0, 1 - t * 0.4); c.head.rotation.z = 0.12; arms(c, 0, -0.5, 0, 0.5); });
  A.vnShy = A.vnShy || ((c, t) => { c.head.rotation.x = 0.28; c.head.rotation.z = -0.1; c.body.rotation.y = S(t * 1.6) * 0.12; arms(c, -0.7, 0.45, -0.7, -0.45); });
  A.vnSad = A.vnSad || ((c, t) => { c.head.rotation.x = 0.35; arms(c, 0.1, 0.1, 0.1, -0.1); c.body.position.y -= 0.02; });
  A.vnAngry = A.vnAngry || ((c, t) => { arms(c, -0.2, -0.9, -0.2, 0.9); c.head.rotation.x = -0.08; c.body.position.x = S(t * 30) * 0.008 * Math.max(0, 1 - t); });

  function init(cv) {
    canvas = cv;
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(24, 0.8, 0.1, 50);
    scene.add(new THREE.HemisphereLight(0xfff4e4, 0x8a6a6a, 0.85));
    scene.add(new THREE.AmbientLight(0xffe8d8, 0.2));
    const key = new THREE.DirectionalLight(0xffe2c0, 0.8); key.position.set(2.5, 4, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffc8e0, 0.55); rim.position.set(-3, 2.5, -3); scene.add(rim);
  }

  function build(v, emo) {
    const f = FACE[emo] || FACE.calm;
    const look = Object.assign({}, FM.Chars.outfitLook(v));
    if (f.eyes && !['star', 'wink'].includes(look.eyes)) look.eyes = f.eyes;
    if (f.mouth) look.mouth = f.mouth;
    if (f.brows) look.brows = f.brows;
    if (f.blush) look.blush = f.blush;
    const key = v.id + '|' + JSON.stringify(look) + '|' + (v.child ? v.child.stage : '');
    if (key === modelKey && model) return;
    if (model) scene.remove(model.root);
    const c = ISLE.M.character(look);
    const k = v.child ? { BABY: 0.6, TODDLER: 0.72, CHILD: 0.86 }[v.child.stage] || 1 : 1;
    c.root.scale.setScalar(k);
    c.root.rotation.y = -0.18;
    scene.add(c.root);
    model = c; modelKey = key;
    model.k = k;
  }

  function resize() {
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 380;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    if (model) {
      const c = model;
      c.body.rotation.set(0, 0, 0); c.body.position.set(0, 0, 0);
      c.head.rotation.set(0, 0, 0);
      ISLE.M.animate(c, dt, 0);
      poseT += dt; bob += dt;
      FM.Anim.apply(c, { pose }, poseT);
      // 화면 쪽을 살짝 바라봄
      const k = model.k || 1;
      camera.position.set(0.2, 1.0 * k + 0.1, 5.6 * Math.max(0.7, k));
      camera.lookAt(0, 0.8 * k, 0);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  // 초상화 표시 / 표정 갱신
  Pt.show = function (cv, v, emo) {
    try {
      if (!renderer || canvas !== cv) init(cv);
      resize();
      build(v, emo);
      const np = (FACE[emo] || FACE.calm).pose;
      if (np !== pose) { pose = np; poseT = 0; }
      if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
      return true;
    } catch (e) { console.error('portrait', e); return false; }
  };
  Pt.hide = function () { running = false; };
})();
