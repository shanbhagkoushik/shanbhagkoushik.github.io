document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  const current = document.querySelector(`[data-nav="${page}"]`);
  if (current) current.setAttribute("aria-current", "page");
});
