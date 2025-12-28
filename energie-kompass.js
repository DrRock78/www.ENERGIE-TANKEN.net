/* =========================================================
   ENERGIE-TANKEN.net — Energie-Kompass (STEP FLOW) — FINAL
   - Fragen erscheinen nacheinander (1 -> 7)
   - „Auswerten“ nur, wenn wirklich ALLE Fragen beantwortet sind
   - Kein widersprüchlicher Zustand (letzte Frage vs Auswertung)
   - CTA (Logo im Ring) erst nach Auswertung
   - Reset setzt alles sauber zurück
   ========================================================= */

(function () {
  "use strict";

  const form = document.getElementById("compassForm");
  if (!form) return;

  // UI elements
  const ringBar = document.getElementById("ringBar");
  const scoreNum = document.getElementById("scoreNum");
  const scoreBadge = document.getElementById("scoreBadge");
  const scoreSub = document.getElementById("scoreSub");
  const resultCopy = document.getElementById("resultCopy");

  const stepNow = document.getElementById("stepNow");

  const backBtn = document.getElementById("backBtn");
  const nextBtn = document.getElementById("nextBtn");
  const evalBtn = document.getElementById("evalBtn");
  const resetBtn = document.getElementById("resetBtn");

  // Question blocks
  const blocks = Array.from(form.querySelectorAll(".qblock[data-step]"))
    .sort((a, b) => Number(a.dataset.step) - Number(b.dataset.step));

  const QUESTIONS = blocks.length; // expected 7
  const MAX_PER_Q = 4;

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

  function bucket(percent) {
    if (percent < 30) {
      return {
        badge: "niedrig",
        text: "Im Moment wirkt dein Akku eher leer. Wenn du Schlaf und Trinken stabilisierst, kippt das schnell ins Positive."
      };
    }
    if (percent < 55) {
      return {
        badge: "stabil",
        text: "Du hast eine Basis. Zwei kleine Gewohnheiten konsequent – und du merkst den Unterschied in wenigen Tagen."
      };
    }
    if (percent < 75) {
      return {
        badge: "gut",
        text: "Du bist gut unterwegs. Mit Rhythmus und Bewegung wird daraus zuverlässig Energie, die bleibt."
      };
    }
    if (percent < 90) {
      return {
        badge: "sehr gut",
        text: "Sehr solide. Jetzt entscheidet Konstanz: Timing, Pausen, echte Regeneration."
      };
    }
    return {
      badge: "top",
      text: "Starke Reserve. Du hast ein Energie-Level, das viele nicht stabil halten – bleib bei deinem System."
    };
  }

  // ---------- State helpers ----------
  function currentStep() {
    return Number(stepNow?.textContent || "1");
  }

  function setStepNumber(n) {
    if (stepNow) stepNow.textContent = String(n);
  }

  function blockForStep(step) {
    return blocks.find(b => Number(b.dataset.step) === step) || null;
  }

  function isStepAnswered(step) {
    const block = blockForStep(step);
    if (!block) return false;
    return !!block.querySelector('input[type="radio"]:checked');
  }

  function allAnswered() {
    // reliable check across the whole form
    const data = new FormData(form);
    for (let i = 1; i <= QUESTIONS; i++) {
      const v = data.get("q" + i);
      if (v === null) return false;
      if (v === "") return false;
    }
    return true;
  }

  function readScorePercent() {
    const data = new FormData(form);
    let sum = 0;

    for (let i = 1; i <= QUESTIONS; i++) {
      const v = data.get("q" + i);
      if (v === null || v === "") return null;
      const n = Number(v);
      if (!Number.isFinite(n)) return null;
      sum += n;
    }

    const max = QUESTIONS * MAX_PER_Q;
    return Math.round((sum / max) * 100);
  }

  // ---------- CTA handling ----------
  function hideCTA() {
    const cta = document.getElementById("ringCta");
    if (!cta) return;
    cta.style.display = "none";
    // kill old listeners safely
    cta.replaceWith(cta.cloneNode(true));
  }

  function showCTA() {
    const cta = document.getElementById("ringCta");
    if (!cta) return;
    cta.style.display = "flex";
    // No JS redirect needed: href in HTML is enough.
    // Keeping once-listener just to avoid accidental double-binding in the future.
    cta.addEventListener("click", () => {}, { once: true });
  }

  // ---------- UI sync ----------
  function syncButtons(step) {
    const atEnd = step === QUESTIONS;

    // Back enabled except at step 1
    if (backBtn) backBtn.disabled = step <= 1;

    // If not at end: show Next, hide Evaluate
    if (!atEnd) {
      if (nextBtn) nextBtn.style.display = "inline-flex";
      if (evalBtn) evalBtn.style.display = "none";
      return;
    }

    // At end: show Evaluate only if ALL answered
    if (nextBtn) nextBtn.style.display = "none";
    if (evalBtn) evalBtn.style.display = allAnswered() ? "inline-flex" : "none";
  }

  function syncSubtext(step) {
    if (!scoreSub) return;

    if (step < QUESTIONS) {
      scoreSub.textContent = "Beantworte die Frage – dann kommt die nächste.";
      return;
    }

    // Step === last question
    if (allAnswered()) {
      scoreSub.textContent = "Alles beantwortet. Jetzt auswerten.";
    } else {
      scoreSub.textContent = "Bitte beantworte auch die letzte Frage, dann auswerten.";
    }
  }

  function setStep(step) {
    const s = Math.max(1, Math.min(QUESTIONS, step));

    blocks.forEach((b) => {
      const n = Number(b.dataset.step);
      b.style.display = (n === s) ? "block" : "none";
    });

    setStepNumber(s);
    syncButtons(s);
    syncSubtext(s);

    // Smooth scroll to top of form card
    try { form.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) {}
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
  }

  // ---------- Navigation ----------
  function goNext() {
    const s = currentStep();
    if (!isStepAnswered(s)) {
      if (scoreSub) scoreSub.textContent = "Bitte wähle eine Antwort, dann geht’s weiter.";
      return;
    }
    setStep(Math.min(QUESTIONS, s + 1));
  }

  function goPrev() {
    const s = currentStep();
    setStep(Math.max(1, s - 1));
  }

  // ---------- Events ----------
  // Auto advance when radio selected (except last question)
  form.addEventListener("change", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;
    if (t.type !== "radio") return;

    const num = Number(String(t.name).replace("q", ""));
    if (!Number.isFinite(num)) return;

    const s = currentStep();
    if (num !== s) return;

    if (s < QUESTIONS) {
      setStep(s + 1);
      return;
    }

    // last step: just sync UI (no auto submit)
    syncButtons(s);
    syncSubtext(s);
  });

  if (nextBtn) nextBtn.addEventListener("click", goNext);
  if (backBtn) backBtn.addEventListener("click", goPrev);

  // Evaluate
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!allAnswered()) {
      if (scoreSub) scoreSub.textContent = "Bitte beantworte alle Fragen, dann auswerten.";
      // ensure we're on last step so user sees it
      setStep(QUESTIONS);
      return;
    }

    const score = readScorePercent();
    if (score === null) {
      if (scoreSub) scoreSub.textContent = "Bitte beantworte alle Fragen, dann bekommst du deine Skala.";
      setStep(QUESTIONS);
      return;
    }

    setRing(score);
    if (scoreNum) scoreNum.textContent = score + "%";

    const b = bucket(score);
    if (scoreBadge) scoreBadge.textContent = b.badge;

    if (resultCopy) {
      resultCopy.style.display = "block";
      resultCopy.textContent =
        b.text + " Wenn du Hochfrequenzenergie selbst spüren möchtest, nimm Kontakt auf.";
    }

    showCTA();

    const gaugeCard = document.querySelector(".card.gauge");
    if (gaugeCard) {
      try { gaugeCard.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) {}
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

  // ---------- Init ----------
  initRing();
  resetUI();
  setStep(1);
})();
