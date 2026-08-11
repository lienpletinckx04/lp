# B-roll systeem — AskLien.ai

Ruwe telefoonclips in, postklare Instagram reels uit. Geen editor, geen tijdlijn, geen
Premiere. Je filmt één keer per maand en post er weken op verder.

Elke reel komt eruit als **1080x1920, 30fps, 7 seconden**, met je hook in de huisstijl
in beeld gebrand en `@asklien.ai` onderaan. Muziek voeg je toe in Instagram zelf.

## De werkwijze

```
1. Filmen        20 clips in 30 minuten          →  shotlist.md
2. Dumpen        alles in broll/clips/
3. Renderen      één klik of één commando        →  broll/out/
4. Posten        caption erbij, muziek in IG     →  captions.md
```

## Twee manieren om te renderen

Beide geven hetzelfde resultaat. Kies wat past bij je moment.

### A. In de browser — geen installatie

Dubbelklik **`index.html`**. Sleep je clips erin, kies een stijl, klik *Render alles*.
De reels downloaden vanzelf.

- Werkt op elke computer, ook zonder terminal.
- Je video's verlaten je computer niet: alles gebeurt lokaal in de browser.
- **Gebruik Safari** op een Mac. Chrome kan er een codec in stoppen die Instagram niet
  slikt. De pagina zegt bovenaan zelf of je browser mp4 aankan, en `fix-mp4.sh` redt
  achteraf wat er misging.

### B. In de terminal — de zekere weg

```bash
./broll/make-reels.sh
```

Leest alles uit `clips/`, koppelt er hooks uit `hooks.txt` aan en schrijft de reels naar
`out/`. Altijd H.264 in mp4, dus Instagram klaagt nooit.

Vereist ffmpeg — op Mac: `brew install ffmpeg`.

Instellingen zet je ervoor:

```bash
DUUR=5 ./broll/make-reels.sh                    # reels van 5 seconden
STIJL=creme POSITIE=onder ./broll/make-reels.sh # crème blok, onderaan
START=2 ./broll/make-reels.sh                   # eerste 2 seconden wegknippen
AUDIO=1 ./broll/make-reels.sh                   # originele audio houden
HANDLE="" ./broll/make-reels.sh                 # zonder label onderaan
```

| Instelling | Standaard | Wat het doet |
|---|---|---|
| `DUUR` | `7` | lengte van elke reel in seconden |
| `START` | `0` | hoeveel seconden je vooraan wegknipt |
| `STIJL` | `vermiljoen` | `vermiljoen`, `creme`, `donker` of `geen` |
| `POSITIE` | `boven` | `boven`, `midden` of `onder` |
| `HANDLE` | `@asklien.ai` | label onderaan, leeg = geen |
| `AUDIO` | `0` | `1` = originele audio behouden |
| `FONT` | automatisch | pad naar een `.ttf` |

**Lettertype.** Het script pakt de dikste schreefloze die het vindt. Wil je exact de
huisstijl, download dan [Archivo](https://fonts.google.com/specimen/Archivo) en zet
`Archivo-Black.ttf` naast dit bestand. Dan gebruikt het script die vanzelf.

## Weigert Instagram een bestand?

```bash
./broll/fix-mp4.sh
```

Kijkt alles in `out/` na en zet om wat niet H.264/mp4 is. Losse bestanden mag ook:
`./broll/fix-mp4.sh ~/Downloads/reel-01.mp4`

## Wat waar staat

| Bestand | Waarvoor |
|---|---|
| `index.html` | B-roll Studio, de browserversie |
| `make-reels.sh` | bulk renderen via ffmpeg |
| `fix-mp4.sh` | omzetten naar een formaat dat Instagram zeker slikt |
| `hooks.txt` | de hookbank — hier haal je je tekst |
| `captions.md` | captionsjablonen, hashtagsets, postritme |
| `shotlist.md` | 20 shots die je in één sessie filmt |
| `clips/` | jouw ruwe clips (blijven lokaal, gaan niet in git) |
| `out/` | de afgewerkte reels (blijven lokaal, gaan niet in git) |

## Zelf hooks toevoegen

Zet ze in `hooks.txt`, één per lijn. Clip 1 krijgt hook 1, clip 2 hook 2, enzovoort.
Meer clips dan hooks? Dan begint het script gewoon opnieuw bovenaan.

Wat een hook goed maakt: maximaal 8 woorden, leesbaar in één seconde, geschreven voor
iemand die je nog niet volgt, en één idee per hook. Zet je best presterende hooks bovenaan
zodat ze bij je eerste clips terechtkomen.
