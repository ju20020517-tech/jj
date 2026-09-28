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
  };
  Au.TRACKS = TRACKS;

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
      }
      if (tr.drums) {
        if (s % 4 === 0) { tone(tr.drums === 'chip' ? 110 : 60, nextT, 0.12, tr.drums === 'chip' ? 'square' : 'sine', tr.drums === 'soft' ? 0.18 : 0.35, bgmGain, 0.002, 0.1); }
        if (s % 4 === 2) noise(nextT, 0.08, tr.drums === 'soft' ? 0.05 : 0.12, 6000, 0.8, bgmGain, 'highpass');
        if (s % 8 === 4) noise(nextT, 0.15, tr.drums === 'soft' ? 0.06 : 0.14, 1800, 0.7, bgmGain);
      }
      if (tr.crackle && Math.random() < 0.4) noise(nextT, 0.02, 0.03, 3000, 2, bgmGain);
      nextT += beat; step++;
    }
  }

  // ---------------------------------------------------------
  // 효과음
  // ---------------------------------------------------------
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
})();
