/* Tabs */
const tablinks = document.getElementsByClassName("tab-links");
const tabcontents = document.getElementsByClassName("tab-contents");

function opentab(e, tabname) {
  for (const t of tablinks) t.classList.remove("active-link");
  for (const c of tabcontents) c.classList.remove("active-tab");
  e.currentTarget.classList.add("active-link");
  document.getElementById(tabname).classList.add("active-tab");
}

/* Mobile menu */
const sideMenu = document.getElementById("sideMenu");
function openMenu() {
  sideMenu.style.right = "0";
}
function closeMenu() {
  sideMenu.style.right = "-200px";
}

/* this is link to the email service  for the screpit where emails are sent 
https://script.google.com/u/0/home/projects/1HttZA4IJl3RsfAwSqEPrrDrN24fCM6ygCo-oJzEZwA67cx7mhgRwniN2/edit

*/

/* Google Sheet form submit (hardened) */
const scriptURL =
  "https://script.google.com/macros/s/AKfycbzfj5cQ51aIpdM7EKL3KEwQZPWx7DKViTO51Sz0CEkaO16M_i2LBQUb9uwOAsC0ONj0/exec";
const form = document.forms["submit-to-google-sheet"];
const msg = document.getElementById("msg");

/* OPTIONAL: reCAPTCHA v3 site key (leave empty to skip) */
const RECAPTCHA_SITE_KEY = ""; // e.g. "6Lc...your_site_key..."

/* Set timestamp when DOM is ready */
document.addEventListener("DOMContentLoaded", () => {
  const ts = document.getElementById("form_ts");
  if (ts) ts.value = String(Date.now());
});

const URL_REGEX =
  /\b((?:https?:\/\/|www\.)[^\s<>"']+|\b[a-z0-9-]+\.(?:com|net|org|info|io|xyz|site|ru|cn|top|shop|online)\b[^\s]*)/i;
const BAD_WORDS = [
  "porn",
  "xxx",
  "sex",
  "escort",
  "onlyfans",
  "camgirl",
  "adult",
  "nsfw",
  "casino",
  "betting",
  "gambling",
  "bitcoin",
  "forex",
  "viagra",
  "cialis",
  "loan",
  "credit repair",
  "telegram.me",
  "t.me",
  "whatsapp",
  "click here",
].map((w) => w.toLowerCase());

function looksBad(text) {
  const t = (text || "").toLowerCase();
  if (URL_REGEX.test(t)) return "Links are not allowed in the message.";
  for (const w of BAD_WORDS) {
    if (t.includes(w)) return "Your message contains prohibited content.";
  }
  return "";
}

/* simple per-page rate limit: max 1 submit every 20s */
let lastSubmitAt = 0;

async function maybeGetRecaptchaToken() {
  if (!RECAPTCHA_SITE_KEY || !window.grecaptcha) return "";
  try {
    await grecaptcha.ready();
    return await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "contact" });
  } catch {
    return "";
  }
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // basic client checks
    const name = form.name?.value || "";
    const email = form.email?.value || "";
    const message = form.message?.value || "";
    const hp = form.company?.value || "";
    const tsVal = Number(form.form_ts?.value || 0);
    const now = Date.now();

    // honeypot => bail silently
    if (hp.trim()) {
      form.reset();
      return;
    }

    // too-fast submit (under 3s)
    if (tsVal && now - tsVal < 3000) {
      msg.textContent = "Please wait a moment before submitting.";
      return;
    }

    // per-page rate limit
    if (now - lastSubmitAt < 20000) {
      msg.textContent =
        "Please wait a few seconds before sending another message.";
      return;
    }

    // content checks
    const badReason = looksBad(`${name}\n${message}`);
    if (badReason) {
      msg.textContent = badReason;
      return;
    }

    // basic length checks
    if (name.length > 120 || message.length > 3000) {
      msg.textContent = "Message is too long.";
      return;
    }

    // optional reCAPTCHA token
    const token = await maybeGetRecaptchaToken();

    try {
      const fd = new FormData(form);
      if (token) fd.append("recaptcha_token", token);

      await fetch(scriptURL, { method: "POST", body: fd, mode: "no-cors" });
      lastSubmitAt = now;
      msg.textContent = "Message sent successfully";
      setTimeout(() => {
        msg.textContent = "";
      }, 5000);
      form.reset();
    } catch (err) {
      console.error("Error!", err);
      msg.textContent = "Failed to send. Try again.";
    }
  });
}

// Private repo modal handler (non-invasive)
document.addEventListener("click", (e) => {
  // delegate
  const link = e.target.closest("a.private-repo"); // link with class "private-repo"
  if (!link) return;

  e.preventDefault(); // prevent navigation
  const modal = document.getElementById("privateRepoModal");
  if (!modal) return;

  const nameSpan = modal.querySelector("#modalProject");
  if (nameSpan)
    nameSpan.textContent = link.dataset.project || "This repository";

  openPrivateRepoModal(modal);
});

function openPrivateRepoModal(modal) {
  modal.hidden = false;
  const first =
    modal.querySelector(".modal__close") ||
    modal.querySelector("[data-close]") ||
    modal;
  first && first.focus();
  document.addEventListener("keydown", escClosePrivateModal);
}

function escClosePrivateModal(ev) {
  if (ev.key === "Escape")
    closePrivateRepoModal(document.getElementById("privateRepoModal"));
}

function closePrivateRepoModal(modal) {
  if (!modal) return;
  modal.hidden = true;
  document.removeEventListener("keydown", escClosePrivateModal);
}

// close buttons & backdrop
document.querySelectorAll("#privateRepoModal [data-close]").forEach((el) => {
  el.addEventListener("click", () =>
    closePrivateRepoModal(document.getElementById("privateRepoModal"))
  );
});

// -------- Visible Visitor Counter (CountAPI) --------
// WHY: CountAPI is a free, public counter service we can call from GitHub Pages.
// WHAT: We "hit" a namespace/key once per day per browser (using localStorage)
//       to avoid artificially inflating the counter on repeated refreshes.

const COUNT_NS = "ajmal-amir-portfolio"; // choose any unique namespace
const COUNT_KEY = "home"; // a key inside that namespace
const COUNT_SPAN_ID = "visitCount"; // where to print the number

async function updateVisitorCounter() {
  const el = document.getElementById(COUNT_SPAN_ID);
  if (!el) return; // no placeholder found; skip

  // Prevent multiple increments by the same user on the same day:
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const lastHit = localStorage.getItem("count_hit_date");

  // If we already incremented today, just GET the current total; else HIT (+1)
  const endpoint =
    lastHit === today
      ? `https://api.countapi.xyz/get/${encodeURIComponent(
          COUNT_NS
        )}/${encodeURIComponent(COUNT_KEY)}`
      : `https://api.countapi.xyz/hit/${encodeURIComponent(
          COUNT_NS
        )}/${encodeURIComponent(COUNT_KEY)}`;

  try {
    const res = await fetch(endpoint, { cache: "no-store" });
    const data = await res.json();
    // data.value is the current counter total
    el.textContent = Number(data.value).toLocaleString();

    if (lastHit !== today) {
      localStorage.setItem("count_hit_date", today);
    }
  } catch (err) {
    // fallback UI if the service is temporarily unavailable
    el.textContent = "n/a";
    console.error("Visitor counter error:", err);
  }
}

document.addEventListener("DOMContentLoaded", updateVisitorCounter);
