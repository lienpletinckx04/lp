# asklien.ai — website (rebranding "Signaal")

Statische website in de nieuwe huisstijl: vermiljoen (#ff4d24), crème (#f6f1e7), donker (#1c1a1f), Archivo (koppen) + Schibsted Grotesk (body) via Google Fonts.

## Pagina's
- `index.html` — homepage (aanbod, aanpak, spreker, over Lien)
- `challenge.html` — Challenge "Gebruik Claude zoals het hoort" (€297)
- `voorsprong/` — Membership Voorsprong (€37/maand, voor iedereen)
- `cases/` — cases, met `cases/renard-bakery/` als eerste (schermafbeeldingen op demodata in `media/cases/renard/`)
- `en/` — de Engelstalige versie voor bedrijven: home, `ai-audit/`, `cases/`, `about/`, `speaker/`, `contact/`, `thank-you/`, `privacy/`

## Twee talen
- Engels bestaat alleen voor het zakelijke aanbod (audit, trajecten, cases, spreker). De challenge, Voorsprong en de gidsen zijn Nederlandstalig en blijven dat.
- Elke pagina met een vertaling heeft `hreflang`-links in de `<head>` en een taalschakelaar (`.taal`) in de navigatie. Pas je de ene taal aan, pas dan ook de andere aan.
- `js/analytics.js` en `js/menu.js` lezen de taal uit `<html lang>`: de cookiebanner en het menu volgen vanzelf.

## Nog invullen
- Foto's: vervang de `.img-slot` placeholders door `<img>`-tags (hero, podium, over-Lien, sfeerbeeld, ledenzone-screenshot)
- Testimonials op `challenge.html` ([Quote van een deelnemer])
- Twee "[Update door Lien]"-kaarten op `voorsprong.html`
- CTA-links: knoppen wijzen nu naar hub.asklien.ai, Stripe-betaallinks of ankers (de oude shop.asklien.ai is niet meer in gebruik)

Openen: gewoon `index.html` in een browser, of hosten als statische site (geen build nodig).
