/* Canvas 로 그리는 텍스처들 (이미지 파일 없이 전부 코드로 생성) */
(() => {
  'use strict';
  const ISLE = window.ISLE;
  const cache = new Map();

  function canvasTex(key, w, h, draw, repeat) {
    if (cache.has(key)) return cache.get(key);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    draw(g, w, h);
    const t = new THREE.CanvasTexture(c);
    if (repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeat[0], repeat[1]);
    }
    t.anisotropy = 4;
    cache.set(key, t);
    return t;
  }

  const hex = n => '#' + n.toString(16).padStart(6, '0');
  function rnd(seed) {
    let s = seed;
    return () => ((s = (s * 16807) % 2147483647) / 2147483647);
  }
  function circle(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  function ellipse(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); }

  const T = {};

  // ---------- 지형 ----------
  T.grass = () => canvasTex('grass', 128, 128, (g, w, h) => {
    g.fillStyle = '#8fd46a'; g.fillRect(0, 0, w, h);
    const r = rnd(7);
    for (let i = 0; i < 18; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(255,255,220,.10)' : 'rgba(60,120,40,.08)';
      ellipse(g, r() * w, r() * h, 12 + r() * 16, 8 + r() * 10);
    }
    // 동물의 숲 풍 작은 삼각형 잔디 무늬
    g.fillStyle = '#6fbd4f';
    for (let i = 0; i < 14; i++) {
      const x = r() * w, y = r() * h, s = 5 + r() * 3;
      g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.8, y + s * 0.5); g.lineTo(x - s * 0.8, y + s * 0.5); g.closePath(); g.fill();
    }
    g.fillStyle = '#fff8d8';
    for (let i = 0; i < 4; i++) circle(g, r() * w, r() * h, 1.6);
  });

  T.sand = () => canvasTex('sand', 128, 128, (g, w, h) => {
    g.fillStyle = '#f5e2a6'; g.fillRect(0, 0, w, h);
    const r = rnd(3);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = r() < 0.5 ? '#e7cf8c' : '#fff3c8';
      circle(g, r() * w, r() * h, 1 + r() * 1.5);
    }
  });

  T.path = () => canvasTex('path', 128, 128, (g, w, h) => {
    g.fillStyle = '#e2c595'; g.fillRect(0, 0, w, h);
    const r = rnd(11);
    for (let i = 0; i < 16; i++) {
      g.fillStyle = r() < 0.5 ? '#d4b27d' : '#ecd4a8';
      ellipse(g, r() * w, r() * h, 8 + r() * 8, 5 + r() * 5, r() * 3);
    }
  });

  T.cliff = () => canvasTex('cliff', 128, 128, (g, w, h) => {
    g.fillStyle = '#a57b52'; g.fillRect(0, 0, w, h);
    const r = rnd(5);
    for (let y = 0; y < h; y += 16) {
      g.fillStyle = y % 32 ? '#9a7049' : '#b08659';
      g.fillRect(0, y, w, 8);
    }
    for (let i = 0; i < 30; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(80,50,30,.25)' : 'rgba(255,230,190,.2)';
      ellipse(g, r() * w, r() * h, 6 + r() * 8, 2 + r() * 3);
    }
  });

  T.sea = () => canvasTex('sea', 256, 256, (g, w, h) => {
    g.fillStyle = '#4fc6e3'; g.fillRect(0, 0, w, h);
    const r = rnd(21);
    g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 3; g.lineCap = 'round';
    for (let i = 0; i < 22; i++) {
      const x = r() * w, y = r() * h, s = 10 + r() * 14;
      g.beginPath(); g.moveTo(x - s, y); g.quadraticCurveTo(x, y - s * 0.5, x + s, y); g.stroke();
    }
  }, [1, 1]);

  T.river = () => canvasTex('river', 64, 128, (g, w, h) => {
    g.fillStyle = '#5ccbe6'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.lineCap = 'round';
    const r = rnd(2);
    for (let i = 0; i < 9; i++) {
      const x = r() * w, y = r() * h;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y + 12 + r() * 10); g.stroke();
    }
  }, [1, 1]);

  T.waterfall = () => canvasTex('waterfall', 64, 128, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#9fe6f5'); grd.addColorStop(1, '#e8fbff');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    const r = rnd(9);
    for (let i = 0; i < 26; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.8)' : 'rgba(90,190,220,.45)';
      g.fillRect(r() * w, r() * h, 2 + r() * 4, 14 + r() * 30);
    }
  }, [1, 1]);

  // ---------- 실내 ----------
  T.wallpaper = () => canvasTex('wallpaper', 256, 256, (g, w, h) => {
    g.fillStyle = '#f7efcc'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#b9cf8f'; g.lineWidth = 5; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(i * 96 + 10, 0);
      g.bezierCurveTo(i * 96 + 70, 70, i * 96 - 20, 170, i * 96 + 50, 256);
      g.stroke();
    }
    const flower = (x, y, s) => {
      g.fillStyle = '#f0a33a';
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2;
        ellipse(g, x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.7, s * 0.4, a);
      }
      g.fillStyle = '#c96a2a'; circle(g, x, y, s * 0.55);
      g.fillStyle = '#ffd36a'; circle(g, x - 2, y - 2, s * 0.25);
    };
    const r = rnd(4);
    for (let i = 0; i < 9; i++) flower(r() * w, r() * h, 10 + r() * 5);
    g.fillStyle = '#8fb86a';
    for (let i = 0; i < 14; i++) ellipse(g, r() * w, r() * h, 9, 4, r() * 3);
  }, [3, 1]);

  T.floor = () => canvasTex('floor', 128, 128, (g, w, h) => {
    g.fillStyle = '#4f9189'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) {
      g.fillStyle = (y / 32) % 2 ? '#4a8981' : '#56998f';
      g.fillRect(0, y, w, 31);
      g.fillStyle = '#3a7069';
      g.fillRect(0, y + 31, w, 1);
      g.fillRect(((y * 7) % 96) + 16, y, 2, 31);
    }
    // 흐릿한 잎 그림자 무늬
    g.fillStyle = 'rgba(200,255,240,.12)';
    ellipse(g, 40, 50, 22, 10, 0.6); ellipse(g, 90, 95, 18, 8, -0.4);
  }, [5, 4]);

  T.rug = () => canvasTex('rug', 192, 128, (g, w, h) => {
    const cols = ['#ffffff', '#f3c7c7', '#7fc8c0', '#e9e1cf', '#9fd6f0', '#e89a9a'];
    const r = rnd(8);
    const s = 8;
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
      const cx = Math.abs(x - w / 2) / w, cy = Math.abs(y - h / 2) / h;
      const k = Math.floor((cx + cy) * 12 + r() * 1.6) % cols.length;
      g.fillStyle = cols[k]; g.fillRect(x, y, s - 1, s - 1);
    }
    g.strokeStyle = '#e8dcc2'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  });

  T.diamond = () => canvasTex('diamond', 128, 128, (g, w, h) => {
    g.fillStyle = '#3f4f5c'; g.fillRect(0, 0, w, h);
    const d = (x, y, s, c) => {
      g.fillStyle = c; g.beginPath();
      g.moveTo(x, y - s); g.lineTo(x + s, y); g.lineTo(x, y + s); g.lineTo(x - s, y); g.closePath(); g.fill();
    };
    for (let y = 0; y <= h; y += 32) for (let x = 0; x <= w; x += 32) {
      const ox = (y / 32) % 2 ? 16 : 0;
      d(x + ox, y, 14, '#5f9c95'); d(x + ox, y, 9, '#d9a24a'); d(x + ox, y, 4, '#3f4f5c');
    }
  }, [2, 1]);

  T.books = () => canvasTex('books', 128, 128, (g, w, h) => {
    g.fillStyle = '#5a3a24'; g.fillRect(0, 0, w, h);
    const cols = ['#8e2f2f', '#2f5e4a', '#c9a24a', '#384e7a', '#7a4a2f', '#e8e0cc', '#4f8f86'];
    const r = rnd(12);
    for (let row = 0; row < 3; row++) {
      let x = 4;
      const y0 = row * 42 + 4;
      while (x < w - 6) {
        const bw = 6 + r() * 8;
        g.fillStyle = cols[(r() * cols.length) | 0];
        const bh = 30 + r() * 6;
        g.fillRect(x, y0 + 36 - bh, bw, bh);
        g.fillStyle = 'rgba(255,230,160,.6)'; g.fillRect(x + 1, y0 + 40 - bh, bw - 2, 2);
        x += bw + 1;
      }
      g.fillStyle = '#3d2718'; g.fillRect(0, y0 + 36, w, 6);
    }
  });

  T.tvScreen = () => canvasTex('tv', 64, 48, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#6fc7ff'); grd.addColorStop(1, '#bfeaff');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; ellipse(g, 20, 18, 12, 6); ellipse(g, 30, 16, 10, 7); ellipse(g, 46, 24, 9, 5);
    g.fillStyle = '#3fa0d8'; g.fillRect(0, h - 10, w, 10);
  });

  T.window = () => canvasTex('window', 64, 64, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#5fbfff'); grd.addColorStop(1, '#c6ecff');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.9)'; ellipse(g, 20, 40, 14, 6); ellipse(g, 44, 22, 10, 5);
  });

  T.clockFace = () => canvasTex('clock', 128, 128, (g, w, h) => {
    g.fillStyle = '#fff'; circle(g, 64, 64, 60);
    g.fillStyle = '#333'; g.font = 'bold 16px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) {
      const a = i / 12 * Math.PI * 2 - Math.PI / 2;
      g.fillText(String(i), 64 + Math.cos(a) * 46, 64 + Math.sin(a) * 46);
    }
  });

  // ---------- 옷 무늬 ----------
  T.shirt = (pattern, base) => canvasTex('shirt-' + pattern + base, 128, 64, (g, w, h) => {
    g.fillStyle = hex(base); g.fillRect(0, 0, w, h);
    if (pattern === 'stripe') {
      g.fillStyle = '#ffffff';
      for (let y = 4; y < h; y += 14) g.fillRect(0, y, w, 6);
    } else if (pattern === 'stripe2') {
      const c = ['#ff6f61', '#ffffff', '#4fc1c9', '#2f4b6e'];
      for (let y = 0, i = 0; y < h; y += 8, i++) { g.fillStyle = c[i % 4]; g.fillRect(0, y, w, 5); }
    } else if (pattern === 'snow') {
      g.fillStyle = '#ffffff';
      for (let x = 4; x < w; x += 16) { circle(g, x, 20, 3); circle(g, x + 8, 30, 2); }
      g.fillRect(0, 38, w, 3);
      g.fillStyle = '#9aa6b3';
      for (let x = 0; x < w; x += 10) g.fillRect(x, 44, 5, 5);
    } else if (pattern === 'plaid') {
      g.fillStyle = 'rgba(120,90,60,.45)';
      for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 6, h);
      for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 6);
      g.fillStyle = 'rgba(255,220,120,.6)';
      for (let x = 10; x < w; x += 16) g.fillRect(x, 0, 1.5, h);
    } else if (pattern === 'dots') {
      const c = ['#ff4d4d', '#ffd23a', '#3aa0ff', '#3ac46a'];
      let i = 0;
      for (let y = 8; y < h; y += 18) for (let x = (y / 18) % 2 ? 14 : 4; x < w; x += 20) {
        g.fillStyle = c[i++ % 4]; ellipse(g, x, y, 6, 4.5);
      }
    }
  }, [2, 1]);

  // ---------- 얼굴 ----------
  // 얼굴은 머리 앞쪽 일부를 덮는 구면 조각에 입히는 투명 텍스처
  T.face = (v, blink) => canvasTex('face-' + v.id + (blink ? '-b' : ''), 256, 192, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const ink = '#2e2320';
    const ex = [w * 0.33, w * 0.67], ey = h * 0.42;
    // 고양이 이마 줄무늬
    if (v.species === 'cat' && v.stripe) {
      g.strokeStyle = hex(v.stripe); g.lineWidth = 7; g.lineCap = 'round';
      for (const x of [w * 0.44, w * 0.5, w * 0.56]) { g.beginPath(); g.moveTo(x, 4); g.lineTo(x, 34); g.stroke(); }
    }
    // 눈
    g.fillStyle = ink; g.strokeStyle = ink; g.lineCap = 'round';
    for (const x of ex) {
      if (blink) { g.lineWidth = 6; g.beginPath(); g.moveTo(x - 14, ey + 2); g.quadraticCurveTo(x, ey + 8, x + 14, ey + 2); g.stroke(); continue; }
      if (v.eyes === 'happy' || v.eyes === 'smile') {
        g.lineWidth = 7; g.beginPath(); g.moveTo(x - 15, ey + 6); g.quadraticCurveTo(x, ey - 14, x + 15, ey + 6); g.stroke();
      } else if (v.eyes === 'sparkle') {
        ellipse(g, x, ey, 17, 21);
        g.fillStyle = '#fff'; circle(g, x - 6, ey - 8, 6); circle(g, x + 6, ey + 7, 3); g.fillStyle = ink;
      } else {
        ellipse(g, x, ey, 12, 16);
        g.fillStyle = '#fff'; circle(g, x - 4, ey - 6, 4.5); g.fillStyle = ink;
      }
    }
    // 볼터치
    g.fillStyle = v.blush ? hex(v.blush) + 'aa' : 'rgba(255,120,140,.55)';
    ellipse(g, w * 0.17, h * 0.6, 20, 12); ellipse(g, w * 0.83, h * 0.6, 20, 12);
    // 입
    g.lineWidth = 5; g.strokeStyle = '#6a3a2e';
    const mx = w * 0.5, my = h * 0.66;
    if (v.mouth === 'w') {
      g.beginPath(); g.moveTo(mx - 16, my - 4); g.quadraticCurveTo(mx - 8, my + 10, mx, my - 2); g.quadraticCurveTo(mx + 8, my + 10, mx + 16, my - 4); g.stroke();
    } else if (v.mouth === 'smile') {
      g.beginPath(); g.moveTo(mx - 12, my - 4); g.quadraticCurveTo(mx, my + 12, mx + 12, my - 4); g.stroke();
    } else if (v.mouth === 'tooth') {
      g.fillStyle = '#7a2f2f'; ellipse(g, mx, my, 10, 8);
      g.fillStyle = '#fff'; g.fillRect(mx - 7, my - 8, 6, 8); g.fillRect(mx + 1, my - 8, 6, 8);
    }
  });

  ISLE.TEX = T;
  ISLE.hex = hex;
})();
