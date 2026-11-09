/*
 * Form hook for NTune Vehicle Report (github.io test publish).
 *
 * Report submissions: classic multipart POST to FormSubmit (AJAX cannot carry
 * file attachments reliably). Review submissions: FormSubmit AJAX (no files).
 * Do not fire a live test until NTVRB's builder dry run passes and FormSubmit
 * activation is confirmed in the +ntvrb inbox.
 */
window.OM_HOOK = (function () {
  const REPORT_ENDPOINT = "https://formsubmit.co/wrench.ntune+ntvrb@mail.grokbot.com";
  const REVIEW_ENDPOINT = "https://formsubmit.co/ajax/wrench.ntune+ntvrb@mail.grokbot.com";
  const REPORT_SUBJECT = "NTune Vehicle Report submission";
  const REVIEW_SUBJECT = "NTune Vehicle Report review";
  // Full URL required by FormSubmit _next (project Pages path).
  const THANKS_URL = "https://ntunevehiclereport.github.io/ntune-vehicle-report/thanks.html";

  const KEYS = { report: "om_pending_report_requests", review: "om_pending_reviews" };

  function saveLocal(kind, payload) {
    try {
      const list = JSON.parse(localStorage.getItem(KEYS[kind]) || "[]");
      list.push(payload);
      localStorage.setItem(KEYS[kind], JSON.stringify(list));
    } catch (e) { /* storage unavailable — thank-you still shows */ }
  }

  function ensureHidden(form, name, value) {
    var el = form.querySelector('input[name="' + name + '"]');
    if (!el) {
      el = document.createElement("input");
      el.type = "hidden";
      el.name = name;
      form.appendChild(el);
    }
    el.value = value;
  }

  /** Classic multipart POST for the report form (supports scan_files attachments). */
  function classicReportPost(form, files) {
    form.method = "POST";
    form.action = REPORT_ENDPOINT;
    form.enctype = "multipart/form-data";
    ensureHidden(form, "_subject", REPORT_SUBJECT);
    ensureHidden(form, "_captcha", "false");
    ensureHidden(form, "_template", "table");
    ensureHidden(form, "_next", THANKS_URL);
    // Sync the JS-managed file list into the real file input (FormSubmit needs multipart).
    var fileInput = form.querySelector('input[name="scan_files"]');
    if (fileInput && typeof DataTransfer !== "undefined") {
      var dt = new DataTransfer();
      (files || []).forEach(function (f) { dt.items.add(f); });
      fileInput.files = dt.files;
    }
    form.submit();
    return { ok: true, live: true, redirected: true };
  }

  async function send(kind, formData, summary, opts) {
    opts = opts || {};
    var record = Object.assign({
      kind: kind,
      saved_at: new Date().toISOString(),
      status: "pending"
    }, summary);

    if (kind === "report") {
      if (!REPORT_ENDPOINT) { record.status = "pending-no-backend"; saveLocal(kind, record); return { ok: true, live: false }; }
      // Classic POST leaves the page; FormSubmit emails attachments then redirects to THANKS_URL.
      return classicReportPost(opts.form, opts.files || []);
    }

    // Reviews: AJAX (no file attachments).
    if (!REVIEW_ENDPOINT) { record.status = "pending-no-backend"; saveLocal(kind, record); return { ok: true, live: false }; }
    formData.append("_subject", REVIEW_SUBJECT);
    formData.append("_captcha", "false");
    formData.append("_template", "table");
    var res = await fetch(REVIEW_ENDPOINT, {
      method: "POST",
      body: formData,
      headers: { "Accept": "application/json" }
    });
    if (!res.ok) throw new Error("Server returned " + res.status);
    record.status = "sent";
    saveLocal(kind, record);
    return { ok: true, live: true };
  }

  function pending(kind) {
    try { return JSON.parse(localStorage.getItem(KEYS[kind]) || "[]"); }
    catch (e) { return []; }
  }

  return {
    send: send,
    pending: pending,
    isLive: function (k) {
      return !!(k === "report" ? REPORT_ENDPOINT : REVIEW_ENDPOINT);
    },
    endpoints: { report: REPORT_ENDPOINT, review: REVIEW_ENDPOINT, thanks: THANKS_URL }
  };
})();
