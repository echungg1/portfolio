console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// const navLinks = $$("nav a");

// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname
//   );

// currentLink?.classList.add('current');

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' }, 
    { url: 'https://github.com/echungg1', title: 'GitHub' },
    { url: 'resume/', title: 'Resume' },
    
  ];

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
? "/"
: "/portfolio/"; 

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;

    if (!url.startsWith('http')) {
        url = BASE_PATH + url;
      }
    
    // Create link and add it to nav
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname,
    );

    if (a.host !== location.host) {
        a.target = "_blank";
      }

    nav.append(a);
  }

document.body.insertAdjacentHTML(
'afterbegin',
`
    <label class="color-scheme">
        Theme:
        <select id="scheme-select">
            <option value="auto">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    </label>`,
);

const select = document.querySelector('#scheme-select');
const root = document.documentElement;

if ("colorScheme" in localStorage) {
  select.value = localStorage.colorScheme;

  if (localStorage.colorScheme === "auto") {
    root.style.removeProperty("color-scheme");
  } else {
    root.style.setProperty("color-scheme", localStorage.colorScheme);
  }
}

select.addEventListener("input", function (event) {
  const value = event.target.value;
  console.log("color scheme changed to", value);

  localStorage.colorScheme = value;

  if (value === "auto") {
    root.style.removeProperty("color-scheme");
  } else {
    root.style.setProperty("color-scheme", value);
  }
});

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
  
    form?.addEventListener("submit", function (event) {
      event.preventDefault();
  
      const data = new FormData(form);
      let params = [];
  
      for (let [name, value] of data) {
        value = encodeURIComponent(value);
        params.push(`${name}=${value}`);
      }
  
      const url = `${form.action}?${params.join("&")}`;
      console.log("Final mailto URL:", url);
      location.href = url;
    });
  });
  