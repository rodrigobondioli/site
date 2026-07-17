// ANTI DESIGNER PATO — interações
(function () {
  // Locomotive Scroll v5 (smooth + parallax nativo via data-scroll-speed)
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var LS = window.locomotiveScroll;
  if (LS && LS.default) LS = LS.default;
  if (LS && !reduced) {
    new LS({
      lenisOptions: {
        duration: 1.15,
        smoothWheel: true,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
      }
    });
  } else if (window.Lenis && !reduced) {
    var lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })();
  }

  // Fade-up fino em cards e blocos (stagger por irmãos)
  if (!reduced) {
    var fadeSel = ".card, .section-head, .stack-tags, .trust-bar, .deliver-now, .faq-item, .audience-block, .choices-cta";
    var fadeEls = document.querySelectorAll(fadeSel);
    var byParent = new Map();
    fadeEls.forEach(function (el) {
      if (el.closest(".hero")) return; // hero tem coreografia própria
      if (el.classList.contains("stack-tags") && el.closest(".card")) return; // card já faz o fade
      el.classList.add(el.hasAttribute("data-scroll-speed") ? "fade-op" : "fade");
      var p = el.parentElement;
      var n = byParent.get(p) || 0;
      el.style.transitionDelay = (n * 0.12) + "s";
      byParent.set(p, n + 1);
    });
    if ("IntersectionObserver" in window) {
      var fio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting || e.boundingClientRect.top < 0) {
            e.target.classList.add("fade-in");
            fio.unobserve(e.target);
          }
        });
      }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
      document.querySelectorAll(".fade, .fade-op").forEach(function (el) { fio.observe(el); });
    } else {
      document.querySelectorAll(".fade, .fade-op").forEach(function (el) { el.classList.add("fade-in"); });
    }
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
        loop: true,
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
