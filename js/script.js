

/* the scripts that make the tabs to work and close and open while clicked by the user*/

var tablinks = document.getElementsByClassName("tab-links");
var tabcontents = document.getElementsByClassName("tab-contents")
function opentab(tabname){
    for(tablink of tablinks){
        tablink.classList.remove("active-link");
    }
    for(tabcontent of tabcontents){
        tabcontent.classList.remove("active-tab");
    }
    event.currentTarget.classList.add("active-link")
    document.getElementById(tabname).classList.add("active-tab");
}

/* the Script that closes and opens side menu when uesed on small decvices */

var sideMenu = document.getElementById("sideMenu");

function openMenu(){
    sideMenu.style.right = "0";
}

function closeMenu(){
    sideMenu.style.right = "-200px";
}

/* the scripts that connects the form to the googlesheet */

  const scriptURL = 'https://script.google.com/macros/s/AKfycbzpeJmTKbmhhlGJTS2bWFybeb3degqW7zJZGW0zCfmXqPvJqvPK3hHhT_1Yt5cXVUQiuQ/exec'
  const form = document.forms['submit-to-google-sheet']
  const msg = document.getElementById('msg');

  form.addEventListener('submit', e => {
    e.preventDefault()
    fetch(scriptURL, { method: 'POST', body: new FormData(form)})
      .then(response => {
      msg.innerHTML = "Message sent successfully"
      setTimeout(function(){
        msg.innerHTML = "";
      }, 5000)

      form.reset()
  })
      .catch(error => console.error('Error!', error.message))
  })