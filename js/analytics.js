/* AskLien.ai — Google Analytics 4 met toestemming (GDPR / GBA-conform)
   - laadt niets voor er toestemming is
   - weigeren is even makkelijk en even zichtbaar als aanvaarden
   - toestemming vervalt na 6 maanden en wordt dan opnieuw gevraagd
   - de keuze is altijd te herzien via een link naar #cookievoorkeuren */
(function () {
  var MEET_ID = 'G-X26E0J3ZQT';
  if (MEET_ID.indexOf('G-') !== 0) return;

  var SLEUTEL = 'asklien-toestemming';
  var GELDIG_MS = 1000 * 60 * 60 * 24 * 182; // 6 maanden

  function leesKeuze() {
    try {
      var ruw = localStorage.getItem(SLEUTEL);
      if (!ruw) return null;
      var d = JSON.parse(ruw);
      if (!d || !d.op || (Date.now() - d.op) > GELDIG_MS) return null;
      return d.keuze;
    } catch (e) { return null; }
  }

  function bewaar(keuze) {
    try {
      localStorage.setItem(SLEUTEL, JSON.stringify({ keuze: keuze, op: Date.now() }));
    } catch (e) {}
  }

  var geladen = false;
  function laadGA() {
    if (geladen) return;
    geladen = true;
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

  function wisGA() {
    document.cookie.split(';').forEach(function (c) {
      var naam = c.split('=')[0].trim();
      if (naam.indexOf('_ga') === 0 || naam === '_gid') {
        ['/', location.pathname].forEach(function (pad) {
          ['', '.' + location.hostname, location.hostname].forEach(function (domein) {
            document.cookie = naam + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=' + pad +
              (domein ? '; domain=' + domein : '');
          });
        });
      }
    });
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
      "font-family:'Schibsted Grotesk',system-ui,sans-serif;";

    var knop = 'flex:1;min-width:140px;background:#ff4d24;color:#fff;border:none;' +
      'border-radius:9px;padding:13px 20px;font:inherit;font-weight:600;font-size:15px;cursor:pointer;';

    banner.innerHTML =
      '<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#b3ab9e;">' +
      'Mag ik Google Analytics gebruiken om te zien welke pagina\'s gelezen worden? ' +
      'Zo weet ik waar ik meer over moet schrijven. Ik gebruik dit nooit voor advertenties ' +
      'en deel het met niemand anders. Je keuze geldt zes maanden en je kan ze altijd wijzigen. ' +
      '<a href="/privacy/" style="color:#ff7a3d;text-decoration:underline;display:inline-block;padding:6px 0;">Meer uitleg</a></p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
      '<button data-nee style="' + knop + '">Nee, bedankt</button>' +
      '<button data-ja style="' + knop + '">Ja, dat mag</button>' +
      '</div>';

    document.body.appendChild(banner);
    banner.querySelector('[data-ja]').addEventListener('click', function () {
      bewaar('ja'); sluit(); laadGA();
    });
    banner.querySelector('[data-nee]').addEventListener('click', function () {
      bewaar('nee'); sluit(); wisGA();
    });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#cookievoorkeuren"]');
    if (!a) return;
    e.preventDefault();
    try { localStorage.removeItem(SLEUTEL); } catch (err) {}
    sluit(); toonBanner();
  });

  var keuze = leesKeuze();
  if (keuze === 'ja') { laadGA(); }
  else if (keuze !== 'nee') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', toonBanner);
    } else { toonBanner(); }
  }
})();
