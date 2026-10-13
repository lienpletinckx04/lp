/* AskLien.ai — melding linksonder: wie schreef zich recent in voor de challenge.
   Gegevens komen uit de hub (echte Stripe-betalingen), enkel voornaam en tijdstip.
   De hub geeft pas iets terug vanaf 5 inschrijvingen; daaronder verschijnt niets.
   Geen cookies, niets bewaard. */
(function () {
  var BRON = 'https://vgrlwcocnveysurkahuz.supabase.co/functions/v1/challenge-inschrijvingen';
  var EERSTE_NA_MS = 7000;
  var TONEN_MS = 6000;
  var PAUZE_MS = 14000;
  var MAX_MELDINGEN = 4;

  var gesloten = false;
  try { gesloten = sessionStorage.getItem('asklien-melding-weg') === '1'; } catch (e) {}
  if (gesloten || !window.fetch) return;

  function geleden(iso) {
    var min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 60) return min <= 1 ? 'net' : min + ' minuten geleden';
    var uur = Math.round(min / 60);
    if (uur < 24) return uur === 1 ? '1 uur geleden' : uur + ' uur geleden';
    var dag = Math.round(uur / 24);
    if (dag === 1) return 'gisteren';
    if (dag < 7) return dag + ' dagen geleden';
    var week = Math.round(dag / 7);
    return week === 1 ? 'vorige week' : week + ' weken geleden';
  }

  function maak() {
    var el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:9000;max-width:300px;' +
      'background:#fff;color:#1c1a1f;border:1px solid #e6ddcb;border-radius:14px;' +
      'padding:12px 36px 12px 14px;box-shadow:0 8px 28px rgba(0,0,0,.14);' +
      "font-family:'Schibsted Grotesk',system-ui,sans-serif;font-size:14px;line-height:1.45;" +
      'display:flex;gap:11px;align-items:center;opacity:0;transform:translateY(10px);' +
      'transition:opacity .35s ease,transform .35s ease;pointer-events:none;';
    el.innerHTML =
      '<span style="flex:none;width:34px;height:34px;border-radius:50%;background:#ff4d24;color:#fff;' +
      'display:flex;align-items:center;justify-content:center;font-weight:800;font-family:Archivo,sans-serif;">✦</span>' +
      '<span data-tekst></span>' +
      '<button aria-label="Sluiten" style="position:absolute;top:6px;right:6px;width:28px;height:28px;' +
      'border:none;background:none;color:#8a8378;font-size:18px;line-height:1;cursor:pointer;">×</button>';
    el.querySelector('button').addEventListener('click', function () {
      try { sessionStorage.setItem('asklien-melding-weg', '1'); } catch (e) {}
      gesloten = true;
      el.remove();
    });
    document.body.appendChild(el);
    return el;
  }

  function bannerOpen() {
    return !!document.querySelector('[aria-label="Cookievoorkeuren"]');
  }

  function start(recent) {
    var el = null;
    var i = 0;
    function volgende() {
      if (gesloten || i >= Math.min(recent.length, MAX_MELDINGEN)) return;
      if (bannerOpen()) { setTimeout(volgende, 3000); return; }
      if (!el) el = maak();
      var r = recent[i++];
      var wie = r.voornaam ? '<strong>' + r.voornaam.replace(/[<>&"]/g, '') + '</strong>' : '<strong>Iemand</strong>';
      el.querySelector('[data-tekst]').innerHTML = wie + ' schreef zich in voor de challenge van november' +
        '<br><span style="color:#8a8378;font-size:13px;">' + geleden(r.op) + '</span>';
      el.style.opacity = '1'; el.style.transform = 'none'; el.style.pointerEvents = 'auto';
      setTimeout(function () {
        if (!el) return;
        el.style.opacity = '0'; el.style.transform = 'translateY(10px)'; el.style.pointerEvents = 'none';
        setTimeout(volgende, PAUZE_MS);
      }, TONEN_MS);
    }
    setTimeout(volgende, EERSTE_NA_MS);
  }

  fetch(BRON).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (d && d.tonen && d.recent && d.recent.length) start(d.recent);
  }).catch(function () {});
})();
