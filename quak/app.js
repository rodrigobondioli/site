// MATE O PATO — interações
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Smooth scroll com lenis (13KB) — carregado à parte pra não bloquear o primeiro paint
  if (!reduced) {
    var _ls = document.createElement("script");
    _ls.src = "/quak/assets/js/lenis.min.js";
    _ls.onload = function () {
      if (window.Lenis) {
        var lenis = new Lenis({ duration: 1.15, smoothWheel: true });
        requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
      }
    };
    document.head.appendChild(_ls);
  }

  // Fade-up fino em cards e blocos (stagger por irmãos)
  if (!reduced) {
    var fadeSel = ".card, .section-head, .stack-tags, .trust-bar, .deliver-now, .faq-item, .audience-block .h-24-eb, .audience-list li, .choices-cta";
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
  var targets = Array.prototype.filter.call(
    document.querySelectorAll("[data-animate]"),
    function (el) { return !el.classList.contains("circle-vec") && !el.classList.contains("scribble") && !el.classList.contains("belief-nao"); }
  );
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

  // Rabiscos: desenham só quando chegam na faixa central da tela (senão passa batido)
  var sketches = document.querySelectorAll(".circle-vec, .scribble");
  if ("IntersectionObserver" in window) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting || e.boundingClientRect.top < 0) {
          e.target.classList.add("inview");
          sio.unobserve(e.target);
        }
      });
    }, { threshold: 0, rootMargin: "-30% 0px -30% 0px" });
    sketches.forEach(function (el) { sio.observe(el); });
  } else {
    sketches.forEach(function (el) { el.classList.add("inview"); });
  }

  // Ícones Lottie dos cards pós-compra — lazy: carrega o lottie só quando os cards se aproximam
  (function () {
    var icons = document.querySelectorAll(".postbuy-ic[data-lottie]");
    if (!icons.length) return;
    var booted = false;
    function loadScript(src) {
      return new Promise(function (res, rej) {
        var s = document.createElement("script");
        s.src = src; s.async = false; s.onload = res; s.onerror = rej;
        document.body.appendChild(s);
      });
    }
    function initIcons() {
      if (!window.lottie) return;
      icons.forEach(function (el, i) {
        var data = window[el.getAttribute("data-lottie")];
        if (!data) return;
        var anim = lottie.loadAnimation({ container: el, renderer: "svg", loop: true, autoplay: false, animationData: data });
        if (reduced) { anim.goToAndStop(0, true); }
        else { setTimeout(function () { anim.play(); }, i * 250); }
      });
    }
    function boot() {
      if (booted) return;
      booted = true;
      loadScript("/quak/assets/js/lottie_light.min.js")
        .then(function () { return loadScript("/quak/assets/js/lottie-icons.js"); })
        .then(initIcons)
        .catch(function () {});
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { boot(); io.disconnect(); } });
      }, { rootMargin: "400px 0px" });
      icons.forEach(function (el) { io.observe(el); });
    } else {
      boot();
    }
  })();

  // Balão único do hero: cicla as frases (efeito gif)
  (function () {
    var cyc = document.querySelector(".b-cycle");
    if (!cyc) return;
    var lines = cyc.querySelectorAll(".b-line");
    if (lines.length < 2 || reduced) return;
    var i = 0;
    setInterval(function () {
      lines[i].classList.remove("is-active");
      i = (i + 1) % lines.length;
      lines[i].classList.add("is-active");
    }, 3600);
  })();

  // Text reveal desligado — texto estático (só os balões animam)
  document.querySelectorAll("[data-text-reveal]").forEach(function (el) {
    var beliefWrap = el.closest(".belief");
    var beliefNao = beliefWrap ? beliefWrap.querySelector(".belief-nao") : null;
    if (beliefNao) beliefNao.classList.add("inview");
  });

  // CTA sticky: aparece quando o hero sai de cena, some sobre a oferta
  var sticky = document.getElementById("sticky-cta");
  var heroEl = document.querySelector(".hero");
  // esconde o sticky sobre qualquer CTA/rodapé (evita sobreposição)
  var hideEls = [
    document.querySelector(".offer-box"),
    document.querySelector(".final-cta"),
    document.querySelector(".footer")
  ].filter(Boolean);
  if (sticky && heroEl && "IntersectionObserver" in window) {
    var heroGone = false;
    var nearCTA = new Set();
    var refresh = function () {
      var show = heroGone && nearCTA.size === 0;
      sticky.classList.toggle("show", show);
      sticky.setAttribute("aria-hidden", show ? "false" : "true");
    };
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { heroGone = !e.isIntersecting; });
      refresh();
    }, { threshold: 0 }).observe(heroEl);
    hideEls.forEach(function (el) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) nearCTA.add(el); else nearCTA.delete(el); });
        refresh();
      }, { threshold: 0.15 }).observe(el);
    });
  }

  // Marquee Lote Fundador — escassez (estoque) + urgência (countdown), fake-seguro/determinístico
  (function () {
    var track = document.querySelector(".marquee-track");
    if (!track) return;
    var mq = document.querySelector(".marquee");
    var mqItems = track.querySelectorAll(".marquee-item");
    if (!mqItems.length) return;

    // >>> AJUSTE AQUI o dia/hora que o lote entrou no ar (ano, mês 0-based, dia, hora):
    var LAUNCH = Date.UTC(2026, 6, 24, 12); // 24/jul/2026 12:00 UTC
    var TOTAL = 50;        // tamanho do lote (o "dos 50")
    var INIT_LEFT = 31;    // quanto "resta" no lançamento (já parece que vendeu ~19)
    var PER_HOUR = 0.3;    // ritmo de queda (~7/dia)
    var FLOOR = 7;         // trava aqui (nunca zera, sempre sobra urgência)

    // Estoque "restam": só depende do tempo -> não reseta no F5, só desce.
    // Começa em INIT_LEFT (nunca no total cheio) e cai devagar até o piso.
    function stockLeft() {
      var hours = (Date.now() - LAUNCH) / 3600000;
      if (hours < 0) hours = 0;
      var left = INIT_LEFT - Math.floor(hours * PER_HOUR);
      return left < FLOOR ? FLOOR : left;
    }

    // Prazo: próximo domingo 23:59:59 -> reancorá sozinho toda semana
    function nextDeadline() {
      var now = new Date();
      var d = new Date(now);
      var until = (7 - d.getDay()) % 7; // 0 = domingo
      d.setDate(d.getDate() + until);
      d.setHours(23, 59, 59, 0);
      if (d <= now) d.setDate(d.getDate() + 7);
      return d;
    }
    function fmt(ms) {
      if (ms < 0) ms = 0;
      var s = Math.floor(ms / 1000);
      var dd = Math.floor(s / 86400); s -= dd * 86400;
      var hh = Math.floor(s / 3600); s -= hh * 3600;
      var mm = Math.floor(s / 60); s -= mm * 60;
      var p = function (n) { return (n < 10 ? "0" : "") + n; };
      return (dd > 0 ? dd + "d " : "") + p(hh) + "h " + p(mm) + "m " + p(s) + "s";
    }

    function render() {
      var stock = stockLeft();
      var left = fmt(nextDeadline() - new Date());
      var html = "<strong>Lote Fundador:</strong> Restam " + stock +
        " dos " + TOTAL + " acessos por R$ 97 (ou 12x de R$ 9,97) · Encerra em " + left;
      for (var i = 0; i < mqItems.length; i++) mqItems[i].innerHTML = html;
      if (mq) mq.setAttribute("aria-label",
        "Lote Fundador: restam " + stock + " de " + TOTAL + " acessos por R$ 97. Encerra em " + left + ". Valor oficial R$ 197.");
    }
    render();
    setInterval(render, 1000);
  })();

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
