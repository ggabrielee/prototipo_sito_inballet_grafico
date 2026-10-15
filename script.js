/* I.N. BALLET — interazioni del sito */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", function () {
    var header = document.querySelector("[data-header]");
    var progress = document.querySelector(".scroll-progress");
    var toTop = document.querySelector(".to-top");
    var parallax = document.querySelector(".hero-media .parallax");

    /* ---------- Titoli animati parola per parola ---------- */
    document.querySelectorAll("[data-split]").forEach(function (el) {
      var i = 0;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var parts = child.textContent.split(/(\s+)/);
            var frag = document.createDocumentFragment();
            parts.forEach(function (p) {
              if (!p) return;
              if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
              var outer = document.createElement("span");
              outer.className = "split-word";
              var inner = document.createElement("span");
              inner.style.setProperty("--i", i++);
              inner.textContent = p;
              outer.appendChild(inner);
              frag.appendChild(outer);
            });
            child.parentNode.replaceChild(frag, child);
          } else if (child.nodeType === 1 && child.tagName !== "BR") {
            walk(child);
          }
        });
      })(el);
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { document.body.classList.add("is-loaded"); });
    });

    /* ---------- Header, progress, parallax ---------- */
    var lastY = window.scrollY;
    var ticking = false;
    function onScroll() {
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (header) {
        header.classList.toggle("is-scrolled", y > 40);
        var menuOpen = document.body.classList.contains("menu-open");
        header.classList.toggle("is-hidden", !menuOpen && y > 500 && y > lastY + 4 && !header.contains(document.activeElement));
        if (y < lastY - 4) header.classList.remove("is-hidden");
      }
      if (progress) progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
      if (toTop) toTop.classList.toggle("is-visible", y > window.innerHeight * 0.9);
      if (parallax && !reduceMotion && y < window.innerHeight * 1.2) {
        parallax.style.transform = "translate3d(0," + y * 0.22 + "px,0)";
      }
      updateTimeline();
      lastY = y;
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });

    if (toTop) toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });

    /* ---------- Dropdown desktop (click + tastiera) ---------- */
    var dropdowns = document.querySelectorAll(".has-dd");
    function closeAll(except) {
      dropdowns.forEach(function (dd) {
        if (dd !== except) {
          dd.classList.remove("is-open");
          var b = dd.querySelector(".dd-toggle");
          if (b) b.setAttribute("aria-expanded", "false");
        }
      });
    }
    dropdowns.forEach(function (dd) {
      var btn = dd.querySelector(".dd-toggle");
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = !dd.classList.contains("is-open");
        closeAll(dd);
        dd.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", String(open));
      });
      dd.addEventListener("mouseleave", function () {
        dd.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("click", function () { closeAll(); });

    /* ---------- Menu mobile ---------- */
    var burger = document.querySelector(".burger");
    var mobile = document.querySelector(".mobile-menu");
    function setMenu(open) {
      if (!burger || !mobile) return;
      burger.setAttribute("aria-expanded", String(open));
      mobile.classList.toggle("is-open", open);
      mobile.setAttribute("aria-hidden", String(!open));
      document.body.classList.toggle("menu-open", open);
      if (header) header.classList.remove("is-hidden");
      mobile.querySelectorAll(".m-list > li").forEach(function (li, idx) {
        li.style.transitionDelay = open ? 0.25 + idx * 0.05 + "s" : "0s";
      });
    }
    if (burger) burger.addEventListener("click", function () {
      setMenu(burger.getAttribute("aria-expanded") !== "true");
    });
    if (mobile) {
      mobile.querySelectorAll(".m-item > button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var item = btn.parentElement;
          var open = !item.classList.contains("is-open");
          item.classList.toggle("is-open", open);
          btn.setAttribute("aria-expanded", String(open));
        });
      });
      mobile.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { setMenu(false); });
      });
    }
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1240 && document.body.classList.contains("menu-open")) setMenu(false);
    });

    /* ---------- Lightbox ---------- */
    var lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Immagine ingrandita");
    lb.innerHTML = '<button class="lightbox-close" aria-label="Chiudi">&times;</button><img alt="">';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector("img");
    var lastFocus = null;
    function openLb(img) {
      lastFocus = document.activeElement;
      lbImg.src = img.getAttribute("data-full") || img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lb.classList.add("is-open");
      lb.querySelector(".lightbox-close").focus();
    }
    function closeLb() {
      lb.classList.remove("is-open");
      if (lastFocus) lastFocus.focus();
    }
    lb.addEventListener("click", closeLb);
    document.querySelectorAll("img.zoomable").forEach(function (img) {
      img.setAttribute("tabindex", "0");
      img.addEventListener("click", function () { openLb(img); });
      img.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLb(img); }
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (lb.classList.contains("is-open")) closeLb();
      else if (document.body.classList.contains("menu-open")) { setMenu(false); burger.focus(); }
      else closeAll();
    });

    /* ---------- Reveal allo scroll ---------- */
    var revealEls = document.querySelectorAll(".reveal, .reveal-img, .t-item");
    if ("IntersectionObserver" in window && !reduceMotion) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
        });
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add("is-in"); });
    }

    /* ---------- Timeline Atelier ---------- */
    var timeline = document.querySelector(".timeline");
    var tlProgress = timeline ? timeline.querySelector(".progress") : null;
    function updateTimeline() {
      if (!timeline || !tlProgress) return;
      var r = timeline.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
      tlProgress.style.height = p * 100 + "%";
    }

    onScroll();
  });
})();
