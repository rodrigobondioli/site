// ANTI DESIGNER PATO — interações
(function () {
  // FAQ: accordion — abre um, fecha os outros
  const items = document.querySelectorAll(".faq-item");
  items.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (item.open) {
        items.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      }
    });
  });
})();
