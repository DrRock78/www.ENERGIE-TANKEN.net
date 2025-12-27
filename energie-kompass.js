/* =========================================================
   ENERGIE-TANKEN.net — Energie-Kompass (HARDENED)
   Fixes:
   - Score wird zuverlässig aus :checked gelesen (kein FormData-Zicken)
   - CTA im Ring wirklich erst nach Auswertung
   - Buttons/Flow stabil
   ========================================================= */

(function () {
  "use strict";

  const form = document.getElementById("compassForm");
  if (!form) return;

  const stepNow = document.getElementById("stepNow");

  const ringBar = document.getElementById("ringBar");
  const scoreNum = document.getElementById("scoreNum");
  const scoreBadge = document.getElementById("scoreBadge");
  const scoreSub = document.getElementById("scoreSub");
  const resultCopy = document.getElementById("resultCopy");

  const ringCta = document.getElementById("ringCta");
  const contactBtn = document.getElementById("contactBtn");

  const backBtn = document.getElementById("backBtn");
  const nextBtn = document.getElementById("nextBtn");
  const evalBtn = document.getElementById("evalBtn");
  const resetBtn = document.getElementById("resetBtn");

  const tinyNote = document.getElementById("tinyNote");

  const blocks = Array.from(form.querySelectorAll(".qblock[data-step]"))
    .sort((a, b) => Number(a.dataset.step) - Number(b.dataset.step));

  const QUESTIONS = blocks.length; // 7
  const MAX_PER_Q = 4; // Werte 0..4

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

  function hideCTA() {
    if (ringCta) ringCta.style.display = "none";
    if (contactBtn) contactBtn.style.display = "none";
  }

  function showCTA() {
    if (ringCta) ringCta.style.display = "flex";
    if (contactBtn) {
      contactBtn.style.display = "inline-flex";
      contactBtn.onclick = () => (window.location.href = "kontakt.html");
    }
  }

  function bucket(percent) {
    if (percent < 30) return { badge: "niedrig", text: "Im Moment wirkt dein Akku eher leer. Wenn du Schlaf und Trinken stabilisierst, kippt das schnell ins Positive." };
    if (percent < 55) return { badge: "stabil",  text: "Du hast eine Basis. Zwei kleine Gewohnheiten konsequent – und du merkst den Unterschied in wenigen Tagen." };
    if (percent < 75) return { badge: "gut",     text: "Du bist gut unterwegs. Mit Rhythmus und Bewegung wird daraus zuverlässig Energie, die bleibt." };
    if (percent < 90) return { badge: "sehr gut",text: "Sehr solide. Jetzt entscheidet Konstanz: Timing, Pausen, echte Regeneration." };
    return { badge: "top", text: "Starke Reserve. Du hast ein Energie-Level, das viele nicht stabil halten – bleib bei deinem System." };
  }

  function getCurrentStep() {
    return Number(stepNow?.textContent || "1") || 1;
  }

  function isStepAnswered(step) {
    return !!form.querySelector(`input[name="q${step}"]:checked`);
  }

  function setButtonsForStep(step) {
    const atEnd = step === QUESTIONS;

    if (backBtn) backBtn.disabled = step <= 1;

    if (evalBtn) evalBtn.style.display = atEnd ? "inline-flex" : "none";
    if (nextBtn) nextBtn.style.display = atEnd ? "none" : "inline-flex";

    if (nextBtn) nextBtn.disabled = !isStepAnswered(step);

    if (tinyNote) tinyNote.style.display = atEnd ? "block" : "none";
  }

  function setStep(step) {
    const s = Math.max(1, Math.min(QUESTIONS, step));

    blocks.forEach((b) => {
      const bs = Number(b.dataset.step);
      b.style.display = bs === s ? "block" : "none";
    });

    if (stepNow) stepNow.textContent = String(s);

    setButtonsForStep(s);

    if (scoreSub) {
      scoreSub.textContent =
        s === QUESTIONS
          ? "Letzte Frage. Danach bekommst du deine Skala."
          : "Beantworte die Frage – dann kommt die nächste.";
    }

    // scroll to top of form
    try { form.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) {}
  }

  // ✅ Robust score: read checked values directly
  function readScorePercent() {
    let sum = 0;

    for (let i = 1; i <= QUESTIONS; i++) {
      const checked = form.querySelector(`input[name="q${i}"]:checked`);
      if (!checked) return null;

      const n = Number(checked.value);
      if (!Number.isFinite(n)) return null;

      // Clamp to 0..MAX_PER_Q so no surprises
      sum += Math.max(0, Math.min(MAX_PER_Q, n));
    }

    const max = QUESTIONS * MAX_PER_Q;
    return Math.round((sum / max) * 100);
  }

  function evaluate() {
    const score = readScorePercent();
    if (score === null) {
      if (scoreSub) scoreSub.textContent = "Bitte beantworte alle Fragen, dann bekommst du deine Skala.";
      return;
    }

    setRing(score);

    if (scoreNum) scoreNum.textContent = score + "%";

    const b = bucket(score);
    if (scoreBadge) scoreBadge.textContent = b.badge;

    if (resultCopy) {
      resultCopy.style.display = "block";
      resultCopy.textContent = b.text + " Wenn du Hochfrequenzenergie selbst spüren möchtest, nimm Kontakt auf.";
    }

    showCTA();

    const gaugeCard = document.querySelector(".card.gauge");
    if (gaugeCard) {
      try { gaugeCard.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) {}
    }
  }

  function resetUI() {
    setRing(0);

    if (scoreNum) scoreNum.textContent = "—%";
    if (scoreBadge) scoreBadge.textContent = "bereit";

    if (resultCopy) {
      resultCopy.style.display = "none";
      resultCopy.textContent = "";
    }

    hideCTA();

    if (scoreSub) scoreSub.textContent = "Starte mit Frage 1 – danach geht’s Schritt für Schritt weiter.";

    setButtonsForStep(1);
  }

  // Change -> enable next; optional auto-advance
  form.addEventListener("change", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;
    if (t.type !== "radio") return;

    const step = getCurrentStep();
    setButtonsForStep(step);

    if (step < QUESTIONS) {
      setTimeout(() => setStep(step + 1), 120);
    } else {
      if (scoreSub) scoreSub.textContent = "Alles beantwortet. Jetzt auswerten.";
      // Ensure next disabled/hidden and eval shown
      setButtonsForStep(step);
    }
  });

  // Back/Next
  if (backBtn) {
    backBtn.addEventListener("click", () => setStep(getCurrentStep() - 1));
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const step = getCurrentStep();
      if (!isStepAnswered(step)) {
        if (scoreSub) scoreSub.textContent = "Bitte wähle eine Option aus.";
        return;
      }
      setStep(step + 1);
    });
  }

  // Submit = Auswerten
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    evaluate();
  });

  // Reset
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      form.reset();
      resetUI();
      setStep(1);
    });
  }

  // init
  initRing();
  hideCTA();     // ✅ hard-hide CTA at start
  resetUI();
  setStep(1);
})();
