/* =========================================================
 *  UI — HUD, 패널(주민/퀘스트/소식/가방/신의 툴/설정), 대화창, 프로필, 상점,
 *  관찰 카메라 UI, 방 꾸미기(스마트 그리드), 도트 에디터, 꿈 미니게임, 알림
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE, D = FM.D, MAP = FM.MAP, Sim = FM.Sim, Soc = FM.Soc, Ev = FM.Ev, L = FM.L;
  const UI = (FM.UI = {});
  const $ = s => document.querySelector(s);
  const J = t => FM.josa(t);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const G = () => FM.G;
  const st = () => Sim.get();
  const P = 'P';
  const icon = v => (v && v.look && ISLE.SPECIES[v.look.species] ? ISLE.SPECIES[v.look.species].icon : '🙂');
  const kwName = k => (D.kw(k) ? D.kw(k).name : k);
  const pct = n => Math.round(n);
  let modalStack = 0;

  // =========================================================
  // 시작 화면
  // =========================================================
  function readCreator() { try { const d = JSON.parse(localStorage.getItem(ISLE.CREATOR_KEY) || 'null'); return d && Array.isArray(d.characters) ? d : null; } catch (e) { return null; } }
  UI.startScreenOld = function () {
    const cr = readCreator();
    const el = $('#start');
    const chars = cr ? cr.characters : [];
    const me = cr && cr.playerId ? chars.find(c => c.id === cr.playerId) : null;
    el.innerHTML = `
      <div class="start-card">
        <h1>🏝️ 찐구 모아 와르르 섬</h1>
        <p class="sub">주민들의 우정 · 짝사랑 · 연애 · 질투 · 결혼 · 육아를 관찰하고 참견하는 섬 생활 시뮬레이션</p>
        ${FM.G.hasSave() ? '<button class="btn big" id="stContinue">▶ 이어하기</button>' : ''}
        <details ${FM.G.hasSave() ? '' : 'open'}><summary>✨ 새로 시작하기</summary>
          <label class="field">내 이름 <input id="stName" maxlength="8" value="${esc(me ? me.name || '나' : '나')}"></label>
          <label class="field">나의 캐릭터
            <select id="stLook"><option value="rand">🎲 무작위 사람</option>${chars.map(c => `<option value="${c.id}" ${me && me.id === c.id ? 'selected' : ''}>${icon(c)} ${esc(c.name || '이름 없음')}</option>`).join('')}</select></label>
          <label class="field">나의 메인 성격 (자녀 유전에 사용)
            <select id="stKey">${Object.entries(D.L1).map(([k, v]) => `<option value="${k}">${v.icon} ${v.name}</option>`).join('')}</select></label>
          <label class="field">처음 입주할 주민 수 <input id="stCount" type="number" min="4" max="30" value="30"></label>
          ${chars.length ? `<div class="field">🎨 캐릭터 만들기에서 만든 주민 데려오기<div class="chk-list">${chars.filter(c => !me || c.id !== me.id).map(c => `<label><input type="checkbox" class="stImp" value="${c.id}" ${cr.invited.includes(c.id) ? 'checked' : ''}> ${icon(c)} ${esc(c.name || '이름 없음')}</label>`).join('')}</div></div>` : '<p class="note">💡 <a href="creator.html">캐릭터 만들기</a>에서 만든 주민을 섬으로 데려올 수 있어요.</p>'}
          <button class="btn big" id="stNew">🏝️ 섬으로 출발!</button>
        </details>
        <p class="note">성격은 [메인 성격]+[서브 행동 성향]+[대화 태도]+[특이 취향] 4개 레이어에서 무작위로 조합돼요.<br><a href="creator.html">🎨 캐릭터 만들기</a> · <a href="classic.html">🍃 이전 버전(두근두근 섬 생활)</a></p>
      </div>`;
    el.hidden = false;
    const go = fresh => {
      el.hidden = true; $('#loading').hidden = false;
      setTimeout(() => {
        if (!fresh) return FM.G.start({});
        const lookSel = $('#stLook').value;
        const pc = chars.find(c => c.id === lookSel);
        const imported = [...document.querySelectorAll('.stImp:checked')].map(x => chars.find(c => c.id === x.value)).filter(Boolean).map(c => ({ look: ISLE.normalizeLook(c.look), name: c.name || undefined, phrase: c.phrase }));
        const key = $('#stKey').value;
        FM.G.start({ fresh: true, playerName: $('#stName').value.trim() || '나', playerLook: pc ? ISLE.normalizeLook(pc.look) : ISLE.normalizeLook(Object.assign(ISLE.randomLook(), { species: 'human' })),
          count: Math.max(4, Math.min(40, +$('#stCount').value || 12)), imported, playerKeys: { L1: key, L2: Sim.u.pick(Object.keys(D.L2)), L3: Sim.u.pick(Object.keys(D.L3)), L4: Sim.u.pick(Object.keys(D.L4)) } });
      }, 50);
    };
    if ($('#stContinue')) $('#stContinue').onclick = () => go(false);
    $('#stNew').onclick = () => { if (FM.G.hasSave() && !confirm('저장된 섬을 지우고 새로 시작할까요?')) return; go(true); };
    $('#loading').hidden = true;
  };

  // =========================================================
  // 초기화
  // =========================================================
  UI.init = function () {
    $('#hud').hidden = false;
    // 속도
    document.querySelectorAll('[data-speed]').forEach(b => b.onclick = () => { st().speed = +b.dataset.speed; UI.paint(); });
    $('#btnSound').onclick = () => { FM.Audio.enable(!FM.Audio.on); UI.paint(); };
    $('#btnObserve').onclick = () => { if (G().view === 'observe') G().endObserve(); else G().observe(); };
    $('#btnMap').onclick = () => UI.toggleMap();
    if ($('#btnRel')) $('#btnRel').onclick = () => FM.Drama && FM.Drama.openMap();
    $('#btnPanel').onclick = () => $('#side').classList.toggle('open');
    document.querySelectorAll('#side .tab').forEach(t => t.onclick = () => UI.tab(t.dataset.tab));
    // 모바일 버튼
    $('#mAct').onclick = () => G().interact();
    $('#mRun').onpointerdown = () => { G().runBtn = true; }; $('#mRun').onpointerup = () => { G().runBtn = false; };
    $('#mFish').onclick = () => G().playerAction('fish');
    $('#mBug').onclick = () => G().playerAction('bug');
    $('#mSit').onclick = () => G().playerAction('sit');
    $('#hintBtn').onclick = () => G().interact();
    $('#hint').onclick = () => UI.actionMenu();
    // 이모티콘
    $('#emotes').innerHTML = D.EMOTES.map(e => `<button data-e="${e}">${e}</button>`).join('');
    $('#emotes').onclick = e => { const b = e.target.closest('button'); if (!b) return; const p = st().player; p.emote = { e: b.dataset.e, until: st().realT + 2.5 }; Ev.onPlayerAction('emote:' + b.dataset.e); };
    FM.bus.on('toast', t => UI.toast(t));
    FM.bus.on('notify', n => UI.notify(n));
    FM.bus.on('majorScene', sc => UI.banner(sc));
    FM.bus.on('sceneEnd', sc => { if (sc.major) UI.banner(null, sc); });
    FM.bus.on('bgm', b => { activeBgm[b.scene] = b; });
    FM.bus.on('bgmEnd', b => { delete activeBgm[b.scene]; });
    FM.bus.on('mail', () => UI.paint());
    FM.bus.on('quest', () => { if (curTab === 'quest') UI.tab('quest'); });
    FM.bus.on('babyOffer', m => UI.babyOffer(m));
    FM.bus.on('playerWedding', () => UI.toast('💒 오늘은 나의 결혼식! 대성당으로 가 보세요'));
    FM.bus.on('photo', () => { FM.Audio.sfx('camera'); UI.toast('📸 마을 단체 기념 사진을 찍었어요! (소식 → 앨범)'); });
    UI.tab('villagers');
    UI.paint();
    setInterval(UI.paint, 700);
  };

  // =========================================================
  // HUD
  // =========================================================
  UI.paint = function () {
    const s = st(); if (!s) return;
    const T = Sim.time;
    $('#hudTime').textContent = `${T.day()}일차 (${D.WEEKDAYS[T.weekday()]}) ${T.hm()}`;
    $('#hudWeather').textContent = Ev.WEATHER[s.weather.type];
    $('#hudCoins').textContent = `🪙 ${Math.floor(s.player.coins).toLocaleString()}`;
    $('#hudStam').style.width = `${Math.round(s.player.stamina)}%`;
    document.querySelectorAll('[data-speed]').forEach(b => b.classList.toggle('on', +b.dataset.speed === s.speed));
    $('#btnSound').textContent = FM.Audio.on ? '🔊' : '🔇';
    const unread = s.mail.filter(m => !m.read).length;
    $('#hudMail').textContent = unread ? `📮 ${unread}` : '';
    // 고민 풍선 알림
    const need = s.villagers.filter(v => v.balloon);
    $('#notif').innerHTML = need.slice(0, 5).map(v => `<button class="nt" data-id="${v.id}"><span class="bal ${v.balloon.color}">${v.balloon.kind === 'marry' ? '💍' : '!'}</span>${FM.Face ? FM.Face.img(v, 26) : icon(v)} ${esc(v.name)} <small>${balloonLabel(v.balloon)}</small></button>`).join('') + (need.length > 5 ? `<div class="nt more">+${need.length - 5}명 더</div>` : '');
    $('#notif').querySelectorAll('.nt[data-id]').forEach(b => b.onclick = () => UI.goTo(Sim.byId(b.dataset.id)));
    if (curTab === 'villagers' && $('#side').classList.contains('open')) paintVillagers();
  };
  function balloonLabel(b) {
    return { crush: '연애 고민 (분홍 풍선)', crushP: '할 말이 있대요 💗', jealous: '질투 폭발 (붉은 풍선)', bored: '권태기 고민 (보라 풍선)', reunion: '전 연인 고민', marry: '프러포즈 고민', secret: '비밀 이야기', capsule: '타임캡슐 제안', errand: '부탁이 있대요', kid: '아이 문제', think: '편지를 읽고 고민 중' }[b.kind] || '고민 중';
  }

  let toastT = null;
  UI.toast = function (t) {
    const box = $('#toasts');
    const d = document.createElement('div'); d.className = 'toast'; d.textContent = J(t);
    box.prepend(d);
    while (box.children.length > 4) box.lastChild.remove();
    setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 400); }, 3800);
    void toastT;
  };
  UI.notify = function (n) { UI.toast('❗ ' + n.text); FM.Audio.sfx('pop'); };
  UI.hint = function (t) { const h = $('#hint'); h.textContent = t; h._k = null; };
  UI.marker = function () {};
  // 중요한 장면 배너 (고백/결혼식/이별 …)
  let bannerScene = null;
  UI.banner = function (sc, ended) {
    const b = $('#banner');
    if (sc) {
      bannerScene = sc;
      const actors = /♥/.test(sc.title) ? '' : Object.values(sc.actors).filter(a => !a.staff).map(a => a.name).slice(0, 2).join(' & ');
      b.innerHTML = `<b>${esc(sc.title)}</b> <span>${esc(J(actors))}</span> <button id="bnGo">👀 장면 보러가기</button> <button id="bnX">✕</button>`;
      b.hidden = false;
      $('#bnGo').onclick = () => { b.hidden = true; let c = null; try { c = FM.Cut && FM.Cut.fromScene && FM.Cut.fromScene(sc); } catch (e) { c = null; } if (c && FM.Cut.play) FM.Cut.play(c); else { const a = Object.values(sc.actors)[0]; if (a) UI.goTo(a, true); } };
      $('#bnX').onclick = () => { b.hidden = true; };
      if (st().speed > 1) { st().speed = 1; UI.toast('⏯️ 중요한 장면이라 속도를 1배로 바꿨어요'); }
    } else if (ended && bannerScene === ended) { b.hidden = true; bannerScene = null; }
  };

  // 찾아가기: 카메라 이동 (가까우면) + 안내
  UI.goTo = function (v, watch) {
    if (!v) return;
    const s = st(), p = s.player;
    if (v.loc === 'island') {
      if (G().view !== 'island') { if (G().view === 'observe') G().endObserve(); if (p.loc !== 'island') G().exitInterior(); }
      // 가까운 역으로 순간 이동 옵션
      const d = Math.hypot(v.x - p.x, v.z - p.z);
      if (d > 30) { p.x = v.x + 2.5; p.z = v.z + 2.5; if (!FM.T.canWalk(p.x, p.z, p.x, p.z)) { p.x = v.x + 1; p.z = v.z; } UI.toast(`🚶 ${v.name} 근처로 이동했어요`); G().fade(0.3); }
      else G().target = { x: v.x + 1.2, z: v.z + 1.2 };
    } else if (v.loc === 'metro') UI.toast(v.taxi ? `${v.name}은(는) 택시를 타고 약속 장소로 가는 중이에요 🚕` : `${v.name}은(는) 지하철을 타고 이동 중이에요`);
    else if (FM.INTERIORS[v.loc]) {
      const I = FM.INTERIORS[v.loc];
      if (I.kind === 'room' && I.place === 'apartment') { G().observe(v.loc); }
      else if (watch || I.kind === 'room') G().observeInterior(v.loc);
      else { G().enterInterior(v.loc); }
    }
    if (!watch && v.balloon) setTimeout(() => { if (Math.hypot(v.x - p.x, v.z - p.z) < 4 || G().view === 'observe') UI.talk(v); }, 600);
  };

  // =========================================================
  // 대화창 (TALK_PLAYER)
  // =========================================================
  let talkV = null, typeTimer = null, vnLog = [], vnFull = '', vnShown = 0, vnDone = true, vnR = null;
  UI.talk = function (v) {
    if (!v || v.staff || v.visitor) return;
    talkV = v; vnLog = []; vgOpen = null;
    G().talkFocus = v.id; G().target = null; G().autoPath = null;
    // 타임캡슐 파내기
    const cap = Ev.digCapsule && Ev.digCapsule(v);
    const r = cap ? { text: cap, options: Soc.talkOptions(v) } : Soc.playerTalk(v);
    showDialog(v, r);
  };
  // 친밀도/신뢰도 하트 게이지
  const hearts = (n, cls) => { const f = Math.round(Math.max(0, Math.min(100, n)) / 20); return `<span class="vn-hearts ${cls}">${'♥'.repeat(f)}<i>${'♥'.repeat(5 - f)}</i></span>`; };
  function vnSkeleton(d) {
    d.innerHTML = `
      <div class="vn-stage"><canvas id="vnC"></canvas><div class="vn-fallback" id="vnFb"></div></div>
      <div class="vn-opts" id="vnOpts"></div>
      <div class="vn-box" id="vnBox">
        <div class="vn-name" id="vnName"></div>
        <div class="vn-meta" id="vnMeta"></div>
        <p class="vn-text" id="vnText"></p>
        <span class="vn-next" id="vnNext">▼</span>
        <div class="vn-tools"><button id="vnLogB" title="대화 기록">📜 기록</button><button id="vnX" title="대화 끝내기 (Esc)">✕ 닫기</button></div>
      </div>`;
    $('#vnX').onclick = e => { e.stopPropagation(); closeDialog(); };
    $('#vnLogB').onclick = e => { e.stopPropagation(); const box = $('#vnText'); box.innerHTML = vnLog.slice(-12).map(l => `<small class="vn-logl"><b>${esc(l.who)}</b> ${esc(l.text)}</small>`).join(''); vnDone = true; $('#vnNext').hidden = true; };
    $('#vnBox').onclick = () => { if (!vnDone) finishType(); };
  }
  function finishType() {
    clearInterval(typeTimer); typeTimer = null;
    vnShown = vnFull.length; $('#vnText').textContent = vnFull; vnDone = true;
    $('#vnNext').hidden = false;
    showOpts();
  }
  // 대화 선택지 묶음: 많으면 카테고리 4~5칸 → 누르면 펼침 (기능은 그대로)
  const VG = [
    ['talk', '💬', '이야기', '근황 · 대화 · 칭찬 · 상담', ['news', 'chat', 'praise', 'consult', 'wMore', 'nickname', 'leak', 'petname']],
    ['heart', '💗', '마음', '설레는 말 · 고백 · 데이트', ['flirt', 'confessD', 'dateMenu', 'propose', 'babyAsk', 'breakupP', 'coachC', 'annivTalk', 'workTalk', 'dinnerTogether', 'familyOuting', 'loveHug', 'workLunch']],
    ['gift', '🎁', '선물', '가방에서 골라 주기', ['gift']],
    ['ask', '🙏', '부탁 · 함께', '부탁 · 도와주기 · 중재 · 초대', ['cmdList', 'indList', 'errand', 'cleanOrder', 'nudge', 'invite', 'joinIn', 'care', 'unfollow']],
    ['baby', '👶', '육아', '우유 · 자장가 · 놀이', []],
  ];
  const vgOf = o => { if (/^baby:/.test(o.id)) return 'baby'; const g = VG.find(x => x[4].includes(o.id)); return g ? g[0] : null; };
  let vgOpen = null;
  function showOpts() {
    const r = vnR, v = talkV, box = $('#vnOpts'); if (!r || !v || !box) return;
    const opts = r.options || [];
    const btn = (o, i, cls = '') => `<button data-i="${i}" class="${o.id === 'bye' ? 'bye' : ''} ${cls}" ${o.disabled ? 'disabled title="' + esc(o.hint || '') + '"' : ''} style="animation-delay:${i * 0.03}s">${esc(o.label)}${o.disabled && o.hint ? `<small>${esc(o.hint)}</small>` : ''}</button>`;
    box.classList.remove('many', 'many3');
    const grouped = opts.filter(o => vgOf(o)).length;
    if (opts.length <= 6 || grouped < 4) {
      // 짧은 선택지(대답 · 하위 메뉴)는 그대로, 한 줄에 하나
      vgOpen = null;
      box.innerHTML = `<div class="vg-list ${opts.length <= 3 ? 'one' : ''}">${opts.map((o, i) => btn(o, i)).join('')}</div>`;
    } else if (vgOpen) {
      const g = VG.find(x => x[0] === vgOpen);
      const list = opts.map((o, i) => [o, i]).filter(([o]) => vgOf(o) === vgOpen);
      box.innerHTML = `<div class="vg-head"><button data-back="1">◀ 뒤로</button>${g[1]} ${g[2]}</div><div class="vg-list ${list.length <= 3 ? 'one' : ''}">${list.map(([o, i]) => btn(o, i)).join('')}</div>`;
    } else {
      // 카테고리 + 따로 떠 있는 선택지(답해야 하는 것)는 위에 강조
      const pins = opts.map((o, i) => [o, i]).filter(([o]) => !vgOf(o) && o.id !== 'bye' && o.id !== 'menu');
      const cats = VG.map(g => [g, opts.filter(o => vgOf(o) === g[0])]).filter(([, l]) => l.length);
      const bye = opts.findIndex(o => o.id === 'bye');
      box.innerHTML = (pins.length ? `<div class="vg-list one">${pins.map(([o, i]) => btn(o, i, 'vg-pin')).join('')}</div>` : '') +
        `<div class="vg-grid">${cats.map(([g, l], k) => l.length === 1 ? `<button class="vg-cat" data-i="${opts.indexOf(l[0])}" ${l[0].disabled ? 'disabled' : ''}><b>${g[1]} ${g[2]}</b><small>${esc(l[0].disabled && l[0].hint ? l[0].hint : g[3])}</small></button>`
          : `<button class="vg-cat ${k === 0 ? 'hot' : ''}" data-g="${g[0]}"><b>${g[1]} ${g[2]}<em>${l.length}</em></b><small>${g[3]}</small></button>`).join('')}</div>` +
        (bye >= 0 ? btn(opts[bye], bye) : '');
    }
    box.querySelectorAll('button').forEach(b => b.onclick = e => {
      e.stopPropagation();
      if (b.dataset.back) { vgOpen = null; return showOpts(); }
      if (b.dataset.g) { vgOpen = b.dataset.g; FM.Audio.sfx('blip'); return showOpts(); }
      const o = r.options[+b.dataset.i];
      vgOpen = null;
      vnLog.push({ who: st().player.name, text: o.label });
      if (o.input) { const val = prompt(o.label, ''); if (!val) return; return choose(v, o.id, val.slice(0, 12)); }
      if (o.id === 'gift' && !o.arg) return choose(v, 'gift');
      choose(v, o.id, o.arg);
    });
  }
  UI.vnAdvance = () => { if (!vnDone) finishType(); };
  UI.vnPick = i => { if (!vnDone) return finishType(); const b = document.querySelectorAll('#vnOpts button')[i]; if (b && !b.disabled) b.click(); };
  function showDialog(v, r) {
    const d = $('#dialog');
    if (d.hidden || !$('#vnBox')) vnSkeleton(d);
    d.hidden = false; document.body.classList.add('vn-on');
    vnR = r;
    const rel = Soc.rel(v.id, P);
    const stage = D.FRIEND_STAGES.find(s => s.id === rel.friendship_stage);
    const lover = Soc.partnerOf(v.id) === P;
    $('#vnName').innerHTML = `<b>${esc(v.name)}</b>${v.nick ? `<small>'${esc(v.nick)}'</small>` : ''}`;
    $('#vnMeta').innerHTML = `<span class="tag">${esc(stage ? stage.name : '')}</span>${lover ? '<span class="tag pink">💕 연인</span>' : ''}<span title="친밀도 ${pct(rel.friendship_point)}">친밀 ${hearts(rel.friendship_point, 'pink')}</span><span title="신뢰도 ${pct(rel.trust_level)}">신뢰 ${hearts(rel.trust_level, 'gold')}</span>`;
    $('#vnName').title = v.title;
    const text = J(r.text || '...');
    vnLog.push({ who: v.name, text });
    // 표정 & 포즈
    const emo = FM.Portrait.emotionOf(text, v);
    v.talkPose = (FM.Portrait.FACE[emo] || FM.Portrait.FACE.calm).pose;
    const ok = FM.Portrait.show($('#vnC'), v, emo);
    $('#vnFb').hidden = ok; if (!ok) $('#vnFb').textContent = icon(v);
    $('#dialog').dataset.emo = emo;
    // 타자기 효과
    $('#vnOpts').innerHTML = '';
    vnFull = text; vnShown = 0; vnDone = false; $('#vnNext').hidden = true;
    const el = $('#vnText'); el.textContent = '';
    clearInterval(typeTimer);
    const t0 = performance.now();
    typeTimer = setInterval(() => {
      const n = Math.min(vnFull.length, Math.floor((performance.now() - t0) / 1000 * 34) + 1);   // 초당 34자
      if (n === vnShown) return;
      if (Math.floor(n / 2) !== Math.floor(vnShown / 2) && vnFull[n - 1] !== ' ') { if (FM.Voice && talkV) FM.Voice.blip(talkV, vnFull[n - 1]); else FM.Audio.sfx('blip'); }
      vnShown = n; el.textContent = vnFull.slice(0, vnShown);
      if (vnShown >= vnFull.length) finishType();
    }, 30);
    FM.Audio.sfx('page');
  }
  function choose(v, id, arg) {
    const r = Soc.playerChoose(v, id, arg);
    if (id === 'gift' && arg) { FM.Audio.sfx('heart'); }
    if (r.close) { if (r.text) { showDialog(v, { text: r.text, options: [{ id: 'bye', label: '👋 (대화 마치기)' }] }); } else closeDialog(); return; }
    showDialog(v, r);
    UI.paint();
  }
  function closeDialog() {
    const d = $('#dialog'); d.hidden = true; document.body.classList.remove('vn-on');
    clearInterval(typeTimer); typeTimer = null;
    FM.Portrait.hide();
    G().talkFocus = null;
    if (talkV) { talkV.talkPose = null; Soc.playerChoose(talkV, 'bye'); talkV = null; }
  }
  FM.bus.on('talkInterrupt', v => { if (talkV === v) { UI.toast(J(`${v.name}은(는) 급한 일이 생겨서 대화를 멈췄어요`)); talkV.talkPose = null; talkV = null; const d = $('#dialog'); d.hidden = true; document.body.classList.remove('vn-on'); FM.Portrait.hide(); G().talkFocus = null; } });
  UI.closeDialog = closeDialog;
  // 스태프 대화
  UI.staffTalk = function (s) {
    const lines = { boss: '...오늘 업무는 끝냈나?', clerk: '민원 창구입니다. 번호표를 뽑아주세요.', judge: '정숙!', doctor: '어디가 아프신가요? 엉뚱한 병도 고쳐드립니다.', dj: '🎧 오늘 밤도 불태워 보자고!', chef: '오늘의 추천은 참치 대창 초밥!', pub: '탕수육 나왔어요~', barista: '수플레 팬케이크 어떠세요?', stylist: '파격 변신, 해 드릴까요?', conv: '어서오세요~ 삼각김밥 1+1이에요!', tea: '따뜻한 대추차 한 잔 드릴까요?', teacher: '얘들아, 조용!', librarian: '도서관에서는 정숙해 주세요.', captain: '⛴️ 오늘도 이웃 섬 손님이 올 거예요.', pocha: '어서 와~ 우동 한 그릇 해!' };
    UI.toast(`${s.name}: "${lines[s.role] || '안녕하세요!'}"`);
    const shop = { barista: 'cafe', conv: 'conv', stylist: 'mall', tea: 'tea', pocha: 'pocha', librarian: 'library', pharmacist: 'pharmacy' }[s.role];
    if (shop) UI.shop(shop);
    if (s.role === 'clerk' || s.role === 'judge') UI.cityHall();
  };

  // =========================================================
  // 모달
  // =========================================================
  function modal(title, html, onMount, wide) {
    const m = $('#modal');
    m.innerHTML = `<div class="md ${wide ? 'wide' : ''}"><div class="md-head"><b>${title}</b><button class="md-x">✕</button></div><div class="md-body">${html}</div></div>`;
    m.hidden = false; modalStack = 1;
    m.querySelector('.md-x').onclick = closeModal;
    m.onclick = e => { if (e.target === m) closeModal(); };
    if (onMount) onMount(m.querySelector('.md-body'));
  }
  function closeModal() { $('#modal').hidden = true; modalStack = 0; if (UI.onModalClose) { const f = UI.onModalClose; UI.onModalClose = null; f(); } }
  UI.closeModal = closeModal;
  UI.modal = modal;
  UI.modalOpen = () => !$('#modal').hidden || !$('#dialog').hidden || !!dreamGame;
  UI.paused = () => !!dreamGame;
  UI.escape = () => { if (!$('#map').hidden) $('#map').hidden = true; else if (!$('#dialog').hidden) closeDialog(); else if (!$('#modal').hidden) closeModal(); else if (G().view === 'observe') G().endObserve(); else if (UI.editing) UI.closeEditor(); };
  // 주변에서 할 수 있는 행동 전체 목록 (R)
  UI.actionMenu = function () {
    const list = G().interactables(); if (!list.length) return;
    modal('✋ 여기서 할 수 있는 일', `<div class="act-list">${list.map((x, i) => `<button data-i="${i}"><b>${i < 9 ? i + 1 : ''}</b> ${esc(J(x.label))}</button>`).join('')}</div><p class="muted">숫자 키로도 고를 수 있어요</p>`, b => {
      b.querySelectorAll('[data-i]').forEach(x => x.onclick = () => { closeModal(); list[+x.dataset.i].fn(); });
      const key = e => { if ($('#modal').hidden) return document.removeEventListener('keydown', key, true); const n = +e.key; if (n >= 1 && n <= list.length) { e.preventDefault(); e.stopPropagation(); document.removeEventListener('keydown', key, true); closeModal(); list[n - 1].fn(); } };
      document.addEventListener('keydown', key, true);
    });
  };
  UI.dialogList = (title, lines) => modal(title, `<ul class="list">${lines.map(l => `<li>${esc(J(l))}</li>`).join('')}</ul>`);

  // =========================================================
  // 사이드 패널 탭
  // =========================================================
  let curTab = 'villagers';
  UI.tab = function (t) {
    curTab = t;
    document.querySelectorAll('#side .tab').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    const body = $('#sideBody');
    const fn = ({ villagers: paintVillagers, quest: paintQuests, news: paintNews, bag: paintBag, god: paintGod, settings: paintSettings, help: paintHelp })[t];
    if (fn) fn(body);
  };
  function locName(v) {
    if (v.loc === 'island') { const d = FM.T.district(v.x, v.z); return MAP.DISTRICTS[d].short + ' 지구'; }
    if (v.loc === 'metro') return v.taxi ? '🚕 택시' : '🚇 지하철';
    return FM.INTERIORS[v.loc] ? FM.INTERIORS[v.loc].name : v.loc;
  }
  function paintVillagers(body = $('#sideBody')) {
    if (UI.pv) return UI.pv(body);
    const s = st();
    const rows = s.villagers.map(v => {
      const r = Soc.rel(v.id, P);
      const pt = Soc.partnerOf(v.id);
      const act = v.act ? v.act.name : v.moving ? '이동 중' : (D.STATES[v.state] || {}).ko || v.state;
      return `<div class="vrow" data-id="${v.id}"><span class="vic">${icon(v)}</span><div class="vinfo"><b>${esc(v.name)}</b>${v.child ? ` <small class="tag">👶 ${D.GROWTH.find(g => g.id === v.child.stage).name}</small>` : ''}${pt ? ` <small class="tag pink">💕 ${esc(Sim.nameOf(pt))}</small>` : ''}${v.balloon ? ` <span class="bal ${v.balloon.color}">!</span>` : ''}
        <small>${esc(v.title)}</small><small class="muted">📍 ${esc(locName(v))} · ${esc(act)} · ${Soc.stageName(r.friendship_stage)}</small></div>
        <div class="vbtn"><button data-a="prof">프로필</button><button data-a="go">찾기</button></div></div>`;
    }).join('');
    body.innerHTML = `<div class="panel-top"><button class="btn small" id="addV">➕ 주민 이주시키기</button> <span class="muted">${s.villagers.length}명 · 아파트 ${s.villagers.filter(v => v.home && v.home.startsWith('apt')).length}/20호${FM.Ug && FM.Ug.isOpen() ? ` · 지하 ${s.villagers.filter(v => v.home && v.home.startsWith('ug-')).length}/${FM.Ug.ROOMS.length}호` : ''}</span></div>${rows}`;
    body.querySelectorAll('.vrow').forEach(r => {
      const v = Sim.byId(r.dataset.id);
      r.querySelector('[data-a=prof]').onclick = () => UI.showProfile(v);
      r.querySelector('[data-a=go]').onclick = () => UI.goTo(v);
    });
    $('#addV').onclick = () => UI.addVillager();
  }
  function questCard(q, pinnedId) {
    const Gd = FM.Guide;
    const steps = q.state === 'active' ? Gd.questSteps(q) : [];
    const nowI = steps.findIndex(x => !x.done);
    const dest = q.state === 'active' && Gd.questDest(q);
    const giver = q.giver && q.giver !== P ? Sim.byId(q.giver) : null;
    return `<div class="qcard ${q.state} ${q.id === pinnedId ? 'pinned' : ''}" data-q="${q.id}">
      <h4>${esc(J(q.title))}</h4>
      <div class="qmeta">${giver ? `<span>🙋 의뢰: ${icon(giver)} ${esc(giver.name)}</span>` : ''}<span>${q.day}일차</span>${q.state === 'active' ? `<span>${esc(Gd.timeLeft(q))}</span>` : `<span>${q.state === 'done' ? '✅ 완료' : q.state === 'abandoned' ? '🏳️ 포기' : '❌ 실패'}</span>`}${q.id === pinnedId ? '<span>📌 추적 중</span>' : ''}</div>
      ${q.state === 'active' ? `<div class="qdesc">${esc(J(q.desc || ''))}</div>
      <ol>${steps.map((x, i) => `<li class="${x.done ? 'ok' : i === nowI ? 'now' : ''}">${i === nowI ? '👉 ' : ''}${esc(x.text)}</li>`).join('')}</ol>
      <span class="qreward">🎁 보상: ${esc(Gd.reward(q))}</span>
      <div class="qbtns">${q.id !== pinnedId ? '<button data-a="pin">📌 화면에 띄우기</button>' : ''}${dest ? '<button class="main" data-a="tp">✨ 바로 가기</button><button data-a="walk">🚶 길 안내</button><button data-a="map">🗺️ 지도</button>' : ''}<button class="quit" data-a="quit">🏳️ 포기하기</button></div>` : ''}
    </div>`;
  }
  function bindQuestBtns(root) {
    root.querySelectorAll('.qcard[data-q]').forEach(c => {
      const q = st().quests.find(x => x.id === c.dataset.q); if (!q) return;
      c.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
        const a = b.dataset.a, dest = FM.Guide.questDest(q);
        if (a === 'quit') { UI.quitQuest(q); return; }
        FM.Guide.pin(q);
        if (a === 'tp' && dest) FM.Guide.teleport(dest);
        else if (a === 'walk' && dest) FM.Guide.walkTo(dest);
        else if (a === 'map' && dest) UI.openMapAt(dest.villager ? { type: 'v', id: dest.villager } : dest.place ? { type: 'place', id: dest.place } : null);
        UI.paint(); paintTracker(true);
      });
    });
  }
  // 퀘스트 포기 (확인 창)
  UI.quitQuest = function (q) {
    const g = q.giver && q.giver !== P ? Sim.byId(q.giver) : null;
    modal('🏳️ 퀘스트 포기', `<p><b>${esc(J(q.title))}</b></p><p>정말 포기할까요?${g ? `<br><small class="muted">${icon(g)} ${esc(g.name)}이(가) 조금 서운해해요 (친밀도 -2 · 신뢰도 -3)</small>` : ''}</p><div class="chips"><button id="qqYes" class="main">포기하기</button><button id="qqNo">계속 할래요</button></div>`, b => {
      b.querySelector('#qqYes').onclick = () => { closeModal(); Soc.abandonQuest(q); UI.paint(); paintTracker(true); if (curTab === 'quest') UI.tab('quest'); };
      b.querySelector('#qqNo').onclick = () => closeModal();
    });
  };
  function paintQuests(body = $('#sideBody')) {
    const all = st().quests.slice().reverse();
    const act = all.filter(q => q.state === 'active'), old = all.filter(q => q.state !== 'active').slice(0, 20);
    const pin = FM.Guide.pinned();
    body.innerHTML = `
      <div class="qhelp">💡 <b>퀘스트 받는 법</b>: 머리 위에 <b>!</b> 풍선이 뜬 주민에게 말을 걸어요. (🩷 짝사랑 · ❤️ 질투 · 💜 권태기 · 🧡 부탁)<br>📌 표시한 퀘스트는 화면 왼쪽 위에 떠서 <b>다음에 할 일</b>과 <b>방향</b>을 알려줘요. ⭐ 빛기둥을 따라가세요!</div>
      ${act.length ? act.map(q => questCard(q, pin && pin.id)).join('') : '<p class="muted">진행 중인 퀘스트가 없어요. 👥 주민 탭에서 <b>!</b> 표시가 있는 주민을 찾아 [찾기]를 눌러보세요.</p>'}
      ${old.length ? `<details><summary class="muted">지난 퀘스트 ${old.length}개</summary>${old.map(q => questCard(q)).join('')}</details>` : ''}`;
    bindQuestBtns(body);
  }
  // 화면 왼쪽 위 퀘스트 추적기
  let trackKey = '';
  function paintTracker(force) {
    const el = $('#qtrack'); if (!el) return;
    const s = st(); const g = G();
    const q = FM.Guide.pinned();
    if (!q || g.view === 'observe' || UI.editing) { el.hidden = true; trackKey = ''; return; }
    const next = FM.Guide.nextStep(q);
    const dest = FM.Guide.questDest(q), pos = dest && FM.Guide.resolve(dest);
    const p = s.player;
    let dir = '';
    if (pos && p.loc === 'island' && g.camera) {
      const dx = pos.x - p.x, dz = pos.z - p.z, d = Math.hypot(dx, dz);
      const f = new THREE.Vector3(); g.camera.getWorldDirection(f); f.y = 0; f.normalize();
      const ang = Math.atan2(dx * -f.z + dz * f.x, dx * f.x + dz * f.z);
      dir = d < 4 ? '<span class="qt-arrow">✓</span> 거의 다 왔어요!' : `<span class="qt-arrow" style="transform:rotate(${(ang * 180 / Math.PI).toFixed(0)}deg)">↑</span> ${esc(pos.label)} · ${Math.round(d)}m`;
    } else if (pos) dir = `📍 ${esc(pos.label)}`;
    const html = `<div class="qt-title">📌 <b>${esc(J(q.title))}</b><small>${esc(FM.Guide.timeLeft(q))}</small></div>
      <div class="qt-step">👉 ${esc(next ? next.text : '')}</div>
      ${dir ? `<div class="qt-dir">${dir}</div>` : ''}
      <div class="qt-btns">${dest ? '<button class="main" data-t="tp">✨ 바로 가기</button><button data-t="walk">🚶 길 안내</button>' : ''}<button data-t="list">📜 자세히</button><button data-t="quit" title="퀘스트 포기">🏳️</button></div>`;
    if (html !== trackKey || force) {
      el.innerHTML = html; trackKey = html;
      el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
        const t = b.dataset.t;
        if (t === 'tp' && dest) FM.Guide.teleport(dest);
        if (t === 'walk' && dest) FM.Guide.walkTo(dest);
        if (t === 'list') { $('#side').classList.add('open'); UI.tab('quest'); }
        if (t === 'quit') UI.quitQuest(q);
      });
    }
    el.hidden = false;
  }
  UI.paintTracker = paintTracker;
  FM.bus.on('quest', q => {
    if (!st()) return;
    if (q && q.state === 'active' && !st().quests.some(x => x.id === st().pinQuest && x.state === 'active')) st().pinQuest = q.id;
    if (q && q.state === 'active') setTimeout(() => { const el = $('#qtrack'); if (el) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } }, 50);
    if (q && q.state === 'done') UI.toast(`🎁 퀘스트 보상: ${FM.Guide.reward(q)}`);
    paintTracker(true);
    if (curTab === 'quest' && $('#side').classList.contains('open')) UI.tab('quest');
  });
  let logFilter = 'all';
  function paintNews(body = $('#sideBody')) {
    if (UI.pn) return UI.pn(body);
    const s = st();
    const nb = s.newsBoard || { items: [] };
    const R = s.rankings || {};
    const types = { all: '전체', couple: '💕 연애', friend: '🤝 우정', crush: '💗 짝사랑', jealous: '⚡ 질투', breakup: '💔 이별', wedding: '💒 결혼', baby: '👶 육아', quirk: '🌀 기행', medical: '🏥 병원', news: '📺 뉴스' };
    const logs = (s.rumors || []).map(r => ({ day: r.day, hm: (r.src === 'told' && r.by ? Sim.nameOf(r.by) + '에게 들음' : r.src === 'heard' ? '엿들음' : '직접 봄') + (FM.Rumor && FM.Rumor.sureTag ? FM.Rumor.sureTag(r) : ''), text: `${r.icon} ${r.text}`, type: r.type })).filter(e => logFilter === 'all' || e.type === logFilter || (logFilter === 'wedding' && e.type === 'engage') || (logFilter === 'couple' && ['confess', 'date', 'romance'].includes(e.type))).slice(-80).reverse();
    body.innerHTML = `
      <h4>📺 찐구모아 뉴스 (${esc(nb.anchor || '')})</h4><ul class="list">${nb.items.map(i => `<li>${esc(J(i))}</li>`).join('')}</ul>
      <h4>🏆 실시간 도시 랭킹</h4>
      <div class="rank"><div><b>섬 최고의 인싸</b>${(R.insider || []).map((x, i) => `<span>${i + 1}. ${esc(x.name)}</span>`).join('')}</div><div><b>가장 빚이 많은 주민</b>${(R.debt || []).filter(x => x.val > 0).map((x, i) => `<span>${i + 1}. ${esc(x.name)} (${x.val})</span>`).join('') || '<span>없음</span>'}</div><div><b>부자</b>${(R.rich || []).map((x, i) => `<span>${i + 1}. ${esc(x.name)}</span>`).join('')}</div><div><b>설렘 유발자</b>${(R.love || []).map((x, i) => `<span>${i + 1}. ${esc(x.name)}</span>`).join('')}</div></div>
      ${s.album && s.album.length ? `<h4>📸 앨범</h4><ul class="list">${s.album.map(a => `<li>${a.day}일차 · ${esc(J(a.title))} (${a.who.length}명)</li>`).join('')}</ul>` : ''}
      <h4>🗞️ 소문 수첩 (내가 듣고 본 소식)</h4><div class="chips">${Object.entries(types).map(([k, v]) => `<button data-f="${k}" class="${logFilter === k ? 'on' : ''}">${v}</button>`).join('')}</div>
      <ul class="list log">${logs.map(e => `<li><small>${e.day}일 ${e.hm}</small> ${esc(e.text)}</li>`).join('')}</ul>`;
    body.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { logFilter = b.dataset.f; paintNews(body); });
  }
  function paintBag(body = $('#sideBody')) {
    const s = st(), p = s.player;
    const inv = Object.entries(p.inv).filter(([, n]) => n > 0);
    body.innerHTML = `<p>🪙 <b>${Math.floor(p.coins).toLocaleString()}</b> 코인 · ⚡ 스태미나 ${Math.round(p.stamina)} · 🏠 집 ${FM.HOUSE_LEVELS[(p.houseLevel || 1) - 1].name}</p>
      <div class="bag">${inv.map(([k, n]) => { const it = D.ITEMS[k] || { name: k, icon: '❔' }; return `<div class="it"><span>${it.icon}</span><b>${esc(it.name)}</b><small>×${n}</small>${it.stamina ? `<button data-eat="${k}">먹기</button>` : ''}${it.special === 'ticket' || it.special === 'autoInterior' ? `<button data-ticket="${k}">선물</button>` : ''}</div>`; }).join('') || '<p class="muted">가방이 비었어요.</p>'}</div>
      ${(p.fleaItems || []).length ? `<h4>🧺 플리마켓 수집품</h4><p class="muted">${p.fleaItems.map(esc).join(', ')}</p>` : ''}${(p.dreamLoot || []).length ? `<h4>🌈 꿈속 가품</h4><p class="muted">${p.dreamLoot.map(esc).join(', ')}</p>` : ''}
      ${(p.knownSecrets || []).length ? `<h4>🤫 알고 있는 비밀</h4><ul class="list">${p.knownSecrets.map(x => `<li>${esc(Sim.nameOf(x.owner))}: ${esc(x.text)}</li>`).join('')}</ul>` : ''}`;
    body.querySelectorAll('[data-eat]').forEach(b => b.onclick = () => { const k = b.dataset.eat; if (Soc.takeItem(k)) { p.stamina = Math.min(100, p.stamina + D.ITEMS[k].stamina); UI.toast(`😋 ${D.ITEMS[k].name} 냠냠! 스태미나 +${D.ITEMS[k].stamina}`); paintBag(body); } });
    body.querySelectorAll('[data-ticket]').forEach(b => b.onclick = () => UI.ticketGift(b.dataset.ticket));
  }
  // 인테리어 티켓 선물 — 주민 선택
  UI.ticketGift = function (k) {
    const it = D.ITEMS[k];
    const vs = st().villagers.filter(v => !v.child);
    modal(`🎫 ${esc(it.name)} 선물하기`, `<p>누구의 방에 선물할까요? (암전 후 펑! 소리와 함께 방 전체가 즉시 변신)</p><div class="grid-btn">${vs.map(v => `<button data-v="${v.id}">${icon(v)} ${esc(v.name)}<small>${esc(FM.INTERIORS[v.home].name)}</small></button>`).join('')}</div>`, b => {
      b.querySelectorAll('[data-v]').forEach(x => x.onclick = () => {
        const v = Sim.byId(x.dataset.v);
        if (!Soc.takeItem(k)) return;
        closeModal();
        G().observeInterior(v.home);
        setTimeout(() => {
          if (it.special === 'autoInterior') Ev.autoInterior(v);
          else { const R = Ev.applyTheme(v, it.theme); UI.toast(`${v.name}: ${R.name}`); }
          G().rebuildInterior();
        }, 300);
      });
    });
  };

  // =========================================================
  // 신(God) 모드 개입 툴
  // =========================================================
  UI.mind = false;
  let godMode = null, godSel = [];
  function paintGod(body = $('#sideBody')) {
    body.innerHTML = `<p class="muted">중앙 코어 관찰 전용 '신(God) 모드' 개입 툴</p>
      <div class="god"><button id="gMind" class="${UI.mind ? 'on' : ''}">🔍 속마음 돋보기 ${UI.mind ? 'ON' : 'OFF'}</button><small>주민 머리 위에 현재 가장 크게 생각하는 단어가 떠올라요.</small></div>
      <div class="god"><button id="gTheme">🏠 방 인테리어 통째 바꾸기</button><small>모던, 공주풍, 우주선, 체육관 등 테마를 즉시 교체.</small></div>
      <div class="god"><button id="gSpark">✨ 운명의 불꽃 튀기기 (Spark)</button><small>서로 관심 없던 두 주민을 분수대로 불러내 강제로 눈을 맞춰요.</small></div>
      <div class="god"><button id="gDream">🌙 꿈속 침투 렌즈 (Dream Lens)</button><small>수면 중인 주민의 꿈 미니게임에 들어가 가품 아이템 획득.</small></div>
      <div class="god"><button id="gObs">🏢 아파트 전경 관찰 (O)</button><small>20개 창문 너머 방을 실시간 관찰, 창문을 누르면 줌인.</small></div>
      <div class="god"><button id="gEvent">🎲 섬 이벤트 강제 발생</button><small>기획서의 장소 이벤트를 골라 바로 일으켜요.</small></div>
      ${godMode ? `<p class="pick">👉 ${godMode === 'spark' ? `주민을 두 명 선택하세요 (${godSel.length}/2)` : godMode === 'dream' ? '자고 있는 주민을 선택하세요' : '방을 바꿀 주민을 선택하세요'} <button id="gCancel">취소</button></p>` : ''}`;
    $('#gMind').onclick = () => { UI.mind = !UI.mind; paintGod(body); };
    $('#gTheme').onclick = () => pickVillager('🏠 누구의 방을 바꿀까요?', v => !v.child, v => themePicker(v));
    $('#gSpark').onclick = () => pickVillagers2();
    $('#gDream').onclick = () => pickVillager('🌙 누구의 꿈에 침투할까요? (수면 중인 주민)', v => v.act && v.act.id === 'sleep', v => UI.dream(v));
    $('#gObs').onclick = () => G().observe();
    $('#gEvent').onclick = () => modal('🎲 섬 이벤트', `<div class="grid-btn">${Ev.EVENTS.map(e => `<button data-e="${e.id}">${esc(e.name)}</button>`).join('')}</div>`, b => b.querySelectorAll('[data-e]').forEach(x => x.onclick = () => { closeModal(); Ev.forceEvent(x.dataset.e); UI.toast('🎲 ' + x.textContent); }));
    if ($('#gCancel')) $('#gCancel').onclick = () => { godMode = null; godSel = []; paintGod(body); };
  }
  UI.godPick = function (id) { return false; void id; };
  function pickVillager(title, filter, cb) {
    const vs = st().villagers.filter(filter);
    modal(title, vs.length ? `<div class="grid-btn">${vs.map(v => `<button data-v="${v.id}">${icon(v)} ${esc(v.name)}<small>${esc(v.act ? v.act.name : '')}</small></button>`).join('')}</div>` : '<p class="muted">조건에 맞는 주민이 없어요.</p>', b => b.querySelectorAll('[data-v]').forEach(x => x.onclick = () => { closeModal(); cb(Sim.byId(x.dataset.v)); }));
  }
  function pickVillagers2() {
    const vs = st().villagers.filter(v => !v.child);
    const sel = [];
    modal('✨ 운명의 불꽃 — 두 주민 선택', `<div class="grid-btn">${vs.map(v => `<button data-v="${v.id}">${icon(v)} ${esc(v.name)}</button>`).join('')}</div>`, b => b.querySelectorAll('[data-v]').forEach(x => x.onclick = () => {
      x.classList.toggle('on'); const id = x.dataset.v; const i = sel.indexOf(id); if (i >= 0) sel.splice(i, 1); else sel.push(id);
      if (sel.length === 2) { closeModal(); Ev.spark(Sim.byId(sel[0]), Sim.byId(sel[1])); UI.toast('✨ 두 주민을 분수대로 불러냈어요!'); G().focusOn(0, 10); }
    }));
  }
  function themePicker(v) {
    const cats = {};
    for (const [id, t] of Object.entries(D.THEMES)) (cats[t.cat] = cats[t.cat] || []).push([id, t]);
    modal(`🏠 ${esc(v.name)}의 방 테마 즉시 교체`, Object.entries(cats).map(([c, list]) => `<h4>${esc(c)}</h4><div class="grid-btn">${list.map(([id, t]) => { const lv = Ev.reactLevel(Ev.themeScore(v, id)); return `<button data-t="${id}">${esc(t.name)}<small>예상 반응 ${D.THEME_REACT.find(r => r.lv === lv).name}</small></button>`; }).join('')}</div>`).join(''), b => b.querySelectorAll('[data-t]').forEach(x => x.onclick = () => {
      closeModal(); G().observeInterior(v.home);
      setTimeout(() => { const R = Ev.applyTheme(v, x.dataset.t, 'god'); UI.toast(`${v.name}: ${R.name} — ${R.text}`); G().rebuildInterior(); }, 300);
    }), true);
  }

  // =========================================================
  // 설정 / 도움말
  // =========================================================
  function paintSettings(body = $('#sideBody')) {
    const s = st(), p = s.player;
    body.innerHTML = `
      <label class="field">내 이름 <input id="setName" value="${esc(p.name)}" maxlength="8"></label>
      <div class="field">나의 성격 (자녀에게 유전) ${['L1', 'L2', 'L3', 'L4'].map((L, i) => `<select data-l="${L}">${Object.entries(D.LAYERS[i]).map(([k, x]) => `<option value="${k}" ${p.keys && p.keys[L] === k ? 'selected' : ''}>${x.icon || ''} ${x.name}</option>`).join('')}</select>`).join('')}</div>
      <div class="field">게임 속도 (실제 1초 = 게임 ${+(s.speed * (Sim.CLOCK || 1)).toFixed(1)}분) <div class="chips">${[0, 1, 4, 15, 60].map(n => `<button data-sp="${n}" class="${s.speed === n ? 'on' : ''}">${n ? '×' + n : '⏸'}</button>`).join('')}</div></div>
      <div class="field">볼륨 <input type="range" id="setVol" min="0" max="1" step="0.05" value="${FM.Audio.vol}"></div>
      <div class="field"><button class="btn small" id="setTitle">🏝️ 시작 화면으로</button> <button class="btn small" id="setAdd">➕ 새 주민 이주</button></div>
      <div class="field"><button class="btn small" id="setSkip">⏩ 1시간 건너뛰기</button> <button class="btn small" id="setSave">💾 지금 저장</button></div>
      <div class="field"><button class="btn small danger" id="setReset">🗑️ 섬 처음부터 다시 시작</button></div>
      <p class="muted">자동 저장: 10초마다 · 저장 키 ${D.SAVE_KEY}</p>`;
    $('#setName').onchange = e => { p.name = e.target.value.trim() || p.name; FM.W.rebuildBuilding('home_p'); };
    body.querySelectorAll('[data-l]').forEach(sel => sel.onchange = () => { p.keys[sel.dataset.l] = sel.value; });
    body.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => { s.speed = +b.dataset.sp; paintSettings(body); UI.paint(); });
    $('#setVol').oninput = e => FM.Audio.setVol(+e.target.value);
    $('#setTitle').onclick = () => UI.toTitle();
    $('#setAdd').onclick = () => UI.addVillager();
    $('#setSkip').onclick = () => { Sim.fastForward(60); UI.toast('⏩ 1시간이 흘렀어요'); };
    $('#setSave').onclick = () => { G().save(); UI.toast('💾 저장했어요'); };
    $('#setReset').onclick = () => { if (confirm('정말 섬을 처음부터 다시 시작할까요? (저장 데이터 삭제)')) G().reset(); };
  }
  function paintHelp(body = $('#sideBody')) {
    body.innerHTML = `<ul class="help">
      <li>⌨️ WASD/방향키 이동 · Shift 달리기 · <b>E/Space</b> 행동(대화·들어가기·지하철) · F 낚시 · B 곤충 채집 · C 앉기 · O 아파트 관찰 · M 지도 · 드래그 회전 · 휠 확대</li>
      <li>📱 왼쪽 아래 조이스틱, 오른쪽 아래 버튼 · 땅을 누르면 그곳으로 걸어가요</li>
      <li>📔 <b>폰 → 다이어리</b>: 매일 바뀌는 <b>오늘의 할 일 3개</b>(코인 보상 · 다 하면 보너스), 14일 <b>달력</b>(주민 생일 · 낚시 대회 · 유성우 · 아이 성장일), <b>업적</b></li>
      <li>🗞️ 소문은 주민에게 듣거나 엿들어야 소문 수첩에 적혀요. 엿들은 소문은 가끔 헛소문! 당사자에게 <b>🔍 사실이야?</b> 하고 확인해 보세요</li>
      <li>🗼 동쪽 곶의 <b>하얀 등대</b>: 노을 명소 · 밤엔 불빛이 돌아요. 등대 안 일지에 <b>숨겨진 장소</b>의 단서가 있어요</li>
      <li>🕳️ 섬에 빈 집이 없어지면 시티 타워 옆에 <b>지하 아파트</b>가 열려요 (12호실 · 최대 인구 +12)</li>
      <li>👶 아기 · 유아에게는 분유 · 자장가 · 까꿍 · 숨바꼭질 · 그림책 등 돌봄 행동을 할 수 있고, 자라면서 성장 드라마가 펼쳐져요</li>
      <li>⚙️ 설정에서 <b>드라마 빈도</b>(적게 · 보통 · 많이)를 바꿀 수 있어요</li>
      <li>🗺️ <b>M 지도</b>에서 장소나 주민을 누르면 ✨ 바로 가기(순간 이동) · 🚪 바로 들어가기 · 🚶 걸어서 가기(자동 길찾기) · 📍 목적지 표시를 할 수 있어요</li>
      <li>💬 주민과 대화하면 미연시 대화창이 열리고, 주민은 대화가 끝날 때까지 그 자리에서 기다려요. E/Space/Enter로 대사 넘기기 · 숫자 1~9로 선택지 고르기 · 📜 기록 보기</li>
      <li>📌 퀘스트는 화면 왼쪽 위에 다음 할 일과 방향 화살표가 떠요. ⭐ 노란 빛기둥이 목적지예요</li>
      <li>⏱️ 1초 = 게임 1분 (속도 조절 가능). 평일 09~18시 주민들은 남쪽 오피스로 출근해요</li>
      <li>❗ 주민 머리 위 <b>고민 풍선</b>이 뜨면 말을 걸어 코칭해 주세요 (분홍=짝사랑, 붉은=질투, 보라=권태기)</li>
      <li>🏢 시티 타워 20개 창문: 💭고민 · 🟢손님 · 💤수면(꿈 훔쳐보기) · 🔥싸움 · 💖고백 결심</li>
      <li>🚇 센트럴 환승역에서 동·서·남·북 지구로 지하철 이동 · 북쪽 고지대는 계단 → 구름다리로만 걸어갈 수 있어요</li>
      <li>💐 플레이어 연애: 호감도 80 + 설렘 70 이상일 때 '고백의 꽃다발' 선물 · 결혼: 연애 14일 + 호감도 95 + 설렘 80 + 2단계 집 + 약혼반지/청혼의 깃털</li>
      <li>🏠 방 꾸미기: 관찰 화면 → 🛠️ 방 꾸미기 (6개 레이어, 재질 8종, 색, DIY 무늬, 인테리어 코드)</li>
      <li>📋 기획서 반영 체크리스트: 저장소의 <b>SPEC_CHECKLIST.md</b></li></ul>
      <h4>🧩 이 섬 주민들의 성격 레이어</h4>${D.LAYER_NAMES.map((n, i) => `<details><summary>${n}</summary><ul class="list">${Object.values(D.LAYERS[i]).map(k => `<li>${k.icon || ''} <b>${k.name}</b> — ${esc(k.desc)}</li>`).join('')}</ul></details>`).join('')}`;
  }

  // =========================================================
  // 프로필
  // =========================================================
  UI.showProfile = function (v) {
    if (!v || v.staff) return;
    const s = st();
    const ks = [v.keys.L1, v.keys.L2, v.keys.L3, v.keys.L4];
    const S2 = v.stats;
    const topActs = Object.entries(S2.acts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([a, n]) => `${(D.ACTIONS[a] || {}).name || a} ${n}`).join(' · ');
    const rels = s.villagers.filter(o => o !== v && Soc.hasRel(v.id, o.id)).map(o => ({ o, r: Soc.rel(v.id, o.id), f: Soc.F(v.id, o.id), g: Soc.F(o.id, v.id) })).sort((a, b) => b.r.friendship_point - a.r.friendship_point);
    const rp = Soc.rel(v.id, P);
    const life = L.MAIN_LIFE[v.keys.L1];
    const combo = L.COMBO_LIFE.filter(c => c.keys.every(k => Sim.has(v, k)));
    const ex = D.COMBO_EXAMPLES.find(e => e.keys.every((k, i) => ks[i] === k));
    const m = Soc.marriageOf(v.id);
    const kids = Soc.childrenOf(v.id);
    const J2 = o => `<pre class="json">${esc(JSON.stringify(o, null, 1))}</pre>`;
    modal(`${icon(v)} ${esc(v.name)} ${v.nick ? `'${esc(v.nick)}'` : ''} — ${esc(v.title)}`, `
      <div class="prof">
        <div class="kw">${ks.map((k, i) => `<span class="k l${i + 1}" title="${esc(D.kw(k).desc)}"><small>${D.LAYER_NAMES[i]}</small>${D.kw(k).icon || ''} ${D.kw(k).name}</span>`).join('')}${(v.extraMain || []).map(k => `<span class="k l1"><small>추가 메인</small>${D.kw(k).icon} ${D.kw(k).name}</span>`).join('')}${v.child && v.child.third ? `<span class="k l3"><small>후천 발현</small>${kwName(v.child.third)}</span>` : ''}</div>
        ${ex ? `<p class="ex">📖 <b>${ex.title}</b> — ${esc(ex.pattern)}<br>💬 ${esc(ex.line)}<br>💕 ${esc(ex.love)}</p>` : ''}
        ${v.pattern ? `<p class="ex">🕐 24시간 행동 패턴 ${v.pattern}: "${Sim.PATTERN_NAMES[v.pattern]}"</p>` : ''}
        <div class="cols">
          <div><h4>📊 행동 스탯 (가중치 융합)</h4>
            <p>활동 범위: <b>${D.RANGE[S2.range].name}</b>${S2.excuse ? ' (외출 명분 있음)' : ''}<br>이동 속도: <b>${S2.speed >= 0 ? '+' : ''}${S2.speed}</b> (${v.speedLabel})<br>대기/휴식: <b>${S2.idle[0].toFixed(1)}~${S2.idle[1].toFixed(1)}초</b><br>행동 가중치: <small>${esc(topActs)}</small></p>
            <p>연애 성향: <b>${D.LOVE_ARCH[v.loveArch].name}</b><br><small>${D.LOVE_ARCH[v.loveArch].desc}</small><br>질투 유형: <b>${D.JEALOUS_TYPES[v.jealType]}</b><br>숨은 특징: ${v.quirks.map(esc).join(', ') || '없음'} · 취향 키워드: ${v.likesKeys.map(kwName).join(', ')}${v.likesSpecies ? ' · ' + (ISLE.SPECIES[v.likesSpecies] || {}).name : ''}</p>
            <p>선호 선물: ${v.giftLikes.join(', ')} · 비선호: ${v.giftDislikes.join(', ') || '-'}</p>
          </div>
          <div><h4>🧠 지금 상태</h4>
            <p>상태: <b>${(D.STATES[v.state] || { name: v.state }).name}</b> · 행동: ${esc(v.act ? v.act.name : '-')} · 손: ${esc(v.prop || '없음')}<br>스케줄: ${esc(v.blockLabel || '-')}<br>${FM.Schedule && FM.Schedule.describe(v) ? `📅 오늘 일정표: ${esc(FM.Schedule.describe(v))}<br>` : ''}위치: ${esc(locName(v))} · 집: ${esc(FM.INTERIORS[v.home] ? FM.INTERIORS[v.home].name : '-')}<br>직업: ${Sim.JOB_NAMES[v.job]} · 🪙 ${Math.floor(v.coins)} · 빚 ${v.debt}<br>
            배고픔 ${pct(v.hunger)}% · 에너지 ${pct(v.energy)} · 스트레스 ${pct(v.stress)} · 우울 ${pct(v.depression)} · 평판 ${pct(v.reputation)}<br>💭 속마음: <b>${esc(Sim.thought(v))}</b>${v.status.hospital ? `<br>🏥 입원 중: ${esc(v.status.disease)}` : ''}</p>
            <h4>🙋 나와의 관계</h4><p>${Soc.stageName(rp.friendship_stage)} · 친밀도 ${pct(rp.friendship_point)} · 신뢰도 ${pct(rp.trust_level)} · 우정 유형 ${D.FRIEND_ARCH[rp.friend_archetype].name}<br>설렘(→나) ${pct(Soc.F(v.id, P).romance)} · 상태 ${rp.status}${rp.permanent ? ' · 💎 영구 절친' : ''}</p>
          </div>
        </div>
        <h4>💞 성격별 연애 · 결혼 · 육아 (메인 성격: ${D.L1[v.keys.L1].name})</h4>
        <p class="life">💕 ${esc(life.love)}<br>💬 "${esc(life.loveLine)}"<br>💍 ${esc(life.marriage)}<br>👶 ${esc(life.parenting)}${combo.map(c => `<br>🔗 복합: ${esc(c.love)} / ${esc(c.parenting)}`).join('')}</p>
        ${v.crush ? `<h4>💗 짝사랑 데이터</h4>${J2({ crush_target_id: Sim.nameOf(v.crush.target), crush_intensity: v.crush.intensity, heartbreak_risk: v.crush.heartbreak_risk, crush_stage: v.crush.stage, secret_actions_done: v.crush.secret_actions_done, player_aware: v.crush.player_aware })}` : ''}
        ${v.jealousy && v.jealousy.meter > 0 ? `<h4>⚡ 질투 데이터</h4>${J2({ subject_npc_id: v.name, partner_npc_id: Sim.nameOf(v.jealousy.partner), rival_id: v.jealousy.rival ? Sim.nameOf(v.jealousy.rival) : null, jealousy_meter: Math.round(v.jealousy.meter), jealousy_threshold: 60, jealousy_type: v.jealousy.jealousy_type, rivalry_stage: v.jealousy.stage })}` : ''}
        ${m ? `<h4>💒 결혼 데이터</h4>${J2({ marriage_id: m.marriage_id, spouse_a_id: Sim.nameOf(m.spouse_a_id), spouse_b_id: Sim.nameOf(m.spouse_b_id), marriage_stage: m.marriage_stage, wedding_date: m.wedding_day + '일차', matrimonial_home_id: m.matrimonial_home_id, marital_satisfaction: Math.round(m.marital_satisfaction), shared_budget: m.shared_budget, family_tree_id: m.family_tree_id })}` : ''}
        ${v.child ? `<h4>🧬 유전 데이터 (Genetic Genome)</h4>${J2({ parents: v.child.parents.map(Sim.nameOf), growth_stage: v.child.stage, birth_date: v.child.birthDay + '일차', dna: v.child.dna, epigenetics: v.child.epigenetics, parenting_satisfaction: Math.round(v.child.parenting_satisfaction), attachment: Object.fromEntries(Object.entries(v.child.attach).map(([k, n]) => [Sim.nameOf(k), Math.round(n)])) })}` : ''}
        ${kids.length ? `<p>👶 자녀: ${kids.map(k => `${esc(k.name)} (${D.GROWTH.find(g => g.id === k.child.stage).name})`).join(', ')}</p>` : ''}
        <h4>👥 주민 관계 (친구 관계 시스템)</h4>
        <table class="rel"><tr><th>주민</th><th>단계</th><th>친밀</th><th>신뢰</th><th>유형</th><th>설렘 →/←</th><th>상태</th></tr>
        ${rels.slice(0, 20).map(({ o, r, f, g }) => `<tr><td>${icon(o)} ${esc(o.name)}</td><td>${Soc.stageName(r.friendship_stage)}</td><td>${pct(r.friendship_point)}</td><td>${pct(r.trust_level)}</td><td>${D.FRIEND_ARCH[r.friend_archetype].name}</td><td>${pct(f.romance)} / ${pct(g.romance)}</td><td>${r.status === 'NONE' ? '' : r.status}${r.status === 'DATING' || r.status === 'MARRIED' ? ` (권태 ${pct(r.boredom)} ${D.BOREDOM_STAGES.find(x => x.id === Soc.boredomStage(r)).name})` : ''}${r.misunderstanding && r.misunderstanding.until > Sim.time.day() ? ' 😤오해' : ''}</td></tr>`).join('')}</table>
        <div class="md-actions"><button class="btn small" id="pfTalk">💬 말 걸기</button> <button class="btn small" id="pfGo">📍 찾아가기</button> <button class="btn small" id="pfRoom">🔭 방 관찰</button> <button class="btn small" id="pfFam">🌳 가계도</button></div>
      </div>`, b => {
      $('#pfTalk').onclick = () => { closeModal(); UI.goTo(v); setTimeout(() => UI.talk(v), 500); };
      $('#pfGo').onclick = () => { closeModal(); UI.goTo(v); };
      $('#pfRoom').onclick = () => { closeModal(); if (v.home.startsWith('apt')) G().observe(v.home); else G().observeInterior(v.home); };
      $('#pfFam').onclick = () => UI.familyTree();
    }, true);
  };

  // 통합 가계도
  UI.familyTree = function () {
    const s = st();
    const ms = s.marriages;
    const node = id => { const v = id === P ? { name: s.player.name + ' (나)', look: s.player.look } : Sim.byId(id); return v ? `${icon(v)} ${esc(v.name)}` : '?'; };
    const kidsOf = (a, b) => s.villagers.filter(v => v.child && v.child.parents.includes(a) && v.child.parents.includes(b));
    modal('🌳 마을 가계도 (Family Tree)', ms.length ? ms.map(m => `<div class="fam"><div class="couple">${node(m.spouse_a_id)} ${m.marriage_stage === 'DIVORCED' ? '💔' : '💍'} ${node(m.spouse_b_id)} <small>${m.marriage_stage} · ${esc(m.family_tree_id)}</small></div><div class="kids">${kidsOf(m.spouse_a_id, m.spouse_b_id).map(k => `<span>└ ${node(k.id)} <small>${D.GROWTH.find(g => g.id === k.child.stage).name}${k.child.third ? ' · ' + kwName(k.child.third) : ''}</small></span>`).join('') || '<small class="muted">자녀 없음</small>'}</div></div>`).join('') : '<p class="muted">아직 결혼한 주민이 없어요.</p>');
  };

  // =========================================================
  // 주민 추가 / 캐릭터 만들기에서 데려오기
  // =========================================================
  UI.addVillager = function (look, name) {
    if (st().villagers.filter(v => !v.child).length >= Sim.MAX_VILLAGERS || !Sim.freeHome()) return UI.toast(`섬이 가득 찼어요! (최대 ${Sim.MAX_VILLAGERS}명)`);
    const sel = (i, id) => `<select data-l="${id}"><option value="">🎲 무작위</option>${Object.entries(D.LAYERS[i]).map(([k, x]) => `<option value="${k}">${x.icon || ''} ${x.name}</option>`).join('')}</select>`;
    modal('➕ 새 주민 이주', `<label class="field">이름 <input id="avName" maxlength="8" value="${esc(name || '')}" placeholder="비우면 자동"></label>
      <div class="field">4-Layer 성격 (비우면 무작위 조합)${['L1', 'L2', 'L3', 'L4'].map((id, i) => `<div><small>${D.LAYER_NAMES[i]}</small> ${sel(i, id)}</div>`).join('')}
      <div><small>추가 메인 성격 (선택 — 모순 조합 실험용)</small> <select id="avExtra"><option value="">없음</option>${Object.entries(D.L1).map(([k, x]) => `<option value="${k}">${x.icon} ${x.name}</option>`).join('')}</select></div></div>
      <p class="muted">${look ? '🎨 캐릭터 만들기에서 가져온 외모' : '외모는 무작위로 만들어져요 (캐릭터 만들기 연동 가능)'}</p>
      <button class="btn" id="avGo">🏠 입주!</button>`, b => {
      $('#avGo').onclick = () => {
        const keys = {};
        b.querySelectorAll('[data-l]').forEach(s2 => { keys[s2.dataset.l] = s2.value || Sim.u.pick(Object.keys(D.LAYERS[+s2.dataset.l[1] - 1])); });
        const extra = $('#avExtra').value;
        const v = Sim.makeVillager({ keys, look: look || undefined, name: $('#avName').value.trim() || undefined, extraMain: extra && extra !== keys.L1 ? [extra] : [] });
        Sim.moveIn(v);
        closeModal(); UI.toast(`🏠 ${v.name} (${v.title}) 입주!`);
        UI.tab('villagers');
      };
    });
  };
  UI.importCreator = function () {
    const cr = readCreator();
    if (!cr || !cr.characters.length) return modal('🎨 캐릭터 만들기', '<p>아직 만든 캐릭터가 없어요. <a href="creator.html">캐릭터 만들기</a>에서 주민을 만들어 보세요!</p>');
    modal('🎨 캐릭터 만들기에서 데려오기', `<div class="grid-btn">${cr.characters.map(c => `<button data-c="${c.id}">${icon(c)} ${esc(c.name || '이름 없음')}</button>`).join('')}</div>`, b => b.querySelectorAll('[data-c]').forEach(x => x.onclick = () => { const c = cr.characters.find(y => y.id === x.dataset.c); closeModal(); UI.addVillager(ISLE.normalizeLook(c.look), c.name); }));
  };

  // =========================================================
  // 장소별 기능
  // =========================================================
  const SHOP_NAMES = { mall: '💎 플래티넘 타워 쇼핑몰', conv: '🏪 24시 편의점', cafe: '☕ 카페 앙상블', pharmacy: '💊 24시 약국', library: '📚 도서관 북카페', workshop: '🔨 마을 공방', tea: '🍵 달빛 차관', pocha: '🍜 심야 포장마차', flea: '🧺 플리마켓' };
  UI.shop = function (key) {
    const p = st().player;
    const items = Object.entries(D.ITEMS).filter(([, it]) => it.shop === key);
    const sell = ['fish_catch', 'bug_jar', 'dream_item', 'face_copy', 'rare_fruit', 'veggie_basket', 'big_fish'].filter(k => p.inv[k]);
    modal(SHOP_NAMES[key] || '상점', `<p>🪙 ${Math.floor(p.coins).toLocaleString()} 코인</p><div class="bag">${items.map(([k, it]) => `<div class="it"><span>${it.icon}</span><b>${esc(it.name)}</b><small>${it.price} 🪙</small><button data-buy="${k}">사기</button></div>`).join('')}</div>
      ${sell.length ? `<h4>팔기</h4><div class="bag">${sell.map(k => `<div class="it"><span>${D.ITEMS[k].icon}</span><b>${esc(D.ITEMS[k].name)}</b><small>×${p.inv[k]}</small><button data-sell="${k}">팔기 (+80)</button></div>`).join('')}</div>` : ''}`, b => {
      b.querySelectorAll('[data-buy]').forEach(x => x.onclick = () => { const k = x.dataset.buy, it = D.ITEMS[k]; if (p.coins < it.price) return UI.toast('코인이 부족해요'); p.coins -= it.price; Soc.giveItem(k); FM.Audio.sfx('coin'); if (FM.Consume) { closeModal(); FM.Consume.afterBuy(k); return; } UI.toast(`${it.icon} ${it.name} 구입!`); UI.shop(key); });
      b.querySelectorAll('[data-sell]').forEach(x => x.onclick = () => { if (Soc.takeItem(x.dataset.sell)) { p.coins += 80; FM.Audio.sfx('coin'); UI.shop(key); } });
    });
  };
  UI.metro = function (from) {
    modal('🚇 센트럴 메트로 — 어디로 갈까요?', `<p class="muted">동, 서, 남, 북 모든 노선은 센트럴 환승역을 거쳐요.</p><div class="grid-btn">${Object.entries(MAP.STATIONS).filter(([k]) => k !== from).map(([k, s]) => `<button data-s="${k}">Ⓜ ${esc(s.name)}<small>${MAP.DISTRICTS[s.district].name}</small></button>`).join('')}</div>`, b => b.querySelectorAll('[data-s]').forEach(x => x.onclick = () => {
      const s = MAP.STATIONS[x.dataset.s], p = st().player;
      closeModal(); G().fade(0.6);
      setTimeout(() => { p.x = s.x + 1; p.z = s.z + 2.5; Sim.get().time += from !== 'C' && x.dataset.s !== 'C' ? 6 : 3; UI.toast(`🚇 ${s.name} 도착!`); }, 250);
    }));
  };
  UI.apartmentMenu = function () {
    const s = st();
    const rooms = FM.APT_ROOMS.map(id => ({ id, v: s.villagers.find(v => v.home === id) }));
    modal('🏢 시티 타워', `<button class="btn" id="apObs">🔭 2.5D 전경 관찰 모드</button><h4>🚪 주민 방 방문 (직접 들어가기)</h4><div class="grid-btn">${rooms.map(r => `<button data-r="${r.id}" ${r.v ? '' : 'disabled'}>${FM.INTERIORS[r.id].name}<small>${r.v ? icon(r.v) + ' ' + esc(r.v.name) : '빈 방'}</small></button>`).join('')}</div>`, b => {
      $('#apObs').onclick = () => { closeModal(); G().observe(); };
      b.querySelectorAll('[data-r]').forEach(x => x.onclick = () => { closeModal(); G().enterInterior(x.dataset.r); });
    });
  };
  UI.mailbox = function () {
    const s = st();
    const ms = s.mail.slice().reverse();
    modal('📮 우편함', ms.length ? ms.map((m, i) => `<div class="mail ${m.read ? 'read' : ''}"><b>${icon(Sim.byId(m.from))} ${esc(Sim.nameOf(m.from))}</b> <small>${m.day}일차</small><p>${esc(J(m.text))}</p>${m.item && !m.taken ? `<button data-i="${s.mail.indexOf(m)}">${D.ITEMS[m.item].icon} ${esc(D.ITEMS[m.item].name)} 받기</button>` : ''}</div>`).join('') : '<p class="muted">편지가 없어요.</p>', b => {
      s.mail.forEach(m => { m.read = true; });
      b.querySelectorAll('[data-i]').forEach(x => x.onclick = () => { const m = s.mail[+x.dataset.i]; m.taken = true; Soc.giveItem(m.item); UI.toast(`${D.ITEMS[m.item].icon} 받았어요!`); UI.mailbox(); });
      UI.paint();
    });
  };
  UI.chest = function () {
    const p = st().player;
    const c = p.chest || [];
    modal('🧺 신혼집 수납장', c.length ? `<ul class="list">${c.map(x => `<li>${x.coins ? `🪙 ${x.coins} 골드` : `${D.ITEMS[x.item].icon} ${D.ITEMS[x.item].name}`}</li>`).join('')}</ul><button class="btn" id="chTake">모두 꺼내기</button>` : '<p class="muted">비어 있어요. 배우자가 매일 아침 "마을에서 주워왔어!"라며 넣어둬요.</p>', () => {
      if ($('#chTake')) $('#chTake').onclick = () => { for (const x of c) { if (x.coins) p.coins += x.coins; else Soc.giveItem(x.item); } p.chest = []; FM.Audio.sfx('coin'); closeModal(); UI.toast('🧺 수납장을 비웠어요!'); };
    });
  };
  UI.wish = function () {
    const p = st().player;
    if (!p.inv.wish_coin) { if (p.coins < 100) return UI.toast('소원 동전(100🪙)을 살 코인이 부족해요'); p.coins -= 100; Soc.giveItem('wish_coin'); }
    Soc.takeItem('wish_coin');
    const ok = Ev.playerWish();
    UI.toast(ok ? '✨ 동전이 정중앙에 빠져 빛이 났어요! 24시간 동안 고백 성공률 +20%' : '🪙 퐁당... 아쉽게 정중앙은 아니었어요');
  };
  UI.aisle = function () {
    const opts = { rose: '🌹 장미', tulip: '🌷 튤립', lily: '🤍 백합', sunflower: '🌻 해바라기', lavender: '💜 라벤더' };
    modal('💐 야외 버진로드 꽃 바꾸기', `<div class="grid-btn">${Object.entries(opts).map(([k, n]) => `<button data-f="${k}">${n}</button>`).join('')}</div>`, b => b.querySelectorAll('[data-f]').forEach(x => x.onclick = () => { st().flags.aisleFlower = x.dataset.f; closeModal(); UI.toast('💐 버진로드 꽃을 바꿨어요'); }));
  };
  UI.flea = function () {
    const s = st(), p = s.player;
    modal('🧺 주말 플리마켓', `<div class="bag">${s.flea.stalls.map((x, i) => `<div class="it"><span>${x.item.icon}</span><b>${esc(x.item.name)}</b><small>${esc(Sim.nameOf(x.who))} · ${x.item.price.toLocaleString()}원</small>${x.sold ? '<small>판매 완료</small>' : `<button data-i="${i}">흥정해서 사기 (${Math.round(x.item.price / 10)}🪙)</button>`}</div>`).join('')}</div>`, b => b.querySelectorAll('[data-i]').forEach(x => x.onclick = () => {
      const stall = s.flea.stalls[+x.dataset.i]; const price = Math.round(stall.item.price / 10);
      if (p.coins < price) return UI.toast('코인이 부족해요');
      p.coins -= price; stall.sold = true; (p.fleaItems = p.fleaItems || []).push(stall.item.name);
      const sv = Sim.byId(stall.who); if (sv) { sv.coins += price; Soc.addFriend(sv.id, P, 3, 2); }
      s.flea.sold = s.flea.sold || []; s.flea.sold.push({ who: Sim.nameOf(stall.who), item: stall.item.name, price: stall.item.price });
      UI.flea();
    }));
  };
  UI.guestbook = function () {
    const g = st().guestbook || [];
    modal('📜 달빛 차관 방명록', g.length ? `<ul class="list">${g.slice().reverse().map(x => `<li>"${esc(x.poem)}" <small>— ${esc(Sim.nameOf(x.who))}, ${x.day}일차</small></li>`).join('')}</ul>` : '<p class="muted">아직 비어 있어요.</p>');
  };
  UI.ferryBook = function () {
    const g = st().guestbookFerry || [];
    modal('⛴️ 페리 선착장 방명록 (이웃 섬 손님)', g.length ? `<ul class="list">${g.slice().reverse().map(x => `<li><b>${esc(x.name)}</b>: ${esc(x.text)} <small>${x.day}일차</small></li>`).join('')}</ul>` : '<p class="muted">아직 방문객이 없어요.</p>');
  };
  UI.partTime = function () {
    const p = st().player;
    if (p.stamina < 20) return UI.toast('너무 지쳤어요. 음식을 먹거나 쉬세요');
    p.stamina -= 20; const pay = Sim.u.rint(100, 300); p.coins += pay; Sim.fastForward(60);
    FM.Audio.sfx('coin'); UI.toast(`💼 1시간 아르바이트! +${pay} 시티 코인 (스태미나 -20)`);
  };
  UI.cityHall = function () {
    const s = st(), p = s.player;
    const lv = p.houseLevel || 1;
    const next = FM.HOUSE_LEVELS[lv];
    const spouse = p.spouse && Sim.byId(p.spouse);
    const freeP = Soc.freePlots();
    modal('🏛️ 시티 행정 복합 센터 & 법원', `
      <h4>🏷️ 개명 & 별명 신청</h4><div class="grid-btn">${s.villagers.map(v => `<button data-nick="${v.id}">${icon(v)} ${esc(v.name)}<small>${v.nick ? esc(v.nick) : '별명 없음'}</small></button>`).join('')}</div>
      <h4>🌳 가계도</h4><button class="btn small" id="chFam">통합 가계도 보기</button>
      <h4>🏡 집 증축</h4>${next ? `<p>현재: ${FM.HOUSE_LEVELS[lv - 1].name} → <b>${next.name}</b> (${next.price.toLocaleString()} 🪙)</p><button class="btn small" id="chUp">증축하기</button>` : '<p>최대 단계예요.</p>'}
      <h4>🏘️ 커스텀 빌라 부지 하사</h4><p class="muted">아파트에서 독립하는 주민, 신혼부부, 절친 룸메이트에게 빌라 부지를 줄 수 있어요. 빈 부지 ${freeP.length}곳</p>${freeP.length ? `<button class="btn small" id="chGrant">부지 하사하기</button>` : ''}
      ${spouse ? `<h4>⚖️ 이혼 조정 신청 (DIVORCE_HEARING)</h4><button class="btn small danger" id="chDiv">${esc(spouse.name)}와(과) 이혼 조정</button>` : ''}`, b => {
      b.querySelectorAll('[data-nick]').forEach(x => x.onclick = () => { const v = Sim.byId(x.dataset.nick); const n = prompt(`${v.name}의 새 별명`, v.nick || ''); if (n !== null) { v.nick = n.slice(0, 10); UI.toast(`🏷️ ${v.name}의 별명: ${v.nick || '없음'}`); UI.cityHall(); } });
      $('#chFam').onclick = () => UI.familyTree();
      if ($('#chUp')) $('#chUp').onclick = () => { if (p.coins < next.price) return UI.toast('코인이 부족해요'); p.coins -= next.price; p.houseLevel = lv + 1; const room = s.rooms.home_p_in; if (room) { const sz = Sim.interiorSize('home_p_in'); room.furn.forEach(f => { f.x *= sz.w / FM.HOUSE_LEVELS[lv - 1].w; f.z *= sz.d / FM.HOUSE_LEVELS[lv - 1].d; }); } UI.toast(`🏡 집을 ${next.name}(으)로 증축했어요!`); closeModal(); };
      if ($('#chGrant')) $('#chGrant').onclick = () => UI.grantPlot();
      if ($('#chDiv')) $('#chDiv').onclick = () => { if (!confirm('정말 이혼 조정을 신청할까요?')) return; const r = Soc.rel(spouse.id, P); Soc.doBreakup(r, 'PERSONALITY_CLASH'); p.spouse = null; p.lover = null; const m = Soc.marriageOf(spouse.id); if (m) m.marriage_stage = 'DIVORCED'; const room = Sim.freeHome(); if (room) { Soc.moveHome(spouse, room); s.rooms[room] = s.rooms[room] || FM.defaultRoom(spouse); } Sim.log('divorce', `⚖️ ${p.name}와(과) ${spouse.name}이(가) 이혼했어요.`, [P, spouse.id], 3); closeModal(); };
    }, true);
  };
  UI.grantPlot = function () {
    const plots = Soc.freePlots();
    const vs = st().villagers.filter(v => !v.child);
    modal('🏘️ 부지 하사', `<label class="field">부지 <select id="gpPlot">${plots.map(p => `<option value="${p.id}">${esc(MAP.P[p.id].name)} (${p.size === 'large' ? '신혼/절친 대형 획지' : '독채'})</option>`).join('')}</select></label>
      <div class="field">주민 (1~2명)<div class="chk-list">${vs.map(v => `<label><input type="checkbox" class="gpV" value="${v.id}"> ${icon(v)} ${esc(v.name)}</label>`).join('')}</div></div><button class="btn" id="gpGo">하사하기</button>`, () => {
      $('#gpGo').onclick = () => { const ids = [...document.querySelectorAll('.gpV:checked')].map(x => x.value).slice(0, 2); if (!ids.length) return; Soc.grantPlot($('#gpPlot').value, ids); closeModal(); UI.toast('🏡 부지를 하사했어요!'); };
    });
  };
  UI.babyOffer = function (m) {
    const other = m.spouse_a_id === P ? m.spouse_b_id : m.spouse_a_id;
    modal('👶 아기 탄생 / 입양 이벤트', `<p>${esc(Sim.nameOf(other))}와(과)의 결혼 생활이 14일을 넘었고 만족도가 ${Math.round(m.marital_satisfaction)}예요.<br>새 가족을 맞이할까요? (신혼집에 요람이 추가돼요)</p><button class="btn" id="bbYes">👶 가족 맞이하기</button> <button class="btn ghost" id="bbNo">다음에</button>`, () => {
      $('#bbYes').onclick = () => { closeModal(); Soc.makeChild(P, other); };
      $('#bbNo').onclick = closeModal;
    });
  };

  // =========================================================
  // 관찰 카메라 UI & 라이브 룸 시뮬레이션
  // =========================================================
  UI.onView = function (v) {
    $('#obs').hidden = v !== 'observe';
    if (v !== 'observe' && UI.editing) UI.closeEditor();
    paintObs();
  };
  function paintObs() {
    const o = $('#obs');
    const g = G();
    if (g.view !== 'observe') return;
    const s = st();
    if (!g.obs) { o.innerHTML = `<div class="obs-top"><b>🏢 5층 메가 아파트 '시티 타워' — 2.5D 전경 그리드 뷰</b><small>창문을 누르면 방 안으로 줌인해요. 💭고민 🟢손님 💤수면 🔥싸움 💖고백 결심</small><button id="obX">✕ 관찰 종료</button></div>`; $('#obX').onclick = () => g.endObserve(); return; }
    const iid = g.obs;
    const room = s.rooms[iid];
    const who = s.villagers.filter(v => v.loc === iid);
    const owner = s.villagers.find(v => v.home === iid);
    o.innerHTML = `<div class="obs-top"><b>🔭 ${esc(FM.INTERIORS[iid].name)}${owner ? ' · ' + icon(owner) + ' ' + esc(owner.name) : ''}</b>
      <div class="chips"><button data-cm="window" class="${g.camMode === 'window' ? 'on' : ''}">🪟 2D 창문 정면 뷰</button><button data-cm="orbit" class="${g.camMode === 'orbit' ? 'on' : ''}">🎥 3D 풀 오비트</button></div>
      ${FM.INTERIORS[iid].place === 'apartment' ? '<button id="obBack">← 전경으로</button>' : ''}<button id="obX">✕</button></div>
      <div class="obs-body">
        <div class="obs-sec"><b>🧠 주민 심리 센서</b>${who.length ? who.map(v => `<div class="sensor">${icon(v)} <b>${esc(v.name)}</b> 배고픔 ${pct(v.hunger)}% · ${esc(v.act ? v.act.name : v.moving ? '돌아다니는 중' : '딴짓 중')}<br><small>💭 ${esc(Sim.thought(v))} · 스트레스 ${pct(v.stress)} · 기분 ${pct(v.mood)}</small> <button data-talk="${v.id}">💬</button>${v.act && v.act.id === 'sleep' && v.dream ? ` <button data-dream="${v.id}">🌙 꿈 훔쳐보기</button>` : ''}</div>`).join('') : '<small class="muted">지금은 아무도 없어요.</small>'}</div>
        ${room ? `<div class="obs-sec"><b>🧹 방 청결도</b><div class="bar"><i style="width:${pct(room.clean)}%"></i></div><small>쓰레기 ${room.trash.length}개${room.theme ? ' · 테마: ' + esc(D.THEMES[room.theme].name) : ''}${room.unity ? ` · 테마 통일도 ${room.unity}%` : ''}${room.set ? ' · ✨세트 효과' : ''}${room.react !== undefined ? ' · 반응 ' + D.THEME_REACT.find(r => r.lv === room.react).name : ''}</small>
          <div class="chips"><button id="obVac">🌀 신의 청소기</button>${owner && !owner.child ? '<button id="obOrder">🧹 "방 좀 치워!"</button>' : ''}</div></div>
        <div class="obs-sec"><div class="chips"><button id="obEdit">🛠️ 방 꾸미기 (스타일 · 분위기 · 조명 · 음악)</button></div></div>` : ''}
      </div>`;
    o.querySelectorAll('[data-cm]').forEach(b => b.onclick = () => { g.camMode = b.dataset.cm; paintObs(); });
    if ($('#obBack')) $('#obBack').onclick = () => g.observe();
    $('#obX').onclick = () => g.endObserve();
    o.querySelectorAll('[data-talk]').forEach(b => b.onclick = () => UI.talk(Sim.byId(b.dataset.talk)));
    o.querySelectorAll('[data-dream]').forEach(b => b.onclick = () => UI.dream(Sim.byId(b.dataset.dream)));
    if (!room) return;
    $('#obVac').onclick = () => { const n = Ev.vacuum(iid); UI.toast(`🌀 쓰레기 ${n}개를 빨아들였어요!`); g.rebuildInterior(); paintObs(); };
    if ($('#obOrder')) $('#obOrder').onclick = () => { Soc.playerChoose(owner, 'cleanOrder'); setTimeout(() => g.rebuildInterior(), 6000); };
    $('#obEdit').onclick = () => UI.openRoomEditor(iid);
  }
  let obsT = 0;

  // =========================================================
  // 방 꾸미기 — 3D 스마트 그리드 배치
  // =========================================================
  UI.editing = false; UI.placing = null;
  let edIid = null, edSel = null;
  const edList = { q: '', style: '', open: false };   // 가구 목록 검색어 · 스타일 필터 · 펼침 상태 (다시 그려도 유지)
  UI.openRoomEditor = function (iid) {
    if (iid === 'home_p_in') Sim.ensurePlayerRoom();
    const g = G();
    if (g.view !== 'observe' || g.obs !== iid) g.observeInterior(iid);
    edIid = iid; UI.editing = true; edSel = null; UI.placing = null;
    g.camMode = 'orbit';
    paintEditor();
  };
  UI.closeEditor = function () {
    UI.editing = false; UI.placing = null;
    $('#editor').hidden = true;
    const s = st();
    const room = s.rooms[edIid];
    if (room) {
      room.lastDecor = Sim.time.day();
      if (room.edited) { room.atmoRev = (room.atmoRev || 1) + 1; room.atmoByPlayer = true; }
      const set = Ev.checkSet(edIid);
      // 주민 방을 꾸며주었을 때의 반응
      const owner = s.villagers.find(v => v.home === edIid && !v.child);
      if (owner && room.edited) { room.edited = false; if (room.unityTheme && room.unity >= 50) Ev.reactToRoom(owner, room.unityTheme, 'custom'); else { Soc.addFriend(owner.id, P, 3, 2, '방 꾸미기'); Sim.say(owner, L.sty(owner, '방을 꾸며줘서 고마워')); } }
      void set;
    }
    G().rebuildInterior();
  };
  UI.selectFurn = function (idx) { edSel = idx; UI.placing = null; paintEditor(); };
  UI.moveFurnTo = function (x, z) {
    const room = st().rooms[edIid]; if (!room || edSel === null) return;
    const { w, d } = Sim.interiorSize(edIid);
    const f = room.furn[edSel];
    f.x = Math.round(Math.max(-w / 2 + 0.3, Math.min(w / 2 - 0.3, x)) * 4) / 4; f.z = Math.round(Math.max(-d / 2 + 0.3, Math.min(d / 2 - 0.3, z)) * 4) / 4;   // 0.25m 그리드 스냅
    if ((FM.FURN[f.type] || {}).wall) { const ws = wallSnap(x, z, w, d); f.x = ws.x; f.z = ws.z; f.rot = ws.rot; }
    room.edited = true; UI.placing = null;
    G().rebuildInterior(); paintEditor();
  };
  // 이미지 파일 고르기 → 가구 그림 비율에 맞춰 잘라서 JPEG로 저장 (저장 공간 절약)
  UI.pickImage = function (type, cb) {
    const F = FM.FURN[type]; const pic = F && F.parts.find(q => (q[8] || '').includes('pic'));
    const aspect = pic ? pic[1] / pic[2] : 0.7;
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => {
      const file = inp.files && inp.files[0]; if (!file) return;
      if (!/^image\//.test(file.type)) return UI.toast('이미지 파일만 붙일 수 있어요');
      const rd = new FileReader();
      rd.onload = () => {
        const img = new Image();
        img.onload = () => {
          const H = 384, W = Math.round(H * aspect);
          const c = document.createElement('canvas'); c.width = W; c.height = H;
          const g = c.getContext('2d');
          const s = Math.max(W / img.width, H / img.height);   // 꽉 채우기 (가운데 기준 자르기)
          const dw = img.width * s, dh = img.height * s;
          g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
          g.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
          let url = c.toDataURL('image/jpeg', 0.82);
          if (url.length > 140000) url = c.toDataURL('image/jpeg', 0.6);
          const total = Object.values(st().rooms).reduce((n, r) => n + (r.furn || []).filter(q => q.img).length, 0);
          if (total >= 30) return UI.toast('사진은 섬 전체에 30장까지 붙일 수 있어요 (저장 공간)');
          cb(url);
        };
        img.onerror = () => UI.toast('이미지를 읽지 못했어요');
        img.src = rd.result;
      };
      rd.readAsDataURL(file);
    };
    inp.click();
  };
  // 끌어서 옮기기: 미리보기(가구 메쉬만 이동) → 놓으면 확정
  function wallSnap(x, z, w, d) {
    const dl = x + w / 2, dr = w / 2 - x, db = z + d / 2;
    const m = Math.min(dl, dr, db);
    if (m === db) return { x: Math.max(-w / 2 + 0.4, Math.min(w / 2 - 0.4, x)), z: -d / 2 + 0.06, rot: 0 };
    if (m === dl) return { x: -w / 2 + 0.06, z: Math.max(-d / 2 + 0.4, Math.min(d / 2 - 0.4, z)), rot: 90 };
    return { x: w / 2 - 0.06, z: Math.max(-d / 2 + 0.4, Math.min(d / 2 - 0.4, z)), rot: -90 };
  }
  UI.dragFurn = function (idx, x, z, commit) {
    const room = st().rooms[edIid]; if (!room || !room.furn[idx]) return;
    const f = room.furn[idx], F = FM.FURN[f.type] || {};
    const { w, d } = Sim.interiorSize(edIid);
    let nx, nz, rot = f.rot || 0;
    if (F.wall) { const ws = wallSnap(x, z, w, d); nx = ws.x; nz = ws.z; rot = ws.rot; }
    else { nx = Math.round(Math.max(-w / 2 + 0.3, Math.min(w / 2 - 0.3, x)) * 4) / 4; nz = Math.round(Math.max(-d / 2 + 0.3, Math.min(d / 2 - 0.3, z)) * 4) / 4; }
    const g = G().interior;
    const o = g && g.furnObjs.find(q => q.userData.furnIdx === idx);
    if (!commit) { if (o) { o.position.set(nx, 0.05, nz); o.rotation.y = rot * Math.PI / 180; } return; }
    f.x = nx; f.z = nz; f.rot = rot; room.edited = true; UI.placing = null;
    FM.Audio.sfx('pop');
    G().rebuildInterior(); paintEditor();
  };
  // 편집 중 키보드: Q/R 회전, 방향키 0.25m 이동, Delete 회수
  UI.editKey = function (e) {
    if (edSel === null || !$('#edRot')) return false;
    const room = st().rooms[edIid]; const f = room && room.furn[edSel]; if (!f) return false;
    const mv = { ArrowLeft: [-0.25, 0], ArrowRight: [0.25, 0], ArrowUp: [0, -0.25], ArrowDown: [0, 0.25] }[e.code];
    if (mv) { UI.dragFurn(edSel, f.x + mv[0], f.z + mv[1], true); return true; }
    if (e.code === 'KeyQ' || e.code === 'KeyR') { f.rot = ((f.rot || 0) + (e.code === 'KeyQ' ? -45 : 45) + 360) % 360; room.edited = true; G().rebuildInterior(); return true; }
    if (e.code === 'Delete' || e.code === 'Backspace') { $('#edDel').click(); return true; }
    return false;
  };
  function paintEditor() {
    const e = $('#editor');
    const s = st();
    const room = s.rooms[edIid];
    if (!room) { e.hidden = true; return; }
    e.hidden = false;
    const f = edSel !== null ? room.furn[edSel] : null;
    const F = f ? FM.FURN[f.type] : null;
    const isOwn = edIid === 'home_p_in';
    const cats = ['rest', 'work', 'smart', 'wall', 'light', 'misc'];
    const floorKinds = ['wood', 'log', 'tile', 'marble', 'carpet', 'metal', 'candy', 'water', 'mat', 'sand', 'slate', 'checker', ...Object.keys(FM.FLOOR_DRAW || {})];
    e.innerHTML = `<div class="ed-head"><b>🛠️ 방 꾸미기 — ${esc(FM.INTERIORS[edIid].name)}</b><button id="edX">완료</button></div>
      <div class="ed-body">
        ${f ? `<div class="ed-sec sel"><b>선택: ${esc(F.name)}</b> <small>(${FM.FURN_LAYERS[F.layer]})</small>
          <div class="chips"><button id="edMove" class="${UI.placing !== null ? 'on' : ''}">✥ 옮기기 (바닥 클릭)</button><button id="edRot">↻ 회전</button><button id="edDel">🗑️ 회수</button></div>
          <div class="chips">${Object.entries(D.MATERIALS).map(([k, m]) => `<button data-mat="${k}" class="${f.mat === k ? 'on' : ''}" style="--c:${FM.PM.css(m.color)}">${m.name}</button>`).join('')}<button data-mat="">기본</button></div>
          <label>색 <input type="color" id="edCol" value="${f.color ? FM.PM.css(f.color) : '#ffffff'}"></label> <button id="edColClear" class="small">색 초기화</button>
          ${F.photo ? `<div class="chips photo-chips"><button id="edImg" class="main">🖼️ 내 이미지 붙이기</button>${f.img ? '<button id="edImgX">✖ 이미지 떼기</button>' : ''}</div>${f.img ? `<img class="ed-thumb" src="${f.img}" alt="">` : '<small class="muted">내 사진이나 그림 파일을 골라서 붙일 수 있어요</small>'}` : ''}</div>` : '<p class="muted">🖐️ 방 안의 가구를 <b>잡고 끌면</b> 옮겨져요 (벽걸이는 벽에 착 붙어요).<br>선택 후 <b>Q/R</b> 회전 · <b>방향키</b> 미세 이동 · <b>Delete</b> 회수</p>'}
        ${FM.RoomKit ? (() => { const owner = s.villagers.find(v => v.home === edIid && !v.child); const keys = owner ? owner.keys : (s.player.keys || {}); const best = FM.RoomKit.pickStyle(keys);
          return `<details class="ed-styles" open><summary>🏠 방 스타일 (누르면 바로 바뀌어요)</summary><div class="st-grid">${(() => { const fitOf = k => FM.RoomKit.styleFit ? FM.RoomKit.styleFit(keys, k) : 0; let L = Object.entries(FM.RoomKit.STYLES).sort((a, b) => (b[0] === room.roomStyle) - (a[0] === room.roomStyle) || fitOf(b[0]) - fitOf(a[0])); edList.styleMore = L.length - 6; if (!edList.allStyles) L = L.slice(0, 6); return L; })().map(([k, x]) => { const fit = Math.round((FM.RoomKit.styleFit ? FM.RoomKit.styleFit(keys, k) : 0) * 100); return `<button data-style="${k}" class="st-card ${room.roomStyle === k ? 'on' : ''}"><i style="background:${FM.PM.css(x.floorColor || 0xd9b88a)}"></i><b>${esc(x.name)}</b><small>${esc((x.desc || '').split('·').slice(0, 2).join('·'))}</small>${k === best ? '<em>추천</em>' : ''}${owner ? `<u>💗 ${fit}%</u>` : ''}</button>`; }).join('')}</div><button id="edStyMore" class="small">${edList.allStyles ? '▲ 추천 6개만 보기' : `▼ 스타일 ${edList.styleMore}개 더 보기`}</button> ${room.roomStyle ? '<button id="edReroll" class="small">🎲 같은 스타일로 색·조명 다시 뽑기</button>' : ''}</details>`; })() : ''}
        ${(() => { const owner = s.villagers.find(v => v.home === edIid && !v.child); if (!owner || !D.ATMO_L1[owner.keys.L1]) return ''; const A1 = D.ATMO_L1[owner.keys.L1], A4 = D.ATMO_L4[owner.keys.L4]; const sc = Ev.atmoScore(owner, room);
          return `<details open><summary>🎨 방 분위기 — ${esc(owner.name)} 취향 적합도 <b>${sc}%</b></summary><div class="bar"><i style="width:${sc}%"></i></div>
            <small>좋아하는 색: <span class="sw" style="background:${FM.PM.css(A1.palette[0])}"></span><span class="sw" style="background:${FM.PM.css(A1.palette[1])}"></span> ${esc(A1.pname)} · ${esc(A1.tone)} / 좋아하는 무늬: ${esc(A4.pname)}</small>
            <label>벽 무늬 <select id="edPat"><option value="">무늬 없음</option>${Object.entries(D.ATMO_PATTERNS).map(([k, n]) => `<option value="${k}" ${room.wallStyle === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
            <label>벽 색 1 <input type="color" id="edW1" value="${FM.PM.css(room.wall || 0xf4efe6)}"></label><label>벽 색 2 <input type="color" id="edW2" value="${FM.PM.css(room.wall2 || 0xffffff)}"></label>
            <button id="edAtmoReset" class="small">💗 ${esc(owner.name)} 취향으로 맞추기</button></details>`; })()}
        <details open><summary>🎛️ 환경 (조명 · 음악)</summary>
          <div class="chips"><button id="edLight">💡 조명 ${room.lightOn === false ? 'OFF' : 'ON'}</button><select id="edLc">${Object.entries(D.LIGHT_COLORS).map(([k, x]) => `<option value="${k}" ${room.light === k ? 'selected' : ''}>${x.name}</option>`).join('')}</select></div>
          <label>방 음악 <select id="edBgm">${Object.entries(D.ROOM_BGM).map(([k, x]) => `<option value="${k}" ${room.bgm === k ? 'selected' : ''}>${typeof x === 'string' ? x : x.name}</option>`).join('')}</select></label>
          <button id="edVac" class="small">🌀 방 청소 (쓰레기 ${room.trash ? room.trash.length : 0}개)</button></details>
        <details open><summary>1. 벽면 & 바닥</summary>
          <label>벽지 색 <input type="color" id="edWall" value="${FM.PM.css(room.wall || 0xf4efe6)}"></label>
          <label>바닥재 <select id="edFloor">${floorKinds.map(k => `<option ${room.floor === k ? 'selected' : ''} value="${k}">${k} (${D.FLOOR_SOUND[k] || ''})</option>`).join('')}</select></label>
          <label>바닥 색 <input type="color" id="edFloorC" value="${FM.PM.css(room.floorColor || 0xd9b88a)}"></label>
          <button id="edPattern">🎨 DIY 패브릭 & 도트 에디터</button></details>
        <div class="ed-sec"><b>🖼️ 내 이미지로 꾸미기</b><div class="chips photo-chips"><button data-photo="poster">포스터</button><button data-photo="poster_wide">가로 포스터</button><button data-photo="canvas_big">대형 캔버스</button><button data-photo="frame">액자</button><button data-photo="photo_stand">탁상 액자</button></div><small class="muted">파일을 고르면 벽에 바로 걸려요. 끌어서 위치를 옮길 수 있어요.</small></div>
        <details id="edAddBox" ${edList.open ? 'open' : ''}><summary>2~6. 가구 추가 (무료) — 🖼️ 그림 보고 고르기</summary>
          <div class="fl-tools"><input id="edFQ" type="search" placeholder="🔍 가구 이름 검색" value="${esc(edList.q)}">${FM.RoomKit ? `<select id="edFS"><option value="">🏠 모든 스타일</option>${Object.entries(FM.RoomKit.STYLES).map(([k, x]) => `<option value="${k}" ${edList.style === k ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>` : ''}</div>
          ${cats.map(c => `<h5 data-cat="${c}">${FM.FURN_LAYERS[c]}</h5><div class="furn-list thumbs" data-cat="${c}">${Object.values(FM.FURN).filter(x => x.layer === c && x.price > 0).map(x => `<button data-add="${x.id}" data-name="${esc(x.name)}" title="${esc(x.name)}"><img data-ft="${x.id}" alt=""><span>${esc(x.name)}</span></button>`).join('')}</div>`).join('')}
          <p class="muted fl-empty" hidden>찾는 가구가 없어요</p></details>

      </div>`;
    $('#edX').onclick = () => UI.closeEditor();
    const rebuild = () => { room.edited = true; G().rebuildInterior(); };
    if (f) {
      $('#edMove').onclick = () => { UI.placing = edSel; paintEditor(); };
      $('#edRot').onclick = () => { f.rot = ((f.rot || 0) + 90) % 360; rebuild(); };
      $('#edDel').onclick = () => { room.furn.splice(edSel, 1); edSel = null; rebuild(); paintEditor(); };
      e.querySelectorAll('[data-mat]').forEach(b => b.onclick = () => { f.mat = b.dataset.mat || undefined; rebuild(); paintEditor(); });
      $('#edCol').oninput = ev => { f.color = parseInt(ev.target.value.slice(1), 16); rebuild(); };
      $('#edColClear').onclick = () => { delete f.color; rebuild(); };
      if ($('#edImg')) $('#edImg').onclick = () => UI.pickImage(f.type, url => { f.img = url; rebuild(); paintEditor(); UI.toast('🖼️ 이미지를 붙였어요!'); });
      if ($('#edImgX')) $('#edImgX').onclick = () => { delete f.img; rebuild(); paintEditor(); };
    }
    e.querySelectorAll('[data-photo]').forEach(b => b.onclick = () => {
      const F2 = FM.FURN[b.dataset.photo];
      UI.pickImage(F2.id, url => {
        const { w, d } = Sim.interiorSize(edIid);
        const used = room.furn.filter(q => FM.FURN[q.type] && FM.FURN[q.type].wall).map(q => q.x);
        const winX = -w / 4;   // 뒷벽 창문 피하기
        let x = w / 4; for (const c of [w / 4, w / 4 + 1.4, w / 4 - 1.2, 0.6, w / 2 - 1, -w / 2 + 0.9]) if (Math.abs(c - winX) > 1.4 && !used.some(u => Math.abs(u - c) < 0.9)) { x = c; break; }
        const item = F2.wall ? { type: F2.id, x: Math.max(-w / 2 + 0.8, Math.min(w / 2 - 0.8, x)), z: -d / 2 + 0.06, rot: 0, img: url } : { type: F2.id, x: 0, z: 0, rot: 0, img: url };
        room.furn.push(item); edSel = room.furn.length - 1;
        rebuild(); paintEditor(); UI.toast(`🖼️ ${F2.name}에 내 이미지를 붙였어요! 끌어서 옮겨보세요`);
      });
    });
    e.querySelectorAll('[data-style]').forEach(b => b.onclick = () => {
      const k = b.dataset.style; if (!k) return;
      const { w, d } = Sim.interiorSize(edIid);
      const owner = st().villagers.find(v => v.home === edIid && !v.child);
      const keys = owner ? owner.keys : (st().player.keys || {});
      Object.assign(room, FM.RoomKit.styleRoom(k, w, d, (FM.INTERIORS[edIid] || {}).door, (Math.random() * 1e9) | 0, keys), { trash: [], theme: null, edited: true });
      edSel = null; G().rebuildInterior(); paintEditor(); UI.toast(`🏠 ${FM.RoomKit.STYLES[k].name} 스타일로 바꿨어요!`);
    });
    if ($('#edStyMore')) $('#edStyMore').onclick = () => { edList.allStyles = !edList.allStyles; paintEditor(); };
    // 방 분위기
    const atmoChanged = rb => { room.atmoRev = (room.atmoRev || 1) + 1; room.atmoByPlayer = true; room.edited = true; if (rb) G().rebuildInterior(); paintEditor(); };
    if ($('#edPat')) {
      $('#edPat').onchange = ev => { room.wallStyle = ev.target.value || null; room.wallStyleL = room.wallStyleR = null; const A4 = Object.values(D.ATMO_L4).find(a => 'p_' + a.pattern === room.wallStyle); room.particles = A4 ? A4.particle : null; room.ambience = A4 ? A4.sound : null; atmoChanged(true); };
      $('#edW1').onchange = ev => { room.wall = parseInt(ev.target.value.slice(1), 16); atmoChanged(true); };
      $('#edW2').onchange = ev => { room.wall2 = parseInt(ev.target.value.slice(1), 16); atmoChanged(true); };
      $('#edAtmoReset').onclick = () => { const owner = st().villagers.find(v => v.home === edIid && !v.child); const A1 = D.ATMO_L1[owner.keys.L1], A4 = D.ATMO_L4[owner.keys.L4]; Object.assign(room, { wall: A1.palette[0], wall2: A1.palette[1], light: A1.light, wallStyle: 'p_' + A4.pattern, wallStyleL: null, wallStyleR: null, particles: A4.particle, ambience: A4.sound }); atmoChanged(true); UI.toast('💗 주민 취향에 맞췄어요'); };
    }
    // 환경
    $('#edLight').onclick = () => { room.lightOn = room.lightOn === false; G().rebuildInterior(); paintEditor(); };
    $('#edLc').onchange = ev => { room.light = ev.target.value; atmoChanged(true); };
    $('#edBgm').onchange = ev => { room.bgm = ev.target.value; };
    $('#edVac').onclick = () => { const n = Ev.vacuum(edIid); UI.toast(`🌀 쓰레기 ${n}개를 치웠어요!`); G().rebuildInterior(); paintEditor(); };
    if ($('#edReroll')) $('#edReroll').onclick = () => { const owner = st().villagers.find(v => v.home === edIid && !v.child); Object.assign(room, FM.RoomKit.variant(room.roomStyle, owner ? owner.keys : (st().player.keys || {}), (Math.random() * 1e9) | 0)); room.edited = true; G().rebuildInterior(); paintEditor(); };
    $('#edWall').oninput = ev => { room.wall = parseInt(ev.target.value.slice(1), 16); rebuild(); };
    $('#edFloor').onchange = ev => { room.floor = ev.target.value; rebuild(); };
    $('#edFloorC').oninput = ev => { room.floorColor = parseInt(ev.target.value.slice(1), 16); rebuild(); };
    $('#edPattern').onclick = () => UI.patternEditor(edIid);
    // 가구 목록: 썸네일 · 검색 · 스타일 필터
    const addBox = $('#edAddBox');
    if (addBox) {
      const styleSet = () => { const S2 = edList.style && FM.RoomKit && FM.RoomKit.STYLES[edList.style]; return S2 ? new Set([...S2.furn.map(o => o.type), ...(S2.fill || []), ...(S2.wallFill || [])]) : null; };
      const applyFilter = () => {
        const q = edList.q.trim().toLowerCase(), set = styleSet(); let any = false;
        addBox.querySelectorAll('.furn-list').forEach(list => {
          let n = 0; list.querySelectorAll('[data-add]').forEach(b => { const ok = (!q || b.dataset.name.toLowerCase().includes(q) || b.dataset.add.includes(q)) && (!set || set.has(b.dataset.add)); b.hidden = !ok; if (ok) n++; });
          list.hidden = !n; const h = addBox.querySelector(`h5[data-cat="${list.dataset.cat}"]`); if (h) h.hidden = !n; if (n) any = true;
        });
        addBox.querySelector('.fl-empty').hidden = any;
        if (FM.FurnThumb) FM.FurnThumb.fill(addBox);
      };
      addBox.addEventListener('toggle', () => { edList.open = addBox.open; if (addBox.open && FM.FurnThumb) FM.FurnThumb.fill(addBox); });
      $('#edFQ').oninput = ev => { edList.q = ev.target.value; applyFilter(); };
      if ($('#edFS')) $('#edFS').onchange = ev => { edList.style = ev.target.value; applyFilter(); };
      applyFilter();
    }
    e.querySelectorAll('[data-add]').forEach(b => b.onclick = () => {
      const F2 = FM.FURN[b.dataset.add];
      room.furn.push({ type: F2.id, x: 0, z: 0, rot: 0 });
      edSel = room.furn.length - 1; UI.placing = edSel;
      rebuild(); paintEditor(); UI.toast(`${F2.name} 추가! 바닥을 눌러 배치하세요`);
    });
  }
  // 인테리어 코드 / 스타일 템플릿 마켓
  UI.codeModal = function (iid) {
    const code = Ev.roomCode(iid);
    modal('🔗 라이브 인테리어 공유 (QR / 블루프린트)', `<p>이 방의 인테리어 코드 — 다른 플레이어 섬의 주민 방에 그대로 이식할 수 있어요.</p><textarea id="cdOut" readonly rows="3">${code}</textarea><button class="btn small" id="cdCopy">📋 복사</button>
      <h4>코드 입력해서 불러오기</h4><textarea id="cdIn" rows="3" placeholder="FMI-..."></textarea><button class="btn small" id="cdApply">적용</button>
      <h4>🏪 스타일 템플릿 마켓 (Style Blueprint Gallery)</h4><div class="grid-btn">${D.BLUEPRINTS.map(b => `<button data-bp="${b.id}">${esc(b.name)}<small>by ${esc(b.by)}</small></button>`).join('')}</div>`, b => {
      $('#cdCopy').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(code); UI.toast('📋 복사했어요'); };
      $('#cdApply').onclick = () => { if (Ev.applyCode(iid, $('#cdIn').value)) { UI.toast('✅ 인테리어를 불러왔어요'); closeModal(); } else UI.toast('❌ 코드가 올바르지 않아요'); };
      b.querySelectorAll('[data-bp]').forEach(x => x.onclick = () => { Ev.applyBlueprint(iid, x.dataset.bp); closeModal(); UI.toast('🏪 템플릿을 불러왔어요'); });
    });
  };

  // DIY 패브릭 & 도트 에디터
  UI.patternEditor = function (iid) {
    const N = 16;
    const px = Array.from({ length: N * N }, () => '#ffffff');
    let color = '#ff6f86', faceOf = null, uploaded = null;
    const pal = ['#ffffff', '#2b2b30', '#ff6f86', '#ff8fb1', '#ffd84a', '#ff9a4a', '#8ee07a', '#4fae4a', '#8fd3ff', '#3a7bd5', '#b69cff', '#8a5a3b', '#f2c46d', '#c0392b', '#9aa3ad', '#39ffb0'];
    const vs = st().villagers.filter(v => !v.child);
    modal('🎨 나만의 DIY 패브릭 & 도트 에디터', `<div class="pat"><canvas id="ptC" width="256" height="256"></canvas><div>
      <div class="pal">${pal.map(c => `<button data-c="${c}" style="background:${c}"></button>`).join('')}<input type="color" id="ptCol" value="${color}"></div>
      <div class="chips"><button id="ptFill">🪣 채우기</button><button id="ptClear">지우기</button></div>
      <label>📷 이미지/사진 업로드 <input type="file" id="ptFile" accept="image/*"></label>
      <label>😊 주민 얼굴 도트 스탬프 <select id="ptFace"><option value="">선택</option>${vs.map(v => `<option value="${v.id}">${icon(v)} ${esc(v.name)}</option>`).join('')}</select></label>
      <label>적용 위치 <select id="ptTarget"><option value="wall">벽지</option><option value="floor">바닥</option><option value="bed">침대 커버</option><option value="sofa">쿠션/소파</option><option value="frame">벽에 걸린 액자</option></select></label>
      <button class="btn" id="ptApply">적용하기</button></div></div>`, () => {
      const cv = $('#ptC'), g = cv.getContext('2d');
      const draw = () => { if (uploaded) { g.imageSmoothingEnabled = false; g.drawImage(uploaded, 0, 0, 256, 256); return; } for (let i = 0; i < N * N; i++) { g.fillStyle = px[i]; g.fillRect((i % N) * 16, Math.floor(i / N) * 16, 16, 16); } g.strokeStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i <= N; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 16); g.lineTo(256, i * 16); g.stroke(); } };
      draw();
      let down = false;
      const paint = ev => { const r = cv.getBoundingClientRect(); const x = Math.floor((ev.clientX - r.left) / r.width * N), y = Math.floor((ev.clientY - r.top) / r.height * N); if (x < 0 || y < 0 || x >= N || y >= N) return; uploaded = null; px[y * N + x] = color; draw(); };
      cv.onpointerdown = ev => { down = true; paint(ev); }; cv.onpointermove = ev => { if (down) paint(ev); }; window.addEventListener('pointerup', () => { down = false; }, { once: true });
      document.querySelectorAll('.pal [data-c]').forEach(b => b.onclick = () => { color = b.dataset.c; $('#ptCol').value = color; });
      $('#ptCol').oninput = e => { color = e.target.value; };
      $('#ptFill').onclick = () => { px.fill(color); uploaded = null; draw(); };
      $('#ptClear').onclick = () => { px.fill('#ffffff'); uploaded = null; faceOf = null; draw(); };
      $('#ptFile').onchange = e => { const f = e.target.files[0]; if (!f) return; const img = new Image(); img.onload = () => { const c2 = document.createElement('canvas'); c2.width = c2.height = 64; c2.getContext('2d').drawImage(img, 0, 0, 64, 64); uploaded = c2; faceOf = null; draw(); }; img.src = URL.createObjectURL(f); };
      $('#ptFace').onchange = e => {
        const v = Sim.byId(e.target.value); if (!v) return;
        faceOf = v.id; uploaded = null;
        const l = ISLE.normalizeLook(v.look);
        const skin = FM.PM.css(l.species === 'human' ? l.skin : l.fur), eye = FM.PM.css(l.eyeColor || 0x2b201c);
        px.fill('#ffe0ec');
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (Math.hypot(x - 7.5, y - 8) < 6.3) px[y * N + x] = skin;
        for (const [x, y] of [[5, 7], [10, 7], [5, 8], [10, 8]]) px[y * N + x] = eye;
        for (const x of [6, 7, 8, 9]) px[11 * N + x] = '#c0306a';
        px[10 * N + 3] = px[10 * N + 12] = '#ff8fb1';
        if (l.species !== 'human') for (const [x, y] of [[3, 2], [4, 2], [11, 2], [12, 2], [3, 3], [12, 3]]) px[y * N + x] = skin;
        draw();
      };
      $('#ptApply').onclick = () => {
        const out = document.createElement('canvas'); out.width = out.height = uploaded ? 64 : N;
        const og = out.getContext('2d');
        if (uploaded) og.drawImage(uploaded, 0, 0); else for (let i = 0; i < N * N; i++) { og.fillStyle = px[i]; og.fillRect(i % N, Math.floor(i / N), 1, 1); }
        Ev.applyPattern(iid, out.toDataURL(), $('#ptTarget').value, faceOf);
        const room = st().rooms[iid]; if (room) room.edited = false;
        closeModal(); G().rebuildInterior(); UI.toast('🎨 무늬를 적용했어요!');
      };
    });
  };

  // 빌라 외관 & 마당 시설 배치
  UI.yardEditor = function (plotId) {
    const s = st();
    s.plots.ext = s.plots.ext || {}; s.plots.yard = s.plots.yard || {};
    const cur = s.plots.ext[plotId];
    const yard = s.plots.yard[plotId] || [];
    const yardF = Object.values(FM.FURN).filter(f => f.layer === 'yard' || f.id === 'fence');
    const slots = [-4.5, -1.5, 1.5, 4.5];
    modal(`🏡 ${esc(MAP.P[plotId].name)} — 건축 및 외관 커스텀`, `<h4>외관 테마 (${Object.keys(FM.PM.VILLA_THEMES).length}종)</h4><div class="grid-btn">${Object.entries(FM.PM.VILLA_THEMES).map(([k, t]) => `<button data-ext="${k}" class="${cur === k ? 'on' : ''}">${esc(t.name)}</button>`).join('')}</div>
      <h4>마당 그리드 (4칸)</h4><div class="grid-btn">${slots.map((x, i) => { const y = yard.find(q => q.slot === i); return `<div class="slot"><b>${i + 1}번 칸</b><select data-slot="${i}"><option value="">비어 있음</option>${yardF.map(f => `<option value="${f.id}" ${y && y.type === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select></div>`; }).join('')}</div>`, b => {
      b.querySelectorAll('[data-ext]').forEach(x => x.onclick = () => { s.plots.ext[plotId] = x.dataset.ext; FM.W.rebuildBuilding(plotId); UI.toast('🏡 외관을 바꿨어요'); UI.yardEditor(plotId); });
      b.querySelectorAll('[data-slot]').forEach(sel => sel.onchange = () => {
        const i = +sel.dataset.slot; const t = sel.value;
        const arr = s.plots.yard[plotId] = (s.plots.yard[plotId] || []).filter(q => q.slot !== i);
        if (t) arr.push({ slot: i, type: t });
        UI.renderYards();
      });
    }, true);
  };
  const yardGroups = {};
  UI.renderYards = function () {
    const s = st();
    const scene = G().islandScene;
    for (const [pid, arr] of Object.entries((s.plots && s.plots.yard) || {})) {
      if (yardGroups[pid]) scene.remove(yardGroups[pid]);
      const P2 = MAP.P[pid];
      const g = new THREE.Group();
      const side = P2.plot ? P2.plot.doorSide : 1;
      for (const q of arr) { const o = FM.PM.furniture(q.type); o.position.set(P2.x + [-4.5, -1.5, 1.5, 4.5][q.slot] * 1.3, FM.T.height(P2.x, P2.z), P2.z + side * (P2.bld.d / 2 + 3.2)); o.rotation.y = side > 0 ? 0 : Math.PI; g.add(o); }
      scene.add(g); yardGroups[pid] = g;
    }
  };

  // =========================================================
  // 꿈속 세계 훔쳐보기 (미니게임)
  // =========================================================
  let dreamGame = null;
  UI.dream = function (v) {
    if (!v) return;
    const dream = v.dream || Sim.u.pick(D.DREAMS.basic);
    const box = $('#dreamBox');
    box.hidden = false;
    box.innerHTML = `<div class="dream-card"><b>🌙 ${esc(v.name)}의 꿈 — ${esc(dream.name)}</b><canvas id="drC" width="480" height="300"></canvas><small id="drInfo">15초! ${dream.id === 'giant' ? '건물을 클릭해서 부숴요' : dream.id === 'fried' ? '←→ / 마우스로 기름방울을 피해요' : '떨어지는 별을 클릭해요'}</small><button id="drX">그만두기</button></div>`;
    const cv = $('#drC'), g = cv.getContext('2d');
    const game = { t: 15, score: 0, objs: [], x: 240, id: dream.id };
    dreamGame = game;
    let last = performance.now();
    const spawn = () => { if (game.id === 'giant') game.objs.push({ x: 30 + Math.random() * 420, y: 180 + Math.random() * 90, w: 30 + Math.random() * 30, h: 40 + Math.random() * 60, alive: true }); else if (game.id === 'fried') game.objs.push({ x: Math.random() * 480, y: -10, r: 8 }); else game.objs.push({ x: Math.random() * 480, y: -10, r: 12, alive: true }); };
    cv.onpointerdown = e => {
      const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * 480, y = (e.clientY - r.top) / r.height * 300;
      for (const o of game.objs) {
        if (game.id === 'giant' && o.alive && x > o.x && x < o.x + o.w && y > o.y - o.h && y < o.y) { o.alive = false; game.score += 10; FM.Audio.sfx('thud'); }
        if (game.id !== 'giant' && game.id !== 'fried' && o.alive && Math.hypot(o.x - x, o.y - y) < 22) { o.alive = false; game.score += 10; FM.Audio.sfx('pop'); }
      }
    };
    cv.onpointermove = e => { const r = cv.getBoundingClientRect(); game.x = (e.clientX - r.left) / r.width * 480; };
    const keyH = e => { if (e.code === 'ArrowLeft') game.x -= 18; if (e.code === 'ArrowRight') game.x += 18; };
    window.addEventListener('keydown', keyH);
    const end = () => {
      if (!dreamGame) return;
      dreamGame = null; window.removeEventListener('keydown', keyH);
      const loot = Ev.dreamReward(v, game.score);
      box.innerHTML = `<div class="dream-card"><b>🌈 꿈에서 깨어났어요!</b><p>점수 ${game.score} · 꿈속 가품 '${esc(loot)}' 획득 · +${Math.round(game.score * 5)}🪙</p><button id="drOk">확인</button></div>`;
      $('#drOk').onclick = () => { box.hidden = true; };
    };
    $('#drX').onclick = end;
    const frame = now => {
      if (dreamGame !== game) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      game.t -= dt;
      if (Math.random() < dt * (game.id === 'fried' ? 5 : 2.2)) spawn();
      const bg = { giant: '#2a1a4a', fried: '#5a3a1a', fly: '#1a3a6a', star: '#0a0f2a' }[game.id] || '#1a1a3a';
      g.fillStyle = bg; g.fillRect(0, 0, 480, 300);
      g.font = '20px Jua, sans-serif';
      if (game.id === 'giant') {
        g.fillStyle = '#3a8a4a'; g.fillRect(0, 270, 480, 30);
        for (const o of game.objs) { if (!o.alive) continue; g.fillStyle = '#ffd8a0'; g.fillRect(o.x, o.y - o.h, o.w, o.h); g.fillStyle = '#ff6f61'; g.fillRect(o.x - 3, o.y - o.h - 8, o.w + 6, 10); }
        g.font = '64px serif'; g.fillText('🦶', game.x - 30, 80);
      } else if (game.id === 'fried') {
        for (const o of game.objs) { o.y += dt * 180; g.fillStyle = '#ffcc3a'; g.beginPath(); g.arc(o.x, o.y, o.r, 0, Math.PI * 2); g.fill(); if (!o.hit && Math.abs(o.x - game.x) < 24 && Math.abs(o.y - 260) < 20) { o.hit = true; game.score -= 5; FM.Audio.sfx('splash'); } }
        game.score += dt * 3;
        g.font = '44px serif'; g.fillText('🍤', game.x - 22, 275);
      } else {
        for (const o of game.objs) { o.y += dt * 90; if (!o.alive) continue; g.font = '28px serif'; g.fillText('⭐', o.x - 14, o.y + 10); }
        g.font = '44px serif'; g.fillText(game.id === 'fly' ? '🕊️' : '🧚', game.x - 22, 275);
        if (game.id === 'fly') for (const o of game.objs) if (o.alive && Math.abs(o.x - game.x) < 26 && Math.abs(o.y - 262) < 22) { o.alive = false; game.score += 10; FM.Audio.sfx('pop'); }
      }
      game.objs = game.objs.filter(o => o.y < 330);
      g.fillStyle = '#ffffff'; g.font = '20px Jua, sans-serif'; g.fillText(`⏱ ${Math.max(0, game.t).toFixed(1)}  ✨ ${Math.round(game.score)}`, 12, 26);
      game.score = Math.max(0, game.score);
      if (game.t <= 0) { game.score = Math.round(game.score); end(); return; }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  // =========================================================
  // 지도
  // =========================================================
  const PLACE_ICON = { apartment: '🏢', apt_yard: '🌷', plaza: '⛲', cafe: '☕', metro: 'Ⓜ️', studio: '📺', stairs: '🪜', bridge: '🌉', cliff: '🌅', cliff_lawn: '🌿', cathedral: '⛪', observatory: '🔭', waterfall: '💧', home_p: '🏠', park: '🌳', playground: '🛝', school: '🏫', library: '📚', workshop: '🔨', teahouse: '🍵', skylounge: '🍽️', mall: '🛍️', arcade: '🎳', sushi: '🍣', pub: '🥟', club: '🎤', conv: '🏪', alley: '🍢', office: '🏢', cityhall: '🏛️', medical: '🏥', beach: '🏖️', ferry: '⛴️' };
  const placeIcon = p => PLACE_ICON[p.id] || (p.plot ? '🏡' : '📍');
  let mapSel = null, mapBg = null;
  const mapLayer = () => (UI._mapLayer || (UI._mapLayer = { names: false, vill: true }));
  function paintLayers() {
    const box = $('#mapLayers'); if (!box) return; const L = mapLayer();
    box.innerHTML = `<button data-ly="names" class="${L.names ? 'on' : ''}">🏷️ 이름표</button><button data-ly="vill" class="${L.vill ? 'on' : ''}">👥 주민</button>`;
    box.querySelectorAll('[data-ly]').forEach(b => b.onclick = () => { L[b.dataset.ly] = !L[b.dataset.ly]; paintLayers(); drawMap(); });
    const q = $('#mapQ'); if (q && !q._b) { q._b = 1; q.oninput = () => { UI._mapQ = q.value.trim(); paintMapSide(); }; }
  }
  UI.toggleMap = function (sel) {
    const m = $('#map');
    m.hidden = sel ? false : !m.hidden;
    if (!m.hidden) { if (sel) mapSel = sel; else if (!mapSel) mapSel = null; $('#mapX').onclick = () => UI.toggleMap(); paintLayers(); drawMap(); paintMapSide(); }
  };
  UI.openMapAt = sel => UI.toggleMap(sel);
  function mapXY() {
    const cv = $('#mapC');
    const { minX, maxX, minZ, maxZ } = MAP.SIZE;
    return { sx: x => (x - minX) / (maxX - minX) * cv.width, sz: z => (z - minZ) / (maxZ - minZ) * cv.height, wx: px => minX + px / cv.width * (maxX - minX), wz: py => minZ + py / cv.height * (maxZ - minZ) };
  }
  function mapBackground(W2, H2) {
    if (mapBg) return mapBg;
    const { minX, maxX, minZ, maxZ } = MAP.SIZE;
    // 1) 땅 모양을 작게 계산 → 2) 부드럽게 키워서 깔끔한 일러스트 느낌
    const SW = Math.round(W2 / 4), SH = Math.round(H2 / 4);
    const sm = document.createElement('canvas'); sm.width = SW; sm.height = SH;
    const sg = sm.getContext('2d'), mask = document.createElement('canvas'); mask.width = SW; mask.height = SH;
    const mg = mask.getContext('2d');
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
      const wx = minX + (x + 0.5) / SW * (maxX - minX), wz = minZ + (y + 0.5) / SH * (maxZ - minZ);
      const h = FM.T.height(wx, wz);
      if (h < 0.15 || FM.T.inWater(wx, wz)) { if (h >= 0.15) { sg.fillStyle = '#8fd6ec'; sg.fillRect(x, y, 1, 1); } continue; }
      sg.fillStyle = h > 20 ? '#c4e6a0' : h > 5 ? '#acdc88' : h > 1.5 ? '#bde39c' : '#f7e9c4';
      sg.fillRect(x, y, 1, 1); mg.fillStyle = '#effcff'; mg.fillRect(x, y, 1, 1);
    }
    const c = document.createElement('canvas'); c.width = W2; c.height = H2;
    const g = c.getContext('2d');
    const sea = g.createLinearGradient(0, 0, 0, H2); sea.addColorStop(0, '#9fdcf0'); sea.addColorStop(1, '#7cc8e4');
    g.fillStyle = sea; g.fillRect(0, 0, W2, H2);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    // 해안 물결 (땅 그림자 테두리)
    g.save(); g.filter = 'blur(7px)'; g.globalAlpha = 0.85; g.drawImage(mask, -6, -6, W2 + 12, H2 + 12); g.restore();
    g.save(); g.filter = 'blur(0.6px)'; g.drawImage(sm, 0, 0, W2, H2); g.restore();
    const sx = x => (x - minX) / (maxX - minX) * W2, sz = z => (z - minZ) / (maxZ - minZ) * H2;
    // 길: 얇은 흰 점선 대신 부드러운 선
    g.strokeStyle = 'rgba(255,250,240,0.95)'; g.lineWidth = 2.5; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [a, b] of MAP.E) { const A = MAP.N[a], B2 = MAP.N[b]; g.beginPath(); g.moveTo(sx(A[0]), sz(A[1])); g.lineTo(sx(B2[0]), sz(B2[1])); g.stroke(); }
    g.font = 'bold 13px Jua, sans-serif'; g.textAlign = 'center';
    for (const [k, d] of Object.entries(MAP.DISTRICTS)) {
      const pos = { CORE: [0, -12], NORTH: [10, -112], WEST: [-100, -8], EAST: [95, -30], SOUTH: [0, 100] }[k]; const t = d.short + ' 지구';
      g.fillStyle = 'rgba(255,255,255,0.7)'; const w = g.measureText(t).width + 14; g.beginPath(); g.roundRect ? g.roundRect(sx(pos[0]) - w / 2, sz(pos[1]) - 11, w, 18, 9) : g.rect(sx(pos[0]) - w / 2, sz(pos[1]) - 11, w, 18); g.fill();
      g.fillStyle = d.color || '#7a5a40'; g.fillText(t, sx(pos[0]), sz(pos[1]) + 3);
    }
    mapBg = c; return c;
  }
  function drawMap() {
    const cv = $('#mapC'), g = cv.getContext('2d');
    const W2 = cv.width, H2 = cv.height;
    const { sx, sz, wx, wz } = mapXY();
    g.drawImage(mapBackground(W2, H2), 0, 0);
    const s2 = st();
    // 퀘스트 목적지 & 웨이포인트
    const qd = FM.Guide.pinned() && FM.Guide.questDest(FM.Guide.pinned());
    const qpos = qd && FM.Guide.resolve(qd);
    const wp = FM.Guide.waypointPos();
    // 장소
    g.textAlign = 'center';
    const places = Object.values(FM.Guide.places()).flat();
    for (const p of places) {
      const x = sx(p.x), y = sz(p.z);
      const sel = mapSel && mapSel.type === 'place' && mapSel.id === p.id;
      g.fillStyle = sel ? '#ff8f6a' : 'rgba(255,255,255,0.92)'; g.strokeStyle = MAP.DISTRICTS[p.district].color; g.lineWidth = sel ? 3 : 2;
      g.beginPath(); g.arc(x, y, sel ? 13 : 9, 0, Math.PI * 2); g.fill(); g.stroke();
      g.font = (sel ? '15' : '11') + 'px serif'; g.fillText(placeIcon(p), x, y + (sel ? 5 : 4));
      if (sel || (mapLayer().names && p.bld && !p.plot)) { g.font = (sel ? '14' : '11') + 'px Jua, sans-serif'; g.fillStyle = '#3b2b20'; g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 3; const t = FM.Guide.shortName(p).slice(0, 12); const tw = g.measureText(t).width / 2 + 4; const lx = Math.max(tw, Math.min(W2 - tw, x)); g.strokeText(t, lx, y - 13); g.fillText(t, lx, y - 13); }
    }
    // 주민
    if (mapLayer().vill) for (const v of s2.villagers) {
      const w = v.loc === 'island' ? { x: v.x, z: v.z } : null; if (!w) continue;
      const sel = mapSel && mapSel.type === 'v' && mapSel.id === v.id;
      g.fillStyle = v.balloon ? '#ff5d9e' : '#ffffff'; g.strokeStyle = sel ? '#ff8f6a' : 'rgba(90,60,40,0.6)'; g.lineWidth = sel ? 3 : 1.5;
      g.beginPath(); g.arc(sx(w.x), sz(w.z), sel ? 6 : 4, 0, Math.PI * 2); g.fill(); g.stroke();
      if (sel) { g.font = '12px Jua, sans-serif'; g.fillStyle = '#3b2b20'; g.fillText(v.name, sx(w.x), sz(w.z) - 9); }
    }
    if (mapSel && mapSel.type === 'pt') { g.font = '20px serif'; g.fillText('🚩', sx(mapSel.x), sz(mapSel.z)); }
    if (wp) { g.font = '22px serif'; g.fillText('📍', sx(wp.x), sz(wp.z) - 2); }
    if (qpos) { g.font = '20px serif'; g.fillText('⭐', sx(qpos.x), sz(qpos.z) - 4); }
    const p = s2.player;
    const pp = p.loc === 'island' ? p : (FM.INTERIORS[p.loc] && Sim.placeDoor(FM.INTERIORS[p.loc].place));
    if (pp) {
      const t = performance.now() / 1000;
      g.fillStyle = 'rgba(255,58,58,0.25)'; g.beginPath(); g.arc(sx(pp.x), sz(pp.z), 9 + Math.sin(t * 4) * 2, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ff3a3a'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(sx(pp.x), sz(pp.z), 5.5, 0, Math.PI * 2); g.fill(); g.stroke();
    }
    cv.onclick = e => {
      const r = cv.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width * W2, py = (e.clientY - r.top) / r.height * H2;
      let best = null, bd = 16;
      for (const pl of places) { const d = Math.hypot(sx(pl.x) - px, sz(pl.z) - py); if (d < bd) { bd = d; best = { type: 'place', id: pl.id }; } }
      for (const v of s2.villagers) if (v.loc === 'island') { const d = Math.hypot(sx(v.x) - px, sz(v.z) - py); if (d < Math.min(bd, 8)) { bd = d; best = { type: 'v', id: v.id }; } }
      if (!best) { const x = wx(px), z = wz(py); if (FM.T.height(x, z) > 0.2 && !FM.T.inWater(x, z)) best = { type: 'pt', x, z }; }
      mapSel = best; FM.Audio.sfx('ui'); drawMap(); paintMapSide();
    };
  }
  function goButtons(dest, canEnter) {
    return `<div class="map-go">
      <button class="main" data-go="tp">✨ 바로 가기</button>
      ${canEnter ? '<button class="main" data-go="enter">🚪 바로 들어가기</button>' : ''}
      <button data-go="walk">🚶 걸어서 가기</button>
      <button data-go="pin">📍 목적지로 표시</button></div>`;
  }
  function bindGo(box, dest) {
    box.querySelectorAll('[data-go]').forEach(b => b.onclick = () => {
      const k = b.dataset.go;
      if (k === 'pin') { FM.Guide.setWaypoint(dest); UI.toast('📍 목적지를 표시했어요. 화면의 빛기둥을 따라가세요!'); drawMap(); return; }
      $('#map').hidden = true;
      if (k === 'walk') FM.Guide.walkTo(dest);
      else FM.Guide.teleport(dest, { enter: k === 'enter' });
    });
  }
  function paintMapSide() {
    const info = $('#mapInfo'), list = $('#mapList'); if (!info) return;
    const s2 = st();
    if (!mapSel) info.innerHTML = `<h3>어디로 갈까요?</h3><p>지도에서 장소(아이콘)나 주민(점)을 누르거나, 아래 목록에서 골라주세요.<br>✨ <b>바로 가기</b>는 순간 이동, 🚶 <b>걸어서 가기</b>는 길을 따라 자동으로 걸어가요.</p>`;
    else if (mapSel.type === 'place') {
      const p = MAP.P[mapSel.id];
      const inside = s2.villagers.filter(v => (p.interior && v.loc === p.interior) || (v.loc === 'island' && Math.hypot(v.x - p.x, v.z - p.z) < (p.r || 12)) || (p.id === 'apartment' && v.loc.startsWith('apt')));
      const canEnter = p.interior && !p.plot;
      info.innerHTML = `<h3>${placeIcon(p)} ${esc(p.name)}</h3><div class="who">${esc(MAP.DISTRICTS[p.district].name)}</div>${p.desc ? `<p>${esc(p.desc)}</p>` : ''}<div class="who">👥 지금 여기: ${inside.length ? inside.slice(0, 8).map(v => esc(v.name)).join(', ') + (inside.length > 8 ? ` 외 ${inside.length - 8}명` : '') : '아무도 없어요'}</div>${goButtons({ place: p.id }, canEnter)}`;
      bindGo(info, { place: p.id });
    } else if (mapSel.type === 'v') {
      const v = Sim.byId(mapSel.id); const w = FM.Guide.whereIs(v);
      info.innerHTML = `<h3>${icon(v)} ${esc(v.name)}</h3><div class="who">${esc(v.title)}</div><p>📍 ${esc(w ? w.label : '?')}${v.balloon ? ' · <b style="color:#ff5d9e">고민이 있어요(!)</b>' : ''}</p>${goButtons({ villager: v.id }, false)}`;
      bindGo(info, { villager: v.id });
    } else {
      info.innerHTML = `<h3>🚩 선택한 지점</h3><p>${esc(MAP.DISTRICTS[FM.T.district(mapSel.x, mapSel.z)].name)}</p>${goButtons({ x: mapSel.x, z: mapSel.z, label: '선택한 지점' }, false)}`;
      bindGo(info, { x: mapSel.x, z: mapSel.z, label: '선택한 지점' });
    }
    // 목록
    const groups = FM.Guide.places();
    const q = FM.Guide.pinned(); const qd = q && FM.Guide.questDest(q);
    const qplace = qd && (qd.place || (qd.villager && (FM.Guide.whereIs(Sim.byId(qd.villager)) || {}).place));
    let html = '';
    if (q && qd) html += `<h5>⭐ 퀘스트 목적지</h5><div class="map-chips"><button data-q="1">⭐ ${esc(J(FM.Guide.nextStep(q).text).slice(0, 34))}</button></div>`;
    // 방위별 탭: 중앙 · 북 · 동 · 서 · 남 · 주민 (장소 좌표로 나눔)
    const REG = [['all', '🧭 전체'], ['c', '⛲ 중앙'], ['n', '⬆️ 북쪽'], ['e', '➡️ 동쪽'], ['w', '⬅️ 서쪽'], ['s', '⬇️ 남쪽'], ['v', '👥 주민']];
    const regOf = p => ({ CORE: 'c', NORTH: 'n', EAST: 'e', WEST: 'w', SOUTH: 's' })[p.district] || (Math.hypot(p.x, p.z) < 34 ? 'c' : Math.abs(p.x) > Math.abs(p.z) * 0.9 ? (p.x > 0 ? 'e' : 'w') : (p.z < 0 ? 'n' : 's'));
    const RNAME = { c: '⛲ 중앙 광장 일대', n: '⬆️ 북쪽 — 언덕 · 성당 · 온천 · 천문대', e: '➡️ 동쪽 — 번화가 · 마츠리 · 업무 지구', w: '⬅️ 서쪽 — 주택가 · 공원 · 학교 · 도서관', s: '⬇️ 남쪽 — 해변 · 병원 · 부두' };
    const RCOL = { c: '#ffb86a', n: '#b69cff', e: '#ff8ac0', w: '#7ad89a', s: '#6ac8f0' };
    const QQ = (UI._mapQ || '').toLowerCase(); const hit = t => !QQ || String(t).toLowerCase().includes(QQ);
    const all = []; for (const arr of Object.values(groups)) for (const p of arr) if (!all.includes(p) && hit(p.name)) all.push(p);
    const tab = UI._mapTab || 'all';
    html += `<div class="map-reg">${REG.map(([k, n]) => `<button data-reg="${k}" class="${tab === k ? 'on' : ''}">${n}</button>`).join('')}</div>`;
    if (tab !== 'v') for (const r of ['c', 'n', 'e', 'w', 's']) {
      if (tab !== 'all' && tab !== r) continue;
      const arr = all.filter(p => regOf(p) === r); if (!arr.length) continue;
      html += `<h5><i style="background:${RCOL[r]}"></i>${RNAME[r]} <small style="color:var(--muted)">${arr.length}곳</small></h5><div class="map-chips">${arr.map(p => `<button data-p="${p.id}" class="${mapSel && mapSel.id === p.id ? 'on' : ''}">${placeIcon(p)} ${esc(FM.Guide.shortName(p).slice(0, 14))}${qplace === p.id ? ' <span class="q">⭐</span>' : ''}</button>`).join('')}</div>`;
    }
    if (tab === 'v' || tab === 'all') html += `<h5>👥 주민에게 가기</h5><div class="map-chips">${s2.villagers.filter(v => hit(v.name)).map(v => `<button data-v="${v.id}" class="${mapSel && mapSel.id === v.id ? 'on' : ''}">${icon(v)} ${esc(v.name)}${v.balloon ? ' <span class="q">!</span>' : ''}</button>`).join('')}</div>`;
    list.innerHTML = html;
    list.querySelectorAll('[data-reg]').forEach(b => b.onclick = () => { UI._mapTab = b.dataset.reg; paintMapSide(); });
    list.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { mapSel = { type: 'place', id: b.dataset.p }; drawMap(); paintMapSide(); });
    list.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { mapSel = { type: 'v', id: b.dataset.v }; drawMap(); paintMapSide(); });
    const qb = list.querySelector('[data-q]'); if (qb) qb.onclick = () => { mapSel = qd.villager ? { type: 'v', id: qd.villager } : { type: 'place', id: qd.place }; drawMap(); paintMapSide(); };
  }

  // =========================================================
  // 매 프레임: 말풍선, 이름표, 속마음, 상호작용 힌트, BGM
  // =========================================================
  const bubblePool = [];
  const v3 = new THREE.Vector3();
  UI.frame = function (dt, camera) {
    const s = st(); if (!s) return;
    const g = G();
    const layer = $('#bubbles');
    const viewLoc = g.view === 'island' ? 'island' : g.view === 'observe' ? (g.obs || 'island') : s.player.loc;
    const ents = s.villagers.concat(Ev.staff, s.visitors, [s.player]);
    let n = 0;
    const W2 = window.innerWidth, H2 = window.innerHeight;
    for (const e of ents) {
      if (e.loc !== viewLoc) continue;
      const showBub = e.bubble && e.bubble.until > s.realT;
      const showName = UI.mind || showBub || (viewLoc !== 'island') || Math.hypot(e.x - s.player.x, e.z - s.player.z) < 9;
      if (!showBub && !showName) continue;
      const hp = FM.Chars.headPos(e.id, v3); if (!hp) continue;
      hp.project(camera);
      if (hp.z > 1 || hp.x < -1.1 || hp.x > 1.1 || hp.y < -1.1 || hp.y > 1.1) continue;
      const x = (hp.x + 1) / 2 * W2, y = (1 - hp.y) / 2 * H2;
      let el = bubblePool[n];
      if (!el) { el = document.createElement('div'); el.className = 'bub'; layer.appendChild(el); bubblePool.push(el); }
      n++;
      let html = '';
      if (UI.mind && !e.staff && !e.visitor && e.id !== 'P') html += `<div class="mind">${esc(Sim.thought(e))}</div>`;
      if (showBub) html += `<div class="say">${esc(e.bubble.text)}</div>`;
      if (showName && e.id !== 'P') html += `<div class="nm">${esc(e.name)}${e.nick ? ` <small>'${esc(e.nick)}'</small>` : ''}</div>`;
      if (el._h !== html) { el.innerHTML = html; el._h = html; }
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      el.style.display = '';
      if (n > 26) break;
    }
    for (let i = n; i < bubblePool.length; i++) bubblePool[i].style.display = 'none';
    // 상호작용 힌트
    if ((UI._hintT = (UI._hintT || 0) - dt) < 0) {
      UI._hintT = 0.25;
      const list = g.view === 'observe' || UI.modalOpen() ? [] : g.interactables();
      const h = $('#hint');
      if (list.length) { const hk = list.map(x => x.label).join('|'); if (h._k !== hk) { h._k = hk; h.innerHTML = `<b>E</b> ${esc(J(list[0].label))}${list.length > 1 ? ` <span class="more"><b>R</b> 다른 행동 ${list.length - 1}개</span>` : ''}`; } h.hidden = false; $('#hintBtn').hidden = false; }
      else { h.hidden = true; $('#hintBtn').hidden = true; }
      if (g.view === 'observe' && g.obs && (obsT -= 0.25) < 0) { obsT = 2; paintObs(); }
      if (!$('#map').hidden) drawMap();
      paintTracker();
    }
    if (!yardGroups._init && g.islandScene) { yardGroups._init = true; UI.renderYards(); }
  };

  // BGM 선택
  const activeBgm = {};
  UI.pickBgm = function () {
    if (!FM.Audio.on) return;
    const s = st(), g = G(), p = s.player;
    const h = Sim.time.hour();
    { const aiid = g.view === 'observe' ? g.obs : p.loc !== 'island' ? p.loc : null; const rm = aiid && s.rooms[aiid]; FM.Audio.ambience && FM.Audio.ambience(rm && !rm.theme && rm.ambience ? rm.ambience : null); }
    for (const b of Object.values(activeBgm)) {
      const pl = b.place && MAP.P[b.place];
      if (!pl || (p.loc === 'island' && Math.hypot(pl.x - p.x, pl.z - p.z) < 45) || (g.view === 'observe')) return FM.Audio.play(b.key);
    }
    let key = 'field';
    const iid = g.view === 'observe' ? g.obs : p.loc !== 'island' ? p.loc : null;
    if (iid) {
      const room = s.rooms[iid];
      const venue = (FM.Audio.INTERIOR_BGM || {})[iid];
      if (venue) key = venue;
      else if (room) key = room.set === 'aquarium' || room.theme === 'aquarium' ? 'deepsea' : room.bgm && room.bgm !== 'none' ? room.bgm : 'lofi';
    } else if (FM.Audio.placeBgm) {
      const fx = g.view === 'observe' && !g.obs ? 0 : p.x, fz = g.view === 'observe' && !g.obs ? -10 : p.z;
      key = FM.Audio.placeBgm(fx, fz, h, s.weather.type);
    } else if (h >= 20 || h < 5) key = 'night';
    FM.Audio.play(key);
  };
})();
