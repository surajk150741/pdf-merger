// Global site behavior (navbar, etc.)
document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".navbar");
  const toggle = document.querySelector(".nav-toggle");

  if (toggle && navbar) {
    toggle.addEventListener("click", () => {
      const isOpen = navbar.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }
});
