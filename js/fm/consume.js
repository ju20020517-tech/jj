/* =========================================================
 *  🍙 산 물건 쓰기 모션
 *   - 먹을 것 · 마실 것: 손에 들고 20초 넘게 먹는 / 마시는 모션 (스태미나 회복, Esc로 그만 먹기)
 *   - 물건: 잠깐 들어서 보고 → 몸을 숙여 가방에 쏙 넣는 모션 (🎒)
 *   직원과의 대화로 산 물건 · 마츠리 노점 · 상점 모두 여기로
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, D = FM.D;
  if (!Sim) return;
  const S = () => Sim.get();
  const toast = t => FM.UI && FM.UI.toast(t);
  // 아이템 → 손에 드는 소품
  const PROP = { cookie: 'snack', kimbap: 'kimbap', can: 'can', sandwich: 'sandwich', souffle: 'pudding', udon: 'bowl', lunchbox: 'sandwich', stamina_food: 'bowl', protein: 'drink',
    espresso: 'teacup', jujube_tea: 'teacup', rare_fruit: 'apple', coffee_milk: 'drink', takoyaki: 'bowl', cotton_candy: 'marshmallow', yakisoba: 'bowl', kakigori: 'bowl', candy_apple: 'apple',
    rose: 'flower', tulip: 'flower', bouquet: 'flower', book: 'book', poem_book: 'book', magazine: 'book', plush: 'plush', claw_plush: 'plush', candle: 'candle', crystal: 'crystal', ring: 'ring', record: 'radio' };
  const DRINK = new Set(['can', 'espresso', 'jujube_tea', 'protein', 'coffee_milk']);
  const NOT_EAT = new Set(['fish_catch', 'big_fish', 'veggie_basket']);
  const isFood = k => { const it = D.ITEMS[k]; if (!it || NOT_EAT.has(k)) return false; const t = it.tags || []; return t.includes('food') || t.includes('snack') || DRINK.has(k) || it.edible; };
  let timer = null, endFn = null;
  function stop(msg) {
    const p = S().player; clearInterval(timer); timer = null;
    p.pose = null; p.prop = null; p.busy = false; p.eating = false;
    if (endFn) { const f = endFn; endFn = null; f(); }
    if (msg) toast(msg);
  }
  // 먹기 / 마시기 (초 단위, 기본 22초)
  function eat(k, opt = {}) {
    const st = S(), p = st.player, it = D.ITEMS[k] || { name: opt.name || '간식', icon: opt.icon || '🍙' };
    if (timer) stop();
    const drink = opt.drink != null ? opt.drink : DRINK.has(k), dur = (opt.sec || 22) * 1000, t0 = Date.now();
    p.busy = true; p.eating = true; p.pose = drink ? 'drink' : 'eat'; p.prop = opt.prop || PROP[k] || (drink ? 'drink' : 'snack');
    if (FM.G) { FM.G.target = null; FM.G.autoPath = null; }
    const gain = opt.stamina != null ? opt.stamina : (it.stamina || 12);
    let n = 0;
    toast(`${it.icon} ${it.name} ${drink ? '마시는' : '먹는'} 중… (약 ${Math.round(dur / 1000)}초 · Esc 그만 ${drink ? '마시기' : '먹기'})`);
    timer = setInterval(() => {
      n++; p.pose = drink ? 'drink' : 'eat';
      if (n % 6 === 3) p.emote = { e: ['😋', '😊', '✨', '💕', '🤤'][(n / 6 | 0) % 5], until: st.realT + 2 };
      p.stamina = Math.min(100, (p.stamina || 0) + gain / (dur / 1000));
      if (Date.now() - t0 >= dur) { p.emote = { e: '😌', until: st.realT + 2.5 }; stop(`${it.icon} 다 ${drink ? '마셨어요' : '먹었어요'}! (스태미나 +${Math.round(gain)})`); }
    }, 1000);
    endFn = opt.onEnd || null;
  }
  // 가방에 넣기 (약 3초)
  function bag(k, opt = {}) {
    const st = S(), p = st.player, it = D.ITEMS[k] || { name: opt.name || '물건', icon: opt.icon || '🎁' };
    if (timer) stop();
    p.busy = true; p.prop = opt.prop || PROP[k] || null; p.pose = 'look';
    p.emote = { e: it.icon, until: st.realT + 1.4 };
    setTimeout(() => { p.pose = 'crouch'; p.emote = { e: '🎒', until: st.realT + 1.6 }; }, 1300);
    setTimeout(() => { p.prop = null; }, 2000);
    setTimeout(() => { p.pose = null; p.busy = false; toast(`🎒 ${it.icon} ${it.name}을(를) 가방에 넣었어요`); }, 2900);
  }
  // 산 직후: 먹을 거면 바로 먹고(가방에서 1개 빠짐), 아니면 가방에 넣는 모션
  function afterBuy(k) {
    if (isFood(k)) { const Soc = FM.Soc; if (Soc && Soc.takeItem) Soc.takeItem(k); eatSeated(k); }
    else bag(k);
  }
  // 🍽️ 음식은 그 자리에서 먹지 않고, 들고 가까운 빈자리(의자 · 소파 · 벤치)로 걸어가 앉아서 먹기
  function seatNear(p) {
    if (p.loc === 'island') {
      let best = null, bd = 22;
      for (const sp of Sim.SPOTS) { if (!sp.seat || sp.lie || sp.occ) continue; const d = Math.hypot(sp.x - p.x, sp.z - p.z); if (d < bd) { bd = d; best = sp; } }
      return best ? { island: true, sp: best, x: best.x, z: best.z } : null;
    }
    let best = null, bd = 14;
    for (const u of Sim.furnUses(p.loc, u => (u.u.pose === 'sit' || u.u.seatH > 0) && u.u.pose !== 'sleep')) {
      if (Sim.useOcc[u.key]) continue; const d = Math.hypot(u.x - p.x, u.z - p.z); if (d < bd) { bd = d; best = u; }
    }
    return best ? { u: best, x: best.x, z: best.z } : null;
  }
  let walkT = null;
  function eatSeated(k, opt = {}) {
    const st = S(), p = st.player, G = FM.G;
    if (walkT) { clearInterval(walkT); walkT = null; }
    if (p.sitting && p.act && p.act.seatH) return eat(k, opt);   // 이미 앉아 있으면 바로
    const seat = seatNear(p);
    if (!seat || !G) return eat(k, opt);
    const it = D.ITEMS[k] || { name: opt.name || '간식', icon: opt.icon || '🍙' };
    p.prop = opt.prop || PROP[k] || (DRINK.has(k) ? 'drink' : 'snack'); p.carrying = true;
    if (seat.island && Sim.graphPath && Math.hypot(seat.x - p.x, seat.z - p.z) > 6) { const path = Sim.graphPath(p.x, p.z, seat.x, seat.z); G.autoPath = path.pts.map(([x, z]) => ({ x, z })); G.autoPath.push({ x: seat.x, z: seat.z }); G.target = G.autoPath.shift(); G.autoDest = null; }
    else { G.autoPath = null; G.target = { x: seat.x, z: seat.z }; }
    toast(`${it.icon} ${it.name}을(를) 들고 앉을 자리로 가요`);
    const t0 = Date.now(); let best = 1e9, lastGain = Date.now();
    walkT = setInterval(() => {
      const d = Math.hypot(seat.x - p.x, seat.z - p.z);
      if (d < best - 0.05) { best = d; lastGain = Date.now(); }
      const stuck = Date.now() - lastGain > 2000;   // 2초 넘게 못 다가가면 (가구에 막힘) 가까우면 앉고, 아니면 그 자리에서
      const gaveUp = (!G.target && d > 0.8) || (stuck && d > 2.5);   // 방향키로 멈췄거나 막힘 → 그 자리에서
      if (d < 0.8 || gaveUp || stuck || Date.now() - t0 > 25000) {
        clearInterval(walkT); walkT = null; p.carrying = false; G.target = null; G.autoPath = null;
        if (!gaveUp && d < 2.5) {
          if (seat.u && FM.Play && FM.Play.use) FM.Play.use(seat.u);
          else if (seat.sp) { p.x = seat.sp.x; p.z = seat.sp.z; if (seat.sp.face !== undefined) p.ry = seat.sp.face; p.sitting = true; p.pose = 'sit'; p.act = { id: 'P_sit', y: 0, seatH: seat.sp.tags.includes('cafe') ? 0.48 : 0.49 }; }
        }
        const onEnd = opt.onEnd;
        eat(k, Object.assign({}, opt, { onEnd: () => { if (p.sitting && FM.Play && FM.Play.stop) FM.Play.stop(true); if (onEnd) onEnd(); } }));
      }
    }, 150);
  }
  // 산 직후: 먹을 거면 앉아서 먹고(가방에서 1개 빠짐), 아니면 가방에 넣는 모션
  function afterBuy2(k) {
    if (isFood(k)) { const Soc = FM.Soc; if (Soc && Soc.takeItem) Soc.takeItem(k); eatSeated(k); }
    else bag(k);
  }
  FM.Consume = { eat: eatSeated, eatHere: eat, bag, afterBuy: afterBuy2, isFood, stop };
  document.addEventListener('keydown', e => { if (e.code === 'Escape' && timer && S() && S().player.eating) stop('그만 먹었어요'); }, true);
})();
