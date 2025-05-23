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
    { url: 'meta/', title: 'Meta' }
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
  
export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    console.log(response);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

// export function renderProjects(project, containerElement, headingLevel = 'h2') {
//   // write javascript that will allow dynamic heading levels based on previous function
//   // Your code will go here
//   containerElement.innerHTML = '';
//   for (const p of project) {
//     const article = document.createElement('article');
//     article.innerHTML = `
//     <${headingLevel}>${p.title}</${headingLevel}>
//     <img src="${p.image}" alt="${p.title}">
//     `;

//     if (p.url) {
//       const link = document.createElement('a');
//       link.href = p.url;
//       link.textContent = p.title;
//       link.target = '_blank';
//       link.rel = 'noopener noreferrer';
//       heading.appendChild(link);
//     } else {
//       heading.textContent = p.title;
//     }


//     const textWrapper = document.createElement('div');
//     const desc = document.createElement('p');
//     desc.textContent = p.description || 'No description available.';
//     textWrapper.appendChild(desc);
//     const year = document.createElement('p');
//     year.className = 'project-year';
//     year.textContent = p.year ? `c. ${p.year}` : 'Year unknown';
//     textWrapper.appendChild(year);
//     article.appendChild(textWrapper);
//     containerElement.appendChild(article);
//   }
// }

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  containerElement.innerHTML = '';

  for (const p of projects) {
    const article = document.createElement('article');

    // Create a heading element dynamically
    const heading = document.createElement(headingLevel);
    if (p.url) {
      const link = document.createElement('a');
      link.href = p.url;
      link.textContent = p.title;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      heading.appendChild(link);
    } else {
      heading.textContent = p.title;
    }

    // Create image
    const img = document.createElement('img');
    img.src = p.image;
    img.alt = p.title;

    // Create description and year
    const textWrapper = document.createElement('div');
    const desc = document.createElement('p');
    desc.textContent = p.description || 'No description available.';
    const year = document.createElement('p');
    year.className = 'project-year';
    year.textContent = p.year ? `c. ${p.year}` : 'Year unknown';

    // Assemble and append
    textWrapper.append(desc, year);
    article.append(heading, img, textWrapper);
    containerElement.appendChild(article);
  }
}


export async function fetchGitHubData(username) {
  // return statement here
  return fetchJSON(`https://api.github.com/users/${username}`);
}