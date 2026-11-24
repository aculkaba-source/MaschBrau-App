/* =====================================================================
   SEITEN: Sortiment, Produkt, Warenkorb, Bestellen, Bestellungen
   (Einzelbestellung ohne Abo)
   ===================================================================== */

(function () {
  const S = MB.speicher, R = MB.rechnen, F = MB.fmt, D = MB.daten, ui = MB.ui, A = MB.aktionen;

  /* Merkzettel der Seite (nicht gespeichert) */
  const filter = { linie: "alle", alkoholfrei: false, zero: false, protein: false };
  const kartenGroesse = {};   // produktId -> "05" | "033"
  const bestellForm = { tag: "", zeit: D.zeitfenster[0], zahlung: D.zahlarten[0], adresse: null };

  function korbAnzahl() { return Object.keys(S.z.warenkorb).reduce((s, a) => s + S.z.warenkorb[a], 0); }

  function korbAendern(aid, delta) {
    const k = S.z.warenkorb;
    k[aid] = Math.max(0, (k[aid] || 0) + delta);
    if (!k[aid]) delete k[aid];
    S.speichern();
  }

  /* ---------------------------------------------------------------
     SORTIMENT
     --------------------------------------------------------------- */
  function produktKarte(p) {
    const g = kartenGroesse[p.id] || "05";
    const aid = p.id + "-" + g;
    const menge = S.z.warenkorb[aid] || 0;
    return '<article class="produkt-karte" style="--akzent:' + p.farbe + '">' +
      '<a class="pk-bild" href="#/produkt/' + p.id + '" aria-label="' + esc(p.name) + ', Details">' + produktSVG(p, g) + "</a>" +
      '<div class="pk-text">' +
      '<p class="ueber">' + esc(D.linien[p.linie].name) + (p.protein ? " · Protein" : p.zero ? " · Zero" : p.alkoholfrei ? " · alkoholfrei" : "") + "</p>" +
      '<h3><a href="#/produkt/' + p.id + '">' + esc(p.name) + "</a></h3>" +
      '<p class="pk-kurz">' + esc(p.kurz) + "</p>" +
      ui.chips("groesseWaehlen", [{ wert: "05", text: "0,5 l" }, { wert: "033", text: "0,33 l" }], g, { klasse: "segment klein", label: "Flaschengröße" })
        .replace(/data-wert=/g, 'data-produkt="' + p.id + '" data-wert=') +
      '<div class="pk-fuss"><span class="preis">' + F.euro(p.preis[g]) + "</span>" +
      (menge
        ? ui.stepper("korbMinus", "korbPlus", menge, { artikel: aid }, { klein: true })
        : '<button class="knopf klein" data-aktion="korbPlus" data-artikel="' + aid + '">' + icon("plus") + " In den Korb</button>") +
      "</div></div></article>";
  }

  MB.seiten.sortiment = {
    titel: "Sortiment",
    tab: "sortiment",
    render: function (param) {
      filter.linie = param[0] && D.linien[param[0]] ? param[0] : "alle";
      let liste = D.produkte.filter((p) =>
        (filter.linie === "alle" || p.linie === filter.linie) &&
        (!filter.alkoholfrei || p.alkoholfrei) && (!filter.zero || p.zero) && (!filter.protein || p.protein));

      let html = ui.kopf("Sortiment", { ueber: "Einzeln bestellen – ohne Abo", rechts: ui.korbKnopf() });
      html += '<div class="filter-leiste">' +
        ui.chips("filterLinie", [{ wert: "alle", text: "Alle" }].concat(Object.keys(D.linien).map((l) => ({ wert: l, text: D.linien[l].name }))), filter.linie, { label: "Produktlinie" }) +
        '<div class="chips" role="group" aria-label="Eigenschaften">' +
        ["alkoholfrei", "zero", "protein"].map((f) =>
          '<button type="button" class="chip umschalter' + (filter[f] ? " an" : "") + '" data-aktion="filterSchalter" data-wert="' + f + '" aria-pressed="' + filter[f] + '">' +
          ({ alkoholfrei: "Alkoholfrei", zero: "Zero", protein: "Protein" })[f] + "</button>").join("") +
        "</div></div>";

      if (!liste.length) {
        html += '<p class="leer">Keine Produkte für diese Auswahl. <button class="link" data-aktion="filterReset">Filter zurücksetzen</button></p>';
      } else {
        html += '<div class="produkt-raster">' + liste.map(produktKarte).join("") + "</div>";
      }
      html += '<p class="kleingedruckt">Alle Preise pro Flasche inkl. MwSt., ohne Pfand. Lieferung ' + F.euro(D.einzel.lieferung) + ", ab " + F.euro(D.einzel.gratisAb) + " gratis. Im Abo günstiger.</p>";
      return html;
    }
  };

  A.filterLinie = (el) => { MB.app.gehe(el.dataset.wert === "alle" ? "#/sortiment" : "#/sortiment/" + el.dataset.wert); };
  A.filterSchalter = (el) => { filter[el.dataset.wert] = !filter[el.dataset.wert]; MB.app.zeichnen(); };
  A.filterReset = () => { filter.linie = "alle"; filter.alkoholfrei = filter.zero = filter.protein = false; MB.app.gehe("#/sortiment"); };
  A.groesseWaehlen = (el) => { kartenGroesse[el.dataset.produkt] = el.dataset.wert; MB.app.zeichnen(); };
  A.korbPlus = (el) => {
    const vorher = korbAnzahl();
    korbAendern(el.dataset.artikel, +(el.dataset.anzahl || 1));
    if (!vorher) ui.toast("Im Warenkorb: " + R.artikel(el.dataset.artikel).name);
    else if (el.dataset.anzahl > 1) ui.toast(el.dataset.anzahl + " × " + R.artikel(el.dataset.artikel).name + " hinzugefügt");
    MB.app.zeichnen();
  };
  A.korbMinus = (el) => { korbAendern(el.dataset.artikel, -1); MB.app.zeichnen(); };
  A.korbEntfernen = (el) => { delete S.z.warenkorb[el.dataset.artikel]; S.speichern(); MB.app.zeichnen(); };

  /* ---------------------------------------------------------------
     PRODUKT-DETAIL
     --------------------------------------------------------------- */
  MB.seiten.produkt = {
    titel: "Produkt",
    tab: "sortiment",
    render: function (param) {
      const p = R.produkt(param[0]);
      if (!p) return ui.kopf("Nicht gefunden", { zurueck: "#/sortiment" }) + '<p class="leer">Dieses Produkt gibt es nicht.</p>';
      let html = ui.kopf(p.name, { zurueck: "#/sortiment", ueber: D.linien[p.linie].name, rechts: ui.korbKnopf() });
      html += '<div class="detail" style="--akzent:' + p.farbe + '">';
      html += '<div class="detail-bilder">' + produktSVG(p, "05", p.name + " 0,5 l") + produktSVG(p, "033", p.name + " 0,33 l") + "</div>";
      html += '<div class="detail-text">';
      html += '<p class="detail-kurz">' + esc(p.kurz) + "</p>";
      html += '<div class="groessen-liste">';
      Object.keys(D.groessen).forEach((g) => {
        const aid = p.id + "-" + g, menge = S.z.warenkorb[aid] || 0;
        html += '<div class="groessen-zeile"><div><b>' + D.groessen[g].lang + "</b><span>" + F.euro(p.preis[g]) + " · " +
          F.euro(p.preis[g] / (g === "05" ? 0.5 : 0.33)) + "/l</span></div>" +
          ui.stepper("korbMinus", "korbPlus", menge, { artikel: aid }) +
          '<button class="knopf zweit klein" data-aktion="korbPlus" data-artikel="' + aid + '" data-anzahl="' + D.groessen[g].proKasten + '">+ Kasten (' + D.groessen[g].proKasten + ")</button></div>";
      });
      html += "</div>";
      html += "<h2>Geschmack</h2><p>" + esc(p.geschmack) + "</p>";
      html += '<dl class="fakten">' +
        "<div><dt>Alkohol</dt><dd>" + (p.alkohol ? String(p.alkohol).replace(".", ",") + " % vol." : "0,0 % vol.") + "</dd></div>" +
        "<div><dt>Energie</dt><dd>" + p.naehrwerte.kcal + " kcal / 100 ml</dd></div>" +
        "<div><dt>Zucker</dt><dd>" + String(p.naehrwerte.zucker).replace(".", ",") + " g / 100 ml</dd></div>" +
        "<div><dt>Eiweiß</dt><dd>" + String(p.naehrwerte.eiweiss).replace(".", ",") + " g / 100 ml</dd></div></dl>";
      html += "<h2>Zutaten</h2><p>" + esc(p.zutaten) + "</p><p class=\"leise\">" + esc(p.allergene) + "</p>";
      html += "</div></div>";
      return html;
    }
  };

  /* ---------------------------------------------------------------
     WARENKORB
     --------------------------------------------------------------- */
  function positionsListe(positionen, bearbeitbar) {
    return '<ul class="positionen">' + Object.keys(positionen).map((aid) => {
      const a = R.artikel(aid);
      if (!a) return "";
      return '<li class="position"><span class="pos-bild">' + produktSVG(a.produkt, a.groesse) + "</span>" +
        '<span class="pos-name"><b>' + esc(a.produkt.name) + "</b><small>" + D.groessen[a.groesse].lang + " · " + F.euro(a.preis) + "</small></span>" +
        (bearbeitbar
          ? ui.stepper("korbMinus", "korbPlus", positionen[aid], { artikel: aid }, { klein: true }) +
            '<button class="knopf-rund leise" data-aktion="korbEntfernen" data-artikel="' + aid + '" aria-label="' + esc(a.name) + ' entfernen">' + icon("muell") + "</button>"
          : '<span class="pos-menge">' + positionen[aid] + " ×</span>") +
        '<span class="pos-summe">' + F.euro(a.preis * positionen[aid]) + "</span></li>";
    }).join("") + "</ul>";
  }

  function summenBlock(r) {
    return '<dl class="summen">' +
      "<div><dt>Warenwert (" + r.flaschen + (r.flaschen === 1 ? " Flasche" : " Flaschen") + ")</dt><dd>" + F.euro(r.warenwert) + "</dd></div>" +
      "<div><dt>Lieferung</dt><dd>" + (r.lieferung ? F.euro(r.lieferung) : "gratis") + "</dd></div>" +
      '<div class="gesamt"><dt>Gesamt</dt><dd>' + F.euro(r.gesamt) + "</dd></div></dl>";
  }

  MB.seiten.warenkorb = {
    titel: "Warenkorb",
    tab: "warenkorb",
    render: function () {
      const k = S.z.warenkorb;
      let html = ui.kopf("Warenkorb", { zurueck: "#/sortiment" });
      if (!Object.keys(k).length) {
        return html + '<div class="leer-gross">' + icon("korb") + "<h2>Dein Warenkorb ist leer</h2><p>Stöbere im Sortiment und bestelle einzeln – oder spare mit einem Abo.</p>" +
          '<div class="knopf-reihe"><a class="knopf" href="#/sortiment">Zum Sortiment</a><a class="knopf zweit" href="#/abo">Abo ansehen</a></div></div>';
      }
      const r = R.einzelBestellung(k);
      html += '<div class="zwei-spalten"><div>' + positionsListe(k, true) + "</div><aside class=\"karte-box\">";
      if (r.fehltBisGratis) {
        const anteil = Math.min(100, Math.round(r.warenwert / D.einzel.gratisAb * 100));
        html += '<div class="fortschritt-text">Noch <b>' + F.euro(r.fehltBisGratis) + "</b> bis zur kostenlosen Lieferung</div>" +
          '<div class="balken"><span style="width:' + anteil + '%"></span></div>';
      } else {
        html += '<p class="etikett ok">' + icon("check") + " Kostenlose Lieferung</p>";
      }
      html += summenBlock(r);
      html += '<p class="leise">+ ' + r.punkte + " Punkte für diese Bestellung</p>";
      html += '<a class="knopf gross" href="#/bestellen">Zur Kasse</a>';
      html += '<a class="abo-hinweis" href="#/abo">' + icon("abo") + "<span>Regelmäßig? Im Abo sparst du schon ab 1 Kasten 5 %, ab 2 Kästen 10 % – und die Lieferung ist günstiger.</span></a>";
      html += "</aside></div>";
      return html;
    }
  };

  /* ---------------------------------------------------------------
     BESTELLEN (Lieferadresse, Termin, Zahlung – alles simuliert)
     --------------------------------------------------------------- */
  function moeglicheTage(anzahl) {
    const tage = [];
    let t = MB.datum.plusTage(MB.datum.heute(), 1);
    while (tage.length < anzahl) {
      if (D.liefertage.indexOf(MB.datum.ausIso(t).getDay()) >= 0) tage.push(t);
      t = MB.datum.plusTage(t, 1);
    }
    return tage;
  }

  MB.seiten.bestellen = {
    titel: "Bestellen",
    tab: "warenkorb",
    render: function () {
      const k = S.z.warenkorb;
      if (!Object.keys(k).length) { setTimeout(() => MB.app.gehe("#/warenkorb")); return ""; }
      const tage = moeglicheTage(8);
      if (tage.indexOf(bestellForm.tag) < 0) bestellForm.tag = tage[0];
      if (bestellForm.adresse === null) bestellForm.adresse = S.z.letzteAdresse || "";
      const r = R.einzelBestellung(k);

      let html = ui.kopf("Bestellen", { zurueck: "#/warenkorb", ueber: "Einzelbestellung" });
      html += '<div class="zwei-spalten"><div class="formular">';
      html += '<section class="karte-box"><h2>Lieferadresse</h2>' +
        '<label class="sr" for="adresse">Lieferadresse</label>' +
        '<textarea id="adresse" rows="3" data-eingabe="adresseEingabe" placeholder="Name, Straße und Hausnummer, PLZ und Ort">' + esc(bestellForm.adresse) + "</textarea>" +
        '<p class="leise">Jede Adresse ist möglich – es wird ja nur simuliert.</p></section>';
      html += '<section class="karte-box"><h2>Liefertag</h2>' +
        ui.chips("bestellTag", tage.map((t) => ({ wert: t, text: F.datumKurz(t) })), bestellForm.tag, { label: "Liefertag" }) +
        "<h2>Zeitfenster</h2>" + ui.chips("bestellZeit", D.zeitfenster.map((z) => ({ wert: z, text: z })), bestellForm.zeit, { label: "Zeitfenster" }) +
        "</section>";
      html += '<section class="karte-box"><h2>Zahlungsart</h2>' +
        ui.chips("bestellZahlung", D.zahlarten.map((z) => ({ wert: z, text: z })), bestellForm.zahlung, { label: "Zahlungsart" }) +
        ui.simulation("Simulation: Es wird nichts bezahlt und nichts geliefert.") + "</section>";
      html += "</div><aside class=\"karte-box\"><h2>Übersicht</h2>" + positionsListe(k, false) + summenBlock(r) +
        '<p class="leise">+ ' + r.punkte + " Punkte</p>" +
        '<p class="fehler-text" id="bestell-fehler" role="alert"></p>' +
        '<button class="knopf gross" data-aktion="bestellungAbsenden">Jetzt bestellen · ' + F.euro(r.gesamt) + "</button>" +
        ui.simulation("Zahlung und Lieferung werden nur simuliert.") + "</aside></div>";
      return html;
    }
  };

  A.adresseEingabe = (el) => { bestellForm.adresse = el.value; };
  A.bestellTag = (el) => { bestellForm.tag = el.dataset.wert; MB.app.zeichnen(); };
  A.bestellZeit = (el) => { bestellForm.zeit = el.dataset.wert; MB.app.zeichnen(); };
  A.bestellZahlung = (el) => { bestellForm.zahlung = el.dataset.wert; MB.app.zeichnen(); };
  A.bestellungAbsenden = () => {
    const adresse = (bestellForm.adresse || "").trim();
    if (adresse.length < 5) {
      document.getElementById("bestell-fehler").textContent = "Bitte gib eine Lieferadresse ein.";
      document.getElementById("adresse").focus();
      return;
    }
    const k = S.z.warenkorb;
    const r = R.einzelBestellung(k);
    const b = {
      id: "E" + MB.id.zufall(6), typ: "einzel", datum: MB.datum.heute(), lieferdatum: bestellForm.tag,
      zeitfenster: bestellForm.zeit, adresse: adresse, zahlung: bestellForm.zahlung,
      positionen: Object.assign({}, k), warenwert: r.warenwert, lieferung: r.lieferung, gesamt: r.gesamt, punkte: r.punkte
    };
    S.z.bestellungen.unshift(b);
    S.z.letzteAdresse = adresse;
    S.z.warenkorb = {};
    S.punkteBuchen(r.punkte, "Bestellung " + b.id);
    S.speichern();
    MB.app.gehe("#/bestellt/" + b.id);
  };

  /* ---------------------------------------------------------------
     BESTÄTIGUNG
     --------------------------------------------------------------- */
  MB.seiten.bestellt = {
    titel: "Bestellt",
    tab: "sortiment",
    render: function (param) {
      const b = S.z.bestellungen.find((x) => x.id === param[0]);
      if (!b) return ui.kopf("Bestellung", { zurueck: "#/start" }) + '<p class="leer">Bestellung nicht gefunden.</p>';
      return '<section class="erfolg">' +
        '<div class="erfolg-haken">' + icon("check") + "</div>" +
        "<h1>Danke für deine Bestellung!</h1>" +
        "<p>Wir liefern am <b>" + F.datumLang(b.lieferdatum) + "</b> zwischen " + esc(b.zeitfenster) + ".</p>" +
        '<p class="etikett ok">+ ' + b.punkte + " Punkte gutgeschrieben</p>" +
        '<div class="karte-box links">' + positionsListe(b.positionen, false) +
        '<dl class="summen"><div class="gesamt"><dt>Gesamt (' + esc(b.zahlung) + ")</dt><dd>" + F.euro(b.gesamt) + "</dd></div></dl>" +
        '<p class="leise">Bestellnummer ' + b.id + "</p></div>" +
        ui.simulation("Simulation: Es wurde nichts bezahlt und es wird nichts geliefert.") +
        '<div class="knopf-reihe"><a class="knopf" href="#/start">Zur Startseite</a><a class="knopf zweit" href="#/bestellungen">Meine Bestellungen</a></div>' +
        "</section>";
    }
  };

  /* ---------------------------------------------------------------
     BESTELLUNGEN (Einzel, Abo, Laden)
     --------------------------------------------------------------- */
  function status(b) {
    if (b.typ === "laden") return { text: "Im Laden gekauft", klasse: "ok" };
    const h = MB.datum.heute();
    if (b.lieferdatum < h) return { text: "Geliefert", klasse: "ok" };
    if (b.lieferdatum === h) return { text: "Heute unterwegs", klasse: "warn" };
    return { text: "Bestätigt", klasse: "" };
  }

  function bestellZeile(b) {
    const st = status(b);
    const titel = b.typ === "abo" ? "Abo-Lieferung" : b.typ === "laden" ? "Einkauf im Getränkeladen" : "Bestellung " + b.id;
    const flaschen = b.positionen ? Object.keys(b.positionen).reduce((s, a) => s + b.positionen[a], 0) : 0;
    const wann = b.typ === "laden" ? F.datumVoll(b.datum) : "Lieferung " + F.datumKurz(b.lieferdatum) + ", " + b.zeitfenster;
    return '<div class="bestell-zeile"><span class="bz-icon">' + icon(b.typ === "abo" ? "abo" : b.typ === "laden" ? "kasse" : "lkw") + "</span>" +
      '<span class="bz-text"><b>' + esc(titel) + "</b><small>" + esc(wann) + (flaschen ? " · " + flaschen + " Flaschen" : "") + "</small></span>" +
      '<span class="bz-rechts"><b>' + F.euro(b.gesamt) + '</b><span class="etikett ' + st.klasse + '">' + st.text + "</span></span></div>";
  }

  MB.seiten.bestellungen = {
    titel: "Bestellungen",
    tab: "profil",
    render: function () {
      let html = ui.kopf("Meine Bestellungen", { zurueck: "#/profil" });
      const liste = S.z.bestellungen;
      if (!liste.length) return html + '<p class="leer">Noch keine Bestellungen. <a href="#/sortiment">Jetzt stöbern</a></p>';
      return html + '<div class="liste">' + liste.map(bestellZeile).join("") + "</div>" +
        '<p class="kleingedruckt">Alle Bestellungen und Lieferungen sind simuliert.</p>';
    }
  };

  MB.shop = { bestellZeile: bestellZeile, positionsListe: positionsListe };
})();
