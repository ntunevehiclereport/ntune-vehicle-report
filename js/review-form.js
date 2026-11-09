// Review form: validation and "received, will appear after review" state. Never publishes on the page.
(function () {
  var form = document.getElementById("review-form"); if (!form) return;
  var text = form.elements["review_text"], cnt = document.getElementById("review-count"), MAX = 1500;
  text.addEventListener("input", function () { cnt.textContent = text.value.length + "/" + MAX; });
  function setErr(id, msg) { var w = document.getElementById(id), e = w.querySelector(".error"); if (msg) { w.classList.add("invalid"); e.textContent = msg; } else w.classList.remove("invalid"); return !msg; }
  form.addEventListener("submit", async function (ev) {
    ev.preventDefault();
    var g = function (n) { return (form.elements[n].value || "").trim(); };
    var rating = (form.querySelector("input[name=rating]:checked") || {}).value || "";
    var ok = true, em = g("email");
    ok = setErr("r-name", g("display_name") ? "" : "Please add a name to show with your review (first name is fine).") && ok;
    ok = setErr("r-rating", rating ? "" : "Please choose a star rating.") && ok;
    ok = setErr("r-text", g("review_text").length >= 10 ? "" : "Please write at least a sentence about your experience.") && ok;
    ok = setErr("r-email", !em || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em) ? "" : "That email doesn't look right (or leave it blank).") && ok;
    ok = setErr("r-agree", form.elements["consent"].checked ? "" : "Please confirm before sending.") && ok;
    if (!ok) { var f = form.querySelector(".invalid input, .invalid textarea"); if (f) f.focus(); return; }
    var btn = form.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Sending…";
    try {
      var r = await OM_HOOK.send("review", new FormData(form), { display_name: g("display_name"), city: g("city"), rating: Number(rating), review_text: g("review_text"), email_private: em, published: false });
      var note = document.getElementById("review-draft-note"); if (note) note.hidden = !!(r && r.live);
      form.hidden = true; var t = document.getElementById("review-thanks"); t.classList.add("show"); t.setAttribute("tabindex", "-1"); t.focus();
    } catch (e) { btn.disabled = false; btn.textContent = "Send my review"; alert("Something went wrong. Please try again."); }
  });
})();
