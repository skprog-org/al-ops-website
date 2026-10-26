(function(){
  var d=document,root=d.documentElement;
  function captureAnalytics(event,properties){try{if(window.posthog&&window.posthog.capture)window.posthog.capture(event,properties||{})}catch(e){}}
  function logAnalytics(message,attributes){try{if(window.posthog&&window.posthog.logger)window.posthog.logger.info(message,attributes||{})}catch(e){}}

  // theme: a switch (on = light); preference kept in this browser only
  var tb=d.querySelector('[data-theme-toggle]');
  function label(){if(tb)tb.setAttribute('aria-checked',root.getAttribute('data-theme')==='light'?'true':'false')}
  if(tb){tb.addEventListener('click',function(){var t=root.getAttribute('data-theme')==='light'?'dark':'light';root.setAttribute('data-theme',t);try{localStorage.setItem('theme',t)}catch(e){}label()});label()}

  // mobile menu
  var hdr=d.querySelector('.site-header'),mb=d.querySelector('.menu-btn');
  if(hdr&&mb){
    mb.addEventListener('click',function(){var o=hdr.classList.toggle('open');mb.setAttribute('aria-expanded',o?'true':'false')});
    d.addEventListener('keydown',function(e){if(e.key==='Escape'&&hdr.classList.contains('open')){hdr.classList.remove('open');mb.setAttribute('aria-expanded','false');mb.focus()}});
  }

  // tabs: roving tabindex and arrow keys
  [].forEach.call(d.querySelectorAll('[data-tabs]'),function(w){
    var tabs=[].slice.call(w.querySelectorAll('[role="tab"]'));
    function sel(i,focus){tabs.forEach(function(t,j){var on=i===j;t.setAttribute('aria-selected',on?'true':'false');t.tabIndex=on?0:-1;var p=d.getElementById(t.getAttribute('aria-controls'));if(p)p.hidden=!on});if(focus)tabs[i].focus()}
    tabs.forEach(function(t,i){
      t.addEventListener('click',function(){sel(i)});
      t.addEventListener('keydown',function(e){var n=null,k=e.key;
        if(k==='ArrowRight'||k==='ArrowDown')n=(i+1)%tabs.length;else if(k==='ArrowLeft'||k==='ArrowUp')n=(i-1+tabs.length)%tabs.length;else if(k==='Home')n=0;else if(k==='End')n=tabs.length-1;
        if(n!==null){e.preventDefault();sel(n,true)}});
    });
    sel(0);
  });

  // subtle reveal as sections enter view; content is visible without JS or with reduced motion
  var rv=[].slice.call(d.querySelectorAll('.reveal'));
  if(rv.length){
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
      rv.forEach(function(el){io.observe(el)});
    }else rv.forEach(function(el){el.classList.add('in')});
  }

  // homepage hero: a perspective field of points rolling like terrain; static frame under reduced motion
  [].forEach.call(d.querySelectorAll('canvas[data-terrain]'),function(cv){
    var ctx=cv.getContext&&cv.getContext('2d');if(!ctx)return;
    var still=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var w,h,t=0,raf=null,vis=true,COLS=90,ROWS=46;
    function size(){var r=Math.min(window.devicePixelRatio||1,2);w=cv.clientWidth;h=cv.clientHeight;cv.width=Math.round(w*r);cv.height=Math.round(h*r);ctx.setTransform(r,0,0,r,0,0)}
    function field(x,z){return Math.sin(x*.18+t*.6)*.55+Math.sin(z*.23-t*.4+x*.05)*.75+Math.sin((x+z)*.09+t*.25)*1.1+Math.cos(x*.41-z*.13)*.18}
    function draw(){
      ctx.clearRect(0,0,w,h);var hz=h*.3,f=w*.55;
      for(var r=ROWS-1;r>=0;r--){var z=2.2+r*.55,near=1-r/ROWS;
        for(var c=0;c<COLS;c++){var y=field(c,r+t*6),sx=w/2+(c-COLS/2)*.42*f/z,sy=hz+(3.2-y*1.1)*f/z*.34;
          if(sx<-4||sx>w+4||sy<0||sy>h+4)continue;
          var pk=Math.max(0,(y-1.1)/1.3),a=Math.min(.85,(.1+.75*near)*(.5+.6*pk)),s=Math.max(.7,2.2*near);
          ctx.fillStyle='rgba(160,232,224,'+a+')';ctx.fillRect(sx,sy,s,s)}}
    }
    function loop(){t+=.006;draw();raf=vis?requestAnimationFrame(loop):null}
    size();draw();window.addEventListener('resize',function(){size();draw()});
    if(still)return;
    if('IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis&&!raf)raf=requestAnimationFrame(loop)}).observe(cv);
    else raf=requestAnimationFrame(loop);
  });

  // 3D illustration: import the scene module only when the figure nears the viewport; the static image stays if WebGL or loading fails
  [].forEach.call(d.querySelectorAll('[data-motion]'),function(fig){
    // import() resolves against this script's URL, so make the page-relative base absolute first
    var base=fig.getAttribute('data-motion-base'),done=false;
    function load(){if(done)return;done=true;import(new URL(base+fig.getAttribute('data-motion')+'.js',document.baseURI).href).then(function(m){m.mount(fig)}).catch(function(){})}
    if('IntersectionObserver' in window){var io3=new IntersectionObserver(function(es){if(es[0].isIntersecting){io3.disconnect();load()}},{rootMargin:'300px 0px'});io3.observe(fig)}
    else load();
  });

  // contact form: preselect the region from ?region=<id> (footer "Regional enquiries" links)
  var rs=d.getElementById('mv-region'),rq=(location.search.match(/[?&]region=([a-z-]+)/)||[])[1];
  if(rs&&rq){var ro=rs.querySelector('option[data-key="'+rq+'"]');if(ro)rs.value=ro.value}

  // contact form: link to a saved readiness result (?rid=<uuid>, or the id kept in this tab's session)
  var rid=d.getElementById('mv-readiness-id');
  if(rid){var UU=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,rv=(location.search.match(/[?&]rid=([0-9a-f-]{36})/i)||[])[1];
    if(!rv){try{rv=sessionStorage.getItem('readiness-id')}catch(x){}}
    if(rv&&UU.test(rv))rid.value=rv.toLowerCase()}

  // workflow run steppers (manual, no autoplay)
  [].forEach.call(d.querySelectorAll('[data-stepper]'),function(s){
    var items=[].slice.call(s.querySelectorAll('.run-step')),prev=s.querySelector('[data-prev]'),next=s.querySelector('[data-next]'),pos=s.querySelector('[data-pos]'),i=0;
    function r(){
      items.forEach(function(it,j){it.classList.toggle('is-current',j===i);it.classList.toggle('is-future',j>i);if(j===i)it.setAttribute('aria-current','step');else it.removeAttribute('aria-current')});
      prev.disabled=i===0;next.disabled=i===items.length-1;pos.textContent='Step '+(i+1)+' of '+items.length;
    }
    prev.addEventListener('click',function(){if(i>0){i--;r()}});
    next.addEventListener('click',function(){if(i<items.length-1){i++;r()}});
    r();
  });

  // evidence record dialog: focus return, plain-text export, deep link #evidence-record
  var dlg=d.getElementById('evidence-record');
  if(dlg&&typeof dlg.showModal==='function'){
    var opener=null;
    var text=function(){return 'Illustrative evidence record\n'+[].slice.call(dlg.querySelectorAll('.kv dt')).map(function(dt){var v=dt.nextElementSibling.textContent;return dt.textContent+':'+(v.indexOf('\n')>-1?'\n':' ')+v}).join('\n')+'\n'};
    [].forEach.call(d.querySelectorAll('[data-open-evidence]'),function(b){b.addEventListener('click',function(){opener=b;dlg.showModal()})});
    dlg.addEventListener('close',function(){if(opener)opener.focus();if(location.hash==='#evidence-record')history.replaceState(null,'',location.pathname+location.search)});
    dlg.querySelector('[data-close]').addEventListener('click',function(){dlg.close()});
    var cp=dlg.querySelector('[data-copy]');
    cp.addEventListener('click',function(){if(navigator.clipboard){navigator.clipboard.writeText(text()).then(function(){cp.textContent='Copied'},function(){cp.textContent='Copy failed'})}});
    dlg.querySelector('[data-download]').addEventListener('click',function(){var a=d.createElement('a');a.href=URL.createObjectURL(new Blob([text()],{type:'text/plain'}));a.download='evidence-record-illustrative.txt';d.body.appendChild(a);a.click();a.remove();captureAnalytics('evidence_record_downloaded')});
    var cm=dlg.querySelector('[data-copy-mvdt]'),mv=dlg.querySelector('pre.mvdt');
    if(cm&&mv)cm.addEventListener('click',function(){if(navigator.clipboard){navigator.clipboard.writeText(mv.textContent).then(function(){cm.textContent='MVDT copied'},function(){cm.textContent='Copy failed'})}});
    // decision replay: step through the run, then recompute the hash chain in the browser
    var rp=dlg.querySelector('.replay'),rbs=[].slice.call(dlg.querySelectorAll('[data-replay]')),rb=rbs[0],cj=d.getElementById('ev-chain');
    if(rp&&rb&&cj){
      var chain=JSON.parse(cj.textContent),items=[].slice.call(rp.querySelectorAll('.rp-step')),st=rp.querySelector('.rp-status'),timer=null;
      var mk=[].slice.call(rp.querySelectorAll('.mk-node')),leaf=function(i){return rp.querySelector('.mk-node[data-k="0"][data-j="'+i+'"]')};
      var views=[].slice.call(rp.querySelectorAll('[data-view]'));
      function view(v){rp.setAttribute('data-view',v);views.forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-view')===v))})}
      views.forEach(function(b){b.addEventListener('click',function(){view(b.getAttribute('data-view'))})});
      view('list');
      // Merkle check: rebuild each level from the chain hashes (parent = sha256(left+right), odd node carried up) and compare with the record
      function merkle(){
        var lv=chain.merkle,k=1,bad=0;
        if(!lv)return Promise.resolve(null);
        return (function level(){
          if(k>=lv.length)return Promise.resolve(bad===0);
          var below=lv[k-1];
          return Promise.all(lv[k].map(function(want,j){
            var a=below[2*j],b=below[2*j+1];
            return (b===undefined?Promise.resolve(a):sha(a+b)).then(function(h){var g=rp.querySelector('.mk-node[data-k="'+k+'"][data-j="'+j+'"]');if(h!==want)bad++;if(g)g.classList.add(h===want?'is-ok':'is-bad')});
          })).then(function(){k++;return level()});
        })();
      }
      var still=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function canon(v){if(Array.isArray(v))return '['+v.map(canon).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(function(k){return JSON.stringify(k)+':'+canon(v[k])}).join(',')+'}';return JSON.stringify(v)}
      function sha(t){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)).then(function(b){return [].map.call(new Uint8Array(b),function(x){return ('0'+x.toString(16)).slice(-2)}).join('')})}
      function verify(){
        if(!(window.crypto&&crypto.subtle)){st.textContent='Replay complete. Hash verification needs a secure context (https or localhost).';return}
        var prev=chain.genesis,ok=0,i=0;
        (function next(){
          if(i>=chain.events.length){
            var msg='Replay complete. Chain verified: '+ok+' of '+chain.events.length+' hashes recomputed in your browser and matched.';
            st.textContent=msg;
            merkle().then(function(m){if(m!==null)st.textContent=msg+(m?' Merkle root recomputed and matched.':' Merkle root does not match.')});
            return}
          var ev=chain.events[i],good=ev.prev===prev;
          sha(canon(ev)).then(function(h){good=good&&h===chain.hashes[i];items[i].classList.add(good?'is-ok':'is-bad');var g=leaf(i);if(g)g.classList.add(good?'is-ok':'is-bad');if(good)ok++;prev=h;i++;next()});
        })();
      }
      function reset(){clearTimeout(timer);rp.classList.remove('playing');items.concat(mk).forEach(function(li){li.classList.remove('is-current','is-done','is-ok','is-bad')});st.textContent=''}
      function play(){
        captureAnalytics('evidence_record_replay_started');reset();rp.classList.add('playing');rbs.forEach(function(b){b.textContent='Replaying…';b.disabled=true});var i=0;
        if(rp.scrollIntoView)rp.scrollIntoView({block:'start',behavior:still?'auto':'smooth'});
        (function step(){
          if(i>0){items[i-1].classList.remove('is-current');if(leaf(i-1))leaf(i-1).classList.remove('is-current')}
          if(i>=items.length){rbs.forEach(function(b){b.textContent='Replay again';b.disabled=false});verify();return}
          items[i].classList.add('is-current','is-done');if(leaf(i))leaf(i).classList.add('is-current','is-done');
          st.textContent='Step '+(i+1)+' of '+items.length+': '+items[i].querySelector('strong').textContent;
          if(!still&&rp.getAttribute('data-view')==='list'&&items[i].scrollIntoView)items[i].scrollIntoView({block:'nearest',behavior:'smooth'});
          i++;timer=setTimeout(step,still?250:1100);
        })();
      }
      rbs.forEach(function(b){b.addEventListener('click',play)});
      dlg.addEventListener('close',function(){reset();rbs.forEach(function(b){b.textContent='Replay decisions';b.disabled=false})});
    }
    if(location.hash==='#evidence-record')dlg.showModal();
  }

  // model gateway demo
  var gw=d.getElementById('gateway-demo');
  if(gw){
    var M={sovereign:['Sovereign model','Hosted in an approved region','sovereign-llm'],open:['Open-weight small model','Runs on your infrastructure','open-slm'],
           frontier:['Commercial frontier model','Hosted API, strongest on hard reasoning','frontier-llm'],next:['Newly onboarded model','Added by configuration, then evaluated','next-model']};
    var P={privacy:{use:'sovereign',when:'data.classification == "restricted"'},cost:{use:'open',when:'task.class == "routine"'},quality:{use:'frontier',when:'task.class == "complex"'}};
    var order=['sovereign','open','frontier'],added=false,cur='privacy';
    var list=gw.querySelector('[data-models]'),code=gw.querySelector('[data-policy]'),btn=gw.querySelector('[data-add]'),note=gw.querySelector('[data-note]');
    var render=function(){
      var p=P[cur];list.innerHTML='';
      order.concat(added?['next']:[]).forEach(function(k){var el=d.createElement('div');el.className='gw-item gw-model'+(k===p.use?' is-active':'');el.innerHTML='<b></b><small></small>';el.querySelector('b').textContent=M[k][0]+(k===p.use?' (selected)':'');el.querySelector('small').textContent=M[k][1];list.appendChild(el)});
      code.textContent='route:\n  when: '+p.when+'\n  use: '+M[p.use][2]+'\n  fallback: '+M[p.use==='sovereign'?'open':'sovereign'][2]+'\n  evaluation: required before promotion';
    };
    [].forEach.call(gw.querySelectorAll('input[name="route"]'),function(r){r.addEventListener('change',function(){cur=r.value;render()})});
    btn.addEventListener('click',function(){added=true;P.quality.use='next';btn.disabled=true;btn.textContent='Model onboarded';note.textContent='The complex-reasoning route now points to the new model. Workflows did not change. Promote it only after it passes the same evaluation suite.';render();captureAnalytics('model_gateway_demo_completed')});
    render();
  }

  // readiness self-check: scored locally; only "Discuss your result" sends it (random reference id, no personal data)
  var rc=d.getElementById('readiness');
  if(rc){
    var boxes=[].slice.call(rc.querySelectorAll('input[type="checkbox"]')),areas=[].slice.call(rc.querySelectorAll('fieldset[data-area]'));
    var bar=d.getElementById('rd-bar'),sc=d.getElementById('rd-score'),rh=d.getElementById('rd-h'),rp=d.getElementById('rd-p'),nx=d.getElementById('rd-next');
    var bands=[[0,'Starting point','AI is still a set of experiments. Agree what the business should achieve and who owns it before adding more pilots.'],
      [.25,'Experimenting','Some foundations exist, but value is unlikely to show up in the results yet. Choose one core workflow and redesign it end to end.'],
      [.55,'Scaling','The basics are in place in several areas. Close the gaps below so each new workflow builds on the last instead of starting again.'],
      [.8,'Ready to expand','Ownership, controls and evidence are in place. Expand into more core workflows, and give agents more authority one workflow at a time as evaluations support it.']];
    var upd=function(user){
      var n=boxes.filter(function(b){return b.checked}).length,b=bands[0],low=null;
      bar.style.width=(n/boxes.length*100)+'%';sc.textContent=n+' / '+boxes.length;
      bands.forEach(function(x){if(n>=x[0]*boxes.length)b=x});rh.textContent=b[1];rp.textContent=b[2];
      areas.forEach(function(a){
        var bx=[].slice.call(a.querySelectorAll('input')),k=bx.filter(function(x){return x.checked}).length,r=k/bx.length,id=a.getAttribute('data-area');
        a.querySelector('legend output').textContent=k+' / '+bx.length;
        var row=d.getElementById('rd-a-'+id);row.querySelector('i').style.width=(r*100)+'%';row.querySelector('output').textContent=k+'/'+bx.length;
        if(r<1&&(!low||r<low.r))low={r:r,a:a};
      });
      if(low){nx.hidden=false;nx.querySelector('b').textContent='Start with: '+low.a.getAttribute('data-name');nx.querySelector('span').textContent=low.a.getAttribute('data-next')}
      else {nx.hidden=true;if(user)captureAnalytics('readiness_assessment_completed',{check_count:n})}
    };
    boxes.forEach(function(b){b.addEventListener('change',function(){upd(true)})});upd();
    var dl=d.getElementById('rd-discuss');
    if(dl)dl.addEventListener('click',function(e){
      e.preventDefault();
      var rid=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)});
      var n=boxes.filter(function(b){return b.checked}).length,go=function(){location.href=dl.getAttribute('href')+'?rid='+rid};
      try{sessionStorage.setItem('readiness-id',rid)}catch(x){}
      var p={form:'readiness','rd-id':rid,'rd-score':n+' of '+boxes.length,'rd-band':rh.textContent,
        'rd-areas':areas.map(function(a){var bx=[].slice.call(a.querySelectorAll('input'));return a.getAttribute('data-name')+': '+bx.filter(function(x){return x.checked}).length+'/'+bx.length}).join('; '),
        'rd-selected':areas.map(function(a){var t=[].slice.call(a.querySelectorAll('label')).filter(function(l){return l.querySelector('input').checked}).map(function(l){return l.textContent.trim()});
          return t.length?a.getAttribute('data-name')+': '+t.join(' | '):''}).filter(Boolean).join('\n'),
        'rd-answers':boxes.map(function(b){return b.checked?'Y':'N'}).join('')};
      dl.setAttribute('aria-busy','true');
      var t=setTimeout(go,3000);
      fetch(FORM_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p),keepalive:true})
        .then(function(){captureAnalytics('readiness_result_saved',{check_count:n})}).catch(function(){}).then(function(){clearTimeout(t);go()});
    });
  }

  // cookie consent: record in localStorage {v,analytics,ts}; PostHog loads only with analytics:true and a key in <meta name="posthog">
  var CC_V=1,cc=d.querySelector('.cc'),ccd=d.querySelector('.cc-prefs'),phm=d.querySelector('meta[name="posthog"]'),ccTrigger=null;
  function ccGet(){var r=null;try{r=JSON.parse(localStorage.getItem('consent'))}catch(e){}return r&&typeof r==='object'?r:null}
  function ccSet(a){try{localStorage.setItem('consent',JSON.stringify({v:CC_V,analytics:!!a,ts:new Date().toISOString()}))}catch(e){}}
  function loadAnalytics(){
    if(!phm||window.posthog&&window.posthog.__loaded)return;
    // official PostHog loader snippet (stub queue, then array.js from the asset host)
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(d,window.posthog||[]);
    window.posthog.init(phm.getAttribute('content'),{api_host:phm.getAttribute('data-host'),defaults:'2026-05-30',persistence:'localStorage+cookie',person_profiles:'identified_only',capture_exceptions:{capture_unhandled_errors:true,capture_unhandled_rejections:true,capture_console_errors:false},logs:{serviceName:'al-ops-web',environment:location.hostname==='localhost'?'development':'production'}});
  }
  // withdrawal: stop capture, remove ph_* cookies (path and domain variants) and ph_* storage keys, then reload so nothing keeps running
  function withdrawAnalytics(){
    try{if(window.posthog&&window.posthog.opt_out_capturing)window.posthog.opt_out_capturing()}catch(e){}
    var host=location.hostname,parts=host.split('.'),doms=['',host,'.'+host];
    if(parts.length>2)doms.push('.'+parts.slice(-2).join('.'));
    var paths=['/'],segs=location.pathname.split('/').filter(Boolean),acc='';
    segs.forEach(function(s){acc+='/'+s;paths.push(acc,acc+'/')});
    d.cookie.split(';').forEach(function(c){
      var n=c.split('=')[0].replace(/^\s+/,'');
      if(n.indexOf('ph_')===0||n.indexOf('__ph_')===0)doms.forEach(function(dm){paths.forEach(function(p){
        d.cookie=n+'=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path='+p+(dm?';domain='+dm:'')})});
    });
    try{Object.keys(localStorage).forEach(function(k){if(k.indexOf('ph_')===0||k.indexOf('__ph_')===0)localStorage.removeItem(k)})}catch(e){}
    try{Object.keys(sessionStorage).forEach(function(k){if(k.indexOf('ph_')===0||k.indexOf('__ph_')===0)sessionStorage.removeItem(k)})}catch(e){}
  }
  function withdrawReload(){withdrawAnalytics();location.reload()}
  function ccFocus(){var m=d.getElementById('main');if(m)m.focus()}
  function ccChoose(a){
    var was=ccGet(),wasOn=!!(was&&was.analytics&&was.v>=CC_V),fromBanner=!!(cc&&!cc.hidden),fromDialog=!!(ccd&&ccd.open&&ccTrigger&&ccTrigger.closest('.cc'));
    ccSet(a);
    if(cc)cc.hidden=true;
    if(ccd&&ccd.open)ccd.close();
    if(a)loadAnalytics();
    else if(wasOn)withdrawReload();
    else if(was&&was.analytics)withdrawAnalytics();   // stale record with analytics on: clean up without reloading
    if(fromBanner||fromDialog||!ccTrigger||!ccTrigger.focus||!d.body.contains(ccTrigger)||ccTrigger.closest('[hidden]'))ccFocus();
    else ccTrigger.focus();
  }
  function ccOpen(t){
    if(!ccd||!ccd.showModal)return false;
    ccTrigger=t||null;
    var box=ccd.querySelector('[name="cc-analytics"]'),r=ccGet();
    if(box)box.checked=!!(r&&r.analytics);
    ccd.showModal();return true;
  }
  (function(){
    if(!cc)return;
    var r=ccGet();
    if(r&&r.analytics&&r.v>=CC_V)loadAnalytics();
    if(!r||!(r.v>=CC_V))cc.hidden=false;
    [].forEach.call(d.querySelectorAll('[data-cc="accept"]'),function(b){b.addEventListener('click',function(){ccChoose(true)})});
    [].forEach.call(d.querySelectorAll('[data-cc="reject"]'),function(b){b.addEventListener('click',function(){ccChoose(false)})});
    [].forEach.call(d.querySelectorAll('[data-cc="manage"]'),function(b){b.addEventListener('click',function(){if(!ccOpen(b)){var pl=cc.querySelector('a[href*="#your-choices"]');if(pl)location.href=pl.getAttribute('href')}})});
    [].forEach.call(d.querySelectorAll('[data-cc="save"]'),function(b){b.addEventListener('click',function(){var bx=ccd.querySelector('[name="cc-analytics"]');ccChoose(!!(bx&&bx.checked))})});
    [].forEach.call(d.querySelectorAll('[data-consent-open]'),function(a){a.addEventListener('click',function(e){if(ccOpen(a))e.preventDefault()})});
    if(ccd)ccd.addEventListener('close',function(){if(ccTrigger&&ccTrigger.focus&&d.body.contains(ccTrigger)&&!ccTrigger.closest('[hidden]'))ccTrigger.focus();else ccFocus()});
  })();

  // forms: inline errors, data kept on failure; submissions post to the worker at /api/contact (see the README)
  var FORM_ENDPOINT='/api/contact';  // JSON POST; the body carries data.form so one endpoint serves both forms
  [].forEach.call(d.querySelectorAll('form[data-form]'),function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();var ok=true,first=null;
      [].forEach.call(f.querySelectorAll('[data-required]'),function(el){
        var v=(el.value||'').trim(),bad=!v||(el.type==='email'&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)),er=d.getElementById(el.id+'-err');
        if(er)er.textContent=bad?el.getAttribute('data-required'):'';el.setAttribute('aria-invalid',bad?'true':'false');if(bad){ok=false;if(!first)first=el}});
      if(!ok){first.focus();return}
      var data={};new FormData(f).forEach(function(v,k){data[k]=data[k]?data[k]+', '+v:v});
      var id=f.getAttribute('data-form'),okBox=d.getElementById(id+'-ok'),fail=d.getElementById(id+'-fail');
      var done=function(live){fail.hidden=true;f.hidden=true;[].forEach.call(okBox.parentNode.children,function(n){if(n!==okBox)n.hidden=true});okBox.querySelector('[data-live]').hidden=!live;okBox.querySelector('[data-draft]').hidden=live;okBox.hidden=false;okBox.focus()};
      if(!FORM_ENDPOINT){done(false);return}
      data.form=id;
      fetch(FORM_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
        .then(function(r){if(!r.ok)throw new Error('status '+r.status);done(true);
          // Analytics and logs only if the visitor allowed it; no email, organization, or free text.
          captureAnalytics('form_submitted',{form:id,priority:data['mv-priority']||null,region:data['mv-region']||null});
          logAnalytics('contact form submitted',{form:id})}).catch(function(){logAnalytics('contact form submission failed',{form:id});fail.hidden=false;fail.focus()});
    });
  });
})();

// platform diagram: select a box to show its impact and highlight the parts it works with
(function(){
  var d=document;
  [].forEach.call(d.querySelectorAll('[data-pd]'),function(pd){
    var nodes=[].slice.call(pd.querySelectorAll('.pd-n')),infos=[].slice.call(pd.querySelectorAll('.pd-info')),panel=pd.querySelector('.pd-panel');
    function pick(id,user){
      var info=null;infos.forEach(function(i){var on=i.getAttribute('data-id')===id;i.classList.toggle('on',on);if(on)info=i});
      if(!info)return;var rel=info.getAttribute('data-rel').split(' ');
      nodes.forEach(function(n){var k=n.getAttribute('data-id');n.classList.toggle('on',k===id);n.setAttribute('aria-pressed',k===id?'true':'false');
        n.classList.toggle('rel',rel.indexOf(k)>-1)});
      pd.classList.add('sel');
      // stacked layout: bring the panel into view if it is off screen
      if(user&&window.matchMedia('(max-width:1180px)').matches){var r=panel.getBoundingClientRect();
        if(r.top<0||r.top>window.innerHeight*.7)panel.scrollIntoView({behavior:'smooth',block:'start'})}
    }
    pd.addEventListener('click',function(e){var b=e.target.closest('[data-go],.pd-n');if(b&&pd.contains(b))pick(b.getAttribute('data-go')||b.getAttribute('data-id'),true)});
    pick(pd.getAttribute('data-start'),false);
  });
})();

// homepage principles: select a discipline to highlight the principles taken from it; select it again to clear
(function(){
  [].forEach.call(document.querySelectorAll('[data-pr]'),function(pr){
    var btns=[].slice.call(pr.querySelectorAll('.vb-disc button')),items=[].slice.call(pr.querySelectorAll('li[data-k]'));
    pr.addEventListener('click',function(e){
      var b=e.target.closest('.vb-disc button');if(!b)return;
      var k=b.getAttribute('aria-pressed')==='true'?null:b.getAttribute('data-k');
      btns.forEach(function(x){x.setAttribute('aria-pressed',x===b&&k?'true':'false')});
      items.forEach(function(i){i.classList.toggle('on',i.getAttribute('data-k')===k)});
      pr.classList.toggle('sel',!!k);
    });
  });
})();
// underlined key words, the timeline, the signal lines, and the scroll-driven loop
(function(){
  var d=document,still=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function bg(){return getComputedStyle(d.body).backgroundColor||'#03141E'}
  function accent(){return getComputedStyle(d.documentElement).getPropertyValue('--accent').trim()||'#5EE0CF'}
  function fit(cv){var r=Math.min(window.devicePixelRatio||1,2),w=cv.clientWidth,h=cv.clientHeight;cv.width=Math.round(w*r);cv.height=Math.round(h*r);
    var c=cv.getContext('2d');c.setTransform(r,0,0,r,0,0);return {c:c,w:w,h:h}}
  function animate(cv,draw){
    var raf=null,vis=true,t=0;function loop(){t+=1;draw(t);raf=vis?requestAnimationFrame(loop):null}
    draw(0);if(still)return;
    if('IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis&&!raf)raf=requestAnimationFrame(loop)}).observe(cv);
    else raf=requestAnimationFrame(loop);
  }

  // key words and the timeline draw in when they come into view
  var drawn=[].slice.call(d.querySelectorAll('mark,.vb-panel'));
  if('IntersectionObserver' in window&&!still){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{rootMargin:'0px 0px -12% 0px'});
    drawn.forEach(function(el){io.observe(el)})}
  else drawn.forEach(function(el){el.classList.add('on')});

  // signal lines: quiet contour lines, with one accent line carrying a pulse from left to right
  var wv=d.querySelector('.vb-wave');
  if(wv&&wv.getContext){
    var gw,muted;var sz=function(){gw=fit(wv);muted=getComputedStyle(d.documentElement).getPropertyValue('--outline').trim()||'#3F6878'};sz();window.addEventListener('resize',sz);
    var y=function(u,k,tt){return .5+.16*Math.sin(u*4.2+k*.9+tt)+.08*Math.sin(u*9.5-k*.5-tt*1.3)+.05*Math.sin(u*17+k*2.1+tt*.6)};
    animate(wv,function(t){var c=gw.c,a=accent(),tt=t*.006,N=9,STEP=6;c.clearRect(0,0,gw.w,gw.h);
      for(var k=0;k<N;k++){var off=(k-(N-1)/2)*.07,sig=k===4;c.beginPath();
        for(var x=0;x<=gw.w;x+=STEP){var u=x/gw.w,yy=(y(u,k,tt)+off)*gw.h;x?c.lineTo(x,yy):c.moveTo(x,yy)}
        c.strokeStyle=sig?a:muted;c.globalAlpha=sig?.9:.18+.05*Math.abs(4-k);c.lineWidth=sig?1.6:1;c.stroke()}
      var p=(t*.0025)%1,px=p*gw.w,py=(y(p,4,tt))*gw.h;c.globalAlpha=1;
      var gr=c.createRadialGradient(px,py,0,px,py,26);gr.addColorStop(0,a);gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.globalAlpha=.35;c.fillRect(px-26,py-26,52,52);
      c.globalAlpha=1;c.fillStyle=a;c.beginPath();c.arc(px,py,3.5,0,6.3);c.fill();
    });
  }

  // loop: on wide screens the deck is sticky and the step follows the scroll position
  var lp=d.querySelector('.vb-loop');
  if(lp){
    var steps=[].slice.call(lp.querySelectorAll('.vb-step')),bar=lp.querySelector('.vb-bar'),cnt=lp.querySelector('.vb-count b');
    var mq=window.matchMedia('(min-width:1001px) and (prefers-reduced-motion:no-preference)');
    // two steps in view, gliding like water: the scroll sets a target, and each frame the track eases a tenth of the way
    // towards it, so the motion keeps flowing between scroll events and settles softly
    var terms=[].slice.call(lp.querySelectorAll('.vb-term')),n=steps.length,max=Math.max(1,n-2),pos=0,goal=0,raf=null,live=false;
    var pad=function(k){return(k<10?'0':'')+k};
    [steps,terms].forEach(function(l){l.forEach(function(e,j){e.style.setProperty('--j',j)})});
    var paint=function(){
      lp.style.setProperty('--s',pos.toFixed(4));
      [steps,terms].forEach(function(l){l.forEach(function(e,j){
        var rel=j-pos,o=Math.max(0,Math.min(1,1-Math.max(0,-rel,rel-1)*1.6));
        e.style.setProperty('--o',o.toFixed(3));e.style.visibility=o>0?'':'hidden';   // hidden cards keep their links out of the tab order
        if(l===steps)e.classList.toggle('on',rel>-.5&&rel<1.5)})});
      var a=Math.round(pos);bar.style.setProperty('--p',((pos+2)/n*100)+'%');cnt.innerHTML=pad(a+1)+'&ndash;'+pad(a+2)};
    var tick=function(){pos+=(goal-pos)*.1;if(Math.abs(goal-pos)<.0005)pos=goal;paint();raf=pos!==goal?requestAnimationFrame(tick):null};
    var on=function(){
      if(!mq.matches){live=false;steps.forEach(function(s){s.classList.add('on');s.style.visibility=''});return}
      var r=lp.getBoundingClientRect(),span=lp.offsetHeight-window.innerHeight,p=Math.min(1,Math.max(0,-r.top/Math.max(span,1)));
      goal=p*max;if(!live){live=true;pos=goal;paint();return}
      if(!raf)raf=requestAnimationFrame(tick)};
    window.addEventListener('scroll',on,{passive:true});window.addEventListener('resize',on);on();
  }
})();

// footer: draw the line in, then send a pulse along it and narrate the decision in each industry it passes
(function(){
  var d=document,sc=d.querySelector('.vb-scape');if(!sc)return;
  var still=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var svg=sc.querySelector('svg'),line=sc.querySelector('.vb-line'),comet=sc.querySelector('.vb-comet'),head=sc.querySelector('.vb-head'),view=sc.querySelector('.vb-scape-view');
  var labels=[].slice.call(sc.querySelectorAll('.vb-scape-labels a')),st=sc.querySelector('.vb-say'),k=st.querySelector('.vb-say-k'),tx=st.querySelector('.vb-say-t');
  if(!line.getTotalLength)return;
  var L=line.getTotalLength(),TAIL=140,cur=0;
  line.style.setProperty('--len',L);comet.style.strokeDasharray=TAIL+' '+(L+TAIL);comet.style.strokeDashoffset=TAIL;
  // the x at which each industry's stretch ends, from the label positions
  var cuts=labels.map(function(a,i){var x=parseFloat(a.style.getPropertyValue('--x'))/100,nx=labels[i+1]?parseFloat(labels[i+1].style.getPropertyValue('--x'))/100:1.2;return (x+nx)/2*1600});
  function say(i){if(i===cur)return;cur=i;labels.forEach(function(a,j){a.classList.toggle('on',j===i)});st.classList.add('swap');
    setTimeout(function(){k.innerHTML=labels[i].innerHTML;tx.textContent=labels[i].getAttribute('data-say');st.classList.remove('swap')},300)}
  function pan(x){var vw=view.clientWidth,sw=svg.clientWidth;if(sw<=vw+2){svg.style.transform='';return}
    var s=sw/1600,off=Math.max(vw-sw,Math.min(0,vw/2-x*s));svg.style.transform='translateX('+off+'px)'}
  labels.forEach(function(a,i){a.addEventListener('mouseenter',function(){say(i)});a.addEventListener('focus',function(){say(i)})});
  if(still||!('IntersectionObserver' in window)){sc.classList.add('drawn');return}
  var started=false,vis=false,raf=null,t0=0,DUR=22000;
  function frame(now){raf=null;if(!vis)return;if(!t0)t0=now;var p=((now-t0)%DUR)/DUR,len=p*L,pt=line.getPointAtLength(len);
    comet.style.strokeDashoffset=TAIL-len;head.setAttribute('cx',pt.x);head.setAttribute('cy',pt.y);
    for(var i=0;i<cuts.length;i++)if(pt.x<cuts[i]){say(i);break}
    pan(pt.x);raf=requestAnimationFrame(frame)}
  new IntersectionObserver(function(es){vis=es[0].isIntersecting;
    if(vis&&!started){started=true;sc.classList.add('drawn');setTimeout(function(){sc.classList.add('run');t0=0;if(!raf)raf=requestAnimationFrame(frame)},3000);return}
    if(vis&&started&&sc.classList.contains('run')&&!raf)raf=requestAnimationFrame(frame)},{threshold:.25}).observe(sc);
})();
