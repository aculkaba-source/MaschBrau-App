/* =====================================================================
   SEITE: Abo – Übersicht, Zusammenstellen (4 Schritte), Verwalten
   ===================================================================== */

(function () {
  const S = MB.speicher, R = MB.rechnen, F = MB.fmt, D = MB.daten, ui = MB.ui, A = MB.aktionen;

  /* Entwurf beim Zusammenstellen/Ändern (wird erst beim Abschließen gespeichert) */
  let entwurf = null;

  function neuerEntwurf() {
    return {
      bearbeiten: false, schritt: 1,
      stufe: "stammtisch", rhythmus: "zweiwoechig", wochentag: 5, zeitfenster: D.zeitfenster[1],
      kaesten: [{ groesse: "05", inhalt: {} }, { groesse: "05", inhalt: {} }],
      aktiverKasten: 0, adresse: S.z.letzteAdresse || "", zahlung: D.zahlarten[0]
    };
  }
  function entwurfAusAbo(schritt) {
    const a = JSON.parse(JSON.stringify(S.z.abo));
    return Object.assign(a, { bearbeiten: true, schritt: schritt || 1, aktiverKasten: 0 });
  }
  function kaestenAnpassen() {
    const n = R.stufe(entwurf.stufe).kaesten;
    while (entwurf.kaesten.length < n) entwurf.kaesten.push({ groesse: "05", inhalt: {} });
    entwurf.kaesten.length = n;
    if (entwurf.aktiverKasten >= n) entwurf.aktiverKasten = 0;
  }
  function kaestenText(n) { return n + " " + (n === 1 ? "Kasten" : "Kästen"); }
  function ersteLieferung() { return MB.datum.naechsterWochentag(+entwurf.wochentag, 2); }

  /* ---------------------------------------------------------------
     ÜBERSICHT (ohne Abo)
     --------------------------------------------------------------- */
  function stufenKarte(s, gewaehlt, rhythmusId, mitAktion) {
    const p = R.aboPreis(s.id, rhythmusId || "monatlich");
    const tag = mitAktion ? "button" : "div";
    return "<" + tag + ' class="stufe-karte' + (gewaehlt ? " an" : "") + '"' +
      (mitAktion ? ' type="button" data-aktion="stufeWaehlen" data-wert="' + s.id + '" aria-pressed="' + !!gewaehlt + '"' : "") + ">" +
      '<span class="stufe-kopf"><b>' + esc(s.name) + '</b><span class="rabatt-badge">−' + s.rabatt + " %</span></span>" +
      '<span class="stufe-kaesten">' + kastenSymbole(s.kaesten) + "</span>" +
      '<span class="stufe-text">' + kaestenText(s.kaesten) + " · " + (s.kaesten * 20) + "–" + (s.kaesten * 24) + " Flaschen</span>" +
      '<span class="stufe-text">' + (p.lieferung ? F.euro(p.lieferung) + " Lieferung" : "Lieferung gratis") + "</span>" +
      '<span class="stufe-preis">z. B. <b>' + F.euro(p.proLieferung) + "</b> pro Lieferung</span>" +
      "</" + tag + ">";
  }
  function kastenSymbole(n) {
    let s = "";
    for (let i = 0; i < n; i++) s += '<i class="kasten-symbol"></i>';
    return s;
  }

  function einfuehrung() {
    let html = ui.kopf("Dein MaschBrau-Abo", { ueber: "Regelmäßig liefern lassen und sparen", rechts: ui.korbKnopf() });
    html += '<div class="abo-held"><div><h2>Kästen frei mischen. Liefertag wählen. Sparen.</h2>' +
      "<p>Du bestimmst, wie viele Kästen kommen, was drin ist und wie oft wir liefern. Je mehr und je öfter, desto günstiger – bis zu 17 %.</p>" +
      '<button class="knopf gross" data-aktion="aboStarten">Abo zusammenstellen</button></div>' +
      '<ol class="schritte-erklaert"><li><b>Größe wählen</b>1 bis 8 Kästen</li><li><b>Rhythmus &amp; Termin</b>wöchentlich bis monatlich</li><li><b>Kästen mischen</b>alle 13 Sorten, 0,5 l oder 0,33 l</li></ol></div>';
    html += '<section class="abschnitt"><h2>Abo-Größen</h2><div class="stufen-raster">' +
      D.abo.stufen.map((s) => stufenKarte(s, false, "monatlich", false)).join("") + "</div>" +
      '<p class="kleingedruckt">Beispielpreise bei monatlicher Lieferung mit Helles 0,5 l. Ein 0,5-l-Kasten hat 20, ein 0,33-l-Kasten 24 Flaschen. ' +
      "Lieferung " + F.euro(D.abo.lieferung) + " pro Lieferung, ab " + D.abo.gratisAbKaesten + " Kästen gratis.</p></section>";
    html += '<section class="abschnitt"><h2>Öfter liefern, mehr sparen</h2><div class="rhythmus-raster">' +
      D.abo.rhythmen.map((r) => '<div class="kachel klein"><b>' + r.name + "</b><span>" + (r.bonus ? "+" + r.bonus + " % Extra-Rabatt" : "kein Extra-Rabatt") + "</span></div>").join("") +
      "</div></section>";
    html += '<section class="abschnitt"><div class="vorteil-liste">' +
      "<p>" + icon("pause") + "<span><b>Jederzeit flexibel</b>Pausieren, Mischung ändern oder kündigen – ohne Frist.</span></p>" +
      "<p>" + icon("coupon") + "<span><b>Exklusive Coupons</b>Abo-Kundinnen und -Kunden bekommen jede Woche zusätzliche Coupons für den Getränkeladen.</span></p>" +
      "<p>" + icon("stern") + "<span><b>Punkte bei jeder Lieferung</b>1 Punkt pro Euro – eintauschbar gegen Prämien.</span></p>" +
      "</div></section>";
    return html;
  }

  /* ---------------------------------------------------------------
     ÜBERSICHT (mit Abo)
     --------------------------------------------------------------- */
  function kastenZusammenfassung(k, i) {
    const teile = Object.keys(k.inhalt).filter((a) => k.inhalt[a]).map((a) => k.inhalt[a] + "× " + R.artikel(a).produkt.name);
    return '<li><b>Kasten ' + (i + 1) + " · " + D.groessen[k.groesse].name + "</b><span>" + esc(teile.join(", ")) + "</span></li>";
  }

  function verwaltung() {
    const abo = S.z.abo;
    const st = R.stufe(abo.stufe), rh = R.rhythmus(abo.rhythmus);
    const preis = R.aboPreis(abo.stufe, abo.rhythmus, abo.kaesten);
    const naechste = R.naechsteLieferung(abo);
    const h = MB.datum.heute();
    const pausiert = abo.pausiertBis && abo.pausiertBis >= h;

    let html = ui.kopf("Mein Abo", { ueber: st.name + " · " + kaestenText(st.kaesten), rechts: ui.korbKnopf() });
    html += '<div class="abo-raster">';

    html += '<section class="karte-box abo-status">' +
      '<p class="etikett ' + (pausiert ? "warn" : "ok") + '">' + (pausiert ? "Pausiert bis " + F.datumVoll(abo.pausiertBis) : "Aktiv") + "</p>" +
      '<p class="ueber">Nächste Lieferung</p><h2 class="gross">' + F.datumLang(naechste) + "</h2>" +
      "<p>" + esc(abo.zeitfenster) + " · " + esc(rh.name) + " am " + D.wochentage[abo.wochentag] + "</p>" +
      '<p class="leise">' + esc(abo.adresse).replace(/\n/g, ", ") + "</p>" +
      '<div class="knopf-raster">' +
      '<button class="knopf" data-aktion="aboAendern" data-schritt="3">' + icon("stift") + " Mischung ändern</button>" +
      '<button class="knopf zweit" data-aktion="aboAendern" data-schritt="1">' + icon("abo") + " Größe &amp; Rhythmus</button>" +
      (pausiert
        ? '<button class="knopf zweit" data-aktion="aboFortsetzen">' + icon("play") + " Fortsetzen</button>"
        : '<button class="knopf zweit" data-aktion="aboPausieren">' + icon("pause") + " Pausieren</button>") +
      '<button class="knopf zweit gefahr-text" data-aktion="aboKuendigen">Kündigen</button>' +
      "</div></section>";

    html += '<section class="karte-box"><h2>Preis</h2><dl class="summen">' +
      "<div><dt>Einzelpreis der Flaschen</dt><dd><s>" + F.euro(preis.normal) + "</s></dd></div>" +
      "<div><dt>Abo-Rabatt (" + st.rabatt + " %" + (rh.bonus ? " + " + rh.bonus + " % Rhythmus" : "") + ")</dt><dd>−" + F.euro(preis.ersparnis) + "</dd></div>" +
      "<div><dt>Lieferung</dt><dd>" + (preis.lieferung ? F.euro(preis.lieferung) : "gratis") + "</dd></div>" +
      '<div class="gesamt"><dt>Pro Lieferung</dt><dd>' + F.euro(preis.proLieferung) + "</dd></div>" +
      "<div><dt>Pro Monat ca.</dt><dd>" + F.euro(preis.proMonat) + "</dd></div></dl>" +
      '<p class="etikett ok">Du sparst ca. ' + F.euro(preis.ersparnisMonat) + " im Monat</p>" +
      '<p class="leise">+ ' + preis.punkte + " Punkte pro Lieferung · " + esc(abo.zahlung) + "</p>" +
      ui.simulation("Simulation: Zahlung und Lieferung werden nur nachgestellt.") + "</section>";

    html += '<section class="karte-box"><h2>Inhalt pro Lieferung</h2><ul class="kasten-liste">' +
      abo.kaesten.map(kastenZusammenfassung).join("") + "</ul></section>";

    // Nächste Termine
    const termine = [];
    let t = naechste;
    for (let i = 0; i < 5; i++) { termine.push(t); t = MB.datum.plusTage(t, rh.tage); }
    let pausenTermine = R.aboTermine(abo, abo.pausiertBis || h).filter((x) => x >= h && R.istPausiert(abo, x));
    html += '<section class="karte-box"><h2>Termine</h2><ul class="termin-liste">' +
      pausenTermine.map((x) => '<li class="aus"><span>' + F.datumKurz(x) + "</span><span>pausiert</span></li>").join("") +
      termine.map((x) => "<li><span>" + F.datumKurz(x) + "</span><span>" + esc(abo.zeitfenster) + "</span></li>").join("") +
      "</ul></section>";

    html += "</div>";

    const lieferungen = S.z.bestellungen.filter((b) => b.typ === "abo").slice(0, 5);
    if (lieferungen.length) {
      html += '<section class="abschnitt"><h2>Bisherige Lieferungen</h2><div class="liste">' + lieferungen.map(MB.shop.bestellZeile).join("") + "</div></section>";
    }
    html += '<a class="abo-hinweis" href="#/karte">' + icon("coupon") + "<span>Mit deinem Abo hast du jede Woche 2 exklusive Coupons für den Getränkeladen. Jetzt aktivieren.</span></a>";
    return html;
  }

  /* ---------------------------------------------------------------
     ZUSAMMENSTELLEN – 4 Schritte
     --------------------------------------------------------------- */
  const schrittNamen = ["Größe", "Rhythmus", "Mischung", "Abschluss"];

  function schrittLeiste() {
    return '<ol class="schritt-leiste">' + schrittNamen.map((n, i) =>
      '<li class="' + (i + 1 === entwurf.schritt ? "an" : i + 1 < entwurf.schritt ? "fertig" : "") + '"' + (i + 1 === entwurf.schritt ? ' aria-current="step"' : "") + ">" +
      '<button type="button" data-aktion="schrittGehe" data-wert="' + (i + 1) + '"' + (i + 1 > entwurf.schritt && !(entwurf.bearbeiten && allesVoll()) ? " disabled" : "") + ">" +
      "<span>" + (i + 1) + "</span>" + n + "</button></li>").join("") + "</ol>";
  }

  function allesVoll() { return entwurf.kaesten.every(R.kastenVoll); }

  function preisLeiste() {
    const p = R.aboPreis(entwurf.stufe, entwurf.rhythmus, entwurf.kaesten);
    const echt = entwurf.kaesten.some((k) => R.kastenAnzahl(k) > 0);
    return '<div class="preis-leiste"><div><span class="leise">' + (echt ? "Pro Lieferung" : "z. B. pro Lieferung") + "</span>" +
      "<b>" + F.euro(p.proLieferung) + "</b>" + (p.ersparnis ? "<s>" + F.euro(p.normal + p.lieferung) + "</s>" : "") +
      '<span class="rabatt-badge">−' + p.rabatt + " %</span></div>" +
      '<div class="preis-leiste-knoepfe">' +
      (entwurf.schritt > 1 ? '<button class="knopf zweit" data-aktion="schrittZurueck">Zurück</button>' : '<a class="knopf zweit" href="#/abo" data-aktion="entwurfVerwerfen">Abbrechen</a>') +
      (entwurf.schritt < 4
        ? '<button class="knopf" data-aktion="schrittWeiter"' + (entwurf.schritt === 3 && !allesVoll() ? " disabled" : "") + ">Weiter</button>"
        : '<button class="knopf" data-aktion="aboAbschliessen">' + (entwurf.bearbeiten ? "Änderungen speichern" : "Abo abschließen") + "</button>") +
      "</div></div>";
  }

  function schritt1() {
    return "<h2>Wie viele Kästen pro Lieferung?</h2>" +
      '<div class="stufen-raster">' + D.abo.stufen.map((s) => stufenKarte(s, s.id === entwurf.stufe, entwurf.rhythmus, true)).join("") + "</div>";
  }

  function schritt2() {
    const st = R.stufe(entwurf.stufe);
    let html = "<h2>Wie oft sollen wir liefern?</h2>";
    html += '<div class="rhythmus-raster">' + D.abo.rhythmen.map((r) => {
      const p = R.aboPreis(entwurf.stufe, r.id, entwurf.kaesten);
      return '<button type="button" class="stufe-karte' + (r.id === entwurf.rhythmus ? " an" : "") + '" data-aktion="rhythmusWaehlen" data-wert="' + r.id + '" aria-pressed="' + (r.id === entwurf.rhythmus) + '">' +
        '<span class="stufe-kopf"><b>' + r.name + '</b><span class="rabatt-badge">−' + (st.rabatt + r.bonus) + " %</span></span>" +
        '<span class="stufe-text">' + (r.bonus ? st.rabatt + " % Abo + " + r.bonus + " % Extra" : st.rabatt + " % Abo-Rabatt") + "</span>" +
        '<span class="stufe-preis">ca. <b>' + F.euro(p.proMonat) + "</b> im Monat</span></button>";
    }).join("") + "</div>";
    html += "<h2>An welchem Tag?</h2>" + ui.chips("wochentagWaehlen", D.liefertage.map((t) => ({ wert: t, text: D.wochentage[t] })), entwurf.wochentag, { label: "Liefertag" });
    html += "<h2>Zu welcher Zeit?</h2>" + ui.chips("zeitfensterWaehlen", D.zeitfenster.map((z) => ({ wert: z, text: z })), entwurf.zeitfenster, { label: "Zeitfenster" });
    html += '<p class="etikett">' + icon("lkw") + " " + (entwurf.bearbeiten ? "Nächste Lieferung nach Änderung" : "Erste Lieferung") + ": " + F.datumLang(ersteLieferung()) + "</p>";
    return html;
  }

  function schritt3() {
    const k = entwurf.kaesten[entwurf.aktiverKasten];
    const max = D.groessen[k.groesse].proKasten;
    const anzahl = R.kastenAnzahl(k);
    let html = "<h2>Kästen mischen</h2><p class=\"leise\">Jeder Kasten ist frei mischbar – wähle pro Kasten die Flaschengröße.</p>";
    html += '<div class="kasten-tabs" role="tablist">' + entwurf.kaesten.map((x, i) => {
      const voll = R.kastenVoll(x);
      return '<button type="button" role="tab" class="kasten-tab' + (i === entwurf.aktiverKasten ? " an" : "") + (voll ? " voll" : "") + '" aria-selected="' + (i === entwurf.aktiverKasten) + '" data-aktion="kastenWaehlen" data-wert="' + i + '">' +
        "<b>Kasten " + (i + 1) + "</b><small>" + (voll ? icon("check") + " " : "") + R.kastenAnzahl(x) + "/" + D.groessen[x.groesse].proKasten + " · " + D.groessen[x.groesse].name + "</small></button>";
    }).join("") + "</div>";

    html += '<div class="kasten-panel" role="tabpanel">';
    html += '<div class="kasten-kopf">' +
      ui.chips("kastenGroesse", [{ wert: "05", text: "0,5 l · 20 Fl." }, { wert: "033", text: "0,33 l · 24 Fl." }], k.groesse, { klasse: "segment", label: "Flaschengröße dieses Kastens" }) +
      '<div class="kasten-fuellung"><span><b>' + anzahl + "</b> von " + max + " Flaschen</span>" +
      '<div class="balken' + (anzahl === max ? " voll" : "") + '"><span style="width:' + Math.round(anzahl / max * 100) + '%"></span></div></div></div>';

    html += '<div class="kasten-werkzeug">' +
      '<button class="knopf zweit klein" data-aktion="kastenAuffuellen"' + (anzahl === max ? " disabled" : "") + ">Rest gleichmäßig auffüllen</button>" +
      (entwurf.aktiverKasten > 0 ? '<button class="knopf zweit klein" data-aktion="kastenKopieren">Wie Kasten ' + entwurf.aktiverKasten + "</button>" : "") +
      '<button class="knopf zweit klein" data-aktion="kastenLeeren"' + (!anzahl ? " disabled" : "") + ">Leeren</button></div>";

    let linie = "";
    html += '<ul class="misch-liste">';
    D.produkte.forEach((p) => {
      if (p.linie !== linie) { linie = p.linie; html += '<li class="misch-gruppe">' + esc(D.linien[linie].name) + "</li>"; }
      const aid = p.id + "-" + k.groesse;
      const m = k.inhalt[aid] || 0;
      html += '<li class="misch-zeile' + (m ? " gewaehlt" : "") + '"><span class="pos-bild">' + produktSVG(p, k.groesse) + "</span>" +
        '<span class="pos-name"><b>' + esc(p.name) + "</b><small>" + F.euro(p.preis[k.groesse]) + "</small></span>" +
        ui.stepper("mischMinus", "mischPlus", m, { artikel: aid }, { klein: true, plusAus: anzahl >= max }) + "</li>";
    });
    html += "</ul>";
    if (anzahl === max && entwurf.aktiverKasten < entwurf.kaesten.length - 1) {
      html += '<button class="knopf gross" data-aktion="kastenWaehlen" data-wert="' + (entwurf.aktiverKasten + 1) + '">Weiter zu Kasten ' + (entwurf.aktiverKasten + 2) + "</button>";
    }
    html += "</div>";
    return html;
  }

  function schritt4() {
    const st = R.stufe(entwurf.stufe), rh = R.rhythmus(entwurf.rhythmus);
    const p = R.aboPreis(entwurf.stufe, entwurf.rhythmus, entwurf.kaesten);
    let html = '<div class="zwei-spalten"><div class="formular">';
    html += '<section class="karte-box"><h2>Lieferadresse</h2><label class="sr" for="abo-adresse">Lieferadresse</label>' +
      '<textarea id="abo-adresse" rows="3" data-eingabe="aboAdresse" placeholder="Name, Straße und Hausnummer, PLZ und Ort">' + esc(entwurf.adresse) + "</textarea>" +
      '<p class="leise">Jede Adresse ist möglich – es wird nur simuliert.</p></section>';
    html += '<section class="karte-box"><h2>Zahlungsart</h2>' + ui.chips("aboZahlung", D.zahlarten.map((z) => ({ wert: z, text: z })), entwurf.zahlung, { label: "Zahlungsart" }) +
      ui.simulation("Simulation: Es wird nichts abgebucht.") + "</section></div>";
    html += '<aside class="karte-box"><h2>Zusammenfassung</h2><dl class="summen">' +
      "<div><dt>Abo</dt><dd>" + esc(st.name) + " · " + kaestenText(st.kaesten) + "</dd></div>" +
      "<div><dt>Rhythmus</dt><dd>" + esc(rh.name) + ", " + D.wochentage[entwurf.wochentag] + "</dd></div>" +
      "<div><dt>Zeitfenster</dt><dd>" + esc(entwurf.zeitfenster) + "</dd></div>" +
      "<div><dt>" + (entwurf.bearbeiten ? "Nächste Lieferung" : "Erste Lieferung") + "</dt><dd>" + F.datumKurz(entwurf.bearbeiten && !terminGeaendert() ? R.naechsteLieferung(S.z.abo) : ersteLieferung()) + "</dd></div>" +
      "</dl><ul class=\"kasten-liste\">" + entwurf.kaesten.map(kastenZusammenfassung).join("") + "</ul>" +
      '<dl class="summen">' +
      "<div><dt>Einzelpreis</dt><dd><s>" + F.euro(p.normal) + "</s></dd></div>" +
      "<div><dt>Rabatt " + p.rabatt + " %</dt><dd>−" + F.euro(p.ersparnis) + "</dd></div>" +
      "<div><dt>Lieferung</dt><dd>" + (p.lieferung ? F.euro(p.lieferung) : "gratis") + "</dd></div>" +
      '<div class="gesamt"><dt>Pro Lieferung</dt><dd>' + F.euro(p.proLieferung) + "</dd></div>" +
      "<div><dt>Pro Monat ca.</dt><dd>" + F.euro(p.proMonat) + "</dd></div></dl>" +
      '<p class="etikett ok">Ersparnis ca. ' + F.euro(p.ersparnisMonat) + " im Monat</p>" +
      '<p class="leise">Jederzeit pausieren, ändern oder kündigen.</p>' +
      '<p class="fehler-text" id="abo-fehler" role="alert"></p></aside></div>';
    return html;
  }

  function terminGeaendert() {
    const a = S.z.abo;
    return !a || a.rhythmus !== entwurf.rhythmus || +a.wochentag !== +entwurf.wochentag;
  }

  function assistent() {
    if (!entwurf) entwurf = neuerEntwurf();
    let html = ui.kopf(entwurf.bearbeiten ? "Abo ändern" : "Abo zusammenstellen", { zurueck: "#/abo", ueber: "Schritt " + entwurf.schritt + " von 4" });
    html += schrittLeiste();
    html += '<div class="assistent">' + [schritt1, schritt2, schritt3, schritt4][entwurf.schritt - 1]() + "</div>";
    html += preisLeiste();
    return html;
  }

  MB.seiten.abo = {
    titel: "Abo",
    tab: "abo",
    render: function (param) {
      if (param[0] === "aendern") {
        if (!S.z.abo) { entwurf = null; return einfuehrung(); }
        if (!entwurf || !entwurf.bearbeiten) entwurf = entwurfAusAbo(1);
        return assistent();
      }
      if (param[0] === "neu") {
        if (S.z.abo) { entwurf = null; return verwaltung(); }
        if (entwurf && entwurf.bearbeiten) entwurf = null;
        return assistent();
      }
      return S.z.abo ? verwaltung() : einfuehrung();
    }
  };

  /* ---------------------------------------------------------------
     AKTIONEN
     --------------------------------------------------------------- */
  A.aboStarten = () => { entwurf = neuerEntwurf(); MB.app.gehe("#/abo/neu"); };
  A.aboAendern = (el) => { entwurf = entwurfAusAbo(+el.dataset.schritt); MB.app.gehe("#/abo/aendern"); };
  A.entwurfVerwerfen = () => { entwurf = null; MB.app.gehe("#/abo"); };

  A.schrittGehe = (el) => { entwurf.schritt = +el.dataset.wert; MB.app.zeichnen(true); };
  A.schrittWeiter = () => {
    if (entwurf.schritt === 3 && !allesVoll()) return;
    entwurf.schritt++;
    MB.app.zeichnen(true);
  };
  A.schrittZurueck = () => { entwurf.schritt--; MB.app.zeichnen(true); };

  A.stufeWaehlen = (el) => { entwurf.stufe = el.dataset.wert; kaestenAnpassen(); MB.app.zeichnen(); };
  A.rhythmusWaehlen = (el) => { entwurf.rhythmus = el.dataset.wert; MB.app.zeichnen(); };
  A.wochentagWaehlen = (el) => { entwurf.wochentag = +el.dataset.wert; MB.app.zeichnen(); };
  A.zeitfensterWaehlen = (el) => { entwurf.zeitfenster = el.dataset.wert; MB.app.zeichnen(); };

  function aktKasten() { return entwurf.kaesten[entwurf.aktiverKasten]; }
  A.kastenWaehlen = (el) => {
    entwurf.aktiverKasten = +el.dataset.wert;
    MB.app.zeichnen();
    const tabs = document.querySelector(".kasten-tabs");
    if (tabs) tabs.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };
  A.kastenGroesse = (el) => {
    const k = aktKasten();
    if (k.groesse === el.dataset.wert) return;
    k.groesse = el.dataset.wert;
    k.inhalt = {};
    MB.app.zeichnen();
  };
  A.mischPlus = (el) => {
    const k = aktKasten();
    if (R.kastenAnzahl(k) >= D.groessen[k.groesse].proKasten) return;
    k.inhalt[el.dataset.artikel] = (k.inhalt[el.dataset.artikel] || 0) + 1;
    MB.app.zeichnen();
  };
  A.mischMinus = (el) => {
    const k = aktKasten();
    k.inhalt[el.dataset.artikel] = Math.max(0, (k.inhalt[el.dataset.artikel] || 0) - 1);
    if (!k.inhalt[el.dataset.artikel]) delete k.inhalt[el.dataset.artikel];
    MB.app.zeichnen();
  };
  A.kastenLeeren = () => { aktKasten().inhalt = {}; MB.app.zeichnen(); };
  A.kastenKopieren = () => {
    const vorher = entwurf.kaesten[entwurf.aktiverKasten - 1];
    entwurf.kaesten[entwurf.aktiverKasten] = { groesse: vorher.groesse, inhalt: Object.assign({}, vorher.inhalt) };
    MB.app.zeichnen();
  };
  /* Freie Plätze reihum auf die schon gewählten Sorten verteilen
     (oder auf alle Sorten, wenn der Kasten noch leer ist) */
  A.kastenAuffuellen = () => {
    const k = aktKasten();
    const max = D.groessen[k.groesse].proKasten;
    let sorten = Object.keys(k.inhalt).filter((a) => k.inhalt[a]);
    if (!sorten.length) sorten = D.produkte.map((p) => p.id + "-" + k.groesse);
    let i = 0;
    while (R.kastenAnzahl(k) < max) {
      const a = sorten[i++ % sorten.length];
      k.inhalt[a] = (k.inhalt[a] || 0) + 1;
    }
    MB.app.zeichnen();
  };

  A.aboAdresse = (el) => { entwurf.adresse = el.value; };
  A.aboZahlung = (el) => { entwurf.zahlung = el.dataset.wert; MB.app.zeichnen(); };

  A.aboAbschliessen = () => {
    const adresse = (entwurf.adresse || "").trim();
    if (adresse.length < 5) {
      document.getElementById("abo-fehler").textContent = "Bitte gib eine Lieferadresse ein.";
      document.getElementById("abo-adresse").focus();
      return;
    }
    if (!allesVoll()) { entwurf.schritt = 3; MB.app.zeichnen(true); return; }
    const alt = S.z.abo;
    const neu = {
      stufe: entwurf.stufe, rhythmus: entwurf.rhythmus, wochentag: +entwurf.wochentag, zeitfenster: entwurf.zeitfenster,
      kaesten: entwurf.kaesten, adresse: adresse, zahlung: entwurf.zahlung,
      seit: alt ? alt.seit : MB.datum.heute(),
      start: alt && !terminGeaendert() ? alt.start : ersteLieferung(),
      gebuchtBis: alt ? (alt.gebuchtBis && alt.gebuchtBis > MB.datum.plusTage(MB.datum.heute(), -1) ? alt.gebuchtBis : MB.datum.plusTage(MB.datum.heute(), -1)) : null,
      pausiertAb: alt ? alt.pausiertAb : null, pausiertBis: alt ? alt.pausiertBis : null
    };
    const warNeu = !alt;
    S.z.abo = neu;
    S.z.letzteAdresse = adresse;
    S.speichern();
    entwurf = null;
    MB.app.gehe("#/abo");
    if (warNeu) {
      ui.blatt('<div class="erfolg">' + '<div class="erfolg-haken">' + icon("check") + "</div><h2>Willkommen im Abo!</h2>" +
        "<p>Deine erste Lieferung kommt am <b>" + F.datumLang(neu.start) + "</b> zwischen " + esc(neu.zeitfenster) + ".</p>" +
        "<p>Ab sofort hast du jede Woche exklusive Abo-Coupons für den Getränkeladen.</p>" +
        ui.simulation("Simulation – es wird nichts geliefert oder abgebucht.") +
        '<div class="knopf-reihe"><button class="knopf" data-aktion="blattZu">Super</button></div></div>', { klasse: "klein" });
    } else {
      ui.toast("Abo gespeichert");
    }
  };

  A.aboPausieren = () => {
    const h = MB.datum.heute();
    ui.blatt("<h2>Abo pausieren</h2><p>Wie lange sollen wir pausieren? Danach geht es automatisch weiter.</p>" +
      '<div class="knopf-spalte">' + [1, 2, 4, 8].map((w) =>
        '<button class="knopf zweit" data-aktion="aboPauseSetzen" data-wochen="' + w + '">' + w + (w === 1 ? " Woche" : " Wochen") +
        "<small>bis " + F.datumVoll(MB.datum.plusTage(h, w * 7)) + "</small></button>").join("") + "</div>" +
      '<div class="knopf-reihe"><button class="knopf zweit" data-aktion="blattZu">Abbrechen</button></div>', { klasse: "klein" });
  };
  A.aboPauseSetzen = (el) => {
    const h = MB.datum.heute();
    S.z.abo.pausiertAb = h;
    S.z.abo.pausiertBis = MB.datum.plusTage(h, +el.dataset.wochen * 7);
    S.speichern();
    ui.blattZu();
    ui.toast("Abo pausiert bis " + F.datumVoll(S.z.abo.pausiertBis));
    MB.app.zeichnen();
  };
  A.aboFortsetzen = () => {
    S.z.abo.pausiertAb = null;
    S.z.abo.pausiertBis = null;
    S.speichern();
    ui.toast("Abo läuft wieder");
    MB.app.zeichnen();
  };
  A.aboKuendigen = () => {
    ui.frage("Abo wirklich kündigen?", "Es werden keine weiteren Lieferungen geplant. Deine Punkte bleiben erhalten, die Abo-Coupons entfallen.", "Abo kündigen", true)
      .then((ja) => {
        if (!ja) return;
        S.z.abo = null;
        Object.keys(S.z.coupons.aktiv).forEach((cid) => { const c = R.couponDef(cid); if (c && c.nurAbo) delete S.z.coupons.aktiv[cid]; });
        S.speichern();
        ui.toast("Abo gekündigt");
        MB.app.zeichnen();
      });
  };
})();
