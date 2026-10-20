/* Segmented cloth surface: the text and fabric bend together in real CSS depth. */
(() => {
 const flight=document.querySelector('[data-promo-flight]');
 const banner=flight?.querySelector('.promo-flight-banner');
 const link=banner?.querySelector('a');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 if(!banner||!link||reduced.matches)return;
 const mesh=document.createElement('span');
 mesh.className='promo-cloth-mesh';mesh.setAttribute('aria-hidden','true');
 const count=24,slices=[];
 for(let i=0;i<count;i++){
  const slice=document.createElement('span'),ink=document.createElement('span');
  slice.className='promo-cloth-slice';ink.className='promo-cloth-ink';
  ink.textContent=link.textContent;slice.append(ink);mesh.append(slice);slices.push({slice,ink});
 }
 let width=0,height=0;
 function measure(){
  if(!banner.clientWidth)return false;
  width=banner.clientWidth;height=banner.clientHeight;
  const style=getComputedStyle(banner),text=getComputedStyle(link);
  slices.forEach(({slice,ink},i)=>{
   slice.style.left=(i*width/count)+'px';slice.style.width=(width/count+.7)+'px';
   ink.style.width=width+'px';ink.style.height=height+'px';ink.style.left=(-i*width/count)+'px';
   ink.style.padding=[style.paddingTop,style.paddingRight,style.paddingBottom,style.paddingLeft].join(' ');
   ink.style.font=text.font;ink.style.whiteSpace=text.whiteSpace;
  });
  if(!mesh.isConnected){banner.append(mesh);banner.classList.add('has-wave');}
  return true;
 }
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(()=>{if(!flight.hidden)measure();}):null;
 observer?.observe(banner);
 function render(){
  if(!flight.isConnected||reduced.matches){observer?.disconnect();return;}
  if(!flight.hidden&&!document.hidden&&(width||measure())){
   const anim=flight.getAnimations().find(a=>a.animationName==='promo-flyby');
   const duration=Number(anim?.effect.getComputedTiming().duration)||13000;
   const time=Number(anim?.currentTime||0)/1000;
   const roll=Math.max(0,Math.min(1,(time/(duration/1000)-.35)/.30));
   const amplitude=6+10*Math.sin(roll*Math.PI)**2;
   slices.forEach(({slice},i)=>{
    const u=(i+.5)/count,phase=time*4.2-u*Math.PI*4,envelope=u**.65;
    const depth=Math.sin(phase)*amplitude*envelope;
    const slope=(-Math.cos(phase)*Math.PI*4*envelope+.65*Math.sin(phase)*u**(-.35))*amplitude/width;
    const angle=-Math.atan(slope)*180/Math.PI;
    slice.style.transform='translate3d(0,'+(Math.sin(phase+.4)*1.4*u).toFixed(3)+'px,'+depth.toFixed(3)+'px) rotateY('+angle.toFixed(3)+'deg)';
    slice.style.filter='brightness('+(1+Math.sin(phase+.65)*.13*envelope).toFixed(3)+')';
   });
  }
  requestAnimationFrame(render);
 }
 render();
})();
