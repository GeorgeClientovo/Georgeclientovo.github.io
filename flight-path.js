/* One continuous route and camera approach, sampled from the shared paused flight clock. */
(() => {
 const flight=document.querySelector('[data-promo-flight]');
 const trailer=flight?.querySelector('.promo-trailer');
 if(!flight||!trailer)return;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const bezier=(a,b,c,d,t)=>{const u=1-t;return u*u*u*a+3*u*u*t*b+3*u*t*t*c+t*t*t*d;};
 const ease=t=>t*t*(3-2*t);
 function render(){
  if(!flight.isConnected||reduced.matches)return;
  if(!flight.hidden&&!document.hidden){
   const anim=flight.getAnimations().find(a=>a.animationName==='promo-flyby');
   const duration=Number(anim?.effect.getComputedTiming().duration)||18000;
   const p=Math.min(1,Math.max(0,Number(anim?.currentTime||0)/duration));
   const w=window.innerWidth,h=window.innerHeight,anchor=w<=600?54:71;
   let x=1-1.3*p,y=0,scale=1;
   if(p>.47){
    const t=(p-.47)/.53,exit=Math.max(0,(t-.8)/.2);
    // Match the incoming horizontal velocity at the join, then curve gently right.
    x=bezier(.389,.389-1.3*.53/3,.40,1.10,t)+6*exit*exit*exit;
    y=bezier(0,0,.04,.17,t)*h;
    scale=1/(1-.96*t*t*t);
   }
   flight.style.transform='translate3d('+(x*w-anchor).toFixed(3)+'px,'+y.toFixed(3)+'px,0) scale('+scale.toFixed(5)+')';
   const turn=ease(Math.max(0,Math.min(1,(p-.50)/.26)));
   trailer.style.transform='translateX('+(-61*turn).toFixed(3)+'px) rotateY('+(104*turn).toFixed(3)+'deg)';
  }
  requestAnimationFrame(render);
 }
 render();
})();
