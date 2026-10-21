/* Lightweight, locally rendered 3D propeller plane. No external assets or libraries. */
(() => {
 const flight = document.querySelector('[data-promo-flight]');
 const shell = flight?.querySelector('.promo-plane-shell');
 const canvas = shell?.querySelector('canvas');
 if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
 const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
 if (!gl) return; // Keep the SVG fallback.
 const vertexSource = `
 attribute vec3 aPosition, aNormal, aColor;
 attribute float aSpin;
 uniform float uRoll, uPitch, uSpin, uAspect, uYaw;
 varying vec3 vColor;
 mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
 mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
 mat3 rz(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
 void main(){
  mat3 model=rz(uPitch)*ry(uYaw)*rx(.42+uRoll);
  mat3 prop=rx(aSpin*uSpin);
  vec3 p=model*(prop*aPosition), n=normalize(model*(prop*aNormal));
  float diffuse=max(dot(n,normalize(vec3(-.4,.8,1.))),0.);
  float rim=pow(1.-abs(n.z),3.)*.12;
  vColor=aColor*(.48+.52*diffuse)+rim;
  gl_Position=vec4(p.x*.64/uAspect,p.y*.64,-p.z*.15,1.);
 }`;
 const fragmentSource = `
 precision mediump float;
 varying vec3 vColor;
 void main(){gl_FragColor=vec4(vColor,1.);}
 `;
 function shader(type, source) {
  const s=gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);return null;}
  return s;
 }
 const vs=shader(gl.VERTEX_SHADER,vertexSource),fs=shader(gl.FRAGMENT_SHADER,fragmentSource);
 if(!vs||!fs)return;
 const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;
 const vertices=[];
 const white=[.93,.96,1],blue=[.12,.35,.91],navy=[.055,.10,.20],glass=[.23,.64,.87],orange=[1,.48,.13];
 function tri(a,b,c,color,spin=0){
  const u=b.map((n,i)=>n-a[i]),v=c.map((n,i)=>n-a[i]);
  const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  const l=Math.hypot(...n)||1;
  for(const p of [a,b,c])vertices.push(...p,...n.map(x=>x/l),...color,spin);
 }
 function ellipsoid(center,radius,color,rings=12,sides=20){
  const point=(i,j)=>{const a=i*Math.PI/rings,b=j*2*Math.PI/sides;return [center[0]+radius[0]*Math.cos(a),center[1]+radius[1]*Math.sin(a)*Math.cos(b),center[2]+radius[2]*Math.sin(a)*Math.sin(b)];};
  for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){
   const a=point(i,j),b=point(i+1,j),c=point(i+1,j+1),d=point(i,j+1);
   tri(a,b,c,color);tri(a,c,d,color);
  }
 }
 function slab(points,thickness,color){
  const [a,b,c]=points;
  if((c[2]-a[2])*(b[0]-a[0])-(c[0]-a[0])*(b[2]-a[2])<0)points=[...points].reverse();
  const top=points.map(p=>[p[0],p[1]+thickness/2,p[2]]),bottom=points.map(p=>[p[0],p[1]-thickness/2,p[2]]);
  for(let i=1;i<points.length-1;i++){tri(top[0],top[i+1],top[i],color);tri(bottom[0],bottom[i],bottom[i+1],color);}
  for(let i=0;i<points.length;i++){const j=(i+1)%points.length;tri(top[i],top[j],bottom[j],color);tri(top[i],bottom[j],bottom[i],color);}
 }
 // Rounded fuselage, dark engine cowling, tinted canopy, swept wings and tail.
 ellipsoid([0,0,0],[1.63,.22,.23],white);
 ellipsoid([-1.48,0,0],[.32,.225,.235],blue);
 ellipsoid([-.33,.21,0],[.53,.27,.205],glass);
 for(const side of [-1,1]){
  slab([[-.62,-.04,0],[-.14,-.04,side*1.48],[.36,-.04,side*1.42],[.13,-.04,0]],.065,blue);
  slab([[1.03,.10,0],[1.32,.10,side*.65],[1.65,.10,side*.61],[1.57,.10,0]],.045,white);
  slab([[-.17,-.035,side*1.30],[-.14,-.035,side*1.48],[.36,-.035,side*1.42],[.33,-.035,side*1.26]],.075,orange);
 }
 // Vertical stabiliser, with visible thickness.
 const finA=[1.10,.10,-.035],finB=[1.45,.77,-.035],finC=[1.73,.77,-.035],finD=[1.65,.10,-.035];
 const other=p=>[p[0],p[1],.035];
 tri(finA,finB,finC,blue);tri(finA,finC,finD,blue);
 tri(other(finA),other(finC),other(finB),blue);tri(other(finA),other(finD),other(finC),blue);
 tri(finB,other(finB),other(finC),white);tri(finB,other(finC),finC,white);
 // Three spinning propeller blades about the plane's longitudinal axis.
 for(let i=0;i<3;i++){
  const a=i*2*Math.PI/3;
  const p=(r,t)=>[-1.87,r*Math.cos(a+t),r*Math.sin(a+t)];
  tri(p(.07,-.24),p(.52,-.10),p(.52,.10),navy,1);
  tri(p(.07,-.24),p(.52,.10),p(.07,.24),navy,1);
 }
 ellipsoid([-1.90,0,0],[.12,.08,.08],orange,8,12);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
 gl.useProgram(program);
 const stride=40;
 for(const [name,size,offset] of [['aPosition',3,0],['aNormal',3,12],['aColor',3,24],['aSpin',1,36]]){
  const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,stride,offset);
 }
 const uniforms=Object.fromEntries(['uRoll','uPitch','uSpin','uAspect','uYaw'].map(name=>[name,gl.getUniformLocation(program,name)]));
 gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
 shell.classList.add('has-3d-plane');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let cleaned=false;
 function cleanup(){
  if(cleaned)return;cleaned=true;
  gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
 }
 function render(){
  if(cleaned)return;
  if(!flight.isConnected||reduced.matches){cleanup();return;}
  if(!flight.hidden&&!document.hidden){
   const anim=flight.getAnimations().find(a=>a.animationName==='promo-flyby');
   const duration=anim?.effect.getComputedTiming().duration||13000;
   const time=Number(anim?.currentTime||0)/1000,p=Math.min(time/(duration/1000),1);
   const rollProgress=Math.max(0,Math.min(1,(p-.35)/.30));
   const easedRoll=rollProgress*rollProgress*(3-2*rollProgress);
   const roll=easedRoll*Math.PI*2;
   const bank=Math.sin(time*1.4)*.055+Math.sin(time*.65)*.035;
   const pitch=Math.cos(time*1.4)*.025+Math.cos(time*.65)*.016;
   // A fixed drawing buffer avoids mid-flight resizing stalls.
   const dpr=Math.min((window.devicePixelRatio||1)*2,4),w=Math.round(shell.clientWidth*dpr),h=Math.round(shell.clientHeight*dpr);
   if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
   // WebGL's upward Y axis reverses the visible roll relative to CSS rotateX.
   gl.uniform1f(uniforms.uYaw,-.28);
   gl.uniform1f(uniforms.uRoll,-roll+bank);gl.uniform1f(uniforms.uPitch,pitch);
   gl.uniform1f(uniforms.uSpin,time*32);gl.uniform1f(uniforms.uAspect,w/h);
   gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,vertices.length/10);
  }
  requestAnimationFrame(render);
 }
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();shell.classList.remove('has-3d-plane');cleanup();});
 render();
})();
