/* AskLien.ai — Google Analytics 4 + Meta Pixel met toestemming (GDPR / GBA-conform)
   - laadt niets voor er toestemming is, en vraagt toestemming per doel
     (statistieken en advertenties apart, allebei standaard uit)
   - weigeren is even makkelijk en even zichtbaar als aanvaarden
   - toestemming vervalt na 6 maanden en wordt dan opnieuw gevraagd
   - de keuze is altijd te herzien via een link naar #cookievoorkeuren */
(function () {
  var MEET_ID = 'G-X26E0J3ZQT';
  var PIXEL_ID = '3740482536120977';

  var SLEUTEL = 'asklien-toestemming-v2';
  var OUDE_SLEUTEL = 'asklien-toestemming';
  var GELDIG_MS = 1000 * 60 * 60 * 24 * 182; // 6 maanden

  // Toestemming van vóór de Meta Pixel gold enkel voor statistieken:
  // iedereen krijgt de vraag opnieuw, nu met beide doelen apart.
  try { localStorage.removeItem(OUDE_SLEUTEL); } catch (e) {}

  function leesKeuze() {
    try {
      var ruw = localStorage.getItem(SLEUTEL);
      if (!ruw) return null;
      var d = JSON.parse(ruw);
      if (!d || !d.op || (Date.now() - d.op) > GELDIG_MS) return null;
      return { stats: d.stats === true, ads: d.ads === true };
    } catch (e) { return null; }
  }

  function bewaar(keuze) {
    try {
      localStorage.setItem(SLEUTEL, JSON.stringify({ stats: keuze.stats, ads: keuze.ads, op: Date.now() }));
    } catch (e) {}
  }

  var gaGeladen = false;
  function laadGA() {
    if (gaGeladen) return;
    gaGeladen = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEET_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', MEET_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  }

  // Conversies op de bedankpagina's, zodat Meta kan mikken op mensen die
  // echt iets doen en niet enkel op bezoekers.
  var CONVERSIES = {
    '/bedankt-challenge': ['Purchase', { value: 297, currency: 'EUR', content_name: 'Claude in 10 dagen' }],
    '/bedankt-voorsprong': ['Subscribe', { value: 27, currency: 'EUR', predicted_ltv: 27 * 12, content_name: 'Voorsprong' }],
    '/bedankt-bevraging': ['Lead', { content_name: 'Bevraging' }],
    '/bedankt-contact': ['Contact', {}]
  };

  function stuurConversie() {
    var pad = location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
    var conversie = CONVERSIES[pad];
    if (!conversie) return;
    // Herladen of terugkeren naar de pagina telt niet als tweede conversie.
    var gezien = 'asklien-conversie' + pad;
    try {
      if (sessionStorage.getItem(gezien)) return;
      sessionStorage.setItem(gezien, '1');
    } catch (e) {}
    window.fbq('track', conversie[0], conversie[1]);
  }

  var pixelGeladen = false;
  function laadPixel() {
    if (pixelGeladen) return;
    pixelGeladen = true;
    /* Meta Pixel Code */
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('consent', 'grant');
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
    /* End Meta Pixel Code */
    stuurConversie();
  }

  function wisCookies(isDoel) {
    document.cookie.split(';').forEach(function (c) {
      var naam = c.split('=')[0].trim();
      if (!isDoel(naam)) return;
      ['/', location.pathname].forEach(function (pad) {
        ['', '.' + location.hostname, location.hostname].forEach(function (domein) {
          document.cookie = naam + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=' + pad +
            (domein ? '; domain=' + domein : '');
        });
      });
    });
  }
  function wisGA() {
    wisCookies(function (n) { return n.indexOf('_ga') === 0 || n === '_gid'; });
  }
  function wisPixel() {
    if (window.fbq) window.fbq('consent', 'revoke');
    wisCookies(function (n) { return n === '_fbp' || n === '_fbc'; });
  }

  function pasToe(keuze) {
    if (keuze.stats) laadGA(); else wisGA();
    if (keuze.ads) laadPixel(); else wisPixel();
  }

  var banner = null;
  function sluit() { if (banner) { banner.remove(); banner = null; } }

  function toonBanner() {
    if (banner) return;
    banner = document.createElement('div');
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookievoorkeuren');
    banner.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;' +
      'max-width:560px;margin:0 auto;background:#1c1a1f;color:#f6f1e7;border-radius:16px;' +
      'padding:22px 24px;box-shadow:0 10px 40px rgba(0,0,0,.28);' +
      'max-height:calc(100vh - 32px);overflow-y:auto;' +
      "font-family:'Schibsted Grotesk',system-ui,sans-serif;";

    var knop = 'flex:1;min-width:140px;background:#ff4d24;color:#fff;border:none;' +
      'border-radius:9px;padding:13px 20px;font:inherit;font-weight:600;font-size:15px;cursor:pointer;';
    var rij = 'display:flex;gap:12px;align-items:flex-start;margin:0 0 12px;font-size:14px;' +
      'line-height:1.5;color:#b3ab9e;cursor:pointer;';
    var vink = 'width:20px;height:20px;margin:1px 0 0;flex:none;accent-color:#ff4d24;cursor:pointer;';

    banner.innerHTML =
      '<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#b3ab9e;">' +
      'Mag ik cookies gebruiken? Je kiest zelf waarvoor, en je kan het altijd wijzigen. ' +
      '<a href="/privacy/" style="color:#ff7a3d;text-decoration:underline;display:inline-block;padding:6px 0;">Meer uitleg</a></p>' +
      '<label style="' + rij + '"><input type="checkbox" data-stats style="' + vink + '">' +
      '<span><strong style="color:#f6f1e7;">Statistieken</strong> (Google Analytics): ' +
      'zien welke pagina\'s gelezen worden, zodat ik weet waar ik meer over moet schrijven.</span></label>' +
      '<label style="' + rij + 'margin-bottom:18px;"><input type="checkbox" data-ads style="' + vink + '">' +
      '<span><strong style="color:#f6f1e7;">Advertenties</strong> (Meta Pixel): ' +
      'meten of mijn advertenties op Facebook en Instagram werken, en je daar later nog eens tonen wat je bekeek.</span></label>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
      '<button data-nee style="' + knop + '">Nee, bedankt</button>' +
      '<button data-ja style="' + knop + '">Ja, alles mag</button>' +
      '</div>' +
      '<button data-bewaar style="display:block;margin:12px auto 0;background:none;border:none;' +
      'color:#f6f1e7;font:inherit;font-size:14px;text-decoration:underline;cursor:pointer;padding:6px 8px;">' +
      'Bewaar mijn keuze</button>';

    document.body.appendChild(banner);

    function kies(keuze) { bewaar(keuze); sluit(); pasToe(keuze); }
    banner.querySelector('[data-ja]').addEventListener('click', function () {
      kies({ stats: true, ads: true });
    });
    banner.querySelector('[data-nee]').addEventListener('click', function () {
      kies({ stats: false, ads: false });
    });
    banner.querySelector('[data-bewaar]').addEventListener('click', function () {
      kies({
        stats: banner.querySelector('[data-stats]').checked,
        ads: banner.querySelector('[data-ads]').checked
      });
    });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#cookievoorkeuren"]');
    if (!a) return;
    e.preventDefault();
    var huidig = leesKeuze();
    sluit(); toonBanner();
    if (huidig) {
      banner.querySelector('[data-stats]').checked = huidig.stats;
      banner.querySelector('[data-ads]').checked = huidig.ads;
    }
  });

  var keuze = leesKeuze();
  if (keuze) { pasToe(keuze); }
  else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', toonBanner);
  } else { toonBanner(); }
})();
