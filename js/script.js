/* Tabs */
const tablinks    = document.getElementsByClassName("tab-links");
const tabcontents = document.getElementsByClassName("tab-contents");

function opentab(e, tabname){
  for (const t of tablinks)    t.classList.remove("active-link");
  for (const c of tabcontents) c.classList.remove("active-tab");
  e.currentTarget.classList.add("active-link");
  document.getElementById(tabname).classList.add("active-tab");
}

/* Mobile menu */
const sideMenu = document.getElementById("sideMenu");
function openMenu(){  sideMenu.style.right = "0"; }
function closeMenu(){ sideMenu.style.right = "-200px"; }

/* Google Sheet form submit */
const scriptURL = 'https://script.google.com/macros/s/AKfycbzpeJmTKbmhhlGJTS2bWFybeb3degqW7zJZGW0zCfmXqPvJqvPK3hHhT_1Yt5cXVUQiuQ/exec';
const form = document.forms['submit-to-google-sheet'];
const msg  = document.getElementById('msg');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await fetch(scriptURL, { method: 'POST', body: new FormData(form), mode: 'no-cors' });
      msg.textContent = "Message sent successfully";
      setTimeout(() => { msg.textContent = ""; }, 5000);
      form.reset();
    } catch (err) {
      console.error('Error!', err);
      msg.textContent = "Failed to send. Try again.";
    }
  });
}
