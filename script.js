
const buttons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

buttons.forEach(button => {
  button.addEventListener("click", () => {

    const target = button.dataset.page;

    buttons.forEach(btn => {
      btn.classList.remove("active");
    });

    pages.forEach(page => {
      page.classList.remove("active");
    });

    button.classList.add("active");

    document.getElementById(target).classList.add("active");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });
});
