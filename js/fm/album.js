/* =========================================================
 *  📼 드라마 앨범 (Drama Replay App)
 *  - 재생한 모든 컷신을 저장 → 언제든 다시 보기
 *  - 더빙 & 대사 교체: 대사 텍스트 · BGM · 인물 의상 · 음성 피치를 직접 편집해 나만의 막장 드라마 제작
 *  - 공유 코드로 내보내기 / 다른 플레이어의 드라마 불러오기
 *  - 🎬 연출 카탈로그: B급 멜로드라마 10종을 바로 틀어 보기 (신의 툴)
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Cut = FM.Cut, UI = FM.UI;
  const P = 'P';
  const S = () => Sim.get();
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const MAX = 40;
  const OUTFITS = { '': '평소 옷', suit: '🕴️ 정장', formal: '🎀 파티복', tux: '🤵 턱시도', bride: '👰 웨딩드레스', hanbok: '👘 한복', swim: '🩱 수영복', prisoner: '🦓 죄수복', worker: '👷 작업복', diving: '🤿 잠수복', space: '🧑‍🚀 우주복', wrestler: '🤼 레슬러', robe: '🛁 목욕 가운', retro: '🕺 레트로', baker: '🧁 제빵사', leather: '🕶️ 가죽 자켓', patient: '🏥 환자복', uniform: '🎒 교복', couple: '💑 커플티' };
  const PITCH = { 0.6: '🐻 굵은 목소리', 0.8: '🙂 낮은 목소리', 1: '기본', 1.3: '🐤 높은 목소리', 1.7: '🎈 헬륨 목소리' };
  const ICON = { confess: '💌', reunion: '💞', fate: '✨', propose: '💍', wedding: '💒', breakup: '💔', affair: '🔥', fight: '💢', brawl: '👊', triangle: '🔺', makeup: '🕊️', baby: '👶', divorce: '⚖️', jealous: '⚡', crushEnd: '🍂', scam: '🕵️', cult: '🔮', fashion: '👗', runaway: '🧳' };

  // ---------------------------------------------------------
  // 저장 (JSON 으로 안전하게)
  // ---------------------------------------------------------
  const clean = o => JSON.parse(JSON.stringify(o, (k, v) => (typeof v === 'function' ? undefined : v)));
  const snap = v => ({ id: v.id, name: v.name, look: v.id === P ? v.look : (FM.Chars && FM.Chars.outfitLook ? FM.Chars.outfitLook(v) : v.look), keys: v.keys || {}, child: v.child ? { stage: v.child.stage } : null });
  // 2일이 지난 드라마는 저절로 사라짐 (📌 보관한 것 · 직접 편집한 것은 남음)
  const prune = () => { const st = S(); if (!st || !st.dramaAlbum) return; const today = Sim.time.day(); st.dramaAlbum = st.dramaAlbum.filter(e => e.pinned || e.edited || e.shared || today - (e.day || today) < (Cut.EXPIRE_DAYS || 2)); };
  Cut.pruneAlbum = prune;
  FM.bus.on('hour', () => { try { prune(); Cut.pruneQueue && Cut.pruneQueue(); } catch (e) { /* 무시 */ } });
  Cut.saveAlbum = function (c) {
    const st = S(); if (!st) return;
    st.dramaAlbum = st.dramaAlbum || [];
    const e = clean({
      id: 'dr' + Date.now().toString(36) + Math.floor(Math.random() * 1e4), ep: c.ep, sub: c.sub, theme: c.theme, title: c.title || '', day: Sim.time.day(), hm: Sim.time.hm(),
      venue: c.venueUsed || c.venue || null, venueName: c.venueName || '', place: c.place || null,
      cast: Object.fromEntries(Object.entries(c.cast).map(([k, v]) => [k, snap(v)])),
      beats: c.beats, results: c.results || {}, outcome: c.outcome || null, endText: c.endText || null,
      slots: c.slots || null, hidden: c.hidden || null, props: c.props || null, lookPatch: c.lookPatch || null, facing: c.facing || null, scale: c.scale || null,
      bgm: c.bgm || null, pitch: c.pitch || null, outfits: c.outfits || null,
    });
    st.dramaAlbum.unshift(e);
    if (st.dramaAlbum.length > MAX) st.dramaAlbum.length = MAX;
  };
  // 저장본 → 재생용 대본 (떠난 주민은 스냅샷으로 등장)
  function toScript(e, edits) {
    const cast = {};
    for (const [k, s0] of Object.entries(e.cast)) {
      const live = s0.id === P ? S().player : Sim.byId(s0.id);
      cast[k] = live || Object.assign({ id: 'ghost_' + s0.id, name: s0.name, look: s0.look, keys: s0.keys, status: {}, outfit: null }, s0.child ? { child: { stage: s0.child.stage, parents: [] } } : {});
    }
    const c = JSON.parse(JSON.stringify(e));
    c.cast = cast; c.replay = true; c.key = 'replay'; c.venue = e.venue && (e.venue.loc === 'island' || FM.INTERIORS[e.venue.loc]) ? e.venue : null;
    if (edits) Object.assign(c, edits);
    return c;
  }
  Cut.replay = function (e, edits) {
    if (Cut.playing()) return;
    UI.closeModal();
    Cut.play(toScript(e, edits));
  };

  // ---------------------------------------------------------
  // 공유 코드
  // ---------------------------------------------------------
  const b64e = s => btoa(unescape(encodeURIComponent(s)));
  const b64d = s => decodeURIComponent(escape(atob(s)));
  const exportCode = e => 'FMDRAMA1:' + b64e(JSON.stringify(e));
  function importCode(code) {
    const m = String(code).trim().match(/^FMDRAMA1:([A-Za-z0-9+/=]+)$/);
    if (!m) throw new Error('코드 형식이 달라요');
    const e = JSON.parse(b64d(m[1]));
    if (!e || !e.beats || !e.cast || !e.theme) throw new Error('드라마 데이터가 아니에요');
    // 다른 섬의 주민은 이름으로 연결되지 않도록 고스트 아이디
    for (const s0 of Object.values(e.cast)) if (s0.id !== P && !Sim.byId(s0.id)) s0.id = 'x_' + s0.id;
    e.id = 'dr' + Date.now().toString(36); e.shared = true;
    if (e.venue && e.venue.loc !== 'island' && !FM.INTERIORS[e.venue.loc]) e.venue = null;
    return e;
  }

  // ---------------------------------------------------------
  // 앨범 화면
  // ---------------------------------------------------------
  const faces = e => Object.values(e.cast).slice(0, 4).map(s0 => { const v = s0.id === P ? S().player : Sim.byId(s0.id) || { id: 'g', name: s0.name, look: s0.look, keys: s0.keys, status: {} }; return FM.Face.img(v, 30); }).join('');
  UI.dramaAlbum = function (tab) {
    prune();
    const st = S(); const list = st.dramaAlbum || [];
    const q = Cut.queueLength ? Cut.queueLength() : 0;
    const K = FM.Vig ? FM.Vig.KINDS : {};
    UI.modal('📼 드라마 앨범', `
      ${q ? `<button class="news-hero" id="daNew"><span class="tv">🎬</span><span><b>새 드라마 ${q}편 도착!</b><small>눌러서 바로 보기</small></span></button>` : ''}
      <div class="da-tabs"><button data-t="list" class="${tab !== 'cat' ? 'on' : ''}">📼 저장된 드라마 (${list.length})</button><button data-t="cat" class="${tab === 'cat' ? 'on' : ''}">🎬 연출 카탈로그</button></div>
      <div class="da-body"></div>`, b => {
      const body = b.querySelector('.da-body');
      const paint = t => {
        b.querySelectorAll('.da-tabs button').forEach(x => x.classList.toggle('on', x.dataset.t === t));
        if (t === 'cat') {
          body.innerHTML = `<p class="muted">B급 멜로드라마 10종을 지금 섬에서 바로 촬영해요. 주민이 무작위로 캐스팅되고, 결과는 섬에 그대로 반영돼요!</p>
            <div class="da-cat">${Object.entries(K).map(([k, l]) => `<button data-k="${k}">${esc(l)}</button>`).join('')}</div>`;
          body.querySelectorAll('[data-k]').forEach(x => x.onclick = () => { UI.closeModal(); FM.Vig.run(x.dataset.k); });
          return;
        }
        body.innerHTML = `<div class="da-tools"><small class="muted">⏳ 드라마는 2일이 지나면 저절로 사라져요 (📌 보관하면 남아요)</small><button class="btn small ghost" id="daImport">📥 공유 코드로 불러오기</button></div>
          ${list.length ? `<div class="da-list">${list.map((e, i) => `<div class="da-card">
            <div class="da-ic">${ICON[e.theme] || '🎬'}</div>
            <div class="da-main"><b>제 ${e.ep || '?'}화 「${esc(e.sub || '')}」</b>${e.edited ? '<span class="tag pink">✏️ 편집본</span>' : ''}${e.shared ? '<span class="tag">📥 공유받음</span>' : ''}
              <small>${e.day}일차 ${esc(e.hm || '')}${e.venueName ? ` · 📍 ${esc(e.venueName)}` : ''}${e.pinned || e.edited || e.shared ? ' · 📌 보관됨' : ` · ⏳ ${Math.max(0, (Cut.EXPIRE_DAYS || 2) - (Sim.time.day() - e.day))}일 뒤 사라짐`}</small><div class="da-faces">${faces(e)}</div></div>
            <div class="da-btns"><button data-a="play" data-i="${i}">▶</button><button data-a="pin" data-i="${i}" title="${e.pinned ? '보관 해제' : '📌 보관 (자동 삭제 안 됨)'}" class="${e.pinned ? 'on' : ''}">📌</button><button data-a="edit" data-i="${i}" title="더빙 · 편집">✏️</button><button data-a="share" data-i="${i}" title="공유">🔗</button><button data-a="del" data-i="${i}" title="삭제">🗑</button></div></div>`).join('')}</div>` : '<p class="muted center">아직 저장된 드라마가 없어요. 고백 · 우정 · 결혼 같은 사건이 벌어지면 자동으로 쌓여요!</p>'}`;
        body.querySelector('#daImport').onclick = () => importDialog();
        body.querySelectorAll('[data-a]').forEach(x => x.onclick = () => {
          const e = list[+x.dataset.i]; if (!e) return;
          if (x.dataset.a === 'play') Cut.replay(e);
          if (x.dataset.a === 'pin') { e.pinned = !e.pinned; UI.toast(e.pinned ? '📌 보관했어요 — 2일이 지나도 사라지지 않아요' : '보관을 해제했어요'); paint('list'); }
          if (x.dataset.a === 'edit') editor(e);
          if (x.dataset.a === 'share') shareDialog(e);
          if (x.dataset.a === 'del') { if (confirm('이 드라마를 앨범에서 지울까요?')) { list.splice(+x.dataset.i, 1); paint('list'); } }
        });
      };
      b.querySelectorAll('.da-tabs button').forEach(x => x.onclick = () => paint(x.dataset.t));
      const nb = b.querySelector('#daNew'); if (nb) nb.onclick = () => { UI.closeModal(); Cut.playNext(); };
      paint(tab === 'cat' ? 'cat' : 'list');
    }, true);
  };

  // 더빙 & 대사 교체 편집기
  function editor(e) {
    const keys = Object.keys(e.cast);
    const lines = e.beats.map((b, i) => ({ b, i })).filter(x => x.b.say || x.b.narr);
    const bgms = FM.Audio.TRACKS ? Object.keys(FM.Audio.TRACKS) : [];
    UI.modal(`✏️ 더빙 & 대사 교체 — 제 ${e.ep}화`, `
      <label class="field">에피소드 제목 <input id="deSub" maxlength="24" value="${esc(e.sub || '')}"></label>
      <div class="de-grid">
        <label class="field">🎵 BGM <select id="deBgm"><option value="">(장면 기본)</option>${bgms.map(k => `<option value="${k}" ${e.bgm === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
      </div>
      <h4>🎭 출연진 — 의상 · 음성 피치</h4>
      <div class="de-cast">${keys.map(k => { const s0 = e.cast[k]; return `<div class="de-actor"><b>${esc(s0.name)}</b>
        <select data-out="${k}">${Object.entries(OUTFITS).map(([o, l]) => `<option value="${o}" ${(e.outfits || {})[k] === o ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <select data-pitch="${k}">${Object.entries(PITCH).map(([pv, l]) => `<option value="${pv}" ${String((e.pitch || {})[k] || 1) === pv ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`; }).join('')}</div>
      <h4>💬 대사</h4>
      <div class="de-lines">${lines.map(({ b, i }) => `<label class="de-line"><span>${esc(b.say ? (e.cast[b.say] || {}).name || b.say : (b.who || '해설'))}</span><input data-line="${i}" value="${esc(b.text || b.narr)}"></label>`).join('')}</div>
      <div class="md-actions"><button class="btn" id="deSave">💾 저장</button><button class="btn ghost" id="dePlay">▶ 저장하고 보기</button><button class="btn ghost" id="deCopy">📑 새 편집본으로 복사</button></div>`, b => {
      const collect = target => {
        target.sub = b.querySelector('#deSub').value.trim() || target.sub;
        target.bgm = b.querySelector('#deBgm').value || null;
        target.outfits = {}; target.pitch = {};
        b.querySelectorAll('[data-out]').forEach(x => { if (x.value) target.outfits[x.dataset.out] = x.value; });
        b.querySelectorAll('[data-pitch]').forEach(x => { if (+x.value !== 1) target.pitch[x.dataset.pitch] = +x.value; });
        b.querySelectorAll('[data-line]').forEach(x => { const bt = target.beats[+x.dataset.line]; if (!bt) return; if (bt.say) bt.text = x.value; else bt.narr = x.value; });
        target.edited = true;
        return target;
      };
      b.querySelector('#deSave').onclick = () => { collect(e); UI.toast('💾 편집본을 저장했어요'); UI.dramaAlbum(); };
      b.querySelector('#dePlay').onclick = () => { collect(e); Cut.replay(e); };
      b.querySelector('#deCopy').onclick = () => { const cp = JSON.parse(JSON.stringify(e)); cp.id = 'dr' + Date.now().toString(36); collect(cp); cp.sub = cp.sub + ' (편집본)'; S().dramaAlbum.unshift(cp); UI.toast('📑 새 편집본을 만들었어요'); UI.dramaAlbum(); };
    }, true);
  }
  function shareDialog(e) {
    const code = exportCode(e);
    UI.modal('🔗 드라마 공유하기', `<p>아래 코드를 복사해서 친구에게 보내 주세요. 친구는 📼 드라마 앨범 → "📥 공유 코드로 불러오기"로 볼 수 있어요!</p>
      <textarea class="da-code" readonly>${esc(code)}</textarea><div class="md-actions"><button class="btn" id="daCopy">📋 복사하기</button></div><p class="muted">코드 길이: ${code.length.toLocaleString()}자</p>`, b => {
      const ta = b.querySelector('textarea'); ta.onclick = () => ta.select();
      b.querySelector('#daCopy').onclick = async () => { try { await navigator.clipboard.writeText(code); UI.toast('📋 복사했어요!'); } catch (er) { ta.select(); document.execCommand && document.execCommand('copy'); UI.toast('📋 코드를 선택했어요. Ctrl+C 로 복사하세요'); } };
    });
  }
  function importDialog() {
    UI.modal('📥 공유 드라마 불러오기', `<p>친구에게 받은 <b>FMDRAMA1:</b> 로 시작하는 코드를 붙여 넣으세요.</p><textarea class="da-code" id="daIn" placeholder="FMDRAMA1:..."></textarea><div class="md-actions"><button class="btn" id="daGo">📥 불러오기</button></div><p class="muted" id="daErr"></p>`, b => {
      b.querySelector('#daGo').onclick = () => {
        try { const e = importCode(b.querySelector('#daIn').value); const st = S(); st.dramaAlbum = st.dramaAlbum || []; st.dramaAlbum.unshift(e); UI.toast(`📥 「${e.sub}」을(를) 앨범에 담았어요!`); UI.dramaAlbum(); }
        catch (er) { b.querySelector('#daErr').textContent = '⚠️ ' + er.message; }
      };
    });
  }
  Cut.exportCode = exportCode; Cut.importCode = importCode;

  // 🎬 버튼 → 앨범 (새 드라마가 있으면 맨 위에 표시)
  const origInit = UI.init;
  UI.init = function () {
    origInit();
    const b = $('#btnCut'); if (b) { b.title = '드라마 앨범 (새 드라마 · 다시 보기 · 편집 · 공유)'; b.onclick = () => UI.dramaAlbum(); }
  };
})();
// 신의 툴 탭에 '드라마 연출' 바로가기
(() => {
  const FM = window.FM, UI = FM.UI;
  const origTab = UI.tab;
  UI.tab = function (t) {
    origTab(t);
    if (t !== 'god' || !FM.Vig) return;
    const body = document.querySelector('#sideBody'); if (!body) return;
    const box = document.createElement('div'); box.className = 'god-drama';
    box.innerHTML = `<h4>🎬 B급 멜로드라마 연출 틀기</h4><div class="chips">${Object.entries(FM.Vig.KINDS).map(([k, l]) => `<button data-vk="${k}">${l}</button>`).join('')}</div><button class="btn small ghost" id="gdAlbum">📼 드라마 앨범 열기</button>`;
    body.prepend(box);
    box.querySelectorAll('[data-vk]').forEach(b => b.onclick = () => FM.Vig.run(b.dataset.vk));
    box.querySelector('#gdAlbum').onclick = () => UI.dramaAlbum();
  };
})();
