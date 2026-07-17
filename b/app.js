// ADP versão B — interações
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // fade-up com stagger
  if (!reduced) {
    var els = document.querySelectorAll(".sec > *, .prod, .step, .vs-card, .choice, .faq-list details");
    var byParent = new Map();
    els.forEach(function (el) {
      if (el.closest(".fade")) return;
      el.classList.add("fade");
      var p = el.parentElement, n = byParent.get(p) || 0;
      el.style.transitionDelay = Math.min(n * 0.1, 0.5) + "s";
      byParent.set(p, n + 1);
    });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting || e.boundingClientRect.top < 0) {
            e.target.classList.add("fade-in");
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0, rootMargin: "0px 0px -6% 0px" });
      document.querySelectorAll(".fade").forEach(function (el) { io.observe(el); });
    } else {
      document.querySelectorAll(".fade").forEach(function (el) { el.classList.add("fade-in"); });
    }
  }

  // rabisco do merreca
  var cv = document.querySelector(".circle-vec");
  if (cv && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting || e.boundingClientRect.top < 0) { e.target.classList.add("inview"); cio.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    cio.observe(cv);
  } else if (cv) { cv.classList.add("inview"); }

  // lotties pós-compra
  if (window.lottie) {
    document.querySelectorAll(".postbuy-ic[data-lottie]").forEach(function (el, i) {
      var data = window[el.getAttribute("data-lottie")];
      if (!data) return;
      var anim = lottie.loadAnimation({ container: el, renderer: "svg", loop: true, autoplay: false, animationData: data });
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
      } else { anim.play(); }
    });
  }

  // FAQ accordion
  var items = document.querySelectorAll(".faq-list details");
  items.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (item.open) items.forEach(function (o) { if (o !== item) o.open = false; });
    });
  });
})();
