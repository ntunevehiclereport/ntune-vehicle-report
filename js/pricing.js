/* NTVR pricing + pay Worker address. STAGED (PENDING-TIMOTHY).
 * The price itself lives in ONE place: PRICE_CENTS in the Worker's wrangler.toml.
 * This file only knows where the Worker is; it fills every [data-price] element from GET /price.
 * FALLBACK_DISPLAY is shown only if the Worker can't be reached. Keep it equal to PRICE_CENTS. */
window.NTVR_PAY = (function () {
  var WORKER_URL = "https://ntvr-pay.REPLACE_SUBDOMAIN.workers.dev";   // set after Timothy deploys
  var FALLBACK_DISPLAY = "$1.33";
  function fill(txt) { document.querySelectorAll("[data-price]").forEach(function (el) { el.textContent = txt; }); }
  fill(FALLBACK_DISPLAY);
  fetch(WORKER_URL + "/price").then(function (r) { return r.json(); })
    .then(function (d) { if (d && d.price_display) fill(d.price_display); }).catch(function () {});
  return { WORKER_URL: WORKER_URL };
})();
