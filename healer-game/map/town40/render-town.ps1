param([switch]$MaterialsOnly)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
public static class Town40Edges {
 public static void Bake(string grassPath,string materialPath,string destination,byte[] mask){using(var grass=new Bitmap(grassPath))using(var tile=new Bitmap(materialPath))using(var output=new Bitmap(32,32)){
  for(int y=0;y<32;y++)for(int x=0;x<32;x++){var c=mask[y*32+x]>0?tile.GetPixel(x,y):grass.GetPixel(x,y);if(mask[y*32+x]>0&&((x>0&&mask[y*32+x-1]==0)||(x<31&&mask[y*32+x+1]==0)||(y>0&&mask[(y-1)*32+x]==0)||(y<31&&mask[(y+1)*32+x]==0)))c=Color.FromArgb(255,(int)(c.R*.88),(int)(c.G*.88),(int)(c.B*.88));output.SetPixel(x,y,c);}output.Save(destination,ImageFormat.Png);
 }}
}
'@ -ReferencedAssemblies System.Drawing
$work=if($PSScriptRoot){$PSScriptRoot}else{(Resolve-Path -LiteralPath 'healer-game/map/town40').Path}
$project=(Resolve-Path -LiteralPath (Join-Path $work '../..')).Path
$shared=(Resolve-Path -LiteralPath (Join-Path $work '../town80')).Path
$specs=Get-Content -LiteralPath "$work/edge-specs.json" -Raw -Encoding UTF8 | ConvertFrom-Json
foreach($s in $specs){[Town40Edges]::Bake("$shared/assets/ground/grass.png","$shared/assets/ground/$($s.material).png","$work/assets/ground/edge_$($s.key).png",[byte[]]$s.pixels)}
if($MaterialsOnly){Write-Output "Prepared $($specs.Count) compact-map material edges.";return}
$calls=Get-Content -LiteralPath "$work/draw-calls.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$b=New-Object System.Drawing.Bitmap 1280,640
$g=[System.Drawing.Graphics]::FromImage($b)
$g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
$images=@{}
try{
 foreach($c in $calls){if(-not $images.ContainsKey($c.src)){$images[$c.src]=[System.Drawing.Image]::FromFile((Join-Path $project $c.src))};$g.DrawImage($images[$c.src],[System.Drawing.RectangleF]::new([single]$c.x,[single]$c.y,[single]$c.w,[single]$c.h))}
 $b.Save("$work/town40-map-only.png",[System.Drawing.Imaging.ImageFormat]::Png)
 $record=Get-Content -LiteralPath "$work/town40.record.json" -Raw -Encoding UTF8 | ConvertFrom-Json
 foreach($npc in $record.map.npcs){$model=($npc.spritePath -split '/')[-1];$im=[System.Drawing.Image]::FromFile("$shared/assets/people/$model/walk/$($npc.facing)_02.png");try{$brush=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(52,15,23,25));$g.FillEllipse($brush,$npc.col*32+5,$npc.row*32+14,22,9);$brush.Dispose();$g.DrawImageUnscaled($im,$npc.col*32,$npc.row*32-25)}finally{$im.Dispose()}}
 $b.Save("$work/town40-preview.png",[System.Drawing.Imaging.ImageFormat]::Png)
}finally{$g.Dispose();$b.Dispose();foreach($im in $images.Values){$im.Dispose()}}
Write-Output 'Rendered the 1280x640 compact town.'
