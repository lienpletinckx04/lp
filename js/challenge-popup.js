// AskLien.ai — challenge-kaart op de Claude-gidsen.
// Schuift onderaan in na de helft van de pagina of na 30 seconden.
// Weggeklikt = een week niet meer tonen (enkel in de browser van de bezoeker).
// Nieuwe editie? Pas enkel CHALLENGE hieronder aan.
(function () {
  var CHALLENGE = {
    titel: 'Claude in 10 dagen',
    tekst: 'Bouw je volledige Claude-setup in 10 dagen, met 4 live online sessies. In het Nederlands, maximaal 25 deelnemers.',
    detail: 'Start dinsdag 3 november · €297',
    knop: 'Bekijk de challenge →',
    link: '/challenge/'
  };
  var SLEUTEL = 'asklien-challenge-kaart-weg';
  var WACHT_DAGEN = 7;

  if (location.pathname.indexOf('/challenge') === 0) return;
  try {
    var weg = parseInt(localStorage.getItem(SLEUTEL) || '0', 10);
    if (weg && Date.now() - weg < WACHT_DAGEN * 864e5) return;
  } catch (e) {}

  var css = document.createElement('style');
  css.textContent =
    '.ck{position:fixed;right:24px;bottom:24px;z-index:60;width:360px;max-width:calc(100vw - 32px);background:#1c1a1f;color:#f6f1e7;border-radius:18px;padding:24px 24px 22px;box-shadow:0 18px 50px rgba(28,26,31,.28);font-family:"Schibsted Grotesk",sans-serif;transform:translateY(140%);opacity:0;transition:transform .5s cubic-bezier(.2,.8,.2,1),opacity .5s}' +
    '.ck.toon{transform:none;opacity:1}' +
    '.ck-label{font-family:Archivo,sans-serif;font-weight:800;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#ff4d24;margin:0 0 8px}' +
    '.ck-titel{font-family:Archivo,sans-serif;font-weight:900;font-size:24px;letter-spacing:-1px;line-height:1.1;margin:0 0 8px}' +
    '.ck-tekst{font-size:14.5px;line-height:1.6;color:#b3ab9e;margin:0 0 6px}' +
    '.ck-detail{font-size:13.5px;font-weight:600;color:#f6f1e7;margin:0 0 16px}' +
    '.ck-knop{display:block;text-align:center;background:#ff4d24;color:#fff;font-weight:600;font-size:15px;padding:13px 18px;border-radius:10px;text-decoration:none}' +
    '.ck-nietnu{display:block;margin:10px auto 0;background:none;border:none;color:#8a8378;font:inherit;font-size:13px;cursor:pointer;text-decoration:underline}' +
    '.ck-sluit{position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;border:none;background:#2a272c;color:#f6f1e7;font-size:18px;line-height:32px;cursor:pointer}' +
    '@media (max-width:640px){.ck{left:16px;right:16px;bottom:16px;width:auto;padding:20px 20px 18px}.ck-titel{font-size:21px}}' +
    '@media (prefers-reduced-motion:reduce){.ck{transition:none}}';
  document.head.appendChild(css);

  var kaart = document.createElement('aside');
  kaart.className = 'ck';
  kaart.setAttribute('role', 'dialog');
  kaart.setAttribute('aria-label', 'De challenge ' + CHALLENGE.titel);
  kaart.innerHTML =
    '<button class="ck-sluit" type="button" aria-label="Sluiten">×</button>' +
    '<p class="ck-label">Leer het in 10 dagen</p>' +
    '<p class="ck-titel">' + CHALLENGE.titel + '<span style="color:#ff4d24;">.</span></p>' +
    '<p class="ck-tekst">' + CHALLENGE.tekst + '</p>' +
    '<p class="ck-detail">' + CHALLENGE.detail + '</p>' +
    '<a class="ck-knop" href="' + CHALLENGE.link + '">' + CHALLENGE.knop + '</a>' +
    '<button class="ck-nietnu" type="button">Niet nu</button>';

  var getoond = false, wachtOpBanner = null;
  function cookiebannerOpen() {
    return !!document.querySelector('[role="dialog"][aria-label="Cookievoorkeuren"]');
  }
  function toon() {
    if (getoond) return;
    // Nooit tegelijk met de cookiebanner: eerst die keuze, dan pas de kaart.
    if (cookiebannerOpen()) {
      if (!wachtOpBanner) wachtOpBanner = setInterval(function () {
        if (!cookiebannerOpen()) { clearInterval(wachtOpBanner); setTimeout(toon, 1500); }
      }, 1000);
      return;
    }
    getoond = true;
    document.body.appendChild(kaart);
    requestAnimationFrame(function () { requestAnimationFrame(function () { kaart.classList.add('toon'); }); });
    window.removeEventListener('scroll', opScroll);
  }
  function verberg() {
    kaart.classList.remove('toon');
    try { localStorage.setItem(SLEUTEL, String(Date.now())); } catch (e) {}
    setTimeout(function () { if (kaart.parentNode) kaart.parentNode.removeChild(kaart); }, 500);
  }
  function opScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (h > 0 && window.scrollY / h > 0.5) toon();
  }

  kaart.querySelector('.ck-sluit').addEventListener('click', verberg);
  kaart.querySelector('.ck-nietnu').addEventListener('click', verberg);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && getoond) verberg(); });

  window.addEventListener('scroll', opScroll, { passive: true });
  setTimeout(toon, 30000);
})();
