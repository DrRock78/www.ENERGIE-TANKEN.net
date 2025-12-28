/* =========================================================
   ENERGIE-TANKEN.net — Energie-Kompass (FINAL)
   - 1 Frage sichtbar, Step-Flow sauber
   - Weiter nur wenn beantwortet
   - Auswerten nur am Ende
   - Ergebnis: "Dein Energie-Level liegt bei X%"
   - CTA Logo zentriert im Ring -> kontakt.html
   - Reset immer möglich, Kompass neu startbar
   ========================================================= */

(function () {
  "use strict";

  const form = document.getElementById("compassForm");
  if (!form) return;

  const stepNow = document.getElementById("stepNow");
  const backBtn = document.getElementById("backBtn");
  const nextBtn = document.getElementById("nextBtn");
  const evalBtn = document.getElementById("evalBtn");
  const resetBtn = document.getElementById("resetBtn");

  const ringBar = document.getElementById("ringBar");
  const ringCta = document.getElementById("ringCta");

  const scoreSub = document.getElementById("scoreSub");
  const scoreLine = document.getElementById("scoreLine");
  const resultCopy = document.getElementById("resultCopy");

  const blocks = Array.from(form.querySelectorAll(".ek-qblock[data-step]"))
    .sort((a, b) => Number(a.dataset.step) - Number(b.dataset.step));

  const QUESTIONS = blocks.length;  // 7
  const MAX_PER_Q = 4;             // 0..4

  // Ring geometry
  const r = 46;
  const circumference = 2 * Math.PI * r;

  function initRing() {
    if (!ringBar) return;
    ringBar.style.strokeDasharray = `0 ${circumference}`;
    ringBar.style.strokeDashoffset = "0";
  }

  function setRing(percent) {
    if (!ringBar) return;
    const p = Math.max(0, Math.min(100, percent));
    const dash = (p / 100) * circumference;
    ringBar.style.strokeDasharray = `${dash} ${circumference - dash}`;
  }

  function showBlock(step) {
    blocks.forEach(b => {
      const s = Number(b.dataset.step);
      b.classList.toggle("is-active", s === step);
    });
  }

  function currentStep() {
    const n = Number(stepNow?.textContent || "1");
    return Number.isFinite(n) ? n : 1;
  }

  function setStep(step) {
    const s = Math.max(1, Math.min(QUESTIONS, step));
    if (stepNow) stepNow.textContent = String(s);

    showBlock(s);

    // Buttons state
    if (backBtn) backBtn.disabled = s === 1;

    const atEnd = s === QUESTIONS;
    if (nextBtn) nextBtn.style.display = atEnd ? "none" : "inline-flex";
    if (evalBtn) evalBtn.style.display = atEnd ? "inline-flex" : "none";

    if (scoreSub) {
      scoreSub.textContent = atEnd
        ? "Letzte Frage. Danach auswerten."
        : "Beantworte die Frage – dann weiter.";
    }

    // focus first input for the step
    const block = blocks.find(b => Number(b.dataset.step) === s);
    const first = block ? block.querySelector('input[type="radio"]') : null;
    if (first) {
      try { first.focus({ preventScroll: true }); } catch (_) {}
    }

    // keep it clean on mobile
    try { form.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) {}
  }

  function stepAnswered(step) {
    const block = blocks.find(b => Number(b.dataset.step) === step);
    if (!block) return false;
    return !!block.querySelector('input[type="radio"]:checked');
  }

  function readScorePercent() {
    const data = new FormData(form);
    let sum = 0;

    for (let i = 1; i <= QUESTIONS; i++) {
      const v = data.get("q" + i);
      if (v === null) return null;
      const n = Number(v);
      if (!Number.isFinite(n)) return null;
      sum += n;
    }

    const max = QUESTIONS * MAX_PER_Q;
    return Math.round((sum / max) * 100);
  }

  function hideCTA() {
    if (!ringCta) return;
    ringCta.style.display = "none";
  }

  function showCTA() {
    if (!ringCta) return;
    ringCta.style.display = "flex";
  }

  function resetUI() {
    setRing(0);
    hideCTA();
    if (scoreLine) scoreLine.textContent = "Dein Energie-Level liegt bei —%";
    if (resultCopy) resultCopy.style.display = "none";
    if (scoreSub) scoreSub.textContent = "Starte mit Frage 1.";
  }

  function nextStep() {
    const s = currentStep();
    if (!stepAnswered(s)) {
      if (scoreSub) scoreSub.textContent = "Bitte wähle eine Antwort, dann weiter.";
      return;
    }
    setStep(Math.min(QUESTIONS, s + 1));
  }

  function prevStep() {
    const s = currentStep();
    setStep(Math.max(1, s - 1));
  }

  // Auto-advance on selection (optional smoothness)
  form.addEventListener("change", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;
    if (t.type !== "radio") return;

    const name = t.name; // q1..q7
    const num = Number(name.replace("q", ""));
    if (!Number.isFinite(num)) return;

    const s = currentStep();
    if (num !== s) return;

    if (s < QUESTIONS) {
      setStep(s + 1);
    } else {
      if (scoreSub) scoreSub.textContent = "Alles beantwortet. Jetzt auswerten.";
      if (nextBtn) nextBtn.style.display = "none";
      if (evalBtn) evalBtn.style.display = "inline-flex";
    }
  });

  // Buttons
  if (nextBtn) nextBtn.addEventListener("click", nextStep);
  if (backBtn) backBtn.addEventListener("click", prevStep);

  // Submit / Auswertung
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Ensure everything answered
    for (let i = 1; i <= QUESTIONS; i++) {
      if (!stepAnswered(i)) {
        setStep(i);
        if (scoreSub) scoreSub.textContent = "Bitte beantworte diese Frage, dann auswerten.";
        return;
      }
    }

    const score = readScorePercent();
    if (score === null) {
      if (scoreSub) scoreSub.textContent = "Bitte beantworte alle Fragen, dann auswerten.";
      return;
    }

    setRing(score);
    showCTA();

    if (scoreLine) scoreLine.textContent = `Dein Energie-Level liegt bei ${score}%`;
    if (resultCopy) resultCopy.style.display = "block";

    // scroll to result card (ring)
    const ringWrap = document.querySelector(".ek-gauge-card");
    if (ringWrap) {
      try { ringWrap.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) {}
    }
  });

  // Reset
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      form.reset();
      resetUI();
      setStep(1);
    });
  }

  // Init
  initRing();
  resetUI();
  setStep(1);
})();
