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
? "/"                  // Local server
: "/portfolio/";         // GitHub Pages repo name

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;

    // next step: create link and add it to nav
    if (!url.startsWith('http')) {
        url = BASE_PATH + url;
      }
    
    // Create link and add it to nav
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    // nav.append(a);

    // if (a.host === location.host && a.pathname === location.pathname) {
    //     a.classList.add('current');
    //   }

    a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname,
    );

    if (a.host !== location.host) {
        a.target = "_blank";
      }

    nav.append(a);

  }


