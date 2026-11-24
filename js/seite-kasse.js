/* =====================================================================
   SEITE: Kassen-Ansicht (Getränkeladen) – für ein zweites Gerät
   ---------------------------------------------------------------------
   1. Kundenkarte scannen  2. Einkauf erfassen, Coupons werden verrechnet
   3. Bezahlen (simuliert)  4. Bon-QR anzeigen – den scannt die Kundin
   bzw. der Kunde mit der App, um Punkte zu bekommen.
   Die Kassen-Ansicht speichert nichts dauerhaft.
   ===================================================================== */

(function () {
  const S = MB.speicher, R = MB.rechnen, F = MB.fmt, D = MB.daten, ui = MB.ui, A = MB.aktionen;

  const kasse = { schritt: "start", kunde: null, positionen: {}, bon: null, linie: "bier", groesse: "05" };

  function neu() {
    kasse.schritt = "start"; kasse.kunde = null; kasse.positionen = {}; kasse.bon = null;
  }

  function kopf() {
    return '<header class="kasse-kopf">' + logoSVG() +
      "<div><b>MaschBrau Kasse</b><small>Getränkeladen · Demo</small></div>" +
      '<a class="knopf zweit klein" href="' + (S.z.konto ? "#/start" : "#/willkommen") + '">Zur Kunden-App</a></header>';
  }

  /* ---------------- Schritt 1: Start ---------------- */
  function start() {
    return '<section class="kasse-start">' +
      '<div class="kasse-start-icon">' + icon("scan") + "</div>" +
      "<h1>Kundenkarte scannen</h1>" +
      "<p>Die Kundin oder der Kunde zeigt den QR-Code aus der MaschBrau-App (Tab „Karte“). Aktivierte Coupons werden automatisch verrechnet.</p>" +
      '<button class="knopf gross" data-aktion="kasseScannen">' + icon("scan") + " Kundenkarte scannen</button>" +
      '<button class="knopf zweit" data-aktion="kasseOhneKarte">Ohne Kundenkarte kassieren</button>' +
      '<p class="kleingedruckt">Kassen-Ansicht zur Vorführung auf einem zweiten Gerät. Fiktives Studienprojekt – es wird nichts bezahlt.</p>' +
      "</section>";
  }

  /* ---------------- Schritt 2: Einkauf ---------------- */
  function einkauf() {
    const r = R.kassenRechnung(kasse.positionen, kasse.kunde ? kasse.kunde.coupons : []);
    let html = '<div class="kasse-raster">';

    // Artikel-Auswahl
    html += '<section class="kasse-artikel"><div class="kasse-filter">' +
      ui.chips("kasseLinie", Object.keys(D.linien).map((l) => ({ wert: l, text: D.linien[l].name })), kasse.linie, { label: "Produktlinie" }) +
      ui.chips("kasseGroesse", [{ wert: "05", text: "0,5 l" }, { wert: "033", text: "0,33 l" }], kasse.groesse, { klasse: "segment", label: "Größe" }) +
      '</div><div class="kasse-kacheln">';
    D.produkte.filter((p) => p.linie === kasse.linie).forEach((p) => {
      const aid = p.id + "-" + kasse.groesse;
      const m = kasse.positionen[aid] || 0;
      html += '<div class="kasse-kachel' + (m ? " gewaehlt" : "") + '" style="--akzent:' + p.farbe + '">' +
        '<button class="kk-haupt" data-aktion="kasseArtikel" data-artikel="' + aid + '" data-anzahl="1">' +
        '<span class="pos-bild">' + produktSVG(p, kasse.groesse) + "</span>" +
        "<span><b>" + esc(p.name) + "</b><small>" + D.groessen[kasse.groesse].name + " · " + F.euro(p.preis[kasse.groesse]) + "</small></span>" +
        (m ? '<b class="zahl-badge">' + m + "</b>" : "") + "</button>" +
        '<button class="kk-kasten" data-aktion="kasseArtikel" data-artikel="' + aid + '" data-anzahl="' + D.groessen[kasse.groesse].proKasten + '">+ Kasten</button></div>';
    });
    html += "</div></section>";

    // Bon
    html += '<aside class="kasse-bon karte-box">';
    html += kasse.kunde
      ? '<div class="kasse-kunde">' + icon("profil") + "<div><b>" + esc(kasse.kunde.name) + "</b><small>Kundenkarte " + esc(kasse.kunde.kundennr) + "</small></div></div>"
      : '<div class="kasse-kunde leise">' + icon("profil") + "<div><b>Ohne Kundenkarte</b><small>keine Coupons, keine Punkte</small></div></div>";

    const pos = Object.keys(kasse.positionen);
    if (!pos.length) html += '<p class="leer">Artikel links antippen, um sie zu erfassen.</p>';
    html += '<ul class="bon-liste">' + pos.map((aid) => {
      const a = R.artikel(aid);
      return "<li><span>" + esc(a.name) + "<small>" + kasse.positionen[aid] + " × " + F.euro(a.preis) + "</small></span>" +
        ui.stepper("kasseMinus", "kassePlus", kasse.positionen[aid], { artikel: aid }, { klein: true }) +
        "<b>" + F.euro(a.preis * kasse.positionen[aid]) + "</b></li>";
    }).join("") + "</ul>";

    if (kasse.kunde && kasse.kunde.coupons.length) {
      html += '<h3 class="bon-titel">Coupons</h3><ul class="bon-coupons">' + r.zeilen.map((z) =>
        '<li class="' + (z.ersparnis || (z.punkte && r.gesamt) ? "greift" : "") + '"><span>' + esc(z.coupon.titel) +
        (z.grund ? "<small>" + esc(z.grund) + "</small>" : "") + "</span><b>" +
        (z.punkte ? "×" + z.coupon.wert + " Punkte" : z.ersparnis ? "−" + F.euro(z.ersparnis) : "–") + "</b></li>").join("") + "</ul>";
    } else if (kasse.kunde) {
      html += '<p class="leise">Keine Coupons aktiviert.</p>';
    }

    html += '<dl class="summen"><div><dt>Zwischensumme (' + r.flaschen + " Fl.)</dt><dd>" + F.euro(r.warenwert) + "</dd></div>" +
      (r.rabatt ? "<div><dt>Coupon-Rabatt</dt><dd>−" + F.euro(r.rabatt) + "</dd></div>" : "") +
      '<div class="gesamt"><dt>Zu zahlen</dt><dd>' + F.euro(r.gesamt) + "</dd></div></dl>";
    if (kasse.kunde) html += '<p class="leise">+ ' + r.punkte + " Punkte auf die Kundenkarte</p>";
    html += '<button class="knopf gross" data-aktion="kasseBezahlen"' + (r.flaschen ? "" : " disabled") + ">Bezahlt (Simulation) · " + F.euro(r.gesamt) + "</button>" +
      '<button class="knopf zweit" data-aktion="kasseAbbrechen">Abbrechen</button>';
    html += "</aside></div>";
    return html;
  }

  /* ---------------- Schritt 3: Bon ---------------- */
  function bon() {
    const b = kasse.bon;
    let html = '<section class="kasse-fertig"><div class="karte-box bon-papier">' +
      '<p class="bon-firma">MASCHBRAU · Getränkeladen</p><p class="leise">Bon ' + b.id + " · " + F.datumVoll(b.datum) + "</p>" +
      '<ul class="bon-liste nur-lesen">' + Object.keys(b.positionen).map((aid) => {
        const a = R.artikel(aid);
        return "<li><span>" + b.positionen[aid] + " × " + esc(a.name) + "</span><b>" + F.euro(a.preis * b.positionen[aid]) + "</b></li>";
      }).join("") + "</ul>" +
      b.rechnung.zeilen.filter((z) => z.ersparnis).map((z) => '<p class="bon-rabatt"><span>' + esc(z.coupon.titel) + "</span><b>−" + F.euro(z.ersparnis) + "</b></p>").join("") +
      '<p class="bon-summe"><span>Summe</span><b>' + F.euro(b.gesamt) + "</b></p>" +
      '<p class="leise">Fiktiver Beleg – es wurde nichts bezahlt.</p></div>';
    if (b.kundennr) {
      html += '<div class="karte-box bon-qr-box"><h2>Punkte sammeln</h2>' +
        '<div class="bon-qr">' + MB.qr.svg(R.bonCode(b), "QR-Code des Kassenbons") + '<span class="demo-marke">DEMO</span></div>' +
        "<p><b>+ " + b.punkte + " Punkte</b>" + (b.coupons.length ? " · " + b.coupons.length + " Coupon" + (b.coupons.length === 1 ? "" : "s") + " eingelöst" : "") + "</p>" +
        '<p class="leise">In der MaschBrau-App unter <b>Karte → Kassenbon scannen</b> diesen Code scannen.</p></div>';
    }
    html += '<button class="knopf gross" data-aktion="kasseNeu">Nächster Einkauf</button></section>';
    return html;
  }

  MB.seiten.kasse = {
    titel: "Kasse",
    ohneNavi: true,
    render: function () {
      return '<div class="kasse">' + kopf() +
        (kasse.schritt === "einkauf" ? einkauf() : kasse.schritt === "bon" ? bon() : start()) + "</div>";
    }
  };

  /* ---------------- Aktionen ---------------- */
  A.kasseScannen = () => {
    MB.qr.scannen({
      titel: "Kundenkarte scannen",
      hinweis: "Den QR-Code aus der MaschBrau-App scannen.",
      pruefen: (text) => {
        const c = R.codeLesen(text);
        if (!c) return "Das ist kein MaschBrau-Code.";
        if (c.art !== "karte") return "Das ist ein Kassenbon – bitte die Kundenkarte scannen.";
        return "";
      },
      fertig: (text) => {
        const c = R.codeLesen(text);
        kasse.kunde = { name: c.name, kundennr: c.kundennr, coupons: c.coupons.filter((id) => R.couponDef(id)) };
        kasse.schritt = "einkauf";
        MB.app.zeichnen(true);
        ui.toast("Kundenkarte erkannt: " + c.name + (kasse.kunde.coupons.length ? " · " + kasse.kunde.coupons.length + " Coupons" : ""));
      }
    });
  };
  A.kasseOhneKarte = () => { kasse.kunde = null; kasse.schritt = "einkauf"; MB.app.zeichnen(true); };
  A.kasseLinie = (el) => { kasse.linie = el.dataset.wert; MB.app.zeichnen(); };
  A.kasseGroesse = (el) => { kasse.groesse = el.dataset.wert; MB.app.zeichnen(); };
  A.kasseArtikel = (el) => {
    kasse.positionen[el.dataset.artikel] = (kasse.positionen[el.dataset.artikel] || 0) + (+el.dataset.anzahl || 1);
    MB.app.zeichnen();
  };
  A.kassePlus = (el) => { kasse.positionen[el.dataset.artikel]++; MB.app.zeichnen(); };
  A.kasseMinus = (el) => {
    const a = el.dataset.artikel;
    kasse.positionen[a]--;
    if (kasse.positionen[a] <= 0) delete kasse.positionen[a];
    MB.app.zeichnen();
  };
  A.kasseAbbrechen = () => {
    ui.frage("Einkauf abbrechen?", "Alle erfassten Artikel werden verworfen.", "Abbrechen", true).then((ja) => { if (ja) { neu(); MB.app.zeichnen(true); } });
  };
  A.kasseBezahlen = () => {
    const r = R.kassenRechnung(kasse.positionen, kasse.kunde ? kasse.kunde.coupons : []);
    kasse.bon = {
      id: MB.id.zufall(8), datum: MB.datum.heute(),
      kundennr: kasse.kunde ? kasse.kunde.kundennr.replace(/\D/g, "") : "",
      gesamt: r.gesamt, punkte: kasse.kunde ? r.punkte : 0, coupons: kasse.kunde ? r.eingeloest : [],
      positionen: Object.assign({}, kasse.positionen), rechnung: r
    };
    kasse.schritt = "bon";
    MB.app.zeichnen(true);
  };
  A.kasseNeu = () => { neu(); MB.app.zeichnen(true); };
})();
