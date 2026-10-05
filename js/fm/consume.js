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
    if (isFood(k)) { const Soc = FM.Soc; if (Soc && Soc.takeItem) Soc.takeItem(k); eat(k); }
    else bag(k);
  }
  FM.Consume = { eat, bag, afterBuy, isFood, stop };
  document.addEventListener('keydown', e => { if (e.code === 'Escape' && timer && S() && S().player.eating) stop('그만 먹었어요'); }, true);
})();
