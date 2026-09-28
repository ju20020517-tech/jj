/* =========================================================
 *  플레이어의 가구 · 놀이 시설 상호작용
 *   - 집/주민 방/가게 안의 모든 가구: 앉기, 눕기, 요리, TV, 노래방, 운동 ...
 *   - 놀이 센터(네온 스파크): 오락기, 인형뽑기, 볼링, 펌프 — 타이밍 미니게임
 *   - 마을 놀이터: 미끄럼틀, 그네
 *   - 같은 방의 주민들이 구경하며 반응함
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, D = FM.D, Sim = FM.Sim;
  const Play = (FM.Play = {});
  const st = () => Sim.get();
  const UI = () => FM.UI;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[(Math.random() * a.length) | 0];

  // 행동(act) → 버튼 문구
  const VERB = {
    sleep: '🛏️ 눕기 / 낮잠', sofa: '🛋️ 앉기', sit: '🪑 앉기', cook: '🍳 요리하기', eat: '🍽️ 먹기', watch_tv: '📺 TV 보기', karaoke: '🎤 노래 부르기', open_mic: '🎤 무대에서 노래하기',
    treadmill: '🏃 달리기', lift: '🏋️ 운동하기', sandbag: '🥊 샌드백 치기', trampoline: '🤸 트램펄린 뛰기', mirror: '🪞 거울 보기', arcade: '🕹️ 게임하기', claw: '🧸 인형뽑기 (50🪙)',
    bowl: '🎳 볼링 치기', pump: '💃 펌프 댄스', club_dance: '🪩 춤추기', listen_radio: '📻 음악 듣기', fortune: '🔮 운세 보기', read_book: '📖 책 읽기', water_plant: '🪴 물 주기',
    massage: '💆 안마 받기', star_name: '🔭 별 보기', piano: '🎹 피아노 치기', fish_watch: '🐠 물고기 구경', stare_photo: '🖼️ 사진 보기',
  };
  const verbOf = (u, F) => VERB[u.u.act] || (u.u.pose === 'sit' ? '🪑 앉기' : u.u.pose === 'sleep' ? '🛏️ 눕기' : `✋ 사용하기`);

  // 주변에서 쓸 수 있는 가구
  Play.options = function (add) {
    const p = st().player;
    if (p.loc === 'island') {
      const pg = FM.MAP.P.playground;
      if (pg && Math.hypot(pg.x - p.x, pg.z - p.z) < 7) {
        add(2.1, '🛝 미끄럼틀 타기', () => Play.outdoor('slide'));
        add(2.2, '🎠 그네 타기', () => Play.outdoor('swing'));
        add(2.3, '⚖️ 시소 타기', () => Play.outdoor('seesaw'));
        add(2.4, '🏖️ 모래성 쌓기', () => Play.outdoor('sand'));
      }
      return;
    }
    const uses = Sim.furnUses(p.loc);
    const seen = new Set(), seenLabel = new Set();
    uses.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
    for (const u of uses) {
      const d = Math.hypot(u.x - p.x, u.z - p.z);
      if (d > 1.7) continue;
      const k = u.idx + ':' + u.u.act;
      if (seen.has(k)) continue; seen.add(k);
      const occ = Sim.useOcc[u.key];
      if (occ === 'P') continue;   // 지금 내가 쓰는 중
      const who = occ && Sim.byId(occ);
      const label = `${verbOf(u, u.F)} · ${u.F.name}${who ? ` (${who.name} 사용 중)` : ''}`;
      if (seenLabel.has(label)) continue; seenLabel.add(label);
      add(d + 0.3, label, () => Play.use(u));
    }
  };

  // 가구 사용 시작
  Play.use = function (u) {
    const s = st(), p = s.player;
    const occ = Sim.useOcc[u.key];
    if (occ && occ !== 'P') {
      const alt = Sim.furnUses(p.loc).find(o => o.idx === u.idx && !Sim.useOcc[o.key]);
      if (alt) u = alt; else if (u.u.pose !== 'sit' && u.u.pose !== 'sleep') return UI().toast(`${Sim.nameOf(occ)}이(가) 쓰고 있어요. 조금 기다려요!`);
    }
    Play.stop(true);
    p.x = u.x; p.z = u.z; p.ry = u.ry;
    p.sitting = true; p.pose = u.u.pose || 'stand'; p.prop = u.u.prop || null;
    p.act = { id: 'P_' + (u.u.act || 'use'), y: u.u.y || 0 };
    p.useKey = u.key; Sim.useOcc[u.key] = 'P';
    p.using = { act: u.u.act, type: u.F.id, iid: u.iid, t: 0 };
    effect(u);
  };
  // 일어나기
  Play.stop = function (silent) {
    const p = st().player;
    if (p.useKey && Sim.useOcc[p.useKey] === 'P') delete Sim.useOcc[p.useKey];
    p.useKey = null; p.using = null; p.act = null; p.prop = null;
    if (p.sitting) { p.sitting = false; p.pose = null; }
  };

  // 같은 방 주민들의 반응
  function audience(emote, friend, line) {
    const p = st().player;
    for (const v of st().villagers) {
      if (v.loc !== p.loc || v.sceneId || v.talkingToPlayer || Math.hypot(v.x - p.x, v.z - p.z) > 8) continue;
      Sim.emote(v, emote);
      if (friend) FM.Soc.addFriend(v.id, 'P', friend, 0, '함께 놀기');
      if (line && Math.random() < 0.5) Sim.say(v, FM.L.sty(v, line));
      if (!v.route && !v.act && Math.random() < 0.4) v.ry = Math.atan2(p.x - v.x, p.z - v.z);
    }
  }
  const toast = t => UI().toast(FM.josa(t));
  const sfx = k => FM.Audio.sfx(k);

  // 가구별 효과
  function effect(u) {
    const s = st(), p = s.player, a = u.u.act, room = s.rooms[p.loc];
    switch (a) {
      case 'sleep':
        toast('😴 포근하다… (E: 일어나기)');
        setTimeout(() => { if (p.using && p.using.act === 'sleep') { G().fade(0.8); s.time += 60; p.stamina = 100; toast('☀️ 한숨 푹 잤어요! 스태미나 100 · 1시간 지남'); } }, 2500);
        break;
      case 'sofa': case 'sit': p.stamina = Math.min(100, p.stamina + 15); toast('🛋️ 편안하게 앉았어요 (스태미나 +15)'); break;
      case 'cook': case 'eat': {
        const dish = pick(['김치볶음밥', '크림 파스타', '팬케이크', '떡볶이', '오므라이스', '된장찌개']);
        sfx('bubbles'); p.stamina = Math.min(100, p.stamina + 40);
        toast(`🍳 ${dish}을(를) 만들었어요! 스태미나 +40`);
        audience('😋', 1, '냄새 좋다~ 나도 한 입만!');
        break;
      }
      case 'watch_tv': {
        const nb = s.newsBoard && s.newsBoard.items && s.newsBoard.items.length ? pick(s.newsBoard.items) : pick(['오늘의 날씨: 맑음, 곳곳에 설렘 주의보', '요리 경연: 초밥 vs 탕수육', '드라마 "섬마을 로맨스" 12화']);
        toast(`📺 ${nb}`); audience('📺', 0);
        break;
      }
      case 'karaoke': case 'open_mic': {
        sfx('score'); if (room) room.disco = s.realT + 20;
        miniGame({ title: '🎤 노래방 — 박자 맞추기', icon: '🎵', speed: 1.3, onEnd: sc => { toast(`🎤 노래 점수 ${sc}점! ${sc >= 90 ? '앵콜! 앵콜!' : sc >= 60 ? '박수 짝짝짝' : '...음정이 살짝'}`); audience(sc >= 60 ? '👏' : '😅', sc >= 60 ? 2 : 0, sc >= 60 ? '와 노래 진짜 잘한다!' : '...괜찮아, 즐거웠어!'); } });
        break;
      }
      case 'treadmill': case 'lift': case 'sandbag': case 'trampoline':
        p.stamina = Math.max(0, p.stamina - 10); p.fitness = (p.fitness || 0) + 1;
        toast(`💪 운동 완료! 체력 단련 ${p.fitness}회 (스태미나 -10)`); audience('💪', 1, '오 운동 열심히 하네!');
        break;
      case 'mirror': toast(pick(['🪞 오늘도 빛나는 얼굴!', '🪞 머리가 조금 뻗쳤다…', '🪞 거울아 거울아, 섬에서 누가 제일 멋지니?'])); break;
      case 'arcade':
        miniGame({ title: '🕹️ 네온 스파크 — 우주 슈팅', icon: '🚀', speed: 1.6, onEnd: sc => { const pts = sc * 137; p.arcadeBest = Math.max(p.arcadeBest || 0, pts); toast(`🕹️ ${pts.toLocaleString()}점! (최고 기록 ${p.arcadeBest.toLocaleString()})`); if (sc >= 90) { p.coins += 30; toast('🏆 하이스코어 보너스 +30🪙'); } audience(sc >= 70 ? '😲' : '😆', 1, sc >= 70 ? '와 고수다!' : '나도 해볼래!'); } });
        break;
      case 'claw':
        if (p.coins < 50) { toast('🪙 코인이 부족해요 (50🪙)'); Play.stop(); return; }
        p.coins -= 50;
        miniGame({ title: '🧸 인형뽑기 — 집게를 딱 맞춰서!', icon: '🦾', speed: 1.9, zone: 12, onEnd: sc => { if (sc >= 80) { const prize = pick(['claw_plush', 'claw_plush', 'claw_plush_rare']); FM.Soc.giveItem(prize); sfx('score'); toast(`🎉 ${D.ITEMS[prize].icon} ${D.ITEMS[prize].name}을(를) 뽑았어요! 가방에 넣었어요`); audience('🎉', 1, '대박! 뽑았다!'); } else { toast('😢 아깝다! 집게가 미끄러졌어요'); audience('😅', 0); } } });
        break;
      case 'bowl':
        miniGame({ title: '🎳 볼링 — 가운데로 굴려요!', icon: '🎳', speed: 1.4, onEnd: sc => { const pins = sc >= 92 ? 10 : Math.round(sc / 11); sfx('thud'); toast(pins === 10 ? '🎳 스트라이크!!! 🎉' : `🎳 핀 ${pins}개를 쓰러뜨렸어요`); audience(pins === 10 ? '🙌' : '👍', pins >= 7 ? 1 : 0, pins === 10 ? '스트라이크!!' : null); } });
        break;
      case 'pump': case 'club_dance':
        miniGame({ title: '💃 펌프 댄스 — 화살표 박자!', icon: '⬆️', speed: 1.7, onEnd: sc => { toast(`💃 ${sc >= 90 ? 'PERFECT' : sc >= 70 ? 'GREAT' : sc >= 40 ? 'GOOD' : 'MISS'} (${sc}점)`); audience('🕺', sc >= 60 ? 2 : 1, '같이 추자~!'); } });
        break;
      case 'listen_radio': sfx('ui'); if (room) { const order = ['lofi', 'chip', 'healing', 'opera', 'none']; room.bgm = order[(order.indexOf(room.bgm) + 1) % order.length]; toast(`📻 방 음악: ${D.ROOM_BGM[room.bgm] || room.bgm}`); } else toast('📻 흥겨운 노래가 흘러나와요'); break;
      case 'fortune': toast(pick(['🔮 오늘은 뜻밖의 고백을 받을 운세!', '🔮 동쪽에서 귀인이… 아마 편의점 알바생?', '🔮 행운의 색은 분홍, 행운의 음식은 탕수육', '🔮 곧 누군가 당신의 이름을 부를 거예요'])); break;
      case 'read_book': toast(pick(['📖 "사랑은 타이밍이다" — 섬 철학 개론 3장', '📖 "초보도 뽑는 인형뽑기 비법" 을 읽었다', '📖 시집 한 편을 소리 내어 읽었다', '📖 "고양이는 왜 상자를 좋아할까"'])); break;
      case 'water_plant': toast('🪴 물을 주었더니 잎이 반짝여요'); break;
      case 'massage': p.stamina = 100; toast('💆 시원하다~ 스태미나 100'); break;
      case 'star_name': toast('🔭 별 하나에 이름을 붙였어요: "' + st().player.name + '의 별"'); break;
      default:
        if (u.F.id === 'grand_piano') { sfx('bell'); toast('🎹 아름다운 선율이 울려 퍼져요'); audience('🎶', 1); }
        else if (u.F.id === 'fish_tank') toast('🐠 물고기들이 반갑게 헤엄쳐요');
        else toast(`${u.F.name}을(를) 사용해요 (E: 그만하기)`);
    }
    FM.bus.emit('playerUse', { act: a, type: u.F.id });
  }
  const G = () => FM.G;

  // 야외 놀이터
  Play.outdoor = function (kind) {
    const p = st().player, pg = FM.MAP.P.playground;
    Play.stop(true);
    const at = (dx, dz, ry) => { p.x = pg.x + dx; p.z = pg.z + dz; p.ry = ry; };
    if (kind === 'slide') { at(-2, 1.2, Math.PI); p.pose = 'slide'; p.sitting = true; sfx('pop'); toast('🛝 슈우웅~!'); setTimeout(() => { if (p.pose === 'slide') { Play.stop(); p.z += 1.5; } }, 2200); }
    else if (kind === 'swing') { at(0, -3.2, 0); p.pose = 'swingSit'; p.act = { id: 'P_swing', y: 0.35 }; p.sitting = true; toast('🎠 그네를 타요~ (E/방향키: 내리기)'); }
    else if (kind === 'seesaw') { at(3.2, 0, -Math.PI / 2); p.pose = 'seesaw'; p.act = { id: 'P_seesaw', y: 0.25 }; p.sitting = true; toast('⚖️ 쿵덕쿵덕~ 시소를 타요'); const kid = st().villagers.find(v => v.loc === 'island' && Math.hypot(v.x - p.x, v.z - p.z) < 12 && !v.sceneId && !v.talkingToPlayer); if (kid) { Sim.say(kid, FM.L.sty(kid, '나도 탈래! 반대편에 앉을게')); Sim.emote(kid, '😆'); } }
    else { at(0, 3, 0); p.pose = 'crouch'; p.sitting = true; toast('🏖️ 모래성을 쌓고 있어요… 🏰'); setTimeout(() => { if (p.pose === 'crouch') toast('🏰 멋진 모래성 완성!'); }, 3000); }
    for (const v of st().villagers) if (v.loc === 'island' && v.child && Math.hypot(v.x - p.x, v.z - p.z) < 10) { Sim.emote(v, '😆'); FM.Soc.addFriend(v.id, 'P', 1, 1, '놀이터'); }
  };

  // 타이밍 미니게임 (막대가 움직이는 동안 Space/클릭으로 멈추기)
  function miniGame({ title, icon, speed = 1.5, zone = 16, onEnd }) {
    const m = document.querySelector('#modal');
    m.innerHTML = `<div class="md mg"><div class="md-head"><b>${title}</b></div><div class="md-body">
      <p class="muted">막대가 <b>가운데 반짝이는 칸</b>에 올 때 <b>Space</b> 또는 화면을 눌러요! (3번)</p>
      <div class="mg-bar"><i class="mg-zone" style="width:${zone}%;left:${50 - zone / 2}%"></i><b class="mg-cur">${icon}</b></div>
      <div class="mg-score">🎯 <span id="mgS">0</span>점 · 남은 기회 <span id="mgN">3</span></div></div></div>`;
    m.hidden = false;
    let t = 0, n = 3, total = 0, running = true, last = performance.now();
    const cur = m.querySelector('.mg-cur');
    const hitNow = () => {
      if (!running) return;
      const pos = (Math.sin(t) + 1) / 2 * 100;
      const dist = Math.abs(pos - 50);
      const sc = Math.max(0, Math.round(100 - Math.max(0, dist - zone / 2) * 3.2));
      total += sc; n--;
      FM.Audio.sfx(sc >= 80 ? 'score' : 'pop');
      m.querySelector('#mgS').textContent = Math.round(total / (3 - n));
      m.querySelector('#mgN').textContent = n;
      cur.classList.remove('hit'); void cur.offsetWidth; cur.classList.add('hit');
      if (n <= 0) { running = false; setTimeout(() => { m.hidden = true; document.removeEventListener('keydown', key, true); onEnd(Math.round(total / 3)); }, 450); }
    };
    const key = e => {
      if (m.hidden) { running = false; document.removeEventListener('keydown', key, true); return; }
      if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') { e.preventDefault(); e.stopPropagation(); hitNow(); }
    };
    document.addEventListener('keydown', key, true);
    m.querySelector('.mg-bar').onclick = hitNow;
    m.onclick = e => { if (e.target === m) hitNow(); };
    const loop = now => { if (!running) return; t += (now - last) / 1000 * speed * 3; last = now; cur.style.left = ((Math.sin(t) + 1) / 2 * 100) + '%'; requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  Play.miniGame = miniGame;
})();
