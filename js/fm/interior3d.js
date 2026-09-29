/* =========================================================
 *  실내 3D — 방 6개 레이어(벽/바닥, 가구, 스마트 오브젝트, 벽걸이, 조명/BGM),
 *  재질·색 교체, DIY 무늬, 청결도(쓰레기), 테마 세트 효과
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE, PM = FM.PM, D = FM.D;
  const H = ISLE.M.h;
  const { mat, geo, sphere, box, cyl, capsule, mesh } = H;
  const I3 = (FM.Int3D = {});

  let WALL_H = 3;   // 실내마다 I.wallH 로 변경 (복층 도서관 등)
  function floorTex(kind, color) {
    const css = PM.css(color);
    return PM.ctex(`floor:${kind}:${color}`, 256, 256, (g, w, h) => {
      g.fillStyle = css; g.fillRect(0, 0, w, h);
      const dark = 'rgba(0,0,0,0.12)', light = 'rgba(255,255,255,0.15)';
      switch (kind) {
        case 'wood': case 'log':
          // 판자마다 결·밝기가 조금씩 다른 원목 마루
          for (let y = 0; y < h; y += 32) for (let x = -((y / 32) % 3) * 42; x < w; x += 128) {
            const k = ((x * 13 + y * 7) % 5) - 2;
            g.fillStyle = k > 0 ? `rgba(255,255,255,${k * 0.05})` : `rgba(90,50,20,${-k * 0.05})`; g.fillRect(x, y, 128, 32);
            g.strokeStyle = 'rgba(90,50,20,0.1)'; g.lineWidth = 1;
            for (let i = 0; i < 3; i++) { const gy = y + 7 + i * 8 + ((x + i * 5) % 4); g.beginPath(); g.moveTo(x + 4, gy); g.bezierCurveTo(x + 40, gy - 3, x + 80, gy + 3, x + 124, gy); g.stroke(); }
            g.fillStyle = dark; g.fillRect(x, y, 2, 32);
          }
          for (let y = 0; y < h; y += 32) { g.fillStyle = dark; g.fillRect(0, y, w, 2); }
          break;
        case 'tile': for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { g.fillStyle = ((x + y) / 64) % 2 ? dark : light; g.fillRect(x, y, 64, 64); } break;
        case 'marble': for (let i = 0; i < 8; i++) { g.strokeStyle = 'rgba(150,150,170,0.3)'; g.lineWidth = 2; g.beginPath(); let x = Math.random() * w, y = 0; g.moveTo(x, y); while (y < h) { x += (Math.random() - 0.5) * 40; y += 16; g.lineTo(x, y); } g.stroke(); } g.strokeStyle = dark; for (let i = 0; i <= w; i += 128) { g.strokeRect(i, 0, 128, 128); g.strokeRect(i, 128, 128, 128); } break;
        case 'carpet': for (let i = 0; i < 1400; i++) { g.fillStyle = Math.random() < 0.5 ? dark : light; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } break;
        case 'metal': for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { g.strokeStyle = dark; g.strokeRect(x + 2, y + 2, 60, 60); g.fillStyle = light; g.fillRect(x + 6, y + 6, 4, 4); g.fillRect(x + 54, y + 54, 4, 4); } break;
        case 'candy': for (let x = -h; x < w; x += 40) { g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 20, 0); g.lineTo(x + 20 + h, h); g.lineTo(x + h, h); g.fill(); } break;
        case 'water': for (let i = 0; i < 30; i++) { g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 3; g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / 20) * 5); g.stroke(); } break;
        case 'mat': for (let y = 0; y < h; y += 128) for (let x = 0; x < w; x += 128) { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 4; g.strokeRect(x, y, 128, 128); } break;
        case 'slate': for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { g.fillStyle = `rgba(${((x * 7 + y * 3) % 5) < 2 ? '255,255,255,0.05' : '0,0,0,0.08'})`; g.fillRect(x + 1, y + 1, 30, 30); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x, y, 32, 1.5); g.fillRect(x, y, 1.5, 32); } break;
        case 'checker': for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { if ((x + y) / 32 % 2) { g.fillStyle = '#f4ecd0'; g.fillRect(x, y, 32, 32); } g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, y, 32, 1); g.fillRect(x, y, 1, 32); } break;
        case 'sand': for (let i = 0; i < 900; i++) { g.fillStyle = dark; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } break;
        default: if (FM.FLOOR_DRAW && FM.FLOOR_DRAW[kind]) FM.FLOOR_DRAW[kind](g, w, h, color);   // 확장 바닥재 (roomkit3 등)
      }
    }, [2, 2]);
  }
  // 특이 취향(Layer 4) 벽지 무늬 — 베이스 색 위에 포인트 색(accent)으로 그림
  function lum(c) { return (((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11) / 255; }
  // ---------------------------------------------------------
  // 벽지 — 톤온톤 · 작은 모티프 · 요즘 감성 (모든 무늬는 256px 안에서 이음매 없이 반복)
  // ---------------------------------------------------------
  const mixW = (a, b, t) => { const c = (x, sh) => (x >> sh) & 255; return [16, 8, 0].reduce((o, sh) => o | (Math.round(c(a, sh) + (c(b, sh) - c(a, sh)) * t) << sh), 0); };
  const rgba = (c, a) => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
  // 너무 쨍한 벽색은 크림빛으로 살짝 눌러 세련되게 (어두운 무드 컬러는 그대로)
  function refineWall(c) {
    const col = new THREE.Color(c), o = {}; col.getHSL(o);
    if (o.s > 0.55 && o.l > 0.38 && o.l < 0.8) return mixW(c, 0xfff8ef, 0.42);
    if (o.s > 0.4 && o.l >= 0.8) return mixW(c, 0xfffaf4, 0.2);
    return c;
  }
  I3.refineWall = refineWall;
  // 은은한 라임워시(석회 도장) 결 — 모든 벽 바탕
  function limewash(g, w, h, base) {
    const dark = lum(base) < 0.45;
    for (let i = 0; i < 26; i++) {
      const x = (i * 97) % w, y = (i * 61 + (i % 3) * 40) % h, r = 30 + (i * 37) % 50;
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
        const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
        const c = i % 2 ? (dark ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.07)') : (dark ? 'rgba(0,0,0,0.035)' : 'rgba(120,90,60,0.02)');
        gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
      }
    }
  }
  // 반복 타일 배치 헬퍼: 가장자리를 넘는 모티프는 반대편에도 그려 이음매 없이
  const tile = (w, h, fn) => (x, y, ...a) => { for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { const X = x + ox, Y = y + oy; if (X > -40 && X < w + 40 && Y > -40 && Y < h + 40) fn(X, Y, ...a); } };
  function drawAtmoPattern(g, w, h, kind, base, accent) {
    const dark = lum(base) < 0.45;
    const acc = mixW(accent, base, 0.3);                        // 포인트색을 바탕에 살짝 녹임
    const tone = dark ? mixW(base, 0xffffff, 0.14) : mixW(base, 0x6a4a3a, 0.08);   // 톤온톤
    const cream = dark ? mixW(base, 0xffffff, 0.35) : 0xfffdf8;
    const leaf = dark ? 0x8fb88a : mixW(0x7fae7a, base, 0.25);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const heart = (x, y, r) => { g.beginPath(); g.moveTo(x, y + r * 0.9); g.bezierCurveTo(x - r * 1.4, y - r * 0.2, x - r * 0.6, y - r * 1.2, x, y - r * 0.4); g.bezierCurveTo(x + r * 0.6, y - r * 1.2, x + r * 1.4, y - r * 0.2, x, y + r * 0.9); g.fill(); };
    const dot = (x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
    const spark = (x, y, r) => { g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill(); };
    const gingham = (sz, a) => {
      g.fillStyle = rgba(acc, a); for (let x = 0; x < w; x += sz * 2) g.fillRect(x, 0, sz, h);
      for (let y = 0; y < h; y += sz * 2) g.fillRect(0, y, w, sz);
    };
    limewash(g, w, h, base);
    switch (kind) {
      case 'vine': {   // 잔꽃 & 새싹 (디치 플로럴)
        const sprig = tile(w, h, (x, y, flip) => {
          g.save(); g.translate(x, y); g.scale(flip ? -1 : 1, 1); g.rotate(-0.35);
          g.strokeStyle = rgba(leaf, 0.85); g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, 10); g.quadraticCurveTo(-2, 0, 2, -8); g.stroke();
          g.fillStyle = rgba(leaf, 0.8); g.beginPath(); g.ellipse(-4, 3, 4, 2, 0.8, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(4, -1, 4, 2, -0.8, 0, Math.PI * 2); g.fill();
          g.fillStyle = rgba(acc, 0.9); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; dot(2 + Math.cos(a) * 3.2, -10 + Math.sin(a) * 3.2, 2.6); }
          g.fillStyle = '#fff3c4'; dot(2, -10, 1.6); g.restore();
        });
        for (let r = 0; r < 8; r++) for (let c = 0; c < 6; c++) sprig(c * 42.67 + (r % 2) * 21.3 + ((r * 7) % 5), r * 32 + 14, (r + c) % 2);
        g.fillStyle = rgba(cream, 0.7); for (let r = 0; r < 8; r++) for (let c = 0; c < 6; c++) dot(c * 42.67 + (r % 2 ? 0 : 21.3) + 6, r * 32 + 2, 1.4);
        break;
      }
      case 'dessert': {   // 파스텔 깅엄 + 작은 체리
        gingham(16, 0.13);
        const cherry = tile(w, h, (x, y) => {
          g.strokeStyle = rgba(leaf, 0.9); g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - 4, y); g.quadraticCurveTo(x - 2, y - 9, x + 2, y - 11); g.moveTo(x + 4, y + 1); g.quadraticCurveTo(x + 3, y - 8, x + 2, y - 11); g.stroke();
          g.fillStyle = rgba(leaf, 0.9); g.beginPath(); g.ellipse(x + 5, y - 11, 4, 2, -0.3, 0, Math.PI * 2); g.fill();
          g.fillStyle = rgba(mixW(0xe8506a, base, 0.15), 0.95); dot(x - 4, y + 2, 3.6); dot(x + 4, y + 3, 3.6);
          g.fillStyle = 'rgba(255,255,255,0.7)'; dot(x - 5, y + 1, 1); dot(x + 3, y + 2, 1);
        });
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) cherry(c * 64 + (r % 2) * 32 + 16, r * 64 + 24);
        break;
      }
      case 'books': {   // 클래식 서재 스트라이프 (톤온톤 넓은 띠 + 가는 핀스트라이프)
        for (let x = 0; x < w; x += 64) {
          g.fillStyle = rgba(tone, 0.55); g.fillRect(x, 0, 32, h);
          g.fillStyle = rgba(acc, 0.45); g.fillRect(x + 44, 0, 2, h); g.fillRect(x + 50, 0, 2, h);
        }
        // 줄 사이 작은 양장본 · 펼친 책
        const book = tile(w, h, (x, y, open) => {
          if (open) { g.fillStyle = rgba(cream, 0.9); g.beginPath(); g.moveTo(x, y + 2); g.quadraticCurveTo(x - 5, y - 2, x - 9, y); g.lineTo(x - 9, y + 8); g.quadraticCurveTo(x - 5, y + 6, x, y + 10); g.quadraticCurveTo(x + 5, y + 6, x + 9, y + 8); g.lineTo(x + 9, y); g.quadraticCurveTo(x + 5, y - 2, x, y + 2); g.fill(); g.strokeStyle = rgba(acc, 0.6); g.lineWidth = 1; g.beginPath(); g.moveTo(x, y + 2); g.lineTo(x, y + 10); g.stroke(); }
          else { [[-6, 12, acc], [-1, 14, tone], [4, 11, cream]].forEach(([dx, hh, c]) => { g.fillStyle = rgba(c, 0.85); g.fillRect(x + dx, y + 10 - hh, 4.5, hh); }); g.fillStyle = rgba(acc, 0.7); g.fillRect(x - 7, y + 10, 16, 1.5); }
        });
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) book(c * 64 + 48, r * 64 + 20 + (c % 2) * 32, (r + c) % 2);
        break;
      }
      case 'waves': {   // 그루비 물결 라인
        for (let y = 0, k = 0; y < h; y += 21.33, k++) {
          g.strokeStyle = k % 2 ? rgba(acc, 0.55) : rgba(cream, 0.75); g.lineWidth = k % 2 ? 5 : 3;
          g.beginPath(); for (let x = -4; x <= w + 4; x += 4) g.lineTo(x, y + 10 + Math.sin(x / w * Math.PI * 8 + k * 0.9) * 4.5); g.stroke();
        }
        g.strokeStyle = rgba(cream, 0.8); g.lineWidth = 1.2; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc((i * 83) % w, (i * 59) % h + 4, 2 + (i % 3), 0, Math.PI * 2); g.stroke(); }
        break;
      }
      case 'chevron': {   // 모던 셰브론: 둥글린 지그재그 + 가는 스트라이프 (톤온톤)
        for (let y = 0, k = 0; y < h; y += 32, k++) {
          g.strokeStyle = k % 2 ? rgba(acc, 0.5) : rgba(cream, 0.8); g.lineWidth = k % 2 ? 6 : 3;
          g.beginPath(); for (let x = -16; x <= w + 16; x += 2) { const ph = ((x % 32) + 32) % 32 / 32; g.lineTo(x, y + 16 + (Math.abs(ph - 0.5) * 2 - 0.5) * 12 * (1 - 0.15 * Math.cos(ph * Math.PI * 2))); } g.stroke();
        }
        break;
      }
      case 'wavycheck': {   // 웨이비 체커보드
        const img = g.getImageData(0, 0, w, h), d = img.data;
        const ar = (acc >> 16) & 255, ag = (acc >> 8) & 255, ab = acc & 255, t = 0.42;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const u = x + 6 * Math.sin(y / 64 * Math.PI * 2), v = y + 6 * Math.sin(x / 64 * Math.PI * 2);
          if ((Math.floor(u / 32) + Math.floor(v / 32)) & 1) { const i = (y * w + x) * 4; d[i] += (ar - d[i]) * t; d[i + 1] += (ag - d[i + 1]) * t; d[i + 2] += (ab - d[i + 2]) * t; }
        }
        g.putImageData(img, 0, 0);
        break;
      }
      case 'vinyl': {   // 파스텔 미니 LP · 음표 · 점선 음파
        const lp = tile(w, h, (x, y) => {
          g.fillStyle = rgba(dark ? 0x1a1a22 : mixW(0x3a3440, base, 0.35), 0.85); dot(x, y, 11);
          g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1; for (const r of [8, 5.5]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); }
          g.fillStyle = rgba(acc, 1); dot(x, y, 3.6); g.fillStyle = rgba(cream, 1); dot(x, y, 1);
        });
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) lp(c * 64 + (r % 2) * 32 + 16, r * 64 + 22);
        g.fillStyle = rgba(acc, 0.7); g.font = 'bold 15px sans-serif'; g.textAlign = 'center';
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) g.fillText((r + c) % 2 ? '♪' : '♫', c * 64 + (r % 2 ? 0 : 32) + 16, r * 64 + 30);
        g.fillStyle = rgba(cream, 0.75); for (let r = 0; r < 4; r++) for (let x = 0; x < w; x += 5) dot(x, r * 64 + 52 + Math.sin(x / w * Math.PI * 6) * Math.sin(x / w * Math.PI * 2 * 3 + r) * 5, 1.1);
        break;
      }
      case 'hearts': {   // 코케트 리본 + 작은 하트
        const bow = tile(w, h, (x, y) => {
          g.fillStyle = rgba(acc, 0.85);
          g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x - 6, y - 9, x - 15, y - 6, x - 13, y + 1); g.bezierCurveTo(x - 11, y + 7, x - 5, y + 4, x, y); g.fill();
          g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 6, y - 9, x + 15, y - 6, x + 13, y + 1); g.bezierCurveTo(x + 11, y + 7, x + 5, y + 4, x, y); g.fill();
          g.strokeStyle = rgba(acc, 0.85); g.lineWidth = 2.4; g.beginPath(); g.moveTo(x - 1, y + 2); g.quadraticCurveTo(x - 6, y + 9, x - 8, y + 15); g.moveTo(x + 1, y + 2); g.quadraticCurveTo(x + 6, y + 9, x + 9, y + 14); g.stroke();
          g.fillStyle = rgba(mixW(accent, 0x5a3040, 0.2), 0.9); dot(x, y + 0.5, 2.6);
        });
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) bow(c * 64 + (r % 2) * 32 + 16, r * 64 + 22);
        g.fillStyle = rgba(cream, 0.8); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if ((r + c) % 3) heart(c * 64 + (r % 2 ? 16 : 48), r * 64 + 54, 3.4);
        g.fillStyle = rgba(mixW(accent, base, 0.45), 0.9); g.font = 'italic 11px Georgia, serif'; g.textAlign = 'center';
        g.fillText('love', 112, 184); g.fillText('xoxo', 48 + 128, 56); g.fillText('with love', 240, 248);
        break;
      }
      case 'grid': {   // 윈도페인 체크 (가는 이중선)
        g.fillStyle = rgba(acc, 0.35);
        for (let x = 0; x < w; x += 64) { g.fillRect(x + 30, 0, 1.5, h); g.fillRect(x + 34, 0, 1.5, h); }
        for (let y = 0; y < h; y += 64) { g.fillRect(0, y + 30, w, 1.5); g.fillRect(0, y + 34, w, 1.5); }
        g.fillStyle = rgba(cream, 0.6); for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) dot(x + 64, y + 64, 2);
        g.strokeStyle = rgba(acc, 0.14); g.lineWidth = 1;
        for (let y = 0; y < h; y += 128) for (let x = 0; x < w; x += 128) { g.save(); g.beginPath(); g.rect(x + 36, y + 36, 58, 58); g.clip(); for (let k = -64; k < 64; k += 6) { g.beginPath(); g.moveTo(x + 36 + k, y + 36); g.lineTo(x + 36 + k + 58, y + 94); g.stroke(); } g.restore(); }
        break;
      }
      case 'sacred': {   // 셀레스티얼: 초승달 · 반짝이 · 점선 별자리
        const gold = dark ? 0xffe6a8 : mixW(0xd9b44a, base, 0.2);
        const moon = tile(w, h, (x, y) => { g.fillStyle = rgba(gold, 0.85); dot(x, y, 7); g.fillStyle = PM.css(base); dot(x + 3.5, y - 2.5, 6); });
        const S2 = tile(w, h, (x, y, r) => { g.fillStyle = rgba(gold, 0.8); spark(x, y, r); });
        const pts = [[20, 30], [90, 70], [150, 20], [210, 90], [40, 150], [120, 130], [190, 190], [70, 220], [240, 240]];
        pts.forEach(([x, y], i) => S2(x, y, i % 3 ? 3.5 : 6));
        g.fillStyle = rgba(gold, 0.55); for (let i = 0; i < 40; i++) dot((i * 71) % w, (i * 113) % h, 0.9);
        g.strokeStyle = rgba(gold, 0.4); g.lineWidth = 1; g.setLineDash([2, 4]); g.beginPath(); g.moveTo(90, 70); g.lineTo(150, 20); g.lineTo(210, 90); g.moveTo(40, 150); g.lineTo(120, 130); g.lineTo(190, 190); g.stroke(); g.setLineDash([]);
        for (const [x, y] of [[180, 50], [60, 100], [220, 160], [120, 200]]) moon(x, y);
        g.strokeStyle = rgba(gold, 0.45); g.lineWidth = 0.9;
        for (const [cx, cy] of [[64, 36], [192, 150]]) for (let k = 0; k < 7; k++) { const a = k / 6 * Math.PI * 2, o = k ? 6 : 0; g.beginPath(); g.arc(cx + Math.cos(a) * o, cy + Math.sin(a) * o, 6, 0, Math.PI * 2); g.stroke(); }
        // 모닥불 같은 반짝임이 아니라 벽이 어두울수록 더 또렷하게
        break;
      }
      case 'track': {   // 굵은 사선 스포티 라인 (바시티 감성, 톤 다운)
        const band = (off, wd, col) => { g.fillStyle = col; for (let k = -h; k < w + h; k += 64) { g.beginPath(); g.moveTo(k + off, h); g.lineTo(k + off + wd, h); g.lineTo(k + off + wd + h, 0); g.lineTo(k + off + h, 0); g.fill(); } };
        band(0, 16, rgba(acc, 0.42)); band(20, 4, rgba(cream, 0.85)); band(28, 4, rgba(acc, 0.3));
        break;
      }
      // ---- 기본 벽 스타일도 같은 감성으로 ----
      case 'polka': g.fillStyle = rgba(acc, 0.55); for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) dot(c * 32 + (r % 2) * 16 + 8, r * 32 + 16, 3.2); break;
      case 'gingham': gingham(16, 0.2); break;
      case 'terrazzo': {
        const cols = [acc, mixW(acc, 0x6a8aa0, 0.5), mixW(0xffc890, base, 0.2), tone];
        for (let i = 0; i < 70; i++) { const x = (i * 83) % w, y = (i * 47 + (i % 5) * 13) % h; g.fillStyle = rgba(cols[i % 4], 0.55); tile(w, h, (X, Y) => { g.beginPath(); g.ellipse(X, Y, 3 + i % 4, 2 + i % 3, i, 0, Math.PI * 2); g.fill(); })(x, y); }
        break;
      }
      case 'whitebrick': for (let y = 0; y < h; y += 16) for (let x = (y / 16 % 2) * 16; x < w + 16; x += 32) { g.fillStyle = rgba(cream, 0.35 + ((x * 7 + y) % 5) * 0.03); g.fillRect(x + 1.5, y + 1.5, 29, 13); } break;
      case 'plain': default: break;
    }
  }
  I3.drawAtmoPattern = drawAtmoPattern;
  const MODERN = { heart: 'hearts', stripe: 'books', wainscot: 'plain', dots: 'polka', star: 'sacred', leaf: 'vine', brick: 'whitebrick', splatter: 'terrazzo', check: 'gingham', plain: 'plain' };
  function wallTex(theme, color, color2) {
    if (theme && theme.startsWith('st_')) theme = 'plain';
    if (!theme || MODERN[theme]) theme = 'p_' + (MODERN[theme || 'plain']);
    if (theme.startsWith('p_')) color = refineWall(color);
    const css = PM.css(color);
    if (theme && theme.startsWith('p_')) {
      const acc = color2 !== undefined && color2 !== null ? color2 : (lum(color) < 0.45 ? 0xffe6a0 : 0xff8fb1);
      return PM.ctex(`wall2:${theme}:${color}:${acc}`, 256, 256, (g, w, h) => { g.fillStyle = css; g.fillRect(0, 0, w, h); drawAtmoPattern(g, w, h, theme.slice(2), color, acc); }, [2, 1]);
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
  // ---------------------------------------------------------
  // 방 껍데기 꾸미기
  // ---------------------------------------------------------
  const mixC = (a, b, t) => { const c = (x, sh) => (x >> sh) & 255; return [16, 8, 0].reduce((o, sh) => o | (Math.round(c(a, sh) + (c(b, sh) - c(a, sh)) * t) << sh), 0); };
  const PASTEL = [0xffc6d9, 0xffe6a0, 0xbfe3ff, 0xc8efc0, 0xdcc8ff, 0xffd2b0];
  function rugTex(base, edge, kind) {
    return PM.ctex(`rug:${base}:${edge}:${kind}`, 256, 256, (g, W2, H2) => {
      g.clearRect(0, 0, W2, H2);
      const cx = W2 / 2, cy = H2 / 2;
      const el = (r, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(cx, cy, cx * r, cy * r, 0, 0, Math.PI * 2); g.fill(); };
      el(0.99, PM.css(edge)); el(0.9, PM.css(base)); el(0.84, PM.css(mixC(base, 0xffffff, 0.35)));
      g.fillStyle = PM.css(edge);
      if (kind === 0) for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * cx * 0.62, cy + Math.sin(a) * cy * 0.62, 6, 0, Math.PI * 2); g.fill(); }
      else if (kind === 1) for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, x = cx + Math.cos(a) * cx * 0.55, y = cy + Math.sin(a) * cy * 0.55; g.beginPath(); g.moveTo(x, y + 7); g.bezierCurveTo(x - 12, y - 2, x - 5, y - 11, x, y - 4); g.bezierCurveTo(x + 5, y - 11, x + 12, y - 2, x, y + 7); g.fill(); }
      else { g.strokeStyle = PM.css(edge); g.lineWidth = 4; for (const r of [0.66, 0.5]) { g.beginPath(); g.ellipse(cx, cy, cx * r, cy * r, 0, 0, Math.PI * 2); g.stroke(); } }
      g.fillStyle = PM.css(mixC(edge, 0xffffff, 0.3)); g.beginPath(); g.ellipse(cx, cy, cx * 0.2, cy * 0.2, 0, 0, Math.PI * 2); g.fill();
    });
  }
  function decorShell(group, I, room, themeId, w, d, res) {
    const wallCol = refineWall(room.wall || I.wall || 0xf4efe6);
    const dark = lum(wallCol) < 0.35;
    const trimCol = dark ? mixC(wallCol, 0x000000, 0.35) : 0xfffaf2;
    const tm = mat(trimCol);
    // 천장 몰딩 (모든 실내)
    group.add(mesh(box(w, 0.12, 0.1, 0.03), tm, 0, WALL_H - 0.06, -d / 2 + 0.05));
    group.add(mesh(box(w, 0.05, 0.14, 0.02), tm, 0, WALL_H - 0.15, -d / 2 + 0.07));
    for (const sx of [-1, 1]) { group.add(mesh(box(0.1, 0.12, d, 0.03), tm, sx * (w / 2 - 0.05), WALL_H - 0.06, 0)); group.add(mesh(box(0.14, 0.05, d, 0.02), tm, sx * (w / 2 - 0.07), WALL_H - 0.15, 0)); }
    if (I.kind !== 'room' || themeId) return;
    if (room.roomStyle && FM.RoomKit && FM.RoomKit.STYLES[room.roomStyle]) return styleShell(group, room, w, d, tm);
    // 징두리 판벽 (벽 아래쪽 0.95m) + 걸레받이 위 몰딩 + 굽도리 액자 패널
    const pane = mixC(wallCol, dark ? 0x000000 : 0xffffff, dark ? 0.25 : 0.55);
    const pm = mat(pane), frameM = mat(mixC(pane, dark ? 0xffffff : 0x7a5a3a, 0.12));
    const WH = 0.95;
    group.add(mesh(box(w - 0.02, WH, 0.04, 0.01), pm, 0, WH / 2, -d / 2 + 0.03));
    for (const sx of [-1, 1]) group.add(mesh(box(0.04, WH, d - 0.02, 0.01), pm, sx * (w / 2 - 0.03), WH / 2, 0));
    group.add(mesh(box(w, 0.06, 0.09, 0.02), tm, 0, WH, -d / 2 + 0.05));
    for (const sx of [-1, 1]) group.add(mesh(box(0.09, 0.06, d, 0.02), tm, sx * (w / 2 - 0.05), WH, 0));
    const nB = Math.max(3, Math.round(w / 1.0)), nS = Math.max(3, Math.round(d / 1.0));
    for (let i = 0; i < nB; i++) {
      const x = -w / 2 + (i + 0.5) * w / nB;
      for (const [fw, fh, fy] of [[w / nB - 0.22, 0.05, 0.78], [w / nB - 0.22, 0.05, 0.3]]) group.add(mesh(box(fw, fh, 0.03, 0.01), frameM, x, fy, -d / 2 + 0.06));
      for (const sx of [-1, 1]) group.add(mesh(box(0.05, 0.53, 0.03, 0.01), frameM, x + sx * (w / nB - 0.22) / 2, 0.54, -d / 2 + 0.06));
    }
    for (const side of [-1, 1]) for (let i = 0; i < nS; i++) {
      const z = -d / 2 + (i + 0.5) * d / nS, px = side * (w / 2 - 0.06);
      for (const fy of [0.78, 0.3]) group.add(mesh(box(0.03, 0.05, d / nS - 0.22, 0.01), frameM, px, fy, z));
      for (const sz of [-1, 1]) group.add(mesh(box(0.03, 0.53, 0.05, 0.01), frameM, px, 0.54, z + sz * (d / nS - 0.22) / 2));
    }
    // 동글 러그 (카펫 바닥이 아니면)
    const seed = [...(I.id || 'r')].reduce((a, ch) => a + ch.charCodeAt(0), 0);
    if (room.floor !== 'carpet') {
      const base = room.wall2 !== undefined && room.wall2 !== null ? mixC(room.wall2, 0xffffff, 0.35) : PASTEL[seed % PASTEL.length];
      const edge = mixC(base, 0x6a4a3a, 0.25);
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(3.6, w * 0.45), Math.min(2.4, d * 0.42)), new THREE.MeshLambertMaterial({ map: rugTex(base, edge, seed % 3), transparent: true, depthWrite: false }));
      rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.012, 0.4); rug.receiveShadow = true; rug.renderOrder = 1;
      group.add(rug);
    }
    // 뒷벽 위 꼬마전구 가랜드 (두 번 늘어짐)
    const bulbs = [];
    const swag = (x0, x1) => {
      const n = 9;
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = x0 + (x1 - x0) * t, y = WALL_H - 0.3 - Math.sin(t * Math.PI) * 0.32;
        const col = PASTEL[(i + seed) % PASTEL.length];
        const b = mesh(sphere(0.045), PM.glowMat(mixC(col, 0xffffff, 0.2)), x, y, -d / 2 + 0.1, false);
        b.scale.y = 1.25; group.add(b); bulbs.push(b);
        if (i < n) { const x2 = x0 + (x1 - x0) * (i + 1) / n, y2 = WALL_H - 0.3 - Math.sin((i + 1) / n * Math.PI) * 0.32; const len = Math.hypot(x2 - x, y2 - y); const wire = mesh(cyl(0.006, 0.006, len), mat(0x6a5a4a), (x + x2) / 2, (y + y2) / 2 + 0.04, -d / 2 + 0.09, false); wire.rotation.z = Math.atan2(y2 - y, x2 - x) - Math.PI / 2; group.add(wire); }
      }
    };
    swag(-w / 2 + 0.3, 0); swag(0, w / 2 - 0.3);
    res.bulbs = bulbs;
    // 옆벽 작은 창문 (왼쪽)
    const side = new THREE.Group(); side.position.set(-w / 2 + 0.05, 1.75, -0.2); side.rotation.y = Math.PI / 2;
    buildWindow(side, 1.0, 1.0, room, seed + 1, false);
    group.add(side);
  }
  // 레퍼런스 스타일 방의 구조물 (나무 기둥·보 / 콘크리트 기둥 / 판벽 몰딩)
  function styleShell(group, room, w, d, tm) {
    const S = FM.RoomKit.STYLES[room.roomStyle];
    if (S.beams) {   // 코티지: 모서리 · 벽 가운데 원목 기둥 + 위쪽 보
      const bm = mat(S.beams);
      for (const [x, z] of [[-w / 2 + 0.08, -d / 2 + 0.08], [w / 2 - 0.08, -d / 2 + 0.08], [-w / 2 + 0.08, 0], [w / 2 - 0.08, 0]]) group.add(mesh(box(0.16, WALL_H, 0.16, 0.02), bm, x, WALL_H / 2, z));
      group.add(mesh(box(w, 0.16, 0.14, 0.02), bm, 0, 2.55, -d / 2 + 0.08));
      for (const sx of [-1, 1]) group.add(mesh(box(0.14, 0.16, d, 0.02), bm, sx * (w / 2 - 0.08), 2.55, 0));
    }
    if (S.pillar) { const cm = mat(0x9a9ca0); group.add(mesh(box(0.5, WALL_H, 0.5, 0.02), cm, -w / 2 + 0.25, WALL_H / 2, -d / 2 + 0.25)); group.add(mesh(box(w, 0.3, 0.3, 0.02), cm, 0, WALL_H - 0.15, -d / 2 + 0.15)); }
  }
  // 커튼 달린 창문 (곡선 윗단 · 창틀 · 창턱 화분)
  function buildWindow(win, ww, hh, room, seed, withSky = true) {
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(ww, hh), new THREE.MeshBasicMaterial({ map: PM.ctex('winsky', 128, 128, (g, W2, H2) => { const gr = g.createLinearGradient(0, 0, 0, H2); gr.addColorStop(0, '#8fd0ff'); gr.addColorStop(1, '#e6f6ff'); g.fillStyle = gr; g.fillRect(0, 0, W2, H2); g.fillStyle = 'rgba(255,255,255,0.9)'; for (const [x, y, r] of [[30, 40, 14], [46, 36, 18], [62, 42, 12], [92, 80, 10], [104, 76, 14]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } g.fillStyle = '#9ad67a'; g.beginPath(); g.ellipse(64, H2 + 30, 90, 50, 0, 0, Math.PI * 2); g.fill(); }), color: FM.W && FM.W.nightness > 0.5 ? 0x2a3060 : 0xffffff }));
    win.add(sky);
    const fm = mat(0xffffff);
    for (const [x, y, fw, fh] of [[0, hh / 2 + 0.04, ww + 0.16, 0.1], [0, -hh / 2 - 0.04, ww + 0.16, 0.1], [-ww / 2 - 0.04, 0, 0.1, hh + 0.12], [ww / 2 + 0.04, 0, 0.1, hh + 0.12], [0, 0, 0.05, hh], [0, 0.05, ww, 0.05]]) win.add(mesh(box(fw, fh, 0.08, 0.02), fm, x, y, 0.03));
    // 창턱 + 화분
    win.add(mesh(box(ww + 0.35, 0.06, 0.24, 0.02), fm, 0, -hh / 2 - 0.1, 0.1));
    const pot = new THREE.Group(); pot.position.set(ww * 0.28, -hh / 2 - 0.07, 0.12);
    pot.add(mesh(cyl(0.07, 0.055, 0.12), mat(0xe8845a), 0, 0.06, 0));
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const lf = mesh(sphere(0.06), mat(0x6cc36a), Math.cos(a) * 0.05, 0.17, Math.sin(a) * 0.05); lf.scale.set(0.7, 1.3, 0.7); pot.add(lf); }
    pot.add(mesh(sphere(0.035), mat(PASTEL[seed % PASTEL.length] === 0xc8efc0 ? 0xff8fb1 : PASTEL[seed % PASTEL.length]), 0, 0.24, 0));
    win.add(pot);
    // 커튼 (주름진 천 + 봉 + 묶음 끈)
    const cc = room.wall2 !== undefined && room.wall2 !== null ? mixC(room.wall2, 0xffffff, 0.3) : PASTEL[(seed + 3) % PASTEL.length];
    const cm = mat(cc);
    win.add(mesh(cyl(0.02, 0.02, ww + 0.9), mat(0xd9b44a), 0, hh / 2 + 0.2, 0.14).rotateZ(Math.PI / 2));
    for (const sx of [-1, 1]) {
      win.add(mesh(sphere(0.04), mat(0xd9b44a), sx * (ww / 2 + 0.47), hh / 2 + 0.2, 0.14));
      for (let k = 0; k < 3; k++) {
        const fold = mesh(capsule(0.06, hh + 0.05), cm, sx * (ww / 2 + 0.1 + k * 0.1), -0.02, 0.16 + (k % 2) * 0.03);
        fold.rotation.z = -sx * 0.08; fold.scale.set(1, 1, 0.7); win.add(fold);
      }
      win.add(mesh(geo('tieback', () => new THREE.TorusGeometry(0.16, 0.022, 6, 16)), mat(0xfffaf2), sx * (ww / 2 + 0.2), -hh * 0.15, 0.18).rotateX(Math.PI / 2));
    }
    // 가리비 모양 발란스
    for (let i = 0; i < 7; i++) { const sc = mesh(sphere(0.1), cm, -ww / 2 - 0.15 + i * (ww + 0.3) / 6, hh / 2 + 0.12, 0.17); sc.scale.set(1.1, 0.7, 0.4); win.add(sc); }
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
    WALL_H = (FM.INTERIORS[iid] && FM.INTERIORS[iid].wallH) || 3;
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
    // 무늬 한 장 ≈ 1.4m 로 촘촘하게 (벽 크기별로 반복 수 조절)
    const TILE = 1.4;
    const fineWall = !(room.patterns && room.patterns.wall) && !themeId;
    // 레퍼런스 스타일 벽 (st_*): 벽마다 다른 재질 가능 (뒤 / 왼쪽 / 오른쪽)
    const stMat = (style, len) => {
      const W = FM.RoomKit && FM.RoomKit.wallTexture(style.slice(3)); if (!W) return null;
      const t = W.tex.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(W.tileW ? Math.max(1, Math.round(len / W.tileW)) : 1, 1);
      return H.soften(new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide, color: room.wallTint || 0xffffff }), 0.1);
    };
    const stOK = st => !themeId && !(room.patterns && room.patterns.wall) && st && st.startsWith('st_');
    const wallMat = (len, st) => { if (stOK(st)) { const m = stMat(st, len); if (m) return m; } if (!fineWall) return H.soften(new THREE.MeshLambertMaterial({ map: wallMap, side: THREE.DoubleSide }), 0.1); const t = wallMap.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(Math.max(1, Math.round(len / TILE)), WALL_H / TILE); return H.soften(new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide }), 0.1); };
    const wm = wallMat(w, room.wallStyle), wmL = wallMat(d, room.wallStyleL || room.wallStyle), wmR = wallMat(d, room.wallStyleR || room.wallStyle);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(w, WALL_H), wm); back.position.set(0, WALL_H / 2, -d / 2); back.receiveShadow = true; group.add(back);
    for (const s of [-1, 1]) { const side = new THREE.Mesh(new THREE.PlaneGeometry(d, WALL_H), s < 0 ? wmL : wmR); side.position.set(s * w / 2, WALL_H / 2, 0); side.rotation.y = -s * Math.PI / 2; side.receiveShadow = true; group.add(side); side.name = 'sideWall'; }
    // 걸레받이
    const bb = mat(0xffffff);
    group.add(mesh(box(w, 0.12, 0.06, 0.02), bb, 0, 0.06, -d / 2 + 0.03));
    for (const s of [-1, 1]) group.add(mesh(box(0.06, 0.12, d, 0.02), bb, s * (w / 2 - 0.03), 0.06, 0));
    // 몰딩 · 징두리 판벽 · 러그 · 가랜드 (세련되고 아기자기하게)
    decorShell(group, I, room, themeId, w, d, res);
    // 창문 틀 (뒷벽) / 스카이라인
    if ((I.kind === 'room' && !room.roomStyle) || I.skyline) {
      const win = new THREE.Group(); win.position.set(I.skyline ? 0 : -w / 4, 1.7, -d / 2 + 0.05);
      const sky = new THREE.Mesh(new THREE.PlaneGeometry(I.skyline ? w - 1 : 1.6, I.skyline ? 1.8 : 1.1), new THREE.MeshBasicMaterial({ map: I.skyline ? PM.ctex('skyline', 512, 128, (g, W2, H2) => { g.fillStyle = '#1a1a3a'; g.fillRect(0, 0, W2, H2); for (let x = 0; x < W2; x += 22) { const hh = 30 + Math.random() * 80; g.fillStyle = '#0a0a1a'; g.fillRect(x, H2 - hh, 18, hh); g.fillStyle = '#ffe9a8'; for (let y = H2 - hh + 6; y < H2; y += 10) if (Math.random() < 0.5) g.fillRect(x + 4, y, 3, 3); } }) : null, color: I.skyline ? 0xffffff : (FM.W.nightness > 0.5 ? 0x1a2040 : 0x9fd6ff) }));
      win.add(sky);
      if (I.kind === 'room' && !I.skyline && !themeId) { win.remove(sky); buildWindow(win, 1.6, 1.1, room, 7); group.add(win); win.userData.fancy = true; }
      const frameCol = theme && themeId === 'hanok' ? 0x8a5a3b : themeId === 'prison' ? 0x55595f : 0xffffff;
      if (!I.skyline && !win.userData.fancy) for (const [x, y, ww, hh] of [[0, 0.58, 1.8, 0.1], [0, -0.58, 1.8, 0.1], [-0.85, 0, 0.1, 1.2], [0.85, 0, 0.1, 1.2], [0, 0, 0.06, 1.1]]) win.add(mesh(box(ww, hh, 0.08, 0.02), mat(frameCol), x, y, 0.02));
      if (themeId === 'prison' && !I.skyline) for (let i = -2; i <= 2; i++) win.add(mesh(cyl(0.02, 0.02, 1.1), mat(0x55595f), i * 0.3, 0, 0.05));
      group.add(win);
    }
    // 가구 (2~5 레이어)
    const furn = (st.rooms[iid] && st.rooms[iid].furn) || I.furn || [];
    const lampList = []; res.lamps = [];
    const pats = room.patterns || {};
    furn.forEach((f, idx) => {
      const F = FM.FURN[f.type]; if (!F) return;
      const tags = F.tags || [];
      let pattern = null;
      if (pats.bed && tags.includes('bed')) pattern = patTex(pats.bed);
      if (pats.sofa && tags.includes('sofa')) pattern = patTex(pats.sofa);
      if (pats.frame && (tags.includes('frame') || f.type === 'poster')) pattern = patTex(pats.frame);
      if (f.img && F.photo) pattern = imgTex(f.img);
      const opts = { mat: f.mat, color: f.color, pattern, hue: room.roomStyle && !themeId ? room.kitHue || 0 : 0 };
      if (f.type === 'photo_crush') { const owner = st.villagers.find(v => v.home === iid); const tgt = f.target || (owner && owner.crush && owner.crush.target); if (tgt) opts.faceTex = faceTex(tgt); }
      const o = PM.furniture(f.type, opts);
      if (pattern && !f.img && !F.parts.some(p => (p[8] || '').includes('pic'))) o.traverse(m => { if (m.isMesh && m.userData.main) { m.material = new THREE.MeshLambertMaterial({ map: pattern }); } });
      o.position.set(f.x, f.y || 0, f.z);   // f.y: 복층(2층) 가구
      o.rotation.y = (f.rot || 0) * Math.PI / 180;
      o.userData.furnIdx = idx;
      o.traverse(m => { m.userData.furnIdx = idx; });
      group.add(o);
      res.furnObjs.push(o);
      if ((F.ceiling || F.layer === 'light') && !F.lamp) {
        const lc = D.LIGHT_COLORS[room.light || 'warm'] || D.LIGHT_COLORS.warm;
        const base = f.type === 'ceiling_light' || f.type === 'chandelier' ? 0.5 : 0.22;
        const pl = new THREE.PointLight(lc.color, room.lightOn === false ? 0.04 : base, Math.max(w, d) * 1.3, 1.8);
        pl.userData.base = base;
        pl.position.set(f.x, 2.5, f.z);
        group.add(pl); res.lights.push(pl);
      }
      if (f.type === 'mirrorball') res.disco = o;
      // 가구 자체 발광 (스탠드 · 무드등 · 네온 · 창빛)
      if (F.lamp) for (const [lx, ly, lz, col, inten, dist] of F.lamp) {
        const r = (f.rot || 0) * Math.PI / 180, wx = f.x + lx * Math.cos(r) + lz * Math.sin(r), wz = f.z - lx * Math.sin(r) + lz * Math.cos(r);
        lampList.push({ x: wx, y: ly + (f.y || 0), z: wz, col, inten, dist });
      }
    });
    // 램프 빛은 밝은 순으로 최대 5개 (모바일 성능)
    if (room.roomStyle && !themeId && FM.RoomKit && FM.RoomKit.STYLES[room.roomStyle]) res.mood = FM.RoomKit.moodFor(room.roomStyle, room.moodVar || 'base');
    // 공용 장소 전용 무드 (레퍼런스 인테리어) — { main, lamp, hemi, amb, dir, bg, shadow }
    if (!res.mood && !themeId && room.venueMood) { const b = room.venueMood; res.mood = { main: b.main || 1, lamp: b.lamp || 1, hemi: b.hemi.slice(), amb: b.amb.slice(), dir: b.dir.slice(), bg: b.bg, shadow: b.shadow || null, rim: b.rim }; }
    const lampK = res.mood ? res.mood.lamp || 1 : 1;
    lampList.sort((a, b) => b.inten - a.inten).slice(0, I.maxLamps || (I.kind === 'venue' ? 8 : 5)).forEach(L => {
      L.inten *= lampK;
      const pl = new THREE.PointLight(FM.RoomKit ? FM.RoomKit.hueShift(L.col, room.kitHue || 0) : L.col, L.inten, L.dist, 1.6); pl.position.set(L.x, L.y, L.z); pl.userData.base = L.inten; pl.userData.ph = L.x * 3 + L.z;
      group.add(pl); res.lamps.push(pl);
    });
    // 조명이 하나도 없으면 기본 조명
    if (!res.lights.length) { const pl = new THREE.PointLight((D.LIGHT_COLORS[room.light || 'warm'] || D.LIGHT_COLORS.warm).color, room.lightOn === false ? 0.04 : 0.5, Math.max(w, d) * 1.5, 1.8); pl.userData.base = 0.5; pl.position.set(0, 2.6, 0); group.add(pl); res.lights.push(pl); }
    // 조명이 여러 개면 합이 너무 밝아지지 않게 나눔
    res.lightScale = 1 / Math.max(1, Math.sqrt(res.lights.length));
    // 스타일 방은 천장 주조명을 낮추고 무드등이 분위기를 만들게
    if (res.mood && res.mood.main) res.lightScale = (res.lightScale || 1) * res.mood.main;
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
    if (res.bulbs) res.bulbs.forEach((b, i) => { const k = 1 + Math.sin(t * 2.2 + i * 1.7) * 0.18; b.scale.set(k, k * 1.25, k); });
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
    // 램프: 은은하게 숨쉬듯 (조명을 꺼도 무드등은 켜져 있어 더 아늑)
    for (const l of res.lamps || []) l.intensity = l.userData.base * (1 + Math.sin(t * 1.3 + l.userData.ph) * 0.06) * (room && room.lightOn === false ? 1.15 : 1);
    updateParticles(res, dt, t);
    if (res.disco) res.disco.rotation.y += dt * 2;
  };
})();
