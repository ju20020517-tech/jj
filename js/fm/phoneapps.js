/* =========================================================
 *  📱 폰 앱 — 큰 카드 스타일 (P1)
 *   👥 주민: 한 명씩 큰 카드 (얼굴 · 지금 하는 일 · 기분 · 하트) + 말 걸기 · 가기 · 자세히, ◀ ▶ 넘기기 · 아래 얼굴 줄
 *   📜 퀘스트: 지금 할 일 하나를 크게 (진행 막대 · 남은 시간 · 보상 · 길 안내) + 다음 할 일 체크리스트
 *   📰 소식: 오늘의 헤드라인 카드 (사진 · 얼굴) 넘기기 + 다가오는 행사 3줄
 *   각 앱 맨 아래 "📋 목록으로 보기"로 예전 상세 목록도 볼 수 있음
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, UI = FM.UI, Sim = FM.Sim, Soc = FM.Soc, D = FM.D;
  if (!UI || !Sim) return;
  const P = 'P', S = () => Sim.get();
  const $ = q => document.querySelector(q);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const face = (v, px) => (FM.Face && v ? FM.Face.img(v, px) : '🙂');
  const hearts = n => { const f = Math.round(Math.max(0, Math.min(100, n || 0)) / 20); return `<span class="pa-h">${'♥'.repeat(f)}<i>${'♡'.repeat(5 - f)}</i></span>`; };
  const list = {};       // 앱별 '목록으로 보기' 상태
  const idx = { v: 0, n: 0 }; let vf = 'all';

  // ---------------- 👥 주민 ----------------
  function villagers() {
    const st = S(), p = st.player;
    let vs = st.villagers.filter(v => !v.visitor);
    if (vf === 'close') vs = vs.filter(v => (Soc.rel(v.id, P).friendship_point || 0) >= 30 || Soc.partnerOf(v.id) === P).sort((a, b) => (Soc.rel(b.id, P).friendship_point || 0) - (Soc.rel(a.id, P).friendship_point || 0));
    if (vf === 'near') vs = vs.filter(v => v.loc === p.loc && Math.hypot(v.x - p.x, v.z - p.z) < 40).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
    if (vf === 'all') vs = vs.slice().sort((a, b) => (b.balloon ? 1 : 0) - (a.balloon ? 1 : 0));
    const n = vs.length; if (idx.v >= n) idx.v = 0;
    const v = vs[idx.v];
    const seg = `<div class="pa-seg">${[['all', '전체'], ['close', '💕 친한'], ['near', '📍 근처']].map(([k, t]) => `<button data-vf="${k}" class="${vf === k ? 'on' : ''}">${t}</button>`).join('')}</div>`;
    if (!v) return `${seg}<div class="pa-card pa-empty">${vf === 'near' ? '근처에 주민이 없어요 🌿' : '아직 친한 주민이 없어요. 먼저 말을 걸어 보세요!'}</div>${foot('villagers', '➕ 주민 이주시키기', 'addV')}`;
    const r = Soc.rel(v.id, P), w = FM.Guide && FM.Guide.whereIs ? FM.Guide.whereIs(v) : null;
    const act = v.act ? v.act.name : v.moving ? '걷는 중' : ((D.STATES || {})[v.state] || {}).ko || '쉬는 중';
    const mood = (v.mood || 50) >= 70 ? '😊 기분 좋음' : (v.mood || 50) >= 40 ? '🙂 보통' : '😔 시무룩';
    const lover = Soc.partnerOf(v.id) === P;
    const dots = Array.from({ length: Math.min(n, 7) }, (_, i) => { const k = Math.max(0, Math.min(n - 7, idx.v - 3)) + i; return `<i class="${k === idx.v ? 'on' : ''}"></i>`; }).join('');
    const strip = [1, 2, 3, 4, 5].map(k => vs[(idx.v + k) % n]).filter((x, i, a) => x && x !== v && a.indexOf(x) === i).map(x => `<button class="pa-mini" data-vi="${vs.indexOf(x)}">${face(x, 46)}<span>${esc(x.name)}</span>${x.balloon ? '<em>!</em>' : ''}</button>`).join('');
    return `${seg}
      <div class="pa-card pa-vcard" id="paSwipe" data-vid="${v.id}">
        <button class="pa-nav l" data-step="-1">‹</button><button class="pa-nav r" data-step="1">›</button>
        <div class="pa-ring">${face(v, 116)}${v.balloon ? '<em class="pa-bal">!</em>' : ''}</div>
        <div class="pa-name">${esc(v.name)}${lover ? ' 💕' : ''}</div>
        <div class="pa-sub">${esc(v.title || '')}</div>
        <div class="pa-sub">📍 ${esc(w ? w.label : '')} · ${esc(act)} · ${mood}</div>
        <div class="pa-rel">${hearts(r.friendship_point)} ${esc(Soc.stageName(r.friendship_stage) || '')}</div>
        <div class="pa-acts"><button class="on" data-va="talk">💬 말 걸기</button><button data-va="go">📍 가기</button><button data-va="prof">👤 자세히</button></div>
      </div>
      <div class="pa-dots">${dots}</div><div class="pa-strip">${strip}</div>${foot('villagers', '➕ 주민 이주시키기', 'addV')}`;
  }
  function bindVillagers(body) {
    const st = S(), p = st.player;
    body.querySelectorAll('[data-vf]').forEach(b => b.onclick = () => { vf = b.dataset.vf; idx.v = 0; paint('villagers'); });
    body.querySelectorAll('[data-step]').forEach(b => b.onclick = () => step(+b.dataset.step));
    body.querySelectorAll('[data-vi]').forEach(b => b.onclick = () => { idx.v = +b.dataset.vi; paint('villagers'); });
    const sw = body.querySelector('#paSwipe'); if (sw) { let x0 = null; sw.onpointerdown = e => { x0 = e.clientX; }; sw.onpointerup = e => { if (x0 != null && Math.abs(e.clientX - x0) > 40) step(e.clientX < x0 ? 1 : -1); x0 = null; }; }
    const cur = () => { const c = body.querySelector('[data-vid]'); return c ? Sim.byId(c.dataset.vid) : null; };
    body.querySelectorAll('[data-va]').forEach(b => b.onclick = () => {
      const v = cur(); if (!v) return; const a = b.dataset.va;
      if (a === 'prof') return UI.showProfile(v);
      UI.phone && UI.phone.close();
      if (a === 'talk') { if (v.loc === p.loc && Math.hypot(v.x - p.x, v.z - p.z) < 4) UI.talk(v); else { UI.goTo(v); UI.toast(`📍 ${v.name}에게 가는 중… 가까이 가면 말을 걸어요`); } }
      else if (FM.Guide && FM.Guide.walkTo) FM.Guide.walkTo({ villager: v.id }); else UI.goTo(v);
    });
    const ad = body.querySelector('#addV'); if (ad) ad.onclick = () => UI.addVillager();
  }
  function step(d) { idx.v += d; const n = S().villagers.length; if (idx.v < 0) idx.v = n - 1; paint('villagers'); }

  // ---------------- 📜 퀘스트 ----------------
  function quests() {
    const st = S(), Gd = FM.Guide;
    const act = st.quests.filter(q => q.state === 'active');
    const pin = Gd.pinned(); const q = (pin && act.includes(pin) ? pin : act[0]);
    if (!q) {
      const worried = st.villagers.find(v => v.balloon);
      return `<div class="pa-card pa-empty"><div style="font-size:44px">🌿</div><b>지금 할 일이 없어요</b><div class="pa-sub">머리 위에 <b>!</b> 풍선이 뜬 주민에게 말을 걸면 부탁을 들을 수 있어요</div>${worried ? `<div class="pa-acts"><button class="on" data-qa="find" data-v="${worried.id}">❗ ${esc(worried.name)} 찾아가기</button></div>` : ''}</div>${foot('quest', '📜 지난 퀘스트 보기')}`;
    }
    const steps = Gd.questSteps(q), done = steps.filter(x => x.done).length, nowS = steps.find(x => !x.done);
    const giver = q.giver && q.giver !== P ? Sim.byId(q.giver) : null;
    const others = act.filter(x => x !== q);
    return `<div class="pa-card pa-qcard">
        <span class="pa-tag">진행 중</span>${giver ? `<span class="pa-giver">${face(giver, 26)} ${esc(giver.name)}의 부탁</span>` : ''}
        <div class="pa-qt">${esc(q.title)}</div><div class="pa-sub">${esc(nowS ? '👉 ' + nowS.text : q.desc || '')}</div>
        <div class="pa-bar"><i style="width:${steps.length ? done / steps.length * 100 : 0}%"></i></div>
        <div class="pa-sub">${done} / ${steps.length} 단계 · ${esc(Gd.timeLeft(q))} · 🎁 ${esc(Gd.reward(q))}</div>
        <div class="pa-acts"><button class="on" data-qa="walk" data-q="${q.id}">📍 길 안내</button><button data-qa="tp" data-q="${q.id}">✨ 바로 가기</button><button data-qa="quit" data-q="${q.id}">포기</button></div>
      </div>
      ${others.length ? `<div class="pa-h4">다음 할 일</div>${others.map(o => { const ss = Gd.questSteps(o); return `<button class="pa-todo" data-qsel="${o.id}"><span class="ck"></span><span>${esc(o.title)} <small>(${ss.filter(x => x.done).length}/${ss.length})</small></span></button>`; }).join('')}` : ''}
      ${foot('quest', '📜 지난 퀘스트 · 자세히')}`;
  }
  function bindQuests(body) {
    const st = S(), Gd = FM.Guide;
    body.querySelectorAll('[data-qa]').forEach(b => b.onclick = () => {
      const a = b.dataset.qa;
      if (a === 'find') { const v = Sim.byId(b.dataset.v); UI.phone && UI.phone.close(); return UI.goTo(v); }
      const q = st.quests.find(x => x.id === b.dataset.q); if (!q) return;
      if (a === 'quit') return UI.quitQuest(q);
      Gd.pin(q); const dest = Gd.questDest(q); UI.phone && UI.phone.close();
      if (dest) { if (a === 'tp') Gd.teleport(dest); else Gd.walkTo(dest); }
      UI.paint();
    });
    body.querySelectorAll('[data-qsel]').forEach(b => b.onclick = () => { const q = st.quests.find(x => x.id === b.dataset.qsel); if (q) { Gd.pin(q); UI.paint(); paint('quest'); } });
  }

  // ---------------- 📰 소식 ----------------
  // 소식지 = 내가 들은 · 엿들은 · 본 소문만 (rumors.js)
  function heads() {
    const st = S();
    return (st.rumors || []).slice(-12).reverse().map(r => ({ text: `${r.icon} ${r.text}`, who: r.who, day: r.day, hm: (r.src === 'told' && r.by ? `${Sim.nameOf(r.by)}에게 들음` : r.src === 'heard' ? '엿들음' : '직접 봄') }));
  }
  function upcoming() {
    const st = S(), h = Sim.time.hour(), d = Sim.time.day(), wd = Sim.time.weekday(), out = [];
    out.push(h < 21 ? '🎆 오늘 밤 9시 마츠리 광장 불꽃놀이' : '🎆 내일 밤 9시 마츠리 불꽃놀이');
    const md = 4 - (d % 4); out.push(md === 4 ? (h < 21 ? '🌠 오늘 밤 유성우! 하늘을 올려다봐요' : '🌠 유성우가 쏟아지는 중') : `🌠 ${md}일 뒤 유성우 예보`);
    out.push(wd === 5 ? '🎣 오늘은 낚시 대회 날 (9~15시)' : `🎣 낚시 대회까지 ${(5 - wd + 7) % 7}일`);
    const cup = st.arcadeCup && Object.entries(st.arcadeCup.best || {}).sort((a, b) => b[1] - a[1])[0]; if (cup) out.push(`🏆 오락실 주간 1등은 ${Sim.nameOf ? Sim.nameOf(cup[0]) : ''} (${cup[1]}점)`);
    if (h >= 16 && h < 22) out.push('🎤 서쪽 공연장에서 버스킹 중일지도?');
    return out.slice(0, 4);
  }
  function news() {
    const st = S(), H = heads(); const n = H.length; if (idx.n >= n) idx.n = 0;
    const e = H[idx.n];
    const ppl = e ? (e.who || []).map(id => Sim.byId(id)).filter(Boolean).slice(0, 3) : [];
    const pids = Object.keys(st.photos || {}); const ph = e && pids.reverse().map(k => st.photos[k]).find(x => (x.who || []).some(w => (e.who || []).includes(w)));
    const hero = ph ? `<div class="pa-hero" style="background-image:url(${ph.url})"></div>` : `<div class="pa-hero grad">${ppl.map(v => face(v, 70)).join('') || '<span style="font-size:54px">📰</span>'}</div>`;
    const dots = Array.from({ length: Math.min(n, 6) }, (_, i) => `<i class="${i === idx.n ? 'on' : ''}"></i>`).join('');
    return `${e ? `<div class="pa-card pa-ncard" id="paSwipe"><button class="pa-nav l" data-ns="-1">‹</button><button class="pa-nav r" data-ns="1">›</button>${hero}<div class="pa-nbody"><span class="pa-tag">${idx.n === 0 ? '오늘의 톱뉴스' : '섬 소식'}</span><div class="pa-qt">${esc(e.text)}</div><div class="pa-sub">${e.day}일차 ${esc(e.hm || '')}</div></div></div>` : '<div class="pa-card pa-empty">아직 들은 소문이 없어요<div class="pa-sub">주민과 이야기하거나, 수다 떠는 주민 곁에 가 보세요 👂</div></div>'}
      <div class="pa-dots">${dots}</div>
      ${upcoming().map(t => `<div class="pa-todo"><span>${esc(t)}</span></div>`).join('')}
      <div class="pa-acts" style="margin-top:6px"><button class="on" id="paTv">📺 뉴스 방송 보기</button></div>
      ${foot('news', '📋 전체 소식 · 랭킹')}`;
  }
  function bindNews(body) {
    body.querySelectorAll('[data-ns]').forEach(b => b.onclick = () => { const n = heads().length; idx.n = (idx.n + +b.dataset.ns + n) % Math.max(1, n); paint('news'); });
    const sw = body.querySelector('#paSwipe'); if (sw) { let x0 = null; sw.onpointerdown = e => { x0 = e.clientX; }; sw.onpointerup = e => { if (x0 != null && Math.abs(e.clientX - x0) > 40) { const n = heads().length; idx.n = (idx.n + (e.clientX < x0 ? 1 : -1) + n) % n; paint('news'); } x0 = null; }; }
    const tv = body.querySelector('#paTv'); if (tv) tv.onclick = () => { UI.phone && UI.phone.close(); UI.newsShow && UI.newsShow(); };
  }

  // ---------------- 공통 ----------------
  const foot = (t, label, extraId) => `<div class="pa-foot"><button data-list="${t}">${label && !extraId ? label : '📋 목록으로 보기'}</button>${extraId ? `<button id="${extraId}">${label}</button>` : ''}</div>`;
  const VIEW = { villagers: [villagers, bindVillagers], quest: [quests, bindQuests], news: [news, bindNews] };
  let lastHtml = '';
  function paint(t, soft) {
    const body = $('#sideBody'); if (!body || !VIEW[t]) return;
    const html = `<div class="pa">${VIEW[t][0]()}</div>`;
    if (soft && html === lastHtml && body.querySelector('.pa')) return;
    lastHtml = html; body.innerHTML = html;
    VIEW[t][1](body);
    body.querySelectorAll('[data-list]').forEach(b => b.onclick = () => { list[b.dataset.list] = true; UI.tab(b.dataset.list); addBack(b.dataset.list); });
  }
  function addBack(t) {
    const body = $('#sideBody'); if (!body) return;
    const bb = document.createElement('button'); bb.className = 'pa-back'; bb.textContent = '🃏 카드로 보기'; bb.onclick = () => { list[t] = false; UI.tab(t); };
    body.insertBefore(bb, body.firstChild);
  }
  const oTab = UI.tab;
  UI.tab = function (t) {
    const r = oTab.apply(this, arguments);
    try { if (VIEW[t] && !list[t]) paint(t); else if (VIEW[t] && !document.querySelector('#sideBody .pa-back')) addBack(t); } catch (e) { console.error('phoneapps', e); }
    return r;
  };
  // 주기적 새로고침(주민 목록 · 소식)도 카드 화면으로
  const oPv = UI.pv, oPn = UI.pn;
  if (oPv) UI.pv = function (body) { if (!list.villagers && body && body.id === 'sideBody') return paint('villagers', true); const r = oPv.apply(this, arguments); if (list.villagers && body && body.id === 'sideBody') addBack('villagers'); return r; };
  if (oPn) UI.pn = function (body) { if (!list.news && body && body.id === 'sideBody') return paint('news', true); const r = oPn.apply(this, arguments); if (list.news && body && body.id === 'sideBody') addBack('news'); return r; };
  UI.phoneApps = { paint, list };
})();
