/* =========================================================
 * 🎬 메인 드라마: 은비와 오래된 축제의 기록
 * - 개인 스토리 데이터와 분리된 진행형 미스터리
 * - 기존 주민 관계 시뮬레이션(drama.js)은 유지하고, 메인 연출만 담당
 * ========================================================= */
(() => {
  'use strict';
  const FM = window.FM, Sim = FM.Sim, Soc = FM.Soc, Cut = FM.Cut;
  if (!FM.MAIN_STORY || !Sim || !Soc || !Cut) return;
  const MD = FM.MainDrama = {};
  const S = () => Sim.get();
  const day = () => Sim.time.day();
  const byCast = id => S().villagers.find(v => v.castId === id || v.id === id);
  const nm = id => (byCast(id) || {}).name || id;
  const castFor = ids => ids.map(byCast).filter(Boolean);
  const totalPersonalEpisodes = () => Object.values(S().story || {}).reduce((n, st) => n + Math.min(5, st.ep || 0), 0);
  const state = () => {
    const s = S();
    s.mainDrama = s.mainDrama || { completed: [], groupCompleted: [], choice: {}, lastDay: -1 };
    s.mainDrama.groupCompleted = s.mainDrama.groupCompleted || [];
    return s.mainDrama;
  };
  const unlocks = [
    () => totalPersonalEpisodes() >= 3,
    () => totalPersonalEpisodes() >= 8,
    () => totalPersonalEpisodes() >= 15,
    () => totalPersonalEpisodes() >= 24,
    () => totalPersonalEpisodes() >= 32 && ((S().story || {})[byCast('c07') && byCast('c07').id] || {}).ep >= 4,
  ];
  const venue = id => {
    const m = FM.MAP && FM.MAP.P && FM.MAP.P[id];
    if (m && m.interior && FM.INTERIORS && FM.INTERIORS[m.interior]) return { loc: m.interior };
    return m ? { loc: 'island', x: m.x, z: m.z + 2, place: id } : { loc: 'island', x: 3, z: 19, place: 'plaza' };
  };
  const titleChoices = (ep) => ([
    ['📣 원본을 공개한다', '🕵️ 당사자를 먼저 찾는다'],
    ['🖼️ 사진을 공개한다', '🗣️ 증언을 더 모은다'],
    ['📚 기록을 복원한다', '🏠 가족에게 먼저 묻는다'],
    ['🎆 축제 재현을 진행한다', '🛟 안전 기록을 먼저 공개한다'],
    ['📢 모두에게 진실을 알린다', '🕊️ 은비가 말할 시간을 기다린다'],
  ][ep] || ['계속 조사한다', '잠시 멈추고 생각한다']);
  const question = ep => ([
    '곰인형 안쪽에서 오래된 축제 초대장이 나왔어. 어떻게 할까?',
    '사진에서 지워진 사람을 발견했어. 어디부터 확인할까?',
    '명단에서 사라진 이름이 있어. 누구의 방식으로 진실을 찾을까?',
    '축제 마지막 밤의 무전 기록이 끊겨 있어. 축제를 먼저 재현할까?',
    '이제 기록이 거의 맞춰졌어. 은비가 진실을 말할 준비가 될 때까지 기다릴까?',
  ][ep] || '다음 단서를 어떻게 다룰까?');
  function episode(ep, choice) {
    const data = FM.MAIN_STORY[ep], actors = castFor(data.cast);
    if (!data || !actors.length) return null;
    const A = actors[0], B = actors[1] || actors[0], C = actors[2] || actors[1] || actors[0];
    const selected = titleChoices(ep)[choice === 'second' ? 1 : 0];
    const scenes = [
      {
        opening:'INT. 은비의 방 — 밤. 창문이 바람에 흔들리고, 책상 위 곰인형의 한쪽 귀가 실밥만 남긴 채 벌어져 있다.',
        sound:'시계 초침 세 번. 바람. 천이 찢어지는 작은 소리.',
        a:'이 안에… 왜 축제 초대장이 들어 있었지? 엄마는 이 인형을 절대 버리지 말라고 했어. 이유는 한 번도 말해 주지 않았고.',
        b:'초대장 뒷면에 글씨가 있어. 날짜도 이상해. 축제가 열리기 전날이야.',
        c:'잠깐. 이 도장은 옛 축제 운영본부에서만 쓰던 거야. 그냥 기념품이 아니야.',
        turn:'누군가 이걸 은비에게 남긴 걸까, 아니면 은비가 기억하지 못하는 밤에 직접 숨긴 걸까?',
        final:'이 기록을 공개하면 단서는 빨리 모일 거야. 하지만 누군가의 기억까지 허락 없이 꺼내 놓게 될 수도 있어.'
      },
      {
        opening:'INT. 오래된 사진관 — 늦은 오후. 현상액 속 사진이 천천히 떠오른다. 웃고 있는 주민들 사이에, 종이처럼 하얗게 비어 있는 자리가 있다.',
        sound:'물방울. 확대기의 스위치. 사진이 트레이에 닿는 소리.',
        a:'사진이 망가진 게 아니야. 여기만 누군가 긁어냈어. 얼굴이 아니라… 이름표가 있던 자리까지.',
        b:'벽화 밑에서 찾은 이름과 사진 뒷면의 날짜가 같아. 그날 무슨 일이 있었는지 아무도 같은 말을 하지 않아.',
        c:'사진을 보면 다들 행복해 보여. 그래서 더 이상해. 누군가 사라졌는데도, 사진 속 축제는 완벽하게 웃고 있어.',
        turn:'사진을 세상에 먼저 보여 주면 증언이 쏟아질 것이다. 하지만 가장 큰 소리를 내는 사람이 반드시 진실을 말하는 건 아니다.',
        final:'우리는 진실을 찾는 중일까, 아니면 모두가 믿고 싶어 하는 이야기를 만들고 있는 걸까?'
      },
      {
        opening:'INT. 마을 기록 보관실 — 비 오는 저녁. 오래된 종이들이 책상 위에 펼쳐져 있다. 명단에는 번호가 마흔 개뿐인데, 마지막 줄에는 지워진 자국이 남아 있다.',
        sound:'빗방울. 종이 넘기는 소리. 형광등의 낮은 진동.',
        a:'이 명단은 다시 쓴 거야. 잉크가 달라. 원본에서 이름 하나를 지운 뒤, 번호까지 맞춰 고친 것 같아.',
        b:'가족에게 물으면 답을 얻을 수도 있겠지. 하지만 그 질문 하나가 오래 덮어 둔 일을 다시 끌어낼 수도 있어.',
        c:'명단에 이름이 없다고 해서 그 사람이 없었던 건 아니야. 우리가 기록하지 않았다는 뜻일 수도 있어.',
        turn:'누구에게 먼저 물을 것인가. 기록을 믿을 것인가, 기억을 믿을 것인가. 둘 다 틀릴 수 있다는 생각은 누구도 하고 싶어 하지 않는다.',
        final:'사라진 이름을 되찾는 일은 종이에 글자를 쓰는 것보다 훨씬 어려웠다. 그 이름을 부를 용기가 필요했다.'
      },
      {
        opening:'EXT. 부두 — 폭풍이 오기 직전. 오래된 무전기에서 잡음이 터진다. 파도는 방파제를 넘고, 축제 깃발은 거꾸로 매달려 있다.',
        sound:'무전 잡음. 바람. 갑자기 끊기는 신호.',
        a:'기록에는 대피 명령을 내렸다고 되어 있어. 그런데 이 시간의 무전은… 아무 말도 없어.',
        b:'그날 밤 내가 기억하는 건 불꽃놀이가 아니야. 누군가 계속 “아직 한 사람이 안 왔다”고 외쳤어.',
        c:'축제를 다시 열어 같은 순서를 재현하면, 기록이 틀린 부분을 찾을 수 있어. 하지만 위험까지 재현해선 안 돼.',
        turn:'불꽃을 다시 올리면 그날의 장면이 되살아날 것이다. 안전 기록을 먼저 공개하면 축제는 멈출지도 모른다. 어느 쪽도 가벼운 선택은 아니다.',
        final:'축제는 사람들을 모으기 위해 시작됐다. 그날 밤, 우리는 사람을 지키는 일이 축제보다 먼저라는 사실을 잊지 말아야 했다.'
      },
      {
        opening:'EXT. 축제 광장 — 해 질 무렵. 아직 켜지지 않은 등불들이 바람에 흔들린다. 은비는 무대 뒤에서 객석을 바라본다. 모두가 기다리고 있지만, 누구도 재촉하지 않는다.',
        sound:'군중의 웅성임이 천천히 사라진다. 한 번의 깊은 숨. 멀리서 파도.',
        a:'다들 내가 기억을 되찾기만 하면 모든 게 끝날 거라고 생각하지? 나도 그랬어. 그런데 기억은 퍼즐처럼 맞추면 끝나는 게 아니더라.',
        b:'우리가 찾은 기록은 네가 말해야 한다는 증거가 아니야. 네가 말하고 싶을 때, 네 말을 믿을 준비를 하려고 모은 거야.',
        c:'진실을 공개하면 누군가는 화낼 거야. 누군가는 우리가 왜 이제야 말하냐고 묻겠지. 그래도 이번엔 네가 혼자 그 질문을 받게 두지 않을게.',
        turn:'기억을 모두에게 알리는 것은 용기일 수 있다. 침묵할 시간을 지켜 주는 것 역시 용기일 수 있다. 어느 쪽이든 은비의 선택이어야 한다.',
        final:'오래된 축제의 마지막 빈칸은 기록으로 채울 수 없었다. 그곳에 설 사람의 목소리가 필요했다.'
      }
    ];
    const scene = scenes[ep];
    const beats = [
      { filter: ep === 0 || ep === 2 ? 'sepia' : 'thriller' },
      { narr: scene.opening, who:'해설', icon:'🎬', shot:['wide'] },
      { narr: '('+scene.sound+')', who:'해설', icon:'🔊' },
      { show:'A' }, { move:['A',0.6,0.1],t:1100 }, { pose:'A',p:'look',t:900 },
      { say:'A',text:scene.a,shot:'close' },
      { narr:'(컷. 대답은 바로 돌아오지 않는다. 카메라는 말하는 사람 대신 듣고 있는 사람의 얼굴에 머문다.)',who:'해설',icon:'…',shot:['wide'] },
      { show:'B' }, { move:['B',1.1,-0.2],t:1000 }, { say:'B',text:scene.b,shot:'close' },
      { filter:'' },
      ...(actors.length>2 ? [
        { show:'C' },{ move:['C',1.7,0.25],t:1100 },{ say:'C',text:scene.c,shot:'close' }
      ] : [{ say:'A',text:'그럼 우리가 알고 있다고 믿었던 이야기는 처음부터 반쪽짜리였던 거네.' }]),
      { narr:'(빠른 몽타주. 낡은 종이의 찢긴 모서리, 흐릿한 사진, 젖은 무전기, 축제 깃발. 각각의 이미지가 한 박자씩 겹친다.)',who:'해설',icon:'🎞️',shot:['wide'] },
      { fx:'shock' }, { say:'A',text:scene.turn,hot:true },
      { say:'B',text:choice==='second'?'기록을 찾는다고 해서 사람을 몰아붙일 권리까지 생기는 건 아니야. 우리가 지켜야 할 선을 정하자.':'계속 덮어 두면 또 같은 일이 생길 수 있어. 이번엔 우리가 본 것을 책임 있게 남기자.' },
      { narr:'(모두가 서로를 바라본다. 누구도 즉시 고개를 끄덕이지 않는다. 그 망설임까지 장면 안에 남는다.)',who:'해설',icon:'🕯️' },
      { poses:actors.slice(0,3).map((v,i)=>[String.fromCharCode(65+i),'look']),t:1500 },
      { say:'C',text:scene.final },
      { filter:ep===4?'':'sepia' },{ fx:ep===4?'fireworks':'glow' },
      { narr:ep===4?'(등불 하나가 켜진다. 곧 옆의 등불도 켜지지만, 카메라는 군중 대신 은비의 얼굴에 머문다.)':'(카메라는 단서 위에서 천천히 물러난다. 답은 하나 더 가까워졌지만, 다음 질문이 남아 있다.)',who:'해설',icon:'🌌',shot:['wide'] },
      { outcome:'happy',endText:['🎬 '+data.title,ep===4?(choice==='second'?'은비가 말할 시간을 지켜 주며, 진실의 문을 열어 두었다.':'은비의 목소리로 오래된 축제의 진실을 세상에 전했다.'):'단서가 이어졌다. 다음 장면은 우리가 어떤 사람으로 남을지 묻고 있다.'] }
    ];
    const c = { theme: ep === 4 ? 'party' : 'reunion', cast: { A, B, ...(actors[2] ? { C } : {}) }, beats,
      key: 'mainDrama|' + data.id, vig: true, force: true, sub: data.title, venue: venue(data.cast[0]) };
    c.resolve = () => {
      const st = state();
      if (!st.completed.includes(data.id)) st.completed.push(data.id);
      st.choice[data.id] = choice || 'first';
      st.lastDay = day();
      if (A && B && A.id !== B.id) {
        Soc.addFriend(A.id, B.id, 5, 5, '축제 미스터리');
        Soc.addFriend(B.id, A.id, 5, 5, '축제 미스터리');
      }
      Sim.log('friend', '🎬 ' + data.title + ' — ' + selected, actors.map(v => v.id), 3, { newsKind: 'drama' });
      if (ep === 4) { st.ending = choice === 'second' ? 'gentle' : 'open'; }
    };
    return c;
  }
  MD.progress = () => ({ completed: state().completed.slice(), total: FM.MAIN_STORY.length, next: FM.MAIN_STORY.findIndex((d, i) => !state().completed.includes(d.id) && unlocks[i]()) });
  MD.ready = () => {
    const next = MD.progress().next;
    return next >= 0 && next < FM.MAIN_STORY.length && state().lastDay !== day();
  };
  MD.start = (ep, choice) => {
    const c = episode(ep, choice || 'first');
    if (c) Cut.enqueue(c, true);
    return !!c;
  };
  const groupThresholds = [2,4,6,8,10,12,14,16,18,20];
  const nextGroup = () => FM.GROUP_DRAMA.findIndex((g, i) => !state().groupCompleted.includes(g.id) && totalPersonalEpisodes() >= groupThresholds[i]);
  function groupEpisode(g, choice) {
    const actors = castFor(g.cast).slice(0, 4);
    if (!g || !actors.length) return null;
    const labels = { '협력':'이번엔 누가 더 잘하느냐보다 어떻게 힘을 합칠지가 중요해.', '라이벌과 팀워크':'경쟁은 하되, 서로를 망가뜨리지 않는 방법을 찾아 보자.', '무대와 우정':'실수해도 서로의 무대를 끝까지 지켜 주자.', '생태와 돌봄':'섬을 지키는 일은 이곳에 사는 사람을 지키는 일이기도 해.', '실패와 협력':'혼자 완벽하게 하려 하지 말고, 서로 부족한 곳을 채우자.', '미스터리':'서로 본 것이 달라도, 함께 확인하면 사실에 가까워질 수 있어.', '신뢰':'누군가에게 맡기는 것도 책임의 일부야.', '기억과 표현':'기억을 남길 때는 그 안에 있는 사람의 이름도 남기자.', '돌봄':'늘 남을 챙기는 사람에게도 쉴 자리가 필요해.', '공동체의 선택':'축제는 한 사람의 무대가 아니라 섬 전체가 함께 고르는 이야기야.' };
    const cast = { A: actors[0], B: actors[1] || actors[0], ...(actors[2] ? { C: actors[2] } : {}), ...(actors[3] ? { D: actors[3] } : {}) };
    const beats = [
      { narr: '(축제 준비가 한창인 가운데, 서로 다른 생각을 가진 주민들이 한자리에 모였다)', who:'해설', icon:'🎪', shot:['wide'] },
      { show:'A' }, { say:'A', text: labels[g.theme] || '우리끼리만 해결하려 하지 말고, 서로 이야기를 들어 보자.' },
      { show:'B' }, { move:['B',1.2,0.2], t:800 }, { say:'B', text: choice === 'second' ? '잠깐 멈추고 서로의 사정을 먼저 듣자. 급하게 정하면 놓치는 게 있어.' : '좋아, 각자 할 수 있는 일을 나눠서 바로 시작하자!' },
      ...(actors[2] ? [{ show:'C' }, { say:'C', text:'나도 도울게. 혼자서는 보이지 않던 방법이 떠올랐어.' }] : []),
      { filter:'' }, { poses: actors.slice(0,3).map((v,i)=>[String.fromCharCode(65+i),'cheer']), t:1000 },
      { outcome:'happy', endText:['👥 '+g.title, choice === 'second' ? '서로의 이야기를 먼저 듣고 답을 찾았다.' : '힘을 모아 작은 문제를 해결했다.'] }
    ];
    const scene={ theme:'friend', cast, beats, key:'groupDrama|'+g.id, vig:true, force:true, sub:g.title, venue:venue(g.location) };
    scene.resolve=()=>{
      const st=state(); if(!st.groupCompleted.includes(g.id)) st.groupCompleted.push(g.id);
      st.choice[g.id]=choice||'first'; st.lastDay=day();
      for(let i=0;i<actors.length;i++) for(let j=i+1;j<actors.length;j++){
        Soc.addFriend(actors[i].id,actors[j].id,4,4,'단체 드라마');
        Soc.addFriend(actors[j].id,actors[i].id,4,4,'단체 드라마');
      }
      Sim.log('friend','👥 '+g.title+' — 주민들이 함께한 하루',actors.map(v=>v.id),2,{newsKind:'drama'});
    };
    return scene;
  }
  MD.groupProgress = () => ({ completed:state().groupCompleted.slice(), total:FM.GROUP_DRAMA.length, next:nextGroup() });
  MD.startGroup = (index, choice) => { const g=FM.GROUP_DRAMA[index]; const c=g&&groupEpisode(g,choice||'first'); if(c) Cut.enqueue(c,true); return !!c; };

  const oldTalk = Soc.playerTalk;
  if (oldTalk) Soc.playerTalk = function(v) {
    const r = oldTalk.apply(this, arguments);
    try {
      const gi = nextGroup();
      const gd = gi >= 0 ? FM.GROUP_DRAMA[gi] : null;
      if (r && r.options && v && gd && gd.cast.includes(v.castId) && totalPersonalEpisodes() >= groupThresholds[gi] && state().lastDay !== day() && !r.options.some(o => o.id === 'groupDramaStart')) {
        r.options.unshift({ id:'groupDramaStart', label:'👥 '+gd.title });
      }
      if (r && r.options && v && (v.castId === 'c07' || v.id === (byCast('c07') || {}).id) && MD.ready() && !r.options.some(o => o.id === 'mainDramaStart')) {
        const p = MD.progress();
        const d = FM.MAIN_STORY[p.next];
        r.options.unshift({ id: 'mainDramaStart', label: '🎬 ' + d.title });
        r.text = '…예전 축제 기록에서 이상한 걸 찾았어. 이번엔 네가 같이 봐 줬으면 해.';
      }
    } catch (e) { console.error('main drama talk', e); }
    return r;
  };
  const oldChoose = Soc.playerChoose;
  if (oldChoose) Soc.playerChoose = function(v, id, arg) {
    if (id === 'groupDramaStart') {
      const gi = nextGroup(), g = FM.GROUP_DRAMA[gi];
      if (!g) return { text:'지금은 다 함께 모일 일이 없어.', close:true, options:[] };
      return { text:g.title+' 이야기를 어떻게 풀어 갈까?', options:[
        { id:'groupDramaPlay', label:'🤝 각자 역할을 나눠 바로 시작한다', arg:'first' },
        { id:'groupDramaPlay', label:'🫶 먼저 서로의 이야기를 듣는다', arg:'second' }
      ]};
    }
    if (id === 'groupDramaPlay') {
      const gi = nextGroup(); if (gi >= 0) MD.startGroup(gi,arg);
      return { text:'좋아. 모두의 힘을 모아 보자!', close:true, options:[] };
    }
    if (id === 'mainDramaStart') {
      const ep = MD.progress().next;
      if (ep < 0 || ep >= FM.MAIN_STORY.length) return { text: '지금은 새로 확인할 단서가 없어.', close: true, options: [] };
      return { text: question(ep), options: [
        { id: 'mainDramaPlay', label: titleChoices(ep)[0], arg: 'first' },
        { id: 'mainDramaPlay', label: titleChoices(ep)[1], arg: 'second' },
      ] };
    }
    if (id === 'mainDramaPlay') {
      const ep = MD.progress().next;
      if (ep >= 0 && ep < FM.MAIN_STORY.length) MD.start(ep, arg);
      return { text: '…좋아. 우리가 고른 방식으로 단서를 따라가 보자.', close: true, options: [] };
    }
    return oldChoose ? oldChoose.apply(this, arguments) : null;
  };
})();
