"use strict";

/* ============================================================
    CONFIG
    ============================================================ */
const CONFIG = {
  totalSteps: 4,
  steps: {
    1: { label: "Vehicle Details", sidebarLabel: "Vehicle details", sub: null },
    2: {
      label: "Vehicle Condition",
      sidebarLabel: "Vehicle condition",
      sub: null,
    },
    3: { label: "Unlock Price", sidebarLabel: "Unlock price", sub: null },
    4: { label: "Valuation", sidebarLabel: "Valuation", sub: ["value", "centre"] },
  },
  subDefaults: { 2: "condition", 4: "value" },
  defaultStep: 2,
  otp: { defaultChannel: "whatsapp" },
  modelBenefits: {
    0: { roadTax: 2500, greenDiscount: 1500 },
    1: { roadTax: 2000, greenDiscount: 1200 },
    2: { roadTax: 3000, greenDiscount: 2000 },
    3: { roadTax: 1800, greenDiscount: 1000 },
    4: { roadTax: 1800, greenDiscount: 1000 },
  },
  blogs: [
    {
      title: "Save Big on Hero Bikes with Exchange Offers on Wheels Of Trust",
      date: "31 Mar 2026",
      img: "/assets/home/blog_img.png",
    },
    {
      title: "Why Bike Exchange is the Smartest Way to Upgrade in 2026",
      date: "31 Mar 2026",
      img: "/assets/home/blog_2.png",
    },
    {
      title: "Upgrade Smart: Why Exchange Offers Are the Best Way to Buy a Scooter",
      date: "31 Mar 2026",
      img: "/assets/home/blog_img.png",
    },
  ],
};

/* ============================================================
    URLStateManager — read / write / listen query params
    ============================================================ */
class URLStateManager {
  read() {
    const p = new URLSearchParams(window.location.search);
    const step = parseInt(p.get("step")) || CONFIG.defaultStep;
    const sub = p.get("sub") || null;
    return { step, sub };
  }

  push(step, sub) {
    const p = new URLSearchParams();
    p.set("step", step);
    if (sub) p.set("sub", sub);
    history.pushState({ step, sub }, "", `?${p.toString()}`);
  }

  bindPopState(cb) {
    window.addEventListener("popstate", (e) => {
      const state = e.state && e.state.step ? e.state : this.read();
      cb(state.step, state.sub);
    });
  }
}

/* ============================================================
    Stepper — navigation, panel visibility, UI sync
    ============================================================ */
class Stepper {
  constructor() {
    this.url = new URLStateManager();
    this.step = 1;
    this.sub = null;
  }

  init() {
    let { step, sub } = this.url.read();

    // Validate step
    if (!CONFIG.steps[step]) step = CONFIG.defaultStep;

    // Validate / default sub
    const cfg = CONFIG.steps[step];
    if (cfg.sub) {
      if (!sub || !cfg.sub.includes(sub)) sub = CONFIG.subDefaults[step] || cfg.sub[0];
    } else {
      sub = null;
    }

    this.goTo(step, sub, false);

    // Browser back / forward
    this.url.bindPopState((s, sb) => this.goTo(s, sb, false));
  }

  goTo(step, sub, pushUrl = true) {
    if (!CONFIG.steps[step]) return;

    const cfg = CONFIG.steps[step];
    if (cfg.sub && (!sub || !cfg.sub.includes(sub))) sub = cfg.sub[0];
    if (!cfg.sub) sub = null;

    this.step = step;
    this.sub = sub;

    this._showPanel(step, sub);
    this._syncDesktopStepper(step);
    this._syncMobileBar(step, sub);
    this._syncSidebarProducts(step, sub);

    if (pushUrl) {
      try {
        this.url.push(step, sub);
      } catch (e) {
        /* blocked in iframe — UI still works */
      }
    }
  }

  next() {
    const { step, sub } = this._nextPos();
    this.goTo(step, sub);
  }

  prev() {
    const { step, sub } = this._prevPos();
    this.goTo(step, sub);
  }

  _nextPos() {
    const { step, sub } = this;
    const cfg = CONFIG.steps[step];
    if (cfg.sub) {
      const idx = cfg.sub.indexOf(sub);
      if (idx < cfg.sub.length - 1) return { step, sub: cfg.sub[idx + 1] };
    }
    const ns = step + 1;
    if (ns > CONFIG.totalSteps) return { step, sub };
    const nc = CONFIG.steps[ns];
    return { step: ns, sub: nc.sub ? nc.sub[0] : null };
  }

  _prevPos() {
    const { step, sub } = this;
    const cfg = CONFIG.steps[step];
    if (cfg.sub) {
      const idx = cfg.sub.indexOf(sub);
      if (idx > 0) return { step, sub: cfg.sub[idx - 1] };
    }
    const ps = step - 1;
    if (ps < 1)
      return { step: 1, sub: CONFIG.steps[1].sub ? CONFIG.steps[1].sub[0] : null };
    const pc = CONFIG.steps[ps];
    return { step: ps, sub: pc.sub ? pc.sub[pc.sub.length - 1] : null };
  }

  _showPanel(step, sub) {
    document.querySelectorAll(".step-panel").forEach((p) => p.classList.remove("active"));
    const id = sub ? `step-${step}-${sub}` : `step-${step}`;
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
  }

  _syncDesktopStepper(activeStep) {
    document.querySelectorAll("[data-si]").forEach((item) => {
      const n = parseInt(item.dataset.si);
      item.className =
        "stepper-item " +
        (n < activeStep ? "s-done" : n === activeStep ? "s-active" : "s-pending");
    });
  }

  _syncMobileBar(step, sub) {
    document.querySelectorAll("[data-mdot]").forEach((dot) => {
      const n = parseInt(dot.dataset.mdot);
      dot.className =
        "m-dot " + (n < step ? "completed" : n === step ? "active" : "pending");
      if (n < step)
        dot.innerHTML = '<i class="bi bi-check" style="font-size:0.65rem"></i>';
      else dot.textContent = n;
    });
    document.querySelectorAll("[data-mline]").forEach((line) => {
      const n = parseInt(line.dataset.mline);
      line.className = "m-line" + (n < step ? " done" : "");
    });
    const lbl = document.getElementById("mobileLabel");
    if (lbl) {
      const cfg = CONFIG.steps[step];
      const subPart = sub ? ` — ${sub.charAt(0).toUpperCase() + sub.slice(1)}` : "";
      lbl.innerHTML = `Step <strong>${step}</strong> of ${CONFIG.totalSteps} — <strong>${cfg.sidebarLabel}${subPart}</strong>`;
    }
  }

  _syncSidebarProducts(step, sub) {
    const sp = document.getElementById("sidebarProducts");
    const sb = document.getElementById("sidebarBlog");
    // if (sp) sp.classList.toggle("d-none-custom", !(step === 4 && sub === "centre"));
    // if (sb) sb.classList.toggle("d-none-custom", !(step === 4 && sub === "value"));
    if (sb) sb.classList.toggle("d-none-custom");
  }
}

/* ============================================================
    ToggleGroup — condition page toggle options
    ============================================================ */
class ToggleGroup {
  init() {
    document.querySelectorAll(".toggle-pair").forEach((pair) => {
      pair.querySelectorAll(".t-opt").forEach((opt, idx) => {
        opt.addEventListener("click", () => {
          pair
            .querySelectorAll(".t-opt")
            .forEach((o) => o.classList.remove("sel-pos", "sel-neg"));
          opt.classList.add(idx === 0 ? "sel-pos" : "sel-neg");
        });
      });
    });
  }
}

/* ============================================================
    RadioGroup — documents page Yes/No options
    ============================================================ */
class RadioGroup {
  init() {
    document.querySelectorAll(".yn-pair").forEach((pair) => {
      pair.querySelectorAll(".yn-opt").forEach((opt) => {
        opt.addEventListener("click", () => {
          pair.querySelectorAll(".yn-opt").forEach((o) => o.classList.remove("sel"));
          opt.classList.add("sel");
        });
      });
    });
  }
}

/* ============================================================
    OTPHandler — WhatsApp / SMS channel toggle
    ============================================================ */
class OTPHandler {
  init() {
    document.querySelectorAll(".otp-ch-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".otp-ch-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  }
}

/* ============================================================
    TermsCheckbox
    ============================================================ */
class TermsCheckbox {
  init() {
    const box = document.getElementById("termsBox");
    if (!box) return;
    box.addEventListener("click", () => {
      box.classList.toggle("on");
      box.innerHTML = box.classList.contains("on")
        ? '<i class="bi bi-check" style="color:#fff;font-size:0.7rem"></i>'
        : "";
    });
  }
}

/* ============================================================
    DealerSelector
    ============================================================ */
class DealerSelector {
  init() {
    document.querySelectorAll(".dealer-card").forEach((card) => {
      card.addEventListener("click", () => {
        document
          .querySelectorAll(".dealer-card")
          .forEach((c) => c.classList.remove("sel"));
        card.classList.add("sel");
      });
    });
  }
}

/* ============================================================
    FAQAccordion
    ============================================================ */
class FAQAccordion {
  init() {
    document.querySelectorAll(".faq-q").forEach((q) => {
      q.addEventListener("click", () => {
        const item = q.closest(".faq-item");
        const isOpen = item.classList.contains("open");
        document.querySelectorAll(".faq-item").forEach((i) => i.classList.remove("open"));
        if (!isOpen) item.classList.add("open");
      });
    });
  }
}

/* ============================================================
    StarRating
    ============================================================ */
class StarRating {
  constructor() {
    this.current = 4;
  }

  init() {
    const stars = document.querySelectorAll(".star-btn");
    stars.forEach((star) => {
      star.addEventListener("mouseenter", () => this._highlight(+star.dataset.sv));
      star.addEventListener("mouseleave", () => this._highlight(this.current));
      star.addEventListener("click", () => {
        this.current = +star.dataset.sv;
        this._highlight(this.current);
      });
    });
    this._highlight(this.current);
  }

  _highlight(n) {
    document.querySelectorAll(".star-btn").forEach((s) => {
      s.classList.toggle("lit", +s.dataset.sv <= n);
    });
  }
}

/* ============================================================
    ThankYouModal
    ============================================================ */
class ThankYouModal {
  show() {
    document.getElementById("tyModal").classList.add("on");
    document.body.style.overflow = "hidden";
  }

  hide() {
    document.getElementById("tyModal").classList.remove("on");
    document.body.style.overflow = "";
    // Return to step 1
    window.App.stepper.goTo(2, null);
    window.location.href = "/index.html";
  }
}

/* ============================================================
    ModelSelector — handles hero model radio + unlocks benefit rows
    ============================================================ */
class ModelSelector {
  constructor() {
    this.options = document.querySelectorAll(".model-row");
  }
  select(row) {
    document
      .querySelectorAll("#heroModelList .model-row")
      .forEach((r) => r.classList.remove("sel"));
    row.classList.add("sel");
    const idx = parseInt(row.dataset.mi) || 0;
    const b = CONFIG.modelBenefits[idx] || CONFIG.modelBenefits[0];
    const fmt = (n) => "₹" + n.toLocaleString("en-IN");
    const rt = document.getElementById("benefitRoadTax");
    const gd = document.getElementById("benefitGreenDiscount");
    // if (rt) rt.innerHTML = `<span class="unlocked-val">${fmt(b.roadTax)}*</span>`;
    // if (gd) gd.innerHTML = `<span class="unlocked-val">${fmt(b.greenDiscount)}*</span>`;
  }

  addLink() {
    this.options.forEach((option) => {
      option.addEventListener("click", () => {
        window.location.href = "/preferred_dealer.html?step=4&sub=centre";
      });
    });
  }

  init() {
    const sel = document.querySelector("#heroModelList .model-row.sel");
    this.addLink();
    if (sel) this.select(sel);
  }
}

/* ============================================================
    BlogCarousel — main 3-col carousel with 2s auto-rotate
    ============================================================ */
class BlogCarousel {
  constructor() {
    this.track = document.getElementById("blogTrack");
    this.dotsEl = document.getElementById("blogDots");
    this.slides = [];
    this.current = 0;
    this.perView = 3;
    this.timer = null;
  }

  init() {
    if (!this.track) return;
    this.slides = Array.from(this.track.querySelectorAll(".blog-slide"));
    this._updatePerView();
    this._goto(0);
    this._startAuto();
    if (this.dotsEl) {
      this.dotsEl.querySelectorAll(".c-dot").forEach((d) => {
        d.addEventListener("click", () => this._goto(parseInt(d.dataset.bdi)));
      });
    }
    window.addEventListener("resize", () => {
      this._updatePerView();
      this._goto(this.current);
    });
  }

  _updatePerView() {
    const w = window.innerWidth;
    this.perView = w < 576 ? 1 : w < 992 ? 2 : 3;
  }

  _goto(idx) {
    const max = Math.max(0, this.slides.length - this.perView);
    this.current = Math.min(Math.max(idx, 0), max);

    const outerW = this.track.parentElement.offsetWidth;
    const GAP = 16; // 1rem gap
    const slideW = (outerW - GAP * (this.perView - 1)) / this.perView;
    this.slides.forEach((s) => {
      s.style.minWidth = slideW + "px";
      s.style.width = slideW + "px";
    });
    this.track.style.transform = `translateX(-${this.current * (slideW + GAP)}px)`;

    if (this.dotsEl) {
      this.dotsEl
        .querySelectorAll(".c-dot")
        .forEach((d, i) => d.classList.toggle("on", i === this.current));
    }
  }

  _startAuto() {
    this.timer = setInterval(() => {
      const maxIdx = Math.max(0, this.slides.length - this.perView);
      this._goto(this.current >= maxIdx ? 0 : this.current + 1);
    }, 2000);
  }
}

/* ============================================================
    SidebarBlogCarousel — 1-card mini carousel for sidebar
    ============================================================ */
class SidebarBlogCarousel {
  constructor() {
    this.current = 0;
    this.timer = null;
  }

  init() {
    this._render();
    this._startAuto();
    document.querySelectorAll(".sidebar-c-dot").forEach((d) => {
      d.addEventListener("click", () => {
        this.current = parseInt(d.dataset.sbi);
        this._render();
      });
    });
  }

  _render() {
    const b = CONFIG.blogs[this.current];
    const el = document.getElementById("sbBlogCard");
    if (!el || !b) return;
    el.innerHTML = `
        <img src="${b.img}" alt="Blog" class="sb-blog-img">
        <div class="sb-blog-body">
          <p class="sb-blog-title">${b.title}</p>
          <p class="sb-blog-date">${b.date}</p>
        </div>`;
    document
      .querySelectorAll(".sidebar-c-dot")
      .forEach((d, i) => d.classList.toggle("on", i === this.current));
  }

  _startAuto() {
    this.timer = setInterval(() => {
      this.current = (this.current + 1) % CONFIG.blogs.length;
      this._render();
    }, 2000);
  }
}

class LanguageModal {
  init() {
    this._startAuto();
  }
  _startAuto() {
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
  }
}

/* ============================================================
    VehicleAssessmentApp — wires all classes together
    ============================================================ */
class VehicleAssessmentApp {
  init() {
    this.stepper = new Stepper();
    this.toggle = new ToggleGroup();
    this.radio = new RadioGroup();
    this.otp = new OTPHandler();
    this.terms = new TermsCheckbox();
    this.dealers = new DealerSelector();
    this.faq = new FAQAccordion();
    this.rating = new StarRating();
    this.modal = new ThankYouModal();
    this.modelSel = new ModelSelector();
    this.blogMain = new BlogCarousel();
    this.blogSide = new SidebarBlogCarousel();
    this.languageModal = new LanguageModal();

    // init
    this.stepper.init();
    this.toggle.init();
    this.radio.init();
    this.otp.init();
    this.terms.init();
    this.dealers.init();
    this.faq.init();
    this.rating.init();
    this.modelSel.init();
    this.blogMain.init();
    this.blogSide.init();
    this.languageModal.init();
  }
}

/* ============================================================
    Init — entry point, boots on DOMContentLoaded
    ============================================================ */
class Init {
  static boot() {
    window.App = new VehicleAssessmentApp();
    App.init();

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("#auth_btn");

      if (!btn) return;

      const activeFlow = localStorage.getItem("flow-selected");

      if (activeFlow === "SCRAP") {
        window.location.href = "/scrap_resale_value.html?step=4&sub=value";
      } else {
        window.location.href = "/estimate_resale_value.html?step=4&sub=value";
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => Init.boot());
