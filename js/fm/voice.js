/* =========================================================
 *  주민 목소리 — 종의 크기 · 외모(성별 이미지) · 성격 · 나이에 맞춘 목소리 프로필
 *   큰 종(곰 · 사자 · 북극곰)은 굵게, 작은 종(병아리 · 햄스터)은 높게
 *   원피스 · 리본 · 꽃핀 → 한 톤 높게, 넥타이 · 나비넥타이 · 조끼 → 한 톤 낮게
 *   운동파는 힘차게, 미식/휴식파는 느릿느릿, 예술파는 떨리는 비브라토, 걱정파는 빠르고 가늘게 …
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE, Sim = FM.Sim;
  const V = (FM.Voice = {});
  const hash = s => { let h = 7; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const PERS = {
    ROMANTIC: { wave: 'sine', speed: 1.0, vol: 0.95, vib: 0.012, mul: 1.05, range: 1.6, bright: 3.5 },
    ATHLETIC: { wave: 'square', speed: 1.25, vol: 1.2, mul: 0.95, range: 1.2, bright: 3 },
    SCHOLARLY: { wave: 'triangle', speed: 1.05, vol: 0.95, mul: 1.0, range: 0.9, bright: 4 },
    LAZY: { wave: 'sine', speed: 0.7, vol: 0.9, mul: 0.88, glide: -0.08, range: 0.8, bright: 3 },
    EXTROVERT: { wave: 'square', speed: 1.35, vol: 1.2, mul: 1.1, range: 2.2, bright: 3.5 },
    INTROVERT: { wave: 'sine', speed: 0.85, vol: 0.75, mul: 1.0, range: 0.8, bright: 3 },
    SNOB: { wave: 'triangle', speed: 0.9, vol: 1.0, mul: 0.95, glide: 0.04, range: 1.3, bright: 5 },
    CRANKY: { wave: 'sawtooth', speed: 1.0, vol: 1.05, mul: 0.8, gruff: 0.25, range: 1.0, bright: 2.2 },
    ARTISTIC: { wave: 'triangle', speed: 0.95, vol: 1.0, mul: 1.05, vib: 0.035, range: 2.4, bright: 4 },
    ANXIOUS: { wave: 'sine', speed: 1.2, vol: 0.85, mul: 1.12, vib: 0.02, range: 1.5, bright: 4 },
  };
  const FEM_HAT = { bow: 1, flower: 1, headband: 0.6, halo: 0.4 }, MASC_ACC = { bowtie: 0.8, tie: 1 };
  // 외모에서 읽는 성별 이미지: + 높고 부드럽게, - 낮고 굵게
  function genderImage(l) {
    let g = 0;
    if (l.top === 'dress') g += 1; if (l.bottom === 'skirt') g += 0.8;
    g += FEM_HAT[l.hat] || 0;
    if (l.acc === 'necklace' || l.acc === 'lei') g += 0.4;
    g -= MASC_ACC[l.acc] || 0;
    if (l.top === 'vest') g -= 0.6; if (l.hat === 'cap' || l.hat === 'beanie') g -= 0.3;
    if (l.eyes === 'sparkle' || l.eyes === 'star') g += 0.3;
    return Math.max(-2, Math.min(2, g));
  }
  V.profile = function (v) {
    if (!v) return null;
    const look = v.id === 'P' ? (v.look || {}) : (() => { try { return FM.Chars.outfitLook(v); } catch (e) { return v.look || {}; } })();
    const key = (v.keys && v.keys.L1) || 'ROMANTIC';
    const pr = Object.assign({}, PERS[key] || PERS.ROMANTIC);
    const sp = look.species || 'human';
    const size = (ISLE.SPECIES[sp] && ISLE.SPECIES[sp].size) || 1;
    const h = hash(v.id || v.name || 'x');
    let f = 330 / Math.pow(size, 1.6) * pr.mul;
    f *= 1 + 0.11 * genderImage(look);
    f *= 1 + ((h % 13) - 6) / 100;                       // 개인차 ±6%
    if (v.child) f *= { BABY: 1.7, TODDLER: 1.55, CHILD: 1.35 }[v.child.stage] || 1.3;
    if (look.height) f /= Math.pow(look.height, 0.6);
    pr.f = Math.max(110, Math.min(900, f));
    if (v.voicePitch) pr.f *= v.voicePitch;
    return pr;
  };
  const cache = new Map();
  V.of = function (v) {
    if (!v) return null;
    const k = (v.id || '') + '|' + (v.child ? v.child.stage : '') + '|' + (v.outfit || '') + '|' + (v.voicePitch || 1);
    let p = cache.get(k); if (!p) { p = V.profile(v); cache.set(k, p); if (cache.size > 200) cache.delete(cache.keys().next().value); }
    return p;
  };
  V.blip = function (v, ch, pitchMul) {
    const pr = V.of(v); if (!pr) return FM.Audio.sfx('blip');
    FM.Audio.voiceBlip(pitchMul && pitchMul !== 1 ? Object.assign({}, pr, { f: pr.f * pitchMul }) : pr, ch);
  };
  // 말풍선 → 근처(또는 관찰 중인 방)에서만 옹알이
  const lastT = new Map();
  FM.bus.on('say', ({ v, text }) => {
    try {
      if (!FM.Audio.on || !v || v.id === 'P') return;
      if (FM.Cut && FM.Cut.playing && FM.Cut.playing()) return;
      const st = Sim.get(), p = st.player, G = FM.G;
      const watching = G && G.view === 'observe' && (G.obs === v.loc || (!G.obs && v.loc && String(v.loc).startsWith('apt')));
      const near = v.loc === p.loc && Math.hypot(v.x - p.x, v.z - p.z) < 16;
      if (!near && !watching) return;
      const now = performance.now(); if (now - (lastT.get(v.id) || 0) < 1400) return; lastT.set(v.id, now);
      FM.Audio.speak(V.of(v), text);
    } catch (e) { /* 무시 */ }
  });
})();
