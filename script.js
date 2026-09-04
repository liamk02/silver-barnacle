// Keep the footer year current without hardcoding it.
document.getElementById("year").textContent = new Date().getFullYear();

// Submit the contact form via fetch instead of a normal page navigation -
// Formspree's custom-redirect ("_next") feature is paid-plan only, so a
// plain <form> submit would land the visitor on Formspree's own generic
// thank-you page instead of back here. Asking for JSON back (Accept header)
// keeps them on this page and lets us show our own inline confirmation.
const TRIAGE_URL = "https://lead-triage-zeo2.onrender.com/api/triage";
const TRIAGE_TIMEOUT_MS = 8000;

// Ask the lead-triage service to tag this message (category/urgency/summary)
// before it's sent on. Best-effort only: on ANY failure - timeout, the free
// Render instance being asleep, a network hiccup - this returns null and the
// form submits as plain text, exactly as it did before triage existed. The
// visitor should never notice this running, let alone see it block them.
async function tryTriage(name, message) {
  const controller = new AbortController();
  const timeout = setTimeout(function () { controller.abort(); }, TRIAGE_TIMEOUT_MS);
  try {
    const res = await fetch(TRIAGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, message: message }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

(function () {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const success = document.getElementById("contact-success");
  const error = document.getElementById("contact-error");
  const submitBtn = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    error.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    try {
      const formData = new FormData(form);
      const tags = await tryTriage(formData.get("name"), formData.get("message"));
      if (tags) {
        formData.append("AI category", tags.category || "");
        formData.append("AI urgency", tags.urgency || "");
        formData.append("AI summary", tags.summary || "");
      }

      const res = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(function () { return {}; });

      if (res.ok && data.ok) {
        form.hidden = true;
        success.hidden = false;
      } else {
        const detail = Array.isArray(data.errors) && data.errors.length
          ? data.errors.map(function (er) { return er.message; }).join(" ")
          : "Something went wrong sending that — try again, or email me directly below.";
        error.textContent = detail;
        error.hidden = false;
      }
    } catch (err) {
      error.textContent = "Couldn't reach the server — check your connection and try again.";
      error.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send message";
    }
  });
})();
