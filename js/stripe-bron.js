/* AskLien.ai — geeft de bron van een advertentiebezoek mee aan Stripe.
   Komt iemand binnen via een link met utm-parameters (bv. uit Meta), dan
   krijgen de Stripe-knoppen op deze pagina die mee. In Stripe zie je dan
   bij elke betaling uit welke advertentie ze kwam (client_reference_id).
   Er wordt niets op het toestel bewaard: de waarde zit enkel in de link. */
(function () {
  var p = new URLSearchParams(location.search);
  var bron = p.get('utm_source');
  var advertentie = p.get('utm_content');
  if (!bron && !advertentie) return;

  // Stripe aanvaardt voor client_reference_id enkel letters, cijfers, - en _ (max 200).
  var ref = [bron, advertentie].filter(Boolean).join('_')
    .replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 200);

  document.querySelectorAll('a[href^="https://buy.stripe.com/"]').forEach(function (a) {
    var url = new URL(a.href);
    url.searchParams.set('client_reference_id', ref);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) {
      if (p.get(k)) url.searchParams.set(k, p.get(k));
    });
    a.href = url.toString();
  });
})();
