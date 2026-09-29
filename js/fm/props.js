/* =========================================================
 *  3D 모델: 가구(파츠 DSL), 손에 쥐는 소품, 5대 구역 건물, 야외 장식
 *  기존 둥글둥글 헬퍼(ISLE.M.h)를 재사용하고, 정적인 묶음은 bake()로 합쳐
 *  드로우콜을 줄임
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE;
  const M = ISLE.M, H = M.h;
  const { mat, geo, sphere, box, cyl, capsule, lathe, roundCone, puck, mesh, soften } = H;
  const PM = (FM.PM = {});
  const D2R = Math.PI / 180;

  // ---------------------------------------------------------
  // 캔버스 텍스처 (간판, 재질)
  // ---------------------------------------------------------
  const texCache = new Map();
  function ctex(key, w, h, draw, rep) {
    if (texCache.has(key)) return texCache.get(key);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
    t.anisotropy = 4;
    texCache.set(key, t);
    return t;
  }
  PM.ctex = ctex;
  const css = n => '#' + (n >>> 0).toString(16).padStart(6, '0');
  PM.css = css;
  function signTex(text, bg = '#ffffff', fg = '#3b2b20', w = 512, h = 128, glow) {
    return ctex(`sign:${text}:${bg}:${fg}:${w}:${h}:${glow || ''}`, w, h, (g) => {
      g.fillStyle = bg; g.beginPath(); g.roundRect ? g.roundRect(4, 4, w - 8, h - 8, 24) : g.rect(4, 4, w - 8, h - 8); g.fill();
      g.font = `${Math.floor(h * 0.52)}px Jua, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      if (glow) { g.shadowColor = glow; g.shadowBlur = 18; }
      g.fillStyle = fg;
      let size = Math.floor(h * 0.52);
      while (g.measureText(text).width > w - 30 && size > 12) { size -= 2; g.font = `${size}px Jua, sans-serif`; }
      g.fillText(text, w / 2, h / 2 + 2);
    });
  }
  PM.signTex = signTex;
  function sign(text, w, h, bg, fg, glow) {
    const t = signTex(text, bg, fg, 512, Math.round(512 * h / w), glow);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
    m.userData.noBake = true;
    return m;
  }
  PM.sign = sign;

  // 재질 텍스처 8종
  const MATTEX = {
    wood: () => ctex('m-wood', 128, 128, (g, w, h) => { g.fillStyle = '#c08a58'; g.fillRect(0, 0, w, h); for (let i = 0; i < 18; i++) { g.strokeStyle = `rgba(90,50,20,${0.1 + Math.random() * 0.15})`; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); g.bezierCurveTo(w / 3, y + 6, w * 2 / 3, y - 6, w, y); g.stroke(); } }, [1, 1]),
    marble: () => ctex('m-marble', 128, 128, (g, w, h) => { g.fillStyle = '#f4f2ee'; g.fillRect(0, 0, w, h); for (let i = 0; i < 7; i++) { g.strokeStyle = 'rgba(150,150,170,0.35)'; g.lineWidth = 1 + Math.random() * 1.5; g.beginPath(); let x = Math.random() * w, y = 0; g.moveTo(x, y); while (y < h) { x += (Math.random() - 0.5) * 30; y += 12; g.lineTo(x, y); } g.stroke(); } }, [1, 1]),
    rust: () => ctex('m-rust', 128, 128, (g, w, h) => { g.fillStyle = '#8a5a3a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${150 + Math.random() * 80},${60 + Math.random() * 40},20,0.45)`; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 2 + Math.random() * 6); } }, [1, 1]),
  };
  const swapCache = new Map();
  function swapMat(kind, color) {
    const k = kind + ':' + color;
    if (swapCache.has(k)) return swapCache.get(k);
    let m;
    const c = color !== undefined && color !== null ? color : FM.D.MATERIALS[kind].color;
    switch (kind) {
      case 'wood': m = soften(new THREE.MeshLambertMaterial({ map: MATTEX.wood(), color: c === FM.D.MATERIALS.wood.color ? 0xffffff : c })); break;
      case 'marble': m = soften(new THREE.MeshPhongMaterial({ map: MATTEX.marble(), color: c === FM.D.MATERIALS.marble.color ? 0xffffff : c, shininess: 60, specular: 0x444444 })); break;
      case 'glass': m = new THREE.MeshPhongMaterial({ color: c, transparent: true, opacity: 0.38, shininess: 120, specular: 0xffffff, depthWrite: false }); break;
      case 'felt': m = soften(new THREE.MeshLambertMaterial({ color: c }), 0.6); break;
      case 'neon': m = new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.9 }); break;
      case 'rust': m = soften(new THREE.MeshLambertMaterial({ map: MATTEX.rust(), color: c === FM.D.MATERIALS.rust.color ? 0xffffff : c })); break;
      case 'gold': m = new THREE.MeshPhongMaterial({ color: c, shininess: 90, specular: 0xfff0a0, emissive: 0x3a2a00 }); break;
      case 'jelly': m = new THREE.MeshPhongMaterial({ color: c, transparent: true, opacity: 0.72, shininess: 110, specular: 0xffffff }); break;
      default: m = mat(c);
    }
    swapCache.set(k, m);
    return m;
  }
  PM.swapMat = swapMat;

  const glassMat = c => { const k = 'glass:' + c; if (!swapCache.has(k)) swapCache.set(k, new THREE.MeshPhongMaterial({ color: c, transparent: true, opacity: 0.4, shininess: 100, depthWrite: false })); return swapCache.get(k); };
  const glowMat = c => { const k = 'glow:' + c; if (!swapCache.has(k)) swapCache.set(k, new THREE.MeshBasicMaterial({ color: c })); return swapCache.get(k); };
  PM.glowMat = glowMat; PM.glassMat = glassMat;

  // 별 / 스테인드글라스 텍스처
  const starsTex = () => ctex('stars', 256, 128, (g, w, h) => { g.fillStyle = '#0a0f2a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(255,255,255,${Math.random()})`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); } g.fillStyle = 'rgba(180,160,255,0.25)'; g.beginPath(); g.ellipse(w / 2, h / 2, w / 2, h / 6, -0.3, 0, Math.PI * 2); g.fill(); });
  const stainedTex = () => ctex('stained', 128, 192, (g, w, h) => { const cols = ['#ff5d7a', '#ffd84a', '#4fc1e9', '#8ee07a', '#b69cff', '#ff9a4a']; for (let y = 0; y < h; y += 24) for (let x = 0; x < w; x += 24) { g.fillStyle = cols[(x / 24 + y / 24 * 2) % cols.length | 0]; g.fillRect(x, y, 24, 24); } g.strokeStyle = '#2b2b30'; g.lineWidth = 3; for (let y = 0; y <= h; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } for (let x = 0; x <= w; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } });

  // ---------------------------------------------------------
  // 파츠 DSL → 메시
  // ---------------------------------------------------------
  function partMesh(p, opts = {}) {
    const [shape, a, b, c, x, y, z, color, flags = ''] = p;
    let g;
    switch (shape) {
      case 'b': g = box(a, b, c); break;
      case 'c': g = cyl(a, a, b, 20); break;
      case 'C': g = geo(`cone${a},${b}`, () => new THREE.ConeGeometry(a, b, 20)); break;
      case 's': g = sphere(a); break;
      case 't': g = geo(`tor${a},${b}`, () => new THREE.TorusGeometry(a, b, 10, 28)); break;
      case 'p': g = geo(`pl${a},${b}`, () => new THREE.PlaneGeometry(a, b)); break;
      case 'k': g = capsule(a, b); break;
      default: g = box(0.2, 0.2, 0.2);
    }
    let m;
    const main = flags.includes('m');
    if (main && opts.mat) m = swapMat(opts.mat, opts.color);
    else if (main && opts.color !== undefined && opts.color !== null) m = mat(opts.color);
    else if (flags.includes('pic') && opts.pattern) m = new THREE.MeshBasicMaterial({ map: opts.pattern });
    else if (flags.includes('face') && opts.faceTex) m = new THREE.MeshBasicMaterial({ map: opts.faceTex });
    else if (flags.includes('stars')) m = new THREE.MeshBasicMaterial({ map: starsTex() });
    else if (flags.includes('stained')) m = new THREE.MeshBasicMaterial({ map: stainedTex(), side: THREE.DoubleSide });
    else if (flags.includes('g')) m = glassMat(color);
    else if (flags.includes('e')) m = glowMat(color);
    else m = mat(color);
    const o = mesh(g, m, x, y, z);
    if (shape === 's' && b && b !== 1) o.scale.y = b;
    const rot = (k) => { const r = flags.match(new RegExp('r' + k + '(-?\\d+)')); return r ? +r[1] * D2R : 0; };
    o.rotation.set(rot('x'), rot('y'), rot('z'));
    if (flags.includes('e') || flags.includes('g')) o.castShadow = false;
    if (main) o.userData.main = true;
    if (flags.includes('pic')) o.userData.pic = true;
    return o;
  }
  // 가구 (재질/색/무늬 적용)
  PM.furniture = function (type, opts = {}) {
    const F = FM.FURN[type];
    const g = new THREE.Group();
    if (!F) { g.add(mesh(box(0.5, 0.5, 0.5), mat(0xff00ff), 0, 0.25, 0)); return g; }
    const built = F.parts.map(p => { const m = partMesh(p, opts); g.add(m); return m; });
    if (F.build) {
      F.build(g, opts); bake(g);
      // 방마다 다른 색 조합: 포인트 색만 색상환 회전
      if (opts.hue && FM.RoomKit) g.traverse(o => { if (o.isMesh) o.material = FM.RoomKit.hueMat(o.material, opts.hue); });
    }
    else furnDetail(F, g, built);
    g.userData.type = type;
    return g;
  };

  // ---------------------------------------------------------
  // 가구 디테일 (자동): 스툴, 베개·이불 접힘·침대 다리, 소파 쿠션·쿠션볼·다리, 의자 방석
  // ---------------------------------------------------------
  const PASTEL = [0xffd6e0, 0xfff0b8, 0xd6f0ff, 0xdff5d0, 0xeadcff, 0xffe2c8];
  const hashStr = t => { let h = 0; for (const ch of t) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); };
  const topOf = p => { const [sh, a, b, , , y] = p; return y + (sh === 's' ? a * (b || 1) : b / 2); };
  const botOf = p => { const [sh, a, b, , , y] = p; return y - (sh === 's' ? a * (b || 1) : b / 2); };
  const shadeC = (c, k) => { const f = x => Math.min(255, Math.max(0, Math.round(x * k))); return (f((c >> 16) & 255) << 16) | (f((c >> 8) & 255) << 8) | f(c & 255); };
  function stool(g, x, z, col) {
    const s = new THREE.Group(); s.position.set(x, 0, z);
    const cush = mesh(sphere(0.21), mat(col), 0, 0.43, 0); cush.scale.set(1, 0.3, 1); s.add(cush);
    s.add(mesh(cyl(0.2, 0.2, 0.05), mat(0xc99a6a), 0, 0.39, 0));
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; const l = mesh(cyl(0.022, 0.03, 0.4), mat(0xa87a4a), Math.cos(a) * 0.13, 0.19, Math.sin(a) * 0.13); l.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12); s.add(l); }
    s.add(mesh(geo('stoolRing', () => new THREE.TorusGeometry(0.12, 0.012, 6, 20)), mat(0xa87a4a), 0, 0.16, 0).rotateX(Math.PI / 2));
    g.add(s);
  }
  function furnDetail(F, g, built) {
    const tags = F.tags || [], parts = F.parts;
    const accent = PASTEL[hashStr(F.id) % PASTEL.length], accent2 = PASTEL[(hashStr(F.id) + 2) % PASTEL.length];
    // 테이블 앞 동글 스툴
    for (const u of F.use || []) if (u.stool) stool(g, u.dx, u.dz, accent);
    const mains = parts.map((p, i) => [p, built[i]]).filter(([p]) => (p[8] || '').includes('m') && p[0] === 'b');
    if (F.bed) {
      const b = F.bed;
      // 통통한 베개 두 개
      const pw = Math.min(0.42, F.w * 0.22);
      for (const sx of F.w > 1.6 ? [-1, 1] : [0]) {
        const pl = mesh(sphere(0.3), mat(0xfffdf8), sx * pw * 0.95, b.top + 0.07, b.headZ - 0.06);
        pl.scale.set(pw / 0.3 * 0.95, 0.3, 0.62); g.add(pl);
      }
      // 이불 윗단 접힘 (흰 띠) + 누빔 단추
      const bl = parts.find(p => p[0] === 'b' && p[6] > 0.2 && p[2] < 0.2 && !(p[8] || '').includes('m') && Math.abs(topOf(p) - b.top) < 0.02);
      if (bl) {
        g.add(mesh(box(bl[1] + 0.03, bl[2] + 0.05, 0.2, 0.04), mat(0xfffaf2), bl[4], bl[5] + 0.01, bl[6] - bl[3] / 2 + 0.1));
        for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) g.add(mesh(sphere(0.025), mat(shadeC(bl[7], 0.8)), bl[4] + (i - 1) * bl[1] * 0.3, topOf(bl) + 0.005, bl[6] + (k - 0.2) * bl[3] * 0.35, false));
        // 침대 끝에 걸친 담요
        g.add(mesh(box(bl[1] * 0.98, 0.05, 0.4, 0.02), mat(accent), bl[4], topOf(bl) + 0.02, bl[6] + bl[3] / 2 - 0.25));
      }
      // 동글 나무 다리
      const fr = mains[0];
      if (fr && botOf(fr[0]) > 0.04) {
        const [, a, , c, x, , z] = fr[0], h = botOf(fr[0]);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(mesh(cyl(0.05, 0.07, h), mat(0xa87a4a), x + sx * (a / 2 - 0.1), h / 2, z + sz * (c / 2 - 0.1)));
      }
    }
    if (tags.includes('sofa') && mains.length >= 1) {
      const [sp, sm] = mains[0];
      const [, a, b, c, x, y, z] = sp, top = y + b / 2;
      // 방석 두 칸 (소파 재질 그대로)
      for (const sx of [-1, 1]) g.add(mesh(box(a / 2 - 0.2, 0.1, c - 0.3, 0.05), sm.material, x + sx * a / 4, top + 0.02, z + 0.08));
      // 쿠션볼 (양 끝)
      for (const [sx, col] of [[-1, accent], [1, accent2]]) { const cu = mesh(sphere(0.2), mat(col), x + sx * (a / 2 - 0.35), top + 0.22, z - c / 2 + 0.26); cu.scale.set(1, 0.95, 0.45); cu.rotation.z = sx * 0.25; g.add(cu); }
      if (y - b / 2 > 0.04) for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(mesh(cyl(0.035, 0.025, y - b / 2), mat(0x8a5a3b), x + sx * (a / 2 - 0.1), (y - b / 2) / 2, z + sz * (c / 2 - 0.1)));
      else for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(mesh(cyl(0.04, 0.03, 0.08), mat(0x8a5a3b), x + sx * (a / 2 - 0.12), 0.04, z + sz * (c / 2 - 0.12)));
      // 등받이 윗단 파이핑
      if (mains[1]) { const [bp] = mains[1]; g.add(mesh(capsule(0.035, Math.max(0.1, bp[1] - 0.2)), mat(shadeC(sp[7], 0.85)), bp[4], bp[5] + bp[2] / 2, bp[6] + 0.02).rotateZ(Math.PI / 2)); }
    }
    if (tags.includes('chair') && mains.length && !tags.includes('sofa')) {
      const [sp] = mains[0];
      if (sp[1] <= 1.0) { const cu = mesh(sphere(0.3), mat(accent), sp[4], sp[5] + sp[2] / 2 + 0.03, sp[6] + 0.02); cu.scale.set(sp[1] * 0.4 / 0.3 * 1.05, 0.14, sp[3] * 0.4 / 0.3); g.add(cu); }
    }
    if (tags.includes('bench') && mains.length) {
      const [sp] = mains[0];
      // 벤치 방석 두 개
      for (const sx of [-1, 1]) { const cu = mesh(sphere(0.3), mat(sx < 0 ? accent : accent2), sp[4] + sx * sp[1] * 0.22, sp[5] + sp[2] / 2 + 0.03, sp[6] + 0.02); cu.scale.set(0.7, 0.13, 0.62); g.add(cu); }
    }
  }

  // ---------------------------------------------------------
  // 손에 쥐는 소품
  // ---------------------------------------------------------
  const PROPS = {
    book: [['b', 0.16, 0.2, 0.05, 0, 0, 0, 0x4f7fd0]], notebook: [['b', 0.15, 0.19, 0.03, 0, 0, 0, 0xfff4d6]], sketchbook: [['b', 0.2, 0.16, 0.02, 0, 0, 0, 0xffffff]], magazine: [['b', 0.16, 0.2, 0.02, 0, 0, 0, 0xff8fb1]],
    snack: [['b', 0.12, 0.16, 0.05, 0, 0, 0, 0xffd84a]], can: [['c', 0.045, 0.12, 0, 0, 0, 0, 0xff6f61]], drink: [['c', 0.05, 0.14, 0, 0, 0, 0, 0x8fd3ff, 'g'], ['c', 0.006, 0.12, 0, 0.02, 0.08, 0, 0xffffff]],
    sandwich: [['b', 0.14, 0.06, 0.1, 0, 0, 0, 0xf2c46d], ['b', 0.13, 0.02, 0.09, 0, 0.01, 0, 0x7ccf6a]], teacup: [['c', 0.05, 0.06, 0, 0, 0, 0, 0xffffff], ['t', 0.03, 0.008, 0, 0.055, 0, 0, 0xffffff]],
    magnifier: [['t', 0.06, 0.012, 0, 0, 0.06, 0, 0x55595f], ['c', 0.015, 0.12, 0, 0, -0.04, 0, 0x8a5a3b]], telescope: [['c', 0.035, 0.3, 0, 0, 0.1, 0, 0xd9b44a, 'rx60']], camera: [['b', 0.14, 0.09, 0.07, 0, 0, 0, 0x2b2b30], ['c', 0.03, 0.04, 0, 0, 0, 0.05, 0x55595f, 'rx90']],
    wateringCan: [['c', 0.08, 0.12, 0, 0, 0, 0, 0x7ccf6a], ['c', 0.012, 0.16, 0, 0.1, 0.05, 0, 0x7ccf6a, 'rz-50']], stick: [['c', 0.012, 0.45, 0, 0, 0.15, 0, 0x8a5a3b, 'rz10']], mic: [['c', 0.015, 0.14, 0, 0, 0, 0, 0x2b2b30], ['s', 0.035, 1, 0, 0, 0.08, 0, 0x9aa3ad]],
    rod: [['c', 0.01, 1.1, 0, 0, 0.4, 0.2, 0x8a5a3b, 'rx40']], net: [['c', 0.012, 0.7, 0, 0, 0.3, 0, 0xd9b44a], ['t', 0.12, 0.01, 0, 0, 0.66, 0, 0xffffff, 'rx90']], dumbbell: [['c', 0.015, 0.2, 0, 0, 0, 0, 0x55595f, 'rz90'], ['s', 0.05, 1, 0, -0.1, 0, 0, 0x2b2b30], ['s', 0.05, 1, 0, 0.1, 0, 0, 0x2b2b30]],
    broom: [['c', 0.012, 0.8, 0, 0, 0.2, 0, 0x8a5a3b], ['C', 0.08, 0.2, 0, 0, -0.25, 0, 0xd9b44a, 'rx180']], duster: [['c', 0.01, 0.35, 0, 0, 0.1, 0, 0x8a5a3b], ['s', 0.07, 1.2, 0, 0, 0.3, 0, 0xffb3d1]], bag: [['b', 0.16, 0.2, 0.1, 0, 0, 0, 0x7ccf6a]],
    candle: [['c', 0.025, 0.12, 0, 0, 0, 0, 0xfff4d6], ['s', 0.02, 1.5, 0, 0, 0.09, 0, 0xffb13d, 'e']], crystal: [['s', 0.08, 1, 0, 0, 0.04, 0, 0xc9b3ff, 'g']], guitar: [['s', 0.14, 1.2, 0, 0, -0.05, 0, 0xc98a4a], ['c', 0.02, 0.45, 0, 0.18, 0.12, 0, 0x6a4028, 'rz-60']],
    handMirror: [['c', 0.07, 0.015, 0, 0, 0.06, 0, 0xcfe8ff, 'rx90e'], ['c', 0.015, 0.1, 0, 0, -0.04, 0, 0xff8fb1]], brush: [['c', 0.01, 0.25, 0, 0, 0.05, 0, 0x8a5a3b], ['s', 0.025, 1.5, 0, 0, 0.18, 0, 0xff6f61]],
    thermometer: [['c', 0.008, 0.12, 0, 0, 0, 0, 0xffffff]], spatula: [['c', 0.01, 0.25, 0, 0, 0.05, 0, 0x2b2b30], ['b', 0.07, 0.01, 0.09, 0, 0.18, 0, 0x9aa3ad]], hammer: [['c', 0.012, 0.25, 0, 0, 0.05, 0, 0x8a5a3b], ['b', 0.12, 0.05, 0.05, 0, 0.17, 0, 0x55595f]],
    marshmallow: [['c', 0.006, 0.4, 0, 0, 0.15, 0.1, 0x8a5a3b, 'rx60'], ['s', 0.03, 1.2, 0, 0, 0.32, 0.2, 0x3a2a20]], bubbleWand: [['c', 0.008, 0.2, 0, 0, 0.05, 0, 0xff8fb1], ['t', 0.035, 0.006, 0, 0, 0.17, 0, 0xff8fb1]],
    pudding: [['c', 0.05, 0.06, 0, 0, 0, 0, 0xffd84a], ['c', 0.03, 0.02, 0, 0, 0.04, 0, 0x8a4a1a]], postit: [['b', 0.08, 0.08, 0.005, 0, 0, 0, 0xff8fb1]], apple: [['s', 0.05, 1, 0, 0, 0, 0, 0xe8433b]], pill: [['k', 0.015, 0.03, 0, 0, 0, 0, 0xff8fb1, 'rz90']],
    kimbap: [['C', 0.07, 0.1, 0, 0, 0, 0, 0xffffff], ['b', 0.07, 0.04, 0.02, 0, -0.02, 0.02, 0x2b2b30]], bowl: [['s', 0.08, 0.5, 0, 0, 0, 0, 0xffffff]], tangerine: [['s', 0.045, 0.9, 0, 0, 0, 0, 0xff8a24]],
    popcorn: [['c', 0.06, 0.12, 0, 0, 0, 0, 0xff4d4d], ['s', 0.06, 0.6, 0, 0, 0.07, 0, 0xfff4d6]], diary: [['b', 0.15, 0.19, 0.04, 0, 0, 0, 0x9a5ad0]], letter: [['b', 0.14, 0.1, 0.005, 0, 0, 0, 0xffe0ec]], pen: [['c', 0.006, 0.14, 0, 0, 0, 0, 0x2b2b30]],
    paperBoat: [['C', 0.08, 0.06, 0, 0, 0, 0, 0xffffff, 'rz180']], hose: [['t', 0.08, 0.015, 0, 0, 0, 0, 0x4fae4a, 'rx90']], surfboard: [['k', 0.1, 1.1, 0, 0, 0, 0, 0xff8fb1, 'rx90']], tube: [['t', 0.3, 0.1, 0, 0, 0, 0, 0xff6f61, 'rx90']],
    radio: [['b', 0.2, 0.13, 0.08, 0, 0, 0, 0xff8f6a]], ring: [['t', 0.03, 0.008, 0, 0, 0, 0, 0xffd23a], ['s', 0.012, 1, 0, 0, 0.035, 0, 0xe8f6ff, 'e']], flower: [['c', 0.005, 0.2, 0, 0, 0.05, 0, 0x5fb070], ['s', 0.04, 1, 0, 0, 0.16, 0, 0xff4d6d]],
    kid_dumbbell: [['c', 0.01, 0.12, 0, 0, 0, 0, 0x55595f, 'rz90'], ['s', 0.03, 1, 0, -0.06, 0, 0, 0xff8fb1], ['s', 0.03, 1, 0, 0.06, 0, 0, 0xff8fb1]],
  };
  PM.prop = function (name) {
    const parts = PROPS[name];
    if (!parts) return null;
    const g = new THREE.Group();
    for (const p of parts) { const m = partMesh(p); m.castShadow = false; g.add(m); }
    return g;
  };

  // ---------------------------------------------------------
  // 정적 묶음 병합 (bake)
  // ---------------------------------------------------------
  function bake(group) {
    group.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
    const buckets = new Map();
    const keep = [];
    group.traverse(o => {
      if (!o.isMesh) return;
      if (o.userData.noBake || o.userData.dyn || Array.isArray(o.material) || o.material.transparent) { keep.push(o); return; }
      const m4 = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
      let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      const out = new THREE.BufferGeometry();
      out.setAttribute('position', g.attributes.position.clone());
      out.setAttribute('normal', g.attributes.normal ? g.attributes.normal.clone() : new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3));
      out.setAttribute('uv', g.attributes.uv ? g.attributes.uv.clone() : new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      out.applyMatrix4(m4);
      const k = o.material.uuid + (o.castShadow ? 's' : '');
      if (!buckets.has(k)) buckets.set(k, { mat: o.material, shadow: o.castShadow, geos: [] });
      buckets.get(k).geos.push(out);
    });
    const keepData = keep.map(o => ({ o, m: new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld) }));
    while (group.children.length) group.remove(group.children[0]);
    for (const b of buckets.values()) {
      let n = 0; for (const g of b.geos) n += g.attributes.position.count;
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
      let o3 = 0, o2 = 0;
      for (const g of b.geos) { pos.set(g.attributes.position.array, o3); nor.set(g.attributes.normal.array, o3); uv.set(g.attributes.uv.array, o2); o3 += g.attributes.position.array.length; o2 += g.attributes.uv.array.length; g.dispose(); }
      const mg = new THREE.BufferGeometry();
      mg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); mg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); mg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      mg.computeBoundingSphere();
      const mm = new THREE.Mesh(mg, b.mat); mm.castShadow = b.shadow; mm.receiveShadow = true;
      group.add(mm);
    }
    for (const { o, m } of keepData) { m.decompose(o.position, o.quaternion, o.scale); group.add(o); }
    return group;
  }
  PM.bake = bake;

  // ---------------------------------------------------------
  // 건물 도우미
  // ---------------------------------------------------------
  const B = (w, h, d, color, x = 0, y = 0, z = 0, r) => mesh(box(w, h, d, r !== undefined ? r : 0.15), mat(color), x, y + h / 2, z);
  const winTex = (key, cols, rows, lit, frame = '#dfe6f0', glass = '#8fd3ff') => ctex('win:' + key, 256, 256, (g, w, h) => {
    g.fillStyle = frame; g.fillRect(0, 0, w, h);
    const cw = w / cols, rh = h / rows;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { g.fillStyle = Math.random() < lit ? '#fff1b0' : glass; g.fillRect(x * cw + 3, y * rh + 3, cw - 6, rh - 6); }
  });
  function glassFacade(w, h, d, key, cols, rows, lit, tint = 0xffffff) {
    const g = new THREE.Group();
    const t = winTex(key, cols, rows, lit);
    const m = soften(new THREE.MeshLambertMaterial({ map: t, color: tint }));
    const bx = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    bx.position.y = h / 2; bx.castShadow = true; bx.receiveShadow = true;
    g.add(bx);
    return g;
  }
  function roofSign(g, text, w, y, z, bg = '#ffffff', fg = '#3b2b20', glow) { const s = sign(text, w, w / 4, bg, fg, glow); s.position.set(0, y, z); g.add(s); return s; }
  function door(g, x, z, w = 1.6, h = 2.3, color = 0x8a5a3b, ry = 0) {
    const d = mesh(box(w, h, 0.18, 0.06), mat(color), x, h / 2, z); d.rotation.y = ry; g.add(d);
    const k = mesh(sphere(0.07), mat(0xffd23a), x + Math.cos(ry) * w * 0.3, h * 0.5, z + 0.1); g.add(k);
    return d;
  }

  // =========================================================
  // 건물들
  // =========================================================
  const BLD = {};
  // 5층 메가 아파트 '시티 타워' — 20개 창문
  BLD.apartment = (p) => {
    const g = new THREE.Group();
    const { w, d, h } = p.bld;
    g.add(B(w, h, d, 0xf6efe4));
    for (let f = 0; f <= 5; f++) g.add(mesh(box(w + 0.4, 0.25, d + 0.4, 0.08), mat(0xe0d6c4), 0, f * 3.3 + 0.05, 0));
    g.add(mesh(box(w + 0.8, 0.6, d + 0.8, 0.2), mat(0xff8f6a), 0, h + 0.3, 0));
    const wins = {};
    const xs = [-10.5, -3.5, 3.5, 10.5];
    for (let f = 1; f <= 5; f++) for (let n = 1; n <= 4; n++) {
      const x = xs[n - 1], y = (f - 1) * 3.3 + 1.75;
      const frame = mesh(box(4.4, 2.3, 0.3, 0.08), mat(0xffffff), x, y, d / 2 + 0.02); g.add(frame);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.95), new THREE.MeshBasicMaterial({ color: 0x9fd6ff }));
      glass.position.set(x, y, d / 2 + 0.19); glass.userData.dyn = true; g.add(glass);
      const sill = mesh(box(4.6, 0.15, 0.6, 0.05), mat(0xff8f6a), x, y - 1.15, d / 2 + 0.3); g.add(sill);
      for (const s of [-1, 1]) { const pot = mesh(sphere(0.22), mat([0xff6f86, 0xffd84a, 0x8fd3ff][(f + n) % 3]), x + s * 1.7, y - 0.95, d / 2 + 0.45); pot.scale.y = 0.7; g.add(pot); }
      wins[`apt-${f}0${n}`] = { glass, x, y, z: d / 2 + 0.2 };
    }
    door(g, 0, d / 2 + 0.05, 2, 2.6, 0x6fb7c9);
    g.add(mesh(box(3.6, 0.2, 2, 0.05), mat(0xe0d6c4), 0, 0.1, d / 2 + 1));
    roofSign(g, '🏢 시티 타워 CITY TOWER', 12, h + 2.2, d / 2 - 1, '#ff8f6a', '#ffffff');
    // 우편함 벽
    g.add(mesh(box(2.4, 1.4, 0.4, 0.05), mat(0xd9b44a), -3.2 + 1.2, 0.7 + 0.1, d / 2 + 0.3).translateX(2.2));
    g.userData.windows = wins;
    return g;
  };
  BLD.cafe = (p) => {
    const g = new THREE.Group();
    const { w, d, h } = p.bld;
    g.add(B(w, h, d, 0xfff4e6));
    g.add(mesh(box(w + 0.6, 0.4, d + 0.6, 0.15), mat(0xc0392b), 0, h, 0));
    // 빨간색 차양막
    const aw = mesh(box(w + 0.4, 0.12, 2.6, 0.05), mat(0xe74c3c), 0, h - 1.1, d / 2 + 1.2); aw.rotation.x = 0.28; g.add(aw);
    for (let i = -2; i <= 2; i++) g.add(mesh(box(0.9, 0.13, 2.6, 0.04), mat(0xffffff), i * 2.1, h - 1.08, d / 2 + 1.21).rotateX(0.28));
    const gl = mesh(box(w - 2, 2.2, 0.1, 0.03), glassMat(0xbfe8ff), 0, 1.4, d / 2 + 0.03); g.add(gl);
    door(g, 0, d / 2 + 0.05, 1.4, 2.3, 0xc0392b);
    roofSign(g, '☕ 카페 앙상블', 6, h + 1, 0, '#c0392b', '#ffffff');
    return g;
  };
  BLD.station = (p) => {
    const g = new THREE.Group();
    const { w, d } = p.bld;
    g.add(mesh(box(w, 0.5, d, 0.1), mat(0xcfd6de), 0, 0.25, 0));
    for (const x of [-w / 2 + 0.4, w / 2 - 0.4]) for (const z of [-d / 2 + 0.4, d / 2 - 0.4]) g.add(mesh(cyl(0.18, 0.18, 3.8), mat(0x3a7bd5), x, 2.2, z));
    const roof = mesh(box(w + 1, 0.3, d + 1, 0.1), glassMat(0x8fd3ff), 0, 4.1, 0); g.add(roof);
    g.add(mesh(box(w + 1, 0.2, 0.3, 0.05), mat(0x3a7bd5), 0, 4.1, d / 2 + 0.5));
    // 에스컬레이터 출입구
    const esc = mesh(box(3, 0.2, 4, 0.05), mat(0x55595f), 0, 0.3, 0.5); esc.rotation.x = -0.35; g.add(esc);
    roofSign(g, 'Ⓜ 센트럴 메트로 환승역', 7, 5.2, d / 2, '#3a7bd5', '#ffffff');
    const board = sign('노선도: Ⓒ센트럴 ─ Ⓝ북 · Ⓔ동 · Ⓦ서 · Ⓢ남', 4.5, 1.1, '#1a2340', '#ffd84a'); board.position.set(-w / 2 - 0.1, 2.2, 0); board.rotation.y = -Math.PI / 2; g.add(board);
    return g;
  };
  BLD.exitStation = (label) => {
    const g = new THREE.Group();
    g.add(mesh(box(3.6, 0.3, 3, 0.1), mat(0xcfd6de), 0, 0.15, 0));
    for (const x of [-1.6, 1.6]) g.add(mesh(cyl(0.1, 0.1, 2.6), mat(0x3a7bd5), x, 1.4, 1.2));
    g.add(mesh(box(4, 0.2, 3.4, 0.08), glassMat(0x8fd3ff), 0, 2.8, 0));
    const s = sign('Ⓜ ' + label, 3.4, 0.7, '#3a7bd5', '#ffffff'); s.position.set(0, 3.3, 1.3); g.add(s);
    return g;
  };
  // 전광판 & 방송 스튜디오
  BLD.studio = (p) => {
    const g = new THREE.Group();
    const { w, d, h } = p.bld;
    g.add(glassFacade(w, h, d, 'studio', 6, 8, 0.4));
    const board = new THREE.Mesh(new THREE.PlaneGeometry(w - 1, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    board.position.set(0, h - 4.2, d / 2 + 0.06); board.userData.dyn = true; g.add(board);
    const frame = mesh(box(w - 0.5, 6.5, 0.3, 0.1), mat(0x2b2b30), 0, h - 4.2, d / 2 - 0.08); g.add(frame);
    door(g, 0, d / 2 + 0.05, 1.8, 2.4, 0x2f4b6e);
    roofSign(g, '📺 친구모아 방송국', 6, h + 1, 0, '#2f4b6e', '#ffd84a');
    g.userData.board = board;
    return g;
  };
  // 대성당
  BLD.cathedral = (p) => {
    const g = new THREE.Group();
    const { w, d, h } = p.bld;
    g.add(B(w, h, d, 0xf6f0e8));
    const roof = mesh(geo('cathRoof', () => { const s = new THREE.Shape(); s.moveTo(-w / 2 - 0.6, 0); s.lineTo(0, 6); s.lineTo(w / 2 + 0.6, 0); s.lineTo(-w / 2 - 0.6, 0); const e = new THREE.ExtrudeGeometry(s, { depth: d + 0.6, bevelEnabled: false }); e.translate(0, 0, -(d + 0.6) / 2); return e; }), mat(0x8a6aa8), 0, h, 0);
    g.add(roof);
    const dome = mesh(geo('dome', () => new THREE.SphereGeometry(5.5, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2)), mat(0xe8dcc8), 0, h + 3, -4); g.add(dome);
    g.add(mesh(cyl(0.5, 0.2, 2.5), mat(0xffd23a), 0, h + 9.5, -4));
    // 종탑
    const t = new THREE.Group(); t.position.set(w / 2 + 3, 0, 7);
    t.add(B(4, 20, 4, 0xf1e8dc));
    t.add(mesh(geo('towerTop', () => new THREE.ConeGeometry(3.2, 5, 4)), mat(0x8a6aa8), 0, 22.5, 0).rotateY(Math.PI / 4));
    const hole = mesh(box(2.6, 3, 4.2, 0.1), mat(0x3a2a40), 0, 16.5, 0); t.add(hole);
    const bell = mesh(lathe('bell', [[0.0001, 0.9], [0.3, 0.85], [0.45, 0.4], [0.7, 0]], 18), mat(0xd9b44a), 0, 16.2, 0); t.add(bell);
    g.add(t);
    g.userData.bellTower = { x: w / 2 + 3, y: 16, z: 7 };
    // 스테인드글라스
    const sg = new THREE.Mesh(new THREE.CircleGeometry(3, 32), new THREE.MeshBasicMaterial({ map: stainedTex() })); sg.position.set(0, h - 3.5, d / 2 + 0.05); sg.userData.noBake = true; g.add(sg);
    for (const x of [-6.5, 6.5]) { const s2 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4), new THREE.MeshBasicMaterial({ map: stainedTex() })); s2.position.set(x, 5, d / 2 + 0.05); s2.userData.noBake = true; g.add(s2); }
    const arch = mesh(geo('archDoor', () => { const s = new THREE.Shape(); s.moveTo(-1.6, 0); s.lineTo(-1.6, 3); s.absarc(0, 3, 1.6, Math.PI, 0, true); s.lineTo(1.6, 0); s.lineTo(-1.6, 0); return new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false }); }), mat(0x6a4028), 0, 0, d / 2 - 0.1); g.add(arch);
    roofSign(g, '⛪ 축복의 마블 대성당', 8, h + 7, d / 2 + 0.4, '#ffffff', '#8a6aa8');
    return g;
  };
  BLD.observatory = (p) => {
    const g = new THREE.Group();
    g.add(mesh(cyl(6.5, 7, 6, 32), mat(0xf1eee8), 0, 3, 0));
    const dome = mesh(geo('obsDome', () => new THREE.SphereGeometry(6.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)), mat(0xdfe6f0), 0, 6, 0); g.add(dome);
    g.add(mesh(box(1.4, 6, 1, 0.1), mat(0x2b2b30), 0, 9, 2.2).rotateX(-0.6));
    const tel = mesh(cyl(0.6, 0.8, 5), mat(0xffffff), 0, 11, 3.5); tel.rotation.x = -0.9; g.add(tel);
    door(g, 0, 6.6, 1.6, 2.4, 0x3a4466);
    roofSign(g, '🔭 별빛 천문대', 6, 2.6 + 0.4, 6.95, '#1c2240', '#ffd84a');
    return g;
  };
  BLD.skyscraper = (p) => {
    const g = new THREE.Group();
    const { w, d, h } = p.bld;
    g.add(glassFacade(w, h, d, 'sky', 6, 26, 0.45, 0xb8c8ff));
    g.add(mesh(box(w + 1, 1, d + 1, 0.2), mat(0x2a2a3a), 0, h + 0.5, 0));
    const ring = mesh(geo('skyRing', () => new THREE.TorusGeometry(w * 0.72, 0.25, 8, 40)), glowMat(0xb48cff), 0, h + 1.5, 0); ring.rotation.x = Math.PI / 2; ring.userData.noBake = true; g.add(ring);
    g.add(mesh(cyl(0.2, 0.2, 8), mat(0x9aa3ad), 0, h + 5, 0));
    const s = sign('✨ NEBULA 80F 스카이라운지', 10, 2.2, '#1a1a2a', '#e8d4ff', '#b48cff'); s.position.set(0, h - 3, d / 2 + 0.1); g.add(s);
    door(g, 0, d / 2 + 0.05, 2.4, 2.8, 0x2a2a3a);
    const lobby = sign('▲ 80F 직행 엘리베이터', 4, 0.8, '#2a2a3a', '#ffffff'); lobby.position.set(0, 3.3, d / 2 + 0.1); g.add(lobby);
    return g;
  };
  BLD.mall = (p) => {
    const g = new THREE.Group();
    const { w, d, h } = p.bld;
    g.add(glassFacade(w, h, d, 'mall', 8, 4, 0.5, 0xfff0f8));
    for (let f = 1; f < 4; f++) g.add(mesh(box(w + 0.3, 0.3, d + 0.3, 0.05), mat(0xffffff), 0, f * 4, 0));
    const holo = sign('💎 PLATINUM TOWER · 한정판 SALE', w - 2, 3, '#ff3a9a', '#ffffff', '#ffffff'); holo.position.set(0, h - 2.5, d / 2 + 0.2); g.add(holo);
    door(g, 0, d / 2 + 0.05, 3, 2.8, 0xffffff);
    const salon = sign('✂️ 스타일 뷰티 살롱', 4, 1, '#14101f', '#ff8fd0'); salon.position.set(w / 2 - 2.5, 3.5, d / 2 + 0.2); g.add(salon);
    return g;
  };
  BLD.arcade = (p) => {
    const g = new THREE.Group();
    const { w, d, h } = p.bld;
    g.add(B(w, h, d, 0x2a1a4a));
    g.add(mesh(box(w + 0.4, 0.3, d + 0.4, 0.1), glowMat(0x39ffb0), 0, h, 0));
    const s = sign('🎮 NEON SPARK · 오락실 & 24시 볼링장', w - 1, 2.2, '#14101f', '#39ffb0', '#39ffb0'); s.position.set(0, h - 1.8, d / 2 + 0.1); g.add(s);
    const pin = new THREE.Group(); pin.position.set(w / 2 - 1.5, h, 0);
    pin.add(mesh(lathe('pin', [[0.0001, 0], [0.7, 0.1], [0.9, 1], [0.45, 2], [0.6, 2.6], [0.0001, 3]]), mat(0xffffff)));
    pin.add(mesh(geo('pinBand', () => new THREE.TorusGeometry(0.5, 0.08, 8, 20)), mat(0xff3a3a), 0, 2.05, 0).rotateX(Math.PI / 2));
    g.add(pin);
    door(g, 0, d / 2 + 0.05, 2.4, 2.6, 0xff3a9a);
    return g;
  };
  BLD.restaurant = (p) => {
    const g = new THREE.Group();
    const { w, d, h } = p.bld;
    const red = p.id === 'pub';
    g.add(B(w, h, d, p.bld.color || 0xf4e1c1));
    const roof = mesh(box(w + 1, 0.5, d + 1, 0.15), mat(red ? 0x6a1a1a : 0x3a4a6a), 0, h + 0.2, 0); g.add(roof);
    const noren = mesh(box(w - 2, 0.9, 0.06, 0.02), mat(red ? 0xffd84a : 0x2f4b6e), 0, h - 0.8, d / 2 + 0.05); g.add(noren);
    for (const x of [-w / 2 + 1, w / 2 - 1]) { const l = mesh(sphere(0.35), glowMat(0xff3a2a), x, h - 1, d / 2 + 0.5); l.scale.y = 1.3; l.userData.noBake = true; g.add(l); }
    door(g, 0, d / 2 + 0.05, 1.4, 2.2, red ? 0xc0392b : 0x8a5a3b);
    const s = sign(red ? '🥟 레트로 차이니스 펍' : '🍣 24시 회전초밥', w - 1, 1.2, red ? '#6a1a1a' : '#ffffff', red ? '#ffd84a' : '#2f4b6e'); s.position.set(0, h + 1, d / 2 + 0.2); g.add(s);
    return g;
  };
  BLD.club = (p) => {
    const g = new THREE.Group();
    const { w, d, h } = p.bld;
    g.add(B(w, h, d, 0x14101f));
    const s = sign('🎧 THE BASEMENT · 지하 클럽', w, 1.4, '#14101f', '#ff3a9a', '#ff3a9a'); s.position.set(0, h + 0.9, d / 2 + 0.1); g.add(s);
    for (let i = 0; i < 5; i++) g.add(mesh(box(2.2, 0.2, 0.6, 0.03), mat(0x55595f), 0, 0.1 - i * 0.05, d / 2 + 0.6 + i * 0.5));
    door(g, 0, d / 2 + 0.05, 1.6, 2.2, 0x3a2a70);
    g.add(mesh(box(w + 0.3, 0.15, d + 0.3, 0.05), glowMat(0xff3a9a), 0, h, 0));
    return g;
  };
  BLD.shop = (p) => {
    const g = new THREE.Group();
    const { w, d, h } = p.bld;
    g.add(B(w, h, d, 0xffffff));
    g.add(mesh(box(w + 0.1, 0.6, d + 0.1, 0.05), mat(p.bld.color || 0x7ad0a0), 0, h - 0.6, 0));
    g.add(mesh(box(w - 1.5, 2, 0.1, 0.03), glassMat(0xbfe8ff), 0, 1.3, d / 2 + 0.02));
    door(g, 1.8, d / 2 + 0.05, 1.2, 2.2, 0x7ad0a0);
    const s = sign('🏪 24시 편의점', w - 1, 1, '#7ad0a0', '#ffffff'); s.position.set(0, h + 0.6, d / 2 + 0.2); g.add(s);
    return g;
  };
  BLD.office = (p) => {
    const g = new THREE.Group();
    const { w, d, h } = p.bld;
    g.add(glassFacade(w, h, d, 'office', 8, 14, 0.35, 0xd8e8ff));
    // 옥상 휴게 테라스
    for (const [x, z] of [[-w / 2 + 0.3, 0], [w / 2 - 0.3, 0]]) g.add(mesh(box(0.1, 1, d, 0.03), glassMat(0xbfe8ff), x, h + 0.5, z));
    for (const z of [-d / 2 + 0.3, d / 2 - 0.3]) g.add(mesh(box(w, 1, 0.1, 0.03), glassMat(0xbfe8ff), 0, h + 0.5, z));
    for (const [x, z] of [[-4, -3], [4, 3], [-4, 3]]) { g.add(mesh(sphere(0.9), mat(0x4fae4a), x, h + 0.8, z)); }
    g.add(mesh(box(3, 0.1, 3, 0.03), mat(0xc99760), 3, h + 0.05, -3));
    const s = sign('🏢 메가 오피스 타워', 8, 2, '#2f4b6e', '#ffffff'); s.position.set(0, h - 3, d / 2 + 0.1); g.add(s);
    door(g, 0, d / 2 + 0.05, 2.4, 2.6, 0x2f4b6e);
    return g;
  };
  BLD.cityhall = (p) => {
    const g = new THREE.Group();
    const { w, d, h } = p.bld;
    g.add(B(w, h - 2, d, 0xf1eee8));
    g.add(mesh(box(w + 2, 0.6, d + 2, 0.1), mat(0xe0dcd4), 0, 0.3, 0));
    for (let i = 0; i < 7; i++) g.add(mesh(cyl(0.45, 0.5, h - 2.6, 18), mat(0xffffff), -w / 2 + 1.5 + i * (w - 3) / 6, (h - 2.6) / 2 + 0.6, d / 2 + 0.8));
    const ped = mesh(geo('pediment', () => { const s = new THREE.Shape(); s.moveTo(-w / 2 - 1, 0); s.lineTo(0, 3); s.lineTo(w / 2 + 1, 0); s.lineTo(-w / 2 - 1, 0); return new THREE.ExtrudeGeometry(s, { depth: 2.2, bevelEnabled: false }); }), mat(0xf6f0e8), 0, h - 2, d / 2 - 0.4);
    g.add(ped);
    g.add(mesh(box(w + 2, 0.4, 2.4, 0.05), mat(0xe8e2d8), 0, h - 2, d / 2 + 0.8));
    const s = sign('🏛️ 시티 행정 복합 센터 & 법원', w - 2, 1.4, '#f6f0e8', '#3b2b20'); s.position.set(0, h - 0.6, d / 2 + 1.85); g.add(s);
    door(g, 0, d / 2 + 0.05, 2.2, 2.8, 0x6a4028);
    return g;
  };
  BLD.hospital = (p) => {
    const g = new THREE.Group();
    const { w, d, h } = p.bld;
    g.add(glassFacade(w, h, d, 'hosp', 8, 5, 0.3, 0xffffff));
    const cross = new THREE.Group(); cross.position.set(0, h - 2.5, d / 2 + 0.2);
    cross.add(mesh(box(1, 3, 0.2, 0.05), glowMat(0xff3a3a))); cross.add(mesh(box(3, 1, 0.2, 0.05), glowMat(0xff3a3a)));
    g.add(cross);
    // 옥상 헬리포트
    g.add(mesh(cyl(5, 5, 0.2, 32), mat(0x55595f), 0, h + 0.1, 0));
    const hp = sign('H', 3, 3, '#55595f', '#ffffff'); hp.rotation.x = -Math.PI / 2; hp.position.set(0, h + 0.22, 0); g.add(hp);
    const s = sign('🏥 메디컬 센터 & 24시 약국', w - 2, 1.4, '#ffffff', '#ff3a3a'); s.position.set(0, 4, d / 2 + 0.2); g.add(s);
    door(g, 0, d / 2 + 0.05, 2.6, 2.6, 0x8fe3c0);
    return g;
  };
  BLD.library = (p) => {
    const g = new THREE.Group();
    const { w, d, h } = p.bld;
    const t = ctex('libwin', 256, 256, (c, W, Hh) => { c.fillStyle = '#e8eef5'; c.fillRect(0, 0, W, Hh); for (let r = 0; r < 3; r++) for (let i = 0; i < 16; i++) { c.fillStyle = ['#4f7fd0', '#d0604f', '#5fb070', '#d9b44a', '#9a5ad0'][(i + r) % 5]; c.fillRect(i * 16 + 2, r * 85 + 30, 10, 45); } c.strokeStyle = '#b0bcc8'; c.lineWidth = 4; for (let r = 0; r <= 3; r++) { c.beginPath(); c.moveTo(0, r * 85); c.lineTo(W, r * 85); c.stroke(); } });
    const bx = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), soften(new THREE.MeshLambertMaterial({ map: t })));
    bx.position.y = h / 2; bx.castShadow = true; g.add(bx);
    g.add(mesh(box(w + 1, 0.4, d + 1, 0.1), mat(0x6a4028), 0, h + 0.2, 0));
    const s = sign('📚 시립 도서관 & 힐링 북카페', w - 2, 1.4, '#6a4028', '#fff4d6'); s.position.set(0, h - 1, d / 2 + 0.1); g.add(s);
    door(g, 0, d / 2 + 0.05, 2, 2.6, 0x6a4028);
    return g;
  };
  BLD.workshop = (p) => {
    const g = new THREE.Group();
    const { w, d, h } = p.bld;
    g.add(B(w, h - 1.5, d, 0xc99760));
    const roof = mesh(geo('barnRoof', () => { const s = new THREE.Shape(); s.moveTo(-w / 2 - 0.5, 0); s.lineTo(0, 2.6); s.lineTo(w / 2 + 0.5, 0); s.lineTo(-w / 2 - 0.5, 0); const e = new THREE.ExtrudeGeometry(s, { depth: d + 0.8, bevelEnabled: false }); e.translate(0, 0, -(d + 0.8) / 2); return e; }), mat(0x8a3a2a), 0, h - 1.5, 0);
    g.add(roof);
    const s = sign('🔨 마을 공방 & 플리마켓', w - 1, 1.2, '#8a5a3b', '#fff4d6'); s.position.set(0, h - 2.2, d / 2 + 0.1); g.add(s);
    door(g, 0, d / 2 + 0.05, 2.2, 2.4, 0x6a4028);
    return g;
  };
  BLD.teahouse = (p) => {
    const g = new THREE.Group();
    const { w, d, h } = p.bld;
    g.add(B(w, h, d, 0x8a5a3b));
    const roof = mesh(box(w + 1.6, 0.4, d + 1.6, 0.2), mat(0x3a2a20), 0, h + 0.2, 0); g.add(roof);
    // 덩굴식물
    for (let i = 0; i < 14; i++) { const b2 = mesh(sphere(0.45), mat([0x3f8f3e, 0x4ea449, 0x62b85a][i % 3]), -w / 2 + Math.random() * w, 0.5 + Math.random() * h, d / 2 + 0.2); b2.scale.z = 0.5; g.add(b2); }
    const lan = mesh(sphere(0.35), glowMat(0xffb13d), w / 2 - 1, 2.8, d / 2 + 0.6); lan.userData.noBake = true; g.add(lan);
    const s = sign('🍵 달빛 차관', 4, 1, '#3a2a20', '#ffd84a'); s.position.set(0, h + 0.9, d / 2 + 0.3); g.add(s);
    door(g, 0, d / 2 + 0.05, 1.4, 2.2, 0x3a2a20);
    return g;
  };
  BLD.school = (p) => {
    const g = new THREE.Group();
    const { w, d, h } = p.bld;
    g.add(B(w, h, d, 0xfff4d6));
    g.add(mesh(box(w + 0.6, 0.5, d + 0.6, 0.1), mat(0xff8f6a), 0, h + 0.25, 0));
    const clock = mesh(cyl(0.8, 0.8, 0.2, 24), mat(0xffffff), 0, h - 1, d / 2 + 0.1); clock.rotation.x = Math.PI / 2; g.add(clock);
    g.add(mesh(cyl(0.06, 0.06, 5), mat(0x9aa3ad), w / 2 + 1.5, 2.5, d / 2));
    g.add(mesh(box(1.4, 0.9, 0.05, 0.02), mat(0x4fc1e9), w / 2 + 2.2, 4.5, d / 2));
    const s = sign('🎒 섬 어린이 학교', 5, 1, '#ff8f6a', '#ffffff'); s.position.set(0, h - 2.4, d / 2 + 0.1); g.add(s);
    door(g, 0, d / 2 + 0.05, 1.8, 2.3, 0x4fc1e9);
    return g;
  };
  BLD.terminal = (p) => {
    const g = new THREE.Group();
    const { w, d, h } = p.bld;
    g.add(B(w, h, d, 0xe8f4ff));
    g.add(mesh(box(w + 1, 0.4, d + 1, 0.1), mat(0x2f4b6e), 0, h, 0));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(w - 2, 2.6), new THREE.MeshBasicMaterial({ color: 0x222222 }));
    scr.position.set(0, h + 2, 0); scr.rotation.y = Math.PI; scr.userData.dyn = true; g.add(scr);
    g.add(mesh(box(w - 1.5, 3, 0.3, 0.05), mat(0x2b2b30), 0, h + 2, 0.2));
    const s = sign('⛴️ 페리 터미널', 5, 1, '#2f4b6e', '#ffffff'); s.position.set(0, h - 1, d / 2 + 0.1); g.add(s);
    door(g, 0, d / 2 + 0.05, 2, 2.4, 0x2f4b6e);
    g.userData.board = scr;
    return g;
  };
  // 빌라 외관 8종 테마
  const VILLA_THEMES = {
    glass: { name: '모던 글래스하우스', wall: 0xe8f4ff, roof: 0x55595f, flat: true, glass: true },
    log: { name: '스칸디나비아 통나무집', wall: 0xc98a4a, roof: 0x6a3a2a },
    hanok: { name: '전통 한옥', wall: 0xf6ead0, roof: 0x3a3a44, hanok: true },
    chalet: { name: '파스텔 핑크 샬레', wall: 0xffc6de, roof: 0xff6f9f },
    med: { name: '지중해 화이트 하우스', wall: 0xffffff, roof: 0x3a7bd5, flat: true },
    tree: { name: '트리하우스', wall: 0x8a5a3b, roof: 0x4fae4a, tree: true },
    castle: { name: '미니 캐슬', wall: 0xd8d4cc, roof: 0x8a6aa8, castle: true },
    container: { name: '컨테이너 하우스', wall: 0xff8a24, roof: 0x2f4b6e, flat: true },
  };
  PM.VILLA_THEMES = VILLA_THEMES;
  BLD.villa = (p, ext) => {
    const g = new THREE.Group();
    const { w, d, h } = p.bld;
    const th = VILLA_THEMES[ext] || VILLA_THEMES.log;
    const facing = p.plot ? p.plot.doorSide : 1;
    const inner = new THREE.Group(); if (facing < 0) inner.rotation.y = Math.PI; g.add(inner);
    if (th.tree) { inner.add(mesh(cyl(1.2, 1.6, 3.4), mat(0x8a5a3b), 0, 1.7, 0)); inner.add(mesh(box(w, h - 2, d, 0.2), mat(th.wall), 0, 3.4 + (h - 2) / 2, 0)); for (let i = 0; i < 6; i++) inner.add(mesh(sphere(2.4), mat(0x4fae4a), (i % 3 - 1) * 3, h + 2 + (i > 2 ? 1 : 0), (i > 2 ? -1 : 1) * 1.5)); }
    else inner.add(mesh(box(w, h - 1.5, d, 0.2), th.glass ? glassMat(0xbfe8ff) : mat(th.wall), 0, (h - 1.5) / 2, 0));
    if (th.glass) inner.add(mesh(box(w - 0.4, h - 1.6, d - 0.4, 0.1), mat(0xfff4e6), 0, (h - 1.5) / 2, 0));
    if (th.flat) inner.add(mesh(box(w + 0.6, 0.5, d + 0.6, 0.1), mat(th.roof), 0, h - 1.3, 0));
    else if (th.castle) { for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) { inner.add(mesh(cyl(0.9, 0.9, h + 1), mat(th.wall), x, (h + 1) / 2, z)); inner.add(mesh(geo('turret', () => new THREE.ConeGeometry(1.1, 2, 12)), mat(th.roof), x, h + 2, z)); } }
    else if (!th.tree) {
      const roof = mesh(geo('villaRoof' + w + d + (th.hanok ? 'h' : ''), () => { const s = new THREE.Shape(); const o = th.hanok ? 1.4 : 0.6; s.moveTo(-w / 2 - o, 0); if (th.hanok) s.quadraticCurveTo(-w / 4, 1.2, 0, 2.6); else s.lineTo(0, 2.8); if (th.hanok) s.quadraticCurveTo(w / 4, 1.2, w / 2 + o, 0); else s.lineTo(w / 2 + o, 0); s.lineTo(-w / 2 - o, 0); const e = new THREE.ExtrudeGeometry(s, { depth: d + 1, bevelEnabled: false }); e.translate(0, 0, -(d + 1) / 2); return e; }), mat(th.roof), 0, h - 1.5, 0);
      inner.add(roof);
    }
    const doorZ = d / 2 + 0.05;
    const dy = th.tree ? 3.4 : 0;
    const dr = mesh(box(1.3, 2.2, 0.15, 0.05), mat(0x6a4028), 0, dy + 1.1, doorZ); inner.add(dr);
    for (const x of [-w / 4 - 0.5, w / 4 + 0.5]) inner.add(mesh(box(1.4, 1.1, 0.12, 0.04), glowMat(0xfff1b0), x, dy + 1.8, doorZ));
    if (th.tree) { for (let i = 0; i < 6; i++) inner.add(mesh(box(1.2, 0.15, 0.5, 0.03), mat(0xc99760), 0, 0.5 + i * 0.55, doorZ + 3 - i * 0.5)); }
    // 우편함
    const mb = new THREE.Group(); mb.position.set(w / 2 + 1, 0, doorZ + 1.5);
    mb.add(mesh(cyl(0.06, 0.06, 1), mat(0x8a5a3b), 0, 0.5, 0)); mb.add(mesh(box(0.45, 0.35, 0.3, 0.08), mat(0xff6f61), 0, 1.1, 0));
    inner.add(mb);
    if (p.bld.player) { const s = sign('🏡 ' + (FM.Sim.get() ? FM.Sim.get().player.name : '플레이어') + '의 집', 4, 0.9, '#ffffff', '#3b2b20'); s.position.set(0, h + 0.8, doorZ); inner.add(s); }
    g.userData.theme = th.name;
    return g;
  };
  PM.building = function (p, ext) {
    const f = BLD[p.bld.type];
    const g = f ? f(p, ext) : B(p.bld.w, p.bld.h, p.bld.d, 0xdddddd);
    return g;
  };
  PM.BLD = BLD;

  // =========================================================
  // 야외 장식
  // =========================================================
  const DEC = {};
  // 3단 사자상 분수대
  DEC.fountain = () => {
    const g = new THREE.Group();
    g.add(mesh(lathe('fBase', [[0.0001, 0], [3.4, 0], [3.4, 0.7], [3.1, 0.75], [3.0, 0.3], [0.0001, 0.3]], 40), mat(0xf1eee8)));
    const water1 = new THREE.Mesh(new THREE.CircleGeometry(3, 40), new THREE.MeshPhongMaterial({ color: 0x6fd0f0, transparent: true, opacity: 0.8, shininess: 100 }));
    water1.rotation.x = -Math.PI / 2; water1.position.y = 0.6; water1.userData.noBake = true; water1.userData.water = true; g.add(water1);
    g.add(mesh(cyl(0.5, 0.7, 2.2), mat(0xf1eee8), 0, 1.4, 0));
    g.add(mesh(lathe('fMid', [[0.0001, 0], [1.8, 0], [1.9, 0.3], [0.0001, 0.3]], 32), mat(0xf1eee8), 0, 2.4, 0));
    g.add(mesh(cyl(0.3, 0.45, 1.2), mat(0xf1eee8), 0, 3.2, 0));
    g.add(mesh(lathe('fTop', [[0.0001, 0], [0.9, 0], [1, 0.25], [0.0001, 0.25]], 28), mat(0xf1eee8), 0, 3.8, 0));
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const lion = new THREE.Group(); lion.position.set(Math.cos(a) * 0.55, 1.9, Math.sin(a) * 0.55); lion.rotation.y = -a + Math.PI / 2; lion.add(mesh(sphere(0.28), mat(0xd9b44a))); lion.add(mesh(sphere(0.35), mat(0xc9a03a), 0, 0.02, -0.08)); g.add(lion); }
    const jet = mesh(cyl(0.08, 0.2, 1.4), new THREE.MeshPhongMaterial({ color: 0xbfefff, transparent: true, opacity: 0.6 }), 0, 4.7, 0); jet.userData.noBake = true; g.add(jet);
    return g;
  };
  DEC.lamp = () => {
    const g = new THREE.Group();
    g.add(mesh(cyl(0.08, 0.12, 3.2), mat(0x2b2b30), 0, 1.6, 0));
    g.add(mesh(puck(0.25, 0.15), mat(0x2b2b30)));
    const bulb = mesh(sphere(0.28), glowMat(0xfff1b0), 0, 3.35, 0); bulb.userData.noBake = true; bulb.userData.lampBulb = true; g.add(bulb);
    g.add(mesh(geo('lampCap', () => new THREE.ConeGeometry(0.4, 0.35, 8)), mat(0x2b2b30), 0, 3.7, 0));
    return g;
  };
  DEC.bench = () => { const g = new THREE.Group(); for (const p of FM.FURN.yard_bench.parts) g.add(partMesh(p)); return g; };
  DEC.cafeTable = () => { const g = new THREE.Group(); g.add(mesh(cyl(0.45, 0.45, 0.05), mat(0xffffff), 0, 0.74, 0)); g.add(mesh(cyl(0.04, 0.04, 0.72), mat(0x55595f), 0, 0.36, 0)); g.add(mesh(cyl(0.03, 0.03, 2.2), mat(0xdddddd), 0, 1.1, 0)); const um = mesh(geo('umb', () => new THREE.ConeGeometry(1.4, 0.6, 12)), mat(0xe74c3c), 0, 2.3, 0); g.add(um); return g; };
  DEC.chair = () => { const g = new THREE.Group(); g.add(mesh(box(0.5, 0.06, 0.5, 0.02), mat(0x55595f), 0, 0.45, 0)); g.add(mesh(box(0.5, 0.5, 0.05, 0.02), mat(0x55595f), 0, 0.7, -0.22)); for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) g.add(mesh(cyl(0.02, 0.02, 0.45), mat(0x55595f), x, 0.22, z)); return g; };
  DEC.sunbed = () => { const g = new THREE.Group(); const b = mesh(box(0.7, 0.1, 1.9, 0.03), mat(0xffffff), 0, 0.35, 0); g.add(b); const back = mesh(box(0.7, 0.08, 0.8, 0.03), mat(0xffffff), 0, 0.6, -0.8); back.rotation.x = 0.7; g.add(back); for (const s of [-1, 1]) g.add(mesh(box(0.05, 0.35, 1.8, 0.02), mat(0x9aa3ad), s * 0.32, 0.17, 0)); const par = new THREE.Group(); par.position.set(0.8, 0, -0.5); par.add(mesh(cyl(0.03, 0.03, 2.4), mat(0xffffff), 0, 1.2, 0)); par.add(mesh(geo('para', () => new THREE.ConeGeometry(1.3, 0.5, 10)), mat([0xff6f61, 0x4fc1e9, 0xffd84a][Math.random() * 3 | 0]), 0, 2.4, 0)); g.add(par); return g; };
  DEC.hammock = () => { const g = new THREE.Group(); for (const x of [-1.3, 1.3]) g.add(mesh(cyl(0.08, 0.1, 1.6), mat(0x8a5a3b), x, 0.8, 0)); const h = mesh(box(2.1, 0.06, 0.8, 0.03), mat(0xffd08a), 0, 0.75, 0); g.add(h); return g; };
  DEC.swing = () => { const g = new THREE.Group(); for (const x of [-1.6, 1.6]) { g.add(mesh(cyl(0.07, 0.07, 2.6), mat(0xff8f6a), x, 1.3, 0.4).rotateX(0.2)); g.add(mesh(cyl(0.07, 0.07, 2.6), mat(0xff8f6a), x, 1.3, -0.4).rotateX(-0.2)); } g.add(mesh(cyl(0.06, 0.06, 3.3), mat(0xff8f6a), 0, 2.5, 0).rotateZ(Math.PI / 2)); for (const x of [-0.7, 0.7]) { g.add(mesh(cyl(0.01, 0.01, 1.9), mat(0x9aa3ad), x - 0.2, 1.5, 0)); g.add(mesh(cyl(0.01, 0.01, 1.9), mat(0x9aa3ad), x + 0.2, 1.5, 0)); g.add(mesh(box(0.55, 0.06, 0.3, 0.02), mat(0xffd84a), x, 0.55, 0)); } return g; };
  DEC.boat = () => { const g = new THREE.Group(); const hull = mesh(lathe('hull', [[0.0001, 0], [0.7, 0.05], [0.9, 0.4], [0.0001, 0.4]], 16), mat(0xffffff), 0, 0, 0); hull.scale.set(1, 1, 2); g.add(hull); g.add(mesh(box(1.4, 0.06, 0.4, 0.02), mat(0xc99760), 0, 0.35, 0)); g.add(mesh(sphere(0.2), mat(0xff6f86), 0, 0.5, 1.4)); return g; };
  DEC.playground = () => { const g = new THREE.Group(); const sl = PM.furniture('mini_slide'); sl.scale.setScalar(1.8); sl.position.set(-2, 0, 0); g.add(sl); g.add(mesh(box(3, 0.2, 0.3, 0.05), mat(0x4fc1e9), 2, 0.5, 0).rotateZ(0.2)); g.add(mesh(cyl(0.2, 0.3, 0.5), mat(0x8a5a3b), 2, 0.25, 0)); const sand = mesh(box(3, 0.2, 3, 0.1), mat(0xf2d9a0), 0, 0.1, 3); g.add(sand);
    // 그네
    const post = mat(0xff8f6a), rope = mat(0xdddddd);
    for (const sx of [-1.1, 1.1]) for (const sz of [-0.5, 0.5]) { const pp = mesh(cyl(0.07, 0.07, 2.5), post, sx, 1.15, -3.2 + sz * 0.8); pp.rotation.x = -sz * 0.35; g.add(pp); }
    const bar = mesh(cyl(0.08, 0.08, 2.4), post, 0, 2.3, -3.2); bar.rotation.z = Math.PI / 2; g.add(bar);
    for (const sx of [-0.3, 0.3]) g.add(mesh(cyl(0.015, 0.015, 1.75), rope, sx, 1.42, -3.2));
    g.add(mesh(box(0.75, 0.06, 0.3, 0.02), mat(0x4fc1e9), 0, 0.55, -3.2));
    return g; };
  DEC.tent = (c = 0xff8f6a) => { const g = new THREE.Group(); g.add(mesh(geo('tent', () => new THREE.ConeGeometry(1.4, 1.8, 4)), mat(c), 0, 0.9, 0).rotateY(Math.PI / 4)); return g; };
  DEC.campfire = () => { const g = new THREE.Group(); for (let i = 0; i < 5; i++) { const l = mesh(cyl(0.08, 0.08, 0.8), mat(0x6a4028), 0, 0.15, 0); l.rotation.set(Math.PI / 2, 0, i / 5 * Math.PI); g.add(l); } const f = mesh(geo('fire', () => new THREE.ConeGeometry(0.35, 0.9, 8)), glowMat(0xff8a24), 0, 0.5, 0); f.userData.noBake = true; f.userData.fire = true; g.add(f); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.add(mesh(sphere(0.18), mat(0x9aa3ad), Math.cos(a) * 0.7, 0.08, Math.sin(a) * 0.7)); } return g; };
  DEC.telescope = () => { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const l = mesh(cyl(0.03, 0.03, 1.4), mat(0x55595f), 0, 0.65, 0); l.rotation.set(0.35 * Math.cos(i * 2.1), 0, 0.35 * Math.sin(i * 2.1)); g.add(l); } const t = mesh(cyl(0.08, 0.12, 1.1), mat(0xffffff), 0, 1.5, 0); t.rotation.x = -0.8; g.add(t); return g; };
  DEC.silverGrass = () => { const g = new THREE.Group(); for (let i = 0; i < 9; i++) { const s = mesh(cyl(0.015, 0.02, 1.2), mat(0xc9b88a), (Math.random() - 0.5) * 0.8, 0.6, (Math.random() - 0.5) * 0.8); s.rotation.z = (Math.random() - 0.5) * 0.3; g.add(s); const tuft = mesh(sphere(0.12), mat(0xf6ecd0), s.position.x, 1.25, s.position.z); tuft.scale.y = 2; g.add(tuft); } return g; };
  DEC.pocha = () => { const g = new THREE.Group(); for (const [x, z] of [[-2.4, -1.4], [2.4, -1.4], [-2.4, 1.4], [2.4, 1.4]]) g.add(mesh(cyl(0.06, 0.06, 2.4), mat(0x8a5a3b), x, 1.2, z)); const roof = mesh(box(5.2, 0.12, 3.2, 0.05), mat(0xe74c3c), 0, 2.45, 0); g.add(roof); g.add(mesh(box(4, 0.9, 0.7, 0.05), mat(0xc99760), 0, 0.45, -0.8)); for (const x of [-1.8, 0, 1.8]) { const l = mesh(sphere(0.2), glowMat(0xff3a2a), x, 2.2, 1.5); l.userData.noBake = true; g.add(l); } for (const x of [-1.5, 0, 1.5]) g.add(mesh(cyl(0.2, 0.2, 0.45), mat(0xff6f61), x, 0.22, 0.2)); const s = sign('포장마차 🍜', 2.4, 0.5, '#e74c3c', '#ffffff'); s.position.set(0, 2.1, 1.62); g.add(s); return g; };
  DEC.stall = () => PM.furniture('sale_table');
  DEC.soapbox = () => { const g = new THREE.Group(); g.add(mesh(box(0.9, 0.5, 0.7, 0.03), mat(0xc98a4a), 0, 0.25, 0)); const s = sign('🍎 사과', 0.7, 0.25, '#c98a4a', '#ffffff'); s.position.set(0, 0.3, 0.36); g.add(s); return g; };
  DEC.lighthouse = () => { const g = new THREE.Group(); g.add(mesh(cyl(1.6, 2.2, 12, 24), mat(0xffffff), 0, 6, 0)); for (let i = 0; i < 3; i++) g.add(mesh(cyl(1.62 + 0.15 * (2 - i), 1.7 + 0.15 * (2 - i), 1.2, 24), mat(0xe74c3c), 0, 2 + i * 3.6, 0)); g.add(mesh(cyl(1.4, 1.4, 1.6, 16), glassMat(0xfff1b0), 0, 12.8, 0)); const beam = mesh(sphere(0.6), glowMat(0xfff1b0), 0, 12.8, 0); beam.userData.noBake = true; beam.userData.lampBulb = true; g.add(beam); g.add(mesh(geo('lhRoof', () => new THREE.ConeGeometry(1.8, 1.6, 16)), mat(0xe74c3c), 0, 14.4, 0)); return g; };
  DEC.ferryBoat = () => { const g = new THREE.Group(); const hull = mesh(box(4, 1.4, 10, 0.5), mat(0xffffff), 0, 0.3, 0); g.add(hull); g.add(mesh(box(4.1, 0.3, 10.1, 0.1), mat(0x2f4b6e), 0, -0.2, 0)); g.add(mesh(box(3, 1.8, 4, 0.2), mat(0xe8f4ff), 0, 1.9, -1)); g.add(mesh(cyl(0.3, 0.3, 1.2), mat(0xe74c3c), 0, 3.2, -1)); return g; };
  DEC.pierDeck = (w, d) => mesh(box(w, 0.3, d, 0.05), mat(0xc99760), 0, 0, 0);
  DEC.mailbox = () => { const g = new THREE.Group(); g.add(mesh(cyl(0.06, 0.06, 1), mat(0x8a5a3b), 0, 0.5, 0)); g.add(mesh(box(0.5, 0.4, 0.35, 0.1), mat(0xff6f61), 0, 1.1, 0)); return g; };
  DEC.arch = () => { const g = new THREE.Group(); const a = mesh(geo('wedArch', () => new THREE.TorusGeometry(2.4, 0.18, 10, 32, Math.PI)), mat(0xffffff), 0, 0, 0); g.add(a); for (let i = 0; i < 22; i++) { const t = i / 21 * Math.PI; g.add(mesh(sphere(0.25), mat([0xff8fb1, 0xffffff, 0xffd6e0][i % 3]), Math.cos(t) * 2.4, Math.sin(t) * 2.4, 0.1)); } return g; };
  DEC.cone = () => { const g = new THREE.Group(); g.add(mesh(geo('cone1', () => new THREE.ConeGeometry(0.25, 0.7, 12)), mat(0xff6a2a), 0, 0.35, 0)); return g; };
  DEC.car = (c) => { const g = new THREE.Group(); g.add(mesh(box(1.8, 0.7, 3.6, 0.3), mat(c), 0, 0.6, 0)); g.add(mesh(box(1.6, 0.6, 1.9, 0.25), glassMat(0xbfe8ff), 0, 1.2, -0.2)); for (const [x, z] of [[-0.85, -1.1], [0.85, -1.1], [-0.85, 1.1], [0.85, 1.1]]) g.add(mesh(cyl(0.32, 0.32, 0.25), mat(0x2b2b30), x, 0.32, z).rotateZ(Math.PI / 2)); return g; };
  DEC.goal = () => PM.furniture('mini_goal');
  PM.decor = (k, ...a) => (DEC[k] ? DEC[k](...a) : new THREE.Group());
  PM.DEC = DEC;
})();
