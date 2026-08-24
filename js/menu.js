// AskLien.ai — hamburgermenu voor mobiel
// Bouwt zichzelf op uit de bestaande navigatielinks, zodat elke pagina
// automatisch het juiste menu krijgt zonder de HTML aan te passen.
(function () {
  function start() {
    var nav = document.querySelector('nav');
    if (!nav) return;
    var links = nav.querySelector('.nav-links');
    if (!links || nav.querySelector('.menu-knop')) return;

    var knop = document.createElement('button');
    knop.className = 'menu-knop';
    knop.setAttribute('aria-label', 'Menu openen');
    knop.setAttribute('aria-expanded', 'false');
    knop.innerHTML = '<span></span><span></span><span></span>';

    var paneel = document.createElement('div');
    paneel.className = 'menu-paneel';
    paneel.hidden = true;

    var lijst = document.createElement('div');
    lijst.className = 'menu-lijst';
    Array.prototype.forEach.call(links.querySelectorAll('a'), function (a) {
      var kopie = a.cloneNode(true);
      kopie.removeAttribute('style');
      kopie.className = a.classList.contains('btn-primary') ? 'menu-cta' : 'menu-link';
      lijst.appendChild(kopie);
    });
    paneel.appendChild(lijst);

    links.parentNode.insertBefore(knop, links.nextSibling);
    // Het paneel hangt aan de body, niet aan de nav: die heeft een vervagingslaag,
    // en daarbinnen wordt een vast gepositioneerd paneel opgesloten in de balk.
    document.body.appendChild(paneel);

    var open = false;
    function zet(nieuw) {
      open = nieuw;
      knop.setAttribute('aria-expanded', String(open));
      knop.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
      knop.classList.toggle('is-open', open);
      paneel.hidden = !open;
      document.body.style.overflow = open ? 'hidden' : '';
    }

    knop.addEventListener('click', function () { zet(!open); });
    paneel.addEventListener('click', function (e) {
      if (e.target.closest('a')) zet(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) { zet(false); knop.focus(); }
    });
    // Draait iemand zijn toestel naar liggend, dan verdwijnt de knop: menu dicht.
    window.addEventListener('resize', function () {
      if (open && getComputedStyle(knop).display === 'none') zet(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else { start(); }
})();
