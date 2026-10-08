// homepage variant B: underlined key words, the timeline, the signal lines, and the scroll-driven loop
(function(){
  var d=document,still=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try{sessionStorage.setItem('variant','b')}catch(e){}   // so an enquiry made later in the visit is attributed to B
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
  var drawn=[].slice.call(d.querySelectorAll('.vb mark,.vb-panel'));
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
