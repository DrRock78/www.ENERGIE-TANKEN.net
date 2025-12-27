/* =========================================================
   ENERGIE-TANKEN.net — Energie-Kompass (BUTTON FLOW)
   - Schrittweise 1 -> 7 mit Zurück/Weiter
   - Auswerten erscheint erst am Ende
   - Ring-CTA + Kontaktbutton erst nach Auswertung
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

  const actionsRow = document.getElementById("actionsRow");
  const backBtn = document.getElementById("backBtn");
  const nextBtn = document.getElementById("nextBtn");
  const evalBtn = document.getElementById("evalBtn");
  const resetBtn = document.getElementById("resetBtn");
  const tinyNote = document.getElementById("tinyNote");

  const blocks = Array.from(form.querySelectorAll(".qblock[data-step]"))
    .sort((a, b) => Number(a.dataset.step) - Number(b.dataset.step));

  const QUESTIONS = blocks.length; // 7
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

  function hideCTA() {
    if (ringCta) ringCta.style.display = "none";
    if (contactBtn) contactBtn.style.display = "none";
  }

  function showCTA() {
    // Ring-CTA (Logo)
    if (ringCta) ringCta.style.display = "flex";

    // Extra Button unten
    if (contactBtn) {
      contactBtn.style.display = "inline-flex";
      contactBtn.onclick = () => (window.location.href = "kontakt.html");
    }
  }

  function bucket(percent) {
    if (percent < 30) {
      return {
        badge: "niedrig",
        text: "Im Moment wirkt dein Akku eher leer. Wenn du Schlaf und Trinken stabilisierst, kippt das schnell ins Positive.",
      };
    }
    if (percent < 55) {
      return {
        badge: "stabil",
        text: "Du hast eine Basis. Zwei kleine Gewohnheiten konsequent – und du merkst den Unterschied in wenigen Tagen.",
      };
    }
    if (percent < 75) {
      return {
        badge: "gut",
        text: "Du bist gut unterwegs. Mit Rhythmus und Bewegung wird daraus zuverlässig Energie, die bleibt.",
      };
    }
    if (percent < 90) {
      return {
        badge: "sehr gut",
        text: "Sehr solide. Jetzt entscheidet Konstanz: Timing, Pausen, echte Regeneration.",
      };
    }
    return {
      badge: "top",
      text: "Starke Reserve. Du hast ein Energie-Level, das viele nicht stabil halten – bleib bei deinem System.",
    };
  }

  function getCurrentStep() {
    return Number(stepNow?.textContent || "1") || 1;
  }

  function isStepAnswered(step) {
    const q = form.querySelector(`input[name="q${step}"]:checked`);
    return !!q;
  }

  function setButtonsForStep(step) {
    // Back only from step 2+
    if (backBtn) backBtn.disabled = step <= 1;

    // Eval only at last step
    const atEnd = step === QUESTIONS;

    if (evalBtn) evalBtn.style.display = atEnd ? "inline-flex" : "none";
    if (nextBtn) nextBtn.style.display = atEnd ? "none" : "inline-flex";

    // Next disabled until answered
    if (nextBtn) nextBtn.disabled = !isStepAnswered(step);

    // Note only at end (optional)
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

    // scroll to the card top
    try {
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (_) {}
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

  function evaluate() {
    const score = readScorePercent();
    if (score === null) {
      if (scoreSub)
        scoreSub.textContent =
          "Bitte beantworte alle Fragen, dann bekommst du deine Skala.";
      return;
    }

    setRing(score);

    if (scoreNum) scoreNum.textContent = score + "%";

    const b = bucket(score);
    if (scoreBadge) scoreBadge.textContent = b.badge;

    if (resultCopy) {
      resultCopy.style.display = "block";
      resultCopy.textContent =
        b.text +
        " Wenn du Hochfrequenzenergie selbst spüren möchtest, nimm Kontakt auf.";
    }

    showCTA();

    // scroll to gauge area
    const gaugeCard = document.querySelector(".card.gauge");
    if (gaugeCard) {
      try {
        gaugeCard.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (_) {}
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

    if (scoreSub)
      scoreSub.textContent =
        "Starte mit Frage 1 – danach geht’s Schritt für Schritt weiter.";

    setButtonsForStep(1);
  }

  // When a radio is selected: enable Next; optionally auto-advance (not on last step)
  form.addEventListener("change", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;
    if (t.type !== "radio") return;

    const step = getCurrentStep();
    setButtonsForStep(step);

    // Optional: auto-advance for nice flow (but not last step)
    if (step < QUESTIONS) {
      // Tiny delay so selection feels responsive
      setTimeout(() => setStep(step + 1), 120);
    } else {
      if (scoreSub) scoreSub.textContent = "Alles beantwortet. Jetzt auswerten.";
    }
  });

  // Back / Next buttons
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      const step = getCurrentStep();
      setStep(step - 1);
    });
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

  // Submit (Auswerten)
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
  resetUI();
  setStep(1);
})();
