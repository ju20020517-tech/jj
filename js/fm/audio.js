/* =========================================================
 *  사운드 — WebAudio로 만든 BGM(필드/밤/로맨틱/쑥스러운 정적/웨딩/피아노 솔로/
 *  클럽/Lo-Fi/8-bit/오페라/힐링/심해)과 효과음 (파일 없이 합성)
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM;
  const Au = (FM.Audio = { on: false, vol: 0.5, cur: null });
  let ctx = null, master = null, bgmGain = null, sfxGain = null;
  const N = n => 440 * Math.pow(2, (n - 69) / 12);  // MIDI → Hz

  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = Au.vol; master.connect(ctx.destination);
      bgmGain = ctx.createGain(); bgmGain.gain.value = 0.35; bgmGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.gain.value = 0.6; sfxGain.connect(master);
    } catch (e) { ctx = null; }
  }
  Au.enable = function (on) {
    Au.on = on;
    if (on) { init(); if (ctx && ctx.state === 'suspended') ctx.resume(); }
    if (master) master.gain.value = on ? Au.vol : 0;
  };
  Au.setVol = v => { Au.vol = v; if (master && Au.on) master.gain.value = v; };

  function tone(freq, t, dur, type = 'sine', vol = 0.2, dest = bgmGain, attack = 0.01, release = 0.2) {
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.setTargetAtTime(0, t + dur, release / 3);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + release + 0.1);
  }
  function noise(t, dur, vol = 0.2, freq = 1000, q = 1, dest = sfxGain, type = 'bandpass') {
    if (!ctx) return;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(dest); s.start(t);
  }

  // ---------------------------------------------------------
  // BGM 정의: bpm, 코드 진행, 멜로디 생성 규칙, 악기
  // ---------------------------------------------------------
  const TRACKS = {
    field:   { name: '섬의 한낮', bpm: 104, chords: [[60, 64, 67], [65, 69, 72], [62, 65, 69], [67, 71, 74]], mel: 'arp', inst: 'triangle', bass: true },
    night:   { name: '별빛 밤', bpm: 72, chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]], mel: 'sparse', inst: 'sine', pad: true },
    romance: { name: '로맨틱 오케스트라', bpm: 66, chords: [[60, 64, 67, 71], [57, 60, 64, 67], [65, 69, 72, 76], [67, 71, 74, 77]], mel: 'long', inst: 'sine', pad: true, strings: true },
    shy:     { name: '쑥스러운 정적', bpm: 50, chords: [[64, 67, 71], [62, 65, 69]], mel: 'rare', inst: 'sine', quiet: true },
    wedding: { name: 'Wedding March', bpm: 88, chords: [[60, 64, 67], [60, 65, 69], [62, 67, 71], [60, 64, 67]], mel: 'march', inst: 'square', pad: true, bass: true },
    piano:   { name: '조용한 피아노 솔로', bpm: 60, chords: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]], mel: 'piano', inst: 'triangle', quiet: true },
    club:    { name: '더 베이스먼트', bpm: 124, chords: [[57, 60, 64], [57, 60, 64], [53, 57, 60], [55, 59, 62]], mel: 'club', inst: 'sawtooth', drums: true, bass: true },
    lofi:    { name: 'Lo-Fi', bpm: 78, chords: [[62, 65, 69, 72], [67, 71, 74, 77], [60, 64, 67, 71], [57, 60, 64, 67]], mel: 'sparse', inst: 'triangle', drums: 'soft', pad: true },
    chip:    { name: '8-bit', bpm: 132, chords: [[60, 64, 67], [67, 71, 74], [69, 72, 76], [65, 69, 72]], mel: 'arp', inst: 'square', drums: 'chip', bass: true },
    opera:   { name: '웅장한 오페라', bpm: 70, chords: [[48, 55, 60, 64], [53, 60, 65, 69], [55, 62, 67, 71], [48, 55, 60, 64]], mel: 'long', inst: 'sawtooth', pad: true, strings: true },
    healing: { name: '힐링', bpm: 64, chords: [[65, 69, 72, 76], [60, 64, 67, 72], [62, 65, 69, 74], [60, 64, 67, 71]], mel: 'sparse', inst: 'sine', pad: true },
    deepsea: { name: '심해 음향', bpm: 50, chords: [[45, 52, 57], [43, 50, 55]], mel: 'bubble', inst: 'sine', pad: true, quiet: true },
    tea:     { name: 'LP 음반', bpm: 70, chords: [[57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65], [60, 64, 67, 71]], mel: 'piano', inst: 'triangle', crackle: true },
    // ---- 장소별 새 BGM ----
    town:     { name: '광장의 왈츠', bpm: 112, chords: [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]], mel: 'waltz', inst: 'triangle', bass: true },
    tropical: { name: '에메랄드 해변', bpm: 116, chords: [[65, 69, 72], [60, 64, 67], [62, 65, 69], [60, 64, 67]], mel: 'island', inst: 'sine', drums: 'soft', bass: true },
    folk:     { name: '숲속 기타', bpm: 96, chords: [[67, 71, 74], [64, 67, 71], [60, 64, 67], [62, 66, 69]], mel: 'folk', inst: 'triangle', pad: true },
    jazz:     { name: '블루문 재즈 라운지', bpm: 92, chords: [[62, 65, 69, 72], [55, 59, 62, 65], [60, 64, 67, 71], [57, 61, 64, 67]], mel: 'bossa', inst: 'triangle', drums: 'soft', bass: true },
    bossa:    { name: '카페 보사노바', bpm: 90, chords: [[62, 65, 69, 72], [67, 71, 74, 77], [60, 64, 67, 71], [57, 61, 64, 67]], mel: 'bossa', inst: 'triangle', drums: 'soft', bass: true },
    citypop:  { name: '네온 시티팝', bpm: 110, chords: [[65, 69, 72, 76], [64, 67, 71, 74], [62, 65, 69, 72], [67, 71, 74, 77]], mel: 'citypop', inst: 'square', drums: true, bass: true },
    organ:    { name: '대성당 오르간', bpm: 58, chords: [[48, 55, 60, 64], [53, 57, 60, 65], [55, 59, 62, 67], [48, 55, 60, 64]], mel: 'organ', inst: 'sawtooth', pad: true },
    space:    { name: '별빛 천문대', bpm: 54, chords: [[57, 64, 69], [53, 60, 65], [55, 62, 67], [52, 59, 64]], mel: 'twinkle', inst: 'sine', pad: true, quiet: true },
    zen:      { name: '폭포의 명상', bpm: 56, chords: [[62, 69, 74], [60, 67, 72]], mel: 'penta', inst: 'sine', pad: true, quiet: true },
    shanty:   { name: '항구의 뱃노래', bpm: 100, chords: [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 56, 59]], mel: 'shanty', inst: 'triangle', bass: true },
    kids:     { name: '신나는 쉬는 시간', bpm: 126, chords: [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]], mel: 'bounce', inst: 'square', drums: 'chip', bass: true },
    work:     { name: '오피스 타이핑', bpm: 94, chords: [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65]], mel: 'piano', inst: 'triangle', drums: 'soft', bass: true },
    calm:     { name: '고요한 병동', bpm: 62, chords: [[64, 67, 71], [60, 64, 67], [62, 65, 69], [59, 62, 67]], mel: 'piano', inst: 'sine', quiet: true, pad: true },
    morning:  { name: '상쾌한 아침', bpm: 108, chords: [[60, 64, 67], [67, 71, 74], [65, 69, 72], [67, 71, 74]], mel: 'arp', inst: 'sine', pad: true },
    rain:     { name: '빗소리 피아노', bpm: 64, chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [57, 60, 64]], mel: 'piano', inst: 'triangle', quiet: true, rain: true },
    market:   { name: '야시장 골목', bpm: 104, chords: [[62, 65, 69], [60, 64, 67], [57, 60, 64], [60, 64, 67]], mel: 'penta', inst: 'triangle', drums: 'soft', bass: true },
    subway:   { name: '지하철 환승', bpm: 118, chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [57, 60, 64]], mel: 'club', inst: 'sawtooth', drums: 'soft', quiet: true },
  };
  Au.TRACKS = TRACKS;
  // 장소 · 시간 · 날씨에 맞는 BGM 고르기
  const PLACE_BGM = { lighthouse: 'romance', seacave: 'zen', underground: 'citypop', plaza: 'town', apt_yard: 'town', apartment: 'town', cafe: 'bossa', metro: 'subway', studio: 'citypop', stairs: 'field', bridge: 'field', cliff: 'romance', cliff_lawn: 'romance', cathedral: 'organ', observatory: 'space', waterfall: 'zen', home_p: 'folk', park: 'folk', playground: 'kids', school: 'kids', library: 'healing', workshop: 'folk', teahouse: 'tea', skylounge: 'bossa', mall: 'citypop', arcade: 'chip', sushi: 'market', pub: 'market', club: 'jazz', conv: 'citypop', alley: 'market', office: 'work', cityhall: 'work', medical: 'calm', beach: 'tropical', ferry: 'shanty' };
  const DISTRICT_BGM = { CORE: 'town', NORTH: 'field', WEST: 'folk', EAST: 'citypop', SOUTH: 'tropical' };
  const NIGHT_KEEP = { jazz: 1, club: 1, chip: 1, space: 1, market: 1, organ: 1, subway: 1 };
  Au.INTERIOR_BGM = { lh_in: 'romance', cave_in: 'space', ug_lobby: 'citypop', cafe_in: 'bossa', studio_in: 'citypop', cathedral_in: 'organ', obs_in: 'space', school_in: 'kids', library_in: 'healing', workshop_in: 'folk', tea_in: 'tea', sky_in: 'bossa', mall_in: 'citypop', arcade_in: 'chip', sushi_in: 'market', pub_in: 'market', club_in: 'jazz', conv_in: 'citypop', office_in: 'work', hall_in: 'work', med_in: 'calm' };
  Au.placeBgm = function (x, z, h, weather) {
    const MAP = FM.MAP; let best = null, bd = 1e9;
    for (const P0 of Object.values(MAP.P)) { const d = Math.hypot(P0.x - x, P0.z - z); const r = P0.r || (P0.bld ? 16 : 12); if (d < r + 4 && d < bd) { bd = d; best = P0; } }
    let key = best && PLACE_BGM[best.id] ? PLACE_BGM[best.id] : DISTRICT_BGM[FM.T.district(x, z)] || 'field';
    if (best && best.id === 'cliff' && h < 16) key = 'zen';
    const night = h >= 21 || h < 5;
    if (/rain|storm/.test(weather || '') && !NIGHT_KEEP[key]) return 'rain';
    if (night && !NIGHT_KEEP[key]) return best && best.id === 'beach' ? 'night' : 'night';
    if (h >= 5 && h < 9 && (key === 'town' || key === 'folk' || key === 'field')) return 'morning';
    return key;
  };

  let timer = null, nextT = 0, step = 0;
  Au.play = function (key) {
    if (Au.cur === key) return;
    Au.cur = key;
    if (!ctx || !Au.on) return;
    step = 0; nextT = ctx.currentTime + 0.1;
    if (!timer) timer = setInterval(schedule, 120);
  };
  function schedule() {
    if (!ctx || !Au.on || !Au.cur) return;
    const tr = TRACKS[Au.cur]; if (!tr) return;
    const beat = 60 / tr.bpm / 2; // 8분음표
    while (nextT < ctx.currentTime + 0.4) {
      const bar = Math.floor(step / 8) % tr.chords.length, s = step % 8;
      const ch = tr.chords[bar];
      const v = tr.quiet ? 0.08 : 0.13;
      if (s === 0) {
        if (tr.pad) for (const n of ch) tone(N(n), nextT, beat * 8, 'sine', v * 0.35, bgmGain, 0.3, 0.8);
        if (tr.strings) for (const n of ch) tone(N(n + 12), nextT, beat * 8, 'triangle', v * 0.15, bgmGain, 0.6, 1);
        if (tr.bass) tone(N(ch[0] - 24), nextT, beat * 3, tr.inst === 'square' ? 'square' : 'triangle', v * 0.6, bgmGain, 0.01, 0.1);
      }
      if (tr.bass && s === 4) tone(N(ch[0] - 24 + 7), nextT, beat * 3, 'triangle', v * 0.5, bgmGain);
      switch (tr.mel) {
        case 'arp': tone(N(ch[s % ch.length] + (s >= 4 ? 12 : 0)), nextT, beat * 0.9, tr.inst, v * 0.55); break;
        case 'sparse': if (s % 3 === 0 && Math.random() < 0.7) tone(N(ch[(Math.random() * ch.length) | 0] + 12), nextT, beat * 2, tr.inst, v * 0.5, bgmGain, 0.02, 0.5); break;
        case 'long': if (s === 0 || s === 4) tone(N(ch[(step / 4 | 0) % ch.length] + 12), nextT, beat * 4, tr.inst === 'sawtooth' ? 'triangle' : tr.inst, v * 0.5, bgmGain, 0.1, 0.6); break;
        case 'rare': if (s === 0 && Math.random() < 0.6) tone(N(ch[(Math.random() * ch.length) | 0] + 12), nextT, beat * 6, 'sine', v * 0.4, bgmGain, 0.3, 1.2); break;
        case 'march': { const pat = [0, 0, 0, -1, 0, 2, 2, 1]; const n = pat[s]; if (n >= 0) tone(N(ch[n % ch.length] + 12), nextT, beat * 0.9, 'triangle', v * 0.6); break; }
        case 'piano': if (s % 2 === 0) tone(N(ch[(s / 2) % ch.length] + 12), nextT, beat * 3, 'triangle', v * 0.55, bgmGain, 0.005, 1.2); break;
        case 'club': tone(N(ch[s % ch.length] + 12), nextT, beat * 0.5, 'sawtooth', v * 0.25); break;
        case 'bubble': if (Math.random() < 0.3) tone(600 + Math.random() * 900, nextT, 0.08, 'sine', 0.05, bgmGain, 0.005, 0.05); break;
        case 'waltz': { const m = step % 6; if (m === 0) tone(N(ch[0] - 12), nextT, beat * 1.8, 'triangle', v * 0.5); else if (m === 2 || m === 4) { tone(N(ch[1]), nextT, beat * 0.8, 'triangle', v * 0.3); tone(N(ch[2]), nextT, beat * 0.8, 'triangle', v * 0.3); } if (m === 0 || m === 3) tone(N(ch[(step / 3 | 0) % ch.length] + 12), nextT, beat * 1.5, tr.inst, v * 0.5); break; }
        case 'island': { const pat = [1, 0, 1, 1, 0, 1, 0, 1]; if (pat[s]) { const pent = [0, 2, 4, 7, 9]; tone(N(ch[0] + 12 + pent[(step * 3 + s) % 5]), nextT, beat * 0.7, 'sine', v * 0.5, bgmGain, 0.002, 0.25); tone(N(ch[0] + 24 + pent[(step * 3 + s) % 5]), nextT, beat * 0.5, 'triangle', v * 0.15, bgmGain, 0.002, 0.2); } break; }
        case 'folk': { const pat = [0, 2, 1, 2, 0, 2, 1, 2]; tone(N(ch[pat[s] % ch.length] + (s === 0 ? -12 : 0)), nextT, beat * 1.4, 'triangle', v * 0.45, bgmGain, 0.003, 0.5); if (s === 5 && Math.random() < 0.6) tone(N(ch[2] + 12), nextT, beat * 2, 'sine', v * 0.35, bgmGain, 0.02, 0.6); break; }
        case 'bossa': { const hit = [1, 0, 0, 1, 0, 0, 1, 0]; if (hit[s]) for (const n of ch) tone(N(n), nextT, beat * 0.8, 'triangle', v * 0.18, bgmGain, 0.005, 0.2); if (s === 2 || s === 6) tone(N(ch[(step / 2 | 0) % ch.length] + 12), nextT, beat * 1.5, 'sine', v * 0.4, bgmGain, 0.02, 0.4); break; }
        case 'citypop': { if (s % 2 === 1) tone(N(ch[0] - 12 + (s === 3 ? 12 : 0)), nextT, beat * 0.4, 'square', v * 0.2, bgmGain, 0.002, 0.08); if (s === 0 || s === 3 || s === 6) for (const n of ch) tone(N(n), nextT, beat * 0.6, 'triangle', v * 0.14, bgmGain, 0.005, 0.12); if (s === 4) tone(N(ch[3 % ch.length] + 12), nextT, beat * 2, 'sine', v * 0.45, bgmGain, 0.01, 0.4); break; }
        case 'organ': if (s === 0) for (const n of ch) { tone(N(n), nextT, beat * 7.5, 'square', v * 0.07, bgmGain, 0.15, 0.6); tone(N(n + 12), nextT, beat * 7.5, 'sine', v * 0.12, bgmGain, 0.15, 0.6); } if (s === 4) tone(N(ch[(step / 8 | 0) % ch.length] + 12), nextT, beat * 4, 'triangle', v * 0.35, bgmGain, 0.1, 0.8); break;
        case 'twinkle': if (Math.random() < 0.28) tone(N(ch[(Math.random() * ch.length) | 0] + 24), nextT, beat * 0.5, 'sine', v * 0.35, bgmGain, 0.002, 0.9); break;
        case 'penta': { const pent = [0, 2, 4, 7, 9, 12]; if (s % 2 === 0 && Math.random() < 0.75) tone(N(ch[0] + 12 + pent[(Math.random() * pent.length) | 0]), nextT, beat * 1.2, tr.inst, v * 0.45, bgmGain, 0.003, 0.6); break; }
        case 'shanty': { const m = step % 6; if (m === 0) tone(N(ch[0] - 12), nextT, beat * 2, 'triangle', v * 0.5); if (m === 3) tone(N(ch[0] - 5), nextT, beat * 2, 'triangle', v * 0.4); const mel = [2, 1, 0, 1, 2, 2]; tone(N(ch[mel[m]] + 12), nextT, beat * 0.9, 'triangle', v * 0.4, bgmGain, 0.01, 0.2); break; }
        case 'bounce': { const pat = [0, 2, 1, 2, 0, 1, 2, 1]; tone(N(ch[pat[s]] + 12 + (s === 7 ? 12 : 0)), nextT, beat * 0.45, 'square', v * 0.3, bgmGain, 0.002, 0.08); break; }
      }
      if (tr.drums) {
        if (s % 4 === 0) { tone(tr.drums === 'chip' ? 110 : 60, nextT, 0.12, tr.drums === 'chip' ? 'square' : 'sine', tr.drums === 'soft' ? 0.18 : 0.35, bgmGain, 0.002, 0.1); }
        if (s % 4 === 2) noise(nextT, 0.08, tr.drums === 'soft' ? 0.05 : 0.12, 6000, 0.8, bgmGain, 'highpass');
        if (s % 8 === 4) noise(nextT, 0.15, tr.drums === 'soft' ? 0.06 : 0.14, 1800, 0.7, bgmGain);
      }
      if (tr.crackle && Math.random() < 0.4) noise(nextT, 0.02, 0.03, 3000, 2, bgmGain);
      if (tr.rain) noise(nextT, beat, 0.025, 2500, 0.4, bgmGain, 'highpass');
      nextT += beat; step++;
    }
  }

  // ---------------------------------------------------------
  // 효과음
  // ---------------------------------------------------------
  // ---------------------------------------------------------
  // 주민 목소리 (동물의 숲 식 옹알이) — 목소리 프로필 { f: 기본 음높이(Hz), wave, speed, vol, vib, bright, glide, gruff }
  // ---------------------------------------------------------
  let voiceGain = null, voicesNow = 0;
  function vg() { if (!voiceGain && ctx) { voiceGain = ctx.createGain(); voiceGain.gain.value = 1.35; voiceGain.connect(master); } return voiceGain; }
  function syllable(pr, t, f, dur, vol) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = pr.wave || 'triangle'; o2.type = 'sine';
    o.frequency.setValueAtTime(f, t); o2.frequency.setValueAtTime(f * 2, t);
    if (pr.glide) { o.frequency.linearRampToValueAtTime(f * (1 + pr.glide), t + dur); o2.frequency.linearRampToValueAtTime(f * 2 * (1 + pr.glide), t + dur); }
    if (pr.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 9; lg.gain.value = f * pr.vib; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05); }
    lp.type = 'lowpass'; lp.frequency.value = f * (pr.bright || 4); lp.Q.value = 1.2;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.setTargetAtTime(0, t + dur * 0.7, dur * 0.25);
    g2.gain.setValueAtTime(0, t); g2.gain.linearRampToValueAtTime(vol * 0.3, t + 0.012); g2.gain.setTargetAtTime(0, t + dur * 0.6, dur * 0.2);
    o.connect(lp); lp.connect(g); g.connect(vg()); o2.connect(g2); g2.connect(vg());
    o.start(t); o2.start(t); o.stop(t + dur + 0.15); o2.stop(t + dur + 0.15);
    if (pr.gruff) noise(t, dur * 0.8, vol * pr.gruff, f * 3, 2, vg());
  }
  const sylF = (pr, ch, i, n, q, ex) => { const c = ch ? ch.charCodeAt(0) : 0; const semi = ((c * 7 + i * 3) % 7 - 3) * (pr.range || 1.4); let f = pr.f * Math.pow(2, semi / 12); if (q && i >= n - 2) f *= 1.18 + (i === n - 1 ? 0.1 : 0); if (ex && i === 0) f *= 1.08; return f; };
  // 한 글자 (대화창 타자 소리)
  Au.voiceBlip = function (pr, ch) {
    if (!ctx || !Au.on || !pr) return;
    const t = ctx.currentTime;
    syllable(pr, t, sylF(pr, ch, (Math.random() * 5) | 0, 5, false, false), 0.07 / (pr.speed || 1), 0.13 * (pr.vol || 1));
  };
  // 한 문장 옹알이 (말풍선)
  Au.speak = function (pr, text) {
    if (!ctx || !Au.on || !pr || voicesNow >= 2) return;
    const chars = String(text).replace(/[^가-힣a-zA-Z0-9]/g, '').slice(0, 16);
    if (!chars) return;
    const q = /\?\s*$/.test(text), ex = /!/.test(text);
    const step = 0.085 / (pr.speed || 1);
    let t = ctx.currentTime + 0.02;
    voicesNow++; setTimeout(() => { voicesNow = Math.max(0, voicesNow - 1); }, chars.length * step * 1000 + 200);
    for (let i = 0; i < chars.length; i++) { syllable(pr, t, sylF(pr, chars[i], i, chars.length, q, ex), step * 0.85, 0.13 * (pr.vol || 1) * (ex ? 1.15 : 1)); t += step * (0.85 + Math.random() * 0.3); }
  };
  // 대사 효과음 (음성 피치 조절 — 드라마 앨범 더빙용)
  Au.blip = function (pitch = 1) { if (!ctx || !Au.on) return; tone(N(74 + Math.floor(Math.random() * 6)) * pitch, ctx.currentTime, 0.035, 'triangle', 0.035, sfxGain); };
  Au.sfx = function (key) {
    if (!ctx || !Au.on) return;
    const t = ctx.currentTime;
    switch (key) {
      case 'step_wood': case 'step_log': noise(t, 0.08, 0.08, 400, 3); tone(180 + Math.random() * 40, t, 0.1, 'triangle', 0.03, sfxGain); break;          // 삐걱
      case 'step_marble': tone(1800, t, 0.03, 'square', 0.03, sfxGain, 0.001, 0.03); noise(t, 0.03, 0.06, 3500, 5); break;                             // 또각
      case 'step_tile': noise(t, 0.04, 0.05, 2500, 4); break;
      case 'step_carpet': case 'step_mat': noise(t, 0.05, 0.03, 600, 1); break;
      case 'step_metal': tone(900, t, 0.05, 'square', 0.03, sfxGain, 0.001, 0.08); break;
      case 'step_water': noise(t, 0.12, 0.06, 900, 1); break;
      case 'step_sand': case 'step_candy': noise(t, 0.06, 0.04, 1200, 1); break;
      case 'step_grass': noise(t, 0.05, 0.025, 800, 0.8); break;
      case 'knock': for (let i = 0; i < 3; i++) { tone(160, t + i * 0.18, 0.05, 'sine', 0.3, sfxGain, 0.001, 0.05); noise(t + i * 0.18, 0.05, 0.1, 500, 2); } break;
      case 'glass': for (let i = 0; i < 8; i++) tone(2000 + Math.random() * 3000, t + i * 0.02, 0.2, 'sine', 0.06, sfxGain, 0.001, 0.4); noise(t, 0.4, 0.2, 5000, 1, sfxGain, 'highpass'); break;
      case 'bell': for (const f of [523, 659, 784]) tone(f, t, 1.8, 'sine', 0.12, sfxGain, 0.005, 2); break;
      case 'fireworks': for (let i = 0; i < 6; i++) { noise(t + i * 0.25, 0.5, 0.25, 800 + Math.random() * 1500, 0.6); tone(300 + Math.random() * 600, t + i * 0.25, 0.3, 'sawtooth', 0.03, sfxGain); } break;
      case 'camera': noise(t, 0.05, 0.3, 4000, 1); tone(1200, t + 0.06, 0.04, 'square', 0.05, sfxGain); break;
      case 'thud': tone(70, t, 0.25, 'sine', 0.5, sfxGain, 0.002, 0.2); noise(t, 0.15, 0.2, 300, 1); break;
      case 'hammer': for (let i = 0; i < 3; i++) { tone(400, t + i * 0.3, 0.05, 'square', 0.08, sfxGain); noise(t + i * 0.3, 0.05, 0.15, 2000, 2); } break;
      case 'score': for (let i = 0; i < 4; i++) tone(N(72 + i * 4), t + i * 0.08, 0.15, 'square', 0.06, sfxGain); break;
      case 'creak': tone(140, t, 0.6, 'sawtooth', 0.04, sfxGain, 0.1, 0.3); break;
      case 'boom': noise(t, 0.6, 0.4, 200, 0.5); tone(55, t, 0.5, 'sine', 0.4, sfxGain); break;           // 인테리어 변신 펑!
      case 'pop': tone(800, t, 0.06, 'sine', 0.12, sfxGain, 0.001, 0.05); break;
      case 'heart': tone(N(76), t, 0.12, 'sine', 0.1, sfxGain); tone(N(81), t + 0.12, 0.2, 'sine', 0.1, sfxGain); break;
      case 'splash': noise(t, 0.35, 0.18, 1200, 0.7); break;
      case 'ui': tone(N(84), t, 0.05, 'sine', 0.05, sfxGain); break;
      case 'blip': tone(N(74 + Math.floor(Math.random() * 6)), t, 0.035, 'triangle', 0.035, sfxGain); break;             // 미연시 대사 타이핑
      case 'page': noise(t, 0.08, 0.04, 2500, 1); tone(N(79), t, 0.06, 'sine', 0.04, sfxGain); break;
      case 'coin': tone(N(88), t, 0.08, 'square', 0.05, sfxGain); tone(N(93), t + 0.08, 0.12, 'square', 0.05, sfxGain); break;
      case 'bird': for (let i = 0; i < 5; i++) tone(2500 + Math.random() * 1500, t + i * 0.07, 0.05, 'sine', 0.06, sfxGain); break;
      case 'bubbles': for (let i = 0; i < 6; i++) tone(500 + Math.random() * 800, t + i * 0.1, 0.05, 'sine', 0.05, sfxGain); break;
      case 'safety': for (let i = 0; i < 2; i++) tone(N(79), t + i * 0.2, 0.12, 'square', 0.05, sfxGain); break;
    }
  };
  FM.bus.on('sfx', e => Au.sfx(e.key));

  // ---------------------------------------------------------
  // 방 앰비언스 (특이 취향 Layer 4) — 작게 반복되는 배경 효과음
  // ---------------------------------------------------------
  let ambKind = null, ambTimer = null, ambGain = null, drone = null, nextA = 0;
  function stopDrone() { if (drone) { for (const o of drone) try { o.stop(); } catch (e) {} drone = null; } }
  function ambTick() {
    if (!ctx || !Au.on || !ambKind) return;
    const t = ctx.currentTime;
    if (t < nextA) return;
    const R = Math.random;
    switch (ambKind) {
      case 'crickets': for (let i = 0; i < 3; i++) tone(4300 + R() * 500, t + i * 0.06, 0.03, 'square', 0.012, ambGain, 0.005, 0.02); nextA = t + 0.35 + R() * 0.9; break;          // 풀벌레
      case 'sizzle': noise(t, 0.08 + R() * 0.1, 0.05, 5000, 0.7, ambGain, 'highpass'); nextA = t + 0.1 + R() * 0.4; break;                                                          // 지글지글
      case 'pages': noise(t, 0.28, 0.08, 2600, 0.8, ambGain); nextA = t + 3 + R() * 4; break;                                                                                         // 종이 넘기는 소리
      case 'surf': noise(t, 3.2, 0.09, 500, 0.6, ambGain, 'lowpass'); nextA = t + 3.5 + R() * 2; break;                                                                            // 파도
      case 'chime': tone(1600 + R() * 1400, t, 0.4, 'sine', 0.035, ambGain, 0.005, 1.2); nextA = t + 1.4 + R() * 2; break;                                                           // 반짝
      case 'twinkle': tone(N(84), t, 0.12, 'sine', 0.04, ambGain); tone(N(88), t + 0.12, 0.2, 'sine', 0.04, ambGain); nextA = t + 3 + R() * 3; break;                                  // 하트 핑
      case 'fresh': for (let i = 0; i < 4; i++) tone(N(84 + i * 3), t + i * 0.07, 0.12, 'sine', 0.03, ambGain); nextA = t + 4 + R() * 3; break;                                          // 상쾌
      case 'drone': tone(2400 + R() * 1600, t, 0.6, 'sine', 0.015, ambGain, 0.2, 1.5); nextA = t + 1.2 + R() * 2; break;                                                             // 은하수 반짝임 (+ 저음 패드)
      case 'beat': tone(58, t, 0.18, 'sine', 0.12, ambGain, 0.002, 0.15); noise(t + 0.3, 0.04, 0.03, 8000, 1, ambGain, 'highpass'); nextA = t + 0.6; break;                           // 비트
      default: nextA = t + 1;
    }
  }
  Au.ambience = function (kind) {
    if (kind === ambKind) return;
    ambKind = kind || null;
    if (!ctx) return;
    if (!ambGain) { ambGain = ctx.createGain(); ambGain.gain.value = 0.8; ambGain.connect(master); }
    stopDrone();
    if (ambKind === 'drone') { drone = [110, 164.8].map(f => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; g.gain.value = 0.018; o.connect(g); g.connect(ambGain); o.start(); return o; }); }
    if (bgmGain) bgmGain.gain.value = ambKind === 'hum' ? 0.46 : 0.35;   // 음악 취향: 룸 BGM 음질(볼륨·존재감) 향상
    if (!ambTimer) ambTimer = setInterval(ambTick, 120);
    nextA = 0;
  };
})();
