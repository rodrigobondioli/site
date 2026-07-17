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

  // Parallax em camadas (pegada Locomotive) — elementos com data-speed
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced && window.matchMedia("(min-width: 901px)").matches) {
    var pEls = [];
    document.querySelectorAll("[data-speed]").forEach(function (el) {
      pEls.push({ el: el, speed: parseFloat(el.getAttribute("data-speed")) || 0, y: 0, top: 0, h: 0 });
    });
    var measure = function () {
      var sy = window.scrollY || window.pageYOffset;
      pEls.forEach(function (o) {
        var r = o.el.getBoundingClientRect();
        o.top = r.top + sy - o.y;
        o.h = r.height;
      });
    };
    var update = function () {
      var sy = window.scrollY || window.pageYOffset;
      var vh = window.innerHeight;
      pEls.forEach(function (o) {
        var center = o.top + o.h / 2 - sy;
        var y = (vh / 2 - center) * o.speed;
        if (Math.abs(y - o.y) > 0.1) {
          o.y = y;
          o.el.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)";
        }
      });
      requestAnimationFrame(update);
    };
    window.addEventListener("resize", function () { requestAnimationFrame(measure); });
    window.addEventListener("load", measure);
    measure();
    requestAnimationFrame(update);
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
