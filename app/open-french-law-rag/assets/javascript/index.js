//------------------------------------------------------------------------------
// Fade-in effect
//------------------------------------------------------------------------------
const fadeInObserver = new IntersectionObserver(elems => {
  elems.forEach(elem => {
    if (!elem.isIntersecting) {
      return 
    }
    
    elem.target.classList.add("fade-in-settled");
    fadeInObserver.unobserve(elem.target);
  });
}, { threshold: 0.2 });


for (const elem of document.querySelectorAll(".fade-in")) {
  fadeInObserver.observe(elem);
}


//------------------------------------------------------------------------------
// Mobile nav
//------------------------------------------------------------------------------
const toggleOutlineMobile = () => {
  const nav = document.querySelector("#outline-mobile");
  const ul = document.querySelector("#outline-mobile ul");

  // Closing
  if (nav.classList.contains("open")) {
    nav.classList.remove("open");
    ul.removeAttribute("aria-hidden");

    for (const link of nav.querySelectorAll("a")) {
      link.setAttribute("tabindex", "-1");
    }
  }
  // Opening
  else {
    nav.classList.add("open");
    ul.setAttribute("aria-hidden", "true");

    for (const link of nav.querySelectorAll("a")) {
      link.removeAttribute("tabindex");
    }
  }
}

document.querySelector("#outline-mobile").addEventListener("click", e => {
  if (e.target instanceof HTMLAnchorElement || e.target instanceof HTMLButtonElement) {
    toggleOutlineMobile();
  }
})

document.addEventListener("keydown", e => {
  if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
    toggleOutlineMobile();
    document.querySelector("#outline-mobile button").focus();
  }
})