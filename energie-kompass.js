/* =========================================================
   ENERGIE-TANKEN.net — Energie-Kompass (FINAL REPAIR)
   - Step Flow 1..7
   - Keine „Badge/Bla“-Texte mehr
   - Ergebnis: "Dein Energie-Level liegt bei X%"
   - CTA erst nach Auswertung: Logo im Ring + Kontakt-Button
   - Reset funktioniert immer (auch nach Auswertung)
   ========================================================= */

(function () {
  "use strict";

  const form = document.getElementById("compassForm");
  if (!form) return;

  // ===== Refs (HTML IDs müssen existieren) =====
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
  const tinyNote = document.getElementById("tinyNote");
  const contactBtn = document.getElementById("contactBtn");

  const blocks = Array.from(form.querySelectorAll(".qblock[data-step]"))
    .sort((a, b) => Number(a.dataset.step) - Number(b.dataset.step));

  const QUESTIONS = blocks.length || 7;
  const MAX_PER_Q = 4;

  // ===== Ring geometry =====
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

  // ===== CTA handling (OHNE clone/replace!) =====
  function getRingCta() {
    return document.getElementById("ringCta");
  }

  function hideCTA() {
    const cta = getRingCta();
    if (cta) cta.style.display = "none";
    if (contactBtn) contactBtn.style.display = "none";
  }

  function showCTA() {
    const cta = getRingCta();
    if (cta) cta.style.display = "flex";
    if (contactBtn) contactBtn.style.display = "inline-flex";
  }

  // ===== Step control =====
  function currentStep() {
    return Number(stepNow?.textContent || "1");
  }

  function setStep(n) {
    const step = Math.max(1, Math.min(QUESTIONS, n));

    blocks.forEach((b) => {
      const s = Number(b.dataset.step);
      b.style.display = (s === step) ? "block" : "none";
    });

    if (stepNow) stepNow.textContent = String(step);

    const atEnd = step === QUESTIONS;

    if (backBtn) backBtn.disabled = step === 1;
    if (nextBtn) nextBtn.style.display = atEnd ? "none" : "inline-flex";
    if (evalBtn) evalBtn.style.display = atEnd ? "inline-flex" : "none";
    if (tinyNote) tinyNote.style.display = "block";

    // Ruhige Guidance
    if (scoreSub) {
      scoreSub.textContent = atEnd
        ? "Alles beantwortet. Jetzt auswerten."
        : "Beantworte die Frage – dann geht’s weiter.";
    }

    // Fokus auf erste Option
    const firstInput = blocks
      .find(b => Number(b.dataset.step) === step)
      ?.querySelector('input[type="radio"]');

    if (firstInput) {
      try { firstInput.focus({ preventScroll: true }); } catch (_) {}
    }

    // Scroll zur Form (mobil)
    try { form.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) {}
  }

  function stepAnswered(step) {
    const block = blocks.find(b => Number(b.dataset.step) === step);
    if (!block) return false;
    return !!block.querySelector('input[type="radio"]:checked');
  }

  function nextStep() {
    const s = currentStep();
    if (!stepAnswered(s)) {
      if (scoreSub) scoreSub.textContent = "Bitte wähle eine Antwort, dann geht’s weiter.";
      return;
    }
    setStep(Math.min(QUESTIONS, s + 1));
  }

  function prevStep() {
    const s = currentStep();
    setStep(Math.max(1, s - 1));
  }

  // ===== Score =====
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

  // ===== UI Reset =====
  function resetUI() {
    setRing(0);

    // Du wolltest: keine Labels wie stabil/top etc.
    if (scoreBadge) scoreBadge.textContent = "Energie-Tanken";

    if (scoreNum) scoreNum.textContent = "—%";

    if (resultCopy) {
      resultCopy.style.display = "none";
      resultCopy.textContent = "";
    }

    hideCTA();

    if (scoreSub) scoreSub.textContent = "Starte mit Frage 1 – danach geht’s Schritt für Schritt weiter.";

    // Buttons zurücksetzen
    if (nextBtn) nextBtn.style.display = "inline-flex";
    if (evalBtn) evalBtn.style.display = "none";
  }

  // ===== Auto-advance on radio selection =====
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

  // ===== Buttons =====
  if (nextBtn) nextBtn.addEventListener("click", nextStep);
  if (backBtn) backBtn.addEventListener("click", prevStep);

  // Kontakt Button
  if (contactBtn) {
    contactBtn.addEventListener("click", () => {
      window.location.href = "kontakt.html";
    });
  }

  // ===== Auswertung =====
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // check all answered -> wenn nicht, spring zur ersten offenen
    for (let i = 1; i <= QUESTIONS; i++) {
      if (!form.querySelector(`input[name="q${i}"]:checked`)) {
        setStep(i);
        if (scoreSub) scoreSub.textContent = "Bitte beantworte diese Frage, dann auswerten.";
        return;
      }
    }

    const score = readScorePercent();
    if (score === null) {
      if (scoreSub) scoreSub.textContent = "Bitte beantworte alle Fragen, dann bekommst du deine Skala.";
      return;
    }

    setRing(score);

    // Dein Wunsch: NUR dieser Satz
    if (scoreNum) scoreNum.textContent = `Dein Energie-Level liegt bei ${score}%`;

    if (scoreBadge) scoreBadge.textContent = "Energie-Tanken";

    if (resultCopy) {
      resultCopy.style.display = "block";
      resultCopy.textContent = "Wenn du Hochfrequenzenergie selbst spüren möchtest, nimm Kontakt auf.";
    }

    showCTA();

    // scroll zur Skala
    const gaugeCard = document.querySelector(".card.gauge");
    if (gaugeCard) {
      try { gaugeCard.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) {}
    }
  });

  // ===== Reset =====
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      form.reset();
      resetUI();
      setStep(1);
    });
  }

  // ===== Init =====
  initRing();
  resetUI();

  // Safety: falls CSS/HTML irgendwas anzeigt -> hart auf Step 1 setzen
  blocks.forEach((b) => (b.style.display = "none"));
  setStep(1);

})();
