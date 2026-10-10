'use strict';
// Змінюй тут назви, ціни та шляхи до своїх картинок і треків.
const skins = {
 classic:{name:'Класичний',price:0,file:'du.png',color:'#68f1e3'},
 gold:{name:'Золотий',price:100,file:'1.png',color:'#ffcf65'},
 phonk:{name:'Шрек',price:250,file:'2.png',color:'#9bdb63'},
 pro:{name:'Pro',price:1000,file:'новий.png',color:'#b295ff'},
 skin_4:{name:'Скін 4',price:1500,file:'4.png',color:'#ff8db6'},
 skin_5:{name:'Скін 5',price:2000,file:'5.png',color:'#79bfff'},
 skin_6:{name:'Скін 6',price:3000,file:'6.png',color:'#ff956d'}
};
const skeletons = {
 none:{name:'Без скелетів',price:0},skel_1:{name:'Скелет 1',price:500,file:'ger.png'},
 skel_2:{name:'Скелет 2',price:150,file:'fer.png'},skel_3:{name:'Скелет 3',price:500,file:'sa.png'},
 skel_4:{name:'Скелет 4',price:1500,file:'s4.png'},skel_5:{name:'Скелет 5',price:2000,file:'s5.png'},
 skel_6:{name:'Скелет 6',price:3500,file:'s6.png'}
};
const musicFiles = {dudec:['Classic','m3.mp3'],das:['Das Track','m2.mp3'],'1doot':['1Doot Special','m1.mp3'],music_4:['Трек 4','m4.mp3'],music_5:['Трек 5','m5.mp3']};
const $ = id => document.getElementById(id);
let storageWarning = false;
function read(key,fallback){try{const v=localStorage.getItem(key);return v===null?fallback:JSON.parse(v);}catch{return fallback;}}
function readText(key,fallback){try{return localStorage.getItem(key)||fallback;}catch{return fallback;}}
function nonnegative(value,fallback=0){return Number.isFinite(value)&&value>=0?value:fallback;}
function owned(value,catalog,base){return [...new Set([base,...(Array.isArray(value)?value:[]).filter(k=>Object.hasOwn(catalog,k))])];}
const saved = read('dudecSaveV2',null);
const source = saved&&typeof saved==='object'?saved:{coins:read('totalCoins',0),best:read('bestScore',0),volume:read('currentVolume',.5),skins:read('unlockedSkins',['classic']),skels:read('unlockedSkels',['none']),skin:readText('currentSkin','classic'),skel:readText('currentSkel','none'),music:readText('currentMusic','dudec')};
const state={coins:Math.floor(nonnegative(source.coins)),best:Math.floor(nonnegative(source.best)),volume:Math.min(1,nonnegative(source.volume,.5)),skins:owned(source.skins,skins,'classic'),skels:owned(source.skels,skeletons,'none'),skin:source.skin,skel:source.skel,music:source.music};
if(!state.skins.includes(state.skin))state.skin='classic';
if(!state.skels.includes(state.skel))state.skel='none';
if(!Object.hasOwn(musicFiles,state.music))state.music='dudec';
function notify(message){$('notice').textContent=message;}
function save(){try{localStorage.setItem('dudecSaveV2',JSON.stringify(state));}catch{storageWarning=true;notify('Браузер не дозволяє зберегти прогрес. Він залишиться лише до закриття сторінки.');}}
// Вбудований векторний персонаж — запасний варіант, коли PNG ще не додані.
function fallback(color,skeleton=false){const svg=skeleton?`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="20" y="8" width="60" height="60" rx="25" fill="${color}"/><circle cx="38" cy="35" r="10" fill="#171b30"/><circle cx="64" cy="35" r="10" fill="#171b30"/><path d="M38 60h25M50 70v20M30 78h40" stroke="${color}" stroke-width="8"/><path d="M46 49l5-8 5 8" fill="#171b30"/></svg>`:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 190"><ellipse cx="90" cy="174" rx="50" ry="9" fill="#0004"/><path d="M55 129l-8 36h24l11-33m20 0 9 33h24l-10-36" fill="${color}"/><rect x="27" y="29" width="126" height="116" rx="43" fill="${color}"/><path d="M33 56q57-50 113 0" fill="#fff3"/><ellipse cx="64" cy="78" rx="19" ry="23" fill="white"/><ellipse cx="116" cy="78" rx="19" ry="23" fill="white"/><circle cx="69" cy="81" r="9" fill="#171b30"/><circle cx="111" cy="81" r="9" fill="#171b30"/><path d="M65 112q25 24 50 0" fill="#171b30"/><path d="M29 101L12 121m137-20 18 20" stroke="${color}" stroke-width="16" stroke-linecap="round"/></svg>`;return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);}
function setImage(img,file,color,skeleton=false){img.onerror=()=>{img.onerror=null;img.src=fallback(color,skeleton);};img.src=file;}
function applySkin(){setImage($('dudec-img'),skins[state.skin].file,skins[state.skin].color);}
const audio = new Audio();audio.loop=true;
let musicMissing=false;
audio.addEventListener('error',()=>{musicMissing=true;notify('Трек не знайдено. Додай MP3 до папки гри; поки граємо без музики.');});
function setupMusic(){audio.pause();musicMissing=false;audio.src=musicFiles[state.music][1];audio.volume=state.volume;}
function playMusic(){if(!musicMissing&&audio.paused&&state.volume>0)audio.play().catch(()=>{});}
let score=0,mode='idle',deadline=0,nextSpawn=0,frame=0;
const ROUND_GAP=1000;
function updateUI(){$('score').textContent=score;$('total-coins').textContent=state.coins;$('best-score').textContent=state.best;$('shop-balance').textContent=state.coins;$('btn-pause').disabled=mode!=='playing';$('state-label').textContent={idle:'ГОТОВИЙ ДО СТАРТУ',playing:'ТРИМАЙ ТЕМП!',paused:'ПАУЗА',over:'ЗАБІГ ЗАВЕРШЕНО'}[mode];}
function setTimer(fraction){const n=Math.max(0,Math.min(1,fraction));$('time-fill').style.transform=`scaleX(${n})`;$('time-fill').style.background=n<.3?'#ff8da5':'var(--cyan)';$('time-fill').parentElement.setAttribute('aria-valuenow',Math.round(n*100));$('time-label').textContent=n.toFixed(2).replace('.',',')+' с';}
function clearSkeletons(){document.querySelectorAll('.floating-skel').forEach(el=>el.remove());}
function loop(now){if(mode!=='playing')return;if(now>=deadline){finish();return;}setTimer((deadline-now)/ROUND_GAP);if(now>=nextSpawn){spawnSkeleton();nextSpawn=now+2500;}document.querySelectorAll('.floating-skel').forEach(el=>{if(now>=Number(el.dataset.expires))el.remove();});frame=requestAnimationFrame(loop);}
function tap(isSkeleton=false){if(document.querySelector('dialog[open]')||mode==='paused'||mode==='over')return;const now=performance.now();if(mode==='playing'&&now>=deadline){finish();return;}if(mode==='idle'){mode='playing';nextSpawn=now+2500;deadline=now+ROUND_GAP;frame=requestAnimationFrame(loop);}deadline=now+ROUND_GAP;const points=Math.random()<(isSkeleton?.5:.2)?10:1;score+=points;updateUI();setTimer(1);playMusic();$('hint').textContent=points===10?'Бонус! +10 🔥':'Так тримати! Кожен тап — ще секунда.';const popup=document.createElement('span');popup.className='points'+(points===10?' bonus':'');popup.textContent='+'+points;popup.style.left=(35+Math.random()*30)+'%';$('dudec-box').append(popup);setTimeout(()=>popup.remove(),650);$('tap-button').classList.add('pressed');setTimeout(()=>$('tap-button').classList.remove('pressed'),90);}
function spawnSkeleton(){if(state.skel==='none')return;const btn=document.createElement('button');btn.className='floating-skel';btn.setAttribute('aria-label','Спіймати бонусного скелета');btn.dataset.expires=performance.now()+3000;btn.style.left=(Math.random()<.5?1:77)+'%';btn.style.top=(8+Math.random()*62)+'%';const img=document.createElement('img');img.alt='';setImage(img,skeletons[state.skel].file,'#f4e6ff',true);btn.append(img);btn.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();tap(true);btn.remove();});btn.addEventListener('click',e=>{if(e.detail===0){tap(true);btn.remove();}});$('dudec-box').append(btn);}
function finish(){if(mode!=='playing')return;mode='over';cancelAnimationFrame(frame);audio.pause();clearSkeletons();const record=score>state.best;state.coins+=score;state.best=Math.max(state.best,score);save();updateUI();setTimer(0);$('final-score').textContent=score;$('earned-coins').textContent=score;$('record-message').textContent=record?'Новий рекорд! 🏆':`Твій рекорд: ${state.best}`;$('modal-gameover').showModal();}
function pause(){if(mode!=='playing')return;if(performance.now()>=deadline){finish();return;}mode='paused';cancelAnimationFrame(frame);audio.pause();clearSkeletons();updateUI();}
function resume(){if(mode!=='paused'||document.querySelector('dialog[open]'))return;mode='playing';deadline=performance.now()+ROUND_GAP;nextSpawn=performance.now()+2500;updateUI();setTimer(1);playMusic();frame=requestAnimationFrame(loop);}
function openMenu(id){pause();$(id).showModal();}
function refreshShop(){for(const [id,catalog,unlocked,current] of [['select-skin',skins,state.skins,state.skin],['select-skel',skeletons,state.skels,state.skel]]){$(id).replaceChildren();for(const [key,item] of Object.entries(catalog)){const opt=new Option(`${item.name} · ${unlocked.includes(key)?'✓ Є':item.price+' 🪙'}`,key);$(id).add(opt);}$(id).value=current;}$('select-music').replaceChildren();for(const [key,[name]]of Object.entries(musicFiles))$('select-music').add(new Option(name,key));$('select-music').value=state.music;$('shop-error').textContent='';updateUI();updatePrice();}
function purchaseCost(){return(state.skins.includes($('select-skin').value)?0:skins[$('select-skin').value].price)+(state.skels.includes($('select-skel').value)?0:skeletons[$('select-skel').value].price);}
function updatePrice(){const price=purchaseCost();$('purchase-summary').textContent=price?`Разом: ${price} 🪙`:'Усе обране вже твоє.';$('save-skins').textContent=price?'Купити й застосувати':'Застосувати';$('shop-error').textContent='';}
$('save-skins').addEventListener('click',()=>{const cost=purchaseCost();if(cost>state.coins){$('shop-error').textContent=`Не вистачає ${cost-state.coins} монет. Покупку не здійснено.`;return;}state.coins-=cost;state.skin=$('select-skin').value;state.skel=$('select-skel').value;if(!state.skins.includes(state.skin))state.skins.push(state.skin);if(!state.skels.includes(state.skel))state.skels.push(state.skel);const changed=state.music!==$('select-music').value;state.music=$('select-music').value;save();applySkin();if(changed)setupMusic();updateUI();$('modal-skins').close();});
$('select-skin').addEventListener('change',updatePrice);$('select-skel').addEventListener('change',updatePrice);
$('btn-skins').onclick=()=>{refreshShop();openMenu('modal-skins');};
$('btn-settings').onclick=()=>openMenu('modal-settings');
$('volume-range').value=state.volume;$('volume-value').textContent=Math.round(state.volume*100)+'%';
$('volume-range').oninput=()=>{state.volume=Number($('volume-range').value);audio.volume=state.volume;$('volume-value').textContent=Math.round(state.volume*100)+'%';};
$('save-settings').onclick=()=>$('modal-settings').close();
for(const id of ['modal-skins','modal-settings'])$(id).addEventListener('close',()=>{if(id==='modal-settings')save();resume();});
$('btn-pause').onclick=()=>{pause();if(mode==='paused')$('modal-pause').showModal();};
$('resume-btn').onclick=()=>$('modal-pause').close();$('modal-pause').addEventListener('close',resume);
$('modal-gameover').addEventListener('cancel',e=>e.preventDefault());
$('restart-btn').onclick=()=>{$('modal-gameover').close();score=0;mode='idle';updateUI();setTimer(1);$('hint').textContent='Натисни на Дудеця, щоб почати';};
$('over-shop').onclick=()=>{refreshShop();$('modal-skins').showModal();};
$('tap-button').addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();tap();});
$('tap-button').addEventListener('click',e=>{if(e.detail===0)tap();});
document.addEventListener('keydown',e=>{if(e.code!=='Space'||document.querySelector('dialog[open]')||/^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))return;e.preventDefault();if(!e.repeat)tap();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing'){pause();if(mode==='paused')$('modal-pause').showModal();}});
window.addEventListener('pagehide',save);
applySkin();setupMusic();updateUI();setTimer(1);save();
