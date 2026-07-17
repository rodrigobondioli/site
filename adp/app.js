// ANTI DESIGNER PATO — interações
(function () {
  // Smooth scroll (Lenis — igual ao site principal)
  if (window.Lenis && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
    });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  // Animações on-scroll
  var targets = document.querySelectorAll("[data-animate]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        // marca quando entra na tela — ou quando já passou dela (scroll rápido)
        if (e.isIntersecting || e.boundingClientRect.top < 0) {
          e.target.classList.add("inview");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.3, rootMargin: "0px 0px -10% 0px" });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add("inview"); });
  }

  // Ícones Lottie dos cards pós-compra (tocam quando entram na tela)
  if (window.lottie) {
    document.querySelectorAll(".postbuy-ic[data-lottie]").forEach(function (el, i) {
      var data = window[el.getAttribute("data-lottie")];
      if (!data) return;
      var anim = lottie.loadAnimation({
        container: el,
        renderer: "svg",
        loop: false,
        autoplay: false,
        animationData: data
      });
      if ("IntersectionObserver" in window) {
        var lio = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting || e.boundingClientRect.top < 0) {
              setTimeout(function () { anim.play(); }, i * 250);
              lio.unobserve(e.target);
            }
          });
        }, { threshold: 0.4 });
        lio.observe(el);
      } else {
        anim.play();
      }
    });
  }

  // FAQ: accordion — abre um, fecha os outros
  var items = document.querySelectorAll(".faq-item");
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
