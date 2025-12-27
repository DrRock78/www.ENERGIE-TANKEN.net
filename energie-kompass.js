/* =========================================================
   ENERGIE-TANKEN.net — Energie-Kompass (STEP FLOW)
   - Fragen erscheinen nacheinander (1 -> 7)
   - Auswerten erst am Ende
   - CTA als Logo im Ring erst nach Auswertung
   ========================================================= */

(function () {
  "use strict";

  const form = document.getElementById("compassForm");
  if (!form) return;

  const ringBar = document.getElementById("ringBar");
  const scoreNum = document.getElementById("scoreNum");
  const scoreBadge = document.getElementById("scoreBadge");
  const scoreSub = document.getElementById("scoreSub");
  const resultCopy = document.getElementById("resultCopy");

  const ringCta = document.getElementById("ringCta");

  const actionsRow = document.getElementById("actionsRow");
  const resetBtn = document.getElementById("resetBtn");
  const tinyNote = document.getElementById("tinyNote");

  const stepNow = document.getElementById("stepNow");

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
    if (!ringCta) return;
    ringCta.style.display = "none";
    ringCta.replaceWith(ringCta.cloneNode(true)); // remove old listeners
  }

  function showCTA() {
    const btn = document.getElementById("ringCta");
    if (!btn) return;
    btn.style.display = "flex";
    btn.addEventListener("click", () => {
      window.location.href = "kontakt.html";
    }, { once: true });
  }

  function bucket(percent) {
    if (percent < 30) {
      return { badge: "niedrig", text: "Im Moment wirkt dein Akku eher leer. Wenn du Schlaf und Trinken stabilisierst, kippt das schnell ins Positive." };
    }
    if (percent < 55) {
      return { badge: "stabil", text: "Du hast eine Basis. Zwei kleine Gewohnheiten konsequent – und du merkst den Unterschied in wenigen Tagen." };
    }
    if (percent < 75) {
      return { badge: "gut", text: "Du bist gut unterwegs. Mit Rhythmus und Bewegung wird daraus zuverlässig Energie, die bleibt." };
    }
    if (percent < 90) {
      return { badge: "sehr gut", text: "Sehr solide. Jetzt entscheidet Konstanz: Timing, Pausen, echte Regeneration." };
    }
    return { badge: "top", text: "Starke Reserve. Du hast ein Energie-Level, das viele nicht stabil halten – bleib bei deinem System." };
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

  function setStep(n) {
    const step = Math.max(1, Math.min(QUESTIONS, n));

    blocks.forEach((b) => {
      const s = Number(b.dataset.step);
      b.style.display = (s === step) ? "block" : "none";
    });

    if (stepNow) stepNow.textContent = String(step);

    // Buttons only at end
    const atEnd = step === QUESTIONS;
    if (actionsRow) actionsRow.style.display = atEnd ? "flex" : "none";
    if (tinyNote) tinyNote.style.display = atEnd ? "block" : "none";

    // small guidance
    if (scoreSub) {
      scoreSub.textContent = atEnd
        ? "Letzte Frage. Danach bekommst du deine Skala."
        : "Beantworte die Frage – dann kommt die nächste.";
    }

    // focus first option for accessibility
    const firstInput = blocks.find(b => Number(b.dataset.step) === step)?.querySelector('input[type="radio"]');
    if (firstInput) {
      try { firstInput.focus({ preventScroll: true }); } catch (_) {}
    }
  }

  function nextStep() {
    const current = Number(stepNow?.textContent || "1");
    const n = Math.min(QUESTIONS, current + 1);
    setStep(n);

    // scroll to top of form card smoothly
    try {
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (_) {}
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

  // Auto-advance when a radio is chosen
  form.addEventListener("change", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;
    if (t.type !== "radio") return;

    const name = t.name; // q1..q7
    const num = Number(name.replace("q", ""));
    if (!Number.isFinite(num)) return;

    // Only advance if current step answered
    const current = Number(stepNow?.textContent || "1");
    if (num !== current) return;

    // If not last step, advance
    if (current < QUESTIONS) {
      nextStep();
    } else {
      // last step answered -> show buttons (already shown by setStep)
      if (scoreSub) scoreSub.textContent = "Alles beantwortet. Jetzt auswerten.";
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

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

    // scroll to gauge
    const gaugeCard = document.querySelector(".card.gauge");
    if (gaugeCard) {
      try { gaugeCard.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) {}
    }
  });

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
