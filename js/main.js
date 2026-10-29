import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const $=id=>document.getElementById(id);
const boot=$('boot'), app=$('app'), status=$('boot-status'), bar=$('load-bar'), retry=$('retry');
let renderer,scene,camera,clock,world,player,weapon,enemies=[],objects=[],state='boot',raf=0,quality='low';
let yaw=0,pitch=0,health=100,ammo=30,reserve=90,reloading=false,fireHeld=false,aiming=false,sprinting=false,crouching=false,paused=false;
let moveX=0,moveY=0,lookPointer=null,lastLookX=0,lastLookY=0,stickPointer=null,stickOrigin={x:0,y:0},lastShot=0,damageCooldown=0;
let objective=0,missionStarted=false,deviceCollected=false,dead=false,cinematicStart=0,cinematicDuration=82000,subtitlesOn=true,narrationOn=true,masterVol=.65,voiceVol=.9,musicVol=.35,fxVol=.7,sensitivity=1;
let audioCtx=null, ambienceNodes=[], lastFoot=0, lastSubtitle='', audioFiles={};
const SCRIPT=[
[0,4500,'THE WORLD HAS NEVER BEEN CLOSER TO THE EDGE.'],
[4500,10500,'Across the Middle East, alliances are breaking.'],
[10500,16500,'Old enemies are preparing for a conflict no government is willing to admit has already begun.'],
[16500,20500,'September twenty-second, twenty twenty-six.'],
[20500,27500,'An Iranian presidential aircraft lands in Algeria for what appears to be a routine technical stop.'],
[27500,34500,'Weeks later, classified intelligence suggests that something far more important may have crossed the region: technology capable of changing the balance of power.'],
[34500,40000,'Washington sees a strategic threat. Tehran denies the allegations.'],
[40000,45500,'Algiers finds itself at the center of a storm it never asked for.'],
[45500,51500,'Diplomatic pressure becomes economic warfare. Economic warfare becomes military mobilization.'],
[51500,58500,'Across the region, governments fracture, streets fill with protesters, and rival powers prepare for consequences they may no longer be able to control.'],
[58500,64000,'But the most dangerous secret is not the technology.'],
[64000,69500,'It is the identity of the people determined to start a war.'],
[69500,75000,'Someone is manipulating intelligence. Someone is moving forces into position.'],
[75000,79000,'And someone believes a global conflict is the only way to reshape the world.'],
[79000,82000,'The first shot has not yet been fired. But the countdown has already begun.']
];
function showError(msg){status.textContent=msg;retry.hidden=false}
async function bootGame(){
 retry.hidden=true;status.textContent='LOADING THREE.JS RENDERING ENGINE…';bar.style.width='12%';
 try{
  if(!window.WebGLRenderingContext) throw new Error('WebGL is not supported by this browser. Try current Chrome with hardware acceleration enabled.');
  renderer=new THREE.WebGLRenderer({canvas:$('game-canvas'),antialias:false,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.35));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  scene=new THREE.Scene();scene.background=new THREE.Color(0x9c9a83);scene.fog=new THREE.FogExp2(0xb0a88d,.012);
  camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.08,220);clock=new THREE.Clock();
  bar.style.width='42%';status.textContent='BUILDING PROCEDURAL ENVIRONMENT…';
  buildWorld();bar.style.width='78%';status.textContent='CONNECTING GAMEPLAY SYSTEMS…';
  setupEvents();resize();app.hidden=false;boot.hidden=true;
  animate();state='menu';showScreen('start-screen');
 }catch(e){console.error(e);showError('INITIALIZATION FAILED: '+(e.message||'Unknown error')+'. Check your internet connection and reload. Three.js is required for 3D rendering.');}
}
retry.addEventListener('click',()=>{if(renderer){renderer.dispose();renderer=null}bootGame()});
function mat(color,rough=.9,metal=0){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal})}
const M={sand:mat(0x9d8c69),concrete:mat(0x77766b),dark:mat(0x353a34),green:mat(0x4c5846),metal:mat(0x505953,.5,.45),cloth:mat(0x525b4a),enemy:mat(0x373d38),light:mat(0xc2b994),red:mat(0x813e31),glass:mat(0x4b5d5b,.25,.25)};
function box(parent,x,y,z,w,h,d,material,cast=true){let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m}
function cyl(parent,x,y,z,r1,r2,h,material,seg=8){let m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),material);m.position.set(x,y,z);parent.add(m);return m}
function buildWorld(){
 world=new THREE.Group();scene.add(world);
 const ground= new THREE.Mesh(new THREE.PlaneGeometry(220,220),M.sand);ground.rotation.x=-Math.PI/2;ground.position.y=-.08;ground.receiveShadow=true;world.add(ground);
 // layered rocky horizon
 for(let i=0;i<22;i++){let x=(i%11-5)*15, z=-58-Math.floor(i/11)*24;let h=5+(i*7%12);let hill=new THREE.Mesh(new THREE.ConeGeometry(9+(i%4)*3,h,5),mat(i%2?0x77755e:0x88816a));hill.position.set(x,h/2-1,z);hill.rotation.y=i*.6;world.add(hill)}
 // outpost perimeter walls, intentional gaps
 box(world,0,1,-24,38,2,1.1,M.concrete);box(world,-19,1,-7,1.1,2,34,M.concrete);box(world,19,1,-7,1.1,2,34,M.concrete);box(world,-10,1,10,18,2,1.1,M.concrete);
 // wall braces
 for(let x=-17;x<=17;x+=4){box(world,x,1.15,-23.3,.18,2.3,.2,M.light);box(world,x,1.15,9.5,.18,2.3,.2,M.light)}
 // central building at x=-8 z=-13
 box(world,-8,1.7,-14,10,3.4,7,M.concrete);box(world,-8,3.5,-14,10.4,.35,7.4,M.dark);
 for(let x=-11.5;x<=-4.5;x+=3.5){box(world,x,1.65,-10.43,1.1,1.7,.12,M.dark);box(world,x,2.2,-10.34,.8,.55,.08,M.glass)}
 // comms facility far side
 box(world,8,2,-36,12,4,9,M.concrete);box(world,8,4.1,-36,12.4,.35,9.4,M.dark);
 box(world,8,1.3,-31.35,2.2,2.6,.15,M.dark);box(world,3.7,2.5,-31.32,1.2,.7,.12,M.glass);box(world,12.3,2.5,-31.32,1.2,.7,.12,M.glass);
 // tower
 box(world,15,3,-19,.4,6,.4,M.metal);box(world,15,6,-19,3,.25,3,M.metal);box(world,15,6.5,-19,2.3,.6,2.3,M.dark);
 cyl(world,15,7.4,-19,.12,.12,1.4,M.metal,8);cyl(world,15,8.2,-19,.8,.8,.12,M.metal,12);
 // radio dish
 let dish=new THREE.Mesh(new THREE.SphereGeometry(1.1,12,8,0,Math.PI*2,0,Math.PI*.48),M.light);dish.position.set(3,5,-39);dish.rotation.x=Math.PI;world.add(dish);cyl(world,3,3.6,-39,.13,.13,2.8,M.metal);
 // barriers, crates, sandbags
 for(let i=0;i<7;i++){let x=-15+i*4.5;box(world,x,.65,2.8,2.8,1.3,.7,i%2?M.dark:M.concrete);box(world,x,.28,2.2,3,.25,1,M.sand)}
 for(let i=0;i<10;i++){let x=-16+(i%5)*2.5,z=-2-Math.floor(i/5)*3;box(world,x,.55,z,.9,1.1,.9,M.dark);box(world,x,.25,z,.96,.12,.96,M.light)}
 // road / vehicle
 box(world,0,.005,-18,5,.02,60,mat(0x6f6959),false);
 const truck=new THREE.Group();world.add(truck);truck.position.set(-12,0,-3);
 box(truck,0,1,0,3.4,1.5,5,M.green);box(truck,0,2,1.15,2.8,1.1,2.1,M.dark);box(truck,0,2,1.15,2.2,.8,.1,M.glass);
 for(let x of [-1.7,1.7])for(let z of [-1.6,1.6]){let w=cyl(truck,x,.55,z,.48,.48,.25,M.dark,12);w.rotation.z=Math.PI/2}
 // equipment pickup at start
 let station=new THREE.Group();station.position.set(-5,0,4);world.add(station);box(station,0,.7,0,2.2,1.4,1.2,M.dark);box(station,0,1.45,0,2.3,.12,1.3,M.metal);box(station,.25,1.7,0,1.1,.25,.18,M.green);
 station.userData={type:'weapon',label:'EQUIPMENT STATION'};objects.push(station);
 // data device in comms room, marker placed near door
 const device=new THREE.Group();device.position.set(8,.95,-30.2);world.add(device);box(device,0,0,0,.6,.16,.35,M.dark);box(device,0,.1,0,.3,.04,.2,M.red);device.userData={type:'device',label:'CLASSIFIED DATA DEVICE'};objects.push(device);
 // extraction marker
 const extract=new THREE.Group();extract.position.set(0,0,13);world.add(extract);cyl(extract,0,.04,0,2.2,2.2,.08,M.green,20);cyl(extract,0,.09,0,1.65,1.65,.06,M.dark,20);extract.userData={type:'extract',label:'EXTRACTION ZONE'};objects.push(extract);
 // patrol props, sand drifts, broken structures
 for(let i=0;i<12;i++){let x=(i%4)*9-14,z=-7-Math.floor(i/4)*12;if(Math.abs(x)<5&&z>-20)continue;box(world,x,.7,z,2.8,1.4,2.4,i%3?M.concrete:M.dark);box(world,x,.18,z,3,.25,2.6,M.sand)}
 // mission boundary marker poles
 for(let x of [-21,21])for(let z of [-35,-15,5,20]){cyl(world,x,1,z,.12,.12,2,M.red,6)}
 // first-person rifle
 player=new THREE.Group();camera.add(player);scene.add(camera);
 const gun=new THREE.Group();player.add(gun);gun.position.set(.28,-.27,-.55);weapon=gun;
 box(gun,0,0,0,.16,.17,.55,M.dark);box(gun,0,-.12,.08,.12,.22,.18,M.green);box(gun,0,.08,-.22,.07,.08,.3,M.metal);box(gun,0,.01,-.45,.065,.065,.38,M.dark);box(gun,0,.1,-.03,.09,.04,.13,M.dark);
 const muzzle=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),new THREE.MeshBasicMaterial({color:0xffc66e,transparent:true,opacity:0}));muzzle.position.set(0,.01,-.68);gun.add(muzzle);gun.userData.muzzle=muzzle;
 // enemies guards with simple procedural bodies, state machines
 spawnEnemy(-1,-29,Math.PI);spawnEnemy(13,-26,Math.PI*.75);spawnEnemy(5,-40,0);
 // lighting
 scene.add(new THREE.HemisphereLight(0xc7d0ce,0x66543c,2.1));
 const sun=new THREE.DirectionalLight(0xffe2b3,2.4);sun.position.set(-20,35,14);scene.add(sun);
 // cinematic scene props: aircraft, radar, analyst room, map table, convoy silhouettes
 buildCinematicProps();
 camera.position.set(0,1.7,7);camera.rotation.order='YXZ';
}
function spawnEnemy(x,z,rot){
 let g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;world.add(g);
 const body=box(g,0,1.05,0,.62,.9,.35,M.enemy);body.userData.enemyRoot=g;
 box(g,0,1.62,0,.42,.42,.4,M.cloth);box(g,0,1.85,-.02,.4,.12,.38,M.dark);
 box(g,-.36,1.05,0,.18,.8,.2,M.cloth);box(g,.36,1.05,0,.18,.8,.2,M.cloth);
 box(g,-.17,.38,0,.2,.7,.23,M.dark);box(g,.17,.38,0,.2,.7,.23,M.dark);
 box(g,.22,1.12,-.38,.12,.12,.85,M.dark);
 g.userData={hp:100,alive:true,state:'patrol',origin:new THREE.Vector3(x,0,z),phase:Math.random()*6,fire:Math.random()*2,body};enemies.push(g);
}
function buildCinematicProps(){
 const cg=new THREE.Group();scene.add(cg);scene.userData.cinematic=cg;
 // globe/ocean
 const globe=new THREE.Mesh(new THREE.SphereGeometry(18,28,18),mat(0x233c45,.95));globe.position.set(0,0,-28);cg.add(globe);
 for(let i=0;i<16;i++){let a=i*.39;let land=new THREE.Mesh(new THREE.SphereGeometry(18.05,10,8, a,.5, .3,.8),mat(i%2?0x8e8b6c:0x9b997d));land.position.copy(globe.position);cg.add(land)}
 // aircraft model
 const plane=new THREE.Group();cg.add(plane);box(plane,0,0,0,1.2,.45,4,M.light);box(plane,0,.03,0,8,.12,1.1,M.light);box(plane,0,.15,1.5,2.5,.12,1.2,M.light);cyl(plane,-.9,-.15,-.2,.28,.28,.5,M.dark,10).rotation.z=Math.PI/2;cyl(plane,.9,-.15,-.2,.28,.28,.5,M.dark,10).rotation.z=Math.PI/2;plane.position.set(0,0,0);plane.userData.kind='plane';
 // radar tower
 const radar=new THREE.Group();cg.add(radar);cyl(radar,0,2,0,.18,.18,4,M.metal);box(radar,0,4,0,2.6,.22,.4,M.dark);box(radar,0,4.7,0,.2,1.2,.2,M.metal);radar.position.set(0,0,0);
 // table + monitor props
 const room=new THREE.Group();cg.add(room);box(room,0,0,0,9,.4,5,M.dark);for(let i=-1;i<=1;i++){box(room,i*2,1,-1.5,1.6,1.2,.12,M.glass);box(room,i*2,1,-1.4,1.3,.8,.08,M.green)}box(room,0,.5,0,7,.2,2,M.concrete);
 // map table
 const map=new THREE.Group();cg.add(map);box(map,0,0,0,7,.4,5,M.dark);box(map,0,.23,0,6.7,.06,4.7,M.light);for(let i=-2;i<=2;i++)box(map,i,.29,0,.04,.02,4,M.red,false);
 // convoy
 const convoy=new THREE.Group();cg.add(convoy);for(let i=0;i<3;i++){let t=new THREE.Group();convoy.add(t);t.position.z=i*5;box(t,0,1,0,2.6,1.2,3,M.green);box(t,0,1.9,.4,2.2,.8,1.2,M.dark);for(let x of [-1.3,1.3])for(let z of [-.9,.9])cyl(t,x,.45,z,.35,.35,.18,M.dark,10).rotation.z=Math.PI/2}
 // soldier staging
 const squad=new THREE.Group();cg.add(squad);for(let i=0;i<4;i++){let s=new THREE.Group();squad.add(s);s.position.x=(i-1.5)*1.4;box(s,0,1,0,.5,.8,.3,M.cloth);box(s,0,1.6,0,.4,.4,.35,M.dark);box(s,.2,1,-.35,.1,.1,.7,M.dark);box(s,-.14,.35,0,.18,.65,.2,M.dark);box(s,.14,.35,0,.18,.65,.2,M.dark)}
 cg.userData={globe,plane,radar,room,map,convoy,squad};
}
function showScreen(id){for(const el of document.querySelectorAll('.screen,.panel-screen'))el.hidden=true;$(id).hidden=false;document.body.classList.remove('playing')}
function toast(t){const el=$('toast');el.textContent=t;el.style.display='block';clearTimeout(el._timer);el._timer=setTimeout(()=>el.style.display='none',2200)}
function setupEvents(){
 window.addEventListener('resize',resize);
 $('start-experience').addEventListener('click',()=>{startAudio();beginCinematic()});
 $('skip-cinematic').addEventListener('click',()=>finishCinematic());
 $('new-game').addEventListener('click',startMission);
 $('continue-game').addEventListener('click',startMission);
 $('settings-open').addEventListener('click',()=>showPanel('settings-screen'));
 $('credits-open').addEventListener('click',()=>showPanel('credits-screen'));
 document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>showScreen('menu-screen')));
 $('settings-save').addEventListener('click',()=>{applySettings();showScreen(paused?'pause-screen':'menu-screen')});
 $('pause').addEventListener('click',pauseGame);$('resume').addEventListener('click',resumeGame);
 $('restart').addEventListener('click',startMission);$('result-restart').addEventListener('click',startMission);
 $('result-menu').addEventListener('click',()=>{state='menu';showScreen('menu-screen')});$('to-menu').addEventListener('click',()=>{paused=false;state='menu';showScreen('menu-screen')});
 $('pause-settings').addEventListener('click',()=>showPanel('settings-screen'));
 $('fire').addEventListener('pointerdown',e=>{e.preventDefault();fireHeld=true;shoot()});$('fire').addEventListener('pointerup',()=>fireHeld=false);$('fire').addEventListener('pointercancel',()=>fireHeld=false);$('fire').addEventListener('contextmenu',e=>e.preventDefault());
 $('aim').addEventListener('pointerdown',e=>{e.preventDefault();aiming=true;camera.fov=55;camera.updateProjectionMatrix()});$('aim').addEventListener('pointerup',stopAim);$('aim').addEventListener('pointercancel',stopAim);
 $('reload').addEventListener('click',reload);$('sprint').addEventListener('pointerdown',()=>sprinting=true);$('sprint').addEventListener('pointerup',()=>sprinting=false);$('sprint').addEventListener('pointercancel',()=>sprinting=false);
 $('crouch').addEventListener('click',()=>{crouching=!crouching;toast(crouching?'CROUCHING':'STANDING')});
 $('interact').addEventListener('click',interact);
 const zone=$('stick-zone'),base=$('stick-base'),knob=$('stick-knob');
 zone.addEventListener('pointerdown',e=>{e.preventDefault();stickPointer=e.pointerId;zone.setPointerCapture(e.pointerId);stickOrigin={x:e.clientX,y:e.clientY};updateStick(e.clientX,e.clientY)});
 zone.addEventListener('pointermove',e=>{if(stickPointer===e.pointerId){e.preventDefault();updateStick(e.clientX,e.clientY)}});
 const endStick=e=>{if(stickPointer===e.pointerId){stickPointer=null;moveX=moveY=0;knob.style.transform='translate(0,0)'}};zone.addEventListener('pointerup',endStick);zone.addEventListener('pointercancel',endStick);
 function updateStick(x,y){let dx=x-stickOrigin.x,dy=y-stickOrigin.y,len=Math.hypot(dx,dy),max=42;if(len>max){dx=dx/len*max;dy=dy/len*max}moveX=dx/max;moveY=dy/max;knob.style.transform=`translate(${dx}px,${dy}px)`}
 const look=$('look-zone');look.addEventListener('pointerdown',e=>{e.preventDefault();lookPointer=e.pointerId;lastLookX=e.clientX;lastLookY=e.clientY;look.setPointerCapture(e.pointerId)});
 look.addEventListener('pointermove',e=>{if(lookPointer===e.pointerId&&state==='playing'&&!paused){let dx=e.clientX-lastLookX,dy=e.clientY-lastLookY;lastLookX=e.clientX;lastLookY=e.clientY;yaw-=dx*.004*sensitivity;pitch-=dy*.0035*sensitivity;pitch=Math.max(-1.25,Math.min(1.2,pitch));camera.rotation.set(pitch,yaw,0,'YXZ')}});
 const endLook=e=>{if(lookPointer===e.pointerId)lookPointer=null};look.addEventListener('pointerup',endLook);look.addEventListener('pointercancel',endLook);
 window.addEventListener('keydown',e=>{if(state!=='playing'||paused)return;let k=e.key.toLowerCase();if(k==='w')moveY=-1;if(k==='s')moveY=1;if(k==='a')moveX=-1;if(k==='d')moveX=1;if(k==='shift')sprinting=true;if(k==='r')reload();if(k==='e')interact();if(k===' ')shoot()});
 window.addEventListener('keyup',e=>{let k=e.key.toLowerCase();if(['w','s'].includes(k))moveY=0;if(['a','d'].includes(k))moveX=0;if(k==='shift')sprinting=false;if(k===' ')fireHeld=false});
 window.addEventListener('contextmenu',e=>e.preventDefault());
}
function stopAim(){aiming=false;camera.fov=75;camera.updateProjectionMatrix()}
function showPanel(id){for(const el of document.querySelectorAll('.screen,.panel-screen'))el.hidden=true;$(id).hidden=false}
function applySettings(){masterVol=+$('master-volume').value;voiceVol=+$('voice-volume').value;musicVol=+$('music-volume').value;fxVol=+$('fx-volume').value;sensitivity=+$('sensitivity').value;quality=$('quality').value;subtitlesOn=$('subtitles-toggle').checked;narrationOn=$('narration-toggle').checked;if(renderer){renderer.setPixelRatio(Math.min(devicePixelRatio||1,quality==='low'?1:1.5));resize()}if(audioCtx)audioCtx.master.gain.value=masterVol}
function startAudio(){try{if(!audioCtx){let C=window.AudioContext||window.webkitAudioContext;if(!C)return;let ctx=new C();let master=ctx.createGain();master.gain.value=masterVol;master.connect(ctx.destination);audioCtx={ctx,master}; // procedural low ambient drone, optional licensed assets can replace this
let osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();osc.type='sine';osc.frequency.value=48;filter.type='lowpass';filter.frequency.value=110;gain.gain.value=.035*musicVol;osc.connect(filter);filter.connect(gain);gain.connect(master);osc.start();ambienceNodes.push({osc,gain});}audioCtx.ctx.resume()}catch(e){console.warn('Audio unavailable',e)}}
function sfx(freq=150,dur=.08,vol=.08,type='triangle'){if(!audioCtx)return;try{let c=audioCtx.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,c.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(35,freq*.45),c.currentTime+dur);g.gain.setValueAtTime(vol*fxVol*masterVol,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+dur);o.connect(g);g.connect(audioCtx.master);o.start();o.stop(c.currentTime+dur)}catch(e){}}
function beginCinematic(){state='cinematic';showScreen('start-screen');$('start-screen').hidden=true;$('cinematic-ui').hidden=false;cinematicStart=performance.now();lastSubtitle='';$('subtitle').textContent='';$('skip-cinematic').hidden=false;toast('FICTIONAL ALTERNATE-HISTORY STORY');}
function finishCinematic(){if(state!=='cinematic')return;$('cinematic-ui').hidden=true;state='menu';showScreen('menu-screen');$('continue-game').hidden=!localStorage.getItem('blackSandSaved');}
function cinematicFrame(t){
 let c=scene.userData.cinematic,el=t-cinematicStart,sec=el/1000;
 const shots=[
 {a:0,b:8,p:[0,0,12],look:[0,0,-28],obj:'globe'},
 {a:8,b:15,p:[-9,4,11],look:[0,0,0],obj:'plane'},
 {a:15,b:22,p:[12,7,12],look:[0,2,-12],obj:'globe'},
 {a:22,b:29,p:[-8,3,8],look:[0,2,0],obj:'radar'},
 {a:29,b:37,p:[9,4,8],look:[0,1,0],obj:'room'},
 {a:37,b:44,p:[0,8,7],look:[0,0,0],obj:'map'},
 {a:44,b:52,p:[-7,3,13],look:[0,1,4],obj:'convoy'},
 {a:52,b:61,p:[7,4,10],look:[0,1,0],obj:'room'},
 {a:61,b:70,p:[0,2,9],look:[0,1,0],obj:'squad'},
 {a:70,b:82,p:[0,2,10],look:[0,1,0],obj:'squad'}];
 let sh=shots.find(s=>sec>=s.a&&sec<s.b)||shots[shots.length-1],o=c[sh.obj];for(let k of ['globe','plane','radar','room','map','convoy','squad'])c[k].visible=k===sh.obj;
 if(sh.obj==='globe'){c.globe.position.set(0,0,-28);camera.position.set(Math.sin(sec*.08)*1,Math.cos(sec*.05)*2,12);camera.lookAt(0,0,-28);c.globe.rotation.y=sec*.04}
 else if(sh.obj==='plane'){camera.position.set(-9+sec*.35,4+Math.sin(sec)*.4,11-sec*.5);camera.lookAt(0,0,0);c.plane.position.set(Math.sin(sec*.35)*3,Math.sin(sec*.7)*.4,Math.cos(sec*.3)*2);c.plane.rotation.z=Math.sin(sec*.35)*.04}
 else if(sh.obj==='radar'){camera.position.set(-8+Math.sin(sec)*1,3,8);camera.lookAt(0,2,0);c.radar.rotation.y=sec*.2}
 else if(sh.obj==='room'){camera.position.set(9*Math.sin(sec*.12),4,8);camera.lookAt(0,.8,0)}
 else if(sh.obj==='map'){camera.position.set(0,8,7);camera.lookAt(0,0,0);c.map.rotation.y=sec*.08}
 else if(sh.obj==='convoy'){camera.position.set(-7,3,13-sec%3);camera.lookAt(0,1,5);c.convoy.position.z=-2+(sec%8)*.5}
 else if(sh.obj==='squad'){camera.position.set(0,2.5,9-(sec-sh.a)*.45);camera.lookAt(0,1,0);c.squad.rotation.y=Math.sin(sec*.3)*.06}
 // Cinematic subtitle cue timing, short lines synchronized to the cue sheet
 if(subtitlesOn){let cue=SCRIPT.find(q=>el>=q[0]&&el<q[1]);let text=cue?cue[2]:'';if(text!==lastSubtitle){$('subtitle').textContent=text;lastSubtitle=text}}else $('subtitle').textContent='';
 if(el>cinematicDuration){finishCinematic();return}
}
function startMission(){
 startAudio();state='playing';paused=false;missionStarted=true;health=100;ammo=30;reserve=90;reloading=false;objective=0;deviceCollected=false;dead=false;yaw=0;pitch=0;moveX=moveY=0;camera.rotation.set(0,0,0,'YXZ');camera.fov=75;camera.updateProjectionMatrix();camera.position.set(0,1.7,7);
 // Reset enemy states and locations
 enemies.forEach((e,i)=>{e.userData.hp=100;e.userData.alive=true;e.userData.state='patrol';e.visible=true;e.position.copy(e.userData.origin);e.userData.fire=1+i*.5});
 $('health').textContent='100';$('health-fill').style.width='100%';updateAmmo();updateObjective();$('result-screen').hidden=true;$('pause-screen').hidden=true;$('cinematic-ui').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');showGameUI();localStorage.setItem('blackSandSaved','1');toast('MISSION STARTED — GHOST SIGNAL');
}
function showGameUI(){for(const el of document.querySelectorAll('.screen,.panel-screen'))el.hidden=true;$('hud').hidden=false;document.body.classList.add('playing')}
function updateObjective(){let list=['MOVE TO THE EQUIPMENT STATION','REACH THE COMMUNICATIONS FACILITY','INVESTIGATE THE SITE AND RECOVER THE DATA DEVICE','SURVIVE THE HOSTILE CONTACT','REACH THE EXTRACTION ZONE','MISSION COMPLETE'];$('objective').textContent='OBJECTIVE: '+list[Math.min(objective,list.length-1)];}
function updateAmmo(){$('ammo').textContent=`${ammo} / ${reserve}`}
function interact(){
 if(state!=='playing'||paused||dead)return;
 let p=camera.position,nearest=null,dist=99;for(const o of objects){if(!o.visible)continue;let d=p.distanceTo(o.position);if(d<dist){dist=d;nearest=o}}
 if(!nearest||dist>3.2){toast('NO INTERACTION IN RANGE');return}
 let type=nearest.userData.type;
 if(type==='weapon'&&objective===0){objective=1;toast('RIFLE ISSUED — PROCEED TO THE COMMUNICATIONS FACILITY');sfx(520,.1);updateObjective()}
 else if(type==='device'&&objective>=2&&!deviceCollected){deviceCollected=true;nearest.visible=false;objective=3;toast('DATA DEVICE RECOVERED');sfx(700,.15);updateObjective()}
 else if(type==='extract'&&objective>=4){objective=5;updateObjective();missionEnd(true)}
 else if(type==='extract'&&objective<4)toast('EXTRACTION UNAVAILABLE — COMPLETE THE OBJECTIVES');
 else if(type==='device'&&!deviceCollected)toast('CLASSIFIED DEVICE — INVESTIGATE THE FACILITY FIRST');
 else toast('NOTHING ELSE TO DO HERE');
}
function reload(){if(state!=='playing'||paused||reloading||ammo===30||reserve<=0)return;reloading=true;toast('RELOADING…');sfx(260,.09);setTimeout(()=>{if(state!=='playing'){reloading=false;return}let n=Math.min(30-ammo,reserve);ammo+=n;reserve-=n;reloading=false;updateAmmo();sfx(420,.07)},1100)}
function shoot(){
 if(state!=='playing'||paused||dead||reloading)return;let now=performance.now();if(now-lastShot<145)return;lastShot=now;
 if(ammo<=0){toast('MAGAZINE EMPTY — RELOAD');sfx(80,.05);return}ammo--;updateAmmo();weapon.position.z=-.55+Math.random()*.035;weapon.position.y=-.27-.025;weapon.rotation.x=-.04;let muzzle=weapon.userData.muzzle;muzzle.material.opacity=1;setTimeout(()=>{if(muzzle)muzzle.material.opacity=0},45);sfx(105,.12,.18,'sawtooth');
 // hitscan with camera direction, nearest enemy only if visible and in crosshair
 const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(0,0),camera);let candidates=[];for(let e of enemies){if(e.userData.alive){let meshes=[];e.traverse(o=>{if(o.isMesh)meshes.push(o)});candidates.push(...meshes)}}
 const hits=ray.intersectObjects(candidates,false);if(hits.length){let root=hits[0].object;while(root&&!root.userData.enemyRoot)root=root.parent;let enemy=root?.userData.enemyRoot;if(enemy&&enemy.userData.alive){enemy.userData.hp-=50;$('hit-marker').style.opacity=1;setTimeout(()=>$('hit-marker').style.opacity=0,100);sfx(600,.05,.08);if(enemy.userData.hp<=0){enemy.userData.alive=false;enemy.userData.state='dead';enemy.rotation.x=-Math.PI/2;enemy.position.y=-.4;toast('HOSTILE NEUTRALIZED');if(enemies.every(e=>!e.userData.alive)&&objective===3){objective=4;updateObjective()}}}}
}
function takeDamage(n){if(performance.now()<damageCooldown||dead)return;damageCooldown=performance.now()+650;health=Math.max(0,health-n);$('health').textContent=health;$('health-fill').style.width=health+'%';$('damage-flash').style.border='8px solid rgba(160,20,10,.5)';setTimeout(()=>$('damage-flash').style.border='0 solid rgba(160,20,10,0)',180);sfx(75,.18,.1);if(health<=0){dead=true;missionEnd(false)}}
function missionEnd(win){state='result';$('hud').hidden=true;document.body.classList.remove('playing');$('result-screen').hidden=false;$('result-title').textContent=win?'MISSION COMPLETE':'MISSION FAILED';$('result-copy').textContent=win?'The recovered device contains a fragment of a transmission bearing an unknown third-party signature. The crisis is deeper than command was told.':'You were lost before extraction. The operation can be restarted.';sfx(win?480:70,.4,.13);if(win)localStorage.setItem('blackSandCompleted','1')}
function pauseGame(){if(state!=='playing')return;paused=true;state='playing';$('pause-screen').hidden=false}
function resumeGame(){paused=false;$('pause-screen').hidden=true;showGameUI()}
function updateGame(dt){
 if(state!=='playing'||paused||dead)return;
 camera.rotation.order='YXZ';let speed=(sprinting?6.5:3.3)*(crouching?.55:1)*dt;
 let forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));let right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
 let delta=forward.multiplyScalar(-moveY*speed).add(right.multiplyScalar(moveX*speed));if(delta.length()>speed)delta.normalize().multiplyScalar(speed);
 let next=camera.position.clone().add(delta);next.x=Math.max(-17.2,Math.min(17.2,next.x));next.z=Math.max(-43,Math.min(18,next.z));
 // conservative collision volumes around the major buildings and wall perimeter
 const colliders=[[-8,-14,5.5,4], [8,-36,6.5,5], [0,-24,19,.9],[-19,-7,.9,17],[19,-7,.9,17],[-10,10,9,.9]];
 for(let [x,z,rx,rz] of colliders){if(Math.abs(next.x-x)<rx&&Math.abs(next.z-z)<rz){next.x=camera.position.x;next.z=camera.position.z;break}}
 camera.position.copy(next);camera.position.y=crouching?1.05:1.7;
 if(delta.length()>.02&&performance.now()-lastFoot>450){lastFoot=performance.now();sfx(65,.035,.025,'sine')}
 weapon.position.x=THREE.MathUtils.lerp(weapon.position.x,aiming?.05:.28,.15);weapon.position.y=THREE.MathUtils.lerp(weapon.position.y,aiming?-.2:-.27,.15);weapon.position.z=THREE.MathUtils.lerp(weapon.position.z,-.55,.2);weapon.rotation.x=THREE.MathUtils.lerp(weapon.rotation.x,0,.18);
 let p=camera.position;
 for(let e of enemies){let u=e.userData;if(!u.alive)continue;let d=e.position.distanceTo(p);if(d<18&&d>1.8){u.state='engage';let dir=new THREE.Vector3(p.x-e.position.x,0,p.z-e.position.z).normalize();if(d>7){e.position.addScaledVector(dir,dt*.65);e.rotation.y=Math.atan2(dir.x,dir.z)}u.fire-=dt;if(u.fire<=0&&d<16){u.fire=1.4+Math.random()*1.2; // wall occlusion via raycast
 let ray=new THREE.Raycaster(e.position.clone().add(new THREE.Vector3(0,1.4,0)),dir,0,d);let blockers=[];world.traverse(o=>{if(o.isMesh&&!enemies.includes(o.parent)&&o!==groundMesh())blockers.push(o)}); // geometry-aware coarse obstruction checks below
 let blocked=false;for(let [x,z,rx,rz] of colliders){let t=Math.max(0,Math.min(1,((x-e.position.x)*dir.x+(z-e.position.z)*dir.z)/(d||1)));let ix=e.position.x+dir.x*t*d,iz=e.position.z+dir.z*t*d;if(Math.abs(ix-x)<rx&&Math.abs(iz-z)<rz){blocked=true;break}}
 if(!blocked&&Math.random()>.28)takeDamage(7+Math.floor(Math.random()*5));
 }}else{u.state='patrol';e.position.x=u.origin.x+Math.sin(performance.now()*.0004+u.phase)*.5;e.rotation.y=Math.sin(performance.now()*.0003+u.phase)*.2}}
 // Mission progression based on location
 if(objective===1&&p.distanceTo(new THREE.Vector3(8,1.7,-31))<18){objective=2;updateObjective();toast('SIGNAL LOST — SEARCH THE FACILITY')}
 if(objective===3&&enemies.every(e=>!e.userData.alive)){objective=4;updateObjective()}
 if(objective===4&&p.distanceTo(new THREE.Vector3(0,0,13))<3){$('interact').hidden=false;$('prompt').textContent='EXTRACTION ZONE — TAP INTERACT'}
 else $('interact').hidden=false;
 const near=objects.some(o=>o.visible&&camera.position.distanceTo(o.position)<3.2);
 $('prompt').textContent=near?'TAP INTERACT TO USE OBJECT':'';
}
function groundMesh(){return null}
function resize(){if(!renderer||!camera)return;renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
function animate(){
 raf=requestAnimationFrame(animate);if(!renderer||!scene)return;let dt=Math.min(clock.getDelta(),.05);
 if(state==='cinematic')cinematicFrame(performance.now());
 else if(state==='playing'&&!paused)updateGame(dt);
 renderer.render(scene,camera);
}
bootGame();
