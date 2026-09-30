/* =========================================================
 *  캐릭터 3D 관리 — 주민/스태프/방문객/플레이어 모델, 드레스코드 자동 환복,
 *  손 소품, 상태 표시(선탠 자국, 잔디, 파격 머리), 고민 풍선, 이모티콘
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, ISLE = window.ISLE, T = FM.T, PM = FM.PM;
  const H = ISLE.M.h;
  const { mat, sphere, box, cyl, mesh, geo } = H;
  const Ch = (FM.Chars = {});
  const models = new Map();
  Ch.models = models;

  const hash = s => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); };

  // ---------------------------------------------------------
  // 드레스코드 → look 변형
  // ---------------------------------------------------------
  function outfitLook(e) {
    const base = ISLE.normalizeLook(e.look || {});
    const l = Object.assign({}, base);
    const st = e.status || {};
    const o = e.outfit;
    const h = hash(e.id || e.name);
    switch (o) {
      case 'suit': Object.assign(l, { top: 'vest', shirt: [0x2f3b4e, 0x3a3a44, 0x4a3a2a][h % 3], shirt2: 0xffffff, bottom: l.top === 'dress' ? 'skirt' : 'pants', pants: 0x2f3b4e, acc: 'bowtie', accColor: 0xc0392b, pattern: 'plain' }); break;
      case 'formal': Object.assign(l, h % 2 ? { top: 'dress', shirt: [0xffc6de, 0xb69cff, 0x8fd3ff][h % 3], pattern: 'plain' } : { top: 'vest', shirt: 0x3a3a60, shirt2: 0xffffff, bottom: 'pants', pants: 0x3a3a60, pattern: 'plain', acc: 'bowtie', accColor: 0xff8fb1 }); break;
      case 'groom': case 'tux': Object.assign(l, { top: 'vest', shirt: 0x1a1a22, shirt2: 0xffffff, bottom: 'pants', pants: 0x1a1a22, acc: 'bowtie', accColor: 0x1a1a22, pattern: 'plain' }); break;
      case 'bride': Object.assign(l, { top: 'dress', shirt: 0xffffff, pattern: 'plain', hat: 'flower', hatColor: 0xffffff, acc: 'necklace', accColor: 0xffffff }); break;
      case 'swim': Object.assign(l, { top: 'tee', shirt: [0xff6f61, 0x4fc1e9, 0xffd84a, 0x8ee07a][h % 4], shirt2: 0xffffff, pattern: 'stripe2', bottom: 'shorts', pants: 0x3a7bd5, acc: 'none', hat: h % 3 ? 'none' : 'straw' }); break;
      case 'hanbok': Object.assign(l, { top: 'dress', shirt: [0xff8fb1, 0x8fd3ff, 0xffd84a][h % 3], shirt2: 0xffffff, pattern: 'plain', acc: 'bowtie', accColor: 0xc0392b }); break;
      case 'prisoner': Object.assign(l, { top: 'tee', shirt: 0xffffff, shirt2: 0x2b2b30, pattern: 'stripe', bottom: 'pants', pants: 0x2b2b30, hat: 'none', acc: 'none' }); break;
      case 'worker': Object.assign(l, { top: 'vest', shirt: 0xff8a24, shirt2: 0x55595f, bottom: 'pants', pants: 0x3a5a8a, hat: 'none', pattern: 'plain' }); break;
      case 'diving': Object.assign(l, { top: 'hoodie', shirt: 0x2f4b6e, pattern: 'plain', hat: 'none' }); break;
      case 'space': Object.assign(l, { top: 'hoodie', shirt: 0xf4f6f8, pattern: 'plain', bottom: 'pants', pants: 0xf4f6f8, hat: 'none' }); break;
      case 'wrestler': Object.assign(l, { top: 'tee', shirt: 0xc0392b, shirt2: 0xffd23a, pattern: 'star', bottom: 'shorts', pants: 0xc0392b, hat: 'none' }); break;
      case 'robe': Object.assign(l, { top: 'sweater', shirt: 0xffffff, pattern: 'plain', bottom: 'none', hat: 'none' }); break;
      case 'knit': Object.assign(l, { top: 'sweater', shirt: 0xe8dcc8, shirt2: 0x8a5a3b, pattern: 'snow' }); break;
      case 'retro': Object.assign(l, { top: 'aloha', shirt: 0xc0392b, shirt2: 0xffd84a, pattern: 'stripe2', glasses: 'round' }); break;
      case 'baker': Object.assign(l, { top: 'apron', shirt: 0xffffff, shirt2: 0xffc6de, hat: 'none' }); break;
      case 'leather': Object.assign(l, { top: 'hoodie', shirt: 0x2b2b30, pattern: 'plain', glasses: 'sun', hat: 'crown', hatColor: 0xffd23a, acc: 'necklace', accColor: 0xffd23a }); break;
      case 'patient': Object.assign(l, { top: 'tee', shirt: 0xdff0ff, shirt2: 0x8fb8e8, pattern: 'stripe', bottom: 'pants', pants: 0xdff0ff, hat: 'none', acc: 'none' }); break;
      case 'uniform': Object.assign(l, { top: 'vest', shirt: 0x2f4b6e, shirt2: 0xffffff, bottom: 'skirt', pants: 0x2f4b6e, acc: 'bowtie', accColor: 0xc0392b, pattern: 'plain' }); break;
      case 'couple': { const c = [0xff8fb1, 0x8fd3ff, 0xffd84a][(e.coupleHue || 0) % 3]; Object.assign(l, { top: 'tee', shirt: c, shirt2: 0xffffff, pattern: 'heart' }); break; }
    }
    if (st.hatOverride && !['swim', 'bride', 'space', 'diving', 'worker'].includes(o)) { l.hat = st.hatOverride; l.hatColor = [0xff6f61, 0x8fd3ff, 0xffd84a, 0xb69cff][h % 4]; }
    if (st.hatGone) l.hat = 'none';
    if (st.hair === 'neon' && l.species === 'human') l.hair = 0x39ff14;
    if (st.hair === 'shaved' && l.species === 'human') { l.hair = l.skin; l.hat = 'none'; l.hairStyle = 'short'; }
    return l;
  }
  Ch.outfitLook = outfitLook;

  // ---------------------------------------------------------
  // 덧입히는 소품 (안전모, 잠수모, 우주 헬멧, 면사포, 튜브, 벨트 ...)
  // ---------------------------------------------------------
  function overlays(c, e) {
    const st = e.status || {};
    const o = e.outfit;
    const g = new THREE.Group();
    const head = c.head;
    const top = 0.4;
    if (o === 'worker' || st.hardhat) { const hh = new THREE.Group(); hh.add(mesh(geo('hardhat', () => new THREE.SphereGeometry(0.45, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2)), mat(0xffd23a))); hh.add(mesh(cyl(0.52, 0.52, 0.04, 20), mat(0xffd23a), 0, 0.02, 0.05)); hh.position.set(0, top - 0.12, -0.02); head.add(hh); }
    if (o === 'diving') { const hl = mesh(sphere(0.62), PM.glassMat(0xbfe8ff)); hl.castShadow = false; head.add(hl); head.add(mesh(geo('dring', () => new THREE.TorusGeometry(0.42, 0.07, 8, 20)), mat(0xd9b44a), 0, -0.42, 0).rotateX(Math.PI / 2)); }
    if (o === 'space') { const hl = mesh(sphere(0.64), PM.glassMat(0xe8f6ff)); hl.castShadow = false; head.add(hl); c.body.add(mesh(box(0.3, 0.3, 0.16, 0.05), mat(0xdfe6f0), 0, 0.3, -0.26)); }
    if (o === 'bride') { const veil = mesh(geo('veil', () => new THREE.ConeGeometry(0.55, 1.1, 16, 1, true)), new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide }), 0, -0.05, -0.12); veil.castShadow = false; head.add(veil); }
    if (o === 'swim' && hash(e.id) % 2 === 0 || e.status && e.status.tube) { const tb = mesh(geo('tube', () => new THREE.TorusGeometry(0.33, 0.1, 10, 24)), mat([0xff6f61, 0xffd84a, 0x4fc1e9][hash(e.id) % 3]), 0, 0.18, 0); tb.rotation.x = Math.PI / 2; c.body.add(tb); }
    if (o === 'wrestler') { const belt = mesh(geo('wbelt', () => new THREE.TorusGeometry(0.27, 0.05, 8, 24)), mat(0xffd23a), 0, 0.15, 0); belt.rotation.x = Math.PI / 2; c.body.add(belt); head.add(mesh(box(0.72, 0.18, 0.2, 0.05), mat(0xc0392b), 0, 0.02, 0.36)); }
    if (o === 'robe') { const belt = mesh(geo('rbelt', () => new THREE.TorusGeometry(0.27, 0.03, 8, 24)), mat(0x8fd3ff), 0, 0.22, 0); belt.rotation.x = Math.PI / 2; c.body.add(belt); }
    if (o === 'baker') { const hat = new THREE.Group(); hat.add(mesh(cyl(0.28, 0.25, 0.3), mat(0xffffff), 0, 0.15, 0)); hat.add(mesh(sphere(0.3), mat(0xffffff), 0, 0.4, 0)); hat.position.set(0, top, -0.03); head.add(hat); }
    if (o === 'hanbok') { const r = mesh(box(0.08, 0.28, 0.03, 0.02), mat(0xc0392b), 0.08, 0.34, 0.25); r.rotation.z = 0.3; c.body.add(r); }
    if (o === 'prisoner') c.body.add(mesh(box(0.2, 0.1, 0.02, 0.01), mat(0xffffff), 0.1, 0.36, 0.27));
    if (o === 'pajama' || (e.act && e.act.id === 'sleep' && !e.child)) { const nc = mesh(geo('nightcap2', () => new THREE.ConeGeometry(0.28, 0.6, 12)), mat(0x8fd3ff), 0.05, top + 0.2, -0.05); nc.rotation.z = -0.5; head.add(nc); }
    // 파격 머리 (동물): 형광 초록 모히칸
    if (st.hair === 'neon' && e.look && e.look.species !== 'human') for (let i = 0; i < 5; i++) head.add(mesh(geo('mohawk', () => new THREE.ConeGeometry(0.07, 0.3, 6)), mat(0x39ff14), 0, top + 0.08, 0.2 - i * 0.12).rotateX(-0.3 + i * 0.1));
    // 이상한 선탠 자국 (선글라스 모양 / 별 모양)
    if (st.tanUntil) {
      const tanM = new THREE.MeshBasicMaterial({ color: 0xfff4e6, transparent: true, opacity: 0.85, depthWrite: false });
      if (st.tanShape === 'star') { const s = mesh(geo('tanStar', () => { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.05 : 0.12, a = i / 10 * Math.PI * 2; if (i === 0) sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); else sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); } return new THREE.ShapeGeometry(sh); }), tanM, 0.14, 0.03, 0.44); s.castShadow = false; head.add(s); }
      else for (const x of [-0.14, 0.14]) { const s = mesh(geo('tanC', () => new THREE.CircleGeometry(0.11, 16)), tanM, x, 0.02, 0.445); s.castShadow = false; head.add(s); }
      c.body.traverse(m => { if (m.isMesh && m.material && m.material.color && !m.userData.tanDone) { m.userData.tanDone = true; } });
    }
    // 잔디 묻음 (3일간)
    if (st.grassUntil) for (let i = 0; i < 8; i++) c.body.add(mesh(sphere(0.035), mat(0x4fae4a), (Math.random() - 0.5) * 0.45, 0.1 + Math.random() * 0.35, 0.22 + Math.random() * 0.05));
    return g;
  }

  // ---------------------------------------------------------
  // 풍선 스프라이트 (고민 풍선 / 이모티콘)
  // ---------------------------------------------------------
  const BCOL = { pink: '#ff8fc8', red: '#ff4d4d', purple: '#9a6bff', gray: '#b0b8c4', yellow: '#ffd84a', orange: '#ffa64d' };
  function balloonTex(kind, color, big) {
    return PM.ctex(`bal:${kind}:${color}:${big}`, 128, 128, (g) => {
      g.fillStyle = BCOL[color] || '#ffffff';
      // 생각 풍선 (보라색은 찌그러진 모양)
      g.beginPath();
      if (color === 'purple') { g.moveTo(20, 60); g.quadraticCurveTo(30, 10, 64, 22); g.quadraticCurveTo(110, 8, 108, 60); g.quadraticCurveTo(118, 100, 70, 96); g.quadraticCurveTo(22, 104, 20, 60); }
      else g.ellipse(64, 56, 50, 42, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath(); g.arc(40, 104, 9, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(28, 120, 5, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffffff'; g.font = 'bold 62px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const icon = { crush: '!', crushP: '💗', jealous: '!', bored: '!', reunion: '!', marry: '💍', secret: '🤫', capsule: '⏳', errand: '📦', kid: '!', think: '💭' }[kind] || '!';
      g.fillText(icon, 64, 58);
    });
  }
  const emojiTex = e => FM.W.emojiTex(e);

  // ---------------------------------------------------------
  // 모델 생성 / 갱신
  // ---------------------------------------------------------
  function modelKey(e) {
    const s = e.status || {};
    return JSON.stringify([e.look, e.outfit, s.hatOverride, s.hatGone, s.hair, !!s.tanUntil, s.tanShape, !!s.grassUntil, !!s.hardhat, e.child && e.child.stage, e.act && e.act.id === 'sleep', e.coupleHue, e.status && e.status.tube]);
  }
  function build(e) {
    const look = outfitLook(e);
    const c = ISLE.M.character(look);
    overlays(c, e);
    const scale = e.child ? { BABY: 0.45, TODDLER: 0.58, CHILD: 0.76 }[e.child.stage] : 1;
    const hf = e.child && e.child.dna ? e.child.dna.phenotype.height_factor || 1 : 1;
    c.root.scale.setScalar(scale * hf * (c.size || 1));
    const bal = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true }));
    bal.scale.set(0.9, 0.9, 1); bal.position.y = 1.85; bal.visible = false; bal.renderOrder = 20;
    c.root.add(bal);
    const emo = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true }));
    emo.scale.set(0.65, 0.65, 1); emo.position.set(0.45, 1.6, 0); emo.visible = false; emo.renderOrder = 21;
    c.root.add(emo);
    c.root.userData.entity = e.id;
    c.root.traverse(o => { if (o.isMesh) o.userData.entity = e.id; });
    return { c, key: modelKey(e), bal, emo, balKey: null, emoKey: null, prop: null, propName: null, poseT: 0, lastPose: null, scene: null };
  }

  function setProp(m, name) {
    if (m.propName === name) return;
    if (m.prop) { m.prop.parent && m.prop.parent.remove(m.prop); m.prop = null; }
    m.propName = name;
    if (!name) return;
    const p = PM.prop(name);
    if (!p) return;
    p.position.set(0.08, -0.22, 0.08);
    m.c.armR.add(p);
    m.prop = p;
  }

  // ---------------------------------------------------------
  // 매 프레임 동기화
  // ---------------------------------------------------------
  // viewLoc: 'island' | 실내 id. entities: 표시할 대상 목록
  Ch.sync = function (entities, viewLoc, sceneObj, dt, opts = {}) {
    const st = FM.Sim.get();
    const seen = new Set();
    for (const e of entities) {
      const loc = e.loc;
      if (loc !== viewLoc) continue;
      if (opts.cullFrom && Math.hypot(e.x - opts.cullFrom.x, e.z - opts.cullFrom.z) > (opts.cullR || 90)) continue;
      seen.add(e.id);
      let m = models.get(e.id);
      const key = modelKey(e);
      if (m && m.key !== key) { m.c.root.parent && m.c.root.parent.remove(m.c.root); models.delete(e.id); m = null; }
      if (!m) { m = build(e); models.set(e.id, m); }
      if (m.scene !== sceneObj) { m.c.root.parent && m.c.root.parent.remove(m.c.root); sceneObj.add(m.c.root); m.scene = sceneObj; }
      const r = m.c.root;
      // 위치
      let y;
      if (viewLoc === 'island') y = T.groundY(e.x, e.z);
      else y = (opts.floorY || 0) + (FM.levelY ? FM.levelY(loc, e.x, e.z) : 0);   // 복층 · 계단 높이
      if (e.act && e.act.y) y += e.act.y;
      if (e.status && e.status.floatUntil && e.status.floatUntil > st.time) y += 1 + Math.sin(st.realT * 2) * 0.2;
      if (opts.spaceFloat) y += 0.35 + Math.sin(st.realT * 1.5 + e.x) * 0.25;        // 우주 기지 세트: 중력 50% 감소
      if (e.loc === 'island' && e.z > 97 && e.pose === 'tubeHelp') y = 0.1;
      r.position.set(e.x, y, e.z);
      // 방향 (부드럽게)
      let ry = e.ry || 0;
      if (e.watching) { const t = e.watching === 'P' ? st.player : FM.Sim.byId(e.watching); if (t && t.loc === e.loc && e.act && ['crush_watch', 'glare'].includes(e.act.id)) ry = Math.atan2(t.x - e.x, t.z - e.z); }
      let d = ry - r.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
      r.rotation.y += d * Math.min(1, dt * 10);
      // 리셋 후 기본 애니메이션 + 포즈
      const c = m.c;
      c.body.rotation.set(0, 0, 0); c.body.position.set(0, 0, 0); c.legL.rotation.z = 0; c.legR.rotation.z = 0;
      const moving = !!e.moving;
      const spd = moving ? (e.run || e.state === 'RUN' ? 1.2 : 0.6 * Math.min(1.5, Math.max(0.6, (1 + ((e.stats && e.stats.speed) || 0) / 100)))) : 0;
      ISLE.M.animate(c, dt * (moving ? Math.min(3, FM.Sim.get().speed) ** 0.3 : 1), spd);
      const pose = moving ? null : (e.pose || null);
      if (pose !== m.lastPose) { m.poseT = 0; m.lastPose = pose; }
      m.poseT += dt;
      c.rs = r.scale.y; c.hh = c.look.height || 1; c.ww = c.look.width || 1;
      c.seatH = !moving && e.act && e.act.seatH || 0;
      c.bed = !moving && e.act && e.act.bed || null;
      c.lieOn = !moving && e.act && e.act.lie || null;
      if (!moving) FM.Anim.apply(c, e, m.poseT);
      else if ((c.blanket && c.blanket.visible) || (c.shape && c.shape.rotation.y)) FM.Anim.apply(c, {}, 0);
      // 짝사랑 시선 고정 (Head Tracking): 몸은 딴 곳, 고개는 대상 주민
      if (e.crush && e.crush.target && !moving) { const t = e.crush.target === 'P' ? st.player : FM.Sim.byId(e.crush.target); if (t && t.loc === e.loc && Math.hypot(t.x - e.x, t.z - e.z) < 10) { let a = Math.atan2(t.x - e.x, t.z - e.z) - r.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); c.head.rotation.y = Math.max(-1.3, Math.min(1.3, a)); } }
      // 손 소품
      let prop = e.prop || null;
      if (!prop && e.status && e.status.mimicProp && e.child) prop = e.status.mimicProp === 'dumbbell' ? 'kid_dumbbell' : e.status.mimicProp;
      setProp(m, prop);
      // 손잡기
      if (e.hand) { c.armR.rotation.z = 0.4; c.armR.rotation.x = -0.3; }
      // 풍선
      const b = e.balloon;
      const bk = b ? b.kind + b.color + (b.data && b.data.big ? 'big' : '') : null;
      if (bk !== m.balKey) {
        m.balKey = bk; m.bal.visible = !!b;
        if (b) { m.bal.material.map = balloonTex(b.kind, b.color, b.data && b.data.big); m.bal.material.needsUpdate = true; const s = b.data && b.data.big ? 1.4 : 0.9; m.bal.scale.set(s, s, 1); }
      }
      if (b) m.bal.position.y = 2.05 + Math.sin(st.realT * 3) * 0.06;
      const em = e.emote && e.emote.until > st.realT ? e.emote.e : null;
      if (em !== m.emoKey) { m.emoKey = em; m.emo.visible = !!em; m.emoT = 0; if (em) { m.emo.material.map = emojiTex(em); m.emo.material.needsUpdate = true; } }
      // 이모티콘에 맞춘 감정 몸짓 (장면 포즈가 없을 때)
      if (em && !moving && !(e.pose && e.sceneId)) { m.emoT = (m.emoT || 0) + dt; FM.Anim.POSES._emoGesture(c, em, m.emoT); }
      if (em) m.emo.position.y = 1.78 + Math.sin(st.realT * 5) * 0.05;
      // 표정: 이모티콘 > 포즈 > 대화 중 리액션 > 기분에 따른 잔잔한 표정 변화
      if (ISLE.M.setExpr) {
        let ex = em ? FM.Anim.exprOfEmoji(em) : null;
        if (!ex) { const pe = FM.Anim.exprOfPose(pose || (e.act && e.act.id)); if (pe !== undefined) ex = pe; else {
          m.exprT = (m.exprT || 0) - dt;
          if (m.exprT <= 0) {
            const talking = e.state === 'TALK_NPC' || e.state === 'TALK' || (e.act && /chat|talk|gossip/.test(e.act.id || ''));
            const md = e.mood !== undefined ? e.mood : 70, dep = e.depression || 0, str = e.stress || 0;
            const pool = talking ? ['happy', 'laugh', 'smile', 'surprised', 'awkward', null, 'shy', 'smug']
              : md > 75 ? [null, null, null, 'smile', 'smile', 'happy', 'laugh']
              : md > 45 ? [null, null, null, null, 'smile', 'happy', str > 40 ? 'worried' : 'smile', 'sleepy']
              : [null, 'sad', 'worried', dep > 50 ? 'despair' : 'pout', str > 60 ? 'angry' : 'sad'];
            if (e.crush && e.crush.target && Math.random() < 0.3) pool.push('shy', 'love');
            m.baseExpr = pool[Math.floor(Math.random() * pool.length)];
            m.exprT = talking ? 1.8 + Math.random() * 2.2 : 5 + Math.random() * 10;
          }
          ex = m.baseExpr || null;
        } }
        ISLE.M.setExpr(c, ex);
      }
      r.visible = !(e.child && e.child.stage === 'BABY' && viewLoc === 'island') && !(Ch.hidden && Ch.hidden.has(e.id));
    }
    // 보이지 않게 된 모델 정리
    for (const [id, m] of models) {
      if (seen.has(id)) continue;
      if (m.c.root.parent) m.c.root.parent.remove(m.c.root);
      m.scene = null;
    }
  };
  Ch.get = id => models.get(id);
  Ch.headPos = function (id, out) {
    const m = models.get(id);
    if (!m || !m.c.root.parent) return null;
    out = out || new THREE.Vector3();
    m.c.head.getWorldPosition(out);
    out.y += 0.55 * m.c.root.scale.y;
    return out;
  };
  Ch.dispose = id => { const m = models.get(id); if (m && m.c.root.parent) m.c.root.parent.remove(m.c.root); models.delete(id); };
  Ch.invalidate = id => { const m = models.get(id); if (m) m.key = '__'; };
  FM.bus.on('outfit', v => Ch.invalidate(v.id));
})();
