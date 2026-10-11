/* =========================================================
 *  🎲 건물별 미니게임 & 이벤트
 *   ☕ 카페      : 라테아트 (손님 주문 모양을 우유로 그리기 → 일치율 채점 · 팁)
 *   📚 도서관    : 책 & 마을 퀴즈 (5문제) · 일요일 오후 주민 독서 모임
 *   🕹️ 오락실    : '별똥별 캐처' 아케이드 게임 · 주간 최고 점수 대회 & 랭킹판 (일요일 22시 시상)
 *   🔭 천문대    : 별자리 잇기 (북두칠성 · 카시오페이아 · 오리온 · 백조) · 4일마다 밤 유성우 이벤트 & 소원 빌기
 *   ⛪ 성당      : 웨딩 플래너 (꽃 · 드레스 · 장식 · 음악 · 케이크 · 하객 → 결혼 만족도)
 *   🛍️ 쇼핑몰    : 패션쇼 (주민 코디 → 미리보기 → 런웨이 심사 · 옷 선물)
 *   🎷 클럽      : 노래방 배틀 (4줄 리듬게임 vs 주민)
 *   🏥 병원      : 정기 검진 (시력 검사 · 결과지 · 스태미나 회복) · 간호 미니게임 (증상에 맞는 약)
 *   🔨 공방      : 재료 조합 가구 만들기 (망치질 타이밍 → 품질) → 우리 집에 배치
 *   🛁 온천      : 온천 탁구 (vs 주민) · 유카타 갈아입기
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, D = FM.D;
  if (!Sim || !Soc) return;
  const P = 'P', S = () => Sim.get();
  const UI = () => FM.UI;
  const pick = a => a[(Math.random() * a.length) | 0];
  const chance = p => Math.random() < p;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const day = () => Sim.time.day(), hr = () => Sim.time.hour();
  const kv = v => (v && v.keys ? Object.values(v.keys) : []);
  const has = (v, k) => kv(v).includes(k);
  const face = (v, px = 18) => (FM.Face && v ? FM.Face.img(v, px) : '');
  const nameOf = id => (id === P ? S().player.name : (Sim.byId(id) || {}).name || '?');
  const sfx = k => { try { FM.Audio && FM.Audio.sfx && FM.Audio.sfx(k); } catch (e) { /* */ } };
  const pay = n => { const p = S().player; if (p.coins < n) { UI().toast(`코인이 부족해요 (${n}🪙)`); return false; } p.coins -= n; return true; };
  const earn = n => { if (n > 0) { S().player.coins += n; sfx('coin'); } };
  const usable = v => v && !v.staff && !v.visitor && !(v.status && v.status.hospital) && !(v.child && v.child.stage === 'BABY');
  const here = () => { const p = S().player; return S().villagers.filter(v => usable(v) && v.loc === p.loc); };
  const friends = () => S().villagers.filter(usable).sort((a, b) => (Soc.rel(b.id, P).friendship_point || 0) - (Soc.rel(a.id, P).friendship_point || 0));
  const alive = el => el && document.body.contains(el);
  const loop = (el, fn) => { let last = performance.now(); const f = t => { if (!alive(el)) return; const dt = Math.min(0.05, (t - last) / 1000); last = t; if (fn(dt) !== false) requestAnimationFrame(f); }; requestAnimationFrame(f); };
  const css = `<style>.mg{font-size:14px}.mg canvas{display:block;margin:0 auto;border-radius:12px;touch-action:none;max-width:100%}.mg .row{display:flex;gap:6px;flex-wrap:wrap;align-items:center;justify-content:center;margin:8px 0}.mg .pill{background:#fff4e6;border-radius:999px;padding:3px 10px}.mg .big{font-size:22px;font-weight:700}.mg .opt{padding:6px 10px;border-radius:10px;border:2px solid #f0d8c0;background:#fffaf4;cursor:pointer;color:#5a3a2a}.mg .opt.on{border-color:#ff8a6a;background:#ffe2d6;font-weight:700}.mg table{width:100%;border-collapse:collapse}.mg td{padding:4px 6px;border-bottom:1px solid #f2e4d6}.mg .muted{color:#9a8070;font-size:12px}</style>`;
  const modal = (t, html, mount, wide) => UI().modal(t, css + `<div class="mg">${html}</div>`, b => mount && mount(b.querySelector('.mg') || b), wide);
  const bond = (v, amt, why) => { if (v && v.id !== P) { Soc.addFriend(v.id, P, amt, 2, why); } };

  // =========================================================
  // ☕ 라테아트
  // =========================================================
  const LATTE = {
    heart: { name: '하트', draw: c => { c.beginPath(); c.moveTo(0, 48); c.bezierCurveTo(-90, -8, -48, -86, 0, -38); c.bezierCurveTo(48, -86, 90, -8, 0, 48); c.fill(); } },
    tulip: { name: '튤립', draw: c => { for (const [y, rx, ry] of [[-44, 30, 18], [-10, 40, 21], [28, 50, 22]]) { c.beginPath(); c.ellipse(0, y, rx, ry, 0, 0, 7); c.fill(); } c.fillRect(-4, 46, 8, 30); } },
    rosetta: { name: '로제타 (나뭇잎)', draw: c => { for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(0, -62 + i * 17, 56 - i * 6, 9, 0, 0, 7); c.fill(); } c.fillRect(-3, -70, 6, 140); } },
    bear: { name: '곰돌이', draw: c => { c.beginPath(); c.arc(0, 12, 52, 0, 7); c.fill(); for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 42, -36, 20, 0, 7); c.fill(); } } },
    swan: { name: '백조', draw: c => { c.beginPath(); c.ellipse(10, 30, 56, 26, 0, 0, 7); c.fill(); c.fillRect(-46, -40, 12, 68); c.beginPath(); c.arc(-40, -48, 14, 0, 7); c.fill(); } },
  };
  function latte(customer) {
    const keys = Object.keys(LATTE), want = pick(keys), R = 120, SZ = 280;
    const cust = customer || pick(here().length ? here() : friends().slice(0, 8));
    modal('☕ 라테아트 — 주문을 그려 주세요!', `
      <div class="row"><span class="pill">${face(cust)} ${esc(cust ? cust.name : '손님')}: "<b>${LATTE[want].name}</b> 라테 부탁해요!"</span></div>
      <canvas id="lt" width="${SZ}" height="${SZ}"></canvas>
      <div class="row"><span class="muted">컵 위를 드래그해서 우유를 부어요 (흐린 선이 주문 모양)</span></div>
      <div class="row">🥛 <div style="width:160px;height:10px;background:#eee;border-radius:6px;overflow:hidden"><div id="ltMilk" style="height:100%;width:100%;background:#ffe9c8"></div></div>
        <button class="btn small" id="ltReset">다시</button><button class="btn main" id="ltDone">완성! 내놓기</button></div>`, b => {
      const cv = b.querySelector('#lt'), c = cv.getContext('2d');
      const milk = document.createElement('canvas'); milk.width = milk.height = SZ; const mc = milk.getContext('2d');
      const mask = document.createElement('canvas'); mask.width = mask.height = SZ; const kc = mask.getContext('2d');
      kc.translate(SZ / 2, SZ / 2); kc.scale(1.05, 1.05); kc.fillStyle = '#fff'; LATTE[want].draw(kc);
      let left = 260, down = false, lx = 0, ly = 0;
      const paint = () => {
        c.clearRect(0, 0, SZ, SZ);
        c.fillStyle = '#f4efe8'; c.beginPath(); c.arc(SZ / 2, SZ / 2, R + 14, 0, 7); c.fill();
        c.fillStyle = '#ffffff'; c.beginPath(); c.arc(SZ / 2, SZ / 2, R + 6, 0, 7); c.fill();
        const g = c.createRadialGradient(SZ / 2, SZ / 2, 10, SZ / 2, SZ / 2, R); g.addColorStop(0, '#b0703a'); g.addColorStop(0.75, '#8a4e24'); g.addColorStop(1, '#5a2e14'); c.fillStyle = g; c.beginPath(); c.arc(SZ / 2, SZ / 2, R, 0, 7); c.fill();
        c.save(); c.globalAlpha = 0.16; c.drawImage(mask, 0, 0); c.restore();
        c.save(); c.beginPath(); c.arc(SZ / 2, SZ / 2, R, 0, 7); c.clip(); c.drawImage(milk, 0, 0); c.restore();
        b.querySelector('#ltMilk').style.width = (left / 2.6) + '%';
      };
      const dab = (x, y) => { if (left <= 0) return; const r = 11; const gr = mc.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,248,236,1)'); gr.addColorStop(0.7, 'rgba(255,244,228,0.9)'); gr.addColorStop(1, 'rgba(255,240,220,0)'); mc.fillStyle = gr; mc.beginPath(); mc.arc(x, y, r, 0, 7); mc.fill(); left -= 0.35; };
      const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * SZ / r.width, (e.clientY - r.top) * SZ / r.height]; };
      cv.onpointerdown = e => { down = true; [lx, ly] = pos(e); dab(lx, ly); paint(); cv.setPointerCapture(e.pointerId); };
      cv.onpointermove = e => { if (!down) return; const [x, y] = pos(e); const n = Math.ceil(Math.hypot(x - lx, y - ly) / 4); for (let i = 1; i <= n; i++) dab(lx + (x - lx) * i / n, ly + (y - ly) * i / n); lx = x; ly = y; paint(); };
      cv.onpointerup = () => { down = false; };
      b.querySelector('#ltReset').onclick = () => { mc.clearRect(0, 0, SZ, SZ); left = 260; paint(); };
      b.querySelector('#ltDone').onclick = () => {
        const a = kc.getImageData(0, 0, SZ, SZ).data, m = mc.getImageData(0, 0, SZ, SZ).data; let A = 0, B = 0, I = 0;
        for (let y = 0; y < SZ; y += 3) for (let x = 0; x < SZ; x += 3) { if (Math.hypot(x - SZ / 2, y - SZ / 2) > R) continue; const i = (y * SZ + x) * 4 + 3; const ta = a[i] > 128, tb = m[i] > 90; if (ta) A++; if (tb) B++; if (ta && tb) I++; }
        const score = Math.round(A + B ? 200 * I / (A + B) : 0);
        const tip = Math.round(score * 0.8), grade = score >= 75 ? '🌟 완벽해요!' : score >= 55 ? '😊 훌륭해요!' : score >= 35 ? '🙂 괜찮아요' : '😅 음... 이건 뭐죠?';
        earn(tip); if (cust) { bond(cust, Math.round(score / 18), '라테아트'); Sim.emote(cust, score >= 55 ? '😍' : '😅', 3); }
        S().stats = S().stats || {}; S().stats.latteBest = Math.max(S().stats.latteBest || 0, score);
        modal('☕ 라테아트 결과', `<div class="row"><img src="${cv.toDataURL()}" style="width:180px;border-radius:50%"></div><div class="row big">${grade}</div><div class="row">일치율 <b>${score}%</b> · 팁 <b>${tip}🪙</b> ${cust ? `· ${esc(cust.name)}의 호감 ↑` : ''}</div><div class="row"><button class="btn main" id="ltNext">다음 손님 받기</button><button class="btn" id="ltOk">그만하기</button></div>`, b2 => { b2.querySelector('#ltNext').onclick = () => latte(); b2.querySelector('#ltOk').onclick = () => UI().closeModal(); });
      };
      paint();
    });
  }

  // =========================================================
  // 📚 도서관 퀴즈 & 독서 모임
  // =========================================================
  const QBANK = [
    ['『어린 왕자』를 쓴 작가는?', ['생텍쥐페리', '헤밍웨이', '안데르센', '톨스토이'], 0],
    ['『햄릿』의 작가는?', ['셰익스피어', '괴테', '디킨스', '위고'], 0],
    ['『해리 포터』 주인공이 다니는 학교는?', ['호그와트', '나니아', '올림포스', '아발론'], 0],
    ['『이상한 나라의 앨리스』에서 앨리스가 따라간 동물은?', ['흰 토끼', '검은 고양이', '애벌레', '거북'], 0],
    ['『홍길동전』을 쓴 사람은?', ['허균', '김만중', '박지원', '정약용'], 0],
    ['『노인과 바다』의 노인이 잡은 것은?', ['커다란 청새치', '고래', '상어 떼', '문어'], 0],
    ['『피노키오』는 거짓말을 하면 무엇이 길어질까?', ['코', '귀', '머리카락', '손톱'], 0],
    ['『빨간 머리 앤』의 앤이 사는 곳은?', ['초록 지붕 집', '하얀 성', '바닷가 등대', '빵집 2층'], 0],
    ['『셜록 홈즈』의 단짝 친구는?', ['왓슨 박사', '레스트레이드', '모리아티', '허드슨 부인'], 0],
    ['『춘향전』에서 춘향의 연인은?', ['이몽룡', '변학도', '방자', '홍길동'], 0],
    ['『작은 아씨들』은 몇 자매의 이야기?', ['넷', '셋', '다섯', '둘'], 0],
    ['『오즈의 마법사』 도로시의 강아지 이름은?', ['토토', '바둑이', '스누피', '맥스'], 0],
    ['도서 분류에서 800번대는 어떤 분야?', ['문학', '역사', '과학', '예술'], 0],
    ['책 뒤표지 바코드 위에 있는 13자리 번호는?', ['ISBN', 'URL', 'PIN', 'GPS'], 0],
    ['『별 헤는 밤』을 쓴 시인은?', ['윤동주', '김소월', '한용운', '이상'], 0],
    ['『진달래꽃』을 쓴 시인은?', ['김소월', '윤동주', '백석', '정지용'], 0],
  ];
  function islandQs() {
    const st = S(), out = [], vs = st.villagers.filter(usable);
    const L1 = D.L1 || {};
    for (const v of vs.slice().sort(() => Math.random() - 0.5).slice(0, 4)) {
      const k = kv(v).find(x => L1[x]); if (!k) continue;
      const wrong = Object.keys(L1).filter(x => x !== k).sort(() => Math.random() - 0.5).slice(0, 3);
      out.push([`우리 마을 ${v.name}의 성격은?`, [L1[k].name].concat(wrong.map(x => L1[x].name)), 0]);
    }
    for (const v of vs) { const pt = Soc.partnerOf(v.id); if (pt && pt !== P && out.length < 7) { const others = vs.filter(o => o.id !== pt && o !== v).sort(() => Math.random() - 0.5).slice(0, 3); if (others.length === 3) out.push([`${v.name}의 연인은 누구일까?`, [nameOf(pt)].concat(others.map(o => o.name)), 0]); } }
    return out;
  }
  function quiz() {
    const qs = QBANK.slice().sort(() => Math.random() - 0.5).slice(0, 3).concat(islandQs().sort(() => Math.random() - 0.5).slice(0, 2));
    while (qs.length < 5) qs.push(pick(QBANK));
    let i = 0, ok = 0;
    const next = () => {
      if (i >= qs.length) { const prize = ok * 25 + (ok === 5 ? 80 : 0); earn(prize); for (const v of here()) if (has(v, 'STUDY') || has(v, 'SCHOLARLY')) { bond(v, 2, '도서관 퀴즈'); Sim.emote(v, '👏', 2); }
        return modal('📚 퀴즈 결과', `<div class="row big">${ok} / 5 정답!</div><div class="row">${ok === 5 ? '🏅 만점 보너스까지! ' : ''}상금 <b>${prize}🪙</b></div><div class="row"><button class="btn main" id="qA">한 번 더</button><button class="btn" id="qX">닫기</button></div>`, b => { b.querySelector('#qA').onclick = quiz; b.querySelector('#qX').onclick = () => UI().closeModal(); }); }
      const [q, a, c] = qs[i]; const order = a.map((t, k) => [t, k]).sort(() => Math.random() - 0.5);
      modal(`📚 도서관 퀴즈 ${i + 1}/5`, `<div class="row big" style="text-align:center">${esc(q)}</div><div class="row" style="flex-direction:column;align-items:stretch">${order.map(([t, k]) => `<button class="opt" data-k="${k}">${esc(t)}</button>`).join('')}</div><div class="row"><div style="width:100%;height:6px;background:#eee;border-radius:4px"><div id="qT" style="height:100%;width:100%;background:#ff9a6a;border-radius:4px"></div></div></div>`, b => {
        let t = 12, done = false; const bar = b.querySelector('#qT');
        const answer = k => { if (done) return; done = true; const right = k === c; if (right) { ok++; sfx('coin'); } b.querySelectorAll('[data-k]').forEach(x => { x.disabled = true; if (+x.dataset.k === c) x.style.background = '#c8f0c8'; else if (+x.dataset.k === k) x.style.background = '#ffd0d0'; }); setTimeout(() => { i++; next(); }, 900); };
        b.querySelectorAll('[data-k]').forEach(x => x.onclick = () => answer(+x.dataset.k));
        loop(bar, dt => { if (done) return false; t -= dt; bar.style.width = (t / 12 * 100) + '%'; if (t <= 0) { answer(-1); return false; } });
      });
    };
    next();
  }
  const BOOKS = [['『어린 왕자』', '어른이 되면 잊어버리는 것들'], ['『작은 아씨들』', '가족과 꿈 사이에서'], ['『노인과 바다』', '끝까지 포기하지 않는 마음'], ['『빨간 머리 앤』', '상상력이 세상을 바꾼다']];
  const isClubTime = () => Sim.time.weekday() === 6 && hr() >= 14 && hr() < 18;
  function bookClub() {
    const st = S(); if ((st.bookClubDay || 0) === day()) return UI().toast('오늘 독서 모임은 이미 끝났어요. 다음 주 일요일에 만나요!');
    const ppl = friends().filter(v => has(v, 'STUDY') || has(v, 'SCHOLARLY') || has(v, 'ROMANTIC') || has(v, 'DREAMY')).slice(0, 2).concat(friends().slice(0, 6)).filter((v, k, a) => a.indexOf(v) === k).slice(0, 4);
    modal('📖 일요일 독서 모임 — 이번 주 책 고르기', `<div class="row" style="flex-direction:column;align-items:stretch">${BOOKS.map((bk, k) => `<button class="opt" data-b="${k}">${bk[0]} <span class="muted">— ${bk[1]}</span></button>`).join('')}</div><div class="row muted">참석: ${ppl.map(v => face(v) + ' ' + esc(v.name)).join(' · ')}</div>`, b => {
      b.querySelectorAll('[data-b]').forEach(x => x.onclick = () => {
        const bk = BOOKS[+x.dataset.b]; let k = 0, good = 0;
        const LINES = { ROMANTIC: '주인공의 마음이 너무 애틋해서 밤새 울었어...', SCHOLARLY: '작가가 숨겨 둔 상징을 정리해 왔어. 3장부터 볼까?', CRANKY: '흥, 솔직히 좀 뻔했어. ...근데 마지막은 좀 좋더라.', ARTISTIC: '읽는 내내 머릿속에 색깔이 막 떠올랐어!', LAZY: '반쯤 읽다 잠들었는데... 꿈에서 결말을 봤어!', EXTROVERT: '다들 몇 쪽이 제일 좋았어? 난 이 장면!', INTROVERT: '...조용히 곱씹게 되는 책이었어.', ANXIOUS: '주인공이 잘못될까 봐 너무 조마조마했어...', ATHLETIC: '포기하지 않는 장면에서 힘이 났어! 나도 달리고 싶어져!', SNOB: '원서로 읽으면 문장이 훨씬 우아하답니다.' };
        const one = () => {
          if (k >= ppl.length) { st.bookClubDay = day(); const prize = 40 + good * 15; earn(prize); for (const v of ppl) { bond(v, 2 + good, '독서 모임'); Sim.emote(v, '📖', 3); } Sim.log('rel', `📖 도서관 일요 독서 모임: ${bk[0]} — ${ppl.map(v => v.name).join(', ')}와 함께 이야기를 나눴어요`, [P].concat(ppl.map(v => v.id)), 1);
            return modal('📖 독서 모임 끝!', `<div class="row big">${bk[0]}</div><div class="row">공감 포인트 ${good}/${ppl.length} · 다과 상품권 <b>${prize}🪙</b></div><div class="row muted">참석한 주민들과 한층 가까워졌어요.</div><div class="row"><button class="btn main" id="bcX">확인</button></div>`, b3 => { b3.querySelector('#bcX').onclick = () => UI().closeModal(); }); }
          const v = ppl[k], key = kv(v).find(z => LINES[z]) || 'EXTROVERT', best = { ROMANTIC: 0, ANXIOUS: 0, INTROVERT: 0, SCHOLARLY: 1, SNOB: 1, CRANKY: 2, LAZY: 2, ARTISTIC: 2, EXTROVERT: 1, ATHLETIC: 0 }[key] || 0;
          modal(`📖 ${bk[0]} — 이야기 나누기 (${k + 1}/${ppl.length})`, `<div class="row">${face(v, 40)}</div><div class="row big" style="font-size:16px">${esc(v.name)}: "${LINES[key]}"</div><div class="row" style="flex-direction:column;align-items:stretch"><button class="opt" data-r="0">💗 "맞아, 나도 그 마음 알 것 같아."</button><button class="opt" data-r="1">🧐 "그 부분, 이렇게도 읽히지 않아?"</button><button class="opt" data-r="2">😆 "ㅋㅋ 너답다! 그 얘기 더 해 줘."</button></div>`, b2 => {
            b2.querySelectorAll('[data-r]').forEach(y => y.onclick = () => { if (+y.dataset.r === best) { good++; Sim.emote(v, '💕', 2); UI().toast(`${v.name}: "역시 너랑 얘기하면 통해!"`); } else UI().toast(`${v.name}: "음, 그렇게 볼 수도 있겠다."`); k++; one(); });
          });
        };
        one();
      });
    });
  }

  // =========================================================
  // 🕹️ 오락실 — 별똥별 캐처 & 주간 대회
  // =========================================================
  const weekNo = () => Math.floor((day() - 1) / 7);
  const cup = () => { const st = S(); if (!st.arcadeCup || st.arcadeCup.week !== weekNo()) st.arcadeCup = { week: weekNo(), best: {}, done: false, last: st.arcadeCup && st.arcadeCup.champ ? st.arcadeCup.champ : null }; return st.arcadeCup; };
  function starCatch() {
    const W = 360, Hh = 440;
    modal('🕹️ 별똥별 캐처 — 이번 주 최고 점수 도전!', `<div class="row"><span class="pill">⭐ <b id="scS">0</b></span><span class="pill">❤️ <b id="scL">3</b></span><span class="pill">⏱ <b id="scT">40</b></span><span class="pill muted">내 주간 최고 ${cup().best[P] || 0}</span></div><canvas id="sc" width="${W}" height="${Hh}"></canvas><div class="row muted">마우스/손가락 또는 ← → 키로 바구니를 움직여요 · 💣 피하기 · 🌈 무지개별 ×5</div>`, b => {
      const cv = b.querySelector('#sc'), c = cv.getContext('2d');
      let x = W / 2, score = 0, lives = 3, t = 40, spawn = 0, over = false; const items = [], keys = {};
      const kd = e => { keys[e.key] = true; }, ku = e => { keys[e.key] = false; };
      window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
      cv.onpointermove = e => { const r = cv.getBoundingClientRect(); x = clamp((e.clientX - r.left) * W / r.width, 30, W - 30); };
      const bgStars = Array.from({ length: 50 }, () => [Math.random() * W, Math.random() * Hh, Math.random()]);
      loop(cv, dt => {
        if (over) return false;
        t -= dt; spawn -= dt; if (keys.ArrowLeft) x -= 360 * dt; if (keys.ArrowRight) x += 360 * dt; x = clamp(x, 30, W - 30);
        const lvl = 1 + (40 - t) / 18;
        if (spawn <= 0) { spawn = 0.55 / lvl; const r = Math.random(); items.push({ x: 20 + Math.random() * (W - 40), y: -20, v: (120 + Math.random() * 90) * lvl, k: r < 0.18 ? 'bomb' : r < 0.24 ? 'rainbow' : 'star' }); }
        for (const it of items) it.y += it.v * dt;
        for (let i = items.length - 1; i >= 0; i--) { const it = items[i]; if (it.y > Hh - 46 && it.y < Hh - 16 && Math.abs(it.x - x) < 38) { if (it.k === 'bomb') { lives--; sfx('pop'); } else { score += it.k === 'rainbow' ? 50 : 10; sfx('coin'); } items.splice(i, 1); } else if (it.y > Hh + 20) items.splice(i, 1); }
        const g = c.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, '#120a3a'); g.addColorStop(1, '#4a2a7a'); c.fillStyle = g; c.fillRect(0, 0, W, Hh);
        for (const [sx, sy, a] of bgStars) { c.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * Math.abs(Math.sin(performance.now() / 600 + a * 9))})`; c.fillRect(sx, sy, 2, 2); }
        c.font = '28px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        for (const it of items) c.fillText(it.k === 'bomb' ? '💣' : it.k === 'rainbow' ? '🌈' : '⭐', it.x, it.y);
        c.fillStyle = '#ff8ad0'; c.beginPath(); c.roundRect ? c.roundRect(x - 36, Hh - 34, 72, 22, 8) : c.rect(x - 36, Hh - 34, 72, 22); c.fill(); c.font = '26px sans-serif'; c.fillText('🧺', x, Hh - 40);
        b.querySelector('#scS').textContent = score; b.querySelector('#scL').textContent = lives; b.querySelector('#scT').textContent = Math.ceil(t);
        if (t <= 0 || lives <= 0) {
          over = true; window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
          const cp = cup(), prev = cp.best[P] || 0; cp.best[P] = Math.max(prev, score); const coins = Math.round(score / 6); earn(coins);
          setTimeout(() => modal('🕹️ 게임 오버!', `<div class="row big">⭐ ${score}점</div><div class="row">${score > prev ? '🎉 주간 개인 최고 기록 갱신!' : `주간 최고 ${prev}점`} · 보상 <b>${coins}🪙</b></div><div class="row"><button class="btn main" id="scA">다시 (10🪙)</button><button class="btn" id="scR">🏆 랭킹판</button></div>`, b2 => { b2.querySelector('#scA').onclick = () => { if (pay(10)) starCatch(); }; b2.querySelector('#scR').onclick = board; }), 300);
          return false;
        }
      });
    });
  }
  function board() {
    const cp = cup(); const rows = Object.entries(cp.best).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const wd = Sim.time.weekday(); const left = wd === 6 ? (hr() < 22 ? '오늘 밤 22시 시상!' : '시상 완료') : `시상까지 ${6 - wd}일 (일요일 22시)`;
    modal(`🏆 네온 스파크 주간 랭킹판 — ${weekNo() + 1}주차`, `<div class="row"><span class="pill">🎁 1등 300🪙 + 트로피 · 2등 120🪙 · 3등 60🪙</span><span class="pill muted">${left}</span></div>
      <table>${rows.map(([id, sc], i) => `<tr style="${id === P ? 'background:#fff1d0;font-weight:700' : ''}"><td>${['🥇', '🥈', '🥉'][i] || (i + 1)}</td><td>${id === P ? '🙋 ' + esc(S().player.name) : face(Sim.byId(id)) + ' ' + esc(nameOf(id))}</td><td style="text-align:right">⭐ ${sc}</td></tr>`).join('') || '<tr><td class="muted">아직 기록이 없어요. 첫 기록의 주인공이 되어 보세요!</td></tr>'}</table>
      ${cp.last ? `<div class="row muted">지난주 챔피언: ${esc(nameOf(cp.last))} 👑</div>` : ''}<div class="row"><button class="btn main" id="bdP">🕹️ 도전하기 (10🪙)</button></div>`, b => { b.querySelector('#bdP').onclick = () => { if (pay(10)) starCatch(); }; });
  }
  FM.bus.on('hour', h => { try {
    const st = S(); if (!st) return; const cp = cup();
    if (h >= 11 && h <= 23) for (const v of st.villagers) if (usable(v) && (v.loc === 'arcade_in' || chance(0.04))) { const base = 120 + (has(v, 'PASSIONATE') ? 80 : 0) + (has(v, 'ATHLETIC') ? 40 : 0) + (has(v, 'LAZY') ? -40 : 0); const sc = Math.round(base + Math.random() * 260); if (sc > (cp.best[v.id] || 0)) cp.best[v.id] = sc; }
    if (Sim.time.weekday() === 6 && h === 22 && !cp.done) {
      cp.done = true; const rows = Object.entries(cp.best).sort((a, b) => b[1] - a[1]); if (!rows.length) return;
      const pr = [300, 120, 60]; rows.slice(0, 3).forEach(([id], i) => { if (id === P) { earn(pr[i]); if (i === 0) Soc.giveItem && D.ITEMS.trophy && Soc.giveItem('trophy'); } else { const v = Sim.byId(id); if (v) Sim.emote(v, ['🏆', '🥈', '🥉'][i], 5); } });
      cp.champ = rows[0][0];
      Sim.log('rel', `🏆 오락실 주간 대회 결과: 1등 ${nameOf(rows[0][0])} (${rows[0][1]}점)${rows[1] ? ` · 2등 ${nameOf(rows[1][0])}` : ''}${rows[2] ? ` · 3등 ${nameOf(rows[2][0])}` : ''}`, rows.slice(0, 3).map(r => r[0]), 2);
      if (rows.slice(0, 3).some(r => r[0] === P)) UI().toast('🏆 오락실 주간 대회 입상! 상금을 받았어요');
    }
  } catch (e) { console.error('arcade cup', e); } });

  // =========================================================
  // 🔭 별자리 잇기 & 유성우
  // =========================================================
  const CONST = [
    { name: '북두칠성', p: [[.14, .3], [.27, .24], [.38, .3], [.48, .4], [.52, .6], [.72, .62], [.75, .42]], e: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
    { name: '카시오페이아', p: [[.12, .32], [.3, .62], [.46, .38], [.62, .64], [.82, .34]], e: [[0, 1], [1, 2], [2, 3], [3, 4]] },
    { name: '오리온', p: [[.3, .14], [.66, .18], [.42, .5], [.5, .52], [.58, .54], [.32, .86], [.7, .84]], e: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]] },
    { name: '백조자리', p: [[.5, .1], [.5, .36], [.5, .6], [.5, .9], [.18, .44], [.82, .28]], e: [[0, 1], [1, 2], [2, 3], [4, 1], [1, 5]] },
  ];
  function stars(idx = 0) {
    const cn = CONST[idx % CONST.length], W = 380, Hh = 300, pad = 30;
    const pts = cn.p.map(([x, y]) => [pad + x * (W - pad * 2), pad + y * (Hh - pad * 2)]);
    const decoy = []; let guard = 0; while (decoy.length < 16 && guard++ < 400) { const q = [pad + Math.random() * (W - pad * 2), pad + Math.random() * (Hh - pad * 2)]; if (pts.concat(decoy).every(o => Math.hypot(o[0] - q[0], o[1] - q[1]) > 34)) decoy.push(q); }
    const all = pts.concat(decoy), want = new Set(cn.e.map(([a, b]) => [Math.min(a, b), Math.max(a, b)].join('-')));
    modal(`🔭 별자리 잇기 — ${cn.name} (${idx % CONST.length + 1}/${CONST.length})`, `<div class="row"><canvas id="cs" width="${W}" height="${Hh}"></canvas><canvas id="csT" width="110" height="90" style="background:#0e1640;margin:0"></canvas></div><div class="row muted">오른쪽 그림처럼 별을 두 개씩 눌러 선을 이어요 · 잘못 이은 선을 다시 누르면 지워져요</div><div class="row"><button class="btn small" id="csC">모두 지우기</button><span class="pill" id="csN"></span></div>`, b => {
      const cv = b.querySelector('#cs'), c = cv.getContext('2d'), th = b.querySelector('#csT').getContext('2d');
      th.strokeStyle = '#9ad8ff'; th.lineWidth = 2; th.fillStyle = '#fff';
      for (const [a, b2] of cn.e) { th.beginPath(); th.moveTo(8 + cn.p[a][0] * 94, 6 + cn.p[a][1] * 78); th.lineTo(8 + cn.p[b2][0] * 94, 6 + cn.p[b2][1] * 78); th.stroke(); }
      for (const [x, y] of cn.p) { th.beginPath(); th.arc(8 + x * 94, 6 + y * 78, 3, 0, 7); th.fill(); }
      const lines = new Set(); let sel = -1, solved = false; const bg = Array.from({ length: 140 }, () => [Math.random() * W, Math.random() * Hh, Math.random()]);
      const draw = () => {
        const g = c.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, '#060a2a'); g.addColorStop(1, '#1a2a5a'); c.fillStyle = g; c.fillRect(0, 0, W, Hh);
        for (const [x, y, a] of bg) { c.fillStyle = `rgba(255,255,255,${0.15 + a * 0.4})`; c.fillRect(x, y, 1.4, 1.4); }
        c.strokeStyle = solved ? '#ffe680' : '#9ad8ff'; c.lineWidth = 2.4; c.shadowColor = c.strokeStyle; c.shadowBlur = 8;
        for (const k of lines) { const [a, b2] = k.split('-').map(Number); c.beginPath(); c.moveTo(...all[a]); c.lineTo(...all[b2]); c.stroke(); }
        c.shadowBlur = 0;
        all.forEach(([x, y], i) => { const big = i < pts.length; c.fillStyle = i === sel ? '#ffd84a' : '#ffffff'; c.shadowColor = '#bfe0ff'; c.shadowBlur = big ? 10 : 6; c.beginPath(); c.arc(x, y, big ? 4.2 : 3.4, 0, 7); c.fill(); });
        c.shadowBlur = 0; b.querySelector('#csN').textContent = `이은 선 ${lines.size} / ${cn.e.length}`;
      };
      cv.onpointerdown = e => {
        if (solved) return; const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * Hh / r.height;
        let hit = -1, bd = 18; all.forEach(([px, py], i) => { const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; hit = i; } });
        if (hit < 0) { sel = -1; return draw(); }
        if (sel < 0 || sel === hit) { sel = sel === hit ? -1 : hit; return draw(); }
        const k = [Math.min(sel, hit), Math.max(sel, hit)].join('-'); if (lines.has(k)) lines.delete(k); else lines.add(k); sel = -1; sfx('pop');
        if (lines.size === want.size && [...want].every(z => lines.has(z))) {
          solved = true; draw(); const st = S(); st.stars = st.stars || {}; const first = !st.stars[cn.name]; st.stars[cn.name] = true; const prize = first ? 60 : 20; earn(prize);
          for (const v of here()) if (has(v, 'SCHOLARLY') || has(v, 'DREAMY') || has(v, 'ROMANTIC')) { bond(v, 2, '별자리'); Sim.emote(v, '✨', 2); }
          setTimeout(() => modal('✨ 별자리 완성!', `<div class="row big">${cn.name}</div><div class="row">${first ? '📘 별자리 도감에 새로 등록! ' : ''}보상 <b>${prize}🪙</b> · 도감 ${Object.keys(st.stars).length}/${CONST.length}</div><div class="row"><button class="btn main" id="csN2">다음 별자리</button><button class="btn" id="csX">닫기</button></div>`, b2 => { b2.querySelector('#csN2').onclick = () => stars(idx + 1); b2.querySelector('#csX').onclick = () => UI().closeModal(); }), 700);
        }
        draw();
      };
      b.querySelector('#csC').onclick = () => { lines.clear(); sel = -1; draw(); };
      draw();
    });
  }
  // 유성우: 4일마다 밤 21~24시 (3D 하늘에 별똥별)
  const showerDay = () => day() % 4 === 0;
  const showerNow = () => showerDay() && hr() >= 21;
  let meteorRoot = null; const meteors = [];
  function ensureMeteors() {
    const sc = FM.W && FM.W.scene; if (!sc || meteorRoot) return; meteorRoot = new THREE.Group(); meteorRoot.name = 'meteors'; sc.add(meteorRoot);
    const tex = FM.PM.ctex('meteorTail', 16, 128, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.15, 'rgba(200,230,255,0.8)'); g.addColorStop(1, 'rgba(120,160,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
    const geoM = new THREE.PlaneGeometry(0.9, 26); geoM.translate(0, -13, 0);
    for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(geoM, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, side: THREE.DoubleSide, fog: false })); m.frustumCulled = false; meteorRoot.add(m); meteors.push({ m, t: Math.random() * 6, life: 0 }); }
    const tick = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial()); tick.frustumCulled = false; meteorRoot.add(tick);
    let last = performance.now();
    tick.onBeforeRender = (r, s, cam) => {
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now; const on = S() && S().player.loc === 'island' && showerNow();
      for (const o of meteors) {
        o.t -= dt; if (o.t <= 0 && on) { o.t = 1.2 + Math.random() * 3.5; o.life = 1.1; const a = Math.random() * PI2; o.p = new THREE.Vector3(cam.position.x + Math.cos(a) * 90, 120 + Math.random() * 40, cam.position.z + Math.sin(a) * 90 - 40); o.v = new THREE.Vector3(-30 - Math.random() * 30, -38, 20 + Math.random() * 20); }
        if (o.life > 0) { o.life -= dt; o.p.addScaledVector(o.v, dt); o.m.position.copy(o.p); o.m.lookAt(cam.position); const dir = o.v.clone().normalize(); o.m.up.copy(dir); o.m.lookAt(cam.position); o.m.material.opacity = clamp(o.life, 0, 1); } else o.m.material.opacity = 0;
      }
    };
  }
  const PI2 = Math.PI * 2;
  function wish() {
    const st = S(); if ((st.wishDay || 0) === day()) return UI().toast('오늘 밤 소원은 이미 빌었어요 🌠');
    modal('🌠 유성우에 소원 빌기', `<div class="row muted">별똥별이 떨어지는 동안 소원을 하나 골라요</div><div class="row" style="flex-direction:column;align-items:stretch"><button class="opt" data-w="love">💕 사랑이 이루어지게 해 주세요</button><button class="opt" data-w="money">💰 부자가 되게 해 주세요</button><button class="opt" data-w="health">💪 건강하게 해 주세요</button><button class="opt" data-w="friend">🤝 친구들이랑 오래오래 함께하게</button></div>`, b => {
      b.querySelectorAll('[data-w]').forEach(x => x.onclick = () => {
        st.wishDay = day(); const p = st.player; let msg = '';
        if (x.dataset.w === 'love') { const pt = Soc.partnerOf(P) || (friends()[0] || {}).id; if (pt) { Soc.addRomance && Soc.addRomance(pt, P, 6, 3, '유성우 소원'); msg = `💕 ${nameOf(pt)}와(과)의 마음이 한 뼘 가까워졌어요`; } else msg = '💕 언젠가 좋은 인연이 찾아올 거예요'; }
        if (x.dataset.w === 'money') { const n = 80 + Math.floor(Math.random() * 220); earn(n); msg = `💰 다음 날 주머니에서 ${n}🪙이 나왔어요!`; }
        if (x.dataset.w === 'health') { p.stamina = 100; msg = '💪 몸이 개운해졌어요 (스태미나 100)'; }
        if (x.dataset.w === 'friend') { const near = st.villagers.filter(v => usable(v) && v.loc === 'island' && Math.hypot(v.x - p.x, v.z - p.z) < 20); for (const v of near) bond(v, 3, '유성우'); msg = `🤝 근처 친구 ${near.length}명과 더 가까워졌어요`; }
        Sim.log('rel', `🌠 ${p.name}이(가) 유성우에 소원을 빌었어요`, [P], 1);
        modal('🌠 소원을 빌었어요', `<div class="row big">✨</div><div class="row">${msg}</div><div class="row"><button class="btn main" id="wX">확인</button></div>`, b2 => { b2.querySelector('#wX').onclick = () => UI().closeModal(); });
      });
    });
  }
  FM.bus.on('hour', h => { try {
    if (!showerDay()) return; ensureMeteors();
    if (h === 20) Sim.log('rel', '🌠 오늘 밤 21시부터 유성우가 쏟아져요! 언덕이나 바닷가에서 하늘을 올려다보세요', [], 2);
    if (h === 21) { const st = S(); for (const v of st.villagers) if (usable(v) && v.loc === 'island' && chance(0.6)) { Sim.emote(v, pick(['🌠', '✨', '😍', '🙏']), 4); const pt = Soc.partnerOf(v.id); if (pt && pt !== P) { const o = Sim.byId(pt); if (o && o.loc === 'island' && Math.hypot(o.x - v.x, o.z - v.z) < 12) Soc.addRomance && Soc.addRomance(v.id, pt, 3, 2, '유성우'); } } }
  } catch (e) { console.error('meteor', e); } });

  // =========================================================
  // ⛪ 웨딩 플래너
  // =========================================================
  const WED = {
    flower: ['💐 꽃', [['rose', '🌹 붉은 장미', 0], ['lily', '🤍 하얀 백합', 40], ['tulip', '🌷 파스텔 튤립', 30], ['sunflower', '🌻 해바라기', 30]]],
    dress: ['👗 드레스', [['classic', '👰 클래식 롱 드레스', 0], ['mermaid', '🧜 머메이드 드레스', 80], ['hanbok', '🎎 웨딩 한복', 60], ['mini', '💃 미니 드레스', 50]]],
    deco: ['🎀 장식', [['candle', '🕯️ 촛불 & 캔들', 0], ['garden', '🌿 가든 아치 & 꽃길', 60], ['balloon', '🎈 풍선 & 리본', 30], ['stars', '✨ 별빛 조명 & 커튼', 80]]],
    music: ['🎵 음악', [['organ', '🎹 파이프 오르간', 0], ['string', '🎻 현악 4중주', 70], ['band', '🎸 마을 밴드', 40], ['choir', '🎶 성가대 합창', 50]]],
    cake: ['🎂 케이크', [['three', '🎂 3단 생크림', 0], ['macaron', '🍬 마카롱 타워', 50], ['fruit', '🍓 과일 케이크', 30]]],
  };
  const TASTE = { ROMANTIC: ['rose', 'stars', 'string', 'mermaid'], ARTISTIC: ['sunflower', 'balloon', 'band', 'macaron'], SNOB: ['lily', 'string', 'mermaid', 'three'], ATHLETIC: ['sunflower', 'garden', 'band', 'fruit'], LAZY: ['tulip', 'candle', 'fruit', 'macaron'], INTROVERT: ['lily', 'candle', 'organ', 'classic'], EXTROVERT: ['balloon', 'band', 'mini', 'macaron'], CRANKY: ['rose', 'candle', 'band', 'mini'], ANXIOUS: ['tulip', 'candle', 'choir', 'classic'], SCHOLARLY: ['lily', 'organ', 'classic', 'three'] };
  function planner() {
    const st = S(); const ms = (st.marriages || []).filter(m => m.marriage_stage === 'WEDDING_PREP' || m.marriage_stage === 'ENGAGED');
    if (!ms.length) return modal('⛪ 웨딩 플래너', `<div class="row big">💒</div><div class="row">지금 예정된 결혼식이 없어요.</div><div class="row muted">누군가 약혼하면 여기서 꽃 · 드레스 · 장식 · 음악 · 케이크 · 하객을 함께 고를 수 있어요.${Soc.partnerOf(P) ? ' (연인에게 청혼해 보는 건 어때요? 💍)' : ''}</div>`, b => {});
    const m = ms.find(x => x.spouse_a_id === P || x.spouse_b_id === P) || ms[0];
    const A = m.spouse_a_id, B = m.spouse_b_id; const plan = m.plan = m.plan || { flower: m.flower || 'rose', dress: 'classic', deco: 'candle', music: 'organ', cake: 'three', guests: [] };
    const likes = new Set(); for (const id of [A, B]) { const v = Sim.byId(id); if (v && v.id !== P) for (const k of kv(v)) for (const t of TASTE[k] || []) likes.add(t); }
    const cost = () => Object.keys(WED).reduce((s, k) => s + (WED[k][1].find(o => o[0] === plan[k]) || [0, 0, 0])[2], 0) + plan.guests.length * 10;
    const fit = () => Object.keys(WED).filter(k => likes.has(plan[k])).length;
    const cands = st.villagers.filter(v => usable(v) && v.id !== A && v.id !== B).sort((a, b) => ((Soc.rel(b.id, A).friendship_point || 0) + (Soc.rel(b.id, B).friendship_point || 0)) - ((Soc.rel(a.id, A).friendship_point || 0) + (Soc.rel(a.id, B).friendship_point || 0))).slice(0, 14);
    modal(`⛪ 웨딩 플래너 — ${esc(nameOf(A))} ♥ ${esc(nameOf(B))} (${m.wedding_day}일차)`, `${Object.entries(WED).map(([k, [lab, opts]]) => `<div style="margin:6px 0"><b>${lab}</b><div class="row" style="justify-content:flex-start">${opts.map(([id, n, c]) => `<button class="opt ${plan[k] === id ? 'on' : ''}" data-k="${k}" data-v="${id}">${n}${c ? ` <span class="muted">+${c}</span>` : ''}${likes.has(id) ? ' 💗' : ''}</button>`).join('')}</div></div>`).join('')}
      <div style="margin:6px 0"><b>💌 특별 초대 하객 (앞줄 · 최대 6명, 1명당 10🪙)</b><div class="row" style="justify-content:flex-start" id="wdG"></div></div>
      <div class="row"><span class="pill">💗 취향 적중 <b id="wdF"></b>/5</span><span class="pill">💰 <b id="wdC"></b>🪙</span><button class="btn main" id="wdOk">이대로 확정!</button></div><div class="row muted">💗 = 신랑 · 신부 성격이 좋아하는 선택 · 적중할수록 결혼 만족도 ↑</div>`, b => {
      const paint = () => { b.querySelectorAll('[data-k]').forEach(x => x.classList.toggle('on', plan[x.dataset.k] === x.dataset.v)); b.querySelector('#wdF').textContent = fit(); b.querySelector('#wdC').textContent = cost();
        b.querySelector('#wdG').innerHTML = cands.map(v => `<button class="opt ${plan.guests.includes(v.id) ? 'on' : ''}" data-g="${v.id}">${face(v)} ${esc(v.name)}</button>`).join('');
        b.querySelectorAll('[data-g]').forEach(x => x.onclick = () => { const i = plan.guests.indexOf(x.dataset.g); if (i >= 0) plan.guests.splice(i, 1); else if (plan.guests.length < 6) plan.guests.push(x.dataset.g); paint(); }); };
      b.querySelectorAll('[data-k]').forEach(x => x.onclick = () => { plan[x.dataset.k] = x.dataset.v; paint(); });
      b.querySelector('#wdOk').onclick = () => {
        const c = cost(); if (plan.done) { if (!pay(Math.max(0, c - (plan.paid || 0)))) return; } else if (!pay(c)) return;
        plan.paid = c; plan.done = true; m.flower = plan.flower; const f = fit();
        m.marital_satisfaction = clamp((m.marital_satisfaction || 80) + f * 3, 0, 100);
        if (m.prep) m.prep.decorate = Math.max(m.prep.decorate || 0, 3);
        for (const id of [A, B]) { const v = Sim.byId(id); if (v && v.id !== P) { bond(v, 3 + f, '웨딩 플래너'); Sim.emote(v, '💒', 4); } }
        for (const id of plan.guests) { const v = Sim.byId(id); if (v) bond(v, 1, '청첩장'); }
        Sim.log('rel', `💒 ${nameOf(A)} ♥ ${nameOf(B)} 결혼식 플랜 확정: ${['flower', 'dress', 'deco', 'music', 'cake'].map(k => WED[k][1].find(o => o[0] === plan[k])[1]).join(' · ')}`, [A, B], 2);
        modal('💒 웨딩 플랜 확정!', `<div class="row big">${f >= 4 ? '😍 두 사람이 감동했어요!' : f >= 2 ? '😊 마음에 들어 해요' : '🙂 무난한 결혼식이 될 거예요'}</div><div class="row">결혼 만족도 → <b>${m.marital_satisfaction}</b> · 결혼식 꾸미기 완료 · 특별 하객 ${plan.guests.length}명</div><div class="row"><button class="btn main" id="wdX">확인</button></div>`, b2 => { b2.querySelector('#wdX').onclick = () => UI().closeModal(); });
      };
      paint();
    }, true);
  }
  // 결혼식: 특별 하객을 앞줄로 (하객 목록 앞쪽)
  if (Soc.wedding) { const ow = Soc.wedding; Soc.wedding = function (m) { try { const g = m && m.plan && m.plan.guests; if (g && g.length) { const st = S(); st.villagers.sort((a, b) => (g.includes(b.id) ? 1 : 0) - (g.includes(a.id) ? 1 : 0)); } } catch (e) { /* */ } return ow.apply(this, arguments); }; }

  // =========================================================
  // 🛍️ 패션쇼
  // =========================================================
  const TOPS = [['tee', '티셔츠'], ['hoodie', '후드'], ['sweater', '니트'], ['dress', '원피스'], ['vest', '조끼 정장'], ['aloha', '알로하'], ['apron', '앞치마']];
  const PATS = [['plain', '무지'], ['stripe', '줄무늬'], ['stripe2', '굵은 줄'], ['heart', '하트'], ['star', '별'], ['snow', '눈꽃']];
  const HATS = [['none', '없음'], ['straw', '밀짚모자'], ['flower', '꽃 장식'], ['crown', '왕관']];
  const BOTS = [['pants', '바지'], ['skirt', '치마'], ['shorts', '반바지']];
  const COLS = [0xff8fb1, 0xffd84a, 0x8fd3ff, 0xb69cff, 0x8ee07a, 0xff6f61, 0xffffff, 0x2f3b4e, 0xe8dcc8, 0x2b2b30];
  const hex = c => '#' + c.toString(16).padStart(6, '0');
  function withLook(v, look, fn) { const ol = v.look, oo = v.outfit; v.look = look; v.outfit = null; try { return fn(); } finally { v.look = ol; v.outfit = oo; } }
  function fashion() {
    const models = (here().length ? here() : []).concat(friends()).filter((v, i, a) => a.indexOf(v) === i).slice(0, 8);
    let mv = models[0]; if (!mv) return UI().toast('모델이 되어 줄 주민이 없어요');
    let look = Object.assign({}, FM.Chars ? FM.Chars.outfitLook(mv) : mv.look);
    const optRow = (k, list) => list.map(([id, n]) => `<button class="opt" data-f="${k}" data-v="${id}">${n}</button>`).join('');
    modal('🛍️ 패션쇼 — 주민 코디해 주기', `<div style="display:flex;gap:12px;flex-wrap:wrap"><div style="flex:1 1 260px"><img id="fsP" style="width:100%;border-radius:10px;background:#eee;aspect-ratio:4/3"><div class="row" id="fsM"></div></div>
      <div style="flex:1 1 260px"><b>상의</b><div class="row" style="justify-content:flex-start">${optRow('top', TOPS)}</div><b>무늬</b><div class="row" style="justify-content:flex-start">${optRow('pattern', PATS)}</div>
      <b>색</b><div class="row" style="justify-content:flex-start">${COLS.map(c => `<button class="opt" data-c="${c}" style="background:${hex(c)};width:28px;height:24px;padding:0"></button>`).join('')}</div><b>포인트 색</b><div class="row" style="justify-content:flex-start">${COLS.map(c => `<button class="opt" data-c2="${c}" style="background:${hex(c)};width:28px;height:24px;padding:0"></button>`).join('')}</div>
      <b>하의</b><div class="row" style="justify-content:flex-start">${optRow('bottom', BOTS)}</div><b>모자</b><div class="row" style="justify-content:flex-start">${optRow('hat', HATS)}</div>
      <div class="row"><button class="btn main" id="fsGo">✨ 런웨이 쇼 시작!</button></div></div></div>`, b => {
      const prev = b.querySelector('#fsP'); let tm = 0;
      const refresh = () => { clearTimeout(tm); tm = setTimeout(() => { try { prev.src = withLook(mv, look, () => FM.Photo.preview([{ id: mv.id, expr: 'happy', pose: 'pose' }], 'studio')); } catch (e) { console.error('fashion preview', e); } }, 60); b.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('on', look[x.dataset.f] === x.dataset.v)); };
      const paintM = () => { b.querySelector('#fsM').innerHTML = models.map(v => `<button class="opt ${v === mv ? 'on' : ''}" data-m="${v.id}">${face(v)} ${esc(v.name)}</button>`).join(''); b.querySelectorAll('[data-m]').forEach(x => x.onclick = () => { mv = Sim.byId(x.dataset.m); look = Object.assign({}, FM.Chars ? FM.Chars.outfitLook(mv) : mv.look); paintM(); refresh(); }); };
      b.querySelectorAll('[data-f]').forEach(x => x.onclick = () => { look[x.dataset.f] = x.dataset.v; if (x.dataset.f === 'hat') look.hatColor = look.hatColor || 0xffffff; refresh(); });
      b.querySelectorAll('[data-c]').forEach(x => x.onclick = () => { look.shirt = +x.dataset.c; refresh(); });
      b.querySelectorAll('[data-c2]').forEach(x => x.onclick = () => { look.shirt2 = +x.dataset.c2; look.pants = +x.dataset.c2; look.hatColor = +x.dataset.c2; refresh(); });
      b.querySelector('#fsGo').onclick = () => {
        const img = prev.src; const judges = friends().filter(v => v !== mv).sort(() => Math.random() - 0.5).slice(0, 3);
        const lum = c => ((c >> 16) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11) / 255;
        const contrast = Math.abs(lum(look.shirt || 0xffffff) - lum(look.shirt2 || 0xffffff));
        const base = 5 + (contrast > 0.25 && contrast < 0.7 ? 2 : 0) + (look.pattern !== 'plain' ? 1 : 0) + (look.hat !== 'none' ? 1 : 0);
        const sc = judges.map(j => clamp(Math.round(base + (has(j, 'FASHION') ? 1 : 0) + (has(j, 'CRANKY') ? -1 : 0) + (Math.random() * 3 - 1)), 3, 10));
        const tot = sc.reduce((a, c) => a + c, 0), prize = tot * 8; earn(prize); bond(mv, 2 + Math.round(tot / 8), '패션쇼'); Sim.emote(mv, tot >= 24 ? '😍' : '😊', 4);
        Sim.log('rel', `🛍️ 쇼핑몰 패션쇼: ${S().player.name}이(가) 코디한 ${mv.name}이(가) 런웨이에서 ${tot}점!`, [P, mv.id], 1);
        modal('✨ 런웨이 심사 결과', `<div class="row"><img src="${img}" style="width:240px;border-radius:10px;transform:rotate(-1deg);box-shadow:0 6px 16px rgba(0,0,0,.2)"></div><div class="row">${judges.map((j, i) => `<span class="pill">${face(j)} ${esc(j.name)} <b>${sc[i]}</b></span>`).join('')}</div><div class="row big">합계 ${tot} / 30 ${tot >= 26 ? '👑 베스트 드레서!' : tot >= 20 ? '🌟 멋져요!' : ''}</div><div class="row">상금 <b>${prize}🪙</b> · ${esc(mv.name)}의 호감 ↑</div><div class="row"><button class="btn" id="fsGift">🎁 이 옷 선물하기 (120🪙)</button><button class="btn main" id="fsX">확인</button></div>`, b2 => {
          b2.querySelector('#fsGift').onclick = () => { if (!pay(120)) return; mv.look = Object.assign({}, mv.look, { top: look.top, pattern: look.pattern, shirt: look.shirt, shirt2: look.shirt2, bottom: look.bottom, pants: look.pants, hat: look.hat, hatColor: look.hatColor }); FM.bus.emit('outfit', mv); bond(mv, 5, '옷 선물'); Sim.emote(mv, '💕', 4); UI().toast(`🎁 ${mv.name}이(가) 새 옷을 입었어요!`); UI().closeModal(); };
          b2.querySelector('#fsX').onclick = () => UI().closeModal();
        });
      };
      paintM(); refresh();
    }, true);
  }

  // =========================================================
  // 🎷 노래방 배틀 (4줄 리듬게임)
  // =========================================================
  const SONGS = [['🌸 봄날의 고백', 104], ['🔥 불타는 금요일', 132], ['🌊 파도 위의 세레나데', 92], ['⭐ 별빛 댄스', 120]];
  function karaoke() {
    const opps = here().concat(friends().slice(0, 6)).filter((v, i, a) => a.indexOf(v) === i).slice(0, 6);
    modal('🎤 노래방 배틀 — 상대와 노래 고르기', `<b>상대</b><div class="row" style="justify-content:flex-start">${opps.map(v => `<button class="opt" data-o="${v.id}">${face(v)} ${esc(v.name)}</button>`).join('')}</div><b>노래</b><div class="row" style="flex-direction:column;align-items:stretch">${SONGS.map((s, i) => `<button class="opt" data-s="${i}">${s[0]} <span class="muted">BPM ${s[1]}</span></button>`).join('')}</div>`, b => {
      let opp = opps[0];
      b.querySelectorAll('[data-o]').forEach(x => { x.classList.toggle('on', x.dataset.o === (opp && opp.id)); x.onclick = () => { opp = Sim.byId(x.dataset.o); b.querySelectorAll('[data-o]').forEach(y => y.classList.toggle('on', y === x)); }; });
      b.querySelectorAll('[data-s]').forEach(x => x.onclick = () => rhythm(opp, SONGS[+x.dataset.s]));
    });
  }
  function rhythm(opp, song) {
    const W = 320, Hh = 420, LANES = 4, KEYS = ['d', 'f', 'j', 'k'], dur = 24, beat = 60 / song[1], speed = 300, hitY = Hh - 60;
    const notes = []; for (let t = 1.5; t < dur; t += beat * (Math.random() < 0.3 ? 0.5 : 1)) notes.push({ t, l: (Math.random() * LANES) | 0, hit: false, miss: false });
    modal(`🎤 ${song[0]} — vs ${esc(opp ? opp.name : '???')}`, `<div class="row"><span class="pill">🎯 <b id="rkS">0</b></span><span class="pill">콤보 <b id="rkC">0</b></span><span class="pill" id="rkJ">Ready</span></div><canvas id="rk" width="${W}" height="${Hh}"></canvas><div class="row muted">D · F · J · K 키 또는 줄을 터치 · 선에 닿을 때!</div>`, b => {
      const cv = b.querySelector('#rk'), c = cv.getContext('2d'); const t0 = performance.now() + 1000; let t = -1, score = 0, combo = 0, maxc = 0, judge = '', jt = 0, flash = [0, 0, 0, 0];
      const hitLane = l => { flash[l] = 0.15; let best = null, bd = 0.2; for (const n of notes) if (!n.hit && !n.miss && n.l === l && Math.abs(n.t - t) < bd) { bd = Math.abs(n.t - t); best = n; } if (best) { best.hit = true; combo++; maxc = Math.max(maxc, combo); const p = bd < 0.07; score += (p ? 100 : 60) + combo * 2; judge = p ? 'PERFECT ✨' : 'GOOD'; } else { combo = 0; judge = 'MISS'; } jt = 0.5; };
      const kd = e => { const l = KEYS.indexOf(e.key.toLowerCase()); if (l >= 0) hitLane(l); };
      window.addEventListener('keydown', kd);
      cv.onpointerdown = e => { const r = cv.getBoundingClientRect(); hitLane(clamp(Math.floor((e.clientX - r.left) / r.width * LANES), 0, 3)); };
      const LC = ['#ff6ab8', '#4ae0ff', '#ffe04a', '#7aff6a'];
      loop(cv, dt => {
        t = (performance.now() - t0) / 1000; jt -= dt; for (let i = 0; i < 4; i++) flash[i] = Math.max(0, flash[i] - dt);
        for (const n of notes) if (!n.hit && !n.miss && t - n.t > 0.2) { n.miss = true; combo = 0; }
        c.fillStyle = '#140a28'; c.fillRect(0, 0, W, Hh);
        for (let l = 0; l < LANES; l++) { c.fillStyle = flash[l] > 0 ? 'rgba(255,255,255,0.18)' : (l % 2 ? '#1c1236' : '#20143e'); c.fillRect(l * W / LANES, 0, W / LANES, Hh); }
        c.fillStyle = '#ffffff'; c.fillRect(0, hitY - 2, W, 4);
        for (const n of notes) { if (n.hit) continue; const y = hitY - (n.t - t) * speed; if (y < -20 || y > Hh + 20) continue; c.fillStyle = n.miss ? '#555' : LC[n.l]; c.beginPath(); c.roundRect ? c.roundRect(n.l * W / LANES + 8, y - 9, W / LANES - 16, 18, 8) : c.rect(n.l * W / LANES + 8, y - 9, W / LANES - 16, 18); c.fill(); }
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.font = '16px sans-serif'; c.textAlign = 'center'; KEYS.forEach((k, l) => c.fillText(k.toUpperCase(), (l + 0.5) * W / LANES, Hh - 24));
        b.querySelector('#rkS').textContent = score; b.querySelector('#rkC').textContent = combo; b.querySelector('#rkJ').textContent = jt > 0 ? judge : '♪';
        if (t > dur + 1) {
          window.removeEventListener('keydown', kd);
          const max = notes.length * 130, skill = 0.45 + (has(opp, 'ARTISTIC') ? 0.15 : 0) + (has(opp, 'PASSIONATE') ? 0.1 : 0) + (has(opp, 'MUSIC') ? 0.15 : 0) + (has(opp, 'SHY') ? -0.1 : 0);
          const os = Math.round(max * clamp(skill + (Math.random() * 0.2 - 0.1), 0.25, 0.95)); const win = score >= os;
          if (opp) { bond(opp, win ? 2 : 3, '노래방 배틀'); Sim.emote(opp, win ? '😲' : '😎', 4); }
          const prize = win ? 120 : 30; earn(prize);
          Sim.log('rel', `🎤 클럽 노래방 배틀 「${song[0]}」: ${S().player.name} ${score} vs ${opp ? opp.name : '?'} ${os} → ${win ? S().player.name : opp.name} 승!`, [P].concat(opp ? [opp.id] : []), 1);
          modal(win ? '🏆 노래방 배틀 승리!' : '🎤 아깝게 졌어요!', `<div class="row big">${score} : ${os}</div><div class="row">최대 콤보 ${maxc} · ${win ? `${esc(opp.name)}: "와... 너 가수 해도 되겠다!"` : `${esc(opp.name)}: "후훗, 다음에 또 덤벼!"`}</div><div class="row">보상 <b>${prize}🪙</b> · 호감 ↑</div><div class="row"><button class="btn main" id="rkA">한 곡 더</button><button class="btn" id="rkX">닫기</button></div>`, b2 => { b2.querySelector('#rkA').onclick = karaoke; b2.querySelector('#rkX').onclick = () => UI().closeModal(); });
          return false;
        }
      });
    });
  }

  // =========================================================
  // 🏥 정기 검진 & 간호 미니게임
  // =========================================================
  function checkup() {
    const st = S(), p = st.player; if ((st.checkupDay || 0) === day()) return UI().toast('오늘은 이미 검진을 받았어요');
    if (!pay(50)) return;
    const dirs = ['⬆️', '➡️', '⬇️', '⬅️'], rot = [270, 0, 90, 180]; let r = 0, ok = 0; const sizes = [64, 48, 36, 26, 18, 13];
    const eye = () => {
      if (r >= sizes.length) return result();
      const k = (Math.random() * 4) | 0;
      modal(`🏥 정기 검진 — 시력 검사 ${r + 1}/${sizes.length}`, `<div class="row muted">C 모양의 뚫린 쪽을 골라요</div><div class="row" style="height:120px"><div style="font:700 ${sizes[r]}px sans-serif;transform:rotate(${rot[k]}deg)">C</div></div><div class="row">${dirs.map((d, i) => `<button class="opt" data-d="${i}" style="font-size:22px">${d}</button>`).join('')}</div>`, b => {
        b.querySelectorAll('[data-d]').forEach(x => x.onclick = () => { if (+x.dataset.d === k) ok++; r++; eye(); });
      });
    };
    const result = () => {
      st.checkupDay = day(); p.stamina = 100;
      const vis = (0.3 + ok * 0.25).toFixed(1), bp = 108 + ((Math.random() * 18) | 0), hgt = Math.round(150 + ((p.look && p.look.height) || 1) * 20 + Math.random() * 6);
      const notes = ['규칙적인 생활 습관 훌륭해요!', '물을 조금 더 자주 마셔요 💧', '스트레칭을 꾸준히 해 보세요 🧘', '잠을 1시간만 더 자 봐요 😴'];
      Sim.log('rel', `🏥 ${p.name}이(가) 메디컬 센터에서 정기 검진을 받았어요`, [P], 1);
      modal('📋 검진 결과지', `<table><tr><td>키</td><td><b>${hgt} cm</b></td></tr><tr><td>시력</td><td><b>${vis} / ${vis}</b> ${ok >= 5 ? '👀 매의 눈!' : ''}</td></tr><tr><td>혈압</td><td><b>${bp} / ${bp - 40}</b> 정상</td></tr><tr><td>스태미나</td><td><b>100</b> (수액 서비스 💉)</td></tr><tr><td>의사 소견</td><td>${pick(notes)}</td></tr></table><div class="row"><button class="btn main" id="ckX">확인</button></div>`, b => { b.querySelector('#ckX').onclick = () => UI().closeModal(); });
    };
    eye();
  }
  const SYM = [['🤒', '열이 나요', 'fever', '💊 해열제'], ['😷', '기침이 멈추질 않아요', 'cough', '🍯 기침 시럽'], ['🩹', '넘어져서 무릎이 까졌어요', 'cut', '🩹 반창고 & 소독'], ['🤢', '배가 아파요', 'stomach', '🍵 소화제'], ['😵‍💫', '어지러워요', 'dizzy', '🧃 수액 & 휴식'], ['🤧', '콧물이 줄줄', 'cold', '🧣 감기약 & 담요']];
  function nurse() {
    const st = S(); const real = st.villagers.filter(v => v.status && v.status.hospital);
    const pts = real.concat(friends().slice(0, 8).sort(() => Math.random() - 0.5)).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);
    let i = 0, ok = 0, t0 = performance.now();
    const next = () => {
      if (i >= pts.length) { const sec = (performance.now() - t0) / 1000, bonus = sec < 25 ? 40 : 0, prize = ok * 30 + bonus; earn(prize);
        for (const v of real) { if (v.status.hospitalUntil) v.status.hospitalUntil -= 120; if (v.status.hospitalDays) v.status.hospitalDays = Math.max(0, v.status.hospitalDays - 1); }
        Sim.log('rel', `🩺 ${S().player.name}이(가) 메디컬 센터에서 간호 봉사를 했어요 (${ok}/${pts.length})`, [P].concat(pts.map(v => v.id)), 1);
        return modal('🩺 간호 봉사 끝!', `<div class="row big">${ok} / ${pts.length} 환자 완치!</div><div class="row">${bonus ? '⚡ 빠른 처치 보너스! ' : ''}봉사 수당 <b>${prize}🪙</b>${real.length ? ` · 입원 중인 ${real.map(v => esc(v.name)).join(', ')}의 회복이 빨라졌어요` : ''}</div><div class="row"><button class="btn main" id="nsX">확인</button></div>`, b => { b.querySelector('#nsX').onclick = () => UI().closeModal(); }); }
      const v = pts[i], s = pick(SYM), opts = SYM.slice().sort(() => Math.random() - 0.5).slice(0, 4); if (!opts.includes(s)) opts[(Math.random() * 4) | 0] = s;
      modal(`🩺 간호 미니게임 — 환자 ${i + 1}/${pts.length}`, `<div class="row">${face(v, 44)} <span class="big">${s[0]}</span></div><div class="row">${esc(v.name)}: "${s[1]}..."</div><div class="row" style="flex-direction:column;align-items:stretch">${opts.map(o => `<button class="opt" data-m="${o[2]}">${o[3]}</button>`).join('')}</div>`, b => {
        b.querySelectorAll('[data-m]').forEach(x => x.onclick = () => { const right = x.dataset.m === s[2]; if (right) { ok++; bond(v, 3, '간호'); Sim.emote(v, '🥰', 3); UI().toast(`${v.name}: "덕분에 한결 나아졌어!"`); } else { Sim.emote(v, '😖', 2); UI().toast(`${v.name}: "으으... 이게 아닌 것 같아"`); } i++; next(); });
      });
    };
    next();
  }

  // =========================================================
  // 🔨 공방 — 재료 조합 가구 만들기
  // =========================================================
  const MATS = { wood: ['🪵 나무', 12], stone: ['🪨 돌', 10], cloth: ['🧵 천', 15], metal: ['🔩 철', 18], glass: ['🔮 유리', 20], flower: ['🌼 꽃', 8] };
  const RECIPES = [
    ['k_green_chair', '초록 원목 의자', { wood: 3 }], ['k_leaf_table', '잎사귀 사이드 테이블', { wood: 2, flower: 1 }], ['k_cube_shelf', '원목 큐브 선반', { wood: 4, flower: 1 }],
    ['k_tea_table', '티포트 원형 테이블', { wood: 3, glass: 1 }], ['k_rug_gingham', '깅엄 체크 러그', { cloth: 3 }], ['k_fringe_lamp', '프릴 핑크 플로어 램프', { cloth: 2, metal: 1, glass: 1 }],
    ['k_wood_clock', '원목 벽시계', { wood: 2, metal: 1 }], ['k_plant_trio', '작은 화분 삼총사', { stone: 2, flower: 2 }], ['k_heart_chair', '하트 등받이 의자', { wood: 2, cloth: 2 }],
    ['k_arc_lamp', '아크 플로어 램프', { metal: 3, glass: 1 }], ['k_rose_table', '장미 꽃병 사이드 테이블', { wood: 2, glass: 1, flower: 2 }], ['k_tire_stack', '타이어 스툴', { stone: 1, metal: 2 }],
  ].filter(r => FM.FURN && FM.FURN[r[0]]);
  const mats = () => { const p = S().player; p.mats = p.mats || { wood: 2, stone: 1, cloth: 1, metal: 0, glass: 0, flower: 1 }; return p.mats; };
  function placeHome(type) {
    Sim.ensurePlayerRoom && Sim.ensurePlayerRoom(); const st = S(), room = st.rooms.home_p_in, F = FM.FURN[type]; if (!room || !F) return false;
    const sz = Sim.interiorSize ? Sim.interiorSize('home_p_in') : { w: 8, d: 6 }, hx = sz.w / 2, hz = sz.d / 2;
    const rectOf = (Fd, x, z, r) => { const q = Math.abs(Math.round(r / 90)) % 2 === 1; const fw = (q ? Fd.d : Fd.w) / 2, fd = (q ? Fd.w : Fd.d) / 2; return [x - fw, z - fd, x + fw, z + fd]; };
    const hit = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
    const used = room.furn.filter(q => FM.FURN[q.type] && !!FM.FURN[q.type].wall === !!F.wall && !FM.FURN[q.type].flat && !FM.FURN[q.type].ceiling).map(q => rectOf(FM.FURN[q.type], q.x, q.z, q.rot || 0));
    const door = [-1.2, hz - 1.4, 1.2, hz];
    const cands = [];
    if (F.wall) { for (let x = -hx + 0.8; x <= hx - 0.8; x += 0.4) cands.push([x, -hz + 0.06, 0]); }
    else { for (let z = -hz + F.d / 2 + 0.1; z <= hz - F.d / 2 - 0.1; z += 0.4) for (let x = -hx + F.w / 2 + 0.1; x <= hx - F.w / 2 - 0.1; x += 0.4) cands.push([x, z, 0]); }
    for (const [x, z, r] of cands) { const R = rectOf(F, x, z, r); if (!F.wall && hit(R, door)) continue; if (F.flat ? false : used.some(u => hit(R, u))) continue; room.furn.push({ type, x: +x.toFixed(2), z: +z.toFixed(2), rot: r, crafted: true }); if (FM.G && FM.G.interior && FM.G.interior.iid === 'home_p_in' && FM.G.rebuildInterior) FM.G.rebuildInterior(); return true; }
    return false;
  }
  function workshop() {
    const m = mats();
    modal('🔨 공방 — 재료 조합 가구 만들기', `<div class="row" id="wsM"></div><div class="row muted">재료를 사서 레시피대로 조합 → 망치질 타이밍 게임 → 완성된 가구는 우리 집에 자동 배치!</div>
      <table id="wsR"></table>`, b => {
      const paint = () => {
        b.querySelector('#wsM').innerHTML = Object.entries(MATS).map(([k, [n, c]]) => `<span class="pill">${n} <b>${m[k] || 0}</b> <button class="btn small" data-buy="${k}">+1 (${c}🪙)</button></span>`).join('');
        b.querySelector('#wsR').innerHTML = RECIPES.map(([id, n, req], i) => { const can = Object.entries(req).every(([k, q]) => (m[k] || 0) >= q); return `<tr><td>${esc(n)}</td><td class="muted">${Object.entries(req).map(([k, q]) => MATS[k][0].split(' ')[0] + '×' + q).join(' ')}</td><td><button class="btn small ${can ? 'main' : ''}" data-r="${i}" ${can ? '' : 'disabled'}>만들기</button></td></tr>`; }).join('');
        b.querySelectorAll('[data-buy]').forEach(x => x.onclick = () => { const k = x.dataset.buy; if (!pay(MATS[k][1])) return; m[k] = (m[k] || 0) + 1; paint(); });
        b.querySelectorAll('[data-r]').forEach(x => x.onclick = () => hammer(RECIPES[+x.dataset.r]));
      };
      paint();
    });
  }
  function hammer(rec) {
    const [id, name, req] = rec, m = mats(); const W = 340, Hh = 90;
    modal(`🔨 ${name} 만들기 — 망치질!`, `<div class="row muted">움직이는 막대가 초록 칸에 왔을 때 [쾅!] (3번)</div><canvas id="hm" width="${W}" height="${Hh}"></canvas><div class="row"><button class="btn main" id="hmB" style="font-size:18px">🔨 쾅!</button></div><div class="row" id="hmR"></div>`, b => {
      const cv = b.querySelector('#hm'), c = cv.getContext('2d'); let x = 0, v = 1, n = 0, good = 0, zone = 120 + Math.random() * 120; const res = [];
      const kd = e => { if (e.code === 'Space') { e.preventDefault(); strike(); } }; window.addEventListener('keydown', kd);
      const strike = () => { if (n >= 3) return; const d = Math.abs(x * W - zone); const q = d < 14 ? 2 : d < 34 ? 1 : 0; good += q; res.push(['💥 완벽', '👍 좋아', '😵 빗나감'][2 - q]); n++; sfx('pop'); zone = 60 + Math.random() * (W - 120); b.querySelector('#hmR').textContent = res.join(' · ');
        if (n >= 3) { window.removeEventListener('keydown', kd); for (const [k, q] of Object.entries(req)) m[k] -= q; const stars = good >= 5 ? 3 : good >= 3 ? 2 : 1; const ok = placeHome(id);
          S().stats = S().stats || {}; S().stats.crafted = (S().stats.crafted || 0) + 1;
          setTimeout(() => modal('🔨 완성!', `<div class="row big">${name}</div><div class="row">품질 ${'⭐'.repeat(stars)}${stars === 3 ? ' · 장인의 솜씨!' : ''}</div><div class="row">${ok ? '🏠 우리 집에 놓아 두었어요! (꾸미기에서 옮길 수 있어요)' : '🏠 집에 빈자리가 없어서 공방 창고에 보관했어요'}</div><div class="row"><button class="btn main" id="hmA">더 만들기</button><button class="btn" id="hmX">닫기</button></div>`, b2 => { b2.querySelector('#hmA').onclick = workshop; b2.querySelector('#hmX').onclick = () => UI().closeModal(); }), 500);
          if (stars === 3) earn(30);
        } };
      b.querySelector('#hmB').onclick = strike;
      loop(cv, dt => { if (n >= 3) return false; x += v * dt * (0.9 + n * 0.35); if (x > 1) { x = 1; v = -1; } if (x < 0) { x = 0; v = 1; }
        c.fillStyle = '#f4e8d8'; c.fillRect(0, 0, W, Hh); c.fillStyle = '#c8e8a0'; c.fillRect(zone - 34, 20, 68, 50); c.fillStyle = '#6ac83a'; c.fillRect(zone - 14, 20, 28, 50); c.fillStyle = '#5a3a2a'; c.fillRect(x * W - 3, 10, 6, 70); });
    });
  }

  // =========================================================
  // 🛁 온천 탁구 & 유카타
  // =========================================================
  function pingpong() {
    const opp = here()[0] || friends()[0]; const W = 300, Hh = 420;
    modal(`🏓 온천 탁구 — vs ${esc(opp ? opp.name : '주민')}`, `<div class="row"><span class="pill">나 <b id="ppA">0</b></span><span class="pill">${esc(opp ? opp.name : '상대')} <b id="ppB">0</b></span><span class="pill muted">5점 먼저!</span></div><canvas id="pp" width="${W}" height="${Hh}"></canvas><div class="row muted">마우스/손가락 또는 ← → 로 아래 라켓을 움직여요</div>`, b => {
      const cv = b.querySelector('#pp'), c = cv.getContext('2d'); let px = W / 2, ox = W / 2, sa = 0, sb = 0, over = false; const keys = {};
      const lvl = 0.55 + (has(opp, 'ATHLETIC') ? 0.25 : 0) + (has(opp, 'LAZY') ? -0.15 : 0);
      let ball = null; const serve = dir => { ball = { x: W / 2, y: Hh / 2, vx: (Math.random() - 0.5) * 160, vy: 200 * dir }; };
      serve(1);
      const kd = e => { keys[e.key] = true; }, ku = e => { keys[e.key] = false; }; window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
      cv.onpointermove = e => { const r = cv.getBoundingClientRect(); px = clamp((e.clientX - r.left) * W / r.width, 30, W - 30); };
      loop(cv, dt => {
        if (over) return false;
        if (keys.ArrowLeft) px -= 320 * dt; if (keys.ArrowRight) px += 320 * dt; px = clamp(px, 30, W - 30);
        ox += clamp(ball.x - ox, -230 * lvl * dt, 230 * lvl * dt); ox = clamp(ox, 30, W - 30);
        ball.x += ball.vx * dt; ball.y += ball.vy * dt; if (ball.x < 8 || ball.x > W - 8) ball.vx *= -1;
        if (ball.vy > 0 && ball.y > Hh - 36 && ball.y < Hh - 20 && Math.abs(ball.x - px) < 36) { ball.vy = -Math.abs(ball.vy) * 1.06; ball.vx += (ball.x - px) * 5; sfx('pop'); }
        if (ball.vy < 0 && ball.y < 36 && ball.y > 20 && Math.abs(ball.x - ox) < 36) { ball.vy = Math.abs(ball.vy) * 1.04; ball.vx += (ball.x - ox) * 4 + (Math.random() - 0.5) * 80; sfx('pop'); }
        if (ball.y > Hh + 10) { sb++; serve(-1); } if (ball.y < -10) { sa++; serve(1); }
        c.fillStyle = '#2e7a5a'; c.fillRect(0, 0, W, Hh); c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.strokeRect(6, 6, W - 12, Hh - 12); c.beginPath(); c.moveTo(W / 2, 6); c.lineTo(W / 2, Hh - 6); c.stroke(); c.fillStyle = '#e8e0d0'; c.fillRect(0, Hh / 2 - 3, W, 6);
        c.fillStyle = '#d83a3a'; c.fillRect(px - 32, Hh - 32, 64, 10); c.fillStyle = '#2a4ad8'; c.fillRect(ox - 32, 22, 64, 10);
        c.fillStyle = '#fff8e8'; c.beginPath(); c.arc(ball.x, ball.y, 7, 0, 7); c.fill();
        b.querySelector('#ppA').textContent = sa; b.querySelector('#ppB').textContent = sb;
        if (sa >= 5 || sb >= 5) { over = true; window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); const win = sa > sb; earn(win ? 60 : 15); if (opp) { bond(opp, 3, '온천 탁구'); Sim.emote(opp, win ? '😆' : '😎', 3); } S().player.stamina = clamp(S().player.stamina - 5, 0, 100);
          setTimeout(() => modal(win ? '🏓 승리!' : '🏓 패배...', `<div class="row big">${sa} : ${sb}</div><div class="row">${win ? '온천 탁구 챔피언! 보상 60🪙' : '그래도 땀 흘리고 나니 개운해요 (15🪙)'} · 이제 시원한 커피 우유 한 잔? 🥛</div><div class="row"><button class="btn main" id="ppA2">한 판 더</button><button class="btn" id="ppX">닫기</button></div>`, b2 => { b2.querySelector('#ppA2').onclick = pingpong; b2.querySelector('#ppX').onclick = () => UI().closeModal(); }), 300); return false; }
      });
    });
  }
  const YUKATA = [[0x2f4b8e, 0xffffff, '🌊 남색 물결'], [0xff8fb1, 0xffffff, '🌸 분홍 벚꽃'], [0xffffff, 0x2f4b8e, '🎐 하얀 바람'], [0x8a3ab8, 0xffd84a, '🍇 보랏빛 등']];
  function yukata() {
    const p = S().player;
    if (p.yukata) { p.look = p.yukata.prev; delete p.yukata; FM.bus.emit('outfit', p); return UI().toast('👕 원래 옷으로 갈아입었어요'); }
    modal('👘 유카타 갈아입기', `<div class="row" style="flex-direction:column;align-items:stretch">${YUKATA.map((y, i) => `<button class="opt" data-y="${i}"><span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:${hex(y[0])};border:2px solid ${hex(y[1])};vertical-align:middle"></span> ${y[2]}</button>`).join('')}</div><div class="row muted">온천을 나가도 다시 갈아입을 때까지 유카타 차림이에요</div>`, b => {
      b.querySelectorAll('[data-y]').forEach(x => x.onclick = () => { const y = YUKATA[+x.dataset.y]; p.yukata = { prev: p.look }; p.look = Object.assign({}, p.look, { top: 'dress', shirt: y[0], shirt2: y[1], pattern: 'snow', bottom: 'none', acc: 'bowtie', accColor: y[1] === 0xffffff ? 0xd83a3a : y[1], hat: 'none' }); FM.bus.emit('outfit', p); UI().closeModal(); UI().toast(`👘 ${y[2]} 유카타로 갈아입었어요!`); for (const v of here()) if (chance(0.5)) { Sim.emote(v, '😍', 2); bond(v, 1, '유카타'); } });
    });
  }

  // =========================================================
  // 플레이어 선택지
  // =========================================================
  FM.Mini = { latte, quiz, bookClub, starCatch, board, stars, wish, planner, fashion, karaoke, checkup, nurse, workshop, pingpong, yukata };
  if (FM.Play && FM.Play.options) {
    const oOpt = FM.Play.options;
    FM.Play.options = function (add) {
      const r = oOpt.apply(this, arguments);
      try {
        const p = S().player, L = p.loc;
        const nf = re => FM.G.nearFurn && FM.G.nearFurn(re);   // 관련 가구 가까이에서만
        if (L === 'cafe_in' && nf(/pastry_counter|buffet/)) add(1.6, '☕ 라테아트 (손님 주문 그리기)', () => latte());
        if (L === 'library_in') { if (nf(/circ_desk/)) add(1.6, '📚 도서관 퀴즈 (5문제)', quiz); if (isClubTime() && nf(/round_table_book|bistro_table|book_table_low/)) add(1.4, '📖 일요일 독서 모임 참여', bookClub); }
        if (L === 'arcade_in') { if (nf(/retro_cab/)) add(1.5, '🕹️ 별똥별 캐처 — 주간 대회 도전 (10🪙)', () => { if (pay(10)) starCatch(); }); if (nf(/prize_counter/)) add(1.7, '🏆 주간 랭킹판 보기', board); }
        if (L === 'obs_in' && nf(/telescope|scope|armillary/)) add(1.6, '🔭 별자리 잇기', () => stars((Object.keys(S().stars || {}).length) % CONST.length));
        if (L === 'cathedral_in' && nf(/lectern|podium|altar/)) add(1.6, '⛪ 웨딩 플래너', planner);
        if (L === 'mall_in' && nf(/dress_form|k15_rack|fitting|gold_mirror/)) add(1.6, '🛍️ 패션쇼 (주민 코디해 주기)', fashion);
        if (L === 'club_in' && nf(/k14_mic|k14_stage/)) add(1.6, '🎤 노래방 배틀', karaoke);
        if (L === 'med_in') { if (nf(/reception|doctor_desk/)) add(1.6, '🏥 정기 검진 받기 (50🪙)', checkup); if (nf(/nurse_station|treatment_cart/)) add(1.7, '🩺 간호 봉사 미니게임', nurse); }
        if (L === 'workshop_in' && nf(/workbench/)) add(1.6, '🔨 재료 조합 가구 만들기', workshop);
        if (L === 'onsen_in') { if (nf(/low_table|stage/)) add(1.6, '🏓 온천 탁구', pingpong); if (nf(/lockers/)) add(1.8, p.yukata ? '👕 원래 옷으로 갈아입기' : '👘 유카타 갈아입기', yukata); }
        if (L === 'island' && showerNow()) add(1.2, '🌠 유성우에 소원 빌기', wish);
        if (L === 'island' && Math.hypot(p.x - 102, p.z - 24) < 5) add(2.2, '🏆 오락실 주간 랭킹판', board);
      } catch (e) { console.error('minigame options', e); }
      return r;
    };
  }
  // 저장 불러온 직후 유성우 밤이면 하늘 준비
  setTimeout(() => { try { if (S() && showerDay()) ensureMeteors(); } catch (e) { /* */ } }, 4000);
})();
