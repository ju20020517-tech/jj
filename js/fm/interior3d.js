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
  // 특이 취향(Layer 4) 벽지 무늬 — 베이스 색 위에 포인트 색(accent)으로 그림
  function lum(c) { return (((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11) / 255; }
  function drawAtmoPattern(g, w, h, kind, base, accent) {
    const A = PM.css(accent), dark = lum(base) < 0.45;
    const soft = dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.45)', ink = dark ? 'rgba(255,255,255,0.5)' : 'rgba(60,40,40,0.18)';
    g.lineCap = 'round'; g.lineJoin = 'round';
    const heart = (x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(x, y + r * 0.9); g.bezierCurveTo(x - r * 1.4, y - r * 0.2, x - r * 0.6, y - r * 1.2, x, y - r * 0.4); g.bezierCurveTo(x + r * 0.6, y - r * 1.2, x + r * 1.4, y - r * 0.2, x, y + r * 0.9); g.fill(); };
    switch (kind) {
      case 'vine':   // 덩굴 & 꽃
        for (let x = 20; x < w; x += 64) {
          g.strokeStyle = dark ? 'rgba(140,200,120,0.7)' : 'rgba(80,140,70,0.55)'; g.lineWidth = 3; g.beginPath();
          for (let y = 0; y <= h; y += 8) g.lineTo(x + Math.sin(y * 0.06 + x) * 10, y); g.stroke();
          for (let y = 10; y < h; y += 30) { const lx = x + Math.sin(y * 0.06 + x) * 10; g.fillStyle = dark ? 'rgba(150,210,130,0.75)' : 'rgba(100,170,90,0.6)'; g.beginPath(); g.ellipse(lx + (y % 60 ? 9 : -9), y, 8, 4, (y % 60 ? 0.6 : -0.6), 0, Math.PI * 2); g.fill(); }
          for (let y = 40; y < h; y += 80) { const lx = x + Math.sin(y * 0.06 + x) * 10; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; g.fillStyle = A; g.beginPath(); g.arc(lx + Math.cos(a) * 5, y + Math.sin(a) * 5, 4.5, 0, Math.PI * 2); g.fill(); } g.fillStyle = '#ffe38a'; g.beginPath(); g.arc(lx, y, 3, 0, Math.PI * 2); g.fill(); }
        }
        break;
      case 'dessert':   // 격자 + 컵케이크 · 음료
        g.strokeStyle = soft; g.lineWidth = 3; for (let i = 0; i <= w; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
        for (let y = 32; y < h; y += 64) for (let x = 32; x < w; x += 64) {
          if (((x + y) / 64) % 2 < 1) { g.fillStyle = A; g.beginPath(); g.arc(x, y - 4, 11, Math.PI, 0); g.fill(); g.fillStyle = ink; g.fillRect(x - 9, y - 4, 18, 12); g.fillStyle = '#ff5d7a'; g.beginPath(); g.arc(x, y - 16, 3.5, 0, Math.PI * 2); g.fill(); }
          else { g.fillStyle = ink; g.fillRect(x - 7, y - 10, 14, 20); g.fillStyle = A; g.fillRect(x - 7, y - 4, 14, 14); g.strokeStyle = A; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 3, y - 10); g.lineTo(x + 8, y - 18); g.stroke(); }
        }
        break;
      case 'books':   // 양장본 책장 실루엣 + 문서
        for (let y = 0; y < h; y += 64) {
          g.fillStyle = ink; g.fillRect(0, y + 58, w, 6);
          let x = 4; while (x < w) { const bw = 7 + ((x * 13 + y) % 9), bh = 34 + ((x * 7 + y) % 18); g.fillStyle = (x / 10 | 0) % 3 === 0 ? A : soft; g.fillRect(x, y + 58 - bh, bw, bh); g.fillStyle = ink; g.fillRect(x + 1, y + 58 - bh + 6, bw - 2, 2); x += bw + 2; if ((x % 70) < 9) { g.fillStyle = soft; g.save(); g.translate(x + 8, y + 30); g.rotate(-0.15); g.fillRect(-7, -10, 16, 22); g.fillStyle = ink; for (let k = 0; k < 4; k++) g.fillRect(-4, -6 + k * 5, 10, 1.5); g.restore(); x += 22; } }
        }
        break;
      case 'waves':   // 잔물결 + 거품
        for (let y = 16; y < h; y += 26) { g.strokeStyle = (y / 26 | 0) % 2 ? A : soft; g.lineWidth = 3; g.beginPath(); for (let x = 0; x <= w; x += 4) g.lineTo(x, y + Math.sin(x / w * Math.PI * 4 + y) * 5); g.stroke(); }
        for (let i = 0; i < 16; i++) { g.strokeStyle = soft; g.lineWidth = 1.5; g.beginPath(); g.arc((i * 71) % w, (i * 53) % h, 3 + (i % 3) * 2, 0, Math.PI * 2); g.stroke(); }
        break;
      case 'chevron':   // 모던 스트라이프 & 셰브론
        for (let y = 0; y < h; y += 42) { g.strokeStyle = (y / 42) % 2 ? A : soft; g.lineWidth = 7; g.beginPath(); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + ((x / 32) % 2 ? 14 : 0)); g.stroke(); }
        for (let x = 0; x < w; x += 128) { g.fillStyle = soft; g.fillRect(x + 60, 0, 4, h); }
        break;
      case 'vinyl':   // 음표 · LP · 음파
        for (let i = 0; i < 4; i++) { const x = 40 + (i % 2) * 128, y = 50 + (i >> 1) * 128; g.fillStyle = dark ? 'rgba(20,20,30,0.55)' : 'rgba(40,40,50,0.45)'; g.beginPath(); g.arc(x, y, 30, 0, Math.PI * 2); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.18)'; for (let r = 12; r < 30; r += 5) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); } g.fillStyle = A; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill(); }
        g.font = '28px serif'; g.fillStyle = A; for (let i = 0; i < 6; i++) g.fillText(i % 2 ? '♪' : '♫', 100 + (i * 57) % 150, 20 + (i * 83) % 230);
        g.strokeStyle = soft; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= w; x += 3) g.lineTo(x, 128 + Math.sin(x * 0.2) * Math.sin(x * 0.03) * 16); g.stroke();
        break;
      case 'hearts':   // 레터링 & 하트
        for (let y = 24; y < h; y += 48) for (let x = ((y / 48) % 2) * 32 + 20; x < w; x += 64) heart(x, y, 8, (x + y) % 3 ? A : soft);
        g.font = 'italic 20px Georgia, serif'; g.fillStyle = ink; g.fillText('love', 90, 60); g.fillText('xoxo', 20, 180); g.fillText('♡ you', 150, 220);
        break;
      case 'grid':   // 깨끗한 격자 타일 & 빗살
        g.strokeStyle = soft; g.lineWidth = 3; for (let i = 0; i <= w; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
        g.strokeStyle = A; g.globalAlpha = 0.35; g.lineWidth = 1; for (let i = -h; i < w; i += 8) { if (((i + h) / 64 | 0) % 2) continue; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); } g.globalAlpha = 1;
        break;
      case 'sacred':   // 신성기하학 (생명의 꽃) + 별자리
        g.strokeStyle = A; g.lineWidth = 1.6; g.globalAlpha = 0.7;
        for (const [cx, cy] of [[64, 64], [192, 192]]) for (let k = 0; k < 7; k++) { const a = k / 6 * Math.PI * 2; const ox = k ? Math.cos(a) * 18 : 0, oy = k ? Math.sin(a) * 18 : 0; g.beginPath(); g.arc(cx + ox, cy + oy, 18, 0, Math.PI * 2); g.stroke(); }
        g.globalAlpha = 1;
        const stars = [[170, 40], [200, 70], [230, 50], [210, 100], [40, 170], [70, 200], [30, 230], [90, 150]];
        g.strokeStyle = soft; g.lineWidth = 1; g.beginPath(); stars.slice(0, 4).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.beginPath(); stars.slice(4).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
        for (const [x, y] of stars) { g.fillStyle = '#fff6c0'; g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill(); }
        break;
      case 'track':   // 굵은 사선 스포티 라인 & 트랙
        for (let i = -h; i < w; i += 64) { g.fillStyle = A; g.beginPath(); g.moveTo(i, h); g.lineTo(i + 22, h); g.lineTo(i + 22 + h, 0); g.lineTo(i + h, 0); g.fill(); g.fillStyle = soft; g.beginPath(); g.moveTo(i + 28, h); g.lineTo(i + 34, h); g.lineTo(i + 34 + h, 0); g.lineTo(i + 28 + h, 0); g.fill(); }
        g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2; g.setLineDash([10, 8]); for (const y of [200, 230]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.setLineDash([]);
        break;
    }
  }
  I3.drawAtmoPattern = drawAtmoPattern;
  function wallTex(theme, color, color2) {
    const css = PM.css(color);
    if (theme && theme.startsWith('p_')) {
      const acc = color2 !== undefined && color2 !== null ? color2 : (lum(color) < 0.45 ? 0xffe6a0 : 0xff8fb1);
      return PM.ctex(`wall:${theme}:${color}:${acc}`, 256, 256, (g, w, h) => { g.fillStyle = css; g.fillRect(0, 0, w, h); drawAtmoPattern(g, w, h, theme.slice(2), color, acc); }, [2, 1]);
    }
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
    const wallMap = room.patterns && room.patterns.wall ? patTex(room.patterns.wall) : wallTex(themeId || room.wallStyle || 'plain', room.wall || 0xf4efe6, room.wall2);
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
        const base = f.type === 'ceiling_light' || f.type === 'chandelier' ? 0.5 : 0.22;
        const pl = new THREE.PointLight(lc.color, room.lightOn === false ? 0.04 : base, Math.max(w, d) * 1.3, 1.8);
        pl.userData.base = base;
        pl.position.set(f.x, 2.5, f.z);
        group.add(pl); res.lights.push(pl);
      }
      if (f.type === 'mirrorball') res.disco = o;
    });
    // 조명이 하나도 없으면 기본 조명
    if (!res.lights.length) { const pl = new THREE.PointLight((D.LIGHT_COLORS[room.light || 'warm'] || D.LIGHT_COLORS.warm).color, room.lightOn === false ? 0.04 : 0.5, Math.max(w, d) * 1.5, 1.8); pl.userData.base = 0.5; pl.position.set(0, 2.6, 0); group.add(pl); res.lights.push(pl); }
    // 조명이 여러 개면 합이 너무 밝아지지 않게 나눔
    res.lightScale = 1 / Math.max(1, Math.sqrt(res.lights.length));
    // 특이 취향(Layer 4) 파티클 & 보조 조명
    if (room.particles && !themeId) makeParticles(room.particles, w, d, group, res);
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

  // ---------------------------------------------------------
  // 분위기 파티클
  // ---------------------------------------------------------
  const glyph = (e, col) => PM.ctex('glyph:' + e + (col || ''), 64, 64, (g, w, h) => { g.textAlign = 'center'; g.textBaseline = 'middle'; if (col) { g.fillStyle = col; g.font = 'bold 48px serif'; } else g.font = '46px serif'; g.fillText(e, 32, 34); });
  const softDot = (col) => PM.ctex('dot:' + col, 64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  const PART = {
    leaves: { n: 26, map: () => glyph('🍃'), size: 0.32, y: [0.3, 2.9] },
    steam: { n: 22, map: () => softDot('rgba(255,250,240,0.85)'), size: 0.55, y: [0.6, 2.2] },
    sparkle: { n: 30, map: () => glyph('✦', '#fff6c0'), size: 0.22, y: [0.3, 2.6] },
    notes: { n: 16, map: () => glyph('♪', '#ff8fd0'), size: 0.38, y: [0.5, 2.7] },
    hearts: { n: 18, map: () => glyph('💗'), size: 0.3, y: [0.4, 2.6] },
    shine: { n: 34, map: () => glyph('✦', '#ffffff'), size: 0.16, y: [0.05, 0.4] },
    galaxy: { n: 60, map: () => softDot('rgba(200,170,255,0.95)'), size: 0.14, y: [1.4, 2.8] },
  };
  function makeParticles(kind, w, d, group, res) {
    if (kind === 'caustic') {   // 수중 빛사침
      const ct = PM.ctex('caustic2', 128, 128, (g, W2, H2) => { g.clearRect(0, 0, W2, H2); g.strokeStyle = 'rgba(200,255,255,0.55)'; g.lineWidth = 3; for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(Math.random() * W2, Math.random() * H2); for (let k = 0; k < 4; k++) g.quadraticCurveTo(Math.random() * W2, Math.random() * H2, Math.random() * W2, Math.random() * H2); g.stroke(); } }, [3, 3]);
      const cm = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: ct, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
      cm.rotation.x = -Math.PI / 2; cm.position.y = 0.02; group.add(cm); res.caustic = ct; return;
    }
    const P = PART[kind]; if (!P) return;
    const pos = new Float32Array(P.n * 3), seed = [];
    for (let i = 0; i < P.n; i++) { const x = (Math.random() - 0.5) * (w - 0.6), z = (Math.random() - 0.5) * (d - 0.6), y = P.y[0] + Math.random() * (P.y[1] - P.y[0]); pos.set([x, y, z], i * 3); seed.push({ x, z, a: Math.random() * 6.28, r: 0.4 + Math.random() * Math.min(w, d) * 0.4, s: 0.5 + Math.random() }); }
    const geo2 = new THREE.BufferGeometry(); geo2.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo2, new THREE.PointsMaterial({ map: P.map(), size: P.size, transparent: true, depthWrite: false, opacity: 0.9, blending: kind === 'galaxy' || kind === 'sparkle' || kind === 'shine' ? THREE.AdditiveBlending : THREE.NormalBlending }));
    group.add(pts);
    res.parts = { kind, pts, seed, P, w, d };
    if (kind === 'hearts') { const l = new THREE.PointLight(0xff8fc0, 0.35, Math.max(w, d) * 1.2, 1.8); l.position.set(0, 1.4, 0); group.add(l); res.extraLight = { l, fx: 'pulse' }; }
    if (kind === 'galaxy') { const l = new THREE.PointLight(0xffa850, 0.3, 5, 1.8); l.position.set(-w / 2 + 1, 1, -d / 2 + 1); group.add(l); res.extraLight = { l, fx: 'candle' }; }
    if (kind === 'notes') { const l = new THREE.PointLight(0x8fb0ff, 0.3, Math.max(w, d), 1.8); l.position.set(0, 2.4, 0); group.add(l); res.extraLight = { l, fx: 'mirror' }; }
  }
  function updateParticles(res, dt, t) {
    const pp = res.parts; if (!pp) return;
    const a = pp.pts.geometry.attributes.position, { P, seed, kind } = pp;
    for (let i = 0; i < a.count; i++) {
      const s = seed[i]; let x = a.getX(i), y = a.getY(i), z = a.getZ(i);
      if (kind === 'leaves') { y -= dt * 0.25 * s.s; x = s.x + Math.sin(t * 1.3 + s.a) * 0.3; if (y < 0.05) y = P.y[1]; }
      else if (kind === 'steam' || kind === 'notes' || kind === 'hearts') { y += dt * 0.3 * s.s; x = s.x + Math.sin(t * 1.1 + s.a) * 0.15; if (y > P.y[1]) y = P.y[0]; }
      else if (kind === 'galaxy') { s.a += dt * 0.15 * s.s; x = Math.cos(s.a) * s.r; z = Math.sin(s.a) * s.r; }
      a.setXYZ(i, x, y, z);
    }
    a.needsUpdate = true;
    if (kind === 'sparkle' || kind === 'shine' || kind === 'galaxy') pp.pts.material.opacity = 0.55 + Math.sin(t * 3) * 0.35;
    if (kind === 'steam') pp.pts.material.opacity = 0.45;
    const ex = res.extraLight;
    if (ex) { if (ex.fx === 'pulse') ex.l.intensity = 0.25 + Math.sin(t * 2) * 0.1; else if (ex.fx === 'candle') ex.l.intensity = 0.28 + Math.random() * 0.08; else ex.l.color.setHSL((t * 0.15) % 1, 0.7, 0.65); }
  }

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
      else if (room) {
        const LC = D.LIGHT_COLORS[room.light || 'warm'] || D.LIGHT_COLORS.warm;
        let k = LC.k || 1; const i = res.lights.indexOf(l);
        l.color.setHex(LC.color);
        if (LC.fx === 'party') l.color.setHSL((t * 0.25 + i * 0.33) % 1, 0.75, 0.62);          // 미러볼 & 네온 반사
        else if (LC.fx === 'holo') l.color.setHSL(0.5 + Math.sin(t * 0.35 + i) * 0.25, 0.55, 0.72); // 오로라 홀로그램
        else if (LC.fx === 'flicker') k *= 0.85 + (Math.sin(t * 23) * Math.sin(t * 7.3) > 0.9 ? -0.4 : 0.12 * Math.sin(t * 3)); // 붉은 네온 깜빡임
        l.intensity = room.lightOn === false ? 0.04 : (l.userData.base || 0.4) * (res.lightScale || 1) * k;
      }
    }
    updateParticles(res, dt, t);
    if (res.disco) res.disco.rotation.y += dt * 2;
  };
})();
