param([switch]$MaterialsOnly)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
public static class Town80Edges {
 public static void Bake(string grassPath,string materialPath,string destination,byte[] mask){
  using(var grass=new Bitmap(grassPath))using(var tile=new Bitmap(materialPath))using(var output=new Bitmap(32,32)){
   for(int y=0;y<32;y++)for(int x=0;x<32;x++){
    var c=mask[y*32+x]>0?tile.GetPixel(x,y):grass.GetPixel(x,y);
    if(mask[y*32+x]>0&&((x>0&&mask[y*32+x-1]==0)||(x<31&&mask[y*32+x+1]==0)||(y>0&&mask[(y-1)*32+x]==0)||(y<31&&mask[(y+1)*32+x]==0)))c=Color.FromArgb(255,(int)(c.R*.88),(int)(c.G*.88),(int)(c.B*.88));
    output.SetPixel(x,y,c);
   }
   output.Save(destination,ImageFormat.Png);
  }
 }
}
'@ -ReferencedAssemblies System.Drawing
$work=if($PSScriptRoot){$PSScriptRoot}else{(Resolve-Path -LiteralPath 'healer-game/map/town80').Path}
$project=(Resolve-Path -LiteralPath (Join-Path $work '../..')).Path
$specs=Get-Content -LiteralPath "$work/edge-specs.json" -Raw -Encoding UTF8 | ConvertFrom-Json
foreach($s in $specs){[Town80Edges]::Bake("$work/assets/ground/grass.png","$work/assets/ground/$($s.material).png","$work/assets/ground/edge_$($s.key).png",[byte[]]$s.pixels)}
if($MaterialsOnly){Write-Output "Prepared $($specs.Count) material edges.";return}
$calls=Get-Content -LiteralPath "$work/draw-calls.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$b=New-Object System.Drawing.Bitmap 2560,2560
$g=[System.Drawing.Graphics]::FromImage($b)
$g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
$images=@{}
try{
 foreach($c in $calls){if(-not $images.ContainsKey($c.src)){$images[$c.src]=[System.Drawing.Image]::FromFile((Join-Path $project $c.src))};$g.DrawImage($images[$c.src],[System.Drawing.RectangleF]::new([single]$c.x,[single]$c.y,[single]$c.w,[single]$c.h))}
 $b.Save("$work/town80-map-only.png",[System.Drawing.Imaging.ImageFormat]::Png)
 $record=Get-Content -LiteralPath "$work/town80.record.json" -Raw -Encoding UTF8 | ConvertFrom-Json
 foreach($npc in $record.map.npcs){
  $model=($npc.spritePath -split '/')[-1]
  $im=[System.Drawing.Image]::FromFile("$work/assets/people/$model/walk/$($npc.facing)_02.png")
  try{
   $x=$npc.col*32;$y=$npc.row*32-25
   $brush=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(52,15,23,25))
   $g.FillEllipse($brush,$x+5,$npc.row*32+14,22,9);$brush.Dispose()
   $g.DrawImageUnscaled($im,$x,$y)
  }finally{$im.Dispose()}
 }
 $b.Save("$work/town80-preview.png",[System.Drawing.Imaging.ImageFormat]::Png)
 foreach($view in @(@{name='plaza';x=832;y=864;w=960;h=640},@{name='residential';x=224;y=768;w=960;h=640},@{name='market';x=1504;y=736;w=960;h=640},@{name='gate';x=896;y=1888;w=960;h=640},@{name='church';x=832;y=160;w=960;h=640})){
  $crop=New-Object System.Drawing.Bitmap $view.w,$view.h
  $cg=[System.Drawing.Graphics]::FromImage($crop)
  try{$cg.DrawImageUnscaled($b,-$view.x,-$view.y);$crop.Save("$work/town80-$($view.name).png",[System.Drawing.Imaging.ImageFormat]::Png)}finally{$cg.Dispose();$crop.Dispose()}
 }
}finally{$g.Dispose();$b.Dispose();foreach($im in $images.Values){$im.Dispose()}}
Write-Output "Rendered 2560x2560 town and five game-size district views."
