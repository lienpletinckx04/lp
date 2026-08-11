#!/usr/bin/env bash
#
# AskLien.ai — reddingsscript voor exports uit de browser
#
# De B-roll Studio schrijft mp4-bestanden, maar welke codec daarin zit hangt van je
# browser af. Weigert Instagram een reel, of krijg je een .webm, zet hem dan hiermee
# om naar het formaat dat Instagram altijd slikt: H.264 video, AAC audio, 1080x1920.
#
# Gebruik:
#   ./broll/fix-mp4.sh                        # alles in out/ nakijken en omzetten
#   ./broll/fix-mp4.sh ~/Downloads/reel-01.mp4    # losse bestanden
#
# Omgezette bestanden krijgen het achtervoegsel -ig.mp4 naast het origineel.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is niet geïnstalleerd. macOS: brew install ffmpeg"
  exit 1
fi

bestanden=("$@")
if [ ${#bestanden[@]} -eq 0 ]; then
  shopt -s nullglob
  bestanden=("$ROOT/out"/*.mp4 "$ROOT/out"/*.webm)
  shopt -u nullglob
fi

if [ ${#bestanden[@]} -eq 0 ]; then
  echo "Niets gevonden om om te zetten. Geef een bestand mee of vul out/ eerst."
  exit 1
fi

omgezet=0
overgeslagen=0

for bestand in "${bestanden[@]}"; do
  [ -f "$bestand" ] || continue
  case "$bestand" in *-ig.mp4) continue ;; esac

  codec="$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$bestand" 2>/dev/null || true)"
  ext="${bestand##*.}"

  if [ "$codec" = "h264" ] && [ "$ext" = "mp4" ]; then
    echo "  ok        $(basename "$bestand")  (h264/mp4, Instagram is tevreden)"
    overgeslagen=$((overgeslagen + 1))
    continue
  fi

  doel="${bestand%.*}-ig.mp4"
  echo "  omzetten  $(basename "$bestand")  ($codec)  ->  $(basename "$doel")"

  ffmpeg -hide_banner -loglevel error -y -i "$bestand" \
    -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" \
    -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
    -c:a aac -b:a 128k -movflags +faststart \
    "$doel"

  omgezet=$((omgezet + 1))
done

echo
echo "$omgezet omgezet, $overgeslagen waren al goed."
