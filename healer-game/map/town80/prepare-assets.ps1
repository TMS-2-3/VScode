$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
public static class Town80Asset {
 static int Q(int c){return Math.Max(0,Math.Min(255,(int)Math.Round(c/8.0)*8));}
 public static void Sprite(string source,string destination,double l,double t,double r,double b,int width,int height){
  using(var src=new Bitmap(source))using(var dst=new Bitmap(width,height)){
   int x0=(int)(l*src.Width),y0=(int)(t*src.Height),x1=(int)(r*src.Width)-1,y1=(int)(b*src.Height)-1;
   int cw=x1-x0+1,ch=y1-y0+1;bool[] seen=new bool[cw*ch];int[] labels=new int[cw*ch];
   var components=new System.Collections.Generic.List<System.Collections.Generic.List<int>>();int largest=0;
   for(int y=0;y<ch;y++)for(int x=0;x<cw;x++){
    int start=y*cw+x;if(seen[start]||src.GetPixel(x+x0,y+y0).A<128)continue;
    var component=new System.Collections.Generic.List<int>();var queue=new System.Collections.Generic.Queue<int>();queue.Enqueue(start);seen[start]=true;
    while(queue.Count>0){int i=queue.Dequeue();component.Add(i);labels[i]=components.Count+1;int px=i%cw,py=i/cw;
     for(int dy=-1;dy<=1;dy++)for(int dx=-1;dx<=1;dx++){int nx=px+dx,ny=py+dy;if(nx<0||nx>=cw||ny<0||ny>=ch)continue;int n=ny*cw+nx;if(!seen[n]&&src.GetPixel(nx+x0,ny+y0).A>=128){seen[n]=true;queue.Enqueue(n);}}
    }
    largest=Math.Max(largest,component.Count);components.Add(component);
   }
   bool[] keep=new bool[components.Count+1];int ax=x1,ay=y1,bx=x0,by=y0;
   for(int c=0;c<components.Count;c++)if(components[c].Count>=largest*.055){keep[c+1]=true;foreach(int i in components[c]){int x=i%cw+x0,y=i/cw+y0;ax=Math.Min(ax,x);ay=Math.Min(ay,y);bx=Math.Max(bx,x);by=Math.Max(by,y);}}
   if(bx<ax||by<ay)throw new Exception("Empty sprite: "+destination);
   double s=Math.Min((width-2.0)/(bx-ax+1),(height-2.0)/(by-ay+1));
   int w=Math.Max(1,(int)Math.Round((bx-ax+1)*s)),h=Math.Max(1,(int)Math.Round((by-ay+1)*s));
   int ox=(width-w)/2,oy=height-h;
   for(int y=0;y<h;y++)for(int x=0;x<w;x++){
    int sx=Math.Min(bx,ax+(int)((x+.5)*(bx-ax+1)/w)),sy=Math.Min(by,ay+(int)((y+.5)*(by-ay+1)/h));
    var c=src.GetPixel(sx,sy);if(c.A>=128&&keep[labels[(sy-y0)*cw+sx-x0]])dst.SetPixel(x+ox,y+oy,Color.FromArgb(255,Q(c.R),Q(c.G),Q(c.B)));
   }
   dst.Save(destination,ImageFormat.Png);
  }
 }
 public static void Ground(string source,string destination,int col,int row){
  using(var src=new Bitmap(source))using(var dst=new Bitmap(32,32)){
   double[,,] pixels=new double[32,32,3];
   for(int y=0;y<32;y++)for(int x=0;x<32;x++){
    int sx=(int)((col+(x+.5)/32.0)*src.Width/4),sy=(int)((row+(y+.5)/32.0)*src.Height/4);
    var c=src.GetPixel(Math.Min(src.Width-1,sx),Math.Min(src.Height-1,sy));
    pixels[y,x,0]=c.R;pixels[y,x,1]=c.G;pixels[y,x,2]=c.B;
   }
   for(int d=0;d<2;d++){double a=.5*(2-d)/2.0;for(int i=0;i<32;i++)for(int k=0;k<3;k++){double v=pixels[i,d,k],w=pixels[i,31-d,k];pixels[i,d,k]=v*(1-a)+w*a;pixels[i,31-d,k]=w*(1-a)+v*a;}}
   for(int d=0;d<2;d++){double a=.5*(2-d)/2.0;for(int i=0;i<32;i++)for(int k=0;k<3;k++){double v=pixels[d,i,k],w=pixels[31-d,i,k];pixels[d,i,k]=v*(1-a)+w*a;pixels[31-d,i,k]=w*(1-a)+v*a;}}
   for(int y=0;y<32;y++)for(int x=0;x<32;x++)dst.SetPixel(x,y,Color.FromArgb(255,Q((int)pixels[y,x,0]),Q((int)pixels[y,x,1]),Q((int)pixels[y,x,2])));
   dst.Save(destination,ImageFormat.Png);
  }
 }
 public static void Rotate(string source,string destination){using(var im=new Bitmap(source)){im.RotateFlip(RotateFlipType.Rotate90FlipNone);im.Save(destination,ImageFormat.Png);}}
 public static void Ellipse(string destination,int width,int height,int alpha){using(var im=new Bitmap(width,height)){
  for(int y=0;y<height;y++)for(int x=0;x<width;x++){double d=Math.Pow((x+.5-width/2.0)/(width/2.0),2)+Math.Pow((y+.5-height/2.0)/(height/2.0),2);if(d<1)im.SetPixel(x,y,Color.FromArgb((int)(alpha*Math.Pow(1-d,.65)),20,28,28));}
  im.Save(destination,ImageFormat.Png);
 }}
}
'@ -ReferencedAssemblies System.Drawing
$assetScriptDirectory=if($PSScriptRoot){$PSScriptRoot}else{(Resolve-Path -LiteralPath 'healer-game/map/town80').Path}
$assets=Join-Path $assetScriptDirectory 'assets'
$buildingNames=@('weapon','armor','inn','item','tavern','bakery','guild','apothecary','home_thatch','home_stone','home_red','home_timber','townhouse','manor','stable','mill')
$sizes=@(@(256,224),@(224,224),@(320,256),@(224,192),@(288,224),@(224,192),@(224,224),@(224,224),@(192,160),@(224,192),@(224,192),@(192,192),@(224,224),@(256,224),@(288,192),@(256,288))
$cols=@(0,.265,.5,.77,1)
$rows=@(0,.256,.515,.76,1)
for($i=0;$i -lt 16;$i++){
 $c=$i%4;$r=[int][Math]::Floor($i/4)
 [Town80Asset]::Sprite("$assets/source/buildings-atlas.png","$assets/buildings/$($buildingNames[$i]).png",$cols[$c],$rows[$r],$cols[$c+1],$rows[$r+1],$sizes[$i][0],$sizes[$i][1])
}
$propNames=@('church','gate','fountain','tree','pine','lamp','bench_s','bench_e','cart','crate','barrel','well','fence_h','wall_h','stall','flowerbed')
$propSizes=@(@(320,384),@(256,288),@(160,160),@(96,112),@(64,112),@(24,64),@(64,32),@(32,64),@(64,48),@(32,32),@(32,32),@(64,64),@(96,32),@(96,32),@(96,64),@(64,32))
$cols=@(0,.265,.515,.765,1)
$rows=@(0,.355,.603,.824,1)
for($i=0;$i -lt 16;$i++){
 $c=$i%4;$r=[int][Math]::Floor($i/4)
 [Town80Asset]::Sprite("$assets/source/props-atlas.png","$assets/props/$($propNames[$i]).png",$cols[$c],$rows[$r],$cols[$c+1],$rows[$r+1],$propSizes[$i][0],$propSizes[$i][1])
}
[Town80Asset]::Rotate("$assets/props/wall_h.png","$assets/props/wall_v.png")
[Town80Asset]::Rotate("$assets/props/fence_h.png","$assets/props/fence_v.png")
$groundNames=@('grass','grass2','earth','cobble','plaza','border','water','water2','soil','crops','gravel','drygrass','brick','moss_stone','terrace','forest_floor')
for($i=0;$i -lt 16;$i++){[Town80Asset]::Ground("$assets/source/ground-atlas.png","$assets/ground/$($groundNames[$i]).png",($i%4),[int][Math]::Floor($i/4))}
[Town80Asset]::Ellipse("$assets/props/shadow.png",64,24,86)
$empty=New-Object System.Drawing.Bitmap 32,32
$empty.Save("$assets/props/collision.png",[System.Drawing.Imaging.ImageFormat]::Png)
$empty.Dispose()
$project=(Resolve-Path -LiteralPath (Join-Path $assetScriptDirectory '../..')).Path
foreach($model in @('adult_man','adult_woman','boy','girl','elder_man','elder_woman')){
 $target=Join-Path $assets "people/$model/walk"
 New-Item -Path $target -ItemType Directory -Force | Out-Null
 foreach($direction in @('up','down','left','right')){foreach($frame in @('01','02','03')){
  $source=Join-Path $project "img/npc/npc_$($model)_img/walk_2head/$($direction)_$($frame).png"
  [Town80Asset]::Sprite($source,"$target/$($direction)_$($frame).png",0,0,1,1,32,48)
 }}
}
Write-Output 'Prepared 16 buildings, church and gate, matching props and sixteen 32px materials.'
