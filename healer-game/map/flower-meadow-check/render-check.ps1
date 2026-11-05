param([string]$Stage='after',[string]$TileOverride='')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$work=if($PSScriptRoot){$PSScriptRoot}else{(Resolve-Path -LiteralPath 'healer-game/map/flower-meadow-check').Path}
$project=(Resolve-Path -LiteralPath (Join-Path $work '../..')).Path
$calls=Get-Content -LiteralPath "$work/draw-calls.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$bitmap=[System.Drawing.Bitmap]::new(1200,960)
$graphics=[System.Drawing.Graphics]::FromImage($bitmap)
$graphics.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$graphics.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
$images=@{}
try {
  foreach($call in $calls){
    if(-not $images.ContainsKey($call.src)){
      $path=if($TileOverride -and $call.src -eq 'map/img_tile/rpg_village/flower_meadow_01.png'){$TileOverride}else{Join-Path $project $call.src}
      $images[$call.src]=[System.Drawing.Image]::FromFile($path)
    }
    $graphics.DrawImage($images[$call.src],[System.Drawing.RectangleF]::new($call.x,$call.y,$call.w,$call.h))
  }
  $bitmap.Save("$work/map-$Stage.png",[System.Drawing.Imaging.ImageFormat]::Png)
} finally {$graphics.Dispose();$bitmap.Dispose();foreach($image in $images.Values){$image.Dispose()}}
Write-Output "Rendered flower-meadow map: $Stage"
