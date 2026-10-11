/* =========================================================
 *  📔 다이어리 앱 (폰) — 플레이어가 "오늘 뭐 하지?"를 바로 알 수 있게
 *   ✅ 오늘의 할 일: 매일 3개 · 하나당 코인 보상 · 다 하면 보너스
 *   📅 섬 달력: 앞으로 14일 동안의 주민 생일 · 낚시 대회 · 플리마켓 · 유성우 · 아이 성장일
 *   🏅 업적: 섬 생활 기록 36개 (달성하면 코인 + 알림)
 *   ⚙️ 설정에 "드라마 빈도" (적게 · 보통 · 많이) 추가
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, UI = FM.UI, MAP = FM.MAP, D = FM.D;
  if (!Sim || !UI) return;
  const P = 'P';
  const S = () => Sim.get();
  const day = () => Sim.time.day();
  const pick = a => a[(Math.random() * a.length) | 0];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = t => FM.bus.emit('toast', FM.josa ? FM.josa(t) : t);
  const Di = (FM.Diary = {});
  const stats = () => { const st = S(); return st.stats || (st.stats = {}); };
  const bump = (k, n = 1) => { const s = stats(); s[k] = (s[k] || 0) + n; goalHit(k); checkAch(); };
  Di.bump = bump;

  // =========================================================
  // ✅ 오늘의 할 일
  // =========================================================
  const PLACES = ['lighthouse', 'beach', 'observatory', 'park', 'cafe', 'library', 'onsen', 'farm', 'matsuri', 'busk', 'cliff', 'fishpier', 'photo', 'teahouse'];
  const POOL = [
    { k: 'talkPeople', label: n => `주민 ${n}명과 이야기하기`, n: [3, 4, 5], pay: 250 },
    { k: 'praise', label: () => '주민 한 명 칭찬하기', n: [1], pay: 200 },
    { k: 'gift', label: () => '주민에게 선물하기', n: [1], pay: 300 },
    { k: 'rumor', label: n => `새 소문 ${n}개 듣기`, n: [1, 2], pay: 250 },
    { k: 'rumorCheck', label: () => '소문의 진실 확인하기', n: [1], pay: 300, need: () => (S().rumors || []).some(r => !r.sure && !r.debunked) },
    { k: 'drama', label: n => `섬 드라마 ${n}편 보기`, n: [1, 2], pay: 250 },
    { k: 'visit', label: (n, g) => `${MAP.P[g.place] ? FM.Guide && FM.Guide.shortName ? FM.Guide.shortName(MAP.P[g.place]) : MAP.P[g.place].name : ''} 가 보기`, n: [1], pay: 250 },
    { k: 'baby', label: n => `우리 아이 ${n}번 돌보기`, n: [2, 3], pay: 350, need: () => S().villagers.some(v => v.child && v.child.parents.includes(P)) },
    { k: 'wish', label: () => '해안 동굴 소원 웅덩이에 소원 빌기', n: [1], pay: 300, need: () => !!(S().found && S().found.cave) },
    { k: 'mediate', label: () => '주민 둘 사이 이어 주기 (중재 · 소문 전하기)', n: [1], pay: 350 },
  ];
  function daily() {
    const st = S(); if (!st) return null;
    if (st.daily && st.daily.day === day()) return st.daily;
    const pool = POOL.filter(g => !g.need || g.need()).sort(() => Math.random() - 0.5).slice(0, 3);
    st.daily = { day: day(), bonus: false, goals: pool.map(g => { const n = pick(g.n); const o = { k: g.k, n, got: 0, pay: g.pay + (n - 1) * 80, done: false }; if (g.k === 'visit') o.place = pick(PLACES.filter(id => MAP.P[id] && !MAP.isHidden(MAP.P[id]))); return o; }) };
    st.daily.talked = {};
    return st.daily;
  }
  const labelOf = g => { const t = POOL.find(x => x.k === g.k); return t ? t.label(g.n, g) : g.k; };
  function goalHit(k, inc = 1) {
    const d = daily(); if (!d) return;
    for (const g of d.goals) if (g.k === k && !g.done) {
      g.got = Math.min(g.n, g.got + inc);
      if (g.got >= g.n) { g.done = true; S().player.coins += g.pay; toast(`✅ 오늘의 할 일 완료: ${labelOf(g)} (🪙 +${g.pay})`); FM.Audio && FM.Audio.sfx && FM.Audio.sfx('coin'); bump('goalsDone'); }
    }
    if (!d.bonus && d.goals.every(g => g.done)) { d.bonus = true; S().player.coins += 600; toast('🎉 오늘의 할 일을 모두 끝냈어요! 보너스 🪙 +600'); bump('perfectDays'); }
    badge();
  }
  Di.daily = daily;

  // 진행 훅
  if (UI.talk) { const oTalk = UI.talk; UI.talk = function (v) { const r = oTalk.apply(this, arguments); try { if (v && !v.staff) { const d = daily(); if (d && !d.talked[v.id]) { d.talked[v.id] = 1; goalHit('talkPeople'); bump('talks'); } } } catch (e) { /* */ } return r; }; }
  const oChoose = Soc.playerChoose;
  Soc.playerChoose = function (v, id, arg) {
    const r = oChoose.apply(this, arguments);
    try {
      if (id === 'praise') { goalHit('praise'); bump('praises'); }
      if (id === 'gift' && arg) { goalHit('gift'); bump('gifts'); }
      if (id === 'rumorCheck') { goalHit('rumorCheck'); bump('rumorChecks'); }
      if (id === 'rumorTell') { goalHit('mediate'); bump('rumorTells'); }
      if (typeof id === 'string' && id.startsWith('baby:')) { goalHit('baby'); bump('babyCare'); }
      if (id === 'indDo' && arg) { goalHit('mediate'); bump('mediates'); }
    } catch (e) { /* */ }
    return r;
  };
  FM.bus.on('rumor', () => { goalHit('rumor'); bump('rumors'); });
  FM.bus.on('wish', () => { goalHit('wish'); bump('wishes'); });
  FM.bus.on('found', k => bump('found_' + k));
  FM.bus.on('ugOpen', () => bump('found_ug'));
  const Cut = FM.Cut;
  FM.bus.on('cutPlay', c => { try { if (c) { goalHit('drama'); bump('dramas'); if (c.theme === 'baby') bump('babyDramas'); } } catch (e) { /* */ } });
  // 장소 방문 · 매일 갱신
  setInterval(() => {
    try {
      const st = S(); if (!st || !st.player) return; const d = daily(); if (!d) return;
      const p = st.player;
      for (const g of d.goals) if (g.k === 'visit' && !g.done && g.place) {
        const pl = MAP.P[g.place]; if (!pl) continue;
        const inside = pl.interior && p.loc === pl.interior;
        if (inside || (p.loc === 'island' && Math.hypot(p.x - pl.x, p.z - pl.z) < (pl.r || 12) + 4)) goalHit('visit');
      }
      const s = stats(); const v = st.visited || (st.visited = {});
      for (const pl of Object.values(MAP.P)) if (!v[pl.id] && ((pl.interior && p.loc === pl.interior) || (p.loc === 'island' && Math.hypot(p.x - pl.x, p.z - pl.z) < (pl.r || 10)))) { v[pl.id] = day(); s.placesVisited = Object.keys(v).length; checkAch(); }
    } catch (e) { /* */ }
  }, 1500);
  FM.bus.on('day', () => { daily(); badge(); });

  // =========================================================
  // 🏅 업적
  // =========================================================
  const vs = () => S().villagers.filter(v => !v.child && !v.staff && !v.visitor);
  const fp = v => Soc.rel(v.id, P).friendship_point || 0;
  const stg = (v, s) => Soc.stageAtLeast && Soc.stageAtLeast(v.id, P, s);
  const kids = () => S().villagers.filter(v => (v.child && v.child.parents.includes(P)) || (v.grownUp && v.grownUp.parents.includes(P)));
  const sv = k => stats()[k] || 0;
  const ACH = [
    ['hello', '👋 첫인사', '주민 1명과 이야기하기', () => sv('talks') >= 1, 100],
    ['social10', '💬 수다쟁이', '주민 10명과 이야기하기', () => vs().filter(v => fp(v) > 5).length >= 10, 300],
    ['social30', '🏝️ 섬의 인싸', '주민 30명과 친해지기 (♥1 이상)', () => vs().filter(v => fp(v) >= 20).length >= 30, 1500],
    ['friend1', '🤝 첫 친구', '친구 사이 1명', () => vs().some(v => stg(v, 'FRIEND')), 200],
    ['friend10', '👫 친구 부자', '친구 사이 10명', () => vs().filter(v => stg(v, 'FRIEND')).length >= 10, 800],
    ['bestie', '👯 평생 친구', '절친 1명', () => vs().some(v => stg(v, 'BEST_FRIEND')), 500],
    ['bestie5', '💞 절친 군단', '절친 5명', () => vs().filter(v => stg(v, 'BEST_FRIEND')).length >= 5, 1500],
    ['lover', '💘 연애 시작', '연인이 생겼어요', () => !!(Soc.partnerOf && vs().some(v => Soc.partnerOf(v.id) === P)), 800],
    ['married', '💍 결혼', '결혼하기', () => !!S().player.spouse, 2000],
    ['parent', '👶 부모가 되다', '아이가 태어났어요', () => kids().length >= 1, 1500],
    ['parent3', '👨‍👩‍👧 대가족', '아이 3명', () => kids().length >= 3, 3000],
    ['indep', '🎓 독립 축하', '아이가 어른이 되어 독립', () => kids().some(v => v.grownUp), 2000],
    ['firstword', '🗣️ "엄마? 아빠?"', '아이의 첫 마디 듣기', () => kids().some(v => v.child && v.child.firstWord), 500],
    ['gift10', '🎁 산타클로스', '선물 10번', () => sv('gifts') >= 10, 600],
    ['praise10', '👏 칭찬 요정', '칭찬 10번', () => sv('praises') >= 10, 400],
    ['rumor10', '🗞️ 소문 수집가', '소문 10개 듣기', () => (S().rumors || []).length >= 10, 400],
    ['rumor30', '🕵️ 섬의 정보통', '소문 30개 듣기', () => (S().rumors || []).length >= 30, 1000],
    ['debunk', '🔍 팩트 체커', '헛소문 밝혀내기', () => (S().rumors || []).some(r => r.debunked), 500],
    ['spread5', '📣 소문의 다리', '소문 전하기 5번', () => sv('rumorTells') >= 5, 400],
    ['drama1', '🎬 첫 드라마', '섬 드라마 1편 보기', () => sv('dramas') >= 1, 100],
    ['drama20', '📺 드라마 마니아', '섬 드라마 20편 보기', () => sv('dramas') >= 20, 800],
    ['drama50', '🍿 드라마 평론가', '섬 드라마 50편 보기', () => sv('dramas') >= 50, 2000],
    ['babyd5', '🍼 육아 일기', '아기 성장 드라마 5편', () => sv('babyDramas') >= 5, 800],
    ['explore10', '🗺️ 탐험가', '장소 10곳 가 보기', () => sv('placesVisited') >= 10, 400],
    ['explore30', '🧭 섬 박사', '장소 30곳 가 보기', () => sv('placesVisited') >= 30, 1500],
    ['lighthouse', '🗼 바람의 곶', '하얀 등대 가 보기', () => !!(S().visited && S().visited.lighthouse), 300],
    ['cave', '🌊 썰물의 비밀', '숨겨진 해안 동굴 발견', () => !!(S().found && S().found.cave), 1000],
    ['wish7', '💧 소원 부자', '소원 웅덩이에 7번 소원 빌기', () => sv('wishes') >= 7, 1000],
    ['ug', '🕳️ 지하의 비밀', '숨겨진 지하 아파트 발견', () => !!(FM.Ug && FM.Ug.isOpen()), 800],
    ['twins', '👯 쌍둥이 친구', '모모와 도도 둘 다 친구 되기', () => { const t = vs().filter(v => v.twin); return t.length >= 2 && t.every(v => stg(v, 'FRIEND')); }, 600],
    ['goals10', '✅ 성실한 하루', '오늘의 할 일 10개 완료', () => sv('goalsDone') >= 10, 500],
    ['perfect5', '🌟 완벽한 일주일', '할 일 전부 끝낸 날 5일', () => sv('perfectDays') >= 5, 1500],
    ['rich', '🪙 부자', '코인 30,000 모으기', () => S().player.coins >= 30000, 1000],
    ['day7', '📅 일주일 차', '섬에서 7일 살기', () => day() >= 7, 300],
    ['day30', '🏡 섬 주민', '섬에서 30일 살기', () => day() >= 30, 2000],
    ['caretaker', '🤱 육아 달인', '아이 돌보기 30번', () => sv('babyCare') >= 30, 1000],
  ];
  Di.ACH = ACH;
  let checking = false;
  function checkAch() {
    if (checking) return; checking = true;
    try {
      const st = S(); if (!st) return;
      const got = st.ach || (st.ach = {});
      const fresh = [];
      for (const [id, name, , cond, pay] of ACH) {
        if (got[id]) continue;
        let ok = false; try { ok = cond(); } catch (e) { ok = false; }
        if (ok) { got[id] = day(); st.player.coins += pay; fresh.push([name, pay]); }
      }
      // 한꺼번에 여러 개면 알림 하나로 묶음 (예전 저장 파일을 처음 불러올 때)
      if (fresh.length > 2) toast(`🏅 업적 ${fresh.length}개 달성! ${fresh.slice(0, 3).map(f => f[0]).join(' · ')}… (🪙 +${fresh.reduce((a, f) => a + f[1], 0)})`);
      else for (const [name, pay] of fresh) toast(`🏅 업적 달성! ${name} (🪙 +${pay})`);
      if (fresh.length && FM.Audio && FM.Audio.sfx) FM.Audio.sfx('chime');
    } finally { checking = false; }
  }
  Di.checkAch = checkAch;
  FM.bus.on('hour', checkAch);

  // =========================================================
  // 📅 달력
  // =========================================================
  const hashB = s => { let h = 7; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const bdayOf = v => v.bday || (hashB(v.id + 'bd') % 28) + 1;   // friendvig 생일 규칙과 같음
  const WD = ['월', '화', '수', '목', '금', '토', '일'];
  function calendar(n = 14) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const d = day() + i, md = ((d - 1) % 28) + 1, wd = (d - 1) % 7, ev = [];
      for (const v of vs()) if (bdayOf(v) === md) ev.push(`🎂 ${esc(v.name)} 생일`);
      if (wd === 5) ev.push('🎣 낚시 대회 (9~15시)', '🧺 플리마켓 (13시)');
      if (wd === 6) ev.push('⛪ 일요 예배', '🏆 오락실 주간 시상 (22시)');
      if (d % 4 === 0) ev.push('🌠 유성우 (천문대 추천)');
      for (const k of S().villagers.filter(x => x.child && x.child.parents.includes(P))) {
        const age = d - (k.child.birthDay || d), DP = D.PARENT;
        if (age === DP.babyDays) ev.push(`👣 ${esc(k.name)} 걸음마 시작 예정`);
        if (age === DP.babyDays + DP.toddlerDays) ev.push(`🎒 ${esc(k.name)} 입학 예정`);
        if (age === ((FM.Life && FM.Life.INDEP_DAY) || 15)) ev.push(`🚪 ${esc(k.name)} 독립 예정`);
      }
      out.push({ d, md, wd, ev });
    }
    return out;
  }
  Di.calendar = calendar;

  // =========================================================
  // 화면
  // =========================================================
  let tab = 'today';
  function render(body) {
    const st = S(), d = daily();
    const tabs = `<div class="pa-seg">${[['today', '✅ 오늘'], ['cal', '📅 달력'], ['ach', '🏅 업적']].map(([k, t]) => `<button data-dt="${k}" class="${tab === k ? 'on' : ''}">${t}</button>`).join('')}</div>`;
    let html = '';
    if (tab === 'today') {
      html = `${FM.Interact ? `<div class="pa-card" style="text-align:center"><b>${esc(FM.Interact.badge())}</b><div class="pa-sub">칭찬 · 선물 · 부탁으로 오르고, 바람 · 헛소문 · 험담 · 무례한 대답으로 떨어져요</div></div>` : ''}<div class="pa-card"><div class="pa-name" style="font-size:18px">✅ ${day()}일차 오늘의 할 일</div>
        ${d.goals.map(g => `<div class="kv" style="display:flex;justify-content:space-between;gap:8px;padding:8px 2px;border-bottom:1px dashed rgba(0,0,0,.08)"><span>${g.done ? '✔️' : '⬜'} ${esc(labelOf(g))}</span><b>${g.got}/${g.n} · 🪙 ${g.pay}</b></div>`).join('')}
        <p class="pa-sub" style="margin-top:8px">${d.bonus ? '🎉 오늘 할 일 완료! 보너스를 받았어요' : '세 개 다 하면 보너스 🪙 600'}</p></div>
        <div class="pa-card"><div class="pa-sub">📅 다가오는 일</div>${calendar(4).filter(x => x.ev.length).slice(0, 3).map(x => `<div class="pa-sub">${x.d === day() ? '오늘' : `${x.d - day()}일 뒤`} · ${x.ev.slice(0, 2).join(' · ')}</div>`).join('') || '<div class="pa-sub">조용한 며칠이 될 것 같아요</div>'}</div>`;
    } else if (tab === 'cal') {
      html = `<div class="pa-card">${calendar(14).map(x => `<div style="display:flex;gap:10px;padding:7px 2px;border-bottom:1px dashed rgba(0,0,0,.08)"><b style="min-width:62px">${x.d}일차<br><small class="muted">${x.md}일 (${WD[x.wd]})</small></b><span>${x.ev.join('<br>') || '<span class="muted">—</span>'}</span></div>`).join('')}</div>`;
    } else {
      const got = st.ach || {}; const n = ACH.filter(a => got[a[0]]).length;
      html = `<div class="pa-card"><div class="pa-name" style="font-size:18px">🏅 업적 ${n}/${ACH.length}</div>${ACH.map(([id, name, desc, , pay]) => `<div style="display:flex;justify-content:space-between;gap:8px;padding:7px 2px;border-bottom:1px dashed rgba(0,0,0,.08);${got[id] ? '' : 'opacity:.55'}"><span><b>${name}</b><br><small>${esc(desc)}</small></span><small>${got[id] ? `✔ ${got[id]}일차` : `🪙 ${pay}`}</small></div>`).join('')}</div>`;
    }
    body.innerHTML = tabs + html;
    body.querySelectorAll('[data-dt]').forEach(b => b.onclick = () => { tab = b.dataset.dt; render(body); });
  }
  Di.open = function () {
    UI.modal('📔 다이어리', '<div id="diaryBody" class="pa-wrap"></div>', b => render(b.querySelector('#diaryBody')));
    const d = daily(); if (d) d.seenGoals = true; badge();
  };
  // 폰 앱 + 배지 (완료 안 된 할 일 수)
  function badge() {
    let el = document.getElementById('diaryBadge');
    if (!el) { el = document.createElement('span'); el.id = 'diaryBadge'; el.style.display = 'none'; document.body.appendChild(el); }
    const d = S() && daily();
    el.dataset.badge = d && !d.seenGoals ? String(d.goals.filter(g => !g.done).length || '') : '';
  }
  if (UI.phone && UI.phone.APPS) UI.phone.APPS.splice(4, 0, ['diary', '📔', '다이어리', 'linear-gradient(135deg,#ffe8c8,#ffb88a)', () => Di.open(), 'diaryBadge']);
  setTimeout(() => { try { daily(); badge(); checkAch(); } catch (e) { /* */ } }, 3500);

  // =========================================================
  // ⚙️ 드라마 빈도 (적게 · 보통 · 많이)
  // =========================================================
  if (Cut && Cut.enqueue) {
    const oEnq = Cut.enqueue;
    Cut.enqueue = function (c, force) {
      const rate = (S() && S().flags && S().flags.dramaRate) || 'normal';
      if (!force && c && rate === 'low' && Math.random() < 0.55) return false;
      return oEnq.apply(this, arguments);
    };
  }
  if (Cut && Cut.fromLog) {
    // "많이": 로그로 생기는 드라마가 기본 확률에서 빠졌을 때 한 번 더 굴려 봄
    const oFrom = Cut.fromLog;
    Cut.fromLog = function (e) { let c = oFrom.apply(this, arguments); if (!c && S() && S().flags && S().flags.dramaRate === 'high' && Math.random() < 0.5) c = oFrom.apply(this, arguments); return c; };
  }
  const oTab = UI.tab;
  UI.tab = function (t) {
    const r = oTab.apply(this, arguments);
    if (t === 'settings') try {
      const body = document.getElementById('sideBody'); const st = S(); st.flags = st.flags || {};
      const cur = st.flags.dramaRate || 'normal';
      const div = document.createElement('div'); div.className = 'field';
      div.innerHTML = `드라마 빈도 <div class="chips">${[['low', '🌙 적게'], ['normal', '🎬 보통'], ['high', '🔥 많이']].map(([k, l]) => `<button data-dr="${k}" class="${cur === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
      const ref = body && body.querySelector('#setVol'); const host = ref ? ref.closest('.field') : null;
      if (host) host.after(div); else if (body) body.prepend(div);
      div.querySelectorAll('[data-dr]').forEach(b => b.onclick = () => { st.flags.dramaRate = b.dataset.dr; div.querySelectorAll('[data-dr]').forEach(x => x.classList.toggle('on', x === b)); toast(`🎬 드라마 빈도: ${b.textContent}`); });
    } catch (e) { console.error('diary settings', e); }
    return r;
  };
})();
