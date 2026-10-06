/* =========================================================
 *  📱 글래스 폰 — 오른쪽 위 폰 버튼 하나로 모든 메뉴
 *   기존 사이드 패널(#side)을 폰 모양으로 바꾸고, 탭 대신 앱 아이콘 홈 화면.
 *   앱: 주민 · 퀘스트 · 소식 · 가방 · 지도 · 관계도 · 관찰 · 드라마 · 뉴스 · 앨범 · 우리 집 · 신의 툴 · 설정 · 도움말
 *   단축키: P 또는 Tab = 폰 열기/닫기
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, UI = FM.UI;
  if (!UI) return;
  const $ = s => document.querySelector(s);
  const S = () => FM.Sim && FM.Sim.get();

  // [id, 아이콘, 이름, 배경, 동작(tab 이름이면 폰 안에서 열림 / 함수면 실행 후 폰 닫음), 배지 버튼 id]
  const APPS = [
    ['villagers', '👥', '주민', 'linear-gradient(135deg,#ffc8dc,#ff9ac8)', 'villagers'],
    ['love', '💞', '연애', 'linear-gradient(135deg,#ffd6e8,#ff7ab0)', 'love'],
    ['quest', '📜', '퀘스트', 'linear-gradient(135deg,#fff0b0,#ffd27a)', 'quest'],
    ['news', '📰', '소식', 'linear-gradient(135deg,#d0ecff,#8fc8ff)', 'news', 'rumorBadge'],
    ['bag', '🎒', '가방', 'linear-gradient(135deg,#d8f4c8,#9adc8a)', 'bag'],
    ['map', '🗺️', '지도', 'linear-gradient(135deg,#c8f4ec,#7ad8c8)', () => UI.toggleMap()],
    ['rel', '🕸️', '관계도', 'linear-gradient(135deg,#e8dcff,#b69cff)', () => FM.Drama && FM.Drama.openMap()],
    ['album', '📸', '앨범', 'linear-gradient(135deg,#ffe0f0,#ffb0d8)', () => FM.Photo && FM.Photo.album ? FM.Photo.album() : UI.toast('앨범이 아직 없어요')],
    ['tv', '📺', '뉴스', 'linear-gradient(135deg,#ffe0c8,#ffb07a)', () => click('#btnNews'), 'btnNews'],
    ['drama', '🎬', '장면', 'linear-gradient(135deg,#ffd0d8,#ff7a9a)', () => click('#btnCut'), 'btnCut'],
    ['home', '🏠', '우리 집', 'linear-gradient(135deg,#fff0d8,#ffc890)', () => click('#btnHome')],
    ['observe', '🏢', '관찰', 'linear-gradient(135deg,#d8e8ff,#9ab8f0)', () => click('#btnObserve')],
    ['god', '✨', '신의 툴', 'linear-gradient(135deg,#fff6c8,#ffe070)', 'god'],
  ];
  const DOCK = [
    ['settings', '⚙️', '설정', 'linear-gradient(135deg,#f0ecf4,#cfc6dc)', 'settings'],
    ['help', '❓', '도움말', 'linear-gradient(135deg,#e8f4ff,#bcd8f4)', 'help'],
  ];
  const TITLE = { villagers: '👥 주민', love: '💞 연애', quest: '📜 퀘스트', news: '📰 소식', bag: '🎒 가방', god: '✨ 신의 툴', settings: '⚙️ 설정', help: '❓ 도움말' };
  function click(sel) { const b = $(sel); if (b) b.click(); }

  let scr = null;
  function build() {
    const side = $('#side'); if (!side || side.querySelector('.ph-scr')) return;
    scr = document.createElement('div'); scr.className = 'ph-scr'; scr.dataset.mode = 'home';
    scr.innerHTML = `<div class="ph-bar"><span id="phClock">--:--</span><span class="notch"></span><span>📶 🔋</span></div>
      <div class="ph-head"><button class="ph-back" id="phBack" title="홈">◀</button><span id="phTitle"></span><button class="ph-back ph-x" id="phX2" title="닫기">✕</button></div>
      <div class="ph-home"><div class="ph-hello" id="phHello">친구모아 폰</div><div class="ph-sub" id="phSub">오늘도 좋은 하루!</div>
        <div class="ph-apps">${APPS.map(a => `<button class="ph-app" data-app="${a[0]}"><i style="background:${a[3]}">${a[1]}</i>${a[2]}</button>`).join('')}</div>
        <div class="ph-dock">${DOCK.map(a => `<button class="ph-app" data-app="${a[0]}"><i style="background:${a[3]}">${a[1]}</i></button>`).join('')}</div></div>`;
    const body = $('#sideBody');
    side.insertBefore(scr, body); scr.appendChild(body);
    scr.querySelectorAll('[data-app]').forEach(b => b.onclick = () => open(b.dataset.app));
    $('#phBack').onclick = () => home();
    $('#phX2').onclick = () => close();
  }
  function home() { if (!scr) return; scr.dataset.mode = 'home'; paint(); }
  function open(id) {
    const a = APPS.concat(DOCK).find(x => x[0] === id); if (!a) return;
    if (typeof a[4] === 'function') { close(); a[4](); return; }
    UI.tab(a[4]);
  }
  function show() { const s = $('#side'); if (!s) return; build(); s.classList.add('open'); home(); FM.Audio && FM.Audio.sfx && FM.Audio.sfx('page'); }
  function close() { const s = $('#side'); if (s) s.classList.remove('open'); }
  function toggle() { const s = $('#side'); if (s && s.classList.contains('open')) close(); else show(); }
  // 폰 안에서 탭을 열면 앱 화면으로
  const oTab = UI.tab;
  UI.tab = function (t) {
    const r = oTab.apply(this, arguments);
    try { build(); if (scr) { scr.dataset.mode = 'app'; $('#phTitle').textContent = TITLE[t] || ''; } $('#side').classList.add('open'); } catch (e) { /* */ }
    return r;
  };
  function paint() {
    try {
      const st = S(); if (!st || !scr) return;
      const h = Math.floor((st.time % 1440) / 60), m = Math.floor(st.time % 60);
      $('#phClock').textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const greet = h < 6 ? '🌙 깊은 밤이에요' : h < 11 ? '☀️ 좋은 아침!' : h < 17 ? '🌤️ 즐거운 오후!' : h < 21 ? '🌆 노을 지는 저녁' : '🌙 별이 예쁜 밤';
      $('#phHello').textContent = greet;
      $('#phSub').textContent = `${FM.Sim.time.day()}일차 · 🪙 ${Math.floor(st.player.coins).toLocaleString()}`;
      let total = 0;
      for (const a of APPS) {
        const el = scr.querySelector(`[data-app="${a[0]}"]`); if (!el) continue;
        let n = 0;
        if (a[5]) { const b = $('#' + a[5]); n = b && b.dataset.badge ? +b.dataset.badge || 0 : 0; }
        let em = el.querySelector('em'); if (n) { if (!em) { em = document.createElement('em'); el.appendChild(em); } em.textContent = n; } else if (em) em.remove();
        total += n;
      }
      const pb = $('#btnPhone'); if (pb) pb.dataset.badge = total ? String(total) : '';
    } catch (e) { /* */ }
  }
  UI.phone = { show, close, toggle, home, open, APPS };

  const oInit = UI.init;
  UI.init = function () {
    oInit.apply(this, arguments);
    const hb = $('.hud-btns');
    if (hb && !$('#btnPhone')) {
      const b = document.createElement('button'); b.id = 'btnPhone'; b.title = '친구모아 폰 (P / Tab)'; b.textContent = '📱'; hb.appendChild(b);
      b.onclick = toggle;
      for (const id of ['btnCut', 'btnNews', 'btnHome']) { const x = $('#' + id); if (x) x.style.display = 'none'; }
    }
    build(); close();
    setInterval(paint, 1000);
    document.addEventListener('keydown', e => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if ((e.code === 'KeyP' || e.code === 'Tab') && !UI.modalOpen()) { e.preventDefault(); toggle(); }
      else if (e.code === 'Escape' && $('#side') && $('#side').classList.contains('open') && !UI.modalOpen()) { if (scr && scr.dataset.mode === 'app') home(); else close(); }
    });
  };
})();
