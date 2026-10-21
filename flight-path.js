/* A single smooth pass from right to left, using the shared flight clock. */
(() => {
 const flight=document.querySelector('[data-promo-flight]');
 if(!flight)return;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let flightWidth=0,viewportWidth=0;
 function render(){
  if(!flight.isConnected||reduced.matches)return;
  if(!flight.hidden&&!document.hidden){
   const anim=flight.getAnimations().find(a=>a.animationName==='promo-flyby');
   const duration=Number(anim?.effect.getComputedTiming().duration)||13000;
   const p=Math.min(1,Math.max(0,Number(anim?.currentTime||0)/duration));
   if(!flightWidth||viewportWidth!==window.innerWidth){
    flightWidth=flight.offsetWidth;viewportWidth=window.innerWidth;
   }
   const x=viewportWidth-(viewportWidth+flightWidth)*p;
   flight.style.transform='translate3d('+x.toFixed(3)+'px,0,0)';
  }
  requestAnimationFrame(render);
 }
 render();
})();
