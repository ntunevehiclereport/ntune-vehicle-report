// Mobile nav toggle + footer year + header CTA scroll/highlight
(function () {
  var t = document.querySelector(".nav-toggle"), n = document.getElementById("site-nav");
  if (t && n) t.addEventListener("click", function () {
    var open = n.classList.toggle("open"); t.setAttribute("aria-expanded", open ? "true" : "false");
  });
  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();

  function reduceMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function highlight(el) {
    if (!el) return;
    el.classList.add("cta-highlight");
    window.setTimeout(function () { el.classList.remove("cta-highlight"); }, reduceMotion() ? 700 : 1400);
  }

  function scrollToId(id) {
    var target = document.getElementById(id);
    if (!target) return false;
    target.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "center" });
    highlight(target);
    return true;
  }

  var cta = document.querySelector("a.header-cta");
  if (cta) {
    cta.addEventListener("click", function (e) {
      var href = cta.getAttribute("href") || "";
      if (href.charAt(0) !== "#") return;
      var id = href.slice(1);
      if (!id) return;
      if (scrollToId(id)) e.preventDefault();
    });
  }

  function highlightFromHash() {
    var id = (location.hash || "").replace(/^#/, "");
    if (id === "get-report-cta" || id === "report-form") highlight(document.getElementById(id));
  }
  if (document.readyState === "complete") highlightFromHash();
  else window.addEventListener("load", highlightFromHash);
})();
