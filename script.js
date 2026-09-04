// Keep the footer year current without hardcoding it.
document.getElementById("year").textContent = new Date().getFullYear();

// Submit the contact form via fetch instead of a normal page navigation -
// Formspree's custom-redirect ("_next") feature is paid-plan only, so a
// plain <form> submit would land the visitor on Formspree's own generic
// thank-you page instead of back here. Asking for JSON back (Accept header)
// keeps them on this page and lets us show our own inline confirmation.
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
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
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
