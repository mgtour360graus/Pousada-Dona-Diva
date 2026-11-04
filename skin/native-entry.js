/* Adaptador de entrada: ajusta a experiência antes de criar o player.
   Os scripts exportados, panoramas, hotspots e áudio permanecem intactos. */
(function(){
 'use strict';
 const api=window.TDV&&window.TDV.PlayerAPI;
 if(!api||typeof api.defineScript!=='function')return;
 const define=api.defineScript;
 api.defineScript=function(script){
  const seen=new WeakSet();
  function visit(node){
   if(!node||typeof node!=='object'||seen.has(node))return;
   seen.add(node);
   if(node.class==='PanoramaCamera'){
    node.displayMovements=[];
    delete node.displayOriginPosition;
    delete node.idleSequence;
    node.automaticRotationSpeed=0;
   }
   if(node.class==='PanoramaCameraSequence')node.movements=[];
   Object.keys(node).forEach(function(key){visit(node[key]);});
  }
  visit(script);
  return define.apply(this,arguments);
 };
})();
