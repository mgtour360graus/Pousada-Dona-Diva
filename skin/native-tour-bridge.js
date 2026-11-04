/* Ponte da skin para a API nativa 3DVista. Nenhum panorama ou hotspot é substituído. */
(function () {
 'use strict';
 const CHANNEL='diva-house-tour-v1';
 let subscribed=false,attached=false,playlist=null,root=null,desiredPaused=false,attempts=0;
 function parentOrigin(){return window.location.origin==='null'?'*':window.location.origin;}
 function post(type,extra){if(window.parent===window)return;window.parent.postMessage(Object.assign({channel:CHANNEL,type:type},extra||{}),parentOrigin());}
 function currentState(){
  if(!playlist)return null;
  const index=playlist.get('selectedIndex'),items=playlist.get('items'),item=items&&items[index];
  if(!item)return null;const media=item.get('media');return {index:index,panoramaId:media.get('id')};
 }
 function sync(){const state=currentState();if(state)post('change',state);}
 function applyPause(){const tour=window.tour;if(!tour)return;if(desiredPaused){if(!tour.isPaused)tour.pause();}else if(tour.isPaused)tour.resume();}
 function loaded(){attach();sync();post('loaded',currentState()||{});applyPause();}
 function attach(){
  if(attached||!window.tour||!window.tour.player)return;
  root=window.tour.player.getById('rootPlayer');playlist=window.tour.player.getById('mainPlayList');
  if(!root||!playlist)return;
  // A visita começa estável. Os recursos e sequências originais continuam no motor.
  // A API observa estas propriedades e encerra a sequência inicial em execução.
  root.getByClassName('PanoramaCamera').forEach(function(camera){
   const entry=camera.get('initialSequence');if(entry)entry.set('movements',[]);
   camera.set('idleSequence',null);camera.set('displayOriginPosition',null);
   camera.set('automaticRotationSpeed',0);
  });
  attached=true;playlist.bind('change',sync,root);
  const items=playlist.get('items')||[];
  items.forEach(function(item){item.bind('begin',function(){sync();post('loaded',currentState()||{});applyPause();},root);});
  post('ready',currentState()||{});applyPause();
  if(window.tour.isInitialized)loaded();
 }
 function connect(){
  if(!window.tour){if(attempts++<200)setTimeout(connect,50);return;}
  if(!subscribed){subscribed=true;window.tour.bind('tourInitialized',attach);window.tour.bind('tourLoaded',loaded);}
  attach();
 }
 window.addEventListener('message',function(event){
  if(event.source!==window.parent||event.origin!==window.location.origin)return;
  const data=event.data;if(!data||data.channel!==CHANNEL)return;
  if(data.command==='pause'){desiredPaused=true;applyPause();return;}
  if(data.command==='resume'){desiredPaused=false;applyPause();return;}
  if(data.command==='select'){
   attach();if(!attached)return;
   const items=playlist.get('items')||[];
   if(!Number.isInteger(data.index)||data.index<0||data.index>=items.length)return;
   const media=items[data.index].get('media');if(data.panoramaId&&data.panoramaId!==media.get('id'))return;
   if(playlist.get('selectedIndex')!==data.index)window.tour.setMediaByIndex(data.index);else sync();
  }
 });
 document.addEventListener('keydown',function(event){
  if(event.key==='Escape'&&!document.fullscreenElement&&!document.webkitFullscreenElement){event.preventDefault();post('escape');}
  if(event.key==='Tab'){event.preventDefault();post('focus-controls');}
 });
 // Checa somente um recurso já exigido pelo panorama inicial; os caminhos continuam relativos.
 function checkMedia(){const probe=new Image();probe.onerror=function(){post('media-error');};probe.src='media/panorama_37840B23_2346_6223_41BD_406394526918_0/f/3/0_0.webp';}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){connect();checkMedia();});else{connect();checkMedia();}
})();
