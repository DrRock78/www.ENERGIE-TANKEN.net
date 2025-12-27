/* =========================================================
   ENERGIE-TANKEN.net — Energie-Kompass (FINAL)
   - passt 1:1 zu energie-level-messen.html
   - Werte: 0..4 pro Frage (7 Fragen)
   - Ergebnis: Prozent + Gold-Ring + Status + Text + CTA am Ende
   - Kein Popup, kein CTA zwischendurch
   ========================================================= */

(function () {
  "use strict";

  // ---------- DOM ----------
  const form = document.getElementById("compassForm");
  if (!form) return;

  const ringBar = document.getElementById("ringBar");
  const scoreNum = document.getElementById("scoreNum");
  const scoreBadge = document.getElementById("scoreBadge");
  const scoreSub = document.getElementById("scoreSub");

  const evalBtn = document.getElementById("evalBtn");
  const resetBtn = document.getElementById("resetBtn");

  const ctaBox = document.getElementById("ctaBox");
  const ctaText = document.getElementById("ctaText");

  // ---------- SVG Ring Setup ----------
  // Ring r=46 (wie im SVG)
  const r = 46;
  const circumference = 2 * Math.PI * r;

  // Grund-Styles, falls CSS nicht alles setzt
  if (ringBar) {
    ringBar.style.fill = "none";
    ringBar.style.stroke = "url(#goldGrad)";
    ringBar.style.strokeWidth = "8";
    ringBar.style.strokeLinecap = "round";
    ringBar.style.transform = "rotate(-90deg)";
    ringBar.style.transformOrigin = "60px 60px";
    ringBar.style.strokeDasharray = `0 ${circumference}`;
  }

  function setRing(percent) {
    const p = Math.max(0, Math.min(100, percent));
    const dash = (p / 100) * circumference;
    if (ringBar) ringBar.style.strokeDasharray = `${dash} ${circumference - dash}`;
  }

  // ---------- Score Logic ----------
  // 7 Fragen à 0..4 => max 28
  const QUESTIONS = 7;
  const MAX_PER_Q = 4;
  const MAX_TOTAL = QUESTIONS * MAX_PER_Q;

  function readScorePercent() {
    const data = new FormData(form);
    let sum = 0;

    for (let i = 1; i <= QUESTIONS; i++) {
      const v = data.get("q" + i);
      if (v === null) return null; // nicht vollständig beantwortet
      const n = Number(v);
      if (!Number.isFinite(n)) return null;
      sum += n;
    }

    const percent = Math.round((sum / MAX_TOTAL) * 100);
    return Math.max(0, Math.min(100, percent));
  }

  // ---------- Copy / Output (psychologisch sauber, kein “Geklapper”) ----------
  function resultBucket(percent) {
    // Klarer Output, nicht belehrend, nicht “verkaufy”, kein Meta-Gerede
    // CTA-Satz bleibt immer gleich (dein Wunsch)
    const cta = "Wenn du Hochfrequenzenergie selbst spüren möchtest, nimm Kontakt auf.";

    if (percent < 30) {
      return {
        badge: "niedrig",
        sub: "Dein System wirkt gerade leer. Schlaf, Trinken und Rhythmus sind jetzt der Hebel.",
        cta
      };
    }
    if (percent < 55) {
      return {
        badge: "stabil",
        sub: "Du hast eine Basis. Wenn du zwei Dinge konsequent machst, steigt alles spürbar.",
        cta
      };
    }
    if (percent < 75) {
      return {
        badge: "gut",
        sub: "Gute Reserve. Du bist belastbar – Konstanz macht daraus echte Performance.",
        cta
      };
    }
    if (percent < 90) {
      return {
        badge: "sehr gut",
        sub: "Sehr solide. Feinschliff entscheidet: Timing, Routine, Regeneration.",
        cta
      };
    }
    return {
      badge: "top",
      sub: "Starke Reserve. Du bist auf einem Level, das viele nie stabil erreichen.",
      cta
    };
  }

  // ---------- UI Update ----------
  function showResult(percent) {
    setRing(percent);

    if (scoreNum) scoreNum.textContent = percent + "%";

    const b = resultBucket(percent);
    if (scoreBadge) scoreBadge.textContent = b.badge;
    if (scoreSub) scoreSub.textContent = b.sub;

    if (ctaText) ctaText.textContent = b.cta;
    if (ctaBox) ctaBox.style.display = "block";

    // Mobile: auf die Skala scrollen (ruhig, ohne Show)
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
    if (scoreSub) scoreSub.textContent = "Beantworte die Fragen – danach erscheint deine Skala.";
    if (ctaBox) ctaBox.style.display = "none";
    if (ctaText) ctaText.textContent = "";
  }

  // ---------- Events ----------
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const percent = readScorePercent();
    if (percent === null) {
      // HTML required kümmert sich i.d.R. schon darum.
      // Falls Browser das nicht sauber tut: kurzer, klarer Hinweis.
      if (scoreSub) scoreSub.textContent = "Bitte beantworte alle Fragen, dann bekommst du deine Skala.";
      return;
    }

    showResult(percent);
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      form.reset();
      resetUI();
    });
  }

  // Optional: Enter-Taste auf Form triggert submit sowieso.
  // evalBtn bleibt unberührt.

  // ---------- Init ----------
  resetUI();
})();
