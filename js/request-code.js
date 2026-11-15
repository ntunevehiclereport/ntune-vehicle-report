/* Adds a request code to every report submission and remembers it for thanks.html / pay.html.
 * Format NTVR-XXXXXXXX (no 0/O/1/I). STAGED (PENDING-TIMOTHY). */
(function () {
  var ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function newCode() {
    var a = new Uint8Array(8); crypto.getRandomValues(a);
    var s = ""; for (var i = 0; i < 8; i++) s += ALPHA[a[i] % ALPHA.length];
    return "NTVR-" + s;
  }
  var form = document.getElementById("report-form"); if (!form) return;
  var code = newCode();
  var el = document.createElement("input"); el.type = "hidden"; el.name = "request_code"; el.value = code; form.appendChild(el);
  form.addEventListener("submit", function () {
    try {
      sessionStorage.setItem("ntvr_last_request", JSON.stringify({
        code: code, email: (form.elements["email"] || {}).value || "", first_name: (form.elements["first_name"] || {}).value || "" }));
    } catch (e) {}
  }, true);   // capture phase: runs before report-form.js posts the form
})();
