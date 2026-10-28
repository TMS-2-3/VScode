import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const work=new URL('./',import.meta.url),project=new URL('../../',import.meta.url);
const read=p=>fs.readFile(new URL(p,project),'utf8');
const record=JSON.parse(await fs.readFile(new URL('town80.record.json',work),'utf8'));
const defs=JSON.parse(await fs.readFile(new URL('town80.tiles.json',work),'utf8'));
const layout=JSON.parse(await fs.readFile(new URL('layout.json',work),'utf8'));
const map=record.map;
const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
assert.equal(map.width,80);assert.equal(map.height,80);assert.equal(map.tileSize,32);
for(const layer of map.layers){assert.equal(layer.tiles.length,6400);for(const entry of layer.tiles){const id=typeof entry==='string'?entry:entry?.tileId;if(id)assert.ok(defs[id],id);}}
const images=new Set(Object.values(defs).map(d=>d.image));
for(const image of images){assert.ok(image.startsWith('map/town80/assets/'));const bytes=await fs.readFile(new URL(image,project));assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');if(image.includes('/ground/')){assert.equal(bytes.readUInt32BE(16),32,image);assert.equal(bytes.readUInt32BE(20),32,image);}}
for(const npc of map.npcs)for(const direction of ['up','down','left','right'])for(const frame of ['01','02','03']){
 const bytes=await fs.readFile(new URL(`img/char/${npc.spritePath}/walk/${direction}_${frame}.png`,project));assert.equal(bytes.readUInt32BE(16),32);assert.equal(bytes.readUInt32BE(20),48);
}
// The unmodified runtime already supports a factory-local size. This fixture
// tests the exported town at 32px without changing the game's global 48px size.
const context={window:{HEALER_TILE_SIZE:32,HEALER_TILE_DEFS:defs,HEALER_TILE_MAPS:{[map.id]:map}},Image:class{complete=true;naturalWidth=1;set src(v){this.path=v;}get src(){return this.path;}}};
vm.createContext(context);
for(const source of ['world/tileMapSystem.js','data/town.js','world/townController.js'])vm.runInContext(await read(source),context);
const system=context.window.createHealerTileMapSystem({tileSize:32,tileDefs:defs,tileMaps:{[map.id]:map}});
assert.equal(system.getMapPixelSize(map).w,2560);assert.equal(system.getMapPixelSize(map).h,2560);
const passable=new Set();for(let y=0;y<80;y++)for(let x=0;x<80;x++)if(system.isTileCoordPassable(map,x,y))passable.add(y*80+x);
const start=map.spawn.row*80+map.spawn.col,seen=new Set([start]),queue=[start];
function adjacent(i,n){return Math.abs(i%80-n%80)+Math.abs(Math.floor(i/80)-Math.floor(n/80))===1;}
for(const i of queue)for(const n of [i-1,i+1,i-80,i+80])if(passable.has(n)&&!seen.has(n)&&adjacent(i,n)){seen.add(n);queue.push(n);}
assert.equal(seen.size,passable.size,'Isolated walkable cells');
const npcCells=new Set(map.npcs.map(n=>n.row*80+n.col));
function route(x,y){const goal=y*80+x,parent=new Map([[start,null]]),queue=[start];for(const i of queue){if(i===goal)break;for(const n of [i-1,i+1,i-80,i+80])if(passable.has(n)&&!npcCells.has(n)&&!parent.has(n)&&adjacent(i,n)){parent.set(n,i);queue.push(n);}}assert.ok(parent.has(goal),`No route to ${x},${y}`);const result=[];for(let i=goal;i!==null;i=parent.get(i))result.push(i);return result.reverse();}
const town={mapId:map.id,meetingDone:true,player:{x:(map.spawn.col+.5)*32,y:(map.spawn.row+.5)*32,facing:'up',radius:10,speed:160},buildings:[],props:[],panel:null,story:null,trail:[],followers:[],camera:{x:0,y:0}};
const input={keys:{},mouse:{x:0,y:0}},game={state:'town',message:'',messageTimer:0};
const control=context.window.createHealerTownController({input,game,town,player:{},playerProfile:{done:true},party:[],enemies:[],projectiles:[],telegraphs:[],areas:[],effects:[],tileMapSystem:system,TOWN_DATA:context.window.HEALER_TOWN_DATA,STATUS_DATA:{},ENEMY_DEFS:{},EQUIPMENT_DATA:{},MATERIAL_DATA:{},QUEST_DATA:{quests:[],types:[]},NPC_DATA:{npcs:[]},TOWN_WIDTH:2560,TOWN_HEIGHT:2560,clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),distPoint:(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by),clampTownPlayer:()=>{},getGold:()=>1000,getItemCandidates:()=>[],getItemDef:()=>null,getKeybindLabel:()=> 'E',updateProfileNameInput:()=>{}});
control.setupTown();assert.equal(town.buildings.length,21);assert.equal(control.getTownNpcActors().length,11);
function walk(x,y){const path=route(x,y);town.panel=null;town.story=null;town.player.x=(map.spawn.col+.5)*32;town.player.y=(map.spawn.row+.5)*32;town.player.gridMove=null;input.keys={};control.updateTown(0);for(let j=1;j<path.length;j++){const dx=path[j]%80-path[j-1]%80,dy=Math.floor(path[j]/80)-Math.floor(path[j-1]/80);input.keys={[dx===1?'d':dx===-1?'a':dy===1?'s':'w']:true};control.updateTown(.25);assert.ok(Math.abs(town.player.x-(path[j]%80+.5)*32)<.01&&Math.abs(town.player.y-(Math.floor(path[j]/80)+.5)*32)<.01,`Movement failed at ${path[j]%80},${Math.floor(path[j]/80)} to ${x},${y}`);}input.keys={};return path.length-1;}
const doors=layout.doors.map(d=>({...d,steps:walk(d.x,d.y)}));
const facilities=[];for(const e of map.events.filter(e=>e.type==='facilityInteraction'))for(let dx=0;dx<e.width;dx++){
 walk(e.x+dx,e.y);town.player.facing='up';assert.equal(control.getTownInteraction()?.id,e.facilityId);control.interactTown();const action={weapon:'equipmentShop',armor:'equipmentShop',inn:'inn',item:'itemShop',guild:'questType'}[e.facilityId];assert.equal(town.panel?.action,action);if(['weapon','armor'].includes(e.facilityId))assert.equal(town.panel.shopKind,e.facilityId);facilities.push({id:e.facilityId,x:e.x+dx,y:e.y,action});town.panel=null;
}
const conversations=[];for(const npc of map.npcs){const c=[[-1,0,'right'],[1,0,'left'],[0,-1,'down'],[0,1,'up']].find(([dx,dy])=>passable.has((npc.row+dy)*80+npc.col+dx)&&!npcCells.has((npc.row+dy)*80+npc.col+dx));assert.ok(c,npc.name);walk(npc.col+c[0],npc.row+c[1]);town.player.facing=c[2];assert.equal(control.getTownInteraction()?.type,'npc',npc.name);control.interactTown();assert.ok(town.story,npc.name);conversations.push(npc.name);town.story=null;}
walk(40,73);input.keys={d:true};control.updateTown(.25);assert.equal(town.player.x,40.5*32,'Gate pier collision');input.keys={};
walk(40,20);input.keys={w:true};control.updateTown(.25);assert.equal(town.player.y,20.5*32,'Church wall collision');input.keys={};
for(let y=41;y<46;y++)for(let x=31;x<36;x++)assert.ok(passable.has(y*80+x),'Scene space blocked');
const editor={window:{},document:{getElementById:()=>({insertAdjacentElement(){}}),createElement:()=>({})}};vm.createContext(editor);
for(const source of ['map/tile.js','map/maps.js','map/town80/town80-tiles.js','map/town80/town80-map.js'])vm.runInContext(await read(source),editor);
const html=await read('map/map-editor.html'),script=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\s+init\(\);\s*$/,'');
vm.runInContext(script,editor);editor.nextMap=map;vm.runInContext('state.map=normalizeMap(nextMap)',editor);
assert.equal(canonical(vm.runInContext('createSerializableMap(state.map)',editor)),canonical(map),'Editor record roundtrip');
vm.runInContext('window.exportedMap='+ 'buildMapObjectSource()',editor);const exported={};vm.createContext(exported);vm.runInContext('result='+editor.window.exportedMap,exported);assert.equal(canonical(exported.result),canonical(map),'Editor JS export');
const previewHTML=await fs.readFile(new URL('preview.html',work),'utf8');assert.ok(!previewHTML.includes('world/'));assert.ok(!previewHTML.includes('ui/'));
const uiElements={},canvasContext={fillRect(){},drawImage(){},save(){},restore(){},scale(){},translate(){},beginPath(){},ellipse(){},fill(){},strokeRect(){}};
const ui={window:{TOWN80_DATA:{map,defs,specification:layout}},document:{querySelector:id=>uiElements[id]??=( {checked:false,textContent:'',classList:{toggle(){}},getContext:()=>canvasContext,getBoundingClientRect:()=>({left:0,top:0,width:160,height:160})})},innerWidth:1200,innerHeight:800,addEventListener(){},requestAnimationFrame(){},Image:class{complete=true;}};
vm.createContext(ui);vm.runInContext(previewHTML.match(/<script>([\s\S]*?)<\/script>/)[1],ui);
vm.runInContext('jump(40,73); keys.add("d"); update(.25); keys.clear();',ui);assert.equal(vm.runInContext('player.col',ui),40,'Preview gate collision');
vm.runInContext('jump(45,72);player.facing="left";interact()',ui);assert.ok(uiElements['#status'].textContent.includes('門番'),'Preview dialogue');vm.runInContext('render(16)',ui);
const report={status:'PASS',tileSize:32,dimensions:[80,80],imageDimensions:[2560,2560],buildings:21,uniqueArchitecture:17,residents:11,connectedWalkableCells:passable.size,doors,facilityChecks:facilities,npcConversationChecks:conversations,gateAndChurchCollision:'PASS',sceneSpace:'PASS',editorRoundtrip:'PASS',editorJSExport:'PASS',selfContainedPreview:'PASS',previewMovementAndDialogue:'PASS',groundAndSpriteFiles:'PASS',browserManualTest:false,runtimeFilesModified:false};
await fs.writeFile(new URL('verification-report.json',work),JSON.stringify(report,null,2)+'\n');
const calls=[];system.drawTileMap({drawImage(im,x,y,w,h){calls.push({src:im.src,x,y,w,h});}},map);await fs.writeFile(new URL('draw-calls.json',work),JSON.stringify(calls));
console.log(JSON.stringify({status:'PASS',walkableCells:passable.size,doors:doors.length,facilityChecks:facilities.length,conversations:conversations.length,editor:'PASS',preview:'PASS'}));
