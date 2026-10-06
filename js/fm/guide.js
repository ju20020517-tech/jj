/* =========================================================
 *  길 안내 — 지도 이동(순간 이동 / 자동 길찾기), 목적지 표시(웨이포인트),
 *  퀘스트 단계별 안내 · 목적지 · 보상 · 남은 시간
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, D = FM.D, MAP = FM.MAP, Sim = FM.Sim;
  const Gd = (FM.Guide = {});
  const st = () => Sim.get();
  const G = () => FM.G;
  const nm = id => Sim.nameOf(id);
  const J = t => FM.josa(t);

  // 상점 키 → 장소
  const SHOP_PLACE = { mall: 'mall', conv: 'conv', cafe: 'cafe', pharmacy: 'medical', library: 'library', workshop: 'workshop', tea: 'teahouse', pocha: 'ferry', flea: 'workshop' };
  const SHOP_LABEL = { mall: '쇼핑몰(플래티넘 타워)', conv: '24시 편의점', cafe: '카페 앙상블', pharmacy: '메디컬 센터 약국', library: '도서관 북카페', workshop: '마을 공방', tea: '달빛 차관', pocha: '해풍 포장마차', flea: '플리마켓' };
  Gd.SHOP_PLACE = SHOP_PLACE;

  // 지도에 보여줄 장소 (지구별)
  Gd.places = function () {
    const out = {};
    for (const p of Object.values(MAP.P)) {
      if (p.plot && !st().villagers.some(v => v.home === p.interior)) continue;
      if (p.hidden && !(FM.Ug && FM.Ug.isOpen())) continue;
      if (!p.bld && !p.desc && !['playground', 'alley', 'cliff_lawn'].includes(p.id)) continue;
      (out[p.district] = out[p.district] || []).push(p);
    }
    return out;
  };
  Gd.shortName = p => p.name.replace(/\s*".*"\s*/g, ' ').replace(/\s*&.*$/, '').trim();

  // 장소 앞 (문 바깥쪽) 좌표
  Gd.placeFront = function (pid) {
    const p = MAP.P[pid]; if (!p) return null;
    if (p.door) {
      const d = Sim.placeDoor(pid);
      let dx = d.x - p.x, dz = d.z - p.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      for (const k of [1.8, 2.6, 3.5, 1.2]) { const x = d.x + dx * k, z = d.z + dz * k; if (FM.T.canWalk(x, z, x, z)) return { x, z, ry: Math.atan2(-dx, -dz) }; }
      return { x: d.x + dx * 1.8, z: d.z + dz * 1.8, ry: 0 };
    }
    if (p.hub && MAP.N[p.hub]) { const n = MAP.N[p.hub]; return { x: n[0], z: n[1], ry: 0 }; }
    return { x: p.x, z: p.z, ry: 0 };
  };

  // 주민이 지금 어디 있는지
  Gd.whereIs = function (v) {
    if (!v) return null;
    if (v.loc === 'island') return { x: v.x, z: v.z, label: MAP.DISTRICTS[FM.T.district(v.x, v.z)].short + ' 지구 야외', outdoor: true };
    if (v.loc === 'metro') { const s = MAP.STATIONS.C; return { x: s.x, z: s.z + 2, label: '지하철 안 (센트럴역에서 기다려 보세요)', place: 'metro' }; }
    const I = FM.INTERIORS[v.loc];
    if (!I) return null;
    const f = Gd.placeFront(I.place) || { x: 0, z: 0 };
    return { x: f.x, z: f.z, label: I.name, place: I.place, iid: v.loc, room: I.kind === 'room' };
  };

  // 목적지 → 좌표 {x,z,label,place?,villager?}
  function resolve(dest) {
    if (!dest) return null;
    if (dest.villager) {
      const v = Sim.byId(dest.villager); const w = Gd.whereIs(v); if (!w) return null;
      return Object.assign({}, w, { villager: v.id, name: v.name, label: `${v.name} (${w.label})` });
    }
    if (dest.place) { const f = Gd.placeFront(dest.place); if (!f) return null; return Object.assign({}, f, { place: dest.place, label: dest.label || Gd.shortName(MAP.P[dest.place]) }); }
    if (dest.x !== undefined) return Object.assign({ label: dest.label || '목적지' }, dest);
    return null;
  }
  Gd.resolve = resolve;

  function toIsland() {
    const g = G(); const p = st().player;
    if (g.view === 'observe') g.endObserve();
    if (FM.UI.editing) FM.UI.closeEditor();
    if (p.loc !== 'island') g.exitInterior();
  }

  // ✨ 순간 이동 (지도에서 바로 가기)
  Gd.teleport = function (dest, opts = {}) {
    const r = resolve(dest); if (!r) return FM.UI.toast('지금은 그곳으로 갈 수 없어요');
    const g = G(), s = st(), p = s.player;
    FM.UI.closeDialog && !document.querySelector('#dialog').hidden && FM.UI.closeDialog();
    g.fade(0.6);
    setTimeout(() => {
      toIsland();
      let x = r.x, z = r.z;
      if (r.villager && r.outdoor) {
        const v = Sim.byId(r.villager);
        const cand = [[1.6, 1.2], [-1.6, 1.2], [1.4, -1.4], [-1.4, -1.4], [0, 2], [2.2, 0]];
        const ok = cand.find(([dx, dz]) => FM.T.canWalk(v.x + dx, v.z + dz, v.x + dx, v.z + dz));
        if (ok) { x = v.x + ok[0]; z = v.z + ok[1]; }
        p.ry = Math.atan2(v.x - x, v.z - z);
      } else if (r.ry !== undefined) p.ry = r.ry;
      p.x = x; p.z = z; p.sitting = false; g.target = null; g.autoPath = null;
      FM.Soc.followers().forEach((f, i) => { f.loc = 'island'; f.x = x + (i % 2 ? -1 : 1) * (1 + (i >> 1) * 0.7); f.z = z + 0.8; f.route = null; f.followUse = null; });
      s.time += opts.free ? 0 : 3;   // 이동에 게임 시간 3분
      FM.Audio.sfx('pop');
      // 건물 안에 있는 주민에게 가는 경우: 들어갈 수 있는 곳이면 바로 들어감
      if (r.iid && !r.room && FM.INTERIORS[r.iid] && FM.INTERIORS[r.iid].kind !== 'room') {
        g.enterInterior(r.iid);
        const v = r.villager && Sim.byId(r.villager);
        if (v && v.loc === r.iid) { p.x = v.x + 1; p.z = v.z + 0.8; p.ry = Math.atan2(v.x - p.x, v.z - p.z); }
      } else if (r.iid && r.room) {
        FM.UI.toast(J(`🏠 ${nm(r.villager)}은(는) 집(${FM.INTERIORS[r.iid].name}) 안에 있어요. 🏢/🔭 관찰로 들여다볼 수 있어요`));
      } else if (opts.enter && r.place && MAP.P[r.place].interior && !MAP.P[r.place].plot) {
        g.enterInterior(MAP.P[r.place].interior);
      }
      FM.UI.toast(`✨ ${r.label}(으)로 이동했어요`);
      Gd.clearWaypointIfNear();
    }, 280);
  };

  // 🚶 자동 길찾기 (도로를 따라 걸어감)
  Gd.walkTo = function (dest) {
    const r = resolve(dest); if (!r) return FM.UI.toast('지금은 그곳으로 갈 수 없어요');
    const g = G(), p = st().player;
    const go = () => {
      const path = Sim.graphPath(p.x, p.z, r.x, r.z);
      g.autoPath = path.pts.map(([x, z]) => ({ x, z }));
      g.target = g.autoPath.shift();
      g.autoDest = r;
      p.sitting = false;
      Gd.setWaypoint(dest);
      FM.UI.toast(`🚶 ${r.label}까지 길을 따라 걸어가요 (방향키를 누르면 멈춰요)`);
    };
    if (p.loc !== 'island' || g.view === 'observe') { toIsland(); setTimeout(go, 60); } else go();
  };

  // 📍 웨이포인트 (화면 위 빛기둥 + 안내 화살표)
  Gd.setWaypoint = function (dest) { const s = st(); s.waypoint = dest ? Object.assign({}, dest) : null; FM.bus.emit('waypoint', s.waypoint); };
  Gd.waypointPos = function () { const s = st(); return s && s.waypoint ? resolve(s.waypoint) : null; };
  Gd.clearWaypointIfNear = function () {
    const s = st(), p = s.player; const w = Gd.waypointPos(); if (!w) return;
    if (p.loc === 'island' && Math.hypot(w.x - p.x, w.z - p.z) < 3.5 && !s.waypoint.quest) { s.waypoint = null; FM.bus.emit('waypoint', null); }
  };

  // =========================================================
  // 퀘스트 안내
  // =========================================================
  const has = k => !!(st().player.inv[k] > 0);
  const item = k => D.ITEMS[k] || { name: k, icon: '📦' };
  const shopOf = k => item(k).shop;
  const talk = (id, opt) => `${nm(id)}에게 말을 걸고 ${opt} 선택하기`;
  function buyStep(k) {
    const sh = shopOf(k);
    return { text: `${sh ? SHOP_LABEL[sh] + ' 직원에게 말 걸어 ' : ''}${item(k).icon} '${item(k).name}' 사기${item(k).price ? ` (${item(k).price}🪙)` : ''}`, done: has(k), dest: sh ? { place: SHOP_PLACE[sh] } : null };
  }

  // 단계 목록: [{text, done, dest}]
  Gd.questSteps = function (q) {
    const s = st(), S2 = [];
    const T = q.target, Gv = q.giver;
    switch (q.type) {
      case 'errand':
        if (q.giveItem) { S2.push({ text: `가방에 ${item(q.item).icon} '${item(q.item).name}' 받기`, done: has(q.item) }); S2.push({ text: talk(T, `'📦 ${item(q.item).name} 전달하기'`), dest: { villager: T } }); }
        else if (q.item) { S2.push(buyStep(q.item)); S2.push({ text: talk(T, `'📦 ${item(q.item).name} 전달하기'`), dest: { villager: T } }); }
        else S2.push({ text: talk(T, "'📦 전해줄 말'"), dest: { villager: T } });
        break;
      case 'apology': case 'reunion': {
        const got = has('apology_letter') || has('apology_gift');
        S2.push({ text: "편의점 💌 '사과 편지'(30🪙) 또는 쇼핑몰 🎁 '화해의 선물'(400🪙) 사기", done: got, dest: got ? null : { place: 'conv' } });
        S2.push({ text: `${nm(T)}에게 말을 걸고 '🎁 선물하기' → 사과 선물 고르기`, dest: { villager: T } });
        break;
      }
      case 'jealousy_gift':
        S2.push(buyStep('special_gift'));
        S2.push({ text: `${nm(Gv)}에게 말을 걸고 '🎁 선물하기' → 💝 특별한 선물 고르기`, dest: { villager: Gv } });
        break;
      case 'hospital_care':
        S2.push({ text: '메디컬 센터로 가기', done: st().player.loc === 'med_in', dest: { place: 'medical' } });
        S2.push({ text: talk(T, "'🍎 간병하기'"), dest: { villager: T } });
        break;
      case 'kid_fever':
        S2.push(buyStep('medicine_kid'));
        S2.push({ text: talk(T, "'💊 어린이용 약 먹이기'"), dest: { villager: T } });
        break;
      case 'kid_walk':
        S2.push({ text: `${talk(T, "'🚶 걸음마 연습하자!'")} (${q.steps || 0}/3번)`, dest: { villager: T } });
        break;
      case 'capsule': {
        const left = (q.until || 0) - Sim.time.day();
        S2.push({ text: left > 0 ? `${q.until}일차가 될 때까지 기다리기 (D-${left})` : '약속한 날이 됐어요!', done: left <= 0 });
        S2.push({ text: `${q.until}일차에 ${nm(T)}에게 말 걸기`, dest: left <= 0 ? { villager: T } : null });
        break;
      }
      case 'report_letter':
        S2.push({ text: talk(T, "'📖 쪽지 제보'"), dest: { villager: T } });
        break;
      case 'wedding_prep': {
        const m = s.marriages.find(x => x.marriage_id === q.marriage) || { prep: {} };
        const pr = m.prep || {};
        S2.push({ text: `대성당 앞 쓰레기 줍기 (${pr.clean || 0}/3) — 반짝이는 쓰레기 옆에서 E`, done: (pr.clean || 0) >= 3, dest: { place: 'cathedral' } });
        S2.push({ text: `주민에게 청첩장 주기 (${(pr.invite || []).length}/5) — 말 걸고 '✉️ 청첩장 전달하기'`, done: (pr.invite || []).length >= 5 });
        S2.push({ text: `버진로드 꽃 장식 (${pr.decorate || 0}/3) — 💮 식장 장식 꽃을 들고 장식 자리에서 E`, done: (pr.decorate || 0) >= 3, dest: { place: 'cathedral' } });
        break;
      }
      case 'secret_keep': {
        const left = (q.until || 0) - Sim.time.day();
        S2.push({ text: `비밀을 아무에게도 말하지 않고 ${Math.max(0, left)}일 더 기다리기 (자동 진행)`, done: left <= 0 });
        break;
      }
      case 'invite_confess':
        S2.push({ text: talk(T, `'📣 ${q.hm}에 ${q.spotName}(으)로 나와봐!'`), dest: { villager: T } });
        S2.push({ text: `${q.hm}에 ${q.spotName}에서 고백을 지켜보기` });
        break;
      case 'taste':
        S2.push({ text: `${nm(Gv)}이(가) 하루 동안 알아서 조사해요. 기다리기만 하면 돼요! (자동 진행)` });
        break;
      case 'secret_letter': {
        const t = Sim.byId(T); const home = t && FM.INTERIORS[t.home];
        S2.push({ text: `${nm(T)}의 집(${home ? home.name : '?'}) 현관 편지함 앞에서 E — 몰래 넣기`, done: q.stage !== 'deliver', dest: home ? { place: home.place, label: `${nm(T)}의 편지함` } : null });
        S2.push({ text: '다음 날까지 기다리기', done: q.stage === 'check' });
        S2.push({ text: talk(T, "'💌 어제 편지 받았어?'"), dest: q.stage === 'check' ? { villager: T } : null });
        break;
      }
      case 'jealousy_investigate':
        S2.push({ text: talk(T, `'🔍 ${nm(q.partner)}와(과) 무슨 사이야?'`), dest: { villager: T } });
        break;
      case 'jealousy_warn':
        S2.push({ text: talk(T, `'✋ ${nm(q.partner)} 건드리지 마!'`), dest: { villager: T } });
        break;
      default:
        if (T) S2.push({ text: `${nm(T)}에게 가서 말 걸기`, dest: { villager: T } });
    }
    S2.forEach(x => { x.text = J(x.text); });
    return S2;
  };
  // 다음에 가야 할 곳
  Gd.questDest = function (q) {
    const steps = Gd.questSteps(q);
    const next = steps.find(x => !x.done && x.dest) || steps.find(x => x.dest && !x.done);
    return next ? next.dest : null;
  };
  Gd.nextStep = function (q) { const steps = Gd.questSteps(q); return steps.find(x => !x.done) || steps[steps.length - 1]; };
  // 남은 시간
  Gd.timeLeft = function (q) {
    const s = st();
    if (q.deadline) { const m = q.deadline - s.time; if (m <= 0) return '⏰ 시간 초과'; const h = Math.floor(m / 60); return `⏰ ${h ? h + '시간 ' : ''}${Math.floor(m % 60)}분 남음`; }
    if (q.until) { const d = q.until - Sim.time.day(); return d > 0 ? `📅 ${d}일 남음` : '📅 오늘!'; }
    return '';
  };
  Gd.reward = function (q) {
    const R = {
      errand: `🪙 ${q.reward || 100} + 신뢰도 크게 상승`, apology: '두 주민 화해 · 신뢰도 +20', reunion: '두 사람이 다시 만날 기회', jealousy_gift: '연인 사이 회복',
      hospital_care: '빠른 퇴원 · 친밀도 상승', kid_fever: '아이 회복 · 애착도 상승', kid_walk: '애착도 +10 · 육아 만족도 상승', capsule: '추억의 선물 · 영원한 우정',
      report_letter: '두 주민의 인연', wedding_prep: '결혼식 성공 · 친밀도 상승', secret_keep: '영구 절친 상태', invite_confess: '고백 성공 확률 상승', taste: '취향 정보(선물 성공률 상승)',
      secret_letter: '짝사랑 진전', jealousy_investigate: '오해 해소', jealousy_warn: '연인의 신뢰',
    };
    return R[q.type] || '친밀도 상승';
  };
  Gd.giverName = q => (q.giver ? nm(q.giver) : '');

  // 퀘스트 핀 (화면 추적)
  Gd.pinned = function () {
    const s = st(); const act = s.quests.filter(q => q.state === 'active');
    if (!act.length) return null;
    return act.find(q => q.id === s.pinQuest) || act[act.length - 1];
  };
  Gd.pin = function (q) { st().pinQuest = q.id; FM.bus.emit('quest', q); };
})();
