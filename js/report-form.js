// "Get your report" form: one question per screen (roadmap-style), progress bar, on-page validation,
// file checks, review step and thank-you state. Sends nothing while js/submission-hook.js has no endpoint.
(function () {
  var form = document.getElementById("report-form"); if (!form) return;
  var steps = [].slice.call(form.querySelectorAll(".rm-step")), TOTAL = steps.length, cur = 0;
  var bar = document.getElementById("rm-bar"), count = document.getElementById("rm-count"), pct = document.getElementById("rm-pct"), live = document.getElementById("rm-live");
  var summary = document.getElementById("form-summary");
  var MAX_FILES = 5, MAX_MB = 10;
  var OK_EXT = ["pdf","jpg","jpeg","png","heic","heif","webp","gif","txt","csv","xml","json","html","htm","xls","xlsx","doc","docx"];
  var fileInput = document.getElementById("scan-files"), list = document.getElementById("file-list"), drop = document.getElementById("dropzone");
  var files = [];
  var thisYear = new Date().getFullYear();
  var yearEl = document.getElementById("year-input"); if (yearEl) yearEl.max = thisYear + 1;
  var val = function (n) { return (form.elements[n].value || "").trim(); };

  // ---------- files
  function ext(name) { var i = name.lastIndexOf("."); return i < 0 ? "" : name.slice(i + 1).toLowerCase(); }
  function fmt(b) { return b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; }
  function fileProblem(f) {
    if (OK_EXT.indexOf(ext(f.name)) < 0) return "File type not accepted";
    if (f.size > MAX_MB * 1048576) return "Over " + MAX_MB + " MB";
    return "";
  }
  function renderFiles() {
    list.innerHTML = "";
    files.forEach(function (f, i) {
      var li = document.createElement("li"), p = fileProblem(f);
      if (p) li.className = "bad";
      var s = document.createElement("span"); s.textContent = f.name + " (" + fmt(f.size) + ")" + (p ? " — " + p : "");
      var b = document.createElement("button"); b.type = "button"; b.textContent = "Remove"; b.setAttribute("aria-label", "Remove " + f.name);
      b.addEventListener("click", function () { files.splice(i, 1); renderFiles(); });
      li.appendChild(s); li.appendChild(b); list.appendChild(li);
    });
    if (files.length) validateFiles();
  }
  function addFiles(fl) { for (var i = 0; i < fl.length; i++) files.push(fl[i]); fileInput.value = ""; renderFiles(); }
  fileInput.addEventListener("change", function () { addFiles(fileInput.files); });
  ["dragenter","dragover"].forEach(function (e) { drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.add("drag"); }); });
  ["dragleave","drop"].forEach(function (e) { drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.remove("drag"); }); });
  drop.addEventListener("drop", function (ev) { if (ev.dataTransfer && ev.dataTransfer.files) addFiles(ev.dataTransfer.files); });

  function setErr(id, msg) {
    var wrap = document.getElementById(id); if (!wrap) return !msg;
    var e = wrap.querySelector(":scope > .error") || wrap.querySelector(".error");
    if (msg) { wrap.classList.add("invalid"); if (e) e.textContent = msg; } else wrap.classList.remove("invalid");
    return !msg;
  }
  function validateFiles() {
    var msg = "";
    if (files.length > MAX_FILES) msg = "Please attach " + MAX_FILES + " files or fewer.";
    else if (files.some(fileProblem)) msg = "Remove the files marked in red (accepted: PDF, photos, text/CSV/XML/JSON/HTML exports, Word or Excel; up to " + MAX_MB + " MB each).";
    return setErr("f-files", msg);
  }

  // ---------- small input helpers
  var vin = form.elements["vin"], vinCount = document.getElementById("vin-count");
  vin.addEventListener("input", function () { var p = vin.selectionStart; vin.value = vin.value.toUpperCase().replace(/\s/g, ""); vin.setSelectionRange(p, p); vinCount.textContent = vin.value.length + "/17"; });
  var codes = form.elements["codes"];
  codes.addEventListener("blur", function () { codes.value = codes.value.replace(/\b([pcbu])(\d{4})\b/gi, function (m, a, b) { return a.toUpperCase() + b; }); });

  // ---------- per-step validation (step numbers are 1-based, matching data-step)
  var checks = {
    1: function () { return setErr("f-first", val("first_name") ? "" : "Please enter your first name."); },
    2: function () { var em = val("email"); return setErr("f-email", !em ? "Please enter your email so we can send your report." : (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em) ? "" : "That email doesn't look right.")); },
    3: function () {
      var ok = true, y = parseInt(val("year"), 10);
      ok = setErr("f-year", !val("year") ? "Year is required." : (y >= 1981 && y <= thisYear + 1 ? "" : "Enter a year between 1981 and " + (thisYear + 1) + ".")) && ok;
      ok = setErr("f-make", val("make") ? "" : "Make is required.") && ok;
      ok = setErr("f-model", val("model") ? "" : "Model is required.") && ok;
      return ok;
    },
    4: function () {
      var v = val("vin"), m = val("mileage"), ok = true;
      ok = setErr("f-vin", !v || /^[A-HJ-NPR-Z0-9]{17}$/.test(v) ? "" : "A VIN is 17 letters and numbers (no I, O or Q). Leave it blank if you don't have it.") && ok;
      ok = setErr("f-miles", !m || (/^\d{1,6}$/.test(m)) ? "" : "Enter mileage as a whole number, or leave it blank.") && ok;
      return ok;
    },
    5: function () { return setErr("f-city", val("city_or_zip") ? "" : "Enter your city or ZIP so we can look for places near you."); },
    6: function () { return validateFiles(); },
    7: function () { return setErr("f-codes", val("codes") || val("symptoms") || files.length ? "" : "Enter at least one code, describe what the vehicle is doing, or go back and upload a scan."); },
    8: function () { return true; },
    9: function () { return setErr("f-agree", form.elements["agree"].checked ? "" : "Please read and agree to the disclaimer to continue."); }
  };

  // ---------- review summary
  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function buildSummary() {
    var rows = [
      ["Name", val("first_name"), 1], ["Email", val("email"), 2],
      ["Vehicle", [val("year"), val("make"), val("model")].join(" "), 3],
      ["VIN", val("vin") || "Not given", 4], ["Mileage", val("mileage") || "Not given", 4],
      ["City or ZIP", val("city_or_zip"), 5],
      ["Scan files", files.length ? files.map(function (f) { return f.name; }).join(", ") : "None", 6],
      ["Codes", val("codes") || "None", 7], ["Symptoms", val("symptoms") ? (val("symptoms").length > 140 ? val("symptoms").slice(0, 140) + "…" : val("symptoms")) : "None", 7],
      ["Report header", val("header_name") || "Standard header", 8]
    ];
    document.getElementById("rm-summary").innerHTML = "<dl>" + rows.map(function (r) {
      return "<dt>" + r[0] + "</dt><dd>" + esc(r[1]) + ' <button type="button" class="edit" data-goto="' + r[2] + '" aria-label="Edit ' + r[0] + '">Edit</button></dd>';
    }).join("") + "</dl>";
  }

  // ---------- step navigation
  function show(i, focus) {
    cur = Math.max(0, Math.min(TOTAL - 1, i));
    steps.forEach(function (s, k) { s.classList.toggle("active", k === cur); s.disabled = false; });
    var done = Math.round((cur + 1) / TOTAL * 100);
    bar.style.width = done + "%"; pct.textContent = done + "%";
    count.textContent = "Step " + (cur + 1) + " of " + TOTAL;
    live.textContent = "Step " + (cur + 1) + " of " + TOTAL;
    summary.classList.remove("show");
    if (cur === TOTAL - 1) buildSummary();
    if (focus !== false) {
      var first = steps[cur].querySelector("input:not([type=checkbox]):not([type=file]), textarea");
      (first || steps[cur].querySelector(".rm-q")).focus({ preventScroll: true });
      var top = form.getBoundingClientRect().top + window.scrollY - 100; if (window.scrollY > top) window.scrollTo(0, top);
    }
  }
  function next() { if (checks[cur + 1]()) show(cur + 1); else focusFirstInvalid(); }
  function focusFirstInvalid() { var f = steps[cur].querySelector(".invalid input, .invalid textarea"); if (f) f.focus(); }

  form.addEventListener("click", function (ev) {
    var t = ev.target;
    if (t.matches("[data-next]")) { ev.preventDefault(); next(); }
    else if (t.matches("[data-back]")) { ev.preventDefault(); show(cur - 1); }
    else if (t.matches("[data-skip]")) {
      ev.preventDefault();
      // Skipping clears the optional fields on this step so nothing half-typed is kept by mistake.
      if (cur === 3) { vin.value = ""; vinCount.textContent = "0/17"; form.elements["mileage"].value = ""; setErr("f-vin", ""); setErr("f-miles", ""); }
      if (cur === 5) { files = []; renderFiles(); setErr("f-files", ""); }
      if (cur === 7) { form.elements["header_name"].value = ""; }
      show(cur + 1);
    }
    else if (t.matches("[data-goto]")) { ev.preventDefault(); show(parseInt(t.getAttribute("data-goto"), 10) - 1); }
  });
  // Enter moves forward on single-line inputs (textareas keep Enter for new lines)
  form.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter" && ev.target.tagName === "INPUT" && ev.target.type !== "checkbox" && ev.target.type !== "file" && cur < TOTAL - 1) { ev.preventDefault(); next(); }
  });

  // ---------- submit (final step)
  form.addEventListener("submit", async function (ev) {
    ev.preventDefault();
    for (var k = 1; k <= TOTAL; k++) {
      if (!checks[k]()) {
        show(k - 1);
        summary.textContent = k === TOTAL ? "Please read and agree to the disclaimer to continue." : "Please fix the highlighted field before sending.";
        summary.classList.add("show"); focusFirstInvalid(); return;
      }
    }
    var btn = form.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Sending…";
    var fd = new FormData(form); fd.delete("scan_files"); files.forEach(function (f) { fd.append("scan_files", f, f.name); });
    var rec = { first_name: val("first_name"), email: val("email"), year: val("year"), make: val("make"), model: val("model"), vin: val("vin"),
      mileage: val("mileage"), city_or_zip: val("city_or_zip"), header_name: val("header_name"), codes: val("codes"), symptoms: val("symptoms"),
      files: files.map(function (f) { return { name: f.name, size: f.size, type: f.type }; }), agreed_to_disclaimer: true };
    try {
      // Live report path: classic FormSubmit POST (leaves the page for _next thank-you).
      // Offline path (empty endpoint): in-page thank-you + localStorage only.
      var r = await OM_HOOK.send("report", fd, rec, { form: form, files: files });
      if (r && r.redirected) return; // browser is navigating to FormSubmit / thanks.html
      document.getElementById("thanks-name").textContent = rec.first_name;
      document.getElementById("thanks-vehicle").textContent = [rec.year, rec.make, rec.model].join(" ");
      document.getElementById("thanks-email").textContent = rec.email;
      document.getElementById("thanks-draft").hidden = r.live;
      form.hidden = true; var t = document.getElementById("thanks"); t.classList.add("show"); t.setAttribute("tabindex", "-1"); t.focus(); window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY - 110);
    } catch (e) {
      btn.disabled = false; btn.textContent = "Get my free report";
      summary.textContent = "Something went wrong sending your request. Please try again in a moment."; summary.classList.add("show");
    }
  });

  show(0, false);
})();
