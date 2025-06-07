document.addEventListener("DOMContentLoaded", () => {
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      document.querySelector(this.getAttribute("href")).scrollIntoView({
        behavior: "smooth",
      });

      // Optional: Close mobile menu after clicking a link
      const navToggle = document.getElementById("nav-toggle");
      if (navToggle && navToggle.checked) {
        navToggle.checked = false;
      }
    });
  });

  // Highlight active nav link based on scroll position (more advanced)
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".navbar-links ul li a");

  window.addEventListener("scroll", () => {
    let current = "";

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (scrollY >= sectionTop - sectionHeight / 3) {
        // Adjust offset as needed
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((a) => {
      a.classList.remove("active");
      if (a.getAttribute("href").includes(current)) {
        a.classList.add("active");
      }
    });
  });

  // Initial highlight for the 'home' section if at the top
  if (window.scrollY === 0) {
    const homeLink = document.querySelector(
      '.navbar-links ul li a[href="#home"]'
    );
    if (homeLink) {
      homeLink.classList.add("active");
    }
  }
});
