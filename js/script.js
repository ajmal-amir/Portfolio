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
const scriptURL = "https://script.google.com/macros/s/AKfycbzVurzrBU5nR0jFMrF37RyIniM3wZVEjyMDNAEASSFfHYtqml_qvOpHb4CWU8MMesnA/exec";
const form      = document.forms["submit-to-google-sheet"];
const msg       = document.getElementById("msg");

/* OPTIONAL: reCAPTCHA v3 site key (leave empty to skip) */
const RECAPTCHA_SITE_KEY = ""; // e.g. "6Lc...your_site_key..."

/* Set timestamp when DOM is ready */
document.addEventListener("DOMContentLoaded", () => {
  const ts = document.getElementById("form_ts");
  if (ts) ts.value = String(Date.now());
});

const URL_REGEX = /\b((?:https?:\/\/|www\.)[^\s<>"']+|\b[a-z0-9-]+\.(?:com|net|org|info|io|xyz|site|ru|cn|top|shop|online)\b[^\s]*)/i;
const BAD_WORDS = [
  "porn","xxx","sex","escort","onlyfans","camgirl","adult","nsfw",
  "casino","betting","gambling","bitcoin","forex","viagra","cialis",
  "loan","credit repair","telegram.me","t.me","whatsapp","click here"
].map(w => w.toLowerCase());

function looksBad(text) {
  const t = (text || "").toLowerCase();
  if (URL_REGEX.test(t)) return "Links are not allowed in the message.";
  for (const w of BAD_WORDS) { if (t.includes(w)) return "Your message contains prohibited content."; }
  return "";
}

/* simple per-page rate limit: max 1 submit every 20s */
let lastSubmitAt = 0;

async function maybeGetRecaptchaToken() {
  if (!RECAPTCHA_SITE_KEY || !window.grecaptcha) return "";
  try {
    await grecaptcha.ready();
    return await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "contact" });
  } catch { return ""; }
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // basic client checks
    const name    = form.name?.value || "";
    const email   = form.email?.value || "";
    const message = form.message?.value || "";
    const hp      = form.company?.value || "";
    const tsVal   = Number(form.form_ts?.value || 0);
    const now     = Date.now();

    // honeypot => bail silently
    if (hp.trim()) { form.reset(); return; }

    // too-fast submit (under 3s)
    if (tsVal && now - tsVal < 3000) {
      msg.textContent = "Please wait a moment before submitting.";
      return;
    }

    // per-page rate limit
    if (now - lastSubmitAt < 20000) {
      msg.textContent = "Please wait a few seconds before sending another message.";
      return;
    }

    // content checks
    const badReason = looksBad(`${name}\n${email}\n${message}`);
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
      setTimeout(() => { msg.textContent = ""; }, 5000);
      form.reset();
    } catch (err) {
      console.error("Error!", err);
      msg.textContent = "Failed to send. Try again.";
    }
  });
}
