// AskLien.ai — reveals, 3D-tilt en tellers
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Reveals: containers rijzen op, directe kinderen van grids staggeren
  var els = document.querySelectorAll('[data-reveal]');
  els.forEach(function (el) {
    var kids = getComputedStyle(el).display.includes('grid') ? Array.from(el.children) : [el];
    kids.forEach(function (k, i) {
      k.style.opacity = '0';
      k.style.transform = 'translateY(48px)';
      k.style.transition = 'opacity .7s cubic-bezier(.2,.8,.2,1) ' + (i * .08) + 's, transform .7s cubic-bezier(.2,.8,.2,1) ' + (i * .08) + 's';
    });
    el._kids = kids;
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        (e.target._kids || [e.target]).forEach(function (k) {
          k.style.opacity = '1';
          k.style.transform = 'translateY(0)';
        });
        io.unobserve(e.target);
      }
    });
  }, { threshold: .12 });
  els.forEach(function (el) { io.observe(el); });

  // 3D-tilt op kaarten
  document.querySelectorAll('[data-tilt]').forEach(function (card) {
    card.style.willChange = 'transform';
    card.addEventListener('mousemove', function (ev) {
      var r = card.getBoundingClientRect();
      var x = (ev.clientX - r.left) / r.width - .5;
      var y = (ev.clientY - r.top) / r.height - .5;
      card.style.transition = 'transform .08s linear';
      card.style.transform = 'perspective(900px) rotateX(' + (-y * 6).toFixed(2) + 'deg) rotateY(' + (x * 6).toFixed(2) + 'deg) translateY(-5px)';
    });
    card.addEventListener('mouseleave', function () {
      card.style.transition = 'transform .45s cubic-bezier(.2,.8,.2,1)';
      card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateY(0)';
    });
  });

  // Tellers
  var counters = document.querySelectorAll('[data-count]');
  var io2 = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io2.unobserve(e.target);
      var el = e.target, raw = el.getAttribute('data-count');
      var num = parseInt(raw, 10), suffix = raw.replace(String(num), '');
      var t0 = performance.now(), dur = 1200;
      var tick = function (now) {
        var p = Math.min(1, (now - t0) / dur), ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(num * ease) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: .6 });
  counters.forEach(function (el) { io2.observe(el); });
})();
