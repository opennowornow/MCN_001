(function(){
  const GOAL_DAYS = 7, GOAL_FANS = 10000;
  const AVAILABLE_VIDEOS = Array.isArray(window.__AVAILABLE_VIDEOS__) ? window.__AVAILABLE_VIDEOS__ : [];

  const IP_LIBRARY = [
    {name:'疯狂小杨哥', industry:'段子', attrs:{creative:4,talk:4,pro:4,charm:4}, cost:700, video:'疯狂小杨哥.mp4'},
    {name:'听泉鉴宝',   industry:'文玩', attrs:{creative:3,talk:3,pro:5,charm:3}, cost:650, video:'听泉鉴宝.mp4'},
    {name:'张大仙',     industry:'电子竞技', attrs:{creative:4,talk:5,pro:5,charm:4}, cost:780, video:'张大仙.mp4'},
    {name:'与南同行',   industry:'文化', attrs:{creative:4,talk:4,pro:4,charm:4}, cost:680, video:'与南同行.mp4'},
    {name:'李佳琦',     industry:'美妆时尚', attrs:{creative:4,talk:5,pro:4,charm:5}, cost:800, video:'李佳琦.mp4'},
    {name:'李子柒',     industry:'非遗', attrs:{creative:5,talk:3,pro:4,charm:5}, cost:800, video:'李子柒.mp4'},
    {name:'会说话的刘二豆', industry:'萌宠', attrs:{creative:4,talk:3,pro:3,charm:5}, cost:600, video:'会说话的刘二豆.mp4'},
    {name:'Dear-迪丽热巴', industry:'影视', attrs:{creative:4,talk:4,pro:3,charm:5}, cost:820, video:'迪丽热巴.mp4'},
    {name:'某律师',     industry:'法律', attrs:{creative:3,talk:4,pro:5,charm:3}, cost:650, video:'某律.mp4'},
    {name:'猫哥说车',   industry:'汽车', attrs:{creative:3,talk:4,pro:4,charm:3}, cost:640, video:'猫哥说车.mp4'},
    {name:'山村小杰',   industry:'三农', attrs:{creative:4,talk:3,pro:3,charm:4}, cost:620, video:'山村小杰.mp4'},
    {name:'米高沃克斯', industry:'3C', attrs:{creative:4,talk:4,pro:5,charm:3}, cost:700, video:'米高沃克斯.mp4'}
  ];
  const PREF = {
    '美妆时尚': {videoHigh:['教程','测评'], liveHigh:['带货','教程']},
    '电子竞技': {videoHigh:['挑战','攻略'], liveHigh:['对战','解说']},
    '文化':     {videoHigh:['解读','vlog'], liveHigh:['分享','连线']},
    '文玩':     {videoHigh:['评测','鉴定'], liveHigh:['问答','带货']},
    '非遗':     {videoHigh:['制作','纪录'], liveHigh:['教学','分享']},
    '萌宠':     {videoHigh:['vlog','剪辑'], liveHigh:['互动','连线']},
    '影视':     {videoHigh:['花絮','解读'], liveHigh:['访谈','路演']},
    '法律':     {videoHigh:['科普','案例'], liveHigh:['问答','解读']},
    '汽车':     {videoHigh:['测评','对比'], liveHigh:['试驾直播','讲解']},
    '三农':     {videoHigh:['种植','日常'], liveHigh:['带货','直播助农']},
    '3C':       {videoHigh:['开箱','评测'], liveHigh:['带货','问答']},
    '段子':     {videoHigh:['短剧','整活'], liveHigh:['互动','挑战']}
  };

  const randInt=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  const clamp=(n,mi,ma)=>Math.max(mi,Math.min(ma,n));
  const pick=a=>a[randInt(0,a.length-1)];

  const state={
    day:1, coins:1500, fans:0,
    candidates:[], team:[], currentIPIndex:0,
    progressRunning:false,
    flow:{ step:'type', chosenType:null }
  };

  const $=id=>document.getElementById(id);
  const el={
    dayNum:$('dayNum'), coins:$('coins'), fans:$('fans'),
    restartBtn:$('restartBtn'), nextDayBtn:$('nextDayBtn'),
    goalBar:$('goalBar'), dayProgress:$('dayProgress'), dayProgressLabel:$('dayProgressLabel'),
    fanProgress:$('fanProgress'), fanProgressLabel:$('fanProgressLabel'),
    recruitScreen:$('recruitScreen'), recruitList:$('recruitList'), startGameBtn:$('startGameBtn'),
    mainScreen:$('mainScreen'), ipBar:$('ipBar'),
    choiceCard:$('choiceCard'),
    cardPrompt:$('cardPrompt'), cardTitle:$('cardTitle'), cardDesc:$('cardDesc'),
    badgeLeft:$('badgeLeft'), badgeRight:$('badgeRight'),
    progressBar:$('progressBar'), toast:$('toast'),
    upgradeBtn:$('upgradeBtn'), turnsLeft:$('turnsLeft'),
    cardVideo:$('cardVideo'), cardFallback:$('cardFallback')
  };
// === UI Helpers 2.8 ===
function uiBeginActionOverlay(text){
  try{
    el.choiceCard.classList.add('committed');
    // Add running stripes on progress
    el.progressBar.classList.add('running');
  }catch(e){}
}

function uiEndActionOverlay(){
  try{
    el.choiceCard.classList.remove('committed');
    el.progressBar.classList.remove('running');
  }catch(e){}
}

function showGains(r){
  const layer = document.getElementById('gainLayer');
  if(!layer) return;
  // Helper: float near a target element
  function floatNear(elm, msg){
    if(!elm) return;
    const rect = elm.getBoundingClientRect();
    const div = document.createElement('div');
    div.className = 'gain-float';
    div.textContent = msg;
    // place near top-right of the element
    const x = rect.left + rect.width - 8;
    const y = rect.top - 6;
    div.style.left = x + 'px';
    div.style.top = y + 'px';
    layer.appendChild(div);
    setTimeout(()=>div.remove(), 1400);
    // pop the counter
    elm.classList.add('hud-pop');
    setTimeout(()=>elm.classList.remove('hud-pop'), 600);
  }
  if(r.fans>0) floatNear(el.fans, `+${r.fans} 粉丝`);
  if(r.coins>0) floatNear(el.coins, `+${r.coins} 金币`);
  // Center splash
  const splash = document.createElement('div');
  splash.className = 'gain-splash';
  splash.textContent = `粉丝 +${r.fans} ｜ 金币 +${r.coins}`;
  document.body.appendChild(splash);
  setTimeout(()=>splash.remove(), 900);
}

// Mark ip pills done
function markIpPills(){
  const children = [...el.ipBar.children];
  children.forEach((pill,i)=>{
    const ip = state.team[i];
    if(!ip) return;
    pill.classList.toggle('done', !!ip.actedToday);
  });
}

// Day-done banner toggle + pulse
function updateDayDoneUI(){
  const banner = document.getElementById('dayDoneBanner');
  const left = state.team.filter(ip=>!ip.actedToday).length;
  if(banner){
    banner.classList.toggle('show', left===0);
  }
  const nextBtn = document.getElementById('nextDayBtn');
  if(nextBtn){
    nextBtn.classList.toggle('pulse', left===0);
  }
}

// Handle trying to operate on an acted IP
function handleActedIPSelection(ip){
  const next = state.team.findIndex(x=>!x.actedToday);
  if(next!==-1){
    toast(`${ip.name} 今日已行动，已切换到 ${state.team[next].name}`);
    setActiveIP(next);
  }else{
    toast('今天已行动 ✓');
    updateDayDoneUI();
  }
}


  function setCardVideo(ip){
    const setSrc = (src)=>{
      if(!el.cardVideo) return;
      el.cardVideo.src = src;
      el.cardVideo.play().catch(()=>{});
    };
    // primary
    let src = ip && ip.video ? `assets/${ip.video}` : null;
    if(src){
      setSrc(src);
    }else if(AVAILABLE_VIDEOS.length){
      setSrc('assets/'+pick(AVAILABLE_VIDEOS));
    }else{
      el.cardVideo.removeAttribute('src');
      el.cardFallback.style.display='block';
    }
  }
  if(el.cardVideo){
    el.cardVideo.addEventListener('error', ()=>{
      // pick a random fallback if this video fails
      if(AVAILABLE_VIDEOS.length){
        el.cardVideo.src = 'assets/'+pick(AVAILABLE_VIDEOS);
        el.cardVideo.play().catch(()=>{});
      }else{
        el.cardFallback.style.display='block';
      }
    });
    el.cardVideo.addEventListener('loadeddata', ()=>{ el.cardFallback.style.display='none'; });
  }

  function resetAll(){
    state.day=1; state.coins=1500; state.fans=0;
    state.team=[]; state.candidates=[]; state.currentIPIndex=0;
    state.progressRunning=false; state.flow.step='type'; state.flow.chosenType=null;
    el.goalBar.classList.add('hidden');
    initRecruit(); switchScreen('recruit'); syncHud(); updateGoalBar();
    setCardVideo(null);
  }

  function initRecruit(){
    const pool=[...IP_LIBRARY];
    const n=randInt(7,8);
    state.candidates=[];
    for(let i=0;i<n;i++){
      const idx=randInt(0,pool.length-1);
      const base=pool.splice(idx,1)[0]; if(!base) break;
      const ip={
        id:String(Math.random()).slice(2),
        name:base.name, industry:base.industry, video:base.video,
        prefs: PREF[base.industry] || {videoHigh:['教程','测评'], liveHigh:['聊天','带货']},
        attrs:{...base.attrs}, cost:base.cost, busy:false, actedToday:false
      };
      state.candidates.push(ip);
    }
    renderRecruit();
  }
  function renderRecruit(){
    el.recruitList.innerHTML='';
    const picked=state.team.length;
    state.candidates.forEach(c=>{
      const card=document.createElement('div'); card.className='recruit-card';
      card.innerHTML=`
        <div class="row"><b>${c.name}</b><span class="tag">${c.industry}</span></div>
        <div class="attr">创意<b>${c.attrs.creative}</b> · 表达<b>${c.attrs.talk}</b> · 专业<b>${c.attrs.pro}</b> · 魅力<b>${c.attrs.charm}</b></div>
        <div class="row"><span class="small">签约费</span><b class="gold">💰 ${c.cost}</b></div>
        <div class="card-actions">
          <button class="btn-ghost" data-detail="${c.id}">详情</button>
          <button class="btn" data-hire="${c.id}" ${state.coins<c.cost||picked>=2?'disabled':''}>签约</button>
        </div>`;
      el.recruitList.appendChild(card);
    });
    el.startGameBtn.disabled=(state.team.length<2);
    el.recruitList.querySelectorAll('[data-detail]').forEach(btn=>{
      btn.onclick=()=>{
        const c=state.candidates.find(x=>x.id===btn.dataset.detail);
        toast(`${c.name}｜${c.industry}｜创意${c.attrs.creative} 表达${c.attrs.talk} 专业${c.attrs.pro} 魅力${c.attrs.charm}`);
      };
    });
    el.recruitList.querySelectorAll('[data-hire]').forEach(btn=>{
      btn.onclick=()=>{
        const id=btn.dataset.hire;
        const idx=state.candidates.findIndex(x=>x.id===id);
        const c=state.candidates[idx]; if(!c) return;
        if(state.team.find(t=>t.name===c.name)){ toast('该IP已签约'); return; }
        if(state.team.length>=2 || state.coins<c.cost) return;
        state.coins-=c.cost; state.team.push(c);
        state.candidates.splice(idx,1);
        renderRecruit(); syncHud();
      };
    });
    syncHud();
  }

  document.getElementById('startGameBtn').onclick=startGame;
  function startGame(){
    switchScreen('main'); el.goalBar.classList.remove('hidden');
    buildIpBar(); setActiveIP(0); startNewDay(true); updateDayDoneUI();
  }
  function switchScreen(which){
    el.recruitScreen.classList.toggle('active', which==='recruit');
    el.mainScreen.classList.toggle('active', which==='main');
  }
  function buildIpBar(){
    el.ipBar.innerHTML='';
    state.team.forEach((ip,idx)=>{
      const pill=document.createElement('div'); pill.className='ip-pill';
      pill.innerHTML=`<b>${ip.name}</b><span class="meta">${ip.industry}</span>`;
      pill.onclick=()=>setActiveIP(idx);
      el.ipBar.appendChild(pill); markIpPills();
    });
  }
  function setActiveIP(index){
    state.currentIPIndex=index;
    [...el.ipBar.children].forEach((n,i)=>n.classList.toggle('active', i===index));
    const ip=state.team[index];
    setCardVideo(ip);
    state.flow.step='type'; state.flow.chosenType=null; refreshCard();
  }

  el.upgradeBtn.onclick=()=>{ if(state.progressRunning) return; state.flow.step='upgrade'; refreshCard(); };

  function startNewDay(isFirst=false){
    state.team.forEach(ip=>{ip.actedToday=false; ip.busy=false;});
    if(!isFirst) state.day+=1;
    syncHud(); updateGoalBar(); updateTurns();
    state.flow.step='type'; state.flow.chosenType=null; refreshCard();
    el.nextDayBtn.disabled=true;
  }
  el.nextDayBtn.onclick=()=>{ toast('已结束当天'); startNewDay(); updateDayDoneUI(); };
  el.restartBtn.onclick=()=>{ if(state.progressRunning) return; resetAll(); toast('已重置游戏'); };

  function updateGoalBar(){
    const dayP=Math.min(1, state.day/GOAL_DAYS);
    const fanP=Math.min(1, state.fans/GOAL_FANS);
    $('dayProgress').style.width=(dayP*100).toFixed(1)+'%';
    $('fanProgress').style.width=(fanP*100).toFixed(1)+'%';
    $('dayProgressLabel').textContent=`${Math.min(state.day,GOAL_DAYS)} / ${GOAL_DAYS}`;
    $('fanProgressLabel').textContent=`${state.fans} / ${GOAL_FANS}`;
  }

  function refreshCard(){
    const ip=state.team[state.currentIPIndex]; if(!ip) return;

    if((ip.busy||ip.actedToday) && state.flow.step!=='upgrade'){
      setCardUI('已完成今日行动','切换其他IP或结束当天','—','—', ip);
      toggleUpgradePanel(false);
      return;
    }

    if(state.flow.step==='type'){
      setCardUI('选择内容类型','左：拍视频 ｜ 右：直播','拍视频','直播', ip);
      setPayload('left',{flow:'type',pick:'video',ipId:ip.id});
      setPayload('right',{flow:'type',pick:'live',ipId:ip.id});
      toggleUpgradePanel(false);
    }else if(state.flow.step==='detail'){
      const p=ip.prefs || {videoHigh:['教程','测评'], liveHigh:['聊天','带货']};
      if(state.flow.chosenType==='video'){
        const a=p.videoHigh[0]||'教程', b=p.videoHigh[1]||'测评';
        setCardUI('选择选题',`左：${a} ｜ 右：${b}`,a,b, ip);
        setPayload('left',{flow:'detail',type:'video',label:a,ipId:ip.id});
        setPayload('right',{flow:'detail',type:'video',label:b,ipId:ip.id});
      }else{
        const a=p.liveHigh[0]||'聊天', b=p.liveHigh[1]||'带货';
        setCardUI('选择直播形式',`左：${a} ｜ 右：${b}`,a,b, ip);
        setPayload('left',{flow:'detail',type:'live',label:a,ipId:ip.id});
        setPayload('right',{flow:'detail',type:'live',label:b,ipId:ip.id});
      }
      toggleUpgradePanel(false);
    }else if(state.flow.step==='upgrade'){
      setCardUI('选择升级属性','点击下方属性直接升级','创意力','魅力', ip);
      toggleUpgradePanel(true);
    }
  }
  function toggleUpgradePanel(show){
    const panel=$('upgradePanel');
    if(show){ panel.classList.add('show'); } else { panel.classList.remove('show'); }
  }

  function setCardUI(prompt, desc, leftText, rightText, ip){
    el.cardPrompt.textContent=prompt;
    el.cardTitle.textContent=ip?`当前IP：${ip.name}`:'当前IP：—';
    el.cardDesc.textContent=desc;
    el.badgeLeft.textContent='左：'+leftText;
    el.badgeRight.textContent='右：'+rightText;
  }
  function setPayload(side,obj){ el.choiceCard.dataset[side]=JSON.stringify(obj); }

  // --- Swipe: apply transform to the WHOLE CARD (.choice-card) ---
  let startX=0,currentX=0,dragging=false; const SWIPE_OK=80;
  function onDown(x){ if(state.progressRunning||state.flow.step==='upgrade') return; dragging=true; startX=currentX=x; el.choiceCard.classList.add('swiping'); }
  function onMove(x){ if(!dragging) return; currentX=x; const dx=currentX-startX;
    el.choiceCard.style.transform=`translateX(${dx}px) rotate(${dx*0.03}deg)`;
    const a=Math.min(1, Math.abs(dx)/140);
    el.badgeLeft.style.opacity = dx<0 ? 0.3+0.7*a : 1;
    el.badgeRight.style.opacity= dx>0 ? 0.3+0.7*a : 1;
  }
  function onUp(){ if(!dragging) return; dragging=false; const dx=currentX-startX;
    el.choiceCard.classList.remove('swiping');
    el.choiceCard.style.transform='';
    el.badgeLeft.style.opacity=el.badgeRight.style.opacity=1;
    if(Math.abs(dx)>SWIPE_OK){ commit(dx>0?'right':'left'); }
  }
  el.choiceCard.addEventListener('mousedown',e=>onDown(e.clientX)); window.addEventListener('mousemove',e=>onMove(e.clientX)); window.addEventListener('mouseup',onUp);
  el.choiceCard.addEventListener('touchstart',e=>onDown(e.touches[0].clientX),{passive:true});
  window.addEventListener('touchmove',e=>onMove(e.touches[0].clientX),{passive:true}); window.addEventListener('touchend',onUp);

  function commit(side){
    const p=JSON.parse(el.choiceCard.dataset[side]||'{}');
    const ip=state.team.find(x=>x.id===p.ipId); if(!ip) return;
    if(ip.actedToday){ handleActedIPSelection(ip); return; }
    if(p.flow==='type'){ state.flow.step='detail'; state.flow.chosenType=p.pick; refreshCard(); return; }
    if(p.flow==='detail'){
      if(ip.busy||ip.actedToday) return;
      if(p.type==='video') doVideo(ip,p.label); else doLive(ip,p.label); return;
    }
  }

  // 升级（点击属性）
  document.addEventListener('click', (ev)=>{
    const btn=ev.target.closest('.attr-btn');
    if(!btn) return;
    if(state.flow.step!=='upgrade') return;
    const ip=state.team[state.currentIPIndex]; if(!ip||ip.busy||ip.actedToday) return;
    doUpgrade(ip, btn.dataset.attr);
  });

  function runProgress(ms,onDone){
    state.progressRunning=true; el.progressBar.style.width='0%';
    const s=performance.now(); function f(t){ const p=Math.max(0,Math.min(1,(t-s)/ms));
      el.progressBar.style.width=(p*100).toFixed(1)+'%';
      if(p<1) requestAnimationFrame(f); else { state.progressRunning=false; onDone&&onDone(); uiEndActionOverlay(); } }
    requestAnimationFrame(f);
  }

  function computeVideoOutcome(ip,label){
    const baseFans=randInt(250,820), baseCoins=randInt(30,140);
    const pref=(ip.prefs?.videoHigh||[]).includes(label);
    const mult=1+(pref?0.35:0)+ip.attrs.creative*0.04+ip.attrs.charm*0.03;
    return {fans:Math.round(baseFans*mult), coins:Math.round(baseCoins*(0.7+ip.attrs.pro*0.03))};
  }
  function computeLiveOutcome(ip,label){
    const baseCoins=randInt(220,640), baseFans=randInt(80,320);
    const pref=(ip.prefs?.liveHigh||[]).includes(label);
    const mult=1+(pref?0.35:0)+ip.attrs.talk*0.05+ip.attrs.charm*0.02;
    return {coins:Math.round(baseCoins*mult), fans:Math.round(baseFans*(0.8+ip.attrs.talk*0.03))};
  }

  function doVideo(ip,label){
    ip.busy=true; toast(`${ip.name} 开始拍「${label}」…`); uiBeginActionOverlay();
    runProgress(randInt(4500,7000),()=>{ const r=computeVideoOutcome(ip,label);
      state.coins+=r.coins; state.fans+=r.fans; ip.busy=false; ip.actedToday=true; updateTurns(); syncHud(); updateGoalBar();
      showGains(r); toast(`完成！粉丝 +${r.fans}，金币 +${r.coins}`); state.flow.step='type'; state.flow.chosenType=null; refreshCard(); });
  }
  function doLive(ip,label){
    ip.busy=true; toast(`${ip.name} 正在直播「${label}」…`); uiBeginActionOverlay();
    runProgress(randInt(4500,7000),()=>{ const r=computeLiveOutcome(ip,label);
      state.coins+=r.coins; state.fans+=r.fans; ip.busy=false; ip.actedToday=true; updateTurns(); syncHud(); updateGoalBar();
      showGains(r); toast(`直播结束！金币 +${r.coins}，粉丝 +${r.fans}`); state.flow.step='type'; state.flow.chosenType=null; refreshCard(); });
  }
  function doUpgrade(ip,key){
    const cost=150+ip.attrs.creative+ip.attrs.talk+ip.attrs.pro+ip.attrs.charm;
    if(state.coins<cost){ toast('金币不足，无法升级'); return; }
    state.coins-=cost; syncHud();
    ip.busy=true; toast(`${ip.name} 升级「${labelOf(key)}」…（花费 ${cost}）`);
    runProgress(randInt(3500,5500),()=>{ ip.attrs[key]=Math.min(10, ip.attrs[key]+1);
      ip.busy=false; ip.actedToday=true; updateTurns(); syncHud();
      toast(`升级完成！${labelOf(key)} +1`); state.flow.step='type'; state.flow.chosenType=null; refreshCard(); });
  }
  const labelOf=k=>({creative:'创意力',talk:'表达力',pro:'专业度',charm:'魅力'})[k]||k;

  function syncHud(){ el.dayNum.textContent=state.day; el.coins.textContent=state.coins; el.fans.textContent=state.fans; }
  function updateTurns(){ const left=state.team.filter(ip=>!ip.actedToday).length; el.turnsLeft.textContent=left; el.nextDayBtn.disabled=left>0; markIpPills(); updateDayDoneUI(); }
  let toastTimer=null; function toast(m){ el.toast.textContent=m; el.toast.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.toast.classList.remove('show'),1800); }

  resetAll();
})();