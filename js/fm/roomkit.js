/* =========================================================
 *  주민 방 스타일 키트 — 레퍼런스(동물의 숲 감성) 5가지 스타일
 *   cottage : 초록 코티지 (로프트 침대 · 깅엄 소파 · 티피 텐트 · 쇼지 창 · 말린 꽃)
 *   aqua    : 아쿠아리움 밤 방 (수족관 벽 · 빛나는 덩굴 · 패치워크 침대 · 지구 러그 · 용암등)
 *   pink    : 핑크 로맨틱 (핑크 판벽 · 장미 벽지 · 체리 침대 · 에그 체어 · 도일리)
 *   garage  : 스포티 개러지 (블루 판벽 · 트로피장 · 자동차 침대 · 벤치프레스 · 전자 작업대)
 *   loft    : 콘크리트 로프트 (도시 전망 창 · 블랙 가죽 소파 · CRT TV · 기타 & 앰프)
 *  가구는 FM.FURN 에 build 함수로 등록 → 상점/배치/사용 모두 기존 시스템 그대로
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE, PM = FM.PM;
  const H = ISLE.M.h;
  const { mat, geo, sphere, box, cyl, capsule, mesh, soften } = H;
  const F = FM.FURN;
  const PI = Math.PI;
  const REV = 6;   // 스타일 방 구성 버전 (올라가면 손대지 않은 방은 새 구성으로 갱신)
  const css = PM.css;

  // ---------------------------------------------------------
  // 재질 · 텍스처
  // ---------------------------------------------------------
  const tcache = new Map();
  const tmat = (key, make, extra = {}) => { if (!tcache.has(key)) tcache.set(key, soften(new THREE.MeshLambertMaterial(Object.assign({ map: make() }, extra)))); return tcache.get(key); };
  const M = m => (typeof m === 'number' ? mat(m) : m);
  const glow = c => PM.glowMat(c);
  const glass = c => PM.glassMat(c);
  const ctex = (key, w, h, draw, rep) => PM.ctex('rk:' + key, w, h, draw, rep);

  const T = {};
  T.gingham = (c1, c2, n = 6) => tmat(`gingham${c1}${c2}${n}`, () => ctex(`gingham${c1}${c2}${n}`, 128, 128, (g, w, h) => {
    g.fillStyle = css(c1); g.fillRect(0, 0, w, h); const s = w / n / 2;
    g.fillStyle = css(c2) + '88'; for (let i = 0; i < w; i += s * 2) { g.fillRect(i, 0, s, h); g.fillRect(0, i, w, s); }
    g.fillStyle = css(c2) + '55'; for (let i = 0; i < w; i += s * 2) for (let j = 0; j < h; j += s * 2) g.fillRect(i, j, s, s);
  }));
  T.patch = (key, cols, motif) => tmat('patch' + key, () => ctex('patch' + key, 256, 256, (g, w, h) => {
    const n = 4, s = w / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const c = cols[(x * 3 + y * 5) % cols.length]; g.fillStyle = css(c); g.fillRect(x * s, y * s, s, s);
      g.fillStyle = 'rgba(255,255,255,0.45)'; const k = (x + y * 2) % 4;
      if (k === 0) for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(x * s + 10 + (i % 3) * 22, y * s + 10 + ((i / 3) | 0) * 22, 4, 0, 7); g.fill(); }
      else if (k === 1) { for (let i = 0; i < s; i += 12) { g.fillRect(x * s + i, y * s, 6, s); } }
      else if (k === 2 && motif) { g.font = '26px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(motif[(x + y) % motif.length], x * s + s / 2, y * s + s / 2); }
      g.strokeStyle = 'rgba(0,0,0,0.18)'; g.setLineDash([4, 3]); g.lineWidth = 2; g.strokeRect(x * s + 3, y * s + 3, s - 6, s - 6); g.setLineDash([]);
    }
  }));
  T.cherry = tmat('cherry', () => ctex('cherry', 256, 256, (g, w, h) => {
    g.fillStyle = '#fff4f4'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
      const cx = x * 52 + (y % 2) * 26 + 14, cy = y * 52 + 20;
      g.strokeStyle = '#6a9a4a'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 5, cy + 4); g.quadraticCurveTo(cx, cy - 10, cx + 4, cy - 12); g.moveTo(cx + 6, cy + 5); g.lineTo(cx + 4, cy - 12); g.stroke();
      g.fillStyle = '#e8435a'; for (const dx of [-5, 6]) { g.beginPath(); g.arc(cx + dx, cy + 6, 6, 0, 7); g.fill(); }
      g.fillStyle = '#ffffffaa'; g.beginPath(); g.arc(cx - 7, cy + 4, 1.8, 0, 7); g.fill();
    }
  }));
  T.leather = (c) => tmat('leather' + c, () => ctex('leather' + c, 128, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, css(c)); gr.addColorStop(0.5, css(shade(c, 1.25))); gr.addColorStop(1, css(c)); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 20; i++) { g.beginPath(); g.moveTo((i * 37) % w, (i * 23) % h); g.lineTo((i * 37) % w + 12, (i * 23) % h + 5); g.stroke(); }
  }), { });
  T.woodgrain = (c) => tmat('wg' + c, () => ctex('wg' + c, 128, 128, (g, w, h) => {
    g.fillStyle = css(c); g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,40,10,0.14)'; g.lineWidth = 1.2;
    for (let y = 4; y < h; y += 7) { g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.07 + y) * 1.6); g.stroke(); }
  }));
  T.screen = (kind) => new THREE.MeshBasicMaterial({ map: ctex('scr' + kind, 128, 96, (g, w, h) => {
    if (kind === 'pc') { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8fd6ff'); gr.addColorStop(1, '#e8f8ff'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#7ccf6a'; g.beginPath(); g.ellipse(40, h + 20, 70, 50, 0, 0, 7); g.fill(); g.fillStyle = '#5fb050'; g.beginPath(); g.ellipse(100, h + 30, 60, 50, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(4, 4, 10, 8); g.fillRect(4, 16, 10, 8); }
    else if (kind === 'tennis') { g.fillStyle = '#2f6fd0'; g.fillRect(0, 0, w, h); g.fillStyle = '#8fd3ff'; g.fillRect(14, 20, w - 28, h - 30); g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(20, 26, w - 40, h - 42); g.beginPath(); g.moveTo(20, h / 2 + 6); g.lineTo(w - 20, h / 2 + 6); g.stroke(); g.fillStyle = '#ffe14a'; g.beginPath(); g.arc(70, 40, 3, 0, 7); g.fill(); }
    else if (kind === 'field') { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9fd8ff'); gr.addColorStop(0.55, '#e8f6ff'); gr.addColorStop(0.56, '#7cc26a'); gr.addColorStop(1, '#5aa04a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#ff7a3a'; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc((i * 29) % w, h - 8 - (i % 3) * 8, 4, 0, 7); g.fill(); } }
    else if (kind === 'drama') { g.fillStyle = '#f4d8b0'; g.fillRect(0, 0, w, h); g.fillStyle = '#c98a4a'; g.fillRect(0, 0, 30, h); g.fillStyle = '#3a2a24'; g.beginPath(); g.arc(70, 34, 16, 0, 7); g.fill(); g.fillStyle = '#ffd8b8'; g.beginPath(); g.arc(70, 40, 12, 0, 7); g.fill(); g.fillStyle = '#ffd84a'; g.fillRect(52, 56, 36, 40); }
    else if (kind === 'crt') { g.fillStyle = '#2a3a4a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff6f61'; g.fillRect(20, 30, 20, 40); g.fillStyle = '#ffd84a'; g.fillRect(60, 36, 16, 34); g.fillStyle = '#fff'; g.fillRect(90, 30, 16, 40); g.fillStyle = 'rgba(255,255,255,0.08)'; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1); }
    else { g.fillStyle = '#222'; g.fillRect(0, 0, w, h); }
  }) });
  T.books = (key, cols) => tmat('books' + key, () => ctex('books' + key, 128, 64, (g, w, h) => {
    g.fillStyle = '#3a2a20'; g.fillRect(0, 0, w, h); let x = 0, i = 0;
    while (x < w) { const bw = 7 + (i * 7) % 8, bh = h - 4 - (i * 5) % 14; g.fillStyle = css(cols[i % cols.length]); g.fillRect(x, h - bh, bw, bh); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 1, h - bh + 5, bw - 2, 2); x += bw + 1; i++; }
  }));
  T.quiltPink = tmat('qpink', () => ctex('qpink', 128, 128, (g, w, h) => { g.fillStyle = '#ffb8c8'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff66'; for (let i = 0; i < w; i += 16) { g.fillRect(i, 0, 8, h); g.fillRect(0, i, w, 8); } }));
  T.floral = (bg, fl) => tmat('floral' + bg + fl, () => ctex('floral' + bg + fl, 128, 128, (g, w, h) => {
    g.fillStyle = css(bg); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 10; i++) { const x = (i * 47) % w, y = (i * 31) % h; g.fillStyle = css(fl); for (let k = 0; k < 5; k++) { const a = k / 5 * 7; g.beginPath(); g.arc(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 4, 0, 7); g.fill(); } g.fillStyle = '#ffe38a'; g.beginPath(); g.arc(x, y, 2.5, 0, 7); g.fill(); g.fillStyle = '#7fae7a'; g.beginPath(); g.ellipse(x + 9, y + 6, 5, 2.5, 0.6, 0, 7); g.fill(); }
  }));
  const shade = (c, k) => { const f = x => Math.min(255, Math.max(0, Math.round(x * k))); return (f((c >> 16) & 255) << 16) | (f((c >> 8) & 255) << 8) | f(c & 255); };
  const picMat = (key, draw) => new THREE.MeshBasicMaterial({ map: ctex('pic' + key, 128, 128, draw) });

  // ---------------------------------------------------------
  // 벽 텍스처 (st_*) — { tex, tileW: 가로 반복 폭(m), 0 이면 벽 전체에 한 장 }
  // ---------------------------------------------------------
  const WALLS = {
    shoji: { tileW: 1.0, draw: (g, w, h) => {   // 쇼지 창호 (나무 격자 + 빛나는 한지) + 아래 판벽
      g.fillStyle = '#fff6e2'; g.fillRect(0, 0, w, h);
      const gr = g.createRadialGradient(w / 2, h * 0.4, 10, w / 2, h * 0.4, h * 0.6); gr.addColorStop(0, 'rgba(255,255,240,0.9)'); gr.addColorStop(1, 'rgba(255,230,180,0.2)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#d9a86a'; for (let x = 0; x <= w; x += w / 4) g.fillRect(x - 3, 0, 6, h * 0.72); for (let y = 0; y <= h * 0.72; y += h * 0.72 / 6) g.fillRect(0, y - 3, w, 6);
      g.fillStyle = '#c98f55'; g.fillRect(0, 0, 12, h); g.fillRect(w - 12, 0, 12, h); g.fillRect(0, h * 0.72, w, 14);
      g.fillStyle = '#e8c490'; g.fillRect(0, h * 0.72 + 14, w, h); g.fillStyle = 'rgba(120,80,40,0.25)'; for (let x = 0; x < w; x += 32) g.fillRect(x, h * 0.72 + 14, 2, h);
    } },
    mustard: { tileW: 1.2, draw: (g, w, h) => {   // 머스터드 나무 무늬 벽지 (위) + 원목 기둥 판벽 (아래)
      g.fillStyle = '#f3e6c8'; g.fillRect(0, 0, w, h);
      for (let x = 32; x < w; x += 64) for (let y = 30; y < h * 0.7; y += 80) {
        g.strokeStyle = '#8a9a5a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y + 50); g.lineTo(x, y - 20); g.stroke();
        for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x, y + 30 - k * 14); g.lineTo(x - 12, y + 18 - k * 14); g.moveTo(x, y + 30 - k * 14); g.lineTo(x + 12, y + 18 - k * 14); g.stroke(); }
        g.fillStyle = '#e0b43a'; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(x + (k % 2 ? 12 : -12), y + 16 - (k >> 1) * 14, 5, 0, 7); g.fill(); }
      }
      g.fillStyle = '#d9a86a'; g.fillRect(0, h * 0.7, w, h * 0.3); g.fillStyle = '#c08a50'; g.fillRect(0, h * 0.7, w, 10); for (let x = 0; x < w; x += 42) g.fillRect(x, h * 0.7, 3, h);
    } },
    aquarium: { tileW: 0, draw: (g, w, h) => {   // 벽 전체 수족관 (산호 · 물고기 · 빛줄기)
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1d4f9a'); gr.addColorStop(0.6, '#15407e'); gr.addColorStop(1, '#0c2a58'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(160,220,255,0.12)'; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(i * 150 + 30, 0); g.lineTo(i * 150 + 90, 0); g.lineTo(i * 150 + 40, h * 0.8); g.lineTo(i * 150 - 20, h * 0.8); g.fill(); }
      g.fillStyle = '#0a2248'; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 30) g.lineTo(x, h * 0.84 + Math.sin(x * 0.02) * 16); g.lineTo(w, h); g.fill();
      const coral = ['#ff7a8a', '#ffb86a', '#c89aff', '#6ae0c0'];
      for (let i = 0; i < 16; i++) { const x = (i * 67) % w, y = h * 0.86; g.strokeStyle = coral[i % 4]; g.lineWidth = 5; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + k * 8, y - 30, x + k * 12, y - 50 - (i % 3) * 10); g.stroke(); } }
      for (let i = 0; i < 40; i++) { const x = (i * 97) % w, y = 40 + (i * 53) % (h * 0.7), s = 5 + (i % 4) * 3; g.fillStyle = ['#ffd84a', '#8fd8ff', '#ff9a6a', '#ffffff', '#6ae0ff'][i % 5]; g.beginPath(); g.ellipse(x, y, s * 1.6, s, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + s * 1.4, y); g.lineTo(x + s * 2.6, y - s * 0.8); g.lineTo(x + s * 2.6, y + s * 0.8); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 60; i++) { g.beginPath(); g.arc((i * 131) % w, (i * 71) % h, 1.5 + (i % 3), 0, 7); g.fill(); }
    }, w: 1024, h: 384 },
    tile: { tileW: 0.8, draw: (g, w, h) => { g.fillStyle = '#f4f8fa'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c8d6de'; g.lineWidth = 3; const s = w / 4; for (let x = 0; x <= w; x += s) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += s) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.fillStyle = 'rgba(255,255,255,0.5)'; for (let x = 0; x < w; x += s) for (let y = 0; y < h; y += s) g.fillRect(x + 6, y + 6, 10, 3); }, h: 768 },
    whiteplain: { tileW: 1.5, draw: (g, w, h) => { g.fillStyle = '#eef2f4'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.fillRect(0, h - 30, w, 30); } },
    pinkplank: { tileW: 1.2, draw: (g, w, h) => { g.fillStyle = '#f0b4b8'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 32) { g.fillStyle = `rgba(255,255,255,${0.06 + ((x / 32) % 3) * 0.04})`; g.fillRect(x, 0, 32, h); g.fillStyle = 'rgba(150,70,80,0.3)'; g.fillRect(x, 0, 2, h); } g.fillStyle = '#8a4a3a'; g.fillRect(0, h - 22, w, 22); } },
    rosepaper: { tileW: 1.2, draw: (g, w, h) => {   // 크림 장미 벽지 + 진한 원목 징두리
      g.fillStyle = '#fbeede'; g.fillRect(0, 0, w, h);
      for (let y = 20; y < h * 0.68; y += 48) for (let x = ((y / 48) % 2) * 32 + 16; x < w; x += 64) { g.fillStyle = 'rgba(220,120,130,0.45)'; for (let k = 0; k < 5; k++) { const a = k / 5 * 7; g.beginPath(); g.arc(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 3.4, 0, 7); g.fill(); } g.fillStyle = 'rgba(130,170,110,0.5)'; g.beginPath(); g.ellipse(x + 8, y + 6, 5, 2.5, 0.6, 0, 7); g.fill(); g.beginPath(); g.ellipse(x - 8, y + 5, 5, 2.5, -0.6, 0, 7); g.fill(); }
      g.fillStyle = '#6a3a26'; g.fillRect(0, h * 0.7, w, h * 0.3); g.fillStyle = '#8a4e34'; g.fillRect(0, h * 0.7, w, 12); for (let x = 0; x < w; x += 64) { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; g.strokeRect(x + 8, h * 0.76, 48, h * 0.18); }
    } },
    blueplank: { tileW: 1.2, draw: (g, w, h) => { g.fillStyle = '#6f8fd0'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 28) { g.fillStyle = `rgba(255,255,255,${0.04 + ((x / 28) % 3) * 0.04})`; g.fillRect(x, 0, 28, h); g.fillStyle = 'rgba(20,30,70,0.4)'; g.fillRect(x, 0, 2, h); } g.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 30; i++) g.fillRect((i * 53) % w, (i * 97) % h, 1, 30); } },
    concrete: { tileW: 1.8, draw: (g, w, h) => {   // 노출 콘크리트 (패널 줄눈 + 폼타이 구멍)
      g.fillStyle = '#a4a6aa'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${i % 2 ? 255 : 0},${i % 2 ? 255 : 0},${i % 2 ? 255 : 0},0.035)`; g.beginPath(); g.arc((i * 73) % w, (i * 151) % h, 6 + i % 20, 0, 7); g.fill(); }
      g.strokeStyle = 'rgba(60,60,64,0.35)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2); g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
      g.fillStyle = 'rgba(60,60,66,0.6)'; for (const y of [h * 0.25, h * 0.75]) for (const x of [w * 0.2, w * 0.8]) { g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); }
    } },
  };
  function wallTexture(kind) {
    const W = WALLS[kind]; if (!W) return null;
    const tex = ctex('wall_' + kind, W.w || 256, W.h || 384, W.draw);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return { tex, tileW: W.tileW };
  }

  // ---------------------------------------------------------
  // 빌더 헬퍼
  // ---------------------------------------------------------
  function K(g) {
    const add = o => { g.add(o); return o; };
    return {
      add,
      b: (w, h, d, m, x = 0, y = 0, z = 0, r) => add(mesh(box(w, h, d, r), M(m), x, y, z)),
      c: (rt, rb, h, m, x = 0, y = 0, z = 0, seg = 20) => add(mesh(cyl(rt, rb, h, seg), M(m), x, y, z)),
      s: (r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const o = add(mesh(sphere(r), M(m), x, y, z)); o.scale.set(sx, sy, sz); return o; },
      k: (r, len, m, x = 0, y = 0, z = 0) => add(mesh(capsule(r, len), M(m), x, y, z)),
      p: (w, h, m, x = 0, y = 0, z = 0) => add(mesh(geo(`rkpl${w},${h}`, () => new THREE.PlaneGeometry(w, h)), M(m), x, y, z, false)),
      t: (R, r, m, x = 0, y = 0, z = 0, arc = PI * 2) => add(mesh(geo(`rktor${R},${r},${arc}`, () => new THREE.TorusGeometry(R, r, 8, 28, arc)), M(m), x, y, z)),
      cone: (r, h, m, x = 0, y = 0, z = 0, seg = 16) => add(mesh(geo(`rkcone${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg)), M(m), x, y, z)),
      disc: (r, m, x = 0, y = 0, z = 0) => { const o = add(mesh(geo(`rkdisc${r}`, () => new THREE.CircleGeometry(r, 36)), M(m), x, y, z, false)); o.rotation.x = -PI / 2; return o; },
    };
  }
  // 작은 소품
  const P = {
    plant(k, x, y, z, s = 1, pot = 0xf4f0ea, leaf = 0x5fae5a) { k.c(0.09 * s, 0.07 * s, 0.14 * s, pot, x, y + 0.07 * s, z); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; const l = k.s(0.07 * s, leaf, x + Math.cos(a) * 0.07 * s, y + 0.2 * s + (i % 2) * 0.05 * s, z + Math.sin(a) * 0.07 * s, 0.7, 1.4, 0.7); l.rotation.z = Math.cos(a) * 0.5; l.rotation.x = Math.sin(a) * 0.5; } },
    mug(k, x, y, z, c = 0xffffff) { k.c(0.05, 0.045, 0.1, c, x, y + 0.05, z); k.t(0.03, 0.01, c, x + 0.05, y + 0.05, z); },
    book(k, x, y, z, c, rot = 0) { const b = k.b(0.05, 0.22, 0.16, c, x, y + 0.11, z, 0.01); b.rotation.z = rot; return b; },
    plush(k, x, y, z, c, ear = 'bear', s = 1) {
      k.s(0.13 * s, c, x, y + 0.13 * s, z, 1, 0.95, 0.9); k.s(0.12 * s, c, x, y + 0.33 * s, z + 0.01, 1.05, 0.95, 0.95);
      if (ear === 'bunny') { for (const sx of [-1, 1]) { const e = k.k(0.035 * s, 0.14 * s, c, x + sx * 0.05 * s, y + 0.5 * s, z); e.rotation.z = -sx * 0.2; } }
      else for (const sx of [-1, 1]) k.s(0.045 * s, c, x + sx * 0.09 * s, y + 0.43 * s, z);
      k.s(0.045 * s, 0xfff4e6, x, y + 0.3 * s, z + 0.1 * s, 1, 0.8, 0.6);
      for (const sx of [-1, 1]) k.s(0.014 * s, 0x2b201c, x + sx * 0.045 * s, y + 0.35 * s, z + 0.105 * s);
    },
  };

  // ---------------------------------------------------------
  // 가구 등록
  // ---------------------------------------------------------
  const def = (id, name, layer, price, w, d, build, extra = {}) => { F[id] = Object.assign({ id, name, layer, price, w, d, parts: [], build, kit: true }, extra); };
  const WOOD = 0xe0b07a, WOOD2 = 0xc99060, GREEN = 0x7fb05a, GREEN2 = 0x5f9a4a;

  // ===================== 1. 초록 코티지 =====================
  def('k_loftbed', '원목 로프트 침대', 'rest', 5200, 2.3, 1.3, g => {
    const k = K(g), wd = T.woodgrain(WOOD);
    for (const x of [-1.1, 1.1]) for (const z of [-0.58, 0.58]) k.b(0.09, 2.0, 0.09, wd, x, 1.0, z, 0.02);
    k.b(2.3, 0.1, 1.25, wd, 0, 1.38, 0, 0.02);                            // 침대 바닥
    k.b(2.1, 0.14, 1.1, T.gingham(0xe4f0c8, GREEN), 0, 1.5, 0, 0.05);   // 매트리스
    k.b(0.55, 0.12, 0.8, 0xfffdf4, -0.72, 1.62, 0, 0.05);                   // 베개
    k.b(1.3, 0.1, 1.12, T.gingham(0xcfe6a8, GREEN2), 0.35, 1.61, 0, 0.05); // 이불
    for (const z of [-0.6, 0.6]) { k.b(2.3, 0.06, 0.05, wd, 0, 1.78, z, 0.01); for (let x = -1.0; x <= 1.0; x += 0.25) k.b(0.04, 0.34, 0.04, wd, x, 1.6, z, 0.01); }
    k.b(0.05, 0.34, 1.2, wd, -1.12, 1.6, 0, 0.01);
    // 사다리
    for (const x of [0.62, 0.95]) k.b(0.05, 1.8, 0.05, wd, x, 0.9, 0.66, 0.01);
    for (let y = 0.25; y < 1.8; y += 0.3) k.b(0.34, 0.04, 0.05, wd, 0.785, y, 0.66, 0.01);
    // 아래 책상 + 컴퓨터 + 책장
    k.b(1.5, 0.06, 0.65, wd, -0.35, 0.75, -0.2, 0.02);
    k.b(0.05, 0.72, 0.62, wd, -1.05, 0.37, -0.2, 0.01);
    k.b(1.45, 0.62, 0.04, T.gingham(0xd8ecb8, GREEN), -0.35, 0.4, -0.52, 0.01);
    k.b(0.46, 0.34, 0.05, 0x3a3a44, -0.45, 1.02, -0.35, 0.02); k.p(0.4, 0.28, T.screen('pc'), -0.45, 1.03, -0.32);
    k.b(0.06, 0.1, 0.06, 0x9aa3ad, -0.45, 0.82, -0.35); k.b(0.36, 0.02, 0.12, 0xf4f4f4, -0.45, 0.79, -0.1, 0.005);
    k.b(0.18, 0.4, 0.4, 0xe8e8ec, -0.95, 0.99, -0.25, 0.02);
    k.b(0.5, 0.5, 0.3, wd, 0.35, 1.03, -0.4, 0.02); k.b(0.44, 0.2, 0.26, T.books('ct', [0xc0392b, 0x2f6b3a, 0x3a5a8a, 0xe8c070]), 0.35, 1.13, -0.36, 0.01);
    k.c(0.09, 0.09, 0.02, 0xffffff, 0.35, 0.9, -0.24).rotation.x = PI / 2; k.t(0.09, 0.012, 0x6a4a2a, 0.35, 0.9, -0.23);
  }, { grade: 2, bed: { top: 1.56, headZ: -0.42, color: 0xcfe6a8 }, use: [{ pose: 'sleep', dx: 0, dz: 0, face: 90, act: 'sleep' }, { pose: 'type', dx: -0.45, dz: 0.45, face: 180, act: 'type', seatH: 0.47 }], tags: ['bed', 'desk'] });

  def('k_gingham_sofa', '깅엄 러브시트', 'rest', 2400, 1.7, 0.85, g => {
    const k = K(g), wd = T.woodgrain(WOOD), gm = T.gingham(0xdcebc0, GREEN2, 5);
    for (const x of [-0.78, 0.78]) { k.b(0.1, 0.12, 0.8, wd, x, 0.62, 0, 0.03); for (const z of [-0.33, 0.33]) k.b(0.06, 0.62, 0.06, wd, x, 0.31, z, 0.02); }
    k.b(1.45, 0.12, 0.72, wd, 0, 0.3, 0, 0.02);
    for (const x of [-0.36, 0.36]) { k.b(0.7, 0.16, 0.66, gm, x, 0.44, 0.03, 0.07); const bk = k.b(0.7, 0.55, 0.16, gm, x, 0.78, -0.3, 0.07); bk.rotation.x = -0.12; k.s(0.022, 0x4a7a3a, x, 0.8, -0.21); }
  }, { use: [{ pose: 'sit', dx: -0.36, dz: 0.08, face: 0, act: 'sofa', seatH: 0.52 }, { pose: 'sit', dx: 0.36, dz: 0.08, face: 0, act: 'sofa', seatH: 0.52 }], tags: ['sofa'] });

  def('k_teepee', '노랑 티피 텐트', 'misc', 2200, 1.5, 1.5, g => {
    const k = K(g);
    const tent = k.add(mesh(geo('teepee', () => new THREE.ConeGeometry(0.8, 1.8, 6, 1, true)), new THREE.MeshLambertMaterial({ map: ctex('teepee', 256, 256, (c, w, h) => { c.fillStyle = '#ffe6a0'; c.fillRect(0, 0, w, h); c.fillStyle = '#9ad06a'; for (let y = 20; y < h * 0.55; y += 26) for (let x = ((y / 26) % 2) * 16; x < w; x += 32) { c.beginPath(); c.moveTo(x, y + 12); c.lineTo(x + 8, y); c.lineTo(x + 16, y + 12); c.fill(); } }), side: THREE.DoubleSide }), 0, 0.9, 0));
    for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; const p = k.c(0.018, 0.018, 0.5, WOOD2, Math.cos(a) * 0.08, 1.95, Math.sin(a) * 0.08); p.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); }
    k.b(0.36, 0.36, 0.05, 0x7fbf5a, 0, 0.9, 0.52, 0.04); k.b(0.28, 0.28, 0.06, 0xfff4c0, 0, 0.9, 0.53, 0.02); k.b(0.03, 0.28, 0.07, 0x7fbf5a, 0, 0.9, 0.54); k.b(0.28, 0.03, 0.07, 0x7fbf5a, 0, 0.9, 0.54);
    k.s(0.05, 0xe8605a, -0.3, 0.3, 0.6, 1, 1, 0.4); k.k(0.01, 0.12, 0x5fae5a, -0.3, 0.18, 0.62);
    k.b(0.5, 0.08, 0.4, GREEN, 0.25, 0.04, 0.55, 0.04);
  }, { tags: ['play'] });

  def('k_nightstand_rec', '초록 협탁 & 레코드 플레이어', 'smart', 1900, 0.8, 0.55, g => {
    const k = K(g), gr = T.woodgrain(0x8fc070);
    k.b(0.75, 0.62, 0.5, gr, 0, 0.35, 0, 0.03); for (const x of [-0.33, 0.33]) for (const z of [-0.2, 0.2]) k.b(0.05, 0.1, 0.05, gr, x, 0.02, z, 0.01);
    k.b(0.68, 0.14, 0.03, 0x7fb05a, 0, 0.55, 0.25, 0.02); k.s(0.018, 0xd9b44a, 0, 0.55, 0.27);
    k.b(0.6, 0.25, 0.04, T.books('ns', [0xc0392b, 0x3a5a8a, 0xe8c070, 0x2f6b3a]), 0, 0.28, 0.23, 0.01);
    k.b(0.56, 0.14, 0.42, 0xfaf4e8, 0, 0.73, 0, 0.03); k.c(0.15, 0.15, 0.015, 0x2b2b30, -0.05, 0.81, 0.02); k.c(0.05, 0.05, 0.02, 0x7fcf6a, -0.05, 0.82, 0.02);
    const lid = k.b(0.56, 0.3, 0.04, 0xe8705a, 0, 0.93, -0.22, 0.03); lid.rotation.x = -0.25; k.b(0.1, 0.02, 0.1, 0xd9d9d9, 0.18, 0.82, 0.05);
  }, { use: [{ pose: 'sway', dx: 0, dz: 0.75, face: 180, act: 'lp' }], tags: ['music'] });

  def('k_green_cabinet', '초록 찬장 & 주전자', 'work', 2100, 1.3, 0.55, g => {
    const k = K(g), gr = T.woodgrain(0x7fbf64);
    k.b(1.3, 0.5, 0.52, gr, 0, 0.45, 0, 0.03); k.b(1.36, 0.05, 0.58, 0x6aa850, 0, 0.72, 0, 0.02);
    for (const x of [-0.6, 0.6]) for (const z of [-0.22, 0.22]) k.b(0.06, 0.2, 0.06, 0x6aa850, x, 0.1, z, 0.02);
    k.b(0.4, 0.4, 0.03, 0x6aa850, -0.4, 0.45, 0.27, 0.02); for (let y = 0.33; y < 0.6; y += 0.06) k.b(0.34, 0.015, 0.02, 0x5a9a44, -0.4, y, 0.29);
    k.b(0.8, 0.02, 0.4, 0x6aa850, 0.25, 0.45, 0.02); P.plant(k, 0.3, 0.46, 0.05, 0.6, 0xf4f0ea, 0x6cc36a);
    for (let x = -0.05; x < 0.6; x += 0.12) k.s(0.03, 0xffffff, x, 0.23, 0.26 + 0.01);
    // 주전자
    k.s(0.13, 0x4a6a3a, 0.35, 0.86, 0, 1, 0.75, 1); k.c(0.03, 0.05, 0.05, 0x4a6a3a, 0.35, 0.98, 0); const sp = k.c(0.015, 0.03, 0.14, 0x4a6a3a, 0.49, 0.9, 0); sp.rotation.z = -0.8; k.t(0.08, 0.012, 0xa86a3a, 0.35, 1.02, 0, PI);
    // 배 분재
    k.c(0.07, 0.05, 0.06, 0x8a6a4a, -0.3, 0.77, 0); k.c(0.012, 0.012, 0.3, 0x6a4a2a, -0.3, 0.92, 0);
    for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; k.s(0.05, 0x6cae50, -0.3 + Math.cos(a) * 0.13, 1.05 + Math.sin(i) * 0.08, Math.sin(a) * 0.08, 1.2, 0.6, 1); k.s(0.028, 0xfff4d0, -0.3 + Math.cos(a) * 0.1, 1.0 + Math.cos(i) * 0.06, Math.sin(a) * 0.1); }
    k.b(0.9, 0.02, 0.45, T.gingham(0xf0f4d8, 0xa0c070), -0.1, 0.75, 0.02, 0.005);
  }, { use: [{ pose: 'cook', dx: 0, dz: 0.8, face: 180, act: 'tea' }], tags: ['kitchen'] });

  def('k_pouf', '초록 푸프 & 머그', 'rest', 600, 0.6, 0.6, g => { const k = K(g); k.c(0.26, 0.26, 0.4, T.woodgrain(0x6aa850), 0, 0.2, 0); k.s(0.26, 0x7cb45a, 0, 0.4, 0, 1, 0.18, 1); P.mug(k, 0.02, 0.43, 0, 0xffffff); },
    { use: [{ pose: 'sit', dx: 0, dz: 0, face: 0, act: 'sit', seatH: 0.44 }], tags: ['chair'] });
  def('k_stool_can', '원목 스툴 & 물뿌리개', 'rest', 500, 0.55, 0.55, g => {
    const k = K(g); k.c(0.24, 0.24, 0.06, 0x8fc070, 0, 0.42, 0); for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2; const l = k.c(0.022, 0.03, 0.42, WOOD, Math.cos(a) * 0.15, 0.2, Math.sin(a) * 0.15); l.rotation.set(Math.sin(a) * 0.15, 0, -Math.cos(a) * 0.15); }
    k.c(0.07, 0.08, 0.14, 0x7fbf64, 0.02, 0.52, 0); const sp = k.c(0.01, 0.015, 0.18, 0x7fbf64, 0.12, 0.56, 0); sp.rotation.z = -0.9; k.t(0.05, 0.01, 0x7fbf64, -0.04, 0.6, 0, PI);
  }, { tags: ['plant'] });
  def('k_cat_plush', '고양이 인형 방석', 'misc', 700, 0.7, 0.6, g => {
    const k = K(g); k.b(0.6, 0.1, 0.5, 0x9ac070, 0, 0.05, 0, 0.05);
    k.s(0.2, 0xf0a060, 0, 0.22, -0.02, 1.25, 0.8, 1); k.s(0.14, 0xf0a060, 0.02, 0.35, 0.16, 1.05, 0.95, 1);
    for (const sx of [-1, 1]) { const e = k.cone(0.05, 0.08, 0xf0a060, 0.02 + sx * 0.08, 0.48, 0.14); e.rotation.z = -sx * 0.3; }
    for (let i = 0; i < 3; i++) k.b(0.02, 0.05, 0.12, 0xc07038, -0.1 + i * 0.1, 0.36, -0.02, 0.01);
    k.s(0.05, 0xffffff, 0.02, 0.31, 0.27, 1, 0.8, 0.6); for (const sx of [-1, 1]) k.s(0.016, 0x2b201c, 0.02 + sx * 0.05, 0.37, 0.28);
    const t = k.k(0.03, 0.25, 0xf0a060, -0.25, 0.14, 0.05); t.rotation.z = 1.3;
  }, { tags: ['plush'], use: [{ pose: 'hug', dx: 0, dz: 0.6, face: 180, act: 'hug_doll' }] });
  def('k_rug_round_green', '초록 라탄 원형 러그', 'misc', 500, 1.6, 1.6, g => { const k = K(g); k.disc(0.8, 0x7fa860, 0, 0.012, 0); for (const r of [0.7, 0.55, 0.4, 0.25]) k.t(r, 0.012, 0x6a9450, 0, 0.014, 0).rotation.x = PI / 2; }, { flat: true });
  def('k_rug_gingham', '깅엄 체크 러그', 'misc', 500, 2, 1.5, g => { const k = K(g); k.b(2, 0.02, 1.5, T.gingham(0xf4f0c0, 0xa8c860, 8), 0, 0.01, 0, 0.005); k.b(2.04, 0.015, 0.06, 0xb8d080, 0, 0.01, 0.75, 0.005); k.b(2.04, 0.015, 0.06, 0xb8d080, 0, 0.01, -0.75, 0.005); }, { flat: true });
  def('k_papers', '흩어진 종이', 'misc', 100, 1.2, 0.8, g => { const k = K(g); for (let i = 0; i < 5; i++) { const p = k.b(0.3, 0.005, 0.22, i % 2 ? 0xfaf6ea : 0xe8f0d0, -0.4 + i * 0.2, 0.006 + i * 0.001, Math.sin(i * 3) * 0.2, 0.002); p.rotation.y = i * 0.7; } k.s(0.05, 0xf4f4f4, 0.35, 0.05, 0.25); }, { flat: true });
  def('k_old_tv_wood', '원목 레트로 TV', 'smart', 1600, 0.8, 0.7, g => {
    const k = K(g), wd = T.woodgrain(0x9a5a34); k.b(0.78, 0.7, 0.62, wd, 0, 0.35, 0, 0.04); k.b(0.5, 0.4, 0.04, 0xb8b8b0, -0.08, 0.42, 0.31, 0.04); k.p(0.44, 0.34, T.screen('crt'), -0.08, 0.42, 0.335);
    k.b(0.12, 0.4, 0.02, 0x6a3a1a, 0.27, 0.42, 0.315); k.b(0.08, 0.03, 0.02, 0x2b2b30, 0.27, 0.3, 0.33);
    P.plant(k, 0, 0.7, 0, 1.2, 0x3a8a8a, 0x3f9a4a);
  }, { use: [{ pose: 'sit', dx: 0, dz: 1.6, face: 180, act: 'watch_tv' }], tags: ['tv'] });
  def('k_hang_ivy', '행잉 아이비', 'wall', 500, 0.8, 0.3, g => {
    const k = K(g); k.c(0.12, 0.09, 0.14, 0xf4f0ea, 0, 2.35, 0.18); for (const a of [0, 2.1, 4.2]) { const r = k.c(0.004, 0.004, 0.5, 0x8a6a4a, Math.cos(a) * 0.08, 2.65, 0.18 + Math.sin(a) * 0.08); r.rotation.z = Math.cos(a) * 0.15; }
    for (let s = 0; s < 5; s++) for (let i = 0; i < 9; i++) k.s(0.045, i % 2 ? 0x5f9a4a : 0x78b858, -0.2 + s * 0.1 + Math.sin(i + s) * 0.03, 2.25 - i * 0.14 - s % 2 * 0.1, 0.2 + Math.cos(i) * 0.04, 1.2, 0.8, 0.6);
  }, { wall: true, tags: ['plant'] });
  def('k_dried_garland', '말린 꽃 가랜드', 'wall', 600, 1.6, 0.2, g => {
    const k = K(g); const rope = k.c(0.006, 0.006, 1.6, 0xb8946a, 0, 2.5, 0.08); rope.rotation.z = PI / 2;
    for (let i = 0; i < 5; i++) { const x = -0.64 + i * 0.32; k.b(0.02, 0.06, 0.015, 0xd9b88a, x, 2.47, 0.09, 0.005); for (let j = 0; j < 7; j++) k.s(0.03, [0xe8a060, 0xf0c070, 0xd08870, 0xa8b860][(i + j) % 4], x + Math.sin(j) * 0.05, 2.38 - j * 0.05, 0.09, 1, 0.8, 0.8); k.c(0.005, 0.005, 0.35, 0x8a9a5a, x, 2.28, 0.09); }
  }, { wall: true });
  def('k_noren', '머스터드 꽃무늬 노렌 창', 'wall', 900, 2.0, 0.2, g => {
    const k = K(g);
    k.b(1.8, 1.2, 0.04, 0xfff4d6, 0, 1.55, 0.02); const gl = k.p(1.7, 1.1, new THREE.MeshBasicMaterial({ color: 0xfff8e8 }), 0, 1.55, 0.045);
    for (let x = -0.85; x <= 0.86; x += 0.34) k.b(0.04, 1.2, 0.06, WOOD2, x, 1.55, 0.05); for (let y = 1.0; y <= 2.1; y += 0.28) k.b(1.8, 0.035, 0.06, WOOD2, 0, y, 0.05);
    const rod = k.c(0.018, 0.018, 2.0, 0x6a4a2a, 0, 2.3, 0.12); rod.rotation.z = PI / 2;
    const cm = tmat('noren', () => ctex('noren', 256, 128, (c, w, h) => { c.fillStyle = '#e8dcc0'; c.fillRect(0, 0, w, h); for (let x = 20; x < w; x += 42) { c.strokeStyle = '#7a8a4a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, h); c.lineTo(x, 20); c.stroke(); c.fillStyle = '#d9a83a'; for (let y = 24; y < h - 10; y += 16) { c.beginPath(); c.arc(x - 8, y, 5, 0, 7); c.arc(x + 8, y + 6, 5, 0, 7); c.fill(); } } }), { side: THREE.DoubleSide });
    for (let i = 0; i < 4; i++) { const p = k.b(0.46, 0.55, 0.012, cm, -0.72 + i * 0.48, 2.0, 0.13, 0.005); }
  }, { wall: true, tags: ['window'] });
  def('k_plush_shelf', '인형 선반', 'wall', 800, 0.9, 0.3, g => { const k = K(g); k.b(0.9, 0.05, 0.28, 0xfff0a0, 0, 1.75, 0.14, 0.01); k.b(0.9, 0.12, 0.02, 0xfff0a0, 0, 1.7, 0.28, 0.01); P.plush(k, -0.2, 1.78, 0.14, 0xffb8a0, 'bunny', 0.9); P.plush(k, 0.2, 1.78, 0.14, 0xfff0a0, 'bear', 0.9); k.b(0.1, 0.1, 0.03, 0x7fbf5a, -0.02, 1.72, 0.29); }, { wall: true, tags: ['plush'] });
  def('k_wall_books', '벽 선반 & 책', 'wall', 700, 0.9, 0.3, g => {
    const k = K(g); k.b(0.9, 0.04, 0.26, WOOD, 0, 1.9, 0.13, 0.01); for (const x of [-0.35, 0.35]) { const br = k.b(0.03, 0.2, 0.03, 0x3a3a3a, x, 1.8, 0.14, 0.005); br.rotation.x = 0.7; }
    [0x2f4b8e, 0x3a6a4a, 0xc0392b, 0x7fbf5a, 0x3a5a8a].forEach((c, i) => P.book(k, 0.05 + i * 0.07, 1.92, 0.13, c)); k.b(0.18, 0.24, 0.16, 0x7fbf5a, -0.25, 2.04, 0.13, 0.01);
  }, { wall: true, tags: ['books'] });
  def('k_geo_pendant', '기하학 우드 펜던트', 'light', 1100, 0.6, 0.6, g => {
    const k = K(g); k.c(0.006, 0.006, 0.5, 0x3a3a3a, 0, 2.75, 0); const lamp = k.add(mesh(geo('icosa', () => new THREE.IcosahedronGeometry(0.22, 0)), new THREE.MeshBasicMaterial({ color: 0xc08a50, wireframe: true }), 0, 2.35, 0)); k.s(0.07, glow(0xfff0c0), 0, 2.33, 0);
  }, { ceiling: true, tags: ['light'] });
  def('k_green_chair', '초록 원목 의자', 'rest', 500, 0.55, 0.55, g => {
    const k = K(g), gr = T.woodgrain(0x7fbf64); k.b(0.5, 0.06, 0.48, gr, 0, 0.45, 0, 0.02); for (const x of [-0.21, 0.21]) for (const z of [-0.2, 0.2]) k.b(0.05, 0.45, 0.05, gr, x, 0.22, z, 0.01);
    for (const x of [-0.21, 0.21]) k.b(0.05, 0.5, 0.05, gr, x, 0.72, -0.21, 0.01); for (const y of [0.62, 0.78, 0.94]) k.b(0.44, 0.06, 0.03, gr, 0, y, -0.21, 0.01);
  }, { use: [{ pose: 'sit', dx: 0, dz: 0.03, face: 0, act: 'sit', seatH: 0.48 }], tags: ['chair'] });
  def('k_anthurium', '안스리움 화분', 'misc', 600, 0.6, 0.6, g => { const k = K(g); k.b(0.6, 0.6, 0.5, T.woodgrain(0x8a5a34), 0, 0.3, 0, 0.03); k.c(0.16, 0.12, 0.2, 0x2a8a8a, 0, 0.7, 0); for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; const l = k.s(0.1, 0x3f8a4a, Math.cos(a) * 0.15, 0.95 + (i % 3) * 0.08, Math.sin(a) * 0.15, 1.1, 0.25, 0.7); l.rotation.set(Math.sin(a) * 0.6, a, 0.3); } k.s(0.05, 0xfff4e0, 0.1, 1.08, 0.05, 1, 1.3, 0.3); }, { tags: ['plant'] });

  // ===================== 2. 아쿠아리움 밤 방 =====================
  def('k_aqua_ledge', '창가 선반 (테라리움 · 별 조명)', 'work', 1800, 3.0, 0.5, g => {
    const k = K(g); k.b(3.0, 0.5, 0.45, 0xf0f4f8, 0, 0.25, 0, 0.03); k.b(3.04, 0.05, 0.5, 0xffffff, 0, 0.52, 0, 0.02);
    // 테라리움
    k.add(mesh(geo('terra', () => new THREE.CylinderGeometry(0.16, 0.18, 0.3, 6)), glass(0xdff4ff), 0.2, 0.7, 0)); k.cone(0.17, 0.16, 0x2b2b30, 0.2, 0.93, 0, 6).material = new THREE.MeshBasicMaterial({ color: 0x2b2b30, wireframe: true }); P.plant(k, 0.2, 0.56, 0, 0.8, 0x6a5a4a, 0x7fcf6a);
    // 별 조명 (모라비안 스타)
    const st = k.add(new THREE.Group()); st.position.set(-0.85, 0.85, 0.05); for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(geo('starspike', () => new THREE.ConeGeometry(0.06, 0.22, 4)), glow(0xe8f4ff)); const d = new THREE.Vector3(Math.sin(i * 2.4), Math.cos(i * 1.7), Math.sin(i * 1.1)).normalize(); s.position.copy(d.clone().multiplyScalar(0.1)); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); st.add(s); } st.add(new THREE.Mesh(sphere(0.1), glow(0xffffff)));
    // 별 벽시계
    k.b(0.3, 0.3, 0.04, 0xffffff, -1.3, 0.85, -0.18, 0.1).rotation.z = 0.3; k.b(0.1, 0.01, 0.01, 0x2b2b30, -1.3, 0.86, -0.15);
  }, { tags: ['window'] });
  def('k_tall_shelf_white', '화이트 사다리 선반', 'work', 1600, 0.9, 0.45, g => {
    const k = K(g); for (const x of [-0.42, 0.42]) k.b(0.04, 2.5, 0.42, 0xffffff, x, 1.25, 0, 0.01);
    const shelves = [0.1, 0.65, 1.15, 1.6, 2.0, 2.4]; shelves.forEach(y => k.b(0.84, 0.04, 0.4, 0xffffff, 0, y, 0, 0.01));
    k.b(0.76, 0.5, 0.36, 0xe8eef4, 0, 0.38, 0, 0.02); k.b(0.3, 0.2, 0.3, 0x8fc0e8, -0.15, 0.78, 0, 0.02); k.b(0.3, 0.2, 0.3, 0x8fc0e8, -0.15, 0.98, 0, 0.02);
    [0x3a5a8a, 0x8fb8e8, 0x5a7ab0].forEach((c, i) => P.book(k, 0.12 + i * 0.07, 0.67, 0, c));
    P.plush(k, -0.18, 1.17, 0, 0xf4f4ff, 'bunny', 0.8); P.plush(k, 0.18, 1.17, 0, 0xa8a0e8, 'bear', 0.8);
    k.c(0.07, 0.07, 0.14, 0x3a4a6a, -0.2, 1.69, 0); k.c(0.07, 0.07, 0.14, 0x9aa3ad, 0.0, 1.69, 0);
    P.plant(k, 0.2, 1.62, 0, 0.8); for (const x of [-0.15, 0.15]) { k.b(0.12, 0.12, 0.12, 0xffffff, x, 2.09, 0, 0.01); k.cone(0.1, 0.08, 0xffffff, x, 2.19, 0, 4).rotation.y = PI / 4; }
    P.plant(k, 0, 2.42, 0, 0.7);
  }, { tags: ['books'] });
  def('k_patch_bed', '패치워크 퀼트 침대', 'rest', 3200, 1.5, 2.3, g => {
    const k = K(g); k.b(1.5, 0.3, 2.25, 0xdfe8f0, 0, 0.18, 0, 0.04); k.b(1.42, 0.16, 2.15, 0xffffff, 0, 0.4, 0, 0.05);
    k.b(1.52, 0.14, 1.55, T.patch('blue', [0x8fb8ff, 0xfff0a0, 0xc8e0ff, 0x5a7ad0, 0xffffff, 0xa8d0f0], ['★', '●', '☁']), 0, 0.51, 0.3, 0.06);
    for (const x of [-0.36, 0.36]) k.b(0.6, 0.16, 0.36, T.patch('pil', [0x8fb8ff, 0xfff0a0, 0xc8e0ff]), x, 0.56, -0.8, 0.07);
  }, { grade: 2, bed: { top: 0.56, headZ: -0.49, color: 0xb8d0ff }, use: [{ pose: 'sleep', dx: 0, dz: 0, face: 0, act: 'sleep' }], tags: ['bed'] });
  def('k_rug_globe', '지구 원형 러그', 'misc', 900, 2, 2, g => { const k = K(g); k.disc(1.0, tmat('globe', () => ctex('globe', 256, 256, (c, w, h) => { c.fillStyle = '#1d3f8a'; c.beginPath(); c.arc(128, 128, 128, 0, 7); c.fill(); c.fillStyle = '#3a6ad0'; for (let i = 0; i < 14; i++) { c.beginPath(); c.ellipse((i * 67) % 220 + 18, (i * 41) % 220 + 18, 22 + i % 3 * 8, 12 + i % 4 * 6, i, 0, 7); c.fill(); } c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 5; c.beginPath(); c.arc(128, 128, 122, 0, 7); c.stroke(); }), { transparent: true }), 0, 0.012, 0); }, { flat: true });
  def('k_rug_fluffy_gray', '폭신 회색 러그', 'misc', 700, 2.2, 2.2, g => { const k = K(g); k.disc(1.1, 0xc8ccd4, 0, 0.011, 0); for (let i = 0; i < 40; i++) { const a = i / 40 * PI * 2; k.s(0.06, 0xd8dce2, Math.cos(a) * 1.07, 0.015, Math.sin(a) * 1.07, 1, 0.3, 1); } }, { flat: true });
  def('k_gaming_chair', '크림 게이밍 의자', 'rest', 1500, 0.7, 0.7, g => {
    const k = K(g); for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; const l = k.b(0.34, 0.04, 0.05, 0x2b2b30, Math.cos(a) * 0.16, 0.08, Math.sin(a) * 0.16, 0.02); l.rotation.y = -a; k.s(0.035, 0x2b2b30, Math.cos(a) * 0.32, 0.035, Math.sin(a) * 0.32); }
    k.c(0.03, 0.03, 0.35, 0x55595f, 0, 0.26, 0); k.b(0.55, 0.12, 0.52, 0xf4ecd8, 0, 0.48, 0, 0.06);
    const bk = k.b(0.52, 0.8, 0.14, 0xf4ecd8, 0, 0.92, -0.25, 0.08); bk.rotation.x = -0.12; k.b(0.3, 0.14, 0.1, 0xf4ecd8, 0, 1.38, -0.3, 0.05);
    for (const x of [-0.3, 0.3]) { k.b(0.06, 0.2, 0.06, 0x2b2b30, x, 0.62, 0, 0.02); k.b(0.08, 0.04, 0.3, 0x2b2b30, x, 0.73, 0.02, 0.02); }
  }, { use: [{ pose: 'type', dx: 0, dz: 0.02, face: 0, act: 'type', seatH: 0.55 }], tags: ['chair'] });
  def('k_white_desk_pc', '화이트 데스크 & PC', 'work', 2600, 1.5, 0.7, g => {
    const k = K(g); k.b(1.5, 0.05, 0.68, 0xffffff, 0, 0.75, 0, 0.02); for (const x of [-0.7, 0.7]) k.b(0.05, 0.74, 0.62, 0xf0f0f0, x, 0.37, 0, 0.01);
    k.b(0.4, 0.5, 0.6, 0xf0f4f8, 0.45, 0.25, 0, 0.02); k.b(0.44, 0.03, 0.62, 0xffffff, 0.45, 0.52, 0);
    k.b(0.54, 0.38, 0.05, 0xf4f4f4, -0.1, 1.08, -0.2, 0.02); k.p(0.48, 0.3, T.screen('pc'), -0.1, 1.09, -0.17); k.b(0.06, 0.12, 0.06, 0xf4f4f4, -0.1, 0.84, -0.2);
    for (const x of [-0.5, 0.3]) k.b(0.1, 0.18, 0.1, 0x9aa3ad, x, 0.87, -0.2, 0.03); k.b(0.4, 0.02, 0.14, 0xffffff, -0.1, 0.79, 0.05, 0.005);
    k.add(mesh(sphere(0.12), glass(0xe8f8ff), 0.55, 0.92, -0.1)); k.c(0.08, 0.1, 0.06, 0x8a6a4a, 0.55, 0.81, -0.1); k.s(0.05, 0xffa0c0, 0.55, 0.92, -0.1);
    k.b(0.5, 0.03, 0.2, 0xffffff, -0.3, 1.55, -0.24, 0.01); P.plant(k, -0.4, 1.57, -0.24, 0.7); k.c(0.06, 0.06, 0.12, 0x9aa3ad, -0.2, 1.62, -0.24);
  }, { use: [{ pose: 'type', dx: -0.1, dz: 0.7, face: 180, act: 'type', seatH: 0.55 }], tags: ['desk'] });
  def('k_lava_lamp', '용암등', 'light', 700, 0.4, 0.4, g => {
    const k = K(g); k.c(0.13, 0.17, 0.35, 0x3a4060, 0, 0.18, 0); k.add(mesh(lathe2('lava', [[0.08, 0], [0.13, 0.35], [0.09, 0.7]]), glass(0x8fe0c0), 0, 0.35, 0)); k.c(0.09, 0.13, 0.15, 0x3a4060, 0, 1.12, 0);
    for (const [y, r] of [[0.5, 0.06], [0.72, 0.045], [0.9, 0.05]]) k.s(r, glow(0xd8f070), 0, y, 0, 1, 1.3, 1);
  }, { tags: ['light'] });
  def('k_leaf_table', '잎사귀 사이드 테이블', 'work', 700, 0.7, 0.7, g => { const k = K(g); k.c(0.03, 0.03, 0.5, 0xdfe6ee, 0, 0.25, 0); k.c(0.2, 0.2, 0.02, 0xdfe6ee, 0, 0.01, 0); const t = k.s(0.35, 0x5fb050, 0, 0.52, 0, 1, 0.08, 0.8); k.c(0.08, 0.06, 0.1, 0x2b2b30, 0, 0.59, 0); for (let i = 0; i < 6; i++) k.cone(0.03, 0.12, 0x6aa870, Math.cos(i) * 0.05, 0.68, Math.sin(i) * 0.05); }, {});
  def('k_palm_pot', '야자수 화분', 'misc', 800, 0.7, 0.7, g => { const k = K(g); k.b(0.34, 0.4, 0.34, 0xffffff, 0, 0.2, 0, 0.03); k.c(0.03, 0.04, 0.6, 0x8a6a4a, 0, 0.7, 0); for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2; const l = k.s(0.3, 0x3f8a4a, Math.cos(a) * 0.25, 1.05 - (i % 2) * 0.05, Math.sin(a) * 0.25, 1.4, 0.06, 0.35); l.rotation.y = -a; l.rotation.z = 0.5; } }, { tags: ['plant'] });
  def('k_glow_vines', '빛나는 덩굴 가랜드', 'wall', 900, 2.2, 0.3, g => {
    const k = K(g); for (let s = 0; s < 3; s++) { const x0 = -1.0 + s * 1.0; for (let i = 0; i <= 8; i++) { const t = i / 8, x = x0 + t * 1.0 - 0.5 * 0, y = 2.85 - Math.sin(t * PI) * 0.35; k.s(0.035, 0x4a8a5a, x, y, 0.15, 1, 0.6, 1); } }
    for (let i = 0; i < 11; i++) { const x = -1.05 + i * 0.21, len = 0.4 + (i * 37 % 7) * 0.12; for (let j = 0; j < len / 0.1; j++) k.s(0.03, j % 3 === 2 ? glow(0xc8ffb0) : (j % 2 ? 0x6ab86a : 0x4a9a5a), x + Math.sin(j + i) * 0.02, 2.62 - j * 0.1, 0.16, 1.1, 0.7, 0.5); k.s(0.04, glow(0xb8f0ff), x, 2.6 - len, 0.16); }
  }, { wall: true, tags: ['plant', 'light'] });
  def('k_fish_school', '물고기 떼 장식', 'wall', 800, 1.2, 0.3, g => { const k = K(g); for (let i = 0; i < 6; i++) { const x = -0.45 + (i % 3) * 0.35, y = 1.6 + (i >> 1) % 3 * 0.25 + (i % 2) * 0.1; k.s(0.08, 0xffd84a, x, y, 0.15, 1, 1.1, 0.35); k.cone(0.06, 0.1, 0x2b2b30, x + 0.1, y, 0.15, 3).rotation.z = -PI / 2; k.b(0.02, 0.14, 0.2, 0x2b2b30, x - 0.02, y, 0.15, 0.005); } }, { wall: true });
  def('k_hang_terrarium', '행잉 테라리움', 'wall', 600, 0.5, 0.3, g => { const k = K(g); k.b(0.04, 0.04, 0.3, 0x2b2b30, 0, 2.3, 0.15); k.c(0.004, 0.004, 0.3, 0x2b2b30, 0, 2.12, 0.28); k.add(mesh(geo('hterra', () => new THREE.OctahedronGeometry(0.16, 0)), new THREE.MeshBasicMaterial({ color: 0x2b2b30, wireframe: true }), 0, 1.85, 0.28)); P.plant(k, 0, 1.75, 0.28, 0.6); }, { wall: true, tags: ['plant'] });

  // ===================== 3. 핑크 로맨틱 =====================
  def('k_white_window', '하얀 격자 창문', 'wall', 800, 1.3, 0.15, g => { const k = K(g); k.b(1.3, 1.1, 0.06, 0xffffff, 0, 1.6, 0.03, 0.02); k.p(1.14, 0.94, T.screen('field'), 0, 1.6, 0.065); k.b(0.05, 0.94, 0.08, 0xffffff, 0, 1.6, 0.07); k.b(1.14, 0.05, 0.08, 0xffffff, 0, 1.6, 0.07); k.b(1.4, 0.05, 0.14, 0xffffff, 0, 1.03, 0.07, 0.01); }, { wall: true, tags: ['window'] });
  def('k_fringe_lamp', '프릴 핑크 플로어 램프', 'light', 900, 0.5, 0.5, g => { const k = K(g); k.c(0.15, 0.17, 0.04, 0xff8fb1, 0, 0.02, 0); k.c(0.015, 0.015, 1.4, 0xff9ab8, 0, 0.72, 0); k.c(0.12, 0.22, 0.32, 0xffb8cc, 0, 1.5, 0); for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; k.b(0.02, 0.06, 0.01, 0xff9ab8, Math.cos(a) * 0.22, 1.31, Math.sin(a) * 0.22, 0.005); } k.s(0.06, glow(0xffe8f0), 0, 1.45, 0); }, { tags: ['light'] });
  def('k_phone_shelf', '전화기 책장', 'work', 900, 0.6, 0.4, g => { const k = K(g), wd = T.woodgrain(0xe8a888); k.b(0.6, 0.95, 0.38, wd, 0, 0.475, 0, 0.02); k.b(0.52, 0.4, 0.3, T.books('pk', [0xc0503a, 0xd08060, 0x8a4a3a, 0xe0b090]), 0, 0.3, 0.05, 0.01); k.b(0.52, 0.4, 0.3, 0xd89878, 0, 0.72, 0.05, 0.01); k.b(0.3, 0.12, 0.24, 0x9ab070, 0, 1.0, 0, 0.05); k.t(0.07, 0.02, 0x9ab070, 0, 1.08, 0.02).rotation.x = PI / 2 - 0.3; const h = k.k(0.03, 0.2, 0x9ab070, 0, 1.12, -0.05); h.rotation.z = PI / 2; }, { tags: ['books'] });
  def('k_cube_shelf', '원목 큐브 선반 & 백합', 'work', 1400, 1.3, 0.4, g => {
    const k = K(g), wd = T.woodgrain(0xd8a078); k.b(1.3, 0.62, 0.38, wd, 0, 0.31, 0, 0.02);
    for (const x of [-0.43, 0, 0.43]) k.b(0.38, 0.26, 0.32, 0xb88058, x, 0.18, 0.04, 0.01);
    k.b(0.24, 0.16, 0.2, 0xffd0d8, -0.43, 0.14, 0.05, 0.02); P.book(k, 0, 0.06, 0.05, 0xfff0e0); P.book(k, 0.06, 0.06, 0.05, 0xffc8c8); k.s(0.08, 0xe89a8a, 0.43, 0.15, 0.05, 1, 1.2, 1);
    k.c(0.06, 0.05, 0.32, 0xfff4e8, -0.3, 0.78, 0); for (let i = 0; i < 6; i++) { const a = i; k.cone(0.06, 0.14, 0xfff0f4, -0.3 + Math.cos(a) * 0.1, 1.05 + (i % 2) * 0.08, Math.sin(a) * 0.08).rotation.z = Math.cos(a) * 0.7; k.s(0.04, 0x6aa060, -0.3 + Math.cos(a) * 0.05, 0.98, Math.sin(a) * 0.05, 1, 2, 0.5); }
    // 유니콘 인형
    P.plush(k, 0.3, 0.62, 0, 0xffc8d4, 'bear', 1.0); k.cone(0.025, 0.12, 0xfff0a0, 0.3, 1.12, 0.05); k.s(0.06, 0xff8fa0, 0.23, 1.05, -0.05);
  }, { tags: ['books'] });
  def('k_egg_chair', '에그 체어', 'rest', 1900, 0.8, 0.8, g => {
    const k = K(g); for (const [x, z] of [[-0.2, 0.18], [0.2, 0.18], [0, -0.22]]) { const l = k.c(0.02, 0.025, 0.3, 0x8ab060, x, 0.13, z); l.rotation.set(z * 0.8, 0, -x * 0.8); }
    const shell = k.add(mesh(geo('eggshell', () => new THREE.SphereGeometry(0.42, 28, 20, 0, PI * 2, 0, PI * 0.72)), new THREE.MeshLambertMaterial({ color: 0xffb8a0, side: THREE.DoubleSide }), 0, 0.72, 0)); shell.rotation.x = -PI / 2 - 0.2; shell.scale.set(1, 1, 1.2);
    k.s(0.34, 0xfff0d8, 0, 0.42, 0.04, 1, 0.3, 1); k.s(0.18, 0xffe0c8, 0, 0.72, -0.22, 1.1, 1, 0.4); k.s(0.13, 0xd8a078, 0, 0.62, -0.1, 1, 1, 0.5);
  }, { use: [{ pose: 'sit', dx: 0, dz: 0.05, face: 0, act: 'sit', seatH: 0.48 }], tags: ['chair'] });
  def('k_patch_sofa', '패치워크 소파', 'rest', 2600, 1.8, 0.9, g => {
    const k = K(g), pm = T.patch('warm', [0xf4e0d0, 0xd8a8a0, 0xa87a6a, 0xfff4ea, 0xc88a8a, 0x8a6a5a], ['❀', '✿']);
    k.b(1.8, 0.4, 0.85, pm, 0, 0.28, 0, 0.08); k.b(1.8, 0.62, 0.3, pm, 0, 0.72, -0.28, 0.1); for (const x of [-0.82, 0.82]) k.b(0.2, 0.34, 0.8, pm, x, 0.58, 0.02, 0.08);
    for (const x of [-0.42, 0.42]) k.b(0.78, 0.12, 0.62, pm, x, 0.52, 0.08, 0.05);
  }, { use: [{ pose: 'sit', dx: -0.42, dz: 0.1, face: 0, act: 'sofa', seatH: 0.58 }, { pose: 'sit', dx: 0.42, dz: 0.1, face: 0, act: 'sofa', seatH: 0.58 }], tags: ['sofa'] });
  def('k_tea_table', '티포트 원형 테이블', 'work', 700, 0.6, 0.6, g => { const k = K(g); k.c(0.28, 0.28, 0.05, 0x8a9a5a, 0, 0.45, 0); for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2; const l = k.c(0.02, 0.025, 0.45, 0x8a9a5a, Math.cos(a) * 0.17, 0.22, Math.sin(a) * 0.17); l.rotation.set(Math.sin(a) * 0.15, 0, -Math.cos(a) * 0.15); } k.s(0.1, 0xfff4e8, 0.05, 0.56, 0, 1, 0.85, 1); k.s(0.11, T.floral(0xfff4e8, 0xd84a5a), 0.05, 0.6, 0, 1, 0.7, 1); k.s(0.03, 0xe84a6a, 0.05, 0.7, 0); P.mug(k, -0.15, 0.47, 0.08, 0xd08a60); }, { use: [{ pose: 'drink', dx: 0, dz: 0.55, face: 180, act: 'tea', seatH: 0.46 }], tags: ['table'] });
  def('k_cherry_bed', '체리 무늬 아이언 침대', 'rest', 3400, 1.3, 2.2, g => {
    const k = K(g); k.b(1.2, 0.26, 2.1, 0xffffff, 0, 0.3, 0, 0.04); k.b(1.25, 0.16, 1.5, T.cherry, 0, 0.48, 0.25, 0.06); k.b(1.27, 0.17, 0.3, T.gingham(0xffd0d8, 0xe86a80, 5), 0, 0.49, -0.45, 0.05); k.b(0.9, 0.16, 0.34, 0xffffff, 0, 0.55, -0.82, 0.07);
    for (const [z, hh] of [[-1.05, 1.05], [1.05, 0.75]]) { for (const x of [-0.6, 0.6]) { k.c(0.03, 0.03, hh, 0xfaf8f4, x, hh / 2, z); k.s(0.05, 0xfaf8f4, x, hh + 0.03, z); } const tb = k.c(0.025, 0.025, 1.2, 0xfaf8f4, 0, hh - 0.08, z); tb.rotation.z = PI / 2; for (let x = -0.45; x <= 0.46; x += 0.15) k.c(0.012, 0.012, hh - 0.4, 0xfaf8f4, x, 0.3 + (hh - 0.4) / 2, z); }
    P.plush(k, -0.35, 0.56, -0.85, 0xff8fb1, 'bear', 0.7);
  }, { grade: 2, bed: { top: 0.56, headZ: -0.44, color: 0xffd0d8 }, use: [{ pose: 'sleep', dx: 0, dz: 0, face: 0, act: 'sleep' }], tags: ['bed'] });
  def('k_nightstand_lamp', '화이트 협탁 & 프릴 램프', 'light', 900, 0.55, 0.45, g => { const k = K(g); k.b(0.5, 0.6, 0.42, 0xfaf6ee, 0, 0.3, 0, 0.03); k.b(0.44, 0.16, 0.02, 0xf0e8dc, 0, 0.45, 0.21, 0.02); k.s(0.02, 0xd9b44a, 0, 0.45, 0.23); k.c(0.06, 0.08, 0.2, 0xa08060, 0, 0.72, 0); k.c(0.1, 0.18, 0.2, 0xffd0dc, 0, 0.95, 0); for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; k.b(0.015, 0.05, 0.01, 0xffb0c4, Math.cos(a) * 0.18, 0.83, Math.sin(a) * 0.18, 0.004); } k.s(0.05, glow(0xfff0f0), 0, 0.9, 0); }, { tags: ['light'] });
  def('k_round_cloth_table', '깅엄 테이블보 원탁', 'work', 1100, 0.9, 0.9, g => { const k = K(g); k.add(mesh(lathe2('tcloth', [[0.42, 0], [0.43, 0.3], [0.4, 0.66], [0.001, 0.68]]), T.gingham(0xe8f0d8, 0x9ab880, 6), 0, 0.02, 0)); k.c(0.46, 0.46, 0.02, 0xffc8d4, 0, 0.7, 0); for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2 + 0.4; k.cone(0.12, 0.2, 0xffc8d4, Math.cos(a) * 0.4, 0.61, Math.sin(a) * 0.4, 3).rotation.x = PI; } const fr = k.b(0.3, 0.36, 0.03, 0xf4e8d8, 0.05, 0.9, 0, 0.01); fr.rotation.x = -0.2; k.p(0.22, 0.28, picMat('rose', (c, w, h) => { c.fillStyle = '#fffaf2'; c.fillRect(0, 0, w, h); c.fillStyle = '#e84a6a'; c.beginPath(); c.arc(64, 50, 20, 0, 7); c.fill(); c.strokeStyle = '#5a9a4a'; c.lineWidth = 4; c.beginPath(); c.moveTo(64, 70); c.lineTo(64, 120); c.stroke(); }), 0.05, 0.9, 0.02).rotation.x = -0.2; }, { use: [{ pose: 'eat', dx: 0, dz: 0.7, face: 180, act: 'eat', seatH: 0.46 }], tags: ['table'] });
  def('k_rug_fluffy_white', '폭신 화이트 러그', 'misc', 700, 2, 1.6, g => { const k = K(g); const d = k.disc(1.0, 0xfaf8f4, 0, 0.011, 0); d.scale.set(1, 0.8, 1); for (let i = 0; i < 36; i++) { const a = i / 36 * PI * 2; k.s(0.06, 0xffffff, Math.cos(a) * 0.98, 0.015, Math.sin(a) * 0.78, 1, 0.3, 1); } }, { flat: true });
  def('k_rug_woven_green', '올리브 라탄 러그', 'misc', 500, 1.6, 1.6, g => { const k = K(g); k.disc(0.8, 0xa8a860, 0, 0.012, 0); for (const r of [0.72, 0.58, 0.44, 0.3, 0.16]) k.t(r, 0.014, 0x8a8a48, 0, 0.014, 0).rotation.x = PI / 2; }, { flat: true });
  def('k_doily', '레이스 도일리 장식', 'wall', 400, 0.6, 0.1, g => { const k = K(g); k.c(0.28, 0.28, 0.01, 0xfff8ee, 0, 2.2, 0.02).rotation.x = PI / 2; for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2; k.c(0.05, 0.05, 0.012, 0xfff8ee, Math.cos(a) * 0.29, 2.2 + Math.sin(a) * 0.29, 0.02).rotation.x = PI / 2; } k.s(0.06, 0xff9ab0, -0.04, 2.2, 0.04, 1, 0.7, 0.3); k.s(0.06, 0xff9ab0, 0.04, 2.2, 0.04, 1, 0.7, 0.3); }, { wall: true });
  def('k_rose_oval', '장미 오벌 액자', 'wall', 500, 0.5, 0.1, g => { const k = K(g); const f = k.t(0.22, 0.03, 0x8a5a3a, 0, 2.0, 0.03); f.scale.set(0.8, 1.1, 1); const p = k.c(0.2, 0.2, 0.01, 0xfff4e8, 0, 2.0, 0.02); p.rotation.x = PI / 2; p.scale.set(0.8, 1, 1.1); k.s(0.05, 0xff8fa0, 0, 2.08, 0.04, 1, 1, 0.3); k.b(0.015, 0.2, 0.01, 0x7a9a5a, 0, 1.95, 0.035); k.s(0.035, 0x7a9a5a, 0.05, 1.95, 0.04, 1.4, 0.7, 0.3); }, { wall: true, tags: ['frame'] });
  def('k_moon_clock', '달 구름 벽시계', 'wall', 700, 0.6, 0.1, g => { const k = K(g); k.s(0.18, 0xfff08a, 0.05, 2.15, 0.04, 1, 1, 0.3); k.s(0.16, 0xfbeede, 0.13, 2.2, 0.06, 1, 1, 0.3); for (let i = 0; i < 4; i++) k.s(0.1, 0xffb8d0, -0.15 + i * 0.1, 1.95, 0.05, 1, 0.8, 0.3); for (let i = 0; i < 3; i++) { k.c(0.004, 0.004, 0.15, 0xc8a0e0, -0.1 + i * 0.1, 1.8, 0.05); k.s(0.025, 0xc8a0e0, -0.1 + i * 0.1, 1.72, 0.05); } }, { wall: true });
  def('k_dried_roses', '말린 장미 다발', 'wall', 500, 0.4, 0.2, g => { const k = K(g); for (let i = 0; i < 7; i++) k.s(0.045, [0xd84a6a, 0xe86a8a, 0xb83a5a][i % 3], Math.sin(i * 2) * 0.08, 1.85 - (i % 3) * 0.06, 0.08, 1, 0.9, 0.9); for (let i = 0; i < 5; i++) k.c(0.005, 0.005, 0.35, 0x6a8a4a, -0.04 + i * 0.02, 2.05, 0.08); k.b(0.1, 0.05, 0.05, 0xfff4e8, 0, 2.2, 0.08, 0.02); }, { wall: true });
  def('k_ribbon_deco', '핑크 리본 장식', 'wall', 400, 0.5, 0.1, g => { const k = K(g); for (const sx of [-1, 1]) { const l = k.s(0.1, 0xff8fa8, sx * 0.1, 2.3, 0.03, 1, 0.6, 0.3); l.rotation.z = sx * 0.3; const t = k.b(0.05, 0.28, 0.015, 0xff8fa8, sx * 0.06, 2.1, 0.03, 0.01); t.rotation.z = sx * 0.25; } k.s(0.04, 0xff7a98, 0, 2.3, 0.05); }, { wall: true });
  def('k_embroid_frame', '자수 원형 액자', 'wall', 500, 0.4, 0.1, g => { const k = K(g); k.t(0.16, 0.022, 0xd8b078, 0, 1.7, 0.03); const p = k.c(0.15, 0.15, 0.01, 0xfff4e8, 0, 1.7, 0.02); p.rotation.x = PI / 2; for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; k.s(0.03, [0xe84a6a, 0xffd84a, 0x5a9ae8][i % 3], Math.cos(a) * 0.07, 1.7 + Math.sin(a) * 0.07, 0.035, 1, 1, 0.3); } }, { wall: true, tags: ['frame'] });
  def('k_rose_frame', '장미 액자', 'wall', 500, 0.5, 0.1, g => { const k = K(g); k.b(0.44, 0.44, 0.04, 0xd8c080, 0, 2.2, 0.02, 0.02); k.p(0.36, 0.36, picMat('roses', (c, w, h) => { c.fillStyle = '#f4f8e0'; c.fillRect(0, 0, w, h); for (let i = 0; i < 7; i++) { c.fillStyle = ['#f8a0b0', '#f0c0c8', '#e8e0a0'][i % 3]; c.beginPath(); c.arc(20 + (i * 37) % 90, 25 + (i * 53) % 80, 14, 0, 7); c.fill(); } }), 0, 2.2, 0.045); }, { wall: true, tags: ['frame'] });
  def('k_clothes_rack_white', '화이트 행거 & 옷', 'work', 1200, 1.2, 0.5, g => {
    const k = K(g); for (const x of [-0.55, 0.55]) { k.c(0.02, 0.02, 1.5, 0xffffff, x, 0.75, 0); k.b(0.05, 0.03, 0.45, 0xffffff, x, 0.02, 0); } const bar = k.c(0.02, 0.02, 1.12, 0xffffff, 0, 1.48, 0); bar.rotation.z = PI / 2;
    [0xffd0dc, 0xf4f4ec, 0xc8e8c0, 0xffe8b0].forEach((c, i) => { const x = -0.35 + i * 0.23; k.t(0.05, 0.006, 0xd0d0d0, x, 1.44, 0, PI); k.b(0.3, 0.55, 0.05, c, x, 1.15, 0, 0.04); k.b(0.08, 0.3, 0.05, c, x - 0.16, 1.25, 0, 0.03).rotation.z = 0.3; });
  }, { use: [{ pose: 'tryon', dx: 0, dz: 0.7, face: 180, act: 'wardrobe' }], tags: ['wardrobe'] });
  def('k_pink_stool_clothes', '핑크 스툴 & 개킨 옷', 'misc', 500, 0.5, 0.5, g => { const k = K(g); k.c(0.2, 0.24, 0.4, 0xffb8c8, 0, 0.2, 0); [0xf0d8e8, 0xd8e8c8, 0xffe0b0, 0xe8d0f0].forEach((c, i) => k.b(0.34, 0.05, 0.3, c, 0, 0.43 + i * 0.05, 0, 0.02)); }, {});
  def('k_wardrobe_white', '화이트 앤티크 옷장', 'work', 2200, 1.1, 0.6, g => { const k = K(g); k.b(1.1, 1.9, 0.58, 0xfaf6ee, 0, 0.97, 0, 0.03); k.b(1.16, 0.08, 0.62, 0xfaf6ee, 0, 1.95, 0, 0.02); for (const x of [-0.27, 0.27]) { k.b(0.48, 1.3, 0.02, 0xf0e8dc, x, 1.15, 0.3, 0.02); k.b(0.36, 1.1, 0.02, 0xfaf6ee, x, 1.15, 0.31, 0.02); k.s(0.025, 0xd9b44a, x * 0.2, 1.1, 0.33); } k.b(1.0, 0.3, 0.02, 0xf0e8dc, 0, 0.3, 0.3, 0.02); }, { use: [{ pose: 'tryon', dx: 0, dz: 0.8, face: 180, act: 'wardrobe' }], tags: ['wardrobe'] });
  def('k_ornate_mirror', '핑크 앤티크 전신거울', 'misc', 1500, 0.7, 0.3, g => { const k = K(g); k.b(0.62, 1.5, 0.06, 0xffb0c4, 0, 0.9, 0, 0.1); k.b(0.5, 1.3, 0.02, glass(0xe0f0ff), 0, 0.92, 0.035, 0.08); for (let i = 0; i < 5; i++) k.s(0.06, 0xffb0c4, -0.2 + i * 0.1, 1.68 + Math.sin(i * 1.3) * 0.04, 0, 1, 1, 0.4); k.b(0.5, 0.1, 0.3, 0xffb0c4, 0, 0.05, 0, 0.04); }, { use: [{ pose: 'mirror', dx: 0, dz: 0.8, face: 180, act: 'mirror' }], tags: ['mirror'] });
  def('k_cushion_ottoman', '패치워크 쿠션 오토만', 'rest', 800, 0.7, 0.55, g => { const k = K(g), wd = T.woodgrain(0xa87a58); k.b(0.6, 0.12, 0.45, 0x9aa860, 0, 0.36, 0, 0.04); for (const x of [-0.25, 0.25]) for (const z of [-0.18, 0.18]) k.b(0.05, 0.32, 0.05, wd, x, 0.16, z, 0.01); k.b(0.55, 0.12, 0.45, T.patch('otto', [0xf4e0d0, 0xe8a0a0, 0x9ab870, 0xfff4ea]), 0, 0.48, 0, 0.06); }, { use: [{ pose: 'sit', dx: 0, dz: 0, face: 0, act: 'sit', seatH: 0.54 }], tags: ['chair'] });
  def('k_heart_chair', '하트 등받이 의자', 'rest', 600, 0.5, 0.5, g => { const k = K(g); k.b(0.44, 0.05, 0.42, 0xffffff, 0, 0.46, 0, 0.02); for (const x of [-0.18, 0.18]) for (const z of [-0.17, 0.17]) k.c(0.02, 0.02, 0.46, 0xffffff, x, 0.23, z); for (const x of [-0.18, 0.18]) k.c(0.02, 0.02, 0.5, 0xffffff, x, 0.72, -0.18); k.b(0.4, 0.25, 0.03, 0xffffff, 0, 0.8, -0.18, 0.05); k.s(0.035, 0xffc8d8, -0.02, 0.82, -0.16, 1, 1, 0.4); k.s(0.035, 0xffc8d8, 0.02, 0.82, -0.16, 1, 1, 0.4); }, { use: [{ pose: 'sit', dx: 0, dz: 0.02, face: 0, act: 'sit', seatH: 0.49 }], tags: ['chair'] });

  // ===================== 4. 스포티 개러지 =====================
  def('k_trophy_cabinet', '트로피 장식장 & 헬멧', 'work', 3200, 1.3, 0.55, g => {
    const k = K(g), wd = T.woodgrain(0x4a2e22); k.b(1.3, 1.9, 0.52, wd, 0, 0.95, 0, 0.03); k.b(1.36, 0.08, 0.56, 0x3a2418, 0, 1.92, 0, 0.02); k.b(1.2, 0.35, 0.02, 0x3a2418, 0, 0.22, 0.26, 0.02);
    k.b(1.16, 1.3, 0.02, glass(0xcfe8ff), 0, 1.1, 0.26, 0.01); k.b(1.16, 0.03, 0.44, 0x3a2418, 0, 1.08, 0.02);
    for (const [y, row] of [[0.48, 0], [1.1, 1]]) for (let i = 0; i < 3; i++) { const x = -0.38 + i * 0.38, c = [0xd9a83a, 0xc8ccd4, 0xd08a4a][(i + row) % 3]; k.c(0.06, 0.08, 0.08, 0x2b2b30, x, y + 0.04, 0.02); k.c(0.02, 0.02, 0.12, c, x, y + 0.14, 0.02); k.add(mesh(lathe2('cup', [[0.02, 0], [0.1, 0.12], [0.12, 0.22]]), M(c), x, y + 0.2, 0.02)); k.t(0.05, 0.012, c, x - 0.12, y + 0.32, 0.02).rotation.y = PI / 2; k.t(0.05, 0.012, c, x + 0.12, y + 0.32, 0.02).rotation.y = PI / 2; }
    for (const [x, c] of [[-0.3, 0xe03a3a], [0.3, 0xd83030]]) { k.s(0.2, c, x, 2.12, 0, 1, 0.95, 1.05); k.b(0.28, 0.12, 0.06, 0x1a1a22, x, 2.1, 0.19, 0.04); k.b(0.06, 0.24, 0.05, 0xffffff, x, 2.2, 0.16, 0.02).rotation.z = 0.5; }
  }, { tags: ['display'] });
  def('k_car_bed', '레이싱카 침대', 'rest', 3800, 1.3, 2.2, g => {
    const k = K(g); k.b(1.3, 0.45, 2.2, 0xe03a3a, 0, 0.3, 0, 0.18); k.b(1.1, 0.12, 1.7, 0xffffff, 0, 0.55, 0.05, 0.05); k.b(1.2, 0.3, 0.4, 0xe03a3a, 0, 0.6, -0.95, 0.12);
    for (const x of [-0.66, 0.66]) for (const z of [-0.7, 0.7]) { const w = k.c(0.22, 0.22, 0.14, 0x1a1a22, x, 0.22, z); w.rotation.z = PI / 2; k.c(0.1, 0.1, 0.15, 0xd8d8d8, x, 0.22, z).rotation.z = PI / 2; }
    k.b(0.6, 0.16, 0.34, T.gingham(0xffffff, 0x2b2b30, 4), 0, 0.66, -0.6, 0.06); k.b(1.2, 0.08, 0.3, 0x2b2b30, 0, 0.5, 1.05, 0.03); k.b(0.9, 0.04, 0.08, 0xffffff, 0, 0.56, -1.12, 0.01);
    k.b(1.05, 0.1, 1.1, 0xd83030, 0, 0.64, 0.4, 0.05);
  }, { grade: 2, bed: { top: 0.64, headZ: -0.44, color: 0xd83030 }, use: [{ pose: 'sleep', dx: 0, dz: 0, face: 0, act: 'sleep' }], tags: ['bed'] });
  def('k_weight_bench', '벤치 프레스', 'smart', 2000, 1.7, 1.1, g => {
    const k = K(g); k.b(0.3, 0.08, 1.1, 0x2b2b30, 0, 0.45, 0.1, 0.03); k.b(0.08, 0.4, 0.08, 0x9aa3ad, 0, 0.22, 0.45); k.b(0.08, 0.4, 0.08, 0x9aa3ad, 0, 0.22, -0.3); k.b(0.5, 0.04, 0.08, 0x9aa3ad, 0, 0.03, 0.45); k.b(0.5, 0.04, 0.08, 0x9aa3ad, 0, 0.03, -0.3);
    for (const x of [-0.45, 0.45]) { k.b(0.06, 1.2, 0.06, 0xd8d8e0, x, 0.6, -0.4); k.b(0.06, 0.04, 0.4, 0xd8d8e0, x, 0.02, -0.4); k.b(0.08, 0.06, 0.12, 0x2b2b30, x, 1.05, -0.34); }
    const bar = k.c(0.018, 0.018, 1.7, 0xd8d8e0, 0, 1.1, -0.34); bar.rotation.z = PI / 2; for (const x of [-0.72, 0.72]) { const p = k.c(0.22, 0.22, 0.07, 0x1a1a22, x, 1.1, -0.34); p.rotation.z = PI / 2; }
  }, { use: [{ pose: 'lift', dx: 0, dz: 0.8, face: 180, act: 'workout' }], tags: ['gym'] });
  def('k_punch_bag', '레드 샌드백', 'smart', 1400, 0.8, 0.8, g => { const k = K(g); k.b(0.06, 2.4, 0.06, 0x2b2b30, -0.35, 1.2, -0.3); const arm = k.b(0.5, 0.05, 0.05, 0x2b2b30, -0.12, 2.35, -0.3); k.c(0.005, 0.005, 0.3, 0x9aa3ad, 0.1, 2.2, -0.3); k.add(mesh(lathe2('bag', [[0.16, 0], [0.2, 0.2], [0.2, 0.9], [0.14, 1.0]]), M(0xd83030), 0.1, 1.05, -0.3)); k.b(0.4, 0.04, 0.4, 0x2b2b30, -0.25, 0.02, -0.2); }, { use: [{ pose: 'punch', dx: 0.1, dz: 0.4, face: 180, act: 'sandbag' }], tags: ['gym'] });
  def('k_kettlebell', '케틀벨', 'misc', 400, 0.4, 0.4, g => { const k = K(g); k.s(0.17, 0x1a1a22, 0, 0.17, 0, 1, 0.95, 1); k.t(0.1, 0.03, 0x1a1a22, 0, 0.36, 0); }, { tags: ['gym'] });
  def('k_elec_bench', '전자 작업대', 'work', 1800, 1.5, 0.8, g => {
    const k = K(g); k.b(1.5, 0.05, 0.78, 0x2b2b30, 0, 0.74, 0, 0.02); for (const x of [-0.68, 0.68]) for (const z of [-0.33, 0.33]) k.b(0.05, 0.72, 0.05, 0x2b2b30, x, 0.36, z, 0.01);
    k.b(0.9, 0.01, 0.5, T.gingham(0x3a8a4a, 0x2a6a3a, 8), 0, 0.77, 0, 0.003); k.b(0.3, 0.02, 0.16, 0xf4f4f4, 0.1, 0.785, 0, 0.005); k.b(0.14, 0.2, 0.06, 0x3a3a3a, -0.4, 0.86, -0.1, 0.02); k.b(0.1, 0.06, 0.01, 0x9aff9a, -0.4, 0.9, -0.065); k.b(0.12, 0.06, 0.12, 0xe8d040, 0.45, 0.8, 0.1, 0.02); const sd = k.c(0.012, 0.012, 0.25, 0x1a1a22, 0.35, 0.86, 0.05); sd.rotation.z = 0.9;
    for (let i = 0; i < 5; i++) { const w = k.t(0.08 + i * 0.02, 0.006, [0xd83030, 0x2b2b30, 0xd83030][i % 3], -0.1 + i * 0.1, 0.78, 0.1 + Math.sin(i) * 0.1, PI * 1.3); w.rotation.x = PI / 2; }
  }, { use: [{ pose: 'type', dx: 0, dz: 0.7, face: 180, act: 'type', seatH: 0.46 }], tags: ['desk'] });
  def('k_leather_sofa', '브라운 가죽 소파', 'rest', 2400, 1.8, 0.9, g => { const k = K(g), lm = T.leather(0x3a2622); k.b(1.8, 0.4, 0.85, lm, 0, 0.26, 0, 0.1); k.b(1.8, 0.5, 0.28, lm, 0, 0.66, -0.3, 0.12); for (const x of [-0.8, 0.8]) k.b(0.24, 0.3, 0.84, lm, x, 0.56, 0, 0.12); for (const x of [-0.4, 0.4]) k.b(0.76, 0.12, 0.6, lm, x, 0.5, 0.08, 0.06); }, { use: [{ pose: 'sit', dx: -0.4, dz: 0.1, face: 0, act: 'sofa', seatH: 0.56 }, { pose: 'sit', dx: 0.4, dz: 0.1, face: 0, act: 'sofa', seatH: 0.56 }], tags: ['sofa'] });
  def('k_metal_rack', '철제 랙 & 공구함', 'work', 1400, 1.2, 0.5, g => { const k = K(g); for (const x of [-0.58, 0.58]) for (const z of [-0.22, 0.22]) k.b(0.04, 2.0, 0.04, 0x2b2b30, x, 1.0, z, 0.005); for (const y of [0.1, 0.7, 1.3, 1.9]) k.b(1.2, 0.03, 0.46, 0x3a3a40, 0, y, 0, 0.005); k.b(0.6, 0.3, 0.36, 0xd83030, -0.2, 1.47, 0, 0.03); k.b(0.6, 0.04, 0.36, 0xb82828, -0.2, 1.63, 0, 0.02); k.b(0.3, 0.3, 0.3, 0xd8b888, 0.35, 0.87, 0, 0.01); k.b(0.3, 0.2, 0.3, 0xd8b888, -0.3, 0.82, 0, 0.01); k.c(0.1, 0.1, 0.3, 0xf4f4f4, 0.3, 2.06, 0); k.c(0.1, 0.1, 0.25, 0xc8ccd4, -0.35, 0.25, 0); }, { tags: ['construction'] });
  def('k_fridge_red', '레드 냉장고 & 전자레인지', 'work', 1800, 0.7, 0.65, g => { const k = K(g); k.b(0.66, 1.3, 0.6, 0xd83030, 0, 0.65, 0, 0.05); k.b(0.02, 0.4, 0.04, 0xf4f4f4, 0.25, 0.9, 0.31); k.b(0.66, 0.02, 0.6, 0xb82828, 0, 0.9, 0.01); k.b(0.6, 0.34, 0.45, 0xf4f4f4, 0, 1.47, 0, 0.03); k.b(0.36, 0.24, 0.02, 0x2b2b30, -0.08, 1.47, 0.23, 0.01); }, { use: [{ pose: 'reach', dx: 0, dz: 0.7, face: 180, act: 'cook' }], tags: ['kitchen'] });
  def('k_drink_shelf', '스포츠 음료 선반 & 붐박스', 'work', 1300, 1.3, 0.45, g => { const k = K(g); k.b(1.3, 0.6, 0.42, 0x2b2b30, 0, 0.3, 0, 0.02); for (const x of [-0.42, 0, 0.42]) k.b(0.38, 0.24, 0.36, 0x1a1a22, x, 0.18, 0.04, 0.01); k.b(0.24, 0.2, 0.2, 0xd83030, 0, 0.15, 0.05, 0.02); P.book(k, 0.38, 0.06, 0.05, 0xf0c060); P.book(k, 0.44, 0.06, 0.05, 0xd83030); for (let i = 0; i < 9; i++) { const c = [0xff8a3a, 0x4ac06a, 0xffd84a, 0xd83030, 0x6ab0ff][i % 5]; k.c(0.035, 0.035, 0.16, c, -0.55 + i * 0.07, 0.68, 0.05); k.c(0.015, 0.015, 0.03, 0xffffff, -0.55 + i * 0.07, 0.77, 0.05); } k.c(0.1, 0.1, 0.22, 0x3a3a50, 0.3, 0.71, -0.05); k.b(0.44, 0.2, 0.12, 0xd83030, 0.3, 0.9, 0.1, 0.03).visible = false; }, { tags: ['gym'] });
  def('k_boombox', '레드 붐박스', 'smart', 700, 0.5, 0.2, g => { const k = K(g); k.b(0.46, 0.22, 0.14, 0xd83030, 0, 0.11, 0, 0.03); for (const x of [-0.13, 0.13]) { k.c(0.07, 0.07, 0.02, 0x2b2b30, x, 0.11, 0.07).rotation.x = PI / 2; } k.b(0.1, 0.06, 0.02, 0xc8ccd4, 0, 0.13, 0.075); const h = k.t(0.16, 0.012, 0x9aa3ad, 0, 0.22, 0, PI); }, { use: [{ pose: 'sway', dx: 0, dz: 0.7, face: 180, act: 'listen_radio' }], tags: ['radio', 'music'] });
  def('k_stove_ramen', '1구 스토브 & 라멘', 'work', 900, 0.6, 0.55, g => { const k = K(g); k.b(0.55, 0.7, 0.5, 0x2b2b30, 0, 0.35, 0, 0.02); k.b(0.55, 0.03, 0.5, 0x3a3a3a, 0, 0.72, 0); k.t(0.12, 0.015, 0x1a1a1a, 0, 0.75, 0).rotation.x = PI / 2; k.add(mesh(lathe2('bowl', [[0.08, 0], [0.16, 0.08], [0.17, 0.12]]), M(0xf4f4f4), 0, 0.76, 0)); k.c(0.15, 0.15, 0.01, 0xe8b060, 0, 0.87, 0); k.s(0.04, 0xfff4d0, 0.05, 0.88, 0.02, 1, 0.5, 1); k.b(0.05, 0.01, 0.1, 0xd87050, -0.05, 0.885, -0.03); k.b(0.08, 0.1, 0.01, 0x2a4a2a, -0.06, 0.9, 0.06); }, { use: [{ pose: 'cook', dx: 0, dz: 0.7, face: 180, act: 'cook' }], tags: ['kitchen'] });
  def('k_box_stack', '프라모델 박스 & 로봇', 'misc', 700, 0.6, 0.5, g => { const k = K(g); [[0xf4f4f4, 0x3a6ad0], [0xffd84a, 0xd83030], [0xf4f4f4, 0x2b2b30], [0x6ab0ff, 0xffffff]].forEach(([a, b], i) => { k.b(0.55 - i * 0.03, 0.12, 0.42, a, 0, 0.06 + i * 0.12, 0, 0.01); k.b(0.3, 0.06, 0.01, b, 0, 0.06 + i * 0.12, 0.215); }); k.b(0.14, 0.18, 0.1, 0x9aa3ad, 0, 0.6, 0, 0.02); k.b(0.1, 0.1, 0.1, 0x9aa3ad, 0, 0.76, 0, 0.02); k.s(0.015, glow(0xff5a5a), -0.025, 0.77, 0.05); k.s(0.015, glow(0xff5a5a), 0.025, 0.77, 0.05); }, {});
  def('k_skateboard', '스케이트보드', 'misc', 400, 0.8, 0.3, g => { const k = K(g); k.b(0.8, 0.02, 0.22, 0x8a5a3a, 0, 0.08, 0, 0.1); k.b(0.6, 0.005, 0.18, 0xffd84a, 0, 0.092, 0); for (const x of [-0.25, 0.25]) for (const z of [-0.08, 0.08]) k.c(0.03, 0.03, 0.03, 0xd83030, x, 0.035, z).rotation.x = PI / 2; }, {});
  def('k_skate_rack', '스케이트보드 벽 거치대', 'wall', 800, 0.9, 0.2, g => { const k = K(g); for (const x of [-0.25, 0.25]) k.b(0.08, 1.0, 0.04, 0x3a2a24, x, 1.75, 0.02, 0.01); for (let i = 0; i < 3; i++) { const y = 2.05 - i * 0.3; k.b(0.85, 0.2, 0.03, [0xe8c490, 0xd8a870, 0x8a5a3a][i], 0, y, 0.08, 0.09); k.b(0.6, 0.12, 0.005, [0xd83030, 0x6ab0ff, 0xffd84a][i], 0, y, 0.098); for (const x of [-0.25, 0.25]) k.c(0.03, 0.03, 0.04, 0xd83030, x, y - 0.08, 0.12).rotation.x = PI / 2; } }, { wall: true });
  def('k_wall_tv', '벽걸이 TV (테니스 중계)', 'wall', 1500, 0.9, 0.1, g => { const k = K(g); k.b(0.86, 0.54, 0.05, 0x1a1a22, 0, 2.15, 0.03, 0.02); k.p(0.8, 0.48, T.screen('tennis'), 0, 2.15, 0.06); }, { wall: true, tags: ['tv'] });
  def('k_big_tv', '대형 TV (드라마)', 'wall', 2200, 1.3, 0.1, g => { const k = K(g); k.b(1.25, 0.78, 0.05, 0xb82828, 0, 1.75, 0.03, 0.03); k.p(1.14, 0.68, T.screen('drama'), 0, 1.75, 0.06); }, { wall: true, tags: ['tv'] });
  def('k_field_frame', '꽃밭 풍경 액자', 'wall', 800, 1.1, 0.1, g => { const k = K(g); k.b(1.05, 0.6, 0.05, 0xb82828, 0, 1.45, 0.03, 0.02); k.p(0.95, 0.5, T.screen('field'), 0, 1.45, 0.06); }, { wall: true, tags: ['frame'] });
  def('k_neon_clock', '넘버 73 네온 시계', 'wall', 900, 0.6, 0.1, g => { const k = K(g); k.c(0.26, 0.26, 0.05, 0xf4f4f4, 0, 2.45, 0.03).rotation.x = PI / 2; k.t(0.25, 0.025, glow(0xff5a5a), 0, 2.45, 0.06); k.p(0.4, 0.4, picMat('n73', (c, w, h) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.fillStyle = '#d83030'; c.font = 'bold 60px sans-serif'; c.textAlign = 'center'; c.fillText('73', 64, 84); }), 0, 2.45, 0.065); }, { wall: true });
  def('k_pennant', '애니멀 페넌트', 'wall', 500, 1.0, 0.1, g => { const k = K(g); const s = new THREE.Shape(); s.moveTo(-0.45, 0.22); s.lineTo(0.5, 0); s.lineTo(-0.45, -0.22); s.lineTo(-0.45, 0.22); k.add(mesh(geo('pennant', () => new THREE.ShapeGeometry(s)), new THREE.MeshLambertMaterial({ map: ctex('pennant', 256, 128, (c, w, h) => { c.fillStyle = '#2f4ba8'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffd84a'; c.font = 'bold 30px sans-serif'; c.fillText('ANIMAL', 60, 80); c.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) c.fillText('★', 60 + i * 24, 110); }) }), 0, 2.3, 0.03)); k.b(0.06, 0.5, 0.04, 0xf4f4f4, -0.47, 2.3, 0.03, 0.01); }, { wall: true });
  def('k_bike_poster', '레트로 바이크 포스터', 'wall', 500, 0.6, 0.1, g => { const k = K(g); k.b(0.5, 0.7, 0.04, 0x8a5a3a, 0, 1.75, 0.02, 0.01); k.p(0.42, 0.62, picMat('bike', (c, w, h) => { c.fillStyle = '#ffd88a'; c.fillRect(0, 0, w, h); c.fillStyle = '#d83030'; c.fillRect(0, 0, w, 24); c.fillStyle = '#fff'; c.beginPath(); c.arc(64, 60, 18, 0, 7); c.fill(); c.strokeStyle = '#2b2b30'; c.lineWidth = 5; c.beginPath(); c.arc(38, 100, 14, 0, 7); c.arc(92, 100, 14, 0, 7); c.stroke(); c.beginPath(); c.moveTo(38, 100); c.lineTo(64, 80); c.lineTo(92, 100); c.stroke(); }), 0, 1.75, 0.045); }, { wall: true, tags: ['frame'] });
  def('k_fish_wall', '컬러 물고기 벽 장식', 'wall', 500, 1.2, 0.1, g => { const k = K(g); [[0xff8a3a, -0.4, 2.5], [0x3a6ad0, 0.3, 2.2], [0xffd84a, -0.1, 1.9], [0xd83030, 0.45, 1.6], [0x4ac06a, -0.35, 1.45]].forEach(([c, x, y]) => { k.s(0.12, c, x, y, 0.03, 1.4, 0.55, 0.25); k.cone(0.07, 0.1, c, x + 0.2, y, 0.03, 3).rotation.z = -PI / 2; k.s(0.015, 0x1a1a22, x - 0.1, y + 0.02, 0.06); }); }, { wall: true });
  def('k_pendant_bulb', '펜던트 전구', 'light', 400, 0.3, 0.3, g => { const k = K(g); k.c(0.006, 0.006, 0.9, 0x1a1a1a, 0, 2.55, 0); k.c(0.04, 0.05, 0.08, 0x1a1a1a, 0, 2.08, 0); k.s(0.08, glow(0xfff4c0), 0, 1.98, 0, 1, 1.2, 1); }, { ceiling: true, tags: ['light'] });
  def('k_folding_chair', '접이식 의자', 'rest', 400, 0.5, 0.5, g => { const k = K(g); k.b(0.42, 0.04, 0.4, 0xd83030, 0, 0.46, 0, 0.02); k.b(0.42, 0.3, 0.03, 0xd83030, 0, 0.75, -0.2, 0.02); for (const sx of [-1, 1]) { const a = k.c(0.012, 0.012, 0.9, 0x9aa3ad, sx * 0.2, 0.45, 0.02); a.rotation.x = 0.35; const b = k.c(0.012, 0.012, 0.55, 0x9aa3ad, sx * 0.2, 0.27, -0.05); b.rotation.x = -0.45; } }, { use: [{ pose: 'sit', dx: 0, dz: 0.02, face: 0, act: 'sit', seatH: 0.49 }], tags: ['chair'] });

  // ===================== 5. 콘크리트 로프트 =====================
  def('k_city_window', '도시 전망 통창 & 붐박스', 'wall', 2600, 2.2, 0.5, g => {
    const k = K(g); k.p(2.0, 1.5, new THREE.MeshBasicMaterial({ map: ctex('city', 512, 384, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6a6a8a'); gr.addColorStop(0.5, '#e8a888'); gr.addColorStop(1, '#c8b8c0'); c.fillStyle = gr; c.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { const bw = 20 + (i * 13) % 30, bh = 60 + (i * 47) % 200, x = (i * 53) % w; c.fillStyle = `rgb(${120 + (i % 4) * 15},${125 + (i % 4) * 15},${135 + (i % 4) * 15})`; c.fillRect(x, h - bh, bw, bh); c.fillStyle = 'rgba(255,240,200,0.5)'; for (let y = h - bh + 8; y < h; y += 12) for (let xx = x + 4; xx < x + bw - 4; xx += 8) if ((xx + y) % 3) c.fillRect(xx, y, 3, 4); } }) }), 0, 1.6, 0.03);
    for (const x of [-1.02, 0, 1.02]) k.b(0.06, 1.6, 0.08, 0x1a1a1e, x, 1.6, 0.05, 0.01); for (const y of [0.83, 1.6, 2.38]) k.b(2.1, 0.06, 0.08, 0x1a1a1e, 0, y, 0.05, 0.01);
    k.b(2.2, 0.08, 0.36, 0x8a8c90, 0, 0.78, 0.16, 0.01);
    k.b(0.46, 0.24, 0.14, 0xc8ccd4, 0.55, 0.94, 0.18, 0.03); for (const x of [0.43, 0.67]) k.c(0.07, 0.07, 0.02, 0x2b2b30, x, 0.94, 0.26).rotation.x = PI / 2; k.t(0.16, 0.012, 0x9aa3ad, 0.55, 1.06, 0.18, PI);
    k.t(0.08, 0.025, 0x3a3a3a, -0.6, 0.85, 0.18).rotation.x = PI / 2 - 0.4; k.s(0.05, 0x5a8a3a, -0.68, 0.86, 0.2, 1, 1, 0.5); k.s(0.05, 0x5a8a3a, -0.52, 0.86, 0.2, 1, 1, 0.5);
  }, { wall: true, tags: ['window', 'music'] });
  def('k_blinds_window', '블라인드 창', 'wall', 900, 0.9, 0.15, g => { const k = K(g); k.b(0.9, 1.2, 0.05, 0xf4f4f4, 0, 1.55, 0.03, 0.02); for (let y = 1.05; y < 2.1; y += 0.09) { const s = k.b(0.78, 0.06, 0.02, 0xfafafa, 0, y, 0.07, 0.005); s.rotation.x = -0.5; } }, { wall: true, tags: ['window'] });
  def('k_black_sofa', '블랙 가죽 소파', 'rest', 2800, 2.1, 0.9, g => { const k = K(g), lm = T.leather(0x1e1e22); k.b(2.1, 0.12, 0.85, 0x111114, 0, 0.1, 0, 0.02); k.b(2.0, 0.26, 0.78, lm, 0, 0.3, 0, 0.06); k.b(2.1, 0.5, 0.22, lm, 0, 0.62, -0.32, 0.06); for (const x of [-0.98, 0.98]) k.b(0.16, 0.32, 0.84, lm, x, 0.5, 0, 0.05); for (const x of [-0.46, 0.46]) k.b(0.9, 0.1, 0.6, lm, x, 0.47, 0.06, 0.04); for (const x of [-0.96, 0.96]) for (const z of [-0.36, 0.36]) k.b(0.05, 0.08, 0.05, 0xc8ccd4, x, 0.04, z, 0.01); }, { use: [{ pose: 'sit', dx: -0.46, dz: 0.1, face: 0, act: 'sofa', seatH: 0.52 }, { pose: 'sit', dx: 0.46, dz: 0.1, face: 0, act: 'sofa', seatH: 0.52 }], tags: ['sofa'] });
  def('k_black_table', '블랙 커피 테이블 & 과자', 'work', 900, 1.3, 0.7, g => { const k = K(g); k.b(1.3, 0.05, 0.66, 0x1a1a1e, 0, 0.42, 0, 0.01); k.b(1.2, 0.03, 0.56, 0x222226, 0, 0.14, 0, 0.01); for (const x of [-0.62, 0.62]) for (const z of [-0.3, 0.3]) k.b(0.04, 0.42, 0.04, 0x1a1a1e, x, 0.21, z, 0.005); const bag = k.b(0.26, 0.08, 0.34, 0xf4f4f4, -0.25, 0.49, 0, 0.04); bag.rotation.y = 0.5; k.b(0.1, 0.085, 0.3, 0x4ac06a, -0.25, 0.49, 0.02, 0.01).rotation.y = 0.5; for (let i = 0; i < 4; i++) k.s(0.03, 0xf0c060, -0.05 + i * 0.05, 0.45, 0.15 + (i % 2) * 0.05, 1, 0.2, 1); k.c(0.035, 0.035, 0.12, 0xb83030, 0.35, 0.51, 0.05); }, { use: [{ pose: 'eat', dx: 0, dz: 0.65, face: 180, act: 'eat', seatH: 0.42 }], tags: ['table'] });
  def('k_crt_tv', 'CRT 텔레비전', 'smart', 1400, 0.7, 0.6, g => { const k = K(g); k.b(0.6, 0.5, 0.55, 0x2b2b30, 0, 0.25, 0, 0.02); k.b(0.6, 0.55, 0.55, 0xc8ccd0, 0, 0.78, 0, 0.05); k.b(0.44, 0.36, 0.02, 0x3a3a3a, -0.04, 0.8, 0.27, 0.04); k.p(0.4, 0.32, T.screen('crt'), -0.04, 0.8, 0.285); k.b(0.08, 0.3, 0.01, 0xa8acb0, 0.24, 0.8, 0.28); k.b(0.5, 0.12, 0.45, 0xb0b4b8, 0, 0.44, 0, 0.02); }, { use: [{ pose: 'sit', dx: 0, dz: 1.6, face: 180, act: 'watch_tv' }], tags: ['tv'] });
  def('k_clothes_rack_black', '블랙 행거 & 코트', 'work', 1200, 1.1, 0.5, g => { const k = K(g); for (const x of [-0.5, 0.5]) { k.c(0.02, 0.02, 1.5, 0x1a1a1e, x, 0.75, 0); k.b(0.05, 0.03, 0.45, 0x1a1a1e, x, 0.02, 0); } const bar = k.c(0.02, 0.02, 1.02, 0x1a1a1e, 0, 1.48, 0); bar.rotation.z = PI / 2; [0x1a1a22, 0xf4f4f4, 0x3a4a6a, 0x2b2b30].forEach((c, i) => { const x = -0.33 + i * 0.22; k.t(0.05, 0.006, 0xc8a070, x, 1.44, 0, PI); k.b(0.28, i === 0 ? 0.8 : 0.55, 0.06, c, x, i === 0 ? 1.0 : 1.15, 0, 0.04); if (i === 1) for (let s = -1; s <= 1; s++) k.b(0.005, 0.5, 0.062, 0x3a3a50, x + s * 0.06, 1.15, 0); }); }, { use: [{ pose: 'tryon', dx: 0, dz: 0.7, face: 180, act: 'wardrobe' }], tags: ['wardrobe'] });
  def('k_guitar_stand', '일렉 기타', 'smart', 1500, 0.5, 0.5, g => { const k = K(g); const gg = k.add(new THREE.Group()); gg.position.set(0, 0.1, 0); gg.rotation.x = -0.25; const b = new THREE.Mesh(geo('gbody', () => { const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(0.2, 0, 0.22, 0.2, 0.12, 0.28); s.bezierCurveTo(0.2, 0.36, 0.14, 0.5, 0.05, 0.46); s.lineTo(-0.05, 0.46); s.bezierCurveTo(-0.14, 0.5, -0.2, 0.36, -0.12, 0.28); s.bezierCurveTo(-0.22, 0.2, -0.2, 0, 0, 0); return new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 }); }), M(0x7a2a1a)); gg.add(b); gg.add(mesh(box(0.05, 0.7, 0.03, 0.01), M(0xd8a060), 0, 0.8, 0.03)); gg.add(mesh(box(0.08, 0.14, 0.03, 0.01), M(0x1a1a1e), 0, 1.2, 0.03)); gg.add(mesh(box(0.2, 0.26, 0.01, 0.01), M(0x1a1a1e), 0, 0.22, 0.065)); for (const x of [-0.25, 0.25]) k.c(0.012, 0.012, 0.5, 0x1a1a1e, x * 0.4, 0.2, x * 0.4).rotation.z = x; }, { use: [{ pose: 'sway', dx: 0, dz: 0.6, face: 180, act: 'lp', prop: 'guitar' }], tags: ['music'] });
  def('k_amp', '기타 앰프', 'smart', 1000, 0.7, 0.45, g => { const k = K(g); k.b(0.66, 0.6, 0.4, 0x1a1a1e, 0, 0.3, 0, 0.03); k.b(0.58, 0.4, 0.02, 0x2b2b30, 0, 0.26, 0.2, 0.02); for (let y = 0.1; y < 0.45; y += 0.03) k.b(0.56, 0.005, 0.005, 0x3a3a3a, 0, y, 0.215); k.b(0.58, 0.1, 0.02, 0xc8a870, 0, 0.53, 0.2, 0.01); for (let i = 0; i < 5; i++) k.c(0.015, 0.015, 0.02, 0x1a1a1e, -0.2 + i * 0.1, 0.53, 0.215).rotation.x = PI / 2; k.b(0.3, 0.03, 0.05, 0x1a1a1e, 0, 0.62, 0, 0.01); }, { tags: ['music'] });
  def('k_station_clock', '역 벽시계', 'wall', 600, 0.5, 0.2, g => { const k = K(g); k.b(0.06, 0.06, 0.16, 0x9aa3ad, 0, 2.5, 0.08); const f = k.c(0.22, 0.22, 0.08, 0xc8ccd4, 0, 2.28, 0.16); f.rotation.x = PI / 2; k.p(0.38, 0.38, picMat('clk', (c, w, h) => { c.fillStyle = '#fff'; c.beginPath(); c.arc(64, 64, 62, 0, 7); c.fill(); c.fillStyle = '#2b2b30'; for (let i = 0; i < 12; i++) { const a = i / 12 * 7; c.fillRect(64 + Math.cos(a) * 50 - 2, 64 + Math.sin(a) * 50 - 2, 4, 4); } c.strokeStyle = '#2b2b30'; c.lineWidth = 5; c.beginPath(); c.moveTo(64, 64); c.lineTo(64, 24); c.moveTo(64, 64); c.lineTo(34, 78); c.stroke(); }), 0, 2.28, 0.205); }, { wall: true });
  def('k_metal_shelf_wall', '메탈 벽선반 & 잡지', 'wall', 700, 1.0, 0.3, g => { const k = K(g); k.b(1.0, 0.04, 0.3, 0xc8ccd4, 0, 1.95, 0.15, 0.01); for (const x of [-0.4, 0.4]) { const b = k.b(0.03, 0.22, 0.03, 0x2b2b30, x, 1.84, 0.12); b.rotation.x = 0.7; } k.b(0.2, 0.28, 0.04, 0xe84a3a, -0.3, 2.11, 0.1, 0.01).rotation.z = 0.1; P.plant(k, -0.05, 1.97, 0.15, 0.6, 0xffffff, 0x4a8a4a); [0x2f4b8e, 0x6ab0ff, 0xffffff, 0xf4f4f4].forEach((c, i) => P.book(k, 0.15 + i * 0.06, 1.97, 0.15, c)); }, { wall: true, tags: ['books'] });
  def('k_speed_sign', '제한속도 표지판', 'wall', 500, 0.5, 0.1, g => { const k = K(g); k.b(0.46, 0.56, 0.03, 0x1a1a1e, 0, 1.75, 0.02, 0.01); k.p(0.42, 0.52, picMat('spd', (c, w, h) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.fillStyle = '#1a1a1e'; c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.fillText('SPEED', 64, 30); c.fillText('LIMIT', 64, 54); c.font = 'bold 56px sans-serif'; c.fillText('35', 64, 112); }), 0, 1.75, 0.04); }, { wall: true });
  def('k_bridge_frame', '다리 흑백 액자', 'wall', 600, 0.5, 0.1, g => { const k = K(g); k.b(0.44, 0.62, 0.04, 0x9aa3ad, 0, 1.85, 0.02, 0.01); k.p(0.36, 0.54, picMat('bridge', (c, w, h) => { c.fillStyle = '#d8d8d8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#3a3a3a'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 90); c.lineTo(w, 90); c.moveTo(30, 90); c.lineTo(30, 20); c.moveTo(98, 90); c.lineTo(98, 20); c.moveTo(30, 22); c.quadraticCurveTo(64, 80, 98, 22); c.stroke(); }), 0, 1.85, 0.045); }, { wall: true, tags: ['frame'] });
  def('k_neon_tube', '블루 네온 튜브', 'wall', 500, 0.9, 0.1, g => { const k = K(g); const t = k.c(0.025, 0.025, 0.7, glow(0x6ac8ff), 0, 1.8, 0.06); t.rotation.z = PI / 2; for (const x of [-0.37, 0.37]) k.c(0.035, 0.035, 0.06, 0xf4f4f4, x, 1.8, 0.06).rotation.z = PI / 2; }, { wall: true, tags: ['light'] });
  def('k_kitchen_counter', '그레이 주방 카운터', 'work', 2200, 1.6, 0.65, g => {
    const k = K(g); k.b(1.6, 0.85, 0.6, 0xa8acb0, 0, 0.43, 0, 0.02); k.b(1.64, 0.05, 0.64, 0x6a6c70, 0, 0.88, 0, 0.01); for (const x of [-0.4, 0.4]) { k.b(0.74, 0.7, 0.02, 0xb8bcc0, x, 0.43, 0.3, 0.01); k.b(0.2, 0.02, 0.03, 0x3a3a3a, x, 0.72, 0.32); }
    k.b(0.5, 0.06, 0.4, 0x8a8c90, 0.35, 0.89, 0); for (let i = 0; i < 4; i++) k.c(0.12 - i * 0.01, 0.1 - i * 0.01, 0.02, 0xf0f0f0, -0.45, 0.92 + i * 0.022, 0.05); k.s(0.1, 0xe8e0d0, -0.2, 0.95, -0.1, 1, 0.6, 1);
    // 장바구니
    k.b(0.32, 0.4, 0.22, 0xc8a070, -0.55, 0.2, 0.52, 0.01); const br = k.k(0.04, 0.4, 0xd89a50, -0.5, 0.55, 0.52); br.rotation.z = 0.3; k.s(0.06, 0xd83030, -0.62, 0.42, 0.55); for (let i = 0; i < 3; i++) k.cone(0.03, 0.2, 0x4a9a3a, -0.6 + i * 0.03, 0.52, 0.5);
  }, { use: [{ pose: 'cook', dx: 0, dz: 0.75, face: 180, act: 'cook' }], tags: ['kitchen'] });
  def('k_fridge_black', '블랙 소형 냉장고', 'work', 1200, 0.6, 0.6, g => { const k = K(g); k.b(0.58, 1.1, 0.56, 0x1a1a1e, 0, 0.55, 0, 0.04); k.b(0.02, 0.3, 0.04, 0x9aa3ad, 0.24, 0.8, 0.29); k.b(0.2, 0.2, 0.01, 0x4ac06a, -0.05, 0.75, 0.285); for (let i = 0; i < 4; i++) k.c(0.035, 0.035, 0.18 + (i % 2) * 0.08, [0xf4f4f4, 0x6a3a2a, 0xe8e0d0, 0x2b2b30][i], -0.18 + i * 0.12, 1.2 + (i % 2) * 0.04, 0); }, { use: [{ pose: 'reach', dx: 0, dz: 0.7, face: 180, act: 'cook' }], tags: ['kitchen'] });
  def('k_hang_dish_shelf', '그릇 걸이 선반', 'wall', 700, 1.2, 0.3, g => { const k = K(g); k.b(1.2, 0.04, 0.3, 0x1a1a1e, 0, 2.3, 0.15, 0.01); k.b(1.2, 0.04, 0.3, 0x1a1a1e, 0, 2.7, 0.15, 0.01); for (let i = 0; i < 4; i++) k.add(mesh(lathe2('dbowl', [[0.05, 0], [0.1, 0.06], [0.11, 0.08]]), M([0x3a4a6a, 0x9aa3ad, 0x2b3a5a, 0xf4f4f4][i]), -0.4 + i * 0.25, 2.32, 0.15)); for (let i = 0; i < 3; i++) k.c(0.035, 0.035, 0.18, [0x6a3a2a, 0xc8a070, 0xd8d8d8][i], 0.1 + i * 0.12, 2.81, 0.15); }, { wall: true, tags: ['kitchen'] });
  def('k_knife_rack', '마그네틱 칼걸이', 'wall', 400, 0.6, 0.1, g => { const k = K(g); k.b(0.55, 0.05, 0.03, 0x2b2b30, 0, 1.75, 0.02, 0.01); for (let i = 0; i < 5; i++) { k.b(0.04, 0.2, 0.01, 0xd8dce0, -0.2 + i * 0.1, 1.6, 0.04, 0.005); k.b(0.03, 0.1, 0.02, 0x1a1a1e, -0.2 + i * 0.1, 1.78, 0.04, 0.005); } }, { wall: true, tags: ['kitchen'] });
  def('k_magazines', '잡지 더미', 'misc', 300, 0.5, 0.4, g => { const k = K(g); for (let i = 0; i < 6; i++) { const b = k.b(0.4, 0.05, 0.3, [0xf4f4f4, 0xe84a3a, 0x3a5a8a, 0xfff4d0][i % 4], 0, 0.025 + i * 0.05, 0, 0.005); b.rotation.y = Math.sin(i * 2) * 0.15; } const tie = k.b(0.02, 0.31, 0.32, 0xd8c8a0, 0, 0.15, 0, 0.003); }, {});
  def('k_crumpled', '구겨진 종이 & 악보', 'misc', 100, 0.8, 0.6, g => { const k = K(g); for (let i = 0; i < 3; i++) k.add(mesh(geo('crump', () => new THREE.IcosahedronGeometry(0.06, 0)), M(0xf4f4f4), -0.3 + i * 0.25, 0.05, Math.sin(i * 2) * 0.2)); for (let i = 0; i < 2; i++) k.b(0.26, 0.004, 0.2, 0xfaf8f0, 0.1 + i * 0.2, 0.004, 0.1 - i * 0.15, 0.001).rotation.y = i; }, { flat: true });
  def('k_metal_bed', '싱글 메탈 침대', 'rest', 1600, 1.1, 2.1, g => { const k = K(g); k.b(1.0, 0.1, 2.0, 0x2b2b30, 0, 0.32, 0, 0.02); for (const x of [-0.5, 0.5]) for (const z of [-0.98, 0.98]) k.c(0.02, 0.02, 0.35, 0x2b2b30, x, 0.17, z); k.b(0.96, 0.16, 1.95, 0xf4f6f8, 0, 0.45, 0, 0.05); k.b(1.0, 0.1, 1.2, 0x8fb0d0, 0, 0.55, 0.35, 0.04); k.b(0.6, 0.12, 0.3, 0xffffff, 0, 0.6, -0.75, 0.05); k.b(1.0, 0.7, 0.04, 0x2b2b30, 0, 0.62, -1.0, 0.01); }, { grade: 1, bed: { top: 0.56, headZ: -0.39, color: 0x8fb0d0 }, use: [{ pose: 'sleep', dx: 0, dz: 0, face: 0, act: 'sleep' }], tags: ['bed'] });
  def('k_concrete_box', '콘크리트 수납 박스', 'work', 500, 0.7, 0.55, g => { const k = K(g); k.b(0.66, 0.5, 0.5, 0x7a7c80, 0, 0.25, 0, 0.02); k.b(0.3, 0.15, 0.3, 0x2b2b30, 0.1, 0.57, 0, 0.02); }, {});

  // ===================== 채움 소품 (방이 휑하지 않게) =====================
  const cushion = (id, name, c1, c2) => def(id, name, 'rest', 300, 0.6, 0.6, g => { const k = K(g); k.s(0.26, c1, 0, 0.08, 0, 1, 0.32, 1); k.s(0.26, c2, 0, 0.1, 0, 0.55, 0.3, 0.55); k.s(0.02, c1, 0, 0.19, 0); }, { use: [{ pose: 'sit', dx: 0, dz: 0, face: 0, act: 'sit', seatH: 0.17 }], tags: ['chair'] });
  cushion('k_cushion_green', '초록 방석', 0x9ac070, 0xcfe6a8); cushion('k_cushion_blue', '파랑 방석', 0x7aa8e8, 0xc8e0ff); cushion('k_cushion_pink', '핑크 방석', 0xff9ab4, 0xffd8e2); cushion('k_cushion_gray', '회색 방석', 0x55585e, 0x8a8e94);
  const basket = (id, name, c) => def(id, name, 'misc', 500, 0.6, 0.6, g => { const k = K(g); k.add(mesh(lathe2('bskt', [[0.18, 0], [0.24, 0.1], [0.26, 0.34]]), T.woodgrain(0xd8b078), 0, 0, 0)); k.t(0.26, 0.02, 0xc89a60, 0, 0.34, 0).rotation.x = PI / 2; const bl = k.s(0.2, c, 0.02, 0.38, 0, 1.1, 0.5, 1); bl.rotation.z = 0.3; k.b(0.25, 0.3, 0.05, c, 0.18, 0.3, 0.08, 0.05).rotation.z = -0.6; }, {});
  basket('k_basket_green', '담요 바구니 (초록)', 0xb8d890); basket('k_basket_pink', '담요 바구니 (핑크)', 0xffc0cc); basket('k_basket_blue', '담요 바구니 (파랑)', 0xa8c8f0);
  def('k_books_floor', '바닥 책 더미', 'misc', 300, 0.5, 0.4, g => { const k = K(g); [0xc0392b, 0x3a6a4a, 0xe8c070, 0x3a5a8a, 0xfff4e0].forEach((c, i) => { const b = k.b(0.34 - i * 0.02, 0.06, 0.26, c, Math.sin(i * 2) * 0.02, 0.03 + i * 0.06, 0, 0.01); b.rotation.y = Math.sin(i * 3) * 0.2; }); P.mug(k, 0.02, 0.3, 0, 0xffffff); }, { tags: ['books'] });
  def('k_plant_trio', '작은 화분 삼총사', 'misc', 500, 0.6, 0.4, g => { const k = K(g); P.plant(k, -0.16, 0, 0, 1.1, 0xe8845a, 0x6cc36a); P.plant(k, 0.05, 0, 0.05, 0.8, 0xf4f0ea, 0x4a9a4a); P.plant(k, 0.2, 0, -0.04, 0.95, 0x5a8aa0, 0x7cd06a); }, { tags: ['plant'] });
  def('k_fiddle', '떡갈고무나무', 'misc', 900, 0.6, 0.6, g => { const k = K(g); k.c(0.18, 0.14, 0.34, T.woodgrain(0xd8b078), 0, 0.17, 0); k.c(0.025, 0.03, 1.2, 0x6a4a2a, 0, 0.9, 0); for (let i = 0; i < 12; i++) { const a = i * 2.4, y = 0.8 + i * 0.07; const l = k.s(0.12, i % 2 ? 0x3f7a3a : 0x4f9a4a, Math.cos(a) * 0.16, y, Math.sin(a) * 0.16, 0.9, 1.2, 0.25); l.rotation.y = -a; l.rotation.z = Math.cos(a) * 0.4; } }, { tags: ['plant'] });
  // 조명 소품
  def('k_paper_lantern', '종이 등불 스탠드', 'light', 800, 0.5, 0.5, g => { const k = K(g); k.c(0.13, 0.15, 0.04, T.woodgrain(WOOD2), 0, 0.02, 0); k.c(0.015, 0.015, 0.5, WOOD2, 0, 0.27, 0); k.s(0.22, glow(0xfff0c8), 0, 0.72, 0, 1, 1.25, 1); for (let y = 0.5; y < 0.95; y += 0.08) k.t(0.2 * Math.sin(Math.acos((y - 0.72) / 0.28)) + 0.01, 0.006, 0xd8b078, 0, y, 0).rotation.x = PI / 2; }, { tags: ['light'], lamp: [[0, 0.75, 0, 0xffc880, 0.9, 4]] });
  def('k_jelly_lamp', '해파리 무드등', 'light', 900, 0.5, 0.5, g => { const k = K(g); k.c(0.14, 0.16, 0.08, 0xf4f8fa, 0, 0.04, 0); k.add(mesh(geo('jbell', () => new THREE.SphereGeometry(0.22, 24, 12, 0, PI * 2, 0, PI / 2)), glow(0xb8a0ff), 0, 0.72, 0)); for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; for (let j = 0; j < 5; j++) k.s(0.018, glow(j % 2 ? 0xd8c8ff : 0x9ad8ff), Math.cos(a) * 0.14 + Math.sin(j + i) * 0.02, 0.66 - j * 0.1, Math.sin(a) * 0.14); } k.c(0.01, 0.01, 0.62, 0xdfe6ee, 0, 0.35, 0); }, { tags: ['light'], lamp: [[0, 0.7, 0, 0xa890ff, 0.9, 4]] });
  def('k_fishbowl', '어항 스탠드', 'misc', 900, 0.5, 0.5, g => { const k = K(g); k.c(0.03, 0.03, 0.7, 0xf4f8fa, 0, 0.35, 0); k.c(0.18, 0.2, 0.03, 0xf4f8fa, 0, 0.015, 0); k.c(0.14, 0.14, 0.03, 0xf4f8fa, 0, 0.7, 0); k.add(mesh(sphere(0.2), glass(0x8fe0ff), 0, 0.9, 0)); k.s(0.18, glow(0x3a8ad0), 0, 0.86, 0, 1, 0.75, 1).material = new THREE.MeshBasicMaterial({ color: 0x3a8ad0, transparent: true, opacity: 0.55 }); k.s(0.04, 0xff8a3a, 0.04, 0.9, 0.05, 1.4, 1, 0.6); k.s(0.03, 0xffd84a, -0.06, 0.84, -0.02, 1.4, 1, 0.6); P.plant(k, -0.05, 0.72, 0, 0.5, 0x6a5a4a, 0x4ac06a); }, { tags: ['fish'], lamp: [[0, 0.9, 0, 0x4ab0ff, 0.6, 3]] });
  def('k_heart_lamp', '하트 무드등 협탁', 'light', 800, 0.5, 0.45, g => { const k = K(g); k.b(0.44, 0.5, 0.4, 0xffe0e8, 0, 0.25, 0, 0.04); k.b(0.38, 0.12, 0.02, 0xffc8d6, 0, 0.36, 0.2, 0.02); const hs = new THREE.Shape(); hs.moveTo(0, -0.1); hs.bezierCurveTo(-0.2, 0.02, -0.12, 0.16, 0, 0.07); hs.bezierCurveTo(0.12, 0.16, 0.2, 0.02, 0, -0.1); k.add(mesh(geo('hlamp', () => new THREE.ExtrudeGeometry(hs, { depth: 0.08, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 })), glow(0xffb0c8), 0, 0.68, -0.04)); k.s(0.035, 0xfff4e8, 0.08, 0.53, 0.05); }, { tags: ['light'], lamp: [[0, 0.72, 0, 0xff90b0, 0.8, 3.5]] });
  def('k_rose_table', '장미 꽃병 사이드 테이블', 'work', 700, 0.5, 0.5, g => { const k = K(g); k.c(0.22, 0.22, 0.03, 0xfaf6ee, 0, 0.55, 0); k.c(0.03, 0.04, 0.55, 0xfaf6ee, 0, 0.27, 0); k.c(0.14, 0.16, 0.03, 0xfaf6ee, 0, 0.015, 0); k.c(0.05, 0.06, 0.18, glass(0xe0f0ff), 0, 0.66, 0); for (let i = 0; i < 6; i++) k.s(0.045, [0xe84a6a, 0xff8fa8, 0xfff0f0][i % 3], Math.cos(i) * 0.06, 0.8 + (i % 2) * 0.05, Math.sin(i) * 0.06); }, { tags: ['plant'] });
  def('k_plush_pile', '인형 더미', 'misc', 900, 0.8, 0.6, g => { const k = K(g); P.plush(k, -0.15, 0, 0, 0xffc8d4, 'bear', 1.3); P.plush(k, 0.2, 0, 0.05, 0xfff4f0, 'bunny', 1.1); P.plush(k, 0.02, 0, 0.2, 0xfff0a0, 'bear', 0.8); }, { tags: ['plush'], use: [{ pose: 'hug', dx: 0, dz: 0.6, face: 180, act: 'hug_doll' }] });
  def('k_tire_stack', '타이어 스툴', 'rest', 500, 0.7, 0.7, g => { const k = K(g); for (let i = 0; i < 2; i++) k.t(0.25, 0.1, 0x1a1a22, 0, 0.1 + i * 0.2, 0).rotation.x = PI / 2; k.c(0.26, 0.26, 0.04, 0xd83030, 0, 0.42, 0); }, { use: [{ pose: 'sit', dx: 0, dz: 0, face: 0, act: 'sit', seatH: 0.44 }], tags: ['chair'] });
  def('k_ball_basket', '공 바구니', 'misc', 700, 0.6, 0.6, g => { const k = K(g); for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; k.c(0.01, 0.01, 0.5, 0x9aa3ad, Math.cos(a) * 0.24, 0.25, Math.sin(a) * 0.24); } k.t(0.24, 0.012, 0x9aa3ad, 0, 0.5, 0).rotation.x = PI / 2; k.t(0.24, 0.012, 0x9aa3ad, 0, 0.05, 0).rotation.x = PI / 2; [[0xff8a3a, 0.12], [0xffffff, 0.1], [0xffd84a, 0.11], [0x3a6ad0, 0.1]].forEach(([c, r], i) => k.s(r, c, Math.cos(i * 1.7) * 0.1, 0.12 + (i >> 1) * 0.18, Math.sin(i * 1.7) * 0.1)); }, { tags: ['gym'] });
  def('k_cooler', '스포츠 쿨러', 'misc', 500, 0.6, 0.4, g => { const k = K(g); k.b(0.56, 0.36, 0.36, 0x3a6ad0, 0, 0.18, 0, 0.05); k.b(0.58, 0.08, 0.38, 0xf4f4f4, 0, 0.4, 0, 0.04); k.t(0.12, 0.015, 0xf4f4f4, 0, 0.44, 0, PI); }, {});
  def('k_arc_lamp', '아크 플로어 램프', 'light', 1200, 0.8, 0.5, g => { const k = K(g); k.b(0.3, 0.06, 0.3, 0x1a1a1e, 0, 0.03, 0, 0.02); k.c(0.018, 0.018, 1.7, 0x1a1a1e, 0, 0.85, 0); k.t(0.3, 0.018, 0x1a1a1e, 0.3, 1.7, 0, PI); k.c(0.01, 0.01, 0.1, 0x1a1a1e, 0.6, 1.66, 0); k.add(mesh(geo('arcshade', () => new THREE.SphereGeometry(0.16, 20, 10, 0, PI * 2, 0, PI / 2)), M(0x1a1a1e), 0.6, 1.5, 0)); k.s(0.06, glow(0xffe0b0), 0.6, 1.47, 0); }, { tags: ['light'], lamp: [[0.6, 1.35, 0, 0xffc890, 1.0, 4.5]] });
  def('k_vinyl_crate', '레코드 크레이트', 'misc', 700, 0.5, 0.4, g => { const k = K(g); k.b(0.46, 0.34, 0.36, T.woodgrain(0xa87a58), 0, 0.17, 0, 0.01); for (let i = 0; i < 7; i++) { const r = k.b(0.02, 0.3, 0.3, [0x1a1a1e, 0xe84a3a, 0x3a5a8a, 0xffd84a][i % 4], -0.15 + i * 0.05, 0.3, 0, 0.005); r.rotation.z = 0.12; } }, { tags: ['music'] });
  // 벽 채움
  def('k_pressed_frame', '압화 액자', 'wall', 500, 0.4, 0.1, g => { const k = K(g); k.b(0.36, 0.46, 0.03, T.woodgrain(WOOD), 0, 1.8, 0.02, 0.01); k.p(0.28, 0.38, picMat('pressed', (c, w, h) => { c.fillStyle = '#fbf6e8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#7a9a5a'; c.lineWidth = 3; c.beginPath(); c.moveTo(64, 120); c.lineTo(64, 40); c.stroke(); for (let i = 0; i < 5; i++) { c.fillStyle = ['#e8a060', '#f0c070', '#d08870'][i % 3]; c.beginPath(); c.arc(64 + (i % 2 ? 14 : -14), 40 + i * 14, 8, 0, 7); c.fill(); } }), 0, 1.8, 0.04); }, { wall: true, tags: ['frame'] });
  def('k_wall_planter', '벽걸이 화분', 'wall', 500, 0.4, 0.3, g => { const k = K(g); k.b(0.04, 0.04, 0.2, 0x3a3a3a, 0, 1.95, 0.1); k.c(0.1, 0.08, 0.14, 0xe8845a, 0, 1.8, 0.22); for (let i = 0; i < 7; i++) k.s(0.045, 0x5fae5a, Math.sin(i) * 0.08, 1.9 - (i % 3) * 0.12, 0.25, 1, 1.3, 0.6); }, { wall: true, tags: ['plant'] });
  def('k_wood_clock', '원목 벽시계', 'wall', 500, 0.4, 0.1, g => { const k = K(g); k.c(0.16, 0.16, 0.05, T.woodgrain(WOOD2), 0, 2.1, 0.03).rotation.x = PI / 2; k.p(0.26, 0.26, picMat('wclk', (c, w, h) => { c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(64, 64, 62, 0, 7); c.fill(); c.strokeStyle = '#5a3a2a'; c.lineWidth = 5; c.beginPath(); c.moveTo(64, 64); c.lineTo(64, 28); c.moveTo(64, 64); c.lineTo(90, 72); c.stroke(); }), 0, 2.1, 0.06); }, { wall: true });
  def('k_shell_shelf', '조개 벽선반', 'wall', 600, 0.8, 0.3, g => { const k = K(g); k.b(0.8, 0.04, 0.22, 0xffffff, 0, 1.9, 0.11, 0.01); [[0xfff0e8, -0.25], [0xffd0c0, 0], [0xf4f8ff, 0.25]].forEach(([c, x]) => { const sh = k.s(0.07, c, x, 1.97, 0.11, 1, 0.8, 0.5); sh.rotation.x = -0.5; }); k.add(mesh(sphere(0.06), glass(0xc8f0ff), 0.12, 1.98, 0.1)); }, { wall: true });
  def('k_neon_wave', '물결 네온', 'wall', 700, 0.9, 0.1, g => { const k = K(g); for (let i = 0; i < 9; i++) k.s(0.03, glow(0x6ae0ff), -0.4 + i * 0.1, 2.35 + Math.sin(i * 1.1) * 0.06, 0.05); }, { wall: true, tags: ['light'], lamp: [[0, 2.3, 0.3, 0x5ad0ff, 0.5, 3]] });
  def('k_heart_mirror', '하트 벽거울', 'wall', 600, 0.5, 0.1, g => { const k = K(g); const hs = new THREE.Shape(); hs.moveTo(0, -0.2); hs.bezierCurveTo(-0.36, 0.04, -0.22, 0.3, 0, 0.14); hs.bezierCurveTo(0.22, 0.3, 0.36, 0.04, 0, -0.2); k.add(mesh(geo('hmir', () => new THREE.ExtrudeGeometry(hs, { depth: 0.03, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.02 })), M(0xffb0c4), 0, 1.75, 0.01)); const m = k.add(mesh(geo('hmir2', () => new THREE.ShapeGeometry(hs)), glass(0xe8f4ff), 0, 1.75, 0.07)); m.scale.set(0.8, 0.8, 1); }, { wall: true, tags: ['mirror'] });
  def('k_neon_bolt', '번개 네온 사인', 'wall', 700, 0.5, 0.1, g => { const k = K(g); const bs = new THREE.Shape(); bs.moveTo(0.05, 0.25); bs.lineTo(-0.1, 0); bs.lineTo(0.01, 0); bs.lineTo(-0.05, -0.25); bs.lineTo(0.12, 0.04); bs.lineTo(0.01, 0.04); bs.lineTo(0.05, 0.25); k.add(mesh(geo('bolt', () => new THREE.ShapeGeometry(bs)), glow(0xffe14a), 0, 2.1, 0.04)); }, { wall: true, tags: ['light'], lamp: [[0, 2.1, 0.3, 0xffd040, 0.5, 3]] });
  def('k_band_poster', '밴드 포스터', 'wall', 500, 0.5, 0.1, g => { const k = K(g); k.p(0.46, 0.64, picMat('band', (c, w, h) => { c.fillStyle = '#1a1a1e'; c.fillRect(0, 0, w, h); c.fillStyle = '#e84a3a'; c.font = 'bold 26px sans-serif'; c.textAlign = 'center'; c.fillText('ROCK', 64, 40); c.strokeStyle = '#f4f4f4'; c.lineWidth = 4; c.beginPath(); c.arc(64, 84, 22, 0, 7); c.stroke(); c.fillStyle = '#f4f4f4'; c.fillRect(60, 60, 8, 40); }), 0, 1.9, 0.03); }, { wall: true, tags: ['frame'] });

  // 어느 방에나 어울리는 작은 채움 소품
  def('k_candle_cluster', '캔들 모음', 'light', 400, 0.4, 0.4, g => { const k = K(g); k.c(0.18, 0.18, 0.02, 0xd8c8b0, 0, 0.01, 0); [[0, 0, 0.2], [0.09, 0.05, 0.13], [-0.08, 0.06, 0.1], [0.02, -0.09, 0.08]].forEach(([x, z, h]) => { k.c(0.04, 0.04, h, 0xfaf4e8, x, 0.02 + h / 2, z); k.s(0.018, glow(0xffc060), x, 0.05 + h, z, 1, 1.6, 1); }); }, { tags: ['light'], lamp: [[0, 0.3, 0, 0xffa850, 0.45, 2.5]] });
  def('k_crate_stack', '나무 상자 더미', 'misc', 500, 0.6, 0.45, g => { const k = K(g), wd = T.woodgrain(0xd8b078); k.b(0.5, 0.3, 0.4, wd, 0, 0.15, 0, 0.01); k.b(0.4, 0.26, 0.34, wd, 0.03, 0.43, 0, 0.01); for (const y of [0.15, 0.43]) k.b(0.52, 0.03, 0.02, 0xa87a4a, 0, y, 0.2); P.plant(k, 0.05, 0.56, 0, 0.7); P.book(k, -0.12, 0.3, 0.05, 0x5a7ab0).rotation.x = PI / 2; }, {});
  def('k_side_table_plant', '사이드 테이블 & 화분', 'work', 600, 0.45, 0.45, g => { const k = K(g), wd = T.woodgrain(0xc99060); k.c(0.2, 0.2, 0.03, wd, 0, 0.5, 0); for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2; k.c(0.015, 0.015, 0.5, wd, Math.cos(a) * 0.13, 0.25, Math.sin(a) * 0.13); } P.plant(k, 0.02, 0.52, 0, 0.8); P.mug(k, -0.1, 0.52, 0.08, 0xfaf6ee); }, { tags: ['plant'] });
  def('k_floor_vase', '큰 꽃병', 'misc', 500, 0.4, 0.4, g => { const k = K(g); k.add(mesh(lathe2('fvase', [[0.08, 0], [0.16, 0.18], [0.12, 0.45], [0.07, 0.55], [0.09, 0.6]]), M(0xe8ddd0), 0, 0, 0)); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; k.c(0.006, 0.006, 0.5, 0x8a7a5a, Math.cos(a) * 0.04, 0.82, Math.sin(a) * 0.04).rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); k.s(0.035, [0xf4ecd8, 0xe8c8a0, 0xd8b890][i % 3], Math.cos(a) * 0.12, 1.06, Math.sin(a) * 0.12, 1, 1.4, 1); } }, { tags: ['plant'] });
  def('k_round_stool', '동글 스툴', 'rest', 300, 0.45, 0.45, g => { const k = K(g); k.c(0.19, 0.19, 0.08, 0xe8d8c0, 0, 0.42, 0); k.s(0.19, 0xf4e8d8, 0, 0.46, 0, 1, 0.2, 1); for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2; const l = k.c(0.018, 0.024, 0.4, 0xa87a4a, Math.cos(a) * 0.12, 0.2, Math.sin(a) * 0.12); l.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12); } }, { use: [{ pose: 'sit', dx: 0, dz: 0, face: 0, act: 'sit', seatH: 0.5 }], tags: ['chair'] });

  // 기존 키트 가구의 실제 발광 (가구 위치에서 색 있는 빛)
  const LAMP = {
    k_lava_lamp: [[0, 0.8, 0, 0xc8ff70, 0.9, 3.5]], k_fringe_lamp: [[0, 1.4, 0, 0xffb0c0, 0.9, 4.5]], k_nightstand_lamp: [[0, 0.9, 0, 0xffc8b8, 0.7, 3.5]], k_geo_pendant: [[0, 2.2, 0, 0xffc890, 0.8, 5]],
    k_aqua_ledge: [[-0.85, 0.9, 0.3, 0xd8ecff, 0.7, 3.5], [0.4, 1.4, 0.2, 0x3a8aff, 0.9, 6]], k_glow_vines: [[0, 2.3, 0.4, 0x9aff90, 0.35, 3]], k_white_desk_pc: [[-0.1, 1.1, 0.3, 0x9ad8ff, 0.4, 2.5]],
    k_noren: [[0, 1.5, 0.5, 0xfff0c8, 0.6, 4]], k_white_window: [[0, 1.6, 0.5, 0xfff4e8, 0.5, 4]], k_city_window: [[0, 1.6, 0.6, 0xffa070, 0.9, 6]], k_blinds_window: [[0, 1.6, 0.4, 0xfff0d8, 0.4, 3]],
    k_neon_tube: [[0, 1.8, 0.3, 0x5ac8ff, 0.6, 3.5]], k_neon_clock: [[0, 2.4, 0.3, 0xff5050, 0.45, 3]], k_crt_tv: [[0, 0.8, 0.5, 0x8ab0ff, 0.45, 3]], k_big_tv: [[0, 1.75, 0.4, 0xffe0b0, 0.4, 3]], k_wall_tv: [[0, 2.1, 0.4, 0x6aa0ff, 0.35, 3]],
    k_trophy_cabinet: [[0, 1.3, 0.35, 0xffe0a0, 0.45, 2.5]], k_nightstand_rec: [[0, 1.0, 0.2, 0xffd8a0, 0.3, 2.5]],
  };
  for (const [id, l] of Object.entries(LAMP)) if (F[id]) F[id].lamp = l;

  function lathe2(key, pts) { return geo('rkl' + key, () => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(Math.max(0.001, x), y)), 24)); }

  // ---------------------------------------------------------
  // 스타일 정의 (8×6 기준 배치 — 큰 방은 벽 기준으로 자동 늘림)
  //  아파트 문(뒤 오른쪽 3.2,-2.6) / 빌라 문(앞 가운데) 자리는 비워둠
  // ---------------------------------------------------------
  const f = (type, x, z, rot = 0) => ({ type, x, z, rot });
  const STYLES = {
    cottage: {
      name: '🌿 초록 코티지', desc: '로프트 침대 · 깅엄 소파 · 티피 텐트 · 쇼지 창 · 말린 꽃',
      wall: 'mustard', wallL: 'shoji', wallR: 'shoji', floor: 'wood', floorColor: 0xe0a870, beams: 0xc98f55,
      aff: { L1: { SCHOLARLY: 3, LAZY: 3, INTROVERT: 2, ANXIOUS: 1 }, L2: { HOMEBODY: 2, EARLY_BIRD: 1, DILIGENT: 1 }, L3: { WARM: 2, SHY: 1, DREAMY: 1 }, L4: { GARDEN: 3, STUDY: 2, FOOD: 1 } },
      furn: [f('k_rug_round_green', -0.6, -1.5), f('k_rug_gingham', -1.3, 1.25), f('k_loftbed', -0.7, -2.33), f('k_green_chair', -1.15, -1.45, 180), f('k_nightstand_rec', 1.05, -2.7), f('k_plush_shelf', 1.1, -2.94),
        f('k_noren', 2.9, -2.94), f('k_green_cabinet', 3.38, -0.4, -90), f('k_wall_books', 3.94, 0.9, -90), f('k_teepee', -3.0, 1.9, 30), f('k_cat_plush', -1.9, 0.75, 20), f('k_papers', -0.9, 0.55),
        f('k_gingham_sofa', 0.95, 1.7, -90), f('k_pouf', 1.75, 0.35), f('k_stool_can', 1.85, -1.3), f('k_old_tv_wood', 3.3, 1.5, -90), f('k_anthurium', 3.2, 2.5, -90),
        f('k_hang_ivy', -3.94, -1.9, 90), f('k_dried_garland', -3.94, 0.3, 90), f('k_geo_pendant', -0.3, -0.4)],
    },
    aqua: {
      name: '🐠 아쿠아리움 밤 방', desc: '수족관 벽 · 빛나는 덩굴 · 패치워크 침대 · 지구 러그 · 용암등',
      wall: 'aquarium', wallL: 'whiteplain', wallR: 'tile', floor: 'wood', floorColor: 0xc8ced6,
      aff: { L1: { INTROVERT: 3, ANXIOUS: 3, ARTISTIC: 2, SCHOLARLY: 1 }, L2: { NIGHT_OWL: 3, CURIOUS: 1, HOMEBODY: 1 }, L3: { DREAMY: 3, SHY: 1, CYNICAL: 1 }, L4: { FISHING: 3, OCCULT: 2, CLEAN: 2, STUDY: 1 } },
      furn: [f('k_aqua_ledge', -1.6, -2.72), f('k_tall_shelf_white', 0.55, -2.74), f('k_rug_fluffy_gray', -2.3, -0.6), f('k_patch_bed', -2.5, -1.2), f('k_rug_globe', 2.1, 0.5),
        f('k_white_desk_pc', 3.62, 0.3, -90), f('k_gaming_chair', 2.65, 0.3, 90), f('k_hang_terrarium', 3.94, -0.6, -90), f('k_lava_lamp', 3.4, 1.9), f('k_leaf_table', 1.3, 1.4), f('k_palm_pot', -3.3, 1.7),
        f('k_glow_vines', -1.5, -2.94), f('k_glow_vines', 1.9, -2.94), f('k_glow_vines', 3.94, 1.2, -90), f('k_fish_school', 1.6, -2.94), f('k_pendant_bulb', -0.5, 0.2)],
    },
    pink: {
      name: '🍒 핑크 로맨틱', desc: '핑크 판벽 · 장미 벽지 · 체리 침대 · 에그 체어 · 레이스 도일리',
      wall: 'rosepaper', wallL: 'pinkplank', wallR: 'rosepaper', floor: 'wood', floorColor: 0x7a4a34,
      aff: { L1: { ROMANTIC: 3, SNOB: 1, ANXIOUS: 1, EXTROVERT: 1 }, L2: { HOMEBODY: 1, BUSYBODY: 1 }, L3: { CUTE: 3, WARM: 1, SHY: 1 }, L4: { FASHION: 3, GOSSIP: 2, FOOD: 2, GARDEN: 1 } },
      furn: [f('k_rug_woven_green', -2.3, -0.9), f('k_rug_fluffy_white', 1.2, 0.1), f('k_white_window', -3.94, -1.2, 90), f('k_fringe_lamp', -3.5, -2.6), f('k_phone_shelf', -2.75, -2.75), f('k_cube_shelf', -1.3, -2.76),
        f('k_egg_chair', -1.45, -1.6), f('k_patch_sofa', -3.45, 0.5, 90), f('k_tea_table', -2.5, 0.2), f('k_ornate_mirror', 0.2, -2.82), f('k_nightstand_lamp', 0.85, -2.74), f('k_cherry_bed', 1.6, -1.8),
        f('k_cushion_ottoman', 0.5, -0.3), f('k_round_cloth_table', 3.2, -0.3), f('k_pink_stool_clothes', 2.4, 0.9), f('k_clothes_rack_white', 3.5, 1.0, -90), f('k_wardrobe_white', 3.5, 2.4, -90),
        f('k_heart_chair', -1.4, 2.3, 180), f('k_heart_chair', 1.8, 2.3, 180),
        f('k_rose_oval', -3.94, -2.3, 90), f('k_doily', -0.8, -2.94), f('k_ribbon_deco', 1.2, -2.94), f('k_rose_frame', 2.0, -2.94), f('k_embroid_frame', 2.3, -2.94), f('k_moon_clock', 3.1, -2.94), f('k_dried_roses', 3.94, -2.3, -90)],
    },
    garage: {
      name: '🏆 스포티 개러지', desc: '블루 판벽 · 트로피장 · 레이싱카 침대 · 벤치 프레스 · 전자 작업대',
      wall: 'blueplank', floor: 'slate', floorColor: 0x5a6068,
      aff: { L1: { ATHLETIC: 3, EXTROVERT: 2, CRANKY: 1 }, L2: { WANDERER: 1, BUSYBODY: 1, EARLY_BIRD: 1 }, L3: { PASSIONATE: 3, PRANKSTER: 2 }, L4: { FITNESS: 3, MUSIC: 1, FISHING: 1 } },
      furn: [f('k_drink_shelf', -3.2, -2.72), f('k_boombox', -2.85, -2.7), f('k_trophy_cabinet', -1.55, -2.7), f('k_car_bed', 0.2, -1.85), f('k_box_stack', 1.45, -2.7), f('k_punch_bag', 2.0, -1.1),
        f('k_weight_bench', 2.7, 0.3, -90), f('k_fridge_red', 3.6, 1.4, -90), f('k_stove_ramen', 3.6, 2.4, -90), f('k_metal_rack', -3.68, -0.6, 90), f('k_leather_sofa', -3.45, 1.35, 90),
        f('k_elec_bench', -1.3, 1.0), f('k_folding_chair', -1.3, 1.75, 180), f('k_kettlebell', 0.8, 0.4), f('k_skateboard', 1.6, 2.4, 20),
        f('k_wall_tv', -3.2, -2.94), f('k_neon_clock', -2.2, -2.94), f('k_big_tv', -0.2, -2.94), f('k_pennant', -3.94, 1.3, 90), f('k_fish_wall', 3.94, -1.6, -90), f('k_skate_rack', 3.94, 0.4, -90), f('k_bike_poster', 3.94, 2.3, -90), f('k_field_frame', 1.3, -2.94),
        f('k_pendant_bulb', -1.3, -1.1), f('k_pendant_bulb', 1.3, -0.5), f('k_pendant_bulb', 0.1, 1.1)],
    },
    loft: {
      name: '🏙️ 콘크리트 로프트', desc: '도시 전망 통창 · 블랙 가죽 소파 · CRT TV · 기타 & 앰프 · 노출 콘크리트',
      wall: 'concrete', floor: 'slate', floorColor: 0x4a4a52, pillar: true,
      aff: { L1: { CRANKY: 3, SNOB: 2, INTROVERT: 1, ARTISTIC: 1 }, L2: { NIGHT_OWL: 2, SLOTH: 2, WANDERER: 1 }, L3: { CYNICAL: 3, FORMAL: 1 }, L4: { MUSIC: 3, FASHION: 1 } },
      furn: [f('k_kitchen_counter', -2.95, -2.65), f('k_fridge_black', -1.7, -2.68), f('k_hang_dish_shelf', -3.0, -2.94), f('k_knife_rack', -3.94, -1.6, 90), f('k_skate_rack', -1.1, -2.94),
        f('k_city_window', 1.0, -2.94), f('k_black_sofa', 0.8, -2.45), f('k_black_table', 0.8, -1.25), f('k_station_clock', -0.4, -2.94),
        f('k_clothes_rack_black', 2.1, -0.2), f('k_crt_tv', 3.5, -0.9, -90), f('k_blinds_window', 3.94, -2.1, -90), f('k_metal_shelf_wall', 3.94, -0.9, -90), f('k_neon_tube', 3.94, 0.2, -90), f('k_bridge_frame', 3.94, 0.8, -90), f('k_speed_sign', 3.94, 1.8, -90),
        f('k_metal_bed', 2.95, 1.9, -90), f('k_magazines', 1.9, 1.0), f('k_guitar_stand', 1.2, 1.1), f('k_amp', -1.5, 2.3, 180), f('k_crumpled', 0.6, 0.4), f('k_magazines', -2.9, 1.6), f('k_concrete_box', -3.5, 0.5, 90),
        f('k_pendant_bulb', -2.2, -1.0), f('k_pendant_bulb', 1.0, 0.2)],
    },
  };

  // 분위기 (실내 전체 조명 톤) + 채움 소품 + 기본 배치 보강
  Object.assign(STYLES.cottage, {
    mood: { main: 0.75, hemi: [0xfff0d0, 0x8a6a40, 0.46], amb: [0xffdca8, 0.12], dir: [0xffe8b8, 0.36], bg: 0x3a2e24 },
    fill: ['k_plant_trio', 'k_basket_green', 'k_books_floor', 'k_cushion_green', 'k_fiddle', 'k_paper_lantern', 'k_stool_can', 'k_cushion_green', 'k_plant_trio', 'k_books_floor'],
    wallFill: ['k_pressed_frame', 'k_wall_planter', 'k_wood_clock', 'k_hang_ivy', 'k_pressed_frame', 'k_dried_garland'],
  });
  STYLES.cottage.furn.push(f('k_paper_lantern', 0.2, 2.3), f('k_basket_green', -2.05, -2.7), f('k_books_floor', 2.2, -2.55), f('k_wood_clock', -2.5, -2.94), f('k_pressed_frame', -3.94, -0.8, 90));
  Object.assign(STYLES.aqua, {
    mood: { main: 0.12, lamp: 0.42, hemi: [0x4a78d0, 0x0a1430, 0.17], amb: [0x2a4a98, 0.08], dir: [0x8ab0ff, 0.05], bg: 0x070e1e },
    fill: ['k_jelly_lamp', 'k_cushion_blue', 'k_fishbowl', 'k_basket_blue', 'k_fiddle', 'k_books_floor', 'k_cushion_blue', 'k_plant_trio', 'k_palm_pot'],
    wallFill: ['k_shell_shelf', 'k_neon_wave', 'k_fish_school', 'k_hang_terrarium', 'k_glow_vines'],
  });
  STYLES.aqua.furn.push(f('k_jelly_lamp', -3.4, -0.2), f('k_fishbowl', 1.55, -2.7), f('k_cushion_blue', 0.9, 0.6), f('k_shell_shelf', -3.94, -1.0, 90), f('k_neon_wave', 3.94, 2.3, -90));
  Object.assign(STYLES.pink, {
    mood: { main: 0.8, hemi: [0xffe4ec, 0x8a5a50, 0.44], amb: [0xffd0dc, 0.13], dir: [0xfff0e0, 0.3], bg: 0x3a2630 },
    fill: ['k_heart_lamp', 'k_cushion_pink', 'k_rose_table', 'k_basket_pink', 'k_plush_pile', 'k_books_floor', 'k_cushion_pink', 'k_plant_trio', 'k_fiddle'],
    wallFill: ['k_heart_mirror', 'k_ribbon_deco', 'k_embroid_frame', 'k_rose_oval', 'k_rose_frame', 'k_doily'],
  });
  STYLES.pink.furn.push(f('k_heart_lamp', 2.55, -2.72), f('k_plush_pile', -0.1, 1.2), f('k_rose_table', -3.5, 1.9), f('k_heart_mirror', 0.2, -2.94), f('k_basket_pink', 2.4, 2.5));
  Object.assign(STYLES.garage, {
    mood: { main: 0.35, lamp: 0.8, hemi: [0x8aa0e8, 0x20202e, 0.26], amb: [0x6078c0, 0.08], dir: [0xa8c0ff, 0.12], bg: 0x10141f },
    fill: ['k_tire_stack', 'k_ball_basket', 'k_cooler', 'k_kettlebell', 'k_box_stack', 'k_cushion_gray', 'k_skateboard', 'k_tire_stack', 'k_plant_trio'],
    wallFill: ['k_neon_bolt', 'k_pennant', 'k_bike_poster', 'k_fish_wall', 'k_skate_rack'],
  });
  STYLES.garage.furn.push(f('k_ball_basket', 3.4, -0.9), f('k_cooler', -2.4, 2.4), f('k_tire_stack', -0.3, 2.35), f('k_neon_bolt', 0.6, -2.94), f('k_kettlebell', 1.2, 0.8));
  Object.assign(STYLES.loft, {
    mood: { main: 0.3, lamp: 0.85, hemi: [0xd8c0c0, 0x222228, 0.24], amb: [0xffb898, 0.07], dir: [0xff9a68, 0.36], bg: 0x141418 },
    fill: ['k_arc_lamp', 'k_vinyl_crate', 'k_magazines', 'k_fiddle', 'k_cushion_gray', 'k_concrete_box', 'k_books_floor', 'k_plant_trio', 'k_crumpled'],
    wallFill: ['k_band_poster', 'k_neon_tube', 'k_bridge_frame', 'k_speed_sign', 'k_station_clock'],
  });
  STYLES.loft.furn.push(f('k_arc_lamp', -0.6, -2.35), f('k_vinyl_crate', 2.35, -1.2), f('k_fiddle', -3.4, -1.3), f('k_band_poster', -3.94, 1.0, 90), f('k_cushion_gray', 0.2, 1.7));

  // 성격 조합 → 스타일 점수 (L1 가중치 가장 큼)
  function styleScore(keys, id) {
    const a = STYLES[id].aff; let s = 0;
    s += 3 * ((a.L1 || {})[keys.L1] || 0) + 1.2 * ((a.L2 || {})[keys.L2] || 0) + 1.2 * ((a.L3 || {})[keys.L3] || 0) + 2 * ((a.L4 || {})[keys.L4] || 0);
    return s;
  }
  function pickStyle(keys, seed = 0) {
    const ranked = Object.keys(STYLES).map(id => [id, styleScore(keys, id) + ((seed >>> (id.length * 3)) % 7) * 0.05]).sort((a, b) => b[1] - a[1]);
    return ranked[0][0];
  }
  // 스타일이 이 주민에게 얼마나 맞는지 (0~1)
  function styleFit(keys, id) {
    const best = Math.max(...Object.keys(STYLES).map(s => styleScore(keys, s)));
    return best > 0 ? styleScore(keys, id) / best : 0.5;
  }
  // 8×6 좌표 → 실제 방 크기 (벽에 붙은 건 벽 기준으로, 가운데는 비율로)
  function place(x, z, w, d, F) {
    const hx = w / 2, hz = d / 2;
    const X = Math.abs(x) > 2.5 ? Math.sign(x) * (hx - (4 - Math.abs(x))) : x * hx / 4;
    const Z = z < -1.5 ? -hz + (z + 3) : z > 1.5 ? hz - (3 - z) : z * hz / 3;
    return [+X.toFixed(2), +Z.toFixed(2)];
  }
  // 가구 바닥 사각형 (회전 반영)
  const rectOf = (Fd, x, z, r) => { const q = Math.abs(Math.round(r / 90)) % 2 === 1; const fw = (q ? Fd.d : Fd.w) / 2, fd = (q ? Fd.w : Fd.d) / 2; return [x - fw, z - fd, x + fw, z + fd]; };
  const hit = (a, b, m = 0.12) => a[0] < b[2] + m && a[2] > b[0] - m && a[1] < b[3] + m && a[3] > b[1] - m;
  function styleRoom(styleId, w = 8, d = 6, door, seedIn = 0, keys = {}) {
    const S = STYLES[styleId]; if (!S) return null;
    const furn = S.furn.filter(x => F[x.type]).map(x => { const [X, Z] = place(x.x, x.z, w, d, F[x.type]); return { type: x.type, x: X, z: Z, rot: x.rot || 0, mat: null, color: null }; });
    // 빈 곳 채우기 (휑하지 않게 촘촘히) — 현관 · 가운데 통로 · 가구 쓰는 자리는 비워 둠
    const hx = w / 2, hz = d / 2, dr = door || { x: 3.2 * hx / 4, z: -hz + 0.4 };
    const keep = [[dr.x - 0.9, dr.z - 1.1, dr.x + 0.9, dr.z + 1.1]];
    // 문 → 방 가운데 통로
    keep.push([Math.min(dr.x, 0) - 0.45, Math.min(dr.z, 0) - 0.45, Math.max(dr.x, 0) + 0.45, Math.max(dr.z, 0) + 0.45]);
    const floorR = [];
    for (const o of furn) {
      const Fd = F[o.type]; if (Fd.wall || Fd.ceiling) continue;
      if (!Fd.flat) floorR.push(rectOf(Fd, o.x, o.z, o.rot));
      for (const u of Fd.use || []) { if (Math.hypot(u.dx, u.dz) < 0.45) continue; const r = (o.rot || 0) * PI / 180, ux = o.x + u.dx * Math.cos(r) + u.dz * Math.sin(r), uz = o.z - u.dx * Math.sin(r) + u.dz * Math.cos(r); keep.push([ux - 0.35, uz - 0.35, ux + 0.35, uz + 0.35]); }
    }
    const wallR = furn.filter(o => F[o.type].wall).map(o => ({ side: Math.abs(o.z + hz) < 0.2 ? 'b' : o.x < 0 ? 'l' : 'r', a: Math.abs(o.z + hz) < 0.2 ? o.x : o.z, hw: F[o.type].w / 2 }));
    let seed = (w * 131 + d * 17 + styleId.length * 7 + (seedIn | 0)) | 0; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const NEUTRAL = ['k_candle_cluster', 'k_crate_stack', 'k_side_table_plant', 'k_floor_vase', 'k_round_stool', 'k_plant_trio'];
    const pool = [...S.fill, ...S.fill, ...NEUTRAL];
    const dens = S.density || 1, nFloor = Math.round((Math.round(w * d * 0.2) + 3) * dens), nWall = Math.round((w + 2 * d) / 1.5 * Math.min(1.6, dens));   // density: 촘촘한 스타일
    let fi = Math.floor(rnd() * pool.length);
    for (let tries = 0, placed = 0; tries < 1400 && placed < nFloor; tries++) {
      const type = pool[fi % pool.length], Fd = F[type]; fi++; if (!Fd) continue;
      if (furn.filter(o => o.type === type).length >= (S.maxSame || 2)) continue;   // 같은 소품은 최대 2개 (스타일별 조정)
      // 벽 · 모서리 가까이 (80%) 또는 가구 곁 빈 바닥
      let x, z, r = 0;
      const m = Math.max(Fd.w, Fd.d) / 2 + 0.05;
      if (rnd() < 0.8) { const side = Math.floor(rnd() * 4); if (side === 0) { x = -hx + m + rnd() * (w - 2 * m); z = -hz + m; } else if (side === 1) { x = -hx + m; z = -hz + m + rnd() * (d - 2 * m); } else if (side === 2) { x = hx - m; z = -hz + m + rnd() * (d - 2 * m); } else { x = -hx + m + rnd() * (w - 2 * m); z = hz - m; } }
      else { x = (rnd() - 0.5) * (w - 1.2); z = (rnd() - 0.5) * (d - 1.2); r = Math.round((rnd() - 0.5) * 50); }
      const R = rectOf(Fd, x, z, r);
      if (R[0] < -hx || R[2] > hx || R[1] < -hz || R[3] > hz || keep.some(k => hit(R, k, 0)) || floorR.some(o => hit(R, o, 0.05))) continue;
      floorR.push(R); furn.push({ type, x: +x.toFixed(2), z: +z.toFixed(2), rot: r, mat: null, color: null }); placed++;
    }
    let wi = Math.floor(rnd() * S.wallFill.length);
    for (let tries = 0, placed = 0; tries < 400 && placed < nWall; tries++) {
      const type = S.wallFill[wi % S.wallFill.length], Fd = F[type]; wi++; if (!Fd) continue;
      const isClock = t => /clock/.test(t);
      if (furn.filter(o => o.type === type).length >= 2 || (isClock(type) && furn.some(o => isClock(o.type)))) continue;   // 시계는 한 개, 나머지는 최대 2개
      const side = ['b', 'l', 'r', 'l', 'r'][Math.floor(rnd() * 5)], len = side === 'b' ? w : d, a = (rnd() - 0.5) * (len - Fd.w - 0.3);
      if (wallR.some(o => o.side === side && Math.abs(o.a - a) < o.hw + Fd.w / 2 + 0.06)) continue;
      wallR.push({ side, a, hw: Fd.w / 2 });
      const o = side === 'b' ? { x: a, z: -hz + 0.06, rot: 0 } : side === 'l' ? { x: -hx + 0.06, z: a, rot: 90 } : { x: hx - 0.06, z: a, rot: -90 };
      furn.push({ type, x: +o.x.toFixed(2), z: +o.z.toFixed(2), rot: o.rot, mat: null, color: null }); placed++;
    }
    return Object.assign({ kitRev: REV, roomStyle: styleId, wallStyle: 'st_' + S.wall, wallStyleL: S.wallL ? 'st_' + S.wallL : null, wallStyleR: S.wallR ? 'st_' + S.wallR : null, floor: S.floor, floorColor: S.floorColor, furn }, variant(styleId, keys, seedIn));
  }

  // ---------------------------------------------------------
  // 같은 스타일이라도 주민마다 색 조합 · 조명 분위기가 달라짐
  //  kitHue: 포인트 색 색상환 회전 / wallTint: 벽 색조 / floorColor / moodVar: 조명 분위기
  // ---------------------------------------------------------
  const MOOD_VARS = {
    base: { name: '기본' }, sunset: { name: '노을빛' }, night: { name: '한밤 무드등' }, pastel: { name: '파스텔 몽환' }, cool: { name: '맑은 쿨톤' }, golden: { name: '골든 아워' },
  };
  function variant(styleId, keys = {}, seed = 0) {
    const S = STYLES[styleId], V = S.vars || {};
    let x = (seed | 0) ^ 0x9e3779b9; const rnd = () => { x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d); x ^= x + Math.imul(x ^ (x >>> 7), 0x297a2d39); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
    const pick = a => a[Math.floor(rnd() * a.length)];
    // 성격이 조명 분위기에 영향
    const w = { base: 3, sunset: 2, night: 2, pastel: 2, cool: 2, golden: 2 };
    if (keys.L2 === 'NIGHT_OWL') w.night += 5; if (keys.L2 === 'EARLY_BIRD') { w.base += 3; w.golden += 3; } if (keys.L2 === 'SLOTH') w.sunset += 2;
    if (keys.L3 === 'DREAMY') w.pastel += 5; if (keys.L3 === 'CUTE') w.pastel += 3; if (keys.L3 === 'PASSIONATE') w.sunset += 4; if (keys.L3 === 'CYNICAL' || keys.L3 === 'FORMAL') w.cool += 4; if (keys.L3 === 'WARM') w.golden += 4; if (keys.L3 === 'SHY') w.night += 2;
    for (const k of Object.keys(w)) if (V.lights && !V.lights.includes(k)) w[k] = 0;
    const tot = Object.values(w).reduce((a, b) => a + b, 0); let r = rnd() * tot, moodVar = 'base';
    for (const [k, v] of Object.entries(w)) { if ((r -= v) < 0) { moodVar = k; break; } }
    return {
      kitHue: pick(V.hues || [0, 0, 0, 0.05, -0.05, 0.09, -0.09, 0.14, -0.14]),
      wallTint: pick(V.walls || [0xffffff, 0xffffff, 0xfff0e4, 0xe8f0ff, 0xf0ffe8, 0xfff0f6, 0xf4ecff]),
      floorColor: pick(V.floors || [S.floorColor]),
      moodVar,
    };
  }
  const mixC = (a, b, t) => { const c = (v, sh) => (v >> sh) & 255; return [16, 8, 0].reduce((o, sh) => o | (Math.round(c(a, sh) + (c(b, sh) - c(a, sh)) * t) << sh), 0); };
  function moodFor(styleId, v = 'base') {
    const b = STYLES[styleId] && STYLES[styleId].mood; if (!b) return null;
    const m = { main: b.main || 1, lamp: b.lamp || 1, hemi: b.hemi.slice(), amb: b.amb.slice(), dir: b.dir.slice(), bg: b.bg, shadow: b.shadow || null };
    const tint = (col, k) => { m.hemi[0] = mixC(m.hemi[0], col, k); m.amb[0] = mixC(m.amb[0], col, k); m.dir[0] = mixC(m.dir[0], col, k); m.bg = mixC(m.bg, col, k * 0.4); };
    if (v === 'sunset') { tint(0xff9a60, 0.42); m.dir[2] *= 1.15; m.lamp *= 1.1; }
    else if (v === 'night') { tint(0x3a50a0, 0.5); m.hemi[2] *= 0.55; m.amb[1] *= 0.6; m.dir[2] *= 0.25; m.main *= 0.45; m.lamp *= 1.35; m.bg = mixC(m.bg, 0x000000, 0.4); }
    else if (v === 'pastel') { tint(0xe0c0ff, 0.38); m.lamp *= 1.1; }
    else if (v === 'cool') { tint(0xc8e0ff, 0.35); m.dir[2] *= 1.1; }
    else if (v === 'golden') { tint(0xffd070, 0.35); m.dir[2] *= 1.2; }
    return m;
  }
  // 색상 회전 (나무·무채색은 그대로, 포인트 색만)
  const hueCache = new Map();
  function hueShift(hex, h) {
    if (!h) return hex; const c = new THREE.Color(hex), o = {}; c.getHSL(o); const deg = o.h * 360;
    if (o.s < 0.28 || (deg > 16 && deg < 48 && o.l < 0.78)) return hex;
    c.setHSL((o.h + h + 1) % 1, o.s, o.l); return c.getHex();
  }
  function hueMat(m, h) {
    if (!h || !m || !m.color) return m; const key = m.uuid + ':' + h; if (hueCache.has(key)) return hueCache.get(key);
    const hex = m.color.getHex(), nh = hueShift(hex, h); let out = m;
    if (nh !== hex) { out = m.clone(); out.color.setHex(nh); if (m.onBeforeCompile) { out.onBeforeCompile = m.onBeforeCompile; out.customProgramCacheKey = m.customProgramCacheKey; } }
    hueCache.set(key, out); return out;
  }
  FM.RoomKit = { variant, moodFor, MOOD_VARS, hueShift, hueMat, _h: { K, T, P, def, tmat, ctex, M, glow, glass, lathe2, picMat, shade, mesh, box, sphere, cyl, geo, capsule, mat, f, rectOf },
    REV, STYLES, styleRoom, pickStyle, styleFit, styleScore, wallTexture, WALLS };
})();
