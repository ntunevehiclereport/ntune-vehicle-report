// Mobile nav toggle + footer year
(function () {
  var t = document.querySelector(".nav-toggle"), n = document.getElementById("site-nav");
  if (t && n) t.addEventListener("click", function () {
    var open = n.classList.toggle("open"); t.setAttribute("aria-expanded", open ? "true" : "false");
  });
  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
})();
