// document.addEventListener("DOMContentLoaded", () => {
//   const tabs = document.querySelectorAll(".vehicle-tabs button");

//   tabs.forEach((tab) => {
//     tab.addEventListener("click", () => {
//       tabs.forEach((btn) => btn.classList.remove("active"));

//       tab.classList.add("active");
//     });
//   });
// });

class CustomSelect {
  static CHEVRON =
    '<svg width="12" height="12" viewBox="0 0 12 12" fill="none">' +
    '<path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";

  static GREEN_CHECK =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none">' +
    '<circle cx="8" cy="8" r="7.5" fill="#22c55e"/>' +
    '<path d="M4.5 8.5l2.5 2.5 4.5-5" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";

  static OPT_CHECK =
    '<svg class="cs-option-check" viewBox="0 0 16 16" fill="none">' +
    '<circle cx="8" cy="8" r="7.5" fill="#22c55e"/>' +
    '<path d="M4.5 8.5l2.5 2.5 4.5-5" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";

  static #registry = [];

  static closeAll(except = null) {
    CustomSelect.#registry.forEach((instance) => {
      if (instance !== except) instance.close();
    });
  }

  // ── Constructor ─────────────────────────────────────────
  constructor(wrapId, { onSelect = null } = {}) {
    this.wrap = document.getElementById(wrapId);
    if (!this.wrap) throw new Error(`CustomSelect: #${wrapId} not found`);

    this.btn = this.wrap.querySelector(".cs-trigger");
    this.list = this.wrap.querySelector(".cs-dropdown");
    this.textEl = this.wrap.querySelector(".cs-trigger-text");
    this.iconEl = this.wrap.querySelector(".cs-trigger-icon");

    this.onSelect = onSelect;
    this.selectedValue = "";
    this.selectedLabel = "";

    this.#bindEvents();
    CustomSelect.#registry.push(this);
  }

  // ── Public API ──────────────────────────────────────────

  open() {
    this.wrap.classList.add("is-open");
    this.btn.setAttribute("aria-expanded", "true");
  }

  close() {
    this.wrap.classList.remove("is-open");
    this.btn.setAttribute("aria-expanded", "false");
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  get isOpen() {
    return this.wrap.classList.contains("is-open");
  }

  get value() {
    return this.selectedValue;
  }

  get label() {
    return this.selectedLabel;
  }

  reset(placeholder = "Select") {
    this.selectedValue = "";
    this.selectedLabel = "";
    this.textEl.textContent = placeholder;
    this.btn.classList.remove("has-value");
    this.iconEl.className = "cs-trigger-icon chevron";
    this.iconEl.innerHTML = CustomSelect.CHEVRON;
    this.#clearSelection();
  }

  setOptions(items = [], placeholder = "Select") {
    this.reset(placeholder);
    this.list.innerHTML = this.#buildOptionHTML("", placeholder, true);
    items.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = this.#buildOptionHTML(item, item);
      this.list.appendChild(li);
    });
  }

  // ── Private ─────────────────────────────────────────────

  #bindEvents() {
    this.btn.addEventListener("click", (e) => {
      e.stopPropagation();
      CustomSelect.closeAll(this);
      this.toggle();
    });

    this.list.addEventListener("click", (e) => {
      const opt = e.target.closest(".cs-option");
      if (!opt || opt.classList.contains("is-placeholder")) return;
      this.#selectOption(opt);
    });

    this.btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.toggle();
      }
      if (e.key === "Escape") {
        this.close();
      }
      if (e.key === "ArrowDown" && this.isOpen) {
        e.preventDefault();
        this.#focusOption(1);
      }
      if (e.key === "ArrowUp" && this.isOpen) {
        e.preventDefault();
        this.#focusOption(-1);
      }
    });

    this.list.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.close();
        this.btn.focus();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        this.#focusOption(1);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        this.#focusOption(-1);
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const focused = this.list.querySelector(".cs-option:focus");
        if (focused) this.#selectOption(focused);
      }
    });
  }

  #selectOption(opt) {
    this.selectedValue = opt.dataset.value;
    this.selectedLabel = opt.querySelector(".cs-option-label").textContent;

    this.#clearSelection();
    opt.classList.add("is-selected");
    opt.setAttribute("aria-selected", "true");

    this.textEl.textContent = this.selectedLabel;
    this.btn.classList.add("has-value");
    this.iconEl.classList.remove("chevron");
    this.iconEl.innerHTML = CustomSelect.GREEN_CHECK;

    this.close();

    if (this.onSelect) this.onSelect(this.selectedValue, this.selectedLabel);
  }

  #clearSelection() {
    this.list.querySelectorAll(".cs-option").forEach((o) => {
      o.classList.remove("is-selected");
      o.setAttribute("aria-selected", "false");
    });
  }

  #focusOption(direction) {
    const opts = Array.from(
      this.list.querySelectorAll(".cs-option:not(.is-placeholder)"),
    );
    const current = this.list.querySelector(".cs-option:focus");
    const idx = opts.indexOf(current);
    const next = idx + direction;

    if (next >= 0 && next < opts.length) opts[next].focus();
    else if (idx === -1 && direction === 1) opts[0]?.focus();
  }

  #buildOptionHTML(value, label, isPlaceholder = false) {
    const cls = isPlaceholder ? "cs-option is-placeholder" : "cs-option";
    return (
      `<button class="${cls}" role="option" aria-selected="false" data-value="${value}">` +
      `<span class="cs-option-label">${label}</span>` +
      CustomSelect.OPT_CHECK +
      `</button>`
    );
  }
}

// ── Close all on outside click ───────────────────────────────
document.addEventListener("click", () => CustomSelect.closeAll());

// ════════════════════════════════════════════════════════════
// INITIALISE — wrapped in DOMContentLoaded so all elements
// are guaranteed to exist before the class tries to find them
// ════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", function () {
  // ── Data maps ──────────────────────────────────────────
  const cityMap = {
    Delhi: ["New Delhi", "Dwarka", "Rohini"],
    Haryana: ["Gurugram", "Faridabad", "Ambala"],
    Maharashtra: ["Mumbai", "Pune", "Nagpur"],
    Karnataka: ["Bengaluru", "Mysuru", "Hubli"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
  };

  const modelMap = {
    Hero: ["Splendor Plus", "Destini 125", "Xpulse 200", "Glamour", "Passion Pro"],
    Honda: ["Activa 6G", "CB Shine", "Unicorn", "SP 125"],
    Bajaj: ["Pulsar NS200", "CT 110", "Platina"],
    TVS: ["Jupiter", "Star City+", "Apache RTR 200"],
    Suzuki: ["Access 125", "Gixxer", "Burgman Street"],
  };

  // ── Dependent selects must be created BEFORE the parents
  // so their references exist when the parent's onSelect fires
  // ────────────────────────────────────────────────────────
  const citySelect = new CustomSelect("w-city");
  const modelSelect = new CustomSelect("w-model");

  const stateSelect = new CustomSelect("w-state", {
    onSelect(val) {
      citySelect.setOptions(cityMap[val] || [], "Select City");
    },
  });

  const companySelect = new CustomSelect("w-company", {
    onSelect(val) {
      modelSelect.setOptions(modelMap[val] || [], "Select Model");
    },
  });

  // ── Vehicle type toggle ─────────────────────────────────
  document.querySelectorAll(".type-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".type-btn").forEach((b) => {
        b.classList.remove("type-btn--active");
        b.setAttribute("aria-pressed", "false");
      });

      this.classList.add("type-btn--active");
      this.setAttribute("aria-pressed", "true");
    });
  });

  // ── Nav hamburger ───────────────────────────────────────
  const hamburger = document.querySelector(".nav-hamburger");
  if (hamburger) {
    hamburger.addEventListener("click", function () {
      const expanded = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", String(!expanded));
    });
  }
});

// Language model
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("languageModal");
  const cards = document.querySelectorAll(".language-card");
  // const proceedBtn = document.getElementById("languageProceed");
  const closeBtn = document.getElementById("closeLanguageModal");
  const langSwitcher = document.getElementById("openLanguageSwitcher");

  let selectedLanguage = "";

  if (langSwitcher) {
    langSwitcher.addEventListener("click", () => {
      modal.classList.remove("language-modal-hidden");
    });
  }

  closeBtn.addEventListener("click", () => {
    modal.classList.add("language-modal-hidden");
  });

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      cards.forEach((c) => c.classList.remove("active"));

      card.classList.add("active");

      selectedLanguage = card.dataset.lang;

      // Added line to select store and close the dialog
      localStorage.setItem("preferredLanguage", card.dataset.lang);
      modal.classList.add("language-modal-hidden");

      proceedBtn.disabled = false;
    });
  });

  if (localStorage.getItem("preferredLanguage")) {
    modal.classList.add("language-modal-hidden");
    return;
  }

  // proceedBtn.addEventListener("click", () => {
  //   if (!selectedLanguage) return;

  //   localStorage.setItem("preferredLanguage", selectedLanguage);

  //   modal.classList.add("language-modal-hidden");

  //   console.log("Selected Language:", selectedLanguage);
  // });
});

// Carousel js
document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".banner-image");
  const dotsWrap = container.querySelector(".pointer-dots");

  const MOBILE_IMAGES = [
    "/assets/home/hero_bikes.png",
    "/assets/home/banner.png",
    "/assets/home/hero_bikes.png",
  ];

  const DESKTOP_IMAGE = "/assets/home/banner.png";
  const SLIDE_INTERVAL = 3000;
  const TRANSITION_MS = 400;

  let currentIndex = 0;
  let intervalTimer = null;
  let isMobile = false;
  let resizeTimer = null;
  let slides = [];
  let dots = [];
  let isAnimating = false; // guard — prevent overlap if interval fires during transition

  // ── Build dots ───────────────────────────────────────────
  function buildDots(count) {
    // Fully wipe and rebuild
    while (dotsWrap.firstChild) dotsWrap.removeChild(dotsWrap.firstChild);
    dots = [];

    if (count <= 1) {
      dotsWrap.style.display = "none";
      return;
    }

    dotsWrap.style.display = "flex";

    for (let i = 0; i < count; i++) {
      const outline = document.createElement("div");
      outline.className = "dot_outline";

      const fill = document.createElement("div");
      fill.className = "dot_fill";

      outline.appendChild(fill);
      dotsWrap.appendChild(outline);
      dots.push(outline);
    }

    // Activate first dot without animation
    activateDotInstant(0);
  }

  // ── Activate dot instantly (no transition — used on init) ─
  function activateDotInstant(index) {
    dots.forEach((d) => {
      d.classList.remove("dot_outline--active", "dot_outline--exit-left");
      // Snap fill off-screen right with no transition
      const fill = d.querySelector(".dot_fill");
      fill.style.transition = "none";
      fill.style.transform = "translateX(20px)";
    });

    const activeFill = dots[index].querySelector(".dot_fill");
    activeFill.style.transition = "none";
    activeFill.style.transform = "translateX(0)";
    dots[index].classList.add("dot_outline--active");
  }

  // ── Animate dots: prev exits left, next enters from right ─
  function animateDots(prevIndex, nextIndex) {
    if (dots.length === 0) return;

    const prevDot = dots[prevIndex];
    const nextDot = dots[nextIndex];
    const prevFill = prevDot.querySelector(".dot_fill");
    const nextFill = nextDot.querySelector(".dot_fill");

    // ── Outgoing dot: slide fill left ───────────────────────
    prevDot.classList.remove("dot_outline--active");
    prevFill.style.transition = "transform 400ms ease";
    prevFill.style.transform = "translateX(20px)";

    // ── Incoming dot: snap fill to right (no transition)
    //    then slide it to centre ───────────────────────────
    nextFill.style.transition = "none";
    nextFill.style.transform = "translateX(-20px)";

    // Force reflow — makes browser register the snap
    // before the transition is re-enabled
    void nextFill.offsetWidth;

    nextFill.style.transition = "transform 400ms ease";
    nextFill.style.transform = "translateX(0)";
    nextDot.classList.add("dot_outline--active");

    // Cleanup after transition
    setTimeout(() => {
      prevFill.style.transition = "none";
      prevFill.style.transform = "translateX(20px)"; // reset off-right, ready to reuse
      isAnimating = false;
    }, TRANSITION_MS);
  }

  // ── Build slides ─────────────────────────────────────────
  function buildSlides(images) {
    container.querySelectorAll(".banner-slide").forEach((s) => s.remove());
    slides = [];

    images.forEach((src, index) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "Banner";
      img.className = "banner-slide";

      if (index === 0) img.classList.add("banner-slide--active");

      container.insertBefore(img, dotsWrap);
      slides.push(img);
    });

    currentIndex = 0;
    isAnimating = false;
    buildDots(images.length);
  }

  // ── Advance to next slide ────────────────────────────────
  function goToNext() {
    if (isAnimating) return; // skip if previous transition still running
    isAnimating = true;

    const prevIndex = currentIndex;
    currentIndex = (currentIndex + 1) % slides.length;

    // Slide transition
    slides[prevIndex].classList.remove("banner-slide--active");
    slides[prevIndex].classList.add("banner-slide--prev");
    slides[currentIndex].classList.remove("banner-slide--prev");
    slides[currentIndex].classList.add("banner-slide--active");

    setTimeout(() => {
      slides[prevIndex].classList.remove("banner-slide--prev");
    }, TRANSITION_MS);

    // Dot transition
    animateDots(prevIndex, currentIndex);
  }

  // ── Slideshow controls ───────────────────────────────────
  function startSlideshow() {
    stopSlideshow();
    intervalTimer = setInterval(goToNext, SLIDE_INTERVAL);
  }

  function stopSlideshow() {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }

  // ── Breakpoint switch ────────────────────────────────────
  function updateBanner() {
    const nowMobile = window.innerWidth <= 767;
    if (nowMobile === isMobile) return;
    isMobile = nowMobile;

    if (isMobile) {
      buildSlides(MOBILE_IMAGES);
      startSlideshow();
    } else {
      stopSlideshow();
      buildSlides([DESKTOP_IMAGE]);
    }
  }

  // ── Debounced resize ─────────────────────────────────────
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateBanner, 150);
  });

  // ── Init ─────────────────────────────────────────────────
  isMobile = window.innerWidth <= 767;

  if (isMobile) {
    buildSlides(MOBILE_IMAGES);
    startSlideshow();
  } else {
    buildSlides([DESKTOP_IMAGE]);
  }
});
