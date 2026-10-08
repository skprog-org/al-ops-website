(function(){
  var d=document,root=d.documentElement;

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
    dlg.querySelector('[data-download]').addEventListener('click',function(){var a=d.createElement('a');a.href=URL.createObjectURL(new Blob([text()],{type:'text/plain'}));a.download='evidence-record-illustrative.txt';d.body.appendChild(a);a.click();a.remove()});
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
        reset();rp.classList.add('playing');rbs.forEach(function(b){b.textContent='Replaying…';b.disabled=true});var i=0;
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
    btn.addEventListener('click',function(){added=true;P.quality.use='next';btn.disabled=true;btn.textContent='Model onboarded';note.textContent='The complex-reasoning route now points to the new model. Workflows did not change. Promote it only after it passes the same evaluation suite.';render()});
    render();
  }

  // readiness self-check: scored locally, nothing is sent
  var rc=d.getElementById('readiness');
  if(rc){
    var boxes=[].slice.call(rc.querySelectorAll('input[type="checkbox"]')),areas=[].slice.call(rc.querySelectorAll('fieldset[data-area]'));
    var bar=d.getElementById('rd-bar'),sc=d.getElementById('rd-score'),rh=d.getElementById('rd-h'),rp=d.getElementById('rd-p'),nx=d.getElementById('rd-next');
    var bands=[[0,'Starting point','AI is still a set of experiments. Agree what the business should achieve and who owns it before adding more pilots.'],
      [.25,'Experimenting','Some foundations exist, but value is unlikely to show up in the results yet. Choose one core workflow and redesign it end to end.'],
      [.55,'Scaling','The basics are in place in several areas. Close the gaps below so each new workflow builds on the last instead of starting again.'],
      [.8,'Ready to expand','Ownership, controls and evidence are in place. Expand into more core workflows, and give agents more authority one workflow at a time as evaluations support it.']];
    var upd=function(){
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
      else nx.hidden=true;
    };
    boxes.forEach(function(b){b.addEventListener('change',upd)});upd();
  }

  // A/B landing test: a visitor who arrives through a variant keeps it for the session, and the contact form sends it
  // with the enquiry ("a" for everyone who did not come through a variant page)
  var variant=null;
  try{var vq=/[?&]variant=([a-z0-9-]{1,20})(?:&|$)/i.exec(location.search);if(vq)sessionStorage.setItem('variant',vq[1].toLowerCase());variant=sessionStorage.getItem('variant')}catch(e){}
  [].forEach.call(d.querySelectorAll('input[data-variant]'),function(i){i.value=variant||'a'});

  // forms: inline errors, data kept on failure, honest confirmation when delivery is not configured
  var FORM_ENDPOINT='';  // set to an HTTPS endpoint that accepts a JSON POST to deliver submissions
  [].forEach.call(d.querySelectorAll('form[data-form]'),function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();var ok=true,first=null;
      [].forEach.call(f.querySelectorAll('[data-required]'),function(el){
        var v=(el.value||'').trim(),bad=!v||(el.type==='email'&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)),er=d.getElementById(el.id+'-err');
        if(er)er.textContent=bad?el.getAttribute('data-required'):'';el.setAttribute('aria-invalid',bad?'true':'false');if(bad){ok=false;if(!first)first=el}});
      if(!ok){first.focus();return}
      var data={};new FormData(f).forEach(function(v,k){data[k]=data[k]?data[k]+', '+v:v});
      var id=f.getAttribute('data-form'),okBox=d.getElementById(id+'-ok'),fail=d.getElementById(id+'-fail');
      var done=function(live){fail.hidden=true;f.hidden=true;okBox.querySelector('[data-live]').hidden=!live;okBox.querySelector('[data-draft]').hidden=live;okBox.hidden=false;okBox.focus()};
      if(!FORM_ENDPOINT){done(false);return}
      fetch(FORM_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
        .then(function(r){if(!r.ok)throw new Error('status '+r.status);done(true)}).catch(function(){fail.hidden=false;fail.focus()});
    });
  });
})();
