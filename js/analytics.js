/* AskLien.ai — Google Analytics 4 met toestemming (GDPR)
   Vul hieronder je meet-ID in, die begint met G-. Zolang er GXXXXXXXXXX staat,
   wordt er niets geladen en verschijnt de banner niet. */
(function () {
  var MEET_ID = 'GXXXXXXXXXX';
  if (MEET_ID.indexOf('G-') !== 0) return;

  var SLEUTEL = 'asklien-toestemming';
  var keuze = null;
  try { keuze = localStorage.getItem(SLEUTEL); } catch (e) {}

  function laadGA() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEET_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', MEET_ID, { anonymize_ip: true });
  }

  function bewaar(waarde) {
    try { localStorage.setItem(SLEUTEL, waarde); } catch (e) {}
  }

  function toonBanner() {
    var b = document.createElement('div');
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Cookievoorkeuren');
    b.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;' +
      'max-width:560px;margin:0 auto;background:#1c1a1f;color:#f6f1e7;border-radius:16px;' +
      'padding:22px 24px;box-shadow:0 10px 40px rgba(0,0,0,.28);' +
      "font-family:'Schibsted Grotesk',system-ui,sans-serif;";
    b.innerHTML =
      '<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#b3ab9e;">' +
      'Ik gebruik cookies om te zien welke pagina\'s gelezen worden. Zo weet ik waar ik ' +
      'meer over moet schrijven. Niets wordt gedeeld met adverteerders. ' +
      '<a href="/privacy/" style="color:#ff7a3d;text-decoration:underline;">Meer uitleg</a></p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
      '<button data-ja style="flex:1;min-width:130px;background:#ff4d24;color:#fff;border:none;' +
      'border-radius:9px;padding:13px 20px;font:inherit;font-weight:600;font-size:15px;cursor:pointer;">' +
      'Oké, prima</button>' +
      '<button data-nee style="flex:1;min-width:130px;background:transparent;color:#f6f1e7;' +
      'border:2px solid #57534a;border-radius:9px;padding:11px 20px;font:inherit;font-weight:600;' +
      'font-size:15px;cursor:pointer;">Liever niet</button>' +
      '</div>';
    document.body.appendChild(b);
    b.querySelector('[data-ja]').addEventListener('click', function () {
      bewaar('ja'); b.remove(); laadGA();
    });
    b.querySelector('[data-nee]').addEventListener('click', function () {
      bewaar('nee'); b.remove();
    });
  }

  if (keuze === 'ja') { laadGA(); }
  else if (keuze !== 'nee') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', toonBanner);
    } else { toonBanner(); }
  }
})();
