// =========================================================
// 자체 아이콘 세트 — 이모티콘(시스템 이모지) 대신 게임 고유의 그림 아이콘
//  - 갈색 외곽선 + 파스텔 채색의 둥근 스타일 (64x64 SVG)
//  - DOM: 텍스트 속 이모지를 <img class="fmi">로 자동 치환
//  - Canvas: fillText 안의 이모지를 아이콘 이미지로 그림 (머리 위 감정, 풍선, 간판 등)
//  - 세트에 없는 이모지는 그대로 둠
// =========================================================
(() => {
  const FM = window.FM = window.FM || {};
  const O = '#5b3b2b';
  const S = `stroke="${O}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const S2 = `stroke="${O}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
  const N = 'fill="none"';

  // ---------- 공용 조각 ----------
  const heartPath = (cx, cy, s) => { const k = s / 20; return `M${cx} ${cy + 16 * k} C${cx - 4 * k} ${cy + 12 * k} ${cx - 20 * k} ${cy + 2 * k} ${cx - 20 * k} ${cy - 8 * k} C${cx - 20 * k} ${cy - 16 * k} ${cx - 12 * k} ${cy - 20 * k} ${cx - 6 * k} ${cy - 18 * k} C${cx - 3 * k} ${cy - 17 * k} ${cx - 1 * k} ${cy - 15 * k} ${cx} ${cy - 12 * k} C${cx + 1 * k} ${cy - 15 * k} ${cx + 3 * k} ${cy - 17 * k} ${cx + 6 * k} ${cy - 18 * k} C${cx + 12 * k} ${cy - 20 * k} ${cx + 20 * k} ${cy - 16 * k} ${cx + 20 * k} ${cy - 8 * k} C${cx + 20 * k} ${cy + 2 * k} ${cx + 4 * k} ${cy + 12 * k} ${cx} ${cy + 16 * k}Z`; };
  const heart = (cx, cy, s, col, extra = '') => `<path d="${heartPath(cx, cy, s)}" fill="${col}" ${S}/>` + `<ellipse cx="${cx - s * 0.45}" cy="${cy - s * 0.45}" rx="${s * 0.16}" ry="${s * 0.1}" fill="#fff" opacity=".8" transform="rotate(-35 ${cx - s * 0.45} ${cy - s * 0.45})"/>` + extra;
  const star = (cx, cy, r, col, sw = 3) => { let p = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.48 : r; p += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1); } return `<path d="${p}Z" fill="${col}" stroke="${O}" stroke-width="${sw}" stroke-linejoin="round"/>`; };
  const spark = (cx, cy, r, col) => `<path d="M${cx} ${cy - r} Q${cx + r * 0.2} ${cy - r * 0.2} ${cx + r} ${cy} Q${cx + r * 0.2} ${cy + r * 0.2} ${cx} ${cy + r} Q${cx - r * 0.2} ${cy + r * 0.2} ${cx - r} ${cy} Q${cx - r * 0.2} ${cy - r * 0.2} ${cx} ${cy - r}Z" fill="${col}" ${S2}/>`;
  const drop = (cx, cy, s, col = '#8fd3ff') => `<path d="M${cx} ${cy - s} C${cx + s * 0.2} ${cy - s * 0.5} ${cx + s * 0.75} ${cy - s * 0.05} ${cx + s * 0.75} ${cy + s * 0.4} A${s * 0.75} ${s * 0.75} 0 0 1 ${cx - s * 0.75} ${cy + s * 0.4} C${cx - s * 0.75} ${cy - s * 0.05} ${cx - s * 0.2} ${cy - s * 0.5} ${cx} ${cy - s}Z" fill="${col}" ${S2}/>`;
  const note = (x, y, col = '#9a7bff') => `<path d="M${x + 8} ${y + 22} V${y}  L${x + 22} ${y - 4} V${y + 16}" ${N} ${S}/><ellipse cx="${x + 4}" cy="${y + 23}" rx="6" ry="4.6" fill="${col}" ${S2}/><ellipse cx="${x + 18}" cy="${y + 17}" rx="6" ry="4.6" fill="${col}" ${S2}/>`;
  const cloud = (col = '#ffffff', y = 0) => `<path d="M14 ${44 + y} A10 10 0 0 1 16 ${25 + y} A13 13 0 0 1 40 ${20 + y} A10 10 0 0 1 52 ${44 + y}Z" fill="${col}" ${S}/>`;
  const bubble = (col = '#fff') => `<path d="M10 28 C10 14 22 8 32 8 C44 8 54 14 54 28 C54 40 44 46 32 46 C29 46 26 46 23 45 L12 54 L15 42 C11 39 10 34 10 28Z" fill="${col}" ${S}/>`;

  // ---------- 얼굴 생성기 ----------
  const eyesDot = '<ellipse cx="23" cy="30" rx="3" ry="4" fill="' + O + '"/><ellipse cx="41" cy="30" rx="3" ry="4" fill="' + O + '"/><circle cx="24" cy="28.5" r="1.1" fill="#fff"/><circle cx="42" cy="28.5" r="1.1" fill="#fff"/>';
  const eyesHappy = `<path d="M18 31 Q23 25 28 31 M36 31 Q41 25 46 31" ${N} ${S}/>`;
  const eyesX = `<path d="M18 26 L26 30 L18 34 M46 26 L38 30 L46 34" ${N} ${S}/>`;
  const eyesClosed = `<path d="M18 31 Q23 35 28 31 M36 31 Q41 35 46 31" ${N} ${S}/>`;
  const eyesWide = `<circle cx="23" cy="29" r="6" fill="#fff" ${S2}/><circle cx="41" cy="29" r="6" fill="#fff" ${S2}/><circle cx="23" cy="30" r="2.6" fill="${O}"/><circle cx="41" cy="30" r="2.6" fill="${O}"/>`;
  const eyesSad = `<path d="M18 28 L27 31 M46 28 L37 31" ${N} ${S}/><ellipse cx="23" cy="34" rx="2.6" ry="3.2" fill="${O}"/><ellipse cx="41" cy="34" rx="2.6" ry="3.2" fill="${O}"/>`;
  const eyesFlat = `<path d="M18 31 H28 M36 31 H46" ${N} ${S}/>`;
  const eyesShine = `<ellipse cx="23" cy="31" rx="6" ry="7" fill="${O}"/><ellipse cx="41" cy="31" rx="6" ry="7" fill="${O}"/><circle cx="25" cy="28" r="2.4" fill="#fff"/><circle cx="43" cy="28" r="2.4" fill="#fff"/><circle cx="21" cy="34" r="1.2" fill="#fff"/><circle cx="39" cy="34" r="1.2" fill="#fff"/><path d="M17 37 Q23 40 29 37" fill="none" stroke="#8fd3ff" stroke-width="2.4"/><path d="M35 37 Q41 40 47 37" fill="none" stroke="#8fd3ff" stroke-width="2.4"/>`;
  const browsAngry = `<path d="M16 22 L27 27 M48 22 L37 27" ${N} ${S}/>`;
  const browsWorry = `<path d="M17 24 L27 21 M47 24 L37 21" ${N} ${S}/>`;
  const blush = '<ellipse cx="16" cy="40" rx="5" ry="3" fill="#ff9db5" opacity=".75"/><ellipse cx="48" cy="40" rx="5" ry="3" fill="#ff9db5" opacity=".75"/>';
  const bigBlush = '<ellipse cx="16" cy="39" rx="7" ry="4.2" fill="#ff7b9c" opacity=".8"/><ellipse cx="48" cy="39" rx="7" ry="4.2" fill="#ff7b9c" opacity=".8"/>';
  const mSmile = `<path d="M23 41 Q32 49 41 41" ${N} ${S}/>`;
  const mOpen = `<path d="M21 39 Q32 39 43 39 Q41 51 32 51 Q23 51 21 39Z" fill="#c4505a" ${S}/><path d="M26 47 Q32 44 38 47 Q35 50.5 32 50.5 Q29 50.5 26 47Z" fill="#ff8f9c"/>`;
  const mFrown = `<path d="M24 46 Q32 39 40 46" ${N} ${S}/>`;
  const mFlat = `<path d="M25 44 H39" ${N} ${S}/>`;
  const mO = `<ellipse cx="32" cy="45" rx="4" ry="5" fill="#c4505a" ${S2}/>`;
  const mBigO = `<ellipse cx="32" cy="45" rx="6" ry="8" fill="#c4505a" ${S}/>`;
  const mWavy = `<path d="M22 44 Q25 41 28 44 Q31 47 34 44 Q37 41 40 44 Q42 46 43 44" ${N} ${S}/>`;
  const mSmirk = `<path d="M26 44 Q36 46 42 39" ${N} ${S}/>`;
  const mTongue = `<path d="M23 40 Q32 48 41 40" ${N} ${S}/><path d="M30 44 Q30 52 35 52 Q40 52 38 43" fill="#ff7f93" ${S2}/>`;
  const mCry = `<path d="M22 47 Q32 36 42 47 Z" fill="#c4505a" ${S}/>`;
  const face = (inner, col = '#ffd86b', pre = '') => `${pre}<circle cx="32" cy="33" r="26" fill="${col}" ${S}/><ellipse cx="22" cy="18" rx="7" ry="4" fill="#fff" opacity=".45" transform="rotate(-25 22 18)"/>${inner}`;

  // ---------- 아이콘 정의 (64x64 내부 마크업) ----------
  const D = {
    // 얼굴
    '😊': face(eyesHappy + blush + mSmile),
    '🙂': face(eyesDot + mSmile),
    '😄': face(eyesHappy + blush + mOpen),
    '😆': face(eyesX + blush + mOpen),
    '😂': face(eyesX + mOpen + drop(10, 34, 7) + drop(54, 34, 7)),
    '😳': face(eyesWide + bigBlush + mO),
    '😢': face(eyesSad + mFrown + drop(20, 44, 5)),
    '😭': face(eyesClosed + mCry + `<path d="M20 34 V56 M44 34 V56" stroke="#8fd3ff" stroke-width="6" stroke-linecap="round"/>`),
    '😍': face(heart(23, 30, 8, '#ff5d7a') + heart(41, 30, 8, '#ff5d7a') + mOpen),
    '🥰': face(eyesHappy + blush + mSmile, '#ffd86b', '') + heart(10, 14, 6, '#ff6f9a') + heart(54, 12, 6, '#ff6f9a') + heart(55, 50, 5, '#ff6f9a'),
    '😤': face(browsAngry + eyesClosed + mFlat) + `<path d="M8 50 q-4 -4 0 -8 q4 -4 0 -8 M56 50 q4 -4 0 -8 q-4 -4 0 -8" fill="none" stroke="#c9d6e3" stroke-width="4" stroke-linecap="round"/>`,
    '😠': face(browsAngry + eyesDot + mFrown, '#ffc062'),
    '😡': face(browsAngry + eyesDot + mFrown, '#ff7a5c'),
    '😅': face(eyesHappy + mOpen) + drop(51, 16, 6),
    '😣': face(eyesX + mWavy),
    '😴': face(eyesClosed + `<ellipse cx="32" cy="45" rx="3.5" ry="3" fill="#c4505a" ${S2}/>`) + `<text x="46" y="16" font-family="Arial Black,Arial" font-weight="900" font-size="15" fill="#7a9cff" stroke="${O}" stroke-width="1.5">z</text>`,
    '😏': face(`<path d="M17 30 H28 M36 30 H47" ${N} ${S}/><ellipse cx="25" cy="32.5" rx="2.6" ry="2.4" fill="${O}"/><ellipse cx="44" cy="32.5" rx="2.6" ry="2.4" fill="${O}"/>` + mSmirk),
    '😎': face(`<path d="M12 26 H52 L50 28 Q49 38 40 38 Q34 38 33 30 H31 Q30 38 24 38 Q15 38 14 28Z" fill="#3a3a4a" ${S2}/><path d="M18 29 L22 29 M38 29 L42 29" stroke="#fff" stroke-width="2"/>` + mSmile),
    '😋': face(eyesHappy + blush + mTongue),
    '😈': `<path d="M12 18 L8 4 L22 12Z M52 18 L56 4 L42 12Z" fill="#a46cff" ${S}/>` + face(browsAngry + eyesDot + mSmirk, '#b98aff'),
    '🤔': face(`<path d="M17 24 L27 22 M37 25 L47 25" ${N} ${S}/>` + eyesDot + `<path d="M28 45 H40" ${N} ${S}/>`) + `<path d="M14 58 Q18 46 26 48 Q32 50 28 54 L24 58Z" fill="#ffd86b" ${S2}/>`,
    '😲': face(eyesWide + mBigO),
    '😱': face(eyesWide + mBigO, '#cfe3ff') + `<path d="M8 40 Q4 52 12 58 M56 40 Q60 52 52 58" ${N} ${S}/>`,
    '😔': face(eyesClosed + browsWorry + mFlat),
    '😒': face(`<path d="M17 29 H28 M36 29 H47" ${N} ${S}/><ellipse cx="25" cy="32" rx="2.6" ry="2.3" fill="${O}"/><ellipse cx="44" cy="32" rx="2.6" ry="2.3" fill="${O}"/>` + `<path d="M25 45 Q32 42 39 45" ${N} ${S}/>`),
    '😰': face(browsWorry + eyesDot + mWavy, '#ffd86b', '') + `<path d="M10 22 A26 26 0 0 1 54 22 Q32 14 10 22Z" fill="#8fbfff" opacity=".7"/>` + drop(53, 18, 6),
    '🥹': face(eyesShine + mWavy),
    '🤪': face(`<circle cx="22" cy="28" r="7" fill="#fff" ${S2}/><circle cx="23" cy="29" r="3" fill="${O}"/><circle cx="42" cy="31" r="4" fill="#fff" ${S2}/><circle cx="42" cy="31" r="2" fill="${O}"/>` + mTongue),
    '🤫': face(eyesHappy + `<path d="M26 43 Q32 46 38 43" ${N} ${S}/>`) + `<rect x="29" y="36" width="7" height="22" rx="3.5" fill="#ffc58a" ${S2}/>`,
    '🤐': face(eyesDot + `<path d="M20 44 H44" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M24 41 V47 M29 41 V47 M34 41 V47 M39 41 V47" stroke="#d0d0d8" stroke-width="2"/>`),
    '🤗': face(eyesHappy + blush + mSmile) + `<path d="M4 50 Q10 40 20 46 Q24 50 18 56 Z M60 50 Q54 40 44 46 Q40 50 46 56Z" fill="#ffc062" ${S2}/>`,
    '🙏': `<path d="M32 10 Q26 18 24 34 L18 54 H32Z M32 10 Q38 18 40 34 L46 54 H32Z" fill="#ffc58a" ${S}/><path d="M14 54 H50 V60 H14Z" fill="#ffffff" ${S2}/>`,
    '👶': face(eyesDot + blush + `<path d="M28 44 Q32 47 36 44" ${N} ${S}/>`, '#ffe0c2') + `<path d="M30 9 Q34 3 38 8" ${N} ${S}/><circle cx="32" cy="50" r="4" fill="#9fd8ff" ${S2}/>`,
    '👻': `<path d="M12 58 V28 A20 20 0 0 1 52 28 V58 L45 52 L38 58 L32 52 L26 58 L19 52Z" fill="#f4f7ff" ${S}/><ellipse cx="25" cy="30" rx="3.5" ry="5" fill="${O}"/><ellipse cx="39" cy="30" rx="3.5" ry="5" fill="${O}"/><ellipse cx="32" cy="42" rx="4" ry="3.5" fill="${O}"/>`,

    // 하트
    '💗': heart(32, 34, 24, '#ff7eb6') + `<path d="${heartPath(32, 34, 13)}" fill="#ffb3d6"/>`,
    '❤️': heart(32, 34, 24, '#ff4f6a'),
    '💕': heart(24, 38, 18, '#ff7eb6') + heart(45, 22, 13, '#ff9fcb'),
    '💔': `<path d="${heartPath(32, 34, 24)}" fill="#ff4f6a" ${S}/><path d="M32 22 L27 31 L35 37 L29 48" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><path d="M32 22 L27 31 L35 37 L29 48" fill="none" ${S2}/>`,
    '💘': `<path d="M6 54 L58 12" ${N} ${S}/><path d="M50 10 L58 12 L56 20" ${N} ${S}/>` + heart(32, 34, 21, '#ff5d8f') + `<path d="M6 54 L20 43" ${N} ${S}/><path d="M4 48 L10 54 L6 60" fill="#ffd86b" ${S2}/>`,
    '💞': heart(24, 26, 15, '#ff7eb6') + heart(42, 42, 15, '#ff4f8f') + `<path d="M8 46 Q4 30 14 18 M56 22 Q60 38 50 50" ${N} ${S2}/>`,
    '💖': heart(32, 36, 22, '#ff6fae') + spark(52, 12, 8, '#fff07a') + spark(11, 16, 6, '#fff07a'),
    '💓': heart(32, 34, 19, '#ff5d8f') + `<path d="M4 20 L10 24 M4 34 H10 M60 20 L54 24 M60 34 H54" ${N} ${S}/>`,
    '💝': heart(32, 36, 22, '#ff6fae') + `<path d="M32 22 V50 M14 30 H50" stroke="#ffe066" stroke-width="5"/><path d="M32 22 Q22 8 18 18 Q24 22 32 22 Q42 8 46 18 Q40 22 32 22Z" fill="#ffe066" ${S2}/>`,
    '💜': heart(32, 34, 24, '#a77bff'), '💙': heart(32, 34, 24, '#5fa8ff'), '💚': heart(32, 34, 24, '#5fd38a'), '💛': heart(32, 34, 24, '#ffd84a'), '🧡': heart(32, 34, 24, '#ff9f45'),
    '🤍': heart(32, 34, 24, '#ffffff'), '🖤': heart(32, 34, 24, '#3c3448'),
    '💌': `<rect x="8" y="16" width="48" height="34" rx="4" fill="#fff6e8" ${S}/><path d="M8 18 L32 36 L56 18" ${N} ${S}/>` + heart(32, 38, 9, '#ff5d8f'),
    '💑': heart(32, 14, 9, '#ff5d8f') + `<circle cx="20" cy="30" r="8" fill="#ffd8b0" ${S2}/><circle cx="44" cy="30" r="8" fill="#ffd8b0" ${S2}/><path d="M8 58 Q8 42 20 40 Q32 42 32 58Z" fill="#7ab8ff" ${S2}/><path d="M32 58 Q32 42 44 40 Q56 42 56 58Z" fill="#ff8fb8" ${S2}/><path d="M12 28 Q14 20 22 21 Q28 22 28 28 Q20 24 12 28Z M36 28 Q36 20 44 20 Q53 21 52 34 L48 28 Q42 24 36 28Z" fill="#7a4a2a"/>`,
    '💒': `<path d="M14 58 V30 L32 14 L50 30 V58Z" fill="#fff4f6" ${S}/><path d="M32 4 V14 M28 8 H36" ${N} ${S}/><path d="M26 58 V46 A6 6 0 0 1 38 46 V58" fill="#c98b5a" ${S2}/>` + heart(32, 32, 7, '#ff5d8f'),
    '💍': `<circle cx="32" cy="42" r="15" fill="none" stroke="${O}" stroke-width="9"/><circle cx="32" cy="42" r="15" fill="none" stroke="#ffd45a" stroke-width="5"/><path d="M24 20 L32 8 L40 20 L32 28Z" fill="#b6ecff" ${S}/><path d="M24 20 H40 M32 8 L29 20 L32 28 M32 8 L35 20" ${N} ${S2} opacity=".6"/>`,

    // 반짝/별/기호
    '✨': spark(26, 34, 20, '#ffe45c') + spark(49, 15, 10, '#fff2a0') + spark(50, 50, 7, '#fff2a0'),
    '⭐': star(32, 34, 26, '#ffd84a'),
    '🌟': star(32, 34, 22, '#ffe45c') + `<path d="M32 2 V8 M58 22 L53 25 M6 22 L11 25 M48 58 L45 53 M16 58 L19 53" ${N} ${S2}/>`,
    '🌠': `<path d="M6 56 L36 28" stroke="#ffe9a0" stroke-width="9" stroke-linecap="round"/><path d="M14 58 L38 34" stroke="#ffc2e0" stroke-width="4" stroke-linecap="round"/>` + star(42, 22, 16, '#ffd84a'),
    '💫': `<path d="M10 44 Q8 22 32 18 Q52 16 52 30" ${N} ${S}/>` + star(46, 40, 13, '#ffd84a') + spark(14, 14, 6, '#fff2a0'),
    '💢': `<g fill="#ff4d4d" ${S}><path d="M10 26 Q24 26 26 10 Q28 24 26 26Z"/><path d="M38 10 Q40 26 54 26 Q40 28 38 26Z"/><path d="M54 38 Q40 40 38 54 Q36 40 38 38Z"/><path d="M26 54 Q24 38 10 38 Q24 36 26 38Z"/></g>`,
    '❓': `<path d="M20 22 A12 12 0 1 1 38 32 Q32 36 32 42" fill="none" stroke="${O}" stroke-width="13" stroke-linecap="round"/><path d="M20 22 A12 12 0 1 1 38 32 Q32 36 32 42" fill="none" stroke="#ff8a5c" stroke-width="7" stroke-linecap="round"/><circle cx="32" cy="54" r="6" fill="#ff8a5c" ${S}/>`,
    '❗': `<path d="M26 8 H38 L35 40 H29Z" fill="#ff5c5c" ${S}/><circle cx="32" cy="52" r="6" fill="#ff5c5c" ${S}/>`,
    '❕': `<path d="M26 8 H38 L35 40 H29Z" fill="#fff" ${S}/><circle cx="32" cy="52" r="6" fill="#fff" ${S}/>`,
    '💤': `<g font-family="Arial Black,Arial" font-weight="900" fill="#9fb8ff" stroke="${O}" stroke-width="2"><text x="6" y="58" font-size="30">Z</text><text x="30" y="38" font-size="22">z</text><text x="44" y="20" font-size="16">z</text></g>`,
    '💭': `<circle cx="34" cy="26" r="20" fill="#fff" ${S}/><circle cx="16" cy="32" r="10" fill="#fff" ${S}/><circle cx="50" cy="34" r="10" fill="#fff" ${S}/><path d="M18 26 Q34 50 50 28" fill="#fff"/><circle cx="14" cy="50" r="5" fill="#fff" ${S2}/><circle cx="6" cy="59" r="3" fill="#fff" ${S2}/>`,
    '💬': bubble('#fff') + '<circle cx="22" cy="28" r="3" fill="' + O + '"/><circle cx="32" cy="28" r="3" fill="' + O + '"/><circle cx="42" cy="28" r="3" fill="' + O + '"/>',
    '🗯️': bubble('#ffe7e0') + `<path d="M24 20 L32 30 M40 20 L32 30" ${N} ${S}/>`,
    '🗣️': `<path d="M8 58 Q8 40 20 34 Q14 28 14 20 Q14 8 26 8 Q38 8 38 22 Q38 30 32 34 Q40 40 40 58Z" fill="#9aa6c8" ${S}/><path d="M44 18 Q50 24 44 30 M50 12 Q60 24 50 36" ${N} ${S}/>`,
    '💥': `<path d="M32 4 L38 20 L56 12 L46 28 L60 36 L42 40 L48 58 L32 46 L18 60 L20 42 L4 38 L18 28 L8 12 L26 20Z" fill="#ffb03a" ${S}/><path d="M32 18 L36 28 L46 26 L40 34 L44 44 L32 38 L24 46 L26 36 L18 32 L28 28Z" fill="#fff07a"/>`,
    '💨': `<path d="M8 22 H38 A8 8 0 1 0 30 14 M4 34 H50 A8 8 0 1 1 42 42 M12 46 H28" fill="none" stroke="${O}" stroke-width="9" stroke-linecap="round"/><path d="M8 22 H38 A8 8 0 1 0 30 14 M4 34 H50 A8 8 0 1 1 42 42 M12 46 H28" fill="none" stroke="#e4f2ff" stroke-width="4" stroke-linecap="round"/>`,
    '🌀': `<path d="M32 32 m0 -4 a4 4 0 1 1 -4 4 a8 8 0 0 1 8 -8 a12 12 0 0 1 12 12 a16 16 0 0 1 -16 16 a20 20 0 0 1 -20 -20 a24 24 0 0 1 24 -24" fill="none" stroke="${O}" stroke-width="9" stroke-linecap="round"/><path d="M32 32 m0 -4 a4 4 0 1 1 -4 4 a8 8 0 0 1 8 -8 a12 12 0 0 1 12 12 a16 16 0 0 1 -16 16 a20 20 0 0 1 -20 -20 a24 24 0 0 1 24 -24" fill="none" stroke="#7fc7ff" stroke-width="4.5" stroke-linecap="round"/>`,
    '💧': drop(32, 32, 24),
    '💦': drop(22, 38, 15) + drop(44, 24, 12) + drop(48, 50, 8),
    '⚡': `<path d="M38 4 L12 36 H30 L24 60 L52 26 H34Z" fill="#ffd84a" ${S}/>`,
    '🔥': `<path d="M32 4 Q46 18 46 30 Q50 26 50 20 Q60 32 56 44 Q52 60 32 60 Q12 60 8 44 Q6 32 16 24 Q16 32 22 34 Q16 18 32 4Z" fill="#ff7a3a" ${S}/><path d="M32 30 Q42 40 40 48 Q38 56 32 56 Q24 56 24 48 Q24 40 32 30Z" fill="#ffd84a"/>`,
    '🎵': note(14, 18),
    '🎶': note(4, 22, '#ff8fc8') + note(32, 10, '#9a7bff'),
    '🔺': `<path d="M32 10 L56 52 H8Z" fill="#ff6a6a" ${S}/>`,
    '🔷': `<path d="M32 6 L56 32 L32 58 L8 32Z" fill="#6fb6ff" ${S}/><path d="M32 6 L22 32 L32 58" ${N} ${S2} opacity=".5"/>`,
    '🟢': `<circle cx="32" cy="32" r="22" fill="#5fd38a" ${S}/>`,
    '🔴': `<circle cx="32" cy="32" r="22" fill="#ff5c5c" ${S}/>`,
    '🟡': `<circle cx="32" cy="32" r="22" fill="#ffd84a" ${S}/>`,
    '⏳': `<path d="M14 6 H50 M14 58 H50" ${N} stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M18 8 Q18 26 32 32 Q18 38 18 56 H46 Q46 38 32 32 Q46 26 46 8Z" fill="#e8f6ff" ${S}/><path d="M24 18 H40 Q38 26 32 29 Q26 26 24 18Z M22 54 Q24 44 32 42 Q40 44 42 54Z" fill="#ffcf6a"/>`,
    '📍': `<path d="M32 60 Q12 34 12 24 A20 20 0 0 1 52 24 Q52 34 32 60Z" fill="#ff5c6a" ${S}/><circle cx="32" cy="24" r="7" fill="#fff" ${S2}/>`,
    '📌': `<path d="M30 34 L10 56" ${N} ${S}/><path d="M24 22 L42 40 L46 32 L40 26 L48 14 L52 16 L48 8 L40 12 L42 16 L32 22 Z" fill="#ff5c6a" ${S}/><path d="M20 26 L38 44" ${N} ${S}/>`,
    '🏆': `<path d="M18 8 H46 V22 Q46 38 32 40 Q18 38 18 22Z" fill="#ffd45a" ${S}/><path d="M18 14 H8 Q8 28 20 30 M46 14 H56 Q56 28 44 30" ${N} ${S}/><path d="M28 40 H36 V48 H28Z M20 48 H44 V58 H20Z" fill="#c9893a" ${S}/>` + star(32, 22, 7, '#fff3a6', 2),
    '🎉': `<path d="M8 58 L20 22 L42 44Z" fill="#ffb84a" ${S}/><path d="M14 40 L24 50 M17 31 L33 47" ${N} stroke="#ff5d8f" stroke-width="3"/>` + `<circle cx="34" cy="14" r="3" fill="#5fa8ff"/><circle cx="52" cy="30" r="3" fill="#ff5d8f"/><circle cx="46" cy="12" r="2.5" fill="#5fd38a"/><path d="M28 24 Q36 8 30 4 M40 34 Q52 22 60 28 M44 22 L54 14" ${N} stroke="#a77bff" stroke-width="3" stroke-linecap="round"/>`,
    '🎊': `<circle cx="32" cy="30" r="18" fill="#ffd84a" ${S}/><path d="M14 30 H50" ${N} ${S}/><path d="M22 48 L18 60 M32 48 V60 M42 48 L46 60" stroke="#ff5d8f" stroke-width="3"/>`,
    '🎆': `<g stroke-width="4" stroke-linecap="round"><path d="M32 32 L32 6 M32 32 L50 14 M32 32 L58 32 M32 32 L50 50 M32 32 L32 58 M32 32 L14 50 M32 32 L6 32 M32 32 L14 14" stroke="#ff7eb6"/><path d="M32 32 L42 10 M32 32 L56 22 M32 32 L56 42 M32 32 L42 54 M32 32 L22 54 M32 32 L8 42 M32 32 L8 22 M32 32 L22 10" stroke="#ffd84a"/></g><circle cx="32" cy="32" r="5" fill="#fff" ${S2}/>`,
    '🎇': `<path d="M32 60 V36" ${N} ${S}/>` + spark(32, 24, 20, '#ffe45c') + spark(32, 24, 9, '#fff'),
    '🪙': `<ellipse cx="32" cy="36" rx="24" ry="22" fill="#d99a2b" ${S}/><ellipse cx="32" cy="31" rx="24" ry="22" fill="#ffd45a" ${S}/><ellipse cx="32" cy="31" rx="15" ry="14" fill="none" stroke="#e0a53a" stroke-width="3"/>` + star(32, 31, 8, '#fff0a0', 2),
    '💰': `<path d="M24 14 L20 6 H44 L40 14Z" fill="#e8c27a" ${S}/><path d="M24 14 H40 Q58 26 56 44 Q54 58 32 58 Q10 58 8 44 Q6 26 24 14Z" fill="#f0cf86" ${S}/><text x="32" y="48" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="20" fill="#c9893a">₩</text>`,
    '💎': `<path d="M16 10 H48 L58 24 L32 56 L6 24Z" fill="#9fe6ff" ${S}/><path d="M6 24 H58 M22 10 L18 24 L32 56 L46 24 L42 10 M18 24 L32 10 L46 24" ${N} ${S2}/>`,
    '👑': `<path d="M8 46 L6 16 L20 30 L32 10 L44 30 L58 16 L56 46Z" fill="#ffd45a" ${S}/><path d="M8 46 H56 V54 H8Z" fill="#f2b13a" ${S}/><circle cx="32" cy="38" r="4" fill="#ff5d8f" ${S2}/><circle cx="18" cy="40" r="3" fill="#6fb6ff" ${S2}/><circle cx="46" cy="40" r="3" fill="#5fd38a" ${S2}/>`,
    '🎁': `<rect x="8" y="26" width="48" height="32" rx="3" fill="#ff8fb8" ${S}/><rect x="5" y="18" width="54" height="11" rx="3" fill="#ffa8c8" ${S}/><path d="M32 18 V58" stroke="#ffe066" stroke-width="7"/><path d="M32 18 V58" ${N} ${S2} opacity=".4"/><path d="M32 18 Q18 2 14 12 Q16 18 32 18 Q46 2 50 12 Q48 18 32 18Z" fill="#ffe066" ${S2}/>`,
    '🎀': `<path d="M32 30 L10 16 Q4 30 10 42Z M32 30 L54 16 Q60 30 54 42Z" fill="#ff7eb6" ${S}/><path d="M28 34 L20 56 L26 52 L30 58 L32 36 M36 34 L44 56 L38 52 L34 58" fill="#ff7eb6" ${S2}/><circle cx="32" cy="30" r="6" fill="#ff5d9a" ${S}/>`,
    '🎈': `<ellipse cx="32" cy="26" rx="18" ry="21" fill="#ff6f8a" ${S}/><path d="M30 47 L34 47 L32 51Z" fill="#ff6f8a" ${S2}/><path d="M32 51 Q26 56 34 62" ${N} ${S2}/><ellipse cx="25" cy="18" rx="4" ry="6" fill="#fff" opacity=".6"/>`,
    '🔒': `<path d="M20 28 V20 A12 12 0 0 1 44 20 V28" fill="none" stroke="${O}" stroke-width="9"/><path d="M20 28 V20 A12 12 0 0 1 44 20 V28" fill="none" stroke="#cdd3dc" stroke-width="4"/><rect x="12" y="28" width="40" height="30" rx="5" fill="#ffd45a" ${S}/><circle cx="32" cy="41" r="4" fill="${O}"/><path d="M32 43 V50" ${N} ${S}/>`,
    '🔑': `<circle cx="20" cy="22" r="12" fill="#ffd45a" ${S}/><circle cx="20" cy="22" r="4" fill="#fff" ${S2}/><path d="M28 30 L54 56 M44 46 L50 40 M50 52 L56 46" ${N} stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M28 30 L54 56 M44 46 L50 40 M50 52 L56 46" ${N} stroke="#ffd45a" stroke-width="3" stroke-linecap="round"/>`,
    '🔗': `<rect x="6" y="22" width="30" height="18" rx="9" fill="none" stroke="${O}" stroke-width="9" transform="rotate(-30 21 31)"/><rect x="6" y="22" width="30" height="18" rx="9" fill="none" stroke="#c9d3e0" stroke-width="4" transform="rotate(-30 21 31)"/><rect x="28" y="24" width="30" height="18" rx="9" fill="none" stroke="${O}" stroke-width="9" transform="rotate(-30 43 33)"/><rect x="28" y="24" width="30" height="18" rx="9" fill="none" stroke="#c9d3e0" stroke-width="4" transform="rotate(-30 43 33)"/>`,
    '🔍': `<circle cx="26" cy="26" r="16" fill="#dff4ff" ${S}/><path d="M38 38 L56 56" stroke="${O}" stroke-width="10" stroke-linecap="round"/><path d="M40 40 L54 54" stroke="#c9893a" stroke-width="5" stroke-linecap="round"/><path d="M18 20 Q22 14 28 14" ${N} stroke="#fff" stroke-width="3"/>`,
    '🎯': `<circle cx="32" cy="32" r="26" fill="#ff5c6a" ${S}/><circle cx="32" cy="32" r="17" fill="#fff" ${S2}/><circle cx="32" cy="32" r="8" fill="#ff5c6a" ${S2}/><path d="M32 32 L56 8" ${N} ${S}/><path d="M50 6 L58 6 L58 14" ${N} ${S2}/>`,
    '💡': `<path d="M32 6 A18 18 0 0 1 44 38 Q40 42 40 46 H24 Q24 42 20 38 A18 18 0 0 1 32 6Z" fill="#fff07a" ${S}/><path d="M24 46 H40 V54 Q32 60 24 54Z" fill="#c9d3e0" ${S}/><path d="M28 38 Q28 28 32 26 Q36 28 36 38" ${N} ${S2}/>`,
    '🔔': `<path d="M32 6 Q48 8 48 30 V40 L54 48 H10 L16 40 V30 Q16 8 32 6Z" fill="#ffd45a" ${S}/><circle cx="32" cy="52" r="6" fill="#f2b13a" ${S}/>`,
    '📣': `<path d="M8 26 H18 L48 10 V54 L18 38 H8Z" fill="#ff8a5c" ${S}/><path d="M14 38 L18 54 H26 L24 38" fill="#ffd8b0" ${S2}/><path d="M54 24 Q58 32 54 40" ${N} ${S}/>`,
    '📢': `<path d="M8 26 H18 L48 10 V54 L18 38 H8Z" fill="#ff8a5c" ${S}/><path d="M54 24 Q58 32 54 40" ${N} ${S}/>`,

    // 사물
    '☕': `<path d="M10 24 H46 V40 Q46 54 28 54 Q10 54 10 40Z" fill="#fff" ${S}/><path d="M46 28 Q58 28 56 38 Q54 46 44 44" ${N} ${S}/><ellipse cx="28" cy="24" rx="18" ry="4" fill="#9a5a2a" ${S2}/><path d="M22 16 Q18 12 22 8 M32 16 Q28 10 32 6" ${N} stroke="#c9d6e3" stroke-width="3" stroke-linecap="round"/><path d="M6 56 H52" ${N} ${S}/>`,
    '🍵': `<path d="M10 24 H54 Q54 54 32 54 Q10 54 10 24Z" fill="#8fd37a" ${S}/><ellipse cx="32" cy="24" rx="22" ry="5" fill="#b8e88a" ${S2}/><path d="M26 16 Q22 12 26 8 M36 16 Q32 10 36 6" ${N} stroke="#c9d6e3" stroke-width="3" stroke-linecap="round"/>`,
    '🫖': `<path d="M14 26 Q14 56 32 56 Q50 56 50 26Z" fill="#9fd8c8" ${S}/><path d="M50 32 L60 22 M14 32 Q4 34 8 44 Q10 48 16 46" ${N} ${S}/><path d="M12 26 H52" ${N} ${S}/><circle cx="32" cy="20" r="4" fill="#9fd8c8" ${S2}/>`,
    '🥛': `<path d="M18 8 H46 L42 58 H22Z" fill="#fff" ${S}/><path d="M19 22 H45" ${N} ${S2}/>`,
    '🍹': `<path d="M10 14 H54 L32 38Z" fill="#ffa86a" ${S}/><path d="M32 38 V56 M20 56 H44" ${N} ${S}/><path d="M40 4 L34 22" ${N} ${S}/><circle cx="48" cy="14" r="6" fill="#ffd84a" ${S2}/>`,
    '🍽️': `<circle cx="32" cy="34" r="20" fill="#fff" ${S}/><circle cx="32" cy="34" r="12" fill="none" ${S2}/><path d="M6 10 V26 Q6 30 8 30 V56 M4 10 V22 M10 10 V22 M58 10 Q50 16 54 32 H56 V56" ${N} ${S}/>`,
    '🍜': `<path d="M6 30 H58 Q58 56 32 56 Q6 56 6 30Z" fill="#ff8a6a" ${S}/><path d="M14 30 Q18 20 24 30 Q28 20 34 30 Q38 20 44 30" ${N} stroke="#ffd884" stroke-width="4"/><path d="M38 4 L28 32 M48 6 L34 32" ${N} ${S}/><path d="M18 42 H46" ${N} stroke="#fff" stroke-width="3"/>`,
    '🍣': `<rect x="10" y="32" width="44" height="18" rx="8" fill="#fff" ${S}/><path d="M8 34 Q10 20 32 20 Q54 20 56 34 Q32 40 8 34Z" fill="#ff8a5c" ${S}/><path d="M20 24 L24 34 M30 22 L33 34 M40 22 L42 34" ${N} stroke="#ffd0b0" stroke-width="2.5"/>`,
    '🍙': `<path d="M32 8 Q40 8 52 40 Q56 54 32 54 Q8 54 12 40 Q24 8 32 8Z" fill="#fff" ${S}/><rect x="20" y="38" width="24" height="16" rx="2" fill="#2e4a3a" ${S2}/>`,
    '🍱': `<rect x="6" y="14" width="52" height="40" rx="5" fill="#e8513e" ${S}/><rect x="11" y="19" width="42" height="30" rx="3" fill="#fff" ${S2}/><path d="M32 19 V49 M32 34 H53" ${N} ${S2}/><circle cx="20" cy="30" r="4" fill="#ff8a5c"/><circle cx="42" cy="26" r="3" fill="#5fd38a"/><circle cx="42" cy="42" r="3" fill="#ffd84a"/>`,
    '🥟': `<path d="M6 40 Q8 16 32 16 Q56 16 58 40 Q32 50 6 40Z" fill="#fff4dc" ${S}/><path d="M18 22 Q20 30 22 22 M30 18 V28 M42 22 Q44 30 46 22" ${N} ${S2}/>`,
    '🍰': `<path d="M8 30 L54 20 V48 L8 56Z" fill="#fff4dc" ${S}/><path d="M8 30 L54 20 L48 14 L8 24Z" fill="#fff" ${S}/><path d="M8 42 L54 34" ${N} stroke="#ff8fb8" stroke-width="4"/><circle cx="30" cy="16" r="6" fill="#ff4f6a" ${S2}/>`,
    '🎂': `<rect x="10" y="30" width="44" height="24" rx="4" fill="#ffd8b0" ${S}/><path d="M10 34 Q16 42 22 34 Q27 42 32 34 Q37 42 42 34 Q48 42 54 34 V30 H10Z" fill="#fff" ${S2}/><path d="M22 30 V18 M32 30 V16 M42 30 V18" ${N} stroke="#7fb8ff" stroke-width="4"/><path d="M22 12 Q24 15 22 17 Q20 15 22 12 M32 10 Q34 13 32 15 Q30 13 32 10 M42 12 Q44 15 42 17 Q40 15 42 12" fill="#ffb03a" ${S2}/>`,
    '🍪': `<circle cx="32" cy="32" r="24" fill="#e8b46a" ${S}/><circle cx="24" cy="24" r="3.5" fill="${O}"/><circle cx="40" cy="26" r="3" fill="${O}"/><circle cx="28" cy="40" r="3.5" fill="${O}"/><circle cx="42" cy="40" r="2.5" fill="${O}"/>`,
    '🍎': `<path d="M32 18 Q20 8 12 20 Q4 34 14 50 Q22 60 32 54 Q42 60 50 50 Q60 34 52 20 Q44 8 32 18Z" fill="#ff5249" ${S}/><path d="M32 18 Q32 10 36 4" ${N} ${S}/><path d="M34 10 Q44 2 50 8 Q42 14 34 10Z" fill="#5fd38a" ${S2}/><ellipse cx="20" cy="28" rx="4" ry="6" fill="#fff" opacity=".5"/>`,
    '🍊': `<circle cx="32" cy="36" r="22" fill="#ffa63a" ${S}/><path d="M32 14 Q40 4 48 10 Q40 16 32 14Z" fill="#5fd38a" ${S2}/><circle cx="24" cy="30" r="1.6" fill="#e0861a"/><circle cx="38" cy="42" r="1.6" fill="#e0861a"/>`,
    '🍓': `<path d="M12 22 Q32 14 52 22 Q54 44 32 60 Q10 44 12 22Z" fill="#ff4f5f" ${S}/><path d="M14 22 L22 12 L28 18 L32 8 L36 18 L42 12 L50 22 Q32 28 14 22Z" fill="#5fd38a" ${S2}/><g fill="#ffe066"><circle cx="22" cy="32" r="1.6"/><circle cx="32" cy="36" r="1.6"/><circle cx="42" cy="32" r="1.6"/><circle cx="26" cy="44" r="1.6"/><circle cx="38" cy="44" r="1.6"/></g>`,
    '🍒': `<path d="M20 42 Q24 20 40 8 Q42 24 44 40" ${N} ${S}/><circle cx="18" cy="46" r="11" fill="#e8384a" ${S}/><circle cx="44" cy="46" r="11" fill="#e8384a" ${S}/><path d="M40 8 Q52 4 56 12 Q48 16 40 8Z" fill="#5fd38a" ${S2}/>`,
    '🧊': `<path d="M12 22 L32 12 L52 22 V44 L32 54 L12 44Z" fill="#cdeeff" ${S}/><path d="M12 22 L32 32 L52 22 M32 32 V54" ${N} ${S2}/>`,
    '🐟': `<path d="M6 32 Q22 12 42 22 L56 12 V52 L42 42 Q22 52 6 32Z" fill="#7fc7ff" ${S}/><circle cx="18" cy="30" r="2.8" fill="${O}"/><path d="M28 24 Q32 32 28 40" ${N} ${S2}/>`,
    '🐠': `<path d="M6 32 Q22 10 42 22 L56 12 V52 L42 42 Q22 54 6 32Z" fill="#ffb03a" ${S}/><path d="M24 18 Q28 32 24 46 M34 20 Q38 32 34 44" ${N} stroke="#fff" stroke-width="4"/><circle cx="15" cy="30" r="2.8" fill="${O}"/>`,
    '🦋': `<path d="M32 30 Q20 6 8 12 Q4 26 22 32 Q6 40 14 54 Q26 56 32 36 Q38 56 50 54 Q58 40 42 32 Q60 26 56 12 Q44 6 32 30Z" fill="#9fc8ff" ${S}/><path d="M32 18 V50" ${N} ${S}/><path d="M32 18 L26 8 M32 18 L38 8" ${N} ${S2}/>`,
    '🕊️': `<path d="M8 36 Q20 26 32 34 L52 20 Q60 18 58 26 L46 38 Q44 52 26 52 L14 56 L18 48 Q8 46 8 36Z" fill="#fff" ${S}/><path d="M32 34 Q24 12 38 6 Q42 22 40 30" fill="#f2f6ff" ${S}/><circle cx="52" cy="23" r="1.8" fill="${O}"/><path d="M58 24 L62 25" ${N} stroke="#ffb03a" stroke-width="3"/>`,
    '🐶': `<path d="M12 14 Q4 20 8 38 L16 30Z M52 14 Q60 20 56 38 L48 30Z" fill="#a8744a" ${S}/><circle cx="32" cy="34" r="22" fill="#e8c08a" ${S}/><circle cx="24" cy="30" r="3" fill="${O}"/><circle cx="40" cy="30" r="3" fill="${O}"/><ellipse cx="32" cy="40" rx="5" ry="3.5" fill="${O}"/>`,
    '🐱': `<path d="M12 24 L12 6 L26 16Z M52 24 L52 6 L38 16Z" fill="#ffb86a" ${S}/><circle cx="32" cy="36" r="22" fill="#ffc98a" ${S}/><circle cx="24" cy="33" r="3" fill="${O}"/><circle cx="40" cy="33" r="3" fill="${O}"/><path d="M28 42 Q32 46 36 42 M6 38 H16 M48 38 H58" ${N} ${S2}/>`,

    // 자연/날씨
    '🌙': `<path d="M40 6 A26 26 0 1 0 58 42 A20 20 0 1 1 40 6Z" fill="#ffe45c" ${S}/>`,
    '☀️': `<g stroke="${O}" stroke-width="3" stroke-linecap="round"><path d="M32 2 V10 M32 54 V62 M2 32 H10 M54 32 H62 M10 10 L16 16 M48 48 L54 54 M54 10 L48 16 M10 54 L16 48"/></g><circle cx="32" cy="32" r="16" fill="#ffc83a" ${S}/>`,
    '🌤️': `<circle cx="38" cy="22" r="13" fill="#ffc83a" ${S}/>` + `<path d="M10 52 A9 9 0 0 1 12 35 A12 12 0 0 1 34 32 A9 9 0 0 1 44 52Z" fill="#fff" ${S}/>`,
    '☁️': cloud('#fff', 2),
    '🌧️': cloud('#e4ecf6', -6) + `<path d="M20 46 L16 56 M32 46 L28 56 M44 46 L40 56" ${N} stroke="#5fa8ff" stroke-width="4" stroke-linecap="round"/>`,
    '⛈️': cloud('#c9d3e0', -6) + `<path d="M34 40 L26 52 H34 L30 62" ${N} stroke="#ffd84a" stroke-width="4" stroke-linejoin="round"/>`,
    '❄️': `<g stroke="${O}" stroke-width="7" stroke-linecap="round"><path d="M32 6 V58 M9 19 L55 45 M9 45 L55 19"/></g><g stroke="#cdeeff" stroke-width="3" stroke-linecap="round"><path d="M32 6 V58 M9 19 L55 45 M9 45 L55 19"/></g>`,
    '☂️': `<path d="M6 32 A26 24 0 0 1 58 32 Q50 26 45 32 Q38 26 32 32 Q26 26 19 32 Q14 26 6 32Z" fill="#ff7eb6" ${S}/><path d="M32 32 V52 Q32 58 26 58 Q22 58 22 54" ${N} ${S}/><path d="M32 6 V8" ${N} ${S}/>`,
    '🌈': `<path d="M4 50 A28 28 0 0 1 60 50" fill="none" stroke="${O}" stroke-width="22"/><path d="M6 50 A26 26 0 0 1 58 50" fill="none" stroke="#ff6f6f" stroke-width="5"/><path d="M11 50 A21 21 0 0 1 53 50" fill="none" stroke="#ffcf4a" stroke-width="5"/><path d="M16 50 A16 16 0 0 1 48 50" fill="none" stroke="#7fd38a" stroke-width="5"/><path d="M21 50 A11 11 0 0 1 43 50" fill="none" stroke="#6fb6ff" stroke-width="5"/>` + `<path d="M2 54 A8 8 0 0 1 14 46 A8 8 0 0 1 22 56Z M42 56 A8 8 0 0 1 50 46 A8 8 0 0 1 62 54Z" fill="#fff" ${S2}/>`,
    '🌊': `<path d="M4 50 Q8 20 30 16 Q48 14 50 30 Q40 22 34 30 Q46 30 44 40 Q50 46 60 44 V58 H4Z" fill="#5fb6ff" ${S}/><path d="M10 50 Q20 44 30 50 Q40 56 54 50" ${N} stroke="#fff" stroke-width="3"/>`,
    '🌅': `<rect x="4" y="8" width="56" height="50" rx="8" fill="#ffd0a0" ${S}/><path d="M18 40 A14 14 0 0 1 46 40Z" fill="#ff8a3a" ${S2}/><path d="M4 40 H60 V50 Q60 58 52 58 H12 Q4 58 4 50Z" fill="#5fa8ff" ${S}/><path d="M16 48 H28 M36 52 H48" ${N} stroke="#fff" stroke-width="3"/>`,
    '🌃': `<rect x="4" y="8" width="56" height="50" rx="8" fill="#3a3f78" ${S}/><path d="M8 58 V36 H18 V28 H28 V40 H36 V24 H46 V34 H56 V58Z" fill="#5a5f98" ${S2}/><g fill="#ffe066"><rect x="12" y="40" width="3" height="3"/><rect x="22" y="32" width="3" height="3"/><rect x="40" y="28" width="3" height="3"/><rect x="40" y="38" width="3" height="3"/><rect x="50" y="40" width="3" height="3"/></g><circle cx="48" cy="16" r="4" fill="#ffe066"/>`,
    '🌱': `<path d="M32 58 V30" ${N} ${S}/><path d="M32 34 Q12 34 10 16 Q30 14 32 34Z" fill="#7fd36a" ${S}/><path d="M32 28 Q36 10 54 8 Q54 26 32 28Z" fill="#9fe06a" ${S}/><path d="M18 58 H46" ${N} ${S}/>`,
    '🌿': `<path d="M14 58 Q30 40 50 6" ${N} ${S}/><path d="M22 46 Q8 44 8 32 Q20 32 24 44Z M30 36 Q18 30 20 18 Q32 22 32 34Z M38 26 Q32 16 36 6 Q46 12 40 24Z M28 42 Q42 44 48 36 Q38 30 30 40Z M36 30 Q50 30 56 22 Q44 16 38 28Z" fill="#7fd36a" ${S2}/>`,
    '🍃': `<path d="M8 50 Q10 18 46 10 Q54 40 22 50Z" fill="#8fe06a" ${S}/><path d="M8 50 Q26 32 40 20" ${N} ${S2}/><path d="M38 40 Q46 28 58 30 Q54 46 38 40Z" fill="#b8ec8a" ${S2}/>`,
    '🌳': `<path d="M28 58 V40 H36 V58Z" fill="#a8744a" ${S}/><path d="M32 4 Q46 4 48 16 Q58 20 56 32 Q56 44 42 44 H22 Q8 44 8 32 Q6 20 16 16 Q18 4 32 4Z" fill="#5fc86a" ${S}/><path d="M18 58 H46" ${N} ${S}/>`,
    '🌲': `<path d="M32 4 L50 30 H42 L54 46 H10 L22 30 H14Z" fill="#3fae6a" ${S}/><path d="M28 46 H36 V58 H28Z" fill="#a8744a" ${S}/>`,
    '🌴': `<path d="M30 58 Q34 40 32 22" fill="none" stroke="${O}" stroke-width="8" stroke-linecap="round"/><path d="M30 58 Q34 40 32 22" fill="none" stroke="#c9893a" stroke-width="4"/><path d="M32 22 Q16 8 4 18 Q18 16 32 22 Q20 26 12 38 Q26 30 32 22 Q46 8 60 18 Q46 16 32 22 Q44 26 52 38 Q38 30 32 22Z" fill="#5fc86a" ${S}/>`,
    '🌸': (() => { let p = ''; for (let i = 0; i < 5; i++) { const a = -90 + i * 72; p += `<ellipse cx="32" cy="17" rx="10" ry="13" fill="#ffb8d6" ${S2} transform="rotate(${a + 90} 32 32)"/>`; } return p + `<circle cx="32" cy="32" r="7" fill="#ffe066" ${S2}/>`; })(),
    '💮': (() => { let p = ''; for (let i = 0; i < 8; i++) p += `<ellipse cx="32" cy="16" rx="7" ry="11" fill="#fff" ${S2} transform="rotate(${i * 45} 32 32)"/>`; return p + `<circle cx="32" cy="32" r="8" fill="#ffb8d6" ${S2}/>`; })(),
    '🌻': (() => { let p = `<path d="M32 44 V62" ${N} ${S}/>`; for (let i = 0; i < 10; i++) p += `<ellipse cx="32" cy="10" rx="5" ry="10" fill="#ffd23a" ${S2} transform="rotate(${i * 36} 32 28)"/>`; return p + `<circle cx="32" cy="28" r="11" fill="#9a5a2a" ${S}/>`; })(),
    '🌷': `<path d="M32 36 V60 M32 50 Q20 48 16 38 Q28 38 32 48" fill="#7fd36a" ${S}/><path d="M16 12 L24 20 L32 8 L40 20 L48 12 Q50 38 32 38 Q14 38 16 12Z" fill="#ff7eb6" ${S}/>`,
    '🌹': `<path d="M32 38 V60 M32 50 Q20 50 18 42 Q28 40 32 48" fill="#5fc86a" ${S}/><path d="M14 20 Q14 40 32 40 Q50 40 50 20 Q44 12 32 14 Q20 12 14 20Z" fill="#e8384a" ${S}/><path d="M24 22 Q32 14 40 22 Q36 30 28 28 Q26 24 32 22" ${N} ${S2}/>`,
    '💐': `<path d="M22 36 L32 60 L42 36Z" fill="#9fd8ff" ${S}/><circle cx="22" cy="24" r="9" fill="#ff8fb8" ${S2}/><circle cx="42" cy="24" r="9" fill="#ffd84a" ${S2}/><circle cx="32" cy="14" r="9" fill="#b89aff" ${S2}/><circle cx="32" cy="30" r="8" fill="#ff7a6a" ${S2}/>`,
    '🏝️': `<path d="M4 54 Q32 40 60 54 V60 H4Z" fill="#5fb6ff" ${S}/><path d="M12 52 Q32 38 52 52Z" fill="#ffe0a0" ${S}/><path d="M30 48 Q34 34 30 22" fill="none" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M30 22 Q16 10 6 18 Q18 18 30 22 Q42 10 54 16 Q42 18 30 22 Q36 28 42 36 Q30 30 30 22 Q22 28 18 36 Q22 26 30 22Z" fill="#5fc86a" ${S2}/>`,
    '🏖️': `<path d="M4 44 H60 V58 H4Z" fill="#ffe0a0" ${S}/><path d="M4 38 H60 V44 H4Z" fill="#5fb6ff" ${S2}/><path d="M30 56 L40 18" ${N} ${S}/><path d="M18 22 Q40 0 58 22Z" fill="#ff7a7a" ${S}/>`,

    // 장소/건물
    '🏠': `<path d="M6 30 L32 8 L58 30" fill="#ff8a6a" ${S}/><path d="M12 28 V58 H52 V28 L32 12Z" fill="#fff4dc" ${S}/><path d="M6 30 L32 8 L58 30" ${N} stroke="${O}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 30 L32 8 L58 30" ${N} stroke="#ff7a5a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="26" y="40" width="12" height="18" fill="#c98b5a" ${S2}/><rect x="40" y="34" width="8" height="8" fill="#9fd8ff" ${S2}/>`,
    '🏡': `<path d="M12 28 V52 H44 V28 L28 12Z" fill="#fff4dc" ${S}/><path d="M6 30 L28 10 L50 30" ${N} stroke="${O}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 30 L28 10 L50 30" ${N} stroke="#ff7a5a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="22" y="38" width="10" height="14" fill="#c98b5a" ${S2}/><circle cx="52" cy="40" r="8" fill="#5fc86a" ${S2}/><path d="M4 56 H60" ${N} stroke="#5fc86a" stroke-width="5" stroke-linecap="round"/>`,
    '🏥': `<rect x="8" y="16" width="48" height="42" rx="3" fill="#fff" ${S}/><rect x="26" y="4" width="12" height="12" fill="#fff" ${S2}/><path d="M28 26 H36 V32 H42 V40 H36 V46 H28 V40 H22 V32 H28Z" fill="#ff5c6a" ${S2}/><rect x="14" y="48" width="8" height="10" fill="#9fd8ff" ${S2}/><rect x="42" y="48" width="8" height="10" fill="#9fd8ff" ${S2}/>`,
    '🏪': `<rect x="8" y="22" width="48" height="36" fill="#fff" ${S}/><path d="M6 12 H58 L56 24 Q50 28 44 24 Q38 28 32 24 Q26 28 20 24 Q14 28 8 24Z" fill="#5fc88a" ${S}/><rect x="14" y="34" width="14" height="24" fill="#9fd8ff" ${S2}/><rect x="34" y="34" width="16" height="12" fill="#9fd8ff" ${S2}/>`,
    '🏢': `<rect x="14" y="6" width="36" height="52" fill="#c9d6ea" ${S}/><g fill="#7fb8ff">${[0, 1, 2, 3].map(r => [0, 1, 2].map(c => `<rect x="${20 + c * 9}" y="${12 + r * 10}" width="6" height="6"/>`).join('')).join('')}</g><rect x="27" y="48" width="10" height="10" fill="#c98b5a" ${S2}/>`,
    '🏫': `<rect x="6" y="26" width="52" height="32" fill="#ffe8c8" ${S}/><path d="M20 26 L32 12 L44 26Z" fill="#ff8a6a" ${S}/><circle cx="32" cy="22" r="3.5" fill="#fff" ${S2}/><path d="M32 12 V4 L40 6 L32 8" fill="#ff5c6a" ${S2}/><rect x="27" y="44" width="10" height="14" fill="#c98b5a" ${S2}/><g fill="#9fd8ff"><rect x="12" y="34" width="8" height="8"/><rect x="44" y="34" width="8" height="8"/></g>`,
    '⛪': `<path d="M14 58 V30 L32 14 L50 30 V58Z" fill="#fff" ${S}/><path d="M32 2 V14 M27 6 H37" ${N} ${S}/><path d="M26 58 V46 A6 6 0 0 1 38 46 V58" fill="#c98b5a" ${S2}/><circle cx="32" cy="32" r="5" fill="#9fd8ff" ${S2}/>`,
    '🏛️': `<path d="M6 22 L32 6 L58 22Z" fill="#f2ead8" ${S}/><rect x="8" y="22" width="48" height="6" fill="#f2ead8" ${S2}/><path d="M14 28 V50 M24 28 V50 M34 28 V50 M44 28 V50 M52 28 V50" ${N} stroke="${O}" stroke-width="5"/><path d="M14 28 V50 M24 28 V50 M34 28 V50 M44 28 V50 M52 28 V50" ${N} stroke="#fff" stroke-width="2"/><rect x="6" y="50" width="52" height="8" fill="#f2ead8" ${S2}/>`,
    '🏰': `<path d="M8 58 V22 H14 V16 H20 V22 H26 V16 H38 V22 H44 V16 H50 V22 H56 V58Z" fill="#e4dcf4" ${S}/><path d="M26 58 V44 A6 6 0 0 1 38 44 V58" fill="#c98b5a" ${S2}/><path d="M32 16 V4 L42 7 L32 10" fill="#ff7eb6" ${S2}/>`,
    '🏮': `<path d="M32 4 V10" ${N} ${S}/><rect x="22" y="8" width="20" height="5" fill="#3a3a4a" ${S2}/><ellipse cx="32" cy="32" rx="18" ry="20" fill="#ff5249" ${S}/><path d="M18 26 Q32 30 46 26 M16 36 Q32 40 48 36" ${N} stroke="#ffb0a0" stroke-width="2"/><rect x="22" y="50" width="20" height="5" fill="#3a3a4a" ${S2}/><path d="M32 55 V62" ${N} stroke="#ffd84a" stroke-width="3"/>`,
    '⛲': `<path d="M6 46 H58 V54 Q58 58 54 58 H10 Q6 58 6 54Z" fill="#c9d3e0" ${S}/><path d="M10 46 Q32 40 54 46" fill="#7fc7ff" ${S2}/><path d="M28 46 V26 H36 V46" fill="#e4e8f0" ${S2}/><path d="M18 24 H46 Q44 30 32 30 Q20 30 18 24Z" fill="#c9d3e0" ${S2}/><path d="M32 22 Q32 6 20 12 M32 22 Q32 6 44 12 M32 22 V4" ${N} stroke="#5fa8ff" stroke-width="3.5" stroke-linecap="round"/>`,
    '♨️': `<path d="M8 44 Q8 58 32 58 Q56 58 56 44 Q56 36 46 34 M18 34 Q8 36 8 44" fill="#ff7a6a" ${S}/><path d="M20 30 Q14 22 20 16 Q26 10 20 4 M32 30 Q26 22 32 16 Q38 10 32 4 M44 30 Q38 22 44 16 Q50 10 44 4" ${N} stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M20 30 Q14 22 20 16 Q26 10 20 4 M32 30 Q26 22 32 16 Q38 10 32 4 M44 30 Q38 22 44 16 Q50 10 44 4" ${N} stroke="#ff7a6a" stroke-width="3" stroke-linecap="round"/>`,
    '🚪': `<rect x="14" y="4" width="36" height="54" rx="3" fill="#c98b5a" ${S}/><rect x="20" y="10" width="24" height="18" rx="2" fill="#e0a870" ${S2}/><rect x="20" y="32" width="24" height="20" rx="2" fill="#e0a870" ${S2}/><circle cx="42" cy="32" r="2.5" fill="#ffd45a" ${S2}/>`,
    '⛴️': `<path d="M4 38 H60 L52 54 H12Z" fill="#fff" ${S}/><rect x="16" y="24" width="30" height="14" fill="#7fb8ff" ${S}/><rect x="24" y="12" width="8" height="12" fill="#ff5c6a" ${S2}/><path d="M4 58 Q12 54 20 58 Q28 62 36 58 Q44 54 52 58 Q58 61 60 58" ${N} stroke="#5fa8ff" stroke-width="3"/>`,
    '🚇': `<rect x="10" y="6" width="44" height="44" rx="10" fill="#7fb8ff" ${S}/><rect x="16" y="14" width="32" height="16" rx="3" fill="#e4f4ff" ${S2}/><circle cx="20" cy="40" r="3.5" fill="#ffe066" ${S2}/><circle cx="44" cy="40" r="3.5" fill="#ffe066" ${S2}/><path d="M18 50 L12 60 M46 50 L52 60" ${N} ${S}/>`,
    '🗺️': `<path d="M4 14 L22 8 L42 14 L60 8 V50 L42 56 L22 50 L4 56Z" fill="#ffe8b8" ${S}/><path d="M22 8 V50 M42 14 V56" ${N} ${S2}/><path d="M10 40 Q20 30 30 36 Q40 42 52 26" ${N} stroke="#ff5c6a" stroke-width="3" stroke-dasharray="4 4"/>`,
    '🧭': `<circle cx="32" cy="32" r="26" fill="#ffd45a" ${S}/><circle cx="32" cy="32" r="19" fill="#fff" ${S2}/><path d="M32 14 L38 32 L32 50 L26 32Z" fill="#ff5c6a" ${S2}/><path d="M26 32 L32 50 L38 32Z" fill="#c9d3e0"/>`,

    // 취미/도구
    '🎤': `<circle cx="38" cy="20" r="14" fill="#c9d3e0" ${S}/><path d="M28 30 L10 54 Q8 58 12 58 L34 34" fill="#3a3a4a" ${S}/><path d="M30 12 L46 28 M34 8 L50 24" ${N} stroke="#9aa6b8" stroke-width="2"/>`,
    '🎙️': `<rect x="22" y="6" width="20" height="32" rx="10" fill="#c9d3e0" ${S}/><path d="M14 28 Q14 46 32 46 Q50 46 50 28 M32 46 V56 M20 58 H44" ${N} ${S}/>`,
    '🎧': `<path d="M10 40 V32 A22 22 0 0 1 54 32 V40" ${N} stroke="${O}" stroke-width="6"/><rect x="6" y="36" width="14" height="20" rx="6" fill="#ff7eb6" ${S}/><rect x="44" y="36" width="14" height="20" rx="6" fill="#ff7eb6" ${S}/>`,
    '🎸': `<path d="M36 28 L56 8" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M36 28 L56 8" stroke="#c9893a" stroke-width="3"/><path d="M36 26 Q40 30 38 34 Q46 40 40 50 Q32 60 20 56 Q8 52 8 42 Q8 30 20 28 Q26 26 30 32 Q32 26 36 26Z" fill="#ff8a5c" ${S}/><circle cx="26" cy="42" r="4" fill="${O}"/>`,
    '🎷': `<path d="M44 6 L40 10 V40 Q40 56 26 56 Q14 56 14 44 L20 40 Q22 48 28 48 Q32 48 32 40 V14 L36 6Z" fill="#ffd45a" ${S}/><circle cx="36" cy="22" r="2" fill="${O}"/><circle cx="36" cy="30" r="2" fill="${O}"/>`,
    '🎹': `<rect x="4" y="16" width="56" height="34" rx="4" fill="#fff" ${S}/><path d="M12 16 V50 M20 16 V50 M28 16 V50 M36 16 V50 M44 16 V50 M52 16 V50" ${N} ${S2}/><g fill="${O}"><rect x="9" y="16" width="5" height="18"/><rect x="17" y="16" width="5" height="18"/><rect x="33" y="16" width="5" height="18"/><rect x="41" y="16" width="5" height="18"/><rect x="49" y="16" width="5" height="18"/></g>`,
    '🎻': `<path d="M32 4 V18" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M32 18 Q20 18 22 28 Q16 34 18 44 Q22 58 32 58 Q42 58 46 44 Q48 34 42 28 Q44 18 32 18Z" fill="#c9693a" ${S}/><path d="M28 32 Q26 36 28 40 M36 32 Q38 36 36 40" ${N} ${S2}/><path d="M8 52 L56 22" ${N} stroke="#e8d0a0" stroke-width="3"/>`,
    '🥁': `<ellipse cx="32" cy="24" rx="24" ry="9" fill="#fff" ${S}/><path d="M8 24 V44 Q8 54 32 54 Q56 54 56 44 V24" fill="#ff5c6a" ${S}/><path d="M8 28 L20 50 L32 30 L44 50 L56 28" ${N} stroke="#ffd45a" stroke-width="2.5"/><path d="M12 4 L28 20 M52 4 L38 20" ${N} stroke="${O}" stroke-width="4" stroke-linecap="round"/>`,
    '📖': `<path d="M32 14 Q20 6 6 10 V52 Q20 48 32 56 Q44 48 58 52 V10 Q44 6 32 14Z" fill="#fff" ${S}/><path d="M32 14 V56" ${N} ${S}/><path d="M12 20 Q20 18 26 22 M12 28 Q20 26 26 30 M38 22 Q44 18 52 20 M38 30 Q44 26 52 28" ${N} stroke="#c9b8a0" stroke-width="2"/>`,
    '📚': `<rect x="8" y="44" width="46" height="12" rx="2" fill="#ff7a6a" ${S}/><rect x="12" y="32" width="42" height="12" rx="2" fill="#7fb8ff" ${S}/><rect x="8" y="20" width="40" height="12" rx="2" fill="#7fd38a" ${S}/><path d="M48 46 V54 M50 34 V42 M44 22 V30" ${N} stroke="#fff" stroke-width="2"/>`,
    '📜': `<rect x="14" y="10" width="36" height="44" fill="#ffe8b8" ${S}/><path d="M10 10 H54 M10 54 H54" ${N} stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M10 10 H54 M10 54 H54" ${N} stroke="#c9893a" stroke-width="3" stroke-linecap="round"/><path d="M22 22 H42 M22 30 H42 M22 38 H36" ${N} stroke="#c9a070" stroke-width="2.5"/>`,
    '📋': `<rect x="10" y="10" width="44" height="50" rx="4" fill="#c98b5a" ${S}/><rect x="16" y="16" width="32" height="38" fill="#fff" ${S2}/><rect x="24" y="6" width="16" height="9" rx="2" fill="#c9d3e0" ${S2}/><path d="M22 26 H42 M22 34 H42 M22 42 H34" ${N} stroke="#9aa6b8" stroke-width="2.5"/>`,
    '📰': `<rect x="6" y="10" width="52" height="44" rx="3" fill="#fff" ${S}/><rect x="12" y="16" width="18" height="14" fill="#c9d6ea" ${S2}/><path d="M36 18 H52 M36 26 H52 M12 38 H52 M12 46 H44" ${N} stroke="#9aa6b8" stroke-width="3"/>`,
    '✏️': `<path d="M10 54 L14 40 L44 10 L54 20 L24 50Z" fill="#ffd45a" ${S}/><path d="M10 54 L14 40 L24 50Z" fill="#ffe0b0" ${S2}/><path d="M38 16 L48 26" ${N} ${S2}/><path d="M44 10 L54 20 L58 16 Q58 10 54 8 Q50 6 48 6Z" fill="#ff8fb8" ${S2}/>`,
    '📅': `<rect x="8" y="12" width="48" height="44" rx="4" fill="#fff" ${S}/><path d="M8 24 H56 V16 Q56 12 52 12 H12 Q8 12 8 16Z" fill="#ff5c6a" ${S2}/><path d="M20 8 V16 M44 8 V16" ${N} ${S}/><text x="32" y="50" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="20" fill="${O}">7</text>`,
    '📦': `<path d="M8 22 L32 12 L56 22 V48 L32 58 L8 48Z" fill="#e0a870" ${S}/><path d="M8 22 L32 32 L56 22 M32 32 V58" ${N} ${S2}/><path d="M20 17 L44 27 V36" ${N} stroke="#fff2d0" stroke-width="4"/>`,
    '📱': `<rect x="16" y="4" width="32" height="56" rx="6" fill="#3a3a4a" ${S}/><rect x="20" y="10" width="24" height="40" rx="2" fill="#9fd8ff"/><circle cx="32" cy="55" r="2" fill="#fff"/>`,
    '📺': `<rect x="4" y="14" width="56" height="38" rx="6" fill="#ffb86a" ${S}/><rect x="10" y="20" width="38" height="26" rx="3" fill="#9fd8ff" ${S2}/><circle cx="54" cy="26" r="2.5" fill="${O}"/><circle cx="54" cy="36" r="2.5" fill="${O}"/><path d="M22 4 L32 14 L42 4 M16 52 L12 60 M48 52 L52 60" ${N} ${S}/>`,
    '📻': `<rect x="6" y="20" width="52" height="34" rx="6" fill="#ff8a6a" ${S}/><circle cx="22" cy="37" r="10" fill="#fff4dc" ${S2}/><path d="M38 30 H52 M38 37 H52 M38 44 H52" ${N} ${S2}/><path d="M14 20 L48 6" ${N} ${S}/>`,
    '📸': `<rect x="6" y="18" width="52" height="36" rx="6" fill="#5a6278" ${S}/><path d="M20 18 L24 10 H40 L44 18" fill="#5a6278" ${S}/><circle cx="32" cy="36" r="12" fill="#9fd8ff" ${S}/><circle cx="28" cy="32" r="3" fill="#fff"/><rect x="46" y="24" width="7" height="4" fill="#ffd45a"/><path d="M52 8 L54 12 L58 13 L54 15 L52 19 L50 15 L46 13 L50 12Z" fill="#fff07a" ${S2}/>`,
    '📷': `<rect x="6" y="18" width="52" height="36" rx="6" fill="#5a6278" ${S}/><path d="M20 18 L24 10 H40 L44 18" fill="#5a6278" ${S}/><circle cx="32" cy="36" r="12" fill="#9fd8ff" ${S}/><circle cx="28" cy="32" r="3" fill="#fff"/>`,
    '📼': `<rect x="4" y="14" width="56" height="36" rx="4" fill="#3a3a4a" ${S}/><rect x="12" y="20" width="40" height="18" rx="3" fill="#fff4dc"/><circle cx="22" cy="29" r="5" fill="#3a3a4a"/><circle cx="42" cy="29" r="5" fill="#3a3a4a"/>`,
    '💾': `<path d="M6 6 H48 L58 16 V58 H6Z" fill="#7fb8ff" ${S}/><rect x="16" y="6" width="26" height="16" fill="#fff" ${S2}/><rect x="14" y="34" width="36" height="24" fill="#fff" ${S2}/>`,
    '💼': `<rect x="6" y="20" width="52" height="34" rx="4" fill="#a8744a" ${S}/><path d="M24 20 V14 Q24 10 28 10 H36 Q40 10 40 14 V20" ${N} ${S}/><path d="M6 34 H58" ${N} ${S2}/><rect x="28" y="30" width="8" height="8" fill="#ffd45a" ${S2}/>`,
    '🎒': `<path d="M14 24 Q14 10 32 10 Q50 10 50 24 V54 Q50 58 46 58 H18 Q14 58 14 54Z" fill="#ff8a6a" ${S}/><rect x="20" y="34" width="24" height="16" rx="3" fill="#ffb09a" ${S2}/><path d="M26 10 Q26 4 32 4 Q38 4 38 10" ${N} ${S}/>`,
    '🛍️': `<path d="M10 20 H54 L50 58 H14Z" fill="#ff8fb8" ${S}/><path d="M22 26 V16 A10 10 0 0 1 42 16 V26" ${N} ${S}/>`,
    '🛒': `<path d="M4 10 H14 L22 42 H50 L56 20 H16" fill="#c9e8ff" ${S}/><circle cx="24" cy="52" r="5" fill="#fff" ${S}/><circle cx="48" cy="52" r="5" fill="#fff" ${S}/>`,
    '🧺': `<path d="M18 26 Q18 8 32 8 Q46 8 46 26" ${N} stroke="${O}" stroke-width="5"/><path d="M6 26 H58 L52 56 H12Z" fill="#e0a870" ${S}/><path d="M10 36 H54 M12 46 H52 M22 26 L24 56 M32 26 V56 M42 26 L40 56" ${N} ${S2}/>`,
    '🧸': `<circle cx="16" cy="14" r="7" fill="#c9894a" ${S}/><circle cx="48" cy="14" r="7" fill="#c9894a" ${S}/><circle cx="32" cy="24" r="16" fill="#e0a870" ${S}/><ellipse cx="32" cy="48" rx="16" ry="13" fill="#e0a870" ${S}/><ellipse cx="32" cy="30" rx="6" ry="4.5" fill="#fff0d8"/><circle cx="26" cy="22" r="2.4" fill="${O}"/><circle cx="38" cy="22" r="2.4" fill="${O}"/><circle cx="32" cy="28" r="2" fill="${O}"/>`,
    '🎨': `<path d="M32 6 Q58 6 58 30 Q58 44 46 42 Q38 40 40 48 Q42 58 30 58 Q6 58 6 32 Q6 6 32 6Z" fill="#ffe8c8" ${S}/><circle cx="20" cy="22" r="5" fill="#ff5c6a" ${S2}/><circle cx="34" cy="16" r="5" fill="#ffd84a" ${S2}/><circle cx="46" cy="24" r="5" fill="#5fd38a" ${S2}/><circle cx="18" cy="38" r="5" fill="#6fb6ff" ${S2}/>`,
    '🖼️': `<rect x="6" y="10" width="52" height="44" rx="2" fill="#e0a870" ${S}/><rect x="13" y="17" width="38" height="30" fill="#bfe6ff" ${S2}/><path d="M13 47 L26 32 L34 40 L40 34 L51 47Z" fill="#7fd38a" ${S2}/><circle cx="42" cy="25" r="4" fill="#ffd84a"/>`,
    '🎭': `<path d="M6 12 Q20 6 34 12 V28 Q34 44 20 46 Q6 44 6 28Z" fill="#ffe066" ${S}/><path d="M12 22 Q15 19 18 22 M22 22 Q25 19 28 22 M13 32 Q20 40 27 32" ${N} ${S2}/><path d="M30 22 Q44 16 58 22 V38 Q58 54 44 56 Q30 54 30 38Z" fill="#9fc8ff" ${S}/><path d="M36 32 Q39 35 42 32 M46 32 Q49 35 52 32 M37 48 Q44 40 51 48" ${N} ${S2}/>`,
    '🎬': `<rect x="6" y="26" width="52" height="30" rx="3" fill="#3a3a4a" ${S}/><path d="M6 16 L54 6 L56 16 L8 26Z" fill="#fff" ${S}/><path d="M16 14 L22 23 M28 11 L34 20 M40 9 L46 18" ${N} stroke="${O}" stroke-width="4"/>`,
    '🎮': `<path d="M14 18 H50 Q60 18 60 34 Q60 52 50 52 Q44 52 40 44 H24 Q20 52 14 52 Q4 52 4 34 Q4 18 14 18Z" fill="#9f8aff" ${S}/><path d="M16 30 V40 M11 35 H21" ${N} stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="44" cy="30" r="3.5" fill="#ff7eb6"/><circle cx="50" cy="38" r="3.5" fill="#ffd84a"/>`,
    '🕹️': `<rect x="8" y="40" width="48" height="16" rx="5" fill="#5a6278" ${S}/><path d="M32 40 V20" stroke="${O}" stroke-width="5"/><circle cx="32" cy="16" r="10" fill="#ff5c6a" ${S}/><circle cx="46" cy="48" r="3" fill="#ffd84a"/>`,
    '🎲': `<rect x="10" y="10" width="44" height="44" rx="9" fill="#fff" ${S}/><g fill="#ff5c6a"><circle cx="22" cy="22" r="4"/><circle cx="32" cy="32" r="4"/><circle cx="42" cy="42" r="4"/></g>`,
    '🎳': `<path d="M24 6 Q30 6 30 14 Q30 20 28 24 Q36 36 32 50 Q30 58 24 58 Q18 58 16 50 Q12 36 20 24 Q18 20 18 14 Q18 6 24 6Z" fill="#fff" ${S}/><path d="M19 22 H29" stroke="#ff5c6a" stroke-width="3"/><circle cx="46" cy="46" r="12" fill="#5a6278" ${S}/>`,
    '🎣': `<path d="M8 58 L46 6" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M8 58 L46 6" stroke="#c9893a" stroke-width="2.5" stroke-linecap="round"/><path d="M46 6 Q58 20 54 40" ${N} stroke="${O}" stroke-width="1.6"/><path d="M54 40 V48 Q54 54 48 52" ${N} ${S2}/><circle cx="14" cy="50" r="5" fill="#ff5c6a" ${S2}/>`,
    '🏐': `<circle cx="32" cy="32" r="26" fill="#fff" ${S}/><path d="M32 6 Q26 30 8 44 M32 32 Q50 38 58 28 M32 32 Q34 50 22 56" ${N} ${S2}/><path d="M32 6 Q48 16 58 28" fill="#ffd84a" opacity=".7"/>`,
    '🏓': `<circle cx="24" cy="24" r="18" fill="#ff5c6a" ${S}/><path d="M36 36 L54 54" stroke="${O}" stroke-width="9" stroke-linecap="round"/><path d="M36 36 L54 54" stroke="#e0a870" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="16" r="6" fill="#fff" ${S2}/>`,
    '🏄': `<path d="M4 50 Q32 36 60 46 L56 52 Q30 44 6 56Z" fill="#ff8a5c" ${S}/><path d="M4 60 Q16 54 28 60 Q40 64 60 58" ${N} stroke="#5fa8ff" stroke-width="4"/><circle cx="34" cy="14" r="6" fill="#ffd8b0" ${S2}/><path d="M34 20 L32 34 L22 42 M32 34 L40 44 M30 24 L20 22 M34 24 L46 28" ${N} ${S}/>`,
    '🏋️': `<path d="M8 20 H56" stroke="${O}" stroke-width="5"/><rect x="4" y="10" width="8" height="20" rx="2" fill="#5a6278" ${S2}/><rect x="52" y="10" width="8" height="20" rx="2" fill="#5a6278" ${S2}/><circle cx="32" cy="30" r="6" fill="#ffd8b0" ${S2}/><path d="M22 20 L26 36 H38 L42 20 M28 36 L24 58 M36 36 L40 58" ${N} ${S}/>`,
    '🏆️': '',
    '🔨': `<path d="M28 26 L52 56" stroke="${O}" stroke-width="9" stroke-linecap="round"/><path d="M28 26 L52 56" stroke="#e0a870" stroke-width="4" stroke-linecap="round"/><path d="M10 22 L28 6 L40 18 L22 34Z" fill="#9aa6b8" ${S}/>`,
    '🧹': `<path d="M48 6 L28 36" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M48 6 L28 36" stroke="#e0a870" stroke-width="3" stroke-linecap="round"/><path d="M24 32 L36 40 L28 58 Q16 58 8 50Z" fill="#ffd45a" ${S}/><path d="M18 46 L28 52 M14 42 L24 50" ${N} ${S2}/>`,
    '🪑': `<path d="M18 6 H44 V34 H18Z" fill="#e0a870" ${S}/><path d="M12 34 H50 V40 H12Z" fill="#c98b5a" ${S}/><path d="M16 40 V58 M46 40 V58" ${N} stroke="${O}" stroke-width="5"/>`,
    '🛏️': `<path d="M6 20 V54 M58 34 V54 M6 46 H58" ${N} stroke="${O}" stroke-width="5" stroke-linecap="round"/><rect x="8" y="32" width="50" height="14" rx="3" fill="#9fc8ff" ${S}/><rect x="10" y="24" width="16" height="10" rx="4" fill="#fff" ${S2}/>`,
    '🛁': `<path d="M4 30 H60 V36 Q60 54 32 54 Q4 54 4 36Z" fill="#fff" ${S}/><path d="M12 54 L8 60 M52 54 L56 60 M12 30 V12 Q12 6 18 6 Q22 6 22 12" ${N} ${S}/><circle cx="30" cy="24" r="5" fill="#cdeeff" ${S2}/><circle cx="42" cy="20" r="4" fill="#cdeeff" ${S2}/>`,
    '🫧': `<circle cx="24" cy="36" r="16" fill="#e4f6ff" ${S}/><circle cx="46" cy="20" r="10" fill="#e4f6ff" ${S}/><circle cx="48" cy="48" r="6" fill="#e4f6ff" ${S2}/><path d="M16 30 Q18 24 24 24" ${N} stroke="#fff" stroke-width="3"/>`,
    '🕯️': `<rect x="22" y="24" width="20" height="34" rx="3" fill="#fff4dc" ${S}/><path d="M32 24 V18" ${N} ${S2}/><path d="M32 4 Q40 12 36 18 Q32 22 28 18 Q24 12 32 4Z" fill="#ffb03a" ${S2}/>`,
    '🔮': `<circle cx="32" cy="28" r="20" fill="#c9a8ff" ${S}/><path d="M18 22 Q22 14 30 12" ${N} stroke="#fff" stroke-width="3"/><path d="M14 50 H50 L46 58 H18Z" fill="#c98b5a" ${S}/>` + spark(38, 32, 6, '#fff'),
    '🔭': `<path d="M8 34 L48 14 L54 26 L14 46Z" fill="#7fb8ff" ${S}/><rect x="46" y="8" width="10" height="22" rx="2" fill="#5a6278" ${S2} transform="rotate(-27 51 19)"/><path d="M30 38 L22 58 M30 38 L38 58" ${N} ${S}/>`,
    '🩺': `<path d="M14 6 V24 Q14 36 26 36 Q38 36 38 24 V6" ${N} ${S}/><path d="M26 36 V44 Q26 56 40 56 Q50 56 50 44 V40" ${N} ${S}/><circle cx="50" cy="34" r="7" fill="#c9d3e0" ${S}/>`,
    '🩹': `<rect x="6" y="22" width="52" height="20" rx="10" fill="#ffd0a0" ${S} transform="rotate(-30 32 32)"/><rect x="24" y="24" width="16" height="16" rx="2" fill="#fff0e0" ${S2} transform="rotate(-30 32 32)"/>`,
    '💊': `<rect x="6" y="22" width="52" height="20" rx="10" fill="#fff" ${S} transform="rotate(-35 32 32)"/><path d="M32 22 V42 H16 A10 10 0 0 1 16 22Z" fill="#ff7a8a" transform="rotate(-35 32 32)"/><rect x="6" y="22" width="52" height="20" rx="10" fill="none" ${S} transform="rotate(-35 32 32)"/>`,
    '⚔️': `<path d="M8 8 L46 46 M56 8 L18 46" stroke="${O}" stroke-width="8" stroke-linecap="round"/><path d="M8 8 L46 46 M56 8 L18 46" stroke="#e4e8f0" stroke-width="4" stroke-linecap="round"/><path d="M40 52 L52 40 M24 52 L12 40 M46 46 L56 56 M18 46 L8 56" ${N} stroke="${O}" stroke-width="6" stroke-linecap="round"/>`,
    '🛡️': `<path d="M32 4 L54 12 Q54 44 32 60 Q10 44 10 12Z" fill="#7fb8ff" ${S}/><path d="M32 12 L46 17 Q46 40 32 52Z" fill="#cde6ff"/>`,
    '🎓': `<path d="M4 24 L32 12 L60 24 L32 36Z" fill="#3a3a4a" ${S}/><path d="M16 30 V44 Q32 52 48 44 V30" fill="#3a3a4a" ${S}/><path d="M54 26 V44" ${N} stroke="#ffd45a" stroke-width="3"/><circle cx="54" cy="46" r="3" fill="#ffd45a"/>`,
    '🎩': `<path d="M18 10 H46 V44 H18Z" fill="#3a3a4a" ${S}/><path d="M18 34 H46" stroke="#ff5c6a" stroke-width="6"/><ellipse cx="32" cy="46" rx="26" ry="6" fill="#3a3a4a" ${S}/>`,
    '👗': `<path d="M24 4 L22 16 L14 58 H50 L42 16 L40 4 L32 10Z" fill="#ff8fb8" ${S}/><path d="M22 22 H42" ${N} ${S2}/>`,
    '👘': `<path d="M18 6 L32 16 L46 6 L56 22 L46 26 V58 H18 V26 L8 22Z" fill="#9fc8ff" ${S}/><path d="M18 30 H46 V38 H18Z" fill="#ff8fb8" ${S2}/><path d="M24 6 L32 28 L40 6" ${N} ${S2}/>`,
    '🎐': `<path d="M32 4 V10" ${N} ${S}/><path d="M18 26 Q18 10 32 10 Q46 10 46 26Z" fill="#cdeeff" ${S}/><path d="M32 26 V40" ${N} ${S2}/><rect x="26" y="40" width="12" height="18" fill="#ff8fb8" ${S2}/>`,
    '🍀': `<g fill="#5fd38a" ${S2}>${[0, 90, 180, 270].map(a => `<path d="M32 32 Q20 26 22 16 Q28 10 32 20 Q36 10 42 16 Q44 26 32 32Z" transform="rotate(${a} 32 32)"/>`).join('')}</g>`,
    '⚖️': `<path d="M32 6 V54 M18 58 H46 M10 16 H54" ${N} ${S}/><path d="M10 16 L4 34 H16Z M54 16 L48 34 H60Z" ${N} ${S2}/><path d="M4 34 Q10 42 16 34Z M48 34 Q54 42 60 34Z" fill="#ffd45a" ${S2}/>`,
    '🤝': `<path d="M4 26 L16 20 L30 28 L40 22 L60 28 V42 L48 46 L36 54 Q32 56 28 52 L14 42 L4 42Z" fill="#ffc58a" ${S}/><path d="M30 28 L22 36 Q26 40 32 34 L38 38 M28 46 L34 40 M34 50 L40 44" ${N} ${S2}/>`,
    '👍': `<path d="M8 28 H18 V56 H8Z" fill="#7fb8ff" ${S}/><path d="M18 30 L28 12 Q34 6 36 14 L34 26 H52 Q58 26 56 34 L52 52 Q50 56 46 56 H18Z" fill="#ffc58a" ${S}/>`,
    '👋': `<path d="M16 32 L14 18 Q14 12 19 13 Q22 14 23 18 L24 26 L24 10 Q24 5 29 5 Q33 6 33 10 V24 L35 8 Q36 4 40 5 Q44 6 43 11 L42 26 L46 16 Q48 12 52 14 Q55 16 53 20 L46 40 Q42 56 28 56 Q16 56 14 44 Z" fill="#ffc58a" ${S}/><path d="M4 16 Q2 24 6 30 M58 34 Q62 42 56 48" ${N} ${S2}/>`,
    '👏': `<path d="M22 56 Q8 50 10 36 L16 18 Q18 14 22 16 Q24 18 23 22 L26 12 Q28 8 32 10 Q34 12 33 16 L38 14 Q42 14 41 19 L36 42 Q34 54 22 56Z" fill="#ffc58a" ${S}/><path d="M48 10 L52 4 M54 18 L60 16 M44 6 L44 2" ${N} ${S2}/>`,
    '💪': `<path d="M10 54 Q6 38 14 30 L22 18 Q24 10 32 12 Q38 14 34 22 L30 30 Q40 22 50 28 Q60 36 54 48 Q48 58 30 58 Q14 58 10 54Z" fill="#ffc58a" ${S}/><path d="M32 40 Q40 34 46 40" ${N} ${S2}/>`,
    '👀': `<ellipse cx="20" cy="32" rx="12" ry="16" fill="#fff" ${S}/><ellipse cx="44" cy="32" rx="12" ry="16" fill="#fff" ${S}/><circle cx="24" cy="34" r="6" fill="${O}"/><circle cx="48" cy="34" r="6" fill="${O}"/><circle cx="26" cy="31" r="2" fill="#fff"/><circle cx="50" cy="31" r="2" fill="#fff"/>`,
    '👂': `<path d="M20 30 Q18 8 34 8 Q50 8 48 26 Q46 36 38 42 Q34 46 34 52 Q34 58 26 58 Q20 58 20 52" fill="#ffc58a" ${S}/><path d="M28 28 Q28 18 34 18 Q40 18 40 26 Q38 32 32 34" ${N} ${S2}/>`,
    '🧠': `<path d="M32 10 Q22 6 16 14 Q6 16 8 28 Q4 38 12 44 Q14 54 26 52 Q32 58 38 52 Q50 54 52 44 Q60 38 56 28 Q58 16 48 14 Q42 6 32 10Z" fill="#ffb8c8" ${S}/><path d="M32 10 V52 M18 24 Q24 26 22 32 M46 24 Q40 26 42 32 M16 40 Q22 38 24 42 M48 40 Q42 38 40 42" ${N} ${S2}/>`,
    '🚶': `<circle cx="34" cy="10" r="6" fill="#ffd8b0" ${S2}/><path d="M32 18 L28 36 L20 56 M28 36 L38 46 L40 58 M30 22 L20 30 M32 22 L42 30" ${N} stroke="${O}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 18 L28 36 L20 56 M28 36 L38 46 L40 58 M30 22 L20 30 M32 22 L42 30" ${N} stroke="#7fb8ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    '🏃': `<circle cx="40" cy="10" r="6" fill="#ffd8b0" ${S2}/><path d="M36 18 L28 36 L14 44 M28 36 L40 46 L36 60 M34 22 L20 22 M36 22 L48 32" ${N} stroke="${O}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 18 L28 36 L14 44 M28 36 L40 46 L36 60 M34 22 L20 22 M36 22 L48 32" ${N} stroke="#ff8a5c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 22 H12 M2 32 H10" ${N} ${S2}/>`,
    '👥': `<circle cx="22" cy="20" r="9" fill="#c9d3e0" ${S}/><path d="M6 54 Q6 34 22 34 Q38 34 38 54Z" fill="#c9d3e0" ${S}/><circle cx="42" cy="22" r="9" fill="#9fb8d8" ${S}/><path d="M26 56 Q26 36 42 36 Q58 36 58 56Z" fill="#9fb8d8" ${S}/>`,
    '🫂': `<circle cx="22" cy="18" r="9" fill="#ffd8b0" ${S}/><circle cx="42" cy="18" r="9" fill="#ffd8b0" ${S}/><path d="M6 58 Q6 32 22 30 Q32 32 32 40 Q32 32 42 30 Q58 32 58 58Z" fill="#ff9fb8" ${S}/><path d="M14 40 Q32 50 50 40" ${N} ${S}/>`,
    '🕵️': `<path d="M10 24 Q32 14 54 24 L50 28 H14Z" fill="#a8744a" ${S}/><path d="M18 24 Q18 6 32 6 Q46 6 46 24" fill="#a8744a" ${S}/><circle cx="32" cy="36" r="13" fill="#ffd8b0" ${S}/><circle cx="26" cy="35" r="2.4" fill="${O}"/><circle cx="38" cy="35" r="2.4" fill="${O}"/><circle cx="46" cy="50" r="7" fill="#dff4ff" ${S2}/><path d="M50 55 L58 62" ${N} ${S}/>`,
    '🙅': `<circle cx="32" cy="16" r="10" fill="#ffd8b0" ${S}/><path d="M12 30 L52 58 M52 30 L12 58" stroke="${O}" stroke-width="10" stroke-linecap="round"/><path d="M12 30 L52 58 M52 30 L12 58" stroke="#ff7a7a" stroke-width="5" stroke-linecap="round"/>`,
    '🕸️': `<path d="M16 18 L46 16 L32 46 Z M16 18 L8 44 L32 46 M46 16 L56 42 L32 46" ${N} stroke="${O}" stroke-width="3"/><circle cx="16" cy="18" r="8" fill="#ffb8d6" ${S}/><circle cx="46" cy="16" r="8" fill="#9fc8ff" ${S}/><circle cx="32" cy="46" r="9" fill="#ffe066" ${S}/><circle cx="8" cy="44" r="5" fill="#b8e88a" ${S2}/><circle cx="56" cy="42" r="5" fill="#c9a8ff" ${S2}/>`,
    '🍼': `<rect x="22" y="22" width="20" height="36" rx="7" fill="#fff" ${S}/><path d="M22 34 H42 M22 44 H42" ${N} stroke="#9fd8ff" stroke-width="2.5"/><rect x="20" y="16" width="24" height="8" rx="3" fill="#ff9fc8" ${S}/><path d="M26 16 Q26 4 32 4 Q38 4 38 16Z" fill="#ffe0a0" ${S}/>`,
    '👣': `<g fill="#ffc58a" ${S2}><ellipse cx="22" cy="40" rx="8" ry="12"/><ellipse cx="44" cy="26" rx="8" ry="12"/></g><g fill="#ffc58a" ${S2}><circle cx="15" cy="24" r="2.6"/><circle cx="20" cy="22" r="2.6"/><circle cx="26" cy="23" r="2.6"/><circle cx="37" cy="10" r="2.6"/><circle cx="43" cy="8" r="2.6"/><circle cx="49" cy="10" r="2.6"/></g>`,
    '🦷': `<path d="M14 18 Q14 6 24 8 Q32 10 40 8 Q50 6 50 18 Q50 30 46 36 L42 56 Q38 60 36 52 L32 40 L28 52 Q26 60 22 56 L18 36 Q14 30 14 18Z" fill="#fff" ${S}/><path d="M22 16 Q24 12 28 13" ${N} stroke="#cfe6ff" stroke-width="3"/>`,
    '🖍️': `<path d="M12 52 L44 20 L52 28 L20 60Z" fill="#ff7a7a" ${S}/><path d="M44 20 L52 12 L58 8 L56 14 L52 28Z" fill="#ff9a9a" ${S2}/><path d="M24 40 L32 48 M30 34 L38 42" ${N} stroke="#fff" stroke-width="2.5"/><path d="M4 30 Q14 22 22 30 Q30 38 38 30" ${N} stroke="#ff7a7a" stroke-width="3" stroke-dasharray="1 5"/>`,
    '🚲': `<circle cx="16" cy="42" r="11" fill="none" ${S}/><circle cx="48" cy="42" r="11" fill="none" ${S}/><path d="M16 42 L26 26 H42 L48 42 M26 26 L32 42 L42 26 M22 20 H30 M42 26 L40 18 H46" ${N} stroke="#ff7a5a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="42" r="3" fill="${O}"/>`,
    '🤒': face(eyesSad + mFlat) + `<rect x="36" y="42" width="22" height="6" rx="3" fill="#fff" ${S2} transform="rotate(-20 47 45)"/><circle cx="57" cy="40" r="3" fill="#ff5c5c"/><path d="M12 12 Q18 6 24 12" ${N} stroke="#8fd3ff" stroke-width="3"/>`,
    '🙈': `<circle cx="32" cy="34" r="24" fill="#c99a6a" ${S}/><ellipse cx="32" cy="40" rx="16" ry="13" fill="#f0d0a8"/><circle cx="8" cy="32" r="7" fill="#c99a6a" ${S2}/><circle cx="56" cy="32" r="7" fill="#c99a6a" ${S2}/><path d="M12 30 Q22 18 32 30 Q42 18 52 30 L50 36 Q42 30 32 36 Q22 30 14 36Z" fill="#e0b080" ${S}/><path d="M26 46 Q32 50 38 46" ${N} ${S2}/>`,
    '🧳': `<rect x="12" y="18" width="40" height="38" rx="5" fill="#ffb86a" ${S}/><path d="M24 18 V10 H40 V18" ${N} ${S}/><path d="M12 30 H52 M24 18 V56 M40 18 V56" ${N} ${S2}/><circle cx="20" cy="58" r="3" fill="${O}"/><circle cx="44" cy="58" r="3" fill="${O}"/>`,
    '🎂️': '',
  };
  delete D['🏆️']; delete D['🎂️'];

  // 비슷한 이모지는 같은 그림을 공유
  const ALIAS = {
    '☺️': '😊', '😀': '😄', '😃': '😄', '😁': '😄', '🤣': '😂', '😹': '😂', '😉': '😏', '😌': '😊', '🥺': '🥹', '😥': '😢', '😞': '😔', '😟': '😰', '😓': '😅', '😨': '😰', '😖': '😣', '😫': '😣', '😩': '😣', '😪': '😴', '🥱': '😴', '😮': '😲', '😯': '😲', '🙀': '😱', '😘': '😍', '😚': '😊', '😙': '😊', '🤩': '😍', '😻': '😍', '🤭': '🤫', '😑': '😒', '😐': '😒', '🙄': '😒', '😶': '😒', '🤨': '🤔', '🧐': '🤔', '👿': '😈', '🤬': '😡', '😾': '😠', '😝': '🤪', '😜': '🤪', '😛': '😋', '🤤': '😋', '🥲': '🥹', '😿': '😢',
    '♥️': '❤️', '❣️': '❤️', '💟': '💗', '🩷': '💗', '❤️‍🔥': '💖', '❤️‍🩹': '💗', '♥': '❤️',
    '⭐️': '⭐', '🌟️': '🌟', '✴️': '✨', '❇️': '✨', '💯': '🏆', '🥇': '🏆', '🏅': '🏆',
    '♨': '♨️', '☀': '☀️', '☁': '☁️', '☂': '☂️', '☔': '☂️', '🌂': '☂️', '🌦️': '🌤️', '⛅': '🌤️', '🌥️': '🌤️', '🌩️': '⛈️', '🌨️': '❄️', '☃️': '❄️',
    '🌛': '🌙', '🌜': '🌙', '🌝': '🌙', '🌕': '🌙', '🌄': '🌅', '🌇': '🌅', '🌆': '🌃', '🌌': '🌃', '🌉': '🌃',
    '🌾': '🌱', '🪴': '🌱', '🌵': '🌲', '🎄': '🌲', '☘️': '🍀', '🍂': '🍃', '🍁': '🍃', '🌺': '🌸', '🏵️': '💮', '🥀': '🌹',
    '🍱️': '🍱', '🍛': '🍜', '🍲': '🍜', '🥘': '🍜', '🍝': '🍜', '🥢': '🍜', '🍚': '🍙', '🍘': '🍙', '🍤': '🍣', '🥠': '🥟', '🧁': '🍰', '🍮': '🍰', '🍩': '🍪', '🥐': '🍪', '🍞': '🍪', '🧇': '🍪', '🍫': '🍪', '🍬': '🍬', '🍭': '🍬',
    '🍏': '🍎', '🍑': '🍊', '🍋': '🍊', '🥭': '🍊', '🍇': '🍒', '🫐': '🍒',
    '🍺': '🍹', '🍻': '🍹', '🍷': '🍹', '🥂': '🍹', '🍸': '🍹', '🧃': '🥛', '🧋': '🥛', '🍶': '🍵', '🥤': '🥛',
    '🐡': '🐠', '🦈': '🐟', '🐋': '🐟', '🐳': '🐟', '🐬': '🐟', '🐕': '🐶', '🐩': '🐶', '🐈': '🐱', '🐈‍⬛': '🐱', '🐦': '🕊️', '🐤': '🕊️',
    '🏘️': '🏡', '🏚️': '🏠', '🏨': '🏢', '🏬': '🏢', '🏦': '🏛️', '⛩️': '🏮', '🎪': '🏰', '🗼': '🏢', '🏟️': '🏛️', '🛕': '⛪', '🕌': '⛪',
    '🚢': '⛴️', '⛵': '⛴️', '🛳️': '⛴️', '🚤': '⛴️', '🚃': '🚇', '🚆': '🚇', '🚉': '🚇', '🚋': '🚇',
    '📃': '📋', '📄': '📋', '📝': '📋', '🗒️': '📋', '🗓️': '📅', '📆': '📅', '🗞️': '📰', '📕': '📖', '📗': '📖', '📘': '📖', '📙': '📖', '📓': '📖', '📒': '📖', '🖊️': '✏️', '🖋️': '✏️', '🖍️': '✏️',
    '📹': '📸', '🎥': '🎬', '📽️': '🎬', '📲': '📱', '☎️': '📱', '📞': '📱', '💿': '📼', '📀': '📼', '🖥️': '📺', '💻': '📺',
    '🎼': '🎶', '🎵️': '🎵', '♫': '🎶', '🪕': '🎸', '🎺': '🎷', '🪗': '🎹', '🪘': '🥁',
    '🎟️': '🎫', '🃏': '🎲', '🀄': '🎲', '🧩': '🎲', '♟️': '🎲', '🎰': '🎲',
    '⚽': '🏐', '🏀': '🏐', '⚾': '🏐', '🎾': '🏐', '🏸': '🏓', '🤸': '🏃', '🏊': '🏄', '🚴': '🏃', '🧗': '🏋️', '🤾': '🏃', '🚶‍♀️': '🚶', '🚶‍♂️': '🚶', '🏃‍♀️': '🏃', '🏃‍♂️': '🏃',
    '💵': '💰', '💴': '💰', '💸': '💰', '🧧': '💌', '✉️': '💌', '📩': '💌', '📨': '💌', '📮': '📦', '📥': '📦', '📤': '📦', '🛍': '🛍️',
    '🔓': '🔒', '🗝️': '🔑', '🔎': '🔍', '🔦': '💡', '🏮️': '🏮', '🪔': '🕯️', '🔔️': '🔔', '📯': '📣',
    '👜': '🛍️', '👛': '🛍️', '👝': '🛍️', '🎽': '👗', '👚': '👗', '👕': '👗', '👔': '👗', '🥻': '👗', '👙': '👗', '🧥': '👗', '👒': '🎩', '🧢': '🎩', '⛑️': '🎩',
    '🛀': '🛁', '🚿': '🛁', '🧼': '🫧', '🛋️': '🛏️', '🪞': '🖼️', '🖼': '🖼️',
    '🩻': '🩺', '💉': '💊', '🧪': '💊', '🌡️': '🤒', '🚑': '🏥',
    '🗡️': '⚔️', '🔪': '⚔️', '🪓': '🔨', '🛠️': '🔨', '🔧': '🔨', '🪛': '🔨', '⚒️': '🔨', '🧽': '🧹', '🪣': '🧺',
    '🙌': '👏', '🤲': '🙏', '✋': '👋', '🖐️': '👋', '🤚': '👋', '👌': '👍', '✌️': '👍', '🤞': '👍', '👊': '💪', '✊': '💪', '🦾': '💪',
    '🙋': '👋', '🙇': '🙏', '🤷': '🤔', '💁': '👋', '🙆': '👍',
    '👫': '💑', '👬': '👥', '👭': '👥', '💏': '💑', '👩‍❤️‍👨': '💑', '👨‍👩‍👧': '👥', '👪': '👥', '👯': '👥',
    '👧': '👶', '👦': '👶', '🧒': '👶', 
    '🌋': '🔥', '🕸': '🕸️', '❔': '❓', '⁉️': '❗', '‼️': '❗', '❕': '❕', '⚠️': '❗',
    '🔊': '📢', '📡': '🔭', '🛰️': '🔭', '🪐': '🌟', '🌍': '🗺️', '🌏': '🗺️', '🌎': '🗺️',
    '🛟': '🫧', '🏖': '🏖️', '🏝': '🏝️', '🕊': '🕊️', '🕵': '🕵️', '🗺': '🗺️', '⚔': '⚔️', '🛡': '🛡️', '⚖': '⚖️', '🍽': '🍽️', '🖌️': '🎨', '🎙': '🎙️', '🕹': '🕹️', '🛏': '🛏️', '🌧': '🌧️', '🌤': '🌤️', '⛴': '⛴️', '🕯': '🕯️', '🏛': '🏛️', '🗣': '🗣️', '🏋': '🏋️',
  };
  // 자기참조/누락 정리
  for (const k in ALIAS) if (!D[ALIAS[k]] || k === ALIAS[k]) delete ALIAS[k];

  const resolve = e => { if (!e) return null; if (D[e]) return e; if (ALIAS[e]) return ALIAS[e]; const s = e.replace(/️/g, ''); if (D[s]) return s; if (ALIAS[s]) return ALIAS[s]; if (D[s + '️']) return s + '️'; if (ALIAS[s + '️']) return ALIAS[s + '️']; return null; };

  // ---------- 데이터 URL / 이미지 캐시 ----------
  const urlCache = {}, imgCache = {};
  const svgOf = k => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="128" height="128">${D[k]}</svg>`;
  function url(e) { const k = resolve(e); if (!k) return null; return urlCache[k] || (urlCache[k] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgOf(k))); }
  // SVG를 한 번만 래스터화해서 캔버스로 보관 (SVG를 매번 drawImage하면 느림)
  const bmpCache = {};
  function bake(k, im) { const c = document.createElement('canvas'); c.width = c.height = 128; c.getContext('2d').drawImage(im, 0, 0, 128, 128); bmpCache[k] = c; }
  function img(e) {
    const k = resolve(e); if (!k) return null;
    if (bmpCache[k]) return bmpCache[k];
    let im = imgCache[k];
    if (!im) { im = new Image(); im.onload = () => bake(k, im); im.src = url(k); imgCache[k] = im; return null; }
    if (im.complete && im.naturalWidth) { bake(k, im); return bmpCache[k]; }
    return null;
  }
  // 미리 로드 (게임 시작 화면 전에 완료됨)
  const keys = Object.keys(D);
  const ready = Promise.all(keys.map(k => new Promise(res => { const im = new Image(); im.onload = () => { bake(k, im); res(); }; im.onerror = () => res(); im.src = url(k); imgCache[k] = im; })));

  // ---------- 이모지 토크나이저 ----------
  const EMO = /(?:[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B55}\u{231A}-\u{23FF}\u{2194}-\u{21FF}\u{3030}\u{303D}\u{2049}\u{203C}])️?(?:‍(?:[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}])️?)*/gu;
  // ♥ ★ ♪ 같은 글자형 기호는 텍스트 그대로 (색·크기를 CSS로 쓰는 곳이 있어서)
  const KEEP_TEXT = new Set(['♥', '♡', '★', '☆', '♪', '♫', '✦', '✕', '↔', '➔', '➡', '➕', '↩', '✓', '✔', '☰', '⇄', '↑', '↓', '←', '→', '⬆', '⬇', '⬅', '➜']);
  function split(text) {
    const out = []; let last = 0, any = false;
    text.replace(EMO, (m, off) => {
      const base = m.replace(/️/g, '');
      if (KEEP_TEXT.has(base) && !D[m]) return m;
      const k = resolve(m);
      if (!k) return m;
      if (off > last) out.push(text.slice(last, off));
      out.push({ e: m, k }); last = off + m.length; any = true; return m;
    });
    if (!any) return null;
    if (last < text.length) out.push(text.slice(last));
    return out;
  }

  // ---------- DOM 치환 ----------
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'CANVAS', 'svg', 'SVG', 'TITLE', 'NOSCRIPT']);
  function fixText(node) {
    const t = node.nodeValue; if (!t || t.length > 4000) return;
    EMO.lastIndex = 0; if (!EMO.test(t)) return; EMO.lastIndex = 0;
    const p = node.parentNode; if (!p || SKIP.has(p.nodeName) || p.isContentEditable || (p.closest && p.closest('[data-noicon]'))) return;
    const parts = split(t); if (!parts) return;
    const frag = document.createDocumentFragment();
    for (const s of parts) {
      if (typeof s === 'string') frag.appendChild(document.createTextNode(s));
      else { const im = document.createElement('img'); im.className = 'fmi'; im.alt = s.e; im.draggable = false; im.src = url(s.k); frag.appendChild(im); }
    }
    p.replaceChild(frag, node);
  }
  function walk(root) {
    if (root.nodeType === 3) return fixText(root);
    if (root.nodeType !== 1 || SKIP.has(root.nodeName)) return;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const list = []; let n; while ((n = tw.nextNode())) list.push(n);
    list.forEach(fixText);
  }
  let pend = new Set(), raf = 0;
  const flush = () => { raf = 0; const arr = [...pend]; pend.clear(); arr.forEach(n => { if (n.isConnected) walk(n); }); };
  const mo = new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'characterData') pend.add(m.target);
      else m.addedNodes.forEach(n => { if (!(n.nodeType === 1 && n.classList && n.classList.contains('fmi'))) pend.add(n); });
    }
    if (pend.size) {
      // 같은 프레임 안에 바로 처리 (깜빡임 방지)
      if (!raf) raf = 1, Promise.resolve().then(flush);
    }
  });
  function startDom() {
    const st = document.createElement('style');
    st.textContent = 'img.fmi{height:1.2em;width:1.2em;vertical-align:-0.24em;display:inline-block;object-fit:contain;pointer-events:none;user-select:none;-webkit-user-drag:none;margin:0 .02em}';
    document.head.appendChild(st);
    walk(document.body);
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.body) startDom(); else document.addEventListener('DOMContentLoaded', startDom);

  // ---------- Canvas fillText 패치 ----------
  const P = CanvasRenderingContext2D.prototype;
  const origFill = P.fillText;
  P.fillText = function (text, x, y, maxW) {
    if (typeof text !== 'string' || !text) return origFill.apply(this, arguments);
    EMO.lastIndex = 0; if (!EMO.test(text)) { EMO.lastIndex = 0; return origFill.apply(this, arguments); } EMO.lastIndex = 0;
    const parts = split(text);
    if (!parts) return origFill.apply(this, arguments);
    const ims = parts.map(s => typeof s === 'string' ? null : img(s.k));
    if (parts.some((s, i) => typeof s !== 'string' && !ims[i])) return origFill.apply(this, arguments);
    const m = /(\d+(?:\.\d+)?)px/.exec(this.font); const fs = m ? parseFloat(m[1]) : 10;
    const isz = fs * 1.08;
    const widths = parts.map(s => typeof s === 'string' ? this.measureText(s).width : isz);
    let total = widths.reduce((a, b) => a + b, 0);
    let scale = 1; if (maxW && total > maxW) scale = maxW / total;
    const al = this.textAlign, bl = this.textBaseline;
    const rtl = this.direction === 'rtl';
    let sx = x;
    if (al === 'center') sx = x - total * scale / 2;
    else if (al === 'right' || (al === 'end' && !rtl) || (al === 'start' && rtl)) sx = x - total * scale;
    let top;
    if (bl === 'middle') top = y - isz / 2;
    else if (bl === 'top' || bl === 'hanging') top = y;
    else if (bl === 'bottom' || bl === 'ideographic') top = y - isz;
    else top = y - isz * 0.86; // alphabetic
    this.save();
    this.textAlign = 'left';
    if (scale !== 1) { this.translate(sx, 0); this.scale(scale, 1); this.translate(-sx, 0); }
    let cx = sx;
    parts.forEach((s, i) => {
      if (typeof s === 'string') origFill.call(this, s, cx, y);
      else this.drawImage(ims[i], cx, top, isz, isz);
      cx += widths[i];
    });
    this.restore();
  };
  const origMeasure = P.measureText;
  // (measureText는 그대로: 레이아웃 차이가 크지 않음)
  void origMeasure;

  FM.Icons = { has: e => !!resolve(e), url, img, ready, list: () => keys.slice(), resolve, split };
})();
