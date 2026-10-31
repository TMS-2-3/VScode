import fs from 'node:fs/promises';
const here=new URL('./',import.meta.url),shared=new URL('../town80/',import.meta.url);
const sourceDefs=JSON.parse(await fs.readFile(new URL('town80.tiles.json',shared),'utf8'));
const W=40,H=20,T=32,defs={};
export const map={id:'rihasTown40',name:'リハス地方の町（40×20）',tileSize:T,width:W,height:H,defaultTile:'t40_grass',marginTiles:{ground:'t40_forest_floor',terrain:'t40_block',object:null,event:null},spawn:{col:20,row:19,facing:'up'},characterScale:2/3,layers:[{id:'ground',name:'地面',tiles:Array(W*H).fill('t40_grass')},{id:'terrain',name:'影と境界',tiles:Array(W*H).fill(null)},{id:'object',name:'建物と暮らし',tiles:Array(W*H).fill(null)},{id:'event',name:'イベント',tiles:Array(W*H).fill(null)}],events:[],npcs:[]};
export {defs};
function define(name,source,extra={}){const id='t40_'+name,s=sourceDefs['t80_'+source];defs[id]={...s,id,tags:(s.tags||[]).map(t=>t==='town80'?'town40':t),...extra};return id;}
const materialNames=['grass','grass2','earth','cobble','plaza','border','water','water2','soil','crops','gravel','drygrass','brick','moss_stone','terrace','forest_floor'];
for(const name of materialNames)define(name,name);
const specs={tree:[64,75,1,1,-16,-43],pine:[43,75,1,1,-5,-43],lamp:[18,48,1,1,7,-16],bench_s:[48,24,2,1,8,8],bench_e:[24,48,1,2,4,16],cart:[48,36,2,1,8,-4],crate:[24,24,1,1,4,8],barrel:[24,24,1,1,4,8],well:[48,48,2,2,8,16],fence_h:[96,32,3,1,0,0],wall_h:[96,32,3,1,0,0],wall_v:[32,96,1,3,0,0],stall:[72,48,3,2,12,16],flowerbed:[48,24,2,1,8,8],fountain:[64,64,2,2,0,0],gate:[128,144,5,3,16,-48]};
for(const [name,[w,h,fw,fh,dx,dy]]of Object.entries(specs))define(name,name,{name:'小さな町 '+name,drawWidth:w,drawHeight:h,drawOffsetX:dx,drawOffsetY:dy,footprintWidth:fw,footprintHeight:fh});
define('block','block');define('pier','pier',{footprintWidth:2,footprintHeight:2});
const [ground,terrain,objects]=map.layers.map(l=>l.tiles),blocked=new Set(),occupied=new Set(),roads=new Set(),reserved=new Set();
const at=(x,y)=>y*W+x,inside=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
function cells(x,y,w=1,h=1){const a=[];for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(inside(xx,yy))a.push(at(xx,yy));return a;}
function place(x,y,n,{force=false,road=false}={}){const id='t40_'+n,d=defs[id],w=d.footprintWidth||1,h=d.footprintHeight||1,a=cells(x,y,w,h);if(a.length!==w*h)throw Error('Placement outside map '+n);if(!force&&a.some(i=>blocked.has(i)||occupied.has(i)||reserved.has(i)||(!road&&roads.has(i))))return false;objects[at(x,y)]=id;if(!d.passable)for(const i of a){blocked.add(i);occupied.add(i);}return true;}
function paint(x,y,w,h,n,road=false){for(const i of cells(x,y,w,h))if(!blocked.has(i)){ground[i]='t40_'+n;if(road)roads.add(i);}}
function shadow(x,y,w,h){const id='t40_shadow_'+w+'_'+h;if(!defs[id])defs[id]={id,name:'接地影',image:'map/town80/assets/props/shadow.png',passable:true,tags:['overlay','shadow','town40'],drawWidth:w*T*.94,drawHeight:16,drawOffsetX:w*T*.03,drawOffsetY:h*T-10};if(!terrain[at(x,y)])terrain[at(x,y)]=id;}
for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x===0||x===39||y===0||y===19){if(y===19&&x===20)continue;terrain[at(x,y)]='t40_block';blocked.add(at(x,y));ground[at(x,y)]='t40_forest_floor';}
for(let x=1;x<37;x+=3){place(x,0,'wall_h',{force:true});if(x+2<18||x>22)place(x,18,'wall_h',{force:true});}
for(let y=1;y<=16;y+=3){place(0,y,'wall_v',{force:true});place(39,y,'wall_v',{force:true});}
// A narrow central gate is sized to the small town rather than to the 80x80 version.
objects[at(18,15)]='t40_gate';place(18,16,'pier',{force:true});place(21,16,'pier',{force:true});
const plans=[
 ['church','教会',18,1,5,5,2],['townhouse','北西の町家',2,2,3,3,1],['manor','北の館',6,1,4,3,2],
 ['home_stone','石造りの家',11,2,3,3,1],['guild','依頼所',14,2,3,3,1,'guild'],
 ['apothecary','薬草店',24,1,3,3,1],['weapon','武器屋',28,2,4,3,1,'weapon'],['armor','防具屋',33,1,3,3,1,'armor'],['bakery','パン屋',35,4,3,3,1],
 ['home_thatch','西の茅葺き住宅',2,9,3,3,1],['home_timber','庭付きの住宅',6,10,3,3,1],['home_red','赤い屋根の住宅',10,9,3,3,1],
 ['stable','納屋と厩舎',2,14,4,3,2],['townhouse','南西の町家',7,14,3,3,1],
 ['item','道具屋',27,9,3,3,1,'item'],['tavern','酒場',31,10,4,3,1],['inn','宿屋',26,14,4,3,1,'inn'],['home_thatch','南東の住宅',35,14,3,3,1],
];
export const buildings=[];
for(let n=0;n<plans.length;n++){
 const [art,name,x,y,w,h,door,facilityId]=plans[n],id='t40_building_'+art;
 if(!defs[id]){const s=sourceDefs['t80_building_'+art],scale=Math.min(w*T/s.drawWidth,h*T/s.drawHeight),dw=Math.round(s.drawWidth*scale),dh=Math.round(s.drawHeight*scale);defs[id]={...s,id,name,tags:(s.tags||[]).map(t=>t==='town80'?'town40':t),drawWidth:dw,drawHeight:dh,drawOffsetX:Math.round((w*T-dw)/2),drawOffsetY:h*T-dh,footprintWidth:w,footprintHeight:h};}
 if(cells(x,y,w,h).some(i=>blocked.has(i)))throw Error('Building collision '+name);
 objects[at(x,y)]=id;for(const i of cells(x,y,w,h)){blocked.add(i);occupied.add(i);}shadow(x,y,w,h);
 const b={art,name,x,y,w,h,doorX:x+door,doorY:y+h,facilityId,id:'town40_'+(facilityId==='guild'?'request':facilityId||'home')+'_building_'+n};buildings.push(b);
 map.events.push({id:b.id,name,type:'buildingArea',x,y,width:w,height:h,tileId:id});
 if(facilityId)map.events.push({id:b.id+'_door',name:name+'の入口',type:'facilityInteraction',trigger:'interact',x:b.doorX,y:b.doorY,width:1,height:1,facilityId,facing:'up'});
 else map.events.push({id:b.id+'_door',name:name+'の入口',type:'inspect',trigger:'interact',x:b.doorX,y:b.doorY,text:art==='tavern'?'広場を眺めながら食事ができる酒場。宿泊は南側の宿屋へ。':name+'。人の暮らしの気配がする。'});
}
// Streets have two tile-wide main stretches, with one-tile entrances and lanes.
paint(1,6,38,2,'cobble',true);paint(1,13,17,1,'earth',true);paint(25,13,14,1,'cobble',true);
paint(13,8,1,10,'earth',true);paint(24,8,1,10,'cobble',true);paint(1,17,17,1,'earth',true);paint(23,17,16,1,'gravel',true);
paint(13,15,8,1,'earth',true);paint(20,15,5,1,'cobble',true);paint(19,13,2,3,'cobble',true);paint(20,16,1,4,'cobble',true);
for(let y=7;y<=13;y++)for(let x=15;x<=25;x++)if(!blocked.has(at(x,y))){ground[at(x,y)]='t40_'+((x===15||x===25||y===7||y===13)?'border':'plaza');roads.add(at(x,y));}
function join(x,y){const start=at(x,y),parent=new Map([[start,null]]),q=[start];let goal=null;for(const i of q){if(roads.has(i)){goal=i;break;}for(const n of [i-1,i+1,i-W,i+W])if(n>=0&&n<W*H&&!blocked.has(n)&&!parent.has(n)&&Math.abs(i%W-n%W)+Math.abs(Math.floor(i/W)-Math.floor(n/W))===1){parent.set(n,i);q.push(n);}}if(goal===null)throw Error('No entrance route '+x+','+y);for(let i=goal;i!==null;i=parent.get(i)){if(!roads.has(i))ground[i]='t40_earth';roads.add(i);}}
for(const b of buildings){join(b.doorX,b.doorY);for(const i of cells(b.doorX,b.doorY,1,1))reserved.add(i);}
// Domestic gardening remains separate from the commercial stone streets.
for(const [x,y,w,h]of [[2,8,3,1],[7,8,3,1],[1,12,1,1],[11,14,2,1],[35,9,3,1],[34,15,1,2]])for(const i of cells(x,y,w,h))if(!blocked.has(i)&&!roads.has(i)&&!reserved.has(i))ground[i]='t40_crops';
for(const i of cells(15,10,3,3))reserved.add(i);
const propPlan=[
 [19,9,'fountain',true],[16,8,'bench_s',true],[23,11,'bench_s',true],[15,7,'lamp',true],[25,13,'lamp',true],
 [16,12,'flowerbed',true],[23,8,'flowerbed',true],[31,7,'stall',true],
 [11,15,'well',false],[14,16,'cart',false],[1,16,'barrel',false],[30,12,'crate',true],[34,13,'barrel',true],
 [24,4,'flowerbed',false],[9,5,'flowerbed',false],[7,9,'fence_h',false],[35,10,'fence_h',false],
 [1,8,'tree',false],[5,9,'tree',false],[10,14,'pine',false],[38,11,'tree',false],[34,17,'tree',false],
 [14,9,'pine',false],[26,8,'tree',false],[1,1,'tree',false],[37,1,'tree',false],
];
export const placedProps=[],skippedProps=[];
for(const[x,y,n,road]of propPlan){if(place(x,y,n,{road})){placedProps.push({x,y,n});if(['tree','pine','well'].includes(n))shadow(x,y,defs['t40_'+n].footprintWidth||1,defs['t40_'+n].footprintHeight||1);}else skippedProps.push({x,y,n});}
const residentPlan=[
 ['keeper','教会の世話係',23,5,'elder_man','left','町は小さいので、広場からどの店へもすぐですよ。'],
 ['smith','鍛冶屋',32,5,'adult_man','left','武器と防具の店は、この北の通りに並んでいる。'],
 ['vendor','市場の売り手',34,8,'adult_woman','left','今日の品物はこの屋台に揃えてあるよ。'],
 ['elder','井戸を使う住人',10,16,'elder_woman','right','井戸や菜園が近いと、毎日の仕事がしやすいね。'],
 ['child','広場の子',22,10,'boy','left','噴水のそばで待ち合わせだよ。'],
 ['host','酒場の店主',35,12,'adult_man','left','広場を抜けたら、少し休んでいって。'],
 ['guard','門番',23,17,'adult_man','left','町へようこそ。まっすぐ進むと広場だ。'],
];
for(const[id,name,col,row,model,facing,text]of residentPlan){if(blocked.has(at(col,row))||reserved.has(at(col,row)))throw Error('NPC placement '+name);map.npcs.push({id:'town40_'+id,name,col,row,spritePath:'../../map/town80/assets/people/'+model,spriteHeight:48,facing,stationary:true,dialogue:[{speaker:name,text}]});}
const edgeSpecs=new Map(),baseGround=ground.slice();
function family(n){if(['earth','gravel'].includes(n))return 'road';if(['cobble','plaza','border','brick','terrace'].includes(n))return 'road';if(['soil','crops'].includes(n))return 'soil';return 'grass';}
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const i=at(x,y),n=baseGround[i].slice(4);if(!['earth','gravel','soil','crops'].includes(n))continue;
 let mask=0,k=0;const neighbors=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy){const nx=x+dx,ny=y+dy,same=!inside(nx,ny)||family(baseGround[at(nx,ny)].slice(4))===family(n)||occupied.has(at(nx,ny));neighbors.push(same);if(same)mask|=1<<k;k++;}
 if(mask===255)continue;const key=n+'_'+mask.toString(16),id='t40_edge_'+key;
 if(!edgeSpecs.has(key)){const pixels=[];for(let py=0;py<T;py++)for(let px=0;px<T;px++){let d=99,b=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;if(!neighbors[b])d=Math.min(d,Math.hypot(Math.max(dx*T-px-.5,0,px+.5-(dx+1)*T),Math.max(dy*T-py-.5,0,py+.5-(dy+1)*T)));b++;}pixels.push(d>=2.5+(((px*13+py*19+(px^py)*7)%5)-2)*.4?255:0);}edgeSpecs.set(key,{key,material:n,pixels});defs[id]={id,name:'地面の境目 '+key,image:'map/town40/assets/ground/edge_'+key+'.png',passable:true,tags:['ground','town40']};}
 ground[i]=id;
}
const specification={tileSize:T,width:W,height:H,buildings,placedProps,skippedProps,sceneSpace:{x:15,y:10,width:3,height:3},spawn:map.spawn,doors:buildings.map(b=>({name:b.name,x:b.doorX,y:b.doorY}))};
await fs.mkdir(new URL('assets/ground/',here),{recursive:true});
for(const[file,data]of [['town40.record.json',{type:'healer-map-editor-record',version:1,savedAt:new Date().toISOString(),map}],['town40.tiles.json',defs],['layout.json',specification],['edge-specs.json',[...edgeSpecs.values()]]])await fs.writeFile(new URL(file,here),JSON.stringify(data,null,2)+'\n');
await fs.writeFile(new URL('town40-data.js',here),'window.TOWN40_DATA='+JSON.stringify({map,defs,specification})+';\n');
await fs.writeFile(new URL('town40-map.js',here),'window.HEALER_TILE_MAPS=window.HEALER_TILE_MAPS||{};\nwindow.HEALER_TILE_MAPS.rihasTown40='+JSON.stringify(map,null,2)+';\n');
await fs.writeFile(new URL('town40-tiles.js',here),'window.HEALER_TILE_DEFS=window.HEALER_TILE_DEFS||{};\nObject.assign(window.HEALER_TILE_DEFS,'+JSON.stringify(defs,null,2)+');\n');
console.log(JSON.stringify({buildings:buildings.length,residents:map.npcs.length,props:placedProps.length,skippedProps,edgeMaterials:edgeSpecs.size}));
