# Convert every .mkv in a folder to .mp4 without re-encoding the video.
# Audio is copied when it is already AAC, otherwise re-encoded to AAC 160k (fast, tiny quality cost).
# Usage:  powershell -ExecutionPolicy Bypass -File remux-mkv.ps1 "D:\path\to\DSA-archive"
# Needs ffmpeg/ffprobe on PATH:  winget install Gyan.FFmpeg
param([Parameter(Mandatory = $true)][string]$Folder)

Get-ChildItem -LiteralPath $Folder -Filter *.mkv | ForEach-Object {
    $in = $_.FullName
    $out = [System.IO.Path]::ChangeExtension($in, '.mp4')
    if (Test-Path -LiteralPath $out) { Write-Host "skip (exists): $out"; return }

    $video = (& ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$in").Trim()
    $audio = (& ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 "$in").Trim()
    $vArgs = if ($video -in @('h264', 'hevc')) { @('-c:v', 'copy') } else { @('-c:v', 'libx264', '-crf', '20', '-preset', 'medium') }
    $aArgs = if ($audio -eq 'aac') { @('-c:a', 'copy') } else { @('-c:a', 'aac', '-b:a', '160k') }
    $tag = if ($video -eq 'hevc') { @('-tag:v', 'hvc1') } else { @() }

    Write-Host "$($_.Name): video=$video audio=$audio"
    & ffmpeg -hide_banner -loglevel error -i "$in" -map 0:v:0 -map '0:a?' @vArgs @tag @aArgs -movflags +faststart "$out"
    if ($LASTEXITCODE -eq 0) { Write-Host "  -> $out" } else { Write-Warning "  failed: $in" }
}
