/* =========================================================
   ENERGIE-TANKEN.net — Energie-Kompass (FINAL)
   - CTA erscheint als klickbares Logo in der Mitte der Skala
   - keine Ablenkung zwischendurch, CTA erst NACH Auswertung
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

  const evalBtn = document.getElementById("evalBtn");
  const resetBtn = document.getElementById("resetBtn");

  const ringCta = document.getElementById("ringCta");

  // --- Ring geometry ---
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

  // --- scoring ---
  const QUESTIONS = 7;
  const MAX_PER_Q = 4;

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

  function bucket(percent) {
    // Ton: klar, ruhig, nicht “Befehle”, nicht “Gelaber”
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

  function showCTA() {
    if (!ringCta) return;
    ringCta.style.display = "flex";
    ringCta.addEventListener("click", () => {
      window.location.href = "kontakt.html";
    }, { once: true });
  }

  function hideCTA() {
    if (!ringCta) return;
    ringCta.style.display = "none";
  }

  function resetUI() {
    setRing(0);
    if (scoreNum) scoreNum.textContent = "—%";
    if (scoreBadge) scoreBadge.textContent = "bereit";
    if (scoreSub) scoreSub.textContent = "Beantworte die Fragen – danach erscheint deine Skala.";
    if (resultCopy) {
      resultCopy.style.display = "none";
      resultCopy.textContent = "";
    }
    hideCTA();
  }

  function showResult(percent) {
    const p = Math.max(0, Math.min(100, percent));

    setRing(p);
    if (scoreNum) scoreNum.textContent = p + "%";

    const b = bucket(p);
    if (scoreBadge) scoreBadge.textContent = b.badge;

    if (scoreSub) scoreSub.textContent = "Dein Ergebnis ist ein Orientierungswert – und zeigt dir, wo du gerade stehst.";
    if (resultCopy) {
      resultCopy.style.display = "block";
      resultCopy.textContent = b.text + " Wenn du Hochfrequenzenergie selbst spüren möchtest, nimm Kontakt auf.";
    }

    showCTA();

    // Auf Skala scrollen (mobile)
    const gaugeCard = document.querySelector(".card.gauge");
    if (gaugeCard) {
      try { gaugeCard.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) {}
    }
  }

  // --- events ---
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const score = readScorePercent();
    if (score === null) {
      if (scoreSub) scoreSub.textContent = "Bitte beantworte alle Fragen, dann bekommst du deine Skala.";
      return;
    }

    showResult(score);
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      form.reset();
      resetUI();
    });
  }

  if (evalBtn) {
    evalBtn.addEventListener("click", () => {
      // submit handled by form listener
    });
  }

  // init
  initRing();
  resetUI();
})();
