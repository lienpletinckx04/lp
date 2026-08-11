#!/usr/bin/env bash
#
# AskLien.ai — bulk b-roll renderer
#
# Zet ruwe clips uit broll/clips/ om naar postklare Instagram reels in broll/out/:
# 1080x1920, 30fps, bijgesneden, met een hook in de huisstijl in beeld gebrand.
#
# Gebruik:
#   ./broll/make-reels.sh                 # alles in clips/, hooks uit hooks.txt
#   DUUR=5 ./broll/make-reels.sh          # clips van 5 seconden
#   STIJL=creme POSITIE=onder ./broll/make-reels.sh
#   AUDIO=1 ./broll/make-reels.sh         # originele audio behouden
#
# Instellingen (allemaal optioneel, als omgevingsvariabele):
#   DUUR=7            lengte van elke reel in seconden
#   START=0           hoeveel seconden je vooraan van elke clip afknipt
#   STIJL=vermiljoen  vermiljoen | creme | donker | geen
#   POSITIE=boven     boven | midden | onder
#   HANDLE=@asklien.ai   klein label onderaan, leeg = geen label
#   AUDIO=0           1 = originele audio behouden
#   FONT=/pad/naar/font.ttf
#
# Nodig: ffmpeg (macOS: brew install ffmpeg)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

CLIPS="${CLIPS:-clips}"
OUT="${OUT:-out}"
HOOKS="${HOOKS:-hooks.txt}"
PLAN="${PLAN:-plan.csv}"

DUUR="${DUUR:-7}"
START="${START:-0}"
STIJL="${STIJL:-vermiljoen}"
POSITIE="${POSITIE:-boven}"
HANDLE="${HANDLE:-@asklien.ai}"
AUDIO="${AUDIO:-0}"
BREEDTE="${BREEDTE:-18}"   # tekens per regel voor het afbreken van de hook

TMP="$ROOT/.tmp"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is niet geïnstalleerd."
  echo "  macOS:   brew install ffmpeg"
  echo "  Ubuntu:  sudo apt install ffmpeg"
  exit 1
fi

# --- Lettertype zoeken -------------------------------------------------------
# Archivo is het beste (huisstijl). Staat het niet op je systeem, dan pakken we
# de dikste schreefloze die er wel is. Download Archivo gratis via Google Fonts
# en zet Archivo-Black.ttf naast dit script voor een exacte match.
find_font() {
  if [ -n "${FONT:-}" ] && [ -f "$FONT" ]; then echo "$FONT"; return; fi
  local kandidaten=(
    "$ROOT/Archivo-Black.ttf"
    "$ROOT/Archivo-Bold.ttf"
    "$HOME/Library/Fonts/Archivo-Black.ttf"
    "/Library/Fonts/Archivo-Black.ttf"
    "/System/Library/Fonts/Supplemental/Arial Black.ttf"
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    "/System/Library/Fonts/Helvetica.ttc"
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
    "C:/Windows/Fonts/arialbd.ttf"
  )
  for f in "${kandidaten[@]}"; do
    [ -f "$f" ] && { echo "$f"; return; }
  done
  # laatste redmiddel: eender welke ttf op het systeem
  local gevonden
  gevonden="$(find /usr/share/fonts /Library/Fonts "$HOME/Library/Fonts" -name '*.ttf' 2>/dev/null | head -1)"
  echo "$gevonden"
}

FONTFILE="$(find_font)"
if [ -z "$FONTFILE" ]; then
  echo "Geen lettertype gevonden. Zet een .ttf naast dit script en gebruik FONT=/pad/naar/font.ttf"
  exit 1
fi

# --- Kleuren per stijl -------------------------------------------------------
case "$STIJL" in
  vermiljoen) TEKSTKLEUR="0xf6f1e7"; BOXKLEUR="0xff4d24@1.0"; BOX=1 ;;
  creme)      TEKSTKLEUR="0x1c1a1f"; BOXKLEUR="0xf6f1e7@1.0"; BOX=1 ;;
  donker)     TEKSTKLEUR="0xf6f1e7"; BOXKLEUR="0x1c1a1f@1.0"; BOX=1 ;;
  geen)       TEKSTKLEUR="0xf6f1e7"; BOXKLEUR="0x000000@0.0"; BOX=0 ;;
  *) echo "Onbekende STIJL: $STIJL (kies vermiljoen, creme, donker of geen)"; exit 1 ;;
esac

# --- Hooks inlezen -----------------------------------------------------------
hooks=()
if [ -f "$HOOKS" ]; then
  while IFS= read -r regel || [ -n "$regel" ]; do
    regel="${regel#"${regel%%[![:space:]]*}"}"   # links trimmen
    regel="${regel%"${regel##*[![:space:]]}"}"   # rechts trimmen
    [ -z "$regel" ] && continue
    case "$regel" in \#*) continue ;; esac
    hooks+=("$regel")
  done < "$HOOKS"
fi

# --- Clips verzamelen --------------------------------------------------------
shopt -s nullglob nocaseglob
clips=("$CLIPS"/*.mp4 "$CLIPS"/*.mov "$CLIPS"/*.m4v "$CLIPS"/*.webm "$CLIPS"/*.avi)
shopt -u nocaseglob
IFS=$'\n' clips=($(printf '%s\n' "${clips[@]}" | sort)); unset IFS

if [ ${#clips[@]} -eq 0 ]; then
  echo "Geen clips gevonden in $CLIPS/"
  echo "Dump je ruwe telefoonvideo's daar en draai dit script opnieuw."
  exit 1
fi

mkdir -p "$OUT" "$TMP"
rm -f "$TMP"/*.txt 2>/dev/null || true

# --- Tekst afbreken op woordgrens -------------------------------------------
wrap() {
  awk -v max="$BREEDTE" '{
    regel = ""
    for (i = 1; i <= NF; i++) {
      kandidaat = (regel == "" ? $i : regel " " $i)
      if (length(kandidaat) > max && regel != "") { print regel; regel = $i }
      else { regel = kandidaat }
    }
    if (regel != "") print regel
  }'
}

# --- Verticale positie -------------------------------------------------------
case "$POSITIE" in
  boven)  YPOS="340" ;;
  midden) YPOS="(h-text_h)/2" ;;
  onder)  YPOS="h-text_h-620" ;;
  *) echo "Onbekende POSITIE: $POSITIE (kies boven, midden of onder)"; exit 1 ;;
esac

echo "Lettertype : $FONTFILE"
echo "Stijl      : $STIJL, hook $POSITIE, ${DUUR}s per reel"
echo "Clips      : ${#clips[@]}   Hooks: ${#hooks[@]}"
echo

# --- Renderen ----------------------------------------------------------------
teller=0
mislukt=0
for clip in "${clips[@]}"; do
  teller=$((teller + 1))
  nr="$(printf '%02d' "$teller")"

  if [ ${#hooks[@]} -gt 0 ]; then
    hook="${hooks[$(( (teller - 1) % ${#hooks[@]} ))]}"
  else
    hook=""
  fi

  # bestandsnaam uit de hook: kleine letters, streepjes, geen accenten
  slug="$(printf '%s' "$hook" | tr '[:upper:]' '[:lower:]' \
    | sed 's/[àáâãä]/a/g; s/[èéêë]/e/g; s/[ìíîï]/i/g; s/[òóôõö]/o/g; s/[ùúûü]/u/g; s/ç/c/g' \
    | sed 's/[^a-z0-9]\+/-/g; s/^-//; s/-$//' | cut -c1-40)"
  [ -z "$slug" ] && slug="broll"
  doel="$OUT/reel-$nr-$slug.mp4"

  # hooktekst naar een bestand (zo hoeven we niks te escapen in de filtergraph)
  hooktxt="$TMP/hook-$nr.txt"
  printf '%s\n' "$hook" | wrap > "$hooktxt"
  regels="$(wc -l < "$hooktxt" | tr -d ' ')"

  # lettergrootte: krimpt mee als de hook lang is
  langste="$(awk '{ if (length($0) > m) m = length($0) } END { print m+0 }' "$hooktxt")"
  [ "$langste" -lt 1 ] && langste=1
  FS=$(( 900 / langste ))
  [ "$FS" -gt 96 ] && FS=96
  [ "$FS" -lt 46 ] && FS=46
  [ "$regels" -ge 4 ] && FS=$(( FS * 85 / 100 ))

  filters="scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p"

  if [ -n "$hook" ]; then
    filters="$filters,drawtext=textfile=.tmp/hook-$nr.txt:fontfile=$FONTFILE"
    filters="$filters:fontsize=$FS:fontcolor=$TEKSTKLEUR:line_spacing=16"
    filters="$filters:box=$BOX:boxcolor=$BOXKLEUR:boxborderw=34"
    filters="$filters:x=(w-text_w)/2:y=$YPOS"
  fi

  if [ -n "$HANDLE" ]; then
    handletxt="$TMP/handle.txt"
    printf '%s\n' "$HANDLE" > "$handletxt"
    filters="$filters,drawtext=textfile=.tmp/handle.txt:fontfile=$FONTFILE"
    filters="$filters:fontsize=38:fontcolor=0xf6f1e7:box=1:boxcolor=0x1c1a1f@0.85:boxborderw=18"
    filters="$filters:x=(w-text_w)/2:y=h-400"
  fi

  audio_args=(-an)
  [ "$AUDIO" = "1" ] && audio_args=(-c:a aac -b:a 128k)

  printf '  [%s/%s] %s  ->  %s\n' "$teller" "${#clips[@]}" "$(basename "$clip")" "$(basename "$doel")"

  if ffmpeg -hide_banner -loglevel error -y \
      -ss "$START" -t "$DUUR" -i "$clip" \
      -vf "$filters" \
      -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 30 \
      "${audio_args[@]}" -movflags +faststart \
      "$doel" 2>"$TMP/err-$nr.log"; then
    :
  else
    mislukt=$((mislukt + 1))
    echo "      mislukt — zie $TMP/err-$nr.log"
  fi
done

echo
gelukt=$(( teller - mislukt ))
[ "$gelukt" -eq 1 ] && woord="reel staat" || woord="reels staan"
if [ "$mislukt" -gt 0 ]; then
  echo "Klaar met $mislukt fout(en). $gelukt $woord in $OUT/"
else
  echo "Klaar. $gelukt $woord in $OUT/ — direct postklaar, geen editing nodig."
fi
echo "Captions vind je in broll/captions.md"
