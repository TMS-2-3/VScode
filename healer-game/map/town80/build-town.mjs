import fs from 'node:fs/promises';
const base=new URL('./',import.meta.url),W=80,H=80,S=32;
const path='map/town80/assets/';
export const defs={};
function def(id,name,image,passable=true,extra={}){defs[id]={id,name,image,passable,tags:['town80'],...extra};return id;}
const materials=['grass','grass2','earth','cobble','plaza','border','water','water2','soil','crops','gravel','drygrass','brick','moss_stone','terrace','forest_floor'];
for(const n of materials)def('t80_'+n,n,path+'ground/'+n+'.png',!n.startsWith('water'),{tags:['ground','town80']});
const objectSpecs={
 tree:[96,112,1,1,-32,-80],pine:[64,112,1,1,-16,-80],lamp:[24,64,1,1,4,-32],
 bench_s:[64,32,2,1,0,0],bench_e:[32,64,1,2,0,0],cart:[64,48,2,1,0,-16],
 crate:[32,32,1,1,0,0],barrel:[32,32,1,1,0,0],well:[64,64,2,2,0,0],
 fence_h:[96,32,3,1,0,0],fence_v:[32,96,1,3,0,0],wall_h:[96,32,3,1,0,0],wall_v:[32,96,1,3,0,0],
 stall:[96,64,3,2,0,0],flowerbed:[64,32,2,1,0,0],fountain:[160,160,5,4,0,-32],
 gate:[256,288,8,9,0,0],
};
for(const [n,[dw,dh,fw,fh,dx,dy]] of Object.entries(objectSpecs))def('t80_'+n,n,path+'props/'+n+'.png',n==='gate',{drawWidth:dw,drawHeight:dh,drawOffsetX:dx,drawOffsetY:dy,footprintWidth:fw,footprintHeight:fh,tags:['object','town80']});
def('t80_block','通行境界',path+'props/collision.png',false);
def('t80_pier','門の基礎',path+'props/collision.png',false,{footprintWidth:3,footprintHeight:3});
const buildingData=[
 ['church','北の教会',35,8,10,12,5],
 ['weapon','武器屋',53,24,8,7,3,'weapon'],['armor','防具屋',64,25,7,7,3,'armor'],
 ['inn','旅人の宿',48,58,10,8,3,'inn'],['item','道具屋',55,42,7,6,3,'item'],
 ['tavern','酒場',46,48,9,7,4],['bakery','パン屋',63,44,7,6,3],
 ['guild','依頼所',23,26,7,7,3,'guild'],['apothecary','薬草店',54,13,7,7,3],
 ['home_thatch','西の茅葺き住宅',9,26,6,5,3],['home_stone','庭付きの石造住宅',18,18,7,6,3],
 ['home_red','南西の木造住宅',10,47,7,6,3],['home_timber','菜園のある住宅',22,47,6,6,3],
 ['townhouse','北西の町家',10,9,7,7,3],['manor','北の館',23,9,8,7,4],
 ['stable','共同の納屋と厩舎',18,60,9,6,4],['mill','運河の水車小屋',62,10,8,9,2],
 ['home_stone','農家の母屋',8,59,7,6,3],['home_thatch','南の農家',28,61,6,5,3],
 ['home_timber','住宅街の角の家',14,35,6,6,3],['townhouse','商人の町家',59,56,7,7,3],
];
export const map={id:'rihasTown80',name:'リハス地方の町（80×80）',tileSize:S,width:W,height:H,
 defaultTile:'t80_grass',marginTiles:{ground:'t80_forest_floor',terrain:'t80_block',object:null,event:null},
 spawn:{col:40,row:77,facing:'up'},characterScale:2/3,
 layers:[{id:'ground',name:'地面',tiles:Array(W*H).fill('t80_grass')},{id:'terrain',name:'影と境界',tiles:Array(W*H).fill(null)},{id:'object',name:'建物と暮らし',tiles:Array(W*H).fill(null)},{id:'event',name:'イベント',tiles:Array(W*H).fill(null)}],events:[],npcs:[]};
const [ground,terrain,objects]=map.layers.map(l=>l.tiles);
const blocked=new Set(),occupied=new Set(),roadCells=new Set(),water=new Set(),reserved=new Set();
const index=(x,y)=>y*W+x,inside=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
function cells(x,y,w=1,h=1){const a=[];for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(inside(xx,yy))a.push(index(xx,yy));return a;}
function fill(x,y,w,h,material){for(const i of cells(x,y,w,h))if(!blocked.has(i))ground[i]='t80_'+material;}
function place(x,y,name,{force=false,reserveRoad=true}={}){
 const id='t80_'+name,d=defs[id],fw=d.footprintWidth||1,fh=d.footprintHeight||1,area=cells(x,y,fw,fh);
 if(area.length!==fw*fh)throw Error('Out of bounds '+name);
 if(!force&&area.some(i=>occupied.has(i)||blocked.has(i)||reserved.has(i)||(reserveRoad&&roadCells.has(i))))return false;
 objects[index(x,y)]=id;
 if(!d.passable)for(const i of area){occupied.add(i);blocked.add(i);}
 return true;
}
function shadow(x,y,w,h){
 const id='t80_shadow_'+w+'_'+h;
 if(!defs[id])def(id,'接地影',path+'props/shadow.png',true,{drawWidth:w*S*.94,drawHeight:Math.min(40,h*S*.22),drawOffsetX:w*S*.03,drawOffsetY:h*S-16,tags:['overlay','shadow','town80']});
 if(!terrain[index(x,y)])terrain[index(x,y)]=id;
}
// A dense forest frame and low city walls give the town a readable boundary.
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const i=index(x,y),outside=x<6||x>75||y<8||y>72,entry=x>=38&&x<=41&&y>=72;
 if(outside&&!entry){terrain[i]='t80_block';blocked.add(i);ground[i]='t80_forest_floor';}
}
for(let y=1;y<80;y+=2)for(let x=1+(y%4===1?0:1);x<80;x+=2){
 if(terrain[index(x,y)]==='t80_block'&&!(x>=35&&x<=44&&y>=69))objects[index(x,y)]='t80_'+((x+y)%7===0?'pine':'tree');
}
for(let x=5;x<=74;x+=3){place(x,7,'wall_h',{force:true});if(x+2<36||x>43)place(x,73,'wall_h',{force:true});}
for(let y=8;y<=70;y+=3){place(5,y,'wall_v',{force:true});place(76,y,'wall_v',{force:true});}
// The canal passes the watermill and the commercial yards, with two crossings.
const canal=[[72,0],[72,19],[73,32],[72,45],[70,55],[73,67],[73,79]];
function linePoints(a,b){const out=[],n=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));for(let t=0;t<=n;t++)out.push([Math.round(a[0]+(b[0]-a[0])*t/n),Math.round(a[1]+(b[1]-a[1])*t/n)]);return out;}
for(let k=1;k<canal.length;k++)for(const [x,y] of linePoints(canal[k-1],canal[k]))for(const i of cells(x-1,y,3,1)){
 water.add(i);blocked.add(i);ground[i]='t80_'+((i%5===0)?'water2':'water');if(terrain[i]==='t80_block')terrain[i]=null;
}
const bridges=[];
function bridge(x,y,w,h){for(const i of cells(x,y,w,h)){water.delete(i);blocked.delete(i);ground[i]='t80_terrace';terrain[i]=null;roadCells.add(i);}bridges.push({x,y,w,h});}
bridge(70,34,6,4);bridge(68,52,6,4);
// Buildings are irregularly staggered; no sprite is repeated more than twice.
export const buildings=[];
for(let n=0;n<buildingData.length;n++){
 const [art,name,x,y,w,h,door,facilityId]=buildingData[n],id='t80_building_'+art;
 if(!defs[id])def(id,name,path+(art==='church'?'props/':'buildings/')+art+'.png',false,{drawWidth:w*S,drawHeight:h*S,footprintWidth:w,footprintHeight:h,placementAnchor:'bottomCenter',tags:['object','building','town80']});
 if(cells(x,y,w,h).some(i=>blocked.has(i)))throw Error('Building hits boundary '+name);
 objects[index(x,y)]=id;for(const i of cells(x,y,w,h)){blocked.add(i);occupied.add(i);}shadow(x,y,w,h);
 const b={art,name,x,y,w,h,doorX:x+door,doorY:y+h,facilityId,id:'town80_'+(facilityId==='guild'?'request':facilityId||'home')+'_building_'+n};buildings.push(b);
 map.events.push({id:b.id,name,type:'buildingArea',x,y,width:w,height:h,tileId:id});
 if(facilityId)map.events.push({id:b.id+'_door',name:name+'の入口',type:'facilityInteraction',trigger:'interact',x:b.doorX-1,y:b.doorY,width:2,height:1,facilityId,facing:'up'});
 else map.events.push({id:b.id+'_door',name:name+'の入口',type:'inspect',trigger:'interact',x:b.doorX,y:b.doorY,text:art==='tavern'?'旅人と住人が食事を共にする酒場。店内から食器と話し声が聞こえる。':name+'。扉へ続く道が手入れされている。'});
}
// Rounded stone plaza, formal church approach, and a busier merchant court.
for(let y=30;y<=47;y++)for(let x=30;x<=49;x++){
 const dx=Math.max(33-x,0,x-46),dy=Math.max(33-y,0,y-44);
 if(dx*dx+dy*dy<=10){ground[index(x,y)]='t80_'+((x===30||x===49||y===30||y===47)?'border':'plaza');roadCells.add(index(x,y));}
}
fill(32,21,16,7,'terrace');for(const i of cells(32,21,16,7))roadCells.add(i);
fill(50,32,22,10,'cobble');for(const i of cells(50,32,22,10))if(!blocked.has(i))roadCells.add(i);
fill(45,55,10,3,'brick');fill(48,66,10,3,'gravel');
// Main routes bend around the residential plots and commercial rear lanes.
const routes=[
 [[[40,20],[40,30]],4,'cobble'],[[[40,47],[40,54],[37,60],[37,66],[40,70],[40,79]],4,'cobble'],
 [[[30,39],[27,39],[24,42],[10,42]],3,'earth'],[[[49,39],[60,39],[64,35],[75,35]],3,'cobble'],
 [[[13,42],[13,34],[17,31],[17,26],[21,26],[30,24],[32,24]],2,'earth'],
 [[[13,16],[13,18],[16,18],[16,26]],2,'earth'],[[[27,16],[32,16],[32,24]],2,'gravel'],
 [[[24,42],[30,47],[30,55],[21,56],[13,55],[16,57],[16,67],[22,68],[32,68],[37,64]],2,'earth'],
 [[[57,20],[61,22],[66,22],[66,20]],2,'cobble'],[[[61,22],[61,32]],2,'cobble'],
 [[[62,39],[62,51],[69,53],[75,53]],2,'cobble'],[[[62,51],[62,54]],2,'cobble'],
 [[[40,67],[54,68],[62,65],[69,61]],2,'gravel'],
 [[[50,26],[50,30],[53,32]],2,'gravel'],
];
function paintRoute(points,width,material){for(let k=1;k<points.length;k++)for(const [x,y] of linePoints(points[k-1],points[k])){
 const a=-Math.floor((width-1)/2);for(const i of cells(x+a,y+a,width,width))if(!blocked.has(i)){ground[i]='t80_'+material;roadCells.add(i);}
}}
for(const args of routes)paintRoute(...args);
function routeToRoad(sx,sy){
 const start=index(sx,sy),cost=new Map([[start,0]]),parent=new Map([[start,null]]),open=[start];let goal=null;
 while(open.length){open.sort((a,b)=>cost.get(b)-cost.get(a));const i=open.pop();if(roadCells.has(i)){goal=i;break;}
  for(const d of [-1,1,-W,W]){const n=i+d;if(n<0||n>=W*H||Math.abs(n%W-i%W)+Math.abs(Math.floor(n/W)-Math.floor(i/W))!==1||blocked.has(n))continue;
   const c=cost.get(i)+1+(ground[n].includes('crops')?4:0);if(c<(cost.get(n)??Infinity)){cost.set(n,c);parent.set(n,i);open.push(n);}}
 }
 if(goal===null)throw Error('No access '+sx+','+sy);
 for(let i=goal;i!==null;i=parent.get(i)){if(!roadCells.has(i))ground[i]='t80_earth';roadCells.add(i);}
}
for(const b of buildings){routeToRoad(b.doorX,b.doorY);if(b.facilityId)routeToRoad(b.doorX-1,b.doorY);for(const i of cells(b.doorX-1,b.doorY,3,2))reserved.add(i);}
// Gardens and cultivation occupy specific domestic and agricultural plots.
function garden(x,y,w,h){for(const i of cells(x,y,w,h))if(!blocked.has(i)&&!roadCells.has(i)&&!reserved.has(i))ground[i]='t80_'+((Math.floor(i/W)%3===0)?'soil':'crops');}
garden(8,18,4,5);garden(25,19,4,4);garden(28,17,3,5);garden(8,32,3,3);garden(8,54,4,3);
garden(23,54,5,1);garden(28,58,6,2);garden(66,57,3,6);garden(9,68,13,4);garden(23,69,9,3);
garden(49,22,3,5);fill(11,16,4,2,'terrace');fill(24,16,6,2,'gravel');
for(const [x,y] of [[8,35],[25,24],[28,23],[8,57],[28,60],[66,64],[9,72],[12,72],[15,72],[18,72],[23,72],[26,72],[29,72]])place(x,y,'fence_h');
// The plaza has clear approaches and a reserved 5x5 scene space southwest.
for(const i of cells(31,41,5,5))reserved.add(i);
const propPlan=[
 [37,37,'fountain'],[32,34,'bench_s'],[45,34,'bench_s'],[34,46,'bench_s'],[45,44,'bench_s'],[34,37,'bench_e'],[45,38,'bench_e'],
 [31,31,'lamp'],[48,31,'lamp'],[31,46,'lamp'],[48,46,'lamp'],[33,37,'lamp'],[46,41,'lamp'],
 [32,32,'flowerbed'],[45,32,'flowerbed'],[46,45,'flowerbed'],
 [33,22,'flowerbed'],[45,22,'flowerbed'],[33,25,'bench_s'],[45,25,'bench_s'],[32,24,'lamp'],[47,24,'lamp'],
 [52,34,'stall'],[57,34,'stall'],[64,37,'stall'],[68,39,'stall'],
 [51,28,'crate'],[51,29,'barrel'],[51,30,'cart'],[63,27,'crate'],[63,28,'barrel'],
 [65,42,'cart'],[67,42,'crate'],[68,42,'barrel'],
 [20,45,'well'],[18,45,'flowerbed'],[19,44,'bench_s'],[11,57,'cart'],[21,58,'cart'],
 [48,67,'lamp'],[55,66,'bench_s'],[57,66,'barrel'],[46,56,'bench_s'],[52,56,'bench_s'],[54,55,'barrel'],[55,54,'cart'],[62,20,'cart'],
 [9,19,'tree'],[11,21,'tree'],[29,20,'tree'],[32,12,'pine'],[47,13,'tree'],[50,16,'tree'],[8,40,'tree'],
 [8,46,'tree'],[20,49,'tree'],[32,52,'tree'],[27,57,'tree'],[7,66,'tree'],[35,69,'pine'],[45,70,'tree'],
 [67,64,'tree'],[70,59,'pine'],[74,40,'tree'],[74,48,'tree'],[73,58,'tree'],[48,9,'tree'],[58,10,'pine'],
 [16,32,'flowerbed'],[11,31,'flowerbed'],[25,53,'flowerbed'],[27,54,'flowerbed'],[31,66,'barrel'],[17,65,'barrel'],
 [19,11,'tree'],[20,14,'tree'],[52,24,'flowerbed'],[48,27,'bench_s'],
];
export const placedProps=[],skippedProps=[];
for(const [x,y,n] of propPlan){if(place(x,y,n,{reserveRoad:!['fountain','bench_s','bench_e','lamp','flowerbed','stall'].includes(n)})){placedProps.push({x,y,n});if(['tree','pine','well'].includes(n))shadow(x,y,defs['t80_'+n].footprintWidth||1,defs['t80_'+n].footprintHeight||1);}else skippedProps.push({x,y,n});}
for(const b of bridges)for(const yy of [b.y,b.y+b.h-1])place(Math.round(b.x+(b.w-3)/2),yy,'fence_h',{force:true});
// Gate piers block only the towers; the arch remains a four-tile passage.
objects[index(36,66)]='t80_gate';place(36,72,'pier',{force:true});place(41,72,'pier',{force:true});
map.events.push({id:'town80_gate',name:'南の門',type:'inspect',x:40,y:75,text:'町の南門。中央広場へは、石畳の道が続いている。'});
map.events.push({id:'town80_tavern_sign',name:'酒場の看板',type:'inspect',x:50,y:55,text:'食事と休憩の酒場。宿泊は、南側の旅人の宿へ。'});
// Residents have roles and short local dialogue; these are ambient, not story quests.
const residents=[
 ['guard','門番',44,72,'adult_man','left','中央広場はこの道の先だ。東は商店、西は住まいの多い通りだよ。'],
 ['smith','鍛冶屋',61,31,'adult_man','left','鍛えた道具は水気を拭いてからしまうんだ。運河沿いは湿るからな。'],
 ['vendor','野菜売り',56,36,'adult_woman','down','朝に届いた野菜だよ。畑仕事をしている人たちが、南に住んでいる。'],
 ['baker','パン屋',66,52,'adult_woman','left','焼きたては広場のベンチで食べていって。'],
 ['elder','散歩中の老人',33,39,'elder_man','right','噴水の音は、町のどこにいても帰り道を教えてくれる。'],
 ['child','噴水を眺める子',43,40,'boy','left','あの一番上まで、水がのぼるんだ。'],
 ['gardener','菜園の住人',11,34,'elder_woman','down','柵の切れ目を残しておくと、畑まで荷物を運びやすいんだよ。'],
 ['farmer','農作業の住人',24,67,'adult_man','up','荷車は納屋のそばへ。道の真ん中には置かないようにしてる。'],
 ['herbalist','薬草を育てる人',59,21,'adult_woman','down','教会のそばは静かで、薬草を干す場所に向いているの。'],
 ['traveller','旅の客',49,67,'adult_man','right','門から宿まで迷わず来られた。明日は水車小屋を見にいこう。'],
 ['churchkeeper','教会の世話係',41,23,'elder_man','down','歩き疲れたら、木陰のベンチで休んでいってください。'],
];
for(const [id,name,x,y,model,facing,text] of residents)if(!blocked.has(index(x,y))&&!reserved.has(index(x,y))){
 map.npcs.push({id:'town80_'+id,name,col:x,row:y,spritePath:'../../map/town80/assets/people/'+model,spriteHeight:48,facing,stationary:true,dialogue:[{speaker:name,text}]});
}
// Bake material-aware edge masks. Interior textures remain simple reusable tiles.
const blendSpecs=new Map(),baseGround=ground.slice();
function family(n){if(['earth','gravel'].includes(n))return 'earth';if(['cobble','plaza','border','terrace','brick','moss_stone'].includes(n))return 'stone';if(n.startsWith('water'))return 'water';if(['soil','crops'].includes(n))return 'soil';return 'grass';}
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const i=index(x,y),material=baseGround[i].slice(4),f=family(material);if(f==='grass'||f==='stone')continue;
 let mask=0,bit=0;const neighbors=[];
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy){const nx=x+dx,ny=y+dy;const other=inside(nx,ny)?family(baseGround[index(nx,ny)].slice(4)):f;const joinedRoad=(f==='earth'||f==='stone')&&(other==='earth'||other==='stone');const same=!inside(nx,ny)||other===f||joinedRoad||occupied.has(index(nx,ny));neighbors.push(same);if(same)mask|=1<<bit;bit++;}
 if(mask===255)continue;
 const key=material+'_'+mask.toString(16),id='t80_edge_'+key;
 if(!blendSpecs.has(key)){
  const pixels=[];for(let py=0;py<S;py++)for(let px=0;px<S;px++){
   let distance=99,b=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;if(!neighbors[b])distance=Math.min(distance,Math.hypot(Math.max(dx*S-(px+.5),0,px+.5-(dx+1)*S),Math.max(dy*S-(py+.5),0,py+.5-(dy+1)*S)));b++;}
   const jitter=((px*13+py*19+(px^py)*7)%5)-2;pixels.push(distance>=2.5+jitter*.4?255:0);
  }
  blendSpecs.set(key,{key,material,pixels});def(id,'地面の境目 '+key,path+'ground/edge_'+key+'.png',f!=='water',{tags:['ground','town80']});
 }
 ground[i]=id;
}
// Keep masks independent of the registered tile IDs during later exports.
const passable=new Set();for(let i=0;i<W*H;i++)if(!blocked.has(i))passable.add(i);
export const specification={tileSize:S,width:W,height:H,buildings,bridges,placedProps,skippedProps,sceneSpace:{x:31,y:41,width:5,height:5},spawn:map.spawn,doors:buildings.map(b=>({name:b.name,x:b.doorX,y:b.doorY}))};
await fs.writeFile(new URL('edge-specs.json',base),JSON.stringify([...blendSpecs.values()]));
await fs.writeFile(new URL('town80.record.json',base),JSON.stringify({type:'healer-map-editor-record',version:1,savedAt:new Date().toISOString(),map},null,2)+'\n');
await fs.writeFile(new URL('town80.tiles.json',base),JSON.stringify(defs,null,2)+'\n');
await fs.writeFile(new URL('layout.json',base),JSON.stringify(specification,null,2)+'\n');
await fs.writeFile(new URL('town80-data.js',base),'window.TOWN80_DATA='+JSON.stringify({map,defs,specification})+';\n');
await fs.writeFile(new URL('town80-map.js',base),'window.HEALER_TILE_MAPS=window.HEALER_TILE_MAPS||{};\nwindow.HEALER_TILE_MAPS.rihasTown80='+JSON.stringify(map,null,2)+';\n');
await fs.writeFile(new URL('town80-tiles.js',base),'window.HEALER_TILE_DEFS=window.HEALER_TILE_DEFS||{};\nObject.assign(window.HEALER_TILE_DEFS,'+JSON.stringify(defs,null,2)+');\n');
console.log(JSON.stringify({buildings:buildings.length,residents:map.npcs.length,props:placedProps.length,skippedProps,edgeMaterials:blendSpecs.size}));
