(()=>{
  'use strict';
  const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
  const screens=$$('.screen');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const opened=new Set();
  let current='introScreen';
  let transitionBusy=false;
  screens.forEach(s=>s.inert=!s.classList.contains('active'));

  function showScreen(id){
    if(transitionBusy||id===current)return;
    transitionBusy=true;
    const from=$('#'+current), to=$('#'+id);
    if(!to){transitionBusy=false;return;}
    from.classList.add('leaving');
    const delay=reduced?0:260;
    setTimeout(()=>{
      screens.forEach(s=>s.classList.remove('active','leaving'));
      screens.forEach(s=>s.inert=s!==to);
      to.classList.add('active'); current=id; to.scrollTop=0;
      const heading=to.querySelector('h1,h2');
      if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
      setTimeout(()=>transitionBusy=false,reduced?0:220);
    },delay);
  }

  function particles(count=18,symbols=['✦','·','◇']){
    if(reduced)return;
    const layer=$('#particleLayer');
    for(let i=0;i<count;i++){
      const p=document.createElement('span'); p.className='particle';
      p.textContent=symbols[Math.floor(Math.random()*symbols.length)];
      p.style.left=Math.random()*100+'%'; p.style.fontSize=(.7+Math.random()*1.25)+'rem';
      p.style.setProperty('--drift',((Math.random()-.5)*180)+'px'); p.style.animationDelay=(Math.random()*.35)+'s';
      layer.appendChild(p); setTimeout(()=>p.remove(),3000);
    }
  }

  $('#openMail').addEventListener('click',()=>{
    const stage=$('#openMail'); if(stage.classList.contains('opening'))return;
    stage.classList.add('opening');
    setTimeout(()=>particles(12,['✦','·']),reduced?0:1000);
    setTimeout(()=>showScreen('revealScreen'),reduced?50:1800);
  });
  $('#enterGift').addEventListener('click',()=>showScreen('hubScreen'));
  $$('[data-back]').forEach(b=>b.addEventListener('click',()=>showScreen('hubScreen')));

  function updateProgress(){
    $('#giftProgress').textContent=`${opened.size} / 3`;
    $$('.gift-card').forEach(card=>{
      const isOpen=opened.has(card.dataset.gift);
      card.classList.toggle('opened',isOpen);
      $('.gift-status',card).textContent=isOpen?'opened':'sealed';
    });
    $('#finalSurprise').disabled=opened.size!==3;
    $('#finalHint').textContent=opened.size===3?'Unlocked — open the finale':'Open all 3 gifts to unlock';
  }

  $$('.gift-card').forEach(card=>card.addEventListener('click',()=>{
    if(transitionBusy)return;
    opened.add(card.dataset.gift); updateProgress(); showScreen(card.dataset.target);
  }));

  $('#finalSurprise').addEventListener('click',()=>{
    if(opened.size<3||transitionBusy)return; showScreen('finalScreen'); particles(22,['✦','·']); launchFinalStars();
  });

  $('#replayGift').addEventListener('click',()=>{
    if(transitionBusy)return;
    opened.clear(); updateProgress();
    audio.pause();
    if(audio.readyState>0)audio.currentTime=0;
    seek.value=0;cur.textContent='0:00';
    $('#finalStars').replaceChildren();$('#particleLayer').replaceChildren();
    $('#openMail').classList.remove('opening');
    showScreen('introScreen');
  });

  // music
  const audio=$('#audio'), play=$('#playButton'), seek=$('#seek'), volume=$('#volume');
  const cur=$('#currentTime'), dur=$('#duration'), status=$('#audioStatus'), eq=$('#equalizer'), record=$('#recordWrap');
  let audioReady=false;
  const fmt=s=>Number.isFinite(s)?`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`:'0:00';
  audio.volume=Number(volume.value);
  function audioMissing(){audioReady=false;status.textContent='Add music.mp3 inside assets/audio/';status.classList.add('error');play.textContent='▶';play.setAttribute('aria-label','Play music');eq.classList.remove('playing');record.classList.remove('playing');}
  audio.addEventListener('loadedmetadata',()=>{audioReady=true;dur.textContent=fmt(audio.duration);status.textContent='Your song is ready.';status.classList.remove('error')});
  audio.addEventListener('canplay',()=>{audioReady=true;status.textContent='Your song is ready.';status.classList.remove('error')});
  audio.addEventListener('error',audioMissing);
  $('source',audio).addEventListener('error',audioMissing);
  if(audio.error||audio.networkState===3)audioMissing();
  play.addEventListener('click',async()=>{try{if(!audioReady&&audio.readyState===0)audio.load();if(audio.paused)await audio.play();else audio.pause()}catch(e){audioMissing()}});
  audio.addEventListener('play',()=>{play.textContent='❚❚';play.setAttribute('aria-label','Pause music');eq.classList.add('playing');record.classList.add('playing')});
  audio.addEventListener('pause',()=>{play.textContent='▶';play.setAttribute('aria-label','Play music');eq.classList.remove('playing');record.classList.remove('playing')});
  audio.addEventListener('timeupdate',()=>{if(!Number.isFinite(audio.duration)||!audio.duration)return;seek.value=audio.currentTime/audio.duration*100;cur.textContent=fmt(audio.currentTime)});
  seek.addEventListener('input',()=>{if(Number.isFinite(audio.duration)&&audio.duration)audio.currentTime=Number(seek.value)/100*audio.duration});
  volume.addEventListener('input',()=>audio.volume=Number(volume.value));

  // lightbox
  const lb=$('#lightbox'), lbImg=$('#lightboxImage'); let lastFocus=null;
  function openLightbox(btn){lastFocus=document.activeElement;lbImg.src=btn.dataset.image;lbImg.alt=btn.dataset.alt;lb.classList.add('open');lb.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('#experience').inert=true;$('#lightboxClose').focus()}
  function closeLightbox(){lb.classList.remove('open');lb.setAttribute('aria-hidden','true');document.body.style.overflow='';lbImg.removeAttribute('src');$('#experience').inert=false;if(lastFocus)lastFocus.focus()}
  $$('.memory-card').forEach(b=>b.addEventListener('click',()=>openLightbox(b)));
  $('#lightboxClose').addEventListener('click',closeLightbox);
  lb.addEventListener('click',e=>{if(e.target===lb)closeLightbox()});
  document.addEventListener('keydown',e=>{if(!lb.classList.contains('open'))return;if(e.key==='Escape')closeLightbox();if(e.key==='Tab'){e.preventDefault();$('#lightboxClose').focus()}});

  function launchFinalStars(){
    if(reduced)return; const layer=$('#finalStars'); layer.innerHTML='';
    for(let i=0;i<26;i++){
      const s=document.createElement('span'); s.className='final-star'; s.textContent=['✦','·'][Math.floor(Math.random()*2)];
      s.style.left=Math.random()*100+'%'; s.style.fontSize=(.7+Math.random()*1.7)+'rem'; s.style.animationDelay=(Math.random()*1.2)+'s'; s.style.animationDuration=(2.6+Math.random()*1.8)+'s'; layer.appendChild(s);
    }
  }

  updateProgress();
})();