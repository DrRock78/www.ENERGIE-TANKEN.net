/* =========================================================
   ENERGIE-TANKEN.net — Energie-Kompass (Final JS)
   - Rechnet Antworten -> Prozent (0–100)
   - Füllt Gold-Kreis-Skala (conic-gradient)
   - Setzt Ergebnis-Text (ohne Gelaber)
   - CTA bleibt am Ende sichtbar
   ========================================================= */

(function () {
  "use strict";

  // -----------------------------
  // 1) HELFER
  // -----------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Punkte-Mapping für Radio-Werte:
  // Höher = besser. Du kannst die Werte später leicht tunen.
  const scoreMap = {
    // Schlaf
    chaotisch: 0,
    unruhig: 25,
    okay: 55,
    gut: 80,
    "sehr gut": 100,

    // Trinken
    selten: 15,
    "zu wenig": 35,
    wechselnd: 55,
    gut2: 80,        // falls "gut" doppelt gebraucht wird, nutzen wir "gut2" optional
    konstant: 100,

    // Softdrinks & Säfte
    oft: 0,
    "mehrmals/woche": 25,
    gelegentlich: 55,
    selten2: 80,     // falls "selten" doppelt gebraucht wird, nutzen wir "selten2" optional
    "fast nie": 100,

    // Fastfood
    oft2: 0,
    "mehrmals/woche2": 25,
    gelegentlich2: 55,
    selten3: 80,
    "fast nie2": 100,

    // Bewegung
    kaum: 15,
    selten4: 35,
    wechselnd2: 55,
    regelmäßig: 80,
    konstant2: 100,

    // Stress-Last (umgekehrt: weniger Stress = besser)
    überlastet: 0,
    angespannt: 30,
    okay2: 55,
    stabil: 80,
    "sehr stabil": 100,

    // Fokus & Klarheit
    neblig: 10,
    schwankend: 35,
    okay3: 55,
    klar: 80,
    "sehr klar": 100
  };

  // -----------------------------
  // 2) DOM ELEMENTE
  // -----------------------------
  // Skala-Kreis (dein schwarzer Kreis in der Card)
  // => Wir suchen zuerst eine eindeutige Fläche:
  // a) Element mit class "gold-ring" oder "energy-ring" (falls du sowas schon hast),
  // b) ansonsten: erstes Element, das wie der Kreis aussieht (Fallback).
  let ring =
    $(".gold-ring") ||
    $(".energy-ring") ||
    $(".ring") ||
    $(".energy-circle");

  // Prozentanzeige
  let percentEl =
    $(".energy-percent") ||
    $(".percent") ||
    $(".score-percent") ||
    $(".energy-score");

  // Statuszeile unter Prozent (z.B. "bereit" / "stark" etc.)
  let statusEl =
    $(".energy-status") ||
    $(".status") ||
    $(".score-status");

  // Ergebnistext (unter der Skala)
  let resultTextEl =
    $(".energy-result-text") ||
    $(".result-text") ||
    $(".score-text");

  // Buttons
  const evalBtn =
    $("#evalBtn") ||
    $(".btn-eval") ||
    $('button[type="button"][data-action="eval"]') ||
    $("button.btn.btn-primary") ||
    $("button");

  const resetBtn =
    $("#resetBtn") ||
    $(".btn-reset") ||
    $('button[type="button"][data-action="reset"]') ||
    $(".btn-secondary");

  // CTA am Ende (Kontakt aufnehmen) – optional
  const ctaBtn =
    $(".cta-contact") ||
    $('a[href*="kontakt"]') ||
    $('a.btn.btn-primary[href*="kontakt"]');

  // Frage-Gruppen: Wir nehmen alle Radios und gruppieren nach name=""
  const radioGroups = (() => {
    const radios = $$('input[type="radio"][name]');
    const names = [...new Set(radios.map(r => r.name))];
    return names;
  })();

  // -----------------------------
  // 3) FALLBACKS (wenn Klassen fehlen)
  // -----------------------------
  // Wenn du keine speziellen Klassen gesetzt hast:
  // - Der Kreis ist oft ein DIV in der Ergebnis-Card.
  // - Prozent/Text stehen oft daneben.
  // Wir versuchen per Layout-Heuristik:
  if (!ring) {
    // Fallback: nimm das größte runde Element auf der Seite
    const candidates = $$("div").filter(d => {
      const cs = getComputedStyle(d);
      const br = parseFloat(cs.borderRadius) || 0;
      const w = d.getBoundingClientRect().width;
      const h = d.getBoundingClientRect().height;
      return w > 120 && h > 120 && Math.abs(w - h) < 6 && br > w * 0.3;
    });
    ring = candidates[0] || null;
  }

  if (!percentEl) {
    // Suche nach einem Element, das "--%" oder "—%" enthält
    percentEl = $$("*").find(el => (el.textContent || "").trim().match(/^[-—–]?\s*%$/) || (el.textContent || "").includes("%")) || null;
  }

  // -----------------------------
  // 4) WERT AUS RADIO HOLEN
  // -----------------------------
  function normalizeValue(v) {
    if (!v) return "";
    return v.trim().toLowerCase();
  }

  function getGroupValue(name) {
    const checked = $(`input[type="radio"][name="${CSS.escape(name)}"]:checked`);
    if (!checked) return null;

    // Priorität:
    // 1) data-score (wenn du es gesetzt hast)
    if (checked.dataset && checked.dataset.score) {
      const s = Number(checked.dataset.score);
      if (!Number.isNaN(s)) return { score: clamp(s, 0, 100), raw: checked.value };
    }

    // 2) value normalisieren
    let v = normalizeValue(checked.value);

    // Manche Values kollidieren ("okay", "selten", "wechselnd" kommt mehrfach).
    // Wenn du identische Values in mehreren Fragen hast, empfehle ich:
    // - pro Frage eindeutige values
    // oder
    // - data-score setzen
    // -> Wir lösen es hier robust:
    // Wir schauen zusätzlich auf die Frage-Überschrift davor (Index im Array)
    const groupIndex = radioGroups.indexOf(name);

    // Kollisionen anhand Gruppennummer lösen:
    // 0 Schlaf, 1 Trinken, 2 Softdrinks, 3 Fastfood, 4 Bewegung, 5 Stress, 6 Fokus
    if (v === "okay") {
      if (groupIndex === 0) v = "okay";
      else if (groupIndex === 5) v = "okay2";
      else if (groupIndex === 6) v = "okay3";
    }

    if (v === "gut" && groupIndex === 1) v = "gut2";

    if (v === "selten") {
      if (groupIndex === 1) v = "selten";     // Trinken: selten = schlecht
      else if (groupIndex === 2) v = "selten2"; // Softdrinks: selten = gut
      else if (groupIndex === 3) v = "selten3"; // Fastfood: selten = gut
      else if (groupIndex === 4) v = "selten4"; // Bewegung: selten = eher schlecht
    }

    if (v === "wechselnd") {
      if (groupIndex === 1) v = "wechselnd";
      else if (groupIndex === 4) v = "wechselnd2";
    }

    if (v === "oft") {
      if (groupIndex === 2) v = "oft";
      else if (groupIndex === 3) v = "oft2";
    }

    if (v === "mehrmals/woche") {
      if (groupIndex === 2) v = "mehrmals/woche";
      else if (groupIndex === 3) v = "mehrmals/woche2";
    }

    if (v === "gelegentlich") {
      if (groupIndex === 2) v = "gelegentlich";
      else if (groupIndex === 3) v = "gelegentlich2";
    }

    if (v === "fast nie") {
      if (groupIndex === 2) v = "fast nie";
      else if (groupIndex === 3) v = "fast nie2";
    }

    if (v === "konstant") {
      if (groupIndex === 1) v = "konstant";
      else if (groupIndex === 4) v = "konstant2";
    }

    const score = scoreMap[v];
    if (typeof score === "number") return { score, raw: checked.value };

    // Fallback: wenn Value unbekannt
    return { score: 50, raw: checked.value };
  }

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  // -----------------------------
  // 5) SCORE BERECHNEN
  // -----------------------------
  function computeScore() {
    const answers = [];
    for (const name of radioGroups) {
      const v = getGroupValue(name);
      if (!v) return { complete: false, percent: 0, answers: [] };
      answers.push(v.score);
    }

    const avg = answers.reduce((a, b) => a + b, 0) / answers.length;
    const percent = Math.round(clamp(avg, 0, 100));

    return { complete: true, percent, answers };
  }

  // -----------------------------
  // 6) UI UPDATE (Skala + Text)
  // -----------------------------
  function getStatusText(p) {
    if (p >= 90) return "Top-Level";
    if (p >= 75) return "stark";
    if (p >= 60) return "solide";
    if (p >= 45) return "ausbaufähig";
    if (p >= 30) return "niedrig";
    return "Alarm";
  }

  function getResultText(p) {
    if (p >= 90) return "Du bist auf einem sehr starken Level. Halte den Kurs – und optimiere nur Details.";
    if (p >= 75) return "Du bist stabil unterwegs. Wenn du 1–2 Stellschrauben drehst, spürst du schnell mehr Energie.";
    if (p >= 60) return "Du hast ein solides Fundament. Konstanz ist jetzt dein Hebel.";
    if (p >= 45) return "Dein System läuft, aber nicht effizient. Kleine Korrekturen bringen spürbaren Effekt.";
    if (p >= 30) return "Dein Energie-Level ist niedrig. Schlaf, Trinken und Stress sind jetzt Priorität.";
    return "Dein System steht unter Dauerlast. Du brauchst Entlastung – und einen klaren Reset.";
  }

  function paintRing(p) {
    if (!ring) return;

    // Gold-Arc per conic-gradient
    // Außen Gold, Rest dunkel
    ring.style.background = `conic-gradient(var(--gold) ${p * 3.6}deg, rgba(255,255,255,.08) 0deg)`;

    // Falls dein Ring innen schwarz sein soll:
    // Wir nutzen eine Masken-Optik über box-shadow inset,
    // ohne neue HTML-Strukturen zu erzwingen.
    ring.style.borderRadius = "999px";
    ring.style.boxShadow = "inset 0 0 0 16px rgba(0,0,0,.92), 0 18px 60px rgba(0,0,0,.55)";
  }

  function setText(p) {
    if (percentEl) percentEl.textContent = `${p}%`;
    if (statusEl) statusEl.textContent = getStatusText(p);
    if (resultTextEl) resultTextEl.textContent = getResultText(p);
  }

  function showCTA() {
    // CTA soll nur am Ende sichtbar sein -> wir ändern nichts am Layout,
    // nur falls es mit hidden/opacity arbeitet.
    const ctaSection =
      $(".cta-section") ||
      $(".cta") ||
      $(".weiter") ||
      $("#cta") ||
      null;

    if (ctaSection) {
      ctaSection.style.display = "block";
      ctaSection.style.opacity = "1";
      ctaSection.style.pointerEvents = "auto";
    }
  }

  // -----------------------------
  // 7) EVENTS
  // -----------------------------
  function onEvaluate() {
    const { complete, percent } = computeScore();

    if (!complete) {
      // Ruhig, klar, ohne Drama
      alert("Bitte beantworte alle Fragen – danach erscheint deine Skala.");
      return;
    }

    paintRing(percent);
    setText(percent);
    showCTA();

    // Optional: nach oben zur Skala scrollen (edel, ohne Sprung)
    const scoreCard = ring ? ring.closest("section, .card, .section, .container") : null;
    if (scoreCard && scoreCard.scrollIntoView) {
      scoreCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function onReset() {
    // Radios reset
    $$('input[type="radio"]').forEach(r => (r.checked = false));

    // Ergebnis zurücksetzen
    if (percentEl) percentEl.textContent = "—%";
    if (statusEl) statusEl.textContent = "bereit";
    if (resultTextEl) resultTextEl.textContent = "Beantworte die Fragen – danach erscheint deine Skala.";

    if (ring) {
      ring.style.background = "rgba(255,255,255,.06)";
      ring.style.boxShadow = "inset 0 0 0 16px rgba(0,0,0,.92), 0 18px 60px rgba(0,0,0,.55)";
    }

    // CTA verstecken, falls du das so willst:
    const ctaSection =
      $(".cta-section") ||
      $(".cta") ||
      $(".weiter") ||
      $("#cta") ||
      null;

    if (ctaSection) {
      ctaSection.style.display = "none";
      ctaSection.style.opacity = "0";
      ctaSection.style.pointerEvents = "none";
    }
  }

  // Buttons sauber binden:
  if (evalBtn) evalBtn.addEventListener("click", onEvaluate);
  if (resetBtn) resetBtn.addEventListener("click", onReset);

  // Bonus: Wenn du willst, dass Live-Änderungen sofort die Skala aktualisieren:
  // -> auskommentiert, weil du "keine Ablenkung zwischendurch" wolltest.
  // $$('input[type="radio"]').forEach(r => r.addEventListener("change", () => {}));

})();
