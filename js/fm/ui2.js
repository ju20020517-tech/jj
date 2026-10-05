/* =========================================================
 *  UI 2 — 주민 카드 목록(얼굴), 탭형 프로필, 주민 중심 관계도,
 *  친구모아 뉴스 방송, 우리 집 꾸미기 버튼, 3D 타이틀 화면
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE, D = FM.D, Sim = FM.Sim, Soc = FM.Soc, UI = FM.UI;
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const J = t => FM.josa(t);
  const st = () => Sim.get();
  const G = () => FM.G;
  const P = 'P';
  const face = (v, px, cls) => FM.Face.img(v, px, cls);
  const pct = n => Math.max(0, Math.min(100, Math.round(n || 0)));
  const who = id => (id === P ? st().player : Sim.byId(id));
  const kwName = k => (D.kw(k) ? D.kw(k).name : k);
  const growth = v => (v.child ? (D.GROWTH.find(g => g.id === v.child.stage) || {}).name : '');
  UI.face = face;

  function locName(v) {
    if (v.loc === 'island') { const d = FM.T.district(v.x, v.z); return FM.MAP.DISTRICTS[d].short + ' 지구'; }
    if (v.loc === 'metro') return v.taxi ? '택시' : '지하철';
    return FM.INTERIORS[v.loc] ? FM.INTERIORS[v.loc].name : v.loc;
  }
  const homeName = id => (FM.INTERIORS[id] ? FM.INTERIORS[id].name : '없음');
  const actName = v => (v.act ? v.act.name : v.moving ? '이동 중' : (D.STATES[v.state] || {}).ko || '쉬는 중');
  function mood(v) {
    if (v.status && v.status.hospital) return ['🤒', '아파요'];
    if (v.state === 'SLEEP' || (v.act && /잠|sleep/.test(v.act.name))) return ['😴', '쿨쿨'];
    if (v.hunger > 75) return ['🍙', '배고파요'];
    if (v.depression > 60) return ['😢', '우울해요'];
    if (v.stress > 65) return ['😣', '스트레스'];
    if (v.energy < 20) return ['🥱', '피곤해요'];
    if (Soc.partnerOf(v.id)) return ['🥰', '행복해요'];
    return v.stress < 30 ? ['😊', '기분 좋아요'] : ['🙂', '보통이에요'];
  }
  const bar = (n, c, label) => `<div class="bar2" title="${esc(label || '')}"><i style="width:${pct(n)}%;background:${c}"></i></div>`;
  const hearts = n => { const k = Math.round(pct(n) / 20); return `<span class="hearts">${'♥'.repeat(k)}<em>${'♥'.repeat(5 - k)}</em></span>`; };

  // 두 사람 관계의 한 줄 이름
  const KIND_LABEL = { DATING: '💕 연인', MARRIED: '💍 부부', EX: '💔 옛 연인', EX_LOVER: '💔 옛 연인', ENEMY: '☠️ 원수', RIVAL_LOVE: '⚔️ 연적', OLD_FRIEND: '📼 옛친구', AFFAIR: '🔥 비밀 연애' };
  function relLabel(a, b) {
    const k = FM.Drama && FM.Drama.kindOf ? FM.Drama.kindOf(a, b) : null;
    if (k) return { k, text: KIND_LABEL[k] || (FM.Will.BONDS || {})[k] || k };
    const r = Soc.rel(a, b);
    return { k: null, text: Soc.stageName(r.friendship_stage) };
  }

  // =========================================================
  // 주민 목록 — 얼굴 카드
  // =========================================================
  const VF = { q: '', f: 'all', sort: 'name' };
  let vKey = '';
  UI.pv = function (body) {
    const s = st(); if (!s) return;
    if (!body.querySelector('.vlist2')) {
      vKey = '';
      body.innerHTML = `<div class="vtools">
          <input id="vq" placeholder="🔍 이름 검색" value="${esc(VF.q)}">
          <button class="btn small" id="addV">➕ 이주</button>
        </div>
        <div class="chips vfilt">${Object.entries({ all: '전체', need: '❗ 고민', love: '💕 커플', single: '💭 솔로', kid: '👶 아이', near: '📍 근처' }).map(([k, l]) => `<button data-f="${k}" class="${VF.f === k ? 'on' : ''}">${l}</button>`).join('')}
          <select id="vsort"><option value="name">가나다순</option><option value="close">나와 친한 순</option><option value="stress">스트레스 순</option></select></div>
        <div class="vcount muted"></div>
        <div class="vlist2"></div>`;
      body.querySelector('#vsort').value = VF.sort;
      body.querySelector('#vq').oninput = e => { VF.q = e.target.value.trim(); vKey = ''; UI.pv(body); };
      body.querySelector('#vsort').onchange = e => { VF.sort = e.target.value; vKey = ''; UI.pv(body); };
      body.querySelectorAll('.vfilt [data-f]').forEach(b => b.onclick = () => { VF.f = b.dataset.f; body.querySelectorAll('.vfilt [data-f]').forEach(x => x.classList.toggle('on', x === b)); vKey = ''; UI.pv(body); });
      body.querySelector('#addV').onclick = () => UI.addVillager();
    }
    const p = s.player;
    let vs = s.villagers.slice();
    if (VF.q) vs = vs.filter(v => v.name.includes(VF.q) || (v.nick || '').includes(VF.q));
    if (VF.f === 'need') vs = vs.filter(v => v.balloon);
    if (VF.f === 'love') vs = vs.filter(v => Soc.partnerOf(v.id));
    if (VF.f === 'single') vs = vs.filter(v => !v.child && !Soc.partnerOf(v.id));
    if (VF.f === 'kid') vs = vs.filter(v => v.child);
    if (VF.f === 'near') vs = vs.filter(v => v.loc === p.loc && Math.hypot(v.x - p.x, v.z - p.z) < 30);
    if (VF.sort === 'name') vs.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    if (VF.sort === 'close') vs.sort((a, b) => Soc.rel(b.id, P).friendship_point - Soc.rel(a.id, P).friendship_point);
    if (VF.sort === 'stress') vs.sort((a, b) => b.stress - a.stress);
    const adults = s.villagers.filter(v => !v.child).length;
    body.querySelector('.vcount').textContent = `주민 ${adults}/${Sim.MAX_VILLAGERS}명${s.villagers.length > adults ? ` · 아이 ${s.villagers.length - adults}명` : ''} · 표시 ${vs.length}명`;
    const list = body.querySelector('.vlist2');
    const key = vs.map(v => v.id + (v.balloon ? '!' : '') + (Soc.partnerOf(v.id) || '') + (v.child ? v.child.stage : '')).join(',');
    if (key !== vKey) {
      vKey = key;
      list.innerHTML = vs.length ? vs.map(v => `<div class="vcard" data-id="${v.id}">
          <div class="vface">${face(v, 52)}${v.balloon ? `<span class="vbal ${v.balloon.color}">${v.balloon.kind === 'marry' ? '💍' : '!'}</span>` : ''}<span class="vmood"></span></div>
          <div class="vmain"><div class="vname"><b>${esc(v.name)}</b>${v.child ? `<small class="tag">👶 ${growth(v)}</small>` : ''}${Soc.partnerOf(v.id) ? `<small class="tag pink">💕 ${esc(Sim.nameOf(Soc.partnerOf(v.id)))}</small>` : ''}</div>
            <div class="vsub">${esc(v.title)}</div><div class="vloc"></div></div>
          <div class="vside"><span class="vrel"></span><button class="vgo" title="찾아가기">📍</button></div></div>`).join('') : '<p class="muted center">조건에 맞는 주민이 없어요</p>';
      list.querySelectorAll('.vcard').forEach(c => {
        const v = Sim.byId(c.dataset.id);
        c.onclick = e => { if (e.target.closest('.vgo')) return UI.goTo(v); UI.showProfile(v); };
      });
    }
    list.querySelectorAll('.vcard').forEach(c => {
      const v = Sim.byId(c.dataset.id); if (!v) return;
      const m = mood(v);
      c.querySelector('.vmood').textContent = m[0]; c.querySelector('.vmood').title = m[1];
      c.querySelector('.vloc').textContent = `📍 ${locName(v)} · ${actName(v)}`;
      c.querySelector('.vrel').innerHTML = hearts(Soc.rel(v.id, P).friendship_point);
    });
  };

  // =========================================================
  // 프로필 — 탭형
  // =========================================================
  let pfTab = 'info';
  UI.showProfile = function (v, tab) {
    if (!v || v.staff) return;
    if (tab) pfTab = tab;
    const ks = [v.keys.L1, v.keys.L2, v.keys.L3, v.keys.L4];
    const tabs = { info: '📋 개요', rel: '👥 관계', love: '💞 사랑·가족', home: '🏡 집' };
    UI.modal(`<span class="pf-t">${esc(v.name)}${v.nick ? ` <small>'${esc(v.nick)}'</small>` : ''}</span>`, `
      <div class="pf2">
        <div class="pf-hero">
          <div class="pf-face">${face(v, 104)}</div>
          <div class="pf-id">
            <div class="pf-title">${esc(v.title)}${v.child ? ` · 👶 ${growth(v)}` : ''}</div>
            <div class="pf-kw">${ks.map((k, i) => `<span class="k l${i + 1}" title="${esc(D.kw(k).desc || '')}">${D.kw(k).icon || ''} ${D.kw(k).name}</span>`).join('')}${(v.extraMain || []).map(k => `<span class="k l1">${D.kw(k).icon} ${D.kw(k).name}</span>`).join('')}${FM.Moral ? FM.Moral.chips(v) : ''}</div>
            <div class="pf-thought">💭 ${esc(Sim.thought(v))}</div>
          </div>
        </div>
        <div class="pf-acts"><button data-a="talk">💬 말 걸기</button><button data-a="go">📍 찾아가기</button><button data-a="map">🕸️ 관계도</button><button data-a="room">🔭 방 보기</button><button data-a="voice">🔊 목소리</button></div>
        <div class="pf-tabs">${Object.entries(tabs).map(([k, l]) => `<button data-t="${k}" class="${pfTab === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <div class="pf-body"></div>
      </div>`, b => {
      const paint = () => {
        b.querySelectorAll('.pf-tabs button').forEach(x => x.classList.toggle('on', x.dataset.t === pfTab));
        const pb = b.querySelector('.pf-body');
        pb.innerHTML = ({ info: pfInfo, rel: pfRel, love: pfLove, home: pfHome })[pfTab](v);
        pb.querySelectorAll('[data-open]').forEach(x => x.onclick = () => { const o = Sim.byId(x.dataset.open); if (o) UI.showProfile(o); });
        if (pfTab === 'home') bindHome(pb, v, paint);
      };
      b.querySelectorAll('.pf-tabs button').forEach(x => x.onclick = () => { pfTab = x.dataset.t; paint(); });
      b.querySelector('[data-a=talk]').onclick = () => { UI.closeModal(); UI.goTo(v); setTimeout(() => UI.talk(v), 500); };
      b.querySelector('[data-a=go]').onclick = () => { UI.closeModal(); UI.goTo(v); };
      b.querySelector('[data-a=map]').onclick = () => FM.Drama.openMap(v.id);
      b.querySelector('[data-a=voice]').onclick = () => { if (!FM.Audio.on) FM.Audio.enable(true); const t = Sim.thought(v); v.bubble = { text: t, until: Sim.get().realT + 3 }; if (FM.Voice) FM.Audio.speak(FM.Voice.of(v), t); };
      b.querySelector('[data-a=room]').onclick = () => { UI.closeModal(); if (v.home.startsWith('apt')) G().observe(v.home); else G().observeInterior(v.home); };
      paint();
    }, true);
  };

  function pfInfo(v) {
    const S2 = v.stats, rp = Soc.rel(v.id, P);
    const ex = D.COMBO_EXAMPLES.find(e => e.keys.every((k, i) => [v.keys.L1, v.keys.L2, v.keys.L3, v.keys.L4][i] === k));
    const m = mood(v);
    const topActs = Object.entries(S2.acts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([a]) => (D.ACTIONS[a] || {}).name || a);
    return `
      <div class="pf-grid">
        <section class="pf-card"><h5>${m[0]} 지금</h5>
          <div class="kv"><span>위치</span><b>${esc(locName(v))}</b></div>
          <div class="kv"><span>하는 일</span><b>${esc(actName(v))}</b></div>
          <div class="kv"><span>일정</span><b>${esc(v.blockLabel || '-')}</b></div>${FM.Schedule && FM.Schedule.describe(v) ? `<div class="kv"><span>오늘 일정표</span><b>${esc(FM.Schedule.describe(v))}</b></div>` : ''}
          <div class="kv"><span>기분</span><b>${m[1]}</b></div>
          ${v.status.hospital ? `<div class="kv"><span>🏥 입원</span><b>${esc(v.status.disease)}</b></div>` : ''}
        </section>
        <section class="pf-card"><h5>📊 컨디션</h5>
          <div class="stat"><span>🍙 배부름</span>${bar(100 - v.hunger, '#ffb86b')}</div>
          <div class="stat"><span>⚡ 에너지</span>${bar(v.energy, '#7fd47f')}</div>
          <div class="stat"><span>😣 스트레스</span>${bar(v.stress, '#ff8a8a')}</div>
          <div class="stat"><span>🌧️ 우울</span>${bar(v.depression, '#8aa8ff')}</div>
          <div class="stat"><span>⭐ 평판</span>${bar(v.reputation, '#ffd84a')}</div>
        </section>
        <section class="pf-card"><h5>🙋 나와의 사이</h5>
          <div class="kv"><span>관계</span><b>${Soc.stageName(rp.friendship_stage)}${rp.permanent ? ' 💎' : ''}</b></div>
          <div class="stat"><span>친밀도</span>${bar(rp.friendship_point, '#ff9ec4')}</div>
          <div class="stat"><span>신뢰도</span>${bar(rp.trust_level, '#8fd0ff')}</div>
          <div class="stat"><span>💗 설렘</span>${bar(Soc.F(v.id, P).romance, '#ff6f9f')}</div>
        </section>
        <section class="pf-card"><h5>💼 생활</h5>
          <div class="kv"><span>직업</span><b>${Sim.JOB_NAMES[v.job] || '-'}</b></div>
          <div class="kv"><span>지갑</span><b>🪙 ${Math.floor(v.coins).toLocaleString()}${v.debt ? ` <small class="neg">(빚 ${v.debt})</small>` : ''}</b></div>
          <div class="kv"><span>집</span><b>${esc(homeName(v.home))}</b></div>
          <div class="kv"><span>자주 하는 일</span><b>${esc(topActs.join(', ') || '-')}</b></div>
        </section>
      </div>
      ${FM.Needs ? pfMind(v) : ''}
      <section class="pf-card wide"><h5>🎁 취향</h5>
        <p>좋아하는 선물: <b>${esc(v.giftLikes.join(', '))}</b>${v.giftDislikes.length ? ` · 싫어하는 선물: ${esc(v.giftDislikes.join(', '))}` : ''}<br>
        관심사: ${v.likesKeys.map(kwName).join(', ')}${v.likesSpecies ? ` · 좋아하는 종: ${(ISLE.SPECIES[v.likesSpecies] || {}).name || ''}` : ''}${v.quirks.length ? `<br>숨은 특징: ${v.quirks.map(esc).join(', ')}` : ''}</p>
        ${ex ? `<p class="pf-ex">📖 <b>${ex.title}</b> — ${esc(ex.pattern)}<br>💬 "${esc(ex.line)}"</p>` : ''}
      </section>`;
  }

  // 자율 의지 — 5대 욕구 · 3단 기억 · 지금 하고 싶은 말
  function pfMind(v) {
    const N = FM.Needs, n = N.of(v), m = N.mem(v);
    const top = Object.entries(n).sort((a, b) => b[1] - a[1])[0];
    const line = N.compose(v, top[0]);
    const memRow = (arr, label) => arr.length ? `<div class="mem-tier"><b>${label}</b>${arr.slice(-3).reverse().map(e => `<span>${esc(N.agoTxt(e.t))} · ${esc(e.text)}</span>`).join('')}</div>` : '';
    return `<section class="pf-card wide mind"><h5>🧠 자율 의지 엔진</h5>
      <div class="needs">${Object.entries(N.NEEDS).map(([k, d]) => `<div class="stat"><span>${d.icon} ${d.name}</span>${bar(n[k], n[k] >= 80 ? '#ff5d6d' : d.color)}</div>`).join('')}${v.guilt > 1 ? `<div class="stat"><span>😔 죄책감</span>${bar(v.guilt, '#6a5a8a')}</div>` : ''}</div>
      <div class="synth"><small>지금 가장 큰 욕구: <b>${N.NEEDS[top[0]].icon} ${N.NEEDS[top[0]].name} ${Math.round(top[1])}</b>${top[1] >= 80 ? ' — 곧 먼저 말을 걸어올 거예요!' : ''}</small>
        <div class="syn-row"><em>도입</em>${esc(line.Intro)}</div>${line.Memory_Ref ? `<div class="syn-row"><em>기억</em>${esc(line.Memory_Ref)}</div>` : ''}<div class="syn-row"><em>의도</em>${esc(line.Intent)}</div><div class="syn-row"><em>떡밥</em>${esc(line.Hook)}</div></div>
      ${memRow(m.short, '⏱️ 단기 기억 (48시간)')}${memRow(m.mid, '📅 중기 기억 (30일)')}${memRow(m.long, '💎 장기 기억 (영구)')}
    </section>`;
  }
  function relRows(v, limit) {
    const s = st();
    const others = s.villagers.filter(o => o !== v && Soc.hasRel(v.id, o.id)).map(o => ({ o, r: Soc.rel(v.id, o.id), f: Soc.F(v.id, o.id).romance, g: Soc.F(o.id, v.id).romance, L: relLabel(v.id, o.id) }));
    const pri = x => (x.L.k ? 200 : 0) + Math.max(x.f, x.g) * 0.8 + x.r.friendship_point;
    others.sort((a, b) => pri(b) - pri(a));
    return others.slice(0, limit || 40);
  }
  const fightTxt = r => {
    const f = r.fights || [];
    if (r.grudge > 0) return `<div class="rr-grudge">⚔️ 싸운 기록 ${f.length}회 · 🧊 앙금 ${Math.round(r.grudge)} <small>(최근 ${f.length ? `${f[f.length - 1].day}일차 ${esc(f[f.length - 1].why)}` : ''}) — 화해 전까지 남아요</small></div>`;
    if (f.length && r.resolved) return `<div class="rr-hist">🕊️ ${f.length}번 싸웠지만 화해함 (${r.resolved.day}일차)</div>`;
    return '';
  };
  function pfRel(v) {
    const rows = relRows(v);
    const drama = FM.Drama && FM.Drama.dramaLines ? FM.Drama.dramaLines(v.id) : [];
    return `${drama.length ? `<section class="pf-card drama"><h5>🎭 얽힌 드라마</h5>${drama.map(x => `<div>${esc(x)}</div>`).join('')}</section>` : ''}
      <div class="rel-list">${rows.length ? rows.map(({ o, r, f, g, L }) => `<div class="rel-row" data-open="${o.id}">
        ${face(o, 42)}
        <div class="rr-main"><div><b>${esc(o.name)}</b> <span class="rbadge ${L.k ? 'k' : ''}">${esc(L.text)}</span>${r.misunderstanding && r.misunderstanding.until > Sim.time.day() ? ' <span class="rbadge bad">😤 오해</span>' : ''}</div>
          <div class="stat mini"><span>친밀</span>${bar(r.friendship_point, '#7fcf9a')}</div>
          ${f > 10 || g > 10 ? `<div class="rr-love">💗 ${esc(v.name)}→ ${pct(f)} · ←${esc(o.name)} ${pct(g)}</div>` : ''}
          ${FM.Drama.histOf(v.id, o.id) ? `<div class="rr-hist">📜 ${esc(FM.Drama.histOf(v.id, o.id))}</div>` : ''}${fightTxt(r)}</div></div>`).join('') : '<p class="muted center">아직 친해진 주민이 없어요</p>'}</div>`;
  }

  function pfLove(v) {
    const life = FM.L.MAIN_LIFE[v.keys.L1];
    const m = Soc.marriageOf(v.id), kids = Soc.childrenOf(v.id);
    const pt = Soc.partnerOf(v.id);
    const cr = v.crush;
    const jl = v.jealousy && v.jealousy.meter > 0 ? v.jealousy : null;
    const person = id => { const o = who(id); return o ? `<span class="pchip" ${id !== P ? `data-open="${id}"` : ''}>${face(o, 26)} ${esc(id === P ? o.name + ' (나)' : o.name)}</span>` : '?'; };
    const CR_STAGE = { SECRET: '몰래 좋아하는 중', HINT: '티 내는 중', CONFESS: '고백 준비 중' };
    return `<div class="pf-grid">
      <section class="pf-card"><h5>💕 연애</h5>
        <div class="kv"><span>지금</span><b>${pt ? `${person(pt)}와(과) ${m ? '결혼' : '연애'} 중` : '솔로'}</b></div>
        <div class="kv"><span>연애 스타일</span><b>${D.LOVE_ARCH[v.loveArch].name}</b></div>
        <p class="muted">${esc(D.LOVE_ARCH[v.loveArch].desc)}</p>
        <div class="kv"><span>질투 유형</span><b>${esc(D.JEALOUS_TYPES[v.jealType])}</b></div>
      </section>
      <section class="pf-card"><h5>💗 마음</h5>
        ${cr ? `<div class="kv"><span>짝사랑</span><b>${person(cr.target)}</b></div><div class="stat"><span>마음 크기</span>${bar(cr.intensity, '#ff6f9f')}</div><div class="kv"><span>단계</span><b>${CR_STAGE[cr.stage] || cr.stage}</b></div>` : '<p class="muted">지금은 짝사랑하는 사람이 없어요</p>'}
        ${jl ? `<div class="stat"><span>⚡ 질투</span>${bar(jl.meter, '#ffae42')}</div>${jl.rival ? `<div class="kv"><span>신경 쓰이는 사람</span><b>${person(jl.rival)}</b></div>` : ''}` : ''}
      </section>
      ${m ? `<section class="pf-card"><h5>💍 결혼</h5>
        <div class="kv"><span>배우자</span><b>${person(m.spouse_a_id === v.id ? m.spouse_b_id : m.spouse_a_id)}</b></div>
        <div class="kv"><span>결혼한 날</span><b>${m.wedding_day}일차</b></div>
        <div class="stat"><span>만족도</span>${bar(m.marital_satisfaction, '#ff9ec4')}</div>
        <div class="kv"><span>신혼집</span><b>${esc(homeName(m.matrimonial_home_id))}</b></div></section>` : ''}
      <section class="pf-card"><h5>👨‍👩‍👧 가족</h5>
        ${v.child ? `<div class="kv"><span>부모</span><b>${v.child.parents.map(person).join(' ')}</b></div><div class="kv"><span>성장</span><b>${growth(v)} (${v.child.birthDay}일차 출생)</b></div>${v.child.third ? `<div class="kv"><span>후천 성격</span><b>${kwName(v.child.third)}</b></div>` : ''}` : ''}
        ${v.child && v.child.edu ? `<div class="kv"><span>받은 교육</span><b>${Object.entries(v.child.edu).map(([k, n]) => `${D.L1[k].icon}${n}`).join(' ')}</b></div>` : ''}
        ${v.child && FM.Life ? `<div class="kv"><span>독립까지</span><b>${Math.max(0, FM.Life.INDEP_DAY - (Sim.time.day() - v.child.birthDay))}일</b></div>` : ''}
        ${v.grownUp ? `<div class="kv"><span>🏰 가문</span><b>${esc(v.grownUp.house)} ${v.grownUp.gen}세</b></div><div class="kv"><span>부모</span><b>${v.grownUp.parents.map(person).join(' ')}</b></div><div class="kv"><span>성격 유래</span><b>${esc(v.grownUp.why)}</b></div>` : ''}
        ${kids.length ? `<div class="kv"><span>자녀</span><b>${kids.map(k => person(k.id)).join(' ')}</b></div>` : v.child ? '' : '<p class="muted">아직 자녀가 없어요</p>'}
        <button class="btn small" id="pfFam">🌳 마을 가계도</button>
      </section>
    </div>
    <section class="pf-card wide"><h5>📖 ${D.L1[v.keys.L1].name} 성격의 사랑법</h5>
      <p>💕 ${esc(life.love)}<br>💬 "${esc(life.loveLine)}"<br>💍 ${esc(life.marriage)}<br>👶 ${esc(life.parenting)}</p></section>`;
  }

  function pfHome(v) {
    const opts = Sim.homeOptions ? Sim.homeOptions() : [];
    const roommates = st().villagers.filter(o => o !== v && o.home === v.home);
    const KIND = { apt: '🏢 아파트', villa: '🏡 빌라 (독채)', villaL: '🏘️ 큰 빌라 (2인)' };
    const room = st().rooms[v.home];
    return `<section class="pf-card wide"><h5>🏠 지금 사는 집</h5>
        <div class="kv"><span>집</span><b>${esc(homeName(v.home))}</b></div>
        ${roommates.length ? `<div class="kv"><span>같이 사는 주민</span><b>${roommates.map(o => `<span class="pchip" data-open="${o.id}">${face(o, 24)} ${esc(o.name)}</span>`).join(' ')}</b></div>` : ''}
        ${room && room.roomStyle && FM.RoomKit && FM.RoomKit.STYLES[room.roomStyle] ? `<div class="kv"><span>방 스타일</span><b>${esc(FM.RoomKit.STYLES[room.roomStyle].name)}</b></div>` : ''}
        <div class="md-actions"><button class="btn small" id="hmEdit">🎨 방 꾸며주기</button><button class="btn small ghost" id="hmObs">🔭 방 관찰</button></div>
      </section>
      ${v.child ? '<p class="muted">아이는 부모님과 함께 살아요.</p>' : `<section class="pf-card wide"><h5>🚚 이사 보내기</h5>
        ${opts.length ? `<div class="home-opts">${opts.map(o => `<button data-home="${o.id}"><b>${KIND[o.kind]}</b><span>${esc(homeName(o.id))}</span>${o.used ? `<small>룸메이트 ${o.used}명</small>` : '<small>빈 집</small>'}</button>`).join('')}</div>` : '<p class="muted">비어 있는 집이 없어요.</p>'}
        <p class="muted">커스텀 빌라에도 주민이 살 수 있어요. 이사하면 새 집 크기에 맞춰 성격대로 방을 꾸며요.</p></section>`}`;
  }
  function bindHome(pb, v, repaint) {
    const e = pb.querySelector('#hmEdit'); if (e) e.onclick = () => { UI.closeModal(); UI.openRoomEditor(v.home); };
    const o = pb.querySelector('#hmObs'); if (o) o.onclick = () => { UI.closeModal(); if (v.home.startsWith('apt')) G().observe(v.home); else G().observeInterior(v.home); };
    pb.querySelectorAll('[data-home]').forEach(b => b.onclick = () => {
      const iid = b.dataset.home;
      if (!confirm(`${v.name}을(를) ${homeName(iid)}(으)로 이사 보낼까요?`)) return;
      Soc.moveHome(v, iid);
      FM.Sim.say && FM.Sim.say(v, FM.L.sty ? FM.L.sty(v, '새 집이다! 두근두근해') : '새 집이다!');
      UI.toast(`🚚 ${v.name} → ${homeName(iid)} 이사 완료!`);
      G().rebuildInterior && G().rebuildInterior();
      repaint();
    });
  }
  // 사랑 탭의 가계도 버튼 (탭 전환 뒤 바인딩)
  document.addEventListener('click', e => { if (e.target && e.target.id === 'pfFam') UI.familyTree(); });

  // =========================================================
  // 관계도 — 주민을 고르면 그 주민 중심으로
  // =========================================================
  let mapSel = null;
  FM.Drama.openMap = function (id) {
    const s = st();
    const vs = s.villagers.filter(v => !v.gone);
    if (id) mapSel = id;
    if (!mapSel || (mapSel !== P && !Sim.byId(mapSel))) mapSel = (vs.find(v => Soc.partnerOf(v.id)) || vs[0] || {}).id || P;
    UI.modal('🕸️ 관계도', `<div class="em-pick">${[P].concat(vs.map(v => v.id)).map(i => { const o = who(i); return `<button data-sel="${i}" class="${i === mapSel ? 'on' : ''}" title="${esc(o.name)}">${face(o, 40)}<small>${esc(i === P ? '나' : o.name)}</small></button>`; }).join('')}<button class="all" data-all="1">🌐<small>전체</small></button></div>
      <div class="em-wrap"><div class="em-svg"></div><div class="em-side"></div></div>`, b => {
      const draw = () => {
        b.querySelectorAll('[data-sel]').forEach(x => x.classList.toggle('on', x.dataset.sel === mapSel));
        b.querySelector('.em-svg').innerHTML = egoSvg(mapSel);
        b.querySelector('.em-side').innerHTML = egoSide(mapSel);
        b.querySelectorAll('.em-svg [data-n], .em-side [data-n]').forEach(x => x.onclick = () => { mapSel = x.dataset.n; draw(); const btn = b.querySelector(`[data-sel="${mapSel}"]`); if (btn) btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); });
        b.querySelectorAll('.em-side [data-prof]').forEach(x => x.onclick = () => UI.showProfile(Sim.byId(x.dataset.prof), 'rel'));
      };
      b.querySelectorAll('[data-sel]').forEach(x => x.onclick = () => { mapSel = x.dataset.sel; draw(); });
      b.querySelector('[data-all]').onclick = () => FM.Drama.openMapAll();
      draw();
      const cur = b.querySelector('.em-pick .on'); if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
    }, true);
  };
  function egoList(id) {
    const s = st();
    const all = s.villagers.filter(v => !v.gone && v.id !== id).map(v => v.id).concat(id === P ? [] : [P]);
    const rom = (a, b) => Soc.F(a, b).romance;
    return all.filter(o => Soc.hasRel(id, o)).map(o => {
      const r = Soc.rel(id, o); const L = relLabel(id, o);
      return { o, r, L, out: rom(id, o), inn: rom(o, id) };
    }).sort((a, b) => ((b.L.k ? 300 : 0) + Math.max(b.out, b.inn) + b.r.friendship_point) - ((a.L.k ? 300 : 0) + Math.max(a.out, a.inn) + a.r.friendship_point));
  }
  function egoSvg(id) {
    const W = 460, H = 440, cx = W / 2, cy = H / 2;
    const list = egoList(id);
    const EDGE = FM.Drama.EDGE;
    const inner = list.filter(x => x.L.k || x.out >= 45 || x.inn >= 45 || x.r.friendship_point >= 55);
    const outer = list.filter(x => !inner.includes(x));
    const ring = (arr, R, off) => arr.forEach((x, i) => { const a = (i + off) / arr.length * Math.PI * 2 - Math.PI / 2; x.x = cx + Math.cos(a) * R; x.y = cy + Math.sin(a) * R; });
    if (!outer.length) ring(inner, Math.min(175, 95 + inner.length * 7), 0);
    else { ring(inner, 112, 0); ring(outer, 186, 0.5); }
    const img = (v, x, y, r, sel) => `<g transform="translate(${x},${y})"><circle r="${r + 3}" fill="${sel ? '#fff1a8' : '#fffaf2'}" stroke="${sel ? '#ffb13d' : '#ead8c0'}" stroke-width="${sel ? 3 : 2}"/><image href="${FM.Face.url(v)}" x="${-r}" y="${-r}" width="${r * 2}" height="${r * 2}" clip-path="url(#emc${r})"/></g>`;
    const me = who(id);
    const lines = list.map(x => {
      const e = x.L.k ? EDGE[x.L.k] : null;
      const c = e ? e[0] : x.r.friendship_point >= 50 ? '#9ed8a8' : '#d9cfc2', w = e ? e[1] + 0.5 : 1 + x.r.friendship_point / 40, dash = e ? e[2] : x.r.friendship_point < 25 ? '3 4' : '';
      return `<line x1="${cx}" y1="${cy}" x2="${x.x}" y2="${x.y}" stroke="${c}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''} stroke-linecap="round" opacity=".9"/>`;
    }).join('');
    const arrows = list.map(x => {
      let s2 = '';
      const curve = (x1, y1, x2, y2, k) => { const mx = (x1 + x2) / 2 + (y2 - y1) * k, my = (y1 + y2) / 2 - (x2 - x1) * k; const t = 0.8; const ex = x1 + (x2 - x1) * t, ey = y1 + (y2 - y1) * t; return `<path d="M${x1},${y1} Q${mx},${my} ${ex},${ey}" stroke="#ff7fa8" stroke-width="2" fill="none" stroke-dasharray="5 3" marker-end="url(#emArr)"/>`; };
      if (x.out >= 45 && x.L.k !== 'DATING' && x.L.k !== 'MARRIED') s2 += curve(cx, cy, x.x, x.y, 0.12);
      if (x.inn >= 45 && x.L.k !== 'DATING' && x.L.k !== 'MARRIED') s2 += curve(x.x, x.y, cx, cy, 0.12);
      return s2;
    }).join('');
    const labels = list.filter(x => x.L.k || x.out >= 45 || x.inn >= 45).map(x => {
      const t = x.L.k ? x.L.text : x.out >= 45 && x.inn >= 45 ? '💞 서로 설렘' : x.out >= 45 ? '💘 짝사랑' : '💌 짝사랑 받음';
      const lx = cx + (x.x - cx) * 0.56, ly = cy + (x.y - cy) * 0.56;
      return `<g transform="translate(${lx},${ly})"><rect x="${-t.length * 5.4}" y="-10" width="${t.length * 10.8}" height="19" rx="9.5" fill="#fff" stroke="#f0dcc8"/><text y="4.5" text-anchor="middle" font-size="11" fill="#6a4a38">${esc(t)}</text></g>`;
    }).join('');
    const nodes = list.map(x => { const v = who(x.o); return `<g data-n="${x.o}" style="cursor:pointer">${img(v, x.x, x.y, 19)}<text x="${x.x}" y="${x.y + 35}" text-anchor="middle" font-size="11.5" fill="#4a3428" stroke="#fffaf0" stroke-width="3" paint-order="stroke">${esc(x.o === P ? '나' : v.name)}</text></g>`; }).join('');
    return `<svg viewBox="0 0 ${W} ${H}">
      <defs><clipPath id="emc19"><circle r="19"/></clipPath><clipPath id="emc34"><circle r="34"/></clipPath>
      <marker id="emArr" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto"><path d="M0,0 L8,3.5 L0,7 z" fill="#ff7fa8"/></marker>
      <radialGradient id="emBg"><stop offset="0" stop-color="#fff7e8"/><stop offset="1" stop-color="#fff7e8" stop-opacity="0"/></radialGradient></defs>
      <circle cx="${cx}" cy="${cy}" r="210" fill="url(#emBg)"/>
      ${outer.length ? `<circle cx="${cx}" cy="${cy}" r="186" fill="none" stroke="#f1e4d2" stroke-dasharray="2 6"/>` : ''}
      ${lines}${arrows}${labels}${nodes}
      ${img(me, cx, cy, 34, true)}<text x="${cx}" y="${cy + 54}" text-anchor="middle" font-size="14" fill="#3b2b20" stroke="#fffaf0" stroke-width="4" paint-order="stroke">${esc(id === P ? me.name + ' (나)' : me.name)}</text>
      ${list.length ? '' : `<text x="${cx}" y="${cy + 90}" text-anchor="middle" font-size="13" fill="#9a8a78">아직 아는 사람이 없어요</text>`}
    </svg>`;
  }
  function egoSide(id) {
    const list = egoList(id);
    const me = who(id);
    const drama = id === P ? [] : FM.Drama.dramaLines(id);
    const groups = [['💞 특별한 사이', list.filter(x => x.L.k || x.out >= 45 || x.inn >= 45)], ['🤝 친구', list.filter(x => !x.L.k && x.out < 45 && x.inn < 45 && x.r.friendship_point >= 35)], ['🙂 아는 사이', list.filter(x => !x.L.k && x.out < 45 && x.inn < 45 && x.r.friendship_point < 35)]];
    return `<div class="em-me">${face(me, 46)}<div><b>${esc(id === P ? me.name + ' (나)' : me.name)}</b><small>${id === P ? '플레이어' : esc(me.title)}</small></div>${id !== P ? `<button class="btn small ghost" data-prof="${id}">프로필</button>` : ''}</div>
      ${drama.length ? `<div class="em-drama">${drama.map(x => `<div>🎭 ${esc(x)}</div>`).join('')}</div>` : ''}
      ${groups.filter(g => g[1].length).map(([t, arr]) => `<h5>${t} <small>${arr.length}</small></h5>${arr.map(x => { const v = who(x.o); const h = x.o !== P && id !== P ? FM.Drama.histOf(id, x.o) : ''; return `<div class="em-row" data-n="${x.o}">${face(v, 30)}<div><b>${esc(x.o === P ? '나' : v.name)}</b> <span class="rbadge ${x.L.k ? 'k' : ''}">${esc(x.L.text)}</span>${bar(x.r.friendship_point, '#7fcf9a')}${x.out > 10 || x.inn > 10 ? `<small class="rr-love">💗 → ${pct(x.out)} · ← ${pct(x.inn)}</small>` : ''}${h ? `<small class="rr-hist">📜 ${esc(h)}</small>` : ''}</div></div>`; }).join('')}`).join('') || '<p class="muted">아직 관계가 없어요</p>'}
      <p class="muted em-legend">선: <span style="color:#ff5d8a">━ 연인</span> <span style="color:#3ab86a">━ 절친</span> <span style="color:#ff9a3a">━ 라이벌</span> <span style="color:#2b2b30">━ 원수</span> <span style="color:#9aa3ad">┅ 옛 연인</span> <span style="color:#ff7fa8">⇢ 짝사랑</span><br>이름을 누르면 그 주민 중심으로 바뀌어요</p>`;
  }

  // =========================================================
  // 친구모아 뉴스 — 방송 화면
  // =========================================================
  let showState = null;
  const unseen = () => (st() && st().news ? st().news.filter(n => n.seen === false).length : 0);
  function episodeFallback() {
    const s = st();
    const src = s.log.filter(e => e.imp >= 2 && !e.secret).slice(-5);
    const cards = src.map(e => ({ text: e.text.replace(/^[^\s]+\s/, ''), who: (e.who || []).slice(0, 3), icon: (e.text.match(/^(\S+)\s/) || [])[1] || '📰' }));
    if (!cards.length) cards.push({ text: `${s.villagers.length}명의 주민이 사는 친구모아 아일랜드에 오신 걸 환영합니다! 오늘도 즐거운 하루 보내세요`, who: s.villagers.slice(0, 3).map(v => v.id), icon: '🏝️' });
    const anc = (FM.Ev && FM.Ev.staffById('s_anchor')) || s.villagers.find(v => v.job === 'anchor');
    return { day: Sim.time.day(), hm: Sim.time.hm(), cards, anchorId: anc ? anc.id : null, special: true };
  }
  UI.newsShow = function (ep) {
    const s = st(); if (!s) return;
    if (!ep) ep = s.news.filter(n => n.seen === false)[0] || s.news[s.news.length - 1] || episodeFallback();
    const cards = ep.cards || (ep.items || []).map(t => ({ text: t, who: [], icon: '📰' }));
    if (!cards.length) return;
    ep.seen = true;
    closeNews();
    const el = document.createElement('div'); el.id = 'newsShow';
    const anchor = ep.anchorId && Sim.byId(ep.anchorId);
    const auto = s.flags.autoNews !== false;
    el.innerHTML = `<div class="ns-tv">
      <div class="ns-top"><span class="ns-logo">친구모아 <b>NEWS</b></span><span class="ns-live">● LIVE</span><span class="ns-time">${ep.day}일차 ${ep.hm}${ep.special ? ' · 특별 방송' : ''}</span><button class="ns-x" title="닫기">✕</button></div>
      <div class="ns-stage">
        <div class="ns-anchor"><div class="ns-desk"></div><div class="ns-aface">${anchor ? `<img class="face a0" src="${FM.Face.url(anchor)}"><img class="face a1" src="${FM.Face.url(anchor, 'happy')}">` : '<span class="ns-mic">🎙️</span>'}</div><div class="ns-aname">${anchor ? esc(anchor.name) : '친구모아'} 앵커</div></div>
        <div class="ns-card"></div>
      </div>
      <div class="ns-bottom"><div class="ns-ticker"><span>${cards.map(c => esc(J(c.text))).join('  ◆  ')}</span></div>
        <div class="ns-nav"><button data-n="-1">◀</button><span class="ns-dots">${cards.map((_, i) => `<i data-i="${i}"></i>`).join('')}</span><button data-n="1">▶</button>
        <label class="ns-auto"><input type="checkbox" ${auto ? 'checked' : ''}> 새 뉴스 자동 방송</label><button class="ns-arch">📼 지난 방송</button></div></div>
    </div>`;
    document.body.appendChild(el);
    FM.Audio && FM.Audio.sfx && FM.Audio.sfx('chime');
    showState = { el, cards, i: -1, timer: null, talkT: null, anchorV: anchor || null };
    el.onclick = e => { if (e.target === el) closeNews(); };
    el.querySelector('.ns-x').onclick = closeNews;
    el.querySelectorAll('[data-n]').forEach(b => b.onclick = () => showCard(showState.i + +b.dataset.n));
    el.querySelectorAll('.ns-dots i').forEach(b => b.onclick = () => showCard(+b.dataset.i));
    el.querySelector('.ns-auto input').onchange = e => { s.flags.autoNews = e.target.checked; };
    el.querySelector('.ns-arch').onclick = () => { closeNews(); newsArchive(); };
    showCard(0);
    paintNewsBadge();
  };
  function showCard(i) {
    const S2 = showState; if (!S2) return;
    if (i >= S2.cards.length) return closeNews();
    i = Math.max(0, i); S2.i = i;
    const c = S2.cards[i];
    const ppl = (c.who || []).map(who).filter(Boolean);
    const box = S2.el.querySelector('.ns-card');
    box.innerHTML = `<div class="ns-no">${i + 1} / ${S2.cards.length}</div><div class="ns-icon">${esc(c.icon || '📰')}</div>
      ${ppl.length ? `<div class="ns-ppl">${ppl.map(v => `<div>${face(v, 76)}<small>${esc(v === st().player ? '나' : v.name)}</small></div>`).join('')}</div>` : ''}
      <div class="ns-head"></div>`;
    box.classList.remove('in'); void box.offsetWidth; box.classList.add('in');
    S2.el.querySelectorAll('.ns-dots i').forEach((d, k) => d.classList.toggle('on', k === i));
    // 타자기 + 앵커 입 모양
    const text = J(c.text); let k = 0; const head = box.querySelector('.ns-head');
    clearInterval(S2.talkT); clearTimeout(S2.timer);
    const af = S2.el.querySelector('.ns-aface');
    S2.talkT = setInterval(() => {
      k += 2; head.textContent = text.slice(0, k);
      if (S2.anchorV && FM.Voice && text[k - 1] && text[k - 1] !== ' ') FM.Voice.blip(S2.anchorV, text[k - 1]);
      if (af) af.classList.toggle('talk', (k / 2) % 2 === 1);
      if (k >= text.length) { clearInterval(S2.talkT); if (af) af.classList.remove('talk'); S2.timer = setTimeout(() => showCard(S2.i + 1), 3800); }
    }, 45);
    FM.Audio && FM.Audio.sfx && FM.Audio.sfx('pop');
  }
  function closeNews() {
    if (!showState) { const o = $('#newsShow'); if (o) o.remove(); return; }
    clearInterval(showState.talkT); clearTimeout(showState.timer);
    showState.el.remove(); showState = null;
  }
  UI.closeNews = closeNews;
  function newsArchive() {
    const s = st();
    const eps = s.news.slice().reverse();
    UI.modal('📼 지난 방송', eps.length ? `<div class="ns-arc">${eps.map((n, i) => `<button data-e="${s.news.length - 1 - i}"><b>${n.day}일차 ${n.hm}</b>${n.seen === false ? '<span class="new">NEW</span>' : ''}<span>${esc(J((n.cards ? n.cards[0].text : n.items[0]) || ''))}</span></button>`).join('')}</div>` : '<p class="muted">아직 방송이 없어요. 매일 9시·19시에 뉴스가 나와요!</p>', b => {
      b.querySelectorAll('[data-e]').forEach(x => x.onclick = () => { UI.closeModal(); UI.newsShow(s.news[+x.dataset.e]); });
    });
  }
  UI.newsArchive = newsArchive;
  function paintNewsBadge() {
    const b = $('#btnNews'); if (!b) return;
    const n = unseen();
    b.dataset.badge = n ? String(n) : '';
    b.classList.toggle('pulse', !!n);
  }
  // 속보 티커
  function breaking(e) {
    const bx = $('#breaking'); if (!bx) return;
    const people = (e.who || []).map(who).filter(Boolean).slice(0, 2);
    bx.innerHTML = `<span class="bk-tag">속보</span>${people.map(v => face(v, 28)).join('')}<span class="bk-t">${esc(J(e.text))}</span>`;
    bx.hidden = false; bx.classList.remove('in'); void bx.offsetWidth; bx.classList.add('in');
    clearTimeout(bx._t); bx._t = setTimeout(() => { bx.hidden = true; }, 6500);
    bx.onclick = () => { bx.hidden = true; FM.UI.newsShow({ day: e.day, hm: e.hm, cards: [{ text: e.text.replace(/^[^\s]+\s/, ''), who: e.who || [], icon: (e.text.match(/^(\S+)\s/) || [])[1] || '📰' }], anchorId: (FM.Ev && FM.Ev.staffById('s_anchor') ? 's_anchor' : (st().villagers.find(v => v.job === 'anchor') || {}).id), special: true }); };
  }
  const BREAK_TYPES = { couple: 1, breakup: 1, wedding: 1, engage: 1, baby: 1, affair: 1, triangle: 1, confess: 1, divorce: 1 };

  // 소식 탭 — 방송 보기 + 기록(얼굴)
  let nf = 'all';
  UI.pn = function (body) {
    const s = st();
    const R = s.rankings || {};
    const types = { all: '전체', couple: '💕 연애', friend: '🤝 우정', crush: '💗 짝사랑', breakup: '💔 이별', wedding: '💒 결혼', baby: '👶 육아', rel: '🎭 드라마', news: '📺 뉴스' };
    const logs = s.log.filter(e => !e.secret && (nf === 'all' || e.type === nf || (nf === 'wedding' && e.type === 'engage') || (nf === 'couple' && ['confess', 'date', 'romance'].includes(e.type)) || (nf === 'rel' && ['affair', 'triangle', 'rel', 'jealous'].includes(e.type)))).slice(-70).reverse();
    const last = s.news[s.news.length - 1];
    const rk = (arr, f) => (arr || []).map((x, i) => { const v = s.villagers.find(o => o.name === x.name); return `<span>${i + 1}. ${v ? face(v, 22) : ''} ${esc(x.name)}${f ? ` <small>${f(x)}</small>` : ''}</span>`; }).join('') || '<span class="muted">-</span>';
    body.innerHTML = `
      <button class="news-hero" id="nsPlay"><span class="tv">📺</span><span><b>친구모아 뉴스 보기</b><small>${last ? `${last.day}일차 ${last.hm} 방송${unseen() ? ` · 새 방송 ${unseen()}개` : ''}` : '첫 방송은 9시! 지금은 특별 방송'}</small></span></button>
      <button class="btn small ghost" id="nsArc" style="width:100%;margin:4px 0 8px">📼 지난 방송 다시 보기</button>
      <h4>🏆 섬 랭킹</h4>
      <div class="rank2"><div><b>👑 인싸</b>${rk(R.insider)}</div><div><b>💰 부자</b>${rk(R.rich)}</div><div><b>💘 설렘 유발자</b>${rk(R.love)}</div><div><b>💸 빚쟁이</b>${rk((R.debt || []).filter(x => x.val > 0), x => x.val)}</div></div>
      ${s.album && s.album.length ? `<h4>📸 앨범</h4><ul class="list">${s.album.map(a => `<li>${a.day}일차 · ${esc(J(a.title))} (${a.who.length}명)</li>`).join('')}</ul>` : ''}
      <h4>🗞️ 섬 소식</h4><div class="chips">${Object.entries(types).map(([k, v]) => `<button data-f="${k}" class="${nf === k ? 'on' : ''}">${v}</button>`).join('')}</div>
      <div class="log2">${logs.map(e => { const ppl = (e.who || []).map(who).filter(Boolean).slice(0, 2); return `<div class="lg ${e.imp >= 2 ? 'hi' : ''}"><div class="lg-f">${ppl.map(v => face(v, 30)).join('') || '<span class="lg-i">📰</span>'}</div><div><small>${e.day}일 ${e.hm}</small><span>${esc(e.text)}</span></div></div>`; }).join('') || '<p class="muted">아직 소식이 없어요</p>'}</div>`;
    body.querySelector('#nsPlay').onclick = () => UI.newsShow();
    body.querySelector('#nsArc').onclick = () => newsArchive();
    body.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { nf = b.dataset.f; UI.pn(body); });
  };

  // =========================================================
  // HUD — 뉴스 · 우리 집 버튼, 속보 줄
  // =========================================================
  const origInit = UI.init;
  UI.init = function () {
    const hb = $('.hud-btns');
    if (hb && !$('#btnNews')) {
      const mk = (id, t, txt) => { const b = document.createElement('button'); b.id = id; b.title = t; b.textContent = txt; hb.insertBefore(b, hb.firstChild); return b; };
      mk('btnHome', '우리 집 꾸미기 (H)', '🏠');
      mk('btnNews', '친구모아 뉴스 (N)', '📺');
    }
    if (!$('#breaking')) { const d = document.createElement('div'); d.id = 'breaking'; d.hidden = true; $('#hud').appendChild(d); }
    origInit();
    $('#btnNews').onclick = () => UI.newsShow();
    if ($('#hudTitle')) $('#hudTitle').onclick = () => UI.toTitle();
    $('#btnHome').onclick = () => UI.myHome();
    FM.bus.on('news', () => {
      paintNewsBadge();
      const s = st();
      if (s.flags.autoNews !== false && !UI.modalOpen() && !UI.editing && G().view !== 'observe' && s.speed <= 4) UI.newsShow();
      else UI.toast('📺 친구모아 뉴스가 방송됐어요! 📺 버튼으로 볼 수 있어요');
    });
    FM.bus.on('log', e => { if (e && e.imp >= 2 && !e.secret && BREAK_TYPES[e.type]) breaking(e); });
    document.addEventListener('keydown', e => {
      if (/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return;
      if (e.key === 'n' || e.key === 'N') { if (showState) closeNews(); else if (!UI.modalOpen()) UI.newsShow(); }
      if ((e.key === 'h' || e.key === 'H') && !UI.modalOpen() && !UI.editing) UI.myHome();
      if (e.key === 'Escape' && showState) closeNews();
    });
    paintNewsBadge();
    setInterval(paintNewsBadge, 2000);
    // 이어하기: 못 본 뉴스가 있으면 잠시 뒤 틀어 줌
    if (unseen()) setTimeout(() => { if (!UI.modalOpen()) UI.newsShow(); }, 2500);
  };
  // 시작(타이틀) 화면으로 돌아가기 — 저장 후 새로 불러옴
  UI.toTitle = function () {
    UI.modal('🏝️ 시작 화면으로', `<div class="tt-confirm"><div class="big">🏝️</div><p>지금까지의 섬 생활을 저장하고<br>시작 화면으로 돌아갈까요?</p>
      <div class="md-actions"><button class="btn" id="ttGo">💾 저장하고 돌아가기</button><button class="btn ghost" id="ttNo">계속 놀기</button></div></div>`, b => {
      b.querySelector('#ttNo').onclick = () => UI.closeModal();
      b.querySelector('#ttGo').onclick = () => { try { G().save(); } catch (e) { /* 무시 */ } $('#fade') && $('#fade').classList.add('on'); setTimeout(() => location.reload(), 250); };
    });
  };
  UI.myHome = function () {
    const p = st().player;
    if (UI.editing) return UI.closeEditor();
    if (p.loc !== 'home_p_in') { G().fade && G().fade(0.4); G().enterInterior('home_p_in'); }
    setTimeout(() => UI.openRoomEditor('home_p_in'), 350);
    UI.toast('🏠 우리 집 꾸미기! 가구를 끌어서 옮기고, 스타일을 한 번에 바꿀 수도 있어요');
  };

  // =========================================================
  // 3D 타이틀 화면
  // =========================================================
  let T3 = null;
  const WAVE = (c, t) => { c.armR.rotation.x = 0; c.armR.rotation.z = 2.5 + Math.sin(t * 12) * 0.35; c.head.rotation.z = 0.12; };
  const tPose = (m, c, t) => (m === 'wave' ? WAVE : FM.Anim.POSES[m] || WAVE)(c, t);
  function titleScene(cv) {
    const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'high-performance' });
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.4 : 2));
    R.outputEncoding = THREE.sRGBEncoding;
    R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xbfe6ff, 70, 150);
    const cam = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
    scene.add(new THREE.HemisphereLight(0xfff6e8, 0x7ab8d8, 0.62));
    const sun = new THREE.DirectionalLight(0xfff0d8, 0.85); sun.position.set(8, 16, 10); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14 }); scene.add(sun);
    const M = c => new THREE.MeshLambertMaterial({ color: c });
    // 바다
    const sea = new THREE.Mesh(new THREE.CircleGeometry(80, 48), new THREE.MeshLambertMaterial({ color: 0x3fb8e8 }));
    sea.rotation.x = -Math.PI / 2; sea.position.y = -0.35; scene.add(sea);
    const isle = new THREE.Group(); scene.add(isle);
    // 반짝이는 물결 고리
    const rings = [];
    for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.RingGeometry(10.6, 10.9, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })); r.rotation.x = -Math.PI / 2; r.position.y = -0.3; scene.add(r); rings.push(r); }
    const sand = new THREE.Mesh(new THREE.CylinderGeometry(10.2, 10.8, 0.7, 40), M(0xffe6b0)); sand.position.y = -0.1; sand.receiveShadow = true; isle.add(sand);
    const grass = new THREE.Mesh(new THREE.CylinderGeometry(8.6, 9.2, 0.6, 40), M(0x8fdc6f)); grass.position.y = 0.3; grass.receiveShadow = true; isle.add(grass);
    const hill = new THREE.Mesh(new THREE.SphereGeometry(3.4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M(0x7fd06a)); hill.position.set(-3.2, 0.5, -3); hill.scale.y = 0.45; hill.receiveShadow = true; isle.add(hill);
    const top = 0.6;
    // 나무
    const tree = (x, z, s, c) => {
      const g = new THREE.Group();
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.1, 8), M(0xb07a4a)); tr.position.y = 0.55; tr.castShadow = true; g.add(tr);
      for (const [dx, dy, r] of [[0, 1.45, 0.75], [0.35, 1.2, 0.5], [-0.35, 1.25, 0.5], [0, 1.95, 0.5]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), M(c)); b.position.set(dx, dy, 0); b.castShadow = true; g.add(b); }
      g.position.set(x, top + (Math.hypot(x + 3.2, z + 3) < 3 ? 0.9 : 0), z); g.scale.setScalar(s); isle.add(g);
    };
    [[-6, -4, 1.1, 0x5cc26a], [-3.3, -3.2, 1.2, 0x6fcf7a], [6.2, -3.5, 1, 0x57b865], [6.8, 2.5, 0.9, 0xffa8c8], [-7, 2.5, 0.95, 0xffb8d0], [1.5, -6.5, 1, 0x62c070], [-1.5, -6.8, 0.8, 0xffc0d8]].forEach(a => tree(...a));
    // 야자수
    const palm = (x, z, ry) => {
      const g = new THREE.Group();
      for (let i = 0; i < 5; i++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.5, 8), M(0xc89a62)); seg.position.set(i * 0.06, 0.25 + i * 0.45, 0); seg.rotation.z = -0.06 * i; seg.castShadow = true; g.add(seg); }
      for (let i = 0; i < 6; i++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 6), M(0x4cb860)); lf.scale.set(1.8, 0.18, 0.55); const a = i / 6 * Math.PI * 2; lf.position.set(0.3 + Math.cos(a) * 0.7, 2.35, Math.sin(a) * 0.7); lf.rotation.y = -a; lf.rotation.z = -0.35; lf.castShadow = true; g.add(lf); }
      g.position.set(x, 0.2, z); g.rotation.y = ry; isle.add(g);
    };
    palm(8.8, 4.5, 0.4); palm(-8.6, 5.2, 2.2); palm(9.4, -2, 1.1);
    // 집
    const house = (x, z, wall, roof, ry) => {
      const g = new THREE.Group();
      const b = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 1.8), M(wall)); b.position.y = 0.75; b.castShadow = b.receiveShadow = true; g.add(b);
      const r = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.1, 4), M(roof)); r.position.y = 2.05; r.rotation.y = Math.PI / 4; r.castShadow = true; g.add(r);
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.05), M(0x9a6a44)); d.position.set(0, 0.4, 0.92); g.add(d);
      for (const sx of [-0.6, 0.6]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.05), M(0xbfe8ff)); w.position.set(sx, 0.95, 0.92); g.add(w); }
      g.position.set(x, top, z); g.rotation.y = ry; isle.add(g);
    };
    house(3.2, -4.6, 0xfff4e0, 0xff8a7a, -0.3); house(-5.4, 0.6, 0xfff0f5, 0x7ab8ff, 1.2); house(5.6, 0.2, 0xfffbe0, 0x9ad07a, -1.3);
    // 꽃
    const fcol = [0xff7fa8, 0xffd84a, 0xffffff, 0xb08aff, 0xff9a5a];
    const fg = new THREE.SphereGeometry(0.12, 6, 5);
    for (let i = 0; i < 70; i++) { const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 6.4; const f = new THREE.Mesh(fg, M(fcol[i % fcol.length])); f.position.set(Math.cos(a) * r, top + 0.08, Math.sin(a) * r); isle.add(f); }
    // 구름
    const clouds = [];
    const cm = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x404040 });
    for (let i = 0; i < 7; i++) {
      const g = new THREE.Group();
      for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.9 + Math.random() * 0.6, 12, 8), cm); s.position.set(k * 1.1 - 1.6, Math.random() * 0.4, Math.random() * 0.6); g.add(s); }
      const a = i / 7 * Math.PI * 2; g.position.set(Math.cos(a) * 26, 11 + Math.random() * 4, Math.sin(a) * 26); g.scale.setScalar(0.9 + Math.random() * 0.6); scene.add(g); clouds.push({ g, a, r: 24 + Math.random() * 8, sp: 0.02 + Math.random() * 0.02 });
    }
    // 주민들
    const folks = [];
    for (let i = 0; i < 8; i++) {
      const look = ISLE.randomLook();
      const c = ISLE.M.character(look);
      c.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
      const mode = i < 5 ? 'walk' : ['wave', 'dance', 'cheer'][i - 5];
      const r = mode === 'walk' ? 3 + Math.random() * 3.5 : 0;
      const a0 = Math.random() * Math.PI * 2;
      if (mode !== 'walk') { const pos = [[1.2, 3.6], [-2, 3.2], [3.4, 2.4]][i - 5]; c.root.position.set(pos[0], top, pos[1]); }
      isle.add(c.root);
      folks.push({ c, mode, r, a: a0, sp: (0.18 + Math.random() * 0.12) * (Math.random() < 0.5 ? 1 : -1), t: Math.random() * 10 });
    }
    // 나 (미리보기) — 구름 받침 위
    const pv = new THREE.Group(); scene.add(pv);
    const pad = new THREE.Group();
    for (let k = 0; k < 5; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 8), cm); const a = k / 5 * Math.PI * 2; s.position.set(Math.cos(a) * 0.6, -0.15, Math.sin(a) * 0.6); s.scale.y = 0.55; pad.add(s); }
    pv.add(pad); pv.visible = false;
    let me = null;
    const setMe = look => { if (me) pv.remove(me.root); me = ISLE.M.character(look); me.root.position.y = 0.1; pv.add(me.root); };
    const resize = () => { const w = cv.clientWidth, h = cv.clientHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    window.addEventListener('resize', resize); resize();
    let t = 0, raf = 0, last = performance.now(), alive = true;
    const loop = now => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      isle.rotation.y = t * 0.08;
      const portrait = cam.aspect < 0.9;
      const dist = portrait ? 34 : 25;
      cam.position.set(0, portrait ? 15 : 11, dist); cam.lookAt(0, portrait ? -1.5 : 0.4, 0);
      rings.forEach((r, i) => { const k = ((t * 0.25 + i / 3) % 1); r.scale.setScalar(1 + k * 0.5); r.material.opacity = 0.55 * (1 - k); });
      for (const c of clouds) { c.a += c.sp * dt; c.g.position.x = Math.cos(c.a) * c.r; c.g.position.z = Math.sin(c.a) * c.r - 12; }
      for (const f of folks) {
        f.t += dt;
        if (f.mode === 'walk') {
          f.a += f.sp * dt;
          f.c.root.position.set(Math.cos(f.a) * f.r, top + Math.abs(Math.sin(f.t * 7)) * 0.03, Math.sin(f.a) * f.r);
          f.c.root.rotation.y = Math.atan2(-Math.sin(f.a) * f.sp, Math.cos(f.a) * f.sp);
          ISLE.M.animate(f.c, dt, 0.6);
        } else { ISLE.M.animate(f.c, dt, 0); f.c.root.rotation.y = Math.sin(f.t * 0.4) * 0.5; tPose(f.mode, f.c, f.t); }
      }
      if (pv.visible && me) {
        const px = portrait ? 0 : -6.2, py = portrait ? 3.2 : 1.6;
        pv.position.set(px, py + Math.sin(t * 2) * 0.12, portrait ? 12 : 9);
        pv.scale.setScalar(portrait ? 1.6 : 1.9);
        pv.rotation.y = Math.sin(t * 0.7) * 0.35 + 0.25;
        ISLE.M.animate(me, dt, 0); WAVE(me, t);
      }
      R.render(scene, cam);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return {
      setMe, showMe: on => { pv.visible = on; },
      dispose() {
        alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', resize);
        scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); });
        R.dispose(); try { R.forceContextLoss(); } catch (e) { /* 무시 */ }
      },
    };
  }

  UI.startScreen = function () {
    const el = $('#start');
    el.classList.add('title3d');
    const has = FM.G.hasSave();
    const logo = '친구모아'.split('').map((ch, i) => `<span style="--d:${i * 0.12}s">${ch}</span>`).join('') + '<br>' + '아일랜드'.split('').map((ch, i) => `<span class="b" style="--d:${0.5 + i * 0.12}s">${ch}</span>`).join('');
    el.innerHTML = `<canvas id="titleCv"></canvas>
      <div class="tt-logo"><div class="tt-leaf">🌴</div><h1>${logo}</h1><p>주민들의 우정 · 사랑 · 드라마를 지켜보는 섬 생활</p></div>
      <div class="tt-menu" id="ttMenu">
        ${has ? '<button class="tt-btn main" id="stContinue">▶ 이어하기</button>' : ''}
        <button class="tt-btn ${has ? '' : 'main'}" id="ttNew">🌱 새 섬 만들기</button>
        <div class="tt-press">${has ? '저장된 섬이 기다리고 있어요' : '나만의 섬을 만들어 보세요!'}</div>
      </div>
      <div class="tt-new" id="ttPanel" hidden>
        <h3>🏝️ 새 섬 만들기</h3>
        <label class="tt-f"><span>내 이름</span><input id="stName" maxlength="8" value="나"></label>
        <div class="tt-f"><span>내 모습</span><div class="tt-look"><button class="tt-mini" id="ttRoll">🎲 다른 모습</button><small>왼쪽에서 손 흔드는 게 나예요!</small></div></div>
        <div class="tt-f"><span>나의 성격</span><div class="tt-keys" id="ttKeys">${Object.entries(D.L1).map(([k, v], i) => `<button data-k="${k}" class="${i === 0 ? 'on' : ''}">${v.icon} ${v.name}</button>`).join('')}</div></div>
        <label class="tt-f"><span>처음 주민 수 <b id="ttCnt">30</b>명</span><input id="stCount" type="range" min="4" max="30" value="30"></label>
        <div class="tt-row"><button class="tt-btn ghost" id="ttBack">← 뒤로</button><button class="tt-btn main" id="stNew">🏝️ 섬으로 출발!</button></div>
      </div>`;
    el.hidden = false;
    try { T3 = titleScene($('#titleCv')); } catch (e) { console.warn('title3d', e); T3 = null; }
    let look = ISLE.normalizeLook(Object.assign(ISLE.randomLook(), { species: 'human' }));
    let key = Object.keys(D.L1)[0];
    const roll = () => { look = ISLE.normalizeLook(Object.assign(ISLE.randomLook(), { species: 'human' })); if (T3) T3.setMe(look); };
    if (T3) T3.setMe(look);
    const openNew = () => { $('#ttMenu').hidden = true; $('#ttPanel').hidden = false; if (T3) T3.showMe(true); };
    $('#ttNew').onclick = openNew;
    $('#ttBack').onclick = () => { $('#ttMenu').hidden = false; $('#ttPanel').hidden = true; if (T3) T3.showMe(false); };
    $('#ttRoll').onclick = roll;
    $('#stCount').oninput = e => { $('#ttCnt').textContent = e.target.value; };
    $('#ttKeys').querySelectorAll('[data-k]').forEach(b => b.onclick = () => { key = b.dataset.k; $('#ttKeys').querySelectorAll('[data-k]').forEach(x => x.classList.toggle('on', x === b)); });
    const go = fresh => {
      const opts = fresh ? { fresh: true, playerName: $('#stName').value.trim() || '나', playerLook: look, count: Math.max(4, Math.min(30, +$('#stCount').value || 12)), imported: [],
        playerKeys: { L1: key, L2: Sim.u.pick(Object.keys(D.L2)), L3: Sim.u.pick(Object.keys(D.L3)), L4: Sim.u.pick(Object.keys(D.L4)) } } : {};
      el.hidden = true; el.innerHTML = ''; $('#loading').hidden = false;
      if (T3) { T3.dispose(); T3 = null; }
      setTimeout(() => FM.G.start(opts), 50);
    };
    if ($('#stContinue')) $('#stContinue').onclick = () => go(false);
    $('#stNew').onclick = () => { if (FM.G.hasSave() && !confirm('저장된 섬을 지우고 새로 시작할까요?')) return; go(true); };
    $('#loading').hidden = true;
  };
})();
